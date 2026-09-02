/**
 * EL RECUENTO DE LO QUE SE PIERDE AL REGISTRAR (regla 6, 02/09/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ ARREGLA: los dos escritores de uso —`logUsage` sobre `usage_logs` y
 * `persistLLMUsage` sobre `llm_usage`— se tragan su fallo con un `console.warn`
 * de prefijo distinto, sin org, sin endpoint y sin distinguir el error de
 * consulta de la excepción. Grepear eso no da un número, así que hoy NADIE SABE
 * cuántas filas de uso se pierden.
 *
 * ESTO NO ARREGLA LA PÉRDIDA. No hay búfer, no hay tabla nueva, no hay reintento
 * y no cambia ningún comportamiento: los dos escritores siguen sin propagar su
 * error, que es lo que mantiene el fire-and-forget. Lo único que cambia es que
 * lo mudo pasa a ser contable.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ POR QUÉ NO SE CONSTRUYE EL BÚFER QUE F-94 P4 PEDÍA: «búfer durable en el
 * propio análisis» significa Supabase, y si el registro falla porque Supabase no
 * responde, el búfer falla por lo mismo. La otra salida —la fila del job— cubre
 * solo el camino del worker y, sobre todo, NO TOCA `usage_logs`, que es la única
 * de las dos tablas con consecuencia real. Antes de construir, medir.
 *
 * ⚠️ Y EL RECUENTO CONTESTA DOS PREGUNTAS, no una:
 *
 *   1. LA NUESTRA — ¿búfer, reintento o nada? La contesta el reparto por CAUSA:
 *      si casi todo son `consulta_fallida` con la base viva, lo que hace falta
 *      es un reintento; si son `excepcion`, es otra cosa.
 *
 *   2. LA DEL NEGOCIO — CUÁNTA CUOTA SE ESTÁ REGALANDO. `usage_logs` no es
 *      analítica: es lo que `checkRateLimit` cuenta para saber cuántas llamadas
 *      lleva hoy un usuario. Cada fila perdida ahí es UNA LLAMADA REGALADA, y
 *      regalada justo cuando la base va peor. La contesta el mismo recuento
 *      filtrado por tabla.
 *
 * Por eso la TABLA va siempre en la línea aunque para la primera pregunta
 * bastara la causa: un marcador que no las separase serviría para la mitad.
 */

/** Las dos tablas de uso que se escriben en silencio. Vocabulario CERRADO. */
export type TablaDeUso = 'usage_logs' | 'llm_usage';

/**
 * Por qué se perdió. Misma distinción que el limitador y por la misma razón: si
 * las dos causas no se distinguen, el registro existe y no sirve.
 * · `consulta_fallida` — la base contestó y dijo que no (esquema, RLS, timeout
 *   de esa consulta). Es el caso que un reintento arreglaría.
 * · `excepcion` — no hubo respuesta. Es el caso que un reintento no arregla.
 */
export type CausaDePerdida = 'consulta_fallida' | 'excepcion';

/**
 * EL MARCADOR. Fijo, idéntico en los dos escritores, y ésa es toda su función:
 * un solo `grep` sobre los logs de Vercel y de Railway cuenta las dos pérdidas.
 * Si cada escritor pusiera el suyo, habría que conocer los dos para contar — y
 * contar de menos sería lo fácil.
 */
export const MARCADOR_DE_PERDIDA = '[perdida-de-registro]';

/** Cuando no hay org que anotar. Explícito y no cadena vacía: una cadena vacía
 *  en el sitio de un dato se lee como un dato. */
const SIN_ORG = 'org=desconocida';

export function lineaDePerdida(params: {
  tabla: TablaDeUso;
  causa: CausaDePerdida;
  orgId?: string;
  /** El endpoint (`/api/ask`) o la operación (`analyze_exhaustive`). Los dos
   *  escritores nombran cosas distintas, así que el campo es uno con nombre
   *  neutro: unificar sus vocabularios sería inventarlos. */
  referencia?: string;
  detalle?: string;
}): string {
  const partes = [
    MARCADOR_DE_PERDIDA,
    `tabla=${params.tabla}`,
    `causa=${params.causa}`,
    params.orgId ? `org=${params.orgId}` : SIN_ORG,
    `ref=${params.referencia ?? 'desconocida'}`,
  ];
  if (params.detalle) partes.push(`detalle=${params.detalle}`);
  return partes.join(' ');
}

/**
 * Deja la línea en el log. NO LANZA y no devuelve nada: se llama desde dentro
 * de los `catch` que ya existen, y un fallo aquí no puede tapar nada.
 *
 * SOLO SE LLAMA CUANDO HAY PÉRDIDA: una escritura que funciona no pasa por aquí
 * y no deja marcador. Esa mitad no es una rama de esta función —sería una rama
 * que nunca se toma—, así que se comprueba leyendo los dos escritores.
 */
export function registrarPerdida(params: Parameters<typeof lineaDePerdida>[0]): void {
  console.warn(lineaDePerdida(params));
}
