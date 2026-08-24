import type { FinalAnalysis, PipelineOptions, DiscardedFindings } from './types';
import { retrieveCandidates } from './retrieval';
import type { StructuralOverlap } from './retrieval';
import { rerankCandidates } from './rerank';
import { judgeAllDocuments } from './judge';
import type { JudgmentEvidence } from './judge';
import { synthesizeFinalAnalysis } from './synthesize';
import { checkContentHash } from './hash-check';
import { extractAtomicClaims } from './extract-claims';
import { verifyClaimsAgainstCorpus } from './verify-claims';
import { doubleCheckContradictions } from './double-check';
import { analyzeStyle } from './style-check';
import { loadFragmentContexts, fragmentContextKey } from './fragment-context';
import { applyDeterministicRules, buildStructuralTopic } from './finding-rules';
import { getOrderedColumns } from './table-structure';
import { verifyFindings } from './verify-findings';
import type { FindingToVerify, FindingNeighbours } from './verify-findings';
import type { StoredChunk } from '@/lib/read-chunks';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DocumentJudgment } from './types';

/**
 * Carga full_text de un lote de documentos. Réplica local del patrón de
 * fetchFullTexts en lib/rag.ts: no se importa de ahí para no acoplar el
 * pipeline de análisis al del chat.
 *
 * F-27: los chunks (chunksByDocument, más abajo — desde F-41, lo trae
 * retrieveCandidates, no una llamada propia de este fichero) son el haystack
 * contra el que se verifican las citas del juez — esta función ya NO es la
 * fuente primaria. Queda como FALLBACK, y se llama solo con los documentIds
 * de los candidatos que volvieron sin chunks (documento indexado antes de
 * F-20, o sin chunks por cualquier otro motivo).
 *
 * Un documento sin full_text (o si la consulta entera falla) simplemente
 * no entra en el mapa — el llamador debe caer a su propio fallback, nunca
 * romper el análisis por esto.
 */
async function fetchFallbackFullTexts(
  supabase: SupabaseClient,
  documentIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (documentIds.length === 0) return result;

  const { data, error } = await supabase
    .from('documents')
    .select('id, full_text')
    .in('id', documentIds);

  if (error) {
    console.warn('[pipeline] Error cargando full_text de candidatos:', error.message);
    return result;
  }

  for (const row of data || []) {
    if (row.full_text && row.full_text.trim().length > 0) {
      result.set(row.id, row.full_text);
    }
  }

  return result;
}

export interface AnalyzePipelineInput {
  newDocumentText: string;
  newDocumentName: string;
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
  /**
   * IDs de otros documentos de la misma tanda de la bandeja de revisión,
   * aún sin validar (analysisStatus='pendiente') pero ya indexados. Se
   * incluyen en el corpus consultado SOLO para este análisis, para que los
   * documentos de una tanda se comparen entre sí sin esperar a que cada
   * uno se valide.
   */
  batchDocumentIds?: string[];
  supabase: SupabaseClient;
  /**
   * Huellas de contradicciones descartadas en reanálisis anteriores.
   * Se pasan al double-check para no gastar Sonnet re-verificándolas.
   */
  excludeFingerprints?: Set<string>;
  /** Chunks del documento analizado, en su forma persistida (la misma que
   *  devuelve getDocumentChunks y que escribe document_chunks). Es el
   *  haystack contra el que se verifican las citas del lado nuevo (F-27), y
   *  el que permite al verificador de hallazgos comparar `cells` de los dos
   *  lados (F-24). Opcional: el camino de mejora sobre texto no indexado no
   *  tiene estructura de tabla que aportar; sin ellos, verifyQuote cae al
   *  fallback de newDocumentText. */
  newDocumentChunks?: StoredChunk[];
}

export type ExhaustivePipelineInput = AnalyzePipelineInput;

const HIGH_OVERLAP_THRESHOLD = 30;

/** Máximo de candidatas enviadas al double-check en modo exhaustivo. */
const MAX_DOUBLE_CHECK_CANDIDATES = 50;

// ============================================================
// Verificador de hallazgos: la cascada (F-35)
// ============================================================

/**
 * Texto del chunk inmediatamente anterior/posterior a `chunk` dentro de
 * `chunks` (mismo documento y generación), buscando por chunkIndex ± 1. Sin
 * lectura nueva: `chunks` ya viene cargado completo (chunksByDocument /
 * newDocumentChunks, cargados más abajo para el paso 2a). null si no hay
 * chunk, o si es el primero/último del documento.
 */
function buildNeighbours(chunks: StoredChunk[], chunk: StoredChunk | null): FindingNeighbours {
  if (!chunk) return { previous: null, next: null };
  const previous = chunks.find(c => c.chunkIndex === chunk.chunkIndex - 1);
  const next = chunks.find(c => c.chunkIndex === chunk.chunkIndex + 1);
  return { previous: previous?.text ?? null, next: next?.text ?? null };
}

function bumpCount(counts: DiscardedFindings, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

interface CascadeTally {
  total: number;
  confirmados: number;
  /** De los confirmados: cuántos por la capa determinista (F-36, 'confirm'). */
  confirmadosPorEstructura: number;
  /** De los confirmados: cuántos por la llamada corta. F-36: "es la métrica
   *  que os dirá cuánto trabajo hace cada capa". */
  confirmadosPorJuicio: number;
  descartados: number;
  reclasificados: number;
}

interface CascadeOutcome {
  judgment: DocumentJudgment;
  tally: CascadeTally;
}

/**
 * Aplica la cascada F-25 (procedencia → determinista → llamada corta) a las
 * CONTRADICCIONES de un candidato. F-35: como etapa de runCorePipeline,
 * después de que judgeAllDocuments termina — nunca dentro de
 * judgeSingleDocument, para que generar y verificar no compartan ámbito de
 * ejecución.
 *
 * Solo contradictions[] pasa por verifyFindings, no overlappingContent[]: la
 * pregunta de verifyFindings ("¿se oponen sobre el mismo dato?") encaja con
 * lo que una contradicción afirma — no con lo que afirma un solapamiento
 * (acuerdo, no oposición). Extender la VERIFICACIÓN a solapamientos es una
 * decisión de diseño aparte, no tomada aquí. overlappingContent sí gana
 * entradas nuevas aquí, por dos vías que no pasan por esa pregunta: la
 * reclasificación de 'reclassify' (contradicción→solapamiento, como antes) y,
 * desde F-45, el solapamiento estructural que ya trae `structuralOverlaps` —
 * ninguna de las dos necesita verifyFindings porque ninguna es un veredicto
 * del juez sobre el que dudar: una viene de la capa determinista, la otra del
 * colapso de filas idénticas (F-44), verificado celda a celda antes de llegar
 * aquí.
 *
 * `evidence` muere al final de esta función: no sale en el `judgment` que
 * devuelve, que es la única pieza que sigue viaje hacia synthesize.
 *
 * F-36: la capa determinista gana una cuarta salida, 'confirm' — misma
 * columna, valores distintos, ya no queda nada que la llamada corta pueda
 * decidir. Sobrevive directamente, sin pasar por verifyFindings.
 *
 * F-38: el topic que sobrevive es el del juez, sin tocar — ninguna etapa
 * reescribe un campo que identifica el hallazgo (costó día y medio de
 * diagnóstico: se buscaba por el nombre de una persona y daba negativo porque
 * una etapa posterior había sustituido ese campo por una plantilla).
 * buildStructuralTopic queda solo como respaldo para cuando el topic del juez
 * venga vacío.
 */
async function applyCascadeToCandidate(
  judgment: DocumentJudgment,
  evidence: JudgmentEvidence,
  newDocumentChunks: StoredChunk[],
  existingChunks: StoredChunk[],
  newDocumentName: string,
  label: string,
  structuralOverlaps: StructuralOverlap[],
): Promise<CascadeOutcome> {
  const counts: DiscardedFindings = {};
  const tally: CascadeTally = {
    total: judgment.contradictions.length,
    confirmados: 0,
    confirmadosPorEstructura: 0,
    confirmadosPorJuicio: 0,
    descartados: 0,
    reclasificados: 0,
  };

  const keptContradictions: DocumentJudgment['contradictions'] = [];
  const movedToOverlaps: DocumentJudgment['overlappingContent'] = [];
  const toVerify: Array<{
    contradiction: DocumentJudgment['contradictions'][number];
    // Índice en judgment.contradictions/evidence.contradictions (F-40):
    // toVerify es un array COMPACTADO (solo lo que cayó a 'pass'), así que su
    // propia posición diverge de ese índice en cuanto un hallazgo anterior
    // tomó otra rama. Sin esto, no hay forma de recuperar el hash correcto
    // más abajo, en results.forEach.
    sourceIndex: number;
    finding: FindingToVerify;
  }> = [];

  // F-51: orden de columnas para describeSide (verify-findings.ts), cacheado
  // por tabla — varios hallazgos de este candidato pueden citar la misma
  // tabla, y sin caché se recalcularía (y se volvería a loggear
  // orden_no_parseable) una vez por hallazgo. 'new'/'existing' porque son dos
  // documentos distintos y un mismo tableId literal no podría darse en los
  // dos a la vez, pero el prefijo lo deja explícito igualmente.
  const columnOrderCache = new Map<string, string[]>();
  function orderedColumnsFor(chunk: StoredChunk | null, docChunks: StoredChunk[], side: 'new' | 'existing'): string[] | null {
    if (!chunk || chunk.chunkType !== 'table_row' || !chunk.tableId) return null;
    const cacheKey = `${side}:${chunk.tableId}`;
    let order = columnOrderCache.get(cacheKey);
    if (!order) {
      order = getOrderedColumns(chunk.tableId, docChunks);
      columnOrderCache.set(cacheKey, order);
    }
    return order;
  }

  judgment.contradictions.forEach((c, i) => {
    // '????????' salta a la vista si esto alguna vez dispara: significa que
    // evidence.contradictions se desalineó con judgment.contradictions, no que
    // no hay chunks. No se hace opcional en silencio (F-38).
    const ev = evidence.contradictions[i] ?? { hash: '????????', newChunk: null, existingChunk: null, newColumns: null, existingColumns: null };

    // 2.2 — capa determinista, con las cells de los dos lados (null si el
    // chunk falta o si no es una fila de tabla: applyDeterministicRules trata
    // ambos casos igual, ya que solo le importan las cells, no si el chunk
    // existe) y las columnas ya resueltas por la alineación (F-56) — esta
    // capa no vuelve a buscarlas.
    const verdict = applyDeterministicRules({
      newDocSays: c.newDocSays,
      existingDocSays: c.existingDocSays,
      newCells: ev.newChunk?.cells ?? null,
      existingCells: ev.existingChunk?.cells ?? null,
      newColumns: ev.newColumns,
      existingColumns: ev.existingColumns,
    });

    if (verdict.outcome === 'discard') {
      bumpCount(counts, `descartado.${verdict.reason}`);
      tally.descartados++;
      console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → descartado: ${verdict.reason}`);
      return;
    }

    if (verdict.outcome === 'confirm') {
      bumpCount(counts, 'confirmado.por_estructura');
      tally.confirmados++;
      tally.confirmadosPorEstructura++;
      console.log(`[${label}] · [${ev.hash}] "${(c.topic ?? '(sin titulo)').slice(0, 60)}" → confirmado por estructura (columnas: ${verdict.columns.join(', ')})`);
      keptContradictions.push({
        ...c,
        topic: c.topic?.trim()
          ? c.topic
          : buildStructuralTopic(verdict.entity, verdict.columns, newDocumentName, judgment.documentName),
        severity: 'contradiction',
        confirmedBy: 'estructura',
      });
      return;
    }

    if (verdict.outcome === 'reclassify') {
      bumpCount(counts, 'descartado.equivalentes');
      tally.reclasificados++;
      console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → reclasificado a solapamiento`);
      // Se mueve de contradicción a solapamiento: no hay "description" propia
      // en una contradicción, así que el topic hace ese papel — es lo más
      // cercano a una frase que resuma qué comparten los dos lados.
      movedToOverlaps.push({ description: c.topic, evidence: c.existingDocSays, evidenceInNewDoc: c.newDocSays });
      return;
    }

    // 'pass' -> baja a juicio (2.3): motivo solo si aplica, nunca los dos a
    // la vez (columna_indeterminada exige cells en los dos lados, que nunca
    // se da si falta un chunk).
    if (!ev.newChunk || !ev.existingChunk) {
      bumpCount(counts, 'a_juicio.chunk_no_localizado');
      console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → baja a juicio: chunk_no_localizado`);
    } else if (ev.newChunk.cells && ev.existingChunk.cells) {
      // F-56: mismas columnas que ya recibió applyDeterministicRules arriba
      // (ev.newColumns/ev.existingColumns) — se leen, no se recalculan. Antes
      // de este commit esto llamaba a findCitedColumns por segunda vez con
      // los mismos datos, solo para decidir el motivo del log.
      if (!ev.newColumns?.length || !ev.existingColumns?.length) {
        bumpCount(counts, 'a_juicio.columna_indeterminada');
        console.log(`[${label}] · [${ev.hash}] "${c.topic.slice(0, 60)}" → baja a juicio: columna_indeterminada`);
      }
    }

    toVerify.push({
      contradiction: c,
      sourceIndex: i,
      finding: {
        topic: c.topic,
        newDocSays: c.newDocSays,
        existingDocSays: c.existingDocSays,
        existingDocumentName: judgment.documentName,
        newChunk: ev.newChunk,
        existingChunk: ev.existingChunk,
        newNeighbours: buildNeighbours(newDocumentChunks, ev.newChunk),
        existingNeighbours: buildNeighbours(existingChunks, ev.existingChunk),
        newColumnOrder: orderedColumnsFor(ev.newChunk, newDocumentChunks, 'new'),
        existingColumnOrder: orderedColumnsFor(ev.existingChunk, existingChunks, 'existing'),
      },
    });
  });

  // 2.4 — llamada corta, solo con lo que pasó la capa determinista.
  if (toVerify.length > 0) {
    const { results, counts: verifyCounts } = await verifyFindings(toVerify.map(t => t.finding));
    for (const [key, n] of Object.entries(verifyCounts)) {
      counts[key] = (counts[key] ?? 0) + n;
    }
    results.forEach((r, i) => {
      const original = toVerify[i].contradiction;
      // Hash leído, no recalculado (F-40): mismo sitio que las otras cinco
      // líneas (evidence.contradictions), pero indexado por sourceIndex —
      // el índice de toVerify[i] no sirve aquí, es el de un array compactado.
      const hash = evidence.contradictions[toVerify[i].sourceIndex]?.hash ?? '????????';
      if (r.verdict === 'confirmado') {
        bumpCount(counts, 'confirmado.por_juicio');
        tally.confirmados++;
        tally.confirmadosPorJuicio++;
        console.log(`[${label}] · [${hash}] "${original.topic.slice(0, 60)}" → confirmado por juicio`);
        keptContradictions.push({ ...original, severity: r.severity ?? original.severity, confirmedBy: 'juicio' });
      } else {
        // 'mismo_dato_sin_oposicion' y 'sin_relacion' mueren aquí — sus
        // motivos ya están contados dentro de verifyCounts.
        tally.descartados++;
        console.log(`[${label}] · [${hash}] "${original.topic.slice(0, 60)}" → descartado: ${r.verdict}`);
      }
    });
  }

  // 2.5 — fusión de conteos con el discarded que ya traía el judgment
  // (narracionEnCita / citaNoVerificable, de fixQuotesInJudgment). Mismo
  // campo, DocumentJudgment no gana ninguno nuevo — solo se le llena más.
  const mergedDiscarded: DiscardedFindings = { ...(judgment.discarded ?? {}) };
  for (const [key, n] of Object.entries(counts)) {
    mergedDiscarded[key] = (mergedDiscarded[key] ?? 0) + n;
  }

  // F-45: un solapamiento por tabla colapsada (retrieval.ts F-44) — nunca
  // pasó por el juez, así que tampoco pasa por fixQuotesInJudgment (esa
  // verificación ya corrió antes, dentro de judgeSingleDocument, sobre lo que
  // el juez emitió). `evidence`/`evidenceInNewDoc` quedan vacíos a propósito:
  // no hay una cita única que resuma N filas colapsadas — el texto que sí
  // sostiene el hallazgo va en `description`, con las columnas y el valor de
  // cada fila que coincidió.
  const structuralEntries: DocumentJudgment['overlappingContent'] = structuralOverlaps.map(s => {
    const structuralPercent = s.rowsTotal > 0 ? Math.round((s.collapsedCount / s.rowsTotal) * 100) : 0;
    const tableLabel = s.sheetName ? `"${s.sheetName}"` : 'una tabla';
    return {
      description:
        `${s.collapsedCount} de ${s.rowsTotal} filas de ${tableLabel} de "${judgment.documentName}" ` +
        `coinciden exactamente, celda a celda, en ${s.columns.join(' y ')} con filas de "${newDocumentName}": ` +
        `${s.labels.join(', ')}.`,
      evidence: '',
      evidenceInNewDoc: '',
      confirmedBy: 'estructura',
      structuralPercent,
    };
  });

  return {
    judgment: {
      ...judgment,
      contradictions: keptContradictions,
      overlappingContent: [...judgment.overlappingContent, ...movedToOverlaps, ...structuralEntries],
      ...(Object.keys(mergedDiscarded).length > 0 ? { discarded: mergedDiscarded } : {}),
    },
    tally,
  };
}

// ============================================================
// Núcleo compartido: retrieve → rerank → judge → verificar → synthesize
// ============================================================

async function runCorePipeline(
  input: AnalyzePipelineInput,
  options: PipelineOptions,
  label: string,
): Promise<FinalAnalysis> {
  const t0 = Date.now();

  const { candidates, chunksByDocument: chunksFromRetrieval, structuralOverlaps } = await retrieveCandidates({
    sampleTexts: input.sampleTexts,
    orgId: input.orgId,
    excludeDocumentId: input.excludeDocumentId,
    batchDocumentIds: input.batchDocumentIds,
    options,
    supabase: input.supabase,
    newDocumentChunks: input.newDocumentChunks,
  });
  console.log(`[${label}] Retrieval: ${candidates.length} candidatos (${Date.now() - t0}ms)`);

  if (candidates.length === 0) {
    return synthesizeFinalAnalysis({ newDocumentName: input.newDocumentName, judgments: [] });
  }

  const t1 = Date.now();
  const reranked = await rerankCandidates({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates,
    options,
  });
  console.log(`[${label}] Rerank: ${reranked.length} seleccionados (${Date.now() - t1}ms)`);

  if (reranked.length === 0) {
    return synthesizeFinalAnalysis({ newDocumentName: input.newDocumentName, judgments: [] });
  }

  // F-27: los chunks son el haystack contra el que se verifican las citas del
  // juez. F-41: ya no se vuelve a consultar — retrieveCandidates hace
  // exactamente esta misma lectura, con getChunksForDocuments, para TODOS sus
  // candidatos (necesaria para el reparto por unidades); reranked es siempre
  // un subconjunto de esos candidatos, así que el mapa que ya trajo retrieval
  // los cubre sin una segunda ida a Supabase. Solo se lee full_text para los
  // documentos que vuelvan SIN chunks (indexados antes de F-20, o sin chunks
  // por cualquier otro motivo) — fallback, no fuente primaria.
  const chunksByDocument = chunksFromRetrieval;
  const documentsWithoutChunks = reranked
    .map(c => c.documentId)
    .filter(id => !chunksByDocument.get(id)?.length);
  const fallbackTexts = await fetchFallbackFullTexts(input.supabase, documentsWithoutChunks);
  console.log(`[${label}] Chunks para verificación: ${chunksByDocument.size}/${reranked.length} documentos con chunks (${documentsWithoutChunks.length} por full_text de respaldo)`);

  // F-20 4d: enriquecer los fragmentos con su contexto de document_chunks
  // (tipo de chunk, hoja/fila si es tabla, y texto vecino). No-fatal: si la
  // carga falla o el documento no tiene chunks persistidos, los fragmentos se
  // quedan sin `context` y todo sigue como antes.
  const fragmentRefs = reranked.flatMap(c =>
    c.fragments.map(f => ({
      documentId: f.documentId,
      generation: f.generation ?? 1,
      chunkIndex: f.chunkIndex,
    })),
  );
  const contexts = await loadFragmentContexts(input.supabase, {
    orgId: input.orgId,
    refs: fragmentRefs,
  });
  if (contexts.size > 0) {
    for (const candidate of reranked) {
      candidate.fragments = candidate.fragments.map(f => {
        const ctx = contexts.get(
          fragmentContextKey(f.documentId, f.generation ?? 1, f.chunkIndex),
        );
        return ctx ? { ...f, context: ctx } : f;
      });
    }
  }
  console.log(`[${label}] Contexto de fragmentos: ${contexts.size}/${fragmentRefs.length} resueltos`);

  const t2 = Date.now();
  const { judgments: rawJudgments, evidences } = await judgeAllDocuments({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates: reranked,
    options,
    newDocumentChunks: input.newDocumentChunks ?? [],
    chunksByDocument,
    fallbackTexts,
  });
  console.log(`[${label}] Judge: ${rawJudgments.length} juicios emitidos (${Date.now() - t2}ms)`);

  // Cascada del verificador (F-35): un candidato, un lote — sale gratis
  // porque rawJudgments ya viene un elemento por candidato. Secuencial, no en
  // paralelo entre candidatos: mantiene el alcance de este commit acotado;
  // paralelizar esta etapa (como ya hacen retrieval/judge, F-31) queda para
  // cuando haga falta medido, no aquí.
  const t2b = Date.now();
  const newDocumentChunksForCascade = input.newDocumentChunks ?? [];
  const judgments: DocumentJudgment[] = [];
  let totalHallazgos = 0;
  let totalConfirmados = 0;
  let totalConfirmadosPorEstructura = 0;
  let totalConfirmadosPorJuicio = 0;
  let totalDescartados = 0;
  let totalReclasificados = 0;
  for (let i = 0; i < rawJudgments.length; i++) {
    const judgment = rawJudgments[i];
    const evidence = evidences[i];
    const existingChunksForCascade = chunksByDocument.get(judgment.documentId) ?? [];
    const outcome = await applyCascadeToCandidate(
      judgment,
      evidence,
      newDocumentChunksForCascade,
      existingChunksForCascade,
      input.newDocumentName,
      label,
      structuralOverlaps.get(judgment.documentId) ?? [],
    );
    judgments.push(outcome.judgment);
    totalHallazgos += outcome.tally.total;
    totalConfirmados += outcome.tally.confirmados;
    totalConfirmadosPorEstructura += outcome.tally.confirmadosPorEstructura;
    totalConfirmadosPorJuicio += outcome.tally.confirmadosPorJuicio;
    totalDescartados += outcome.tally.descartados;
    totalReclasificados += outcome.tally.reclasificados;
  }
  console.log(
    `[${label}] Verificador: ${totalHallazgos} hallazgos → ${totalConfirmados} confirmados ` +
    `(${totalConfirmadosPorEstructura} por estructura, ${totalConfirmadosPorJuicio} por juicio), ` +
    `${totalDescartados} descartados, ${totalReclasificados} reclasificados (${Date.now() - t2b}ms)`
  );

  const t3 = Date.now();
  const final = await synthesizeFinalAnalysis({
    newDocumentName: input.newDocumentName,
    judgments,
    excludeDocumentId: input.excludeDocumentId,
  });
  console.log(`[${label}] Synthesize (${Date.now() - t3}ms). Total: ${Date.now() - t0}ms`);

  return final;
}

// ============================================================
// Helper: duplicado exacto
// ============================================================

function buildExactDuplicateResponse(
  duplicateOfName: string,
  mode: 'quick' | 'exhaustive',
): FinalAnalysis {
  return {
    isDuplicate: true,
    duplicateOf: duplicateOfName,
    duplicateConfidence: 100,
    overlaps: [],
    discrepancies: [],
    newInformation: '',
    recommendation: 'NO_INDEXAR',
    summary: `Este documento es idéntico a "${duplicateOfName}" que ya está indexado. No aporta información nueva.`,
    judgments: [],
    analysisMode: mode,
  };
}

// ============================================================
// Pipeline rápido
// ============================================================

export async function runAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();

  const hashResult = await checkContentHash(
    input.supabase, input.newDocumentText, input.orgId, input.excludeDocumentId,
  );

  if (hashResult.isDuplicateExact) {
    console.log(`[pipeline-v2] Hash match: duplicado exacto de "${hashResult.duplicateOfName}" (${Date.now() - t0}ms)`);
    return buildExactDuplicateResponse(hashResult.duplicateOfName!, 'quick');
  }

  console.log(`[pipeline-v2] Hash check: sin duplicado exacto (${Date.now() - t0}ms)`);

  const result = await runCorePipeline(input, { exhaustive: false }, 'pipeline-v2');
  return { ...result, analysisMode: 'quick' };
}

// ============================================================
// Pipeline exhaustivo
// ============================================================

export async function runExhaustiveAnalysisPipeline(input: ExhaustivePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();
  console.log(`[pipeline-exhaustive] Iniciando análisis exhaustivo de "${input.newDocumentName}" con ${input.sampleTexts.length} fragmentos`);

  const hashResult = await checkContentHash(
    input.supabase, input.newDocumentText, input.orgId, input.excludeDocumentId,
  );

  if (hashResult.isDuplicateExact) {
    console.log(`[pipeline-exhaustive] Hash match: duplicado exacto de "${hashResult.duplicateOfName}" (${Date.now() - t0}ms)`);
    return buildExactDuplicateResponse(hashResult.duplicateOfName!, 'exhaustive');
  }

  console.log(`[pipeline-exhaustive] Hash check: sin duplicado exacto (${Date.now() - t0}ms)`);

  const [pipelineResult, styleProblems] = await Promise.all([
    runCorePipeline(input, { exhaustive: true }, 'pipeline-exhaustive'),
    analyzeStyle(input.newDocumentText, input.newDocumentName),
  ]);

  const excludeFps = input.excludeFingerprints || new Set<string>();

  // ── Análisis completo: sin corte temprano ────────────────────
  const atomicClaims = await extractAtomicClaims(input.newDocumentText, input.newDocumentName);
  const atomicContradictions = await verifyClaimsAgainstCorpus(atomicClaims, input.orgId, input.excludeDocumentId, input.batchDocumentIds);

  const mergedDiscrepancies = mergeContradictions(
    pipelineResult.discrepancies,
    atomicContradictions.map(c => ({
      topic: c.topic,
      newDocSays: c.newDocSays,
      existingDocSays: c.existingDocSays,
      existingDocument: c.existingDocument,
      severity: c.severity,
    })),
  );

  console.log(`[pipeline-exhaustive] Fusión: ${pipelineResult.discrepancies.length} v2 + ${atomicContradictions.length} atómicas → ${mergedDiscrepancies.length} totales`);

  const totalCandidates = mergedDiscrepancies.length;
  const cappedCandidates = mergedDiscrepancies.slice(0, MAX_DOUBLE_CHECK_CANDIDATES);
  const candidatesOverLimit = totalCandidates > MAX_DOUBLE_CHECK_CANDIDATES ? totalCandidates : undefined;

  if (candidatesOverLimit !== undefined) {
    console.log(`[pipeline-exhaustive] Candidatas limitadas a ${MAX_DOUBLE_CHECK_CANDIDATES} (había ${totalCandidates})`);
  }

  const doubleChecked = await doubleCheckContradictions(
    cappedCandidates,
    0, // sin objetivo → verificar todas
    excludeFps,
  );

  // Separar contradicciones confirmadas de inconsistencias menores
  const confirmedContradictions = doubleChecked.filter(d => d.confidence === 'alta');
  const minorInconsistencies = doubleChecked
    .filter(d => d.confidence === 'posible' && d.severity === 'minor_inconsistency')
    .map(({ topic, newDocSays, existingDocSays, existingDocument }) => ({
      topic, newDocSays, existingDocSays, existingDocument,
    }));

  let recommendation = pipelineResult.recommendation;
  if (recommendation === 'INDEXAR' && (confirmedContradictions.length > 0 || minorInconsistencies.length > 0)) {
    recommendation = 'REVISAR';
  }

  const totalTime = Date.now() - t0;
  console.log(`[pipeline-exhaustive] Completo en ${totalTime}ms — ${styleProblems.length} problemas de estilo, ${confirmedContradictions.length} contradicciones, ${minorInconsistencies.length} inconsistencias menores`);

  const n = confirmedContradictions.length;
  const estimatedCost: 'light' | 'medium' | 'heavy' =
    candidatesOverLimit !== undefined || n > 30 ? 'heavy'
    : n >= 10 ? 'medium'
    : 'light';

  console.log(`[pipeline-exhaustive] estimatedCost: ${estimatedCost} (${n} contradicciones, candidatesOverLimit=${candidatesOverLimit ?? 'no'})`);

  return {
    ...pipelineResult,
    discrepancies: confirmedContradictions,
    ...(minorInconsistencies.length > 0 && { minorInconsistencies }),
    recommendation,
    analysisMode: 'exhaustive',
    styleProblems,
    estimatedCost,
    ...(candidatesOverLimit !== undefined && { candidatesOverLimit }),
  };
}

// ============================================================
// Helpers
// ============================================================

interface Discrepancy {
  topic: string;
  newDocSays: string;
  existingDocSays: string;
  existingDocument: string;
  severity?: 'contradiction' | 'minor_inconsistency';
}

function mergeContradictions(listA: Discrepancy[], listB: Discrepancy[]): Discrepancy[] {
  const result = [...listA];
  const existingKeys = new Set(listA.map(d => makeContradictionKey(d)));

  for (const d of listB) {
    const key = makeContradictionKey(d);
    if (!existingKeys.has(key)) {
      result.push(d);
      existingKeys.add(key);
    }
  }

  return result;
}

function makeContradictionKey(d: Discrepancy): string {
  const normTopic = d.topic.toLowerCase().replace(/\s+/g, ' ').trim();
  const normDoc = d.existingDocument.toLowerCase().trim();
  const normClaim = d.newDocSays.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 50);
  return `${normDoc}|${normTopic}|${normClaim}`;
}
