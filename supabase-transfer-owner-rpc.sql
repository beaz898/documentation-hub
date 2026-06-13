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
  IF p_current_owner_user = p_new_owner_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'same_user');
  END IF;

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

  SELECT is_owner INTO v_new_is_owner
  FROM memberships
  WHERE org_id = p_org_id AND user_id = p_new_owner_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_member');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM temporary_elevations
    WHERE org_id = p_org_id
      AND user_id = p_new_owner_user
      AND revoked_at IS NULL
  ) INTO v_has_elevation;

  IF NOT v_has_elevation THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_elevated');
  END IF;

  UPDATE memberships
  SET is_owner = false, role = 'member'
  WHERE org_id = p_org_id AND user_id = p_current_owner_user;

  UPDATE memberships
  SET is_owner = true, role = 'admin'
  WHERE org_id = p_org_id AND user_id = p_new_owner_user;

  UPDATE temporary_elevations
  SET revoked_at = now(), revoked_by = p_new_owner_user
  WHERE org_id = p_org_id
    AND user_id = p_new_owner_user
    AND revoked_at IS NULL;

  INSERT INTO temporary_elevations (org_id, user_id, granted_by)
  VALUES (p_org_id, p_current_owner_user, p_new_owner_user);

  RETURN jsonb_build_object('success', true);
END;
$function$;
