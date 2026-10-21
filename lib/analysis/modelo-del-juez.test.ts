import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * F-128 (19/10/2026): el interruptor del modelo del juez. Sin la variable, el juez llama con
 * Haiku 4.5 y sin `output_config`, exactamente como antes; con `claude-haiku-5-5`, con Haiku 5.5 y
 * el dial de esfuerzo fijado en `medium`. Y el modelo usado queda en la lectura de cada pareja.
 */
const opciones: Record<string, unknown>[] = [];
vi.mock('./llm-client', () => ({
  callLLMJson: async (_prompt: string, opts: Record<string, unknown>) => {
    opciones.push(opts);
    // La API respondió con 123 tokens de salida: el juez tiene que guardarlos en la lectura.
    (opts.alTerminar as ((u: { outputTokens: number }) => void) | undefined)?.({ outputTokens: 123 });
    return { overlapPercent: 0, verdict: 'tema_distinto', contradictions: [], overlappingContent: [], uniqueToNewDoc: [] };
  },
  callLLM: async () => '',
  callLLMWithUsage: async () => ({ text: '', usage: {} }),
}));

import { judgeAllDocuments } from './judge';
import { modeloDelJuez, VARIABLE_MODELO_DEL_JUEZ } from './modelo-del-juez';
import { HAIKU_55_MODEL, HAIKU_MODEL } from '@/lib/llm/modelos';

async function juzgar() {
  opciones.length = 0;
  const r = await judgeAllDocuments({
    newDocumentName: 'A.docx', newDocumentSample: 'texto del analizado',
    candidates: [{ documentId: 'c', documentName: 'C.docx', source: 'manual', rerankReason: '', rerankConfidence: 'alta',
      fragments: [{ text: 'texto del candidato', documentId: 'c', documentName: 'C.docx', source: 'manual', score: 0.9, chunkIndex: 0 }] }],
  });
  expect(opciones).toHaveLength(1);
  const { alTerminar, etiqueta, ...opts } = opciones[0];
  expect(typeof alTerminar).toBe('function');
  // 3.1.1, paso 3 (21/10): la etiqueta del registro por llamada, aparte para que lo de F-128 siga exacto
  expect(etiqueta).toEqual({ etapa: 'juez', pareja: 'c' });
  return { opts, lectura: r.lecturaDeLasParejas[0] };
}

describe('el modelo del juez', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it('SIN la variable: Haiku 4.5, sin output_config, y lo mismo en la lectura guardada', async () => {
    vi.stubEnv(VARIABLE_MODELO_DEL_JUEZ, undefined as unknown as string);
    delete process.env[VARIABLE_MODELO_DEL_JUEZ];
    expect(modeloDelJuez()).toEqual({ modelo: HAIKU_MODEL, maxOutputTokens: 4096, temperature: 0.1 });
    const { opts, lectura } = await juzgar();
    expect(opts).toEqual({ maxOutputTokens: 4096, temperature: 0.1, modeloExacto: HAIKU_MODEL });
    expect(opts).not.toHaveProperty('outputConfig');
    expect(opts).not.toHaveProperty('sinTemperatura');
    expect(lectura.modelo).toBe(HAIKU_MODEL);
    expect(lectura.tokensDeSalida).toBe(123);
  });

  it('con claude-haiku-5-5: Haiku 5.5, SIN temperatura, 16.000 de salida y el dial en medium; la lectura lo dice', async () => {
    vi.stubEnv(VARIABLE_MODELO_DEL_JUEZ, HAIKU_55_MODEL);
    const { opts, lectura } = await juzgar();
    expect(opts).toEqual({ maxOutputTokens: 16000, sinTemperatura: true, modeloExacto: HAIKU_55_MODEL, outputConfig: { effort: 'medium' } });
    expect(opts).not.toHaveProperty('temperature');
    expect(lectura.modelo).toBe(HAIKU_55_MODEL);
    expect(lectura.tokensDeSalida).toBe(123);
  });

  it('⚠️ CONTROL — cualquier otro valor deja Haiku 4.5 y lo dice en el log', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv(VARIABLE_MODELO_DEL_JUEZ, 'claude-haiku-5');
    expect(modeloDelJuez()).toEqual({ modelo: HAIKU_MODEL, maxOutputTokens: 4096, temperature: 0.1 });
    expect(aviso).toHaveBeenCalledTimes(1);
    vi.stubEnv(VARIABLE_MODELO_DEL_JUEZ, HAIKU_MODEL);
    expect(modeloDelJuez()).toEqual({ modelo: HAIKU_MODEL, maxOutputTokens: 4096, temperature: 0.1 });
    expect(aviso).toHaveBeenCalledTimes(1);
  });
});
