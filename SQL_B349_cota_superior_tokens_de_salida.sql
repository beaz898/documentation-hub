-- ============================================================================
-- B.349 · LA COTA SUPERIOR DE LOS TOKENS DE SALIDA DEL JUEZ — SÓLO LECTURA
-- ✅ EJECUTADA por el director antes y después de 568a77ab (la primera, el 07/10/2026; corregido el 10/10/2026); resultado en Puntos_Pendientes_Doclity.txt:8205-8208 (B.360). Sólo SELECT: no escribe nada.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta, copiado de SQL_F120_P3_rerank_a_cero.sql (convenio del      │
-- │ 05/10/2026). No se mira ninguna otra.                                    │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 07/10/2026): antes de subir el techo de solapamientos
-- del prompt del juez de 5 a 10 (lib/analysis/judge.ts:840), ¿está alguna llamada
-- del juez cerca de su techo de tokens de salida, maxOutputTokens: 4096
-- (judge.ts:858)? Si una respuesta se corta, el JSON se repara en silencio
-- (B.349) y la medición de después no se podría interpretar.
--
-- POR QUÉ SIRVE AUNQUE NO HAYA DATO POR LLAMADA: llm_usage guarda los tokens de
-- salida SUMADOS de todas las llamadas de un análisis, una fila por modelo
-- (persistLLMUsage, lib/observability/record-usage.ts:28-58). Ninguna llamada
-- suelta puede tener más tokens que la suma de su análisis: LA PARTE NUNCA ES
-- MAYOR QUE EL TOTAL. Así que si la suma de un análisis está por debajo de 4.096,
-- ninguna llamada del juez de ese análisis pudo alcanzar el techo.
--
-- ⚠️ ES UNA PRUEBA DE UNA SOLA DIRECCIÓN: sirve para DESCARTAR el riesgo, no para
-- confirmarlo.
--   · SI `maximo` SALE POR DEBAJO DE 4.096: el riesgo QUEDA DESCARTADO para estos
--     análisis — ninguna llamada pudo cortarse por tokens.
--   · SI SALE POR ENCIMA: NO CONCLUYE NADA. La suma junta al juez (una llamada por
--     pareja, hasta 6) con el rerank, el verificador y la síntesis, todos Haiku, y
--     un total alto no dice qué llamada lo hizo. Entonces hay que instrumentar
--     (leer stop_reason, B.356).
--   · `pasan_de_3000` dice lo mismo con más margen: una fila por debajo de 3.000
--     garantiza que ninguna llamada de ese análisis pasó de 3.000.
--
-- SUS LÍMITES:
--   1. La fila NO lleva el id del análisis: sólo organización y hora. No se puede
--      atar una fila a un análisis concreto de analysis_results sin emparejar
--      por hora.
--   2. El endpoint del examen también escribe operation = 'analyze_quick'
--      (app/api/admin/examen/analizar.ts:118), así que puede haber filas que no
--      sean análisis lanzados desde la interfaz. Para esta pregunta no estorba
--      —también son llamadas del juez—, pero el recuento no es «análisis del
--      director».
--   3. La escritura es fire-and-forget: si falla, la fila no existe y sólo queda
--      un aviso (record-usage.ts:62-77). Un análisis cuya fila se perdió no está
--      aquí. La columna `analisis_rapidos_guardados` da el otro lado para
--      compararlo; no tienen por qué coincidir exactos (el límite 2, y los
--      análisis que no llegan a guardarse), pero una diferencia grande avisa.
--
-- ⚠️ LA COLUMNA DE CONTROL `sin_output_tokens` TIENE QUE DAR 0. Cuenta las filas
-- con output_tokens NULL. El esquema la declara NOT NULL DEFAULT 0
-- (supabase-llm-usage.sql), así que debería ser 0 por construcción; SI NO ES 0,
-- EL RECUENTO NO VALE. Y por eso va a su lado `con_output_tokens_cero`: un 0 es
-- lo que dejaría el DEFAULT si alguien no escribiera la columna. persistLLMUsage
-- se salta las filas con TODOS los tokens a cero (record-usage.ts:43-44), así que
-- una fila con salida 0 sería rara y hay que mirarla antes de creer el máximo.
--
-- Sólo cifras: ni texto de documentos ni de respuestas.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
filas AS (
  SELECT u.output_tokens
  FROM public.llm_usage u, piloto
  WHERE u.org_id = piloto.org::uuid
    AND u.operation = 'analyze_quick'
    AND u.model ILIKE '%haiku%'
    AND u.created_at >= timestamptz '2026-10-02 00:00:00+02'
),
guardados AS (
  SELECT count(*) AS n
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
    AND ar.analysis_type = 'quick'
    AND ar.created_at >= timestamptz '2026-10-02 00:00:00+02'
)
SELECT count(*)                                                                    AS filas,
       count(*) FILTER (WHERE output_tokens IS NULL)                               AS sin_output_tokens,
       count(*) FILTER (WHERE output_tokens = 0)                                   AS con_output_tokens_cero,
       min(output_tokens)                                                          AS minimo,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY output_tokens)                  AS mediana,
       percentile_cont(0.9) WITHIN GROUP (ORDER BY output_tokens)                  AS percentil_90,
       max(output_tokens)                                                          AS maximo,
       count(*) FILTER (WHERE output_tokens > 4096)                                AS pasan_de_4096,
       count(*) FILTER (WHERE output_tokens > 3000)                                AS pasan_de_3000,
       (SELECT n FROM guardados)                                                   AS analisis_rapidos_guardados
FROM filas;
