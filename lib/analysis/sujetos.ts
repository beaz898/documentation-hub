/**
 * LOS TRES SUJETOS DE UN ANÁLISIS (F-100 P2/P3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. `analyze-v2` recibía UN `documentId` y con él contestaba a tres
 * preguntas distintas. Coinciden siempre… menos en el reanálisis desde el chat,
 * donde el valor es EL HOMÓNIMO que se va a reemplazar: respuesta correcta a
 * «¿contra quién no compararme?» y FALSA a «¿de quién es este análisis?». El
 * resultado se guardaba con el id del documento viejo — peor que un nulo, porque
 * un nulo no miente (B.163).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LAS TRES PREGUNTAS, con sus nombres, que es la mitad accionable de la regla:
 *
 *   documentoPropietario  ¿de quién es el RESULTADO?      guardar la fila, job.document_id
 *   documentosExcluidos   ¿contra quién NO compararse?    el pipeline, job.exclude_document_id
 *   documentoEnRevision   ¿qué documento estoy revisando? su staged, el veto del
 *                                                         exhaustivo, su generación,
 *                                                         sus chunks, su hash, el
 *                                                         swap y la identidad de
 *                                                         las huellas
 *
 * ⚠️ EL TERCERO EXISTE PORQUE SIN ÉL HEREDA, y lo que hereda decide un borrado.
 * La familia del «documento en revisión» lee el `staged` de un documento, VETA
 * el exhaustivo si lo hay y, en la rama rápida, DISPARA UN SWAP que promociona
 * una versión sobre otra. Sin parámetro propio heredaría al propietario o a la
 * lista de excluidos, y un parámetro heredado por accidente decidiendo una
 * promoción de versiones es exactamente la especie que este frente lleva días
 * retirando.
 *
 * ⚠️ EL CLIENTE NO MANDA LA LISTA DE EXCLUIDOS. Mandaría una lista de ids, que es
 * lo que F-97 prohíbe en su cláusula de ORIGEN. Manda dos REFERENCIAS —qué
 * documento revisa, y a cuál va a sustituir este texto— y el servidor deriva los
 * tres sujetos aquí, en un solo sitio.
 */

/** Lo que llega en la petición. `unknown` a propósito: viene del cliente. */
export interface ReferenciasDelAnalisis {
  /** La bandeja: «reanaliza este documento». */
  documentoEnRevision?: unknown;
  /** El modal desde el chat: «este texto va a sustituir a ése». */
  documentoAReemplazar?: unknown;
}

export interface SujetosDelAnalisis {
  documentoPropietario: string | null;
  documentoEnRevision: string | null;
  documentosExcluidos: string[];
}

function referencia(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio.length > 0 ? limpio : null;
}

/**
 * QUIÉN ES QUIÉN EN ESTE ANÁLISIS.
 *
 * ⚠️ EL PROPIETARIO SALE DE `documentoEnRevision` Y NUNCA DE `documentoAReemplazar`.
 * Solo un documento que YA EXISTE posee su análisis. El texto que va a sustituir
 * a otro todavía no es ningún documento, así que su análisis no es de nadie —
 * y lo será del documento nuevo, en la indexación, con el id puesto en el INSERT
 * (F-100 P1: la fila nace atada o no nace).
 *
 * ⚠️ Y LA LISTA VACÍA ES LA EXCEPCIÓN, NO EL CASO NORMAL: solo el chat con un
 * documento que no está en el índice. Si hay a quién excluir —el que se revisa,
 * el que se va a sustituir— se excluye. Lo que no está indexado no hace falta
 * excluirlo de donde no está, que es por lo que aquel nulo era correcto por la
 * razón equivocada.
 */
export function sujetosDelAnalisis(refs: ReferenciasDelAnalisis): SujetosDelAnalisis {
  const enRevision = referencia(refs.documentoEnRevision);
  const aReemplazar = referencia(refs.documentoAReemplazar);

  const excluidos: string[] = [];
  for (const id of [enRevision, aReemplazar]) {
    if (id !== null && !excluidos.includes(id)) excluidos.push(id);
  }

  return {
    documentoPropietario: enRevision,
    documentoEnRevision: enRevision,
    documentosExcluidos: excluidos,
  };
}

/**
 * EL ÚNICO EXCLUIDO, para los consumidores que todavía reciben uno.
 *
 * ⚠️ ES UN CORTE DECLARADO, NO UN DESCUIDO. El pipeline —`retrieval`,
 * `verify-claims`, `synthesize`, `hash-check`— recibe hoy un `string?`, y pasarlo
 * a lista es otro commit sobre el camino que decide contra qué se compara. Se
 * puede vivir con uno porque **la lista nunca tiene más de un elemento**: las dos
 * referencias son excluyentes por construcción y ningún llamador manda las dos.
 *
 * ⚠️ Y SE CUENTA EN VEZ DE CALLARSE: el día que lleguen dos, esto lo dice a
 * gritos en lugar de tirar el segundo en silencio, que es como un corte
 * declarado se convierte en un fallo.
 */
export function unicoExcluido(sujetos: SujetosDelAnalisis): string | undefined {
  const { documentosExcluidos } = sujetos;
  if (documentosExcluidos.length > 1) {
    console.error(
      `[sujetos] LÍMITE SUPERADO: ${documentosExcluidos.length} documentos a excluir y el ` +
      `pipeline solo acepta uno — se usa el primero y se pierden los demás: ${documentosExcluidos.join(', ')}`,
    );
  }
  return documentosExcluidos[0];
}
