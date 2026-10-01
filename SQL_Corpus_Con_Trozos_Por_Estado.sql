-- ============================================================================
-- LOS DOCUMENTOS CON TROZOS, POR ESTADO — SÓLO LECTURA (L-10; ficha B.307)
-- ✅ EJECUTADO por el director el 01/10/2026. Sólo SELECT: no escribe nada.
--    Resultado (transcrito por el arquitecto; B.307): los 28 con trozos, TODOS en
--    `pendiente`; 8 con análisis (se añaden sin créditos) y 20 sin él. Salieron
--    además CLI-01 dos veces (B.266) y OPE-06 con 114 trozos (B.305).
--
-- QUÉ CONTESTA: la deducción del arquitecto, «NINGUNO de los documentos que SÍ
-- tienen trozos está en el corpus». La consulta 2 del censo
-- (SQL_Documentos_Sin_Chunks.sql) ya la prueba a nivel de columna: dio
-- en_el_corpus = 14 y corpus_sin_trozos = 14, o sea ningún `analizado` con trozos.
-- Ésta es la comprobación DIRECTA, y además da los nombres: lo que el director
-- necesita para decidir cuáles de esos documentos meter en el corpus.
--
-- ⚠️ LO QUE NO MIRA: la metadata de los vectores, que es lo que de verdad usa el
-- retrieval (`analysisStatus` en Pinecone, lib/pinecone/vectors.ts:99). Aquí se
-- cuenta la COLUMNA. Que las dos coincidan es el invariante F-96, sin comprobar en
-- esta organización (B.301).
--
-- «Tiene trozos» = al menos un trozo en su generación ACTIVA, la misma
-- definición que el censo. «Tiene análisis» = existe una fila en
-- analysis_results con su document_id: es la condición que pide el botón
-- «Añadir al corpus» de la bandeja (lib/documents/seleccion-indexable.ts; la
-- bandeja lo lee igual, app/api/documents/review-list/route.ts).
--
-- DOS CONSULTAS. Si el editor sólo enseña el resultado de la última, se
-- selecciona cada una y se ejecuta por separado.
-- ============================================================================

-- 1 · El resumen: de los documentos CON trozos, cuántos hay en cada estado.
--     Si la deducción es cierta, `analizado` no aparece o sale con 0.
WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
docs AS (
  SELECT d.id, d.name, d.analysis_status,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos
  FROM public.documents d, parametros p
  WHERE d.org_id = p.org
)
SELECT analysis_status, count(*) AS documentos_con_trozos
FROM docs
WHERE trozos_activos > 0
GROUP BY ROLLUP (analysis_status)   -- la fila con analysis_status vacío es el TOTAL
ORDER BY analysis_status NULLS LAST;

-- 2 · Documento a documento, con lo que hace falta para decidir.
WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
docs AS (
  SELECT d.id, d.name, d.source, d.analysis_status, d.created_at,
         char_length(coalesce(d.full_text, '')) AS full_text_car,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
         EXISTS (SELECT 1 FROM public.analysis_results ar
                  WHERE ar.document_id = d.id)                              AS tiene_analisis,
         EXISTS (SELECT 1 FROM public.document_staged st
                  WHERE st.document_id = d.id AND st.org_id = d.org_id)     AS version_nueva_pendiente
  FROM public.documents d, parametros p
  WHERE d.org_id = p.org
)
SELECT name, analysis_status, source, trozos_activos, full_text_car,
       tiene_analisis, version_nueva_pendiente,
       CASE
         WHEN analysis_status = 'analizado'   THEN 'ya en el corpus'
         WHEN version_nueva_pendiente         THEN 'decidir antes su versión nueva'
         WHEN tiene_analisis                  THEN 'se puede añadir: «Añadir al corpus» en la bandeja, sin créditos'
         ELSE 'analizarlo primero (cuesta el análisis) y luego añadir'
       END AS que_haria_falta,
       created_at
FROM docs
WHERE trozos_activos > 0
ORDER BY analysis_status, name;
