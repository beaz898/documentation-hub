import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { buildVectorId, deleteVectorsByIds } from '@/lib/pinecone/vectors';

/**
 * POST /api/documents/[id]/discard-staged
 * Descarta la version nueva en vuelo (document_staged) de un documento: borra sus
 * vectores (los de su generacion) y su fila. La version activa (vieja) queda intacta
 * y sigue sirviendo el chat. (C.4d-2b, F-11: salida "descartar" de "requiere decision".)
 *
 * Tras descartar, si el usuario modifica de nuevo el archivo en Drive y sincroniza, el
 * sync compara contra la version ACTIVA y crea un staged nuevo con normalidad — descartar
 * no bloquea futuras versiones.
 *
 * Orden: vectores PRIMERO, fila DESPUES. Si el borrado de vectores falla, la fila sigue
 * (con su generation) y se puede reintentar; al reves quedarian vectores huerfanos sin
 * saber su generacion.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  const orgId = org.orgId;

  const { id } = await params;

  // Leer la version staged (necesitamos su generacion para borrar sus vectores).
  const { data: staged, error: stagedError } = await supabase
    .from('document_staged')
    .select('document_id, generation, chunk_count')
    .eq('document_id', id)
    .eq('org_id', orgId)
    .maybeSingle();

  if (stagedError) {
    console.error('[discard-staged] error leyendo staged:', stagedError.message);
    return NextResponse.json({ error: 'No se pudo leer la versión pendiente.' }, { status: 500 });
  }
  if (!staged) {
    return NextResponse.json({ error: 'Este documento no tiene ninguna versión nueva pendiente.' }, { status: 404 });
  }

  // 1) Borrar los vectores de la version staged en Pinecone. Se generan sus IDs con
  // buildVectorId (mismo formato con el que el sync los subio al versionar:
  // buildVectorId(documentId, generation, i) para cada chunk) y se borran por lista.
  // Via probada (deleteVectorsByIds), determinista: se borran EXACTAMENTE los ids de
  // esta generacion staged, nunca los de la version activa (llevan otra generacion).
  try {
    const stagedIds = Array.from(
      { length: staged.chunk_count },
      (_, i) => buildVectorId(id, staged.generation, i),
    );
    await deleteVectorsByIds(orgId, stagedIds);
  } catch (e) {
    console.error('[discard-staged] error borrando vectores staged:', e);
    return NextResponse.json(
      { error: 'No se pudieron borrar los vectores de la versión nueva. Inténtalo de nuevo.' },
      { status: 500 },
    );
  }

  // 2) Borrar la fila document_staged. La version activa (vieja) no se toca.
  const { error: delError } = await supabase
    .from('document_staged')
    .delete()
    .eq('document_id', id)
    .eq('org_id', orgId);

  if (delError) {
    console.error('[discard-staged] error borrando fila staged:', delError.message);
    return NextResponse.json(
      { error: 'Los vectores se borraron pero no se pudo limpiar la versión pendiente. Recarga la bandeja.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, discarded: true });
}
