/**
 * SOLO LA GENERACIÓN QUE EL DOCUMENTO SIRVE (F-102 P1/P2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LA SEGUNDA CAPA. La primera —que las generaciones viejas no se queden— la
 * hacen los borrados de cada camino de reemplazo, y todos llaman al suyo. Ésta
 * es la otra: **que no SE VEAN si se quedan.**
 *
 * Hoy no existe. `CORPUS_ACTIVO` filtra por `analysisStatus` y NADA MÁS: el
 * retrieval lee la generación de la metadata y la arrastra, pero jamás filtra
 * por ella. Así que cualquier vector de una generación anterior que sobreviva
 * —porque su borrado falló, o porque el camino lo deja vivo a propósito— entra
 * en la recuperación como si fuera el contenido actual.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y NO ES HIPOTÉTICO: en el swap de Drive, entre P1 —que voltea la generación
 * nueva a `analizado`— y P3 —que borra la vieja—, LAS DOS SON `analizado` A LA
 * VEZ. Hoy eso está escrito como «error benigno aceptado»; con este filtro deja
 * de ser una ventana, porque la vieja ya no es la activa en el momento en que la
 * fila se conmuta.
 *
 * ⚠️ POR QUÉ NO VA EN EL FILTRO DE PINECONE: porque la generación activa es un
 * dato POR DOCUMENTO que vive en Supabase, y un filtro de metadata no puede
 * consultarlo. Se resuelve después de recuperar, que es donde se sabe de qué
 * documentos estamos hablando.
 *
 * ⚠️ Y LO QUE NO SE SABE NO SE TIRA: si un documento no está en el mapa —porque
 * la consulta no lo trajo, o porque la fila ya no existe— sus fragmentos se
 * CONSERVAN. Descartar por desconocimiento convertiría un fallo de lectura en
 * pérdida de candidatos, que es la forma que este proyecto lleva días
 * retirando: la ausencia de dato no es dato.
 */

export interface FragmentoConGeneracion {
  documentId: string;
  /** AUSENTE = generación 1 implícita, igual que en `parseVectorId` y que en la
   *  lectura de la metadata: hay vectores anteriores a C.4b que no la llevan, y
   *  tratarlos como `undefined` los sacaría del corpus por no tener un campo que
   *  nunca tuvieron. */
  generation?: number;
}

/**
 * QUÉ FRAGMENTOS SIRVE HOY CADA DOCUMENTO.
 *
 * `activas` es el mapa `documentId → active_generation`. Un fragmento se
 * conserva si su generación es la activa de su documento, o si de ese documento
 * no sabemos nada.
 */
export function soloGeneracionActiva<T extends FragmentoConGeneracion>(
  fragmentos: T[],
  activas: Map<string, number>,
): T[] {
  return fragmentos.filter(f => {
    const activa = activas.get(f.documentId);
    if (activa === undefined) return true;
    return (f.generation ?? 1) === activa;
  });
}

/**
 * CUÁNTOS SE HAN CAÍDO Y DE QUIÉN, para que la caída no sea muda.
 *
 * ⚠️ ESPERADO CERO EN RÉGIMEN NORMAL. Si esto se mueve, hay vectores de
 * generaciones muertas vivos en el índice — que es exactamente lo que contaminó
 * una medición y nadie vio, porque no había quien lo contara.
 */
export function generacionesMuertas<T extends FragmentoConGeneracion>(
  fragmentos: T[],
  activas: Map<string, number>,
): Map<string, number> {
  const cuenta = new Map<string, number>();
  for (const f of fragmentos) {
    const activa = activas.get(f.documentId);
    if (activa === undefined || (f.generation ?? 1) === activa) continue;
    cuenta.set(f.documentId, (cuenta.get(f.documentId) ?? 0) + 1);
  }
  return cuenta;
}
