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
 * ¿TIENE ESTE GRUPO ALGO QUE ENSEÑAR?
 *
 * Un grupo cuyo único resultado fueron discrepancias —sin filas ajenas, sin
 * variantes, sin idénticas— no aporta nada a este bloque: sus quince ya están
 * en la lista de arriba. Pintarle un bloque vacío sería ruido.
 *
 * LAS IDÉNTICAS CUENTAN COMO ALGO QUE ENSEÑAR, aunque sean solo un número: «20
 * filas idénticas en ambos documentos» es cobertura verificada, y es la mitad
 * de la respuesta a «¿esto ya lo tenía?».
 */
export function tieneCobertura(grupo: GrupoDeTablas): boolean {
  return (
    grupo.soloEnNuevo.length > 0 ||
    grupo.soloEnOtro.length > 0 ||
    grupo.variantesDeEscritura.length > 0 ||
    grupo.identicas > 0
  );
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
