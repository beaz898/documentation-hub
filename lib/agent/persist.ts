import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentStep, AgentTaskStatus, Citation, PendingRequest } from './types';
import { tokensToCredits, reconcileCredits } from './credit-calc';
import { refundCredits } from '@/lib/credits';

export async function appendStep(
  supabase: SupabaseClient,
  taskId: string,
  step: AgentStep
): Promise<void> {
  const { data: task, error: fetchErr } = await supabase
    .from('agent_tasks')
    .select('steps, step_count')
    .eq('id', taskId)
    .single();

  if (fetchErr || !task) {
    console.error('[persist] appendStep fetch error:', fetchErr?.message);
    return;
  }

  const currentSteps: AgentStep[] = Array.isArray(task.steps) ? task.steps : [];
  const { error: updateErr } = await supabase
    .from('agent_tasks')
    .update({
      steps: [...currentSteps, step],
      step_count: (task.step_count ?? 0) + 1,
    })
    .eq('id', taskId);

  if (updateErr) {
    console.error('[persist] appendStep update error:', updateErr.message);
  }
}

export async function updateStatus(
  supabase: SupabaseClient,
  taskId: string,
  status: AgentTaskStatus,
  extras: Record<string, unknown> = {}
): Promise<void> {
  const update: Record<string, unknown> = { status, ...extras };

  if (status === 'running' && !('started_at' in extras)) {
    update.started_at = new Date().toISOString();
  }
  if ((status === 'completed' || status === 'failed' || status === 'cancelled') && !('completed_at' in extras)) {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('agent_tasks')
    .update(update)
    .eq('id', taskId);

  if (error) {
    console.error('[persist] updateStatus error:', error.message);
  }
}

export async function setPendingRequest(
  supabase: SupabaseClient,
  taskId: string,
  request: PendingRequest,
  status: AgentTaskStatus
): Promise<void> {
  const { error } = await supabase
    .from('agent_tasks')
    .update({ pending_request: request, status })
    .eq('id', taskId);

  if (error) {
    console.error('[persist] setPendingRequest error:', error.message);
  }
}

export async function clearPendingRequest(
  supabase: SupabaseClient,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from('agent_tasks')
    .update({ pending_request: null })
    .eq('id', taskId);

  if (error) {
    console.error('[persist] clearPendingRequest error:', error.message);
  }
}

export async function setResult(
  supabase: SupabaseClient,
  taskId: string,
  output: string,
  citations: Citation[]
): Promise<void> {
  const { error } = await supabase
    .from('agent_tasks')
    .update({
      result: { output, citations },
      status: 'completed',
      completed_at: new Date().toISOString(),
      pending_request: null,
    })
    .eq('id', taskId);

  if (error) {
    console.error('[persist] setResult error:', error.message);
  }
}

export async function accumulateTokens(
  supabase: SupabaseClient,
  taskId: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const { data: task, error: fetchErr } = await supabase
    .from('agent_tasks')
    .select('total_tokens_input, total_tokens_output')
    .eq('id', taskId)
    .single();

  if (fetchErr || !task) {
    console.error('[persist] accumulateTokens fetch error:', fetchErr?.message);
    return;
  }

  const { error } = await supabase
    .from('agent_tasks')
    .update({
      total_tokens_input:  (task.total_tokens_input  ?? 0) + inputTokens,
      total_tokens_output: (task.total_tokens_output ?? 0) + outputTokens,
    })
    .eq('id', taskId);

  if (error) {
    console.error('[persist] accumulateTokens update error:', error.message);
  }
}

export async function consumeCreditsFromTokens(
  supabase: SupabaseClient,
  orgId: string,
  taskId: string,
  totalInputTokens: number,
  totalOutputTokens: number,
  estimatedCredits: number
): Promise<void> {
  const actual = tokensToCredits(totalInputTokens, totalOutputTokens);
  const toRefund = reconcileCredits(estimatedCredits, actual);

  await supabase
    .from('agent_tasks')
    .update({ credits_consumed: actual })
    .eq('id', taskId);

  if (toRefund > 0) {
    // TODO Paso 6: adjustCredits para reconciliar (refundCredits devuelve créditos extra, no reduce consumo)
    await refundCredits(supabase, orgId, toRefund);
  }
}
