-- ============================================================================
-- SQL_34_13 · LAS MARCAS DE D EN TODAS LAS LISTAS DE LAS 21 PASADAS DE LA LÍNEA BASE — SÓLO LECTURA (11/11/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- PARA QUÉ (arquitecto, 11/11, a partir de la respuesta de Fable): el «en 17 de las 18 pasadas sin D el juez no la escribió» salió
-- por eliminación sobre tres sitios —lo publicado, lo que tiró la puerta con texto y lo que descartó el verificador sin texto—, y el
-- juicio de cada pareja tiene más listas. Si D fue a `overlappingContent` o a `uniqueToNewDoc`, el juez SÍ la escribió y la
-- eliminación la contó como no escrita. Las respuestas crudas del juez no se guardan (sólo el log), así que esto busca en lo que sí
-- se guarda: `analysis->'discrepancies'` (todas las severidades) y, del juicio de la pareja con CLI-12 (`analysis->'judgments'`, el
-- de después del verificador), `contradictions`, `overlappingContent`, `uniqueToNewDoc` y `descartesPorCita`.
-- Y de las pasadas con D publicada, el `topic` literal, las dos citas, la severidad y la especie (la predicción de Fable).
--
-- LAS MARCAS, sobre el texto normalizado como en SQL_34_06 (minúsculas, sin tildes, espacios colapsados):
--   · D-NOR: «puede recaer en el propio director clinico» (la frase del permiso; es la que reconocía SQL_34_06)
--   · D-suelta: «puede recaer», «separacion de funciones», «misma persona», «separar la responsabilidad», «nunca por el director
--     clinico» (el §3.5). Pueden salir en textos que no son D: por eso cada elemento sale ENTERO para leerlo.
--   · LAS DOS FIGURAS: «coordinador de calidad» y «director clinico» en el mismo elemento. Coge también A: sólo para leer.
--
-- LA VENTANA: la línea base, del 30/10 a las 23:40 al 31/10 a las 23:35 (Madrid), NOR-10, rápidos; 21 pasadas.
-- CONTROLES: las pasadas (21), que sean rápidas, un solo CLI-12, que cada pasada tenga su juicio de CLI-12, y que ese juicio
-- GUARDE `uniqueToNewDoc` y `overlappingContent` como listas (si una pasada no las guarda, en ella esas listas NO SE VIERON: no es
-- un cero). Y el CONTROL POSITIVO: D-NOR en lo publicado en exactamente las pasadas 12, 17 y 21 (lo que leyó SQL_34_05).
--
-- ✅ PROBADA EN PGLITE (Code, 11/11/2026; probar_34_13.mjs, en el scratchpad), con 21 pasadas sintéticas: la buena saca las tres D
-- publicadas con su tema, sus citas y SIN EL CAMPO; una D en uniqueToNewDoc, una en descartesPorCita y una marca suelta en
-- overlappingContent, cada una en su lista; y una de las dos figuras sin marca de D, aparte. La rota (una pasada sin
-- uniqueToNewDoc guardado, y una D publicada de más) hace FALLAR los controles 5 y 6.
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
                   || (SELECT count(*) FROM public.documents d WHERE d.org_id::text = r.org) || ' documentos'
              ELSE '⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' || r.usuario || ' tiene ' || r.pertenencias
                   || ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.' END AS linea
  FROM resolucion r LEFT JOIN public.organizations o ON o.id::text = r.org
),
cli12 AS (SELECT d.id::text AS id FROM public.documents d WHERE d.org_id::text = (SELECT org FROM resolucion) AND d.name LIKE 'CLI-12%'),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis_type, ar.analysis, row_number() OVER (ORDER BY ar.created_at, ar.id) AS n
  FROM public.analysis_results ar
  WHERE ar.org_id::text = (SELECT org FROM resolucion) AND ar.document_name LIKE 'NOR-10%'
    AND ar.created_at >= timestamptz '2026-10-30 23:40:00+01' AND ar.created_at < timestamptz '2026-10-31 23:35:00+01'
),
juicios AS (   -- el juicio de la pareja con CLI-12 de cada pasada
  SELECT pa.n, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array' THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
  WHERE j->>'documentId' IN (SELECT id FROM cli12)
),
arr AS (SELECT '[]'::jsonb AS vacio),
elementos AS (
  SELECT pa.n, 1 AS o, 'publicada (discrepancies)' AS lista, d.i,
         coalesce(d.x->>'topic', '') AS tema, coalesce(d.x->>'newDocSays', '') || ' ‖ ' || coalesce(d.x->>'existingDocSays', '') AS texto,
         d.x->>'severity' AS severidad, d.x->>'conflictoNormativo' AS especie, coalesce(d.x->>'newDocSays', '') AS lado_nor
  FROM pasadas pa CROSS JOIN arr
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE arr.vacio END) WITH ORDINALITY d(x, i)
  WHERE d.x->>'existingDocumentId' IN (SELECT id FROM cli12)
  UNION ALL
  SELECT ju.n, 2, 'juicio · contradictions', c.i, coalesce(c.x->>'topic', ''), coalesce(c.x->>'newDocSays', '') || ' ‖ ' || coalesce(c.x->>'existingDocSays', ''),
         c.x->>'severity', c.x->>'conflictoNormativo', coalesce(c.x->>'newDocSays', '')
  FROM juicios ju CROSS JOIN arr
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE arr.vacio END) WITH ORDINALITY c(x, i)
  UNION ALL
  SELECT ju.n, 3, 'juicio · overlappingContent', s.i, coalesce(s.x->>'description', ''),
         coalesce(s.x->>'evidenceInNewDoc', '') || ' ‖ ' || coalesce(s.x->>'evidence', ''), NULL, NULL, coalesce(s.x->>'evidenceInNewDoc', '')
  FROM juicios ju CROSS JOIN arr
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'overlappingContent') = 'array' THEN ju.j->'overlappingContent' ELSE arr.vacio END) WITH ORDINALITY s(x, i)
  UNION ALL
  SELECT ju.n, 4, 'juicio · uniqueToNewDoc', u.i, '', u.x, NULL, NULL, u.x
  FROM juicios ju CROSS JOIN arr
  CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN jsonb_typeof(ju.j->'uniqueToNewDoc') = 'array' THEN ju.j->'uniqueToNewDoc' ELSE arr.vacio END) WITH ORDINALITY u(x, i)
  UNION ALL
  SELECT ju.n, 5, 'juicio · descartesPorCita (' || coalesce(x.x->>'tipo', '?') || ')', x.i, coalesce(x.x->>'tema', ''),
         coalesce(x.x->>'citaNuevo', '') || ' ‖ ' || coalesce(x.x->>'citaExistente', ''), NULL, NULL, coalesce(x.x->>'citaNuevo', '')
  FROM juicios ju CROSS JOIN arr
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE arr.vacio END) WITH ORDINALITY x(x, i)
),
marcados AS (
  SELECT e.*, k.t,
         position('puede recaer en el propio director clinico' IN kn.t) > 0 AS d_nor,
         (k.t LIKE '%puede recaer%' OR k.t LIKE '%separacion de funciones%' OR k.t LIKE '%misma persona%'
          OR k.t LIKE '%separar la responsabilidad%' OR k.t LIKE '%nunca por el director clinico%') AS d_suelta,
         (k.t LIKE '%coordinador de calidad%' AND k.t LIKE '%director clinico%') AS dos_figuras
  FROM elementos e
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(e.tema || ' · ' || e.texto, '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS t) k
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(e.lado_nor, '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS t) kn
),
d_publicada AS (SELECT DISTINCT n FROM marcados WHERE o = 1 AND d_nor),
control (orden, medida, ok) AS (
  SELECT 1, 'pasadas de NOR-10 en la ventana: ' || (SELECT count(*) FROM pasadas) || ' · esperado: 21', (SELECT count(*) FROM pasadas) = 21
  UNION ALL
  SELECT 2, 'pasadas que no son rápidas: ' || (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick'),
         (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0
  UNION ALL
  SELECT 3, 'documentos CLI-12: ' || (SELECT count(*) FROM cli12) || ' (tiene que ser uno)', (SELECT count(*) FROM cli12) = 1
  UNION ALL
  SELECT 4, 'pasadas sin juicio de CLI-12: ' || (SELECT count(*) FROM pasadas pa WHERE NOT EXISTS (SELECT 1 FROM juicios ju WHERE ju.n = pa.n)),
         NOT EXISTS (SELECT 1 FROM pasadas pa WHERE NOT EXISTS (SELECT 1 FROM juicios ju WHERE ju.n = pa.n))
  UNION ALL
  SELECT 5, 'juicios de CLI-12 SIN uniqueToNewDoc guardado como lista: ' || (SELECT count(*) FROM juicios WHERE jsonb_typeof(j->'uniqueToNewDoc') IS DISTINCT FROM 'array')
            || ' · SIN overlappingContent: ' || (SELECT count(*) FROM juicios WHERE jsonb_typeof(j->'overlappingContent') IS DISTINCT FROM 'array')
            || ' (en esas pasadas esa lista NO SE VIO; no es un cero)',
         (SELECT count(*) FROM juicios WHERE jsonb_typeof(j->'uniqueToNewDoc') IS DISTINCT FROM 'array' OR jsonb_typeof(j->'overlappingContent') IS DISTINCT FROM 'array') = 0
  UNION ALL
  SELECT 6, 'CONTROL POSITIVO · pasadas con D-NOR publicada: ' || coalesce((SELECT string_agg(n::text, ', ' ORDER BY n) FROM d_publicada), 'ninguna') || ' (SQL_34_05: 12, 17, 21)',
         coalesce((SELECT string_agg(n::text, ',' ORDER BY n) FROM d_publicada), '') = '12,17,21'
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1, 0 AS o2, 0 AS o3
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, NULL, orden, 0, 0 FROM control
  UNION ALL
  -- 1 · las D publicadas: el tema, las dos citas, la severidad y la especie, literales (la predicción de Fable)
  SELECT '1 · D publicada', 'pasada ' || m.n || ' · topic: «' || m.tema || '»', 'citas: ' || m.texto,
         'severity: ' || coalesce(m.severidad, '—'), 'conflictoNormativo: ' || coalesce(m.especie, 'SIN EL CAMPO'), 10, m.n::int, m.i::int
  FROM marcados m WHERE m.o = 1 AND m.d_nor
  UNION ALL
  -- 2 · LO QUE NO SE MIRÓ: marcas de D, sueltas o de la frase del permiso, FUERA de lo publicado, en las pasadas SIN D publicada
  SELECT '2 · marca de D fuera de lo publicado', 'pasada ' || m.n || ' · ' || m.lista || ' · ' || CASE WHEN m.d_nor THEN 'D-NOR' ELSE 'D-suelta' END,
         'tema: «' || m.tema || '»', left(m.texto, 600), NULL, 20, m.n::int, m.o * 100 + m.i::int
  FROM marcados m WHERE m.o > 1 AND (m.d_nor OR m.d_suelta) AND m.n NOT IN (SELECT n FROM d_publicada)
  UNION ALL
  -- 3 · PARA LEER: las dos figuras en una lista que no es lo publicado, sin ninguna marca de D (coge A también)
  SELECT '3 · las dos figuras, sin marca de D, fuera de lo publicado', 'pasada ' || m.n || ' · ' || m.lista, 'tema: «' || m.tema || '»', left(m.texto, 400), NULL,
         30, m.n::int, m.o * 100 + m.i::int
  FROM marcados m WHERE m.o > 2 AND m.dos_figuras AND NOT (m.d_nor OR m.d_suelta) AND m.n NOT IN (SELECT n FROM d_publicada)
  UNION ALL
  -- 4 · el total, por lista: en cuántas de las 18 pasadas SIN D publicada aparece alguna marca de D en esa lista
  SELECT '4 · el total', 'de las ' || (SELECT count(*) FROM pasadas WHERE n NOT IN (SELECT n FROM d_publicada)) || ' pasadas sin D publicada, con alguna marca de D en «' || l.lista || '»: '
           || (SELECT count(DISTINCT m.n) FROM marcados m WHERE m.lista = l.lista AND (m.d_nor OR m.d_suelta) AND m.n NOT IN (SELECT n FROM d_publicada))
           || ' (con la frase del permiso: ' || (SELECT count(DISTINCT m.n) FROM marcados m WHERE m.lista = l.lista AND m.d_nor AND m.n NOT IN (SELECT n FROM d_publicada)) || ')',
         NULL, NULL, NULL, 40, l.o, 0
  FROM (VALUES (2, 'juicio · contradictions'), (3, 'juicio · overlappingContent'), (4, 'juicio · uniqueToNewDoc'),
               (5, 'juicio · descartesPorCita (contradiccion)'), (6, 'juicio · descartesPorCita (solapamiento)')) l(o, lista)
) z
ORDER BY o1, o2, o3;
