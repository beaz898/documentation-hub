import { describe, expect, it, vi } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import type { StoredChunk } from '@/lib/read-chunks';
import type { JudgmentEvidence } from './judge';
import { applyCascadeToCandidate } from './pipeline';
import { RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR } from './repliegue-de-tramo';
import type { CitaRecompuestaDeLado, DocumentJudgment } from './types';

/**
 * F-125, fase 3.1 · D4: UN EMPALME NUNCA SE PUBLICA SIN VERIFICADOR, ejercido
 * sobre la cascada (`applyCascadeToCandidate`). La marca `recompuesta` se pone
 * A MANO: en este commit nada la produce todavía. El modelo está simulado
 * (`llm-client`), así que ningún caso sale a la red.
 */

const trozo = (chunkIndex: number, text: string): StoredChunk => ({
  chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});

const ANCLA = 'El gestor autorizado retira el material de las tres clínicas los martes y los viernes por la mañana.';
const RESTO = 'El registro de retiradas lo firma el responsable de turno de cada clínica antes de las doce del mediodía.';
const NUEVOS = [
  trozo(0, `Primer trozo, el del ancla. ${ANCLA}`),
  trozo(1, 'Un trozo de en medio que no tiene nada que ver con este hallazgo concreto.'),
  trozo(2, `Tercer trozo, el del resto. ${RESTO}`),
];
const EXISTENTE = 'El gestor autorizado retira el material de las tres clínicas una vez al mes, el primer lunes.';
const EXISTENTES = [trozo(0, EXISTENTE)];

const MARCA: CitaRecompuestaDeLado = {
  citaDelJuez: 'El registro de retiradas lo firma el responsable de turno, el material de las tres clínicas los martes y los viernes',
  fraseDelAncla: { chunkIndex: 0, desde: 28, hasta: 28 + ANCLA.length, texto: ANCLA },
  fraseDelResto: { chunkIndex: 2, desde: 28, hasta: 28 + RESTO.length, texto: RESTO },
  ancla: { desde: 0, hasta: 0 }, resto: { desde: 0, hasta: 0 },
  distancia: 0, hueco: 0, ordenInverso: true, enTrozosDistintos: true,
};

function juicio(c: Partial<DocumentJudgment['contradictions'][number]>): DocumentJudgment {
  return {
    documentId: 'cand', documentName: 'CANDIDATO.docx', source: 'manual', overlapPercent: 40, verdict: 'tema_similar',
    contradictions: [{ topic: 'Frecuencia de retirada', newDocSays: ANCLA, existingDocSays: EXISTENTE, severity: 'contradiction', ...c }],
    overlappingContent: [], uniqueToNewDoc: [],
  };
}
const EVIDENCIA: JudgmentEvidence = {
  contradictions: [{ hash: 'abcd1234', newChunk: NUEVOS[0], existingChunk: EXISTENTES[0], newColumns: null, existingColumns: null }],
  overlaps: [],
};
const cascada = (j: DocumentJudgment) =>
  applyCascadeToCandidate(j, EVIDENCIA, NUEVOS, EXISTENTES, 'NUEVO.docx', 'prueba', [], { emitidos: [], sinInterseccion: [] });

// ⚠️ SIN beforeEach CON mockClear NI mockReset: con cualquiera de los dos, vitest 4
// da por fallido el caso del verificador que lanza aunque el código capture el
// error (comprobado el 13/10/2026 con un caso mínimo sobre verifyFindings). Las
// llamadas se cuentan por diferencia.
const llamadasHastaAhora = () => llamada.mock.calls.length;

describe('(5b) la rama de reclasificar a solapamiento', () => {
  // Las dos citas iguales al normalizar: la regla determinista dice 'reclassify'.
  const iguales = { newDocSays: ANCLA, existingDocSays: ANCLA };

  it('con la marca, la contradicción muere: ni sigue ni pasa a solapamiento, y se cuenta', async () => {
    const antes = llamadasHastaAhora();
    const r = await cascada(juicio({ ...iguales, recompuesta: { nuevo: MARCA } }));
    expect(r.judgment.contradictions).toEqual([]);
    expect(r.judgment.overlappingContent).toEqual([]);
    expect(r.judgment.discarded?.[RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR]).toBe(1);
    expect(llamadasHastaAhora()).toBe(antes);
  });

  it('control: sin la marca, la misma contradicción se reclasifica como hoy', async () => {
    const r = await cascada(juicio(iguales));
    expect(r.judgment.overlappingContent).toHaveLength(1);
    expect(r.judgment.discarded?.[RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR]).toBeUndefined();
  });
});

describe('(5a) el verificador falla', () => {
  it('un hallazgo recompuesto no se publica: el verificador falla cerrado', async () => {
    llamada.mockImplementation(async () => { throw new Error('el modelo no responde'); });
    const antes = llamadasHastaAhora();
    const r = await cascada(juicio({ recompuesta: { nuevo: MARCA } }));
    expect(llamadasHastaAhora()).toBe(antes + 1);
    expect(r.judgment.contradictions).toEqual([]);
  });

  it('control: con el verificador confirmando, el mismo hallazgo sí sigue', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'contradiction' }] });
    const r = await cascada(juicio({ recompuesta: { nuevo: MARCA } }));
    expect(r.judgment.contradictions).toHaveLength(1);
    expect(r.judgment.contradictions[0].newDocSays).toBe(ANCLA);
  });
});

describe('las dos frases al verificador', () => {
  const prompt = async (j: DocumentJudgment): Promise<string> => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'contradiction' }] });
    await cascada(j);
    return String(llamada.mock.calls[llamada.mock.calls.length - 1][0]);
  };

  it('un recompuesto con las dos frases en TROZOS DISTINTOS llega al verificador con los dos trozos', async () => {
    const p = await prompt(juicio({ recompuesta: { nuevo: MARCA } }));
    expect(p).toContain(NUEVOS[0].text);
    expect(p).toContain(NUEVOS[2].text);
  });

  it('control: sin la marca, al verificador sólo le llega el trozo del ancla', async () => {
    const p = await prompt(juicio({}));
    expect(p).toContain(NUEVOS[0].text);
    expect(p).not.toContain(RESTO);
  });
});
