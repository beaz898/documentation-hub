import { describe, expect, it } from 'vitest';
import { lecturaDeLaPareja } from './judge';
import type { StoredChunk } from '@/lib/read-chunks';
import type { DocumentFragment } from './types';

/**
 * B.295 (29/09/2026): qué leyó el juez de una pareja, con la tijera vieja. La
 * decisión del candidato (`dejoFuera`) es «¿quedó algún trozo suyo sin enviar?»,
 * no una resta de caracteres (Contrato_Contadores §2-quater).
 */

const prosa = (chunkIndex: number, text: string): StoredChunk =>
  ({ chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
const frag = (chunkIndex: number, text: string, isContext = false): DocumentFragment =>
  ({ text, documentId: 'c1', documentName: 'C.docx', source: 'manual', score: 0.9, chunkIndex, ...(isContext ? { isContext } : {}) });
const ANALIZADO = { caracteres: 14704, mostrados: 6000, dejoFuera: true };
const lectura = (chunks: StoredChunk[], enviados: DocumentFragment[], texto = 'bloque') =>
  lecturaDeLaPareja({ documentId: 'c1', documentName: 'C.docx', analizado: ANALIZADO, candidatoChunks: chunks, fragmentosEnviados: enviados, textoEnviado: texto });

describe('lecturaDeLaPareja, tijera vieja', () => {
  it('régimen tijera_vieja, sin presupuesto, y el lado analizado tal cual llega', () => {
    const l = lectura([prosa(0, 'a')], [frag(0, 'a')]);
    expect(l.regimen).toBe('tijera_vieja');
    expect(l.presupuesto).toBeNull();
    expect(l.analizado).toEqual(ANALIZADO);
  });
  it('todos los trozos enviados: dejoFuera false; mostrados es el bloque del prompt', () => {
    const l = lectura([prosa(0, 'aaa'), prosa(1, 'bbb')], [frag(0, 'aaa'), frag(1, 'bbb')], 'x'.repeat(42));
    expect(l.candidato.dejoFuera).toBe(false);
    expect(l.candidato.mostrados).toBe(42);
    expect(l.candidato.caracteres).toBe('aaa\n\nbbb'.length);
  });
  it('CASO DECISIVO: un trozo sin enviar → dejoFuera true', () => {
    expect(lectura([prosa(0, 'aaa'), prosa(1, 'bbb')], [frag(0, 'aaa')]).candidato.dejoFuera).toBe(true);
  });
  it('las filas colapsadas en una línea de contexto cuentan como fuera: el juez no las leyó', () => {
    expect(lectura([prosa(0, 'aaa'), prosa(1, 'bbb')], [frag(0, 'aaa'), frag(1, 'línea', true)]).candidato.dejoFuera).toBe(true);
  });
  it('sin trozos: caracteres y dejoFuera null, NUNCA 0 ni false — no consta', () => {
    const l = lectura([], [frag(0, 'aaa')]);
    expect(l.candidato.caracteres).toBeNull();
    expect(l.candidato.dejoFuera).toBeNull();
  });
});
