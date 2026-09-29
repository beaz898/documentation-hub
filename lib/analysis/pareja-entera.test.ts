import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  interruptorParejaEntera, leerLaPareja, lineaDeLaLectura, parejaEnteraEnEsteModo,
  PRESUPUESTO_PAREJA_CARACTERES, SUELO_DEL_CANDIDATO,
} from './judge';
import { presupuestoPorCandidato } from './retrieval';
import type { StoredChunk } from '@/lib/read-chunks';
import type { DocumentFragment } from './types';

/**
 * ESCALÓN 1 (B.295, 29/09/2026): la puerta del juez con el presupuesto por
 * PAREJA. Casos decisivos: el borde del presupuesto (cabe entera / corte honesto),
 * el corte honesto por posición con el suelo del candidato, y el interruptor que
 * sólo se enciende con '1'.
 */

const VARIABLE = 'ANALYSIS_PAREJA_ENTERA';
const original = process.env[VARIABLE];
afterEach(() => {
  if (original === undefined) delete process.env[VARIABLE]; else process.env[VARIABLE] = original;
  vi.restoreAllMocks();
});

const prosa = (chunkIndex: number, text: string): StoredChunk =>
  ({ chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
const frag = (chunkIndex: number, text: string): DocumentFragment =>
  ({ text, documentId: 'c1', documentName: 'C.docx', source: 'manual', score: 0.9, chunkIndex });
const VIEJO = { texto: 'recorte-viejo', lado: { caracteres: 99, mostrados: 13, dejoFuera: true } };

/**
 * Una pareja: el analizado de `nA` caracteres y un candidato de `nC` en dos
 * trozos, de los que la relevancia envió sólo el primero (como hace hoy).
 * Entero, el candidato se renderiza como «trozo1\n\ntrozo2»: `nC` justos.
 */
function pareja(nA: number, nC: number, parejaEntera = true, extra: Partial<Parameters<typeof leerLaPareja>[0]> = {}) {
  const mitad = Math.floor((nC - 2) / 2);
  const t0 = 'c'.repeat(mitad);
  const t1 = 'd'.repeat(nC - 2 - mitad);
  return leerLaPareja({
    parejaEntera, documentId: 'c1', documentName: 'C.docx',
    analizadoCompleto: 'a'.repeat(nA), analizadoConTrozos: true, analizadoViejo: VIEJO,
    candidatoChunks: [prosa(0, t0), prosa(1, t1)], fragmentosEnviados: [frag(0, t0)],
    bloqueRelevancia: 'bloque-por-relevancia', ...extra,
  });
}

describe('el presupuesto por pareja', () => {
  it('10.000 tokens = 40.000 caracteres, y el suelo del candidato es lo que recibe hoy', () => {
    expect(PRESUPUESTO_PAREJA_CARACTERES).toBe(40_000);
    expect(SUELO_DEL_CANDIDATO).toBe(presupuestoPorCandidato(false));
  });
});

describe('la puerta del juez', () => {
  it('apagado: la tijera vieja, con sus textos de siempre', () => {
    const r = pareja(14704, 9817, false);
    expect(r.textoAnalizado).toBe('recorte-viejo');
    expect(r.bloqueCandidato).toBe('bloque-por-relevancia');
    expect(r.lectura.regimen).toBe('tijera_vieja');
    expect(r.lectura.presupuesto).toBeNull();
  });
  it('la pareja NOR-11/CLI-13 (14.704 + 9.817) cabe: los dos lados ENTEROS', () => {
    const r = pareja(14704, 9817);
    expect(r.lectura.regimen).toBe('pareja_entera');
    expect(r.textoAnalizado.length).toBe(14704);
    expect(r.bloqueCandidato.length).toBe(9817);
    expect(r.lectura.analizado).toEqual({ caracteres: 14704, mostrados: 14704, dejoFuera: false });
    expect(r.lectura.candidato).toEqual({ caracteres: 9817, mostrados: 9817, dejoFuera: false });
    expect(r.lectura.presupuesto).toBe(40_000);
  });
  it('CASO DECISIVO del borde: 40.000 justos caben; uno más, corte honesto', () => {
    expect(pareja(30_000, 10_000).lectura.regimen).toBe('pareja_entera');
    expect(pareja(30_001, 10_000).lectura.regimen).toBe('corte_honesto');
  });
  it('corte honesto: el analizado por posición hasta 37.000, y el candidato por relevancia', () => {
    const r = pareja(66_669, 5_000);
    expect(r.lectura.regimen).toBe('corte_honesto');
    expect(r.textoAnalizado).toBe('a'.repeat(PRESUPUESTO_PAREJA_CARACTERES - SUELO_DEL_CANDIDATO));
    expect(r.bloqueCandidato).toBe('bloque-por-relevancia');
    expect(r.lectura.analizado).toEqual({ caracteres: 66_669, mostrados: 37_000, dejoFuera: true });
    expect(r.lectura.candidato.dejoFuera).toBe(true);
  });
  it('corte honesto con el analizado corto: no se le corta, y lo que falta es del candidato', () => {
    const r = pareja(20_000, 30_000);
    expect(r.lectura.regimen).toBe('corte_honesto');
    expect(r.lectura.analizado.dejoFuera).toBe(false);
    expect(r.lectura.candidato.dejoFuera).toBe(true);
  });
  it('un lado sin trozos: tijera vieja aunque esté encendido (no hay una sola fuente)', () => {
    expect(pareja(100, 100, true, { analizadoConTrozos: false }).lectura.regimen).toBe('tijera_vieja');
    expect(pareja(100, 100, true, { candidatoChunks: [] }).lectura.regimen).toBe('tijera_vieja');
  });
  it('la línea del log sale de la misma lectura', () => {
    const r = pareja(14704, 9817);
    expect(lineaDeLaLectura('CLI-13.docx', r.lectura))
      .toBe('[judge] "CLI-13.docx": pareja pareja_entera — analizado 14704/14704, candidato 9817/9817, presupuesto 40000');
  });
});

describe('el interruptor, fallando cerrado', () => {
  it('ausente: apagado y en silencio', () => {
    delete process.env[VARIABLE];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(interruptorParejaEntera()).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
  it("sólo '1' lo enciende", () => {
    process.env[VARIABLE] = '1';
    expect(interruptorParejaEntera()).toBe(true);
  });
  it('C3: en EXHAUSTIVO no se enciende nunca, ni lee la variable', () => {
    process.env[VARIABLE] = '1';
    expect(parejaEnteraEnEsteModo(true)).toBe(false);
    expect(parejaEnteraEnEsteModo(false)).toBe(true);
    process.env[VARIABLE] = 'mal';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parejaEnteraEnEsteModo(true)).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
  it.each(['true', 'on', ' 1', '0', ''])('«%s»: apagado, y lo dice en el log', v => {
    process.env[VARIABLE] = v;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(interruptorParejaEntera()).toBe(false);
    expect(warn.mock.calls[0][0]).toContain('se queda APAGADO');
  });
});
