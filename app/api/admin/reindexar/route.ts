import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { checkUploadLock } from '@/lib/upload-lock';
import { EXTRACTOR_VERSION, chunkSegments, stripSegmentationMarkers } from '@/lib/chunking';
import type { ExtractedSegment } from '@/lib/chunking';
import { generateContentHash } from '@/lib/analysis/hash-check';
import { generateEmbeddings } from '@/lib/embeddings';
import { upsertVectors, buildVectorId } from '@/lib/pinecone/vectors';
import { saveDocumentChunks } from '@/lib/persist-chunks';
import { getDocumentChunks, getActiveGeneration } from '@/lib/read-chunks';
import { getStagedForDocument } from '@/lib/document-staged';
import { swapDocumentVectors } from '@/lib/document-swap';
import { planDeReindexado, esReparacionCompleta } from '@/lib/documents/plan-de-reindexado';

/**
 * POST /api/admin/reindexar — EL ESCRITOR (F-104, paso 1 del orden).
 *
 * Body: { documentId }
 *
 * ⚠️ POR QUÉ EXISTE, y por qué va ANTES que el cambio del cortador: por la regla
 * de F-104 — **un cambio que altera lo que queda guardado no entra hasta que
 * exista la vía de reparación de lo ya guardado**. El arreglo del cortador es de
 * una línea, y esa línea dejaría el parque partido en dos mitades sin forma de
 * repararlo. Primero la vía, aunque sea la parte aburrida.
 *
 * Y por qué en el mismo commit que el plan: un lector sin escritor no mide nada.
 *
 * ⚠️ NO BORRA EL DOCUMENTO EN NINGÚN MOMENTO, que es el requisito de partida. La
 * generación nueva se escribe ENTERA antes de conmutar, y la vieja sigue
 * sirviendo mientras tanto — la generación viaja dentro del id del vector y es
 * columna en `document_chunks`, así que escribir N+1 **no puede pisar N**. Si
 * esto muere a medias, lo que queda es basura invisible en una generación que
 * nadie sirve; nunca un documento apagado. Es el sesgo de fallo que
 * `swapDocumentVectors` ya tenía escrito, y aquí se hereda, no se reinventa.
 *
 * ⚠️ NO CUESTA CRÉDITOS: no hay una sola llamada a un modelo. Los embeddings
 * pasan por Pinecone Inference, que tiene su propio límite de tasa y no el
 * monedero del cliente. Y NO re-analiza: no toca `analysis_results`, ni
 * `analysis_status`, ni la bandeja. Reindexar no es opinar sobre el contenido.
 *
 * ⚠️ ESO ÚLTIMO NO ERA CIERTO HASTA B.185, y conviene que quede aquí: el endpoint
 * no tocaba `analysis_status`, pero la conmutación que llama SÍ lo escribía —
 * siempre `analizado`, más el reseteo de `reviewed_at/by`—. Un reindexado de un
 * documento `pendiente` lo habría metido en el corpus sin que nadie lo revisara.
 * Por eso la conmutación pide ahora un MOTIVO, y aquí se le pasa
 * `mismo_contenido_retroceado`: verificar el fichero que se escribe y no el que
 * se ejecuta es cómo se cuela esto.
 *
 * ⚠️ LÍMITE DECLARADO, con su contador: HOY SOLO IMPLEMENTA `retrocear`.
 * `reprocesar` —volver a descargar el original de un proveedor— necesita la
 * obtención y el refresco del token de Drive, que hoy vive dentro de
 * `app/api/drive/sync/route.ts`. Traérselo aquí a mano sería una SEGUNDA
 * implementación de lo mismo, que es justo lo que esta casa prohíbe; y
 * extraerlo es un cambio de otro tamaño que no debe viajar con éste. Así que se
 * responde 501 con el motivo, se cuenta, y se dice. Para lo que hoy hay que
 * reparar —B.182, que daña SOLO prosa: medido, todas las filas de tabla a cero—
 * `retrocear` es suficiente.
 */

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createServiceClient();
  const org = await resolveOrg(supabase, user.id);
  if (!org) return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
  if (org.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden reindexar.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const documentId: unknown = body?.documentId;
  if (typeof documentId !== 'string' || documentId.length === 0) {
    return NextResponse.json({ error: 'Falta documentId.' }, { status: 400 });
  }

  // Mismo cerrojo que cualquier operación sobre documentos de la organización.
  const lock = await checkUploadLock(supabase, org.orgId, user.id);
  if (lock.locked) {
    return NextResponse.json({
      error: `${lock.lockedByEmail ?? 'Otro usuario'} está subiendo documentos ahora mismo.`,
    }, { status: 423 });
  }

  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, name, org_id, source, provider_file_id, extractor_version, active_generation, analysis_status, full_text, size_bytes')
    .eq('id', documentId)
    .eq('org_id', org.orgId)
    .maybeSingle();

  if (docError) {
    console.error('[reindexar] error leyendo el documento:', docError.message);
    return NextResponse.json({ error: 'No se pudo leer el documento.' }, { status: 500 });
  }
  if (!doc) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });

  const generacionActiva = await getActiveGeneration(supabase, { orgId: org.orgId, documentId });
  const chunksActuales = await getDocumentChunks(supabase, {
    orgId: org.orgId, documentId, generation: generacionActiva,
  });
  const staged = await getStagedForDocument(supabase, documentId, org.orgId);

  const plan = planDeReindexado(
    {
      fila: {
        extractorVersion: doc.extractor_version,
        source: doc.source,
        providerFileId: doc.provider_file_id,
      },
      nombre: doc.name,
      tieneChunksTabulares: chunksActuales.some(c => c.chunkType !== 'text'),
      hayStagedVivo: staged !== null,
      fullText: doc.full_text,
    },
    EXTRACTOR_VERSION,
  );

  if (plan.via === 'rechazado') {
    console.log(`[reindexar] rechazado.${plan.motivo} | doc=${documentId} | "${doc.name}"`);
    return NextResponse.json({
      reindexado: false,
      via: 'rechazado',
      motivo: plan.motivo,
      // El motivo se devuelve tal cual para que quien lo enseñe no tenga que
      // traducirlo aquí: `sin_original_con_tablas` es lo que le dice al usuario
      // que ese documento se repara RESUBIÉNDOLO, no con un botón.
    }, { status: 409 });
  }

  if (plan.via === 'reprocesar') {
    console.log(`[reindexar] reprocesar_no_implementado | doc=${documentId} | "${doc.name}"`);
    return NextResponse.json({
      reindexado: false,
      via: 'reprocesar',
      motivo: 'reprocesar_no_implementado',
      detalle: 'Este documento tiene su original en un proveedor externo y su reparación completa necesita volver a descargarlo. Esa vía todavía no está construida.',
    }, { status: 501 });
  }

  // ── retrocear ────────────────────────────────────────────────────────────
  const generacionNueva = generacionActiva + 1;
  const texto = (doc.full_text ?? '').trim();

  try {
    // Un solo segmento de prosa: es exactamente lo que `full_text` es, y el plan
    // ya ha garantizado que este documento NO tiene tablas que perder.
    const segments: ExtractedSegment[] = [{ type: 'text', text: texto }];
    const chunks = chunkSegments(segments, documentId, doc.name, org.orgId);

    const embeddings = await generateEmbeddings(chunks.map(c => c.text));

    // La generación NUEVA. La activa sigue siendo la vieja y sigue sirviendo.
    await upsertVectors(org.orgId, chunks.map((chunk, i) => ({
      id: buildVectorId(documentId, generacionNueva, i),
      values: embeddings[i],
      metadata: {
        text: chunk.text,
        documentId: chunk.metadata.documentId,
        documentName: chunk.metadata.documentName,
        chunkIndex: chunk.metadata.chunkIndex,
        totalChunks: chunk.metadata.totalChunks,
        orgId: chunk.metadata.orgId,
        // ⚠️ SE CONSERVA EL ESTADO, no se pone 'analizado': reindexar no opina
        // sobre el contenido, y promover un documento a analizado por haberlo
        // troceado otra vez sería exactamente el fallo que esta casa separó en
        // `content_hash` vs `analyzed_content_hash`.
        analysisStatus: doc.analysis_status,
        generation: generacionNueva,
      },
    })));

    await saveDocumentChunks(supabase, {
      orgId: org.orgId, documentId, generation: generacionNueva, chunks,
    });

    // El marcador. A partir de aquí el swap es re-invocable: si algo muere, se
    // vuelve a llamar y termina.
    const { error: stagedError } = await supabase.from('document_staged').insert({
      document_id: documentId,
      org_id: org.orgId,
      generation: generacionNueva,
      full_text: stripSegmentationMarkers(texto),
      content_hash: generateContentHash(stripSegmentationMarkers(texto)),
      chunk_count: chunks.length,
      size_bytes: doc.size_bytes ?? 0,
    });
    if (stagedError) {
      // Sin marcador no se puede conmutar de forma reparable. Se aborta ANTES de
      // tocar nada de lo que sirve: queda una generación nueva huérfana, que es
      // basura invisible y no un documento roto.
      console.error(`[reindexar] no se pudo escribir el marcador | doc=${documentId} | ${stagedError.message}`);
      return NextResponse.json({
        reindexado: false, via: 'retrocear', motivo: 'fallo_marcador',
      }, { status: 500 });
    }

    const swap = await swapDocumentVectors(supabase, org.orgId, documentId, 'mismo_contenido_retroceado');
    if (!swap.ok || !swap.swapped) {
      console.error(`[reindexar] fallo_conmutacion | doc=${documentId} | ${swap.error ?? 'sin detalle'}`);
      return NextResponse.json({
        reindexado: false, via: 'retrocear', motivo: 'fallo_conmutacion',
        detalle: 'La versión vieja sigue sirviendo. Se puede reintentar.',
      }, { status: 500 });
    }

    console.log(
      `[reindexar] OK | doc=${documentId} | "${doc.name}" | gen ${generacionActiva}→${generacionNueva} | ` +
      `${chunksActuales.length}→${chunks.length} trozos | completa=${esReparacionCompleta(plan)}`,
    );

    return NextResponse.json({
      reindexado: true,
      via: 'retrocear',
      generacion: { antes: generacionActiva, ahora: generacionNueva },
      trozos: { antes: chunksActuales.length, ahora: chunks.length },
      // ⚠️ SE DICE QUE ES MEDIA REPARACIÓN, y no se vende como completa:
      // re-trocear arregla el troceado, NO la extracción.
      reparacion_completa: esReparacionCompleta(plan),
      aviso: esReparacionCompleta(plan)
        ? undefined
        : 'Se ha reparado el TROCEADO desde el texto guardado. Si lo que cambió fue cómo se LEE el documento, este documento sigue necesitando una resubida.',
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : 'desconocido';
    console.error(`[reindexar] fallo | doc=${documentId} | ${detalle}`);
    return NextResponse.json({
      reindexado: false, via: 'retrocear', motivo: 'fallo', detalle,
    }, { status: 500 });
  }
}
