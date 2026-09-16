/**
 * POR DÓNDE SE PIERDE CADA CANDIDATO — B.251, y su corrección B.253/B.254.
 *
 * El aviso de cobertura decía «tiene menor afinidad y no entró en la
 * comparación», que es la explicación del TOPE, para una pasada donde el tope
 * no cortó nada. Se podía decir porque la única cifra que había era la resta
 * `recuperados − seleccionados`, y esa resta **mezcla causas distintas**.
 *
 * ⚠️ UN CRITERIO, UNA VEZ (B.253). La primera versión de este fichero volvía a
 * resolver los ids del modelo POR SU CUENTA, contando por conjunto, mientras
 * `rerank.ts` los resolvía con `find` sobre la lista y SIN quitar repetidos.
 * Dos implementaciones de «qué eligió el modelo», y se separaron desde el
 * primer día: con `[A, A, B]` el reparto decía «dos elegidos» y el rerank
 * mandaba TRES al juez. Ahora la resolución vive aquí (`resolverSeleccion`) y
 * `rerank.ts` construye la selección CON SU RESULTADO — no la recalcula.
 *
 * ⚠️ SON DOS CUBOS Y DOS SEÑALES, no cuatro cubos:
 *
 *   · **descartadosPorCriterio** — candidatos que el modelo NO nombró. Los
 *     miró y decidió que no aportan. Es una DECISIÓN.
 *   · **cortadosPorTope** — elegidos que no cupieron. Es PRESUPUESTO.
 *     Los dos juntos son la pérdida entera: recuperados = criterio + elegidos,
 *     y elegidos = tope + finales. No hay un tercer sitio por donde caerse.
 *   · **idsNoReconocidos** — entradas del modelo que no casan con ningún
 *     candidato. **No es un cubo: se SOLAPA con el primero.** Cuando el modelo
 *     pide un documento con un id que no sabemos resolver, ese candidato se
 *     queda contado como «descartado por criterio» — y no lo fue.
 *   · **repetidos** — entradas del modelo que nombran un candidato YA nombrado.
 *     No es un cubo tampoco: no hay candidato que se pierda por ahí. **Es lo
 *     que se pagaba sin verlo**: hasta B.253 cada repetición entraba en la
 *     selección, ocupaba una plaza del tope —dejando fuera a OTRO documento— y
 *     el juez comparaba el mismo documento dos veces, cobrándolo dos veces.
 *
 * ⚠️ Y EL FALLBACK NO TIENE REPARTO (B.254). Si el modelo no contesta, no hay
 * criterio que contar: los que entran salen del score del retrieval. La
 * versión anterior calculaba igualmente `recuperados − elegidos` y lo guardaba
 * como «descartados por criterio» de documentos que ningún modelo miró. El
 * tipo ahora tiene DOS FORMAS, y la del fallback no lleva el campo — para que
 * nadie pueda leer un criterio donde no lo hubo.
 */

import type { PipelineCounters } from './counters';

/** Lo que el modelo devuelve por cada candidato que selecciona. */
export interface EntradaDelModelo {
  documentId: string;
}

/** Candidato mínimo que la resolución necesita. */
export interface ConId {
  documentId: string;
}

export interface SeleccionResuelta<C extends ConId, E extends EntradaDelModelo> {
  /** Un par por candidato elegido, SIN repetidos, en el orden en que el
   *  modelo los nombró por primera vez. */
  resueltos: Array<{ candidato: C; entrada: E }>;
  idsNoReconocidos: number;
  repetidos: number;
}

/**
 * LA ÚNICA RESOLUCIÓN de lo que devolvió el modelo. `rerank.ts` construye la
 * selección con `resueltos` y el reparto con las mismas cifras: si alguien
 * vuelve a resolver los ids en otro sitio, las dos cuentas se separarán igual
 * que se separaron la primera vez.
 *
 * ⚠️ SE QUEDA CON LA PRIMERA APARICIÓN y descarta las siguientes. La primera,
 * y no la de mayor confianza, porque no hay un criterio que haga una mejor que
 * otra: son el mismo documento nombrado dos veces. Lo que importa es que entre
 * UNA vez.
 */
export function resolverSeleccion<C extends ConId, E extends EntradaDelModelo>(
  candidatos: C[],
  entradas: E[],
): SeleccionResuelta<C, E> {
  const porId = new Map<string, C>();
  for (const c of candidatos) {
    if (!porId.has(c.documentId)) porId.set(c.documentId, c);
  }

  const vistos = new Set<string>();
  const resueltos: Array<{ candidato: C; entrada: E }> = [];
  let idsNoReconocidos = 0;
  let repetidos = 0;

  for (const entrada of entradas) {
    const candidato = porId.get(entrada.documentId);
    if (!candidato) {
      idsNoReconocidos += 1;
      continue;
    }
    if (vistos.has(candidato.documentId)) {
      repetidos += 1;
      continue;
    }
    vistos.add(candidato.documentId);
    resueltos.push({ candidato, entrada });
  }

  return { resueltos, idsNoReconocidos, repetidos };
}

/** El reparto cuando el modelo CONTESTÓ. */
export interface RepartoConModelo {
  origen: 'modelo';
  /** Lo que llegó del retrieval, sin repetidos. */
  recuperados: number;
  /** Candidatos que el modelo nombró y supimos resolver, una vez cada uno. */
  elegidosPorElModelo: number;
  /** Candidatos que el modelo no nombró: los miró y no los quiso. */
  descartadosPorCriterio: number;
  /** Elegidos que no cupieron en el tope. */
  cortadosPorTope: number;
  /** ⚠️ Entradas del modelo que no casan con ningún candidato. Contamina
   *  `descartadosPorCriterio`: ver la cabecera. */
  idsNoReconocidos: number;
  /** Entradas que repetían un candidato ya nombrado. Ya no entran. */
  repetidos: number;
}

/**
 * El reparto cuando el modelo NO contestó.
 *
 * ⚠️ AQUÍ SE ROMPE, A PROPÓSITO, LA INVARIANTE `recuperados = criterio +
 * elegidos`. No hay criterio —nadie miró los candidatos— y por eso el campo
 * NO EXISTE en esta forma: ni cero ni resta. Un cero diría que el modelo no
 * descartó nada; la resta diría que descartó lo que el score dejó fuera. Las
 * dos cosas son falsas. Por qué falta lo registra `analysis.stageFailures`
 * con la etapa `rerank` (`synthesize.ts`, `markIncompleteAnalysis`).
 */
export interface RepartoSinModelo {
  origen: 'fallback';
  recuperados: number;
  /** Los que entraron por score de embedding, sin juicio de nadie. */
  seleccionadosPorScore: number;
}

export type RepartoDelRerank = RepartoConModelo | RepartoSinModelo;

export function repartoConModelo(args: {
  recuperados: number;
  elegidosPorElModelo: number;
  idsNoReconocidos: number;
  repetidos: number;
  maxSelected: number;
}): RepartoConModelo {
  const { recuperados, elegidosPorElModelo, idsNoReconocidos, repetidos, maxSelected } = args;
  return {
    origen: 'modelo',
    recuperados,
    elegidosPorElModelo,
    // Nunca negativo: los elegidos salen de `resolverSeleccion`, que sólo
    // devuelve candidatos recuperados y cada uno una vez.
    descartadosPorCriterio: Math.max(0, recuperados - elegidosPorElModelo),
    cortadosPorTope: Math.max(0, elegidosPorElModelo - maxSelected),
    idsNoReconocidos,
    repetidos,
  };
}

export function repartoSinModelo(args: {
  recuperados: number;
  seleccionadosPorScore: number;
}): RepartoSinModelo {
  return { origen: 'fallback', ...args };
}

/**
 * LA ESCRITURA EN `pipeline_counters`, aquí y no en el pipeline, para que la
 * ausencia del criterio en el fallback tenga una prueba que la vigile. Si
 * viviera en `pipeline.ts`, un `?? 0` no lo cazaría nadie.
 */
export function escribirContadoresDelReparto(
  counters: PipelineCounters,
  reparto: RepartoDelRerank,
): void {
  const c = contadoresDelReparto(reparto);
  counters['seleccion.candidatos_cortados_por_tope'] = c.cortadosPorTope;
  counters['seleccion.candidatos_con_id_no_reconocido'] = c.idsNoReconocidos;
  counters['seleccion.candidatos_repetidos_por_el_modelo'] = c.repetidos;
  // ⚠️ EL ÚNICO QUE PUEDE FALTAR (B.254): en el fallback no se escribe, y
  // queda AUSENTE —«la etapa no corrió»—, no a cero.
  if (c.descartadosPorCriterio !== undefined) {
    counters['seleccion.candidatos_descartados_por_criterio'] = c.descartadosPorCriterio;
  }
}

/** Lo que el pipeline escribe en `pipeline_counters` a partir del reparto. */
export interface ContadoresDelReparto {
  cortadosPorTope: number;
  idsNoReconocidos: number;
  repetidos: number;
  /** ⚠️ `undefined` en el fallback, y quien lo escribe NO lo convierte en 0. */
  descartadosPorCriterio: number | undefined;
}

/**
 * QUÉ SE ESCRIBE, decidido aquí y no en el pipeline, para que tenga prueba.
 *
 * En el fallback, tope, ids no reconocidos y repetidos valen 0, y ese cero es
 * VERDAD: el tope no cortó nada, no hubo ids que reconocer ni repeticiones.
 * El criterio NO vale 0 —diría que el modelo no descartó ninguno, cuando no
 * miró ninguno— y por eso vuelve `undefined`: el contador queda AUSENTE, que
 * en `PipelineCounters` significa «la etapa no corrió» (B.254).
 */
export function contadoresDelReparto(r: RepartoDelRerank): ContadoresDelReparto {
  if (r.origen === 'fallback') {
    return { cortadosPorTope: 0, idsNoReconocidos: 0, repetidos: 0, descartadosPorCriterio: undefined };
  }
  return {
    cortadosPorTope: r.cortadosPorTope,
    idsNoReconocidos: r.idsNoReconocidos,
    repetidos: r.repetidos,
    descartadosPorCriterio: r.descartadosPorCriterio,
  };
}

/**
 * LA INVARIANTE QUE SOSTIENE EL REPARTO, y que su batería vigila:
 *
 *     recuperados === descartadosPorCriterio + elegidosPorElModelo
 *
 * Es lo que hace cierta la frase «no hay un tercer sitio por donde caerse».
 *
 * ⚠️ SÓLO ACEPTA EL REPARTO CON MODELO, y es la forma de declarar la
 * excepción: en el fallback la invariante no se cumple porque no hay criterio,
 * y el compilador obliga a quien quiera comprobarla a mirar antes `origen`.
 */
export function elRepartoCuadra(r: RepartoConModelo): boolean {
  return r.recuperados === r.descartadosPorCriterio + r.elegidosPorElModelo;
}
