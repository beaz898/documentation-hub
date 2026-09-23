import { describe, expect, it } from 'vitest';

import {
  cribarMatches,
  documentIdsDeLosMatches,
  laCribaCuadra,
  type MatchCrudo,
} from './criba-de-matches';
import { MAXIMO_DE_IDS_REGISTRADOS } from '@/lib/documents/vivos';

/**
 * ⚠️ LA CRIBA DE LOS MATCHES — F-115 (22/09/2026).
 *
 * Lo que estos casos vigilan es UN ORDEN, y el orden es lo que fallaba: el
 * umbral se aplicaba ANTES de saber si el documento existía, así que un documento
 * borrado con score alto entraba como candidato legítimo y uno con score bajo se
 * anotaba como «perdido por el umbral». Los dos eran falsos.
 *
 * ⚠️ EL UMBRAL SE RETIRÓ EL 23/09/2026, así que de los cuatro descartes quedan
 * TRES. Los casos que lo vigilaban se reescriben en vez de borrarse: ahora
 * comprueban lo CONTRARIO —que un score bajísimo YA NO se descarta— y ése es el
 * caso decisivo de la retirada.
 *
 * El caso que los paga es real y tiene fecha: el 21/09/2026 CLI-05
 * (`c701c9dd`), sin fila y sin vectores en el listado exhaustivo, volvió en las
 * consultas de Pinecone con seis fragmentos de hasta 0,866 y **cambió el
 * resultado de un análisis del usuario**.
 */

const FANTASMA = 'c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6';
const VIVO = 'aaaaaaaa-1111-2222-3333-444444444444';
const PROPIO = 'bbbbbbbb-5555-6666-7777-888888888888';

/** El mapa que devuelve `documentosVivos`: id → generación activa. */
const GENERACIONES = new Map([[VIVO, 1], [PROPIO, 1]]);

function match(over: {
  doc?: string; score?: number; gen?: number; chunk?: number;
  nombre?: string | null; texto?: string | null; id?: string;
} = {}): MatchCrudo {
  const doc = over.doc ?? VIVO;
  const chunk = over.chunk ?? 0;
  const metadata: Record<string, unknown> = {
    documentId: doc,
    chunkIndex: chunk,
    source: 'manual',
  };
  if (over.nombre !== null) metadata.documentName = over.nombre ?? 'informe.txt';
  if (over.texto !== null) metadata.text = over.texto ?? 'un párrafo cualquiera';
  if (over.gen !== undefined) metadata.generation = over.gen;
  return { id: over.id ?? `${doc}-${chunk}`, metadata, score: over.score ?? 0.8 };
}

describe('⚠️ EL ORDEN: la existencia va PRIMERA', () => {
  /**
   * ⚠️ CASO DECISIVO DEL ENCARGO: un match cuyo documentId no existe sale
   * descartado Y contado. Si la comprobación no estuviera, este fragmento
   * —score 0,866, por encima del umbral, de otro documento, generación válida—
   * pasaría las otras tres cribas y llegaría al rerank.
   */
  it('⚠️ un documentId que no existe se DESCARTA, se CUENTA y se REGISTRA su vectorId', () => {
    const r = cribarMatches({
      crudos: [match({ doc: FANTASMA, score: 0.866, id: `${FANTASMA}-g2-3` })],
      generaciones: GENERACIONES,
    });
    expect(r.fragmentos).toEqual([]);
    expect(r.reparto.sin_fila_viva).toBe(1);
    expect(r.reparto.candidatos_con_repeticion).toBe(0);
    expect(r.idsSinFilaViva).toEqual([`${FANTASMA}-g2-3`]);
    expect(r.documentosSinFila).toEqual([FANTASMA]);
    // Y NO se le atribuye a ninguna otra causa.
    expect(r.reparto.propios_excluidos).toBe(0);
    expect(r.reparto.generacion_muerta_excluida).toBe(0);
    expect(laCribaCuadra(r.reparto)).toBe(true);
  });

  /**
   * ⚠️ EL CASO DECISIVO DE LA RETIRADA DEL UMBRAL (23/09/2026): un fragmento con
   * score 0,1 de un documento VIVO **sobrevive**. Hasta hoy caía por el corte de
   * 0,50, y este mismo caso afirmaba lo contrario. Si alguien reinstaurara un
   * corte absoluto sin decirlo, esto se pone rojo.
   */
  it('⚠️ SIN UMBRAL: un score bajísimo de un documento vivo YA NO se descarta', () => {
    const r = cribarMatches({
      crudos: [match({ doc: VIVO, score: 0.01 })],
      generaciones: GENERACIONES,
    });
    expect(r.fragmentos).toHaveLength(1);
    expect(r.fragmentos[0].score).toBe(0.01);
    expect(r.reparto.candidatos_con_repeticion).toBe(1);
  });

  /** Y el fantasma con score bajo sigue cayendo, pero por NO EXISTIR. */
  it('⚠️ un fantasma con score bajísimo cae por NO EXISTIR, no por su score', () => {
    const r = cribarMatches({
      crudos: [match({ doc: FANTASMA, score: 0.01 })],
      generaciones: GENERACIONES,
    });
    expect(r.fragmentos).toEqual([]);
    expect(r.reparto.sin_fila_viva).toBe(1);
  });

  it('⚠️ un fantasma que ADEMÁS es el documento propio cae por no existir', () => {
    const r = cribarMatches({
      crudos: [match({ doc: FANTASMA })],
      generaciones: GENERACIONES,
      excluido: FANTASMA,
    });
    expect(r.reparto.sin_fila_viva).toBe(1);
    expect(r.reparto.propios_excluidos).toBe(0);
  });

  it('el documento vivo pasa: es el otro lado del caso decisivo', () => {
    const r = cribarMatches({
      crudos: [match({ doc: VIVO, score: 0.8 })],
      generaciones: GENERACIONES,
    });
    expect(r.fragmentos).toHaveLength(1);
    expect(r.fragmentos[0].documentId).toBe(VIVO);
    expect(r.reparto.sin_fila_viva).toBe(0);
  });

  /**
   * ⚠️ EL MAPA VACÍO DESCARTA TODO, y no es un caso que haya que saltarse. Un
   * mapa vacío LEÍDO significa «ninguno de los preguntados tiene fila»; el «no
   * se pudo leer» no llega aquí, porque para el análisis antes (`documentosVivos`
   * devuelve `no_leido` y la recuperación lanza).
   */
  it('⚠️ con Vivos VACÍO se descarta TODO, y el reparto lo dice', () => {
    const r = cribarMatches({
      crudos: [match({ doc: VIVO }), match({ doc: FANTASMA }), match({ doc: PROPIO })],
      generaciones: new Map(),
    });
    expect(r.fragmentos).toEqual([]);
    expect(r.reparto.crudos).toBe(3);
    expect(r.reparto.sin_fila_viva).toBe(3);
    expect(laCribaCuadra(r.reparto)).toBe(true);
  });
});

describe('las otras dos cribas, cada una en su término', () => {
  it('el propio se excluye DESPUÉS de comprobar que existe', () => {
    const r = cribarMatches({
      crudos: [match({ doc: PROPIO, score: 0.99 }), match({ doc: VIVO })],
      generaciones: GENERACIONES,
      excluido: PROPIO,
    });
    expect(r.reparto.propios_excluidos).toBe(1);
    expect(r.fragmentos.map(f => f.documentId)).toEqual([VIVO]);
  });

  it('la generación muerta se descarta y se cuenta por documento', () => {
    const r = cribarMatches({
      crudos: [match({ doc: VIVO, gen: 2 }), match({ doc: VIVO, gen: 1, chunk: 1 })],
      generaciones: GENERACIONES,
    });
    expect(r.reparto.generacion_muerta_excluida).toBe(1);
    expect(r.porGeneracionMuerta.get(VIVO)).toBe(1);
    expect(r.fragmentos).toHaveLength(1);
  });

  it('la generación AUSENTE es la 1 implícita, como en parseVectorId', () => {
    const r = cribarMatches({
      crudos: [match({ doc: VIVO })],
      generaciones: GENERACIONES,
    });
    expect(r.fragmentos).toHaveLength(1);
    expect(r.fragmentos[0].generation).toBe(1);
  });

  it('sin metadata utilizable va a su propio término, no al de fila viva', () => {
    const r = cribarMatches({
      crudos: [
        { id: 'x', metadata: undefined, score: 0.9 },
        { id: 'y', metadata: { documentId: VIVO }, score: undefined },
        match({ nombre: null }),
        match({ texto: null, chunk: 1 }),
      ],
      generaciones: GENERACIONES,
    });
    expect(r.reparto.sin_metadata_utilizable).toBe(4);
    expect(r.reparto.sin_fila_viva).toBe(0);
    expect(laCribaCuadra(r.reparto)).toBe(true);
  });
});

describe('⚠️ EL CUADRE DE LA CRIBA — cinco términos sobre los crudos', () => {
  it('⚠️ los cuatro descartes y los supervivientes suman los crudos', () => {
    const r = cribarMatches({
      crudos: [
        match({ doc: FANTASMA }),                    // sin fila
        match({ doc: FANTASMA, chunk: 1 }),          // sin fila
        { id: 'z', metadata: undefined, score: 1 },  // sin metadata
        match({ doc: PROPIO, chunk: 3 }),            // propio
        match({ doc: VIVO, gen: 9, chunk: 4 }),      // generación muerta
        match({ doc: VIVO, chunk: 5 }),              // sobrevive
        match({ doc: VIVO, chunk: 6 }),              // sobrevive
      ],
      generaciones: GENERACIONES,
      excluido: PROPIO,
    });
    expect(r.reparto).toEqual({
      crudos: 7,
      sin_fila_viva: 2,
      sin_metadata_utilizable: 1,
      propios_excluidos: 1,
      generacion_muerta_excluida: 1,
      candidatos_con_repeticion: 2,
    });
    expect(laCribaCuadra(r.reparto)).toBe(true);
  });

  it('sin ni un match, todo a cero y cuadra', () => {
    const r = cribarMatches({ crudos: [], generaciones: GENERACIONES });
    expect(r.reparto.crudos).toBe(0);
    expect(laCribaCuadra(r.reparto)).toBe(true);
    expect(r.idsSinFilaViva).toEqual([]);
  });

  it('⚠️ el cuadre se ROMPE si alguien pierde un fragmento por el camino', () => {
    expect(laCribaCuadra({
      crudos: 10, sin_fila_viva: 1, sin_metadata_utilizable: 1,
      propios_excluidos: 1, generacion_muerta_excluida: 1, candidatos_con_repeticion: 4,
    })).toBe(false);
  });
});

describe('el registro de lo descartado', () => {
  it(`⚠️ como mucho ${MAXIMO_DE_IDS_REGISTRADOS} vectorId, aunque caigan cien`, () => {
    const crudos = Array.from({ length: 100 }, (_, i) => match({ doc: FANTASMA, chunk: i }));
    const r = cribarMatches({ crudos, generaciones: GENERACIONES });
    // El CONTADOR no se acota: son cien de verdad.
    expect(r.reparto.sin_fila_viva).toBe(100);
    // La lista sí, porque se persiste.
    expect(r.idsSinFilaViva).toHaveLength(MAXIMO_DE_IDS_REGISTRADOS);
    // Y el documento se nombra UNA vez, no cien.
    expect(r.documentosSinFila).toEqual([FANTASMA]);
  });

  it('un match sin id deja constancia de que no lo traía, en vez de una cadena vacía', () => {
    const r = cribarMatches({
      crudos: [{ metadata: { documentId: FANTASMA, documentName: 'x.txt', text: 'y' }, score: 0.9 }],
      generaciones: GENERACIONES,
    });
    expect(r.idsSinFilaViva).toEqual(['(sin id)']);
  });
});

describe('a quién se le pregunta si existe', () => {
  /**
   * ⚠️ SOBRE LOS CRUDOS, Y ESO ES EL PUNTO: la lista de ids que va a la base
   * incluye al documento propio y a los de generación muerta. Preguntar sólo por
   * los supervivientes dejaría sin verificar justo a los que se quieren contar
   * aparte — y un fantasma que además fuera el propio se contaría como
   * «excluido por ser el propio» en vez de como inexistente.
   */
  it('⚠️ se pregunta por TODOS los documentId de los crudos, incluidos los que van a caer', () => {
    const ids = documentIdsDeLosMatches([
      match({ doc: VIVO, score: 0.1 }),
      match({ doc: PROPIO }),
      match({ doc: FANTASMA }),
      match({ doc: FANTASMA, chunk: 1 }),
    ]);
    expect(new Set(ids)).toEqual(new Set([VIVO, PROPIO, FANTASMA]));
    expect(ids).toHaveLength(3);
  });

  it('un match sin documentId utilizable no ensucia la lista', () => {
    expect(documentIdsDeLosMatches([
      { metadata: undefined },
      { metadata: {} },
      { metadata: { documentId: '' } },
      { metadata: { documentId: 42 } },
    ])).toEqual([]);
  });
});
