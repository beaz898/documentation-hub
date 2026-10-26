-- ============================================================================
-- SQL_34_01 · LA TANDA DEL 3.4 (CONFLICTO NORMATIVO): LAS NUEVE PREDICCIONES — SÓLO LECTURA (26/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- QUÉ CONTESTA, bloque por bloque (claude/Predicciones_34_Conflicto_Normativo.md):
--   0 · control: la ventana rellena, las pasadas que hay frente a las esperadas, que todas sean RÁPIDAS (condición de
--       la medida: el exhaustivo pierde la especie) y que todas traigan el registro por llamada.
--   1 · cada hallazgo publicado, por pasada y por pareja: candidato, tema, especie (o «sin especie»), severidad y las
--       dos citas enteras. Califica 1a, 1b, 2, 4 y 7. D se reconoce por sus citas (NOR-10 · 2.4 y CLI-12 · 3.5).
--   2 · el recuento de hallazgos por pasada en NOR-10 ↔ CLI-12, con el CRITERIO DE ABANDONO (más de 7, se revierte).
--   3 · los contadores de analysis->'discardedFindings', uno por uno y con su nombre completo:
--       frontera.conflicto_normativo_vacio (5), frontera.conflicto_normativo_desconocido (6),
--       descartado.cumplibles_a_la_vez y los desglosados por especie (8). Ausente es 0, y se dice.
--   4 · NOR-11 ↔ CLI-13: cuántos hallazgos llevan especie (3: tiene que ser 0), y las cinco coincidencias declaradas
--       de SIEMBRA_caso_control.md, por una palabra que tiene que estar en LAS DOS citas.
--   5 · los tokens de entrada de cada llamada del juez, con la pareja por su nombre (9), y por pasada las llamadas
--       al verificador y los hallazgos marcados que le llegaron: la llamada extra de la rama.
--
-- LO QUE TOCA EL DIRECTOR, en `parametros`: DESDE y HASTA, con las horas reales de la tanda, en hora de Madrid y con
-- el formato timestamptz 'AAAA-MM-DD HH:MM:SS+01' (horario de invierno desde el 25/10). Y los ESPERADOS, que van en
-- NULO y se rellenan DESPUÉS DE MIRAR EL RELOJ DE LA BASE, nunca antes. Sin ventana, el control 1 lo dice.
-- La consulta no califica: enseña. Las calificaciones son del arquitecto.
-- ============================================================================
-- ── LA RESOLUCIÓN DE LA ORGANIZACIÓN (26/10/2026), IDÉNTICA EN TODAS LAS CONSULTAS QUE MIRAN HACIA DELANTE ──
-- La organización NO se escribe: es la ÚNICA a la que pertenece el USUARIO del director. Si tiene cero o más de una,
-- la primera fila de la salida lo dice a gritos y todo lo demás está leyendo NADA. La primera fila dice SIEMPRE qué
-- organización se lee, su nombre y cuántos documentos tiene: un id o una resolución equivocados no pueden pasar por
-- «no hay hallazgos».
-- ⚠️ a9625e93-af2a-4416-a465-5c2fa2a25bdf ES A LA VEZ EL ID DEL USUARIO DEL DIRECTOR Y EL DE LA ORGANIZACIÓN DEL
-- PILOTO (purgada el 25/10/2026). Es un accidente histórico del código de antes del 27/04/2026, que tomaba el id del
-- usuario como id de la organización. AQUÍ ES EL USUARIO. NO SE UNIFICA con ORG_DEL_PILOTO de SQL_SEG_02, que es el
-- mismo número con el otro significado: unificarlas rompe el rescate de llm_usage sin que salte nada.
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
  SELECT CASE WHEN r.org IS NOT NULL   -- la que se lee DE VERDAD, no la que se cuenta
              THEN 'organización leída: ' || r.org || ' · «' || coalesce(o.name, '¿sin nombre?') || '» · '
                   || (SELECT count(*) FROM public.documents d WHERE d.org_id = r.org) || ' documentos'
              ELSE '⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' || r.usuario || ' tiene ' || r.pertenencias
                   || ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.' END AS linea
  FROM resolucion r LEFT JOIN public.organizations o ON o.id::text = r.org
),
parametros AS (
  SELECT (SELECT org FROM resolucion) AS org,   -- ← la organización RESUELTA por el USUARIO (arriba)
         NULL::timestamptz AS desde,             -- ← DESDE: el comienzo real de la tanda
         NULL::timestamptz AS hasta,             -- ← HASTA: el final real de la tanda
         NULL::int AS esperado_nor10,            -- ← ESPERADO NOR-10: DESPUÉS de mirar el reloj de la base
         NULL::int AS esperado_nor11             -- ← ESPERADO NOR-11: ídem
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis_type, ar.analysis,
         CASE WHEN ar.document_name ILIKE 'NOR-10%' THEN 'NOR-10' ELSE 'NOR-11' END AS doc,
         row_number() OVER (PARTITION BY CASE WHEN ar.document_name ILIKE 'NOR-10%' THEN 'NOR-10' ELSE 'NOR-11' END
                            ORDER BY ar.created_at, ar.id) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND (ar.document_name ILIKE 'NOR-10%' OR ar.document_name ILIKE 'NOR-11%')
    AND ar.created_at >= p.desde AND ar.created_at < p.hasta
),
pub AS (
  SELECT pa.doc, pa.n, x.ord, x.d->>'existingDocument' AS candidato, x.d->>'topic' AS tema,
         x.d->>'conflictoNormativo' AS especie, x.d->>'severity' AS severidad,
         x.d->>'newDocSays' AS cita_nuevo, x.d->>'existingDocSays' AS cita_existente
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array'
                                               THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END) WITH ORDINALITY x(d, ord)
),
contadores AS (
  SELECT pa.doc, pa.n, k.clave, k.valor::bigint AS valor
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_each_text(CASE WHEN jsonb_typeof(pa.analysis->'discardedFindings') = 'object'
                                          THEN pa.analysis->'discardedFindings' ELSE '{}'::jsonb END) k(clave, valor)
),
nombrados (orden, clave) AS (
  VALUES (1, 'frontera.conflicto_normativo_vacio'), (2, 'frontera.conflicto_normativo_desconocido'),
         (3, 'descartado.cumplibles_a_la_vez')
),
coincidencias (orden, nombre, palabra) AS (
  VALUES (1, 'verde para el grupo II', 'verde'), (2, 'azul para el grupo IV', 'azul'),
         (3, 'rígido amarillo para punzocortantes', 'punzocortante'), (4, 'cierre a las tres cuartas partes', 'tres cuartas'),
         (5, 'grupo I sin color', 'asimilables')
),
nombres AS (SELECT d.id::text AS id, d.name FROM public.documents d, parametros p WHERE d.org_id = p.org),
peticiones AS (
  SELECT pa.doc, pa.n, x.p->>'etapa' AS etapa, x.p->>'pareja' AS pareja, x.ord,
         coalesce((x.p->'tokens'->>'entrada')::bigint, 0) AS te,
         coalesce((x.p->'tokens'->>'escrituraCache')::bigint, 0) AS tw,
         coalesce((x.p->'tokens'->>'lecturaCache')::bigint, 0) AS tr
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'llamadasAlModelo'->'peticiones') = 'array'
                                               THEN pa.analysis->'llamadasAlModelo'->'peticiones' ELSE '[]'::jsonb END) WITH ORDINALITY x(p, ord)
),
control (orden, medida, ok) AS (
  SELECT 1, 'ventana: ' || coalesce(to_char(p.desde AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' a ' ||
            coalesce(to_char(p.hasta AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' (hora de Madrid)',
         p.desde IS NOT NULL AND p.hasta IS NOT NULL
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de NOR-10 en la ventana: ' || (SELECT count(*) FROM pasadas WHERE doc = 'NOR-10') ||
            ' · esperado: ' || coalesce(p.esperado_nor10::text, 'SIN RELLENAR'),
         CASE WHEN p.esperado_nor10 IS NULL THEN NULL ELSE (SELECT count(*) FROM pasadas WHERE doc = 'NOR-10') = p.esperado_nor10 END
  FROM parametros p
  UNION ALL
  SELECT 3, 'pasadas de NOR-11 en la ventana: ' || (SELECT count(*) FROM pasadas WHERE doc = 'NOR-11') ||
            ' · esperado: ' || coalesce(p.esperado_nor11::text, 'SIN RELLENAR'),
         CASE WHEN p.esperado_nor11 IS NULL THEN NULL ELSE (SELECT count(*) FROM pasadas WHERE doc = 'NOR-11') = p.esperado_nor11 END
  FROM parametros p
  UNION ALL
  SELECT 4, 'pasadas que NO son rápidas (condición de la medida): ' || (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL ELSE (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0 END
  UNION ALL
  SELECT 5, 'pasadas sin registro por llamada (sin él, el bloque 5 no se puede leer): ' ||
            (SELECT count(*) FROM pasadas WHERE jsonb_typeof(analysis->'llamadasAlModelo') IS DISTINCT FROM 'object'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM pasadas WHERE jsonb_typeof(analysis->'llamadasAlModelo') IS DISTINCT FROM 'object') = 0 END
)
SELECT bloque, pasada, a, b, c
FROM (
  SELECT 'organización leída' AS bloque, NULL::text AS pasada, linea AS a, NULL::text AS b, NULL::text AS c,
         -1 AS o1, 0::bigint AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', NULL, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END, medida, NULL,
         orden, 0
  FROM control
  UNION ALL
  -- 1 · CADA HALLAZGO PUBLICADO (1a, 1b, 2, 4 y 7)
  SELECT '1 · hallazgo', pu.doc || ' ' || pu.n, coalesce(pu.candidato, '—'),
         coalesce(nullif(pu.tema, ''), '(sin tema)') || ' · ' || coalesce(nullif(pu.especie, ''), 'sin especie') || ' · ' ||
           coalesce(pu.severidad, 'sin severidad'),
         'nuevo: «' || coalesce(pu.cita_nuevo, '') || '» · existente: «' || coalesce(pu.cita_existente, '') || '»',
         CASE WHEN pu.doc = 'NOR-10' THEN 100 ELSE 200 END + pu.n, pu.ord
  FROM pub pu
  UNION ALL
  -- 2 · EL RECUENTO DE NOR-10 ↔ CLI-12 Y EL CRITERIO DE ABANDONO (7)
  SELECT '2 · NOR-10 ↔ CLI-12', 'NOR-10 ' || pa.n,
         (SELECT count(*) FROM pub pu WHERE pu.doc = 'NOR-10' AND pu.n = pa.n AND pu.candidato ILIKE 'CLI-12%')::text || ' hallazgos',
         CASE WHEN (SELECT count(*) FROM pub pu WHERE pu.doc = 'NOR-10' AND pu.n = pa.n AND pu.candidato ILIKE 'CLI-12%') > 7
              THEN '⚠️ MÁS DE 7: CRITERIO DE ABANDONO' ELSE 'no pasa de 7' END,
         'con especie: ' || (SELECT count(*) FROM pub pu WHERE pu.doc = 'NOR-10' AND pu.n = pa.n AND pu.candidato ILIKE 'CLI-12%'
                              AND coalesce(pu.especie, '') <> ''),
         100 + pa.n, 0
  FROM pasadas pa WHERE pa.doc = 'NOR-10'
  UNION ALL
  -- 3 · LOS CONTADORES (5, 6 y 8): los tres nombrados siempre, con 0 si faltan; los desglosados por especie, los que haya
  SELECT '3 · contadores', pa.doc || ' ' || pa.n, nb.clave,
         coalesce((SELECT co.valor FROM contadores co WHERE co.doc = pa.doc AND co.n = pa.n AND co.clave = nb.clave)::text, '0 (ausente)'),
         NULL,
         CASE WHEN pa.doc = 'NOR-10' THEN 100 ELSE 200 END + pa.n, nb.orden
  FROM pasadas pa CROSS JOIN nombrados nb
  UNION ALL
  SELECT '3 · contadores', co.doc || ' ' || co.n, co.clave, co.valor::text, 'desglose por especie',
         CASE WHEN co.doc = 'NOR-10' THEN 100 ELSE 200 END + co.n, 10
  FROM contadores co WHERE co.clave LIKE 'descartado.%.norma_contra_%'
  UNION ALL
  -- 4 · NOR-11 ↔ CLI-13: la especie (3, tiene que ser 0) y las cinco coincidencias declaradas
  SELECT '4 · NOR-11 ↔ CLI-13', 'NOR-11 ' || pa.n, 'hallazgos con especie',
         (SELECT count(*) FROM pub pu WHERE pu.doc = 'NOR-11' AND pu.n = pa.n AND pu.candidato ILIKE 'CLI-13%'
            AND coalesce(pu.especie, '') <> '')::text,
         NULL, 200 + pa.n, 0
  FROM pasadas pa WHERE pa.doc = 'NOR-11'
  UNION ALL
  SELECT '4 · NOR-11 ↔ CLI-13', 'NOR-11 ' || pa.n, 'coincidencia ' || ci.orden || ': ' || ci.nombre,
         (SELECT count(*) FROM pub pu WHERE pu.doc = 'NOR-11' AND pu.n = pa.n AND pu.candidato ILIKE 'CLI-13%'
            AND translate(lower(pu.cita_nuevo), 'áéíóúü', 'aeiouu') LIKE '%' || ci.palabra || '%'
            AND translate(lower(pu.cita_existente), 'áéíóúü', 'aeiouu') LIKE '%' || ci.palabra || '%')::text || ' hallazgos',
         'por la palabra «' || ci.palabra || '» en las dos citas',
         200 + pa.n, ci.orden
  FROM pasadas pa CROSS JOIN coincidencias ci WHERE pa.doc = 'NOR-11'
  UNION ALL
  -- 5 · LOS TOKENS DE ENTRADA DEL JUEZ (9), por llamada, y la llamada extra del verificador
  SELECT '5 · tokens', pe.doc || ' ' || pe.n, 'juez · ' || coalesce(nm.name, pe.pareja, '(sin pareja)'),
         'entrada ' || pe.te || ' · con la caché ' || (pe.te + pe.tw + pe.tr),
         NULL,
         CASE WHEN pe.doc = 'NOR-10' THEN 100 ELSE 200 END + pe.n, pe.ord
  FROM peticiones pe LEFT JOIN nombres nm ON nm.id = pe.pareja
  WHERE pe.etapa = 'juez'
  UNION ALL
  SELECT '5 · tokens', pa.doc || ' ' || pa.n, 'verificador',
         (SELECT count(*) FROM peticiones pe WHERE pe.doc = pa.doc AND pe.n = pa.n AND pe.etapa = 'verificador')::text || ' llamadas',
         'marcados que le llegaron: ' ||
           ((SELECT count(*) FROM pub pu WHERE pu.doc = pa.doc AND pu.n = pa.n AND coalesce(pu.especie, '') <> '') +
            coalesce((SELECT sum(co.valor) FROM contadores co WHERE co.doc = pa.doc AND co.n = pa.n AND co.clave LIKE 'descartado.%.norma_contra_%'), 0)),
         CASE WHEN pa.doc = 'NOR-10' THEN 100 ELSE 200 END + pa.n, 100000
  FROM pasadas pa
) t
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2, pasada;
