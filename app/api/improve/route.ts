import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { callLLMWithUsage } from '@/lib/analysis/llm-client';

export const maxDuration = 120;

const IMPROVE_SYSTEM_PROMPT = `Eres un asistente experto en documentación corporativa. Ayudas al usuario a mejorar un documento que tiene problemas detectados (contradicciones con otros documentos, duplicidades, ambigüedades, errores, texto redundante, etc.).

Tienes acceso a:
- El TEXTO ACTUAL del documento en edición (delimitado por <<<TEXTO_ACTUAL>>> y <<<FIN_TEXTO>>>).
- Un RESUMEN de los problemas detectados.
- Fragmentos de documentos EXISTENTES en el sistema que están relacionados.
- Opcionalmente, el CONTENIDO COMPLETO de un documento que el usuario haya mencionado explícitamente por nombre (delimitado por <<<DOC_COMPLETO:nombre>>> y <<<FIN_DOC>>>).

REGLAS GENERALES:
1. Responde siempre en español, de forma clara, breve y profesional.
2. Cuando el usuario pregunte algo conceptual, responde en texto normal sin bloques especiales.
3. Cuando el usuario pida cambios, correcciones, borrados o fusiones en el texto, responde así:
   - Primero una frase corta explicando la propuesta (o varias, si haces varios cambios).
   - Después, uno o más bloques JSON delimitados EXACTAMENTE así:

<<<REPLACEMENT>>>
{"find": "texto exacto a buscar", "replace": "texto nuevo"}
<<<END>>>

INSTRUCCIONES MULTI-FRAGMENTO:
- Si el usuario pide algo como "borra todo lo que esté duplicado con archivo X", DEBES generar UN BLOQUE REPLACEMENT POR CADA fragmento duplicado que encuentres en el TEXTO_ACTUAL. No resumas los cambios en uno solo. No pidas confirmación primero; propón TODOS los cambios a la vez y el usuario los aplicará uno por uno.
- Si te dan el CONTENIDO COMPLETO de otro documento, compáralo frase por frase con el TEXTO_ACTUAL para identificar duplicaciones o contradicciones. Reporta TODAS las que encuentres.

REGLAS CRÍTICAS del campo "find":
A. El "find" DEBE ser una copia literal carácter por carácter de un substring del TEXTO_ACTUAL. Ni una coma de más ni de menos.
B. NO parafrasees. NO normalices espacios. NO corrijas ortografía. NO cambies mayúsculas. Copia exactamente lo que hay en el TEXTO_ACTUAL.
C. Los saltos de línea dentro del "find" van como \\n en el JSON.
D. Si el fragmento aparece más de una vez en el texto, incluye suficiente contexto para que sea ÚNICO.
E. El "find" debe ser lo más CORTO posible pero único. Prefiere 1-3 frases a copiar párrafos enteros.
F. Para BORRAR texto: usa "replace" vacío "". Para AÑADIR: usa como "find" la frase justo anterior y como "replace" esa misma frase + el texto nuevo.
G. Si NO puedes localizar el fragmento exacto, NO inventes un REPLACEMENT. Pídele al usuario que te señale el fragmento exacto.
H. NUNCA emitas un REPLACEMENT donde "find" y "replace" sean iguales (o solo difieran en espacios al inicio/final). Si una parte del texto ya está bien y no necesita cambio, simplemente NO la incluyas como propuesta. Es mejor proponer 2 cambios reales que 3 cambios donde uno no cambia nada.

EJEMPLOS:

Usuario: "Cambia 22 días por 25"
→
Actualizo la cifra de días de vacaciones.
<<<REPLACEMENT>>>
{"find": "derecho a 22 días", "replace": "derecho a 25 días"}
<<<END>>>

Usuario: "Borra todo lo que esté duplicado con politica_rrhh.pdf"
→ (Suponiendo que encuentras 3 fragmentos duplicados)
He encontrado 3 fragmentos duplicados con politica_rrhh.pdf. Aquí las propuestas de borrado:
<<<REPLACEMENT>>>
{"find": "Las vacaciones deben solicitarse con 15 días de antelación a través del portal de RRHH.", "replace": ""}
<<<END>>>
<<<REPLACEMENT>>>
{"find": "Los días no disfrutados no son acumulables al año siguiente.", "replace": ""}
<<<END>>>
<<<REPLACEMENT>>>
{"find": "El periodo de disfrute va del 1 de enero al 31 de diciembre.", "replace": ""}
<<<END>>>

NUNCA inventes texto para el "find". NUNCA emitas un REPLACEMENT que no cambie nada.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DocRow {
  id: string;
  name: string;
  source: string | null;
  chunk_count: number;
}

function detectMentionedDoc(userMessage: string, orgDocs: DocRow[]): DocRow | null {
  const msgLower = userMessage.toLowerCase();
  const sorted = [...orgDocs].sort((a, b) => b.name.length - a.name.length);
  for (const doc of sorted) {
    const nameLower = doc.name.toLowerCase();
    const nameNoExt = nameLower.replace(/\.[^/.]+$/, '');
    if (nameNoExt.length < 6) continue;
    if (msgLower.includes(nameLower) || msgLower.includes(nameNoExt)) {
      return doc;
    }
  }
  return null;
}

async function loadFullDocumentText(
  orgId: string,
  doc: DocRow,
  maxChars: number = 15000
): Promise<string | null> {
  try {
    const index = getIndex();
    const chunkCount = doc.chunk_count;
    if (!chunkCount || chunkCount === 0) return null;

    const allIds = Array.from({ length: chunkCount }, (_, i) => `${doc.id}-${i}`);
    const batches: string[][] = [];
    for (let i = 0; i < allIds.length; i += 100) {
      batches.push(allIds.slice(i, i + 100));
    }

    const texts: Array<{ idx: number; text: string }> = [];
    for (const batch of batches) {
      const res = await index.namespace(orgId).fetch(batch);
      const records = res.records || {};
      for (const [id, record] of Object.entries(records)) {
        const meta = (record as { metadata?: Record<string, unknown> }).metadata;
        if (meta && typeof meta.text === 'string' && typeof meta.chunkIndex === 'number') {
          texts.push({ idx: meta.chunkIndex, text: meta.text });
        } else if (meta && typeof meta.text === 'string') {
          const idxMatch = id.match(/-(\d+)$/);
          texts.push({ idx: idxMatch ? parseInt(idxMatch[1], 10) : 0, text: meta.text as string });
        }
      }
    }

    texts.sort((a, b) => a.idx - b.idx);
    let combined = texts.map(t => t.text).join('\n\n');

    if (combined.length > maxChars) {
      combined = combined.slice(0, maxChars) + `\n\n[... contenido truncado, documento original tiene ${combined.length} caracteres ...]`;
    }

    return combined;
  } catch (err) {
    console.error('[IMPROVE] Failed to load full document:', err);
    return null;
  }
}

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

    const { data: orgDocsRaw } = await supabase
      .from('documents')
      .select('id, name, source, chunk_count')
      .eq('org_id', orgId);
    const orgDocs: DocRow[] = orgDocsRaw || [];

    const mentionedDoc = detectMentionedDoc(userMessage, orgDocs);

    let fullMentionedText: string | null = null;
    if (mentionedDoc) {
      console.log(`[IMPROVE] User mentioned document: "${mentionedDoc.name}" (${mentionedDoc.source || 'manual'})`);
      fullMentionedText = await loadFullDocumentText(orgId, mentionedDoc);
      if (fullMentionedText) {
        console.log(`[IMPROVE] Loaded ${fullMentionedText.length} chars from "${mentionedDoc.name}"`);
      }
    }

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
        .filter(m => m.metadata && m.score && m.score > 0.28)
        .filter(m => !mentionedDoc || String(m.metadata!.documentId) !== mentionedDoc.id)
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

    // Construir el bloque de contexto del documento (va en el system, se cachea)
    const fullDocSection = fullMentionedText
      ? `\n\nCONTENIDO COMPLETO DEL DOCUMENTO MENCIONADO POR EL USUARIO:\n<<<DOC_COMPLETO:${mentionedDoc!.name}>>>\n${fullMentionedText}\n<<<FIN_DOC>>>\n`
      : '';

    const documentContext = `=== DOCUMENTO EN EDICIÓN: "${fileName}" ===

<<<TEXTO_ACTUAL>>>
${currentText}
<<<FIN_TEXTO>>>

PROBLEMAS DETECTADOS INICIALMENTE:
${problemsSummary || '(ninguno registrado)'}
${fullDocSection}
${existingContext ? `FRAGMENTOS DE OTROS DOCUMENTOS RELACIONADOS:\n${existingContext}\n` : ''}
=== FIN DE CONTEXTO ===`;

    // System prompt como dos bloques:
    // 1. Instrucciones (fijas siempre)
    // 2. Contexto del documento (fijo durante la conversación)
    // El último bloque lleva cache_control para que Anthropic cachee ambos.
    const systemBlocks: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }> = [
      { type: 'text', text: IMPROVE_SYSTEM_PROMPT },
      { type: 'text', text: documentContext, cache_control: { type: 'ephemeral' } },
    ];

    // El mensaje del usuario va como messages (no cacheado, cambia cada vez)
    const userContent = `${userMessage}

Recuerda: si propones REPLACEMENT(s), el "find" debe ser copia literal del TEXTO_ACTUAL. Si el usuario pide algo multi-fragmento (ej: "borra todo lo duplicado con X"), genera UN REPLACEMENT por cada fragmento, no resumas en uno solo. Y NUNCA emitas un REPLACEMENT donde "find" y "replace" sean iguales.`;

    const recentHistory = (history || []).slice(-10);
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...recentHistory,
      { role: 'user', content: userContent },
    ];

    let rawReply = '';
    let usage = { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
    try {
      const response = await callLLMWithUsage('', {
        system: systemBlocks,
        messages,
        model: 'haiku',
        maxOutputTokens: 6144,
        temperature: 0.2,
        cacheSystem: true,
      });
      rawReply = response.text;
      usage = {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cacheCreationTokens: response.usage.cacheCreationTokens ?? 0,
        cacheReadTokens: response.usage.cacheReadTokens ?? 0,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IMPROVE] LLM call failed:', message);
      const isRateOrOverloaded = /HTTP 429|HTTP 5\d\d/.test(message);
      return NextResponse.json(
        {
          error: isRateOrOverloaded
            ? 'El asistente de IA está saturado en este momento. Vuelve a intentarlo en unos segundos.'
            : 'No se pudo contactar con el asistente de mejora. Inténtalo de nuevo.',
        },
        { status: 503 }
      );
    }

    const replacements: Array<{ find: string; replace: string }> = [];
    const replacementRegex = /<<<REPLACEMENT>>>\s*([\s\S]*?)\s*<<<END>>>/g;
    let match;
    let droppedNoOpCount = 0;
    while ((match = replacementRegex.exec(rawReply)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (typeof parsed.find !== 'string' || typeof parsed.replace !== 'string') continue;

        if (parsed.find.trim() === parsed.replace.trim()) {
          droppedNoOpCount++;
          continue;
        }

        replacements.push({ find: parsed.find, replace: parsed.replace });
      } catch (e) {
        console.error('[IMPROVE] Failed to parse REPLACEMENT block:', e, match[1].slice(0, 200));
      }
    }

    const visibleText = rawReply.replace(replacementRegex, '').trim();

    console.log(
      `[IMPROVE] OK — model=haiku tokens_in=${usage.inputTokens} tokens_out=${usage.outputTokens} cache_create=${usage.cacheCreationTokens} cache_read=${usage.cacheReadTokens} replacements=${replacements.length} dropped_noop=${droppedNoOpCount} latency=${Date.now() - startedAt}ms`
    );

    return NextResponse.json({
      success: true,
      reply: visibleText,
      replacements,
      loadedDoc: mentionedDoc
        ? { name: mentionedDoc.name, source: mentionedDoc.source || 'manual', loaded: !!fullMentionedText }
        : null,
    });
  } catch (error: unknown) {
    console.error('Error in /api/improve:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
