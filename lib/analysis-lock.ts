import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Semaforo de concurrencia de analisis (F-13/F-14): un solo analisis activo por
 * organizacion. Vive en organizations (analysis_running_by/since/type), al lado del
 * candado B.64 (upload_locked_*) pero con proposito distinto: B.64 serializa sesiones
 * humanas de subida; este serializa analisis (maquinas).
 *
 * VETO GLOBAL INTERINO: la cola de Fase D lo sustituye por serializacion con dedup por
 * documento. Cuando eso llegue, estas funciones y sus columnas se retiran.
 *
 * GARANTIA DE LIBERACION: la AUTO-EXPIRACION por timestamp. El finally del endpoint que
 * libera es solo cortesia de latencia; en serverless puede no ejecutarse (la funcion
 * puede morir tras responder), asi que el diseño NO depende de el. El umbral de
 * expiracion es POR TIPO: un rapido colgado no debe bloquear la org los 20 min del
 * exhaustivo (seria el cepo que F-13 prohibio).
 */

// Umbrales de auto-expiracion por tipo de analisis (ms).
// quick: peor caso legitimo ~1-2 min (incluye timeout de Vercel) + margen.
// exhaustive: 20 min, mismo valor que el barrido de zombis del worker (B.51).
const QUICK_LOCK_MS = 5 * 60 * 1000;
const EXHAUSTIVE_LOCK_MS = 20 * 60 * 1000;

export type AnalysisType = 'quick' | 'exhaustive';

function lockMsForType(type: string | null): number {
  return type === 'exhaustive' ? EXHAUSTIVE_LOCK_MS : QUICK_LOCK_MS;
}

export type AnalysisLockResult =
  | { acquired: true }
  | { acquired: false; runningType: AnalysisType; minutesAgo: number };

/**
 * Intenta adquirir el semaforo para un analisis. Si hay otro activo y no ha expirado
 * (segun el umbral de SU tipo), devuelve acquired:false con los datos para el 409. Si
 * esta expirado o no hay, lo adquiere (escribe by/since/type) y devuelve acquired:true.
 *
 * Nota sobre atomicidad: es lectura-luego-escritura, no atomico. En la practica basta
 * (el propio veto reduce la ventana a casi nada, y el peor caso de una carrera es un
 * credito duplicado, no corrupcion — F-12/F-14). La cola de Fase D lo hara atomico.
 */
export async function checkAndAcquireAnalysisLock(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  type: AnalysisType,
): Promise<AnalysisLockResult> {
  const { data: org } = await supabase
    .from('organizations')
    .select('analysis_running_by, analysis_running_since, analysis_running_type')
    .eq('id', orgId)
    .single();

  const runningSince = org?.analysis_running_since
    ? new Date(org.analysis_running_since).getTime()
    : null;

  const active =
    !!org?.analysis_running_by &&
    runningSince !== null &&
    Date.now() - runningSince < lockMsForType(org.analysis_running_type);

  if (active && runningSince !== null) {
    const runningType: AnalysisType =
      org!.analysis_running_type === 'exhaustive' ? 'exhaustive' : 'quick';
    const minutesAgo = Math.max(1, Math.floor((Date.now() - runningSince) / 60000));
    return { acquired: false, runningType, minutesAgo };
  }

  // Libre o expirado: adquirir (sobrescribe un semaforo expirado sin ceremonia).
  await supabase
    .from('organizations')
    .update({
      analysis_running_by: userId,
      analysis_running_since: new Date().toISOString(),
      analysis_running_type: type,
    })
    .eq('id', orgId);

  return { acquired: true };
}

/**
 * Libera el semaforo (pone los tres campos a NULL) SOLO si lo tiene el usuario
 * indicado. Idempotente en dos sentidos: llamarlo sin semaforo puesto no hace
 * nada, y llamarlo cuando el semaforo lo tiene OTRO usuario tampoco — antes
 * liberaba el candado ajeno, que permitia analisis en paralelo no deseados.
 * Se invoca en el finally del endpoint como cortesia de latencia; la
 * auto-expiracion sigue siendo la garantia real.
 */
export async function releaseAnalysisLock(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from('organizations')
    .update({
      analysis_running_by: null,
      analysis_running_since: null,
      analysis_running_type: null,
    })
    .eq('id', orgId)
    .eq('analysis_running_by', userId);
}

/**
 * Construye el mensaje del 409 para un semaforo ocupado (F-14: tipo + desde cuando,
 * sin nombre de usuario ni de documento — orientar la espera sin joins ni acoplamientos).
 */
export function analysisLockMessage(result: { runningType: AnalysisType; minutesAgo: number }): string {
  const tipo = result.runningType === 'exhaustive' ? 'exhaustivo' : 'rápido';
  const tiempo = result.minutesAgo === 1 ? 'hace 1 minuto' : `hace ${result.minutesAgo} minutos`;
  return `Hay un análisis ${tipo} en curso desde ${tiempo}. Espera a que termine antes de lanzar otro.`;
}
