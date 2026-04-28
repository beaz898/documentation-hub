import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';

/**
 * POST /api/team/invite
 *
 * Envía una invitación por email para unirse al workspace.
 * Solo accesible por Admin.
 *
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
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

    // Verificar organización y rol
    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }
    if (org.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden invitar usuarios.' }, { status: 403 });
    }

    const body = await req.json();
    const email = (body.email || '').toString().trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    // Verificar que no se invite a sí mismo
    if (email === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'No puedes invitarte a ti mismo.' }, { status: 400 });
    }

    // Verificar límite de usuarios del plan
    const { data: orgData } = await supabase
      .from('organizations')
      .select('max_users')
      .eq('id', org.orgId)
      .single();

    const { count: currentMembers } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.orgId);

    const { count: pendingInvites } = await supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.orgId)
      .eq('status', 'pending');

    const totalSlots = (currentMembers ?? 0) + (pendingInvites ?? 0);
    if (orgData && totalSlots >= orgData.max_users) {
      return NextResponse.json(
        { error: `Tu plan permite un máximo de ${orgData.max_users} usuario${orgData.max_users !== 1 ? 's' : ''}. Cambia de plan para añadir más.` },
        { status: 403 }
      );
    }

    // Verificar que el email no sea ya miembro
    const { data: existingUser } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('org_id', org.orgId);

    if (existingUser && existingUser.length > 0) {
      // Comprobar emails de los miembros actuales
      for (const member of existingUser) {
        const { data: memberAuth } = await supabase.auth.admin.getUserById(member.user_id);
        if (memberAuth?.user?.email?.toLowerCase() === email) {
          return NextResponse.json({ error: 'Este email ya es miembro del workspace.' }, { status: 409 });
        }
      }
    }

    // Verificar que no haya invitación pendiente para este email
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('id')
      .eq('org_id', org.orgId)
      .eq('email', email)
      .eq('status', 'pending')
      .limit(1);

    if (existingInvite && existingInvite.length > 0) {
      return NextResponse.json({ error: 'Ya hay una invitación pendiente para este email.' }, { status: 409 });
    }

    // Crear invitación
    const { data: invitation, error: insertError } = await supabase
      .from('invitations')
      .insert({
        org_id: org.orgId,
        email,
        invited_by: user.id,
      })
      .select('id, token, email, created_at, expires_at')
      .single();

    if (insertError || !invitation) {
      console.error('[team/invite] Insert error:', insertError);
      return NextResponse.json({ error: 'Error creando la invitación.' }, { status: 500 });
    }

    // TODO: Enviar email con el enlace de invitación.
    // Por ahora, devolvemos el token para que el admin lo comparta manualmente.
    console.log(`[team/invite] Invitation created for ${email} — token: ${invitation.token}`);

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error: unknown) {
    console.error('Error in /api/team/invite:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
