import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import P4 from '../examen/casos/P4_guardias_sin_clave.mjs';
import { marcarPasada, marcarCaso, DEJO_DE_EJERCER, SIN_VEREDICTO } from '../lib/examen/marcador.mjs';

/**
 * EL CRUDO SINTÉTICO DE LA FASE 2 DEL DETECTOR (28/09/2026).
 *
 * `examen/sinteticos/SINTETICO_P4-BELMONTE_por_estructura.json`: P4-BELMONTE
 * emitido por ESTRUCTURA en vez de por juicio. Ningún crudo real recorre esa
 * rama, así que éste es la prueba de la fase 2 (protocolo, «un cambio del
 * marcador se prueba repuntuando antes y después», condición 2).
 *
 * Hasta la fase 2b este test documentaba el defecto: el acierto verdadero
 * contaba como FALSO y P4 salía FALLA. Con la excepción declarada en el caso
 * sale SIN_VEREDICTO, que es lo que predijo B.288 (Estado_Del_MVP.md).
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

describe('FASE 2 (28/09/2026): el otro detector no es un falso — el caso dejó de ejercer su rama', () => {
  it('P4-BELMONTE no es un acierto (el caso exige juicio) y P4-MEDINA sí', () => {
    const m = marcarPasada(P4, pasada(SINTETICO));
    expect(m.aciertos).toEqual(['P4-MEDINA']);
  });
  it('y NO sale como falso por extra: se aparta con el detector que lo encontró', () => {
    const m = marcarPasada(P4, pasada(SINTETICO));
    expect(m.falsos).toEqual([]);
    expect(m.falsosPorExtra).toEqual([]);
    expect(m.otroDetector.map(o => [o.id, o.detector, o.exigido])).toEqual([['P4-BELMONTE', 'estructura', 'juicio']]);
    // Los dos extras son los del crudo real (solapamiento y duplicado de OPE-13), no Belmonte.
    expect(m.extrasDetalle).toEqual(marcarPasada(P4, pasada(REAL)).extrasDetalle);
  });
  it('el caso sale SIN_VEREDICTO con el motivo que declara P4 — antes salía FALLA (B.288)', () => {
    const m = marcarCaso({ ...P4, pasadas: 1 }, [pasada(SINTETICO)]);
    expect(m.estado).toBe(SIN_VEREDICTO);
    expect(m.fallos).toEqual([]);
    expect(m.razones.join()).toContain(`P4-BELMONTE: ${DEJO_DE_EJERCER}`);
    expect(m.razones.join()).toContain(P4.debenSalir.find(e => e.id === 'P4-BELMONTE').detectorExigido.motivo);
  });
  it('control: el crudo REAL de la misma pasada no da ningún falso ni se aparta', () => {
    const m = marcarPasada(P4, pasada(REAL));
    expect(m.falsos).toEqual([]);
    expect(m.otroDetector).toEqual([]);
    expect(m.aciertos).toEqual(['P4-BELMONTE', 'P4-MEDINA']);
  });
});
