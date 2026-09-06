import { estadoDeReparacion } from './estado-de-reparacion';
import type { FilaParaSello } from './estado-de-reparacion';

/**
 * QUÉ SE PUEDE HACER PARA REPARAR ESTE DOCUMENTO — y qué NO (F-104, paso 1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SON DOS OPERACIONES Y NO UNA, y separarlas es lo primero del diseño:
 *
 *   · REPROCESAR — se vuelve a descargar el fichero original y se rehace la
 *     extracción Y el troceado. Repara cualquier cambio del extractor.
 *   · RE-TROCEAR — se re-trocea `full_text`, que ya está extraído. Repara
 *     cambios del CORTADOR y nada más.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y RE-TROCEAR PUEDE DESTRUIR DATOS, que es la razón de que este módulo
 * exista aparte del que llama. `full_text` se guarda con el marcador de
 * segmentación QUITADO (`stripSegmentationMarkers`), así que re-trocearlo no
 * puede reconstruir los segmentos: un documento con tablas volvería como prosa y
 * **se perderían las `cells`**, que son lo único que alimenta el diff. Una
 * reparación que convierte una tabla en prosa es peor que no reparar, así que
 * ese caso se RECHAZA — no se intenta y se avisa después.
 *
 * ⚠️ EL RECHAZO ES UNA RESPUESTA DE PRIMERA CLASE, no un error. «No se puede
 * reparar automáticamente» es información que el usuario necesita —le dice que
 * lo resuba— y por eso viaja en el tipo de retorno y no en una excepción: lo que
 * no cabe en la firma lo acaba representando el vecino.
 *
 * ⚠️ Y «AL DÍA» NO SE DECIDE AQUÍ: se le pregunta a `estadoDeReparacion`, que es
 * donde vive ese criterio. Éste no va a ser el segundo sitio que lo calcule.
 */

/** El mínimo de texto que `ingest` ya exige para dar un documento por indexable. */
const MINIMO_DE_TEXTO = 50;

export type MotivoDeRechazo =
  /** Ya está en la versión vigente: no hay nada que reparar. */
  | 'al_dia'
  /** Hay una versión pendiente de aprobar y `document_staged` solo admite una
   *  fila por documento: reindexar la pisaría. */
  | 'staged_vivo'
  /** No se puede recuperar el original y el documento tiene tablas: re-trocear
   *  desde el texto las convertiría en prosa. Se resube. */
  | 'sin_original_con_tablas'
  /** No se puede recuperar el original y el texto guardado no da ni el mínimo. */
  | 'sin_texto';

export type PlanDeReindexado =
  | { via: 'reprocesar' }
  | { via: 'retrocear' }
  | { via: 'rechazado'; motivo: MotivoDeRechazo };

export interface EntradaDelPlan {
  fila: FilaParaSello;
  /** ¿Tiene chunks `table_row`/`table_summary` en su generación activa? */
  tieneChunksTabulares: boolean;
  /** ¿Hay una fila viva en `document_staged` para este documento? */
  hayStagedVivo: boolean;
  /** El texto guardado, que es lo único que sobrevive a la indexación de un manual. */
  fullText: string | null | undefined;
}

/**
 * ⚠️ EL ORDEN DE LAS GUARDAS ES PARTE DEL CRITERIO, no una casualidad de cómo
 * quedó escrito: `al_dia` gana a `staged_vivo` porque un documento que no
 * necesita reparación no debe rechazarse por un motivo que sugiere un conflicto.
 * Decir «no se pudo, hay algo pendiente» de algo que no había que tocar manda a
 * alguien a resolver un problema que no existe.
 */
export function planDeReindexado(
  entrada: EntradaDelPlan,
  versionVigente: number,
): PlanDeReindexado {
  const { estado } = estadoDeReparacion(entrada.fila, versionVigente);

  if (estado === 'al_dia') return { via: 'rechazado', motivo: 'al_dia' };
  if (entrada.hayStagedVivo) return { via: 'rechazado', motivo: 'staged_vivo' };

  // Con el original en la mano se rehace todo desde el binario, y por eso aquí
  // NO se mira si hay tablas: reprocesar las reconstruye, no las pierde.
  if (estado === 'reparable_automaticamente') return { via: 'reprocesar' };

  if (entrada.tieneChunksTabulares) {
    return { via: 'rechazado', motivo: 'sin_original_con_tablas' };
  }

  const texto = typeof entrada.fullText === 'string' ? entrada.fullText.trim() : '';
  if (texto.length < MINIMO_DE_TEXTO) {
    return { via: 'rechazado', motivo: 'sin_texto' };
  }

  return { via: 'retrocear' };
}

/**
 * ⚠️ RE-TROCEAR ES MEDIA REPARACIÓN, y hay que llamarla por su nombre en vez de
 * venderla como completa: arregla el troceado, NO la extracción. Si algún día
 * cambia cómo se LEE un documento —no cómo se corta—, esta vía no lo repara y el
 * documento seguirá necesitando una resubida aunque el reindexado diga que fue
 * bien. Lo devuelve el propio plan para que quien lo enseñe no tenga que saberlo.
 */
export function esReparacionCompleta(plan: PlanDeReindexado): boolean {
  return plan.via === 'reprocesar';
}
