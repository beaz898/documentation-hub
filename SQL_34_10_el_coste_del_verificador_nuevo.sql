-- ============================================================================
-- SQL_34_10 · EL COSTE DE LA TANDA DEL VERIFICADOR NUEVO FRENTE A LA LÍNEA BASE: COSTE MEDIO POR ANÁLISIS, EL DEL
-- VERIFICADOR APARTE, Y LA DURACIÓN — SÓLO LECTURA (02/11/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada. La ejecuta el director; Code no
-- ejecuta consultas.
--
-- PARA QUÉ (arquitecto, 02/11): P-F130-17 se puntúa contra el coste medido DESPUÉS del cambio del verificador, y ninguna
-- consulta lo da por tanda. SQL_311_02 lo da por análisis y por petición (cientos de filas con 21 análisis), sin medias
-- y sin comparar dos ventanas. Ésta da, por medición: el coste medio por análisis, el de la etapa del verificador
-- aparte, la duración media, y la tanda nueva frente a su línea base.
--
-- DE DÓNDE LEE: `analysis->'llamadasAlModelo'->'peticiones'` (lib/observability/registro-de-llamadas.ts), una entrada por
-- petición al modelo, con `etapa`, `modelo`, `resultado`, las cuatro cifras de tokens, `latenciaMs`, `esperaMs` y
-- `comienzoMs`. Sólo números, etapas y modelos: ningún texto de ningún documento.
--
-- LAS MEDICIONES:
--   · línea base, NOR-10: del 30/10 a las 23:40 al 31/10 a las 23:35 (Madrid), 21 pasadas · RELLENA.
--   · tanda nueva, NOR-10: del 02/11 a las 17:54:00 a las 18:30:00 (Madrid), 21 pasadas · RELLENA.
--   · línea base, NOR-11: el 28/10 de 08:30 a 09:00 (Madrid), 13 pasadas · RELLENA.
--   · tanda nueva, NOR-11: DESDE y HASTA EN NULO hasta que exista su tanda; mientras, sale «sin ventana» y no se mide.
--
-- LAS DEFINICIONES, escritas antes de leer nada:
--   · COSTE de una petición: sus cuatro cifras de tokens por la tabla de precios (USD por millón), copiada de
--     lib/observability/llm-pricing.ts, como en SQL_311_02. El arnés (claude/arneses/f34/) comprueba que coincide con la
--     del código. Un modelo sin precio hace caer un control en vez de costar cero en silencio. Las peticiones que no
--     salieron bien no traen tokens, así que no cuestan (la API sólo cobra si contesta).
--   · DURACIÓN de un análisis: del primer `comienzoMs` al último `comienzoMs + esperaMs + latenciaMs`, que es la que
--     documenta el registro (registro-de-llamadas.ts:35-37) y la de SQL_311_02. ⚠️ NO es la columna «s» de SQL_34_06,
--     que es `max(comienzoMs + latenciaMs)`: no cuenta la espera. Las dos cifras no se mezclan.
--   · ⚠️ AL LADO SALE LA COLUMNA «s» DE SQL_34_06, `max(comienzoMs + latenciaMs)`, que NO cuenta la espera y NO resta el
--     origen. (Corregido el 02/11 a las 21:27: decía «sin la espera», y la medida salió MÁS larga que la duración de aquí; la
--     diferencia es el origen. La decisión de puntuar con ésta, tachada: ninguna de las dos es lo que espera el usuario; eso
--     lo da usage_logs.latency_ms.)
--   · ESPERA MEDIA POR ANÁLISIS: la suma de los `esperaMs` de sus peticiones (limitador de cuota y backoff de los
--     reintentos). Las peticiones en paralelo pueden solaparse, así que la suma es una COTA SUPERIOR de lo que la espera
--     añade a la duración. Si son décimas, las dos definiciones de duración son la misma cifra en la práctica.
--   · LATENCIA DEL VERIFICADOR: la media de `latenciaMs` de sus peticiones; las peticiones van en paralelo, así que no
--     es lo que el verificador añade a la duración del análisis.
--
-- CONTROLES: las pasadas frente a las esperadas; que sean rápidas; que todas tengan registro por llamada; que no haya
-- peticiones con un modelo sin precio, ni sin etapa, ni fuera del detalle; y un CONTROL POSITIVO: toda pasada medida
-- tiene al menos una petición del verificador (si no, la etapa no se está leyendo con el nombre que se cree).
-- ============================================================================
-- ── LA RESOLUCIÓN DE LA ORGANIZACIÓN (26/10/2026), IDÉNTICA EN TODAS LAS CONSULTAS QUE MIRAN HACIA DELANTE ──
-- La organización NO se escribe: es la ÚNICA a la que pertenece el USUARIO del director. Si tiene cero o más de una,
-- la primera fila de la salida lo dice a gritos y todo lo demás está leyendo NADA.
-- ⚠️ a9625e93-af2a-4416-a465-5c2fa2a25bdf ES A LA VEZ EL ID DEL USUARIO DEL DIRECTOR Y EL DE LA ORGANIZACIÓN DEL
-- PILOTO (purgada el 25/10/2026). AQUÍ ES EL USUARIO. NO SE UNIFICA con ORG_DEL_PILOTO de SQL_SEG_02.
WITH usuario AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::uuid AS id                  -- ← USUARIO (el del director; NO es la organización)
),
resolucion AS (
  SELECT u.id AS usuario, count(m.org_id) AS pertenencias,
         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org
  FROM usuario u LEFT JOIN public.memberships m ON m.user_id = u.id
  GROUP BY u.id
),
organizacion_leida AS (
  SELECT CASE WHEN r.org IS NOT NULL
              THEN 'organización leída: ' || r.org || ' · «' || coalesce(o.name, '¿sin nombre?') || '» · '
                   || (SELECT count(*) FROM public.documents d WHERE d.org_id = r.org) || ' documentos'
              ELSE '⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' || r.usuario || ' tiene ' || r.pertenencias
                   || ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.' END AS linea
  FROM resolucion r LEFT JOIN public.organizations o ON o.id::text = r.org
),
mediciones (orden, tanda, documento, desde, hasta, esperado) AS (
  VALUES (1, 'línea base', 'NOR-10', timestamptz '2026-10-30 23:40:00+01', timestamptz '2026-10-31 23:35:00+01', 21),
         (2, 'tanda nueva', 'NOR-10', timestamptz '2026-11-02 17:54:00+01', timestamptz '2026-11-02 18:30:00+01', 21),
         (3, 'línea base', 'NOR-11', timestamptz '2026-10-28 08:30:00+01', timestamptz '2026-10-28 09:00:00+01', 13),
         (4, 'tanda nueva', 'NOR-11', NULL::timestamptz, NULL::timestamptz, 21)    -- ← DESDE y HASTA de la tanda nueva de NOR-11
),
-- LA TABLA DE PRECIOS, USD por millón de tokens: copia de lib/observability/llm-pricing.ts (ver la cabecera)
precios AS (
  SELECT * FROM (VALUES
    ('claude-haiku-4-5-20251001', 1.00, 5.00, 1.25, 0.10),
    ('claude-haiku-5-5',          0.10, 0.50, 0.125, 0.01),
    ('claude-sonnet-4-6',         3.00, 15.00, 3.75, 0.30)
  ) AS x(modelo, entrada, salida, escritura, lectura)
),
pasadas AS (
  SELECT m.orden, ar.id, ar.analysis_type, ar.analysis->'llamadasAlModelo' AS reg
  FROM mediciones m
  JOIN public.analysis_results ar ON ar.org_id = (SELECT org FROM resolucion) AND ar.document_name LIKE m.documento || '%'
                                 AND ar.created_at >= m.desde AND ar.created_at < m.hasta
),
peticiones AS (
  SELECT p.orden, p.id, coalesce(x.q->>'etapa', 'sin_etapa') AS etapa, x.q->>'modelo' AS modelo, x.q->>'resultado' AS resultado,
         coalesce((x.q->'tokens'->>'entrada')::bigint, 0) AS te, coalesce((x.q->'tokens'->>'salida')::bigint, 0) AS ts,
         coalesce((x.q->'tokens'->>'escrituraCache')::bigint, 0) AS tw, coalesce((x.q->'tokens'->>'lecturaCache')::bigint, 0) AS tr,
         coalesce((x.q->>'latenciaMs')::bigint, 0) AS lat, coalesce((x.q->>'esperaMs')::bigint, 0) AS esp,
         coalesce((x.q->>'comienzoMs')::bigint, 0) AS com
  FROM pasadas p
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.reg->'peticiones') = 'array' THEN p.reg->'peticiones' ELSE '[]'::jsonb END) x(q)
),
con_coste AS (
  SELECT q.*, pr.modelo IS NOT NULL AS con_precio,
         (q.te * pr.entrada + q.ts * pr.salida + q.tw * pr.escritura + q.tr * pr.lectura) / 1e6 AS coste
  FROM peticiones q LEFT JOIN precios pr ON pr.modelo = q.modelo
),
por_pasada AS (
  SELECT p.orden, p.id,
         coalesce(sum(c.coste), 0) AS coste,
         coalesce(sum(c.coste) FILTER (WHERE c.etapa = 'verificador'), 0) AS coste_verificador,
         count(c.etapa) FILTER (WHERE c.etapa = 'verificador') AS peticiones_verificador,
         count(c.etapa) AS peticiones,
         count(c.etapa) FILTER (WHERE c.resultado IS DISTINCT FROM 'ok') AS fallidas,
         coalesce(max(c.com + c.esp + c.lat) - min(c.com), 0) AS duracion,
         coalesce(max(c.com + c.lat), 0) AS duracion_sin_espera,   -- la de SQL_34_06, sólo para comparar
         coalesce(sum(c.esp), 0) AS espera
  FROM pasadas p LEFT JOIN con_coste c ON c.id = p.id
  GROUP BY p.orden, p.id
),
por_medicion AS (
  SELECT m.orden, m.tanda, m.documento, m.esperado, m.desde IS NULL OR m.hasta IS NULL AS sin_ventana,
         count(pp.id) AS n,
         avg(pp.coste) AS coste_medio, min(pp.coste) AS coste_min, max(pp.coste) AS coste_max, sum(pp.coste) AS coste_total,
         avg(pp.coste_verificador) AS verificador_medio, sum(pp.coste_verificador) AS verificador_total,
         avg(pp.peticiones_verificador) AS peticiones_verificador_medias,
         count(pp.id) FILTER (WHERE pp.peticiones_verificador > 0) AS con_verificador,
         sum(pp.fallidas) AS fallidas, sum(pp.peticiones) AS peticiones,
         avg(pp.duracion) AS duracion_media, avg(pp.duracion_sin_espera) AS duracion_sin_espera_media, avg(pp.espera) AS espera_media,
         (SELECT avg(c.lat) FROM con_coste c WHERE c.orden = m.orden AND c.etapa = 'verificador') AS latencia_verificador
  FROM mediciones m LEFT JOIN por_pasada pp ON pp.orden = m.orden
  GROUP BY m.orden, m.tanda, m.documento, m.esperado, m.desde, m.hasta
),
control (orden, medida, ok) AS (
  SELECT 10 + x.orden, x.tanda || ' · ' || x.documento || ' · pasadas en su ventana: ' || x.n || ' · esperado: ' || x.esperado
           || CASE WHEN x.sin_ventana THEN ' (sin ventana todavía: no se mide)' ELSE '' END,
         CASE WHEN x.sin_ventana THEN NULL ELSE x.n = x.esperado END
  FROM por_medicion x
  UNION ALL
  SELECT 20, 'pasadas que no son rápidas: ' || (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL ELSE (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0 END
  UNION ALL
  SELECT 21, 'pasadas sin registro por llamada (su coste no se puede medir): ' || (SELECT count(*) FROM pasadas WHERE jsonb_typeof(reg) IS DISTINCT FROM 'object'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL ELSE (SELECT count(*) FROM pasadas WHERE jsonb_typeof(reg) IS DISTINCT FROM 'object') = 0 END
  UNION ALL
  SELECT 22, 'peticiones con un modelo que no está en la tabla de precios: ' || (SELECT count(*) FROM con_coste WHERE NOT con_precio)
           || coalesce(' (' || (SELECT string_agg(DISTINCT coalesce(modelo, 'sin modelo'), ', ') FROM con_coste WHERE NOT con_precio) || ')', ''),
         (SELECT count(*) FROM con_coste WHERE NOT con_precio) = 0
  UNION ALL
  SELECT 23, 'pasadas con peticiones fuera del detalle o sin etapa (las cifras por etapa no serían el total): '
           || (SELECT count(*) FROM pasadas WHERE jsonb_typeof(reg->'fueraDelDetalle') = 'object' OR coalesce((reg->>'sinEtapa')::int, 0) <> 0
                OR EXISTS (SELECT 1 FROM peticiones q WHERE q.id = pasadas.id AND q.etapa = 'sin_etapa')),
         (SELECT count(*) FROM pasadas WHERE jsonb_typeof(reg->'fueraDelDetalle') = 'object' OR coalesce((reg->>'sinEtapa')::int, 0) <> 0
                OR EXISTS (SELECT 1 FROM peticiones q WHERE q.id = pasadas.id AND q.etapa = 'sin_etapa')) = 0
  UNION ALL
  -- CONTROL POSITIVO: si la etapa del verificador se llamara de otra forma, su coste saldría cero sin que nada avisara
  SELECT 30, 'CONTROL POSITIVO · pasadas medidas con alguna petición del verificador: '
           || (SELECT coalesce(sum(con_verificador), 0) FROM por_medicion WHERE NOT sin_ventana) || ' de '
           || (SELECT coalesce(sum(n), 0) FROM por_medicion WHERE NOT sin_ventana),
         CASE WHEN (SELECT coalesce(sum(n), 0) FROM por_medicion WHERE NOT sin_ventana) = 0 THEN NULL
              ELSE (SELECT sum(con_verificador) FROM por_medicion WHERE NOT sin_ventana) = (SELECT sum(n) FROM por_medicion WHERE NOT sin_ventana) END
),
por_etapa AS (   -- el coste medio por análisis de cada etapa: el total de la etapa entre las pasadas de la medición
  SELECT x.orden, c.etapa, sum(c.coste) / x.n AS coste_medio, 100 * sum(c.coste) / nullif(x.coste_total, 0) AS porcentaje,
         count(*)::numeric / x.n AS peticiones_medias
  FROM con_coste c JOIN por_medicion x ON x.orden = c.orden
  WHERE NOT x.sin_ventana
  GROUP BY x.orden, x.n, x.coste_total, c.etapa
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1, 0::numeric AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, NULL, orden, 0
  FROM control
  UNION ALL
  -- 1 · por medición: el coste medio por análisis, el del verificador aparte, y la duración
  SELECT '1 · por medición', x.tanda || ' · ' || x.documento || ' · ' || x.n || ' pasadas',
         'coste medio por análisis ' || round(x.coste_medio::numeric, 6) || ' $ (de ' || round(x.coste_min::numeric, 6) || ' a '
           || round(x.coste_max::numeric, 6) || ') · total ' || round(x.coste_total::numeric, 6) || ' $',
         'verificador: ' || round(x.verificador_medio::numeric, 6) || ' $ por análisis · '
           || coalesce(round(100 * x.verificador_total::numeric / nullif(x.coste_total, 0)::numeric, 1)::text, '—') || ' % del coste · '
           || round(x.peticiones_verificador_medias::numeric, 2) || ' peticiones por análisis · latencia media por petición '
           || coalesce(round(x.latencia_verificador::numeric)::text, '—') || ' ms',
         'duración media del análisis ' || round(x.duracion_media::numeric / 1000, 1) || ' s, con la espera (la columna de SQL_34_06, sin espera ni origen: '
           || round(x.duracion_sin_espera_media::numeric / 1000, 1) || ' s) · espera media por análisis '
           || round(x.espera_media::numeric / 1000, 2) || ' s · peticiones que no salieron bien: ' || x.fallidas || ' de ' || x.peticiones,
         x.orden, 0
  FROM por_medicion x WHERE NOT x.sin_ventana AND x.n > 0
  UNION ALL
  -- 2 · por etapa: de dónde sale el coste de cada medición
  SELECT '2 · por etapa', m.tanda || ' · ' || m.documento, e.etapa,
         round(e.coste_medio::numeric, 6) || ' $ por análisis · ' || coalesce(round(e.porcentaje::numeric, 1)::text, '—') || ' % del coste',
         round(e.peticiones_medias, 2) || ' peticiones por análisis',
         m.orden, -e.coste_medio::numeric
  FROM por_etapa e JOIN mediciones m ON m.orden = e.orden
  UNION ALL
  -- 3 · la tanda nueva frente a su línea base, por documento
  SELECT '3 · nueva frente a base', n.documento,
         'coste medio por análisis: ' || round(b.coste_medio::numeric, 6) || ' → ' || round(n.coste_medio::numeric, 6) || ' $ ('
           || coalesce(to_char(100 * (n.coste_medio - b.coste_medio) / nullif(b.coste_medio, 0), 'FMSG990.0'), '—') || ' %)',
         'verificador: ' || round(b.verificador_medio::numeric, 6) || ' → ' || round(n.verificador_medio::numeric, 6) || ' $ ('
           || coalesce(to_char(100 * (n.verificador_medio - b.verificador_medio) / nullif(b.verificador_medio, 0), 'FMSG990.0'), '—') || ' %)',
         'duración media, con la espera: ' || round(b.duracion_media::numeric / 1000, 1) || ' → ' || round(n.duracion_media::numeric / 1000, 1)
           || ' s · espera media: ' || round(b.espera_media::numeric / 1000, 2) || ' → ' || round(n.espera_media::numeric / 1000, 2) || ' s',
         CASE n.documento WHEN 'NOR-10' THEN 1 ELSE 2 END, 0
  FROM por_medicion b
  JOIN por_medicion n ON n.documento = b.documento AND n.tanda = 'tanda nueva' AND NOT n.sin_ventana AND n.n > 0
  WHERE b.tanda = 'línea base' AND b.n > 0
) t
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2, a;
