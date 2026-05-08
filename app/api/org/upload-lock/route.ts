import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveOrg } from '@/lib/org';

/** Tiempo máximo de bloqueo antes de expiración automática (ms). */
const MAX_LOCK_DURATION_MS = 60 * 60 * 1000; // 60 minutos

/**
 * GET /api/org/upload-lock
 * Consulta el estado actual del bloqueo de subidas de la organización.
 *
 * POST /api/org/upload-lock
 * Body: { locked: true } para activar, { locked: false } para desactivar.
 * Cualquier usuario puede activar/desactivar.
 * Si el bloqueo ha expirado (>60 min), se desactiva automáticamente.
 */

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('upload_locked_by, upload_locked_at')
      .eq('id', org.orgId)
      .single();

    if (!orgData) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 });
    }

    // Comprobar expiración
    if (orgData.upload_locked_by && orgData.upload_locked_at) {
      const elapsed = Date.now() - new Date(orgData.upload_locked_at).getTime();
      if (elapsed > MAX_LOCK_DURATION_MS) {
        // Expirado: desbloquear automáticamente
        await supabase
          .from('organizations')
          .update({ upload_locked_by: null, upload_locked_at: null })
          .eq('id', org.orgId);

        return NextResponse.json({
          locked: false,
          lockedBy: null,
          lockedAt: null,
          isMe: false,
          expired: true,
        });
      }
    }

    // Obtener email del usuario que tiene el bloqueo
    let lockedByEmail: string | null = null;
    if (orgData.upload_locked_by) {
      const { data: lockerUser } = await supabase.auth.admin.getUserById(orgData.upload_locked_by);
      lockedByEmail = lockerUser?.user?.email || null;
    }

    return NextResponse.json({
      locked: !!orgData.upload_locked_by,
      lockedBy: lockedByEmail,
      lockedAt: orgData.upload_locked_at,
      isMe: orgData.upload_locked_by === user.id,
    });
  } catch (error: unknown) {
    console.error('[upload-lock] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const org = await resolveOrg(supabase, user.id);
    if (!org) {
      return NextResponse.json({ error: 'No perteneces a ninguna organización.' }, { status: 403 });
    }

    const body = await req.json();
    const { locked } = body;

    if (typeof locked !== 'boolean') {
      return NextResponse.json({ error: 'Campo "locked" (boolean) requerido' }, { status: 400 });
    }

    if (locked) {
      // Activar bloqueo: verificar que no está ya bloqueado por otro
      const { data: orgData } = await supabase
        .from('organizations')
        .select('upload_locked_by, upload_locked_at')
        .eq('id', org.orgId)
        .single();

      if (orgData?.upload_locked_by && orgData.upload_locked_by !== user.id) {
        // Comprobar expiración antes de rechazar
        const elapsed = Date.now() - new Date(orgData.upload_locked_at).getTime();
        if (elapsed <= MAX_LOCK_DURATION_MS) {
          const { data: lockerUser } = await supabase.auth.admin.getUserById(orgData.upload_locked_by);
          return NextResponse.json({
            error: `El bloqueo está activo por ${lockerUser?.user?.email || 'otro usuario'}.`,
            errorType: 'locked_by_other',
          }, { status: 409 });
        }
        // Expirado: permitir tomar el bloqueo
      }

      await supabase
        .from('organizations')
        .update({
          upload_locked_by: user.id,
          upload_locked_at: new Date().toISOString(),
        })
        .eq('id', org.orgId);

      return NextResponse.json({ locked: true, isMe: true });
    } else {
      // Desactivar bloqueo: cualquier usuario puede desbloquear
      await supabase
        .from('organizations')
        .update({ upload_locked_by: null, upload_locked_at: null })
        .eq('id', org.orgId);

      return NextResponse.json({ locked: false, isMe: false });
    }
  } catch (error: unknown) {
    console.error('[upload-lock] POST error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
