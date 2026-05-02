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
  /**
   * Cliente de Supabase. Necesario para la comprobación de duplicados exactos
   * por hash SHA-256 al inicio del pipeline (rápido y exhaustivo).
   */
  supabase: SupabaseClient;
}

/** Alias mantenido por compatibilidad. El exhaustivo usa la misma forma de input. */
export type ExhaustivePipelineInput = AnalyzePipelineInput;

/**
 * Umbral de solapamiento alto (%). Si algún juicio supera este valor,
 * se considera que el documento tiene un solapamiento significativo
 * y se marca para revisión prioritaria.
 */
const HIGH_OVERLAP_THRESHOLD = 30;

/**
 * Máximo de contradicciones del judge antes de cortar el exhaustivo.
 * Si el judge ya encontró más de esto, no tiene sentido gastar tiempo
 * y dinero en verify-claims + double-check. El documento claramente
 * necesita revisión.
 */
const MAX_CONTRADICTIONS_BEFORE_CUTOFF = 15;

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

  // Pausa solo en modo rápido para liberar presupuesto de rate limit
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
// Helper compartido: respuesta de duplicado exacto detectado por hash
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
// Pipeline rápido (v2) — con muestreo, ~12-15 s
// ============================================================
//
// Capa 0 — Hash SHA-256: duplicados exactos (100%, coste cero).
//          Si hay match, devolvemos directamente sin gastar LLM.
// Capas 1-4 — retrieve → rerank → judge → synthesize.
//
export async function runAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();

  // ── Capa 0: Hash exacto ──────────────────────────────────────
  const hashResult = await checkContentHash(
    input.supabase,
    input.newDocumentText,
    input.orgId,
    input.excludeDocumentId,
  );

  if (hashResult.isDuplicateExact) {
    console.log(`[pipeline-v2] Hash match: duplicado exacto de "${hashResult.duplicateOfName}" (${Date.now() - t0}ms)`);
    return buildExactDuplicateResponse(hashResult.duplicateOfName!, 'quick');
  }

  console.log(`[pipeline-v2] Hash check: sin duplicado exacto (${Date.now() - t0}ms)`);

  // ── Capas 1-4: pipeline normal ──────────────────────────────
  const result = await runCorePipeline(input, { exhaustive: false }, 'pipeline-v2');
  return { ...result, analysisMode: 'quick' };
}

// ============================================================
// Pipeline exhaustivo — sin muestreo, sin límites, multicapa
// ============================================================

/**
 * Análisis exhaustivo completo:
 *
 * Capa 0 — Hash SHA-256: duplicados exactos (100%, coste cero).
 * Capas 1-4 — Pipeline v2 sin límites.
 * Corte temprano — Si hay solapamiento alto (≥30%) o demasiadas
 *   contradicciones (≥15), devolvemos resultado directamente.
 *   El usuario debe resolver estos problemas graves antes de
 *   gastar tiempo y dinero en un análisis más profundo.
 * Capa 5 — Extracción de afirmaciones atómicas + verificación contra corpus.
 * Capa 6 — Doble verificación: Sonnet confirma cada contradicción de Haiku.
 * Capa 7 — Análisis de estilo: ortografía, ambigüedades, sugerencias.
 */
export async function runExhaustiveAnalysisPipeline(input: ExhaustivePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();
  console.log(`[pipeline-exhaustive] Iniciando análisis exhaustivo de "${input.newDocumentName}" con ${input.sampleTexts.length} fragmentos`);

  // ── Capa 0: Hash exacto ──────────────────────────────────────
  const hashResult = await checkContentHash(
    input.supabase,
    input.newDocumentText,
    input.orgId,
    input.excludeDocumentId,
  );

  if (hashResult.isDuplicateExact) {
    console.log(`[pipeline-exhaustive] Hash match: duplicado exacto de "${hashResult.duplicateOfName}" (${Date.now() - t0}ms)`);
    return buildExactDuplicateResponse(hashResult.duplicateOfName!, 'exhaustive');
  }

  console.log(`[pipeline-exhaustive] Hash check: sin duplicado exacto (${Date.now() - t0}ms)`);

  // ── Capas 1-4 + Capa 7 (estilo en paralelo) ─────────────────
  // Pipeline v2 y análisis de estilo corren en paralelo.
  // La extracción de claims se hace DESPUÉS del pipeline v2 para
  // poder evaluar si merece la pena continuar (corte temprano).
  const [pipelineResult, styleProblems] = await Promise.all([
    runCorePipeline(input, { exhaustive: true }, 'pipeline-exhaustive'),
    analyzeStyle(input.newDocumentText, input.newDocumentName),
  ]);

  // ── Corte temprano: solapamiento alto ────────────────────────
  const highOverlaps = pipelineResult.judgments
    ?.filter(j => j.overlapPercent >= HIGH_OVERLAP_THRESHOLD) || [];

  if (highOverlaps.length > 0) {
    const topOverlap = highOverlaps.sort((a, b) => b.overlapPercent - a.overlapPercent)[0];
    const overlapSummary = highOverlaps
      .map(j => `"${j.documentName}" (${j.overlapPercent}%)`)
      .join(', ');

    console.log(`[pipeline-exhaustive] Corte temprano: solapamiento alto con ${overlapSummary} (${Date.now() - t0}ms)`);

    return {
      ...pipelineResult,
      recommendation: topOverlap.overlapPercent >= 60 ? 'NO_INDEXAR' : 'REVISAR',
      summary: `Este documento tiene un solapamiento significativo con documentos existentes: ${overlapSummary}. ` +
        `Resuelve los solapamientos antes de realizar un análisis más profundo. ` +
        `Se han encontrado también ${pipelineResult.discrepancies.length} posibles discrepancias.`,
      analysisMode: 'exhaustive',
      styleProblems,
      earlyStop: 'high_overlap',
    };
  }

  // ── Corte temprano: demasiadas contradicciones ───────────────
  const totalContradictions = pipelineResult.discrepancies.length;
  if (totalContradictions >= MAX_CONTRADICTIONS_BEFORE_CUTOFF) {
    console.log(`[pipeline-exhaustive] Corte temprano: ${totalContradictions} contradicciones (≥${MAX_CONTRADICTIONS_BEFORE_CUTOFF}) (${Date.now() - t0}ms)`);

    return {
      ...pipelineResult,
      recommendation: 'REVISAR',
      summary: `Se han encontrado al menos ${totalContradictions} discrepancias con el corpus existente. ` +
        `Es probable que haya más. Corrige las indicadas y vuelve a analizar para encontrar las restantes.`,
      analysisMode: 'exhaustive',
      styleProblems,
      earlyStop: 'too_many_contradictions',
    };
  }

  // ── Capa 5: Extracción y verificación de afirmaciones ────────
  const atomicClaims = await extractAtomicClaims(input.newDocumentText, input.newDocumentName);
  const atomicContradictions = await verifyClaimsAgainstCorpus(atomicClaims, input.orgId);

  // ── Fusionar contradicciones v2 + atómicas ───────────────────
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

  // ── Capa 6: Doble verificación con Sonnet ────────────────────
  const doubleChecked = await doubleCheckContradictions(mergedDiscrepancies);

  // ── Ajustar recomendación ────────────────────────────────────
  const hasConfirmed = doubleChecked.some(d => d.confidence === 'alta');
  const hasPossible = doubleChecked.some(d => d.confidence === 'posible');
  const hasStyleErrors = styleProblems.some(p => p.type === 'ortografia');
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
