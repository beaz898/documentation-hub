import { describe, expect, it } from 'vitest';
import { aplicar, clasificar, mutar, problemasDeLasAnclas, type Definicion } from './mutar';

/**
 * LA PRUEBA DEL GENERADOR DE MUTANTES (26/10/2026). Con un disco y un arnés falsos: no lanza vitest ni toca ficheros.
 * Cada caso es una de las formas en que un generador improvisado ya falló alguna vez.
 */
const DEF = (mutantes: Definicion['mutantes'], tests = 3): Definicion =>
  ({ fichero: 'x.sql', arnes: 'claude/arneses/x', proyecto: 'arneses', tests, mutantes });

function disco(inicial: string) {
  const escrito: string[] = [];
  let actual = inicial;
  return {
    escrito,
    actual: () => actual,
    leer: () => actual,
    escribir: (_f: string, t: string) => { actual = t; escrito.push(t); },
  };
}

describe('el generador de mutantes', () => {
  it('UN ANCLA QUE NO APARECE, O QUE APARECE DOS VECES, PARA TODO ANTES DE ESCRIBIR NADA', () => {
    const d = disco('WHERE a = 1;\nWHERE a = 1;\nWHERE b = 2;\n');
    const def = DEF([
      { nombre: 'bueno', ancla: 'WHERE b = 2', cambio: 'WHERE true' },
      { nombre: 'repetido', ancla: 'WHERE a = 1', cambio: 'WHERE true' },
      { nombre: 'ausente', ancla: 'WHERE c = 3', cambio: 'WHERE true' },
    ]);
    expect(() => mutar(def, { ...d, correr: () => 'Tests  1 failed (3)' })).toThrow(/aparece 2 veces[\s\S]*aparece 0 veces/);
    expect(d.escrito).toHaveLength(0);
  });

  it('UN CAMBIO QUE CONTIENE AL ANCLA NO SE ACEPTA: no se distinguiría de no aplicarlo', () => {
    expect(problemasDeLasAnclas('SELECT 1;', [{ nombre: 'añade', ancla: 'SELECT 1', cambio: 'SELECT 1 UNION SELECT 2' }]))
      .toEqual(['«añade»: el cambio contiene al ancla, y no se distinguiría de no aplicarlo']);
  });

  it('LOS SALTOS DE LÍNEA: un ancla escrita con \\n casa en un fichero CRLF, y el cambio sale en CRLF', () => {
    const original = 'WITH p AS (\r\n  SELECT 1\r\n)\r\nSELECT 2;\r\n';
    const m = { nombre: 'm', ancla: '  SELECT 1\n)', cambio: '  SELECT 9\n)' };
    expect(problemasDeLasAnclas(original, [m])).toEqual([]);
    expect(aplicar(original, m)).toBe('WITH p AS (\r\n  SELECT 9\r\n)\r\nSELECT 2;\r\n');
  });

  it('CADA MUTANTE SE APLICA SOBRE EL ORIGINAL, NO SOBRE EL ANTERIOR, y al final vuelven los bytes', () => {
    const d = disco('A;B;');
    const vistos: string[] = [];
    const informe = mutar(DEF([
      { nombre: 'a', ancla: 'A;', cambio: 'x;' },
      { nombre: 'b', ancla: 'B;', cambio: 'y;' },
    ]), { ...d, correr: () => { vistos.push(d.actual()); return 'Tests  1 failed | 2 passed (3)'; } });
    expect(vistos).toEqual(['x;B;', 'A;y;']);
    expect(d.actual()).toBe('A;B;');
    expect(informe.huellaAntes).toBe(informe.huellaDespues);
    expect(informe.resultados.map(r => r.rojo)).toEqual([true, true]);
  });

  it('SI EL ARNÉS REVIENTA A MITAD, EL FICHERO VUELVE IGUAL (el finally)', () => {
    const d = disco('A;B;');
    expect(() => mutar(DEF([{ nombre: 'a', ancla: 'A;', cambio: 'x;' }]),
      { ...d, correr: () => { throw new Error('se cayó vitest'); } })).toThrow('se cayó vitest');
    expect(d.actual()).toBe('A;B;');
  });

  it('LA CLASIFICACIÓN: rojo sólo con fallos, con TODOS los tests cargados y sin saltados', () => {
    expect(clasificar(' Tests  1 failed | 2 passed (3)\n', 3)).toEqual({ rojo: true, linea: '1 failed | 2 passed (3)' });
    expect(clasificar(' Tests  3 passed (3)\n', 3).rojo).toBe(false);
    expect(clasificar(' Tests  1 failed | 1 passed (2)\n', 3).rojo).toBe(false);
    expect(clasificar(' Tests  3 skipped (3)\n', 3).rojo).toBe(false);
    expect(clasificar(' Tests  1 failed | 2 skipped (3)\n', 3).rojo).toBe(false);
    expect(clasificar('Error: no se pudo cargar el fichero', 3)).toEqual({ rojo: false, linea: '(sin línea de Tests: el arnés no llegó a correr)' });
  });

  it('una definición sin mutantes no pasa por buena', () => {
    expect(problemasDeLasAnclas('x', [])).toEqual(['la definición no tiene ningún mutante']);
  });
});
