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

// ── POR QUÉ NO HAY ORGANIZACIÓN, QUE NO ES UNA SOLA COSA ─────────────────────
//
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ HASTA EL 14/09/2026 ESTAS DOS COSAS SALÍAN POR EL MISMO `null`:
//
//     if (error || !membership) return null;
//
// «la base no contestó» y «este usuario no pertenece a ninguna organización».
// `null` ya significaba lo segundo, así que el fallo de infraestructura se
// disfrazaba de afirmación sobre el usuario. Es la regla de la casa sobre
// `DriveProvider.listFiles` (B.138) en su segunda aparición: un tipo que no
// puede expresar el fallo obliga a inventarse un valor que lo signifique, y ese
// valor ya significa otra cosa.
//
// LO QUE COSTÓ, medido el 14/09/2026 y en dos formas distintas:
//   · 64 apariciones de «No perteneces a ninguna organización» en 52 ficheros,
//     todas con 403 — que le dice al cliente «no tienes derecho, no reintentes»
//     cuando lo cierto era «vuelve a intentarlo».
//   · Y la peor, que no devuelve nada y ESCRIBE: `/api/documentation-gaps` y
//     `/api/feedback` hacían `org?.orgId ?? user.id`, así que un timeout de la
//     base metía una fila con `org_id` = el id del usuario. Una fila en una
//     organización que no existe, persistida y en silencio.
//
// LO QUE ESTE TIPO HABILITA Y HOY NO ENTRA: el reintento. Sin esta distinción,
// reintentar habría reintentado también a quien de verdad no tiene
// organización — se le dan tres vueltas a una respuesta que ya era correcta y
// se le hace esperar por nada. Con ella, el reintento se puede escribir el día
// que haga falta y sólo sobre `indisponible`.
//
// LO QUE SE MIDIÓ SOBRE LA CAUSA, para que no se busque dos veces: las dos
// tablas están indexadas (`memberships_org_id_user_id_key UNIQUE(org_id,user_id)`,
// `idx_memberships_user_id`, `idx_temp_elevations_active`) y las tres consultas
// son búsquedas por clave. NADA EN EL REPOSITORIO EXPLICA 30 SEGUNDOS: la causa
// apunta a la instancia de Supabase, en la misma clase que las políticas RLS del
// bucket que desde aquí no se pueden leer. Lo que sí es nuestro es el número de
// llamadas —3 consultas por llamada, 65 llamadas desde 54 endpoints, sin caché—
// y parte del aumento lo trajo esta misma serie (`extract-text` ganó `resolveOrg`
// en dac6da2a; `subidas/autorizar` nació en 228239d2).
// ═══════════════════════════════════════════════════════════════════════════

export type MotivoDeOrgNoResuelta =
  /** La consulta fue bien y el usuario no tiene fila de pertenencia. Es un
   *  hecho sobre el usuario, y 403 es la respuesta correcta. */
  | 'sin_organizacion'
  /** La consulta no llegó a contestar. NO ES UN HECHO SOBRE EL USUARIO: es el
   *  sistema el que no puede saberlo ahora mismo, y la respuesta es 503. */
  | 'indisponible';

export type ResolucionDeOrg =
  | { resuelta: true;  org: OrgInfo }
  | { resuelta: false; motivo: MotivoDeOrgNoResuelta; detalle: string };

/**
 * El código con el que PostgREST dice «cero filas» en un `.single()`. Cualquier
 * otro error es que la consulta no llegó a contestar.
 *
 * ⚠️ EL LÍMITE DECLARADO, CON SU CONTADOR: esta clasificación depende de un
 * código de una librería ajena. Si PostgREST lo cambiara, un «no hay fila»
 * pasaría a contarse como «indisponible» —503 en vez de 403—, que es el lado
 * SEGURO del fallo: molesta a quien no tiene organización, no le abre la puerta
 * a nadie. Y no sería mudo: `registrarOrgNoResuelta` imprime el código, así que
 * un 503 con `code=PGRST116` en los registros es exactamente la señal de que
 * esta constante se quedó vieja.
 */
const SIN_FILAS = 'PGRST116';

/**
 * ⚠️ LO DESCONOCIDO CUENTA COMO INDISPONIBLE, NO COMO «NO PERTENECE». Si no hay
 * error y tampoco hay dato —que no debería pasar—, lo honesto es decir que no se
 * sabe. Y también es lo cerrado: 503 no le da acceso a nadie.
 */
function clasificar(error: { code?: string } | null, hayDato: boolean): MotivoDeOrgNoResuelta {
  if (error) return error.code === SIN_FILAS ? 'sin_organizacion' : 'indisponible';
  return hayDato ? 'sin_organizacion' : 'indisponible';
}

/** El rastro. Un `indisponible` es un incidente de infraestructura y se ve; un
 *  `sin_organizacion` es rutina y también, porque distinguir los dos en los
 *  registros es lo único que permite contar cuántos de los 403 de ayer eran en
 *  realidad la base cayéndose. */
function registrarOrgNoResuelta(
  donde: string,
  motivo: MotivoDeOrgNoResuelta,
  userId: string,
  detalle: string,
): void {
  console.warn(`[${donde}] org no resuelta | motivo=${motivo} | user=${userId} | ${detalle}`);
}

// ── Lógica central del rol efectivo ──────────────────────────────────────────
//
// Un usuario es admin efectivo si CUALQUIERA de estas es cierta:
//   1. is_owner = true
//   2. role = 'admin'  (rol nativo en memberships)
//   3. tiene una elevación activa en temporary_elevations (revoked_at IS NULL)
//
// Esta es la única función que implementa esa regla. Tanto resolverOrg
// como el runner del agente la llaman; no duplicar la lógica.

type ResolucionDeRol =
  | { resuelta: true;  rol: EffectiveRoleResult }
  | { resuelta: false; motivo: MotivoDeOrgNoResuelta; detalle: string };

async function resolverRolEfectivo(
  supabase: SupabaseClient,
  userId:   string,
  orgId:    string,
): Promise<ResolucionDeRol> {
  let membershipRes: { data: { role: unknown; is_owner: unknown } | null; error: { code?: string; message?: string } | null };
  let elevationRes:  { data: unknown[] | null; error: { message?: string } | null };

  try {
    // ⚠️ EL `try` NO ES DECORADO: si la red o el cliente revientan, sin él la
    // excepción sube hasta el `catch` del endpoint y sale un 500 genérico —
    // indistinguible de un fallo de nuestro código. Aquí sabemos qué falló.
    [membershipRes, elevationRes] = await Promise.all([
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
    ]) as [typeof membershipRes, typeof elevationRes];
  } catch (err) {
    const detalle = err instanceof Error ? err.message : 'excepción sin mensaje';
    return { resuelta: false, motivo: 'indisponible', detalle: `rol: ${detalle}` };
  }

  if (membershipRes.error || !membershipRes.data) {
    const motivo = clasificar(membershipRes.error, Boolean(membershipRes.data));
    return { resuelta: false, motivo, detalle: `rol: ${membershipRes.error?.message ?? 'sin fila'}` };
  }

  const nativeRole:      OrgRole = membershipRes.data.role     as OrgRole;
  const isOwner:         boolean = Boolean(membershipRes.data.is_owner);
  // ⚠️ LA ELEVACIÓN FALLA CERRADA Y NO ABORTA: si su consulta falla, se cuenta
  // como «no hay elevación» —el usuario conserva su rol nativo— en vez de negar
  // el acceso entero. Es una concesión temporal: perderla degrada, nunca escala.
  const elevationActive: boolean =
    !elevationRes.error &&
    Array.isArray(elevationRes.data) &&
    elevationRes.data.length > 0;

  const effectiveRole: OrgRole =
    isOwner || nativeRole === 'admin' || elevationActive ? 'admin' : 'member';

  return { resuelta: true, rol: { effectiveRole, nativeRole, isOwner, elevationActive } };
}

/**
 * ⚠️ SIGUE DEVOLVIENDO `null` PARA LAS DOS COSAS, Y AQUÍ ESO ESTÁ BIEN. Su
 * único llamador externo —`lib/agent/runner-conv.ts:472`— hace
 * `?.effectiveRole ?? 'member'`, o sea que el fallo DEGRADA el rol. No hay
 * mentira que corregir: nadie afirma nada sobre el usuario, y un fallo de la
 * base quita permisos en vez de darlos.
 */
export async function getEffectiveRole(
  supabase: SupabaseClient,
  userId:   string,
  orgId:    string,
): Promise<EffectiveRoleResult | null> {
  const r = await resolverRolEfectivo(supabase, userId, orgId);
  return r.resuelta ? r.rol : null;
}

// ── resolverOrg ───────────────────────────────────────────────────────────────

export async function resolverOrg(
  supabase: SupabaseClient,
  userId:   string,
): Promise<ResolucionDeOrg> {
  let data:  { org_id: unknown } | null;
  let error: { code?: string; message?: string } | null;

  try {
    ({ data, error } = await supabase
      .from('memberships')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single() as { data: { org_id: unknown } | null; error: { code?: string; message?: string } | null });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : 'excepción sin mensaje';
    registrarOrgNoResuelta('resolverOrg', 'indisponible', userId, detalle);
    return { resuelta: false, motivo: 'indisponible', detalle };
  }

  if (error || !data) {
    const motivo  = clasificar(error, Boolean(data));
    const detalle = error?.message ?? 'sin fila de pertenencia';
    registrarOrgNoResuelta('resolverOrg', motivo, userId, `${detalle} | code=${error?.code ?? '-'}`);
    return { resuelta: false, motivo, detalle };
  }

  const orgId = data.org_id as string;
  const rol   = await resolverRolEfectivo(supabase, userId, orgId);

  if (!rol.resuelta) {
    registrarOrgNoResuelta('resolverOrg', rol.motivo, userId, `org=${orgId} | ${rol.detalle}`);
    return { resuelta: false, motivo: rol.motivo, detalle: rol.detalle };
  }

  return {
    resuelta: true,
    org: {
      orgId,
      role:            rol.rol.effectiveRole,
      nativeRole:      rol.rol.nativeRole,
      isOwner:         rol.rol.isOwner,
      elevationActive: rol.rol.elevationActive,
    },
  };
}
