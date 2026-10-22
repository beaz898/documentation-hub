-- ============================================================================
-- 3.1.3 · LA VENTANA DOBLE EN LA TANDA: QUÉ LEYÓ EL JUEZ DE CADA PAREJA, CUÁNTOS
-- TROZOS DEL CANDIDATO, Y CUÁNTO TARDÓ — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- No saca texto de ningún documento: números, nombres de documento y modelos.
--
-- LA TANDA (arquitecto, 22/10/2026): siete pasadas de NOR-11 y tres de NOR-10, seguidas, la misma forma que la
-- de F-128 para poder comparar. Esta consulta es la parte NUEVA; lo demás se lee con los instrumentos de
-- siempre, sin tocarlos, para que la comparación sea con el mismo medidor:
--   · las tres trampas de NOR-11 y los seis contadores de la puerta → SQL_F128_01 (sus cuatro valores);
--   · la A de NOR-10 → SQL_F128_02 (sus cuatro valores);
--   · el coste y la latencia por etapa y por petición → SQL_311_02 (DESDE y HASTA).
-- Lo que contesta ésta, sobre `analysis.lecturaDeLasParejas` y `analysis.llamadasAlModelo`:
--   a) por pareja: el régimen, DE DÓNDE SALIÓ EL BLOQUE DEL CANDIDATO (`seleccion`: entero, ampliada o
--      la_de_la_recuperacion), CUÁNTOS TROZOS DEL CANDIDATO VIO EL JUEZ (`trozosDelCandidato`), lo que vio
--      de cada lado, la ventana, el modelo y los tokens de salida (bloque 1);
--   b) LA PREDICCIÓN DE LOS TROZOS DE CLI-12 en NOR-10 ↔ CLI-12, escrita antes de cada tanda (bloque 2). Es un
--      PARÁMETRO desde el 22/10 (ver la tabla de abajo): 12 para la tanda del 22/10 con 80.000 (Code, 21/10, con
--      los trozos reales y el orden del log del 16/10; ACERTÓ 5 de 5), 55 para la de 150.000 (arquitecto, 22/10:
--      la pareja entera, sus 55 trozos);
--   c) LA LATENCIA DEL JUEZ por pareja, con el registro por llamada, al lado de los tokens de salida: la
--      ventana doble hace que el juez LEA más, y si lee más puede ESCRIBIR más. La cifra contra la que
--      comparar es la del 21/10: 27.718 ms y 7.144 tokens de salida en una sola petición del juez, el 77 %
--      de la duración del análisis (lectura del arquitecto de la salida de SQL_311_02 que ejecutó el
--      director; Code no ha visto esa salida) (bloques 1 y 3).
--   d) LA DURACIÓN DE CADA PASADA contra su línea base (arquitecto, 22/10/2026), con lo que vale cada una
--      declarado al lado (bloque 3):
--      · NOR-11: 36.128 ms, UNA pasada del 21/10 medida por el registro por llamada, del primer comienzoMs
--        al último final, que es exactamente como mide este bloque. Comparable con las siete de la tanda;
--      · NOR-10: NO HAY línea base del registro. Sus tres pasadas del 19/10 son anteriores al registro (paso
--        4 del 3.1.1), y lo único que hay son los totales que imprimió el pipeline en los logs de Vercel
--        —22.607, 25.033 y 27.605 ms—, que son OTRO RELOJ. Van con esa etiqueta: indicativos, no
--        comparables al milisegundo. Cifras del arquitecto; Code no ha visto ni la salida ni los logs.
--
-- ⚠️ LOS LÍMITES, declarados antes de leer nada:
--   · DIEZ PASADAS NO SON UNA MUESTRA de la latencia: dicen cómo fueron ésas. La comparación con los
--     27.718 ms es con UNA petición de UN análisis.
--   · `trozosDelCandidato` y `seleccion` sólo existen desde el despliegue de este commit; antes, salen «—».
--     El control 4 cae si en la ventana hay una pareja sin ellos: el código desplegado no es éste.
--   · LA LATENCIA DE LA PAREJA es la suma de sus peticiones del juez (con sus reintentos); la de la petición
--     más larga va aparte. La duración del análisis es la de sus llamadas al modelo, del primer comienzo al
--     último final (la misma definición que SQL_311_02).
--   · LA PREDICCIÓN NO ES UN CONTROL: si falla, no es que la consulta esté mal, es que la predicción lo estaba,
--     y se cuenta como toda predicción de esta casa.
--
-- ✅ PROBADO ANTES DE ENTREGARLO en PGlite (claude/arneses/f313/, en la suite), con diez pasadas sintéticas
-- de cifras conocidas y una situación por control para que cada uno caiga donde debe. CON DATOS REALES NO
-- SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros`. No se mira otra.    │
-- │ LO QUE TOCA EL DIRECTOR, en `parametros`: DESDE y HASTA, que abarcan     │
-- │ TODAS las pasadas de la tanda, en hora de Madrid, con el formato         │
-- │ timestamptz 'AAAA-MM-DD HH:MM:SS+02' (⚠️ desde el domingo 25/10/2026 a    │
-- │ las 03:00 es «+01»); y los cuatro valores de la tabla de abajo.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ PONER EN CADA LECTURA (22/10/2026). LOS ESPERADOS, DESPUÉS DE MIRAR EL RELOJ DE LA BASE, nunca antes
-- (protocolo, regla del 22/10): vienen a NULL, y con NULL sus controles salen NO APLICA, no OK.
--
--   lectura                          esperado NOR-11  esperado NOR-10  ventana  trozos de CLI-12
--   ───────────────────────────────  ───────────────  ───────────────  ───────  ────────────────
--   releer la tanda del 22/10        11               5                80000    12
--   (ventana de 80.000)
--   la tanda de 150.000              los del reloj    los del reloj    150000   55
--
-- La ventana es la que el código desplegado escribe en cada pareja (`presupuesto`): con otra, el control 4 cae.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         timestamptz '2026-10-22 00:00:00+02' AS desde,           -- ← DESDE
         timestamptz '2026-10-23 00:00:00+02' AS hasta,           -- ← HASTA
         NULL::int AS esperado_nor11,                             -- ← ESPERADO NOR-11: DESPUÉS de mirar el reloj
         NULL::int AS esperado_nor10,                             -- ← ESPERADO NOR-10: ídem
         150000 AS ventana_esperada,                              -- ← la ventana desplegada (tabla de arriba)
         55 AS prediccion_trozos_cli12,                           -- ← la predicción de la tanda (tabla de arriba)
         27718 AS referencia_ms,                                  -- la petición del juez del 21/10
         36128 AS base_nor11_ms                                   -- la duración de la pasada de NOR-11 del 21/10, por el registro
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis,
         CASE WHEN ar.document_name ILIKE 'NOR-11%' THEN 'NOR-11' ELSE 'NOR-10' END AS doc,
         row_number() OVER (PARTITION BY CASE WHEN ar.document_name ILIKE 'NOR-11%' THEN 'NOR-11' ELSE 'NOR-10' END ORDER BY ar.created_at) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.created_at >= p.desde AND ar.created_at < p.hasta
    AND (ar.document_name ILIKE 'NOR-11%' OR ar.document_name ILIKE 'NOR-10%')
),
lecturas AS (
  SELECT pa.doc, pa.n, l->>'documentId' AS cand_id, coalesce(d.name, '(' || (l->>'documentId') || ')') AS cand,
         l->>'regimen' AS regimen, l->>'seleccion' AS seleccion, (l->>'trozosDelCandidato')::int AS trozos,
         (l->'candidato'->>'mostrados')::int AS c_most, (l->'candidato'->>'caracteres')::int AS c_car,
         (l->'analizado'->>'mostrados')::int AS a_most, (l->'analizado'->>'caracteres')::int AS a_car,
         (l->>'presupuesto')::int AS ventana, l->>'modelo' AS modelo, (l->>'tokensDeSalida')::int AS salida
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array' THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
  LEFT JOIN public.documents d ON d.id::text = l->>'documentId'
),
peticiones AS (
  SELECT pa.doc, pa.n, x.p->>'etapa' AS etapa, x.p->>'pareja' AS pareja,
         coalesce((x.p->>'latenciaMs')::bigint, 0) AS lat, coalesce((x.p->>'esperaMs')::bigint, 0) AS esp,
         coalesce((x.p->>'comienzoMs')::bigint, 0) AS com, coalesce((x.p->'tokens'->>'salida')::bigint, 0) AS ts
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'llamadasAlModelo'->'peticiones') = 'array' THEN pa.analysis->'llamadasAlModelo'->'peticiones' ELSE '[]'::jsonb END) x(p)
),
juez AS (
  SELECT doc, n, pareja, count(*) AS peticiones, sum(lat) AS lat_total, max(lat) AS lat_max, sum(ts) AS salida_reg
  FROM peticiones WHERE etapa = 'juez' GROUP BY doc, n, pareja
),
duracion AS (
  SELECT doc, n, max(com + esp + lat) - min(com) AS ms FROM peticiones GROUP BY doc, n
),
control AS (
  SELECT 1 AS orden, 'pasadas de NOR-11 entre DESDE y HASTA: esperado ' || coalesce(p.esperado_nor11::text, 'SIN RELLENAR (mira el reloj de la base)') ||
         ', medido ' || (SELECT count(*) FROM pasadas WHERE doc = 'NOR-11') AS medida,
         CASE WHEN p.esperado_nor11 IS NULL THEN NULL ELSE (SELECT count(*) FROM pasadas WHERE doc = 'NOR-11') = p.esperado_nor11 END AS ok
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de NOR-10 entre DESDE y HASTA: esperado ' || coalesce(p.esperado_nor10::text, 'SIN RELLENAR (mira el reloj de la base)') ||
         ', medido ' || (SELECT count(*) FROM pasadas WHERE doc = 'NOR-10'),
         CASE WHEN p.esperado_nor10 IS NULL THEN NULL ELSE (SELECT count(*) FROM pasadas WHERE doc = 'NOR-10') = p.esperado_nor10 END
  FROM parametros p
  UNION ALL
  -- 3 · el interruptor, encendido: con tijera_vieja la tanda no mide la ventana doble
  SELECT 3, 'parejas leídas con la tijera vieja (interruptor apagado): ' ||
         (SELECT count(*) FROM lecturas WHERE regimen = 'tijera_vieja') || ' de ' || (SELECT count(*) FROM lecturas),
         CASE WHEN (SELECT count(*) FROM lecturas) = 0 THEN NULL ELSE (SELECT count(*) FROM lecturas WHERE regimen = 'tijera_vieja') = 0 END
  UNION ALL
  -- 4 · el código desplegado es el que se quiere medir: la ventana esperada (parámetro) y el recuento de trozos en cada pareja
  SELECT 4, 'parejas sin trozosDelCandidato o con una ventana que no es ' || p.ventana_esperada || ': ' ||
         (SELECT count(*) FROM lecturas WHERE trozos IS NULL OR (regimen IN ('pareja_entera', 'corte_honesto') AND ventana IS DISTINCT FROM p.ventana_esperada)) ||
         ' de ' || (SELECT count(*) FROM lecturas),
         CASE WHEN (SELECT count(*) FROM lecturas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM lecturas WHERE trozos IS NULL OR (regimen IN ('pareja_entera', 'corte_honesto') AND ventana IS DISTINCT FROM p.ventana_esperada)) = 0 END
  FROM parametros p
  UNION ALL
  SELECT 5, 'parejas en corte honesto sin seleccion: ' || (SELECT count(*) FROM lecturas WHERE regimen = 'corte_honesto' AND seleccion IS NULL) ||
         ' de ' || (SELECT count(*) FROM lecturas WHERE regimen = 'corte_honesto'),
         CASE WHEN (SELECT count(*) FROM lecturas WHERE regimen = 'corte_honesto') = 0 THEN NULL
              ELSE (SELECT count(*) FROM lecturas WHERE regimen = 'corte_honesto' AND seleccion IS NULL) = 0 END
  UNION ALL
  -- 6 · cada pareja tiene su llamada del juez en el registro, o la latencia de esa pareja no se puede leer
  SELECT 6, 'parejas sin su petición del juez en el registro por llamada: ' ||
         (SELECT count(*) FROM lecturas l WHERE NOT EXISTS (SELECT 1 FROM juez j WHERE j.doc = l.doc AND j.n = l.n AND j.pareja = l.cand_id)) ||
         ' de ' || (SELECT count(*) FROM lecturas),
         CASE WHEN (SELECT count(*) FROM lecturas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM lecturas l WHERE NOT EXISTS (SELECT 1 FROM juez j WHERE j.doc = l.doc AND j.n = l.n AND j.pareja = l.cand_id)) = 0 END
)
SELECT bloque, pasada, a, b, c
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS pasada,
         CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END AS a, medida AS b, NULL::text AS c,
         orden AS o1, ''::text AS o2, 0::bigint AS o3
  FROM control
  UNION ALL
  -- 1 · POR PAREJA: qué leyó el juez y cuánto tardó
  SELECT '1 · por pareja', l.doc || ' ' || l.n, l.cand,
         l.regimen || coalesce(' · bloque ' || l.seleccion, '') || ' · ' || coalesce(l.trozos::text, '—') || ' trozos del candidato · ' ||
           'candidato ' || l.c_most || '/' || coalesce(l.c_car::text, '—') || ' · analizado ' || l.a_most || '/' || l.a_car ||
           ' · ventana ' || coalesce(l.ventana::text, '—'),
         coalesce(l.modelo, '—') || ' · salida ' || coalesce(l.salida::text, '—') || ' tokens · juez ' ||
           coalesce(j.lat_total::text || ' ms en ' || j.peticiones || ' petición(es), la más larga ' || j.lat_max || ' ms', 'sin registro'),
         10, l.doc, l.n
  FROM lecturas l LEFT JOIN juez j ON j.doc = l.doc AND j.n = l.n AND j.pareja = l.cand_id
  UNION ALL
  -- 2 · LA PREDICCIÓN: los trozos de CLI-12 en NOR-10 ↔ CLI-12 (el parámetro)
  SELECT '2 · predicción', l.doc || ' ' || l.n,
         CASE WHEN l.trozos IS NULL THEN 'SIN DATO' WHEN l.trozos = p.prediccion_trozos_cli12 THEN 'ACIERTA' ELSE 'FALLA' END,
         l.cand || ': predicho ' || p.prediccion_trozos_cli12 || ' trozos, medido ' || coalesce(l.trozos::text, '—'),
         'bloque ' || coalesce(l.seleccion, '—'),
         20, l.doc, l.n
  FROM lecturas l, parametros p WHERE l.doc = 'NOR-10' AND l.cand ILIKE 'CLI-12%'
  UNION ALL
  -- 3 · POR PASADA: la petición del juez más larga contra la del 21/10, y la duración del análisis
  SELECT '3 · por pasada', pa.doc || ' ' || pa.n, to_char(pa.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid',
         'la petición del juez más larga: ' || coalesce((SELECT max(j.lat_max) FROM juez j WHERE j.doc = pa.doc AND j.n = pa.n)::text, '—') ||
           ' ms (21/10: ' || p.referencia_ms || ' ms) · salida del juez ' ||
           coalesce((SELECT sum(j.salida_reg) FROM juez j WHERE j.doc = pa.doc AND j.n = pa.n)::text, '—') || ' tokens',
         'duración de las llamadas del análisis: ' || coalesce((SELECT d.ms FROM duracion d WHERE d.doc = pa.doc AND d.n = pa.n)::text, '—') || ' ms' ||
           CASE WHEN pa.doc = 'NOR-11'
                THEN ' (línea base 21/10, el mismo reloj: ' || p.base_nor11_ms || ' ms)'
                ELSE ' (sin línea base del registro; los logs de Vercel del 19/10 dieron 22.607, 25.033 y 27.605 ms: otro reloj, indicativos, no comparables al milisegundo)' END,
         30, pa.doc, pa.n
  FROM pasadas pa, parametros p
) t
ORDER BY o1, o2 DESC, o3, pasada, a;
