const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Modelos: Haiku para la mayoría de llamadas (rápido, barato, suficiente).
// Sonnet solo si una llamada concreta lo pide explícitamente (mejor razonamiento).
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-6';

interface MessageItem {
  role: 'user' | 'assistant';
  content: string;
}

interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  model?: 'haiku' | 'sonnet';
  system?: string;
  messages?: MessageItem[];
}

/**
 * Construye el array de mensajes para la API de Anthropic.
 * - Si se pasan `messages` en las opciones, se usan directamente.
 * - Si no, se usa `prompt` como único mensaje de usuario (comportamiento original).
 */
function buildMessages(prompt: string, opts: CallOptions): MessageItem[] {
  if (opts.messages && opts.messages.length > 0) {
    return opts.messages;
  }
  return [{ role: 'user', content: prompt }];
}

/**
 * Construye el payload completo para la API de Anthropic.
 * Si se pasa `system` en las opciones, va como campo separado (mejor calidad).
 * Si no se pasa, no se incluye (comportamiento original).
 */
function buildPayload(prompt: string, opts: CallOptions) {
  const { maxOutputTokens = 4096, temperature = 0.2, model = 'haiku' } = opts;
  const modelId = model === 'sonnet' ? SONNET_MODEL : DEFAULT_MODEL;
  const messages = buildMessages(prompt, opts);

  const payload: Record<string, unknown> = {
    model: modelId,
    max_tokens: maxOutputTokens,
    temperature,
    messages,
  };

  if (opts.system) {
    payload.system = opts.system;
  }

  return payload;
}

export async function callLLM(prompt: string, opts: CallOptions = {}): Promise<string> {
  const payload = buildPayload(prompt, opts);

  const delays = [0, 1500, 3500];
  let lastError: string = 'unknown';

  for (let attempt = 0; attempt < 3; attempt++) {
    if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        if (res.status !== 429 && res.status !== 529 && res.status < 500) break;
        continue;
      }

      const data = await res.json();
      const text = data?.content?.[0]?.text;
      if (!text) {
        lastError = 'empty response';
        continue;
      }
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'unknown';
    }
  }

  throw new Error(`LLM call failed after retries: ${lastError}`);
}

function sanitizeJsonResponse(raw: string): string {
  let cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  const candidates = [cleaned.indexOf('{'), cleaned.indexOf('[')].filter(i => i !== -1);
  const firstBrace = candidates.length > 0 ? Math.min(...candidates) : -1;
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let result = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { result += ch; escape = false; continue; }
    if (ch === '\\') { result += ch; escape = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
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
  let escape = false;
  const stack: Array<'{' | '['> = [];

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch);
    if (ch === '}' && stack[stack.length - 1] === '{') stack.pop();
    if (ch === ']' && stack[stack.length - 1] === '[') stack.pop();
  }

  if (inString) repaired += '"';

  while (stack.length > 0) {
    const open = stack.pop();
    repaired += open === '{' ? '}' : ']';
  }

  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  return repaired;
}

function tryParseJson<T>(raw: string): T {
  const sanitized = sanitizeJsonResponse(raw);

  try { return JSON.parse(sanitized) as T; } catch { /* sigue */ }

  try {
    const repaired = repairTruncatedJson(sanitized);
    return JSON.parse(repaired) as T;
  } catch { /* sigue */ }

  for (let end = sanitized.length; end > 0; end--) {
    if (sanitized[end - 1] === '}' || sanitized[end - 1] === ']') {
      try { return JSON.parse(sanitized.slice(0, end)) as T; } catch { continue; }
    }
  }

  throw new Error('No valid JSON could be extracted from LLM response');
}

export async function callLLMJson<T = unknown>(prompt: string, opts: CallOptions = {}): Promise<T> {
  const strictSuffix = `

IMPORTANTE: Responde EXCLUSIVAMENTE con un objeto JSON válido. Sin texto antes ni después, sin bloques de código, sin explicaciones. El JSON debe ser parseable directamente con JSON.parse().`;

  // Si se pasan messages, añadimos la instrucción de JSON al último mensaje de usuario.
  // Si no, la añadimos al prompt como antes.
  let adjustedPrompt = prompt;
  let adjustedOpts = { ...opts };

  if (opts.messages && opts.messages.length > 0) {
    const msgs = [...opts.messages];
    const lastUserIdx = msgs.reduce((acc, m, i) => m.role === 'user' ? i : acc, -1);
    if (lastUserIdx >= 0) {
      msgs[lastUserIdx] = {
        ...msgs[lastUserIdx],
        content: msgs[lastUserIdx].content + strictSuffix,
      };
    }
    adjustedOpts = { ...opts, messages: msgs };
    adjustedPrompt = '';
  } else {
    adjustedPrompt = prompt + strictSuffix;
  }

  const raw = await callLLM(adjustedPrompt, adjustedOpts);
  try {
    return tryParseJson<T>(raw);
  } catch (err) {
    console.warn('[callLLMJson] Parse failed. Response length:', raw.length, 'head:', raw.slice(0, 300));
    throw err;
  }
}

// ---------------------------------------------------------------------------
// callLLMWithUsage
// ---------------------------------------------------------------------------

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LLMResponseWithUsage {
  text: string;
  usage: LLMUsage;
}

export async function callLLMWithUsage(
  prompt: string,
  opts: CallOptions = {}
): Promise<LLMResponseWithUsage> {
  const payload = buildPayload(prompt, opts);

  const delays = [0, 1500, 3500];
  let lastError: string = 'unknown';

  for (let attempt = 0; attempt < 3; attempt++) {
    if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        if (res.status !== 429 && res.status !== 529 && res.status < 500) break;
        continue;
      }

      const data = await res.json();
      const text = data?.content?.[0]?.text;
      if (!text) {
        lastError = 'empty response';
        continue;
      }

      const usage: LLMUsage = {
        inputTokens: data?.usage?.input_tokens ?? 0,
        outputTokens: data?.usage?.output_tokens ?? 0,
      };

      return { text, usage };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'unknown';
    }
  }

  throw new Error(`LLM call failed after retries: ${lastError}`);
}
