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

/**
 * EL ÁRBOL SE LEE UNA SOLA VEZ para los tres casos (02/10/2026, B.286).
 * Antes cada censo volvía a recorrer y a leer los ~290 ficheros: cuatro veces
 * el mismo trabajo, y un rojo cada vez que el disco venía frío.
 */
let codigoLeido: Array<{ ruta: string; texto: string }> | null = null;
function codigo(): Array<{ ruta: string; texto: string }> {
  if (codigoLeido === null) {
    codigoLeido = ficherosDeCodigo().map(ruta => ({ ruta, texto: readFileSync(ruta, 'utf8') }));
  }
  return codigoLeido;
}

const leenLaCabecera = () => codigo()
  .filter(f => /headers\.get\(\s*['"]authorization['"]\s*\)/i.test(f.texto))
  .map(f => f.ruta);

const validanUnToken = () => codigo()
  .filter(f => /auth\.getUser\(\s*[^)\s]/.test(f.texto))
  .map(f => f.ruta);

const EXAMEN = 'app/api/admin/examen/route.ts';

/**
 * ⚠️ UNA GUARDA CONTRA CUELGUES, NO UN REQUISITO DE RENDIMIENTO.
 * Este fichero recorre y lee el código del repositorio: E/S de disco, cuyo
 * tiempo depende de la caché (0,1-0,3 s en caliente; hasta 20 s medidos con la
 * máquina cargada, B.286). Lo que afirma es un CENSO —qué ficheros leen la
 * cabecera o validan un token—, no una velocidad. Por eso no usa el tope global
 * (`vitest.config.mts`), pensado para funciones puras sin E/S: lleva el suyo,
 * generoso, que sólo existe para que un cuelgue de verdad no deje la suite
 * esperando para siempre. Si algún día se acerca a él, el problema no es el tope.
 */
const TOPE_CONTRA_CUELGUES_MS = 120_000;

describe('el token de sesión por cabecera, sólo en el examen', { timeout: TOPE_CONTRA_CUELGUES_MS }, () => {
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
