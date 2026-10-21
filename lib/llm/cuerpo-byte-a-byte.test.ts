import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * 3.1.1, paso 2 (21/10/2026): LA PETICIÓN A LA API SALE IDÉNTICA BYTE A BYTE. Es lo que hace seguro
 * el registro por llamada, igual que la pasada 0 en F-128, y el arquitecto lo puso de condición: no
 * se quita ni se debilita.
 *
 * Las seis referencias de abajo se sacaron con el cliente de ANTES del 3.1.1 (`d4cd1288`), con estas
 * mismas llamadas: el cuerpo es la cadena exacta que va en el `fetch`, y las cabeceras, el objeto
 * exacto salvo el valor de la clave, que no se escribe en ningún sitio y se compara con la variable
 * de entorno sin imprimirla. Cada llamada se lanza dos veces: sin registro ni etiqueta, y con un
 * registro abierto y una etiqueta puesta. Las dos tienen que dar la referencia.
 */
vi.mock('./rate-limiter', () => ({
  acquireRateLimit: async () => '0',
  recordUsage: async () => {},
  currentWindowStart: () => '0',
  EST_OUTPUT_TOKENS: { json: 1000, texto: 1000, agent: 1000 },
}));

import { callAnthropicAgent, callAnthropicJson, callAnthropicText, callAnthropicWithUsage, type CallOptions } from './anthropic-client';
import { HAIKU_55_MODEL } from './modelos';
import { conRegistroDeLlamadas } from '@/lib/observability/registro-de-llamadas';

const SUFIJO = '\\n\\nIMPORTANTE: Responde EXCLUSIVAMENTE con un objeto JSON válido. Sin texto antes ni después, sin bloques de código, sin explicaciones. El JSON debe ser parseable directamente con JSON.parse().';
const BASE = { 'Content-Type': 'application/json', 'x-api-key': '<CLAVE>', 'anthropic-version': '2023-06-01' };
const CON_CACHE = { ...BASE, 'anthropic-beta': 'prompt-caching-2024-07-31' };
const REFERENCIAS: { body: string; headers: Record<string, string> }[] = [
  { body: `{"model":"claude-haiku-4-5-20251001","max_tokens":4096,"temperature":0.1,"messages":[{"role":"user","content":"hola${SUFIJO}"}]}`, headers: BASE },
  { body: `{"model":"claude-haiku-5-5","max_tokens":16000,"messages":[{"role":"user","content":"hola${SUFIJO}"}],"output_config":{"effort":"medium"}}`, headers: BASE },
  { body: `{"model":"claude-sonnet-4-6","max_tokens":2048,"temperature":0,"messages":[{"role":"user","content":"hola${SUFIJO}"}],"system":[{"type":"text","text":"eres un verificador","cache_control":{"type":"ephemeral"}}]}`, headers: CON_CACHE },
  { body: '{"model":"claude-haiku-4-5-20251001","max_tokens":4096,"temperature":0.3,"messages":[{"role":"user","content":"texto libre"}]}', headers: BASE },
  { body: '{"model":"claude-haiku-4-5-20251001","max_tokens":4096,"temperature":0,"messages":[{"role":"user","content":"pregunta"},{"role":"assistant","content":"respuesta"},{"role":"user","content":"otra"}],"system":[{"type":"text","text":"sistema","cache_control":{"type":"ephemeral"}}]}', headers: CON_CACHE },
  { body: '{"model":"claude-sonnet-4-6","max_tokens":8192,"temperature":0,"system":[{"type":"text","text":"agente"}],"tools":[],"messages":[{"role":"user","content":"hola"}]}', headers: CON_CACHE },
];

const vistos: { body: string; headers: Record<string, string> }[] = [];
function simularApi() {
  vistos.length = 0;
  vi.stubGlobal('fetch', async (_u: string, init: { body: string; headers: Record<string, string> }) => {
    vistos.push({ body: init.body, headers: init.headers });
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"ok":true}' }], stop_reason: 'end_turn', usage: { input_tokens: 7, output_tokens: 3 } }) };
  });
}

/** Las seis llamadas de las referencias; `etiqueta` se añade a las que llevan opciones. */
async function lasSeis(etiqueta?: CallOptions['etiqueta']) {
  const e = etiqueta ? { etiqueta } : {};
  await callAnthropicJson('hola', { maxOutputTokens: 4096, temperature: 0.1, ...e });
  await callAnthropicJson('hola', { maxOutputTokens: 16000, sinTemperatura: true, modeloExacto: HAIKU_55_MODEL, outputConfig: { effort: 'medium' }, ...e });
  await callAnthropicJson('hola', { model: 'sonnet', system: 'eres un verificador', cacheSystem: true, maxOutputTokens: 2048, ...e });
  await callAnthropicText('texto libre', { temperature: 0.3, ...e });
  await callAnthropicWithUsage('', { messages: [{ role: 'user', content: 'pregunta' }, { role: 'assistant', content: 'respuesta' }, { role: 'user', content: 'otra' }], system: [{ type: 'text', text: 'sistema' }], cacheSystem: true, ...e });
  await callAnthropicAgent([{ type: 'text', text: 'agente' }], [{ role: 'user', content: 'hola' }], []);
}

function comparar() {
  expect(vistos).toHaveLength(REFERENCIAS.length);
  vistos.forEach((v, i) => {
    expect(v.body, `cuerpo ${i + 1}`).toBe(REFERENCIAS[i].body);
    const { 'x-api-key': clave, ...resto } = v.headers;
    const { 'x-api-key': _ref, ...restoRef } = REFERENCIAS[i].headers;
    expect(resto, `cabeceras ${i + 1}`).toEqual(restoRef);
    expect(Object.keys(v.headers), `orden de las cabeceras ${i + 1}`).toEqual(Object.keys(REFERENCIAS[i].headers));
    expect(clave === process.env.ANTHROPIC_API_KEY, `la clave de la cabecera ${i + 1} es la de la variable`).toBe(true);
  });
}

describe('la petición a la API, byte a byte contra el cliente de antes del 3.1.1', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('sin registro ni etiqueta: las seis peticiones, idénticas a la referencia', async () => {
    simularApi();
    await lasSeis();
    comparar();
  });

  it('con un registro abierto y una etiqueta: las seis, idénticas también (la etiqueta no viaja)', async () => {
    simularApi();
    const { registro } = await conRegistroDeLlamadas(() => lasSeis({ etapa: 'juez', pareja: '22222222-2222-2222-2222-222222222222' }));
    comparar();
    expect(registro.peticiones).toHaveLength(6);           // control positivo: el registro SÍ estaba abierto
  });
});
