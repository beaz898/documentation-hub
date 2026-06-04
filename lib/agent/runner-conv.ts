import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AgentMessage as ConvMessage,  // fila de agent_messages
  AgentStep,
  ConversationStatus,
  MessageStatus,
  ConfirmationMode,
  PendingRequest,
  EscalationStep,
  ThinkStep,
  ToolCallStep,
  ToolResultStep,
  ToolName,
} from './types';
import { buildSystemPrompt } from './system-prompt';
import {
  appendStepToMessage,
  updateMessageStatus,
  setMessageContent,
  setPendingRequestOnConversation,
  updateConversationStatus,
  accumulateMessageTokens,
} from './persist-conv';
import {
  callAgentLLM,
  type AgentMessage as LLMMessage,  // mensaje Anthropic (user/assistant turn)
  type AssistantContent,
  type ToolResultContent,
} from './llm-call';
import { getToolDefinitions, getToolExecutor } from './tools/index';
import { shouldConfirm } from './should-confirm';
import { tokensToCredits, reconcileCredits } from './credit-calc';
import { adjustCredits } from '@/lib/credits';

const MAX_ITERATIONS = 15;

// ─────────────────────────────────────────────────────────────────────────────
// Meta-pasos: steps que se registran para la UI pero no se mandan al LLM
// ─────────────────────────────────────────────────────────────────────────────

const META_STEP_TYPES = new Set([
  'confirmation_request',
  'confirmation_response',
  'escalation',
  'warning',
  'final_output',
]);

function isMetaStep(type: string): boolean {
  return META_STEP_TYPES.has(type);
}

// ─────────────────────────────────────────────────────────────────────────────
// buildStepsIntoMessages
//
// Convierte el steps[] de UN mensaje assistant en la secuencia de mensajes
// Anthropic equivalente. Garantiza dos invariantes:
//
//   (A) Los pasos think/tool_call del mismo turno LLM van en UN SOLO bloque
//       assistant — los meta-pasos intermedios se saltan.
//   (B) Cada tool_use tiene su tool_result en el siguiente mensaje user —
//       los meta-pasos entre ellos se saltan en la búsqueda de resultados.
//
// Sin estos saltos, una confirmación pendiente entre think y tool_call
// o entre tool_call y tool_result generaría dos assistant consecutivos
// y/o un tool_use huérfano → HTTP 400 de Anthropic.
// ─────────────────────────────────────────────────────────────────────────────

function buildStepsIntoMessages(steps: AgentStep[]): LLMMessage[] {
  // Pre-computar IDs emparejados para excluir tool_calls huérfanos del historial.
  // Un tool_call sin su tool_result correspondiente (síntoma de race condition)
  // causaría HTTP 400 de Anthropic ("each tool_use must have a single result").
  const callIds   = new Set<string>();
  const resultIds = new Set<string>();
  for (const s of steps) {
    if (s.type === 'tool_call')   callIds.add((s as ToolCallStep).tool_use_id);
    if (s.type === 'tool_result') resultIds.add((s as ToolResultStep).tool_use_id);
  }
  const pairedIds = new Set([...callIds].filter(id => resultIds.has(id)));

  const messages: LLMMessage[] = [];
  let i = 0;

  while (i < steps.length) {
    const step = steps[i];

    if (step.type === 'think' || step.type === 'tool_call') {
      // Acumula bloques think/tool_call consecutivos en un único mensaje assistant
      const content: AssistantContent = [];
      let j = i;

      while (j < steps.length && (steps[j].type === 'think' || steps[j].type === 'tool_call')) {
        const s = steps[j];
        if (s.type === 'think') {
          content.push({ type: 'text', text: (s as ThinkStep).content });
        } else {
          const tc = s as ToolCallStep;
          // Solo incluir tool_calls que tienen su result emparejado
          if (pairedIds.has(tc.tool_use_id)) {
            content.push({ type: 'tool_use', id: tc.tool_use_id, name: tc.tool_name, input: tc.input });
          }
        }
        j++;
      }

      // Solo emitir el bloque assistant si tiene contenido relevante
      if (content.length > 0) {
        messages.push({ role: 'assistant', content });
      }

      // Recoge tool_results saltando meta-pasos que puedan aparecer entre
      // el grupo de tool_calls y sus resultados (caso: confirmation pause).
      const toolResults: ToolResultContent[] = [];
      const seenResultIds = new Set<string>();
      while (j < steps.length) {
        if (isMetaStep(steps[j].type)) { j++; continue; }
        if (steps[j].type !== 'tool_result') break;
        const tr = steps[j] as ToolResultStep;
        if (!seenResultIds.has(tr.tool_use_id) && pairedIds.has(tr.tool_use_id)) {
          seenResultIds.add(tr.tool_use_id);
          toolResults.push({
            type:        'tool_result',
            tool_use_id: tr.tool_use_id,
            content:     JSON.stringify(tr.output),
            is_error:    tr.is_error,
          });
        }
        j++;
      }
      // Solo emitir el bloque user si el assistant block fue emitido
      if (toolResults.length > 0 && content.length > 0) {
        messages.push({ role: 'user', content: toolResults });
      }

      i = j;
    } else if (step.type === 'user_message') {
      messages.push({ role: 'user', content: step.content });
      i++;
    } else {
      // Meta-pasos: skip en ambas direcciones
      i++;
    }
  }

  return messages;
}

// ─────────────────────────────────────────────────────────────────────────────
// buildMessagesFromHistory
//
// Construye el historial completo para Anthropic a partir de TODOS los
// mensajes de la conversación en orden created_at ASC (incluyendo el mensaje
// assistant en curso). Cada turno aporta:
//   - Fila user      → un mensaje user con content
//   - Fila assistant → 0–N mensajes via buildStepsIntoMessages
// ─────────────────────────────────────────────────────────────────────────────

export function buildMessagesFromHistory(convMessages: ConvMessage[]): LLMMessage[] {
  const result: LLMMessage[] = [];

  for (const msg of convMessages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content });
    } else {
      result.push(...buildStepsIntoMessages(msg.steps));
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// validateHistory — guard bidireccional
//
// Detecta corrupción en el historial antes de mandarla al LLM.
// Verifica ambas direcciones:
//   • tool_result sin tool_use_id (datos de versión anterior del runner)
//   • en mensajes completados: tool_use sin tool_result (tool_call huérfana)
//   • en mensajes completados: tool_result sin tool_use (resultado fantasma)
//
// Solo se validan mensajes completados (role='assistant', status='completed')
// porque el mensaje en curso puede tener tool_calls pendientes de ejecutar.
// ─────────────────────────────────────────────────────────────────────────────

function validateHistory(allMessages: ConvMessage[]): string | null {
  for (const msg of allMessages) {
    for (const step of msg.steps) {
      if (step.type === 'tool_result' && !(step as ToolResultStep).tool_use_id) {
        return `Mensaje ${msg.id}: tool_result sin tool_use_id (datos de versión anterior)`;
      }
    }

    // Detectar tool_results duplicados (síntoma de race condition entre runners)
    const resultCounts = new Map<string, number>();
    for (const step of msg.steps) {
      if (step.type === 'tool_result') {
        const id = (step as ToolResultStep).tool_use_id;
        if (id) resultCounts.set(id, (resultCounts.get(id) ?? 0) + 1);
      }
    }
    for (const [id, count] of resultCounts) {
      if (count > 1) {
        return `Mensaje ${msg.id}: tool_result duplicado para ${id} (${count} veces)`;
      }
    }

    // Mensajes fallidos: loguear huérfanos como advertencia pero no fallar el turno.
    // Son consecuencia de la race condition ya corregida; buildStepsIntoMessages
    // los excluye del historial vía pairedIds, así que no contaminan al LLM.
    if (msg.status === 'failed' && msg.role === 'assistant') {
      const failedCallIds   = new Set<string>();
      const failedResultIds = new Set<string>();
      for (const step of msg.steps) {
        if (step.type === 'tool_call')   failedCallIds.add((step as ToolCallStep).tool_use_id);
        if (step.type === 'tool_result') failedResultIds.add((step as ToolResultStep).tool_use_id);
      }
      for (const id of failedCallIds) {
        if (!failedResultIds.has(id)) {
          console.warn(`[runner-conv] validateHistory: msg fallido ${msg.id} — tool_use ${id} sin result (ignorando)`);
        }
      }
      continue;
    }

    if (msg.status !== 'completed' || msg.role !== 'assistant') continue;

    const callIds   = new Set<string>();
    const resultIds = new Set<string>();

    for (const step of msg.steps) {
      if (step.type === 'tool_call')   callIds.add((step as ToolCallStep).tool_use_id);
      if (step.type === 'tool_result') resultIds.add((step as ToolResultStep).tool_use_id);
    }

    for (const id of callIds) {
      if (!resultIds.has(id)) {
        // Huérfano: distinguir modify legítimo de corrupción real.
        // Escáner de primera señal determinante a partir del tool_call:
        //   confirmation_response:modify → tolerar (el pre-bucle lo saltó intencionadamente)
        //   tool_result o fin de array  → abortar (corrupción: crash, race condition)
        const tcIdx = msg.steps.findIndex(
          s => s.type === 'tool_call' && (s as ToolCallStep).tool_use_id === id,
        );
        let isLegitimateModify = false;
        for (let k = tcIdx + 1; k < msg.steps.length; k++) {
          const s = msg.steps[k];
          if (s.type === 'confirmation_response' && (s as { response?: string }).response === 'modify') {
            isLegitimateModify = true;
            break;
          }
          if (s.type === 'tool_result') break; // tool_result antes del modify → corrupción
        }
        if (!isLegitimateModify) {
          return `Mensaje ${msg.id}: tool_use ${id} sin tool_result en mensaje completado`;
        }
      }
    }
    for (const id of resultIds) {
      if (!callIds.has(id)) {
        return `Mensaje ${msg.id}: tool_result para ${id} sin tool_use correspondiente`;
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// findPendingToolCalls
//
// Devuelve los ToolCallSteps del mensaje en curso que no tienen todavía
// un ToolResultStep emparejado. Existe exactamente uno en el caso normal
// de resume tras confirmación aprobada.
// ─────────────────────────────────────────────────────────────────────────────

function findPendingToolCalls(steps: AgentStep[]): ToolCallStep[] {
  const executedIds = new Set<string>();
  for (const step of steps) {
    if (step.type === 'tool_result') {
      executedIds.add((step as ToolResultStep).tool_use_id);
    }
  }
  return steps
    .filter((s): s is ToolCallStep => s.type === 'tool_call')
    .filter(tc => !executedIds.has(tc.tool_use_id));
}

function findLastEscalationStep(steps: AgentStep[]): EscalationStep | undefined {
  for (let k = steps.length - 1; k >= 0; k--) {
    if (steps[k].type === 'escalation') return steps[k] as EscalationStep;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

async function refreshHeartbeat(supabase: SupabaseClient, messageId: string): Promise<void> {
  await supabase
    .from('agent_messages')
    .update({ locked_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('status', 'running');
}

async function loadAllMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<ConvMessage[]> {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    console.error('[runner-conv] loadAllMessages error:', error?.message);
    return [];
  }

  return data.map(row => ({
    ...row,
    steps: Array.isArray(row.steps) ? (row.steps as AgentStep[]) : [],
  })) as ConvMessage[];
}

function describePendingAction(toolName: string, toolInput: Record<string, unknown>): string {
  switch (toolName) {
    case 'finalize':
      return 'Entregar la respuesta final';
    case 'ask_user':
      return `Hacerte una pregunta: "${toolInput.question}"`;
    case 'escalate':
      return `Consultar contigo antes de seguir: "${toolInput.reason}"`;
    default:
      return 'Realizar la siguiente acción';
  }
}

function buildToolOutput(
  result: Awaited<ReturnType<ReturnType<typeof getToolExecutor>>>,
): Record<string, unknown> {
  if (result.kind === 'error')  return { error: result.error, details: result.details };
  if (result.kind === 'final')  return { output: result.output, citations: result.citations };
  if (result.kind === 'pause')  return { pause: true, pending_request: result.pending_request };
  return result.output;
}

async function reconcileTurnCredits(
  supabase: SupabaseClient,
  orgId: string,
  conversationId: string,
  messageId: string,
  creditsEstimated: number,
  totalInputTokens: number,
  totalOutputTokens: number,
): Promise<void> {
  const creditsReal = tokensToCredits(totalInputTokens, totalOutputTokens);
  const refund      = reconcileCredits(creditsEstimated, creditsReal);

  const { error: msgErr } = await supabase
    .from('agent_messages')
    .update({ credits_used: creditsReal })
    .eq('id', messageId);
  if (msgErr) console.error('[runner-conv] reconcile msg error:', msgErr.message);

  const { data: conv } = await supabase
    .from('agent_conversations')
    .select('total_credits_used, total_tokens_input, total_tokens_output, turn_count')
    .eq('id', conversationId)
    .single();

  if (conv) {
    const { error: convErr } = await supabase
      .from('agent_conversations')
      .update({
        total_credits_used:  ((conv.total_credits_used  as number) ?? 0) + creditsReal,
        total_tokens_input:  ((conv.total_tokens_input  as number) ?? 0) + totalInputTokens,
        total_tokens_output: ((conv.total_tokens_output as number) ?? 0) + totalOutputTokens,
        turn_count:          ((conv.turn_count          as number) ?? 0) + 1,
      })
      .eq('id', conversationId);
    if (convErr) console.error('[runner-conv] reconcile conv error:', convErr.message);
  }

  if (refund > 0) {
    await adjustCredits(supabase, orgId, refund, `agent_turn_underrun:${messageId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// handlePauseResult — centraliza la lógica de pausa (ask_user / escalate)
// ─────────────────────────────────────────────────────────────────────────────

async function handlePauseResult(
  supabase: SupabaseClient,
  messageId: string,
  conversationId: string,
  pr: PendingRequest,
): Promise<TurnOutput> {
  const isConfirmationLike = pr.type === 'confirmation' || pr.type === 'escalation';
  const msgStatus:  MessageStatus      = isConfirmationLike ? 'awaiting_confirmation' : 'awaiting_user';
  const convStatus: ConversationStatus = isConfirmationLike ? 'awaiting_confirmation' : 'awaiting_user';

  if (pr.type === 'escalation') {
    const escStep: AgentStep = {
      type:            'escalation',
      reason:          pr.reason,
      escalation_type: pr.escalation_type,
      timestamp:       new Date().toISOString(),
    };
    await appendStepToMessage(supabase, messageId, escStep);
  }

  await updateMessageStatus(supabase, messageId, msgStatus);
  await setPendingRequestOnConversation(supabase, conversationId, pr, convStatus);
  return { status: msgStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// runAgentTurn — bucle ReAct principal
// ─────────────────────────────────────────────────────────────────────────────

export interface TurnInput {
  supabase:       SupabaseClient;
  conversationId: string;
  /** ID del mensaje assistant con status='running' que se va a procesar */
  messageId:      string;
}

export interface TurnOutput {
  status: MessageStatus;
  error?: string;
}

export async function runAgentTurn(input: TurnInput): Promise<TurnOutput> {
  const { supabase, conversationId, messageId } = input;

  // Cargar metadatos de la conversación
  const { data: convRow, error: convErr } = await supabase
    .from('agent_conversations')
    .select('org_id, user_id, confirmation_mode')
    .eq('id', conversationId)
    .single();

  if (convErr || !convRow) {
    return { status: 'failed', error: 'conversation_not_found' };
  }

  const orgId:  string           = convRow.org_id as string;
  const userId: string           = convRow.user_id as string;
  const mode:   ConfirmationMode = convRow.confirmation_mode as ConfirmationMode;

  // Marcar mensaje y conversación como running (idempotente en re-claim)
  await updateMessageStatus(supabase, messageId, 'running');
  await updateConversationStatus(supabase, conversationId, 'running');

  // Cargar créditos estimados y tokens ya acumulados (no-cero en resume tras confirmación)
  const { data: msgMeta } = await supabase
    .from('agent_messages')
    .select('credits_estimated, tokens_input, tokens_output')
    .eq('id', messageId)
    .single();
  const creditsEstimated: number = (msgMeta?.credits_estimated  as number) ?? 0;
  let totalInputTokens:   number = (msgMeta?.tokens_input        as number) ?? 0;
  let totalOutputTokens:  number = (msgMeta?.tokens_output       as number) ?? 0;

  const systemPrompt = buildSystemPrompt(mode);
  const toolDefs     = getToolDefinitions();
  // ToolContext.taskId se usa como identificador del trabajo en curso; las herramientas
  // actuales no escriben en agent_tasks, por lo que messageId es correcto aquí.
  const toolCtx      = { supabase, orgId, userId, taskId: messageId };

  let isImprovising = false;

  // ── PRE-BUCLE: ejecutar tool_calls aprobadas pero aún sin resultado ────────
  //
  // Ocurre en resume tras confirmation_response(approve): el worker anterior
  // registró ToolCallStep pero fue interrumpido antes de ejecutar la tool.
  //
  // GARANTÍA DE EJECUCIÓN ÚNICA: las tools actuales son todas de solo lectura
  // (search_docs, read_doc, finalize, ask_user, escalate, warn). Un doble disparo
  // es inocuo. Cuando se añadan tools de escritura (email, factura…) se deberá
  // implementar un "reservation step" antes de ejecutar: registrar
  // ToolExecutionStartedStep(tool_use_id) y, en el re-claim, saltarse la
  // ejecución si ese step ya existe.
  {
    await refreshHeartbeat(supabase, messageId);
    const allMsgs    = await loadAllMessages(supabase, conversationId);
    const currentMsg = allMsgs.find(m => m.id === messageId);
    const pending    = findPendingToolCalls(currentMsg?.steps ?? []);

    for (const tc of pending) {
      // Re-verificar antes de ejecutar: protege contra dos runners concurrentes
      // que ambos pasaron findPendingToolCalls antes de que cualquiera escribiera
      // su ToolResultStep. El segundo runner leerá el result ya escrito y saltará.
      const freshMsgs    = await loadAllMessages(supabase, conversationId);
      const freshMsg     = freshMsgs.find(m => m.id === messageId);
      const stillPending = findPendingToolCalls(freshMsg?.steps ?? []);
      if (!stillPending.some(p => p.tool_use_id === tc.tool_use_id)) continue;

      // Si el usuario eligió "modify" para ESTA confirmación concreta, no ejecutar
      // la tool original. El tool_call queda sin tool_result → excluido de pairedIds
      // → el bloque assistant solo lleva el think text → el LLM replantea desde cero
      // guiado por el user_message con la modificación que añadió el endpoint.
      // La detección es por slice(tcIdx) para no confundir modify de un turno con
      // approve de otro cuando hay varias confirmaciones dentro del mismo mensaje.
      const freshSteps = freshMsg?.steps ?? [];
      const tcIdx      = freshSteps.findIndex(
        s => s.type === 'tool_call' && (s as ToolCallStep).tool_use_id === tc.tool_use_id
      );
      const wasModified =
        tcIdx !== -1 &&
        freshSteps
          .slice(tcIdx)
          .some(
            s =>
              s.type === 'confirmation_response' &&
              (s as { response?: string }).response === 'modify',
          );
      if (wasModified) continue;

      const executor = getToolExecutor(tc.tool_name);
      const result   = await executor(tc.input, toolCtx);

      const trStep: AgentStep = {
        type:        'tool_result',
        tool_name:   tc.tool_name,
        tool_use_id: tc.tool_use_id,
        output:      buildToolOutput(result),
        is_error:    result.kind === 'error',
        timestamp:   new Date().toISOString(),
      };
      await appendStepToMessage(supabase, messageId, trStep);

      if (result.kind === 'final') {
        await setMessageContent(supabase, messageId, result.output);
        await updateMessageStatus(supabase, messageId, 'completed');
        await updateConversationStatus(supabase, conversationId, 'idle');
        await reconcileTurnCredits(supabase, orgId, conversationId, messageId, creditsEstimated, totalInputTokens, totalOutputTokens);
        return { status: 'completed' };
      }

      if (result.kind === 'pause') {
        return handlePauseResult(supabase, messageId, conversationId, result.pending_request);
      }

      // kind='error': no fatal; el bucle principal lo verá en el historial y el LLM puede recuperarse
      // kind='data':  registrar warning si aplica
      if (result.kind === 'data' && tc.tool_name === 'warn') {
        const warnStep: AgentStep = {
          type:      'warning',
          message:   (tc.input as { message?: string }).message ?? '',
          timestamp: new Date().toISOString(),
        };
        await appendStepToMessage(supabase, messageId, warnStep);
      }
    }
  }

  // ── BUCLE ReAct ────────────────────────────────────────────────────────────

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    await refreshHeartbeat(supabase, messageId);
    // Recargar todos los mensajes (pueden haber cambiado por el pre-bucle o el resume)
    const allMessages  = await loadAllMessages(supabase, conversationId);
    const currentMsg   = allMessages.find(m => m.id === messageId);
    const currentSteps = currentMsg?.steps ?? [];

    // Detectar modo improvise desde el escalation step más reciente con user_choice
    const lastEscalation = findLastEscalationStep(currentSteps);
    if (lastEscalation?.user_choice === 'improvise') isImprovising = true;

    // Guard bidireccional: detectar corrupción antes de llamar al LLM
    const validationError = validateHistory(allMessages);
    if (validationError) {
      await updateMessageStatus(supabase, messageId, 'failed', { error_message: validationError });
      await updateConversationStatus(supabase, conversationId, 'idle');
      return { status: 'failed', error: validationError };
    }

    const messages = buildMessagesFromHistory(allMessages);

    let llmResponse;
    try {
      llmResponse = await callAgentLLM(systemPrompt, messages, toolDefs);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await updateMessageStatus(supabase, messageId, 'failed', { error_message: errMsg });
      await updateConversationStatus(supabase, conversationId, 'idle');
      return { status: 'failed', error: errMsg };
    }

    const { input_tokens, output_tokens } = llmResponse.usage;
    totalInputTokens  += input_tokens;
    totalOutputTokens += output_tokens;
    await accumulateMessageTokens(supabase, messageId, input_tokens, output_tokens);

    const textBlocks = llmResponse.content.filter(b => b.type === 'text');
    const toolBlocks = llmResponse.content.filter(b => b.type === 'tool_use');

    // Registrar think step por cada bloque de texto
    for (const block of textBlocks) {
      if (block.type !== 'text') continue;
      const thinkStep: AgentStep = {
        type:          'think',
        content:       block.text,
        timestamp:     new Date().toISOString(),
        tokens_input:  input_tokens,
        tokens_output: output_tokens,
      };
      await appendStepToMessage(supabase, messageId, thinkStep);
    }

    // Sin tool calls: el modelo terminó sin llamar a finalize
    if (toolBlocks.length === 0) {
      const finalText = textBlocks.find(b => b.type === 'text')?.text ?? '';
      await setMessageContent(supabase, messageId, finalText);
      await updateMessageStatus(supabase, messageId, 'completed');
      await updateConversationStatus(supabase, conversationId, 'idle');
      await reconcileTurnCredits(supabase, orgId, conversationId, messageId, creditsEstimated, totalInputTokens, totalOutputTokens);
      return { status: 'completed' };
    }

    // Procesar cada tool call
    for (const block of toolBlocks) {
      if (block.type !== 'tool_use') continue;

      const toolName  = block.name as ToolName;
      const toolInput = block.input;
      const toolUseId = block.id;

      const needsConfirm = shouldConfirm({
        mode,
        tool_name:           toolName,
        is_improvising:      isImprovising,
        is_over_estimate:    false, // TODO: comparar contra estimate cuando esté disponible
        has_external_effect: false,
      });

      if (needsConfirm) {
        // INVARIANTE A: registrar ToolCallStep ANTES de ConfirmationRequestStep.
        // Así think y tool_call quedan físicamente adyacentes en steps[] y
        // buildStepsIntoMessages los agrupa en UN SOLO bloque assistant.
        // El paso de confirmación va DESPUÉS y será saltado por isMetaStep().
        const tcStep: AgentStep = {
          type:        'tool_call',
          tool_name:   toolName,
          tool_use_id: toolUseId,
          input:       toolInput,
          timestamp:   new Date().toISOString(),
        };
        await appendStepToMessage(supabase, messageId, tcStep);

        const confirmStep: AgentStep = {
          type:           'confirmation_request',
          pending_action: describePendingAction(toolName, toolInput),
          timestamp:      new Date().toISOString(),
        };
        await appendStepToMessage(supabase, messageId, confirmStep);

        const pendingReq: PendingRequest = {
          type:           'confirmation',
          pending_action: describePendingAction(toolName, toolInput),
          reason:         toolName === 'finalize' ? 'finalize' : 'tool_call',
        };
        await updateMessageStatus(supabase, messageId, 'awaiting_confirmation');
        await setPendingRequestOnConversation(supabase, conversationId, pendingReq, 'awaiting_confirmation');
        return { status: 'awaiting_confirmation' };
      }

      // Registrar tool_call
      const tcStep: AgentStep = {
        type:        'tool_call',
        tool_name:   toolName,
        tool_use_id: toolUseId,
        input:       toolInput,
        timestamp:   new Date().toISOString(),
      };
      await appendStepToMessage(supabase, messageId, tcStep);

      // Ejecutar herramienta
      const executor = getToolExecutor(toolName);
      const result   = await executor(toolInput, toolCtx);

      // INVARIANTE B: registrar tool_result SIEMPRE antes de cualquier pausa,
      // garantizando que todo tool_use tiene su tool_result emparejado.
      const trStep: AgentStep = {
        type:        'tool_result',
        tool_name:   toolName,
        tool_use_id: toolUseId,
        output:      buildToolOutput(result),
        is_error:    result.kind === 'error',
        timestamp:   new Date().toISOString(),
      };
      await appendStepToMessage(supabase, messageId, trStep);

      if (result.kind === 'final') {
        await setMessageContent(supabase, messageId, result.output);
        await updateMessageStatus(supabase, messageId, 'completed');
        await updateConversationStatus(supabase, conversationId, 'idle');
        await reconcileTurnCredits(supabase, orgId, conversationId, messageId, creditsEstimated, totalInputTokens, totalOutputTokens);
        return { status: 'completed' };
      }

      if (result.kind === 'pause') {
        return handlePauseResult(supabase, messageId, conversationId, result.pending_request);
      }

      if (result.kind === 'error') {
        // No fatal: el modelo ve el error en tool_result y puede recuperarse
        continue;
      }

      // kind === 'data': registrar warning si aplica
      if (toolName === 'warn') {
        const warnStep: AgentStep = {
          type:      'warning',
          message:   (toolInput as { message?: string }).message ?? '',
          timestamp: new Date().toISOString(),
        };
        await appendStepToMessage(supabase, messageId, warnStep);
      }
    }
  }

  // Límite de iteraciones alcanzado
  const limitMsg = `Límite de iteraciones alcanzado (${MAX_ITERATIONS})`;
  await updateMessageStatus(supabase, messageId, 'failed', { error_message: limitMsg });
  await updateConversationStatus(supabase, conversationId, 'idle');
  return { status: 'failed', error: limitMsg };
}
