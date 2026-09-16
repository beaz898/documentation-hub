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
