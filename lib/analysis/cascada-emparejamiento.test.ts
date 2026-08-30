import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { chunkSegments, extractSegments } from '@/lib/chunking';
import { toStoredChunks, type StoredChunk } from '@/lib/read-chunks';
import type { JudgmentEvidence } from './judge';
import { applyCascadeToCandidate } from './pipeline';
import { emparejarTablas, type ParDeTablas } from './table-pairing';
import { groupChunksByTable, type TableGroup } from './table-structure';
import type { DocumentJudgment } from './types';

/**
 * EL CAMINO DEL DESCARTE, EJERCIDO DE VERDAD (F-89 P2, B.124).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * ⚠️ LO QUE ESTE FICHERO DEMUESTRA Y LO QUE NO. LÉELO ANTES DE APOYARTE EN ÉL.
 *
 * DEMUESTRA: que SI un hallazgo con un emparejamiento inválido entra en la
 * cascada, sale descartado, con su contador y sin llegar a confirmarse.
 *
 * NO DEMUESTRA: que el juez lo emita. Aquí el hallazgo está FABRICADO — copiado
 * de lo que el juez produjo en producción el 30/08, pero fabricado. No hay
 * ningún modelo en este fichero.
 *
 * POR QUÉ IMPORTA LA DISTINCIÓN, y no es una cautela de manual: la verificación
 * en pantalla de este mismo arreglo NO FUE CONCLUYENTE. Cuatro pasadas en
 * producción y el juez no volvió a emitir el falso ni una sola vez —B.82: no es
 * estable ni consigo mismo—, así que la guarda no cazó nada porque no tuvo nada
 * que cazar. Este fichero existe para que la demostración no dependa de que el
 * juez repita un fallo que no repite. Ver B.125.
 *
 * Dicho al revés, que es como se leerá dentro de seis meses: esto prueba EL
 * CABLEADO, no LA INCIDENCIA. Que el camino funciona; no con qué frecuencia se
 * recorre.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * SIN LLAMAR A NINGÚN MODELO, y por construcción: `applyCascadeToCandidate`
 * solo alcanza `verifyFindings` —su única llamada al LLM— si algún hallazgo
 * sobrevive hasta `toVerify`. Los casos de aquí están hechos para que su único
 * hallazgo se descarte antes, así que esa llamada no se produce. Si algún día
 * un caso de este fichero intentara alcanzarla, fallaría por falta de clave de
 * API, que es un aviso ruidoso y no un falso verde.
 */

const OPE10 = 'OPE-10_tarifario-tratamientos-2026.xlsx';
const OPE11 = 'OPE-11_tarifario-tratamientos-seguros.xlsx';

async function tablas(file: string): Promise<TableGroup[]> {
  const segments = await extractSegments(readFileSync(`corpus-pruebas/${file}`), file);
  return groupChunksByTable(toStoredChunks(chunkSegments(segments, 'd', file, 'o')));
}

async function corpus(): Promise<{ pares: ParDeTablas[]; nueva: TableGroup; existente: TableGroup }> {
  const tn = await tablas(OPE11);
  const te = await tablas(OPE10);
  const { pares } = emparejarTablas(tn, te);
  return { pares, nueva: pares[0].nueva, existente: pares[0].existente };
}

function fila(t: TableGroup, codigo: string): StoredChunk {
  const f = t.rows.find(r => r.cells?.['Código'] === codigo);
  if (!f) throw new Error(`no existe la fila ${codigo}`);
  return f;
}

/**
 * EL HALLAZGO TAL COMO EL JUEZ LO EMITIÓ EN PRODUCCIÓN, el 30/08.
 *
 * Título, citas y columnas copiados del log: «Profesional asignado para Carilla
 * de composite (EST-03)», con las OCHO columnas compartidas citadas en los dos
 * lados — que es lo que produce `alignQuoteToCells` cuando el juez cita la fila
 * entera.
 */
function juicioConHallazgo(
  nueva: StoredChunk,
  existente: StoredChunk,
  columnas: string[],
): { judgment: DocumentJudgment; evidence: JudgmentEvidence } {
  return {
    judgment: {
      documentId: 'bbb-222',
      documentName: OPE10,
      source: 'manual',
      overlapPercent: 50,
      verdict: 'solapamiento_parcial',
      contradictions: [{
        topic: 'Profesional asignado para Carilla de composite (EST-03)',
        newDocSays: nueva.text,
        existingDocSays: existente.text,
        severity: 'contradiction',
      }],
      overlappingContent: [],
      uniqueToNewDoc: [],
    },
    evidence: {
      contradictions: [{
        hash: 'dc678e1b',
        newChunk: nueva,
        existingChunk: existente,
        newColumns: columnas,
        existingColumns: columnas,
      }],
      overlaps: [],
    },
  };
}

async function correrCascada(
  nueva: StoredChunk,
  existente: StoredChunk,
  columnas: string[],
  pares: ParDeTablas[],
  chunksNuevos: StoredChunk[],
  chunksExistentes: StoredChunk[],
) {
  const { judgment, evidence } = juicioConHallazgo(nueva, existente, columnas);
  return applyCascadeToCandidate(
    judgment, evidence, chunksNuevos, chunksExistentes, OPE11, 'test', [], pares,
  );
}

describe('la cascada descarta el emparejamiento inválido — camino completo', () => {
  /**
   * EL CASO DE B.124, ENTERO. Es el falso positivo que llegó a producción con
   * el sello más fuerte del producto: EST-02 contra EST-03, ocho columnas
   * citadas, todas distintas. Antes del frente 1 salía
   * `confirmado.por_estructura`.
   *
   * SALE POR `cubierto_por_diff` Y NO POR `emparejamiento_invalido`, y el
   * matiz importa: sobre un par EMITIDO la supresión de F-89 P4 llega ANTES que
   * la verificación de identidad — no hace falta demostrar que el
   * emparejamiento es falso para tirarlo, basta con que el diff ya haya
   * comparado esas tablas mejor. La verificación de identidad conserva su
   * territorio en los caídos por la 3ª puerta (punto 3).
   */
  it('EST-02 contra EST-03 sale DESCARTADO, no confirmado', async () => {
    const { pares, nueva, existente } = await corpus();
    const columnas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'EST-02'), fila(existente, 'EST-03'), columnas,
      pares, nueva.rows, existente.rows,
    );

    expect(r.judgment.contradictions).toHaveLength(0);
    expect(r.tally.descartados).toBe(1);
    expect(r.tally.confirmados).toBe(0);
    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBe(1);
  });

  /**
   * Y NO SE CUENTA COMO CONFIRMADO POR ESTRUCTURA, que es la mitad que importa
   * para la promesa del producto: el sello no se pone y se quita, es que no
   * llega a ponerse.
   */
  it('no deja rastro de confirmación por estructura', async () => {
    const { pares, nueva, existente } = await corpus();
    const columnas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'EST-02'), fila(existente, 'EST-03'), columnas,
      pares, nueva.rows, existente.rows,
    );

    expect(r.tally.confirmadosPorEstructura).toBe(0);
    expect(r.judgment.discarded?.['confirmado.por_estructura']).toBeUndefined();
  });

  /**
   * EL DUPLICADO — Y ES EL PUNTO ENTERO DE F-89 P4, no un daño colateral.
   *
   * EST-03 contra EST-03 difiere en Precio base: es una de las quince
   * sembradas y el juez ACIERTA. Aun así SE SUPRIME, porque esa misma
   * discrepancia ya está entre las quince que el diff emitió, con mejor
   * evidencia. Publicarla dos veces es el «diecisiete donde hay quince» medido
   * en producción el 30/08 (15 del diff + 2 del juez, las dos legítimas y las
   * dos ya dentro de las quince).
   *
   * NO SE PIERDE NADA: lo que este hallazgo dice sigue publicado, por la vía
   * del diff. Lo que desaparece es el duplicado.
   */
  it('el hallazgo LEGÍTIMO del juez también se suprime: es el duplicado del 17→15', async () => {
    const { pares, nueva, existente } = await corpus();
    // Solo la columna que de verdad difiere, que es lo que el juez cita cuando
    // acierta — medido en producción el 30/08 en el exhaustivo.
    const r = await correrCascada(
      fila(nueva, 'EST-03'), fila(existente, 'EST-03'), ['Precio base'],
      pares, nueva.rows, existente.rows,
    );

    expect(r.judgment.contradictions).toHaveLength(0);
    expect(r.tally.confirmadosPorEstructura).toBe(0);
    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBe(1);
  });

  /**
   * ⚠️ EL CRUCE TABLA-PROSA NO SE SUPRIME, y sale gratis por cómo está escrita
   * la condición: `veredictoDeEmparejamiento` devuelve 'sin_cobertura' en
   * cuanto un lado no es fila de tabla. F-78 y F-90 le reservan expresamente
   * ese territorio al juez —«el precio de la tabla contra el párrafo que dice
   * otro»— y ahí el diff no tiene nada que decir.
   */
  it('un cruce TABLA-PROSA sobre la misma tabla NO se suprime', async () => {
    const { pares, nueva, existente } = await corpus();
    const { judgment, evidence } = juicioConHallazgo(
      fila(nueva, 'EST-03'), fila(existente, 'EST-03'), ['Precio base'],
    );
    // El lado existente deja de ser una fila de tabla: es prosa.
    evidence.contradictions[0].existingChunk = null;
    evidence.contradictions[0].existingColumns = null;

    const r = await applyCascadeToCandidate(
      judgment, evidence, nueva.rows, existente.rows, OPE11, 'test', [], pares,
    );

    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBeUndefined();
  });

  /**
   * ⚠️ EL FRENO, ejercido en el camino y no solo en la función pura: sin pares
   * del diff, la cascada NO descarta nada. Es el estado normal de la prosa y de
   * las tablas sin clave, y tratarlo como emparejamiento inválido tiraría
   * hallazgos de territorio que el diff nunca miró.
   */
  it('sin pares del diff, el mismo hallazgo NO se descarta', async () => {
    const { pares, nueva, existente } = await corpus();
    const columnas = nueva.columns.filter(c => existente.columns.includes(c));

    const r = await correrCascada(
      fila(nueva, 'EST-02'), fila(existente, 'EST-03'), columnas,
      [], nueva.rows, existente.rows,
    );

    expect(r.judgment.discarded?.['descartado.cubierto_por_diff']).toBeUndefined();
    // Y sigue el camino de siempre: ocho columnas distintas, R2 lo confirma.
    // Es exactamente el fallo de B.124, vivo donde el diff no llega — y así
    // seguirá hasta que entre la degradación universal sin clave (F-90 P2).
    expect(r.tally.confirmadosPorEstructura).toBe(1);
    void pares;
  });
});
