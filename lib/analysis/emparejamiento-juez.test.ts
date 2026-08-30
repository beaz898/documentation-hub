import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { veredictoDeEmparejamiento } from './emparejamiento-juez';
import { emparejarTablas, type ParDeTablas } from './table-pairing';
import { groupChunksByTable, type TableGroup } from './table-structure';

/**
 * BATERÍA DE LA TERCERA CONDICIÓN (F-89 P2, B.124).
 *
 * LO QUE VIGILA es que R2 deje de certificar «misma entidad emparejada» sin
 * comprobarla — y, con el mismo cuidado, que NO se pase de frenada: el diff
 * solo puede desmentir donde comparó.
 *
 * EL CASO CENTRAL ES REAL, del corpus: EST-02 contra EST-03, que es
 * exactamente el falso positivo que llegó a producción el 30/08 con el sello
 * más fuerte del producto.
 */

const OPE10 = 'OPE-10_tarifario-tratamientos-2026.xlsx';
const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

async function tablas(file: string): Promise<TableGroup[]> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  return groupChunksByTable(toStoredChunks(chunkSegments(segments, 'd', file, 'o')));
}

/** Los pares del corpus, emparejados como en producción. */
async function paresDelCorpus(): Promise<{ pares: ParDeTablas[]; nueva: TableGroup; existente: TableGroup }> {
  const tn = await tablas(OPE11);
  const te = await tablas(OPE10);
  const { pares } = emparejarTablas(tn, te);
  return { pares, nueva: pares[0].nueva, existente: pares[0].existente };
}

/** La fila cuyo Código es el pedido. */
function fila(t: TableGroup, codigo: string): StoredChunk {
  const f = t.rows.find(r => r.cells?.['Código'] === codigo);
  if (!f) throw new Error(`no existe la fila ${codigo}`);
  return f;
}

describe('veredictoDeEmparejamiento — el caso real de B.124', () => {
  /**
   * EL FALSO POSITIVO QUE LLEGÓ A PRODUCCIÓN. El juez enfrentó EST-02 contra
   * EST-03 y la cascada lo selló con las ocho columnas. Ground truth del
   * registro de siembra: EST-02 es una de las 20 IDÉNTICAS, EST-03 una de las
   * 15 sembradas que difiere en UNA columna. No son la misma fila.
   */
  it('EST-02 contra EST-03 es NO-PAREJA', async () => {
    const { pares, nueva, existente } = await paresDelCorpus();

    expect(veredictoDeEmparejamiento(pares, fila(nueva, 'EST-02'), fila(existente, 'EST-03')))
      .toBe('no_pareja');
  });

  /**
   * Y LA OTRA MITAD, que es la que impide que el arreglo se pase de frenada:
   * las parejas VERDADERAS siguen siendo parejas. Un guardián que dijera «no»
   * a todo sería tan falso como el que decía «sí» a todo.
   */
  it('EST-03 contra EST-03 SÍ es pareja — la discrepancia real se conserva', async () => {
    const { pares, nueva, existente } = await paresDelCorpus();

    expect(veredictoDeEmparejamiento(pares, fila(nueva, 'EST-03'), fila(existente, 'EST-03')))
      .toBe('pareja');
  });

  it('EST-02 contra EST-02 también, aunque sean idénticas', async () => {
    const { pares, nueva, existente } = await paresDelCorpus();

    expect(veredictoDeEmparejamiento(pares, fila(nueva, 'EST-02'), fila(existente, 'EST-02')))
      .toBe('pareja');
  });

  /**
   * UNA FILA SIN PAREJA NINGUNA. Las SEG- solo están en OPE-11; emparejarlas
   * con lo que sea es inválido. Sale gratis por preguntarle al emparejamiento
   * en vez de comparar claves: con claves habría que acordarse de este caso.
   */
  it('una fila sin correspondencia no empareja con nada', async () => {
    const { pares, nueva, existente } = await paresDelCorpus();
    const soloEnNuevo = nueva.rows.find(r => (r.cells?.['Código'] ?? '').startsWith('SEG-'))!;

    expect(veredictoDeEmparejamiento(pares, soloEnNuevo, fila(existente, 'EST-03')))
      .toBe('no_pareja');
  });

  /**
   * TODAS LAS PAREJAS VERDADERAS DEL CORPUS, de una vez. Es la garantía de que
   * este guardián no rompe nada de lo que hoy funciona: las 35 que el diff
   * emparejó siguen siendo parejas, una por una.
   */
  it('las 35 parejas verdaderas siguen siéndolo, todas', async () => {
    const { pares } = await paresDelCorpus();
    const todas = pares[0].clave.pairs;

    expect(todas).toHaveLength(35);
    for (const p of todas) {
      expect(veredictoDeEmparejamiento(pares, p.nueva, p.existente)).toBe('pareja');
    }
  });
});

describe('veredictoDeEmparejamiento — dónde NO tiene autoridad', () => {
  /**
   * ⚠️ EL FRENO, y es la mitad que más fácil se rompe. 'sin_cobertura' NO es un
   * caso de borde: es el estado NORMAL de casi todo el sistema —la prosa, los
   * cruces tabla-prosa, las tablas sin clave—. Si se tratara como 'no_pareja',
   * el arreglo descartaría hallazgos de territorio que el diff nunca miró, que
   * es un fallo peor que el que viene a curar.
   */
  it('sin pares emitidos, NADIE tiene autoridad: sin_cobertura', async () => {
    const { nueva, existente } = await paresDelCorpus();

    expect(veredictoDeEmparejamiento([], fila(nueva, 'EST-02'), fila(existente, 'EST-03')))
      .toBe('sin_cobertura');
  });

  it('una fila de OTRA tabla que el diff no emparejó: sin_cobertura', async () => {
    const { pares, nueva, existente } = await paresDelCorpus();
    const deOtraTabla: StoredChunk = { ...fila(nueva, 'EST-02'), tableId: 'OtraTabla#0' };

    expect(veredictoDeEmparejamiento(pares, deOtraTabla, fila(existente, 'EST-03')))
      .toBe('sin_cobertura');
  });

  it('un hallazgo de PROSA —sin fila de tabla— no se toca', async () => {
    const { pares, existente } = await paresDelCorpus();

    expect(veredictoDeEmparejamiento(pares, null, fila(existente, 'EST-03'))).toBe('sin_cobertura');
    expect(veredictoDeEmparejamiento(pares, fila(existente, 'EST-03'), null)).toBe('sin_cobertura');
  });

  it('una fila sin tableId tampoco', async () => {
    const { pares, nueva, existente } = await paresDelCorpus();
    const sinTabla: StoredChunk = { ...fila(nueva, 'EST-02'), tableId: null };

    expect(veredictoDeEmparejamiento(pares, sinTabla, fila(existente, 'EST-03'))).toBe('sin_cobertura');
  });
});

describe('veredictoDeEmparejamiento — los dos huecos que destapó la mutación', () => {
  /**
   * Tabla construida, para lo que el corpus no puede dar.
   *
   * ⚠️ `desdeIndice` NO ES DECORATIVO. `chunkIndex` es único dentro de un
   * DOCUMENTO, no dentro de una tabla: dos tablas del mismo fichero tienen
   * índices consecutivos, no repetidos. La primera versión de este fixture les
   * daba 0..4 a las dos, y con eso la mutación «buscar el par ignorando la
   * tabla del lado existente» SOBREVIVÍA — las filas de las dos tablas
   * parecían la misma por índice. El fixture mentía sobre cómo es un documento.
   */
  function tabla(id: string, filas: Array<Record<string, string>>, desdeIndice: number): TableGroup {
    return {
      tableId: `${id}#0`, sheetName: id, columns: ['Código', 'Precio'], totalRows: filas.length,
      rows: filas.map((cells, i): StoredChunk => ({
        chunkIndex: desdeIndice + i, chunkType: 'table_row', text: '', sheetName: id,
        tableId: `${id}#0`, rowIndex: i, cells, columnOrder: null,
      })),
    };
  }
  const tarifas = (id: string, precio: string, desdeIndice: number) =>
    tabla(id, Array.from({ length: 5 }, (_, i) => ({ Código: `T-00${i + 1}`, Precio: precio })), desdeIndice);

  /**
   * LAS FILAS SE COMPARAN POR chunkIndex, NO POR IDENTIDAD DE OBJETO.
   *
   * HUECO ENCONTRADO POR MUTACIÓN: cambiar la comparación a `a === b` no
   * rompía nada, porque en los casos de arriba las filas que se pasan SON los
   * mismos objetos que están dentro del par. En producción no tiene por qué:
   * los chunks de la evidencia del juez y los de los TableGroup recorren
   * caminos distintos desde document_chunks. Aquí se pasa una COPIA.
   */
  it('una COPIA de la fila, con el mismo chunkIndex, sigue siendo la misma fila', async () => {
    const { pares } = await paresDelCorpus();
    const p0 = pares[0].clave.pairs[0];
    const copiaNueva: StoredChunk = { ...p0.nueva };
    const copiaExistente: StoredChunk = { ...p0.existente };

    expect(copiaNueva).not.toBe(p0.nueva);
    expect(veredictoDeEmparejamiento(pares, copiaNueva, copiaExistente)).toBe('pareja');
  });

  /**
   * EL PAR SE BUSCA POR LAS DOS TABLAS, NO POR UNA.
   *
   * HUECO ENCONTRADO POR MUTACIÓN: con un solo par emitido —lo que da el
   * corpus— buscar solo por el lado nuevo acierta igual. Con DOS pares que
   * comparten la tabla nueva (el doble emparejamiento legítimo de F-88 P1), el
   * `find` devolvería el primero y diría 'no_pareja' sobre una pareja
   * verdadera del segundo.
   */
  it('con DOS pares que comparten la tabla nueva, se busca el correcto', () => {
    const nueva = tarifas('Tarifas', '100', 0);
    // Las dos del candidato, con índices CONSECUTIVOS como en un documento real.
    const e1 = tarifas('Hoja2025', '90', 0);
    const e2 = tarifas('Hoja2026', '95', 100);
    const { pares } = emparejarTablas([nueva], [e1, e2]);

    expect(pares).toHaveLength(2);
    const par2 = pares.find(p => p.existente.tableId === 'Hoja2026#0')!;
    const p0 = par2.clave.pairs[0];

    expect(veredictoDeEmparejamiento(pares, p0.nueva, p0.existente)).toBe('pareja');
  });
});
