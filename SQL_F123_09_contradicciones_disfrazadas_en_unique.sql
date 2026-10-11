-- ============================================================================
-- F-123 · ¿ES SISTEMÁTICO? CADA ENTRADA DE `uniqueToNewDoc` DE TODOS LOS
-- ANÁLISIS, CON LAS SEÑALES DE CONTRADICCIÓN DISFRAZADA — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
-- ⚠️ SACA TEXTO DEL JUEZ: cada entrada de `uniqueToNewDoc` es una frase que el
-- modelo escribió sobre el documento analizado (no una cita literal, pero puede
-- nombrar datos del documento). Organización del piloto, corpus de pruebas.
-- ✅ PROBADO ANTES DE ENTREGARLO (11/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): saca una fila por entrada con fecha, analizado y
-- candidato; marca las señales sin distinguir mayúsculas ni acentos (y «no» sólo
-- como palabra suelta, no dentro de «norma»); y el control positivo sale FALLA
-- si la entrada de LUGAR de la pasada de las 09:08 del 11/10 no aparece.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 11/10/2026): el 11/10 a las 09:08:33 UTC el juez puso
-- la trampa LUGAR en `uniqueToNewDoc` («Punto de retirada centralizado ubicado en
-- clínica de Chamberí (no Retiro como dice CLI-13)»). ¿Pasa más veces? Las
-- SEÑALES son objetivas y no interpretan; una entrada con señal es candidata a
-- contradicción disfrazada, no una contradicción probada:
--   · «no» como palabra suelta; «en vez de»; «mientras»; «frente a»;
--     «a diferencia de»; «dice»;
--   · un código de documento del corpus (CLI-nn, NOR-nn, OPE-nn, RRHH-nn,
--     MKT-nn) dentro del texto.
--
-- POR DÓNDE EMPEZAR (bloque 1): las cinco pasadas rápidas de NOR-11 del 11/10, y
-- si la entrada de LUGAR (Chamberí y Retiro en la misma entrada) está en las
-- cinco. Después, el bloque 3 con todas, y el 2 con el resumen.
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   · CONTROL POSITIVO: la entrada de LUGAR de la pasada de las 09:08:33 UTC del
--     11/10 TIENE que aparecer, con sus dos señales («no» y «dice» y el código
--     CLI-13). Si no aparece, la consulta está mal, no la base;
--   · y el número de entradas del bloque 3 tiene que ser igual a la suma de las
--     longitudes de `uniqueToNewDoc` de todas las parejas.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
parejas AS (
  SELECT ar.created_at, ar.document_name AS analizado, ar.analysis_type, j->>'documentName' AS candidato, j
  FROM public.analysis_results ar
  CROSS JOIN piloto
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) j
  WHERE ar.org_id = piloto.org
),
entradas AS (
  SELECT p.created_at, p.analizado, p.analysis_type, p.candidato, x.ord AS n, x.u AS texto,
         translate(lower(x.u), 'áéíóúüñ', 'aeiouun') AS t
  FROM parejas p
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(p.j->'uniqueToNewDoc') = 'array' THEN p.j->'uniqueToNewDoc' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(u, ord)
),
marcadas AS (
  SELECT e.*,
         concat_ws(', ',
           CASE WHEN t ~ '(^|[^a-z])no([^a-z]|$)' THEN '«no»' END,
           CASE WHEN t LIKE '%en vez de%' THEN '«en vez de»' END,
           CASE WHEN t LIKE '%mientras%' THEN '«mientras»' END,
           CASE WHEN t LIKE '%frente a%' THEN '«frente a»' END,
           CASE WHEN t LIKE '%a diferencia de%' THEN '«a diferencia de»' END,
           CASE WHEN t ~ '(^|[^a-z])dice([^a-z]|$)' THEN '«dice»' END,
           CASE WHEN t ~ '(cli|nor|ope|rrhh|mkt)-[0-9]+' THEN 'código ' || upper(substring(t from '(?:cli|nor|ope|rrhh|mkt)-[0-9]+')) END
         ) AS senales,
         (t LIKE '%chamberi%' AND t LIKE '%retiro%') AS es_lugar
  FROM entradas e
),
control AS (
  SELECT 'control positivo: la entrada de LUGAR de las 09:08:33 UTC del 11/10, con «no», «dice» y CLI-13' AS medida,
         EXISTS (SELECT 1 FROM marcadas
                  WHERE es_lugar AND analizado ILIKE 'NOR-11%'
                    AND created_at >= timestamptz '2026-10-11 09:08:00+00'
                    AND created_at <  timestamptz '2026-10-11 09:10:00+00'
                    AND senales LIKE '%«no»%' AND senales LIKE '%«dice»%' AND senales LIKE '%CLI-13%') AS ok
  UNION ALL
  SELECT 'entradas del bloque 3 = suma de longitudes de uniqueToNewDoc',
         (SELECT count(*) FROM marcadas)
         = (SELECT coalesce(sum(jsonb_array_length(j->'uniqueToNewDoc')), 0) FROM parejas
             WHERE jsonb_typeof(j->'uniqueToNewDoc') = 'array')
)
SELECT bloque, fecha, analizado, candidato, n, senales, texto
FROM (
  SELECT '0 · control' AS bloque, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS fecha, medida AS analizado,
         NULL::text AS candidato, NULL::bigint AS n, NULL::text AS senales, NULL::text AS texto, NULL::timestamptz AS cuando
  FROM control
  UNION ALL
  -- 1 · LO MÁS BARATO: las pasadas rápidas de NOR-11 del 11/10 y si llevan la entrada de LUGAR.
  SELECT '1 · NOR-11 del 11/10: ¿está LUGAR?',
         to_char(p.created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC', p.analizado, p.candidato,
         (SELECT m.n FROM marcadas m WHERE m.created_at = p.created_at AND m.candidato = p.candidato AND m.es_lugar LIMIT 1),
         CASE WHEN EXISTS (SELECT 1 FROM marcadas m WHERE m.created_at = p.created_at AND m.candidato = p.candidato AND m.es_lugar)
              THEN 'SÍ está' ELSE 'NO está' END,
         (SELECT m.texto FROM marcadas m WHERE m.created_at = p.created_at AND m.candidato = p.candidato AND m.es_lugar LIMIT 1),
         p.created_at
  FROM parejas p
  WHERE p.analizado ILIKE 'NOR-11%' AND p.candidato ILIKE 'CLI-13%' AND p.analysis_type = 'quick'
    AND (p.created_at AT TIME ZONE 'Europe/Madrid')::date = date '2026-10-11'
  UNION ALL
  -- 2 · RESUMEN: cuántas entradas en total y cuántas con alguna señal.
  SELECT '2 · resumen', 'entradas: ' || count(*), 'con alguna señal: ' || count(*) FILTER (WHERE senales <> ''),
         'con código de documento: ' || count(*) FILTER (WHERE senales LIKE '%código%'),
         NULL, NULL, NULL, NULL
  FROM marcadas
  UNION ALL
  -- 3 · TODAS LAS ENTRADAS, las que tienen señal primero.
  SELECT '3 · entradas', to_char(created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC', analizado, candidato, n,
         nullif(senales, ''), texto, created_at
  FROM marcadas
) t
ORDER BY bloque, (senales IS NULL), cuando, candidato, n;
