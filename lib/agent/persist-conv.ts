import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AgentStep,
  ConversationStatus,
  MessageStatus,
  PendingRequest,
  ConfirmationMode,
} from './types';

// ── createConversation ─────────────────────────────────────────────────────

export async function createConversation(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    userId: string;
    confirmationMode: ConfirmationMode;
    title?: string;
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({
      org_id:            params.orgId,
      user_id:           params.userId,
      confirmation_mode: params.confirmationMode,
      title:             params.title ?? null,
      status:            'idle',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[persist-conv] createConversation error:', error?.message);
    return null;
  }
  return data.id as string;
}

// ── insertUserMessage ──────────────────────────────────────────────────────

export async function insertUserMessage(
  supabase: SupabaseClient,
  conversationId: string,
  content: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      conversation_id: conversationId,
      role:            'user',
      content,
      steps:           [],
      status:          'completed',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[persist-conv] insertUserMessage error:', error?.message);
    return null;
  }
  return data.id as string;
}

// ── insertAssistantMessage ─────────────────────────────────────────────────

export async function insertAssistantMessage(
  supabase: SupabaseClient,
  conversationId: string,
  creditsEstimated: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({
      conversation_id:   conversationId,
      role:              'assistant',
      content:           '',
      steps:             [],
      status:            'running',
      credits_estimated: creditsEstimated,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[persist-conv] insertAssistantMessage error:', error?.message);
    return null;
  }
  return data.id as string;
}

// ── appendStepToMessage ────────────────────────────────────────────────────
//
// Append atómico vía RPC: UPDATE steps = steps || jsonb_build_array($1)
// sin SELECT previo. Elimina la race condition de read-modify-write cuando
// dos runners concurrentes escriben sobre el mismo messageId.
// Lanza si la RPC falla para que el runner no continúe en estado corrupto.

export async function appendStepToMessage(
  supabase: SupabaseClient,
  messageId: string,
  step: AgentStep,
): Promise<void> {
  const { error } = await supabase.rpc('append_step_to_message', {
    p_message_id: messageId,
    p_step: step as unknown as Record<string, unknown>,
  });
  if (error) {
    throw new Error(`[persist-conv] appendStepToMessage RPC error: ${error.message}`);
  }
}

// ── updateMessageStatus ────────────────────────────────────────────────────

export async function updateMessageStatus(
  supabase: SupabaseClient,
  messageId: string,
  status: MessageStatus,
  extras: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase
    .from('agent_messages')
    .update({ status, ...extras })
    .eq('id', messageId);

  if (error) {
    console.error('[persist-conv] updateMessageStatus error:', error.message);
  }
}

// ── setMessageContent ──────────────────────────────────────────────────────
// Escribe la respuesta final en texto del mensaje assistant.

export async function setMessageContent(
  supabase: SupabaseClient,
  messageId: string,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from('agent_messages')
    .update({ content })
    .eq('id', messageId);

  if (error) {
    console.error('[persist-conv] setMessageContent error:', error.message);
  }
}

// ── setPendingRequestOnConversation ────────────────────────────────────────

export async function setPendingRequestOnConversation(
  supabase: SupabaseClient,
  conversationId: string,
  request: PendingRequest,
  status: ConversationStatus,
): Promise<void> {
  const { error } = await supabase
    .from('agent_conversations')
    .update({ pending_request: request, status })
    .eq('id', conversationId);

  if (error) {
    console.error('[persist-conv] setPendingRequestOnConversation error:', error.message);
  }
}

// ── clearPendingRequest ────────────────────────────────────────────────────

export async function clearPendingRequest(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('agent_conversations')
    .update({ pending_request: null })
    .eq('id', conversationId);

  if (error) {
    console.error('[persist-conv] clearPendingRequest error:', error.message);
  }
}

// ── updateConversationStatus ───────────────────────────────────────────────

export async function updateConversationStatus(
  supabase: SupabaseClient,
  conversationId: string,
  status: ConversationStatus,
  extras: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase
    .from('agent_conversations')
    .update({ status, ...extras })
    .eq('id', conversationId);

  if (error) {
    console.error('[persist-conv] updateConversationStatus error:', error.message);
  }
}

// ── accumulateMessageTokens ────────────────────────────────────────────────
// Lee los contadores actuales y suma, igual que accumulateTokens en persist.ts.

export async function accumulateMessageTokens(
  supabase: SupabaseClient,
  messageId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const { data: msg, error: fetchErr } = await supabase
    .from('agent_messages')
    .select('tokens_input, tokens_output')
    .eq('id', messageId)
    .single();

  if (fetchErr || !msg) {
    console.error('[persist-conv] accumulateMessageTokens fetch error:', fetchErr?.message);
    return;
  }

  const { error } = await supabase
    .from('agent_messages')
    .update({
      tokens_input:  ((msg.tokens_input  as number) ?? 0) + inputTokens,
      tokens_output: ((msg.tokens_output as number) ?? 0) + outputTokens,
    })
    .eq('id', messageId);

  if (error) {
    console.error('[persist-conv] accumulateMessageTokens update error:', error.message);
  }
}
