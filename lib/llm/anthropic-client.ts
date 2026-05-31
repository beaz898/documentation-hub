import type { AnthropicToolDefinition } from '../agent/tools/types';
import type {
  LLMUsage,
  LLMResponseWithUsage,
  ContentBlock,
  AgentLLMResponse,
  AgentMessage,
} from './types';
import {
  acquireRateLimit,
  recordUsage,
  currentWindowStart,
  EST_OUTPUT_TOKENS,
} from './rate-limiter';

// ── Constantes ─────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL     = 'https://api.anthropic.com/v1/messages';

const HAIKU_MODEL  = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-6';
export const AGENT_MODEL = SONNET_MODEL;

// 5 reintentos, backoff progresivo. Red de seguridad tras el rate limiter.
const MAX_RETRIES  = 5;
const RETRY_DELAYS = [2000, 5000, 10000, 15000, 20000];

// ── Tipos internos ─────────────────────────────────────────────────────────────

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
}

interface SystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

export interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  model?: 'haiku' | 'sonnet';
  system?: string | SystemBlock[];
  messages?: MessageItem[];
  cacheSystem?: boolean;
}

interface RawResult {
  body: unknown;
  inputTokens: number;
  outputTokens: number;
}

interface TextResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

// ── Constructores de payload / headers ─────────────────────────────────────────

function buildMessages(prompt: string, opts: CallOptions): MessageItem[] {
  if (opts.messages && opts.messages.length > 0) return opts.messages;
  return [{ role: 'user', content: prompt }];
}

function buildSystemBlocks(opts: CallOptions): SystemBlock[] | null {
  if (!opts.system) return null;
  if (Array.isArray(opts.system)) {
    const blocks = [...opts.system];
    if (opts.cacheSystem && blocks.length > 0) {
      blocks[blocks.length - 1] = {
        ...blocks[blocks.length - 1],
        cache_control: { type: 'ephemeral' },
      };
    }
    return blocks;
  }
  const block: SystemBlock = { type: 'text', text: opts.system };
  if (opts.cacheSystem) block.cache_control = { type: 'ephemeral' };
  return [block];
}

function buildPayload(prompt: string, opts: CallOptions): Record<string, unknown> {
  const { maxOutputTokens = 4096, temperature = 0, model = 'haiku' } = opts;
  const modelId  = model === 'sonnet' ? SONNET_MODEL : HAIKU_MODEL;
  const messages = buildMessages(prompt, opts);
  const payload: Record<string, unknown> = {
    model: modelId,
    max_tokens: maxOutputTokens,
    temperature,
    messages,
  };
  const systemBlocks = buildSystemBlocks(opts);
  if (systemBlocks) payload.system = systemBlocks;
  return payload;
}

function buildHeaders(opts: CallOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };
  if (opts.cacheSystem) headers['anthropic-beta'] = 'prompt-caching-2024-07-31';
  return headers;
}

// ── Núcleo de retry ────────────────────────────────────────────────────────────

async function callAnthropicRaw(
  payload: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<RawResult> {
  let lastError = 'unknown';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]));
    }
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        if (res.status !== 429 && res.status !== 529 && res.status < 500) break;
        continue;
      }
      const body = await res.json();
      const usageRaw = (body as Record<string, unknown>)?.usage as Record<string, number> | undefined;
      return {
        body,
        inputTokens:  usageRaw?.input_tokens  ?? 0,
        outputTokens: usageRaw?.output_tokens ?? 0,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`Anthropic API call failed after retries: ${lastError}`);
}

// ── Helpers de texto ───────────────────────────────────────────────────────────

async function callAnthropicTextWithTokens(
  prompt: string,
  opts: CallOptions,
): Promise<TextResult> {
  const { body, inputTokens, outputTokens } = await callAnthropicRaw(
    buildPayload(prompt, opts),
    buildHeaders(opts),
  );
  const d       = body as Record<string, unknown>;
  const content = d?.content as Array<Record<string, unknown>> | undefined;
  const text    = content?.[0]?.text as string | undefined;
  if (!text) throw new Error('Empty text response from Anthropic');
  return { text, inputTokens, outputTokens };
}

// ── Respuestas de texto — sin rate limiting (función interna) ──────────────────

export async function callAnthropicText(
  prompt: string,
  opts: CallOptions = {},
): Promise<string> {
  const { text } = await callAnthropicTextWithTokens(prompt, opts);
  return text;
}

// ── Respuestas con usage — record-only fire-and-forget (RAG, improve, style) ──

export async function callAnthropicWithUsage(
  prompt: string,
  opts: CallOptions = {},
): Promise<LLMResponseWithUsage> {
  // Capturar la ventana antes de la llamada para contabilizar en el minuto correcto
  const windowStart = currentWindowStart();

  const { body, inputTokens, outputTokens } = await callAnthropicRaw(
    buildPayload(prompt, opts),
    buildHeaders(opts),
  );

  const d       = body as Record<string, unknown>;
  const content = d?.content as Array<Record<string, unknown>> | undefined;
  const text    = content?.[0]?.text as string | undefined;
  if (!text) throw new Error('Empty text response from Anthropic');

  const usageRaw = d?.usage as Record<string, number> | undefined;
  const usage: LLMUsage = {
    inputTokens,
    outputTokens,
    cacheCreationTokens: usageRaw?.cache_creation_input_tokens ?? 0,
    cacheReadTokens:     usageRaw?.cache_read_input_tokens     ?? 0,
  };

  // Fire-and-forget: registra consumo para que análisis/agente vean el total real.
  // El error se loguea como warning; nunca bloquea la respuesta al usuario.
  recordUsage({
    windowStart,
    reqDelta:    1,
    inputDelta:  inputTokens,
    outputDelta: outputTokens,
  }).catch(err => console.warn('[rate-limiter] Error registrando uso RAG:', err));

  return { text, usage };
}

// ── Respuestas JSON — blocking (pipeline de análisis) ─────────────────────────

function sanitizeJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```[^\n]*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  const candidates = [cleaned.indexOf('{'), cleaned.indexOf('[')].filter(i => i !== -1);
  const firstBrace = candidates.length > 0 ? Math.min(...candidates) : -1;
  const lastBrace  = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let result   = '';
  let inString = false;
  let escape   = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape)      { result += ch; escape = false; continue; }
    if (ch === '\\') { result += ch; escape = true;  continue; }
    if (ch === '"')  { inString = !inString; result += ch; continue; }
    if (inString) {
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
    }
    result += ch;
  }
  return result;
}

function repairTruncatedJson(sanitized: string): string {
  let repaired = sanitized;
  let inString = false;
  let escape   = false;
  const stack: Array<'{' | '['> = [];

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escape)      { escape = false; continue; }
    if (ch === '\\') { escape = true;  continue; }
    if (ch === '"')  { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    if (ch === '}' && stack[stack.length - 1] === '{') stack.pop();
    if (ch === ']' && stack[stack.length - 1] === '[') stack.pop();
  }

  if (inString) repaired += '"';
  while (stack.length > 0) {
    repaired += stack.pop() === '{' ? '}' : ']';
  }
  return repaired.replace(/,(\s*[}\]])/g, '$1');
}

function tryParseJson<T>(raw: string): T {
  const sanitized = sanitizeJsonResponse(raw);
  try { return JSON.parse(sanitized) as T; } catch { /* continúa */ }
  try { return JSON.parse(repairTruncatedJson(sanitized)) as T; } catch { /* continúa */ }
  for (let end = sanitized.length; end > 0; end--) {
    if (sanitized[end - 1] === '}' || sanitized[end - 1] === ']') {
      try { return JSON.parse(sanitized.slice(0, end)) as T; } catch { continue; }
    }
  }
  throw new Error('No valid JSON could be extracted from LLM response');
}

export async function callAnthropicJson<T = unknown>(
  prompt: string,
  opts: CallOptions = {},
): Promise<T> {
  const strictSuffix = `\n\nIMPORTANTE: Responde EXCLUSIVAMENTE con un objeto JSON válido. Sin texto antes ni después, sin bloques de código, sin explicaciones. El JSON debe ser parseable directamente con JSON.parse().`;

  let adjustedPrompt = prompt;
  let adjustedOpts   = { ...opts };

  if (opts.messages && opts.messages.length > 0) {
    const msgs        = [...opts.messages];
    const lastUserIdx = msgs.reduce((acc, m, i) => m.role === 'user' ? i : acc, -1);
    if (lastUserIdx >= 0) {
      msgs[lastUserIdx] = { ...msgs[lastUserIdx], content: msgs[lastUserIdx].content + strictSuffix };
    }
    adjustedOpts   = { ...opts, messages: msgs };
    adjustedPrompt = '';
  } else {
    adjustedPrompt = prompt + strictSuffix;
  }

  const payload     = buildPayload(adjustedPrompt, adjustedOpts);
  const estInput    = Math.ceil(JSON.stringify(payload).length / 4);
  const windowStart = await acquireRateLimit(estInput, EST_OUTPUT_TOKENS.json);

  // Inicializar con estimados para que el finally tenga valores correctos incluso en error
  let finalInput:  number = estInput;
  let finalOutput: number = EST_OUTPUT_TOKENS.json;

  try {
    const r1 = await callAnthropicTextWithTokens(adjustedPrompt, adjustedOpts);
    finalInput  = r1.inputTokens;
    finalOutput = r1.outputTokens;

    try {
      return tryParseJson<T>(r1.text);
    } catch {
      console.warn('[callAnthropicJson] Parse failed, retrying. head:', r1.text.slice(0, 200));
      await new Promise(r => setTimeout(r, 1500));

      const r2 = await callAnthropicTextWithTokens(adjustedPrompt, adjustedOpts);
      finalInput  = r2.inputTokens;
      finalOutput = r2.outputTokens;

      try {
        return tryParseJson<T>(r2.text);
      } catch (err2) {
        console.warn('[callAnthropicJson] Retry parse also failed. head:', r2.text.slice(0, 200));
        throw err2;
      }
    }
  } finally {
    recordUsage({
      windowStart,
      reqDelta:    0,
      inputDelta:  finalInput  - estInput,
      outputDelta: finalOutput - EST_OUTPUT_TOKENS.json,
    }).catch(err => console.warn('[rate-limiter] Error ajustando uso de análisis:', err));
  }
}

// ── Respuestas del agente — blocking (tool_use) ────────────────────────────────

export async function callAnthropicAgent(
  systemPrompt: string,
  messages: AgentMessage[],
  tools: AnthropicToolDefinition[],
): Promise<AgentLLMResponse> {
  const payload = {
    model:       AGENT_MODEL,
    max_tokens:  4096,
    temperature: 0,
    system:      systemPrompt,
    tools,
    messages,
  };
  const headers = {
    'Content-Type':      'application/json',
    'x-api-key':         ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };

  const estInput    = Math.ceil(JSON.stringify(payload).length / 4);
  const windowStart = await acquireRateLimit(estInput, EST_OUTPUT_TOKENS.agent);

  let finalInput:  number = estInput;
  let finalOutput: number = EST_OUTPUT_TOKENS.agent;

  try {
    const { body, inputTokens, outputTokens } = await callAnthropicRaw(
      payload as Record<string, unknown>,
      headers,
    );
    finalInput  = inputTokens;
    finalOutput = outputTokens;

    const d = body as {
      stop_reason: string;
      content:     ContentBlock[];
      usage:       { input_tokens: number; output_tokens: number };
    };

    return {
      stop_reason: d.stop_reason ?? 'end_turn',
      content:     Array.isArray(d.content) ? d.content : [],
      usage: {
        input_tokens:  inputTokens,
        output_tokens: outputTokens,
      },
    };
  } finally {
    recordUsage({
      windowStart,
      reqDelta:    0,
      inputDelta:  finalInput  - estInput,
      outputDelta: finalOutput - EST_OUTPUT_TOKENS.agent,
    }).catch(err => console.warn('[rate-limiter] Error ajustando uso del agente:', err));
  }
}
