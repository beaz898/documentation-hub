-- ============================================================================
-- B.314 · CUÁNTAS TARJETAS DE SOLAPAMIENTO SALDRÍAN POR ANÁLISIS — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA (arquitecto, 05/10/2026, antes del commit B): con una tarjeta por
-- punto de solapamiento, cuántas tarjetas vería el usuario en un análisis, en la
-- mediana y en el peor caso. Si el peor pasa de 15, la pantalla necesita otra
-- cosa (plegar por documento, por ejemplo), y se decide antes de escribirla.
--
-- POR QUÉ HACE FALTA LA BASE: en el archivo del examen cada análisis se compara
-- con UN solo documento (máximo 6 tarjetas, mediana 3), y eso no es producción.
-- El tope posible es de 30 en el rápido (6 parejas × 5 puntos) y 50 en el
-- exhaustivo, más una por entrada estructural.
--
-- CÓMO SE CUENTA: una tarjeta por punto del juez (`overlappingContent` sin
-- `confirmedBy` y con descripción) y una por cada pareja con entrada estructural
-- (ésas no llevan lista y se quedan como hoy). Sale de los juicios guardados, así
-- que vale también para los análisis anteriores al commit A.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
por_pareja AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type,
         j->>'documentName' AS otro,
         (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(j->'overlappingContent') = 'array' THEN j->'overlappingContent' ELSE '[]'::jsonb END) o
           WHERE o->>'confirmedBy' IS NULL AND coalesce(trim(o->>'description'), '') <> '') AS puntos_del_juez,
         (SELECT CASE WHEN count(*) > 0 THEN 1 ELSE 0 END FROM jsonb_array_elements(CASE WHEN jsonb_typeof(j->'overlappingContent') = 'array' THEN j->'overlappingContent' ELSE '[]'::jsonb END) o
           WHERE o->>'confirmedBy' IS NOT NULL AND coalesce(trim(o->>'description'), '') <> '') AS estructural
  FROM public.analysis_results ar, parametros p,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j
  WHERE ar.org_id = p.org
),
por_analisis AS (
  SELECT id, created_at, document_name, analysis_type,
         sum(puntos_del_juez + estructural)                                   AS tarjetas,
         count(*) FILTER (WHERE puntos_del_juez + estructural > 0)            AS documentos_con_tarjetas,
         max(puntos_del_juez + estructural)                                   AS tarjetas_del_documento_mayor
  FROM por_pareja
  GROUP BY id, created_at, document_name, analysis_type
)
SELECT analysis_type AS modo,
       count(*)                                                              AS analisis,
       percentile_disc(0.5) WITHIN GROUP (ORDER BY tarjetas)                 AS mediana,
       percentile_disc(0.95) WITHIN GROUP (ORDER BY tarjetas)                AS p95,
       max(tarjetas)                                                         AS peor_caso,
       count(*) FILTER (WHERE tarjetas > 15)                                 AS analisis_con_mas_de_15,
       max(documentos_con_tarjetas)                                          AS max_documentos,
       max(tarjetas_del_documento_mayor)                                     AS max_tarjetas_en_un_documento,
       (array_agg(document_name || ' (' || to_char(created_at, 'YYYY-MM-DD') || ')' ORDER BY tarjetas DESC))[1] AS el_peor
FROM por_analisis
GROUP BY analysis_type
ORDER BY analysis_type;
