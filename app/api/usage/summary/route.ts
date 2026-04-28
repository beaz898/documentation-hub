import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';

/**
 * GET /api/usage/summary
 *
 * Devuelve los créditos restantes y el consumo del ciclo actual.
 * Accesible por cualquier miembro de la organización.
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
      return NextResponse.json(
        { error: 'No perteneces a ninguna organización.' },
        { status: 403 }
      );
    }

    // Obtener datos de la organización
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('plan, credits_remaining, credits_extra, billing_cycle_start, max_users, canceled_at, grace_period_ends_at')
      .eq('id', org.orgId)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 });
    }

    // Consumo del ciclo actual (desde billing_cycle_start)
    const cycleStart = orgData.billing_cycle_start || new Date().toISOString();

    const { data: usageData } = await supabase
      .from('usage_logs')
      .select('endpoint, credits_consumed')
      .eq('org_id', org.orgId)
      .eq('success', true)
      .gte('created_at', cycleStart)
      .gt('credits_consumed', 0);

    // Desglose por tipo de operación
    const breakdown: Record<string, number> = {};
    let totalConsumed = 0;

    for (const row of usageData || []) {
      const label = row.endpoint || 'otro';
      breakdown[label] = (breakdown[label] || 0) + (row.credits_consumed || 0);
      totalConsumed += row.credits_consumed || 0;
    }

    // Determinar estado de la suscripción
    let subscriptionStatus: 'active' | 'canceled' | 'expired' = 'active';
    if (orgData.canceled_at) {
      if (orgData.grace_period_ends_at && new Date(orgData.grace_period_ends_at) < new Date()) {
        subscriptionStatus = 'expired';
      } else {
        subscriptionStatus = 'canceled';
      }
    }

    return NextResponse.json({
      success: true,
      plan: orgData.plan,
      creditsRemaining: orgData.credits_remaining,
      creditsExtra: orgData.credits_extra,
      creditsTotal: orgData.credits_remaining + orgData.credits_extra,
      cycleStart,
      consumed: totalConsumed,
      breakdown,
      role: org.role,
      canceledAt: orgData.canceled_at,
      gracePeriodEndsAt: orgData.grace_period_ends_at,
      subscriptionStatus,
    });
  } catch (error: unknown) {
    console.error('Error in /api/usage/summary:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
