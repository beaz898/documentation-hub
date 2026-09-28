-- ============================================================================
-- F-118 · EL OTRO BRAZO: LOS ANÁLISIS RÁPIDOS DE NOR-11 / CLI-13 — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (28/09/2026). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA: qué dijo el JUEZ en modo RÁPIDO sobre la pareja, en las dos
-- direcciones, para ponerlo al lado de `SQL_F118_exhaustivos_NOR11_CLI13.sql`
-- (mismas columnas, mismo orden). Los crudos del examen (`c39397e7`) sólo tienen
-- la dirección NOR-11 → CLI-13; la que falta es CLI-13 analizado → NOR-11.
--
-- ⚠️ El examen NO escribe en `analysis_results` (app/api/admin/examen/analizar.ts,
-- cabecera: «NO GUARDA en analysis_results»), así que aquí sólo salen los
-- rápidos lanzados desde el producto: los de agosto en 5a82712f y los que haya
-- hecho el director en a9625e93.
--
-- DOS NIVELES POR ANÁLISIS:
--   · `publicada` — analysis->'discrepancies'.
--   · `del_juez`  — analysis->'judgments'[].contradictions, contra el candidato
--     de la otra mitad del par. Es el nivel comparable con la línea RAW del juez
--     (lib/analysis/judge.ts:907-910) salvo lo que tire la verificación de citas.
-- ============================================================================

WITH rapidos AS (
  SELECT ar.id, ar.org_id, ar.created_at, ar.document_name AS analizado, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id IN ('5a82712f-6740-4792-b291-3fdea8e6edb1', 'a9625e93-af2a-4416-a465-5c2fa2a25bdf')
    AND ar.analysis_type = 'quick'
    AND (ar.document_name LIKE 'NOR-11%' OR ar.document_name LIKE 'CLI-13%')
)
-- 1 · Los análisis.
SELECT id, org_id, created_at, analizado,
       analysis IS NOT NULL                                              AS con_jsonb,
       jsonb_array_length(coalesce(analysis->'discrepancies', '[]'::jsonb)) AS contradicciones_publicadas,
       analysis->'textoAnalizado'                                       AS texto_analizado
FROM rapidos
ORDER BY created_at;

-- 2 · Lo publicado y lo que dijo el juez, una fila por hallazgo.
WITH rapidos AS (
  SELECT ar.id, ar.org_id, ar.created_at, ar.document_name AS analizado, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id IN ('5a82712f-6740-4792-b291-3fdea8e6edb1', 'a9625e93-af2a-4416-a465-5c2fa2a25bdf')
    AND ar.analysis_type = 'quick'
    AND (ar.document_name LIKE 'NOR-11%' OR ar.document_name LIKE 'CLI-13%')
)
SELECT e.created_at, e.analizado, 'publicada' AS nivel,
       d->>'existingDocument' AS candidato, d->>'topic' AS titulo, d->>'confirmedBy' AS confirmado_por,
       left(d->>'newDocSays', 140) AS cita_analizado, left(d->>'existingDocSays', 140) AS cita_candidato
FROM rapidos e
CROSS JOIN LATERAL jsonb_array_elements(coalesce(e.analysis->'discrepancies', '[]'::jsonb)) AS d
WHERE d->>'existingDocument' LIKE 'NOR-11%' OR d->>'existingDocument' LIKE 'CLI-13%'
UNION ALL
SELECT e.created_at, e.analizado, 'del_juez' AS nivel,
       j->>'documentName', c->>'topic', NULL,
       left(c->>'newDocSays', 140), left(c->>'existingDocSays', 140)
FROM rapidos e
CROSS JOIN LATERAL jsonb_array_elements(coalesce(e.analysis->'judgments', '[]'::jsonb)) AS j
CROSS JOIN LATERAL jsonb_array_elements(coalesce(j->'contradictions', '[]'::jsonb)) AS c
WHERE j->>'documentName' LIKE 'NOR-11%' OR j->>'documentName' LIKE 'CLI-13%'
ORDER BY 1, 3, 4;
