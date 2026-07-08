import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { deleteVectorsByIds } from '@/lib/pinecone/vectors';
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
      .select('id, chunk_count')
      .eq('org_id', orgId)
      .eq('source', providerName);

    if (driveDocs && driveDocs.length > 0) {
      for (const doc of driveDocs) {
        const ids = Array.from({ length: doc.chunk_count }, (_, i) => `${doc.id}-${i}`);
        await deleteVectorsByIds(orgId, ids);
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
