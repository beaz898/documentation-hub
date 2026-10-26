-- ============================================================================
-- VOLVER A LA ORGANIZACIÓN DEL PILOTO — ⚠️ LA PRIMERA ESCRITURA EN LA BASE DE TODO EL PROYECTO (26/10/2026)
-- ⏳ PENDIENTE DE REVISAR POR EL ARQUITECTO, y después PENDIENTE DE EJECUTAR por el director. No antes.
--
-- POR QUÉ (arquitecto y director, 26/10): la purga del 25/10 borró la membresía del director en el piloto. Al volver a
-- entrar, /api/org/setup le creó una organización nueva («Mi workspace», free, 50 créditos). Se elige volver al piloto
-- (business_plus, 4942 créditos) en vez de pagar un plan nuevo y cambiar el id en 75 consultas.
--
-- SON DOS BLOQUES, y se ejecutan así, de uno en uno (el editor sólo enseña el último resultado):
--   1 · EL ESTADO ........ sólo lee. Se ejecuta ANTES, se copia el resultado entero, y se manda al arquitecto.
--   2 · LA ESCRITURA ..... una sola sentencia: o hace las dos escrituras, o no hace ninguna.
--   1 · EL ESTADO ........ otra vez, DESPUÉS, y se copia el resultado entero.
--
-- QUÉ TOCA, Y NADA MÁS:
--   a) memberships: la ÚNICA membresía del usuario del director cambia de organización, de la nueva a la del piloto.
--      Es un UPDATE, no un INSERT: resolverOrg coge una membresía cualquiera del usuario (lib/org.ts, .limit(1)), así
--      que con dos podría seguir resolviendo la nueva. Conserva su rol y su is_owner.
--   b) organizations, la fila del piloto: canceled_at y grace_period_ends_at pasan a NULL, LAS DOS EN EL MISMO UPDATE.
--      Sin esto, consumeCredits (lib/credits.ts:63-83) se niega a cobrar con «subscription_expired» y no funciona ningún
--      análisis. Es lo mismo que hace el webhook al reactivar una suscripción (app/api/billing/webhook/route.ts:185-186).
--      Los valores que se pierden, para el registro: canceled_at = 27/07/2026 14:12 y grace_period_ends_at =
--      25/10/2026 13:12 (hora de Madrid, del inventario del 26/10). El bloque 1 los enseña antes.
--
-- QUÉ NO TOCA: purged_at (se queda puesta), plan, créditos, Stripe, la organización nueva (se queda, sin miembros y
-- vacía), auth.users, y ninguna otra tabla. No borra ninguna fila.
--
-- ⚠️ POR QUÉ ES SEGURO FRENTE AL WORKER: el worker purga cada seis horas las organizaciones con
-- grace_period_ends_at < now() Y purged_at IS NULL (worker/src/index.ts:514-518). Después de esto el piloto tiene la
-- gracia a NULL y purged_at puesta: no cumple ninguna de las dos mitades.
-- ⚠️ SI ALGÚN DÍA SE VACÍA purged_at, LA FECHA DE FIN DE GRACIA SE VACÍA EN EL MISMO UPDATE. VACIAR SÓLO purged_at CON
-- LA GRACIA EN EL PASADO HACE QUE EL WORKER VUELVA A BORRARLO TODO EN MENOS DE SEIS HORAS.
-- Efecto conocido de dejar purged_at: el botón de borrar la organización se negará con un 409 (app/api/org/purge/route.ts).
--
-- LAS GUARDAS: la escritura sólo ocurre si se cumplen TODAS; si no, no escribe nada y dice cuál falló:
--   · el correo corresponde a exactamente un usuario;
--   · ese usuario tiene exactamente una membresía, y no es del piloto;
--   · la organización de esa membresía no tiene documentos (si los tuviera, se quedarían sin dueño);
--   · el piloto existe, tiene purged_at puesta y ningún miembro.
--
-- LA CONSTANTE DEL CORREO: va en los DOS bloques, entre las comillas vacías de lower(trim('')), porque cada bloque se
-- ejecuta solo; tiene que ser la misma en los dos. Sin rellenar, el bloque 2 no escribe nada.
-- ============================================================================

-- ══ ESC-01 · 1 · EL ESTADO (antes y después; sólo lee) ═════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::uuid AS org, lower(trim('')) AS correo),
u AS (SELECT au.id, au.created_at FROM auth.users au, p WHERE lower(au.email) = p.correo)
SELECT 1 AS orden, 'usuario: ' || CASE (SELECT count(*) FROM u) WHEN 0 THEN 'NINGUNO con ese correo'
         WHEN 1 THEN (SELECT id::text || ' · creado ' || to_char(created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') FROM u)
         ELSE (SELECT count(*) FROM u)::text || ' usuarios con ese correo' END AS estado
UNION ALL
SELECT 2, 'membresía: org ' || m.org_id || ' (' || coalesce(o.name, '¿?') || ', ' || coalesce(o.plan, '¿?') || ', '
       || coalesce(o.credits_remaining::text, '¿?') || ' créditos, creada '
       || coalesce(to_char(o.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'), '¿?') || ', '
       || (SELECT count(*) FROM public.documents d WHERE d.org_id = m.org_id::text) || ' documentos) · rol ' || m.role
       || CASE WHEN m.org_id = p.org THEN ' · ES EL PILOTO' ELSE '' END
FROM public.memberships m JOIN u ON m.user_id = u.id LEFT JOIN public.organizations o ON o.id = m.org_id, p
UNION ALL
SELECT 3, 'piloto: plan ' || o.plan || ' · créditos ' || o.credits_remaining
       || ' · cancelada ' || coalesce(to_char(o.canceled_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'), 'NULL')
       || ' · fin de la gracia ' || coalesce(to_char(o.grace_period_ends_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'), 'NULL')
       || ' · purgada ' || coalesce(to_char(o.purged_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'), 'NULL')
       || ' · miembros ' || (SELECT count(*) FROM public.memberships mm WHERE mm.org_id = p.org)
FROM public.organizations o, p WHERE o.id = p.org
UNION ALL
SELECT 4, 'el worker purgaría el piloto: '
       || CASE WHEN o.grace_period_ends_at < now() AND o.purged_at IS NULL THEN '⚠️ SÍ, EN MENOS DE SEIS HORAS' ELSE 'no' END
       || ' · los créditos se negarían (subscription_expired): '
       || CASE WHEN o.canceled_at IS NOT NULL AND o.grace_period_ends_at < now() THEN 'SÍ' ELSE 'no' END
FROM public.organizations o, p WHERE o.id = p.org
ORDER BY 1, 2;

-- ══ ESC-01 · 2 · LA ESCRITURA (una sentencia: las dos escrituras o ninguna) ═
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::uuid AS org, lower(trim('')) AS correo),
u AS (SELECT au.id FROM auth.users au, p WHERE lower(au.email) = p.correo),
m AS (SELECT mm.id, mm.org_id FROM public.memberships mm JOIN u ON mm.user_id = u.id),
g AS (
  SELECT (SELECT count(*) FROM u) = 1 AS un_usuario,
         (SELECT count(*) FROM m) = 1 AS una_membresia,
         NOT EXISTS (SELECT 1 FROM m WHERE m.org_id = p.org) AS no_es_ya_el_piloto,
         NOT EXISTS (SELECT 1 FROM public.documents d JOIN m ON d.org_id = m.org_id::text) AS la_nueva_sin_documentos,
         EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = p.org AND o.purged_at IS NOT NULL) AS piloto_purgado,
         NOT EXISTS (SELECT 1 FROM public.memberships mm WHERE mm.org_id = p.org) AS piloto_sin_miembros
  FROM p
),
ok AS (SELECT un_usuario AND una_membresia AND no_es_ya_el_piloto AND la_nueva_sin_documentos AND piloto_purgado
              AND piloto_sin_miembros AS todo FROM g),
movida AS (
  UPDATE public.memberships AS t SET org_id = p.org
  FROM p, ok
  WHERE ok.todo AND t.id = (SELECT id FROM m)
  RETURNING t.id
),
reactivada AS (
  UPDATE public.organizations AS t SET canceled_at = NULL, grace_period_ends_at = NULL
  FROM p, ok
  WHERE ok.todo AND t.id = p.org
  RETURNING t.id
)
SELECT CASE WHEN (SELECT todo FROM ok)
            THEN 'ESCRITO: ' || (SELECT count(*) FROM movida) || ' membresía movida al piloto · '
                 || (SELECT count(*) FROM reactivada) || ' organización con la cancelación vaciada. Ahora, el bloque 1 otra vez.'
            ELSE 'NO SE ESCRIBIÓ NADA. Falla: ' || concat_ws(', ',
                 CASE WHEN NOT g.un_usuario THEN 'el correo no es de exactamente un usuario' END,
                 CASE WHEN NOT g.una_membresia THEN 'el usuario no tiene exactamente una membresía' END,
                 CASE WHEN NOT g.no_es_ya_el_piloto THEN 'la membresía ya es del piloto' END,
                 CASE WHEN NOT g.la_nueva_sin_documentos THEN 'la organización nueva tiene documentos' END,
                 CASE WHEN NOT g.piloto_purgado THEN 'el piloto no existe o no tiene purged_at' END,
                 CASE WHEN NOT g.piloto_sin_miembros THEN 'el piloto ya tiene miembros' END) END AS resultado
FROM g;
