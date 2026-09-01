import { describe, expect, it } from 'vitest';

import type { GrupoDeTablas } from '@/lib/analysis/types';
import type { Problem } from './problems';
import { mostrarAccionesDeFila } from './problems';
import { contarIdenticas, contarSinCorrespondencia, contarVariantes, etiquetasDeMontones, hayRanuraDeCobertura, hayRanuraDeIdenticas, hayRanuraDeVariantes, indiceDeColumnas, lineasDeIdenticas, ordenDeGrupos, tieneCobertura, tieneIdenticas, tieneVariantes } from './table-coverage';

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

  /**
   * ⚠️ LAS IDÉNTICAS TAMPOCO, Y ESTE CASO AFIRMABA LO CONTRARIO HASTA EL 01/09
   * por la tarde. No se puso rojo por descuido: la decisión de producto lo
   * invirtió, igual que hizo con las variantes por la mañana.
   * Se queda como GUARDIA de la mitad que se movió, y como la prueba de que el
   * titular y su contenido vuelven a decir lo mismo: si alguien devuelve las
   * idénticas a este OR, «Sin correspondencia» puede volver a anunciar un cero
   * con cosas debajo, que es el defecto que las dos decisiones cierran.
   */
  it('las idénticas YA NO: tienen su propia línea al final', () => {
    const soloIdenticas = grupo({ identicas: 20, soloEnNuevo: [], soloEnOtro: [], variantesDeEscritura: [] });

    expect(tieneCobertura(soloIdenticas)).toBe(false);
    expect(tieneIdenticas(soloIdenticas)).toBe(true);
  });

  it('las filas ajenas de cualquiera de los dos lados bastan', () => {
    expect(tieneCobertura(grupo({ identicas: 0, soloEnNuevo: [{ clave: 'A', texto: 'a' }] }))).toBe(true);
    expect(tieneCobertura(grupo({ identicas: 0, soloEnOtro: [{ clave: 'C', texto: 'c' }] }))).toBe(true);
  });

  /**
   * ⚠️ LAS VARIANTES YA NO, Y ESTE CASO AFIRMABA LO CONTRARIO HASTA EL 01/09.
   * No se puso rojo por descuido: la decisión de producto lo invirtió. Se queda
   * como GUARDIA de la mitad que se movió — si alguien devuelve las variantes a
   * este OR sin devolverlas al bloque, la ranura «Sin correspondencia» se abre
   * con un cero y nada dentro, que es el defecto que la decisión cierra.
   */
  it('las variantes de escritura YA NO: tienen ranura propia', () => {
    const soloVariantes = grupo({
      identicas: 0,
      variantesDeEscritura: [{ clave: 'A', columnas: ['Clínica'], enNuevo: 'a', enOtro: 'A' }],
    });

    expect(tieneCobertura(soloVariantes)).toBe(false);
    expect(tieneVariantes(soloVariantes)).toBe(true);
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

describe('ordenDeGrupos — las dos informativas tras las contradicciones', () => {
  const TIPOS = ['contradiccion', 'inconsistencia_menor', 'duplicidad', 'ambiguedad'];

  it('va JUSTO DESPUÉS de las contradicciones', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: true, variantes: false, identicas: false });

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
    const r = ordenDeGrupos(['duplicidad', 'ambiguedad'], { cobertura: true, variantes: false, identicas: false });

    expect(r[0]).toEqual({ clase: 'cobertura' });
    expect(r[1]).toEqual({ clase: 'tipo', tipo: 'duplicidad' });
  });

  it('sin ningún grupo, la cobertura es lo único', () => {
    expect(ordenDeGrupos([], { cobertura: true, variantes: false, identicas: false })).toEqual([{ clase: 'cobertura' }]);
  });

  it('sin cobertura, el orden es el de siempre y nada se mueve', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: false, variantes: false, identicas: false });

    expect(r).toHaveLength(4);
    expect(r.map(x => x.clase === 'tipo' ? x.tipo : 'COBERTURA')).toEqual(TIPOS);
  });

  /** No se pierde ni se duplica ningún grupo: el orden REORDENA, no filtra. */
  it('están todos los grupos, una sola vez', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: true, variantes: false, identicas: false });
    const tipos = r.filter(x => x.clase === 'tipo').map(x => (x as { tipo: string }).tipo);

    expect(tipos).toEqual(TIPOS);
    expect(r.filter(x => x.clase === 'cobertura')).toHaveLength(1);
  });
});

/**
 * LA RANURA Y SU CONTENIDO, LA MISMA PREGUNTA (F-94, ficha B, commit 3).
 *
 * ⚠️ QUÉ CAZA ESTA BATERÍA, y no es hipotético: `ChatPanel` decidía si pintar la
 * ranura con «hay grupos» y el bloque decidía qué pintar con `tieneCobertura`.
 * Dos reglas para una pregunta. Cuando discrepaban, el usuario veía un titular
 * «Sin correspondencia (0)» que al desplegarse estaba VACÍO.
 *
 * EL CORPUS NO PUEDE EJERCER ESTO, y por eso las tablas van construidas
 * (legítimo para código determinista, F-83 P3): OPE-10 contra OPE-11 da
 * 20 idénticas y 50 filas ajenas, así que SIEMPRE tiene cobertura. Medido antes
 * de escribir el caso, no supuesto.
 */
describe('hayRanuraDeCobertura — la ranura pregunta lo mismo que el bloque', () => {
  /**
   * EL CASO QUE DISCRIMINA. Dos tablas cuyas filas emparejan TODAS y difieren
   * TODAS: quince discrepancias, ni una idéntica, ni una ajena, ni una variante.
   * Sus quince ya están en la lista de arriba como contradicciones; aquí no hay
   * nada que enseñar.
   * NO ES DE LABORATORIO: un tarifario pequeño en el que cambió cada precio es
   * exactamente esto.
   */
  it('un grupo con discrepancias y NADA informativo no abre ranura', () => {
    const soloDiscrepancias = grupo({ identicas: 0, soloEnNuevo: [], soloEnOtro: [], variantesDeEscritura: [] });

    expect(tieneCobertura(soloDiscrepancias)).toBe(false);
    expect(hayRanuraDeCobertura([soloDiscrepancias])).toBe(false);
    // La regla vieja decía que sí, y ahí estaba la ranura vacía.
    expect([soloDiscrepancias].length > 0).toBe(true);
  });

  /**
   * ⚠️ EL CASO QUE ATA LAS DOS MITADES, y es el que el encargo pide escribir
   * primero. Un grupo cuyo único resultado sean variantes tiene que abrir UNA
   * ranura y solo una: la suya. Si abriera la de cobertura, saldría con un cero
   * y sin contenido; si no abriera ninguna, sus variantes DESAPARECERÍAN — y
   * «nada desaparece en silencio» es lo que F-88 P4 y F-94 P7 mandan conservar.
   * El corpus da CERO variantes en 10.174 comparaciones, así que esta tabla es
   * el único sitio donde esa rama se ejerce.
   */
  it('un grupo con SOLO variantes de escritura NO abre ESTA ranura: abre la suya', () => {
    const soloVariantes = grupo({
      discrepantes: 0,
      identicas: 0,
      soloEnNuevo: [],
      soloEnOtro: [],
      variantesDeEscritura: [
        { clave: 'IMP01', columnas: ['Clínica'], enNuevo: 'Chamberí', enOtro: 'CHAMBERI' },
      ],
    });

    expect(hayRanuraDeCobertura([soloVariantes])).toBe(false);
    expect(hayRanuraDeVariantes([soloVariantes])).toBe(true);
  });

  it('basta con que UNO de los grupos tenga algo', () => {
    const vacio = grupo({ identicas: 0, soloEnNuevo: [], soloEnOtro: [], variantesDeEscritura: [] });
    // ⚠️ ANTES ESTE SEGUNDO GRUPO ERAN IDÉNTICAS, y desde el 01/09 (tarde) las
    // idénticas ya no abren ESTA ranura: tienen la suya. Filas ajenas, que es
    // lo único que este grupo mira ahora.
    const conAjenas = grupo({ groupId: 'g-2', identicas: 0, soloEnNuevo: [{ clave: 'A', texto: 'a' }], soloEnOtro: [], variantesDeEscritura: [] });

    expect(hayRanuraDeCobertura([vacio, conAjenas])).toBe(true);
  });

  /**
   * COMPORTAMIENTO EN AUSENCIA Y EN VACÍO (la cuarta pieza, F-93). `undefined`
   * es el caso NORMAL, no el raro: la inmensa mayoría de los documentos no
   * llevan tablas y nunca traen `tableDiffs`.
   */
  it('sin tablas no hay ranura, ni con undefined ni con lista vacía', () => {
    expect(hayRanuraDeCobertura(undefined)).toBe(false);
    expect(hayRanuraDeCobertura([])).toBe(false);
  });
});

/**
 * LA RANURA PROPIA DE LAS VARIANTES (decisión de producto, 01/09/2026).
 *
 * QUÉ ARREGLA: «Sin correspondencia» cuenta FILAS AJENAS, así que un par cuyo
 * único resultado fueran variantes anunciaba un titular (0) con cosas debajo.
 * Un cero en un titular con contenido se lee como avería.
 *
 * EL CORPUS NO PUEDE EJERCER NADA DE ESTO: cero variantes en 10.174
 * comparaciones —medido, no supuesto—, así que las tablas van construidas
 * (F-83 P3). Es el único sitio donde esta rama se ejerce.
 */
describe('las variantes de escritura, en su propia ranura', () => {
  const UNA_VARIANTE = [{ clave: 'IMP01', columnas: ['Clínica'], enNuevo: 'Chamberí', enOtro: 'CHAMBERI' }];

  const soloVariantes = () => grupo({
    discrepantes: 0, identicas: 0, soloEnNuevo: [], soloEnOtro: [],
    variantesDeEscritura: UNA_VARIANTE,
  });

  it('tieneVariantes mira solo su lista', () => {
    expect(tieneVariantes(soloVariantes())).toBe(true);
    expect(tieneVariantes(grupo({ variantesDeEscritura: [] }))).toBe(false);
    // Ni las idénticas ni las ajenas la abren: cada ranura mira lo suyo.
    expect(tieneVariantes(grupo({ identicas: 20, soloEnNuevo: [{ clave: 'A', texto: 'a' }] }))).toBe(false);
  });

  it('hayRanuraDeVariantes: basta con que uno la tenga, y en ausencia no hay ranura', () => {
    expect(hayRanuraDeVariantes([grupo({ variantesDeEscritura: [] }), soloVariantes()])).toBe(true);
    expect(hayRanuraDeVariantes([grupo({ variantesDeEscritura: [] })])).toBe(false);
    // `undefined` es el caso NORMAL: la mayoría de documentos no llevan tablas.
    expect(hayRanuraDeVariantes(undefined)).toBe(false);
    expect(hayRanuraDeVariantes([])).toBe(false);
  });

  /**
   * EL RECUENTO CUENTA FILAS, NO GRUPOS — la misma regla que hace fiable el de
   * al lado (F-84 P1b: los números miden lo que dicen medir). Dos parejas con
   * tres variantes cada una son SEIS diferencias de escritura, no dos.
   */
  it('contarVariantes suma las filas de todos los grupos', () => {
    const tres = grupo({ variantesDeEscritura: [...UNA_VARIANTE, ...UNA_VARIANTE, ...UNA_VARIANTE] });
    const dos = grupo({ groupId: 'g-2', variantesDeEscritura: [...UNA_VARIANTE, ...UNA_VARIANTE] });

    expect(contarVariantes([tres, dos])).toBe(5);
    expect(contarVariantes([])).toBe(0);
    expect(contarVariantes([grupo({ variantesDeEscritura: [] })])).toBe(0);
  });

  /**
   * ⚠️ LAS DOS RANURAS SON INDEPENDIENTES Y NO SE ROBAN CONTENIDO. Un grupo con
   * las dos cosas abre las dos, y cada titular cuenta lo suyo: veinticinco
   * filas ajenas y una variante son dos números distintos, no uno de 26.
   */
  it('un grupo con ajenas Y variantes abre las dos, con su número cada una', () => {
    const ambas = grupo({
      identicas: 0,
      soloEnNuevo: [{ clave: 'A', texto: 'a' }, { clave: 'B', texto: 'b' }],
      soloEnOtro: [],
      variantesDeEscritura: UNA_VARIANTE,
    });

    expect(hayRanuraDeCobertura([ambas])).toBe(true);
    expect(hayRanuraDeVariantes([ambas])).toBe(true);
    expect(contarSinCorrespondencia([ambas])).toBe(2);
    expect(contarVariantes([ambas])).toBe(1);
  });
});

describe('ordenDeGrupos — dónde entra la ranura de variantes', () => {
  const TIPOS = ['contradiccion', 'inconsistencia_menor', 'duplicidad'];

  it('va DESPUÉS de la cobertura, y las dos tras las contradicciones', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: true, variantes: true, identicas: false });

    expect(r[0]).toEqual({ clase: 'tipo', tipo: 'contradiccion' });
    expect(r[1]).toEqual({ clase: 'cobertura' });
    expect(r[2]).toEqual({ clase: 'variantes' });
    expect(r[3]).toEqual({ clase: 'tipo', tipo: 'inconsistencia_menor' });
  });

  /**
   * SIN COBERTURA, LAS VARIANTES OCUPAN SU SITIO. La posición la decide el
   * bloque informativo entero, no cada ranura por su cuenta: si cada una
   * calculara la suya, la de variantes acabaría al final el día que la otra
   * faltara — que es el mismo fallo que el `indexOf` ingenuo de aquí al lado.
   */
  it('sin cobertura, las variantes ocupan el sitio de la cobertura', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: false, variantes: true, identicas: false });

    expect(r[0]).toEqual({ clase: 'tipo', tipo: 'contradiccion' });
    expect(r[1]).toEqual({ clase: 'variantes' });
    expect(r.filter(x => x.clase === 'cobertura')).toHaveLength(0);
  });

  it('sin contradicciones, las dos informativas van primero y en su orden', () => {
    const r = ordenDeGrupos(['duplicidad'], { cobertura: true, variantes: true, identicas: false });

    expect(r[0]).toEqual({ clase: 'cobertura' });
    expect(r[1]).toEqual({ clase: 'variantes' });
    expect(r[2]).toEqual({ clase: 'tipo', tipo: 'duplicidad' });
  });

  it('sin ninguna de las dos, el orden es el de siempre', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: false, variantes: false, identicas: false });

    expect(r).toHaveLength(3);
    expect(r.every(x => x.clase === 'tipo')).toBe(true);
  });

  /** Ni se pierde ni se duplica nada: el orden REORDENA, no filtra. */
  it('con las dos ranuras siguen estando todos los grupos, una sola vez', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: true, variantes: true, identicas: false });

    expect(r.filter(x => x.clase === 'tipo').map(x => (x as { tipo: string }).tipo)).toEqual(TIPOS);
    expect(r.filter(x => x.clase === 'cobertura')).toHaveLength(1);
    expect(r.filter(x => x.clase === 'variantes')).toHaveLength(1);
  });
});

/**
 * LAS IDÉNTICAS, LA CUARTA CLASE (decisión de producto, 01/09/2026 por la tarde).
 *
 * ⚠️ Y LA ÚNICA QUE NO ES UN GRUPO PLEGABLE, por una razón que está en el
 * contrato y no en el gusto: `GrupoDeTablas.identicas` es un `number` y las
 * filas idénticas NO SE GUARDAN EN NINGUNA PARTE —«IDÉNTICAS: solo el
 * recuento», punto 4 del contrato en `types.ts`—. Un desplegable no tendría qué
 * desplegar salvo su propio titular. Es una LÍNEA.
 *
 * LO QUE CIERRA DEL TODO: con las idénticas fuera, `contarSinCorrespondencia`
 * cuenta EXACTAMENTE lo que hay dentro de su ranura. El titular no puede volver
 * a anunciar un cero con cosas debajo — ni por variantes ni por idénticas.
 */
describe('las idénticas, en su propia línea al final', () => {
  const soloIdenticas = () => grupo({
    discrepantes: 0, identicas: 20, soloEnNuevo: [], soloEnOtro: [], variantesDeEscritura: [],
  });

  it('tieneIdenticas mira solo su número', () => {
    expect(tieneIdenticas(soloIdenticas())).toBe(true);
    expect(tieneIdenticas(grupo({ identicas: 0 }))).toBe(false);
    // Ni las ajenas ni las variantes la abren: cada ranura mira lo suyo.
    expect(tieneIdenticas(grupo({
      identicas: 0,
      soloEnNuevo: [{ clave: 'A', texto: 'a' }],
      variantesDeEscritura: [{ clave: 'B', columnas: ['C'], enNuevo: 'a', enOtro: 'A' }],
    }))).toBe(false);
  });

  it('hayRanuraDeIdenticas: basta con uno, y en ausencia no hay línea', () => {
    expect(hayRanuraDeIdenticas([grupo({ identicas: 0 }), soloIdenticas()])).toBe(true);
    expect(hayRanuraDeIdenticas([grupo({ identicas: 0 })])).toBe(false);
    expect(hayRanuraDeIdenticas(undefined)).toBe(false);
    expect(hayRanuraDeIdenticas([])).toBe(false);
  });

  it('contarIdenticas suma filas de todos los grupos, no grupos', () => {
    const a = grupo({ identicas: 20 });
    const b = grupo({ groupId: 'g-2', identicas: 7 });

    expect(contarIdenticas([a, b])).toBe(27);
    expect(contarIdenticas([])).toBe(0);
    expect(contarIdenticas([grupo({ identicas: 0 })])).toBe(0);
  });

  /**
   * ⚠️ EL PAR QUE ATA LAS DOS MITADES, como en las variantes: un grupo cuyo
   * único contenido sean idénticas tiene que abrir UNA cosa y solo una — su
   * línea. Si abriera la ranura de cobertura, saldría con un cero y sin
   * contenido; si no abriera nada, el recuento DESAPARECERÍA.
   */
  it('un grupo con SOLO idénticas no abre la ranura de cobertura: abre su línea', () => {
    expect(hayRanuraDeCobertura([soloIdenticas()])).toBe(false);
    expect(hayRanuraDeIdenticas([soloIdenticas()])).toBe(true);
  });

  it('un grupo con ajenas E idénticas abre las dos, con su número cada una', () => {
    const ambas = grupo({
      identicas: 20,
      soloEnNuevo: [{ clave: 'A', texto: 'a' }, { clave: 'B', texto: 'b' }],
      soloEnOtro: [],
      variantesDeEscritura: [],
    });

    expect(hayRanuraDeCobertura([ambas])).toBe(true);
    expect(hayRanuraDeIdenticas([ambas])).toBe(true);
    // Dos números distintos, no uno de 22.
    expect(contarSinCorrespondencia([ambas])).toBe(2);
    expect(contarIdenticas([ambas])).toBe(20);
  });
});

/**
 * CUÁNDO LA LÍNEA NOMBRA EL DOCUMENTO, que es lo único que esta ranura DECIDE
 * y por eso no vive en el JSX.
 */
describe('lineasDeIdenticas — el nombre solo cuando hace falta', () => {
  it('con UNA pareja el nombre sobra: la línea ya dice «en ambos documentos»', () => {
    const r = lineasDeIdenticas([grupo({ identicas: 20 })]);

    expect(r).toEqual([{ documento: null, filas: 20 }]);
  });

  /**
   * CON VARIAS, HACE FALTA: tres líneas diciendo «en ambos documentos» sin
   * nombre no distinguirían de qué pareja habla cada una.
   */
  it('con VARIAS parejas cada línea lleva su documento', () => {
    const r = lineasDeIdenticas([
      grupo({ identicas: 20, documentoExistente: 'OPE-11.xlsx' }),
      grupo({ groupId: 'g-2', identicas: 7, documentoExistente: 'RRHH-08.xlsx' }),
    ]);

    expect(r).toEqual([
      { documento: 'OPE-11.xlsx', filas: 20 },
      { documento: 'RRHH-08.xlsx', filas: 7 },
    ]);
  });

  /**
   * ⚠️ LOS GRUPOS SIN IDÉNTICAS NO PRODUCEN LÍNEA. Un «0 filas idénticas» sería
   * exactamente el cero sin contenido que estas dos decisiones vienen a quitar.
   * Y el que no cuenta tampoco cuenta para decidir si hace falta el nombre: con
   * un solo grupo CON idénticas, el nombre sobra aunque haya otros grupos.
   */
  it('los grupos sin idénticas no salen, ni hacen que los demás se nombren', () => {
    const r = lineasDeIdenticas([grupo({ identicas: 0 }), grupo({ groupId: 'g-2', identicas: 20 })]);

    expect(r).toEqual([{ documento: null, filas: 20 }]);
  });

  it('en vacío y en ausencia, ninguna línea', () => {
    expect(lineasDeIdenticas([])).toEqual([]);
    expect(lineasDeIdenticas(undefined)).toEqual([]);
    expect(lineasDeIdenticas([grupo({ identicas: 0 })])).toEqual([]);
  });
});

describe('ordenDeGrupos — las idénticas, las últimas de todo', () => {
  const TIPOS = ['contradiccion', 'inconsistencia_menor', 'duplicidad'];

  /**
   * ⚠️ DETRÁS INCLUSO DE LOS TIPOS, y no pegadas a las otras dos informativas.
   * Es un recuento, no una lista que revisar: la menos accionable de las cuatro.
   */
  it('van al final, después del último tipo', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: true, variantes: true, identicas: true });

    expect(r).toHaveLength(6);
    expect(r[1]).toEqual({ clase: 'cobertura' });
    expect(r[2]).toEqual({ clase: 'variantes' });
    expect(r[r.length - 1]).toEqual({ clase: 'identicas' });
    // Y el último TIPO va antes que ellas.
    expect(r[r.length - 2]).toEqual({ clase: 'tipo', tipo: 'duplicidad' });
  });

  /**
   * EL CASO QUE UN «AL FINAL» INGENUO ROMPE: sin ninguna de las otras dos
   * informativas, las idénticas siguen yendo al final y no se cuelan arriba por
   * herencia del bloque que ya no existe.
   */
  it('sin cobertura ni variantes, siguen al final', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: false, variantes: false, identicas: true });

    expect(r).toHaveLength(4);
    expect(r.slice(0, 3).map(x => (x as { tipo: string }).tipo)).toEqual(TIPOS);
    expect(r[3]).toEqual({ clase: 'identicas' });
  });

  it('sin ningún tipo, las idénticas son lo único y van solas', () => {
    expect(ordenDeGrupos([], { cobertura: false, variantes: false, identicas: true }))
      .toEqual([{ clase: 'identicas' }]);
  });

  it('sin idénticas no hay ranura, y nada más se mueve', () => {
    const r = ordenDeGrupos(TIPOS, { cobertura: true, variantes: false, identicas: false });

    expect(r.filter(x => x.clase === 'identicas')).toHaveLength(0);
    expect(r).toHaveLength(4);
  });
});
