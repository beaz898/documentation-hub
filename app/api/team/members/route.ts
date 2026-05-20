import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

/**
 * GET /api/team/members
 *
 * Lista los miembros del workspace.
 * Accesible por cualquier miembro.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }

    // Obtener memberships
    const { data: memberships, error: membError } = await supabase
      .from('memberships')
      .select('user_id, role, joined_at')
      .eq('org_id', org.orgId)
      .order('joined_at', { ascending: true });

    if (membError) {
      console.error('[team/members] Query error:', membError);
      return NextResponse.json({ error: 'Error obteniendo miembros.' }, { status: 500 });
    }

    // Enriquecer con email de cada usuario
    const members = [];
    for (const m of memberships || []) {
      const { data: userData } = await supabase.auth.admin.getUserById(m.user_id);
      members.push({
        userId: m.user_id,
        email: userData?.user?.email || 'desconocido',
        role: m.role,
        joinedAt: m.joined_at,
        isYou: m.user_id === user.id,
      });
    }

    return NextResponse.json({ success: true, members });
  } catch (error: unknown) {
    console.error('Error in /api/team/members:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
