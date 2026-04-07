import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';

export async function POST(req: NextRequest) {
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

    // Get all drive documents to delete their vectors
    const { data: driveDocs } = await supabase.from('documents')
      .select('id, chunk_count')
      .eq('org_id', orgId)
      .eq('source', 'google_drive');

    if (driveDocs && driveDocs.length > 0) {
      const index = getIndex();
      for (const doc of driveDocs) {
        const ids = Array.from({ length: doc.chunk_count }, (_, i) => `${doc.id}-${i}`);
        for (let i = 0; i < ids.length; i += 1000) {
          await index.namespace(orgId).deleteMany(ids.slice(i, i + 1000));
        }
      }
      await supabase.from('documents').delete().eq('org_id', orgId).eq('source', 'google_drive');
    }

    // Delete connection
    await supabase.from('drive_connections').delete().eq('org_id', orgId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error disconnecting drive:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
