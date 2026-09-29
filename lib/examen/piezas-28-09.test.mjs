import { describe, it, expect } from 'vitest';
import { marcarCaso, marcarPasada, FALLA, PASA, SIN_VEREDICTO } from './marcador.mjs';
import { umbralesQueNoPuedenFallar, umbralesQueNoPuedenPasar, falsosPosiblesPorPasada } from './umbrales-que-pueden-fallar.mjs';
import { validarLoQueElMarcadorLee } from './validar-lectura.mjs';
import { lineasDelVeredicto } from './veredicto.mjs';

/** Las tres piezas del marcador aprobadas el 28/09, y «puede pasar». */

const cita = d => ({ literal: d, discriminante: d });
const esperado = (id, extra = {}) => ({ id, citaEnElAnalizado: cita(`a-${id}`), citaEnElCorpus: cita(`b-${id}`), ...extra });
const falso = (id, extra = {}) => ({ id, cuentaComoFallo: true, citaEnElAnalizado: cita(`a-${id}`), citaEnElCorpus: cita(`b-${id}`), ...extra });
const contr = (id, topic = id) => ({ severity: 'contradiction', topic, newDocSays: `a-${id}`, existingDocSays: `b-${id}` });
const cincoPasadas = porPasada => [1, 2, 3, 4, 5].map(p => ({ pasada: p, hallazgos: porPasada(p) }));
// 29/09/2026: el seguimiento declara clase y motivo por mitad.
const seg = (...mitades) => Object.fromEntries(mitades.map(m => [m, { clase: 'NO_PUEDE_FALLAR', motivo: 'prueba' }]));
const caso = over => ({ id: 'X', fichero: 'X.mjs', pasadas: 5, corpusExacto: ['B'], debenSalir: [], noDebenSalir: [], umbralDeAlarma: {}, ...over });

// ── 1 · extras de contradicción como falsos, con auditoría completa ─────────

const P2 = over => caso({
  debenSalir: [esperado('P2-1')],
  noDebenSalir: [{ id: 'P2-NO-1', ancla: 'cierra el contenedor', cuentaComoFallo: false }],
  extras: 'FALSO_POSITIVO', auditoriaCompleta: { fuente: 'Casos_Harness.md:272' },
  umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: 0 }, ...over,
});

describe('extras de contradicción como falsos', () => {
  it('la «Fecha de última revisión» de la pasada 1 de ayer da FALLA, y el informe la nombra', () => {
    const pasadas = cincoPasadas(p => [contr('P2-1'), ...(p === 1 ? [contr('fecha', 'Fecha de última revisión')] : [])]);
    const m = marcarCaso(P2(), pasadas);
    expect(m.estado).toBe(FALLA);
    const t = lineasDelVeredicto([P2()], pasadas.map(p => ({ casoId: 'X', pasada: p.pasada, cuerpo: { analisis: { discrepancies: p.hallazgos, overlaps: [] } } }))).join('\n');
    expect(t).toContain('contado como falso (auditoría completa): «Fecha de última revisión» — pasada(s) 1');
  });
  it('sin `auditoriaCompleta.fuente`, el mismo extra no cuenta', () => {
    const c = P2({ auditoriaCompleta: undefined });
    expect(marcarPasada(c, { pasada: 1, hallazgos: [contr('fecha')] }).falsos).toEqual([]);
  });
  it('lo ambiguo declarado (P2-NO-1) lo reclama su ancla y no se cuenta', () => {
    const h = { severity: 'contradiction', topic: 'quién', newDocSays: 'el auxiliar cierra el contenedor', existingDocSays: 'x' };
    expect(marcarPasada(P2(), { pasada: 1, hallazgos: [h] }).falsos).toEqual([]);
  });
  it('un solapamiento o un duplicado no es un falso aunque la auditoría sea completa (B.269)', () => {
    const m = marcarPasada(P2(), { pasada: 1, hallazgos: [], solapamientos: [{ existingDocument: 'B', overlapPercent: 93 }] });
    expect(m.falsos).toEqual([]);
    expect(m.extras).toBe(1);
  });
  it('el validador exige la fuente, y una auditoría sin extras-como-falsos no la lee nadie', () => {
    expect(validarLoQueElMarcadorLee([P2({ auditoriaCompleta: undefined })]).join()).toContain('sin `auditoriaCompleta.fuente`');
    expect(validarLoQueElMarcadorLee([P2({ extras: 'PENDIENTE_DE_ETIQUETA' })]).join()).toContain('la auditoría no la lee nadie');
    expect(validarLoQueElMarcadorLee([P2()])).toEqual([]);
  });
});

// ── 2 · SEGUIMIENTO ─────────────────────────────────────────────────────────

describe('SEGUIMIENTO', () => {
  it('las dos mitades: SIN_VEREDICTO en vez de un PASA vacío (N6)', () => {
    const c = caso({ debenSalir: [esperado('A')], umbralDeAlarma: { seguimiento: seg('cobertura', 'precision') } });
    const m = marcarCaso(c, cincoPasadas(() => []));
    expect(m.estado).toBe(SIN_VEREDICTO);
    expect(m.razones.join()).toContain('SEGUIMIENTO');
  });
  it('sólo cobertura: la precisión SÍ juzga (P1) — un falso da FALLA; sin falsos, PASA', () => {
    const c = caso({ debenSalir: [esperado('A')], noDebenSalir: [falso('F')], umbralDeAlarma: { seguimiento: seg('cobertura'), maximoDeFalsosConfirmados: 0 } });
    expect(marcarCaso(c, cincoPasadas(p => (p === 2 ? [contr('F')] : []))).estado).toBe(FALLA);
    const m = marcarCaso(c, cincoPasadas(() => []));
    expect(m.estado).toBe(PASA);
    expect(m.seguimiento).toEqual(['cobertura en SEGUIMIENTO (NO_PUEDE_FALLAR): mide y no juzga']);
  });
  it('sólo precisión: sus techos no juzgan aunque vengan escritos (el marcador no se fía del validador)', () => {
    const c = caso({
      debenSalir: [esperado('A')],
      noDebenSalir: [falso('F', { frecuenciaMaxima: { apariciones: 0, deCada: 5 } })],
      umbralDeAlarma: { seguimiento: seg('precision'), minimoDeAciertos: 1, maximoDeFalsosConfirmados: 0 },
    });
    expect(marcarCaso(c, cincoPasadas(() => [contr('A'), contr('F')])).estado).toBe(PASA);
  });
  it('en seguimiento, un 0/5 de cobertura NO es rojo', () => {
    const c = caso({ debenSalir: [esperado('A', { estabilidadDeBase: 'estable-acierto' })], umbralDeAlarma: { seguimiento: seg('cobertura') } });
    expect(marcarCaso(c, cincoPasadas(() => [])).estado).toBe(PASA);
  });
  it('el validador: una mitad en seguimiento no puede traer su umbral', () => {
    const c = caso({ debenSalir: [esperado('A')], umbralDeAlarma: { seguimiento: seg('cobertura'), minimoDeAciertos: 0 } });
    expect(validarLoQueElMarcadorLee([c]).join()).toContain('una de las dos cosas miente');
    const d = caso({ noDebenSalir: [falso('F', { frecuenciaMaxima: { apariciones: 1, deCada: 5 } })], umbralDeAlarma: { seguimiento: seg('precision') } });
    expect(validarLoQueElMarcadorLee([d]).join()).toContain('una de las dos cosas miente');
  });
});

// ── 3 · techo por frecuencia de un falso ────────────────────────────────────

describe('frecuenciaMaxima', () => {
  const N1 = () => caso({
    debenSalir: [esperado('PUESTO')],
    noDebenSalir: [falso('BELMONTE', { frecuenciaMaxima: { apariciones: 1, deCada: 5 } })],
    umbralDeAlarma: { minimoDeAciertos: 1 },
  });
  it('el borde: Belmonte en 1/5 pasa, en 2/5 falla', () => {
    const en = k => cincoPasadas(p => [contr('PUESTO'), ...(p <= k ? [contr('BELMONTE')] : [])]);
    expect(marcarCaso(N1(), en(1)).estado).toBe(PASA);
    const m = marcarCaso(N1(), en(2));
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('BELMONTE aparece en 2/5 pasadas y su techo es 1 de cada 5');
  });
  it('escala con las pasadas: 2 de 10 pasa, 3 de 10 falla', () => {
    const c = { ...N1(), pasadas: 10 };
    const en = k => Array.from({ length: 10 }, (_, i) => ({ pasada: i + 1, hallazgos: [contr('PUESTO'), ...(i < k ? [contr('BELMONTE')] : [])] }));
    expect(marcarCaso(c, en(2)).estado).toBe(PASA);
    expect(marcarCaso(c, en(3)).estado).toBe(FALLA);
  });
  it('mal formada: el validador la caza', () => {
    const c = caso({ noDebenSalir: [falso('F', { frecuenciaMaxima: { apariciones: 1 } })] });
    expect(validarLoQueElMarcadorLee([c]).join()).toContain('`frecuenciaMaxima` tiene que ser');
  });
});

// ── puede fallar / puede pasar, con las piezas nuevas ───────────────────────

describe('puede fallar y puede pasar', () => {
  it('extras como falsos: los falsos posibles no tienen tope', () => {
    expect(falsosPosiblesPorPasada(P2())).toBe(Infinity);
  });
  it('techo por frecuencia 1 de 5 puede fallar; 5 de 5, no', () => {
    const c = caso({ noDebenSalir: [falso('F', { frecuenciaMaxima: { apariciones: 1, deCada: 5 } })], umbralDeAlarma: {} });
    expect(umbralesQueNoPuedenFallar(c)).toEqual([]);
    c.noDebenSalir[0].frecuenciaMaxima = { apariciones: 5, deCada: 5 };
    expect(umbralesQueNoPuedenFallar(c).join()).toContain('no puede saltar');
  });
  it('un caso entero en SEGUIMIENTO no se canta: nunca da verde', () => {
    expect(umbralesQueNoPuedenFallar(caso({ umbralDeAlarma: { seguimiento: seg('cobertura', 'precision') } }))).toEqual([]);
  });
  it('un mínimo mayor que los esperados emparejables no puede pasar; igual, sí', () => {
    const c = caso({ debenSalir: [esperado('A'), { id: 'B' }], umbralDeAlarma: { minimoDeAciertos: 2 } });
    expect(umbralesQueNoPuedenPasar(c).join()).toContain('no puede pasar nunca');
    c.umbralDeAlarma.minimoDeAciertos = 1;
    expect(umbralesQueNoPuedenPasar(c)).toEqual([]);
  });
  it('un mínimo estructural mayor que las filas esperadas no puede pasar', () => {
    const c = caso({ esperadoEstructural: { identicas: ['A'], discrepantes: [] }, umbralDeAlarma: { identicasMinimo: 2 } });
    expect(umbralesQueNoPuedenPasar(c).join()).toContain('`identicasMinimo: 2` y el caso sólo espera 1');
  });
});
