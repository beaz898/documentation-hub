/**
 * EL CORPUS EXACTO — el filtro que sólo usa el examen.
 *
 * ⚠️ POR QUÉ ESTE FICHERO EXISTE Y NO ES UNA LÍNEA MÁS EN `vectors.ts`:
 * `buildCorpusFilter` responde a la pregunta «¿qué puede ver el producto?» y su
 * respuesta es siempre «el corpus activo, y además esto». Es una AMPLIACIÓN, y
 * está bien que lo sea: es la vía nominal de F-97, con sus tres cláusulas.
 *
 * El examen necesita la pregunta contraria —«¿qué puede ver SÓLO este caso?»— y
 * esa es una RESTRICCIÓN. Son dos criterios distintos, así que viven en dos
 * sitios distintos.
 *
 * ⚠️ LO QUE ESTÁ PROHIBIDO Y LO QUE NO (arquitecto, 26/09/2026). La distinción
 * es la que autorizó abrir la costura, y va escrita para que siga frenando lo
 * que debe y sólo eso:
 *   · PROHIBIDO: que `buildCorpusFilter` —o este filtro— cambie de
 *     comportamiento según quién llame. Un filtro con dos personalidades es el
 *     instrumento dentro de lo que mide.
 *   · PERMITIDO: que el pipeline reciba COMO DATO cuál de los dos usar
 *     (`idsDelCorpusExacto`, elegido en `elegirFiltroDeCorpus` de
 *     `retrieval.ts`). Cada filtro sigue haciendo siempre lo mismo; lo nuevo es
 *     un parámetro opcional que entra por el borde, y ausente es el camino de
 *     siempre.
 *
 * Y una razón de forma que también cuenta: `vectors.ts` está en 401 líneas, ya
 * en el techo de 400 de `CLAUDE.md`.
 *
 * ⚠️ POR QUÉ HACE FALTA, MEDIDO EL 25/09/2026. El protocolo del harness dice
 * («Protocolo_Harness_Tasas.md:831») que «el corpus activo está vacío, así que
 * lo que entra en la tanda ES el corpus de esa ejecución». **Esa premisa está
 * muerta**: el piloto tiene 44 documentos y las mediciones del 21 y el 23/09 se
 * hicieron con CLI-04 y OPE-11 ya `analizado`. La repetibilidad del método viejo
 * no venía del filtro — venía de que la organización estaba vacía.
 *
 * ⚠️ QUIÉN PUEDE USARLO: **sólo el examen.** Lo importan el endpoint del examen y
 * `retrieval.ts`, que es la costura que elige; y quién PASA `idsDelCorpusExacto`
 * lo vigila un segundo censo. Los dos en `corpus-del-examen.test.ts`, con su
 * control positivo: si un camino de usuario aparece en esa lista, rojo.
 */

/**
 * Filtro de metadata de Pinecone que restringe la búsqueda a EXACTAMENTE estos
 * documentos, sin mirar su estado.
 *
 * ⚠️ NO CONTIENE `CORPUS_ACTIVO`, Y ESA AUSENCIA ES LA FUNCIÓN ENTERA. Si
 * alguien la añade «por simetría» con `buildCorpusFilter`, el examen vuelve a
 * medir contra los 44 documentos del piloto y nadie se entera, porque el número
 * de hallazgos seguiría siendo plausible. El caso decisivo de la batería
 * comprueba esa ausencia a propósito.
 *
 * Por lo mismo NO devuelve `$or` con nada: un `$or` es una puerta, y aquí no
 * debe haber puertas.
 */
export function buildCorpusExacto(ids: readonly string[]): object {
  // ⚠️ LA LISTA VACÍA NO ES UN CORPUS VACÍO: ES UNA LLAMADA MAL HECHA, Y SE
  // ROMPE RUIDOSAMENTE. Con `$in: []` Pinecone no devolvería nada, el análisis
  // daría cero candidatos y el informe del examen escribiría «no detectó nada»
  // — que se lee como un fallo de detección cuando es un fallo de montaje.
  // Es la regla del cero sin denominador y la de fallar CERRADO (F-95 P3): un
  // camino que produce un cero indistinguible de un cero real no se deja pasar.
  if (ids.length === 0) {
    throw new Error(
      'buildCorpusExacto: lista de ids vacía. Un examen sin corpus declarado ' +
      'daría cero candidatos, y un cero de montaje no se distingue de un cero ' +
      'de detección.',
    );
  }

  // Copia defensiva: el llamador no puede cambiar el corpus de una pasada ya
  // empezada mutando el array que nos pasó.
  return { documentId: { $in: [...ids] } };
}
