import type { SupabaseClient } from '@supabase/supabase-js';
import type { TypedChunk } from './chunking';

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
  column_order: string[] | null;
}

/**
 * Una fila de document_chunks, con los nombres de campo en camelCase.
 *
 * `cells`: el orden de sus claves NO está garantizado (F-51) — es jsonb, y
 * Postgres no preserva el orden de inserción de un objeto jsonb; además,
 * JavaScript reordena por su cuenta las claves que parecen índice numérico
 * ("94"), delante de cualquier clave de texto, sin importar en qué orden se
 * insertaron. Dos garantías rotas, no una. `cells` responde "¿qué vale la
 * columna X?" — para "¿cómo se presenta la tabla?", usar
 * `getOrderedColumns` de lib/analysis/table-structure.ts, el único origen de
 * orden.
 */
export interface StoredChunk {
  chunkIndex: number;
  chunkType: 'text' | 'table_summary' | 'table_row';
  text: string;
  sheetName: string | null;
  tableId: string | null;
  rowIndex: number | null;
  cells: Record<string, string> | null;
  /** F-51: solo presente en chunkType='table_summary' — las columnas de la
   *  tabla en su orden real, escritas en persist-chunks.ts desde el mismo
   *  array que chunkSegments produce, antes de que jsonb o JavaScript puedan
   *  reordenar nada. null en chunks de generaciones anteriores a este commit
   *  (escritos sin esta columna) y en 'text'/'table_row'. */
  columnOrder: string[] | null;
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
    .select('chunk_index, chunk_type, text, sheet_name, table_id, row_index, cells, column_order')
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
    columnOrder: row.column_order,
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

/**
 * Lee los chunks de varios documentos en una sola consulta (verificador de
 * hallazgos, F-27): sustituye a fetchCandidateFullTexts como fuente del
 * haystack contra el que se verifican las citas del juez — los chunks pasan a
 * SER el haystack, en vez de leer full_text aparte.
 *
 * Mismo patrón de lote que loadFragmentContexts (.in('document_id', ...) +
 * .eq('org_id', ...), una sola ida a Supabase), pero con salida distinta
 * (StoredChunk[] por documento, no un mapa de contexto por fragmento) porque
 * son dos consumidores con necesidades distintas: forzarlos a compartir una
 * función los acoplaría sin necesidad.
 *
 * El filtro de generación es POR DOCUMENTO, no uno compartido para todos —
 * mismo cuidado que loadFragmentContexts, necesario porque los candidatos de
 * un mismo análisis pueden estar en generaciones distintas.
 *
 * No lanza: ante error de Supabase, o un documento sin chunks (indexado antes
 * de F-20, o cualquier otro motivo), ese documento simplemente no aparece en
 * el mapa devuelto — quien llama debe caer a su propio fallback (full_text).
 */
export async function getChunksForDocuments(
  supabase: SupabaseClient,
  params: { orgId: string; documents: Array<{ documentId: string; generation: number }> },
): Promise<Map<string, StoredChunk[]>> {
  const { orgId, documents } = params;
  const result = new Map<string, StoredChunk[]>();
  if (documents.length === 0) return result;

  const documentIds = [...new Set(documents.map((d) => d.documentId))];

  const { data, error } = await supabase
    .from('document_chunks')
    .select('document_id, generation, chunk_index, chunk_type, text, sheet_name, table_id, row_index, cells, column_order')
    .eq('org_id', orgId)
    .in('document_id', documentIds)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error(`[read-chunks] getChunksForDocuments falló | docs=${documentIds.length} | ${error.message}`);
    return result;
  }

  const generationByDocument = new Map(documents.map((d) => [d.documentId, d.generation]));
  const rows = (data ?? []) as Array<DocumentChunkRow & { document_id: string; generation: number }>;

  for (const row of rows) {
    if (row.generation !== generationByDocument.get(row.document_id)) continue; // otra generación: no es la activa para este documento
    const list = result.get(row.document_id) ?? [];
    list.push({
      chunkIndex: row.chunk_index,
      chunkType: row.chunk_type,
      text: row.text,
      sheetName: row.sheet_name,
      tableId: row.table_id,
      rowIndex: row.row_index,
      cells: row.cells,
      columnOrder: row.column_order,
    });
    result.set(row.document_id, list);
  }

  return result;
}

/**
 * Convierte TypedChunk[] (la forma en vuelo, en el momento de indexar) a
 * StoredChunk[] (la forma persistida). Es el mismo mapeo campo a campo que
 * lib/persist-chunks.ts ya hace al escribir document_chunks — extraído aquí
 * para que un documento aún no indexado (sin fila en document_chunks todavía)
 * pueda ofrecer al pipeline de análisis la misma forma que un documento ya
 * persistido, sin duplicar la conversión en dos sitios. Misma lección que
 * buildAllVectorIds en B.73: una función común en vez de que cada llamador la
 * reinvente.
 */
export function toStoredChunks(chunks: TypedChunk[]): StoredChunk[] {
  return chunks.map((c) => ({
    chunkIndex: c.metadata.chunkIndex,
    chunkType: c.chunkType,
    text: c.text,
    sheetName: c.sheetName ?? null,
    tableId: c.tableId ?? null,
    rowIndex: c.rowIndex ?? null,
    cells: c.cells ?? null,
    columnOrder: c.columnOrder ?? null,
  }));
}
