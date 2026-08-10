import { createServiceClient } from '@/lib/supabase';

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Fila de la tabla document_staged: la versión "en vuelo" de un documento que
 * espera el swap (C.4). Máximo una por documento (document_id es PK); si llega
 * otro cambio antes del swap, reemplaza a la anterior.
 * Primer tipo nombrado de la tabla — antes solo había selects inline (sync, swap).
 */
export interface DocumentStaged {
  documentId: string;
  orgId: string;
  generation: number;
  fullText: string | null;
  contentHash: string;
  chunkCount: number;
  sizeBytes: number;
  sourceModifiedAt: string | null;
  createdAt: string;
}

/**
 * Lee la fila staged de un documento, aislada por organización.
 * document_staged tiene RLS permisiva (aislamiento por código, C.4a-real), por eso
 * el filtro org_id es obligatorio aquí.
 * Devuelve null si no hay staged pendiente (caso normal) o ante error de lectura
 * (fallback seguro: el llamador sirve la generación activa).
 */
export async function getStagedForDocument(
  supabase: ServiceClient,
  documentId: string,
  orgId: string,
): Promise<DocumentStaged | null> {
  const { data, error } = await supabase
    .from('document_staged')
    .select(
      'document_id, org_id, generation, full_text, content_hash, chunk_count, size_bytes, source_modified_at, created_at',
    )
    .eq('document_id', documentId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) {
    console.error('[document-staged] lectura:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    documentId: data.document_id,
    orgId: data.org_id,
    generation: data.generation,
    fullText: data.full_text,
    contentHash: data.content_hash,
    chunkCount: data.chunk_count,
    sizeBytes: data.size_bytes,
    sourceModifiedAt: data.source_modified_at,
    createdAt: data.created_at,
  };
}
