import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { extractSegments, chunkSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { fixQuotesInJudgment, verifyQuote } from './judge';
import { comprobadorDeLado, type LoEntregado } from './pajar-de-la-cita';
import { contadoresDelTramo, localizadorDeLado } from './repliegue-de-tramo';
import type { DocumentJudgment } from './types';

/**
 * F-125, fase 3.1 · EL CABLE: la puerta de `fixQuotesInJudgment` con el tramo
 * literal más largo enganchado, sólo en las contradicciones.
 *
 * ⚠️ LO QUE ESTE FICHERO NO PUEDE AFIRMAR: que un empalme falso «no se
 * publica». Eso lo decide el verificador, que es una llamada al modelo; se mide
 * en el arnés y cuesta créditos. Lo que sí se afirma aquí es lo que lo hace
 * posible: lo que sigue adelante son las FRASES REALES, nunca el empalme.
 */

const unidos = (trozos: StoredChunk[]) => [...trozos].sort((a, b) => a.chunkIndex - b.chunkIndex).map(c => c.text).join('\n\n');
async function trozosDe(nombre: string): Promise<StoredChunk[]> {
  return toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${nombre}`), nombre), 'prueba', nombre, 'prueba'));
}

/** La puerta de una pareja, como la monta el juez en `pareja_entera`. */
function puerta(nuevos: StoredChunk[], existentes: StoredChunk[], conTramo: boolean) {
  const eNuevo: LoEntregado = { texto: unidos(nuevos), trozos: [] };
  const eExistente: LoEntregado = { texto: unidos(existentes), trozos: [] };
  const nuevo = comprobadorDeLado(verifyQuote, eNuevo, nuevos, null);
  const existente = comprobadorDeLado(verifyQuote, eExistente, existentes, null);
  const localizadores = conTramo
    ? { nuevo: localizadorDeLado({ entregado: eNuevo, trozos: nuevos }), existente: localizadorDeLado({ entregado: eExistente, trozos: existentes }) }
    : undefined;
  return (j: DocumentJudgment) => fixQuotesInJudgment(j, nuevo, existente, [], localizadores);
}

const juicio = (p: Partial<DocumentJudgment>): DocumentJudgment => ({
  documentId: 'cand', documentName: 'CLI-13.docx', source: 'manual', overlapPercent: 45, verdict: 'tema_similar',
  contradictions: [], overlappingContent: [], uniqueToNewDoc: [], ...p,
});

const CABEZA = 'El punto de retirada centralizado concentra el material de las tres clínicas';
const LUGAR_206 = CABEZA + ', ubicado en la clínica de Chamberí, desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro';
const LUGAR_111 = CABEZA + ', ubicado en la clínica de Chamberí';

describe('LUGAR, con NOR-11 y CLI-13 reales', async () => {
  const nor11 = await trozosDe('NOR-11_gestion-de-residuos-sanitarios.docx');
  const cli13 = await trozosDe('CLI-13_instrucciones-clinicas-residuos.docx');
  // El lado existente: una frase literal de CLI-13 (la cita que el juez sí copia bien).
  const CITA_EXISTENTE = 'El punto de retirada centralizado para las tres clínicas de la red se encuentra en la clínica de Retiro';
  const contradiccion = (newDocSays: string) => juicio({
    contradictions: [{ topic: 'Ubicación del punto de retirada centralizado', newDocSays, existingDocSays: CITA_EXISTENTE, severity: 'contradiction' }],
  });

  // ── COMMIT 10 · paso 'recompuesta' (arquitecto, 13/10/2026) ──────────────
  // Un lado que pasó por el tramo NO se registra como lo que daría recalcularlo:
  // ni `literal` en el log (la frase real del ancla sí es literal) ni
  // `segmentos_de_fila` en el descarte guardado (la cita del juez no casa en
  // ningún pajar, y ése es el valor por defecto de datosDelAcierto).
  const INVENTADA = 'La clínica de Salamanca es la única que recibe al gestor autorizado los sábados por la tarde';
  const conExistente = (newDocSays: string, existingDocSays: string) => juicio({
    contradictions: [{ topic: 'Ubicación del punto de retirada centralizado', newDocSays, existingDocSays, severity: 'contradiction' }],
  });
  const lineasDeLog = (f: () => void): string[] => {
    const espia = vi.spyOn(console, 'log').mockImplementation(() => {});
    try { f(); return espia.mock.calls.map(a => String(a[0])); } finally { espia.mockRestore(); }
  };

  it('(c10-1) un lado aceptado por (B) sale en el log con paso=recompuesta, no literal', () => {
    const lineas = lineasDeLog(() => puerta(nor11, cli13, true)(contradiccion(LUGAR_206)));
    const verificada = lineas.find(l => l.includes('Contradicción verificada'));
    expect(verificada).toMatch(/nuevo: longitud=\d+, paso=recompuesta,/);
    expect(verificada).not.toMatch(/nuevo: longitud=\d+, paso=literal,/);
  });

  it('(c10-2) LA TRAMPA: un lado por (B) y el otro fallido → el descarte guarda paso=recompuesta, no segmentos_de_fila', () => {
    expect(unidos(cli13)).not.toContain(INVENTADA);
    const r = puerta(nor11, cli13, true)(conExistente(LUGAR_206, INVENTADA));
    expect(r.judgment.contradictions).toEqual([]);
    const d = r.judgment.descartesPorCita?.[0];
    expect(d?.ladoFallido).toBe('existente');
    expect(d?.nuevo.verificada).toBe(true);
    expect(d?.nuevo.paso).toBe('recompuesta');
  });

  it('(c10-3) no-regresión: un lado que NO pasó por (B) registra el mismo paso que antes, en el descarte y en el log', () => {
    const literal = nor11[8].text.slice(0, 120);
    const con = puerta(nor11, cli13, true)(conExistente(literal, INVENTADA));
    const sin = puerta(nor11, cli13, false)(conExistente(literal, INVENTADA));
    expect(con.judgment.descartesPorCita).toEqual(sin.judgment.descartesPorCita);
    expect(con.judgment.descartesPorCita?.[0].nuevo.paso).toBe('literal');
    const logCon = lineasDeLog(() => puerta(nor11, cli13, true)(contradiccion(literal)));
    const logSin = lineasDeLog(() => puerta(nor11, cli13, false)(contradiccion(literal)));
    expect(logCon).toEqual(logSin);
    expect(logCon.find(l => l.includes('Contradicción verificada'))).toMatch(/nuevo: longitud=\d+, paso=literal,/);
  });

  it('control: la cita existente es literal en CLI-13', () => {
    expect(CITA_EXISTENTE.length).toBeGreaterThan(40);
    expect(unidos(cli13)).toContain(CITA_EXISTENTE);
  });

  it('(2) la de 206: llega al tramo, recompuesta, y sigue adelante con las DOS frases reales y no con el empalme', () => {
    const r = puerta(nor11, cli13, true)(contradiccion(LUGAR_206));
    expect(r.judgment.contradictions).toHaveLength(1);
    const c = r.judgment.contradictions[0];
    expect(c.newDocSays).not.toBe(LUGAR_206);
    expect(c.newDocSays).toMatch(/^El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, ubicado en la clínica de Chamberí, .* destino final de tratamiento\.$/);
    expect(c.recompuesta?.nuevo?.fraseDelResto.texto).toMatch(/^Dado que el punto de retirada centralizado concentra el material de las tres clínicas, cada centro coordina/);
    expect(c.recompuesta?.nuevo?.citaDelJuez).toBe(LUGAR_206);
    expect(c.recompuesta?.nuevo?.enTrozosDistintos).toBe(false);
    expect(c.recompuesta?.existente).toBeUndefined();
    expect(c.existingDocSays).toBe(CITA_EXISTENTE);
    expect(r.evidence.contradictions[0].newChunk?.chunkIndex).toBe(c.recompuesta?.nuevo?.fraseDelAncla.chunkIndex);
    expect(r.judgment.citasAlTramo?.map(x => [x.lado, x.salida])).toEqual([['nuevo', 'recompuesta']]);
  });

  // ⚠️ EL CIRCUITO ENTERO DE LOS CONTADORES (revisión del arquitecto, 13/10/2026):
  // las pruebas de contadoresDelTramo construyen citasAlTramo a mano, así que si
  // fixQuotesInJudgment dejara de guardarlo, los contadores por cita valdrían cero
  // para siempre y todo seguiría en verde. Ésta los saca del juicio REAL.
  it('(2) los contadores salen del juicio real: una recompuesta, ninguna en trozos distintos (las dos piezas en el trozo 8)', () => {
    const r = puerta(nor11, cli13, true)(contradiccion(LUGAR_206));
    const c = contadoresDelTramo([r.judgment]);
    expect(c['juez.citas_recompuestas']).toBe(1);
    expect(c['juez.citas_recompuestas_en_trozos_distintos']).toBe(0);
  });

  it('(2) control: sin el tramo enganchado, la misma cita muere como hoy (cabeza_sin_cola)', () => {
    const r = puerta(nor11, cli13, false)(contradiccion(LUGAR_206));
    expect(r.judgment.contradictions).toEqual([]);
    expect(r.judgment.descartesPorCita?.[0].nuevo.paso).toBe('cabeza_sin_cola');
  });

  it('(3) la de 111: resto_insuficiente, descartada como hoy y anotada', () => {
    const r = puerta(nor11, cli13, true)(contradiccion(LUGAR_111));
    expect(r.judgment.contradictions).toEqual([]);
    expect(r.judgment.discarded?.citaNoVerificable).toBe(1);
    expect(r.judgment.citasAlTramo?.map(x => [x.lado, x.salida])).toEqual([['nuevo', 'resto_insuficiente']]);
  });

  it('(6) el bucle de SOLAPAMIENTOS, con la misma cita de LUGAR, sale idéntico con y sin el tramo', () => {
    const j = juicio({ overlappingContent: [{ description: 'Punto de retirada', evidenceInNewDoc: LUGAR_206, evidence: CITA_EXISTENTE }] });
    const con = puerta(nor11, cli13, true)(j);
    const sin = puerta(nor11, cli13, false)(j);
    expect(con.judgment.overlappingContent).toEqual(sin.judgment.overlappingContent);
    expect(con.judgment.overlappingContent).toEqual([]);
    expect(con.judgment.descartesPorCita).toEqual(sin.judgment.descartesPorCita);
    expect(con.judgment.discarded).toEqual(sin.judgment.discarded);
    expect(con.judgment.citasAlTramo).toBeUndefined();
  });

  it('(1) una contradicción cuyas citas pasan hoy sale idéntica con y sin el tramo, y no llega a él', () => {
    const literal = nor11[8].text.slice(0, 120);
    const j = contradiccion(literal);
    const con = puerta(nor11, cli13, true)(j);
    const sin = puerta(nor11, cli13, false)(j);
    expect(con.judgment.contradictions).toEqual(sin.judgment.contradictions);
    expect(con.judgment.contradictions[0].newDocSays).toBe(literal);
    expect(con.judgment.citasAlTramo).toBeUndefined();
  });
});

describe('(7) el empalme falso: dos trozos literales que pegados afirman lo que ninguna frase dice', () => {
  const t = (chunkIndex: number, text: string): StoredChunk => ({
    chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
  });
  const A = 'Ninguna clínica del grupo puede almacenar residuos del grupo III durante más de setenta y dos horas.';
  const B = 'Las clínicas de Salamanca y Retiro entregan sus residuos al gestor autorizado cada martes por la mañana.';
  const NUEVOS = [t(0, `Primer apartado de la norma, sobre plazos. ${A}`), t(1, `Segundo apartado de la norma, sobre la entrega. ${B}`)];
  const EXISTENTES = [t(0, 'La clínica de Retiro guarda sus residuos del grupo III hasta el viernes, cuando pasa el gestor.')];
  // «Ninguna clínica … entregan sus residuos al gestor…»: que ninguna clínica
  // entrega al gestor no lo dice ninguna de las dos frases.
  const EMPALME = 'Ninguna clínica del grupo puede almacenar residuos del grupo III, entregan sus residuos al gestor autorizado cada martes por la mañana';

  it('pasa la puerta como recompuesta, pero lo que sigue adelante son las dos frases reales; el empalme sólo queda en la marca', () => {
    const r = puerta(NUEVOS, EXISTENTES, true)(juicio({
      contradictions: [{ topic: 'Entrega al gestor', newDocSays: EMPALME, existingDocSays: EXISTENTES[0].text, severity: 'contradiction' }],
    }));
    expect(r.judgment.contradictions).toHaveLength(1);
    const c = r.judgment.contradictions[0];
    // LO QUE LO PROTEGE, y no está en este fichero: el verificador juzga estas
    // dos frases reales, que no sostienen «ninguna clínica entrega».
    expect(new Set([c.newDocSays, c.recompuesta?.nuevo?.fraseDelResto.texto])).toEqual(new Set([A, B]));
    expect(c.recompuesta?.nuevo?.enTrozosDistintos).toBe(true);
    expect(c.recompuesta?.nuevo?.citaDelJuez).toBe(EMPALME);
  });
});

describe('(4) INVARIANTE D3: ningún hallazgo publicable lleva el empalme como cita', () => {
  it('en todos los casos de arriba, la cita de cada lado recompuesto es una frase que existe en su documento', async () => {
    const nor11 = await trozosDe('NOR-11_gestion-de-residuos-sanitarios.docx');
    const cli13 = await trozosDe('CLI-13_instrucciones-clinicas-residuos.docx');
    const r = puerta(nor11, cli13, true)(juicio({
      contradictions: [
        { topic: 'a', newDocSays: LUGAR_206, existingDocSays: cli13[0].text.slice(0, 80), severity: 'contradiction' },
        { topic: 'b', newDocSays: LUGAR_111, existingDocSays: cli13[0].text.slice(0, 80), severity: 'contradiction' },
      ],
    }));
    expect(r.judgment.contradictions.length).toBeGreaterThan(0);
    const textoNuevo = unidos(nor11);
    for (const c of r.judgment.contradictions) {
      if (!c.recompuesta?.nuevo) continue;
      expect(c.newDocSays).not.toBe(c.recompuesta.nuevo.citaDelJuez);
      expect(textoNuevo).toContain(c.newDocSays);
      expect(textoNuevo).toContain(c.recompuesta.nuevo.fraseDelResto.texto);
      expect(textoNuevo).not.toContain(c.recompuesta.nuevo.citaDelJuez);
    }
  });
});
