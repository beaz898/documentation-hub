-- ============================================================================
-- F-123 · FASE 1.2: QUÉ RÉGIMEN QUEDÓ GUARDADO EN CADA PAREJA DE LA PASADA DEL
-- 09/10/2026 A LAS 22:24:42 UTC — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada. Sólo nombres y cifras.
-- ✅ PROBADO ANTES DE ENTREGARLO (10/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): saca una fila por pareja con su régimen y los
-- caracteres de cada lado, deja fuera los análisis de otra hora y de otra
-- organización, y una pareja sin `presupuesto` sale con él a NULL.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 10/10/2026): la pasada cuyo sello es 2026-10-09
-- 22:24:42 UTC dio «corte_honesto | pareja_entera». Esta consulta saca, pareja
-- por pareja, el régimen y los caracteres de cada lado tal como se guardaron en
-- `analysis->'lecturaDeLasParejas'` (lib/analysis/types.ts, LecturaDeLaPareja).
-- Va también el documento analizado de la fila, para que no haya que suponerlo.
--
-- LA REGLA CON LA QUE LEERLA (lib/analysis/judge.ts:1283): `pareja_entera` si
-- analizado entero + candidato entero <= presupuesto (40.000). Una pareja es
-- SIEMPRE (analizado, candidato); dos candidatos de la misma pasada no forman
-- pareja entre sí.
--
-- ⚠️ CONTROL: `parejas` tiene que coincidir con `candidatos_juzgados`
-- (lecturaDeLasParejas va emparejada por posición con los juicios,
-- judge.ts:1094). Si no coinciden, la fila no se lee.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
pasada AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.document_id, ar.analysis_type, ar.analysis
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
    AND ar.created_at >= timestamptz '2026-10-09 22:24:42+00'
    AND ar.created_at <  timestamptz '2026-10-09 22:24:43+00'
)
SELECT to_char(p.created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS.US') || ' UTC' AS sello,
       p.document_name                                        AS analizado,
       p.analysis_type,
       jsonb_array_length(coalesce(p.analysis->'lecturaDeLasParejas', '[]'::jsonb)) AS parejas,
       jsonb_array_length(coalesce(p.analysis->'judgments', '[]'::jsonb))           AS candidatos_juzgados,
       d.name                                                 AS candidato,
       l->>'regimen'                                          AS regimen,
       (l->'analizado'->>'caracteres')::int                   AS analizado_caracteres,
       (l->'analizado'->>'mostrados')::int                    AS analizado_mostrados,
       (l->'candidato'->>'caracteres')::int                   AS candidato_caracteres,
       (l->'candidato'->>'mostrados')::int                    AS candidato_mostrados,
       (l->>'presupuesto')::int                               AS presupuesto
FROM pasada p
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(p.analysis->'lecturaDeLasParejas') = 'array'
       THEN p.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) AS l
LEFT JOIN public.documents d ON d.id::text = l->>'documentId'
ORDER BY p.created_at, candidato_caracteres DESC NULLS LAST;
