import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { guardadoDeJob } from '@/lib/analysis/avisos';

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
      // ⚠️ `result_saved` VA EN EL SELECT (B.143). Sin pedirlo llega
      // `undefined`, y `undefined` significa GUARDADO: el aviso no saldria
      // nunca y no lo notaria nadie. Es el fallo silencioso de este camino.
      .select('id, org_id, status, document_name, result, result_saved, error_message, created_at, started_at, completed_at')
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
      // F-71: 'completed_with_errors' TAMBIÉN devuelve result — el análisis se
      // hizo y es utilizable, solo que incompleto. Tratarlo como 'failed' aquí
      // tiraría un resultado parcial que el cliente ya tiene pagado (y
      // reembolsado). El aviso viaja dentro, en result.stageFailures.
      result: job.status === 'completed' || job.status === 'completed_with_errors' ? job.result : null,
      // B.143: en el SOBRE, junto a `status` y `result`, y no dentro de
      // `result` — que el cliente lee COMO el analisis. Es estado del guardado,
      // no del analisis. Traducido por `guardadoDeJob` y no aqui: ausente
      // significa guardado, y esa regla vive en un solo sitio.
      guardado: guardadoDeJob(job.result_saved),
      errorMessage: job.status === 'failed' || job.status === 'completed_with_errors' ? job.error_message : null,
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
