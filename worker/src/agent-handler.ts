import { createClient } from '@supabase/supabase-js';
import { runAgent } from '../../lib/agent/runner';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Intenta reclamar y procesar una agent_task pendiente o bloqueada (status='running'
 * sin worker activo, caso de recuperación tras caída del proceso).
 *
 * @param onFinish - Callback invocado cuando la tarea termina o falla.
 *                   Usado por index.ts para decrementar el contador de concurrencia.
 * @returns true si se reclamó una tarea (fuego y olvido iniciado), false si no había.
 */
export async function pollAgentTasks(onFinish: () => void): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    const { data: tasks, error } = await supabase
      .from('agent_tasks')
      .select('id, status')
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[worker] agent: Error consultando agent_tasks:', error.message);
      return false;
    }

    if (!tasks || tasks.length === 0) return false;

    const task = tasks[0] as { id: string; status: string };

    // Optimistic lock: only update if still in the expected status.
    // COALESCE emulated: only set started_at if task was 'pending' (started_at is null then).
    const updateData: Record<string, unknown> = { status: 'running' };
    if (task.status === 'pending') {
      updateData.started_at = new Date().toISOString();
    }

    const { data: claimed } = await supabase
      .from('agent_tasks')
      .update(updateData)
      .eq('id', task.id)
      .in('status', ['pending', 'running'])
      .select('id');

    if (!claimed || claimed.length === 0) {
      // Another worker instance claimed it first
      return false;
    }

    console.log(`[worker] agent: Procesando tarea ${task.id} (status anterior: ${task.status})`);

    processAgentTask(task.id)
      .catch(err => console.error(`[worker] agent: Error no capturado en tarea ${task.id}:`, err))
      .finally(onFinish);

    return true;
  } catch (err) {
    console.error('[worker] agent: Error en pollAgentTasks:', err);
    return false;
  }
}

async function processAgentTask(taskId: string): Promise<void> {
  const supabase = createServiceClient();
  const t0 = Date.now();

  try {
    const result = await runAgent({ supabase, taskId });
    const latencyMs = Date.now() - t0;
    console.log(`[worker] agent: Tarea ${taskId} finalizada — status=${result.status} en ${latencyMs}ms`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`[worker] agent: Tarea ${taskId} lanzó excepción inesperada:`, errorMessage);

    // Defensivo: el runner nunca debería lanzar, pero si lo hace marcamos como failed
    const supabaseRecovery = createServiceClient();
    await supabaseRecovery
      .from('agent_tasks')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);
  }
}
