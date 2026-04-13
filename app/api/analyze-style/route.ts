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

2. Para cada problema, el campo "textRef" DEBE ser una copia LITERAL de un substring del texto (carácter por carácter, sin parafrasear). Es lo que permite localizarlo en el editor. Debe ser lo MÁS CORTO posible: la palabra o expresión exacta que tiene el problema, no la frase entera. Si una palabra concreta aparece varias veces en el texto, incluye una o dos palabras de contexto para que sea único.

3. La "title" es un nombre breve (máx. 8 palabras) que identifica el problema (ej: "Errata en 'consulltas'", "Frase ambigua sobre vacaciones", "Repetición innecesaria").

4. La "description" tiene un formato OBLIGATORIO de dos partes:
   - Primera parte: qué está mal (sin repetir literalmente la palabra equivocada como si fuera la correcta).
   - Segunda parte: la corrección concreta, introducida por "Sugerencia:" o "Corrección:".
   Máximo 30 palabras en total.

5. Devuelve máximo 15 problemas en total. Si hay más, prioriza los más graves.

EJEMPLOS DE description BIEN HECHA:
- "La palabra está mal escrita: sobra una 'l'. Corrección: 'consultas'."
- "La frase es ambigua porque no queda claro a quién se refiere 'su responsable'. Sugerencia: especificar 'el responsable del solicitante'."
- "Este párrafo repite la idea ya expresada en el anterior. Sugerencia: eliminarlo o fusionarlo con el párrafo previo."

EJEMPLOS DE description MAL HECHA (NO HAGAS ESTO):
- "Falta una 'l' en consulltas. Debe ser consultas." (escribe la palabra equivocada como si fuera la corrección)
- "Esta frase es rara." (no propone corrección)
- "Mejorar redacción." (vago, sin corrección concreta)

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
