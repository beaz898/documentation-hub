import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';
import type { UserPreferences, ConfirmationMode } from '@/lib/agent/types';

const VALID_MODES: ConfirmationMode[] = ['step_by_step', 'milestones', 'autonomous'];
const VALID_LOCALES = ['es', 'en'] as const;
const ALLOWED_KEYS: Array<keyof UserPreferences> = ['agent_default_mode', 'locale'];

/**
 * GET /api/user/preferences
 * Devuelve las preferencias del usuario para la org activa.
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

    const { data: membership, error: membError } = await supabase
      .from('memberships')
      .select('preferences')
      .eq('user_id', user.id)
      .eq('org_id', org.orgId)
      .single();

    if (membError || !membership) {
      return NextResponse.json({ error: 'Membership no encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ preferences: (membership.preferences ?? {}) as UserPreferences });
  } catch (error: unknown) {
    console.error('[user/preferences GET] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/user/preferences
 * Actualiza parcialmente las preferencias del usuario (shallow merge).
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }

    const body = await req.json();

    // Validar que no haya claves desconocidas
    const unknownKeys = Object.keys(body).filter(
      (k) => !ALLOWED_KEYS.includes(k as keyof UserPreferences)
    );
    if (unknownKeys.length > 0) {
      return NextResponse.json(
        { error: `Claves no permitidas: ${unknownKeys.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar valores conocidos
    if ('agent_default_mode' in body) {
      if (!VALID_MODES.includes(body.agent_default_mode)) {
        return NextResponse.json(
          { error: `agent_default_mode debe ser uno de: ${VALID_MODES.join(', ')}` },
          { status: 400 }
        );
      }
    }
    if ('locale' in body) {
      if (!VALID_LOCALES.includes(body.locale)) {
        return NextResponse.json(
          { error: `locale debe ser uno de: ${VALID_LOCALES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Leer preferencias actuales
    const { data: membership, error: membError } = await supabase
      .from('memberships')
      .select('preferences')
      .eq('user_id', user.id)
      .eq('org_id', org.orgId)
      .single();

    if (membError || !membership) {
      return NextResponse.json({ error: 'Membership no encontrada.' }, { status: 404 });
    }

    // Shallow merge y persistir solo en la org activa
    const merged: UserPreferences = { ...(membership.preferences ?? {}), ...body };

    const { error: updateError } = await supabase
      .from('memberships')
      .update({ preferences: merged })
      .eq('user_id', user.id)
      .eq('org_id', org.orgId);

    if (updateError) {
      console.error('[user/preferences PATCH] Update error:', updateError);
      return NextResponse.json({ error: 'Error guardando preferencias.' }, { status: 500 });
    }

    return NextResponse.json({ preferences: merged });
  } catch (error: unknown) {
    console.error('[user/preferences PATCH] Error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
