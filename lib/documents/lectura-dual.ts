import { joinSegments, stripSegmentationMarkers } from '@/lib/chunking';
import type { ExtractedSegment } from '@/lib/chunking';

/**
 * LA LECTURA DUAL CON CADUCIDAD — las dos formas de un documento (F-105, paso 0).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUÉ EXISTE. Desde hoy los cinco puntos de indexación escriben `segments`
 * ADEMÁS de `full_text`. Pero los documentos que ya estaban indexados **no
 * tienen segmentos y no se migran solos**: se migran cuando alguien los repara.
 * Así que durante una ventana conviven las dos formas, y todo el que necesite el
 * contenido de un documento tiene que aceptar las dos.
 *
 * Es la LECTURA DUAL CON CADUCIDAD de F-94 —«se lee la vieja y la nueva durante
 * una ventana CON FECHA, y se escribe solo la nueva»— con una diferencia que hay
 * que decir: aquí **se escriben las dos**, porque retirar `full_text` hoy dejaría
 * sin fuente a casi todo el corpus. La condición de cierre de la ventana está
 * escrita en `supabase-f105-segmentos.sql` y es medible: cuando ningún documento
 * tenga `segments IS NULL`.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LA ASIMETRÍA QUE DEFINE LA VENTANA, y va en el tipo y no en un comentario:
 * de `full_text` **solo sale prosa**. El texto plano se guarda sin el marcador de
 * segmentación, así que reconstruir desde él da UN segmento de texto — nunca las
 * celdas de un Excel. Por eso `origen` viaja con el resultado: quien lo consuma
 * tiene que poder saber si está mirando la estructura de verdad o una
 * reconstrucción de prosa, y decidir en consecuencia.
 */

export type OrigenDeLaLectura =
  /** Los segmentos guardados: la estructura real, con sus celdas si las tenía. */
  | 'segmentos'
  /** Reconstruido desde `full_text`: PROSA, aunque el original fuera una tabla. */
  | 'texto_plano'
  /** Ni segmentos ni texto: no hay nada que leer. */
  | 'vacio';

export interface FilaConContenido {
  segments?: unknown;
  full_text?: string | null;
}

export interface LecturaDelDocumento {
  segmentos: ExtractedSegment[];
  origen: OrigenDeLaLectura;
}

/** ¿Es esto una lista de segmentos utilizable? */
function esListaDeSegmentos(valor: unknown): valor is ExtractedSegment[] {
  return Array.isArray(valor)
    && valor.length > 0
    && valor.every(s => typeof s === 'object' && s !== null && typeof (s as { text?: unknown }).text === 'string');
}

/**
 * ⚠️ EL ARRAY VACÍO CUENTA COMO AUSENTE, y es la decisión menos obvia de este
 * módulo. `segments: []` puede venir de un extractor que no produjo nada, y
 * tratarlo como «tiene segmentos» dejaría el documento MUDO —cero segmentos,
 * cero texto— teniendo un `full_text` perfectamente utilizable al lado.
 * Ante la duda se cae al texto plano, que es la forma que siempre funciona.
 */
/**
 * ⚠️ LA RAMA `texto_plano` NO ESTÁ MUERTA — LEE ESTO ANTES DE RETIRARLA (09/09/2026).
 *
 * Va a PARECER muerta, y por eso se escribe aquí: si el parque se repara por
 * re-sincronización, todos los documentos vuelven CON segmentos, y a partir de
 * ese día ningún caso real entra por este camino. Un `grep` mostrará una rama
 * que nadie ejercita.
 *
 * **Sigue siendo la única vía para un documento cuyo fichero ya no existe.** Un
 * manual no guarda el suyo —`ingest:395` lo borra de Storage al terminar— y uno
 * de la nube puede haberse borrado allí. Para ésos no hay original al que
 * volver: `full_text` es lo único que queda, y esto es lo que lo convierte en
 * algo re-troceable.
 *
 * LA CONDICIÓN, para que se pueda comprobar en vez de creerse: retirar esto solo
 * es correcto el día que TODO documento tenga o bien sus segmentos guardados, o
 * bien un original recuperable. Mientras exista uno solo sin las dos cosas, esta
 * rama es su única reparación posible.
 *
 * ⚠️ Y no protege de sí misma: reconstruir desde `full_text` da PROSA. Un
 * documento con tablas re-troceado por aquí se convierte en prosa para siempre
 * (B.191). Quien llega hasta aquí ya ha pasado por `puedePerderEstructura`.
 */
export function lecturaDelDocumento(fila: FilaConContenido): LecturaDelDocumento {
  if (esListaDeSegmentos(fila.segments)) {
    return { segmentos: fila.segments, origen: 'segmentos' };
  }

  const texto = typeof fila.full_text === 'string' ? fila.full_text : '';
  if (texto.trim().length === 0) {
    return { segmentos: [], origen: 'vacio' };
  }

  return { segmentos: [{ type: 'text', text: texto }], origen: 'texto_plano' };
}

/**
 * El texto del documento, venga de donde venga.
 *
 * Se deriva SIEMPRE de la lectura de arriba en vez de leer `full_text` a pelo,
 * para que no haya dos maneras de contestar la misma pregunta: el día que la
 * ventana se cierre y `full_text` desaparezca, esta función sigue funcionando
 * sin que nadie la toque.
 */
export function textoDelDocumento(fila: FilaConContenido): string {
  const { segmentos, origen } = lecturaDelDocumento(fila);
  if (origen === 'vacio') return '';
  return stripSegmentationMarkers(joinSegments(segmentos));
}

/**
 * ¿Este documento ya está migrado a la forma nueva?
 *
 * Es el contador de la ventana: mientras devuelva `false` para alguno, la
 * retirada de `full_text` no puede ocurrir. Vive aquí y no en una consulta para
 * que el criterio sea uno solo —la consulta del SQL y esta función contestan lo
 * mismo— y para que el día que se cierre la ventana haya un sitio donde mirar.
 */
export function tieneSegmentosPersistidos(fila: FilaConContenido): boolean {
  return esListaDeSegmentos(fila.segments);
}
