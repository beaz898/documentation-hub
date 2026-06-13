CREATE OR REPLACE FUNCTION public.transfer_owner(
  p_org_id              uuid,
  p_current_owner_user  uuid,
  p_new_owner_user      uuid
)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_current_is_owner boolean;
  v_new_is_owner     boolean;
  v_has_elevation    boolean;
BEGIN
  -- No transferir a uno mismo
  IF p_current_owner_user = p_new_owner_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'same_user');
  END IF;

  -- Bloquear y leer la fila del owner actual
  SELECT is_owner INTO v_current_is_owner
  FROM memberships
  WHERE org_id = p_org_id AND user_id = p_current_owner_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'current_not_member');
  END IF;

  IF v_current_is_owner IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('success', false, 'error', 'caller_not_owner');
  END IF;

  -- Bloquear y leer la fila del destino
  SELECT is_owner INTO v_new_is_owner
  FROM memberships
  WHERE org_id = p_org_id AND user_id = p_new_owner_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_member');
  END IF;

  -- El destino debe tener una elevación temporal activa (regla del modelo de 2 roles)
  SELECT EXISTS (
    SELECT 1 FROM temporary_elevations
    WHERE org_id = p_org_id
      AND user_id = p_new_owner_user
      AND revoked_at IS NULL
  ) INTO v_has_elevation;

  IF NOT v_has_elevation THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_elevated');
  END IF;

  -- Transferencia atomica (Opcion 2: ceder del todo, sin residuos)

  -- 1. Quitar owner al actual y degradarlo a MEMBER NORMAL (sin elevacion)
  UPDATE memberships
  SET is_owner = false,
      role     = 'member'
  WHERE org_id = p_org_id AND user_id = p_current_owner_user;

  -- 2. Asignar owner al nuevo y ponerlo como admin
  UPDATE memberships
  SET is_owner = true,
      role     = 'admin'
  WHERE org_id = p_org_id AND user_id = p_new_owner_user;

  -- 3. Revocar la elevacion activa del nuevo owner (ya no la necesita: es owner)
  UPDATE temporary_elevations
  SET revoked_at = now(),
      revoked_by = p_new_owner_user
  WHERE org_id = p_org_id
    AND user_id = p_new_owner_user
    AND revoked_at IS NULL;

  -- (No se crea ninguna elevacion para el viejo owner: transferir cede del todo.)

  RETURN jsonb_build_object('success', true);
END;
$function$;
