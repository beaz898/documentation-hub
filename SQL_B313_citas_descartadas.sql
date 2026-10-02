-- ============================================================================
-- B.313 · LOS HALLAZGOS DESCARTADOS POR CITA NO VERIFICABLE, CON SUS DOS CITAS — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA: en qué punto una cita que viene bien pasa a estar mal. Saca, de
-- los análisis guardados, cada hallazgo que la comprobación de citas descartó,
-- con las dos citas COMPLETAS tal como las escribió el juez, el lado que falló,
-- el paso en que se rindió la búsqueda de cada lado y su pareja.
--
-- ⚠️ ES EL LECTOR NOMBRADO de `descartesPorCita` (decisión del arquitecto,
-- 02/10/2026, B.313): esas citas no las pinta ninguna pantalla, y este fichero
-- es lo que hace que no sean una copia sin lector. La decisión se vuelve a leer
-- el día que B.313 se cierre: si nadie confirma que se queda, se quita.
--
-- LO QUE HAY, Y LO QUE NO:
--   · Sólo existe en los análisis hechos DESPUÉS del despliegue del commit que
--     guarda lo descartado. Los anteriores no tienen `descartesPorCita`: no salen,
--     y eso no es un cero.
--   · Hasta 10 por pareja. `omitidos_en_la_pareja` > 0 es un HALLAZGO: el juez
--     descartó más de diez en una sola pareja.
--   · Sólo los descartes por «cita no verificable». Los de narración en la cita
--     y los de cita de línea de contexto no se guardan aquí.
--   · `analizado_id` puede venir vacío: en el camino del chat el documento no
--     existe todavía al analizar, y la fila lleva sólo `storage_path` (F-101).
--     No es un fallo: para eso sale `analizado_ruta`.
--
-- CÓMO SE LEE: una fila por hallazgo descartado. `cita_nuevo` es la que el juez
-- asignó al documento analizado y `cita_existente` la que asignó al candidato.
-- En el lado que falló, `paso_*` dice dónde se rindió la búsqueda (no por qué);
-- en el que pasó, por qué vía pasó.
-- ============================================================================

WITH parametros AS (
  -- ═══════════════════════════════════════════════════════════════════════════
  -- ⬅️ SÓLO SE TOCAN ESTAS LÍNEAS. La ventana, en UTC: desde el despliegue.
  SELECT timestamptz '2026-10-02 00:00:00+00' AS desde,
  -- ═══════════════════════════════════════════════════════════════════════════
         'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
juicios AS (
  SELECT ar.id AS analisis_id, ar.created_at, ar.document_name AS analizado,
         ar.document_id::text AS analizado_id, ar.storage_path AS analizado_ruta,
         ar.analysis_type AS modo, j
  FROM public.analysis_results ar, parametros p,
       jsonb_array_elements(
         CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END
       ) AS j
  WHERE ar.org_id = p.org
    AND ar.created_at >= p.desde
)
SELECT
  ju.created_at                                         AS guardado_utc,
  ju.modo,
  ju.analizado,
  ju.analizado_id,
  ju.analizado_ruta,
  ju.j->>'documentName'                                 AS candidato,
  ju.j->>'documentId'                                   AS candidato_id,
  d->>'tipo'                                            AS tipo,
  d->>'hash'                                            AS hash,
  d->>'tema'                                            AS tema,
  d->>'ladoFallido'                                     AS lado_que_fallo,
  d->>'citaNuevo'                                       AS cita_nuevo,
  (d->'nuevo'->>'longitud')::int                        AS longitud_nuevo,
  (d->'nuevo'->>'verificada')::boolean                  AS paso_nuevo_verificada,
  d->'nuevo'->>'paso'                                   AS paso_nuevo,
  d->'nuevo'->>'pajar'                                  AS pajar_nuevo,
  d->>'citaExistente'                                   AS cita_existente,
  (d->'existente'->>'longitud')::int                    AS longitud_existente,
  (d->'existente'->>'verificada')::boolean              AS paso_existente_verificada,
  d->'existente'->>'paso'                               AS paso_existente,
  d->'existente'->>'pajar'                              AS pajar_existente,
  coalesce((ju.j->>'descartesPorCitaOmitidos')::int, 0) AS omitidos_en_la_pareja,
  ju.analisis_id
FROM juicios ju,
     jsonb_array_elements(
       CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END
     ) AS d
ORDER BY ju.created_at DESC, candidato, tipo, hash;
