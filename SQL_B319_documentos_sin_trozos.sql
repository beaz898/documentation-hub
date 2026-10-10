-- ============================================================================
-- B.319 · LOS DOCUMENTOS SIN TROZOS, EN TODAS LAS ORGANIZACIONES — SÓLO LECTURA
-- ✅ EJECUTADA el 05/10/2026 (corregido el 10/10/2026); resultado en Puntos_Pendientes_Doclity.txt:7523-7525 (B.334). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA (arquitecto, 05/10/2026): cuántos documentos del corpus están
-- ciegos para la verificación de citas. Sin trozos, una cita que es fila de tabla
-- no se puede comprobar por segmentos (judge.ts:265-269, :284): sólo se busca
-- seguida en full_text.
--
-- ⚠️ YA HUBO UNA MEDIDA ASÍ: SQL_Documentos_Sin_Chunks.sql, ejecutada el 30/09 y
-- el 01/10 (22 sin trozos; 21 anteriores a F-20). Aquélla fija DOS
-- organizaciones; ésta recorre todas y ordena por lo más reciente. El criterio es
-- el MISMO, para que no haya dos: «sin trozos» = cero filas en la GENERACIÓN
-- ACTIVA (`documents.active_generation`), que es lo que el análisis lee
-- (lib/read-chunks.ts). Se enseña también el total de filas de cualquier
-- generación, para ver los que tienen trozos de otra.
--
-- ⚠️ Fecha de indexado: no hay una columna «indexado el». `created_at` es cuándo
-- nació la fila y `updated_at` su último cambio: van las dos.
--
-- DOS CONSULTAS. El editor de Supabase sólo enseña el resultado de la última: se
-- selecciona cada una y se ejecuta por separado.
-- ============================================================================

-- 1 · Los documentos sin trozos en su generación activa, lo más reciente primero.
WITH docs AS (
  SELECT d.id, d.org_id, d.name, d.analysis_status, d.extractor_version,
         d.active_generation, d.created_at, d.updated_at,
         char_length(d.full_text) AS full_text_caracteres,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_generacion_activa,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id) AS trozos_cualquier_generacion
  FROM public.documents d
)
SELECT docs.org_id,
       o.name                    AS organizacion,
       docs.name,
       docs.analysis_status,
       docs.extractor_version,
       docs.active_generation,
       docs.trozos_cualquier_generacion,
       docs.full_text_caracteres,
       docs.created_at,
       docs.updated_at
FROM docs
LEFT JOIN public.organizations o ON o.id::text = docs.org_id
WHERE docs.trozos_generacion_activa = 0
ORDER BY docs.created_at DESC;

-- 2 · El total por organización: cuántos documentos, cuántos sin trozos, y
--     cuántos de ellos están en el corpus (`analysis_status = 'analizado'`,
--     lib/documents/estado.ts).
WITH docs AS (
  SELECT d.org_id, d.analysis_status,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS activos
  FROM public.documents d
)
SELECT docs.org_id,
       o.name                                                                    AS organizacion,
       count(*)                                                                  AS documentos,
       count(*) FILTER (WHERE activos = 0)                                       AS sin_trozos,
       count(*) FILTER (WHERE analysis_status = 'analizado')                     AS en_el_corpus,
       count(*) FILTER (WHERE analysis_status = 'analizado' AND activos = 0)     AS corpus_sin_trozos
FROM docs
LEFT JOIN public.organizations o ON o.id::text = docs.org_id
GROUP BY docs.org_id, o.name
ORDER BY sin_trozos DESC, docs.org_id;
