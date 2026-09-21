/**
 * LOS CUBOS DE UN SCORE — un solo sitio, F-114 (21/09/2026).
 *
 * ⚠️ POR QUÉ ESTE FICHERO EXISTE, Y NO ES ORGANIZACIÓN: ES UN CICLO. El
 * histograma nació en `vecindario.ts` (F-111), y `vecindario.ts` importa los
 * umbrales de `retrieval.ts`. El termómetro vive DENTRO de la recuperación, así
 * que si lo importara de allí quedaría `retrieval → vecindario → retrieval`.
 * Copiar la función habría sido la salida fácil y la prohibida: dos histogramas
 * con los mismos cubos se separan el día que alguien cambie la anchura, y los
 * dos seguirían pareciendo correctos por su cuenta.
 *
 * Así que los cubos bajan a un módulo que **no importa nada**, y lo usan los dos:
 * el censo de vecindario y el termómetro de cada análisis. Que las dos
 * distribuciones sean comparables es el punto entero de tenerlas.
 */

/** Anchura del cubo. Veinte cubos cubren [0 · 1]. */
export const ANCHO_DE_CUBO = 0.05;
export const CUBOS = 20;

/** El borde inferior del cubo `i`, redondeado para que no salga 0,35000000000000003. */
export function bordeInferior(i: number): number {
  return Math.round(i * ANCHO_DE_CUBO * 100) / 100;
}

/** El cubo donde cae un score. El 1,00 exacto va al último, no a un 21.º. */
export function cuboDe(score: number): number {
  const bruto = Math.floor(score / ANCHO_DE_CUBO);
  return Math.min(Math.max(bruto, 0), CUBOS - 1);
}

/** Un histograma vacío: veinte ceros. Nunca `undefined` ni una lista corta. */
export function histogramaVacio(): number[] {
  return new Array<number>(CUBOS).fill(0);
}

/**
 * El primer cubo cuya acumulada alcanza el percentil, devuelto por su borde
 * inferior. Con `n` fragmentos, el percentil `p` se alcanza en el elemento
 * `ceil(n · p / 100)` (mínimo 1), contando desde el más bajo.
 *
 * ⚠️ APROXIMADO AL CUBO: el valor real está entre ese borde y el siguiente
 * (0,05 de margen). Quien lo publique tiene que decirlo.
 */
export function percentilDelHistograma(histograma: number[], n: number, p: number): number | null {
  if (n === 0) return null;
  const objetivo = Math.max(1, Math.ceil((n * p) / 100));
  let acumulada = 0;
  for (let i = 0; i < histograma.length; i++) {
    acumulada += histograma[i];
    if (acumulada >= objetivo) return bordeInferior(i);
  }
  return bordeInferior(histograma.length - 1);
}
