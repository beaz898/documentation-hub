import { describe, expect, it } from 'vitest';

import {
  casaConElCriterio,
  criterioDeAnalisisDelDocumento,
  type FilaDeAnalisis,
} from './analisis-del-documento';

/**
 * B.112 — EL BORRADO SE LLEVA LO SUYO Y DEJA EN PAZ LO AJENO.
 *
 * ⚠️ LO QUE ESTOS CASOS NO PRUEBAN, DECLARADO: que `deleteDocument` llame a este
 * criterio, y que lo haga antes de borrar la fila. Eso habla con Supabase y se
 * comprueba por lectura — por eso el orden va escrito y razonado en el propio
 * `delete-document.ts`. Lo que sí se prueba aquí es EL MISMO OBJETO que viaja a
 * la base, no una imitación suya.
 *
 * ⚠️ Y LO QUE ESTE COMMIT NO CORRIGE, para que nadie lo lea al revés: hasta hoy
 * NO SE BORRABA NINGÚN ANÁLISIS, ni por nombre ni por id — verificado sobre los
 * 26 `.delete()` del repo, sobre el esquema (no hay clave foránea ni cascada) y
 * sobre los triggers. No se pasa de nombre a id: se pasa de no borrar a borrar
 * por id.
 */

const fila = (over: Partial<FilaDeAnalisis> = {}): FilaDeAnalisis => ({
  org_id: 'org-1',
  document_id: 'doc-1',
  document_name: 'tarifa.pdf',
  ...over,
});

describe('el criterio es cerrado: id y organización, y nada más', () => {
  /**
   * ⚠️ EL CASO DEL COMMIT. Con `document_name` dentro, borrar un documento se
   * llevaría por delante los análisis de todos sus HOMÓNIMOS vivos. El nombre no
   * identifica: colisiona. Se comprueba sobre las CLAVES y no sobre el efecto
   * porque es el objeto entero el que viaja a `.match()`.
   */
  it('lleva exactamente org_id y document_id', () => {
    expect(criterioDeAnalisisDelDocumento('org-1', 'doc-1')).toEqual({
      org_id: 'org-1',
      document_id: 'doc-1',
    });
  });

  /** MITAD CONTRARIA de la anterior, dicha por su nombre. */
  it('NO lleva document_name', () => {
    expect(Object.keys(criterioDeAnalisisDelDocumento('org-1', 'doc-1'))).not.toContain('document_name');
  });
});

describe('se lleva lo suyo', () => {
  it('alcanza un análisis del documento que se borra', () => {
    expect(casaConElCriterio(criterioDeAnalisisDelDocumento('org-1', 'doc-1'), fila())).toBe(true);
  });

  it('lo alcanza sea cual sea el nombre con el que se guardó', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    for (const nombre of ['tarifa.pdf', 'tarifa (corregido).pdf', '']) {
      expect(casaConElCriterio(c, fila({ document_name: nombre }))).toBe(true);
    }
  });
});

describe('DEJA EN PAZ LO AJENO', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA QUE PIDIÓ EL ENCARGO. Un documento vivo que se llama
   * igual que el que se borra tiene sus propios análisis, y no se tocan. Es la
   * diferencia entre borrar lo de uno y hacer limpieza en casa ajena.
   */
  it('un homónimo VIVO con otro id conserva sus análisis', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ document_id: 'doc-2' }))).toBe(false);
  });

  /**
   * ⚠️ Y EL PARQUE VIEJO, que es la otra mitad y la que no se puede resolver
   * desde el código: los análisis de subida nacen con `document_id = null`
   * porque el documento no existía al guardarlos. El criterio NO los alcanza, y
   * NO debe intentar adivinarlos por nombre — adivinar en una operación
   * destructiva es cómo se borra lo que no se quería borrar. Se limpian aparte,
   * en SQL, mirándolos antes.
   */
  it('un análisis sin id, aunque se llame igual, sobrevive', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ document_id: null }))).toBe(false);
  });

  /** El aislamiento entre organizaciones, que en esta casa no se salta nadie. */
  it('el mismo id en otra organización no se toca', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ org_id: 'org-2' }))).toBe(false);
  });

  /** Todas las claves tienen que casar, no alguna: es lo que hace `.match()`. */
  it('casar solo una clave no basta', () => {
    const c = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    expect(casaConElCriterio(c, fila({ org_id: 'org-2', document_id: 'doc-1' }))).toBe(false);
    expect(casaConElCriterio(c, fila({ org_id: 'org-1', document_id: 'doc-9' }))).toBe(false);
  });
});

describe('el criterio no arrastra estado entre llamadas', () => {
  it('dos documentos distintos dan criterios distintos', () => {
    const a = criterioDeAnalisisDelDocumento('org-1', 'doc-1');
    const b = criterioDeAnalisisDelDocumento('org-1', 'doc-2');
    expect(a).not.toEqual(b);
    expect(casaConElCriterio(a, fila({ document_id: 'doc-2' }))).toBe(false);
    expect(casaConElCriterio(b, fila({ document_id: 'doc-2' }))).toBe(true);
  });
});
