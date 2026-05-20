import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import type { AgentTask } from '@/lib/agent/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgInfo = await resolveOrg(supabase, user.id);
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }

    const { id } = await params;

    const { data: task, error: fetchErr } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !task) {
      return NextResponse.json({ error: 'Tarea no encontrada.' }, { status: 404 });
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: 'Sin acceso a esta tarea.' }, { status: 403 });
    }

    return NextResponse.json({ task: task as AgentTask });
  } catch (error: unknown) {
    console.error('[agent/tasks] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
