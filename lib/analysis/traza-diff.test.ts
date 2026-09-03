import { describe, expect, it } from 'vitest';

import { lineaDeAgregado, lineaDeCandidato } from './traza-diff';

/**
 * F-102 — todo registro por-unidad imprime además su AGREGADO.
 *
 * ⚠️ Estos casos no comprueban que el pipeline llame a estas funciones ni que
 * las cifras sean ciertas: comprueban que LA CIFRA PARCIAL NUNCA APARECE SOLA.
 * Es lo único que se puede fijar aquí, y es lo que falló.
 */

describe('la línea de un candidato nunca va sin su acumulado', () => {
  it('lleva el candidato, lo suyo y lo acumulado', () => {
    const l = lineaDeCandidato({
      candidato: 'OPE-11.xlsx', parejas: 1, emitidas: 15,
      emitidasAcumuladas: 15, candidatoNumero: 1,
    });
    expect(l).toContain('OPE-11.xlsx');
    expect(l).toContain('candidato 1');
    expect(l).toContain('15 discrepancia(s) emitida(s)');
    expect(l).toContain('acumuladas: 15');
  });

  /**
   * ⚠️ EL CASO DEL INCIDENTE: el segundo candidato dice lo suyo Y el total que
   * va. Quien lea solo esta línea ya no puede confundir la parte con el todo.
   */
  it('el segundo candidato enseña la suma, no solo lo suyo', () => {
    const l = lineaDeCandidato({
      candidato: 'SIEMBRA.md', parejas: 1, emitidas: 10,
      emitidasAcumuladas: 25, candidatoNumero: 2,
    });
    expect(l).toContain('10 discrepancia(s)');
    expect(l).toContain('acumuladas: 25');
  });

  it('el acumulado siempre aparece, aunque coincida con lo suyo', () => {
    const l = lineaDeCandidato({
      candidato: 'X', parejas: 1, emitidas: 3, emitidasAcumuladas: 3, candidatoNumero: 1,
    });
    expect(l).toContain('acumuladas: 3');
  });
});

describe('el agregado se imprime SIEMPRE, incluso con un candidato', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA. La tentación es callarlo cuando es redundante, y es
   * justo entonces cuando enseña a leer mal: si el total solo sale con dos o
   * más, el lector aprende que la línea suelta es el total — y vuelve el fallo,
   * con el log dándole la razón.
   */
  it('con un solo candidato también dice TOTAL', () => {
    const l = lineaDeAgregado({ candidatos: 1, parejasTotales: 1, emitidasTotales: 15 });
    expect(l).toContain('TOTAL: 15');
    expect(l).toContain('1 candidato(s)');
  });

  it('con dos candidatos dice la suma', () => {
    const l = lineaDeAgregado({ candidatos: 2, parejasTotales: 2, emitidasTotales: 25 });
    expect(l).toContain('TOTAL: 25');
    expect(l).toContain('2 candidato(s)');
  });

  it('cero también se dice', () => {
    expect(lineaDeAgregado({ candidatos: 0, parejasTotales: 0, emitidasTotales: 0 })).toContain('TOTAL: 0');
  });
});
