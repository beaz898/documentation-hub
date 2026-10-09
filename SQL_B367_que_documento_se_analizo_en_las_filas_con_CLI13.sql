-- ============================================================================
-- B.367 · LAS FILAS QUE QUEDAN CON PAREJA CLI-13: ¿QUÉ DOCUMENTO SE ANALIZÓ EN
-- CADA UNA? — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada. Sólo nombres de
-- documento, fechas y recuentos.
-- ✅ PROBADO ANTES DE ENTREGARLO (10/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): salen las filas con pareja CLI-13 y sólo ésas, la de
-- documento borrado sale con documento_existe = false, y quedan fuera otra
-- organización y un juicio sin CLI-13. CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 10/10/2026): tras borrar NOR-11 y NOR-10, quedan
-- cuatro filas con pareja CLI-13 (29/09 13:14, 30/09 12:56, 30/09 13:02 y 09/10
-- 22:20). ¿De qué documento es cada una?
--
-- DÓNDE VIVE EL DOCUMENTO ANALIZADO: en dos COLUMNAS de analysis_results, no en
-- el jsonb:
--   · document_name: el nombre, siempre (FilaDeAnalisis,
--     lib/documents/analisis-del-documento.ts:28-32);
--   · document_id: el id, que puede ser NULL. Los análisis anteriores al
--     propietario (F-101) nacieron sin él, y el BORRADO SÓLO ALCANZA LAS FILAS
--     CON document_id (criterioDeAnalisisDelDocumento, :49-54, usado en
--     lib/delete-document.ts:167-170). Una fila de NOR-11 con document_id NULL
--     SOBREVIVE al borrado a propósito («no se intenta adivinarlos por nombre»).
--     Por eso `document_id` y `documento_existe` van al lado del nombre: una fila
--     de NOR-11 que siga aquí no tumba el borrado si su document_id es NULL.
--
-- ⚠️ CONTROL: tienen que salir 4 filas. Si salen más o menos, las cuatro horas
-- que se dieron no son todas las que quedan.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
)
SELECT to_char(ar.created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC'            AS hora_utc,
       to_char(ar.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid' AS hora_madrid,
       ar.document_name,
       ar.document_id,
       (d.id IS NOT NULL)                                                                  AS documento_existe,
       ar.analysis_type,
       j->>'documentName'                                                                  AS pareja,
       jsonb_array_length(coalesce(j->'contradictions', '[]'::jsonb))                      AS contradicciones,
       coalesce(jsonb_typeof(j->'discarded') = 'object', false)                            AS trae_discarded
FROM public.analysis_results ar
CROSS JOIN piloto
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j
LEFT JOIN public.documents d ON d.id = ar.document_id
WHERE ar.org_id = piloto.org
  AND j->>'documentName' ILIKE 'CLI-13%'
ORDER BY ar.created_at;
