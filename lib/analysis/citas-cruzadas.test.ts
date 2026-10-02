import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoredChunk } from '@/lib/read-chunks';
import { fixQuotesInJudgment, verifyQuote } from './judge';
import { comprobadorDeLado } from './coincidencia-de-cita';
import { traducirSolapamientosDelJuez } from './llm-boundary';
import type { DocumentJudgment } from './types';

/**
 * B.312 — EL JUEZ PONÍA LAS CITAS DE LOS SOLAPAMIENTOS EN EL CAMPO DEL OTRO
 * DOCUMENTO (5 de 5 en las sondas del 01/10; en las contradicciones, 0 de 3).
 *
 * Dos piezas, y las dos se prueban aquí:
 *   · la FRONTERA traduce lo que se le pide al juez (un campo por lado, el nuevo
 *     primero) a la forma guardada, que no cambia;
 *   · el DETECTOR observa: si una cita no está en su lado y sí en el otro, el
 *     log dice «cruzada». El hallazgo se descarta igual — no corrige.
 */

const trozo = (chunkIndex: number, text: string): StoredChunk => ({
  chunkIndex, chunkType: 'text', text, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null,
});

// Lo que dice cada documento de la pareja: frases que sólo están en UN lado.
const NUEVO = [
  trozo(0, 'El punto de retirada centralizado está en la clínica de Chamberí.'),
  trozo(1, 'El material se recoge los martes y los jueves por la tarde.'),
];
const EXISTENTE = [
  trozo(0, 'Cada clínica entrega su material en el punto de retirada de su zona.'),
  trozo(1, 'La recogida se hace una vez por semana, los viernes.'),
];
const CITA_DEL_NUEVO = 'El material se recoge los martes y los jueves por la tarde.';
const CITA_DEL_EXISTENTE = 'La recogida se hace una vez por semana, los viernes.';

const lados = () => ({
  nuevo: comprobadorDeLado(verifyQuote, null, NUEVO, null),
  existente: comprobadorDeLado(verifyQuote, null, EXISTENTE, null),
});

const juicio = (overlappingContent: DocumentJudgment['overlappingContent']): DocumentJudgment => ({
  documentId: 'cand',
  documentName: 'NOR-10',
  source: 'manual',
  overlapPercent: 40,
  verdict: 'solapamiento_parcial',
  contradictions: [],
  overlappingContent,
  uniqueToNewDoc: [],
});

let avisos: string[];
beforeEach(() => {
  avisos = [];
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => { avisos.push(a.map(String).join(' ')); });
});
afterEach(() => { vi.restoreAllMocks(); });

const corregir = (j: DocumentJudgment) => {
  const { nuevo, existente } = lados();
  return fixQuotesInJudgment(j, nuevo, existente).judgment;
};

describe('B.312 · el detector de citas cruzadas: observa, no corrige', () => {
  it('ROJO antes, VERDE después: las dos citas cambiadas de campo → el log dice «cruzada», por cada lado', () => {
    const j = corregir(juicio([
      { description: 'la recogida del material', evidenceInNewDoc: CITA_DEL_EXISTENTE, evidence: CITA_DEL_NUEVO },
    ]));
    const linea = avisos.find(a => a.includes('Solapamiento descartado'));
    expect(linea).toContain('cruzada: la cita del nuevo está en el existente');
    expect(linea).toContain('cruzada: la cita del existente está en el nuevo');
    // Y se descarta igual: el detector no lo arregla.
    expect(j.overlappingContent).toEqual([]);
    expect(j.discarded?.citaNoVerificable).toBe(1);
  });

  it('una sola cita cruzada: sólo ese lado lo dice', () => {
    corregir(juicio([
      { description: 'x', evidenceInNewDoc: CITA_DEL_NUEVO, evidence: CITA_DEL_NUEVO },
    ]));
    const linea = avisos.find(a => a.includes('Solapamiento descartado')) ?? '';
    expect(linea).toContain('lado=existente');
    expect(linea).toContain('cruzada: la cita del existente está en el nuevo');
    expect(linea).not.toContain('cruzada: la cita del nuevo');
  });

  it('también en las contradicciones, con la misma función', () => {
    const { nuevo, existente } = lados();
    fixQuotesInJudgment({
      ...juicio([]),
      contradictions: [{ topic: 'día de recogida', newDocSays: CITA_DEL_EXISTENTE, existingDocSays: CITA_DEL_NUEVO }],
    }, nuevo, existente);
    expect(avisos.find(a => a.includes('Contradicción descartada'))).toContain('cruzada: la cita del nuevo está en el existente');
  });

  it('CONTROL NEGATIVO: una cita inventada sigue fallando, y NO es «cruzada»', () => {
    const j = corregir(juicio([
      { description: 'x', evidenceInNewDoc: 'El material se esteriliza en el autoclave central de Retiro.', evidence: CITA_DEL_EXISTENTE },
    ]));
    const linea = avisos.find(a => a.includes('Solapamiento descartado')) ?? '';
    expect(linea).toContain('lado=nuevo');
    expect(linea).not.toContain('cruzada');
    expect(j.overlappingContent).toEqual([]);
  });

  it('CONTROL NEGATIVO: las citas bien puestas se verifican, y el detector ni las toca', () => {
    const j = corregir(juicio([
      { description: 'la recogida del material', evidenceInNewDoc: CITA_DEL_NUEVO, evidence: CITA_DEL_EXISTENTE },
    ]));
    expect(j.overlappingContent).toHaveLength(1);
    expect(j.overlappingContent[0].evidenceInNewDoc).toBe(CITA_DEL_NUEVO);
    expect(j.overlappingContent[0].evidence).toBe(CITA_DEL_EXISTENTE);
    expect(avisos.some(a => a.includes('cruzada'))).toBe(false);
  });
});

describe('B.312 · la frontera traduce lo que se le pide al juez a la forma guardada', () => {
  // ⚠️ Estos casos NO tuvieron un rojo de fallo: contra el código de antes caían
  // porque la función no existía. Lo que prueban es que la forma guardada no
  // cambia (`evidence` sigue siendo el existente) — ver B.312 en la ficha.
  const NOMBRE_VIEJO = 'frontera.solapamiento_con_nombre_viejo';

  it('cada campo nombra su lado, y lo guardado sigue siendo `evidence`; con el nombre nuevo no se registra nada', () => {
    const r = traducirSolapamientosDelJuez([
      { description: 'd', evidenceInNewDoc: 'del nuevo', evidenceInExistingDoc: 'del existente' },
    ]);
    expect(r.overlappingContent).toEqual([{ description: 'd', evidenceInNewDoc: 'del nuevo', evidence: 'del existente' }]);
    expect(r.discarded).toEqual({});
  });

  it('lo ausente o lo que no es texto queda en cadena vacía, como el .map() de antes', () => {
    expect(traducirSolapamientosDelJuez([{ description: 7 }, null]).overlappingContent).toEqual([
      { description: '', evidenceInNewDoc: '', evidence: '' },
      { description: '', evidenceInNewDoc: '', evidence: '' },
    ]);
  });

  it('sin array, ninguno', () => {
    expect(traducirSolapamientosDelJuez(undefined)).toEqual({ overlappingContent: [], discarded: {} });
    expect(traducirSolapamientosDelJuez('nada')).toEqual({ overlappingContent: [], discarded: {} });
  });

  it('ROJO antes, VERDE después: el nombre viejo, `evidence`, se traduce igual y queda REGISTRADO', () => {
    const r = traducirSolapamientosDelJuez([
      { description: 'd', evidenceInNewDoc: 'n', evidence: 'viejo' },
      { description: 'e', evidenceInNewDoc: 'n2', evidence: 'viejo2' },
    ]);
    expect(r.overlappingContent).toEqual([
      { description: 'd', evidenceInNewDoc: 'n', evidence: 'viejo' },
      { description: 'e', evidenceInNewDoc: 'n2', evidence: 'viejo2' },
    ]);
    expect(r.discarded).toEqual({ [NOMBRE_VIEJO]: 2 });
  });

  it('si vienen los dos nombres, manda el nuevo y no se registra', () => {
    const r = traducirSolapamientosDelJuez([{ description: 'd', evidenceInNewDoc: 'n', evidenceInExistingDoc: 'nuevo', evidence: 'viejo' }]);
    expect(r.overlappingContent[0].evidence).toBe('nuevo');
    expect(r.discarded).toEqual({});
  });

  it('el nombre nuevo vacío y el viejo con texto: se toma el viejo y se registra', () => {
    const r = traducirSolapamientosDelJuez([{ description: 'd', evidenceInNewDoc: 'n', evidenceInExistingDoc: '  ', evidence: 'viejo' }]);
    expect(r.overlappingContent[0].evidence).toBe('viejo');
    expect(r.discarded).toEqual({ [NOMBRE_VIEJO]: 1 });
  });
});

describe('B.313 · el registro de las citas que PASAN: observabilidad, no decide nada', () => {
  let registros: string[];
  beforeEach(() => {
    registros = [];
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => { registros.push(a.map(String).join(' ')); });
  });

  it('ROJO antes, VERDE después: un solapamiento verificado deja su longitud y su vía, por lado', () => {
    const j = corregir(juicio([{ description: 'la recogida', evidenceInNewDoc: CITA_DEL_NUEVO, evidence: CITA_DEL_EXISTENTE }]));
    const linea = registros.find(r => r.includes('Solapamiento verificado')) ?? '';
    expect(linea).toContain(`nuevo: longitud=${CITA_DEL_NUEVO.length}, paso=literal, pajar=todos_los_trozos`);
    expect(linea).toContain(`existente: longitud=${CITA_DEL_EXISTENTE.length}, paso=literal, pajar=todos_los_trozos`);
    expect(j.overlappingContent).toHaveLength(1);
  });

  it('ROJO antes, VERDE después: una contradicción verificada, lo mismo', () => {
    const { nuevo, existente } = lados();
    fixQuotesInJudgment({
      ...juicio([]),
      contradictions: [{ topic: 'día de recogida', newDocSays: CITA_DEL_NUEVO, existingDocSays: CITA_DEL_EXISTENTE }],
    }, nuevo, existente);
    expect(registros.find(r => r.includes('Contradicción verificada'))).toContain(`nuevo: longitud=${CITA_DEL_NUEVO.length}, paso=literal`);
  });

  it('CONTROL: una cita que falla NO deja registro de acierto, y la decisión es la de siempre', () => {
    const j = corregir(juicio([{ description: 'x', evidenceInNewDoc: 'El material se esteriliza en el autoclave central de Retiro.', evidence: CITA_DEL_EXISTENTE }]));
    expect(registros.some(r => r.includes('verificado') || r.includes('verificada'))).toBe(false);
    expect(j.overlappingContent).toEqual([]);
    expect(j.discarded?.citaNoVerificable).toBe(1);
  });

  it('el registro no lleva texto del cliente: sólo números y nombres de paso', () => {
    corregir(juicio([{ description: 'la recogida', evidenceInNewDoc: CITA_DEL_NUEVO, evidence: CITA_DEL_EXISTENTE }]));
    const linea = registros.find(r => r.includes('Solapamiento verificado')) ?? '';
    expect(linea).not.toContain('martes');
    expect(linea).not.toContain('viernes');
  });
});

describe('B.313 · se guarda lo que se descarta: en el juicio, con campos nombrados', () => {
  const INVENTADA = 'El material se esteriliza en el autoclave central de Retiro.';

  it('ROJO antes, VERDE después: un solapamiento descartado queda en el juicio, con las dos citas COMPLETAS', () => {
    const larga = CITA_DEL_NUEVO + ' ' + 'y además una cola que el juez añadió y que no está en ningún documento del cliente'.repeat(3);
    const j = corregir(juicio([{ description: 'la recogida', evidenceInNewDoc: larga, evidence: CITA_DEL_EXISTENTE }]));
    expect(j.overlappingContent).toEqual([]);
    expect(j.descartesPorCita).toHaveLength(1);
    const d = j.descartesPorCita![0];
    expect(d.tipo).toBe('solapamiento');
    expect(d.tema).toBe('la recogida');
    expect(d.citaNuevo).toBe(larga);                // completa: más de 200 caracteres, sin cortar
    expect(larga.length).toBeGreaterThan(200);
    expect(d.citaExistente).toBe(CITA_DEL_EXISTENTE);
    expect(d.ladoFallido).toBe('nuevo');
    expect(d.nuevo).toMatchObject({ verificada: false, longitud: larga.length, pajar: 'todos_los_trozos' });
    expect(d.existente).toMatchObject({ verificada: true, paso: 'literal', pajar: 'todos_los_trozos' });
    expect(d.hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('ROJO antes, VERDE después: una contradicción descartada, con su tema y su paso', () => {
    const { nuevo, existente } = lados();
    const { judgment: j } = fixQuotesInJudgment({
      ...juicio([]),
      contradictions: [{ topic: 'día de recogida', newDocSays: CITA_DEL_NUEVO, existingDocSays: INVENTADA }],
    }, nuevo, existente);
    expect(j.descartesPorCita?.[0]).toMatchObject({
      tipo: 'contradiccion', tema: 'día de recogida', ladoFallido: 'existente',
      citaNuevo: CITA_DEL_NUEVO, citaExistente: INVENTADA,
      nuevo: { verificada: true, paso: 'literal' }, existente: { verificada: false, paso: 'sin_cabeza' },
    });
  });

  it('el TOPE: 10 por pareja, y los demás se cuentan', () => {
    const muchos = Array.from({ length: 13 }, (_, i) => ({ description: `p${i}`, evidenceInNewDoc: `${INVENTADA} número ${i}`, evidence: CITA_DEL_EXISTENTE }));
    const j = corregir(juicio(muchos));
    expect(j.descartesPorCita).toHaveLength(10);
    expect(j.descartesPorCitaOmitidos).toBe(3);
    expect(j.discarded?.citaNoVerificable).toBe(13);   // el contador sigue contándolos todos
  });

  it('CONTROL: sin descartes por cita, el juicio no lleva ni la lista ni la cuenta', () => {
    const j = corregir(juicio([{ description: 'la recogida', evidenceInNewDoc: CITA_DEL_NUEVO, evidence: CITA_DEL_EXISTENTE }]));
    expect(j).not.toHaveProperty('descartesPorCita');
    expect(j).not.toHaveProperty('descartesPorCitaOmitidos');
  });

  it('CONTROL: lo descartado por narración no entra (sólo «cita no verificable»), y el log de siempre sigue', () => {
    const j = corregir(juicio([{ description: 'x', evidenceInNewDoc: 'El fragmento [2] muestra que se recoge los martes', evidence: CITA_DEL_EXISTENTE }]));
    expect(j.discarded?.narracionEnCita).toBe(1);
    expect(j).not.toHaveProperty('descartesPorCita');
  });

  it('la línea de log del descarte no cambia', () => {
    corregir(juicio([{ description: 'x', evidenceInNewDoc: INVENTADA, evidence: CITA_DEL_EXISTENTE }]));
    expect(avisos.find(a => a.includes('Solapamiento descartado'))).toMatch(/lado=nuevo; nuevo: longitud=\d+, paso=\w+, pajar=todos_los_trozos/);
  });
});
