import { describe, it, expect } from 'vitest';
import { COUNTER_CATALOGUE, type PipelineCounters } from './counters';
import { contadoresDeRecuperacion, contadoresDelRerank } from './contadores-de-seleccion';
import { escribirContadoresDelReparto, repartoConModelo, repartoSinModelo } from './reparto-del-rerank';

/**
 * ⚠️ LA PROPIEDAD, NO LAS CLAVES — 18/09/2026.
 *
 * El caso del 15/09 vigilaba DOS claves por su nombre, así que no cubría a ninguna
 * de las nuevas. Esta batería vigila lo otro: que **toda** clave `seleccion.*` del
 * catálogo tenga emisor y salga **también en cero**. Si mañana entra una clave
 * nueva sin emisor, o un emisor deja de escribir la suya cuando vale 0, se pone
 * roja sin que nadie tenga que acordarse de añadir un caso.
 */

/** Todo a cero: el caso que el fallo del 15/09 hacía desaparecer. */
function emitidasEnCero(): PipelineCounters {
  const counters: PipelineCounters = {
    ...contadoresDeRecuperacion({ recuperados: 0, cortadosPorTope: 0 }),
    ...contadoresDelRerank({ seleccionados: 0, sinConfianza: 0 }),
  };
  escribirContadoresDelReparto(counters, repartoConModelo({
    recuperados: 0, elegidosPorElModelo: 0, idsNoReconocidos: 0, repetidos: 0, maxSelected: 6,
  }));
  return counters;
}

const CLAVES_DEL_CATALOGO = COUNTER_CATALOGUE.filter(c => c.startsWith('seleccion.'));

describe('⚠️ TODA clave `seleccion.*` del catálogo tiene emisor', () => {
  it('ninguna clave del catálogo se queda sin quien la escriba', () => {
    const emitidas = Object.keys(emitidasEnCero());
    const sinEmisor = CLAVES_DEL_CATALOGO.filter(c => !emitidas.includes(c));
    expect(sinEmisor, `claves del catálogo que nadie emite: ${sinEmisor.join(', ')}`).toEqual([]);
  });

  it('y ningún emisor escribe una clave que el catálogo no declare', () => {
    const emitidas = Object.keys(emitidasEnCero());
    const noDeclaradas = emitidas.filter(c => !CLAVES_DEL_CATALOGO.includes(c as never));
    expect(noDeclaradas).toEqual([]);
  });

  it('son OCHO: si el número cambia, el cambio pasa por aquí', () => {
    // ⚠️ Fueron NUEVE hasta el 23/09/2026. La que falta es
    // 'candidatos_perdidos_por_umbral', retirada con las dos constantes del
    // umbral. Esta cifra existe para que retirar o añadir una clave no se pueda
    // hacer en silencio — y ha hecho exactamente eso: se puso roja en la pasada
    // de la retirada.
    expect(CLAVES_DEL_CATALOGO).toHaveLength(8);
  });
});

describe('⚠️ EL CERO SE ESCRIBE — el fallo del 15/09, ahora vigilado por propiedad', () => {
  it('con todo a cero, las nueve claves están presentes y valen 0', () => {
    const counters = emitidasEnCero();
    for (const clave of CLAVES_DEL_CATALOGO) {
      expect(clave in counters, `${clave} ausente con todo a cero`).toBe(true);
      expect(counters[clave]).toBe(0);
    }
  });

  it('un valor distinto de cero viaja igual, sin perderse por el camino', () => {
    const counters: PipelineCounters = {
      ...contadoresDeRecuperacion({ recuperados: 9, cortadosPorTope: 1 }),
      ...contadoresDelRerank({ seleccionados: 4, sinConfianza: 1 }),
    };
    expect(counters['seleccion.candidatos_cortados_por_tope_de_recuperacion']).toBe(1);
    expect(counters['seleccion.candidatos_recuperados']).toBe(9);
  });
});

describe('⚠️ LA ÚNICA AUSENCIA LEGÍTIMA, y está declarada (B.254)', () => {
  it('en el fallback del rerank falta `descartados_por_criterio`, y sólo ésa', () => {
    const counters: PipelineCounters = {
      ...contadoresDeRecuperacion({ recuperados: 5, cortadosPorTope: 0 }),
      ...contadoresDelRerank({ seleccionados: 3, sinConfianza: 0 }),
    };
    escribirContadoresDelReparto(counters, repartoSinModelo({ recuperados: 5, seleccionadosPorScore: 3 }));

    const ausentes = CLAVES_DEL_CATALOGO.filter(c => !(c in counters));
    expect(ausentes).toEqual(['seleccion.candidatos_descartados_por_criterio']);
  });
});
