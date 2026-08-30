import { describe, expect, it } from 'vitest';

import type { GrupoDeTablas } from '@/lib/analysis/types';
import type { Problem } from './problems';
import { etiquetasDeMontones, indiceDeColumnas, mostrarAccionesDeFila, repartirEnTarjetas } from './table-diff-card';

/**
 * BATERÍA DEL NÚCLEO DE LA TARJETA (F-88, ficha A).
 *
 * LO QUE ESTA BATERÍA PUEDE Y LO QUE NO, dicho antes que nada: el alcance de la
 * suite prohíbe los componentes de React, así que el PINTADO no se prueba aquí
 * ni en ningún sitio. Lo que sí se prueba es lo que DECIDE — qué fila va con
 * qué tarjeta, y de quién es cada montón de filas ajenas—, y por eso vive en un
 * .ts aparte en vez de dentro del .tsx.
 *
 * EL CASO QUE JUSTIFICA LA SEPARACIÓN es el de los montones: M6 demostró que
 * los dos lados se podían intercambiar sin que fallara nada, porque el corpus
 * es simétrico (25 y 25, B.121). Aquí los montones son ASIMÉTRICOS a propósito.
 */

const GRUPO = 'g-1';

function grupo(over: Partial<GrupoDeTablas> = {}): GrupoDeTablas {
  return {
    groupId: GRUPO,
    tablaNueva: 'Tarifas#0',
    tablaExistente: 'Tarifas concertadas#0',
    documentoExistente: 'OPE-11_tarifario-tratamientos-seguros.xlsx',
    documentoExistenteId: 'bbb-222',
    discrepantes: 2,
    identicas: 20,
    porColumna: { Precio: 12, Duración: 3 },
    variantesDeEscritura: [],
    soloEnNuevo: [],
    soloEnOtro: [],
    ...over,
  };
}

function fila(id: string, groupId?: string): Problem {
  return {
    id,
    type: 'contradiccion',
    title: `Discrepancia ${id}`,
    description: '',
    ...(groupId ? { groupId, origen: 'diff_tabular' as const } : {}),
  };
}

describe('repartirEnTarjetas — qué fila va con qué tarjeta', () => {
  it('junta las filas con su grupo', () => {
    const r = repartirEnTarjetas([fila('a', GRUPO), fila('b', GRUPO)], [grupo()]);

    expect(r.tarjetas).toHaveLength(1);
    expect(r.tarjetas[0].filas.map(p => p.id)).toEqual(['a', 'b']);
    expect(r.sueltos).toHaveLength(0);
  });

  /**
   * NADA DESAPARECE EN SILENCIO. Las contradicciones de PROSA del mismo
   * análisis no tienen groupId, y si esta función se quedara solo con lo
   * agrupado se esfumarían de la pantalla sin que nadie lo notara.
   */
  it('lo que no es de ninguna tarjeta sale como suelto, no se pierde', () => {
    const prosa = fila('prosa');
    const r = repartirEnTarjetas([fila('a', GRUPO), prosa], [grupo()]);

    expect(r.tarjetas[0].filas.map(p => p.id)).toEqual(['a']);
    expect(r.sueltos.map(p => p.id)).toEqual(['prosa']);
  });

  it('DOS grupos son DOS tarjetas, cada una con lo suyo', () => {
    const g2 = grupo({ groupId: 'g-2', tablaExistente: 'Hoja2025#0' });
    const r = repartirEnTarjetas(
      [fila('a', GRUPO), fila('b', 'g-2'), fila('c', GRUPO)],
      [grupo(), g2],
    );

    expect(r.tarjetas).toHaveLength(2);
    expect(r.tarjetas[0].filas.map(p => p.id)).toEqual(['a', 'c']);
    expect(r.tarjetas[1].filas.map(p => p.id)).toEqual(['b']);
  });

  /**
   * UN GRUPO SIN FILAS SIGUE SIENDO UNA TARJETA. Es el par cuyo único
   * resultado fue cobertura, que F-84 P1 declaró caso aceptable: «aparecería
   * con contadores a cero — correcto, porque no hay nada que revisar».
   * Ocultarlo dejaría las cincuenta ajenas sin domicilio, que es justo lo que
   * esta ficha viene a arreglar.
   */
  it('un grupo SIN discrepancias conserva su tarjeta', () => {
    const r = repartirEnTarjetas([], [grupo({ discrepantes: 0, soloEnNuevo: [{ clave: 'X', texto: 'x' }] })]);

    expect(r.tarjetas).toHaveLength(1);
    expect(r.tarjetas[0].filas).toHaveLength(0);
  });

  it('un groupId que no corresponde a ningún grupo emitido queda suelto', () => {
    // Pasa con un análisis guardado a medias: la fila trae su groupId y el
    // grupo no llegó. La tarjeta no puede inventarse lo que le falta.
    const r = repartirEnTarjetas([fila('huerfana', 'g-desconocido')], [grupo()]);

    expect(r.tarjetas[0].filas).toHaveLength(0);
    expect(r.sueltos.map(p => p.id)).toEqual(['huerfana']);
  });

  it('sin grupos, todo es suelto y nada cambia', () => {
    const problemas = [fila('a'), fila('b')];

    expect(repartirEnTarjetas(problemas, undefined).sueltos).toBe(problemas);
    expect(repartirEnTarjetas(problemas, []).sueltos).toBe(problemas);
  });
});

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
    // El montón del documento ANALIZADO lleva SU nombre y SUS dos filas.
    expect(m[0].documento).toBe(ANALIZADO);
    expect(m[0].filas).toHaveLength(2);
    // El del candidato, el suyo y sus tres.
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

describe('mostrarAccionesDeFila — la supresión de F-88 P2', () => {
  /**
   * HUECO ENCONTRADO POR MUTACIÓN: mientras esta condición vivía dentro del
   * JSX, devolverle los botones a una fila tabular no rompía NADA — el alcance
   * de la suite prohíbe React, así que ahí dentro no hay nada que vigile. La
   * decisión salió del pintado para que este caso pueda existir.
   */
  it('una fila del diff de tablas NO lleva acciones', () => {
    expect(mostrarAccionesDeFila(fila('a', GRUPO))).toBe(false);
  });

  /**
   * Y LA OTRA MITAD, que es la que hace útil el caso: R2 emite hallazgos
   * estructurales sobre PROSA y ésos SÍ conservan sus acciones. Suprimirlas a
   * todo sería tan falso como no suprimirlas a nada.
   */
  it('una contradicción de prosa SÍ las lleva', () => {
    expect(mostrarAccionesDeFila(fila('prosa'))).toBe(true);
  });

  it('un hallazgo estructural de PROSA las conserva: no decide confirmedBy, decide la materia', () => {
    const estructuralDeProsa: Problem = { ...fila('r2'), title: 'Confirmada por estructura' };
    expect(mostrarAccionesDeFila(estructuralDeProsa)).toBe(true);
  });
});
