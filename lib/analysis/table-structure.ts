import type { StoredChunk } from '@/lib/read-chunks';
import { normalize } from './normalize';

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

/**
 * Una tabla completa, agrupada — todas sus filas (chunkType='table_row'),
 * ordenadas por rowIndex, más su orden de columnas real y su recuento total.
 * F-53: el sitio natural para esto es este módulo, no retrieval.ts —
 * `buildUnits` (retrieval.ts) agrupa fragmentos YA PUNTUADOS por Pinecone y
 * produce solo lo RECUPERADO (`recoveredRows`, un subconjunto); esta función
 * es más simple a propósito: sin score, sin distinción recuperado/no, agrupa
 * TODAS las filas que de verdad tiene el documento. Sirve para el lado
 * analizado, que no pasa por Pinecone — se presenta entero, no se recupera.
 */
export interface TableGroup {
  tableId: string;
  sheetName: string | null;
  columns: string[];
  totalRows: number;
  rows: StoredChunk[];
}

export function groupChunksByTable(docChunks: StoredChunk[]): TableGroup[] {
  const byTable = new Map<string, StoredChunk[]>();
  for (const c of docChunks) {
    if (c.chunkType !== 'table_row' || !c.tableId) continue;
    const arr = byTable.get(c.tableId) ?? [];
    arr.push(c);
    byTable.set(c.tableId, arr);
  }

  const groups: TableGroup[] = [];
  for (const [tableId, rows] of byTable) {
    rows.sort((a, b) => (a.rowIndex ?? 0) - (b.rowIndex ?? 0));
    groups.push({
      tableId,
      sheetName: rows[0]?.sheetName ?? null,
      columns: getOrderedColumns(tableId, docChunks),
      totalRows: rows.length,
      rows,
    });
  }
  return groups;
}

/** La cabecera sola — expuesta aparte de renderTableBlock porque F-53 la
 *  necesita también para PRESUPUESTO (retrieval.ts): cuánto cuesta avisar de
 *  la tabla, antes de saber cuántas filas van a caber. */
export function renderTableHeader(
  sheetName: string | null,
  tableId: string,
  documentName: string,
  columns: string[],
  totalRows: number,
): string {
  const label = sheetName ?? tableId;
  return `[TABLA "${label}" — hoja de ${documentName} — ${totalRows} filas. Columnas: ${columns.join(', ')}]`;
}

/** Una fila sola — expuesta aparte por el mismo motivo: retrieval.ts necesita
 *  el coste de UNA fila para decidir cuántas caben, no el bloque entero. */
export function renderTableRow(
  rowIndex: number | null,
  cells: Record<string, string> | null,
  columns: string[],
): string {
  const c = cells ?? {};
  const values = columns.map(col => c[col] ?? '');
  return `[F${rowIndex ?? '?'}] ${values.join(' | ')}`;
}

/**
 * Formato barato de tabla (F-53): cabecera UNA VEZ con el recuento total y
 * las columnas en su orden real (getOrderedColumns), filas debajo con solo
 * sus valores — sin repetir nombre de documento ni lista de columnas en cada
 * una. La fila conserva `[F<rowIndex>]`: es el anclaje que la alineación
 * posicional necesitará en el commit siguiente, no un contador de posición
 * en el bloque (que cambiaría si algún día se omite una fila).
 *
 * `totalRows` es un parámetro, no `rows.length`: el llamador puede pasar
 * MENOS filas que el total real de la tabla (el candidato, si el reparto por
 * presupuesto solo incluyó una parte) — la cabecera debe seguir diciendo la
 * verdad sobre cuántas filas TIENE la tabla, no cuántas se están mostrando
 * aquí. Cada fila renderiza un valor por cada columna de `columns`, en ese
 * orden, aunque esté vacío (`''` entre pipes) — sin eso, la posición N del
 * pipe-list de una fila con celdas en blanco no correspondería de forma
 * fiable a la columna N de la cabecera.
 */
export function renderTableBlock(
  sheetName: string | null,
  tableId: string,
  documentName: string,
  columns: string[],
  totalRows: number,
  rows: Array<{ rowIndex: number | null; cells: Record<string, string> | null }>,
): string {
  const header = renderTableHeader(sheetName, tableId, documentName, columns, totalRows);
  const rowLines = rows
    .slice()
    .sort((a, b) => (a.rowIndex ?? 0) - (b.rowIndex ?? 0))
    .map(r => renderTableRow(r.rowIndex, r.cells, columns));
  return [header, ...rowLines].join('\n');
}

/**
 * F-56: alinea los valores de una cita ya LOCALIZADA (en un chunk concreto)
 * contra sus celdas, por POSICIÓN. Paso único post-localización — no una
 * rama de una vía de `verifyQuote` en particular: recibe `cells` y
 * `columns` ya resueltos, nunca un chunk ni un tableId, así que cualquier
 * vía de localización futura (directa, por segmentos, o una que no exista
 * todavía) llama a esto igual, sin tener que enterarse de cómo se construye.
 *
 * SIN SUELOS DE LONGITUD (F-50): la garantía de que la fila es la correcta
 * ya la dio la localización que llamó a esta función — comparar aquí contra
 * la celda exacta no es buscar en un pajar, es leer un valor conocido. "T" y
 * "MT" verifican igual que "Implantólogo".
 *
 * Prueba TODOS los desplazamientos posibles dentro de `columns` — la cita
 * puede ser un prefijo, un sufijo o un tramo intermedio de la fila, según
 * cuántas columnas decidiera citar el juez — y exige COINCIDENCIA TOTAL en
 * algún desplazamiento, no mayoritaria: es lo que impide que una cita con
 * valores de dos filas distintas (dos de tres correctos) cuele como si
 * fuera literal. Medido en la batería F-55: el control negativo se rechaza
 * por este mecanismo, no por casualidad.
 *
 * Devuelve `null` si la cita no trae ningún valor, si trae más valores que
 * columnas tiene la tabla, o si ningún desplazamiento alinea al 100%.
 */
export function alignQuoteToCells(
  quote: string,
  cells: Record<string, string> | null,
  columns: string[],
): string[] | null {
  const segments = quote.split('|').map(s => s.trim()).filter(Boolean);
  if (segments.length === 0 || segments.length > columns.length) return null;
  const c = cells ?? {};

  let bestOffset = -1;
  let bestMatches = -1;
  for (let offset = 0; offset <= columns.length - segments.length; offset++) {
    let matches = 0;
    for (let i = 0; i < segments.length; i++) {
      if (normalize(segments[i]) === normalize(c[columns[offset + i]] ?? '')) matches++;
    }
    if (matches > bestMatches) {
      bestMatches = matches;
      bestOffset = offset;
    }
  }

  if (bestMatches !== segments.length) return null;
  return columns.slice(bestOffset, bestOffset + segments.length);
}
