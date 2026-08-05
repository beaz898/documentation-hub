import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { upsertVectors, deleteVectorsByIds, listVectorIdsByPrefix, buildVectorId, parseVectorId } from '@/lib/pinecone/vectors';
import { deleteDocument, getTombstonedIdentities, tombstoneKey } from '@/lib/delete-document';
import { checkUploadLock } from '@/lib/upload-lock';
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

    // Candado (B.64): el sync es una mutación mayor del corpus (escribe, actualiza
    // y borra). Si otro usuario tiene el candado, se rechaza con 423 visible.
    // El portador no se bloquea a sí mismo.
    const lockCheck = await checkUploadLock(supabase, orgId, user.id);
    if (lockCheck.locked) {
      return NextResponse.json(
        { error: `El corpus está bloqueado por ${lockCheck.lockedByEmail || 'otro usuario'}. Espera a que termine.`, errorType: 'upload_locked' },
        { status: 423 }
      );
    }

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
      .select('id, name, provider_file_id, source_modified_at, chunk_count, analysis_status, active_generation')
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

    // C.4d (F-5 remache i): cargar los staged de la org en lote (patrón anti-N+1).
    // La fila document_staged es el marcador de "versión pendiente de validar" (F-3)
    // y trae el source_modified_at del último cambio no validado (F-5 remache ii).
    const { data: stagedRows, error: stagedError } = await supabase
      .from('document_staged')
      .select('document_id, generation, source_modified_at, chunk_count')
      .eq('org_id', orgId);
    if (stagedError) {
      console.error(`[DRIVE SYNC] Error cargando document_staged | org=${orgId} | ${stagedError.message}`);
      return NextResponse.json({ error: 'Error al cargar versiones pendientes' }, { status: 500 });
    }
    const stagedMap = new Map((stagedRows || []).map(s => [s.document_id, s]));

    // Lápidas: identidades excluidas a propósito por el usuario. Se cargan una
    // sola vez (no una consulta por archivo) y se consultan antes de importar
    // para no reimportar lo que se quitó del corpus (C.2 paso 4).
    const tombstonedIdentities = await getTombstonedIdentities(supabase, orgId);

    let newCount = 0;
    let updatedCount = 0;
    let versionedCount = 0;
    let skippedCount = 0;
    let skippedExcludedCount = 0;
    let failedCount = 0;
    const seenDriveIds = new Set<string>();

    for (const file of allFiles) {
      seenDriveIds.add(file.id);
      const existing = existingMap.get(file.id);

      // Lápida: excluido a propósito, no reimportar. Antes de descargar.
      if (tombstonedIdentities.has(tombstoneKey(provider.name, file.id))) {
        skippedExcludedCount++;
        console.log(`[DRIVE SYNC] Saltado por exclusión (lápida): ${file.name}`);
        continue;
      }

      // Sin cambios desde el último sync: saltar.
      if (existing && existing.source_modified_at && file.modifiedTime &&
          new Date(file.modifiedTime) <= new Date(existing.source_modified_at)) {
        skippedCount++;
        continue;
      }

      // Todo el procesamiento del archivo va en try/catch: un archivo que falla
      // se cuenta como failed y el sync SIGUE con los demás (aislamiento honesto).
      // La fila vieja NUNCA se borra en reemplazo: se actualiza en sitio (C.3).
      try {
        const text = await provider.downloadFile(accessToken, file.id, file.mimeType);
        if (!text || text.trim().length < 50) {
          console.warn(`[DRIVE SYNC] Texto vacío o muy corto, se omite: ${file.name}`);
          continue;
        }

        const isReplacement = Boolean(existing);
        // En reemplazo se CONSERVA el documentId viejo (update en sitio).
        const documentId = existing ? existing.id : randomUUID();

        // C.4d-1: decidir la generación objetivo ANTES de construir los vectores (F-5 R1).
        // - Versionar (doc 'analizado': hay versión validada que el chat sirve → protegerla):
        //     targetGen = staged existente (reutiliza su generación, F-4(2)) o active_generation+1.
        // - Sobrescribir (doc 'pendiente': nada validado): targetGen = active_generation (F-5 R1: NO 1).
        // - Doc nuevo: targetGen = 1.
        const stagedRow = existing ? stagedMap.get(existing.id) : undefined;
        let targetGen: number;
        let isVersioning = false;
        if (existing && existing.analysis_status === 'analizado') {
          targetGen = stagedRow ? stagedRow.generation : (existing.active_generation ?? 1) + 1;
          isVersioning = true;
        } else if (existing) {
          targetGen = existing.active_generation ?? 1;
        } else {
          targetGen = 1;
        }

        const chunks = chunkText(text, documentId, file.name, orgId);
        const embeddings = await generateEmbeddings(chunks.map(c => c.text));
        const contentHash = generateContentHash(text);

        const vectors = chunks.map((chunk, i) => ({
          id: buildVectorId(documentId, targetGen, i),
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
            generation: targetGen,
          },
        }));

        // Construir antes de destruir: subir los vectores nuevos primero.
        await upsertVectors(orgId, vectors);

        if (isReplacement) {
          // Borrar "zombis": chunks de la versión vieja que sobran si la nueva
          // tiene menos. Fuente de verdad = lo que HAY en Pinecone, no chunk_count.
          const existingIds = await listVectorIdsByPrefix(orgId, documentId);
          const newChunkCount = chunks.length;
          const zombieIds: string[] = [];
          let anomalies = 0;
          for (const id of existingIds) {
            const parsed = parseVectorId(id);
            if (parsed === null) {
              anomalies++;
              console.warn(`[DRIVE SYNC] ID de vector anómalo (no parsea): ${id} | doc=${documentId}`);
              continue;
            }
            // Al versionar: recortar zombis SOLO dentro de la generación objetivo
            // (F-4(2)), sin tocar la activa. Al sobrescribir: como hoy (la generación
            // activa es la única, targetGen === active_generation).
            if (parsed.generation === targetGen && parsed.chunkIndex >= newChunkCount) {
              zombieIds.push(id);
            }
          }
          if (anomalies > 0) {
            console.warn(`[DRIVE SYNC] ${anomalies} IDs anómalos en doc=${documentId} (${file.name})`);
          }
          if (zombieIds.length > 0) {
            await deleteVectorsByIds(orgId, zombieIds);
            console.log(`[DRIVE SYNC] Zombis borrados: ${zombieIds.length} | doc=${documentId} | ${file.name}`);
          }

          if (isVersioning) {
            // C.4d-1 rama VERSIONAR: NO tocar la fila documents ni la generación
            // activa. Guardar la versión nueva en document_staged (marcador F-3).
            // Vectores ya subidos arriba (gN, pendiente); la fila staged va AL FINAL
            // (F-5 R3: la señal se escribe cuando lo demás ya existe). Reutiliza la
            // generación si ya había staged (F-4(2)); upsert por PK document_id.
            const { error: stagedUpsertError } = await supabase
              .from('document_staged')
              .upsert({
                document_id: documentId,
                org_id: orgId,
                generation: targetGen,
                full_text: text,
                content_hash: contentHash,
                chunk_count: chunks.length,
                size_bytes: Buffer.byteLength(text, 'utf8'),
                source_modified_at: file.modifiedTime,
              });
            if (stagedUpsertError) {
              console.error(`[DRIVE SYNC] staged-upsert fallo | doc=${documentId} | name=${file.name} | code=${stagedUpsertError.code ?? '?'} | ${stagedUpsertError.message}`);
              failedCount++;
              continue;
            }
            versionedCount++;
            console.log(`[DRIVE SYNC] Versionado (staged g${targetGen}): ${file.name} (${chunks.length} chunks) — el chat sigue sirviendo la versión activa`);
          } else {
            // RAMA SOBRESCRIBIR (C.3, sin cambios): UPDATE atómico en sitio.
            // source_modified_at avanza SOLO aquí (cerrojo del reintento).
            const { error: updateError } = await supabase
              .from('documents')
              .update({
                name: file.name,
                size_bytes: Buffer.byteLength(text, 'utf8'),
                chunk_count: chunks.length,
                status: 'indexed',
                analysis_status: 'pendiente',
                source_modified_at: file.modifiedTime,
                folder_path: file.folderPath ?? '/',
                folder_id: file.parentId ?? null,
                full_text: text,
                content_hash: contentHash,
              })
              .eq('id', documentId)
              .eq('org_id', orgId);

            if (updateError) {
              // Update falló tras subir vectores: Pinecone adelantado, fila vieja
              // intacta (no se borró). Recuperable: source_modified_at no avanzó,
              // el próximo sync reintenta. Se cuenta como fallo.
              console.error(`[DRIVE SYNC] update-en-sitio fallo | org=${orgId} | doc=${documentId} | name=${file.name} | code=${updateError.code ?? '?'} | ${updateError.message}`);
              failedCount++;
              continue;
            }
            updatedCount++;
            console.log(`[DRIVE SYNC] Actualizado en sitio: ${file.name} (${chunks.length} chunks)`);
          }
        } else {
          // Documento nuevo: insert normal.
          const { error: insertError } = await supabase.from('documents').insert({
            id: documentId,
            name: file.name,
            size_bytes: Buffer.byteLength(text, 'utf8'),
            chunk_count: chunks.length,
            org_id: orgId,
            user_id: user.id,
            status: 'indexed',
            source: provider.name,
            analysis_status: 'pendiente',
            provider_file_id: file.id,
            source_modified_at: file.modifiedTime,
            folder_path: file.folderPath ?? '/',
            folder_id: file.parentId ?? null,
            full_text: text,
            content_hash: contentHash,
          });

          if (insertError) {
            if (insertError.code === '23505') {
              console.error(`[DRIVE SYNC] IDENTIDAD DUPLICADA (23505) | org=${orgId} | file=${file.id} | name=${file.name} | provider=${provider.name} | ${insertError.message}`);
            } else {
              console.error(`[DRIVE SYNC] insert fallo | org=${orgId} | file=${file.id} | name=${file.name} | code=${insertError.code ?? '?'} | ${insertError.message}`);
            }
            failedCount++;
            continue;
          }
          newCount++;
          console.log(`[DRIVE SYNC] Indexed: ${file.name} (${chunks.length} chunks) [${file.folderPath ?? '/'}]`);
        }
      } catch (err) {
        console.error(`[DRIVE SYNC] Fallo procesando ${file.name} | doc-file=${file.id} |`, err);
        failedCount++;
        continue;
      }
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
        actorUserId: user.id,
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

    console.log(`[DRIVE SYNC] Complete: ${newCount} new, ${updatedCount} updated, ${deletedCount} deleted, ${skippedCount} unchanged, ${failedCount} failed, ${deleteFailedCount} delete-failed, ${skippedExcludedCount} excluded, ${versionedCount} versioned`);

    return NextResponse.json({
      success: failedCount === 0,
      stats: {
        new: newCount,
        updated: updatedCount,
        versioned: versionedCount,
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
