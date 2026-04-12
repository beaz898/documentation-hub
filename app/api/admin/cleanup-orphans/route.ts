import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';

export const maxDuration = 300;

/**
 * GET /api/admin/cleanup-orphans?dryRun=true|false
 * ACCESO PÚBLICO. Borra en TODAS las cuentas. Uso único. ELIMINAR DESPUÉS.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') !== 'false';
    const supabase = createServiceClient();

    const { data: allDocs } = await supabase.from('documents').select('id, org_id');
    const validIdsByOrg = new Map<string, Set<string>>();
    const orgs = new Set<string>();
    for (const d of allDocs || []) {
      orgs.add(d.org_id);
      const s = validIdsByOrg.get(d.org_id) || new Set();
      s.add(d.id);
      validIdsByOrg.set(d.org_id, s);
    }

    const index = getIndex();
    const dummy = new Array(1024).fill(0); dummy[0] = 1;

    const orphansByDoc = new Map<string, { name: string; org: string; vectorIds: string[] }>();
    let totalVectors = 0;

    for (const org of orgs) {
      try {
        const res = await index.namespace(org).query({ vector: dummy, topK: 10000, includeMetadata: true });
        const matches = res.matches || [];
        totalVectors += matches.length;
        const validIds = validIdsByOrg.get(org) || new Set();

        for (const m of matches) {
          const meta = m.metadata as { documentId?: string; documentName?: string } | undefined;
          const docId = meta?.documentId;
          const docName = meta?.documentName || '(sin nombre)';
          const key = `${org}:${docId || '__NO_ID__'}`;

          if (!docId || !validIds.has(docId)) {
            const b = orphansByDoc.get(key) || { name: docName, org, vectorIds: [] };
            b.vectorIds.push(m.id);
            orphansByDoc.set(key, b);
          }
        }
      } catch (err) {
        console.warn(`[CLEANUP] Skipping org ${org}:`, err);
      }
    }

    const summary = Array.from(orphansByDoc.entries()).map(([key, info]) => ({
      documentId: key.split(':')[1],
      documentName: info.name,
      org: info.org,
      vectorCount: info.vectorIds.length,
    }));
    const totalOrphans = summary.reduce((s, g) => s + g.vectorCount, 0);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        message: `Se encontraron ${totalOrphans} vectores huérfanos en ${orgs.size} cuenta(s). No se ha borrado nada.`,
        totalVectorsInPinecone: totalVectors,
        validDocumentsInSupabase: (allDocs || []).length,
        organizationsScanned: orgs.size,
        orphanGroups: summary,
        totalOrphanVectors: totalOrphans,
      });
    }

    // Borrado real, namespace por namespace
    let deleted = 0;
    const deletionsByOrg = new Map<string, string[]>();
    for (const [, info] of orphansByDoc) {
      const arr = deletionsByOrg.get(info.org) || [];
      arr.push(...info.vectorIds);
      deletionsByOrg.set(info.org, arr);
    }
    for (const [org, ids] of deletionsByOrg) {
      const ns = index.namespace(org);
      for (let i = 0; i < ids.length; i += 1000) {
        try {
          await ns.deleteMany(ids.slice(i, i + 1000));
          deleted += Math.min(1000, ids.length - i);
        } catch (err) {
          console.error(`[CLEANUP] delete batch failed in org ${org}:`, err);
        }
      }
    }

    return NextResponse.json({
      dryRun: false,
      message: `Limpieza completada. ${deleted} vectores huérfanos eliminados de ${deletionsByOrg.size} cuenta(s).`,
      totalVectorsInPinecone: totalVectors,
      validDocumentsInSupabase: (allDocs || []).length,
      organizationsScanned: orgs.size,
      orphanGroups: summary,
      totalDeleted: deleted,
    });
  } catch (error: unknown) {
    console.error('cleanup-orphans error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
