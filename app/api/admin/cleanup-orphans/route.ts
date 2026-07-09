import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { queryVectors, deleteVectorsByIds } from '@/lib/pinecone/vectors';

export const maxDuration = 300;

/**
 * GET /api/admin/cleanup-orphans?dryRun=true|false
 * Solo-admin. Opera ÚNICAMENTE sobre la organización del usuario autenticado.
 * dryRun=true (por defecto) solo analiza; dryRun=false borra los vectores huérfanos.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  if (org.role !== 'admin') return NextResponse.json({ error: 'Solo los administradores pueden usar esta herramienta.' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') !== 'false';

    const { data: orgDocs } = await supabase.from('documents').select('id').eq('org_id', org.orgId);
    const validIds = new Set((orgDocs || []).map(d => d.id as string));

    const dummy = new Array(1024).fill(0); dummy[0] = 1;

    const matches = await queryVectors(org.orgId, { vector: dummy, topK: 10000, includeMetadata: true });
    const totalVectors = matches.length;

    const orphansByDoc = new Map<string, { name: string; vectorIds: string[] }>();

    for (const m of matches) {
      const meta = m.metadata as { documentId?: string; documentName?: string } | undefined;
      const docId = meta?.documentId;
      const docName = meta?.documentName || '(sin nombre)';

      if (!docId || !validIds.has(docId)) {
        const key = docId || '__NO_ID__';
        const b = orphansByDoc.get(key) || { name: docName, vectorIds: [] };
        b.vectorIds.push(m.id);
        orphansByDoc.set(key, b);
      }
    }

    const summary = Array.from(orphansByDoc.entries()).map(([documentId, info]) => ({
      documentId,
      documentName: info.name,
      vectorCount: info.vectorIds.length,
    }));
    const totalOrphans = summary.reduce((s, g) => s + g.vectorCount, 0);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        message: `Se encontraron ${totalOrphans} vectores huérfanos en tu organización. No se ha borrado nada.`,
        totalVectorsInPinecone: totalVectors,
        validDocumentsInSupabase: validIds.size,
        orphanGroups: summary,
        totalOrphanVectors: totalOrphans,
      });
    }

    const allOrphanIds = Array.from(orphansByDoc.values()).flatMap(b => b.vectorIds);
    let deleted = 0;
    try {
      await deleteVectorsByIds(org.orgId, allOrphanIds);
      deleted = allOrphanIds.length;
    } catch (err) {
      console.error('[CLEANUP] delete failed:', err);
    }

    return NextResponse.json({
      dryRun: false,
      message: `Limpieza completada. ${deleted} vectores huérfanos eliminados.`,
      totalVectorsInPinecone: totalVectors,
      validDocumentsInSupabase: validIds.size,
      orphanGroups: summary,
      totalDeleted: deleted,
    });
  } catch (error: unknown) {
    console.error('cleanup-orphans error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
