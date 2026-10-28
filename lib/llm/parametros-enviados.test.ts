import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * LAS CONDICIONES DE LA LLAMADA EN EL REGISTRO (28/10/2026). Las dos tandas del 3.4 corrieron con el juez en Haiku 5.5,
 * sin `temperature` en el cuerpo, y nada lo guardaba. Ahora cada entrada del registro por llamada, y el `alTerminar`
 * que lee el juez, llevan lo que viajó en el cuerpo: `max_tokens`, la temperatura o «sin_enviar», y el esfuerzo o
 * «sin_enviar».
 *   · se leen del CUERPO enviado, no de las opciones: la prueba compara contra lo que recibió `fetch`;
 *   · una temperatura 0 es 0, no «sin_enviar» (el cero no es ausencia);
 *   · el intento fallido también los lleva: la condición es de la petición, no de la respuesta.
 * El modelo está simulado: nada sale a la red.
 */
vi.mock('./rate-limiter', () => ({
  acquireRateLimit: async () => '0',
  recordUsage: async () => {},
  currentWindowStart: () => '0',
  EST_OUTPUT_TOKENS: { json: 1000, texto: 1000, agente: 1000 },
}));

import { callAnthropicJson, parametrosEnviados } from './anthropic-client';
import { HAIKU_55_MODEL, HAIKU_MODEL } from './modelos';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';

const cuerpos: Record<string, unknown>[] = [];
function simularApi(fallosAntes = 0) {
  cuerpos.length = 0;
  let fallos = fallosAntes;
  vi.stubGlobal('fetch', async (_url: string, init: { body: string }) => {
    cuerpos.push(JSON.parse(init.body));
    if (fallos > 0) { fallos--; return { ok: false, status: 400, text: async () => 'malo' }; }
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"ok":true}' }], usage: { input_tokens: 7, output_tokens: 3 } }) };
  });
}

describe('los parámetros enviados', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('se leen del cuerpo: max_tokens, la temperatura o «sin_enviar», y el esfuerzo o «sin_enviar»; el 0 es 0', () => {
    expect(parametrosEnviados({ model: HAIKU_MODEL, max_tokens: 4096, temperature: 0.1, messages: [] }))
      .toEqual({ maxTokens: 4096, temperatura: 0.1, esfuerzo: 'sin_enviar' });
    expect(parametrosEnviados({ model: HAIKU_55_MODEL, max_tokens: 16000, messages: [], output_config: { effort: 'medium' } }))
      .toEqual({ maxTokens: 16000, temperatura: 'sin_enviar', esfuerzo: 'medium' });
    expect(parametrosEnviados({ model: HAIKU_MODEL, max_tokens: 2048, temperature: 0, messages: [] }).temperatura).toBe(0);
  });

  it('EN EL REGISTRO Y EN alTerminar: lo mismo que recibió la API, con Haiku 4.5 y con Haiku 5.5', async () => {
    for (const opts of [
      { maxOutputTokens: 4096, temperature: 0.1, modeloExacto: HAIKU_MODEL },
      { maxOutputTokens: 16000, sinTemperatura: true, modeloExacto: HAIKU_55_MODEL, outputConfig: { effort: 'medium' as const } },
    ]) {
      simularApi();
      const vistos: unknown[] = [];
      const { registro } = await conRegistroDeLlamadas(() =>
        callAnthropicJson('hola', { ...opts, etiqueta: { etapa: 'juez', pareja: 'c' }, alTerminar: u => { vistos.push(u.parametros); } }));
      const enviado = parametrosEnviados(cuerpos[0]);
      expect(registro.peticiones.map(p => p.parametros)).toEqual([enviado]);
      expect(vistos).toEqual([enviado]);
    }
  });

  it('el intento que falla también los lleva: la condición es de la petición', async () => {
    simularApi(1);
    const { registro } = await conRegistroDeLlamadas(async () => {
      await callAnthropicJson('hola', { maxOutputTokens: 2048, temperature: 0.1, etiqueta: { etapa: 'verificador' } }).catch(() => null);
    });
    expect(registro.peticiones.map(p => [p.resultado, p.parametros])).toEqual([
      ['http', { maxTokens: 2048, temperatura: 0.1, esfuerzo: 'sin_enviar' }],
    ]);
  });
});
