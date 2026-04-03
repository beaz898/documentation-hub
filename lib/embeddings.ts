/**
 * Genera embeddings usando Pinecone Inference API (SDK).
 * Modelo: multilingual-e5-large — 1024 dimensiones, multilingüe, gratis con Pinecone.
 */

import { getPinecone } from './pinecone';

const EMBEDDING_MODEL = 'multilingual-e5-large';

/** Genera embeddings para múltiples textos (para indexación de documentos) */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const pc = getPinecone();

  // Lotes pequeños (20) con pausa entre ellos para respetar el rate limit
  // Pinecone free tier: 250K tokens/min → ~20 chunks de ~500 tokens = ~10K tokens por lote
  const batchSize = 20;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(texts.length / batchSize);

    console.log(`[EMBED] Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);

    try {
      const response = await pc.inference.embed(
        EMBEDDING_MODEL,
        batch,
        { inputType: 'passage', truncate: 'END' }
      );

      for (const item of response.data) {
        allEmbeddings.push(item.values as number[]);
      }
    } catch (error: unknown) {
      // Si nos pasa el rate limit, esperar 60 segundos y reintentar
      const message = error instanceof Error ? error.message : '';
      if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        console.log(`[EMBED] Rate limit hit at batch ${batchNum}, waiting 60s...`);
        await new Promise(resolve => setTimeout(resolve, 60000));

        // Reintentar
        const response = await pc.inference.embed(
          EMBEDDING_MODEL,
          batch,
          { inputType: 'passage', truncate: 'END' }
        );

        for (const item of response.data) {
          allEmbeddings.push(item.values as number[]);
        }
      } else {
        throw error;
      }
    }

    // Pausa entre lotes para no saturar el rate limit (3 segundos)
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return allEmbeddings;
}

/** Genera embedding para una consulta (para búsqueda) */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const pc = getPinecone();

  const response = await pc.inference.embed(
    EMBEDDING_MODEL,
    [text],
    { inputType: 'query', truncate: 'END' }
  );

  return response.data[0].values as number[];
}
