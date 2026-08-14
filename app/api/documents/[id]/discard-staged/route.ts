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
 * Tras descartar se sella el cerrojo (documents.source_modified_at = el del staged
 * descartado, F-16 Q5): la version rechazada NO renace en el siguiente sync. Si el
 * usuario edita de nuevo el archivo en Drive, su modifiedTime avanza por encima del
 * sello y el sync crea un staged nuevo con normalidad.
 *
 * Orden: vectores PRIMERO, sello del cerrojo DESPUES, fila AL FINAL. Si el borrado de
 * vectores falla, la fila sigue (con su generation) y se puede reintentar; si el sello
 * falla, tampoco se borra la fila (mismo motivo: reintentable). Solo se borra la fila
 * cuando las dos patas anteriores tuvieron exito — al reves quedarian vectores
 * huerfanos, o el staged borrado con el cerrojo sin avanzar (el sync lo resucitaria).
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
    .select('document_id, generation, chunk_count, source_modified_at')
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

  // 2) Sellar el cerrojo del sync (F-16 Q5). Descartar ES procesar la version remota:
  // el humano la vio y la rechazo. Si no se sella, documents.source_modified_at sigue
  // congelado en la fecha de la version activa y el proximo sync reconstruye este mismo
  // staged aunque nadie haya tocado Drive (el bucle que arreglo el Fix A, por otra
  // puerta). Que el descriptor quede con la fecha de una version que nunca sirvio NO es
  // la "mentira" que F-16 rechazo en Q1-ii: alli el sello era automatico y con el staged
  // VIGENTE (hacia indistinguible "pendiente de decidir" de "resuelto"); aqui el staged
  // desaparece en esta misma operacion y media una decision humana, asi que el campo
  // significa exactamente "la ultima version remota que se proceso, rechazandola".
  // Va ANTES de borrar la fila a proposito: si el sello falla, el staged sigue vivo y la
  // operacion es reintentable. Al reves quedaria el staged borrado y el cerrojo sin
  // avanzar -> el sync lo resucitaria.
  if (staged.source_modified_at) {
    const { error: lockError } = await supabase
      .from('documents')
      .update({ source_modified_at: staged.source_modified_at })
      .eq('id', id)
      .eq('org_id', orgId);

    if (lockError) {
      console.error('[discard-staged] error sellando el cerrojo:', lockError.message);
      return NextResponse.json(
        { error: 'No se pudo registrar el descarte. Inténtalo de nuevo.' },
        { status: 500 },
      );
    }
  }

  // 3) Borrar la fila document_staged. Los vectores y el contenido de la version activa
  // no se tocan; solo se ha avanzado su cerrojo.
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
