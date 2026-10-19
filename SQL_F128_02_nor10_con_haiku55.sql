-- ============================================================================
-- F-128 · EL JUEZ CON HAIKU 5.5: TRES PASADAS DE NOR-10 (LA LÍNEA BASE ES LA DEL
-- 16/10, CON HAIKU 4.5) — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- ⚠️ SACA TEXTO DE DOCUMENTO, ENTERO: las citas publicadas y su contexto. Son
-- NOR-10, CLI-12 y lo que el juez compare en esas pasadas, documentos del corpus
-- de pruebas, NO de un cliente.
--
-- ES SQL_F127_01 CON LA MISMA LÓGICA (19/10/2026). SQL_F127_01 se queda como
-- está porque es el instrumento con el que se midió la línea base del 16/10, y
-- su cabecera describe esa medición. Lo que cambia aquí, y nada más:
--   · la ventana: las tres pasadas de Haiku 5.5, entre las DOS MARCAS de abajo
--     (la ventana gana límite superior); y la FRANJA PREVIA, del final de la
--     línea base del 16/10 (12:46) a la primera marca, que debe estar vacía;
--   · el bloque 1 dice con qué MODELO juzgó el juez cada pareja y cuántos TOKENS
--     DE SALIDA gastó (lecturaDeLasParejas[].modelo y .tokensDeSalida, F-128), y
--     el bloque 2 los repite junto a cada contradicción publicada;
--   · y un control más, el 0.9: toda pareja de la ventana lleva su modelo, o el
--     código desplegado no es el de F-128.
-- Todo lo demás —la reconstrucción del texto entregado, las especies, la sonda
-- de la frase partida, los controles 0.1 a 0.8—, idéntico a SQL_F127_01: lee
-- su cabecera para la definición de cada cosa.
-- ✅ PROBADO ANTES DE ENTREGARLO (19/10/2026) en PGlite, con el arnés de
-- SQL_F127_01 adaptado y los trozos reales de NOR-10 y CLI-12: con tres pasadas
-- los controles salen OK, y falla el 0.9 cuando una pareja no lleva modelo. CON
-- DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LO ÚNICO QUE TOCA EL DIRECTOR: las DOS MARCAS de la constante            │
-- │ `parametros`, en hora de Madrid y con este formato exacto:               │
-- │     timestamptz 'AAAA-MM-DD HH:MM:SS+02'                                  │
-- │   · DESDE: un minuto ANTES de lanzar la primera pasada de NOR-10;        │
-- │   · HASTA: un minuto DESPUÉS de que termine la última.                    │
-- │ ⚠️ El «+02» es el horario de verano. Desde el domingo 25/10/2026 a las   │
-- │ 03:00 es «+01».                                                           │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- Aquí bastan dos marcas: la pasada 0 (el interruptor apagado) es de NOR-11 y no
-- cae en ninguna franja de esta lectura, y la tanda de NOR-10 son tres pasadas
-- seguidas. **Ningún control debe fallar; si alguno falla, es que pasó algo**: un
-- control que se espera que falle es un control muerto (arquitecto, 19/10/2026).
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         -- ↓↓↓ LAS DOS MARCAS: lo único que se toca (ver la cabecera) ↓↓↓
         -- ⚠️ «+02» vale hasta el domingo 25/10/2026 a las 03:00; desde ahí es «+01».
         timestamptz '2026-10-19 00:00:00+02' AS desde,           -- ← DESDE: antes de la primera pasada de NOR-10
         timestamptz '2026-10-19 23:59:00+02' AS hasta,           -- ← HASTA: después de la última
         -- ↑↑↑ ↑↑↑
         timestamptz '2026-10-16 12:50:00+02' AS push,            -- la franja previa: del final de la línea base a DESDE
         3 AS esperado
),
nor10 AS (
  SELECT ar.id, ar.created_at, ar.document_id, ar.contradictions_found, ar.pipeline_counters AS pc, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%'
),
pasadas AS (
  SELECT x.*, row_number() OVER (ORDER BY x.created_at) AS n
  FROM nor10 x, parametros p WHERE x.created_at >= p.desde AND x.created_at < p.hasta
),
previas AS (
  SELECT x.* FROM nor10 x, parametros p WHERE x.created_at >= p.push AND x.created_at < p.desde
),
cli12 AS (
  SELECT d.id, d.name, coalesce(d.active_generation, 1) AS gen
  FROM public.documents d, parametros p
  WHERE d.org_id = p.org AND d.name ILIKE 'CLI-12%'
),
-- el texto de NOR-10 tal como lo arma el juez, por pasada (generación activa; `?? 1` como getActiveGeneration)
texto_nor10 AS (
  SELECT pa.n, string_agg(c.text, E'\n\n' ORDER BY c.chunk_index) AS rec,
         count(c.chunk_index) AS trozos, count(*) FILTER (WHERE c.chunk_type <> 'text') AS no_prosa
  FROM pasadas pa
  JOIN public.documents d ON d.id = pa.document_id
  JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1)
  GROUP BY pa.n
),
lecturas AS (
  SELECT pa.n, x.ord, x.l, x.l->>'documentId' AS doc_id,
         (SELECT d.name FROM public.documents d, parametros p WHERE d.org_id = p.org AND d.id::text = x.l->>'documentId') AS nombre,
         (x.l->'analizado'->>'caracteres')::int AS an_car, (x.l->'analizado'->>'mostrados')::int AS an_most,
         (x.l->'candidato'->>'caracteres')::int AS ca_car, (x.l->'candidato'->>'mostrados')::int AS ca_most,
         (x.l->>'presupuesto')::int AS presupuesto,
         x.l->>'modelo' AS modelo, x.l->>'tokensDeSalida' AS tokens_salida
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array' THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(l, ord)
),
lectura_cli12 AS (
  SELECT l.* FROM lecturas l WHERE l.doc_id IN (SELECT id::text FROM cli12)
),
juicios AS (
  SELECT pa.n, j FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array' THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
),
marcas AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, c->>'newDocSays' AS cita_nuevo, c->>'existingDocSays' AS cita_existente, c->'recompuesta' AS marca
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE '[]'::jsonb END) c
),
publicadas AS (
  SELECT pa.n, x.ord, d->>'existingDocument' AS candidato, d->>'severity' AS severity, d->>'confirmedBy' AS confirmado, d->>'topic' AS tema,
         coalesce(d->>'newDocSays', '') AS cita_nuevo, coalesce(d->>'existingDocSays', '') AS cita_existente
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(d, ord)
),
pub AS (
  SELECT p.*,
         translate(lower(coalesce(p.tema, '') || ' ' || p.cita_nuevo || ' ' || p.cita_existente), 'áéíóúüñ', 'aeiouun') AS t,
         (SELECT m.marca FROM marcas m WHERE m.n = p.n AND m.candidato = p.candidato
            AND m.cita_nuevo = p.cita_nuevo AND m.cita_existente = p.cita_existente AND m.marca IS NOT NULL LIMIT 1) AS marca,
         (SELECT l.an_most FROM lecturas l WHERE l.n = p.n AND l.nombre = p.candidato LIMIT 1) AS an_most,
         (SELECT tx.rec FROM texto_nor10 tx WHERE tx.n = p.n) AS rec_nuevo,
         (SELECT string_agg(c.text, E'\n\n' ORDER BY c.chunk_index)
            FROM public.documents d JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1), parametros pr
           WHERE d.org_id = pr.org AND d.name = p.candidato) AS rec_existente,
         (SELECT string_agg(c.chunk_index::text, ', ' ORDER BY c.chunk_index)
            FROM public.documents d JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1), parametros pr
           WHERE d.org_id = pr.org AND d.name = p.candidato AND p.cita_existente <> '' AND strpos(c.text, p.cita_existente) > 0) AS trozo_existente
  FROM publicadas p
),
pub2 AS (
  SELECT p.*,
         CASE WHEN t LIKE '%6 meses%' OR t LIKE '%12 meses%' OR t LIKE '%caducidad%' THEN 'C'
              WHEN t LIKE '%biologic%' AND (t LIKE '%semanal%' OR t LIKE '%lunes%' OR t LIKE '%mensual%') THEN 'B'
              WHEN t LIKE '%recaer%' OR t LIKE '%nunca por el director%' OR t LIKE '%ausencia%' OR t LIKE '%sustitu%' THEN 'D'
              WHEN t LIKE '%responsable%' THEN 'A'
              ELSE 'OTRA' END AS especie,
         -- LA COMPROBACIÓN EXPLÍCITA: ¿está la cita del NUEVO dentro de lo ENTREGADO?
         CASE WHEN p.cita_nuevo = '' THEN 'VACÍA'
              WHEN p.rec_nuevo IS NULL OR p.an_most IS NULL THEN 'NO SE PUEDE COMPROBAR (sin texto reconstruido o sin lectura de la pareja)'
              WHEN strpos(left(p.rec_nuevo, p.an_most), p.cita_nuevo) > 0 THEN 'literal, DENTRO de lo entregado (empieza en ' || strpos(p.rec_nuevo, p.cita_nuevo) || ')'
              WHEN strpos(p.rec_nuevo, p.cita_nuevo) > 0 THEN '⚠️ literal pero FUERA de lo entregado (empieza en ' || strpos(p.rec_nuevo, p.cita_nuevo) || ', entregados ' || p.an_most || ')'
              ELSE '⚠️ NO LITERAL en NOR-10: leer (normalización de la puerta o invención)' END AS nuevo_en_lo_entregado,
         CASE WHEN p.cita_existente = '' THEN 'VACÍA'
              WHEN p.rec_existente IS NULL THEN 'NO SE PUEDE COMPROBAR (el candidato no tiene trozos)'
              WHEN strpos(p.rec_existente, p.cita_existente) > 0 THEN 'literal en el candidato, trozo ' || coalesce(p.trozo_existente, 'ninguno entero: cruza trozos')
              ELSE '⚠️ NO LITERAL en el candidato: leer' END AS existente_literal
  FROM pub p
),
citas AS (
  SELECT n, candidato, 'nuevo' AS lado, char_length(cita_nuevo) AS largo, cita_nuevo AS texto FROM pub2
  UNION ALL
  SELECT n, candidato, 'existente', char_length(cita_existente), cita_existente FROM pub2
),
-- las cuatro frases sembradas en el lado de NOR-10, contra lo entregado en la pareja con CLI-12
sembradas AS (
  SELECT tx.n, s.k, s.marca, lc.an_most, tx.rec,
         strpos(lower(tx.rec), s.marca) AS ini
  FROM texto_nor10 tx
  JOIN lectura_cli12 lc ON lc.n = tx.n
  CROSS JOIN (VALUES ('A', 'responsable último del cumplimiento'), ('B', 'semanalmente, todos los lunes'),
                     ('C', 'máximo de 6 meses'), ('D', 'puede recaer en el propio director clínico')) AS s(k, marca)
),
sembradas2 AS (
  SELECT s.*, CASE WHEN s.ini > 0 THEN s.ini + char_length(s.marca) - 1 END AS fin_dato,
         CASE WHEN s.ini > 0 THEN s.ini + char_length(s.marca) - 1 + nullif(strpos(substr(s.rec, s.ini + char_length(s.marca)), '.'), 0) END AS fin_frase
  FROM sembradas s
),
-- dónde empieza y acaba cada trozo de NOR-10 en el texto reconstruido (1 = primer carácter)
trozos_pos AS (
  SELECT pa.n, c.chunk_index, char_length(c.text) AS largo,
         sum(char_length(c.text) + 2) OVER (PARTITION BY pa.n ORDER BY c.chunk_index) - 2 AS fin
  FROM pasadas pa
  JOIN public.documents d ON d.id = pa.document_id
  JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1)
),
-- EL CORTE DE CADA PAREJA (sonda de la frase partida, F-127): el último carácter entregado del analizado
cortes AS (
  SELECT l.n, l.ord, l.nombre, l.l->>'regimen' AS regimen, l.an_most, l.an_car, tx.rec,
         substr(tx.rec, l.an_most, 1) AS ultimo,
         (SELECT tp.chunk_index FROM trozos_pos tp WHERE tp.n = l.n AND tp.fin - tp.largo + 1 <= l.an_most AND tp.fin >= l.an_most LIMIT 1) AS trozo,
         (SELECT max(tp.fin) FROM trozos_pos tp WHERE tp.n = l.n AND tp.fin <= l.an_most) AS limite_antes
  FROM lecturas l JOIN texto_nor10 tx ON tx.n = l.n
  WHERE l.an_most IS NOT NULL AND l.an_car IS NOT NULL AND l.an_most < l.an_car
),
-- LO QUE CITA EL JUEZ CERCA DEL CORTE: publicadas y descartadas por la puerta, lado NOR-10, en su pareja
cerca AS (
  SELECT 'publicada' AS destino, p.n, p.candidato, p.tema, p.cita_nuevo AS cita, k.an_most, k.rec
  FROM pub2 p JOIN cortes k ON k.n = p.n AND k.nombre = p.candidato
  UNION ALL
  SELECT 'descartada por la puerta', ju.n, ju.j->>'documentName', d->>'tema', coalesce(d->>'citaNuevo', ''), k.an_most, k.rec
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) d
  JOIN cortes k ON k.n = ju.n AND k.nombre = ju.j->>'documentName'
),
cerca2 AS (
  SELECT c.*, strpos(c.rec, c.cita) AS ini, strpos(c.rec, c.cita) + char_length(c.cita) - 1 AS fin
  FROM cerca c WHERE c.cita <> ''
),
cerca3 AS (
  SELECT c.*,
         CASE WHEN c.ini > 0 AND c.ini <= c.an_most AND c.fin > c.an_most
                THEN '⚠️ la cita CRUZA EL CORTE: sigue ' || (c.fin - c.an_most) || ' caracteres más allá de lo entregado (completó la frase)'
              WHEN c.ini > 0 AND c.fin = c.an_most THEN 'ACABA JUSTO EN EL CORTE: cita la media frase tal como le llegó'
              WHEN c.ini > 0 AND c.fin <= c.an_most AND c.fin > c.an_most - 500
                THEN 'dentro de los 500 anteriores al corte (acaba ' || (c.an_most - c.fin) || ' antes)'
              WHEN c.ini = 0 AND strpos(right(left(c.rec, c.an_most), 500), left(c.cita, 40)) > 0
                THEN '⚠️ NO literal y empieza en los 500 anteriores al corte: leer (¿completó la frase?)'
         END AS que
  FROM cerca2 c
),
contadores AS (
  SELECT pa.n, k.clave, coalesce(pa.pc ? k.clave, false) AS esta, pa.pc->>k.clave AS valor
  FROM pasadas pa
  CROSS JOIN (VALUES
    ('juez.citas_recompuestas'), ('juez.citas_recompuestas_en_trozos_distintos'), ('juez.citas_empalme_multiple'),
    ('juez.citas_sin_tramo_literal'), ('juez.recompuestas_bloqueadas_al_reclasificar'), ('juez.recompuestas_sin_contexto_del_resto')) AS k(clave)
),
control AS (
  SELECT 1 AS orden, 'pasadas de NOR-10 desde `desde`: esperado ' || p.esperado || ', medido ' || (SELECT count(*) FROM pasadas) AS medida,
         (SELECT count(*) FROM pasadas) = p.esperado AS ok
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de NOR-10 en la FRANJA PREVIA (del final de la línea base del 16/10 a DESDE): esperado 0, medido ' || (SELECT count(*) FROM previas) ||
         coalesce(' · horas: ' || (SELECT string_agg(to_char(h.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'), ', ' ORDER BY h.created_at) FROM previas h), ''),
         (SELECT count(*) FROM previas) = 0
  UNION ALL
  SELECT 3, 'documentos CLI-12 en la organización: esperado 1, medido ' || (SELECT count(*) FROM cli12),
         (SELECT count(*) FROM cli12) = 1
  UNION ALL
  SELECT 4, 'pasada ' || pa.n || ': document_id ' || coalesce(pa.document_id::text, 'NULO') || ' · trozos de NOR-10 en su generación activa ' ||
            coalesce((SELECT tx.trozos FROM texto_nor10 tx WHERE tx.n = pa.n), 0) || ', de ellos no de prosa ' || coalesce((SELECT tx.no_prosa FROM texto_nor10 tx WHERE tx.n = pa.n), 0),
         pa.document_id IS NOT NULL AND coalesce((SELECT tx.trozos FROM texto_nor10 tx WHERE tx.n = pa.n), 0) > 0
           AND coalesce((SELECT tx.no_prosa FROM texto_nor10 tx WHERE tx.n = pa.n), 1) = 0
  FROM pasadas pa
  UNION ALL
  SELECT 5, 'pasada ' || pa.n || ': texto reconstruido ' || coalesce((SELECT char_length(tx.rec)::text FROM texto_nor10 tx WHERE tx.n = pa.n), '—') ||
            ' = analizado.caracteres de la pareja con CLI-12 ' || coalesce((SELECT lc.an_car::text FROM lectura_cli12 lc WHERE lc.n = pa.n LIMIT 1), '—'),
         coalesce((SELECT char_length(tx.rec) FROM texto_nor10 tx WHERE tx.n = pa.n) = (SELECT lc.an_car FROM lectura_cli12 lc WHERE lc.n = pa.n LIMIT 1), false)
  FROM pasadas pa
  UNION ALL
  SELECT 6, 'pasada ' || pa.n || ': CLI-12 llegó al juez (hay pareja con él)', EXISTS (SELECT 1 FROM lectura_cli12 lc WHERE lc.n = pa.n)
  FROM pasadas pa
  UNION ALL
  SELECT 7, 'pasada ' || pa.n || ': los seis contadores de la puerta están (faltan ' || (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) ||
            ') y está juez.citas_rescatadas_quitando_glosa',
         (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) = 0 AND coalesce(pa.pc ? 'juez.citas_rescatadas_quitando_glosa', false)
  FROM pasadas pa
  UNION ALL
  SELECT 8, 'pasada ' || pa.n || ': contradictions_found ' || coalesce(pa.contradictions_found::text, '—') || ' = publicadas ' || (SELECT count(*) FROM pub2 e WHERE e.n = pa.n),
         pa.contradictions_found = (SELECT count(*) FROM pub2 e WHERE e.n = pa.n)
  FROM pasadas pa
  UNION ALL
  SELECT 9, 'pasada ' || pa.n || ': todas sus parejas llevan modelo (sin modelo: ' ||
         (SELECT count(*) FROM lecturas l WHERE l.n = pa.n AND l.modelo IS NULL) || ' de ' || (SELECT count(*) FROM lecturas l WHERE l.n = pa.n) || ')',
         (SELECT count(*) FROM lecturas l WHERE l.n = pa.n) > 0 AND (SELECT count(*) FROM lecturas l WHERE l.n = pa.n AND l.modelo IS NULL) = 0
  FROM pasadas pa
),
mediana AS (
  SELECT coalesce(m.grupo, 'TODAS') AS grupo, count(*) AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY largo) AS med, min(largo) AS mn, max(largo) AS mx
  FROM (SELECT largo, 'TODAS' AS grupo FROM citas UNION ALL SELECT largo, 'CLI-12' FROM citas WHERE candidato ILIKE 'CLI-12%') m
  GROUP BY m.grupo
)
SELECT bloque, pasada, a, b, c, texto
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS pasada, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, NULL::text AS texto, orden AS o1, 0::bigint AS o2
  FROM control
  UNION ALL
  -- 1 · LO QUE LEYÓ EL JUEZ, por pareja. En la de CLI-12, `candidato.mostrados` es el BLOQUE REAL (P-3)
  SELECT '1 · lectura de las parejas', 'pasada ' || l.n || ' · ' || to_char((SELECT pa.created_at FROM pasadas pa WHERE pa.n = l.n) AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'),
         coalesce(l.nombre, 'id ' || coalesce(l.doc_id, '—')) || CASE WHEN l.doc_id IN (SELECT id::text FROM cli12) THEN '  ◀ CLI-12' ELSE '' END,
         'régimen ' || coalesce(l.l->>'regimen', '—') || ' · presupuesto ' || coalesce(l.presupuesto::text, '—'),
         'analizado ' || coalesce(l.an_most::text, '—') || '/' || coalesce(l.an_car::text, '—') || ' dejó fuera ' || coalesce(l.l->'analizado'->>'dejoFuera', '—') ||
           ' · candidato (bloque real si va por relevancia) ' || coalesce(l.ca_most::text, '—') || '/' || coalesce(l.ca_car::text, '—') ||
           ' dejó fuera ' || coalesce(l.l->'candidato'->>'dejoFuera', '—') ||
           ' · analizado + candidato = presupuesto: ' || CASE WHEN l.presupuesto IS NULL THEN '—' WHEN l.an_most + l.ca_most = l.presupuesto THEN 'sí' ELSE 'NO (' || (l.an_most + l.ca_most) || ')' END,
         'MODELO ' || coalesce(l.modelo, '— (anterior a F-128)') || ' · TOKENS DE SALIDA ' || coalesce(l.tokens_salida, '—'),
         0, l.n * 100 + l.ord
  FROM lecturas l
  UNION ALL
  -- 2 · LO PUBLICADO: las dos citas enteras, su longitud, la marca y las dos comprobaciones de literalidad
  SELECT '2 · contradicciones publicadas', 'pasada ' || e.n, e.especie,
         coalesce(e.candidato, '—') || ' · ' || coalesce(e.severity, '—') || ' · confirmedBy: ' || coalesce(e.confirmado, '—') ||
           ' · marca recompuesta: ' || CASE WHEN e.marca IS NULL THEN 'no' ELSE 'SÍ' END ||
           ' · longitudes: nuevo ' || char_length(e.cita_nuevo) || ', existente ' || char_length(e.cita_existente) ||
           ' · ' || coalesce((SELECT coalesce(l.modelo, '— (anterior a F-128)') || ', ' || coalesce(l.tokens_salida, '—') || ' tokens de salida'
             FROM lecturas l WHERE l.n = e.n AND l.nombre = e.candidato LIMIT 1), 'pareja sin lectura'),
         'NUEVO en lo entregado: ' || e.nuevo_en_lo_entregado || ' · EXISTENTE: ' || e.existente_literal || ' · TEMA: ' || coalesce(e.tema, '—'),
         'NUEVO: ' || e.cita_nuevo || E'\nEXISTENTE: ' || e.cita_existente ||
           CASE WHEN e.marca IS NULL THEN '' ELSE
             coalesce(E'\nCITA DEL JUEZ (nuevo): ' || (e.marca->'nuevo'->>'citaDelJuez'), '') ||
             coalesce(E'\nCITA DEL JUEZ (existente): ' || (e.marca->'existente'->>'citaDelJuez'), '') END,
         0, e.n * 100 + e.ord
  FROM pub2 e
  UNION ALL
  SELECT '2 · contradicciones publicadas', 'pasada ' || pa.n, 'ninguna', NULL, NULL, NULL, 1, pa.n
  FROM pasadas pa WHERE NOT EXISTS (SELECT 1 FROM pub2 e WHERE e.n = pa.n)
  UNION ALL
  -- 3 · LA COMPROBACIÓN EXPLÍCITA, en una línea: citas del NUEVO que no están DENTRO de lo entregado
  SELECT '3 · citas del nuevo que NO están dentro de lo entregado', NULL,
         'de ' || count(*) || ' citas publicadas del lado NOR-10: ' || count(*) FILTER (WHERE nuevo_en_lo_entregado NOT LIKE 'literal, DENTRO%') || ' no están dentro',
         coalesce(string_agg(DISTINCT 'pasada ' || n || ' ' || especie || ': ' || nuevo_en_lo_entregado, ' | ') FILTER (WHERE nuevo_en_lo_entregado NOT LIKE 'literal, DENTRO%'), 'ninguna'),
         NULL, NULL, 0, 0
  FROM pub2
  UNION ALL
  -- 4 · LAS CUATRO FRASES SEMBRADAS en el lado de NOR-10, contra lo entregado en la pareja con CLI-12 (C-1 y P-3)
  SELECT '4 · frases sembradas de NOR-10 en lo entregado', 'pasada ' || s.n, s.k,
         CASE WHEN s.ini = 0 THEN 'NO ENCONTRADA en el texto reconstruido'
              ELSE 'empieza ' || s.ini || ' · el dato acaba ' || s.fin_dato || ' · la frase acaba ' || coalesce(s.fin_frase::text, '—') || ' · entregados ' || s.an_most END,
         CASE WHEN s.ini = 0 THEN '—'
              WHEN s.fin_frase IS NOT NULL AND s.fin_frase <= s.an_most THEN 'FRASE ENTERA DENTRO'
              WHEN s.fin_dato <= s.an_most THEN 'EL DATO DENTRO, LA FRASE CORTADA'
              ELSE 'FUERA' END,
         NULL, 0, s.n * 10 + ascii(s.k)
  FROM sembradas2 s
  UNION ALL
  -- 5 · LOS SEIS CONTADORES DE LA PUERTA por pasada (FALTA si no está, nunca 0)
  SELECT '5 · contadores de la puerta', 'pasada ' || pa.n,
         string_agg(replace(c.clave, 'juez.', '') || ' ' || CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END, ' · ' ORDER BY c.clave),
         NULL, NULL, NULL, 0, pa.n
  FROM pasadas pa JOIN contadores c ON c.n = pa.n
  GROUP BY pa.n
  UNION ALL
  -- 6 · LA MEDIANA de las citas publicadas (P-7)
  SELECT '6 · mediana de las citas publicadas', NULL, m.grupo, 'n ' || m.n || ' · mediana ' || round(m.med::numeric, 1),
         'mínimo ' || m.mn || ' · máximo ' || m.mx, NULL, CASE m.grupo WHEN 'TODAS' THEN 0 ELSE 1 END, 0
  FROM mediana m
  UNION ALL
  -- 7 · EL CORTE DE CADA PAREJA: dónde cae, si parte una frase, y qué palabras quedan a cada lado
  SELECT '7 · el corte de cada pareja', 'pasada ' || k.n, coalesce(k.nombre, '—') || ' · ' || coalesce(k.regimen, '—'),
         'corte en ' || k.an_most || ' de ' || k.an_car || ' · ' ||
           CASE WHEN k.ultimo IN ('.', E'\n') THEN 'NO parte frase (acaba en ' || CASE k.ultimo WHEN '.' THEN 'punto' ELSE 'salto de línea' END || ')'
                ELSE 'PARTE UNA FRASE' END ||
           ' · trozo ' || coalesce(k.trozo::text, '—') || ' · último límite de trozo antes del corte: ' || coalesce(k.limite_antes::text, '—') ||
           coalesce(' (cortar ahí dejaría fuera ' || (k.an_most - k.limite_antes) || ' más)', ''),
         NULL,
         'ANTES: …' || substr(k.rec, greatest(k.an_most - 89, 1), least(90, k.an_most)) || E'\nDESPUÉS: ' || substr(k.rec, k.an_most + 1, 70) || '…',
         0, k.n * 100 + k.ord
  FROM cortes k
  UNION ALL
  -- 8 · LO QUE EL JUEZ CITA CERCA DEL CORTE (los 500 anteriores, o cruzándolo), publicado o descartado
  SELECT '8 · lo que cita el juez cerca del corte', 'pasada ' || c.n, c.destino,
         coalesce(c.candidato, '—') || ' · corte en ' || c.an_most || ' · cita de ' || char_length(c.cita) || ' caracteres' ||
           CASE WHEN c.ini > 0 THEN ', de ' || c.ini || ' a ' || c.fin ELSE ', no literal' END,
         c.que || ' · TEMA: ' || coalesce(c.tema, '—'), c.cita, 0, c.n
  FROM cerca3 c WHERE c.que IS NOT NULL
  UNION ALL
  SELECT '8 · lo que cita el juez cerca del corte', NULL, 'ninguna cita, publicada ni descartada, en los 500 anteriores al corte ni cruzándolo',
         NULL, NULL, NULL, 1, 0
  WHERE NOT EXISTS (SELECT 1 FROM cerca3 c WHERE c.que IS NOT NULL)
) t
ORDER BY bloque, o1, o2, pasada;
