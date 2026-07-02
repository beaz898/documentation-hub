import { createServiceClient } from '@/lib/supabase';
import { computeCostUsd } from './llm-pricing';
import type { UsageAccumulator } from './usage-context';

export type OperationType =
  | 'chat'
  | 'analyze_quick'
  | 'analyze_exhaustive'
  | 'analyze_style'
  | 'improve'
  | 'agent';

interface UsageRow {
  org_id: string;
  user_id: string;
  operation: OperationType;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_write_tokens: number;
  cache_read_tokens: number;
  cost_usd: number;
  credits_charged: number | null;
}

/**
 * Persiste una fila en llm_usage por cada modelo del acumulador.
 * Envuelto en try/catch: si falla, el error se loggea pero nunca propaga.
 */
export async function persistLLMUsage(params: {
  accumulator: UsageAccumulator;
  orgId: string;
  userId: string;
  operation: OperationType;
  creditsCharged?: number;
}): Promise<void> {
  if (params.accumulator.size === 0) return;

  const rows: UsageRow[] = [];

  for (const [modelId, usage] of params.accumulator.entries()) {
    const total = usage.inputTokens + usage.outputTokens + usage.cacheCreationTokens + usage.cacheReadTokens;
    if (total === 0) continue;

    rows.push({
      org_id:             params.orgId,
      user_id:            params.userId,
      operation:          params.operation,
      model:              modelId,
      input_tokens:       usage.inputTokens,
      output_tokens:      usage.outputTokens,
      cache_write_tokens: usage.cacheCreationTokens,
      cache_read_tokens:  usage.cacheReadTokens,
      cost_usd:           computeCostUsd(modelId, usage),
      credits_charged:    params.creditsCharged ?? null,
    });
  }

  if (rows.length === 0) return;

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('llm_usage').insert(rows);
    if (error) {
      console.warn('[record-usage] Insert en llm_usage falló:', error.message);
    }
  } catch (err) {
    console.warn('[record-usage] Error inesperado al persistir llm_usage:', err instanceof Error ? err.message : err);
  }
}
