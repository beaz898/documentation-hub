import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { emparejarTablas } from './table-pairing';
import { groupChunksByTable, type TableGroup } from './table-structure';

/**
 * BATERÍA DEL EMPAREJADOR DE TABLAS (F-88 paso 1).
 *
 * LO QUE VIGILA no es aritmética: es que este módulo RECORRA y no ELIJA. F-88
 * P1 descartó expresamente la opción «mejor clave» porque elegir ganadores hace
 * desaparecer información en silencio, y la forma de que eso no vuelva a
 * colarse es un caso que falle en cuanto alguien meta un `break`, un `find` o
 * una puntuación.
 *
 * LOS CASOS CONSTRUIDOS SON LITERALES Y NO .xlsx, por el mismo criterio que la
 * batería de la fase 1: `corpus-pruebas/` es ground truth de TANDAS, con su
 * regla de admisión y su registro de siembra, y cada fichero que entre ahí pide
 * su SIEMBRA_*.md. Además, un documento con OCHO tablas para medir el coste no
 * se encuentra: se construye.
 *
 * Y HACEN FALTA CONSTRUIDOS POR UNA RAZÓN QUE ES EL HALLAZGO ENTERO DE F-88:
 * cada documento del corpus tiene UNA SOLA TABLA. Por eso N×M era 1×1 en todo
 * lo medido hasta ahora, y por eso el supuesto del singular sobrevivió a dos
 * consultas sin que nadie lo viera.
 */

// ── helpers ────────────────────────────────────────────────────────────────

/** Un documento del corpus por la cadena REAL del pipeline, igual que en la
 *  batería de la fase 1: lo que se mide tiene que ser lo que el sistema
 *  procesa. Devuelve TODAS sus tablas, no una — es justo lo que este módulo
 *  necesita saber. */
async function tablasDeCorpus(file: string): Promise<TableGroup[]> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  const chunks = toStoredChunks(chunkSegments(segments, 'doc-test', file, 'org-test'));
  return groupChunksByTable(chunks);
}

/** Una tabla construida a mano. `id` distingue las tablas entre sí, que es lo
 *  que aquí importa: el emparejador razona sobre VARIAS por documento. */
function tabla(id: string, columns: string[], filas: Array<Record<string, string>>): TableGroup {
  return {
    tableId: `${id}#0`,
    sheetName: id,
    columns,
    totalRows: filas.length,
    rows: filas.map((cells, i): StoredChunk => ({
      chunkIndex: i,
      chunkType: 'table_row',
      text: '',
      sheetName: id,
      tableId: `${id}#0`,
      rowIndex: i,
      cells,
      columnOrder: null,
    })),
  };
}

/** Una tabla de tarifas con códigos correlativos a partir de `desde`. */
function tarifas(id: string, desde: number, cuantas: number, precio: string): TableGroup {
  return tabla(
    id,
    ['Código', 'Tratamiento', 'Precio'],
    Array.from({ length: cuantas }, (_, i) => ({
      Código: `T-${String(desde + i).padStart(3, '0')}`,
      Tratamiento: `Tratamiento ${desde + i}`,
      Precio: precio,
    })),
  );
}

// ── LA INVARIANTE ──────────────────────────────────────────────────────────

/**
 * LO QUE HACE CIERTA LA REGLA «todo lo demás se cuenta». Un par evaluado cae
 * en EXACTAMENTE UNO de los tres destinos: sin clave, sin intersección, o
 * emitido. Sin residuo y sin doble conteo — si un par pudiera desaparecer sin
 * dejar rastro, la promesa de F-88 sería falsa aunque los tres números
 * parecieran razonables por separado.
 */
function invariante(r: ReturnType<typeof emparejarTablas>): void {
  const c = r.counts;
  expect(
    (c['diff.tablas.sin_clave'] ?? 0) +
    (c['diff.tablas.sin_interseccion'] ?? 0) +
    (c['diff.tablas.emitidos'] ?? 0),
  ).toBe(c['diff.tablas.candidatos']);
  expect(c['diff.tablas.emitidos']).toBe(r.pares.length);
}

describe('emparejarTablas — todo par es candidato, y nadie elige', () => {
  it('el caso simple: una contra una que sí empareja', () => {
    const r = emparejarTablas([tarifas('Nueva', 1, 5, '100')], [tarifas('Existente', 1, 5, '120')]);

    expect(r.counts['diff.tablas.candidatos']).toBe(1);
    expect(r.pares).toHaveLength(1);
    invariante(r);
  });

  /**
   * EL DOBLE EMPAREJAMIENTO LEGÍTIMO — el caso que F-88 nombra expresamente.
   *
   * Un fichero con la hoja 2025 y la 2026 contra otro con una sola. La tabla
   * del documento nuevo pasa las tres puertas con LAS DOS del candidato, y las
   * dos son hechos estructurales verdaderos. Se emiten las dos.
   *
   * ES EL CASO QUE MUERE PRIMERO si alguien «optimiza» quedándose con el mejor
   * emparejamiento de cada tabla. Por eso se comprueba también QUÉ dos pares
   * salen, y no solo cuántos: un `break` mal puesto dejaría uno y el recuento
   * seguiría pareciendo plausible.
   */
  it('DOBLE EMPAREJAMIENTO: una tabla contra dos, y salen las dos', () => {
    const nueva = tarifas('Tarifas', 1, 6, '100');
    const r = emparejarTablas([nueva], [tarifas('Hoja2025', 1, 6, '90'), tarifas('Hoja2026', 1, 6, '95')]);

    expect(r.pares).toHaveLength(2);
    expect(r.pares.map(p => p.existente.tableId).sort()).toEqual(['Hoja2025#0', 'Hoja2026#0']);
    expect(r.pares.every(p => p.nueva.tableId === 'Tarifas#0')).toBe(true);
    expect(r.counts['diff.tablas.emitidos']).toBe(2);
    invariante(r);
  });

  /**
   * CLAVE SIN INTERSECCIÓN — el otro caso que F-88 nombra.
   *
   * Las dos tablas comparten la columna «Código», con unicidad alta en ambas,
   * así que la PRIMERA puerta las admite: la clave se descubre por unicidad
   * DENTRO de cada tabla, no por solape entre ellas. Pero no comparten ni un
   * código, así que no emparejan ninguna fila y caen en la TERCERA.
   *
   * No son la misma tabla en dos documentos: son dos poblaciones distintas.
   */
  it('CLAVE SIN INTERSECCIÓN: misma columna, cero valores comunes, no se emite', () => {
    const r = emparejarTablas([tarifas('Nueva', 1, 5, '100')], [tarifas('Existente', 500, 5, '100')]);

    expect(r.pares).toHaveLength(0);
    expect(r.counts['diff.tablas.sin_interseccion']).toBe(1);
    expect(r.counts['diff.tablas.sin_clave']).toBe(0);
    invariante(r);
  });

  it('SIN CLAVE: sin columnas comunes no hay diff, y se cuenta', () => {
    const otra = tabla('Personal', ['Empleado', 'Puesto'], [
      { Empleado: 'Ana Ruiz', Puesto: 'Higienista' },
      { Empleado: 'Luis Vega', Puesto: 'Auxiliar' },
    ]);
    const r = emparejarTablas([tarifas('Nueva', 1, 5, '100')], [otra]);

    expect(r.pares).toHaveLength(0);
    expect(r.counts['diff.tablas.sin_clave']).toBe(1);
    invariante(r);
  });

  it('sin tablas de un lado no hay candidatos, y los ceros se escriben', () => {
    const r = emparejarTablas([], [tarifas('Existente', 1, 5, '100')]);

    expect(r.pares).toHaveLength(0);
    expect(r.counts['diff.tablas.candidatos']).toBe(0);
    // Presentes y a cero: el emparejador CORRIÓ. Ausente significaría que no.
    expect(r.counts['diff.tablas.emitidos']).toBe(0);
    invariante(r);
  });

  /**
   * N×M DE VERDAD, con las tres salidas a la vez. Dos tablas del nuevo contra
   * tres del candidato: seis candidatos, y cada puerta se lleva lo suyo.
   */
  it('N×M reparte cada par por su puerta, sin residuo', () => {
    const nuevas = [tarifas('TarifasA', 1, 5, '100'), tabla('Personal', ['Empleado', 'Puesto'], [
      { Empleado: 'Ana Ruiz', Puesto: 'Higienista' },
      { Empleado: 'Luis Vega', Puesto: 'Auxiliar' },
    ])];
    const existentes = [
      tarifas('Coincide', 1, 5, '120'),       // empareja con TarifasA
      tarifas('Ajena', 900, 5, '120'),        // clave sí, intersección no
      tabla('Horario', ['Día', 'Turno'], [{ Día: 'Lunes', Turno: 'Mañana' }]), // sin clave con ninguna
    ];

    const r = emparejarTablas(nuevas, existentes);

    expect(r.counts['diff.tablas.candidatos']).toBe(6);
    expect(r.pares).toHaveLength(1);
    expect(r.pares[0].existente.tableId).toBe('Coincide#0');
    invariante(r);
  });

  /** B.117: en datos limpios vale CERO, y presente-a-cero significa que el
   *  descubrimiento de clave corrió y midió. Ausente significaría que no. */
  it('rechazadas_por_escritura sale a cero con datos limpios', () => {
    const r = emparejarTablas([tarifas('Nueva', 1, 5, '100')], [tarifas('Existente', 1, 5, '120')]);
    expect(r.counts['diff.clave.rechazadas_por_escritura']).toBe(0);
  });

  /**
   * B.117 CON INCIDENCIA DE VERDAD — el caso que el corpus NO PUEDE DAR.
   *
   * B.117 lo dice con todas las letras: las tablas del corpus se generaron
   * PROGRAMÁTICAMENTE y no pueden producir una diferencia de escritura por
   * accidente, así que su cero «no es una propiedad del mundo». Aquí se
   * construye la incidencia a propósito: las claves difieren SOLO EN LA CAJA
   * («T-001» contra «t-001»), que el nivel seguro funde y el crudo no. La fila
   * empareja hoy y no habría emparejado comparando en crudo — que es
   * exactamente lo que este contador mide.
   *
   * HUECO ENCONTRADO POR MUTACIÓN: sin este caso se podía borrar la línea que
   * acumula el contador y la batería seguía verde, porque todo lo demás vale
   * cero. Un contador que solo se comprueba a cero no está comprobado.
   */
  it('rechazadas_por_escritura CUENTA cuando la escritura cambia el emparejamiento', () => {
    const nueva = tabla('Nueva', ['Código', 'Precio'], [
      { Código: 'T-001', Precio: '100' },
      { Código: 'T-002', Precio: '100' },
      { Código: 'T-003', Precio: '100' },
    ]);
    const existente = tabla('Existente', ['Código', 'Precio'], [
      { Código: 't-001', Precio: '120' },
      { Código: 'T-002', Precio: '120' },
      { Código: 'T-003', Precio: '120' },
    ]);

    const r = emparejarTablas([nueva], [existente]);

    expect(r.counts['diff.clave.rechazadas_por_escritura']).toBeGreaterThan(0);
  });

  /**
   * LOS ROLES NO SON INTERCAMBIABLES — hueco encontrado por mutación.
   *
   * `emparejarTablas(nuevas, existentes)` pasa los lados a la fase 1 EN ESE
   * ORDEN, y la fase 1 los distingue: `onlyNueva` son las filas del documento
   * que se analiza y `onlyExistente` las del candidato. Son los dos montones de
   * la sección de cobertura de F-83 P2, y confundirlos diría «presente solo en
   * OPE-10» donde hay que decir «solo en OPE-11» — el indicativo que F-83
   * declaró innegociable, invertido.
   *
   * Con montones ASIMÉTRICOS a propósito: los casos del corpus tienen 25 y 25,
   * y una simetría no puede detectar una inversión. Sin este caso se podían
   * intercambiar los argumentos de `discoverTableKey` sin que fallara nada.
   */
  it('los LADOS no se pueden intercambiar: cada montón es de su documento', () => {
    const nueva = tarifas('Nueva', 1, 3, '100');        // T-001..T-003
    const existente = tarifas('Existente', 1, 5, '120'); // T-001..T-005

    const r = emparejarTablas([nueva], [existente]);

    expect(r.pares).toHaveLength(1);
    const { pairs, onlyNueva, onlyExistente } = r.pares[0].clave;
    expect(pairs.length).toBe(3);
    expect(onlyNueva.length).toBe(0);   // el nuevo no aporta ninguna suya
    expect(onlyExistente.length).toBe(2); // el candidato tiene dos de más
  });
});

describe('emparejarTablas — el corpus real', () => {
  /**
   * EL HECHO QUE ESCONDIÓ EL SUPUESTO, fijado como caso. Cada documento del
   * corpus tiene UNA tabla, así que N×M = 1 y el singular de F-83 P2 y F-84 P1
   * era cierto AQUÍ — solo aquí. Si algún día un fichero del corpus creciera a
   * dos tablas, este caso avisa y hay que releer los números de las tandas.
   */
  it('cada documento tabular del corpus tiene UNA tabla', async () => {
    for (const f of [
      'OPE-10_tarifario-tratamientos-2026.xlsx',
      'OPE-11_tarifario-tratamientos-seguros.xlsx',
      'OPE-02_agenda-y-gestion-de-citas.xlsx',
      'RRHH-06_evaluacion-del-desempeno.xlsx',
    ]) {
      expect(await tablasDeCorpus(f), f).toHaveLength(1);
    }
  });

  it('OPE-10 / OPE-11 — el par de tarifarios se empareja y se emite', async () => {
    const r = emparejarTablas(
      await tablasDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx'),
      await tablasDeCorpus('OPE-11_tarifario-tratamientos-seguros.xlsx'),
    );

    expect(r.counts['diff.tablas.candidatos']).toBe(1);
    expect(r.pares).toHaveLength(1);

    // LAS CINCUENTA AJENAS, fijadas contra el corpus real. F-83 P2 y F-84 P1
    // razonan sobre «cincuenta filas sin correspondencia: 25 solo en OPE-10 y
    // 25 solo en OPE-11», y hasta ahora esa cifra vivía en el texto de dos
    // consultas. Aquí queda comprobada sobre los ficheros: es el material de
    // la sección de cobertura que emite el commit siguiente.
    const { pairs, onlyNueva, onlyExistente } = r.pares[0].clave;
    expect(pairs.length).toBe(35);
    expect(onlyNueva.length).toBe(25);
    expect(onlyExistente.length).toBe(25);

    invariante(r);
  });

  it('OPE-02 / RRHH-06 — el otro par real, igual', async () => {
    const r = emparejarTablas(
      await tablasDeCorpus('OPE-02_agenda-y-gestion-de-citas.xlsx'),
      await tablasDeCorpus('RRHH-06_evaluacion-del-desempeno.xlsx'),
    );

    expect(r.pares).toHaveLength(1);
    invariante(r);
  });

  /**
   * EL PAR ABSURDO, con datos reales — un tarifario contra una evaluación de
   * desempeño. Es lo que F-88 prometió que las puertas disuelven solas: no hay
   * que enseñarle al sistema que estas dos tablas no van juntas, se cae por su
   * propio peso. No se afirma POR QUÉ puerta cae, solo que no se emite y que
   * queda contado: el reparto entre la 1ª y la 3ª depende de los datos, y
   * fijarlo aquí ataría el caso a un detalle que no es lo que se promete.
   */
  it('el par ABSURDO no se emite, y queda contado', async () => {
    const r = emparejarTablas(
      await tablasDeCorpus('OPE-10_tarifario-tratamientos-2026.xlsx'),
      await tablasDeCorpus('RRHH-06_evaluacion-del-desempeno.xlsx'),
    );

    expect(r.pares).toHaveLength(0);
    expect(r.counts['diff.tablas.emitidos']).toBe(0);
    invariante(r);
  });
});

/**
 * EL COSTE, MEDIDO Y NO SUPUESTO. F-88 afirma que «ocho tablas contra seis son
 * 48 comprobaciones de una función determinista que corre en milisegundos» y
 * que el producto de números pequeños por milisegundos es gratis. Eso es una
 * afirmación sobre el mundo, y aquí se comprueba.
 *
 * EL UMBRAL ES DELIBERADAMENTE HOLGADO (500 ms) porque un test de tiempo en una
 * suite es una fuente de fallos intermitentes: lo que se vigila es el ORDEN DE
 * MAGNITUD —que N×M no sea el problema que F-88 descartó—, no una cifra fina.
 * La cifra real se imprime, que es lo que pedía el encargo.
 */
describe('emparejarTablas — el coste de N×M', () => {
  it('8 × 6 = 48 comprobaciones, y el tiempo no es el problema', () => {
    const nuevas = Array.from({ length: 8 }, (_, i) => tarifas(`Nueva${i}`, i * 100 + 1, 10, '100'));
    const existentes = Array.from({ length: 6 }, (_, i) => tarifas(`Exist${i}`, i * 100 + 1, 10, '120'));

    const t0 = performance.now();
    const r = emparejarTablas(nuevas, existentes);
    const ms = performance.now() - t0;

    expect(r.counts['diff.tablas.candidatos']).toBe(48);
    invariante(r);

    console.log(`[table-pairing] COSTE MEDIDO: 48 pares (8×6), 10 filas por tabla — ${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(500);
  });
});
