import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';
import { getIndex } from '@/lib/pinecone';

/**
 * GET /api/documents/coverage/[id]?days=30
 * Admin-only. Returns which chunks of a document have been used in chat queries
 * and fetches the actual text of those chunks from Pinecone.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    if (org.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden ver la cobertura.' }, { status: 403 });
    }

    const { id: documentId } = await params;
    const days = Math.max(1, parseInt(req.nextUrl.searchParams.get('days') || '30', 10));
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Verify the document belongs to this org
    const { data: docRow, error: docErr } = await supabase
      .from('documents')
      .select('id, name, org_id')
      .eq('id', documentId)
      .eq('org_id', org.orgId)
      .single();

    if (docErr || !docRow) {
      return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
    }

    // Gather all chunk indices used in queries for this document in the time window
    const { data: queryRows } = await supabase
      .from('chat_queries')
      .select('documents_used')
      .eq('org_id', org.orgId)
      .gte('created_at', since.toISOString());

    const usedChunkSet = new Set<number>();
    let totalChunks = 0;

    for (const row of queryRows || []) {
      const docs = row.documents_used as Array<{
        documentId?: string;
        chunks?: number[];
        totalChunks?: number;
      }> | null;
      if (!Array.isArray(docs)) continue;
      for (const d of docs) {
        if (d.documentId !== documentId) continue;
        if (Array.isArray(d.chunks)) {
          for (const c of d.chunks) usedChunkSet.add(c);
        }
        if (typeof d.totalChunks === 'number' && d.totalChunks > totalChunks) {
          totalChunks = d.totalChunks;
        }
      }
    }

    // If we never saw totalChunks in queries, fall back to counting vectors in Pinecone
    // by fetching the document row's chunk count if available
    if (totalChunks === 0) {
      const { data: chunkCountRow } = await supabase
        .from('documents')
        .select('chunk_count')
        .eq('id', documentId)
        .single();
      if (chunkCountRow?.chunk_count) totalChunks = chunkCountRow.chunk_count;
    }

    const usedChunkIndices = [...usedChunkSet].sort((a, b) => a - b);

    // Fetch text for used chunks from Pinecone
    let usedChunks: Array<{ chunkIndex: number; text: string }> = [];
    if (usedChunkIndices.length > 0) {
      try {
        const vectorIds = usedChunkIndices.map(i => `${documentId}-${i}`);
        const ns = getIndex().namespace(org.orgId);
        const fetchResult = await ns.fetch(vectorIds);
        const records = fetchResult.records || {};

        usedChunks = usedChunkIndices.map(i => ({
          chunkIndex: i,
          text: String((records[`${documentId}-${i}`]?.metadata?.text) ?? ''),
        }));
      } catch (err) {
        console.warn('[coverage] Pinecone fetch failed:', err instanceof Error ? err.message : err);
        usedChunks = usedChunkIndices.map(i => ({ chunkIndex: i, text: '' }));
      }
    }

    // Build unused chunk list (only if we know totalChunks)
    const unusedChunks: number[] = [];
    if (totalChunks > 0) {
      for (let i = 0; i < totalChunks; i++) {
        if (!usedChunkSet.has(i)) unusedChunks.push(i);
      }
    }

    return NextResponse.json({
      success: true,
      documentId,
      documentName: docRow.name,
      totalChunks,
      chunksUsados: usedChunkIndices.length,
      percentage: totalChunks > 0 ? Math.round((usedChunkIndices.length / totalChunks) * 100) : 0,
      usedChunks,
      unusedChunks,
    });
  } catch (error: unknown) {
    console.error('[coverage]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
