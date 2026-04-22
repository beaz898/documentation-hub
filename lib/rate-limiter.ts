import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Rate limiter por usuario y endpoint.
 *
 * Cuenta las llamadas exitosas del día actual en usage_logs.
 * Los límites se configuran por variable de entorno en Vercel:
 *
 *   RATE_LIMIT_ASK=100           (chat RAG, por defecto 100/día)
 *   RATE_LIMIT_ANALYZE=30        (análisis rápido, por defecto 30/día)
 *   RATE_LIMIT_EXHAUSTIVE=10     (análisis exhaustivo, por defecto 10/día)
 *   RATE_LIMIT_STYLE=20          (análisis de estilo, por defecto 20/día)
 *   RATE_LIMIT_IMPROVE=50        (chat de mejora, por defecto 50/día)
 *
 * Para pruebas/desarrollo: poner valores altos (ej: 9999).
 * Para desactivar: poner 0 (sin límite).
 */

/** Mapeo de endpoint → variable de entorno y límite por defecto. */
const LIMITS: Record<string, { envVar: string; defaultLimit: number }> = {
  '/api/ask':           { envVar: 'RATE_LIMIT_ASK',        defaultLimit: 100 },
  '/api/analyze-v2':    { envVar: 'RATE_LIMIT_ANALYZE',    defaultLimit: 30 },
  '/api/analyze-style': { envVar: 'RATE_LIMIT_STYLE',      defaultLimit: 20 },
  '/api/improve':       { envVar: 'RATE_LIMIT_IMPROVE',    defaultLimit: 50 },
};

/** Clave especial para análisis exhaustivo (mismo endpoint, distinto límite). */
const EXHAUSTIVE_ENV = 'RATE_LIMIT_EXHAUSTIVE';
const EXHAUSTIVE_DEFAULT = 10;

/** Resultado del check de rate limit. */
export interface RateLimitResult {
  allowed: boolean;
  /** Cuántas llamadas ha hecho hoy. */
  current: number;
  /** Límite máximo del día. */
  limit: number;
  /** Cuántas le quedan. */
  remaining: number;
}

/**
 * Comprueba si el usuario puede hacer otra llamada a este endpoint hoy.
 *
 * @param supabase - Cliente de Supabase (service role).
 * @param userId - ID del usuario.
 * @param endpoint - Ruta del endpoint (ej: '/api/ask').
 * @param isExhaustive - true si es un análisis exhaustivo (límite separado).
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  isExhaustive = false,
): Promise<RateLimitResult> {
  // Obtener el límite configurado
  const limit = getLimit(endpoint, isExhaustive);

  // 0 = sin límite
  if (limit === 0) {
    return { allowed: true, current: 0, limit: 0, remaining: Infinity };
  }

  try {
    // Contar llamadas exitosas de hoy para este usuario y endpoint
    const todayStart = getTodayStartUTC();

    // Para exhaustivo, contamos solo las llamadas que incluyen '(exhaustivo)' en user_query
    let query = supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('success', true)
      .gte('created_at', todayStart);

    if (isExhaustive) {
      query = query.ilike('user_query', '%(exhaustivo)%');
    } else if (endpoint === '/api/analyze-v2') {
      // Para análisis rápido, excluir las llamadas exhaustivas
      query = query.not('user_query', 'ilike', '%(exhaustivo)%');
    }

    const { count, error } = await query;

    if (error) {
      // Si falla la consulta, permitir (no bloquear al usuario por un error nuestro)
      console.warn('[rate-limiter] Query failed, allowing request:', error.message);
      return { allowed: true, current: 0, limit, remaining: limit };
    }

    const current = count ?? 0;
    const remaining = Math.max(0, limit - current);

    return {
      allowed: current < limit,
      current,
      limit,
      remaining,
    };
  } catch (err) {
    console.warn('[rate-limiter] Unexpected error, allowing request:', err);
    return { allowed: true, current: 0, limit, remaining: limit };
  }
}

// ============================================================
// Helpers
// ============================================================

/** Obtiene el límite configurado para un endpoint. */
function getLimit(endpoint: string, isExhaustive: boolean): number {
  if (isExhaustive) {
    const envValue = process.env[EXHAUSTIVE_ENV];
    return envValue !== undefined ? parseInt(envValue, 10) : EXHAUSTIVE_DEFAULT;
  }

  const config = LIMITS[endpoint];
  if (!config) return 0; // Endpoint no limitado

  const envValue = process.env[config.envVar];
  return envValue !== undefined ? parseInt(envValue, 10) : config.defaultLimit;
}

/** Devuelve el inicio del día actual en UTC (ISO string). */
function getTodayStartUTC(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return start.toISOString();
}
