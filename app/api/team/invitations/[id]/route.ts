import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';

/**
 * DELETE /api/team/invitations/[id]
 *
 * Cancela una invitación pendiente.
 * Solo accesible por Admin.
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
      return NextResponse.json({ error: 'Solo los administradores pueden cancelar invitaciones.' }, { status: 403 });
    }

    const { id: invitationId } = await params;

    if (!invitationId) {
      return NextResponse.json({ error: 'ID de invitación requerido.' }, { status: 400 });
    }

    // Verificar que la invitación pertenece a esta organización
    const { data: invitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('id', invitationId)
      .eq('org_id', org.orgId)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada.' }, { status: 404 });
    }

    // Actualizar estado a expired (no borrar, para mantener historial)
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('[team/invitations/delete] Error:', updateError);
      return NextResponse.json({ error: 'Error cancelando invitación.' }, { status: 500 });
    }

    console.log(`[team/invitations] Cancelled invitation ${invitationId}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in /api/team/invitations/[id]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
