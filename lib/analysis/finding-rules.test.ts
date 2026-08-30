import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks } from '@/lib/read-chunks';
import { applyDeterministicRules } from './finding-rules';
import { groupChunksByTable, type TableGroup } from './table-structure';

/**
 * EL ANCLA DE R2, Y LA AMBIGÜEDAD QUE ESTUVO A PUNTO DE COSTAR UN HALLAZGO
 * VERDADERO (F-90 P3 → F-91 P1).
 *
 * F-90 P3 dictó «si todas las columnas COMUNES difieren, R2 no confirma».
 * «Comunes» admitía dos lecturas:
 *
 *   Lectura A — las columnas que EL JUEZ CITÓ y las dos filas comparten.
 *   Lectura B — todas las columnas que LAS DOS FILAS comparten. ← es ésta.
 *
 * Leídas de corrido las dos suenan igual de razonables, y NO SE DISTINGUEN
 * MIRÁNDOLAS: se distinguen con un número. Por eso este fichero existe y por eso
 * sus casos usan filas del corpus con sus cifras medidas, no ejemplos
 * inventados — un ejemplo inventado se construye, sin querer, para que salga
 * bien la lectura que uno ya tenía en la cabeza.
 *
 * ⚠️ LA PROPIEDAD QUE MATA A LA LECTURA A, y es la que hay que conservar: EL
 * ANCLA NO DEPENDE DE LO QUE EL JUEZ CITÓ. Las mismas dos filas dan el mismo
 * ancla se cite una columna o nueve. Bajo la lectura A eso es falso, y ahí
 * estaba el daño: el juez, cuando ACIERTA, cita solo la columna que difiere, así
 * que su acierto típico salía con cero anclas y se descartaba.
 *
 * Los casos son deterministas y no tocan ningún modelo: `applyDeterministicRules`
 * es una función pura sobre celdas.
 */

const OPE10 = 'OPE-10_tarifario-tratamientos-2026.xlsx';
const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

async function tabla(file: string): Promise<TableGroup> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  return groupChunksByTable(toStoredChunks(chunkSegments(segments, 'd', file, 'o')))[0];
}

async function corpus(): Promise<{ nueva: TableGroup; existente: TableGroup }> {
  return { nueva: await tabla(OPE11), existente: await tabla(OPE10) };
}

function celdas(t: TableGroup, codigo: string): Record<string, string> {
  const f = t.rows.find(r => r.cells?.['Código'] === codigo);
  if (!f?.cells) throw new Error(`no existe la fila ${codigo}`);
  return f.cells;
}

/** R2 tal como lo llama la cascada, con las columnas que el juez citó. */
function r2(
  newCells: Record<string, string>,
  existingCells: Record<string, string>,
  citadas: string[],
) {
  return applyDeterministicRules({
    newDocSays: 'da igual: con celdas, R2 no mira el texto',
    existingDocSays: 'da igual',
    newCells,
    existingCells,
    newColumns: citadas,
    existingColumns: citadas,
  });
}

describe('el ancla de R2 — la ambigüedad de F-90 P3, resuelta por F-91', () => {
  /**
   * EL PAR QUE DECIDIÓ LA LECTURA, con sus dos mitades enfrentadas.
   *
   * EST-02 contra EST-03 es el emparejamiento FALSO de B.124 — el juez enfrentó
   * dos tratamientos distintos. EST-03 contra EST-03 es el hallazgo LEGÍTIMO de
   * la misma pasada: la discrepancia real de precio, sembrada.
   *
   * Las cifras son las que se midieron el 30/08 y las que viajaron en la
   * consulta: nueve columnas comunes, una igual en el falso (`Categoría`, los
   * dos son estética) y ocho en el legítimo.
   */
  it('el falso tiene UN ancla y el legítimo OCHO — las cifras que decidieron F-91', async () => {
    const { nueva, existente } = await corpus();
    const comunes = Object.keys(celdas(nueva, 'EST-02'))
      .filter(c => celdas(existente, 'EST-03')[c] !== undefined);

    const falso = r2(celdas(nueva, 'EST-02'), celdas(existente, 'EST-03'), comunes);
    const legitimo = r2(celdas(nueva, 'EST-03'), celdas(existente, 'EST-03'), comunes);

    expect(comunes).toHaveLength(9);
    expect(falso.outcome).toBe('confirm');
    expect(legitimo.outcome).toBe('confirm');
    if (falso.outcome !== 'confirm' || legitimo.outcome !== 'confirm') return;

    expect(falso.anclas).toEqual(['Categoría']);
    expect(legitimo.anclas).toHaveLength(8);
  });

  /**
   * ⚠️ EL CASO FIJO DE LA AMBIGÜEDAD RESUELTA. Si alguien vuelve a calcular el
   * ancla sobre las columnas citadas, ESTE es el que se pone rojo.
   *
   * Se ejerce con la cita REAL de producción: el 30/08 el juez confirmó el
   * hallazgo legítimo de EST-03 citando UNA SOLA columna, `Precio base`, que es
   * lo que se le pide —señalar la oposición—. Bajo la lectura A eso da cero
   * anclas y el hallazgo verdadero se va a la basura sin que nadie lo juzgue.
   */
  it('EL ANCLA NO DEPENDE DE LA CITA: una columna o nueve, el mismo ancla', async () => {
    const { nueva, existente } = await corpus();
    const n = celdas(nueva, 'EST-03');
    const e = celdas(existente, 'EST-03');
    const comunes = Object.keys(n).filter(c => e[c] !== undefined);

    const citandoUna = r2(n, e, ['Precio base']);
    const citandoTodas = r2(n, e, comunes);

    if (citandoUna.outcome !== 'confirm' || citandoTodas.outcome !== 'confirm') {
      throw new Error('R2 debería confirmar en los dos: el precio difiere');
    }

    // Lo que la lectura A rompía: citando solo la columna que difiere, el ancla
    // se quedaba vacía. Aquí valen ocho las dos veces.
    expect(citandoUna.anclas).toEqual(citandoTodas.anclas);
    expect(citandoUna.anclas).toHaveLength(8);
    expect(citandoUna.anclas).not.toContain('Precio base');
  });

  /**
   * EL DESCARTE, que es lo ÚNICO que el ancla ejecuta desde F-90: dos filas sin
   * un solo valor compartido no exhiben identidad ninguna, y no hay nada que
   * oponer. Hay 807 pares así entre OPE-11 y OPE-10; éste es uno.
   *
   * Y lo que el ancla NO hace, dicho aquí porque es donde se leerá: tener ancla
   * NO asciende nada. Con una sola, la estructura no dice «son la misma
   * entidad» — dice «no puedo descartar que lo sean», y el hallazgo baja a la
   * llamada corta. Por eso una basta y no hay umbral proporcional: no hay nada
   * que el umbral mediría (F-91 P1).
   */
  it('SEG-01 contra HIG-05: ni un valor en común, cero anclas', async () => {
    const { nueva, existente } = await corpus();
    const n = celdas(nueva, 'SEG-01');
    const e = celdas(existente, 'HIG-05');
    const comunes = Object.keys(n).filter(c => e[c] !== undefined);

    const v = r2(n, e, comunes);

    expect(comunes).toHaveLength(9);
    expect(v.outcome).toBe('confirm');
    if (v.outcome !== 'confirm') return;
    expect(v.anclas).toEqual([]);
  });

  /**
   * LA MISMA FILA CONTRA SÍ MISMA no llega a `confirm`: R2 la reclasifica como
   * equivalente antes. Se deja escrito porque es la frontera de arriba del
   * ancla —el máximo posible— y explica por qué no hay ningún caso con nueve.
   */
  it('la frontera de arriba: si NADA difiere, R2 ni siquiera llega al ancla', async () => {
    const { nueva } = await corpus();
    const n = celdas(nueva, 'EST-03');
    const comunes = Object.keys(n);

    expect(r2(n, n, comunes).outcome).toBe('reclassify');
  });
});
