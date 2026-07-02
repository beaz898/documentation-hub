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
  'claude-haiku-4-5-20251001': {
    inputPerMillion:      0.25,
    outputPerMillion:     1.25,
    cacheWritePerMillion: 0.3125,  // 0.25 × 1.25
    cacheReadPerMillion:  0.025,   // 0.25 × 0.10
  },
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
