import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';

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

    const orgId = user.user_metadata?.org_id || user.id;

    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, name, size_bytes, chunk_count, created_at, status')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents: documents || [] });
  } catch (error: unknown) {
    console.error('Error listing documents:', error);
    return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

// DELETE: Eliminar un documento
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

    const orgId = user.user_metadata?.org_id || user.id;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    // Verificar que el documento pertenece al org
    const { data: doc } = await supabase
      .from('documents')
      .select('id, chunk_count')
      .eq('id', documentId)
      .eq('org_id', orgId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Eliminar vectores de Pinecone
    const index = getIndex();
    const idsToDelete = Array.from(
      { length: doc.chunk_count },
      (_, i) => `${documentId}-${i}`
    );

    // Eliminar en lotes de 1000
    for (let i = 0; i < idsToDelete.length; i += 1000) {
      const batch = idsToDelete.slice(i, i + 1000);
      await index.namespace(orgId).deleteMany(batch);
    }

    // Eliminar de Supabase
    await supabase.from('documents').delete().eq('id', documentId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Error eliminando documento' }, { status: 500 });
  }
}
