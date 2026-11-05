-- ============================================================================
-- SQL_34_09 · EL VERIFICADOR NUEVO EN LA TANDA DE 20: EL CONTADOR DEL CUMPLIMIENTO Y LAS RESPUESTAS MALFORMADAS,
-- FRENTE A LA LÍNEA BASE — SÓLO LECTURA (02/11/2026)
-- ✅ EJECUTADO por el director (consta en claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md:1600, 1639 y 1903 (salidas literales, ejecutada por el director el 02/11); cabecera corregida el 05/11/2026: decía PENDIENTE DE EJECUTAR). Sólo SELECT: no escribe, no borra, no cambia nada. La ejecuta el director; Code no
-- ejecuta consultas.
--
-- PARA QUÉ (arquitecto, 02/11): la medición de 20 pasadas con el verificador nuevo (`f1d94cbc`, las dos preguntas a todo
-- hallazgo) tiene que reportar dos cifras que no da ninguna consulta existente:
--   (a) el TOTAL de `verificador.confirmados_solo_por_cumplimiento` de toda la tanda: lo que confirmó sólo la pregunta 2.
--       Es el ruido además de la señal: si D sale, ¿cuántos más salieron por esa vía?
--   (b) `descartado.sin_veredicto` FRENTE AL DE LA LÍNEA BASE, como guarda de regresión: ahora el modelo contesta dos
--       campos por hallazgo, y un aumento de respuestas malformadas mataría hallazgos en silencio.
-- Lo que A, B, C, D y el quinto hicieron en la tanda lo siguen dando SQL_34_06 (y SQL_34_07 si hay agujeros).
--
-- DE DÓNDE LEE, por análisis: `analysis->'pipelineCounters'` (el contador nuevo y `verificador.hallazgos_entrantes`, que es
-- el denominador: los hallazgos que llegaron a la cascada del verificador) y `analysis->'discardedFindings'` (la suma de
-- los descartes de todas las parejas, synthesize.ts; ahí cae `descartado.sin_veredicto`).
--
-- LAS CUATRO MEDICIONES:
--   · línea base, D: NOR-10, del 30/10 a las 23:40 al 31/10 a las 23:35 (Madrid), 21 pasadas · RELLENA.
--   · línea base, el quinto: NOR-11, 28/10 de 08:30 a 09:00, 13 pasadas · RELLENA.
--   · tanda nueva, NOR-10, 20 pasadas · DESDE y HASTA EN NULO: se rellenan DESPUÉS de mirar la lista.
--   · tanda nueva, NOR-11, 20 pasadas · ídem.
-- DOS PULSACIONES, como SQL_34_06: con alguna ventana nueva en NULO, LISTA las pasadas rápidas de NOR-10 y NOR-11 desde el
-- 02/11 a las 00:00 (Madrid), con su hora y si llevan el contador nuevo (= corrieron con el verificador nuevo). Con las
-- dos ventanas nuevas rellenas, mide.
--
-- CONTROLES: las pasadas frente a las esperadas en las cuatro mediciones; que sean rápidas; y DOS CONTROLES POSITIVOS, que
-- pueden fallar:
--   · en la TANDA NUEVA, TODAS las pasadas llevan el contador nuevo: si alguna no lo lleva, corrió con el código viejo
--     (Vercel aún no había desplegado) y la tanda no mide el verificador nuevo;
--   · en la LÍNEA BASE, NINGUNA lo lleva: si alguna lo llevara, la consulta no está leyendo lo que cree.
-- ============================================================================
-- ── LA RESOLUCIÓN DE LA ORGANIZACIÓN (26/10/2026), IDÉNTICA EN TODAS LAS CONSULTAS QUE MIRAN HACIA DELANTE ──
-- La organización NO se escribe: es la ÚNICA a la que pertenece el USUARIO del director. Si tiene cero o más de una,
-- la primera fila de la salida lo dice a gritos y todo lo demás está leyendo NADA.
-- ⚠️ a9625e93-af2a-4416-a465-5c2fa2a25bdf ES A LA VEZ EL ID DEL USUARIO DEL DIRECTOR Y EL DE LA ORGANIZACIÓN DEL
-- PILOTO (purgada el 25/10/2026). AQUÍ ES EL USUARIO. NO SE UNIFICA con ORG_DEL_PILOTO de SQL_SEG_02.
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
  SELECT CASE WHEN r.org IS NOT NULL
              THEN 'organización leída: ' || r.org || ' · «' || coalesce(o.name, '¿sin nombre?') || '» · '
                   || (SELECT count(*) FROM public.documents d WHERE d.org_id = r.org) || ' documentos'
              ELSE '⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' || r.usuario || ' tiene ' || r.pertenencias
                   || ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.' END AS linea
  FROM resolucion r LEFT JOIN public.organizations o ON o.id::text = r.org
),
mediciones (orden, tanda, documento, desde, hasta, esperado) AS (
  VALUES (1, 'línea base', 'NOR-10', timestamptz '2026-10-30 23:40:00+01', timestamptz '2026-10-31 23:35:00+01', 21),
         (2, 'línea base', 'NOR-11', timestamptz '2026-10-28 08:30:00+01', timestamptz '2026-10-28 09:00:00+01', 13),
         (3, 'tanda nueva', 'NOR-10', NULL::timestamptz, NULL::timestamptz, 20),   -- ← DESDE y HASTA de la tanda nueva de NOR-10
         (4, 'tanda nueva', 'NOR-11', NULL::timestamptz, NULL::timestamptz, 20)    -- ← DESDE y HASTA de la tanda nueva de NOR-11
),
modo AS (   -- con alguna ventana nueva sin rellenar, la consulta LISTA en vez de medir
  SELECT bool_or(desde IS NULL OR hasta IS NULL) AS sin_ventana FROM mediciones WHERE tanda = 'tanda nueva'
),
pasadas AS (
  SELECT m.orden, m.tanda, m.documento, m.esperado, ar.created_at, ar.analysis_type,
         jsonb_typeof(ar.analysis->'pipelineCounters') = 'object'
           AND (ar.analysis->'pipelineCounters') ? 'verificador.confirmados_solo_por_cumplimiento' AS con_contador,
         coalesce((ar.analysis->'pipelineCounters'->>'verificador.confirmados_solo_por_cumplimiento')::bigint, 0) AS solo_cumplimiento,
         coalesce((ar.analysis->'pipelineCounters'->>'verificador.hallazgos_entrantes')::bigint, 0) AS entrantes,
         coalesce((ar.analysis->'discardedFindings'->>'descartado.sin_veredicto')::bigint, 0) AS sin_veredicto
  FROM mediciones m
  JOIN public.analysis_results ar ON ar.org_id = (SELECT org FROM resolucion) AND ar.document_name LIKE m.documento || '%'
                                 AND ar.created_at >= m.desde AND ar.created_at < m.hasta
),
por_medicion AS (
  SELECT m.orden, m.tanda, m.documento, m.esperado,
         count(p.created_at) AS n,
         count(p.created_at) FILTER (WHERE p.con_contador) AS con_contador,
         count(p.created_at) FILTER (WHERE p.analysis_type IS DISTINCT FROM 'quick') AS no_rapidas,
         coalesce(sum(p.solo_cumplimiento), 0) AS solo_cumplimiento,
         count(p.created_at) FILTER (WHERE p.solo_cumplimiento > 0) AS pasadas_con_solo_cumplimiento,
         coalesce(sum(p.entrantes), 0) AS entrantes,
         coalesce(sum(p.sin_veredicto), 0) AS sin_veredicto,
         count(p.created_at) FILTER (WHERE p.sin_veredicto > 0) AS pasadas_con_sin_veredicto
  FROM mediciones m LEFT JOIN pasadas p ON p.orden = m.orden
  GROUP BY m.orden, m.tanda, m.documento, m.esperado
),
control (orden, medida, ok) AS (
  SELECT 10 + x.orden, x.tanda || ' · ' || x.documento || ' · pasadas en su ventana: ' || x.n || ' · esperado: ' || x.esperado,
         x.n = x.esperado
  FROM por_medicion x
  UNION ALL
  SELECT 20, 'pasadas que no son rápidas: ' || (SELECT sum(no_rapidas) FROM por_medicion),
         CASE WHEN (SELECT sum(n) FROM por_medicion) = 0 THEN NULL ELSE (SELECT sum(no_rapidas) FROM por_medicion) = 0 END
  UNION ALL
  -- CONTROL POSITIVO DEL DESPLIEGUE: toda pasada de la tanda nueva corrió con el verificador nuevo
  SELECT 30, 'CONTROL POSITIVO · pasadas de la tanda nueva con el contador nuevo (corrieron con el verificador nuevo): '
            || (SELECT coalesce(sum(con_contador), 0) FROM por_medicion WHERE tanda = 'tanda nueva') || ' de '
            || (SELECT coalesce(sum(n), 0) FROM por_medicion WHERE tanda = 'tanda nueva'),
         CASE WHEN (SELECT coalesce(sum(n), 0) FROM por_medicion WHERE tanda = 'tanda nueva') = 0 THEN NULL
              ELSE (SELECT sum(con_contador) FROM por_medicion WHERE tanda = 'tanda nueva') = (SELECT sum(n) FROM por_medicion WHERE tanda = 'tanda nueva') END
  UNION ALL
  -- y su espejo: la línea base es anterior al cambio, y ninguna pasada puede llevarlo
  SELECT 40, 'pasadas de la línea base con el contador nuevo (tienen que ser 0): '
            || (SELECT coalesce(sum(con_contador), 0) FROM por_medicion WHERE tanda = 'línea base'),
         CASE WHEN (SELECT coalesce(sum(n), 0) FROM por_medicion WHERE tanda = 'línea base') = 0 THEN NULL
              ELSE (SELECT sum(con_contador) FROM por_medicion WHERE tanda = 'línea base') = 0 END
),
listado AS (   -- SIN VENTANA NUEVA: las pasadas rápidas de NOR-10 y NOR-11 desde el 02/11, para fijar las ventanas
  SELECT d.documento, ar.created_at,
         jsonb_typeof(ar.analysis->'pipelineCounters') = 'object'
           AND (ar.analysis->'pipelineCounters') ? 'verificador.confirmados_solo_por_cumplimiento' AS con_contador,
         row_number() OVER (PARTITION BY d.documento ORDER BY ar.created_at, ar.id) AS n
  FROM (VALUES ('NOR-10'), ('NOR-11')) d(documento)
  JOIN public.analysis_results ar ON ar.org_id = (SELECT org FROM resolucion) AND ar.document_name LIKE d.documento || '%'
                                 AND ar.analysis_type = 'quick' AND ar.created_at >= timestamptz '2026-11-02 00:00:00+01'
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1, 0 AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · sin ventana: las pasadas rápidas desde el 02/11', l.documento || ' · pasada ' || l.n || ' · '
           || to_char(l.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI:SS') || ' (hora de Madrid)',
         CASE WHEN l.con_contador THEN 'con el verificador nuevo' ELSE '⚠️ SIN el contador: código viejo' END, NULL, NULL,
         CASE WHEN l.documento = 'NOR-10' THEN 1 ELSE 2 END, l.n::int
  FROM listado l, modo WHERE modo.sin_ventana
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, NULL, orden, 0
  FROM control, modo WHERE NOT modo.sin_ventana
  UNION ALL
  -- 1 · por medición: las dos cifras, con su denominador
  SELECT '1 · por medición', x.tanda || ' · ' || x.documento || ' · ' || x.n || ' pasadas',
         '(a) confirmados SÓLO por la pregunta del cumplimiento: ' || x.solo_cumplimiento || ' en ' || x.pasadas_con_solo_cumplimiento
           || ' pasadas' || CASE WHEN x.con_contador = 0 THEN ' (sin el contador: anterior al cambio)' ELSE '' END,
         '(b) descartado.sin_veredicto: ' || x.sin_veredicto || ' en ' || x.pasadas_con_sin_veredicto || ' pasadas, de '
           || x.entrantes || ' hallazgos que llegaron al verificador',
         CASE WHEN x.n = 0 THEN NULL ELSE 'por pasada: ' || round(x.sin_veredicto::numeric / x.n, 2) || ' sin veredicto' END,
         x.orden, 0
  FROM por_medicion x, modo WHERE NOT modo.sin_ventana
  UNION ALL
  -- 2 · la guarda de regresión: sin_veredicto, tanda nueva frente a línea base, por documento
  SELECT '2 · sin_veredicto, nueva frente a base', b.documento,
         'línea base: ' || b.sin_veredicto || ' de ' || b.entrantes || ' en ' || b.n || ' pasadas · tanda nueva: '
           || n.sin_veredicto || ' de ' || n.entrantes || ' en ' || n.n || ' pasadas',
         CASE WHEN n.sin_veredicto > b.sin_veredicto THEN '⚠️ SUBE' WHEN n.sin_veredicto < b.sin_veredicto THEN 'baja' ELSE 'igual' END,
         NULL, CASE WHEN b.documento = 'NOR-10' THEN 1 ELSE 2 END, 0
  FROM por_medicion b JOIN por_medicion n ON n.documento = b.documento AND n.tanda = 'tanda nueva', modo
  WHERE b.tanda = 'línea base' AND NOT modo.sin_ventana
  UNION ALL
  -- 3 · el total de la tanda nueva: lo que confirmó sólo la pregunta 2, en las dos parejas juntas
  SELECT '3 · el total de la tanda nueva',
         'confirmados SÓLO por la pregunta del cumplimiento: ' || coalesce(sum(x.solo_cumplimiento), 0) || ' en '
           || coalesce(sum(x.pasadas_con_solo_cumplimiento), 0) || ' de ' || coalesce(sum(x.n), 0) || ' pasadas',
         NULL, NULL, NULL, 99, 0
  FROM por_medicion x, modo WHERE x.tanda = 'tanda nueva' AND NOT modo.sin_ventana
  GROUP BY modo.sin_ventana
) z
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2;
