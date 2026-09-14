/**
 * EL NOMBRE DE UNA COPIA CORREGIDA, Y QUÉ HOMÓNIMO LE CORRESPONDE — B.218.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA, Y ES LA CAUSA Y NO EL SÍNTOMA. Hasta el 14/09/2026 el nombre final
 * se componía en `useIndexing` y el homónimo se buscaba en `useDocuments`: **dos
 * cálculos que se creían el mismo y no lo eran**. El diálogo de reemplazo
 * preguntaba por `X.txt` y el servidor chocaba contra
 * `X.txt (corregido 14/09/2026)`, así que para el documento que de verdad iba a
 * chocar el diálogo NO PODÍA SALIR.
 *
 * Un criterio se implementa UNA VEZ y quien lo necesita PREGUNTA. Aquí había dos
 * implementaciones de «cómo se llama esto», y se separaron sin que nadie lo
 * decidiera.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Lo mínimo que hace falta de cada documento para decidir. Deliberadamente NO
 *  es la fila entera: con ella a mano, alguien acabaría mirando otra columna y
 *  la pregunta cambiaría sin que nadie lo decidiera. */
export interface DocumentoHomonimo {
  id: string;
  name: string;
}

/**
 * `"informe.txt"` + 14/09/2026 → `"informe.txt (corregido 14/09/2026)"`.
 *
 * ⚠️ LA FECHA VA SIN HORA, Y ESO NO ES UN DESCUIDO QUE ESTE MÓDULO ARREGLE: es lo
 * que hace que **el segundo guardado del mismo día produzca el mismo nombre**, que
 * es la población entera de B.218. Se conserva tal cual —mismo formato, misma
 * localización— porque cambiarlo renombraría de hecho a los documentos ya
 * guardados: el nombre que compone esta función tiene que seguir casando con el
 * de los que están en la base.
 *
 * ⚠️ Y EL NOMBRE ORIGINAL ENTRA ENTERO, extensión incluida. No se le quita nada:
 * el servidor decide con el nombre original —no con éste— si el documento
 * producía tablas, precisamente porque aquí la extensión deja de ser la última.
 */
export function nombreDeLaCopiaCorregida(fileName: string, fecha: Date): string {
  const dia = fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${fileName} (corregido ${dia})`;
}

/**
 * ¿CONTRA QUÉ DOCUMENTO SE OFRECE REEMPLAZAR? — la decisión (c), 14/09/2026.
 *
 * Se miran LOS DOS nombres: la copia corregida de hoy y el original. Si existe la
 * corregida, se ofrece ésa; si no, el original.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ ESTO DECIDE POR EL USUARIO CUANDO EXISTEN LOS DOS, Y ES UNA DECISIÓN
 * TOMADA, NO UN DESCUIDO. Con una copia corregida de hoy y el original en el
 * corpus, desde el chat sólo se puede reemplazar la corregida. Quien quiera
 * reemplazar el ORIGINAL en esa situación tiene que abrirlo **desde la bandeja**,
 * donde el diálogo sale siempre y contra el documento que se está revisando.
 *
 * Es lo que habría cubierto preguntar cuál de los dos —un diálogo con dos
 * destinos— y se ha dejado fuera a sabiendas: el caso medido es el segundo
 * guardado del día, y la elección entre dos destinos cuesta media pantalla para
 * un caso que tiene salida por otro sitio. El día que esa salida no baste, esto
 * es lo que hay que ampliar.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ EL FILTRO DE LO REEMPLAZABLE ENTRA COMO PARÁMETRO Y NO SE APLICA FUERA. Si
 * el llamador filtrara la lista antes, este criterio contestaría sobre un
 * conjunto que no controla — y el filtro que importa (un documento con original
 * en la nube NO se puede reemplazar aquí) quedaría a un descuido de distancia.
 */
export function homonimoParaReemplazar<T extends DocumentoHomonimo>(
  documentos: readonly T[],
  fileName: string,
  fecha: Date,
  esReemplazable: (doc: T) => boolean,
): T | null {
  const corregido = nombreDeLaCopiaCorregida(fileName, fecha);
  const buscar = (nombre: string) =>
    documentos.find(d => d.name === nombre && esReemplazable(d)) ?? null;

  return buscar(corregido) ?? buscar(fileName);
}
