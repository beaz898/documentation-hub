/**
 * Genera embeddings usando Pinecone Inference API (SDK).
 * Modelo: multilingual-e5-large — 1024 dimensiones, multilingüe, gratis con Pinecone.
 */

import { getPinecone } from './pinecone';

const EMBEDDING_MODEL = 'multilingual-e5-large';

/** Genera embeddings para múltiples textos (para indexación de documentos) */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const pc = getPinecone();

  // Procesar en lotes de 96 (límite del modelo)
  const batchSize = 96;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await pc.inference.embed(
      EMBEDDING_MODEL,
      batch.map(text => ({ text })),
      { inputType: 'passage', truncate: 'END' }
    );

    for (const item of response.data) {
      allEmbeddings.push(item.values as number[]);
    }
  }

  return allEmbeddings;
}

/** Genera embedding para una consulta (para búsqueda) */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const pc = getPinecone();

  const response = await pc.inference.embed(
    EMBEDDING_MODEL,
    [{ text }],
    { inputType: 'query', truncate: 'END' }
  );

  return response.data[0].values as number[];
}
