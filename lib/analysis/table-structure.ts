import type { StoredChunk } from '@/lib/read-chunks';

/**
 * Origen ÚNICO del orden de columnas de una tabla (F-51).
 *
 * Doctrina: `cells` responde "¿qué vale la columna X?"; el orden responde
 * "¿cómo se presenta la tabla?". Ningún código pregunta lo segundo al
 * primero — ni `Object.keys(cells)` ni `Object.entries(cells)` son una fuente
 * de orden válida en ningún punto del pipeline: `cells` es jsonb, y Postgres
 * no preserva el orden de inserción de un objeto jsonb; además, JavaScript
 * reordena por su cuenta las claves que parecen índice numérico ("94"),
 * delante de cualquier clave de texto, sin importar el orden de inserción.
 * Dos garantías rotas, no una — medido en producción (OPE-02: la hoja dice
 * "Empleado, Puesto, Box asignado, Lunes..." y `cells` devolvía "Lunes,
 * Jueves, Martes, Puesto, Sábado...") y en el corpus de muestra (la mini-tabla
 * "Resumen" de OPE-06, donde una columna se llama literalmente "94").
 *
 * `getOrderedColumns` es la única función que cualquier código debe llamar
 * para saber en qué orden presentar las columnas de una tabla. Nunca se
 * inventa el orden ni se adivina por parecido: cuando no puede determinarse
 * con certeza, se declara en el log y se degrada a orden alfabético — nunca
 * en silencio.
 */

/**
 * Extrae la lista de columnas de la línea "Columnas: A, B, C." de un
 * table_summary. Quita exactamente el ÚLTIMO carácter (el punto final que
 * añade la plantilla de chunking.ts), no "el último punto" por regex — un
 * nombre de columna que termine en algo como "Total (aprox.)" tiene su propio
 * punto interno, que no debe tocarse.
 */
function parseColumnsLine(summaryText: string): string[] | null {
  const marker = 'Columnas: ';
  const idx = summaryText.indexOf(marker);
  if (idx === -1) return null;
  let listPart = summaryText.slice(idx + marker.length);
  if (listPart.endsWith('.')) listPart = listPart.slice(0, -1);
  const candidates = listPart.split(', ').map(s => s.trim()).filter(Boolean);
  return candidates.length > 0 ? candidates : null;
}

/**
 * Columnas reales de una tabla — la UNIÓN de las claves de `cells` de TODAS
 * sus filas, no de una sola fila: chunking.ts omite una celda vacía de
 * `cells` (`if (value === '') return;`), así que una fila con blancos tiene
 * menos claves que la tabla completa. Usar una sola fila como referencia
 * rechazaría nombres de columna reales que esa fila concreta no tenía
 * rellenos, y los declararía `orden_no_parseable` por error.
 */
function realColumnKeys(tableId: string, docChunks: StoredChunk[]): Set<string> {
  const keys = new Set<string>();
  for (const c of docChunks) {
    if (c.tableId !== tableId || c.chunkType !== 'table_row' || !c.cells) continue;
    for (const k of Object.keys(c.cells)) keys.add(k);
  }
  return keys;
}

/**
 * El orden de columnas de una tabla, en su forma real (la de la hoja).
 * Nunca lanza, nunca devuelve un orden inventado sin decirlo.
 *
 * Prioridad:
 *   1. `column_order` persistido en el chunk table_summary (F-51) — el
 *      array que chunkSegments capturó antes de que jsonb o JavaScript
 *      pudieran reordenar nada. Fuente exacta.
 *   2. Respaldo — parsear la línea "Columnas: ..." del texto del summary,
 *      validando cada nombre contra las claves reales de `cells` (mismo
 *      conjunto, ni de más ni de menos). Solo se intenta si hay EXACTAMENTE
 *      un chunk table_summary para esta tabla: si hay más de uno (un
 *      table_summary escrito antes de F-51, partido por MAX_CHUNK_SIZE), la
 *      concatenación llevaría solape duplicado (CHUNK_OVERLAP=200) y sería
 *      incorregible sin adivinar — se declara no parseable directamente, sin
 *      intentar reconstruirlo.
 *   3. Alfabético, declarado en el log — nunca en silencio.
 */
export function getOrderedColumns(tableId: string | null, docChunks: StoredChunk[]): string[] {
  if (!tableId) return [];

  const summaryChunks = docChunks.filter(c => c.tableId === tableId && c.chunkType === 'table_summary');
  const realKeys = realColumnKeys(tableId, docChunks);

  const withColumnOrder = summaryChunks.find(c => c.columnOrder && c.columnOrder.length > 0);
  if (withColumnOrder?.columnOrder) return withColumnOrder.columnOrder;

  if (summaryChunks.length === 1) {
    const parsed = parseColumnsLine(summaryChunks[0].text);
    if (
      parsed &&
      parsed.length === realKeys.size &&
      parsed.every(name => realKeys.has(name))
    ) {
      return parsed;
    }
  }

  if (realKeys.size > 0) {
    console.warn(
      `[table-structure] orden_no_parseable para tabla "${tableId}" ` +
      `(${summaryChunks.length} chunk(s) de resumen) — cae a orden alfabético`
    );
  }
  return [...realKeys].sort();
}
