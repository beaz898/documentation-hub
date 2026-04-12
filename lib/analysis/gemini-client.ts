const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export async function callLLM(prompt: string, opts: CallOptions = {}): Promise<string> {
  const { maxOutputTokens = 8192, temperature = 0.2 } = opts;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens, temperature },
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

/**
 * Intenta reparar JSON truncado cerrando strings, objetos y arrays abiertos.
 */
function repairTruncatedJson(sanitized: string): string {
  let repaired = sanitized;

  // Track de estado: si acaba dentro de un string, cierra la comilla
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

  // Si terminó dentro de un string, cerrarlo
  if (inString) repaired += '"';

  // Cerrar estructuras abiertas en orden inverso
  while (stack.length > 0) {
    const open = stack.pop();
    repaired += open === '{' ? '}' : ']';
  }

  // Si el último carácter antes del cierre es una coma, quitarla (trailing comma)
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  return repaired;
}

function tryParseJson<T>(raw: string): T {
  const sanitized = sanitizeJsonResponse(raw);

  // Intento 1: parseo directo
  try { return JSON.parse(sanitized) as T; } catch { /* sigue */ }

  // Intento 2: reparar truncado
  try {
    const repaired = repairTruncatedJson(sanitized);
    return JSON.parse(repaired) as T;
  } catch { /* sigue */ }

  // Intento 3: ir truncando desde el final hasta encontrar algo válido
  for (let end = sanitized.length; end > 0; end--) {
    if (sanitized[end - 1] === '}' || sanitized[end - 1] === ']') {
      try { return JSON.parse(sanitized.slice(0, end)) as T; } catch { continue; }
    }
  }

  throw new Error('No valid JSON could be extracted from LLM response');
}

export async function callLLMJson<T = unknown>(prompt: string, opts: CallOptions = {}): Promise<T> {
  // Añadimos instrucción estricta al final del prompt en lugar de usar responseMimeType
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
