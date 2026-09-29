import { CLAVES_ESTRUCTURALES } from './comparador-estructural.mjs';
import { ESTABLE_ACIERTO } from './estabilidad.mjs';
import { extrasCuentanComoFalsos, REGLAS_MECANICAS, sabeEmparejar } from './marcador.mjs';
import { mitadesEnSeguimiento } from './seguimiento-y-frecuencia.mjs';

/**
 * ¿PUEDE FALLAR CADA UMBRAL? ¿Y PUEDE PASAR? (28/09/2026)
 *
 * Un umbral que no puede fallar no es un umbral, y uno que no puede pasar
 * tampoco: es un rojo fijo, que entrena a ignorar la luz. Aritmética sobre el
 * caso, sin crudos ni créditos.
 *
 *   · techo de falsos T por pasada: caben tantos falsos como `noDebenSalir`
 *     contables y emparejables (cada uno una vez); una regla mecánica o los
 *     extras contados como falsos no tienen tope.
 *   · techo por frecuencia de un falso: puede fallar si deja menos de todas.
 *   · mínimo de aciertos: puede fallar si es > 0; puede PASAR sólo si no pide
 *     más esperados de los que el marcador sabe emparejar.
 *   · la alarma de estabilidad puede saltar si algún esperado la declara.
 *   · estructurales: un mínimo > 0 o un techo sobre algo sin tope; y un mínimo
 *     no puede pedir más filas de las que el caso espera.
 *
 * ⚠️ LO QUE NO VE: un umbral imposible por algo que no es aritmética. El de P2
 * (2 aciertos en una dirección en la que el juez sólo ve una de las trampas)
 * cuadraba en números y era imposible por el recorte del analizado.
 *
 * Una mitad en SEGUIMIENTO no se juzga, así que no se canta aquí. La línea de base
 * pendiente ES una mitad en seguimiento desde el 29/09 (`PENDIENTE_DE_MEDIR`).
 */

/** Falsos posibles por pasada. `Infinity` si algo cuenta sin tope. */
export function falsosPosiblesPorPasada(caso) {
  if (extrasCuentanComoFalsos(caso)) return Infinity;
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
  const seg = mitadesEnSeguimiento(caso);
  if (seg.size === 2) return [];

  const problemas = [];
  let algunoPuede = false;

  const contables = (caso.debenSalir ?? []).filter(e => e.cuentaParaElUmbral !== false);
  if (!seg.has('cobertura')) {
    if (typeof umbral.minimoDeAciertos === 'number') {
      if (umbral.minimoDeAciertos > 0) algunoPuede = true;
      else if (contables.length > 0) {
        problemas.push(`${donde}: \`minimoDeAciertos: 0\` con ${contables.length} esperado(s) que cuentan ` +
          `(${contables.map(e => e.id).join(', ')}): la mitad de cobertura no puede fallar`);
      }
    }
    if (contables.some(e => e.estabilidadDeBase === ESTABLE_ACIERTO)) algunoPuede = true;
  }

  if (!seg.has('precision')) {
    const techo = umbral.maximoDeFalsosConfirmados;
    if (typeof techo === 'number') {
      const posibles = falsosPosiblesPorPasada(caso);
      if (posibles > techo) algunoPuede = true;
      else {
        problemas.push(`${donde}: \`maximoDeFalsosConfirmados: ${techo}\` y como mucho caben ${posibles} falso(s) ` +
          'por pasada: el techo no puede saltar');
      }
    }
    for (const f of caso.noDebenSalir ?? []) {
      const fm = f.frecuenciaMaxima;
      if (!fm || f.cuentaComoFallo === false) continue;
      if (fm.apariciones < fm.deCada) algunoPuede = true;
      else problemas.push(`${donde}/${f.id}: \`frecuenciaMaxima\` ${fm.apariciones} de cada ${fm.deCada}: no puede saltar`);
    }
  }

  for (const k of CLAVES_ESTRUCTURALES) {
    const v = umbral[k];
    if (typeof v !== 'number') continue;
    if (!k.endsWith('Minimo') || v > 0) algunoPuede = true;
    else problemas.push(`${donde}: \`${k}: 0\`: un mínimo de cero no puede fallar`);
  }

  if (!algunoPuede) {
    problemas.push(`${donde}: NINGÚN umbral de este caso puede fallar: su verde no mide nada`);
  }
  return problemas;
}

/** Cuántas filas de cada clase espera el caso estructural, para sus mínimos. */
const FILAS_ESPERADAS = {
  identicasMinimo: e => e.identicas?.length ?? 0,
  discrepantesConColumnaCorrectaMinimo: e => e.discrepantes?.length ?? 0,
};

export function umbralesQueNoPuedenPasar(caso, donde = caso.id) {
  const umbral = caso.umbralDeAlarma ?? {};
  const seg = mitadesEnSeguimiento(caso);
  const problemas = [];

  if (!seg.has('cobertura') && typeof umbral.minimoDeAciertos === 'number') {
    const emparejables = (caso.debenSalir ?? [])
      .filter(e => e.cuentaParaElUmbral !== false && sabeEmparejar(e, caso)).length;
    if (umbral.minimoDeAciertos > emparejables) {
      problemas.push(`${donde}: \`minimoDeAciertos: ${umbral.minimoDeAciertos}\` y sólo ${emparejables} esperado(s) ` +
        'que cuentan se pueden emparejar: no puede pasar nunca');
    }
  }
  if (!seg.has('precision')) {
    if (typeof umbral.maximoDeFalsosConfirmados === 'number' && umbral.maximoDeFalsosConfirmados < 0) {
      problemas.push(`${donde}: \`maximoDeFalsosConfirmados\` negativo: no puede pasar nunca`);
    }
  }
  for (const [k, cuantas] of Object.entries(FILAS_ESPERADAS)) {
    const v = umbral[k];
    if (typeof v === 'number' && caso.esperadoEstructural && v > cuantas(caso.esperadoEstructural)) {
      problemas.push(`${donde}: \`${k}: ${v}\` y el caso sólo espera ${cuantas(caso.esperadoEstructural)}: no puede pasar nunca`);
    }
  }
  return problemas;
}
