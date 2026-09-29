-- ============================================================================
-- ESCALÓN 1 (B.295) · LA PAREJA NOR-11 / CLI-13, ANÁLISIS POR ANÁLISIS — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (29/09/2026). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA: para cada análisis de la pareja, en las dos direcciones, qué leyó
-- EL JUEZ de cada lado (`lecturaDeLasParejas`, B.295) y qué recuperó EL RETRIEVAL
-- (`presupuestoDelCandidato`, B.281), EN COLUMNAS APARTE: son dos estaciones, y
-- que discrepen es un dato. Más lo publicado con esa pareja.
-- Una fila por análisis. El plan de medida está en claude/Estado_Del_MVP.md, B.295:
-- 5 pasadas por dirección con el interruptor apagado y 5 encendido.
--
-- LAS DOS ORGANIZACIONES, con su columna: 5a82712f (tandas de agosto) y a9625e93
-- (la del director). Los análisis anteriores al despliegue de `34d67fb5` (29/09) no
-- tienen `lecturaDeLasParejas`, y los anteriores a `5637856c` tampoco
-- `presupuestoDelCandidato`: salen NULL, no 0.
--
-- LA PAREJA DENTRO DEL ANÁLISIS: el candidato de la otra mitad se busca en
-- `judgments` por nombre, y su `documentId` elige la entrada de las dos listas por
-- candidato. Si el rerank lo descartó, no hay pareja y las columnas salen NULL.
--
-- ⚠️ LOS IDS DE LOS HALLAZGOS: `hashCitationPair` (lib/analysis/llm-boundary.ts:
-- 158-162), recalculado con la MISMA expresión que `SQL_P2_direccion_de_la_base.sql`
-- (:40-43). Dos salvedades:
--   · el log lo calcula sobre las citas CRUDAS del juez, y aquí va sobre las
--     PUBLICADAS. Si el verificador corrigió una cita, el hash no coincidirá con el
--     del log: gana el log, y el título dice cuál es;
--   · una mayúscula acentuada puede no pasar a minúscula igual que en JavaScript.
--
-- ⚠️ LA LATENCIA (P-4, R-3) NO ESTÁ AQUÍ: `analysis_results` no la guarda. Está en
-- `usage_logs.latency_ms` (supabase-setup.sql:440), con endpoint '/api/analyze-v2'.
-- ============================================================================

WITH analisis AS (
  SELECT ar.id, ar.org_id, ar.created_at, ar.analysis_type, ar.document_name AS analizado, ar.analysis,
         CASE WHEN ar.document_name LIKE 'NOR-11%' THEN 'CLI-13' ELSE 'NOR-11' END AS pareja_de
  FROM public.analysis_results ar
  WHERE ar.org_id IN ('5a82712f-6740-4792-b291-3fdea8e6edb1', 'a9625e93-af2a-4416-a465-5c2fa2a25bdf')
    AND (ar.document_name LIKE 'NOR-11%' OR ar.document_name LIKE 'CLI-13%')
),
con_pareja AS (
  SELECT a.*,
         (SELECT j->>'documentId' FROM jsonb_array_elements(coalesce(a.analysis->'judgments', '[]'::jsonb)) AS j
           WHERE j->>'documentName' LIKE a.pareja_de || '%' LIMIT 1) AS pareja_id
  FROM analisis a
),
lecturas AS (
  SELECT c.*,
         (SELECT l FROM jsonb_array_elements(coalesce(c.analysis->'lecturaDeLasParejas', '[]'::jsonb)) AS l
           WHERE l->>'documentId' = c.pareja_id LIMIT 1) AS lectura,
         (SELECT r FROM jsonb_array_elements(coalesce(c.analysis->'presupuestoDelCandidato'->'candidatos', '[]'::jsonb)) AS r
           WHERE r->>'documentId' = c.pareja_id LIMIT 1) AS reparto
  FROM con_pareja c
)
SELECT
  created_at                                              AS fecha,
  CASE org_id WHEN '5a82712f-6740-4792-b291-3fdea8e6edb1' THEN 'agosto' ELSE 'director' END AS organizacion,
  analysis_type                                           AS modo,
  split_part(analizado, '_', 1) || ' → ' || pareja_de     AS direccion,
  -- Lo que leyó el JUEZ (B.295)
  lectura->>'regimen'                                     AS regimen,
  (lectura->'analizado'->>'caracteres')::int              AS juez_analizado_caracteres,
  (lectura->'analizado'->>'mostrados')::int               AS juez_analizado_mostrados,
  (lectura->'analizado'->>'dejoFuera')::boolean           AS juez_analizado_dejo_fuera,
  (lectura->'candidato'->>'caracteres')::int              AS juez_candidato_caracteres,
  (lectura->'candidato'->>'mostrados')::int               AS juez_candidato_mostrados,
  (lectura->'candidato'->>'dejoFuera')::boolean           AS juez_candidato_dejo_fuera,
  (lectura->>'presupuesto')::int                          AS juez_presupuesto_pareja,
  -- Lo que recuperó el RETRIEVAL (B.281), aparte
  (analysis->'presupuestoDelCandidato'->>'caracteres')::int AS retrieval_presupuesto_candidato,
  (reparto->>'caracteres')::int                           AS retrieval_candidato_caracteres,
  (reparto->>'mostrados')::int                            AS retrieval_candidato_mostrados,
  (reparto->>'dejoFuera')::boolean                        AS retrieval_candidato_dejo_fuera,
  -- Lo publicado con la pareja
  (SELECT count(*) FROM jsonb_array_elements(coalesce(analysis->'discrepancies', '[]'::jsonb)) AS d
    WHERE d->>'existingDocument' LIKE pareja_de || '%')   AS contradicciones,
  (SELECT count(*) FROM jsonb_array_elements(coalesce(analysis->'overlaps', '[]'::jsonb)) AS o
    WHERE o->>'existingDocument' LIKE pareja_de || '%')   AS solapamientos,
  (SELECT string_agg(
            left(encode(sha256(convert_to(
              btrim(regexp_replace(lower(coalesce(d->>'newDocSays', '')), '\s+', ' ', 'g')) || '|' ||
              btrim(regexp_replace(lower(coalesce(d->>'existingDocSays', '')), '\s+', ' ', 'g')),
              'UTF8')), 'hex'), 8) || ' «' || coalesce(d->>'topic', '') || '»', ' · ')
    FROM jsonb_array_elements(coalesce(analysis->'discrepancies', '[]'::jsonb)) AS d
    WHERE d->>'existingDocument' LIKE pareja_de || '%')   AS hallazgos
FROM lecturas
ORDER BY created_at;
