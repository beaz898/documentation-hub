import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';
import { upsertVectors, deleteVectorsByIds, listVectorIdsByPrefix, fetchVectors, buildVectorId } from '@/lib/pinecone/vectors';
import { swapDocumentVectors } from '@/lib/document-swap';

// ENDPOINT TEMPORAL — verificación de C.4c (swapDocumentVectors). BORRAR al validar.
// Doble candado: (1) solo admin; (2) solo opera sobre TEST_DOC_ID (nunca datos reales).
const TEST_DOC_ID = '00000000-0000-4000-8000-000000000abc';

function dummyVector(dim = 1024): number[] {
  return new Array(dim).fill(0).map((_, i) => (i === 0 ? 0.1 : 0.0));
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'Sin organización' }, { status: 403 });
  if (org.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 });

  const orgId = org.orgId;
  const action = req.nextUrl.searchParams.get('action');

  try {
    if (action === 'seed') {
      // Fila real en documents (necesaria por la FK de document_staged). active_generation=1.
      await supabase.from('documents').upsert({
        id: TEST_DOC_ID,
        org_id: orgId,
        user_id: user.id,
        name: 'TEST-SWAP (borrar)',
        source: 'manual',
        full_text: 'contenido g1 (viejo)',
        content_hash: 'hash-g1',
        chunk_count: 2,
        size_bytes: 20,
        analysis_status: 'analizado',
        active_generation: 1,
      });
      // Vectores g1 (activa, analizado): docId-0, docId-1.
      // Vectores g2 (staged, pendiente): docId-g2-0, docId-g2-1.
      await upsertVectors(orgId, [
        { id: buildVectorId(TEST_DOC_ID, 1, 0), values: dummyVector(), metadata: { text: 'g1c0', documentId: TEST_DOC_ID, documentName: 'TEST-SWAP', chunkIndex: 0, totalChunks: 2, analysisStatus: 'analizado', generation: 1, orgId } },
        { id: buildVectorId(TEST_DOC_ID, 1, 1), values: dummyVector(), metadata: { text: 'g1c1', documentId: TEST_DOC_ID, documentName: 'TEST-SWAP', chunkIndex: 1, totalChunks: 2, analysisStatus: 'analizado', generation: 1, orgId } },
        { id: buildVectorId(TEST_DOC_ID, 2, 0), values: dummyVector(), metadata: { text: 'g2c0', documentId: TEST_DOC_ID, documentName: 'TEST-SWAP', chunkIndex: 0, totalChunks: 2, analysisStatus: 'pendiente', generation: 2, orgId } },
        { id: buildVectorId(TEST_DOC_ID, 2, 1), values: dummyVector(), metadata: { text: 'g2c1', documentId: TEST_DOC_ID, documentName: 'TEST-SWAP', chunkIndex: 1, totalChunks: 2, analysisStatus: 'pendiente', generation: 2, orgId } },
      ]);
      // Fila staged (generación 2 esperando swap).
      await supabase.from('document_staged').upsert({
        document_id: TEST_DOC_ID,
        org_id: orgId,
        generation: 2,
        full_text: 'contenido g2 (nuevo)',
        content_hash: 'hash-g2',
        chunk_count: 2,
        size_bytes: 20,
        source_modified_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, action: 'seed', message: 'Escenario creado: docs g1 activa + g2 staged.' });
    }

    if (action === 'swap') {
      const result = await swapDocumentVectors(supabase, orgId, TEST_DOC_ID);
      return NextResponse.json({ ok: true, action: 'swap', result });
    }

    if (action === 'inspect') {
      const ids = await listVectorIdsByPrefix(orgId, TEST_DOC_ID);
      const vecs = ids.length > 0 ? await fetchVectors(orgId, ids) : {};
      const vectorState = Object.values(vecs).map((v: any) => ({ id: v.id, generation: v.metadata?.generation, analysisStatus: v.metadata?.analysisStatus }));
      const { data: doc } = await supabase.from('documents').select('id, active_generation, content_hash, chunk_count, analysis_status').eq('id', TEST_DOC_ID).maybeSingle();
      const { data: staged } = await supabase.from('document_staged').select('document_id, generation').eq('document_id', TEST_DOC_ID).maybeSingle();
      return NextResponse.json({ ok: true, action: 'inspect', vectors: vectorState.sort((a, b) => a.id.localeCompare(b.id)), documentRow: doc, stagedRow: staged });
    }

    // Fabricar estado "muerto tras P1": g2 ya marcada analizado, staged aún presente, fila aún g1.
    if (action === 'force-p1') {
      await upsertVectors(orgId, [
        { id: buildVectorId(TEST_DOC_ID, 2, 0), values: dummyVector(), metadata: { text: 'g2c0', documentId: TEST_DOC_ID, documentName: 'TEST-SWAP', chunkIndex: 0, totalChunks: 2, analysisStatus: 'analizado', generation: 2, orgId } },
        { id: buildVectorId(TEST_DOC_ID, 2, 1), values: dummyVector(), metadata: { text: 'g2c1', documentId: TEST_DOC_ID, documentName: 'TEST-SWAP', chunkIndex: 1, totalChunks: 2, analysisStatus: 'analizado', generation: 2, orgId } },
      ]);
      return NextResponse.json({ ok: true, action: 'force-p1', message: 'g2 marcada analizado (simula muerte tras P1). Ahora llama a swap.' });
    }

    if (action === 'cleanup') {
      const ids = await listVectorIdsByPrefix(orgId, TEST_DOC_ID);
      if (ids.length > 0) await deleteVectorsByIds(orgId, ids);
      await supabase.from('document_staged').delete().eq('document_id', TEST_DOC_ID);
      await supabase.from('documents').delete().eq('id', TEST_DOC_ID);
      return NextResponse.json({ ok: true, action: 'cleanup', message: 'Documento de prueba borrado (vectores + filas).' });
    }

    return NextResponse.json({ error: 'action inválida', validActions: ['seed', 'swap', 'inspect', 'force-p1', 'cleanup'] }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
