import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { problemsFromAnalysis, type RawAnalysis } from '@/components/improvement/problems';
import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { emitirDiffDeTablas, type LadosDeLaEmision } from './diff-emision';
import { particionDoubleCheck } from './pipeline';
import { construirDiscrepancias, construirTableDiffs } from './synthesize';
import { emparejarTablas } from './table-pairing';
import { groupChunksByTable, type TableGroup } from './table-structure';
import type { DocumentJudgment } from './types';

/**
 * BATERÍA DE LA EMISIÓN DEL DIFF (F-88 paso 2).
 *
 * LA PRUEBA QUE JUSTIFICA EL COMMIT está aquí y no en producción: sobre el
 * corpus real, OPE-10 contra OPE-11 tiene que dar QUINCE discrepancias con el
 * reparto sembrado, más las cincuenta ajenas repartidas 25 y 25 CON EL LADO
 * CORRECTO. La emisión es determinista y los ficheros están en el repositorio,
 * así que no hace falta lanzar un análisis para demostrarlo.
 *
 * Y SE PRUEBA EL CAMINO, no el mecanismo, por la misma razón que en F-86 paso 0:
 * esta tubería ya borró cuatro campos en tránsito. Los casos encadenan
 * emparejador → emisión → synthesize → JSON → problemsFromAnalysis, que es el
 * orden real, y miran el final.
 */

const OPE10 = 'OPE-10_tarifario-tratamientos-2026.xlsx';
const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

const ID_NUEVO = 'aaa11111-1111-1111-1111-111111111111';
const ID_EXISTENTE = 'bbb22222-2222-2222-2222-222222222222';

async function tablasDe(file: string): Promise<TableGroup[]> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  return groupChunksByTable(toStoredChunks(chunkSegments(segments, 'doc-test', file, 'org-test')));
}

function lados(nuevo: string, existente: string, conId = true): LadosDeLaEmision {
  return {
    nuevo: { ...(conId ? { id: ID_NUEVO } : {}), nombre: nuevo },
    existente: { id: ID_EXISTENTE, nombre: existente },
  };
}

async function emitirCorpus(nuevo: string, existente: string, conId = true) {
  const { pares } = emparejarTablas(await tablasDe(nuevo), await tablasDe(existente));
  return emitirDiffDeTablas(pares, lados(nuevo, existente, conId));
}

/** Tabla construida, para lo que el corpus no puede dar. */
function tabla(id: string, columns: string[], filas: Array<Record<string, string>>): TableGroup {
  return {
    tableId: `${id}#0`,
    sheetName: id,
    columns,
    totalRows: filas.length,
    rows: filas.map((cells, i): StoredChunk => ({
      chunkIndex: i,
      chunkType: 'table_row',
      text: Object.values(cells).join(' | '),
      sheetName: id,
      tableId: `${id}#0`,
      rowIndex: i,
      cells,
      columnOrder: null,
    })),
  };
}

describe('LA PRUEBA DEL CORPUS — OPE-10 contra OPE-11', () => {
  it('QUINCE discrepancias, ni una más', async () => {
    const r = await emitirCorpus(OPE10, OPE11);

    expect(r.contradicciones).toHaveLength(15);
    expect(r.grupos).toHaveLength(1);
    expect(r.grupos[0].discrepantes).toBe(15);
  });

  it('las quince llevan confirmedBy estructura, que es la llave de la puerta de F-71', async () => {
    const r = await emitirCorpus(OPE10, OPE11);

    expect(r.contradicciones.every(c => c.confirmedBy === 'estructura')).toBe(true);

    // LA PUERTA, ejercida de verdad y no supuesta: ninguna de las quince se le
    // envía a Sonnet. No se toca esa puerta; se entra por ella.
    const { estructurales, aJuicio } = particionDoubleCheck(r.contradicciones);
    expect(estructurales).toHaveLength(15);
    expect(aJuicio).toHaveLength(0);
  });

  it('VEINTE idénticas y CERO variantes de escritura', async () => {
    const r = await emitirCorpus(OPE10, OPE11);

    expect(r.grupos[0].identicas).toBe(20);
    expect(r.grupos[0].variantesDeEscritura).toHaveLength(0);
    expect(r.counts['diff.clasificacion.variantes_escritura']).toBe(0);
  });

  /**
   * LAS CINCUENTA AJENAS, CADA UNA EN SU LADO — el caso que M6 destapó.
   *
   * El corpus tiene 25 y 25, así que los RECUENTOS son simétricos y no pueden
   * detectar una inversión (B.121). Lo que sí la detecta es MIRAR EL CONTENIDO:
   * las exclusivas de OPE-11 son las SEG-, y las de OPE-10 son CIR-04…URG-06
   * (registro de siembra, §4). Si los lados se intercambiaran, las SEG-
   * aparecerían en el montón equivocado — y el indicativo de F-83 diría
   * «presente solo en OPE-10» sobre una fila que solo está en OPE-11.
   */
  it('las cincuenta ajenas van cada una en SU lado, comprobado por contenido', async () => {
    // Analizando OPE-11: sus exclusivas (las SEG-) son las del lado NUEVO.
    const r = await emitirCorpus(OPE11, OPE10);
    const g = r.grupos[0];

    expect(g.soloEnNuevo).toHaveLength(25);
    expect(g.soloEnOtro).toHaveLength(25);

    expect(g.soloEnNuevo.every(f => f.texto.includes('SEG-'))).toBe(true);
    expect(g.soloEnOtro.some(f => f.texto.includes('SEG-'))).toBe(false);
  });

  it('y al invertir la dirección, las SEG- cambian de montón', async () => {
    // Analizando OPE-10: ahora las SEG- son del OTRO documento.
    const r = await emitirCorpus(OPE10, OPE11);
    const g = r.grupos[0];

    expect(g.soloEnOtro.every(f => f.texto.includes('SEG-'))).toBe(true);
    expect(g.soloEnNuevo.some(f => f.texto.includes('SEG-'))).toBe(false);
  });

  it('las ajenas NO entran en el array de contradicciones', async () => {
    const r = await emitirCorpus(OPE10, OPE11);

    // Quince, no sesenta y cinco. F-84 P1: las cincuenta ajenas no suman en
    // ningún contador plano, y el array ES el contador plano.
    expect(r.contradicciones).toHaveLength(15);
    expect(r.counts['diff.clasificacion.solo_en_a']).toBe(25);
    expect(r.counts['diff.clasificacion.solo_en_b']).toBe(25);
  });

  it('cada fila discrepante lleva su huella tabular', async () => {
    const r = await emitirCorpus(OPE10, OPE11);

    expect(r.contradicciones.every(c => typeof c.huella === 'string' && /^[0-9a-f]{64}$/.test(c.huella!))).toBe(true);
    expect(new Set(r.contradicciones.map(c => c.huella)).size).toBe(15);
  });

  /**
   * EL CAMINO PRE-INDEXADO (F-87 P1): sin id del documento analizado no hay
   * huella, y el hallazgo SE EMITE IGUAL — «justo ahí es donde más vale». Lo
   * que falta es la memoria, no el hallazgo.
   */
  it('sin id del documento analizado se emite igual, sin huella y contado', async () => {
    const r = await emitirCorpus(OPE10, OPE11, false);

    expect(r.contradicciones).toHaveLength(15);
    expect(r.contradicciones.every(c => c.huella === undefined)).toBe(true);
    expect(r.counts['diff.clasificacion.pre_indexado']).toBe(15);
  });


  /**
   * ⚠️ EL PUNTERO DE FILA NO VIAJA AGUAS ABAJO (F-94 P6), y hay que ver las dos
   * mitades juntas para entender por qué no es cosmética.
   *
   * `newDocSays` es EL TEXTO QUE VIAJA: a los tres prompts del cliente y a
   * cualquier huella que se calcule sobre él. Con el `[F3]` dentro, una huella
   * quedaría atada al ORDEN de las filas — insertar una arriba desplazaría los
   * índices y borraría descartes que nadie tocó. Es justo la fragilidad de la
   * identidad accidental que F-94 P1 vino a matar.
   *
   * `newDocRow` es EL CAMPO ESTRUCTURADO y SE QUEDA CON EL ÍNDICE: F-94 dice
   * «el índice vive en un campo estructurado si alguien lo necesita», y éste es
   * ese sitio. Los dos campos existen a propósito y no son el mismo dato.
   */
  it('newDocSays viaja SIN puntero; newDocRow lo conserva', async () => {
    const r = await emitirCorpus(OPE10, OPE11);

    expect(r.contradicciones.every(c => !c.newDocSays.startsWith('[F'))).toBe(true);
    expect(r.contradicciones.every(c => !c.existingDocSays.startsWith('[F'))).toBe(true);
    // Y el campo estructurado sí lo lleva — si esto cayera, el índice se habría
    // perdido del todo en vez de haberse movido de sitio.
    expect(r.contradicciones.every(c => /^\[F\d+\] /.test(c.newDocRow ?? ''))).toBe(true);
    expect(r.contradicciones.every(c => /^\[F\d+\] /.test(c.existingDocRow ?? ''))).toBe(true);
  });

  it('el groupId es el mismo para las quince y para su grupo', async () => {
    const r = await emitirCorpus(OPE10, OPE11);
    const ids = new Set(r.contradicciones.map(c => c.groupId));

    expect(ids.size).toBe(1);
    expect([...ids][0]).toBe(r.grupos[0].groupId);
  });

  /**
   * OPACO (F-88 P3). No deriva del contenido: dos emisiones sobre los MISMOS
   * documentos dan groupIds distintos. Es lo que impide que alguien lo use como
   * memoria entre análisis — para eso está la huella, que sí es estable.
   */
  it('el groupId es OPACO: dos emisiones iguales dan ids distintos', async () => {
    const a = await emitirCorpus(OPE10, OPE11);
    const b = await emitirCorpus(OPE10, OPE11);

    expect(a.grupos[0].groupId).not.toBe(b.grupos[0].groupId);
    // Y la huella, que SÍ recuerda, no se mueve.
    expect(a.contradicciones[0].huella).toBe(b.contradicciones[0].huella);
  });
});

describe('LAS VARIANTES DE ESCRITURA (F-88 P4)', () => {
  /**
   * El corpus no puede darlas —se generó programáticamente y no produce
   * diferencias de escritura por accidente (B.117)—, así que se construyen.
   *
   * ⚠️ LA COLUMNA QUE VARÍA TIENE QUE REPETIRSE, y costó tres casos rojos
   * descubrirlo. Si la columna donde está la diferencia tiene unicidad alta, la
   * fase 1 la NOMINA COMO CLAVE — y una columna usada como clave queda
   * EXCLUIDA de la comparación (`excludedAsKey`), así que la fila sale
   * idéntica y no hay nada que clasificar. Por eso 'Clínica' toma solo dos
   * valores sobre cinco filas: así no puede ser clave, y 'Código' lo es sin
   * discusión.
   *
   * No es una rareza de los fixtures: es una propiedad real del diseño que
   * quien construya casos aquí tiene que conocer.
   */
  const CLINICAS = ['Chamberí', 'Retiro', 'Chamberí', 'Retiro', 'Chamberí'];
  const soloEscritura = () => [
    tabla('Nueva', ['Código', 'Clínica'], CLINICAS.map((c, i) => ({
      Código: `T-00${i + 1}`, Clínica: c,
    }))),
  ];
  const otra = () => [
    // La primera difiere SOLO EN LA CAJA; las otras cuatro, en nada.
    tabla('Existente', ['Código', 'Clínica'], CLINICAS.map((c, i) => ({
      Código: `T-00${i + 1}`, Clínica: i === 0 ? c.toUpperCase() : c,
    }))),
  ];

  it('NO entran en el array de contradicciones', () => {
    const { pares } = emparejarTablas(soloEscritura(), otra());
    const r = emitirDiffDeTablas(pares, lados('nuevo.xlsx', 'viejo.xlsx'));

    expect(r.contradicciones).toHaveLength(0);
    expect(r.counts['diff.clasificacion.variantes_escritura']).toBe(1);
  });

  it('pero NO se callan: van a su sección con los dos lados', () => {
    const { pares } = emparejarTablas(soloEscritura(), otra());
    const r = emitirDiffDeTablas(pares, lados('nuevo.xlsx', 'viejo.xlsx'));

    expect(r.grupos[0].variantesDeEscritura).toHaveLength(1);
    expect(r.grupos[0].variantesDeEscritura[0].columnas).toEqual(['Clínica']);
    expect(r.grupos[0].variantesDeEscritura[0].enNuevo).toContain('Chamberí');
    expect(r.grupos[0].variantesDeEscritura[0].enOtro).toContain('CHAMBERÍ');
  });

  /**
   * LA GUARDA SIGUE VIGENTE: solo el nivel SEGURO absuelve hacia esa sección.
   * «25,00» contra «2500» es un factor de cien, no una variante de escritura, y
   * sigue siendo discrepancia plena. Si alguien relajara el comparador, este
   * caso lo dice.
   */
  it('un factor de cien NO es una variante de escritura', () => {
    // Mismo cuidado con la clave: 'Precio' se repite para que no pueda serlo.
    const precios = ['25,00', '100', '100', '100', '100'];
    const nueva = [tabla('Nueva', ['Código', 'Precio'], precios.map((v, i) => ({
      Código: `T-00${i + 1}`, Precio: v,
    })))];
    const existente = [tabla('Existente', ['Código', 'Precio'], precios.map((v, i) => ({
      Código: `T-00${i + 1}`, Precio: i === 0 ? '2500' : v,
    })))];

    const { pares } = emparejarTablas(nueva, existente);
    const r = emitirDiffDeTablas(pares, lados('n.xlsx', 'v.xlsx'));

    expect(r.contradicciones).toHaveLength(1);
    expect(r.grupos[0].variantesDeEscritura).toHaveLength(0);
  });
});

describe('EL RECORRIDO hasta el cliente', () => {
  /** El camino real: emisión → judgment → synthesize → JSON → problemas. */
  async function hastaElCliente() {
    const r = await emitirCorpus(OPE10, OPE11);
    const judgment: DocumentJudgment = {
      documentId: ID_EXISTENTE,
      documentName: OPE11,
      source: 'manual',
      overlapPercent: 50,
      verdict: 'solapamiento_parcial',
      contradictions: r.contradicciones,
      tableDiffs: r.grupos,
      overlappingContent: [],
      uniqueToNewDoc: [],
    };
    const analisis = {
      discrepancies: construirDiscrepancias([judgment]),
      tableDiffs: construirTableDiffs([judgment]),
    };
    return JSON.parse(JSON.stringify(analisis)) as RawAnalysis & { tableDiffs?: unknown[] };
  }

  it('las quince llegan al cliente como problemas', async () => {
    const problemas = problemsFromAnalysis(await hastaElCliente());
    expect(problemas.filter(p => p.type === 'contradiccion')).toHaveLength(15);
  });

  /**
   * LA CLÁUSULA DE F-88 P2, comprobada donde importa: al final del recorrido.
   * Si `origen` se perdiera por el camino —y esta tubería ya ha borrado cuatro
   * campos en tránsito—, la supresión de acciones no ocurriría y el usuario
   * tendría delante un botón que registraría un juicio con la identidad
   * equivocada.
   */
  it('llegan marcadas como diff_tabular, que es lo que suprime sus acciones', async () => {
    const problemas = problemsFromAnalysis(await hastaElCliente());
    expect(problemas.every(p => p.origen === 'diff_tabular')).toBe(true);
  });

  it('la estructura agrupada sobrevive al viaje', async () => {
    const a = await hastaElCliente();
    expect(a.tableDiffs).toHaveLength(1);
  });
});
