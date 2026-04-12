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

/**
 * Pipeline completo v2.
 * 1. Retrieval amplio (Pinecone)
 * 2. Rerank con LLM
 * 3. Juicios individuales por documento (LLM paralelo)
 * 4. Síntesis final (LLM)
 */
export async function runAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  const t0 = Date.now();

  // Etapa 1
  const candidates = await retrieveCandidates({
    sampleTexts: input.sampleTexts,
    orgId: input.orgId,
    excludeDocumentId: input.excludeDocumentId,
  });
  console.log(`[pipeline-v2] Retrieval: ${candidates.length} candidatos (${Date.now() - t0}ms)`);

  if (candidates.length === 0) {
    return synthesizeFinalAnalysis({ newDocumentName: input.newDocumentName, judgments: [] });
  }

  // Etapa 2
  const t1 = Date.now();
  const reranked = await rerankCandidates({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates,
  });
  console.log(`[pipeline-v2] Rerank: ${reranked.length} seleccionados (${Date.now() - t1}ms)`);

  if (reranked.length === 0) {
    return synthesizeFinalAnalysis({ newDocumentName: input.newDocumentName, judgments: [] });
  }

  // Etapa 3
  const t2 = Date.now();
  const judgments = await judgeAllDocuments({
    newDocumentName: input.newDocumentName,
    newDocumentSample: input.newDocumentText,
    candidates: reranked,
  });
  console.log(`[pipeline-v2] Judge: ${judgments.length} juicios emitidos (${Date.now() - t2}ms)`);

  // Etapa 4
  const t3 = Date.now();
  const final = await synthesizeFinalAnalysis({
    newDocumentName: input.newDocumentName,
    judgments,
  });
  console.log(`[pipeline-v2] Synthesize (${Date.now() - t3}ms). Total: ${Date.now() - t0}ms`);

  return final;
}
