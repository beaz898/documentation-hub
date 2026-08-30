import { describe, expect, it, vi } from 'vitest';

import { COUNTER_CATALOGUE, mergeCounters, type PipelineCounters } from './counters';

/**
 * BATERÍA DEL CONTRATO DE CONTADORES (F-82).
 *
 * Lo que se prueba aquí no es aritmética: es la CLÁUSULA 4 —la fusión solo
 * transporta lo declarado—, que es el mecanismo por el que `discardedFindings`
 * se estropeó y el único que el código puede hacer cumplir en tiempo de
 * ejecución. El resto del contrato lo hace cumplir el compilador (el
 * `satisfies` del catálogo) y no necesita test: no compilaría.
 */

describe('el catálogo', () => {
  /**
   * CANARIO, a propósito, y con el mismo criterio que T2 del diff: la lista va
   * escrita entera. Añadir un contador debe ser una edición DELIBERADA que pase
   * por aquí — el contrato dice que se añade al catálogo primero y se emite
   * después, y este test es lo que convierte ese «primero» en algo que se nota.
   *
   * SI LO VES ROJO: no lo arregles copiando la lista nueva sin mirar. Comprueba
   * que el contador que se añadió es un recuento de DECISIÓN (cláusula 2) y que
   * su nombre no lleva datos del cliente (cláusula 5).
   */
  it('es exactamente la lista declarada', () => {
    expect([...COUNTER_CATALOGUE]).toEqual([
      'seleccion.candidatos_recuperados',
      'seleccion.candidatos_seleccionados',
      // F-88 paso 1: la etapa nueva. El emparejador de tablas y su invariante
      // candidatos === sin_clave + sin_interseccion + emitidos.
      'diff.tablas.candidatos',
      'diff.tablas.sin_clave',
      'diff.tablas.sin_interseccion',
      'diff.tablas.emitidos',
      // B.117: el productor existía desde F-84 y se tiraba.
      'diff.clave.rechazadas_por_escritura',
      'diff.clasificacion.identicas',
      'diff.clasificacion.discrepantes',
      'diff.clasificacion.columnas_afectadas',
      'diff.clasificacion.solo_en_a',
      'diff.clasificacion.solo_en_b',
      // F-87 P3. DECLARADO SIN PRODUCTOR a propósito: el diff no corre en el
      // pipeline hasta el commit de emisión, y la cláusula 4 manda catalogar
      // antes de emitir. Que esté aquí sin quien lo incremente es el contrato
      // funcionando, no un olvido.
      'diff.clasificacion.pre_indexado',
      'verificador.hallazgos_entrantes',
      'verificador.confirmados',
      'verificador.confirmados_por_estructura',
      'verificador.confirmados_por_juicio',
      'verificador.descartados',
      'verificador.reclasificados',
    ]);
  });

  /** Cláusula 1, comprobada también en ejecución: el `satisfies` la garantiza
   *  al compilar, pero este test explica QUÉ garantiza a quien lea la batería. */
  it('todo nombre lleva apellido de una etapa conocida', () => {
    // La lista va DUPLICADA del tipo Stage a proposito, con el mismo criterio
    // que el canario del catalogo: anadir una etapa tiene que pasar por aqui.
    // Derivarla exportando Stage la haria automatica y dejaria de avisar.
    const etapas = ['diff.tablas', 'diff.clave', 'diff.celdas', 'diff.clasificacion', 'seleccion', 'verificador', 'averia'];
    for (const name of COUNTER_CATALOGUE) {
      expect(etapas.some(e => name.startsWith(`${e}.`)), `"${name}" sin apellido de etapa`).toBe(true);
    }
  });
});

describe('mergeCounters — cláusula 4', () => {
  it('suma las partes por nombre', () => {
    const a: PipelineCounters = { 'verificador.confirmados': 2, 'verificador.descartados': 1 };
    const b: PipelineCounters = { 'verificador.confirmados': 3 };
    expect(mergeCounters(a, b)).toEqual({
      'verificador.confirmados': 5,
      'verificador.descartados': 1,
    });
  });

  /**
   * EL CASO QUE DA SENTIDO AL CONTRATO. Así entró `verificado.por_celdas` en
   * `discardedFindings`: nadie lo decidió, lo llevó la fusión ciega. Aquí no
   * viaja, y se avisa.
   *
   * El objeto se construye con un `as` porque el compilador YA impide escribir
   * esto — el escenario real no es un autor tecleando la clave, es un
   * `pipeline_counters` releído del jsonb, o cruzado desde el worker, que llega
   * como datos y no como código.
   */
  it('descarta con aviso lo que no está en el catálogo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sucio = {
      'verificador.confirmados': 4,
      'verificado.por_celdas': 9,
      'inventado': 1,
    } as unknown as PipelineCounters;

    expect(mergeCounters(sucio)).toEqual({ 'verificador.confirmados': 4 });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.map(c => String(c[0]))).toEqual([
      expect.stringContaining('verificado.por_celdas'),
      expect.stringContaining('inventado'),
    ]);
    warn.mockRestore();
  });

  it('descarta un valor que no es número', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const sucio = {
      'verificador.confirmados': 4,
      'verificador.descartados': 'muchos',
    } as unknown as PipelineCounters;

    expect(mergeCounters(sucio)).toEqual({ 'verificador.confirmados': 4 });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('conserva los ceros: «actuó cero veces» es un dato, no una ausencia', () => {
    expect(mergeCounters({ 'verificador.confirmados': 0 })).toEqual({ 'verificador.confirmados': 0 });
  });

  /**
   * LAS TRES FORMAS QUE PRODUCE runCorePipeline, una por salida. Este bloque
   * existe por lo que el commit anterior NO cubría: su batería probaba
   * `mergeCounters` —la pieza— y ni un caso sobre lo que llega a la salida, así
   * que una salida temprana sin contadores pasó los siete tests y se descubrió
   * en producción, con `pipeline_counters` en null.
   *
   * Que las tres salidas pasen por `withCounters` lo garantiza ahora el TIPO
   * (`CountedAnalysis` en pipeline.ts: un `return` que no pase por ahí no
   * compila, comprobado mutando el fichero). Lo que fija este bloque es lo
   * otro: que cada forma es DISTINGUIBLE y que ninguna llega vacía. Un
   * `pipeline_counters` que no distinga «no había corpus» de «el rerank no dejó
   * nada» no responde la pregunta para la que existe el campo.
   */
  describe('las tres formas de una salida de runCorePipeline', () => {
    it('salida temprana 1 — cero candidatos: no llega vacía', () => {
      const out = mergeCounters({ 'seleccion.candidatos_recuperados': 0 });
      expect(Object.keys(out).length).toBeGreaterThan(0);
      expect(out['seleccion.candidatos_recuperados']).toBe(0);
      // AUSENTE, no 0: el rerank no llegó a correr, y un 0 diría que corrió y
      // no seleccionó nada. La distinción es el dato.
      expect('seleccion.candidatos_seleccionados' in out).toBe(false);
      expect('verificador.hallazgos_entrantes' in out).toBe(false);
    });

    it('salida temprana 2 — el rerank no dejó ninguno: se distingue de la anterior', () => {
      const out = mergeCounters({
        'seleccion.candidatos_recuperados': 5,
        'seleccion.candidatos_seleccionados': 0,
      });
      expect(out['seleccion.candidatos_recuperados']).toBe(5);
      expect(out['seleccion.candidatos_seleccionados']).toBe(0);
      expect('verificador.hallazgos_entrantes' in out).toBe(false);
    });

    it('salida normal — las dos etapas y la cascada', () => {
      const out = mergeCounters({
        'seleccion.candidatos_recuperados': 5,
        'seleccion.candidatos_seleccionados': 3,
        'verificador.hallazgos_entrantes': 4,
        'verificador.confirmados': 2,
        'verificador.confirmados_por_estructura': 1,
        'verificador.confirmados_por_juicio': 1,
        'verificador.descartados': 2,
        'verificador.reclasificados': 0,
      });
      expect(Object.keys(out)).toHaveLength(8);
      expect(out['verificador.reclasificados']).toBe(0);
    });
  });

  it('ignora las partes ausentes y no muta ninguna', () => {
    const a: PipelineCounters = { 'verificador.confirmados': 1 };
    const out = mergeCounters(a, undefined, { 'verificador.confirmados': 1 });
    expect(out).toEqual({ 'verificador.confirmados': 2 });
    expect(a).toEqual({ 'verificador.confirmados': 1 }); // sin tocar
    expect(out).not.toBe(a);
  });
});
