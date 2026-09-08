/**
 * ¿SE PUEDE METER ESTA SELECCIÓN AL CORPUS, Y SI NO, POR QUÉ?
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ DEVUELVE EL MOTIVO Y LOS RECUENTOS, NO UN BOOLEANO. Un botón apagado sin
 * explicación se lee como un fallo de la aplicación — es lo que pasó con el de
 * guardar antes de B.202. Para que el usuario sepa QUÉ le falta, la respuesta
 * tiene que traer cuántos y por qué, no un `false`.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LOS DOS MOTIVOS SE CUENTAN A LA VEZ, aunque con uno bastaría para apagar
 * el botón. Si la selección falla por las dos razones y sólo se enseñara la
 * primera, el usuario quitaría los sin-analizar, volvería a pulsar y CHOCARÍA
 * OTRA VEZ con la segunda. Ver las dos de golpe es menos frustrante que
 * descubrirlas por turnos.
 *
 * ⚠️ Y SON SALIDAS DISTINTAS, que es por lo que no se funden en un contador:
 *   · sin análisis        → analízalos primero (o quítalos de la selección)
 *   · versión pendiente   → decide antes qué hacer con esa versión
 * Un único «3 no se pueden» no le dice a nadie qué hacer.
 *
 * ⚠️ LA CONDICIÓN NO SE INVENTA AQUÍ: es la MISMA que ya decide si se puede
 * abrir un documento de la bandeja (`ReviewDocumentRow`: `!stagedPending &&
 * doc.lastAnalysis`). Se extrae para que los dos la pregunten en vez de tenerla
 * cada uno por su lado.
 *
 * ⚠️ Y NO ES LA DEL BADGE DEL SIDEBAR, que cuenta `analysis_status !==
 * 'analizado'`. Parecen la misma y no lo son: aquélla pregunta «¿está pendiente
 * de revisión?» y ésta «¿ha pasado por un análisis?». Un documento puede estar
 * pendiente CON análisis —justo el que este botón quiere meter— o pendiente SIN
 * él. Fundirlas metería dos preguntas en una función; además el endpoint del
 * sidebar ni siquiera trae el análisis.
 */

/** Lo mínimo que hace falta de cada documento. Deliberadamente NO es la fila
 *  entera: con ella a mano, alguien acabaría mirando `analysis_status` y la
 *  pregunta cambiaría sin que nadie lo decidiera. */
export interface DocumentoSeleccionado {
  /** El análisis más reciente, o `null` si nunca ha pasado por uno. */
  lastAnalysis: unknown;
  /** ¿Tiene una versión nueva esperando decisión? */
  stagedPending: boolean;
}

export type SeleccionIndexable =
  | { puede: true; total: number }
  | { puede: false; total: number; sinAnalisis: number; conVersionPendiente: number };

export function seleccionIndexable(docs: DocumentoSeleccionado[]): SeleccionIndexable {
  const total = docs.length;

  // ⚠️ UNA SELECCIÓN VACÍA NO ES INDEXABLE, y no por purismo: `every` sobre una
  // lista vacía devuelve `true`, así que sin esta línea el botón se encendería
  // sin nada seleccionado y la primera pulsación no haría nada. Es el mismo
  // «cero sin denominador» de siempre, aquí en forma de botón.
  if (total === 0) return { puede: false, total: 0, sinAnalisis: 0, conVersionPendiente: 0 };

  const sinAnalisis = docs.filter(d => !d.lastAnalysis).length;
  const conVersionPendiente = docs.filter(d => d.stagedPending).length;

  if (sinAnalisis === 0 && conVersionPendiente === 0) return { puede: true, total };
  return { puede: false, total, sinAnalisis, conVersionPendiente };
}

/**
 * El motivo en frases, una por causa. Vacío cuando se puede.
 *
 * ⚠️ VA EN LA PANTALLA Y NO SÓLO EN UN `title`: un mensaje al pasar el ratón no
 * existe en un móvil, y el motivo sería invisible justo para quien no tiene otra
 * forma de leerlo. Es el fallo que B.202 corrigió en el icono de la nube.
 */
export function motivosDeNoIndexable(estado: SeleccionIndexable): string[] {
  if (estado.puede) return [];
  const frases: string[] = [];
  if (estado.total === 0) return ['Selecciona los documentos que quieras añadir al corpus.'];
  if (estado.sinAnalisis > 0) {
    frases.push(
      `${estado.sinAnalisis} de ${estado.total} no se han analizado todavía. ` +
      `Analízalos primero o quítalos de la selección.`,
    );
  }
  if (estado.conVersionPendiente > 0) {
    frases.push(
      `${estado.conVersionPendiente} de ${estado.total} tienen una versión pendiente de decidir. ` +
      `Decide qué hacer con esa versión antes de añadirlos.`,
    );
  }
  return frases;
}
