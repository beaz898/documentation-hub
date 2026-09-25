import { describe, it, expect } from 'vitest';
import { marcarCaso, marcarTanda, PASA, FALLA, SIN_VEREDICTO } from './marcador.mjs';

/**
 * LA BATERÍA DEL MARCADOR. Cada estado con su caso decisivo y su control
 * positivo al lado: sin el control, un `SIN_VEREDICTO` no distingue «la regla
 * funciona» de «nada puede pasar nunca».
 */

const hallazgo = (nuevo, viejo, severity = 'contradiction') => ({
  topic: 't', newDocSays: nuevo, existingDocSays: viejo, severity,
});

/** Caso mínimo con un acierto y un falso, los dos por discriminante. */
const caso = (extra = {}) => ({
  id: 'C',
  pasadas: 1,
  debenSalir: [{
    id: 'C-OK',
    citaEnElAnalizado: { discriminante: 'dice ciento treinta y cuatro' },
    citaEnElCorpus: { discriminante: 'dice ciento veintiuno' },
  }],
  noDebenSalir: [{
    id: 'C-FALSO',
    patronDeF22: 'p',
    cuentaComoFallo: true,
    citaEnElAnalizado: { discriminante: 'treinta minutos' },
    citaEnElCorpus: { discriminante: 'treinta dias' },
  }],
  umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: 0 },
  ...extra,
});

const pasada = (hallazgos) => [{ pasada: 1, hallazgos }];

describe('los tres estados', () => {
  it('PASA: sale el acierto y ningún falso', () => {
    const r = marcarCaso(caso(), pasada([hallazgo('dice ciento treinta y cuatro', 'dice ciento veintiuno')]));
    expect(r.estado).toBe(PASA);
    expect(r.totalAciertos).toBe(1);
  });

  it('FALLA: sale el acierto y además el falso, con techo 0', () => {
    const r = marcarCaso(caso(), pasada([
      hallazgo('dice ciento treinta y cuatro', 'dice ciento veintiuno'),
      hallazgo('treinta minutos', 'treinta dias'),
    ]));
    expect(r.estado).toBe(FALLA);
    expect(r.fallos.join(' ')).toContain('1 falsos');
  });

  it('FALLA: no sale el acierto que el umbral exige', () => {
    const r = marcarCaso(caso(), pasada([]));
    expect(r.estado).toBe(FALLA);
    expect(r.fallos.join(' ')).toContain('0 aciertos');
  });

  it('SIN_VEREDICTO: la pasada no se ejecutó', () => {
    const r = marcarCaso(caso(), [{ pasada: 1, noMedible: 'NO_MEDIBLE' }]);
    expect(r.estado).toBe(SIN_VEREDICTO);
    expect(r.razones.join(' ')).toContain('ninguna pasada ejecutable');
  });

  it('SIN_VEREDICTO gana a FALLA: un caso ilegible no da veredicto ni para mal', () => {
    // Cero aciertos (que sería FALLA) sobre una tanda incompleta.
    const c = caso({ pasadas: 5 });
    const r = marcarCaso(c, pasada([]));
    expect(r.estado).toBe(SIN_VEREDICTO);
    expect(r.fallos).toEqual([]);
  });
});

describe('línea de base pendiente: la tanda MIDE, no juzga', () => {
  const pendiente = () => caso({
    umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: null, estado: 'LINEA_DE_BASE_PENDIENTE' },
  });

  it('con el falso saliendo, NO es FALLA: es SIN_VEREDICTO con la frecuencia', () => {
    const r = marcarCaso(pendiente(), pasada([
      hallazgo('dice ciento treinta y cuatro', 'dice ciento veintiuno'),
      hallazgo('treinta minutos', 'treinta dias'),
    ]));
    expect(r.estado).toBe(SIN_VEREDICTO);
    expect(r.razones.join(' ')).toContain('observado: 1 falsos');
  });

  it('y sin el falso tampoco es PASA — control positivo del estado', () => {
    const r = marcarCaso(pendiente(), pasada([hallazgo('dice ciento treinta y cuatro', 'dice ciento veintiuno')]));
    expect(r.estado).toBe(SIN_VEREDICTO);
  });
});

describe('el control de tanda de N4 y N5', () => {
  const conControl = () => ({
    id: 'N4',
    pasadas: 1,
    debenSalir: [],
    noDebenSalir: [{
      id: 'N4-F', patronDeF22: 'p', cuentaComoFallo: true,
      citaEnElAnalizado: { discriminante: 'protocolo de esterilizacion' },
      citaEnElCorpus: { discriminante: 'pendiente reciclaje' },
    }],
    umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 },
    elSilencioCuentaSiSoloSi: { caso: 'N1', hallazgo: 'N1-PUESTO' },
  });

  it('sin el acierto del ancla, el silencio es SIN_VEREDICTO y no PASA', () => {
    const r = marcarCaso(conControl(), pasada([]), { aciertosPorCaso: { N1: new Set() } });
    expect(r.estado).toBe(SIN_VEREDICTO);
    expect(r.razones.join(' ')).toContain('control de tanda NO cumplido');
  });

  it('con el acierto del ancla, el MISMO silencio pasa — control positivo', () => {
    const r = marcarCaso(conControl(), pasada([]), { aciertosPorCaso: { N1: new Set(['N1-PUESTO']) } });
    expect(r.estado).toBe(PASA);
  });

  it('marcarTanda resuelve el ancla sola, en dos vueltas', () => {
    const n1 = caso({ id: 'N1', debenSalir: [{ ...caso().debenSalir[0], id: 'N1-PUESTO' }] });
    const n4 = conControl();
    const marcas = marcarTanda([n1, n4], {
      N1: pasada([hallazgo('dice ciento treinta y cuatro', 'dice ciento veintiuno')]),
      N4: pasada([]),
    });
    expect(marcas.find(m => m.casoId === 'N1').estado).toBe(PASA);
    expect(marcas.find(m => m.casoId === 'N4').estado).toBe(PASA);
  });

  it('y si el ancla falla, el que depende de ella queda SIN_VEREDICTO', () => {
    const n1 = caso({ id: 'N1', debenSalir: [{ ...caso().debenSalir[0], id: 'N1-PUESTO' }] });
    const marcas = marcarTanda([n1, conControl()], { N1: pasada([]), N4: pasada([]) });
    expect(marcas.find(m => m.casoId === 'N1').estado).toBe(FALLA);
    expect(marcas.find(m => m.casoId === 'N4').estado).toBe(SIN_VEREDICTO);
  });
});

describe('las dos especies de noDebenSalir', () => {
  it('una REGLA mecánica cuenta cualquier contradicción como falso', () => {
    const c = {
      id: 'N2', pasadas: 1, debenSalir: [],
      noDebenSalir: [{ id: 'N2-CUALQUIERA', regla: 'TODO_HALLAZGO_DE_TIPO_CONTRADICCION', cuentaComoFallo: true }],
      umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 },
    };
    const r = marcarCaso(c, pasada([hallazgo('lo que sea', 'lo otro')]));
    expect(r.estado).toBe(FALLA);
  });

  it('una regla que el marcador no sabe aplicar NO se interpreta: falla cerrado', () => {
    const c = {
      id: 'P4', pasadas: 1, debenSalir: [],
      noDebenSalir: [{ id: 'P4-NO-1', regla: 'toda persona que no sea Belmonte ni Medina', cuentaComoFallo: true }],
      umbralDeAlarma: { minimoDeAciertos: 0, maximoDeFalsosConfirmados: 0 },
    };
    const r = marcarCaso(c, pasada([]));
    expect(r.estado).toBe(SIN_VEREDICTO);
    expect(r.razones.join(' ')).toContain('etiqueta humana');
  });
});

describe('el emparejamiento es por discriminante, no por título', () => {
  it('un hallazgo con el título correcto y citas que no lo sostienen NO cuenta como acierto', () => {
    const r = marcarCaso(caso(), pasada([hallazgo('otra cosa', 'otra cosa mas')]));
    expect(r.totalAciertos).toBe(0);
    expect(r.marcas[0].extras).toBe(1);
  });

  it('los lados pueden venir intercambiados', () => {
    const r = marcarCaso(caso(), pasada([hallazgo('dice ciento veintiuno', 'dice ciento treinta y cuatro')]));
    expect(r.totalAciertos).toBe(1);
  });

  it('las inconsistencias menores no son contradicciones y no cuentan', () => {
    const r = marcarCaso(caso(), pasada([
      hallazgo('dice ciento treinta y cuatro', 'dice ciento veintiuno'),
      hallazgo('treinta minutos', 'treinta dias', 'minor_inconsistency'),
    ]));
    expect(r.estado).toBe(PASA);
  });

  it('un mismo hallazgo no se cuenta dos veces', () => {
    const r = marcarCaso(caso(), pasada([hallazgo('dice ciento treinta y cuatro', 'dice ciento veintiuno')]));
    expect(r.marcas[0].aciertos).toEqual(['C-OK']);
    expect(r.marcas[0].falsos).toEqual([]);
    expect(r.marcas[0].extras).toBe(0);
  });
});
