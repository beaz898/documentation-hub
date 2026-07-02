import { AsyncLocalStorage } from 'async_hooks';

// Contadores por modelo para una operación completa.
export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export function emptyModelUsage(): ModelUsage {
  return { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
}

// El acumulador agrupa el uso por model ID exacto (ej. 'claude-haiku-4-5-20251001').
export type UsageAccumulator = Map<string, ModelUsage>;

/**
 * Contexto AsyncLocalStorage que propaga el acumulador de tokens
 * a través de todo el árbol de llamadas de una request.
 *
 * Uso:
 *   const acc: UsageAccumulator = new Map();
 *   await usageContext.run(acc, async () => { await pipeline(...) });
 *   // acc tiene los contadores acumulados de todas las llamadas LLM
 */
export const usageContext = new AsyncLocalStorage<UsageAccumulator>();

/**
 * Acumula usage para un model ID dado en el contexto activo.
 * No lanza si no hay contexto activo (la llamada LLM fue fuera de un run()).
 */
export function recordToContext(
  modelId: string,
  usage: { inputTokens: number; outputTokens: number; cacheCreationTokens: number; cacheReadTokens: number },
): void {
  const store = usageContext.getStore();
  if (!store) return;

  const existing = store.get(modelId) ?? emptyModelUsage();
  existing.inputTokens         += usage.inputTokens;
  existing.outputTokens        += usage.outputTokens;
  existing.cacheCreationTokens += usage.cacheCreationTokens;
  existing.cacheReadTokens     += usage.cacheReadTokens;
  store.set(modelId, existing);
}
