import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { indiceDePajar, localizarPorTramo } from './tramo-de-cita';
import { fraseReal, frasesDeLaRecompuesta, type SalidaDeLaFrase } from './frase-real';

/**
 * F-125, fase 3.1 · de un tramo a la frase real. La prueba que importa es la
 * del control: lo que sale son las frases REALES del documento y nunca el
 * empalme del juez. Que el empalme falso no se PUBLIQUE no lo puede afirmar una
 * prueba unitaria —depende del verificador, que es una llamada al modelo—: es
 * medida del arnés y cuesta créditos.
 */

const trozo = (chunkIndex: number, text: string, chunkType: StoredChunk['chunkType'] = 'text'): StoredChunk => ({
  chunkIndex, chunkType, text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});
/** El texto entregado de un lado contiguo: los trozos en orden, con "\n\n". */
const unidos = (trozos: StoredChunk[]) => [...trozos].sort((a, b) => a.chunkIndex - b.chunkIndex).map(c => c.text).join('\n\n');
const textoDe = (s: SalidaDeLaFrase) => (s.tipo === 'frase' ? s.texto : `(${s.tipo})`);

describe('el control: las frases reales, nunca el empalme', () => {
  // Dos frases verdaderas de un documento. El juez pega el principio de la
  // segunda con el final de la primera: cada trozo es literal, la frase que
  // forman no existe en el documento.
  const A = 'El gestor autorizado retira el material de las tres clínicas los martes y los viernes por la mañana.';
  const B = 'El registro de retiradas lo firma el responsable de turno de cada clínica antes de las doce del mediodía.';
  const trozos = [trozo(0, `${A} Ninguna otra frase aquí lo cambia. ${B}`), trozo(1, 'Otro apartado que no viene al caso, escrito para que haya más de un trozo.')];
  const entregado = { texto: unidos(trozos), trozos: [] };
  const EMPALME = 'El registro de retiradas lo firma el responsable de turno, el material de las tres clínicas los martes y los viernes por la mañana';

  it('el empalme sale como sus dos frases reales, enteras, y ninguna es el empalme', () => {
    const s = localizarPorTramo(indiceDePajar(entregado.texto), EMPALME);
    expect(s.tipo).toBe('recompuesta');
    if (s.tipo !== 'recompuesta') return;
    const f = frasesDeLaRecompuesta(entregado, trozos, s);
    expect(new Set([textoDe(f.ancla), textoDe(f.resto)])).toEqual(new Set([A, B]));
    for (const lado of [f.ancla, f.resto]) {
      expect(textoDe(lado)).not.toBe(EMPALME);
      expect(textoDe(lado)).not.toContain('responsable de turno, el material');
      if (lado.tipo === 'frase') expect(trozos[lado.chunkIndex].text.slice(lado.desde, lado.hasta)).toBe(lado.texto);
    }
  });
});

// ⚠️ DEUDA ANOTADA, NO DE ESTE MÓDULO (12/10/2026): una unidad puede no ser una
// frase limpia. Un titular de menos de 25 caracteres se funde HACIA ADELANTE con
// la frase que titula (`unidades-de-cita.ts`, regla 4), así que la «frase real»
// sale con el titular delante. Sigue siendo texto que existe en el documento,
// tal cual. Esta prueba lo deja a la vista: el día que cambie, se pone roja.
describe('deuda: el titular corto se funde con su frase', () => {
  it('la frase real de la primera frase de un apartado lleva el titular delante', () => {
    const t = [trozo(0, '## 6. Retirada\nEl gestor autorizado retira el material de las tres clínicas los martes y los viernes por la mañana. Y otra frase.')];
    const e = { texto: unidos(t), trozos: [] };
    const desde = e.texto.indexOf('retira el material');
    expect(textoDe(fraseReal(e, t, { desde, hasta: desde + 18 })))
      .toBe('## 6. Retirada\nEl gestor autorizado retira el material de las tres clínicas los martes y los viernes por la mañana.');
  });
});

describe('los casos que no cuentan', () => {
  const trozos = [trozo(0, 'Primer trozo con su frase entera, que acaba aquí mismo sin más.'), trozo(1, 'Segundo trozo, con otra frase entera que también acaba aquí.')];
  const entregado = { texto: unidos(trozos), trozos: [] };

  it('un tramo dentro de un trozo da su unidad', () => {
    const desde = entregado.texto.indexOf('otra frase');
    expect(textoDe(fraseReal(entregado, trozos, { desde, hasta: desde + 10 }))).toBe(trozos[1].text);
  });

  it('un tramo que cruza el límite entre dos trozos no cuenta', () => {
    const desde = entregado.texto.indexOf('sin más.');
    const hasta = entregado.texto.indexOf('Segundo') + 7;
    expect(fraseReal(entregado, trozos, { desde, hasta })).toEqual({ tipo: 'cruza_trozos' });
  });

  it('entregado por piezas, sin lo entregado o sin trozos de texto: no se aplica', () => {
    expect(fraseReal({ texto: null, trozos }, trozos, { desde: 0, hasta: 5 })).toEqual({ tipo: 'no_aplica', motivo: 'entregado_piezas' });
    expect(fraseReal(null, trozos, { desde: 0, hasta: 5 })).toEqual({ tipo: 'no_aplica', motivo: 'sin_lo_entregado' });
    expect(fraseReal(entregado, [trozo(0, 'x', 'table_row')], { desde: 0, hasta: 5 })).toEqual({ tipo: 'no_aplica', motivo: 'sin_trozos' });
  });

  it('un tramo fuera de todo trozo de texto (una tabla pintada en medio) no se localiza', () => {
    const conTabla = { texto: `${trozos[0].text}\n\n| Clínica | Lunes |\n\n${trozos[1].text}`, trozos: [] };
    const desde = conTabla.texto.indexOf('| Clínica');
    expect(fraseReal(conTabla, trozos, { desde, hasta: desde + 9 })).toEqual({ tipo: 'no_aplica', motivo: 'trozo_no_localizado' });
    // …y el trozo de después de la tabla se sigue localizando.
    const d2 = conTabla.texto.indexOf('otra frase');
    expect(fraseReal(conTabla, trozos, { desde: d2, hasta: d2 + 10 }).tipo).toBe('frase');
  });

  it('con solape entre trozos, el tramo se atribuye a la copia donde cae', () => {
    const solapan = [trozo(0, 'Una frase compartida por los dos trozos. Y otra del primero.'), trozo(1, 'Y otra del primero. Una del segundo, que sólo está aquí.')];
    const e = { texto: unidos(solapan), trozos: [] };
    const desde = e.texto.lastIndexOf('Y otra del primero');
    const s = fraseReal(e, solapan, { desde, hasta: desde + 18 });
    expect(s.tipo === 'frase' && s.chunkIndex).toBe(1);
  });
});

describe('LUGAR sobre el texto real de NOR-11', () => {
  it('la de 206 da la frase sembrada con «Chamberí» y la del 6.1, enteras', { timeout: 30_000 }, async () => {
    const nombre = 'NOR-11_gestion-de-residuos-sanitarios.docx';
    const trozos = toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${nombre}`), nombre), 'prueba', nombre, 'prueba'));
    const entregado = { texto: unidos(trozos), trozos: [] };
    const cita = 'El punto de retirada centralizado concentra el material de las tres clínicas, ubicado en la clínica de Chamberí, desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro';
    const s = localizarPorTramo(indiceDePajar(entregado.texto), cita);
    expect(s.tipo).toBe('recompuesta');
    if (s.tipo !== 'recompuesta') return;
    const f = frasesDeLaRecompuesta(entregado, trozos, s);
    expect(textoDe(f.ancla)).toMatch(/^El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, ubicado en la clínica de Chamberí, .* hasta su destino final de tratamiento\.$/);
    expect(textoDe(f.resto)).toMatch(/^Dado que el punto de retirada centralizado concentra el material de las tres clínicas, cada centro coordina/);
  });
});
