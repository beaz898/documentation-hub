import { randomUUID } from 'crypto';

import type { PipelineCounters } from './counters';
import { huellaDeHallazgo, unirClave } from './huella-hallazgo';
import { despegarPunteroDeFila } from './table-structure';
import { contadoresDelDiff, diffPairedRows, type RowDiff } from './table-diff';
import type { ParDeTablas } from './table-pairing';
import type { DocumentJudgment, FilaDeTabla, GrupoDeTablas } from './types';

/**
 * LA EMISIÓN DEL DIFF DE TABLAS (F-88 paso 2).
 *
 * Convierte lo que la fase 2 clasificó en lo que el cliente ve. Es la primera
 * pieza de todo el frente que cambia algo para el usuario.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LO QUE SALE Y POR DÓNDE, que son DOS CAMINOS distintos a propósito:
 *
 *   1. LAS DISCREPANTES → al array de contradicciones, UNA POR FILA (F-84 P1).
 *      Quince filas son quince entradas, no una tarjeta. La regla que lo decide
 *      ya estaba escrita en dos sitios: la unidad de juicio es la fila (F-82,
 *      «No es error» opera fila a fila) y el recall se cuenta en filas. El
 *      contador plano que la bandeja enseña responde «¿cuántas cosas tengo que
 *      revisar?», y son quince decisiones, no una.
 *
 *   2. TODO LO DEMÁS → a la estructura agrupada (`GrupoDeTablas`), que viaja en
 *      el resultado aunque este commit no la pinte. Sus cuatro secciones son
 *      las de F-83 P2 más la que añadió F-88 P4.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * LAS VARIANTES DE ESCRITURA NO SON DISCREPANCIAS (F-88 P4). Una fila cuyas
 * diferencias son TODAS variantes de escritura es, por definición del
 * comparador de F-82, una fila donde nada significa algo distinto. Emitirla
 * como discrepancia rompería dos doctrinas a la vez: «lo mostrado es real» —el
 * usuario vería alarma donde hay un punto de más— y «los números miden lo que
 * dicen medir» —el contador plano diría 17 donde hay 15 decisiones reales, y la
 * remedición contra el registro se contaminaría—. Pero suprimirlas sería la
 * otra ruina, porque nada desaparece en silencio: van a su sección.
 *
 * LA GUARDA SIGUE VIGENTE: solo el NIVEL SEGURO absuelve hacia esa sección.
 * «25,00» contra «2500» es y seguirá siendo discrepante — esa distinción la
 * hace `esVarianteDeEscritura` en la fase 2, no este módulo, que solo lee su
 * veredicto.
 *
 * EL INDICATIVO, innegociable (F-83 P2): las filas sin pareja se nombran
 * «presente solo en X». JAMÁS «nueva» ni «eliminada». El sistema sabe
 * exactamente dos cosas —qué documento se analiza y en cuál aparece cada fila—
 * y eso es lo que dice. Llamar «eliminada» a una fila presupondría un linaje
 * temporal que no conoce ni puede verificar: OPE-10 es el tarifario de 2026 y
 * OPE-11 el de seguros, y no son versiones el uno del otro.
 *
 * ⚠️ LOS DOS LADOS NO SON INTERCAMBIABLES, y es el fallo más fácil de cometer
 * aquí: `soloEnNuevo` son las filas del documento que se ANALIZA y `soloEnOtro`
 * las del candidato. Confundirlos invierte el indicativo sin mover ni un
 * número — la cifra seguiría siendo 25 y el recuento cuadraría. El corpus NO
 * PUEDE detectarlo porque sus dos montones son simétricos (25 y 25): ver B.121.
 * Por eso el caso que lo vigila es construido y asimétrico.
 */

/** El id del documento de cada lado. El del ANALIZADO puede faltar: en la
 *  subida desde el chat el documento no tiene fila hasta indexarse (F-87 P4,
 *  la identidad «pendiente de nacer»). */
export interface LadosDeLaEmision {
  nuevo: { id?: string; nombre: string };
  existente: { id: string; nombre: string };
}

export interface ResultadoEmision {
  /** Las discrepantes, listas para entrar en `judgment.contradictions`. */
  contradicciones: DocumentJudgment['contradictions'];
  grupos: GrupoDeTablas[];
  counts: PipelineCounters;
}

/**
 * EL groupId: OPACO, y esto es contrato (F-88 P3).
 *
 *   LA HUELLA RECUERDA. EL groupId ENSAMBLA.
 *
 * Son dos oficios y por eso son dos naturalezas. La huella existe para
 * reconocer el MISMO hallazgo entre análisis distintos: por eso deriva del
 * contenido y va hasheada. El groupId existe para que la ficha vuelva a juntar
 * quince entradas planas en una tarjeta DENTRO DE UN MISMO RESULTADO: no cruza
 * análisis, no sobrevive a nada, no identifica nada ante nadie. Su vida entera
 * es el ensamblaje de una emisión.
 *
 * POR QUÉ NO SE DERIVA DEL CONTENIDO, aunque «par + tabla» parecería más
 * sólido: crearía una SEGUNDA identidad derivada del contenido, paralela a la
 * huella y con reglas de construcción propias — y dos identidades del mismo
 * contenido calculadas en dos sitios es la receta de la desincronización
 * silenciosa. Peor: un campo opaco no tienta a nadie a usarlo como memoria; uno
 * derivado del contenido sí, y el día que alguien lo usara como identidad entre
 * análisis tendríamos dos memorias que divergen.
 */
function nuevoGroupId(): string {
  return randomUUID();
}

/**
 * La huella tabular de una fila discrepante, o `undefined` si no se puede
 * construir. Necesita los DOS ids: sin el del documento analizado no hay orden
 * canónico posible, y sin orden canónico la identidad dependería de qué
 * documento se subió primero.
 *
 * DEVUELVE undEFINED EN VEZ DE LANZAR, y el hallazgo se emite igual: F-87 P1
 * decidió que en el camino pre-indexado el diff se emite —«justo ahí es donde
 * más vale»—, lo que no puede es recordar. Lo que falta es la memoria, no el
 * hallazgo.
 */
function huellaDeFila(
  d: RowDiff,
  par: ParDeTablas,
  lados: LadosDeLaEmision,
): string | undefined {
  if (!lados.nuevo.id) return undefined;
  // Una fila puede diferir en varias columnas; la huella se construye con la
  // PRIMERA en el orden real de la tabla nueva. Es determinista y estable, que
  // es lo que la identidad necesita — y `columns` viene ya ordenado por la
  // fase 2 precisamente para que quien lo lea no tenga que elegir un orden.
  const columna = d.columns[0];
  if (!columna) return undefined;

  return huellaDeHallazgo({
    a: { id: lados.nuevo.id, tabla: par.nueva.tableId, claveCruda: unirClave(d.keyValues.nueva) },
    b: { id: lados.existente.id, tabla: par.existente.tableId, claveCruda: unirClave(d.keyValues.existente) },
    columna,
  });
}

/** Una fila de tabla, tal como la ve la ficha. Sin decidir nada: transporta lo
 *  que la fase 2 ya renderizó con el orden real de columnas de SU tabla. */
function aFila(texto: string, clave: string[]): FilaDeTabla {
  return { clave: clave.join(' · '), texto };
}

export function emitirDiffDeTablas(
  pares: ParDeTablas[],
  lados: LadosDeLaEmision,
): ResultadoEmision {
  const contradicciones: DocumentJudgment['contradictions'] = [];
  const grupos: GrupoDeTablas[] = [];
  const counts: PipelineCounters = {};

  let variantesTotal = 0;
  let preIndexado = 0;

  for (const par of pares) {
    const diff = diffPairedRows(par.clave, par.nueva, par.existente);
    const groupId = nuevoGroupId();

    // LAS DOS ESPECIES DE FILA QUE DIFIERE, separadas por el veredicto que la
    // fase 2 ya dio: si TODAS las columnas que difieren son variantes de
    // escritura, la fila no dice nada distinto (F-88 P4).
    const discrepantes: RowDiff[] = [];
    const variantes: RowDiff[] = [];
    for (const d of diff.differing) {
      if (d.columns.length > 0 && d.varianteDeEscritura.length === d.columns.length) variantes.push(d);
      else discrepantes.push(d);
    }
    variantesTotal += variantes.length;

    for (const d of discrepantes) {
      const huella = huellaDeFila(d, par, lados);
      if (!huella) preIndexado++;

      contradicciones.push({
        topic: `Discrepancia en ${d.columns.join(' y ')} entre ${lados.nuevo.nombre} y ${lados.existente.nombre}`,
        // F-94 P6: el TEXTO que viaja va con los valores solos. El puntero de
        // fila es del prompt del juez, no del cliente ni de los prompts de
        // mejora — aguas abajo es ruido, y en una huella sería peor: la ataría
        // al orden de las filas.
        // El índice sigue vivo en `newDocRow`/`existingDocRow`, aquí debajo,
        // que es el campo estructurado donde F-94 dice que debe estar.
        newDocSays: despegarPunteroDeFila(d.newDocRow).texto,
        existingDocSays: despegarPunteroDeFila(d.existingDocRow).texto,
        severity: 'contradiction',
        // LA PUERTA DE F-71 MIRA ESTE CAMPO Y NADA MÁS: un veredicto
        // determinista no se le envía a Sonnet. No se toca esa puerta; se
        // entra por ella con la llave que ya reconoce.
        confirmedBy: 'estructura',
        columns: d.columns,
        comparedValues: d.comparedValues,
        newDocRow: d.newDocRow,
        existingDocRow: d.existingDocRow,
        origen: 'diff_tabular',
        groupId,
        ...(huella ? { huella } : {}),
      });
    }

    grupos.push({
      groupId,
      tablaNueva: par.nueva.tableId,
      tablaExistente: par.existente.tableId,
      documentoExistente: lados.existente.nombre,
      documentoExistenteId: lados.existente.id,
      discrepantes: discrepantes.length,
      identicas: diff.identical.length,
      porColumna: diff.porColumna,
      variantesDeEscritura: variantes.map(d => ({
        clave: unirClave(d.keyValues.nueva),
        columnas: d.columns,
        // Las variantes SE ENSEÑAN al usuario (F-88 P4): sin puntero.
        enNuevo: despegarPunteroDeFila(d.newDocRow).texto,
        enOtro: despegarPunteroDeFila(d.existingDocRow).texto,
      })),
      // EL INDICATIVO. Los dos montones, cada uno con SU documento — no «nueva»
      // ni «eliminada», que presupondrían un linaje que el sistema no conoce.
      soloEnNuevo: par.clave.onlyNueva.map(r => aFila(r.text, Object.values(r.cells ?? {}))),
      soloEnOtro: par.clave.onlyExistente.map(r => aFila(r.text, Object.values(r.cells ?? {}))),
    });

    const delPar = contadoresDelDiff(par.clave, diff);
    for (const [k, v] of Object.entries(delPar)) {
      const clave = k as keyof PipelineCounters;
      counts[clave] = (counts[clave] ?? 0) + (v as number);
    }
  }

  // LA RELACIÓN QUE HAY QUE SABER LEER, y que sobre el corpus no se ve porque
  // vale cero: `diff.clasificacion.discrepantes` lo produce la FASE 2 y cuenta
  // todas las filas que difieren, INCLUIDAS las variantes de escritura. Lo que
  // llega al array de contradicciones es la resta:
  //
  //     emitidas al array = discrepantes − variantes_escritura
  //
  // No se redefine `discrepantes` para que cuadre: es un número medido con
  // batería propia, y cambiar qué significa para que encaje con otro sería
  // mover el termómetro.
  counts['diff.clasificacion.variantes_escritura'] = variantesTotal;
  if (preIndexado > 0) counts['diff.clasificacion.pre_indexado'] = preIndexado;

  return { contradicciones, grupos, counts };
}
