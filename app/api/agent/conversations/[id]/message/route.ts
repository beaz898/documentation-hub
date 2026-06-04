import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { estimateCredits, tokensToCredits, reconcileCredits } from '@/lib/agent/credit-calc';
import { adjustCredits } from '@/lib/credits';
import {
  insertUserMessage,
  insertAssistantMessage,
  appendStepToMessage,
  updateMessageStatus,
  updateConversationStatus,
} from '@/lib/agent/persist-conv';
import type {
  AgentConversation,
  AgentMessage,
  AgentStep,
  ConfirmationMode,
  PendingRequest,
} from '@/lib/agent/types';

// ── POST /api/agent/conversations/[id]/message ────────────────────────────────
//
// Comportamiento según conversation.status:
//
//   'idle'                 → turno nuevo: consume créditos, inserta user+assistant rows.
//   'awaiting_user'        → reanudación por ask_user: añade UserMessageStep al msg en curso.
//   'awaiting_confirmation'→ reanudación por confirmation/escalation: añade el step adecuado.
//   'running'              → 409 (salvaguarda; el frontend no debería llegar aquí).
//
// Distinción de tipos en reanudación (pending_request.type):
//   'user_input'   → body.content  → UserMessageStep
//   'confirmation' → body.response (approve/reject/modify) + body.modification? → ConfirmationResponseStep
//   'escalation'   → body.response (stop/ask_more/improvise) → EscalationStep + UserMessageStep con instrucción

const ACTIVE_MSG_STATUSES = ['running', 'awaiting_user', 'awaiting_confirmation'];

// Trunca texto a ~60 chars respetando límites de palabra cuando es posible.
function truncateTitle(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (t.length <= 60) return t;
  const cut       = t.slice(0, 60);
  const lastSpace = cut.lastIndexOf(' ');
  // Si hay un espacio suficientemente avanzado (>30 chars), cortar ahí; si no, truncar duro
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut) + '…';
}

type ConfirmResponse =
  | 'approve' | 'reject' | 'modify'
  | 'stop' | 'ask_more' | 'improvise'
  | 'expert_judgment' | 'mark_gap' | 'search_again';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: conversationId } = await params;

    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgInfo = await resolveOrg(supabase, user.id);
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    const { orgId } = orgInfo;

    const { data: convRow, error: convErr } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convErr || !convRow) {
      return NextResponse.json({ error: 'Conversación no encontrada.' }, { status: 404 });
    }

    const conv = convRow as AgentConversation;
    if (conv.org_id !== orgId) {
      return NextResponse.json({ error: 'Sin acceso a esta conversación.' }, { status: 403 });
    }

    const body = await req.json() as {
      content?:      unknown;
      response?:     unknown;
      modification?: unknown;
    };

    // ── 'running' → 409 ───────────────────────────────────────────────────────

    if (conv.status === 'running') {
      return NextResponse.json(
        { error: 'La conversación está procesando un turno activo.' },
        { status: 409 },
      );
    }

    // ── 'idle' → nuevo turno ──────────────────────────────────────────────────

    if (conv.status === 'idle') {
      const rawContent = body.content;
      if (!rawContent || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
        return NextResponse.json({ error: 'content es obligatorio para iniciar un turno.' }, { status: 400 });
      }
      if (rawContent.length > 4000) {
        return NextResponse.json({ error: 'content no puede superar 4000 caracteres.' }, { status: 400 });
      }
      const cleanContent = rawContent.trim();
      const now = new Date().toISOString();

      // Autogenerar título solo en el primer turno (title IS NULL) — cosmético, no bloquea.
      if (!conv.title) {
        const title = truncateTitle(cleanContent);
        if (title) {
          supabase
            .from('agent_conversations')
            .update({ title })
            .eq('id', conversationId)
            .is('title', null)   // guarda extra: solo si sigue siendo null (sin condición de carrera)
            .then(({ error: titleErr }) => {
              if (titleErr) console.warn('[agent/conversations/message] title update failed:', titleErr.message);
            });
        }
      }

      const estimated = estimateCredits(cleanContent, conv.confirmation_mode as ConfirmationMode);

      const { data: consumeRaw, error: consumeErr } = await supabase.rpc('consume_credits', {
        p_org_id: orgId,
        p_amount: estimated,
      });

      if (consumeErr) {
        console.error('[agent/conversations/message] consume_credits error:', consumeErr.message);
      } else {
        const result = consumeRaw as {
          success: boolean;
          credits_remaining?: number;
          credits_extra?: number;
        } | null;

        if (result && !result.success) {
          return NextResponse.json({
            error:     'insufficient_credits',
            required:  estimated,
            available: (result.credits_remaining ?? 0) + (result.credits_extra ?? 0),
          }, { status: 402 });
        }
      }

      const userMessageId = await insertUserMessage(supabase, conversationId, cleanContent);
      if (!userMessageId) {
        await adjustCredits(supabase, orgId, estimated, `agent_conv_insert_failed:${conversationId}`);
        return NextResponse.json({ error: 'Error insertando mensaje de usuario.' }, { status: 500 });
      }

      const assistantMessageId = await insertAssistantMessage(supabase, conversationId, estimated);
      if (!assistantMessageId) {
        await adjustCredits(supabase, orgId, estimated, `agent_conv_insert_failed:${conversationId}`);
        return NextResponse.json({ error: 'Error insertando mensaje del agente.' }, { status: 500 });
      }

      await updateConversationStatus(supabase, conversationId, 'running', {
        last_message_at: now,
      });

      return NextResponse.json({ userMessageId, assistantMessageId, creditsConsumed: estimated });
    }

    // ── 'awaiting_user' | 'awaiting_confirmation' → reanudación ───────────────

    if (!conv.pending_request) {
      return NextResponse.json({ error: 'No hay pending_request en la conversación.' }, { status: 409 });
    }

    const { data: activeMsgs, error: msgsErr } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .in('status', ACTIVE_MSG_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1);

    if (msgsErr || !activeMsgs || activeMsgs.length === 0) {
      return NextResponse.json({ error: 'No se encontró el mensaje activo del agente.' }, { status: 409 });
    }

    const assistantMsg = activeMsgs[0] as AgentMessage;
    const assistantMessageId = assistantMsg.id;
    const now = new Date().toISOString();
    const pr = conv.pending_request as PendingRequest;

    // ── user_input ─────────────────────────────────────────────────────────────

    if (pr.type === 'user_input') {
      const rawContent = body.content;
      if (!rawContent || typeof rawContent !== 'string' || rawContent.trim().length === 0) {
        return NextResponse.json({ error: 'content es obligatorio para responder a la pregunta.' }, { status: 400 });
      }

      const userMsgStep: AgentStep = {
        type:      'user_message',
        content:   rawContent.trim(),
        timestamp: now,
      };
      await appendStepToMessage(supabase, assistantMessageId, userMsgStep);

    // ── confirmation ───────────────────────────────────────────────────────────

    } else if (pr.type === 'confirmation') {
      const resp = body.response as ConfirmResponse | undefined;
      const valid: ConfirmResponse[] = ['approve', 'reject', 'modify'];
      if (!resp || !valid.includes(resp)) {
        return NextResponse.json({
          error: `Para confirmation, response debe ser: ${valid.join(', ')}.`,
        }, { status: 400 });
      }

      if (resp === 'approve') {
        const approveStep: AgentStep = {
          type:      'confirmation_response',
          response:  'approve',
          timestamp: now,
        };
        await appendStepToMessage(supabase, assistantMessageId, approveStep);

      } else if (resp === 'reject') {
        const rejectStep: AgentStep = {
          type:      'confirmation_response',
          response:  'reject',
          timestamp: now,
        };
        await appendStepToMessage(supabase, assistantMessageId, rejectStep);

        const creditsReal = tokensToCredits(
          assistantMsg.tokens_input ?? 0,
          assistantMsg.tokens_output ?? 0,
        );
        const refund = reconcileCredits(assistantMsg.credits_estimated ?? 0, creditsReal);

        await updateMessageStatus(supabase, assistantMessageId, 'failed', {
          error_message: 'Cancelado por el usuario (rejected)',
        });
        await updateConversationStatus(supabase, conversationId, 'idle', { pending_request: null });

        if (refund > 0) {
          await adjustCredits(supabase, orgId, refund, `agent_turn_reject:${assistantMessageId}`);
        }

        return NextResponse.json({ assistantMessageId, cancelled: true });

      } else {
        // modify
        const rawMod = body.modification;
        if (!rawMod || typeof rawMod !== 'string' || rawMod.trim().length === 0) {
          return NextResponse.json(
            { error: 'modification es obligatorio cuando response es "modify".' },
            { status: 400 },
          );
        }
        const mod = rawMod.trim();

        const modStep: AgentStep = {
          type:         'confirmation_response',
          response:     'modify',
          modification: mod,
          timestamp:    now,
        };
        await appendStepToMessage(supabase, assistantMessageId, modStep);

        const userMsgStep: AgentStep = {
          type:      'user_message',
          content:   mod,
          timestamp: now,
        };
        await appendStepToMessage(supabase, assistantMessageId, userMsgStep);
      }

    // ── escalation ─────────────────────────────────────────────────────────────

    } else if (pr.type === 'escalation') {
      const isUndocumented = pr.escalation_type === 'undocumented';
      const valid: ConfirmResponse[] = isUndocumented
        ? ['expert_judgment', 'mark_gap', 'search_again']
        : ['stop', 'ask_more', 'improvise'];

      const resp = body.response as ConfirmResponse | undefined;
      if (!resp || !valid.includes(resp)) {
        return NextResponse.json({
          error: `Para escalation, response debe ser: ${valid.join(', ')}.`,
        }, { status: 400 });
      }

      if (resp === 'stop') {
        const stopStep: AgentStep = {
          type:        'escalation',
          reason:      pr.reason,
          user_choice: 'stop',
          timestamp:   now,
        };
        await appendStepToMessage(supabase, assistantMessageId, stopStep);

        const creditsReal = tokensToCredits(
          assistantMsg.tokens_input ?? 0,
          assistantMsg.tokens_output ?? 0,
        );
        const refund = reconcileCredits(assistantMsg.credits_estimated ?? 0, creditsReal);

        await updateMessageStatus(supabase, assistantMessageId, 'failed', {
          error_message: 'Detenido por el usuario (escalation:stop)',
        });
        await updateConversationStatus(supabase, conversationId, 'idle', { pending_request: null });

        if (refund > 0) {
          await adjustCredits(supabase, orgId, refund, `agent_turn_stop:${assistantMessageId}`);
        }

        return NextResponse.json({ assistantMessageId, cancelled: true });

      } else if (isUndocumented) {
        // expert_judgment | mark_gap | search_again
        const escStep: AgentStep = {
          type:            'escalation',
          reason:          pr.reason,
          escalation_type: pr.escalation_type,
          user_choice:     resp as 'expert_judgment' | 'mark_gap' | 'search_again',
          timestamp:       now,
        };
        await appendStepToMessage(supabase, assistantMessageId, escStep);

        const instruction =
          resp === 'expert_judgment'
            ? 'El usuario ha elegido responder con criterio experto: quiere la mejor respuesta posible y esa es tu tarea. Aplica tu conocimiento del sector con plena confianza y rigor. Usa warn antes de finalize para señalar, con precisión, qué partes provienen de criterio experto general y no del corpus de la empresa — esa transparencia es parte del valor de la respuesta, no una disculpa.'
          : resp === 'mark_gap'
            ? 'El usuario ha indicado que esta información debería estar documentada. No improvises ni uses conocimiento general. Llama a finalize con un mensaje que: (1) confirme que el tema no está cubierto en el corpus actual, y (2) identifique el tipo de documento que faltaría y los apartados que probablemente debería incluir, para que el usuario sepa qué crear. NO redactes ni rellenes el contenido de ese documento: solo nombra su tipo y estructura. Generar el contenido sería precisamente lo que se quiere evitar.'
            : /* search_again */
              'El usuario ha pedido intentar de nuevo con otro enfoque. Reformula la búsqueda usando términos alternativos e intenta resolver la tarea con lo que encuentres en el corpus. Si tras la nueva búsqueda la información sigue sin aparecer, vuelve a escalar.';

        const instrStep: AgentStep = {
          type:      'user_message',
          content:   instruction,
          timestamp: now,
        };
        await appendStepToMessage(supabase, assistantMessageId, instrStep);

      } else {
        // ask_more o improvise (escalación genérica — sin cambios)
        const escStep: AgentStep = {
          type:        'escalation',
          reason:      pr.reason,
          user_choice: resp as 'ask_more' | 'improvise',
          timestamp:   now,
        };
        await appendStepToMessage(supabase, assistantMessageId, escStep);

        const instruction =
          resp === 'ask_more'
            ? 'El usuario autoriza hacerle preguntas para completar la tarea. Usa ask_user si necesitas datos.'
            : 'El usuario autoriza improvisar fuera de la documentación. Marca claramente en tu output qué partes no vienen del corpus (usa warn además de finalize).';

        const instrStep: AgentStep = {
          type:      'user_message',
          content:   instruction,
          timestamp: now,
        };
        await appendStepToMessage(supabase, assistantMessageId, instrStep);
      }

    } else {
      return NextResponse.json({ error: 'Tipo de pending_request desconocido.' }, { status: 409 });
    }

    // Set message and conversation back to running, clear pending_request.
    // locked_at se resetea a null para que el worker lo reclame por la vía rápida
    // (locked_at IS NULL) sin esperar al STUCK threshold de 5 min.
    await updateMessageStatus(supabase, assistantMessageId, 'running', { locked_at: null });
    await updateConversationStatus(supabase, conversationId, 'running', { pending_request: null });

    return NextResponse.json({ assistantMessageId });

  } catch (error: unknown) {
    console.error('[agent/conversations/[id]/message POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
