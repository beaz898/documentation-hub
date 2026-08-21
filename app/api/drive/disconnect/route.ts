import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { deleteVectorsByIds, deleteVectorsByFilter, buildAllVectorIds } from '@/lib/pinecone/vectors';
import { resolveOrg } from '@/lib/org';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    // Read provider from the connection so we filter documents correctly
    const { data: connection } = await supabase.from('drive_connections')
      .select('provider')
      .eq('org_id', orgId)
      .single();

    const providerName = connection?.provider || 'google_drive';

    const { data: driveDocs } = await supabase.from('documents')
      .select('id, chunk_count, active_generation')
      .eq('org_id', orgId)
      .eq('source', providerName);

    if (driveDocs && driveDocs.length > 0) {
      // Los vectores se borran por DOS vías, igual que en lib/delete-document.ts:
      // por filtro de documentId (no depende de conocer la generación ni el
      // chunk_count) y por IDs explícitos de la generación activa. Basta con que
      // una funcione. Antes solo existía la segunda, construida asumiendo
      // generación 1: en un documento ya promocionado por un swap borraba IDs
      // inexistentes y dejaba los vectores reales vivos.
      const failedDocs: string[] = [];

      for (const doc of driveDocs) {
        const documentId = doc.id as string;
        let filterOk = false;
        let idsOk = false;

        try {
          await deleteVectorsByFilter(orgId, { documentId: { $eq: documentId } });
          filterOk = true;
        } catch (err) {
          console.warn(`[drive/disconnect] fallo borrado por filtro | doc=${documentId} |`, err);
        }

        const generation = (doc.active_generation as number | null) ?? 1;
        const ids = buildAllVectorIds(documentId, (doc.chunk_count as number | null) ?? 0, generation);
        if (ids.length > 0) {
          try {
            await deleteVectorsByIds(orgId, ids);
            idsOk = true;
          } catch (err) {
            console.warn(`[drive/disconnect] fallo borrado por IDs | doc=${documentId} | gen=${generation} |`, err);
          }
        }

        if (!filterOk && !idsOk) failedDocs.push(documentId);
      }

      // Las filas SOLO se borran si sus vectores se han podido borrar. Borrar la
      // fila de un documento cuyos vectores siguen en Pinecone deja basura
      // permanente: sin la fila no queda ninguna referencia para localizarlos.
      if (failedDocs.length > 0) {
        console.error(`[drive/disconnect] ABORTADO | org=${orgId} | ${failedDocs.length} documento(s) sin borrar de Pinecone`);
        return NextResponse.json(
          {
            error: 'No se pudieron borrar todos los datos del índice de búsqueda. No se ha desconectado nada; inténtalo de nuevo.',
            errorType: 'vector_delete_failed',
            failedCount: failedDocs.length,
          },
          { status: 502 },
        );
      }

      await supabase.from('documents').delete().eq('org_id', orgId).eq('source', providerName);
    }

    await supabase.from('drive_connections').delete().eq('org_id', orgId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error disconnecting drive:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
