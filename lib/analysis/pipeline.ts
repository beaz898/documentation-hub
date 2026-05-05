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
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AnalyzePipelineInput {
  newDocumentText: string;
  newDocumentName: string;
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
  supabase: SupabaseClient;
  /**
   * Huellas de contradicciones descartadas en reanálisis anteriores.
   * Se pasan al double-check para no gastar Sonnet re-verificándolas.
   */
  excludeFingerprints?: Set<string>;
}

export type ExhaustivePipelineInput = AnalyzePipelineInput;

const HIGH_OVERLAP_THRESHOLD = 30;
const MAX_CONTRADICTIONS_BEFORE_CUTOFF = 15;
const TARGET_CONFIRMED = 15;

/**
 * Máximo de candidatas a enviar al double-check en corte temprano.
 * 30 da margen suficiente para conseguir 15 confirmadas incluso
 * si Sonnet descarta la mitad.
 */
const MAX_CANDIDATES_FOR_DOUBLECHECK = 30;

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

  const t2 = Date.now();
  const judgments = await judgeAllDocuments({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates: reranked,
    options,
  });
  console.log(`[${label}] Judge: ${judgments.length} juicios emitidos (${Date.now() - t2}ms)`);

  if (!options.exhaustive) {
    await new Promise(r => setTimeout(r, 1500));
  }

  const t3 = Date.now();
  const final = await synthesizeFinalAnalysis({
    newDocumentName: input.newDocumentName,
    judgments,
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

  // ── Evaluar corte temprano ───────────────────────────────────
  const highOverlaps = pipelineResult.judgments
    ?.filter(j => j.overlapPercent >= HIGH_OVERLAP_THRESHOLD) || [];
  const totalContradictions = pipelineResult.discrepancies.length;
  const shouldCutEarly = highOverlaps.length > 0 || totalContradictions >= MAX_CONTRADICTIONS_BEFORE_CUTOFF;

  if (shouldCutEarly) {
    const earlyStopReason = highOverlaps.length > 0 ? 'high_overlap' as const : 'too_many_contradictions' as const;

    // Coger hasta 30 candidatas para double-check progresivo
    const candidateCount = Math.min(pipelineResult.discrepancies.length, MAX_CANDIDATES_FOR_DOUBLECHECK);
    const candidatesForCheck = pipelineResult.discrepancies.slice(0, candidateCount);

    console.log(`[pipeline-exhaustive] Corte temprano (${earlyStopReason}): double-check progresivo de ${candidatesForCheck.length} candidatas`);

    const doubleChecked = await doubleCheckContradictions(
      candidatesForCheck,
      TARGET_CONFIRMED,
      excludeFps,
    );

    const confirmed = doubleChecked.filter(d => d.confidence === 'alta');
    const finalDiscrepancies = confirmed.slice(0, TARGET_CONFIRMED);

    let summary: string;
    const topOverlap = highOverlaps.length > 0
      ? highOverlaps.sort((a, b) => b.overlapPercent - a.overlapPercent)[0]
      : null;

    if (earlyStopReason === 'high_overlap' && topOverlap) {
      const overlapList = highOverlaps
        .map(j => `"${j.documentName}" (${j.overlapPercent}%)`)
        .join(', ');
      summary = `Este documento tiene un solapamiento significativo con documentos existentes: ${overlapList}. ` +
        `Se han confirmado ${confirmed.length} discrepancias de las ${totalContradictions} detectadas. ` +
        `Resuelve los solapamientos y las discrepancias indicadas, y vuelve a analizar para encontrar las restantes.`;
    } else {
      summary = `Se han detectado al menos ${totalContradictions} discrepancias con el corpus existente ` +
        `y se han confirmado ${confirmed.length} con doble verificación. ` +
        `Es probable que haya más. Corrige las indicadas y vuelve a analizar para encontrar las restantes.`;
    }

    const recommendation = topOverlap && topOverlap.overlapPercent >= 60 ? 'NO_INDEXAR' : 'REVISAR';

    console.log(`[pipeline-exhaustive] Corte temprano completado: ${confirmed.length} confirmadas de ${candidatesForCheck.length} candidatas (${Date.now() - t0}ms)`);

    return {
      ...pipelineResult,
      discrepancies: finalDiscrepancies,
      recommendation,
      summary,
      analysisMode: 'exhaustive',
      styleProblems,
      earlyStop: earlyStopReason,
    };
  }

  // ── Sin corte temprano: análisis completo ────────────────────
  const atomicClaims = await extractAtomicClaims(input.newDocumentText, input.newDocumentName);
  const atomicContradictions = await verifyClaimsAgainstCorpus(atomicClaims, input.orgId);

  const mergedDiscrepancies = mergeContradictions(
    pipelineResult.discrepancies,
    atomicContradictions.map(c => ({
      topic: c.topic,
      newDocSays: c.newDocSays,
      existingDocSays: c.existingDocSays,
      existingDocument: c.existingDocument,
    })),
  );

  console.log(`[pipeline-exhaustive] Fusión: ${pipelineResult.discrepancies.length} v2 + ${atomicContradictions.length} atómicas → ${mergedDiscrepancies.length} totales`);

  const doubleChecked = await doubleCheckContradictions(
    mergedDiscrepancies,
    0, // sin objetivo → verificar todas
    excludeFps,
  );

  const hasConfirmed = doubleChecked.some(d => d.confidence === 'alta');
  const hasPossible = doubleChecked.some(d => d.confidence === 'posible');
  let recommendation = pipelineResult.recommendation;
  if (recommendation === 'INDEXAR' && (hasConfirmed || hasPossible)) {
    recommendation = 'REVISAR';
  }

  const totalTime = Date.now() - t0;
  console.log(`[pipeline-exhaustive] Completo en ${totalTime}ms — ${styleProblems.length} problemas de estilo, ${doubleChecked.length} contradicciones`);

  return {
    ...pipelineResult,
    discrepancies: doubleChecked,
    recommendation,
    analysisMode: 'exhaustive',
    styleProblems,
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
