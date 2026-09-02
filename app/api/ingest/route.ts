import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { upsertVectors, deleteVectorsByIds, buildVectorId, deleteVectorsByFilter, buildAllVectorIds } from '@/lib/pinecone/vectors';
import { generateEmbeddings } from '@/lib/embeddings';
import { extractSegments, joinSegments, chunkSegments, stripSegmentationMarkers, EXTRACTOR_VERSION } from '@/lib/chunking';
import type { ExtractedSegment } from '@/lib/chunking';
import { saveDocumentChunks } from '@/lib/persist-chunks';
import { randomUUID } from 'crypto';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { resolveOrg } from '@/lib/org';
import { checkUploadLock } from '@/lib/upload-lock';

/**
 * ⚠️ EL PRESUPUESTO DE ESTA RUTA, Y VIVE SOLO AQUÍ (B.141, 02/09/2026).
 *
 * Hasta hoy estaba declarado DOS VECES Y DISTINTO: 300 en esta línea y 60 en
 * `vercel.json`. Cuál ganaba no se podía resolver leyendo el repositorio, y es un
 * número que gobierna un TIMEOUT en una ruta que BORRA por el camino. Se retiró
 * el de `vercel.json` —que conserva la memoria, que no está duplicada— y queda
 * este.
 *
 * POR QUÉ 300 Y NO 60: la indexación puede gastar hasta 30 s de reintentos de
 * embeddings (techo de `lib/embeddings.ts`) más el tiempo de las peticiones, y
 * esta ruta BORRA EL DOCUMENTO VIEJO ANTES de generar el nuevo (B.140). Un
 * timeout en medio deja al usuario sin ninguno de los dos. Con 300 hay margen; el
 * coste es que una función colgada tarde más en morir, que es mucho menos grave.
 */
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
      .select('id, name, chunk_count, source, active_generation')
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
    let segments: ExtractedSegment[];
    try {
      segments = await extractSegments(buffer, fileName);
    } catch (extractErr) {
      const detail = extractErr instanceof Error ? extractErr.message : 'formato no legible';
      console.error('[INGEST] extractSegments falló:', detail);
      // El documento anterior (si había colisión) NO se ha tocado: seguimos intactos.
      return NextResponse.json(
        { error: 'No se pudo leer el archivo. El documento anterior sigue intacto. Comprueba que el PDF no esté dañado.', errorType: 'unreadable_file' },
        { status: 400 }
      );
    }
    const text = joinSegments(segments);

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

        // Borrado por dos vías (B.73), igual que en lib/delete-document.ts y
        // drive/disconnect: filtro por documentId, que no depende de conocer la
        // generación, más los IDs explícitos de la generación activa. Los manuales
        // están hoy siempre en generación 1, pero eso es una consecuencia del flujo
        // actual, no una garantía del código: C.4e prevé migrarlos al swap.
        const oldDocumentId = oldDoc.id as string;
        let filterOk = false;
        let idsOk = false;

        try {
          await deleteVectorsByFilter(orgId, { documentId: { $eq: oldDocumentId } });
          filterOk = true;
        } catch (err) {
          console.warn(`[INGEST] fallo borrado por filtro | doc=${oldDocumentId} |`, err);
        }

        const generation = (oldDoc.active_generation as number | null) ?? 1;
        const idsToDelete = buildAllVectorIds(
          oldDocumentId,
          (oldDoc.chunk_count as number | null) ?? 0,
          generation,
        );
        if (idsToDelete.length > 0) {
          try {
            await deleteVectorsByIds(orgId, idsToDelete);
            idsOk = true;
          } catch (err) {
            console.warn(`[INGEST] fallo borrado por IDs | doc=${oldDocumentId} | gen=${generation} |`, err);
          }
        }

        // La fila solo se borra si los vectores se han podido borrar: sin la fila no
        // queda referencia para localizar vectores huérfanos.
        if (!filterOk && !idsOk) {
          console.error(`[INGEST] ABORTADO | no se pudieron borrar los vectores del documento a reemplazar | doc=${oldDocumentId}`);
          return NextResponse.json(
            {
              error: 'No se pudo retirar la versión anterior del índice de búsqueda. No se ha modificado nada; inténtalo de nuevo.',
              errorType: 'vector_delete_failed',
            },
            { status: 502 },
          );
        }

        await supabase.from('documents').delete().eq('id', oldDoc.id);
      }
    }

    // 5. Generar hash del contenido para detección futura de duplicados exactos.
    // Sobre el texto limpio: el marcador de segmentación (hojas de cálculo) es
    // una señal interna de chunkText, no contenido — si entrara en el hash, el
    // mismo documento sin ningún cambio real cambiaría de hash entre sync/sync.
    const contentHash = generateContentHash(stripSegmentationMarkers(text));

    // 6. Trocear en chunks (derivados de los segmentos, no del texto plano)
    const chunks = chunkSegments(segments, documentId, fileName, orgId);
    console.log(`[INGEST] Created ${chunks.length} chunks`);

    // 7. Generar embeddings
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddings(chunkTexts);

    // 8. Subir a Pinecone
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
        source: 'manual',
        analysisStatus,
        generation: 1,
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
      full_text: stripSegmentationMarkers(text),
      extractor_version: EXTRACTOR_VERSION,
      // Si el analisis se completo OK, fue sobre ESTE mismo texto (el frontend
      // analiza y luego indexa lo mismo), asi que el hash analizado coincide con
      // el de identidad. Si el analisis fallo o no hubo, queda null = "esta
      // version nunca se ha analizado". Campo distinto de content_hash pese a
      // coincidir aqui en valor: no los fusiones.
      analyzed_content_hash: analysisStatus === 'analizado' ? contentHash : null,
    });

    // 9b. Chunks tipados (F-20 Paso 2). AL FINAL: la fila de documents ya
    // existe (la FK lo exige) y un fallo aquí nunca debe tumbar una
    // indexación que ya funcionó — saveDocumentChunks solo loguea, no lanza.
    await saveDocumentChunks(supabase, { orgId, documentId, generation: 1, chunks });

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
