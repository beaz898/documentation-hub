-- ============================================================================
-- SQL_34_06 · A, B, C, D Y EL QUINTO CONFLICTO, POR PASADA, CONTADOS POR LA CONSULTA — SÓLO LECTURA (31/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- PARA QUÉ (arquitecto, 31/10): la línea base POR HALLAZGO, gratis, sobre las pasadas que ya están en la base. Las 21
-- pasadas de la línea base de D (30-31/10) publicaron todo lo que encontraron, y SQL_34_05 sólo contó D porque sólo
-- buscaba D. Ésta cuenta los cinco casos con la misma regla:
--   · NOR-10 ↔ CLI-12: A, B y C (sembrados, corpus-pruebas/SIEMBRA_corpus_ampliado.md §1) y D (no sembrada, ibíd.);
--   · NOR-11 ↔ CLI-12: el quinto conflicto, NO sembrado (NOR-11 §10.5 frente a CLI-12 §6.2).
-- Es una consulta NUEVA y no una edición de SQL_34_05, que está ejecutada y cuyas salidas están archivadas: lo ejecutado
-- se queda como se ejecutó. PARA D USA LA MISMA REGLA que SQL_34_05, y sobre los mismos datos tiene que dar lo mismo
-- (su arnés lo comprueba corriendo las dos): es su CONTROL POSITIVO, y en la base, sobre las mismas ventanas, D tiene que
-- salir 2 de 7 (28/10) y 3 de 21 (30-31/10). ⚠️ UN BORDE en que difieren, y no se dio en la base (las dos ventanas dan
-- «dudosas aparte: 0»): si en una pasada hay a la vez una D limpia y una dudosa CON la etiqueta, SQL_34_05 contaba esa
-- etiqueta y ésta no, porque una cita dudosa no decide nada.
--
-- LA REGLA, MECÁNICA, la de D extendida: en una pasada hay un caso si se PUBLICÓ una contradicción con CLI-12 cuya cita
-- del lado del documento analizado toca la FRASE DEL CASO dentro de su párrafo. Las frases, del texto troceado con el
-- código de la indexación (control: 67 trozos en NOR-10 y 55 en CLI-12, como en la base, y D, el principio y §3.5 en los
-- trozos medidos contra Pinecone):
--   · A: NOR-10 §2.1, trozo 2, «El responsable último del cumplimiento…»; y la SEGUNDA frase de §2.4, trozo 4, «El
--        Coordinador de Calidad no sustituye…», con la que el juez cita A muchas veces.
--   · B: NOR-10 §10.2, trozo 36, «El control biológico del autoclave se realiza semanalmente…».
--   · C: NOR-10 §13.4, trozo 58, «El instrumental esterilizado y envasado… 6 meses…».
--   · D: NOR-10 §2.4, trozo 4, su PRIMERA frase, el permiso.
--   · el quinto: NOR-11 §10.5, trozo 13, «El Coordinador de Calidad de cada clínica revisa trimestralmente…».
-- Una cita que toque la frase de DOS casos (en 2.4 conviven A y D) va como DUDOSA en los dos y no cuenta en ninguno: es
-- la «a caballo» de SQL_34_05, generalizada. Del lado de CLI-12 se dice qué citó: el principio de §3.1, §3.5, otra parte
-- de §3.1, o fuera de los dos.
--
-- ⚠️ LO QUE NO SE PUEDE RECONOCER: la puerta de citas guarda cada descarte con su texto, y se reconoce por caso. Lo que
-- muere SIN texto (verificador, cascada, frontera, puerta sin detalle) se guarda por PAREJA y por motivo, NO por caso: la
-- cota sale UNA vez por pasada, y en cualquier caso que falte en esa pasada pudo morir ahí, como mucho, ese número.
--
-- QUÉ SACA, con el DOCUMENTO elegido ('NOR-10' para A, B, C y D; 'NOR-11' para el quinto):
--   0 · controles: la ventana; las pasadas frente a las esperadas; que sean rápidas; un solo CLI-12; que el documento sea
--       uno de los dos y cada frase esté dentro de su párrafo; y el agujero de un juicio sin «discarded».
--   1 · por pasada: hora, modelo y duración; el estado de cada caso; las citas de cada caso encontrado; lo muerto sin texto.
--   2 · el total: cada caso en X de N pasadas, con la etiqueta, dudosas y muertas en la puerta; y la cota sin texto.
-- DOS PULSACIONES, COMO SQL_34_05: sin «desde» ni «hasta», LISTA las pasadas rápidas del documento (hora y duración); con la
-- ventana, mide. El control positivo y la medida los ejecuta el director: Code no ejecuta consultas.
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
         'NOR-10'::text AS documento,            -- ← DOCUMENTO: 'NOR-10' (A, B, C y D) o 'NOR-11' (el quinto)
         NULL::timestamptz AS desde,             -- ← DESDE: el comienzo real de la tanda
         NULL::timestamptz AS hasta,             -- ← HASTA: el final real de la tanda
         NULL::int AS esperado                   -- ← ESPERADO: pasadas del documento, DESPUÉS de mirar el reloj de la base
),
textos AS (
  -- CLI-12 · §3.5, §3.1 y la frase del principio, copiados de SQL_34_05 (y éste de SQL_34_02), normalizados como las citas
  SELECT translate(lower(regexp_replace('En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p35,
         translate(lower(regexp_replace('El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico. Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización. El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico. El Director Clínico es informado de estas decisiones pero no interviene en ellas como autoridad jerárquica.', '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p31,
         translate(lower('Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización.'), 'áéíóúü', 'aeiouu') AS principio
),
tramo_p AS (   -- dónde cae la frase del principio dentro de §3.1 normalizado
  SELECT position(t.principio IN t.p31) AS ini, position(t.principio IN t.p31) + length(t.principio) - 1 AS fin FROM textos t
),
casos_todos AS (
  -- cada caso: su documento, su orden, su párrafo y su frase, del texto troceado (herramienta de un solo uso, 31/10)
  SELECT v.doc, v.caso, v.orden, k.p, position(f.f IN k.p) AS ini, position(f.f IN k.p) + length(f.f) - 1 AS fin
  FROM (VALUES
    ('NOR-10', 'A', 1, 'El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente. Es el Director Clínico quien debe asegurar que existen los recursos materiales y humanos necesarios para ejecutar cada etapa del ciclo de esterilización conforme a lo aquí descrito, quien autoriza cualquier excepción documentada al procedimiento y quien responde ante Dirección de Operaciones en caso de incidencia grave relacionada con la esterilización del instrumental.', 'El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.'),
    ('NOR-10', 'A', 1, 'Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.', 'El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.'),
    ('NOR-10', 'B', 2, 'El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora, mediante indicador biológico con esporas de Geobacillus stearothermophilus introducido en el punto de peor penetración de vapor de la cámara (habitualmente el centro geométrico de la carga más densa del día). El indicador se incuba durante el tiempo indicado por el fabricante del lector biológico y el resultado se registra en RG-11 antes de dar por válidas las cargas procesadas ese día.', 'El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora, mediante indicador biológico con esporas de Geobacillus stearothermophilus introducido en el punto de peor penetración de vapor de la cámara (habitualmente el centro geométrico de la carga más densa del día).'),
    ('NOR-10', 'C', 3, 'El instrumental esterilizado y envasado en bolsa mixta papel-plástico mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta, transcurridos los cuales el paquete debe reesterilizarse aunque el envase permanezca íntegro y no se haya abierto en ningún momento. Este límite se debe al deterioro progresivo de la barrera de papel frente a la humedad ambiental incluso en condiciones correctas de almacenaje, no a una pérdida instantánea de esterilidad al día siguiente del plazo.', 'El instrumental esterilizado y envasado en bolsa mixta papel-plástico mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta, transcurridos los cuales el paquete debe reesterilizarse aunque el envase permanezca íntegro y no se haya abierto en ningún momento.'),
    ('NOR-10', 'D', 4, 'Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.', 'Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro.'),
    ('NOR-11', 'quinto', 1, 'El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes, incorporando los hallazgos relevantes a la siguiente sesión de formación anual del personal.', 'El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes, incorporando los hallazgos relevantes a la siguiente sesión de formación anual del personal.')
  ) v(doc, caso, orden, parrafo, frase)
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(v.parrafo, '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS p) k
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(v.frase, '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS f) f
),
casos AS (
  SELECT c.* FROM casos_todos c, parametros p WHERE c.doc = p.documento
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
publicadas AS (   -- las contradicciones publicadas con CLI-12, numeradas, con sus dos citas normalizadas
  SELECT pa.n, d.i, d.x->>'conflictoNormativo' AS especie, d.x->>'newDocSays' AS cita_nor, d.x->>'existingDocSays' AS cita_cli,
         kn.normal AS nn, kc.normal AS nc
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array'
                                               THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END) WITH ORDINALITY d(x, i)
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(d.x->>'newDocSays', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) kn
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(d.x->>'existingDocSays', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) kc
  WHERE d.x->>'existingDocumentId' IN (SELECT id FROM cli12)
),
toques AS (   -- cada hallazgo publicado, con cada caso cuya frase toca su cita del lado del documento analizado
  SELECT DISTINCT pu.n, pu.i, c.caso, c.orden
  FROM publicadas pu JOIN casos c
    ON length(pu.nn) >= 20 AND position(pu.nn IN c.p) > 0
   AND position(pu.nn IN c.p) <= c.fin AND position(pu.nn IN c.p) + length(pu.nn) - 1 >= c.ini
),
encontrados AS (   -- el hallazgo, su caso, y si es DUDOSO porque toca la frase de más de un caso
  SELECT t.n, t.i, t.caso, t.orden, pu.especie, pu.cita_nor, pu.cita_cli,
         (SELECT count(DISTINCT t2.caso) FROM toques t2 WHERE t2.n = t.n AND t2.i = t.i) > 1 AS dudoso,
         CASE WHEN length(pu.nc) >= 20 AND position(pu.nc IN tx.p31) > 0
                   AND position(pu.nc IN tx.p31) <= tp.fin AND position(pu.nc IN tx.p31) + length(pu.nc) - 1 >= tp.ini THEN 'el principio de §3.1'
              WHEN length(pu.nc) >= 20 AND position(pu.nc IN tx.p35) > 0 THEN '§3.5'
              WHEN length(pu.nc) >= 20 AND position(pu.nc IN tx.p31) > 0 THEN '§3.1, fuera del principio'
              ELSE 'fuera de §3.1 y §3.5' END AS lado_cli
  FROM toques t JOIN publicadas pu ON pu.n = t.n AND pu.i = t.i
  CROSS JOIN textos tx CROSS JOIN tramo_p tp
),
juicios AS (   -- el juicio de la pareja con CLI-12 de cada pasada
  SELECT pa.n, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array'
                                               THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
  WHERE j->>'documentId' IN (SELECT id FROM cli12)
),
en_puerta AS (   -- lo muerto en la puerta de citas, por caso: el mismo reconocimiento, sobre la cita del lado nuevo
  SELECT ju.n, c.caso, count(*) AS veces
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array'
                                               THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) x
  CROSS JOIN LATERAL (SELECT translate(lower(regexp_replace(coalesce(x->>'citaNuevo', ''), '\s+', ' ', 'g')), 'áéíóúü', 'aeiouu') AS normal) k
  JOIN casos c ON length(k.normal) >= 20 AND position(k.normal IN c.p) > 0
              AND position(k.normal IN c.p) <= c.fin AND position(k.normal IN c.p) + length(k.normal) - 1 >= c.ini
  WHERE x->>'tipo' = 'contradiccion'
  GROUP BY ju.n, c.caso
),
sin_texto AS (   -- lo que murió en la pareja sin dejar texto: la cota, POR PAREJA, no por caso
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
por_caso AS (   -- el estado de cada caso en cada pasada
  SELECT pa.n, c.caso, c.orden,
         EXISTS (SELECT 1 FROM encontrados e WHERE e.n = pa.n AND e.caso = c.caso AND NOT e.dudoso) AS limpio,
         EXISTS (SELECT 1 FROM encontrados e WHERE e.n = pa.n AND e.caso = c.caso AND e.dudoso) AS dudoso,
         EXISTS (SELECT 1 FROM encontrados e WHERE e.n = pa.n AND e.caso = c.caso AND NOT e.dudoso AND e.especie = 'norma_contra_norma') AS con_especie,
         coalesce((SELECT veces FROM en_puerta x WHERE x.n = pa.n AND x.caso = c.caso), 0) AS puerta
  FROM pasadas pa CROSS JOIN (SELECT DISTINCT caso, orden FROM casos) c
),
veredicto AS (   -- por pasada: lo que no depende del caso
  SELECT pa.n, pa.created_at,
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
  -- el documento tiene casos, y la frase de cada uno está dentro de su párrafo: si no, ese caso no mira nada
  SELECT 5, 'casos de ' || p.documento || ': ' || coalesce((SELECT string_agg(DISTINCT caso, ', ') FROM casos), 'NINGUNO')
            || ' · frases dentro de su párrafo: ' || (SELECT count(*) FROM casos WHERE ini > 0) || ' de ' || (SELECT count(*) FROM casos),
         (SELECT count(*) FROM casos) > 0 AND (SELECT count(*) FROM casos WHERE ini <= 0) = 0
  FROM parametros p
  UNION ALL
  -- sin el juicio de CLI-12, o sin «discarded» en él, el «sin texto» de esa pasada no es un cero: es un agujero
  SELECT 6, 'pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: '
            || (SELECT count(*) FROM veredicto WHERE NOT con_juicio OR NOT con_discarded),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM veredicto WHERE NOT con_juicio OR NOT con_discarded) = 0 END
),
modo AS (   -- con «desde» y «hasta» vacíos, la consulta LISTA en vez de medir
  SELECT (p.desde IS NULL AND p.hasta IS NULL) AS sin_ventana FROM parametros p
),
listado AS (   -- SIN VENTANA: todas las pasadas rápidas del documento en la organización
  SELECT ar.created_at,
         (SELECT max((q->>'comienzoMs')::bigint + (q->>'latenciaMs')::bigint)
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(ar.analysis->'llamadasAlModelo'->'peticiones') = 'array'
                                           THEN ar.analysis->'llamadasAlModelo'->'peticiones' ELSE '[]'::jsonb END) q) AS ms,
         row_number() OVER (ORDER BY ar.created_at, ar.id) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name LIKE p.documento || '%' AND ar.analysis_type = 'quick'
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1, 0 AS o2
  FROM organizacion_leida
  UNION ALL
  -- SIN VENTANA: sólo la lista, con su fecha y hora y su duración
  SELECT '0 · sin ventana: las pasadas rápidas de ' || (SELECT documento FROM parametros),
         'pasada ' || l.n || ' · ' || to_char(l.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI:SS') || ' (hora de Madrid)',
         coalesce(round(l.ms / 1000.0)::text || ' s', 'duración sin guardar'), NULL, NULL, l.n, 0
  FROM listado l, modo m WHERE m.sin_ventana
  UNION ALL
  SELECT '0 · control', medida, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE '⚠️⚠️ FALLA' END, NULL, NULL, orden, 0
  FROM control WHERE NOT (SELECT sin_ventana FROM modo)
  UNION ALL
  -- 1 · por pasada: el estado de cada caso y lo que no se ve
  SELECT '1 · por pasada', 'pasada ' || v.n || ' · ' || to_char(v.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS')
           || ' · ' || coalesce(c.modelo, 'modelo sin guardar') || ' · ' || coalesce(round(c.ms / 1000.0)::text || ' s', 'duración sin guardar'),
         (SELECT string_agg(pc.caso || ': ' ||
                   CASE WHEN pc.limpio THEN 'sí' || CASE WHEN pc.con_especie THEN ' (norma_contra_norma)' ELSE ' (sin especie)' END
                        WHEN pc.dudoso THEN 'DUDOSA'
                        WHEN pc.puerta > 0 THEN 'muerta en la puerta'
                        ELSE 'no' END, ' · ' ORDER BY pc.orden)
            FROM por_caso pc WHERE pc.n = v.n),
         'sin texto en la pareja: ' || v.sin_texto || ' (con la etiqueta, del verificador: ' || v.sin_texto_con_etiqueta || ')'
           || CASE WHEN NOT v.con_juicio THEN ' · ⚠️ SIN JUICIO DE CLI-12' WHEN NOT v.con_discarded THEN ' · ⚠️ SIN «discarded»: agujero' ELSE '' END,
         NULL, v.n, 0
  FROM veredicto v LEFT JOIN condiciones c ON c.n = v.n
  WHERE NOT (SELECT sin_ventana FROM modo)
  UNION ALL
  -- las citas de cada caso encontrado, una fila por hallazgo
  SELECT '1 · por pasada', 'pasada ' || e.n || ' · cita de ' || e.caso,
         coalesce(e.especie, 'sin especie') || ' · CLI-12: ' || e.lado_cli || CASE WHEN e.dudoso THEN ' · ⚠️ DUDOSA: toca la frase de otro caso' ELSE '' END,
         'cita del documento: «' || coalesce(e.cita_nor, '') || '»', 'CLI-12: «' || coalesce(e.cita_cli, '') || '»',
         e.n, row_number() OVER (PARTITION BY e.n ORDER BY e.orden, e.i)
  FROM encontrados e
  WHERE NOT (SELECT sin_ventana FROM modo)
  UNION ALL
  -- 2 · EL TOTAL, por caso
  SELECT '2 · el total',
         x.caso || ' en ' || count(*) FILTER (WHERE x.limpio) || ' de ' || count(*) || ' pasadas'
           || ' · con la etiqueta: ' || count(*) FILTER (WHERE x.limpio AND x.con_especie)
           || ' · dudosas aparte: ' || count(*) FILTER (WHERE x.dudoso AND NOT x.limpio),
         'muertas en la puerta, con texto: ' || count(*) FILTER (WHERE x.puerta > 0 AND NOT x.limpio AND NOT x.dudoso) || ' pasadas',
         NULL, NULL, x.orden, 0
  FROM por_caso x
  WHERE NOT (SELECT sin_ventana FROM modo)
  GROUP BY x.caso, x.orden
  UNION ALL
  -- y la cota sin texto, UNA vez: es de la pareja y no se reparte por caso
  SELECT '2 · el total',
         'sin texto en la pareja, que no se reparte por caso: ' || (SELECT coalesce(sum(sin_texto), 0) FROM veredicto) || ' hallazgos en '
           || (SELECT count(*) FROM veredicto WHERE sin_texto > 0) || ' pasadas (con la etiqueta, del verificador: '
           || (SELECT coalesce(sum(sin_texto_con_etiqueta), 0) FROM veredicto) || ')',
         NULL, NULL, NULL, 99, 0
  FROM modo WHERE NOT modo.sin_ventana
) z
ORDER BY (bloque <> 'organización leída'), bloque, o1, o2;
