#!/usr/bin/env node
/**
 * MEDIDA DE LAS UNIDADES DE CITA SOBRE EL CORPUS DE PRUEBAS (vía 2 de F-122).
 *
 * Sin red, sin clave, sin modelo y sin gastar nada. Pasa `unidadesDeCita` por
 * los TROZOS de texto de cada `.docx` de `corpus-pruebas/` (los mismos ficheros
 * que barre lib/formatos-con-tablas.test.ts), sacados con la cadena REAL del
 * producto: `extractSegments` y `chunkSegments` de lib/chunking.ts. No se
 * reimplementa ni el extractor ni el troceado.
 *
 * Imprime, por documento: trozos, unidades, y la mediana, el mínimo y el máximo
 * de su longitud; cuántas tocan el tope de 400 y cuántas quedan por debajo de
 * 25. Y LO QUE DECIDE LA LISTA DE ABREVIATURAS: todos los cortes de frase en los
 * que la palabra que precede al signo tiene 4 caracteres o menos, con contexto.
 *
 * CÓMO CARGA TYPESCRIPT SIN DEPENDENCIAS: Node 24 quita los tipos por sí solo;
 * lo único que no hace es resolver los imports sin extensión (`./pdf-extract`).
 * El gancho de abajo prueba `.ts` cuando falta la extensión. Nada más.
 *
 * USO: node scripts/medir-unidades-de-cita.mjs
 */
import { register } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';

const gancho = `
export async function resolve(especificador, contexto, siguiente) {
  try { return await siguiente(especificador, contexto); }
  catch (err) {
    if ((especificador.startsWith('./') || especificador.startsWith('../')) && !/\\.[cm]?[jt]s$/.test(especificador)) {
      return siguiente(especificador + '.ts', contexto);
    }
    throw err;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const { extractSegments, chunkSegments } = await import('../lib/chunking.ts');
const { unidadesDeCita, TOPE_DE_LA_UNIDAD, SUELO_DE_LA_UNIDAD, ABREVIATURAS } = await import('../lib/analysis/unidades-de-cita.ts');

const mediana = xs => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const FIN = new Set(['.', '!', '?', '…']);
const LETRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀÈÌÒÙàèìòùÇç]/;

const ficheros = readdirSync('corpus-pruebas').filter(f => f.toLowerCase().endsWith('.docx')).sort();
console.log(`Abreviaturas en el módulo hoy: ${ABREVIATURAS.length ? ABREVIATURAS.join(', ') : '(ninguna)'}`);
console.log(`Ficheros .docx: ${ficheros.length}\n`);

const cortesCortos = [];
let totalTrozos = 0, totalUnidades = 0, totalTope = 0, totalSuelo = 0;
for (const nombre of ficheros) {
  const segmentos = await extractSegments(readFileSync(`corpus-pruebas/${nombre}`), nombre);
  const trozos = chunkSegments(segmentos, 'medida', nombre, 'medida').filter(t => t.chunkType === 'text');
  const longitudes = [];
  let tope = 0, suelo = 0;
  for (const t of trozos) {
    const unidades = unidadesDeCita(t.text);
    // Comprobación de la invariante 1 sobre el texto real.
    if (unidades.map(u => u.texto).join('') !== t.text) throw new Error(`cobertura rota en ${nombre}, trozo ${t.chunkIndex}`);
    for (const u of unidades) {
      longitudes.push(u.texto.length);
      if (u.texto.length >= TOPE_DE_LA_UNIDAD) tope++;
      if (u.texto.length < SUELO_DE_LA_UNIDAD) suelo++;
      // Cortes de frase: la unidad acaba en signo (+ espacios) y la palabra de antes es corta.
      const sinEspacios = u.texto.replace(/[ \t\r\n\f\v ]+$/, '');
      const ultimo = sinEspacios[sinEspacios.length - 1];
      if (u.hasta < t.text.length && FIN.has(ultimo)) {
        let i = sinEspacios.length - 1;
        while (i > 0 && LETRA.test(sinEspacios[i - 1])) i--;
        const palabra = sinEspacios.slice(i, sinEspacios.length - 1);
        if (palabra.length <= 4) {
          const despues = t.text.slice(u.hasta, u.hasta + 30).replace(/\s+/g, ' ');
          cortesCortos.push({ nombre, palabra, contexto: `…${sinEspacios.slice(-40).replace(/\s+/g, ' ')} ‖ ${despues}…` });
        }
      }
    }
  }
  totalTrozos += trozos.length; totalUnidades += longitudes.length; totalTope += tope; totalSuelo += suelo;
  const lmin = longitudes.length ? Math.min(...longitudes) : 0;
  const lmax = longitudes.length ? Math.max(...longitudes) : 0;
  console.log(`${nombre}: ${trozos.length} trozos · ${longitudes.length} unidades · mediana ${longitudes.length ? mediana(longitudes) : '—'} · mín ${lmin} · máx ${lmax} · en el tope ${tope} · bajo ${SUELO_DE_LA_UNIDAD}: ${suelo}`);
}
console.log(`\nTOTAL: ${totalTrozos} trozos · ${totalUnidades} unidades · en el tope ${totalTope} · bajo ${SUELO_DE_LA_UNIDAD}: ${totalSuelo}`);

console.log(`\nCORTES DE FRASE CON PALABRA DE 4 CARACTERES O MENOS ANTES DEL SIGNO: ${cortesCortos.length}`);
const porPalabra = new Map();
for (const c of cortesCortos) porPalabra.set(c.palabra.toLowerCase(), (porPalabra.get(c.palabra.toLowerCase()) ?? 0) + 1);
console.log(`Por palabra: ${[...porPalabra].sort((a, b) => b[1] - a[1]).map(([p, n]) => `«${p}» ${n}`).join(' · ') || '—'}`);
for (const c of cortesCortos) console.log(`  [${c.nombre}] «${c.palabra}»  ${c.contexto}`);
