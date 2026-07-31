import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { deleteDocument } from '@/lib/delete-document';

// GET: Listar documentos del usuario
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    // Resolver organización
    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, name, size_bytes, chunk_count, created_at, status, source, folder_path, folder_id, analysis_status')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ documents: documents || [] });
  } catch (error: unknown) {
    console.error('Error listing documents:', error);
    return NextResponse.json({ error: 'Error listando documentos' }, { status: 500 });
  }
}

// DELETE: Eliminar un documento del corpus (exclusión voluntaria).
// Delega en la función de borrado compartida (C.2): vectores + fila + lápida si
// el documento es sincronizado. A diferencia del código pre-C.2, un fallo de
// borrado NO se reporta como éxito (endurecimiento de .error, remache 3 de Fable).
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    // Resolver organización
    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');
    if (!documentId) {
      return NextResponse.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    // Exclusión voluntaria: este endpoint solo lo llaman la bandeja y el sidebar,
    // siempre es el usuario quitando un documento del corpus. Si es sincronizado,
    // deleteDocument escribe lápida para que el sync no lo reimporte.
    const result = await deleteDocument(supabase, {
      orgId,
      documentId,
      reason: 'user_excluded',
      excludedBy: user.id,
      actorUserId: user.id,
    });

    if (result.locked) {
      return NextResponse.json(
        { error: result.error, errorType: 'upload_locked' },
        { status: 423 }
      );
    }

    if (!result.ok) {
      // La verificación de propiedad la hace deleteDocument al leer el documento
      // filtrando por org_id; si no existe, devuelve error de lectura.
      const notFound = result.error?.includes('no encontrado');
      return NextResponse.json(
        { error: result.error ?? 'Error eliminando documento' },
        { status: notFound ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true, tombstoned: result.tombstoned });
  } catch (error: unknown) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Error eliminando documento' }, { status: 500 });
  }
}
