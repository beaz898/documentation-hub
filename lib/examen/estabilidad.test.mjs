import { describe, it, expect } from 'vitest';
import { estadoDeEstabilidad, REPETIR } from './estabilidad.mjs';
import { marcarCaso, FALLA, PASA, SIN_VEREDICTO } from './marcador.mjs';
import { lineasDelVeredicto } from './veredicto.mjs';

/**
 * La regla de Fable del 25/09, con sus bordes como casos decisivos: 2/5 salta
 * y 3/5 no; 5/5 es estable y 4/5 no; un acierto en UNA pasada ya no basta.
 */

const cita = d => ({ literal: d, discriminante: d });
const esperado = (id, extra = {}) => ({ id, citaEnElAnalizado: cita(`a-${id}`), citaEnElCorpus: cita(`b-${id}`), ...extra });
const hallazgo = id => ({ severity: 'contradiction', newDocSays: `a-${id}`, existingDocSays: `b-${id}` });

/** Cinco pasadas; `aciertoEn[id]` = número de pasadas (las primeras) en que sale. */
const pasadas = aciertoEn => [1, 2, 3, 4, 5].map(p => ({
  pasada: p,
  hallazgos: Object.entries(aciertoEn).filter(([, k]) => p <= k).map(([id]) => hallazgo(id)),
}));
const caso = (debenSalir, minimo) => ({
  id: 'X', pasadas: 5, debenSalir, noDebenSalir: [],
  umbralDeAlarma: { minimoDeAciertos: minimo, maximoDeFalsosConfirmados: 0 },
});

describe('los tres estados', () => {
  it.each([[5, 'estable-acierto'], [4, 'inestable'], [1, 'inestable'], [0, 'estable-fallo']])('%i/5 → %s', (k, estado) => {
    expect(estadoDeEstabilidad(k, 5)).toBe(estado);
  });
});

describe('la alarma: una estable-acierto que baja a 2/5 o menos', () => {
  const base = esperado('A', { estabilidadDeBase: 'estable-acierto' });
  it('2/5 es ALARMA — el borde que salta', () => {
    const m = marcarCaso(caso([base], 0), pasadas({ A: 2 }));
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('ALARMA: A era estable-acierto y sale 2/5');
  });
  it('3/5 NO es rojo: «repetir 5 más antes de decir nada» — el borde que no salta', () => {
    const m = marcarCaso(caso([base], 0), pasadas({ A: 3 }));
    expect(m.estado).toBe(SIN_VEREDICTO);
    expect(m.razones.join()).toContain(REPETIR);
  });
  it('5/5 sigue estable: PASA', () => {
    expect(marcarCaso(caso([base], 1), pasadas({ A: 5 })).estado).toBe(PASA);
  });
  it('sin base declarada, un 2/5 no es alarma: nadie dijo que fuera estable', () => {
    const m = marcarCaso(caso([esperado('A')], 0), pasadas({ A: 2 }));
    expect(m.fallos.join()).not.toContain('ALARMA');
  });
  it('la alarma de uno pasa por delante del «repetir» de otro', () => {
    const b = esperado('B', { estabilidadDeBase: 'estable-acierto' });
    const m = marcarCaso(caso([base, b], 0), pasadas({ A: 2, B: 3 }));
    expect(m.estado).toBe(FALLA);
  });
});

describe('el mínimo de aciertos cuenta estables, no uniones', () => {
  it('1/5 ya NO pasa un mínimo de 1 (hasta hoy pasaba): repetir', () => {
    const m = marcarCaso(caso([esperado('A')], 1), pasadas({ A: 1 }));
    expect(m.estado).toBe(SIN_VEREDICTO);
    expect(m.razones.join()).toContain(REPETIR);
  });
  it('4/5 tampoco: estable es 5/5', () => {
    expect(marcarCaso(caso([esperado('A')], 1), pasadas({ A: 4 })).estado).toBe(SIN_VEREDICTO);
  });
  it('si ni contando los inestables se llega, es FALLA', () => {
    const m = marcarCaso(caso([esperado('A'), esperado('B')], 2), pasadas({ A: 5, B: 0 }));
    expect(m.estado).toBe(FALLA);
    expect(m.fallos.join()).toContain('1 estable(s)-acierto (5/5) y el umbral exige 2');
  });
  it('un esperado aplazado (cuentaParaElUmbral: false) no cuenta', () => {
    const m = marcarCaso(caso([esperado('A'), esperado('B', { cuentaParaElUmbral: false })], 1), pasadas({ A: 5, B: 3 }));
    expect(m.estado).toBe(PASA);
    expect(m.estabilidad.inestables).toBe(0);
  });
});

describe('los inestables, en su propia línea', () => {
  it('por caso y en el total de la tanda', () => {
    const c = caso([esperado('A'), esperado('B')], 0);
    const resultados = pasadas({ A: 3, B: 1 }).map(p => ({
      casoId: 'X', pasada: p.pasada, cuerpo: { analisis: { discrepancies: p.hallazgos, overlaps: [] } },
    }));
    const t = lineasDelVeredicto([c], resultados).join('\n');
    expect(t).toContain('    · inestables: 2');
    expect(t).toContain('INESTABLES EN LA TANDA: 2');
  });
});
