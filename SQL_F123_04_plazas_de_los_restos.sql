-- ============================================================================
-- F-123 · FASE 0.1: QUÉ PLAZAS SE HAN LLEVADO LOS RESTOS, Y SI ALGÚN PENDIENTE HA
-- SIDO CANDIDATO — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada. Sólo nombres, fechas y
-- cifras; ni un carácter del texto.
-- ✅ PROBADO ANTES DE ENTREGARLO (10/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): cuenta las plazas por documento con su marca, saca
-- las pasadas donde un resto tuvo plaza con el régimen de su pareja, detecta
-- un candidato fuera del fondo, marca como `sin_fila` una plaza de un documento
-- ya borrado, deja fuera otra organización, y el control sale FALLA cuando un
-- análisis tiene distinto número de lecturas que de juicios.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 10/10/2026), y en qué bloque:
--   a) CUÁNTAS PLAZAS SE HAN LLEVADO LOS RESTOS, Y EN QUÉ PASADAS → bloque 1
--      (por documento, marca `resto`) y bloque 2 (cada pasada donde un resto tuvo
--      plaza, con el régimen de su pareja y los caracteres del analizado).
--   b) SI ALGUNA VEZ FUE CANDIDATO UN DOCUMENTO `pendiente` → bloque 3, por dos
--      vías: la SEÑAL FUERTE es `termometro.candidatos_fuera_del_fondo` (desde el
--      22/09: afín que NO es del corpus por su fila ni de la tanda; es lo que
--      B.374 produciría); la SEÑAL DÉBIL es una plaza de un documento cuyo
--      estado ACTUAL es `pendiente` (puede haber sido de la tanda, legítimo, o
--      haber cambiado de estado después).
--   c) CUÁNTAS PLAZAS CONSIGUIERON CLI-13 Y CLI-12 → bloque 1, sus filas.
--
-- QUÉ ES «PLAZA»: haber llegado al JUEZ, o sea, ser uno de los que el rerank
-- dejó pasar. Cada uno deja un juicio en `analysis->'judgments'` (pipeline.ts:993).
--
-- ⚠️ LO QUE NO SE PUEDE CONTAR: CUÁNTAS VECES UN DOCUMENTO FUE AFÍN. La base sólo
-- guarda CUÁNTOS afines hubo por análisis (`coberturaDeCandidatos.afines`,
-- pipeline.ts:1054), no CUÁLES; la lista de afines vive sólo en el log. La única
-- excepción son los afines fuera del fondo, que el termómetro guarda por id
-- (bloque 3). Por eso el bloque 2 da, por pasada, el número de afines junto a
-- los comparados.
--
-- LA MARCA de cada documento es la de HOY (los mismos criterios que
-- SQL_F123_01): `resto`, `corpus_con_trozos`, `corpus_sin_trozos_fuera_de_criterio`,
-- `fuera_del_corpus`, y `sin_fila` para un id que ya no está en `documents`
-- (borrado: NOR-11 y NOR-10 viejos, B.367).
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   · por análisis, el número de `lecturaDeLasParejas` tiene que ser igual al de
--     `judgments` cuando las dos existen (van emparejadas por posición,
--     judge.ts:1094). Cuenta los que NO cuadran: tiene que ser 0;
--   · por análisis con cobertura, `coberturaDeCandidatos.comparados` tiene que
--     ser igual al número de `judgments`. Cuenta los que NO cuadran: 0;
--   · y la suma de plazas del bloque 1 tiene que ser igual al total de juicios.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type, ar.analysis
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
),
docs AS (
  SELECT d.id::text AS id, d.name,
         CASE
           WHEN d.analysis_status = 'analizado'
                AND (SELECT count(*) FROM public.document_chunks c
                      WHERE c.document_id = d.id AND c.generation = d.active_generation) > 0
             THEN 'corpus_con_trozos'
           WHEN d.analysis_status = 'analizado' AND d.extractor_version IS NULL
                AND d.chunk_count BETWEEN 1 AND 6
                AND (SELECT count(*) FROM public.document_chunks c
                      WHERE c.document_id = d.id AND c.generation = d.active_generation) = 0
             THEN 'resto'
           WHEN d.analysis_status = 'analizado' THEN 'corpus_sin_trozos_fuera_de_criterio'
           ELSE 'fuera_del_corpus'
         END AS marca,
         d.analysis_status
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
),
plazas AS (
  SELECT a.id AS analisis_id, a.created_at, a.document_name AS analizado, a.analysis_type,
         j->>'documentId' AS doc,
         (SELECT l FROM jsonb_array_elements(
                  CASE WHEN jsonb_typeof(a.analysis->'lecturaDeLasParejas') = 'array'
                       THEN a.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
           WHERE l->>'documentId' = j->>'documentId' LIMIT 1) AS lectura,
         (a.analysis->'coberturaDeCandidatos'->>'afines')::int AS afines,
         (a.analysis->'coberturaDeCandidatos'->>'comparados')::int AS comparados
  FROM analisis a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(a.analysis->'judgments') = 'array' THEN a.analysis->'judgments' ELSE '[]'::jsonb END) j
),
plazas_marcadas AS (
  SELECT p.*, coalesce(d.name, '(sin fila) ' || p.doc) AS nombre, coalesce(d.marca, 'sin_fila') AS marca,
         d.analysis_status AS estado_hoy
  FROM plazas p LEFT JOIN docs d ON d.id = p.doc
),
fuera_del_fondo AS (
  SELECT a.created_at, a.document_name AS analizado, a.analysis_type, f.value AS doc
  FROM analisis a
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(a.analysis->'termometro'->'candidatos_fuera_del_fondo') = 'array'
         THEN a.analysis->'termometro'->'candidatos_fuera_del_fondo' ELSE '[]'::jsonb END) f
),
control AS (
  SELECT 'análisis con lecturas y juicios que NO cuadran (tiene que ser 0)' AS medida,
         count(*) FILTER (WHERE jsonb_typeof(analysis->'lecturaDeLasParejas') = 'array'
                            AND jsonb_typeof(analysis->'judgments') = 'array'
                            AND jsonb_array_length(analysis->'lecturaDeLasParejas')
                                <> jsonb_array_length(analysis->'judgments'))::bigint AS valor,
         0::bigint AS esperado
  FROM analisis
  UNION ALL
  SELECT 'análisis con comparados distinto del número de juicios (tiene que ser 0)',
         count(*) FILTER (WHERE (analysis->'coberturaDeCandidatos'->>'comparados') IS NOT NULL
                            AND jsonb_typeof(analysis->'judgments') = 'array'
                            AND (analysis->'coberturaDeCandidatos'->>'comparados')::int
                                <> jsonb_array_length(analysis->'judgments'))::bigint,
         0::bigint
  FROM analisis
  UNION ALL
  SELECT 'plazas del bloque 1 menos juicios totales (tiene que ser 0)',
         (SELECT count(*) FROM plazas_marcadas) - (SELECT count(*) FROM plazas), 0
)
SELECT bloque, marca, nombre, plazas, analisis_distintos, en_rapido, en_exhaustivo,
       fecha, analizado, tipo, regimen, analizado_caracteres, analizado_mostrados, afines, comparados
FROM (
  -- 0 · CONTROL
  SELECT '0 · control' AS bloque, CASE WHEN valor = esperado THEN 'OK' ELSE 'FALLA' END AS marca,
         medida || ': ' || valor AS nombre,
         NULL::bigint AS plazas, NULL::bigint AS analisis_distintos, NULL::bigint AS en_rapido, NULL::bigint AS en_exhaustivo,
         NULL::text AS fecha, NULL::text AS analizado, NULL::text AS tipo, NULL::text AS regimen,
         NULL::int AS analizado_caracteres, NULL::int AS analizado_mostrados, NULL::int AS afines, NULL::int AS comparados,
         0 AS orden, NULL::timestamptz AS cuando
  FROM control
  UNION ALL
  -- 1 · PLAZAS POR DOCUMENTO, con su marca de hoy. Los restos y los sin_fila primero.
  SELECT '1 · plazas por documento', marca, nombre,
         count(*), count(DISTINCT analisis_id),
         count(*) FILTER (WHERE analysis_type = 'quick'), count(*) FILTER (WHERE analysis_type = 'exhaustive'),
         NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
         CASE marca WHEN 'resto' THEN 1 WHEN 'sin_fila' THEN 2 WHEN 'fuera_del_corpus' THEN 3 ELSE 4 END,
         NULL
  FROM plazas_marcadas
  GROUP BY marca, nombre
  UNION ALL
  -- 2 · CADA PASADA DONDE UN RESTO TUVO PLAZA: el régimen de esa pareja y cuánto
  --     se leyó del analizado. Antes del 29/09 no hay lectura guardada (NULL).
  SELECT '2 · pasadas con un resto en el juez', marca, nombre, NULL, NULL, NULL, NULL,
         to_char(created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC', analizado, analysis_type,
         lectura->>'regimen', (lectura->'analizado'->>'caracteres')::int, (lectura->'analizado'->>'mostrados')::int,
         afines, comparados, 5, created_at
  FROM plazas_marcadas
  WHERE marca = 'resto'
  UNION ALL
  -- 3a · SEÑAL FUERTE de B.374: afines guardados por el termómetro como FUERA DEL FONDO.
  SELECT '3a · afín fuera del fondo (señal fuerte)', coalesce(d.marca, 'sin_fila'),
         coalesce(d.name, '(sin fila) ' || f.doc) || ' · estado hoy: ' || coalesce(d.analysis_status, '—'),
         NULL, NULL, NULL, NULL,
         to_char(f.created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC', f.analizado, f.analysis_type,
         NULL, NULL, NULL, NULL, NULL, 6, f.created_at
  FROM fuera_del_fondo f LEFT JOIN docs d ON d.id = f.doc
  UNION ALL
  -- 3b · SEÑAL DÉBIL: plaza de un documento cuyo estado HOY es pendiente.
  SELECT '3b · plaza de un documento pendiente hoy (señal débil)', marca, nombre, NULL, NULL, NULL, NULL,
         to_char(created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC', analizado, analysis_type,
         lectura->>'regimen', NULL, NULL, afines, comparados, 7, created_at
  FROM plazas_marcadas
  WHERE estado_hoy = 'pendiente'
) t
ORDER BY bloque, orden, plazas DESC NULLS LAST, cuando, nombre;
