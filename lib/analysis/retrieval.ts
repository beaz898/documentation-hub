import { queryVectors, buildCorpusFilter } from '@/lib/pinecone/vectors';
import { generateEmbeddings } from '@/lib/embeddings';
import { runInBatches } from '@/lib/run-in-batches';
import { getChunksForDocuments } from '@/lib/read-chunks';
import { normalize } from './judge';
import type { CandidateDocument, DocumentFragment, PipelineOptions } from './types';
import type { StoredChunk } from '@/lib/read-chunks';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Etapa 1 — Retrieval amplio.
 *
 * Los dos modos consultan Pinecone en paralelo por lotes de QUERY_BATCH_SIZE
 * (F-31 P1): la secuencialidad que tenía el modo rápido era residuo de cuando
 * manejaba pocos candidatos, no una protección deliberada — no había ningún
 * manejo de 429 detrás que la necesitara, y el exhaustivo ya paraleliza igual
 * en producción sin incidentes. Una sola vía de código para los dos modos.
 *
 * Modo rápido: umbral SCORE_THRESHOLD_QUICK, presupuesto de caracteres por
 *   documento (FRAGMENT_BUDGET_CHARS_QUICK, tope MAX_FRAGMENTS_PER_DOC_QUICK),
 *   repartido por UNIDADES (F-41, ver más abajo).
 * Modo exhaustivo: umbral SCORE_THRESHOLD_EXHAUSTIVE (más bajo — el rerank
 *   filtra el ruido), TODOS los fragmentos únicos — el reparto por unidades
 *   no se aplica aquí: no hay recorte que repartir.
 *
 * REPARTO POR UNIDADES (F-41, primera mitad): medido que los scores de filas
 * de una misma tabla son ruido — 17 fragmentos de RRHH-06 en dos centésimas,
 * cuatro empatados al milésimo — así que seleccionar filas sueltas por score
 * es echar a suertes cuáles ve el juez. La unidad de selección deja de ser el
 * fragmento y pasa a ser la TABLA (todas sus filas recuperadas más su
 * table_summary, agrupadas por tableId) o el fragmento de prosa suelto
 * (chunkType 'text'). Las unidades se ordenan por su mejor score y entran
 * ENTERAS hasta agotar el presupuesto — nunca una fila individual compite
 * contra otra fila de su misma tabla.
 *
 * Una tabla que entra tiene tres representaciones en cascada, y el log
 * siempre dice cuál:
 *   Nivel 1 — completa: todas sus filas (las recuperadas por Pinecone Y las
 *     que no, leídas de document_chunks) más su table_summary, si caben.
 *   Nivel 2 — table_summary + las filas RECUPERADAS que quepan en lo que
 *     quede de presupuesto tras el resumen.
 *   Nivel 3 — solo table_summary.
 * El table_summary de una tabla que entra NUNCA compite por espacio ni por
 * score: entra siempre con su tabla, en los tres niveles. Su texto real dice
 * cuántas filas tiene la tabla y qué columnas — es lo único que le dice al
 * juez que está viendo una parte cuando el nivel es 2 o 3; sin este resumen
 * "honesto siempre incluido", nada distingue una tabla completa de un
 * fragmento de ella.
 *
 * DE DÓNDE SALE chunkType/tableId: retrieval no lo sabe por Pinecone (su
 * metadata no lo lleva). Se lee de document_chunks con getChunksForDocuments
 * (lib/read-chunks.ts) — la misma función que pipeline.ts ya usaba para F-27,
 * no una consulta nueva ni loadFragmentContexts: su forma de salida
 * (Map<documentId, StoredChunk[]>, TODOS los chunks del documento) es la que
 * hace falta aquí, porque de paso trae cada fila de cada tabla sin necesitar
 * una consulta aparte por document_id+table_id para el nivel 1 — el diseño
 * original preveía esa consulta adicional, pero al necesitar el documento
 * completo solo para clasificar cada fragmento recuperado, las filas del
 * nivel 1 ya llegan gratis en la misma lectura. loadFragmentContexts no
 * sirve: solo expone un chunk por posición EXACTA pedida (para contexto y
 * vecinos), sin agrupar por tabla — usarla habría exigido reconstruirla por
 * dentro para un caso que no es el suyo.
 *
 * SIN CONSULTA DUPLICADA: pipeline.ts volvía a llamar a getChunksForDocuments
 * más tarde (F-27, sobre los candidatos ya rerankeados) para el haystack de
 * verificación de citas. Como los rerankeados son siempre un subconjunto de
 * los candidatos de aquí, ese segundo `getChunksForDocuments` deja de hacer
 * falta — pipeline.ts reutiliza el mapa que devuelve `retrieveCandidates`.
 */

/** Tamaño del lote de queries paralelas a Pinecone. */
const QUERY_BATCH_SIZE = 5;

/**
 * Presupuesto de contenido por documento candidato en modo rápido.
 * Antes se recortaba a un número fijo de fragmentos, lo que penalizaba a los
 * documentos troceados en piezas pequeñas (una fila de hoja de cálculo es un
 * fragmento) frente a los troceados en secciones largas. Se mide contenido,
 * no piezas.
 */
const FRAGMENT_BUDGET_CHARS_QUICK = 3000;

/**
 * Red de seguridad: un documento con miles de fragmentos diminutos no debe
 * inundar el juicio aunque quepa en el presupuesto.
 */
const MAX_FRAGMENTS_PER_DOC_QUICK = 25;

/** Umbral mínimo de similitud.
 *  Rápido: 0.50 — calibrado para chunks de ~500 caracteres tras el troceado
 *  por sección (chunking.ts): con chunks más pequeños y concretos, el score
 *  de similitud de cada uno es naturalmente más bajo que con los chunks de
 *  ~2000 caracteres de antes, así que el umbral bajó en la misma calibración.
 *  No subir a ciegas sin volver a medir con el troceado actual.
 *  Exhaustivo: 0.45 (más permisivo — el rerank filtra el ruido temático). */
const SCORE_THRESHOLD_QUICK = 0.50;
const SCORE_THRESHOLD_EXHAUSTIVE = 0.45;

export async function retrieveCandidates(args: {
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
  batchDocumentIds?: string[];
  options?: PipelineOptions;
  supabase: SupabaseClient;
  /** Chunks del documento ANALIZADO (F-41), en su forma persistida — el mismo
   *  array que ya recibe runCorePipeline como input.newDocumentChunks para
   *  F-27/F-24. Aquí solo se usa para indexar sus valores por columna; no se
   *  lee nada de Supabase por esto, el dato ya viaja cargado. */
  newDocumentChunks?: StoredChunk[];
}): Promise<{
  candidates: CandidateDocument[];
  chunksByDocument: Map<string, StoredChunk[]>;
  /** F-45: colapsos de filas idénticas por documento candidato — vacío si el
   *  candidato no tuvo ninguna tabla colapsada (el caso normal). Solo se
   *  llena en modo rápido: el exhaustivo nunca pasa por selectUnitsWithinBudget
   *  (sin recorte, no hay nada que colapsar). */
  structuralOverlaps: Map<string, StructuralOverlap[]>;
}> {
  const { sampleTexts, orgId, excludeDocumentId, batchDocumentIds, options, supabase, newDocumentChunks } = args;
  const isExhaustive = options?.exhaustive === true;

  // F-42: índice de VALORES (normalizados) del documento analizado, por
  // columna (normalizada) — no de nombres de columna sueltos (F-41 medía eso
  // y no discriminaba: 15/15 filas de una tabla real compartían columna con
  // cualquier otra tabla de personas). Una sola pasada sobre newDocumentChunks
  // aquí, no por candidato; cada fila candidata consulta el Set de su columna
  // — lineal, no producto cartesiano (medido: <1ms para 108 filas). Se
  // indexan TODAS las columnas del analizado sin restringir a "compartidas":
  // una columna que ningún candidato tenga nunca se consulta, así que
  // restringir de antemano no cambiaría el resultado y evitaría tener que
  // recalcular qué es "compartido" por candidato. Comparación ESTRUCTURAL,
  // igualdad exacta tras normalize — nunca semántica (B.95: "Puesto" con
  // "Implantólogo" no cruza con "Implantólogo / Cirujano oral", y es
  // deliberado: son valores distintos, no el mismo dato mal escrito).
  const analyzedValueIndex = new Map<string, Set<string>>();
  for (const c of newDocumentChunks ?? []) {
    if (!c.cells) continue;
    for (const [column, value] of Object.entries(c.cells)) {
      const normCol = normalize(column);
      const set = analyzedValueIndex.get(normCol) ?? new Set<string>();
      set.add(normalize(value));
      analyzedValueIndex.set(normCol, set);
    }
  }
  // F-43/F-44: filas reales del analizado (no solo el índice de valores) —
  // hace falta para "idéntica" en el sentido estricto: que TODAS las columnas
  // compartidas coincidan con LA MISMA fila del analizado, no con filas
  // distintas que cada una casualmente comparte una columna. El índice de
  // valores (arriba) no distingue eso — es un cruce por columna, independiente
  // fila a fila del lado analizado.
  const analyzedRows = (newDocumentChunks ?? []).filter(c => c.chunkType === 'table_row');

  const embeddings = await generateEmbeddings(sampleTexts);
  const scoreThreshold = isExhaustive ? SCORE_THRESHOLD_EXHAUSTIVE : SCORE_THRESHOLD_QUICK;
  const corpusFilter = buildCorpusFilter(batchDocumentIds);

  // Recoger todos los matches de Pinecone. Paralelo por lotes en los dos
  // modos (F-31 P1) — sin delayMs: aquí se paraleliza contra Pinecone, no
  // contra un LLM con límite de peticiones.
  const allMatches: DocumentFragment[] = [];
  // F-40: agregado, no por match — collectMatches se llama una vez POR
  // CONSULTA (una por sampleText, no por lote de QUERY_BATCH_SIZE), y cada
  // una trae hasta topK=25 matches crudos. Loggear cada descarte individual
  // podría ser cientos de líneas por análisis en un corpus real; el recuento
  // por documento basta para saber si un score ronda el umbral.
  const discardedByThreshold = new Map<string, { count: number; maxScore: number }>();
  const batchResults = await runInBatches(
    embeddings,
    emb => queryVectors(orgId, { vector: emb, topK: 25, includeMetadata: true, filter: corpusFilter }),
    { batchSize: QUERY_BATCH_SIZE },
  );
  for (const matches of batchResults) {
    collectMatches(matches as Array<{ metadata?: Record<string, unknown>; score?: number }>, allMatches, scoreThreshold, excludeDocumentId, discardedByThreshold);
  }
  for (const [docName, stats] of discardedByThreshold) {
    console.log(`[retrieval] Descartados por umbral (${scoreThreshold}) en "${docName}": ${stats.count}, score máximo: ${stats.maxScore.toFixed(3)}`);
  }

  // Agrupar por documento y deduplicar chunks
  const byDoc = new Map<string, DocumentFragment[]>();
  for (const f of allMatches) {
    const arr = byDoc.get(f.documentId) ?? [];
    arr.push(f);
    byDoc.set(f.documentId, arr);
  }

  // F-41: chunkType/tableId de cada fragmento, y las filas de tabla completas
  // para el nivel 1 — en los DOS modos, aunque el reparto por unidades solo
  // se use en rápido: pipeline.ts reutiliza este mismo mapa más tarde para
  // F-27 (ver cabecera del fichero), así que se pide siempre.
  const documentIds = [...byDoc.keys()];
  const chunksByDocument = await getChunksForDocuments(supabase, {
    orgId,
    documents: documentIds.map(documentId => ({
      documentId,
      generation: byDoc.get(documentId)?.[0]?.generation ?? 1,
    })),
  });

  const candidates: CandidateDocument[] = [];
  const structuralOverlapsByDocument = new Map<string, StructuralOverlap[]>();
  for (const [documentId, frags] of byDoc) {
    const unique = deduplicateFragments(frags);
    const sorted = unique.sort((a, b) => b.score - a.score);

    console.log(
      `[retrieval] "${sorted[0].documentName}": ${unique.length} fragmentos únicos — ` +
      sorted.map(f => `${f.chunkIndex}=${f.score.toFixed(3)}`).join(', ')
    );

    let selected: DocumentFragment[];
    if (isExhaustive) {
      // Exhaustivo: todos los fragmentos únicos, sin recorte ni reparto.
      selected = sorted;
    } else {
      const docChunks = chunksByDocument.get(documentId) ?? [];

      // F-42: dos números distintos, no uno — "la regla no aplicó" (ningún
      // cruce, el orden queda igual que por score puro) es un caso diferente
      // de "aplicó y ordenó" (hay cruces, alguna fila se antepuso). Sobre
      // unit.recoveredRows de todas las tablas del candidato — el mismo
      // conjunto que compite dentro del nivel 2, no todas las filas de la
      // tabla (las no recuperadas por Pinecone no compiten por espacio).
      const units = buildUnits(sorted, docChunks);
      let rowsWithCrossing = 0;
      let rowsWithoutCrossing = 0;
      for (const unit of units) {
        if (unit.kind !== 'table') continue;
        for (const rowFragment of unit.recoveredRows) {
          const crossings = countCrossings(rowFragment, docChunks, analyzedValueIndex);
          if (crossings > 0) rowsWithCrossing++;
          else rowsWithoutCrossing++;
        }
      }
      if (rowsWithCrossing + rowsWithoutCrossing > 0) {
        console.log(
          rowsWithCrossing === 0
            ? `[retrieval] "${sorted[0].documentName}" pertenencia: 0 cruces, orden por score`
            : `[retrieval] "${sorted[0].documentName}" pertenencia: ${rowsWithCrossing} filas con cruce, ${rowsWithoutCrossing} sin`
        );
      }

      const result = selectUnitsWithinBudget(units, docChunks, sorted[0], analyzedValueIndex, analyzedRows);
      selected = result.selected;
      if (result.structuralOverlaps.length > 0) {
        structuralOverlapsByDocument.set(documentId, result.structuralOverlaps);
      }

      const usedChars = selected.reduce((sum, f) => sum + f.text.length, 0);
      for (const t of result.tableLog) {
        const colapsoDesc = t.collapsedCount > 0 ? `, ${t.collapsedCount} colapsadas en 1 línea` : '';
        const levelDesc =
          t.level === 1 ? `completa, ${t.rowsUsed} filas`
          : t.level === 2 ? `resumen + ${t.rowsUsed}/${t.rowsTotal} filas, ${t.belongingUsed} por pertenencia${colapsoDesc}`
          : t.level === 3 ? 'solo resumen'
          : 'fila única sin resumen (caso raro)';
        console.log(`[retrieval] "${sorted[0].documentName}" tabla "${t.sheetName ?? t.tableId}": nivel ${t.level} (${levelDesc}, ${t.chars} chars)`);
      }
      console.log(
        `[retrieval] "${sorted[0].documentName}" unidades: ${result.unitsIn} dentro, ${result.unitsOut} fuera, ` +
        `${usedChars}/${FRAGMENT_BUDGET_CHARS_QUICK} caracteres`
      );
    }

    candidates.push({
      documentId,
      documentName: selected[0].documentName,
      source: selected[0].source,
      fragments: selected,
      maxScore: selected[0].score,
    });
  }

  // Hasta 25 candidatos hacia el rerank
  return {
    candidates: candidates.sort((a, b) => b.maxScore - a.maxScore).slice(0, 25),
    chunksByDocument,
    structuralOverlaps: structuralOverlapsByDocument,
  };
}

// ============================================================
// Helpers internos
// ============================================================

/** Extrae DocumentFragments válidos de los matches de Pinecone. */
function collectMatches(
  matches: Array<{ metadata?: Record<string, unknown>; score?: number }> | undefined,
  out: DocumentFragment[],
  scoreThreshold: number,
  excludeDocumentId: string | undefined,
  discardedByThreshold: Map<string, { count: number; maxScore: number }>,
): void {
  for (const m of matches || []) {
    if (!m.metadata || typeof m.score !== 'number') continue;
    if (m.score < scoreThreshold) {
      const rawName = m.metadata.documentName;
      const docName = typeof rawName === 'string' ? rawName : '(sin nombre)';
      const stats = discardedByThreshold.get(docName) ?? { count: 0, maxScore: -Infinity };
      stats.count++;
      if (m.score > stats.maxScore) stats.maxScore = m.score;
      discardedByThreshold.set(docName, stats);
      continue;
    }
    const meta = m.metadata as {
      documentId?: string; documentName?: string;
      source?: string; chunkIndex?: number; text?: string;
      generation?: number;
    };
    if (!meta.documentId || !meta.documentName || !meta.text) continue;
    if (excludeDocumentId && meta.documentId === excludeDocumentId) continue;

    out.push({
      text: meta.text,
      documentId: meta.documentId,
      documentName: meta.documentName,
      source: meta.source === 'google_drive' ? 'google_drive' : 'manual',
      score: m.score,
      chunkIndex: meta.chunkIndex ?? 0,
      // C.4b escribe `generation` en la metadata de todos los vectores desde
      // hace varias fases, pero hasta ahora nadie la leía. Sin ella no se puede
      // localizar el chunk correcto en document_chunks: los chunks de
      // generaciones distintas del mismo documento comparten chunk_index.
      // Ausente = g1 implícita, igual que en parseVectorId.
      generation: meta.generation ?? 1,
    });
  }
}

/** Elimina fragmentos del mismo chunk (pueden aparecer si distintos embeddings los recuperan). */
function deduplicateFragments(frags: DocumentFragment[]): DocumentFragment[] {
  const seen = new Set<string>();
  const out: DocumentFragment[] = [];
  for (const f of frags) {
    const key = `${f.documentId}-${f.chunkIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

// ============================================================
// Reparto por unidades (F-41)
// ============================================================

interface TableUnit {
  kind: 'table';
  tableId: string;
  sheetName: string | null;
  /** Mejor score entre sus filas recuperadas y su table_summary, si éste
   *  también fue recuperado por Pinecone. */
  score: number;
  /** Filas de la tabla que Pinecone SÍ devolvió, en el mismo orden relativo
   *  (por score) que `sorted` — no se reordenan al agruparlas. */
  recoveredRows: DocumentFragment[];
}

interface ProseUnit {
  kind: 'prose';
  score: number;
  fragment: DocumentFragment;
}

type Unit = TableUnit | ProseUnit;

/**
 * Agrupa los fragmentos recuperados (ya ordenados por score) en unidades:
 * una por tabla (por tableId, agrupando filas y table_summary si Pinecone
 * los devolvió) y una por cada fragmento de prosa suelto. Un fragmento cuyo
 * chunk no se pudo localizar en docChunks (documento sin persistir en F-20,
 * o cualquier otro motivo) se trata como prosa — es exactamente el
 * comportamiento de antes de este commit para ese caso, sin reparto posible
 * porque no hay dato de tabla que agrupar.
 */
function buildUnits(sortedFragments: DocumentFragment[], docChunks: StoredChunk[]): Unit[] {
  const chunkByIndex = new Map<number, StoredChunk>();
  for (const c of docChunks) chunkByIndex.set(c.chunkIndex, c);

  const tableUnits = new Map<string, TableUnit>();
  const units: Unit[] = [];

  for (const f of sortedFragments) {
    const stored = chunkByIndex.get(f.chunkIndex);
    if (stored?.tableId && (stored.chunkType === 'table_row' || stored.chunkType === 'table_summary')) {
      let unit = tableUnits.get(stored.tableId);
      if (!unit) {
        unit = { kind: 'table', tableId: stored.tableId, sheetName: stored.sheetName, score: f.score, recoveredRows: [] };
        tableUnits.set(stored.tableId, unit);
        units.push(unit);
      }
      if (f.score > unit.score) unit.score = f.score;
      if (stored.chunkType === 'table_row') unit.recoveredRows.push(f);
      continue;
    }
    units.push({ kind: 'prose', score: f.score, fragment: f });
  }

  return units.sort((a, b) => b.score - a.score);
}

/** Envuelve una fila o un table_summary de document_chunks (StoredChunk) en
 *  la forma DocumentFragment que consumen rerank/judge — copiando
 *  documentId/documentName/source/generation de un fragmento real de ese
 *  mismo documento, porque estos chunks pueden no haber sido "recuperados"
 *  por Pinecone (nivel 1 trae filas que Pinecone no devolvió; el
 *  table_summary puede no haber sido recuperado y aun así entrar siempre). */
function toSyntheticFragment(chunk: StoredChunk, like: DocumentFragment, score: number): DocumentFragment {
  return {
    text: chunk.text,
    documentId: like.documentId,
    documentName: like.documentName,
    source: like.source,
    score,
    chunkIndex: chunk.chunkIndex,
    generation: like.generation,
  };
}

/** Cuántas columnas (compartidas, normalizadas) de una fila del candidato
 *  tienen el MISMO VALOR normalizado que alguna fila del documento analizado
 *  (F-42). Consulta el índice, no recorre las filas del analizado — lineal
 *  por fila del candidato. Igualdad exacta: sin parecido, sin sinónimos. */
function countCrossings(
  rowFragment: DocumentFragment,
  docChunks: StoredChunk[],
  analyzedValueIndex: Map<string, Set<string>>,
): number {
  const stored = docChunks.find(c => c.chunkIndex === rowFragment.chunkIndex);
  if (!stored?.cells) return 0;
  let crossings = 0;
  for (const [column, value] of Object.entries(stored.cells)) {
    const values = analyzedValueIndex.get(normalize(column));
    if (values?.has(normalize(value))) crossings++;
  }
  return crossings;
}

/** Columnas (normalizado -> nombre real, tal como aparece en las cells de
 *  ESTA tabla) que también existen en alguna tabla del documento analizado —
 *  "compartidas" para esta tabla concreta, no para el candidato en conjunto.
 *  El nombre real (no el normalizado) es para mostrarlo en la línea agregada
 *  con su capitalización original. */
function sharedColumnsForTable(
  tableId: string,
  docChunks: StoredChunk[],
  analyzedValueIndex: Map<string, Set<string>>,
): Map<string, string> {
  const shared = new Map<string, string>();
  for (const c of docChunks) {
    if (c.tableId !== tableId || !c.cells) continue;
    for (const col of Object.keys(c.cells)) {
      const normCol = normalize(col);
      if (analyzedValueIndex.has(normCol) && !shared.has(normCol)) shared.set(normCol, col);
    }
  }
  return shared;
}

/**
 * F-43/F-44: ¿esta fila coincide EXACTAMENTE con ALGUNA fila concreta del
 * documento analizado, en TODAS las columnas compartidas? No es lo mismo que
 * countCrossings > 0 en todas las compartidas de forma independiente — eso
 * admitiría un cruce "Frankenstein" (columna A coincide con la fila X del
 * analizado, columna B con la fila Y). Aquí se exige que sea LA MISMA fila
 * del analizado en las dos, que es lo que de verdad significa "es la misma
 * entidad, no hay contradicción posible sobre estas columnas".
 */
function findIdenticalAnalyzedRow(
  rowChunk: StoredChunk,
  analyzedRows: StoredChunk[],
  sharedColumns: Map<string, string>,
): boolean {
  if (sharedColumns.size === 0 || !rowChunk.cells) return false;
  for (const analyzedRow of analyzedRows) {
    if (!analyzedRow.cells) continue;
    let allMatch = true;
    for (const normCol of sharedColumns.keys()) {
      const candKey = Object.keys(rowChunk.cells).find(k => normalize(k) === normCol);
      const anaKey = Object.keys(analyzedRow.cells).find(k => normalize(k) === normCol);
      const candVal = candKey ? normalize(rowChunk.cells[candKey]) : null;
      const anaVal = anaKey ? normalize(analyzedRow.cells[anaKey]) : null;
      if (candVal === null || anaVal === null || candVal !== anaVal) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

/**
 * F-44: la línea de contexto que colapsa las filas idénticas. `chunkIndex:
 * -1` — centinela negativo, verificado (exploración previa) que todo el
 * camino (loadFragmentContexts, deduplicateFragments, rerank, la cascada)
 * degrada con seguridad ante un valor que ningún chunk real tiene nunca. Si
 * un candidato tuviera más de una tabla colapsando, las dos compartirían el
 * mismo -1: inofensivo, ambas resuelven igual a "sin chunk real" en
 * cualquier lookup por chunkIndex.
 *
 * La etiqueta por fila NO elige una columna como "la identidad" — eso sería
 * la heurística por nombre que F-23/F-26/F-36 prohíben. Muestra el VALOR de
 * TODAS las columnas compartidas, en el orden en que aparecen en la propia
 * fila, separados por " / ". Con Empleado+Puesto da nombres reconocibles
 * ("Nuria Ferrer / Odontopediatra") sin que el código sepa ni necesite saber
 * que "Empleado" identifica a una persona.
 */
function buildContextFragment(
  identicalRows: DocumentFragment[],
  docChunks: StoredChunk[],
  sharedColumns: Map<string, string>,
  like: DocumentFragment,
  score: number,
): { fragment: DocumentFragment; columns: string[]; labels: string[] } {
  const orderedCols = [...sharedColumns.values()];
  const labels = identicalRows
    .slice()
    .sort((a, b) => b.score - a.score)
    .map(f => {
      const stored = docChunks.find(c => c.chunkIndex === f.chunkIndex);
      if (!stored?.cells) return '(?)';
      return orderedCols.map(col => stored.cells![col] ?? '?').join(' / ');
    });
  const text = `[CONTEXTO — no citar: ${identicalRows.length} filas coinciden en ${orderedCols.join(' y ')}: ${labels.join(', ')}]`;
  return {
    fragment: {
      text,
      documentId: like.documentId,
      documentName: like.documentName,
      source: like.source,
      score,
      chunkIndex: -1,
      generation: like.generation,
      isContext: true,
    },
    columns: orderedCols,
    labels,
  };
}

/**
 * F-45: lo que el colapso de filas idénticas (F-44) sabe de UNA tabla, en
 * forma que puede viajar fuera de retrieval.ts — hasta ahora moría entero en
 * los console.log de abajo. `columns`/`labels` son literalmente los mismos
 * datos que ya construye la línea de contexto (buildContextFragment): las
 * columnas compartidas y la etiqueta por fila colapsada, en el mismo orden.
 * Sirve para que la cascada (pipeline.ts) pueda emitir un solapamiento
 * verificado sin depender de que el juez lo cite — el colapso ya verificó
 * celda a celda que esas filas son la misma entidad; no hace falta que un
 * LLM lo redescubra desde un prompt que, por presupuesto, puede no llevarlas.
 */
export interface StructuralOverlap {
  tableId: string;
  sheetName: string | null;
  columns: string[];
  labels: string[];
  collapsedCount: number;
  rowsTotal: number;
}

/**
 * Intenta encajar una tabla en el presupuesto que queda, en cascada:
 *   Nivel 1 — completa (todas sus filas de document_chunks + su
 *     table_summary si existe), si cabe entera. El orden no importa: entra
 *     todo, así que ni la pertenencia ni el colapso tienen nada que decidir.
 *   Nivel 2 — table_summary (no compite, se resta primero) + filas. F-44: las
 *     filas RECUPERADAS se parten primero en IDÉNTICAS (coinciden con una
 *     misma fila del analizado en TODAS las columnas compartidas — no pueden
 *     sustentar contradicción sobre esas columnas, y R2 las descartaría por
 *     sin_columna_comun sobre el resto) y EL RESTO. Las idénticas se
 *     colapsan en una única línea de contexto (buildContextFragment), que
 *     entra primero — son, por definición, el grupo de mayor cruce posible.
 *     El resto entra entera, ordenada por cuántas columnas cruzan VALOR con
 *     el documento analizado (countCrossings, F-42), descendente, score como
 *     desempate — "el score decide entre lo incomparable, la estructura
 *     entre lo comparable". Comparación puramente estructural: igualdad
 *     exacta tras normalizar, sin sinónimos ni distancia de edición (B.95) —
 *     un valor que difiere legítimamente (la propia contradicción que se
 *     busca) cuenta como NO cruce ni como idéntica, a propósito.
 *   Nivel 3 — solo table_summary, si ni las filas caben. Sin filas, tampoco
 *     hay nada que ordenar ni que colapsar.
 * Devuelve null si ni el resumen solo cabe — la tabla no entra en absoluto.
 */
function assembleTable(
  unit: TableUnit,
  docChunks: StoredChunk[],
  like: DocumentFragment,
  remainingBudget: number,
  remainingCount: number,
  analyzedValueIndex: Map<string, Set<string>>,
  analyzedRows: StoredChunk[],
): {
  level: 1 | 2 | 3;
  fragments: DocumentFragment[];
  usedChars: number;
  belongingUsed: number;
  collapsedCount: number;
  /** F-45: solo presente cuando el colapso SÍ entró (la línea agregada cupo
   *  en presupuesto) — no en el caso patológico donde las idénticas vuelven
   *  a competir sueltas, porque ahí no hubo colapso real que reportar. */
  structural?: { columns: string[]; labels: string[]; rowsTotal: number };
} | null {
  const allRowChunks = docChunks
    .filter(c => c.tableId === unit.tableId && c.chunkType === 'table_row')
    .sort((a, b) => a.chunkIndex - b.chunkIndex);
  const summaryChunk = docChunks.find(c => c.tableId === unit.tableId && c.chunkType === 'table_summary') ?? null;
  const summaryFragment = summaryChunk ? toSyntheticFragment(summaryChunk, like, unit.score) : null;
  const summaryChars = summaryFragment?.text.length ?? 0;

  const allRowFragments = allRowChunks.map(c => toSyntheticFragment(c, like, unit.score));
  const level1Chars = allRowFragments.reduce((sum, f) => sum + f.text.length, 0) + summaryChars;
  const level1Count = allRowFragments.length + (summaryFragment ? 1 : 0);

  if (level1Count > 0 && level1Chars <= remainingBudget && level1Count <= remainingCount) {
    return {
      level: 1,
      fragments: summaryFragment ? [...allRowFragments, summaryFragment] : allRowFragments,
      usedChars: level1Chars,
      belongingUsed: 0,
      collapsedCount: 0,
    };
  }

  if (summaryFragment) {
    const budgetForRows = remainingBudget - summaryChars;
    const countForRows = remainingCount - 1;
    if (budgetForRows >= 0 && countForRows >= 0) {
      const sharedCols = sharedColumnsForTable(unit.tableId, docChunks, analyzedValueIndex);
      const crossingsByIndex = new Map<number, number>();
      const identicalRows: DocumentFragment[] = [];
      let restRows: DocumentFragment[] = [];
      for (const rowFragment of unit.recoveredRows) {
        const crossings = countCrossings(rowFragment, docChunks, analyzedValueIndex);
        crossingsByIndex.set(rowFragment.chunkIndex, crossings);
        const stored = docChunks.find(c => c.chunkIndex === rowFragment.chunkIndex);
        const isIdentical = crossings > 0 && stored && findIdenticalAnalyzedRow(stored, analyzedRows, sharedCols);
        if (isIdentical) identicalRows.push(rowFragment);
        else restRows.push(rowFragment);
      }
      const byRestOrder = (a: DocumentFragment, b: DocumentFragment) => {
        const ca = crossingsByIndex.get(a.chunkIndex) ?? 0;
        const cb = crossingsByIndex.get(b.chunkIndex) ?? 0;
        return ca !== cb ? cb - ca : b.score - a.score;
      };
      restRows.sort(byRestOrder);

      const packedRows: DocumentFragment[] = [];
      let usedRowChars = 0;
      let belongingUsed = 0;
      let collapsedCount = 0;
      let structural: { columns: string[]; labels: string[]; rowsTotal: number } | undefined;

      if (identicalRows.length > 0) {
        const aggregated = buildContextFragment(identicalRows, docChunks, sharedCols, like, unit.score);
        if (aggregated.fragment.text.length <= budgetForRows && packedRows.length < countForRows) {
          packedRows.push(aggregated.fragment);
          usedRowChars += aggregated.fragment.text.length;
          collapsedCount = identicalRows.length;
          structural = { columns: aggregated.columns, labels: aggregated.labels, rowsTotal: allRowChunks.length };
        } else {
          // Caso patológico: ni la línea agregada cupo. Las idénticas vuelven
          // a competir como cualquier otra fila, sin colapsar — mejor una
          // fila entera que ninguna. Sin colapso real, no hay dato estructural
          // que reportar (structural queda undefined).
          restRows = [...restRows, ...identicalRows].sort(byRestOrder);
        }
      }

      for (const rowFragment of restRows) {
        if (packedRows.length >= countForRows) break;
        if (usedRowChars + rowFragment.text.length > budgetForRows) continue;
        packedRows.push(rowFragment);
        usedRowChars += rowFragment.text.length;
        if ((crossingsByIndex.get(rowFragment.chunkIndex) ?? 0) > 0) belongingUsed++;
      }
      if (packedRows.length > 0) {
        return { level: 2, fragments: [...packedRows, summaryFragment], usedChars: summaryChars + usedRowChars, belongingUsed, collapsedCount, structural };
      }
    }
    if (summaryChars <= remainingBudget && remainingCount >= 1) {
      return { level: 3, fragments: [summaryFragment], usedChars: summaryChars, belongingUsed: 0, collapsedCount: 0 };
    }
  }

  return null;
}

interface TableLevelLog {
  tableId: string;
  sheetName: string | null;
  /** '3-forzado' (F-43): último recurso cuando la tabla no tiene
   *  table_summary (inalcanzable hoy — toda tabla con tableId lo tiene por
   *  construcción, ver chunking.ts) y ni siquiera su fila más corta cabría
   *  por la vía normal. Entra igual, forzada, como única fila sin resumen —
   *  no es nivel 2 (eso implicaría resumen) ni nivel 3 (eso implicaría CERO
   *  filas): etiquetarlo como cualquiera de los dos habría hecho mentir al
   *  log justo en el caso raro que existe para detectar. */
  level: 1 | 2 | 3 | '3-forzado';
  rowsUsed: number;
  rowsTotal: number;
  /** Solo tiene sentido en nivel 2: de las filas usadas, cuántas entraron
   *  por pertenencia — F-42, cruce de VALOR, no solo de columna — en vez de
   *  por hueco tras agotarse ese grupo. */
  belongingUsed: number;
  /** F-44: filas REALES representadas por la línea de contexto colapsada (0
   *  si no hubo colapso). rowsUsed las incluye — sin esto, rowsUsed contaría
   *  solo las filas que entraron sueltas y parecería que faltan las que en
   *  realidad están, resumidas, en una sola línea. */
  collapsedCount: number;
  chars: number;
}

/**
 * Recorre las unidades en orden de score y las mete enteras hasta agotar
 * presupuesto (3000 caracteres) o tope (25 "piezas": filas + resúmenes +
 * fragmentos de prosa, mismo tope y mismo significado que antes de F-41).
 *
 * Garantía de no devolver la selección vacía (la que ya tenía
 * selectFragmentsWithinBudget): acotada a la primera unidad, y sin forzar
 * nunca una tabla entera por encima del presupuesto — una tabla grande (p.
 * ej. 90 filas) forzada completa desbordaría el presupuesto en un orden de
 * magnitud, no en el margen acotado que la garantía original toleraba para
 * un único fragmento. Por eso una tabla como primera unidad pasa por la
 * cascada normal (1→2→3) igual que cualquier otra: con el presupuesto
 * íntegro de 3000 caracteres por delante, el nivel 3 (solo el resumen, unos
 * pocos cientos de caracteres) cabe prácticamente siempre. Solo si ni eso
 * cupiera se fuerza el resumen solo (o, a falta de resumen, la fila
 * recuperada más corta) como último recurso.
 */
function selectUnitsWithinBudget(
  units: Unit[],
  docChunks: StoredChunk[],
  like: DocumentFragment,
  analyzedValueIndex: Map<string, Set<string>>,
  analyzedRows: StoredChunk[],
): { selected: DocumentFragment[]; tableLog: TableLevelLog[]; unitsIn: number; unitsOut: number; structuralOverlaps: StructuralOverlap[] } {
  const selected: DocumentFragment[] = [];
  const tableLog: TableLevelLog[] = [];
  const structuralOverlaps: StructuralOverlap[] = [];
  let usedChars = 0;
  let unitsIn = 0;

  for (let i = 0; i < units.length; i++) {
    if (selected.length >= MAX_FRAGMENTS_PER_DOC_QUICK) break;
    const unit = units[i];
    const remainingBudget = FRAGMENT_BUDGET_CHARS_QUICK - usedChars;
    const remainingCount = MAX_FRAGMENTS_PER_DOC_QUICK - selected.length;

    if (unit.kind === 'prose') {
      const forceInclude = i === 0 && selected.length === 0;
      if (forceInclude || (unit.fragment.text.length <= remainingBudget && remainingCount >= 1)) {
        selected.push(unit.fragment);
        usedChars += unit.fragment.text.length;
        unitsIn++;
      }
      continue;
    }

    const assembled = assembleTable(unit, docChunks, like, remainingBudget, remainingCount, analyzedValueIndex, analyzedRows);
    if (assembled) {
      selected.push(...assembled.fragments);
      usedChars += assembled.usedChars;
      unitsIn++;
      const rowsTotal = docChunks.filter(c => c.tableId === unit.tableId && c.chunkType === 'table_row').length;
      // F-44: rowsUsed cuenta filas REALES representadas, no fragmentos — la
      // línea agregada es un fragmento pero representa collapsedCount filas.
      const individualRowsUsed = assembled.fragments.filter(f => {
        const stored = docChunks.find(c => c.chunkIndex === f.chunkIndex);
        return stored?.chunkType === 'table_row';
      }).length;
      const rowsUsed = individualRowsUsed + assembled.collapsedCount;
      tableLog.push({
        tableId: unit.tableId,
        sheetName: unit.sheetName,
        level: assembled.level,
        rowsUsed,
        rowsTotal,
        belongingUsed: assembled.belongingUsed,
        collapsedCount: assembled.collapsedCount,
        chars: assembled.usedChars,
      });
      if (assembled.structural) {
        structuralOverlaps.push({
          tableId: unit.tableId,
          sheetName: unit.sheetName,
          columns: assembled.structural.columns,
          labels: assembled.structural.labels,
          collapsedCount: assembled.collapsedCount,
          rowsTotal: assembled.structural.rowsTotal,
        });
      }
      continue;
    }

    if (i === 0 && selected.length === 0) {
      const summaryChunk = docChunks.find(c => c.tableId === unit.tableId && c.chunkType === 'table_summary');
      const rowsTotal = docChunks.filter(c => c.tableId === unit.tableId && c.chunkType === 'table_row').length;
      if (summaryChunk) {
        const f = toSyntheticFragment(summaryChunk, like, unit.score);
        selected.push(f);
        usedChars += f.text.length;
        unitsIn++;
        tableLog.push({ tableId: unit.tableId, sheetName: unit.sheetName, level: 3, rowsUsed: 0, rowsTotal, belongingUsed: 0, collapsedCount: 0, chars: f.text.length });
      } else if (unit.recoveredRows.length > 0) {
        const shortest = [...unit.recoveredRows].sort((a, b) => a.text.length - b.text.length)[0];
        selected.push(shortest);
        usedChars += shortest.text.length;
        unitsIn++;
        tableLog.push({ tableId: unit.tableId, sheetName: unit.sheetName, level: '3-forzado', rowsUsed: 1, rowsTotal, belongingUsed: 0, collapsedCount: 0, chars: shortest.text.length });
      }
    }
  }

  return { selected, tableLog, unitsIn, unitsOut: units.length - unitsIn, structuralOverlaps };
}
