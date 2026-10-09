-- ============================================================================
-- B.365 · LOS DOCUMENTOS SIN TROZOS, Y CUÁLES DE ELLOS NO TIENEN full_text —
-- SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada. Sólo recuentos,
-- nombres de documento y longitudes; ni un carácter del texto.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta, copiado de SQL_F120_P3_rerank_a_cero.sql (convenio del      │
-- │ 05/10/2026). No se mira ninguna otra: ni siquiera sus nombres salen.     │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 10/10/2026): un candidato sin trozos no tiene
-- «texto entregado» y la puerta de citas lo comprueba contra
-- `documents.full_text` (B.365). Si además NO TIENE full_text, la puerta
-- devuelve «no está» para CUALQUIER cita (sin_pajar) y TODOS los hallazgos
-- contra ese candidato se descartan en silencio. La combinación «sin trozos Y
-- sin full_text» es la que hay que contar.
--
-- LOS CRITERIOS, los mismos que en el resto de la casa:
--   · «sin trozos» = cero filas de `document_chunks` en la GENERACIÓN ACTIVA
--     (`documents.active_generation`), que es lo que lee el análisis
--     (lib/read-chunks.ts);
--   · «sin full_text» = nulo o vacío tras quitar espacios, que es lo que la
--     puerta trata como ausente (fetchFallbackFullTexts sólo lo usa si
--     `full_text.trim().length > 0`, lib/analysis/pipeline.ts:73);
--   · «corpus» = analysis_status = 'analizado' (CORPUS_ACTIVO).
--
-- ⚠️ CONTROL (bloque 0): los denominadores —documentos, corpus, corpus sin
-- trozos— para cotejarlos con SQL_B345 del 06/10 (50, 20 y 14). Si no cuadran,
-- el corpus cambió desde entonces y hay que decirlo antes de leer lo demás.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
docs AS (
  SELECT d.name,
         d.analysis_status,
         (d.analysis_status = 'analizado') AS en_el_corpus,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
         char_length(d.full_text) AS full_text_caracteres,
         -- Como `full_text.trim()` de JavaScript: fuera TODO espacio en blanco de los
         -- extremos (btrim sólo quitaría espacios).
         (d.full_text IS NOT NULL AND char_length(regexp_replace(d.full_text, '^\s+|\s+$', '', 'g')) > 0) AS tiene_full_text
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
),
sin_trozos AS (
  SELECT * FROM docs WHERE trozos_activos = 0
)
SELECT bloque, en_el_corpus, documentos, sin_full_text, con_full_text, name, analysis_status, full_text_caracteres
FROM (
  -- 0 · CONTROL: los denominadores, para cotejarlos con SQL_B345 del 06/10 (50 documentos,
  --     20 en el corpus, 14 del corpus sin trozos). Si no cuadran, el corpus cambió desde
  --     entonces y hay que decirlo antes de leer lo de abajo.
  SELECT '0 · control' AS bloque, NULL::boolean AS en_el_corpus,
         count(*) AS documentos,
         NULL::bigint AS sin_full_text,
         NULL::bigint AS con_full_text,
         'en el corpus: ' || count(*) FILTER (WHERE en_el_corpus)
           || ' · del corpus sin trozos: ' || count(*) FILTER (WHERE en_el_corpus AND trozos_activos = 0)
           || ' · sin trozos en total: ' || count(*) FILTER (WHERE trozos_activos = 0) AS name,
         NULL::text AS analysis_status, NULL::int AS full_text_caracteres, 0 AS orden
  FROM docs
  UNION ALL
  -- 1 · RESUMEN de los sin trozos: corpus y no corpus, con y sin full_text.
  SELECT '1 · sin trozos, resumen', en_el_corpus,
         count(*),
         count(*) FILTER (WHERE NOT tiene_full_text),
         count(*) FILTER (WHERE tiene_full_text),
         NULL, NULL, NULL, 1
  FROM sin_trozos
  GROUP BY en_el_corpus
  UNION ALL
  -- 2 · LA LISTA, documento a documento. Los «sin full_text» del corpus son los que lo descartan todo.
  SELECT '2 · sin trozos, documentos', en_el_corpus,
         NULL,
         CASE WHEN tiene_full_text THEN 0 ELSE 1 END,
         CASE WHEN tiene_full_text THEN 1 ELSE 0 END,
         name, analysis_status, full_text_caracteres, 2
  FROM sin_trozos
) t
ORDER BY bloque, en_el_corpus DESC NULLS FIRST, sin_full_text DESC NULLS LAST, name;
