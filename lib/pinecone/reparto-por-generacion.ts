import { parseVectorId } from './vectors';

/**
 * EL REPARTO POR GENERACIÓN DE UNA LISTA DE IDS — F-114 (21/09/2026).
 *
 * ⚠️ PARA QUÉ EXISTE. Un documento borrado puede dejar vectores de UNA de sus
 * generaciones si el borrado por filtro falló: la otra vía sólo construye ids de
 * `active_generation` (B.73, `delete-document.ts`). Saber **de qué generación**
 * son los supervivientes es lo que distingue «el borrado se quedó corto» de
 * «alguien los escribió después», y son dos fallos distintos con dos arreglos
 * distintos.
 *
 * ⚠️ Y LA GENERACIÓN SE LEE DEL ID, NO SE SUPONE: `parseVectorId` la saca del
 * propio nombre del vector —`…-g2-7`, o sin marca para la 1 implícita— así que
 * este reparto no puede heredar B.73. Un id que no encaje en ninguno de los dos
 * formatos es una ANOMALÍA y se cuenta aparte: tirarlo en silencio dejaría sin
 * explicar la diferencia entre lo listado y lo repartido.
 *
 * Función pura: no lee nada y no escribe nada.
 */
export interface RepartoPorGeneracion {
  /** `generación → cuántos ids`. Las claves son números en texto, para el JSON. */
  porGeneracion: Record<string, number>;
  /** Ids que `parseVectorId` no supo descomponer. ⚠️ Esperado CERO. */
  anomalos: string[];
}

export function repartoPorGeneracion(ids: string[]): RepartoPorGeneracion {
  const porGeneracion: Record<string, number> = {};
  const anomalos: string[] = [];

  for (const id of ids) {
    const partes = parseVectorId(id);
    if (partes === null) {
      anomalos.push(id);
      continue;
    }
    const clave = String(partes.generation);
    porGeneracion[clave] = (porGeneracion[clave] ?? 0) + 1;
  }

  return { porGeneracion, anomalos };
}

/**
 * ¿Cuadra el reparto con lo listado? `ids = repartidos + anómalos`.
 *
 * Existe por lo mismo que el cuadre del termómetro: un reparto que no suma el
 * total no es un reparto, y sin esta comprobación un id perdido por el camino
 * pasaría por «esa generación no tenía vectores».
 */
export function elRepartoDeGeneracionesCuadra(ids: string[], reparto: RepartoPorGeneracion): boolean {
  const repartidos = Object.values(reparto.porGeneracion).reduce((a, b) => a + b, 0);
  return repartidos + reparto.anomalos.length === ids.length;
}
