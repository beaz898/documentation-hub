import type { StageFailure } from './types';

/**
 * LOS AVISOS DE UN ANÁLISIS, Y POR QUÉ SON DOS Y NO UNO (regla 6, 02/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA: hasta hoy, si `saveAnalysisResult` fallaba, los dos
 * consumidores lo comprobaban y escribían en consola. El usuario veía su
 * análisis, cerraba, y no estaba ni en la bandeja ni en la analítica. Un
 * resultado correcto sobre algo que no existe.
 *
 * NO SE ESCONDE EL RESULTADO (F-94 P4): el usuario pagó y la información es
 * verdadera. Se entrega, y se le dice que no ha quedado guardado.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ SON DOS AVISOS INDEPENDIENTES, y esta función existe sobre todo para que
 * nadie los mezcle:
 *
 *   · ETAPAS CAÍDAS — el análisis está DEGRADADO. Alguna etapa cayó a su
 *     fallback y el resultado no es una foto completa del corpus. Dispara el
 *     reembolso automático (`analyze-v2`).
 *   · NO GUARDADO — el análisis es BUENO y no está en ninguna parte. NO dispara
 *     reembolso: el usuario recibió exactamente lo que pagó.
 *
 * Meter el segundo dentro de `stageFailures` —que es lo cómodo, porque el aviso
 * ya existe— mentiría sobre la calidad del análisis Y dispararía un reembolso
 * que aquí no toca. Por eso el caso «no guardado y sin etapas caídas» comprueba
 * que `etapasCaidas` sigue valiendo CERO.
 *
 * ⚠️ Y ES `guardado === false`, NO `!guardado`. La diferencia es toda la
 * compatibilidad: lo que llega SIN el campo —el jsonb de la bandeja, que por
 * definición sí está guardado, y cualquier respuesta anterior a este
 * despliegue— tiene que salir sin aviso. Con `!guardado`, `undefined` avisaría
 * y la bandeja se llenaría de alarmas sobre análisis que sí existen.
 */
export interface EntradaDeAvisos {
  /** `true` guardado, `false` falló, AUSENTE = no se sabe y se asume guardado. */
  guardado?: boolean;
  stageFailures?: StageFailure[];
}

export interface AvisosDelAnalisis {
  noGuardado: boolean;
  etapasCaidas: number;
}

/**
 * ¿SE GUARDÓ EL RESULTADO DE ESTE JOB? (B.143, 02/09/2026)
 *
 * El camino EXHAUSTIVO no pasa por la respuesta de `/api/analyze-v2`: lo guarda
 * el worker, fuera de Vercel, y el dato viaja por la fila del job. Esta función
 * es la traducción de esa columna al mismo vocabulario que usa el resto.
 *
 * ⚠️ `=== false` Y NO `!x`, por la misma razón que en `avisosDelAnalisis`: llega
 * `undefined` mientras el job no ha terminado, en los jobs `failed`, y por
 * cualquier lector que no pida la columna. AUSENTE = guardado, y la columna
 * nace con `DEFAULT true` justamente para que las filas anteriores a la
 * migración no disparen avisos sobre análisis que existen.
 */
export function guardadoDeJob(resultSaved: boolean | null | undefined): boolean {
  return resultSaved !== false;
}

export function avisosDelAnalisis(entrada: EntradaDeAvisos): AvisosDelAnalisis {
  return {
    noGuardado: entrada.guardado === false,
    etapasCaidas: entrada.stageFailures?.length ?? 0,
  };
}
