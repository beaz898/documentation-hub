import { describe, expect, it } from 'vitest';

import { propietariosDelAnalisis } from './propietarios';

/**
 * F-101 — LA FILA NACE CON DUEÑO, Y HAY DOS.
 *
 * ⚠️ LO QUE ESTOS CASOS NO PRUEBAN, DECLARADO: que la base rechace la fila sin
 * propietario. Eso lo hace el `CHECK analysis_results_tiene_propietario`, que es
 * quien de verdad protege — impide, en vez de avisar. Lo que se prueba aquí es
 * el ESPEJO en la aplicación: que el fallo se vea donde se origina y no vuelva
 * como un error de restricción con el nombre de un CHECK en vez del nombre del
 * camino que se olvidó de pasar la ruta (F-96 P3).
 */

describe('los dos propietarios son etapas, no alternativas', () => {
  /** El camino del chat: el documento no existe todavía y el fichero sí. */
  it('solo la ruta basta: el análisis es del fichero', () => {
    expect(propietariosDelAnalisis({ storagePath: 'u/1-doc.pdf' })).toEqual({
      storagePath: 'u/1-doc.pdf', documentId: null, tienePropietario: true,
    });
  });

  /** La bandeja: el documento existe y es su dueño; no hay fichero temporal. */
  it('solo el documento basta: el análisis es suyo', () => {
    expect(propietariosDelAnalisis({ documentId: 'doc-1' })).toEqual({
      storagePath: null, documentId: 'doc-1', tienePropietario: true,
    });
  });

  /** La adopción: el fichero sigue siendo el dueño primario y el documento se
   *  añade. No se sustituye — es la historia de ese fichero. */
  it('los dos a la vez es el estado normal tras adoptar', () => {
    const p = propietariosDelAnalisis({ storagePath: 'u/1-doc.pdf', documentId: 'doc-1' });
    expect(p.tienePropietario).toBe(true);
    expect(p.storagePath).toBe('u/1-doc.pdf');
    expect(p.documentId).toBe('doc-1');
  });
});

describe('SIN DUEÑO NO SE ESCRIBE', () => {
  /** ⚠️ LA MITAD CONTRARIA, y es el huérfano que costó cuatro consultas. */
  it('sin ninguno de los dos, la fila no se intenta', () => {
    expect(propietariosDelAnalisis({}).tienePropietario).toBe(false);
    expect(propietariosDelAnalisis({ storagePath: null, documentId: null }).tienePropietario).toBe(false);
  });

  /**
   * ⚠️ LA CADENA VACÍA NO ES UN PROPIETARIO, y es el caso que la base NO puede
   * cazar: `''` no es NULL, así que satisfaría el CHECK y dejaría una fila que la
   * restricción da por buena y que no apunta a ningún sitio — el huérfano colado
   * por la puerta de un tipo. Se convierte a NULL antes de que llegue.
   */
  it('la cadena vacía y los espacios no son un dueño', () => {
    for (const vacio of ['', '   ', '\n']) {
      const p = propietariosDelAnalisis({ storagePath: vacio, documentId: vacio });
      expect(p.tienePropietario).toBe(false);
      expect(p.storagePath).toBeNull();
      expect(p.documentId).toBeNull();
    }
  });

  it('lo que no es cadena tampoco', () => {
    const p = propietariosDelAnalisis({ storagePath: 42 as unknown as string, documentId: {} as unknown as string });
    expect(p.tienePropietario).toBe(false);
  });

  /** Un dueño vacío no anula al otro que sí existe. */
  it('un dueño válido y otro vacío sigue teniendo dueño', () => {
    expect(propietariosDelAnalisis({ storagePath: '  ', documentId: 'doc-1' }).tienePropietario).toBe(true);
  });
});
