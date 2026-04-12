import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';

export const maxDuration = 300;

/**
 * GET /api/admin/cleanup-orphans
 * - dryRun=true (default): público, analiza TODOS los namespaces
 * - dryRun=false: requiere login, borra solo en el namespace del usuario
 *
 * IMPORTANTE: eliminar este archivo después de usarlo en producción.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') !== 'false';
    const supabase = createServiceClient();

    // DRY RUN: público, barrido global
    if (dryRun) {
      const { data: allDocs } = await supabase
        .from('documents')
        .select('id, name, org_id');

      const validIdsByOrg = new Map<string, Set<string>>();
      const orgs = new Set<string>();
      for (const d of allDocs || []) {
        orgs.add(d.org_id);
        const set = validIdsByOrg.get(d.org_id) || new Set();
        set.add(d.id);
        validIdsByOrg.set(d.org_id, set);
      }

      const index = getIndex();
      const dummyVector = new Array(1024).fill(0);
      dummyVector[0] = 1;

      const orphansByDoc = new Map<string, { name: string; org: string; vectorCount: number }>();
      let totalVectors = 0;

      for (const org of orgs) {
        try {
          const res = await index.namespace(org).query({
            vector: dummyVector, topK: 10000, includeMetadata: true,
          });
          const matches = res.matches || [];
          totalVectors += matches.length;
          const validIds = validIdsByOrg.get(org) || new Set();

          for (const m of matches) {
            const meta = m.metadata as { documentId?: string; documentName?: string } | undefined;
            const docId = meta?.documentId;
            const docName = meta?.documentName || '(sin nombre)';
            if (!docId) {
              const key = `${org}:__NO_ID__`;
              const b = orphansByDoc.get(key) || { name: '(metadata incompleta)', org, vectorCount: 0 };
              b.vectorCount++; orphansByDoc.set(key, b);
              continue;
            }
            if (!validIds.has(docId)) {
              const key = `${org}:${docId}`;
              const b = orphansByDoc.get(key) || { name: docName, org, vectorCount: 0 };
              b.vectorCount++; orphansByDoc.set(key, b);
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
        vectorCount: info.vectorCount,
      }));

      return NextResponse.json({
        dryRun: true,
        message: 'Análisis global. Para borrar debes iniciar sesión y usar dryRun=false (solo borra en tu cuenta).',
        totalVectorsInPinecone: totalVectors,
        validDocumentsInSupabase: (allDocs || []).length,
        organizationsScanned: orgs.size,
        orphanGroups: summary,
        totalOrphanVectors: summary.reduce((s, g) => s + g.vectorCount, 0),
      });
    }

    // DELETE: exige login
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Para borrar debes iniciar sesión' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    const orgId = user.user_metadata?.org_id || user.id;

    const { data: validDocs } = await supabase
      .from('documents').select('id').eq('org_id', orgId);
    const validIds = new Set((validDocs || []).map(d => d.id));

    const index = getIndex();
    const ns = index.namespace(orgId);
    const dummyVector = new Array(1024).fill(0); dummyVector[0] = 1;
    const queryRes = await ns.query({ vector: dummyVector, topK: 10000, includeMetadata: true });
    const matches = queryRes.matches || [];

    const orphanIds: string[] = [];
    for (const m of matches) {
      const meta = m.metadata as { documentId?: string } | undefined;
      if (!meta?.documentId || !validIds.has(meta.documentId)) orphanIds.push(m.id);
    }

    let deleted = 0;
    for (let i = 0; i < orphanIds.length; i += 1000) {
      const batch = orphanIds.slice(i, i + 1000);
      try { await ns.deleteMany(batch); deleted += batch.length; } catch (err) { console.error(err); }
    }

    return NextResponse.json({
      dryRun: false,
      message: `Limpieza completada en tu cuenta. ${deleted} vectores eliminados.`,
      totalVectorsInPinecone: matches.length,
      validDocumentsInSupabase: validIds.size,
      orphanGroups: [],
      totalDeleted: deleted,
    });
  } catch (error: unknown) {
    console.error('cleanup-orphans error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
