/**
 * LA REGLA LAXA DE LA TANDA DE CLARIDAD, CONGELADA (12/11/2026). Es la cuenta PRIMARIA (`tanda-de-claridad.ts`), y Fable puso una
 * condición para puntuar sus predicciones contra ella: «la regla congelada con huella antes de contar». Por eso vive SOLA en este
 * fichero: su huella cubre la regla y nada más, y `regla-laxa.test.ts` la fija. Cambiar una letra de este fichero pone esa prueba en
 * rojo, y entonces la regla ya no es la prerregistrada: o se revierte, o se prerregistra otra ANTES de contar.
 * LA REGLA: la primera línea no vacía, en mayúsculas, sin tildes y sin signos, EMPIEZA por una de las palabras permitidas del brazo
 * (como palabra entera) y NO CONTIENE ninguna de las otras dos. Si no empieza por ninguna, OTRA; si contiene otra, INDECIDIBLE. Las
 * dos cuentan en contra. Positivo: CONFLICTO en el brazo N, NO PUEDE en el R.
 */
export type BrazoDeClaridad = 'n' | 'r';
export const POSITIVO: Record<BrazoDeClaridad, string> = { n: 'CONFLICTO', r: 'NO PUEDE' };
export const OPCIONES: Record<BrazoDeClaridad, readonly string[]> = { n: ['CONFLICTO', 'COMPATIBLES', 'DEPENDE'], r: ['NO PUEDE', 'SI PUEDE', 'DEPENDE'] };

/** La primera línea para la cuenta LAXA: en mayúsculas, sin tildes y sin signos (sólo letras, cifras y espacios). */
export function primeraLineaSinSignos(respuesta: string): string {
  const linea = respuesta.split('\n').map(l => l.trim()).find(l => l !== '') ?? '';
  return linea.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** La opción LAXA: la palabra permitida por la que EMPIEZA la línea, como palabra entera, si no contiene ninguna de las otras dos. */
export function opcionLaxa(brazo: BrazoDeClaridad, respuesta: string): string {
  const linea = primeraLineaSinSignos(respuesta);
  const contiene = (w: string) => new RegExp(`(^| )${w}( |$)`).test(linea);
  const empieza = OPCIONES[brazo].filter(w => linea === w || linea.startsWith(`${w} `));
  if (empieza.length !== 1) return 'OTRA';
  return OPCIONES[brazo].some(w => w !== empieza[0] && contiene(w)) ? 'INDECIDIBLE' : empieza[0];
}

/** El positivo LAXO de una tirada. */
export function positivoLaxo(brazo: BrazoDeClaridad, respuesta: string): boolean {
  return opcionLaxa(brazo, respuesta) === POSITIVO[brazo];
}
