-- ============================================================================
-- EN QUÉ ORGANIZACIONES ESTÁ EL USUARIO DEL DIRECTOR — SÓLO LECTURA (26/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- POR QUÉ (arquitecto, 26/10): el director recontrató el plan más caro y tiene 10.000 créditos. Hace falta el id de la
-- organización donde quedó la suscripción, para cambiarlo en las consultas, y ver si los 10.000 están ahí o en el piloto.
-- SIN el id fijo del piloto: se busca por CORREO. Es la única consulta que no lleva la constante del piloto.
--
-- QUÉ SALE: una fila por cada pertenencia del usuario de ese correo, con el id del usuario y su fecha de alta, y de la
-- organización el id completo, el nombre, el plan, los créditos (los del plan y los extra), la fecha de alta, si tiene
-- suscripción de Stripe guardada, y si está cancelada o purgada. Si el correo no tiene usuario, o el usuario no tiene
-- ninguna pertenencia, sale UNA fila que lo dice: nunca un resultado vacío.
--
-- LA CONSTANTE: el correo, entre las comillas vacías de lower(trim('')). Sin rellenar, sale «NINGÚN USUARIO».
-- ============================================================================
WITH p AS (SELECT lower(trim('')) AS correo),
u AS (SELECT au.id, au.created_at FROM auth.users au, p WHERE lower(au.email) = p.correo),
filas AS (
  SELECT u.id AS usuario, u.created_at AS usuario_alta, o.id AS organizacion, o.name AS nombre, o.plan,
         o.credits_remaining AS creditos, o.credits_extra AS creditos_extra, o.created_at AS organizacion_alta,
         (o.stripe_subscription_id IS NOT NULL) AS suscripcion_de_stripe_guardada,
         o.canceled_at AS cancelada, o.purged_at AS purgada, m.role AS rol
  FROM u
  JOIN public.memberships m ON m.user_id = u.id
  LEFT JOIN public.organizations o ON o.id = m.org_id
)
SELECT 'pertenencia' AS que, usuario::text,
       to_char(usuario_alta AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS usuario_alta,
       organizacion::text, nombre, plan, creditos, creditos_extra,
       to_char(organizacion_alta AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS organizacion_alta,
       suscripcion_de_stripe_guardada,
       to_char(cancelada AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS cancelada,
       to_char(purgada AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS purgada, rol
FROM filas
UNION ALL
SELECT CASE WHEN (SELECT count(*) FROM u) = 0 THEN 'NINGÚN USUARIO con ese correo'
            ELSE 'el usuario NO TIENE NINGUNA pertenencia' END,
       (SELECT string_agg(id::text, ', ') FROM u),
       NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM filas)
ORDER BY 1, 4;
