import { describe, it, expect } from 'vitest';
import { dondeMurio, reembolsoDelAnalisis, reembolsoDelTrabajoFallido } from './reembolso-por-etapa';
import type { UsageAccumulator } from '@/lib/observability/usage-context';

/**
 * EL REEMBOLSO POR ETAPA (B.205, decisión del 17/09/2026). Dos mutantes tienen
 * que morir en casos DISTINTOS: «devuelve siempre» cae en los que no deben
 * devolver; «no devuelve nunca», en los que sí.
 */

const SIN_GASTO: UsageAccumulator = new Map();
const CON_GASTO: UsageAccumulator = new Map([
  ['claude-haiku-4-5-20251001', { inputTokens: 1200, outputTokens: 80, cacheCreationTokens: 0, cacheReadTokens: 0 }],
]);

const analisis = (sobre: Partial<Parameters<typeof reembolsoDelAnalisis>[0]>) =>
  reembolsoDelAnalisis({
    cobroPendiente: 5,
    trabajoEncolado: false,
    analisisIniciado: true,
    terminoEnExcepcion: false,
    acumulador: SIN_GASTO,
    ...sobre,
  });

describe('dondeMurio — lo dice el acumulador, y sólo él', () => {
  it('vacío: antes del modelo', () => {
    expect(dondeMurio(SIN_GASTO)).toBe('antes_del_modelo');
  });

  it('con tokens: tras llamar al modelo', () => {
    expect(dondeMurio(CON_GASTO)).toBe('tras_llamar_al_modelo');
  });

  it('una entrada a cero no es gasto', () => {
    const cero: UsageAccumulator = new Map([
      ['x', { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 }],
    ]);
    expect(dondeMurio(cero)).toBe('antes_del_modelo');
  });
});

describe('la ruta — SE DEVUELVE TODO (los que mata «no devuelve nunca»)', () => {
  it('no se llegó a empezar: todo, salga como salga', () => {
    expect(analisis({ analisisIniciado: false, cobroPendiente: 30 })).toBe(30);
  });

  it('⚠️ empezó y lanzó ANTES de la primera llamada al modelo: todo', () => {
    expect(analisis({ terminoEnExcepcion: true, acumulador: SIN_GASTO })).toBe(5);
  });
});

describe('la ruta — NO SE DEVUELVE NADA (los que mata «devuelve siempre»)', () => {
  it('⚠️ empezó y lanzó DESPUÉS de llamar al modelo: nada', () => {
    expect(analisis({ terminoEnExcepcion: true, acumulador: CON_GASTO })).toBe(0);
  });

  it('el job exhaustivo quedó encolado: nada — lo gobierna el worker', () => {
    expect(analisis({ trabajoEncolado: true, cobroPendiente: 30, terminoEnExcepcion: true })).toBe(0);
  });

  it('se entregó sin excepción: nada', () => {
    expect(analisis({ terminoEnExcepcion: false })).toBe(0);
  });

  it('el cobro ya se devolvió por otro camino (incompleto de F-71): nada, no dos veces', () => {
    expect(analisis({ cobroPendiente: 0, analisisIniciado: false })).toBe(0);
  });
});

describe('el worker', () => {
  it('⚠️ falló antes de llamar al modelo: devuelve los 30', () => {
    expect(reembolsoDelTrabajoFallido({ cobrado: 30, yaDevuelto: false, acumulador: SIN_GASTO })).toBe(30);
  });

  it('⚠️ falló después de llamar al modelo: nada', () => {
    expect(reembolsoDelTrabajoFallido({ cobrado: 30, yaDevuelto: false, acumulador: CON_GASTO })).toBe(0);
  });

  it('⚠️ ya se devolvió dentro del try: nada, aunque el acumulador esté vacío', () => {
    // Un incompleto cuyas llamadas fallaron TODAS deja el acumulador vacío.
    // Sin la bandera, el catch devolvería una segunda vez.
    expect(reembolsoDelTrabajoFallido({ cobrado: 30, yaDevuelto: true, acumulador: SIN_GASTO })).toBe(0);
  });
});
