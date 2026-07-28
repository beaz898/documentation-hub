import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteVectorsByFilter, deleteVectorsByIds } from '@/lib/pinecone/vectors';

/**
 * Motivo del borrado. Decide si se escribe lápida:
 * - 'user_excluded': el usuario excluyó el documento (quitar del corpus / limpiar
 *   duplicado). Si es sincronizado, se escribe lápida para que el sync no lo
 *   reimporte.
 * - 'remote_deleted': el sync detectó que el archivo desapareció del proveedor.
 *   NO se escribe lápida: ya no hay nada que reimportar, y una lápida impediría
 *   restaurarlo si el usuario lo recupera en su Drive.
 */
export type DeleteReason = 'user_excluded' | 'remote_deleted';

export interface DeleteDocumentParams {
  orgId: string;
  documentId: string;
  reason: DeleteReason;
  /** user_id de quien excluye; solo se usa para lápidas ('user_excluded'). */
  excludedBy?: string | null;
}

export interface DeleteDocumentResult {
  ok: boolean;
  tombstoned: boolean;
  vectorsDeleted: boolean;
  rowDeleted: boolean;
  error?: string;
}

interface DocumentRow {
  id: string;
  source: string;
  provider_file_id: string | null;
  name: string;
  chunk_count: number | null;
}

/**
 * Función de borrado compartida (C.2, paso 3). Único camino para borrar un
 * documento del corpus: la usan el sync (borrado remoto) y DELETE /api/documents
 * (exclusión voluntaria). Nace con el patrón de C.1c: comprueba .error en cada
 * escritura y NUNCA reporta éxito parcial como éxito.
 *
 * NO borra analysis_results en ningún caso — decisión de Fable, ver
 * Decisiones_Fase_C.txt. Son memoria de la organización; C.7 se apoya en ellos,
 * y un análisis que menciona un documento ya borrado sigue siendo un hecho
 * histórico verdadero.
 *
 * Borrar = (lápida si procede) -> vectores (capa B.0) -> fila de documents.
 * El caller crea el SupabaseClient con service role y resuelve el orgId.
 */
export async function deleteDocument(
  supabase: SupabaseClient,
  params: DeleteDocumentParams,
): Promise<DeleteDocumentResult> {
  const { orgId, documentId, reason, excludedBy = null } = params;

  const result: DeleteDocumentResult = {
    ok: false,
    tombstoned: false,
    vectorsDeleted: false,
    rowDeleted: false,
  };

  // 1. Leer el documento (identidad de origen + chunk_count).
  const { data: doc, error: readError } = await supabase
    .from('documents')
    .select('id, source, provider_file_id, name, chunk_count')
    .eq('id', documentId)
    .eq('org_id', orgId)
    .single<DocumentRow>();

  if (readError || !doc) {
    result.error = `No se pudo leer el documento ${documentId}: ${readError?.message ?? 'no encontrado'}`;
    return result;
  }

  const isSynced = doc.provider_file_id != null;

  // 2. Lápida PRIMERO (remache 3a): solo en exclusión voluntaria de un documento
  //    sincronizado. Si la lápida falla, abortamos ANTES de borrar nada — el
  //    medio-fallo cae del lado inofensivo (documento vivo, sin lápida, se
  //    reintenta), nunca del lado de la resurrección.
  if (reason === 'user_excluded' && isSynced) {
    const { error: tombstoneError } = await supabase
      .from('document_tombstones')
      .upsert(
        {
          org_id: orgId,
          source: doc.source,
          provider_file_id: doc.provider_file_id,
          original_name: doc.name,
          excluded_by: excludedBy,
          excluded_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,source,provider_file_id' },
      );

    if (tombstoneError) {
      result.error = `No se pudo escribir la lápida: ${tombstoneError.message}. No se borró nada.`;
      return result;
    }
    result.tombstoned = true;
  }

  // 3. Borrar vectores por la capa B.0, estrategia robusta (filtro + IDs).
  //    A diferencia del código de hoy (que se traga los errores), aquí solo es
  //    fallo si AMBAS estrategias fallan.
  let filterOk = false;
  let idsOk = false;

  try {
    await deleteVectorsByFilter(orgId, { documentId: { $eq: documentId } });
    filterOk = true;
  } catch (err) {
    console.warn(`[deleteDocument] fallo borrado por filtro | doc=${documentId} |`, err);
  }

  const chunkCount = doc.chunk_count ?? 0;
  if (chunkCount > 0) {
    const ids = Array.from({ length: chunkCount }, (_, i) => `${documentId}-${i}`);
    try {
      await deleteVectorsByIds(orgId, ids);
      idsOk = true;
    } catch (err) {
      console.warn(`[deleteDocument] fallo borrado por IDs | doc=${documentId} |`, err);
    }
  }

  result.vectorsDeleted = filterOk || idsOk;

  // 4. Borrar la fila de documents (verificando .error, patrón C.1c).
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('org_id', orgId);

  if (deleteError) {
    result.error = `No se pudo borrar la fila del documento: ${deleteError.message}`;
    return result;
  }
  result.rowDeleted = true;

  // 5. NO se tocan analysis_results — decisión de Fable (ver cabecera).

  // Éxito solo si TODO lo que debía pasar pasó. Éxito parcial no es éxito.
  result.ok = result.vectorsDeleted && result.rowDeleted;
  if (!result.ok && !result.error) {
    result.error = 'No se pudieron borrar los vectores del documento (ambas estrategias fallaron).';
  }

  return result;
}

/**
 * Clave de identidad de una lápida, en el formato `source::provider_file_id`.
 * Se usa para comprobar en memoria si un archivo del proveedor está excluido,
 * sin una consulta por archivo.
 */
export function tombstoneKey(source: string, providerFileId: string): string {
  return `${source}::${providerFileId}`;
}

/**
 * Lee todas las lápidas de una organización y devuelve un Set con sus claves de
 * identidad (source::provider_file_id). El sync lo consulta ANTES de importar
 * cada archivo: si la clave está en el Set, el archivo fue excluido a propósito
 * y no debe reimportarse (C.2, paso 4).
 *
 * Una sola consulta por sync (no una por archivo). Si la consulta falla, se
 * devuelve un Set vacío y se registra el error: en el peor caso el sync no
 * salta exclusiones (comportamiento pre-lápida), nunca bloquea el sync entero.
 */
export async function getTombstonedIdentities(
  supabase: SupabaseClient,
  orgId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('document_tombstones')
    .select('source, provider_file_id')
    .eq('org_id', orgId);

  if (error) {
    console.error(`[getTombstonedIdentities] fallo al leer lápidas | org=${orgId} | ${error.message}`);
    return new Set();
  }

  const keys = (data ?? []).map((row) => tombstoneKey(row.source, row.provider_file_id));
  return new Set(keys);
}
