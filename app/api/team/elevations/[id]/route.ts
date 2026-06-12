import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

/**
 * DELETE /api/team/elevations/[id]
 *
 * Revoca la elevación temporal activa de un usuario. [id] = user_id del target.
 * Solo accesible por el owner de la organización.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Auth
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    // 2. Org
    const supabase = createServiceClient();
    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }

    // 3. Gate owner
    if (!org.isOwner) {
      return NextResponse.json(
        { error: 'Solo el administrador principal puede revocar permisos temporales.' },
        { status: 403 },
      );
    }

    // 4. Target
    const { id: targetUserId } = await params;

    // 5. Buscar la elevación activa
    const { data: elevation } = await supabase
      .from('temporary_elevations')
      .select('id')
      .eq('org_id', org.orgId)
      .eq('user_id', targetUserId)
      .is('revoked_at', null)
      .single();

    if (!elevation) {
      return NextResponse.json({ error: 'Ese usuario no tiene permisos temporales activos.' }, { status: 404 });
    }

    // 6. Revocar: marcar revoked_at y revoked_by (no se borra la fila — queda como auditoría)
    const { error: updateError } = await supabase
      .from('temporary_elevations')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', elevation.id);

    if (updateError) {
      console.error('[team/elevations/revoke] Update error:', updateError);
      return NextResponse.json({ error: 'Error revocando permisos temporales.' }, { status: 500 });
    }

    console.log(`[team/elevations] Elevation revoked for ${targetUserId} in org ${org.orgId} by ${user.id}`);

    // 7. Respuesta
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/team/elevations/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
