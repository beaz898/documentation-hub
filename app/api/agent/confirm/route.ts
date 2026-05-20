import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';
import { adjustCredits } from '@/lib/credits';
import type { AgentStep, AgentTask } from '@/lib/agent/types';

type ConfirmResponse =
  | 'approve' | 'reject' | 'modify'      // confirmation
  | 'stop' | 'ask_more' | 'improvise'    // escalation
  | 'user_input';                         // user_input

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const orgInfo = await resolveOrg(supabase, user.id);
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    const { orgId } = orgInfo;

    const body = await req.json() as {
      taskId?: string;
      response?: ConfirmResponse;
      modification?: string;
      user_input?: string;
    };
    const { taskId, response: resp, modification, user_input } = body;

    if (!taskId) return NextResponse.json({ error: 'taskId es obligatorio.' }, { status: 400 });
    if (!resp)   return NextResponse.json({ error: 'response es obligatorio.' }, { status: 400 });

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
    if (task.status !== 'awaiting_confirmation' && task.status !== 'awaiting_user') {
      return NextResponse.json({
        error: 'La tarea no está esperando respuesta.',
        current_status: task.status,
      }, { status: 409 });
    }
    if (!task.pending_request) {
      return NextResponse.json({ error: 'No hay pending_request en la tarea.' }, { status: 409 });
    }

    const pr = task.pending_request;
    const now = new Date().toISOString();
    const baseSteps: AgentStep[] = Array.isArray(task.steps) ? task.steps : [];
    const newSteps: AgentStep[] = [...baseSteps];
    let newStatus: AgentTask['status'] = 'running';
    const extraUpdates: Record<string, unknown> = {};

    // ── confirmation ──────────────────────────────────────────────────────────
    if (pr.type === 'confirmation') {
      const valid: ConfirmResponse[] = ['approve', 'reject', 'modify'];
      if (!valid.includes(resp)) {
        return NextResponse.json({
          error: `Para 'confirmation', response debe ser: ${valid.join(', ')}.`,
        }, { status: 400 });
      }

      if (resp === 'approve') {
        newSteps.push({ type: 'confirmation_response', response: 'approve', timestamp: now });

      } else if (resp === 'reject') {
        newSteps.push({ type: 'confirmation_response', response: 'reject', timestamp: now });
        newStatus = 'cancelled';
        extraUpdates.completed_at = now;
        const toReturn = Math.max(0, task.credits_estimated - task.credits_consumed);
        if (toReturn > 0) await adjustCredits(supabase, orgId, toReturn, `agent_task_reject:${taskId}`);

      } else if (resp === 'modify') {
        if (!modification || modification.trim().length === 0) {
          return NextResponse.json({ error: 'modification es obligatorio cuando response es "modify".' }, { status: 400 });
        }
        const mod = modification.trim();
        newSteps.push({ type: 'confirmation_response', response: 'modify', modification: mod, timestamp: now });
        newSteps.push({ type: 'user_message', content: mod, timestamp: now });
      }

    // ── escalation ────────────────────────────────────────────────────────────
    } else if (pr.type === 'escalation') {
      const valid: ConfirmResponse[] = ['stop', 'ask_more', 'improvise'];
      if (!valid.includes(resp)) {
        return NextResponse.json({
          error: `Para 'escalation', response debe ser: ${valid.join(', ')}.`,
        }, { status: 400 });
      }

      if (resp === 'stop') {
        newSteps.push({ type: 'escalation', reason: pr.reason, user_choice: 'stop', timestamp: now });
        newStatus = 'cancelled';
        extraUpdates.completed_at = now;
        const toReturn = Math.max(0, task.credits_estimated - task.credits_consumed);
        if (toReturn > 0) await adjustCredits(supabase, orgId, toReturn, `agent_task_stop:${taskId}`);

      } else if (resp === 'ask_more') {
        newSteps.push({ type: 'escalation', reason: pr.reason, user_choice: 'ask_more', timestamp: now });
        newSteps.push({
          type: 'user_message',
          content: 'El usuario autoriza hacerle preguntas para completar la tarea. Usa ask_user si necesitas datos.',
          timestamp: now,
        });

      } else if (resp === 'improvise') {
        newSteps.push({ type: 'escalation', reason: pr.reason, user_choice: 'improvise', timestamp: now });
        newSteps.push({
          type: 'user_message',
          content: 'El usuario autoriza improvisar fuera de la documentación. Marca claramente en tu output qué partes no vienen del corpus (usa warn además de finalize).',
          timestamp: now,
        });
      }

    // ── user_input ────────────────────────────────────────────────────────────
    } else if (pr.type === 'user_input') {
      if (resp !== 'user_input') {
        return NextResponse.json({
          error: `Para 'user_input', response debe ser "user_input".`,
        }, { status: 400 });
      }
      if (!user_input || user_input.trim().length === 0) {
        return NextResponse.json({ error: 'user_input es obligatorio cuando response es "user_input".' }, { status: 400 });
      }
      newSteps.push({ type: 'user_message', content: user_input.trim(), timestamp: now });
    }

    // Persist
    const { data: updated, error: updateErr } = await supabase
      .from('agent_tasks')
      .update({
        steps: newSteps,
        step_count: newSteps.length,
        status: newStatus,
        pending_request: null,
        ...extraUpdates,
      })
      .eq('id', taskId)
      .select('*')
      .single();

    if (updateErr || !updated) {
      console.error('[agent/confirm] Update error:', updateErr?.message);
      return NextResponse.json({ error: 'Error actualizando la tarea.' }, { status: 500 });
    }

    return NextResponse.json({ task: updated as AgentTask });
  } catch (error: unknown) {
    console.error('[agent/confirm] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
