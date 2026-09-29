-- ============================================================================
-- F-118 / B.273 · LAS PAREJAS QUE EL CENSO NO PUDO MEDIR — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (29/09/2026). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA: por qué no se midieron (28 de 106 el 28/09) y, donde la base lo
-- permite, cuánto miden. El presupuesto de 10.000 tokens de B.273 NO se fija
-- hasta ver esto: cualquiera de ellas podría pasar de la mayor medida (7.758).
--
-- MISMA POBLACIÓN Y MISMA REGLA DE «SIN MEDIR» QUE `SQL_F118_tamanos_por_pareja.sql`
-- (organización a9625e93, análisis rápidos con jsonb, una pareja por elemento de
-- `analysis->'judgments'`). Si el resumen no dice 106 parejas y 28 sin medir, es
-- que hay análisis nuevos desde el 28/09: se lee igual.
--
-- LAS CAUSAS, sacadas de cómo el censo buscaba el tamaño (no hay otras):
--   Analizado —
--     · id_sin_documento: el análisis tiene `document_id` y ya no hay documento con
--       ese id. `analysis_results.document_id` NO es clave ajena
--       (supabase-analysis-status.sql:30), así que el id se queda al borrar, y el
--       censo sólo buscaba por NOMBRE cuando el id era nulo.
--     · sin_id_ni_nombre: sin `document_id` (análisis del chat antes de indexar,
--       F-101) y sin documento con ese nombre.
--     · sin_full_text: el documento está, pero `full_text` es nulo.
--   Candidato —
--     · judgment_sin_id: el elemento de `judgments` no trae `documentId`.
--     · id_sin_documento: ya no hay documento con ese id (borrado).
--     · sin_full_text: el documento está, pero `full_text` es nulo.
--
-- LAS ESTIMACIONES, cada una con su fuente, en este orden de preferencia:
--   · texto_del_juez (sólo el analizado): `analysis->'textoAnalizado'->>'caracteres'`,
--     los caracteres que armó el juez. EXACTO, pero sólo existe en análisis del
--     27/09 por la noche en adelante (`695018f5`).
--   · por_nombre_version_actual: un documento de la organización con el MISMO
--     nombre, su `full_text` de hoy. Misma aproximación que ya hacía el censo («el
--     texto ACTUAL, no el del día del análisis»), y además puede no ser el mismo
--     documento: por eso se dice en la columna.
--   · desde_trozos: la suma del texto de los trozos de su generación activa
--     (`document_chunks`, supabase-f20-chunks-estructurados.sql:22). Cota por
--     ARRIBA del `full_text`: las filas de tabla se guardan con su hoja y sus
--     columnas, hay `table_summary`, y un solape de 200 dentro de las
--     subdivisiones por longitud (lib/chunking.ts:26-29).
--   · no_se_puede_saber: nada de lo anterior. Un documento borrado se lleva sus
--     trozos (ON DELETE CASCADE) y `document_tombstones` no guarda tamaño
--     (supabase-tombstones.sql:19-28). Pinecone no se lee desde SQL.
--   ⚠️ Tokens ≈ caracteres / 4, como en el censo. No se tokeniza.
--
-- DOS CONSULTAS. Si el editor sólo enseña el resultado de la última, se
-- selecciona cada una y se ejecuta por separado.
-- ============================================================================

-- 1 · Una fila por pareja SIN MEDIR: causa, estimación y fuente de cada lado.
WITH rapidos AS (
  SELECT ar.id, ar.created_at, ar.document_id, ar.document_name, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
    AND ar.analysis_type = 'quick'
    AND ar.analysis IS NOT NULL
),
parejas AS (
  SELECT r.id AS analisis_id, r.created_at AS creado, r.document_id, r.document_name AS analizado,
         (r.analysis->'textoAnalizado'->>'caracteres')::int AS texto_del_juez_car,
         -- El documento que el censo usaba: con id, el de ese id; sin id, el del nombre.
         CASE WHEN r.document_id IS NOT NULL THEN d_id.id ELSE d_nom.id END                  AS a_doc,
         CASE WHEN r.document_id IS NOT NULL THEN d_id.full_text ELSE d_nom.full_text END    AS a_texto,
         CASE WHEN r.document_id IS NOT NULL THEN d_id.active_generation ELSE d_nom.active_generation END AS a_gen,
         d_nom.full_text AS a_nom_texto,
         j->>'documentName' AS candidato, j->>'documentId' AS c_ref,
         c.id AS c_doc, c.full_text AS c_texto, c.active_generation AS c_gen,
         c_nom.full_text AS c_nom_texto
  FROM rapidos r
  LEFT JOIN public.documents d_id
         ON d_id.id = r.document_id AND d_id.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
  -- Por nombre SIEMPRE (el censo sólo lo miraba con el id nulo): es una vía de estimación.
  LEFT JOIN LATERAL (
    SELECT d.id, d.full_text, d.active_generation FROM public.documents d
    WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf' AND d.name = r.document_name
    ORDER BY d.created_at DESC LIMIT 1
  ) d_nom ON true
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(r.analysis->'judgments', '[]'::jsonb)) AS j
  LEFT JOIN public.documents c
         ON c.id::text = j->>'documentId' AND c.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
  LEFT JOIN LATERAL (
    SELECT d.full_text FROM public.documents d
    WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf' AND d.name = j->>'documentName'
    ORDER BY d.created_at DESC LIMIT 1
  ) c_nom ON true
),
clasificadas AS (
  SELECT p.*,
         CASE WHEN p.a_doc IS NULL AND p.document_id IS NOT NULL THEN 'id_sin_documento'
              WHEN p.a_doc IS NULL THEN 'sin_id_ni_nombre'
              WHEN p.a_texto IS NULL THEN 'sin_full_text'
              ELSE 'medido' END AS causa_analizado,
         CASE WHEN p.c_ref IS NULL THEN 'judgment_sin_id'
              WHEN p.c_doc IS NULL THEN 'id_sin_documento'
              WHEN p.c_texto IS NULL THEN 'sin_full_text'
              ELSE 'medido' END AS causa_candidato,
         (SELECT sum(char_length(ch.text)) FROM public.document_chunks ch
           WHERE ch.document_id = p.a_doc AND ch.generation = p.a_gen) AS a_trozos_car,
         (SELECT sum(char_length(ch.text)) FROM public.document_chunks ch
           WHERE ch.document_id = p.c_doc AND ch.generation = p.c_gen) AS c_trozos_car
  FROM parejas p
),
estimadas AS (
  SELECT k.*,
         CASE WHEN k.causa_analizado = 'medido' THEN 'medido'
              WHEN k.texto_del_juez_car IS NOT NULL THEN 'texto_del_juez'
              WHEN k.causa_analizado = 'id_sin_documento' AND k.a_nom_texto IS NOT NULL THEN 'por_nombre_version_actual'
              WHEN k.causa_analizado = 'sin_full_text' AND k.a_trozos_car IS NOT NULL THEN 'desde_trozos'
              ELSE 'no_se_puede_saber' END AS fuente_analizado,
         CASE WHEN k.causa_analizado = 'medido' THEN char_length(k.a_texto)
              WHEN k.texto_del_juez_car IS NOT NULL THEN k.texto_del_juez_car
              WHEN k.causa_analizado = 'id_sin_documento' AND k.a_nom_texto IS NOT NULL THEN char_length(k.a_nom_texto)
              WHEN k.causa_analizado = 'sin_full_text' AND k.a_trozos_car IS NOT NULL THEN k.a_trozos_car
         END AS analizado_car,
         CASE WHEN k.causa_candidato = 'medido' THEN 'medido'
              WHEN k.causa_candidato IN ('judgment_sin_id', 'id_sin_documento') AND k.c_nom_texto IS NOT NULL THEN 'por_nombre_version_actual'
              WHEN k.causa_candidato = 'sin_full_text' AND k.c_trozos_car IS NOT NULL THEN 'desde_trozos'
              ELSE 'no_se_puede_saber' END AS fuente_candidato,
         CASE WHEN k.causa_candidato = 'medido' THEN char_length(k.c_texto)
              WHEN k.causa_candidato IN ('judgment_sin_id', 'id_sin_documento') AND k.c_nom_texto IS NOT NULL THEN char_length(k.c_nom_texto)
              WHEN k.causa_candidato = 'sin_full_text' AND k.c_trozos_car IS NOT NULL THEN k.c_trozos_car
         END AS candidato_car
  FROM clasificadas k
  WHERE k.causa_analizado <> 'medido' OR k.causa_candidato <> 'medido'
)
SELECT analisis_id, creado, analizado, causa_analizado, fuente_analizado, analizado_car,
       candidato, causa_candidato, fuente_candidato, candidato_car,
       ceil((analizado_car + candidato_car) / 4.0)::int AS suma_tokens_estimada
FROM estimadas
ORDER BY suma_tokens_estimada DESC NULLS FIRST, creado;

-- 2 · El resumen: cuántas por causa, cuántas se pueden estimar, y si alguna rompe
--     el 7.758 o el 10.000. Repite las CTE (Supabase no las comparte entre sentencias).
WITH rapidos AS (
  SELECT ar.id, ar.document_id, ar.document_name, ar.analysis
  FROM public.analysis_results ar
  WHERE ar.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
    AND ar.analysis_type = 'quick' AND ar.analysis IS NOT NULL
),
parejas AS (
  SELECT r.document_id,
         (r.analysis->'textoAnalizado'->>'caracteres')::int AS texto_del_juez_car,
         CASE WHEN r.document_id IS NOT NULL THEN d_id.id ELSE d_nom.id END                  AS a_doc,
         CASE WHEN r.document_id IS NOT NULL THEN d_id.full_text ELSE d_nom.full_text END    AS a_texto,
         CASE WHEN r.document_id IS NOT NULL THEN d_id.active_generation ELSE d_nom.active_generation END AS a_gen,
         d_nom.full_text AS a_nom_texto,
         j->>'documentId' AS c_ref, c.id AS c_doc, c.full_text AS c_texto, c.active_generation AS c_gen,
         c_nom.full_text AS c_nom_texto
  FROM rapidos r
  LEFT JOIN public.documents d_id
         ON d_id.id = r.document_id AND d_id.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
  LEFT JOIN LATERAL (
    SELECT d.id, d.full_text, d.active_generation FROM public.documents d
    WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf' AND d.name = r.document_name
    ORDER BY d.created_at DESC LIMIT 1
  ) d_nom ON true
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(r.analysis->'judgments', '[]'::jsonb)) AS j
  LEFT JOIN public.documents c
         ON c.id::text = j->>'documentId' AND c.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
  LEFT JOIN LATERAL (
    SELECT d.full_text FROM public.documents d
    WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf' AND d.name = j->>'documentName'
    ORDER BY d.created_at DESC LIMIT 1
  ) c_nom ON true
),
clasificadas AS (
  SELECT p.*,
         CASE WHEN p.a_doc IS NULL AND p.document_id IS NOT NULL THEN 'id_sin_documento'
              WHEN p.a_doc IS NULL THEN 'sin_id_ni_nombre'
              WHEN p.a_texto IS NULL THEN 'sin_full_text'
              ELSE 'medido' END AS causa_analizado,
         CASE WHEN p.c_ref IS NULL THEN 'judgment_sin_id'
              WHEN p.c_doc IS NULL THEN 'id_sin_documento'
              WHEN p.c_texto IS NULL THEN 'sin_full_text'
              ELSE 'medido' END AS causa_candidato,
         (SELECT sum(char_length(ch.text)) FROM public.document_chunks ch
           WHERE ch.document_id = p.a_doc AND ch.generation = p.a_gen) AS a_trozos_car,
         (SELECT sum(char_length(ch.text)) FROM public.document_chunks ch
           WHERE ch.document_id = p.c_doc AND ch.generation = p.c_gen) AS c_trozos_car
  FROM parejas p
),
estimadas AS (
  SELECT k.causa_analizado, k.causa_candidato,
         CASE WHEN k.causa_analizado = 'medido' THEN char_length(k.a_texto)
              WHEN k.texto_del_juez_car IS NOT NULL THEN k.texto_del_juez_car
              WHEN k.causa_analizado = 'id_sin_documento' AND k.a_nom_texto IS NOT NULL THEN char_length(k.a_nom_texto)
              WHEN k.causa_analizado = 'sin_full_text' AND k.a_trozos_car IS NOT NULL THEN k.a_trozos_car
         END AS analizado_car,
         CASE WHEN k.causa_candidato = 'medido' THEN char_length(k.c_texto)
              WHEN k.causa_candidato IN ('judgment_sin_id', 'id_sin_documento') AND k.c_nom_texto IS NOT NULL THEN char_length(k.c_nom_texto)
              WHEN k.causa_candidato = 'sin_full_text' AND k.c_trozos_car IS NOT NULL THEN k.c_trozos_car
         END AS candidato_car
  FROM clasificadas k
),
sin_medir AS (
  SELECT e.*, ceil((e.analizado_car + e.candidato_car) / 4.0) AS t
  FROM estimadas e
  WHERE e.causa_analizado <> 'medido' OR e.causa_candidato <> 'medido'
)
SELECT 'total' AS grupo, NULL AS causa_analizado, NULL AS causa_candidato,
       (SELECT count(*) FROM estimadas) AS parejas,
       (SELECT count(*) FROM sin_medir) AS sin_medir,
       (SELECT count(*) FROM sin_medir WHERE t IS NOT NULL) AS estimables,
       (SELECT count(*) FROM sin_medir WHERE t IS NULL) AS no_se_puede_saber,
       (SELECT max(t) FROM sin_medir) AS max_tokens_estimado,
       (SELECT count(*) FROM sin_medir WHERE t > 7758) AS por_encima_de_7758,
       (SELECT count(*) FROM sin_medir WHERE t > 10000) AS por_encima_de_10000
UNION ALL
SELECT 'por_causa', causa_analizado, causa_candidato, NULL, count(*),
       count(*) FILTER (WHERE t IS NOT NULL), count(*) FILTER (WHERE t IS NULL),
       max(t), count(*) FILTER (WHERE t > 7758), count(*) FILTER (WHERE t > 10000)
FROM sin_medir
GROUP BY causa_analizado, causa_candidato
ORDER BY 1 DESC, 5 DESC;
