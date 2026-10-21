-- ============================================================================
-- 3.1.1 · EL CONTROL DEL REGISTRO POR LLAMADA: ¿LLEGA AL JSONB, Y CON sinEtapa = 0?
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- No saca texto de ningún documento: el registro sólo lleva números, etapas,
-- modelos e ids (lib/observability/registro-de-llamadas.ts, cabecera).
--
-- QUÉ CONTESTA (arquitecto, 21/10/2026): el control que cierra el paso 4 del
-- 3.1.1. Desde el despliegue del paso 4, cada análisis guarda en su jsonb
-- `analysis.llamadasAlModelo`: una entrada por petición real al modelo. El
-- primer análisis guardado tiene que dar `sinEtapa = 0` —ninguna llamada sin
-- etiqueta de etapa—, y cada petición tiene que llevar una de las seis etapas
-- del análisis.
--
-- Esto NO es el medidor del paso 5 (tokens por etapa, coste, la comparación de
-- los dos ÷4): es sólo el control de que el registro llega y viene completo.
--
-- ✅ PROBADO ANTES DE ENTREGARLO en PGlite (claude/arneses/f311/, en la suite):
-- con un análisis con registro completo, todo OK; con una llamada sin etapa,
-- cae el 2; con una etapa que no es del análisis, cae el 3; sin ningún
-- análisis con registro en la ventana, el 1 sale NO APLICA y no OK.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros`. No se mira otra.    │
-- │ LO ÚNICO QUE TOCA EL DIRECTOR: DESDE, en hora de Madrid, con el formato  │
-- │ timestamptz 'AAAA-MM-DD HH:MM:SS+02' —un minuto antes de lanzar el       │
-- │ análisis de prueba—. ⚠️ Desde el 25/10/2026 a las 03:00 es «+01».         │
-- └──────────────────────────────────────────────────────────────────────────┘
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         timestamptz '2026-10-21 00:00:00+02' AS desde           -- ← DESDE
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type, ar.analysis->'llamadasAlModelo' AS reg
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.created_at >= p.desde
),
con_registro AS (
  SELECT a.*, row_number() OVER (ORDER BY a.created_at) AS n FROM analisis a WHERE jsonb_typeof(a.reg) = 'object'
),
peticiones AS (
  SELECT c.n, x.p
  FROM con_registro c
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(c.reg->'peticiones') = 'array' THEN c.reg->'peticiones' ELSE '[]'::jsonb END) x(p)
),
control AS (
  SELECT 1 AS orden,
         'análisis desde DESDE: ' || (SELECT count(*) FROM analisis) || ', de ellos con registro por llamada: ' || (SELECT count(*) FROM con_registro) AS medida,
         CASE WHEN (SELECT count(*) FROM con_registro) = 0 THEN NULL ELSE true END AS ok
  UNION ALL
  SELECT 2, 'análisis ' || c.n || ' (' || c.document_name || ', ' || c.analysis_type || '): sinEtapa = ' || coalesce(c.reg->>'sinEtapa', 'FALTA'),
         coalesce((c.reg->>'sinEtapa')::int = 0, false)
  FROM con_registro c
  UNION ALL
  SELECT 3, 'análisis ' || c.n || ': peticiones con una etapa que no es de las seis del análisis: ' ||
            (SELECT count(*) FROM peticiones q WHERE q.n = c.n AND coalesce(q.p->>'etapa', '') NOT IN ('rerank', 'juez', 'verificador', 'double_check', 'sintesis', 'estilo')),
         (SELECT count(*) FROM peticiones q WHERE q.n = c.n AND coalesce(q.p->>'etapa', '') NOT IN ('rerank', 'juez', 'verificador', 'double_check', 'sintesis', 'estilo')) = 0
  FROM con_registro c
  UNION ALL
  SELECT 4, 'análisis ' || c.n || ': las peticiones del juez llevan su pareja (sin pareja: ' ||
            (SELECT count(*) FROM peticiones q WHERE q.n = c.n AND q.p->>'etapa' = 'juez' AND coalesce(q.p->>'pareja', '') = '') || ')',
         (SELECT count(*) FROM peticiones q WHERE q.n = c.n AND q.p->>'etapa' = 'juez' AND coalesce(q.p->>'pareja', '') = '') = 0
  FROM con_registro c
)
SELECT bloque, analisis, a, b, c
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS analisis, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, orden AS o1, 0::bigint AS o2
  FROM control
  UNION ALL
  -- 1 · cada análisis con registro: cuándo, cuántas peticiones, y lo que se pasó de la guarda
  SELECT '1 · análisis con registro', 'análisis ' || c.n,
         to_char(c.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid · ' || c.document_name || ' · ' || c.analysis_type,
         'peticiones con detalle: ' || jsonb_array_length(coalesce(c.reg->'peticiones', '[]'::jsonb)) ||
           ' · fuera del detalle: ' || coalesce(c.reg->'fueraDelDetalle'->>'peticiones', 'ninguna'),
         'sinEtapa ' || coalesce(c.reg->>'sinEtapa', 'FALTA'), 0, c.n
  FROM con_registro c
  UNION ALL
  -- 2 · por etapa: peticiones, cuántas no salieron bien, y los intentos de más
  SELECT '2 · peticiones por etapa', 'análisis ' || q.n, coalesce(q.p->>'etapa', '—'),
         'peticiones ' || count(*) || ' · no ok ' || count(*) FILTER (WHERE q.p->>'resultado' <> 'ok') ||
           ' · intentos de más ' || count(*) FILTER (WHERE (q.p->>'intento')::int > 1) ||
           ' · repeticiones por JSON ' || count(*) FILTER (WHERE (q.p->>'vuelta')::int > 1),
         'modelos: ' || string_agg(DISTINCT q.p->>'modelo', ', '), 1, q.n
  FROM peticiones q GROUP BY q.n, q.p->>'etapa'
) t
ORDER BY bloque, o2, o1, a;
