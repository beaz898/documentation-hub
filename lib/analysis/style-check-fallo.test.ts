import { describe, it, expect, vi } from 'vitest';

const llamada = vi.fn();
vi.mock('./llm-client', () => ({
  callLLMJson: (...a: unknown[]) => llamada(...a),
}));

import { analyzeStyle } from './style-check';

/**
 * B.237, PUERTA 2 — «NO PUDE MIRAR» NO ES «NO HAY PROBLEMAS» (17/09/2026).
 *
 * Fichero aparte a propósito: `style-check.test.ts` resetea el mock en un
 * `beforeEach` de nivel superior, y en vitest 4 esa combinación hacía fallar con
 * el propio error los casos cuyo mock rechaza (§5.69). Aquí cada caso fija su
 * implementación.
 */

const TEXTO = 'Las consulltas telefónicas quedan registradas. a b c';

describe('⚠️ B.237 — un fallo del modelo ya no se presenta como documento limpio', () => {
  it('si el modelo falla, el resultado dice que NO SE PUDO MIRAR — y no trae lista', async () => {
    llamada.mockImplementation(async () => { throw new Error('529 overloaded'); });
    const r = await analyzeStyle(TEXTO, 'doc.txt');
    expect(r.estado).toBe('no_se_pudo_mirar');
    // Si alguien vuelve a devolver `problemas: []` en el fallo, cae aquí.
    expect(r).not.toHaveProperty('problemas');
  });

  it('si el modelo contesta, el resultado dice que SE MIRÓ, aunque no haya problemas', async () => {
    llamada.mockImplementation(async () => ({ problems: [] }));
    const r = await analyzeStyle(TEXTO, 'doc.txt');
    expect(r.estado).toBe('mirado');
    if (r.estado !== 'mirado') return;
    // Aquí la lista vacía SÍ significa «no hay problemas»: se miró.
    expect(r.problemas).toEqual([]);
  });
});
