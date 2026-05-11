import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinalAnalysis } from './analysis/types';

interface AnalysisResultInput {
  orgId: string;
  userId: string;
  documentName: string;
  analysis: FinalAnalysis;
  analysisType: 'quick' | 'exhaustive';
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
  sources: Array<{ documentId: string; documentName: string; score: number }>;
  answerLength: number;
}

export async function saveAnalysisResult(
  supabase: SupabaseClient,
  input: AnalysisResultInput,
): Promise<void> {
  const { analysis, orgId, userId, documentName, analysisType } = input;

  const involvedSet = new Set<string>();
  if (analysis.isDuplicate && analysis.duplicateOf) involvedSet.add(analysis.duplicateOf);
  for (const d of analysis.discrepancies) involvedSet.add(d.existingDocument);
  for (const o of analysis.overlaps) involvedSet.add(o.existingDocument);

  const { error } = await supabase.from('analysis_results').insert({
    org_id: orgId,
    user_id: userId,
    document_name: documentName,
    analysis_type: analysisType,
    contradictions_found: analysis.discrepancies.length,
    contradictions_confirmed: analysis.discrepancies.filter(d => d.confidence === 'alta').length,
    duplicates_found: analysis.isDuplicate ? 1 : 0,
    overlaps_found: analysis.overlaps.length,
    style_problems_found: analysis.styleProblems?.length ?? 0,
    recommendation: analysis.recommendation,
    involved_documents: involvedSet.size > 0 ? [...involvedSet] : null,
  });

  if (error) console.error('[persist-analysis] saveAnalysisResult:', error.message);
}

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
