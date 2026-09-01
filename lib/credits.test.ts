import { describe, expect, it } from 'vitest';

import { debeDevolverse } from './credits';

/**
 * LA MITAD SIMÉTRICA DEL COBRO (regla 6, 01/09/2026).
 *
 * QUÉ VIGILA: `CLAUDE.md` manda descontar créditos ANTES de la operación —
 * correcto, porque hacerlo después deja que dos peticiones paralelas
 * sobregiren—. Pero esa regla tenía una mitad que nadie escribió: **quien cobra
 * por adelantado devuelve si no entrega**. Hasta hoy solo la cumplían
 * `/api/analyze-v2` y el agente. `/api/ask`, `/api/analyze-style` y
 * `/api/improve` cobraban y no devolvían nunca: si Pinecone o Anthropic caían,
 * el usuario pagaba por un error que no era suyo, y el reintento le costaba
 * otro crédito.
 *
 * ⚠️ LO QUE ESTA BATERÍA NO PUEDE COMPROBAR, declarado: que las CUATRO salidas
 * de no entrega llamen a esto. Las rutas de API están fuera del alcance de
 * Vitest (protocolo §1-bis) y ningún caso puede entrar en un `catch` de
 * `app/api/**`. Lo que se vigila aquí es el CRITERIO; que se use se comprueba
 * por lectura y por `grep`, y queda dicho en vez de fingido.
 */
describe('debeDevolverse — se devuelve si no se entrega', () => {
  it('fallo después de cobrar: se devuelve', () => {
    expect(debeDevolverse({ entregado: false, creditosCobrados: 1 })).toBe(true);
    expect(debeDevolverse({ entregado: false, creditosCobrados: 30 })).toBe(true);
  });

  /**
   * ⚠️ LA MITAD QUE EVITA PASARSE DE FRENADA. Sin este caso, un criterio que
   * devolviera SIEMPRE pasaría igual de verde — y regalaría el producto entero:
   * cada consulta contestada saldría gratis.
   */
  it('operación que SÍ entrega: no se devuelve nada', () => {
    expect(debeDevolverse({ entregado: true, creditosCobrados: 1 })).toBe(false);
    expect(debeDevolverse({ entregado: true, creditosCobrados: 30 })).toBe(false);
  });

  /**
   * ⚠️ Y LA OTRA MITAD: FALLAR ANTES DE COBRAR NO DA DERECHO A NADA. Es un caso
   * frecuente, no un borde: las tres rutas inicializan su contador a 0 y solo lo
   * asignan DESPUÉS de `consumeCredits`, así que un fallo por org sin resolver,
   * por límite de tasa o por saldo insuficiente llega aquí con cero.
   * Sin esta condición, quedarse sin créditos REGALARÍA créditos.
   */
  it('fallo ANTES de cobrar: no se devuelve nada', () => {
    expect(debeDevolverse({ entregado: false, creditosCobrados: 0 })).toBe(false);
  });

  /** Ni siquiera un importe negativo —que no debería existir— saca créditos de
   *  la nada: la condición es «se cobró algo», no «se conoce el importe». */
  it('un importe imposible no inventa un reembolso', () => {
    expect(debeDevolverse({ entregado: false, creditosCobrados: -5 })).toBe(false);
  });

  /**
   * LAS CUATRO COMBINACIONES, juntas y a la vista: es una tabla de verdad de dos
   * entradas y sale más barato leerla que deducirla de los casos de arriba.
   */
  it('la tabla entera: solo una de las cuatro devuelve', () => {
    const casos = [
      { entregado: false, creditosCobrados: 1, esperado: true },
      { entregado: false, creditosCobrados: 0, esperado: false },
      { entregado: true, creditosCobrados: 1, esperado: false },
      { entregado: true, creditosCobrados: 0, esperado: false },
    ];

    for (const c of casos) {
      expect(debeDevolverse(c), JSON.stringify(c)).toBe(c.esperado);
    }
  });
});
