import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolveOrg } from '@/lib/org';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserHybrid(req);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const supabase = createServiceClient();

    const body = await req.json();
    const message = (body.message || '').toString().trim();

    if (!message) {
      return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'El mensaje no puede superar los 5000 caracteres' }, { status: 400 });
    }

    // Resolver organización
    const org = await resolveOrg(supabase, user.id);
    const orgId = org?.orgId || user.id;

    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user.id,
      org_id: orgId,
      message,
    });

    if (insertError) {
      console.error('[FEEDBACK] Insert error:', insertError);
      return NextResponse.json({ error: 'Error guardando feedback' }, { status: 500 });
    }

    console.log(`[FEEDBACK] Saved from user ${user.id} (${message.length} chars)`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in /api/feedback:', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
