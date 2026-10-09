import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { unidadesDeCita, TOPE_DE_LA_UNIDAD, SUELO_DE_LA_UNIDAD, type UnidadDeCita } from './unidades-de-cita';

/**
 * Vía 2 de F-122 · las unidades de cita de un trozo. Dos clases de prueba, que
 * no se mezclan: cadenas inventadas para clavar las invariantes con precisión,
 * y un documento real de los fixtures comprobando SÓLO las invariantes (nada de
 * instantáneas de cuántas unidades salen ni de su contenido: se romperían con
 * cualquier ajuste legítimo de la lista de abreviaturas).
 */

/** Las invariantes 1 y 3, comprobadas de una vez sobre cualquier salida. */
function cumpleLasInvariantes(texto: string, unidades: UnidadDeCita[]): void {
  expect(unidades.map(u => u.texto).join('')).toBe(texto);
  if (texto.length === 0) { expect(unidades).toEqual([]); return; }
  expect(unidades[0].desde).toBe(0);
  expect(unidades[unidades.length - 1].hasta).toBe(texto.length);
  unidades.forEach((u, i) => {
    expect(u.numero).toBe(i + 1);
    expect(u.texto).toBe(texto.slice(u.desde, u.hasta));
    expect(u.hasta).toBeGreaterThan(u.desde);
    expect(u.texto.length).toBeLessThanOrEqual(TOPE_DE_LA_UNIDAD);
    if (i + 1 < unidades.length) expect(unidades[i + 1].desde).toBe(u.hasta);
  });
}

describe('unidades de cita · cadenas inventadas', () => {
  const PARRAFO = 'Este protocolo se aplica a las tres clínicas de la red. El responsable último es el Director Clínico. ¿Y si falta? La sustituye el Coordinador.\nUna línea suelta sin punto final que también es una unidad\n  \nY otra frase al final.';

  it('reconstruye el texto byte a byte, contiguo y numerado desde 1', () => {
    cumpleLasInvariantes(PARRAFO, unidadesDeCita(PARRAFO));
  });

  it('los espacios y saltos entre frases son de la unidad que los precede', () => {
    const u = unidadesDeCita(PARRAFO);
    expect(u[0].texto.endsWith('red. ')).toBe(true);
    expect(u.some(x => x.texto.endsWith('unidad\n  \n'))).toBe(true);
  });

  it('es determinista: dos veces, la misma salida', () => {
    expect(unidadesDeCita(PARRAFO)).toEqual(unidadesDeCita(PARRAFO));
  });

  it('una palabra de 1.200 caracteres sin puntuación sale troceada, ningún trozo pasa de 400', () => {
    const palabra = 'x'.repeat(1200);
    const u = unidadesDeCita(palabra);
    cumpleLasInvariantes(palabra, u);
    expect(u.map(x => x.texto.length)).toEqual([400, 400, 400]);
  });

  it('una frase larga se corta por el último espacio antes de 400, no en mitad de palabra', () => {
    const frase = Array.from({ length: 120 }, (_, i) => `palabra${i}`).join(' ');
    const u = unidadesDeCita(frase);
    cumpleLasInvariantes(frase, u);
    for (const x of u.slice(0, -1)) expect(x.texto.endsWith(' ')).toBe(true);
  });

  it('un titular de 7 caracteres se funde HACIA ADELANTE con el párrafo que titula', () => {
    const texto = 'Alcance\nEste protocolo se aplica a todas las clínicas de la red sin excepción.';
    const u = unidadesDeCita(texto);
    cumpleLasInvariantes(texto, u);
    expect(u).toHaveLength(1);
    expect(u[0].texto.startsWith('Alcance\nEste protocolo')).toBe(true);
  });

  it('si la fusión pasaría de 400, no se funde: gana el tope', () => {
    const texto = `Corto.\n${'y'.repeat(399)}`;
    const u = unidadesDeCita(texto);
    cumpleLasInvariantes(texto, u);
    expect(u[0].texto).toBe('Corto.\n');
    expect(u[0].texto.length).toBeLessThan(SUELO_DE_LA_UNIDAD);
  });

  it('un decimal y un número con puntos no parten la frase', () => {
    const texto = 'El presupuesto fue de 2.959 euros y el plazo de 3,5 horas en 1.200-1.400 casos. Después se revisa todo.';
    const u = unidadesDeCita(texto);
    cumpleLasInvariantes(texto, u);
    expect(u.map(x => x.texto)).toEqual([
      'El presupuesto fue de 2.959 euros y el plazo de 3,5 horas en 1.200-1.400 casos. ',
      'Después se revisa todo.',
    ]);
  });

  it('una abreviatura seguida de minúscula no parte la frase', () => {
    const texto = 'Según el art. tercero del protocolo y p. ej. la norma vigente, se aplica siempre.';
    expect(unidadesDeCita(texto).map(x => x.texto)).toEqual([texto]);
  });

  it('un titular numerado no se parte tras su número: lo cierra el salto de línea', () => {
    const texto = '## 2.2. Personal auxiliar de esterilización\nSe encarga de la limpieza del instrumental en la zona sucia.';
    const u = unidadesDeCita(texto);
    cumpleLasInvariantes(texto, u);
    expect(u[0].texto).toBe('## 2.2. Personal auxiliar de esterilización\n');
  });

  it('un salto de línea siempre cierra unidad, aunque la línea no acabe en punto', () => {
    const texto = 'Primera línea sin punto final y larga\nSegunda línea también sin punto y larga';
    expect(unidadesDeCita(texto).map(x => x.texto)).toEqual([
      'Primera línea sin punto final y larga\n',
      'Segunda línea también sin punto y larga',
    ]);
  });

  it('texto vacío: ninguna unidad', () => {
    expect(unidadesDeCita('')).toEqual([]);
  });

  it('texto más corto que 25: una unidad, la última puede quedar corta', () => {
    const u = unidadesDeCita('Breve.');
    expect(u).toEqual([{ numero: 1, desde: 0, hasta: 6, texto: 'Breve.' }]);
  });
});

describe('unidades de cita · un documento real (sólo invariantes)', () => {
  it('NOR-11: cobertura, tope y determinismo en cada trozo de texto', { timeout: 30_000 }, async () => {
    const nombre = 'NOR-11_gestion-de-residuos-sanitarios.docx';
    const segmentos = await extractSegments(readFileSync(`corpus-pruebas/${nombre}`), nombre);
    const trozos = chunkSegments(segmentos, 'prueba', nombre, 'prueba').filter(t => t.chunkType === 'text');
    expect(trozos.length).toBeGreaterThan(0); // control: hay material que comprobar
    for (const t of trozos) {
      const u = unidadesDeCita(t.text);
      cumpleLasInvariantes(t.text, u);
      expect(unidadesDeCita(t.text)).toEqual(u);
    }
  });
});
