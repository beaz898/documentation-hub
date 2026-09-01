import { describe, expect, it } from 'vitest';

import type { StoredChunk } from '@/lib/read-chunks';
import type { JudgmentEvidence } from './judge';
import { applyCascadeToCandidate } from './pipeline';
import type { StructuralOverlap } from './retrieval';
import type { DocumentJudgment } from './types';

/**
 * EL SOLAPAMIENTO ESTRUCTURAL NO VUELCA LAS FILAS DEL CLIENTE (B.122, 2ª mitad).
 *
 * Hasta el 01/09 su descripción terminaba con la lista entera de filas
 * coincidentes: en el par grande, ~2.200 caracteres de nombres, precios y
 * profesionales que viajaban a los TRES prompts del cliente y al jsonb.
 *
 * Y NO SE VEÍAN EN PANTALLA — `ProblemDetail` pinta `comparedValues` cuando los
 * hay y solo cae a `description` si no. Copia sin lector, que es exactamente lo
 * que la regla de F-94 P3 prohíbe: los datos del cliente se persisten donde se
 * MUESTRAN y van a un modelo solo donde DECIDEN.
 *
 * LO QUE SÍ TIENE QUE SEGUIR DICIENDO, y por eso el hallazgo no se retira: el
 * recuento, el total y las columnas. Son campos propios —`collapsedCount`,
 * `rowsTotal`, `columns`— y no se derivan de las filas, así que quitarlas no
 * quita información. Es lo que el diff todavía no sabe decir.
 *
 * Determinista y sin modelo: el hallazgo estructural se construye sin juicio, y
 * el juicio que se le pasa no lleva contradicciones que puedan alcanzar la
 * llamada corta.
 */

const FILAS_DEL_CLIENTE = [
  'Dra. Marta Gil / Odontóloga general / Chamberí',
  'Dr. Javier Soto / Ortodoncista / Retiro',
  'Laura Núñez / Higienista / Chamberí',
];

const solapamiento: StructuralOverlap = {
  tableId: 'Tarifas#0',
  sheetName: 'Tarifas',
  columns: ['Empleado', 'Puesto'],
  collapsedCount: 20,
  rowsTotal: 60,
};

function juicioVacio(): { judgment: DocumentJudgment; evidence: JudgmentEvidence } {
  return {
    judgment: {
      documentId: 'bbb-222',
      documentName: 'OPE-10.xlsx',
      source: 'manual',
      overlapPercent: 50,
      verdict: 'solapamiento_parcial',
      contradictions: [],
      overlappingContent: [],
      uniqueToNewDoc: [],
    },
    evidence: { contradictions: [], overlaps: [] },
  };
}

async function correr(overlaps: StructuralOverlap[]) {
  const { judgment, evidence } = juicioVacio();
  const sinChunks: StoredChunk[] = [];
  return applyCascadeToCandidate(
    judgment, evidence, sinChunks, sinChunks, 'OPE-11.xlsx', 'test', overlaps,
    { emitidos: [], sinInterseccion: [] },
  );
}

describe('el solapamiento estructural — sin volcado de filas', () => {
  it('la descripción lleva el recuento, el total y las columnas', async () => {
    const r = await correr([solapamiento]);

    const entrada = r.judgment.overlappingContent.find(o => o.confirmedBy === 'estructura');
    expect(entrada).toBeDefined();
    expect(entrada!.description).toContain('20 de 60 filas');
    expect(entrada!.description).toContain('Empleado y Puesto');
    expect(entrada!.description).toContain('OPE-11.xlsx');
    expect(entrada!.structuralPercent).toBe(33);
  });

  /**
   * ⚠️ EL CASO QUE VIGILA LA FUGA. Si alguien devuelve la lista a la plantilla,
   * ESTE se pone rojo — y es la única forma de que no vuelva, porque el volcado
   * no se ve en pantalla y nadie lo echaría de menos.
   *
   * Las filas de `FILAS_DEL_CLIENTE` son la forma exacta que tenían las que
   * viajaban: valores unidos por « / », que es lo que arma `buildContextFragment`.
   */
  it('NINGUNA fila del cliente aparece en la descripción', async () => {
    const r = await correr([solapamiento]);

    const entrada = r.judgment.overlappingContent.find(o => o.confirmedBy === 'estructura');
    for (const fila of FILAS_DEL_CLIENTE) {
      expect(entrada!.description).not.toContain(fila);
    }
    // Ni siquiera un nombre suelto: la descripción habla de columnas, no de
    // personas.
    expect(entrada!.description).not.toContain('Marta Gil');
    expect(entrada!.description).not.toContain(' / ');
  });

  /**
   * COMPORTAMIENTO EN VACÍO, declarado (la cuarta pieza, F-93): sin
   * solapamientos estructurales no se inventa ninguna entrada. `overlappingContent`
   * se queda como venía del juez.
   */
  it('sin solapamientos estructurales no se añade nada', async () => {
    const r = await correr([]);

    expect(r.judgment.overlappingContent.filter(o => o.confirmedBy === 'estructura')).toHaveLength(0);
  });
});
