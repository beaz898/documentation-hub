-- ============================================================================
-- B.320 / B.321 · EL TEXTO GUARDADO DE TRES CITAS DE NOR-10 DEL 04/10 — SÓLO LECTURA
-- ✅ EJECUTADA por el director el 04/10/2026 (corregido el 10/10/2026); resultado en claude/Estado_Del_MVP.md:12776-12777 (B.320). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA (arquitecto, 04/10/2026, apartado F.2): el TEXTO de lo que haya
-- guardado de tres citas de los análisis de NOR-10 de hoy. Es lo que decide la
-- bifurcación pre-registrada de B.321:
--   · `[fa22ca84]` — contradicción del autoclave, nuevo 222 / existente 340,
--     verificada por el juez y DESCARTADA POR EL VERIFICADOR
--     (`mismo_dato_sin_oposicion`), 5 de 6 pasadas;
--   · `[b5ab6f08]` — la misma contradicción, nuevo 710 / existente 341,
--     PUBLICADA en 1 de 6 (02:53:31);
--   · `[37bf4d44]` — un solapamiento descartado por la cita, lado nuevo, 175.
--
-- ⚠️ LO QUE SE ESPERA, POR LECTURA DEL CÓDIGO (Code, 04/10), y la consulta lo
-- deja ver sin suponerlo:
--   · `b5ab6f08`: se publicó, así que está en `analysis->'discrepancies'` y en
--     `judgments[].contradictions`. Lo publicado NO guarda el hash: se busca por
--     las dos longitudes (710 y 341).
--   · `37bf4d44`: lo descartó la comprobación de citas, así que está en
--     `judgments[].descartesPorCita` (B.313), con su hash.
--   · `fa22ca84`: lo descartó el VERIFICADOR, y eso, por lectura, NO SE GUARDA
--     EN NINGÚN SITIO (B.320). Se busca igual, por las longitudes (222 y 340),
--     en los tres sitios: si sale `NADA GUARDADO`, es B.320 visto en el dato.
--
-- ⚠️ Las longitudes son de JavaScript (unidades UTF-16) y `length()` de
-- PostgreSQL cuenta caracteres. Para el español coinciden; un emoji no.
--
-- CÓMO SE LEE: una fila por cita buscada y por sitio donde se encontró. Si de
-- una cita no hay nada en ningún sitio, sale UNA fila suya con
-- `donde = 'NADA GUARDADO'`.
-- ============================================================================

WITH parametros AS (
  -- ═══════════════════════════════════════════════════════════════════════════
  -- ⬅️ SÓLO SE TOCAN ESTAS LÍNEAS. El día entero, en UTC.
  SELECT timestamptz '2026-10-04 00:00:00+00' AS desde,
         timestamptz '2026-10-05 00:00:00+00' AS hasta,
  -- ═══════════════════════════════════════════════════════════════════════════
         'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
buscadas (etiqueta, hash, largo_nuevo, largo_existente) AS (
  VALUES ('fa22ca84 (verificador, 222/340)', 'fa22ca84', 222, 340),
         ('b5ab6f08 (publicada, 710/341)',   'b5ab6f08', 710, 341),
         ('37bf4d44 (solapamiento, 175)',    '37bf4d44', 175, NULL::int)
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org
    AND ar.created_at >= p.desde AND ar.created_at < p.hasta
    AND ar.document_name LIKE 'NOR-10%'
),
juicios AS (
  SELECT a.id, a.created_at, j
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.analysis->'judgments') = 'array' THEN a.analysis->'judgments' ELSE '[]'::jsonb END) AS j
),
encontradas AS (
  -- 1 · Lo publicado
  SELECT a.id AS analisis_id, a.created_at, 'publicado (discrepancies)' AS donde, NULL::text AS hash_guardado,
         d->>'topic' AS tema, d->>'newDocSays' AS cita_nuevo, d->>'existingDocSays' AS cita_existente
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.analysis->'discrepancies') = 'array' THEN a.analysis->'discrepancies' ELSE '[]'::jsonb END) AS d
  UNION ALL
  -- 2 · Lo que sigue en los juicios tras la cascada
  SELECT ju.id, ju.created_at, 'judgments[].contradictions', NULL,
         c->>'topic', c->>'newDocSays', c->>'existingDocSays'
  FROM juicios ju,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE '[]'::jsonb END) AS c
  UNION ALL
  -- 3 · Lo descartado por la comprobación de citas (B.313)
  SELECT ju.id, ju.created_at, 'judgments[].descartesPorCita', x->>'hash',
         x->>'tema', x->>'citaNuevo', x->>'citaExistente'
  FROM juicios ju,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) AS x
),
cruce AS (
  SELECT b.etiqueta, e.*
  FROM buscadas b
  JOIN encontradas e
    ON e.hash_guardado = b.hash
    OR (e.hash_guardado IS NULL
        AND length(e.cita_nuevo) = b.largo_nuevo
        AND (b.largo_existente IS NULL OR length(e.cita_existente) = b.largo_existente))
)
SELECT etiqueta, donde, created_at AS guardado_utc, hash_guardado, tema,
       length(cita_nuevo) AS largo_nuevo, cita_nuevo,
       length(cita_existente) AS largo_existente, cita_existente, analisis_id
FROM cruce
UNION ALL
SELECT b.etiqueta, 'NADA GUARDADO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
FROM buscadas b
WHERE NOT EXISTS (SELECT 1 FROM cruce c WHERE c.etiqueta = b.etiqueta)
ORDER BY 1, 3;
