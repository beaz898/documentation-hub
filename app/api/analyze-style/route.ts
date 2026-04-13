import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { callLLMJson } from '@/lib/analysis/llm-client';

export const maxDuration = 60;

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

Estructura JSON exacta a devolver:
{"problems":[{"type":"ortografia|ambiguedad|sugerencia","title":"...","description":"...","textRef":"..."}]}`;

interface StyleProblem {
  type?: string;
  title?: string;
  description?: string;
  textRef?: string;
}

interface StyleResponse {
  problems?: StyleProblem[];
}

const VALID_TYPES = new Set(['ortografia', 'ambiguedad', 'sugerencia']);

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
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

    const userPrompt = `${STYLE_PROMPT}

---

DOCUMENTO: "${fileName || 'sin nombre'}"

TEXTO A REVISAR:
"""
${text.slice(0, 20000)}
"""

Devuelve el JSON con los problemas internos detectados.`;

    let parsed: StyleResponse;
    try {
      parsed = await callLLMJson<StyleResponse>(userPrompt, {
        model: 'haiku',
        maxOutputTokens: 3072,
        temperature: 0.2,
      });
    } catch (err) {
      // Mismo comportamiento permisivo que la versión anterior:
      // si el LLM falla o el JSON no se puede parsear, devolvemos lista vacía
      // con la bandera styleError para que el frontend no muestre error duro.
      console.error('[ANALYZE-STYLE] LLM/parse failed:', err instanceof Error ? err.message : err);
      return NextResponse.json({ success: true, problems: [], styleError: true });
    }

    const problems = Array.isArray(parsed.problems)
      ? parsed.problems.filter(
          (p) => VALID_TYPES.has(p.type || '') && typeof p.textRef === 'string',
        )
      : [];

    console.log(
      `[ANALYZE-STYLE] OK — model=haiku problems=${problems.length} latency=${Date.now() - startedAt}ms`,
    );
    return NextResponse.json({ success: true, problems });
  } catch (error: unknown) {
    console.error('Error in /api/analyze-style:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
