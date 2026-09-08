import { CREDIT_COSTS } from './credits';

/**
 * EL PRECIO QUE SE ENSEÑA EN UN BOTÓN — B.180.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ EL PRECIO SE DERIVA, NO SE ESCRIBE. Sale de `CREDIT_COSTS`, que es lo que
 * el servidor cobra de verdad. Escribirlo a mano en una etiqueta o en un
 * `messages/es.json` crea una SEGUNDA definición del precio, y el día que
 * alguien cambie el coste el botón seguirá diciendo el viejo: **mentiría sobre
 * dinero**, que es la peor clase de copia desincronizada que puede haber aquí.
 *
 * No es hipotético: `analysis.exhaustiveDesc` decía «Coste: 30 créditos» con el
 * 30 escrito a mano, a un campo de distancia del botón que cobraba mudo.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ EL CRITERIO —Y SE ESCRIBE EL CRITERIO, NO LA LISTA, para que quien añada
 * mañana un botón de 20 créditos sepa qué hacer sin preguntar:
 *
 *     LLEVA PRECIO EN LA ETIQUETA TODA ACCIÓN CUYO COSTE EL USUARIO NO
 *     ADIVINARÍA.
 *
 * No es «todo lo que cobra». Preguntar en el chat cuesta 1 y mejorar un
 * problema cuesta 1: son el verbo principal del producto, su coste es el suelo
 * de la tarifa, y el saldo de la cabecera ya lo comunica. Etiquetar cada envío
 * con «(1 crédito)» sería ruido, no información — y el ruido se deja de leer,
 * que es cómo un precio de 30 acaba pasando desapercibido entre avisos de 1.
 *
 * Lo que sí lo lleva: analizar (5 por documento), el estilo (2) y el exhaustivo
 * (30). Un salto de 1 a 30 no se adivina.
 *
 * ⚠️ Y EN LA ETIQUETA, NO EN UN `title`. Un mensaje al pasar el ratón no existe
 * en un móvil, así que el precio sería invisible justo para quien no tiene otra
 * forma de verlo. El `title` puede añadir contexto; el número va en el botón.
 */

/** Las claves de `CREDIT_COSTS` que hoy se enseñan. Es una comodidad de
 *  tipado para los llamadores, no un catálogo aparte: la verdad sigue estando
 *  en `CREDIT_COSTS` y este tipo no puede desviarse de ella sin dejar de
 *  compilar. */
export type OperacionConPrecio =
  | '/api/analyze-v2'
  | '/api/analyze-v2:exhaustive'
  | '/api/analyze-style';

/**
 * El coste total de una operación, por si se repite sobre varios documentos.
 *
 * ⚠️ DEVUELVE `null` SI LA CLAVE NO ESTÁ, en vez de `0`. Un cero se pintaría
 * como «0 créditos» —un precio afirmado y falso— mientras que un `null` deja
 * el botón como estaba: sin precio. Entre no decir nada y decir que es gratis,
 * no decir nada.
 */
export function costeDe(clave: string, unidades = 1): number | null {
  const unitario = CREDIT_COSTS[clave];
  if (typeof unitario !== 'number') return null;
  if (!Number.isFinite(unidades) || unidades < 1) return null;
  return unitario * unidades;
}

/**
 * El texto del precio, ya en singular o plural.
 *
 * Devuelve `null` cuando no hay precio que enseñar, para que el llamador pueda
 * escribir `{sufijo ? \`Analizar · ${sufijo}\` : 'Analizar'}` sin inventarse un
 * caso vacío.
 */
/**
 * El texto de un total YA CALCULADO.
 *
 * ⚠️ EXISTE PARA NO RECALCULAR LO QUE YA ESTÁ CALCULADO, y lo escribo porque
 * me lo salté: `ReviewSelectionBar` RECIBE `estimatedCost` y `exhaustiveCost`
 * —los computa `useReviewList` con `getCreditCost`— y la primera versión de
 * B.180 los ignoró y volvió a multiplicar clave × unidades dentro del
 * componente. Dos caminos al mismo número, de acuerdo hoy, en el commit que
 * existía para quitar exactamente eso.
 *
 * Quien ya tenga el total usa esto; quien no lo tenga usa `sufijoDeCoste`.
 */
export function sufijoDeTotal(total: number | null | undefined): string | null {
  if (typeof total !== 'number' || !Number.isFinite(total) || total < 1) return null;
  return total === 1 ? '1 crédito' : `${total} créditos`;
}

export function sufijoDeCoste(clave: string, unidades = 1): string | null {
  const total = costeDe(clave, unidades);
  if (total === null) return null;
  return total === 1 ? '1 crédito' : `${total} créditos`;
}
