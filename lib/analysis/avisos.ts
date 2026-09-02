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

export function avisosDelAnalisis(entrada: EntradaDeAvisos): AvisosDelAnalisis {
  return {
    noGuardado: entrada.guardado === false,
    etapasCaidas: entrada.stageFailures?.length ?? 0,
  };
}
