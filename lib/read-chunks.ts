import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Lectura de los chunks tipados de un documento (F-20 Paso 4).
 *
 * Los vectores y los chunks de generaciones viejas de un documento CONVIVEN en
 * la base hasta que el swap las borra (lib/document-swap.ts, P3): un documento
 * puede tener filas de document_chunks de la generación activa Y de
 * generaciones anteriores al mismo tiempo. Leer sin filtrar por `generation`
 * mezclaría el contenido de dos versiones distintas del mismo documento en un
 * mismo análisis. Por eso getDocumentChunks exige `generation` siempre, igual
 * que exige `orgId` para el aislamiento por organización.
 *
 * Ninguna función de este fichero lanza: son de lectura auxiliar, y quien las
 * llama debe poder caer a su método antiguo (chunkText sobre full_text) si un
 * documento aún no tiene chunks o si la lectura falla.
 */

interface DocumentChunkRow {
  chunk_index: number;
  chunk_type: 'text' | 'table_summary' | 'table_row';
  text: string;
  sheet_name: string | null;
  table_id: string | null;
  row_index: number | null;
  cells: Record<string, string> | null;
}

/** Una fila de document_chunks, con los nombres de campo en camelCase. */
export interface StoredChunk {
  chunkIndex: number;
  chunkType: 'text' | 'table_summary' | 'table_row';
  text: string;
  sheetName: string | null;
  tableId: string | null;
  rowIndex: number | null;
  cells: Record<string, string> | null;
}

/**
 * Lee los chunks de UNA generación de un documento, ordenados por posición.
 * Devuelve array vacío si no hay filas (caso normal: documentos antiguos sin
 * chunks) o si la consulta falla (se registra el error, no se lanza).
 */
export async function getDocumentChunks(
  supabase: SupabaseClient,
  params: { orgId: string; documentId: string; generation: number },
): Promise<StoredChunk[]> {
  const { orgId, documentId, generation } = params;

  const { data, error } = await supabase
    .from('document_chunks')
    .select('chunk_index, chunk_type, text, sheet_name, table_id, row_index, cells')
    .eq('document_id', documentId)
    .eq('org_id', orgId)
    .eq('generation', generation)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error(`[read-chunks] getDocumentChunks falló | doc=${documentId} | gen=${generation} | ${error.message}`);
    return [];
  }

  const rows = (data ?? []) as DocumentChunkRow[];
  return rows.map((row) => ({
    chunkIndex: row.chunk_index,
    chunkType: row.chunk_type,
    text: row.text,
    sheetName: row.sheet_name,
    tableId: row.table_id,
    rowIndex: row.row_index,
    cells: row.cells,
  }));
}

/**
 * Generación activa de un documento (documents.active_generation). Mismo
 * patrón que ya usan app/api/documents/[id]/mark-analyzed/route.ts y
 * app/api/documents/[id]/text/route.ts: `?? 1` para columna nula, 1 también
 * si hay error o el documento no existe — es la generación implícita de todo
 * el corpus histórico, así que es el valor seguro por defecto.
 */
export async function getActiveGeneration(
  supabase: SupabaseClient,
  params: { orgId: string; documentId: string },
): Promise<number> {
  const { orgId, documentId } = params;

  const { data, error } = await supabase
    .from('documents')
    .select('active_generation')
    .eq('id', documentId)
    .eq('org_id', orgId)
    .single();

  if (error || !data) {
    console.error(`[read-chunks] getActiveGeneration falló | doc=${documentId} | ${error?.message ?? 'documento no encontrado'}`);
    return 1;
  }

  return (data.active_generation as number | null) ?? 1;
}
