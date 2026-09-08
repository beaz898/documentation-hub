import { readFileSync } from 'node:fs';
import xlsx from 'xlsx';

/**
 * VERIFICADOR DE OPE-14 — el fichero de control del harness (08/09/2026).
 *
 * ⚠️ NO GENERA NADA: OPE-14 lo hizo una persona a mano y **el fichero es la
 * autoridad**. Esto comprueba que sigue siendo lo que su registro de siembra
 * dice que es, y ADEMÁS averigua qué columna se sembró en vez de darla por
 * sabida — así el registro no puede afirmar una columna que el fichero no tiene.
 *
 * Se corre cada vez que se vuelva a usar OPE-14 en una tanda: un fichero de
 * control que ha cambiado sin que nadie lo note deja de ser un control.
 *
 *   node scripts/verificar-ope14.mjs corpus-pruebas/OPE-14_<nombre real>.xlsx
 */

const ORIGEN = 'corpus-pruebas/OPE-11_tarifario-tratamientos-seguros.xlsx';
const CAMBIOS = { 'DIA-01': 45, 'END-01': 200, 'PRO-01': 700 };

const ruta = process.argv[2];
if (!ruta) { console.error('falta la ruta del OPE-14'); process.exit(2); }

const filasDe = f => {
  const wb = xlsx.read(readFileSync(f));
  return xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
};

const base = filasDe(ORIGEN);
const nuevo = filasDe(ruta);

const h = base.findIndex(f => (f ?? [])[0] === 'Código');
const cab = base[h];
const indexar = filas => new Map(filas.slice(h + 1).filter(f => (f ?? []).length > 1).map(f => [f[0], f]));
const a = indexar(base), b = indexar(nuevo);

const problemas = [];
if (a.size !== b.size) problemas.push(`filas: OPE-11 tiene ${a.size}, OPE-14 tiene ${b.size}`);

const difs = [];
for (const [cod, fa] of a) {
  const fb = b.get(cod);
  if (!fb) { problemas.push(`falta la fila ${cod}`); continue; }
  cab.forEach((col, i) => {
    if (String(fa[i] ?? '') !== String(fb[i] ?? '')) difs.push({ cod, col, de: fa[i], a: fb[i] });
  });
}
for (const cod of b.keys()) if (!a.has(cod)) problemas.push(`fila de más: ${cod}`);

const columnas = [...new Set(difs.map(d => d.col))];

console.log(`diferencias: ${difs.length}`);
for (const d of difs) console.log(`  ${d.cod} · ${d.col}: ${d.de} -> ${d.a}`);
console.log(`columnas afectadas: ${columnas.length} (${columnas.join(', ')})`);

if (difs.length !== 3) problemas.push(`esperaba 3 diferencias, hay ${difs.length}`);
if (columnas.length !== 1) problemas.push(`esperaba 1 columna afectada, hay ${columnas.length}`);
for (const [cod, valor] of Object.entries(CAMBIOS)) {
  if (!difs.some(d => d.cod === cod && String(d.a) === String(valor))) {
    problemas.push(`no encuentro ${cod} -> ${valor}`);
  }
}

if (problemas.length) {
  console.log('\n❌ OPE-14 NO cuadra con su registro de siembra:');
  for (const p of problemas) console.log('   · ' + p);
  process.exit(1);
}
console.log(`\n✅ OPE-14 es OPE-11 con 3 celdas cambiadas en "${columnas[0]}". Control válido.`);
