import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';
import { getOrgFeatures } from '@/lib/plan-features';
import { getProvider } from '@/lib/drive/registry';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { firmarEstadoDeOAuth } from '@/lib/drive/estado-oauth';
import { secretoDeFirma } from '@/lib/analysis/secreto';
import {
  decidirSiSePuedeConectar,
  mensajeDeConexionExistente,
} from '@/lib/drive/permiso-para-conectar';

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

    // ══════════════════════════════════════════════════════════════════
    // ⚠️ B.232 — NO SE EMPIEZA UN FLUJO DE CONEXIÓN SI YA HAY UNA.
    //
    // `drive_connections` tiene `UNIQUE (org_id)` y el callback hace `upsert`
    // por esa columna: conectar otra cuenta SOBRESCRIBE la que había, sin
    // desconectar y sin avisar. El daño no se ve entonces — llega en la
    // sincronización siguiente, que lista la cuenta nueva, no encuentra ni uno
    // de los documentos viejos y LOS BORRA TODOS, sin tope y sin preguntar,
    // porque el `folder_id` sigue siendo 'root' y la guarda del cambio de
    // carpeta es ciega a un cambio de CUENTA.
    //
    // ⚠️ Y NO HACÍA FALTA TECLEAR NINGUNA URL. La barra lateral sólo pinta los
    // botones de conectar cuando cree que no hay conexión, y ese estado arranca
    // en `false` y sólo se corrige SI la llamada de estado responde. Un timeout
    // de los ya fichados (B.224) deja los botones pintados con la conexión viva.
    // Un clic, y la conexión se pisa.
    //
    // POR ESO LA GUARDA VA AQUÍ Y NO EN LA PANTALLA: en el servidor cierra las
    // tres puertas a la vez — el botón fantasma, la URL escrita a mano y el
    // botón de atrás del navegador.
    //
    // Y manda a DESCONECTAR a propósito: es el único camino que ya le dice al
    // usuario lo que va a perder («se eliminarán todos los documentos
    // sincronizados»). Conectar encima no avisaba de nada y borraba igual, un
    // rato después y sin relacionarlo con el clic.
    // ══════════════════════════════════════════════════════════════════
    const lectura = await supabase.from('drive_connections')
      .select('provider, email')
      .eq('org_id', orgInfo.orgId)
      .maybeSingle();

    const permiso = decidirSiSePuedeConectar(lectura);
    if (!permiso.puede) {
      if (permiso.motivo === 'ya_conectado') {
        console.warn(`[DRIVE] conexión rechazada | org=${orgInfo.orgId} | ya conectado a ${permiso.provider}`);
        return NextResponse.json(
          {
            error: mensajeDeConexionExistente(permiso.email, permiso.provider),
            errorType: 'ya_conectado',
          },
          { status: 409 },
        );
      }
      // ⚠️ NO SE PUDO COMPROBAR ≠ NO HAY. Falla cerrada, y con 503 para que el
      // cliente sepa que esto se reintenta — es la misma distinción que el tipo
      // de `resolveOrg` puso el 14/09.
      console.error(`[DRIVE] no se pudo comprobar la conexión existente | org=${orgInfo.orgId}`);
      return NextResponse.json(
        {
          error: 'No se ha podido comprobar si ya tienes una cuenta conectada. Es un problema temporal: vuelve a intentarlo en unos segundos.',
          errorType: 'no_se_pudo_comprobar',
        },
        { status: 503, headers: { 'Retry-After': '5' } },
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
