import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { adjustCredits } from '@/lib/credits';
import { tokensToCredits, reconcileCredits } from '@/lib/agent/credit-calc';
import { updateMessageStatus, updateConversationStatus } from '@/lib/agent/persist-conv';
import type { AgentConversation, AgentMessage } from '@/lib/agent/types';

const ACTIVE_MSG_STATUSES = ['running', 'awaiting_user', 'awaiting_confirmation'];

// ── POST /api/agent/conversations/[id]/cancel ─────────────────────────────────
// Cancela el turno activo: marca el mensaje en curso como failed,
// devuelve los créditos no consumidos y pone la conversación en idle.

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

    if (conv.status === 'idle') {
      return NextResponse.json(
        { error: 'La conversación no tiene un turno activo que cancelar.' },
        { status: 409 },
      );
    }

    // Find and cancel the active assistant message
    const { data: activeMsgs, error: msgsErr } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .in('status', ACTIVE_MSG_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!msgsErr && activeMsgs && activeMsgs.length > 0) {
      const msg = activeMsgs[0] as AgentMessage;

      const creditsReal = tokensToCredits(msg.tokens_input ?? 0, msg.tokens_output ?? 0);
      const refund      = reconcileCredits(msg.credits_estimated ?? 0, creditsReal);

      await updateMessageStatus(supabase, msg.id, 'failed', {
        error_message: 'Cancelado por el usuario',
      });

      if (refund > 0) {
        await adjustCredits(supabase, orgId, refund, `agent_turn_cancel:${msg.id}`);
      }
    }

    await updateConversationStatus(supabase, conversationId, 'idle', { pending_request: null });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[agent/conversations/[id]/cancel POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
