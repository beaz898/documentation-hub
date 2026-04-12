const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

interface CallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  forceJson?: boolean;
}

/**
 * Llamada a Gemini con retry y opciones centralizadas.
 * Migrar a Claude: cambiar solo el cuerpo de esta función.
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

/** Helper: llama al LLM y parsea JSON. Tolera fences ```json. */
export async function callLLMJson<T = unknown>(prompt: string, opts: CallOptions = {}): Promise<T> {
  const raw = await callLLM(prompt, { ...opts, forceJson: true });
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as T;
}
