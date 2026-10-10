-- ============================================================================
-- F-123 · FASE 1.2: LA LONGITUD RENDERIZADA DE CADA DOCUMENTO DEL CORPUS, LEÍDA
-- DE LO QUE YA GUARDAN LOS ANÁLISIS — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada. Sólo nombres y cifras.
-- ✅ PROBADO ANTES DE ENTREGARLO (10/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): junta las observaciones de un documento como
-- candidato y como analizado, ignora las de candidato sin trozos (null), las de
-- otra organización y los documentos fuera del corpus, y da la más reciente.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 10/10/2026): la cifra que DECIDE la fase 1.2 es la
-- longitud del texto RENDERIZADO que mide el presupuesto del juez, no el
-- full_text (ver el bloque 2 de SQL_F123_01). El render no se imita en SQL
-- (buildAnalyzedDocumentText, lib/analysis/judge.ts:972-991, reconstruye cada
-- tabla con renderTableBlock). Pero cada análisis desde el 29/09 ya GUARDA esa
-- cifra en `analysis->'lecturaDeLasParejas'`:
--   · candidato.caracteres = el candidato entero renderizado
--     (judge.ts:1150 y :1279); null si no tenía trozos;
--   · analizado.caracteres = el analizado entero (judge.ts:1036 y :1291),
--     renderizado si tenía trozos.
-- Se leen las dos, por documento. Sin lanzar análisis ni gastar créditos.
--
-- LÍMITES, dichos antes de leer la salida:
--   1. Sólo salen los documentos que han aparecido en algún análisis desde el
--      29/09 (como analizado con document_id, o como candidato). Uno que nunca
--      apareció sale con 0 observaciones y la cifra nula: NO es «vacío».
--   2. La cifra es la de AQUEL análisis. Si el documento se reindexó después,
--      puede no ser la de hoy: `minimo` y `maximo` distintos lo delatan.
--   3. Un analizado SIN trozos se mide en texto plano, no renderizado. Los
--      restos (sin trozos) no entran en pareja_entera de todas formas.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
lecturas AS (
  SELECT ar.created_at, ar.document_id::text AS analizado_id, l
  FROM public.analysis_results ar
  CROSS JOIN piloto
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ar.analysis->'lecturaDeLasParejas') = 'array'
         THEN ar.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) AS l
  WHERE ar.org_id = piloto.org
),
observado AS (
  -- el candidato, renderizado entero (judge.ts:1150 y :1279); null si no tenía trozos
  SELECT l->>'documentId' AS doc, (l->'candidato'->>'caracteres')::int AS caracteres, created_at
  FROM lecturas
  UNION ALL
  -- el analizado, sólo si se sabe cuál era (document_id no nulo)
  SELECT analizado_id, (l->'analizado'->>'caracteres')::int, created_at
  FROM lecturas WHERE analizado_id IS NOT NULL
)
SELECT d.name, d.id,
       count(o.caracteres)                                         AS observaciones,
       min(o.caracteres)                                           AS minimo,
       max(o.caracteres)                                           AS maximo,
       (array_agg(o.caracteres ORDER BY o.created_at DESC)
          FILTER (WHERE o.caracteres IS NOT NULL))[1]              AS el_mas_reciente,
       max(o.created_at) FILTER (WHERE o.caracteres IS NOT NULL)  AS cuando
FROM public.documents d
CROSS JOIN piloto
LEFT JOIN observado o ON o.doc = d.id::text
WHERE d.org_id = piloto.org AND d.analysis_status = 'analizado'
GROUP BY d.name, d.id
ORDER BY el_mas_reciente DESC NULLS LAST, d.name;
