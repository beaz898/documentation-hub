import type { FinalAnalysis, PipelineOptions } from './types';
import { retrieveCandidates } from './retrieval';
import { rerankCandidates } from './rerank';
import { judgeAllDocuments } from './judge';
import { synthesizeFinalAnalysis } from './synthesize';
import { checkContentHash } from './hash-check';
import { extractAtomicClaims } from './extract-claims';
import { verifyClaimsAgainstCorpus } from './verify-claims';
import { doubleCheckContradictions } from './double-check';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AnalyzePipelineInput {
  newDocumentText: string;
  newDocumentName: string;
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
}

/** Input extendido para el pipeline exhaustivo (necesita Supabase para el hash check). */
export interface ExhaustivePipelineInput extends AnalyzePipelineInput {
  supabase: SupabaseClient;
}

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
// Pipeline rápido (v2) — con muestreo, ~12-15 s
// ============================================================

export async function runAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
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
 * Capa 5 — Extracción de afirmaciones atómicas + verificación contra corpus.
 * Capa 6 — Doble verificación: Sonnet confirma cada contradicción de Haiku.
 *
 * Capas futuras:
 * - Fase 6: corrector ortográfico determinista (LanguageTool).
 * - Fase 7: retrieval híbrido semántico + léxico BM25.
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
    return {
      isDuplicate: true,
      duplicateOf: hashResult.duplicateOfName,
      duplicateConfidence: 100,
      overlaps: [],
      discrepancies: [],
      newInformation: '',
      recommendation: 'NO_INDEXAR',
      summary: `Este documento es idéntico a "${hashResult.duplicateOfName}" que ya está indexado. No aporta información nueva.`,
      judgments: [],
      analysisMode: 'exhaustive',
    };
  }

  console.log(`[pipeline-exhaustive] Hash check: sin duplicado exacto (${Date.now() - t0}ms)`);

  // ── Capas 1-4 + Capa 5 (en paralelo) ────────────────────────
  const [pipelineResult, atomicClaims] = await Promise.all([
    runCorePipeline(input, { exhaustive: true }, 'pipeline-exhaustive'),
    extractAtomicClaims(input.newDocumentText, input.newDocumentName),
  ]);

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

  // Ajustar recomendación
  const hasConfirmed = doubleChecked.some(d => d.confidence === 'alta');
  const hasPossible = doubleChecked.some(d => d.confidence === 'posible');
  let recommendation = pipelineResult.recommendation;
  if (recommendation === 'INDEXAR' && (hasConfirmed || hasPossible)) {
    recommendation = 'REVISAR';
  }

  const totalTime = Date.now() - t0;
  console.log(`[pipeline-exhaustive] Completo en ${totalTime}ms`);

  return {
    ...pipelineResult,
    discrepancies: doubleChecked,
    recommendation,
    analysisMode: 'exhaustive',
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
