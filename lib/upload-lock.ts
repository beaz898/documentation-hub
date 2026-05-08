import type { SupabaseClient } from '@supabase/supabase-js';

/** Tiempo máximo de bloqueo antes de expiración automática (ms). */
const MAX_LOCK_DURATION_MS = 60 * 60 * 1000; // 60 minutos

export interface UploadLockCheck {
  locked: boolean;
  lockedByEmail?: string;
  isMe: boolean;
}

/**
 * Verifica si la organización tiene el bloqueo de subidas activo.
 * Si el bloqueo ha expirado (>60 min), lo desactiva automáticamente.
 *
 * @returns locked=false si no hay bloqueo o si el que lo tiene es el propio usuario.
 *          locked=true si otro usuario tiene el bloqueo activo.
 */
export async function checkUploadLock(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
): Promise<UploadLockCheck> {
  const { data: orgData } = await supabase
    .from('organizations')
    .select('upload_locked_by, upload_locked_at')
    .eq('id', orgId)
    .single();

  if (!orgData?.upload_locked_by) {
    return { locked: false, isMe: false };
  }

  // Es el propio usuario: no bloquear
  if (orgData.upload_locked_by === userId) {
    return { locked: false, isMe: true };
  }

  // Comprobar expiración
  if (orgData.upload_locked_at) {
    const elapsed = Date.now() - new Date(orgData.upload_locked_at).getTime();
    if (elapsed > MAX_LOCK_DURATION_MS) {
      // Expirado: desbloquear automáticamente
      await supabase
        .from('organizations')
        .update({ upload_locked_by: null, upload_locked_at: null })
        .eq('id', orgId);
      return { locked: false, isMe: false };
    }
  }

  // Bloqueado por otro usuario
  let lockedByEmail: string | undefined;
  try {
    const { data: lockerUser } = await supabase.auth.admin.getUserById(orgData.upload_locked_by);
    lockedByEmail = lockerUser?.user?.email || undefined;
  } catch {
    // Si falla obtener el email, no es crítico
  }

  return { locked: true, lockedByEmail, isMe: false };
}
