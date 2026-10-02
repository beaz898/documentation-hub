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
  it('ROJO antes, VERDE después: cada campo nombra su lado, y lo guardado sigue siendo `evidence`', () => {
    expect(traducirSolapamientosDelJuez([
      { description: 'd', evidenceInNewDoc: 'del nuevo', evidenceInExistingDoc: 'del existente' },
    ])).toEqual([{ description: 'd', evidenceInNewDoc: 'del nuevo', evidence: 'del existente' }]);
  });

  it('lo ausente o lo que no es texto queda en cadena vacía, como el .map() de antes', () => {
    expect(traducirSolapamientosDelJuez([{ description: 7 }, null])).toEqual([
      { description: '', evidenceInNewDoc: '', evidence: '' },
      { description: '', evidenceInNewDoc: '', evidence: '' },
    ]);
  });

  it('sin array, ninguno', () => {
    expect(traducirSolapamientosDelJuez(undefined)).toEqual([]);
    expect(traducirSolapamientosDelJuez('nada')).toEqual([]);
  });

  it('el nombre viejo, `evidence`, ya no se lee: lo que se pide y lo que se lee son lo mismo', () => {
    expect(traducirSolapamientosDelJuez([{ description: 'd', evidence: 'viejo', evidenceInNewDoc: 'n' }]))
      .toEqual([{ description: 'd', evidenceInNewDoc: 'n', evidence: '' }]);
  });
});
