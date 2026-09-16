/**
 * POR DÓNDE SE PIERDE CADA CANDIDATO — B.251.
 *
 * El aviso de cobertura decía «tiene menor afinidad y no entró en la
 * comparación», que es la explicación del TOPE, para una pasada donde el tope
 * no cortó nada. Se podía decir porque la única cifra que había era la resta
 * `recuperados − seleccionados`, y esa resta **mezcla causas distintas**.
 *
 * Aquí se parten, y se parten con lo que ya viaja: la lista de ids que el
 * modelo devuelve y la lista de candidatos que se le dieron.
 *
 * ⚠️ SON DOS CUBOS Y UNA SEÑAL, no tres cubos. Es la parte que hay que entender
 * antes de leer las cifras:
 *
 *   · **descartadosPorCriterio** — candidatos que el modelo NO nombró. Los
 *     miró y decidió que no aportan. Es una DECISIÓN.
 *   · **cortadosPorTope** — elegidos que no cupieron. Es PRESUPUESTO.
 *     Los dos juntos son la pérdida entera: recuperados = criterio + elegidos,
 *     y elegidos = tope + finales. No hay un tercer sitio por donde caerse.
 *   · **idsNoReconocidos** — entradas del modelo que no casan con ningún
 *     candidato (`rerank.ts`: `if (!candidate) continue`). **No es un cubo:
 *     se SOLAPA con el primero.** Cuando el modelo pide un documento con un id
 *     que no sabemos resolver, ese candidato se queda contado como «descartado
 *     por criterio» — y no lo fue: lo quisimos y no supimos encontrarlo.
 *
 * ⚠️ POR ESO SU CERO IMPORTA MÁS QUE SU NO-CERO, y por eso se escribe siempre.
 * `idsNoReconocidos = 0` es lo que hace CIERTA la palabra «criterio» en el otro
 * contador. Si sube, la cifra de criterio está contaminada y el aviso no puede
 * decir por qué se quedó fuera un documento. Es la regla del denominador: el
 * cero sólo vale si el camino que lo produjo puede demostrar que miró.
 */

export interface RepartoDelRerank {
  /** Lo que llegó del retrieval. */
  recuperados: number;
  /** Candidatos que el modelo nombró y supimos resolver. */
  elegidosPorElModelo: number;
  /** Candidatos que el modelo no nombró: los miró y no los quiso. */
  descartadosPorCriterio: number;
  /** Elegidos que no cupieron en el tope. */
  cortadosPorTope: number;
  /** ⚠️ Entradas del modelo que no casan con ningún candidato. Contamina
   *  `descartadosPorCriterio`: ver la cabecera. */
  idsNoReconocidos: number;
}

export function repartirCandidatos(args: {
  /** Ids de los candidatos que se le dieron al modelo. */
  idsRecuperados: string[];
  /** Ids tal y como el modelo los devolvió, en crudo y con sus repeticiones. */
  idsDevueltosPorElModelo: string[];
  maxSelected: number;
}): RepartoDelRerank {
  const { idsRecuperados, idsDevueltosPorElModelo, maxSelected } = args;

  const recuperadosUnicos = new Set(idsRecuperados);

  // ⚠️ ÚNICOS, Y NO ES UN DETALLE. Un modelo puede nombrar el mismo documento
  // dos veces; `find` lo resolvería las dos y el candidato entraría duplicado,
  // gastando dos plazas del tope con el mismo documento. Contar por conjunto
  // hace que ese caso no infle la cifra de elegidos — y que el duplicado, si
  // llega, no se lleve por delante a otro candidato en el recuento.
  const elegidos = new Set<string>();
  let idsNoReconocidos = 0;
  for (const id of idsDevueltosPorElModelo) {
    if (recuperadosUnicos.has(id)) elegidos.add(id);
    else idsNoReconocidos += 1;
  }

  const elegidosPorElModelo = elegidos.size;

  return {
    recuperados: recuperadosUnicos.size,
    elegidosPorElModelo,
    // Lo que el modelo no nombró. Nunca negativo: `elegidos` es subconjunto de
    // `recuperadosUnicos` por construcción.
    descartadosPorCriterio: recuperadosUnicos.size - elegidosPorElModelo,
    cortadosPorTope: Math.max(0, elegidosPorElModelo - maxSelected),
    idsNoReconocidos,
  };
}

/**
 * LA INVARIANTE QUE SOSTIENE EL REPARTO, y que su batería vigila:
 *
 *     recuperados === descartadosPorCriterio + elegidosPorElModelo
 *
 * Es lo que hace cierta la frase «no hay un tercer sitio por donde caerse»: un
 * candidato evaluado no puede desaparecer sin dejar rastro en exactamente uno
 * de los dos destinos. Se expone como función para que la comprueben las
 * pruebas y quien quiera auditar una fila de contadores.
 */
export function elRepartoCuadra(r: RepartoDelRerank): boolean {
  return r.recuperados === r.descartadosPorCriterio + r.elegidosPorElModelo;
}
