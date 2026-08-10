import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { updateVectorMetadata } from '@/lib/pinecone/vectors';

/**
 * POST /api/documents/[id]/mark-analyzed
 * Marca un documento como 'analizado' desde la bandeja de revision
 * ("revisado por un humano"). Escribe en DOS sistemas:
 *   1. Pinecone (proyeccion): analysisStatus='analizado' en cada vector.
 *   2. Supabase (fuente de verdad): analysis_status + reviewed_at + reviewed_by.
 *
 * Orden deliberado: Pinecone PRIMERO. Si algun chunk falla, se ABORTA sin
 * tocar Supabase -> el documento sigue 'pendiente' (estado coherente, se
 * reintenta). Nunca queda Supabase-si / Pinecone-no (eso dejaria el doc
 * invisible para el chat, que filtra por 'analizado' en la metadata).
 * La operacion es idempotente: reintentar re-actualiza los mismos vectores.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUserHybrid(req);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const org = await resolveOrg(supabase, user.id);
  if (!org) {
    return NextResponse.json(
      { error: 'No perteneces a ninguna organizacion.' },
      { status: 403 },
    );
  }
  const orgId = org.orgId;

  const { id } = await params;

  // 1) Documento de la org + su chunk_count.
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, chunk_count')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  }

  const chunkCount = doc.chunk_count as number | null;
  if (!chunkCount || chunkCount <= 0) {
    return NextResponse.json(
      { error: 'El documento no tiene vectores indexados; no se puede marcar.' },
      { status: 422 },
    );
  }

  // C.4d-2: si el documento tiene una versión staged (nueva generación pendiente
  // de validar), validar = PROMOVERLA. El swap hace todo: flip de metadata de la
  // generación nueva a 'analizado', UPDATE de la fila desde staged, borra la vieja,
  // borra el marcador staged (verificado en C.4c). mark-analyzed solo añade encima
  // la procedencia de revisión humana. NO se hace el flip normal (apuntaría a los
  // vectores viejos g1, que el swap va a borrar).
  const { data: stagedRow, error: stagedCheckError } = await supabase
    .from('document_staged')
    .select('document_id')
    .eq('document_id', id)
    .eq('org_id', orgId)
    .maybeSingle();

  if (stagedCheckError) {
    console.error('[mark-analyzed] Error comprobando staged:', stagedCheckError.message);
    return NextResponse.json(
      { error: 'No se pudo comprobar el estado del documento. Reintentalo.' },
      { status: 500 },
    );
  }

  if (stagedRow) {
    // C.4d-2 (F-6): con staged presente, validar manualmente NO está permitido.
    // La versión nueva se promueve al COMPLETAR su análisis (analyze-v2), no aquí
    // (F-4: la puerta humana en validación causa obsolescencia sin tope). El usuario
    // debe ANALIZAR la nueva versión desde la bandeja; el swap es automático al
    // completar. mark-analyzed se niega.
    return NextResponse.json(
      {
        error: 'Este documento tiene una versión nueva pendiente de análisis. Analízala desde la bandeja de revisión; se activará automáticamente al completarse.',
        errorType: 'staged_pending_analysis',
      },
      { status: 409 },
    );
  }

  // Sin staged: comportamiento normal (documento sin versión pendiente).

  // 2) Pinecone PRIMERO: actualizar la metadata de cada vector. Abortar si falla.
  try {
    for (let i = 0; i < chunkCount; i++) {
      const vectorId = `${id}-${i}`;
      await updateVectorMetadata(orgId, vectorId, { analysisStatus: 'analizado' });
    }
  } catch (err) {
    console.error('[mark-analyzed] Pinecone:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        error:
          'No se pudo actualizar el indice de busqueda. El documento sigue pendiente; reintentalo.',
        errorType: 'pinecone_update_failed',
      },
      { status: 502 },
    );
  }

  // 3) Supabase DESPUES: fuente de verdad + procedencia de revision humana.
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      analysis_status: 'analizado',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id)
    .eq('org_id', orgId);

  if (updateError) {
    console.error('[mark-analyzed] Supabase:', updateError.message);
    return NextResponse.json(
      { error: 'El indice se actualizo pero fallo al guardar el estado. Reintentalo.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id, reviewedAt: new Date().toISOString() });
}
