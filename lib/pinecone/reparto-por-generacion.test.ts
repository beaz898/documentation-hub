import { describe, expect, it } from 'vitest';

import { repartoPorGeneracion, elRepartoDeGeneracionesCuadra } from './reparto-por-generacion';
import { buildVectorId } from './vectors';

/**
 * ⚠️ EL REPARTO POR GENERACIÓN — F-114.
 *
 * Lo que estos casos vigilan es que la generación se LEA DEL ID y no se suponga:
 * es la diferencia entre poder explicar un vector superviviente y volver a
 * tropezar con B.73, donde todo se daba por generación 1.
 */

const DOC = 'c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6';

describe('repartoPorGeneracion — la generación sale del id', () => {
  it('sin ids, el reparto está vacío y no inventa generaciones', () => {
    const r = repartoPorGeneracion([]);
    expect(r.porGeneracion).toEqual({});
    expect(r.anomalos).toEqual([]);
    expect(elRepartoDeGeneracionesCuadra([], r)).toBe(true);
  });

  /**
   * ⚠️ CASO DECISIVO: la generación 1 va SIN marca en el id y la 2 con `-g2-`.
   * Si alguien volviera a tratar todo como generación 1 —el fallo de B.73—, este
   * caso pondría los seis vectores de la 2 en la 1 y se pondría rojo.
   */
  it('⚠️ separa la 1 implícita (sin marca) de la 2 explícita (-g2-)', () => {
    const ids = [
      buildVectorId(DOC, 1, 0), buildVectorId(DOC, 1, 1), buildVectorId(DOC, 1, 2),
      buildVectorId(DOC, 2, 0), buildVectorId(DOC, 2, 1),
    ];
    const r = repartoPorGeneracion(ids);
    expect(r.porGeneracion).toEqual({ '1': 3, '2': 2 });
    expect(r.anomalos).toEqual([]);
    expect(elRepartoDeGeneracionesCuadra(ids, r)).toBe(true);
  });

  it('una sola generación superviviente se ve sola, que es el caso del fantasma', () => {
    const ids = Array.from({ length: 6 }, (_, i) => buildVectorId(DOC, 2, i));
    const r = repartoPorGeneracion(ids);
    expect(r.porGeneracion).toEqual({ '2': 6 });
    expect(Object.keys(r.porGeneracion)).toHaveLength(1);
  });

  it('⚠️ un id que no encaja se cuenta como ANÓMALO, no se tira en silencio', () => {
    const ids = [buildVectorId(DOC, 1, 0), 'sin-forma-de-vector', buildVectorId(DOC, 3, 4)];
    const r = repartoPorGeneracion(ids);
    expect(r.anomalos).toEqual(['sin-forma-de-vector']);
    expect(r.porGeneracion).toEqual({ '1': 1, '3': 1 });
    // ⚠️ Y el cuadre sigue cerrando CON el anómalo dentro: si se tirara, la
    // suma no daría el total y «esa generación no tenía vectores» pasaría por
    // explicación.
    expect(elRepartoDeGeneracionesCuadra(ids, r)).toBe(true);
  });

  it('⚠️ el cuadre se rompe si alguien pierde un id por el camino', () => {
    const ids = [buildVectorId(DOC, 1, 0), buildVectorId(DOC, 1, 1)];
    const rotoDeMenos = { porGeneracion: { '1': 1 }, anomalos: [] };
    expect(elRepartoDeGeneracionesCuadra(ids, rotoDeMenos)).toBe(false);
    const rotoDeMas = { porGeneracion: { '1': 3 }, anomalos: [] };
    expect(elRepartoDeGeneracionesCuadra(ids, rotoDeMas)).toBe(false);
  });

  it('la generación alta no se colapsa: cada una va a su clave', () => {
    const ids = [buildVectorId(DOC, 7, 0), buildVectorId(DOC, 12, 0), buildVectorId(DOC, 12, 1)];
    expect(repartoPorGeneracion(ids).porGeneracion).toEqual({ '7': 1, '12': 2 });
  });
});
