import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import { purgeOrganization } from '@/lib/purge-org';

/**
 * POST /api/org/purge
 *
 * Borrado voluntario de todos los datos de la organización.
 * Solo el admin puede ejecutarlo.
 * Requiere confirmación: el admin debe enviar su email en el body.
 *
 * Body: { confirmEmail: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización.' },
        { status: 403 }
      );
    }
    if (org.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo el administrador puede borrar los datos.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { confirmEmail } = body;

    if (!confirmEmail || confirmEmail !== user.email) {
      return NextResponse.json(
        { error: 'Debes confirmar escribiendo tu email exacto.' },
        { status: 400 }
      );
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('purged_at')
      .eq('id', org.orgId)
      .single();

    if (orgData?.purged_at) {
      return NextResponse.json(
        { error: 'Los datos de esta organización ya fueron borrados.' },
        { status: 409 }
      );
    }

    const result = await purgeOrganization(supabase, org.orgId);

    console.log(`[org/purge] Borrado voluntario completado para org ${org.orgId}`, {
      documents: result.deletedDocuments,
      storage: result.deletedStorageFiles,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Todos los datos han sido borrados.',
      summary: {
        documentosBorrados: result.deletedDocuments,
        archivosBorrados: result.deletedStorageFiles,
        embeddingsBorrados: result.pineconeNamespaceDeleted,
        chatQueriesBorradas: result.deletedChatQueries,
        resultadosAnalisisBorrados: result.deletedAnalysisResults,
        jobsAnalisisBorrados: result.deletedAnalysisJobs,
        logsUsoBorrados: result.deletedUsageLogs,
        feedbackBorrado: result.deletedFeedback,
        comprasCreditosBorradas: result.deletedCreditPurchases,
        eventosFacturacionAnonimizados: result.anonymizedBillingEvents,
        invitacionesBorradas: result.deletedInvitations,
        conexionesDriveBorradas: result.deletedDriveConnections,
        miembrosBorrados: result.deletedMemberships,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: unknown) {
    console.error('Error in /api/org/purge:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
