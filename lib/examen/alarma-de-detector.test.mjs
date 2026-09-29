import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { marcarCaso, marcarPasada, FALLA, PASA } from './marcador.mjs';
import { lineasDelVeredicto, pasadasParaElMarcador } from './veredicto.mjs';

/**
 * LA ALARMA DEL DETECTOR, FASE 3 (29/09/2026, B.290 y B.294).
 *
 * La prueba principal es el crudo sintético de N1 (`scripts/examen-sintetico-n1.test.mjs`).
 * Aquí, las ramas que ningún crudo recorre, con FIXTURE:
 *   · el ORDEN —la misma fila por los dos detectores, la del juez delante—: el
 *     producto suprime el hallazgo del juez cubierto por el diff
 *     (`lib/analysis/pipeline.ts:361-413`), así que no hay crudo real que lo traiga;
 *   · y dos ramas LATENTES, sin población tras la fase 3: «base juicio, llega por
 *     estructura» (la única base juicio era la de P4, retirada) y «detector null
 *     con base» (las 101 contradicciones de los crudos traen `confirmedBy`).
 */

const fila = (por, nuevo = 'Implantólogo') => ({
  severity: 'contradiction', topic: 'Puesto', confirmedBy: por,
  newDocSays: `Dr. Pablo Reyes | ${nuevo} | Chamberí`, existingDocSays: 'Dr. Pablo Reyes | Implantólogo / Cirujano oral | Box 1',
});
const esperado = (base, extra = {}) => ({
  id: 'R', persona: 'Dr. Pablo Reyes', enElAnalizado: 'Implantólogo', enElCorpus: 'Implantólogo / Cirujano oral',
  ...(base ? { detectorDeBase: base } : {}), ...extra,
});
const caso = (esperados, pasadas = 1) => ({ id: 'A', pasadas, debenSalir: esperados, noDebenSalir: [], umbralDeAlarma: { minimoDeAciertos: 0 } });
const tanda = (...porPasada) => porPasada.map((hallazgos, i) => ({ pasada: i + 1, hallazgos }));

describe('base estructura: el determinista se pierde → FALLA', () => {
  it('lo encuentra sólo el juez: FALLA con la alarma', () => {
    const m = marcarCaso(caso([esperado('estructura')]), tanda([fila('juicio')]));
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('ALARMA DE DETECTOR: R tiene base estructura y en 1/1 pasada(s) lo encontró juicio');
  });
  it('UNA pasada basta: 1 de 5 perdida ya es FALLA, no hay ruido que promediar', () => {
    const bien = [fila('estructura')];
    const m = marcarCaso(caso([esperado('estructura')], 5), tanda(bien, bien, [fila('juicio')], bien, bien));
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('en 1/5 pasada(s)');
  });
  it('EL ORDEN no decide: la misma fila por los dos, la del juez DELANTE → PASA (fixture: el producto no la emite)', () => {
    const m = marcarCaso(caso([esperado('estructura')]), tanda([fila('juicio'), fila('estructura')]));
    expect(m.marcas[0].detectores.R).toBe('juicio');   // el marcador eligió la primera…
    expect(m.estado).toBe(PASA);                          // …y la alarma pregunta si la estructura emitió algo emparejable
  });
  it('si no sale nada, no hay alarma: lo que no salió lo juzga la cobertura', () => {
    expect(marcarPasada(caso([esperado('estructura')]), { pasada: 1, hallazgos: [] }).vigilancia).toEqual([]);
  });
});

describe('LATENTE — base juicio, llega por estructura → aviso destacado, NO rojo', () => {
  it('sale PASA, y el aviso se imprime destacado', () => {
    const c = caso([esperado('juicio')]);
    const m = marcarCaso(c, tanda([fila('estructura')]));
    expect(m.estado).toBe(PASA);
    expect(m.fallos).toEqual([]);
    expect(m.avisosDeDetector.join()).toContain('AVISO DE DETECTOR: R tiene base juicio y en 1/1 pasada(s) lo emitió estructura');
    const res = [{ casoId: 'A', pasada: 1, cuerpo: { analisis: { discrepancies: [fila('estructura')] } } }];
    expect(lineasDelVeredicto([c], res).join('\n')).toContain('    ⚠️ AVISO DE DETECTOR: R');
  });
});

describe('LATENTE — detector null con base → sin alarma, y al contador', () => {
  it('no da rojo ni aviso, y cuenta 1', () => {
    const m = marcarCaso(caso([esperado('estructura')]), tanda([fila(undefined)]));
    expect(m.estado).toBe(PASA);
    expect(m.avisosDeDetector).toEqual([]);
    expect(m.aciertosSinDetectorEnElOrigen).toBe(1);
  });
});

describe('el contador cuenta SÓLO sobre esperados con base', () => {
  it('en un caso con base, un acierto sin detector de un esperado SIN base no cuenta', () => {
    const sinBase = esperado(null, { id: 'S', persona: 'Laura Núñez', enElAnalizado: 'Higienista', enElCorpus: 'Auxiliar' });
    const suyo = { severity: 'contradiction', topic: 'x', newDocSays: 'Laura Núñez | Higienista', existingDocSays: 'Laura Núñez | Auxiliar' };
    const m = marcarCaso(caso([esperado('estructura'), sinBase]), tanda([fila('estructura'), suyo]));
    expect(m.marcas[0].aciertos).toEqual(['R', 'S']);
    expect(m.marcas[0].detectores.S).toBe(null);
    expect(m.aciertosSinDetectorEnElOrigen).toBe(0);
  });
  it('N3 sobre sus crudos reales: «desconocido» 15/15 en la línea del detector, y sin contador (no tiene base)', async () => {
    const N3 = { fichero: 'N3', ...(await import('../../examen/casos/N3_pelo_y_calzado.mjs')).default };
    for (const t of ['2026-09-27_c39397e7', '2026-09-27_97223b72']) {
      const d = `examen/resultados/${t}`;
      const res = readdirSync(d).filter(x => /^N3_pasada\d+\.json$/.test(x)).map(x => JSON.parse(readFileSync(`${d}/${x}`, 'utf8')));
      const m = marcarCaso(N3, pasadasParaElMarcador([N3], res).N3);
      expect(m.aciertosSinDetectorEnElOrigen).toBeUndefined();
      const l = lineasDelVeredicto([N3], res).join('\n');
      expect(l).toContain(`N3-DUPLICADO desconocido ${res.length}/${res.length}`);
      expect(l).not.toContain('aciertos sin detector en el origen');
    }
  });
  it('y en un caso con base sale también en 0: un cero se dice', async () => {
    const N1 = { fichero: 'N1', ...(await import('../../examen/casos/N1_falsos_conocidos.mjs')).default };
    const d = 'examen/resultados/2026-09-27_97223b72';
    const res = readdirSync(d).filter(x => /^N1_pasada\d+\.json$/.test(x)).map(x => JSON.parse(readFileSync(`${d}/${x}`, 'utf8')));
    expect(lineasDelVeredicto([N1], res)).toContain('    · aciertos sin detector en el origen: 0 (esperados con base: ahí la alarma falla abierto)');
  });
});

describe('P3: la base vigila también las discrepantes del estructural', () => {
  it('una discrepante que la estructura no emite y el juez sí: FALLA con la alarma (fixture sobre el crudo real)', async () => {
    const P3 = { fichero: 'P3', ...(await import('../../examen/casos/P3_tarifarios_tablas.mjs')).default };
    const c = JSON.parse(readFileSync('examen/resultados/2026-09-27_c39397e7/P3_pasada1.json', 'utf8'));
    const a = c.cuerpo.analisis;
    const p = { pasada: 1, hallazgos: a.discrepancies.map((h, i) => (i === 0 ? { ...h, confirmedBy: 'juicio' } : h)),
      tablas: a.tableDiffs, contadores: a.pipelineCounters, solapamientos: a.overlaps, duplicado: {} };
    const m = marcarCaso({ ...P3, pasadas: 1 }, [p]);
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('ALARMA DE DETECTOR');
    expect(marcarCaso({ ...P3, pasadas: 1 }, [{ ...p, hallazgos: a.discrepancies }]).estado).toBe(PASA);
  });
});

describe('`:276` sólo en P4 — escrito el 29/09, cuando pudo fallar y no cuando se pensó (B.290)', () => {
  it('de los casos reales, sólo P4 declara una excepción', async () => {
    const con = [];
    for (const f of readdirSync('examen/casos').filter(x => x.endsWith('.mjs'))) {
      const c = (await import(`../../examen/casos/${f.replace(/\.mjs$/, '')}.mjs`)).default;
      const esperados = [...(c.debenSalir ?? []), ...(c.esperadoEstructural ? [c.esperadoEstructural] : [])];
      if (esperados.some(e => e.detectorExigido)) con.push(c.id);
    }
    expect(con).toEqual(['P4']);
  });
});
