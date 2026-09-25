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
 * sitios distintos: meterle un modo al filtro del producto para que el examen
 * quepa sería poner el instrumento de medida dentro de lo que mide.
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
 * ⚠️ QUIÉN PUEDE USARLO: **sólo el endpoint del examen.** Ni un solo camino de
 * usuario. No es una promesa: lo vigila un censo de importadores en
 * `corpus-del-examen.test.ts`, con su control positivo.
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
