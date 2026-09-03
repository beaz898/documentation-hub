/**
 * EL VOCABULARIO DEL ESTADO DE UN DOCUMENTO — un solo sitio (frente 3, paso 1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA. Hasta hoy este vocabulario vivía en TRES copias y ninguna era
 * autoritativa: el `CHECK` de `documents.analysis_status` en Supabase, y dos
 * COMENTARIOS —`DocumentsSidebar.tsx` y `hooks/chat/types.ts`— que enumeraban
 * los valores al lado de un `string` pelado. Los dos comentarios ya estaban
 * desactualizados: ninguno mencionaba `en_revision`.
 *
 * Es la especie que este frente persigue, en el sitio donde más duele: el
 * estado del documento.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Los cinco valores admitidos, ESPEJO DEL CHECK de la base
 * (`supabase-f3-en-revision.sql`, ejecutado el 02/09/2026).
 *
 * ⚠️ `en_analisis` y `desactualizado` NO LOS ESCRIBE NADIE desde julio de 2026.
 * Están aquí porque el CHECK los admite y esto es su espejo: si faltaran, una
 * fila legítima de la base fallaría la guarda de abajo. Que estén muertos es
 * otro problema —y su retirada, otra migración— y no se mezcla con esto.
 */
export const ESTADOS_DE_ANALISIS = [
  /** La fila existe y el documento AÚN NO HA ENTRADO: no hay vectores. */
  'en_revision',
  /** INDEXADO y esperando validación. SÍ tiene vectores — es lo que escribe la
   *  sincronización de Drive, y el 02/09 se midieron 27 documentos así. */
  'pendiente',
  'en_analisis',
  /** El único elegible para el corpus. */
  'analizado',
  'desactualizado',
] as const;

export type EstadoDeAnalisis = (typeof ESTADOS_DE_ANALISIS)[number];

/**
 * ¿ES ELEGIBLE PARA EL CORPUS? La PARTICIÓN de F-96, escrita como código en vez
 * de como comentario.
 *
 * ⚠️ SE ESCRIBE COMO IGUALDAD A `'analizado'` Y NUNCA COMO LISTA DE
 * EXCLUSIONES, y la diferencia no es de estilo: con una lista, cada valor nuevo
 * habría que acordarse de añadirlo, y el día que alguien olvide uno **ese estado
 * entra al corpus**. Con la igualdad, un valor nuevo NACE EXCLUIDO.
 *
 * Es el mismo criterio que el filtro de Pinecone (`CORPUS_ACTIVO`), que también
 * pregunta por igualdad. Este no lo sustituye —quien filtra de verdad es el
 * vectorial, y eso no cambia— sino que lo dice en el vocabulario, para que
 * ningún camino de Supabase invente el suyo.
 */
export function esElegibleParaCorpus(estado: EstadoDeAnalisis): boolean {
  return estado === 'analizado';
}

/**
 * ¿HAY ALGO DE ESTE DOCUMENTO EN EL ÍNDICE? Es LA DISTINCIÓN QUE JUSTIFICA EL
 * VALOR NUEVO, y por eso vive aquí desde el primer commit aunque todavía no la
 * llame nadie.
 *
 * `en_revision` es el único estado sin vectores: la fila nace al subir el
 * documento, antes de analizarlo y antes de indexarlo. Todos los demás implican
 * que el documento se indexó en algún momento — incluido `pendiente`, que es lo
 * que más se confunde con éste y NO es lo mismo: un documento `pendiente` está
 * indexado del todo, lo que no está es aprobado (medido el 02/09: 27 así, todos
 * con sus vectores).
 *
 * Sin esta función escrita, el valor nuevo parece redundante y alguien lo
 * unificará con `pendiente` — que es exactamente el error que este commit
 * previene.
 */
export function estaEnElIndice(estado: EstadoDeAnalisis): boolean {
  return estado !== 'en_revision';
}

/**
 * La guarda para lo que viene de la base: la columna es `text`, y el jsonb de la
 * bandeja tiene meses. Tolera cualquier cosa sin lanzar.
 */
export function esEstadoDeAnalisis(valor: unknown): valor is EstadoDeAnalisis {
  return typeof valor === 'string' && (ESTADOS_DE_ANALISIS as readonly string[]).includes(valor);
}
