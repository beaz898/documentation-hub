/**
 * Motor RAG (Retrieval-Augmented Generation).
 *
 * 1. Convierte la pregunta en un vector (embedding)
 * 2. Busca los chunks más relevantes en Pinecone
 * 3. Construye un prompt con los fragmentos encontrados
 * 4. Envía a Claude y devuelve la respuesta
 */

import Anthropic from '@anthropic-ai/sdk';
import { getIndex } from './pinecone';
import { generateQueryEmbedding } from './embeddings';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const TOP_K = 8; // Número de fragmentos a recuperar

const SYSTEM_PROMPT = `Eres un asistente experto en documentación empresarial. Tu trabajo es responder preguntas basándote ÚNICAMENTE en los fragmentos de documentación que se te proporcionan.

REGLAS:
1. Responde SOLO con información que encuentres en los fragmentos proporcionados.
2. Si no encuentras la respuesta en los fragmentos, dilo claramente: "No encontré información sobre esto en la documentación disponible."
3. NUNCA inventes información ni supongas datos que no estén en los fragmentos.
4. Cita el nombre del documento cuando sea relevante para que el usuario pueda consultarlo.
5. Sé conciso pero completo. Usa formato Markdown para estructurar la respuesta.
6. Mantén el mismo idioma que la pregunta del usuario.
7. Si la pregunta es ambigua, pide aclaración.
8. Si hay información contradictoria entre documentos, señálalo.`;

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
 * Ejecuta una consulta RAG completa.
 */
export async function queryRAG(
  question: string,
  orgId: string
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

  // Si no hay resultados relevantes
  if (matches.length === 0 || (matches[0].score && matches[0].score < 0.3)) {
    return {
      answer: 'No encontré información relevante sobre esto en la documentación disponible. Asegúrate de que los documentos relacionados con tu pregunta han sido subidos al sistema.',
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

  const userMessage = `FRAGMENTOS DE DOCUMENTACIÓN RELEVANTES:

${context}

---

PREGUNTA DEL USUARIO: ${question}`;

  // 4. Enviar a Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const answer = response.content
    .filter(block => block.type === 'text')
    .map(block => {
      if (block.type === 'text') return block.text;
      return '';
    })
    .join('');

  return {
    answer,
    sources: fragments.slice(0, 5), // Top 5 fuentes
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
