-- ============================================================================
-- B.362 · VÍA 2 · ¿LOS VECTORES Y LOS TROZOS DE CADA DOCUMENTO SON DE LA MISMA
-- INDEXACIÓN? — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada. Sólo recuentos y
-- nombres de documento; ni un texto de trozo.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta, copiado de SQL_F120_P3_rerank_a_cero.sql (convenio del      │
-- │ 05/10/2026). No se mira ninguna otra.                                    │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 09/10/2026): el bloque por relevancia del juez pinta
-- el texto del VECTOR (`metadata.text` de Pinecone,
-- lib/analysis/criba-de-matches.ts:156), y las unidades de cita se numeran sobre
-- el texto del TROZO GUARDADO (`document_chunks.text`). Si los dos los escribió la
-- MISMA indexación, son idénticos por construcción y no hay nada que comparar.
--
-- POR QUÉ BASTA CON SUPABASE, sin tocar Pinecone (leído en el código el 09/10):
--   · las cuatro vías que indexan escriben vectores y trozos DESDE EL MISMO ARRAY
--     y en la MISMA operación, con la misma generación: app/api/ingest/route.ts
--     (:271 y :379), app/api/index-text/route.ts (:354 y :492),
--     app/api/drive/sync/route.ts (:297 y :381/:431/:472) y
--     lib/documents/reparar.ts (:146 y :161);
--   · `documents.chunk_count` es el número de vectores enviados en esa operación,
--     y `document_chunks` lleva la `generation` de cada trozo;
--   · así que un documento cuyo `chunk_count` coincide con sus trozos de la
--     generación activa tiene, casi con seguridad, vectores y trozos de la misma
--     indexación.
--
-- ⚠️ LO QUE NO PRUEBA: la igualdad de recuentos es NECESARIA, no suficiente. Una
-- reescritura de la MISMA generación que fallara entre los vectores y los
-- trozos podría dejar el mismo número con textos distintos. Para eso habría que
-- leer Pinecone, y no se hace.
--
-- LOS VEREDICTOS, por documento:
--   · «misma indexación»: chunk_count = trozos de la generación activa > 0;
--   · «sin trozos»: vectores declarados y cero trozos en la generación activa
--     (los de B.334). El bloque por relevancia pinta su texto de Pinecone y NO
--     HAY TROZO GUARDADO sobre el que numerar unidades;
--   · «no cuadra»: hay trozos, pero no tantos como vectores declarados;
--   · «sin dato»: chunk_count NULL (columna anterior a su escritura).
-- `extractor_version` va de información: la vigente es 3 (lib/chunking.ts:80-83 y
-- :131). Una versión antigua NO rompe la identidad —vectores y trozos siguen
-- siendo de la misma operación—; sólo dice con qué troceador se hicieron.
--
-- ⚠️ CONTROL: el bloque 0 cuenta los documentos sin `chunk_count`. Si no es 0,
-- esos documentos no se pueden clasificar.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
docs AS (
  SELECT d.name, d.analysis_status, d.extractor_version, d.active_generation, d.chunk_count,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation <> d.active_generation) AS trozos_de_otras_generaciones
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
),
clasif AS (
  SELECT *,
         (analysis_status = 'analizado') AS en_el_corpus,
         CASE
           WHEN chunk_count IS NULL THEN 'sin dato'
           WHEN trozos_activos = 0 THEN 'sin trozos'
           WHEN chunk_count = trozos_activos THEN 'misma indexación'
           ELSE 'no cuadra'
         END AS veredicto
  FROM docs
)
SELECT bloque, veredicto, en_el_corpus, documentos, name, analysis_status, extractor_version,
       active_generation, chunk_count, trozos_activos, trozos_de_otras_generaciones
FROM (
  SELECT '0 · control' AS bloque, 'documentos sin chunk_count' AS veredicto, NULL::boolean AS en_el_corpus,
         count(*) FILTER (WHERE chunk_count IS NULL) AS documentos,
         'de ' || count(*) || ' documentos' AS name, NULL::text AS analysis_status, NULL::int AS extractor_version,
         NULL::int AS active_generation, NULL::int AS chunk_count, NULL::bigint AS trozos_activos,
         NULL::bigint AS trozos_de_otras_generaciones, 0 AS orden
  FROM clasif
  UNION ALL
  SELECT '1 · resumen', veredicto, en_el_corpus, count(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1
  FROM clasif GROUP BY veredicto, en_el_corpus
  UNION ALL
  SELECT '2 · documentos', veredicto, en_el_corpus, NULL, name, analysis_status, extractor_version,
         active_generation, chunk_count, trozos_activos, trozos_de_otras_generaciones, 2
  FROM clasif
) t
ORDER BY bloque, en_el_corpus DESC NULLS FIRST, veredicto, name;
