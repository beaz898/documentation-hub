import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

/**
 * POST /api/team/transfer-owner
 *
 * Transfiere la administración principal (is_owner) a otro admin de la org.
 * La transferencia es atómica: la RPC garantiza un único owner por org.
 * Solo accesible por el owner actual.
 *
 * Body: { newOwnerUserId: string }
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
        { error: 'Solo el administrador principal puede transferir la administración principal.' },
        { status: 403 },
      );
    }

    // 4. Body
    const body = await req.json() as { newOwnerUserId?: unknown };
    const newOwnerUserId = body.newOwnerUserId;
    if (!newOwnerUserId || typeof newOwnerUserId !== 'string') {
      return NextResponse.json({ error: 'newOwnerUserId es obligatorio.' }, { status: 400 });
    }

    // 5. No transferir a uno mismo
    if (newOwnerUserId === user.id) {
      return NextResponse.json({ error: 'Ya eres el administrador principal.' }, { status: 400 });
    }

    // 6. Llamar a la RPC (toda la lógica atómica vive ahí)
    const { data, error: rpcError } = await supabase.rpc('transfer_owner', {
      p_org_id:             org.orgId,
      p_current_owner_user: user.id,
      p_new_owner_user:     newOwnerUserId,
    });

    if (rpcError) {
      console.error('[team/transfer-owner] RPC error:', rpcError);
      return NextResponse.json({ error: 'Error transfiriendo la administración principal.' }, { status: 500 });
    }

    const result = data as { success: boolean; error?: string };

    if (result.success !== true) {
      const code = result.error ?? '';
      const ERROR_MAP: Record<string, { status: number; message: string }> = {
        same_user:          { status: 400, message: 'Ya eres el administrador principal.' },
        current_not_member: { status: 403, message: 'No perteneces a la organización.' },
        caller_not_owner:   { status: 403, message: 'Solo el administrador principal puede transferir.' },
        target_not_member:  { status: 404, message: 'Ese usuario no pertenece a tu organización.' },
        target_not_admin:   { status: 400, message: 'Solo puedes transferir la administración principal a un administrador. Asciende antes a esa persona a administrador.' },
      };
      const mapped = ERROR_MAP[code] ?? { status: 400, message: 'No se pudo transferir.' };
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    // 7. Éxito
    console.log(`[team/transfer-owner] Owner transferred from ${user.id} to ${newOwnerUserId} in org ${org.orgId}`);
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error in POST /api/team/transfer-owner:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
