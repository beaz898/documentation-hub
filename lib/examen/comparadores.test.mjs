import { describe, it, expect } from 'vitest';
import { encajaTabular } from './comparador-tabular.mjs';
import { marcarCaso, FALLA, PASA, SIN_VEREDICTO } from './marcador.mjs';

/** Un hallazgo del diff con la forma de `c39397e7/N1_pasada1.json`. */
const delDiff = ({ col = 'Puesto', nuevo = 'Implantólogo', viejo = 'Implantólogo / Cirujano oral', clave = 'Dr. Pablo Reyes', claveVieja = clave, por = 'estructura' } = {}) => ({
  severity: 'contradiction',
  confirmedBy: por,
  newDocSays: `${clave} | ${nuevo} | Chamberí`,
  existingDocSays: `${claveVieja} | ${viejo} | Box 1`,
  newDocRow: `[F3] ${clave} | ${nuevo} | Chamberí`,
  existingDocRow: `[F3] ${claveVieja} | ${viejo} | Box 1`,
  comparedValues: [{ column: col, newDocValue: nuevo, existingDocValue: viejo }],
});

const N1_PUESTO = {
  id: 'N1-PUESTO', persona: 'Dr. Pablo Reyes', columnaEnOposicion: 'Puesto',
  enElAnalizado: 'Implantólogo', enElCorpus: 'Implantólogo / Cirujano oral', confirmadoPorEsperado: 'estructura',
};

describe('comparador tabular — columna y valores', () => {
  it('el hallazgo de N1 en la tanda del 27/09 encaja', () => {
    expect(encajaTabular(delDiff(), N1_PUESTO)).toBe(true);
  });
  it.each([
    ['lados cambiados', delDiff({ nuevo: 'Implantólogo / Cirujano oral', viejo: 'Implantólogo' })],
    ['otra columna', delDiff({ col: 'Clínica' })],
    ['otra persona', delDiff({ clave: 'Dra. Ana Belmonte' })],
    ['la persona sólo en un lado', delDiff({ claveVieja: 'Dra. Ana Belmonte' })],
    ['confirmado por el juez', delDiff({ por: 'juicio' })],
    ['valor contenido pero no igual', delDiff({ viejo: 'Implantólogo / Cirujano' })],
    ['otro valor en el analizado', delDiff({ nuevo: 'Ortodoncista' })],
  ])('no encaja: %s', (_, h) => {
    expect(encajaTabular(h, N1_PUESTO)).toBe(false);
  });
  it('sin `confirmadoPorEsperado: estructura` no es tabular y no encaja nunca', () => {
    expect(encajaTabular(delDiff(), { ...N1_PUESTO, confirmadoPorEsperado: undefined })).toBe(false);
  });
  it('N1 con ese hallazgo en sus cinco pasadas: PASA con 1 acierto (esta mañana salió FALLA)', () => {
    const caso = { id: 'N1', pasadas: 5, debenSalir: [N1_PUESTO], noDebenSalir: [], umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: 2 } };
    const pasadas = [1, 2, 3, 4, 5].map(pasada => ({ pasada, hallazgos: [delDiff()] }));
    const m = marcarCaso(caso, pasadas);
    expect(m.estado).toBe(PASA);
    expect(m.totalAciertos).toBe(1);
  });
});

// ── estructural ────────────────────────────────────────────────────────────

const ESPERADO = {
  identicas: ['A-01'],
  discrepantes: [
    { codigo: 'A-02', columna: 'Precio', enElAnalizado: '25', enElCorpus: '30' },
    { codigo: 'A-03', columna: 'Clínica', enElAnalizado: 'Retiro', enElCorpus: 'Salamanca' },
  ],
  soloEnElAnalizado: ['A-04'],
  soloEnElCorpus: ['B-01'],
};
const P3 = {
  id: 'P3', pasadas: 1, debenSalir: [], noDebenSalir: [], esperadoEstructural: ESPERADO,
  umbralDeAlarma: { identicasMinimo: 1, discrepantesConColumnaCorrectaMinimo: 2, sinParejaForzadaMaximo: 0, confirmadosPorEstructuraDelJuezMaximo: 0 },
};
const fila = (codigo, col, a, b, codigoB = codigo) =>
  delDiff({ col, nuevo: a, viejo: b, clave: codigo, claveVieja: codigoB });
const buena = () => ({
  pasada: 1,
  hallazgos: [fila('A-02', 'Precio', '25', '30'), fila('A-03', 'Clínica', 'Retiro', 'Salamanca')],
  tablas: [{ identicas: 1 }],
  contadores: { 'verificador.confirmados_por_estructura': 0 },
});

describe('comparador estructural — los cuatro umbrales de P3', () => {
  it('control positivo: la pasada esperada PASA', () => {
    const m = marcarCaso(P3, [buena()]);
    expect(m.estado).toBe(PASA);
    expect(m.estructura).toEqual({ identicas: 1, discrepantes: 2, forzadas: 0, delJuez: 0 });
  });
  it('las discrepantes que el estructural ya clasificó no salen como extras; una que no, sí', () => {
    expect(marcarCaso(P3, [buena()]).marcas[0].extras).toBe(0);
    const p = { ...buena(), hallazgos: [...buena().hallazgos, fila('A-01', 'Precio', '1', '2')] };
    expect(marcarCaso(P3, [p]).marcas[0].extras).toBe(1);
  });
  it('sin hallazgos (lo que esta mañana salió PASA) FALLA', () => {
    const p = { ...buena(), hallazgos: [] };
    expect(marcarCaso(P3, [p]).estado).toBe(FALLA);
  });
  it('menos idénticas que el mínimo: FALLA', () => {
    expect(marcarCaso(P3, [{ ...buena(), tablas: [{ identicas: 0 }] }]).fallos.join()).toContain('idénticas');
  });
  it('columna equivocada: no cuenta como discrepante correcta', () => {
    const p = { ...buena(), hallazgos: [fila('A-02', 'Duración', '25', '30'), fila('A-03', 'Clínica', 'Retiro', 'Salamanca')] };
    expect(marcarCaso(P3, [p]).fallos.join()).toContain('columna y valores');
  });
  it.each([
    ['dos códigos distintos', fila('A-02', 'Precio', '25', '30', 'A-03')],
    ['una fila sólo del analizado', fila('A-04', 'Precio', '1', '2')],
    ['un código que no se encuentra', fila('Z-99', 'Precio', '1', '2')],
  ])('pareja forzada: %s', (_, h) => {
    const p = { ...buena(), hallazgos: [...buena().hallazgos, h] };
    expect(marcarCaso(P3, [p]).fallos.join()).toContain('parejas forzadas');
  });
  it('el centinela del juez en 1: FALLA', () => {
    const p = { ...buena(), contadores: { 'verificador.confirmados_por_estructura': 1 } };
    expect(marcarCaso(P3, [p]).fallos.join()).toContain('del juez');
  });
  it('vale la PEOR pasada, no la mejor', () => {
    const caso = { ...P3, pasadas: 2 };
    expect(marcarCaso(caso, [buena(), { ...buena(), pasada: 2, hallazgos: [] }]).estado).toBe(FALLA);
    expect(marcarCaso(caso, [buena(), { ...buena(), pasada: 2, tablas: [{ identicas: 0 }] }]).estado).toBe(FALLA);
  });
  it.each([
    ['sin tableDiffs', { tablas: undefined }],
    ['sin el contador', { contadores: {} }],
  ])('%s la pasada no se mide: no es un cero', (_, cambio) => {
    const m = marcarCaso(P3, [{ ...buena(), ...cambio }]);
    expect(m.estado).toBe(SIN_VEREDICTO);
  });
});
