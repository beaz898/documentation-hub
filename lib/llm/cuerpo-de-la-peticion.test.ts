import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * F-128 (19/10/2026): el cuerpo EXACTO de la petición a la API. El juez manda ahora siempre su
 * modelo por `modeloExacto`; sin la variable, ese cuerpo tiene que ser idéntico al de antes de
 * F-128, y `output_config` sólo puede aparecer cuando se pide.
 */
vi.mock('./rate-limiter', () => ({
  acquireRateLimit: async () => '0',
  recordUsage: async () => {},
  currentWindowStart: () => '0',
  EST_OUTPUT_TOKENS: { json: 1000, texto: 1000, agente: 1000 },
}));

import { callAnthropicJson } from './anthropic-client';
import { HAIKU_55_MODEL, HAIKU_MODEL, SONNET_MODEL } from './modelos';
import { usageContext, type UsageAccumulator } from '@/lib/observability/usage-context';

const cuerpos: Record<string, unknown>[] = [];
function simularApi() {
  cuerpos.length = 0;
  vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => {
    cuerpos.push(JSON.parse(init.body));
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"ok":true}' }], usage: { input_tokens: 7, output_tokens: 3 } }) };
  });
}

describe('el cuerpo de la petición', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('el juez sin la variable (modeloExacto = Haiku 4.5) manda EXACTAMENTE el cuerpo de antes de F-128', async () => {
    simularApi();
    await callAnthropicJson('hola', { maxOutputTokens: 4096, temperature: 0.1 });
    await callAnthropicJson('hola', { maxOutputTokens: 4096, temperature: 0.1, modeloExacto: HAIKU_MODEL });
    expect(cuerpos).toHaveLength(2);
    expect(Object.keys(cuerpos[0]).sort()).toEqual(['max_tokens', 'messages', 'model', 'temperature']);
    expect(cuerpos[0].model).toBe(HAIKU_MODEL);
    expect(cuerpos[1]).toEqual(cuerpos[0]);
  });

  it('el juez con Haiku 5.5: su modelo, 16.000 de salida, output_config.effort = medium y SIN temperature', async () => {
    simularApi();
    await callAnthropicJson('hola', { maxOutputTokens: 16000, sinTemperatura: true, modeloExacto: HAIKU_55_MODEL, outputConfig: { effort: 'medium' } });
    expect(Object.keys(cuerpos[0]).sort()).toEqual(['max_tokens', 'messages', 'model', 'output_config']);
    expect(cuerpos[0].model).toBe(HAIKU_55_MODEL);
    expect(cuerpos[0].max_tokens).toBe(16000);
    expect(cuerpos[0].output_config).toEqual({ effort: 'medium' });
    // Ni top_p ni top_k ni thinking, y los messages acaban en el turno del usuario: nada de prefill.
    const mensajes = cuerpos[0].messages as { role: string }[];
    expect(mensajes[mensajes.length - 1].role).toBe('user');
  });

  it('sin sinTemperatura, la temperatura sigue yendo como siempre (la otra mitad)', async () => {
    simularApi();
    await callAnthropicJson('hola', { temperature: 0.1 });
    await callAnthropicJson('hola', {});
    expect(cuerpos[0].temperature).toBe(0.1);
    expect(cuerpos[1].temperature).toBe(0);
  });

  it('alTerminar recibe los tokens de salida de la respuesta', async () => {
    simularApi();
    const vistos: number[] = [];
    await callAnthropicJson('hola', { alTerminar: u => vistos.push(u.outputTokens) });
    expect(vistos).toEqual([3]);
  });

  it('el resto de llamadas no cambia: sonnet sigue siendo Sonnet y sin output_config', async () => {
    simularApi();
    await callAnthropicJson('hola', { model: 'sonnet' });
    expect(cuerpos[0].model).toBe(SONNET_MODEL);
    expect(cuerpos[0]).not.toHaveProperty('output_config');
  });

  it('el uso se apunta con el modelo que se mandó, y no con otro', async () => {
    simularApi();
    const acc: UsageAccumulator = new Map();
    await usageContext.run(acc, () => callAnthropicJson('hola', { modeloExacto: HAIKU_55_MODEL, outputConfig: { effort: 'medium' } }));
    expect([...acc.keys()]).toEqual([HAIKU_55_MODEL]);
    expect(acc.get(HAIKU_55_MODEL)?.inputTokens).toBe(7);
  });
});
