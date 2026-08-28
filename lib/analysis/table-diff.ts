import type { StoredChunk } from '@/lib/read-chunks';
import { esVarianteDeEscritura } from './normalize';
import type { RowPair, TableKeyResult } from './table-key';
import { renderTableRow, type TableGroup } from './table-structure';
import type { ComparedValue } from './types';

/**
 * FASE 2 DEL DIFF DE TABLAS — clasificar las parejas (F-81).
 *
 * QUÉ HACE. Sobre las parejas que devuelve `discoverTableKey` (fase 1),
 * compara celda a celda y las reparte en IDÉNTICAS y DISCREPANTES, diciendo de
 * cada discrepante qué columnas difieren y con qué valores. La fase 1 decide
 * QUIÉN se compara con quién; esta decide QUÉ difiere.
 *
 * QUÉ COLUMNAS SE COMPARAN: las compartidas por nombre entre las dos tablas,
 * MENOS las que sirvieron de clave. Una columna que existe en un lado y no en
 * el otro no es discrepancia ni ausencia que emitir aquí — «estas dos filas
 * discrepan» y «este documento documenta algo que el otro no» son dos
 * preguntas distintas, y la segunda no se responde fila a fila. Se CUENTA
 * (`columnasNoCompartidas`) para que quien presente pueda decir «se compararon
 * 2 de 18 columnas», que es honesto. Distinto es una columna COMPARTIDA vacía
 * en una de las dos filas: `chunking.ts` omite la celda vacía de `cells`, así
 * que llega como `''`, y `''` contra `'Chamberí'` sí es una discrepancia.
 *
 * ⚠️ PARA QUIEN ESCRIBA LA FASE 3: si `counts.columnasComparadas` es 0 —todas
 * las compartidas eran clave—, las parejas de `identical` NO significan «estas
 * filas son iguales», significan «no se comprobó nada». Salen ahí porque no se
 * encontró ninguna diferencia, y no se encontró ninguna porque no se miró
 * ninguna columna. HAY QUE MIRAR `counts` ANTES DE TRATARLAS COMO IDÉNTICAS:
 * emitirlas como solapamiento estructural sería afirmar una identidad que
 * nadie ha comprobado. Se avisa además por consola al calcularlo.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LAS TRES DECISIONES QUE ALGUIEN DESHARÁ DENTRO DE SEIS MESES SIN SABER QUÉ
 * ROMPE. Están aquí para que no le pase.
 *
 * 1 ── POR QUÉ SE COMPARA EN CRUDO, y no con `normalize`. No es un descuido ni
 * una herencia de R2: es la decisión, y es DELIBERADAMENTE la contraria a la
 * de la fase 1. `normalize` solo puede FUNDIR valores, y esa flecha apunta a
 * lados opuestos según dónde se use:
 *
 *     fase 1, EMPAREJAR  → normalize solo puede AÑADIR parejas  → parejas falsas
 *     fase 2, COMPARAR   → normalize solo puede QUITAR diferencias
 *                                                → HALLAZGOS OCULTOS
 *
 * Y lo que ocultaría no es cosmético. Medido sobre la propia `normalize`:
 *
 *     "1.500"  vs "1,500"   crudo: DIFIERE   normalizado: IGUAL
 *     "25,00"  vs "2500"    crudo: DIFIERE   normalizado: IGUAL   <-- x100
 *     "45.0"   vs "450"     crudo: DIFIERE   normalizado: IGUAL   <-- x10
 *
 * La coma y el punto decimales están en la clase de caracteres que `normalize`
 * borra, así que un precio de 25,00 y otro de 2500 son la MISMA cadena después
 * de pasar por ella. Un sistema cuya doctrina de producto es «no puede
 * esconder hallazgos y confiar en que el usuario los encuentre repitiendo»
 * (F-74) no puede usar como criterio de «esto es lo mismo» una función que
 * iguala 25,00 con 2500.
 *
 * Comparar en crudo además NO abre un segundo criterio de «difieren» en el
 * sistema: es el MISMO `!==` que ya usa `applyDeterministicRules`
 * (finding-rules.ts). Lo que esta fase añade es una etiqueta que R2 no tiene
 * —`varianteDeEscritura`—, que es justo lo que B.97 pide.
 *
 * 2 ── POR QUÉ SE EXCLUYE LA CLAVE. Una pareja existe PORQUE su clave
 * coincidió. Reportar la clave como columna discrepante sería decir «estas dos
 * filas son la misma fila y no lo son» en la misma frase. Puede pasar de
 * verdad, porque la fase 1 empareja tras `normalize` y esta compara en crudo:
 * `Código "DIA-01"` y `Código "dia-01"` emparejan y difieren. Sobre el corpus
 * de pruebas NO SALTA NUNCA —cero parejas con una clave distinta en crudo—,
 * pero el mecanismo es real y está construido en table-diff.test.ts (E1).
 * Excluirla es además lo que hace SEGURO comparar en crudo: sin la exclusión,
 * el crudo se contradiría a sí mismo; con ella, no oculta nada y no se
 * contradice.
 *
 * 3 ── POR QUÉ ESTE FICHERO SÍ SE SEPARA de table-key.ts, cuando aquel no se
 * partió pese a pasar de 400 líneas. Allí la nominación y el consenso TENÍAN
 * que compartir la comparación, y nada en el sistema de tipos podía obligar a
 * ello: la única defensa era que no se pudieran leer por separado. Aquí las dos
 * premisas se invierten. COMPARAR DISTINTO ES LA DECISIÓN —§1 de esta
 * cabecera—, así que juntarlas haría creer que comparan igual; y el
 * acoplamiento lo garantiza la FIRMA: `diffPairedRows` recibe la rama
 * `emparejado` ya estrechada de `TableKeyResult`, de modo que no puede
 * ejecutarse sobre un emparejamiento que no venga de la fase 1. Lo que allí
 * necesitaba una frontera de fichero, aquí lo da un tipo.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Una pareja que difiere, con todo lo que la fase 3 necesita para EMITIRLA sin
 * volver a calcular nada: `comparedValues` ya en el tipo que pinta la ficha
 * (F-70) y las dos filas ya renderizadas con el orden real de columnas de SU
 * tabla. Si la fase 3 tuviera que pintarlas, elegiría un orden de columnas — y
 * podría elegir otro distinto del que se usó para comparar.
 */
export interface RowDiff {
  nueva: StoredChunk;
  existente: StoredChunk;
  /** Los valores de clave que emparejaron, tal como los dio la fase 1. */
  keyValues: string[];
  /** Las columnas que difieren, en el orden real de la tabla nueva. */
  columns: string[];
  comparedValues: ComparedValue[];
  newDocRow: string;
  existingDocRow: string;
  /**
   * Subconjunto de `columns` que son EL MISMO VALOR ESCRITO DE OTRA MANERA:
   * difieren en crudo y coinciden bajo el nivel seguro
   * (`esVarianteDeEscritura`, normalize.ts) — o sea, solo en caja o espacios.
   *
   * EL RECORRIDO DEL NOMBRE, que es la historia de una decisión y no una
   * indecisión:
   *
   *   `soloFormato`            — descartado al diseñarlo (F-81 fase 2). Con la
   *                              comparación de entonces (`normalize`) el campo
   *                              recogía «Dr. Pablo Reyes» contra «Dr Pablo
   *                              Reyes», que sí es formato, Y «25,00» contra
   *                              «2500», que es un factor de cien. El nombre
   *                              habría mentido justo en el caso peligroso, e
   *                              invitado a degradar el hallazgo más grave.
   *   `igualTrasNormalizar`    — el nombre que decía QUÉ mide y no POR QUÉ,
   *                              porque con aquella comparación no se podía
   *                              afirmar la causa sin mentir.
   *   `varianteDeEscritura`    — el actual (F-82 P2). Al pasar a comparar con el
   *                              nivel seguro, «25,00»/«2500» dejó de caer aquí
   *                              y pasó a ser discrepancia plena. Ya no hay dos
   *                              cosas dentro, así que el campo PUEDE llamarse
   *                              por su causa sin prometer lo que no cumple.
   *
   * El nombre no se movió tres veces por indecisión: se movió porque cambió lo
   * que había dentro.
   */
  varianteDeEscritura: string[];
}

export interface TableDiffCounts {
  parejas: number;
  identicas: number;
  discrepantes: number;
  /** Cuántas parejas difieren en cada columna. */
  porColumna: Record<string, number>;
  /** Discrepancias en las que TODAS las columnas son variantes de escritura:
   *  la fila difiere, pero en nada que cambie un valor. */
  discrepanciasVarianteDeEscritura: number;
  columnasComparadas: number;
  /** Compartidas por nombre pero excluidas por haber servido de clave. */
  columnasExcluidasPorClave: number;
  /** Presentes en una sola de las dos tablas: no se comparan, se cuentan. */
  columnasNoCompartidas: number;
}

export interface TableDiffResult {
  /**
   * Las parejas sin ninguna diferencia entre las columnas comparadas. Se
   * devuelven enteras (referencias, sin renderizar) y no solo contadas porque
   * son el material del solapamiento estructural de F-45: si la fase 3 las
   * quisiera, tendría que volver a emparejar para tenerlas, y el criterio
   * viviría en dos sitios — que es contra lo que va todo este diseño.
   *
   * OJO: «idéntica» significa «sin diferencias EN comparedColumns». Si
   * `comparedColumns` viene vacío (todas las compartidas eran clave), aquí
   * caen todas las parejas sin que se haya comparado nada — lo dice
   * `counts.columnasComparadas`, y se avisa por consola al calcularlo.
   */
  identical: RowPair[];
  differing: RowDiff[];
  comparedColumns: string[];
  excludedAsKey: string[];
  counts: TableDiffCounts;
}

/** El valor de una celda, TAL CUAL. Sin trim y sin normalizar: ver §1 de la
 *  cabecera. Es el mismo acceso que hace applyDeterministicRules. */
function raw(row: StoredChunk, column: string): string {
  return row.cells?.[column] ?? '';
}

export function diffPairedRows(
  key: Extract<TableKeyResult, { status: 'emparejado' }>,
  nueva: TableGroup,
  existente: TableGroup,
): TableDiffResult {
  const shared = nueva.columns.filter(c => existente.columns.includes(c));
  const keyColumns = new Set(key.candidates.flatMap(c => c.columns));

  const comparedColumns = shared.filter(c => !keyColumns.has(c));
  const excludedAsKey = shared.filter(c => keyColumns.has(c));
  const todas = new Set([...nueva.columns, ...existente.columns]);

  if (comparedColumns.length === 0) {
    console.warn(
      `[table-diff] sin_columnas_comparables entre "${nueva.tableId}" y "${existente.tableId}" ` +
      `(${shared.length} compartida(s), todas usadas como clave) — ` +
      `las ${key.pairs.length} parejas salen como idénticas SIN haberse comparado nada`
    );
  }

  const identical: RowPair[] = [];
  const differing: RowDiff[] = [];
  const porColumna: Record<string, number> = {};
  let discrepanciasVarianteDeEscritura = 0;

  for (const pair of key.pairs) {
    const columns = comparedColumns.filter(c => raw(pair.nueva, c) !== raw(pair.existente, c));
    if (columns.length === 0) {
      identical.push(pair);
      continue;
    }

    // Nivel intermedio de los tres: el mismo valor escrito de otra manera.
    // El predicado vive en normalize.ts junto a la comparación agresiva, para
    // que no se pueda leer una sin ver la otra.
    const varianteDeEscritura = columns.filter(
      c => esVarianteDeEscritura(raw(pair.nueva, c), raw(pair.existente, c)),
    );
    if (varianteDeEscritura.length === columns.length) discrepanciasVarianteDeEscritura++;
    for (const c of columns) porColumna[c] = (porColumna[c] ?? 0) + 1;

    differing.push({
      nueva: pair.nueva,
      existente: pair.existente,
      keyValues: pair.keyValues,
      columns,
      comparedValues: columns.map(column => ({
        column,
        newDocValue: raw(pair.nueva, column),
        existingDocValue: raw(pair.existente, column),
      })),
      // Cada lado con el orden de SU tabla: las dos pueden tener columnas
      // distintas (OPE-02 y RRHH-06 comparten 2 de 18).
      newDocRow: renderTableRow(pair.nueva.rowIndex, pair.nueva.cells, nueva.columns),
      existingDocRow: renderTableRow(pair.existente.rowIndex, pair.existente.cells, existente.columns),
      varianteDeEscritura,
    });
  }

  return {
    identical,
    differing,
    comparedColumns,
    excludedAsKey,
    counts: {
      parejas: key.pairs.length,
      identicas: identical.length,
      discrepantes: differing.length,
      porColumna,
      discrepanciasVarianteDeEscritura,
      columnasComparadas: comparedColumns.length,
      columnasExcluidasPorClave: excludedAsKey.length,
      columnasNoCompartidas: todas.size - shared.length,
    },
  };
}
