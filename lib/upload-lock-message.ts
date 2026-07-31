/**
 * Helper compartido para el rechazo por candado (B.64). Toda acción de UI que
 * mute el corpus (sync, borrado, indexar, duplicados) usa esto para mostrar un
 * mensaje uniforme y reconocible cuando el backend responde 423 (upload_locked),
 * en vez de un error rojo genérico. Lección de B.59: el rechazo debe verse claro.
 *
 * Uso:
 *   const res = await fetch(...);
 *   if (!res.ok) {
 *     const data = await res.json().catch(() => ({}));
 *     const lockMsg = uploadLockMessage(res.status, data);
 *     const mensaje = lockMsg ?? (data.error || 'Error');
 *     // mostrar 'mensaje' como corresponda en cada UI
 *   }
 */

interface MaybeLockError {
  error?: string;
  errorType?: string;
}

/**
 * Devuelve un mensaje de candado si la respuesta es un rechazo por bloqueo
 * (HTTP 423 o errorType 'upload_locked'), o null si no lo es.
 * Prefiere el texto que ya manda el backend (incluye quién bloqueó); si no
 * viene, usa un texto genérico de candado.
 */
export function uploadLockMessage(status: number, data: MaybeLockError): string | null {
  const isLock = status === 423 || data?.errorType === 'upload_locked';
  if (!isLock) return null;
  const base = data?.error && data.error.trim().length > 0
    ? data.error
    : 'El corpus está bloqueado por otro usuario. Espera a que termine o a que expire el bloqueo.';
  return `🔒 ${base}`;
}
