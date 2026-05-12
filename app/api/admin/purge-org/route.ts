import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { purgeOrganization } from '@/lib/purge-org';

export const maxDuration = 300;

/**
 * POST /api/admin/purge-org
 *
 * Borra manualmente todos los datos de una organización específica.
 * Requiere el ADMIN_SECRET en el header Authorization.
 *
 * Body: { orgId: string }
 */
export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'ADMIN_SECRET no configurado' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orgId } = body as { orgId?: string };

    if (!orgId || typeof orgId !== 'string') {
      return NextResponse.json({ error: 'orgId requerido' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, purged_at')
      .eq('id', orgId)
      .single();

    if (!orgData) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    if (orgData.purged_at) {
      return NextResponse.json(
        { error: 'La organización ya fue purgada', purged_at: orgData.purged_at },
        { status: 409 }
      );
    }

    const result = await purgeOrganization(supabase, orgId);

    console.log(`[admin/purge-org] Purga manual completada para org ${orgId}`, {
      documents: result.deletedDocuments,
      storage: result.deletedStorageFiles,
      errors: result.errors.length,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error('Error in /api/admin/purge-org:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
