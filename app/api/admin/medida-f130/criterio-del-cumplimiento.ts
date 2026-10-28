import { EXCEPCION_DE_LAS_REGLAS } from '@/lib/analysis/excepcion-de-las-reglas';

/**
 * EL CRITERIO DEL CUMPLIMIENTO PARA LA PREGUNTA CERRADA DE E3, SACADO DEL BLOQUE DEL JUEZ (28-29/10/2026). TEMPORAL como
 * toda la carpeta (cabecera de `medida-f130.ts`).
 *
 * NO ES UNA COPIA: se DERIVA de `EXCEPCION_DE_LAS_REGLAS` aplicando la cirugía del arquitecto, para que el criterio siga
 * escrito en un solo sitio (el dictamen de F-130: «no hay dos definiciones»). Cada corte y cada sustitución tiene que
 * casar EXACTAMENTE UNA VEZ en el bloque; si el bloque del juez cambia y alguno deja de casar, no se arma nada y E3 se
 * niega. Lo que no está en la lista se queda literal.
 *
 * LA CIRUGÍA (arquitecto, 29/10), en sus tres partes:
 *   · SE QUITA: el arranque y «Todo lo anterior vale para DATOS…»; la frase del campo «Ese hallazgo lleva el campo…»
 *     (las dos definiciones se quedan, como etiqueta); «ORDEN OBLIGATORIO…» entero; y el cierre del JSON.
 *   · SE REESCRIBE, y es lo único de su mano: las remisiones al formato viejo («es una CONTRADICCIÓN NORMAL y NO lleva el
 *     campo», «Es contradicción normal y NO lleva el campo») pasan a decir que ese caso es un hallazgo de la PREGUNTA 1.
 *   · SE QUEDA LITERAL todo lo demás.
 * Dos decisiones de Code, MARCADAS para el arquitecto: el título «CÓMO SE DISTINGUE DE UNA CONTRADICCIÓN NORMAL» cambia
 * su destino como las otras remisiones; y los dos párrafos que su lista no nombraba («Pero hay textos que no afirman un
 * dato…» y «Así que cuando los dos textos sean reglas…», con la pregunta central) se quedan, porque sólo se corta lo
 * que la lista corta.
 */
const QUITAR: string[] = [
  'EXCEPCIÓN, SÓLO CUANDO LOS DOS TEXTOS SON REGLAS:\n\n' +
  'Todo lo anterior vale para DATOS: cifras, plazos, nombres, precios,\n' +
  'frecuencias. Un dato tiene un valor, y hay contradicción cuando los dos\n' +
  'textos le dan valores distintos.\n\n',
  'Ese hallazgo lleva el campo "conflictoNormativo", con uno de estos dos\n' +
  'valores:\n\n',
  'ORDEN OBLIGATORIO: primero aplicas todo lo de arriba. Si los dos textos\n' +
  'dan valores distintos al mismo dato, es una contradicción normal y NO\n' +
  'lleva el campo. Esta excepción es sólo para lo que la regla de oro\n' +
  'dejaría pasar: reglas incompatibles que no discuten ningún dato.\n\n',
  '\n\nCUANDO EMITAS UN HALLAZGO DE ESTE TIPO, el elemento del JSON lleva el\n' +
  'campo así:\n' +
  '{ "topic": "…", "newDocSays": "…", "existingDocSays": "…",\n' +
  '  "severity": "contradiction", "conflictoNormativo": "norma_contra_norma" }',
];

const SUSTITUIR: Array<[string, string]> = [
  ['CÓMO SE DISTINGUE DE UNA CONTRADICCIÓN NORMAL: mira SOBRE QUÉ manda cada',
   'CÓMO SE DISTINGUE DE UN HALLAZGO DE LA PREGUNTA 1: mira SOBRE QUÉ manda cada'],
  ['  prohíbe, es una CONTRADICCIÓN NORMAL y NO lleva el campo. Es el caso de',
   '  prohíbe, es un hallazgo de la PREGUNTA 1, no de la 2. Es el caso de'],
  ['  eso SÍ es un dato con dos valores. Es contradicción normal y NO lleva el\n  campo.',
   '  eso SÍ es un dato con dos valores. Es un hallazgo de la PREGUNTA 1, no de\n  la 2.'],
];

export function recortarElCriterio(bloque: string): { ok: true; texto: string } | { ok: false; motivo: string } {
  let t = bloque;
  for (const q of QUITAR) {
    const n = t.split(q).length - 1;
    if (n !== 1) return { ok: false, motivo: `un corte casa ${n} veces en el bloque del juez y tiene que casar una: «${q.slice(0, 60).trim()}…»` };
    t = t.split(q).join('');
  }
  for (const [viejo, nuevo] of SUSTITUIR) {
    const n = t.split(viejo).length - 1;
    if (n !== 1) return { ok: false, motivo: `una sustitución casa ${n} veces en el bloque del juez y tiene que casar una: «${viejo.slice(0, 60).trim()}…»` };
    t = t.split(viejo).join(nuevo);
  }
  return { ok: true, texto: t };
}

/** El criterio que usa E3: el bloque del juez de hoy, recortado. */
export const CRITERIO_DEL_CUMPLIMIENTO = recortarElCriterio(EXCEPCION_DE_LAS_REGLAS);
