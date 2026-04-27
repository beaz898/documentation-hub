import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Coste en créditos de cada operación.
 * Centralizado aquí para que los endpoints no repitan números mágicos.
 */
export const CREDIT_COSTS: Record<string, number> = {
  '/api/ask': 1,
  '/api/analyze-v2': 5,
  '/api/analyze-v2:exhaustive': 20,
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
 * Devuelve el coste en créditos de una operación.
 * Útil para mostrarlo en la UI o registrarlo en usage_logs.
 */
export function getCreditCost(endpoint: string, isExhaustive = false): number {
  const key = isExhaustive ? `${endpoint}:exhaustive` : endpoint;
  return CREDIT_COSTS[key] ?? 0;
}
