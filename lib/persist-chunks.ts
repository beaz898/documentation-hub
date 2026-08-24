import type { SupabaseClient } from '@supabase/supabase-js';
import type { TypedChunk } from './chunking';

/**
 * Persiste los chunks tipados de una generación de un documento.
 * F-20 Paso 2: nadie lee document_chunks todavía, así que un fallo aquí
 * NUNCA debe tumbar la petición que ya indexó con éxito en Pinecone y en
 * `documents` — se registra y se sigue, mismo patrón que saveStyleResult en
 * lib/persist-analysis.ts. Llamar siempre DESPUÉS de que la fila de
 * `documents` exista: la FK document_chunks.document_id lo exige.
 */
export async function saveDocumentChunks(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    documentId: string;
    generation: number;
    chunks: TypedChunk[];
  },
): Promise<void> {
  const { orgId, documentId, generation, chunks } = params;
  if (chunks.length === 0) return;

  const rows = chunks.map(c => ({
    document_id: documentId,
    org_id: orgId,
    generation,
    chunk_index: c.metadata.chunkIndex,
    chunk_type: c.chunkType,
    text: c.text,
    sheet_name: c.sheetName ?? null,
    table_id: c.tableId ?? null,
    row_index: c.rowIndex ?? null,
    cells: c.cells ?? null,
    // F-51: solo TypedChunk de chunkType='table_summary' trae columnOrder
    // (chunking.ts) — para 'text'/'table_row' es undefined, y aquí se
    // persiste como null, igual que el resto de campos de tabla ausentes.
    column_order: c.columnOrder ?? null,
  }));

  const { error } = await supabase.from('document_chunks').insert(rows);
  if (error) {
    console.error(`[persist-chunks] saveDocumentChunks falló | doc=${documentId} | gen=${generation} | ${error.message}`);
  }
}

/**
 * Borra los chunks de UNA generación concreta de un documento, antes de
 * volver a insertarlos. Necesario en drive/sync: las ramas de sobrescribir y
 * de re-stage antes del swap reutilizan el mismo (document_id, generation)
 * entre sincronizaciones, y el número de chunks puede cambiar — sin este
 * borrado quedarían chunks "zombis" con chunk_index que ya no corresponde a
 * nada, el mismo problema que ya se resuelve para los vectores de Pinecone.
 * No lanza: mismo patrón fire-and-forget-con-log que saveDocumentChunks.
 */
export async function deleteDocumentChunksForGeneration(
  supabase: SupabaseClient,
  params: { orgId: string; documentId: string; generation: number },
): Promise<void> {
  const { orgId, documentId, generation } = params;
  const { error } = await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId)
    .eq('org_id', orgId)
    .eq('generation', generation);
  if (error) {
    console.error(`[persist-chunks] deleteDocumentChunksForGeneration falló | doc=${documentId} | gen=${generation} | ${error.message}`);
  }
}

/**
 * Borra los chunks de TODAS las generaciones por debajo de una dada. Lo usa
 * el swap de generaciones (lib/document-swap.ts, P3) para limpiar las
 * generaciones que dejan de servirse — la fila de `documents` no se borra ahí
 * (solo se actualiza), así que la cascada de la FK no cubre este caso: es el
 * único de los seis caminos de borrado que necesita código explícito.
 * No lanza: ver saveDocumentChunks.
 */
export async function deleteDocumentChunksBelowGeneration(
  supabase: SupabaseClient,
  params: { orgId: string; documentId: string; belowGeneration: number },
): Promise<void> {
  const { orgId, documentId, belowGeneration } = params;
  const { error } = await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId)
    .eq('org_id', orgId)
    .lt('generation', belowGeneration);
  if (error) {
    console.error(`[persist-chunks] deleteDocumentChunksBelowGeneration falló | doc=${documentId} | belowGen=${belowGeneration} | ${error.message}`);
  }
}
