import { describe, expect, it } from 'vitest';

import type { GrupoDeTablas } from '@/lib/analysis/types';
import type { Problem } from './problems';
import { mostrarAccionesDeFila } from './problems';
import { etiquetasDeMontones, indiceDeColumnas, tieneCobertura } from './table-coverage';

/**
 * BATERÍA DEL BLOQUE DE COBERTURA (F-88, ficha A revisada).
 *
 * LO QUE ESTA BATERÍA PUEDE Y LO QUE NO: el alcance de la suite prohíbe los
 * componentes de React, así que el PINTADO no se prueba aquí ni en ningún
 * sitio — ni que el bloque vaya debajo, ni que arranque plegado. Lo que sí se
 * prueba es lo que DECIDE: de quién es cada montón, el orden del índice, y si
 * un grupo tiene algo que enseñar.
 *
 * QUÉ SE RETIRÓ AL VOLVER A LAS CAJAS SUELTAS, dicho aquí y no callado: los
 * seis casos de `repartirEnTarjetas` fijaban la AGRUPACIÓN EN PANTALLA —qué
 * fila iba con qué tarjeta— y esa agrupación es justo lo que la decisión de
 * producto retiró. No sobraban por descuido: dejaron de tener objeto.
 * Sobrevive todo lo demás.
 *
 * EL CASO QUE JUSTIFICA QUE ESTO SEA UN .ts APARTE sigue siendo el de los
 * montones: M6 demostró que los dos lados se podían intercambiar sin que
 * fallara nada, porque el corpus es simétrico (25 y 25, B.121). Aquí son
 * ASIMÉTRICOS a propósito.
 */

function grupo(over: Partial<GrupoDeTablas> = {}): GrupoDeTablas {
  return {
    groupId: 'g-1',
    tablaNueva: 'Tarifas#0',
    tablaExistente: 'Tarifas concertadas#0',
    documentoExistente: 'OPE-11_tarifario-tratamientos-seguros.xlsx',
    documentoExistenteId: 'bbb-222',
    discrepantes: 15,
    identicas: 20,
    porColumna: { Precio: 12, Duración: 3 },
    variantesDeEscritura: [],
    soloEnNuevo: [],
    soloEnOtro: [],
    ...over,
  };
}

function fila(id: string, tabular = false): Problem {
  return {
    id,
    type: 'contradiccion',
    title: `Discrepancia ${id}`,
    description: '',
    ...(tabular ? { origen: 'diff_tabular' as const, groupId: 'g-1' } : {}),
  };
}

describe('etiquetasDeMontones — el indicativo, y de quién es cada montón', () => {
  const ANALIZADO = 'OPE-10_tarifario-tratamientos-2026.xlsx';

  /**
   * EL CASO DE M6, con montones ASIMÉTRICOS a propósito.
   *
   * Con 25 y 25 —lo que da el corpus— intercambiar los dos lados no rompe
   * nada: los recuentos cuadran igual y el indicativo dice lo contrario de lo
   * que pasa sin que ningún número se mueva. Con 2 y 3, no hay dónde
   * esconderse.
   */
  it('cada montón se nombra con SU documento (montones asimétricos)', () => {
    const g = grupo({
      soloEnNuevo: [{ clave: 'A', texto: 'a' }, { clave: 'B', texto: 'b' }],
      soloEnOtro: [{ clave: 'C', texto: 'c' }, { clave: 'D', texto: 'd' }, { clave: 'E', texto: 'e' }],
    });
    const m = etiquetasDeMontones(g, ANALIZADO);

    expect(m).toHaveLength(2);
    expect(m[0].documento).toBe(ANALIZADO);
    expect(m[0].filas).toHaveLength(2);
    expect(m[1].documento).toBe(g.documentoExistente);
    expect(m[1].filas).toHaveLength(3);
  });

  it('un montón vacío no se enseña', () => {
    const g = grupo({ soloEnNuevo: [], soloEnOtro: [{ clave: 'C', texto: 'c' }] });
    const m = etiquetasDeMontones(g, ANALIZADO);

    expect(m).toHaveLength(1);
    expect(m[0].documento).toBe(g.documentoExistente);
  });

  it('sin filas ajenas de ningún lado, no hay montones', () => {
    expect(etiquetasDeMontones(grupo(), ANALIZADO)).toHaveLength(0);
  });

  /**
   * NI «NUEVA» NI «ELIMINADA», INNEGOCIABLE (F-83 P2). Esta función devuelve
   * NOMBRES DE DOCUMENTO y nada más: no hay ningún sitio donde colar una
   * flecha temporal, y ése es el diseño. El caso lo fija sobre lo que sale.
   */
  it('no devuelve roles ni flechas temporales, solo nombres de documento', () => {
    const g = grupo({ soloEnNuevo: [{ clave: 'A', texto: 'a' }], soloEnOtro: [{ clave: 'C', texto: 'c' }] });
    const nombres = etiquetasDeMontones(g, ANALIZADO).map(m => m.documento);

    expect(nombres).toEqual([ANALIZADO, g.documentoExistente]);
    for (const n of nombres) {
      expect(n).not.toMatch(/nuev[ao]|eliminad[ao]|añadid[ao]|retirad[ao]/i);
    }
  });
});

describe('indiceDeColumnas — el reparto del titular', () => {
  it('ordena de más a menos filas afectadas', () => {
    expect(indiceDeColumnas({ Duración: 3, Precio: 12, Sala: 7 })).toEqual([
      { columna: 'Precio', filas: 12 },
      { columna: 'Sala', filas: 7 },
      { columna: 'Duración', filas: 3 },
    ]);
  });

  /** Con empate, por nombre: un orden inestable haría creer que algo cambió
   *  entre dos análisis del mismo documento. */
  it('con empate ordena por nombre, para que el titular no baile', () => {
    expect(indiceDeColumnas({ Zona: 2, Alta: 2 }).map(c => c.columna)).toEqual(['Alta', 'Zona']);
  });

  it('sin columnas, lista vacía', () => {
    expect(indiceDeColumnas({})).toEqual([]);
  });
});

describe('tieneCobertura — ¿tiene este grupo algo que enseñar?', () => {
  /**
   * UN GRUPO SOLO CON DISCREPANCIAS NO APORTA NADA A ESTE BLOQUE: sus quince
   * ya están arriba, como cajas sueltas. Pintarle un bloque vacío sería ruido.
   */
  it('un grupo sin cobertura no se enseña', () => {
    expect(tieneCobertura(grupo({ identicas: 0 }))).toBe(false);
  });

  /** Las idénticas cuentan, aunque sean solo un número: «20 filas idénticas»
   *  es cobertura verificada, y media respuesta a «¿esto ya lo tenía?». */
  it('las idénticas solas ya son algo que enseñar', () => {
    expect(tieneCobertura(grupo({ identicas: 20 }))).toBe(true);
  });

  it('las filas ajenas de cualquiera de los dos lados bastan', () => {
    expect(tieneCobertura(grupo({ identicas: 0, soloEnNuevo: [{ clave: 'A', texto: 'a' }] }))).toBe(true);
    expect(tieneCobertura(grupo({ identicas: 0, soloEnOtro: [{ clave: 'C', texto: 'c' }] }))).toBe(true);
  });

  it('las variantes de escritura también', () => {
    expect(tieneCobertura(grupo({
      identicas: 0,
      variantesDeEscritura: [{ clave: 'A', columnas: ['Clínica'], enNuevo: 'a', enOtro: 'A' }],
    }))).toBe(true);
  });
});

describe('mostrarAccionesDeFila — la supresión de F-88 P2', () => {
  /**
   * ES EL RIESGO REAL DE ESTE COMMIT: las quince vuelven a la lista por tipo,
   * que es DONDE ESTÁN LOS BOTONES. Si la supresión no siguiera en pie, volver
   * a las cajas sueltas las habría reintroducido por la puerta de atrás — con
   * la maquinaria de huella de PROSA detrás, que es el desajuste que F-86 mató.
   *
   * Y la condición salió del JSX por una mutación que sobrevivió: ahí dentro no
   * hay nada que vigile, porque el alcance de la suite prohíbe React.
   */
  it('una fila del diff de tablas NO lleva acciones', () => {
    expect(mostrarAccionesDeFila(fila('a', true))).toBe(false);
  });

  /**
   * Y LA OTRA MITAD, que es la que hace útil el caso: R2 emite hallazgos
   * estructurales sobre PROSA y ésos SÍ conservan sus acciones. Suprimirlas a
   * todo sería tan falso como no suprimirlas a nada.
   */
  it('una contradicción de prosa SÍ las lleva', () => {
    expect(mostrarAccionesDeFila(fila('prosa'))).toBe(true);
  });
});
