import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { permisoDeLanzar } from './permiso-de-lanzar.mjs';

/**
 * `--lanzar=<créditos>` (28/09/2026). Caso decisivo: un número distinto del
 * calculado NO lanza. ⚠️ Ninguna prueba ejecuta el ejecutor con `--lanzar`: si
 * un mutante aceptara el número, la prueba abriría la sesión real y gastaría.
 */

describe('el permiso de lanzar', () => {
  it('sin --lanzar es seco', () => {
    expect(permisoDeLanzar(['--caso', 'N1'], 25)).toEqual({ lanzar: false });
  });
  it('con el coste exacto, lanza', () => {
    expect(permisoDeLanzar(['--caso', 'N1', '--lanzar=25'], 25)).toEqual({ lanzar: true });
  });
  it.each([24, 26, 250, 0])('CASO DECISIVO: --lanzar=%i contra 25 no lanza, e imprime los dos números', n => {
    const r = permisoDeLanzar([`--lanzar=${n}`], 25);
    expect(r.lanzar).toBeUndefined();
    expect(r.error).toContain(`--lanzar=${n}`);
    expect(r.error).toContain('es 25');
  });
  it.each([
    ['sin número', ['--lanzar']],
    ['número suelto detrás', ['--lanzar', '25']],
    ['no entero', ['--lanzar=25.0']],
    ['vacío', ['--lanzar=']],
    ['repetido, aunque los dos cuadren', ['--lanzar=25', '--lanzar=25']],
  ])('falla cerrado: %s', (_, argv) => {
    const r = permisoDeLanzar(argv, 25);
    expect(r.lanzar).toBeUndefined();
    expect(r.error).toContain('es 25');
  });
  it('--lanzar a secas no vale aunque el coste fuera 0 (hoy no se alcanza; es lo que distingue la forma del número)', () => {
    expect(permisoDeLanzar(['--lanzar'], 0).lanzar).toBeUndefined();
  });
});

describe('el ejecutor lo usa (lectura del fuente, sin ejecutarlo)', () => {
  const fuente = readFileSync('scripts/examen.mjs', 'utf8');
  it('decide con el permiso sobre el coste de la selección, y ya no hay otra puerta', () => {
    expect(fuente).toContain('permisoDeLanzar(argv, costeDe(casos).creditos)');
    expect(fuente).not.toMatch(/argv\.includes\('--lanzar'\)/);
    expect(fuente).not.toMatch(/\bLANZAR\b/);
  });
  it('el error sale antes de abrir la sesión', () => {
    expect(fuente.indexOf('if (permiso.error)')).toBeGreaterThan(-1);
    expect(fuente.indexOf('if (permiso.error)')).toBeLessThan(fuente.indexOf('await abrirSesion()'));
  });
});
