import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { upsertVectors, deleteVectorsByIds, buildVectorId } from '@/lib/pinecone/vectors';
import { deleteDocument } from '@/lib/delete-document';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkText } from '@/lib/chunking';
import { randomUUID } from 'crypto';
import { resolveOrg } from '@/lib/org';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { checkUploadLock } from '@/lib/upload-lock';
import { getStagedForDocument } from '@/lib/document-staged';

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
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    // Resolver organización
    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización. Contacta con el administrador.' },
        { status: 403 }
      );
    }
    const orgId = org.orgId;

    // Candado (B.64): indexar desde "mejorar con IA" escribe en el corpus.
    // Si otro usuario tiene el candado, se rechaza con 423 visible.
    const lockCheck = await checkUploadLock(supabase, orgId, user.id);
    if (lockCheck.locked) {
      return NextResponse.json(
        { error: `El corpus está bloqueado por ${lockCheck.lockedByEmail || 'otro usuario'}. Espera a que termine.`, errorType: 'upload_locked' },
        { status: 423 }
      );
    }

    const body = await req.json();
    const { text, name, originalStoragePath, replaceExistingId, sizeBytes } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texto insuficiente para indexar (mínimo 50 caracteres)' }, { status: 400 });
    }
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Nombre de documento requerido' }, { status: 400 });
    }

    const documentId = randomUUID();

    // d-2b (F-9): si el documento a reemplazar tiene una version nueva en vuelo
    // (document_staged), NO se puede re-indexar por esta via. Esta ruta borra la
    // fila documents del viejo, y como document_staged tiene ON DELETE CASCADE,
    // ese borrado destruiria la version staged (sin swap, sin aviso, sin rastro).
    // Ademas crearia una tercera identidad del documento (activa, staged y este
    // texto). La via correcta con version en vuelo es analizarla desde la bandeja
    // (analisis rapido), que al completar dispara el swap. Se veta ANTES de tocar
    // Pinecone o Supabase.
    if (typeof replaceExistingId === 'string') {
      const staged = await getStagedForDocument(supabase, replaceExistingId, orgId);
      if (staged) {
        return NextResponse.json(
          {
            error:
              'Este documento tiene una versión nueva pendiente de análisis. Analízala desde la bandeja de revisión antes de mejorarlo; una vez activada, podrás mejorar y reindexar con normalidad.',
            errorType: 'staged_pending',
          },
          { status: 409 },
        );
      }
    }

    // If the user chose "replace", delete the old indexed document first
    if (replaceExistingId) {
      console.log(`[INDEX-TEXT] Replacing existing document id=${replaceExistingId}`);
      const { data: oldDoc } = await supabase
        .from('documents')
        .select('id, chunk_count, source')
        .eq('id', replaceExistingId)
        .eq('org_id', orgId)
        .single();

      if (oldDoc) {
        // d-2b (F-15): veto por ORIGEN. Un documento cuyo origen es Drive
        // (google_drive/onedrive) NO se re-indexa desde aqui: Drive es su fuente de
        // verdad. Re-indexarlo por esta via lo convertiria en 'manual' y le quitaria
        // el provider_file_id, con lo que el siguiente sync no lo reconoceria y
        // reimportaria el original sin corregir (duplicado huerfano). La correccion de
        // un archivo de Drive vuelve POR Drive: se descarga el texto corregido desde
        // "Mejorar con IA", se sube a Drive, y el sync lo procesa como version nueva.
        // Lista explicita (no "!== manual") para que un proveedor futuro no quede
        // vetado sin revision. Complementa el veto por staged de mas arriba (F-9): el
        // de origen cubre Drive con y sin staged; ambos conviven.
        if (oldDoc.source === 'google_drive' || oldDoc.source === 'onedrive') {
          return NextResponse.json(
            {
              error:
                'Este documento existe en Drive, así que no puede reindexarse desde aquí. Descarga el texto corregido y súbelo a Drive; se procesará en la próxima sincronización.',
              errorType: 'drive_origin',
            },
            { status: 409 },
          );
        }

        // d-2b (F-15): borrado con la funcion compartida. Antes se borraba a mano
        // (deleteVectorsByIds por chunk_count + .delete() crudo), lo que (a) dejaba
        // vectores huerfanos si chunk_count estaba desfasado, y (b) borraba sin
        // lapida — si el doc era de Drive, el sync lo reimportaba sin corregir.
        // deleteDocument usa doble estrategia de vectores (por filtro y por ids) y
        // escribe lapida SOLO si el doc es de Drive (provider_file_id != null); para
        // un manual (el unico caso que llega aqui tras el veto por origen, Commit 10)
        // no escribe lapida, que es lo correcto. Si el borrado falla, NO seguimos:
        // insertar el nuevo dejando el viejo daria dos documentos.
        const delResult = await deleteDocument(supabase, {
          orgId,
          documentId: replaceExistingId,
          reason: 'user_excluded',
          excludedBy: user.id,
          actorUserId: user.id,
        });
        if (delResult.error) {
          console.error('[INDEX-TEXT] deleteDocument fallo:', delResult.error);
          return NextResponse.json(
            { error: 'No se pudo reemplazar el documento anterior. Inténtalo de nuevo.' },
            { status: 500 },
          );
        }
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
      id: buildVectorId(documentId, 1, i),
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        documentId: chunk.metadata.documentId,
        documentName: chunk.metadata.documentName,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        orgId: chunk.metadata.orgId,
        analysisStatus: 'analizado',
        generation: 1,
      },
    }));

    await upsertVectors(orgId, vectors);

    // content_hash = "que texto ES este documento" (identidad, para detectar
    // duplicados exactos en hash-check y para el portero por hash de Fase C).
    // NO confundir con analyzed_content_hash = "que texto SE ANALIZO por ultima
    // vez" (verificacion). Son campos primos, nunca el mismo: fusionarlos haria
    // que un documento se declare analizado por el mero hecho de indexarse.
    const contentHash = generateContentHash(text);

    // Save to Supabase
    await supabase.from('documents').insert({
      id: documentId,
      name,
      size_bytes: sizeBytes || Buffer.byteLength(text, 'utf-8'),
      chunk_count: chunks.length,
      org_id: orgId,
      user_id: user.id,
      status: 'indexed',
      // Esta ruta la usa el modal de mejora: el texto ya fue revisado y corregido
      // por el usuario, así que nace analizado (no va a la bandeja de revisión).
      analysis_status: 'analizado',
      content_hash: contentHash,
      full_text: text,
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
