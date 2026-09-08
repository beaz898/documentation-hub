/**
 * ¿QUÉ SE HACE CON LA ESTRUCTURA AL GUARDAR UNA VERSIÓN CORREGIDA? — B.201.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ EL FALLO QUE ARREGLA, medido el 09/09/2026 y **latente**: `index-text`
 * guardaba SIEMPRE `segments = [{ type: 'text', text }]`. Corregir una hoja de
 * cálculo en el modal y pulsar Guardar la devolvía al corpus **como prosa**, con
 * `extractor_version` al día y `analysis_status: 'analizado'` — así que el censo
 * la daba por sana, el botón de reparar no la ofrecía nunca, y la guarda de
 * B.191 no podía protegerla porque el documento SÍ tenía segmentos: los tenía
 * equivocados.
 *
 * Nunca había ocurrido —la consulta sobre los 40 documentos salió limpia— pero
 * el camino estaba abierto: el botón de guardar solo mira `disabled={indexing}`.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ Y NO DECIDE POR EL USUARIO CUANDO HAY DUDA. Si el texto se editó, el
 * sistema **no puede saber** si los cambios respetan la estructura: aplanar en
 * silencio es el fallo que este frente lleva una semana persiguiendo, y negarse
 * sin más le quita una función que necesita. Se pregunta.
 *
 * ⚠️ LA DECISIÓN SE TOMA SOBRE EL NOMBRE ORIGINAL, NUNCA SOBRE EL FINAL, y esto
 * es lo único que hace que el arreglo no sea decorativo: `useIndexing` compone
 * `"<nombre> (corregido dd/mm/aaaa)"`, así que la extensión **deja de ser la
 * última** y `produceTablas` devuelve `false` sobre ese nombre. Medido antes de
 * escribir esto. Quien llame a esta función con el nombre final tendrá una
 * guarda que no se dispara jamás, verde y sin efecto — la misma especie que el
 * `join('\n')` del rescate de la bandeja.
 */

export type QueHacerConLaEstructura =
  /** El texto no ha cambiado: se reusa la estructura de verdad. Sin preguntar. */
  | 'conservar'
  /** Se perderían las celdas y el usuario no lo ha confirmado. Se le pregunta. */
  | 'preguntar'
  /** O no había estructura que perder, o el usuario dijo que adelante. */
  | 'aplanar';

export interface SituacionAlGuardar {
  /**
   * ¿El fichero de ORIGEN producía tablas? Se contesta con `produceTablas` sobre
   * el **nombre original**. Ver el aviso de la cabecera.
   */
  produceTablas: boolean;
  /**
   * ¿Hay estructura recuperable ahora mismo? El fichero original en Storage
   * (camino del chat) o los segmentos guardados del documento (camino de la
   * bandeja). Sin ninguna de las dos, no hay nada que conservar aunque el texto
   * no haya cambiado.
   */
  hayEstructuraRecuperable: boolean;
  /**
   * ¿El texto a guardar sigue siendo el que produjo esa estructura? Lo contesta
   * `puedeUsarLaEstructura`, que compara por el mismo hash que todo lo demás.
   */
  textoIntacto: boolean;
  /** El usuario ya ha visto el aviso y ha dicho que adelante. */
  aplanarConfirmado: boolean;
}

/**
 * ⚠️ EL ORDEN DE LAS TRES PREGUNTAS ES EL ARREGLO, no un detalle de estilo.
 *
 * Conservar va PRIMERO porque cuando se puede conservar no hay nada que
 * decidir, y preguntar ahí sería fricción pura sobre el caso bueno — el usuario
 * que no tocó el texto no tiene ninguna elección que hacer.
 *
 * Preguntar va antes que aplanar porque **aplanar es irreversible y silencioso**:
 * después no queda de dónde sacar las celdas (`full_text` no las tiene y el
 * fichero original se borra al guardar), y el documento parece sano.
 */
export function queHacerConLaEstructura(s: SituacionAlGuardar): QueHacerConLaEstructura {
  if (s.hayEstructuraRecuperable && s.textoIntacto) return 'conservar';
  if (s.produceTablas && !s.aplanarConfirmado) return 'preguntar';
  return 'aplanar';
}
