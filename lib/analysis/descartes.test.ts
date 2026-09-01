import { describe, expect, it } from 'vitest';

import { huellaDeDescarte, marcarDescartadas, huellaSolicitada } from './descartes';
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

describe('huellaSolicitada — el tipo decide la identidad (F-94, ficha B)', () => {
  const SHA = 'a'.repeat(64);
  const prosa = {
    documentoEnRevision: 'doc-nuevo',
    existingDocumentId: 'doc-viejo',
    newDocSays: 'el plazo es de quince años',
    existingDocSays: 'el plazo es de cinco años',
  };

  it('tabular: devuelve la huella que vino, sin recalcular nada', () => {
    const r = huellaSolicitada({ tipo: 'tabular', huella: SHA, ...prosa });
    // La forma ENTERA, que desde el commit 2 incluye la especie: es lo que
    // `registrarDescartes` va a preguntar en vez de deducir.
    expect(r).toEqual({ ok: true, huella: SHA, especie: 'tabular' });
  });

  /**
   * ⚠️ EL CASO QUE CIERRA EL CAMINO ACCIDENTAL. Con `tipo: 'tabular'` las
   * coordenadas de texto NO se miran: aunque vengan las tres cadenas completas
   * y perfectamente válidas para prosa, sin huella no hay descarte.
   * Es la puerta por la que un hallazgo de tabla habría quedado registrado con
   * una identidad de texto — frágil ante un cambio de columna cualquiera y ante
   * una reordenación de filas.
   */
  it('tabular SIN huella: rechaza, aunque las coordenadas de prosa sean válidas', () => {
    const r = huellaSolicitada({ tipo: 'tabular', huella: undefined, ...prosa });
    expect(r.ok).toBe(false);
  });

  it('tabular con huella MAL FORMADA: rechaza', () => {
    for (const mala of ['', 'no-es-un-hash', SHA.slice(0, 63), SHA + 'a', SHA.toUpperCase(), 'g'.repeat(64)]) {
      expect(huellaSolicitada({ tipo: 'tabular', huella: mala, ...prosa }).ok, `aceptó: ${mala}`).toBe(false);
    }
  });

  it('prosa: construye la huella con las citas, como siempre', () => {
    const r = huellaSolicitada({ tipo: 'prosa', huella: undefined, ...prosa });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.huella).toMatch(/^[0-9a-f]{64}$/);
    // Y es la MISMA que calcula la huella de prosa por su cuenta: no hay una
    // segunda implementación escondida aquí.
    expect(r.huella).toBe(huellaDeDescarte({
      documentoEnRevision: prosa.documentoEnRevision,
      coordenadas: {
        existingDocumentId: prosa.existingDocumentId,
        newDocSays: prosa.newDocSays,
        existingDocSays: prosa.existingDocSays,
      },
    }));
  });

  /**
   * COMPATIBILIDAD, declarada y no accidental: un cliente anterior a este
   * despliegue —una pestaña abierta— manda el cuerpo de siempre, sin `tipo`.
   * Se trata como PROSA, que es exactamente lo que hacía. Y no abre la puerta
   * tabular, porque para lo tabular ese cliente no tenía botón.
   */
  it('SIN tipo se trata como prosa', () => {
    const conTipo = huellaSolicitada({ tipo: 'prosa', huella: undefined, ...prosa });
    const sinTipo = huellaSolicitada({ tipo: undefined, huella: undefined, ...prosa });
    expect(sinTipo).toEqual(conTipo);
  });

  it('prosa con coordenadas incompletas: rechaza', () => {
    expect(huellaSolicitada({ ...prosa, tipo: 'prosa', huella: undefined, existingDocumentId: undefined }).ok).toBe(false);
    expect(huellaSolicitada({ ...prosa, tipo: 'prosa', huella: undefined, newDocSays: 42 }).ok).toBe(false);
  });
});

/**
 * LA ESPECIE TABULAR AL VOLVER (F-94, ficha B, commit 2).
 *
 * Sin esto, un descarte de fila se registraba y NO SE VEÍA al reabrir: la
 * memoria existía en la base de datos y el usuario volvía a encontrarse el
 * hallazgo que ya había juzgado. Media funcionalidad — la mitad que escribe sin
 * la mitad que lee.
 *
 * ⚠️ LO QUE DECIDE LA RAMA ES `origen`, NO LA PRESENCIA DE `huella`. La
 * diferencia entre las dos lecturas es el caso de las dos filas de abajo, y no
 * es teórica: el camino PRE-INDEXADO de F-87 P1 emite hallazgos tabulares SIN
 * huella, y bajo la lectura equivocada caerían a la rama de prosa y se les
 * calcularía una identidad sobre el texto de la fila.
 */
describe('marcarDescartadas — la especie tabular', () => {
  const HUELLA_TABULAR = 'a'.repeat(64);

  interface GuardadaTabular {
    topic: string;
    newDocSays: string;
    existingDocSays: string;
    existingDocumentId?: string;
    origen?: 'diff_tabular';
    huella?: string;
    dismissed?: boolean;
  }

  /** Una fila del diff tal como la deja la emisión: con su especie y su huella
   *  ya calculada por el servidor (F-88 paso 2). */
  const filaTabular: GuardadaTabular = {
    topic: 'Turno de Dr. Javier Soto',
    newDocSays: 'Dr. Javier Soto | Chamberí | Ortodoncia | Tarde | 38',
    existingDocSays: 'Dr. Javier Soto | Chamberí | Ortodoncia | Mañana | 38',
    existingDocumentId: DOC_CORPUS,
    origen: 'diff_tabular',
    huella: HUELLA_TABULAR,
  };

  it('la fila con su huella en el conjunto vuelve marcada', () => {
    const r = marcarDescartadas([filaTabular], {
      documentoEnRevision: DOC_NUEVO,
      descartes: new Set([HUELLA_TABULAR]),
    });

    expect(r[0].dismissed).toBe(true);
  });

  it('la fila cuya huella NO está en el conjunto vuelve intacta', () => {
    const r = marcarDescartadas([filaTabular], {
      documentoEnRevision: DOC_NUEVO,
      descartes: new Set(['b'.repeat(64)]),
    });

    expect(r[0].dismissed).toBeUndefined();
  });

  /**
   * ⚠️⚠️ EL CASO QUE VIGILA QUE LA IDENTIDAD ACCIDENTAL NO VUELVA POR LA LECTURA.
   *
   * Una fila del camino PRE-INDEXADO: tabular, sin huella. Su huella DE PROSA
   * —la que saldría de sus dos «citas», que son el texto de la fila— SÍ está en
   * el conjunto. Si la especie se dedujera de «tiene huella o no», esta fila
   * caería a la rama de prosa, se le calcularía esa identidad y se marcaría.
   *
   * Y SERÍA PEOR QUE LA DE ESCRITURA que F-94 vino a matar, porque nadie la
   * habría escrito: se fabricaría sola al reabrir un análisis guardado, sobre
   * un texto de fila que incluye todas las columnas. Reordenar el Excel la
   * cambiaría, y el descarte se evaporaría sin que nada lo dijera.
   *
   * Un hallazgo tabular sin huella NO TIENE MEMORIA. Le falta identidad; no le
   * sobra una prestada.
   */
  it('una fila tabular SIN huella no coge la identidad de prosa que le tocaría', () => {
    const sinHuella: GuardadaTabular = { ...filaTabular, huella: undefined };

    // La huella de prosa que se le calcularía si cayera por la rama equivocada.
    const laQueNoDebeUsar = huellaDeDescarte({
      documentoEnRevision: DOC_NUEVO,
      coordenadas: {
        existingDocumentId: DOC_CORPUS,
        newDocSays: sinHuella.newDocSays,
        existingDocSays: sinHuella.existingDocSays,
      },
    })!;
    expect(laQueNoDebeUsar).toMatch(/^[0-9a-f]{64}$/);

    const r = marcarDescartadas([sinHuella], {
      documentoEnRevision: DOC_NUEVO,
      descartes: new Set([laQueNoDebeUsar]),
    });

    expect(r[0].dismissed).toBeUndefined();
  });

  /**
   * LAS DOS ESPECIES EN LA MISMA PASADA. No hay dos conjuntos:
   * `finding_dismissals` tiene una sola clave `(org_id, fingerprint)` y las dos
   * conviven en ella. Cada hallazgo pregunta por su identidad y el conjunto
   * contesta sin saber de qué especie era.
   */
  it('un conjunto mezclado marca las dos especies a la vez', () => {
    const deProsa = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas })!;
    const mezcla = [
      filaTabular,
      { topic: 'Días de vacaciones', newDocSays: CITA_NUEVA, existingDocSays: CITA_CORPUS, existingDocumentId: DOC_CORPUS } as GuardadaTabular,
    ];

    const r = marcarDescartadas(mezcla, {
      documentoEnRevision: DOC_NUEVO,
      descartes: new Set([HUELLA_TABULAR, deProsa]),
    });

    expect(r[0].dismissed).toBe(true);
    expect(r[1].dismissed).toBe(true);
  });

  /**
   * LA ASIMETRÍA DECLARADA: sin `documentoEnRevision` la prosa no puede
   * identificar nada —no hay con qué— pero LO TABULAR SIGUE MARCANDO, porque su
   * huella ya viene hecha y no necesita ese id.
   * Se prueba porque no es evidente y porque el caso hermano de la prosa («sin
   * id no marca nada») podría hacer pensar lo contrario del fichero entero.
   */
  it('sin id del documento en revisión, lo tabular sigue marcando y la prosa no', () => {
    const deProsa = huellaDeDescarte({ documentoEnRevision: DOC_NUEVO, coordenadas })!;
    const mezcla = [
      filaTabular,
      { topic: 'Días de vacaciones', newDocSays: CITA_NUEVA, existingDocSays: CITA_CORPUS, existingDocumentId: DOC_CORPUS } as GuardadaTabular,
    ];

    const r = marcarDescartadas(mezcla, {
      documentoEnRevision: undefined,
      descartes: new Set([HUELLA_TABULAR, deProsa]),
    });

    expect(r[0].dismissed).toBe(true);
    expect(r[1].dismissed).toBeUndefined();
  });
});

/**
 * LA ESPECIE, DECIDIDA EN UN SOLO SITIO (CLAUDE.md, F-89 P2).
 *
 * `registrarDescartes` tiene que escribirla en `kind` y NO PUEDE DEDUCIRLA: las
 * dos huellas son sha256 de 64 hex e indistinguibles. Así que la PREGUNTA a
 * quien la decidió. Esto comprueba que la respuesta existe y es la correcta por
 * las dos ramas — lo que se escribe en Supabase queda fuera del alcance de
 * Vitest y está declarado como no verificable aquí.
 */
describe('huellaSolicitada — devuelve también la especie', () => {
  const HUELLA_TABULAR = 'c'.repeat(64);

  it('la rama tabular se declara tabular', () => {
    const r = huellaSolicitada({
      tipo: 'tabular', huella: HUELLA_TABULAR, documentoEnRevision: DOC_NUEVO,
      existingDocumentId: undefined, newDocSays: undefined, existingDocSays: undefined,
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.especie).toBe('tabular');
  });

  it('la rama de prosa se declara prosa, y también cuando no viene tipo', () => {
    const comun = {
      huella: undefined, documentoEnRevision: DOC_NUEVO,
      existingDocumentId: DOC_CORPUS, newDocSays: CITA_NUEVA, existingDocSays: CITA_CORPUS,
    };

    const conTipo = huellaSolicitada({ ...comun, tipo: 'prosa' });
    const sinTipo = huellaSolicitada({ ...comun, tipo: undefined });

    expect(conTipo.ok && conTipo.especie).toBe('prosa');
    expect(sinTipo.ok && sinTipo.especie).toBe('prosa');
  });
});
