-- ============================================================================
-- B.300 · LA COMPOSICIÓN DE LAS PASADAS CON 3 ACOMPAÑANTES DEL 30/09 — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (01/10/2026). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA (L-9 del arquitecto): qué documentos fueron candidatos en las
-- pasadas de la tanda de 3 del 30/09 —sobre todo NOR-10 a las 13:02:59 y NOR-11
-- a las 13:03:27— y cuáles eran acompañantes. Es la pieza que falta para R-1 de
-- B.300: hoy sólo consta «1 de 14», y sólo de la pasada del 29/09 a las 13:15.
--
-- ⚠️ LO QUE LA BASE GUARDA, Y LO QUE NO (lectura de Code, B.300 «L-9»):
--   · Con id y nombre, SÓLO los candidatos que LLEGARON AL JUEZ (en rápido, hasta
--     6): `analysis->'judgments'[]`, con `documentId` y `documentName`
--     (lib/analysis/types.ts:66-68).
--   · De los recuperados que el rerank tiró, sólo el NÚMERO:
--     `analysis->'coberturaDeCandidatos'->>'afines'` (los «Retrieval: N
--     candidatos» del log) frente a `->>'comparados'` (lib/analysis/pipeline.ts:1055).
--   · Por eso la composición es COMPLETA si y sólo si comparados = afines. Si no,
--     faltan (afines − comparados) documentos que existieron y no tienen nombre.
--   · Los ids de tanda NO se guardan en rápido (sólo el exhaustivo, en
--     analysis_jobs.batch_document_ids, app/api/analyze-v2/route.ts:552). Quiénes
--     eran los acompañantes lo dice el ARQUITECTO —NOR-10, NOR-11, CLI-12 y CLI-13—,
--     y aquí se marcan por el prefijo del nombre. Es una suposición declarada,
--     no un dato de la base.
--
-- A PRUEBA DE FALLO:
--   · Se listan TODOS los análisis de la ventana, no sólo los dos que interesan:
--     si sale alguno de más o de menos, se ve.
--   · `analisis_del_mismo_documento_en_la_ventana` > 1 avisa de que hay dos
--     pasadas del mismo documento y hay que elegir por la hora.
--   · `created_at` es cuándo se guardó, unos segundos DESPUÉS de la hora del log.
--     La ventana tiene margen para eso.
-- ============================================================================

WITH parametros AS (
  -- ═══════════════════════════════════════════════════════════════════════════
  -- ⬅️ SÓLO SE TOCAN ESTAS LÍNEAS. La ventana, en UTC, con margen: las pasadas de
  -- la tanda de 3 son del 30/09 entre las 13:01:52 y las 13:03:27 UTC (logs que
  -- transcribe el arquitecto).
  SELECT timestamptz '2026-09-30 13:00:00+00' AS desde,
         timestamptz '2026-09-30 13:06:00+00' AS hasta,
  -- ═══════════════════════════════════════════════════════════════════════════
         'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org
    AND ar.created_at >= p.desde
    AND ar.created_at <  p.hasta
),
juzgados AS (
  SELECT a.id,
         j->>'documentName' AS candidato,
         (j->>'documentName' LIKE 'NOR-10%' OR j->>'documentName' LIKE 'NOR-11%'
          OR j->>'documentName' LIKE 'CLI-12%' OR j->>'documentName' LIKE 'CLI-13%') AS es_acompanante
  FROM analisis a, jsonb_array_elements(coalesce(a.analysis->'judgments', '[]'::jsonb)) AS j
)
SELECT
  a.created_at                                                        AS guardado_utc,
  a.document_name                                                     AS analizado,
  a.analysis_type                                                     AS modo,
  count(*) OVER (PARTITION BY a.document_name)                        AS analisis_del_mismo_documento_en_la_ventana,
  (a.analysis->'coberturaDeCandidatos'->>'afines')::int               AS recuperados,
  (a.analysis->'coberturaDeCandidatos'->>'comparados')::int           AS llegaron_al_juez,
  (a.analysis->'termometro'->>'documentos_candidatos')::int           AS recuperados_segun_termometro,
  CASE
    WHEN a.analysis->'coberturaDeCandidatos' IS NULL THEN 'NO CONSTA: sin coberturaDeCandidatos'
    WHEN (a.analysis->'coberturaDeCandidatos'->>'afines')::int
       = (a.analysis->'coberturaDeCandidatos'->>'comparados')::int THEN 'COMPLETA'
    ELSE 'PARCIAL: faltan ' ||
         ((a.analysis->'coberturaDeCandidatos'->>'afines')::int
        - (a.analysis->'coberturaDeCandidatos'->>'comparados')::int) || ' sin nombre'
  END                                                                 AS composicion,
  (SELECT string_agg(candidato, ' · ' ORDER BY candidato) FROM juzgados x
    WHERE x.id = a.id AND x.es_acompanante)                           AS acompanantes_entre_los_juzgados,
  (SELECT string_agg(candidato, ' · ' ORDER BY candidato) FROM juzgados x
    WHERE x.id = a.id AND NOT x.es_acompanante)                       AS del_corpus_entre_los_juzgados,
  (SELECT count(*) FROM juzgados x WHERE x.id = a.id AND NOT x.es_acompanante) AS cuantos_del_corpus_juzgados
FROM analisis a
ORDER BY a.created_at;
