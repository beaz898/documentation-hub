import type { RerankedCandidate } from './types';

/**
 * EL ORDEN CON EL QUE SE CORTA — B.244 paso 1.
 *
 * ⚠️ QUÉ ARREGLA. Hasta el 16/09/2026 `rerank.ts` hacía
 * `selected.slice(0, maxSelected)` sobre la lista **en el orden en que el modelo
 * enumeró los candidatos**. El campo `rerankConfidence` se escribía y no lo leía
 * nadie, así que el corte podía quedarse con una `baja` y tirar una `alta` sólo
 * porque el modelo las listó en ese orden.
 *
 * ⚠️ Y NO ERA SÓLO ARBITRARIO: ERA NO DETERMINISTA. El orden de enumeración lo
 * decide la salida del modelo, así que dos análisis idénticos podían cortar
 * distinto. Ordenar aquí no sólo mejora la elección — la hace REPRODUCIBLE, que
 * es condición para poder medirla.
 */

/** El rango de cada nivel. Mayor gana. */
const RANGO: Record<RerankedCandidate['rerankConfidence'], number> = {
  alta: 3,
  media: 2,
  baja: 1,
  // ⚠️ «NO LO DIJO» NO ES «DIJO MEDIA», Y ÉSTE ES EL VALOR QUE LO IMPIDE.
  // Hasta hoy, `sel.confidence || 'media'` convertía la ausencia en el nivel
  // intermedio: un valor que YA TENÍA DUEÑO —el modelo que sí dice «media»— y
  // que aguas abajo se leía como si lo hubiera dicho. Es la regla de la casa
  // sobre el tipo que no puede expresar el caso, aplicada a un enum.
  //
  // Va el ÚLTIMO, no en medio, y por una razón que se puede defender: entre un
  // candidato con valoración declarada y uno sin ella, el declarado trae más
  // evidencia detrás. Falla hacia lo que el modelo sí respaldó.
  sin_declarar: 0,
};

/**
 * ORDENA PARA CORTAR. No modifica la lista que recibe.
 *
 * Los tres criterios, en orden, y cada uno existe para que el siguiente no
 * tenga que decidir a ciegas:
 *
 *  1. **Confianza declarada.** Es el juicio del modelo, que es lo único que
 *     mira el contenido.
 *  2. **`maxScore`.** Con tres niveles sobre veinticinco candidatos los empates
 *     son el caso NORMAL, no la excepción, así que el desempate no es un
 *     detalle: decide casi siempre. Se usa el mejor parecido del candidato
 *     porque es una CANTIDAD REAL y determinista.
 *     ⚠️ Es una señal débil —los scores de este corpus están comprimidos entre
 *     0,79 y 0,99 (B.248)— y se declara débil. Pero una señal débil y estable
 *     vence a ninguna señal: lo que sustituye es el orden de salida de un
 *     modelo, que no es ni señal ni estable.
 *  3. **`documentId`.** Arbitrario y se dice que lo es. Su única virtud es que
 *     es DETERMINISTA: dos pasadas con los mismos candidatos cortan igual.
 *
 * ⚠️ LO QUE NO SE USA COMO DESEMPATE, Y ES LA MITAD DEL ARREGLO: el orden de
 * enumeración. Desempatar por él sería volver al comportamiento de hoy por la
 * puerta de atrás — con la lista ordenada por delante, pareciendo arreglado.
 */
export function ordenarParaCortar(candidatos: RerankedCandidate[]): RerankedCandidate[] {
  return [...candidatos].sort((a, b) => {
    const porConfianza = RANGO[b.rerankConfidence] - RANGO[a.rerankConfidence];
    if (porConfianza !== 0) return porConfianza;

    const scoreA = mejorScore(a);
    const scoreB = mejorScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;

    return a.documentId < b.documentId ? -1 : a.documentId > b.documentId ? 1 : 0;
  });
}

/** El mejor parecido del candidato. Sin fragmentos vale 0 — no `undefined`:
 *  un candidato sin fragmentos va al final, no a un sitio indefinido. */
function mejorScore(c: RerankedCandidate): number {
  let max = 0;
  for (const f of c.fragments) {
    if (f.score > max) max = f.score;
  }
  return max;
}

/**
 * NORMALIZA LO QUE VENGA DEL MODELO.
 *
 * Todo lo que no sea uno de los tres niveles conocidos —ausente, cadena vacía,
 * una palabra inventada, un número— es `sin_declarar`. **No se adivina**: si el
 * modelo escribió algo que no acordamos, no sabemos qué quiso decir, y
 * traducirlo al nivel más parecido sería inventar la valoración que falta.
 */
export function normalizarConfianza(valor: unknown): RerankedCandidate['rerankConfidence'] {
  if (valor === 'alta' || valor === 'media' || valor === 'baja') return valor;
  return 'sin_declarar';
}

/** Cuántos llegaron sin valoración utilizable. Va a contador: si el modelo deja
 *  de declarar confianza, el criterio 1 se apaga entero y el corte pasa a
 *  decidirse por el score. Eso NO es volver al fallo —sigue siendo
 *  determinista— pero es un cambio de régimen, y un cambio de régimen mudo es
 *  el que nadie ve. */
export function contarSinConfianza(candidatos: RerankedCandidate[]): number {
  return candidatos.filter(c => c.rerankConfidence === 'sin_declarar').length;
}
