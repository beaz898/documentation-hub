import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { encrypt } from '@/lib/crypto';
import { getProvider } from '@/lib/drive/registry';

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

    let state: { userId: string; orgId: string; token: string; provider?: string };
    try {
      state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    } catch {
      return NextResponse.redirect(new URL('/chat?drive_error=invalid_state', req.url));
    }

    const provider = getProvider(state.provider || 'google_drive');

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
