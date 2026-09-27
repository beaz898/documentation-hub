import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { cargarCasos, validarCasos } from './examen.mjs';
import { lineasDelVeredicto } from '../lib/examen/veredicto.mjs';

/**
 * REPUNTÚA UNA TANDA YA GUARDADA, SIN RELANZAR Y SIN GASTAR (27/09/2026).
 *
 *   node scripts/examen-repuntuar.mjs examen/resultados/2026-09-27_c39397e7
 *
 * Lee los crudos de la carpeta, los pasa por el marcador ACTUAL y escribe
 * `informe-repuntuado_<commit>.txt` al lado. **No toca `informe.txt`**: es la
 * evidencia de lo que dijo el marcador de entonces, y se lee junto al nuevo.
 *
 * ⚠️ Lo que el validador todavía caza se imprime pegado a los veredictos: un
 * veredicto de un caso con lectura incompleta no cubre lo que no se leyó. Aquí
 * no bloquea —no se gasta nada—, pero no se calla.
 */

const dir = process.argv[2];
if (!dir) {
  console.error('Uso: node scripts/examen-repuntuar.mjs <carpeta de crudos>');
  process.exit(1);
}

const commit = (() => {
  try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'sin-git'; }
})();

/** Un crudo, en la forma de `resultados` que usa el ejecutor. */
function resultadoDe(crudo) {
  const base = { casoId: crudo.casoId, pasada: crudo.pasada };
  if (crudo.veredicto) return { ...base, noMedible: crudo.veredicto };   // no medible o lectura fallida
  if (typeof crudo.http === 'number' && (crudo.http < 200 || crudo.http > 299)) return { ...base, error: `HTTP ${crudo.http}` };
  return { ...base, http: crudo.http, ms: crudo.ms, cuerpo: crudo.cuerpo };
}

const crudos = readdirSync(dir)
  .filter(f => /_pasada\d+\.json$/.test(f))
  .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const idsConCrudo = new Set(crudos.map(c => c.casoId));

const todos = await cargarCasos();
const casos = todos.filter(c => idsConCrudo.has(c.id));
const sinCrudo = todos.filter(c => !idsConCrudo.has(c.id)).map(c => c.id);
const resultados = crudos.map(resultadoDe).sort((a, b) => a.casoId.localeCompare(b.casoId) || a.pasada - b.pasada);

const problemas = validarCasos(casos);
const lineas = [
  `REPUNTUACIÓN · marcador del commit ${commit} · ${new Date().toISOString().slice(0, 10)}`,
  `crudos de ${dir.replace(/\\/g, '/')} · ${crudos.length} pasadas · sin relanzar, 0 créditos`,
  ...(sinCrudo.length ? [`⚠️ SIN CRUDOS en esta carpeta (no se repuntúan): ${sinCrudo.join(', ')}`] : []),
  '⚠️ El informe original (`informe.txt`) se deja como está: es lo que dijo el marcador de entonces.',
  '',
  ...lineasDelVeredicto(casos, resultados),
  '',
];

if (problemas.length) {
  lineas.push(`⚠️ LO QUE EL MARCADOR TODAVÍA NO LEE (${problemas.length}, del validador) — un veredicto de estos casos no lo cubre:`);
  for (const p of problemas) lineas.push(`    · ${p}`);
} else {
  lineas.push('El validador no caza nada en estos casos: el marcador lee todo lo que declaran.');
}

const informe = lineas.join('\n') + '\n';
const salida = join(dir, `informe-repuntuado_${commit}.txt`);
writeFileSync(salida, informe);
console.log(informe);
console.log(`Escrito: ${salida}`);
