-- ============================================================================
-- ESCALÓN 1 (B.295) · LOS CUATRO ANÁLISIS DEL 29/09, 13:14-13:16 UTC — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (29/09/2026). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA, y QUÉ NO:
--   · SÍ: si el aparato del commit 1 (`lecturaDeLasParejas`) se rellena en
--     producción, y con qué régimen; y lo que el resultado guarda de los
--     descartes, para contrastar el recuento de la ficha del verificador (B.299)
--     con la base y no sólo con el log.
--   · NO: si a esos análisis los sirvió el despliegue de las 15:12 de Madrid
--     (13:12 UTC, `d65a0f52`: paginación y D-3). Con el interruptor APAGADO, ni la
--     paginación ni D-3 dejan rastro en el resultado. Y `lecturaDeLasParejas`
--     existe desde el commit 1 (`34d67fb5`), desplegado esa misma mañana: su
--     presencia no distingue un despliegue del otro. Eso lo dice Vercel —la hora
--     «Ready» del despliegue de `d65a0f52`, frente a la de cada análisis—, no la
--     base.
--
-- LOS DESCARTES QUE SE GUARDAN (lib/analysis/judge.ts:509 y :557; los agrega
-- synthesize.ts:301-331 en `discardedFindings`):
--   · `citaNoVerificable` suma CONTRADICCIONES y SOLAPAMIENTOS en un mismo
--     contador. Por eso P-7 se mide sobre los dos juntos; sólo sobre las
--     contradicciones, NO CONSTA en la base (el reparto sólo está en el log).
--   · `verificador.hallazgos_entrantes` son las contradicciones que PASARON la
--     comprobación de citas y entraron en la cascada; `verificador.descartados`,
--     las que la cascada tiró después (p. ej. `mismo_dato_sin_oposicion`).
-- ============================================================================

SELECT
  ar.created_at                                                   AS fecha_utc,
  ar.document_name                                                AS analizado,
  ar.analysis_type                                                AS modo,
  ar.analysis ? 'lecturaDeLasParejas'                             AS con_lectura_de_las_parejas,
  jsonb_array_length(coalesce(ar.analysis->'lecturaDeLasParejas', '[]'::jsonb)) AS parejas_leidas,
  (SELECT string_agg(coalesce(
            (SELECT j->>'documentName' FROM jsonb_array_elements(coalesce(ar.analysis->'judgments', '[]'::jsonb)) AS j
              WHERE j->>'documentId' = l->>'documentId' LIMIT 1), l->>'documentId')
          || ': ' || (l->>'regimen'), ' · ')
     FROM jsonb_array_elements(coalesce(ar.analysis->'lecturaDeLasParejas', '[]'::jsonb)) AS l) AS regimenes,
  ar.analysis ? 'presupuestoDelCandidato'                         AS con_presupuesto_del_candidato,
  ar.analysis ? 'textoAnalizado'                                  AS con_texto_analizado,
  -- Los descartes, tal como se guardan
  ar.analysis->'discardedFindings'                                AS descartes,
  (ar.analysis->'discardedFindings'->>'citaNoVerificable')::int   AS cita_no_verificable,
  (ar.pipeline_counters->>'verificador.hallazgos_entrantes')::int AS contradicciones_que_pasaron_las_citas,
  (ar.pipeline_counters->>'verificador.descartados')::int         AS descartadas_por_la_cascada,
  jsonb_array_length(coalesce(ar.analysis->'discrepancies', '[]'::jsonb)) AS contradicciones_publicadas
FROM public.analysis_results ar
WHERE ar.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
  AND ar.created_at >= '2026-09-29 13:10:00+00'
  AND ar.created_at <  '2026-09-29 13:20:00+00'
ORDER BY ar.created_at;
