import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredChunk } from '@/lib/read-chunks';
import { fixQuotesInJudgment, verifyQuote } from './judge';
import { comprobadorDeLado } from './coincidencia-de-cita';
import { comprobarConRepliegueDeGlosa, contadoresDeLaGlosa, quitarGlosa } from './glosa-de-cita';
import { mergeCounters } from './counters';
import type { DocumentJudgment } from './types';

/**
 * F-121 · LA GLOSA ENTRE CORCHETES NO DEBE MATAR UN HALLAZGO (08/10/2026).
 *
 * El caso real (B.332, conducta 2; F-120, grupo de la glosa: 7 lados, 1 cita):
 * el juez citó de NOR-10 «…no es delegable y recae siempre sobre esta figura
 * [el Director Clínico]». La aclaración era CORRECTA —en NOR-10 §2.1 «esta
 * figura» ES el Director Clínico— y con ella la cita dejó de ser literal: la
 * puerta tiró un hallazgo verdadero.
 */

const trozo = (chunkIndex: number, text: string): StoredChunk => ({
  chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});

// NOR-10 §2.1, la frase entera (la misma que usa sello-de-goma.test.ts).
const NOR_10 = [
  trozo(0, 'El Director Clínico puede delegar funciones operativas del día a día en el personal auxiliar de esterilización, pero la responsabilidad última —incluida la firma de los registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un control biológico— no es delegable y recae siempre sobre esta figura.'),
];
// El otro lado: una frase cualquiera que sí está en su documento.
const CLI_12 = [
  trozo(0, 'La retirada del servicio de un autoclave la decide el Coordinador de Calidad tras revisar el control biológico.'),
];
const CITA_CLI_12 = 'La retirada del servicio de un autoclave la decide el Coordinador de Calidad';

// La cita del caso real: 222 caracteres del documento + 22 de glosa = 244.
const CITA_222 = 'la responsabilidad última —incluida la firma de los registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un control biológico— no es delegable y recae siempre sobre esta figura';
const GLOSA = ' [el Director Clínico]';
const CITA_DEL_JUEZ = CITA_222 + GLOSA;

const juicio = (contradictions: DocumentJudgment['contradictions']): DocumentJudgment => ({
  documentId: 'nor-10',
  documentName: 'NOR-10',
  source: 'manual',
  overlapPercent: 20,
  verdict: 'contradiccion',
  contradictions,
  overlappingContent: [],
  uniqueToNewDoc: [],
});

const contradiccion = (existingDocSays: string): DocumentJudgment['contradictions'][number] => ({
  topic: 'quién decide retirar un autoclave',
  newDocSays: CITA_CLI_12,
  existingDocSays,
  severity: 'contradiction',
} as DocumentJudgment['contradictions'][number]);

const corregir = (j: DocumentJudgment) => fixQuotesInJudgment(
  j,
  comprobadorDeLado(verifyQuote, null, CLI_12, null),
  comprobadorDeLado(verifyQuote, null, NOR_10, null),
).judgment;

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); });

describe('F-121 · la glosa entre corchetes', () => {
  it('EL CASO REAL: la cita con «[el Director Clínico]» se rescata y se guarda SIN la glosa', () => {
    expect(CITA_DEL_JUEZ.length).toBe(244);
    const j = corregir(juicio([contradiccion(CITA_DEL_JUEZ)]));
    expect(j.contradictions).toHaveLength(1);
    expect(j.contradictions[0].existingDocSays).toBe(CITA_222);
    expect(j.contradictions[0].newDocSays).toBe(CITA_CLI_12);
    expect(j.discarded?.citaNoVerificable).toBeUndefined();
  });

  it('y lo cuenta: una cita rescatada, ninguna sin rescate', () => {
    const j = corregir(juicio([contradiccion(CITA_DEL_JUEZ)]));
    expect(j.repliegueDeGlosa).toEqual({ rescatadas: 1, sinRescate: 0 });
  });
});

describe('F-121 · el repliegue SÓLO puede rescatar', () => {
  it('una cita que hoy pasa no cambia: ni su texto ni el registro de la pareja', () => {
    const j = corregir(juicio([contradiccion(CITA_222)]));
    expect(j.contradictions[0].existingDocSays).toBe(CITA_222);
    expect(j.repliegueDeGlosa).toBeUndefined();
  });

  it('una cita que pasa CON sus corchetes (están en el documento) los conserva: no se intenta nada', () => {
    const conCorchetes = [trozo(0, 'El plazo de entrega [revisado en 2025] es de siete días naturales.')];
    const lado = comprobadorDeLado(verifyQuote, null, conCorchetes, null);
    const r = comprobarConRepliegueDeGlosa(lado, 'El plazo de entrega [revisado en 2025] es de siete días');
    expect(r.repliegue).toBe('no_intentado');
    expect(r.verificada?.text).toBe('El plazo de entrega [revisado en 2025] es de siete días');
  });

  it('si sin la glosa la cita queda por debajo del mínimo, no se rescata', () => {
    const lado = comprobadorDeLado(verifyQuote, null, [trozo(0, 'esta figura')], null);
    const r = comprobarConRepliegueDeGlosa(lado, '[el Director Clínico] figura');
    expect(r.repliegue).toBe('sin_rescate');
    expect(r.verificada).toBeNull();
  });

  it('una glosa equivocada no rescata nada: sigue fallando y se cuenta', () => {
    const j = corregir(juicio([contradiccion(CITA_222.replace('esta figura', 'el Coordinador') + GLOSA)]));
    expect(j.contradictions).toEqual([]);
    expect(j.repliegueDeGlosa).toEqual({ rescatadas: 0, sinRescate: 1 });
  });

  it('los paréntesis NO son glosa: son texto normal de estos documentos', () => {
    expect(quitarGlosa('se usa EPI completo (guantes, bata y protección ocular)')).toBeNull();
  });
});

describe('F-121 · quitarGlosa', () => {
  it('quita el tramo y el espacio que lo precede', () => {
    expect(quitarGlosa(CITA_DEL_JUEZ)).toBe(CITA_222);
    expect(quitarGlosa('esta figura [el Director Clínico] firma los registros')).toBe('esta figura firma los registros');
  });

  it('conserva el puntero de fila del principio, que no es glosa', () => {
    expect(quitarGlosa('[F3] Residuos sanitarios | 21 dias [tres semanas]')).toBe('[F3] Residuos sanitarios | 21 dias');
    expect(quitarGlosa('[F3] Residuos sanitarios | 21 dias')).toBeNull();
  });
});

describe('F-121 · los contadores del análisis', () => {
  it('suma las parejas y se emite aunque sea cero: el juez corrió', () => {
    const conGlosa = { ...juicio([]), repliegueDeGlosa: { rescatadas: 2, sinRescate: 1 } };
    expect(contadoresDeLaGlosa([conGlosa, juicio([])])).toEqual({
      'juez.citas_rescatadas_quitando_glosa': 2,
      'juez.citas_con_glosa_sin_rescate': 1,
    });
    expect(contadoresDeLaGlosa([juicio([])])).toEqual({
      'juez.citas_rescatadas_quitando_glosa': 0,
      'juez.citas_con_glosa_sin_rescate': 0,
    });
  });

  it('y están en el catálogo: mergeCounters no los tira', () => {
    expect(mergeCounters(contadoresDeLaGlosa([{ ...juicio([]), repliegueDeGlosa: { rescatadas: 1, sinRescate: 0 } }])))
      .toEqual({ 'juez.citas_rescatadas_quitando_glosa': 1, 'juez.citas_con_glosa_sin_rescate': 0 });
  });
});
