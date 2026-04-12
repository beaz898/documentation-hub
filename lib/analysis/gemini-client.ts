const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  forceJson?: boolean;
}

/**
 * Llamada a Gemini con retry y opciones centralizadas.
 */
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

/**
 * Sanea la respuesta de Gemini para que JSON.parse la acepte.
 * Gemini a veces inserta saltos de línea reales dentro de strings o no escapa comillas internas.
 */
function sanitizeJsonResponse(raw: string): string {
  // Quitar fences ```json``` y ``` sueltos
  let cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  // Recortar basura antes del primer { o [ y después del último } o ]
  const firstBrace = Math.min(
    ...[cleaned.indexOf('{'), cleaned.indexOf('[')].filter(i => i !== -1)
  );
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (isFinite(firstBrace) && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Escapar saltos de línea y tabs crudos que estén DENTRO de strings JSON.
  // Recorremos carácter a carácter, mantenemos track de si estamos dentro de un string.
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

/** Intenta extraer el primer objeto JSON válido aunque haya basura. */
function tryParseJson<T>(raw: string): T {
  // Intento 1: parseo directo tras sanear
  try {
    return JSON.parse(sanitizeJsonResponse(raw)) as T;
  } catch {
    // Intento 2: buscar el JSON más largo que parsee
    const sanitized = sanitizeJsonResponse(raw);
    // Buscar el último cierre antes del error y reconstruir
    for (let end = sanitized.length; end > 0; end--) {
      con
