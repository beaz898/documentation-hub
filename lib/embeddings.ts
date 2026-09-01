/**
 * Genera embeddings usando Pinecone Inference API (SDK).
 * Modelo: multilingual-e5-large — 1024 dimensiones, multilingüe, gratis con Pinecone.
 */

import { getPinecone } from './pinecone';

const EMBEDDING_MODEL = 'multilingual-e5-large';

/** Chunks por lote enviados a la API de inferencia (tamaño de la petición, no
 *  de ritmo — F-31 P3 quitó la pausa fija que existía entre lotes). */
const BATCH_SIZE = 20;

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;
/** Proporción de jitter aleatorio añadida sobre el backoff calculado, para
 *  que varias llamadas concurrentes tras un 429 no reintenten todas a la vez. */
const JITTER_RATIO = 0.3;

/**
 * DOS PRESUPUESTOS DE REINTENTO, Y NO ES UN CAPRICHO: ES EL TIEMPO QUE TIENE
 * CADA FUNCIÓN (01/09/2026).
 *
 * `vercel.json` da 60 s a `/api/ingest` y **30 s a `/api/ask`**. La política de
 * indexación son seis reintentos con topes 1→2→4→8→16→30 s: **más de 60 s solo
 * en esperas**. Copiarla al camino de consulta no habría dado un error limpio
 * sino un TIMEOUT DE PLATAFORMA — sin `catch`, sin `logUsage`, sin mensaje y con
 * el crédito ya cobrado. El arreglo habría empeorado lo que dice arreglar.
 *
 * Y hay que contarlo junto: en esos mismos 30 s corre también la llamada a
 * Anthropic, con su propio retry de hasta 32 s (`llm/anthropic-client.ts`).
 *
 * ⚠️ EL AGENTE HEREDA EL PRESUPUESTO CORTO aunque corra en el worker de Railway,
 * donde no hay tope de 30 s: comparte `generateQueryEmbedding`. Declarado —
 * reintentar menos de lo que se podría es aceptable; más de lo que cabe, no.
 */
export const REINTENTOS_INDEXACION = 6;
export const REINTENTOS_CONSULTA = 2;

/**
 * EL PLAN DE CADA CAMINO: con qué prefijo se embebe y cuántos reintentos caben.
 *
 * ⚠️ LOS DOS DATOS VAN JUNTOS PORQUE SON UNA SOLA DECISIÓN, y hasta el 01/09
 * estaban sueltos en los sitios de llamada — que es como el `inputType` de la
 * indexación acabó CLAVADO dentro de la función de backoff y estuvo a punto de
 * heredarlo la consulta al «reutilizarla».
 *
 * Y ES LO QUE HACE VIGILABLE EL HALLAZGO: sin esto, que la consulta se embeba
 * como `query` y no como `passage` no lo comprobaba nada —el argumento del SDK
 * no se puede observar sin mocks, que el protocolo prohíbe—. Aquí sí: el plan es
 * un valor, y un valor se compara.
 *
 * multilingual-e5 produce vectores distintos según el prefijo, a propósito.
 * Mandar una pregunta del chat como `passage` la sacaría del espacio en el que
 * se compara contra el corpus: la recuperación se degradaría en TODAS las
 * preguntas, en silencio y sin un solo error en los logs.
 */
export interface PlanDeEmbedding {
  inputType: 'passage' | 'query';
  maxIntentos: number;
}

export function planDeEmbedding(camino: 'indexacion' | 'consulta'): PlanDeEmbedding {
  return camino === 'consulta'
    ? { inputType: 'query', maxIntentos: REINTENTOS_CONSULTA }
    : { inputType: 'passage', maxIntentos: REINTENTOS_INDEXACION };
}

/**
 * ¿ES UN FALLO PASAJERO? Hoy: solo 429/RESOURCE_EXHAUSTED.
 *
 * ⚠️ UN 5xx NO CUENTA, y no es un olvido: es la política de HOY, la misma desde
 * F-31 P3. Un corte del proveedor —como el del 01/09— se trata como error
 * definitivo y se relanza al primer intento. Ampliarlo es una decisión aparte
 * porque esta función la usa TAMBIÉN la indexación, y alargar seis reintentos
 * contra un proveedor roto tiene su propio coste. Va en su commit.
 *
 * TOLERA CUALQUIER COSA: el SDK de Pinecone no siempre lanza `Error`, así que
 * `null`, `undefined` y una cadena suelta tienen que contestar sin romper.
 */
export function esErrorPasajeroDePinecone(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
}

/**
 * LA ESPERA DEL REINTENTO `intento`, en milisegundos y SIN JITTER.
 *
 * El jitter se añade fuera, en quien duerme, y por una razón de método: una
 * función que devuelve un número aleatorio no se puede comprobar, y **el tope sí
 * hay que comprobarlo** — sin él, el intento 6 esperaría 64 s.
 * El intento 0 no es un reintento y aun así tiene espera: es la primera pausa,
 * la que se hace ANTES de repetir.
 */
export function esperaDeReintento(intento: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** intento, BACKOFF_MAX_MS);
}

/** ¿Se reintenta? Las dos condiciones juntas, en un solo sitio, para que ningún
 *  camino se invente la suya. */
export function debeReintentar(error: unknown, intento: number, maxIntentos: number): boolean {
  return esErrorPasajeroDePinecone(error) && intento < maxIntentos;
}

/**
 * Una llamada a la API de inferencia, con reintento ante 429 (F-31 P3). Backoff
 * exponencial (1s → 2s → 4s → ... tope 30s) más jitter aleatorio, sin pausa si
 * no hay presión.
 *
 * ⚠️ EL `inputType` ES PARÁMETRO Y NO CONSTANTE, y aquí está el motivo de que
 * esta función no se pudiera «reutilizar» tal cual para las consultas: lo tenía
 * CLAVADO en `'passage'`. multilingual-e5 produce vectores distintos según el
 * prefijo, a propósito: mandar una pregunta del chat como `passage` la habría
 * sacado del espacio en el que se compara contra el corpus, degradando la
 * recuperación **en todas las preguntas, en silencio y sin un solo error en los
 * logs**. Lo que se comparte es la POLÍTICA de reintento, no la llamada.
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
async function embedConBackoff(
  pc: ReturnType<typeof getPinecone>,
  textos: string[],
  plan: PlanDeEmbedding,
  etiqueta: string,
): ReturnType<typeof pc.inference.embed> {
  const { inputType, maxIntentos } = plan;
  for (let attempt = 0; ; attempt++) {
    try {
      return await pc.inference.embed(EMBEDDING_MODEL, textos, { inputType, truncate: 'END' });
    } catch (error) {
      if (!debeReintentar(error, attempt, maxIntentos)) throw error;
      const backoffMs = esperaDeReintento(attempt);
      const waitMs = Math.round(backoffMs + Math.random() * backoffMs * JITTER_RATIO);
      console.log(`[EMBED] 429 en ${etiqueta} (intento ${attempt + 1}/${maxIntentos}) — backoff ${waitMs}ms`);
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

    const response = await embedConBackoff(pc, batch, planDeEmbedding('indexacion'), `lote ${batchNum}`);
    for (const item of response.data) {
      allEmbeddings.push(item.values as number[]);
    }
  }

  return allEmbeddings;
}

/**
 * Genera embedding para una consulta (para búsqueda).
 *
 * ⚠️ HASTA EL 01/09/2026 ERA LA ÚNICA LLAMADA EXTERNA DEL PRODUCTO SIN NINGUNA
 * PROTECCIÓN — ni siquiera ante un 429—, y es la más frecuente: la usan el chat
 * (`rag.ts`) y la herramienta de búsqueda del agente. La más transitada era la
 * menos protegida.
 *
 * Un fallo aquí aborta la operación entera **con el crédito ya cobrado**
 * (`/api/ask` consume antes y no reembolsa). El reembolso es otro commit; esto
 * reduce cuántas veces hace falta, no la necesidad.
 *
 * PRESUPUESTO CORTO a propósito: ver `REINTENTOS_CONSULTA`.
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  const pc = getPinecone();

  // Reintentar una consulta es INOCUO: `inference.embed` no escribe nada y
  // repetirla devuelve el mismo vector. No vale para todo lo de Pinecone — un
  // `upsert` por lotes no se reintenta con este criterio (ver B.138 y el mapa
  // de la regla 6).
  const response = await embedConBackoff(pc, [text], planDeEmbedding('consulta'), 'consulta');

  return response.data[0].values as number[];
}
