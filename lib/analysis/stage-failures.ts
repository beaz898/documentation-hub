import { AsyncLocalStorage } from 'async_hooks';
import type { StageFailure } from './types';

/**
 * Registro de etapas que cayeron a su fallback por fallo del LLM (F-71).
 *
 * EL PROBLEMA QUE RESUELVE: las diez etapas del pipeline atrapan el error de su
 * llamada al LLM y siguen con un valor por defecto — el rerank con los primeros
 * por score, el juez con un juicio vacío, la síntesis con una recomendación
 * calculada sin modelo. Cada una deja un `console.warn` y nada más, así que el
 * análisis se entrega con la misma forma que uno bueno y se cobra igual. El
 * cliente lee "ninguno presenta solapamiento significativo" cuando no se evaluó
 * ninguno.
 *
 * POR QUÉ AsyncLocalStorage y no un parámetro: los diez puntos están repartidos
 * en ocho ficheros y a tres niveles de profundidad de llamada (pipeline →
 * judgeAllDocuments → judgeSingleDocument). Pasar un acumulador por firma
 * obligaría a tocar todas esas firmas y las de sus intermedias, que es
 * exactamente la plomería que este frente no quiere. Es además el patrón que el
 * proyecto ya usa para lo mismo: ver `usageContext` en
 * lib/observability/usage-context.ts, que acumula tokens por el mismo camino.
 *
 * POR QUÉ NO una variable de módulo: hay análisis simultáneos. El semáforo de
 * concurrencia (F-13/F-14) es POR ORGANIZACIÓN, no global — dos orgs analizando
 * a la vez en la misma instancia compartirían el array y se mezclarían las
 * caídas. AsyncLocalStorage aísla por árbol de llamadas, que es justo el ámbito
 * de un análisis.
 *
 * UNA ENTRADA POR CAÍDA, no por etapa: si el juicio cae para tres candidatos,
 * hay tres entradas con stage 'judge'. El recuento importa — es la diferencia
 * entre "falló un documento" y "falló todo".
 */
export const stageFailureContext = new AsyncLocalStorage<StageFailure[]>();

/** Recorte del mensaje de error. Suficiente para reconocer la causa (un
 *  "HTTP 400: {...credit balance...}" cabe entero) sin que un stack largo
 *  infle el jsonb que se persiste. */
const MAX_DETAIL_CHARS = 300;

/**
 * Anota que una etapa cayó a su fallback. No lanza si no hay contexto activo
 * (llamada fuera de un `run()`, como en pruebas sueltas): el fallback sigue
 * funcionando igual, simplemente no queda registrado.
 *
 * NO sustituye al `console.warn` de cada etapa: se añade. El log sirve para
 * diagnosticar en Vercel/Railway; esto sirve para que el resultado lo diga.
 */
export function recordStageFailure(stage: string, err: unknown): void {
  const store = stageFailureContext.getStore();
  if (!store) return;

  const raw = err instanceof Error ? err.message : String(err);
  store.push({
    stage,
    detail: raw.length > MAX_DETAIL_CHARS ? `${raw.slice(0, MAX_DETAIL_CHARS)}…` : raw,
  });
}
