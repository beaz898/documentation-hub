import { describe, expect, it } from 'vitest';
import type { StoredChunk } from '@/lib/read-chunks';
import { verifyQuote } from './judge';
import { normalize } from './normalize';
import { normalizarConPosiciones, findBestMatch, describirDescarte } from './coincidencia-de-cita';

/**
 * B.299, causa (ii) — LOS DOS LADOS DE LA COMPARACIÓN SE NORMALIZABAN CON DOS
 * FUNCIONES DISTINTAS. La cita pasaba por `normalize()` (colapsa los espacios
 * ANTES de quitar la puntuación) y el texto del trozo por un bucle propio de
 * `findBestMatch` (quita la puntuación ANTES de colapsar). Con un signo suelto
 * entre espacios —«a — b»— la cita quedaba `a  b` y el trozo `a b`: el texto no
 * casaba consigo mismo.
 */

const prosa = (text: string, chunkIndex = 0): StoredChunk => ({
  chunkIndex,
  chunkType: 'text',
  text,
  sheetName: null,
  tableId: null,
  rowIndex: null,
  cells: null,
  columnOrder: null,
});

describe('B.299 (ii) · una sola normalización para los dos lados', () => {
  // La mayúscula del trozo («El») hace fallar la vía literal, así que la cita
  // depende de la vía normalizada. Y es corta (menos de 25 caracteres
  // normalizados), así que la vía de cabeza y cola no la rescata.
  const trozo = prosa('El plazo — de 72 h desde el cierre del contenedor.');

  it('ROJO antes del arreglo, VERDE después: una cita con una raya entre espacios se verifica', () => {
    expect(verifyQuote([trozo], null, 'el plazo — de 72 h')).not.toBeNull();
  });

  it('CONTROL NEGATIVO: una cita que NO está en el documento sigue sin verificarse', () => {
    // Misma forma, otro dato. Si esto pasara, habríamos cambiado un comprobador
    // ciego por uno que dice sí a todo.
    expect(verifyQuote([trozo], null, 'el plazo — de 96 h')).toBeNull();
  });

  it('lo que ya funcionaba sigue funcionando: la cita literal', () => {
    expect(verifyQuote([trozo], null, 'El plazo — de 72 h desde el cierre')).not.toBeNull();
  });

  it('lo que ya funcionaba sigue funcionando: un salto de línea donde la cita lleva un espacio', () => {
    const conSalto = prosa('La responsabilidad recae\nsiempre sobre el Director Clínico.');
    expect(verifyQuote([conSalto], null, 'la responsabilidad recae siempre sobre el Director')).not.toBeNull();
  });
});


describe('B.299 (ii) · normalizarConPosiciones ES normalize(), con el mapa', () => {
  // Los casos que la versión anterior rompía (un signo suelto entre espacios)
  // y los bordes de la transformación: espacios raros, extremos, minúsculas que
  // cambian de longitud, la sigma final griega, emojis y la cadena vacía.
  const bateria = [
    'a — b',
    'El plazo — de 72 h',
    '  «Entre comillas»  y (paréntesis) ',
    'uno\n\ndos\tTRES cuatro',
    '— al principio y al final —',
    'a - b – c — d',
    '“curvas” y ‘simples’ y "rectas"',
    'İstanbul ve İzmir',
    'ΟΔΟΣ οδός',
    'emoji 👍 aquí',
    '...',
    '',
    'Sin nada raro: texto normal, con comas; y puntos.',
  ];

  for (const s of bateria) {
    it(`da EXACTAMENTE lo mismo que normalize(): ${JSON.stringify(s)}`, () => {
      expect(normalizarConPosiciones(s).texto).toBe(normalize(s));
    });
  }

  it('cada carácter normalizado apunta a una posición del original, en orden creciente', () => {
    const s = '  El plazo — de 72 h, desde «el cierre».';
    const { texto, posiciones } = normalizarConPosiciones(s);
    expect(posiciones).toHaveLength(texto.length);
    for (let k = 1; k < posiciones.length; k++) expect(posiciones[k]).toBeGreaterThan(posiciones[k - 1]);
    for (let k = 0; k < texto.length; k++) {
      if (texto[k] !== ' ') expect(s[posiciones[k]].toLowerCase()).toBe(texto[k]);
    }
  });
});

describe('B.299 (ii) · findBestMatch devuelve un recorte del ORIGINAL', () => {
  it('el recorte está en el texto y normaliza igual que la cita', () => {
    const texto = 'Primero.\nEl plazo — de 72 h desde el cierre del contenedor.';
    const cita = 'el plazo — de 72 h';
    const recorte = findBestMatch(texto, cita);
    expect(recorte).not.toBeNull();
    expect(texto.includes(recorte as string)).toBe(true);
    expect(normalize(recorte as string)).toBe(normalize(cita));
  });

  it('CONTROL NEGATIVO: ni siquiera la cabeza y la cola casan una cita inventada', () => {
    const texto = 'La responsabilidad última recae siempre sobre el Director Clínico del centro.';
    expect(findBestMatch(texto, 'La responsabilidad última recae siempre sobre el Coordinador de Calidad')).toBeNull();
  });
});

describe('B.299 · describirDescarte, lo que se escribe en el log', () => {
  const prosa = (text: string, chunkIndex: number): StoredChunk => ({
    chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
  });

  it('una cita corta que no está: sin_coincidencia, con su longitud y los trozos probados', () => {
    expect(describirDescarte([prosa('Nada que ver aquí, de verdad.', 0)], null, 'el plazo de 96 h'))
      .toBe('longitud=16, paso=sin_coincidencia, trozos=1');
  });

  it('una cita larga cuya cabeza está y su cola no: cabeza_sin_cola, el paso más avanzado de todos los trozos', () => {
    const cs = [prosa('Otro asunto distinto.', 0), prosa('La responsabilidad última recae siempre sobre el Director Clínico.', 1)];
    expect(describirDescarte(cs, null, 'La responsabilidad última recae siempre sobre el Coordinador de Calidad'))
      .toBe('longitud=71, paso=cabeza_sin_cola, trozos=2');
  });

  it('sin trozos, prueba el texto completo, y lo dice', () => {
    expect(describirDescarte([], 'Texto completo sin la cita.', 'una cita que no está'))
      .toBe('longitud=20, paso=sin_coincidencia, texto_completo');
  });
});
