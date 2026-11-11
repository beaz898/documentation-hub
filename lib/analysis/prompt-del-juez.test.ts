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

import { judgeAllDocuments } from './judge';
import { INTERRUPTOR_PAREJA_ENTERA } from './judge';
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

  it('el corte honesto (interruptor a «1», no caben): el prompt enviado, byte a byte', async () => {
    vi.stubEnv(INTERRUPTOR_PAREJA_ENTERA, '1');
    expect(huella(await prompt(doc('Analizado', 12, 12_000), doc('Candidato', 12, 12_000), 'corte_honesto'))).toBe('5bb0b401cfe714a5');
  });
});
