import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

/**
 * GET /api/usage/history
 *
 * Devuelve el consumo detallado del workspace.
 * Solo accesible por Admin.
 *
 * Query params:
 *  - days: número de días hacia atrás (default: 30)
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
    if (org.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden ver el historial de uso.' }, { status: 403 });
    }

    const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Obtener logs con créditos consumidos
    const { data: logs, error: logsError } = await supabase
      .from('usage_logs')
      .select('user_id, endpoint, credits_consumed, success, created_at')
      .eq('org_id', org.orgId)
      .eq('success', true)
      .gt('credits_consumed', 0)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('[usage/history] Query error:', logsError);
      return NextResponse.json({ error: 'Error obteniendo historial.' }, { status: 500 });
    }

    // Obtener miembros para mapear user_id → email
    const { data: memberships } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('org_id', org.orgId);

    const emailMap: Record<string, string> = {};
    for (const m of memberships || []) {
      const { data: userData } = await supabase.auth.admin.getUserById(m.user_id);
      emailMap[m.user_id] = userData?.user?.email || 'desconocido';
    }

    // Desglose por usuario
    const byUser: Record<string, { email: string; total: number; byEndpoint: Record<string, number> }> = {};
    // Desglose por endpoint
    const byEndpoint: Record<string, number> = {};
    // Desglose por día
    const byDay: Record<string, number> = {};

    for (const log of logs || []) {
      const credits = log.credits_consumed || 0;
      const userId = log.user_id;
      const endpoint = log.endpoint || 'otro';
      const day = log.created_at.slice(0, 10);

      // Por usuario
      if (!byUser[userId]) {
        byUser[userId] = { email: emailMap[userId] || 'desconocido', total: 0, byEndpoint: {} };
      }
      byUser[userId].total += credits;
      byUser[userId].byEndpoint[endpoint] = (byUser[userId].byEndpoint[endpoint] || 0) + credits;

      // Por endpoint
      byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + credits;

      // Por día
      byDay[day] = (byDay[day] || 0) + credits;
    }

    // Convertir byUser a array ordenado por consumo
    const userRanking = Object.entries(byUser)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      days,
      totalCredits: (logs || []).reduce((sum, l) => sum + (l.credits_consumed || 0), 0),
      totalOperations: (logs || []).length,
      byUser: userRanking,
      byEndpoint,
      byDay,
    });
  } catch (error: unknown) {
    console.error('Error in /api/usage/history:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
