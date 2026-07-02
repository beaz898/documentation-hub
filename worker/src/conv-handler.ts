import { createClient } from '@supabase/supabase-js';
import { runAgentTurn } from '../../lib/agent/runner-conv';
import { usageContext } from '@/lib/observability/usage-context';
import { persistLLMUsage } from '@/lib/observability/record-usage';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Threshold para considerar un turno STUCK: 5 min.
// Margen holgado sobre la duración máxima realista de una iteración ReAct
// (~3 min: callAgentLLM ~90s + 2-3 tools × ~30s). El runner refresca locked_at
// al inicio de cada iteración, así que mientras avance nunca llega a este umbral.
const STUCK_THRESHOLD_MS = 5 * 60 * 1000;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── pollConversationTurns ──────────────────────────────────────────────────────
//
// Detecta mensajes assistant con status='running' que necesitan ser procesados:
//
//   NEW    — locked_at IS NULL (recién insertado como 'running'; nunca reclamado).
//   STUCK  — locked_at < now() - 5 min (el runner que lo tenía murió o dejó de
//             refreshear el heartbeat).
//
// LOCK EXCLUSIVO (FIX 1):
// El claim es un UPDATE con WHERE locked_at IS NULL OR locked_at < ahora-5min.
// Solo el primer runner que escriba locked_at = now() se lleva la fila; cualquier
// runner concurrente en la misma ventana ve 0 filas devueltas y descarta el turno.
// Esto cierra la race condition que permitía hasta 6 runners simultáneos sobre el
// mismo mensaje (ventana FRESH 30s + poll cada 5s + lock que no protegía 'running').
//
// HEARTBEAT:
// El runner refresca locked_at al inicio de cada iteración ReAct y en el pre-bucle.
// Mientras el turno avance, locked_at nunca llegará al umbral de 5 min.
//
// PARA ESCALA HORIZONTAL (N workers):
// La implementación actual ya es correcta para múltiples instancias del worker
// gracias al UPDATE condicional sobre locked_at. No requiere cambios adicionales.

export async function pollConversationTurns(
  maxClaims: number,
  onFinish:  () => void,
): Promise<number> {
  if (maxClaims <= 0) return 0;

  const supabase = createServiceClient();
  let claimedCount = 0;

  try {
    const stuckThreshold = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();

    const { data: messages, error } = await supabase
      .from('agent_messages')
      .select('id, conversation_id')
      .eq('role', 'assistant')
      .eq('status', 'running')
      .or(`locked_at.is.null,locked_at.lt.${stuckThreshold}`)
      .order('created_at', { ascending: true })
      .limit(maxClaims);

    if (error) {
      console.error('[worker] conv: Error consultando agent_messages:', error.message);
      return 0;
    }

    if (!messages || messages.length === 0) return 0;

    // Claim atómico: UPDATE condicional sobre locked_at.
    // Solo tiene éxito si la fila aún cumple locked_at IS NULL OR locked_at < threshold,
    // garantizando que dos runners en el mismo ciclo no procesen el mismo mensaje.
    const now = new Date().toISOString();

    for (const row of messages) {
      const msg = row as { id: string; conversation_id: string };

      const { data: claimed } = await supabase
        .from('agent_messages')
        .update({ status: 'running', locked_at: now })
        .eq('id', msg.id)
        .eq('status', 'running')
        .or(`locked_at.is.null,locked_at.lt.${stuckThreshold}`)
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
    const { data: convMeta } = await supabase
      .from('agent_conversations')
      .select('org_id, user_id')
      .eq('id', conversationId)
      .single();

    const llmAcc = new Map();
    const result = await usageContext.run(llmAcc, () =>
      runAgentTurn({ supabase, conversationId, messageId })
    );
    const latencyMs = Date.now() - t0;
    console.log(
      `[worker] conv: Turno ${messageId} finalizado — status=${result.status} en ${latencyMs}ms`,
    );

    if (convMeta) {
      void persistLLMUsage({
        accumulator: llmAcc,
        orgId:       convMeta.org_id as string,
        userId:      convMeta.user_id as string,
        operation:   'agent',
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`[worker] conv: Turno ${messageId} lanzó excepción inesperada:`, errorMessage);

    // Defensivo: el runner no debería lanzar, pero si lo hace limpiamos el estado.
    const recovery = createServiceClient();
    await recovery
      .from('agent_messages')
      .update({ status: 'failed', error_message: errorMessage, locked_at: null })
      .eq('id', messageId);
    await recovery
      .from('agent_conversations')
      .update({ status: 'idle', pending_request: null })
      .eq('id', conversationId);
  }
}
