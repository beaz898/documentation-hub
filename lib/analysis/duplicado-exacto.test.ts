import { describe, it, expect } from 'vitest';
import { esDuplicadoExacto } from './duplicado-exacto';

/**
 * ⚠️ LO QUE ESTA BATERÍA VIGILA NO ES QUE DIGA «SÍ» CUANDO TOCA: es que NO lo
 * diga cuando no toca. Anunciar «idéntico» sobre un parecido muy alto sería el
 * mismo fallo de hoy —un texto que no corresponde a lo que el sistema sabe— con
 * el signo cambiado, y encima en la dirección que asusta al usuario.
 */

const EXACTO = { isDuplicate: true, duplicateConfidence: 100, recommendation: 'NO_INDEXAR' };

describe('lo que SÍ es exacto', () => {
  it('las tres señales juntas', () => {
    expect(esDuplicadoExacto(EXACTO)).toBe(true);
  });
});

describe('⚠️ lo que NO lo es — cada una quitando UNA sola señal', () => {
  it('confianza alta pero no total', () => {
    expect(esDuplicadoExacto({ ...EXACTO, duplicateConfidence: 99 })).toBe(false);
  });

  it('confianza total pero la recomendación no es NO_INDEXAR', () => {
    // El caso real que esto protege: un solapamiento del 100 % que sigue
    // aportando información nueva. Se parece mucho; no es el mismo texto.
    expect(esDuplicadoExacto({ ...EXACTO, recommendation: 'REVISAR' })).toBe(false);
  });

  it('sin la marca de duplicado', () => {
    expect(esDuplicadoExacto({ ...EXACTO, isDuplicate: false })).toBe(false);
  });
});

describe('entradas que no son un análisis', () => {
  it('nulo, indefinido y vacío no revientan ni afirman', () => {
    expect(esDuplicadoExacto(null)).toBe(false);
    expect(esDuplicadoExacto(undefined)).toBe(false);
    expect(esDuplicadoExacto({})).toBe(false);
  });
});
