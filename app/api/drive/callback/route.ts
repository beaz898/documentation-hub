import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

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

    // Decode state
    let state: { userId: string; orgId: string; token: string };
    try {
      state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    } catch {
      return NextResponse.redirect(new URL('/chat?drive_error=invalid_state', req.url));
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/chat?drive_error=token_failed', req.url));
    }

    const tokens = await tokenResponse.json();

    // Get user email
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userInfoRes.json();

    // Get root folders to let user pick (for now, use root "My Drive")
    // In a future version, we can show a folder picker
    const driveRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=%27root%27+in+parents+and+mimeType%3D%27application/vnd.google-apps.folder%27&fields=files(id,name)&orderBy=name',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const driveData = await driveRes.json();
    const folders = driveData.files || [];

    // Save connection with the first folder or root
    // For MVP: we'll redirect to a page where user picks the folder
    // For now, save tokens and redirect to folder picker
    const supabase = createServiceClient();

    // Store tokens temporarily in the connection (folder will be set by picker)
    const { error: insertError } = await supabase.from('drive_connections').upsert({
      org_id: state.orgId,
      user_id: state.userId,
      provider: 'google_drive',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      token_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      email: userInfo.email || '',
      folder_id: 'root',
      folder_name: 'Mi Drive',
    }, { onConflict: 'org_id' });

    if (insertError) {
      console.error('Error saving drive connection:', insertError);
      return NextResponse.redirect(new URL('/chat?drive_error=save_failed', req.url));
    }

    // Redirect back to chat with success
    const foldersParam = encodeURIComponent(JSON.stringify(folders));
    return NextResponse.redirect(
      new URL(`/chat?drive_connected=true&drive_folders=${foldersParam}`, req.url)
    );
  } catch (error: unknown) {
    console.error('Error in /api/drive/callback:', error);
    return NextResponse.redirect(new URL('/chat?drive_error=internal', req.url));
  }
}
