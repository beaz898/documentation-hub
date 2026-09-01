import type { GrupoDeTablas } from '@/lib/analysis/types';

/**
 * EL NÚCLEO DEL BLOQUE DE COBERTURA (F-88, ficha A revisada).
 *
 * QUÉ ES ESTE BLOQUE Y POR QUÉ EXISTE. Las cincuenta filas ajenas y las
 * variantes de escritura NO tienen otro domicilio: F-84 P1 las dejó fuera de
 * todos los contadores planos a propósito —«la cobertura es información sin
 * botón; meterla en solapamientos diría al cliente que tiene 50 problemas
 * más»— y hasta que existió este bloque no había dónde enseñarlas.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA DESVIACIÓN DE F-83 P2, y conviene leerla aquí porque es donde se aplica.
 *
 * F-83 P2 especificó UN HALLAZGO AGRUPADO por pareja de tablas, con las filas
 * discrepantes DENTRO. Se implementó así (commit f7361ac8), se miró en
 * pantalla, y SE LEÍA PEOR que la lista de cajas sueltas de siempre: las
 * quince se distinguían mejor sueltas.
 *
 * Así que las discrepantes vuelven a la lista y aquí queda solo lo
 * informativo. NO ES UNA SUPERACIÓN de F-83 P2: su doctrina sobre QUÉ se emite
 * —las ajenas como información y no como contradicción— y sobre CÓMO SE NOMBRA
 * —indicativo puro— sigue entera y se cumple aquí letra por letra. Lo único
 * que cambia es DÓNDE SE PINTAN las quince, que es presentación, y la
 * presentación la decide quien presenta (F-53).
 * ─────────────────────────────────────────────────────────────────────────
 *
 * POR QUÉ ESTO ES UN .ts Y NO VIVE EN EL .tsx: el alcance de la suite prohíbe
 * los componentes de React, así que lo que quede dentro del pintado es código
 * que ninguna batería puede vigilar. Aquí va lo que DECIDE; allí, lo que
 * dibuja.
 */

/**
 * LAS DOS ETIQUETAS DE LOS MONTONES AJENOS, EN INDICATIVO PURO (F-83 P2).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * «PRESENTE SOLO EN X». JAMÁS «NUEVA» NI «ELIMINADA». Es innegociable, y la
 * razón la da el propio corpus: OPE-10 es el tarifario de 2026 y OPE-11 el de
 * seguros. No son versiones el uno del otro, son documentos paralelos, y
 * llamar «eliminada» a una fila presupondría un linaje temporal que el sistema
 * NO CONOCE NI PUEDE VERIFICAR. Sabe exactamente dos cosas —qué documento se
 * analiza y en cuál aparece cada fila— y eso es lo que dice.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * CADA MONTÓN SE NOMBRA CON SU DOCUMENTO, NO CON SU ROL. Ni «el nuevo» ni «el
 * otro»: el nombre del fichero. Un rol es relativo a quién se subió primero, y
 * el usuario que vuelve a la bandeja tres semanas después no tiene ese
 * contexto — lo que reconoce es el nombre.
 *
 * ⚠️ Y ES DONDE MÁS FÁCIL SE INVIERTE: `soloEnNuevo` es del documento que se
 * ANALIZA y `soloEnOtro` del candidato. Intercambiarlos no mueve ni un número
 * —los recuentos siguen cuadrando— y deja el indicativo diciendo lo contrario
 * de lo que pasa. El corpus no puede detectarlo porque sus montones son
 * simétricos, 25 y 25 (B.121), así que el caso que lo vigila es asimétrico a
 * propósito.
 */
export function etiquetasDeMontones(
  grupo: GrupoDeTablas,
  nombreDocumentoAnalizado: string,
): Array<{ documento: string; filas: GrupoDeTablas['soloEnNuevo'] }> {
  return [
    { documento: nombreDocumentoAnalizado, filas: grupo.soloEnNuevo },
    { documento: grupo.documentoExistente, filas: grupo.soloEnOtro },
  ].filter(m => m.filas.length > 0);
}

/**
 * EL REPARTO POR COLUMNA como índice del titular (F-83 P2).
 *
 * Ordenado de más a menos, que es el orden en que sirve: «Precio (12),
 * Duración (3)» dice de un vistazo dónde está el problema. Con empate, por
 * nombre, para que dos análisis del mismo documento no reordenen el titular
 * sin motivo — un orden inestable haría creer que algo cambió.
 */
export function indiceDeColumnas(porColumna: Record<string, number>): Array<{ columna: string; filas: number }> {
  return Object.entries(porColumna)
    .map(([columna, filas]) => ({ columna, filas }))
    .sort((a, b) => (b.filas !== a.filas ? b.filas - a.filas : a.columna.localeCompare(b.columna)));
}

/**
 * ¿TIENE ESTE GRUPO ALGO QUE ENSEÑAR EN «SIN CORRESPONDENCIA»?
 *
 * Un grupo cuyo único resultado fueron discrepancias —sin filas ajenas, sin
 * idénticas— no aporta nada a este bloque: sus quince ya están en la lista de
 * arriba. Pintarle un bloque vacío sería ruido.
 *
 * ⚠️ LAS IDÉNTICAS TAMPOCO CUENTAN AQUÍ desde el 01/09 (tarde): ranura propia,
 * la cuarta. Y con su salida esta pregunta queda por fin alineada con el
 * recuento del titular —`contarSinCorrespondencia` cuenta filas ajenas y ya no
 * hay nada más dentro—, así que «Sin correspondencia (N)» no puede volver a
 * anunciar un cero con cosas debajo. El defecto se cierra por las DOS mitades:
 * variantes por la mañana, idénticas ahora.
 *
 * ⚠️ LAS VARIANTES DE ESCRITURA YA NO CUENTAN AQUÍ (decisión de producto,
 * 01/09/2026). Tienen ranura propia, hermana de ésta. Antes vivían dentro y
 * eran la causa del defecto que la decisión cierra: un grupo cuyo único
 * contenido fueran variantes abría un titular «Sin correspondencia (0)» con
 * cosas debajo, porque el recuento cuenta filas ajenas y las variantes no lo
 * son.
 * LAS DOS MITADES VAN JUNTAS: si esto deja de contarlas y el bloque las sigue
 * pintando, un grupo de solo variantes no abre ranura y SUS VARIANTES
 * DESAPARECEN; si el bloque deja de pintarlas y esto las cuenta, la ranura se
 * abre VACÍA. `tieneVariantes` es la otra mitad, y hay un caso que las ata.
 */
export function tieneCobertura(grupo: GrupoDeTablas): boolean {
  return grupo.soloEnNuevo.length > 0 || grupo.soloEnOtro.length > 0;
}

/**
 * ¿TIENE ESTE GRUPO VARIANTES DE ESCRITURA? La pregunta de la ranura hermana.
 *
 * Trivial a propósito, y aun así vive aquí y no dentro del componente: es el
 * filtro que aplica `WritingVariantsBlock` y la base de `hayRanuraDeVariantes`,
 * y si cada uno la escribiera por su cuenta volveríamos al defecto que este
 * mismo commit cierra — la ranura y su contenido decidiendo por separado.
 */
export function tieneVariantes(grupo: GrupoDeTablas): boolean {
  return grupo.variantesDeEscritura.length > 0;
}


/**
 * ¿EXISTE LA RANURA «SIN CORRESPONDENCIA» EN LA LISTA? (F-94, ficha B, commit 3)
 *
 * ⚠️ UN CRITERIO, UN SITIO. Hasta hoy `ChatPanel` lo decidía con SU regla
 * —«hay grupos»— y lo que de verdad se pintaba lo decidía `tieneCobertura` en
 * `TableCoverageBlock`. Dos implementaciones del mismo criterio, que es lo que
 * CLAUDE.md prohíbe desde F-89 P2, y ya discrepaban:
 *
 *   un grupo con discrepancias pero SIN nada informativo —todas las filas
 *   emparejan y todas difieren, ni idénticas ni ajenas ni variantes— pintaba el
 *   titular «Sin correspondencia (0)» y al desplegarlo NO HABÍA NADA DENTRO,
 *   porque el bloque devuelve `null` cuando ningún grupo tiene cobertura.
 *
 * Ahora la pregunta se hace UNA VEZ y la contesta quien la decidió. Y como
 * `tieneCobertura` es exactamente el filtro que aplica el bloque, la ranura y su
 * contenido no pueden volver a discrepar sin que este fichero se entere.
 *
 * EN AUSENCIA Y EN VACÍO: sin tablas —el caso normal— no hay ranura.
 */
export function hayRanuraDeCobertura(grupos: GrupoDeTablas[] | undefined): boolean {
  return (grupos ?? []).some(tieneCobertura);
}

/**
 * EL RECUENTO DEL TITULAR del grupo «Sin correspondencia».
 *
 * CUENTA LAS FILAS AJENAS DE LOS DOS MONTONES, y nada más — ni las variantes
 * de escritura ni las idénticas, aunque vayan dentro del mismo grupo. La regla
 * es que EL RECUENTO CUENTE LO QUE EL NOMBRE DICE: un titular «Sin
 * correspondencia (73)» sobre 50 filas sin pareja más 20 idénticas más 3
 * variantes sería un número que no significa nada.
 *
 * Es la misma disciplina que F-84 P1 aplicó a los contadores planos: los
 * números tienen que medir lo que dicen medir.
 */
export function contarSinCorrespondencia(grupos: GrupoDeTablas[]): number {
  return grupos.reduce((n, g) => n + g.soloEnNuevo.length + g.soloEnOtro.length, 0);
}

/**
 * EL RECUENTO DEL TITULAR de «Diferencias solo de escritura».
 *
 * CUENTA FILAS, NO GRUPOS, por la misma regla que el de al lado: el número dice
 * lo que el nombre promete. Dos parejas de tablas con tres variantes cada una
 * son SEIS diferencias de escritura, no dos.
 */
export function contarVariantes(grupos: GrupoDeTablas[]): number {
  return grupos.reduce((n, g) => n + g.variantesDeEscritura.length, 0);
}

/**
 * ¿EXISTE LA RANURA «DIFERENCIAS SOLO DE ESCRITURA»?
 *
 * Misma disciplina que `hayRanuraDeCobertura`, y por la misma razón: la ranura
 * pregunta exactamente lo que el bloque filtra. Ver allí el caso que hizo falta
 * escribir esta tarde.
 */
export function hayRanuraDeVariantes(grupos: GrupoDeTablas[] | undefined): boolean {
  return (grupos ?? []).some(tieneVariantes);
}
/**
 * ¿TIENE ESTE GRUPO FILAS IDÉNTICAS? La pregunta de la cuarta ranura.
 *
 * ⚠️ ES SOLO UN NÚMERO, Y ESO DECIDE LA FORMA DE LA RANURA. `identicas` es un
 * `number` y las filas idénticas NO SE GUARDAN EN NINGUNA PARTE — el contrato
 * de `GrupoDeTablas` lo dice en su punto 4: «IDÉNTICAS — solo el recuento».
 * Por eso esta ranura NO es un grupo plegable como las otras tres: un
 * desplegable solo podría repetir su propio titular. Es una LÍNEA.
 */
export function tieneIdenticas(grupo: GrupoDeTablas): boolean {
  return grupo.identicas > 0;
}

/**
 * EL RECUENTO DE LA LÍNEA. Filas, no grupos — la misma regla que los otros dos
 * recuentos (F-84 P1b: los números miden lo que dicen medir).
 */
export function contarIdenticas(grupos: GrupoDeTablas[]): number {
  return grupos.reduce((n, g) => n + g.identicas, 0);
}

/** ¿Existe la línea de idénticas? Misma disciplina que las otras dos ranuras:
 *  pregunta exactamente lo que el pintado filtra. */
export function hayRanuraDeIdenticas(grupos: GrupoDeTablas[] | undefined): boolean {
  return (grupos ?? []).some(tieneIdenticas);
}

/**
 * QUÉ LÍNEAS SE PINTAN, y CUÁNDO HACE FALTA NOMBRAR EL DOCUMENTO.
 *
 * Vive aquí y no en el JSX porque DECIDE algo: con una sola pareja de tablas el
 * nombre sobra —la línea ya dice «en ambos documentos» y no hay otro par con el
 * que confundirla—, pero con varias, tres líneas idénticas no distinguirían
 * nada. `documento: null` significa «no hace falta nombrarlo», no «no se sabe».
 *
 * Los grupos SIN idénticas no producen línea: un «0 filas idénticas» sería
 * exactamente el cero sin contenido que este commit viene a quitar.
 */
export function lineasDeIdenticas(
  grupos: GrupoDeTablas[] | undefined,
): Array<{ documento: string | null; filas: number }> {
  const conIdenticas = (grupos ?? []).filter(tieneIdenticas);
  const hazFalta = conIdenticas.length > 1;
  return conIdenticas.map(g => ({
    documento: hazFalta ? g.documentoExistente : null,
    filas: g.identicas,
  }));
}

/**
 * EL ORDEN DE LOS GRUPOS DE LA LISTA, con las dos ranuras informativas JUSTO
 * DETRÁS DE LAS CONTRADICCIONES (decisión de producto, 30/08 y 01/09).
 *
 * LA REGLA: cobertura y variantes van JUSTO DESPUÉS de las contradicciones, que
 * son la alarma. No al final —el usuario que abre el modal mira arriba, y las
 * cincuenta filas sin pareja son lo segundo que quiere saber— pero tampoco
 * antes, porque no reclaman juicio. Entre ellas, LA COBERTURA PRIMERO: las
 * variantes son menos accionables.
 *
 * LAS IDÉNTICAS VAN LAS ÚLTIMAS DE TODO, detrás incluso de los tipos, y no con
 * las otras dos informativas. Son un RECUENTO, no una lista de cosas que
 * revisar: la menos accionable de las cuatro clases. Decisión de producto del
 * 01/09 (tarde).
 *
 * SI NO HAY CONTRADICCIONES, VAN PRIMERO. Es el caso que un `indexOf` ingenuo
 * rompe: sin grupo de contradicciones no hay «después de» que valga, y
 * colocarlas al final por descarte las escondería justo en el análisis donde
 * son lo único que hay que enseñar — el par cuyo único resultado fue cobertura,
 * que F-84 P1 declaró caso aceptable.
 *
 * LA POSICIÓN LA DECIDE EL BLOQUE INFORMATIVO, NO CADA RANURA: si falta la
 * cobertura, las variantes ocupan su sitio en vez de irse a otro lado. Por eso
 * se calcula UNA posición y las dos se insertan ahí, en orden.
 *
 * ⚠️ LAS DOS BANDERAS VAN EN UN OBJETO Y NO SUELTAS. Dos booleanos posicionales
 * adyacentes del mismo tipo se intercambian solos en la primera refactorización
 * y ninguna prueba lo nota si los dos casos son simétricos — que es justo la
 * clase de fallo que B.121 midió con los montones.
 *
 * ES UNA FUNCIÓN Y NO UN `map` EN EL JSX por la razón de siempre en este
 * módulo: el alcance de la suite prohíbe React, así que una regla escrita
 * dentro del pintado es una regla sin vigilancia. Ya pasó dos veces.
 */
export type RanuraDeGrupo =
  | { clase: 'tipo'; tipo: string }
  | { clase: 'cobertura' }
  | { clase: 'variantes' }
  | { clase: 'identicas' };

export function ordenDeGrupos(
  tiposPresentes: string[],
  informativas: { cobertura: boolean; variantes: boolean; identicas: boolean },
): RanuraDeGrupo[] {
  const ranuras: RanuraDeGrupo[] = tiposPresentes.map(tipo => ({ clase: 'tipo' as const, tipo }));

  const aInsertar: RanuraDeGrupo[] = [];
  if (informativas.cobertura) aInsertar.push({ clase: 'cobertura' });
  if (informativas.variantes) aInsertar.push({ clase: 'variantes' });
  // Y LAS IDÉNTICAS, AL FINAL DE TODO. Fuera del bloque de arriba a propósito:
  // no comparten sitio con las otras dos informativas.
  const alFinal: RanuraDeGrupo[] = informativas.identicas ? [{ clase: 'identicas' }] : [];

  if (aInsertar.length === 0) return [...ranuras, ...alFinal];

  const iContradicciones = tiposPresentes.indexOf('contradiccion');

  // Sin contradicciones, primeras. Con ellas, justo detrás.
  const posicion = iContradicciones === -1 ? 0 : iContradicciones + 1;
  return [
    ...ranuras.slice(0, posicion),
    ...aInsertar,
    ...ranuras.slice(posicion),
    ...alFinal,
  ];
}
