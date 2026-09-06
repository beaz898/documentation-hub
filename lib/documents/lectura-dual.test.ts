import { describe, it, expect } from 'vitest';
import {
  lecturaDelDocumento,
  textoDelDocumento,
  tieneSegmentosPersistidos,
} from './lectura-dual';
import type { ExtractedSegment } from '@/lib/chunking';

/**
 * LA LECTURA DUAL — la batería.
 *
 * ⚠️ LO QUE MÁS VIGILA no es que devuelva los segmentos cuando los hay: es que
 * NUNCA deje un documento mudo. Durante la ventana, casi todo el corpus llega
 * por el camino del texto plano, y un fallo ahí no da un error — da un documento
 * sin contenido que nadie nota hasta que el chat deja de encontrarlo.
 */

const TABLA: ExtractedSegment[] = [
  { type: 'table_summary', text: 'Tarifas', sheetName: 'H1', tableId: 't1', columns: ['a', 'b'] },
  { type: 'table_row', text: 'fila 1', sheetName: 'H1', tableId: 't1', rowIndex: 0, cells: { a: '1', b: '2' } },
];

describe('lecturaDelDocumento — cuál de las dos formas', () => {
  it('con segmentos guardados, ésos y sin tocarlos', () => {
    const r = lecturaDelDocumento({ segments: TABLA, full_text: 'da igual' });
    expect(r.origen).toBe('segmentos');
    expect(r.segmentos).toEqual(TABLA);
  });

  it('sin segmentos, se reconstruye del texto plano — y se DECLARA que es prosa', () => {
    const r = lecturaDelDocumento({ segments: null, full_text: 'un texto largo' });
    expect(r.origen).toBe('texto_plano');
    expect(r.segmentos).toEqual([{ type: 'text', text: 'un texto largo' }]);
  });

  it('sin nada, vacío declarado y no una lista mentirosa', () => {
    for (const fila of [
      { segments: null, full_text: null },
      { segments: undefined, full_text: '' },
      { segments: [], full_text: '   ' },
      {},
    ]) {
      const r = lecturaDelDocumento(fila);
      expect(r.origen).toBe('vacio');
      expect(r.segmentos).toEqual([]);
    }
  });
});

describe('⚠️ los bordes de `segments`, que es donde se deja mudo a un documento', () => {
  it('el ARRAY VACÍO cuenta como ausente y cae al texto plano', () => {
    // Si `[]` contara como «tiene segmentos», este documento quedaría sin
    // contenido teniendo un full_text perfectamente utilizable al lado.
    const r = lecturaDelDocumento({ segments: [], full_text: 'texto que sí existe' });
    expect(r.origen).toBe('texto_plano');
    expect(r.segmentos).toEqual([{ type: 'text', text: 'texto que sí existe' }]);
  });

  it('lo que no son segmentos tampoco lo son: se cae al texto', () => {
    for (const basura of ['una cadena', 42, { type: 'text' }, [1, 2, 3], [{ sin: 'text' }]]) {
      const r = lecturaDelDocumento({ segments: basura, full_text: 'respaldo' });
      expect(r.origen, `con ${JSON.stringify(basura)}`).toBe('texto_plano');
    }
  });

  it('una lista donde SOLO ALGUNO no es segmento se descarta entera', () => {
    const r = lecturaDelDocumento({
      segments: [{ type: 'text', text: 'bueno' }, { type: 'text' }],
      full_text: 'respaldo',
    });
    expect(r.origen).toBe('texto_plano');
  });
});

describe('textoDelDocumento — una sola forma de contestar', () => {
  it('de los segmentos, uniéndolos y quitando el marcador', () => {
    const t = textoDelDocumento({ segments: TABLA, full_text: 'no se usa' });
    expect(t).toContain('Tarifas');
    expect(t).toContain('fila 1');
    expect(t).not.toContain('no se usa');
  });

  it('del texto plano cuando no hay segmentos', () => {
    expect(textoDelDocumento({ segments: null, full_text: 'el texto' })).toBe('el texto');
  });

  it('cadena vacía cuando no hay nada, nunca undefined', () => {
    expect(textoDelDocumento({})).toBe('');
  });
});

describe('tieneSegmentosPersistidos — el contador de la ventana', () => {
  it('distingue migrado de no migrado', () => {
    expect(tieneSegmentosPersistidos({ segments: TABLA })).toBe(true);
    expect(tieneSegmentosPersistidos({ segments: [] })).toBe(false);
    expect(tieneSegmentosPersistidos({ segments: null, full_text: 'x' })).toBe(false);
    expect(tieneSegmentosPersistidos({})).toBe(false);
  });

  /**
   * ⚠️ EL CRITERIO ES UNO SOLO: esta función y la consulta que cierra la ventana
   * —`segments IS NULL` en el SQL— tienen que contestar lo mismo. Si divergieran,
   * la ventana se cerraría según una y el código se comportaría según la otra.
   */
  it('coincide con el criterio del SQL: solo una lista de segmentos cuenta', () => {
    expect(tieneSegmentosPersistidos({ segments: TABLA })).toBe(true);
    expect(tieneSegmentosPersistidos({ segments: undefined })).toBe(false);
  });
});
