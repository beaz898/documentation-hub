-- ============================================================================
-- F-123 · LA SEGUNDA LECTURA: QUÉ DIJO EL JUEZ, ENTERO, EN UNA PASADA DE NOR-11
-- CONTRA CLI-13 — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
-- ⚠️ SACA TEXTO DE DOCUMENTO EN CANTIDAD, SIN RECORTAR: todas las citas del juez
-- enteras. Son NOR-11 y CLI-13, los dos documentos SEMBRADOS del corpus de
-- pruebas, NO de un cliente.
-- ✅ PROBADO ANTES DE ENTREGARLO (11/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): elige la pasada por su número de orden del día, saca
-- una fila por elemento con su tipo y sin recortar el texto (una cita de 400
-- caracteres sale con 400), separa contradicción de inconsistencia menor, y el
-- control sale FALLA cuando los recuentos no cuadran con los del log y cuando el
-- día no tiene las 5 pasadas.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 11/10/2026): con SQL_F123_07 (si las frases están en
-- el texto), cierra el recorrido: la salida completa del único tramo donde se
-- pierde algo. El resultado es uno de tres, comprobable: (a) las frases no están;
-- (b) están y el juez habló de esas zonas pero las clasificó como solapamiento
-- o como exclusivo del nuevo; (c) están y el juez no las menciona.
--
-- ⚠️ CÓMO SE ELIGE LA PASADA: por su NÚMERO DE ORDEN entre los análisis rápidos
-- de NOR-11 del día, no por la hora, porque la hora guardada es la del FINAL del
-- análisis (B.82, 05/10) y la del log es la de inicio y va en UTC. La de las 09:08
-- es la primera: `pasada = 1`. Para ver otra, cambiar ese número (1 a 5). La
-- salida enseña la hora guardada de la elegida para cotejarla.
--
-- DE DÓNDE SALE CADA FILA: la entrada de `analysis->'judgments'` de la pareja con
-- CLI-13 (pipeline.ts:993): `contradictions` (las que sobrevivieron; separadas
-- por `severity` en contradicción e inconsistencia menor; una contradicción no
-- tiene campo de descripción, sólo `topic`), `overlappingContent` (todas; las
-- `confirmedBy = 'estructura'` no son del juez y se marcan), `uniqueToNewDoc`,
-- `overlapPercent` y `verdict`, y `descartesPorCita` (B.313: las dos citas
-- completas, el lado que falló y el paso donde se rindió cada lado).
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR. Los recuentos esperados van en
-- `parametros` y son los del LOG de esa pasada (1 contradicción y 7
-- solapamientos con CLI-13). El log los cuenta ANTES de la puerta de citas
-- (judge.ts:898-904), así que se comparan con lo que sobrevive MÁS lo que la
-- puerta descartó de cada tipo:
--   · contradicciones (todas las severidades) + descartes de tipo contradicción;
--   · solapamientos del juez (sin los estructurales) + descartes de tipo
--     solapamiento;
--   · y el día tiene que tener 5 análisis rápidos de NOR-11, y la pareja con
--     CLI-13 tiene que existir en la pasada elegida.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         date '2026-10-11' AS dia,
         1 AS pasada,                        -- ← 1 = la de las 09:08; 2 a 5, las siguientes
         1 AS esperado_contradicciones,      -- ← del log de esa pasada
         7 AS esperado_solapamientos,        -- ← del log de esa pasada
         5 AS esperado_pasadas_del_dia
),
del_dia AS (
  SELECT ar.id, ar.created_at, ar.analysis,
         row_number() OVER (ORDER BY ar.created_at) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org
    AND ar.document_name ILIKE 'NOR-11%'
    AND ar.analysis_type = 'quick'
    AND (ar.created_at AT TIME ZONE 'Europe/Madrid')::date = p.dia
),
elegida AS (
  SELECT d.* FROM del_dia d, parametros p WHERE d.n = p.pasada
),
juicio AS (
  SELECT e.created_at, j
  FROM elegida e
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(e.analysis->'judgments') = 'array' THEN e.analysis->'judgments' ELSE '[]'::jsonb END) j
  WHERE j->>'documentName' ILIKE 'CLI-13%'
),
elementos AS (
  -- contradicciones e inconsistencias menores, tal como sobrevivieron
  SELECT CASE WHEN c->>'severity' = 'minor_inconsistency' THEN '2 · inconsistencia menor' ELSE '1 · contradicción' END AS tipo,
         ord AS n, c->>'topic' AS tema, c->>'newDocSays' AS cita_nuevo, c->>'existingDocSays' AS cita_existente,
         concat_ws(' · ', 'severity: ' || coalesce(c->>'severity', '—'), 'confirmedBy: ' || coalesce(c->>'confirmedBy', '—'),
                   CASE WHEN c->>'origen' = 'diff_tabular' THEN 'origen: diff_tabular (NO es del juez)' END) AS detalle
  FROM juicio, jsonb_array_elements(coalesce(j->'contradictions', '[]'::jsonb)) WITH ORDINALITY AS x(c, ord)
  UNION ALL
  -- todos los solapamientos
  SELECT '3 · solapamiento', ord, o->>'description', o->>'evidenceInNewDoc', o->>'evidence',
         CASE WHEN o->>'confirmedBy' = 'estructura' THEN 'confirmedBy: estructura (NO es del juez)' ELSE 'del juez' END
  FROM juicio, jsonb_array_elements(coalesce(j->'overlappingContent', '[]'::jsonb)) WITH ORDINALITY AS x(o, ord)
  UNION ALL
  -- lo que el juez dice que es exclusivo del documento nuevo
  SELECT '4 · exclusivo del nuevo (uniqueToNewDoc)', ord, u, NULL, NULL, NULL
  FROM juicio, jsonb_array_elements_text(coalesce(j->'uniqueToNewDoc', '[]'::jsonb)) WITH ORDINALITY AS x(u, ord)
  UNION ALL
  -- el veredicto de la pareja
  SELECT '5 · veredicto', 1, 'overlapPercent: ' || coalesce(j->>'overlapPercent', '—') || ' · verdict: ' || coalesce(j->>'verdict', '—'),
         NULL, NULL, NULL
  FROM juicio
  UNION ALL
  -- lo que descartó la puerta de citas, con las dos citas completas
  SELECT '6 · descarte de la puerta (' || coalesce(d->>'tipo', '?') || ')', ord, d->>'tema', d->>'citaNuevo', d->>'citaExistente',
         concat_ws(' · ', 'lado fallido: ' || coalesce(d->>'ladoFallido', '—'),
                   'nuevo: ' || coalesce(d->'nuevo'->>'paso', '—') || CASE WHEN (d->'nuevo'->>'verificada')::boolean THEN ' (verificada)' ELSE '' END,
                   'existente: ' || coalesce(d->'existente'->>'paso', '—') || CASE WHEN (d->'existente'->>'verificada')::boolean THEN ' (verificada)' ELSE '' END,
                   'huella: ' || coalesce(d->>'hash', '—'))
  FROM juicio, jsonb_array_elements(coalesce(j->'descartesPorCita', '[]'::jsonb)) WITH ORDINALITY AS x(d, ord)
),
recuentos AS (
  SELECT
    (SELECT count(*) FROM juicio)                                                         AS parejas_cli13,
    (SELECT count(*) FROM del_dia)                                                        AS pasadas_del_dia,
    (SELECT count(*) FROM elementos WHERE tipo IN ('1 · contradicción', '2 · inconsistencia menor')
                                      AND coalesce(detalle, '') NOT LIKE '%diff_tabular%')
      + (SELECT count(*) FROM elementos WHERE tipo = '6 · descarte de la puerta (contradiccion)') AS contradicciones,
    (SELECT count(*) FROM elementos WHERE tipo = '3 · solapamiento' AND detalle = 'del juez')
      + (SELECT count(*) FROM elementos WHERE tipo = '6 · descarte de la puerta (solapamiento)')  AS solapamientos
),
control AS (
  SELECT 'pasadas rápidas de NOR-11 ese día: esperado ' || p.esperado_pasadas_del_dia || ', medido ' || r.pasadas_del_dia AS medida,
         r.pasadas_del_dia = p.esperado_pasadas_del_dia AS ok
  FROM recuentos r, parametros p
  UNION ALL
  SELECT 'pareja con CLI-13 en la pasada elegida: esperado 1, medido ' || r.parejas_cli13, r.parejas_cli13 = 1
  FROM recuentos r
  UNION ALL
  SELECT 'contradicciones (sobreviven + puerta) contra el log: esperado ' || p.esperado_contradicciones || ', medido ' || r.contradicciones,
         r.contradicciones = p.esperado_contradicciones
  FROM recuentos r, parametros p
  UNION ALL
  SELECT 'solapamientos del juez (sobreviven + puerta) contra el log: esperado ' || p.esperado_solapamientos || ', medido ' || r.solapamientos,
         r.solapamientos = p.esperado_solapamientos
  FROM recuentos r, parametros p
)
SELECT tipo, n, tema, cita_nuevo, cita_existente, detalle
FROM (
  SELECT '0 · control' AS tipo, NULL::bigint AS n, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS tema,
         medida AS cita_nuevo, NULL::text AS cita_existente, NULL::text AS detalle
  FROM control
  UNION ALL
  SELECT '0 · pasada elegida', NULL,
         to_char(e.created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC (hora guardada: la del FINAL del análisis)',
         NULL, NULL, NULL
  FROM elegida e
  UNION ALL
  SELECT tipo, n, tema, cita_nuevo, cita_existente, detalle FROM elementos
) t
ORDER BY tipo, n;
