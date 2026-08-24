import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinalAnalysis } from './analysis/types';

interface AnalysisResultInput {
  orgId: string;
  userId: string;
  documentName: string;
  analysis: FinalAnalysis;
  analysisType: 'quick' | 'exhaustive';
  documentId?: string | null;
}

interface StyleResultInput {
  orgId: string;
  userId: string;
  documentName: string;
  problemsCount: number;
}

interface ChatQueryInput {
  orgId: string;
  userId: string;
  question: string;
  sources: Array<{ documentId: string; documentName: string; score: number; chunks: number[]; totalChunks: number }>;
  answerLength: number;
}

// Resultado de una escritura persistida con comprobacion. Ver la nota de
// convencion sobre por que analysis_results NO es fire-and-forget (F-10).
export type PersistResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveAnalysisResult(
  supabase: SupabaseClient,
  input: AnalysisResultInput,
): Promise<PersistResult> {
  const { analysis, orgId, userId, documentName, analysisType, documentId } = input;

  const involvedSet = new Set<string>();
  if (analysis.isDuplicate && analysis.duplicateOf) involvedSet.add(analysis.duplicateOf);
  for (const d of analysis.discrepancies) involvedSet.add(d.existingDocument);
  for (const o of analysis.overlaps) involvedSet.add(o.existingDocument);
  if (analysis.minorInconsistencies) {
    for (const d of analysis.minorInconsistencies) involvedSet.add(d.existingDocument);
  }

  const { data, error } = await supabase.from('analysis_results').insert({
    org_id: orgId,
    user_id: userId,
    document_name: documentName,
    analysis_type: analysisType,
    contradictions_found: analysis.discrepancies.length,
    contradictions_confirmed: analysis.discrepancies.filter(d => d.confirmedBy !== undefined).length,
    minor_inconsistencies_found: analysis.minorInconsistencies?.length ?? 0,
    duplicates_found: analysis.isDuplicate ? 1 : 0,
    overlaps_found: analysis.overlaps.length,
    style_problems_found: analysis.styleProblems?.length ?? 0,
    recommendation: analysis.recommendation,
    involved_documents: involvedSet.size > 0 ? [...involvedSet] : null,
    document_id: documentId ?? null,
    analysis,
  }).select('id').single();

  if (error || !data) {
    const msg = error?.message ?? 'insert sin datos';
    console.error('[persist-analysis] saveAnalysisResult:', msg);
    return { ok: false, error: msg };
  }
  return { ok: true, id: data.id as string };
}

// Convencion de persistencia (F-10): void/fire-and-forget SOLO para telemetria
// pura (metricas, logs de uso) cuya perdida no altera lo que el usuario ve ni lo
// que el sistema decide. Todo lo que la UI lista, otra logica lee, o el usuario
// paga, se persiste con resultado comprobado (como saveAnalysisResult). La linea
// es el criterio, no la lista: saveChatQuery/saveStyleResult son telemetria hoy;
// si algun dia la UI los enseña o se facturan, cruzan la linea y se les aplica
// la misma vara.
export async function saveStyleResult(
  supabase: SupabaseClient,
  input: StyleResultInput,
): Promise<void> {
  const { error } = await supabase.from('analysis_results').insert({
    org_id: input.orgId,
    user_id: input.userId,
    document_name: input.documentName,
    analysis_type: 'style',
    contradictions_found: 0,
    contradictions_confirmed: 0,
    duplicates_found: 0,
    overlaps_found: 0,
    style_problems_found: input.problemsCount,
    recommendation: null,
    involved_documents: null,
  });

  if (error) console.error('[persist-analysis] saveStyleResult:', error.message);
}

export async function saveChatQuery(
  supabase: SupabaseClient,
  input: ChatQueryInput,
): Promise<void> {
  const { error } = await supabase.from('chat_queries').insert({
    org_id: input.orgId,
    user_id: input.userId,
    question: input.question,
    documents_used: input.sources,
    answer_length: input.answerLength,
  });

  if (error) console.error('[persist-analysis] saveChatQuery:', error.message);
}
