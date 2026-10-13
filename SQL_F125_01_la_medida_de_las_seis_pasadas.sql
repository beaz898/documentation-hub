-- ============================================================================
-- F-125 · FASE 3.1 · LA MEDIDA DE LAS SEIS PASADAS DE NOR-11 CON LA PUERTA
-- ANCLADA POR EL TRAMO LITERAL MÁS LARGO (0ab6e7d6) — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
-- ⚠️ SACA TEXTO DE DOCUMENTO, ENTERO: las citas publicadas, las frases reales
-- del tramo y las citas de los descartes. Son NOR-11, CLI-13 y lo que el juez
-- compare en esas pasadas, documentos del corpus de pruebas, NO de un cliente.
-- ✅ PROBADO ANTES DE ENTREGARLO (13/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): con seis pasadas como las esperadas todos los
-- controles salen OK; y sale FALLA cuando hay cinco o siete pasadas, cuando a
-- una pasada le falta un contador del tramo (que NO sale como cero), cuando no
-- está el contador de la glosa que el juez emite siempre (el control de que se
-- lee la columna buena), y cuando contradictions_found no cuadra con lo publicado.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 13/10/2026): las siete predicciones escritas antes de
-- medir, sobre las seis pasadas de NOR-11 posteriores al despliegue de
-- 0ab6e7d6 (en verde a las 11:37 hora de Madrid = 09:37 UTC del 13/10/2026):
--   P-ARQ-F125-1 · LUGAR publicada en 5 de 6 o más, con las FRASES REALES y nunca
--                  el empalme ............................ bloques 2 y 4
--   P-ARQ-F125-2 · PLAZO y NEGACIÓN, 6 de 6 ............... bloque 2
--   P-ARQ-F125-3 · cero falsos positivos .................. bloque 2 (especie OTRA)
--   P-ARQ-F125-4 · citas_recompuestas >= 1 y en_trozos_distintos = 0 .. bloque 3
--   P-ARQ-F125-5 · bloqueadas_al_reclasificar = 0 y sin_contexto_del_resto = 0
--                                                         .. bloque 3
--   P-ARQ-F125-6 · ninguna recompuesta registrada como segmentos_de_fila
--                                                         .. bloque 5
--   P-ARQ-F125-7 · el marcador, las tres en la misma pasada, 5 de 6 o más
--                                                         .. bloque 1 (columna)
-- La consulta NO califica: enseña. Las calificaciones son del arquitecto.
--
-- ⚠️ QUÉ PASADAS: las de NOR-11 —cualquier tipo de análisis, que sale en el
-- bloque 1— cuya hora guardada es posterior a las 09:37 UTC del 13/10/2026. La
-- hora guardada es la del FINAL del análisis (B.82): una pasada lanzada antes
-- del despliegue y terminada después entraría. El director las lanza después.
--
-- DE DÓNDE SALE CADA COSA:
--   · lo PUBLICADO: `analysis->'discrepancies'` (synthesize.ts,
--     construirDiscrepancias). Esa lista es CERRADA y NO lleva la marca
--     `recompuesta`: la marca vive en `analysis->'judgments'[].contradictions[]`,
--     y el bloque 2 la busca allí por candidato y por las dos citas;
--   · los contadores: la columna `pipeline_counters` (F-82);
--   · `citasAlTramo` y `descartesPorCita`: en `analysis->'judgments'[]`.
--
-- ESPECIE de una contradicción publicada (bloque 2), por su `topic`, sin
-- distinguir mayúsculas ni acentos: PLAZO si dice «plazo»; NEGACIÓN si dice
-- «color» y «contenedor»; LUGAR si dice «retirada» o «ubicacion»; si no, OTRA.
-- Una OTRA se lee antes de llamarla falso positivo.
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   · hay exactamente 6 pasadas (si hay 5 o 7, sale FALLA con el número);
--   · por pasada, los SEIS contadores del tramo están en `pipeline_counters`.
--     Uno que falte sale «FALTA», nunca 0: un contador que desaparece no se
--     distingue de uno que nadie emitió (F-82);
--   · por pasada, está `juez.citas_rescatadas_quitando_glosa`, que el juez emite
--     SIEMPRE: si falta, se está leyendo la columna equivocada y los ceros del
--     bloque 3 no valen nada;
--   · por pasada, `contradictions_found` = las contradicciones del bloque 2.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         timestamptz '2026-10-13 09:37:00+00' AS desde,          -- ← el despliegue de 0ab6e7d6
         6 AS esperado_pasadas
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis_type, ar.contradictions_found, ar.pipeline_counters AS pc, ar.analysis,
         row_number() OVER (ORDER BY ar.created_at) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-11%' AND ar.created_at >= p.desde
),
juicios AS (
  SELECT pa.n, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array' THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
),
publicadas AS (
  SELECT pa.n, x.ord, d->>'existingDocument' AS candidato, d->>'severity' AS severity, d->>'confirmedBy' AS confirmado,
         d->>'topic' AS tema, d->>'newDocSays' AS cita_nuevo, d->>'existingDocSays' AS cita_existente,
         translate(lower(coalesce(d->>'topic', '')), 'áéíóúüñ', 'aeiouun') AS t
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(d, ord)
),
-- la marca, buscada en el juicio de su candidato por las dos citas publicadas
marcas AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, c->>'newDocSays' AS cita_nuevo, c->>'existingDocSays' AS cita_existente,
         c->'recompuesta' AS marca
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE '[]'::jsonb END) c
),
publicadas_con_especie AS (
  SELECT p.*,
         CASE WHEN t LIKE '%plazo%' THEN 'PLAZO'
              WHEN t LIKE '%color%' AND t LIKE '%contenedor%' THEN 'NEGACIÓN'
              WHEN t LIKE '%retirada%' OR t LIKE '%ubicacion%' THEN 'LUGAR'
              ELSE 'OTRA' END AS especie,
         (SELECT m.marca FROM marcas m
           WHERE m.n = p.n AND m.candidato = p.candidato AND m.cita_nuevo = p.cita_nuevo AND m.cita_existente = p.cita_existente
             AND m.marca IS NOT NULL LIMIT 1) AS marca
  FROM publicadas p
),
tramo AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, x.ord, r
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'citasAlTramo') = 'array' THEN ju.j->'citasAlTramo' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(r, ord)
),
descartes AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, x.ord, d, lado.nombre AS lado, d->lado.nombre AS datos,
         CASE WHEN lado.nombre = 'nuevo' THEN d->>'citaNuevo' ELSE d->>'citaExistente' END AS cita
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(d, ord)
  CROSS JOIN (VALUES ('nuevo'), ('existente')) AS lado(nombre)
),
contadores AS (
  SELECT pa.n, k.clave, pa.pc ? k.clave AS esta, pa.pc->>k.clave AS valor
  FROM pasadas pa
  CROSS JOIN (VALUES
    (1, 'juez.citas_recompuestas'),
    (2, 'juez.citas_recompuestas_en_trozos_distintos'),
    (3, 'juez.citas_empalme_multiple'),
    (4, 'juez.citas_sin_tramo_literal'),
    (5, 'juez.recompuestas_bloqueadas_al_reclasificar'),
    (6, 'juez.recompuestas_sin_contexto_del_resto')) AS k(orden, clave)
),
control AS (
  SELECT 1 AS orden, 'pasadas de NOR-11 desde las 09:37 UTC: esperado ' || p.esperado_pasadas || ', medido ' || count(pa.n) AS medida,
         count(pa.n) = p.esperado_pasadas AS ok
  FROM parametros p LEFT JOIN pasadas pa ON true GROUP BY p.esperado_pasadas
  UNION ALL
  SELECT 2, 'pasada ' || pa.n || ': los seis contadores del tramo están (faltan ' ||
            (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT coalesce(c.esta, false)) || ')',
         (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT coalesce(c.esta, false)) = 0
  FROM pasadas pa
  UNION ALL
  SELECT 3, 'pasada ' || pa.n || ': está juez.citas_rescatadas_quitando_glosa (se lee la columna buena)',
         coalesce(pa.pc ? 'juez.citas_rescatadas_quitando_glosa', false)
  FROM pasadas pa
  UNION ALL
  SELECT 4, 'pasada ' || pa.n || ': contradictions_found ' || coalesce(pa.contradictions_found::text, '—') ||
            ' = publicadas ' || (SELECT count(*) FROM publicadas p WHERE p.n = pa.n),
         pa.contradictions_found = (SELECT count(*) FROM publicadas p WHERE p.n = pa.n)
  FROM pasadas pa
)
SELECT bloque, pasada, a, b, c, texto
FROM (
  SELECT '0 · control' AS bloque, NULL::bigint AS pasada, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, NULL::text AS texto, orden AS o1, 0::bigint AS o2
  FROM control
  UNION ALL
  -- 1 · EL CENSO, con el marcador de P-ARQ-F125-7 (las tres sembradas publicadas en la pasada)
  SELECT '1 · censo de las pasadas', pa.n,
         to_char(pa.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid (hora guardada: la del final)',
         'id ' || pa.id || ' · ' || coalesce(pa.analysis_type, '—') || ' · contradictions_found ' || coalesce(pa.contradictions_found::text, '—'),
         'especies publicadas: ' || coalesce((SELECT string_agg(DISTINCT e.especie, ' + ' ORDER BY e.especie) FROM publicadas_con_especie e WHERE e.n = pa.n), 'ninguna') ||
         ' · marcador ' || (SELECT count(DISTINCT e.especie) FROM publicadas_con_especie e WHERE e.n = pa.n AND e.especie IN ('PLAZO', 'NEGACIÓN', 'LUGAR')) || '/3',
         NULL, 0, pa.n
  FROM pasadas pa
  UNION ALL
  -- 2 · LO PUBLICADO, con las dos citas enteras y la marca
  SELECT '2 · contradicciones publicadas', e.n, e.especie,
         coalesce(e.candidato, '—') || ' · ' || coalesce(e.severity, '—') || ' · confirmedBy: ' || coalesce(e.confirmado, '—') ||
           ' · marca recompuesta: ' || CASE WHEN e.marca IS NULL THEN 'no' ELSE 'SÍ (lado ' ||
             concat_ws(' y ', CASE WHEN e.marca ? 'nuevo' THEN 'nuevo' END, CASE WHEN e.marca ? 'existente' THEN 'existente' END) || ')' END,
         e.tema,
         'NUEVO: ' || coalesce(e.cita_nuevo, '—') || E'\nEXISTENTE: ' || coalesce(e.cita_existente, '—') ||
           CASE WHEN e.marca IS NULL THEN '' ELSE
             coalesce(E'\nCITA DEL JUEZ (nuevo): ' || (e.marca->'nuevo'->>'citaDelJuez'), '') ||
             coalesce(E'\nFRASE DEL RESTO (nuevo): ' || (e.marca->'nuevo'->'fraseDelResto'->>'texto'), '') ||
             coalesce(E'\nCITA DEL JUEZ (existente): ' || (e.marca->'existente'->>'citaDelJuez'), '') ||
             coalesce(E'\nFRASE DEL RESTO (existente): ' || (e.marca->'existente'->'fraseDelResto'->>'texto'), '') END,
         0, e.n * 100 + e.ord
  FROM publicadas_con_especie e
  UNION ALL
  -- 3 · LOS SEIS CONTADORES DEL TRAMO, uno por columna lógica (FALTA si no está)
  SELECT '3 · contadores del tramo', pa.n,
         'recompuestas ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_recompuestas') ||
         ' · en_trozos_distintos ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_recompuestas_en_trozos_distintos'),
         'empalme_multiple ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_empalme_multiple') ||
         ' · sin_tramo_literal ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_sin_tramo_literal'),
         'bloqueadas_al_reclasificar ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.recompuestas_bloqueadas_al_reclasificar') ||
         ' · sin_contexto_del_resto ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.recompuestas_sin_contexto_del_resto'),
         NULL, 0, pa.n
  FROM pasadas pa
  UNION ALL
  -- 4 · citasAlTramo, ENTERO
  SELECT '4 · citasAlTramo', t.n, coalesce(t.r->>'salida', '—'),
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
  -- 5 · LAS DOS TRAMPAS DE paso: el recuento, y las segmentos_de_fila con su cita
  SELECT '5 · trampas de paso: recuento', NULL,
         'paso=recompuesta: ' || count(*) FILTER (WHERE d.datos->>'paso' = 'recompuesta'),
         'paso=segmentos_de_fila: ' || count(*) FILTER (WHERE d.datos->>'paso' = 'segmentos_de_fila'),
         'lados de descarte leídos: ' || count(*),
         NULL, 0, 0
  FROM descartes d
  UNION ALL
  SELECT '5 · trampas de paso: segmentos_de_fila', d.n, d.lado,
         coalesce(d.candidato, '—') || ' · ' || coalesce(d.d->>'tipo', '—') || ' · verificada ' || coalesce(d.datos->>'verificada', '—') ||
           ' · lado fallido ' || coalesce(d.d->>'ladoFallido', '—') || ' · pajar ' || coalesce(d.datos->>'pajar', '—'),
         d.d->>'tema', d.cita, 1, d.n * 100 + d.ord
  FROM descartes d
  WHERE d.datos->>'paso' = 'segmentos_de_fila'
) t
ORDER BY bloque, o1, pasada, o2;
