import { describe, expect, it, vi } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import type { StoredChunk } from '@/lib/read-chunks';
import type { JudgmentEvidence } from './judge';
import { applyCascadeToCandidate } from './pipeline';
import { RAMA_DE_LAS_REGLAS, marcaDeConflictoNormativo } from './rama-de-las-reglas';
import type { DocumentJudgment } from './types';
import { verifyFindings, type FindingToVerify } from './verify-findings';

/**
 * LA RAMA DE LAS REGLAS DEL VERIFICADOR (3.4, fase 3 · 26/10/2026). El modelo está simulado: nada sale a la red.
 *   · un lote sin marcas no lleva la rama ni ninguna marca (el prompt de siempre);
 *   · un lote con un hallazgo marcado lleva la rama una vez, y la marca sólo en ese hallazgo;
 *   · `cumplibles_a_la_vez` descarta y se cuenta con su nombre;
 *   · un conflicto normativo confirmado sale con severity 'contradiction', aunque el modelo diga otra cosa;
 *   · y en la cascada de verdad, la marca del juez llega al verificador y vuelve en el hallazgo publicado.
 * Sin beforeEach con mockClear (ver recompuesta-en-la-cascada.test.ts): las llamadas se leen por diferencia.
 */
const SIN = { previous: null, next: null };
const hallazgo = (topic: string, marca?: 'norma_contra_norma'): FindingToVerify => ({
  topic, newDocSays: 'puede recaer en el propio responsable o en otro designado por él',
  existingDocSays: 'nunca por el responsable del propio centro, para mantener la separación de funciones',
  existingDocumentName: 'OTRO.docx', newChunk: null, existingChunk: null, newNeighbours: SIN, existingNeighbours: SIN,
  newTrozos: [], existingTrozos: [], newColumnOrder: null, existingColumnOrder: null,
  ...(marca ? { conflictoNormativo: marca } : {}),
});
const ultimoPrompt = () => String(llamada.mock.calls[llamada.mock.calls.length - 1][0]);

describe('el texto de la rama (corregido el 26/10)', () => {
  it('lleva las TRES preguntas, la de la práctica incluida, y «sin_relacion» ya no descarta por «no son reglas»', () => {
    expect(RAMA_DE_LAS_REGLAS).toContain('SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?');
    expect(RAMA_DE_LAS_REGLAS).toContain('¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?');
    expect(RAMA_DE_LAS_REGLAS).toContain('¿LO QUE SE HACE CUMPLE LA REGLA?');
    expect(RAMA_DE_LAS_REGLAS).not.toContain('no son reglas');
  });
});

describe('el verificador y la rama de las reglas', () => {
  it('SIN MARCAS: ni la rama ni ninguna marca, el prompt de siempre', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'sin_relacion' }, { index: 2, verdict: 'sin_relacion' }] });
    await verifyFindings([hallazgo('uno'), hallazgo('dos')]);
    expect(ultimoPrompt()).not.toContain(RAMA_DE_LAS_REGLAS);
    expect(ultimoPrompt()).not.toContain('MARCADO COMO CONFLICTO NORMATIVO');
  });

  it('CON UNO MARCADO: la rama una vez, antes de «Debes responder», y la marca sólo en ese hallazgo', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'sin_relacion' }, { index: 2, verdict: 'confirmado', severity: 'contradiction' }] });
    await verifyFindings([hallazgo('sin marca'), hallazgo('con marca', 'norma_contra_norma')]);
    const p = ultimoPrompt();
    expect(p.split(RAMA_DE_LAS_REGLAS).length).toBe(2);
    expect(p).toContain(`${RAMA_DE_LAS_REGLAS}\n\nDebes responder los 2 índices`);
    expect(p).toContain(`[2] Tema: con marca\n${marcaDeConflictoNormativo('norma_contra_norma')}\nDOCUMENTO NUEVO:`);
    expect(p).toContain('[1] Tema: sin marca\nDOCUMENTO NUEVO:');
    // la marca con su paréntesis: la frase sin él también está en el texto de la rama
    expect(p.split('MARCADO COMO CONFLICTO NORMATIVO (').length).toBe(2);
  });

  it('«cumplibles_a_la_vez» descarta, y se cuenta con su propio nombre', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'cumplibles_a_la_vez' }] });
    const r = await verifyFindings([hallazgo('x', 'norma_contra_norma')]);
    expect(r.results).toEqual([{ verdict: 'cumplibles_a_la_vez' }]);
    expect(r.counts['descartado.cumplibles_a_la_vez']).toBe(1);
  });

  it('LOS DESCARTES DESGLOSADOS POR ESPECIE: la clave de siempre y, al lado, la de la especie; sin marca, sólo la de siempre', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'cumplibles_a_la_vez' }, { index: 2, verdict: 'sin_relacion' }, { index: 3, verdict: 'sin_relacion' }] });
    const r = await verifyFindings([hallazgo('a', 'norma_contra_norma'), hallazgo('b', 'norma_contra_norma'), hallazgo('c')]);
    expect(r.counts).toEqual({
      'descartado.cumplibles_a_la_vez': 1, 'descartado.cumplibles_a_la_vez.norma_contra_norma': 1,
      'descartado.sin_relacion': 2, 'descartado.sin_relacion.norma_contra_norma': 1,
      'degradado.verificado_sin_estructura': 3,
    });
  });

  it('un conflicto normativo CONFIRMADO sale como contradicción aunque el modelo diga menor; sin marca, no', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'minor_inconsistency' }, { index: 2, verdict: 'confirmado', severity: 'minor_inconsistency' }] });
    const r = await verifyFindings([hallazgo('marcado', 'norma_contra_norma'), hallazgo('normal')]);
    expect(r.results).toEqual([{ verdict: 'confirmado', severity: 'contradiction' }, { verdict: 'confirmado', severity: 'minor_inconsistency' }]);
  });
});

// ── la cascada de verdad ────────────────────────────────────────────────────
const trozo = (chunkIndex: number, text: string): StoredChunk => ({
  chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});
const NUEVO = 'El encargado del taller puede ser el mismo socio que el tesorero de la asociación.';
const EXISTE = 'Las compras las firma el encargado y las paga el tesorero, y nunca la misma persona puede hacer las dos cosas.';
const juicio = (marca?: 'norma_contra_norma'): DocumentJudgment => ({
  documentId: 'cand', documentName: 'CANDIDATO.docx', source: 'manual', overlapPercent: 10, verdict: 'tema_similar',
  contradictions: [{ topic: 'quién firma y quién paga', newDocSays: NUEVO, existingDocSays: EXISTE, severity: 'minor_inconsistency', ...(marca ? { conflictoNormativo: marca } : {}) }],
  overlappingContent: [], uniqueToNewDoc: [],
});
const EVIDENCIA: JudgmentEvidence = {
  contradictions: [{ hash: 'abcd1234', newChunk: trozo(0, NUEVO), existingChunk: trozo(0, EXISTE), newColumns: null, existingColumns: null }],
  overlaps: [],
};
const cascada = (j: DocumentJudgment) =>
  applyCascadeToCandidate(j, EVIDENCIA, [trozo(0, NUEVO)], [trozo(0, EXISTE)], 'NUEVO.docx', 'prueba', [], { emitidos: [], sinInterseccion: [] });

describe('la cascada: la marca del juez llega al verificador y vuelve en el hallazgo', () => {
  it('CON la marca: el verificador la ve, y el hallazgo confirmado sigue marcado y como contradicción', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'minor_inconsistency' }] });
    const antes = llamada.mock.calls.length;
    const r = await cascada(juicio('norma_contra_norma'));
    expect(llamada.mock.calls.length).toBe(antes + 1);
    expect(ultimoPrompt()).toContain(marcaDeConflictoNormativo('norma_contra_norma'));
    expect(ultimoPrompt()).toContain(RAMA_DE_LAS_REGLAS);
    expect(r.judgment.contradictions).toHaveLength(1);
    expect(r.judgment.contradictions[0]).toMatchObject({ conflictoNormativo: 'norma_contra_norma', severity: 'contradiction' });
  });

  it('control: SIN la marca, el mismo hallazgo pasa como siempre, sin rama y sin campo', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'minor_inconsistency' }] });
    const antes = llamada.mock.calls.length;
    const r = await cascada(juicio());
    expect(llamada.mock.calls.length).toBe(antes + 1);
    expect(ultimoPrompt()).not.toContain(RAMA_DE_LAS_REGLAS);
    expect('conflictoNormativo' in r.judgment.contradictions[0]).toBe(false);
    expect(r.judgment.contradictions[0].severity).toBe('minor_inconsistency');
  });
});
