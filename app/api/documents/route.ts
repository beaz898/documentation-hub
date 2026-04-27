import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { resolveOrg } from '@/lib/org';

// GET: Listar documentos del usuario
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

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
      .select('id, name, size_bytes, chunk_count, created_at, status, source, folder_path, folder_id')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ documents: documents || [] });
  } catch (error: unknown) {
    console.error('Error listing documents:', error);
    return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

// DELETE: Eliminar un documento (robusto: borra por filtro de metadata + barrido por ID)
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

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

    // Verificar propiedad
    const { data: doc } = await supabase
      .from('documents')
      .select('id, chunk_count')
      .eq('id', documentId)
      .eq('org_id', orgId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const index = getIndex();
    const ns = index.namespace(orgId);

    // Estrategia 1: borrado por filtro de metadata (captura TODO, incluyendo vectores
    // huérfanos si chunk_count quedó desincronizado en algún punto del pasado)
    let filterDeleteWorked = false;
    try {
      await ns.deleteMany({ documentId: { $eq: documentId } });
      filterDeleteWorked = true;
      console.log(`[DELETE] Metadata filter delete OK for documentId=${documentId}`);
    } catch (err) {
      console.warn(`[DELETE] Metadata filter delete failed, falling back to ID list:`, err);
    }

    // Estrategia 2: barrido por IDs construidos (siempre, por si el filtro no se aplicó
    // en el plan actual o quedaron IDs antiguos antes de que empezáramos a guardar metadata)
    if (!filterDeleteWorked || doc.chunk_count > 0) {
      const idsToDelete = Array.from(
        { length: Math.max(doc.chunk_count, 0) },
        (_, i) => `${documentId}-${i}`
      );
      for (let i = 0; i < idsToDelete.length; i += 1000) {
        const batch = idsToDelete.slice(i, i + 1000);
        try {
          await ns.deleteMany(batch);
        } catch (err) {
          console.warn(`[DELETE] ID batch delete failed:`, err);
        }
      }
    }

    // Eliminar de Supabase
    await supabase.from('documents').delete().eq('id', documentId);

    return NextResponse.json({ success: true, filterDeleteWorked });
  } catch (error: unknown) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Error eliminando documento' }, { status: 500 });
  }
}
