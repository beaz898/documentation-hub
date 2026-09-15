-- ============================================================
-- B.223 · RECUENTO DE FILAS CON `org_id` FABRICADO — 15/09/2026
--
-- ⚠️ ESTE FICHERO NO BORRA NADA Y NO DEBE BORRAR NADA. Es sólo el recuento.
--    La limpieza se decide DESPUÉS, con estas cifras delante, y puede que la
--    decisión no sea borrar: una fila con `org_id` = el id de un usuario es
--    RECUPERABLE si ese usuario pertenece hoy a una organización — bastaría
--    reasignarla. Borrarla sería perder trabajo del director.
--
-- QUÉ LAS PRODUJO: hasta el 14/09/2026, `/api/documentation-gaps` y
-- `/api/feedback` hacían `org?.orgId ?? user.id`. `resolveOrg` devolvía `null`
-- tanto para «no perteneces» como para «la base no contestó», así que un
-- timeout escribía la fila con el id del USUARIO en la columna de organización.
-- Desde el 15/09/2026 ninguno de los dos escribe sin organización resuelta.
-- ============================================================

-- ── 1 · CUÁNTAS SON, POR TABLA, Y DE CUÁNDO ──────────────────────────────
-- «Fabricada» = su `org_id` no existe en `organizations`. Se define por
-- AUSENCIA en la tabla real, no por parecerse a un `user_id`: así también
-- caza cualquier otra vía que no conozcamos.

SELECT 'documentation_gaps' AS tabla,
       COUNT(*)             AS filas_fabricadas,
       MIN(created_at)      AS la_mas_antigua,
       MAX(created_at)      AS la_mas_reciente,
       COUNT(DISTINCT org_id) AS org_ids_distintos
FROM documentation_gaps g
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = g.org_id)

UNION ALL

SELECT 'feedback',
       COUNT(*),
       MIN(created_at),
       MAX(created_at),
       COUNT(DISTINCT org_id)
FROM feedback f
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = f.org_id);


-- ── 2 · EL DENOMINADOR ───────────────────────────────────────────────────
-- ⚠️ SIN ESTO, UN CERO NO SE PUEDE LEER. Un cero en la consulta 1 puede
-- significar «no pasó nunca» o «no hay ni una fila en la tabla», y son cosas
-- distintas: la segunda no confirma nada.

SELECT 'documentation_gaps' AS tabla, COUNT(*) AS filas_totales FROM documentation_gaps
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback;


-- ── 3 · ¿CUÁNTAS SON RECUPERABLES? ───────────────────────────────────────
-- Una fila fabricada lleva el `user_id` de quien la escribió. Si ese usuario
-- pertenece hoy a una organización, la fila se puede REASIGNAR en vez de
-- borrarse. Esta consulta separa las dos poblaciones ANTES de decidir.

SELECT 'documentation_gaps' AS tabla,
       COUNT(*) FILTER (WHERE m.org_id IS NOT NULL) AS recuperables,
       COUNT(*) FILTER (WHERE m.org_id IS NULL)     AS sin_destino
FROM documentation_gaps g
LEFT JOIN memberships m ON m.user_id = g.user_id
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = g.org_id)

UNION ALL

SELECT 'feedback',
       COUNT(*) FILTER (WHERE m.org_id IS NOT NULL),
       COUNT(*) FILTER (WHERE m.org_id IS NULL)
FROM feedback f
LEFT JOIN memberships m ON m.user_id = f.user_id
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = f.org_id);


-- ── 4 · EL DETALLE, POR SI HAY POCAS ─────────────────────────────────────
-- Con cifras pequeñas se miran una a una y se decide sobre hechos, no sobre
-- un recuento. Si salen cientos, esta consulta sobra.

SELECT 'documentation_gaps' AS tabla, g.id, g.created_at, g.user_id, g.org_id,
       m.org_id AS organizacion_real_del_usuario
FROM documentation_gaps g
LEFT JOIN memberships m ON m.user_id = g.user_id
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = g.org_id)
ORDER BY g.created_at DESC
LIMIT 50;

SELECT 'feedback' AS tabla, f.id, f.created_at, f.user_id, f.org_id,
       m.org_id AS organizacion_real_del_usuario
FROM feedback f
LEFT JOIN memberships m ON m.user_id = f.user_id
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = f.org_id)
ORDER BY f.created_at DESC
LIMIT 50;
