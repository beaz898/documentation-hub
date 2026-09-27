import { describe, it, expect } from 'vitest';
import { falsosPosiblesPorPasada, umbralesQueNoPuedenFallar } from './umbrales-que-pueden-fallar.mjs';

const cita = d => ({ literal: d, discriminante: d });
const falso = id => ({ id, patronDeF22: 'p', cuentaComoFallo: true, citaEnElAnalizado: cita('a' + id), citaEnElCorpus: cita('b' + id) });
const esperado = (id, extra = {}) => ({ id, citaEnElAnalizado: cita('a' + id), citaEnElCorpus: cita('b' + id), ...extra });
const caso = (over = {}) => ({ id: 'X', corpusExacto: ['B'], debenSalir: [], noDebenSalir: [], umbralDeAlarma: {}, ...over });
const t = c => umbralesQueNoPuedenFallar(c).join('\n');

describe('el techo de falsos, contra los falsos que caben por pasada', () => {
  it('N6: techo 5 con un solo falso contable no puede saltar; techo 0, sí', () => {
    const c = caso({ noDebenSalir: [falso('F')], umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: 5 }, debenSalir: [esperado('A')] });
    expect(t(c)).toContain('como mucho caben 1 falso(s)');
    c.umbralDeAlarma.maximoDeFalsosConfirmados = 0;
    expect(t(c)).not.toContain('falso(s)');
  });
  it('el borde: techo igual a los posibles no salta; uno menos, sí', () => {
    const c = caso({ noDebenSalir: [falso('F'), falso('G')], debenSalir: [esperado('A')], umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: 2 } });
    expect(t(c)).toContain('caben 2');
    c.umbralDeAlarma.maximoDeFalsosConfirmados = 1;
    expect(t(c)).toBe('');
  });
  it('una regla mecánica no tiene tope; una no mecánica o un falso que no cuenta no suman', () => {
    expect(falsosPosiblesPorPasada(caso({ noDebenSalir: [{ id: 'R', regla: 'TODO_HALLAZGO_DE_TIPO_CONTRADICCION' }] }))).toBe(Infinity);
    expect(falsosPosiblesPorPasada(caso({ noDebenSalir: [{ id: 'R', regla: 'prosa' }, { ...falso('F'), cuentaComoFallo: false }] }))).toBe(0);
  });
});

describe('el mínimo de aciertos', () => {
  it('0 con esperados que cuentan: la cobertura no puede fallar; 1, sí', () => {
    const c = caso({ debenSalir: [esperado('A')], noDebenSalir: [{ id: 'R', regla: 'TODO_HALLAZGO_DE_TIPO_CONTRADICCION' }], umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 } });
    expect(t(c)).toContain('la mitad de cobertura no puede fallar');
    c.umbralDeAlarma.minimoDeAciertos = 1;
    expect(t(c)).toBe('');
  });
  it('0 sin esperados (un caso de precisión, N2) no se canta', () => {
    const c = caso({ noDebenSalir: [{ id: 'R', regla: 'TODO_HALLAZGO_DE_TIPO_CONTRADICCION' }], umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 } });
    expect(t(c)).toBe('');
  });
  it('una base estable-acierto declarada hace que el caso pueda fallar', () => {
    const c = caso({ debenSalir: [esperado('A', { estabilidadDeBase: 'estable-acierto' })], umbralDeAlarma: { minimoDeAciertos: 0 } });
    expect(t(c)).not.toContain('NINGÚN umbral');
  });
});

describe('el caso entero', () => {
  it('P1: nada puede fallar → se canta que su verde no mide nada', () => {
    const c = caso({ debenSalir: [esperado('A')], umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 } });
    expect(t(c)).toContain('NINGÚN umbral de este caso puede fallar');
  });
  it('un caso con línea de base pendiente no se canta: nunca da verde', () => {
    const c = caso({ debenSalir: [esperado('A')], umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: null, estado: 'LINEA_DE_BASE_PENDIENTE' } });
    expect(t(c)).toBe('');
  });
  it('estructurales: un mínimo en 0 no puede fallar; un techo sobre algo sin tope, sí', () => {
    const c = caso({ esperadoEstructural: {}, umbralDeAlarma: { identicasMinimo: 0 } });
    expect(t(c)).toContain('`identicasMinimo: 0`');
    expect(t(c)).toContain('NINGÚN umbral');
    expect(t(caso({ esperadoEstructural: {}, umbralDeAlarma: { sinParejaForzadaMaximo: 0 } }))).toBe('');
  });
});
