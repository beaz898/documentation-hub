import { describe, it, expect } from 'vitest';
import { validarLoQueElMarcadorLee } from './validar-lectura.mjs';

/**
 * Cada comprobación con su caso decisivo y su control positivo: un caso bien
 * escrito que NO se caza. Sin el control, «lo caza» no distingue «la regla
 * funciona» de «la regla lo rechaza todo».
 */

const cita = d => ({ literal: d, discriminante: d });
const base = () => ({
  fichero: 'X.mjs', id: 'X', nivel: 'juez-prosa', analizado: 'A', corpusExacto: ['B'], pasadas: 5,
  debenSalir: [{ id: 'X-1', citaEnElAnalizado: cita('a'), citaEnElCorpus: cita('b'), severidadMinima: 'contradiction' }],
  noDebenSalir: [],
  umbralDeAlarma: { minimoDeAciertos: 1, maximoDeFalsosConfirmados: 0, nota: 'n' },
  lineaDeBase: { aciertos: 1 },
});
const val = (casos, opts) => validarLoQueElMarcadorLee(casos, opts).join('\n');

describe('control positivo', () => {
  it('un caso de prosa bien escrito no se caza', () => {
    expect(validarLoQueElMarcadorLee([base()])).toEqual([]);
  });
});

describe('1 · umbral con claves que el marcador no sabe leer', () => {
  it('una clave ajena se caza', () => {
    const c = base(); c.umbralDeAlarma.minimoDeCandidatosJuzgados = 2;
    expect(val([c])).toContain('no sabe leer: minimoDeCandidatosJuzgados');
  });
  it('umbral estructural sin esperado, o esperado sin umbral: se caza; los dos juntos, no', () => {
    const c = base(); c.umbralDeAlarma.identicasMinimo = 20;
    expect(val([c])).toContain('sin `esperadoEstructural`');
    const d = { ...base(), esperadoEstructural: {} };
    expect(val([d])).toContain('nadie lo compara');
    const e = { ...base(), esperadoEstructural: {}, exigeNombrarLaColumna: true };
    e.umbralDeAlarma.discrepantesConColumnaCorrectaMinimo = 1;
    expect(validarLoQueElMarcadorLee([e])).toEqual([]);
  });
  it('exigeNombrarLaColumna sin el umbral que lo mide: se caza', () => {
    const c = { ...base(), esperadoEstructural: {}, exigeNombrarLaColumna: true };
    c.umbralDeAlarma.identicasMinimo = 1;
    expect(val([c])).toContain('discrepantesConColumnaCorrectaMinimo');
  });
  it('un estado desconocido se caza; el conocido no', () => {
    const c = base(); c.umbralDeAlarma.estado = 'OTRO';
    expect(val([c])).toContain("'OTRO'");
    const d = base(); d.umbralDeAlarma = { minimoDeAciertos: 1, maximoDeFalsosConfirmados: null, estado: 'LINEA_DE_BASE_PENDIENTE' };
    expect(validarLoQueElMarcadorLee([d])).toEqual([]);
  });
});

describe('2 · un esperado que cuenta y no se puede emparejar', () => {
  it('sin discriminantes y contando: se caza', () => {
    const c = base(); c.debenSalir[0].citaEnElCorpus = null;
    expect(val([c])).toContain('no puede emparejarlo');
  });
  it('sin discriminantes y declarado que NO cuenta: no se caza por eso', () => {
    const c = base(); c.debenSalir.push({ id: 'X-2', cuentaParaElUmbral: false });
    expect(validarLoQueElMarcadorLee([c])).toEqual([]);
  });
  it('un falso que cuenta y no se puede emparejar: se caza', () => {
    const c = base(); c.noDebenSalir = [{ id: 'X-F', cuentaComoFallo: true, citaEnElAnalizado: cita('a') }];
    expect(val([c])).toContain('nunca sumaría un falso');
  });
  it('el control de tanda que cuelga de un esperado no emparejable: se caza', () => {
    const otro = base(); otro.id = 'Y'; otro.debenSalir = [{ id: 'Y-1', columnaEnOposicion: 'C', enElAnalizado: 'a', enElCorpus: 'b' }];
    const c = base(); c.elSilencioCuentaSiSoloSi = { caso: 'Y', hallazgo: 'Y-1' };
    expect(val([otro, c])).toContain('control de tanda depende de Y/Y-1');
    const bueno = base(); bueno.id = 'Z';
    const d = base(); d.elSilencioCuentaSiSoloSi = { caso: 'Z', hallazgo: 'X-1' };
    expect(validarLoQueElMarcadorLee([bueno, d])).toEqual([]);
  });
});

describe('3 · expectativas cuyo tipo el marcador no compara', () => {
  it.each([
    ['criterioDeAcierto', 'nombra-a-la-persona'],
    ['precondicion', { pares: 0 }],
  ])('%s en la raíz se caza', (k, v) => {
    const c = { ...base(), [k]: v };
    expect(val([c])).toContain(`\`${k}\``);
  });
  it('extras que prometen contarse se cazan; PENDIENTE_DE_ETIQUETA no', () => {
    expect(val([{ ...base(), extras: 'FALSO_POSITIVO' }])).toContain('FALSO_POSITIVO');
    expect(validarLoQueElMarcadorLee([{ ...base(), extras: 'PENDIENTE_DE_ETIQUETA' }])).toEqual([]);
  });
  it('etiquetas que no son contradicción, severidad distinta o quién confirmó: se cazan', () => {
    const c = base();
    Object.assign(c.debenSalir[0], { etiquetasAceptadas: ['duplicado'], severidadMinima: 'minor_inconsistency', confirmadoPorEsperado: 'juicio' });
    const t = val([c]);
    expect(t).toContain('etiquetasAceptadas');
    expect(t).toContain('minor_inconsistency');
    expect(t).toContain("'juicio'");
  });
  it('un denominador que el ejecutor no suministra se caza; suministrado, no', () => {
    const c = { ...base(), denominadorObligatorio: { minimoParaQueElCeroValga: 2 } };
    expect(val([c])).toContain('candidatosJuzgados');
    expect(validarLoQueElMarcadorLee([c], { contextoSuministrado: new Set(['candidatosJuzgados']) })).toEqual([]);
  });
  it('un caso sin nada que el marcador lea se caza', () => {
    const c = { ...base(), debenSalir: [], noDebenSalir: [] };
    expect(val([c])).toContain('sólo puede salir PASA');
  });
});

describe('falla cerrado ante lo no clasificado', () => {
  it('una clave nueva en la raíz, en un esperado o en una cita se caza', () => {
    const c = { ...base(), algoNuevo: 1 };
    c.debenSalir[0].otraCosa = 1;
    c.debenSalir[0].citaEnElCorpus = { ...cita('b'), extra: 1 };
    const t = val([c]);
    expect(t).toContain('`algoNuevo` sin clasificar');
    expect(t).toContain('`otraCosa` sin clasificar');
    expect(t).toContain('`citaEnElCorpus.extra` sin clasificar');
  });
});
