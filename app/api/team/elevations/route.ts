import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

/**
 * POST /api/team/elevations
 *
 * Concede una elevación temporal (member → admin temporal) a un miembro.
 * Solo accesible por el owner de la organización.
 *
 * Body: { targetUserId: string }
 */
export async function POST(req: NextRequest) {
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
        { error: 'Solo el administrador principal puede conceder permisos temporales.' },
        { status: 403 },
      );
    }

    // 4. Body
    const body = await req.json() as { targetUserId?: unknown };
    const targetUserId = body.targetUserId;
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'targetUserId es obligatorio.' }, { status: 400 });
    }

    // 5. No puedes elevarte a ti mismo
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'No puedes concederte permisos temporales a ti mismo.' }, { status: 400 });
    }

    // 6. Verificar que el target pertenece a la misma org
    const { data: targetMembership } = await supabase
      .from('memberships')
      .select('role, is_owner')
      .eq('org_id', org.orgId)
      .eq('user_id', targetUserId)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: 'Ese usuario no pertenece a tu organización.' }, { status: 404 });
    }

    // 7. No elevar a un admin nativo
    if (targetMembership.role === 'admin') {
      return NextResponse.json({ error: 'Ese usuario ya es administrador.' }, { status: 400 });
    }

    // 8. No elevar al owner
    if (targetMembership.is_owner) {
      return NextResponse.json({ error: 'No puedes elevar al administrador principal.' }, { status: 400 });
    }

    // 9. Comprobar que no haya ya una elevación activa
    const { data: existingElevation } = await supabase
      .from('temporary_elevations')
      .select('id')
      .eq('org_id', org.orgId)
      .eq('user_id', targetUserId)
      .is('revoked_at', null)
      .limit(1);

    if (existingElevation && existingElevation.length > 0) {
      return NextResponse.json({ error: 'Ese usuario ya tiene permisos temporales activos.' }, { status: 400 });
    }

    // 10. INSERT elevación
    const { data: elevation, error: insertError } = await supabase
      .from('temporary_elevations')
      .insert({
        org_id:     org.orgId,
        user_id:    targetUserId,
        granted_by: user.id,
      })
      .select()
      .single();

    if (insertError || !elevation) {
      console.error('[team/elevations] Insert error:', insertError);
      return NextResponse.json({ error: 'Error concediendo permisos temporales.' }, { status: 500 });
    }

    console.log(`[team/elevations] Elevation granted to ${targetUserId} in org ${org.orgId} by ${user.id}`);

    // 11. Respuesta
    return NextResponse.json({ success: true, elevation });
  } catch (error: unknown) {
    console.error('Error in POST /api/team/elevations:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
