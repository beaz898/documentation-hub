import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import type { AgentTask } from '@/lib/agent/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgInfo = await resolveOrg(supabase, user.id);
    if (!orgInfo) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }

    const { data: tasks, error: fetchErr } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('org_id', orgInfo.orgId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (fetchErr) {
      console.error('[agent/tasks] Fetch error:', fetchErr.message);
      return NextResponse.json({ error: 'Error cargando tareas.' }, { status: 500 });
    }

    return NextResponse.json({ tasks: (tasks ?? []) as AgentTask[] });
  } catch (error: unknown) {
    console.error('[agent/tasks] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
