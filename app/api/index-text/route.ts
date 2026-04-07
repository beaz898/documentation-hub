import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkText } from '@/lib/chunking';
import { randomUUID } from 'crypto';

export const maxDuration = 300;

/**
 * Indexes plain text directly (without going through Storage or file extraction).
 * Used by the improvement modal to save a corrected version.
 *
 * Body:
 *  - text: string - full corrected text
 *  - name: string - final document name shown in the sidebar
 *  - originalStoragePath?: string - if present, the original uploaded file will be removed from Storage
 *  - replaceExistingId?: string - if present, the existing document with that id will be deleted first
 *                                 (use this when the user chose "replace" in the prompt)
 *  - sizeBytes?: number
 */
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

    const body = await req.json();
    const { text, name, originalStoragePath, replaceExistingId, sizeBytes } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente para indexar (mínimo 50 caracteres)' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nombre de documento requerido' }, { status: 400 });
    }

    const documentId = randomUUID();
    const pineconeIndex = getIndex();

    // If the user chose "replace", delete the old indexed document first
    if (replaceExistingId) {
      console.log(`[INDEX-TEXT] Replacing existing document id=${replaceExistingId}`);
      const { data: oldDoc } = await supabase
        .from('documents')
        .select('id, chunk_count')
        .eq('id', replaceExistingId)
        .eq('org_id', orgId)
        .single();

      if (oldDoc) {
        const idsToDelete = Array.from(
          { length: oldDoc.chunk_count },
          (_, i) => `${oldDoc.id}-${i}`
        );
        for (let i = 0; i < idsToDelete.length; i += 1000) {
          await pineconeIndex.namespace(orgId).deleteMany(idsToDelete.slice(i, i + 1000));
        }
        await supabase.from('documents').delete().eq('id', oldDoc.id);
      }
    } else {
      // If NOT replacing, still check for name collision and bump the name if necessary.
      // This matches the current ingest behavior of replace-by-name, but here we only
      // want to avoid collisions since the user explicitly said "keep both".
      const { data: nameCollisions } = await supabase
        .from('documents')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', name);

      if (nameCollisions && nameCollisions.length > 0) {
        // Shouldn't normally happen because frontend adds the "(corregido DD/MM/YYYY)"
        // suffix, but just in case, we append a numeric counter.
        return NextResponse.json(
          { error: `Ya existe un documento con el nombre "${name}". Intenta de nuevo con otro nombre o usa la opción "Reemplazar".` },
          { status: 409 }
        );
      }
    }

    // Chunk the corrected text
    const chunks = chunkText(text, documentId, name, orgId);
    console.log(`[INDEX-TEXT] ${name}: ${chunks.length} chunks from ${text.length} chars`);

    // Embed
    const embeddings = await generateEmbeddings(chunks.map(c => c.text));

    // Upsert vectors
    const vectors = chunks.map((chunk, i) => ({
      id: `${documentId}-${i}`,
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        documentId: chunk.metadata.documentId,
        documentName: chunk.metadata.documentName,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        orgId: chunk.metadata.orgId,
      },
    }));

    for (let i = 0; i < vectors.length; i += 100) {
      await pineconeIndex.namespace(orgId).upsert(vectors.slice(i, i + 100));
    }

    // Save to Supabase
    await supabase.from('documents').insert({
      id: documentId,
      name,
      size_bytes: sizeBytes || Buffer.byteLength(text, 'utf-8'),
      chunk_count: chunks.length,
      org_id: orgId,
      user_id: user.id,
      status: 'indexed',
    });

    // Clean up the original uploaded file from Storage if provided
    if (originalStoragePath) {
      try {
        await supabase.storage.from('documents').remove([originalStoragePath]);
      } catch (err) {
        console.error('[INDEX-TEXT] Failed to remove original storage file:', err);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        name,
        chunks: chunks.length,
      },
    });
  } catch (error: unknown) {
    console.error('Error in /api/index-text:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
