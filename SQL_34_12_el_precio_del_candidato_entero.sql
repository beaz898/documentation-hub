-- ============================================================================
-- SQL_34_12 · EL PRECIO DEL CANDIDATO ENTERO EN EL EXHAUSTIVO (F-118, 28/09/2026) — SÓLO LECTURA (05/11/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada. La ejecuta el director; Code no ejecuta
-- consultas.
--
-- ⚠️⚠️ EL ID ES EL VIEJO A PROPÓSITO, como en SQL_SEG_02: a9625e93-af2a-4416-a465-5c2fa2a25bdf es la ORGANIZACIÓN DEL
-- PILOTO, purgada el 25/10/2026; las filas de llm_usage que sobrevivieron a la purga (543 el 26/10) llevan este id. Aquí
-- significa ORG_DEL_PILOTO. No se resuelve por usuario: la organización de hoy es otra y no tiene esas filas.
--
-- PARA QUÉ (arquitecto, 05/11): el 28/09, F-118 corrió el exhaustivo sobre NOR-11 ↔ CLI-13 con el presupuesto por
-- candidato de siempre (3.000 caracteres, por la mañana) y con el candidato ENTERO (ANALYSIS_EXHAUSTIVE_BUDGET_CHARS =
-- 14.676 en el worker, de 13:20 a 13:26 hora de Madrid; claude/Estado_Del_MVP.md:7646-7652). Con 3.000 salió una
-- trampa por dirección; entero, dos y tres. Antes de decidir nada sobre ese presupuesto hace falta su PRECIO, y el
-- archivo de F-118 no guardó ni coste ni tokens. Esta consulta los saca de llm_usage, si las filas llegan a esa fecha.
--
-- LO QUE PUEDE Y LO QUE NO (leído en el código):
--   · llm_usage guarda, por fila: hora, operación, modelo, tokens (entrada, salida, escritura y lectura de caché),
--     coste en dólares y créditos (supabase-llm-usage.sql:9-37). NO guarda id de análisis ni de trabajo, ni latencia.
--   · El worker escribe las filas de un exhaustivo AL TERMINAR, una por modelo y en un solo INSERT
--     (worker/src/index.ts:144; lib/observability/record-usage.ts:42-64), así que comparten la hora: UNA hora =
--     UN análisis, y así se agrupan aquí. (Dos análisis que acabaran en el mismo instante se sumarían; la salida
--     enseña cuántas filas lleva cada grupo para verlo.)
--   · ⚠️ LA DURACIÓN NO SE PUEDE MEDIR CON ESTA TABLA: sólo hay la hora del final, no la del comienzo, y analysis_jobs
--     se borró con la purga. La salida lo dice en una fila de control, para que nadie la deduzca de la distancia
--     entre dos análisis.
--   · Que la ventana de 13:20-13:26 sea la de 14.676 sólo consta en el archivo (B.280), no en las filas.
--
-- QUÉ SACA (una sola consulta: el editor de Supabase sólo enseña la última), en este orden:
--   0 · control: el id leído; cuántas filas tiene la organización y de qué fecha a qué fecha (hora de Madrid);
--       si alguna llega al 28/09/2026; y la duración, declarada no medible.
--   1 · por análisis: cada grupo de filas del 28/09 de un análisis rápido o exhaustivo, con su hora, su ventana, sus
--       modelos, sus filas, sus tokens y su coste.
--   2 · por ventana: los exhaustivos de cada ventana —antes de las 13:20 (3.000), de 13:20 a 13:26 (14.676) y
--       después—, con cuántos, su coste total y su coste medio.
-- ============================================================================

WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org_del_piloto),   -- ← ORG_DEL_PILOTO: EL ID VIEJO, A PROPÓSITO
filas AS (
  SELECT t.*, (t.created_at AT TIME ZONE 'Europe/Madrid') AS madrid
  FROM public.llm_usage t, p
  WHERE t.org_id::text = p.org_del_piloto
),
del_dia AS (   -- las del 28/09/2026 en hora de Madrid, de los dos análisis que interesan
  SELECT f.*,
         CASE WHEN f.madrid < timestamp '2026-09-28 13:20:00' THEN '1 · antes de las 13:20 (presupuesto 3.000)'
              WHEN f.madrid < timestamp '2026-09-28 13:27:00' THEN '2 · de 13:20 a 13:26 (presupuesto 14.676)'
              ELSE '3 · después de las 13:26 (presupuesto 3.000)' END AS ventana
  FROM filas f
  WHERE f.madrid >= timestamp '2026-09-28 00:00:00' AND f.madrid < timestamp '2026-09-29 00:00:00'
    AND f.operation IN ('analyze_quick', 'analyze_exhaustive')
),
analisis AS (   -- un análisis = las filas que comparten hora y operación (un solo INSERT al terminar)
  SELECT d.created_at, d.madrid, d.operation, d.ventana,
         count(*) AS n_filas,
         string_agg(d.model, ' + ' ORDER BY d.model) AS modelos,
         sum(d.input_tokens) AS entrada, sum(d.output_tokens) AS salida,
         sum(d.cache_write_tokens) AS cache_escritura, sum(d.cache_read_tokens) AS cache_lectura,
         sum(d.cost_usd) AS coste, max(d.credits_charged) AS creditos
  FROM del_dia d
  GROUP BY d.created_at, d.madrid, d.operation, d.ventana
),
salida AS (
  SELECT '0 · control' AS bloque, 1 AS o1, 'id leído (organización del piloto, el viejo): ' || p.org_del_piloto AS linea FROM p
  UNION ALL
  SELECT '0 · control', 2,
         'filas de la organización en llm_usage: ' || count(*) ||
         CASE WHEN count(*) = 0 THEN ' — ⚠️ NINGUNA: el id no lee nada y todo lo de abajo está vacío'
              ELSE ' · de ' || to_char(min(madrid), 'DD/MM/YYYY HH24:MI') || ' a ' || to_char(max(madrid), 'DD/MM/YYYY HH24:MI') || ' (hora de Madrid)' END
  FROM filas
  UNION ALL
  SELECT '0 · control', 3,
         CASE WHEN EXISTS (SELECT 1 FROM filas WHERE madrid >= timestamp '2026-09-28 00:00:00' AND madrid < timestamp '2026-09-29 00:00:00')
              THEN '¿llegan al 28/09/2026? SÍ: ' || (SELECT count(*) FROM filas WHERE madrid >= timestamp '2026-09-28 00:00:00' AND madrid < timestamp '2026-09-29 00:00:00') || ' filas ese día, de cualquier operación'
              ELSE '¿llegan al 28/09/2026? NO: ninguna fila ese día. EL PRECIO DE F-118 NO SE PUEDE SACAR DE AQUÍ' END
  UNION ALL
  SELECT '0 · control', 4, 'la DURACIÓN no se puede medir con esta tabla: sólo guarda la hora del final de cada análisis, y analysis_jobs se borró con la purga'
  UNION ALL
  SELECT '1 · por análisis', row_number() OVER (ORDER BY a.created_at, a.operation)::int,
         to_char(a.madrid, 'HH24:MI:SS') || ' · ' || a.operation || ' · ' || a.ventana || ' · ' || a.n_filas || ' filas (' || a.modelos || ')' ||
         ' · entrada ' || a.entrada || ' · salida ' || a.salida || ' · caché ' || a.cache_escritura || '/' || a.cache_lectura ||
         ' · ' || round(a.coste, 6) || ' $ · créditos ' || coalesce(a.creditos::text, '—')
  FROM analisis a
  UNION ALL
  SELECT '2 · por ventana', min(substr(a.ventana, 1, 1))::int,
         a.ventana || ' · exhaustivos: ' || count(*) || ' · coste total ' || round(sum(a.coste), 6) || ' $ · medio ' || round(avg(a.coste), 6) ||
         ' $ · entrada media ' || round(avg(a.entrada)) || ' tokens'
  FROM analisis a
  WHERE a.operation = 'analyze_exhaustive'
  GROUP BY a.ventana
)
SELECT bloque, linea FROM salida ORDER BY bloque, o1;
