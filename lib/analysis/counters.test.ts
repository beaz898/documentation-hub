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
    const etapas = ['diff.clave', 'diff.celdas', 'seleccion', 'verificador', 'averia'];
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

  it('ignora las partes ausentes y no muta ninguna', () => {
    const a: PipelineCounters = { 'verificador.confirmados': 1 };
    const out = mergeCounters(a, undefined, { 'verificador.confirmados': 1 });
    expect(out).toEqual({ 'verificador.confirmados': 2 });
    expect(a).toEqual({ 'verificador.confirmados': 1 }); // sin tocar
    expect(out).not.toBe(a);
  });
});
