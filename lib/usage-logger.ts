import { createServiceClient } from '@/lib/supabase';

interface UsageLogEntry {
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
  errorMessage?: string;
  userQuery?: string;
}

/**
 * Registra una llamada al LLM en la tabla usage_logs de Supabase.
 * Es fire-and-forget: no bloquea ni lanza errores si falla el insert.
 * Si Supabase no responde o hay un error, solo se pierde el log.
 */
export function logUsage(entry: UsageLogEntry): void {
  try {
    const supabase = createServiceClient();
    supabase
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
        error_message: entry.errorMessage || null,
        user_query: entry.userQuery || null,
      })
      .then(({ error }) => {
        if (error) console.warn('[usage-logger] Insert failed:', error.message);
      });
  } catch (err) {
    console.warn('[usage-logger] Unexpected error:', err);
  }
}
