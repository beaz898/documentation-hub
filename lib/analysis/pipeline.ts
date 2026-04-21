import type { FinalAnalysis } from './types';
import { retrieveCandidates } from './retrieval';
import { rerankCandidates } from './rerank';
import { judgeAllDocuments } from './judge';
import { synthesizeFinalAnalysis } from './synthesize';

export interface AnalyzePipelineInput {
  newDocumentText: string;
  newDocumentName: string;
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
}

// ============================================================
// Núcleo compartido: retrieve → rerank → judge → synthesize
// ============================================================

interface CorePipelineInput {
  newDocumentText: string;
  newDocumentName: string;
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
}

async function runCorePipeline(
  input: CorePipelineInput,
  label: string,
): Promise<FinalAnalysis> {
  const t0 = Date.now();

  const candidates = await retrieveCandidates({
    sampleTexts: input.sampleTexts,
    orgId: input.orgId,
    excludeDocumentId: input.excludeDocumentId,
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
  });
  console.log(`[${label}] Judge: ${judgments.length} juicios emitidos (${Date.now() - t2}ms)`);

  // Pausa para liberar presupuesto de rate limit antes de la síntesis
  await new Promise(r => setTimeout(r, 1500));

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
  const result = await runCorePipeline(input, 'pipeline-v2');
  return { ...result, analysisMode: 'quick' };
}

// ============================================================
// Pipeline exhaustivo — sin muestreo, multicapa (fases 2-7)
// ============================================================

/**
 * Análisis exhaustivo: usa TODOS los fragmentos del documento nuevo
 * contra el corpus. Más lento (~45-75 s) pero sin ángulos muertos.
 *
 * Capas adicionales que se irán enchufando aquí:
 * - Fase 2: hash SHA-256 para duplicados exactos (determinista).
 * - Fase 4: extracción de afirmaciones atómicas verificadas.
 * - Fase 5: doble verificación LLM (Haiku + Sonnet).
 * - Fase 6: corrector ortográfico determinista (LanguageTool).
 * - Fase 7: retrieval híbrido semántico + léxico BM25.
 *
 * La Fase 3 (comparación sin muestreo) ya está implementada aquí:
 * el endpoint pasa todos los chunks, no un subconjunto muestreado.
 */
export async function runExhaustiveAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  console.log(`[pipeline-exhaustive] Iniciando análisis exhaustivo de "${input.newDocumentName}" con ${input.sampleTexts.length} fragmentos (sin muestreo)`);

  // Fase 3 ya activa: sampleTexts contiene TODOS los chunks (el endpoint
  // omite el muestreo cuando exhaustive=true). El núcleo no cambia.
  const result = await runCorePipeline(input, 'pipeline-exhaustive');

  // Aquí se enchufarán las capas adicionales (fases 2, 4, 5, 6, 7)
  // que enriquecen el resultado antes de devolverlo.

  return { ...result, analysisMode: 'exhaustive' };
}
