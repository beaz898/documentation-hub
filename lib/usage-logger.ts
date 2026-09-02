import { SupabaseClient } from '@supabase/supabase-js';
import { registrarPerdida } from './observability/perdidas';

export interface UsageLogEntry {
  userId: string;
  orgId: string;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  latencyMs: number;
  success: boolean;
  creditsConsumed?: number;
  errorMessage?: string;
  userQuery?: string;
}

/**
 * LA AVERÍA DE UNA ETAPA QUE FALLA ABIERTA, COMO FILA DE REGISTRO
 * (regla 6, memoria del fallo, 02/09/2026).
 *
 * ⚠️ FALLAR ABIERTO ES LEGÍTIMO; SER MUDO NO. El limitador de tasa, cuando su
 * consulta falla, DEJA PASAR — y está bien elegido: no bloquear al usuario por
 * un error nuestro es una decisión de disponibilidad (F-94 P4), y fallar
 * cerrado se reconsiderará cuando haya clientes que lo justifiquen. Lo que no
 * es legítimo es que nadie sepa cuántas veces el limitador dejó de limitar.
 *
 * EL DOMICILIO ES ESTA TABLA y no el catálogo de contadores del pipeline: aquel
 * vive en un `AsyncLocalStorage` del análisis y no llega a las rutas. `usage_logs`
 * ya tiene `success`, `error_message` y `endpoint` — los tres campos que hacen
 * falta— y ya la lee la analítica.
 *
 * DEVUELVE `null` CUANDO NO HAY AVERÍA, y esa es la mitad que hay que cuidar: un
 * limitador que funciona no escribe NADA. Una fila por llamada buena sería más
 * ruido que el silencio que se viene a arreglar.
 *
 * MOTIVO DE VOCABULARIO CERRADO, como el contrato de contadores: nada derivado
 * de datos del cliente, y los dos valores distinguibles entre sí — si el
 * registro no dijera CUÁL de los dos caminos se tomó, existiría pero no
 * serviría para nada.
 *
 * TOKENS Y CRÉDITOS A CERO, y no es relleno: la avería ocurre ANTES de cobrar.
 * Una fila que dijera otra cosa mentiría en la analítica de costes.
 */
export type AveriaDeLimitador = 'consulta_fallida' | 'error_inesperado';

const MOTIVOS: Record<AveriaDeLimitador, string> = {
  consulta_fallida: 'limitador: la consulta de uso falló, se permitió la llamada',
  error_inesperado: 'limitador: error inesperado, se permitió la llamada',
};

export function filaDeAveriaDeLimitador(params: {
  averia?: AveriaDeLimitador;
  orgId: string;
  userId: string;
  endpoint: string;
}): UsageLogEntry | null {
  if (!params.averia) return null;

  return {
    userId: params.userId,
    orgId: params.orgId,
    endpoint: params.endpoint,
    model: 'ninguno',
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    success: false,
    creditsConsumed: 0,
    errorMessage: MOTIVOS[params.averia],
  };
}

/**
 * Registra la avería de un limitador que falló abierto, si la hubo.
 *
 * ⚠️ LO QUE ESTO NO PUEDE CONTAR, DECLARADO: `checkRateLimit` LEE `usage_logs`
 * con el mismo cliente con el que esto ESCRIBE en `usage_logs`. Si Supabase está
 * entero caído, el registro falla por la misma razón que la avería, y `logUsage`
 * se lo traga.
 * QUEDA CUBIERTO el caso común —la consulta que falla con la base viva: un
 * cambio de esquema, una política RLS, un timeout de esa consulta—, que hasta
 * hoy era invisible para siempre. NO QUEDA CUBIERTO el apagón completo, que es
 * invisible desde dentro por construcción. Se dice en vez de fingirse.
 */
export async function registrarAveriaDeLimitador(
  supabase: SupabaseClient,
  params: { averia?: AveriaDeLimitador; orgId: string; userId: string; endpoint: string },
): Promise<void> {
  const fila = filaDeAveriaDeLimitador(params);
  if (!fila) return;
  await logUsage(supabase, fila);
}

/**
 * Registra una llamada al LLM en la tabla usage_logs de Supabase.
 * Recibe el cliente de Supabase ya creado por el endpoint para reutilizar
 * la conexión existente en vez de crear una nueva.
 */
export async function logUsage(
  supabase: SupabaseClient,
  entry: UsageLogEntry
): Promise<void> {
  try {
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: entry.userId,
        org_id: entry.orgId,
        endpoint: entry.endpoint,
        model: entry.model,
        input_tokens: entry.inputTokens,
        output_tokens: entry.outputTokens,
        cache_creation_tokens: entry.cacheCreationTokens ?? 0,
        cache_read_tokens: entry.cacheReadTokens ?? 0,
        latency_ms: entry.latencyMs,
        success: entry.success,
        credits_consumed: entry.creditsConsumed ?? 0,
        error_message: entry.errorMessage || null,
        user_query: entry.userQuery || null,
      });

    if (error) {
      // La base contesto y dijo que no. Se cuenta; no se propaga.
      registrarPerdida({
        tabla: 'usage_logs', causa: 'consulta_fallida',
        orgId: entry.orgId, referencia: entry.endpoint, detalle: error.message,
      });
    }
  } catch (err) {
    registrarPerdida({
      tabla: 'usage_logs', causa: 'excepcion',
      orgId: entry.orgId, referencia: entry.endpoint,
      detalle: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * LAS INCIDENCIAS DE UNA SINCRONIZACIÓN DE DRIVE (regla 6, 02/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA: el sync contaba sus fallos en tres variables locales
 * —`failedCount`, `unreadableCount`, `deleteFailedCount`—, los escribía en un
 * `console.log` y los devolvía en la respuesta. **Sin rastro consultable y sin
 * el nombre del documento.** «1 failed» no dice cuál, y el sync es por donde
 * entra todo al corpus: un documento que no entra solo se sabía mirando el log
 * en el momento. Pasó con OPE-13 el 01/09 y solo se vio porque estábamos
 * delante.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ SON TRES ESPECIES DISTINTAS, y mezclarlas era parte del problema:
 *
 *   · `ilegible` — el fichero se descargó BIEN y el extractor sacó menos de 50
 *     caracteres: un PDF escaneado sin OCR, un formato que no entendemos, un
 *     documento casi vacío. Es un hecho sobre el DOCUMENTO, no una avería, y
 *     reintentarlo mañana daría lo mismo. Lo arregla el usuario.
 *   · `fallo_al_procesar` — el `catch` que envuelve descarga, extracción,
 *     embeddings, upsert y escrituras. Es un hecho sobre la EJECUCIÓN, y casi
 *     siempre transitorio o nuestro.
 *   · `fallo_al_borrar` — el documento desapareció de Drive y no se pudo quitar
 *     del corpus. Es un hecho sobre el ESTADO: queda una divergencia que dura
 *     hasta el siguiente sync.
 *
 * POR QUÉ CABEN LAS TRES EN ESTA TABLA SIN FORZARLA: `usage_logs` no es un
 * registro de averías, es un registro de QUÉ PASÓ con una bandera `success`. Un
 * documento que no entró al corpus es legítimamente `success: false`, se haya
 * roto algo o no. Lo que las separa va en el motivo, distinguible.
 *
 * EL NOMBRE VA EN `user_query`, que es donde `/api/analyze-v2` ya pone
 * `${fileName} (rápido)`. Precedente del propio proyecto, no invención.
 *
 * NO TOCA LA CUOTA (B.145): estas filas van con `success: false` y el limitador
 * solo cuenta las `true`. Un documento que no entró no le gasta una llamada al
 * usuario — y con `success: true` sí se la gastaría.
 *
 * ⚠️ LO QUE NO SE PUEDE CONTAR, DECLARADO: si el sync falla porque SUPABASE no
 * responde, esta fila tampoco entra. Queda cubierto lo que pasó de verdad con
 * OPE-13 —Pinecone caído, Supabase viva— y no el apagón completo. Es el mismo
 * límite que el del limitador, y por la misma razón.
 */
export type EspecieDeIncidenciaDeSync = 'ilegible' | 'fallo_al_procesar' | 'fallo_al_borrar';

const MOTIVOS_DE_SYNC: Record<EspecieDeIncidenciaDeSync, string> = {
  ilegible: 'sync: el documento no se pudo leer (sin texto extraíble); no entró al corpus',
  fallo_al_procesar: 'sync: fallo al procesar el documento; no entró al corpus',
  fallo_al_borrar: 'sync: desapareció del proveedor y no se pudo quitar del corpus',
};

export function filaDeIncidenciaDeSync(params: {
  especie: EspecieDeIncidenciaDeSync;
  /** El nombre del documento. Es lo que los recuentos no daban y el motivo por
   *  el que existe este registro: «1 failed» no dice cuál. */
  documento: string;
  detalle?: string;
  orgId: string;
  userId: string;
  endpoint: string;
}): UsageLogEntry {
  const motivo = MOTIVOS_DE_SYNC[params.especie];
  return {
    userId: params.userId,
    orgId: params.orgId,
    endpoint: params.endpoint,
    model: 'ninguno',
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    success: false,
    creditsConsumed: 0,
    errorMessage: params.detalle ? `${motivo} — ${params.detalle}` : motivo,
    userQuery: params.documento,
  };
}

/** Registra una incidencia del sync. No lanza: se llama desde ramas que ya
 *  estaban decidiendo qué hacer con el documento, y un fallo aquí no puede
 *  cambiar esa decisión. */
export async function registrarIncidenciaDeSync(
  supabase: SupabaseClient,
  params: Parameters<typeof filaDeIncidenciaDeSync>[0],
): Promise<void> {
  await logUsage(supabase, filaDeIncidenciaDeSync(params));
}
