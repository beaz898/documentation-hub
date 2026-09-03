/**
 * LA ADOPCIÓN: EL DOCUMENTO SE QUEDA CON EL ANÁLISIS DE SU FICHERO (F-101 P1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA SEGUNDA MITAD. El análisis del chat nace colgado del FICHERO, que es su
 * propietario mientras se revisa. Cuando el usuario decide indexar, el documento
 * nace — y adopta el análisis que ya existía. Los dos propietarios conviven: son
 * ETAPAS, no alternativas, y por eso la ruta NO SE BORRA al adoptar (es la
 * historia de ese fichero y lo que permite reabrir su revisión).
 *
 * ⚠️ Y ESTE `UPDATE` SÍ ES LEGÍTIMO, aunque F-100 prohibiera «persistir antes y
 * actualizar después»: aquello añadía identidad a lo que NO TENÍA NINGUNA — el
 * mecanismo fantasma en el que se creyó dos consultas seguidas. Esto añade un
 * SEGUNDO dueño a lo que siempre tuvo uno. La diferencia no es de forma: es que
 * si el `UPDATE` no llega nunca, aquí no queda ningún huérfano.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface CriterioDeAdopcion {
  org_id: string;
  storage_path: string;
}

/**
 * QUÉ ANÁLISIS ADOPTA ESTE DOCUMENTO, o ninguno.
 *
 * ⚠️ DEVUELVE `null` SI NO HAY RUTA, Y ES LA GUARDA QUE MÁS IMPORTA DEL MÓDULO.
 * Sin ella, una ruta vacía dejaría un criterio que alcanza a **TODOS los
 * análisis huérfanos de la organización** y se los colgaría a un documento
 * cualquiera. Es la misma forma que la fuga del origen y que el borrado por
 * nombre: **una condición que al quedarse vacía AMPLÍA en vez de restringir.**
 * Por eso vive aquí con su caso, y no como un `if` dentro de la ruta.
 *
 * ⚠️ Y NO INCLUYE `document_id IS NULL` porque eso no se puede expresar en un
 * criterio de igualdad — lo pone quien ejecuta, con `.is('document_id', null)`, y
 * su razón va escrita allí: sin esa condición, reindexar un fichero reasignaría
 * análisis que ya pertenecen a otro documento.
 */
export function criterioDeAdopcion(
  orgId: string,
  storagePath: string | null | undefined,
): CriterioDeAdopcion | null {
  if (typeof orgId !== 'string' || orgId.trim().length === 0) return null;
  if (typeof storagePath !== 'string') return null;
  const ruta = storagePath.trim();
  if (ruta.length === 0) return null;
  return { org_id: orgId, storage_path: ruta };
}

/** ¿Alcanza este criterio a esta fila? Simula lo que `.match()` hace en la base,
 *  para poder enfrentar el criterio de verdad a filas de verdad. */
export function casaConLaAdopcion(
  criterio: CriterioDeAdopcion,
  fila: { org_id: string; storage_path: string | null; document_id: string | null },
): boolean {
  if (fila.document_id !== null) return false;
  return fila.org_id === criterio.org_id && fila.storage_path === criterio.storage_path;
}
