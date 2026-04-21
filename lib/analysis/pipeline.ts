import type { FinalAnalysis, PipelineOptions } from './types';
import { retrieveCandidates } from './retrieval';
import { rerankCandidates } from './rerank';
import { judgeAllDocuments } from './judge';
import { synthesizeFinalAnalysis } from './synthesize';
import { checkContentHash } from './hash-check';
import { extractAtomicClaims } from './extract-claims';
import { verifyClaimsAgainstCorpus } from './verify-claims';
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
 * Análisis exhaustivo: CERO límites arbitrarios + capas deterministas + verificación atómica.
 *
 * Capa 0 — Hash SHA-256: duplicados exactos (100% precisión, coste cero).
 * Capas 1-4 — Pipeline v2 sin límites (retrieval, rerank, judge, synthesize).
 * Capa 5 — Extracción de afirmaciones atómicas + verificación individual contra corpus.
 *
 * La capa 5 detecta contradicciones que el pipeline v2 puede perder:
 * el v2 compara fragmentos, la capa 5 compara datos concretos.
 * Las contradicciones de ambas fuentes se fusionan deduplicando.
 *
 * Capas futuras:
 * - Fase 5: doble verificación LLM (Haiku + Sonnet).
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

  // ── Capas 1-4: Pipeline v2 sin límites ───────────────────────
  // ── Capa 5: Extracción y verificación atómica (en paralelo) ──
  // Ambos pueden correr a la vez: el pipeline v2 compara fragmentos,
  // la extracción atómica analiza afirmaciones individuales.
  const [pipelineResult, atomicClaims] = await Promise.all([
    runCorePipeline(input, { exhaustive: true }, 'pipeline-exhaustive'),
    extractAtomicClaims(input.newDocumentText, input.newDocumentName),
  ]);

  // Verificar afirmaciones contra el corpus
  const atomicContradictions = await verifyClaimsAgainstCorpus(atomicClaims, input.orgId);

  // ── Fusionar contradicciones ─────────────────────────────────
  // Las del pipeline v2 + las atómicas, deduplicando por tema
  const mergedDiscrepancies = mergeContradictions(
    pipelineResult.discrepancies,
    atomicContradictions.map(c => ({
      topic: c.topic,
      newDocSays: c.newDocSays,
      existingDocSays: c.existingDocSays,
      existingDocument: c.existingDocument,
    })),
  );

  const totalTime = Date.now() - t0;
  console.log(`[pipeline-exhaustive] Completo: ${pipelineResult.discrepancies.length} contradicciones v2 + ${atomicContradictions.length} atómicas → ${mergedDiscrepancies.length} totales (${totalTime}ms)`);

  // Ajustar recomendación si las contradicciones atómicas cambian el panorama
  let recommendation = pipelineResult.recommendation;
  if (recommendation === 'INDEXAR' && mergedDiscrepancies.length > 0) {
    recommendation = 'REVISAR';
  }

  return {
    ...pipelineResult,
    discrepancies: mergedDiscrepancies,
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

/**
 * Fusiona dos listas de contradicciones deduplicando por contenido.
 * Dos contradicciones se consideran duplicadas si hablan del mismo tema
 * contra el mismo documento existente y dicen cosas similares.
 */
function mergeContradictions(listA: Discrepancy[], listB: Discrepancy[]): Discrepancy[] {
  const result = [...listA];
  const existingKeys = new Set(
    listA.map(d => makeContradictionKey(d))
  );

  for (const d of listB) {
    const key = makeContradictionKey(d);
    if (!existingKeys.has(key)) {
      result.push(d);
      existingKeys.add(key);
    }
  }

  return result;
}

/** Genera una clave normalizada para deduplicar contradicciones. */
function makeContradictionKey(d: Discrepancy): string {
  const normTopic = d.topic.toLowerCase().replace(/\s+/g, ' ').trim();
  const normDoc = d.existingDocument.toLowerCase().trim();
  // Usar los primeros 50 chars de newDocSays para diferenciar contradicciones
  // del mismo tema pero sobre datos distintos
  const normClaim = d.newDocSays.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 50);
  return `${normDoc}|${normTopic}|${normClaim}`;
}
