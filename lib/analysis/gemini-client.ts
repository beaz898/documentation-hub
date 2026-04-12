const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  forceJson?: boolean;
}

export async function callLLM(prompt: string, opts: CallOptions = {}): Promise<string> {
  const { maxOutputTokens = 4096, temperature = 0.2, forceJson = true } = opts;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens,
      temperature,
      ...(forceJson ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const delays = [0, 1500, 3500];
  let lastError: string = 'unknown';

  for (let attempt = 0; attempt < 3; attempt++) {
    if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        if (res.status !== 429 && res.status !== 503 && res.status < 500) break;
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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

    if (escape) {
      result += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
    }

    result += ch;
  }

  return result;
}

function tryParseJson<T>(raw: string): T {
  try {
    return JSON.parse(sanitizeJsonResponse(raw)) as T;
  } catch {
    const sanitized = sanitizeJsonResponse(raw);
    for (let end = sanitized.length; end > 0; end--) {
      const candidate = sanitized.slice(0, end);
      if (candidate.endsWith('}') || candidate.endsWith(']')) {
        try {
          return JSON.parse(candidate) as T;
        } catch {
          continue;
        }
      }
    }
    throw new Error('No valid JSON could be extracted from LLM response');
  }
}

export async function callLLMJson<T = unknown>(prompt: string, opts: CallOptions = {}): Promise<T> {
  const raw = await callLLM(prompt, { ...opts, forceJson: true });
  try {
    return tryParseJson<T>(raw);
  } catch (err) {
    console.warn('[callLLMJson] First parse failed, raw response head:', raw.slice(0, 300));
    throw err;
  }
}
