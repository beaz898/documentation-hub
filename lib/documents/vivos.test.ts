import { describe, expect, it } from 'vitest';

import {
  repartoPorFilaViva,
  idsParaElRegistro,
  MAXIMO_DE_IDS_REGISTRADOS,
  MENSAJE_VERIFICACION_NO_DISPONIBLE,
  LOTE_DE_IDS,
} from './vivos';

/**
 * ⚠️ QUÉ DOCUMENTOS EXISTEN — F-115 (22/09/2026).
 *
 * ⚠️ QUÉ NO SE PRUEBA AQUÍ, Y POR QUÉ: `documentosVivos` habla con Supabase, y
 * el alcance declarado de esta suite no admite Supabase ni sus mocks
 * (`vitest.config.mts`, `Protocolo_Harness_Tasas.md` §1-bis). Lo que sí se
 * prueba es LA DECISIÓN —el reparto— que es donde estaba el fallo: la consulta
 * ya existía y funcionaba; lo que faltaba era distinguir «leí y no existe» de
 * «no pude leer», y esa distinción vive en el TIPO de retorno, que el
 * compilador vigila mejor que un caso.
 *
 * El otro lado —que un `no_leido` PARA el análisis— lo vigila el hecho de que
 * `documentosVivos` devuelva una unión discriminada: `criba-de-matches` no
 * acepta un `DocumentosVivos`, sólo un mapa, así que no se puede llegar a la
 * criba sin haber abierto antes el discriminante.
 */

const FANTASMA = 'c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6';
const VIVO = 'aaaaaaaa-1111-2222-3333-444444444444';

const frag = (documentId: string, marca = '') => ({ documentId, marca });

describe('⚠️ EL REPARTO POR FILA VIVA', () => {
  /**
   * ⚠️ CASO DECISIVO, con un lado a cada banda: el documento con fila se
   * conserva y el que no tiene fila se aparta. Si el predicado se invirtiera o
   * se hiciera trivial, uno de los dos lados se pondría rojo.
   */
  it('⚠️ el que tiene fila se conserva; el que no, se aparta', () => {
    const r = repartoPorFilaViva(
      [frag(VIVO, 'a'), frag(FANTASMA, 'b')],
      new Map([[VIVO, 1]]),
    );
    expect(r.vivos).toEqual([frag(VIVO, 'a')]);
    expect(r.sinFila).toEqual([frag(FANTASMA, 'b')]);
  });

  it('⚠️ el mapa VACÍO aparta todo: es «ninguno tiene fila», no «no se sabe»', () => {
    const r = repartoPorFilaViva([frag(VIVO), frag(FANTASMA)], new Map());
    expect(r.vivos).toEqual([]);
    expect(r.sinFila).toHaveLength(2);
  });

  it('la generación del mapa NO se mira aquí: la pregunta es si existe', () => {
    // Generación 7 en el mapa y el fragmento no dice de cuál es: sigue vivo.
    const r = repartoPorFilaViva([frag(VIVO)], new Map([[VIVO, 7]]));
    expect(r.vivos).toHaveLength(1);
  });

  it('sin items, dos listas vacías y ninguna excepción', () => {
    const r = repartoPorFilaViva([], new Map([[VIVO, 1]]));
    expect(r.vivos).toEqual([]);
    expect(r.sinFila).toEqual([]);
  });

  it('⚠️ nada se pierde: vivos + sinFila = lo que entró', () => {
    const entrada = [frag(VIVO, '1'), frag(FANTASMA, '2'), frag(VIVO, '3'), frag('otro', '4')];
    const r = repartoPorFilaViva(entrada, new Map([[VIVO, 1]]));
    expect(r.vivos.length + r.sinFila.length).toBe(entrada.length);
    expect([...r.vivos, ...r.sinFila].map(f => f.marca).sort()).toEqual(['1', '2', '3', '4']);
  });

  it('el orden dentro de cada lista se conserva', () => {
    const r = repartoPorFilaViva(
      [frag(VIVO, '1'), frag(FANTASMA, '2'), frag(VIVO, '3')],
      new Map([[VIVO, 1]]),
    );
    expect(r.vivos.map(f => f.marca)).toEqual(['1', '3']);
  });
});

describe('⚠️ EL ORDEN IMPORTA: apartar ANTES de recortar', () => {
  /**
   * ⚠️ CASO DECISIVO DEL CAMINO DEL CHAT, y es el fallo que tenía B.225: su
   * guarda corría sobre los CUATRO documentos ya elegidos, así que un fantasma
   * con el score más alto DESPLAZABA a un documento real del top-N y se caía
   * después. El usuario recibía una respuesta con menos fuentes y nada lo decía.
   *
   * Los dos órdenes se comparan aquí con los mismos datos: sólo uno conserva los
   * dos documentos reales.
   */
  const TOPE = 2;
  const candidatos = [
    { documentId: FANTASMA, marca: 'fantasma-0.99' },
    { documentId: VIVO, marca: 'real-0.90' },
    { documentId: 'cccccccc-9999-0000-1111-222222222222', marca: 'real-0.80' },
  ];
  const generaciones = new Map([[VIVO, 1], ['cccccccc-9999-0000-1111-222222222222', 1]]);

  it('⚠️ apartar y LUEGO recortar conserva los dos documentos reales', () => {
    const { vivos } = repartoPorFilaViva(candidatos, generaciones);
    expect(vivos.slice(0, TOPE).map(c => c.marca)).toEqual(['real-0.90', 'real-0.80']);
  });

  it('⚠️ recortar y LUEGO apartar pierde uno — el orden viejo, para contraste', () => {
    const recortadoPrimero = candidatos.slice(0, TOPE);
    const { vivos } = repartoPorFilaViva(recortadoPrimero, generaciones);
    expect(vivos.map(c => c.marca)).toEqual(['real-0.90']);
    // Y ahí está el daño: un documento real menos en la respuesta.
    expect(vivos).toHaveLength(TOPE - 1);
  });
});

describe('el registro acotado', () => {
  it(`corta en ${MAXIMO_DE_IDS_REGISTRADOS} y no toca lo que quepa`, () => {
    expect(idsParaElRegistro(['a', 'b'])).toEqual(['a', 'b']);
    const muchos = Array.from({ length: 60 }, (_, i) => `v-${i}`);
    expect(idsParaElRegistro(muchos)).toHaveLength(MAXIMO_DE_IDS_REGISTRADOS);
    expect(idsParaElRegistro(muchos)[0]).toBe('v-0');
  });

  it('la lista vacía sigue siendo vacía, no una lista con nada dentro', () => {
    expect(idsParaElRegistro([])).toEqual([]);
  });
});

describe('los dos límites declarados', () => {
  /**
   * ⚠️ EL LOTE NO PUEDE LLEGAR AL TOPE DE FILAS DE POSTGREST (1.000), y este
   * caso es lo único que lo vigila: si alguien lo subiera a 1.500, una consulta
   * podría truncar en silencio y los ids que se quedaran fuera llegarían como
   * «sin fila» — o sea, descartando documentos VIVOS.
   */
  it('⚠️ el lote de ids es holgadamente menor que las 1.000 filas de PostgREST', () => {
    expect(LOTE_DE_IDS).toBeLessThan(1000);
    expect(LOTE_DE_IDS).toBeGreaterThan(0);
  });

  it('el mensaje al usuario no filtra nada técnico', () => {
    expect(MENSAJE_VERIFICACION_NO_DISPONIBLE).not.toMatch(/supabase|postgres|sql|error/i);
    expect(MENSAJE_VERIFICACION_NO_DISPONIBLE.length).toBeGreaterThan(20);
  });
});
