import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * PGLITE NO ENTRA EN EL PRODUCTO, NUNCA (arquitecto, 19/10/2026: condición para admitirla).
 * Es dependencia de DESARROLLO y sólo la importan los arneses de `claude/arneses/`. Este censo
 * recorre todo el árbol de código —por capacidad, no por nombre: cualquier fichero que la
 * nombre en un import o un require— y exige que sólo aparezca bajo `claude/arneses/`.
 */
const EXTENSIONES = /\.(ts|tsx|js|jsx|mjs|cjs|mts|cts)$/;
const FUERA = new Set(['node_modules', '.next', '.git', '.vercel', 'dist', 'build', 'coverage']);
const IMPORTA = /(from\s+['"]@electric-sql\/pglite|require\(\s*['"]@electric-sql\/pglite|import\(\s*['"]@electric-sql\/pglite)/;

function ficheros(dir: string, fuera: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (FUERA.has(e.name)) continue;
    const ruta = join(dir, e.name);
    if (e.isDirectory()) ficheros(ruta, fuera);
    else if (EXTENSIONES.test(e.name)) fuera.push(ruta.replaceAll('\\', '/'));
  }
  return fuera;
}

describe('PGlite, sólo en los arneses', () => {
  it('ningún fichero fuera de claude/arneses/ la importa', () => {
    const todos = ficheros('.');
    const quien = todos.filter(f => IMPORTA.test(readFileSync(f, 'utf8')));
    // control positivo: los dos arneses la importan, así que el censo VE los imports
    expect(quien.filter(f => f.startsWith('claude/arneses/')).length).toBeGreaterThanOrEqual(2);
    expect(quien.filter(f => !f.startsWith('claude/arneses/'))).toEqual([]);
  }, 60_000);
});
