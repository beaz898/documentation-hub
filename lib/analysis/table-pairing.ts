import type { PipelineCounters } from './counters';
import { discoverTableKey, type TableKeyResult } from './table-key';
import type { TableGroup } from './table-structure';

/**
 * EL EMPAREJADOR DE TABLAS (F-88 paso 1).
 *
 * EL HUECO QUE VIENE A TAPAR. La fase 1 recibe DOS TableGroup ya elegidos, y
 * hasta hoy el repositorio no tenía quién los eligiera. Un documento puede
 * tener varias tablas y el candidato también. No salió antes porque cada
 * documento del corpus de pruebas tiene exactamente una —la batería de la fase
 * 1 lo asevera con `toHaveLength(1)`—, así que N×M era 1×1 y el problema no
 * existía a la vista. F-83 P2 y F-84 P1 hablaban de «la pareja de tablas» en
 * SINGULAR, y ese singular era el supuesto entero.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA REGLA, textual de F-88 P1, para que no se vuelva a dudar:
 *
 *   todo par de tablas entre los dos documentos es candidato;
 *   se compara si el descubrimiento de clave lo admite;
 *   se emite si empareja AL MENOS UNA FILA;
 *   todo lo demás se cuenta.
 *
 * Cero números nuevos. El «umbral justificado» que haría falta para filtrar
 * pares por columnas compartidas YA EXISTE y se llama descubrimiento de clave:
 * está medido desde F-78/F-81 y no hay que inventar ninguna cifra.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * LAS TRES PUERTAS, y solo la tercera es nueva:
 *
 *   1ª · EL DESCUBRIMIENTO DE CLAVE. Dos tablas que no comparten una columna
 *        con unicidad suficiente en AMBAS no producen clave: caen a
 *        `sin_clave` y no hay diff. Quedan para el juez, como siempre.
 *   2ª · EL EMPAREJAMIENTO DE FILAS POR CONSENSO. Una clave sin filas comunes
 *        no compara nada. Ocurre dentro de `discoverTableKey`.
 *   3ª · LA ÚNICA NUEVA: un par emite solo si empareja al menos una fila. Dos
 *        tablas que comparten la columna «Código» pero cero códigos comunes no
 *        son la misma tabla en dos documentos: son DOS POBLACIONES DISTINTAS.
 *        Se cuenta en `sin_interseccion`.
 *
 * EL DOBLE EMPAREJAMIENTO ES LEGÍTIMO Y SALE SOLO. Si una tabla del documento
 * nuevo pasa las tres puertas con DOS del candidato —un fichero con la hoja
 * 2025 y la 2026 contra otro con una sola—, se devuelven LAS DOS. Las dos son
 * hechos estructurales verdaderos, y quedarse con una sería el decreto que
 * F-88 descartó al rechazar la opción «mejor clave».
 *
 * NO HAY NADA QUE ELEGIR AQUÍ, y ese es el diseño: este módulo RECORRE, no
 * puntúa. Si alguien añade un `break`, un `find` o un «el de mejor clave», el
 * doble emparejamiento muere en silencio — y tiene su caso en la batería para
 * que no pueda morir callado.
 *
 * ESTE MÓDULO NO EMITE NADA. Devuelve los pares emitibles y sus contadores;
 * quien los use es el commit de emisión. Aquí no se compara ni una celda.
 */

/**
 * Un par de tablas CON CLAVE DESCUBIERTA. Lo usan las DOS listas del resultado
 * —emitidos y caídos por la 3ª puerta— porque llevan exactamente lo mismo: las
 * dos tablas y el resultado de la fase 1. Lo que los distingue no es su forma
 * sino EN QUÉ LISTA están, y por eso no hay un tipo hermano: inventarlo sería
 * duplicar una forma que ya existe para marcar una diferencia que el nombre de
 * la lista ya marca.
 */
export interface ParDeTablas {
  nueva: TableGroup;
  existente: TableGroup;
  /** El resultado de la fase 1, ya en su rama emparejada: trae las parejas de
   *  filas, las que quedaron solas de cada lado y las ambiguas. La emisión lo
   *  necesita entero — `onlyNueva`/`onlyExistente` son la sección de cobertura
   *  de F-83 P2. */
  clave: Extract<TableKeyResult, { status: 'emparejado' }>;
}

export interface EmparejamientoDeTablas {
  /** Los que pasaron LAS TRES puertas. Sobre éstos el diff comparó celda a
   *  celda, y por eso es el único territorio donde tiene dominancia. */
  pares: ParDeTablas[];
  /**
   * LOS CAÍDOS POR LA 3ª PUERTA, CON SU CLAVE (F-90 P1).
   *
   * Clave descubierta y CERO filas comunes: dos poblaciones distintas que
   * comparten estructura. Hasta F-90 solo se contaban, y eso perdía algo que
   * la estructura SÍ sabe — y sabe muchísimo: que ninguna fila de una tabla es
   * la misma entidad que ninguna de la otra.
   *
   * PARA QUÉ SIRVEN, y es lo que justifica listarlos: si el juez empareja dos
   * filas de un par así, R2 puede verificarlo con la clave y el emparejamiento
   * FALLA SIEMPRE, por definición de la puerta. Así que estos pares no se
   * suprimen por decreto —como sí se hará con los emitidos, donde el diff tiene
   * dominancia— sino que cada hallazgo muere VERIFICADO, caso a caso y con
   * contador. Supresión por la vía limpia.
   *
   * La lista de parejas de filas viene VACÍA en todos ellos, por definición.
   *
   * LOS CAÍDOS POR LA 1ª PUERTA NO SE LISTAN, y no es asimetría: sin clave no
   * hay NADA VERIFICABLE que transportar —discoverTableKey devuelve
   * sin_clave y ahí no hay candidatas ni parejas— así que listarlos sería
   * mover un objeto que nadie puede usar. Su declaración es la de F-74:
   * contador, y el límite dicho.
   */
  sinInterseccion: ParDeTablas[];
  counts: PipelineCounters;
}

/**
 * Empareja las tablas de dos documentos. N×M, sin puntuar y sin elegir.
 *
 * ORDEN DE LOS ARGUMENTOS: `nuevas` son las del documento que se analiza y
 * `existentes` las del candidato del corpus. Es el orden de ROL que usa todo el
 * pipeline, y aquí no hace falta ningún orden canónico: quien necesita
 * identidad estable en el tiempo es la huella, y la aplica después, donde los
 * ids existen (ver huella-hallazgo.ts).
 */
export function emparejarTablas(
  nuevas: TableGroup[],
  existentes: TableGroup[],
): EmparejamientoDeTablas {
  const pares: ParDeTablas[] = [];
  const sinInterseccion: ParDeTablas[] = [];
  let candidatos = 0;
  let sinClave = 0;
  let sinIntersecionCount = 0;
  let rechazadasPorEscritura = 0;

  for (const nueva of nuevas) {
    for (const existente of existentes) {
      candidatos++;
      const clave = discoverTableKey(nueva, existente);

      // B.117: se suma SIEMPRE, pase el par o no. Es una incidencia del
      // criterio de comparación —cuántas filas habrían emparejado distinto con
      // la normalización agresiva— y ocurre al descubrir la clave, no al
      // emitir. Contarla solo en los pares emitidos mediría otra cosa.
      rechazadasPorEscritura += clave.counts.discrepanciaPorNormalizar;

      // 1ª PUERTA.
      if (clave.status !== 'emparejado') {
        sinClave++;
        continue;
      }

      // 3ª PUERTA. La 2ª ya ocurrió dentro de `discoverTableKey`: si el
      // consenso no emparejó ninguna fila, `pairs` viene vacío.
      //
      // SE CUENTA Y SE LISTA (F-90 P1). El contador dice cuántos; la lista
      // lleva su CLAVE, que es lo que permite a R2 verificar después que un
      // emparejamiento del juez sobre esas tablas es imposible.
      if (clave.pairs.length === 0) {
        sinIntersecionCount++;
        sinInterseccion.push({ nueva, existente, clave });
        continue;
      }

      pares.push({ nueva, existente, clave });
    }
  }

  // LOS CUATRO SIEMPRE, incluso a cero. La distinción ausente/cero de
  // `PipelineCounters` es información: ausente significa «esta etapa no
  // corrió». Si el emparejador corrió y no encontró nada que emitir, el cero
  // es la verdad y hay que escribirlo.
  //
  // `rechazadas_por_escritura` va en el mismo objeto pero es de OTRA etapa
  // (`diff.clave`), y eso no es un descuido: lo cuenta el descubrimiento de
  // clave, no el emparejador. Quien lo funde río arriba lo distinguirá por su
  // apellido, que es para lo que existe la cláusula 1.
  const counts: PipelineCounters = {
    'diff.tablas.candidatos': candidatos,
    'diff.tablas.sin_clave': sinClave,
    'diff.tablas.sin_interseccion': sinIntersecionCount,
    'diff.tablas.emitidos': pares.length,
    'diff.clave.rechazadas_por_escritura': rechazadasPorEscritura,
  };

  return { pares, sinInterseccion, counts };
}
