import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { marcarCaso, FALLA, PASA, SIN_VEREDICTO } from './marcador.mjs';
import { lineasDelVeredicto, pasadasParaElMarcador } from './veredicto.mjs';
import { umbralesQueNoPuedenFallar } from './umbrales-que-pueden-fallar.mjs';

/**
 * LA PUERTA DEL MARCADOR CON TRES CLASES (29/09/2026, B.291 y B.293).
 *
 * La prueba principal es sobre datos REALES: P2 de `c39397e7` con sus pasadas 1
 * a 4. `:251` (control de tanda) y `:265` (regla no mecánica) no tienen ningún
 * crudo que las recorra: van con FIXTURE, y se declara aquí.
 */

const leer = f => JSON.parse(readFileSync(f, 'utf8'));
const TANDA = 'examen/resultados/2026-09-27_c39397e7';
const crudos = re => readdirSync(TANDA).filter(x => re.test(x)).map(x => leer(`${TANDA}/${x}`));
const cargar = async f => ({ fichero: f, ...(await import(`../../examen/casos/${f.replace(/\.mjs$/, '')}.mjs`)).default });

describe('clase CERO sobre un crudo REAL: P2, pasadas 1 a 4 de c39397e7', () => {
  it('el falso real sale (FALLA) y la ausencia sigue callada', async () => {
    const P2 = await cargar('P2_residuos_prosa.mjs');
    const res = crudos(/^P2_pasada[1-4]\.json$/);
    const m = marcarCaso(P2, pasadasParaElMarcador([P2], res).P2);
    expect(m.estado).toBe(FALLA);
    expect(m.fallos).toEqual(['1 falsos en una pasada y el techo es 0']);
    expect(m.razones.join()).toContain('4 de 5 pasadas');
    const l = lineasDelVeredicto([P2], res).join('\n');
    expect(l).toContain('las ausencias no se juzgan');
    expect(l).not.toContain('estable(s)-acierto');
  });
});

describe('clase CERO: la frecuencia se mide sobre las pasadas DECLARADAS', () => {
  // «1 de 2» no puede fallar contra «1 de cada 5» sólo porque la tanda se quedó
  // corta: en las 3 que faltan podía no volver a salir.
  const cita = d => ({ literal: d, discriminante: d });
  const caso = { id: 'F', pasadas: 5, debenSalir: [], umbralDeAlarma: {},
    noDebenSalir: [{ id: 'F-1', patronDeF22: 'p', cuentaComoFallo: true, citaEnElAnalizado: cita('a-f'), citaEnElCorpus: cita('b-f'),
      frecuenciaMaxima: { apariciones: 1, deCada: 5 } }] };
  const falso = { severity: 'contradiction', topic: 'f', newDocSays: 'a-f', existingDocSays: 'b-f' };
  it('1 de 2 hechas contra 1 de cada 5: no es un exceso medido', () => {
    const m = marcarCaso(caso, [{ pasada: 1, hallazgos: [falso] }, { pasada: 2, hallazgos: [] }]);
    expect(m.fallos).toEqual([]);
    expect(m.estado).toBe(SIN_VEREDICTO);
  });
  it('2 de 2 hechas ya excede sobre las 5 declaradas: sale', () => {
    const m = marcarCaso(caso, [{ pasada: 1, hallazgos: [falso] }, { pasada: 2, hallazgos: [falso] }]);
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('2/2 pasadas hechas (de 5 declaradas)');
  });
});

describe('FIXTURE — `:251` control de tanda (CERO) y `:265` regla no mecánica (PARTE): sin crudo que las recorra', () => {
  const cita = d => ({ literal: d, discriminante: d });
  const falsoDecl = { id: 'X-F', patronDeF22: 'p', cuentaComoFallo: true, citaEnElAnalizado: cita('a-x'), citaEnElCorpus: cita('b-x') };
  const falso = { severity: 'contradiction', topic: 'x', newDocSays: 'a-x', existingDocSays: 'b-x' };
  const base = extra => ({ id: 'X', pasadas: 1, debenSalir: [], noDebenSalir: [falsoDecl], umbralDeAlarma: { maximoDeFalsosConfirmados: 0 }, ...extra });

  it('control no cumplido: un falso medido sale; sin él, SIN_VEREDICTO', () => {
    const c = base({ elSilencioCuentaSiSoloSi: { caso: 'OTRO', hallazgo: 'OTRO-1' } });
    expect(marcarCaso(c, [{ pasada: 1, hallazgos: [falso] }]).estado).toBe(FALLA);
    expect(marcarCaso(c, [{ pasada: 1, hallazgos: [] }]).estado).toBe(SIN_VEREDICTO);
  });
  it('regla no mecánica: se juzga el resto (FALLA con el falso), y sin fallo NO puede dar PASA', () => {
    const c = base({ noDebenSalir: [falsoDecl, { id: 'X-R', regla: 'NINGUN_HALLAZGO_SOBRE_LAS_OTRAS_DOCE' }] });
    expect(marcarCaso(c, [{ pasada: 1, hallazgos: [falso] }]).estado).toBe(FALLA);
    const m = marcarCaso(c, [{ pasada: 1, hallazgos: [] }]);
    expect(m.estado).toBe(SIN_VEREDICTO);
    expect(m.razones.join()).toContain('X-R');
  });
});

describe('`:276` en P4 es TODO: el control de que la puerta no se abre de más', () => {
  it('el sintético de P4 más un falso inventado sigue SIN_VEREDICTO, sin fallos', async () => {
    const P4 = await cargar('P4_guardias_sin_clave.mjs');
    const a = leer('examen/sinteticos/SINTETICO_P4-BELMONTE_por_estructura.json').cuerpo.analisis;
    const inventada = { severity: 'contradiction', confirmedBy: 'juicio', topic: 'Inventada', newDocSays: 'X | 1', existingDocSays: 'X | 2' };
    const m = marcarCaso({ ...P4, pasadas: 1 }, [{ pasada: 1, hallazgos: [a.discrepancies[0], inventada], tablas: a.tableDiffs,
      contadores: a.pipelineCounters, solapamientos: a.overlaps, duplicado: {} }]);
    expect(m.estado).toBe(SIN_VEREDICTO);
    expect(m.fallos).toEqual([]);
  });
});

describe('N3, N4 y N5 sobre sus crudos reales: la predicción de B.293', () => {
  it('N3 PASA diciendo qué mitad juzga, e imprime lo observado por pasada; N4 y N5 siguen SIN_VEREDICTO', async () => {
    const casos = await Promise.all(['N3_pelo_y_calzado.mjs', 'N4_esterilizacion_pendiente.mjs', 'N5_alarma.mjs'].map(cargar));
    const res = crudos(/^N[345]_pasada\d+\.json$/);
    const l = lineasDelVeredicto(casos, res);
    expect(l).toContain('N3: PASA — juzga sólo la cobertura; la precisión está en SEGUIMIENTO · 1 estable(s)-acierto · 0 falsos (máx. por pasada)');
    expect(l).toContain('N4: SIN_VEREDICTO');
    expect(l).toContain('N5: SIN_VEREDICTO');
    expect(l.filter(x => x.includes('· observado: 0/0/0/0/0 falsos por pasada'))).toHaveLength(3);
  });
  it('N4 y N5 no pueden salir PASA con cero aciertos: sólo con la precisión en seguimiento, el validador lo caza', async () => {
    for (const f of ['N4_esterilizacion_pendiente.mjs', 'N5_alarma.mjs']) {
      const c = await cargar(f);
      const soloPrecision = { ...c, umbralDeAlarma: { ...c.umbralDeAlarma, seguimiento: { precision: c.umbralDeAlarma.seguimiento.precision } } };
      expect(umbralesQueNoPuedenFallar(soloPrecision).join()).toContain('NINGÚN umbral de este caso puede fallar');
      expect(marcarCaso(c, pasadasParaElMarcador([c], crudos(new RegExp(`^${c.id}_pasada`)))[c.id]).estado).toBe(SIN_VEREDICTO);
    }
  });
});

describe('control: sin razones, nada cambia', () => {
  it('P2 con sus cinco pasadas sigue dando FALLA por las dos cosas, la ausencia incluida', async () => {
    const P2 = await cargar('P2_residuos_prosa.mjs');
    const m = marcarCaso(P2, pasadasParaElMarcador([P2], crudos(/^P2_pasada\d+\.json$/)).P2);
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('estable(s)-acierto');
    expect(m.fallos.join()).toContain('techo es 0');
  });
  it('y un caso sin razones da PASA', () => {
    expect(marcarCaso({ id: 'V', pasadas: 1, debenSalir: [], noDebenSalir: [], umbralDeAlarma: { maximoDeFalsosConfirmados: 0 } },
      [{ pasada: 1, hallazgos: [] }]).estado).toBe(PASA);
  });
});
