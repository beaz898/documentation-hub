import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Verify auth
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;

    // Build Google OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      orgId: user.user_metadata?.org_id || user.id,
      token,
    })).toString('base64');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: unknown) {
    console.error('Error in /api/drive:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
