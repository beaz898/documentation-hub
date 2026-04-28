import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * POST /api/team/accept-invite
 *
 * Acepta una invitación y añade al usuario al workspace.
 * El usuario debe estar autenticado.
 *
 * Body: { token: string }
 *
 * Flujo:
 * 1. El Admin comparte un enlace tipo /invite?token=xxx
 * 2. La página /invite verifica el token y muestra info del workspace.
 * 3. Si el usuario acepta, llama a este endpoint.
 * 4. Se crea la membership y se marca la invitación como accepted.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const authToken = authHeader.split(' ')[1];
    const supabase = createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const inviteToken = (body.token || '').toString().trim();

    if (!inviteToken) {
      return NextResponse.json({ error: 'Token de invitación requerido.' }, { status: 400 });
    }

    // Buscar la invitación
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('id, org_id, email, status, expires_at')
      .eq('token', inviteToken)
      .single();

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada o inválida.' }, { status: 404 });
    }

    // Verificar estado
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Esta invitación ya fue usada o cancelada.' }, { status: 400 });
    }

    // Verificar expiración
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      return NextResponse.json({ error: 'Esta invitación ha expirado.' }, { status: 400 });
    }

    // Verificar que el email coincide
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: `Esta invitación es para ${invitation.email}. Inicia sesión con esa cuenta.` },
        { status: 403 }
      );
    }

    // Verificar que no sea ya miembro
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('org_id', invitation.org_id)
      .eq('user_id', user.id)
      .limit(1);

    if (existingMembership && existingMembership.length > 0) {
      // Ya es miembro, marcar invitación como accepted y continuar
      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);
      return NextResponse.json({ success: true, alreadyMember: true });
    }

    // Verificar límite de usuarios
    const { data: orgData } = await supabase
      .from('organizations')
      .select('max_users, name')
      .eq('id', invitation.org_id)
      .single();

    const { count: currentMembers } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', invitation.org_id);

    if (orgData && (currentMembers ?? 0) >= orgData.max_users) {
      return NextResponse.json(
        { error: 'El workspace ha alcanzado el límite de usuarios de su plan.' },
        { status: 403 }
      );
    }

    // Si el usuario tiene su propia organización vacía (solo él), la dejamos.
    // No borramos organizaciones automáticamente — el usuario puede tener datos ahí.
    // Simplemente lo añadimos a la nueva org. resolveOrg devuelve la primera que encuentre,
    // así que en el futuro podríamos añadir selector de workspace.

    // Eliminar membership anterior si existe en otra org
    // (por ahora un usuario solo puede estar en una org)
    const { data: currentMembership } = await supabase
      .from('memberships')
      .select('id, org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (currentMembership) {
      await supabase
        .from('memberships')
        .delete()
        .eq('id', currentMembership.id);
      console.log(`[accept-invite] Removed user ${user.id} from org ${currentMembership.org_id}`);
    }

    // Crear membership como member
    const { error: memberError } = await supabase
      .from('memberships')
      .insert({
        org_id: invitation.org_id,
        user_id: user.id,
        role: 'member',
      });

    if (memberError) {
      console.error('[accept-invite] Membership insert error:', memberError);
      return NextResponse.json({ error: 'Error uniéndose al workspace.' }, { status: 500 });
    }

    // Marcar invitación como accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    console.log(`[accept-invite] User ${user.id} (${user.email}) joined org ${invitation.org_id}`);

    return NextResponse.json({
      success: true,
      orgName: orgData?.name || 'Workspace',
    });
  } catch (error: unknown) {
    console.error('Error in /api/team/accept-invite:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
