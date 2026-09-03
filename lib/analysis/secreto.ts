/**
 * EL SECRETO CON EL QUE SE FIRMAN LOS ANÁLISIS (F-99, F-95 P1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PARA QUÉ EXISTE. Con el régimen efímero, el análisis del chat no se persiste
 * hasta la indexación: viaja al cliente y vuelve en la petición de indexar. Sin
 * firma, eso sería aceptar del cliente un objeto del que se derivan siete
 * columnas de negocio — exactamente la vía de fabricación que F-95 P1 prohibió.
 * La firma es lo que convierte «me lo manda el cliente» en «lo emití yo».
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ ESTE MÓDULO ES LA PRIMERA PIEZA DEL SISTEMA QUE DEPENDE DE UN SECRETO, y
 * por eso su modo de fallo se decide aquí y por escrito, no en producción.
 *
 * DOS FALLOS DISTINTOS, Y NO SE TRATAN IGUAL:
 *   · SECRETO AUSENTE O INSERVIBLE → el despliegue está mal configurado. Falla
 *     RUIDOSO: se lanza, y el llamador corta ANTES de consumir créditos. No es
 *     un caso a manejar, es una avería de infraestructura, y esconderla la haría
 *     aparecer más tarde y peor.
 *   · FIRMA INVÁLIDA con secreto presente → o alguien rotó el secreto, o alguien
 *     está fabricando. Eso NO se resuelve aquí: se resuelve donde se verifica,
 *     fallando cerrado —el análisis no se persiste, el documento sí se indexa— y
 *     con su contador.
 *
 * ⚠️ UN SECRETO AUSENTE NO ES UN SECRETO VACÍO. Escribir
 * `process.env.X ?? ''` dejaría firmar y verificar con la cadena vacía: el
 * sistema aceptaría cualquier cosa, en silencio, y «falta configuración» se
 * habría convertido en «no hay seguridad». Por eso la lectura pasa SIEMPRE por
 * aquí y nunca se hace en línea.
 */

/** El nombre exacto de la variable, en un solo sitio para que nadie lo teclee
 *  dos veces. Puesta en los tres entornos de Vercel el 03/09/2026. */
export const NOMBRE_DEL_SECRETO = 'ANALYSIS_TOKEN_SECRET';

/**
 * LÍMITE DECLARADO: por debajo de esto el secreto se considera inservible.
 *
 * No es una medida de entropía: es un cazador de los tres fallos REALES de pegar
 * un secreto a mano —la cadena vacía, un marcador de plantilla, y un pegado
 * truncado—. El valor previsto son 32 bytes en hexadecimal, o sea 64 caracteres,
 * así que 32 deja margen de sobra para un secreto legítimo más corto y sigue
 * atrapando los tres.
 */
export const LONGITUD_MINIMA_DEL_SECRETO = 32;

export interface EstadoDelSecreto {
  presente: boolean;
  /** Longitud tras recortar espacios. NUNCA el valor. */
  longitud: number;
  usable: boolean;
  /** Por qué no es usable, en términos que no revelan nada del valor. */
  motivo: string | null;
}

/**
 * QUÉ SABEMOS DEL SECRETO, sin decir qué es.
 *
 * ⚠️ NO DEVUELVE NI UN CARÁCTER DEL VALOR, y eso es la mitad de su razón de ser:
 * está pensada para que un diagnóstico de administración pueda contestar «llegó
 * al runtime y no está truncado» sin convertir el diagnóstico en una filtración.
 *
 * ⚠️ Y SE RECORTA ANTES DE MEDIR: el fallo más común al pegar un secreto en un
 * panel es un espacio o un salto de línea al final. Un secreto con basura
 * alrededor firmaría distinto en cada entorno donde se pegara distinto, y el
 * síntoma —«las firmas no verifican»— no señalaría a su causa.
 */
export function estadoDelSecreto(bruto: string | undefined | null): EstadoDelSecreto {
  if (typeof bruto !== 'string') {
    return { presente: false, longitud: 0, usable: false, motivo: 'ausente' };
  }
  const limpio = bruto.trim();
  if (limpio.length === 0) {
    return { presente: true, longitud: 0, usable: false, motivo: 'vacío' };
  }
  if (limpio.length < LONGITUD_MINIMA_DEL_SECRETO) {
    return {
      presente: true,
      longitud: limpio.length,
      usable: false,
      motivo: `demasiado corto (mínimo ${LONGITUD_MINIMA_DEL_SECRETO})`,
    };
  }
  return { presente: true, longitud: limpio.length, usable: true, motivo: null };
}

/**
 * EL SECRETO, o una avería ruidosa.
 *
 * Lanza si no es usable. El llamador NO debe atraparla para seguir sin firmar:
 * debe cortar antes de consumir créditos y devolver un error de configuración.
 * Si algún día alguien la atrapa «para que no falle», habrá reintroducido el
 * fallo silencioso que este módulo existe para impedir.
 */
export function secretoDeFirma(
  /** Se inyecta para poder probarlo: el tipo es el mínimo que hace falta, no
   *  `NodeJS.ProcessEnv`, que exige campos que aquí no pintan nada. */
  entorno: Record<string, string | undefined> = process.env,
): string {
  const bruto = entorno[NOMBRE_DEL_SECRETO];
  const estado = estadoDelSecreto(bruto);
  if (!estado.usable) {
    throw new Error(
      `${NOMBRE_DEL_SECRETO} no es usable (${estado.motivo}). ` +
      'Es un despliegue mal configurado, no un caso a manejar: revisa la variable en los tres entornos.',
    );
  }
  return (bruto as string).trim();
}
