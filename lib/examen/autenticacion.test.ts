import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * QUIÉN ACEPTA UN TOKEN POR CABECERA — condición (a) del arquitecto, 27/09/2026.
 *
 * Desde `2ac3bb33` (21/05) el producto autentica sólo por cookie. La excepción
 * es `/api/admin/examen`, que la llama un script. Si otra ruta vuelve a aceptar
 * Bearer, rojo.
 *
 * Censo por CAPACIDAD, no por nombre. Aceptar un token por cabecera exige dos
 * cosas, y se vigilan las dos:
 *   · LEER la cabecera `authorization` de la petición entrante.
 *   · VALIDAR un token de sesión: `auth.getUser(<algo>)` con argumento. Sin
 *     argumento es la cookie, que es el camino normal.
 * Las llamadas SALIENTES con `Authorization: Bearer` (Google, OneDrive,
 * Railway) no leen nada: escriben una cabecera, y no entran.
 */

function ficherosDeCodigo(): string[] {
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    for (const entrada of readdirSync(dir)) {
      if (entrada === 'node_modules' || entrada.startsWith('.')) continue;
      const ruta = join(dir, entrada);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.tsx?$/.test(entrada) && !/\.test\.tsx?$/.test(entrada)) salida.push(ruta.replace(/\\/g, '/'));
    }
  };
  for (const r of ['app', 'lib', 'components', 'worker']) recorrer(r);
  return salida;
}

const leenLaCabecera = () => ficherosDeCodigo()
  .filter(f => /headers\.get\(\s*['"]authorization['"]\s*\)/i.test(readFileSync(f, 'utf8')));

const validanUnToken = () => ficherosDeCodigo()
  .filter(f => /auth\.getUser\(\s*[^)\s]/.test(readFileSync(f, 'utf8')));

const EXAMEN = 'app/api/admin/examen/route.ts';

describe('el token de sesión por cabecera, sólo en el examen', () => {
  it('⚠️ CONTROL POSITIVO — los dos censos SÍ ven el endpoint del examen', () => {
    expect(leenLaCabecera()).toContain(EXAMEN);
    expect(validanUnToken()).toContain(EXAMEN);
  });

  it('nadie más valida un token de sesión', () => {
    const intrusos = validanUnToken().filter(f => f !== EXAMEN);
    expect(intrusos, `validan un token sin autorización: ${intrusos.join(', ')}`).toEqual([]);
  });

  it('nadie más lee la cabecera, salvo purge-expired con su secreto', () => {
    // `purge-expired` compara la cabecera con ADMIN_SECRET: no identifica a
    // ningún usuario ni cobra a nadie. Está en la lista con nombre para que un
    // tercero no pueda colarse a su sombra.
    const PERMITIDOS = [EXAMEN, 'app/api/admin/purge-expired/route.ts'];
    const intrusos = leenLaCabecera().filter(f => !PERMITIDOS.includes(f));
    expect(intrusos, `leen authorization sin autorización: ${intrusos.join(', ')}`).toEqual([]);
  });
});
