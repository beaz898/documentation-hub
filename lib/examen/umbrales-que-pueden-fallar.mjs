import { CLAVES_ESTRUCTURALES } from './comparador-estructural.mjs';
import { ESTABLE_ACIERTO } from './estabilidad.mjs';
import { REGLAS_MECANICAS, sabeEmparejar } from './marcador.mjs';

/**
 * ¿EXISTE ALGÚN RESULTADO QUE HAGA FALLAR ESTE UMBRAL? (28/09/2026)
 *
 * Un umbral que no puede fallar no es un umbral. El validador de lectura
 * comprueba que el marcador SABE LEER lo que el caso declara; esto comprueba
 * que lo leído PUEDE dar rojo. Aritmética sobre el caso, sin crudos ni créditos.
 *
 *   · techo de falsos T: por pasada caben, como mucho, tantos falsos como
 *     `noDebenSalir` contables y emparejables haya (cada uno empareja una vez);
 *     una regla mecánica no tiene tope. Puede saltar si ese máximo supera T.
 *   · mínimo de aciertos: puede fallar si es > 0. Con 0 y esperados que
 *     cuentan, la mitad de cobertura no puede dar rojo.
 *   · la alarma de estabilidad puede saltar si algún esperado la declara.
 *   · los estructurales: un mínimo > 0 o un techo sobre algo sin tope.
 *
 * Un caso con línea de base PENDIENTE no da verde, así que su «no puede
 * fallar» no se canta: sale SIN_VEREDICTO siempre.
 */

/** Falsos posibles por pasada. `Infinity` si una regla mecánica cuenta. */
export function falsosPosiblesPorPasada(caso) {
  let n = 0;
  for (const f of caso.noDebenSalir ?? []) {
    if (f.cuentaComoFallo === false) continue;
    if (REGLAS_MECANICAS.has(f.regla)) return Infinity;
    if (!f.regla && sabeEmparejar(f, caso)) n++;
  }
  return n;
}

export function umbralesQueNoPuedenFallar(caso, donde = caso.id) {
  const umbral = caso.umbralDeAlarma ?? {};
  if (umbral.estado === 'LINEA_DE_BASE_PENDIENTE') return [];

  const problemas = [];
  let algunoPuede = false;

  const contables = (caso.debenSalir ?? []).filter(e => e.cuentaParaElUmbral !== false);
  if (typeof umbral.minimoDeAciertos === 'number') {
    if (umbral.minimoDeAciertos > 0) algunoPuede = true;
    else if (contables.length > 0) {
      problemas.push(`${donde}: \`minimoDeAciertos: 0\` con ${contables.length} esperado(s) que cuentan ` +
        `(${contables.map(e => e.id).join(', ')}): la mitad de cobertura no puede fallar`);
    }
  }
  if (contables.some(e => e.estabilidadDeBase === ESTABLE_ACIERTO)) algunoPuede = true;

  const techo = umbral.maximoDeFalsosConfirmados;
  if (typeof techo === 'number') {
    const posibles = falsosPosiblesPorPasada(caso);
    if (posibles > techo) algunoPuede = true;
    else {
      problemas.push(`${donde}: \`maximoDeFalsosConfirmados: ${techo}\` y como mucho caben ${posibles} falso(s) ` +
        'por pasada: el techo no puede saltar');
    }
  }

  for (const k of CLAVES_ESTRUCTURALES) {
    const v = umbral[k];
    if (typeof v !== 'number') continue;
    const esMinimo = k.endsWith('Minimo');
    if (!esMinimo || v > 0) algunoPuede = true;
    else problemas.push(`${donde}: \`${k}: 0\`: un mínimo de cero no puede fallar`);
  }

  if (!algunoPuede) {
    problemas.push(`${donde}: NINGÚN umbral de este caso puede fallar: su verde no mide nada`);
  }
  return problemas;
}
