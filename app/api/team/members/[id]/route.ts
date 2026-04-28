import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';

/**
 * DELETE /api/team/members/[id]
 *
 * Expulsa un miembro del workspace.
 * Solo accesible por Admin. No puede expulsarse a sí mismo.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (org.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden expulsar miembros.' }, { status: 403 });
    }

    const { id: targetUserId } = await params;

    if (!targetUserId) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    // No puede expulsarse a sí mismo
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'No puedes expulsarte a ti mismo.' }, { status: 400 });
    }

    // Verificar que el usuario pertenece a esta organización
    const { data: membership } = await supabase
      .from('memberships')
      .select('id')
      .eq('org_id', org.orgId)
      .eq('user_id', targetUserId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Este usuario no es miembro del workspace.' }, { status: 404 });
    }

    // Eliminar membership
    const { error: deleteError } = await supabase
      .from('memberships')
      .delete()
      .eq('org_id', org.orgId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('[team/members/delete] Error:', deleteError);
      return NextResponse.json({ error: 'Error eliminando miembro.' }, { status: 500 });
    }

    console.log(`[team/members] Removed user ${targetUserId} from org ${org.orgId}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in /api/team/members/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
