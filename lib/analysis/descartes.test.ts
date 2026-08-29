import { describe, expect, it } from 'vitest';

import { huellaDeDescarte, marcarDescartadas } from './descartes';
import { esDescartePermanente } from './double-check';

/**
 * LOS DESCARTES QUE SOBREVIVEN (F-86 paso 3).
 *
 * QUÉ SE PUEDE PROBAR AQUÍ Y QUÉ NO, dicho antes que nada. La cadena de este
 * commit cruza tres endpoints —`/api/findings/dismiss`, `/api/index-text` y
 * `/api/documents/[id]/analysis`— y el alcance de la suite los prohíbe todos
 * (vitest.config.mts). Lo que SÍ es puro, y es donde vive la corrección, son
 * las tres funciones de abajo: cómo se construye la identidad, cómo se decide
 * que un hallazgo ya fue juzgado, y cómo se marca lo juzgado al volver.
 *
 * LA PRUEBA QUE JUSTIFICA EL COMMIT —marcar, recargar y que siga marcado— es de
 * PRODUCCIÓN, y se pide como tal. Esta batería fija las propiedades de las que
 * esa prueba depende; no la sustituye.
 */

const DOC_NUEVO = 'aaa11111-1111-1111-1111-111111111111';
const DOC_CORPUS = 'bbb22222-2222-2222-2222-222222222222';

const CITA_NUEVA = 'El personal dispone de 23 días laborables.';
const CITA_CORPUS = 'El personal dispone de 22 días laborables.';

const coordenadas = {
  existingDocumentId: DOC_CORPUS,
  newDocSays: CITA_NUEVA,
  existingDocSays: CITA_CORPUS,
};

describe('huellaDeDescarte — la identidad de un descarte', () => {
  it('es la misma huella para el mismo hallazgo', () => {
    const a = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas });
    const b = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas });
    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  /**
   * LA PROPIEDAD ENTERA DEL COMMIT, y la que hace que un descarte VALGA.
   *
   * Mañana el usuario sube el otro documento del par y los roles se invierten:
   * lo que era «el documento en revisión» pasa a ser «el del corpus». Si la
   * huella dependiera del orden, el sistema OLVIDARÍA lo que el usuario ya
   * decidió — que es romper F-67 en su consecuencia, no en su letra.
   */
  it('SOBREVIVE A INVERTIR LA DIRECCIÓN del par', () => {
    const subiendoElNuevo = huellaDeDescarte({
      documentoEnRevision: DOC_NUEVO,
      coordenadas: { existingDocumentId: DOC_CORPUS, newDocSays: CITA_NUEVA, existingDocSays: CITA_CORPUS },
    });

    // El mismo hallazgo visto desde el otro lado: ahora se analiza el que antes
    // era del corpus, y el otro es el candidato recuperado. Las citas viajan
    // con su documento, como siempre.
    const subiendoElOtro = huellaDeDescarte({
      documentoEnRevision: DOC_CORPUS,
      coordenadas: { existingDocumentId: DOC_NUEVO, newDocSays: CITA_CORPUS, existingDocSays: CITA_NUEVA },
    });

    expect(subiendoElNuevo).toBe(subiendoElOtro);
  });

  it('dos hallazgos distintos no comparten identidad', () => {
    const a = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas });
    const b = huellaDeDescarte({
      documentoEnRevision: DOC_NUEVO,
      coordenadas: { ...coordenadas, newDocSays: 'El personal dispone de 30 días laborables.' },
    });
    expect(a).not.toBe(b);
  });

  it('va hasheada: ni la cita ni el nombre viajan en claro', () => {
    const h = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas })!;
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain('días');
  });

  /**
   * LA IDENTIDAD PENDIENTE DE NACER (F-87 P2). En la subida desde el chat el
   * documento en revisión no existe todavía, y sin su id no hay huella. NO es
   * un error: es la razón de que la persistencia entre por la indexación en ese
   * camino. Devolver `null` en vez de lanzar es lo que permite que el análisis
   * siga su curso.
   */
  it('sin id del documento en revisión devuelve null, no lanza', () => {
    expect(huellaDeDescarte({ documentoEnRevision: undefined, coordenadas })).toBeNull();
    expect(huellaDeDescarte({ documentoEnRevision: null, coordenadas })).toBeNull();
  });

  it('sin id del documento del corpus tampoco hay identidad', () => {
    expect(huellaDeDescarte({
      documentoEnRevision: DOC_NUEVO,
      coordenadas: { ...coordenadas, existingDocumentId: '' },
    })).toBeNull();
  });

  it('sin alguna de las dos citas tampoco', () => {
    expect(huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas: { ...coordenadas, newDocSays: '' } })).toBeNull();
    expect(huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas: { ...coordenadas, existingDocSays: '' } })).toBeNull();
  });
});

describe('esDescartePermanente — ¿ya lo juzgó el usuario?', () => {
  const discrepancia = {
    newDocSays: CITA_NUEVA,
    existingDocSays: CITA_CORPUS,
    existingDocumentId: DOC_CORPUS,
  };
  const huella = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas })!;

  it('reconoce el hallazgo que está en los descartes de la organización', () => {
    expect(esDescartePermanente(discrepancia, {
      conjunto: new Set([huella]),
      documentoEnRevision: DOC_NUEVO,
    })).toBe(true);
  });

  it('no reconoce uno que no está', () => {
    expect(esDescartePermanente(discrepancia, {
      conjunto: new Set(['otra-huella-cualquiera']),
      documentoEnRevision: DOC_NUEVO,
    })).toBe(false);
  });

  /**
   * LO CONSERVADOR ES PRESENTAR DE MÁS. Sin id del documento en revisión no se
   * puede saber si el usuario ya lo juzgó, y en la duda el hallazgo se manda a
   * verificar: presentar algo ya descartado es molesto, callar una
   * contradicción real es el fallo que importa.
   */
  it('sin id del documento en revisión devuelve false: en la duda, se verifica', () => {
    expect(esDescartePermanente(discrepancia, {
      conjunto: new Set([huella]),
      documentoEnRevision: undefined,
    })).toBe(false);
  });

  it('sin descartes en la organización no hace nada', () => {
    expect(esDescartePermanente(discrepancia, { conjunto: new Set(), documentoEnRevision: DOC_NUEVO })).toBe(false);
    expect(esDescartePermanente(discrepancia, undefined)).toBe(false);
  });

  it('un hallazgo anterior a d13e125f, sin el id del corpus, no colisiona con nada', () => {
    expect(esDescartePermanente(
      { newDocSays: CITA_NUEVA, existingDocSays: CITA_CORPUS },
      { conjunto: new Set([huella]), documentoEnRevision: DOC_NUEVO },
    )).toBe(false);
  });
});

describe('marcarDescartadas — lo que el usuario ve al volver', () => {
  const huella = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas })!;

  /** La forma con la que llega el jsonb de la bandeja: `dismissed` es opcional
   *  porque en lo guardado NO EXISTE — lo pone el servidor de camino al
   *  cliente. Anotarlo aquí es lo que hace que leerlo en las aserciones sea
   *  legítimo y no una casualidad de la inferencia. */
  interface Guardada {
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocumentId?: string;
    dismissed?: boolean;
  }

  const lista: Guardada[] = [
    { topic: 'Días de vacaciones', newDocSays: CITA_NUEVA, existingDocSays: CITA_CORPUS, existingDocumentId: DOC_CORPUS },
    { topic: 'Antigüedad', newDocSays: 'Seis meses.', existingDocSays: 'Doce meses.', existingDocumentId: DOC_CORPUS },
  ];

  it('marca la juzgada y deja en paz a la otra', () => {
    const r = marcarDescartadas(lista, { documentoEnRevision: DOC_NUEVO, descartes: new Set([huella]) });

    expect(r[0].dismissed).toBe(true);
    expect(r[1].dismissed).toBeUndefined();
  });

  /**
   * MARCA, NO FILTRA. El encargo lo fija: este commit cambia DÓNDE viven los
   * descartes, no qué se hace con ellos. Quitarlas de la lista impediría al
   * usuario cambiar de opinión, que es la otra mitad de F-67.
   */
  it('NO quita nada de la lista', () => {
    const r = marcarDescartadas(lista, { documentoEnRevision: DOC_NUEVO, descartes: new Set([huella]) });
    expect(r).toHaveLength(2);
  });

  it('no toca el resto del hallazgo', () => {
    const r = marcarDescartadas(lista, { documentoEnRevision: DOC_NUEVO, descartes: new Set([huella]) });
    expect(r[0].topic).toBe('Días de vacaciones');
    expect(r[0].existingDocSays).toBe(CITA_CORPUS);
  });

  it('sin descartes devuelve la lista tal cual', () => {
    const r = marcarDescartadas(lista, { documentoEnRevision: DOC_NUEVO, descartes: new Set() });
    expect(r).toBe(lista);
  });

  it('sin id del documento en revisión no marca nada', () => {
    const r = marcarDescartadas(lista, { documentoEnRevision: undefined, descartes: new Set([huella]) });
    expect(r[0].dismissed).toBeUndefined();
  });

  /** El jsonb de la bandeja tiene meses: hay análisis sin `existingDocumentId`
   *  (anteriores a d13e125f) y no pueden romper el marcado de los demás. */
  it('convive con hallazgos viejos sin el id del corpus', () => {
    const mezcla: Guardada[] = [
      { topic: 'Viejo', newDocSays: 'algo', existingDocSays: 'otra cosa' },
      lista[0],
    ];
    const r = marcarDescartadas(mezcla, { documentoEnRevision: DOC_NUEVO, descartes: new Set([huella]) });

    expect(r[0].dismissed).toBeUndefined();
    expect(r[1].dismissed).toBe(true);
  });
});
