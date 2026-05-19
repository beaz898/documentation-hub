import type { ConfirmationMode } from './types';

// Constantes (visibles para poder ajustarlas en un solo sitio)
export const AGENT_CREDIT_BASE = 15;
export const AGENT_CREDIT_GOAL_COMPLEXITY_BONUS = 5;   // Goal >300 chars
export const AGENT_CREDIT_STEP_BY_STEP_BONUS = 5;
export const AGENT_CREDIT_MAX_ESTIMATE = 50;

// Conversión de coste de API a créditos
// Sonnet 4.6: $3/M input, $15/M output. 1 crédito ≈ $0.01.
export const SONNET_INPUT_USD_PER_TOKEN = 3 / 1_000_000;
export const SONNET_OUTPUT_USD_PER_TOKEN = 15 / 1_000_000;
export const USD_PER_CREDIT = 0.01;

/**
 * Estima los créditos a descontar al iniciar una tarea.
 * Heurística simple, ajustable en el futuro.
 */
export function estimateCredits(
  goal: string,
  mode: ConfirmationMode
): number {
  let estimate = AGENT_CREDIT_BASE;

  if (goal.length > 300) {
    estimate += AGENT_CREDIT_GOAL_COMPLEXITY_BONUS;
  }
  if (mode === 'step_by_step') {
    estimate += AGENT_CREDIT_STEP_BY_STEP_BONUS;
  }

  return Math.min(estimate, AGENT_CREDIT_MAX_ESTIMATE);
}

/**
 * Convierte tokens consumidos a créditos.
 * Redondea hacia arriba para no infrafacturar.
 */
export function tokensToCredits(
  inputTokens: number,
  outputTokens: number
): number {
  const usd =
    inputTokens * SONNET_INPUT_USD_PER_TOKEN +
    outputTokens * SONNET_OUTPUT_USD_PER_TOKEN;
  return Math.ceil(usd / USD_PER_CREDIT);
}

/**
 * Calcula el ajuste a aplicar al final de la tarea.
 * Positivo = devolver al usuario (estimación > real).
 * Cero = consumo coincide.
 * Nunca negativo: si el real supera la estimación, el compromiso del
 * producto es no descontar extra (debió detectarse antes vía over_estimate).
 */
export function reconcileCredits(
  estimated: number,
  actualFromTokens: number
): number {
  const diff = estimated - actualFromTokens;
  return Math.max(0, diff);
}
