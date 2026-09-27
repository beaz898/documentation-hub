-- ============================================================================
-- P2 · ¿QUÉ CONTRADICCIÓN SALIÓ EN CADA DIRECCIÓN EN AGOSTO? — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (28/09/2026). No escribe nada.
--
-- Para qué: la base de P2 («2 de 3», 27/08, 8cf73e23) sumaba dos direcciones,
-- una contradicción cada una (B.106). Esta consulta dice cuál salió en cada una.
-- Si analizando NOR-11 salió la de 72 h (P2-1), la tanda del 27/09 —0 de 5 en
-- esa dirección— perdió un acierto que tenía delante.
--
-- ⚠️ `14123c6f` y `9d19a20b` (Tandas_Harness.md:1125-1126, 31/08) NO son ids de
-- fila: son el hash de la pareja de citas que imprime el verificador
-- (`hashCitationPair`, lib/analysis/llm-boundary.ts:158-162): sha256 de
-- «newDocSays|existingDocSays», cada lado en minúsculas, espacios colapsados y
-- recortado, y los 8 primeros caracteres hex. Aquí se recalcula igual.
-- ⚠️ Si la collation de la base sólo pasa a minúsculas el ASCII, una cita con
-- una mayúscula acentuada no daría el mismo hash. No importa para la pregunta:
-- la consulta lista TODAS las contradicciones con su dirección, casen o no.
--
-- Columnas comprobadas en el esquema: analysis_results.id, org_id,
-- document_name, analysis_type, created_at (supabase-setup.sql:392-409) y
-- analysis jsonb (supabase-analysis-jsonb.sql:11). Organización: la de las
-- tandas de agosto, 5a82712f (errata de Tandas_Harness.md, cabecera).
-- ============================================================================

WITH analisis_del_par AS (
  SELECT ar.id, ar.created_at, ar.analysis_type, ar.document_name AS analizado, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
    AND ar.created_at >= '2026-08-27' AND ar.created_at < '2026-09-02'
    AND (ar.document_name LIKE 'NOR-11%' OR ar.document_name LIKE 'CLI-13%')
),
contradicciones AS (
  SELECT a.id, a.created_at, a.analysis_type, a.analizado,
         d->>'existingDocument' AS candidato,
         d->>'topic'            AS titulo,
         d->>'severity'         AS severidad,
         d->>'confirmedBy'      AS confirmado_por,
         d->>'newDocSays'       AS cita_analizado,
         d->>'existingDocSays'  AS cita_candidato,
         left(encode(sha256(convert_to(
           btrim(regexp_replace(lower(coalesce(d->>'newDocSays', '')), '\s+', ' ', 'g')) || '|' ||
           btrim(regexp_replace(lower(coalesce(d->>'existingDocSays', '')), '\s+', ' ', 'g')),
           'UTF8')), 'hex'), 8) AS hash_de_la_pareja
  FROM analisis_del_par a
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(a.analysis->'discrepancies', '[]'::jsonb)) AS d
)
SELECT created_at, analysis_type, analizado, candidato, titulo, severidad, confirmado_por,
       hash_de_la_pareja,
       hash_de_la_pareja IN ('14123c6f', '9d19a20b') AS es_uno_de_los_del_31_08,
       left(cita_analizado, 160) AS cita_analizado,
       left(cita_candidato, 160) AS cita_candidato,
       id
FROM contradicciones
ORDER BY created_at, analizado;

-- Y, aparte, los análisis del par que NO trajeron ninguna contradicción (no
-- salen arriba porque no tienen filas que desplegar). Un cero también es dato.
SELECT a.created_at, a.analysis_type, a.document_name AS analizado,
       jsonb_array_length(coalesce(a.analysis->'discrepancies', '[]'::jsonb)) AS contradicciones,
       a.analysis IS NULL AS sin_jsonb, a.id
FROM public.analysis_results a
WHERE a.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  AND a.created_at >= '2026-08-27' AND a.created_at < '2026-09-02'
  AND (a.document_name LIKE 'NOR-11%' OR a.document_name LIKE 'CLI-13%')
ORDER BY a.created_at;
