/**
 * Motor RAG (Retrieval-Augmented Generation).
 *
 * 1. Convierte la pregunta en un vector (embedding)
 * 2. Busca los chunks más relevantes en Pinecone
 * 3. Construye mensajes estructurados con los fragmentos encontrados
 * 4. Envía a Claude con system prompt separado e historial nativo
 */

import { getIndex } from './pinecone';
import { generateQueryEmbedding } from './embeddings';
import { callLLMWithUsage } from './analysis/llm-client';

const TOP_K = 8;
const MAX_HISTORY_MESSAGES = 6; // Últimos 3 pares pregunta-respuesta
const MAX_OUTPUT_TOKENS = 4096;
const TEMPERATURE = 0.3;

const SYSTEM_PROMPT = `Eres un asistente experto en documentación empresarial. Tu trabajo es responder preguntas basándote ÚNICAMENTE en los fragmentos de documentación que se te proporcionan.

REGLAS:
1. Responde SOLO con información que encuentres en los fragmentos proporcionados.
2. Si no encuentras la respuesta en los fragmentos, dilo claramente: "No encontré información sobre esto en la documentación disponible."
3. NUNCA inventes información ni supongas datos que no estén en los fragmentos.
4. Cita el nombre del documento cuando sea relevante para que el usuario pueda consultarlo.
5. Sé conciso pero completo. Usa formato Markdown para estructurar la respuesta.
6. Mantén el mismo idioma que la pregunta del usuario.
7. Si la pregunta es ambigua, pide aclaración.
8. Si hay información contradictoria entre documentos, señálalo.
9. Tienes acceso al historial reciente de la conversación. Úsalo para entender referencias como "eso", "lo anterior", "y cómo se hace", etc.
10. Responde de forma completa sin cortar la respuesta. Si la respuesta es larga, estructura bien con secciones.`;

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RAGResult {
  answer: string;
  sources: Array<{
    documentName: string;
    chunkText: string;
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
 * Ejecuta una consulta RAG completa con memoria de conversación.
 */
export async function queryRAG(
  question: string,
  orgId: string,
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
  if (matches.length === 0 || (matches[0].score && matches[0].score < 0.3)) {
    return {
      answer:
        'No encontré información relevante sobre esto en la documentación disponible. Asegúrate de que los documentos relacionados con tu pregunta han sido subidos al sistema.',
      sources: [],
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  // 3. Construir contexto con los fragmentos encontrados
  const fragments = matches
    .filter(m => m.metadata)
    .map(m => ({
      documentName: String(m.metadata!.documentName || 'Documento'),
      chunkText: String(m.metadata!.text || ''),
      score: m.score || 0,
    }));

  const context = fragments
    .map((f, i) => `[Fragmento ${i + 1} - ${f.documentName}]\n${f.chunkText}`)
    .join('\n\n---\n\n');

  // 4. Construir historial como mensajes nativos con roles
  const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);

  const userQuestion = `FRAGMENTOS DE DOCUMENTACIÓN RELEVANTES:

${context}

---

PREGUNTA DEL USUARIO: ${question}`;

  // El historial previo va como mensajes separados con su rol real.
  // La pregunta actual (con los fragmentos) va como el último mensaje de usuario.
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...recentHistory,
    { role: 'user', content: userQuestion },
  ];

  // 5. Llamar a Claude con system prompt separado y mensajes estructurados
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
    throw err; // inalcanzable, pero TypeScript lo necesita
  }

  return {
    answer: text || 'No se pudo generar una respuesta.',
    sources: fragments.slice(0, 5),
    usage,
  };
}
