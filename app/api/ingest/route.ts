import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkText, extractText } from '@/lib/chunking';
import { randomUUID } from 'crypto';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
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

    // Leer datos del body
    // force=true significa "el usuario ya confirmó que quiere reemplazar el manual existente"
    const body = await req.json();
    const { storagePath, fileName, fileSize, force } = body;

    if (!storagePath || !fileName) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // Validar tipo
    const allowedExtensions = ['txt', 'md', 'pdf', 'docx', 'csv', 'json', 'html'];
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

    // Si force === true (el usuario confirmó) o no hay colisión, seguimos
    if (manualCollisions.length > 0 && force) {
      const pineconeIndex = getIndex();
      for (const oldDoc of manualCollisions) {
        console.log(`[INGEST] Replacing manual doc id=${oldDoc.id}`);
        const idsToDelete = Array.from(
          { length: oldDoc.chunk_count },
          (_, i) => `${oldDoc.id}-${i}`
        );
        for (let i = 0; i < idsToDelete.length; i += 1000) {
          const batch = idsToDelete.slice(i, i + 1000);
          await pineconeIndex.namespace(orgId).deleteMany(batch);
        }
        await supabase.from('documents').delete().eq('id', oldDoc.id);
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

    // 2. Extraer texto
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const text = await extractText(buffer, fileName);

    if (!text || text.trim().length < 50) {
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json(
        { error: 'No se pudo extraer texto suficiente del archivo' },
        { status: 400 }
      );
    }

    console.log(`[INGEST] Extracted ${text.length} chars from ${fileName}`);

    // 3. Trocear en chunks
    const chunks = chunkText(text, documentId, fileName, orgId);
    console.log(`[INGEST] Created ${chunks.length} chunks`);

    // 4. Generar embeddings
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddings(chunkTexts);

    // 5. Subir a Pinecone
    const pineconeIndex = getIndex();
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
      },
    }));

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await pineconeIndex.namespace(orgId).upsert(batch);
      console.log(`[INGEST] Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
    }

    // 6. Guardar metadatos en Supabase (explicit source = 'manual')
    await supabase.from('documents').insert({
      id: documentId,
      name: fileName,
      size_bytes: fileSize || 0,
      chunk_count: chunks.length,
      org_id: orgId,
      user_id: user.id,
      status: 'indexed',
      source: 'manual',
    });

    // 7. Limpiar archivo de storage
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
