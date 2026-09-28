import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import P4 from '../examen/casos/P4_guardias_sin_clave.mjs';
import { marcarPasada, marcarCaso, FALLA, FALSO_POR_EXTRA } from '../lib/examen/marcador.mjs';

/**
 * EL CRUDO SINTÉTICO DE LA FASE 2 DEL DETECTOR (28/09/2026).
 *
 * `examen/sinteticos/SINTETICO_P4-BELMONTE_por_estructura.json`: P4-BELMONTE
 * emitido por ESTRUCTURA en vez de por juicio. Ningún crudo real recorre esa
 * rama, así que éste es la prueba de la fase 2 (protocolo, «un cambio del
 * marcador se prueba repuntuando antes y después», condición 2).
 *
 * ⚠️ ROJO EN EL SENTIDO BUENO, como N7: documenta el defecto que la fase 2 va a
 * arreglar. Con el marcador de HOY un acierto verdadero cuenta como FALSO. El
 * día que la fase 2 entre, este test tiene que cambiar a SIN_VEREDICTO —y el
 * cambio se escribe antes, como predicción (Estado_Del_MVP.md B.288)—.
 */

const leer = ruta => JSON.parse(readFileSync(ruta, 'utf8'));
const SINTETICO = leer('examen/sinteticos/SINTETICO_P4-BELMONTE_por_estructura.json');
const REAL = leer('examen/resultados/2026-09-27_c39397e7/P4_pasada1.json');
const DIFF_REAL = leer('examen/resultados/2026-09-27_c39397e7/N1_pasada1.json').cuerpo.analisis.discrepancies[0];

const pasada = crudo => {
  const a = crudo.cuerpo.analisis;
  return {
    pasada: crudo.pasada, hallazgos: a.discrepancies, tablas: a.tableDiffs, contadores: a.pipelineCounters,
    solapamientos: a.overlaps,
    duplicado: { isDuplicate: a.isDuplicate, duplicateOf: a.duplicateOf, duplicateConfidence: a.duplicateConfidence },
  };
};

describe('la forma: la de un crudo real, campo por campo', () => {
  it('las mismas claves que P4_pasada1 de c39397e7, más la cabecera SINTETICO', () => {
    const { SINTETICO: doc, ...resto } = SINTETICO;
    expect(doc.queEs).toContain('NO salió de ninguna pasada');
    expect(Object.keys(resto)).toEqual(Object.keys(REAL));
    expect(Object.keys(resto.cuerpo)).toEqual(Object.keys(REAL.cuerpo));
    expect(Object.keys(resto.cuerpo.analisis)).toEqual(Object.keys(REAL.cuerpo.analisis));
  });
  it('el hallazgo de Belmonte tiene los campos exactos de uno emitido por el diff (N1_pasada1 de c39397e7)', () => {
    expect(Object.keys(SINTETICO.cuerpo.analisis.discrepancies[0])).toEqual(Object.keys(DIFF_REAL));
    expect(SINTETICO.cuerpo.analisis.discrepancies[0].confirmedBy).toBe('estructura');
  });
  it('fuera de lo declarado, es el crudo real: Medina igual, y todo lo demás del análisis igual', () => {
    expect(SINTETICO.cuerpo.analisis.discrepancies[1]).toEqual(REAL.cuerpo.analisis.discrepancies[1]);
    const { discrepancies: _d1, pipelineCounters: _c1, ...sin } = SINTETICO.cuerpo.analisis;
    const { discrepancies: _d2, pipelineCounters: _c2, ...real } = REAL.cuerpo.analisis;
    expect(sin).toEqual(real);
  });
});

describe('HOY, con el marcador actual: el acierto verdadero cuenta como FALSO', () => {
  it('P4-BELMONTE no se reconoce (se exige juicio) y P4-MEDINA sí', () => {
    const m = marcarPasada(P4, pasada(SINTETICO));
    expect(m.aciertos).toEqual(['P4-MEDINA']);
  });
  it('y con la auditoría completa de P4, sale como FALSO por extra, con su título', () => {
    const m = marcarPasada(P4, pasada(SINTETICO));
    expect(m.falsos).toEqual([FALSO_POR_EXTRA]);
    expect(m.falsosPorExtra).toEqual([SINTETICO.cuerpo.analisis.discrepancies[0].topic]);
  });
  it('el caso sale FALLA por un acierto verdadero — el defecto que arregla la fase 2', () => {
    const m = marcarCaso({ ...P4, pasadas: 1 }, [pasada(SINTETICO)]);
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('1 falsos en una pasada y el techo es 0');
  });
  it('control: el crudo REAL de la misma pasada no da ningún falso', () => {
    const m = marcarPasada(P4, pasada(REAL));
    expect(m.falsos).toEqual([]);
    expect(m.aciertos).toEqual(['P4-BELMONTE', 'P4-MEDINA']);
  });
});
