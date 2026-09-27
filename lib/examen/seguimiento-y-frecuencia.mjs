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

export function mitadesEnSeguimiento(caso) {
  return new Set((caso.umbralDeAlarma?.seguimiento ?? []).filter(m => MITADES.includes(m)));
}

/** `frecuenciaMaxima: { apariciones: 1, deCada: 5 }` — falla si k/n > apariciones/deCada. */
export function superaSuFrecuencia(k, n, fm) {
  return k * fm.deCada > fm.apariciones * n;
}

export function juzgarFrecuencias(caso, hechas) {
  const n = hechas.length;
  const fallos = [];
  for (const f of caso.noDebenSalir ?? []) {
    const fm = f.frecuenciaMaxima;
    if (!fm || f.cuentaComoFallo === false) continue;
    const k = hechas.filter(m => m.falsos.includes(f.id)).length;
    if (superaSuFrecuencia(k, n, fm)) {
      fallos.push(`${f.id} aparece en ${k}/${n} pasadas y su techo es ${fm.apariciones} de cada ${fm.deCada}`);
    }
  }
  return fallos;
}
