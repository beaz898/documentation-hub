-- ============================================================================
-- F-124 · LA MEDIDA DE LA FASE 1.0: LAS SEIS PASADAS DE NOR-11 DEL 12/10, LEÍDAS
-- DE LA BASE — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
-- ⚠️ SACA TEXTO DE DOCUMENTO: citas enteras del juez y entradas de
-- `uniqueToNewDoc`. Son NOR-11 y CLI-13, documentos SEMBRADOS del corpus de
-- pruebas, NO de un cliente.
-- ✅ PROBADO ANTES DE ENTREGARLO (12/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): con seis pasadas como las del log, todos los controles
-- salen OK; y sale FALLA cuando falta una pasada, cuando una pasada publica una
-- tercera contradicción de otra especie, cuando el descarte de LUGAR no está en
-- la puerta, cuando los recuentos no cuadran con el log, y cuando la entrada de
-- LUGAR del 11/10 a las 09:08:33 UTC no está (control positivo del detector).
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 12/10/2026), para las seis pasadas rápidas de NOR-11
-- del 12/10 con el prompt de 00ed4235:
--   a) bloque 1: las entradas de `uniqueToNewDoc` de la pareja con CLI-13, cuántas
--      tiene cada pasada (el tope del prompt es 10), cuántas NOMBRAN al candidato
--      de su pareja (la condición del rescate de F-124 P1(b), la que contaría
--      `rescatadas_de_caja`: califica P-ARQ-F124-1) y si la de LUGAR sigue ahí.
--      Bloque 4: el texto de cada entrada;
--   b) bloque 2: las contradicciones PUBLICADAS (`analysis->'discrepancies'`), de
--      todos los candidatos, con sus dos citas enteras y su especie; y bloque 3,
--      lo que la puerta de citas descartó como contradicción, con la cita entera
--      y su longitud (el log la corta a 200: `judge.ts:455`).
--
-- ⚠️ QUÉ PASADAS: las rápidas de NOR-11 cuya hora guardada (la del FINAL del
-- análisis, B.82) cae entre el push de 00ed4235 (19:26:55 UTC; reflog de
-- origin/main, 21:26:55 hora de Madrid) y las 20:30 UTC. El log va en UTC: la
-- primera pasada empieza a las 19:28:41 y la última termina a las 20:23:21.
-- El bloque 0 enseña además cuántas pasadas de NOR-11 hubo el 12/10 ANTES del
-- push, que no entran en la medida.
--
-- ESPECIE de una contradicción publicada (bloque 2), por su `topic`, sin
-- distinguir mayúsculas ni acentos: PLAZO si dice «plazo»; NEGACIÓN si dice
-- «color» y «contenedor»; LUGAR si dice «retirada» o «ubicacion»; si no, OTRA.
-- Una OTRA es la cuarta especie: se lee su texto antes de llamarla falso positivo.
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   · hay exactamente 6 pasadas en la ventana, y cada una tiene la pareja con
--     CLI-13;
--   · por pasada, contradicciones del juez con CLI-13 (sobreviven + descartes de
--     la puerta de tipo contradicción) = 3, y solapamientos del juez (sin los
--     estructurales) + descartes de tipo solapamiento = lo que dijo el log
--     (8, 8, 8, 9, 8, 8, en orden de hora);
--   · por pasada, 2 publicadas, las dos de CLI-13, una PLAZO y una NEGACIÓN, y la
--     columna `contradictions_found` dice 2;
--   · ninguna publicada de especie OTRA en las seis;
--   · por pasada, la puerta guardó el descarte de LUGAR (tipo contradicción, la
--     cita del nuevo con «Chamberí»);
--   · CONTROL POSITIVO DEL DETECTOR DE LUGAR: la entrada de LUGAR de la pasada
--     del 11/10 a las 09:08:33 UTC (la de SQL_F123_09) TIENE que salir marcada
--     como LUGAR y como que nombra a CLI-13. Si no sale, el detector está mal y
--     el «0» del bloque 1 no vale nada.
--     ⚠️ Esa fila es la que leyó SQL_F123_09 el 11/10. Si NOR-11 se ha borrado y
--     resubido desde entonces, deleteDocument se llevó sus análisis (B.112) y este
--     control sale FALLA por falta de la fila, no por el detector: si pasa, se dice
--     antes de leer el bloque 1.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         timestamptz '2026-10-12 19:26:55+00' AS desde,          -- ← el push de 00ed4235
         timestamptz '2026-10-12 20:30:00+00' AS hasta,
         6 AS esperado_pasadas,
         3 AS esperado_contradicciones_del_juez,                 -- ← del log, por pasada
         '{8,8,8,9,8,8}'::int[] AS esperado_solapamientos        -- ← del log, en orden de hora
),
rapidas AS (
  SELECT ar.id, ar.created_at, ar.contradictions_found, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-11%' AND ar.analysis_type = 'quick'
),
pasadas AS (
  SELECT r.*, row_number() OVER (ORDER BY r.created_at) AS n
  FROM rapidas r, parametros p
  WHERE r.created_at >= p.desde AND r.created_at < p.hasta
),
-- la pareja con CLI-13 de cada pasada; y, para el control positivo, la del 11/10 a las 09:08:33
pareja AS (
  SELECT pa.n, pa.created_at, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array' THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
  WHERE j->>'documentName' ILIKE 'CLI-13%'
),
pareja_control AS (
  SELECT j
  FROM rapidas r
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(r.analysis->'judgments') = 'array' THEN r.analysis->'judgments' ELSE '[]'::jsonb END) j
  WHERE j->>'documentName' ILIKE 'CLI-13%'
    AND r.created_at >= timestamptz '2026-10-11 09:08:00+00' AND r.created_at < timestamptz '2026-10-11 09:10:00+00'
),
-- a) las entradas de uniqueToNewDoc, marcadas
unicas AS (
  SELECT 'medida' AS de, pr.n, x.ord, x.u AS texto, translate(lower(x.u), 'áéíóúüñ', 'aeiouun') AS t
  FROM pareja pr
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(pr.j->'uniqueToNewDoc') = 'array' THEN pr.j->'uniqueToNewDoc' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(u, ord)
  UNION ALL
  SELECT 'control', 0, x.ord, x.u, translate(lower(x.u), 'áéíóúüñ', 'aeiouun')
  FROM pareja_control pc
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE WHEN jsonb_typeof(pc.j->'uniqueToNewDoc') = 'array' THEN pc.j->'uniqueToNewDoc' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(u, ord)
),
unicas_marcadas AS (
  SELECT u.*,
         (t ~ 'cli-0*13([^0-9]|$)') AS nombra_candidato,
         (t LIKE '%chamberi%' OR t LIKE '%retiro%' OR t LIKE '%punto de retirada%') AS es_lugar
  FROM unicas u
),
-- b) las publicadas, de todos los candidatos
publicadas AS (
  SELECT pa.n, x.ord, d->>'existingDocument' AS candidato, d->>'severity' AS severity, d->>'confirmedBy' AS confirmado,
         d->>'topic' AS tema, d->>'newDocSays' AS cita_nuevo, d->>'existingDocSays' AS cita_existente,
         translate(lower(coalesce(d->>'topic', '')), 'áéíóúüñ', 'aeiouun') AS t
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(d, ord)
),
publicadas_especie AS (
  SELECT p.*,
         CASE WHEN t LIKE '%plazo%' THEN 'PLAZO'
              WHEN t LIKE '%color%' AND t LIKE '%contenedor%' THEN 'NEGACIÓN'
              WHEN t LIKE '%retirada%' OR t LIKE '%ubicacion%' THEN 'LUGAR'
              ELSE 'OTRA' END AS especie
  FROM publicadas p
),
-- lo que la puerta descartó en la pareja con CLI-13
descartes AS (
  SELECT pr.n, x.ord, d->>'tipo' AS tipo, d->>'tema' AS tema, d->>'citaNuevo' AS cita_nuevo, d->>'citaExistente' AS cita_existente,
         concat_ws(' · ', 'lado fallido: ' || coalesce(d->>'ladoFallido', '—'),
                   'nuevo: ' || coalesce(d->'nuevo'->>'paso', '—'),
                   'existente: ' || coalesce(d->'existente'->>'paso', '—')) AS detalle
  FROM pareja pr
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pr.j->'descartesPorCita') = 'array' THEN pr.j->'descartesPorCita' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(d, ord)
),
por_pasada AS (
  SELECT pa.n, pa.created_at, pa.contradictions_found,
         (SELECT count(*) FROM pareja pr WHERE pr.n = pa.n) AS parejas_cli13,
         (SELECT coalesce(sum(jsonb_array_length(coalesce(pr.j->'contradictions', '[]'::jsonb))), 0) FROM pareja pr WHERE pr.n = pa.n)
           + (SELECT count(*) FROM descartes d WHERE d.n = pa.n AND d.tipo = 'contradiccion') AS contradicciones_del_juez,
         (SELECT count(*) FROM pareja pr, jsonb_array_elements(coalesce(pr.j->'overlappingContent', '[]'::jsonb)) o
           WHERE pr.n = pa.n AND coalesce(o->>'confirmedBy', '') <> 'estructura')
           + (SELECT count(*) FROM descartes d WHERE d.n = pa.n AND d.tipo = 'solapamiento') AS solapamientos_del_juez,
         (SELECT count(*) FROM publicadas_especie p WHERE p.n = pa.n) AS publicadas,
         (SELECT count(*) FROM publicadas_especie p WHERE p.n = pa.n AND p.candidato ILIKE 'CLI-13%') AS publicadas_cli13,
         (SELECT string_agg(p.especie, ' + ' ORDER BY p.especie) FROM publicadas_especie p WHERE p.n = pa.n) AS especies,
         (SELECT count(*) FROM descartes d WHERE d.n = pa.n AND d.tipo = 'contradiccion' AND d.cita_nuevo ILIKE '%Chamber%') AS lugar_en_la_puerta,
         (SELECT count(*) FROM unicas_marcadas u WHERE u.de = 'medida' AND u.n = pa.n) AS unicas,
         (SELECT count(*) FROM unicas_marcadas u WHERE u.de = 'medida' AND u.n = pa.n AND u.nombra_candidato) AS unicas_que_nombran_cli13,
         (SELECT count(*) FROM unicas_marcadas u WHERE u.de = 'medida' AND u.n = pa.n AND u.es_lugar) AS unicas_de_lugar
  FROM pasadas pa
),
control AS (
  SELECT 1 AS orden, 'pasadas rápidas de NOR-11 en la ventana: esperado ' || p.esperado_pasadas || ', medido ' || count(pp.n) AS medida,
         count(pp.n) = p.esperado_pasadas AS ok
  FROM parametros p LEFT JOIN por_pasada pp ON true GROUP BY p.esperado_pasadas
  UNION ALL
  SELECT 2, 'pasada ' || pp.n || ': pareja con CLI-13 1, contradicciones del juez ' || pp.contradicciones_del_juez || ' (esperado '
            || p.esperado_contradicciones_del_juez || '), solapamientos del juez ' || pp.solapamientos_del_juez || ' (esperado '
            || coalesce(p.esperado_solapamientos[pp.n]::text, '—') || ')',
         pp.parejas_cli13 = 1 AND pp.contradicciones_del_juez = p.esperado_contradicciones_del_juez
           AND pp.solapamientos_del_juez = p.esperado_solapamientos[pp.n]
  FROM por_pasada pp, parametros p
  UNION ALL
  SELECT 3, 'pasada ' || pp.n || ': publicadas ' || pp.publicadas || ' (de CLI-13 ' || pp.publicadas_cli13 || ', especies '
            || coalesce(pp.especies, '—') || '), columna contradictions_found ' || coalesce(pp.contradictions_found::text, '—'),
         pp.publicadas = 2 AND pp.publicadas_cli13 = 2 AND pp.especies = 'NEGACIÓN + PLAZO' AND pp.contradictions_found = 2
  FROM por_pasada pp
  UNION ALL
  SELECT 4, 'publicadas de especie OTRA en las seis: ' || (SELECT count(*) FROM publicadas_especie WHERE especie = 'OTRA'),
         (SELECT count(*) FROM publicadas_especie WHERE especie = 'OTRA') = 0
  UNION ALL
  SELECT 5, 'pasada ' || pp.n || ': descarte de LUGAR guardado por la puerta: ' || pp.lugar_en_la_puerta, pp.lugar_en_la_puerta = 1
  FROM por_pasada pp
  UNION ALL
  SELECT 6, 'control positivo del detector: la entrada de LUGAR del 11/10 09:08:33 UTC, marcada LUGAR y que nombra a CLI-13',
         EXISTS (SELECT 1 FROM unicas_marcadas WHERE de = 'control' AND es_lugar AND nombra_candidato)
)
SELECT bloque, pasada, a, b, c, texto
FROM (
  SELECT '0 · control' AS bloque, NULL::bigint AS pasada, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, NULL::text AS texto, orden AS o1, 0::bigint AS o2
  FROM control
  UNION ALL
  SELECT '0 · fuera de la medida', NULL,
         'pasadas rápidas de NOR-11 del 12/10 ANTES del push: ' || count(*), NULL, NULL, NULL, 9, 0
  FROM rapidas r, parametros p
  WHERE (r.created_at AT TIME ZONE 'Europe/Madrid')::date = date '2026-10-12' AND r.created_at < p.desde
  UNION ALL
  -- a) por pasada: la caja
  SELECT '1 · uniqueToNewDoc con CLI-13', pp.n,
         to_char(pp.created_at AT TIME ZONE 'UTC', 'HH24:MI:SS') || ' UTC (hora guardada: la del final)',
         'entradas: ' || pp.unicas || ' (tope del prompt: 10)',
         'nombran a CLI-13: ' || pp.unicas_que_nombran_cli13 || ' · de LUGAR: ' || pp.unicas_de_lugar,
         NULL, 0, pp.n
  FROM por_pasada pp
  UNION ALL
  -- b) las publicadas, con sus dos citas enteras
  SELECT '2 · publicadas', p.n, p.especie,
         coalesce(p.candidato, '—') || ' · ' || coalesce(p.severity, '—') || ' · confirmedBy: ' || coalesce(p.confirmado, '—'),
         p.tema, 'NUEVO: ' || coalesce(p.cita_nuevo, '—') || E'\nEXISTENTE: ' || coalesce(p.cita_existente, '—'), 0, p.n * 100 + p.ord
  FROM publicadas_especie p
  UNION ALL
  -- b) lo que la puerta descartó como contradicción, con la cita entera y su longitud
  SELECT '3 · puerta: contradicción descartada', d.n, d.tema,
         d.detalle, 'longitud de la cita del nuevo: ' || char_length(coalesce(d.cita_nuevo, '')),
         'NUEVO: ' || coalesce(d.cita_nuevo, '—') || E'\nEXISTENTE: ' || coalesce(d.cita_existente, '—'), 0, d.n * 100 + d.ord
  FROM descartes d
  WHERE d.tipo = 'contradiccion'
  UNION ALL
  -- a) cada entrada de la caja, las de LUGAR y las que nombran a CLI-13 primero
  SELECT '4 · entradas de uniqueToNewDoc', u.n,
         concat_ws(', ', CASE WHEN u.es_lugar THEN 'LUGAR' END, CASE WHEN u.nombra_candidato THEN 'nombra a CLI-13' END),
         NULL, NULL, u.texto,
         CASE WHEN u.es_lugar OR u.nombra_candidato THEN 0 ELSE 1 END, u.n * 100 + u.ord
  FROM unicas_marcadas u
  WHERE u.de = 'medida'
) t
ORDER BY bloque, o1, pasada, o2;
