-- ============================================================================
-- SQL_34_02 · EL MATERIAL DEL DIAGNÓSTICO DE D, EN LAS PASADAS DE NOR-10 DE UNA TANDA DEL 3.4 — SÓLO LECTURA
-- (27/10/2026; §3.1 y la ventana en NULO, 27/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- QUÉ CONTESTA (encargos del arquitecto del 27/10):
--   1 · ¿QUÉ MITAD DE CLI-12 SE CITA? Por pasada, cuántas citas del lado existente son de §3.5 y cuántas de §3.1, las
--       dos SIEMPRE, también a cero. Busca en las tres cosas que la base guarda con citas: las contradicciones
--       publicadas, los solapamientos (judgments[].overlappingContent) y los descartes de la puerta de citas
--       (judgments[].descartesPorCita). Una cita «es de» un apartado si, normalizada (minúsculas, sin tildes, los
--       espacios en uno), es un tramo literal de su texto, copiado abajo del corpus de pruebas: la puerta sólo deja
--       pasar citas literales.
--       ⚠️ §3.1 NO ES SÓLO EL PRINCIPIO (Code, leído en el corpus el 27/10): lleva tres cosas, la frase sembrada de A
--       («El responsable último…»), la del principio («Esta asignación responde…», la que el juez escogió para D el
--       26/10) y el párrafo de las decisiones del Coordinador, que es lo que A cita siempre. Contado entero, §3.1 sale
--       con citas en cada pasada en que se publique A. Por eso, al lado, «de la frase del principio»: las citas de §3.1
--       que tocan esa frase.
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
-- LA VENTANA Y EL ESPERADO VAN EN NULO y se rellenan DESPUÉS DE MIRAR EL RELOJ DE LA BASE, nunca antes. Sin ventana,
-- el control 1 lo dice y no se lee ninguna pasada. La primera tanda (26/10, 23:00 a 00:30, 8 pasadas de NOR-10) ya se
-- leyó con la versión anterior de esta consulta.
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
         NULL::timestamptz AS desde,             -- ← DESDE: el comienzo real de la tanda
         NULL::timestamptz AS hasta,             -- ← HASTA: el final real de la tanda
         NULL::int AS esperado_nor10,            -- ← ESPERADO NOR-10: DESPUÉS de mirar el reloj de la base
         4267 AS fin_24, 6991 AS fin_35
),
textos AS (
  -- literales del corpus de pruebas (CLI-12, trozos 3, 4 y 6), normalizados como las citas
  SELECT translate(lower(regexp_replace('En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p35,
         translate(lower(regexp_replace('El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico. Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización. El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico. El Director Clínico es informado de estas decisiones pero no interviene en ellas como autoridad jerárquica.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p31,
         translate(lower('Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización.'), 'áéíóúü', 'aeiouu') AS principio
),
tramo AS (
  -- dónde cae la frase del principio dentro de §3.1 normalizado
  SELECT position(t.principio IN t.p31) AS ini, position(t.principio IN t.p31) + length(t.principio) - 1 AS fin FROM textos t
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
clasificadas AS (
  SELECT c.*, k.normal,
         length(k.normal) >= 20 AND position(k.normal IN t.p35) > 0 AS de35,
         length(k.normal) >= 20 AND position(k.normal IN t.p31) > 0 AS de31,
         length(k.normal) >= 20 AND position(k.normal IN t.p31) > 0
           AND position(k.normal IN t.p31) <= tr.fin AND position(k.normal IN t.p31) + length(k.normal) - 1 >= tr.ini AS del_principio
  FROM citas c
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(c.cita, ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) k
  CROSS JOIN textos t CROSS JOIN tramo tr
),
nombres AS (SELECT d.id::text AS id, d.name FROM public.documents d, parametros p WHERE d.org_id = p.org),
control (orden, medida, ok) AS (
  SELECT 1, 'ventana: ' || coalesce(to_char(p.desde AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' a ' ||
            coalesce(to_char(p.hasta AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' (hora de Madrid)',
         p.desde IS NOT NULL AND p.hasta IS NOT NULL
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de NOR-10 en la ventana: ' || (SELECT count(*) FROM pasadas) || ' · esperado: ' || coalesce(p.esperado_nor10::text, 'SIN RELLENAR'),
         CASE WHEN p.esperado_nor10 IS NULL THEN NULL ELSE (SELECT count(*) FROM pasadas) = p.esperado_nor10 END
  FROM parametros p
  UNION ALL
  SELECT 3, 'citas del lado existente leídas en las tres fuentes: ' || (SELECT count(*) FROM citas),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL ELSE (SELECT count(*) FROM citas) > 0 END
  UNION ALL
  -- el texto de §3.1 contiene la frase del principio: si no, el recuento «de la frase del principio» no mira nada
  SELECT 4, 'la frase del principio está dentro de §3.1: carácter ' || (SELECT ini FROM tramo) || ' a ' || (SELECT fin FROM tramo),
         (SELECT ini FROM tramo) > 0
)
SELECT bloque, pasada, a, b, c
FROM (
  SELECT 'organización leída' AS bloque, NULL::text AS pasada, linea AS a, NULL::text AS b, NULL::text AS c, -1 AS o1, 0::bigint AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', NULL, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END, medida, NULL, orden, 0
  FROM control
  UNION ALL
  -- 1 · LA MITAD CITADA: el resumen por pasada, con los dos apartados SIEMPRE, y cada cita encontrada
  SELECT '1 · la mitad citada', 'NOR-10 ' || pa.n,
         '§3.5: ' || (SELECT count(*) FROM clasificadas cl WHERE cl.n = pa.n AND cl.de35) ||
           ' · §3.1: ' || (SELECT count(*) FROM clasificadas cl WHERE cl.n = pa.n AND cl.de31) ||
           ' (de la frase del principio: ' || (SELECT count(*) FROM clasificadas cl WHERE cl.n = pa.n AND cl.del_principio) || ')',
         'de ' || (SELECT count(*) FROM citas WHERE citas.n = pa.n) || ' citas del lado existente en la pasada',
         NULL, pa.n, 0
  FROM pasadas pa
  UNION ALL
  SELECT '1 · la mitad citada', 'NOR-10 ' || cl.n,
         CASE WHEN cl.de35 THEN '§3.5' WHEN cl.del_principio THEN '§3.1 · la frase del principio' ELSE '§3.1 · fuera de la frase del principio' END
           || ' · ' || cl.fuente,
         coalesce(cl.candidato, '—') || ' · ' || coalesce(cl.tema, '(sin tema)'),
         '«' || cl.cita || '»', cl.n, 1
  FROM clasificadas cl WHERE cl.de35 OR cl.de31
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
