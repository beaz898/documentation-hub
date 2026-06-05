import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import type { AgentConversation, AgentMessage, ConfirmationMode } from '@/lib/agent/types';

// Mismo umbral que el worker (conv-handler.ts) para distinguir turno vivo de fantasma.
const STUCK_THRESHOLD_MS = 5 * 60 * 1000;

const VALID_MODES: ConfirmationMode[] = ['step_by_step', 'milestones', 'autonomous'];

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

// ── PATCH /api/agent/conversations/[id] ──────────────────────────────────────
// Actualiza confirmation_mode. Solo permitido cuando status='idle' (entre turnos).
// El frontend también deshabilita el selector cuando no está idle — doble guarda.

export async function PATCH(
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
      .select('org_id, status')
      .eq('id', id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversación no encontrada.' }, { status: 404 });
    }

    if (conv.org_id !== orgId) {
      return NextResponse.json({ error: 'Sin acceso a esta conversación.' }, { status: 403 });
    }

    if (conv.status !== 'idle') {
      return NextResponse.json(
        { error: 'Solo se puede cambiar el modo cuando la conversación está en reposo.' },
        { status: 409 },
      );
    }

    const body = await req.json() as { confirmation_mode?: unknown };
    if (!body.confirmation_mode || !VALID_MODES.includes(body.confirmation_mode as ConfirmationMode)) {
      return NextResponse.json(
        { error: `confirmation_mode debe ser uno de: ${VALID_MODES.join(', ')}.` },
        { status: 400 },
      );
    }

    const { error: updateErr } = await supabase
      .from('agent_conversations')
      .update({ confirmation_mode: body.confirmation_mode as ConfirmationMode })
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: 'Error actualizando el modo.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[agent/conversations/[id] PATCH] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE /api/agent/conversations/[id] ─────────────────────────────────────
// Borra la conversación y sus mensajes (CASCADE en FK).
// Seguridad: verifica org_id igual que GET y PATCH.
// Bloqueo: rechaza si hay un turno VIVO (status=running + locked_at reciente).
// Permite borrar si el turno es fantasma (locked_at NULL o > 5 min antiguo).

export async function DELETE(
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
      .select('org_id, status')
      .eq('id', id)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversación no encontrada.' }, { status: 404 });
    }

    if (conv.org_id !== orgId) {
      return NextResponse.json({ error: 'Sin acceso a esta conversación.' }, { status: 403 });
    }

    // Si la conversación figura como running, comprobar si el turno es real o fantasma.
    // Criterio idéntico al worker: locked_at reciente (< 5 min) = vivo → bloquear.
    if (conv.status === 'running') {
      const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();

      const { data: liveMsg } = await supabase
        .from('agent_messages')
        .select('id')
        .eq('conversation_id', id)
        .eq('role', 'assistant')
        .eq('status', 'running')
        .gt('locked_at', stuckThreshold)
        .limit(1);

      if (liveMsg && liveMsg.length > 0) {
        return NextResponse.json(
          { error: 'El agente está trabajando en esta conversación. Espera a que termine o cancélala primero.' },
          { status: 409 },
        );
      }
      // locked_at NULL o viejo: turno fantasma → permitir borrado
    }

    const { error: deleteErr } = await supabase
      .from('agent_conversations')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      console.error('[agent/conversations DELETE] Error:', deleteErr.message);
      return NextResponse.json({ error: 'Error borrando la conversación.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('[agent/conversations DELETE] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
