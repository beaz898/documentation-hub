import type { PipelineCounters } from './counters';

/**
 * LOS EMISORES DE `seleccion.*`, CADA UNO CON TODAS SUS CLAVES — 18/09/2026.
 *
 * ⚠️ QUÉ ARREGLA, Y NO ES UN CONTADOR: la PROPIEDAD. El 15/09 se arregló que dos
 * claves del estilo se escribieran sólo cuando su recuento era mayor que cero, y
 * el caso que se escribió entonces vigilaba **esas dos por su nombre**. La batería
 * del catálogo comprueba que la lista es la declarada y que cada nombre lleva
 * apellido de etapa (`counters.test.ts`) — **nada comprobaba que una clave se
 * emita**. Así que el mismo fallo podía volver en cualquier clave nueva sin que
 * ninguna prueba se quejara, y con contadores escritos precisamente para ver lo
 * que no se ve.
 *
 * LA FORMA DEL ARREGLO: cada grupo de claves sale de UNA función pura que las
 * devuelve TODAS, siempre, también en cero. El pipeline ya no escribe claves a
 * mano: funde lo que devuelven. Y la batería recorre el catálogo y exige que cada
 * clave `seleccion.*` tenga emisor — el día que alguien añada una al catálogo sin
 * emisor, se pone roja.
 *
 * ⚠️ LA ÚNICA AUSENCIA LEGÍTIMA está declarada aparte y tiene su caso:
 * `descartados_por_criterio` falta cuando el rerank cayó a su fallback, porque
 * ahí no hubo criterio que contar (B.254, `reparto-del-rerank.ts`). Ausente y
 * cero no significan lo mismo, y esa distinción es el dato.
 */

/** Lo que decide la RECUPERACIÓN: qué trajo y qué dejó fuera su corte.
 *  ⚠️ Emitía TRES claves hasta el 23/09/2026:
 *  `candidatos_perdidos_por_umbral` se fue con las dos constantes del umbral,
 *  porque sin corte no hay nada que perder por él. El histórico persistido en
 *  `analysis_results.pipeline_counters` se conserva intacto — esa columna sólo se
 *  escribe, nunca se relee por `mergeCounters`, así que retirar la clave del
 *  catálogo no toca ni una fila de las que ya están. */
export function contadoresDeRecuperacion(args: {
  recuperados: number;
  cortadosPorTope: number;
}): PipelineCounters {
  return {
    'seleccion.candidatos_recuperados': args.recuperados,
    'seleccion.candidatos_cortados_por_tope_de_recuperacion': args.cortadosPorTope,
  };
}

/** Lo que queda del RERANK: cuántos pasaron y con cuántos no había confianza que leer. */
export function contadoresDelRerank(args: {
  seleccionados: number;
  sinConfianza: number;
}): PipelineCounters {
  return {
    'seleccion.candidatos_seleccionados': args.seleccionados,
    'seleccion.candidatos_sin_confianza': args.sinConfianza,
  };
}
