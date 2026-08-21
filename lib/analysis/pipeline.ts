import type { FinalAnalysis, PipelineOptions } from './types';
import { retrieveCandidates } from './retrieval';
import { rerankCandidates } from './rerank';
import { judgeAllDocuments } from './judge';
import { synthesizeFinalAnalysis } from './synthesize';
import { checkContentHash } from './hash-check';
import { extractAtomicClaims } from './extract-claims';
import { verifyClaimsAgainstCorpus } from './verify-claims';
import { doubleCheckContradictions } from './double-check';
import { analyzeStyle } from './style-check';
import { loadFragmentContexts, fragmentContextKey } from './fragment-context';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Carga el texto completo de los documentos candidatos en un único lote.
 * Réplica local del patrón de fetchFullTexts en lib/rag.ts: no se importa
 * de ahí para no acoplar el pipeline de análisis al del chat.
 *
 * Un documento sin full_text (o si la consulta entera falla) simplemente
 * no entra en el mapa — el llamador debe caer a su propio fallback, nunca
 * romper el análisis por esto.
 */
async function fetchCandidateFullTexts(
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
}

export type ExhaustivePipelineInput = AnalyzePipelineInput;

const HIGH_OVERLAP_THRESHOLD = 30;

/** Máximo de candidatas enviadas al double-check en modo exhaustivo. */
const MAX_DOUBLE_CHECK_CANDIDATES = 50;

// ============================================================
// Núcleo compartido: retrieve → rerank → judge → synthesize
// ============================================================

async function runCorePipeline(
  input: AnalyzePipelineInput,
  options: PipelineOptions,
  label: string,
): Promise<FinalAnalysis> {
  const t0 = Date.now();

  const candidates = await retrieveCandidates({
    sampleTexts: input.sampleTexts,
    orgId: input.orgId,
    excludeDocumentId: input.excludeDocumentId,
    batchDocumentIds: input.batchDocumentIds,
    options,
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

  const fullTexts = await fetchCandidateFullTexts(input.supabase, reranked.map(c => c.documentId));

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
  const judgments = await judgeAllDocuments({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates: reranked,
    options,
    fullTexts,
  });
  console.log(`[${label}] Judge: ${judgments.length} juicios emitidos (${Date.now() - t2}ms)`);

  if (!options.exhaustive) {
    await new Promise(r => setTimeout(r, 1500));
  }

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
