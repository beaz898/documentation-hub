import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/llm/rate-limiter', () => ({
  acquireRateLimit: async () => '0',
  recordUsage: async () => {},
  currentWindowStart: () => '0',
  EST_OUTPUT_TOKENS: { json: 1000, texto: 1000, agent: 1000 },
}));

import { callAnthropicJson } from '@/lib/llm/anthropic-client';
import { HAIKU_MODEL } from '@/lib/llm/modelos';
import { usageContext, type UsageAccumulator } from './usage-context';
import { TOPE_DE_PETICIONES_CON_DETALLE, apuntarPeticion, conRegistroDeLlamadas } from './registro-de-llamadas';

/** Respuestas de la API, en orden: 'ok', un estado HTTP, 'red' (el fetch lanza) o 'roto' (200 con texto que no es JSON). */
function simularApi(respuestas: ('ok' | number | 'red' | 'roto')[]) {
  const cola = [...respuestas];
  vi.stubGlobal('fetch', async () => {
    const r = cola.shift() ?? 'ok';
    if (r === 'red') throw new Error('ECONNRESET');
    if (typeof r === 'number') return { ok: false, status: r, text: async () => 'sobrecargado' };
    const texto = r === 'roto' ? 'esto no es json' : '{"ok":true}';
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: texto }], usage: { input_tokens: 70, output_tokens: 30, cache_creation_input_tokens: 5, cache_read_input_tokens: 2 } }) };
  });
}
/** Corre `fn` adelantando el reloj falso, para que las esperas entre intentos no cuesten 2 s de verdad. */
async function conReloj<T>(fn: () => Promise<T>): Promise<T> {
  vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
  const p = fn();
  for (let i = 0; i < 20; i++) await vi.advanceTimersByTimeAsync(25_000);
  return p;
}

describe('el registro por llamada al modelo (3.1.1, paso 2)', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('una petición que sale bien: etapa, pareja, modelo, intento, las cuatro cifras y la estimación', async () => {
    simularApi(['ok']);
    const { registro } = await conRegistroDeLlamadas(() => callAnthropicJson('hola', { etiqueta: { etapa: 'juez', pareja: 'id-del-candidato' } }));
    expect(registro.peticiones).toHaveLength(1);
    const p = registro.peticiones[0];
    expect(p).toMatchObject({ n: 1, etapa: 'juez', pareja: 'id-del-candidato', modelo: HAIKU_MODEL, vuelta: 1, intento: 1, resultado: 'ok', estadoHttp: 200,
      tokens: { entrada: 70, salida: 30, escrituraCache: 5, lecturaCache: 2 } });
    expect(p.entradaEstimada).toBeGreaterThan(0);
    expect(p.latenciaMs).toBeGreaterThanOrEqual(0);
    expect(registro.sinEtapa).toBe(0);
  });

  it('POR PETICIÓN REAL: un 429 y luego bien son dos entradas, con su intento', async () => {
    simularApi([429, 'ok']);
    const { registro } = await conReloj(() => conRegistroDeLlamadas(() => callAnthropicJson('hola', { etiqueta: { etapa: 'rerank' } })));
    expect(registro.peticiones.map(p => [p.intento, p.resultado, p.estadoHttp ?? null, p.tokens.entrada])).toEqual([[1, 'http', 429, 0], [2, 'ok', 200, 70]]);
  });

  it('LA ESPERA: 0 en el primer intento, el backoff en los siguientes, y la pausa de 1,5 s antes de la vuelta 2', async () => {
    simularApi([429, 529, 'roto', 'ok']);
    const { registro } = await conReloj(() => conRegistroDeLlamadas(() => callAnthropicJson('hola', { etiqueta: { etapa: 'juez' } })));
    expect(registro.peticiones.map(p => [p.vuelta, p.intento, p.esperaMs])).toEqual([[1, 1, 0], [1, 2, 2000], [1, 3, 5000], [2, 1, 1500]]);
  });

  it('LA SUMA RECONSTRUYE EL RELOJ DE PARED de una llamada: espera más latencia, entrada a entrada', async () => {
    // una API que tarda 300 ms en contestar cada petición, con dos 429 delante
    const cola: (number | 'ok')[] = [429, 429, 'ok'];
    vi.stubGlobal('fetch', async () => {
      await new Promise(r => setTimeout(r, 300));
      const r = cola.shift();
      if (typeof r === 'number') return { ok: false, status: r, text: async () => '' };
      return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"ok":true}' }], usage: { input_tokens: 1, output_tokens: 1 } }) };
    });
    const { registro, pared } = await conReloj(async () => {
      const t0 = Date.now();
      const { registro } = await conRegistroDeLlamadas(() => callAnthropicJson('hola', { etiqueta: { etapa: 'juez' } }));
      return { registro, pared: Date.now() - t0 };
    });
    const suma = registro.peticiones.reduce((s, p) => s + p.esperaMs + p.latenciaMs, 0);
    expect(registro.peticiones.map(p => [p.esperaMs, p.latenciaMs])).toEqual([[0, 300], [2000, 300], [5000, 300]]);
    expect(suma).toBe(pared);                                  // 7.900 ms: 7.000 de backoff que sin la espera no se verían
    // y comienzoMs coloca cada petición en la línea de tiempo del registro
    expect(registro.peticiones.map(p => p.comienzoMs)).toEqual([0, 300, 2600]);
  });

  it('un fallo de red es su propia entrada, sin estado HTTP', async () => {
    simularApi(['red', 'ok']);
    const { registro } = await conReloj(() => conRegistroDeLlamadas(() => callAnthropicJson('hola', { etiqueta: { etapa: 'sintesis' } })));
    expect(registro.peticiones.map(p => [p.intento, p.resultado, p.estadoHttp ?? null])).toEqual([[1, 'red', null], [2, 'ok', 200]]);
  });

  it('la repetición por JSON mal formado es la vuelta 2', async () => {
    simularApi(['roto', 'ok']);
    const { registro } = await conReloj(() => conRegistroDeLlamadas(() => callAnthropicJson('hola', { etiqueta: { etapa: 'verificador' } })));
    expect(registro.peticiones.map(p => [p.vuelta, p.intento, p.resultado])).toEqual([[1, 1, 'ok'], [2, 1, 'ok']]);
  });

  it('una llamada sin etiqueta se apunta como sin_etapa y se cuenta una vez, aunque reintente', async () => {
    simularApi([529, 'ok']);
    const { registro } = await conReloj(() => conRegistroDeLlamadas(() => callAnthropicJson('hola', {})));
    expect(registro.peticiones.map(p => p.etapa)).toEqual(['sin_etapa', 'sin_etapa']);
    expect(registro.sinEtapa).toBe(1);
  });

  it('NI UNA PALABRA DEL CONTENIDO: ni el prompt, ni la respuesta, y sólo los campos declarados', async () => {
    simularApi(['ok']);
    const MARCA = 'TEXTO-DEL-CLIENTE-QUE-NO-PUEDE-SALIR';
    const { registro } = await conRegistroDeLlamadas(() => callAnthropicJson(`${MARCA} con más texto`, { system: MARCA, etiqueta: { etapa: 'juez', pareja: 'id' } }));
    const s = JSON.stringify(registro);
    expect(s).not.toContain(MARCA);
    expect(s).not.toContain('"ok":true');                      // la respuesta del modelo tampoco
    expect(Object.keys(registro.peticiones[0]).sort()).toEqual(
      ['comienzoMs', 'entradaEstimada', 'esperaMs', 'estadoHttp', 'etapa', 'intento', 'latenciaMs', 'modelo', 'n', 'pareja', 'resultado', 'tokens', 'vuelta']);
  });

  it('LA SUMA POR MODELO NO CAMBIA: con y sin registro, el acumulador de uso da lo mismo', async () => {
    simularApi(['ok', 'ok']);
    const sin: UsageAccumulator = new Map(), con: UsageAccumulator = new Map();
    await usageContext.run(sin, () => callAnthropicJson('hola', {}));
    await usageContext.run(con, () => conRegistroDeLlamadas(() => callAnthropicJson('hola', { etiqueta: { etapa: 'juez' } })));
    expect([...con.entries()]).toEqual([...sin.entries()]);
    expect(sin.get(HAIKU_MODEL)).toEqual({ inputTokens: 70, outputTokens: 30, cacheCreationTokens: 5, cacheReadTokens: 2 });
  });

  it('sin registro abierto no se apunta nada, y la llamada sale igual', async () => {
    simularApi(['ok']);
    await expect(callAnthropicJson('hola', { etiqueta: { etapa: 'juez' } })).resolves.toEqual({ ok: true });
  });

  it(`LA GUARDA: las ${TOPE_DE_PETICIONES_CON_DETALLE} primeras con detalle y el resto agregado, diciéndolo en el dato`, async () => {
    const { registro } = await conRegistroDeLlamadas(async () => {
      for (let i = 0; i < TOPE_DE_PETICIONES_CON_DETALLE + 5; i++)
        apuntarPeticion({ etiqueta: { etapa: 'juez' }, modelo: 'm', vuelta: 1 },
          { intento: 1, resultado: 'ok', latenciaMs: 10, tokens: { entrada: 100, salida: 10, escrituraCache: 1, lecturaCache: 2 }, esperaMs: 3, comienzo: Date.now() });
    });
    expect(registro.peticiones).toHaveLength(TOPE_DE_PETICIONES_CON_DETALLE);
    expect(registro.peticiones[TOPE_DE_PETICIONES_CON_DETALLE - 1].n).toBe(TOPE_DE_PETICIONES_CON_DETALLE);
    expect(registro.fueraDelDetalle).toEqual({ peticiones: 5, tokens: { entrada: 500, salida: 50, escrituraCache: 5, lecturaCache: 10 }, latenciaMs: 50, esperaMs: 15 });
  });

  it('y por debajo de la guarda no hay nada agregado', async () => {
    const { registro } = await conRegistroDeLlamadas(async () => {
      apuntarPeticion({ modelo: 'm', vuelta: 1 }, { intento: 1, resultado: 'ok', latenciaMs: 1, tokens: { entrada: 1, salida: 1, escrituraCache: 0, lecturaCache: 0 }, esperaMs: 0, comienzo: Date.now() });
    });
    expect(registro.fueraDelDetalle).toBeNull();
  });
});
