import type { FinalAnalysis, PipelineOptions } from './types';
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
// Pipeline exhaustivo — sin muestreo, sin límites arbitrarios
// ============================================================

/**
 * Análisis exhaustivo: CERO límites arbitrarios.
 * - Todos los chunks del documento nuevo (sin muestreo).
 * - Todos los fragmentos únicos por candidato (sin slice).
 * - Todos los candidatos relevantes del rerank (sin tope numérico).
 * - Documento nuevo completo en cada juicio (sin truncar).
 * - Juicios en paralelo.
 *
 * Capas adicionales que se irán enchufando aquí:
 * - Fase 2: hash SHA-256 para duplicados exactos (determinista).
 * - Fase 4: extracción de afirmaciones atómicas verificadas.
 * - Fase 5: doble verificación LLM (Haiku + Sonnet).
 * - Fase 6: corrector ortográfico determinista (LanguageTool).
 * - Fase 7: retrieval híbrido semántico + léxico BM25.
 */
export async function runExhaustiveAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  console.log(`[pipeline-exhaustive] Iniciando análisis exhaustivo de "${input.newDocumentName}" con ${input.sampleTexts.length} fragmentos (sin muestreo, sin límites)`);

  const result = await runCorePipeline(input, { exhaustive: true }, 'pipeline-exhaustive');

  // Aquí se enchufarán las capas adicionales (fases 2, 4, 5, 6, 7)
  // que enriquecen el resultado antes de devolverlo.

  return { ...result, analysisMode: 'exhaustive' };
}
