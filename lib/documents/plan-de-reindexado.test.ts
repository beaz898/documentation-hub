import { describe, it, expect } from 'vitest';
import { planDeReindexado, esReparacionCompleta, puedePerderEstructura } from './plan-de-reindexado';
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
    nombre: 'manual-de-calidad.docx',
    tieneChunksTabulares: false,
    tieneSegmentos: false,
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

describe('⚠️ B.191 — la guarda pregunta por TABLAS, no por trozos tabulares', () => {
  /**
   * EL CASO QUE HOY PASABA. Un Excel sin un solo trozo —los cinco de B.190—
   * atravesaba la guarda vieja porque `some()` sobre una lista vacía es
   * `false`, y la «reparación» lo dejaba convertido en prosa PARA SIEMPRE.
   */
  it('un .xlsx SIN trozos se rechaza igual', () => {
    expect(
      planDeReindexado(entrada({ nombre: 'OPE-10_tarifario.xlsx', tieneChunksTabulares: false }), VIGENTE),
    ).toEqual({ via: 'rechazado', motivo: 'sin_original_con_tablas' });
  });

  it('y un .xlsm también', () => {
    expect(
      planDeReindexado(entrada({ nombre: 'macros.xlsm', tieneChunksTabulares: false }), VIGENTE).via,
    ).toBe('rechazado');
  });

  /**
   * LA MITAD CONTRARIA, y es la que impide que el arreglo se pase de frenada:
   * los cinco de B.190 que sean PROSA tienen que seguir siendo reparables. Si
   * este caso muriera, habríamos cambiado un agujero por una puerta cerrada.
   */
  it('un documento de prosa sin trozos SIGUE siendo reparable', () => {
    expect(
      planDeReindexado(entrada({ nombre: 'protocolo.docx', tieneChunksTabulares: false }), VIGENTE),
    ).toEqual({ via: 'retrocear' });
  });

  it('la fuente vieja sigue viva: con trozos tabulares se rechaza aunque el nombre sea de prosa', () => {
    expect(
      planDeReindexado(entrada({ nombre: 'informe.pdf', tieneChunksTabulares: true }), VIGENTE).via,
    ).toBe('rechazado');
  });

  it('puedePerderEstructura: basta con que UNA de las dos fuentes diga que sí', () => {
    const sinSeg = { tieneSegmentos: false };
    expect(puedePerderEstructura({ nombre: 'a.docx', tieneChunksTabulares: false, ...sinSeg })).toBe(false);
    expect(puedePerderEstructura({ nombre: 'a.docx', tieneChunksTabulares: true, ...sinSeg })).toBe(true);
    expect(puedePerderEstructura({ nombre: 'a.xlsx', tieneChunksTabulares: false, ...sinSeg })).toBe(true);
    expect(puedePerderEstructura({ nombre: 'a.xlsx', tieneChunksTabulares: true, ...sinSeg })).toBe(true);
  });

  /**
   * ⚠️ EL LÍMITE, DECLARADO: un nombre ausente NO activa la fuente nueva. No es
   * prueba de que haya tablas, y rechazar por su falta bloquearía reparaciones
   * legítimas. La protección de esos casos viene de la otra fuente.
   */
  it('sin nombre, la guarda depende solo de los trozos', () => {
    expect(planDeReindexado(entrada({ nombre: null, tieneChunksTabulares: false }), VIGENTE).via)
      .toBe('retrocear');
    expect(planDeReindexado(entrada({ nombre: null, tieneChunksTabulares: true }), VIGENTE).via)
      .toBe('rechazado');
  });
});

describe('⚠️ F-105 — la reparación que enriquece: la guarda se relaja SOLO por segmentos', () => {
  /**
   * LA RELAJACIÓN. Un Excel con trozos tabulares y con sus segmentos guardados
   * SE REPARA: re-trocear no pierde nada porque las celdas están en los
   * segmentos y `chunkSegments` las vuelve a emitir tal cual.
   */
  it('CON segmentos, un .xlsx con trozos tabulares se repara', () => {
    expect(
      planDeReindexado(
        entrada({ nombre: 'tarifas.xlsx', tieneChunksTabulares: true, tieneSegmentos: true }),
        VIGENTE,
      ),
    ).toEqual({ via: 'retrocear' });
  });

  /**
   * ⚠️⚠️ EL CASO QUE PROTEGE, y es el 87 % del corpus hoy: SIN segmentos y con
   * tablas se sigue rechazando. Si este caso muriera, volvería B.191 — un Excel
   * convertido en prosa para siempre, sin rastro de que fue tabla.
   */
  it('SIN segmentos y con tablas se RECHAZA — por nombre y por trozos', () => {
    expect(
      planDeReindexado(
        entrada({ nombre: 'tarifas.xlsx', tieneChunksTabulares: false, tieneSegmentos: false }),
        VIGENTE,
      ),
    ).toEqual({ via: 'rechazado', motivo: 'sin_original_con_tablas' });

    expect(
      planDeReindexado(
        entrada({ nombre: 'informe.pdf', tieneChunksTabulares: true, tieneSegmentos: false }),
        VIGENTE,
      ),
    ).toEqual({ via: 'rechazado', motivo: 'sin_original_con_tablas' });
  });

  /**
   * ⚠️ Y LA CONDICIÓN ES **SOLO** LOS SEGMENTOS. Este caso existe para que nadie
   * relaje la guarda por otro motivo: ni el nombre, ni los trozos, ni nada más
   * puede abrirla. Solo tener la estructura guardada.
   */
  it('la relajación no la activa nada que no sean los segmentos', () => {
    const conTablas = { nombre: 'tarifas.xlsx', tieneChunksTabulares: true };
    expect(puedePerderEstructura({ ...conTablas, tieneSegmentos: false })).toBe(true);
    expect(puedePerderEstructura({ ...conTablas, tieneSegmentos: true })).toBe(false);

    // Y sin tablas por ninguna vía, da igual el valor: no hay nada que perder.
    const sinTablas = { nombre: 'protocolo.docx', tieneChunksTabulares: false };
    expect(puedePerderEstructura({ ...sinTablas, tieneSegmentos: false })).toBe(false);
    expect(puedePerderEstructura({ ...sinTablas, tieneSegmentos: true })).toBe(false);
  });

  it('los cinco de B.190 —prosa sin segmentos y sin trozos— siguen reparándose', () => {
    expect(
      planDeReindexado(
        entrada({ nombre: 'Pauta 5-6-25.pdf', tieneChunksTabulares: false, tieneSegmentos: false }),
        VIGENTE,
      ),
    ).toEqual({ via: 'retrocear' });
  });
});
