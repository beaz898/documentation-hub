/**
 * Motor RAG (Retrieval-Augmented Generation).
 *
 * Estrategia: documento completo en contexto.
 *
 * 1. Convierte la pregunta en un vector (embedding)
 * 2. Busca los chunks más relevantes en Pinecone (topK 15)
 * 3. Identifica los documentos a los que pertenecen esos chunks
 * 4. Recupera el texto completo de esos documentos desde Supabase
 * 5. Pasa los documentos completos a Claude como contexto
 *
 * Ventajas sobre pasar chunks sueltos:
 * - Nunca se pierde información por un corte de chunk malo
 * - Claude tiene el contexto completo de cada documento
 * - Mejor calidad de respuesta cuando la info cruza secciones
 */

import { getIndex } from './pinecone';
import { generateQueryEmbedding } from './embeddings';
import { callLLMWithUsage } from './analysis/llm-client';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Cuántos chunks recuperar de Pinecone para identificar documentos relevantes. */
const TOP_K = 15;

/** Máximo de documentos completos a pasar como contexto. */
const MAX_DOCUMENTS = 4;

/** Máximo de caracteres totales de contexto (seguridad contra documentos enormes). */
const MAX_CONTEXT_CHARS = 30000;

/** Score mínimo para considerar un match relevante. */
const MIN_SCORE = 0.3;

const MAX_HISTORY_MESSAGES = 6;
const MAX_OUTPUT_TOKENS = 4096;
const TEMPERATURE = 0.3;

const SYSTEM_PROMPT = `Eres un asistente experto en documentación empresarial. Tu trabajo es responder preguntas basándote ÚNICAMENTE en los documentos que se te proporcionan.

REGLAS:
1. Responde SOLO con información que encuentres en los documentos proporcionados.
2. Si no encuentras la respuesta en los documentos, dilo claramente: "No encontré información sobre esto en la documentación disponible."
3. NUNCA inventes información ni supongas datos que no estén en los documentos.
4. Cita el nombre del documento cuando sea relevante para que el usuario pueda consultarlo.
5. Sé conciso pero completo. Usa formato Markdown para estructurar la respuesta.
6. Mantén el mismo idioma que la pregunta del usuario.
7. Si la pregunta es ambigua, pide aclaración.
8. Si hay información contradictoria entre documentos, señálalo.
9. Tienes acceso al historial reciente de la conversación. Úsalo para entender referencias como "eso", "lo anterior", "y cómo se hace", etc.
10. Responde de forma completa sin cortar la respuesta. Si la respuesta es larga, estructura bien con secciones.
11. Tienes acceso a documentos COMPLETOS, no fragmentos. Revisa todo el contenido de cada documento para dar la respuesta más completa posible.`;

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGResult {
  answer: string;
  sources: Array<{
    documentName: string;
    score: number;
  }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Convierte el error genérico de llm-client en una de las categorías
 * de error que /api/ask sabe traducir a mensaje de usuario.
 */
function mapLLMError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);

  if (/HTTP 401|HTTP 403/.test(message)) throw new Error('AUTH_ERROR');
  if (/HTTP 429/.test(message)) throw new Error('RATE_LIMIT_EXCEEDED');
  if (/HTTP 529/.test(message)) throw new Error('SERVICE_OVERLOADED');
  if (/HTTP 5\d\d/.test(message)) throw new Error('SERVICE_ERROR');

  throw new Error('SERVICE_ERROR');
}

/**
 * Ejecuta una consulta RAG completa con documentos completos como contexto.
 */
export async function queryRAG(
  question: string,
  orgId: string,
  supabase: SupabaseClient,
  conversationHistory: ConversationMessage[] = []
): Promise<RAGResult> {
  // 1. Generar embedding de la pregunta
  const queryVector = await generateQueryEmbedding(question);

  // 2. Buscar en Pinecone los chunks más relevantes
  const index = getIndex();
  const queryResponse = await index.namespace(orgId).query({
    vector: queryVector,
    topK: TOP_K,
    includeMetadata: true,
  });

  const matches = queryResponse.matches || [];

  // Si no hay resultados relevantes, no llamamos al LLM
  if (matches.length === 0 || (matches[0].score && matches[0].score < MIN_SCORE)) {
    return {
      answer:
        'No encontré información relevante sobre esto en la documentación disponible. Asegúrate de que los documentos relacionados con tu pregunta han sido subidos al sistema.',
      sources: [],
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  // 3. Identificar los documentos relevantes (deduplicar por documentId)
  const docScores = new Map<string, { documentId: string; documentName: string; maxScore: number }>();
  for (const m of matches) {
    if (!m.metadata || typeof m.score !== 'number' || m.score < MIN_SCORE) continue;
    const docId = String(m.metadata.documentId || '');
    const docName = String(m.metadata.documentName || 'Documento');
    if (!docId) continue;

    const existing = docScores.get(docId);
    if (!existing || m.score > existing.maxScore) {
      docScores.set(docId, { documentId: docId, documentName: docName, maxScore: m.score });
    }
  }

  // Ordenar por score y limitar
  const topDocs = [...docScores.values()]
    .sort((a, b) => b.maxScore - a.maxScore)
    .slice(0, MAX_DOCUMENTS);

  if (topDocs.length === 0) {
    return {
      answer: 'No encontré información relevante sobre esto en la documentación disponible.',
      sources: [],
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  // 4. Recuperar texto completo de Supabase
  const docIds = topDocs.map(d => d.documentId);
  const fullTexts = await fetchFullTexts(supabase, docIds);

  // 5. Construir contexto con documentos completos
  const context = buildContext(topDocs, fullTexts, matches);

  // 6. Construir mensajes para Claude
  const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);

  const userQuestion = `DOCUMENTOS RELEVANTES:

${context}

---

PREGUNTA DEL USUARIO: ${question}`;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...recentHistory,
    { role: 'user', content: userQuestion },
  ];

  // 7. Llamar a Claude
  let text: string;
  let usage: { inputTokens: number; outputTokens: number };
  try {
    const response = await callLLMWithUsage('', {
      system: SYSTEM_PROMPT,
      messages,
      model: 'haiku',
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: TEMPERATURE,
    });
    text = response.text;
    usage = response.usage;
  } catch (err) {
    console.error('[RAG] LLM call failed:', err instanceof Error ? err.message : err);
    mapLLMError(err);
    throw err;
  }

  return {
    answer: text || 'No se pudo generar una respuesta.',
    sources: topDocs.map(d => ({
      documentName: d.documentName,
      score: d.maxScore,
    })),
    usage,
  };
}

// ============================================================
// Helpers internos
// ============================================================

/**
 * Recupera el texto completo de los documentos desde Supabase.
 * Si un documento no tiene full_text (aún no se migró), reconstruye
 * desde los chunks de Pinecone como fallback.
 */
async function fetchFullTexts(
  supabase: SupabaseClient,
  documentIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  const { data, error } = await supabase
    .from('documents')
    .select('id, full_text')
    .in('id', documentIds);

  if (error) {
    console.warn('[RAG] Error fetching full_text:', error.message);
    return result;
  }

  for (const row of data || []) {
    if (row.full_text && row.full_text.trim().length > 0) {
      result.set(row.id, row.full_text);
    }
  }

  return result;
}

/**
 * Construye el bloque de contexto para Claude.
 *
 * Para cada documento relevante:
 * - Si tiene full_text en Supabase → usa el documento completo
 * - Si no (fallback) → usa los chunks recuperados de Pinecone
 *
 * Respeta MAX_CONTEXT_CHARS para no exceder el contexto.
 */
function buildContext(
  topDocs: Array<{ documentId: string; documentName: string; maxScore: number }>,
  fullTexts: Map<string, string>,
  matches: Array<{ metadata?: Record<string, unknown>; score?: number }>,
): string {
  const sections: string[] = [];
  let totalChars = 0;

  for (const doc of topDocs) {
    const fullText = fullTexts.get(doc.documentId);

    let docContent: string;
    if (fullText) {
      // Documento completo disponible
      docContent = fullText;
    } else {
      // Fallback: reconstruir desde chunks de Pinecone
      const docChunks = matches
        .filter(m => m.metadata && String(m.metadata.documentId) === doc.documentId)
        .map(m => ({
          text: String(m.metadata!.text || ''),
          chunkIndex: Number(m.metadata!.chunkIndex ?? 0),
        }))
        .sort((a, b) => a.chunkIndex - b.chunkIndex);

      // Deduplicar chunks por índice
      const seen = new Set<number>();
      const uniqueChunks = docChunks.filter(c => {
        if (seen.has(c.chunkIndex)) return false;
        seen.add(c.chunkIndex);
        return true;
      });

      docContent = uniqueChunks.map(c => c.text).join('\n\n');
    }

    // Respetar límite de contexto total
    if (totalChars + docContent.length > MAX_CONTEXT_CHARS) {
      const remaining = MAX_CONTEXT_CHARS - totalChars;
      if (remaining > 500) {
        // Hay espacio para un trozo significativo
        docContent = docContent.slice(0, remaining) + '\n[... documento truncado por longitud]';
      } else {
        // No cabe más, parar
        break;
      }
    }

    sections.push(`[Documento: ${doc.documentName}]\n${docContent}`);
    totalChars += docContent.length;
  }

  return sections.join('\n\n---\n\n');
}
