import { describe, expect, it } from 'vitest';
import { leerTodasLasPaginas, MAXIMO_DE_PAGINAS } from './leer-todas-las-paginas';
import { getChunksForDocuments } from './read-chunks';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * B.297 (29/09/2026): la paginación, con un TOPE PEQUEÑO simulado para que el
 * camino se ejercite. Caso decisivo: un tope (3) por debajo del tamaño de página
 * (5). Con «parar en la página corta», la primera página ya vendría corta y se
 * perderían filas; con «parar en la vacía», se leen todas.
 */

/** Un servidor que respeta `range` pero nunca devuelve más de `tope` filas. */
function servidor<T>(filas: T[], tope: number) {
  const llamadas: Array<[number, number]> = [];
  const pedir = (desde: number, hasta: number) => {
    llamadas.push([desde, hasta]);
    return Promise.resolve({ data: filas.slice(desde, Math.min(hasta + 1, desde + tope)), error: null });
  };
  return { pedir, llamadas };
}

describe('leerTodasLasPaginas', () => {
  it('CASO DECISIVO: tope 3 y páginas de 5 — se leen las 7, sin parar en la primera página corta', async () => {
    const { pedir, llamadas } = servidor([0, 1, 2, 3, 4, 5, 6], 3);
    const r = await leerTodasLasPaginas(pedir, 5);
    expect(r.data).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(llamadas.map(([d]) => d)).toEqual([0, 3, 6, 7]);   // avanza por lo RECIBIDO y para en la vacía
  });
  it('sin filas: una sola ida, lista vacía', async () => {
    expect((await leerTodasLasPaginas(servidor([], 3).pedir, 5)).data).toEqual([]);
  });
  it('un error en una página posterior devuelve el ERROR, nunca lo leído hasta ahí', async () => {
    let n = 0;
    const r = await leerTodasLasPaginas(() => Promise.resolve(
      n++ === 0 ? { data: [1, 2], error: null } : { data: null, error: { message: 'caída' } }), 2);
    expect(r).toEqual({ data: null, error: { message: 'caída' } });
  });
  it('un servidor que ignora `range` y repite siempre lo mismo no deja el bucle colgado', async () => {
    const r = await leerTodasLasPaginas(() => Promise.resolve({ data: [1], error: null }), 1);
    expect(r.data).toBeNull();
    expect(r.error?.message).toContain(`${MAXIMO_DE_PAGINAS}`);
  });
});

describe('getChunksForDocuments sobre un Supabase que corta en 3 filas', () => {
  type Fila = { document_id: string; generation: number; chunk_index: number; chunk_type: string; text: string;
    sheet_name: null; table_id: null; row_index: null; cells: null; column_order: null };
  const fila = (document_id: string, generation: number, chunk_index: number): Fila =>
    ({ document_id, generation, chunk_index, chunk_type: 'text', text: `${document_id}-${generation}-${chunk_index}`,
       sheet_name: null, table_id: null, row_index: null, cells: null, column_order: null });
  const FILAS = [
    fila('a', 1, 0), fila('a', 1, 1), fila('a', 1, 2), fila('a', 1, 3),
    fila('b', 1, 0),                                          // generación vieja de b
    fila('b', 2, 0), fila('b', 2, 1),
  ];
  /** El encadenado de supabase-js que usa la función, con `range` y el tope. */
  function supabaseQueCorta(tope: number) {
    const consulta = {
      select: () => consulta, eq: () => consulta, in: () => consulta, order: () => consulta,
      range: (desde: number, hasta: number) =>
        Promise.resolve({ data: FILAS.slice(desde, Math.min(hasta + 1, desde + tope)), error: null }),
    };
    return { from: () => consulta } as unknown as SupabaseClient;
  }
  it('trae TODOS los trozos de la generación de cada documento, en orden, aunque el tope sea 3', async () => {
    const r = await getChunksForDocuments(supabaseQueCorta(3), {
      orgId: 'o', documents: [{ documentId: 'a', generation: 1 }, { documentId: 'b', generation: 2 }],
    });
    expect(r.get('a')?.map(c => c.text)).toEqual(['a-1-0', 'a-1-1', 'a-1-2', 'a-1-3']);
    expect(r.get('b')?.map(c => c.text)).toEqual(['b-2-0', 'b-2-1']);
  });
});
