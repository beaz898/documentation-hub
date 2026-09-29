-- ============================================================================
-- F-118 · ¿HAY ALGÚN ANÁLISIS EXHAUSTIVO DE NOR-11 / CLI-13? — SÓLO LECTURA
-- ✅ EJECUTADO por el director el 28/09/2026 a las 13:35, en su versión anterior
-- (resultado en claude/Estado_Del_MVP.md, B.280). Sólo SELECT: no escribe nada.
-- ⚠️ 29/09/2026 (B.281): la consulta 1 gana la columna `presupuesto_candidato`.
-- ESA versión está PENDIENTE DE EJECUTAR. Sale NULL en todo análisis anterior al
-- 29/09 —el campo no existía—, y ahí no se sabe con qué presupuesto se hizo:
-- los de las 13:20-13:26 del 28/09 fueron con 14.676 por la variable del worker,
-- y eso sólo consta en B.280, no en la fila.
--
-- QUÉ CONTESTA: si el dato del «analizado entero» ya existe gratis. En
-- exhaustivo el juez recibe el documento analizado ENTERO (`recortarAnalizado`,
-- lib/analysis/judge.ts:1087); en rápido, los primeros 6.000 caracteres.
-- Trampas de P2 (posición en el texto del .docx): NOR-11 en 1.466, 7.243 y
-- 12.066; CLI-13 en 1.218, 4.828 y 8.560.
--
-- En las DOS organizaciones: 5a82712f (la de las tandas de agosto) y a9625e93
-- (la del director). En el repositorio no consta ninguno: ningún registro de
-- `claude/` anota un exhaustivo de este par (buscado el 28/09).
--
-- DOS NIVELES POR ANÁLISIS, porque el exhaustivo filtra con Sonnet:
--   · `publicada`  — analysis->'discrepancies': lo que sobrevivió al double-check.
--   · `del_juez`   — analysis->'judgments'[].contradictions: lo que dijo el juez
--     (Haiku) antes de Sonnet, contra el candidato de la otra mitad del par.
-- La comparación con el rápido que aísla «leer entero» es la del segundo nivel.
-- Columnas comprobadas: supabase-setup.sql:392-409, supabase-analysis-jsonb.sql:11,
-- lib/analysis/types.ts:66-80 (DocumentJudgment).
-- ============================================================================

WITH exhaustivos AS (
  SELECT ar.id, ar.org_id, ar.created_at, ar.document_name AS analizado, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id IN ('5a82712f-6740-4792-b291-3fdea8e6edb1', 'a9625e93-af2a-4416-a465-5c2fa2a25bdf')
    AND ar.analysis_type = 'exhaustive'
    AND (ar.document_name LIKE 'NOR-11%' OR ar.document_name LIKE 'CLI-13%')
)
-- 1 · Los análisis, y si traen jsonb con el que mirar dentro.
SELECT id, org_id, created_at, analizado,
       analysis IS NOT NULL                                              AS con_jsonb,
       jsonb_array_length(coalesce(analysis->'discrepancies', '[]'::jsonb)) AS contradicciones_publicadas,
       analysis->'textoAnalizado'                                       AS texto_analizado,
       (analysis->'presupuestoDelCandidato'->>'caracteres')::int        AS presupuesto_candidato
FROM exhaustivos
ORDER BY created_at;

-- 2 · Lo publicado (tras Sonnet) y lo que dijo el juez (antes), una fila por hallazgo.
WITH exhaustivos AS (
  SELECT ar.id, ar.org_id, ar.created_at, ar.document_name AS analizado, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id IN ('5a82712f-6740-4792-b291-3fdea8e6edb1', 'a9625e93-af2a-4416-a465-5c2fa2a25bdf')
    AND ar.analysis_type = 'exhaustive'
    AND (ar.document_name LIKE 'NOR-11%' OR ar.document_name LIKE 'CLI-13%')
)
SELECT e.created_at, e.analizado, 'publicada' AS nivel,
       d->>'existingDocument' AS candidato, d->>'topic' AS titulo, d->>'confirmedBy' AS confirmado_por,
       left(d->>'newDocSays', 140) AS cita_analizado, left(d->>'existingDocSays', 140) AS cita_candidato
FROM exhaustivos e
CROSS JOIN LATERAL jsonb_array_elements(coalesce(e.analysis->'discrepancies', '[]'::jsonb)) AS d
WHERE d->>'existingDocument' LIKE 'NOR-11%' OR d->>'existingDocument' LIKE 'CLI-13%'
UNION ALL
SELECT e.created_at, e.analizado, 'del_juez' AS nivel,
       j->>'documentName', c->>'topic', NULL,
       left(c->>'newDocSays', 140), left(c->>'existingDocSays', 140)
FROM exhaustivos e
CROSS JOIN LATERAL jsonb_array_elements(coalesce(e.analysis->'judgments', '[]'::jsonb)) AS j
CROSS JOIN LATERAL jsonb_array_elements(coalesce(j->'contradictions', '[]'::jsonb)) AS c
WHERE j->>'documentName' LIKE 'NOR-11%' OR j->>'documentName' LIKE 'CLI-13%'
ORDER BY 1, 3, 4;
