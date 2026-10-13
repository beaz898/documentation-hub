import { describe, expect, it } from 'vitest';
import type { StoredChunk } from '@/lib/read-chunks';
import { verifyQuote } from './judge';
import { comprobadorDeLado, type LoEntregado } from './pajar-de-la-cita';
import { comprobarConRepliegues, contadoresDelTramo, localizadorDeLado, registroDelTramo, RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR, type LocalizadorDeLado } from './repliegue-de-tramo';
import { COUNTER_CATALOGUE, mergeCounters } from './counters';
import type { DocumentJudgment, RegistroDelTramo } from './types';

/**
 * F-125, fase 3.1 · la cadena de la puerta para las citas de una contradicción.
 * Aquí, el módulo solo: qué decide para UNA cita. Lo que pasa con el hallazgo
 * en el juez y en la cascada se prueba en `judge-recompuesta.test.ts` y en
 * `recompuesta-en-la-cascada.test.ts`.
 */

const trozo = (chunkIndex: number, text: string): StoredChunk => ({
  chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});
const unidos = (trozos: StoredChunk[]) => trozos.map(c => c.text).join('\n\n');

const A = 'El gestor autorizado retira el material de las tres clínicas los martes y los viernes por la mañana.';
const B = 'El registro de retiradas lo firma el responsable de turno de cada clínica antes de las doce del mediodía.';
const TROZOS = [trozo(0, `${A} Ninguna otra frase de este trozo cambia lo anterior.`), trozo(1, `Otra cosa distinta, sin relación ninguna con la anterior. ${B}`)];
const ENTREGADO: LoEntregado = { texto: unidos(TROZOS), trozos: [] };
const EMPALME = 'El registro de retiradas lo firma el responsable de turno, el material de las tres clínicas los martes y los viernes por la mañana';

/** El comprobador de siempre, el real, sobre lo entregado. */
const comprobador = (entregado: LoEntregado, trozos: StoredChunk[]) => comprobadorDeLado(verifyQuote, entregado, trozos, null);

/** Un localizador que cuenta cuántas veces se le pide el índice. */
function espia(loc: LocalizadorDeLado): LocalizadorDeLado & { llamadas: () => number } {
  let n = 0;
  return { lado: loc.lado, indice: () => { n++; return loc.indice(); }, llamadas: () => n };
}

describe('D2 · (B) va el último', () => {
  it('(1) una cita que pasa la comprobación de siempre no llega al tramo: ni índice ni registro', () => {
    const loc = espia(localizadorDeLado({ entregado: ENTREGADO, trozos: TROZOS }));
    const c = comprobarConRepliegues(comprobador(ENTREGADO, TROZOS), loc, A);
    expect(c.verificada?.text).toBe(A);
    expect(c.registro).toBeNull();
    expect(c.recompuesta).toBeNull();
    expect(loc.llamadas()).toBe(0);
  });

  it('sin localizador, la cadena es la de antes (comprobación y glosa) y no registra nada', () => {
    const c = comprobarConRepliegues(comprobador(ENTREGADO, TROZOS), null, EMPALME);
    expect(c.verificada).toBeNull();
    expect(c.registro).toBeNull();
  });
});

describe('D3 · lo que sigue adelante es la frase real, nunca el empalme', () => {
  it('un empalme de dos frases verdaderas pasa con la frase del ancla y la marca lleva las dos', () => {
    const c = comprobarConRepliegues(comprobador(ENTREGADO, TROZOS), localizadorDeLado({ entregado: ENTREGADO, trozos: TROZOS }), EMPALME);
    expect(c.registro?.salida).toBe('recompuesta');
    expect(c.verificada).not.toBeNull();
    expect(c.verificada?.text).not.toBe(EMPALME);
    expect(c.cita).not.toBe(EMPALME);
    expect(c.recompuesta?.citaDelJuez).toBe(EMPALME);
    expect(new Set([c.recompuesta?.fraseDelAncla.texto, c.recompuesta?.fraseDelResto.texto])).toEqual(new Set([A, B]));
    expect(c.verificada?.text).toBe(c.recompuesta?.fraseDelAncla.texto);
    // El trozo de evidencia es el del ancla, y las dos frases están en trozos distintos.
    expect(c.verificada?.chunk?.chunkIndex).toBe(c.recompuesta?.fraseDelAncla.chunkIndex);
    expect(c.recompuesta?.enTrozosDistintos).toBe(true);
    expect(c.registro?.trozos).toEqual({ ancla: c.recompuesta?.fraseDelAncla.chunkIndex, resto: c.recompuesta?.fraseDelResto.chunkIndex });
  });

  it('sin las dos frases reales no hay publicación: un ancla que cruza dos trozos da sin_frases', () => {
    // La primera mitad de la cita cruza el "\n\n" entre los dos trozos.
    const t = [trozo(0, 'Primera parte de una frase partida por el troceado en medio de su'), trozo(1, 'segunda parte, que sigue aquí. Y una frase entera de relleno que el juez pega al final del todo.')];
    const e: LoEntregado = { texto: unidos(t), trozos: [] };
    const cita = 'Primera parte de una frase partida por el troceado en medio de su segunda parte, Y una frase entera de relleno que el juez pega al final';
    const c = comprobarConRepliegues(comprobador(e, t), localizadorDeLado({ entregado: e, trozos: t }), cita);
    expect(c.registro?.salida).toBe('sin_frases');
    expect(c.verificada).toBeNull();
    expect(c.recompuesta).toBeNull();
  });
});

describe('D6 · las otras salidas mueren como hoy, anotadas', () => {
  it('un resto que no es literal: sin verificar, con su motivo', () => {
    const cita = 'El gestor autorizado retira el material de las tres clínicas los martes, y además lo hace con un camión que nadie ha mencionado jamás';
    const c = comprobarConRepliegues(comprobador(ENTREGADO, TROZOS), localizadorDeLado({ entregado: ENTREGADO, trozos: TROZOS }), cita);
    expect(c.verificada).toBeNull();
    expect(c.registro?.salida).toBe('resto_no_literal');
  });

  it('por piezas o sin lo entregado, (B) no se aplica', () => {
    const porPiezas: LoEntregado = { texto: null, trozos: TROZOS };
    const c1 = comprobarConRepliegues(comprobador(porPiezas, TROZOS), localizadorDeLado({ entregado: porPiezas, trozos: TROZOS }), EMPALME);
    expect(c1.registro).toEqual({ salida: 'no_aplica', motivo: 'entregado_piezas', longitudDeLaCita: EMPALME.length });
    const c2 = comprobarConRepliegues(comprobadorDeLado(verifyQuote, null, TROZOS, null), localizadorDeLado({ entregado: null, trozos: TROZOS }), EMPALME);
    expect(c2.registro?.motivo).toBe('sin_lo_entregado');
    expect(c2.verificada).toBeNull();
  });
});

describe('el pajar es el texto ENTREGADO, no el documento', () => {
  it('(m5) un resto que sólo está en la parte del documento que el juez no recibió no es literal', () => {
    // Al juez se le entregó sólo el primer trozo (como un corte de régimen).
    const cortado: LoEntregado = { texto: TROZOS[0].text, trozos: [] };
    const c = comprobarConRepliegues(comprobador(cortado, TROZOS), localizadorDeLado({ entregado: cortado, trozos: TROZOS }), EMPALME);
    expect(c.registro?.salida).toBe('resto_no_literal');
    expect(c.verificada).toBeNull();
  });
});

describe('el registro de la pareja', () => {
  it('anota sólo las citas que llegaron al tramo, con hash y lado', () => {
    const r = registroDelTramo();
    const loc = localizadorDeLado({ entregado: ENTREGADO, trozos: TROZOS });
    r.anotar('h1', 'nuevo', comprobarConRepliegues(comprobador(ENTREGADO, TROZOS), loc, A));
    r.anotar('h2', 'existente', comprobarConRepliegues(comprobador(ENTREGADO, TROZOS), loc, EMPALME));
    const { citasAlTramo } = r.resultado();
    expect(citasAlTramo?.map(x => [x.hash, x.lado, x.salida])).toEqual([['h2', 'existente', 'recompuesta']]);
    expect(registroDelTramo().resultado()).toEqual({});
  });

  it('el índice se construye una vez por lado y sirve para todas sus citas', () => {
    const loc = localizadorDeLado({ entregado: ENTREGADO, trozos: TROZOS });
    expect(loc.indice()).toBe(loc.indice());
  });
});

describe('los cinco contadores del tramo (commit 4)', () => {
  const vacio = (p: Partial<DocumentJudgment> = {}): DocumentJudgment => ({
    documentId: 'd', documentName: 'D.docx', source: 'manual', overlapPercent: 0, verdict: 'sin_relacion',
    contradictions: [], overlappingContent: [], uniqueToNewDoc: [], ...p,
  });
  const CINCO = [
    'juez.citas_recompuestas',
    'juez.citas_recompuestas_en_trozos_distintos',
    'juez.citas_empalme_multiple',
    'juez.citas_sin_tramo_literal',
    'juez.recompuestas_bloqueadas_al_reclasificar',
  ] as const;

  it('una pasada sin ningún empalme emite los cinco, a cero (no vale que falten)', () => {
    for (const judgments of [[], [vacio()], [vacio(), vacio({ discarded: { citaNoVerificable: 3 } })]]) {
      const c = contadoresDelTramo(judgments);
      expect(Object.keys(c).sort()).toEqual([...CINCO].sort());
      for (const k of CINCO) expect(c[k]).toBe(0);
    }
  });

  it('cuenta por cita lo que dice el registro, y el quinto del discarded; los motivos sin contador no suman', () => {
    const r = (hash: string, salida: RegistroDelTramo['salida'], trozos?: { ancla: number; resto: number }): RegistroDelTramo =>
      ({ hash, lado: 'nuevo', salida, longitudDeLaCita: 100, ...(trozos ? { trozos } : {}) });
    const c = contadoresDelTramo([
      vacio({ citasAlTramo: [r('a', 'recompuesta', { ancla: 8, resto: 8 }), r('b', 'recompuesta', { ancla: 1, resto: 3 }), r('c', 'empalme_multiple')] }),
      vacio({
        citasAlTramo: [r('d', 'sin_tramo_literal'), r('e', 'resto_insuficiente'), r('f', 'resto_no_literal'), r('g', 'sin_frases'), r('h', 'no_aplica'), r('i', 'cita_entera')],
        discarded: { [RECOMPUESTA_BLOQUEADA_AL_RECLASIFICAR]: 2 },
      }),
    ]);
    expect(c).toEqual({
      'juez.citas_recompuestas': 2,
      'juez.citas_recompuestas_en_trozos_distintos': 1,
      'juez.citas_empalme_multiple': 1,
      'juez.citas_sin_tramo_literal': 1,
      'juez.recompuestas_bloqueadas_al_reclasificar': 2,
    });
  });

  it('los cinco están en el catálogo: la fusión los transporta (cláusula 4)', () => {
    for (const k of CINCO) expect(COUNTER_CATALOGUE).toContain(k);
    expect(mergeCounters(contadoresDelTramo([]))).toEqual(contadoresDelTramo([]));
  });
});
