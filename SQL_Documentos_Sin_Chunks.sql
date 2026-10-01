-- ============================================================================
-- DOCUMENTOS SIN TROZOS — SÓLO LECTURA · la parte del corpus a la que el escalón 1
-- no puede llegar (B.295, régimen `sin_fuente_comun`)
-- ✅ EJECUTADO por el director el 30/09/2026 (redactada el 29/09). Sólo SELECT: no escribe nada.
--    De la consulta 2 constan, porque las trae el arquitecto: en_el_corpus = 14,
--    corpus_sin_trozos = 14, sin_trozos_anterior_a_F20 = 21 (B.295).
--    Consulta 1, ejecutada el 01/10 (transcrita por el arquitecto; B.295): 22 sin
--    trozos, 14 analizado y 8 pendiente; causa anterior_a_F20 en 21, y new 9.txt con
--    trozos_de_otra_generacion (active_generation 3).
--
-- POR QUÉ AHORA: el 07/09, B.190 (Puntos_Pendientes_Doclity.txt:7074) midió CINCO
-- documentos con texto y sin trozos, todos anteriores a F-20, y concluyó que
-- «ninguna indexación ha fallado en silencio». Los logs del 29/09 que trae el
-- arquitecto muestran un sexto, Normas_Frecuencia_Recogidas.docx, que NO está entre
-- aquellos cinco. B.190 no dejó escrita la organización que midió; aquí van las dos.
--
-- LAS CAUSAS, y cómo se distinguen (la tercera es nueva respecto a B.190):
--   · anterior_a_F20: `extractor_version` NULL. Nunca tuvo trozos: historia.
--   · indexacion_fallida: `extractor_version` con valor y cero trozos. Es la causa
--     (1) de B.190: `persist-chunks.ts:42` registra el error y NO lanza, así que la
--     indexación informa de éxito sin trozos. B.190 la dejó como riesgo declarado.
--   · trozos_de_otra_generacion: tiene trozos, pero NINGUNO de su generación activa
--     (`documents.active_generation`). El pipeline los pide por la generación del
--     vector, así que para él es un documento sin trozos.
--   ⚠️ LO QUE NO SE VE DESDE AQUÍ: la generación del VECTOR que devuelve Pinecone.
--   Si un vector viejo apunta a una generación sin trozos, el pipeline tampoco los
--   encuentra aunque la generación activa sí los tenga. Eso no se lee desde SQL.
--
-- «Del corpus» = `analysis_status = 'analizado'` (lib/documents/estado.ts:76). Se
-- listan todos los documentos, con su estado, y el resumen cuenta aparte el corpus.
-- ⚠️ Fecha de indexado: `created_at` es cuándo nació la fila y `updated_at` su
-- último cambio. No hay una columna «indexado el»: las dos, y se dice.
--
-- DOS CONSULTAS. Si el editor sólo enseña el resultado de la última, se
-- selecciona cada una y se ejecuta por separado.
-- ============================================================================

-- 1 · Los documentos SIN trozos en su generación activa, con su causa.
WITH docs AS (
  SELECT d.id, d.org_id, d.name, d.source, d.analysis_status, d.extractor_version,
         d.active_generation, d.created_at, d.updated_at,
         char_length(d.full_text) AS full_text_car,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_generacion_activa,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation <> d.active_generation) AS trozos_otras_generaciones
  FROM public.documents d
  WHERE d.org_id IN ('5a82712f-6740-4792-b291-3fdea8e6edb1', 'a9625e93-af2a-4416-a465-5c2fa2a25bdf')
)
SELECT CASE org_id WHEN '5a82712f-6740-4792-b291-3fdea8e6edb1' THEN 'agosto' ELSE 'director' END AS organizacion,
       name, source, analysis_status,
       CASE WHEN trozos_otras_generaciones > 0 THEN 'trozos_de_otra_generacion'
            WHEN extractor_version IS NULL THEN 'anterior_a_F20'
            ELSE 'indexacion_fallida' END AS causa,
       extractor_version, active_generation, trozos_otras_generaciones,
       full_text_car, created_at, updated_at
FROM docs
WHERE trozos_generacion_activa = 0
ORDER BY organizacion, created_at;

-- 2 · El resumen por organización: cuántos documentos tienen trozos y cuántos no,
--     en total y en el corpus, y cuántos sin trozos de cada causa.
WITH docs AS (
  SELECT d.org_id, d.analysis_status, d.extractor_version,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS activos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation <> d.active_generation) AS otros
  FROM public.documents d
  WHERE d.org_id IN ('5a82712f-6740-4792-b291-3fdea8e6edb1', 'a9625e93-af2a-4416-a465-5c2fa2a25bdf')
)
SELECT CASE org_id WHEN '5a82712f-6740-4792-b291-3fdea8e6edb1' THEN 'agosto' ELSE 'director' END AS organizacion,
       count(*)                                                              AS documentos,
       count(*) FILTER (WHERE activos > 0)                                   AS con_trozos,
       count(*) FILTER (WHERE activos = 0)                                   AS sin_trozos,
       count(*) FILTER (WHERE analysis_status = 'analizado')                 AS en_el_corpus,
       count(*) FILTER (WHERE analysis_status = 'analizado' AND activos = 0) AS corpus_sin_trozos,
       count(*) FILTER (WHERE activos = 0 AND otros = 0 AND extractor_version IS NULL)     AS sin_trozos_anterior_a_F20,
       count(*) FILTER (WHERE activos = 0 AND otros = 0 AND extractor_version IS NOT NULL) AS sin_trozos_indexacion_fallida,
       count(*) FILTER (WHERE activos = 0 AND otros > 0)                     AS sin_trozos_de_otra_generacion
FROM docs
GROUP BY org_id
ORDER BY 1;
