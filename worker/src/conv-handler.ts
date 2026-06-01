import { createClient } from '@supabase/supabase-js';
import { runAgentTurn } from '../../lib/agent/runner-conv';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── pollConversationTurns ──────────────────────────────────────────────────────
//
// Detecta mensajes assistant con status='running' que necesitan ser procesados:
//
//   FRESH   — created_at < 30s (recién insertado por el endpoint, ningún worker
//             ha empezado todavía; equivale al status='pending' de agent_tasks).
//   STUCK   — updated_at < 2min (el runner cayó a mitad del turno; recovery).
//
// agent_messages no tiene status='pending' (se insertan directamente como
// 'running'), por lo que el criterio de "no iniciado" se aproxima con la
// ventana de creación de 30 s. El trigger de Supabase mantiene updated_at
// actualizado en cada appendStepToMessage, así que un runner activo siempre
// tiene updated_at reciente y nunca cae en el criterio STUCK.
//
// CONCURRENCIA: el optimistic lock (UPDATE WHERE status='running') protege
// frente a dos workers en el mismo ciclo. Con el despliegue single-worker
// de Railway no hay race condition en la práctica. Si se escala a N workers,
// añadir una columna claimed_at con SELECT FOR UPDATE SKIP LOCKED.

// Devuelve el número de turnos efectivamente reclamados (0..maxClaims).
// Cada turno se reclama con un optimistic lock individual antes de lanzar
// su runner, igual que agent-handler hace con agent_tasks.
export async function pollConversationTurns(
  maxClaims: number,
  onFinish:  () => void,
): Promise<number> {
  if (maxClaims <= 0) return 0;

  const supabase = createServiceClient();
  let claimedCount = 0;

  try {
    const thirtySecondsAgo = new Date(Date.now() -     30 * 1000).toISOString();
    const twoMinutesAgo    = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    // Traemos hasta maxClaims candidatos en una sola consulta
    const { data: messages, error } = await supabase
      .from('agent_messages')
      .select('id, conversation_id')
      .eq('role', 'assistant')
      .eq('status', 'running')
      .or(`created_at.gt.${thirtySecondsAgo},updated_at.lt.${twoMinutesAgo}`)
      .order('created_at', { ascending: true })
      .limit(maxClaims);

    if (error) {
      console.error('[worker] conv: Error consultando agent_messages:', error.message);
      return 0;
    }

    if (!messages || messages.length === 0) return 0;

    // Optimistic lock individual por mensaje: UPDATE WHERE status='running' RETURNING id.
    //
    // LIMITACIÓN (single-worker OK, multi-worker NO):
    // Este lock protege la transición DESDE otro estado (p.ej. 'pending' → 'running'),
    // pero NO protege mensajes que YA están en 'running'. PostgreSQL devuelve la fila
    // si el WHERE matchea aunque el valor no cambie, así que dos workers concurrentes
    // haciendo UPDATE WHERE status='running' sobre el mismo mensaje AMBOS obtienen éxito.
    //
    // Con un único worker en Railway el riesgo es mínimo (solo ocurre si el poll retoma
    // un turno stuck mientras el runner original sigue vivo). Los fixes del runner lo cubren:
    //   - runner-conv.ts buildStepsIntoMessages deduplica tool_results por tool_use_id
    //     → garantía determinista de que nunca llega payload inválido a Anthropic.
    //   - runner-conv.ts validateHistory detecta duplicados y falla el turno con error claro.
    //
    // PARA ESCALA HORIZONTAL (N workers): añadir columna locked_at timestamp a agent_messages
    // y cambiar el claim a:
    //   UPDATE agent_messages
    //   SET locked_at = now()
    //   WHERE id = $1
    //     AND status = 'running'
    //     AND (locked_at IS NULL OR locked_at < now() - interval '2 min')
    //   RETURNING id
    // Eso cierra la race condition completamente.
    for (const row of messages) {
      const msg = row as { id: string; conversation_id: string };

      const { data: claimed } = await supabase
        .from('agent_messages')
        .update({ status: 'running' })
        .eq('id', msg.id)
        .eq('status', 'running')
        .select('id');

      if (!claimed || claimed.length === 0) continue;

      claimedCount++;
      console.log(`[worker] conv: Reclamado turno msg=${msg.id} conv=${msg.conversation_id}`);

      processConversationTurn(msg.id, msg.conversation_id)
        .catch(err =>
          console.error(`[worker] conv: Error no capturado en turno ${msg.id}:`, err)
        )
        .finally(onFinish);
    }

    return claimedCount;
  } catch (err) {
    console.error('[worker] conv: Error en pollConversationTurns:', err);
    return 0;
  }
}

async function processConversationTurn(
  messageId:      string,
  conversationId: string,
): Promise<void> {
  const supabase = createServiceClient();
  const t0 = Date.now();

  try {
    const result = await runAgentTurn({ supabase, conversationId, messageId });
    const latencyMs = Date.now() - t0;
    console.log(
      `[worker] conv: Turno ${messageId} finalizado — status=${result.status} en ${latencyMs}ms`,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`[worker] conv: Turno ${messageId} lanzó excepción inesperada:`, errorMessage);

    // Defensivo: el runner no debería lanzar, pero si lo hace limpiamos el estado.
    const recovery = createServiceClient();
    await recovery
      .from('agent_messages')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('id', messageId);
    await recovery
      .from('agent_conversations')
      .update({ status: 'idle', pending_request: null })
      .eq('id', conversationId);
  }
}
