/**
 * DOS PIEZAS DEL MARCADOR APROBADAS EL 28/09/2026.
 *
 * SEGUIMIENTO — una mitad del caso (cobertura, precisión o las dos) MIDE Y NO
 * JUZGA. Existe porque «desde cero no se puede empeorar»: un mínimo de 0 sobre
 * una base de 0 (P1) o un techo que arranca en el máximo observable (N6) no
 * pueden fallar, y un PASA suyo es vacío. Declarado, sale sin veredicto; lo
 * observado se sigue imprimiendo.
 *
 * TECHO POR FRECUENCIA DE UN FALSO — en cuántas pasadas aparece, que es lo que
 * se midió de Belmonte (1/4 tras `de158abd`), y no cuántos falsos caben en UNA
 * pasada, que con un solo falso posible nunca pasa de 1.
 */

export const MITADES = ['cobertura', 'precision'];

/**
 * POR QUÉ UNA MITAD ESTÁ EN SEGUIMIENTO (29/09/2026, B.293). Son dos cosas
 * distintas y se declaran, no se deducen de los números:
 *   · PENDIENTE_DE_MEDIR — nadie lo ha medido. El trinquete arranca en cuanto se
 *     mida (`validarElTechoDeFalsos`, `scripts/examen.mjs`).
 *   · NO_PUEDE_FALLAR — su umbral no puede fallar por construcción. El trinquete
 *     no arranca nunca.
 * La forma: `seguimiento: { precision: { clase, motivo } }`. La puerta del
 * marcador sólo lee QUÉ mitades están; la clase la lee el trinquete, que vive en
 * la validación. Un campo, un oficio.
 */
export const CLASES_DE_SEGUIMIENTO = new Set(['PENDIENTE_DE_MEDIR', 'NO_PUEDE_FALLAR']);

export function mitadesEnSeguimiento(caso) {
  const s = caso.umbralDeAlarma?.seguimiento ?? {};
  // La forma de lista (anterior al 29/09) no dice por qué: falla CERRADO, no se ignora.
  if (Array.isArray(s)) throw new Error(`${caso.id}: \`seguimiento\` en lista está retirado; va { mitad: { clase, motivo } }`);
  return new Set(Object.keys(s).filter(m => MITADES.includes(m)));
}

/** La clase declarada de una mitad en seguimiento, o `null` si no está. */
export function claseDeSeguimiento(caso, mitad) {
  return mitadesEnSeguimiento(caso).has(mitad) ? caso.umbralDeAlarma.seguimiento[mitad]?.clase ?? null : null;
}

/** `frecuenciaMaxima: { apariciones: 1, deCada: 5 }` — falla si k/n > apariciones/deCada. */
export function superaSuFrecuencia(k, n, fm) {
  return k * fm.deCada > fm.apariciones * n;
}

/**
 * `nDeclarado`: con la tanda incompleta, un exceso cuenta sólo si ya excede sobre
 * las pasadas DECLARADAS. Con 2 de 5 hechas, «1 de 2» no puede fallar contra «1 de
 * cada 5»: en las 3 que faltan podía no volver a salir. Sin este matiz, una tanda
 * corta pinta rojo lo que una completa no pintaría (arquitecto, 29/09/2026).
 */
export function juzgarFrecuencias(caso, hechas, nDeclarado = hechas.length) {
  const n = Math.max(hechas.length, nDeclarado);
  const fallos = [];
  for (const f of caso.noDebenSalir ?? []) {
    const fm = f.frecuenciaMaxima;
    if (!fm || f.cuentaComoFallo === false) continue;
    const k = hechas.filter(m => m.falsos.includes(f.id)).length;
    if (superaSuFrecuencia(k, n, fm)) {
      const deCuantas = n === hechas.length ? `${k}/${n} pasadas` : `${k}/${hechas.length} pasadas hechas (de ${n} declaradas)`;
      fallos.push(`${f.id} aparece en ${deCuantas} y su techo es ${fm.apariciones} de cada ${fm.deCada}`);
    }
  }
  return fallos;
}
