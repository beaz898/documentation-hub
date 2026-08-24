import { queryVectors, buildCorpusFilter } from '@/lib/pinecone/vectors';
import { generateEmbeddings } from '@/lib/embeddings';
import { runInBatches } from '@/lib/run-in-batches';
import { getChunksForDocuments } from '@/lib/read-chunks';
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
}): Promise<{ candidates: CandidateDocument[]; chunksByDocument: Map<string, StoredChunk[]> }> {
  const { sampleTexts, orgId, excludeDocumentId, batchDocumentIds, options, supabase } = args;
  const isExhaustive = options?.exhaustive === true;

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
      const units = buildUnits(sorted, docChunks);
      const result = selectUnitsWithinBudget(units, docChunks, sorted[0]);
      selected = result.selected;

      const usedChars = selected.reduce((sum, f) => sum + f.text.length, 0);
      for (const t of result.tableLog) {
        const levelDesc =
          t.level === 1 ? `completa, ${t.rowsUsed} filas`
          : t.level === 2 ? `resumen + ${t.rowsUsed}/${t.rowsTotal} filas`
          : 'solo resumen';
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

/**
 * Intenta encajar una tabla en el presupuesto que queda, en cascada:
 *   Nivel 1 — completa (todas sus filas de document_chunks + su
 *     table_summary si existe), si cabe entera.
 *   Nivel 2 — table_summary (no compite, se resta primero) + las filas
 *     RECUPERADAS que quepan en lo que sobra, por score.
 *   Nivel 3 — solo table_summary, si ni las filas recuperadas caben.
 * Devuelve null si ni el resumen solo cabe — la tabla no entra en absoluto.
 */
function assembleTable(
  unit: TableUnit,
  docChunks: StoredChunk[],
  like: DocumentFragment,
  remainingBudget: number,
  remainingCount: number,
): { level: 1 | 2 | 3; fragments: DocumentFragment[]; usedChars: number } | null {
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
    };
  }

  if (summaryFragment) {
    const budgetForRows = remainingBudget - summaryChars;
    const countForRows = remainingCount - 1;
    if (budgetForRows >= 0 && countForRows >= 0) {
      const packedRows: DocumentFragment[] = [];
      let usedRowChars = 0;
      for (const rowFragment of unit.recoveredRows) {
        if (packedRows.length >= countForRows) break;
        if (usedRowChars + rowFragment.text.length > budgetForRows) continue;
        packedRows.push(rowFragment);
        usedRowChars += rowFragment.text.length;
      }
      if (packedRows.length > 0) {
        return { level: 2, fragments: [...packedRows, summaryFragment], usedChars: summaryChars + usedRowChars };
      }
    }
    if (summaryChars <= remainingBudget && remainingCount >= 1) {
      return { level: 3, fragments: [summaryFragment], usedChars: summaryChars };
    }
  }

  return null;
}

interface TableLevelLog {
  tableId: string;
  sheetName: string | null;
  level: 1 | 2 | 3;
  rowsUsed: number;
  rowsTotal: number;
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
): { selected: DocumentFragment[]; tableLog: TableLevelLog[]; unitsIn: number; unitsOut: number } {
  const selected: DocumentFragment[] = [];
  const tableLog: TableLevelLog[] = [];
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

    const assembled = assembleTable(unit, docChunks, like, remainingBudget, remainingCount);
    if (assembled) {
      selected.push(...assembled.fragments);
      usedChars += assembled.usedChars;
      unitsIn++;
      const rowsTotal = docChunks.filter(c => c.tableId === unit.tableId && c.chunkType === 'table_row').length;
      const rowsUsed = assembled.fragments.filter(f => {
        const stored = docChunks.find(c => c.chunkIndex === f.chunkIndex);
        return stored?.chunkType === 'table_row';
      }).length;
      tableLog.push({ tableId: unit.tableId, sheetName: unit.sheetName, level: assembled.level, rowsUsed, rowsTotal, chars: assembled.usedChars });
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
        tableLog.push({ tableId: unit.tableId, sheetName: unit.sheetName, level: 3, rowsUsed: 0, rowsTotal, chars: f.text.length });
      } else if (unit.recoveredRows.length > 0) {
        const shortest = [...unit.recoveredRows].sort((a, b) => a.text.length - b.text.length)[0];
        selected.push(shortest);
        usedChars += shortest.text.length;
        unitsIn++;
        tableLog.push({ tableId: unit.tableId, sheetName: unit.sheetName, level: 2, rowsUsed: 1, rowsTotal, chars: shortest.text.length });
      }
    }
  }

  return { selected, tableLog, unitsIn, unitsOut: units.length - unitsIn };
}
