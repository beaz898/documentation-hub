/**
 * F-61: extraída de judge.ts a su propio fichero — sin cambiar una línea de
 * su cuerpo ni de su doctrina — porque table-structure.ts pasa a necesitarla
 * (para `alignQuoteToCells`) y judge.ts ya importa de table-structure.ts
 * (`getOrderedColumns`, `groupChunksByTable`, `renderTableBlock`): que
 * table-structure.ts importara `normalize` desde judge.ts habría cerrado un
 * ciclo (judge -> table-structure -> judge). judge.ts sigue exportando
 * `normalize` desde el mismo sitio de siempre (`export { normalize }`), así
 * que ningún import existente (`from './judge'`, en retrieval.ts y
 * finding-rules.ts) cambia.
 */

/**
 * Normaliza para comparación fuzzy. La clase de caracteres ignorados incluye
 * el marcado Markdown (* _ # ` ~) junto a la puntuación: el LLM cita el
 * texto VISIBLE del documento ("24 HORAS"), no el marcado que lo envuelve
 * en la fuente ("**24 HORAS**"), así que ambos deben normalizar igual para
 * que la comparación coincida.
 *
 * F-46: el colapso de filas idénticas (retrieval.ts, F-44) y el solapamiento
 * estructural que construye sobre él (F-45) descansan enteros en esta
 * función — "idéntica" significa "igual tras normalize()", nada más. Hoy NO
 * toca tildes (deliberado, "fallo del lado seguro": un acento distinto
 * rompe el match exacto). Cualquier ampliación de esta función — tildes,
 * sinónimos, distancia de edición — es una ampliación de lo que ese colapso
 * considera "la misma fila", y debe pasar por su batería de medición antes
 * de tocarse: ensancharla sin medir podría hacer que una discrepancia real
 * (la propia contradicción que el sistema busca) se trague como idéntica.
 *
 * F-61: es también lo que decide, dentro de una fila ya localizada, si un
 * valor citado coincide con el de una celda (`alignQuoteToCells`,
 * table-structure.ts) — la misma cautela con tildes aplica ahí: "Auxiliar
 * clinica" (sin tilde) y "Auxiliar clínica" (real) normalizan distinto y NO
 * verifican, a propósito.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?"""''«»()[\]{}\-—–…*_#`~]/g, '')
    .trim();
}
