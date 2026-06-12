-- ============================================================================
-- supabase-owner-and-elevations.sql — Doclity
-- B.15 · Fase 1 — Admin principal (owner) + elevaciones temporales
-- ----------------------------------------------------------------------------
-- Esta migración SÍ se ejecuta sobre la base de datos real (a diferencia del
-- supabase-setup.sql, que es solo referencia).
--
-- Ejecutar en el SQL Editor de Supabase. Es idempotente en lo posible
-- (IF NOT EXISTS) para que reejecutarla no rompa nada.
--
-- NO toca código de la app. Tras ejecutar, correr la query de verificación
-- (ver supabase-owner-verify.sql) antes de seguir con la Fase 2.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Columna is_owner en memberships
--    Marca al admin principal de cada organización. Por defecto false.
-- ----------------------------------------------------------------------------
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;


-- ----------------------------------------------------------------------------
-- 2. Índice único parcial: como mucho UN owner por organización.
--    Garantía dura a nivel de base de datos: aunque el código fallara,
--    Postgres rechaza un segundo is_owner=true en la misma org.
--    (El "al menos uno" lo garantiza la lógica del paso 3 y la Fase 2.)
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uniq_one_owner_per_org
  ON public.memberships (org_id)
  WHERE is_owner = true;


-- ----------------------------------------------------------------------------
-- 3. Marcado del owner inicial de cada organización existente.
--    Criterio: el miembro 'admin' más antiguo por joined_at de cada org.
--    (No existe created_by en la base; este es el mejor proxy del creador.)
--
--    DISTINCT ON (org_id) + ORDER BY joined_at ASC elige, por cada org,
--    el admin que entró primero. Solo marca orgs que aún no tengan owner,
--    de modo que reejecutar la migración no pisa owners ya asignados.
-- ----------------------------------------------------------------------------
WITH primer_admin AS (
  SELECT DISTINCT ON (m.org_id)
         m.id AS membership_id,
         m.org_id
  FROM public.memberships m
  WHERE m.role = 'admin'
  ORDER BY m.org_id, m.joined_at ASC, m.id ASC
)
UPDATE public.memberships AS m
SET is_owner = true
FROM primer_admin pa
WHERE m.id = pa.membership_id
  -- No marcar si esa org ya tiene un owner asignado
  AND NOT EXISTS (
    SELECT 1 FROM public.memberships o
    WHERE o.org_id = m.org_id AND o.is_owner = true
  );


-- ----------------------------------------------------------------------------
-- 4. Tabla de elevaciones temporales (member -> admin temporal).
--    Registro de auditoría: quién fue elevado, por quién, cuándo, y cuándo
--    se revocó. expires_at queda preparada para expiración automática futura
--    (de momento siempre NULL: en v1 la revocación es manual).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.temporary_elevations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  -- Usuario que recibe la elevación temporal a admin
  user_id uuid NOT NULL,
  -- Owner que concedió la elevación
  granted_by uuid NOT NULL,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Preparado para expiración automática futura. NULL = sin expiración (v1 manual).
  expires_at timestamp with time zone,
  -- Revocación manual: NULL mientras la elevación está activa.
  revoked_at timestamp with time zone,
  -- Owner que revocó (si se revocó manualmente).
  revoked_by uuid,
  CONSTRAINT temporary_elevations_pkey PRIMARY KEY (id),
  CONSTRAINT temporary_elevations_org_id_fkey   FOREIGN KEY (org_id)     REFERENCES public.organizations(id),
  CONSTRAINT temporary_elevations_user_id_fkey  FOREIGN KEY (user_id)    REFERENCES auth.users(id),
  CONSTRAINT temporary_elevations_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id),
  CONSTRAINT temporary_elevations_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES auth.users(id)
);

-- Índice: localizar rápidamente la elevación ACTIVA de un usuario en una org.
-- Una elevación está activa si revoked_at IS NULL.
CREATE INDEX IF NOT EXISTS idx_temp_elevations_active
  ON public.temporary_elevations (org_id, user_id)
  WHERE revoked_at IS NULL;

-- Índice: como mucho UNA elevación activa por (org, usuario).
-- Evita duplicar elevaciones activas para el mismo usuario.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_elevation_per_user
  ON public.temporary_elevations (org_id, user_id)
  WHERE revoked_at IS NULL;


-- ----------------------------------------------------------------------------
-- 5. RLS en temporary_elevations.
--    Política mínima de SOLO LECTURA por pertenencia a la org (patrón
--    memberships, el robusto). La escritura la harán los endpoints vía
--    service role en la Fase 2; por eso aquí no se añaden políticas de
--    INSERT/UPDATE todavía. Mientras tanto, nadie escribe en esta tabla.
-- ----------------------------------------------------------------------------
ALTER TABLE public.temporary_elevations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org temporary elevations"
  ON public.temporary_elevations
  FOR SELECT
  USING (
    org_id IN (
      SELECT m.org_id FROM public.memberships m WHERE m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FIN — tras ejecutar, correr la verificación antes de la Fase 2.
-- ============================================================================
