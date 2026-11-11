import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * EL TESTIGO DEL PROMPT DEL JUEZ (11/11/2026). Las huellas de abajo se sacaron del código ANTES de extraer la plantilla a una
 * función (arquitecto: «primero el testigo, luego la obra»): si se hubieran escrito después, la prueba compararía el refactor
 * consigo mismo. Capturan, byte a byte, el prompt que `judgeAllDocuments` ENVÍA al modelo en los tres regímenes de la pareja.
 * Cualquier cambio del texto del prompt las mueve, y entonces hay que decidir a sabiendas, no por accidente.
 */
const enviados: string[] = [];
vi.mock('./llm-client', () => ({
  callLLMJson: async (prompt: string) => {
    enviados.push(prompt);
    return { overlapPercent: 0, verdict: 'tema_distinto', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] };
  },
  callLLM: async () => '',
  callLLMWithUsage: async () => ({ text: '', usage: {} }),
}));

import { buildAnalyzedDocumentText, judgeAllDocuments, promptDelJuez } from './judge';
import { INSTRUCCION_DE_SALIDA_DEL_JUEZ, INTERRUPTOR_PAREJA_ENTERA } from './judge';
import type { StoredChunk } from '@/lib/read-chunks';

const huella = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const trozo = (i: number, text: string): StoredChunk => ({ chunkIndex: i, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null });
const doc = (pref: string, n: number, largo: number) => Array.from({ length: n }, (_, i) => trozo(i, `${pref} ${i}. ` + 'x'.repeat(largo)));

async function prompt(analizado: StoredChunk[], candidato: StoredChunk[], regimen: string) {
  enviados.length = 0;
  const r = await judgeAllDocuments({
    newDocumentName: 'NOR-10.docx', newDocumentSample: analizado.map(c => c.text).join('\n\n'),
    newDocumentChunks: analizado,
    chunksByDocument: new Map([['c', candidato]]),
    candidates: [{ documentId: 'c', documentName: 'CLI-12.docx', source: 'manual', rerankReason: '', rerankConfidence: 'alta',
      fragments: [{ text: candidato[0].text, documentId: 'c', documentName: 'CLI-12.docx', source: 'manual', score: 0.9, chunkIndex: 0 }] }],
  });
  expect(enviados).toHaveLength(1);
  // que cada caso sea de verdad el régimen que dice ser
  expect(r.lecturaDeLasParejas[0].regimen).toBe(regimen);
  // y que la lectura guarde la huella de LO ENVIADO (11/11, LecturaDeLaPareja.huellaDelPrompt), en los tres regímenes
  expect(r.lecturaDeLasParejas[0].huellaDelPrompt).toBe(huella(enviados[0]));
  return enviados[0];
}

describe('el testigo del prompt del juez', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('la tijera vieja (interruptor apagado): el prompt enviado, byte a byte', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '0');
    expect(huella(await prompt(doc('Analizado', 5, 300), doc('Candidato', 4, 200), 'tijera_vieja'))).toBe('138b8c81cfe3da41');
  });

  it('la pareja entera (interruptor a «1», los dos caben): el prompt enviado, byte a byte', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    expect(huella(await prompt(doc('Analizado', 5, 300), doc('Candidato', 4, 200), 'pareja_entera'))).toBe('67a2be2647d9f368');
  });

  it('promptDelJuez, llamada a mano con la pareja entera, da EL MISMO prompt que el juez envía (es lo que hará el ensayo de d4)', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    const a = doc('Analizado', 5, 300), c = doc('Candidato', 4, 200);
    const enviado = await prompt(a, c, 'pareja_entera');
    const amano = promptDelJuez({
      nombreDelAnalizado: 'NOR-10.docx', textoAnalizado: buildAnalyzedDocumentText(a, 'NOR-10.docx'), avisoDeLoOmitido: '',
      nombreDelCandidato: 'CLI-12.docx', fuenteDelCandidato: 'manual', bloqueCandidato: buildAnalyzedDocumentText(c, 'CLI-12.docx'),
    });
    expect(amano).toBe(enviado);
  });

  it('el corte honesto (interruptor a «1», no caben): el prompt enviado, byte a byte', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    expect(huella(await prompt(doc('Analizado', 12, 12_000), doc('Candidato', 12, 12_000), 'corte_honesto'))).toBe('5bb0b401cfe714a5');
  });

  it('el bloque final de la instrucción de salida es UNA constante, y el prompt acaba en ella', () => {
    const p = promptDelJuez({ nombreDelAnalizado: 'N', textoAnalizado: 'X', avisoDeLoOmitido: '', nombreDelCandidato: 'E', fuenteDelCandidato: 'manual', bloqueCandidato: 'Y' });
    expect(p.endsWith(INSTRUCCION_DE_SALIDA_DEL_JUEZ)).toBe(true);
    expect(p.split(INSTRUCCION_DE_SALIDA_DEL_JUEZ).length - 1).toBe(1);
    expect(INSTRUCCION_DE_SALIDA_DEL_JUEZ.startsWith('Responde con este JSON')).toBe(true);
  });
});

describe('la costura de la respuesta del juez (11/11, F-130 m1)', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('con obtenerRespuesta, la recibe el mismo prompt que el producto enviaría, NO se llama a callLLMJson, y lo que devuelve pasa por la puerta', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    const a = doc('Analizado', 5, 300), c = doc('Candidato', 4, 200);
    const delProducto = await prompt(a, c, 'pareja_entera');
    enviados.length = 0;
    const recibidos: string[] = [];
    const r = await judgeAllDocuments({
      newDocumentName: 'NOR-10.docx', newDocumentSample: a.map(x => x.text).join('\n\n'), newDocumentChunks: a,
      chunksByDocument: new Map([['c', c]]),
      candidates: [{ documentId: 'c', documentName: 'CLI-12.docx', source: 'manual', rerankReason: '', rerankConfidence: 'alta',
        fragments: [{ text: c[0].text, documentId: 'c', documentName: 'CLI-12.docx', source: 'manual', score: 0.9, chunkIndex: 0 }] }],
      obtenerRespuesta: async p => {
        recibidos.push(p);
        return { overlapPercent: 0, verdict: 'sin_relacion', overlappingContent: [], uniqueToNewDoc: [], contradictions: [
          { topic: 'real', newDocSays: a[1].text.slice(0, 120), existingDocSays: c[2].text.slice(0, 120), severity: 'contradiction' },
          { topic: 'inventada', newDocSays: 'esta frase no está en ninguno de los dos documentos y la puerta la tiene que tirar', existingDocSays: c[2].text.slice(0, 120), severity: 'contradiction' },
        ] };
      },
    });
    expect(enviados).toHaveLength(0);
    expect(recibidos).toEqual([delProducto]);
    expect(r.lecturaDeLasParejas[0].huellaDelPrompt).toBe(huella(delProducto));
    expect(r.judgments[0].contradictions.map(x => x.topic)).toEqual(['real']);
    expect(r.judgments[0].descartesPorCita?.map(x => [x.tema, x.ladoFallido])).toEqual([['inventada', 'nuevo']]);
  });
});
