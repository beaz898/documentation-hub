import type { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { getIndex } from '@/lib/pinecone';
import {
  esErrorPasajeroDePinecone,
  esperaDeReintento,
  hayPresupuestoParaEsperar,
} from '@/lib/embeddings';
import type {
  VectorRecord,
  QueryVectorsParams,
  VectorMatch,
  VectorMetadata,
} from './types';

/**
 * EL RETRY DE LOS DATOS VECTORIALES (regla 6, 02/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * HASTA HOY NINGUNA DE ESTAS FUNCIONES REINTENTABA. Un corte de un segundo en
 * el plano de datos de Pinecone abortaba un análisis o una consulta del chat
 * con el crédito ya cobrado, o dejaba una indexación a medias.
 *
 * ⚠️ Y NO TODAS LO LLEVAN, QUE ES EL RESULTADO Y NO UNA OMISIÓN. Reintentar una
 * ESCRITURA no es como reintentar una lectura, y de las ocho funciones que
 * hablan con Pinecone hay tres que se quedan fuera con su razón escrita — ver
 * el bloque de exclusiones, más abajo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LA POLÍTICA SE REUTILIZA DE `lib/embeddings.ts`, NO SE COPIA: es el MISMO
 * proveedor, así que qué error es pasajero y cuánto se espera ya están
 * decididos, son puros y tienen batería. Lo que NO se reutiliza es el plan de
 * embeddings: el suyo lleva `inputType`, que aquí no significa nada.
 *
 * EL TECHO ES DE 10 s Y NO DE 30 COMO EL DE INDEXACIÓN, y no es prudencia
 * vaga: el llamador más apretado es `/api/ask` con `maxDuration: 30`, y ahí el
 * vector NO va solo — comparte esos 30 s con el embedding de la consulta (hasta
 * ~3,6 s) y con la llamada a Anthropic (hasta 32 s de su propio retry). El
 * presupuesto se cuenta ENTERO, que es la regla que este frente promovió a
 * `CLAUDE.md`, y ya nos mordió una vez copiando seis reintentos a una función
 * de 30 segundos.
 * (Y el tope de `/api/ingest` está declarado dos veces y distinto — B.141 —, lo
 * que refuerza elegir para el menor.)
 */
export const PLAN_DE_VECTORES = {
  maxIntentos: 3,
  presupuestoEsperaMs: 10_000,
} as const;

/** El acumulado de espera de UNA llamada, compartido por todos sus lotes o
 *  páginas. Igual que en embeddings: sin esto el peor caso crecería con el
 *  número de chunks del documento. */
interface EsperaGastada { ms: number }

/**
 * Ejecuta una operación contra Pinecone reintentando los fallos PASAJEROS.
 *
 * ⚠️ SE LLAMA POR LOTE O POR PÁGINA, NUNCA ALREDEDOR DEL BUCLE, y el nivel
 * importa distinto según la función:
 *   · en `upsertVectors` y `deleteVectorsByIds` el nivel equivocado cuesta
 *     TIEMPO, no corrección — los ids son deterministas, así que repetir un
 *     lote deja el mismo estado;
 *   · en `listVectorIdsByPrefix` el nivel equivocado CORROMPE: reintentar el
 *     bucle sin reiniciar el acumulador duplicaría ids, y esa lista decide
 *     borrados.
 */
async function conReintento<T>(
  operacion: () => Promise<T>,
  gastada: EsperaGastada,
  etiqueta: string,
): Promise<T> {
  for (let intento = 0; ; intento++) {
    try {
      return await operacion();
    } catch (error) {
      const espera = esperaDeReintento(intento);
      const sigue =
        esErrorPasajeroDePinecone(error) &&
        intento < PLAN_DE_VECTORES.maxIntentos &&
        hayPresupuestoParaEsperar(gastada.ms, espera, PLAN_DE_VECTORES.presupuestoEsperaMs);
      if (!sigue) throw error;

      gastada.ms += espera;
      console.log(
        `[vectores] fallo pasajero en ${etiqueta} (intento ${intento + 1}/${PLAN_DE_VECTORES.maxIntentos}) — ` +
        `espera acumulada ${gastada.ms}/${PLAN_DE_VECTORES.presupuestoEsperaMs}ms`,
      );
      await new Promise(r => setTimeout(r, espera));
    }
  }
}

/** Filtro de metadata de Pinecone que define el CORPUS ACTIVO: los vectores que
 *  el chat y el análisis consideran parte del corpus servible. Fuente única (F-1):
 *  chat y análisis usan esta MISMA constante, en vez de listas por query. Hoy =
 *  documentos analizados; en C.8 se ampliará para excluir inertes. La coherencia
 *  se garantiza porque toda transición de estado mantiene la metadata al día
 *  (mark-analyzed, sync/C.3, ingest, index-text lo hacen — verificado). */
export const CORPUS_ACTIVO = { analysisStatus: { $eq: 'analizado' } };

/**
 * Filtro del corpus servible, ampliado opcionalmente con documentos concretos
 * aún sin validar. Permite que los documentos de una misma tanda en la
 * bandeja de revisión (analysisStatus='pendiente', pero con vectores ya
 * indexados y embeddings calculados) se comparen entre sí durante el
 * análisis, sin abrir el corpus general a todo lo pendiente.
 *
 * Sin ids (o array vacío): devuelve CORPUS_ACTIVO tal cual — mismo
 * comportamiento que hoy, sin cambio de filtro.
 */
export function buildCorpusFilter(includePendingIds?: string[]): object {
  if (!includePendingIds || includePendingIds.length === 0) {
    return CORPUS_ACTIVO;
  }
  return {
    $or: [
      CORPUS_ACTIVO,
      { documentId: { $in: includePendingIds } },
    ],
  };
}

const UPSERT_BATCH = 100;
const DELETE_BATCH = 1000;

/** Consulta de similitud dentro del namespace de una organización.
 *  Devuelve los matches tal cual (sin filtrar por score: eso lo hace el llamador). */
export async function queryVectors(
  orgId: string,
  params: QueryVectorsParams,
): Promise<VectorMatch[]> {
  const ns = getIndex().namespace(orgId);
  // LECTURA PURA: reintentar no cambia ningún estado, así que es inocuo.
  const res = await conReintento(() => ns.query({
    vector: params.vector,
    topK: params.topK,
    includeMetadata: params.includeMetadata ?? true,
    includeValues: params.includeValues ?? false,
    ...(params.filter ? { filter: params.filter } : {}),
  }), { ms: 0 }, 'query');
  return (res.matches ?? []).map((m) => ({
    id: m.id,
    score: m.score,
    metadata: m.metadata as VectorMetadata | undefined,
    values: m.values,
  }));
}

/** Inserta/actualiza vectores (ya construidos) en el namespace de la org, por lotes. */
export async function upsertVectors(
  orgId: string,
  vectors: VectorRecord[],
): Promise<void> {
  if (vectors.length === 0) return;
  const ns = getIndex().namespace(orgId);
  const gastada = { ms: 0 };
  for (let i = 0; i < vectors.length; i += UPSERT_BATCH) {
    // VectorMetadata es structuralmente compatible con RecordMetadata en runtime;
    // el cast es necesario porque VectorMetadata no extiende RecordMetadata
    // (los campos opcionales tendrían tipo `string | undefined`, incompatible con el índice del SDK).
    //
    // REINTENTO POR LOTE, Y ES SEGURO PORQUE EL ID ES DETERMINISTA:
    // `buildVectorId(documentId, generation, chunkIndex)` no lleva nada aleatorio
    // ni marca de tiempo, así que reescribir el mismo lote produce EXACTAMENTE
    // los mismos registros. No duplica: sobrescribe.
    const lote = vectors.slice(i, i + UPSERT_BATCH);
    await conReintento(
      () => ns.upsert(lote as unknown as PineconeRecord<RecordMetadata>[]),
      gastada,
      `upsert lote ${i / UPSERT_BATCH + 1}`,
    );
  }
}

/** Borra vectores por lista de IDs, por lotes. */
export async function deleteVectorsByIds(
  orgId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const ns = getIndex().namespace(orgId);
  const gastada = { ms: 0 };
  for (let i = 0; i < ids.length; i += DELETE_BATCH) {
    // REINTENTO POR LOTE: borrar por id algo YA BORRADO es un no-op en Pinecone,
    // y la lista de ids se calculó antes y no cambia entre intentos. Es lo que
    // distingue este borrado del de por filtro, que sí se reevalúa.
    const lote = ids.slice(i, i + DELETE_BATCH);
    await conReintento(() => ns.deleteMany(lote), gastada, `delete lote ${i / DELETE_BATCH + 1}`);
  }
}

/**
 * Borra vectores que coincidan con un filtro de metadata (p. ej. {documentId:{$eq:id}}).
 *
 * ⚠️ SIN REINTENTO, Y ES UNA DECISIÓN (02/09/2026), NO UN OLVIDO.
 *
 * `deleteMany(filtro)` NO borra un conjunto fijo: borra LO QUE EXISTA EN EL
 * MOMENTO DE EJECUTARSE. Un reintento diez segundos después no es la misma
 * operación — si entre medias alguien escribió vectores que casan el filtro, el
 * reintento se los lleva. No es un borrado a medias repetido: es un borrado
 * DISTINTO con el mismo nombre.
 *
 * QUÉ FALTA PARA PODER REINTENTARLO: declarar —y garantizar— que nadie escribe
 * en el namespace mientras esto corre. Hoy se cumple por casualidad y depende de
 * que nadie meta una escritura concurrente mañana. Está anotado como pendiente.
 * NO SE REINTENTA POR MIEDO: se deja fuera porque la propiedad que lo haría
 * seguro no está escrita en ninguna parte.
 */
export async function deleteVectorsByFilter(
  orgId: string,
  filter: object,
): Promise<void> {
  const ns = getIndex().namespace(orgId);
  await ns.deleteMany(filter);
}

/**
 * Borra TODOS los vectores del namespace de una organización (purga completa).
 *
 * ⚠️ SIN REINTENTO, por la misma razón que `deleteVectorsByFilter` y con más
 * motivo: esto es el namespace ENTERO. Lo usa `purgeOrganization`, y un
 * reintento tardío borraría lo que se hubiera escrito entre medias.
 */
export async function deleteAllVectors(orgId: string): Promise<void> {
  const ns = getIndex().namespace(orgId);
  await ns.deleteAll();
}

/** Recupera vectores por ID. Devuelve un mapa id → record. */
export async function fetchVectors(
  orgId: string,
  ids: string[],
): Promise<Record<string, { id: string; values: number[]; metadata?: VectorMetadata }>> {
  if (ids.length === 0) return {};
  const ns = getIndex().namespace(orgId);
  // LECTURA PURA, como `queryVectors`: reintentar no cambia ningún estado.
  const res = await conReintento(() => ns.fetch(ids), { ms: 0 }, 'fetch');
  const out: Record<string, { id: string; values: number[]; metadata?: VectorMetadata }> = {};
  for (const [id, rec] of Object.entries(res.records ?? {})) {
    out[id] = {
      id: rec.id,
      values: rec.values,
      metadata: rec.metadata as VectorMetadata | undefined,
    };
  }
  return out;
}

/** Actualiza (merge parcial) la metadata de UN vector por su ID, sin re-subirlo.
 *  Nace aquí para el backfill de estado (B.4); aún no la usa nadie.
 *
 *  ⚠️ SIN REINTENTO, y no por la operación —un merge del mismo parcial aplicado
 *  dos veces deja el mismo estado, así que sería idempotente— sino porque NO
 *  TIENE LLAMADOR. Dar retry a código muerto es añadir superficie sin lector.
 *  El día que alguien la use, entra con él. */
export async function updateVectorMetadata(
  orgId: string,
  id: string,
  metadata: Partial<VectorMetadata>,
): Promise<void> {
  const ns = getIndex().namespace(orgId);
  // Mismo motivo que en upsertVectors: cast estructural, compatible en runtime.
  await ns.update({ id, metadata: metadata as unknown as RecordMetadata });
}

/** Lista TODOS los IDs de vectores de un documento en el namespace de la org,
 *  paginando hasta agotar resultados. El prefijo lleva el guion final
 *  (`${documentId}-`) a propósito: sin él, un documentId que fuera prefijo textual
 *  de otro arrastraría chunks ajenos. Con UUIDs es improbable; el guion lo hace
 *  estructuralmente imposible. Usado por C.3 para borrar los "zombis" (chunks
 *  sobrantes de una versión anterior más larga) por lo que HAY en Pinecone, no
 *  por lo que chunk_count dice que hubo. */
export async function listVectorIdsByPrefix(
  orgId: string,
  documentId: string,
): Promise<string[]> {
  const ns = getIndex().namespace(orgId);
  const prefix = `${documentId}-`;
  const ids: string[] = [];
  let paginationToken: string | undefined = undefined;

  const gastada = { ms: 0 };

  do {
    // ⚠️ REINTENTO POR PÁGINA, NUNCA ALREDEDOR DEL BUCLE. Aquí el nivel
    // equivocado no cuesta tiempo: CORROMPE. Reintentar el bucle sin reiniciar
    // `ids` duplicaría entradas, y esta lista decide borrados.
    const res = await conReintento(
      () => ns.listPaginated({ prefix, ...(paginationToken ? { paginationToken } : {}) }),
      gastada,
      'listPaginated',
    );
    for (const item of res.vectors ?? []) {
      if (item.id) ids.push(item.id);
    }
    paginationToken = res.pagination?.next;
  } while (paginationToken);

  // ⚠️ TODO O EXCEPCIÓN. Si una página se agota sin éxito, `conReintento` LANZA y
  // esta función no devuelve nada — nunca «lo que llevo». Es la lección de
  // B.138 aplicada a otra función: un listado PARCIAL que alimenta un borrado
  // hace que se borre lo que faltaba en la lista. El llamador (la sync de Drive)
  // aborta con la excepción, que es el comportamiento seguro.
  // El retry no cambia esta garantía: la hace menos necesaria, no menos cierta.
  return ids;
}

/**
 * Formato de ID de vector consciente de generación (C.4b, F-1 sección 3).
 * - Generación 1: ${documentId}-${chunkIndex}  (formato histórico, SIN -g1-, para
 *   que los vectores existentes sigan siendo válidos sin reindexar — g1 implícita).
 * - Generación N>=2: ${documentId}-g${N}-${chunkIndex}
 * documentId es un UUID (contiene guiones), por eso el parseo se ancla al FINAL.
 */
export function buildVectorId(documentId: string, generation: number, chunkIndex: number): string {
  return generation >= 2
    ? `${documentId}-g${generation}-${chunkIndex}`
    : `${documentId}-${chunkIndex}`;
}

/**
 * Todos los IDs de vector de un documento, en su generación activa.
 *
 * Existe para que ningún punto del repo vuelva a construir `${id}-${i}` a mano:
 * ese patrón asume generación 1 y, en un documento que ya pasó por un swap
 * (active_generation >= 2), produce IDs que NO EXISTEN en Pinecone. Según el
 * caso eso significa leer vacío, escribir metadata al vacío o —lo más grave—
 * creer que se ha borrado algo que sigue ahí.
 *
 * `generation` debe venir de documents.active_generation. Cuando esa columna
 * es NULL (corpus anterior al modelo de generaciones) el valor correcto es 1,
 * y para generación 1 la salida es idéntica byte a byte al patrón antiguo.
 */
export function buildAllVectorIds(
  documentId: string,
  chunkCount: number,
  generation: number,
): string[] {
  if (!Number.isFinite(chunkCount) || chunkCount <= 0) return [];
  const safeGeneration = Number.isFinite(generation) && generation >= 1 ? generation : 1;
  return Array.from({ length: chunkCount }, (_, i) =>
    buildVectorId(documentId, safeGeneration, i),
  );
}

/**
 * Descompone un ID de vector en { documentId, generation, chunkIndex }.
 * Tolerante: un ID sin marca -g{N}- es generación 1 implícita. Se ancla al FINAL
 * del string para no tropezar con los guiones del UUID del documentId.
 * Devuelve null si el ID no encaja en ninguno de los dos formatos (anomalía).
 */
export function parseVectorId(id: string): { documentId: string; generation: number; chunkIndex: number } | null {
  // Generación N>=2: ...-g{N}-{i} al final.
  const genMatch = id.match(/^(.*)-g(\d+)-(\d+)$/);
  if (genMatch) {
    return { documentId: genMatch[1], generation: parseInt(genMatch[2], 10), chunkIndex: parseInt(genMatch[3], 10) };
  }
  // Generación 1 implícita: ...-{i} al final (sin -g).
  const g1Match = id.match(/^(.*)-(\d+)$/);
  if (g1Match) {
    return { documentId: g1Match[1], generation: 1, chunkIndex: parseInt(g1Match[2], 10) };
  }
  return null;
}
