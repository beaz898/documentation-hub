import { describe, expect, it } from 'vitest';

import { casaConLaAdopcion, criterioDeAdopcion } from './adopcion';

/**
 * F-101 — LA ADOPCIÓN.
 *
 * ⚠️ LO QUE NO PRUEBAN: que `ingest` ejecute la adopción después de crear la
 * fila y sin abortar si falla. Eso habla con Supabase y va escrito y razonado en
 * la propia ruta. Lo que sí se prueba es A QUIÉN alcanza, que es donde el error
 * sería caro.
 */

const ORG = 'org-1';
const RUTA = 'usuario/1725000000-tarifa.pdf';
const huerfano = { org_id: ORG, storage_path: RUTA, document_id: null };

describe('el documento adopta los análisis de SU fichero', () => {
  it('el criterio lleva organización y ruta', () => {
    expect(criterioDeAdopcion(ORG, RUTA)).toEqual({ org_id: ORG, storage_path: RUTA });
  });

  it('alcanza a un huérfano de esa ruta', () => {
    expect(casaConLaAdopcion(criterioDeAdopcion(ORG, RUTA)!, huerfano)).toBe(true);
  });

  it('los espacios de alrededor no cambian la ruta', () => {
    expect(criterioDeAdopcion(ORG, `  ${RUTA}\n`)!.storage_path).toBe(RUTA);
  });
});

describe('LO QUE NO ADOPTA', () => {
  /**
   * ⚠️ LA MITAD CONTRARIA QUE MÁS IMPORTA. Sin esta guarda, una ruta vacía deja
   * un criterio que alcanza a TODOS los huérfanos de la organización y se los
   * cuelga a un documento cualquiera. Es la misma forma que la fuga del origen y
   * que el borrado por nombre: una condición que al quedarse vacía AMPLÍA en vez
   * de restringir.
   */
  it('sin ruta no adopta NADA — nunca todo', () => {
    for (const nada of [null, undefined, '', '   ', 42 as unknown as string]) {
      expect(criterioDeAdopcion(ORG, nada)).toBeNull();
    }
  });

  it('sin organización tampoco hay criterio', () => {
    expect(criterioDeAdopcion('', RUTA)).toBeNull();
    expect(criterioDeAdopcion('   ', RUTA)).toBeNull();
  });

  /** ⚠️ MITAD CONTRARIA B: reindexar no reasigna lo que ya tiene dueño adoptivo. */
  it('no toca un análisis que ya pertenece a un documento', () => {
    const yaAdoptado = { ...huerfano, document_id: 'otro-doc' };
    expect(casaConLaAdopcion(criterioDeAdopcion(ORG, RUTA)!, yaAdoptado)).toBe(false);
  });

  /** ⚠️ MITAD CONTRARIA C: no cruza organizaciones. */
  it('no adopta análisis de otra organización', () => {
    expect(casaConLaAdopcion(criterioDeAdopcion(ORG, RUTA)!, { ...huerfano, org_id: 'org-2' })).toBe(false);
  });

  /** Otro fichero del mismo usuario y la misma org: cada uno con lo suyo. */
  it('no adopta los de otra ruta', () => {
    expect(casaConLaAdopcion(criterioDeAdopcion(ORG, RUTA)!, { ...huerfano, storage_path: 'usuario/otra.pdf' })).toBe(false);
  });

  /** Un análisis de la bandeja no tiene ruta: no es adoptable por nadie. */
  it('un análisis sin ruta no lo adopta nadie', () => {
    expect(casaConLaAdopcion(criterioDeAdopcion(ORG, RUTA)!, { ...huerfano, storage_path: null })).toBe(false);
  });
});
