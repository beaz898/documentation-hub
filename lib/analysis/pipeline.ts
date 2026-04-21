import type { FinalAnalysis, PipelineOptions } from './types';
import { retrieveCandidates } from './retrieval';
import { rerankCandidates } from './rerank';
import { judgeAllDocuments } from './judge';
import { synthesizeFinalAnalysis } from './synthesize';
import { checkContentHash } from './hash-check';
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

/**
 * Análisis rápido: usa fragmentos muestreados (8-25) para comparar
 * contra el corpus. Buena relación velocidad/calidad para el día a día.
 */
export async function runAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  const result = await runCorePipeline(input, { exhaustive: false }, 'pipeline-v2');
  return { ...result, analysisMode: 'quick' };
}

// ============================================================
// Pipeline exhaustivo — sin muestreo, sin límites, multicapa
// ============================================================

/**
 * Análisis exhaustivo: CERO límites arbitrarios + capas deterministas.
 *
 * Capa 0 — Hash SHA-256: detección de duplicados exactos (100% precisión, coste cero).
 * Capa 1-4 — Pipeline v2 sin límites (retrieval, rerank, judge, synthesize).
 *
 * Capas futuras:
 * - Fase 4: extracción de afirmaciones atómicas verificadas.
 * - Fase 5: doble verificación LLM (Haiku + Sonnet).
 * - Fase 6: corrector ortográfico determinista (LanguageTool).
 * - Fase 7: retrieval híbrido semántico + léxico BM25.
 */
export async function runExhaustiveAnalysisPipeline(input: ExhaustivePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();
  console.log(`[pipeline-exhaustive] Iniciando análisis exhaustivo de "${input.newDocumentName}" con ${input.sampleTexts.length} fragmentos (sin muestreo, sin límites)`);

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

  console.log(`[pipeline-exhaustive] Hash check: no hay duplicado exacto (${Date.now() - t0}ms)`);

  // ── Capas 1-4: Pipeline v2 sin límites ───────────────────────
  const result = await runCorePipeline(input, { exhaustive: true }, 'pipeline-exhaustive');

  // Aquí se enchufarán las capas adicionales (fases 4, 5, 6, 7)

  return { ...result, analysisMode: 'exhaustive' };
}
