import { describe, it, expect } from 'vitest';
import { planDeReindexado, esReparacionCompleta } from './plan-de-reindexado';
import type { EntradaDelPlan } from './plan-de-reindexado';

/**
 * EL PLAN DE REINDEXADO — la batería.
 *
 * Criterio escrito antes que los casos, por lo que enseñó B.182.
 *
 * ⚠️ EL CASO QUE MÁS VALE DE ESTA BATERÍA es el de la guarda de tablas: es la
 * única que impide una PÉRDIDA DE DATOS —re-trocear un documento con tablas sin
 * su original las convertiría en prosa— y por eso tiene caso propio en las dos
 * direcciones, no solo en la que rechaza.
 */

const VIGENTE = 3;

function entrada(over: Partial<EntradaDelPlan> = {}): EntradaDelPlan {
  return {
    fila: { extractorVersion: 2, source: 'manual', providerFileId: null },
    tieneChunksTabulares: false,
    hayStagedVivo: false,
    fullText: 'x'.repeat(200),
    ...over,
  };
}

describe('planDeReindexado — los rechazos', () => {
  it('lo que está al día no se toca', () => {
    expect(planDeReindexado(entrada({ fila: { extractorVersion: VIGENTE, source: 'manual', providerFileId: null } }), VIGENTE))
      .toEqual({ via: 'rechazado', motivo: 'al_dia' });
  });

  it('⚠️ «al día» GANA a «staged vivo», y el orden es parte del criterio', () => {
    // Un documento que no hay que reparar no debe rechazarse con un motivo que
    // sugiere un conflicto: mandaría a alguien a resolver algo que no existe.
    expect(
      planDeReindexado(
        entrada({
          fila: { extractorVersion: VIGENTE, source: 'manual', providerFileId: null },
          hayStagedVivo: true,
        }),
        VIGENTE,
      ),
    ).toEqual({ via: 'rechazado', motivo: 'al_dia' });
  });

  it('un staged vivo bloquea el reindexado de lo atrasado', () => {
    expect(planDeReindexado(entrada({ hayStagedVivo: true }), VIGENTE))
      .toEqual({ via: 'rechazado', motivo: 'staged_vivo' });
  });

  it('⚠️ sin original y CON tablas se rechaza: re-trocear las perdería', () => {
    expect(planDeReindexado(entrada({ tieneChunksTabulares: true }), VIGENTE))
      .toEqual({ via: 'rechazado', motivo: 'sin_original_con_tablas' });
  });

  it('sin original y sin texto suficiente, tampoco', () => {
    for (const fullText of [null, '', '   ', 'x'.repeat(49)]) {
      expect(planDeReindexado(entrada({ fullText }), VIGENTE))
        .toEqual({ via: 'rechazado', motivo: 'sin_texto' });
    }
  });
});

describe('planDeReindexado — las dos vías', () => {
  it('con original recuperable se reprocesa desde el fichero', () => {
    expect(
      planDeReindexado(
        entrada({ fila: { extractorVersion: 2, source: 'google_drive', providerFileId: 'abc' } }),
        VIGENTE,
      ),
    ).toEqual({ via: 'reprocesar' });
  });

  it('⚠️ reprocesar NO mira las tablas: nace del binario y las reconstruye', () => {
    expect(
      planDeReindexado(
        entrada({
          fila: { extractorVersion: 2, source: 'google_drive', providerFileId: 'abc' },
          tieneChunksTabulares: true,
        }),
        VIGENTE,
      ),
    ).toEqual({ via: 'reprocesar' });
  });

  it('prosa manual atrasada se re-trocea desde el texto guardado', () => {
    expect(planDeReindexado(entrada(), VIGENTE)).toEqual({ via: 'retrocear' });
  });

  it('el borde del mínimo de texto: 50 caracteres bastan', () => {
    expect(planDeReindexado(entrada({ fullText: 'x'.repeat(50) }), VIGENTE))
      .toEqual({ via: 'retrocear' });
  });
});

describe('esReparacionCompleta', () => {
  it('solo reprocesar repara del todo; re-trocear es media reparación', () => {
    expect(esReparacionCompleta({ via: 'reprocesar' })).toBe(true);
    expect(esReparacionCompleta({ via: 'retrocear' })).toBe(false);
    expect(esReparacionCompleta({ via: 'rechazado', motivo: 'al_dia' })).toBe(false);
  });
});
