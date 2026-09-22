import { describe, expect, it } from 'vitest';

import {
  termometroNoRecuperado,
  termometroDeLaRecuperacion,
  scoresDeLosUnicos,
  elRepartoCuadra,
  candidatosFueraDelFondo,
  MOTIVO_DUPLICADO_EXACTO,
  CUBOS_DEL_HISTOGRAMA,
  type DenominadoresDelTermometro,
  type MedidaDeLaRecuperacion,
} from './termometro';
import { EMBEDDING_MODEL, EMBEDDING_DIMENSION } from '@/lib/embeddings';

/**
 * ⚠️ EL TERMÓMETRO — F-114.
 *
 * Lo que estos casos vigilan no es aritmética: es que las tres situaciones sean
 * DISTINGUIBLES en la base y que el reparto CUADRE. Hoy «no se recuperó» y «se
 * recuperó y no había nada» son el mismo silencio, y ése es el fallo que este
 * objeto cierra.
 */

const SELLO = { pedido: EMBEDDING_MODEL, servido: 'multilingual-e5-large', dimension_servida: 1024 };

/** El fantasma de F-115, con su id real: CLI-05, borrado y servido igual. */
const FANTASMA = 'c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6';

/** Un reparto que cuadra, para partir de él y romperlo a propósito. */
function denominadores(extra: Partial<DenominadoresDelTermometro> = {}): DenominadoresDelTermometro {
  const base: DenominadoresDelTermometro = {
    crudos: 125,
    sin_fila_viva: 0,
    descartados_umbral: 0,
    sin_metadata_utilizable: 0,
    propios_excluidos: 20,
    generacion_muerta_excluida: 0,
    candidatos_con_repeticion: 105,
    unicos: 44,
  };
  return { ...base, ...extra };
}

function medida(extra: Partial<MedidaDeLaRecuperacion> = {}): MedidaDeLaRecuperacion {
  return {
    consultas: 5,
    topK: 25,
    denominadores: denominadores(),
    fondo: 67,
    fondo_motivo: null,
    maximosPorDocumento: [0.864, 0.827],
    scoresUnicos: [0.796, 0.81, 0.827, 0.835, 0.864],
    modelo: SELLO,
    idsSinFilaViva: [],
    candidatosFueraDelFondo: [],
    ...extra,
  };
}

describe('⚠️ EL CUADRE — SEIS términos, y el total es lo que Pinecone devolvió', () => {
  it('un reparto real cuadra: 0 + 0 + 0 + 20 + 0 + 105 = 125', () => {
    expect(elRepartoCuadra(denominadores())).toBe(true);
  });

  /**
   * ⚠️ CASO DECISIVO. Cada término tiene que estar en la suma: si se olvida uno,
   * el cuadre deja de cerrar. Se rompe UNO A UNO, y los SEIS tienen que
   * romperlo — así el día que alguien añada un descarte nuevo sin contarlo, esto
   * se pone rojo en vez de dejar una identidad que no cuadra.
   *
   * ⚠️ `sin_fila_viva` entró el 22/09/2026 (F-115) y está aquí por lo mismo: sin
   * él en la suma, seis fragmentos de un documento borrado desaparecerían del
   * reparto y el cuadre seguiría cerrando — que es exactamente cómo la
   * contaminación pasó inadvertida en la matriz del 21/09.
   */
  it('⚠️ mover CUALQUIERA de los seis términos rompe el cuadre', () => {
    expect(elRepartoCuadra(denominadores({ sin_fila_viva: 1 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ descartados_umbral: 1 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ sin_metadata_utilizable: 1 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ propios_excluidos: 19 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ generacion_muerta_excluida: 1 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ candidatos_con_repeticion: 104 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ crudos: 126 }))).toBe(false);
  });

  it('un reparto con los seis términos a la vez cuadra igual', () => {
    expect(elRepartoCuadra({
      crudos: 100,
      sin_fila_viva: 6,
      descartados_umbral: 7,
      sin_metadata_utilizable: 3,
      propios_excluidos: 25,
      generacion_muerta_excluida: 5,
      candidatos_con_repeticion: 54,
      unicos: 30,
    })).toBe(true);
  });

  it('⚠️ `unicos` NUNCA puede superar a `candidatos_con_repeticion`: el dedup sólo quita', () => {
    expect(elRepartoCuadra(denominadores({ unicos: 106 }))).toBe(false);
    // Y el borde: igual sí vale — un análisis sin ni una repetición.
    expect(elRepartoCuadra(denominadores({ unicos: 105 }))).toBe(true);
  });

  it('todo a cero cuadra: es un análisis que no recuperó nada, no un fallo', () => {
    expect(elRepartoCuadra({
      crudos: 0, sin_fila_viva: 0, descartados_umbral: 0, sin_metadata_utilizable: 0,
      propios_excluidos: 0, generacion_muerta_excluida: 0, candidatos_con_repeticion: 0, unicos: 0,
    })).toBe(true);
  });
});

describe('⚠️ LOS TRES ESTADOS, distinguibles en la base', () => {
  it('con fondo y candidatos: `con_candidatos`, con todo relleno', () => {
    const t = termometroDeLaRecuperacion(medida());
    expect(t.estado).toBe('con_candidatos');
    expect(t.motivo).toBeNull();
    expect(t.fondo).toBe(67);
    expect(t.documentos_candidatos).toBe(2);
    expect(t.scores).not.toBeNull();
    expect(t.denominadores).not.toBeNull();
  });

  it('⚠️ con fondo 0: `fondo_vacio` — no había con qué comparar, y no es lo mismo', () => {
    const t = termometroDeLaRecuperacion(medida({
      fondo: 0,
      maximosPorDocumento: [],
      scoresUnicos: [],
      denominadores: denominadores({
        crudos: 0, propios_excluidos: 0, candidatos_con_repeticion: 0, unicos: 0,
      }),
    }));
    expect(t.estado).toBe('fondo_vacio');
    expect(t.fondo).toBe(0);
    expect(t.scores).toBeNull();
    // ⚠️ Y los denominadores SIGUEN escritos: son ceros medidos, no ausencia.
    expect(t.denominadores).not.toBeNull();
    expect(t.denominadores!.crudos).toBe(0);
  });

  it('⚠️ sin recuperar: `no_recuperado`, con el predicado LITERAL y todo a null', () => {
    const t = termometroNoRecuperado(MOTIVO_DUPLICADO_EXACTO);
    expect(t.estado).toBe('no_recuperado');
    expect(t.motivo).toBe('corte por hash: isDuplicateExact');
    expect(t.consultas).toBeNull();
    expect(t.topK).toBeNull();
    expect(t.denominadores).toBeNull();
    expect(t.fondo).toBeNull();
    expect(t.documentos_candidatos).toBeNull();
    expect(t.scores).toBeNull();
    // ⚠️ Las dos listas de F-115 van VACÍAS, no `null`: no hubo recuperación, así
    // que no hubo nada que descartar. `estado` ya dice que no se recuperó.
    expect(t.ids_sin_fila_viva).toEqual([]);
    expect(t.candidatos_fuera_del_fondo).toEqual([]);
    // El sello del modelo se escribe igual: lo PEDIDO se sabe siempre.
    expect(t.modelo.pedido).toBe(EMBEDDING_MODEL);
    expect(t.modelo.servido).toBeNull();
    expect(t.modelo.dimension_servida).toBeNull();
  });

  it('⚠️ los tres estados son valores DISTINTOS: ninguno se confunde con otro', () => {
    const estados = [
      termometroDeLaRecuperacion(medida()).estado,
      termometroDeLaRecuperacion(medida({ fondo: 0 })).estado,
      termometroNoRecuperado(MOTIVO_DUPLICADO_EXACTO).estado,
    ];
    expect(new Set(estados).size).toBe(3);
  });

  it('un fondo que no se pudo leer es null CON motivo, y no tumba el estado', () => {
    const t = termometroDeLaRecuperacion(medida({ fondo: null, fondo_motivo: 'no se pudo leer la lista' }));
    // Se recuperó, así que sigue siendo `con_candidatos`: el fondo es un
    // denominador que falta, no una razón para decir que no se recuperó.
    expect(t.estado).toBe('con_candidatos');
    expect(t.fondo).toBeNull();
    expect(t.fondo_motivo).toBe('no se pudo leer la lista');
  });
});

describe('⚠️ F-115 — LA REGLA NUEVA: todo candidato pertenece al fondo', () => {
  const FONDO = new Set(['cli-04', 'ope-11']);

  it('los candidatos del fondo no producen ningún hallazgo', () => {
    expect(candidatosFueraDelFondo(['cli-04', 'ope-11'], FONDO, true)).toEqual([]);
  });

  /**
   * ⚠️ CASO DECISIVO, Y ES EL CASO REAL DEL 21/09/2026: el análisis de MKT-01
   * devolvió TRES candidatos con un fondo que sólo daba para dos. El tercero era
   * CLI-05, borrado. Sin esta comprobación, los tres pasaban por normales — y
   * pasaron: lo destapó que alguien leyera el log.
   */
  it('⚠️ un candidato que el índice sirve y la base no cuenta SALE NOMBRADO', () => {
    expect(candidatosFueraDelFondo(['cli-04', 'ope-11', FANTASMA], FONDO, true))
      .toEqual([FANTASMA]);
  });

  it('no se repite un candidato aunque llegue dos veces', () => {
    expect(candidatosFueraDelFondo([FANTASMA, FANTASMA], FONDO, true)).toEqual([FANTASMA]);
  });

  it('con el fondo VACÍO medido, todos los candidatos están fuera', () => {
    expect(candidatosFueraDelFondo(['cli-04'], new Set(), true)).toEqual(['cli-04']);
  });

  /**
   * ⚠️ Y CON EL FONDO NO MEDIDO NO SE INVENTA UN HALLAZGO. Es la regla del cero:
   * sin fondo no hay conjunto al que pertenecer, y contestar «todos son ajenos»
   * convertiría un fallo de lectura de la base en una acusación al índice.
   */
  it('⚠️ fondo NO medido → lista vacía, no «todos fuera»', () => {
    expect(candidatosFueraDelFondo(['cli-04', FANTASMA], new Set(), false)).toEqual([]);
  });

  it('los dos campos viajan al termómetro tal como llegan', () => {
    const t = termometroDeLaRecuperacion(medida({
      idsSinFilaViva: [`${FANTASMA}-g2-0`, `${FANTASMA}-g2-1`],
      candidatosFueraDelFondo: [FANTASMA],
    }));
    expect(t.ids_sin_fila_viva).toHaveLength(2);
    expect(t.candidatos_fuera_del_fondo).toEqual([FANTASMA]);
  });
});

describe('los scores: extremos, histograma y hueco', () => {
  it('el histograma tiene 20 cubos y suma los fragmentos únicos', () => {
    const s = scoresDeLosUnicos([0.796, 0.81, 0.827, 0.835, 0.864], [0.864, 0.827])!;
    expect(s.histograma).toHaveLength(CUBOS_DEL_HISTOGRAMA);
    expect(s.histograma).toHaveLength(20);
    expect(s.histograma.reduce((a, b) => a + b, 0)).toBe(5);
    expect(s.minimo).toBeCloseTo(0.796);
    expect(s.maximo).toBeCloseTo(0.864);
  });

  it('el hueco es el máximo del 1.º menos el del 2.º, ordenados', () => {
    expect(scoresDeLosUnicos([0.5], [0.9, 0.4])!.hueco_1_2).toBeCloseTo(0.5);
    // Desordenados da lo mismo: la función ordena.
    expect(scoresDeLosUnicos([0.5], [0.4, 0.9])!.hueco_1_2).toBeCloseTo(0.5);
  });

  it('⚠️ el hueco es NULL con 0 o 1 documentos: un 0 diría que los dos primeros empatan', () => {
    expect(scoresDeLosUnicos([0.8], [])!.hueco_1_2).toBeNull();
    expect(scoresDeLosUnicos([0.8], [0.8])!.hueco_1_2).toBeNull();
    // Con dos, ya hay hueco — aunque sea cero de verdad.
    expect(scoresDeLosUnicos([0.8], [0.8, 0.8])!.hueco_1_2).toBe(0);
  });

  it('sin ni un fragmento único, los scores son AUSENTES, no ceros', () => {
    expect(scoresDeLosUnicos([], [])).toBeNull();
    expect(scoresDeLosUnicos([NaN, Infinity], [0.9])).toBeNull();
  });
});

describe('la forma del objeto', () => {
  it('⚠️ version = 1 en los tres caminos: sin versión no se puede migrar', () => {
    expect(termometroDeLaRecuperacion(medida()).version).toBe(1);
    expect(termometroDeLaRecuperacion(medida({ fondo: 0 })).version).toBe(1);
    expect(termometroNoRecuperado(MOTIVO_DUPLICADO_EXACTO).version).toBe(1);
  });

  it('⚠️ NI UN TEXTO NI UN NOMBRE DE DOCUMENTO: sólo números y el modelo', () => {
    // Se recorren los VALORES, no el JSON en crudo: los nombres de las claves
    // también son cadenas entre comillas, y mirar el texto plano las contaría.
    const valores: string[] = [];
    const recorrer = (v: unknown): void => {
      if (typeof v === 'string') { valores.push(v); return; }
      if (Array.isArray(v)) { v.forEach(recorrer); return; }
      if (v !== null && typeof v === 'object') { Object.values(v).forEach(recorrer); }
    };
    recorrer(termometroDeLaRecuperacion(medida({
      // ⚠️ CON LOS DOS CAMPOS DE F-115 LLENOS, porque vacíos no prueban nada: lo
      // que hay que vigilar es que lo que entre por ahí sean IDS y no nombres.
      idsSinFilaViva: [`${FANTASMA}-g2-3`],
      candidatosFueraDelFondo: [FANTASMA],
    })));

    // El vocabulario ADMITIDO, completo: los tres estados, el motivo y los dos
    // nombres de modelo. Cualquier otra cadena sería un dato del cliente.
    const admitidas = new Set<string>([
      'con_candidatos', 'fondo_vacio', 'no_recuperado',
      MOTIVO_DUPLICADO_EXACTO, EMBEDDING_MODEL, SELLO.servido,
    ]);
    // ⚠️ Y LA ÚNICA FAMILIA ABIERTA: los ids. Un uuid —con su sufijo de
    // generación y trozo— no es un dato del cliente; el NOMBRE de un documento
    // sí, y por eso esta forma se comprueba en vez de admitir cualquier cadena.
    const formaDeId = /^[0-9a-f-]{36}(-g\d+)?(-\d+)?$/;
    for (const v of valores) {
      const vale = admitidas.has(v) || formaDeId.test(v);
      expect(vale, `cadena no admitida en el termómetro: "${v}"`).toBe(true);
    }
    // Control positivo de la forma: un nombre de documento NO la pasa.
    expect(formaDeId.test('CLI-05_radiologia-proteccion-radiologica.txt')).toBe(false);
    // Control positivo: si el vocabulario no vigilara nada, esto pasaría igual.
    expect(valores.length).toBeGreaterThan(0);
  });

  it('la dimensión servida es la REAL, y la constante es con lo que se compara', () => {
    const t = termometroDeLaRecuperacion(medida());
    expect(t.modelo.dimension_servida).toBe(EMBEDDING_DIMENSION);
    // Y si un día difieren, el termómetro conserva la diferencia en vez de taparla.
    const raro = termometroDeLaRecuperacion(medida({
      modelo: { pedido: EMBEDDING_MODEL, servido: 'otro-modelo', dimension_servida: 768 },
    }));
    expect(raro.modelo.dimension_servida).toBe(768);
    expect(raro.modelo.servido).toBe('otro-modelo');
  });
});
