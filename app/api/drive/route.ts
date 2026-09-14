import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import { getOrgFeatures } from '@/lib/plan-features';
import { getProvider } from '@/lib/drive/registry';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const orgInfoR = await resolverOrg(supabase, user.id);
    if (!orgInfoR.resuelta) return respuestaDeOrgNoResuelta(orgInfoR);
    const orgInfo = orgInfoR.org;

    const features = await getOrgFeatures(supabase, orgInfo.orgId);
    if (!features.hasDrive) {
      return NextResponse.json(
        { error: 'Google Drive disponible a partir del plan Pro' },
        { status: 403 }
      );
    }

    const providerName = req.nextUrl.searchParams.get('provider') || 'google_drive';
    const provider = getProvider(providerName);

    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      orgId: orgInfo.orgId,
      token,
      provider: provider.name,
    })).toString('base64');

    return NextResponse.redirect(provider.buildAuthUrl(state));
  } catch (error: unknown) {
    console.error('Error in /api/drive:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
