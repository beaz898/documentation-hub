import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';

/**
 * GET /api/team/members
 *
 * Lista los miembros del workspace.
 * Accesible por cualquier miembro.
 */
export async function GET(req: NextRequest) {
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
