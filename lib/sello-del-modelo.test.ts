import { describe, expect, it } from 'vitest';

import {
  selloDeUnLote,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSION,
} from './embeddings';

/**
 * ⚠️ EL SELLO DEL MODELO — F-114 (21/09/2026).
 *
 * Lo que sellamos NO es lo que pedimos: es lo que el servicio dice haber usado.
 * La distinción es el punto entero — si el proveedor cambiara el modelo detrás
 * del mismo alias, `EMBEDDING_MODEL` seguiría diciendo lo mismo y los vectores
 * nuevos se compararían contra los viejos en silencio.
 *
 * ⚠️ Y VIVE EN SU FICHERO, no dentro de `embeddings.test.ts`: aquella batería
 * prueba la POLÍTICA DE REINTENTO (backoff, presupuestos, 5xx) y ésta prueba el
 * SELLO. Son dos preguntas, y mezclarlas haría que el día que una se retire se
 * arrastre a la otra.
 */
describe('selloDeUnLote — lo que el servicio dice haber usado', () => {
  it('lee el modelo y los vectores de la misma respuesta', () => {
    const s = selloDeUnLote({
      model: 'multilingual-e5-large',
      data: [{ values: [0.1, 0.2] }, { values: [0.3, 0.4] }],
    });
    expect(s.modeloServido).toBe('multilingual-e5-large');
    expect(s.vectores).toEqual([[0.1, 0.2], [0.3, 0.4]]);
  });

  /**
   * ⚠️ AUSENTE NO ES «EL QUE PEDIMOS». Si la respuesta no trae `model`, el sello
   * es `null` y no se rellena con `EMBEDDING_MODEL`: rellenarlo convertiría una
   * ausencia en una confirmación, que es justo lo que el sello existe para
   * evitar.
   */
  it('⚠️ sin `model` en la respuesta, el sello es null — nunca el pedido', () => {
    expect(selloDeUnLote({ data: [{ values: [1] }] }).modeloServido).toBeNull();
    expect(selloDeUnLote({ model: '', data: [] }).modeloServido).toBeNull();
    expect(selloDeUnLote({ model: '   ', data: [] }).modeloServido).toBeNull();
    expect(selloDeUnLote(null).modeloServido).toBeNull();
    expect(selloDeUnLote(undefined).modeloServido).toBeNull();
  });

  it('una respuesta vacía no produce vectores fantasma', () => {
    expect(selloDeUnLote({ model: 'x' }).vectores).toEqual([]);
    expect(selloDeUnLote(null).vectores).toEqual([]);
  });

  /**
   * ⚠️ CASO DECISIVO, Y ES EL QUE PROTEGE A LOS SEIS LLAMADORES.
   *
   * `ingest`, `index-text`, `drive/sync` y `reparar` emparejan POR ÍNDICE:
   * `chunks[i]` con `embeddings[i]`. Si un item sin vector se saltara, la lista
   * saldría más corta y el trozo `i` se indexaría con el vector de `i+1` — un
   * índice corrupto SIN UN SOLO ERROR, que no se ve hasta que meses después una
   * recuperación devuelve el documento equivocado.
   *
   * Si alguien vuelve a poner un `continue` aquí, estos tres casos se ponen
   * rojos.
   */
  it('⚠️ un item sin `values` LANZA: saltarlo desalinearía los vectores con los textos', () => {
    expect(() => selloDeUnLote({ model: 'x', data: [{ values: [1, 2] }, {}, { values: [3, 4] }] }))
      .toThrow(/posición 1 de 3/);
    // Y NO devuelve una lista más corta, que es el fallo que se está evitando.
    expect(() => selloDeUnLote({ model: 'x', data: [{ values: [1, 2] }, {}] })).toThrow(/no se salta|No se salta/);
  });

  it('⚠️ un recuento que no cuadra con los textos enviados LANZA, con las dos cifras', () => {
    expect(() => selloDeUnLote(
      { model: 'x', data: [{ values: [1] }, { values: [2] }] },
      { esperados: 3, etiqueta: 'lote 1/1' },
    )).toThrow(/devolvió 2 vectores para 3 textos/);

    // Y también si devuelve de MÁS: los dos lados del desajuste.
    expect(() => selloDeUnLote(
      { model: 'x', data: [{ values: [1] }, { values: [2] }] },
      { esperados: 1, etiqueta: 'lote 1/1' },
    )).toThrow(/devolvió 2 vectores para 1 textos/);
  });

  it('con el recuento correcto no lanza, y la etiqueta del lote viaja en el error', () => {
    const s = selloDeUnLote(
      { model: 'x', data: [{ values: [1] }, { values: [2] }] },
      { esperados: 2, etiqueta: 'lote 3/7' },
    );
    expect(s.vectores).toHaveLength(2);

    expect(() => selloDeUnLote({ data: [{}] }, { esperados: 1, etiqueta: 'lote 3/7' }))
      .toThrow(/lote 3\/7/);
  });
});

describe('las dos constantes del sello', () => {
  it('el modelo es el que usa la llamada, y la dimensión es la del índice', () => {
    expect(EMBEDDING_MODEL).toBe('multilingual-e5-large');
    expect(EMBEDDING_DIMENSION).toBe(1024);
  });
});
