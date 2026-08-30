import type { GrupoDeTablas } from '@/lib/analysis/types';
import type { Problem } from './problems';

/**
 * EL NÚCLEO DE LA TARJETA AGRUPADA (F-88, ficha A).
 *
 * POR QUÉ ES UN .ts Y NO VIVE DENTRO DEL .tsx. El alcance de la suite prohíbe
 * los componentes de React (vitest.config.mts), así que todo lo que quede
 * dentro del pintado es código que ninguna batería puede vigilar. Aquí va lo
 * que DECIDE —qué fila va con qué tarjeta, y de quién es cada montón— y allí
 * solo lo que dibuja.
 *
 * No es una separación de gusto: la lección de M6 —los dos montones de filas
 * ajenas se podían intercambiar sin que fallara nada, porque el corpus es
 * simétrico (B.121)— necesita un caso que la fije, y un caso necesita una
 * función a la que llamar.
 */

/**
 * Una tarjeta lista para pintar: el grupo que emitió el servidor más las filas
 * discrepantes que le pertenecen.
 *
 * LAS FILAS VIENEN DE LA LISTA DE PROBLEMAS, no del grupo. F-84 P1 fijó que
 * las quince son quince entradas planas en el array de contradicciones —
 * «quince fuera, quince dentro, una tarjeta»—, así que la tarjeta las RECOGE,
 * no las contiene: el contador plano sigue contando el array, que es lo que la
 * bandeja enseña, y aquí solo se vuelven a juntar para verlas.
 */
export interface TarjetaDeTablas {
  grupo: GrupoDeTablas;
  filas: Problem[];
}

/**
 * Reparte los problemas entre sus tarjetas.
 *
 * DEVUELVE TAMBIÉN LO QUE NO ES DE NINGUNA (`sueltos`), y eso no es una
 * comodidad: si esta función se quedara solo con lo agrupado, las
 * contradicciones de PROSA del mismo análisis desaparecerían de la pantalla
 * sin que nadie lo notara. Nada desaparece en silencio — quien llama pinta las
 * dos cosas.
 *
 * EL CRITERIO ES EL groupId Y NADA MÁS. Un problema sin `groupId` es suelto,
 * venga de donde venga; uno con un `groupId` que no corresponde a ningún grupo
 * emitido también — un análisis guardado hace meses puede traer lo uno sin lo
 * otro, y la tarjeta no puede inventarse el grupo que le falta.
 */
export function repartirEnTarjetas(
  problemas: Problem[],
  grupos: GrupoDeTablas[] | undefined,
): { tarjetas: TarjetaDeTablas[]; sueltos: Problem[] } {
  if (!grupos || grupos.length === 0) return { tarjetas: [], sueltos: problemas };

  const porGrupo = new Map<string, Problem[]>();
  const sueltos: Problem[] = [];
  const conocidos = new Set(grupos.map(g => g.groupId));

  for (const p of problemas) {
    if (p.groupId && conocidos.has(p.groupId)) {
      const arr = porGrupo.get(p.groupId) ?? [];
      arr.push(p);
      porGrupo.set(p.groupId, arr);
    } else {
      sueltos.push(p);
    }
  }

  // SE CONSERVAN LAS TARJETAS VACÍAS. Un grupo sin filas discrepantes es un par
  // de tablas cuyo único resultado fue cobertura —F-84 P1 lo declaró caso
  // aceptable: «aparecería con contadores a cero, correcto, porque no hay nada
  // que revisar»—. Ocultarlo dejaría las cincuenta ajenas sin domicilio otra
  // vez, que es justo lo que esta ficha viene a arreglar.
  const tarjetas = grupos.map(grupo => ({ grupo, filas: porGrupo.get(grupo.groupId) ?? [] }));

  return { tarjetas, sueltos };
}

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
 * ¿LLEVA ESTA FILA SUS ACCIONES (descartar y resolver)?
 *
 * SALE DEL JSX A PROPÓSITO, y la razón es una mutación que sobrevivió: mientras
 * la condición vivía dentro del pintado, devolverle los botones a una fila
 * tabular NO ROMPÍA NINGÚN CASO — el alcance de la suite prohíbe React, así que
 * ahí dentro no hay nada que vigile. Aquí sí.
 *
 * POR QUÉ SE LES QUITAN A LAS TABULARES (F-88 P2): el botón de descarte que
 * pinta la tarjeta actual va respaldado por la maquinaria de huella de PROSA.
 * Pulsarlo sobre una fila de tabla registraría el juicio con una identidad de
 * texto — el desajuste exacto que F-86 mató. Y «resolver» propondría un
 * reemplazo de párrafo sobre una fila de hoja de cálculo.
 *
 * NO SIRVE MIRAR `confirmedBy` NI EL TIPO: R2 emite hallazgos estructurales
 * sobre PROSA y ésos SÍ conservan sus acciones. Lo que decide es la MATERIA,
 * que es lo que `origen` dice.
 *
 * ES TEMPORAL Y ESTÁ FECHADO: la ficha B trae las acciones de verdad, sobre
 * huella TABULAR. Hasta entonces, verdad sin promesa de memoria.
 */
export function mostrarAccionesDeFila(p: Problem): boolean {
  return p.origen !== 'diff_tabular';
}
