-- ============================================================================
-- supabase-owner-verify.sql — Doclity
-- B.15 · Fase 1 — Verificación posterior a la migración
-- ----------------------------------------------------------------------------
-- Ejecutar en el SQL Editor DESPUÉS de supabase-owner-and-elevations.sql.
-- Solo lee datos; no modifica nada. Sirve para confirmar a ojo que el owner
-- inicial de cada organización es quien debe ser.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- A. ¿Cuántos owners tiene cada organización?
--    LO ESPERADO: todas las filas con n_owners = 1.
--    Si alguna org sale con 0, es que no tenía ningún miembro 'admin'
--    (revisar manualmente quién debería ser el owner).
--    Si alguna saliera con 2+, algo va mal (el índice único debería
--    haberlo impedido) — avisar antes de continuar.
-- ----------------------------------------------------------------------------
SELECT
  o.id   AS org_id,
  o.name AS org_name,
  COUNT(*) FILTER (WHERE m.is_owner) AS n_owners
FROM public.organizations o
LEFT JOIN public.memberships m ON m.org_id = o.id
GROUP BY o.id, o.name
ORDER BY n_owners, o.name;


-- ----------------------------------------------------------------------------
-- B. ¿Quién es el owner de cada organización, y cuándo entró?
--    Permite revisar a ojo que el owner marcado es el creador real.
--    Compara joined_at del owner con el del resto para detectar rarezas.
-- ----------------------------------------------------------------------------
SELECT
  o.name        AS org_name,
  m.user_id     AS owner_user_id,
  m.role        AS owner_role,
  m.joined_at   AS owner_joined_at
FROM public.memberships m
JOIN public.organizations o ON o.id = m.org_id
WHERE m.is_owner = true
ORDER BY o.name;


-- ----------------------------------------------------------------------------
-- C. Organizaciones SIN owner (caso a revisar manualmente).
--    LO ESPERADO: cero filas. Si aparece alguna, es una org sin ningún
--    miembro 'admin' — habrá que decidir su owner a mano en la Fase 2.
-- ----------------------------------------------------------------------------
SELECT
  o.id   AS org_id,
  o.name AS org_name
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.memberships m
  WHERE m.org_id = o.id AND m.is_owner = true
)
ORDER BY o.name;
