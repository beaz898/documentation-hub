import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';

export const maxDuration = 300;

/**
 * Endpoint de un solo uso: limpia vectores huérfanos en Pinecone
 * (vectores cuyo documentId ya no existe en Supabase).
 *
 * USO: GET /api/admin/cleanup-orphans con Authorization: Bearer <token>
 * - dryRun=true (default): solo reporta, no borra
 * - dryRun=false: borra los huérfanos
 *
 * IMPORTANTE: eliminar este archivo después de usarlo.
 */
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

    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') !== 'false'; // default true

    // 1. Obtener todos los documentIds válidos en Supabase para esta org
    const { data: validDocs } = await supabase
      .from('documents')
      .select('id, name, chunk_count')
      .eq('org_id', orgId);

    const validIds = new Set((validDocs || []).map(d => d.id));
    console.log(`[CLEANUP] Valid documents in Supabase: ${validIds.size}`);

    // 2. Barrer Pinecone con una query dummy (tier gratuito no soporta listPaginated con filtros)
    const index = getIndex();
    const ns = index.namespace(orgId);

    // Vector dummy de 1024 dimensiones (coincide con multilingual-e5-large)
    const dummyVector = new Array(1024).fill(0);
    dummyVector[0] = 1;

    const queryResult = await ns.query({
      vector: dummyVector,
      topK: 10000, // máximo permitido en la mayoría de planes
      includeMetadata: true,
    });

    const matches = queryResult.matches || [];
    console.log(`[CLEANUP] Pinecone returned ${matches.length} vectors`);

    // 3. Identificar huérfanos (vectores cuyo documentId no está en Supabase)
    const orphansByDoc = new Map<string, { name: string; vectorIds: string[] }>();

    for (const match of matches) {
      const meta = match.metadata as { documentId?: string; documentName?: string } | undefined;
      const docId = meta?.documentId;
      const docName = meta?.documentName || '(sin nombre)';

      if (!docId) {
        // Vectores antiquísimos sin documentId en metadata: imposibles de recuperar
        const bucket = orphansByDoc.get('__NO_DOCUMENT_ID__') || { name: '(metadata incompleta)', vectorIds: [] };
        bucket.vectorIds.push(match.id);
        orphansByDoc.set('__NO_DOCUMENT_ID__', bucket);
        continue;
      }

      if (!validIds.has(docId)) {
        const bucket = orphansByDoc.get(docId) || { name: docName, vectorIds: [] };
        bucket.vectorIds.push(match.id);
        orphansByDoc.set(docId, bucket);
      }
    }

    const summary = Array.from(orphansByDoc.entries()).map(([docId, info]) => ({
      documentId: docId,
      documentName: info.name,
      vectorCount: info.vectorIds.length,
    }));

    const totalOrphans = summary.reduce((sum, s) => sum + s.vectorCount, 0);

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        message: 'Nada borrado. Vuelve a llamar con ?dryRun=false para confirmar.',
        totalVectorsInPinecone: matches.length,
        validDocumentsInSupabase: validIds.size,
        orphanGroups: summary,
        totalOrphanVectors: totalOrphans,
      });
    }

    // 4. Borrar huérfanos (batches de 1000)
    let deleted = 0;
    for (const [, info] of orphansByDoc) {
      const ids = info.vectorIds;
      for (let i = 0; i < ids.length; i += 1000) {
        const batch = ids.slice(i, i + 1000);
        try {
          await ns.deleteMany(batch);
          deleted += batch.length;
        } catch (err) {
          console.error(`[CLEANUP] Failed to delete batch:`, err);
        }
      }
    }

    return NextResponse.json({
      dryRun: false,
      message: `Limpieza completada. ${deleted} vectores huérfanos eliminados.`,
      totalVectorsInPinecone: matches.length,
      validDocumentsInSupabase: validIds.size,
      orphanGroups: summary,
      totalDeleted: deleted,
    });
  } catch (error: unknown) {
    console.error('Error in cleanup-orphans:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
