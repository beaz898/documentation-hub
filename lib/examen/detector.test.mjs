import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { marcarPasada, marcarCaso, detectorDe } from './marcador.mjs';
import { lineasDeDetectores } from './veredicto.mjs';

/**
 * Principio del detector, FASE 1 (29/09/2026): el marcador APUNTA qué detector
 * encontró cada acierto y no decide nada con ello. Casos decisivos: el campo
 * existe, dice el detector que trae el hallazgo y no otro, y un `confirmedBy`
 * ausente queda como ausente.
 */

const cita = d => ({ literal: d, discriminante: d });
const esperado = id => ({ id, citaEnElAnalizado: cita(`a-${id}`), citaEnElCorpus: cita(`b-${id}`) });
const contr = (id, confirmedBy) => ({
  severity: 'contradiction', topic: id, newDocSays: `a-${id}`, existingDocSays: `b-${id}`,
  ...(confirmedBy === undefined ? {} : { confirmedBy }),
});
const caso = debenSalir => ({ id: 'X', pasadas: 1, corpusExacto: ['B'], debenSalir, noDebenSalir: [], umbralDeAlarma: {} });

describe('el campo del detector en cada acierto', () => {
  it('apunta el detector que trae el hallazgo: juicio, estructura, y null si no viene', () => {
    const c = caso([esperado('A'), esperado('B'), esperado('C')]);
    const m = marcarPasada(c, { pasada: 1, hallazgos: [contr('A', 'juicio'), contr('B', 'estructura'), contr('C')] });
    expect(m.detectores).toEqual({ A: 'juicio', B: 'estructura', C: null });
  });
  it('un esperado que no se acierta no tiene detector', () => {
    const m = marcarPasada(caso([esperado('A')]), { pasada: 1, hallazgos: [] });
    expect(m.detectores).toEqual({});
  });
  it('los solapamientos llevan el suyo: el estructural lo dice, el del juez no viene', () => {
    expect(detectorDe({ especie: 'solapamiento', confirmedBy: 'estructura' })).toBe('estructura');
    expect(detectorDe({ especie: 'solapamiento', confirmedBy: null })).toBe(null);
    expect(detectorDe({ especie: 'duplicado' })).toBe(null);
  });
  it('por el camino real: un solapamiento ESTRUCTURAL que empareja un esperado de documento lleva «estructura»', () => {
    const c = { ...caso([{ id: 'D', etiquetasAceptadas: ['solapamiento'] }]), corpusExacto: ['B'] };
    const conSello = marcarPasada(c, { pasada: 1, hallazgos: [], solapamientos: [{ existingDocument: 'B', overlapPercent: 90, confirmedBy: 'estructura' }] });
    expect(conSello.detectores).toEqual({ D: 'estructura' });
    const delJuez = marcarPasada(c, { pasada: 1, hallazgos: [], solapamientos: [{ existingDocument: 'B', overlapPercent: 35 }] });
    expect(delJuez.detectores).toEqual({ D: null });
  });
  it('NO cambia ningún veredicto: el mismo caso, con y sin confirmedBy, da el mismo estado', () => {
    const c = { ...caso([esperado('A')]), umbralDeAlarma: { minimoDeAciertos: 1 } };
    const con = marcarCaso(c, [{ pasada: 1, hallazgos: [contr('A', 'juicio')] }]);
    const sin = marcarCaso(c, [{ pasada: 1, hallazgos: [contr('A')] }]);
    expect(con.estado).toBe(sin.estado);
    expect(con.totalAciertos).toBe(sin.totalAciertos);
  });
  it('sobre un crudo real: N1-PUESTO en la tanda c39397e7 lo encontró la estructura', async () => {
    const { default: N1 } = await import('../../examen/casos/N1_falsos_conocidos.mjs');
    const crudo = JSON.parse(readFileSync('examen/resultados/2026-09-27_c39397e7/N1_pasada1.json', 'utf8'));
    const m = marcarPasada(N1, { pasada: 1, hallazgos: crudo.cuerpo.analisis.discrepancies });
    expect(m.detectores['N1-PUESTO']).toBe('estructura');
  });
});

describe('la línea del informe', () => {
  const marca = (pasada, aciertos, detectores) => ({ pasada, ejecutada: true, aciertos, detectores });
  it('cuenta por pasadas, y un detector ausente se imprime «desconocido»', () => {
    const c = caso([esperado('A'), esperado('B')]);
    const l = lineasDeDetectores(c, [marca(1, ['A', 'B'], { A: 'juicio', B: null }), marca(2, ['A'], { A: 'estructura' })]);
    expect(l).toEqual(['    · detector de cada acierto: A juicio 1/2, estructura 1/2 · B desconocido 1/2']);
  });
  it('sin aciertos, no hay línea', () => {
    expect(lineasDeDetectores(caso([esperado('A')]), [marca(1, [], {})])).toEqual([]);
  });
});
