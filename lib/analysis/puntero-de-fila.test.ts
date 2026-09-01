import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import { verifyQuote } from './judge';
import { despegarPunteroDeFila } from './table-structure';

/**
 * EL PUNTERO DE FILA, Y LAS CUATRO CITAS QUE MATÓ (F-94 P6).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * LAS CITAS DE ESTE FICHERO SON REALES. Están copiadas del log de producción
 * del 01/09, de la tanda de la siembra, donde CUATRO SOLAPAMIENTOS DE CUATRO
 * murieron con «cita no verificable, lado=ambos» — y las dos citas eran
 * idénticas entre sí, que es la firma de que el problema no era el modelo.
 *
 * El juez había copiado la fila EXACTAMENTE como se la enseñamos, con el
 * `[F0]` que le pone `renderTableRow`. Máximamente fiel, y lo rechazábamos.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ⚠️ DÓNDE FALLABA, porque F-94 lo situó en otro sitio y conviene no repetir el
 * error al leer: NO era el alineador. Era `verifyQuote`, y antes de llegar a
 * alinear — en su fase de LOCALIZAR la fila, ningún `table_row` casaba el
 * primer segmento «[F0] Dra. Marta Gil», así que no se elegía fila y la cita
 * moría sin que el alineador opinara. El log lo decía: «cita no verificable»,
 * no «columna indeterminada».
 *
 * Nada de esto toca el render que lee el juez, así que no hace falta tanda:
 * `verifyQuote` es determinista y estos casos son datos del corpus.
 */

const GUARDIAS = 'RRHH-08_asignacion-de-guardias.xlsx';

async function chunks(file: string): Promise<StoredChunk[]> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  return toStoredChunks(chunkSegments(segments, 'doc-guardias', file, 'org'));
}

/** Las tres citas distintas del log del 01/09 (la primera salió en las dos
 *  direcciones, de ahí los cuatro solapamientos). */
const CITAS_DEL_LOG = [
  '[F0] Dra. Marta Gil | Chamberí | Cirugía | Mañana | 35',
  '[F2] Laura Núñez | Chamberí | Higiene | Mañana | 25',
  '[F4] Dr. Javier Soto | Chamberí | Ortodoncia | Tarde | 38',
];

describe('el puntero de fila — las citas que el juez copió bien', () => {
  it('las tres citas del log se verifican, y con sus cinco columnas', async () => {
    const cs = await chunks(GUARDIAS);

    for (const cita of CITAS_DEL_LOG) {
      const v = verifyQuote(cs, null, cita);

      expect(v, `no verificó: ${cita}`).not.toBeNull();
      if (!v) continue;
      // Las cinco columnas de la fila, que es lo que R2 necesita después.
      expect(v.columns, `sin columnas: ${cita}`).toHaveLength(5);
      // Y el texto sale SIN el puntero: aguas abajo no viaja.
      expect(v.text.startsWith('[F')).toBe(false);
    }
  });

  /**
   * EL PUNTERO LOCALIZA LA FILA CORRECTA, que es lo que F-94 quería: «localizar
   * por índice es más fiable que buscar por valores».
   */
  it('la fila localizada es la del índice del puntero', async () => {
    const cs = await chunks(GUARDIAS);

    expect(verifyQuote(cs, null, CITAS_DEL_LOG[0])?.chunk?.rowIndex).toBe(0);
    expect(verifyQuote(cs, null, CITAS_DEL_LOG[1])?.chunk?.rowIndex).toBe(2);
    expect(verifyQuote(cs, null, CITAS_DEL_LOG[2])?.chunk?.rowIndex).toBe(4);
  });

  /**
   * ⚠️ EL CASO DE GUARDIA, que no estaba en la especificación de F-94 y hace
   * falta: EL PUNTERO ES OPCIONAL.
   *
   * Una cita sin él tiene que seguir comportándose como hasta hoy. Si el parseo
   * llegara a exigirlo, se llevaría por delante toda la prosa y toda cita de
   * una sola celda — o sea casi todo lo que el juez emite cuando acierta.
   */
  it('una cita SIN puntero se verifica igual que antes', async () => {
    const cs = await chunks(GUARDIAS);
    const sinPuntero = 'Dra. Marta Gil | Chamberí | Cirugía | Mañana | 35';

    const v = verifyQuote(cs, null, sinPuntero);

    expect(v).not.toBeNull();
    expect(v?.columns).toHaveLength(5);
    expect(v?.text).toBe(sinPuntero);
  });

  /**
   * Y LA MISMA FILA POR LAS DOS VÍAS DA LO MISMO. Es la propiedad que hace que
   * el puntero sea una ayuda y no una segunda verdad: con él o sin él, la fila
   * localizada y las columnas son las mismas.
   */
  it('con puntero y sin puntero se localiza la MISMA fila', async () => {
    const cs = await chunks(GUARDIAS);

    const con = verifyQuote(cs, null, CITAS_DEL_LOG[1]);
    const sin = verifyQuote(cs, null, 'Laura Núñez | Chamberí | Higiene | Mañana | 25');

    expect(con?.chunk?.chunkIndex).toBe(sin?.chunk?.chunkIndex);
    expect(con?.columns).toEqual(sin?.columns);
    expect(con?.text).toBe(sin?.text);
  });

  /**
   * ⚠️ EL CASO QUE HACE QUE LA MITAD DE LOCALIZAR SIRVA PARA ALGO — y sin él
   * sería adorno.
   *
   * LA MUTACIÓN LO DEMOSTRÓ: quitar «el puntero estrecha» y dejar solo la
   * búsqueda por valores NO ROMPE NINGÚN CASO DEL CORPUS, porque en el corpus
   * no hay dos filas iguales dentro de la misma tabla y los valores bastan
   * siempre para localizar.
   *
   * DOS FILAS IDÉNTICAS EN LA MISMA TABLA es donde los valores empatan y solo
   * el índice desempata. Tabla construida, que es legítimo para código
   * determinista (F-83 P3): el corpus no lo tiene y el mecanismo hay que
   * ejercerlo igual. Y no es de laboratorio — un cuadro con la misma línea
   * repetida en dos turnos es exactamente esto.
   */
  it('dos filas IDÉNTICAS: el puntero desempata donde los valores no pueden', () => {
    const fila = (chunkIndex: number, rowIndex: number): StoredChunk => ({
      chunkIndex,
      chunkType: 'table_row',
      // El texto ALMACENADO, que es el que ve `verifyQuote`: lleva las
      // etiquetas de columna, no el formato que se le enseña al juez.
      text: '[Hoja "T"] Nombre: Ana | Clínica: Chamberí',
      sheetName: 'T',
      tableId: 'T#0',
      rowIndex,
      cells: { Nombre: 'Ana', 'Clínica': 'Chamberí' },
      columnOrder: null,
    });
    const resumen: StoredChunk = {
      chunkIndex: 0,
      chunkType: 'table_summary',
      text: '[TABLA "T" — 2 filas. Columnas: Nombre, Clínica]',
      sheetName: 'T',
      tableId: 'T#0',
      rowIndex: null,
      cells: null,
      columnOrder: ['Nombre', 'Clínica'],
    };
    const cs = [resumen, fila(1, 0), fila(2, 1)];

    // Con puntero, cada cita va a SU fila aunque los valores sean
    // indistinguibles. Sin él, las dos irían a la primera que casa.
    expect(verifyQuote(cs, null, '[F0] Ana | Chamberí')?.chunk?.rowIndex).toBe(0);
    expect(verifyQuote(cs, null, '[F1] Ana | Chamberí')?.chunk?.rowIndex).toBe(1);
  });
});

describe('despegarPunteroDeFila — la función pura', () => {
  it('despega el índice y deja los valores', () => {
    expect(despegarPunteroDeFila('[F3] a | b')).toEqual({ rowIndex: 3, texto: 'a | b' });
    expect(despegarPunteroDeFila('[F12]a | b')).toEqual({ rowIndex: 12, texto: 'a | b' });
  });

  /**
   * COMPORTAMIENTO EN AUSENCIA, declarado (la cuarta pieza, F-93): sin puntero
   * el texto sale INTACTO y el índice es `null` — que es distinto de cero. Un
   * `[F0]` existe y es la primera fila; `null` es «no había puntero».
   */
  it('sin puntero: índice nulo y texto intacto', () => {
    expect(despegarPunteroDeFila('a | b')).toEqual({ rowIndex: null, texto: 'a | b' });
    expect(despegarPunteroDeFila('')).toEqual({ rowIndex: null, texto: '' });
    // `[F0]` NO es lo mismo que ausencia: cero es una fila.
    expect(despegarPunteroDeFila('[F0] a').rowIndex).toBe(0);
  });

  /**
   * NO SE DESPEGA LO QUE NO ES UN PUNTERO. La expresión está anclada al
   * principio y exige dígitos: un corchete en mitad de la cita, o
   * `[Fragmento 2]` —que es otra etiqueta del prompt— no se tocan.
   */
  it('no confunde otras etiquetas con el puntero', () => {
    expect(despegarPunteroDeFila('[Fragmento 2] a | b').rowIndex).toBeNull();
    expect(despegarPunteroDeFila('a | [F3] b').rowIndex).toBeNull();
    expect(despegarPunteroDeFila('[F] a').rowIndex).toBeNull();
    expect(despegarPunteroDeFila('[Fx] a').rowIndex).toBeNull();
  });
});
