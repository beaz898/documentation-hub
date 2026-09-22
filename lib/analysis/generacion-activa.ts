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
 * ⚠️ QUÉ SIGNIFICA «NO ESTÁ EN EL MAPA» — CAMBIADO EL 22/09/2026 (F-115).
 *
 * Hasta hoy, un documento ausente del mapa CONSERVABA sus fragmentos, con esta
 * razón escrita: «lo que no se sabe no se tira», porque la ausencia podía venir
 * de un fallo de lectura y descartar por desconocimiento convertiría ese fallo
 * en pérdida de candidatos.
 *
 * **La razón era correcta y la premisa ya no lo es.** El mapa lo construye ahora
 * `documentosVivos` (`lib/documents/vivos.ts`), que devuelve
 * `{estado:'no_leido'}` cuando no pudo leer — y entonces el análisis SE PARA,
 * sin llegar aquí. Así que a esta función ya sólo llega un mapa LEÍDO, donde la
 * ausencia significa una sola cosa: **ese documento no tiene fila**. Conservar
 * sus fragmentos era servir un documento borrado, que es F-115.
 *
 * ⚠️ Y LA AUSENCIA SE DESCARTA *Y SE CUENTA*, en las dos funciones y con el mismo
 * predicado. No porque pueda ocurrir —quien llama hace el reparto por fila viva
 * ANTES (`criba-de-matches.ts`), así que aquí no llega ningún ausente— sino para
 * que si algún día llegara, el fragmento no desapareciera sin dejar rastro. Un
 * descarte mal etiquetado se ve; uno silencioso, no.
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
 * `activas` es el mapa `documentId → active_generation` de un mapa YA LEÍDO. Un
 * fragmento se conserva si y sólo si su generación es la activa de su documento.
 */
export function soloGeneracionActiva<T extends FragmentoConGeneracion>(
  fragmentos: readonly T[],
  activas: ReadonlyMap<string, number>,
): T[] {
  return fragmentos.filter(f => esDeLaActiva(f, activas));
}

/** El predicado, UNO, para que las dos funciones no puedan separarse. */
function esDeLaActiva(f: FragmentoConGeneracion, activas: ReadonlyMap<string, number>): boolean {
  const activa = activas.get(f.documentId);
  if (activa === undefined) return false;
  return (f.generation ?? 1) === activa;
}

/**
 * CUÁNTOS SE HAN CAÍDO Y DE QUIÉN, para que la caída no sea muda.
 *
 * ⚠️ ESPERADO CERO EN RÉGIMEN NORMAL. Si esto se mueve, hay vectores de
 * generaciones muertas vivos en el índice — que es exactamente lo que contaminó
 * una medición y nadie vio, porque no había quien lo contara.
 */
export function generacionesMuertas<T extends FragmentoConGeneracion>(
  fragmentos: readonly T[],
  activas: ReadonlyMap<string, number>,
): Map<string, number> {
  const cuenta = new Map<string, number>();
  for (const f of fragmentos) {
    if (esDeLaActiva(f, activas)) continue;
    cuenta.set(f.documentId, (cuenta.get(f.documentId) ?? 0) + 1);
  }
  return cuenta;
}
