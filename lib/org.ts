import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resultado de resolver la organización de un usuario.
 */
export interface OrgInfo {
  /** ID de la organización a la que pertenece el usuario. */
  orgId: string;
  /** Rol del usuario en la organización ('admin' o 'member'). */
  role: 'admin' | 'member';
}

/**
 * Busca a qué organización pertenece un usuario y cuál es su rol.
 *
 * Reemplaza el patrón anterior:
 *   orgId = user.user_metadata?.org_id || user.id
 *
 * Ahora consulta la tabla `memberships` para obtener el dato real.
 *
 * @param supabase - Cliente de Supabase (service role).
 * @param userId - ID del usuario autenticado.
 * @returns OrgInfo con orgId y role, o null si el usuario no pertenece a ninguna org.
 */
export async function resolveOrg(
  supabase: SupabaseClient,
  userId: string
): Promise<OrgInfo | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('org_id, role')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !data) {
    console.warn('[resolveOrg] No membership found for user:', userId, error?.message);
    return null;
  }

  return {
    orgId: data.org_id,
    role: data.role as 'admin' | 'member',
  };
}
