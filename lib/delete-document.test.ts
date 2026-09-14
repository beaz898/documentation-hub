import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * LA BATERÍA DEL BORRADO — el cerrojo de los vectores, 14/09/2026.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUÉ DEMUESTRA, Y ES UNA SOLA COSA: que un fallo al borrar los vectores DEJA
 * LA FILA VIVA. Hasta hoy la borraba igual, y lo que quedaba —documento sin
 * fila, con vectores— no era un residuo dormido: el chat lo recupera, lo
 * reconstruye desde los trozos (rag.ts:336-370) y lo cita por su nombre.
 *
 * ⚠️ Y NO HAY FORMA DE EJERCER ESTO EN PANTALLA. Para verlo haría falta que
 * Pinecone falle mientras la base va bien, y eso no se provoca con ningún gesto
 * del usuario ni del administrador. **Esta batería ES la evidencia**, no un
 * complemento de ella. Lo que sí se puede mirar en pantalla —que borrar un
 * documento siga funcionando— prueba que no se rompió el camino sano, no el
 * orden.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const borrarPorFiltro = vi.fn();
const borrarPorIds    = vi.fn();

vi.mock('@/lib/pinecone/vectors', () => ({
  deleteVectorsByFilter: (...a: unknown[]) => borrarPorFiltro(...a),
  deleteVectorsByIds:    (...a: unknown[]) => borrarPorIds(...a),
  buildAllVectorIds: (docId: string, n: number) =>
    Array.from({ length: n }, (_, i) => `${docId}#${i}`),
}));

vi.mock('@/lib/upload-lock', () => ({
  checkUploadLock: () => Promise.resolve({ locked: false }),
}));

import { deleteDocument } from './delete-document';
import type { SupabaseClient } from '@supabase/supabase-js';

const DOC = {
  id: 'doc-1', source: 'manual', provider_file_id: null,
  name: 'informe.txt', chunk_count: 3, active_generation: 1,
};

/** Registro de lo que se intentó escribir, que es lo que se está probando. */
interface Traza { borradas: string[]; }

/**
 * Cliente falso. `fallos` dice qué tabla debe fallar al borrar; todo lo demás
 * va bien. La traza guarda el ORDEN de los borrados, porque «la fila no se
 * borró» sólo se puede afirmar mirando que no está en la lista.
 */
function clienteFalso(
  fallos: Record<string, { message: string }> = {},
  doc: typeof DOC | null = DOC,
): { supabase: SupabaseClient; traza: Traza } {
  const traza: Traza = { borradas: [] };

  const constructor = (tabla: string) => {
    const cadena: Record<string, unknown> = {};
    const devolver = () => Promise.resolve(
      fallos[tabla] ? { data: null, error: fallos[tabla] } : { data: null, error: null },
    );
    for (const m of ['select', 'eq', 'match', 'upsert']) cadena[m] = () => cadena;
    cadena.delete = () => { traza.borradas.push(tabla); return cadena; };
    cadena.single = () => Promise.resolve(
      doc ? { data: doc, error: null } : { data: null, error: { message: 'no encontrado' } },
    );
    cadena.then = (r: (v: unknown) => unknown) => devolver().then(r);
    return cadena;
  };

  return { supabase: { from: constructor } as unknown as SupabaseClient, traza };
}

const PARAMS = { orgId: 'org-1', documentId: 'doc-1', reason: 'user_excluded' as const };

beforeEach(() => {
  borrarPorFiltro.mockReset().mockResolvedValue(undefined);
  borrarPorIds.mockReset().mockResolvedValue(undefined);
});

describe('deleteDocument — el cerrojo de los vectores', () => {
  it('CONTROL POSITIVO: con todo sano, borra análisis, vectores y fila', async () => {
    const { supabase, traza } = clienteFalso();
    const r = await deleteDocument(supabase, PARAMS);

    expect(r.ok).toBe(true);
    expect(r.vectorsDeleted).toBe(true);
    expect(r.rowDeleted).toBe(true);
    expect(traza.borradas).toContain('documents');
    expect(traza.borradas).toContain('analysis_results');
  });

  it('⚠️ si FALLAN LAS DOS vías de vectores, la fila NO se borra', async () => {
    borrarPorFiltro.mockRejectedValue(new Error('pinecone caído'));
    borrarPorIds.mockRejectedValue(new Error('pinecone caído'));
    const { supabase, traza } = clienteFalso();

    const r = await deleteDocument(supabase, PARAMS);

    expect(r.vectorsDeleted).toBe(false);
    expect(r.rowDeleted).toBe(false);
    expect(r.ok).toBe(false);
    // Lo que de verdad se afirma: la fila no está entre las borradas.
    expect(traza.borradas).not.toContain('documents');
    expect(r.error).toContain('sigue en la lista');
  });

  it('si falla SOLO el filtro, la vía por ids salva el borrado y la fila se va', async () => {
    borrarPorFiltro.mockRejectedValue(new Error('filtro caído'));
    const { supabase, traza } = clienteFalso();

    const r = await deleteDocument(supabase, PARAMS);

    expect(r.vectorsDeleted).toBe(true);
    expect(r.ok).toBe(true);
    expect(traza.borradas).toContain('documents');
  });

  it('si falla SOLO la vía por ids, el filtro salva el borrado', async () => {
    borrarPorIds.mockRejectedValue(new Error('ids caídos'));
    const { supabase, traza } = clienteFalso();

    const r = await deleteDocument(supabase, PARAMS);

    expect(r.vectorsDeleted).toBe(true);
    expect(traza.borradas).toContain('documents');
  });

  it('⚠️ sin chunk_count la vía por ids no corre, así que el filtro es la ÚNICA', async () => {
    // Un documento con chunk_count 0 no tiene segunda oportunidad: si el filtro
    // falla, no hay nada que lo salve. El cerrojo tiene que protegerlo igual.
    borrarPorFiltro.mockRejectedValue(new Error('filtro caído'));
    const { supabase, traza } = clienteFalso({}, { ...DOC, chunk_count: 0 });

    const r = await deleteDocument(supabase, PARAMS);

    expect(borrarPorIds).not.toHaveBeenCalled();
    expect(r.vectorsDeleted).toBe(false);
    expect(traza.borradas).not.toContain('documents');
  });

  it('el fallo de los ANÁLISIS aborta antes de tocar los vectores (invariante B.112)', async () => {
    const { supabase, traza } = clienteFalso({ analysis_results: { message: 'caída' } });

    const r = await deleteDocument(supabase, PARAMS);

    expect(r.analysesDeleted).toBe(false);
    expect(borrarPorFiltro).not.toHaveBeenCalled();
    expect(traza.borradas).not.toContain('documents');
  });

  it('el fallo al borrar la FILA deja ok en false', async () => {
    const { supabase } = clienteFalso({ documents: { message: 'caída' } });

    const r = await deleteDocument(supabase, PARAMS);

    expect(r.vectorsDeleted).toBe(true);
    expect(r.rowDeleted).toBe(false);
    expect(r.ok).toBe(false);
  });

  it('un documento que no existe no borra nada', async () => {
    const { supabase, traza } = clienteFalso({}, null);

    const r = await deleteDocument(supabase, PARAMS);

    expect(r.ok).toBe(false);
    expect(r.error).toContain('No se pudo leer');
    expect(traza.borradas).toHaveLength(0);
  });
});
