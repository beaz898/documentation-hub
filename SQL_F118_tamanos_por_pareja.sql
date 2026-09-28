-- ============================================================================
-- F-118 · TAMAÑO DE CADA PAREJA QUE VIO EL JUEZ, EN LOS ANÁLISIS RÁPIDOS — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (28/09/2026). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA: con qué fijar el presupuesto de entrada del juez en tokens.
-- Para cada análisis rápido registrado de la organización del director
-- (a9625e93, «Workspace principal»), y para cada candidato que llegó al juez,
-- el tamaño del documento analizado, el del candidato y la suma.
--
-- DE DÓNDE SALE CADA COSA, y dónde es aproximado:
--   · Los análisis: `analysis_results` con analysis_type = 'quick' y el jsonb
--     `analysis` presente (supabase-setup.sql:392-409; supabase-analysis-jsonb.sql:11).
--   · Las parejas: `analysis->'judgments'`, un elemento por candidato JUZGADO
--     (tras el rerank), con su `documentId` (lib/analysis/types.ts:66-68).
--     `lib/persist-analysis.ts:120` guarda el objeto entero.
--   · ⚠️ LOS CARACTERES NO ESTÁN EN NINGUNA COLUMNA DEL ANÁLISIS. Se usa
--     `char_length(documents.full_text)` — el texto ACTUAL del documento, no el
--     del día del análisis, y no el texto que arma el juez (que sale de los
--     trozos, `buildAnalyzedDocumentText`, judge.ts:977). Aproximación declarada.
--   · ⚠️ LOS TOKENS SON APROXIMADOS: caracteres / 4 (la equivalencia que usó
--     F-116: «3.000 caracteres son unos 750 tokens»). No se tokeniza.
--   · El analizado se casa por `document_id`; si está vacío (análisis del chat
--     antes de indexar, F-101), por NOMBRE dentro de la organización, y la
--     columna `analizado_casado_por` lo dice. Un candidato borrado desde
--     entonces sale con tamaño nulo, y se cuenta aparte, no se descarta callado.
--   · ⚠️ Esta organización NO es la de los 614 análisis de F-117 §2 (aquello era
--     `llm_usage`, de otra población). Aquí sale lo que haya, con su recuento.
--
-- COLUMNAS DE LA PRIMERA CONSULTA (una fila por pareja):
--   analisis_id, creado, analizado, analizado_casado_por, analizado_car,
--   candidato, candidato_car, suma_car, suma_tokens_aprox
-- LA SEGUNDA: el resumen — parejas, nulos y percentiles de suma_tokens_aprox.
-- ============================================================================

WITH rapidos AS (
  SELECT ar.id, ar.created_at, ar.document_id, ar.document_name, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
    AND ar.analysis_type = 'quick'
    AND ar.analysis IS NOT NULL
),
con_analizado AS (
  SELECT r.*,
         coalesce(d_id.id, d_nom.id)                           AS analizado_id,
         CASE WHEN d_id.id IS NOT NULL THEN 'id'
              WHEN d_nom.id IS NOT NULL THEN 'nombre'
              ELSE 'sin_casar' END                             AS analizado_casado_por,
         char_length(coalesce(d_id.full_text, d_nom.full_text)) AS analizado_car
  FROM rapidos r
  LEFT JOIN public.documents d_id
         ON d_id.id = r.document_id AND d_id.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
  LEFT JOIN LATERAL (
    SELECT d.id, d.full_text
    FROM public.documents d
    WHERE r.document_id IS NULL
      AND d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
      AND d.name = r.document_name
    ORDER BY d.created_at DESC
    LIMIT 1
  ) d_nom ON true
),
parejas AS (
  SELECT a.id AS analisis_id, a.created_at AS creado, a.document_name AS analizado,
         a.analizado_casado_por, a.analizado_car,
         j->>'documentName'           AS candidato,
         char_length(c.full_text)     AS candidato_car
  FROM con_analizado a
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(a.analysis->'judgments', '[]'::jsonb)) AS j
  LEFT JOIN public.documents c
         ON c.id::text = j->>'documentId' AND c.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
)
SELECT analisis_id, creado, analizado, analizado_casado_por, analizado_car,
       candidato, candidato_car,
       analizado_car + candidato_car                    AS suma_car,
       ceil((analizado_car + candidato_car) / 4.0)::int AS suma_tokens_aprox
FROM parejas
ORDER BY suma_car DESC NULLS LAST;

-- ── RESUMEN ─────────────────────────────────────────────────────────────────
-- Repite las CTE (una consulta de Supabase no las comparte entre sentencias).
WITH rapidos AS (
  SELECT ar.id, ar.document_id, ar.document_name, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
    AND ar.analysis_type = 'quick' AND ar.analysis IS NOT NULL
),
con_analizado AS (
  SELECT r.id, char_length(coalesce(d_id.full_text, d_nom.full_text)) AS analizado_car, r.analysis
  FROM rapidos r
  LEFT JOIN public.documents d_id
         ON d_id.id = r.document_id AND d_id.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
  LEFT JOIN LATERAL (
    SELECT d.full_text FROM public.documents d
    WHERE r.document_id IS NULL AND d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
      AND d.name = r.document_name
    ORDER BY d.created_at DESC LIMIT 1
  ) d_nom ON true
),
parejas AS (
  SELECT a.analizado_car, char_length(c.full_text) AS candidato_car
  FROM con_analizado a
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(a.analysis->'judgments', '[]'::jsonb)) AS j
  LEFT JOIN public.documents c
         ON c.id::text = j->>'documentId' AND c.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
),
medibles AS (
  SELECT ceil((analizado_car + candidato_car) / 4.0) AS t FROM parejas
  WHERE analizado_car IS NOT NULL AND candidato_car IS NOT NULL
)
SELECT
  (SELECT count(*) FROM rapidos)                                   AS analisis_rapidos,
  (SELECT count(*) FROM parejas)                                   AS parejas,
  (SELECT count(*) FROM parejas WHERE analizado_car IS NULL)       AS parejas_sin_tamano_del_analizado,
  (SELECT count(*) FROM parejas WHERE candidato_car IS NULL)       AS parejas_sin_tamano_del_candidato,
  (SELECT count(*) FROM medibles)                                  AS parejas_medibles,
  (SELECT percentile_cont(0.50) WITHIN GROUP (ORDER BY t) FROM medibles) AS p50_tokens,
  (SELECT percentile_cont(0.90) WITHIN GROUP (ORDER BY t) FROM medibles) AS p90_tokens,
  (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY t) FROM medibles) AS p95_tokens,
  (SELECT percentile_cont(0.99) WITHIN GROUP (ORDER BY t) FROM medibles) AS p99_tokens,
  (SELECT max(t) FROM medibles)                                    AS max_tokens,
  (SELECT count(*) FROM medibles WHERE t > 20000)                  AS parejas_por_encima_de_20000,
  (SELECT round(100.0 * count(*) FILTER (WHERE t <= 20000) / nullif(count(*), 0), 1)
     FROM medibles)                                                AS percentil_que_cabe_en_20000;

-- ============================================================================
-- LA DECISIÓN QUE SE TOMA CON ESTO:
-- `percentil_que_cabe_en_20000` es el percentil de parejas que cabrían enteras
-- en un presupuesto de 20.000 tokens de entrada para los dos lados; por encima
-- de él, la pareja se leería por tramos. Si ese percentil es alto y las que no
-- caben son pocas y nombrables (primera consulta, arriba del todo), el 20.000
-- de Fable se sostiene con esta población; si no, el número se discute con la
-- fila que lo rompe delante. ⚠️ Recordar al leerlo: los tamaños son de
-- full_text y los tokens son caracteres / 4 — la cifra es una aproximación
-- declarada, no una medición del prompt.
-- ============================================================================
