-- ============================================================================
-- SQL_34_12 · QUÉ RÉGIMEN APLICÓ DE VERDAD EL RÁPIDO, Y CUÁNDO — SÓLO LECTURA (10/11/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- PARA QUÉ (arquitecto, 10/11): `ANALYSIS_PAREJA_ENTERA` está marcada como «sensitive» en Vercel y su valor no se puede volver
-- a leer, ni en el panel ni por CLI. Esto no lee la configuración: lee lo que HIZO el programa. Cada rápido deja escrito, en
-- analysis->'lecturaDeLasParejas', una entrada por candidato juzgado con su `regimen` (lib/analysis/types.ts, LecturaDeLaPareja;
-- lo escribe leerLaPareja, lib/analysis/judge.ts).
-- QUÉ DICE CADA RÉGIMEN DEL INTERRUPTOR (lib/analysis/judge.ts:1370-1398): `tijera_vieja` sale SÓLO con el interruptor
-- APAGADO; `pareja_entera`, `corte_honesto` y `sin_fuente_comun` salen SÓLO con él ENCENDIDO. Así que cada rápido dice cómo
-- estaba el interruptor en el momento en que corrió. NO dice cómo está hoy: un cambio de la variable o un despliegue
-- posteriores al último rápido no se ven aquí. Por eso cada fila lleva su fecha.
--
-- QUÉ DEVUELVE:
--   1 · el último rápido de la pareja NOR-10 ↔ CLI-12 (en cualquiera de los dos sentidos), con su régimen y su fecha;
--   2 · el último rápido que haya, sea de la pareja que sea, con su fecha;
--   3 · cada estado del interruptor que se ha visto, con cuántos rápidos, el primero y el último;
--   4 · los CAMBIOS: cada vez que dos rápidos seguidos dicen cosas distintas del interruptor, los dos con sus fechas.
--
-- CONTROLES, y uno que puede fallar:
--   · cuántos rápidos hay, y cuántos llevan la lectura (los anteriores al 29/09 o sin candidatos no la llevan);
--   · ningún régimen fuera de los cuatro conocidos;
--   · ningún rápido con los dos estados a la vez (tijera_vieja junto a uno de los otros tres: el código no lo puede producir);
--   · CONTROL POSITIVO: las 21 pasadas de D del 30/10 23:40 al 31/10 23:35 (Madrid) tienen que dar `pareja_entera` en su pareja
--     con CLI-12, que es lo que SQL_34_08 leyó el 02/11 (34 de 34, archivado en la medida de F-130). Si no sale, la consulta no está
--     leyendo el campo que cree.
--
-- ✅ PROBADA EN PGLITE (Code, 10/11/2026; probar_34_12.mjs, en el scratchpad), con filas sintéticas:
--   · la buena: cada bloque da lo que tiene que dar, con la pareja en los DOS sentidos (CLI-12 analizado y NOR-10 candidato), un
--     rápido viejo sin lectura que no cuenta, y un EXHAUSTIVO posterior con tijera_vieja que no aparece en nada;
--   · rotura 1: las pasadas de D con tijera_vieja → el CONTROL POSITIVO FALLA (0 de 21);
--   · rotura 2: un rápido con los dos estados y un régimen inventado → los controles 2 y 3 FALLAN.
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
nor10 AS (SELECT d.id::text AS id FROM public.documents d WHERE d.org_id::text = (SELECT org FROM resolucion) AND d.name LIKE 'NOR-10%'),
cli12 AS (SELECT d.id::text AS id FROM public.documents d WHERE d.org_id::text = (SELECT org FROM resolucion) AND d.name LIKE 'CLI-12%'),
rapidos AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id::text = (SELECT org FROM resolucion) AND ar.analysis_type = 'quick'
),
lecturas AS (   -- una fila por candidato juzgado en cada rápido
  SELECT r.id, r.created_at, r.document_name, l->>'documentId' AS candidato, l->>'regimen' AS regimen
  FROM rapidos r
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(r.analysis->'lecturaDeLasParejas') = 'array'
                                               THEN r.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
),
por_rapido AS (
  SELECT id, created_at, document_name,
         string_agg(DISTINCT regimen, ', ' ORDER BY regimen) AS regimenes,
         bool_or(regimen = 'tijera_vieja') AS apagado,
         bool_or(regimen IN ('pareja_entera', 'corte_honesto', 'sin_fuente_comun')) AS encendido,
         bool_or((document_name LIKE 'NOR-10%' AND candidato IN (SELECT id FROM cli12))
              OR (document_name LIKE 'CLI-12%' AND candidato IN (SELECT id FROM nor10))) AS de_la_pareja,
         max(regimen) FILTER (WHERE (document_name LIKE 'NOR-10%' AND candidato IN (SELECT id FROM cli12))
                                 OR (document_name LIKE 'CLI-12%' AND candidato IN (SELECT id FROM nor10))) AS regimen_de_la_pareja
  FROM lecturas
  GROUP BY id, created_at, document_name
),
estado AS (
  SELECT p.*, CASE WHEN p.apagado AND p.encendido THEN 'LOS DOS (imposible)'
                   WHEN p.encendido THEN 'ENCENDIDO' WHEN p.apagado THEN 'APAGADO' ELSE 'sin régimen' END AS interruptor,
         row_number() OVER (ORDER BY p.created_at, p.id) AS n
  FROM por_rapido p
),
cambios AS (
  SELECT a.created_at AS desde_t, a.document_name AS desde_doc, a.interruptor AS desde,
         b.created_at AS hasta_t, b.document_name AS hasta_doc, b.interruptor AS hasta
  FROM estado a JOIN estado b ON b.n = a.n + 1
  WHERE a.interruptor IS DISTINCT FROM b.interruptor
),
control_d AS (   -- el control positivo: las 21 pasadas de D (SQL_34_08)
  SELECT count(*) AS pasadas, count(*) FILTER (WHERE regimen_de_la_pareja = 'pareja_entera') AS enteras
  FROM estado
  WHERE document_name LIKE 'NOR-10%'
    AND created_at >= timestamptz '2026-10-30 23:40:00+01' AND created_at < timestamptz '2026-10-31 23:35:00+01'
),
control (orden, medida, ok) AS (
  SELECT 1, 'rápidos de la organización: ' || (SELECT count(*) FROM rapidos) || ' · con la lectura de las parejas: '
            || (SELECT count(*) FROM estado) || ' (los demás son anteriores al 29/09 o no tuvieron candidatos)',
         (SELECT count(*) FROM estado) > 0
  UNION ALL
  SELECT 2, 'regímenes fuera de los cuatro conocidos: '
            || coalesce((SELECT string_agg(DISTINCT coalesce(regimen, 'NULO'), ', ') FROM lecturas
                         WHERE regimen IS NULL OR regimen NOT IN ('tijera_vieja', 'pareja_entera', 'corte_honesto', 'sin_fuente_comun')), 'ninguno'),
         NOT EXISTS (SELECT 1 FROM lecturas WHERE regimen IS NULL
                     OR regimen NOT IN ('tijera_vieja', 'pareja_entera', 'corte_honesto', 'sin_fuente_comun'))
  UNION ALL
  SELECT 3, 'rápidos con los dos estados a la vez (el código no los puede producir): '
            || (SELECT count(*) FROM estado WHERE interruptor = 'LOS DOS (imposible)'),
         (SELECT count(*) FROM estado WHERE interruptor = 'LOS DOS (imposible)') = 0
  UNION ALL
  SELECT 4, 'documentos NOR-10: ' || (SELECT count(*) FROM nor10) || ' · CLI-12: ' || (SELECT count(*) FROM cli12) || ' (uno de cada)',
         (SELECT count(*) FROM nor10) = 1 AND (SELECT count(*) FROM cli12) = 1
  UNION ALL
  SELECT 5, 'CONTROL POSITIVO · pasadas de D del 30-31/10 con pareja_entera: ' || (SELECT enteras FROM control_d) || ' de '
            || (SELECT pasadas FROM control_d) || ' (SQL_34_08 leyó 21 de 21 el 02/11)',
         (SELECT pasadas FROM control_d) = 21 AND (SELECT enteras FROM control_d) = 21
)
SELECT bloque, a, b, c FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, 0 AS o1, NULL::timestamptz AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, orden, NULL
  FROM control
  UNION ALL
  SELECT '1 · el último rápido de NOR-10 ↔ CLI-12',
         coalesce((SELECT to_char(created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') || ' (Madrid) · ' || document_name
                   FROM estado WHERE de_la_pareja ORDER BY created_at DESC, id DESC LIMIT 1), 'NO HAY NINGUNO'),
         (SELECT 'régimen de la pareja: ' || coalesce(regimen_de_la_pareja, '—') || ' · interruptor: ' || interruptor
          FROM estado WHERE de_la_pareja ORDER BY created_at DESC, id DESC LIMIT 1),
         NULL, 10, NULL
  UNION ALL
  SELECT '2 · el último rápido, de cualquier pareja',
         coalesce((SELECT to_char(created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') || ' (Madrid) · ' || document_name
                   FROM estado ORDER BY created_at DESC, id DESC LIMIT 1), 'NO HAY NINGUNO'),
         (SELECT 'regímenes: ' || coalesce(regimenes, '—') || ' · interruptor: ' || interruptor
          FROM estado ORDER BY created_at DESC, id DESC LIMIT 1),
         NULL, 20, NULL
  UNION ALL
  SELECT '3 · por estado del interruptor', interruptor || ': ' || count(*) || ' rápidos',
         'el primero: ' || to_char(min(created_at) AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'),
         'el último: ' || to_char(max(created_at) AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI'),
         30, min(created_at)
  FROM estado GROUP BY interruptor
  UNION ALL
  SELECT '4 · los cambios', desde || ' → ' || hasta,
         'antes: ' || to_char(desde_t AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') || ' · ' || desde_doc,
         'después: ' || to_char(hasta_t AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') || ' · ' || hasta_doc,
         40, hasta_t
  FROM cambios
  UNION ALL
  SELECT '4 · los cambios', 'ninguno: todos los rápidos con lectura dicen lo mismo del interruptor', NULL, NULL, 41, NULL
  WHERE NOT EXISTS (SELECT 1 FROM cambios)
) z
ORDER BY o1, o2 NULLS FIRST;
