import { describe, it, expect } from 'vitest';
import {
  seleccionIndexable,
  motivosDeNoIndexable,
  type DocumentoSeleccionado,
} from './seleccion-indexable';

/**
 * ¿SE PUEDE METER ESTA SELECCIÓN AL CORPUS? — el botón de indexar en lote.
 *
 * ⚠️ LO QUE SE VIGILA NO ES EL BOOLEANO: es que el MOTIVO sobreviva. Un botón
 * apagado que no dice por qué se lee como una aplicación rota, y la mitad de
 * los casos de aquí existen para que los recuentos no se fundan en un «no se
 * puede» a secas el día que alguien simplifique el tipo.
 */

const conAnalisis: DocumentoSeleccionado = { lastAnalysis: { id: 'a1' }, stagedPending: false };
const sinAnalisis: DocumentoSeleccionado = { lastAnalysis: null, stagedPending: false };
const conVersion: DocumentoSeleccionado = { lastAnalysis: { id: 'a2' }, stagedPending: true };
const lasDosCosas: DocumentoSeleccionado = { lastAnalysis: null, stagedPending: true };

describe('seleccionIndexable', () => {
  it('todos analizados y sin versión pendiente: se puede', () => {
    const r = seleccionIndexable([conAnalisis, conAnalisis, conAnalisis]);
    expect(r.puede).toBe(true);
    expect(r.total).toBe(3);
  });

  /** ⚠️ MITAD CONTRARIA de la anterior, y la que muere si alguien retira la
   *  condición del análisis: sin ella, éste diría que sí. */
  it('uno sin analizar apaga el botón, y se sabe cuántos', () => {
    const r = seleccionIndexable([conAnalisis, sinAnalisis, conAnalisis]);
    expect(r.puede).toBe(false);
    if (r.puede) throw new Error('inalcanzable');
    expect(r.sinAnalisis).toBe(1);
    expect(r.conVersionPendiente).toBe(0);
    expect(r.total).toBe(3);
  });

  /** ⚠️ Y ÉSTE MUERE SI ALGUIEN RETIRA `stagedPending`. Son dos casos y no uno
   *  a propósito: una sola prueba con los dos motivos a la vez sobreviviría a
   *  quitar cualquiera de ellos. */
  it('uno con versión pendiente apaga el botón, y se sabe cuántos', () => {
    const r = seleccionIndexable([conAnalisis, conVersion]);
    expect(r.puede).toBe(false);
    if (r.puede) throw new Error('inalcanzable');
    expect(r.sinAnalisis).toBe(0);
    expect(r.conVersionPendiente).toBe(1);
  });

  /** ⚠️ LOS DOS MOTIVOS A LA VEZ, que es el caso por el que existe la función:
   *  si sólo se contara el primero, el usuario quitaría los sin-analizar y
   *  volvería a chocar con la segunda razón sin haberla visto nunca. */
  it('cuenta los dos motivos a la vez, no se para en el primero', () => {
    const r = seleccionIndexable([sinAnalisis, conVersion, conAnalisis]);
    expect(r.puede).toBe(false);
    if (r.puede) throw new Error('inalcanzable');
    expect(r.sinAnalisis).toBe(1);
    expect(r.conVersionPendiente).toBe(1);
  });

  /** Un documento puede caer por las dos: cuenta en las dos, porque cada
   *  recuento contesta a «cuántos te faltan por ESTO», no a un reparto. */
  it('un documento con las dos cosas cuenta en los dos recuentos', () => {
    const r = seleccionIndexable([lasDosCosas]);
    expect(r.puede).toBe(false);
    if (r.puede) throw new Error('inalcanzable');
    expect(r.sinAnalisis).toBe(1);
    expect(r.conVersionPendiente).toBe(1);
    expect(r.total).toBe(1);
  });

  /**
   * ⚠️ EL CASO DE LA LISTA VACÍA, y no es teórico: si se hubiera escrito con
   * `every`, una lista vacía habría dicho que sí y el botón se encendería sin
   * nada seleccionado.
   */
  it('sin nada seleccionado no se puede', () => {
    const r = seleccionIndexable([]);
    expect(
      r.puede,
      'Una lista vacía que diga «sí» enciende el botón sin selección: la primera ' +
      'pulsación no haría nada y el usuario no sabría por qué.',
    ).toBe(false);
  });

  it('uno solo, analizado, basta', () => {
    expect(seleccionIndexable([conAnalisis]).puede).toBe(true);
  });

  /** El análisis puede llegar como `undefined` desde el endpoint tanto como
   *  `null`; las dos formas significan «nunca pasó por un análisis». */
  it('undefined cuenta igual que null', () => {
    const r = seleccionIndexable([{ lastAnalysis: undefined, stagedPending: false }]);
    expect(r.puede).toBe(false);
    if (r.puede) throw new Error('inalcanzable');
    expect(r.sinAnalisis).toBe(1);
  });
});

describe('motivosDeNoIndexable', () => {
  it('cuando se puede, no hay nada que decir', () => {
    expect(motivosDeNoIndexable(seleccionIndexable([conAnalisis]))).toEqual([]);
  });

  it('una frase por motivo, con su recuento y su denominador', () => {
    const frases = motivosDeNoIndexable(seleccionIndexable([sinAnalisis, conAnalisis]));
    expect(frases).toHaveLength(1);
    expect(frases[0]).toContain('1 de 2');
  });

  /**
   * ⚠️ EL CASO QUE ATA EL ORDEN, y lo ata porque el orden es una decisión: el
   * motivo que el usuario puede resolver por sí mismo —analizar— va antes que
   * el que le obliga a decidir sobre una versión. Si alguien los invierte, aquí
   * se entera.
   */
  it('las dos frases salen, y el análisis va primero', () => {
    const frases = motivosDeNoIndexable(seleccionIndexable([sinAnalisis, conVersion]));
    expect(frases).toHaveLength(2);
    expect(frases[0]).toContain('no se han analizado');
    expect(frases[1]).toContain('versión pendiente');
  });

  /** ⚠️ MITAD CONTRARIA del orden: con un solo motivo no aparece el otro. Sin
   *  este caso, un `motivos` que devolviera siempre las dos frases pasaría. */
  it('con un solo motivo no se cuela la frase del otro', () => {
    const frases = motivosDeNoIndexable(seleccionIndexable([conVersion]));
    expect(frases).toHaveLength(1);
    expect(frases[0]).not.toContain('no se han analizado');
  });

  /** La selección vacía tiene su propia frase: «0 de 0 no se han analizado» no
   *  le dice a nadie lo que le pasa. */
  it('la selección vacía dice que falta seleccionar, no recuentos en cero', () => {
    const frases = motivosDeNoIndexable(seleccionIndexable([]));
    expect(frases).toHaveLength(1);
    expect(frases[0]).toContain('Selecciona');
    expect(frases[0]).not.toContain('0 de 0');
  });

  /**
   * CONTROL POSITIVO DE LA PAREJA: que `puede: false` y frases no vacías vayan
   * SIEMPRE juntos. Un botón apagado sin frase es exactamente el fallo que esta
   * función existe para no cometer, y sin este caso se colaría cualquier rama
   * futura que devolviera `false` sin motivo.
   */
  it('nunca hay un «no se puede» sin frase que lo explique', () => {
    const combinaciones: DocumentoSeleccionado[][] = [
      [],
      [sinAnalisis],
      [conVersion],
      [lasDosCosas],
      [conAnalisis, sinAnalisis],
      [conAnalisis, conVersion],
      [sinAnalisis, conVersion, conAnalisis],
      [conAnalisis],
      [conAnalisis, conAnalisis],
    ];
    for (const docs of combinaciones) {
      const estado = seleccionIndexable(docs);
      const frases = motivosDeNoIndexable(estado);
      expect(
        frases.length > 0,
        `Selección de ${docs.length} documento(s): puede=${estado.puede} y ` +
        `${frases.length} frases. Un botón apagado sin motivo se lee como una ` +
        `aplicación rota.`,
      ).toBe(!estado.puede);
    }
  });
});
