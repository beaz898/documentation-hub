import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';

export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * SYSTEM PROMPT for improvement chat.
 * Stricter version: emphasizes exact copy-paste for the "find" field.
 */
const IMPROVE_SYSTEM_PROMPT = `Eres un asistente experto en documentación corporativa. Ayudas al usuario a mejorar un documento que tiene problemas detectados (contradicciones con otros documentos, duplicidades, ambigüedades, errores, texto redundante, etc.).

Tienes acceso a:
- El TEXTO ACTUAL del documento en edición (delimitado por <<<TEXTO_ACTUAL>>> y <<<FIN_TEXTO>>>).
- Un RESUMEN de los problemas detectados.
- Fragmentos de documentos EXISTENTES en el sistema que están relacionados (para contexto de contradicciones o duplicidades).

REGLAS GENERALES:
1. Responde siempre en español, de forma clara, breve y profesional.
2. Cuando el usuario pregunte algo conceptual ("¿por qué contradice?", "¿qué aporta esto?", "¿qué opinas de X?"), responde en texto normal sin bloques especiales.
3. Cuando el usuario pida un cambio, corrección o borrado en el texto, responde así:
   - Primero una frase corta explicando la propuesta.
   - Después, UN BLOQUE JSON delimitado EXACTAMENTE así (sin acentos graves, sin markdown, sin nada extra):

<<<REPLACEMENT>>>
{"find": "texto exacto a buscar", "replace": "texto nuevo"}
<<<END>>>

REGLAS CRÍTICAS del campo "find" (¡LEE BIEN!):
A. El "find" DEBE ser una copia literal carácter por carácter de un substring del TEXTO_ACTUAL entre los delimitadores. Ni una coma de más ni de menos.
B. NO parafrasees. NO normalices espacios. NO corrijas ortografía. NO cambies mayúsculas. NO añadas puntos al final. Copia exactamente lo que hay en el TEXTO_ACTUAL.
C. Los saltos de línea dentro del "find" deben ir como literales \\n dentro del JSON.
D. Si el fragmento que quieres cambiar aparece más de una vez en el texto, incluye suficiente contexto antes o después para que sea ÚNICO.
E. El "find" debe ser lo más CORTO posible pero único. Prefiere 1-3 frases a copiar párrafos enteros.
F. Para BORRAR texto: usa "replace" vacío "". Para AÑADIR texto nuevo: usa como "find" la frase justo anterior y como "replace" esa misma frase + el texto nuevo.
G. Si NO puedes localizar el fragmento exacto en TEXTO_ACTUAL, NO inventes un REPLACEMENT. En su lugar, pide al usuario que te señale el fragmento exacto o cítale literalmente qué parte vas a tocar.

EJEMPLOS CORRECTOS:

Usuario: "Borra el párrafo sobre vacaciones"
Respuesta correcta:
Voy a eliminar el párrafo que menciona las vacaciones.
<<<REPLACEMENT>>>
{"find": "Todos los empleados tienen derecho a 22 días de vacaciones al año.", "replace": ""}
<<<END>>>

Usuario: "Cambia 22 días por 25"
Respuesta correcta:
Actualizo la cifra de días de vacaciones.
<<<REPLACEMENT>>>
{"find": "derecho a 22 días", "replace": "derecho a 25 días"}
<<<END>>>

Usuario: "Elimina la duplicación sobre el portal de RRHH"
Si la frase exacta sobre el portal no aparece literal en el texto → responde:
No encuentro una referencia literal al "portal de RRHH" en el texto actual. ¿Puedes copiarme la frase exacta que quieres quitar, o indicarme en qué párrafo está?

NUNCA inventes texto para el "find". NUNCA.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

    const orgId = user.user_metadata?.org_id || user.id;

    const body = await req.json();
    const {
      currentText,
      fileName,
      problemsSummary,
      history,
      userMessage,
    }: {
      currentText: string;
      fileName: string;
      problemsSummary: string;
      history: ChatMessage[];
      userMessage: string;
    } = body;

    if (!currentText || !userMessage) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // Retrieve context from existing documents (docs de Drive incluidos, viven en el mismo namespace)
    let existingContext = '';
    try {
      const queryText = `${userMessage}\n\n${currentText.slice(0, 500)}`;
      const [queryEmbedding] = await generateEmbeddings([queryText]);
      const index = getIndex();
      const queryResponse = await index.namespace(orgId).query({
        vector: queryEmbedding,
        topK: 8,
        includeMetadata: true,
      });

      const matches = (queryResponse.matches || [])
        .filter(m => m.metadata && m.score && m.score > 0.30 && String(m.metadata.documentName) !== fileName)
        .slice(0, 6);

      if (matches.length > 0) {
        existingContext = matches
          .map((m, i) => {
            const src = m.metadata!.source === 'google_drive' ? ' [Drive]' : ' [Manual]';
            return `[${i + 1}] "${m.metadata!.documentName}"${src} — ${String(m.metadata!.text).slice(0, 400)}`;
          })
          .join('\n\n');
      }
    } catch (err) {
      console.error('[IMPROVE] Retrieval failed, continuing without existing context:', err);
    }

    const contextBlock = `=== DOCUMENTO EN EDICIÓN: "${fileName}" ===

<<<TEXTO_ACTUAL>>>
${currentText}
<<<FIN_TEXTO>>>

PROBLEMAS DETECTADOS INICIALMENTE:
${problemsSummary || '(ninguno registrado)'}

${existingContext ? `FRAGMENTOS DE DOCUMENTOS EXISTENTES RELACIONADOS:\n${existingContext}\n` : ''}
=== FIN DE CONTEXTO ===

Mensaje del usuario: ${userMessage}

Recuerda: si propones un REPLACEMENT, el "find" debe ser una copia literal carácter por carácter del TEXTO_ACTUAL anterior.`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const h of (history || []).slice(-10)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: contextBlock }] });

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: IMPROVE_SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[IMPROVE] Gemini error:', errText);
      return NextResponse.json(
        { error: 'El asistente de mejora no está disponible en este momento. Inténtalo de nuevo en unos segundos.' },
        { status: 503 }
      );
    }

    const data = await response.json();
    const rawReply: string = data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('') || '';

    // Parse replacement blocks
    const replacements: Array<{ find: string; replace: string }> = [];
    const replacementRegex = /<<<REPLACEMENT>>>\s*([\s\S]*?)\s*<<<END>>>/g;
    let match;
    while ((match = replacementRegex.exec(rawReply)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (typeof parsed.find === 'string' && typeof parsed.replace === 'string') {
          replacements.push({ find: parsed.find, replace: parsed.replace });
        }
      } catch (e) {
        console.error('[IMPROVE] Failed to parse REPLACEMENT block:', e, match[1].slice(0, 200));
      }
    }

    const visibleText = rawReply.replace(replacementRegex, '').trim();

    return NextResponse.json({
      success: true,
      reply: visibleText,
      replacements,
    });
  } catch (error: unknown) {
    console.error('Error in /api/improve:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
