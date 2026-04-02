import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getIndex } from '@/lib/pinecone';
import { generateEmbeddings } from '@/lib/embeddings';
import { chunkText, extractText } from '@/lib/chunking';
import { randomUUID } from 'crypto';

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

    // Leer archivo del FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tamaño (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máximo 20MB)' }, { status: 400 });
    }

    // Validar tipo
    const allowedExtensions = ['txt', 'md', 'pdf', 'docx', 'csv', 'json', 'html'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Formato no soportado. Permitidos: ${allowedExtensions.join(', ')}` },
        { status: 400 }
      );
    }

    const documentId = randomUUID();

    // Comprobar si ya existe un documento con el mismo nombre en esta org
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('id, chunk_count')
      .eq('org_id', orgId)
      .eq('name', file.name);

    if (existingDocs && existingDocs.length > 0) {
      const index = getIndex();

      for (const oldDoc of existingDocs) {
        // Borrar vectores antiguos de Pinecone
        const idsToDelete = Array.from(
          { length: oldDoc.chunk_count },
          (_, i) => `${oldDoc.id}-${i}`
        );
        for (let i = 0; i < idsToDelete.length; i += 1000) {
          const batch = idsToDelete.slice(i, i + 1000);
          await index.namespace(orgId).deleteMany(batch);
        }

        // Borrar registro de Supabase
        await supabase.from('documents').delete().eq('id', oldDoc.id);
      }
    }

    // 1. Extraer texto del archivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, file.name);

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto suficiente del archivo' },
        { status: 400 }
      );
    }

    // 2. Trocear en chunks
    const chunks = chunkText(text, documentId, file.name, orgId);

    // 3. Generar embeddings
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddings(chunkTexts);

    // 4. Subir a Pinecone
    const index = getIndex();
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

    // Subir en lotes de 100
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.namespace(orgId).upsert(batch);
    }

    // 5. Guardar metadatos del documento en Supabase
    await supabase.from('documents').insert({
      id: documentId,
      name: file.name,
      size_bytes: file.size,
      chunk_count: chunks.length,
      org_id: orgId,
      user_id: user.id,
      status: 'indexed',
    });

    const wasReplaced = existingDocs && existingDocs.length > 0;

    return NextResponse.json({
      success: true,
      replaced: wasReplaced,
      document: {
        id: documentId,
        name: file.name,
        chunks: chunks.length,
        size: file.size,
      },
    });
  } catch (error: unknown) {
    console.error('Error in /api/ingest:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
