import { describe, it, expect } from 'vitest';
import { resumirCobertura, textoDeCobertura, type CoberturaDeCandidatos } from './cobertura-de-candidatos';
import type { RepartoDelRerank } from './reparto-del-rerank';

/**
 * LA BATERÍA DEL AVISO, FILA POR FILA (§5.71). Cada fila de `textoDeCobertura`
 * tiene aquí su caso con la frase EXACTA: si alguien la cambia, lo cambia a
 * sabiendas. Y la fila 5 —la caída PARCIAL— tiene los suyos propios, porque es
 * la decisión que alguien simplificará dentro de seis meses.
 */

/** Reparto con modelo, con las cifras que importan al aviso. */
function conModelo(
  { tope = 0, criterio = 0, ids = 0 }: { tope?: number; criterio?: number; ids?: number },
): RepartoDelRerank {
  return {
    origen: 'modelo',
    recuperados: 0,
    elegidosPorElModelo: 0,
    descartadosPorCriterio: criterio,
    cortadosPorTope: tope,
    idsNoReconocidos: ids,
    repetidos: 0,
  };
}

const FALLBACK: RepartoDelRerank = { origen: 'fallback', recuperados: 0, seleccionadosPorScore: 0 };

function texto(cobertura: CoberturaDeCandidatos): string {
  const f = resumirCobertura(cobertura);
  if (f === null) throw new Error('no debería ser null en estos casos');
  return textoDeCobertura(f);
}

// ── FILA 1 · sin resto — NO CAMBIA, está en producción y funciona ─────────

describe('fila 1 · SIN RESTO: la frase dice que esos eran TODOS', () => {
  it('dos y no hay más', () => {
    expect(texto({ comparados: 2, afines: 2 })).toBe(
      'Se compararon los 2 documentos afines a éste, que eran todos los que había.',
    );
  });

  it('uno solo lleva SINGULAR', () => {
    expect(texto({ comparados: 1, afines: 1 })).toBe(
      'Se comparó con el único documento afín a éste que hay en tu corpus.',
    );
  });

  it('con reparto también: sin resto no hay causa que decir', () => {
    expect(texto({ comparados: 3, afines: 3, reparto: conModelo({}) })).toContain('todos los que había');
  });
});

// ── FILA 2 · sólo tope ────────────────────────────────────────────────────

describe('fila 2 · SÓLO TOPE: priorizó, y los otros no cupieron', () => {
  it('seis de nueve, tres cortados por el tope', () => {
    expect(texto({ comparados: 6, afines: 9, reparto: conModelo({ tope: 3 }) })).toBe(
      'Se compararon los 6 que el análisis priorizó de los 9 afines a éste. ' +
      'Otros 3 también se eligieron, con menor prioridad, y no cupieron.',
    );
  });

  it('uno cortado va en singular', () => {
    expect(texto({ comparados: 6, afines: 7, reparto: conModelo({ tope: 1 }) })).toBe(
      'Se compararon los 6 que el análisis priorizó de los 7 afines a éste. ' +
      'Otro también se eligió, con menor prioridad, y no cupo.',
    );
  });

  it('⚠️ YA NO DICE «más afines» NI «menor afinidad»: el corte ordena por confianza, no por parecido', () => {
    const t = texto({ comparados: 6, afines: 9, reparto: conModelo({ tope: 3 }) });
    expect(t).not.toContain('más afines');
    expect(t).not.toContain('menor afinidad');
  });
});

// ── FILA 3 · sólo criterio — EL CASO DEL DIRECTOR ────────────────────────

describe('fila 3 · SÓLO CRITERIO: se revisó y no se seleccionó', () => {
  it('⚠️ SU CORPUS: tres afines, dos comparados, el tercero por criterio', () => {
    expect(texto({ comparados: 2, afines: 3, reparto: conModelo({ criterio: 1 }) })).toBe(
      'Se compararon 2 de los 3 documentos afines a éste. ' +
      'El otro se revisó y no se seleccionó para esta comparación.',
    );
  });

  it('CLI-05 del 14/09: diez afines, cinco comparados, cinco por criterio', () => {
    expect(texto({ comparados: 5, afines: 10, reparto: conModelo({ criterio: 5 }) })).toBe(
      'Se compararon 5 de los 10 documentos afines a éste. ' +
      'Los otros 5 se revisaron y no se seleccionaron para esta comparación.',
    );
  });

  it('⚠️ NO juzga el documento: nada de «contenido comparable» ni de afinidad', () => {
    const t = texto({ comparados: 2, afines: 3, reparto: conModelo({ criterio: 1 }) });
    expect(t).not.toContain('comparable');
    expect(t).not.toContain('afinidad');
    expect(t).not.toContain('priorizó');
  });

  it('un solo comparado en singular', () => {
    expect(texto({ comparados: 1, afines: 4, reparto: conModelo({ criterio: 3 }) })).toBe(
      'Se comparó con 1 de los 4 documentos afines a éste. ' +
      'Los otros 3 se revisaron y no se seleccionaron para esta comparación.',
    );
  });
});

// ── FILA 4 · mixto ────────────────────────────────────────────────────────

describe('fila 4 · MIXTO: las dos causas, desglosadas', () => {
  it('seis de diez: tres por tope y uno por criterio', () => {
    expect(texto({ comparados: 6, afines: 10, reparto: conModelo({ tope: 3, criterio: 1 }) })).toBe(
      'Se compararon los 6 que el análisis priorizó de los 10 afines a éste. ' +
      'De los otros 4, 3 también se eligieron, con menor prioridad, y no cupieron; 1 se revisó y no se seleccionó.',
    );
  });

  it('singular por un lado y plural por el otro', () => {
    expect(texto({ comparados: 6, afines: 9, reparto: conModelo({ tope: 1, criterio: 2 }) })).toBe(
      'Se compararon los 6 que el análisis priorizó de los 9 afines a éste. ' +
      'De los otros 3, 1 también se eligió, con menor prioridad, y no cupo; 2 se revisaron y no se seleccionaron.',
    );
  });
});

// ── FILA 5 · la caída PARCIAL — la decisión que alguien simplificará ────

describe('⚠️ fila 5 · CAÍDA PARCIAL: el tope se sigue explicando, y sólo se calla el criterio', () => {
  it('ids no reconocidos: tres por tope se explican, el resto va sin causa', () => {
    expect(texto({ comparados: 6, afines: 10, reparto: conModelo({ tope: 3, criterio: 1, ids: 1 }) })).toBe(
      'Se compararon los 6 que el análisis priorizó de los 10 afines a éste. ' +
      'Otros 3 también se eligieron, con menor prioridad, y no cupieron. Otro más tampoco entró.',
    );
  });

  it('⚠️ SI CAYERA ENTERA a la fila 6, se perdería la parte del tope — y aquí cae', () => {
    const t = texto({ comparados: 6, afines: 11, reparto: conModelo({ tope: 3, criterio: 2, ids: 1 }) });
    expect(t).toContain('no cupieron');
    expect(t).toContain('Otros 2 más tampoco entraron.');
    expect(t).not.toContain('se revisaron');
  });

  it('un reparto que NO CUADRA con la cobertura tampoco respalda el criterio', () => {
    // tope 2 + criterio 5 = 7, pero fuera hay 4: el criterio no describe esto.
    expect(texto({ comparados: 6, afines: 10, reparto: conModelo({ tope: 2, criterio: 5 }) })).toBe(
      'Se compararon los 6 que el análisis priorizó de los 10 afines a éste. ' +
      'Otros 2 también se eligieron, con menor prioridad, y no cupieron. Otros 2 más tampoco entraron.',
    );
  });

  it('con ids no reconocidos pero TODO lo de fuera explicado por el tope, es la fila 2', () => {
    expect(texto({ comparados: 6, afines: 9, reparto: conModelo({ tope: 3, ids: 2 }) })).toBe(
      'Se compararon los 6 que el análisis priorizó de los 9 afines a éste. ' +
      'Otros 3 también se eligieron, con menor prioridad, y no cupieron.',
    );
  });
});

// ── FILA 6 · sin causa ────────────────────────────────────────────────────

describe('fila 6 · SIN CAUSA: dice qué pasó y nada más', () => {
  it('⚠️ ANÁLISIS VIEJO sin reparto: deja de afirmar «menor afinidad»', () => {
    expect(texto({ comparados: 6, afines: 9 })).toBe(
      'Se compararon 6 de los 9 documentos afines a éste. Los otros 3 no entraron en esta comparación.',
    );
  });

  it('fallback del rerank: no hubo criterio que decir', () => {
    expect(texto({ comparados: 3, afines: 8, reparto: FALLBACK })).toBe(
      'Se compararon 3 de los 8 documentos afines a éste. Los otros 5 no entraron en esta comparación.',
    );
  });

  it('ids no reconocidos y sin tope: nada que explicar', () => {
    expect(texto({ comparados: 2, afines: 3, reparto: conModelo({ criterio: 1, ids: 1 }) })).toBe(
      'Se compararon 2 de los 3 documentos afines a éste. El otro no entró en esta comparación.',
    );
  });

  it('un tope que no cabe en lo que falta no se cree', () => {
    expect(texto({ comparados: 6, afines: 8, reparto: conModelo({ tope: 5, ids: 1 }) })).toBe(
      'Se compararon 6 de los 8 documentos afines a éste. Los otros 2 no entraron en esta comparación.',
    );
  });
});

// ── EL RESUMEN: formas y bordes ───────────────────────────────────────────

describe('resumirCobertura — qué forma sale', () => {
  it('las tres formas, cada una con su caso', () => {
    expect(resumirCobertura({ comparados: 2, afines: 2 })!.fuera).toEqual({ forma: 'sin_resto' });
    expect(resumirCobertura({ comparados: 2, afines: 3, reparto: conModelo({ criterio: 1 }) })!.fuera)
      .toEqual({ forma: 'causas', porTope: 0, porCriterio: 1 });
    expect(resumirCobertura({ comparados: 2, afines: 3 })!.fuera)
      .toEqual({ forma: 'parcial', porTope: 0, sinCausa: 1 });
  });

  it('el total de fuera nunca es negativo', () => {
    const r = resumirCobertura({ comparados: 8, afines: 5 });
    expect(r!.totalFuera).toBe(0);
    expect(r!.fuera).toEqual({ forma: 'sin_resto' });
  });
});

describe('cuándo se calla del todo', () => {
  it('sin dato no se inventa un cero', () => {
    expect(resumirCobertura(undefined)).toBeNull();
  });

  it('cero comparados: de eso ya habla el resultado', () => {
    expect(resumirCobertura({ comparados: 0, afines: 0 })).toBeNull();
    expect(resumirCobertura({ comparados: 0, afines: 8 })).toBeNull();
  });

  it('un comparados negativo es un dato roto', () => {
    expect(resumirCobertura({ comparados: -1, afines: 5 })).toBeNull();
  });

  it('NaN e Infinity no producen una frase con un número imposible', () => {
    expect(resumirCobertura({ comparados: NaN, afines: 5 })).toBeNull();
    expect(resumirCobertura({ comparados: 3, afines: NaN })).toBeNull();
    expect(resumirCobertura({ comparados: Infinity, afines: 5 })).toBeNull();
  });

  it('no toca lo que le pasan', () => {
    const entrada = { comparados: 6, afines: 10, reparto: conModelo({ tope: 4 }) };
    const copia = JSON.parse(JSON.stringify(entrada));
    resumirCobertura(entrada);
    expect(entrada).toEqual(copia);
  });
});

describe('ninguna frase afirma «más afines» ni «menor afinidad», en ninguna fila', () => {
  it('recorrido por las seis', () => {
    const casos: CoberturaDeCandidatos[] = [
      { comparados: 2, afines: 2 },
      { comparados: 6, afines: 9, reparto: conModelo({ tope: 3 }) },
      { comparados: 2, afines: 3, reparto: conModelo({ criterio: 1 }) },
      { comparados: 6, afines: 10, reparto: conModelo({ tope: 3, criterio: 1 }) },
      { comparados: 6, afines: 10, reparto: conModelo({ tope: 3, criterio: 1, ids: 1 }) },
      { comparados: 6, afines: 9 },
    ];
    for (const c of casos) {
      const t = texto(c);
      expect(t).not.toContain('más afines');
      expect(t).not.toContain('menor afinidad');
    }
  });
});
