import { callLLMJson } from './llm-client';

/**
 * Análisis de estilo intra-documento.
 *
 * Detecta errores ortográficos, ambigüedades y sugerencias de mejora
 * dentro del propio texto, sin compararlo con otros documentos.
 *
 * Esta función es reutilizable: la llaman tanto el endpoint /api/analyze-style
 * como el pipeline exhaustivo.
 */

/** Problema de estilo detectado en el texto. */
export interface StyleProblem {
  type: 'ortografia' | 'ambiguedad' | 'sugerencia';
  title: string;
  description: string;
  /** Cita literal del texto donde está el problema (para localización en el editor). */
  textRef: string;
}

interface StyleResponse {
  problems?: Array<{
    type?: string;
    title?: string;
    description?: string;
    textRef?: string;
  }>;
}

const VALID_TYPES = new Set(['ortografia', 'ambiguedad', 'sugerencia']);

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

/**
 * Analiza el texto en busca de problemas de estilo (ortografía, ambigüedad, sugerencias).
 * Devuelve un array de problemas validados.
 */
export async function analyzeStyle(text: string, fileName: string): Promise<StyleProblem[]> {
  const t0 = Date.now();

  const userPrompt = `${STYLE_PROMPT}

---

DOCUMENTO: "${fileName || 'sin nombre'}"

TEXTO A REVISAR:
"""
${text.slice(0, 20000)}
"""

Devuelve el JSON con los problemas internos detectados.`;

  try {
    const parsed = await callLLMJson<StyleResponse>(userPrompt, {
      model: 'haiku',
      maxOutputTokens: 3072,
      temperature: 0.2,
    });

    const problems: StyleProblem[] = (parsed.problems || [])
      .filter(p => VALID_TYPES.has(p.type || '') && typeof p.textRef === 'string' && p.textRef.trim().length > 0)
      .map(p => ({
        type: p.type as 'ortografia' | 'ambiguedad' | 'sugerencia',
        title: p.title?.trim() || 'Problema detectado',
        description: p.description?.trim() || '',
        textRef: p.textRef!.trim(),
      }));

    console.log(`[style-check] "${fileName}": ${problems.length} problemas de estilo (${Date.now() - t0}ms)`);
    return problems;
  } catch (err) {
    console.warn('[style-check] LLM/parse failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
