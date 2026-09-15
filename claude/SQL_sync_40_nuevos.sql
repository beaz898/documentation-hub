-- ============================================================
-- «40 NUEVOS» SOBRE UN CORPUS QUE YA LOS TENÍA — 15/09/2026
--
-- ⚠️ ESTO NO ARREGLA NADA. Es lo que decide entre dos relatos incompatibles.
--
-- LO QUE DICE EL CÓDIGO: `newCount++` (sync/route.ts:474) va DESPUÉS de un
-- INSERT real, y ese insert escribe `analysis_status: 'pendiente'` (:447). O
-- sea: «40 nuevos» significa 40 filas insertadas, y la bandeja se explica sola.
--
-- LO QUE DICE LA MEDICIÓN: 42 documentos y 42 nombres distintos, después.
--
-- LAS DOS NO PUEDEN SER CIERTAS: 42 + 40 = 82. Estas consultas dicen cuál lo es.
-- ============================================================

-- ── 1 · ¿CUÁNTAS FILAS HAY, Y DE QUÉ ORIGEN? ─────────────────────────────
-- ⚠️ CON `org_id` A LA VISTA. Consultar esta tabla sin filtrar por
-- organización ya dio un susto en este proyecto: si salen dos org_id, el
-- recuento de 42 estaba mezclando organizaciones.

SELECT org_id,
       source,
       COUNT(*)                    AS filas,
       COUNT(DISTINCT name)        AS nombres_distintos,
       COUNT(DISTINCT provider_file_id) AS ids_de_proveedor_distintos
FROM documents
GROUP BY org_id, source
ORDER BY org_id, source;


-- ── 2 · LA PREGUNTA QUE LO DECIDE: ¿SON FILAS NUEVAS O LAS DE SIEMPRE? ───
-- Si `created_at` es de hace un minuto, la sincronización las CREÓ y las
-- anteriores ya no están: el corpus perdió su historia.
-- Si `created_at` es viejo y `updated_at` reciente, sólo las tocó.

SELECT date_trunc('minute', created_at) AS creadas_en,
       COUNT(*)                          AS cuantas,
       MIN(created_at)                   AS la_primera,
       MAX(created_at)                   AS la_ultima
FROM documents
WHERE source IN ('onedrive', 'google_drive')
GROUP BY 1
ORDER BY 1 DESC
LIMIT 20;


-- ── 3 · CUÁNTOS ESTÁN EN LA BANDEJA HOY, Y DESDE CUÁNDO ──────────────────
-- La bandeja lista lo que NO está `analizado`. Si estos 40 estaban
-- `analizado` y ahora están `pendiente`, la sincronización deshizo trabajo de
-- revisión ya hecho.
-- ⚠️ `reviewed_at` es la prueba: lo rellena «Marcar como analizado». Una fila
-- con `reviewed_at` puesto Y `analysis_status = 'pendiente'` es exactamente
-- «estaba revisado y ha vuelto atrás».

SELECT analysis_status,
       COUNT(*)                                        AS cuantos,
       COUNT(*) FILTER (WHERE reviewed_at IS NOT NULL) AS con_revision_previa,
       MIN(created_at)                                 AS creado_el_mas_antiguo,
       MAX(created_at)                                 AS creado_el_mas_reciente
FROM documents
WHERE source IN ('onedrive', 'google_drive')
GROUP BY analysis_status
ORDER BY cuantos DESC;


-- ── 4 · EL DETALLE, QUE ES LO QUE DE VERDAD SE MIRA CON 40 FILAS ─────────
-- Las tres fechas juntas cuentan la historia entera de cada documento.

SELECT name,
       source,
       analysis_status,
       created_at,
       updated_at,
       reviewed_at,
       source_modified_at,
       active_generation,
       chunk_count
FROM documents
WHERE source IN ('onedrive', 'google_drive')
ORDER BY created_at DESC, name;


-- ── 5 · ¿QUEDÓ ALGUNA HUELLA DE LAS ANTERIORES? ──────────────────────────
-- Si la sincronización creó 40 y las viejas desaparecieron, sus análisis
-- guardados serían huérfanos o se habrían ido con ellas. Esto lo enseña.

SELECT COUNT(*) AS analisis_sin_documento_vivo
FROM analysis_results a
WHERE a.document_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = a.document_id);


-- ── 6 · Y LAS LÁPIDAS, POR SI ALGO SE EXCLUYÓ Y VOLVIÓ ───────────────────

SELECT COUNT(*) AS lapidas, MIN(excluded_at) AS la_mas_antigua, MAX(excluded_at) AS la_mas_reciente
FROM document_tombstones;


-- ============================================================
-- AÑADIDO 15/09/2026 · LO QUE QUEDÓ SUELTO TRAS LA DESCONEXIÓN
-- Sigue sin borrar nada. Sólo cuenta.
-- ============================================================

-- ── 7 · LOS ANÁLISIS QUE APUNTAN A IDS MUERTOS ──────────────────────────
-- `analysis_results.document_id` NO tiene clave ajena, y `drive/disconnect`
-- borra las filas de `documents` con un `.delete()` crudo —sin pasar por
-- `deleteDocument`—, así que los análisis sobreviven señalando a nada.
-- ⚠️ Con su DENOMINADOR al lado: «17 huérfanos» no dice nada sin saber de
-- cuántos.

SELECT COUNT(*)                                          AS analisis_totales,
       COUNT(*) FILTER (WHERE document_id IS NULL)        AS sin_id_por_diseño,
       COUNT(*) FILTER (
         WHERE document_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = analysis_results.document_id)
       )                                                  AS apuntando_a_ids_muertos
FROM analysis_results;


-- ── 8 · ¿DE QUÉ DOCUMENTOS ERAN, Y COINCIDEN CON LOS NUEVOS? ────────────
-- Si los nombres coinciden con los 40 recreados, son los análisis del trabajo
-- de revisión que se perdió. Eso es lo que hay que saber antes de decidir si
-- se reasignan por nombre o se borran.

SELECT a.document_name,
       COUNT(*)        AS analisis_muertos,
       MAX(a.created_at) AS el_mas_reciente,
       EXISTS (SELECT 1 FROM documents d
                WHERE d.name = a.document_name AND d.source = 'onedrive') AS existe_uno_nuevo_con_ese_nombre
FROM analysis_results a
WHERE a.document_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = a.document_id)
GROUP BY a.document_name
ORDER BY analisis_muertos DESC, a.document_name;


-- ── 9 · LOS TROZOS TIPADOS, QUE SÍ DEBERÍAN HABERSE IDO EN CASCADA ──────
-- `document_chunks.document_id` tiene FK ON DELETE CASCADE. Este cero es
-- el CONTROL de que la cascada hizo su trabajo — y si no es cero, es un
-- hallazgo distinto.

SELECT COUNT(*) AS trozos_sin_documento
FROM document_chunks c
WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.id = c.document_id);
