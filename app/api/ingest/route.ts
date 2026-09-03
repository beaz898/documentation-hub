import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { upsertVectors, deleteVectorsByIds, buildVectorId } from '@/lib/pinecone/vectors';
import { generateEmbeddings } from '@/lib/embeddings';
import { extractSegments, joinSegments, chunkSegments, stripSegmentationMarkers, EXTRACTOR_VERSION } from '@/lib/chunking';
import type { ExtractedSegment } from '@/lib/chunking';
import { saveDocumentChunks } from '@/lib/persist-chunks';
import { planDeReemplazo } from '@/lib/documents/plan-de-reemplazo';
import { esReemplazableAMano } from '@/lib/documents/origen';
import { retirarLoViejo } from '@/lib/documents/retirar-version';
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
 * esta ruta REEMPLAZA documentos.
 *
 * ⚠️ LA RAZÓN QUE SE ESCRIBIÓ AQUÍ EL 02/09 YA NO ES VERDAD, y se corrige en el
 * mismo commit que la mata: decía «esta ruta BORRA EL DOCUMENTO VIEJO ANTES de
 * generar el nuevo (B.140), y un timeout en medio deja al usuario sin ninguno de
 * los dos». Desde el reemplazo por generaciones el viejo se retira DESPUÉS, así
 * que un timeout en medio ya no deja al usuario sin nada: deja basura.
 * EL 300 SIGUE, con la razón que le queda: el techo de reintentos más las
 * peticiones no cabe holgadamente en 60, y el coste de pasarse es solo que una
 * función colgada tarde más en morir.
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

    // ============================================================
    // Comprobar colisiones de nombre SOLO entre documentos REEMPLAZABLES A MANO.
    // Los documentos SINCRONIZADOS —Google Drive, OneDrive— NUNCA se tocan al
    // subir manualmente, aunque tengan el mismo nombre. Coexisten, y es lo que
    // el aviso de reemplazo le promete al usuario.
    //
    // ⚠️ EL CRITERIO NO SE FILTRA EN LA CONSULTA, Y ES DELIBERADO (B.162). Antes
    // había un `.or('source.is.null,source.neq.google_drive')` aquí: una SEGUNDA
    // implementación del mismo criterio, en otro lenguaje, que se separó de la de
    // abajo y de la de la interfaz. Nombraba UN origen donde la pantalla nombraba
    // DOS, así que un documento de OneDrive se pintaba bajo «Drive» y el
    // reemplazo se lo llevaba por delante.
    // Ahora la consulta trae los homónimos SIN filtrar y decide
    // `esReemplazableAMano`, una sola vez y en un solo sitio.
    // ============================================================
    console.log(`[INGEST] Checking manual collisions for name="${fileName}" org="${orgId}"`);

    const { data: existingManualDocs, error: queryError } = await supabase
      .from('documents')
      // created_at ENTRA AQUÍ PORQUE DECIDE: con varios homónimos es el criterio
      // de cuál se versiona y cuáles se borran. Es la sexta especie del select que
      // pierde un campo (B.144), y aquí el defecto silencioso sería versionar el
      // documento equivocado.
      .select('id, name, chunk_count, source, active_generation, created_at')
      .eq('org_id', orgId)
      .eq('name', fileName);

    if (queryError) {
      console.error('[INGEST] Query error:', queryError);
    }

    const manualCollisions = (existingManualDocs || []).filter(
      d => esReemplazableAMano(d.source),
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

    // ============================================================
    // EL PLAN: alta o reemplazo, y con qué identidad y qué generación.
    // Aquí, después del 409: si hay colisiones y seguimos, es que `force` es true.
    //
    // ⚠️ EN UN REEMPLAZO EL ID NO ES NUEVO — se reutiliza el del documento
    // reemplazado, que gana una generación. Sin eso no habría nada que conmutar:
    // viejo y nuevo serían dos documentos distintos y el orden crear→conmutar→
    // borrar no tendría sentido. Ver `lib/documents/plan-de-reemplazo.ts`.
    // ============================================================
    const plan = planDeReemplazo(manualCollisions);
    const documentId = plan.tipo === 'reemplazo' ? plan.documentId : randomUUID();
    const generation = plan.generacion;

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

    // 4. AQUÍ NO SE BORRA NADA, Y ÉSA ES LA INVERSIÓN (B.140, B.152).
    //
    // Hasta el 03/09/2026 este punto borraba los vectores y la fila del documento
    // viejo ANTES de generar el nuevo. Entre ese borrado y el insert final la
    // organización no tenía NINGUNA de las dos versiones, y si algo fallaba en
    // medio —incluidos los hasta 30 s de reintentos de embeddings— se quedaba sin
    // las dos. Peor: el borrado iba por dos vías y bastaba con que UNA funcionara
    // para continuar, así que podían sobrevivir vectores en Pinecone con la fila
    // ya borrada — un documento fantasma respondiendo en el chat, invisible en la
    // interfaz y que ninguna sincronización recupera.
    //
    // Ahora el viejo se retira en el punto 10, DESPUÉS de que la fila sirva la
    // generación nueva. La ventana no se estrecha: deja de existir.

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
      id: buildVectorId(documentId, generation, i),
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
        generation,
      },
    }));

    await upsertVectors(orgId, vectors);

    // 9. LA CONMUTACIÓN: lo que la generación nueva pasa a ser para la fila.
    const contenidoNuevo = {
      name: fileName,
      size_bytes: fileSize || 0,
      chunk_count: chunks.length,
      user_id: user.id,
      status: 'indexed',
      source: 'manual',
      active_generation: generation,
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
    };

    if (plan.tipo === 'reemplazo') {
      // ⚠️ UN UPDATE NO ES UN INSERT: lo que no se nombra SE QUEDA COMO ESTABA, y
      // ahí es donde un campo olvidado sobrevive callado (B.144). Las columnas de
      // `documents`, decididas una por una:
      //  · las que trae `contenidoNuevo` — las que cambian con la versión;
      //  · `id`, `name`, `org_id` — la identidad, que es justo lo que se conserva;
      //  · `created_at` — NO SE TOCA: es el nacimiento del documento, no el de
      //    esta versión. ⚠️ CAMBIO OBSERVABLE: la lista ordena por `created_at`
      //    (`app/api/documents/route.ts:29`), así que un documento reemplazado ya
      //    NO salta al principio de la lista, se queda donde estaba;
      //  · `updated_at` — se escribe a ahora, aunque es REDUNDANTE: hay un
      //    trigger `documents_updated_at BEFORE UPDATE` (`supabase-setup.sql:621`)
      //    que lo pone igual. ⚠️ El comentario que había aquí decía «no hay
      //    trigger» y era FALSO — corregido el 03/09 al mirar los triggers por
      //    otra cosa. Se deja la escritura explícita: no depender de un trigger
      //    para un campo que esta línea ya sabe poner;
      //  · `provider_file_id`, `source_modified_at`, `folder_path`, `folder_id` —
      //    a null: tras un reemplazo manual el documento ES manual, y conservar la
      //    procedencia de otro origen sería un dato que ya no describe nada;
      //  · `reviewed_at`, `reviewed_by` — a null: el contenido cambió, nadie ha
      //    revisado ESTA versión. Mismo criterio que `document-swap.ts`.
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          ...contenidoNuevo,
          updated_at: new Date().toISOString(),
          provider_file_id: null,
          source_modified_at: null,
          folder_path: null,
          folder_id: null,
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq('id', documentId)
        .eq('org_id', orgId);

      if (updateError) {
        // La conmutación falló: la fila sigue sirviendo la generación vieja, que
        // está INTACTA. Lo único que sobra es la generación nueva recién subida, y
        // se retira para dejar las cosas exactamente como estaban. Si la retirada
        // también falla, sobran vectores de una generación que la fila no sirve:
        // basura, no pérdida.
        console.error(`[INGEST] ABORTADO | no se pudo conmutar la fila | doc=${documentId} | gen=${generation} |`, updateError);
        try {
          await deleteVectorsByIds(orgId, vectors.map(v => v.id));
        } catch (err) {
          console.warn(`[INGEST] generación nueva sin retirar tras conmutación fallida | doc=${documentId} | gen=${generation} |`, err);
        }
        return NextResponse.json(
          {
            error: 'No se pudo activar la nueva versión del documento. La versión anterior sigue intacta; inténtalo de nuevo.',
            errorType: 'swap_failed',
          },
          { status: 502 },
        );
      }
    } else {
      await supabase.from('documents').insert({
        id: documentId,
        org_id: orgId,
        ...contenidoNuevo,
      });
    }

    // 9b. Chunks tipados (F-20 Paso 2). AL FINAL: la fila de documents ya
    // existe (la FK lo exige) y un fallo aquí nunca debe tumbar una
    // indexación que ya funcionó — saveDocumentChunks solo loguea, no lanza.
    await saveDocumentChunks(supabase, { orgId, documentId, generation, chunks });

    // 10. LA RETIRADA DE LO VIEJO — vectores de las generaciones anteriores,
    //     sus chunks tipados, y los homónimos que no se versionan.
    //     Vive en `lib/documents/retirar-version.ts`, y allí está escrito por
    //     qué nada de eso puede abortar esta petición.
    await retirarLoViejo(supabase, { orgId, documentId, generation, plan, colisiones: manualCollisions });

    // 11. Limpiar archivo de storage
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
