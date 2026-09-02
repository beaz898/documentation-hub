import { describe, expect, it } from 'vitest';

import { filaDeAveriaDeLimitador } from './usage-logger';

/**
 * EL LIMITADOR DEJA DE SER MUDO (regla 6, memoria del fallo, 02/09/2026).
 *
 * ⚠️ FALLAR ABIERTO ES LEGÍTIMO Y NO SE TOCA: cuando la consulta del limitador
 * falla, se deja pasar al usuario en vez de bloquearlo por un error nuestro.
 * Es una decisión de disponibilidad (F-94 P4). Lo ilegítimo era que nadie
 * supiera cuántas veces el limitador dejó de limitar.
 *
 * ⚠️ LO QUE NO SE PUEDE CONTAR, Y SE DECLARA: `checkRateLimit` LEE `usage_logs`
 * con el mismo cliente con el que esto ESCRIBE en `usage_logs`. Con Supabase
 * entero caído, el registro falla por la misma razón que la avería. Queda
 * cubierto el caso común —la consulta que falla con la base viva: un cambio de
 * esquema, una RLS, un timeout— y no el apagón completo, invisible desde
 * dentro por construcción.
 */

const COORDENADAS = {
  orgId: 'org-1',
  userId: 'user-1',
  endpoint: '/api/ask',
};

describe('filaDeAveriaDeLimitador — solo se registra lo que hay que registrar', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA, y es la que decide si esto sirve o estorba: un
   * limitador que funciona no escribe NADA. Sin este caso, un registro que
   * emitiera siempre pasaría verde y metería una fila por CADA llamada del
   * sistema — más ruido que el silencio que se viene a arreglar.
   */
  it('sin avería: ninguna fila', () => {
    expect(filaDeAveriaDeLimitador({ ...COORDENADAS })).toBeNull();
    expect(filaDeAveriaDeLimitador({ ...COORDENADAS, averia: undefined })).toBeNull();
  });

  it('consulta fallida: fila con éxito en falso y el motivo escrito', () => {
    const fila = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'consulta_fallida' });

    expect(fila).not.toBeNull();
    expect(fila!.success).toBe(false);
    expect(fila!.endpoint).toBe('/api/ask');
    expect(fila!.orgId).toBe('org-1');
    expect(fila!.errorMessage).toContain('limitador');
  });

  it('error inesperado: su propia fila', () => {
    const fila = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'error_inesperado' });

    expect(fila!.success).toBe(false);
    expect(fila!.errorMessage).toContain('limitador');
  });

  /**
   * ⚠️ LOS DOS MOTIVOS TIENEN QUE SER DISTINGUIBLES. Si fueran el mismo texto, la
   * fila existiría pero no diría cuál de los dos caminos se tomó — y entonces no
   * sirve para lo que se hace, que es saber POR QUÉ el limitador dejó de
   * limitar. Un registro que no distingue es silencio con más pasos.
   */
  it('los dos motivos no son el mismo texto', () => {
    const a = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'consulta_fallida' });
    const b = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'error_inesperado' });

    expect(a!.errorMessage).not.toBe(b!.errorMessage);
  });

  /**
   * TOKENS Y CRÉDITOS A CERO, y no es relleno: la avería ocurre ANTES de cobrar.
   * Una fila que dijera otra cosa mentiría en la analítica de costes, que lee
   * esta misma tabla.
   */
  it('no inventa consumo: cero tokens y cero créditos', () => {
    const fila = filaDeAveriaDeLimitador({ ...COORDENADAS, averia: 'consulta_fallida' });

    expect(fila!.inputTokens).toBe(0);
    expect(fila!.outputTokens).toBe(0);
    expect(fila!.creditsConsumed).toBe(0);
  });
});
