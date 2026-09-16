import { describe, it, expect } from 'vitest';
import { resumirCobertura } from './cobertura-de-candidatos';

describe('⚠️ EL CASO DECISIVO: si se descartan candidatos, el aviso APARECE', () => {
  it('diez afines y seis comparados → hay resto, y el resto son cuatro', () => {
    const r = resumirCobertura({ comparados: 6, afines: 10 });
    expect(r).not.toBeNull();
    expect(r!.hayResto).toBe(true);
    expect(r!.comparados).toBe(6);
    expect(r!.conMenorAfinidad).toBe(4);
  });

  it('es la pasada REAL del 14/09 — nueve afines, tope de seis', () => {
    const r = resumirCobertura({ comparados: 6, afines: 9 });
    expect(r!.hayResto).toBe(true);
    expect(r!.conMenorAfinidad).toBe(3);
  });

  it('⚠️ UN SOLO documento fuera YA enciende el aviso — el borde es 1, no «unos cuantos»', () => {
    const r = resumirCobertura({ comparados: 6, afines: 7 });
    expect(r!.hayResto).toBe(true);
    expect(r!.conMenorAfinidad).toBe(1);
  });
});

describe('cuándo NO hay resto — y el dato sigue calculado', () => {
  it('todos los afines se compararon: no hay resto', () => {
    const r = resumirCobertura({ comparados: 4, afines: 4 });
    expect(r).not.toBeNull();
    expect(r!.hayResto).toBe(false);
    expect(r!.conMenorAfinidad).toBe(0);
  });

  it('⚠️ PERO LA FRASE SIGUE AHÍ, con `comparados` — es la decisión que el director tiene pendiente', () => {
    // Enseñar «se compararon los N documentos afines» cuando no queda ninguno
    // fuera es lo único que se vería hoy en el corpus del director. La lógica
    // ya lo calcula; la condición de pintarlo vive en el componente.
    const r = resumirCobertura({ comparados: 2, afines: 2 });
    expect(r!.comparados).toBe(2);
    expect(r!.hayResto).toBe(false);
  });

  it('el caso de HOY en el corpus del director: uno o dos candidatos, sin resto', () => {
    expect(resumirCobertura({ comparados: 1, afines: 1 })!.hayResto).toBe(false);
    expect(resumirCobertura({ comparados: 2, afines: 2 })!.hayResto).toBe(false);
  });
});

describe('cuándo se calla del todo, y por qué callar es lo correcto', () => {
  it('sin dato no se inventa un cero — los análisis viejos no traen cobertura', () => {
    expect(resumirCobertura(undefined)).toBeNull();
  });

  it('cero comparados: de eso ya habla el propio resultado, no un aviso de alcance', () => {
    expect(resumirCobertura({ comparados: 0, afines: 0 })).toBeNull();
    expect(resumirCobertura({ comparados: 0, afines: 8 })).toBeNull();
  });

  it('un comparados negativo es un dato roto, no un aviso', () => {
    expect(resumirCobertura({ comparados: -1, afines: 5 })).toBeNull();
  });

  it('NaN e Infinity no producen una frase con un número imposible dentro', () => {
    expect(resumirCobertura({ comparados: NaN, afines: 5 })).toBeNull();
    expect(resumirCobertura({ comparados: 3, afines: NaN })).toBeNull();
    expect(resumirCobertura({ comparados: Infinity, afines: 5 })).toBeNull();
  });
});

describe('el resto nunca es negativo', () => {
  it('si afines fuera menor que comparados, el resto vale 0 y no «-3»', () => {
    // No puede pasar hoy —afines es lo que recuperó el retrieval y comparados
    // lo que llegó al juez— pero dejaría de ser cierto si alguien reordena las
    // etapas, y entonces el aviso diría una barbaridad en pantalla.
    const r = resumirCobertura({ comparados: 8, afines: 5 });
    expect(r!.conMenorAfinidad).toBe(0);
    expect(r!.hayResto).toBe(false);
  });
});

describe('no se toca lo que le pasan', () => {
  it('la entrada sigue igual después de resumir', () => {
    const entrada = { comparados: 6, afines: 10 };
    resumirCobertura(entrada);
    expect(entrada).toEqual({ comparados: 6, afines: 10 });
  });
});

// ════════════════════════════════════════════════════════════════════════
// LA REDACCIÓN, bajo prueba — desde que el aviso sale SIEMPRE (16/09/2026).
// El caso SIN RESTO no es el mismo texto con un cero, y por eso tiene sus
// propios casos: si alguien lo unifica, aquí se pone rojo.
// ════════════════════════════════════════════════════════════════════════

import { textoDeCobertura } from './cobertura-de-candidatos';

function texto(comparados: number, afines: number): string {
  const f = resumirCobertura({ comparados, afines });
  if (f === null) throw new Error('no deberia ser null en estos casos');
  return textoDeCobertura(f);
}

describe('⚠️ SIN RESTO: la frase tiene que decir que esos eran TODOS', () => {
  it('el caso de hoy en el corpus del director: dos y no hay mas', () => {
    expect(texto(2, 2)).toBe(
      'Se compararon los 2 documentos afines a éste, que eran todos los que había.',
    );
  });

  it('⚠️ NO se lee como si hubiera mas y no se dijera cuantos', () => {
    // La frase prohibida: «Se compararon los 2 documentos más afines a éste.»
    // a secas. Si alguien vuelve a ella, este caso cae.
    expect(texto(2, 2)).toContain('todos los que había');
    expect(texto(2, 2)).not.toContain('más afines');
    expect(texto(2, 2)).not.toContain('menor afinidad');
  });

  it('uno solo lleva SINGULAR — «los 1 documentos» mata la credibilidad del aviso', () => {
    expect(texto(1, 1)).toBe(
      'Se comparó con el único documento afín a éste que hay en tu corpus.',
    );
    expect(texto(1, 1)).not.toContain('los 1');
  });

  it('con seis y sin resto sigue diciendo que eran todos', () => {
    expect(texto(6, 6)).toContain('todos los que había');
  });
});

describe('CON RESTO: se compararon los más afines, y los otros tienen menos', () => {
  it('la pasada real del 14/09: seis de nueve', () => {
    expect(texto(6, 9)).toBe(
      'Se compararon los 6 documentos más afines a éste. ' +
      'Otros 3 tienen menor afinidad con este documento y no entraron en la comparación.',
    );
  });

  it('nunca dice «no se tuvieron en cuenta» — eso insinua descuido donde hubo ranking', () => {
    expect(texto(6, 10)).not.toContain('no se tuvieron en cuenta');
    expect(texto(6, 10)).toContain('menor afinidad');
  });

  it('un solo documento fuera va en SINGULAR', () => {
    expect(texto(6, 7)).toContain('Otro tiene menor afinidad');
    expect(texto(6, 7)).not.toContain('Otros 1');
  });

  it('un solo comparado y varios fuera: singular por delante, plural por detras', () => {
    const t = texto(1, 4);
    expect(t).toContain('Se comparó con el documento más afín a éste.');
    expect(t).toContain('Otros 3 tienen menor afinidad');
  });
});

describe('las dos frases NO son la misma con un numero distinto', () => {
  it('sin resto y con resto dicen cosas distintas, no variantes del mismo molde', () => {
    expect(texto(2, 2)).not.toEqual(texto(2, 5));
    // Y la diferencia no es cosmetica: una cierra el conjunto y la otra lo abre.
    expect(texto(2, 2)).toContain('todos');
    expect(texto(2, 5)).toContain('no entraron');
  });
});
