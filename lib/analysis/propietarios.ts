/**
 * ¿TIENE ESTE ANÁLISIS UN PROPIETARIO? (F-101 P1)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA LEY, en su forma final tras cuatro consultas: **ninguna escritura durable
 * sin propietario verdadero.** Lo que costó encontrar no fue la ley sino el
 * propietario: se leyó «propietario» como «documento» y el camino del chat tenía
 * uno desde el primer segundo — EL FICHERO SUBIDO, que es durable, tiene ruta
 * única y existe antes que nadie.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DOS PROPIETARIOS QUE NO SON ALTERNATIVAS, SON ETAPAS:
 *   · `storagePath` — el PRIMARIO. Dueño mientras se revisa.
 *   · `documentId`  — el ADOPTIVO. Nulo durante la revisión; se rellena cuando
 *     el documento nace y adopta su análisis.
 *
 * ⚠️ ESTO ES UN ESPEJO DE UNA RESTRICCIÓN DE LA BASE, y por eso existe: el
 * `CHECK analysis_results_tiene_propietario` ya impide la fila sin dueño, así que
 * esta función NO es la que protege — la base lo hace mejor, porque impide en vez
 * de avisar. Lo que esta función aporta es que el fallo se vea DONDE SE ORIGINA:
 * sin ella, un análisis sin propietario llegaría a la base y volvería como un
 * error de restricción críptico, con el nombre de un `CHECK` en vez del nombre
 * del camino que se olvidó de pasar la ruta.
 * Es F-96 P3: dos sistemas que deben coincidir necesitan un punto que compruebe
 * que coinciden.
 */

export interface Propietarios {
  storagePath?: string | null;
  documentId?: string | null;
}

export interface PropietariosDecididos {
  storagePath: string | null;
  documentId: string | null;
  /** `false` si no hay ninguno: la fila NO debe intentarse. */
  tienePropietario: boolean;
}

function limpio(valor: string | null | undefined): string | null {
  if (typeof valor !== 'string') return null;
  const v = valor.trim();
  return v.length > 0 ? v : null;
}

/**
 * NORMALIZA LOS DOS Y DICE SI HAY DUEÑO.
 *
 * ⚠️ LA CADENA VACÍA NO ES UN PROPIETARIO. Si se dejara pasar, satisfaría el
 * `CHECK` de la base —una cadena vacía no es NULL— y tendríamos filas que la
 * restricción da por buenas y que no apuntan a ningún sitio: exactamente el
 * huérfano que la restricción existe para impedir, colado por la puerta de un
 * tipo. Aquí se convierte a NULL antes de que llegue.
 */
export function propietariosDelAnalisis(entrada: Propietarios): PropietariosDecididos {
  const storagePath = limpio(entrada.storagePath);
  const documentId = limpio(entrada.documentId);
  return {
    storagePath,
    documentId,
    tienePropietario: storagePath !== null || documentId !== null,
  };
}
