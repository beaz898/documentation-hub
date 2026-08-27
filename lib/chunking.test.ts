import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { extractSegments } from './chunking';

/**
 * Sonda del camino de fixtures: comprueba que un .xlsx de `corpus-pruebas/` se
 * puede extraer desde un test, sin base de datos, y que sale con la MISMA
 * estructura que el pipeline ve (`cells`, `tableId`, `sheetName`, `rowIndex`,
 * `columns`).
 *
 * Existe por un motivo concreto: `extractSegmentsFromExcel` carga la librería
 * con `require('xlsx')` (chunking.ts:664), el único `require()` de todo `lib/`,
 * y bajo Vitest —que ejecuta como ESM— eso podía no resolverse. Si este test
 * pasa, el camino está despejado para las baterías deterministas que vengan.
 */
describe('extractSegments sobre un .xlsx del corpus de pruebas', () => {
  it('devuelve las filas de OPE-10 con sus celdas y su tabla', async () => {
    const buffer = readFileSync('corpus-pruebas/OPE-10_tarifario-tratamientos-2026.xlsx');
    const segments = await extractSegments(buffer, 'OPE-10_tarifario-tratamientos-2026.xlsx');

    const summary = segments.find(s => s.type === 'table_summary');
    const rows = segments.filter(s => s.type === 'table_row');

    // La hoja tiene 60 filas de datos y 9 columnas; la cabecera está en la
    // fila 5, con tres líneas de título antes y una vacía que separa la isla.
    expect(summary).toBeDefined();
    expect(summary?.type === 'table_summary' && summary.columns).toEqual([
      'Código', 'Tratamiento', 'Categoría', 'Precio base', 'Precio con seguro',
      'Duración (min)', 'Profesional asignado', 'Clínica', 'Revisión',
    ]);
    expect(rows).toHaveLength(60);

    const first = rows[0];
    expect(first.type === 'table_row' && first.cells['Código']).toBe('DIA-01');
    expect(first.type === 'table_row' && first.sheetName).toBe('Tarifas');
    expect(first.type === 'table_row' && first.tableId).toBe('Tarifas#0');
    expect(first.type === 'table_row' && first.rowIndex).toBe(0);
  });
});
