import type { PineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';
import { getIndex } from '@/lib/pinecone';
import type {
  VectorRecord,
  QueryVectorsParams,
  VectorMatch,
  VectorMetadata,
} from './types';

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
