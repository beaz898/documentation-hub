import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import N1 from '../examen/casos/N1_falsos_conocidos.mjs';
import { marcarPasada, marcarCaso, DEJO_DE_EJERCER, FALLA, PASA, SIN_VEREDICTO } from '../lib/examen/marcador.mjs';

/**
 * EL CRUDO SINTÉTICO DE LA FASE 3 DEL DETECTOR (29/09/2026).
 *
 * `examen/sinteticos/SINTETICO_N1-PUESTO_por_juicio.json`: el diff deja de
 * emparejar la tabla y N1-PUESTO lo encuentra el JUEZ. Ningún crudo real recorre
 * esa rama (B.290: N1-PUESTO por estructura 15/15), así que éste es la prueba de
 * la alarma (protocolo, «un cambio del marcador se prueba repuntuando antes y
 * después», condición 2).
 *
 * ⚠️ ROJO EN EL SENTIDO BUENO: documenta el hueco que la fase 3 cierra. Con el
 * marcador de HOY, la excepción de N1 da SIN_VEREDICTO, y un comparador
 * determinista que deja de producir no puede dar un gris. Cuando entre la fase 3
 * este test cambia a FALLA, y el cambio se escribe antes como predicción (B.294).
 */

const leer = ruta => JSON.parse(readFileSync(ruta, 'utf8'));
const SINTETICO = leer('examen/sinteticos/SINTETICO_N1-PUESTO_por_juicio.json');
const REAL = leer('examen/resultados/2026-09-27_c39397e7/N1_pasada1.json');
const SIN_CLAVE_REAL = leer('examen/resultados/2026-09-27_c39397e7/P4_pasada1.json');

const pasada = crudo => {
  const a = crudo.cuerpo.analisis;
  return {
    pasada: crudo.pasada, hallazgos: a.discrepancies, tablas: a.tableDiffs, contadores: a.pipelineCounters,
    solapamientos: a.overlaps,
    duplicado: { isDuplicate: a.isDuplicate, duplicateOf: a.duplicateOf, duplicateConfidence: a.duplicateConfidence },
  };
};

describe('la forma: la de crudos reales, campo por campo', () => {
  it('las mismas claves que N1_pasada1 de c39397e7, más la cabecera SINTETICO', () => {
    const { SINTETICO: doc, ...resto } = SINTETICO;
    expect(doc.queEs).toContain('NO salió de ninguna pasada');
    expect(Object.keys(resto)).toEqual(Object.keys(REAL));
    expect(Object.keys(resto.cuerpo)).toEqual(Object.keys(REAL.cuerpo));
  });
  it('sin clave, el análisis tiene las claves que tiene un crudo real sin clave (P4_pasada1): sin tableDiffs', () => {
    expect(Object.keys(SINTETICO.cuerpo.analisis)).toEqual(Object.keys(SIN_CLAVE_REAL.cuerpo.analisis));
    expect(Object.keys(SINTETICO.cuerpo.analisis.pipelineCounters)).toEqual(Object.keys(SIN_CLAVE_REAL.cuerpo.analisis.pipelineCounters));
  });
  it('el hallazgo tiene los campos exactos de uno del JUEZ (P4_pasada1): sin comparedValues ni newDocRow', () => {
    const h = SINTETICO.cuerpo.analisis.discrepancies[0];
    expect(Object.keys(h)).toEqual(Object.keys(SIN_CLAVE_REAL.cuerpo.analisis.discrepancies[0]));
    expect(h.confirmedBy).toBe('juicio');
    expect(h.newDocSays).toBe(REAL.cuerpo.analisis.discrepancies[0].newDocSays);
    expect(h.existingDocSays).toBe(REAL.cuerpo.analisis.discrepancies[0].existingDocSays);
  });
  it('los contadores dicen que la estructura no emitió la fila', () => {
    const c = SINTETICO.cuerpo.analisis.pipelineCounters;
    expect([c['diff.tablas.sin_clave'], c['diff.tablas.emitidos'], c['verificador.confirmados_por_juicio']]).toEqual([1, 0, 1]);
  });
});

describe('HOY, con el marcador actual: la regresión del diff sale en GRIS, no en rojo', () => {
  it('el juez sí encuentra la verdad: la fila de Reyes empareja con N1-PUESTO, apartada al otro detector', () => {
    const m = marcarPasada(N1, pasada(SINTETICO));
    expect(m.aciertos).toEqual([]);
    expect(m.otroDetector.map(o => [o.id, o.detector, o.exigido])).toEqual([['N1-PUESTO', 'juicio', 'estructura']]);
    expect(m.falsos).toEqual([]);
  });
  it('el caso sale SIN_VEREDICTO y NO FALLA — el hueco que cierra la fase 3', () => {
    const m = marcarCaso({ ...N1, pasadas: 1 }, [pasada(SINTETICO)]);
    expect(m.estado).toBe(SIN_VEREDICTO);
    expect(m.estado).not.toBe(FALLA);
    expect(m.razones.join()).toContain(`N1-PUESTO: ${DEJO_DE_EJERCER}`);
  });
  it('control: el crudo REAL de la misma pasada da PASA, por estructura', () => {
    const m = marcarCaso({ ...N1, pasadas: 1 }, [pasada(REAL)]);
    expect(m.estado).toBe(PASA);
    expect(m.marcas[0].detectores['N1-PUESTO']).toBe('estructura');
  });
});
