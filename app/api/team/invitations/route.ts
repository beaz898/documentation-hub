import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';

/**
 * GET /api/team/invitations
 *
 * Lista las invitaciones pendientes del workspace.
 * Solo accesible por Admin.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const orgR = await resolverOrg(supabase, user.id);
    if (!orgR.resuelta) return respuestaDeOrgNoResuelta(orgR);
    const org = orgR.org;
    if (org.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden ver invitaciones.' }, { status: 403 });
    }

    const { data: invitations, error: queryError } = await supabase
      .from('invitations')
      .select('id, email, status, created_at, expires_at, token')
      .eq('org_id', org.orgId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('[team/invitations] Query error:', queryError);
      return NextResponse.json({ error: 'Error obteniendo invitaciones.' }, { status: 500 });
    }

    // Marcar como expiradas las que ya pasaron de fecha
    const now = new Date();
    const result = (invitations || []).map(inv => ({
      ...inv,
      isExpired: new Date(inv.expires_at) < now,
    }));

    return NextResponse.json({ success: true, invitations: result });
  } catch (error: unknown) {
    console.error('Error in /api/team/invitations:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
