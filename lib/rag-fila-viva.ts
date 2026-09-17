/**
 * EL CHAT NO SIRVE LO QUE YA NO TIENE FILA — B.225 (17/09/2026).
 *
 * ⚠️ QUÉ CIERRA: un vector cuyo documento ya no existe en `documents` —un
 * HUÉRFANO— casa en la búsqueda (el filtro del índice mira metadatos, no filas),
 * `fetchFullTexts` no encuentra `full_text` porque no hay fila, y `buildContext`
 * **reconstruía el documento desde los trozos del índice** y lo citaba por su
 * nombre. El chat servía un documento borrado.
 *
 * Esto cierra el CONSUMO, venga el huérfano de donde venga. Y no se enumeran las
 * fábricas: el censo del 17/09 encontró que las cuatro que borran filas intentan
 * borrar antes los vectores, pero tres dan el borrado por bueno con UNA de dos
 * estrategias, y la creación a medias también puede dejarlos. **Ninguna lista de
 * fábricas se puede dar por completa**, y por eso la guarda vive en el lector.
 *
 * ⚠️ LO QUE ACOTA LA URGENCIA: hoy no hay población. El detector de huérfanos
 * midió **uno** el 15/09 y **cero** después, con 762 vectores. No es que esté
 * pasando: es que la vía existe y nadie la vigila. Y ese cero tiene su límite: el
 * detector lee con una sola consulta de tope 10.000 (B.209), fiable hoy y ciega
 * sin avisar el día que el índice pase de ahí.
 *
 * ⚠️ «SIN FULL_TEXT» NO ES «SIN FILA», y es la distinción que hace esto posible:
 * un documento antiguo tiene fila y le falta `full_text` —ése se sigue
 * reconstruyendo desde los trozos, como siempre—; un huérfano no tiene fila.
 */

/**
 * Qué documentos pueden entrar al contexto.
 *
 * `conFila` es el conjunto de ids que la consulta a `documents` devolvió.
 * ⚠️ `null` significa QUE LA CONSULTA FALLÓ, no que no haya filas: entonces no se
 * sabe cuáles están vivos y **se deja pasar todo, como hasta hoy**. Fallar
 * cerrado —responder sin esas fuentes mientras la base no conteste— es una
 * decisión de producto pendiente del director, y no se toma aquí.
 */
export function documentosConFilaViva<T extends { documentId: string }>(
  documentos: T[],
  conFila: ReadonlySet<string> | null,
): { vivos: T[]; sinFila: T[] } {
  if (conFila === null) return { vivos: [...documentos], sinFila: [] };
  const vivos: T[] = [];
  const sinFila: T[] = [];
  for (const d of documentos) {
    (conFila.has(d.documentId) ? vivos : sinFila).push(d);
  }
  return { vivos, sinFila };
}
