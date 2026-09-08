import { readFileSync, writeFileSync } from 'node:fs';
import xlsx from 'xlsx';

/**
 * SIEMBRA DE OPE-15 — el documento con control negativo, sin usar todavia (08/09/2026).
 *
 * ⚠️ EL FICHERO SE GENERA, NO SE EDITA A MANO. La especificación y el .xlsx no
 * pueden divergir si el .xlsx es una FUNCIÓN de la especificación: la tabla
 * `MUTACIONES` de aquí abajo es la siembra, y lo demás sale de OPE-11.
 *
 * ⚠️ SE DERIVA DE OPE-11 A PROPÓSITO. Para que dos filas se emparejen hace falta
 * que compartan el valor de la clave, y la clave la descubre el sistema sobre
 * `Código`. Inventar códigos nuevos daría cero parejas y un cero sin denominador
 * — que es exactamente lo que esta tanda existe para no volver a producir.
 */

const ORIGEN = 'corpus-pruebas/OPE-11_tarifario-tratamientos-seguros.xlsx';
const DESTINO = 'corpus-pruebas/OPE-15_tarifario-mutua-2026.xlsx';

/** Cuántas filas de OPE-11 se copian (emparejarán todas). */
const COMPARTIDAS = 20;
/** Cuántas filas propias se añaden (no emparejan: control negativo). */
const PROPIAS = 10;

/**
 * LA SIEMBRA. Cada entrada muta UNA celda de UNA fila compartida.
 * `columna` es el nombre exacto de la cabecera de OPE-11.
 *
 * ⚠️ NUNCA se muta `Código`: es la clave. Cambiarla no crea una discrepancia,
 * deshace la pareja — y una fila sin pareja no se compara, así que la siembra
 * desaparecería en vez de detectarse.
 */
const MUTACIONES = [
  { n: 0,  columna: 'Precio base',           valor: 999 },
  { n: 2,  columna: 'Precio base',           valor: 111 },
  { n: 4,  columna: 'Precio base',           valor: 250 },
  { n: 6,  columna: 'Precio con seguro',     valor: 5 },
  { n: 8,  columna: 'Precio con seguro',     valor: 480 },
  { n: 10, columna: 'Duración (min)',        valor: 5 },
  { n: 12, columna: 'Profesional asignado',  valor: 'Dra. Nuria Vela' },
  { n: 14, columna: 'Clínica',               valor: 'Salamanca' },
];

const wb = xlsx.read(readFileSync(ORIGEN));
const hoja = wb.SheetNames[0];
const filas = xlsx.utils.sheet_to_json(wb.Sheets[hoja], { header: 1 });

const FILA_CABECERA = filas.findIndex(f => (f ?? [])[0] === 'Código');
if (FILA_CABECERA === -1) throw new Error('no encuentro la cabecera en OPE-11');
const cabecera = filas[FILA_CABECERA];
const datos = filas.slice(FILA_CABECERA + 1).filter(f => (f ?? []).length > 1);

const col = nombre => {
  const i = cabecera.indexOf(nombre);
  if (i === -1) throw new Error(`columna inexistente: ${nombre}`);
  return i;
};

// Las compartidas: las N primeras de OPE-11, en su orden. Determinista.
const compartidas = datos.slice(0, COMPARTIDAS).map(f => [...f]);

for (const m of MUTACIONES) {
  const fila = compartidas[m.n];
  if (!fila) throw new Error(`la mutación ${m.n} cae fuera de las compartidas`);
  const c = col(m.columna);
  if (String(fila[c]) === String(m.valor)) {
    throw new Error(`la mutación ${m.n}/${m.columna} NO CAMBIA NADA: ya vale ${m.valor}`);
  }
  fila[c] = m.valor;
}

// Las propias: códigos que no existen en OPE-11 ni en OPE-10.
const propias = Array.from({ length: PROPIAS }, (_, i) => {
  const plantilla = [...datos[i]];
  plantilla[col('Código')] = `MUT-${String(i + 1).padStart(2, '0')}`;
  plantilla[col('Tratamiento')] = `Prestación mutualista ${i + 1}`;
  return plantilla;
});

const salida = [
  ['DENTAVIA CLÍNICAS DENTALES'],
  ['Tarifas de mutua · Tarifario de tratamientos'],
  ['Versión 1.0 · Revisado 2026 · Dirección de Operaciones · Convenio mutualista'],
  [],
  cabecera,
  ...compartidas,
  ...propias,
];

const nuevo = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(nuevo, xlsx.utils.aoa_to_sheet(salida), 'Tarifas mutua');
writeFileSync(DESTINO, xlsx.write(nuevo, { type: 'buffer', bookType: 'xlsx' }));

console.log(`escrito ${DESTINO}`);
console.log(`  compartidas ${compartidas.length} · de ellas mutadas ${MUTACIONES.length}`);
console.log(`  propias     ${propias.length}`);
console.log(`  codigos compartidos: ${compartidas.map(f => f[col('Código')]).join(', ')}`);
