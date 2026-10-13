import { describe, expect, it, vi } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import type { StoredChunk } from '@/lib/read-chunks';
import type { JudgmentEvidence } from './judge';
import { applyCascadeToCandidate } from './pipeline';
import { RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR, RECOMPUESTA_SIN_CONTEXTO_DEL_RESTO } from './repliegue-de-tramo';
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
/** Corre la cascada con el verificador confirmando y devuelve el prompt de SU
 *  llamada. Exige que haya exactamente una llamada nueva: sin esto, un hallazgo
 *  que muriera antes del verificador dejaría leer el prompt de la prueba
 *  anterior y la prueba pasaría en falso (hueco visto el 13/10/2026). */
async function promptDe(j: DocumentJudgment): Promise<string> {
  llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'contradiction' }] });
  const antes = llamadasHastaAhora();
  await cascada(j);
  expect(llamadasHastaAhora()).toBe(antes + 1);
  return String(llamada.mock.calls[llamada.mock.calls.length - 1][0]);
}

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
  const prompt = promptDe;

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

describe('la guarda descarta UN hallazgo, no la pareja', () => {
  // El `return` de la guarda está dentro del `forEach` de las contradicciones
  // (pipeline.ts): sale del hallazgo, no de la función. Esta prueba lo deja
  // clavado aunque mañana alguien cambie el forEach por un bucle `for`.
  it('con dos contradicciones —la primera un empalme bloqueado, la segunda normal—, la segunda se publica', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'contradiction' }] });
    const OTRA = 'El gestor autorizado retira el material de las tres clínicas una vez al mes, el primer lunes.';
    const j: DocumentJudgment = {
      ...juicio({ newDocSays: ANCLA, existingDocSays: ANCLA, recompuesta: { nuevo: MARCA } }),
    };
    j.contradictions.push({ topic: 'Frecuencia de retirada (normal)', newDocSays: ANCLA, existingDocSays: OTRA, severity: 'contradiction' });
    const evidencia: JudgmentEvidence = {
      contradictions: [EVIDENCIA.contradictions[0], { ...EVIDENCIA.contradictions[0], hash: 'efgh5678' }],
      overlaps: [],
    };
    const r = await applyCascadeToCandidate(j, evidencia, NUEVOS, EXISTENTES, 'NUEVO.docx', 'prueba', [], { emitidos: [], sinInterseccion: [] });
    expect(r.judgment.discarded?.[RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR]).toBe(1);
    expect(r.judgment.contradictions.map(c => c.topic)).toEqual(['Frecuencia de retirada (normal)']);
  });
});

describe('las dos frases en el MISMO trozo (el caso de LUGAR)', () => {
  it('el trozo llega al verificador UNA vez, no dos', async () => {
    const mismoTrozo: CitaRecompuestaDeLado = { ...MARCA, fraseDelResto: { ...MARCA.fraseDelAncla }, enTrozosDistintos: false };
    const p = await promptDe(juicio({ recompuesta: { nuevo: mismoTrozo } }));
    expect(p.split(NUEVOS[0].text).length - 1).toBe(1);
  });
});

describe('D4 · la frase del resto sin contexto: falla cerrado (commit 8)', () => {
  it('(i) LUGAR: las dos frases en el MISMO trozo → el contexto del resto no está vacío, el hallazgo SIGUE y el contador se queda a cero', async () => {
    llamada.mockResolvedValue({ results: [{ index: 1, verdict: 'confirmado', severity: 'contradiction' }] });
    const mismoTrozo: CitaRecompuestaDeLado = { ...MARCA, fraseDelResto: { ...MARCA.fraseDelAncla }, enTrozosDistintos: false };
    const r = await cascada(juicio({ recompuesta: { nuevo: mismoTrozo } }));
    expect(r.judgment.contradictions).toHaveLength(1);
    expect(r.judgment.discarded?.[RECOMPUESTA_SIN_CONTEXTO_DEL_RESTO]).toBeUndefined();
  });

  it('(ii) la frase del resto que contextoDeLaCita no encuentra → el hallazgo MUERE, contado, sin llegar al verificador', async () => {
    const perdida: CitaRecompuestaDeLado = {
      ...MARCA,
      fraseDelResto: { chunkIndex: 99, desde: 0, hasta: 10, texto: 'Una frase que no está en ningún trozo de este documento, ni parecida.' },
    };
    const antes = llamadasHastaAhora();
    const r = await cascada(juicio({ recompuesta: { nuevo: perdida } }));
    expect(r.judgment.contradictions).toEqual([]);
    expect(r.judgment.discarded?.[RECOMPUESTA_SIN_CONTEXTO_DEL_RESTO]).toBe(1);
    expect(llamadasHastaAhora()).toBe(antes);
  });
});

describe('D2 del commit 8 · con las frases en trozos distintos, al verificador no le llega ningún vecino', () => {
  // El vecino «siguiente» del trozo del ancla (trozo 0) es el trozo 1.
  const VECINO = NUEVOS[1].text;
  it('control: sin la marca, el vecino sí llega (la prueba lo puede ver)', async () => {
    expect(await promptDe(juicio({}))).toContain(VECINO);
  });
  it('con la marca y dos trozos, los dos trozos llegan y el vecino no', async () => {
    const p = await promptDe(juicio({ recompuesta: { nuevo: MARCA } }));
    expect(p).toContain(NUEVOS[0].text);
    expect(p).toContain(NUEVOS[2].text);
    expect(p).not.toContain(VECINO);
  });
});
