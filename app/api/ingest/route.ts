import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { upsertVectors, deleteVectorsByIds } from '@/lib/pinecone/vectors';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkText, extractText } from '@/lib/chunking';
import { randomUUID } from 'crypto';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { resolveOrg } from '@/lib/org';
import { checkUploadLock } from '@/lib/upload-lock';

export const maxDuration = 300;

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

    // Verificar bloqueo de subidas
    const lockCheck = await checkUploadLock(supabase, orgId, user.id);
    if (lockCheck.locked) {
      return NextResponse.json(
        { error: `La subida de documentos está bloqueada por ${lockCheck.lockedByEmail || 'otro usuario'}. Espera a que termine.`, errorType: 'upload_locked' },
        { status: 423 }
      );
    }

    // Leer datos del body
    // force=true significa "el usuario ya confirmó que quiere reemplazar el manual existente"
    const body = await req.json();
    const { storagePath, fileName, fileSize, force } = body;

    if (!storagePath || !fileName) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // Estado de análisis con el que nace el documento. El frontend indica si el
    // análisis previo se completó ('analizado') o falló ('pendiente'). Validación
    // estricta: cualquier otro valor cae al conservador 'pendiente' (irá a la bandeja).
    const analysisStatus: string =
      body.analysisStatus === 'analizado' ? 'analizado' : 'pendiente';

    // Validar tipo
    const allowedExtensions = ['txt', 'md', 'pdf', 'docx', 'csv', 'json', 'html', 'xlsx', 'xlsm'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Formato no soportado. Permitidos: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    const documentId = randomUUID();

    // ============================================================
    // Comprobar colisiones de nombre SOLO entre documentos MANUALES
    // Los documentos de Google Drive (source = 'google_drive') NUNCA se tocan
    // al subir manualmente, aunque tengan el mismo nombre. Coexisten.
    // ============================================================
    console.log(`[INGEST] Checking manual collisions for name="${fileName}" org="${orgId}"`);

    const { data: existingManualDocs, error: queryError } = await supabase
      .from('documents')
      .select('id, name, chunk_count, source')
      .eq('org_id', orgId)
      .eq('name', fileName)
      .or('source.is.null,source.neq.google_drive');

    if (queryError) {
      console.error('[INGEST] Query error:', queryError);
    }

    const manualCollisions = (existingManualDocs || []).filter(
      d => d.source !== 'google_drive'
    );

    console.log(`[INGEST] Found ${manualCollisions.length} manual collision(s)`);

    // Si hay un manual con el mismo nombre y el usuario NO ha confirmado el reemplazo → 409
    if (manualCollisions.length > 0 && !force) {
      return NextResponse.json({
        error: 'collision',
        collision: true,
        existingDoc: {
          id: manualCollisions[0].id,
          name: manualCollisions[0].name,
        },
      }, { status: 409 });
    }

    // Límite de 5 documentos en plan free (solo aplica a documentos nuevos, no a reemplazos)
    if (manualCollisions.length === 0) {
      const { data: orgPlan } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', orgId)
        .single();
      if (orgPlan?.plan === 'free') {
        const { count: docCount } = await supabase
          .from('documents')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', orgId);
        if ((docCount ?? 0) >= 5) {
          await supabase.storage.from('documents').remove([storagePath]);
          return NextResponse.json(
            { error: 'Has alcanzado el límite de 5 documentos del plan gratuito. Actualiza tu plan para subir más.' },
            { status: 403 }
          );
        }
      }
    }

    // 1. Descargar archivo de Supabase Storage
    console.log(`[INGEST] Downloading from storage: ${storagePath}`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('[INGEST] Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Error descargando archivo de storage' },
        { status: 500 }
      );
    }

    // 2. Extraer texto — envuelto en try/catch propio para detectar archivos ilegibles.
    // Si falla aquí, el documento anterior (en caso de reemplazo) NO se ha tocado.
    const buffer = Buffer.from(await fileData.arrayBuffer());
    let text: string;
    try {
      text = await extractText(buffer, fileName);
    } catch (extractErr) {
      const detail = extractErr instanceof Error ? extractErr.message : 'formato no legible';
      console.error('[INGEST] extractText falló:', detail);
      // El documento anterior (si había colisión) NO se ha tocado: seguimos intactos.
      return NextResponse.json(
        { error: 'No se pudo leer el archivo. El documento anterior sigue intacto. Comprueba que el PDF no esté dañado.', errorType: 'unreadable_file' },
        { status: 400 }
      );
    }

    // 3. Validar que el texto sea suficiente. También aquí el viejo sigue intacto.
    if (!text || text.trim().length < 50) {
      await supabase.storage.from('documents').remove([storagePath]);
      const baseMsg = 'No se pudo extraer texto suficiente del archivo';
      const suffix = manualCollisions.length > 0 ? ' El documento anterior sigue intacto.' : '';
      return NextResponse.json(
        { error: baseMsg + suffix },
        { status: 400 }
      );
    }

    console.log(`[INGEST] Extracted ${text.length} chars from ${fileName}`);

    // 4. Ahora que tenemos texto válido del nuevo, borrar el documento viejo (si procede).
    // Este es el único punto donde se modifica el corpus: solo cuando el nuevo está listo.
    if (manualCollisions.length > 0 && force) {
      for (const oldDoc of manualCollisions) {
        console.log(`[INGEST] Replacing manual doc id=${oldDoc.id}`);
        const idsToDelete = Array.from(
          { length: oldDoc.chunk_count },
          (_, i) => `${oldDoc.id}-${i}`
        );
        await deleteVectorsByIds(orgId, idsToDelete);
        await supabase.from('documents').delete().eq('id', oldDoc.id);
      }
    }

    // 5. Generar hash del contenido para detección futura de duplicados exactos
    const contentHash = generateContentHash(text);

    // 6. Trocear en chunks
    const chunks = chunkText(text, documentId, fileName, orgId);
    console.log(`[INGEST] Created ${chunks.length} chunks`);

    // 7. Generar embeddings
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddings(chunkTexts);

    // 8. Subir a Pinecone
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
        source: 'manual',
        analysisStatus,
      },
    }));

    await upsertVectors(orgId, vectors);

    // 9. Guardar metadatos en Supabase (con content_hash y full_text)
    await supabase.from('documents').insert({
      id: documentId,
      name: fileName,
      size_bytes: fileSize || 0,
      chunk_count: chunks.length,
      org_id: orgId,
      user_id: user.id,
      status: 'indexed',
      source: 'manual',
      analysis_status: analysisStatus,
      content_hash: contentHash,
      full_text: text,
      // Si el analisis se completo OK, fue sobre ESTE mismo texto (el frontend
      // analiza y luego indexa lo mismo), asi que el hash analizado coincide con
      // el de identidad. Si el analisis fallo o no hubo, queda null = "esta
      // version nunca se ha analizado". Campo distinto de content_hash pese a
      // coincidir aqui en valor: no los fusiones.
      analyzed_content_hash: analysisStatus === 'analizado' ? contentHash : null,
    });

    // 10. Limpiar archivo de storage
    await supabase.storage.from('documents').remove([storagePath]);

    const wasReplaced = manualCollisions.length > 0 && force === true;

    console.log(`[INGEST] Done! ${fileName} - ${chunks.length} chunks, replaced=${wasReplaced}`);

    return NextResponse.json({
      success: true,
      replaced: wasReplaced,
      document: {
        id: documentId,
        name: fileName,
        chunks: chunks.length,
        size: fileSize || 0,
      },
    });
  } catch (error: unknown) {
    console.error('Error in /api/ingest:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
