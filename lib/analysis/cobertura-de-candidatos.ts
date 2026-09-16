/**
 * EL ALCANCE DEL ANÁLISIS, A NIVEL DE DOCUMENTO — B.244 paso 2.
 *
 * El aviso de filas (`SelectionLimitNotice`) dice qué filas de una tabla no
 * cupieron. Éste dice algo anterior y mayor: **contra cuántos documentos se
 * comparó de verdad**, de los que la recuperación encontró afines.
 *
 * ⚠️ LA REDACCIÓN LA FIJÓ EL DIRECTOR, Y ES LA VERDAD TÉCNICA EXACTA. No se
 * dice «N documentos no se tuvieron en cuenta»: se dice que **se compararon los
 * más afines y que los otros tienen menor afinidad con éste**.
 *
 * La diferencia no es de tono, es de hecho: no quedaron fuera por un fallo ni
 * «porque sí» — quedaron fuera por **ranking de afinidad**, que es como
 * funciona cualquier recuperación seria. Un mensaje que insinuara descuido
 * sembraría desconfianza sobre un comportamiento correcto, y eso es peor que
 * callarse.
 *
 * ⚠️ POR QUÉ ESTO ES LÓGICA Y NO JSX. Que el aviso aparezca o no es una
 * DECISIÓN, y una decisión escrita dentro de un componente es una decisión sin
 * vigilancia: en esta casa las pruebas son de lógica pura. Aquí se puede mutar
 * y ver morir un caso.
 */

/** Lo que el pipeline mide y hace viajar. */
export interface CoberturaDeCandidatos {
  /** Documentos que llegaron al juez: se compararon de verdad. */
  comparados: number;
  /** Documentos que la recuperación encontró afines, antes de cualquier corte. */
  afines: number;
}

/** Lo que la pantalla necesita para escribir la frase. */
export interface FraseDeCobertura {
  comparados: number;
  /** Afines que no entraron en la comparación. Cero es un valor legítimo. */
  conMenorAfinidad: number;
  /**
   * ¿Quedó alguno fuera? **Decide qué frase se escribe, no si se escribe.**
   *
   * ⚠️ EL 16/09/2026 EL DIRECTOR DECIDIÓ QUE EL AVISO SALGA SIEMPRE, y la razón
   * no estaba en la lista de argumentos que yo había escrito: **hoy no tiene
   * ninguna forma de saber contra cuántos documentos se comparó un análisis**.
   * Ver «se comparó con 2» le dice de un vistazo que su corpus efectivo es
   * minúsculo — que es exactamente lo que costó tres días descubrir con SQL.
   *
   * «Un aviso que sale siempre pierde fuerza» es cierto. **El silencio de hoy
   * no tiene ninguna.**
   */
  hayResto: boolean;
}

/**
 * ¿Hay algo que decir sobre la cobertura, y qué?
 *
 * Devuelve `null` —o sea, no se pinta nada— en los dos casos en que la frase
 * sería falsa o redundante:
 *
 *  · **Sin dato.** Los análisis anteriores a este despliegue no traen
 *    `cobertura`, y la bandeja relee jsonb viejos. Sin dato no se inventa uno:
 *    callar es correcto; escribir «se compararon 0 documentos» sería mentir
 *    sobre un análisis que sí comparó.
 *  · **`comparados === 0`.** No hubo comparación ninguna, y de eso ya habla el
 *    propio resultado del análisis. Un aviso de alcance sobre una comparación
 *    que no ocurrió no es un alcance: es ruido encima de una noticia mayor.
 */
export function resumirCobertura(cobertura?: CoberturaDeCandidatos): FraseDeCobertura | null {
  if (!cobertura) return null;
  const { comparados, afines } = cobertura;
  if (!Number.isFinite(comparados) || !Number.isFinite(afines)) return null;
  if (comparados <= 0) return null;

  // ⚠️ NUNCA NEGATIVO. `afines` es lo que recuperó el retrieval y `comparados`
  // lo que llegó al juez, así que afines >= comparados SIEMPRE… salvo que
  // alguien reordene las etapas y deje de ser cierto. Si eso pasa, el resto
  // vale 0 y la frase no promete nada raro, en vez de anunciar «-3 documentos
  // con menor afinidad».
  const conMenorAfinidad = Math.max(0, afines - comparados);

  return {
    comparados,
    conMenorAfinidad,
    hayResto: conMenorAfinidad > 0,
  };
}

/**
 * LA FRASE, ESCRITA AQUÍ Y NO EN EL COMPONENTE.
 *
 * ⚠️ PORQUE UNA REDACCIÓN DENTRO DEL JSX ES UNA REDACCIÓN SIN PRUEBA. En esta
 * casa las baterías son de lógica pura: si el texto vive aquí, una mutación de
 * la redacción mata un caso; si vive en el componente, no la caza nadie.
 *
 * ⚠️ Y EL CASO SIN RESTO NO ES EL MISMO TEXTO CON UN CERO. «Se compararon los 2
 * documentos más afines a éste», a secas, se lee como si hubiera más y no se
 * dijera cuántos — que es justo la duda que este aviso existe para quitar. Sin
 * resto, la frase dice que ésos **eran todos los que había**.
 */
export function textoDeCobertura(frase: FraseDeCobertura): string {
  const { comparados, conMenorAfinidad, hayResto } = frase;

  if (!hayResto) {
    // El singular se escribe aparte a propósito: «los 1 documentos» destruye la
    // credibilidad de un aviso cuyo único trabajo es que se le crea.
    return comparados === 1
      ? 'Se comparó con el único documento afín a éste que hay en tu corpus.'
      : `Se compararon los ${comparados} documentos afines a éste, que eran todos los que había.`;
  }

  const cabeza = comparados === 1
    ? 'Se comparó con el documento más afín a éste.'
    : `Se compararon los ${comparados} documentos más afines a éste.`;

  const cola = conMenorAfinidad === 1
    ? 'Otro tiene menor afinidad con este documento y no entró en la comparación.'
    : `Otros ${conMenorAfinidad} tienen menor afinidad con este documento y no entraron en la comparación.`;

  return `${cabeza} ${cola}`;
}