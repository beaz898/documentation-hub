import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { adjustCredits } from '@/lib/credits';
import type { AgentTask } from '@/lib/agent/types';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

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

    const body = await req.json() as { taskId?: string };
    const { taskId } = body;
    if (!taskId) {
      return NextResponse.json({ error: 'taskId es obligatorio.' }, { status: 400 });
    }

    // Load task
    const { data: taskRow, error: fetchErr } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchErr || !taskRow) {
      return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 });
    }
    const task = taskRow as AgentTask;

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Sin acceso a esta tarea.' }, { status: 403 });
    }
    if (TERMINAL_STATUSES.has(task.status)) {
      return NextResponse.json({
        error: 'La tarea ya ha finalizado y no se puede cancelar.',
        current_status: task.status,
      }, { status: 409 });
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from('agent_tasks')
      .update({ status: 'cancelled', completed_at: now, pending_request: null })
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      console.error('[agent/cancel] Update error:', updateErr?.message);
      return NextResponse.json({ error: 'Error cancelando la tarea.' }, { status: 500 });
    }

    // Reconcile credits
    const toReturn = Math.max(0, task.credits_estimated - task.credits_consumed);
    if (toReturn > 0) {
      await adjustCredits(supabase, orgId, toReturn, `agent_task_cancelled:${taskId}`);
    }

    return NextResponse.json({ task: updated as AgentTask });
  } catch (error: unknown) {
    console.error('[agent/cancel] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
