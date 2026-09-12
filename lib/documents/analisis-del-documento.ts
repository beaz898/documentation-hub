/**
 * EL CRITERIO DE QUÉ ANÁLISIS SON DE UN DOCUMENTO (B.112).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. `analysis_results` no se borraba NUNCA al borrar un documento —
 * era una decisión escrita y razonada («son memoria de la organización»)—, y la
 * bandeja empareja los análisis de subida POR NOMBRE, porque nacen sin id. Las
 * dos cosas juntas dan B.112: se borra un documento, se sube otro con el mismo
 * nombre, y el nuevo HEREDA el análisis del viejo. Al usuario se le enseña, con
 * sus contradicciones y sus contadores, un análisis que no es de su documento.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ EL CRITERIO VIVE AQUÍ Y NO EN EL BORRADO, y no es por gusto: dentro de
 * `deleteDocument` no había forma de ponerlo a prueba, siendo la condición de
 * una operación destructiva. Es el mismo movimiento que `vectoresARetirar` en
 * `plan-de-reemplazo.ts` y que `CORPUS_ACTIVO` en `pinecone/vectors.ts`.
 *
 * ⚠️ Y ES UN OBJETO, NO UNA FUNCIÓN QUE FILTRA UNA LISTA. La tentación era
 * exportar `analisisABorrar(filas, id)` porque se prueba muy cómodo — y sería un
 * DOBLE DE LABORATORIO: el borrado real no filtra ninguna lista en memoria, le
 * pasa un criterio a Supabase. Probar el filtro de mentira mientras corre el
 * criterio de verdad es verificar el productor y no la funcionalidad. Lo que se
 * exporta es el objeto que VIAJA A LA BASE, y `casaConElCriterio` simula lo que
 * `.match()` hace con él, para poder enfrentarlo a filas reales.
 */

/** Las columnas de `analysis_results` que hacen falta para decidir. */
export interface FilaDeAnalisis {
  org_id: string;
  document_id: string | null;
  document_name: string;
}

/**
 * QUÉ ANÁLISIS SON DE ESTE DOCUMENTO. Por `document_id` y `org_id`, y por nada
 * más.
 *
 * ⚠️ NO LLEVA `document_name`, Y ÉSA ES LA PROPIEDAD DEL COMMIT. Con el nombre
 * dentro, borrar un documento se llevaría por delante los análisis de todos sus
 * HOMÓNIMOS —documentos vivos, ajenos, que no se están borrando—. El nombre no
 * identifica: colisiona.
 *
 * ⚠️ Y DEJA VIVO EL PARQUE VIEJO A PROPÓSITO. Los análisis anteriores nacieron
 * con `document_id = null` —el documento no existía cuando se guardaron— y este
 * criterio no los alcanza. NO SE INTENTA ADIVINARLOS POR NOMBRE: adivinar en una
 * operación destructiva es cómo se borra lo que no se quería borrar. Esas filas
 * se limpian aparte, en SQL, mirándolas antes de tocarlas.
 */
export function criterioDeAnalisisDelDocumento(
  orgId: string,
  documentId: string,
): Record<string, string> {
  return { org_id: orgId, document_id: documentId };
}

/**
 * ¿ALCANZA EL CRITERIO A ESTA FILA? Simula lo que `.match()` hace en la base:
 * TODAS las claves del criterio tienen que casar, no alguna.
 *
 * Existe para poder enfrentar el criterio de verdad a filas de verdad en los
 * casos. No la llama el borrado — el borrado se lo da a Supabase.
 */
export function casaConElCriterio(
  criterio: Record<string, string>,
  fila: FilaDeAnalisis,
): boolean {
  const valores: Record<string, string | null> = {
    org_id: fila.org_id,
    document_id: fila.document_id,
    document_name: fila.document_name,
  };
  return Object.entries(criterio).every(([clave, valor]) => valores[clave] === valor);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * B.212 — LA OTRA MITAD DE B.112, Y LLEVABA AQUÍ TODO EL TIEMPO.
 *
 * B.112 escribió el criterio de arriba porque **la bandeja empareja por
 * NOMBRE** —está en la primera línea de este fichero— y lo aplicó al BORRADO.
 * La bandeja se quedó como estaba. El criterio existía, estaba probado, y su
 * único consumidor era `delete-document.ts`: la pantalla que lo necesitaba
 * nunca le preguntó.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LA POBLACIÓN, MEDIDA CONTRA PRODUCCIÓN EL 11/09/2026 — no deducida: **once
 * filas** en las que la bandeja enseñaba el análisis de un fichero suelto en vez
 * del del documento, sobre **tres documentos** —`OPE-02_agenda-y-gestion-de-citas.xlsx`
 * (cinco), `OPE-13_cobertura-por-clinica.xlsx` (cuatro) y
 * `OPE-10_tarifario-tratamientos-2026.xlsx` (dos)—, la más reciente del
 * **10/09/2026**. Con sus contradicciones y sus recuentos, presentados como del
 * documento.
 *
 * ⚠️ Y UN CASO QUE NO NECESITA NINGÚN HUÉRFANO, que es el que enseña que el
 * nombre nunca fue una identidad: **dos documentos INDEXADOS que compartan
 * nombre reciben el mismo bloque**, el más reciente de los dos. Subir a Drive un
 * fichero que ya tienes como manual crea exactamente eso — no lo convierte,
 * añade un segundo documento— y entonces el análisis de uno se pinta en la fila
 * del otro sin que intervenga nada roto.
 *
 * ⚠️ LO QUE ESTO NO ARREGLA, y se dice aquí para que no se lea como resuelto: que
 * el análisis sea del documento **no lo hace reciente**. Un documento analizado
 * el día 1 que vuelve a la bandeja el día 79 trae su propio informe, hecho contra
 * un corpus que ya no existe, y esta función lo devuelve igual. Si algún día hace
 * falta distinguirlo, **los datos ya están guardados**: `created_at` da la fecha,
 * `analysis_results.involved_documents` guarda CONTRA QUÉ documentos se comparó
 * —la foto del corpus de ese momento, no un recuento— y `documents.content_hash`
 * dice si el documento cambió desde entonces. No hace falta columna nueva.
 */
/**
 * LOS DOS BLOQUES DE UNA FILA DE LA BANDEJA, Y DE QUÉ FUENTE SALE CADA UNO.
 *
 * ⚠️ EXISTE PARA QUE SE PUEDAN MATAR POR SEPARADO. Son dos preguntas distintas
 * con dos identidades distintas, y la tentación de fundirlas es permanente:
 *   · `propio`  — el análisis DEL DOCUMENTO, por `document_id`.
 *   · `staged`  — el análisis de la VERSIÓN NUEVA en vuelo, por el **id exacto**
 *                 que el propio `document_staged` apunta (`analysis_result_id`).
 *
 * ⚠️ LA VERSIÓN STAGED NUNCA SE BUSCA POR DOCUMENTO. Un documento con versión
 * nueva tiene DOS análisis vivos —el de lo que hay publicado y el de lo que
 * espera— y el único que sabe cuál es cuál es el puntero. Buscar el del staged
 * por `document_id` devolvería el más reciente de los dos, que es una moneda al
 * aire.
 *
 * Con esto, vaciar la fuente del staged mata unos casos y volver a emparejar lo
 * propio por nombre mata otros: era la razón de extraerlo.
 */
export function bloquesDeLaFila<T>(
  documentId: string,
  propioPorDocumento: ReadonlyMap<string, T>,
  punteroDelStaged: string | null,
  apuntadosPorId: ReadonlyMap<string, T>,
): { propio: T | undefined; staged: T | undefined } {
  return {
    propio: propioPorDocumento.get(documentId),
    staged: punteroDelStaged ? apuntadosPorId.get(punteroDelStaged) : undefined,
  };
}

export function analisisMasRecientePorDocumento<
  T extends FilaDeAnalisis & { created_at: string },
>(
  orgId: string,
  documentIds: readonly string[],
  filas: readonly T[],
): Map<string, T> {
  const porDocumento = new Map<string, T>();

  for (const documentId of documentIds) {
    // ⚠️ SE LE PREGUNTA AL CRITERIO, no se recalcula aquí. Escribir
    // `f.document_id === documentId` sería la segunda implementación de «qué
    // análisis son de este documento», y el día que una cambie la otra seguirá
    // pareciendo correcta por su cuenta.
    const criterio = criterioDeAnalisisDelDocumento(orgId, documentId);
    for (const fila of filas) {
      if (!casaConElCriterio(criterio, fila)) continue;
      const actual = porDocumento.get(documentId);
      if (!actual || fila.created_at > actual.created_at) {
        porDocumento.set(documentId, fila);
      }
    }
  }

  return porDocumento;
}
