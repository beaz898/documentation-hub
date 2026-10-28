-- ============================================================================
-- SQL_34_03 · EL TECHO DE SALIDA DEL JUEZ Y LO QUE EMITIÓ DE VERDAD, POR PASADA Y POR PAREJA — SÓLO LECTURA (28/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- LA HIPÓTESIS QUE COMPRUEBA (arquitecto, 28/10): si la respuesta del juez llega a max_tokens, el JSON sale cortado,
-- el código lo repara recortando hasta la última llave (lib/llm/anthropic-client.ts:282-345) y el hallazgo a medias
-- desaparece sin rastro; ninguna ruta del análisis mira stop_reason. Si D va en la cola, la cola es lo que se corta.
-- La consulta no interpreta: enseña.
--
-- QUÉ SACA, POR PASADA (NOR-10 y NOR-11) Y POR PAREJA:
--   1 · EL TECHO. El modelo que corrió de verdad (lecturaDeLasParejas[].modelo, y el de cada llamada del registro),
--       los tokens de salida de cada llamada del juez de esa pareja (llamadasAlModelo.peticiones, etapa «juez»,
--       resultado «ok»), el max_tokens que tocaba y la distancia al techo. A GRITOS si una llamada llega al 95 % o más.
--       Al lado, en las parejas NOR-10 ↔ CLI-12, si se publicó D.
--       · EL TOPE SALE DEL DATO desde el 28/10/2026: cada petición guarda lo que viajó en el cuerpo
--         (peticiones[].parametros: maxTokens, temperatura y esfuerzo, o «sin_enviar»). En las filas de antes no está
--         guardado, y el tope se DEDUCE del modelo con las dos cifras del código: claude-haiku-4-5-20251001 → 4.096
--         (lib/analysis/modelo-del-juez.ts:31) y claude-haiku-5-5 → 16.000 (:56). La fila dice «del dato» o «deducido
--         del modelo», y «condiciones sin guardar» cuando no hay temperatura ni esfuerzo que leer. Con otro modelo y sin
--         dato, el tope sale DESCONOCIDO.
--       · lecturaDeLasParejas[].tokensDeSalida SUMA las dos vueltas cuando el JSON no se pudo leer a la primera
--         (lib/analysis/types.ts:287-290), así que la distancia al techo se mide por LLAMADA, no con esa suma.
--       · D se reconoce por su cita del lado de NOR-10: un tramo literal (normalizado, 20 caracteres o más) del
--         apartado 2.4 que toque su PRIMERA frase («…puede recaer en el propio Director Clínico…»). La segunda frase de
--         2.4 («El Coordinador de Calidad no sustituye al Director Clínico…») es del lado de A, y no cuenta como D.
--         Se cuenta en lo publicado y en los descartes de la puerta de citas; lo que descarta el verificador no deja
--         texto (lib/analysis/types.ts:59-61) y no se puede reconocer.
--   2 · LO QUE EMITIÓ EL JUEZ EN CONTRADICCIONES, no lo publicado, reconstruido desde cada juicio guardado
--       (judgments[]), para ver si llega al «Máximo 10 contradicciones» del prompt (lib/analysis/judge.ts:924):
--       · publicadas: judgments[].contradictions sin las del diff de tablas (origen «diff_tabular»);
--       · cascada: judgments[].discarded, las claves «descartado.<motivo>» de un solo nivel (sin el desglose por
--         especie, que repite la misma cuenta) y «r2.sin_ancla». Censo de esas claves, 28/10:
--         grep -rhoE "'descartado\.[a-z_]+'" lib/analysis --include=*.ts, más los motivos de finding-rules.ts;
--       · puerta de citas: judgments[].descartesPorCita con tipo «contradiccion»;
--       · frontera: «frontera.elemento_no_objeto» y «frontera.cita_ausente». («frontera.cita_solo_por_cabeza_y_cola»
--         NO es una caída: es un diagnóstico de la puerta, lib/analysis/diagnostico-de-cita.ts:73.)
--       · SIN ATRIBUIR, porque cuentan contradicciones y solapamientos juntos: «narracionEnCita», «citaDeContexto» y
--         «descartesPorCitaOmitidos».
--       Lo emitido queda entre la COTA (todo lo atribuido) y la cota más lo sin atribuir. ⚠️ El prompt pide «Máximo 10
--       contradicciones, 5 inconsistencias menores» en la MISMA lista, y la severidad que escribió el juez no se guarda
--       de los descartados: la comparación es con 10 sobre el total. Si «frontera.contradicciones_no_es_array» aparece,
--       la respuesta no traía la lista y no se puede decir nada.
--       Si un juicio guardado no lleva «discarded», la fila lo dice: es un agujero del medidor, no un cero.
--
-- LA VENTANA Y LOS ESPERADOS VAN EN NULO y se rellenan DESPUÉS DE MIRAR EL RELOJ DE LA BASE, nunca antes. Sin ventana,
-- el control 1 lo dice y no se lee ninguna pasada. Para leer las dos tandas del 3.4, una ejecución por tanda.
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
textos AS (
  -- NOR-10, apartado 2.4, literal del corpus de pruebas (trozo 4), normalizado como las citas; y su primera frase
  SELECT translate(lower(regexp_replace('Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p24,
         translate(lower('Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro.'), 'áéíóúü', 'aeiouu') AS frase_d
),
tramo_d AS (
  SELECT position(t.frase_d IN t.p24) AS ini, position(t.frase_d IN t.p24) + length(t.frase_d) - 1 AS fin FROM textos t
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis, ar.analysis_type,
         CASE WHEN ar.document_name ILIKE 'NOR-10%' THEN 'NOR-10' ELSE 'NOR-11' END AS doc,
         row_number() OVER (PARTITION BY CASE WHEN ar.document_name ILIKE 'NOR-10%' THEN 'NOR-10' ELSE 'NOR-11' END
                            ORDER BY ar.created_at, ar.id) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND (ar.document_name ILIKE 'NOR-10%' OR ar.document_name ILIKE 'NOR-11%')
    AND ar.created_at >= p.desde AND ar.created_at < p.hasta
),
nombres AS (SELECT d.id::text AS id, d.name FROM public.documents d, parametros p WHERE d.org_id = p.org),
lecturas AS (
  SELECT pa.doc, pa.n, l->>'documentId' AS pareja, l->>'modelo' AS modelo, (l->>'tokensDeSalida')::bigint AS suma_salida
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array'
                                               THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
),
llamadas AS (
  -- cada llamada del juez que respondió, con su modelo, su vuelta y sus tokens de salida
  SELECT pa.doc, pa.n, q->>'pareja' AS pareja, q->>'modelo' AS modelo, (q->>'vuelta')::int AS vuelta,
         (q->'tokens'->>'salida')::bigint AS salida, q->'parametros' AS parametros
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'llamadasAlModelo'->'peticiones') = 'array'
                                               THEN pa.analysis->'llamadasAlModelo'->'peticiones' ELSE '[]'::jsonb END) q
  WHERE q->>'etapa' = 'juez' AND q->>'resultado' = 'ok'
),
techo AS (
  SELECT ll.*, coalesce((ll.parametros->>'maxTokens')::int, de.tope) AS tope,
         CASE WHEN ll.parametros->>'maxTokens' IS NOT NULL THEN 'del dato' WHEN de.tope IS NOT NULL THEN 'deducido del modelo' END AS origen_tope
  FROM llamadas ll
  -- sólo para las filas de antes del 28/10, que no guardan el max_tokens enviado
  CROSS JOIN LATERAL (SELECT CASE ll.modelo WHEN 'claude-haiku-4-5-20251001' THEN 4096 WHEN 'claude-haiku-5-5' THEN 16000 END AS tope) de
),
publicadas_d AS (
  -- D publicada: cita del lado de NOR-10 que toca la primera frase de 2.4, en una pareja con CLI-12
  SELECT pa.doc, pa.n, d->>'existingDocumentId' AS pareja, d->>'conflictoNormativo' AS especie
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array'
                                               THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END) d
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(d->>'newDocSays', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) k
  CROSS JOIN textos t CROSS JOIN tramo_d tr
  WHERE pa.doc = 'NOR-10' AND length(k.normal) >= 20 AND position(k.normal IN t.p24) > 0
    AND position(k.normal IN t.p24) <= tr.fin AND position(k.normal IN t.p24) + length(k.normal) - 1 >= tr.ini
),
juicios AS (
  SELECT pa.doc, pa.n, j->>'documentId' AS pareja, j->>'documentName' AS candidato, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array'
                                               THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
),
puerta_d AS (
  -- D muerta en la puerta de citas: el mismo reconocimiento, sobre la cita del lado nuevo del descarte
  SELECT ju.doc, ju.n, ju.pareja
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array'
                                               THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) x
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(x->>'citaNuevo', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) k
  CROSS JOIN textos t CROSS JOIN tramo_d tr
  WHERE ju.doc = 'NOR-10' AND x->>'tipo' = 'contradiccion' AND length(k.normal) >= 20 AND position(k.normal IN t.p24) > 0
    AND position(k.normal IN t.p24) <= tr.fin AND position(k.normal IN t.p24) + length(k.normal) - 1 >= tr.ini
),
emitido AS (
  SELECT ju.doc, ju.n, ju.pareja, ju.candidato,
         -- coalesce: sin la clave, jsonb_typeof da NULL, y un NULL aquí haría pasar la fila por «no llega a 10»
         coalesce(jsonb_typeof(ju.j->'discarded') = 'object', false) AS con_discarded,
         (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE '[]'::jsonb END) c
           WHERE c->>'origen' IS DISTINCT FROM 'diff_tabular') AS publicadas,
         (SELECT coalesce(sum(v::bigint), 0) FROM jsonb_each_text(CASE WHEN jsonb_typeof(ju.j->'discarded') = 'object' THEN ju.j->'discarded' ELSE '{}'::jsonb END) e(k, v)
           WHERE k ~ '^descartado\.[a-z_]+$' OR k = 'r2.sin_ancla') AS cascada,
         (SELECT count(*) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) x
           WHERE x->>'tipo' = 'contradiccion') AS puerta,
         coalesce((ju.j->'discarded'->>'frontera.elemento_no_objeto')::bigint, 0) + coalesce((ju.j->'discarded'->>'frontera.cita_ausente')::bigint, 0) AS frontera,
         coalesce((ju.j->'discarded'->>'narracionEnCita')::bigint, 0) AS narracion,
         coalesce((ju.j->'discarded'->>'citaDeContexto')::bigint, 0) AS contexto,
         coalesce((ju.j->>'descartesPorCitaOmitidos')::bigint, 0) AS omitidos,
         coalesce((ju.j->'discarded'->>'frontera.contradicciones_no_es_array')::bigint, 0) AS sin_lista
  FROM juicios ju
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
  SELECT 4, 'pasadas que no son rápidas: ' || (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM pasadas WHERE analysis_type IS DISTINCT FROM 'quick') = 0 END
  UNION ALL
  -- sin registro por llamada, o con llamadas fuera del detalle, el techo no se puede medir llamada a llamada
  SELECT 5, 'pasadas sin registro por llamada o con llamadas fuera del detalle: ' ||
            (SELECT count(*) FROM pasadas WHERE jsonb_typeof(analysis->'llamadasAlModelo') IS DISTINCT FROM 'object'
                                            OR jsonb_typeof(analysis->'llamadasAlModelo'->'fueraDelDetalle') = 'object'),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM pasadas WHERE jsonb_typeof(analysis->'llamadasAlModelo') IS DISTINCT FROM 'object'
                                                 OR jsonb_typeof(analysis->'llamadasAlModelo'->'fueraDelDetalle') = 'object') = 0 END
  UNION ALL
  -- cada pareja leída tiene al menos una llamada del juez con respuesta: si no, su techo no se ve
  SELECT 6, 'parejas sin ninguna llamada del juez con respuesta: ' ||
            (SELECT count(*) FROM lecturas le WHERE NOT EXISTS (SELECT 1 FROM llamadas ll WHERE ll.doc = le.doc AND ll.n = le.n AND ll.pareja = le.pareja)) ||
            ' de ' || (SELECT count(*) FROM lecturas),
         CASE WHEN (SELECT count(*) FROM lecturas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM lecturas le WHERE NOT EXISTS (SELECT 1 FROM llamadas ll WHERE ll.doc = le.doc AND ll.n = le.n AND ll.pareja = le.pareja)) = 0 END
  UNION ALL
  -- la primera frase de 2.4 está dentro de 2.4: si no, el reconocimiento de D no mira nada
  SELECT 7, 'la frase de D está dentro de 2.4: carácter ' || (SELECT ini FROM tramo_d) || ' a ' || (SELECT fin FROM tramo_d),
         (SELECT ini FROM tramo_d) > 0
)
SELECT bloque, pasada, a, b, c, d
FROM (
  SELECT 'organización leída' AS bloque, NULL::text AS pasada, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d,
         -1 AS o1, ''::text AS o2, 0::bigint AS o3
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control', NULL, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END, medida, NULL, NULL, orden, '', 0
  FROM control
  UNION ALL
  -- 1 · EL TECHO: una fila por llamada del juez, con su pareja, su modelo, su salida y su tope
  SELECT '1 · el techo', te.doc || ' ' || te.n,
         coalesce(nm.name, te.pareja, '—') || ' · ' || coalesce(te.modelo, 'sin modelo') ||
           CASE WHEN le.modelo IS DISTINCT FROM te.modelo THEN ' (⚠️ la lectura dice ' || coalesce(le.modelo, 'sin modelo') || ')' ELSE '' END ||
           CASE WHEN te.parametros IS NULL THEN ' · condiciones sin guardar'
                ELSE ' · temperatura ' || coalesce(te.parametros->>'temperatura', '—') || ' · esfuerzo ' || coalesce(te.parametros->>'esfuerzo', '—') END,
         'vuelta ' || te.vuelta || ' · salida ' || te.salida || ' de ' || coalesce(te.tope::text || ' ' || te.origen_tope, 'TOPE DESCONOCIDO') ||
           CASE WHEN te.tope IS NULL THEN '' ELSE ' (' || round(100.0 * te.salida / te.tope, 1) || ' %, faltan ' || (te.tope - te.salida) || ')' END ||
           ' · suma de la lectura: ' || coalesce(le.suma_salida::text, '—'),
         CASE WHEN te.tope IS NULL THEN 'TOPE DESCONOCIDO para este modelo'
              WHEN te.salida >= 0.95 * te.tope THEN '⚠️⚠️ AL 95 % O MÁS DEL TOPE'
              ELSE 'por debajo del 95 %' END,
         CASE WHEN te.doc <> 'NOR-10' OR coalesce(nm.name, '') NOT ILIKE 'CLI-12%' THEN 'D: no aplica'
              WHEN EXISTS (SELECT 1 FROM publicadas_d pd WHERE pd.doc = te.doc AND pd.n = te.n AND pd.pareja = te.pareja)
                THEN 'D PUBLICADA (' || (SELECT string_agg(coalesce(pd.especie, 'sin especie'), ', ') FROM publicadas_d pd WHERE pd.doc = te.doc AND pd.n = te.n AND pd.pareja = te.pareja) || ')'
              WHEN EXISTS (SELECT 1 FROM puerta_d pu WHERE pu.doc = te.doc AND pu.n = te.n AND pu.pareja = te.pareja)
                THEN 'D no publicada: muerta en la puerta de citas'
              ELSE 'D no publicada' END,
         CASE WHEN te.doc = 'NOR-10' THEN 100 ELSE 200 END + te.n, coalesce(nm.name, te.pareja, ''), te.vuelta
  FROM techo te
  LEFT JOIN nombres nm ON nm.id = te.pareja
  LEFT JOIN lecturas le ON le.doc = te.doc AND le.n = te.n AND le.pareja = te.pareja
  UNION ALL
  -- 2 · LO EMITIDO en contradicciones, por pasada y pareja, frente al «Máximo 10» del prompt
  SELECT '2 · lo emitido', em.doc || ' ' || em.n,
         coalesce(em.candidato, nm.name, em.pareja, '—') || CASE WHEN em.con_discarded THEN '' ELSE ' · ⚠️ SIN «discarded» GUARDADO: agujero del medidor' END,
         'publicadas ' || em.publicadas || ' · cascada ' || em.cascada || ' · puerta ' || em.puerta || ' · frontera ' || em.frontera ||
           ' · sin atribuir ' || (em.narracion + em.contexto + em.omitidos) ||
           ' (narración ' || em.narracion || ', contexto ' || em.contexto || ', omitidos ' || em.omitidos || ')',
         CASE WHEN em.sin_lista > 0 THEN 'emitidas: NO SE PUEDE DECIR (la respuesta no traía la lista)'
              WHEN em.narracion + em.contexto + em.omitidos = 0
                THEN 'emitidas: ' || (em.publicadas + em.cascada + em.puerta + em.frontera)
              ELSE 'emitidas: entre ' || (em.publicadas + em.cascada + em.puerta + em.frontera) || ' y ' ||
                   (em.publicadas + em.cascada + em.puerta + em.frontera + em.narracion + em.contexto + em.omitidos) END,
         CASE WHEN em.sin_lista > 0 OR NOT em.con_discarded THEN 'el tope de 10: NO SE PUEDE DECIR'
              WHEN em.publicadas + em.cascada + em.puerta + em.frontera >= 10 THEN '⚠️⚠️ LLEGA A 10 O MÁS'
              WHEN em.publicadas + em.cascada + em.puerta + em.frontera + em.narracion + em.contexto + em.omitidos < 10 THEN 'no llega a 10'
              ELSE 'el tope de 10: NO SE PUEDE DECIR (depende de lo sin atribuir)' END,
         CASE WHEN em.doc = 'NOR-10' THEN 100 ELSE 200 END + em.n, coalesce(em.candidato, nm.name, em.pareja, ''), 0
  FROM emitido em
  LEFT JOIN nombres nm ON nm.id = em.pareja
) t
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2, o3;
