import type { RepartoDelRerank } from './reparto-del-rerank';

/**
 * EL ALCANCE DEL ANÁLISIS, A NIVEL DE DOCUMENTO — B.244 paso 2, y su redacción
 * definitiva del 16/09/2026 (§5.71).
 *
 * El aviso de filas (`SelectionLimitNotice`) dice qué filas de una tabla no
 * cupieron. Éste dice algo anterior y mayor: **contra cuántos documentos se
 * comparó de verdad**, de los que la recuperación encontró afines.
 *
 * ⚠️ LA REGLA QUE GOBIERNA TODAS LAS FRASES (§5.66): **un mensaje puede afirmar
 * QUÉ pasó; la CAUSA, sólo si está medida.** Hasta el 16/09 este fichero decía
 * «otros N tienen menor afinidad y no entraron» construido sobre la resta
 * `afines − comparados`, que mezcla causas. Ahora la causa sale del reparto del
 * rerank, y cuando el reparto no la respalda la frase se escribe sin ella.
 *
 * ⚠️ «AFINIDAD» SE CONSERVA DONDE ES VERDAD, Y SÓLO AHÍ. La eligió el director, y
 * es verdad de los AFINES: los que la recuperación trajo por parecido. No es
 * verdad de los COMPARADOS: el corte ordena por la CONFIANZA DEL MODELO y
 * después por parecido (`orden-del-rerank.ts`), así que «los más afines» podía
 * nombrar un orden que no se cumplía — un cortado con confianza `media` puede
 * parecerse más que un comparado con `alta`. Donde se habla del orden del corte
 * la palabra es **«priorizó»**, que es literalmente lo que hace ese orden,
 * incluidos los empates. No es un cambio de criterio del director: es que su
 * criterio no se podía cumplir tal como estaba escrito.
 *
 * ⚠️ POR QUÉ ESTO ES LÓGICA Y NO JSX. Qué frase sale es una DECISIÓN, y una
 * decisión escrita dentro de un componente es una decisión sin vigilancia.
 */

/** Lo que el pipeline mide y hace viajar. */
export interface CoberturaDeCandidatos {
  /** Documentos que llegaron al juez: se compararon de verdad. */
  comparados: number;
  /** Documentos que la recuperación encontró afines, antes de cualquier corte. */
  afines: number;
  /**
   * Por dónde se fue cada uno de los que no entraron (B.251). AUSENTE en todo
   * análisis anterior al 16/09/2026 —la bandeja relee jsonb viejos—, y entonces
   * la frase no dice causa ninguna.
   */
  reparto?: RepartoDelRerank;
}

/**
 * QUÉ SE SABE DE LOS QUE QUEDARON FUERA. Tres formas, y la frase sale de la
 * forma, no de volver a mirar los números:
 *
 *  · `sin_resto`  — no quedó ninguno fuera.
 *  · `causas`     — el reparto CUADRA: cada uno de los de fuera es tope o
 *                   criterio, y no hubo ids sin reconocer que contaminen el
 *                   criterio.
 *  · `parcial`    — se sabe cuántos cortó el TOPE (ese contador no lo contamina
 *                   nada), pero el resto no tiene causa respaldada: ids no
 *                   reconocidos, fallback del rerank o un análisis viejo sin
 *                   reparto. `porTope` puede valer 0.
 */
export type Fuera =
  | { forma: 'sin_resto' }
  | { forma: 'causas'; porTope: number; porCriterio: number }
  | { forma: 'parcial'; porTope: number; sinCausa: number };

/** Lo que la pantalla necesita para escribir la frase. */
export interface FraseDeCobertura {
  comparados: number;
  afines: number;
  /** Afines que no entraron en la comparación. Cero es un valor legítimo. */
  totalFuera: number;
  fuera: Fuera;
}

/**
 * ¿Hay algo que decir sobre la cobertura, y qué se sabe de ello?
 *
 * Devuelve `null` —no se pinta nada— sin dato o con `comparados <= 0`: sin dato
 * no se inventa uno, y cero comparados es una noticia mayor de la que ya habla
 * el resultado. El aviso SALE SIEMPRE en el resto de casos (decisión del
 * director, 16/09/2026).
 */
export function resumirCobertura(cobertura?: CoberturaDeCandidatos): FraseDeCobertura | null {
  if (!cobertura) return null;
  const { comparados, afines, reparto } = cobertura;
  if (!Number.isFinite(comparados) || !Number.isFinite(afines)) return null;
  if (comparados <= 0) return null;

  // ⚠️ NUNCA NEGATIVO: si alguien reordena las etapas y afines < comparados,
  // el resto vale 0 en vez de anunciar «-3 documentos».
  const totalFuera = Math.max(0, afines - comparados);
  const base = { comparados, afines, totalFuera };
  if (totalFuera === 0) return { ...base, fuera: { forma: 'sin_resto' } };

  // Sin reparto, o sin respuesta del modelo: no hay causa que decir. El tope no
  // cortó nada que se sepa — en el fallback no hubo elección que cortar.
  if (!reparto || reparto.origen !== 'modelo') {
    return { ...base, fuera: { forma: 'parcial', porTope: 0, sinCausa: totalFuera } };
  }

  const { cortadosPorTope, descartadosPorCriterio, idsNoReconocidos } = reparto;
  const cuadra = cortadosPorTope + descartadosPorCriterio === totalFuera;

  if (idsNoReconocidos === 0 && cuadra) {
    return { ...base, fuera: { forma: 'causas', porTope: cortadosPorTope, porCriterio: descartadosPorCriterio } };
  }

  // ⚠️ LA CAÍDA ES PARCIAL, NO ENTERA (decisión del 16/09/2026). Un id no
  // reconocido contamina el CRITERIO, no el TOPE: tirar también la parte del
  // tope sería perder información fiable por culpa de una que no lo es. Se
  // explica lo que cortó el tope y se calla la causa del resto.
  // El tope sólo se cree si cabe en lo que falta; si no cabe, el reparto no
  // describe este análisis y no se afirma nada.
  const porTope = cortadosPorTope <= totalFuera ? cortadosPorTope : 0;
  if (porTope === totalFuera) {
    return { ...base, fuera: { forma: 'causas', porTope, porCriterio: 0 } };
  }
  return { ...base, fuera: { forma: 'parcial', porTope, sinCausa: totalFuera - porTope } };
}

// ════════════════════════════════════════════════════════════════════════
// LAS FRASES. Cada pieza en singular y plural a mano: «los 1 documentos»
// destruye la credibilidad de un aviso cuyo único trabajo es que se le crea.
// ════════════════════════════════════════════════════════════════════════

/** Cabeza cuando hubo un ORDEN que decidió: «priorizó», no «más afines». */
function cabezaPriorizada(comparados: number, afines: number): string {
  return comparados === 1
    ? `Se comparó con el documento que el análisis priorizó de los ${afines} afines a éste.`
    : `Se compararon los ${comparados} que el análisis priorizó de los ${afines} afines a éste.`;
}

/** Cabeza sin orden que afirmar: cuántos de cuántos, y nada más. */
function cabezaNeutra(comparados: number, afines: number): string {
  return comparados === 1
    ? `Se comparó con 1 de los ${afines} documentos afines a éste.`
    : `Se compararon ${comparados} de los ${afines} documentos afines a éste.`;
}

/** Los que el modelo eligió y el tope dejó fuera. */
function colaTope(n: number): string {
  return n === 1
    ? 'Otro también se eligió, con menor prioridad, y no cupo.'
    : `Otros ${n} también se eligieron, con menor prioridad, y no cupieron.`;
}

/** Los que el modelo miró y no eligió. Dice QUÉ pasó, no qué valen. */
function colaCriterio(n: number): string {
  return n === 1
    ? 'El otro se revisó y no se seleccionó para esta comparación.'
    : `Los otros ${n} se revisaron y no se seleccionaron para esta comparación.`;
}

/** Los que no entraron y cuya causa no está respaldada. */
function colaSinCausa(n: number): string {
  return n === 1
    ? 'El otro no entró en esta comparación.'
    : `Los otros ${n} no entraron en esta comparación.`;
}

/** Lo que queda sin causa DESPUÉS de haber explicado el tope. */
function colaSinCausaTrasTope(n: number): string {
  return n === 1 ? 'Otro más tampoco entró.' : `Otros ${n} más tampoco entraron.`;
}

/**
 * LA FRASE, fila por fila (§5.71). Las seis filas y su condición:
 *
 *  1. sin resto                         → «…que eran todos los que había»
 *  2. causas, sólo tope                 → cabeza priorizada + cola del tope
 *  3. causas, sólo criterio             → cabeza neutra + cola del criterio
 *  4. causas, mixto                     → cabeza priorizada + las dos, desglosadas
 *  5. parcial con tope                  → cabeza priorizada + tope + «otros más»
 *  6. parcial sin tope (o sin reparto)  → cabeza neutra + sin causa
 *
 * ⚠️ LA FILA 6 CAMBIA LOS ANÁLISIS VIEJOS: hasta el 16/09 decían «tienen menor
 * afinidad» sin saberlo. Ahora no dicen causa. No es una regresión.
 */
export function textoDeCobertura(frase: FraseDeCobertura): string {
  const { comparados, afines, fuera } = frase;

  if (fuera.forma === 'sin_resto') {
    return comparados === 1
      ? 'Se comparó con el único documento afín a éste que hay en tu corpus.'
      : `Se compararon los ${comparados} documentos afines a éste, que eran todos los que había.`;
  }

  if (fuera.forma === 'causas') {
    const { porTope, porCriterio } = fuera;
    if (porCriterio === 0) {
      return `${cabezaPriorizada(comparados, afines)} ${colaTope(porTope)}`;
    }
    if (porTope === 0) {
      return `${cabezaNeutra(comparados, afines)} ${colaCriterio(porCriterio)}`;
    }
    const tope = porTope === 1
      ? '1 también se eligió, con menor prioridad, y no cupo'
      : `${porTope} también se eligieron, con menor prioridad, y no cupieron`;
    const criterio = porCriterio === 1
      ? '1 se revisó y no se seleccionó'
      : `${porCriterio} se revisaron y no se seleccionaron`;
    return `${cabezaPriorizada(comparados, afines)} De los otros ${porTope + porCriterio}, ${tope}; ${criterio}.`;
  }

  const { porTope, sinCausa } = fuera;
  if (porTope > 0) {
    return `${cabezaPriorizada(comparados, afines)} ${colaTope(porTope)} ${colaSinCausaTrasTope(sinCausa)}`;
  }
  return `${cabezaNeutra(comparados, afines)} ${colaSinCausa(sinCausa)}`;
}
