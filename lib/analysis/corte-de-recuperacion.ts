/**
 * EL CORTE DE LA RECUPERACIÓN — B.248, y lo que queda de él tras la retirada del
 * umbral (23/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ ESTE FICHERO SE LLAMABA `umbral-de-recuperacion.ts` Y TENÍA TRES FUNCIONES.
 * Dos se fueron con las constantes del umbral en la fase 2 de F-113/F-114:
 *
 *   · `pasaElUmbral(score, umbral)` — la única comparación del corte, y el sitio
 *     donde vivía su caso decisivo (0,49 fuera / 0,51 dentro). Se retira porque
 *     el suelo medido del corpus entero es **0,696141422** (n=424.040,
 *     23/09/2026) con **cero** fragmentos por debajo de 0,50 y de 0,45: la
 *     comparación no podía separar nada.
 *   · `candidatosPerdidosPorUmbral(...)` — contaba los DOCUMENTOS que se perdían
 *     sólo por el umbral. Sin umbral sólo podía dar cero, y un contador que no
 *     puede moverse no vigila: se retira con su clave del catálogo.
 *
 * El fichero se renombra en vez de quedarse con un nombre que ya no describe su
 * contenido. Un fichero cuyo nombre miente es una pista falsa para el `grep` del
 * que venga dentro de seis meses, y esta casa lleva semanas pagando eso.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LO QUE QUEDA ES OTRO CORTE, Y NO SE TOCA: el de los más afines, que decide
 * cuántos candidatos pasan de la recuperación al rerank. No tiene nada que ver
 * con el umbral —es RELATIVO, se queda con los N mejores en vez de comparar
 * contra un número absoluto— y su contador
 * (`seleccion.candidatos_cortados_por_tope_de_recuperacion`) sigue vivo.
 *
 * ⚠️ Y ES PRECISAMENTE LA FORMA QUE F-113 AUTORIZA PARA UN CORTE FUTURO: «si algún
 * día se reinstaura un corte, los autores del modelo respaldan que sea RELATIVO
 * (orden o hueco) y no absoluto». El que queda ya lo es.
 */

/**
 * El corte previo al rerank: los `tope` más afines, y cuántos se quedaron fuera.
 * Hasta el 17/09/2026 era un `.slice(0, 25)` literal y mudo.
 */
export function cortarALosMasAfines<T extends { maxScore: number }>(
  candidatos: T[],
  tope: number,
): { candidatos: T[]; cortados: number } {
  const ordenados = [...candidatos].sort((a, b) => b.maxScore - a.maxScore);
  return {
    candidatos: ordenados.slice(0, tope),
    cortados: Math.max(0, ordenados.length - tope),
  };
}
