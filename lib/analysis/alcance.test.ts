import { describe, expect, it } from 'vitest';

import { restarTablasCubiertas } from './alcance';
import type { SelectionLimit } from './types';

/**
 * BATERÍA DEL ALCANCE DECLARADO (B.122, primera mitad).
 *
 * LO QUE VIGILA es una sola regla, y es la delicada: la resta es POR TABLA, NO
 * POR DOCUMENTO. Restar por documento apagaría el aviso de las OTRAS tablas del
 * mismo fichero, que nadie miró y sobre las que el aviso sigue siendo verdad.
 *
 * EL ARGUMENTO DE FONDO, para quien venga a tocar esto: el aviso existe para
 * convertir un recorte invisible en un límite declarado. Si el recorte ya no
 * implica ceguera —porque el diff cubrió ese terreno, y mejor— declararlo es el
 * fallo inverso. Pero si SÍ implica ceguera, callarlo es el fallo original.
 * Las dos direcciones tienen su caso aquí.
 */

function limite(tableId: string, sheetName: string, rowsLeftOut = 38): SelectionLimit {
  return { documentName: 'OPE-10_tarifario.xlsx', sheetName, tableId, rowsLeftOut, rowsRecovered: 60 };
}

const DOC_A = 'aaa-111';
const DOC_B = 'bbb-222';

describe('restarTablasCubiertas — el alcance declara lo que NADIE miró', () => {
  /**
   * EL CASO DEL CORPUS: una tabla, cubierta por el par emitido. El aviso se
   * queda sin nada que declarar y desaparece — que es lo correcto, porque el
   * diff comparó las sesenta filas celda a celda.
   */
  it('una tabla cubierta por el diff sale del aviso', () => {
    const r = restarTablasCubiertas(
      [{ documentId: DOC_A, limit: limite('Tarifas#0', 'Tarifas') }],
      [{ documentId: DOC_A, tableId: 'Tarifas#0' }],
    );

    expect(r).toHaveLength(0);
  });

  /**
   * ⚠️ EL CASO QUE FIJA LA REGLA: POR TABLA, NO POR DOCUMENTO.
   *
   * Un documento con DOS tablas, de las que el diff solo emparejó UNA. La otra
   * sigue sin mirar y su aviso sigue siendo verdad. Restar por documento —el
   * atajo tentador— la apagaría, y el usuario creería que se revisó algo que
   * nadie tocó.
   */
  it('las OTRAS tablas del mismo documento siguen avisando', () => {
    const r = restarTablasCubiertas(
      [
        { documentId: DOC_A, limit: limite('Tarifas#0', 'Tarifas') },
        { documentId: DOC_A, limit: limite('Personal#0', 'Personal', 12) },
      ],
      [{ documentId: DOC_A, tableId: 'Tarifas#0' }],
    );

    expect(r).toHaveLength(1);
    expect(r[0].tableId).toBe('Personal#0');
    expect(r[0].rowsLeftOut).toBe(12);
  });

  /**
   * Y LA MISMA REGLA EN LA OTRA DIRECCIÓN: un `tableId` solo es único dentro de
   * su documento. Dos ficheros pueden tener ambos una hoja «Tarifas#0», y
   * cubrir la de uno no cubre la del otro. Por eso la clave lleva el documento.
   */
  it('mismo tableId en OTRO documento no se resta', () => {
    const r = restarTablasCubiertas(
      [{ documentId: DOC_B, limit: limite('Tarifas#0', 'Tarifas') }],
      [{ documentId: DOC_A, tableId: 'Tarifas#0' }],
    );

    expect(r).toHaveLength(1);
    expect(r[0].tableId).toBe('Tarifas#0');
  });

  /**
   * SIN DIFF, EL AVISO ES EL DE SIEMPRE. Un documento de prosa no tiene tablas
   * que emparejar, y su recorte sigue siendo ceguera pura: callarlo sería el
   * fallo original que F-74 P2 vino a corregir.
   */
  it('sin tablas cubiertas, el aviso queda intacto', () => {
    const limits = [
      { documentId: DOC_A, limit: limite('Tarifas#0', 'Tarifas') },
      { documentId: DOC_B, limit: limite('Otra#0', 'Otra') },
    ];

    expect(restarTablasCubiertas(limits, [])).toHaveLength(2);
  });

  it('sin límites que declarar, no hay nada que restar', () => {
    expect(restarTablasCubiertas([], [{ documentId: DOC_A, tableId: 'Tarifas#0' }])).toHaveLength(0);
  });

  it('varias tablas cubiertas se restan todas', () => {
    const r = restarTablasCubiertas(
      [
        { documentId: DOC_A, limit: limite('Tarifas#0', 'Tarifas') },
        { documentId: DOC_A, limit: limite('Personal#0', 'Personal') },
        { documentId: DOC_B, limit: limite('Horario#0', 'Horario') },
      ],
      [
        { documentId: DOC_A, tableId: 'Tarifas#0' },
        { documentId: DOC_B, tableId: 'Horario#0' },
      ],
    );

    expect(r.map(l => l.tableId)).toEqual(['Personal#0']);
  });
});
