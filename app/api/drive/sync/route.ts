import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkText } from '@/lib/chunking';
import { randomUUID } from 'crypto';
import { decrypt, encrypt } from '@/lib/crypto';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { resolveOrg } from '@/lib/org';
import { getOrgFeatures } from '@/lib/plan-features';
import { getProvider } from '@/lib/drive/registry';

export const maxDuration = 300;

// POST: Set folder and trigger initial sync
// GET: Get sync status and folder structure
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

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    const features = await getOrgFeatures(supabase, orgId);
    if (!features.hasDrive) {
      return NextResponse.json(
        { error: 'Google Drive disponible a partir del plan Pro' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { folderId, folderName } = body;

    if (folderId && folderName) {
      await supabase.from('drive_connections')
        .update({ folder_id: folderId, folder_name: folderName })
        .eq('org_id', orgId);
    }

    const { data: connection } = await supabase.from('drive_connections')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'No hay conexión de Drive' }, { status: 404 });
    }

    const provider = getProvider(connection.provider || 'google_drive');

    // Refresh token if needed
    let accessToken: string = decrypt(connection.access_token);
    if (new Date(connection.token_expires_at) < new Date()) {
      try {
        const newTokens = await provider.refreshAccessToken(decrypt(connection.refresh_token));
        accessToken = newTokens.accessToken;
        await supabase.from('drive_connections')
          .update({
            access_token: encrypt(newTokens.accessToken),
            token_expires_at: newTokens.expiresAt.toISOString(),
          })
          .eq('org_id', orgId);
      } catch {
        return NextResponse.json({ error: 'Error renovando token de acceso' }, { status: 401 });
      }
    }

    const targetFolderId = folderId || connection.folder_id;
    console.log(`[DRIVE SYNC] Starting sync for folder: ${targetFolderId}`);

    const allFiles = await provider.listFiles(accessToken, targetFolderId);
    console.log(`[DRIVE SYNC] Found ${allFiles.length} files`);

    const { data: existingDocs } = await supabase.from('documents')
      .select('id, name, source_path, source_modified_at, chunk_count')
      .eq('org_id', orgId)
      .eq('source', provider.name);

    const existingMap = new Map(
      (existingDocs || []).map(d => [d.source_path, d])
    );

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const pineconeIndex = getIndex();
    const seenDriveIds = new Set<string>();

    for (const file of allFiles) {
      seenDriveIds.add(file.id);
      const existing = existingMap.get(file.id);

      if (existing && existing.source_modified_at && file.modifiedTime &&
          new Date(file.modifiedTime) <= new Date(existing.source_modified_at)) {
        skippedCount++;
        continue;
      }

      let text: string;
      try {
        text = await provider.downloadFile(accessToken, file.id, file.mimeType);
      } catch {
        console.error(`[DRIVE SYNC] Failed to download: ${file.name}`);
        continue;
      }

      if (!text || text.trim().length < 50) continue;

      const documentId = randomUUID();

      if (existing) {
        const idsToDelete = Array.from(
          { length: existing.chunk_count },
          (_, i) => `${existing.id}-${i}`
        );
        for (let i = 0; i < idsToDelete.length; i += 1000) {
          await pineconeIndex.namespace(orgId).deleteMany(idsToDelete.slice(i, i + 1000));
        }
        await supabase.from('documents').delete().eq('id', existing.id);
        updatedCount++;
      } else {
        newCount++;
      }

      const chunks = chunkText(text, documentId, file.name, orgId);
      const embeddings = await generateEmbeddings(chunks.map(c => c.text));

      const vectors = chunks.map((chunk, i) => ({
        id: `${documentId}-${i}`,
        values: embeddings[i],
        metadata: {
          text: chunk.text,
          documentId,
          documentName: file.name,
          chunkIndex: i,
          totalChunks: chunks.length,
          orgId,
          source: provider.name,
          folderPath: file.folderPath ?? '/',
        },
      }));

      for (let i = 0; i < vectors.length; i += 100) {
        await pineconeIndex.namespace(orgId).upsert(vectors.slice(i, i + 100));
      }

      const contentHash = generateContentHash(text);

      await supabase.from('documents').insert({
        id: documentId,
        name: file.name,
        size_bytes: Buffer.byteLength(text, 'utf8'),
        chunk_count: chunks.length,
        org_id: orgId,
        user_id: user.id,
        status: 'indexed',
        source: provider.name,
        source_path: file.id,
        source_modified_at: file.modifiedTime,
        folder_path: file.folderPath ?? '/',
        folder_id: file.parentId ?? null,
        full_text: text,
        content_hash: contentHash,
      });

      console.log(`[DRIVE SYNC] Indexed: ${file.name} (${chunks.length} chunks) [${file.folderPath ?? '/'}]`);
    }

    // Detect deletions: docs whose source_path is no longer in Drive
    let deletedCount = 0;
    const docsToDelete = (existingDocs || []).filter(d => !seenDriveIds.has(d.source_path));

    for (const doc of docsToDelete) {
      try {
        const idsToDelete = Array.from(
          { length: doc.chunk_count },
          (_, i) => `${doc.id}-${i}`
        );
        for (let i = 0; i < idsToDelete.length; i += 1000) {
          await pineconeIndex.namespace(orgId).deleteMany(idsToDelete.slice(i, i + 1000));
        }
        await supabase.from('documents').delete().eq('id', doc.id);
        deletedCount++;
        console.log(`[DRIVE SYNC] Deleted (no longer in Drive): ${doc.name}`);
      } catch (err) {
        console.error(`[DRIVE SYNC] Failed to delete ${doc.name}:`, err);
      }
    }

    await supabase.from('drive_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('org_id', orgId);

    console.log(`[DRIVE SYNC] Complete: ${newCount} new, ${updatedCount} updated, ${deletedCount} deleted, ${skippedCount} unchanged`);

    return NextResponse.json({
      success: true,
      stats: { new: newCount, updated: updatedCount, deleted: deletedCount, skipped: skippedCount, total: allFiles.length },
    });
  } catch (error: unknown) {
    console.error('Error in /api/drive/sync:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    const featuresGet = await getOrgFeatures(supabase, orgId);
    if (!featuresGet.hasDrive) {
      return NextResponse.json(
        { error: 'Google Drive disponible a partir del plan Pro' },
        { status: 403 }
      );
    }

    const { data: connection } = await supabase.from('drive_connections')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    const provider = getProvider(connection.provider || 'google_drive');

    let accessToken: string = decrypt(connection.access_token);
    if (new Date(connection.token_expires_at) < new Date()) {
      try {
        const newTokens = await provider.refreshAccessToken(decrypt(connection.refresh_token));
        accessToken = newTokens.accessToken;
        await supabase.from('drive_connections')
          .update({
            access_token: encrypt(newTokens.accessToken),
            token_expires_at: newTokens.expiresAt.toISOString(),
          })
          .eq('org_id', orgId);
      } catch {
        return NextResponse.json({ connected: false, error: 'Token expirado' });
      }
    }

    const folders = await provider.listFolders(accessToken, connection.folder_id);

    return NextResponse.json({
      connected: true,
      email: connection.email,
      folderId: connection.folder_id,
      folderName: connection.folder_name,
      lastSynced: connection.last_synced_at,
      folders,
    });
  } catch (error: unknown) {
    console.error('Error getting drive status:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
