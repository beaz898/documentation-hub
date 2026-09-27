/**
 * EL COMPARADOR TABULAR DEL EXAMEN (27/09/2026).
 *
 * Una expectativa tabular se cumple por COLUMNA Y VALORES, no por cita: es lo
 * que emite el diff en `comparedValues`. N1-PUESTO no lleva discriminantes a
 * propósito —«Implantólogo» está dentro de «Implantólogo / Cirujano oral» y no
 * aísla—, y forzarle uno sería inventar un discriminante para que el
 * instrumento quepa.
 *
 * ⚠️ LOS LADOS NO SE INTERCAMBIAN, al revés que en prosa: en prosa el juez
 * elige en qué campo pone cada cita; aquí la dirección la fija el diff, y un
 * valor del analizado en el campo del corpus es la confusión de lados, que
 * tiene que salir como fallo.
 *
 * ⚠️ LOS VALORES SE COMPARAN LITERALES (sólo se colapsan espacios), no con
 * `normalize`: ésa es la de BUSCAR y quita puntos y guiones —«2.5» y «25»
 * saldrían iguales—. `normalize-core.mjs:79-96` lo avisa.
 *
 * Sólo el diff produce `comparedValues` (`diff-emision.ts`), así que la
 * expectativa tiene que declarar `confirmadoPorEsperado: 'estructura'`: una
 * tabular que esperase al juez no encajaría nunca.
 */

/** ¿Está la expectativa completa para este comparador? */
export function esTabular(e) {
  return Boolean(e.columnaEnOposicion && e.enElAnalizado !== undefined && e.enElCorpus !== undefined &&
    e.confirmadoPorEsperado === 'estructura');
}

const literal = s => String(s ?? '').trim().replace(/\s+/g, ' ');

/** Las celdas de una fila tal como la escribe el diff: «[F3] a | b | c». */
export function celdasDeFila(fila) {
  return (fila ?? '').replace(/^\s*\[F\d+\]\s*/, '').split('|').map(literal);
}

/** La clave de fila (`persona` en N1) tiene que ser una CELDA de las dos filas. */
function filaContiene(h, clave) {
  const k = literal(clave);
  const nueva = celdasDeFila(h.newDocRow ?? h.newDocSays);
  const vieja = celdasDeFila(h.existingDocRow ?? h.existingDocSays);
  return nueva.includes(k) && vieja.includes(k);
}

/**
 * LA MISMA FILA, JUZGADA POR EL JUEZ (P4, 27/09/2026). Cuando no hay clave, la
 * fila no la compara el diff: la compara el juez, que no rellena
 * `comparedValues` ni nombra columnas. Se exige la persona y los dos valores
 * como CELDAS de las dos filas que cita. Los lados SÍ se pueden intercambiar,
 * como en prosa: el juez decide en qué campo pone cada fila.
 * ⚠️ No comprueba la COLUMNA: el juez no la escribe. Una columna declarada
 * queda sin leer, y el validador lo dice.
 */
export function esFilaPorJuicio(e) {
  return Boolean(e.persona && e.enElAnalizado !== undefined && e.enElCorpus !== undefined &&
    e.confirmadoPorEsperado === 'juicio');
}

export function encajaFilaPorJuicio(h, e) {
  if (!esFilaPorJuicio(e) || h.confirmedBy !== 'juicio') return false;
  const nueva = celdasDeFila(h.newDocSays);
  const vieja = celdasDeFila(h.existingDocSays);
  const [p, a, b] = [e.persona, e.enElAnalizado, e.enElCorpus].map(literal);
  const lado = (x, y) => x.includes(p) && x.includes(a) && y.includes(p) && y.includes(b);
  return lado(nueva, vieja) || lado(vieja, nueva);
}

export function encajaTabular(hallazgo, e, claveDeFila = e.persona) {
  if (!esTabular(e)) return false;
  if (hallazgo.confirmedBy !== e.confirmadoPorEsperado) return false;
  if (claveDeFila && !filaContiene(hallazgo, claveDeFila)) return false;
  const col = literal(e.columnaEnOposicion);
  return (hallazgo.comparedValues ?? []).some(v =>
    literal(v.column) === col &&
    literal(v.newDocValue) === literal(e.enElAnalizado) &&
    literal(v.existingDocValue) === literal(e.enElCorpus));
}
