import { describe, expect, it } from 'vitest';
import type { StoredChunk } from '@/lib/read-chunks';
import { verifyQuote } from './judge';
import { normalize } from './normalize';
import {
  normalizarConPosiciones, findBestMatch, describirDescarte,
  comprobadorDeLado, loEntregadoDeLaPareja, candidatoEntregadoEntero,
} from './coincidencia-de-cita';
import type { LecturaDeLaPareja } from './types';

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
  it('una cita corta que no está: sin_coincidencia, con su longitud', () => {
    expect(describirDescarte(['Nada que ver aquí, de verdad.'], 'el plazo de 96 h'))
      .toBe('longitud=16, paso=sin_coincidencia');
  });

  it('una cita larga cuya cabeza está y su cola no: cabeza_sin_cola, el paso más avanzado de todos los pajares', () => {
    const pajares = ['Otro asunto distinto.', 'La responsabilidad última recae siempre sobre el Director Clínico.'];
    expect(describirDescarte(pajares, 'La responsabilidad última recae siempre sobre el Coordinador de Calidad'))
      .toBe('longitud=71, paso=cabeza_sin_cola');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// B.299, CAUSA (i) — EL PAJAR ES LO QUE LEYÓ EL JUEZ
// ═══════════════════════════════════════════════════════════════════════════

const trozo = (chunkIndex: number, text: string): StoredChunk => ({
  chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});
const fila = (chunkIndex: number, rowIndex: number, cells: Record<string, string>): StoredChunk => ({
  chunkIndex,
  chunkType: 'table_row',
  text: `[Hoja "T"] ${Object.entries(cells).map(([k, v]) => `${k}: ${v}`).join(' | ')}`,
  sheetName: 'T',
  tableId: 'T#0',
  rowIndex,
  cells,
  columnOrder: null,
});
const resumen: StoredChunk = {
  chunkIndex: 0, chunkType: 'table_summary', text: '[TABLA "T" — 2 filas. Columnas: Nombre, Clínica]',
  sheetName: 'T', tableId: 'T#0', rowIndex: null, cells: null, columnOrder: ['Nombre', 'Clínica'],
};
const lectura = (l: Partial<LecturaDeLaPareja> & Pick<LecturaDeLaPareja, 'regimen'>): LecturaDeLaPareja => ({
  documentId: 'cand',
  analizado: { caracteres: 100, mostrados: 100, dejoFuera: false },
  candidato: { caracteres: 100, mostrados: 100, dejoFuera: false },
  presupuesto: 40000,
  ...l,
});

describe('B.299 (i) · el candidato entregado POR PIEZAS', () => {
  const a = trozo(0, 'La autorización de excepciones corresponde al Coordinador de Calidad.');
  const b = trozo(1, 'El control biológico del autoclave se realiza cada lunes.');
  const c = trozo(2, 'El material esterilizado caduca a los seis meses de envasado.');
  const chunks = [a, b, c];
  // El juez recibió SÓLO el trozo 0 (bloque por relevancia).
  const entregado = loEntregadoDeLaPareja({
    pareja: {
      textoAnalizado: 'irrelevante',
      bloqueCandidato: '[Fragmento 1 de «X»]\nLa autorización…',
      representados: [0],
      lectura: lectura({ regimen: 'tijera_vieja', candidato: { caracteres: null, mostrados: 80, dejoFuera: true } }),
    },
    analizadoChunks: [],
    candidatoChunks: chunks,
  }).existente;
  const lado = comprobadorDeLado(verifyQuote, entregado, chunks, null);

  it('ROJO antes, VERDE después: una cita de un trozo que el juez NO recibió ya no se verifica', () => {
    expect(lado.comprobar('El material esterilizado caduca a los seis meses')).toBeNull();
  });

  it('la cita del trozo que SÍ recibió se sigue verificando, con su trozo de evidencia', () => {
    const r = lado.comprobar('corresponde al Coordinador de Calidad');
    expect(r?.chunk?.chunkIndex).toBe(0);
  });

  it('CONTROL NEGATIVO: la cabeza en una pieza y la cola en otra no se verifica (la trampa de la cabeza y cola)', () => {
    const dos = loEntregadoDeLaPareja({
      pareja: { textoAnalizado: 'x', bloqueCandidato: 'x', representados: [0, 1],
        lectura: lectura({ regimen: 'tijera_vieja', candidato: { caracteres: null, mostrados: 80, dejoFuera: true } }) },
      analizadoChunks: [], candidatoChunks: chunks,
    }).existente;
    const l2 = comprobadorDeLado(verifyQuote, dos, chunks, null);
    expect(l2.comprobar('La autorización de excepciones corresponde al control biológico del autoclave se realiza cada lunes')).toBeNull();
  });

  it('el log dice con qué pajar se comprobó', () => {
    expect(lado.describir('El material esterilizado caduca a los seis meses')).toContain('pajar=entregado_piezas (1 trozos)');
  });
});

describe('B.299 (i) · el analizado, entregado CONTIGUO', () => {
  const p1 = trozo(0, '## 2.1 Responsable\n\nLa responsabilidad última recae siempre sobre');
  const p2 = trozo(1, 'el Director Clínico del centro, que firma las auditorías.');
  const p3 = trozo(2, 'El control biológico del autoclave se realiza cada lunes por la mañana.');
  const chunks = [p1, p2, p3];
  // El juez vio p1, p2 y el principio de p3, cortado por posición.
  const visible = `${p1.text}\n\n${p2.text}\n\n${p3.text.slice(0, 20)}`;
  const entregado = loEntregadoDeLaPareja({
    pareja: { textoAnalizado: visible, bloqueCandidato: '', representados: [], lectura: lectura({ regimen: 'corte_honesto' }) },
    analizadoChunks: chunks,
    candidatoChunks: [],
  }).nuevo;
  const lado = comprobadorDeLado(verifyQuote, entregado, chunks, null);

  it('ROJO antes, VERDE después: una cita que cruza dos secciones contiguas se verifica', () => {
    expect(lado.comprobar('recae siempre sobre el Director Clínico')).not.toBeNull();
  });

  it('ROJO antes, VERDE después: una cita más allá del corte ya no se verifica', () => {
    expect(lado.comprobar('se realiza cada lunes por la mañana')).toBeNull();
  });

  it('CONTROL NEGATIVO: una cita inventada sigue sin verificarse', () => {
    expect(lado.comprobar('recae siempre sobre el Coordinador de Calidad')).toBeNull();
  });

  it('el log dice con qué pajar se comprobó', () => {
    expect(lado.describir('se realiza cada lunes por la mañana')).toContain('pajar=entregado_texto');
  });
});

describe('B.299 (i) · las tablas, POR FILA', () => {
  const f0 = fila(1, 0, { Nombre: 'Ana', 'Clínica': 'Chamberí' });
  const f1 = fila(2, 1, { Nombre: 'Luis', 'Clínica': 'Retiro' });
  const chunks = [resumen, f0, f1];

  it('CONTROL NEGATIVO: una cita de tabla sigue verificándose por su fila, con sus columnas', () => {
    // El juez vio la tabla entera, pintada en su formato ([F0] Ana | Chamberí), y
    // cita los VALORES como los vio.
    const visible = '[TABLA]\n[F0] Ana | Chamberí\n[F1] Luis | Retiro';
    const entregado = loEntregadoDeLaPareja({
      pareja: { textoAnalizado: visible, bloqueCandidato: '', representados: [], lectura: lectura({ regimen: 'pareja_entera' }) },
      analizadoChunks: chunks, candidatoChunks: [],
    }).nuevo;
    const r = comprobadorDeLado(verifyQuote, entregado, chunks, null).comprobar('Luis | Retiro');
    expect(r).not.toBeNull();
    expect(r?.columns).not.toBeNull();
  });

  it('una fila que quedó FUERA del corte no cuenta como visible', () => {
    const visible = '[TABLA]\n[F0] Ana | Chamberí\n[F1] Lu';
    const entregado = loEntregadoDeLaPareja({
      pareja: { textoAnalizado: visible, bloqueCandidato: '', representados: [], lectura: lectura({ regimen: 'pareja_entera' }) },
      analizadoChunks: chunks, candidatoChunks: [],
    }).nuevo;
    expect(entregado?.trozos.map(c => c.rowIndex)).toEqual([0]);
  });
});

describe('B.299 (i) · A PRUEBA DE FALLO: sin lo entregado, el camino de antes, y dicho', () => {
  const chunks = [trozo(0, 'La autorización de excepciones corresponde al Coordinador de Calidad.')];

  it('sin lo entregado, verifica como antes (todos los trozos) y el log lo dice', () => {
    const lado = comprobadorDeLado(verifyQuote, null, chunks, null);
    expect(lado.comprobar('corresponde al Coordinador de Calidad')).not.toBeNull();
    expect(lado.describir('una cita que no está')).toContain('pajar=todos_los_trozos');
  });

  it('sin trozos, el texto completo, y el log lo dice', () => {
    const lado = comprobadorDeLado(verifyQuote, null, [], 'Texto completo con la frase que sí está aquí.');
    expect(lado.comprobar('la frase que sí está aquí')).not.toBeNull();
    expect(lado.describir('otra cosa distinta')).toContain('pajar=texto_completo');
  });

  it('un candidato sin trozos no tiene lo entregado: camino de antes', () => {
    const e = loEntregadoDeLaPareja({
      pareja: { textoAnalizado: 'a', bloqueCandidato: 'b', representados: [3], lectura: lectura({ regimen: 'sin_fuente_comun' }) },
      analizadoChunks: [], candidatoChunks: [],
    });
    expect(e.existente).toBeNull();
  });

  it('candidatoEntregadoEntero: sólo con régimen nuevo, sin dejar nada fuera y con todo mostrado', () => {
    expect(candidatoEntregadoEntero(lectura({ regimen: 'pareja_entera' }))).toBe(true);
    expect(candidatoEntregadoEntero(lectura({ regimen: 'tijera_vieja' }))).toBe(false);
    expect(candidatoEntregadoEntero(lectura({ regimen: 'corte_honesto', candidato: { caracteres: 900, mostrados: 300, dejoFuera: true } }))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// B.313 — EL DENOMINADOR: LONGITUD Y VÍA DE LAS CITAS QUE PASAN
// ═══════════════════════════════════════════════════════════════════════════

describe('B.313 · describirAcierto: por qué vía pasó una cita, y su longitud', () => {
  const frase = 'El control biológico del autoclave se realiza cada lunes por la mañana.';
  const lado = comprobadorDeLado(verifyQuote, null, [trozo(0, frase)], null);

  it('literal', () => {
    const cita = 'El control biológico del autoclave se realiza cada lunes';
    expect(lado.comprobar(cita)).not.toBeNull();
    expect(lado.describirAcierto(cita)).toBe('longitud=56, paso=literal, pajar=todos_los_trozos (1 trozos)');
  });

  it('normalizada: otra caja y sin el punto', () => {
    const cita = 'EL CONTROL BIOLÓGICO DEL AUTOCLAVE se realiza cada lunes por la mañana';
    expect(lado.comprobar(cita)).not.toBeNull();
    expect(lado.describirAcierto(cita)).toContain('paso=normalizada');
  });

  it('cabeza y cola: el medio cambiado, y aun así pasa', () => {
    const cita = 'El control biológico del esterilizador se realiza cada lunes por la mañana';
    expect(lado.comprobar(cita)).not.toBeNull();
    expect(lado.describirAcierto(cita)).toContain('paso=cabeza_y_cola');
  });

  it('por segmentos de fila: la vía de tablas de verifyQuote, que no se repite aquí', () => {
    const chunks = [resumen, fila(1, 0, { Nombre: 'Ana', 'Clínica': 'Chamberí' }), fila(2, 1, { Nombre: 'Luis', 'Clínica': 'Retiro' })];
    const tabla = comprobadorDeLado(verifyQuote, null, chunks, null);
    expect(tabla.comprobar('Luis | Retiro')).not.toBeNull();
    expect(tabla.describirAcierto('Luis | Retiro')).toBe('longitud=13, paso=segmentos_de_fila, pajar=todos_los_trozos (3 trozos)');
  });

  it('el texto entregado va antes que las filas, como en la decisión', () => {
    const chunks = [resumen, fila(1, 0, { Nombre: 'Ana', 'Clínica': 'Chamberí' }), fila(2, 1, { Nombre: 'Luis', 'Clínica': 'Retiro' })];
    const visible = '[TABLA]\n[F0] Ana | Chamberí\n[F1] Luis | Retiro';
    const entregado = loEntregadoDeLaPareja({
      pareja: { textoAnalizado: visible, bloqueCandidato: '', representados: [], lectura: lectura({ regimen: 'pareja_entera' }) },
      analizadoChunks: chunks, candidatoChunks: [],
    }).nuevo;
    expect(comprobadorDeLado(verifyQuote, entregado, chunks, null).describirAcierto('Luis | Retiro'))
      .toBe('longitud=13, paso=literal, pajar=entregado_texto (2 filas visibles)');
  });

  it('el puntero de fila no cuenta en la longitud, como en los descartes', () => {
    expect(lado.describirAcierto('[F3] El control biológico del autoclave se realiza cada lunes')).toContain('longitud=56');
  });
});
