/**
 * Precios de API de Anthropic por modelo.
 *
 * Unidad: USD por millón de tokens.
 * ⚠ Verificar contra https://www.anthropic.com/pricing antes de cada revisión
 *   de tarifas. Última comprobación: jun-2026.
 *
 * Reglas de caché (estándar Anthropic):
 *   cache_write ≈ precio_entrada × 1.25
 *   cache_read  ≈ precio_entrada × 0.10
 */

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheWritePerMillion: number;
  cacheReadPerMillion: number;
}

// Modelos reconocidos — clave = model ID exacto que devuelve la API de Anthropic
const PRICING: Record<string, ModelPricing> = {
  // Corregido el 19/10/2026: aquí ponía 0,25 / 1,25 / 0,3125 / 0,025, la cuarta parte del precio
  // real, y nadie hizo la verificación que pide la cabecera. Las cuatro cifras de abajo las verificó
  // el arquitecto en la documentación oficial de Anthropic el 19/10/2026; la escritura de caché es
  // la de cinco minutos. Las filas de llm_usage escritas antes de este cambio conservan su cost_usd
  // con el precio malo: no se recalculan aquí, se recalculan al leerlas (SQL_F127_02).
  'claude-haiku-4-5-20251001': {
    inputPerMillion:      1.00,
    outputPerMillion:     5.00,
    cacheWritePerMillion: 1.25,    // 1,00 × 1,25, escritura de cinco minutos
    cacheReadPerMillion:  0.10,    // 1,00 × 0,10
  },
  // F-128: sólo el juez, y sólo con ANALYSIS_JUDGE_MODEL (lib/analysis/modelo-del-juez.ts). Precios
  // del tramo de prompts de menos de 100.000 tokens, que es el del juez; verificados por el
  // arquitecto en la página de Anthropic el 19/10/2026. La escritura de caché es la de cinco minutos.
  'claude-haiku-5-5': {
    inputPerMillion:      0.10,
    outputPerMillion:     0.50,
    cacheWritePerMillion: 0.125,
    cacheReadPerMillion:  0.01,
  },
  // Verificado por el arquitecto en la documentación oficial de Anthropic el 19/10/2026: coincide.
  'claude-sonnet-4-6': {
    inputPerMillion:      3.00,
    outputPerMillion:    15.00,
    cacheWritePerMillion: 3.75,    // 3.00 × 1.25
    cacheReadPerMillion:  0.30,    // 3.00 × 0.10
  },
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

/**
 * Calcula el coste real en USD dados el modelo y los contadores de tokens.
 * Si el modelo es desconocido retorna 0 y emite un aviso (nunca lanza).
 */
export function computeCostUsd(model: string, usage: TokenUsage): number {
  const pricing = PRICING[model];
  if (!pricing) {
    console.warn(`[llm-pricing] Modelo desconocido: "${model}". Coste devuelto: $0. Añadir precio en lib/observability/llm-pricing.ts.`);
    return 0;
  }

  const M = 1_000_000;
  return (
    (usage.inputTokens        * pricing.inputPerMillion)      / M +
    (usage.outputTokens       * pricing.outputPerMillion)     / M +
    (usage.cacheCreationTokens * pricing.cacheWritePerMillion) / M +
    (usage.cacheReadTokens    * pricing.cacheReadPerMillion)   / M
  );
}
