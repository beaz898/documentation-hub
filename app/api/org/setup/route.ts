import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * POST /api/org/setup
 *
 * Crea una organización para el usuario autenticado si aún no tiene una.
 * Se llama automáticamente desde el frontend tras el login/registro.
 *
 * Si el usuario ya pertenece a una organización, no hace nada y devuelve
 * los datos existentes (operación idempotente).
 *
 * Body opcional:
 *  - name: string — nombre del workspace (default: 'Mi workspace')
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

    // Comprobar si ya tiene membership
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('org_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (existingMembership) {
      // Ya tiene organización, devolver datos existentes
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, plan, credits_remaining, credits_extra, max_users')
        .eq('id', existingMembership.org_id)
        .single();

      return NextResponse.json({
        success: true,
        created: false,
        org: org || { id: existingMembership.org_id },
        role: existingMembership.role,
      });
    }

    // Leer nombre opcional del body
    let orgName = 'Mi workspace';
    try {
      const body = await req.json();
      if (body.name && typeof body.name === 'string' && body.name.trim().length > 0) {
        orgName = body.name.trim().slice(0, 100);
      }
    } catch {
      // Body vacío o no JSON, usar nombre por defecto
    }

    // Crear organización con plan Free (100 créditos, 1 usuario)
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        plan: 'free',
        credits_remaining: 100,
        credits_extra: 0,
        max_users: 1,
      })
      .select('id, name, plan, credits_remaining, credits_extra, max_users')
      .single();

    if (orgError || !newOrg) {
      console.error('[org/setup] Failed to create organization:', orgError);
      return NextResponse.json(
        { error: 'Error creando la organización' },
        { status: 500 }
      );
    }

    // Crear membership como admin
    const { error: memberError } = await supabase
      .from('memberships')
      .insert({
        org_id: newOrg.id,
        user_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      console.error('[org/setup] Failed to create membership:', memberError);
      // Limpiar la org huérfana
      await supabase.from('organizations').delete().eq('id', newOrg.id);
      return NextResponse.json(
        { error: 'Error configurando el workspace' },
        { status: 500 }
      );
    }

    console.log(`[org/setup] Created org "${orgName}" (${newOrg.id}) for user ${user.id}`);

    return NextResponse.json({
      success: true,
      created: true,
      org: newOrg,
      role: 'admin',
    });
  } catch (error: unknown) {
    console.error('Error in /api/org/setup:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
