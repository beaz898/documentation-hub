/**
 * Genera embeddings usando la API de Voyage AI (partner de Anthropic).
 * Modelo: voyage-3-large — 1024 dimensiones, optimizado para RAG.
 *
 * Nota: Necesitarás una API key de Voyage AI (voyageai.com).
 * Alternativa gratuita: usamos la API de Anthropic para generar
 * un hash semántico simple si no hay key de Voyage.
 * 
 * Para simplificar el MVP, usamos un enfoque híbrido:
 * - Si tienes VOYAGE_API_KEY → embeddings reales de Voyage (mejor calidad)
 * - Si no → usamos el endpoint de embeddings de Pinecone (incluido gratis)
 */

const EMBEDDING_DIM = 1024;

// ============================================================
// Opción 1: Pinecone Inference (gratis, incluido con tu cuenta)
// ============================================================
async function embedWithPinecone(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.pinecone.io/embed', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.PINECONE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'multilingual-e5-large',
      inputs: texts.map(text => ({ text })),
      parameters: { input_type: 'passage', truncate: 'END' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pinecone embed error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.data.map((item: { values: number[] }) => item.values);
}

async function queryEmbedWithPinecone(text: string): Promise<number[]> {
  const response = await fetch('https://api.pinecone.io/embed', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.PINECONE_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'multilingual-e5-large',
      inputs: [{ text }],
      parameters: { input_type: 'query', truncate: 'END' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pinecone embed error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.data[0].values;
}

// ============================================================
// Funciones públicas
// ============================================================

/** Genera embeddings para múltiples textos (para indexación) */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Procesar en lotes de 96 (límite de Pinecone Inference)
  const batchSize = 96;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await embedWithPinecone(batch);
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/** Genera embedding para una consulta (para búsqueda) */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  return queryEmbedWithPinecone(text);
}

export { EMBEDDING_DIM };
