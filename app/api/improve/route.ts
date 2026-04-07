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
 * The assistant has two possible response modes:
 *  A) Normal conversational reply (explanation, question, suggestion in plain language).
 *  B) Concrete replacement proposal — when the user asks to change / rewrite / fix something,
 *     the assistant MUST return a JSON block delimited by <<<REPLACEMENT>>> and <<<END>>>
 *     with exact "find" and "replace" strings, so the frontend can apply them to the textarea.
 *
 * The "find" string MUST be an EXACT verbatim substring of CURRENT_TEXT (so the frontend can
 * locate it with String.indexOf). Never paraphrase the "find". Never include line numbers.
 */
const IMPROVE_SYSTEM_PROMPT = `Eres un asistente experto en documentación corporativa. Ayudas al usuario a mejorar un documento que tiene problemas detectados (contradicciones con otros documentos, duplicidades, ambigüedades, errores, etc.).

Tienes acceso a:
- El TEXTO ACTUAL del documento en edición.
- Un RESUMEN de los problemas detectados.
- Fragmentos de documentos EXISTENTES en el sistema que están relacionados (para contexto de contradicciones).

REGLAS:
1. Responde siempre en español, de forma clara, breve y profesional.
2. Cuando el usuario pregunte algo conceptual ("¿por qué contradice?", "¿qué aporta esto?"), responde en texto normal sin bloques especiales.
3. Cuando el usuario pida un cambio concreto en el texto ("reescribe X", "corrige Y", "cambia Z por W"), responde así:
   - Primero una frase corta en texto normal explicando la propuesta.
   - Después, UN BLOQUE JSON delimitado EXACTAMENTE así:

<<<REPLACEMENT>>>
{"find": "texto exacto a buscar en el documento", "replace": "texto nuevo que sustituye"}
<<<END>>>

4. REGLAS CRÍTICAS del bloque REPLACEMENT:
   - El campo "find" DEBE ser un substring exacto y verbatim del TEXTO ACTUAL. Copia literal. NO parafrasees.
   - Si el fragmento a cambiar aparece más de una vez, incluye suficiente contexto en "find" para que sea único.
   - No incluyas saltos de línea falsos. Respeta el texto tal cual aparece.
   - El campo "replace" es el texto nuevo que lo sustituirá.
   - Si propones varios cambios a la vez, genera varios bloques REPLACEMENT seguidos.
5. Si no estás seguro del texto exacto a cambiar, pide aclaración antes de proponer un REPLACEMENT.
6. Nunca inventes datos que no estén en los documentos existentes ni en el texto actual.`;

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
      currentText,       // string - text currently in the textarea
      fileName,          // string
      problemsSummary,   // string - bullet-list summary of problems to give the IA initial context
      history,           // ChatMessage[] - previous messages in the improvement chat
      userMessage,       // string - new user message
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

    // Retrieve context from existing documents relevant to the user's question
    // (lightweight retrieval: embed the user message + a snippet of current text)
    let existingContext = '';
    try {
      const queryText = `${userMessage}\n\n${currentText.slice(0, 500)}`;
      const [queryEmbedding] = await generateEmbeddings([queryText]);
      const index = getIndex();
      const queryResponse = await index.namespace(orgId).query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
      });

      const matches = (queryResponse.matches || [])
        .filter(m => m.metadata && m.score && m.score > 0.35 && String(m.metadata.documentName) !== fileName)
        .slice(0, 5);

      if (matches.length > 0) {
        existingContext = matches
          .map((m, i) => `[${i + 1}] "${m.metadata!.documentName}" — ${String(m.metadata!.text).slice(0, 400)}`)
          .join('\n\n');
      }
    } catch (err) {
      console.error('[IMPROVE] Retrieval failed, continuing without existing context:', err);
    }

    // Build the user turn with all the context
    const contextBlock = `=== DOCUMENTO EN EDICIÓN: "${fileName}" ===

TEXTO ACTUAL (el que hay en el editor ahora mismo):
"""
${currentText}
"""

PROBLEMAS DETECTADOS INICIALMENTE:
${problemsSummary || '(ninguno registrado)'}

${existingContext ? `FRAGMENTOS DE DOCUMENTOS EXISTENTES RELACIONADOS:\n${existingContext}\n` : ''}
=== FIN DE CONTEXTO ===

Mensaje del usuario: ${userMessage}`;

    // Build contents for Gemini: include prior history + the new user turn w/ context
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
          temperature: 0.3,
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

    // Parse replacement blocks out of the reply
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

    // Strip the replacement blocks from the visible text
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
