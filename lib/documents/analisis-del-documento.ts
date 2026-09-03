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
