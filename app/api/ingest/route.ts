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

    // Leer datos del body (ahora recibe la ruta en Storage, no el archivo)
    const body = await req.json();
    const { storagePath, fileName, fileSize } = body;

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

    // Comprobar si ya existe un documento con el mismo nombre en esta org
    console.log(`[INGEST] Checking for existing doc: name="${fileName}" org="${orgId}"`);

    const { data: existingDocs, error: queryError } = await supabase
      .from('documents')
      .select('id, chunk_count')
      .eq('org_id', orgId)
      .eq('name', fileName);

    console.log(`[INGEST] Found ${existingDocs?.length || 0} existing, error=${queryError?.message || 'none'}`);

    if (existingDocs && existingDocs.length > 0) {
      const pineconeIndex = getIndex();

      for (const oldDoc of existingDocs) {
        console.log(`[INGEST] Deleting old doc id=${oldDoc.id}`);

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
      },
    }));

    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await pineconeIndex.namespace(orgId).upsert(batch);
      console.log(`[INGEST] Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
    }

    // 6. Guardar metadatos en Supabase
    await supabase.from('documents').insert({
      id: documentId,
      name: fileName,
      size_bytes: fileSize || 0,
      chunk_count: chunks.length,
      org_id: orgId,
      user_id: user.id,
      status: 'indexed',
    });

    // 7. Limpiar archivo de storage (ya no lo necesitamos)
    await supabase.storage.from('documents').remove([storagePath]);

    const wasReplaced = existingDocs && existingDocs.length > 0;

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
