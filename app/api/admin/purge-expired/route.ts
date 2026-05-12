import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { purgeOrganization, type PurgeResult } from '@/lib/purge-org';

export const maxDuration = 300;

/**
 * POST /api/admin/purge-expired
 *
 * Busca organizaciones con el período de gracia expirado (grace_period_ends_at < now())
 * y purged_at IS NULL, y ejecuta el borrado completo de cada una.
 *
 * Llamado periódicamente por el worker o por un cron externo.
 * Requiere el ADMIN_SECRET en el header Authorization.
 */
export async function POST(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'ADMIN_SECRET no configurado' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: expiredOrgs, error } = await supabase
    .from('organizations')
    .select('id')
    .lt('grace_period_ends_at', new Date().toISOString())
    .is('purged_at', null);

  if (error) {
    console.error('[admin/purge-expired] Error consultando orgs expiradas:', error.message);
    return NextResponse.json({ error: 'Error consultando la base de datos' }, { status: 500 });
  }

  if (!expiredOrgs || expiredOrgs.length === 0) {
    console.log('[admin/purge-expired] No hay organizaciones expiradas para purgar');
    return NextResponse.json({ success: true, purged: 0, results: [] });
  }

  console.log(`[admin/purge-expired] Purgando ${expiredOrgs.length} organización(es) expirada(s)`);

  const results: Array<{ orgId: string; success: boolean; errors: string[] }> = [];

  for (const org of expiredOrgs) {
    try {
      const result: PurgeResult = await purgeOrganization(supabase, org.id);
      results.push({ orgId: org.id, success: result.errors.length === 0, errors: result.errors });
      console.log(`[admin/purge-expired] Org ${org.id} purgada — errores: ${result.errors.length}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ orgId: org.id, success: false, errors: [msg] });
      console.error(`[admin/purge-expired] Error purgando org ${org.id}:`, msg);
    }
  }

  const successCount = results.filter(r => r.success).length;
  return NextResponse.json({
    success: true,
    purged: successCount,
    failed: results.length - successCount,
    results,
  });
}
