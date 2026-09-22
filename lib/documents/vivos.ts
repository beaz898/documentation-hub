import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * QUÉ DOCUMENTOS EXISTEN DE VERDAD — F-115 (22/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ UNA SOLA IDENTIDAD PARA «ESTE DOCUMENTO EXISTE». Hasta hoy había TRES
 * construcciones de la misma pregunta, con tres criterios y tres direcciones de
 * fallo distintas:
 *   · `retrieval.ts` leía `(id, active_generation)` de los ids recuperados,
 *     filtrando por organización, y ante un fallo de lectura dejaba el mapa
 *     VACÍO y no filtraba nada;
 *   · el censo de vecindario leía TODAS las filas de la organización y ante un
 *     fallo devolvía 503;
 *   · el chat (`fetchFullTexts`) leía `(id, full_text)` **sin filtrar por
 *     organización** y ante un fallo pasaba todo.
 * Tres lectores, tres respuestas posibles a la misma pregunta. Esto es la
 * definición única, y las cuatro vías la importan.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LO QUE ARREGLA, Y ES POR LO QUE EXISTE: un vector cuyo documento ya no tiene
 * fila casa en la búsqueda igual que cualquier otro —el filtro del índice mira
 * METADATOS, no filas—, y aguas abajo se sirve como contenido actual. El
 * 21/09/2026, CLI-05 (`c701c9dd`), borrado días antes, volvió de forma
 * intermitente en las consultas de Pinecone y **cambió el resultado de un
 * análisis del usuario**: el rerank eligió otro documento. F-115.
 *
 * ⚠️ Y LA PIEZA QUE FALTABA NO ERA LA CONSULTA: ERA SU PROCEDENCIA. La consulta
 * ya existía. Lo que no existía era la diferencia entre «leí y este documento no
 * está» y «no pude leer»: las dos llegaban como el mismo `Map` vacío, así que la
 * regla «lo que no se sabe no se tira» —correcta para lo segundo— se aplicaba
 * también a lo primero, y un fantasma pasaba por candidato legítimo. De ahí el
 * tipo de retorno: el fallo va EN LA FIRMA, y nadie puede confundirlo con un
 * resultado.
 *
 * ⚠️ VIVO = TIENE FILA CON ESE `org_id`. Nada más. No se mira `analysis_status`
 * —ése es el criterio del CORPUS (`ESTADO_DEL_CORPUS`), que es otra pregunta y
 * la contesta el filtro del índice—, y no hace falta mirar si tiene generación:
 * `documents.active_generation` es `NOT NULL DEFAULT 1`
 * (`supabase-c4-generation-model.sql:7`), así que **no existe fila sin
 * generación** y un documento a medio indexar no puede caer por aquí.
 */

/** Qué documentos de los preguntados tienen fila, con su generación activa. */
export type DocumentosVivos =
  | { estado: 'leido'; generaciones: ReadonlyMap<string, number> }
  | { estado: 'no_leido'; motivo: string };

/**
 * El texto que ve el usuario cuando la verificación no se pudo hacer. UNO, para
 * los cuatro caminos: el mensaje es producto, y cuatro redacciones distintas del
 * mismo hecho serían cuatro productos.
 */
export const MENSAJE_VERIFICACION_NO_DISPONIBLE =
  'No se pudo verificar tu documentación; inténtalo de nuevo.';

/**
 * ⚠️ POR LOTES, Y NO ES UNA OPTIMIZACIÓN: ES EL TOPE DE FILAS DE POSTGREST.
 *
 * Una consulta sin `range` devuelve como mucho 1.000 filas y **no avisa de que
 * truncó**. Con `.in('id', ids)` de más de mil ids, los que se quedaran fuera
 * llegarían aquí como «sin fila» — y el efecto sería descartar documentos VIVOS,
 * en silencio y en la dirección que pierde candidatos. El lote de 200 lo hace
 * imposible por construcción: nunca se piden más ids de los que pueden volver.
 *
 * 200 y no 500 porque estos ids viajan en la cadena de consulta de una petición
 * GET: 200 uuids son ~7 KB de URL, y 500 rondarían los 19 KB, que es territorio
 * de límites de servidor.
 */
export const LOTE_DE_IDS = 200;

/** Una sola lectura, sin reintento. Separada para que el reintento se vea. */
async function leerUnLote(
  supabase: SupabaseClient,
  orgId: string,
  ids: string[],
): Promise<{ ok: true; filas: Array<{ id: string; generacion: number }> } | { ok: false; motivo: string }> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, active_generation')
      .eq('org_id', orgId)
      .in('id', ids);

    if (error) return { ok: false, motivo: error.message };

    const filas = (data ?? []).map(f => ({
      id: f.id as string,
      generacion: (f.active_generation as number | null) ?? 1,
    }));
    return { ok: true, filas };
  } catch (err) {
    return { ok: false, motivo: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * ¿Cuáles de estos documentos tienen fila en la organización?
 *
 * UN REINTENTO antes de darse por vencida: un corte de un segundo contra la base
 * pararía un análisis de 30 créditos, y esta lectura es PURA —repetirla no
 * cambia ningún estado—, así que reintentar no tiene coste ni riesgo.
 *
 * ⚠️ SIN IDS NO SE CONSULTA, y devuelve `leido` con el mapa vacío. No es un
 * atajo: preguntar por la lista vacía es una pregunta sin objeto, y contestarla
 * con `no_leido` pararía análisis que no tenían nada que verificar.
 */
export async function documentosVivos(
  supabase: SupabaseClient,
  args: { orgId: string; ids: readonly string[] },
): Promise<DocumentosVivos> {
  const unicos = [...new Set(args.ids)];
  if (unicos.length === 0) return { estado: 'leido', generaciones: new Map() };

  const generaciones = new Map<string, number>();

  for (let i = 0; i < unicos.length; i += LOTE_DE_IDS) {
    const lote = unicos.slice(i, i + LOTE_DE_IDS);

    let r = await leerUnLote(supabase, args.orgId, lote);
    if (!r.ok) {
      console.warn(`[vivos] lectura fallida, reintentando una vez | org=${args.orgId} | ${r.motivo}`);
      r = await leerUnLote(supabase, args.orgId, lote);
    }
    // ⚠️ UN LOTE QUE FALLA TUMBA LA RESPUESTA ENTERA. Devolver los lotes que sí
    // llegaron sería lo peor de los dos mundos: un mapa INCOMPLETO que nadie
    // puede distinguir de uno completo, y los documentos del lote perdido
    // pasarían por inexistentes.
    if (!r.ok) return { estado: 'no_leido', motivo: r.motivo };

    for (const fila of r.filas) generaciones.set(fila.id, fila.generacion);
  }

  return { estado: 'leido', generaciones };
}

/** Lo mínimo que hace falta para preguntar por la fila de algo. */
export interface ConDocumentId {
  documentId: string;
}

/**
 * EL REPARTO: qué tiene fila y qué no. Función pura, y la ÚNICA que decide.
 *
 * ⚠️ RECIBE EL MAPA, NO EL `DocumentosVivos`: quien llame ya ha tenido que abrir
 * el discriminante para saber si podía seguir, así que aquí no puede llegar un
 * `no_leido` disfrazado de mapa vacío. Un mapa vacío significa exactamente
 * «ninguno de los preguntados tiene fila», y entonces se descarta todo — que es
 * el comportamiento correcto y no un caso que haya que saltarse.
 */
export function repartoPorFilaViva<T extends ConDocumentId>(
  items: readonly T[],
  generaciones: ReadonlyMap<string, number>,
): { vivos: T[]; sinFila: T[] } {
  const vivos: T[] = [];
  const sinFila: T[] = [];
  for (const item of items) {
    (generaciones.has(item.documentId) ? vivos : sinFila).push(item);
  }
  return { vivos, sinFila };
}

/**
 * Cuántos vectorId se registran de lo descartado. Son uuids con índice —ni texto
 * del cliente ni nombres de documento—, así que caben en la telemetría; el tope
 * está para que un fallo masivo no escriba un jsonb de miles de entradas.
 */
export const MAXIMO_DE_IDS_REGISTRADOS = 20;

/** Los primeros `MAXIMO_DE_IDS_REGISTRADOS`, para dejar rastro sin inundar. */
export function idsParaElRegistro(ids: readonly string[]): string[] {
  return ids.slice(0, MAXIMO_DE_IDS_REGISTRADOS);
}

/**
 * PARAR, con el mensaje del usuario en el error y la causa técnica en el log.
 *
 * Las dos mitades en un sitio: el `motivo` de la base **no se le muestra a
 * nadie** —es el mensaje de PostgREST— y el texto que sí se muestra no dice
 * nada que el usuario no pueda entender. Los caminos que tienen canal de error
 * propio (el agente) no llaman aquí: devuelven su error tipado.
 */
export function pararPorVerificacion(donde: string, motivo: string): never {
  console.error(
    `[vivos] ${donde}: no se pudo verificar qué documentos existen — se PARA | ${motivo}`,
  );
  throw new Error(MENSAJE_VERIFICACION_NO_DISPONIBLE);
}
