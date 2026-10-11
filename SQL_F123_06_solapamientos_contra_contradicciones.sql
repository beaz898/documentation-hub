-- ============================================================================
-- F-123 · ¿CUANTOS MÁS SOLAPAMIENTOS EMITE EL JUEZ, MENOS CONTRADICCIONES? —
-- SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada. Sólo nombres, fechas y
-- cifras; ni un carácter del texto.
-- ✅ PROBADO ANTES DE ENTREGARLO (11/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): cuenta por pareja lo que el juez emitió (lo que
-- sobrevive más lo que la puerta y la cascada tiraron), deja fuera las
-- contradicciones del diff de tablas y la otra organización, agrupa el resumen
-- por número de solapamientos, y el control sale FALLA cuando un análisis tiene
-- distinto número de lecturas que de juicios.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (hipótesis DEL ARQUITECTO, viva y no medida, 11/10/2026):
-- «cuantos más solapamientos emite el juez en una pasada, menos
-- contradicciones emite». Hay un contraejemplo (07/10: 7 solapamientos y 2
-- contradicciones). Esta consulta lo mira en TODA la población guardada.
--
-- LA UNIDAD ES LA PAREJA: el juez hace una llamada por (analizado, candidato), y
-- el techo de «máximo 10 contradicciones, 5 inconsistencias menores y 10
-- solapamientos» va en el prompt de cada llamada (lib/analysis/judge.ts:850).
--
-- QUÉ ES «EMITIDO» AQUÍ, reconstruido de lo que guarda el juicio (las mismas
-- piezas que SQL_B357):
--   · contradicciones emitidas = las que sobreviven en `contradictions` (SIN las
--     de origen diff_tabular, que no son del juez) + las que tiró la puerta
--     (`descartesPorCita` tipo contradicción) + las que mató la cascada
--     (`discarded`: descartado.* salvo equivalentes, y r2.sin_ancla) + las
--     reclasificadas a solapamiento (descartado.equivalentes);
--   · solapamientos emitidos = los del juez que sobreviven en `overlappingContent`
--     (sin los estructurales ni los reclasificados) + los que tiró la puerta
--     (`descartesPorCita` tipo solapamiento).
--   ⚠️ NO ENTRAN: lo que tiró la FRONTERA por venir mal formado (sólo hay
--   recuento, y mezclado) y los `descartesPorCitaOmitidos` (los que no cupieron
--   en el tope de 10 descartes guardados; mezclan los dos tipos): van en su
--   columna. Y ANTES DEL 02/10/2026 no se guardaban los descartes de la puerta
--   (B.313): la columna `trae_descartes` dice si la pareja es comparable.
--
-- EL TECHO DE SOLAPAMIENTOS DE CADA PASADA: 5 hasta el commit 568a77ab
-- (07/10/2026 10:03, hora de Madrid) y 10 después. ⚠️ Es la hora del COMMIT, no
-- la del despliegue: las pasadas de esa mañana alrededor de esa hora hay que
-- mirarlas a mano.
--
-- ⚠️ LA POBLACIÓN ES LA QUE QUEDA: los análisis de NOR-11 y NOR-10 anteriores al
-- 10/10 se borraron con los documentos (B.367). Las diez pasadas de SQL_B357 NO
-- están; las cinco del 11/10 sí.
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   · análisis cuyo número de `lecturaDeLasParejas` no coincide con el de
--     `judgments` (van emparejados por posición, judge.ts:1094): tiene que ser 0;
--   · parejas con solapamientos «del juez» negativos (más reclasificadas que
--     entradas sin estructura, imposible si el cálculo es bueno): tiene que ser 0.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type, ar.analysis
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
),
pareja AS (
  SELECT a.id AS analisis_id, a.created_at, a.document_name AS analizado, a.analysis_type, j,
         (SELECT l FROM jsonb_array_elements(
                  CASE WHEN jsonb_typeof(a.analysis->'lecturaDeLasParejas') = 'array'
                       THEN a.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
           WHERE l->>'documentId' = j->>'documentId' LIMIT 1) AS lectura
  FROM analisis a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(a.analysis->'judgments') = 'array' THEN a.analysis->'judgments' ELSE '[]'::jsonb END) j
),
cuentas AS (
  SELECT p.*,
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'contradictions', '[]'::jsonb)) c
      WHERE coalesce(c->>'origen', '') <> 'diff_tabular')                                   AS c_sobreviven,
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'descartesPorCita', '[]'::jsonb)) d
      WHERE d->>'tipo' = 'contradiccion')                                                    AS c_puerta,
    (SELECT coalesce(sum(value::int), 0) FROM jsonb_each_text(
       CASE WHEN jsonb_typeof(p.j->'discarded') = 'object' THEN p.j->'discarded' ELSE '{}'::jsonb END)
      WHERE (key LIKE 'descartado.%' AND key <> 'descartado.equivalentes') OR key = 'r2.sin_ancla') AS c_cascada,
    (SELECT coalesce(sum(value::int), 0) FROM jsonb_each_text(
       CASE WHEN jsonb_typeof(p.j->'discarded') = 'object' THEN p.j->'discarded' ELSE '{}'::jsonb END)
      WHERE key = 'descartado.equivalentes')                                                 AS c_reclasificadas,
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'overlappingContent', '[]'::jsonb)) o
      WHERE o->>'confirmedBy' IS NULL)                                                       AS s_sin_estructura,
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'descartesPorCita', '[]'::jsonb)) d
      WHERE d->>'tipo' = 'solapamiento')                                                     AS s_puerta,
    coalesce((p.j->>'descartesPorCitaOmitidos')::int, 0)                                     AS omitidos,
    (jsonb_typeof(p.j->'descartesPorCita') = 'array'
       OR p.created_at >= timestamptz '2026-10-02 00:00:00+02')                              AS trae_descartes
  FROM pareja p
),
filas AS (
  SELECT analisis_id, created_at, analizado, analysis_type, j->>'documentName' AS candidato,
         lectura->>'regimen' AS regimen,
         CASE WHEN created_at < timestamptz '2026-10-07 10:03:00+02' THEN 5 ELSE 10 END AS techo_solapamientos,
         (s_sin_estructura - c_reclasificadas) + s_puerta                    AS solapamientos_emitidos,
         c_sobreviven + c_puerta + c_cascada + c_reclasificadas              AS contradicciones_emitidas,
         c_sobreviven AS contradicciones_publicables,
         omitidos, trae_descartes,
         (s_sin_estructura - c_reclasificadas) AS s_del_juez
  FROM cuentas
),
control AS (
  SELECT 'análisis con lecturas y juicios que NO cuadran (tiene que ser 0)' AS medida,
         count(*) FILTER (WHERE jsonb_typeof(analysis->'lecturaDeLasParejas') = 'array'
                            AND jsonb_typeof(analysis->'judgments') = 'array'
                            AND jsonb_array_length(analysis->'lecturaDeLasParejas')
                                <> jsonb_array_length(analysis->'judgments'))::bigint AS valor
  FROM analisis
  UNION ALL
  SELECT 'parejas con solapamientos del juez negativos (tiene que ser 0)',
         count(*) FILTER (WHERE s_del_juez < 0)::bigint FROM filas
)
SELECT bloque, a, b, c, d, e, f, g, h, i
FROM (
  -- 0 · CONTROL
  SELECT '0 · control' AS bloque, CASE WHEN valor = 0 THEN 'OK' ELSE 'FALLA' END AS a,
         medida || ': ' || valor AS b, NULL::text AS c, NULL::text AS d, NULL::text AS e,
         NULL::text AS f, NULL::text AS g, NULL::text AS h, NULL::text AS i, 0 AS orden, NULL::timestamptz AS cuando
  FROM control
  UNION ALL
  -- 1 · UNA FILA POR PAREJA. a=fecha · b=analizado · c=candidato · d=tipo · e=régimen ·
  --     f=techo · g=solapamientos emitidos · h=contradicciones emitidas · i=omitidos / comparable
  SELECT '1 · parejas',
         to_char(created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC',
         analizado, candidato, analysis_type, coalesce(regimen, '(sin lectura)'),
         techo_solapamientos::text, solapamientos_emitidos::text, contradicciones_emitidas::text,
         'omitidos ' || omitidos || CASE WHEN trae_descartes THEN '' ELSE ' · ANTES DEL 02/10: NO COMPARABLE' END,
         1, created_at
  FROM filas
  UNION ALL
  -- 2 · EL RESUMEN QUE CONTESTA LA HIPÓTESIS, sólo con parejas comparables (desde el
  --     02/10). a=solapamientos emitidos · b=parejas · c=media de contradicciones ·
  --     d=máximo · e=parejas con 0 contradicciones · f=techo de esas pasadas
  SELECT '2 · resumen por solapamientos (desde el 02/10)',
         solapamientos_emitidos::text, count(*)::text,
         round(avg(contradicciones_emitidas), 2)::text, max(contradicciones_emitidas)::text,
         count(*) FILTER (WHERE contradicciones_emitidas = 0)::text,
         string_agg(DISTINCT techo_solapamientos::text, ',' ),
         NULL, NULL, NULL, 2, NULL
  FROM filas
  WHERE trae_descartes
  GROUP BY solapamientos_emitidos
) t
ORDER BY bloque, orden, cuando, (CASE WHEN bloque LIKE '2%' THEN a::int END), b;
