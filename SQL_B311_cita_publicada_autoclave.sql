-- ============================================================================
-- B.311 · LA CITA PUBLICADA DE LA SEMBRADA A EN NOR-10 (`[98277f67]`), ENTERA — SÓLO LECTURA
-- ✅ EJECUTADA por el director el 02/10/2026 (corregido el 10/10/2026); resultado en claude/Estado_Del_MVP.md:10647-10648 (B.311). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA (arquitecto, 02/10/2026): la contradicción `[98277f67]`
-- («Autoridad para retirar autoclave de servicio tras fallo de c…») se PUBLICÓ
-- con su cita del lado nuevo pasando por el camino de cabeza y cola: 434
-- caracteres, de los que sólo se comprobaron el principio y el final. Esta
-- consulta saca las dos citas publicadas COMPLETAS, para buscar su medio en
-- NOR-10. Lo que significa cada resultado está escrito ANTES de mirar, en B.311.
--
-- ⚠️ LO QUE LA BASE GUARDA, Y LO QUE NO:
--   · Lo publicado está en `analysis->'discrepancies'[]`, con `topic`,
--     `newDocSays` (lado NOR-10), `existingDocSays` (lado CLI-12) y
--     `existingDocument`. La cita publicada es la del juez, entera (F-55).
--   · **El hash NO se guarda en lo publicado**: se calcula sobre las dos citas
--     (`hashCitationPair`, lib/analysis/llm-boundary.ts). Por eso se busca por
--     documento, pareja y tema. Si sale más de una fila, la de 434 caracteres
--     en `longitud_nuevo` es la del registro de las 13:17:49.
--   · Se lista todo el 02/10: también sale la publicación de las 09:02, que
--     según el arquitecto llevaba el mismo par de citas. Si las dos citas
--     coinciden entre filas, es el mismo par.
-- ============================================================================

WITH parametros AS (
  -- ═══════════════════════════════════════════════════════════════════════════
  -- ⬅️ SÓLO SE TOCAN ESTAS LÍNEAS. El día entero, en UTC.
  SELECT timestamptz '2026-10-02 00:00:00+00' AS desde,
         timestamptz '2026-10-03 00:00:00+00' AS hasta,
  -- ═══════════════════════════════════════════════════════════════════════════
         'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
)
SELECT
  ar.created_at                              AS guardado_utc,
  ar.analysis_type                           AS modo,
  ar.document_name                           AS analizado,
  d->>'existingDocument'                     AS candidato,
  d->>'topic'                                AS tema,
  length(d->>'newDocSays')                   AS longitud_nuevo,
  d->>'newDocSays'                           AS cita_nuevo,
  length(d->>'existingDocSays')              AS longitud_existente,
  d->>'existingDocSays'                      AS cita_existente,
  ar.id                                      AS analisis_id
FROM public.analysis_results ar, parametros p,
     jsonb_array_elements(
       CASE WHEN jsonb_typeof(ar.analysis->'discrepancies') = 'array' THEN ar.analysis->'discrepancies' ELSE '[]'::jsonb END
     ) AS d
WHERE ar.org_id = p.org
  AND ar.created_at >= p.desde
  AND ar.created_at <  p.hasta
  AND ar.document_name LIKE 'NOR-10%'
  AND d->>'existingDocument' LIKE 'CLI-12%'
  AND d->>'topic' ILIKE '%autoclave%'
ORDER BY ar.created_at;
