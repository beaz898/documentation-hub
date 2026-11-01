import { describe, expect, it, vi } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import type { StoredChunk } from '@/lib/read-chunks';
import type { JudgmentEvidence } from './judge';
import { applyCascadeToCandidate } from './pipeline';
import { PREGUNTA_DEL_CUMPLIMIENTO, pistaDeConflictoNormativo } from './rama-de-las-reglas';
import type { DocumentJudgment } from './types';
import {
  RESPUESTAS_DEL_CUMPLIMIENTO, RESPUESTAS_DEL_DATO, veredictoDeLasDosRespuestas, verifyFindings, type FindingToVerify,
} from './verify-findings';

/**
 * LAS DOS PREGUNTAS DEL VERIFICADOR, A TODO HALLAZGO (F-130 paso 2, 02/11/2026; la pregunta del cumplimiento es la rama
 * del 3.4, fase 3, 26/10, con el principio del 27/10). El modelo está simulado: nada sale a la red.
 *   · el texto: las cuatro preguntas y el principio, literales; las tres respuestas; y nada de la ruta por marca;
 *   · el veredicto sale de las dos respuestas, en las nueve combinaciones, y una respuesta que falta no aprueba nada;
 *   · TODO lote lleva las dos preguntas, con o sin marcas: un lote mixto es UNA llamada, y la marca es una pista en su
 *     hallazgo y en ningún otro;
 *   · ⚠️ EL CASO QUE MOTIVA EL CAMBIO: un hallazgo SIN marca que sólo la pregunta 2 confirma sobrevive, como
 *     contradicción y contado aparte; con la ruta por marca moría;
 *   · los descartes, con sus nombres de siempre y el desglose por especie de los marcados;
 *   · y en la cascada de verdad, el contador `verificador.confirmados_solo_por_cumplimiento`.
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
const r = (index: number, dato: string, cumplimiento: string, severity?: string) => ({ index, dato, cumplimiento, ...(severity ? { severity } : {}) });

describe('el texto de la pregunta del cumplimiento', () => {
  it('las CUATRO preguntas y el principio, literales del arquitecto (26 y 27/10)', () => {
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('que corresponda de estas cuatro:');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('¿LO QUE SE HACE CUMPLE LA REGLA?');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('¿PERMITE LA OTRA JUSTO LO QUE ESE PRINCIPIO EXCLUYE?');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('otra regla, y que lo sea NO la deja fuera.');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('NO VALE RESPONDER «BASTA CON NO USAR EL PERMISO».');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('O, si una enuncia un principio: la otra\n  permite justo lo que ese principio excluye.');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('o ninguna de las dos manda nada, describe una práctica\n  NI ENUNCIA UN PRINCIPIO.');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).not.toContain('no son reglas');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).not.toContain('una de las dos no manda nada');
  });

  it('LAS TRES RESPUESTAS, con sus nombres, y NADA de la ruta por marca', () => {
    for (const x of RESPUESTAS_DEL_CUMPLIMIENTO) expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain(`- "${x}":`);
    expect(PREGUNTA_DEL_CUMPLIMIENTO).toContain('responde "cumplibles".');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).not.toContain('MARCADO');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).not.toContain('y sólo a ése');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).not.toContain('NO le hagas la pregunta de los valores distintos');
    expect(PREGUNTA_DEL_CUMPLIMIENTO).not.toContain('cumplibles_a_la_vez');
  });

  it('la pista, literal: es texto que lee el modelo, y dice que es sólo una pista', () => {
    expect(pistaDeConflictoNormativo('norma_contra_norma'))
      .toBe('PISTA DEL PRIMER AUDITOR: lo señaló como conflicto normativo (norma_contra_norma). Es sólo una pista: hazle igual las dos preguntas.');
  });
});

describe('el veredicto sale de las dos respuestas', () => {
  it('LAS NUEVE COMBINACIONES: confirma cualquiera de las dos; si no, los descartes de siempre', () => {
    const tabla: Record<string, string> = {};
    for (const d of RESPUESTAS_DEL_DATO) for (const c of RESPUESTAS_DEL_CUMPLIMIENTO) {
      const v = veredictoDeLasDosRespuestas(d, c);
      tabla[`${d} + ${c}`] = v.verdict + (v.soloPorCumplimiento ? ' (sólo por el cumplimiento)' : '');
    }
    expect(tabla).toEqual({
      'opuestos + no_cumplibles': 'confirmado',
      'opuestos + cumplibles': 'confirmado',
      'opuestos + no_mandan': 'confirmado',
      'mismo_dato_sin_oposicion + no_cumplibles': 'confirmado (sólo por el cumplimiento)',
      'mismo_dato_sin_oposicion + cumplibles': 'mismo_dato_sin_oposicion',
      'mismo_dato_sin_oposicion + no_mandan': 'mismo_dato_sin_oposicion',
      'otro_dato + no_cumplibles': 'confirmado (sólo por el cumplimiento)',
      'otro_dato + cumplibles': 'cumplibles_a_la_vez',
      'otro_dato + no_mandan': 'sin_relacion',
    });
  });

  it('LAS DOS SON OBLIGATORIAS: si falta una, o no es de las suyas, no hay veredicto y no se aprueba nada', async () => {
    llamada.mockResolvedValue({ results: [
      { index: 1, dato: 'opuestos', severity: 'contradiction' },
      { index: 2, cumplimiento: 'no_cumplibles' },
      { index: 3, dato: 'opuestos', cumplimiento: 'quizas' },
      { index: 4, verdict: 'confirmado', severity: 'contradiction' },
    ] });
    const v = await verifyFindings([hallazgo('a'), hallazgo('b'), hallazgo('c'), hallazgo('d')]);
    expect(v.results).toEqual(Array(4).fill({ verdict: 'sin_relacion' }));
    expect(v.counts['descartado.sin_veredicto']).toBe(4);
  });
});

describe('el verificador: las dos preguntas a todo hallazgo', () => {
  it('SIN MARCAS: el prompt lleva las dos preguntas y ninguna pista', async () => {
    llamada.mockResolvedValue({ results: [r(1, 'otro_dato', 'no_mandan'), r(2, 'otro_dato', 'no_mandan')] });
    await verifyFindings([hallazgo('uno'), hallazgo('dos')]);
    const p = ultimoPrompt();
    expect(p).toContain('A CADA UNO le haces DOS preguntas, y LAS DOS SON OBLIGATORIAS');
    expect(p).toContain('PREGUNTA 1 · EL DATO');
    expect(p.split(PREGUNTA_DEL_CUMPLIMIENTO).length).toBe(2);
    expect(p).not.toContain('PISTA DEL PRIMER AUDITOR: lo señaló');
    expect(p).not.toContain('decide UNA SOLA cosa');
  });

  it('UN LOTE MIXTO ES UNA SOLA LLAMADA: las dos preguntas una vez, y la pista sólo en el hallazgo marcado', async () => {
    llamada.mockResolvedValue({ results: [r(1, 'otro_dato', 'no_mandan'), r(2, 'otro_dato', 'no_cumplibles'), r(3, 'mismo_dato_sin_oposicion', 'cumplibles')] });
    const antes = llamada.mock.calls.length;
    const v = await verifyFindings([hallazgo('sin marca'), hallazgo('con marca', 'norma_contra_norma'), hallazgo('otro sin marca')]);
    expect(llamada.mock.calls.length).toBe(antes + 1);
    const p = ultimoPrompt();
    expect(p.split(PREGUNTA_DEL_CUMPLIMIENTO).length).toBe(2);
    expect(p.split('PISTA DEL PRIMER AUDITOR: lo señaló').length).toBe(2);
    expect(p).toContain(`[2] Tema: con marca\n${pistaDeConflictoNormativo('norma_contra_norma')}\nDOCUMENTO NUEVO:`);
    expect(p).toContain('[1] Tema: sin marca\nDOCUMENTO NUEVO:');
    expect(v.results).toEqual([
      { verdict: 'sin_relacion' },
      { verdict: 'confirmado', severity: 'contradiction', soloPorCumplimiento: true },
      { verdict: 'mismo_dato_sin_oposicion' },
    ]);
  });

  it('⚠️ EL CASO QUE MOTIVA EL CAMBIO: un hallazgo SIN marca que sólo la pregunta 2 confirma SOBREVIVE, y como contradicción', async () => {
    llamada.mockResolvedValue({ results: [r(1, 'otro_dato', 'no_cumplibles', 'minor_inconsistency')] });
    const v = await verifyFindings([hallazgo('un D que el juez emitió sin marca')]);
    expect(v.results).toEqual([{ verdict: 'confirmado', severity: 'contradiction', soloPorCumplimiento: true }]);
    expect(v.counts['descartado.sin_relacion']).toBeUndefined();
  });

  it('LA SEVERIDAD: por el dato, la del modelo; con la marca, o sólo por el cumplimiento, contradicción', async () => {
    llamada.mockResolvedValue({ results: [
      r(1, 'opuestos', 'cumplibles', 'minor_inconsistency'),
      r(2, 'opuestos', 'cumplibles', 'minor_inconsistency'),
      r(3, 'opuestos', 'no_mandan', 'contradiction'),
    ] });
    const v = await verifyFindings([hallazgo('normal'), hallazgo('marcado', 'norma_contra_norma'), hallazgo('otro')]);
    expect(v.results).toEqual([
      { verdict: 'confirmado', severity: 'minor_inconsistency' },
      { verdict: 'confirmado', severity: 'contradiction' },
      { verdict: 'confirmado', severity: 'contradiction' },
    ]);
  });

  it('LOS DESCARTES, con sus nombres de siempre, y el desglose por especie sólo en los marcados', async () => {
    llamada.mockResolvedValue({ results: [r(1, 'otro_dato', 'cumplibles'), r(2, 'otro_dato', 'no_mandan'), r(3, 'otro_dato', 'no_mandan')] });
    const v = await verifyFindings([hallazgo('a', 'norma_contra_norma'), hallazgo('b', 'norma_contra_norma'), hallazgo('c')]);
    expect(v.counts).toEqual({
      'descartado.cumplibles_a_la_vez': 1, 'descartado.cumplibles_a_la_vez.norma_contra_norma': 1,
      'descartado.sin_relacion': 2, 'descartado.sin_relacion.norma_contra_norma': 1,
      'degradado.verificado_sin_estructura': 3,
    });
  });

  it('MÁS DE QUINCE: los lotes de quince, en el orden de entrada, marcados o no', async () => {
    llamada.mockImplementation(async (p: string) => {
      const n = (p.match(/^\[\d+\] Tema:/gm) ?? []).length;
      return { results: Array.from({ length: n }, (_, i) => r(i + 1, 'otro_dato', 'no_mandan')) };
    });
    const antes = llamada.mock.calls.length;
    const lista = Array.from({ length: 17 }, (_, i) => hallazgo(`h${i + 1}`, i % 2 ? 'norma_contra_norma' : undefined));
    await verifyFindings(lista);
    const nuevas = llamada.mock.calls.slice(antes).map(c => String(c[0]));
    llamada.mockReset();
    expect(nuevas.map(p => (p.match(/^\[\d+\] Tema: (h\d+)/gm) ?? []).map(x => x.split('Tema: ')[1]))).toEqual([
      Array.from({ length: 15 }, (_, i) => `h${i + 1}`), ['h16', 'h17'],
    ]);
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

describe('la cascada: las dos preguntas, la pista y el contador', () => {
  it('CON la marca: el verificador ve la pista y las dos preguntas, y el confirmado sigue marcado y como contradicción', async () => {
    llamada.mockResolvedValue({ results: [r(1, 'otro_dato', 'no_cumplibles', 'minor_inconsistency')] });
    const antes = llamada.mock.calls.length;
    const c = await cascada(juicio('norma_contra_norma'));
    expect(llamada.mock.calls.length).toBe(antes + 1);
    expect(ultimoPrompt()).toContain(pistaDeConflictoNormativo('norma_contra_norma'));
    expect(ultimoPrompt()).toContain(PREGUNTA_DEL_CUMPLIMIENTO);
    expect(c.judgment.contradictions).toHaveLength(1);
    expect(c.judgment.contradictions[0]).toMatchObject({ conflictoNormativo: 'norma_contra_norma', severity: 'contradiction' });
    expect(c.tally.confirmadosSoloPorCumplimiento).toBe(1);
  });

  it('⚠️ SIN la marca, el mismo hallazgo TAMBIÉN recibe la pregunta 2, sobrevive y se cuenta; y no gana la marca', async () => {
    llamada.mockResolvedValue({ results: [r(1, 'otro_dato', 'no_cumplibles', 'minor_inconsistency')] });
    const c = await cascada(juicio());
    expect(ultimoPrompt()).toContain(PREGUNTA_DEL_CUMPLIMIENTO);
    expect(ultimoPrompt()).not.toContain('PISTA DEL PRIMER AUDITOR: lo señaló');
    expect(c.judgment.contradictions).toHaveLength(1);
    expect('conflictoNormativo' in c.judgment.contradictions[0]).toBe(false);
    expect(c.judgment.contradictions[0].severity).toBe('contradiction');
    expect(c.tally.confirmadosSoloPorCumplimiento).toBe(1);
  });

  it('control: confirmado POR EL DATO no cuenta como «sólo por el cumplimiento», y la severidad es la del modelo', async () => {
    llamada.mockResolvedValue({ results: [r(1, 'opuestos', 'no_cumplibles', 'minor_inconsistency')] });
    const c = await cascada(juicio());
    expect(c.judgment.contradictions[0].severity).toBe('minor_inconsistency');
    expect(c.tally.confirmadosSoloPorCumplimiento).toBe(0);
    expect(c.tally.confirmadosPorJuicio).toBe(1);
  });
});
