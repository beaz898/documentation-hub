import type { StoredChunk } from '@/lib/read-chunks';
import type { ParDeTablas } from './table-pairing';

/**
 * ¿EL JUEZ EMPAREJÓ BIEN ESTAS DOS FILAS? (F-89 P2, frente 1)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EL FALLO QUE VIENE A CERRAR (B.124). La definición de R2 desde F-22 tiene
 * TRES condiciones: misma columna, valores distintos, MISMA ENTIDAD
 * EMPAREJADA. Las dos primeras se comprobaban; la tercera se presumía —
 * confiada al juez. El sello «confirmado por estructura» certificaba tres
 * cosas habiendo verificado dos, y eso no es una confirmación estructural: es
 * un modelo con sello prestado.
 *
 * Medido en producción el 30/08: el juez enfrentó la fila EST-02 contra la
 * EST-03 —dos tratamientos distintos— y la cascada lo selló con las ocho
 * columnas. EST-02 es idéntica en los dos documentos; EST-03 difiere en una.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * NO SE COMPARA LA CLAVE: SE LE PREGUNTA AL EMPAREJAMIENTO. F-89 P2 lo enuncia
 * como «si los valores de clave de las dos filas difieren, no son la misma
 * fila», y sería correcto — pero reimplementarlo aquí crearía una SEGUNDA
 * implementación del criterio de emparejamiento, con sus propias reglas, al
 * lado de la que ya decidió. Dos implementaciones del mismo criterio es cómo
 * empiezan las que divergen (la misma razón por la que el groupId es opaco,
 * F-88 P3). La fase 1 ya dijo qué fila va con cuál; esa lista es la autoridad.
 *
 * Y CUBRE GRATIS UN CASO que comparando claves habría que recordar aparte: una
 * fila que NO TIENE PAREJA NINGUNA (está en soloEnNuevo o soloEnOtro).
 * Emparejarla con lo que sea es inválido, y aquí sale solo.
 */

/**
 * TRES ESTADOS, NO DOS, y confundirlos sería el fallo:
 *
 *   'sin_cobertura' — ningún par EMITIDO cubre esas dos tablas. El diff no
 *                     comparó nada ahí, así que no tiene autoridad para
 *                     desmentir a nadie: R2 sigue como siempre. Es el caso de
 *                     las tablas sin clave y de todo lo que no es tabla.
 *   'pareja'        — el diff coincide con el juez.
 *   'no_pareja'     — el diff cubrió esas tablas y dice que esas dos filas NO
 *                     van juntas. El emparejamiento del juez es inválido.
 */
export type VeredictoDeEmparejamiento = 'sin_cobertura' | 'pareja' | 'no_pareja';

/**
 * Las filas se comparan por `chunkIndex`, NO por identidad de objeto.
 *
 * No es prudencia genérica: los chunks que llegan en la evidencia del juez y
 * los que están dentro de los `TableGroup` recorren caminos distintos desde
 * `document_chunks`, y depender de que sean el MISMO objeto sería depender de
 * un detalle que nadie ha prometido. `chunkIndex` es único dentro de un
 * documento y es lo que el resto del pipeline ya usa como identidad de fila
 * (fragment-context, verifyQuote, buildNeighbours).
 */
function mismaFila(a: StoredChunk, b: StoredChunk): boolean {
  return a.chunkIndex === b.chunkIndex;
}

export function veredictoDeEmparejamiento(
  pares: ParDeTablas[],
  filaNueva: StoredChunk | null,
  filaExistente: StoredChunk | null,
): VeredictoDeEmparejamiento {
  if (!filaNueva || !filaExistente) return 'sin_cobertura';

  // NO se comprueba aquí que las filas tengan `tableId`, y la ausencia es
  // deliberada: sin él, el `find` de abajo no encuentra ningún par —los
  // TableGroup siempre tienen tableId— y el resultado es 'sin_cobertura'
  // igual. Una guarda repetida sobrevivía a la mutación porque no decidía
  // nada. Misma lección que la retirada en F-86 paso 3.
  const par = pares.find(
    p => p.nueva.tableId === filaNueva.tableId && p.existente.tableId === filaExistente.tableId,
  );
  if (!par) return 'sin_cobertura';

  const emparejadas = par.clave.pairs.some(
    p => mismaFila(p.nueva, filaNueva) && mismaFila(p.existente, filaExistente),
  );

  return emparejadas ? 'pareja' : 'no_pareja';
}
