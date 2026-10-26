-- ============================================================================
-- 3.1.1 · PASO 5 · EL MEDIDOR DEL REGISTRO POR LLAMADA: TOKENS, COSTE, CACHÉ,
-- RELOJ Y LOS DOS ÷4, POR ANÁLISIS, POR ETAPA Y POR PETICIÓN — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- No saca texto de ningún documento: el registro sólo lleva números, etapas,
-- modelos e ids (lib/observability/registro-de-llamadas.ts, cabecera).
--
-- QUÉ CONTESTA (arquitecto, 21/10/2026), sobre `analysis.llamadasAlModelo` de cada
-- análisis guardado entre DESDE y HASTA:
--   a) las cuatro cifras de tokens y la latencia, por petición (bloque 1) y por
--      etapa (bloque 2);
--   b) LA COMPARACIÓN DE LOS DOS ÷4 —el objetivo escrito del 3.1.1—: la entrada
--      que estimó el cliente (la longitud del payload entre 4, en
--      `callAnthropicJson` y `callAnthropicAgent`) contra la que devolvió la API,
--      petición a petición (bloque 1) y resumida por análisis (bloque 4);
--   c) el coste por etapa, con la tabla de precios corregida, y el porcentaje del
--      análisis que se lleva cada una (bloque 2; el total, en el 3);
--   d) la caché: lo escrito, lo leído y lo que ahorró de verdad (bloques 2 y 3);
--   e) el reloj de pared del análisis AL LADO de la suma de las entradas: la
--      duración y el trabajo (bloque 3);
--   f) y el reparto entre petición y espera (bloques 2 y 3).
--
-- ⚠️ LOS LÍMITES, declarados antes de leer nada:
--   · UN ANÁLISIS NO ES UNA MUESTRA. Con uno o dos, las proporciones dicen cómo
--     fue ése, no cómo es el sistema.
--   · LA ENTRADA DE LA API EN TRES TROZOS: `input_tokens` NO incluye lo que entró
--     por caché. La estimación ÷4 estima el prompt entero, así que se compara con
--     entrada + escritura de caché + lectura de caché, no con la entrada sola.
--     **Comparar la estimación sólo contra `input_tokens` habría hecho parecer que la
--     estimación se pasa diez veces en cuanto la caché se active** (arquitecto,
--     21/10): el día del 3.1.4, cuando los documentos vayan como bloques cacheados,
--     esa comparación habría mandado la medición al carajo sin que nada avisara.
--     Y HOY LA CACHÉ ESTÁ A CERO, COMPROBADO: en la primera lectura de este medidor
--     (21/10, el análisis rápido de NOR-11 de las 14:01) salió caché escrita 0,
--     leída 0 y ahorro 0 $ (lectura del arquitecto de la salida del director).
--   · LA ESTIMACIÓN SÓLO EXISTE donde la calcula el cliente: en las llamadas JSON
--     del análisis y en el agente. Las peticiones sin ella salen «—».
--   · LA TABLA DE PRECIOS ESTÁ COPIADA de `lib/observability/llm-pricing.ts`
--     (USD por millón, escritura de caché de cinco minutos). El arnés
--     (claude/arneses/f311/) comprueba que coincide con la del código; si alguien
--     cambia una y no la otra, la suite se pone en rojo. Un modelo sin precio hace
--     caer el control 2 en vez de costar cero en silencio.
--   · EL AHORRO DE LA CACHÉ es lo que habrían costado los tokens de caché a precio
--     de entrada normal menos lo que costaron: puede salir NEGATIVO si se escribió
--     y no se llegó a leer (la escritura cuesta 1,25 veces la entrada).
--   · LA DURACIÓN es sólo la de las llamadas al modelo: del primer `comienzoMs` al
--     último final. El registro se abre después del control del duplicado, así que
--     no cuenta ni ese control ni lo que pasa en Pinecone o Supabase fuera de las
--     llamadas. Y el trabajo cuenta solapadas las llamadas en paralelo (el juez y
--     el verificador de cinco en cinco), por eso es mayor que la duración.
--   · LAS PETICIONES QUE NO SALIERON BIEN no tienen tokens (los cobra la API sólo
--     si contesta), así que no cuestan; sí cuentan su latencia y su espera.
--   · Sólo los análisis con registro, es decir, desde el despliegue del 21/10.
--
-- ✅ PROBADO ANTES DE ENTREGARLO en PGlite (claude/arneses/f311/, en la suite),
-- con un análisis sintético de cifras conocidas y calculadas a mano, y una
-- situación por control para que cada uno caiga donde debe. CON DATOS REALES NO
-- SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN NO SE ESCRIBE: se resuelve por el USUARIO del director   │
-- │ (la constante `usuario`, en el bloque de la resolución). No se toca.     │
-- │ LO ÚNICO QUE TOCA EL DIRECTOR: DESDE y HASTA, en hora de Madrid, con el  │
-- │ formato timestamptz 'AAAA-MM-DD HH:MM:SS+02'. ⚠️ Desde el 25/10/2026 a   │
-- │ las 03:00 es «+01».                                                       │
-- └──────────────────────────────────────────────────────────────────────────┘
-- ============================================================================

-- ── LA RESOLUCIÓN DE LA ORGANIZACIÓN (26/10/2026), IDÉNTICA EN TODAS LAS CONSULTAS QUE MIRAN HACIA DELANTE ──
-- La organización NO se escribe: es la ÚNICA a la que pertenece el USUARIO del director. Si tiene cero o más de una,
-- la primera fila de la salida lo dice a gritos y todo lo demás está leyendo NADA. La primera fila dice SIEMPRE qué
-- organización se lee, su nombre y cuántos documentos tiene: un id o una resolución equivocados no pueden pasar por
-- «no hay hallazgos».
-- ⚠️ a9625e93-af2a-4416-a465-5c2fa2a25bdf ES A LA VEZ EL ID DEL USUARIO DEL DIRECTOR Y EL DE LA ORGANIZACIÓN DEL
-- PILOTO (purgada el 25/10/2026). Es un accidente histórico del código de antes del 27/04/2026, que tomaba el id del
-- usuario como id de la organización. AQUÍ ES EL USUARIO. NO SE UNIFICA con ORG_DEL_PILOTO de SQL_SEG_02, que es el
-- mismo número con el otro significado: unificarlas rompe el rescate de llm_usage sin que salte nada.
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
  SELECT CASE WHEN r.org IS NOT NULL   -- la que se lee DE VERDAD, no la que se cuenta
              THEN 'organización leída: ' || r.org || ' · «' || coalesce(o.name, '¿sin nombre?') || '» · '
                   || (SELECT count(*) FROM public.documents d WHERE d.org_id = r.org) || ' documentos'
              ELSE '⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' || r.usuario || ' tiene ' || r.pertenencias
                   || ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.' END AS linea
  FROM resolucion r LEFT JOIN public.organizations o ON o.id::text = r.org
),
parametros AS (
  SELECT (SELECT org FROM resolucion) AS org,   -- ← la organización RESUELTA por el USUARIO (arriba)
         timestamptz '2026-10-21 00:00:00+02' AS desde,           -- ← DESDE
         timestamptz '2026-10-22 00:00:00+02' AS hasta            -- ← HASTA
),
-- LA TABLA DE PRECIOS, USD por millón de tokens: copia de lib/observability/llm-pricing.ts (ver la cabecera)
precios AS (
  SELECT * FROM (VALUES
    ('claude-haiku-4-5-20251001', 1.00, 5.00, 1.25, 0.10),
    ('claude-haiku-5-5',          0.10, 0.50, 0.125, 0.01),
    ('claude-sonnet-4-6',         3.00, 15.00, 3.75, 0.30)
  ) AS x(modelo, entrada, salida, escritura, lectura)
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type, ar.analysis->'llamadasAlModelo' AS reg,
         row_number() OVER (ORDER BY ar.created_at) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.created_at >= p.desde AND ar.created_at < p.hasta
    AND jsonb_typeof(ar.analysis->'llamadasAlModelo') = 'object'
),
peticiones AS (
  SELECT a.n, (x.p->>'n')::int AS pn, coalesce(x.p->>'etapa', '—') AS etapa, x.p->>'pareja' AS pareja, x.p->>'modelo' AS modelo,
         (x.p->>'vuelta')::int AS vuelta, (x.p->>'intento')::int AS intento, x.p->>'resultado' AS resultado,
         coalesce((x.p->'tokens'->>'entrada')::bigint, 0) AS te, coalesce((x.p->'tokens'->>'salida')::bigint, 0) AS ts,
         coalesce((x.p->'tokens'->>'escrituraCache')::bigint, 0) AS tw, coalesce((x.p->'tokens'->>'lecturaCache')::bigint, 0) AS tr,
         coalesce((x.p->>'latenciaMs')::bigint, 0) AS lat, coalesce((x.p->>'esperaMs')::bigint, 0) AS esp,
         coalesce((x.p->>'comienzoMs')::bigint, 0) AS com, (x.p->>'entradaEstimada')::bigint AS est
  FROM analisis a
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(a.reg->'peticiones') = 'array' THEN a.reg->'peticiones' ELSE '[]'::jsonb END) x(p)
),
con_coste AS (
  SELECT q.*, pr.modelo IS NOT NULL AS con_precio,
         q.te + q.tw + q.tr AS entrada_total,
         (q.te * pr.entrada + q.ts * pr.salida + q.tw * pr.escritura + q.tr * pr.lectura) / 1e6 AS coste,
         ((q.tw + q.tr) * pr.entrada - (q.tw * pr.escritura + q.tr * pr.lectura)) / 1e6 AS ahorro_cache
  FROM peticiones q LEFT JOIN precios pr ON pr.modelo = q.modelo
),
por_analisis AS (
  SELECT c.n, sum(c.coste) AS coste, sum(c.esp + c.lat) AS trabajo, sum(c.lat) AS en_peticion, sum(c.esp) AS en_espera,
         max(c.com + c.esp + c.lat) - min(c.com) AS duracion, sum(c.tw) AS escrito, sum(c.tr) AS leido, sum(c.ahorro_cache) AS ahorro,
         count(*) AS peticiones
  FROM con_coste c GROUP BY c.n
),
control AS (
  SELECT 1 AS orden, 'análisis con registro por llamada entre DESDE y HASTA: ' || (SELECT count(*) FROM analisis) AS medida,
         CASE WHEN (SELECT count(*) FROM analisis) = 0 THEN NULL ELSE true END AS ok
  UNION ALL
  SELECT 2, 'peticiones con un modelo que no está en la tabla de precios: ' || (SELECT count(*) FROM con_coste WHERE NOT con_precio) ||
            coalesce(' (' || (SELECT string_agg(DISTINCT modelo, ', ') FROM con_coste WHERE NOT con_precio) || ')', ''),
         (SELECT count(*) FROM con_coste WHERE NOT con_precio) = 0
  UNION ALL
  SELECT 3, 'análisis ' || a.n || ': nada fuera del detalle (si lo hay, las cifras por petición no son el total): ' ||
            coalesce(a.reg->'fueraDelDetalle'->>'peticiones', 'nada'),
         jsonb_typeof(a.reg->'fueraDelDetalle') IS DISTINCT FROM 'object'
  FROM analisis a
  UNION ALL
  SELECT 4, 'análisis ' || a.n || ': sinEtapa = ' || coalesce(a.reg->>'sinEtapa', 'FALTA'), coalesce((a.reg->>'sinEtapa')::int = 0, false)
  FROM analisis a
  UNION ALL
  SELECT 5, 'análisis ' || a.n || ': peticiones que salieron bien y no traen ningún token de entrada: ' ||
            (SELECT count(*) FROM con_coste c WHERE c.n = a.n AND c.resultado = 'ok' AND c.entrada_total = 0),
         (SELECT count(*) FROM con_coste c WHERE c.n = a.n AND c.resultado = 'ok' AND c.entrada_total = 0) = 0
  FROM analisis a
)
SELECT bloque, analisis, a, b, c
FROM (
  SELECT 'organización leída' AS bloque, NULL::text AS analisis, linea AS a,
         NULL::text AS b, NULL::text AS c, -1 AS o1, 0::bigint AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control' AS bloque, NULL::text AS analisis, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, orden AS o1, 0::bigint AS o2
  FROM control
  UNION ALL
  -- 1 · POR PETICIÓN (a y b): tokens, latencia, espera, y la estimación ÷4 contra la entrada real
  SELECT '1 · por petición', 'análisis ' || c.n,
         'petición ' || c.pn || ' · ' || c.etapa || ' · ' || coalesce(c.modelo, '—') || ' · vuelta ' || c.vuelta || ' intento ' || c.intento || ' · ' || coalesce(c.resultado, '—'),
         'entrada ' || c.te || ' · salida ' || c.ts || ' · caché escrita ' || c.tw || ' · caché leída ' || c.tr ||
           ' · latencia ' || c.lat || ' ms · espera ' || c.esp || ' ms · comienzo ' || c.com || ' ms',
         'ESTIMADA ÷4 ' || coalesce(c.est::text, '—') || ' · REAL (entrada + caché) ' || c.entrada_total ||
           ' · proporción estimada/real ' || CASE WHEN c.est IS NULL OR c.entrada_total = 0 THEN '—' ELSE round(c.est::numeric / c.entrada_total, 3)::text END,
         0, c.n * 1000 + c.pn
  FROM con_coste c
  UNION ALL
  -- 2 · POR ETAPA (a, c, d y f): tokens, coste y su porcentaje, caché, y petición contra espera
  SELECT '2 · por etapa', 'análisis ' || c.n, c.etapa,
         'peticiones ' || count(*) || ' · entrada ' || sum(c.te) || ' · salida ' || sum(c.ts) || ' · caché escrita ' || sum(c.tw) || ' · caché leída ' || sum(c.tr) ||
           ' · en petición ' || sum(c.lat) || ' ms · en espera ' || sum(c.esp) || ' ms',
         'coste ' || coalesce(round(sum(c.coste)::numeric, 6)::text, 'SIN PRECIO') || ' $ · ' ||
           coalesce(round(100 * sum(c.coste)::numeric / nullif((SELECT pa.coste FROM por_analisis pa WHERE pa.n = c.n), 0)::numeric, 1)::text, '—') || ' % del análisis' ||
           ' · ahorro de la caché ' || coalesce(round(sum(c.ahorro_cache)::numeric, 6)::text, '—') || ' $',
         1, c.n * 1000
  FROM con_coste c GROUP BY c.n, c.etapa
  UNION ALL
  -- 3 · POR ANÁLISIS (c, d, e y f): el coste total, la caché, la DURACIÓN al lado del TRABAJO, y el reparto
  SELECT '3 · por análisis', 'análisis ' || pa.n,
         to_char(a.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid · ' || a.document_name || ' · ' || a.analysis_type || ' · ' || pa.peticiones || ' peticiones',
         'DURACIÓN ' || pa.duracion || ' ms · TRABAJO (suma de las entradas) ' || pa.trabajo || ' ms · en petición ' || pa.en_peticion || ' ms (' ||
           coalesce(round(100 * pa.en_peticion::numeric / nullif(pa.trabajo, 0), 1)::text, '—') || ' %) · en espera ' || pa.en_espera || ' ms (' ||
           coalesce(round(100 * pa.en_espera::numeric / nullif(pa.trabajo, 0), 1)::text, '—') || ' %)',
         'coste ' || coalesce(round(pa.coste::numeric, 6)::text, 'SIN PRECIO') || ' $ · caché escrita ' || pa.escrito || ' · leída ' || pa.leido ||
           ' · ahorro ' || coalesce(round(pa.ahorro::numeric, 6)::text, '—') || ' $',
         0, pa.n
  FROM por_analisis pa JOIN analisis a ON a.n = pa.n
  UNION ALL
  -- 4 · LOS DOS ÷4, resumidos por análisis (b): cuántas peticiones tienen estimación y cuánto se separa de la real
  SELECT '4 · los dos ÷4', 'análisis ' || c.n,
         'peticiones con estimación: ' || count(*) FILTER (WHERE c.est IS NOT NULL AND c.entrada_total > 0) || ' de ' || count(*),
         'proporción estimada/real · mínima ' || coalesce(round(min(c.est::numeric / nullif(c.entrada_total, 0)), 3)::text, '—') ||
           ' · mediana ' || coalesce(round((percentile_cont(0.5) WITHIN GROUP (ORDER BY c.est::numeric / nullif(c.entrada_total, 0)))::numeric, 3)::text, '—') ||
           ' · máxima ' || coalesce(round(max(c.est::numeric / nullif(c.entrada_total, 0)), 3)::text, '—'),
         'suma estimada ' || coalesce(sum(c.est) FILTER (WHERE c.entrada_total > 0)::text, '—') || ' · suma real ' || sum(c.entrada_total) FILTER (WHERE c.est IS NOT NULL),
         0, c.n
  FROM con_coste c GROUP BY c.n
) t
ORDER BY (bloque <> 'organización leída'), bloque, o2, o1, a;
