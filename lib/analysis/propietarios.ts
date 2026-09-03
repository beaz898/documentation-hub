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

/** Lo mínimo que hace falta de una fila de `analysis_jobs` para saber de quién
 *  será su análisis. */
export interface FilaDeJob {
  storage_path?: string | null;
  document_id?: string | null;
}

/**
 * DE QUIÉN SERÁ EL ANÁLISIS QUE PRODUZCA ESTE TRABAJO.
 *
 * ⚠️ EXISTE PARA QUE EL WORKER NO DECIDA POR SU CUENTA. El exhaustivo se escribe
 * en OTRO PROCESO, y hasta hoy ese proceso resolvía el propietario solo —
 * `documentId: job.document_id ?? undefined`— que para un job del chat es NULO, y
 * ahí nacían los dieciséis análisis pagados sin dueño. El criterio de quién es el
 * propietario se implementa una vez, y el worker pregunta.
 *
 * ⚠️ Y UN JOB DE LA BANDEJA NO TIENE RUTA, legítimamente: su documento ya existe
 * y es su dueño. Que falte la ruta no es un fallo — lo que sería un fallo es que
 * faltaran las dos, y de eso se encarga la comprobación de arriba.
 */
export function propietariosDelJob(job: FilaDeJob): PropietariosDecididos {
  return propietariosDelAnalisis({
    storagePath: job.storage_path,
    documentId: job.document_id,
  });
}
