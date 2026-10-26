-- ============================================================================
-- INVENTARIO DEL CORPUS DEL PILOTO — SÓLO LECTURA (26/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
-- La organización se RESUELVE por el usuario del director (bloque de la resolución, abajo): la primera fila dice cuál.
--
-- QUÉ CONTESTA (arquitecto, 26/10): la suscripción ha bajado a gratuito y el
-- Drive aparece desconectado. Antes de subir nada hay que saber qué queda.
--   0 · la cuenta: plan, cancelación, fin de la gracia y PURGA PROGRAMADA;
--       si sigue habiendo conexión de Drive guardada;
--   1 · cada documento: nombre, id, origen, estado, generación activa, trozos
--       guardados, filas de análisis y fecha de alta;
--   2 · las filas de análisis: cuántas, la más antigua y la más reciente, y
--       cuántas cuelgan de un documento que ya no está;
--   3 · los nombres duplicados;
--   4 · documentos con trozos y sin análisis, y análisis sin documento;
--   5 · las lápidas (documentos sincronizados excluidos a propósito);
--   6 · la lista del director, nombre por nombre.
-- Lo que NO contesta: los vectores de Pinecone no están en Supabase. «trozos
-- guardados» es la tabla document_chunks, no el índice.
--
-- CÓMO SE EJECUTA: es UNA sola consulta; se ejecuta entera y se copia el
-- resultado completo. Las horas salen en hora de Madrid.
-- ============================================================================
-- ── LA RESOLUCIÓN DE LA ORGANIZACIÓN (26/10/2026), IDÉNTICA EN TODAS LAS CONSULTAS QUE MIRAN HACIA DELANTE ──
-- La organización NO se escribe: es la ÚNICA a la que pertenece el USUARIO del director. Si tiene cero o más de una,
-- la primera fila de la salida lo dice a gritos y todo lo demás está leyendo NADA. La primera fila dice SIEMPRE qué
-- organización se lee, su nombre y cuántos documentos tiene: un id o una resolución equivocados no pueden pasar por
-- «no hay hallazgos».
-- ⚠️ a9625e93-af2a-4416-a465-5c2fa2a25bdf ES A LA VEZ EL ID DEL USUARIO DEL DIRECTOR Y EL DE LA ORGANIZACIÓN DEL
-- PILOTO (purgada el 25/10/2026). Es un accidente histórico del código de antes del 27/04/2026, que tomaba el id del
-- usuario como id de la organización. AQUÍ ES EL USUARIO. NO SE UNIFICA con ORG_DEL_PILOTO de SQL_SEG_02, que es el
-- mismo número con el otro significado: unificarlas rompe el rescate de llm_usage sin que salte nada.
WITH usuario AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::uuid AS id                  -- ← USUARIO (el del director; NO es la organización)
),
resolucion AS (
  SELECT u.id AS usuario, count(m.org_id) AS pertenencias,
         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org
  FROM usuario u LEFT JOIN public.memberships m ON m.user_id = u.id
  GROUP BY u.id
),
organizacion_leida AS (
  SELECT CASE WHEN r.org IS NOT NULL   -- la que se lee DE VERDAD, no la que se cuenta
              THEN 'organización leída: ' || r.org || ' · «' || coalesce(o.name, '¿sin nombre?') || '» · '
                   || (SELECT count(*) FROM public.documents d WHERE d.org_id = r.org) || ' documentos'
              ELSE '⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' || r.usuario || ' tiene ' || r.pertenencias
                   || ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.' END AS linea
  FROM resolucion r LEFT JOIN public.organizations o ON o.id::text = r.org
),
p AS (SELECT (SELECT org FROM resolucion) AS org),
org AS (
  SELECT o.plan, o.credits_remaining, o.stripe_subscription_id, o.canceled_at, o.grace_period_ends_at, o.purged_at
  FROM public.organizations o, p WHERE o.id::text = p.org
),
docs AS (
  SELECT d.id, d.name, coalesce(d.source, 'manual') AS source, d.analysis_status, d.active_generation, d.chunk_count, d.created_at,
         (d.full_text IS NOT NULL AND length(d.full_text) > 0) AS con_texto,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation <> d.active_generation) AS trozos_otras,
         (SELECT count(*) FROM public.analysis_results ar
           WHERE ar.org_id = p.org AND ar.document_id = d.id) AS analisis
  FROM public.documents d, p WHERE d.org_id = p.org
),
ana AS (
  SELECT ar.created_at, ar.document_id, ar.document_name,
         CASE WHEN ar.document_id IS NULL THEN 'sin_documento'
              WHEN EXISTS (SELECT 1 FROM docs WHERE docs.id = ar.document_id) THEN 'vivo'
              ELSE 'borrado' END AS dueno
  FROM public.analysis_results ar, p WHERE ar.org_id = p.org
),
lista (n, prefijo, en_corpus_pruebas, visto_en_logs) AS (
  VALUES (1, 'NOR-10', 'sí', 'sí'), (2, 'NOR-11', 'sí', 'sí'), (3, 'CLI-12', 'sí', 'sí'), (4, 'CLI-13', 'sí', 'sí'),
         (5, 'CLI-20', 'sí', 'no'), (6, 'OPE-10', 'sí', 'sí'), (7, 'OPE-11', 'sí', 'sí'), (8, 'OPE-13', 'sí', 'sí'),
         (9, 'OPE-15', 'sí', 'no'), (10, 'RRHH-08', 'sí', 'sí')
),
f AS (SELECT 'DD/MM/YYYY HH24:MI'::text AS fmt)

-- ── 0 · LA CUENTA ───────────────────────────────────────────────────────────
SELECT '0 · cuenta' AS bloque, 0 AS n, (SELECT linea FROM organizacion_leida) AS texto
UNION ALL
SELECT '0 · cuenta', 1,
       'reloj de la base: ' || to_char(now() AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f)) || ' Madrid' AS texto
UNION ALL
SELECT '0 · cuenta', 2,
       CASE WHEN NOT EXISTS (SELECT 1 FROM org)
            THEN 'ORGANIZACIÓN NO ENCONTRADA: todo lo que sigue es NO APLICA'
            ELSE (SELECT 'plan: ' || coalesce(plan, '(nulo)') || ' · suscripción de Stripe guardada: '
                         || CASE WHEN stripe_subscription_id IS NULL THEN 'NINGUNA' ELSE 'sí' END
                         || ' · créditos: ' || coalesce(credits_remaining::text, '(nulo)') FROM org) END
UNION ALL
SELECT '0 · cuenta', 3,
       'cancelada: ' || coalesce(to_char(canceled_at AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f)), 'no')
       || ' · fin de la gracia: ' || coalesce(to_char(grace_period_ends_at AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f)), 'ninguno')
       || ' · purgada: ' || coalesce(to_char(purged_at AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f)), 'no')
FROM org
UNION ALL
SELECT '0 · cuenta', 4,
       CASE WHEN purged_at IS NOT NULL THEN 'YA PURGADA: el worker borró la organización el ' || to_char(purged_at AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f))
            WHEN grace_period_ends_at IS NOT NULL
              THEN '⚠️ PURGA PROGRAMADA: pasada esa fecha el worker borra TODO (documentos, vectores, análisis, usuario). Quedan '
                   || floor(extract(epoch FROM (grace_period_ends_at - now())) / 86400)::int || ' días'
            ELSE 'sin purga programada (fin de la gracia vacío)' END
FROM org
UNION ALL
SELECT '0 · cuenta', 5,
       'conexión de Drive guardada: '
       || coalesce((SELECT string_agg(coalesce(dc.provider, '(sin proveedor)'), ', ') FROM public.drive_connections dc, p WHERE dc.org_id = p.org), 'NINGUNA')

-- ── 1 · LOS DOCUMENTOS ──────────────────────────────────────────────────────
UNION ALL
SELECT '1 · documentos', 0,
       'documentos en el corpus: ' || count(*) || ' (por origen: '
       || coalesce((SELECT string_agg(source || ' ' || k, ', ' ORDER BY source)
                    FROM (SELECT source, count(*) AS k FROM docs GROUP BY source) s), 'ninguno') || ')'
FROM docs
UNION ALL
SELECT '1 · documentos', row_number() OVER (ORDER BY name, created_at)::int,
       name || ' · id ' || id || ' · origen ' || source || ' · estado ' || coalesce(analysis_status, '(nulo)')
       || ' · generación activa ' || coalesce(active_generation::text, '(nula)')
       || ' · trozos guardados ' || trozos || CASE WHEN trozos_otras > 0 THEN ' (más ' || trozos_otras || ' de otras generaciones)' ELSE '' END
       || ' · chunk_count de la fila ' || coalesce(chunk_count::text, '(nulo)')
       || ' · texto completo ' || CASE WHEN con_texto THEN 'sí' ELSE 'NO' END
       || ' · análisis ' || analisis
       || ' · alta ' || to_char(created_at AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f))
FROM docs

-- ── 2 · LAS FILAS DE ANÁLISIS ───────────────────────────────────────────────
UNION ALL
SELECT '2 · análisis', 1,
       'filas de análisis: ' || count(*) || ' · la más antigua: '
       || coalesce(to_char(min(created_at) AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f)), '(ninguna)')
       || ' · la más reciente: ' || coalesce(to_char(max(created_at) AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f)), '(ninguna)')
FROM ana
UNION ALL
SELECT '2 · análisis', 2,
       'de un documento que sigue en el corpus: ' || count(*) FILTER (WHERE dueno = 'vivo')
       || ' · de un documento que YA NO ESTÁ: ' || count(*) FILTER (WHERE dueno = 'borrado')
       || ' · sin documento (document_id nulo): ' || count(*) FILTER (WHERE dueno = 'sin_documento')
FROM ana
UNION ALL
-- CONTROL: dos caminos distintos al mismo número. Los análisis contados desde
-- cada documento (bloque 1) tienen que sumar lo mismo que los contados desde
-- las filas de análisis con dueño vivo.
SELECT '2 · análisis', 3,
       CASE WHEN (SELECT count(*) FROM ana) = 0 THEN 'CONTROL: NO APLICA (no hay filas de análisis)'
            WHEN (SELECT coalesce(sum(analisis), 0) FROM docs) = (SELECT count(*) FROM ana WHERE dueno = 'vivo')
              THEN 'CONTROL: cuadra (' || (SELECT count(*) FROM ana WHERE dueno = 'vivo') || ' por los dos caminos)'
            ELSE 'CONTROL: NO CUADRA: por documento ' || (SELECT coalesce(sum(analisis), 0) FROM docs)
                 || ', por fila ' || (SELECT count(*) FROM ana WHERE dueno = 'vivo') END
UNION ALL
SELECT '2 · análisis', 10 + row_number() OVER (ORDER BY document_name)::int,
       'de un documento que ya no está: ' || document_name || ' · ' || k || ' filas · de '
       || to_char(desde AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f)) || ' a ' || to_char(hasta AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f))
FROM (SELECT document_name, count(*) AS k, min(created_at) AS desde, max(created_at) AS hasta
      FROM ana WHERE dueno = 'borrado' GROUP BY document_name) b

-- ── 3 · NOMBRES DUPLICADOS ──────────────────────────────────────────────────
UNION ALL
SELECT '3 · duplicados', 0,
       'nombres repetidos: ' || count(*) FROM (SELECT name FROM docs GROUP BY name HAVING count(*) > 1) r
UNION ALL
SELECT '3 · duplicados', row_number() OVER (ORDER BY name)::int,
       name || ' · ' || k || ' copias: ' || ids
FROM (SELECT name, count(*) AS k,
             string_agg(id || ' (' || source || ', ' || analisis || ' análisis, alta ' || to_char(created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') || ')', ' | ' ORDER BY created_at) AS ids
      FROM docs GROUP BY name HAVING count(*) > 1) r

-- ── 4 · TROZOS SIN ANÁLISIS, Y AL REVÉS ─────────────────────────────────────
UNION ALL
SELECT '4 · cruces', 1,
       'con trozos y SIN análisis: ' || count(*)
       || coalesce(': ' || string_agg(name, ', ' ORDER BY name), '')
FROM docs WHERE trozos > 0 AND analisis = 0
UNION ALL
SELECT '4 · cruces', 2,
       'con análisis y SIN trozos guardados: ' || count(*)
       || coalesce(': ' || string_agg(name, ', ' ORDER BY name), '')
FROM docs WHERE trozos = 0 AND analisis > 0
UNION ALL
SELECT '4 · cruces', 3,
       'sin trozos y sin análisis: ' || count(*)
       || coalesce(': ' || string_agg(name, ', ' ORDER BY name), '')
FROM docs WHERE trozos = 0 AND analisis = 0
UNION ALL
SELECT '4 · cruces', 4,
       'análisis cuyo documento ya no está (nombres distintos): '
       || (SELECT count(DISTINCT document_name) FROM ana WHERE dueno = 'borrado') || ' · ver el bloque 2'

-- ── 5 · LÁPIDAS ─────────────────────────────────────────────────────────────
UNION ALL
SELECT '5 · lápidas', 0, 'documentos sincronizados excluidos a propósito: ' || count(*)
FROM public.document_tombstones t, p WHERE t.org_id = p.org
UNION ALL
SELECT '5 · lápidas', row_number() OVER (ORDER BY t.excluded_at)::int,
       coalesce(t.original_name, '(sin nombre)') || ' · ' || t.source || ' · '
       || to_char(t.excluded_at AT TIME ZONE 'Europe/Madrid', (SELECT fmt FROM f))
FROM public.document_tombstones t, p WHERE t.org_id = p.org

-- ── 6 · LA LISTA DEL DIRECTOR ───────────────────────────────────────────────
-- El nombre casa por el prefijo seguido de algo que no sea un dígito, para que
-- NOR-1 no se lleve NOR-10.
UNION ALL
SELECT '6 · lista', l.n,
       l.prefijo || ' (corpus-pruebas: ' || l.en_corpus_pruebas || ' · visto en los logs del 22 y 24/10: ' || l.visto_en_logs || ') → '
       || CASE WHEN count(d.id) = 0 THEN 'NO ESTÁ'
               ELSE count(d.id) || ' en el corpus: ' || string_agg(d.name || ' [' || d.source || ', ' || d.trozos || ' trozos, ' || d.analisis || ' análisis]', ' | ' ORDER BY d.created_at) END
FROM lista l LEFT JOIN docs d ON d.name ~ ('^' || l.prefijo || '([^0-9]|$)')
GROUP BY l.n, l.prefijo, l.en_corpus_pruebas, l.visto_en_logs
UNION ALL
SELECT '6 · lista', 99,
       'en el corpus y NO en la lista: ' || count(*)
       || coalesce(': ' || string_agg(name, ', ' ORDER BY name), '')
FROM docs d WHERE NOT EXISTS (SELECT 1 FROM lista l WHERE d.name ~ ('^' || l.prefijo || '([^0-9]|$)'))

ORDER BY 1, 2;
