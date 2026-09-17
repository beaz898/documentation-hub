import type { UsageAccumulator } from '@/lib/observability/usage-context';

/**
 * EL REEMBOLSO POR ETAPA — decisión del director, 17/09/2026 (B.205, §5.2).
 *
 * > **Si no se gastó nada, se devuelve todo. Si se gastó algo, no se devuelve
 * > nada.** Sin mitades: el reparto lo decide dónde murió el trabajo.
 *
 * «Gastar» es LLAMAR AL MODELO. Se sabe mirando el acumulador de uso: cada
 * llamada que el proveedor factura suma ahí en el momento de hacerse
 * (`recordToContext`). Uno vacío dice que no se facturó ninguna; uno con tokens,
 * que sí.
 *
 * ⚠️ LO QUE ESTA REGLA NO DECIDE, y se dice aquí para que nadie lo complete de
 * memoria:
 *   · Los análisis INCOMPLETOS de F-71 —etapa del modelo caída, resultado
 *     parcial entregado— se siguen devolviendo ÍNTEGROS. Esa es otra regla, ya
 *     decidida, y esta no la toca.
 *   · Un job zombi que llegó a estar EN PROCESO: su acumulador murió con el
 *     proceso y no se sabe dónde murió. No hay dato para aplicar la regla.
 */

/** Dónde murió el trabajo, según lo único que lo sabe: el acumulador. */
export type DondeMurio = 'antes_del_modelo' | 'tras_llamar_al_modelo';

export function dondeMurio(acumulador: UsageAccumulator): DondeMurio {
  for (const uso of acumulador.values()) {
    if (uso.inputTokens + uso.outputTokens + uso.cacheCreationTokens + uso.cacheReadTokens > 0) {
      return 'tras_llamar_al_modelo';
    }
  }
  return 'antes_del_modelo';
}

/**
 * CUÁNTO DEVUELVE LA RUTA DE ANÁLISIS cuando la petición termina.
 *
 *  · sin cobro pendiente → 0.
 *  · el job exhaustivo quedó ENCOLADO → 0: su dinero lo gobierna el worker.
 *  · no se llegó a empezar el análisis → todo, salga como salga.
 *  · se empezó y terminó SIN excepción → 0: se entregó (los incompletos de F-71
 *    ya se devolvieron por su camino, y dejan el cobro pendiente a 0).
 *  · se empezó y terminó en EXCEPCIÓN → la regla: todo si no llamó al modelo,
 *    nada si llamó.
 */
export function reembolsoDelAnalisis(p: {
  cobroPendiente: number;
  trabajoEncolado: boolean;
  analisisIniciado: boolean;
  terminoEnExcepcion: boolean;
  acumulador: UsageAccumulator;
}): number {
  if (p.cobroPendiente <= 0) return 0;
  if (p.trabajoEncolado) return 0;
  if (!p.analisisIniciado) return p.cobroPendiente;
  if (!p.terminoEnExcepcion) return 0;
  return dondeMurio(p.acumulador) === 'antes_del_modelo' ? p.cobroPendiente : 0;
}

/**
 * CUÁNTO DEVUELVE EL WORKER cuando un job cae en su `catch`.
 *
 * `yaDevuelto` existe porque el worker devuelve en tres sitios dentro del `try`
 * (incompleto, reanálisis, precio variable). Si después de uno de ellos algo
 * lanzara, el `catch` no puede devolver otra vez — y el acumulador no basta para
 * impedirlo: un incompleto cuyas llamadas fallaron TODAS lo deja vacío.
 */
export function reembolsoDelTrabajoFallido(p: {
  cobrado: number;
  yaDevuelto: boolean;
  acumulador: UsageAccumulator;
}): number {
  if (p.yaDevuelto || p.cobrado <= 0) return 0;
  return dondeMurio(p.acumulador) === 'antes_del_modelo' ? p.cobrado : 0;
}
