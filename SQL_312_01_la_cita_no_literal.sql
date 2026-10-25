-- ============================================================================
-- 3.1.2 · LA CITA PUBLICADA QUE NO ES LITERAL EN EL DOCUMENTO DEL CLIENTE — CARÁCTER A CARÁCTER — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- ⚠️ SACA TEXTO DE DOCUMENTO: la cita publicada del lado nuevo y el texto de NOR-10 alrededor de la diferencia.
-- Es NOR-10, del corpus de pruebas, NO de un cliente.
--
-- LA PREGUNTA (arquitecto, 25/10/2026): en la tanda del 3.1.2, la pasada 4 de NOR-10 publicó una contradicción
-- (OTRA, con CLI-12, confirmada por juicio, marca recompuesta: no) cuya cita del NUEVO sale «⚠️ NO LITERAL en
-- NOR-10» en SQL_F128_02. Es el lado que el usuario lee como «lo que dice tu documento». Tres causas, que llevan a
-- acciones distintas, y NO se toca nada hasta saber cuál es:
--   1. la NORMALIZACIÓN de la puerta: la cita pasó por la vía `normalizada` de `coincidencia-de-cita.ts`, y lo que
--      se publica es el texto DEL JUEZ, no el recorte del documento (es el diseño desde F-55: «lo que debe
--      mostrarse es lo que el juez dijo»). La vía por la que pasó cada cita publicada NO se guarda en la base: sólo
--      sale en el log (`paso=normalizada`). Lo que esta consulta da es la diferencia literal;
--   2. una INVENCIÓN del juez que la puerta dejó pasar;
--   3. dos textos desfasados: la cita es literal en lo que vio el juez y no en lo guardado.
-- ⚠️ Lo que mira SQL_F128_02 para decir «NO LITERAL» es el texto RECONSTRUIDO de los trozos guardados (los trozos de
-- la generación activa, unidos con dos saltos de línea), el mismo que monta el juez para un documento de prosa;
-- y su «SIN FRASE» mira el `full_text`. Esta consulta compara con los DOS.
--
-- POR CADA CITA DEL NUEVO PUBLICADA QUE NO SEA LITERAL en el texto reconstruido (bloque 1):
--   · la cita entera y su longitud;
--   · si es literal en el `full_text` y en algún trozo suelto;
--   · EL TRAMO MÁS LARGO DEL PRINCIPIO de la cita que sí está, tal cual, en el texto reconstruido, y dónde;
--   · EL PRIMER CARÁCTER DISTINTO: el de la cita y el del documento en esa posición, con su código Unicode, y 40
--     caracteres de contexto a cada lado;
--   · EL TRAMO MÁS LARGO DEL FINAL que sí está, tal cual: si principio y final juntos cubren casi toda la cita, la
--     diferencia es de uno o pocos caracteres;
-- y los contadores de la puerta de esa pasada (bloque 2).
-- Sin interpretar: dice en qué difieren, no por qué.
--
-- ✅ PROBADO ANTES DE ENTREGARLO en PGlite (claude/arneses/f312/), con citas sintéticas: una literal, una con una
-- comilla tipográfica cambiada, una con un carácter cambiado en medio y una inventada. CON DATOS REALES NO SE HA
-- EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros`. No se mira otra.    │
-- │ Vienen puestas las horas de la tanda del 3.1.2 (24/10, 19:00 a 19:20).   │
-- └──────────────────────────────────────────────────────────────────────────┘
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         timestamptz '2026-10-24 19:00:00+02' AS desde,
         timestamptz '2026-10-24 19:20:00+02' AS hasta
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.document_id, ar.pipeline_counters AS pc, ar.analysis,
         row_number() OVER (ORDER BY ar.created_at) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%' AND ar.created_at >= p.desde AND ar.created_at < p.hasta
),
textos AS (
  SELECT pa.n, d.full_text AS ft,
         (SELECT string_agg(c.text, E'\n\n' ORDER BY c.chunk_index) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1)) AS rec
  FROM pasadas pa JOIN public.documents d ON d.id = pa.document_id
),
publicadas AS (
  SELECT pa.n, pa.id, x.ord, d->>'existingDocument' AS candidato, d->>'topic' AS tema, coalesce(d->>'newDocSays', '') AS cita
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END) WITH ORDINALITY x(d, ord)
),
no_literales AS (
  SELECT p.*, t.ft, t.rec FROM publicadas p JOIN textos t ON t.n = p.n
  WHERE p.cita <> '' AND t.rec IS NOT NULL AND strpos(t.rec, p.cita) = 0
),
-- el tramo más largo del principio y del final de la cita que están, tal cual, en el texto reconstruido
tramos AS (
  SELECT q.*,
         (SELECT max(k) FROM generate_series(1, char_length(q.cita)) k WHERE strpos(q.rec, left(q.cita, k)) > 0) AS cabeza,
         (SELECT max(k) FROM generate_series(1, char_length(q.cita)) k WHERE strpos(q.rec, right(q.cita, k)) > 0) AS cola
  FROM no_literales q
),
diferencia AS (
  SELECT t.*,
         CASE WHEN coalesce(t.cabeza, 0) > 0 THEN strpos(t.rec, left(t.cita, t.cabeza)) END AS donde,
         substr(t.cita, coalesce(t.cabeza, 0) + 1, 1) AS car_cita
  FROM tramos t
)
SELECT bloque, pasada, a, b, c
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS pasada,
         CASE WHEN (SELECT count(*) FROM pasadas) > 0 THEN 'OK' ELSE 'FALLA' END AS a,
         'pasadas de NOR-10 entre las dos horas: ' || (SELECT count(*) FROM pasadas) || ' · contradicciones publicadas: ' || (SELECT count(*) FROM publicadas) ||
           ' · con la cita del nuevo NO literal en el texto reconstruido: ' || (SELECT count(*) FROM no_literales) AS b,
         NULL::text AS c, 0 AS o1, 0::bigint AS o2, 0::bigint AS o3
  UNION ALL
  SELECT '0 · control', NULL,
         CASE WHEN (SELECT count(*) FROM textos WHERE rec IS NULL) = 0 THEN 'OK' ELSE 'FALLA' END,
         'pasadas sin trozos guardados de NOR-10 (sin texto reconstruido no se puede comparar): ' || (SELECT count(*) FROM textos WHERE rec IS NULL),
         NULL, 0, 1, 0
  UNION ALL
  -- 1 · CADA CITA NO LITERAL, CARÁCTER A CARÁCTER
  SELECT '1 · la cita no literal', 'pasada ' || d.n,
         'análisis ' || d.id || ' · contradicción ' || d.ord || ' · con ' || coalesce(d.candidato, '—') || ' · ' || char_length(d.cita) || ' caracteres · tema: ' || coalesce(d.tema, '—'),
         'literal en el full_text: ' || CASE WHEN d.ft IS NULL THEN '— (sin full_text)' WHEN strpos(d.ft, d.cita) > 0 THEN 'SÍ' ELSE 'NO' END ||
           ' · literal en algún trozo suelto: ' || CASE WHEN EXISTS (SELECT 1 FROM public.document_chunks c JOIN pasadas pa ON pa.n = d.n
                                                              JOIN public.documents dd ON dd.id = pa.document_id
                                                              WHERE c.document_id = dd.id AND c.generation = coalesce(dd.active_generation, 1) AND strpos(c.text, d.cita) > 0) THEN 'SÍ' ELSE 'NO' END ||
           ' · PRINCIPIO literal: ' || coalesce(d.cabeza, 0) || ' caracteres' || coalesce(' (en el texto, desde la posición ' || d.donde || ')', '') ||
           ' · FINAL literal: ' || coalesce(d.cola, 0) || ' caracteres' ||
           ' · PRIMER CARÁCTER DISTINTO, posición ' || (coalesce(d.cabeza, 0) + 1) || ' de la cita: «' || d.car_cita || '» (U+' || upper(to_hex(ascii(d.car_cita))) || ')' ||
           CASE WHEN d.donde IS NOT NULL THEN ' frente a «' || substr(d.rec, d.donde + d.cabeza, 1) || '» (U+' || upper(to_hex(ascii(substr(d.rec, d.donde + d.cabeza, 1)))) || ') en el documento' ELSE '' END,
         'LA CITA: «' || d.cita || '»' ||
           CASE WHEN d.donde IS NOT NULL THEN E'\nEL DOCUMENTO desde donde empieza la cita: «' || substr(d.rec, d.donde, char_length(d.cita) + 40) || '»' ||
                E'\nALREDEDOR DE LA DIFERENCIA, en la cita: «' || substr(d.cita, greatest(1, d.cabeza - 39), 80) || '»' ||
                E'\nALREDEDOR DE LA DIFERENCIA, en el documento: «' || substr(d.rec, greatest(1, d.donde + d.cabeza - 40), 80) || '»'
                ELSE E'\n(ningún principio de la cita está en el documento)' END,
         10, d.n, d.ord
  FROM diferencia d
  UNION ALL
  -- 2 · LOS CONTADORES DE LA PUERTA de cada pasada con una cita no literal
  SELECT '2 · la puerta', 'pasada ' || pa.n,
         coalesce((SELECT string_agg(k || '=' || (pa.pc->>k), ' · ' ORDER BY k) FROM jsonb_object_keys(pa.pc) k WHERE k LIKE 'juez.cita%' OR k LIKE 'juez.recompuestas%'), 'sin contadores de la puerta'),
         NULL, NULL, 20, pa.n, 0
  FROM pasadas pa WHERE pa.n IN (SELECT n FROM no_literales) AND jsonb_typeof(pa.pc) = 'object'
) t
ORDER BY o1, o2, o3;
