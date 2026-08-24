import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Contexto adicional de un fragmento recuperado, leído de document_chunks en
 * tiempo de análisis — nunca de la metadata de Pinecone.
 *
 * Se lee de document_chunks a propósito, en vez de escribir estos campos en
 * la metadata al indexar: escribirlos en Pinecone solo los pondría a
 * disposición de los vectores que se resubieran a partir de ahora, dejando el
 * corpus ya indexado sin ellos hasta otro ciclo de resubida — y F-21 fijó que
 * ese ciclo fuera único. Además duplicaría el dato entre document_chunks
 * (fuente) y Pinecone (copia), con riesgo de que diverjan si uno se actualiza
 * sin el otro. document_chunks ya tiene todo lo necesario desde el paso 2 de
 * F-20; aquí solo se lee.
 */

interface DocumentChunkContextRow {
  document_id: string;
  generation: number;
  chunk_index: number;
  chunk_type: 'text' | 'table_summary' | 'table_row';
  text: string;
  sheet_name: string | null;
  table_id: string | null;
  row_index: number | null;
  cells: Record<string, string> | null;
}

/** Referencia a un fragmento concreto: qué documento, qué generación, qué posición. */
export interface FragmentRef {
  documentId: string;
  generation: number;
  chunkIndex: number;
}

/**
 * Contexto de un fragmento: su tipo y localizadores de tabla, más el texto
 * del chunk inmediatamente anterior y posterior en el mismo documento y
 * generación. previousText/nextText existen para el verificador de hallazgos
 * (F-22): es lo que permite distinguir "activar la alarma" en un procedimiento
 * de incendios de "desactivar la alarma" en la apertura matinal. Se calculan
 * aquí porque ya se está consultando la tabla; no se persisten.
 */
export interface FragmentContext {
  chunkType: 'text' | 'table_summary' | 'table_row';
  sheetName: string | null;
  tableId: string | null;
  rowIndex: number | null;
  /** F-51: el orden de sus claves NO está garantizado — jsonb no preserva
   *  orden de inserción, y JavaScript reordena por su cuenta las claves que
   *  parecen índice numérico. Para orden de presentación, usar
   *  getOrderedColumns de lib/analysis/table-structure.ts con `tableId`. */
  cells: Record<string, string> | null;
  previousText: string | null;
  nextText: string | null;
}

/**
 * Clave estable para el mapa que devuelve loadFragmentContexts. Exportada
 * para que quien la llame no reconstruya el formato a mano — el mismo error
 * que B.73 acaba de corregir para los IDs de vector.
 */
export function fragmentContextKey(documentId: string, generation: number, chunkIndex: number): string {
  return `${documentId}|${generation}|${chunkIndex}`;
}

/**
 * Enriquece una lista de referencias a fragmentos con su contexto de
 * document_chunks. Una sola consulta (.in('document_id', ...) + .eq('org_id',
 * ...)), igual que fetchCandidateFullTexts en pipeline.ts; el filtrado por
 * generación y por posición se hace en memoria, no en la consulta.
 *
 * No lanza: ante error de Supabase, o ante una ref sin fila correspondiente
 * (documento indexado antes de F-20, o índice inexistente), esa entrada
 * simplemente no aparece en el mapa devuelto. Quien llama debe poder seguir
 * sin contexto.
 */
export async function loadFragmentContexts(
  supabase: SupabaseClient,
  params: { orgId: string; refs: FragmentRef[] },
): Promise<Map<string, FragmentContext>> {
  const { orgId, refs } = params;
  const result = new Map<string, FragmentContext>();
  if (refs.length === 0) return result;

  const documentIds = [...new Set(refs.map(r => r.documentId))];

  const { data, error } = await supabase
    .from('document_chunks')
    .select('document_id, generation, chunk_index, chunk_type, text, sheet_name, table_id, row_index, cells')
    .eq('org_id', orgId)
    .in('document_id', documentIds)
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error(`[fragment-context] loadFragmentContexts falló | docs=${documentIds.length} | ${error.message}`);
    return result;
  }

  const rows = (data ?? []) as DocumentChunkContextRow[];

  // Índice por (document_id, generation) -> chunk_index -> fila, para localizar
  // el chunk de cada ref y sus vecinos sin recorrer todas las filas por ref.
  const byDocGen = new Map<string, Map<number, DocumentChunkContextRow>>();
  for (const row of rows) {
    const key = `${row.document_id}|${row.generation}`;
    const byIndex = byDocGen.get(key) ?? new Map<number, DocumentChunkContextRow>();
    byIndex.set(row.chunk_index, row);
    byDocGen.set(key, byIndex);
  }

  for (const ref of refs) {
    const byIndex = byDocGen.get(`${ref.documentId}|${ref.generation}`);
    const row = byIndex?.get(ref.chunkIndex);
    if (!row) continue; // Sin fila correspondiente: caso normal, no error.

    const previousRow = byIndex?.get(ref.chunkIndex - 1);
    const nextRow = byIndex?.get(ref.chunkIndex + 1);

    result.set(fragmentContextKey(ref.documentId, ref.generation, ref.chunkIndex), {
      chunkType: row.chunk_type,
      sheetName: row.sheet_name,
      tableId: row.table_id,
      rowIndex: row.row_index,
      cells: row.cells,
      previousText: previousRow?.text ?? null,
      nextText: nextRow?.text ?? null,
    });
  }

  return result;
}
