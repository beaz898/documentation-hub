-- ============================================================================
-- SQL_34_02 · EL MATERIAL DEL DIAGNÓSTICO DE D, EN LAS PASADAS DE NOR-10 DE LA TANDA DEL 3.4 — SÓLO LECTURA (27/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- QUÉ CONTESTA (encargo del arquitecto del 27/10, puntos d, e y f; lo demás sale del repositorio):
--   1 · ¿SE CITA §3.5 DE CLI-12 EN ALGÚN HALLAZGO? Busca en las tres cosas que la base guarda con citas: las
--       contradicciones publicadas, los solapamientos (judgments[].overlappingContent) y los descartes de la puerta de
--       citas (judgments[].descartesPorCita). Una cita «es de §3.5» si, normalizada, es un tramo literal del párrafo
--       §3.5 (copiado abajo del corpus de pruebas): la puerta sólo deja pasar citas literales, así que no hay otra forma
--       de que una cita venga de ahí.
--   2 · TODOS LOS DESCARTES de cada pasada: los contadores de analysis->'discardedFindings', TODOS, con su nombre; y
--       cada descarte de la puerta de citas, con su tipo, su tema, el lado que falló y las dos citas.
--       ⚠️ LO QUE LA BASE NO TIENE, leído en el código: el TEXTO de lo que descartó el VERIFICADOR. Sólo se guarda la
--       cuenta («descartado.<veredicto>»), y es a propósito: lib/analysis/types.ts:59-61, «Solo el número: el texto de
--       un hallazgo descartado NO está verificado y no debe persistirse ni mostrarse como si lo estuviera».
--   3 · LO ENTREGADO AL JUEZ en cada pareja (analysis->'lecturaDeLasParejas'): régimen, caracteres y mostrados de cada
--       lado, y si las dos mitades de D estaban dentro. En el texto armado desde los trozos (buildAnalyzedDocumentText,
--       medido en el repositorio el 27/10), la frase de NOR-10 §2.4 va del carácter 3.880 al 4.267 de 66.801, y la de
--       CLI-12 §3.5 del 6.679 al 6.991 de 55.135. «Dentro» es que lo mostrado llegue al FINAL de la frase.
--
-- LA VENTANA Y EL ESPERADO vienen PUESTOS con lo que dio la base en SQL_34_01 (arquitecto, 27/10): del 26/10 a las
-- 23:00 al 27/10 a las 00:30, hora de Madrid, y 8 pasadas de NOR-10. Si no cuadran, el control lo dice.
-- La consulta no interpreta: enseña.
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
         timestamptz '2026-10-26 23:00:00+01' AS desde,   -- ← DESDE (de SQL_34_01)
         timestamptz '2026-10-27 00:30:00+01' AS hasta,   -- ← HASTA
         8 AS esperado_nor10,                              -- ← las pasadas de NOR-10 que midió la base
         -- §3.5 de CLI-12, literal del corpus de pruebas (trozo 6), normalizado como las citas
         translate(lower('En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado.'), 'áéíóúü', 'aeiouu') AS parrafo_35,
         4267 AS fin_24, 6991 AS fin_35
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis,
         row_number() OVER (ORDER BY ar.created_at, ar.id) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%'
    AND ar.created_at >= p.desde AND ar.created_at < p.hasta
),
juicios AS (
  SELECT pa.n, j.j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array'
                                               THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j(j)
),
citas AS (
  -- las tres fuentes de citas del lado existente que la base guarda
  SELECT pa.n, 'contradicción publicada' AS fuente, d->>'existingDocument' AS candidato, d->>'topic' AS tema, d->>'existingDocSays' AS cita
  FROM pasadas pa CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array'
                                                                THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END) d
  UNION ALL
  SELECT ju.n, 'solapamiento', ju.j->>'documentName', o->>'description', o->>'evidence'
  FROM juicios ju CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'overlappingContent') = 'array'
                                                                THEN ju.j->'overlappingContent' ELSE '[]'::jsonb END) o
  UNION ALL
  SELECT ju.n, 'descarte de la puerta de citas', ju.j->>'documentName', x->>'tema', x->>'citaExistente'
  FROM juicios ju CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array'
                                                                THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) x
),
de35 AS (
  SELECT c.* FROM citas c, parametros p
  WHERE length(coalesce(c.cita, '')) >= 20
    AND position(translate(lower(c.cita), 'áéíóúü', 'aeiouu') IN p.parrafo_35) > 0
),
nombres AS (SELECT d.id::text AS id, d.name FROM public.documents d, parametros p WHERE d.org_id = p.org),
control (orden, medida, ok) AS (
  SELECT 1, 'pasadas de NOR-10 en la ventana: ' || (SELECT count(*) FROM pasadas) || ' · esperado: ' || p.esperado_nor10,
         (SELECT count(*) FROM pasadas) = p.esperado_nor10
  FROM parametros p
  UNION ALL
  SELECT 2, 'citas del lado existente leídas en las tres fuentes: ' || (SELECT count(*) FROM citas),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL ELSE (SELECT count(*) FROM citas) > 0 END
)
SELECT bloque, pasada, a, b, c
FROM (
  SELECT 'organización leída' AS bloque, NULL::text AS pasada, linea AS a, NULL::text AS b, NULL::text AS c, -1 AS o1, 0::bigint AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', NULL, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END, medida, NULL, orden, 0
  FROM control
  UNION ALL
  -- 1 · §3.5 CITADO: el resumen por pasada (también cuando es cero, que es un resultado) y cada cita encontrada
  SELECT '1 · §3.5 citado', 'NOR-10 ' || pa.n,
         (SELECT count(*) FROM de35 WHERE de35.n = pa.n)::text || ' citas de §3.5',
         'de ' || (SELECT count(*) FROM citas WHERE citas.n = pa.n) || ' citas del lado existente en la pasada',
         NULL, pa.n, 0
  FROM pasadas pa
  UNION ALL
  SELECT '1 · §3.5 citado', 'NOR-10 ' || d.n, d.fuente, coalesce(d.candidato, '—') || ' · ' || coalesce(d.tema, '(sin tema)'),
         '«' || d.cita || '»', d.n, 1
  FROM de35 d
  UNION ALL
  -- 2 · TODOS LOS DESCARTES: los contadores, todos, y los descartes de la puerta de citas con su texto
  SELECT '2 · descartes', 'NOR-10 ' || pa.n, k.clave, k.valor, 'contador', pa.n, 0
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_each_text(CASE WHEN jsonb_typeof(pa.analysis->'discardedFindings') = 'object'
                                          THEN pa.analysis->'discardedFindings' ELSE '{}'::jsonb END) k(clave, valor)
  UNION ALL
  SELECT '2 · descartes', 'NOR-10 ' || ju.n, 'puerta de citas · ' || coalesce(x->>'tipo', '—') || ' · falló: ' || coalesce(x->>'ladoFallido', '—'),
         coalesce(ju.j->>'documentName', '—') || ' · ' || coalesce(x->>'tema', '(sin tema)'),
         'nuevo: «' || coalesce(x->>'citaNuevo', '') || '» · existente: «' || coalesce(x->>'citaExistente', '') || '»',
         ju.n, 1
  FROM juicios ju CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array'
                                                                THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) x
  UNION ALL
  -- 3 · LO ENTREGADO AL JUEZ en cada pareja, y si las dos mitades de D estaban dentro
  SELECT '3 · lo entregado', 'NOR-10 ' || pa.n, coalesce(nm.name, l->>'documentId', '—') || ' · ' || coalesce(l->>'regimen', '—'),
         'analizado ' || coalesce(l->'analizado'->>'mostrados', '—') || '/' || coalesce(l->'analizado'->>'caracteres', '—') ||
           ' · candidato ' || coalesce(l->'candidato'->>'mostrados', '—') || '/' || coalesce(l->'candidato'->>'caracteres', '—'),
         CASE WHEN nm.name NOT ILIKE 'CLI-12%' OR nm.name IS NULL THEN NULL
              WHEN (l->'analizado'->>'mostrados')::bigint >= p.fin_24 AND (l->'candidato'->>'mostrados')::bigint >= p.fin_35
                   AND (l->'analizado'->>'mostrados') = (l->'analizado'->>'caracteres') AND (l->'candidato'->>'mostrados') = (l->'candidato'->>'caracteres')
                THEN 'las dos mitades de D, DENTRO: los dos lados enteros'
              WHEN (l->'analizado'->>'mostrados')::bigint >= p.fin_24 AND (l->'candidato'->>'mostrados')::bigint >= p.fin_35
                THEN 'CORTADA: lo mostrado llega al final de las dos mitades, pero no es el documento entero'
              ELSE '⚠️ ALGUNA MITAD DE D FUERA de lo entregado' END,
         pa.n, 2
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array'
                                               THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
  LEFT JOIN nombres nm ON nm.id = l->>'documentId'
  CROSS JOIN parametros p
) t
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2, a;
