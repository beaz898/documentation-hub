import type { FinalAnalysis } from './types';
import { retrieveCandidates } from './retrieval';

export interface AnalyzePipelineInput {
  newDocumentText: string;
  newDocumentName: string;
  sampleTexts: string[];
  orgId: string;
  excludeDocumentId?: string;
}

/**
 * Orquestador del pipeline v2.
 * Etapas:
 *   1. Retrieval amplio (embeddings + Pinecone)           ← IMPLEMENTADO
 *   2. Rerank con LLM                                     ← próxima sesión
 *   3. Juicios individuales por documento (LLM paralelo)  ← próxima sesión
 *   4. Síntesis final                                     ← próxima sesión
 *
 * Por ahora solo devuelve un resultado provisional con los candidatos
 * para poder testear la etapa 1 de forma aislada.
 */
export async function runAnalysisPipeline(input: AnalyzePipelineInput): Promise<FinalAnalysis> {
  const candidates = await retrieveCandidates({
    sampleTexts: input.sampleTexts,
    orgId: input.orgId,
    excludeDocumentId: input.excludeDocumentId,
  });

  // TODO: Etapas 2, 3, 4 en próximas sesiones.
  // De momento devolvemos un shape compatible con el frontend pero sin juicio LLM.
  return {
    isDuplicate: false,
    duplicateOf: null,
    duplicateConfidence: 0,
    overlaps: candidates.map(c => ({
      existingDocument: c.documentName,
      description: `(pipeline v2 en construcción — candidato con ${c.fragments.length} fragmento(s) similares, maxScore ${Math.round(c.maxScore * 100)}%)`,
      severity: 'baja' as const,
      overlapPercent: Math.round(c.maxScore * 100),
    })),
    discrepancies: [],
    newInformation: 'Pipeline v2 en construcción',
    recommendation: 'REVISAR',
    summary: `Candidatos recuperados: ${candidates.length}. Las etapas de rerank, juicio y síntesis se implementarán en las próximas sesiones.`,
    judgments: [],
  };
}
