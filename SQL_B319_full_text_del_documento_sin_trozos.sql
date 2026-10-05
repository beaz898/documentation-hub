-- ============================================================================
-- B.319 · CON QUÉ FORMA ESTÁ ESCRITA LA FILA EN EL full_text DE UN DOCUMENTO SIN
-- TROZOS — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
-- ⚠️ LEE CONTENIDO DEL DOCUMENTO: el resultado lo mira el director y no se copia
--    a ningún registro ni a ninguna ficha.
--
-- QUÉ CONTESTA (arquitecto, 05/10/2026): el juez cita del lado existente una fila
-- de tabla pintada con barras, y la puerta de citas la descarta con
-- paso=cabeza_sin_cola y pajar=texto_completo en todas las pasadas. Sin trozos,
-- el pajar es `documents.full_text` (pipeline.ts:54-74) y la vía por segmentos de
-- fila no se intenta (judge.ts:265-269). Que la cabeza esté y la cola no dice que
-- la fila está escrita en full_text con otra forma. Esto la enseña.
--
-- Se busca por NOMBRE, así que puede salir más de una fila (dos organizaciones,
-- o dos copias): cada una con su organización y su id.
-- La búsqueda de «Residuos sanitarios» no distingue mayúsculas.
-- ============================================================================

SELECT d.id                                                             AS documento_id,
       d.org_id,
       d.name,
       d.analysis_status,
       d.extractor_version,
       d.active_generation,
       d.created_at,
       d.updated_at,
       (SELECT count(*) FROM public.document_chunks c
         WHERE c.document_id = d.id)                                    AS filas_en_document_chunks,
       (SELECT count(*) FROM public.document_chunks c
         WHERE c.document_id = d.id AND c.generation = d.active_generation) AS filas_de_la_generacion_activa,
       char_length(d.full_text)                                         AS full_text_caracteres,
       strpos(lower(d.full_text), lower('Residuos sanitarios'))         AS posicion_primera_aparicion,
       CASE WHEN strpos(lower(d.full_text), lower('Residuos sanitarios')) > 0
            THEN substring(d.full_text
                           FROM greatest(1, strpos(lower(d.full_text), lower('Residuos sanitarios')) - 400)
                           FOR 400 + char_length('Residuos sanitarios') + 400)
       END                                                              AS ventana_800_caracteres
FROM public.documents d
WHERE d.name = 'Normas_Frecuencia_Recogidas.docx'
ORDER BY d.org_id, d.created_at;
