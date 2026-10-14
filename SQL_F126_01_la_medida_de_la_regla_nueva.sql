-- ============================================================================
-- F-126 · LA MEDIDA DE LA REGLA NUEVA DE LA CITA — SIETE PASADAS DE NOR-11 CON
-- EL PROMPT DE 2fe72b4e, COMPARADAS CON LAS SIETE DEL 13/10 — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- ⚠️ SACA TEXTO DE DOCUMENTO, ENTERO: las citas publicadas, las del tramo y las
-- de los descartes. Son NOR-11, CLI-13 y lo que el juez compare en esas pasadas,
-- documentos del corpus de pruebas, NO de un cliente.
-- ✅ PROBADO ANTES DE ENTREGARLO (14/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): con siete y siete pasadas como las esperadas todos los
-- controles salen OK; y sale FALLA cuando la ventana nueva no tiene siete, cuando
-- la vieja no tiene siete, cuando hay una pasada en el hueco de la noche, cuando
-- falta un contador del tramo (que sale «FALTA», nunca 0), cuando no está el
-- contador de la glosa que el juez emite siempre, y cuando contradictions_found
-- no cuadra con lo publicado. La mediana se comprobó a mano con n par e impar.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 14/10/2026): si la regla nueva de la cita (F-126,
-- desplegada con 2fe72b4e, push a las 21:20:36 del 13/10 hora de Madrid) cambia
-- lo que se publica de NOR-11 frente a CLI-13. Las predicciones que puede tumbar,
-- escritas antes de medir:
--   · Fable: LUGAR 5 de 7 o más (bloques 1 y 2); PLAZO y NEGACIÓN 7 de 7
--     (bloques 1 y 2); la MEDIANA baja de 150 (bloque 5); juez.citas_recompuestas
--     de 1 de 7 a 0 de 7 (bloque 3).
--   · Arquitecto: citasAlTramo vacío (bloque 4); LUGAR ya no muere en la puerta
--     (bloque 9); los solapamientos publicados no bajan (bloque 7); y las pasadas
--     con LUGAR NO se concentran en la primera (bloque 1, el ordinal).
--   · Criterios escritos antes: si PLAZO o NEGACIÓN bajan de 7 de 7, se revierte
--     el prompt; si LUGAR no llega a 5 de 7, no hay tercer ajuste y se activa la
--     fase 3.4 con unidades-de-cita.ts.
-- La consulta NO califica: enseña. Las calificaciones son del arquitecto.
--
-- ⚠️ LAS DOS VENTANAS, en hora de Madrid (CEST, UTC+2 en octubre), sobre la hora
-- GUARDADA, que es la del FINAL del análisis (B.82):
--   · VIEJA (prompt viejo): 13/10/2026 de 11:43:00 a 11:57:00. El encargo decía
--     «entre las 11:43 y las 11:56»; la séptima pasada se guardó a las 11:56:43,
--     así que el final se pone a las 11:57:00 para no dejarla fuera. Son las
--     siete que ya se leyeron con SQL_F125_01.
--   · NUEVA (prompt nuevo): desde el 14/10/2026 a las 00:00:00.
--   · EL HUECO DE LA NOCHE, que debe estar VACÍO: del push (13/10, 21:20:36) a
--     las 00:00:00 del 14/10. Una pasada ahí estaría hecha con el prompt nuevo
--     pero fuera de la ventana.
--
-- ⚠️ LA DEFINICIÓN DE LA MEDIANA (bloque 5), FIJADA ANTES DE VER EL RESULTADO Y
-- LA MISMA EN LAS DOS VENTANAS:
--   · se cuentan las citas de las CONTRADICCIONES PUBLICADAS
--     (`analysis->'discrepancies'`), LOS DOS LADOS (`newDocSays` y
--     `existingDocSays`), de TODAS las pasadas de la ventana;
--   · longitud = `char_length` del texto publicado (caracteres, no bytes);
--   · mediana = `percentile_cont(0.5)`: con n impar, la cita del medio; con n
--     par, la media de las dos del medio;
--   · los SOLAPAMIENTOS NO entran: son otra población.
--   Una cita vacía (lado sin texto) se cuenta con longitud 0, y se ve en el mínimo.
--
-- DE DÓNDE SALE CADA COSA, leído en el código que la escribe:
--   · lo PUBLICADO: `analysis->'discrepancies'` (synthesize.ts,
--     construirDiscrepancias): topic, newDocSays, existingDocSays,
--     existingDocument, severity, confirmedBy. NO lleva la marca `recompuesta`:
--     la marca está en `analysis->'judgments'[].contradictions[]` (types.ts), y
--     el bloque 2 la busca allí por candidato y por las dos citas;
--   · los SOLAPAMIENTOS publicados: `analysis->'overlaps'` (synthesize.ts,
--     construirOverlaps) va AGRUPADO por documento —un grupo con lo del juez y,
--     si lo hay, otro estructural—, y `overlaps_found` cuenta GRUPOS. Cada
--     solapamiento del juez publicado es un elemento de `puntos` dentro de su
--     grupo (B.314). El bloque 7 da las dos cifras;
--   · los contadores: la columna `pipeline_counters` (F-82, persist-analysis.ts);
--   · `citasAlTramo` y `descartesPorCita`: en `analysis->'judgments'[]` (types.ts;
--     repliegue-de-tramo.ts y diagnostico-de-cita.ts).
--
-- ESPECIE (bloques 1, 2, 5 y 9), por el `topic` (o el `tema` de un descarte),
-- sin distinguir mayúsculas ni acentos: PLAZO si dice «plazo»; NEGACIÓN si dice
-- «color» y «contenedor»; LUGAR si dice «retirada» o «ubicacion»; si no, OTRA.
-- Una OTRA se lee antes de llamarla falso positivo.
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   · 7 pasadas en la ventana nueva y 7 en la vieja (sin las siete viejas la
--     comparación de la mediana no vale);
--   · 0 pasadas en el hueco de la noche;
--   · por pasada nueva, los SEIS contadores del tramo presentes (uno que falte
--     sale FALTA en el bloque 3, nunca 0, F-82), y el de la glosa, que el juez
--     emite siempre (si falta, se lee la columna equivocada);
--   · por pasada nueva, contradictions_found = las publicadas del bloque 2.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         timestamptz '2026-10-13 11:43:00+02' AS vieja_desde,
         timestamptz '2026-10-13 11:57:00+02' AS vieja_hasta,
         timestamptz '2026-10-13 21:20:36+02' AS push,            -- ← el push de 2fe72b4e
         timestamptz '2026-10-14 00:00:00+02' AS nueva_desde,
         7 AS esperado_por_ventana
),
nor11 AS (
  SELECT ar.id, ar.created_at, ar.contradictions_found, ar.overlaps_found, ar.pipeline_counters AS pc, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-11%'
),
pasadas AS (
  SELECT v.*, row_number() OVER (PARTITION BY v.ventana ORDER BY v.created_at) AS n
  FROM (
    SELECT x.*, CASE WHEN x.created_at >= p.nueva_desde THEN 'nueva'
                     WHEN x.created_at >= p.vieja_desde AND x.created_at < p.vieja_hasta THEN 'vieja' END AS ventana
    FROM nor11 x, parametros p
  ) v
  WHERE v.ventana IS NOT NULL
),
hueco AS (
  SELECT x.* FROM nor11 x, parametros p WHERE x.created_at >= p.push AND x.created_at < p.nueva_desde
),
juicios AS (
  SELECT pa.ventana, pa.n, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array' THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
),
publicadas AS (
  SELECT pa.ventana, pa.n, x.ord, d->>'existingDocument' AS candidato, d->>'severity' AS severity, d->>'confirmedBy' AS confirmado,
         d->>'topic' AS tema, coalesce(d->>'newDocSays', '') AS cita_nuevo, coalesce(d->>'existingDocSays', '') AS cita_existente,
         translate(lower(coalesce(d->>'topic', '')), 'áéíóúüñ', 'aeiouun') AS t
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(d, ord)
),
marcas AS (
  SELECT ju.ventana, ju.n, ju.j->>'documentName' AS candidato, c->>'newDocSays' AS cita_nuevo, c->>'existingDocSays' AS cita_existente,
         c->'recompuesta' AS marca
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE '[]'::jsonb END) c
),
pub AS (
  SELECT p.*,
         CASE WHEN t LIKE '%plazo%' THEN 'PLAZO'
              WHEN t LIKE '%color%' AND t LIKE '%contenedor%' THEN 'NEGACIÓN'
              WHEN t LIKE '%retirada%' OR t LIKE '%ubicacion%' THEN 'LUGAR'
              ELSE 'OTRA' END AS especie,
         (SELECT m.marca FROM marcas m
           WHERE m.ventana = p.ventana AND m.n = p.n AND m.candidato = p.candidato
             AND m.cita_nuevo = p.cita_nuevo AND m.cita_existente = p.cita_existente AND m.marca IS NOT NULL LIMIT 1) AS marca
  FROM publicadas p
),
-- las citas de la mediana: los DOS lados de cada contradicción publicada
citas AS (
  SELECT ventana, n, especie, 'nuevo' AS lado, cita_nuevo AS texto, char_length(cita_nuevo) AS largo FROM pub
  UNION ALL
  SELECT ventana, n, especie, 'existente', cita_existente, char_length(cita_existente) FROM pub
),
tramo AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, x.ord, r
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'citasAlTramo') = 'array' THEN ju.j->'citasAlTramo' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(r, ord)
  WHERE ju.ventana = 'nueva'
),
descartes AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, x.ord, d, lado.nombre AS lado, d->lado.nombre AS datos,
         CASE WHEN lado.nombre = 'nuevo' THEN d->>'citaNuevo' ELSE d->>'citaExistente' END AS cita
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(d, ord)
  CROSS JOIN (VALUES ('nuevo'), ('existente')) AS lado(nombre)
  WHERE ju.ventana = 'nueva'
),
contadores AS (
  SELECT pa.n, k.clave, coalesce(pa.pc ? k.clave, false) AS esta, pa.pc->>k.clave AS valor
  FROM pasadas pa
  CROSS JOIN (VALUES
    ('juez.citas_recompuestas'),
    ('juez.citas_recompuestas_en_trozos_distintos'),
    ('juez.citas_empalme_multiple'),
    ('juez.citas_sin_tramo_literal'),
    ('juez.recompuestas_bloqueadas_al_reclasificar'),
    ('juez.recompuestas_sin_contexto_del_resto')) AS k(clave)
  WHERE pa.ventana = 'nueva'
),
control AS (
  SELECT 1 AS orden, 'pasadas de NOR-11 en la ventana NUEVA: esperado ' || p.esperado_por_ventana || ', medido ' ||
         (SELECT count(*) FROM pasadas WHERE ventana = 'nueva') AS medida,
         (SELECT count(*) FROM pasadas WHERE ventana = 'nueva') = p.esperado_por_ventana AS ok
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de NOR-11 en la ventana VIEJA: esperado ' || p.esperado_por_ventana || ', medido ' ||
         (SELECT count(*) FROM pasadas WHERE ventana = 'vieja'),
         (SELECT count(*) FROM pasadas WHERE ventana = 'vieja') = p.esperado_por_ventana
  FROM parametros p
  UNION ALL
  SELECT 3, 'pasadas de NOR-11 en el HUECO de la noche (push → 00:00 del 14/10): esperado 0, medido ' || (SELECT count(*) FROM hueco) ||
         coalesce(' · horas: ' || (SELECT string_agg(to_char(h.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'), ', ' ORDER BY h.created_at) FROM hueco h), ''),
         (SELECT count(*) FROM hueco) = 0
  UNION ALL
  SELECT 4, 'pasada nueva ' || pa.n || ': los seis contadores del tramo están (faltan ' ||
            (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) || ')',
         (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) = 0
  FROM pasadas pa WHERE pa.ventana = 'nueva'
  UNION ALL
  SELECT 5, 'pasada nueva ' || pa.n || ': está juez.citas_rescatadas_quitando_glosa (se lee la columna buena)',
         coalesce(pa.pc ? 'juez.citas_rescatadas_quitando_glosa', false)
  FROM pasadas pa WHERE pa.ventana = 'nueva'
  UNION ALL
  SELECT 6, 'pasada nueva ' || pa.n || ': contradictions_found ' || coalesce(pa.contradictions_found::text, '—') ||
            ' = publicadas ' || (SELECT count(*) FROM pub p WHERE p.ventana = 'nueva' AND p.n = pa.n),
         pa.contradictions_found = (SELECT count(*) FROM pub p WHERE p.ventana = 'nueva' AND p.n = pa.n)
  FROM pasadas pa WHERE pa.ventana = 'nueva'
),
mediana AS (
  SELECT ventana, especie, count(*) AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY largo) AS med, min(largo) AS mn, max(largo) AS mx
  FROM citas GROUP BY GROUPING SETS ((ventana), (ventana, especie))
)
SELECT bloque, pasada, a, b, c, texto
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS pasada, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, NULL::text AS texto, orden AS o1, 0::bigint AS o2
  FROM control
  UNION ALL
  -- 1 · EL CENSO DE LA VENTANA NUEVA, con su ordinal y el marcador
  SELECT '1 · censo (nueva)', 'nueva ' || pa.n,
         to_char(pa.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid (hora guardada: la del final)',
         'id ' || pa.id || ' · contradictions_found ' || coalesce(pa.contradictions_found::text, '—'),
         'especies publicadas: ' || coalesce((SELECT string_agg(DISTINCT e.especie, ' + ' ORDER BY e.especie) FROM pub e WHERE e.ventana = 'nueva' AND e.n = pa.n), 'ninguna') ||
         ' · marcador ' || (SELECT count(DISTINCT e.especie) FROM pub e WHERE e.ventana = 'nueva' AND e.n = pa.n AND e.especie IN ('PLAZO', 'NEGACIÓN', 'LUGAR')) || '/3',
         NULL, 0, pa.n
  FROM pasadas pa WHERE pa.ventana = 'nueva'
  UNION ALL
  -- 2 · LO PUBLICADO EN LA VENTANA NUEVA: las dos citas enteras, su longitud y la marca
  SELECT '2 · contradicciones publicadas (nueva)', 'nueva ' || e.n, e.especie,
         coalesce(e.candidato, '—') || ' · ' || coalesce(e.severity, '—') || ' · confirmedBy: ' || coalesce(e.confirmado, '—') ||
           ' · marca recompuesta: ' || CASE WHEN e.marca IS NULL THEN 'no' ELSE 'SÍ' END ||
           ' · longitudes: nuevo ' || char_length(e.cita_nuevo) || ', existente ' || char_length(e.cita_existente),
         e.tema,
         'NUEVO: ' || e.cita_nuevo || E'\nEXISTENTE: ' || e.cita_existente ||
           CASE WHEN e.marca IS NULL THEN '' ELSE
             coalesce(E'\nCITA DEL JUEZ (nuevo): ' || (e.marca->'nuevo'->>'citaDelJuez'), '') ||
             coalesce(E'\nCITA DEL JUEZ (existente): ' || (e.marca->'existente'->>'citaDelJuez'), '') END,
         0, e.n * 100 + e.ord
  FROM pub e WHERE e.ventana = 'nueva'
  UNION ALL
  -- 3 · LOS SEIS CONTADORES DEL TRAMO por pasada nueva (FALTA si no está, nunca 0)
  SELECT '3 · contadores del tramo (nueva)', 'nueva ' || pa.n,
         'recompuestas ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_recompuestas') ||
         ' · en_trozos_distintos ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_recompuestas_en_trozos_distintos'),
         'empalme_multiple ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_empalme_multiple') ||
         ' · sin_tramo_literal ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_sin_tramo_literal'),
         'bloqueadas_al_reclasificar ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.recompuestas_bloqueadas_al_reclasificar') ||
         ' · sin_contexto_del_resto ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.recompuestas_sin_contexto_del_resto'),
         NULL, 0, pa.n
  FROM pasadas pa WHERE pa.ventana = 'nueva'
  UNION ALL
  -- 4 · citasAlTramo ENTERO de la ventana nueva, o la frase que dice que no hay
  SELECT '4 · citasAlTramo (nueva)', 'nueva ' || t.n, coalesce(t.r->>'salida', '—'),
         coalesce(t.candidato, '—') || ' · hash ' || coalesce(t.r->>'hash', '—') || ' · lado ' || coalesce(t.r->>'lado', '—') ||
           coalesce(' · motivo ' || (t.r->>'motivo'), '') || ' · longitud de la cita ' || coalesce(t.r->>'longitudDeLaCita', '—'),
         concat_ws(' · ',
           'ancla ' || (t.r->'ancla'->>'desde') || '-' || (t.r->'ancla'->>'hasta'),
           'resto ' || (t.r->'resto'->>'desde') || '-' || (t.r->'resto'->>'hasta'),
           'longitud del resto ' || (t.r->>'longitudDelResto'),
           'distancia ' || (t.r->>'distancia'),
           'trozos ' || (t.r->'trozos'->>'ancla') || '/' || (t.r->'trozos'->>'resto')),
         CASE WHEN t.r ? 'frases' THEN 'FRASE DEL ANCLA: ' || (t.r->'frases'->>'ancla') || E'\nFRASE DEL RESTO: ' || (t.r->'frases'->>'resto') END,
         0, t.n * 100 + t.ord
  FROM tramo t
  UNION ALL
  SELECT '4 · citasAlTramo (nueva)', NULL, 'ninguna cita llegó al tramo', 'en ninguna de las pasadas de la ventana nueva', NULL, NULL, 1, 0
  WHERE NOT EXISTS (SELECT 1 FROM tramo)
  UNION ALL
  -- 5 · LA MEDIANA, las dos ventanas lado a lado: primero la global, después por especie
  SELECT '5 · mediana de las citas publicadas', m.ventana,
         coalesce(m.especie, 'TODAS'),
         'n ' || m.n || ' · mediana ' || round(m.med::numeric, 1),
         'mínimo ' || m.mn || ' · máximo ' || m.mx,
         NULL, CASE WHEN m.especie IS NULL THEN 0 ELSE 1 END,
         CASE m.ventana WHEN 'vieja' THEN 0 ELSE 1 END
  FROM mediana m
  UNION ALL
  -- 6 · LA CITA PUBLICADA MÁS CORTA de la ventana nueva (observación, no criterio)
  SELECT '6 · cita publicada más corta (nueva)', 'nueva ' || c.n, c.especie,
         'lado ' || c.lado || ' · ' || c.largo || ' caracteres', NULL, c.texto, 0, c.n
  FROM citas c
  WHERE c.ventana = 'nueva' AND c.largo = (SELECT min(largo) FROM citas WHERE ventana = 'nueva')
  UNION ALL
  -- 7 · LOS SOLAPAMIENTOS PUBLICADOS por pasada, en las dos ventanas
  SELECT '7 · solapamientos publicados', pa.ventana || ' ' || pa.n,
         'puntos del juez publicados: ' || coalesce((SELECT sum(jsonb_array_length(o->'puntos')) FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(pa.analysis->'overlaps') = 'array' THEN pa.analysis->'overlaps' ELSE '[]'::jsonb END) o
           WHERE jsonb_typeof(o->'puntos') = 'array'), 0),
         'grupos (overlaps_found): ' || coalesce(pa.overlaps_found::text, '—') ||
           ' · de ellos estructurales: ' || (SELECT count(*) FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(pa.analysis->'overlaps') = 'array' THEN pa.analysis->'overlaps' ELSE '[]'::jsonb END) o
           WHERE o->>'confirmedBy' = 'estructura'),
         NULL, NULL, CASE pa.ventana WHEN 'vieja' THEN 0 ELSE 1 END, pa.n
  FROM pasadas pa
  UNION ALL
  -- 8 · LAS DOS TRAMPAS DE paso en la ventana nueva: el recuento, y las segmentos_de_fila con su cita
  SELECT '8 · trampas de paso (nueva): recuento', NULL,
         'paso=recompuesta: ' || count(*) FILTER (WHERE d.datos->>'paso' = 'recompuesta'),
         'paso=segmentos_de_fila: ' || count(*) FILTER (WHERE d.datos->>'paso' = 'segmentos_de_fila'),
         'lados de descarte leídos: ' || count(*), NULL, 0, 0
  FROM descartes d
  UNION ALL
  SELECT '8 · trampas de paso (nueva): segmentos_de_fila', 'nueva ' || d.n, d.lado,
         coalesce(d.candidato, '—') || ' · ' || coalesce(d.d->>'tipo', '—') || ' · verificada ' || coalesce(d.datos->>'verificada', '—') ||
           ' · lado fallido ' || coalesce(d.d->>'ladoFallido', '—') || ' · pajar ' || coalesce(d.datos->>'pajar', '—'),
         d.d->>'tema', d.cita, 1, d.n * 100 + d.ord
  FROM descartes d WHERE d.datos->>'paso' = 'segmentos_de_fila'
  UNION ALL
  -- 9 · LO QUE LA PUERTA MATÓ COMO CONTRADICCIÓN en la ventana nueva (¿muere LUGAR?)
  SELECT '9 · contradicciones que mató la puerta (nueva)', 'nueva ' || d.n,
         CASE WHEN tt LIKE '%plazo%' THEN 'PLAZO' WHEN tt LIKE '%color%' AND tt LIKE '%contenedor%' THEN 'NEGACIÓN'
              WHEN tt LIKE '%retirada%' OR tt LIKE '%ubicacion%' THEN 'LUGAR' ELSE 'OTRA' END,
         coalesce(d.candidato, '—') || ' · lado fallido ' || coalesce(d.d->>'ladoFallido', '—') ||
           ' · nuevo: ' || coalesce(d.d->'nuevo'->>'paso', '—') || ' · existente: ' || coalesce(d.d->'existente'->>'paso', '—'),
         d.d->>'tema',
         'NUEVO: ' || coalesce(d.d->>'citaNuevo', '—') || E'\nEXISTENTE: ' || coalesce(d.d->>'citaExistente', '—'),
         0, d.n * 100 + d.ord
  FROM (SELECT DISTINCT ON (n, ord) n, ord, candidato, d, translate(lower(coalesce(d->>'tema', '')), 'áéíóúüñ', 'aeiouun') AS tt
        FROM descartes WHERE d->>'tipo' = 'contradiccion' ORDER BY n, ord) d
) t
ORDER BY bloque, o1, o2, pasada;
