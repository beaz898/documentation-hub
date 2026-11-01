-- ============================================================================
-- SQL_34_07 · EL AGUJERO DE «discarded»: ¿JUICIO VACÍO O JUEZ CAÍDO? — SÓLO LECTURA (01/11/2026)
-- ✅ EJECUTADO por el director el 01/11/2026 con NOR-11, ventana del 28/10 de 08:30 a 09:00: las cuatro pasadas sin
-- «discarded» (1, 2, 7 y 8), CERO REAL; control positivo 9 de 9. La salida, literal, en la medida de F-130. Sólo SELECT: no escribe, no borra, no cambia nada. La ejecuta el director; Code no
-- ejecuta consultas.
--
-- PARA QUÉ (arquitecto, 01/11): el control 6 de SQL_34_06 da como AGUJERO toda pasada cuyo juicio de CLI-12 no guarda
-- «discarded», y en NOR-11 (28/10, 08:30 a 09:00) son cuatro: la 1, la 2, la 7 y la 8. El campo falta por DOS causas
-- que el control no separa:
--   · el juez contestó y no hubo nada que contar: se omite cuando está vacío (lib/analysis/judge.ts:602 y :969, y la
--     unión en lib/analysis/pipeline.ts:717);
--   · el juez se cayó: el juicio vuelve vacío, sin «discarded», y la caída queda en analysis.stageFailures con stage
--     'judge' (judge.ts:1015-1017, recordStageFailure), SIN la pareja.
-- Si las cuatro son lo primero, son NEGATIVOS LIMPIOS y el quinto queda entre 5 y 9 de 13; si no, la tasa sigue sin
-- denominador. ⚠️ CONTROL PERMANENTE (claude/Protocolo_Harness_Tasas.md): toda medición por pasada que dé agujeros en
-- el control 6 de SQL_34_06 pasa por ésta, con la MISMA ventana, antes de puntuarse.
--
-- CÓMO DECIDE, por pasada con agujero, en este orden (la primera que se cumple):
--   1. sin el registro por llamada (analysis.llamadasAlModelo, desde el 21/10) → NO SE SABE;
--   2. el registro no tiene ninguna petición del juez a CLI-12 → NO SE SABE;
--   3. la ÚLTIMA petición del juez a CLI-12 no contestó 200 → JUEZ CAÍDO;
--   4. el juicio de CLI-12 no tiene la forma del juicio de reserva (veredicto distinto de 'sin_relacion', solape > 0,
--      o alguna lista no vacía) → CERO REAL: el de reserva es exactamente veredicto 'sin_relacion', 0 y listas vacías;
--   5. el análisis no registra ninguna caída del juez → CERO REAL;
--   6. si no → NO SE DISTINGUE: la llamada a CLI-12 contestó 200, el juicio tiene la forma del de reserva, y hubo
--      alguna caída del juez en el análisis, que puede ser de CLI-12 (JSON roto tras las dos vueltas) o de otra pareja.
--
-- CONTROLES: la ventana; las pasadas frente a las esperadas; que sean rápidas; un solo CLI-12; que todas tengan el
-- registro por llamada y ninguna haya pasado su guarda de 200; y el CONTROL POSITIVO, que puede fallar: en las pasadas
-- CON «discarded» el juez contestó a CLI-12 seguro, así que el registro tiene que tener ahí una petición del juez a
-- CLI-12 con 200. Si no la tiene, esta consulta está leyendo mal el registro, y sus «NO SE SABE» no significan nada.
-- ⚠️ LO QUE NO TIENE CONTROL POSITIVO EN LA BASE: la lectura de stageFailures. Si ninguna pasada tiene una caída, un
-- cero ahí no prueba que se lea bien; lo prueba el arnés (claude/arneses/f34/sql-34-07-el-agujero-de-discarded.test.ts).
--
-- LOS PARÁMETROS, los mismos de SQL_34_06. Para el quinto: 'NOR-11', desde timestamptz '2026-10-28 08:30:00+01',
-- hasta timestamptz '2026-10-28 09:00:00+01', esperado 13.
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
parametros AS (
  SELECT (SELECT org FROM resolucion) AS org,
         'NOR-11'::text AS documento,            -- ← DOCUMENTO: el de la medición
         NULL::timestamptz AS desde,             -- ← DESDE: el mismo de SQL_34_06
         NULL::timestamptz AS hasta,             -- ← HASTA: el mismo de SQL_34_06
         NULL::int AS esperado                   -- ← ESPERADO: las pasadas que dio SQL_34_06
),
cli12 AS (
  SELECT d.id::text AS id FROM public.documents d, parametros p WHERE d.org_id = p.org AND d.name LIKE 'CLI-12%'
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis, ar.analysis_type,
         row_number() OVER (ORDER BY ar.created_at, ar.id) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name LIKE p.documento || '%'
    AND ar.created_at >= p.desde AND ar.created_at < p.hasta
),
juicio AS (   -- el juicio de la pareja con CLI-12, y si tiene la forma del juicio de reserva (judge.ts:1018-1036)
  SELECT pa.n,
         count(j) AS juicios,
         bool_and(coalesce(jsonb_typeof(j->'discarded') = 'object', false)) FILTER (WHERE j IS NOT NULL) AS con_discarded,   -- sin juicio, NULL
         bool_or(coalesce(j->>'verdict', 'sin_relacion') <> 'sin_relacion'
                 OR coalesce((j->>'overlapPercent')::numeric, 0) > 0
                 OR (jsonb_typeof(j->'contradictions') = 'array' AND jsonb_array_length(j->'contradictions') > 0)
                 OR (jsonb_typeof(j->'overlappingContent') = 'array' AND jsonb_array_length(j->'overlappingContent') > 0)
                 OR (jsonb_typeof(j->'uniqueToNewDoc') = 'array' AND jsonb_array_length(j->'uniqueToNewDoc') > 0)) AS contesto,
         string_agg(coalesce(j->>'verdict', '¿sin veredicto?') || ' · solape ' || coalesce(j->>'overlapPercent', '?') || ' %'
                    || ' · contradicciones ' || CASE WHEN jsonb_typeof(j->'contradictions') = 'array' THEN jsonb_array_length(j->'contradictions')::text ELSE '?' END
                    || ' · solapes ' || CASE WHEN jsonb_typeof(j->'overlappingContent') = 'array' THEN jsonb_array_length(j->'overlappingContent')::text ELSE '?' END
                    || ' · únicos ' || CASE WHEN jsonb_typeof(j->'uniqueToNewDoc') = 'array' THEN jsonb_array_length(j->'uniqueToNewDoc')::text ELSE '?' END, ' | ') FILTER (WHERE j IS NOT NULL) AS forma
  FROM pasadas pa
  LEFT JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array'
                                              THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
         ON j->>'documentId' IN (SELECT id FROM cli12)
  GROUP BY pa.n
),
caidas AS (   -- las caídas del juez que guarda el análisis: SIN la pareja (stage-failures.ts)
  SELECT pa.n,
         (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'stageFailures') = 'array'
                                                         THEN pa.analysis->'stageFailures' ELSE '[]'::jsonb END) f
           WHERE f->>'stage' = 'judge') AS del_juez,
         (SELECT string_agg(left(coalesce(f->>'detail', ''), 120), ' | ')
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'stageFailures') = 'array'
                                           THEN pa.analysis->'stageFailures' ELSE '[]'::jsonb END) f
           WHERE f->>'stage' = 'judge') AS detalle
  FROM pasadas pa
),
llamadas AS (   -- las peticiones del juez a CLI-12 en el registro por llamada (registro-de-llamadas.ts)
  SELECT pa.n,
         jsonb_typeof(pa.analysis->'llamadasAlModelo') = 'object' AS con_registro,
         coalesce(jsonb_typeof(pa.analysis->'llamadasAlModelo'->'fueraDelDetalle') = 'object', false) AS pasada_la_guarda,
         count(q) AS al_cli12,
         count(q) FILTER (WHERE q->>'resultado' = 'ok') AS con_200,
         (array_agg(q->>'resultado' ORDER BY (q->>'n')::int DESC))[1] AS la_ultima
  FROM pasadas pa
  LEFT JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'llamadasAlModelo'->'peticiones') = 'array'
                                              THEN pa.analysis->'llamadasAlModelo'->'peticiones' ELSE '[]'::jsonb END) q
         ON q->>'etapa' = 'juez' AND q->>'pareja' IN (SELECT id FROM cli12)
  GROUP BY pa.n, pa.analysis
),
veredicto AS (
  SELECT pa.n, pa.created_at, ju.juicios, ju.con_discarded, ju.contesto, ju.forma,
         ca.del_juez, ca.detalle, ll.con_registro, ll.pasada_la_guarda, ll.al_cli12, ll.con_200, ll.la_ultima,
         (ju.juicios = 0 OR NOT ju.con_discarded) AS agujero,
         CASE WHEN ju.juicios = 0 THEN 'SIN JUICIO DE CLI-12'
              WHEN ju.con_discarded THEN 'con «discarded»: no es un agujero'
              WHEN NOT coalesce(ll.con_registro, false) THEN 'NO SE SABE: el análisis no guarda el registro por llamada'
              WHEN ll.al_cli12 = 0 THEN 'NO SE SABE: el registro no tiene ninguna petición del juez a CLI-12'
              WHEN ll.la_ultima IS DISTINCT FROM 'ok' THEN 'JUEZ CAÍDO: la última petición del juez a CLI-12 no contestó 200'
              WHEN ju.contesto THEN 'CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada'
              WHEN ca.del_juez = 0 THEN 'CERO REAL: el juez contestó a CLI-12 y el análisis no registra ninguna caída del juez'
              ELSE 'NO SE DISTINGUE: CLI-12 contestó 200, el juicio tiene la forma del de reserva y hubo '
                   || ca.del_juez || ' caída(s) del juez en el análisis' END AS que_es
  FROM pasadas pa
  JOIN juicio ju ON ju.n = pa.n
  JOIN caidas ca ON ca.n = pa.n
  JOIN llamadas ll ON ll.n = pa.n
),
control (orden, medida, ok) AS (
  SELECT 1, 'ventana: ' || coalesce(to_char(p.desde AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' a ' ||
            coalesce(to_char(p.hasta AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' (hora de Madrid)',
         p.desde IS NOT NULL AND p.hasta IS NOT NULL
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de ' || p.documento || ' en la ventana: ' || (SELECT count(*) FROM pasadas) || ' · esperado: ' || coalesce(p.esperado::text, 'SIN RELLENAR'),
         CASE WHEN p.esperado IS NULL THEN NULL ELSE (SELECT count(*) FROM pasadas) = p.esperado END
  FROM parametros p
  UNION ALL
  SELECT 3, 'pasadas que no son rápidas: ' || (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0 END
  UNION ALL
  SELECT 4, 'documentos CLI-12 en la organización: ' || (SELECT count(*) FROM cli12) || ' (tiene que ser uno)',
         (SELECT count(*) FROM cli12) = 1
  UNION ALL
  SELECT 5, 'pasadas con el registro por llamada: ' || (SELECT count(*) FROM veredicto WHERE coalesce(con_registro, false))
            || ' de ' || (SELECT count(*) FROM veredicto) || ' · que pasaron su guarda de 200: '
            || (SELECT count(*) FROM veredicto WHERE pasada_la_guarda),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM veredicto WHERE NOT coalesce(con_registro, false) OR pasada_la_guarda) = 0 END
  UNION ALL
  -- EL CONTROL POSITIVO: con «discarded», el juez contestó a CLI-12; el registro tiene que tener ese 200
  SELECT 6, 'CONTROL POSITIVO · pasadas con «discarded» y una petición del juez a CLI-12 con 200: '
            || (SELECT count(*) FROM veredicto WHERE NOT agujero AND con_200 > 0) || ' de ' || (SELECT count(*) FROM veredicto WHERE NOT agujero),
         CASE WHEN (SELECT count(*) FROM veredicto WHERE NOT agujero) = 0 THEN NULL
              ELSE (SELECT count(*) FROM veredicto WHERE NOT agujero AND con_200 = 0) = 0 END
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, NULL, orden
  FROM control
  UNION ALL
  -- 1 · por pasada: qué es cada agujero, y con qué se decidió
  SELECT '1 · por pasada', 'pasada ' || v.n || ' · ' || to_char(v.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'),
         v.que_es,
         'juez a CLI-12: ' || v.al_cli12 || ' peticiones, ' || v.con_200 || ' con 200, la última: ' || coalesce(v.la_ultima, 'ninguna')
           || ' · caídas del juez en el análisis: ' || v.del_juez,
         'el juicio de CLI-12: ' || coalesce(v.forma, 'ninguno') || CASE WHEN v.detalle IS NOT NULL THEN ' · caídas: ' || v.detalle ELSE '' END,
         v.n
  FROM veredicto v
  UNION ALL
  -- 2 · el total: cuántos agujeros son cada cosa
  SELECT '2 · el total',
         'agujeros: ' || count(*) FILTER (WHERE agujero)
           || ' · cero real: ' || count(*) FILTER (WHERE agujero AND que_es LIKE 'CERO REAL%')
           || ' · juez caído: ' || count(*) FILTER (WHERE agujero AND que_es LIKE 'JUEZ CAÍDO%')
           || ' · no se distingue: ' || count(*) FILTER (WHERE agujero AND que_es LIKE 'NO SE DISTINGUE%')
           || ' · no se sabe: ' || count(*) FILTER (WHERE agujero AND (que_es LIKE 'NO SE SABE%' OR que_es LIKE 'SIN JUICIO%')),
         NULL, NULL, NULL, 99
  FROM veredicto
) z
ORDER BY (bloque <> 'organización leída'), bloque, o1;
