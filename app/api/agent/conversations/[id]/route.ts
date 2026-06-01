import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import type { AgentConversation, AgentMessage } from '@/lib/agent/types';

// ── GET /api/agent/conversations/[id] ────────────────────────────────────────
// Devuelve la conversación + sus mensajes en orden created_at ASC.
// Verifica que la conversación pertenece a la org del usuario.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgInfo = await resolveOrg(supabase, user.id);
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    const { orgId } = orgInfo;

    const { data: conv, error: convErr } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversación no encontrada.' }, { status: 404 });
    }

    if (conv.org_id !== orgId) {
      return NextResponse.json({ error: 'Sin acceso a esta conversación.' }, { status: 403 });
    }

    const { data: messages, error: msgErr } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgErr) {
      console.error('[agent/conversations/[id] GET] Error:', msgErr.message);
      return NextResponse.json({ error: 'Error cargando mensajes.' }, { status: 500 });
    }

    return NextResponse.json({
      conversation: conv as AgentConversation,
      messages:     (messages ?? []) as AgentMessage[],
    });
  } catch (error: unknown) {
    console.error('[agent/conversations/[id] GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
