import { describe, expect, it } from 'vitest';
import { buildUnits, repartoDelCandidato, selectUnitsWithinBudget } from './retrieval';
import type { StoredChunk } from '@/lib/read-chunks';
import type { DocumentFragment } from './types';

/**
 * B.281 (29/09/2026): el reparto de un candidato, sobre la SELECCIÓN REAL
 * (`buildUnits` + `selectUnitsWithinBudget`). Caso decisivo: un candidato con una
 * unidad que no cabe da `dejoFuera: true`. Y los dos casos por los que «¿cortó la
 * tijera?» no se contesta con caracteres (`claude/Contrato_Contadores.md`, §2-quater).
 */

const DOC = 'doc-1';
const frag = (chunkIndex: number, text: string, score = 0.9): DocumentFragment =>
  ({ text, documentId: DOC, documentName: 'C.docx', source: 'manual', score, chunkIndex });
const prosa = (chunkIndex: number, text: string): StoredChunk =>
  ({ chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
const fila = (chunkIndex: number, text: string): StoredChunk =>
  ({ chunkIndex, chunkType: 'table_row', text, sheetName: 'H', tableId: 't1', rowIndex: chunkIndex, cells: { A: text }, columnOrder: null });
const resumen = (chunkIndex: number, text: string): StoredChunk =>
  ({ chunkIndex, chunkType: 'table_summary', text, sheetName: 'H', tableId: 't1', rowIndex: null, cells: null, columnOrder: ['A'] });

function repartir(recuperados: DocumentFragment[], docChunks: StoredChunk[], presupuesto: number) {
  const sorted = [...recuperados].sort((a, b) => b.score - a.score);
  const r = selectUnitsWithinBudget(buildUnits(sorted, docChunks), docChunks, sorted[0], new Map(), [], presupuesto);
  return repartoDelCandidato(DOC, docChunks, r);
}

const a100 = 'a'.repeat(100);
const b100 = 'b'.repeat(100);

describe('el reparto sobre la selección real', () => {
  it('CASO DECISIVO: una unidad que no cabe → dejoFuera true', () => {
    const chunks = [prosa(0, a100), prosa(1, b100)];
    const r = repartir([frag(0, a100, 0.9), frag(1, b100, 0.8)], chunks, 150);
    expect(r).toEqual({ documentId: DOC, caracteres: 200, mostrados: 100, dejoFuera: true });
  });
  it('con presupuesto para todo, dejoFuera false', () => {
    const chunks = [prosa(0, a100), prosa(1, b100)];
    expect(repartir([frag(0, a100, 0.9), frag(1, b100, 0.8)], chunks, 300))
      .toEqual({ documentId: DOC, caracteres: 200, mostrados: 200, dejoFuera: false });
  });
  it('sin trozos (antes de F-20): caracteres null, NUNCA 0 — «no se sabe» no es «vacío»', () => {
    const r = repartir([frag(0, a100)], [], 3000);
    expect(r.caracteres).toBeNull();
    expect(r.mostrados).toBe(100);
  });
  it('caso 1 de la doctrina: la tabla que cabe entera muestra MÁS de lo recuperado, y no cortó nada', () => {
    const chunks = [resumen(10, 'resumen'), fila(11, 'f1'.repeat(20)), fila(12, 'f2'.repeat(20)), fila(13, 'f3'.repeat(20))];
    const recuperada = frag(11, 'f1'.repeat(20));
    const r = repartir([recuperada], chunks, 3000);
    expect(r.mostrados).toBeGreaterThan(recuperada.text.length);
    expect(r.dejoFuera).toBe(false);
  });
});

describe('caso 2 de la doctrina: el colapso muestra MENOS sin perder nada', () => {
  it('filas idénticas colapsadas en una línea corta, ninguna fuera: dejoFuera false', () => {
    // La selección tal como la deja el nivel 2 con colapso (retrieval.ts, `assembleTable`):
    // una línea de contexto en lugar de las idénticas, `rowsLeftOut` 0 (F-74).
    const r = repartoDelCandidato(DOC, [fila(1, 'x'.repeat(300)), fila(2, 'y'.repeat(300))],
      { selected: [frag(0, 'línea de contexto')], unitsOut: 0, tableLog: [{ rowsLeftOut: 0 }] });
    expect(r.mostrados).toBeLessThan(600);
    expect(r.dejoFuera).toBe(false);
  });
  it('y una fila recuperada fuera por tamaño sí cuenta', () => {
    const r = repartoDelCandidato(DOC, [], { selected: [], unitsOut: 0, tableLog: [{ rowsLeftOut: 1 }] });
    expect(r.dejoFuera).toBe(true);
  });
});
