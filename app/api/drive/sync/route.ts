import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkText, extractText } from '@/lib/chunking';
import { randomUUID } from 'crypto';

export const maxDuration = 300;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'text/html': 'html',
  'application/json': 'json',
  'application/vnd.google-apps.document': 'gdoc',
};

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

    const orgId = user.user_metadata?.org_id || user.id;
    const body = await req.json();
    const { folderId, folderName } = body;

    // Update folder selection
    if (folderId && folderName) {
      await supabase.from('drive_connections')
        .update({ folder_id: folderId, folder_name: folderName })
        .eq('org_id', orgId);
    }

    // Get connection
    const { data: connection } = await supabase.from('drive_connections')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'No hay conexión de Drive' }, { status: 404 });
    }

    // Refresh token if needed
    let accessToken = connection.access_token;
    if (new Date(connection.token_expires_at) < new Date()) {
      accessToken = await refreshAccessToken(connection.refresh_token, supabase, orgId);
      if (!accessToken) {
        return NextResponse.json({ error: 'Error renovando token de Google' }, { status: 401 });
      }
    }

    // List all files in the selected folder recursively
    const targetFolderId = folderId || connection.folder_id;
    console.log(`[DRIVE SYNC] Starting sync for folder: ${targetFolderId}`);

    const allFiles = await listFilesRecursive(accessToken, targetFolderId, '', null);
    console.log(`[DRIVE SYNC] Found ${allFiles.length} files`);

    // Get existing drive documents
    const { data: existingDocs } = await supabase.from('documents')
      .select('id, name, source_path, source_modified_at, chunk_count')
      .eq('org_id', orgId)
      .eq('source', 'google_drive');

    const existingMap = new Map(
      (existingDocs || []).map(d => [d.source_path, d])
    );

    // Determine what needs to be indexed
    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const pineconeIndex = getIndex();

    // Track which Drive file IDs we saw, to detect deletions afterwards
    const seenDriveIds = new Set<string>();

    for (const file of allFiles) {
      seenDriveIds.add(file.id);
      const existing = existingMap.get(file.id);

      // Skip if file hasn't changed
      if (existing && existing.source_modified_at && file.modifiedTime &&
          new Date(file.modifiedTime) <= new Date(existing.source_modified_at)) {
        skippedCount++;
        continue;
      }

      // Download file content
      let fileBuffer: Buffer;
      try {
        if (file.mimeType === 'application/vnd.google-apps.document') {
          // Export Google Docs as plain text
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!res.ok) continue;
          fileBuffer = Buffer.from(await res.arrayBuffer());
        } else {
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!res.ok) continue;
          fileBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch {
        console.error(`[DRIVE SYNC] Failed to download: ${file.name}`);
        continue;
      }

      // Extract text
      const ext = file.mimeType === 'application/vnd.google-apps.document' ? 'txt' :
                  ALLOWED_MIME_TYPES[file.mimeType] || file.name.split('.').pop() || 'txt';

      let text: string;
      try {
        text = await extractText(fileBuffer, `${file.name}.${ext}`);
      } catch {
        console.error(`[DRIVE SYNC] Failed to extract text: ${file.name}`);
        continue;
      }

      if (!text || text.trim().length < 50) continue;

      const documentId = randomUUID();

      // If updating, delete old vectors
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

      // Chunk and embed
      const chunks = chunkText(text, documentId, file.name, orgId);
      const embeddings = await generateEmbeddings(chunks.map(c => c.text));

      // Upsert to Pinecone
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
          source: 'google_drive',
          folderPath: file.folderPath,
        },
      }));

      for (let i = 0; i < vectors.length; i += 100) {
        await pineconeIndex.namespace(orgId).upsert(vectors.slice(i, i + 100));
      }

      // Save to Supabase
      await supabase.from('documents').insert({
        id: documentId,
        name: file.name,
        size_bytes: fileBuffer.byteLength,
        chunk_count: chunks.length,
        org_id: orgId,
        user_id: user.id,
        status: 'indexed',
        source: 'google_drive',
        source_path: file.id,
        source_modified_at: file.modifiedTime,
        folder_path: file.folderPath,
        folder_id: file.parentId,
      });

      console.log(`[DRIVE SYNC] Indexed: ${file.name} (${chunks.length} chunks) [${file.folderPath}]`);
    }

    // ========================================
    // DETECT DELETIONS: any existing doc whose source_path is not in seenDriveIds
    // means the file has been deleted (or moved out of the synced folder) in Drive.
    // ========================================
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

    // Update last synced
    await supabase.from('drive_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('org_id', orgId);

    console.log(`[DRIVE SYNC] Complete: ${newCount} new, ${updatedCount} updated, ${deletedCount} deleted, ${skippedCount} unchanged`);

    return NextResponse.json({
      success: true,
      stats: {
        new: newCount,
        updated: updatedCount,
        deleted: deletedCount,
        skipped: skippedCount,
        total: allFiles.length,
      },
    });
  } catch (error: unknown) {
    console.error('Error in /api/drive/sync:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: Get folder structure
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

    const { data: connection } = await supabase.from('drive_connections')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    // Refresh token if needed
    let accessToken = connection.access_token;
    if (new Date(connection.token_expires_at) < new Date()) {
      accessToken = await refreshAccessToken(connection.refresh_token, supabase, orgId);
      if (!accessToken) {
        return NextResponse.json({ connected: false, error: 'Token expirado' });
      }
    }

    // Get folder structure
    const folders = await listFolders(accessToken, connection.folder_id);

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

// Helper: Refresh Google access token
async function refreshAccessToken(
  refreshToken: string,
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string
): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    await supabase.from('drive_connections')
      .update({
        access_token: data.access_token,
        token_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      })
      .eq('org_id', orgId);

    return data.access_token;
  } catch {
    return null;
  }
}

// Helper: List all files recursively in a folder
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  folderPath: string;
  parentId: string | null;
}

async function listFilesRecursive(
  accessToken: string,
  folderId: string,
  currentPath: string,
  parentId: string | null,
): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];

  // FIX: include modifiedTime in fields (was missing — caused skip-detection to never work)
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime)&orderBy=name&pageSize=1000`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return allFiles;

  const data = await res.json();
  const files = data.files || [];

  for (const file of files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      // Recurse into subfolders
      const subPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      const subFiles = await listFilesRecursive(accessToken, file.id, subPath, file.id);
      allFiles.push(...subFiles);
    } else if (ALLOWED_MIME_TYPES[file.mimeType] ||
               ['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'html'].includes(
                 file.name.split('.').pop()?.toLowerCase() || ''
               )) {
      allFiles.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        folderPath: currentPath || '/',
        parentId: parentId,
      });
    }
  }

  return allFiles;
}

// Helper: List folders (one level) for the folder picker
async function listFolders(accessToken: string, parentId: string) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)&orderBy=name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];
  const data = await res.json();

  const folders = [];
  for (const folder of (data.files || [])) {
    // Count files in each subfolder
    const countRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+trashed=false&fields=files(id)&pageSize=1000`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const countData = await countRes.json();
    folders.push({
      id: folder.id,
      name: folder.name,
      fileCount: (countData.files || []).length,
    });
  }

  return folders;
}
