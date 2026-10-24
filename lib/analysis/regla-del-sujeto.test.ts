import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * LA REGLA DEL SUJETO (3.1.2, tercera pieza, 24/10/2026), sobre los cuatro prompts reales del corpus.
 *   · la excepción ESTÁ, una sola vez, en su propia línea, justo después del ejemplo de F-126 y antes de «Para qué»;
 *   · la frase de F-126 y su ejemplo siguen ahí, letra por letra;
 *   · QUITADA LA LÍNEA, EL PROMPT ES EL DE ANTES, byte a byte: las huellas son las del código de 8a790652, antes del
 *     commit 2 y del 3. Y como quitar una línea que no está no quita nada, la primera prueba —que la línea esté— es la
 *     que hace que ésta signifique algo (protocolo, «una huella que no cambia no prueba nada si el cambio no se aplicó»);
 *   · el ejemplo no sale del corpus.
 */
const prompts: string[] = [];
vi.mock('./llm-client', () => ({
  callLLMJson: async (prompt: string) => { prompts.push(prompt); return { overlapPercent: 0, verdict: 'tema_distinto', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] }; },
  callLLM: async () => '',
  callLLMWithUsage: async () => ({ text: '', usage: {} }),
}));
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { judgeAllDocuments } from './judge';
import { EXCEPCION_DEL_SUJETO } from './regla-del-sujeto';

const VARIABLE = 'ANALYSIS_PAREJA_ENTERA';
const original = process.env[VARIABLE];
afterEach(() => { if (original === undefined) delete process.env[VARIABLE]; else process.env[VARIABLE] = original; });

const DOCS: Record<string, string> = {
  NOR11: 'NOR-11_gestion-de-residuos-sanitarios.docx', NOR10: 'NOR-10_protocolo-esterilizacion-instrumental.docx',
  CLI13: 'CLI-13_instrucciones-clinicas-residuos.docx', CLI12: 'CLI-12_manual-calidad-clinica.docx',
};
const ANTES: Record<string, string> = {
  'NOR11↔CLI13': '8b144f84d99da07d', 'NOR11↔CLI12': '188c2b10e6d29279',
  'NOR10↔CLI12': '1a6d890711a469ae', 'NOR10↔CLI13': '990156ae59bd04b9',
};
const F126_FRASE = 'Puede empezar y acabar a mitad de frase: no hace falta que tenga sujeto ni que se entienda sola.';
const F126_EJEMPLO = '- Ejemplo de cita correcta de una subordinada. Si el documento dice "Las bicicletas tándem, que solo pueden llevar quienes tengan la licencia de ciclista del club, se reparten por orden de llegada", y el dato en conflicto es quién puede llevarlas, una cita correcta es "que solo pueden llevar quienes tengan la licencia de ciclista del club": no tiene sujeto, no se entiende sola, empieza y acaba a mitad de frase, y es correcta.';

const prompt: Record<string, string> = {};
beforeAll(async () => {
  process.env[VARIABLE] = '1';
  const ch: Record<string, StoredChunk[]> = {};
  for (const [k, f] of Object.entries(DOCS)) ch[k] = toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), k, f, 'o'));
  for (const [nuevo, cands] of [['NOR11', ['CLI13', 'CLI12']], ['NOR10', ['CLI12', 'CLI13']]] as const) {
    prompts.length = 0;
    await judgeAllDocuments({
      newDocumentName: DOCS[nuevo], newDocumentSample: 'x', newDocumentChunks: ch[nuevo],
      candidates: cands.map(c => ({ documentId: c, documentName: DOCS[c], source: 'manual', rerankReason: '', rerankConfidence: 'alta',
        fragments: [{ text: ch[c][0].text, documentId: c, documentName: DOCS[c], source: 'manual', score: 0.9, chunkIndex: 0 }] })),
      chunksByDocument: new Map(cands.map(c => [c, ch[c]])),
    });
    prompts.forEach((p, i) => { prompt[`${nuevo}↔${cands[i]}`] = p; });
  }
  delete process.env[VARIABLE];
}, 120_000);
const huella = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex').slice(0, 16);

describe('la regla del sujeto, en los cuatro prompts reales', () => {
  it('ESTÁ, una sola vez, en su propia línea, justo después del ejemplo de F-126 y antes de «Para qué»', () => {
    expect(Object.keys(prompt).sort()).toEqual(Object.keys(ANTES).sort());
    for (const p of Object.values(prompt)) {
      expect(p.split(EXCEPCION_DEL_SUJETO).length).toBe(2);
      expect(p).toContain(`${F126_EJEMPLO}\n${EXCEPCION_DEL_SUJETO}\n- Para qué: cada cita se va a buscar LITERALMENTE`);
    }
  });
  it('la frase de F-126 y su ejemplo siguen ahí, letra por letra', () => {
    for (const p of Object.values(prompt)) { expect(p).toContain(F126_FRASE); expect(p).toContain(F126_EJEMPLO); }
  });
  it('QUITADA LA LÍNEA, el prompt es el de antes byte a byte (huellas del código de 8a790652)', () => {
    const sin: Record<string, string> = {};
    for (const [k, p] of Object.entries(prompt)) sin[k] = huella(p.replace(EXCEPCION_DEL_SUJETO + '\n', ''));
    expect(sin).toEqual(ANTES);
  });
  it('el ejemplo no sale del corpus: ni el cargo ni la decisión de A, ni nada de los residuos', () => {
    for (const palabra of ['Coordinador', 'Director', 'autoclave', 'esterilización', 'residuo', 'contenedor', 'Chamberí'])
      expect(EXCEPCION_DEL_SUJETO).not.toContain(palabra);
    expect(EXCEPCION_DEL_SUJETO.startsWith('- EXCEPCIÓN, cuando el dato en conflicto es QUIÉN')).toBe(true);
  });
});
