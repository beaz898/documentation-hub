-- ============================================================================
-- F-127 · EL COSTE POR ANÁLISIS, CON EL PRECIO BUENO — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE. No saca
-- texto de ningún documento: sólo tokens, costes, horas e ids.
-- ✅ PROBADO ANTES DE ENTREGARLO (19/10/2026) en un Postgres local (PGlite) con
-- filas sintéticas: con tres análisis de NOR-10 y siete de NOR-11 bien
-- emparejados, los controles salen OK y el factor sale 4,000 en las filas
-- viejas; y salen FALLA cuando a un análisis le falta su fila de llm_usage,
-- cuando una fila de llm_usage se asigna a dos análisis, cuando una fila vieja
-- no da factor 4 (un cost_usd a 0, que es lo que deja un modelo sin precio), y
-- cuando falta la fila de Haiku de un análisis; y un análisis con DOS filas,
-- una de 4.5 y otra de 5.5 (el juez con ANALYSIS_JUDGE_MODEL), da la suma de
-- las dos (ampliación del 19/10/2026). CON DATOS REALES NO SE HA
-- EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 19/10/2026): cuánto cuesta un análisis rápido, que es
-- la tercera condición del criterio de «cerrado para enseñar» y la única que
-- faltaba (claude/Estado_Y_Pendientes_14-10-2026.md, sección 1). La consulta NO
-- califica: enseña.
--
-- ⚠️ LO QUE ESTA CIFRA NO ES, Y SE DICE ANTES DE LEERLA:
--   1. La fila de llm_usage NO LLEVA EL ID DEL ANÁLISIS. Se empareja con su fila
--      de analysis_results POR HORA: la fila de llm_usage MÁS CERCANA en el
--      tiempo, dentro de ±20 s, de la misma organización y operación. El control
--      0.2 falla si una fila se asigna a dos análisis, y el bloque 1 enseña el
--      desfase de cada emparejamiento.
--   2. El endpoint del examen también escribe operation = 'analyze_quick'
--      (app/api/admin/examen/analizar.ts:118): en el bloque 3, el de toda la
--      organización, puede haber análisis que no lanzó el director.
--   3. La escritura de llm_usage no espera confirmación
--      (lib/observability/record-usage.ts): si falló, el análisis no tiene fila
--      y no aparece en los bloques 1 y 2 (control 0.1).
--   4. NO ENTRA LO QUE CUESTA PINECONE (embeddings y consultas): es sólo el
--      coste de los modelos.
--   5. `credits_charged` está en CRÉDITOS, no en dólares.
--
-- LOS PRECIOS, en $ por millón de tokens (constante `precios`):
--   · Haiku 4.5: 1 / 5 / 1,25 / 0,10 (entrada, salida, escritura de caché a
--     cinco minutos, lectura de caché). Verificados por el arquitecto en la
--     documentación oficial de Anthropic el 19/10/2026; corregidos en
--     lib/observability/llm-pricing.ts el mismo día (commit d1505999). Hasta
--     entonces la tabla tenía la cuarta parte, así que **toda fila escrita antes
--     de ese despliegue lleva un cost_usd 4 veces menor** que el recalculado: es
--     el control 0.3, y el bloque 1 enseña el factor de cada fila.
--   · Sonnet 4.6: 3 / 15 / 3,75 / 0,30, los de la tabla, verificados el 19/10.
--   · Haiku 5.5 (`claude-haiku-5-5`): 0,10 / 0,50 / 0,125 / 0,01, el tramo de
--     prompts de menos de 100.000 tokens, que es el del juez. Verificado por el
--     arquitecto en la página de Anthropic el 19/10/2026 (Code no tiene forma
--     de verificarlo). Sirve DOS veces: (1) para recalcular las filas de 5.5
--     que deja el juez cuando está encendido ANALYSIS_JUDGE_MODEL (F-128): con
--     él, cada análisis deja DOS filas, una de 4.5 (rerank, verificador,
--     síntesis) y otra de 5.5 (el juez), y el coste del análisis es la suma;
--     (2) como comparación, el coste de los tokens de 4.5 si todo fuera 5.5.
--     (Cambiado el 19/10: la primera versión no tenía su precio de caché y
--     marcaba «incompleto» las filas con caché.)
--
-- LAS DOS VENTANAS, en hora de Madrid, sobre la hora GUARDADA:
--   · NOR-10, 16/10/2026 de 12:40 a 12:50 (las tres pasadas, 12:45, 12:46 y 12:46);
--   · NOR-11, 14/10/2026 de 08:25 a 08:50 (las siete, de 08:28:55 a 08:46:38).
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   0.1 cada análisis de las dos ventanas tiene su fila de Haiku (3 y 7);
--   0.2 ninguna fila de llm_usage queda asignada a dos análisis;
--   0.3 en las filas DE HAIKU 4.5 escritas antes del arreglo de precios
--       (el único precio que cambió), recalculado ÷ guardado = 4,000 (si sale otra cosa, el cost_usd guardado no es el que
--       creemos: un 0 es un modelo sin precio en la tabla).
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         timestamptz '2026-10-19 00:00:00+02' AS arreglo_de_precios  -- ← antes del despliegue de d1505999
),
precios (modelo, entrada, salida, cache_escritura, cache_lectura) AS (
  VALUES ('claude-haiku-4-5-20251001', 1.00, 5.00, 1.25, 0.10),
         ('claude-haiku-5-5',          0.10, 0.50, 0.125, 0.01),
         ('claude-sonnet-4-6',         3.00, 15.00, 3.75, 0.30)
),
haiku55 (entrada, salida, cache_escritura, cache_lectura) AS (VALUES (0.10, 0.50, 0.125, 0.01)),
ventanas (nombre, patron, desde, hasta, esperado) AS (
  VALUES ('NOR-10 · 16/10', 'NOR-10%', timestamptz '2026-10-16 12:40:00+02', timestamptz '2026-10-16 12:50:00+02', 3),
         ('NOR-11 · 14/10', 'NOR-11%', timestamptz '2026-10-14 08:25:00+02', timestamptz '2026-10-14 08:50:00+02', 7)
),
analisis AS (
  SELECT v.nombre AS ventana, v.esperado, ar.id, ar.created_at, ar.document_name,
         row_number() OVER (PARTITION BY v.nombre ORDER BY ar.created_at) AS n
  FROM public.analysis_results ar, parametros p, ventanas v
  WHERE ar.org_id = p.org AND ar.analysis_type = 'quick' AND ar.document_name ILIKE v.patron
    AND ar.created_at >= v.desde AND ar.created_at < v.hasta
),
uso AS (
  SELECT u.*, u.input_tokens * pr.entrada / 1e6 + u.output_tokens * pr.salida / 1e6
              + u.cache_write_tokens * pr.cache_escritura / 1e6 + u.cache_read_tokens * pr.cache_lectura / 1e6 AS recalculado,
         CASE WHEN u.model = 'claude-haiku-4-5-20251001' THEN
           u.input_tokens * h.entrada / 1e6 + u.output_tokens * h.salida / 1e6
           + u.cache_write_tokens * h.cache_escritura / 1e6 + u.cache_read_tokens * h.cache_lectura / 1e6 END AS con_haiku55,
         pr.modelo IS NULL AS sin_precio
  FROM public.llm_usage u
  CROSS JOIN parametros p CROSS JOIN haiku55 h
  LEFT JOIN precios pr ON pr.modelo = u.model
  WHERE u.org_id::text = p.org AND u.operation = 'analyze_quick'
),
-- el emparejamiento: para cada análisis y cada modelo, la fila de llm_usage más cercana en ±20 s
pareja AS (
  SELECT a.ventana, a.n, a.id AS analisis_id, a.created_at AS hora_analisis, x.*
  FROM analisis a
  CROSS JOIN LATERAL (
    SELECT DISTINCT ON (u.model) u.id AS uso_id, u.model, u.created_at AS hora_uso, u.input_tokens, u.output_tokens,
           u.cache_write_tokens, u.cache_read_tokens, u.cost_usd, u.credits_charged, u.recalculado, u.con_haiku55,
           extract(epoch FROM (u.created_at - a.created_at)) AS desfase_s
    FROM uso u
    WHERE abs(extract(epoch FROM (u.created_at - a.created_at))) <= 20
    ORDER BY u.model, abs(extract(epoch FROM (u.created_at - a.created_at)))
  ) x
),
por_analisis AS (
  SELECT ventana, n, analisis_id, sum(recalculado) AS coste, sum(cost_usd) AS guardado,
         sum(coalesce(con_haiku55, recalculado)) AS coste_haiku55,
         string_agg(model, ' + ' ORDER BY model) AS modelos
  FROM pareja GROUP BY ventana, n, analisis_id
),
control AS (
  SELECT 1 AS orden, 'ventana ' || v.nombre || ': análisis ' || (SELECT count(*) FROM analisis a WHERE a.ventana = v.nombre) ||
         ' (esperado ' || v.esperado || '), con fila de Haiku ' ||
         (SELECT count(*) FROM pareja pa WHERE pa.ventana = v.nombre AND pa.model = 'claude-haiku-4-5-20251001') AS medida,
         (SELECT count(*) FROM analisis a WHERE a.ventana = v.nombre) = v.esperado
           AND (SELECT count(*) FROM pareja pa WHERE pa.ventana = v.nombre AND pa.model = 'claude-haiku-4-5-20251001') = v.esperado AS ok
  FROM ventanas v
  UNION ALL
  SELECT 2, 'filas de llm_usage asignadas a más de un análisis: ' ||
         (SELECT count(*) FROM (SELECT uso_id FROM pareja GROUP BY uso_id HAVING count(*) > 1) d),
         (SELECT count(*) FROM (SELECT uso_id FROM pareja GROUP BY uso_id HAVING count(*) > 1) d) = 0
  UNION ALL
  SELECT 3, 'filas de Haiku 4.5 escritas antes del arreglo de precios con recalculado ÷ guardado distinto de 4,000: ' ||
         (SELECT count(*) FROM pareja pa, parametros p WHERE pa.hora_uso < p.arreglo_de_precios AND pa.model = 'claude-haiku-4-5-20251001'
            AND (pa.cost_usd IS NULL OR pa.cost_usd = 0 OR round((pa.recalculado / pa.cost_usd)::numeric, 3) <> 4.000)),
         (SELECT count(*) FROM pareja pa, parametros p WHERE pa.hora_uso < p.arreglo_de_precios AND pa.model = 'claude-haiku-4-5-20251001'
            AND (pa.cost_usd IS NULL OR pa.cost_usd = 0 OR round((pa.recalculado / pa.cost_usd)::numeric, 3) <> 4.000)) = 0
)
SELECT bloque, pasada, a, b, c
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS pasada, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS a, medida AS b, NULL::text AS c,
         orden AS o1, 0::bigint AS o2, ''::text AS o3
  FROM control
  UNION ALL
  -- 1 · CADA FILA DE llm_usage DE CADA ANÁLISIS: tokens, lo guardado, lo recalculado y el factor
  SELECT '1 · filas de llm_usage por análisis', pa.ventana || ' · pasada ' || pa.n,
         pa.model || ' · desfase ' || round(pa.desfase_s::numeric, 1) || ' s',
         'entrada ' || pa.input_tokens || ' · salida ' || pa.output_tokens || ' · caché escrita ' || pa.cache_write_tokens ||
           ' · caché leída ' || pa.cache_read_tokens || ' · créditos ' || coalesce(pa.credits_charged::text, '—'),
         'cost_usd guardado ' || round(pa.cost_usd::numeric, 6) || ' · recalculado ' || round(pa.recalculado::numeric, 6) ||
           ' · factor ' || CASE WHEN pa.cost_usd > 0 THEN round((pa.recalculado / pa.cost_usd)::numeric, 3)::text ELSE '— (guardado 0)' END ||
           ' · si fuera Haiku 5.5 ' || coalesce(round(pa.con_haiku55::numeric, 6)::text, 'no aplica'),
         1, pa.n, pa.ventana
  FROM pareja pa
  UNION ALL
  -- 2 · EL COSTE POR ANÁLISIS DE CADA VENTANA: media y mediana, recalculado y con Haiku 5.5
  SELECT '2 · coste por análisis', v.ventana, 'n ' || count(*),
         'recalculado: media ' || round(avg(v.coste)::numeric, 5) || ' $ · mediana ' ||
           round((percentile_cont(0.5) WITHIN GROUP (ORDER BY v.coste))::numeric, 5) || ' $ · mín ' || round(min(v.coste)::numeric, 5) ||
           ' · máx ' || round(max(v.coste)::numeric, 5) || ' · (guardado: media ' || round(avg(v.guardado)::numeric, 5) || ' $)',
         'si todo fuera Haiku 5.5: media ' || round(avg(v.coste_haiku55)::numeric, 5) || ' $ · mediana ' ||
           round((percentile_cont(0.5) WITHIN GROUP (ORDER BY v.coste_haiku55))::numeric, 5) || ' $ · modelos: ' ||
           string_agg(DISTINCT v.modelos, ' | '),
         2, 0, v.ventana
  FROM por_analisis v GROUP BY v.ventana
  UNION ALL
  -- 3 · TODA LA ORGANIZACIÓN: cada fila de Haiku de analyze_quick es un análisis (límite 2: incluye el examen)
  SELECT '3 · todos los analyze_quick de la organización, por mes', to_char(u.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM'),
         'filas de Haiku ' || count(*),
         'recalculado: media ' || round(avg(u.recalculado)::numeric, 5) || ' $ · mediana ' ||
           round((percentile_cont(0.5) WITHIN GROUP (ORDER BY u.recalculado))::numeric, 5) || ' $ · (guardado: mediana ' ||
           round((percentile_cont(0.5) WITHIN GROUP (ORDER BY u.cost_usd))::numeric, 5) || ' $)',
         'si fuera Haiku 5.5: mediana ' || round((percentile_cont(0.5) WITHIN GROUP (ORDER BY u.con_haiku55))::numeric, 5) || ' $',
         3, 0, to_char(u.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM')
  FROM uso u WHERE u.model = 'claude-haiku-4-5-20251001'
  GROUP BY to_char(u.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM')
  UNION ALL
  SELECT '3 · modelos de analyze_quick SIN precio en la tabla', NULL, coalesce(string_agg(DISTINCT u.model, ', '), 'ninguno'),
         NULL, NULL, 4, 0, ''
  FROM uso u WHERE u.sin_precio
) t
ORDER BY bloque, o1, o3, o2;
