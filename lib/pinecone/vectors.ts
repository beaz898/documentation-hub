import type { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { getIndex } from '@/lib/pinecone';
import type {
  VectorRecord,
  QueryVectorsParams,
  VectorMatch,
  VectorMetadata,
} from './types';

/** Filtro de metadata de Pinecone que define el CORPUS ACTIVO: los vectores que
 *  el chat y el análisis consideran parte del corpus servible. Fuente única (F-1):
 *  chat y análisis usan esta MISMA constante, en vez de listas por query. Hoy =
 *  documentos analizados; en C.8 se ampliará para excluir inertes. La coherencia
 *  se garantiza porque toda transición de estado mantiene la metadata al día
 *  (mark-analyzed, sync/C.3, ingest, index-text lo hacen — verificado). */
export const CORPUS_ACTIVO = { analysisStatus: { $eq: 'analizado' } };

const UPSERT_BATCH = 100;
const DELETE_BATCH = 1000;

/** Consulta de similitud dentro del namespace de una organización.
 *  Devuelve los matches tal cual (sin filtrar por score: eso lo hace el llamador). */
export async function queryVectors(
  orgId: string,
  params: QueryVectorsParams,
): Promise<VectorMatch[]> {
  const ns = getIndex().namespace(orgId);
  const res = await ns.query({
    vector: params.vector,
    topK: params.topK,
    includeMetadata: params.includeMetadata ?? true,
    includeValues: params.includeValues ?? false,
    ...(params.filter ? { filter: params.filter } : {}),
  });
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
  for (let i = 0; i < vectors.length; i += UPSERT_BATCH) {
    // VectorMetadata es structuralmente compatible con RecordMetadata en runtime;
    // el cast es necesario porque VectorMetadata no extiende RecordMetadata
    // (los campos opcionales tendrían tipo `string | undefined`, incompatible con el índice del SDK).
    await ns.upsert(vectors.slice(i, i + UPSERT_BATCH) as unknown as PineconeRecord<RecordMetadata>[]);
  }
}

/** Borra vectores por lista de IDs, por lotes. */
export async function deleteVectorsByIds(
  orgId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const ns = getIndex().namespace(orgId);
  for (let i = 0; i < ids.length; i += DELETE_BATCH) {
    await ns.deleteMany(ids.slice(i, i + DELETE_BATCH));
  }
}

/** Borra vectores que coincidan con un filtro de metadata (p. ej. {documentId:{$eq:id}}). */
export async function deleteVectorsByFilter(
  orgId: string,
  filter: object,
): Promise<void> {
  const ns = getIndex().namespace(orgId);
  await ns.deleteMany(filter);
}

/** Borra TODOS los vectores del namespace de una organización (purga completa). */
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
  const res = await ns.fetch(ids);
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
 *  Nace aquí para el backfill de estado (B.4); aún no la usa nadie. */
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

  do {
    const res = await ns.listPaginated({ prefix, ...(paginationToken ? { paginationToken } : {}) });
    for (const item of res.vectors ?? []) {
      if (item.id) ids.push(item.id);
    }
    paginationToken = res.pagination?.next;
  } while (paginationToken);

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
