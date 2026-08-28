import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { normalize } from './normalize';
import { diffPairedRows, type TableDiffResult } from './table-diff';
import { discoverTableKey, type TableKeyResult } from './table-key';
import { groupChunksByTable, type TableGroup } from './table-structure';

/**
 * BATERÍA DE LA FASE 2 (F-81).
 *
 * Los helpers `tablaDeCorpus` y `tabla` están duplicados de
 * table-key.test.ts a propósito: cada batería es autónoma, para que el módulo
 * y su test se puedan borrar juntos sin arrastrar a la otra. Compartir un
 * fichero de fixtures acoplaría dos baterías que tienen que poder retirarse
 * por separado.
 */

async function tablaDeCorpus(file: string): Promise<TableGroup> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  const chunks = toStoredChunks(chunkSegments(segments, 'doc-test', file, 'org-test'));
  const groups = groupChunksByTable(chunks);
  expect(groups).toHaveLength(1);
  return groups[0];
}

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

/** Fase 1 + fase 2 encadenadas, que es la única forma de llamar a la fase 2. */
function diff(nueva: TableGroup, existente: TableGroup): TableDiffResult {
  const key: TableKeyResult = discoverTableKey(nueva, existente);
  expect(key.status).toBe('emparejado');
  if (key.status !== 'emparejado') throw new Error('inalcanzable');
  return diffPairedRows(key, nueva, existente);
}

// ── el corpus ──────────────────────────────────────────────────────────────

describe('OPE-10 / OPE-11 — el reparto de la siembra', () => {
  const cargar = async () => ({
    a: await tablaDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx'),
    b: await tablaDeCorpus('OPE-11_tarifario-tratamientos-seguros.xlsx'),
  });

  it('D1 reparte las 35 parejas en 20 idénticas y 15 discrepantes', async () => {
    const { a, b } = await cargar();
    const r = diff(a, b);
    expect(r.counts.parejas).toBe(35);
    expect(r.identical).toHaveLength(20);
    expect(r.differing).toHaveLength(15);
  });

  it('D2 clava el reparto por columna del registro de siembra', async () => {
    const { a, b } = await cargar();
    const r = diff(a, b);
    expect(r.counts.porColumna).toEqual({
      'Precio base': 4,
      'Duración (min)': 4,
      'Profesional asignado': 4,
      'Clínica': 3,
    });
  });

  /** El registro dice «difiere exactamente UNA columna por fila». Eso es la
   *  FORMA de la siembra, y es una aserción más fuerte que el total: un fallo
   *  que moviera valores de más seguiría dando 15 discrepantes. */
  it('D3 cada fila discrepante difiere en exactamente una columna', async () => {
    const { a, b } = await cargar();
    const r = diff(a, b);
    expect(r.differing.every(d => d.columns.length === 1)).toBe(true);
  });

  /**
   * D4 — LOS VALORES SON LOS DE LA CELDA, NO LOS DEL REGISTRO. El registro de
   * siembra escribe los precios como «25 €» / «30 €»; la celda del .xlsx
   * guarda «25» y «30», sin unidad. Lo que el sistema procesa es la celda, así
   * que es contra la celda contra lo que se afirma.
   */
  it('D4 reproduce las 15 discrepancias con sus valores de celda', async () => {
    const { a, b } = await cargar();
    const r = diff(a, b);
    const real = r.differing.map(d => [d.keyValues.nueva[0], d.columns[0], d.comparedValues[0].newDocValue, d.comparedValues[0].existingDocValue]);
    expect(real).toEqual([
      ['DIA-02', 'Duración (min)', '20', '15'],
      ['DIA-04', 'Profesional asignado', 'Cristina Ibáñez', 'Sonia Prats'],
      ['HIG-03', 'Clínica', 'Salamanca', 'Chamberí'],
      ['HIG-04', 'Precio base', '25', '30'],
      ['CON-03', 'Duración (min)', '50', '40'],
      ['CON-04', 'Profesional asignado', 'Dr. Carlos Medina', 'Dra. Marta Gil'],
      ['END-03', 'Precio base', '280', '260'],
      ['END-04', 'Clínica', 'Salamanca', 'Retiro'],
      ['PRO-03', 'Duración (min)', '90', '75'],
      ['PRO-04', 'Precio base', '600', '540'],
      ['IMP-03', 'Profesional asignado', 'Dr. Pablo Reyes', 'Dra. Ana Belmonte'],
      ['ORT-03', 'Clínica', 'Chamberí', 'Salamanca'],
      ['EST-03', 'Precio base', '180', '160'],
      ['CIR-03', 'Duración (min)', '45', '60'],
      ['URG-03', 'Profesional asignado', 'Dra. Ana Belmonte', 'Dr. Pablo Reyes'],
    ]);
  });

  it('D5 entrega los campos de F-70 listos para la ficha', async () => {
    const { a, b } = await cargar();
    const r = diff(a, b);
    const hig04 = r.differing.find(d => d.keyValues.nueva[0] === 'HIG-04');
    expect(hig04).toBeDefined();
    expect(hig04!.comparedValues).toEqual([
      { column: 'Precio base', newDocValue: '25', existingDocValue: '30' },
    ]);
    // Filas renderizadas con renderTableRow y el orden real de columnas.
    expect(hig04!.newDocRow).toContain('Sellado de fisuras');
    expect(hig04!.newDocRow.startsWith(`[F${hig04!.nueva.rowIndex}] `)).toBe(true);
    expect(hig04!.existingDocRow.startsWith(`[F${hig04!.existente.rowIndex}] `)).toBe(true);
    expect(hig04!.newDocRow.split(' | ')).toHaveLength(a.columns.length);
    expect(hig04!.varianteDeEscritura).toEqual([]);
  });

  it('D7 ninguna columna clave aparece jamás entre las que difieren', async () => {
    const { a, b } = await cargar();
    const r = diff(a, b);
    expect(r.excludedAsKey).toEqual(['Código', 'Tratamiento']);
    expect(r.differing.some(d => d.columns.some(c => r.excludedAsKey.includes(c)))).toBe(false);
    expect(r.counts.columnasNoCompartidas).toBe(0);
    expect(r.counts.columnasComparadas).toBe(7);
  });
});

describe('OPE-02 / RRHH-06 — dos columnas de dieciocho', () => {
  it('D6 compara solo las compartidas y encuentra la siembra de B.81', async () => {
    const a = await tablaDeCorpus('OPE-02_agenda-y-gestion-de-citas.xlsx');
    const b = await tablaDeCorpus('RRHH-06_evaluacion-del-desempeno.xlsx');
    const r = diff(a, b);

    expect(r.comparedColumns).toEqual(['Puesto']);
    expect(r.excludedAsKey).toEqual(['Empleado']);
    // 16 columnas viven en un solo lado. No son discrepancias: se cuentan.
    expect(r.counts.columnasNoCompartidas).toBe(16);
    expect(r.identical).toHaveLength(9);
    expect(r.differing).toHaveLength(1);
    // F-84 paso 2: las DOS claves. Aqui coinciden porque el emparejamiento fue
    // exacto; el campo existe para cuando no lo sea.
    expect(r.differing[0].keyValues).toEqual({ nueva: ['Dr. Pablo Reyes'], existente: ['Dr. Pablo Reyes'] });
    expect(r.differing[0].comparedValues).toEqual([
      { column: 'Puesto', newDocValue: 'Implantólogo / Cirujano oral', existingDocValue: 'Implantólogo' },
    ]);
  });

  /**
   * D8 — CADA LADO SE RENDERIZA CON EL ORDEN DE SU PROPIA TABLA. Es el par
   * donde eso se puede comprobar: OPE-02 y RRHH-06 tienen diez columnas cada
   * una y solo dos en común, así que renderizar las dos filas con el mismo
   * array (un copiar-pegar muy fácil de cometer) da una fila de la existente
   * llena de huecos, sin que cambie el número de valores. Este caso se añadió
   * porque esa mutación sobrevivía a los siete anteriores.
   */
  it('D8 renderiza cada fila con las columnas de su tabla, no con las de la otra', async () => {
    const a = await tablaDeCorpus('OPE-02_agenda-y-gestion-de-citas.xlsx');
    const b = await tablaDeCorpus('RRHH-06_evaluacion-del-desempeno.xlsx');
    const d = diff(a, b).differing[0];

    const soloRRHH = d.existente.cells?.['Comentarios'] ?? '';
    const soloOPE = d.nueva.cells?.['Box asignado'] ?? '';
    expect(soloRRHH).not.toBe('');
    expect(soloOPE).not.toBe('');
    expect(d.existingDocRow).toContain(soloRRHH);
    expect(d.newDocRow).toContain(soloOPE);
    expect(d.existingDocRow).not.toContain(soloOPE);
  });
});

// ── los casos construidos ──────────────────────────────────────────────────

describe('lo que el corpus no tiene — casos construidos', () => {
  it('E1 la clave empareja tras normalizar y difiere en crudo: NO se reporta', () => {
    const a = tabla(['Código', 'Zona', 'Precio'], [
      { 'Código': 'DIA-01', Zona: 'Norte', Precio: '40' },
      { 'Código': 'DIA-02', Zona: 'Norte', Precio: '40' },
      { 'Código': 'DIA-03', Zona: 'Norte', Precio: '30' },
    ]);
    const b = tabla(['Código', 'Zona', 'Precio'], [
      { 'Código': 'dia-01', Zona: 'Norte', Precio: '40' }, // misma clave tras normalize
      { 'Código': 'DIA-02', Zona: 'Norte', Precio: '40' },
      { 'Código': 'DIA-03', Zona: 'Norte', Precio: '99' },
    ]);
    const r = diff(a, b);

    expect(r.excludedAsKey).toEqual(['Código']);
    expect(r.comparedColumns).toEqual(['Zona', 'Precio']);
    // DIA-01 difiere en Código EN CRUDO y aun así sale como idéntica: la
    // pareja existe porque la clave coincidía, y reportarla se contradiría.
    expect(r.differing.map(d => d.keyValues.nueva[0])).toEqual(['DIA-03']);
    expect(r.identical).toHaveLength(2);
    expect(r.differing.some(d => d.columns.includes('Código'))).toBe(false);
  });

  it('E2 variante de escritura real (caja): se emite, y se etiqueta', () => {
    const a = tabla(['Código', 'Clínica'], [
      { 'Código': 'A1', 'Clínica': 'CHAMBERÍ' },
      { 'Código': 'A2', 'Clínica': 'Retiro' },
      { 'Código': 'A3', 'Clínica': 'Retiro' },
    ]);
    const b = tabla(['Código', 'Clínica'], [
      { 'Código': 'A1', 'Clínica': 'Chamberí' }, // misma clínica, otra caja
      { 'Código': 'A2', 'Clínica': 'Retiro' },
      { 'Código': 'A3', 'Clínica': 'Retiro' },
    ]);
    const r = diff(a, b);

    expect(r.differing).toHaveLength(1);
    expect(r.differing[0].columns).toEqual(['Clínica']);
    expect(r.differing[0].varianteDeEscritura).toEqual(['Clínica']);
    expect(r.counts.discrepanciasVarianteDeEscritura).toBe(1);
  });

  /**
   * E2-bis — LA CONSECUENCIA VISIBLE DE ELEGIR EL NIVEL SEGURO. Hasta F-82 P2
   * este caso era el fixture de E2 y salía como variante de escritura, porque
   * la comparación de entonces (`normalize`) borraba el punto. Ahora es
   * DISCREPANCIA PLENA, y eso es el precio pagado a conciencia: el mismo punto
   * que hace inocuo «Dr.» contra «Dr» es el que convierte «45.0» en «450», así
   * que no hay subconjunto de caracteres que salve a uno y condene al otro.
   *
   * Se paga porque el coste es asimétrico: equivocarse aquí cuesta al usuario
   * una mirada; equivocarse con «25,00» contra «2500» esconde un factor de
   * cien, y esconder hallazgos es lo que F-74 prohíbe.
   */
  it('E2-bis «Dr.» contra «Dr» es discrepancia plena, no variante', () => {
    const a = tabla(['Código', 'Profesional'], [
      { 'Código': 'A1', Profesional: 'Dr. Pablo Reyes' },
      { 'Código': 'A2', Profesional: 'Laura Núñez' },
      { 'Código': 'A3', Profesional: 'Laura Núñez' },
    ]);
    const b = tabla(['Código', 'Profesional'], [
      { 'Código': 'A1', Profesional: 'Dr Pablo Reyes' }, // sin el punto
      { 'Código': 'A2', Profesional: 'Laura Núñez' },
      { 'Código': 'A3', Profesional: 'Laura Núñez' },
    ]);
    const r = diff(a, b);

    expect(r.differing).toHaveLength(1);
    expect(r.differing[0].columns).toEqual(['Profesional']);
    expect(r.differing[0].varianteDeEscritura).toEqual([]);
    expect(r.counts.discrepanciasVarianteDeEscritura).toBe(0);
  });

  /**
   * E3 — ESTE TEST NO COMPRUEBA UNA SALIDA, COMPRUEBA QUE UNA DECISIÓN SIGUE
   * EN PIE: que la fase 2 compara EN CRUDO (§1 de la cabecera de
   * table-diff.ts).
   *
   * `normalize` borra la coma decimal, así que «25,00» y «2500» son la misma
   * cadena después de pasar por ella. Si alguien cambia la comparación a
   * normalizada —por coherencia con la fase 1, que es la razón que sonará
   * razonable—, esta discrepancia de un factor de cien desaparece del
   * resultado y este test se pone rojo.
   *
   * SI LO VES ROJO: no lo arregles cambiando el test. Lee §1 de la cabecera y
   * revierte la comparación. Un precio que se traga porque «normaliza igual»
   * es exactamente el hallazgo escondido que F-74 prohíbe.
   *
   * Y LA SEGUNDA ASERCIÓN SE INVIRTIÓ EN F-82 P2, que es lo que este commit
   * arregla. Antes esta discrepancia caía en `varianteDeEscritura` junto a la
   * de una abreviatura, y por eso el campo no podía llamarse por su causa. Con
   * el nivel seguro NO cae ahí: un factor de cien es discrepancia plena, y el
   * campo ya no mezcla dos cosas. Si alguien vuelve a meterla en la bolsa, esta
   * línea se pone roja.
   */
  it('E3 «25,00» contra «2500» es discrepancia PLENA, no variante de escritura', () => {
    const a = tabla(['Código', 'Precio'], [
      { 'Código': 'A1', Precio: '25,00' },
      { 'Código': 'A2', Precio: '10' },
      { 'Código': 'A3', Precio: '10' },
    ]);
    const b = tabla(['Código', 'Precio'], [
      { 'Código': 'A1', Precio: '2500' },
      { 'Código': 'A2', Precio: '10' },
      { 'Código': 'A3', Precio: '10' },
    ]);
    const r = diff(a, b);

    expect(r.differing).toHaveLength(1);
    expect(r.differing[0].comparedValues).toEqual([
      { column: 'Precio', newDocValue: '25,00', existingDocValue: '2500' },
    ]);
    expect(r.differing[0].varianteDeEscritura).toEqual([]);
    expect(r.counts.discrepanciasVarianteDeEscritura).toBe(0);
  });

  it('E4 celda vacía en un lado y con valor en el otro, en columna compartida: discrepa', () => {
    const a = tabla(['Código', 'Clínica', 'Notas'], [
      { 'Código': 'A1' }, // sin Clínica: chunking omite la celda vacía
      { 'Código': 'A2', 'Clínica': 'Retiro' },
      { 'Código': 'A3', 'Clínica': 'Retiro' },
    ]);
    const b = tabla(['Código', 'Clínica', 'Notas'], [
      { 'Código': 'A1', 'Clínica': 'Chamberí' },
      { 'Código': 'A2', 'Clínica': 'Retiro' },
      { 'Código': 'A3', 'Clínica': 'Retiro' },
    ]);
    const r = diff(a, b);

    expect(r.differing).toHaveLength(1);
    expect(r.differing[0].comparedValues).toEqual([
      { column: 'Clínica', newDocValue: '', existingDocValue: 'Chamberí' },
    ]);
  });

  it('E5 columna compartida vacía en las DOS filas: no aparece', () => {
    const a = tabla(['Código', 'Notas'], [{ 'Código': 'A1' }, { 'Código': 'A2' }, { 'Código': 'A3' }]);
    const b = tabla(['Código', 'Notas'], [{ 'Código': 'A1' }, { 'Código': 'A2' }, { 'Código': 'A3' }]);
    const r = diff(a, b);

    expect(r.comparedColumns).toEqual(['Notas']);
    expect(r.differing).toHaveLength(0);
    expect(r.identical).toHaveLength(3);
    expect(r.counts.porColumna).toEqual({});
  });

  it('E6 varias columnas discrepantes: todas, en el orden de la tabla', () => {
    const a = tabla(['Código', 'Zona', 'Precio'], [
      { 'Código': 'A1', Zona: 'Norte', Precio: '10' },
      { 'Código': 'A2', Zona: 'Norte', Precio: '10' },
      { 'Código': 'A3', Zona: 'Norte', Precio: '10' },
    ]);
    const b = tabla(['Código', 'Zona', 'Precio'], [
      { 'Código': 'A1', Zona: 'Sur', Precio: '20' },
      { 'Código': 'A2', Zona: 'Norte', Precio: '10' },
      { 'Código': 'A3', Zona: 'Norte', Precio: '10' },
    ]);
    const r = diff(a, b);

    // Orden de tabla, no alfabético: alfabéticamente iría ['Precio','Zona'].
    expect(r.differing[0].columns).toEqual(['Zona', 'Precio']);
    expect(r.differing[0].comparedValues.map(v => v.column)).toEqual(['Zona', 'Precio']);
    expect(r.counts.porColumna).toEqual({ Zona: 1, Precio: 1 });
  });

  /**
   * E8 — el contador de `varianteDeEscritura` es POR FILA y exige que TODAS
   * sus columnas coincidan al normalizar. Una fila que difiere de verdad en
   * una columna no deja de ser una discrepancia real porque otra de sus
   * columnas sea solo formato. Este caso se añadió porque la mutación que
   * contaba «si ALGUNA coincide» sobrevivía a E2 y E3, donde las filas
   * discrepan en una sola columna y las dos versiones dan el mismo número.
   */
  it('E8 formato y diferencia real en la misma fila: no cuenta como formato', () => {
    const a = tabla(['Código', 'Zona', 'Precio'], [
      { 'Código': 'A1', Zona: 'Norte', Precio: '10' },
      { 'Código': 'A2', Zona: 'Norte', Precio: '10' },
      { 'Código': 'A3', Zona: 'Norte', Precio: '10' },
    ]);
    const b = tabla(['Código', 'Zona', 'Precio'], [
      { 'Código': 'A1', Zona: 'norte', Precio: '99' }, // Zona solo formato, Precio real
      { 'Código': 'A2', Zona: 'Norte', Precio: '10' },
      { 'Código': 'A3', Zona: 'Norte', Precio: '10' },
    ]);
    const r = diff(a, b);

    expect(r.differing).toHaveLength(1);
    expect(r.differing[0].columns).toEqual(['Zona', 'Precio']);
    expect(r.differing[0].varianteDeEscritura).toEqual(['Zona']);
    expect(r.counts.discrepanciasVarianteDeEscritura).toBe(0);
  });


  /**
   * N2 — EL DAÑO QUE F-84 1b EVITA, y es el caso que de verdad justifica el
   * cambio de criterio. No mide una salida bonita: mide que el sistema DEJA DE
   * FABRICAR una discrepancia.
   *
   * Dos tratamientos DISTINTOS —un implante unitario y uno múltiple— cuyos
   * códigos solo se funden borrando el guion. Hasta F-84 1b la fase 1 los
   * emparejaba, y entonces la fase 2 enfrentaba sus precios (900 contra 1500) y
   * emitía una discrepancia CON SELLO DE VERIFICADA POR ESTRUCTURA sobre dos
   * filas que no son la misma cosa: el falso positivo más caro que puede emitir
   * el producto, porque el usuario no tiene cómo saber que las filas no eran la
   * misma.
   *
   * Con el nivel seguro no emparejan, así que cada una cae a su lado y la fase 2
   * no tiene nada que enfrentar. El usuario las ve en cobertura y decide — el
   * error benigno y visible, en vez del catastrófico e invisible.
   */
  it('N2 no fabrica una discrepancia entre dos filas que no son la misma', () => {
    const a = tabla(['Código', 'Tratamiento', 'Precio'], [
      { 'Código': 'IMP-01', Tratamiento: 'Implante unitario', Precio: '900' },
      { 'Código': 'A2', Tratamiento: 'Z', Precio: '10' },
      { 'Código': 'A3', Tratamiento: 'Z', Precio: '10' },
    ]);
    const b = tabla(['Código', 'Tratamiento', 'Precio'], [
      { 'Código': 'IMP01', Tratamiento: 'Implante múltiple', Precio: '1500' },
      { 'Código': 'A2', Tratamiento: 'Z', Precio: '10' },
      { 'Código': 'A3', Tratamiento: 'Z', Precio: '10' },
    ]);
    // La premisa, comprobada y no recordada: el criterio viejo los fundía.
    expect(normalize('IMP-01')).toBe(normalize('IMP01'));

    const key = discoverTableKey(a, b);
    expect(key.status).toBe('emparejado');
    if (key.status !== 'emparejado') throw new Error('inalcanzable');
    const r = diffPairedRows(key, a, b);

    // Las dos filas caen a su lado, no a una pareja.
    expect(key.onlyNueva.map(x => x.cells?.['Código'])).toEqual(['IMP-01']);
    expect(key.onlyExistente.map(x => x.cells?.['Código'])).toEqual(['IMP01']);

    // Y LO QUE IMPORTA: cero discrepancias fabricadas. Ni una sola pareja
    // enfrenta los dos implantes ni sus precios.
    expect(r.differing).toHaveLength(0);
    expect(r.identical).toHaveLength(2);
    expect(JSON.stringify(r.differing)).not.toContain('Implante');
  });
  it('E7 todas las compartidas son clave: cero columnas comparables, contado', () => {
    const a = tabla(['K'], [{ K: 'A1' }, { K: 'A2' }, { K: 'A3' }]);
    const b = tabla(['K', 'Otra'], [
      { K: 'A1', Otra: 'x' }, { K: 'A2', Otra: 'y' }, { K: 'A3', Otra: 'z' },
    ]);
    const r = diff(a, b);

    expect(r.comparedColumns).toEqual([]);
    expect(r.counts.columnasComparadas).toBe(0);
    expect(r.counts.columnasExcluidasPorClave).toBe(1);
    expect(r.counts.columnasNoCompartidas).toBe(1);
    // Salen como idénticas porque no había nada que comparar, no porque se
    // haya comprobado que lo son. Lo dice columnasComparadas: 0.
    expect(r.identical).toHaveLength(3);
    expect(r.differing).toHaveLength(0);
  });
});
