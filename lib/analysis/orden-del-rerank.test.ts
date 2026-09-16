import { describe, it, expect } from 'vitest';
import { ordenarParaCortar, normalizarConfianza, contarSinConfianza } from './orden-del-rerank';
import type { RerankedCandidate, DocumentFragment } from './types';

const MAX_SELECTED_QUICK = 6;

function frag(score: number): DocumentFragment {
  return {
    documentId: 'x', documentName: 'X', chunkIndex: 0, text: 't', score,
  } as DocumentFragment;
}

function cand(
  documentId: string,
  rerankConfidence: RerankedCandidate['rerankConfidence'],
  score = 0.9,
): RerankedCandidate {
  return {
    documentId,
    documentName: documentId.toUpperCase(),
    source: 'manual',
    fragments: [frag(score)],
    rerankReason: '',
    rerankConfidence,
  };
}

const ids = (cs: RerankedCandidate[]) => cs.map(c => c.documentId);

describe('⚠️ EL CASO DECISIVO DEL TOPE DE 6', () => {
  /**
   * Siete candidatos DESORDENADOS a propósito: las altas van al final de la
   * lista, que es como llegarían si el modelo las enumerase así.
   *
   * Con el comportamiento de hasta el 16/09 —`slice(0, 6)` sobre el orden de
   * enumeración— entrarían `b1..b4` y `m1..m2`, y las tres `alta` se caerían.
   */
  const SIETE_DESORDENADOS = [
    cand('b1', 'baja'),
    cand('b2', 'baja'),
    cand('b3', 'baja'),
    cand('b4', 'baja'),
    cand('m1', 'media'),
    cand('a1', 'alta'),
    cand('a2', 'alta'),
  ];

  it('entran las DOS altas y la media, no los cuatro bajas que iban delante', () => {
    const cortados = ordenarParaCortar(SIETE_DESORDENADOS).slice(0, MAX_SELECTED_QUICK);
    expect(cortados).toHaveLength(6);
    // Las tres que importan entran, y entran las primeras.
    expect(ids(cortados).slice(0, 3)).toEqual(['a1', 'a2', 'm1']);
    // Y el que se cae es un `baja`, no un `alta`.
    expect(ids(cortados)).not.toContain('b4');
  });

  it('⚠️ EL MUTANTE QUE ESTO DEBE MATAR: volver al orden de enumeración', () => {
    // Esto es EXACTAMENTE lo que hacía el código hasta el 16/09. Se escribe aquí
    // para que el caso decisivo se pueda leer al lado de lo que descarta.
    const comoAntes = SIETE_DESORDENADOS.slice(0, MAX_SELECTED_QUICK);
    const ahora = ordenarParaCortar(SIETE_DESORDENADOS).slice(0, MAX_SELECTED_QUICK);

    expect(ids(comoAntes)).not.toEqual(ids(ahora));
    // El viejo tiraba una `alta`; el nuevo no tira ninguna.
    expect(ids(comoAntes)).not.toContain('a2');
    expect(ids(ahora)).toContain('a2');
  });

  it('con seis o menos no cambia nada: todos entran, ordenar no puede perder a nadie', () => {
    const seis = SIETE_DESORDENADOS.slice(0, 6);
    const cortados = ordenarParaCortar(seis).slice(0, MAX_SELECTED_QUICK);
    expect(ids(cortados).sort()).toEqual(ids(seis).sort());
  });
});

describe('los tres criterios, en su orden', () => {
  it('1 · la confianza manda sobre el score', () => {
    const r = ordenarParaCortar([
      cand('scoreAlto', 'baja', 0.99),
      cand('confianzaAlta', 'alta', 0.51),
    ]);
    expect(ids(r)).toEqual(['confianzaAlta', 'scoreAlto']);
  });

  it('2 · a igual confianza desempata el mejor score', () => {
    const r = ordenarParaCortar([
      cand('flojo', 'media', 0.61),
      cand('fuerte', 'media', 0.95),
    ]);
    expect(ids(r)).toEqual(['fuerte', 'flojo']);
  });

  it('2b · el score es el MEJOR fragmento, no el primero', () => {
    const conVarios: RerankedCandidate = {
      ...cand('varios', 'media'),
      fragments: [frag(0.51), frag(0.97), frag(0.60)],
    };
    const r = ordenarParaCortar([cand('otro', 'media', 0.80), conVarios]);
    expect(ids(r)).toEqual(['varios', 'otro']);
  });

  it('3 · a igual confianza y score desempata el id, y es determinista', () => {
    const r1 = ordenarParaCortar([cand('zeta', 'alta', 0.9), cand('alfa', 'alta', 0.9)]);
    const r2 = ordenarParaCortar([cand('alfa', 'alta', 0.9), cand('zeta', 'alta', 0.9)]);
    expect(ids(r1)).toEqual(['alfa', 'zeta']);
    // ⚠️ LO QUE DE VERDAD SE PRUEBA: el resultado NO depende del orden de
    // entrada. Es lo que el orden de enumeración no podía garantizar.
    expect(ids(r1)).toEqual(ids(r2));
  });

  it('un candidato sin fragmentos vale score 0 y va al final, no a un sitio indefinido', () => {
    const sinFrags: RerankedCandidate = { ...cand('vacio', 'media'), fragments: [] };
    const r = ordenarParaCortar([sinFrags, cand('conFrags', 'media', 0.51)]);
    expect(ids(r)).toEqual(['conFrags', 'vacio']);
  });
});

describe('⚠️ «no lo dijo» no es «dijo media»', () => {
  it('sin_declarar va DESPUES de baja, no en medio', () => {
    const r = ordenarParaCortar([
      cand('mudo', 'sin_declarar', 0.99),
      cand('baja', 'baja', 0.51),
    ]);
    expect(ids(r)).toEqual(['baja', 'mudo']);
  });

  it('y por tanto es el primero en caerse por el tope', () => {
    const siete = [
      cand('mudo', 'sin_declarar', 0.99),
      cand('a', 'alta'), cand('b', 'alta'), cand('c', 'alta'),
      cand('d', 'media'), cand('e', 'media'), cand('f', 'baja'),
    ];
    const cortados = ordenarParaCortar(siete).slice(0, MAX_SELECTED_QUICK);
    expect(ids(cortados)).not.toContain('mudo');
  });

  it('⚠️ SI SE COLAPSARA EN `media` DESPLAZARIA A UNA MEDIA REAL — el caso que lo prueba', () => {
    // Siete candidatos: tres altas, tres medias declaradas y un mudo con el
    // mejor score de todos. Con `sin_declarar` el mudo se cae. Si alguien lo
    // tratase como `media`, su score de 0,99 lo pondria por delante de las tres
    // medias reales y tiraria una.
    const siete = [
      cand('a1', 'alta'), cand('a2', 'alta'), cand('a3', 'alta'),
      cand('m1', 'media', 0.80), cand('m2', 'media', 0.75), cand('m3', 'media', 0.70),
      cand('mudo', 'sin_declarar', 0.99),
    ];
    const cortados = ids(ordenarParaCortar(siete).slice(0, MAX_SELECTED_QUICK));
    expect(cortados).toEqual(['a1', 'a2', 'a3', 'm1', 'm2', 'm3']);
    expect(cortados).not.toContain('mudo');
  });
});

describe('normalizarConfianza — no se adivina lo que el modelo no dijo', () => {
  it('conserva los tres niveles acordados', () => {
    expect(normalizarConfianza('alta')).toBe('alta');
    expect(normalizarConfianza('media')).toBe('media');
    expect(normalizarConfianza('baja')).toBe('baja');
  });

  it('ausente, vacio y null son sin_declarar — NO media', () => {
    expect(normalizarConfianza(undefined)).toBe('sin_declarar');
    expect(normalizarConfianza('')).toBe('sin_declarar');
    expect(normalizarConfianza(null)).toBe('sin_declarar');
  });

  it('una palabra inventada NO se traduce al nivel mas parecido', () => {
    expect(normalizarConfianza('muy alta')).toBe('sin_declarar');
    expect(normalizarConfianza('ALTA')).toBe('sin_declarar');
    expect(normalizarConfianza('high')).toBe('sin_declarar');
  });

  it('un numero tampoco', () => {
    expect(normalizarConfianza(3)).toBe('sin_declarar');
    expect(normalizarConfianza(0.9)).toBe('sin_declarar');
  });
});

describe('contarSinConfianza — el contador que impide que el arreglo se apague en silencio', () => {
  it('cuenta los mudos y nada mas', () => {
    expect(contarSinConfianza([
      cand('a', 'alta'), cand('m', 'sin_declarar'), cand('n', 'sin_declarar'), cand('b', 'baja'),
    ])).toBe(2);
  });

  it('cero cuando todos declararon — y el cero es la noticia buena', () => {
    expect(contarSinConfianza([cand('a', 'alta'), cand('b', 'baja')])).toBe(0);
  });

  it('lista vacia da cero, no revienta', () => {
    expect(contarSinConfianza([])).toBe(0);
  });

  it('⚠️ EL REGIMEN DEGRADADO: si NADIE declara, el orden cae al score y sigue siendo determinista', () => {
    const todosMudos = [
      cand('c', 'sin_declarar', 0.70),
      cand('a', 'sin_declarar', 0.95),
      cand('b', 'sin_declarar', 0.85),
    ];
    expect(contarSinConfianza(todosMudos)).toBe(3);
    // No vuelve al orden de enumeracion: ordena por score.
    expect(ids(ordenarParaCortar(todosMudos))).toEqual(['a', 'b', 'c']);
  });
});

describe('ordenarParaCortar no muta lo que recibe', () => {
  it('la lista de entrada conserva su orden', () => {
    const entrada = [cand('b', 'baja'), cand('a', 'alta')];
    const copia = ids(entrada);
    ordenarParaCortar(entrada);
    expect(ids(entrada)).toEqual(copia);
  });
});
