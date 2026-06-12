import type { SupabaseClient } from '@supabase/supabase-js';

// ── Tipo compartido de rol ────────────────────────────────────────────────────

export type OrgRole = 'admin' | 'member';

// ── Resultado de getEffectiveRole ─────────────────────────────────────────────

export interface EffectiveRoleResult {
  effectiveRole:    OrgRole;
  nativeRole:       OrgRole;
  isOwner:          boolean;
  elevationActive:  boolean;
}

// ── OrgInfo (devuelto por resolveOrg) ─────────────────────────────────────────

export interface OrgInfo {
  orgId:            string;
  /** Rol efectivo: tiene en cuenta is_owner y elevaciones temporales activas. */
  role:             OrgRole;
  nativeRole:       OrgRole;
  isOwner:          boolean;
  elevationActive:  boolean;
}

// ── Lógica central del rol efectivo ──────────────────────────────────────────
//
// Un usuario es admin efectivo si CUALQUIERA de estas es cierta:
//   1. is_owner = true
//   2. role = 'admin'  (rol nativo en memberships)
//   3. tiene una elevación activa en temporary_elevations (revoked_at IS NULL)
//
// Esta es la única función que implementa esa regla. Tanto resolveOrg
// como el runner del agente la llaman; no duplicar la lógica.

export async function getEffectiveRole(
  supabase: SupabaseClient,
  userId:   string,
  orgId:    string,
): Promise<EffectiveRoleResult | null> {
  const [membershipRes, elevationRes] = await Promise.all([
    supabase
      .from('memberships')
      .select('role, is_owner')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single(),
    supabase
      .from('temporary_elevations')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .is('revoked_at', null)
      .limit(1),
  ]);

  if (membershipRes.error || !membershipRes.data) return null;

  const nativeRole:      OrgRole = membershipRes.data.role     as OrgRole;
  const isOwner:         boolean = Boolean(membershipRes.data.is_owner);
  const elevationActive: boolean =
    !elevationRes.error &&
    Array.isArray(elevationRes.data) &&
    elevationRes.data.length > 0;

  const effectiveRole: OrgRole =
    isOwner || nativeRole === 'admin' || elevationActive ? 'admin' : 'member';

  return { effectiveRole, nativeRole, isOwner, elevationActive };
}

// ── resolveOrg ────────────────────────────────────────────────────────────────
//
// Busca a qué organización pertenece un usuario y devuelve su rol efectivo.
// Parámetros sin cambio (compatibilidad con los 10+ endpoints que la llaman).

export async function resolveOrg(
  supabase: SupabaseClient,
  userId:   string,
): Promise<OrgInfo | null> {
  const { data: membership, error } = await supabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !membership) {
    console.warn('[resolveOrg] No membership found for user:', userId, error?.message);
    return null;
  }

  const orgId  = membership.org_id as string;
  const result = await getEffectiveRole(supabase, userId, orgId);

  if (!result) {
    console.warn('[resolveOrg] getEffectiveRole returned null for user:', userId, 'org:', orgId);
    return null;
  }

  return {
    orgId,
    role:            result.effectiveRole,
    nativeRole:      result.nativeRole,
    isOwner:         result.isOwner,
    elevationActive: result.elevationActive,
  };
}
