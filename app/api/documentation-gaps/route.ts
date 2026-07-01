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
    const question = (body.question ?? '').toString().trim();
    const answer   = (body.answer   ?? '').toString().trim() || null;
    const note     = (body.note     ?? '').toString().trim() || null;

    if (!question) {
      return NextResponse.json({ error: 'La pregunta no puede estar vacía' }, { status: 400 });
    }
    if (question.length > 5000) {
      return NextResponse.json({ error: 'La pregunta no puede superar los 5000 caracteres' }, { status: 400 });
    }
    if (answer !== null && answer.length > 5000) {
      return NextResponse.json({ error: 'La respuesta no puede superar los 5000 caracteres' }, { status: 400 });
    }
    if (note !== null && note.length > 5000) {
      return NextResponse.json({ error: 'La nota no puede superar los 5000 caracteres' }, { status: 400 });
    }

    const org = await resolveOrg(supabase, user.id);
    const orgId = org?.orgId ?? user.id;

    const { error: insertError } = await supabase.from('documentation_gaps').insert({
      org_id:  orgId,
      user_id: user.id,
      question,
      answer,
      note,
    });

    if (insertError) {
      console.error('[DOC_GAPS] Insert error:', insertError);
      return NextResponse.json({ error: 'Error guardando la laguna de documentación' }, { status: 500 });
    }

    console.log(`[DOC_GAPS] Saved from user ${user.id}, org ${orgId} (${question.length} chars)`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in /api/documentation-gaps:', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
