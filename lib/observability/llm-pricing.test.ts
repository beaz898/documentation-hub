import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeCostUsd } from './llm-pricing';

/**
 * 19/10/2026: la tabla tenía Haiku 4.5 a la cuarta parte de su precio y ninguna prueba lo vigilaba.
 * Y un modelo que no esté en la tabla cuesta 0 con un aviso en el log: el coste de todo lo que use
 * ese modelo desaparecería de llm_usage sin que nada se pusiera rojo.
 */

const CERO = { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
const M = 1_000_000;

/** Las cadenas que se mandan DE VERDAD a la API, leídas del cliente (no copiadas aquí a mano). */
function modelosQueSeEnvian(): string[] {
  const fuente = readFileSync('lib/llm/anthropic-client.ts', 'utf8');
  return [...fuente.matchAll(/const (?:HAIKU|SONNET)_MODEL\s*=\s*'([^']+)'/g)].map(m => m[1]);
}

describe('la tabla de precios', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('cada modelo que se envía a la API tiene precio (si no, su coste sería 0 en silencio)', () => {
    const modelos = modelosQueSeEnvian();
    expect(modelos).toHaveLength(2);
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const m of modelos) expect(computeCostUsd(m, { ...CERO, inputTokens: M }), m).toBeGreaterThan(0);
    expect(aviso).not.toHaveBeenCalled();
  });

  it('⚠️ CONTROL POSITIVO — un modelo que no está en la tabla da 0 y avisa', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(computeCostUsd('claude-modelo-que-no-existe', { ...CERO, inputTokens: M })).toBe(0);
    expect(aviso).toHaveBeenCalledTimes(1);
  });

  it('Haiku 4.5: 1 $ de entrada, 5 $ de salida, 1,25 $ de escritura y 0,10 $ de lectura de caché por millón', () => {
    const h = 'claude-haiku-4-5-20251001';
    expect(computeCostUsd(h, { ...CERO, inputTokens: M })).toBeCloseTo(1.0, 10);
    expect(computeCostUsd(h, { ...CERO, outputTokens: M })).toBeCloseTo(5.0, 10);
    expect(computeCostUsd(h, { ...CERO, cacheCreationTokens: M })).toBeCloseTo(1.25, 10);
    expect(computeCostUsd(h, { ...CERO, cacheReadTokens: M })).toBeCloseTo(0.1, 10);
  });
});
