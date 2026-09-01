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
 * `/api/ask` tiene **30 s** (`vercel.json`), y `/api/ingest` tiene 60 o 300
 * según dónde se mire — ver la nota del presupuesto de espera, más abajo. La
 * política de indexación son seis reintentos con topes 1→2→4→8→16→30 s: **61 s
 * solo en esperas, POR LOTE**. Copiarla al camino de consulta no habría dado un
 * error limpio
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
 * ⚠️ Y UN TECHO TOTAL DE ESPERA POR LLAMADA, COMPARTIDO ENTRE LOTES (02/09/2026).
 *
 * EL NÚMERO DE REINTENTOS NO BASTA, y esto es lo que se vio al ampliar la
 * cobertura a los 5xx: los seis de indexación son **por lote**, y
 * `generateEmbeddings` recorre los lotes en serie. Un documento de 200 chunks
 * son diez lotes: con el proveedor caído, **610 s de espera pura** antes de
 * fallar igual. Sin techo agregado, el peor caso crece con el tamaño del
 * documento.
 *
 * ⚠️ Y EL PRESUPUESTO DE `/api/ingest` ESTÁ DECLARADO DOS VECES Y DISTINTO:
 * `vercel.json` dice 60 y `app/api/ingest/route.ts:14` dice 300. Cuál gana no se
 * puede resolver desde el repositorio, así que ESTE NÚMERO SE ELIGE PARA EL
 * MENOR: si gana 300, sobra; si gana 60, el diseño sigue en pie. Con 30 s de
 * espera como techo, queda sitio para las peticiones y para el resto de la
 * indexación aunque el presupuesto real sea el corto.
 *
 * Y ALARGAR AQUÍ NO ES SOLO ESPERAR: en el camino de REEMPLAZO, `ingest` borra
 * el documento viejo (`route.ts:221`) ANTES de generar los embeddings del nuevo
 * (`:237`). Entre esas dos líneas la organización no tiene ninguno de los dos, y
 * cada segundo de reintento ensancha esa ventana.
 *
 * EL DE CONSULTA NO ATA NUNCA: sus dos reintentos suman 3 s. Está para que el
 * plan sea completo, no para que haya dos reglas — y su caso lo dice.
 */
export const PRESUPUESTO_ESPERA_INDEXACION = 30_000;
export const PRESUPUESTO_ESPERA_CONSULTA = 5_000;

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
  /** Techo TOTAL de espera para una llamada entera, compartido entre lotes. */
  presupuestoEsperaMs: number;
}

export function planDeEmbedding(camino: 'indexacion' | 'consulta'): PlanDeEmbedding {
  return camino === 'consulta'
    ? { inputType: 'query', maxIntentos: REINTENTOS_CONSULTA, presupuestoEsperaMs: PRESUPUESTO_ESPERA_CONSULTA }
    : { inputType: 'passage', maxIntentos: REINTENTOS_INDEXACION, presupuestoEsperaMs: PRESUPUESTO_ESPERA_INDEXACION };
}

/**
 * ⚠️ UN ESTADO 5xx, NO «UN 5 SEGUIDO DE DOS DÍGITOS».
 *
 * `message.includes('500')` daría verdadero para «procesados 500 fragmentos», y
 * entonces un error PERMANENTE se reintentaría hasta agotar el presupuesto. El
 * número tiene que ir precedido de algo que lo declare estado — que es como lo
 * formatea el SDK: «PineconeUnmappedHttpError: 503 …».
 */
const ESTADO_5XX = /(?:status|http|error)[^0-9]{0,12}(5\d{2})\b/i;

/**
 * ¿ES UN FALLO PASAJERO? 429, RESOURCE_EXHAUSTED **y, desde el 02/09, los 5xx**.
 *
 * HASTA HOY UN CORTE DEL PROVEEDOR ERA UN ERROR DEFINITIVO: el incidente de
 * plano de control del 01/09 —el que se llevó la indexación de OPE-13— se
 * relanzaba al primer intento aunque durara segundos. Un 5xx es casi siempre lo
 * más transitorio que hay.
 *
 * NO ENTRÓ CON LOS 429 Y NO ERA UN OLVIDO: esta función la usa TAMBIÉN la
 * indexación, así que ampliarla multiplica cuántas veces se llega al backoff —
 * y por eso el mismo commit trae el techo total de espera. Ampliar sin acotar
 * habría cambiado un fallo rápido por un timeout de plataforma.
 *
 * UN 5xx PERMANENTE se reintentará igual (un 501 de un endpoint que no existe).
 * Aceptado y declarado: cuesta el presupuesto acotado y no más, y distinguirlo
 * no se puede con lo que el SDK expone.
 *
 * TOLERA CUALQUIER COSA: el SDK de Pinecone no siempre lanza `Error`, así que
 * `null`, `undefined` y una cadena suelta tienen que contestar sin romper.
 */

export function esErrorPasajeroDePinecone(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    ESTADO_5XX.test(message)
  );
}

/**
 * ¿CABE ESTA ESPERA EN LO QUE QUEDA DE PRESUPUESTO?
 *
 * ACOTA LA ESPERA, NO EL TIEMPO TOTAL: las peticiones en sí pueden tardar lo que
 * quieran. Es lo que se puede controlar sin un reloj —y sin un reloj se puede
 * comprobar—, y se dice en vez de fingirse.
 */
export function hayPresupuestoParaEsperar(
  gastadoMs: number,
  esperaMs: number,
  presupuestoMs: number,
): boolean {
  return gastadoMs + esperaMs <= presupuestoMs;
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
export function debeReintentar(
  error: unknown,
  intento: number,
  plan: PlanDeEmbedding,
  gastadoMs: number,
): boolean {
  return (
    esErrorPasajeroDePinecone(error) &&
    intento < plan.maxIntentos &&
    hayPresupuestoParaEsperar(gastadoMs, esperaDeReintento(intento), plan.presupuestoEsperaMs)
  );
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
/** El presupuesto gastado hasta ahora, COMPARTIDO por todos los lotes de una
 *  misma llamada. Es un objeto y no un número porque tiene que sobrevivir al
 *  bucle de lotes: ahí está la diferencia entre acotar la llamada y acotar cada
 *  lote por su cuenta, que es lo que no acotaba nada. */
interface EsperaGastada { ms: number }

async function embedConBackoff(
  pc: ReturnType<typeof getPinecone>,
  textos: string[],
  plan: PlanDeEmbedding,
  etiqueta: string,
  gastada: EsperaGastada,
): ReturnType<typeof pc.inference.embed> {
  const { inputType, maxIntentos } = plan;
  for (let attempt = 0; ; attempt++) {
    try {
      return await pc.inference.embed(EMBEDDING_MODEL, textos, { inputType, truncate: 'END' });
    } catch (error) {
      if (!debeReintentar(error, attempt, plan, gastada.ms)) throw error;
      const backoffMs = esperaDeReintento(attempt);
      const waitMs = Math.round(backoffMs + Math.random() * backoffMs * JITTER_RATIO);
      // Se cuenta el backoff calculado, no el jitter: el presupuesto es una
      // decisión y el jitter es ruido antiaglomeración.
      gastada.ms += backoffMs;
      console.log(
        `[EMBED] fallo pasajero en ${etiqueta} (intento ${attempt + 1}/${maxIntentos}) — ` +
        `backoff ${waitMs}ms | espera acumulada ${gastada.ms}/${plan.presupuestoEsperaMs}ms`,
      );
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
}

/** Genera embeddings para múltiples textos (para indexación de documentos) */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const pc = getPinecone();
  const allEmbeddings: number[][] = [];
  // UNO PARA TODA LA LLAMADA, no uno por lote: es lo que acota el peor caso
  // independientemente del tamaño del documento.
  const gastada = { ms: 0 };

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

    console.log(`[EMBED] Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);

    const response = await embedConBackoff(pc, batch, planDeEmbedding('indexacion'), `lote ${batchNum}`, gastada);
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
  const response = await embedConBackoff(pc, [text], planDeEmbedding('consulta'), 'consulta', { ms: 0 });

  return response.data[0].values as number[];
}
