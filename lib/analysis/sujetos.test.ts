import { describe, expect, it } from 'vitest';

import { sujetosDelAnalisis, unicoExcluido } from './sujetos';

/**
 * B.163 / F-100 P2 — LOS TRES SUJETOS.
 *
 * ⚠️ LO QUE ESTOS CASOS NO PRUEBAN, DECLARADO: que la ruta reparta cada sujeto a
 * su consumidor. Eso se comprueba por lectura —el reparto va escrito y numerado
 * en `analyze-v2`— porque habla con Supabase, Pinecone y el modelo. Lo que sí se
 * prueba es QUIÉN ES QUIÉN, que es donde estaba el fallo.
 */

describe('el chat con un documento nuevo: no hay nadie', () => {
  it('sin referencias, los tres vacíos', () => {
    expect(sujetosDelAnalisis({})).toEqual({
      documentoPropietario: null,
      documentoEnRevision: null,
      documentosExcluidos: [],
    });
  });

  /** Lo que no está indexado no hace falta excluirlo de donde no está: aquel
   *  nulo era correcto, pero por la razón equivocada. */
  it('la lista vacía es la EXCEPCIÓN y solo aquí', () => {
    expect(sujetosDelAnalisis({}).documentosExcluidos).toEqual([]);
  });
});

describe('el reanálisis de un documento ya indexado: los tres coinciden', () => {
  const s = sujetosDelAnalisis({ documentoEnRevision: 'doc-propio' });

  it('es su propio propietario y su propio revisado', () => {
    expect(s.documentoPropietario).toBe('doc-propio');
    expect(s.documentoEnRevision).toBe('doc-propio');
  });

  /** ⚠️ MITAD CONTRARIA: se excluye A SÍ MISMO. Sin esto, un documento indexado
   *  se encuentra entre sus propios candidatos y se contradice consigo mismo. */
  it('se excluye a sí mismo de los candidatos', () => {
    expect(s.documentosExcluidos).toEqual(['doc-propio']);
  });
});

describe('EL REEMPLAZO DESDE EL MODAL — el caso que este commit arregla', () => {
  const s = sujetosDelAnalisis({ documentoAReemplazar: 'el-homonimo' });

  /**
   * ⚠️ MITAD CONTRARIA A. Es B.163: el análisis del texto nuevo se guardaba bajo
   * el id del documento VIEJO. Ahora no es de nadie — y lo será del documento
   * nuevo, en la indexación, con el id puesto en el INSERT.
   */
  it('el análisis NO es del homónimo: no es de nadie', () => {
    expect(s.documentoPropietario).toBeNull();
    expect(s.documentoPropietario).not.toBe('el-homonimo');
  });

  /**
   * ⚠️ MITAD CONTRARIA B, y es la del swap: sin parámetro propio, la familia que
   * lee el `staged` heredaría el homónimo — vetaría el exhaustivo por una
   * versión en vuelo AJENA y, en la rama rápida, promocionaría la versión de
   * OTRO documento.
   */
  it('no hay documento en revisión: el veto y el swap ajenos quedan apagados', () => {
    expect(s.documentoEnRevision).toBeNull();
    expect(s.documentoEnRevision).not.toBe('el-homonimo');
  });

  /**
   * ⚠️ MITAD CONTRARIA C. El arreglo no puede convertirse en «no excluir nada»:
   * no quieres compararte contra el documento que vas a sustituir.
   */
  it('el homónimo SÍ se excluye de los candidatos', () => {
    expect(s.documentosExcluidos).toEqual(['el-homonimo']);
  });
});

describe('lo que llega del cliente no se cuela', () => {
  it('la basura no es una referencia', () => {
    for (const basura of [42, {}, [], true, null, undefined, '', '   ']) {
      const s = sujetosDelAnalisis({ documentoEnRevision: basura, documentoAReemplazar: basura });
      expect(s).toEqual({
        documentoPropietario: null, documentoEnRevision: null, documentosExcluidos: [],
      });
    }
  });

  it('los espacios de alrededor no cambian la identidad', () => {
    expect(sujetosDelAnalisis({ documentoEnRevision: '  doc-1  ' }).documentoPropietario).toBe('doc-1');
  });

  /** Si las dos referencias son el mismo documento —la bandeja, donde el
   *  homónimo ES el propio— no se excluye dos veces. */
  it('un id repetido no se duplica en la lista', () => {
    const s = sujetosDelAnalisis({ documentoEnRevision: 'doc-1', documentoAReemplazar: 'doc-1' });
    expect(s.documentosExcluidos).toEqual(['doc-1']);
  });
});

describe('el corte declarado: el pipeline recibe uno', () => {
  it('sin excluidos no pasa ninguno', () => {
    expect(unicoExcluido(sujetosDelAnalisis({}))).toBeUndefined();
  });

  it('con uno, pasa ése', () => {
    expect(unicoExcluido(sujetosDelAnalisis({ documentoAReemplazar: 'y' }))).toBe('y');
  });

  /** ⚠️ Y si algún día llegan dos, se dice a gritos en vez de tirar el segundo
   *  en silencio — que es como un corte declarado se convierte en un fallo. */
  it('con dos, usa el primero y lo registra', () => {
    const avisos: string[] = [];
    const original = console.error;
    console.error = (msg: string) => { avisos.push(String(msg)); };
    try {
      const s = { documentoPropietario: null, documentoEnRevision: null, documentosExcluidos: ['a', 'b'] };
      expect(unicoExcluido(s)).toBe('a');
    } finally {
      console.error = original;
    }
    expect(avisos.join(' ')).toContain('LÍMITE SUPERADO');
  });
});
