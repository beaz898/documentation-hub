-- ============================================================================
-- SQL_34_11 · ¿CON QUÉ CÓDIGO CORRE EL EXHAUSTIVO? LOS MARCADORES DE CADA ANÁLISIS EXHAUSTIVO FRENTE A LA FECHA EN QUE
-- CADA MARCADOR YA ESTABA EN LOS RÁPIDOS — SÓLO LECTURA (03/11/2026)
-- ✅ EJECUTADO por el director el 04/11/2026: caso 3, cero exhaustivos en la organización actual (que existe desde el 26/10).
-- Salida literal en claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- PARA QUÉ (arquitecto, 03/11): el typecheck del worker está en rojo desde el 25/09 (2b6d7002), y desde entonces 68
-- commits han tocado su grafo de tipos, entre ellos el verificador nuevo (f1d94cbc, 02/11). Si el despliegue del worker
-- en Railway falla por eso, el EXHAUSTIVO corre el código de antes y desde fuera no se nota: un despliegue fallido deja
-- corriendo el anterior. Esta consulta mide el comportamiento DESPLEGADO en vez de deducirlo de la configuración.
--
-- LOS TRES MARCADORES, cada uno un campo que el código empieza a escribir en un commit conocido y que el exhaustivo
-- hereda (el exhaustivo pasa por runCorePipeline, lib/analysis/pipeline.ts:1337, y su resultado lleva `...pipelineResult`,
-- :1535; el worker lo guarda con analysis_type = 'exhaustive', worker/src/index.ts:252):
--   1 · `lecturaDeLasParejas` (array): desde 34d67fb5, 29/09. Es POSTERIOR a la ruptura del 25/09, así que un worker
--       parado ahí no lo tiene.
--   2 · `llamadasAlModelo` (objeto): desde e61dac5b, 21/10.
--   3 · `pipelineCounters` con la clave `verificador.confirmados_solo_por_cumplimiento`: desde f1d94cbc, 02/11 (se escribe
--       siempre, también a cero, pipeline.ts:1160).
-- ⚠️ LA FECHA DE UN COMMIT NO ES LA DE SU DESPLIEGUE. Así que el «desde» de cada marcador NO se escribe aquí: se MIDE, y es
-- la hora del PRIMER análisis RÁPIDO de la organización que ya lo lleva (los rápidos corren en Vercel). Un exhaustivo
-- posterior a esa hora que no lo lleva corrió con código anterior a ese marcador.
--
-- LA LECTURA, escrita antes de ejecutarla (arquitecto):
--   · hay exhaustivos posteriores al «desde» del marcador 3, y lo llevan → el worker está al día;
--   · hay y NO lo llevan → el worker corre código viejo (y los marcadores 1 y 2 dicen cuánto);
--   · no hay ninguno posterior → no concluye nada, y hace falta Railway.
--
-- CONTROLES: la organización; y un CONTROL POSITIVO por marcador, que puede fallar: algún rápido lo lleva (si ninguno lo
-- llevara, el marcador no se está leyendo como se cree y su «desde» no existe).
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
analisis AS (   -- todos los análisis de la organización desde el 20/09, con sus tres marcadores
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type,
         coalesce(jsonb_typeof(ar.analysis->'lecturaDeLasParejas') = 'array', false) AS m1,
         coalesce(jsonb_typeof(ar.analysis->'llamadasAlModelo') = 'object', false) AS m2,
         coalesce(jsonb_typeof(ar.analysis->'pipelineCounters') = 'object'
                  AND (ar.analysis->'pipelineCounters') ? 'verificador.confirmados_solo_por_cumplimiento', false) AS m3
  FROM public.analysis_results ar
  WHERE ar.org_id = (SELECT org FROM resolucion) AND ar.created_at >= timestamptz '2026-09-20 00:00:00+02'
),
desde AS (   -- el «desde» MEDIDO de cada marcador: el primer rápido que ya lo lleva
  SELECT (SELECT min(created_at) FROM analisis WHERE analysis_type = 'quick' AND m1) AS d1,
         (SELECT min(created_at) FROM analisis WHERE analysis_type = 'quick' AND m2) AS d2,
         (SELECT min(created_at) FROM analisis WHERE analysis_type = 'quick' AND m3) AS d3
),
exhaustivos AS (
  SELECT a.*, row_number() OVER (ORDER BY a.created_at, a.id) AS n,
         array_remove(ARRAY[
           CASE WHEN d.d1 IS NOT NULL AND a.created_at > d.d1 AND NOT a.m1 THEN 'lecturaDeLasParejas (29/09)' END,
           CASE WHEN d.d2 IS NOT NULL AND a.created_at > d.d2 AND NOT a.m2 THEN 'llamadasAlModelo (21/10)' END,
           CASE WHEN d.d3 IS NOT NULL AND a.created_at > d.d3 AND NOT a.m3 THEN 'el contador del verificador nuevo (02/11)' END
         ], NULL) AS le_faltan,
         d.d3 IS NOT NULL AND a.created_at > d.d3 AS despues_del_3
  FROM analisis a, desde d
  WHERE a.analysis_type = 'exhaustive'
),
control (orden, medida, ok) AS (
  SELECT 1, 'CONTROL POSITIVO · marcador 1, lecturaDeLasParejas: el primer rápido que lo lleva: '
            || coalesce(to_char((SELECT d1 FROM desde) AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'NINGUNO'),
         (SELECT d1 FROM desde) IS NOT NULL
  UNION ALL
  SELECT 2, 'CONTROL POSITIVO · marcador 2, llamadasAlModelo: el primer rápido que lo lleva: '
            || coalesce(to_char((SELECT d2 FROM desde) AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'NINGUNO'),
         (SELECT d2 FROM desde) IS NOT NULL
  UNION ALL
  SELECT 3, 'CONTROL POSITIVO · marcador 3, el contador del verificador nuevo: el primer rápido que lo lleva: '
            || coalesce(to_char((SELECT d3 FROM desde) AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'NINGUNO'),
         (SELECT d3 FROM desde) IS NOT NULL
)
SELECT bloque, a, b, c FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, 0 AS o1, 0::bigint AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, orden, 0
  FROM control
  UNION ALL
  -- 1 · cada exhaustivo desde el 20/09: sus marcadores, y si le falta alguno que ya estaba en los rápidos a su hora
  SELECT '1 · por exhaustivo', 'exhaustivo ' || e.n || ' · ' || to_char(e.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI')
           || ' (hora de Madrid) · ' || e.document_name,
         'marcadores: 1 ' || CASE WHEN e.m1 THEN 'sí' ELSE 'no' END || ' · 2 ' || CASE WHEN e.m2 THEN 'sí' ELSE 'no' END
           || ' · 3 ' || CASE WHEN e.m3 THEN 'sí' ELSE 'no' END,
         CASE WHEN cardinality(e.le_faltan) = 0 THEN 'al día para su fecha'
              ELSE '⚠️⚠️ CÓDIGO VIEJO: le falta ' || array_to_string(e.le_faltan, ', ') || ', que los rápidos ya llevaban' END,
         1, e.n
  FROM exhaustivos e
  UNION ALL
  -- 2 · el total, y cuál de los tres casos de la lectura es
  SELECT '2 · el total',
         'exhaustivos desde el 20/09: ' || (SELECT count(*) FROM exhaustivos) || ' · con código viejo: '
           || (SELECT count(*) FROM exhaustivos WHERE cardinality(le_faltan) > 0)
           || ' · posteriores al primer rápido con el contador nuevo: ' || (SELECT count(*) FROM exhaustivos WHERE despues_del_3),
         CASE WHEN (SELECT d3 FROM desde) IS NULL THEN 'NO SE PUEDE LEER: ningún rápido lleva el contador nuevo (control 3)'
              WHEN (SELECT count(*) FROM exhaustivos WHERE despues_del_3) = 0
                THEN 'CASO 3 · ningún exhaustivo posterior al contador nuevo: no concluye nada, hace falta Railway'
              WHEN (SELECT bool_and(m3) FROM exhaustivos WHERE despues_del_3)
                THEN 'CASO 1 · los exhaustivos posteriores llevan el contador nuevo: el worker está al día'
              ELSE '⚠️⚠️ CASO 2 · algún exhaustivo posterior NO lleva el contador nuevo: el worker corre código viejo' END,
         NULL, 2, 0
) t
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2;
