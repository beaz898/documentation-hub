/**
 * EL COMPARADOR DE FILA DEL EXAMEN (27/09/2026; fase 2 del detector, 28/09/2026).
 *
 * Una expectativa de FILA se cumple por la fila y sus dos valores, no por cita.
 * N1-PUESTO no lleva discriminantes a propósito —«Implantólogo» está dentro de
 * «Implantólogo / Cirujano oral» y no aísla—, y forzarle uno sería inventar un
 * discriminante para que el instrumento quepa.
 *
 * ⚠️ PRINCIPIO DEL DETECTOR (Estado_Del_MVP.md B.285, fase 2): el CONTENIDO y el
 * DETECTOR son dos preguntas. Aquí sólo se decide si el hallazgo dice lo que la
 * expectativa espera, venga de quien venga, por cualquiera de sus dos formas:
 *   · POR VALORES — lo que emite el diff: `comparedValues` con la columna (si la
 *     expectativa la declara) y los dos valores. Los lados NO se intercambian:
 *     la dirección la fija el diff, y un valor cambiado de lado es la confusión
 *     de lados, que tiene que salir como fallo.
 *   · POR CELDAS — lo que emite el juez, que no rellena `comparedValues` ni
 *     nombra columnas: la clave de fila y los dos valores como CELDAS de las dos
 *     filas citadas. Los lados SÍ se intercambian: el juez decide en qué campo
 *     pone cada fila. No comprueba la columna, porque el juez no la escribe.
 * Qué detector exige un caso lo declara el CASO (`detectorExigido`, con motivo);
 * el marcador lo aplica. Aquí no se fija ninguno.
 *
 * ⚠️ LOS VALORES SE COMPARAN LITERALES (sólo se colapsan espacios), no con
 * `normalize`: ésa es la de BUSCAR y quita puntos y guiones —«2.5» y «25»
 * saldrían iguales—. `normalize-core.mjs:79-96` lo avisa.
 */

/** ¿Es una expectativa de fila? La fila (persona o columna) y los dos valores. */
export function esDeFila(e) {
  return Boolean((e.persona || e.columnaEnOposicion) && e.enElAnalizado !== undefined && e.enElCorpus !== undefined);
}

/** El detector que el caso exige para esta expectativa, o `null` si no exige ninguno. */
export function detectorExigido(e) {
  return e.detectorExigido?.detector ?? null;
}

const literal = s => String(s ?? '').trim().replace(/\s+/g, ' ');

/** Las celdas de una fila tal como la escriben el diff y el juez: «[F3] a | b | c». */
export function celdasDeFila(fila) {
  return (fila ?? '').replace(/^\s*\[F\d+\]\s*/, '').split('|').map(literal);
}

function porValores(h, e, clave) {
  const nueva = celdasDeFila(h.newDocRow ?? h.newDocSays);
  const vieja = celdasDeFila(h.existingDocRow ?? h.existingDocSays);
  if (clave && !(nueva.includes(literal(clave)) && vieja.includes(literal(clave)))) return false;
  return (h.comparedValues ?? []).some(v =>
    (!e.columnaEnOposicion || literal(v.column) === literal(e.columnaEnOposicion)) &&
    literal(v.newDocValue) === literal(e.enElAnalizado) &&
    literal(v.existingDocValue) === literal(e.enElCorpus));
}

function porCeldas(h, e, clave) {
  if (!clave) return false;
  const nueva = celdasDeFila(h.newDocSays);
  const vieja = celdasDeFila(h.existingDocSays);
  const [p, a, b] = [clave, e.enElAnalizado, e.enElCorpus].map(literal);
  const lado = (x, y) => x.includes(p) && x.includes(a) && y.includes(p) && y.includes(b);
  return lado(nueva, vieja) || lado(vieja, nueva);
}

/**
 * ¿Dice este hallazgo lo que la expectativa de fila espera? Sólo contenido: el
 * detector lo decide el marcador con `detectorExigido`. Con `comparedValues`,
 * por valores; sin ellos, por celdas.
 */
export function encajaFila(h, e, clave = e.persona) {
  if (!esDeFila(e)) return false;
  return (h.comparedValues ?? []).length > 0 ? porValores(h, e, clave) : porCeldas(h, e, clave);
}
