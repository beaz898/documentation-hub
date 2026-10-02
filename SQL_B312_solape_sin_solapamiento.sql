-- ============================================================================
-- B.312 · PAREJAS CON SOLAPE Y SIN UN SOLO SOLAPAMIENTO PUBLICADO — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA (arquitecto, 02/10/2026): en los análisis ya guardados, cuántas
-- parejas tienen un porcentaje de solape mayor que cero y NINGUNA línea de
-- solapamiento publicada. Es la cara visible de B.312: «le decimos que dos
-- documentos se solapan y no le enseñamos ni un punto concreto». Para el
-- usuario, eso se lee como «no hemos encontrado nada», y es falso.
--
-- ⚠️ LO QUE LA BASE GUARDA, Y LO QUE NO (lectura de Code, 02/10):
--   · Por pareja, en `analysis->'judgments'[]`: `overlapPercent` (el número del
--     propio juez, lib/analysis/judge.ts, mapeo de la respuesta), `verdict`, y
--     `discarded.citaNoVerificable`.
--   · Lo publicado, en `analysis->'overlaps'[]`, con `existingDocumentId` (desde
--     F-86) o sólo `existingDocument` (el nombre) en las filas anteriores.
--   · ⚠️ NO se guarda cuántos solapamientos EMITIÓ el juez antes de la
--     comprobación de citas: eso sólo está en el log («RAW … N solapamientos»).
--     Así que esta consulta NO separa «emitió y se le murieron» de «no emitió
--     ninguno». Da una COTA SUPERIOR del daño de B.312, no su medida.
--   · Lo que acerca la cota: `citaNoVerificable` > 0 dice que en esa pareja
--     murió alguna cita. Pero ese contador junta contradicciones y
--     solapamientos, así que tampoco atribuye la muerte a un solapamiento.
--
-- CÓMO SE LEE: una fila por veredicto del juez y por si en la pareja murió alguna
-- cita. `solape_sin_linea` es lo que pide el arquitecto. La fila más
-- sospechosa es la de un veredicto de solape (`reformulacion`,
-- `solapamiento_parcial`, `duplicado_exacto`) con citas muertas: el juez dijo
-- que se solapaban, y algo suyo no pasó la comprobación.
--
-- A PRUEBA DE FALLO:
--   · `parejas` cuenta TODAS las parejas juzgadas, para que el cociente se vea.
--   · `analisis_sin_judgments` (en todas las filas, el mismo número) dice
--     cuántos análisis de la organización no guardan juicios y quedan fuera.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org
),
parejas AS (
  SELECT a.created_at,
         a.document_name                                         AS analizado,
         j->>'documentName'                                      AS candidato,
         coalesce((j->>'overlapPercent')::int, 0)                AS solape,
         coalesce(j->>'verdict', '(sin veredicto)')              AS veredicto,
         coalesce((j->'discarded'->>'citaNoVerificable')::int, 0) AS citas_muertas,
         EXISTS (
           SELECT 1
           FROM jsonb_array_elements(coalesce(a.analysis->'overlaps', '[]'::jsonb)) AS o
           WHERE (o->>'existingDocumentId' IS NOT NULL AND o->>'existingDocumentId' = j->>'documentId')
              OR (o->>'existingDocumentId' IS NULL AND o->>'existingDocument' = j->>'documentName')
         )                                                       AS publicado
  FROM analisis a, jsonb_array_elements(a.analysis->'judgments') AS j
  WHERE jsonb_typeof(a.analysis->'judgments') = 'array'
)
SELECT
  veredicto,
  (citas_muertas > 0)                                            AS murio_alguna_cita,
  count(*)                                                       AS parejas,
  count(*) FILTER (WHERE solape > 0)                             AS con_solape,
  count(*) FILTER (WHERE solape > 0 AND NOT publicado)           AS solape_sin_linea,
  min(created_at) FILTER (WHERE solape > 0 AND NOT publicado)    AS primera,
  max(created_at) FILTER (WHERE solape > 0 AND NOT publicado)    AS ultima,
  string_agg(analizado || ' → ' || candidato || ' (' || solape || '%)', ' · ' ORDER BY solape DESC)
    FILTER (WHERE solape > 0 AND NOT publicado)                  AS ejemplos,
  (SELECT count(*) FROM analisis
    WHERE jsonb_typeof(analysis->'judgments') IS DISTINCT FROM 'array') AS analisis_sin_judgments
FROM parejas
GROUP BY veredicto, (citas_muertas > 0)
ORDER BY solape_sin_linea DESC, veredicto;
