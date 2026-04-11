import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGeminiWithRetry(payload: object, maxAttempts = 3): Promise<Response> {
  const delays = [0, 1500, 3500];
  let last: Response | null = null;
  for (let i = 0; i < maxAttempts; i++) {
    if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]));
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    last = res;
    if (res.ok) return res;
    if (res.status !== 429 && res.status !== 503 && res.status < 500) return res;
  }
  return last!;
}

const STYLE_PROMPT = `Eres un revisor de estilo de documentación corporativa. Analiza el TEXTO que se te da y detecta SOLO problemas internos del propio texto (sin compararlo con otros documentos).

Detecta tres tipos de problema:
- "ortografia": faltas, erratas, errores gramaticales o de concordancia.
- "ambiguedad": frases poco claras, ambiguas o que pueden malinterpretarse.
- "sugerencia": redundancias, párrafos mejorables, problemas de claridad o estilo.

REGLAS:
1. NO te inventes problemas. Si el texto está bien, devuelve un array vacío.
2. Para cada problema, el campo "textRef" DEBE ser una copia LITERAL de un substring del texto (carácter por carácter, sin parafrasear). Es lo que permite localizarlo en el editor.
3. El "textRef" debe ser lo más corto posible pero único en el texto.
4. La "title" es un nombre breve (máx. 8 palabras). La "description" explica el problema y sugiere la corrección (máx. 25 palabras).
5. Devuelve máximo 15 problemas en total. Si hay más, prioriza los más graves.

Responde SOLO con un JSON válido, sin markdown, con esta estructura exacta:
{"problems":[{"type":"ortografia|ambiguedad|sugerencia","title":"...","description":"...","textRef":"..."}]}`;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { text, fileName } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente' }, { status: 400 });
    }

    const userMessage = `DOCUMENTO: "${fileName || 'sin nombre'}"\n\nTEXTO A REVISAR:\n"""\n${text.slice(0, 20000)}\n"""\n\nDevuelve el JSON con los problemas internos detectados.`;

    const response = await callGeminiWithRetry({
      system_instruction: { parts: [{ text: STYLE_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 3072, temperature: 0.2 },
    });

    if (!response.ok) {
      console.error('[ANALYZE-STYLE] Gemini error after retries:', response.status);
      return NextResponse.json({ success: true, problems: [], styleError: true });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';

    let parsed;
    try {
      let cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      if (!cleaned.endsWith('}')) {
        const last = cleaned.lastIndexOf('}');
        if (last > 0) cleaned = cleaned.substring(0, last + 1);
      }
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('[ANALYZE-STYLE] JSON parse failed:', e);
      return NextResponse.json({ success: true, problems: [], styleError: true });
    }

    const problems = Array.isArray(parsed.problems) ? parsed.problems.filter((p: { type?: string; textRef?: string }) =>
      ['ortografia', 'ambiguedad', 'sugerencia'].includes(p.type || '') && typeof p.textRef === 'string'
    ) : [];

    console.log(`[ANALYZE-STYLE] Returned ${problems.length} style problems`);
    return NextResponse.json({ success: true, problems });
  } catch (error: unknown) {
    console.error('Error in /api/analyze-style:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
