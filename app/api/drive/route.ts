import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import { getOrgFeatures } from '@/lib/plan-features';
import { getProvider } from '@/lib/drive/registry';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { firmarEstadoDeOAuth } from '@/lib/drive/estado-oauth';
import { secretoDeFirma } from '@/lib/analysis/secreto';

export async function GET(req: NextRequest) {
  try {
    // ⚠️ B.227 — LA SESIÓN YA NO VIAJA EN LA URL. Hasta el 15/09/2026 esto
    // leía `?token=` y el cliente ponía ahí el token de sesión: acababa en el
    // historial del navegador, en cualquier `Referer` y —porque el `state` lo
    // llevaba dentro— en los registros de Google. Esta ruta se abre con una
    // navegación de primer nivel, así que las cookies llegan solas y no hacía
    // ninguna falta.
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createServiceClient();

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

    // ⚠️ B.227 — EL `state` VA FIRMADO, y sin ninguna credencial dentro. Antes
    // era `base64(JSON)` a secas: cualquiera componía uno con el `orgId` de otra
    // organización y el callback le sobrescribía su conexión de Drive. La firma
    // no demuestra quién eres —eso lo hace la cookie en el callback— sino que
    // **este `state` lo emitimos nosotros, para esta organización, hace poco**.
    const state = firmarEstadoDeOAuth(
      { userId: user.id, orgId: orgInfo.orgId, provider: provider.name },
      secretoDeFirma(),
    );

    return NextResponse.redirect(provider.buildAuthUrl(state));
  } catch (error: unknown) {
    console.error('Error in /api/drive:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
