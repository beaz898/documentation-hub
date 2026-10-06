-- ============================================================================
-- B.334 · ¿QUÉ DOCUMENTOS TIENEN VECTORES Y NO TIENEN TROZOS? — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta, copiado de SQL_F120_P3_rerank_a_cero.sql (convenio del      │
-- │ 05/10/2026). No se mira ninguna otra.                                    │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 06/10/2026): el retrieval de NOR-11 de las 10:29 y
-- 10:31 UTC devolvió fragmentos de 8 documentos, y SQL_B345 dice que en el corpus
-- sólo hay 6 con trozos (5 sin contar NOR-11). ¿Cuáles son los que están en la
-- búsqueda con vectores y sin trozos?
--
-- LO QUE SE LEYÓ EN EL CÓDIGO ANTES DE ESCRIBIR ESTO:
--   · la búsqueda NO filtra por la fila de Supabase sino por la METADATA del
--     vector: `CORPUS_ACTIVO = { analysisStatus: { $eq: 'analizado' } }`
--     (lib/pinecone/vectors.ts:99), más los ids de la tanda (:111-121);
--   · la criba de generación compara la generación del vector con
--     `documents.active_generation` (lib/documents/vivos.ts:80-83) y NUNCA mira
--     `document_chunks`. Un documento con vectores de su generación activa y cero
--     trozos pasa la criba y puede ser candidato.
--
-- DE DÓNDE SALEN LOS «VECTORES» AQUÍ: SQL no ve Pinecone. `documents.chunk_count`
-- es el número de trozos que se enviaron a Pinecone al indexar (ingest/route.ts:289,
-- index-text/route.ts:387, drive/sync/route.ts:359, :402 y :442). Es lo DECLARADO,
-- no una lectura del índice. Para un documento concreto, la lectura de verdad es
-- /api/admin/vectores-de-un-documento.
--
-- COLUMNAS: estado, extractor_version, generación activa, vectores declarados
-- (chunk_count), trozos de la generación activa, trozos de cualquier generación,
-- y `vectores_sin_trozos` = chunk_count > 0 Y cero trozos en la generación activa.
-- `recuperado_hoy` marca los 8 nombres que el arquitecto da como recuperados en las
-- pasadas de NOR-11 de las 10:29 y 10:31 UTC del 06/10.
--
-- ⚠️ CONTROL: la fila `0 · control` cuenta los documentos con `chunk_count` NULL;
-- para esos no se puede decir si tienen vectores, y si no es 0 la columna
-- `vectores_sin_trozos` no cubre a todos.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
docs AS (
  SELECT d.name, d.analysis_status, d.extractor_version, d.active_generation, d.chunk_count,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id) AS trozos_cualquier_generacion,
         (d.name ILIKE 'CLI-13%' OR d.name ILIKE 'CLI-12%' OR d.name ILIKE 'OPE-13%'
          OR d.name ILIKE 'OPE-10%' OR d.name ILIKE 'OPE-11%' OR d.name ILIKE 'RRHH-08%'
          OR d.name ILIKE 'Clientes_Residuos_Sanitarios%' OR d.name ILIKE 'Normas_Frecuencia_Recogidas%') AS recuperado_hoy
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
)
SELECT bloque, name, analysis_status, extractor_version, active_generation, vectores_declarados,
       trozos_activos, trozos_cualquier_generacion, vectores_sin_trozos, recuperado_hoy
FROM (
  SELECT '0 · control' AS bloque,
         'documentos con chunk_count NULL: ' || count(*) FILTER (WHERE chunk_count IS NULL)
           || ' · de ' || count(*) || ' documentos' AS name,
         NULL::text AS analysis_status, NULL::int AS extractor_version, NULL::int AS active_generation,
         NULL::int AS vectores_declarados, NULL::bigint AS trozos_activos,
         NULL::bigint AS trozos_cualquier_generacion, NULL::boolean AS vectores_sin_trozos,
         NULL::boolean AS recuperado_hoy, 0 AS orden
  FROM docs
  UNION ALL
  SELECT '1 · documentos', name, analysis_status, extractor_version, active_generation, chunk_count,
         trozos_activos, trozos_cualquier_generacion,
         (coalesce(chunk_count, 0) > 0 AND trozos_activos = 0),
         recuperado_hoy,
         CASE WHEN recuperado_hoy THEN 1 ELSE 2 END
  FROM docs
) t
ORDER BY bloque, orden, vectores_sin_trozos DESC NULLS LAST, name;
