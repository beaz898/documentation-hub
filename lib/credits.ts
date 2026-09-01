import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Coste en créditos de cada operación.
 * Centralizado aquí para que los endpoints no repitan números mágicos.
 */
export const CREDIT_COSTS: Record<string, number> = {
  '/api/ask': 1,
  '/api/analyze-v2': 5,
  '/api/analyze-v2:exhaustive': 30,
  '/api/analyze-style': 2,
  '/api/improve': 1,
};

/**
 * Resultado del intento de consumir créditos.
 */
export interface ConsumeResult {
  success: boolean;
  /** Créditos del plan que quedan tras el descuento. */
  creditsRemaining: number;
  /** Créditos extra que quedan tras el descuento. */
  creditsExtra: number;
  /** De dónde se descontaron: 'plan', 'extra', 'mixed', o null si falló. */
  source: 'plan' | 'extra' | 'mixed' | null;
  /** Si falló, el motivo. */
  error?: string;
  /** Si falló por créditos insuficientes, cuántos necesitaba. */
  needed?: number;
}

/**
 * Intenta descontar créditos de la organización de forma atómica.
 *
 * Usa una función RPC en Supabase (consume_credits) que bloquea la fila
 * de la organización para evitar descuentos simultáneos.
 *
 * @param supabase - Cliente de Supabase (service role).
 * @param orgId - ID de la organización.
 * @param endpoint - Ruta del endpoint (ej: '/api/ask').
 * @param isExhaustive - true si es análisis exhaustivo (coste diferente).
 * @returns ConsumeResult con el resultado del descuento.
 */
export async function consumeCredits(
  supabase: SupabaseClient,
  orgId: string,
  endpoint: string,
  isExhaustive = false,
): Promise<ConsumeResult> {
  // Determinar el coste
  const key = isExhaustive ? `${endpoint}:exhaustive` : endpoint;
  const amount = CREDIT_COSTS[key];

  if (amount === undefined) {
    // Endpoint sin coste de créditos (ingest, documents, etc.)
    return {
      success: true,
      creditsRemaining: -1,
      creditsExtra: -1,
      source: null,
    };
  }
  
  // Verificar si la suscripción ha expirado (pasó el período de gracia)
  try {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('canceled_at, grace_period_ends_at')
      .eq('id', orgId)
      .single();

    if (orgData?.canceled_at && orgData?.grace_period_ends_at) {
      if (new Date(orgData.grace_period_ends_at) < new Date()) {
        return {
          success: false,
          creditsRemaining: 0,
          creditsExtra: 0,
          source: null,
          error: 'subscription_expired',
        };
      }
    }
  } catch (err) {
    console.warn('[credits] Error checking subscription status, allowing request:', err);
  }
  
  try {
    const { data, error } = await supabase.rpc('consume_credits', {
      p_org_id: orgId,
      p_amount: amount,
    });

    if (error) {
      console.error('[credits] RPC error:', error.message);
      // Si falla la RPC, permitir (no bloquear al usuario por error nuestro)
      return {
        success: true,
        creditsRemaining: -1,
        creditsExtra: -1,
        source: null,
      };
    }

    const result = data as {
      success: boolean;
      credits_remaining?: number;
      credits_extra?: number;
      source?: string;
      error?: string;
      needed?: number;
    };

    if (!result.success) {
      return {
        success: false,
        creditsRemaining: result.credits_remaining ?? 0,
        creditsExtra: result.credits_extra ?? 0,
        source: null,
        error: result.error,
        needed: result.needed,
      };
    }

    return {
      success: true,
      creditsRemaining: result.credits_remaining ?? 0,
      creditsExtra: result.credits_extra ?? 0,
      source: (result.source as ConsumeResult['source']) || 'plan',
    };
  } catch (err) {
    console.warn('[credits] Unexpected error, allowing request:', err);
    // Fallo inesperado: permitir (mejor servir que bloquear)
    return {
      success: true,
      creditsRemaining: -1,
      creditsExtra: -1,
      source: null,
    };
  }
}

/**
 * Ajusta el saldo de créditos de una organización (delta positivo o negativo).
 *
 * Uso exclusivo: reconciliación final de tareas del agente, desde el worker.
 * No es atómica — no usar en endpoints con riesgo de concurrencia por la misma org.
 *
 * @param delta Positivo → suma a credits. Negativo → resta de credits (mínimo 0).
 * @param reason String descriptivo para auditoría/logging.
 */
export async function adjustCredits(
  supabase: SupabaseClient,
  orgId: string,
  delta: number,
  reason: string,
): Promise<void> {
  if (delta === 0) return;

  try {
    const { data: org, error: fetchErr } = await supabase
      .from('organizations')
      .select('credits_remaining')
      .eq('id', orgId)
      .single();

    if (fetchErr || !org) {
      console.error('[credits] adjustCredits: error leyendo org:', fetchErr?.message);
      return;
    }

    const newBalance = Math.max(0, (org.credits_remaining ?? 0) + delta);

    const { error: updateErr } = await supabase
      .from('organizations')
      .update({ credits_remaining: newBalance })
      .eq('id', orgId);

    if (updateErr) {
      console.error('[credits] adjustCredits: error actualizando:', updateErr.message);
      return;
    }

    console.log('[credits] adjustCredits:', { orgId, delta, reason, newBalance });
  } catch (err) {
    console.error('[credits] adjustCredits: error inesperado:', err);
  }
}

/**
 * Devuelve el coste en créditos de una operación.
 * Útil para mostrarlo en la UI o registrarlo en usage_logs.
 */
export function getCreditCost(endpoint: string, isExhaustive = false): number {
  const key = isExhaustive ? `${endpoint}:exhaustive` : endpoint;
  return CREDIT_COSTS[key] ?? 0;
}

/**
 * LA MITAD SIMÉTRICA DEL COBRO: SE DEVUELVE SI NO SE ENTREGA (01/09/2026).
 *
 * CLAUDE.md manda descontar créditos ANTES de la operación, y es correcto —
 * hacerlo después deja que dos peticiones paralelas sobregiren. Pero esa regla
 * tiene una mitad que nadie escribió: **quien cobra por adelantado devuelve si
 * no entrega**. Hasta hoy solo la cumplían `/api/analyze-v2` y el agente;
 * `/api/ask`, `/api/analyze-style` y `/api/improve` cobraban y no devolvían
 * nunca. Si Pinecone o Anthropic caían, el usuario pagaba por un error que no
 * era suyo — y el reintento le costaba otro crédito.
 *
 * LAS DOS CONDICIONES, y las dos hacen falta:
 *
 *   · NO ENTREGADO. Una operación que respondió bien no devuelve nada, por
 *     obvio que parezca: sin esta mitad, un criterio que dijera «devuelve
 *     siempre» pasaría igual de verde y regalaría el producto entero.
 *
 *   · SE COBRÓ ALGO. `creditosCobrados` vale 0 cuando el fallo ocurrió ANTES
 *     del cobro —org no resuelta, límite de tasa, saldo insuficiente—, y es un
 *     caso frecuente: las rutas inicializan el contador a 0 y lo asignan
 *     después de `consumeCredits`. Devolver ahí regalaría créditos que nunca
 *     se cobraron.
 *
 * NO SIRVE PARA `/api/analyze-v2`, y por eso no se aplica allí: ese endpoint SÍ
 * tiene entrega parcial —un análisis con etapas caídas se entrega igual— y su
 * criterio es `stageFailures`, que es otra pregunta. Aquí «entregado» es
 * booleano porque en estos tres endpoints o hay respuesta o hay error.
 */
export function debeDevolverse(params: {
  entregado: boolean;
  creditosCobrados: number;
}): boolean {
  return !params.entregado && params.creditosCobrados > 0;
}

/**
 * Devuelve lo cobrado cuando la operación no llegó a entregarse, y lo deja
 * dicho en el log de las dos formas — devuelto o fallido al devolver.
 *
 * NO LANZA: se llama desde dentro de un `catch`, y un fallo aquí no puede tapar
 * el error original que el usuario está esperando. Si el reembolso falla, queda
 * el `console.error` con la org y el importe, que es lo que permite repararlo a
 * mano.
 */
export async function devolverSiNoSeEntrego(
  supabase: SupabaseClient,
  params: { orgId: string; creditosCobrados: number; entregado: boolean; contexto: string },
): Promise<void> {
  if (!debeDevolverse(params)) return;

  const { orgId, creditosCobrados, contexto } = params;
  try {
    const r = await refundCredits(supabase, orgId, creditosCobrados);
    if (r.success) {
      console.warn(
        `[credits] ${contexto}: no se entregó — devueltos ${creditosCobrados} créditos ` +
        `(credits_extra ahora: ${r.creditsExtra})`,
      );
    } else {
      console.error(
        `[credits] ${contexto}: no se entregó — FALLO al devolver ${creditosCobrados} ` +
        `créditos a la org ${orgId}`,
      );
    }
  } catch (err) {
    console.error(
      `[credits] ${contexto}: excepción al devolver ${creditosCobrados} créditos a la org ${orgId}:`,
      err,
    );
  }
}

/**
 * Devuelve créditos a una organización (inverso de consumeCredits).
 *
 * Los créditos devueltos se añaden a credits_extra (no al pool del plan),
 * ya que son un reembolso parcial, no una renovación de suscripción.
 */
export async function refundCredits(
  supabase: SupabaseClient,
  orgId: string,
  amount: number,
): Promise<{ success: boolean; creditsExtra: number }> {
  try {
    const { data: org, error: fetchErr } = await supabase
      .from('organizations')
      .select('credits_extra')
      .eq('id', orgId)
      .single();

    if (fetchErr || !org) {
      console.error('[credits] refundCredits: error leyendo org:', fetchErr?.message);
      return { success: false, creditsExtra: 0 };
    }

    const newExtra = (org.credits_extra ?? 0) + amount;

    const { error: updateErr } = await supabase
      .from('organizations')
      .update({ credits_extra: newExtra })
      .eq('id', orgId);

    if (updateErr) {
      console.error('[credits] refundCredits: error actualizando:', updateErr.message);
      return { success: false, creditsExtra: org.credits_extra ?? 0 };
    }

    return { success: true, creditsExtra: newExtra };
  } catch (err) {
    console.error('[credits] refundCredits: error inesperado:', err);
    return { success: false, creditsExtra: 0 };
  }
}
