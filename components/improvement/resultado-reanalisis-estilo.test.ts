import { describe, it, expect } from 'vitest';
import { clasificarRespuestaDeEstilo, mensajeDelReanalisisDeEstilo } from './resultado-reanalisis-estilo';

/**
 * B.237, PUERTA 3 (17/09/2026). Lo que se vigila es una sola cosa: que ninguna
 * respuesta que NO sea un reanálisis hecho pueda decir «He reanalizado».
 */

describe('clasificarRespuestaDeEstilo — el código del servidor dice qué pasó', () => {
  it('200 es ok', () => {
    expect(clasificarRespuestaDeEstilo(200, { success: true })).toEqual({ estado: 'ok' });
  });

  it('⚠️ 503 con estilo_no_analizado es NO SE PUDO MIRAR, no «sin cambios»', () => {
    expect(clasificarRespuestaDeEstilo(503, { errorType: 'estilo_no_analizado' }))
      .toEqual({ estado: 'no_se_pudo_mirar' });
  });

  it('un 503 sin ese tipo no se atribuye a una causa que no dice', () => {
    expect(clasificarRespuestaDeEstilo(503, {})).toEqual({ estado: 'error' });
  });

  it('402, 429 y 400 tienen cada uno su causa', () => {
    expect(clasificarRespuestaDeEstilo(402, { errorType: 'no_credits' })).toEqual({ estado: 'sin_creditos' });
    expect(clasificarRespuestaDeEstilo(429, {})).toEqual({ estado: 'limite' });
    expect(clasificarRespuestaDeEstilo(400, { error: 'Texto insuficiente' })).toEqual({ estado: 'texto_insuficiente' });
  });

  it('un 500 o un cuerpo ilegible es error, sin causa', () => {
    expect(clasificarRespuestaDeEstilo(500, null)).toEqual({ estado: 'error' });
  });
});

describe('mensajeDelReanalisisDeEstilo — sólo un reanálisis hecho dice «He reanalizado»', () => {
  it('⚠️ NINGÚN estado de fallo dice «He reanalizado» ni «No hay cambios»', () => {
    const fallos = ['no_se_pudo_mirar', 'sin_creditos', 'limite', 'texto_insuficiente', 'error'] as const;
    for (const estado of fallos) {
      const m = mensajeDelReanalisisDeEstilo({ estado }, 5);
      expect(m).not.toContain('He reanalizado');
      expect(m).not.toContain('No hay cambios');
      expect(m).toContain('No he podido reanalizar');
    }
  });

  it('⚠️ el fallo del modelo dice que no se cobró y que la lista sigue — nunca «resueltos»', () => {
    const m = mensajeDelReanalisisDeEstilo({ estado: 'no_se_pudo_mirar' }, 8);
    expect(m).toContain('No se te ha cobrado');
    expect(m).toContain('tu lista anterior sigue aquí');
    expect(m).not.toContain('resuelto');
  });

  it('sin créditos no afirma que no se cobró: ahí no hubo cobro que hacer, y se dice la causa', () => {
    const m = mensajeDelReanalisisDeEstilo({ estado: 'sin_creditos' }, 3);
    expect(m).toContain('no quedan créditos');
  });

  it('un error sin causa no promete nada sobre el cobro', () => {
    expect(mensajeDelReanalisisDeEstilo({ estado: 'error' }, 3)).not.toContain('cobrado');
  });

  it('ok sin cambios', () => {
    expect(mensajeDelReanalisisDeEstilo({ estado: 'ok', problemas: [1, 2] }, 2))
      .toBe('He reanalizado el estilo. No hay cambios respecto al análisis anterior.');
  });

  it('ok con nuevos y con resueltos, singular y plural', () => {
    expect(mensajeDelReanalisisDeEstilo({ estado: 'ok', problemas: [1, 2, 3] }, 2))
      .toBe('He reanalizado el estilo. 1 problema nuevo, 3 pendientes en total.');
    expect(mensajeDelReanalisisDeEstilo({ estado: 'ok', problemas: [] }, 2))
      .toBe('He reanalizado el estilo. 2 problemas resueltos, 0 pendientes en total.');
  });
});
