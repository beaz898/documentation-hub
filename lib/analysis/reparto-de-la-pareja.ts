/**
 * EL REPARTO DE LA PAREJA — el interino del 3.1.3 (F-127 P4, P5 y P7 paso 3, adenda de Fable del
 * 18/10, Q4; encargo del arquitecto del 21/10/2026).
 *
 * UNA SOLA FUNCIÓN decide cuánto de la ventana es del analizado y cuánto del candidato. La leen la
 * segunda selección (`lib/analysis/segunda-seleccion.ts`, que elige los trozos del candidato con lo que
 * le toca) y la cascada del juez (`leerLaPareja`, `lib/analysis/judge.ts`, que corta el analizado). La
 * fórmula no se escribe en ningún otro sitio.
 *
 *   · Si los dos enteros caben en la ventana P: los dos enteros.
 *   · Si no: el analizado se lleva min(A, P − reserva) y el candidato EL RESTO,
 *       resto = P − min(A, P − reserva),
 *     calculado ANTES de elegir los trozos del candidato, porque los dos tamaños se conocen antes.
 *     El candidato va entero si cabe en su resto.
 *
 * ⚠️ LA RESERVA GARANTIZA TEXTO, NO BLOQUE MONTADO (arquitecto, 21/10): son los 3.000 caracteres de
 * contenido del candidato que elige la recuperación (`presupuestoPorCandidato`, la tijera vieja), y las
 * cabeceras que esas piezas necesitan se cuentan contra P como parte de la reserva. Por eso aquí entra
 * `reservaMontada`: lo que ocupa YA MONTADO el bloque de esos 3.000 de texto. Así el invariante «ningún
 * lado recibe menos que con la tijera vieja» sigue siendo verdad y P sigue siendo honesto. Hoy es
 * inalcanzable que la reserva decida —hace falta un analizado de más de P − reserva, unos 77.000
 * caracteres, y el mayor del corpus es NOR-10 con 66.801—, y se decide ahora para que no se decida solo.
 *
 * ⚠️ EL LÍMITE DECLARADO DEL INTERINO, para que nadie espere de este paso lo que no da: la segunda
 * selección elige entre los MISMOS fragmentos que devolvió Pinecone, así que subir el resto NO hace
 * aparecer trozos que Pinecone no trajo. El interino sube lo que entra —en NOR-10 ↔ CLI-12, de 3 trozos
 * a 12 con las cabeceras contadas (12.771 montados de un resto de 13.199; contando sólo el texto, la
 * simulación del 19/10 daba 13, y el que sobra es el 26)— pero NO CIERRA ESA PAREJA: los trozos de las
 * frases sembradas B y D quedan fuera por RANKING, no
 * por presupuesto (medido en simulación el 19/10: harían falta unos 17.982 caracteres para el trozo 34 de
 * B y 20.993 para el 6 de D, y el resto es 13.199). Estado vivo, 3.1.3.
 *
 * ⚠️ Y EL TOPE DE 25 PIEZAS DEL SELECTOR SE QUEDA (`MAX_FRAGMENTS_PER_DOC_QUICK`, retrieval.ts): muerde
 * en TABLAS con pocos miles de caracteres, porque cada fila es una pieza; en prosa, a partir de unos
 * 30.000 de resto. Lo que el tope deja sin usar no se lo lleva nadie.
 */

/** La ventana del interino, en caracteres: P. Sustituye a los 40.000 (10.000 tokens) del 29/09. */
export const TAMANO_VENTANA = 80_000;

/**
 * LA VENTANA MÁS PEQUEÑA QUE ALGUIEN HA MEDIDO (arquitecto, 22/10/2026). La monotonía del reparto —ningún
 * lado recibe menos al subir P— se ha verificado barriendo P de 10.000 a 200.000 (`reparto-de-la-pareja.test.ts`)
 * y POR DEBAJO DE 10.000 NADIE HA MEDIDO NADA: producción no visita esa región (la ventana fue 40.000 y es
 * 80.000). En vez de barrerla, se cierra: `repartoDeLaPareja` se niega a repartir con una ventana menor, así
 * que la región sin verificar es inalcanzable. Bajar este número exige bajar antes el barrido.
 */
export const VENTANA_MINIMA_MEDIDA = 10_000;

export interface RepartoDeLaPareja {
  /** P, la ventana con la que se repartió. */
  ventana: number;
  /** Los dos enteros caben: no hay reparto. */
  parejaEntera: boolean;
  /** El candidato entero cabe en su resto (o en la pareja entera). */
  candidatoEntero: boolean;
  /** Lo que la fórmula PROMETE al analizado: min(A, P − reserva), o A entero. */
  paraElAnalizado: number;
  /** El resto del candidato, en caracteres YA MONTADOS: lo máximo que puede ocupar su bloque. */
  paraElCandidato: number;
}

/** El reparto de una pareja ya decidido por la segunda selección, y de dónde salió el bloque. */
export interface RepartoElegido {
  reparto: RepartoDeLaPareja;
  seleccion: 'entero' | 'ampliada' | 'la_de_la_recuperacion';
}

export function repartoDeLaPareja(a: {
  /** A: el analizado entero, tal como lo monta el juez (`buildAnalyzedDocumentText`). */
  analizado: number;
  /** C: el candidato entero, montado igual. */
  candidato: number;
  /** Lo que ocupa montado el bloque de la reserva: el de la recuperación, con sus 3.000 de texto. */
  reservaMontada: number;
  /** P. Por defecto, la ventana del interino; las pruebas la barren. */
  ventana?: number;
}): RepartoDeLaPareja {
  const P = a.ventana ?? TAMANO_VENTANA;
  if (!(P >= VENTANA_MINIMA_MEDIDA)) {
    throw new Error(`repartoDeLaPareja: ventana ${P} por debajo de ${VENTANA_MINIMA_MEDIDA}, la región que nadie ha medido`);
  }
  if (a.analizado + a.candidato <= P) {
    return { ventana: P, parejaEntera: true, candidatoEntero: true, paraElAnalizado: a.analizado, paraElCandidato: a.candidato };
  }
  // la reserva nunca es más que el candidato entero, ni más que la ventana
  const reserva = Math.min(a.reservaMontada, a.candidato, P);
  const paraElAnalizado = Math.min(a.analizado, P - reserva);
  const resto = P - paraElAnalizado;
  const candidatoEntero = a.candidato <= resto;
  return { ventana: P, parejaEntera: false, candidatoEntero, paraElAnalizado, paraElCandidato: candidatoEntero ? a.candidato : resto };
}
