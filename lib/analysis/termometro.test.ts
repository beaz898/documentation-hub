import { describe, expect, it } from 'vitest';

import {
  termometroNoRecuperado,
  termometroDeLaRecuperacion,
  scoresDeLosUnicos,
  elRepartoCuadra,
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

/** Un reparto que cuadra, para partir de él y romperlo a propósito. */
function denominadores(extra: Partial<DenominadoresDelTermometro> = {}): DenominadoresDelTermometro {
  const base: DenominadoresDelTermometro = {
    crudos: 125,
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
    ...extra,
  };
}

describe('⚠️ EL CUADRE — cinco términos, y el total es lo que Pinecone devolvió', () => {
  it('un reparto real cuadra: 0 + 0 + 20 + 0 + 105 = 125', () => {
    expect(elRepartoCuadra(denominadores())).toBe(true);
  });

  /**
   * ⚠️ CASO DECISIVO. Cada término tiene que estar en la suma: si se olvida uno,
   * el cuadre deja de cerrar. Se rompe UNO A UNO, y los cinco tienen que
   * romperlo — así el día que alguien añada un descarte nuevo sin contarlo, esto
   * se pone rojo en vez de dejar una identidad que no cuadra.
   */
  it('⚠️ mover CUALQUIERA de los cinco términos rompe el cuadre', () => {
    expect(elRepartoCuadra(denominadores({ descartados_umbral: 1 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ sin_metadata_utilizable: 1 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ propios_excluidos: 19 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ generacion_muerta_excluida: 1 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ candidatos_con_repeticion: 104 }))).toBe(false);
    expect(elRepartoCuadra(denominadores({ crudos: 126 }))).toBe(false);
  });

  it('un reparto con los cinco términos a la vez cuadra igual', () => {
    expect(elRepartoCuadra({
      crudos: 100,
      descartados_umbral: 7,
      sin_metadata_utilizable: 3,
      propios_excluidos: 25,
      generacion_muerta_excluida: 5,
      candidatos_con_repeticion: 60,
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
      crudos: 0, descartados_umbral: 0, sin_metadata_utilizable: 0, propios_excluidos: 0,
      generacion_muerta_excluida: 0, candidatos_con_repeticion: 0, unicos: 0,
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
    recorrer(termometroDeLaRecuperacion(medida()));

    // El vocabulario ADMITIDO, completo: los tres estados, el motivo y los dos
    // nombres de modelo. Cualquier otra cadena sería un dato del cliente.
    const admitidas = new Set<string>([
      'con_candidatos', 'fondo_vacio', 'no_recuperado',
      MOTIVO_DUPLICADO_EXACTO, EMBEDDING_MODEL, SELLO.servido,
    ]);
    for (const v of valores) {
      expect(admitidas.has(v), `cadena no admitida en el termómetro: "${v}"`).toBe(true);
    }
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
