import { parseVectorId } from '@/lib/pinecone/vectors';

/**
 * EL PLAN DE UN REEMPLAZO MANUAL — crear, conmutar, borrar (frente 3, paso 1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. Hasta hoy `ingest` reemplazaba así: borrar los vectores viejos →
 * borrar la fila vieja → generar los embeddings del nuevo → subirlos → insertar
 * la fila nueva. Entre el primer borrado y el último insert la organización no
 * tenía NINGUNA de las dos versiones, y si algo fallaba en medio se quedaba sin
 * las dos (B.140).
 *
 * Y era peor que eso (B.152): el borrado del viejo va por dos vías y basta con
 * que UNA funcione para continuar, así que podían sobrevivir vectores en
 * Pinecone DESPUÉS de borrar la fila — un documento fantasma que sigue
 * respondiendo en el chat, invisible en la interfaz y que ninguna sincronización
 * recupera.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LA INVERSIÓN: se crea la generación nueva, se conmuta la fila, y SOLO ENTONCES
 * se borra la vieja. Con ese orden la ventana no se estrecha, DEJA DE EXISTIR —
 * en todo momento hay una versión servible, y si el proceso muere a mitad sobra
 * basura y no falta nada.
 * De regalo, los hasta 30 s de reintentos de embeddings pasan a ocurrir ANTES de
 * tocar nada viejo, donde alargar es gratis: el retry deja de ser un agravante.
 *
 * ⚠️ `swapDocumentVectors` ES LA GUÍA, NO LA FUNCIÓN. No se llama desde aquí, y
 * conviene decir por qué para que nadie la busque esperando reutilizarla:
 *   · CONMUTA CONTENIDO DENTRO DE UNA FILA que ya existe, leyéndolo de
 *     `document_staged`. Aquí hay que conmutar ENTRE DOS FILAS —la vieja y el
 *     contenido nuevo, que está en memoria— y no hay staged que leer.
 *   · SU MARCADOR RESUELVE UN PROBLEMA QUE ESTE CAMINO NO TIENE: `staged` existe
 *     porque en Drive escribir y aprobar son DOS PETICIONES separadas por el
 *     tiempo que el usuario tarde en decidir, y el marcador es lo que hace el
 *     swap re-ejecutable entre ellas. En `ingest` todo ocurre dentro de la misma
 *     petición: no hay espera, luego no hay nada que marcar.
 *   · Y SU P2 MARCA `analizado` INCONDICIONALMENTE, porque se invoca desde la
 *     bandeja sobre algo recién validado. Un reemplazo manual puede llegar con
 *     `pendiente` —cuando el análisis previo falló— y usarlo tal cual marcaría
 *     como analizado un documento que nadie analizó.
 * LO QUE SÍ SE HEREDA es su doctrina: crear, conmutar, borrar; corte secuencial;
 * y el sesgo de fallo declarado.
 */

/** Lo que hace falta saber de un documento que ya está en el corpus para poder
 *  versionarlo o retirarlo. */
export interface DocumentoExistente {
  id: string;
  /** `null` en filas anteriores a C.4: se lee como 1. */
  active_generation?: number | null;
  chunk_count?: number | null;
  created_at?: string | null;
}

/** Una versión que hay que retirar: sus vectores se localizan por id, y para
 *  construirlos hacen falta las dos cosas. */
export interface VersionARetirar {
  documentId: string;
  generacion: number;
  chunkCount: number;
}

export type PlanDeReemplazo =
  | {
      /** Alta normal: no hay nada que reemplazar ni que retirar. */
      tipo: 'alta';
      generacion: 1;
    }
  | {
      tipo: 'reemplazo';
      /** El id que se REUTILIZA: el documento reemplazado no cambia de
       *  identidad, gana una generación. Es lo que permite conmutar en vez de
       *  borrar-y-crear, y de paso lo que hace que sobrevivan al reemplazo los
       *  análisis guardados y los descartes que cuelgan de ese id. */
      documentId: string;
      /** La generación nueva: la activa del viejo + 1. */
      generacion: number;
      /** Los HOMÓNIMOS que no se versionan. Se siguen borrando enteros —fila y
       *  vectores—, que es lo que hace hoy este camino, pero AL FINAL. */
      sobrantes: VersionARetirar[];
    };

/**
 * QUÉ HACER CON LO QUE HAY: alta o reemplazo, y con qué generación.
 *
 * ⚠️ SE VERSIONA EL MÁS RECIENTE Y LOS DEMÁS SE BORRAN AL FINAL. `manualCollisions`
 * es un ARRAY —no hay unicidad por `(org_id, name)`, así que puede haber
 * homónimos— y hoy el camino los borra TODOS y crea uno.
 * Conservar ese borrado es deliberado: dejar de hacerlo dejaría duplicados donde
 * hoy se limpian, y eso es una decisión de producto que este commit no debe
 * tomar de paso. Lo que sí cambia es CUÁNDO — salen de la ventana peligrosa al
 * final, cuando ya hay una versión nueva servida.
 *
 * El criterio de cuál se versiona es `created_at` descendente: el mismo orden en
 * el que la lista de documentos los enseña (`app/api/documents/route.ts:29`), o
 * sea el que el usuario tenía delante al aceptar el reemplazo.
 */
export function planDeReemplazo(colisiones: DocumentoExistente[]): PlanDeReemplazo {
  if (colisiones.length === 0) return { tipo: 'alta', generacion: 1 };

  const ordenados = [...colisiones].sort(
    (a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  );
  const [elegido, ...sobrantes] = ordenados;

  return {
    tipo: 'reemplazo',
    documentId: elegido.id,
    generacion: generacionDe(elegido) + 1,
    sobrantes: sobrantes.map(versionARetirar),
  };
}

/**
 * LA VERSIÓN VIEJA DEL DOCUMENTO QUE SE VERSIONA, para poder retirar sus
 * vectores DESPUÉS de que la fila ya sirva la nueva.
 *
 * Va aparte de `sobrantes` porque el borrado es de otra clase: del sobrante se
 * borra TODO —fila incluida—; de éste solo la generación anterior, porque la
 * fila es la misma que ahora sirve la nueva.
 */
export function versionAnterior(plan: PlanDeReemplazo, colisiones: DocumentoExistente[]): VersionARetirar | null {
  if (plan.tipo !== 'reemplazo') return null;
  const elegido = colisiones.find(d => d.id === plan.documentId);
  return elegido ? versionARetirar(elegido) : null;
}

function generacionDe(d: DocumentoExistente): number {
  const g = d.active_generation;
  return typeof g === 'number' && Number.isFinite(g) && g >= 1 ? g : 1;
}

function versionARetirar(d: DocumentoExistente): VersionARetirar {
  return {
    documentId: d.id,
    generacion: generacionDe(d),
    chunkCount: typeof d.chunk_count === 'number' && d.chunk_count > 0 ? d.chunk_count : 0,
  };
}

/**
 * QUÉ VECTORES SE RETIRAN DESPUÉS DE CONMUTAR: los de las generaciones
 * ANTERIORES a la recién subida, leyendo la generación DEL ID.
 *
 * ⚠️ ESTRICTAMENTE MENOR, Y ES LA COMPARACIÓN QUE SOSTIENE EL COMMIT ENTERO: la
 * generación recién subida es `generacionNueva`, y si entrara en esta lista el
 * reemplazo borraría lo que acaba de crear — la organización se quedaría sin
 * ninguna de las dos versiones, que es exactamente el fallo que este camino vino
 * a cerrar (B.140).
 *
 * VIVE AQUÍ Y NO EN LA RUTA porque es un criterio, no un paso: quien lo necesita
 * pregunta en vez de recalcularlo. Y porque dentro de la ruta no había forma de
 * ponerlo a prueba, siendo la línea más peligrosa del camino.
 *
 * LA GENERACIÓN SALE DEL ID, NO DE LA METADATA, a propósito: hay vectores
 * anteriores a C.4 que no llevan el campo `generation` en su metadata, y un
 * filtro por metadata los dejaría vivos. El id siempre la lleva —implícita la 1,
 * explícita a partir de la 2—, así que ninguna generación se escapa.
 * Un id que no se puede leer NO SE TOCA: no borrar de más es más importante que
 * limpiar del todo.
 */
export function vectoresARetirar(ids: string[], generacionNueva: number): string[] {
  return ids.filter(id => {
    const parsed = parseVectorId(id);
    return parsed !== null && parsed.generation < generacionNueva;
  });
}
