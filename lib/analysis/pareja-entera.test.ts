import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  interruptorParejaEntera, leerLaPareja, lineaDeLaLectura, parejaEnteraEnEsteModo,
  PRESUPUESTO_PAREJA_CARACTERES, SUELO_DEL_ANALIZADO, recortarAnalizado,
} from './judge';
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
  it('10.000 tokens = 40.000 caracteres, y el suelo del analizado es lo que recibe hoy (6.000)', () => {
    expect(PRESUPUESTO_PAREJA_CARACTERES).toBe(40_000);
    expect(SUELO_DEL_ANALIZADO).toBe(6000);
    expect(recortarAnalizado('x'.repeat(9000), false).texto.length).toBe(SUELO_DEL_ANALIZADO);
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
  it('D-3 paso 1-2: el candidato cabe entero dejando el suelo → entero, y el analizado se lleva el resto', () => {
    const r = pareja(66_669, 5_000);
    expect(r.lectura.regimen).toBe('corte_honesto');
    expect(r.lectura.candidato).toEqual({ caracteres: 5_000, mostrados: 5_000, dejoFuera: false });
    expect(r.lectura.analizado).toEqual({ caracteres: 66_669, mostrados: 35_000, dejoFuera: true });
    expect(r.textoAnalizado).toBe('a'.repeat(35_000));
  });
  it('D-3 el borde del paso 1: con 34.000 justos el candidato entra entero y el analizado queda en su suelo', () => {
    const r = pareja(38_000, 34_000);
    expect(r.lectura.candidato.dejoFuera).toBe(false);
    expect(r.lectura.analizado.mostrados).toBe(SUELO_DEL_ANALIZADO);
    expect(pareja(38_000, 34_001).lectura.candidato.dejoFuera).toBe(true);
  });
  it('D-3 paso 3: el candidato entero no cabe ni con el suelo → su bloque por relevancia, y el analizado el resto', () => {
    const r = pareja(10_000, 36_000);
    expect(r.lectura.regimen).toBe('corte_honesto');
    expect(r.bloqueCandidato).toBe('bloque-por-relevancia');
    expect(r.lectura.candidato.dejoFuera).toBe(true);
    expect(r.lectura.analizado.dejoFuera).toBe(false);
  });
  it('D-3 el suelo del paso 3 aguanta aunque el bloque fuera enorme (hoy inalcanzable: el bloque es ≤ 3.000)', () => {
    const r = pareja(50_000, 36_000, true, { bloqueRelevancia: 'r'.repeat(35_000) });
    expect(r.lectura.analizado.mostrados).toBe(SUELO_DEL_ANALIZADO);
  });
  it('D-1: encendido y un lado sin trozos → sin_fuente_comun, leído como la tijera vieja', () => {
    const cand = pareja(100, 100, true, { candidatoChunks: [] });
    expect(cand.lectura.regimen).toBe('sin_fuente_comun');
    expect(cand.lectura.presupuesto).toBeNull();
    expect(cand.textoAnalizado).toBe('recorte-viejo');
    expect(cand.bloqueCandidato).toBe('bloque-por-relevancia');
    expect(cand.sinTrozos).toEqual({ analizado: false, candidato: true });
    const anal = pareja(100, 100, true, { analizadoConTrozos: false });
    expect(anal.lectura.regimen).toBe('sin_fuente_comun');
    expect(anal.sinTrozos).toEqual({ analizado: true, candidato: false });
  });
  it('D-1 (a): con el interruptor APAGADO, sin trozos sigue siendo tijera_vieja — sin_fuente_comun sólo existe encendido', () => {
    const r = pareja(100, 100, false, { candidatoChunks: [] });
    expect(r.lectura.regimen).toBe('tijera_vieja');
    expect(r.sinTrozos).toBeUndefined();
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

describe('EL INVARIANTE DE D-3: encendido, ningún lado recibe menos que con la tijera vieja', () => {
  /** Una pareja coherente: la tijera vieja es la de verdad (recortarAnalizado), y el
   *  candidato tiene 4 trozos de los que la relevancia envió el 0 y el 2. */
  function coherente(nA: number, nC: number, encendido: boolean, sinTrozos: 'ninguno' | 'analizado' | 'candidato') {
    // Texto que VARÍA con la posición: con 'a'.repeat, el principio y el final son
    // la misma cadena y un corte por el final pasaría por uno por posición.
    const completo = Array.from({ length: nA }, (_, i) => String.fromCharCode(97 + (i % 26))).join('');
    const viejo = recortarAnalizado(completo, false);
    const q = Math.max(1, Math.floor((nC - 6) / 4));
    const trozos = [0, 1, 2, 3].map(i => prosa(i, String(i).repeat(q)));
    return leerLaPareja({
      parejaEntera: encendido, documentId: 'c1', documentName: 'C.docx',
      analizadoCompleto: completo, analizadoConTrozos: sinTrozos !== 'analizado',
      analizadoViejo: { texto: viejo.texto, lado: { ...viejo.medida, dejoFuera: viejo.recortado } },
      candidatoChunks: sinTrozos === 'candidato' ? [] : trozos,
      fragmentosEnviados: [frag(0, trozos[0].text), frag(2, trozos[2].text)],
      bloqueRelevancia: 'bloque',
    });
  }
  const A = [100, 6_000, 6_001, 20_000, 38_000, 66_669];
  const C = [100, 3_000, 20_000, 34_000, 34_001, 36_000];
  const S = ['ninguno', 'analizado', 'candidato'] as const;
  it.each(A.flatMap(nA => C.flatMap(nC => S.map(sn => [nA, nC, sn] as const))))(
    'analizado %i · candidato %i · sin trozos: %s', (nA, nC, sn) => {
      const antes = coherente(nA, nC, false, sn);
      const ahora = coherente(nA, nC, true, sn);
      // analizado: lo enviado EMPIEZA por lo de hoy
      expect(ahora.textoAnalizado.startsWith(antes.textoAnalizado)).toBe(true);
      // candidato: representa, al menos, los trozos del bloque por relevancia
      for (const i of antes.representados) expect(ahora.representados).toContain(i);
      // y `representados` dice la verdad sobre lo ENVIADO: el bloque de relevancia
      // representa sus trozos (0 y 2); cualquier otra cosa enviada es el entero (los 4)
      expect(ahora.representados).toEqual(ahora.bloqueCandidato === 'bloque' ? [0, 2] : [0, 1, 2, 3]);
    });
});
