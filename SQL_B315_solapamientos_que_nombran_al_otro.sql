-- ============================================================================
-- B.315 · LOS PUNTOS DE SOLAPAMIENTO QUE NOMBRAN AL OTRO DOCUMENTO — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA (arquitecto, 04/10/2026): de todos los puntos de solapamiento
-- publicados en los análisis guardados, cuántos tienen una descripción que nombra
-- el código o el nombre del otro documento, y diez ejemplos. Es una MEDIDA, no un
-- filtro: con ella se decide si se filtra, cómo, y si hace falta tocar el prompt.
--
-- ⚠️ QUÉ ES UN «PUNTO PUBLICADO» AQUÍ: una entrada de
-- `analysis->'judgments'[].overlappingContent[]` sin `confirmedBy` (las del juez,
-- no las estructurales) y con descripción. Son las que `construirOverlaps` junta
-- y publica (lib/analysis/synthesize.ts).
--
-- ⚠️ LOS DOS CRITERIOS, y por qué se dan los dos:
--   · `nombra_al_otro`: la descripción contiene el CÓDIGO del otro documento (lo
--     que va antes del «_» en su nombre, p. ej. «CLI-12») o su nombre sin la
--     extensión. Es lo que pidió el arquitecto.
--   · `nombra_algun_codigo`: contiene CUALQUIER cosa con forma de código
--     («ABC-12»). ⚠️ Medido en el examen archivado del 27/09, esto se lleva por
--     delante hallazgos BUENOS: los códigos de tratamiento de los tarifarios
--     (DIA-01, HIG-01, END-01) tienen la misma forma que los de documento. Se da
--     para que se vea el tamaño de ese error, no como propuesta.
--
-- CÓMO SE EJECUTA: DOS CONSULTAS. Se selecciona una y se ejecuta, y luego la otra.
-- ============================================================================

-- ── 1 · Los totales ───────────────────────────────────────────────────────────
WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
puntos AS (
  SELECT ar.id AS analisis_id, ar.created_at, ar.document_name AS analizado,
         j->>'documentName' AS otro,
         substring(j->>'documentName' from '^[A-Z]+-[0-9]+') AS codigo_otro,
         regexp_replace(j->>'documentName', '\.[A-Za-z0-9]+$', '') AS nombre_otro,
         o->>'description' AS descripcion
  FROM public.analysis_results ar, parametros p,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j,
       jsonb_array_elements(CASE WHEN jsonb_typeof(j->'overlappingContent') = 'array' THEN j->'overlappingContent' ELSE '[]'::jsonb END) AS o
  WHERE ar.org_id = p.org
    AND o->>'confirmedBy' IS NULL
    AND coalesce(trim(o->>'description'), '') <> ''
),
marcados AS (
  SELECT *,
         ((codigo_otro IS NOT NULL AND upper(descripcion) LIKE '%' || codigo_otro || '%')
          OR position(nombre_otro in descripcion) > 0)        AS nombra_al_otro,
         descripcion ~ '\m[A-Z]{2,5}-[0-9]{2}\M'               AS nombra_algun_codigo
  FROM puntos
)
SELECT count(*)                                             AS puntos_publicados,
       count(DISTINCT descripcion)                          AS descripciones_distintas,
       count(*) FILTER (WHERE nombra_al_otro)               AS nombran_al_otro,
       round(100.0 * count(*) FILTER (WHERE nombra_al_otro) / nullif(count(*), 0), 1) AS pct_nombran_al_otro,
       count(DISTINCT descripcion) FILTER (WHERE nombra_al_otro) AS distintas_que_nombran_al_otro,
       count(*) FILTER (WHERE nombra_algun_codigo)          AS nombran_algun_codigo,
       min(created_at) AS desde_utc, max(created_at) AS hasta_utc
FROM marcados;


-- ── 2 · Diez ejemplos de los que nombran al otro, «al azar» pero repetible ────
--    (ordenados por el md5 de la descripción: la misma consulta da los mismos diez)
WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
puntos AS (
  SELECT ar.created_at, ar.document_name AS analizado, j->>'documentName' AS otro,
         substring(j->>'documentName' from '^[A-Z]+-[0-9]+') AS codigo_otro,
         regexp_replace(j->>'documentName', '\.[A-Za-z0-9]+$', '') AS nombre_otro,
         o->>'description' AS descripcion
  FROM public.analysis_results ar, parametros p,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j,
       jsonb_array_elements(CASE WHEN jsonb_typeof(j->'overlappingContent') = 'array' THEN j->'overlappingContent' ELSE '[]'::jsonb END) AS o
  WHERE ar.org_id = p.org
    AND o->>'confirmedBy' IS NULL
    AND coalesce(trim(o->>'description'), '') <> ''
),
distintas AS (
  SELECT DISTINCT ON (descripcion) analizado, otro, descripcion, created_at
  FROM puntos
  WHERE (codigo_otro IS NOT NULL AND upper(descripcion) LIKE '%' || codigo_otro || '%')
     OR position(nombre_otro in descripcion) > 0
  ORDER BY descripcion, created_at
)
SELECT analizado, otro, descripcion, created_at AS primera_vez_utc
FROM distintas
ORDER BY md5(descripcion)
LIMIT 10;
