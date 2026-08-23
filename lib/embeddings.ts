/**
 * Genera embeddings usando Pinecone Inference API (SDK).
 * Modelo: multilingual-e5-large — 1024 dimensiones, multilingüe, gratis con Pinecone.
 */

import { getPinecone } from './pinecone';

const EMBEDDING_MODEL = 'multilingual-e5-large';

/** Chunks por lote enviados a la API de inferencia (tamaño de la petición, no
 *  de ritmo — F-31 P3 quitó la pausa fija que existía entre lotes). */
const BATCH_SIZE = 20;

/** Reintentos ante 429 antes de rendirse, con backoff exponencial y jitter. */
const MAX_EMBED_RETRIES = 6;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;
/** Proporción de jitter aleatorio añadida sobre el backoff calculado, para
 *  que varias llamadas concurrentes tras un 429 no reintenten todas a la vez. */
const JITTER_RATIO = 0.3;

function isPineconeRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
}

/**
 * Un lote, con reintento ante 429 (F-31 P3). Backoff exponencial (1s → 2s →
 * 4s → ... tope 30s) más jitter aleatorio, sin pausa si no hay presión.
 *
 * Sin `retry-after`: el SDK de Pinecone no lo expone. mapHttpStatusError
 * (@pinecone-database/pinecone/dist/errors/http.js) construye el error con
 * FailedRequestInfo = {status, url, body, message} — nunca lee los headers de
 * la respuesta, así que un 429 llega como PineconeUnmappedHttpError con el
 * status incrustado en el texto del mensaje (por eso el `includes('429')` de
 * abajo), sin ningún campo por el que asomarse a retry-after. Para leerlo de
 * verdad haría falta esquivar el SDK y hablar con la API de inferencia por
 * HTTP directo — fuera de alcance aquí.
 */
async function embedBatchWithBackoff(
  pc: ReturnType<typeof getPinecone>,
  batch: string[],
  batchNum: number,
): ReturnType<typeof pc.inference.embed> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await pc.inference.embed(EMBEDDING_MODEL, batch, { inputType: 'passage', truncate: 'END' });
    } catch (error) {
      if (!isPineconeRateLimitError(error) || attempt >= MAX_EMBED_RETRIES) throw error;
      const backoffMs = Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS);
      const waitMs = Math.round(backoffMs + Math.random() * backoffMs * JITTER_RATIO);
      console.log(`[EMBED] 429 en lote ${batchNum} (intento ${attempt + 1}/${MAX_EMBED_RETRIES}) — backoff ${waitMs}ms`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
}

/** Genera embeddings para múltiples textos (para indexación de documentos) */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const pc = getPinecone();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

    console.log(`[EMBED] Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);

    const response = await embedBatchWithBackoff(pc, batch, batchNum);
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
    [text],
    { inputType: 'query', truncate: 'END' }
  );

  return response.data[0].values as number[];
}
