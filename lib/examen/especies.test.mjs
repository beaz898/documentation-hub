import { describe, it, expect } from 'vitest';
import { encajaFilaPorJuicio } from './comparador-tabular.mjs';
import { marcarPasada, marcarCaso, PASA, FALLA } from './marcador.mjs';
import { lineasDeExtras, TEXTOS_DE_EXTRAS_MAXIMO } from './veredicto.mjs';

// ── P4: la fila, juzgada por el juez ────────────────────────────────────────

/** La forma de `c39397e7/P4_pasada1.json`. */
const turno = (over = {}) => ({
  severity: 'contradiction', confirmedBy: 'juicio', topic: 'Turno de Dra. Ana Belmonte',
  newDocSays: 'Dra. Ana Belmonte | Chamberí | Endodoncia | Mañana | 32',
  existingDocSays: 'Dra. Ana Belmonte | Chamberí | Endodoncia | Tarde | 32',
  ...over,
});
const BELMONTE = { id: 'P4-BELMONTE', persona: 'Dra. Ana Belmonte', enElAnalizado: 'Mañana', enElCorpus: 'Tarde', confirmadoPorEsperado: 'juicio' };

describe('fila por juicio', () => {
  it('el hallazgo de P4 en la tanda del 27/09 encaja, y con los lados cambiados también', () => {
    expect(encajaFilaPorJuicio(turno(), BELMONTE)).toBe(true);
    const h = turno();
    expect(encajaFilaPorJuicio({ ...h, newDocSays: h.existingDocSays, existingDocSays: h.newDocSays }, BELMONTE)).toBe(true);
  });
  it.each([
    ['otra persona', turno({ newDocSays: 'Dr. Carlos Medina | Retiro | Cirugía | Mañana | 44' })],
    ['los dos valores en la misma fila', turno({ existingDocSays: 'Dra. Ana Belmonte | Chamberí | Endodoncia | Mañana | 32' })],
    ['confirmado por estructura', turno({ confirmedBy: 'estructura' })],
    ['un valor que sólo CONTIENE el esperado', turno({ newDocSays: 'Dra. Ana Belmonte | Chamberí | Endodoncia | Mañana y tarde | 32' })],
  ])('no encaja: %s', (_, h) => {
    expect(encajaFilaPorJuicio(h, BELMONTE)).toBe(false);
  });
});

// ── N3: especies y documento ────────────────────────────────────────────────

const cita = d => ({ literal: d, discriminante: d });
const N3 = {
  id: 'N3', pasadas: 1, corpusExacto: ['RRHH-05.txt'],
  debenSalir: [{ id: 'N3-DUPLICADO', etiquetasAceptadas: ['duplicado', 'solapamiento'], citaEnElAnalizado: cita('calzado a'), citaEnElCorpus: cita('calzado b') }],
  noDebenSalir: [{ id: 'N3-CALZADO', patronDeF22: 'x', citaEnElAnalizado: cita('calzado a'), citaEnElCorpus: cita('calzado b') }],
  umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: 0 },
};
const solape = doc => ({ existingDocument: doc, overlapPercent: 65, severity: 'alta' });
const contradiccionCalzado = { severity: 'contradiction', topic: 'Calzado', newDocSays: 'calzado a', existingDocSays: 'calzado b' };

describe('solapamientos y duplicados', () => {
  it('el solapamiento con el documento del corpus es el acierto de N3 (esta mañana no se veía)', () => {
    const m = marcarPasada(N3, { pasada: 1, hallazgos: [], solapamientos: [solape('RRHH-05.txt')] });
    expect(m.aciertos).toEqual(['N3-DUPLICADO']);
    expect(m.extras).toBe(0);
  });
  it('un duplicado declarado del mismo documento también', () => {
    const m = marcarPasada(N3, { pasada: 1, hallazgos: [], duplicado: { isDuplicate: true, duplicateOf: 'RRHH-05.txt' } });
    expect(m.aciertos).toEqual(['N3-DUPLICADO']);
  });
  it('un solapamiento con OTRO documento no es el acierto: sale como extra', () => {
    const m = marcarPasada(N3, { pasada: 1, hallazgos: [], solapamientos: [solape('OTRO.txt')] });
    expect(m.aciertos).toEqual([]);
    expect(m.extrasDetalle).toEqual([{ especie: 'solapamiento', texto: 'solapamiento con OTRO.txt (65 %, alta)' }]);
  });
  it('la MISMA pareja de citas como contradicción es el falso N3-CALZADO, no el acierto', () => {
    const m = marcarPasada(N3, { pasada: 1, hallazgos: [contradiccionCalzado] });
    expect(m.aciertos).toEqual([]);
    expect(m.falsos).toEqual(['N3-CALZADO']);
  });
  it('con varios documentos en el corpus y sin `documentoEnElCorpus`, no se empareja', () => {
    const caso = { ...N3, corpusExacto: ['RRHH-05.txt', 'OTRO.txt'] };
    const m = marcarPasada(caso, { pasada: 1, hallazgos: [], solapamientos: [solape('RRHH-05.txt')] });
    expect(m.aciertos).toEqual([]);
  });
  it('la regla mecánica de N2 sólo cuenta contradicciones: un solapamiento no es un falso, es un extra', () => {
    const N2 = { id: 'N2', pasadas: 1, corpusExacto: ['X'], debenSalir: [], noDebenSalir: [{ id: 'N2-C', regla: 'TODO_HALLAZGO_DE_TIPO_CONTRADICCION' }], umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 } };
    const m = marcarCaso(N2, [{ pasada: 1, hallazgos: [], solapamientos: [solape('X')] }]);
    expect(m.estado).toBe(PASA);
    expect(m.marcas[0].extras).toBe(1);
    expect(marcarCaso(N2, [{ pasada: 1, hallazgos: [contradiccionCalzado] }]).estado).toBe(FALLA);
  });
  it('una inconsistencia menor no empareja una contradicción esperada, pero se enseña', () => {
    const m = marcarPasada(N3, { pasada: 1, hallazgos: [{ ...contradiccionCalzado, severity: 'minor_inconsistency' }] });
    expect(m.falsos).toEqual([]);
    expect(m.extrasDetalle[0].especie).toBe('inconsistencia_menor');
  });
});

// ── el informe de extras ────────────────────────────────────────────────────

const marca = (pasada, textos) => ({ pasada, ejecutada: true, extras: textos.length, extrasDetalle: textos.map(t => ({ especie: 'contradiccion', texto: t })) });

describe('extras en el informe', () => {
  it('por pasada, y con su texto y en cuántas pasadas salió', () => {
    const l = lineasDeExtras([marca(1, ['A']), marca(2, ['A', 'B'])]).join('\n');
    expect(l).toContain('p1 1 · p2 2');
    expect(l).toContain('contradiccion: A — en 2 de 2 pasadas');
    expect(l).toContain('contradiccion: B — en 1 de 2 pasadas');
  });
  it(`caso decisivo del tope: ${TEXTOS_DE_EXTRAS_MAXIMO} textos se imprimen, uno más ya no`, () => {
    const n = k => Array.from({ length: k }, (_, i) => `T${i}`);
    expect(lineasDeExtras([marca(1, n(TEXTOS_DE_EXTRAS_MAXIMO))]).join('\n')).toContain('T0 —');
    const mas = lineasDeExtras([marca(1, n(TEXTOS_DE_EXTRAS_MAXIMO + 1))]).join('\n');
    expect(mas).not.toContain('T0 —');
    expect(mas).toContain(`${TEXTOS_DE_EXTRAS_MAXIMO + 1} textos distintos; por especie: contradiccion ${TEXTOS_DE_EXTRAS_MAXIMO + 1}`);
  });
  it('cero extras se dice, no se calla', () => {
    expect(lineasDeExtras([marca(1, [])])).toEqual(['    · extras sin etiquetar: ninguno']);
  });
});
