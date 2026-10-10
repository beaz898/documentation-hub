-- ============================================================================
-- B.323 / B.324 · ¿DOS CORPUS DISTINTOS EL MISMO DÍA? — SÓLO LECTURA
-- ✅ EJECUTADA por el director el 04/10/2026 (corregido el 10/10/2026); resultado en claude/Estado_Del_MVP.md:13093 (B.323). Sólo SELECT: no escribe, no borra, no decide.
--
-- QUÉ CONTESTA (arquitecto, 04/10/2026): la tanda de las 16:23–16:32 y la de las
-- 21:05–21:08 vieron candidatos casi disjuntos (sólo coincide OPE-11), y los
-- documentos analizados tienen ids distintos en cada una. El director dice no
-- haber subido nada; la segunda la lanzó desde el móvil, con la misma cuenta.
--
-- ⚠️ CÓMO SE EJECUTA: SON CINCO CONSULTAS, una por pregunta. El editor de
-- Supabase sólo enseña el resultado de la última: se selecciona UNA y se ejecuta,
-- y así las cinco.
--
-- Los ids de los documentos analizados, tal como los dan los logs:
--   · 16:23–16:32 → NOR-10 `db1e20f9-a2d3-4280-8721-39ee11bf5d4e`
--                   NOR-11 `85c97891-7cd6-44a6-87bc-5bb2d117be18`
--   · 21:05–21:08 → NOR-10 `43df28ff-62ad-4fe8-8e90-a33bca05aaea`
--                   NOR-11 `849f7924-d789-4abc-ab1e-f63cd63b9bd7`
-- ============================================================================


-- ── 3 · LA QUE DECIDE (va primero): ¿en qué organización vive cada documento
--    analizado, y con qué org_id se guardaron sus análisis de hoy? ─────────────
--    Si los de una tanda y los de la otra salen con org_id DISTINTO, es cuestión
--    de qué organización resuelve cada sesión. Si salen con el MISMO, el corpus
--    cambió sin subidas, y eso es otra cosa.
WITH analizados (tanda, documento, id) AS (
  VALUES ('16:23–16:32', 'NOR-10', 'db1e20f9-a2d3-4280-8721-39ee11bf5d4e'),
         ('16:23–16:32', 'NOR-11', '85c97891-7cd6-44a6-87bc-5bb2d117be18'),
         ('21:05–21:08', 'NOR-10', '43df28ff-62ad-4fe8-8e90-a33bca05aaea'),
         ('21:05–21:08', 'NOR-11', '849f7924-d789-4abc-ab1e-f63cd63b9bd7')
)
SELECT a.tanda, a.documento, a.id AS documento_id,
       d.org_id                                  AS org_del_documento,
       o.name                                    AS organizacion,
       d.name                                    AS nombre_guardado,
       d.created_at                              AS documento_creado_utc,
       (SELECT count(*) FROM public.analysis_results ar
         WHERE ar.document_id::text = a.id
           AND ar.created_at >= timestamptz '2026-10-04 00:00:00+00'
           AND ar.created_at <  timestamptz '2026-10-05 00:00:00+00') AS analisis_de_hoy,
       (SELECT string_agg(DISTINCT ar.org_id::text, ', ') FROM public.analysis_results ar
         WHERE ar.document_id::text = a.id
           AND ar.created_at >= timestamptz '2026-10-04 00:00:00+00'
           AND ar.created_at <  timestamptz '2026-10-05 00:00:00+00') AS org_de_sus_analisis,
       CASE WHEN d.id IS NULL THEN 'NO EXISTE EN documents' ELSE '' END AS aviso
FROM analizados a
LEFT JOIN public.documents d ON d.id::text = a.id
LEFT JOIN public.organizations o ON o.id::text = d.org_id
ORDER BY a.tanda, a.documento;


-- ── 1 · ¿A cuántas organizaciones pertenecen los usuarios que analizaron hoy
--    NOR-10 y NOR-11? Id, nombre y desde cuándo. ──────────────────────────────
--    El usuario se saca de los propios análisis de hoy, sin escribir su correo.
WITH usuarios AS (
  SELECT DISTINCT ar.user_id
  FROM public.analysis_results ar
  WHERE ar.created_at >= timestamptz '2026-10-04 00:00:00+00'
    AND ar.created_at <  timestamptz '2026-10-05 00:00:00+00'
    AND (ar.document_name LIKE 'NOR-10%' OR ar.document_name LIKE 'NOR-11%')
)
SELECT u.user_id, m.org_id, o.name AS organizacion, m.role, m.joined_at AS miembro_desde_utc,
       o.created_at AS organizacion_creada_utc, o.purged_at, o.abandoned_at,
       count(*) OVER (PARTITION BY u.user_id) AS organizaciones_de_este_usuario
FROM usuarios u
JOIN public.memberships m ON m.user_id = u.user_id
JOIN public.organizations o ON o.id = m.org_id
ORDER BY u.user_id, m.joined_at;


-- ── 2 · Los documentos de cada una de esas organizaciones: id, nombre, hash,
--    trozos (los de la generación activa y el número guardado), fecha y estado. ─
WITH usuarios AS (
  SELECT DISTINCT ar.user_id
  FROM public.analysis_results ar
  WHERE ar.created_at >= timestamptz '2026-10-04 00:00:00+00'
    AND ar.created_at <  timestamptz '2026-10-05 00:00:00+00'
    AND (ar.document_name LIKE 'NOR-10%' OR ar.document_name LIKE 'NOR-11%')
),
orgs AS (
  SELECT DISTINCT m.org_id::text AS org_id FROM public.memberships m JOIN usuarios u ON u.user_id = m.user_id
)
SELECT d.org_id, o.name AS organizacion, d.id, d.name, d.content_hash,
       (SELECT count(*) FROM public.document_chunks c
         WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
       d.chunk_count AS chunk_count_guardado,
       d.created_at AS subido_utc, d.analysis_status, d.source
FROM public.documents d
JOIN orgs ON orgs.org_id = d.org_id
LEFT JOIN public.organizations o ON o.id::text = d.org_id
ORDER BY d.org_id, d.name;


-- ── 4 · El duplicado: todas las filas que se llaman
--    CLI-01_protocolo-esterilizacion-instrumental.txt, en cualquier organización. ─
SELECT d.org_id, o.name AS organizacion, d.id, d.name, d.content_hash,
       (SELECT count(*) FROM public.document_chunks c
         WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
       d.chunk_count AS chunk_count_guardado,
       d.created_at AS subido_utc, d.analysis_status, d.source,
       (SELECT count(*) FROM public.analysis_results ar WHERE ar.document_id = d.id) AS analisis_que_cuelgan
FROM public.documents d
LEFT JOIN public.organizations o ON o.id::text = d.org_id
WHERE d.name = 'CLI-01_protocolo-esterilizacion-instrumental.txt'
ORDER BY d.org_id, d.created_at;


-- ── 5 · En todo el corpus: los nombres que aparecen más de una vez DENTRO de
--    la misma organización, con sus ids. Y, aparte, los contenidos repetidos
--    (mismo content_hash), que es lo que de verdad duplica un hallazgo. ────────
SELECT 'mismo nombre' AS tipo, d.org_id, o.name AS organizacion, d.name AS clave,
       count(*) AS copias,
       string_agg(d.id::text || ' (' || coalesce(d.analysis_status, '-') || ', ' || to_char(d.created_at, 'YYYY-MM-DD HH24:MI') || ')', ' · ' ORDER BY d.created_at) AS ids
FROM public.documents d
LEFT JOIN public.organizations o ON o.id::text = d.org_id
GROUP BY d.org_id, o.name, d.name
HAVING count(*) > 1
UNION ALL
SELECT 'mismo contenido', d.org_id, o.name, d.content_hash,
       count(*),
       string_agg(d.name || ' = ' || d.id::text, ' · ' ORDER BY d.created_at)
FROM public.documents d
LEFT JOIN public.organizations o ON o.id::text = d.org_id
WHERE d.content_hash IS NOT NULL
GROUP BY d.org_id, o.name, d.content_hash
HAVING count(*) > 1
ORDER BY 1, 2, 4;
