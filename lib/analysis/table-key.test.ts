import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { esVarianteDeEscritura, normalize } from './normalize';
import { groupChunksByTable, type TableGroup } from './table-structure';
import { columnUniqueness, discoverTableKey, type TableKeyResult } from './table-key';

/**
 * BATERÍA DE LA FASE 1 (F-78 / F-81 P1).
 *
 * ⚠️ EL LÍMITE DE LA EVIDENCIA, repetido aquí porque es donde se lee al leer
 * los casos: NINGUNO DE LOS DOS PARES REALES DEL CORPUS EJERCITA EL CONSENSO.
 * OPE-10/OPE-11 nomina dos candidatas biyectivas (no pueden discrepar) y
 * OPE-02/RRHH-06 nomina una sola. Todo lo que esta función hace CUANDO LAS
 * CANDIDATAS NO SE PONEN DE ACUERDO se valida abajo, en el bloque de casos
 * CONSTRUIDOS, y en ningún otro sitio.
 *
 * POR QUÉ LOS CASOS CONSTRUIDOS SON LITERALES Y NO .xlsx EN corpus-pruebas/:
 * esa carpeta es ground truth de TANDAS, con su regla de admisión y su registro
 * de siembra; cada fichero que entre ahí pide su SIEMBRA_*.md y hace crecer el
 * corpus del harness con documentos que ninguna tanda usa. Y además, dos
 * candidatas que discrepan en una fila concreta SE CONSTRUYEN a propósito: no
 * se encuentran en una hoja de cálculo real sin perseguirlas.
 */

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Un documento del corpus, por la cadena REAL del pipeline —extractSegments →
 * chunkSegments → toStoredChunks → groupChunksByTable—, no por un atajo que
 * construya los StoredChunk a mano: lo que se mide tiene que ser lo que el
 * sistema procesa.
 */
async function tablaDeCorpus(file: string): Promise<TableGroup> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  const chunks = toStoredChunks(chunkSegments(segments, 'doc-test', file, 'org-test'));
  const groups = groupChunksByTable(chunks);
  expect(groups).toHaveLength(1);
  return groups[0];
}

/** Una tabla construida a mano, para los casos que el corpus no tiene. */
function tabla(columns: string[], filas: Array<Record<string, string>>): TableGroup {
  return {
    tableId: 'Construida#0',
    sheetName: 'Construida',
    columns,
    totalRows: filas.length,
    rows: filas.map((cells, i): StoredChunk => ({
      chunkIndex: i,
      chunkType: 'table_row',
      text: '',
      sheetName: 'Construida',
      tableId: 'Construida#0',
      rowIndex: i,
      cells,
      columnOrder: null,
    })),
  };
}

function pct(table: TableGroup, column: string): number {
  const found = columnUniqueness(table).find(c => c.column === column);
  expect(found, `columna "${column}" no existe`).toBeDefined();
  return found!.uniquePct;
}

function motivos(result: Extract<TableKeyResult, { status: 'emparejado' }>, side: 'nueva' | 'existente') {
  return result.ambiguous.filter(a => a.side === side).map(a => a.reason).sort();
}

/**
 * EL CASO 8, como invariante y no como fixture: que el consenso nueva→existente
 * sea el mismo que existente→nueva. No se puede construir un fixture que lo
 * VIOLE —la comprobación de clave repetida en el propio lado (resolveOne) hace
 * la asimetría inalcanzable: si `a` empareja con `b` bajo toda candidata, `a` es
 * único en su tabla y `b` es el único acierto, luego `b` empareja con `a`—, así
 * que lo que se prueba es la consecuencia observable, sobre TODOS los casos:
 * las cuatro clases parten cada tabla exactamente, sin solapes ni huecos, y
 * ninguna fila de la existente aparece en dos parejas. Si el acuerdo mutuo se
 * rompiera, una fila saldría emparejada Y contada como "solo en la existente".
 */
function particionCorrecta(result: TableKeyResult, nueva: TableGroup, existente: TableGroup): void {
  if (result.status !== 'emparejado') return;
  const { pairs, onlyNueva, onlyExistente, ambiguous } = result;

  const deNueva = [...pairs.map(p => p.nueva), ...onlyNueva, ...ambiguous.filter(a => a.side === 'nueva').map(a => a.row)];
  const deExistente = [...pairs.map(p => p.existente), ...onlyExistente, ...ambiguous.filter(a => a.side === 'existente').map(a => a.row)];

  expect(deNueva).toHaveLength(nueva.rows.length);
  expect(new Set(deNueva).size).toBe(nueva.rows.length);
  expect(deExistente).toHaveLength(existente.rows.length);
  expect(new Set(deExistente).size).toBe(existente.rows.length);

  expect(new Set(pairs.map(p => p.existente)).size).toBe(pairs.length);
  expect(new Set(pairs.map(p => p.nueva)).size).toBe(pairs.length);
}

function emparejado(result: TableKeyResult): Extract<TableKeyResult, { status: 'emparejado' }> {
  expect(result.status).toBe('emparejado');
  if (result.status !== 'emparejado') throw new Error('inalcanzable');
  return result;
}

// ── el corpus ──────────────────────────────────────────────────────────────

describe('OPE-10 / OPE-11 — el caso central', () => {
  it('T1 nomina exactamente Código y Tratamiento', async () => {
    const a = await tablaDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx');
    const b = await tablaDeCorpus('OPE-11_tarifario-tratamientos-seguros.xlsx');
    const r = emparejado(discoverTableKey(a, b));

    expect(r.candidates.map(c => c.columns)).toEqual([['Código'], ['Tratamiento']]);
    expect(r.counts.candidatasSimples).toBe(2);
    expect(r.counts.candidatasCompuestas).toBe(0);
  });

  /**
   * T2 — LOS PORCENTAJES EXACTOS, A PROPÓSITO. Este test es el CANARIO de que
   * la extracción cambió: si alguien sube EXTRACTOR_VERSION, toca el detector
   * de islas o cambia cómo se leen las cabeceras, estos números se mueven y
   * este test se pone rojo ANTES de que una tanda mida sobre otra cosa. Un test
   * que no se rompe cuando cambia lo que mide no sirve.
   *
   * Si lo ves rojo: no ajustes los números. Averigua qué cambió en la
   * extracción, y si el cambio es deliberado, actualízalos EN EL MISMO COMMIT
   * que lo introduce.
   */
  it('T2 fija los porcentajes de unicidad de las nueve columnas', async () => {
    const a = await tablaDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx');
    const b = await tablaDeCorpus('OPE-11_tarifario-tratamientos-seguros.xlsx');
    expect(a.rows).toHaveLength(60);
    expect(b.rows).toHaveLength(60);

    expect(pct(a, 'Código')).toBeCloseTo(100.0, 1);
    expect(pct(a, 'Tratamiento')).toBeCloseTo(100.0, 1);
    expect(pct(a, 'Precio con seguro')).toBeCloseTo(71.7, 1);
    expect(pct(a, 'Precio base')).toBeCloseTo(61.7, 1);
    expect(pct(a, 'Duración (min)')).toBeCloseTo(20.0, 1);
    expect(pct(a, 'Categoría')).toBeCloseTo(16.7, 1);
    expect(pct(a, 'Profesional asignado')).toBeCloseTo(13.3, 1);
    expect(pct(a, 'Clínica')).toBeCloseTo(5.0, 1);
    expect(pct(a, 'Revisión')).toBeCloseTo(5.0, 1);

    expect(pct(b, 'Código')).toBeCloseTo(100.0, 1);
    expect(pct(b, 'Tratamiento')).toBeCloseTo(100.0, 1);
    expect(pct(b, 'Precio base')).toBeCloseTo(71.7, 1);
    expect(pct(b, 'Precio con seguro')).toBeCloseTo(68.3, 1);
    expect(pct(b, 'Duración (min)')).toBeCloseTo(23.3, 1);
    expect(pct(b, 'Categoría')).toBeCloseTo(16.7, 1);
    expect(pct(b, 'Profesional asignado')).toBeCloseTo(15.0, 1);
    expect(pct(b, 'Clínica')).toBeCloseTo(5.0, 1);
    expect(pct(b, 'Revisión')).toBeCloseTo(5.0, 1);
  });

  it('T3 el consenso da 35 parejas, 25 + 25 sin pareja y cero ambiguas', async () => {
    const a = await tablaDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx');
    const b = await tablaDeCorpus('OPE-11_tarifario-tratamientos-seguros.xlsx');
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(35);
    expect(r.counts.soloNueva).toBe(25);
    expect(r.counts.soloExistente).toBe(25);
    expect(r.ambiguous).toHaveLength(0);
    particionCorrecta(r, a, b);
  });

  it('T4 las 25 que solo están en OPE-11 son las SEG-*', async () => {
    const a = await tablaDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx');
    const b = await tablaDeCorpus('OPE-11_tarifario-tratamientos-seguros.xlsx');
    const r = emparejado(discoverTableKey(a, b));

    const codigos = r.onlyExistente.map(row => row.cells?.['Código'] ?? '');
    expect(codigos).toHaveLength(25);
    expect(codigos.every(c => c.startsWith('SEG-'))).toBe(true);
    expect(r.onlyNueva.every(row => !(row.cells?.['Código'] ?? '').startsWith('SEG-'))).toBe(true);
  });

  /**
   * T5 — el consenso de este par es VACUO, y el test lo dice en voz alta.
   * Código y Tratamiento son biyectivas (la etiqueta 1:1 de la clave), así que
   * no pueden discrepar: sus 35 parejas no prueban que el consenso funcione.
   * Y `discrepanciaPorNormalizar` es 0 porque los valores de este corpus no
   * tienen nada que normalizar — no porque normalizar sea inocuo.
   */
  it('T5 marca consenso vacuo por biyección, y normalizar no cambia nada', async () => {
    const a = await tablaDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx');
    const b = await tablaDeCorpus('OPE-11_tarifario-tratamientos-seguros.xlsx');
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.biyectivas).toBe(true);
    expect(r.counts.consensoVacuo).toBe(true);
    expect(r.counts.discrepanciaPorNormalizar).toBe(0);
  });
});

describe('OPE-02 / RRHH-06 — una sola candidata', () => {
  it('T6 nomina solo Empleado, y T7 descarta Comentarios por no estar en la otra tabla', async () => {
    const a = await tablaDeCorpus('OPE-02_agenda-y-gestion-de-citas.xlsx');
    const b = await tablaDeCorpus('RRHH-06_evaluacion-del-desempeno.xlsx');
    const r = emparejado(discoverTableKey(a, b));

    expect(r.candidates.map(c => c.columns)).toEqual([['Empleado']]);
    // 'Comentarios' es 100% único en RRHH-06 y aun así NO es candidata: no
    // existe en OPE-02. Es el único caso del corpus que ejercita la cláusula
    // "y está presente en la otra".
    expect(pct(b, 'Comentarios')).toBeCloseTo(100.0, 1);
    expect(a.columns).not.toContain('Comentarios');
    expect(pct(a, 'Puesto')).toBeCloseTo(80.0, 1);
    expect(pct(b, 'Puesto')).toBeCloseTo(66.7, 1);
  });

  it('T8 empareja 10 de 10, deja 5 solo en RRHH-06 y marca consenso vacuo por candidata única', async () => {
    const a = await tablaDeCorpus('OPE-02_agenda-y-gestion-de-citas.xlsx');
    const b = await tablaDeCorpus('RRHH-06_evaluacion-del-desempeno.xlsx');
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(10);
    expect(r.counts.soloNueva).toBe(0);
    expect(r.counts.soloExistente).toBe(5);
    expect(r.ambiguous).toHaveLength(0);
    expect(r.counts.biyectivas).toBe(false);
    expect(r.counts.consensoVacuo).toBe(true); // una sola candidata: nada que cruzar
    particionCorrecta(r, a, b);

    // La siembra de B.81 llega intacta a la fase 2: de los diez emparejados,
    // difiere en Puesto exactamente uno.
    const difieren = r.pairs.filter(p => p.nueva.cells?.['Puesto'] !== p.existente.cells?.['Puesto']);
    expect(difieren).toHaveLength(1);
    expect(difieren[0].keyValues).toEqual(['Dr. Pablo Reyes']);
  });
});

// ── los casos construidos ──────────────────────────────────────────────────

describe('lo que el corpus no tiene — casos construidos', () => {
  it('C1 dos candidatas NO biyectivas que discrepan: marca ambigua, no adivina', () => {
    const a = tabla(['K1', 'K2'], [
      { K1: 'A1', K2: 'B1' }, { K1: 'A2', K2: 'B2' },
      { K1: 'A3', K2: 'B3' }, { K1: 'A4', K2: 'B4' },
    ]);
    const b = tabla(['K1', 'K2'], [
      { K1: 'A1', K2: 'B1' }, { K1: 'A2', K2: 'B2' }, { K1: 'A3', K2: 'B3' },
      { K1: 'A4', K2: 'B9' },  // empareja con la fila 3 por K1
      { K1: 'A9', K2: 'B4' },  // ...y por K2 empareja con OTRA
    ]);
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.biyectivas).toBe(false);
    expect(r.counts.consensoVacuo).toBe(false); // aquí SÍ hay algo que decidir
    expect(r.counts.pares).toBe(3);
    expect(motivos(r, 'nueva')).toEqual(['candidatas_discrepan']);
    expect(r.counts.ambiguas.candidatas_discrepan).toBe(1);
    particionCorrecta(r, a, b);
  });

  it('C2 valor repetido ENFRENTE, dentro del 10% que el umbral permite', () => {
    // La tabla existente tiene 9 valores distintos en 10 filas: 90%, justo en
    // el umbral. Sigue siendo candidata Y tiene un duplicado. El 90% no es el
    // 100%, y por eso el multi-hit hay que tratarlo siempre.
    const a = tabla(['K', 'V'], Array.from({ length: 10 }, (_, i) => ({ K: `A${i + 1}`, V: 'x' })));
    const b = tabla(['K', 'V'], [
      'A1', 'A2', 'A3', 'A3', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
    ].map(K => ({ K, V: 'x' })));
    const r = emparejado(discoverTableKey(a, b));

    expect(pct(b, 'K')).toBeCloseTo(90.0, 1);
    expect(r.candidates.map(c => c.columns)).toEqual([['K']]);
    expect(r.counts.pares).toBe(8);
    expect(r.counts.soloNueva).toBe(1); // A4, que no está enfrente
    expect(r.counts.ambiguas.valor_repetido_enfrente).toBe(1);
    expect(r.counts.ambiguas.valor_repetido_en_su_tabla).toBe(2); // las dos A3, desde su lado
    particionCorrecta(r, a, b);
  });

  it('C3 dos filas del MISMO lado con la misma clave: ninguna empareja, y la de enfrente no se usa dos veces', () => {
    const a = tabla(['K', 'V'], [
      'A1', 'A2', 'A3', 'A3', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10',
    ].map(K => ({ K, V: 'x' })));
    const b = tabla(['K', 'V'], Array.from({ length: 10 }, (_, i) => ({ K: `A${i + 1}`, V: 'x' })));
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(8);
    expect(r.counts.ambiguas.valor_repetido_en_su_tabla).toBe(2);
    // La fila A3 de la existente NO entra en ninguna pareja: sin la
    // comprobación del propio lado, las dos A3 apuntarían a ella y la fase 2
    // la contaría dos veces.
    expect(r.pairs.some(p => p.existente.cells?.['K'] === 'A3')).toBe(false);
    expect(r.counts.soloExistente).toBe(1); // A4
    particionCorrecta(r, a, b);
  });

  it('C4 celda de clave vacía: no empareja, y no colisiona con las otras vacías', () => {
    const a = tabla(['K', 'V'], [{ K: 'A1' }, { K: 'A2' }, { K: '' }, { K: 'A4' }, { K: 'A5' }]
      .map(r => ({ K: r.K, V: 'x' })));
    const b = tabla(['K', 'V'], [{ K: 'A1' }, { K: 'A2' }, { K: '' }, { K: 'A4' }, { K: 'A5' }]
      .map(r => ({ K: r.K, V: 'x' })));
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(4);
    expect(r.counts.ambiguas.valor_vacio).toBe(2); // una por lado
    expect(r.counts.soloNueva).toBe(0);
    expect(r.counts.soloExistente).toBe(0);
    particionCorrecta(r, a, b);
  });

  it('C5 consenso parcial: una candidata empareja y la otra no encuentra nada', () => {
    const a = tabla(['K1', 'K2'], [{ K1: 'A1', K2: 'B1' }, { K1: 'A2', K2: 'B2' }]);
    const b = tabla(['K1', 'K2'], [{ K1: 'A1', K2: 'B1' }, { K1: 'A2', K2: 'B9' }]);
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(1);
    expect(r.counts.ambiguas.candidatas_parciales).toBe(2); // una por lado
    expect(motivos(r, 'nueva')).toEqual(['candidatas_parciales']);
    particionCorrecta(r, a, b);
  });

  it('C6 clave compuesta cuando ninguna simple pasa', () => {
    const filas = (nums: Array<[string, string]>) => nums.map(([Zona, Num]) => ({ Zona, Num, V: 'x' }));
    const a = tabla(['Zona', 'Num', 'V'], filas([
      ['Norte', '1'], ['Norte', '2'], ['Norte', '3'],
      ['Sur', '1'], ['Sur', '2'], ['Sur', '3'],
    ]));
    const b = tabla(['Zona', 'Num', 'V'], filas([
      ['Norte', '1'], ['Norte', '2'], ['Norte', '4'],
      ['Sur', '1'], ['Sur', '2'], ['Sur', '3'],
    ]));
    const r = emparejado(discoverTableKey(a, b));

    expect(pct(a, 'Zona')).toBeCloseTo(33.3, 1);
    expect(pct(a, 'Num')).toBeCloseTo(50.0, 1);
    expect(r.counts.candidatasSimples).toBe(0);
    expect(r.counts.candidatasCompuestas).toBe(1);
    expect(r.candidates[0].columns).toEqual(['Zona', 'Num']);
    expect(r.counts.pares).toBe(5);
    expect(r.counts.soloNueva).toBe(1);   // Norte-3
    expect(r.counts.soloExistente).toBe(1); // Norte-4
    particionCorrecta(r, a, b);
  });

  it('C7 el contador de la condición 3 se mueve cuando la comparación cambia el emparejamiento', () => {
    // F-84 1b CAMBIÓ ESTE FIXTURE, y el cambio es la prueba de que el criterio
    // se movió. Antes iba con "1.500" contra "1,500": `normalize` los fundía,
    // así que la fila emparejaba y el contador se movía. Con el nivel seguro
    // esos dos son valores DISTINTOS y la fila deja de emparejar — ese caso vive
    // ahora en N1, donde demuestra el mecanismo.
    // Lo que separa hoy al nivel seguro del crudo es la CAJA y los espacios
    // internos, así que el contador se ejercita con eso.
    const a = tabla(['K', 'V'], [{ K: 'CHAMBERÍ', V: 'x' }, { K: 'A2', V: 'x' }, { K: 'A3', V: 'x' }]);
    const b = tabla(['K', 'V'], [{ K: 'Chamberí', V: 'x' }, { K: 'A2', V: 'x' }, { K: 'A3', V: 'x' }]);
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(3);
    expect(r.counts.discrepanciaPorNormalizar).toBe(1);
    particionCorrecta(r, a, b);
  });

  /**
   * N1 — EL MECANISMO DE F-84 1b. Es el caso que falla sin el cambio y pasa con
   * él, o sea la condición 1 de la regla de entrada.
   *
   * `normalize` borra el guion, así que hasta este commit «IMP-01» e «IMP01»
   * eran LA MISMA FILA. Con el nivel seguro son dos filas distintas y cada una
   * cae a su lado. La premisa se comprueba aquí mismo llamando a `normalize`,
   * para que el caso no dependa de que alguien recuerde qué borraba.
   */
  it('N1 dos claves que solo se funden borrando puntuación YA NO emparejan', () => {
    expect(normalize('IMP-01'), 'premisa: normalize las fundía').toBe(normalize('IMP01'));

    const a = tabla(['Código', 'V'], [{ 'Código': 'IMP-01', V: 'x' }, { 'Código': 'A2', V: 'x' }, { 'Código': 'A3', V: 'x' }]);
    const b = tabla(['Código', 'V'], [{ 'Código': 'IMP01', V: 'x' }, { 'Código': 'A2', V: 'x' }, { 'Código': 'A3', V: 'x' }]);
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(2);
    expect(r.onlyNueva.map(x => x.cells?.['Código'])).toEqual(['IMP-01']);
    expect(r.onlyExistente.map(x => x.cells?.['Código'])).toEqual(['IMP01']);
    particionCorrecta(r, a, b);
  });

  /**
   * N3 — LA GUARDIA EN LA DIRECCIÓN CONTRARIA. El nivel seguro sigue fundiendo
   * lo que SÍ es la misma clave escrita de otra manera. Si alguien lo apretara
   * hasta la igualdad literal, estas tres parejas se romperían y este caso lo
   * diría.
   */
  it('N3 caja y espacios siguen emparejando después del cambio', () => {
    const a = tabla(['K', 'V'], [{ K: 'CHAMBERÍ', V: 'x' }, { K: 'Dr  Pablo', V: 'x' }, { K: ' A3 ', V: 'x' }]);
    const b = tabla(['K', 'V'], [{ K: 'Chamberí', V: 'x' }, { K: 'Dr Pablo', V: 'x' }, { K: 'A3', V: 'x' }]);
    const r = emparejado(discoverTableKey(a, b));

    expect(r.counts.pares).toBe(3);
    expect(r.counts.soloNueva).toBe(0);
    expect(r.counts.soloExistente).toBe(0);
    particionCorrecta(r, a, b);
  });

  /**
   * N4 — LA NOMINACIÓN, que es el alcance ampliado de la opción A y hay que
   * ejercitarlo, no solo arrastrarlo. `uniquePct` mide la cardinalidad con la
   * MISMA lente que empareja, así que cambiarla cambia qué columnas se admiten.
   *
   * Esta columna tiene DOS pares que `normalize` funde: 8 valores distintos de
   * 10 (80%, por debajo del umbral) contra 10 de 10 con el nivel seguro (100%).
   * Con el criterio viejo esto era `sin_clave: 'ninguna_supera_el_umbral'`; con
   * el nuevo, la columna entra y las diez filas emparejan.
   *
   * Y va en la dirección conservadora: el nivel seguro solo puede SUBIR la
   * cardinalidad, así que solo puede admitir MÁS candidatas — y más candidatas
   * es un consenso más estricto, nunca más laxo.
   */
  it('N4 una columna que el criterio viejo no admitía ahora supera el umbral', () => {
    expect(normalize('IMP-01')).toBe(normalize('IMP01'));
    expect(normalize('ORT-02')).toBe(normalize('ORT02'));

    const claves = ['IMP-01', 'IMP01', 'ORT-02', 'ORT02', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
    const filas = claves.map(K => ({ K, V: 'x' }));
    const a = tabla(['K', 'V'], filas);
    const b = tabla(['K', 'V'], filas.map(f => ({ ...f })));
    const r = emparejado(discoverTableKey(a, b));

    // 10 de 10 con el nivel seguro. Con normalize eran 8 de 10 = 80%.
    expect(r.candidates.map(c => c.columns)).toEqual([['K']]);
    expect(r.candidates[0].uniqueNueva).toBeCloseTo(100.0, 1);
    expect(r.counts.pares).toBe(10);
    particionCorrecta(r, a, b);
  });
});

// ── las guardas ────────────────────────────────────────────────────────────

describe('cuándo se rinde', () => {
  it('G1 sin columnas comunes', () => {
    const a = tabla(['K'], [{ K: 'A1' }, { K: 'A2' }]);
    const b = tabla(['Z'], [{ Z: 'A1' }, { Z: 'A2' }]);
    const r = discoverTableKey(a, b);
    expect(r).toMatchObject({ status: 'sin_clave', reason: 'sin_columnas_comunes' });
  });

  it('G2 ninguna columna, simple ni compuesta, supera el umbral', () => {
    const a = tabla(['C1', 'C2'], [
      { C1: 'x', C2: 'p' }, { C1: 'x', C2: 'p' }, { C1: 'y', C2: 'q' }, { C1: 'y', C2: 'q' },
    ]);
    const b = tabla(['C1', 'C2'], [
      { C1: 'x', C2: 'p' }, { C1: 'x', C2: 'p' }, { C1: 'y', C2: 'q' }, { C1: 'y', C2: 'q' },
    ]);
    const r = discoverTableKey(a, b);
    expect(r).toMatchObject({ status: 'sin_clave', reason: 'ninguna_supera_el_umbral' });
    expect(r.counts.candidatasSimples).toBe(0);
    expect(r.counts.candidatasCompuestas).toBe(0);
  });

  it('G3 tabla incompleta: un 90% sobre parte de las filas no significa nada', () => {
    const completa = tabla(['K'], [{ K: 'A1' }, { K: 'A2' }, { K: 'A3' }]);
    const parcial: TableGroup = { ...completa, totalRows: 60 }; // el reparto entregó 3 de 60
    const r = discoverTableKey(parcial, completa);
    expect(r).toMatchObject({ status: 'sin_clave', reason: 'tabla_incompleta' });
  });

  it('G4 tabla vacía', () => {
    const vacia = tabla(['K'], []);
    const llena = tabla(['K'], [{ K: 'A1' }]);
    expect(discoverTableKey(vacia, llena)).toMatchObject({ status: 'sin_clave', reason: 'tabla_vacia' });
    expect(discoverTableKey(llena, vacia)).toMatchObject({ status: 'sin_clave', reason: 'tabla_vacia' });
  });
});

// ── la medición de F-84 1a ─────────────────────────────────────────────────

/**
 * F-84 PASO 1a — ¿CUÁNTAS PAREJAS DEPENDEN DE LA NORMALIZACIÓN AGRESIVA?
 *
 * La fase 1 empareja hoy con `normalize`: minúsculas, colapso de espacios y
 * borrado de 24 caracteres de puntuación. F-84 propone bajarla al NIVEL SEGURO
 * del comparador de tres niveles, porque la asimetría del error manda —
 * emparejar de MÁS fabrica una discrepancia falsa con sello de «verificada por
 * estructura»; emparejar de MENOS solo manda la fila a la sección de cobertura,
 * donde el usuario la ve.
 *
 * Este caso es la CIFRA que hay que conocer antes de hacer ese cambio: cuántas
 * parejas existen hoy SOLO porque se borró puntuación, se colapsaron espacios o
 * se bajó a minúsculas. Se mide sobre los 12 pares ORDENADOS de los cuatro
 * .xlsx del corpus, no solo sobre OPE-10/OPE-11.
 *
 * NO CAMBIA EL CRITERIO: lo mide. Cuando F-84 1b lo cambie, este caso sigue
 * valiendo, porque lo que afirma es una propiedad del CORPUS —que sus claves no
 * tienen suciedad de escritura— y no del código.
 *
 * SI ALGÚN DÍA SE PONE ROJO con un corpus nuevo, eso NO es un fallo: es el
 * primer caso real de F-84, y hay que mirarlo antes que nada.
 */
describe('F-84 1a — la medición previa al cambio de emparejamiento', () => {
  /** Igualdad bajo el nivel seguro, preguntada al predicado exportado en vez
   *  de reimplementar la normalización aquí. */
  const mismoValorSeguro = (a: string, b: string) => a === b || esVarianteDeEscritura(a, b);
  const val = (r: StoredChunk, c: string) => r.cells?.[c] ?? '';
  const clave = (r: StoredChunk, cols: string[]) => cols.map(c => val(r, c)).join('|');

  const XLSX = [
    'OPE-10_tarifario-tratamientos-2026.xlsx',
    'OPE-11_tarifario-tratamientos-seguros.xlsx',
    'OPE-02_agenda-y-gestion-de-citas.xlsx',
    'RRHH-06_evaluacion-del-desempeno.xlsx',
  ];

  it('ninguna pareja del corpus depende de la normalización agresiva', async () => {
    const tablas = new Map<string, TableGroup>();
    for (const f of XLSX) tablas.set(f, await tablaDeCorpus(f));

    let parejas = 0;
    const frágiles: string[] = [];

    for (const a of XLSX) {
      for (const b of XLSX) {
        if (a === b) continue;
        const r = discoverTableKey(tablas.get(a)!, tablas.get(b)!);
        if (r.status !== 'emparejado') continue;
        parejas += r.pairs.length;
        for (const p of r.pairs) {
          // El consenso exige TODAS las candidatas: basta que una deje de
          // casar bajo el nivel seguro para que la pareja no sobreviva.
          const sobrevive = r.candidates.every(c =>
            mismoValorSeguro(clave(p.nueva, c.columns), clave(p.existente, c.columns)));
          if (!sobrevive) {
            frágiles.push(`${a} → ${b}: ${JSON.stringify(p.nueva.cells)} / ${JSON.stringify(p.existente.cells)}`);
          }
        }
      }
    }

    // El corpus empareja 90 filas en los 12 pares ordenados (35+35 de
    // OPE-10/OPE-11 y 10+10 de OPE-02/RRHH-06; los otros ocho pares no llegan
    // a tener clave). Va fijado como canario: si cambia, cambió la extracción
    // o la nominación, y esta medición dejó de medir lo que dice.
    expect(parejas).toBe(90);
    expect(frágiles, `parejas frágiles:\n${frágiles.join('\n')}`).toEqual([]);
  });
});
