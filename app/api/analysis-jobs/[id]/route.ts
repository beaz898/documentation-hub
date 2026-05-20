import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

/**
 * GET /api/analysis-jobs/[id]
 *
 * Devuelve el estado de un job de análisis exhaustivo.
 * El frontend hace polling a este endpoint mientras el job está pendiente o procesándose.
 *
 * Respuestas:
 * - pending: el job está en cola esperando al worker.
 * - processing: el worker lo está ejecutando.
 * - completed: resultado disponible en `result`.
 * - failed: error en `errorMessage`.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServiceClient();

  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // Resolver organización
    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Consultar el job (RLS no aplica con service role, verificamos org manualmente)
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .select('id, org_id, status, document_name, result, error_message, created_at, started_at, completed_at')
      .eq('id', id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 });
    }

    // Verificar que el job pertenece a la organización del usuario
    if (job.org_id !== org.orgId) {
      return NextResponse.json({ error: 'No tienes acceso a este job' }, { status: 403 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      documentName: job.document_name,
      result: job.status === 'completed' ? job.result : null,
      errorMessage: job.status === 'failed' ? job.error_message : null,
      createdAt: job.created_at,
      startedAt: job.started_at,
      completedAt: job.completed_at,
    });
  } catch (error: unknown) {
    console.error('[analysis-jobs] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
