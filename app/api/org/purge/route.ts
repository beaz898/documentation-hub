import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';
import { purgeOrganization } from '@/lib/cleanup';

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

    // Verificar confirmación por email
    const body = await req.json();
    const { confirmEmail } = body;

    if (!confirmEmail || confirmEmail !== user.email) {
      return NextResponse.json(
        { error: 'Debes confirmar escribiendo tu email exacto.' },
        { status: 400 }
      );
    }

    // Verificar que la org no esté ya purgada
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

    // Ejecutar el borrado
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
        conexionesDriveBorradas: result.deletedDriveConnections,
        feedbackAnonimizado: result.anonymizedFeedback,
        logsAnonimizados: result.anonymizedUsageLogs,
        invitacionesBorradas: result.deletedInvitations,
        miembrosBorrados: result.deletedMemberships,
        embeddingsBorrados: result.pineconeNamespaceDeleted,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error: unknown) {
    console.error('Error in /api/org/purge:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
