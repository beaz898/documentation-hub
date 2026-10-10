-- ============================================================================
-- B.333 · LAS ONCE CITAS ENTERAS DE LOS DESCARTES SIN BARRA — SÓLO LECTURA
-- ✅ EJECUTADA el 06/10/2026 (corregido el 10/10/2026); resultado usado en Puntos_Pendientes_Doclity.txt:8149-8150 (B.358). Sólo SELECT: no escribe nada.
-- ⚠️ LEE CONTENIDO DE DOCUMENTOS (cada cita ENTERA, en crudo): el resultado lo
--    mira el arquitecto y no se copia a ningún registro ni a ninguna ficha.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 06/10/2026): SQL_B332 sólo da los últimos 60
-- caracteres de cada cita, y con eso no se ve qué hizo el juez por dentro.
--
-- LA POBLACIÓN, la misma de SQL_B332: los lados de cita DESCARTADOS que
-- FALLARON (`verificada` = false) y que NO contienen «|». Allí dieron 42 lados.
-- Aquí sale UN RENGLÓN POR CITA DISTINTA: el arquitecto espera 11, y la suma de
-- la columna `lados` tiene que dar 42.
--
-- SI UNA MISMA CITA VARÍA ENTRE PASADAS (otro tema, otro lado, otro paso…), los
-- valores distintos van juntos en su celda, separados por « ‖ », para que siga
-- habiendo un renglón por cita y no se pierda ninguno.
--
-- DE DÓNDE SALE CADA COLUMNA (`analysis_results.analysis -> judgments[] ->
-- descartesPorCita[]`, lib/analysis/types.ts:161-178):
--   · tema: `tema` (types.ts:163-164), el `topic` de la contradicción o la
--     `description` del solapamiento;
--   · tipo: `tipo`; lado: el lado de la cita, que es el que falló;
--   · documento del lado: el analizado (`analysis_results.document_name`) para
--     la cita nueva, el candidato del juicio (`documentName`) para la existente;
--   · paso, pajar y longitud: los de ese lado;
--   · la cita: `citaNuevo` o `citaExistente`, ENTERA y en crudo.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
analisis AS (
  SELECT ar.id, ar.document_name, j
  FROM public.analysis_results ar, piloto,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j
  WHERE ar.org_id = piloto.org
),
lados AS (
  SELECT a.id AS analisis_id, d->>'tema' AS tema, d->>'tipo' AS tipo, 'nuevo' AS lado,
         a.document_name AS documento, d->>'citaNuevo' AS cita,
         (d->'nuevo'->>'verificada')::boolean AS verificada, d->'nuevo'->>'paso' AS paso,
         d->'nuevo'->>'pajar' AS pajar, (d->'nuevo'->>'longitud')::int AS longitud
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'descartesPorCita') = 'array' THEN a.j->'descartesPorCita' ELSE '[]'::jsonb END) d
  UNION ALL
  SELECT a.id, d->>'tema', d->>'tipo', 'existente',
         a.j->>'documentName', d->>'citaExistente',
         (d->'existente'->>'verificada')::boolean, d->'existente'->>'paso',
         d->'existente'->>'pajar', (d->'existente'->>'longitud')::int
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'descartesPorCita') = 'array' THEN a.j->'descartesPorCita' ELSE '[]'::jsonb END) d
),
poblacion AS (
  SELECT *
  FROM lados
  WHERE verificada = false
    AND strpos(coalesce(cita, ''), '|') = 0
)
SELECT
  string_agg(DISTINCT coalesce(tema, '(sin tema)'), ' ‖ ')        AS tema,
  string_agg(DISTINCT tipo, ' ‖ ')                               AS tipo,
  string_agg(DISTINCT lado, ' ‖ ')                               AS lado_que_fallo,
  string_agg(DISTINCT documento, ' ‖ ')                          AS documento_del_lado,
  string_agg(DISTINCT coalesce(paso, 'sin_paso'), ' ‖ ')         AS paso,
  string_agg(DISTINCT coalesce(pajar, 'sin_dato'), ' ‖ ')        AS pajar,
  string_agg(DISTINCT longitud::text, ' ‖ ')                     AS longitud,
  count(*)                                                       AS lados,
  count(DISTINCT analisis_id)                                    AS analisis,
  cita                                                           AS cita_entera
FROM poblacion
GROUP BY cita
ORDER BY count(*) DESC, cita;
