import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { getOrgFeatures } from '@/lib/plan-features';
import { estimateCredits } from '@/lib/agent/credit-calc';
import { adjustCredits } from '@/lib/credits';
import type { ConfirmationMode } from '@/lib/agent/types';

const VALID_MODES: ConfirmationMode[] = ['step_by_step', 'milestones', 'autonomous'];
// Paso 11 añadirá hasAgent a PLAN_FEATURES; por ahora lista explícita
const PLANS_WITH_AGENT = ['business', 'business_plus', 'enterprise'];

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

    // Validate body
    const body = await req.json() as { goal?: unknown; confirmation_mode?: unknown };
    const { goal, confirmation_mode } = body;

    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json({ error: 'goal es obligatorio y no puede estar vacío.' }, { status: 400 });
    }
    if (goal.length > 2000) {
      return NextResponse.json({ error: 'goal no puede superar 2000 caracteres.' }, { status: 400 });
    }
    if (!confirmation_mode || !VALID_MODES.includes(confirmation_mode as ConfirmationMode)) {
      return NextResponse.json(
        { error: `confirmation_mode debe ser uno de: ${VALID_MODES.join(', ')}.` },
        { status: 400 }
      );
    }

    const mode = confirmation_mode as ConfirmationMode;
    const cleanGoal = goal.trim();

    // Plan check
    const features = await getOrgFeatures(supabase, orgId);
    if (!PLANS_WITH_AGENT.includes(features.plan)) {
      return NextResponse.json({
        error: 'plan_required',
        message: 'El Agente IA está disponible desde el plan Business.',
      }, { status: 403 });
    }

    const estimated = estimateCredits(cleanGoal, mode);

    // Pre-check credit balance (informational; RPC below is the authoritative check)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('credits, credits_extra')
      .eq('id', orgId)
      .single();
    const available = (orgData?.credits ?? 0) + (orgData?.credits_extra ?? 0);
    if (available < estimated) {
      return NextResponse.json({
        error: 'insufficient_credits',
        required: estimated,
        available,
      }, { status: 402 });
    }

    // Atomically consume credits
    const { data: consumeRaw, error: consumeErr } = await supabase.rpc('consume_credits', {
      p_org_id: orgId,
      p_amount: estimated,
    });

    if (consumeErr) {
      // RPC system error (function raised exception, timeout, etc.) — not a credit shortage.
      // The pre-check above already confirmed sufficient balance; log and continue.
      console.error('[agent/run] consume_credits RPC error:', consumeErr.message);
    } else {
      const consumeResult = consumeRaw as {
        success: boolean;
        credits_remaining?: number;
        credits_extra?: number;
        error?: string;
      } | null;

      if (consumeResult && !consumeResult.success) {
        // The function returned an explicit insufficient-credits response.
        return NextResponse.json({
          error: 'insufficient_credits',
          required: estimated,
          available: (consumeResult.credits_remaining ?? 0) + (consumeResult.credits_extra ?? 0),
        }, { status: 402 });
      }
    }

    // Insert task row
    const { data: newTask, error: insertErr } = await supabase
      .from('agent_tasks')
      .insert({
        org_id: orgId,
        user_id: user.id,
        goal: cleanGoal,
        confirmation_mode: mode,
        status: 'pending',
        steps: [],
        credits_estimated: estimated,
      })
      .select('id')
      .single();

    if (insertErr || !newTask) {
      console.error('[agent/run] Insert error:', insertErr?.message);
      // Refund since task was not created
      await adjustCredits(supabase, orgId, estimated, `agent_task_create_failed:${user.id}`);
      return NextResponse.json({ error: 'Error creando la tarea.' }, { status: 500 });
    }

    return NextResponse.json({ taskId: newTask.id });
  } catch (error: unknown) {
    console.error('[agent/run] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
