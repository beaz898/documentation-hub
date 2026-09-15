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

    // ⚠️ B.223 — SIN ORGANIZACIÓN RESUELTA NO HAY EFECTO QUE REGISTRAR.
    //
    // ═══════════════════════════════════════════════════════════════════
    // Hasta el 14/09/2026 esto era `org?.orgId ?? user.id`: un timeout de la
    // base metía la fila con el id del USUARIO en la columna de organización —
    // una fila en una organización que no existe, persistida y en silencio. Es
    // el defecto de tipo de `resolveOrg` en su versión que ENSUCIA EL ALMACÉN,
    // y por eso era peor que el mensaje que mentía: un fallo de cálculo
    // desaparece al recalcular; uno de escritura sigue ahí cuando el código ya
    // está bien.
    //
    // El 15/09/2026 se retira TAMBIÉN el respaldo para `sin_organizacion`, y no
    // es la misma decisión que la de arriba: aquélla arreglaba un tipo, ésta
    // CAMBIA EL PRODUCTO. Quien no pertenezca a ninguna organización deja de
    // poder escribir aquí. Se decide así porque la columna `org_id` vuelve a
    // significar una sola cosa —una organización real— y porque un identificador
    // inventado no se distingue después de uno legítimo: la fila mentiría para
    // siempre, y nadie podría separarlas sin adivinar.
    //
    // ⚠️ La forma correcta el día que haga falta recoger esto de alguien sin
    // organización NO es volver al respaldo: es una columna que pueda decir la
    // verdad —`org_id` anulable— en vez de una que miente con un valor con
    // dueño.
    // ═══════════════════════════════════════════════════════════════════
    const orgR = await resolverOrg(supabase, user.id);
    if (!orgR.resuelta) return respuestaDeOrgNoResuelta(orgR);
    const orgId = orgR.org.orgId;

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
