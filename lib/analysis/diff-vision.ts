import type { TableGroup } from './table-structure';

/**
 * LA VISIÓN DEL DIFF — el denominador de sus ceros (F-103 P3, pieza 2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️ QUÉ PROBLEMA RESUELVE, con los dos casos reales que lo pidieron. Estas dos
 * frases están en el mismo registro, con una semana de diferencia, y **desde
 * fuera son indistinguibles**:
 *
 *   · «Diff de tablas · 0 parejas» — 04/09. **Correcto**: RRHH-08 y OPE-13
 *     comparten columnas, pero ninguna identifica una fila. El emparejador miró
 *     y no encontró clave.
 *   · «Diff de tablas — TOTAL: 0 sobre 0 parejas» — B.175. **CEGUERA**: no es
 *     que no encontrara parejas; es que **no le llegó ni una tabla**.
 *
 * El segundo tardó semanas en salir, y hizo falta que alguien empujara. Con la
 * visión declarada, habría dicho `tablas_analizado: 0` — y eso **es la alarma en
 * sí misma**.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LA REGLA, de F-103 P1 y P2: **un cero solo confirma cuando los DOS lados
 * vieron.** Y por eso se cuenta a cada lado por separado en vez de sumar: un
 * total de «2 tablas» no distingue «una y una» —que se pueden comparar— de «dos
 * y ninguna», que es ceguera con buena pinta.
 *
 * ⚠️ ESTO NO REDEFINE `diff.tablas.*`. Aquel reparto cuenta lo que pasa DENTRO
 * del emparejador y tiene su invariante medida
 * (`candidatos === sin_clave + sin_interseccion + emitidos`). La visión es la
 * capa de ANTES: qué le llegó al emparejador. Se suma, no sustituye.
 */

export interface VisionDeUnLado {
  tablas: number;
  filas: number;
}

export interface VisionDelPar {
  /** El documento que se está analizando. Es el mismo en todos los pares. */
  analizado: VisionDeUnLado;
  /** El documento del corpus con el que se compara. Cambia en cada par. */
  candidato: VisionDeUnLado;
}

export function visionDeUnLado(tablas: TableGroup[]): VisionDeUnLado {
  return {
    tablas: tablas.length,
    // `totalRows` es lo que el agrupador contó; sumar `rows.length` sería una
    // SEGUNDA cuenta de lo mismo, y dos cuentas se separan sin avisar.
    filas: tablas.reduce((suma, t) => suma + t.totalRows, 0),
  };
}

export type ClaseDeVision =
  /** Los dos lados trajeron al menos una tabla: un cero de aquí SÍ es medición. */
  | 'ambos'
  /** Solo el documento analizado trajo tablas. */
  | 'solo_analizado'
  /** Solo el candidato trajo tablas. */
  | 'solo_candidato'
  /** Ninguno. El emparejador no tenía nada que emparejar. */
  | 'ninguno';

/**
 * ⚠️ LA ASIMETRÍA SE CONSERVA, y es deliberada: `solo_analizado` y
 * `solo_candidato` son cosas distintas y se cuentan aparte. Que el documento
 * nuevo traiga tablas y el candidato no significa «este candidato no sirve para
 * comparar tablas»; al revés significa «al nuevo no le llegó la estructura», que
 * es B.175 y es un fallo NUESTRO. Fundirlas en «alguno» perdería justo la mitad
 * que distingue un caso normal de una avería.
 */
export function clasificarVision(par: VisionDelPar): ClaseDeVision {
  const a = par.analizado.tablas > 0;
  const b = par.candidato.tablas > 0;
  if (a && b) return 'ambos';
  if (a) return 'solo_analizado';
  if (b) return 'solo_candidato';
  return 'ninguno';
}

/**
 * ¿PUEDE LEERSE UN CERO DE ESTE PAR COMO RESULTADO? Solo si los dos lados
 * vieron. Está aparte de `clasificarVision` porque es LA PREGUNTA, y quien la
 * necesite debe poder hacerla sin recordar cuál de las cuatro clases vale.
 */
export function elCeroEsInterpretable(par: VisionDelPar): boolean {
  return clasificarVision(par) === 'ambos';
}

export interface ContadoresDeVision {
  /** Pares en los que los dos lados trajeron tablas. */
  pares_con_vision: number;
  /** Pares evaluados con algún lado a cero. Un cero de éstos NO es medición. */
  pares_ciegos: number;
  /** De los ciegos, aquéllos en los que el que no vio fue el documento analizado. */
  ciegos_por_el_analizado: number;
  /** Tablas y filas del documento analizado. Es el mismo en todos los pares. */
  tablas_analizado: number;
  filas_analizado: number;
  /** Suma sobre los candidatos evaluados. */
  tablas_candidatos: number;
  filas_candidatos: number;
}

/**
 * ⚠️ LAS SIETE CIFRAS SALEN SIEMPRE, aunque valgan cero. Es la regla del cero
 * aplicada al propio instrumento: un contador que desaparece cuando vale cero es
 * indistinguible de uno que nadie calculó, y entonces el denominador tampoco se
 * puede leer.
 *
 * ⚠️ Y `tablas_analizado` NO SE SUMA SOBRE LOS PARES: es el mismo documento en
 * todos, así que sumarlo multiplicaría por el número de candidatos y daría una
 * cifra que parece un total y es un producto. Se toma del primero. Con cero
 * pares no hay nada que tomar, y sale cero — que en ese caso es cierto: no se
 * llegó a mirar nada.
 */
export function contadoresDeVision(pares: VisionDelPar[]): ContadoresDeVision {
  const primero = pares[0];

  return {
    pares_con_vision: pares.filter(elCeroEsInterpretable).length,
    pares_ciegos: pares.filter(p => !elCeroEsInterpretable(p)).length,
    ciegos_por_el_analizado: pares.filter(p => p.analizado.tablas === 0).length,
    tablas_analizado: primero?.analizado.tablas ?? 0,
    filas_analizado: primero?.analizado.filas ?? 0,
    tablas_candidatos: pares.reduce((s, p) => s + p.candidato.tablas, 0),
    filas_candidatos: pares.reduce((s, p) => s + p.candidato.filas, 0),
  };
}
