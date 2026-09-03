import { describe, expect, it } from 'vitest';

import { generacionesMuertas, soloGeneracionActiva } from './generacion-activa';

/**
 * F-102 — LA SEGUNDA CAPA: que las generaciones muertas no SE VEAN.
 *
 * ⚠️ LO QUE NO PRUEBAN: que el retrieval construya bien el mapa de generaciones
 * activas — eso consulta Supabase. Lo que sí prueban es el criterio, que es
 * donde equivocarse cuesta candidatos.
 */

const f = (documentId: string, generation: number) => ({ documentId, generation });

describe('solo lo que el documento sirve hoy', () => {
  const activas = new Map([['doc-a', 2], ['doc-b', 1]]);

  it('conserva la generación activa', () => {
    expect(soloGeneracionActiva([f('doc-a', 2), f('doc-b', 1)], activas))
      .toEqual([f('doc-a', 2), f('doc-b', 1)]);
  });

  /**
   * ⚠️ LA MITAD CONTRARIA, y es el incidente entero: un fragmento de la
   * generación anterior entraba en la recuperación como si fuera el contenido
   * actual, y el diff lo comparaba contra el presente del mismo documento.
   */
  it('descarta una generación anterior', () => {
    expect(soloGeneracionActiva([f('doc-a', 1), f('doc-a', 2)], activas)).toEqual([f('doc-a', 2)]);
  });

  /** Y una posterior tampoco: no debería existir, y si existe no es la servida. */
  it('descarta una generación posterior', () => {
    expect(soloGeneracionActiva([f('doc-b', 2)], activas)).toEqual([]);
  });
});

describe('LO QUE NO SE SABE NO SE TIRA', () => {
  /**
   * ⚠️ MITAD CONTRARIA B. Si el documento no está en el mapa —la consulta no lo
   * trajo, o la fila ya no existe— sus fragmentos se CONSERVAN. Descartar por
   * desconocimiento convertiría un fallo de lectura en pérdida de candidatos:
   * la ausencia de dato no es dato.
   */
  it('un documento desconocido conserva todos sus fragmentos', () => {
    expect(soloGeneracionActiva([f('doc-x', 1), f('doc-x', 7)], new Map([['doc-a', 2]])))
      .toEqual([f('doc-x', 1), f('doc-x', 7)]);
  });

  it('con el mapa vacío no se descarta nada', () => {
    expect(soloGeneracionActiva([f('doc-a', 1)], new Map())).toEqual([f('doc-a', 1)]);
  });

  it('sin fragmentos no hay nada que decidir', () => {
    expect(soloGeneracionActiva([], new Map([['doc-a', 2]]))).toEqual([]);
  });
});

describe('la caída no es muda', () => {
  const activas = new Map([['doc-a', 2]]);

  /** ⚠️ ESPERADO CERO EN RÉGIMEN NORMAL: si esto se mueve, hay vectores de
   *  generaciones muertas vivos en el índice — lo que contaminó una medición y
   *  nadie vio, porque no había quien lo contara. */
  it('cuenta los descartados por documento', () => {
    expect(generacionesMuertas([f('doc-a', 1), f('doc-a', 1), f('doc-a', 2)], activas))
      .toEqual(new Map([['doc-a', 2]]));
  });

  it('en régimen normal no cuenta nada', () => {
    expect(generacionesMuertas([f('doc-a', 2)], activas).size).toBe(0);
  });

  /** Lo desconocido no se cuenta como muerto: no se descartó. */
  it('lo desconocido no entra en la cuenta', () => {
    expect(generacionesMuertas([f('doc-z', 9)], activas).size).toBe(0);
  });
});

describe('los vectores anteriores a C.4b no llevan generación', () => {
  /** ⚠️ AUSENTE = generación 1 implícita, igual que en `parseVectorId`. Tratarla
   *  como desconocida sacaría del corpus a documentos por no tener un campo que
   *  nunca tuvieron — y eso es pérdida de candidatos, no higiene. */
  it('sin generación cuenta como la 1', () => {
    const sinGen = { documentId: 'doc-viejo' } as { documentId: string; generation?: number };
    expect(soloGeneracionActiva([sinGen], new Map([['doc-viejo', 1]]))).toEqual([sinGen]);
    expect(soloGeneracionActiva([sinGen], new Map([['doc-viejo', 2]]))).toEqual([]);
  });
});
