import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { buildFindingBlock } from './verify-findings';
import { contextoDeLaCita, ladosParaVerificar, lineaDelContexto, contarSinContexto, TOPE_DE_TROZOS_DE_UNA_CITA } from './contexto-de-la-cita';

/**
 * B.322 (04/10/2026) — EL VERIFICADOR RECIBE EL TROZO ENTERO DONDE ESTÁ LA CITA.
 * El caso real: la cita de 222 caracteres de NOR-10 (`[fa22ca84]`), que murió
 * en el verificador 5 de 6 veces. Acaba en «esta figura», y el sujeto —«El
 * Director Clínico puede delegar…»— está al principio de su misma frase, en su
 * mismo trozo, que el verificador no recibía: sólo el anterior y el siguiente.
 * Lee disco (el .docx del corpus): lleva su tope contra cuelgues.
 */
const CITA_222 = 'la responsabilidad última —incluida la firma de los registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un control biológico— no es delegable y recae siempre sobre esta figura';
const EXISTENTE_340 = 'El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide';
const SUJETO = 'El Director Clínico puede delegar funciones operativas';

let trozos: StoredChunk[] = [];
beforeAll(async () => {
  const f = 'NOR-10_protocolo-esterilizacion-instrumental.docx';
  trozos = toStoredChunks(chunkSegments(await extractSegments(readFileSync(`corpus-pruebas/${f}`), f), 'd', f, 'o'));
}, 120_000);

const porIndice = (k: number) => trozos.find(c => c.chunkIndex === k) ?? null;

describe('B.322 · el verificador ve el trozo entero de la cita', { timeout: 120_000 }, () => {
  it('el caso: la cita de 222 cabe en un trozo, y su sujeto está en ESE trozo y no en sus vecinos', () => {
    expect(CITA_222.length).toBe(222);
    const suyo = trozos.find(c => c.text.includes(CITA_222))!;
    expect(suyo.text).toContain(SUJETO);
    expect(porIndice(suyo.chunkIndex - 1)?.text ?? '').not.toContain(SUJETO);
    expect(porIndice(suyo.chunkIndex + 1)?.text ?? '').not.toContain(SUJETO);
  });

  it('ROJO antes, VERDE después: el bloque que lee el verificador lleva el sujeto de «esta figura»', () => {
    const suyo = trozos.find(c => c.text.includes(CITA_222))!;
    // Como lo construye el pipeline: con `ladosParaVerificar`.
    const bloque = buildFindingBlock({
      topic: 'Autoridad para retirar autoclave de servicio tras fallo de control biológico',
      newDocSays: CITA_222,
      existingDocSays: EXISTENTE_340,
      existingDocumentName: 'CLI-12_manual-calidad-clinica.docx',
      newChunk: suyo,
      existingChunk: null,
      ...ladosParaVerificar({ chunks: trozos, chunk: suyo, cita: CITA_222 }, { chunks: [], chunk: null, cita: EXISTENTE_340 }).campos,
      newColumnOrder: null,
      existingColumnOrder: null,
    }, 1);
    expect(bloque).toContain(SUJETO);
    expect(bloque).toContain(`"${CITA_222}"`);
  });
});

// ─── El contexto, sin documentos de por medio ───────────────────────────────
const t = (chunkIndex: number, text: string): StoredChunk => ({
  chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});
const T = [
  t(0, 'Primera sección, sin nada que ver con la cita que se busca aquí.'),
  t(1, 'El Director Clínico es el responsable último del protocolo, y la firma de los registros'),
  t(2, 'de auditoría trimestral recae siempre sobre esta figura, sin excepción posible.'),
  t(3, 'Última sección, también ajena a la cita.'),
];

describe('B.322 · contextoDeLaCita', () => {
  it('con trozo de evidencia: ese trozo entero, y sus dos vecinos', () => {
    expect(contextoDeLaCita(T, T[1], 'el responsable último')).toEqual({
      trozos: [T[1].text], vecinos: { previous: T[0].text, next: T[2].text }, estado: 'trozo',
    });
  });

  it('una cita que CRUZA dos trozos (sin trozo de evidencia): los dos, enteros, y los vecinos de fuera', () => {
    const cita = 'El Director Clínico es el responsable último del protocolo, y la firma de los registros de auditoría trimestral recae siempre sobre esta figura';
    expect(contextoDeLaCita(T, null, cita)).toEqual({
      trozos: [T[1].text, T[2].text], vecinos: { previous: T[0].text, next: T[3].text }, estado: 'cruza',
    });
  });

  it('CONTROL: sin trozos o sin poder localizarla, como antes: ni trozo ni vecinos', () => {
    expect(contextoDeLaCita([], null, 'algo')).toEqual({ trozos: [], vecinos: { previous: null, next: null }, estado: 'sin_contexto' });
    expect(contextoDeLaCita(T, null, 'una cita que no está en ningún trozo de este documento de prueba')).toEqual({ trozos: [], vecinos: { previous: null, next: null }, estado: 'sin_contexto' });
  });

  it('el TOPE: una cita que cruza más trozos de los declarados no lleva ninguno; con los declarados, sí', () => {
    const tramos = Array.from({ length: TOPE_DE_TROZOS_DE_UNA_CITA + 2 }, (_, k) => t(k, `tramo número ${k} de una frase larguísima que sigue`));
    const cruzaTodos = tramos.map(c => c.text).join(' ');
    expect(contextoDeLaCita(tramos, null, cruzaTodos).trozos).toEqual([]);
    const cruzaElTope = tramos.slice(0, TOPE_DE_TROZOS_DE_UNA_CITA).map(c => c.text).join(' ');
    expect(contextoDeLaCita(tramos, null, cruzaElTope).trozos).toHaveLength(TOPE_DE_TROZOS_DE_UNA_CITA);
  });

  it('CONTROL: sin trozo, el bloque del verificador es EXACTAMENTE el de antes', () => {
    const bloque = buildFindingBlock({
      topic: 'T', newDocSays: 'cita nueva', existingDocSays: 'cita vieja', existingDocumentName: 'X',
      newChunk: null, existingChunk: null,
      newNeighbours: { previous: null, next: null }, existingNeighbours: { previous: null, next: null },
      newTrozos: [], existingTrozos: [], newColumnOrder: null, existingColumnOrder: null,
    }, 1);
    expect(bloque).toBe(['[1] Tema: T', 'DOCUMENTO NUEVO:', '"cita nueva"', '', 'DOCUMENTO EXISTENTE ("X"):', '"cita vieja"'].join(String.fromCharCode(10)));
  });

  it('CONTROL: una fila de tabla se sigue pintando como fila, con todas sus columnas', () => {
    const fila: StoredChunk = { chunkIndex: 5, chunkType: 'table_row', text: 'x', sheetName: 'H', tableId: 'H#0', rowIndex: 2, cells: { Nombre: 'Ana', Puesto: 'Higienista' }, columnOrder: null };
    const bloque = buildFindingBlock({
      topic: 'T', newDocSays: 'Ana | Higienista', existingDocSays: 'c', existingDocumentName: 'X',
      newChunk: fila, existingChunk: null,
      ...ladosParaVerificar({ chunks: [fila], chunk: fila, cita: 'Ana | Higienista' }, { chunks: [], chunk: null, cita: 'c' }).campos,
      newColumnOrder: ['Nombre', 'Puesto'], existingColumnOrder: null,
    }, 1);
    expect(bloque).toContain('Fila de tabla de la hoja "H", fila 3. Todas sus columnas: Nombre: Ana | Puesto: Higienista');
  });
});

describe('B.322 · el sello: una línea de log por hallazgo que entra al verificador, sin texto del cliente', () => {
  it('cada lado dice su estado: trozo, cruza, fila de tabla o sin contexto', () => {
    expect(contextoDeLaCita(T, T[1], 'el responsable último').estado).toBe('trozo');
    expect(contextoDeLaCita(T, null, 'El Director Clínico es el responsable último del protocolo, y la firma de los registros de auditoría trimestral recae siempre sobre esta figura').estado).toBe('cruza');
    expect(contextoDeLaCita([], null, 'algo').estado).toBe('sin_contexto');
    const fila: StoredChunk = { chunkIndex: 0, chunkType: 'table_row', text: 'x', sheetName: 'H', tableId: 'H#0', rowIndex: 0, cells: { A: '1' }, columnOrder: null };
    // Una fila de tabla se pinta como fila (con todas sus columnas), no como trozo: no lleva trozos.
    expect(contextoDeLaCita([fila], fila, '1')).toMatchObject({ estado: 'fila_de_tabla', trozos: [] });
  });

  it('la línea: trozos y caracteres de contexto por lado, y su estado; ni una palabra del documento', () => {
    const lados = ladosParaVerificar({ chunks: T, chunk: T[1], cita: 'el responsable último' }, { chunks: [], chunk: null, cita: 'otra' });
    const linea = lineaDelContexto(lados);
    expect(linea).toBe(`contexto del verificador: nuevo trozos=1 caracteres=${T[1].text.length} (trozo) · existente trozos=0 caracteres=0 (sin_contexto)`);
    for (const c of T) expect(linea).not.toContain(c.text.slice(0, 12));
  });

  it('el contador de los que se quedan sin contexto, por lado: el tope ciego, contado', () => {
    const counts: Record<string, number> = {};
    contarSinContexto(counts, ladosParaVerificar({ chunks: [], chunk: null, cita: 'a' }, { chunks: [], chunk: null, cita: 'b' }));
    contarSinContexto(counts, ladosParaVerificar({ chunks: T, chunk: T[1], cita: 'x' }, { chunks: [], chunk: null, cita: 'b' }));
    expect(counts).toEqual({ 'verificador.cita_sin_contexto': 3 });
  });
});
