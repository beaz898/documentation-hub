import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { getOrgFeatures } from '@/lib/plan-features';
import { createConversation } from '@/lib/agent/persist-conv';
import type { ConfirmationMode, AgentConversation } from '@/lib/agent/types';

const VALID_MODES: ConfirmationMode[] = ['step_by_step', 'milestones', 'autonomous'];

// ── POST /api/agent/conversations ─────────────────────────────────────────────
// Crea una nueva conversación para el usuario en su org.
// Verifica acceso al agente vía getOrgFeatures (hasAgent).

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgInfo = await resolveOrg(supabase, user.id);
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    const { orgId } = orgInfo;

    const features = await getOrgFeatures(supabase, orgId);
    if (!features.hasAgent) {
      return NextResponse.json({
        error: 'plan_required',
        message: 'El Agente IA está disponible desde el plan Business.',
      }, { status: 403 });
    }

    const body = await req.json() as { confirmation_mode?: unknown };
    const { confirmation_mode } = body;

    if (!confirmation_mode || !VALID_MODES.includes(confirmation_mode as ConfirmationMode)) {
      return NextResponse.json(
        { error: `confirmation_mode debe ser uno de: ${VALID_MODES.join(', ')}.` },
        { status: 400 },
      );
    }

    const conversationId = await createConversation(supabase, {
      orgId,
      userId:           user.id,
      confirmationMode: confirmation_mode as ConfirmationMode,
    });

    if (!conversationId) {
      return NextResponse.json({ error: 'Error creando la conversación.' }, { status: 500 });
    }

    return NextResponse.json({ conversationId });
  } catch (error: unknown) {
    console.error('[agent/conversations POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── GET /api/agent/conversations ──────────────────────────────────────────────
// Lista las conversaciones del usuario en su org, ordenadas por last_message_at DESC.

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgInfo = await resolveOrg(supabase, user.id);
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    const { orgId } = orgInfo;

    const { data, error } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[agent/conversations GET] Error:', error.message);
      return NextResponse.json({ error: 'Error cargando conversaciones.' }, { status: 500 });
    }

    return NextResponse.json({ conversations: (data ?? []) as AgentConversation[] });
  } catch (error: unknown) {
    console.error('[agent/conversations GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
