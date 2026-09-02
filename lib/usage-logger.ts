import { SupabaseClient } from '@supabase/supabase-js';

export interface UsageLogEntry {
  userId: string;
  orgId: string;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  latencyMs: number;
  success: boolean;
  creditsConsumed?: number;
  errorMessage?: string;
  userQuery?: string;
}

/**
 * LA AVERÍA DE UNA ETAPA QUE FALLA ABIERTA, COMO FILA DE REGISTRO
 * (regla 6, memoria del fallo, 02/09/2026).
 *
 * ⚠️ FALLAR ABIERTO ES LEGÍTIMO; SER MUDO NO. El limitador de tasa, cuando su
 * consulta falla, DEJA PASAR — y está bien elegido: no bloquear al usuario por
 * un error nuestro es una decisión de disponibilidad (F-94 P4), y fallar
 * cerrado se reconsiderará cuando haya clientes que lo justifiquen. Lo que no
 * es legítimo es que nadie sepa cuántas veces el limitador dejó de limitar.
 *
 * EL DOMICILIO ES ESTA TABLA y no el catálogo de contadores del pipeline: aquel
 * vive en un `AsyncLocalStorage` del análisis y no llega a las rutas. `usage_logs`
 * ya tiene `success`, `error_message` y `endpoint` — los tres campos que hacen
 * falta— y ya la lee la analítica.
 *
 * DEVUELVE `null` CUANDO NO HAY AVERÍA, y esa es la mitad que hay que cuidar: un
 * limitador que funciona no escribe NADA. Una fila por llamada buena sería más
 * ruido que el silencio que se viene a arreglar.
 *
 * MOTIVO DE VOCABULARIO CERRADO, como el contrato de contadores: nada derivado
 * de datos del cliente, y los dos valores distinguibles entre sí — si el
 * registro no dijera CUÁL de los dos caminos se tomó, existiría pero no
 * serviría para nada.
 *
 * TOKENS Y CRÉDITOS A CERO, y no es relleno: la avería ocurre ANTES de cobrar.
 * Una fila que dijera otra cosa mentiría en la analítica de costes.
 */
export type AveriaDeLimitador = 'consulta_fallida' | 'error_inesperado';

const MOTIVOS: Record<AveriaDeLimitador, string> = {
  consulta_fallida: 'limitador: la consulta de uso falló, se permitió la llamada',
  error_inesperado: 'limitador: error inesperado, se permitió la llamada',
};

export function filaDeAveriaDeLimitador(params: {
  averia?: AveriaDeLimitador;
  orgId: string;
  userId: string;
  endpoint: string;
}): UsageLogEntry | null {
  if (!params.averia) return null;

  return {
    userId: params.userId,
    orgId: params.orgId,
    endpoint: params.endpoint,
    model: 'ninguno',
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    success: false,
    creditsConsumed: 0,
    errorMessage: MOTIVOS[params.averia],
  };
}

/**
 * Registra la avería de un limitador que falló abierto, si la hubo.
 *
 * ⚠️ LO QUE ESTO NO PUEDE CONTAR, DECLARADO: `checkRateLimit` LEE `usage_logs`
 * con el mismo cliente con el que esto ESCRIBE en `usage_logs`. Si Supabase está
 * entero caído, el registro falla por la misma razón que la avería, y `logUsage`
 * se lo traga.
 * QUEDA CUBIERTO el caso común —la consulta que falla con la base viva: un
 * cambio de esquema, una política RLS, un timeout de esa consulta—, que hasta
 * hoy era invisible para siempre. NO QUEDA CUBIERTO el apagón completo, que es
 * invisible desde dentro por construcción. Se dice en vez de fingirse.
 */
export async function registrarAveriaDeLimitador(
  supabase: SupabaseClient,
  params: { averia?: AveriaDeLimitador; orgId: string; userId: string; endpoint: string },
): Promise<void> {
  const fila = filaDeAveriaDeLimitador(params);
  if (!fila) return;
  await logUsage(supabase, fila);
}

/**
 * Registra una llamada al LLM en la tabla usage_logs de Supabase.
 * Recibe el cliente de Supabase ya creado por el endpoint para reutilizar
 * la conexión existente en vez de crear una nueva.
 */
export async function logUsage(
  supabase: SupabaseClient,
  entry: UsageLogEntry
): Promise<void> {
  try {
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: entry.userId,
        org_id: entry.orgId,
        endpoint: entry.endpoint,
        model: entry.model,
        input_tokens: entry.inputTokens,
        output_tokens: entry.outputTokens,
        cache_creation_tokens: entry.cacheCreationTokens ?? 0,
        cache_read_tokens: entry.cacheReadTokens ?? 0,
        latency_ms: entry.latencyMs,
        success: entry.success,
        credits_consumed: entry.creditsConsumed ?? 0,
        error_message: entry.errorMessage || null,
        user_query: entry.userQuery || null,
      });

    if (error) {
      console.warn('[usage-logger] Insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[usage-logger] Unexpected error:', err);
  }
}
