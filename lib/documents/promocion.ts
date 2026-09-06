/**
 * QUÉ ESCRIBE UNA CONMUTACIÓN EN LA FILA DEL DOCUMENTO, Y POR QUÉ NO ES SIEMPRE
 * LO MISMO (06/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. `swapDocumentVectors` escribía SIEMPRE `analysis_status:
 * 'analizado'`, `analyzed_content_hash` y `reviewed_at/by = null`. Para sus dos
 * llamantes de entonces eso era correcto: los dos significan **«este contenido
 * acaba de validarse»** —el análisis desde la bandeja y el marcado humano—, y
 * ahí promover y resetear la procedencia es justo lo que toca.
 *
 * El reindexado rompe esa suposición: **el contenido es EL MISMO**, solo cambia
 * cómo está troceado. Con la conmutación de antes, reparar un documento
 * `pendiente` lo habría promovido a `analizado` — o sea **lo habría metido en el
 * corpus sin que nadie lo revisara**— y le habría borrado a un documento ya
 * revisado su `reviewed_at/by`, devolviéndolo a la bandeja.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ NO ERA UN FALLO DE LA CONMUTACIÓN: era una suposición que solo se ve al
 * aparecer el tercer llamante. Por eso el motivo se PIDE y no se supone — un
 * valor por defecto habría dejado el caso nuevo heredando en silencio la
 * semántica del viejo, que es exactamente cómo se cuelan estas cosas.
 *
 * ⚠️ Y EL MOTIVO ES DEL LLAMANTE, NO DERIVABLE AQUÍ. Desde dentro de la
 * conmutación, «contenido nuevo» y «mismo contenido» son indistinguibles: las
 * dos traen una generación nueva con su texto y su hash. Quien lo sabe es quien
 * la invoca.
 */

/** Por qué se conmuta. Vocabulario cerrado. */
export type MotivoDeConmutacion =
  /** El contenido es nuevo y acaba de validarse: análisis desde la bandeja, o
   *  marcado humano. Promueve y resetea la procedencia de revisión. */
  | 'contenido_validado'
  /** El MISMO contenido, troceado otra vez. No opina sobre el contenido: ni
   *  promueve, ni toca la revisión, ni mueve el hash de lo analizado. */
  | 'mismo_contenido_retroceado';

export interface DatosDelStaged {
  full_text: string;
  /** F-105 paso 0. Puede faltar: las filas de `document_staged` escritas antes
   *  de hoy no lo tienen, y esa ausencia es legítima durante la ventana. */
  segments?: unknown;
  content_hash: string;
  chunk_count: number;
  size_bytes: number;
  source_modified_at: string | null;
}

/** Los campos que la conmutación escribe, sin los que no le corresponden. */
export interface CamposDePromocion {
  full_text: string;
  segments: unknown;
  content_hash: string;
  chunk_count: number;
  size_bytes: number;
  source_modified_at: string | null;
  active_generation: number;
  extractor_version: number;
  analysis_status?: 'analizado';
  analyzed_content_hash?: string;
  reviewed_at?: null;
  reviewed_by?: null;
}

export function camposDePromocion(
  staged: DatosDelStaged,
  generacionNueva: number,
  versionDelExtractor: number,
  motivo: MotivoDeConmutacion,
): CamposDePromocion {
  // Lo que se escribe SIEMPRE: describe el troceado y el texto que pasa a
  // servirse, y eso es cierto en los dos motivos.
  const comunes: CamposDePromocion = {
    full_text: staged.full_text,
    // ⚠️ F-105 paso 0 — LOS SEGMENTOS VIAJAN CON LOS DOS MOTIVOS, y no es un
    // descuido: describen EL CONTENIDO, y ninguno de los dos motivos cambia el
    // contenido. Dejarlos fuera de `mismo_contenido_retroceado` haría que un
    // documento PERDIERA sus segmentos justo al repararlo — el revés exacto de
    // lo que la reparación existe para hacer.
    segments: staged.segments ?? null,
    content_hash: staged.content_hash,
    chunk_count: staged.chunk_count,
    size_bytes: staged.size_bytes,
    source_modified_at: staged.source_modified_at,
    active_generation: generacionNueva,
    extractor_version: versionDelExtractor,
  };

  if (motivo === 'mismo_contenido_retroceado') return comunes;

  // ⚠️ SOLO CUANDO EL CONTENIDO ES NUEVO. Los cuatro campos de abajo son
  // afirmaciones sobre el CONTENIDO —«esto está analizado», «este es el texto
  // que se analizó», «nadie ha revisado esta versión»— y un retroceado no tiene
  // derecho a hacer ninguna: no ha mirado el contenido, solo lo ha cortado.
  return {
    ...comunes,
    analysis_status: 'analizado',
    analyzed_content_hash: staged.content_hash,
    reviewed_at: null,
    reviewed_by: null,
  };
}
