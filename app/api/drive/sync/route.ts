import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { upsertVectors, deleteVectorsByIds } from '@/lib/pinecone/vectors';
import { deleteDocument, getTombstonedIdentities, tombstoneKey } from '@/lib/delete-document';
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
      const { error: folderError } = await supabase.from('drive_connections')
        .update({ folder_id: folderId, folder_name: folderName })
        .eq('org_id', orgId);
      if (folderError) {
        console.error(`[DRIVE SYNC] update-folder fallo | org=${orgId} | code=${folderError.code ?? '?'} | ${folderError.message}`);
      }
    }

    const { data: connection, error: connectionError } = await supabase.from('drive_connections')
      .select('*')
      .eq('org_id', orgId)
      .single();
    if (connectionError) {
      console.error(`[DRIVE SYNC] select-connection fallo | org=${orgId} | code=${connectionError.code ?? '?'} | ${connectionError.message}`);
      return NextResponse.json({ error: 'Error al leer la conexion de Drive' }, { status: 500 });
    }

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
        const { error: tokenUpdateError } = await supabase.from('drive_connections')
          .update({
            access_token: encrypt(newTokens.accessToken),
            token_expires_at: newTokens.expiresAt.toISOString(),
          })
          .eq('org_id', orgId);
        if (tokenUpdateError) {
          console.error(`[DRIVE SYNC] update-token fallo | org=${orgId} | code=${tokenUpdateError.code ?? '?'} | ${tokenUpdateError.message}`);
        }
      } catch {
        return NextResponse.json({ error: 'Error renovando token de acceso' }, { status: 401 });
      }
    }

    const targetFolderId = folderId || connection.folder_id;
    console.log(`[DRIVE SYNC] Starting sync for folder: ${targetFolderId}`);

    const allFiles = await provider.listFiles(accessToken, targetFolderId);
    console.log(`[DRIVE SYNC] Found ${allFiles.length} files`);

    const { data: existingDocs, error: existingError } = await supabase.from('documents')
      .select('id, name, provider_file_id, source_modified_at, chunk_count')
      .eq('org_id', orgId)
      .eq('source', provider.name);
    if (existingError) {
      // Critico: sin la lista de documentos existentes, el sync trataria
      // todo el corpus como nuevo (reindexando y duplicando) y no detectaria
      // borrados. Abortar es la unica opcion segura.
      console.error(`[DRIVE SYNC] select-existing fallo | org=${orgId} | source=${provider.name} | code=${existingError.code ?? '?'} | ${existingError.message}`);
      return NextResponse.json({ error: 'Error al leer los documentos existentes; sync cancelado' }, { status: 500 });
    }

    const existingMap = new Map(
      (existingDocs || []).map(d => [d.provider_file_id, d])
    );

    // Lápidas: identidades excluidas a propósito por el usuario. Se cargan una
    // sola vez (no una consulta por archivo) y se consultan antes de importar
    // para no reimportar lo que se quitó del corpus (C.2 paso 4).
    const tombstonedIdentities = await getTombstonedIdentities(supabase, orgId);

    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let skippedExcludedCount = 0;
    let failedCount = 0;
    const seenDriveIds = new Set<string>();

    for (const file of allFiles) {
      seenDriveIds.add(file.id);
      const existing = existingMap.get(file.id);

      // Si el archivo tiene lápida, fue excluido a propósito: no reimportar.
      // Se comprueba antes de descargar para no gastar la descarga.
      if (tombstonedIdentities.has(tombstoneKey(provider.name, file.id))) {
        skippedExcludedCount++;
        console.log(`[DRIVE SYNC] Saltado por exclusión (lápida): ${file.name}`);
        continue;
      }

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

      const isReplacement = Boolean(existing);
      if (existing) {
        const idsToDelete = Array.from(
          { length: existing.chunk_count },
          (_, i) => `${existing.id}-${i}`
        );
        await deleteVectorsByIds(orgId, idsToDelete);
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .eq('id', existing.id);
        if (deleteError) {
          // No se pudo borrar la fila vieja: no seguimos con el insert de la
          // nueva para no dejar dos filas de la misma identidad. Se registra
          // y se cuenta como fallo.
          console.error(
            `[DRIVE SYNC] delete-old fallo | org=${orgId} | file=${file.id} | name=${file.name} | code=${deleteError.code ?? '?'} | ${deleteError.message}`
          );
          failedCount++;
          continue;
        }
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
          analysisStatus: 'pendiente',
        },
      }));

      await upsertVectors(orgId, vectors);

      const contentHash = generateContentHash(text);

      const { error: insertError } = await supabase.from('documents').insert({
        id: documentId,
        name: file.name,
        size_bytes: Buffer.byteLength(text, 'utf8'),
        chunk_count: chunks.length,
        org_id: orgId,
        user_id: user.id,
        status: 'indexed',
        source: provider.name,
        analysis_status: 'pendiente',   // Drive entra sin analizar: irá a la bandeja de revisión
        provider_file_id: file.id,
        source_modified_at: file.modifiedTime,
        folder_path: file.folderPath ?? '/',
        folder_id: file.parentId ?? null,
        full_text: text,
        content_hash: contentHash,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          // Violacion del indice unico de identidad (documents_identity_unique):
          // algo intento crear una segunda fila con la misma (org_id, source,
          // provider_file_id). No deberia pasar (el sync empareja antes), pero
          // si suena, es ESA alarma y no un error de BD generico.
          console.error(
            `[DRIVE SYNC] IDENTIDAD DUPLICADA (23505) | org=${orgId} | file=${file.id} | name=${file.name} | provider=${provider.name} | ${insertError.message}`
          );
        } else {
          console.error(
            `[DRIVE SYNC] insert fallo | org=${orgId} | file=${file.id} | name=${file.name} | replacement=${isReplacement} | code=${insertError.code ?? '?'} | ${insertError.message}`
          );
        }
        // Si era un reemplazo, la fila vieja ya se borro arriba: el documento
        // queda en mal estado (sin fila, con vectores nuevos en Pinecone). C.3
        // resolvera el orden para prevenirlo; C.1c solo lo hace AUDIBLE.
        failedCount++;
        continue;
      }

      // Insert OK: recien ahora contamos el exito, no antes.
      if (isReplacement) {
        updatedCount++;
      } else {
        newCount++;
      }

      console.log(`[DRIVE SYNC] Indexed: ${file.name} (${chunks.length} chunks) [${file.folderPath ?? '/'}]`);
    }

    // Detect deletions: docs whose provider_file_id is no longer in Drive
    let deletedCount = 0;
    const docsToDelete = (existingDocs || []).filter(d => !seenDriveIds.has(d.provider_file_id));

    let deleteFailedCount = 0;
    for (const doc of docsToDelete) {
      // Borrado remoto: el archivo desapareció del proveedor. reason='remote_deleted'
      // => sin lápida (no hay reimportación que bloquear, y una lápida impediría
      // restaurarlo si el usuario lo recupera en su Drive). Borrado vía la función
      // compartida de C.2 (vectores + fila, con .error verificado).
      const result = await deleteDocument(supabase, {
        orgId,
        documentId: doc.id,
        reason: 'remote_deleted',
      });
      if (result.ok) {
        deletedCount++;
        console.log(`[DRIVE SYNC] Deleted ${doc.name}`);
      } else {
        console.error(`[DRIVE SYNC] delete failed | doc=${doc.id} | name=${doc.name} | ${result.error ?? 'error desconocido'}`);
        deleteFailedCount++;
      }
    }

    const { error: syncedAtError } = await supabase.from('drive_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('org_id', orgId);
    if (syncedAtError) {
      console.error(`[DRIVE SYNC] update-last-synced fallo | org=${orgId} | code=${syncedAtError.code ?? '?'} | ${syncedAtError.message}`);
    }

    console.log(`[DRIVE SYNC] Complete: ${newCount} new, ${updatedCount} updated, ${deletedCount} deleted, ${skippedCount} unchanged, ${failedCount} failed, ${deleteFailedCount} delete-failed, ${skippedExcludedCount} excluded`);

    return NextResponse.json({
      success: failedCount === 0,
      stats: {
        new: newCount,
        updated: updatedCount,
        deleted: deletedCount,
        skipped: skippedCount,
        skippedExcluded: skippedExcludedCount,
        failed: failedCount,
        deleteFailed: deleteFailedCount,
        total: allFiles.length,
      },
    });
  } catch (error: unknown) {
    console.error('Error in /api/drive/sync:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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
      provider: provider.name,
    });
  } catch (error: unknown) {
    console.error('Error getting drive status:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
