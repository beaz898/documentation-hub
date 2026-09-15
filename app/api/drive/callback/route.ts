import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { encrypt } from '@/lib/crypto';
import { getProvider } from '@/lib/drive/registry';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { verificarEstadoDeOAuth, codigoDeEstadoRechazado } from '@/lib/drive/estado-oauth';
import { secretoDeFirma } from '@/lib/analysis/secreto';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const stateParam = req.nextUrl.searchParams.get('state');
    const error = req.nextUrl.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/chat?drive_error=access_denied', req.url));
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(new URL('/chat?drive_error=missing_params', req.url));
    }

    // ══════════════════════════════════════════════════════════════════
    // ⚠️ B.227 — ESTA RUTA NO TENÍA AUTENTICACIÓN NINGUNA, Y ESCRIBÍA.
    //
    // Hasta el 15/09/2026 aquí se hacía `JSON.parse(base64(stateParam))` y el
    // `state.orgId` resultante se metía en un `upsert` con
    // `onConflict: 'org_id'` y clave de servicio. El `state` no iba firmado:
    // **cualquiera componía uno**. Con el `orgId` de otra organización, el
    // atacante completaba el flujo con SU cuenta de Drive y le sobrescribía la
    // conexión — y en la siguiente sincronización, disparada por un miembro
    // legítimo, el sistema leía el Drive del atacante: **importaba sus
    // documentos y borraba los que la víctima tenía sincronizados**, porque
    // «ya no están en Drive».
    //
    // ⚠️ Y LA GUARDA ESTABA DISEÑADA Y SIN CABLEAR: el `state` llevaba un campo
    // `token` con la sesión, esta función lo DECLARABA EN SU TIPO, y no lo leía
    // en ninguna línea. No faltaba por diseñar: se diseñó y nadie la conectó.
    //
    // Ahora son DOS cosas, y hacen falta las dos:
    //   · la COOKIE dice quién eres — esta ruta es una navegación de primer
    //     nivel desde Google, así que la sesión llega;
    //   · la FIRMA dice que el `state` lo emitimos nosotros, para esa
    //     organización y hace menos de quince minutos.
    // Ninguna sobra: sin la cookie, un `state` capturado se podría reintentar;
    // sin la firma, la cookie no dice nada sobre QUÉ organización es.
    // ══════════════════════════════════════════════════════════════════
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) {
      return NextResponse.redirect(new URL('/chat?drive_error=no_session', req.url));
    }

    const estado = verificarEstadoDeOAuth(stateParam, { userId: user.id }, secretoDeFirma());
    if (!estado.ok) {
      console.warn(`[DRIVE CALLBACK] state rechazado | motivo=${estado.motivo} | user=${user.id}`);
      return NextResponse.redirect(
        new URL(`/chat?drive_error=${codigoDeEstadoRechazado(estado.motivo)}`, req.url),
      );
    }
    const state = estado.datos;

    const provider = getProvider(state.provider);

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await provider.exchangeCodeForTokens(code);
    } catch {
      return NextResponse.redirect(new URL('/chat?drive_error=token_failed', req.url));
    }

    // Get user email and root folders in parallel
    const [email, folders] = await Promise.all([
      provider.getUserEmail(tokens.accessToken),
      provider.listFolders(tokens.accessToken, 'root'),
    ]);

    const supabase = createServiceClient();

    const { error: insertError } = await supabase.from('drive_connections').upsert({
      org_id: state.orgId,
      user_id: state.userId,
      provider: provider.name,
      access_token: encrypt(tokens.accessToken),
      refresh_token: encrypt(tokens.refreshToken),
      token_expires_at: tokens.expiresAt.toISOString(),
      email,
      folder_id: 'root',
      folder_name: 'Mi Drive',
    }, { onConflict: 'org_id' });

    if (insertError) {
      console.error('Error saving drive connection:', insertError);
      return NextResponse.redirect(new URL('/chat?drive_error=save_failed', req.url));
    }

    const foldersParam = encodeURIComponent(JSON.stringify(folders));
    return NextResponse.redirect(
      new URL(`/chat?drive_connected=true&drive_provider=${provider.name}&drive_folders=${foldersParam}`, req.url)
    );
  } catch (error: unknown) {
    console.error('Error in /api/drive/callback:', error);
    return NextResponse.redirect(new URL('/chat?drive_error=internal', req.url));
  }
}
