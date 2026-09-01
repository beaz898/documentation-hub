import { describe, expect, it } from 'vitest';

import type { GrupoDeTablas } from '@/lib/analysis/types';
import type { Problem } from './problems';
import { mostrarAccionesDeFila } from './problems';
import { contarSinCorrespondencia, etiquetasDeMontones, indiceDeColumnas, ordenDeGrupos, tieneCobertura } from './table-coverage';

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

describe('mostrarAccionesDeFila — de la supresión de F-88 P2 a la identidad de F-94', () => {
  /**
   * ⚠️ EL CASO QUE NO PUEDE PERDERSE, y ya sobrevivió a una reorganización de
   * pantalla: LA PROSA CONSERVA SUS BOTONES. R2 emite hallazgos estructurales
   * sobre prosa y ésos siempre tienen identidad —sus citas—, así que nunca
   * dependieron de nada de esto. Suprimirlas a todo sería tan falso como no
   * suprimirlas a nada.
   *
   * Vive fuera del JSX por una mutación que sobrevivió: ahí dentro no hay nada
   * que lo vigile, porque el alcance de Vitest prohíbe React.
   */
  it('una contradicción de prosa SÍ las lleva', () => {
    expect(mostrarAccionesDeFila(fila('prosa'))).toBe(true);
  });

  /**
   * LA MITAD QUE CAMBIÓ EL 01/09. Antes esto era `false` para TODO lo tabular
   * (F-88 P2): el botón estaba respaldado por la huella de PROSA y pulsarlo
   * sobre una fila habría registrado el juicio con una identidad de texto.
   * Aquella cláusula PAGÓ —durante todo el frente 1 no se registró ni un juicio
   * tabular equivocado, porque el botón no existía— y por eso no hubo nada que
   * migrar al cambiarla.
   * Ahora lo que decide no es la materia sino LA IDENTIDAD: con huella tabular,
   * el descarte se puede recordar.
   */
  it('una fila del diff CON huella SÍ lleva acciones', () => {
    expect(mostrarAccionesDeFila({ ...fila('a', true), huella: 'f'.repeat(64) })).toBe(true);
  });

  /**
   * Y LA OTRA MITAD, que es la que impide prometer memoria sin poder cumplirla:
   * el camino PRE-INDEXADO de F-87 P1 emite el hallazgo sin huella —no hay id
   * del documento analizado con el que construirla— y ahí el botón no debe
   * aparecer. Un descarte que no se puede recordar es peor que ninguno: el
   * usuario cree haber cerrado algo que volverá.
   */
  it('una fila del diff SIN huella NO lleva acciones', () => {
    expect(mostrarAccionesDeFila(fila('a', true))).toBe(false);
    expect(mostrarAccionesDeFila({ ...fila('a', true), huella: '' })).toBe(false);
  });
});
describe('contarSinCorrespondencia — el recuento cuenta lo que el nombre dice', () => {
  /**
   * HUECO ENCONTRADO POR MUTACIÓN: la regla estaba escrita en el comentario de
   * la función y en ningún caso, así que sumarle las idénticas no rompía nada.
   *
   * LA REGLA: el titular dice «Sin correspondencia (N)», y N tiene que ser las
   * filas SIN PAREJA. Las idénticas y las variantes van dentro del mismo grupo
   * pero no cuentan aquí: «Sin correspondencia (73)» sobre 50 sin pareja más 20
   * idénticas más 3 variantes sería un número que no significa nada.
   * Es la misma disciplina que F-84 P1 aplicó a los contadores planos.
   */
  it('suma los DOS montones y nada más', () => {
    const g = grupo({
      soloEnNuevo: [{ clave: 'A', texto: 'a' }, { clave: 'B', texto: 'b' }],
      soloEnOtro: [{ clave: 'C', texto: 'c' }],
      identicas: 20,
      variantesDeEscritura: [{ clave: 'V', columnas: ['X'], enNuevo: 'v', enOtro: 'V' }],
    });

    expect(contarSinCorrespondencia([g])).toBe(3);
  });

  it('suma a través de varias parejas de tablas', () => {
    const a = grupo({ groupId: 'g-1', soloEnNuevo: [{ clave: 'A', texto: 'a' }], identicas: 0 });
    const b = grupo({ groupId: 'g-2', soloEnOtro: [{ clave: 'C', texto: 'c' }, { clave: 'D', texto: 'd' }], identicas: 0 });

    expect(contarSinCorrespondencia([a, b])).toBe(3);
  });

  /** Un grupo cuyo único resultado fueron discrepancias no aporta nada al
   *  recuento — sus quince ya están arriba, como cajas sueltas. */
  it('un grupo solo con discrepancias e idénticas cuenta cero', () => {
    expect(contarSinCorrespondencia([grupo({ identicas: 20 })])).toBe(0);
  });
});

describe('ordenDeGrupos — «Sin correspondencia» en segundo lugar', () => {
  const TIPOS = ['contradiccion', 'inconsistencia_menor', 'duplicidad', 'ambiguedad'];

  it('va JUSTO DESPUÉS de las contradicciones', () => {
    const r = ordenDeGrupos(TIPOS, true);

    expect(r[0]).toEqual({ clase: 'tipo', tipo: 'contradiccion' });
    expect(r[1]).toEqual({ clase: 'cobertura' });
    expect(r[2]).toEqual({ clase: 'tipo', tipo: 'inconsistencia_menor' });
  });

  /**
   * EL CASO QUE UN `indexOf` INGENUO ROMPE. Sin grupo de contradicciones no hay
   * «después de» que valga, y dejar la cobertura al final por descarte la
   * escondería justo en el análisis donde es lo único que hay que enseñar — el
   * par cuyo único resultado fue cobertura, que F-84 P1 declaró caso aceptable.
   */
  it('si NO hay contradicciones, va la PRIMERA', () => {
    const r = ordenDeGrupos(['duplicidad', 'ambiguedad'], true);

    expect(r[0]).toEqual({ clase: 'cobertura' });
    expect(r[1]).toEqual({ clase: 'tipo', tipo: 'duplicidad' });
  });

  it('sin ningún grupo, la cobertura es lo único', () => {
    expect(ordenDeGrupos([], true)).toEqual([{ clase: 'cobertura' }]);
  });

  it('sin cobertura, el orden es el de siempre y nada se mueve', () => {
    const r = ordenDeGrupos(TIPOS, false);

    expect(r).toHaveLength(4);
    expect(r.map(x => x.clase === 'tipo' ? x.tipo : 'COBERTURA')).toEqual(TIPOS);
  });

  /** No se pierde ni se duplica ningún grupo: el orden REORDENA, no filtra. */
  it('están todos los grupos, una sola vez', () => {
    const r = ordenDeGrupos(TIPOS, true);
    const tipos = r.filter(x => x.clase === 'tipo').map(x => (x as { tipo: string }).tipo);

    expect(tipos).toEqual(TIPOS);
    expect(r.filter(x => x.clase === 'cobertura')).toHaveLength(1);
  });
});
