import type { DriveFile } from './types';

/**
 * LA GUARDA DEL LISTADO — «un listado que falló no es un listado vacío».
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ EVITA, y no es hipotético: hasta el 01/09/2026 un error TRANSITORIO del
 * proveedor —un 429, un 500 de un segundo— borraba el corpus de Drive ENTERO de
 * la organización. Vectores, filas y análisis, y sin lápida.
 *
 * La cadena era ésta, y cada eslabón era razonable por su cuenta:
 *   1. `listFilesRecursive` devolvía `[]` ante cualquier respuesta no-2xx, sin
 *      lanzar y sin reintentar (google.ts) — o hacía `break` y devolvía lo
 *      acumulado (onedrive.ts);
 *   2. la ruta no tenía guarda de listado vacío;
 *   3. doce líneas más abajo, `docsToDelete` = todo lo que no esté en el
 *      listado → TODO;
 *   4. `deleteDocument(..., reason: 'remote_deleted')`.
 *
 * ⚠️ Y EL MISMO RAZONAMIENTO ESTABA RESUELTO BIEN A DOCE LÍNEAS: la lectura
 * equivalente contra Supabase (sync/route.ts, `existingError`) aborta, con la
 * razón escrita — «sin la lista de documentos existentes el sync trataria todo
 * el corpus como nuevo […] Abortar es la unica opcion segura». Mismo
 * razonamiento, misma consecuencia, y en el proveedor externo se hacía lo
 * contrario. Alguien pensó el caso para una de las dos lecturas.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LA CAUSA RAÍZ ERA EL TIPO. `listFiles(): Promise<DriveFile[]>` no tenía sitio
 * para «falló», así que las dos implementaciones acabaron aplastando el fallo
 * contra la lista vacía — que es la única forma que el tipo les dejaba de
 * volver. Por eso el arreglo empieza aquí, en el tipo, y no en un `if`.
 *
 * ⚠️ Y NO BASTA CON MIRAR SI LA LISTA ESTÁ VACÍA: el peligro es el listado
 * PARCIAL. No hace falta que falle la primera llamada — en Google el fallo de
 * una SUBCARPETA devolvía `[]` en ese nivel y el padre seguía; en OneDrive, que
 * pagina, un fallo en la página 3 de 5 devolvía las dos primeras. En los dos
 * casos la lista llega con contenido y le faltan ficheros, y a esos ficheros se
 * les borra. Por eso el predicado no es «vacío» sino «INCOMPLETO»: cualquier
 * fallo en cualquier nivel o página invalida la lista entera a efectos de
 * borrado.
 */

/**
 * El resultado de listar, con el fallo dentro del tipo.
 *
 * `ok: true` con `archivos: []` es una carpeta VACÍA DE VERDAD, y es un caso
 * legítimo distinto del fallo — ver `decidirSincronizacion`.
 */
export type ResultadoDelListado =
  | { ok: true; archivos: DriveFile[] }
  | { ok: false; motivo: string };

/** Lo mínimo que hace falta de una fila de `documents` para decidir. */
export interface DocumentoSincronizado {
  provider_file_id: string;
}

export type DecisionDeSincronizacion<T extends DocumentoSincronizado> =
  | { aborta: true; motivo: string }
  | { aborta: false; archivos: DriveFile[]; borrar: T[] };

/**
 * QUÉ HACER CON UN LISTADO. Es el único sitio donde se decide, y por eso la
 * ruta no vuelve a cruzar ids por su cuenta: quien necesita saber qué se borra
 * lo PREGUNTA aquí (CLAUDE.md, F-89 P2). Mantener además el `seenDriveIds` de
 * la ruta habría sido la segunda implementación del mismo criterio.
 *
 * · LISTADO FALLIDO → ABORTA. Cero borrados y cero indexaciones, que es el
 *   mismo criterio que la ruta ya aplicaba a la lectura de Supabase. Y no
 *   devuelve `borrar: []`: devuelve una forma en la que **no existe** la lista
 *   de borrado, para que no se pueda seguir por descuido.
 *
 * · LISTADO VACÍO DE VERDAD → BORRA, y es deliberado. Vaciar la carpeta es la
 *   forma que tiene el usuario de quitar documentos del corpus, y es lo que la
 *   sincronización hace desde siempre. Cambiarlo aquí arreglaría un fallo
 *   inventando otro. Lo que se gana es que ya NO se llega a este caso por un
 *   500 del proveedor.
 *
 * · LISTADO BUENO → borra exactamente lo que ya no está, ni uno más.
 */
export function decidirSincronizacion<T extends DocumentoSincronizado>(
  listado: ResultadoDelListado,
  existentes: T[],
): DecisionDeSincronizacion<T> {
  if (!listado.ok) {
    return { aborta: true, motivo: listado.motivo };
  }

  const vistos = new Set(listado.archivos.map(f => f.id));
  return {
    aborta: false,
    archivos: listado.archivos,
    borrar: existentes.filter(d => !vistos.has(d.provider_file_id)),
  };
}
