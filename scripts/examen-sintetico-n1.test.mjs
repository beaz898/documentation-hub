import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import N1 from '../examen/casos/N1_falsos_conocidos.mjs';
import { marcarPasada, marcarCaso, DEJO_DE_EJERCER, FALLA, PASA } from '../lib/examen/marcador.mjs';

/**
 * EL CRUDO SINTÉTICO DE LA FASE 3 DEL DETECTOR (29/09/2026).
 *
 * `examen/sinteticos/SINTETICO_N1-PUESTO_por_juicio.json`: el diff deja de
 * emparejar la tabla y N1-PUESTO lo encuentra el JUEZ. Ningún crudo real recorre
 * esa rama (B.290: N1-PUESTO por estructura 15/15), así que éste es la prueba de
 * la alarma (protocolo, «un cambio del marcador se prueba repuntuando antes y
 * después», condición 2).
 *
 * Hasta la fase 3b documentaba el hueco: con la excepción de N1, un comparador
 * determinista que dejaba de producir salía SIN_VEREDICTO, un gris. Con la
 * alarma sale FALLA, como predijo B.294.
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

describe('FASE 3 (29/09/2026): la regresión del diff sale en ROJO', () => {
  it('el juez encuentra la verdad: N1-PUESTO es un acierto, y la vigilancia apunta el detector perdido', () => {
    const m = marcarPasada(N1, pasada(SINTETICO));
    expect(m.aciertos).toEqual(['N1-PUESTO']);
    expect(m.vigilancia).toEqual([{ id: 'N1-PUESTO', base: 'estructura', tipo: 'PERDIDO', detector: 'juicio' }]);
    expect(m.falsos).toEqual([]);
  });
  it('el caso sale FALLA con la alarma — antes de la fase 3 salía SIN_VEREDICTO (B.294)', () => {
    const m = marcarCaso({ ...N1, pasadas: 1 }, [pasada(SINTETICO)]);
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('ALARMA DE DETECTOR: N1-PUESTO tiene base estructura');
    expect(m.fallos.join()).toContain('se perdió un detector determinista');
    expect(m.razones.join()).not.toContain(DEJO_DE_EJERCER);
  });
  it('control: el crudo REAL de la misma pasada da PASA, por estructura, con el contador en 0', () => {
    const m = marcarCaso({ ...N1, pasadas: 1 }, [pasada(REAL)]);
    expect(m.estado).toBe(PASA);
    expect(m.marcas[0].detectores['N1-PUESTO']).toBe('estructura');
    expect(m.aciertosSinDetectorEnElOrigen).toBe(0);
  });
});
