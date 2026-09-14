import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthenticatedUserHybrid } from '@/lib/supabase-server';
import { resolverOrg } from '@/lib/org';
import { respuestaDeOrgNoResuelta } from '@/lib/org-respuesta';

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

    // ⚠️ AQUÍ EL FALLO NO DEVOLVÍA ERROR: ESCRIBÍA. Hasta el 14/09/2026 esto
    // era `org?.orgId ?? user.id`, así que un timeout de la base metía la fila
    // con el id del USUARIO en la columna de organización — una fila en una
    // organización que no existe, persistida y en silencio. Lo que se guarda
    // arrastra su fallo; lo que se calcula lo pierde al recalcular.
    //
    // `indisponible` ya no escribe: 503 y que el cliente reintente.
    //
    // ⚠️ Y EL RESPALDO A `user.id` SE CONSERVA PARA `sin_organizacion`, A
    // SABIENDAS Y SIN DECIDIRLO AQUÍ: hoy un usuario sin organización puede
    // mandar esto, y quitárselo sería un cambio de producto, no un arreglo del
    // tipo. Queda anotado como B.223. Lo que se arregla hoy es que un fallo de
    // infraestructura deje de disfrazarse de usuario sin organización.
    const orgR = await resolverOrg(supabase, user.id);
    if (!orgR.resuelta && orgR.motivo === 'indisponible') {
      return respuestaDeOrgNoResuelta(orgR);
    }
    const orgId = orgR.resuelta ? orgR.org.orgId : user.id;

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
