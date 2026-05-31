import { createServiceClient } from '../supabase';

// ── Límites (80 % del Tier 2 de Anthropic) ────────────────────────────────────
const MAX_RPM   = 800;
const MAX_ITPM  = 360_000;
const MAX_OTPM  = 72_000;

// ── Estimaciones de output por tipo de llamada ────────────────────────────────
// El ajuste posterior con tokens reales corrige la diferencia.
export const EST_OUTPUT_TOKENS = {
  text:  800,   // RAG / texto corto (Haiku)
  json:  2500,  // Pipeline de análisis: claims, verificación, síntesis (Sonnet)
  agent: 2000,  // Agente IA: razonamiento + tool use (Sonnet)
} as const;

// ── Helpers de ventana ────────────────────────────────────────────────────────

export function currentWindowStart(): string {
  return new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
}

// ── Cliente Supabase (singleton service role) ─────────────────────────────────
let _client: ReturnType<typeof createServiceClient> | null = null;
function getClient() {
  if (!_client) _client = createServiceClient();
  return _client;
}

// ── Reserva no-bloqueante (fail-open) ─────────────────────────────────────────

type AcquireRow = {
  allowed:      boolean;
  cur_requests: number;
  cur_input:    number;
  cur_output:   number;
};

/**
 * Intenta reservar capacidad en la ventana actual.
 * Siempre fail-open: si Supabase no está disponible o el límite está saturado,
 * loguea un warning y deja pasar la llamada igualmente.
 * @returns windowStart — la ventana reservada, necesaria para el ajuste posterior.
 */
export async function acquireRateLimit(
  estInputTokens:  number,
  estOutputTokens: number,
): Promise<string> {
  const windowStart = currentWindowStart();

  try {
    const { data, error } = await getClient().rpc('try_acquire_rate_limit', {
      p_window:     windowStart,
      p_est_input:  estInputTokens,
      p_est_output: estOutputTokens,
      p_max_req:    MAX_RPM,
      p_max_input:  MAX_ITPM,
      p_max_output: MAX_OTPM,
    });

    if (error) {
      console.warn('[rate-limiter] Error Supabase — fail-open:', error.message);
      return windowStart;
    }

    const row = (data as AcquireRow[] | null)?.[0];
    if (!row) {
      console.warn('[rate-limiter] RPC sin resultado — fail-open');
      return windowStart;
    }

    if (!row.allowed) {
      const reason =
        row.cur_requests >= MAX_RPM  ? 'RPM'  :
        row.cur_input    >= MAX_ITPM ? 'ITPM' : 'OTPM';
      console.warn(
        `[rate-limiter] ${reason} saturado ` +
        `(req=${row.cur_requests} in=${row.cur_input} out=${row.cur_output}). ` +
        `Fail-open — dejando pasar la llamada.`
      );
    }

    return windowStart;
  } catch (err) {
    console.warn('[rate-limiter] Error inesperado — fail-open:', err);
    return currentWindowStart();
  }
}

// ── Registro de uso post-llamada ──────────────────────────────────────────────

export interface RecordUsageOpts {
  windowStart:  string;
  reqDelta:     number; // 0 = blocking-adjust, 1 = record-only
  inputDelta:   number; // actual − estimado (blocking) ó actual (record-only)
  outputDelta:  number;
}

/**
 * Actualiza los contadores de la ventana con el uso real.
 * Siempre registra un warning si falla; nunca lanza.
 */
export async function recordUsage(opts: RecordUsageOpts): Promise<void> {
  const { windowStart, reqDelta, inputDelta, outputDelta } = opts;
  try {
    const { error } = await getClient().rpc('adjust_rate_limit_window', {
      p_window:       windowStart,
      p_req_delta:    reqDelta,
      p_input_delta:  inputDelta,
      p_output_delta: outputDelta,
    });
    if (error) {
      console.warn('[rate-limiter] Error registrando uso:', error.message);
    }
  } catch (err) {
    console.warn('[rate-limiter] Error inesperado registrando uso:', err);
  }
}
