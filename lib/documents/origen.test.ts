import { describe, expect, it } from 'vitest';

import { getAllProviders } from '@/lib/drive/registry';
import {
  esOrigenSincronizado,
  esReemplazableAMano,
  ORIGENES_SINCRONIZADOS,
} from './origen';
import { planDeReemplazo, type DocumentoExistente } from './plan-de-reemplazo';

/**
 * B.162 — UN DOCUMENTO SINCRONIZADO NO LO REEMPLAZA UNA SUBIDA MANUAL.
 *
 * El criterio vivía TRES veces —PostgREST, JavaScript y la interfaz— con dos
 * listas distintas, y la que decidía el borrado era la corta.
 */

const doc = (over: Partial<DocumentoExistente> & { source?: string | null } = {}) => ({
  id: 'doc-1', active_generation: 1, chunk_count: 5,
  created_at: '2026-01-01T00:00:00Z', source: 'manual', ...over,
});

describe('la lista no se puede separar del registro de proveedores', () => {
  /**
   * ⚠️ EL CASO QUE IMPIDE QUE ESTO VUELVA. La lista de este módulo está escrita a
   * mano —para no arrastrar los proveedores al navegador— y por eso hace falta
   * un punto que compruebe que sigue coincidiendo con el registro. El día que
   * alguien añada un proveedor y no toque la lista, un documento suyo pasaría a
   * ser reemplazable a mano sin que nadie lo decidiera. F-96 P3.
   */
  it('coincide exactamente con los proveedores registrados', () => {
    expect([...ORIGENES_SINCRONIZADOS].sort())
      .toEqual(getAllProviders().map(p => p.name).sort());
  });
});

describe('quién está sincronizado y quién no', () => {
  it('los dos proveedores lo están', () => {
    expect(esOrigenSincronizado('google_drive')).toBe(true);
    expect(esOrigenSincronizado('onedrive')).toBe(true);
  });

  /** MITAD CONTRARIA: lo manual no lo está, y por tanto SÍ se reemplaza. */
  it('lo manual no lo está', () => {
    expect(esOrigenSincronizado('manual')).toBe(false);
    expect(esReemplazableAMano('manual')).toBe(true);
  });

  /**
   * ⚠️ DECISIÓN, NO DESCUIDO: lo desconocido cuenta como manual. Es fallo
   * ABIERTO en un camino que borra, y va con su razón en el módulo — el criterio
   * tiene que coincidir con lo que la pantalla enseña, y la pantalla llama
   * manual a todo lo que no está en la lista.
   */
  it('lo desconocido cuenta como manual, a propósito', () => {
    for (const raro of [null, undefined, '', 'manual ', 'GOOGLE_DRIVE', 'dropbox']) {
      expect(esOrigenSincronizado(raro)).toBe(false);
      expect(esReemplazableAMano(raro)).toBe(true);
    }
  });
});

describe('EL REEMPLAZO: se lleva lo manual y DEJA ENTERO lo de Drive', () => {
  const conOrigen = (docs: ReturnType<typeof doc>[]) =>
    planDeReemplazo(docs.filter(d => esReemplazableAMano(d.source)));

  /** ⚠️ MITAD CONTRARIA A: un reemplazo de manual sobre manual SÍ borra. El
   *  arreglo no puede convertirse en «no reemplazar nunca». */
  it('un homónimo manual entra en el plan y se versiona', () => {
    const plan = conOrigen([doc({ id: 'el-manual', source: 'manual' })]);
    expect(plan.tipo).toBe('reemplazo');
    expect(plan.tipo === 'reemplazo' && plan.documentId).toBe('el-manual');
  });

  /**
   * ⚠️ MITAD CONTRARIA B, y se comprueba en SUS DOS CONSECUENCIAS por separado:
   * el documento sincronizado NO se versiona Y NO está entre los sobrantes. Las
   * dos ramas del borrado —la fila de Supabase y los vectores de Pinecone—
   * beben del mismo conjunto, así que una mutación que arreglara solo una
   * pasaría un caso que mirase solo la otra.
   */
  it('el de Drive ni se versiona ni se retira', () => {
    for (const origen of ['google_drive', 'onedrive']) {
      const plan = conOrigen([
        doc({ id: 'el-manual', source: 'manual', created_at: '2026-01-01T00:00:00Z' }),
        doc({ id: 'el-de-drive', source: origen, created_at: '2026-06-01T00:00:00Z' }),
      ]);
      expect(plan.tipo === 'reemplazo' && plan.documentId).toBe('el-manual');
      const sobrantes = plan.tipo === 'reemplazo' ? plan.sobrantes.map(s => s.documentId) : [];
      expect(sobrantes).not.toContain('el-de-drive');
      expect(sobrantes).toEqual([]);
    }
  });

  /** El caso exacto del 03/09: el de Drive es el MÁS RECIENTE, que es cuando el
   *  fallo se lo llevaba versionándolo en vez de borrándolo. */
  it('aunque el de Drive sea el más reciente, se versiona el manual', () => {
    const plan = conOrigen([
      doc({ id: 'el-manual', source: 'manual', created_at: '2026-01-01T00:00:00Z' }),
      doc({ id: 'el-de-drive', source: 'onedrive', created_at: '2026-09-03T00:00:00Z' }),
    ]);
    expect(plan.tipo === 'reemplazo' && plan.documentId).toBe('el-manual');
  });

  /** Y si el ÚNICO homónimo es de Drive, no hay reemplazo: se crea uno nuevo y
   *  coexisten, que es lo que el aviso promete. */
  it('un homónimo solo de Drive deja la subida en alta, no en reemplazo', () => {
    expect(conOrigen([doc({ id: 'el-de-drive', source: 'google_drive' })]).tipo).toBe('alta');
  });
});
