import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * LA EXCEPCIÓN DE LAS REGLAS (3.4, fase 2 · 26/10/2026), sobre los cuatro prompts reales del corpus.
 *   · el bloque ESTÁ, una sola vez, justo después de la regla de oro y antes de las reglas de formato;
 *   · lo que ya había sigue ahí, letra por letra: la definición, la regla de oro y el ejemplo del teletrabajo;
 *   · que, quitado, el prompt sea el de antes byte a byte lo comprueban regla-del-sujeto.test.ts y
 *     declaracion-de-lo-omitido.test.ts con las huellas de 8a790652; esta prueba, que esté, es la que hace que
 *     aquélla signifique algo;
 *   · el principio (27/10): la cláusula vieja ya no está, y la nueva, el bloque del principio y el último punto van
 *     en ese orden;
 *   · los ejemplos no salen del corpus.
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
import { EXCEPCION_DE_LAS_REGLAS } from './excepcion-de-las-reglas';

const VARIABLE = 'ANALYSIS_PAREJA_ENTERA';
const original = process.env[VARIABLE];
afterEach(() => { if (original === undefined) delete process.env[VARIABLE]; else process.env[VARIABLE] = original; });

const DOCS: Record<string, string> = {
  NOR11: 'NOR-11_gestion-de-residuos-sanitarios.docx', NOR10: 'NOR-10_protocolo-esterilizacion-instrumental.docx',
  CLI13: 'CLI-13_instrucciones-clinicas-residuos.docx', CLI12: 'CLI-12_manual-calidad-clinica.docx',
};
const REGLA_DE_ORO = 'REGLA DE ORO: Si puedes imaginar un contexto razonable en el que ambas afirmaciones sean verdaderas simultáneamente, NO es contradicción. Puede ser inconsistencia menor.';
const DEFINICION = '2. "Contradicción" significa que ambos documentos afirman cosas INCOMPATIBLES sobre el mismo dato concreto. Es decir: es IMPOSIBLE que ambas afirmaciones sean verdaderas a la vez.';
const TELETRABAJO = '- "La política prohíbe el teletrabajo" vs "Se permite el teletrabajo 3 días por semana"';

const prompt: string[] = [];
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
    prompt.push(...prompts);
  }
  delete process.env[VARIABLE];
}, 120_000);

describe('la excepción de las reglas, en los cuatro prompts reales', () => {
  it('ESTÁ, una sola vez, justo después de la regla de oro y antes de las reglas de formato', () => {
    expect(prompt).toHaveLength(4);
    for (const p of prompt) {
      expect(p.split(EXCEPCION_DE_LAS_REGLAS).length).toBe(2);
      expect(p).toContain(`${REGLA_DE_ORO}\n\n${EXCEPCION_DE_LAS_REGLAS}\n\nREGLAS DE FORMATO:`);
    }
  });

  it('lo que ya había sigue ahí, letra por letra: la definición, la regla de oro y el ejemplo del teletrabajo', () => {
    for (const p of prompt) { expect(p).toContain(DEFINICION); expect(p).toContain(REGLA_DE_ORO); expect(p).toContain(TELETRABAJO); }
  });

  it('pide los dos valores del campo y ningún otro, con su ejemplo de JSON', () => {
    expect(EXCEPCION_DE_LAS_REGLAS).toContain('"conflictoNormativo": "norma_contra_norma"');
    expect(EXCEPCION_DE_LAS_REGLAS).toContain('- "norma_contra_practica":');
  });

  it('EL PRINCIPIO (27/10): la cláusula vieja ya no está, la nueva y el bloque del principio sí, y el último punto cierra', () => {
    // Las huellas quitan el bloque entero y no ven su contenido: ésta es la prueba que lo mira.
    expect(EXCEPCION_DE_LAS_REGLAS).not.toContain('Una regla y la razón por la que existe no son dos reglas');
    expect(EXCEPCION_DE_LAS_REGLAS).not.toContain('LO QUE SIGUE SIN SER CONFLICTO');
    const clausula = EXCEPCION_DE_LAS_REGLAS.indexOf('NO LA PONE EN CONFLICTO CON SU PROPIA\n  REGLA.');
    const principio = EXCEPCION_DE_LAS_REGLAS.indexOf('SI UN TEXTO ENUNCIA UN PRINCIPIO Y EL OTRO PERMITE JUSTO LO QUE ESE');
    const ejemplo = EXCEPCION_DE_LAS_REGLAS.indexOf('EJEMPLO, el mismo taller y el principio SOLO:');
    const ultimo = EXCEPCION_DE_LAS_REGLAS.indexOf('- SI PARA VER EL CONFLICTO TIENES QUE SUPONER UN HECHO');
    expect([clausula, principio, ejemplo, ultimo].every(i => i > 0)).toBe(true);
    expect(clausula < principio && principio < ejemplo && ejemplo < ultimo).toBe(true);
    expect(EXCEPCION_DE_LAS_REGLAS.split('SUPONER UN HECHO').length).toBe(2);
    expect(EXCEPCION_DE_LAS_REGLAS.slice(ultimo).split('\n- ').length).toBe(1);
    // con su cabecera, para que no se lea como un punto más del ejemplo del taller
    expect(EXCEPCION_DE_LAS_REGLAS).toContain('excluye. Es "norma_contra_norma".\n\nY ESTO VALE PARA CUALQUIERA DE LOS CASOS DE ARRIBA:\n- SI PARA VER EL CONFLICTO');
  });

  it('los ejemplos no salen del corpus', () => {
    for (const palabra of ['Coordinador', 'Director', 'autoclave', 'esterilización', 'residuo', 'contenedor', 'Chamberí', 'clínica'])
      expect(EXCEPCION_DE_LAS_REGLAS).not.toContain(palabra);
  });
});
