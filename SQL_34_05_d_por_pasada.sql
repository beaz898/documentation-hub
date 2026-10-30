-- ============================================================================
-- SQL_34_05 · D POR PASADA EN LOS ANÁLISIS RÁPIDOS DE NOR-10, CONTADA POR LA CONSULTA Y NO A OJO — SÓLO LECTURA (30/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- PARA QUÉ (arquitecto, 30/10): medir la línea base de D con veinte análisis reales de NOR-10. ANTES, su CONTROL POSITIVO:
-- correrla sobre la ventana de la SEGUNDA TANDA DEL 3.4 (27/10, siete pasadas de NOR-10) y ver si reproduce el «2 de 7»
-- que el arquitecto puntuó leyendo SQL_34_01 («2 de 7, UNA de ellas con la etiqueta», consulta F-130). Si no lo
-- reproduce, se separa la consulta mal hecha de la puntuación a ojo mal hecha antes de medir nada nuevo.
--
-- LA REGLA, MECÁNICA: en una pasada hay D si se PUBLICÓ una contradicción con CLI-12 cuya cita del lado de NOR-10 toca la
-- PRIMERA frase de 2.4 (el permiso: «…puede recaer en el propio Director Clínico…»). La segunda frase de 2.4 («El
-- Coordinador de Calidad no sustituye…») es de A y no cuenta. Es el reconocimiento de SQL_34_03 (publicadas_d), con la
-- pareja restringida a CLI-12. Del lado de CLI-12 se dice QUÉ citó: el principio de §3.1, §3.5, otra parte de §3.1 u
-- otra cosa. Una cita de NOR-10 que toque la primera frase Y SIGA en la segunda va como DUDOSA, para que la mire el
-- arquitecto.
--
-- ⚠️ LO QUE NO SE PUEDE RECONOCER, y la consulta lo cuenta en vez de callarlo, por pasada y en la pareja NOR-10 ↔ CLI-12:
--   · CON TEXTO, y se reconoce: la puerta de citas guarda cada descarte con sus dos citas (judgments[].descartesPorCita).
--     Una D muerta ahí sale como «muerta en la puerta».
--   · SIN TEXTO, y NO se puede saber si era D: lo que descarta el verificador y la cascada determinista se guarda sólo
--     como número, por motivo (judgments[].discarded, claves «descartado.<motivo>» y «r2.sin_ancla»; el verificador las
--     funde en pipeline.ts:637-639 y :653-656; el porqué, en lib/analysis/types.ts:59-61). También la frontera
--     («frontera.cita_ausente», «frontera.elemento_no_objeto») y la puerta sin detalle («narracionEnCita»,
--     «citaDeContexto», «descartesPorCitaOmitidos»). Aparte, los del verificador CON LA ETIQUETA
--     («descartado.<motivo>.norma_contra_norma»), que son los candidatos más probables a ser D.
--   La suma sin texto es la COTA de lo que la medición no ve: en una pasada sin D publicada, D pudo morir ahí hasta ese
--   número de veces. Y lo que el juez no escribió no deja rastro en ningún sitio: eso es lo que se mide.
--
-- QUÉ SACA:
--   0 · controles: la ventana; las pasadas frente a las esperadas; que todas sean rápidas; que CLI-12 resuelva a UN
--       documento; que las frases de D y del principio estén dentro de sus apartados; que cada pasada tenga su juicio de
--       CLI-12 y que lleve «discarded» guardado (si no, el «sin texto» de esa pasada es un agujero, no un cero).
--   1 · por pasada: hora, modelo de la pareja con CLI-12 y duración (la última llamada del registro: comienzo más
--       latencia); el VEREDICTO; las citas de cada D; lo muerto en la puerta; lo muerto sin texto.
--   2 · el total: D en X de N pasadas, cuántas con la etiqueta, cuántas dudosas, y la cota sin texto.
--
-- LA VENTANA Y EL ESPERADO VAN EN NULO y se rellenan DESPUÉS DE MIRAR EL RELOJ DE LA BASE, nunca antes. Para el control
-- positivo, la ventana de la segunda tanda del 27/10 y el esperado 7.
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
         NULL::int AS esperado                   -- ← ESPERADO: pasadas de NOR-10, DESPUÉS de mirar el reloj de la base
),
textos AS (
  -- literales del corpus, copiados de SQL_34_03 (NOR-10 · 2.4 y su primera frase) y de SQL_34_02 (CLI-12 · §3.5, §3.1 y
  -- la frase del principio), normalizados como las citas
  SELECT translate(lower(regexp_replace('Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p24,
         translate(lower('Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro.'), 'áéíóúü', 'aeiouu') AS frase_d,
         translate(lower(regexp_replace('En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p35,
         translate(lower(regexp_replace('El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico. Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización. El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico. El Director Clínico es informado de estas decisiones pero no interviene en ellas como autoridad jerárquica.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p31,
         translate(lower('Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización.'), 'áéíóúü', 'aeiouu') AS principio
),
tramo_d AS (   -- dónde cae la primera frase de 2.4 (el permiso) dentro de 2.4 normalizado
  SELECT position(t.frase_d IN t.p24) AS ini, position(t.frase_d IN t.p24) + length(t.frase_d) - 1 AS fin FROM textos t
),
tramo_p AS (   -- dónde cae la frase del principio dentro de §3.1 normalizado
  SELECT position(t.principio IN t.p31) AS ini, position(t.principio IN t.p31) + length(t.principio) - 1 AS fin FROM textos t
),
cli12 AS (
  SELECT d.id::text AS id FROM public.documents d, parametros p WHERE d.org_id = p.org AND d.name LIKE 'CLI-12%'
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis, ar.analysis_type,
         row_number() OVER (ORDER BY ar.created_at, ar.id) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name LIKE 'NOR-10%'
    AND ar.created_at >= p.desde AND ar.created_at < p.hasta
),
publicadas AS (   -- las contradicciones publicadas con CLI-12, con sus dos citas normalizadas
  SELECT pa.n, d->>'conflictoNormativo' AS especie, d->>'newDocSays' AS cita_nor, d->>'existingDocSays' AS cita_cli,
         kn.normal AS nn, kc.normal AS nc
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array'
                                               THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END) d
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(d->>'newDocSays', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) kn
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(d->>'existingDocSays', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) kc
  WHERE d->>'existingDocumentId' IN (SELECT id FROM cli12)
),
d_publicada AS (   -- las que son D: la cita de NOR-10 toca la primera frase de 2.4
  SELECT pu.*,
         position(pu.nn IN t.p24) + length(pu.nn) - 1 > tr.fin AS a_caballo,
         CASE WHEN length(pu.nc) >= 20 AND position(pu.nc IN t.p31) > 0
                   AND position(pu.nc IN t.p31) <= tp.fin AND position(pu.nc IN t.p31) + length(pu.nc) - 1 >= tp.ini THEN 'el principio de §3.1'
              WHEN length(pu.nc) >= 20 AND position(pu.nc IN t.p35) > 0 THEN '§3.5'
              WHEN length(pu.nc) >= 20 AND position(pu.nc IN t.p31) > 0 THEN '§3.1, fuera del principio'
              ELSE 'otra cosa' END AS lado_cli
  FROM publicadas pu CROSS JOIN textos t CROSS JOIN tramo_d tr CROSS JOIN tramo_p tp
  WHERE length(pu.nn) >= 20 AND position(pu.nn IN t.p24) > 0
    AND position(pu.nn IN t.p24) <= tr.fin AND position(pu.nn IN t.p24) + length(pu.nn) - 1 >= tr.ini
),
juicios AS (   -- el juicio de la pareja NOR-10 ↔ CLI-12 de cada pasada
  SELECT pa.n, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array'
                                               THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
  WHERE j->>'documentId' IN (SELECT id FROM cli12)
),
d_puerta AS (   -- D muerta en la puerta de citas: el mismo reconocimiento, sobre la cita del lado nuevo del descarte
  SELECT ju.n, count(*) AS veces
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array'
                                               THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) x
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(x->>'citaNuevo', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) k
  CROSS JOIN textos t CROSS JOIN tramo_d tr
  WHERE x->>'tipo' = 'contradiccion' AND length(k.normal) >= 20 AND position(k.normal IN t.p24) > 0
    AND position(k.normal IN t.p24) <= tr.fin AND position(k.normal IN t.p24) + length(k.normal) - 1 >= tr.ini
  GROUP BY ju.n
),
sin_texto AS (   -- lo que murió en la pareja sin dejar texto: la cota de lo que la medición no ve
  SELECT ju.n,
         coalesce(jsonb_typeof(ju.j->'discarded') = 'object', false) AS con_discarded,
         (SELECT coalesce(sum(v::bigint), 0) FROM jsonb_each_text(CASE WHEN jsonb_typeof(ju.j->'discarded') = 'object' THEN ju.j->'discarded' ELSE '{}'::jsonb END) e(k, v)
           WHERE k ~ '^descartado\.[a-z_]+$' OR k = 'r2.sin_ancla') AS cascada,
         (SELECT coalesce(sum(v::bigint), 0) FROM jsonb_each_text(CASE WHEN jsonb_typeof(ju.j->'discarded') = 'object' THEN ju.j->'discarded' ELSE '{}'::jsonb END) e(k, v)
           WHERE k ~ '^descartado\.[a-z_]+\.norma_contra_norma$') AS con_etiqueta,
         coalesce((ju.j->'discarded'->>'frontera.cita_ausente')::bigint, 0) + coalesce((ju.j->'discarded'->>'frontera.elemento_no_objeto')::bigint, 0) AS frontera,
         coalesce((ju.j->'discarded'->>'narracionEnCita')::bigint, 0) + coalesce((ju.j->'discarded'->>'citaDeContexto')::bigint, 0)
           + coalesce((ju.j->>'descartesPorCitaOmitidos')::bigint, 0) AS puerta_sin_detalle
  FROM juicios ju
),
condiciones AS (   -- el modelo de la pareja con CLI-12 y la duración de la pasada, del registro por llamada
  SELECT pa.n,
         (SELECT string_agg(DISTINCT l->>'modelo', ', ')
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array'
                                           THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
           WHERE l->>'documentId' IN (SELECT id FROM cli12)) AS modelo,
         (SELECT max((q->>'comienzoMs')::bigint + (q->>'latenciaMs')::bigint)
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'llamadasAlModelo'->'peticiones') = 'array'
                                           THEN pa.analysis->'llamadasAlModelo'->'peticiones' ELSE '[]'::jsonb END) q) AS ms
  FROM pasadas pa
),
veredicto AS (
  SELECT pa.n, pa.created_at,
         EXISTS (SELECT 1 FROM d_publicada dp WHERE dp.n = pa.n AND NOT dp.a_caballo) AS d_limpia,
         EXISTS (SELECT 1 FROM d_publicada dp WHERE dp.n = pa.n AND dp.a_caballo) AS d_dudosa,
         EXISTS (SELECT 1 FROM d_publicada dp WHERE dp.n = pa.n AND dp.especie = 'norma_contra_norma') AS con_especie,
         coalesce((SELECT veces FROM d_puerta x WHERE x.n = pa.n), 0) AS en_puerta,
         EXISTS (SELECT 1 FROM sin_texto s WHERE s.n = pa.n) AS con_juicio,
         coalesce((SELECT bool_and(con_discarded) FROM sin_texto s WHERE s.n = pa.n), false) AS con_discarded,
         coalesce((SELECT sum(cascada + frontera + puerta_sin_detalle) FROM sin_texto s WHERE s.n = pa.n), 0) AS sin_texto,
         coalesce((SELECT sum(con_etiqueta) FROM sin_texto s WHERE s.n = pa.n), 0) AS sin_texto_con_etiqueta
  FROM pasadas pa
),
control (orden, medida, ok) AS (
  SELECT 1, 'ventana: ' || coalesce(to_char(p.desde AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' a ' ||
            coalesce(to_char(p.hasta AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI'), 'SIN RELLENAR') || ' (hora de Madrid)',
         p.desde IS NOT NULL AND p.hasta IS NOT NULL
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de NOR-10 en la ventana: ' || (SELECT count(*) FROM pasadas) || ' · esperado: ' || coalesce(p.esperado::text, 'SIN RELLENAR'),
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
  SELECT 5, 'la primera frase de 2.4 está dentro de 2.4: carácter ' || (SELECT ini FROM tramo_d) || ' a ' || (SELECT fin FROM tramo_d)
            || ' · el principio dentro de §3.1: carácter ' || (SELECT ini FROM tramo_p) || ' a ' || (SELECT fin FROM tramo_p),
         (SELECT ini FROM tramo_d) > 0 AND (SELECT ini FROM tramo_p) > 0
  UNION ALL
  -- sin el juicio de CLI-12, o sin «discarded» en él, el «sin texto» de esa pasada no es un cero: es un agujero
  SELECT 6, 'pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: '
            || (SELECT count(*) FROM veredicto WHERE NOT con_juicio OR NOT con_discarded),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM veredicto WHERE NOT con_juicio OR NOT con_discarded) = 0 END
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1, 0 AS o2
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, NULL, orden, 0
  FROM control
  UNION ALL
  -- 1 · por pasada: el veredicto y lo que no se ve
  SELECT '1 · por pasada', 'pasada ' || v.n || ' · ' || to_char(v.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS')
           || ' · ' || coalesce(c.modelo, 'modelo sin guardar') || ' · ' || coalesce(round(c.ms / 1000.0)::text || ' s', 'duración sin guardar'),
         CASE WHEN v.d_limpia THEN 'D' || CASE WHEN v.con_especie THEN ' (norma_contra_norma)' ELSE ' (sin especie)' END
              WHEN v.d_dudosa THEN 'D DUDOSA: la cita de NOR-10 sigue en la segunda frase de 2.4' || CASE WHEN v.con_especie THEN ' (norma_contra_norma)' ELSE ' (sin especie)' END
              WHEN v.en_puerta > 0 THEN 'no · D muerta en la puerta de citas (' || v.en_puerta || ')'
              ELSE 'no' END,
         'en la puerta, con texto: ' || v.en_puerta || ' · sin texto en la pareja: ' || v.sin_texto
           || ' (con la etiqueta, del verificador: ' || v.sin_texto_con_etiqueta || ')'
           || CASE WHEN NOT v.con_juicio THEN ' · ⚠️ SIN JUICIO DE CLI-12' WHEN NOT v.con_discarded THEN ' · ⚠️ SIN «discarded»: agujero' ELSE '' END,
         NULL, v.n, 0
  FROM veredicto v LEFT JOIN condiciones c ON c.n = v.n
  UNION ALL
  -- las citas de cada D, una fila por hallazgo
  SELECT '1 · por pasada', 'pasada ' || dp.n || ' · cita de D',
         coalesce(dp.especie, 'sin especie') || ' · CLI-12: ' || dp.lado_cli || CASE WHEN dp.a_caballo THEN ' · ⚠️ A CABALLO' ELSE '' END,
         'NOR-10: «' || coalesce(dp.cita_nor, '') || '»', 'CLI-12: «' || coalesce(dp.cita_cli, '') || '»', dp.n, row_number() OVER (PARTITION BY dp.n ORDER BY dp.cita_nor)
  FROM d_publicada dp
  UNION ALL
  -- 2 · EL TOTAL
  SELECT '2 · el total',
         'D en ' || (SELECT count(*) FROM veredicto WHERE d_limpia) || ' de ' || (SELECT count(*) FROM veredicto) || ' pasadas'
           || ' · con la etiqueta: ' || (SELECT count(*) FROM veredicto WHERE d_limpia AND con_especie)
           || ' · dudosas aparte: ' || (SELECT count(*) FROM veredicto WHERE d_dudosa AND NOT d_limpia),
         'muertas en la puerta, con texto: ' || (SELECT count(*) FROM veredicto WHERE en_puerta > 0 AND NOT d_limpia AND NOT d_dudosa) || ' pasadas',
         'sin texto en la pareja: ' || (SELECT coalesce(sum(sin_texto), 0) FROM veredicto) || ' hallazgos en '
           || (SELECT count(*) FROM veredicto WHERE sin_texto > 0) || ' pasadas, '
           || (SELECT coalesce(sum(sin_texto), 0) FROM veredicto WHERE NOT d_limpia AND NOT d_dudosa) || ' de ellos en pasadas SIN D'
           || ' (con la etiqueta: ' || (SELECT coalesce(sum(sin_texto_con_etiqueta), 0) FROM veredicto WHERE NOT d_limpia AND NOT d_dudosa) || ')',
         NULL, 0, 0
) x
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2;
