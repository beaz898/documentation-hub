import { HAIKU_55_MODEL, HAIKU_MODEL } from '@/lib/llm/modelos';

/**
 * F-128 (19/10/2026): EL MODELO DEL JUEZ, y sólo del juez. El rerank, el verificador, la síntesis,
 * el double-check y el agente no lo leen: si se cambiaran varias piezas a la vez no se sabría cuál
 * movió el resultado.
 *
 * Sin la variable, el juez llama EXACTAMENTE como antes de F-128: Haiku 4.5 y un cuerpo de petición
 * sin `output_config`. La única forma de encender Haiku 5.5 es el valor exacto `claude-haiku-5-5`;
 * cualquier otro valor deja Haiku 4.5 y lo dice en el log, para que no se pueda encender ni apagar
 * por accidente sin que se vea (el mismo criterio que `interruptorParejaEntera`, judge.ts).
 *
 * ⚠️ VOLVER ATRÁS EXIGE UN DESPLIEGUE: en Vercel un cambio de variable sólo se aplica al desplegar,
 * y en Railway reinicia el servicio. Lo decidió el arquitecto el 19/10/2026 —retiró el requisito de
 * revertir en caliente porque no hay ningún servicio en uso—; el día que lo haya, la alternativa es
 * una fila de ajustes leída en cada análisis (claude/Estado_Y_Pendientes_14-10-2026.md, 3.1.8).
 */
export const VARIABLE_MODELO_DEL_JUEZ = 'ANALYSIS_JUDGE_MODEL';

export interface ModeloDelJuez {
  modelo: string;
  maxOutputTokens: number;
  /** Ausente con Haiku 5.5: no admite ninguna temperatura que no sea 1, y la guía de migración
   *  recomienda omitirla. */
  temperature?: number;
  /** Sólo con Haiku 5.5: Haiku 4.5 no está entre los modelos que admiten `output_config`. */
  outputConfig?: { effort: 'medium' };
}

/** Haiku 4.5: la llamada del juez EXACTAMENTE como antes de F-128. */
const CON_HAIKU_45: ModeloDelJuez = { modelo: HAIKU_MODEL, maxOutputTokens: 4096, temperature: 0.1 };

export function modeloDelJuez(): ModeloDelJuez {
  const valor = process.env[VARIABLE_MODELO_DEL_JUEZ];
  if (valor === undefined || valor === HAIKU_MODEL) return CON_HAIKU_45;
  if (valor === HAIKU_55_MODEL) {
    // EL DIAL DE ESFUERZO, FIJADO Y NO DEJADO AL DEFECTO (arquitecto, 19/10/2026): `medium` es hoy
    // el valor por defecto de Haiku 5.5, y mandarlo se comporta exactamente igual que omitirlo
    // (documentación de Anthropic, verificada por el arquitecto ese día). Se manda explícito para
    // que, si el defecto cambia algún día, las mediciones sigan siendo comparables y no cambien
    // sin que nadie se entere.
    //
    // LO QUE HAIKU 5.5 RECHAZA CON UN 400, según su guía de migración (documentación de Anthropic,
    // leída por el arquitecto el 19/10/2026), y cómo se evita aquí:
    //   · `temperature` distinta de 1: NO SE MANDA (el juez la mandaba a 0,1 con 4.5). Se omite, que
    //     es lo que recomienda la guía. ⚠️ Es un confundido declarado de la prueba: 4.5 corre a 0,1 y
    //     5.5 no puede (claude/Predicciones_F128_El_Modelo_Del_Juez.md);
    //   · `top_p`, `top_k`, `thinking` en su forma vieja y el prefill de asistente: el cliente no
    //     manda ninguno en ninguna ruta, y el sufijo JSON va pegado al turno del usuario
    //     (anthropic-client.ts, callAnthropicJson), no como prefill.
    // `max_tokens` A 16.000, no a 4.096: con 5.5 los tokens de pensamiento cuentan dentro del
    // máximo y el mismo texto ocupa un 30 % más; con 4.096 la respuesta podría cortarse antes de
    // que el juez escriba nada, y se leería como un fallo de calidad cuando sería de
    // configuración. 16.000 es la cifra del ejemplo de la propia guía. Lo que gastó de verdad queda
    // en `lecturaDeLasParejas[].tokensDeSalida`.
    return { modelo: HAIKU_55_MODEL, maxOutputTokens: 16000, outputConfig: { effort: 'medium' } };
  }
  console.warn(`[judge] ${VARIABLE_MODELO_DEL_JUEZ}="${valor}" no es "${HAIKU_55_MODEL}": el juez sigue con ${HAIKU_MODEL}`);
  return CON_HAIKU_45;
}
