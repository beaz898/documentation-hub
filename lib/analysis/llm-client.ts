const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// Modelos: Haiku para la mayoría de llamadas (rápido, barato, suficiente).
// Sonnet solo si una llamada concreta lo pide explícitamente (mejor razonamiento).
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-6';

interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  model?: 'haiku' | 'sonnet';
}

export async function callLLM(prompt: string, opts: CallOptions = {}): Promise<string> {
  const { maxOutputTokens = 4096, temperature = 0.2, model = 'haiku' } = opts;
  const modelId = model === 'sonnet' ? SONNET_MODEL : DEFAULT_MODEL;

  const payload = {
    model: modelId,
    max_tokens: maxOutputTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  };

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
  const strictPrompt = `${prompt}

IMPORTANTE: Responde EXCLUSIVAMENTE con un objeto JSON válido. Sin texto antes ni después, sin bloques de código, sin explicaciones. El JSON debe ser parseable directamente con JSON.parse().`;

  const raw = await callLLM(strictPrompt, opts);
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
// Variante de callLLM que además devuelve el conteo de tokens de entrada y
// salida. Usada por endpoints que necesitan reportar uso (p. ej. /api/ask
// para mostrar/registrar coste por consulta). No modifica callLLM existente
// para no afectar al pipeline v2 ni al resto de call sites.
//
// Estructura de respuesta de Anthropic:
//   data.content[0].text          -> texto generado
//   data.usage.input_tokens       -> tokens del prompt
//   data.usage.output_tokens      -> tokens de la respuesta
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
  const { maxOutputTokens = 4096, temperature = 0.2, model = 'haiku' } = opts;
  const modelId = model === 'sonnet' ? SONNET_MODEL : DEFAULT_MODEL;

  const payload = {
    model: modelId,
    max_tokens: maxOutputTokens,
    temperature,
    messages: [{ role: 'user', content: prompt }],
  };

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
