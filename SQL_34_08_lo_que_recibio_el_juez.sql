-- ============================================================================
-- SQL_34_08 · LO QUE RECIBIÓ EL JUEZ DE VERDAD EN LAS DOS MEDICIONES DE LA SEMANA 0 — SÓLO LECTURA (01/11/2026)
-- ✅ EJECUTADO por el director el 02/11/2026: los dos documentos enteros en las 21 pasadas de D y en las 13 del quinto
-- (34 de 34), control positivo en verde. La salida, literal, en la medida de F-130. Sólo SELECT: no escribe, no borra,
-- no cambia nada.
--
-- PARA QUÉ (arquitecto, 01/11): la premisa «el juez tiene los dos documentos enteros delante» sostiene dos cosas: la
-- lectura del quinto («el glosario ya estaba delante») y la línea base de D (la consulta F-129 dice que las dos mitades
-- de D estuvieron delante). El código lo da por hecho con la ventana de 150.000 (lib/analysis/reparto-de-la-pareja.ts,
-- TAMANO_VENTANA, y lib/analysis/segunda-seleccion.ts: «todas las parejas caben enteras y salen 'entero'»), y el estado
-- lo midió para NOR-11 ↔ CLI-12 el 23/10, en otra tanda. PARA LAS PASADAS MEDIDAS NO ESTÁ LEÍDO EN LA BASE. Ésta lo lee.
-- ⚠️ Y POR QUÉ IMPORTA: si el candidato NO va entero, se elige entre los fragmentos que devolvió Pinecone (cabecera de
-- reparto-de-la-pareja.ts), y el §4 de CLI-12 pudo no llegar por la selección previa, no por la ventana.
--
-- LAS DOS MEDICIONES VAN RELLENAS (sus ventanas están comprobadas contra las listas sin ventana de SQL_34_06):
--   · D: NOR-10, del 30/10 a las 23:40 al 31/10 a las 23:35 (Madrid), 21 pasadas;
--   · el quinto: NOR-11, del 28/10 a las 08:30 a las 09:00 (Madrid), 13 pasadas.
--
-- QUÉ LEE, por pasada, de analysis->'lecturaDeLasParejas', la entrada de la pareja con CLI-12 (lib/analysis/types.ts,
-- LecturaDeLaPareja): el régimen, la selección del candidato, los caracteres mostrados de cada lado frente a los que
-- tiene, si quedó algo fuera (dejoFuera) y cuántos trozos del candidato representa lo enviado (trozosDelCandidato).
-- ⚠️ LO QUE LA BASE NO GUARDA: QUÉ trozos del candidato se enviaron, sólo CUÁNTOS. Si la lectura fue entera, fueron
-- todos (y con ellos el §4, trozos 7 a 9, y §6.2, trozo 13). Si no, la consulta lo dice y no puede decir cuáles.
-- ⚠️ Los trozos de CLI-12 se cuentan en la generación ACTIVA de hoy. Si CLI-12 se reindexó después de las pasadas, el
-- número de hoy no es el de entonces: la consulta enseña las generaciones para que se vea.
--
-- CONTROLES: las pasadas frente a las esperadas, en cada medición; que sean rápidas; un solo CLI-12; que cada pasada
-- tenga la lectura de CLI-12; y el CONTROL POSITIVO, que puede fallar: los caracteres de CLI-12 en la lectura tienen
-- que ser 55.135 en todas (el texto armado medido en el repositorio el 27/10, SQL_34_02, y por el estado el 23/10), y
-- los de NOR-10, 66.801, y los de NOR-11, 14.704. ✅ LAS TRES, COMPROBADAS POR CODE EL 02/11/2026: buildAnalyzedDocumentText
-- sobre el troceado de la indexación de corpus-pruebas/ (55, 67 y 15 trozos, los de la base), con el mismo paso a
-- StoredChunk de lib/persist-chunks.ts y lib/read-chunks.ts. Si no salen, o el documento es otro, o la consulta no
-- está leyendo el campo que cree.
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
mediciones (orden, caso, documento, desde, hasta, esperado, caracteres_analizado) AS (
  VALUES (1, 'D', 'NOR-10', timestamptz '2026-10-30 23:40:00+01', timestamptz '2026-10-31 23:35:00+01', 21, 66801),
         (2, 'el quinto', 'NOR-11', timestamptz '2026-10-28 08:30:00+01', timestamptz '2026-10-28 09:00:00+01', 13, 14704)
),
caracteres_cli12 AS (SELECT 55135 AS n),   -- el texto armado de CLI-12 (SQL_34_02, 27/10)
cli12 AS (
  SELECT d.id::text AS id, d.active_generation AS generacion FROM public.documents d
  WHERE d.org_id = (SELECT org FROM resolucion) AND d.name LIKE 'CLI-12%'
),
trozos_cli12 AS (   -- los trozos de CLI-12 en la generación activa, y todas las generaciones que hay
  SELECT (SELECT count(*) FROM public.document_chunks ch JOIN cli12 c ON ch.document_id::text = c.id AND ch.generation = c.generacion) AS activos,
         (SELECT string_agg('generación ' || g.generation || ': ' || g.n || ' trozos', ' · ' ORDER BY g.generation)
            FROM (SELECT ch.generation, count(*) AS n FROM public.document_chunks ch JOIN cli12 c ON ch.document_id::text = c.id
                  GROUP BY ch.generation) g) AS generaciones
),
pasadas AS (
  SELECT m.orden, m.caso, m.documento, m.esperado, m.caracteres_analizado, ar.created_at, ar.analysis_type, ar.analysis,
         row_number() OVER (PARTITION BY m.orden ORDER BY ar.created_at, ar.id) AS n
  FROM mediciones m
  JOIN public.analysis_results ar ON ar.org_id = (SELECT org FROM resolucion) AND ar.document_name LIKE m.documento || '%'
                                 AND ar.created_at >= m.desde AND ar.created_at < m.hasta
),
lectura AS (   -- la lectura de la pareja con CLI-12 en cada pasada
  SELECT pa.orden, pa.n,
         count(l) AS lecturas,
         max(l->>'regimen') AS regimen,
         max(l->>'seleccion') AS seleccion,
         max((l->'analizado'->>'mostrados')::bigint) AS a_mostrados,
         max((l->'analizado'->>'caracteres')::bigint) AS a_caracteres,
         bool_or((l->'analizado'->>'dejoFuera')::boolean) AS a_fuera,
         max((l->'candidato'->>'mostrados')::bigint) AS c_mostrados,
         max((l->'candidato'->>'caracteres')::bigint) AS c_caracteres,
         bool_or(coalesce((l->'candidato'->>'dejoFuera')::boolean, true)) FILTER (WHERE l IS NOT NULL) AS c_fuera,
         max((l->>'trozosDelCandidato')::int) AS c_trozos
  FROM pasadas pa
  LEFT JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array'
                                              THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
         ON l->>'documentId' IN (SELECT id FROM cli12)
  GROUP BY pa.orden, pa.n
),
veredicto AS (
  SELECT pa.orden, pa.caso, pa.documento, pa.n, pa.created_at,
         le.lecturas, le.regimen, le.seleccion, le.a_mostrados, le.a_caracteres, le.a_fuera, le.c_mostrados, le.c_caracteres, le.c_fuera, le.c_trozos,
         (le.a_mostrados = le.a_caracteres AND NOT coalesce(le.a_fuera, true)) AS analizado_entero,
         (le.lecturas = 1 AND le.c_mostrados = le.c_caracteres AND le.c_fuera = false
          AND le.c_trozos = (SELECT activos FROM trozos_cli12)) AS cli12_entero
  FROM pasadas pa JOIN lectura le ON le.orden = pa.orden AND le.n = pa.n
),
control (orden, medida, ok) AS (
  SELECT 10 + m.orden, m.caso || ' · pasadas de ' || m.documento || ' en su ventana: ' || (SELECT count(*) FROM pasadas pa WHERE pa.orden = m.orden)
            || ' · esperado: ' || m.esperado,
         (SELECT count(*) FROM pasadas pa WHERE pa.orden = m.orden) = m.esperado
  FROM mediciones m
  UNION ALL
  SELECT 20, 'pasadas que no son rápidas: ' || (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0 END
  UNION ALL
  SELECT 30, 'documentos CLI-12 en la organización: ' || (SELECT count(*) FROM cli12) || ' (tiene que ser uno) · '
            || coalesce((SELECT generaciones FROM trozos_cli12), 'sin trozos') || ' · activa: '
            || coalesce((SELECT generacion::text FROM cli12 LIMIT 1), '—'),
         (SELECT count(*) FROM cli12) = 1
  UNION ALL
  SELECT 40, 'pasadas sin UNA lectura de la pareja con CLI-12: ' || (SELECT count(*) FROM veredicto WHERE lecturas <> 1),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL ELSE (SELECT count(*) FROM veredicto WHERE lecturas <> 1) = 0 END
  UNION ALL
  -- EL CONTROL POSITIVO: los caracteres que la lectura dice que tienen CLI-12 y NOR-10 son los medidos
  SELECT 50, 'CONTROL POSITIVO · caracteres de CLI-12 en la lectura: ' || coalesce((SELECT string_agg(DISTINCT c_caracteres::text, ', ') FROM veredicto), 'ninguno')
            || ' (tienen que ser ' || (SELECT n FROM caracteres_cli12) || ') · de NOR-10: '
            || coalesce((SELECT string_agg(DISTINCT a_caracteres::text, ', ') FROM veredicto WHERE documento = 'NOR-10'), 'ninguno')
            || ' (tienen que ser 66801) · de NOR-11: '
            || coalesce((SELECT string_agg(DISTINCT a_caracteres::text, ', ') FROM veredicto WHERE documento = 'NOR-11'), 'ninguno')
            || ' (tienen que ser 14704)',
         CASE WHEN (SELECT count(*) FROM veredicto WHERE lecturas = 1) = 0 THEN NULL
              ELSE (SELECT count(*) FROM veredicto WHERE lecturas = 1 AND c_caracteres IS DISTINCT FROM (SELECT n FROM caracteres_cli12)) = 0
                   AND (SELECT count(*) FROM veredicto v JOIN mediciones m ON m.orden = v.orden
                         WHERE v.lecturas = 1 AND m.caracteres_analizado IS NOT NULL AND v.a_caracteres IS DISTINCT FROM m.caracteres_analizado) = 0 END
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1, 0 AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, NULL, orden, 0
  FROM control
  UNION ALL
  -- 1 · por pasada: qué recibió el juez de cada lado
  SELECT '1 · por pasada', v.caso || ' · pasada ' || v.n || ' · ' || to_char(v.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'),
         CASE WHEN v.lecturas = 0 THEN '⚠️ SIN LECTURA DE CLI-12: no se sabe qué recibió'
              WHEN v.lecturas > 1 THEN '⚠️ ' || v.lecturas || ' LECTURAS DE CLI-12'
              WHEN v.analizado_entero AND v.cli12_entero THEN 'LOS DOS ENTEROS'
              WHEN v.analizado_entero THEN '⚠️ CLI-12 NO ENTERO: ' || coalesce(v.c_trozos::text, '?') || ' de ' || (SELECT activos FROM trozos_cli12)
                   || ' trozos; CUÁLES, la base no lo guarda'
              WHEN v.cli12_entero THEN '⚠️ ' || v.documento || ' CORTADO: ' || coalesce(v.a_mostrados::text, '?') || ' de ' || coalesce(v.a_caracteres::text, '?') || ' caracteres'
              ELSE '⚠️ LOS DOS CORTADOS' END,
         v.documento || ': ' || coalesce(v.a_mostrados::text, '—') || ' de ' || coalesce(v.a_caracteres::text, '—') || ' caracteres'
           || ' · CLI-12: ' || coalesce(v.c_mostrados::text, '—') || ' de ' || coalesce(v.c_caracteres::text, '—') || ' caracteres, '
           || coalesce(v.c_trozos::text, '—') || ' de ' || (SELECT activos FROM trozos_cli12) || ' trozos',
         'régimen ' || coalesce(v.regimen, '—') || ' · selección ' || coalesce(v.seleccion, '—')
           || ' · dejó fuera: ' || coalesce(v.a_fuera::text, '—') || ' / ' || coalesce(v.c_fuera::text, '—'),
         v.orden, v.n::int
  FROM veredicto v
  UNION ALL
  -- 2 · el total, por medición
  SELECT '2 · el total', m.caso || ' (' || m.documento || ' ↔ CLI-12): los dos enteros en '
           || count(v.n) FILTER (WHERE v.analizado_entero AND v.cli12_entero) || ' de ' || count(v.n) || ' pasadas',
         CASE WHEN count(v.n) > 0 AND count(v.n) FILTER (WHERE v.analizado_entero AND v.cli12_entero) = count(v.n)
              THEN 'el juez tuvo delante todo ' || m.documento || ' y todo CLI-12, con el §4 (trozos 7 a 9) y §6.2 (trozo 13)'
              ELSE '⚠️ NO en todas: la premisa «los dos documentos enteros delante» NO se sostiene para esta medición' END,
         NULL, NULL, 90 + m.orden, 0
  FROM mediciones m LEFT JOIN veredicto v ON v.orden = m.orden
  GROUP BY m.orden, m.caso, m.documento
) z
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2;
