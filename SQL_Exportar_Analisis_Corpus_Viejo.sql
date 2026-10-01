-- ============================================================================
-- SEGURO, NO TAREA · EXPORTAR LOS ANÁLISIS DE LOS 14 DEL CORPUS VIEJO ANTES DE
-- BORRARLOS — SÓLO LECTURA (B.308)
-- ⚠️ NO SE EJECUTA NI SE PIDE (01/10/2026). Existe para el día que se decida
-- sacar del corpus los 14 ficheros de prueba. Sólo SELECT: no escribe nada.
--
-- POR QUÉ: sacar un documento del corpus hoy sólo se puede BORRÁNDOLO (B.308), y
-- el borrado se lleva sus filas de `analysis_results` (lib/delete-document.ts,
-- desde B.112), que son parte de la evidencia archivada.
--
-- QUÉ FILAS: EXACTAMENTE las que el borrado se llevaría. El criterio es el mismo
-- que usa `deleteDocument`: `org_id` + `document_id`
-- (`criterioDeAnalisisDelDocumento`, lib/documents/analisis-del-documento.ts:49-54).
-- Se exportan enteras, con el jsonb `analysis` y los contadores.
--
-- ⚠️ LO QUE NO SALE AQUÍ, y el borrado NO toca: los análisis de OTROS documentos
-- que mencionan a estos 14 como candidatos (dentro de su `analysis->'judgments'`).
-- Esas filas se quedan; sólo quedarán apuntando a un id que ya no existe.
--
-- CÓMO SE USA: se ejecuta y se descarga el resultado (CSV o JSON) desde el editor
-- de Supabase. Los 14 se eligen por ESTADO y por no tener trozos, la definición
-- del censo, no por nombre: así coincide con lo que haya ese día. Si el día que se
-- use el corpus viejo ha cambiado, la consulta 1 lo enseña antes.
-- ============================================================================

-- 1 · Qué documentos son, y cuántos análisis tiene cada uno (comprobar antes de exportar).
WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
viejos AS (
  SELECT d.id, d.name
  FROM public.documents d, parametros p
  WHERE d.org_id = p.org
    AND d.analysis_status = 'analizado'
    AND NOT EXISTS (SELECT 1 FROM public.document_chunks c
                     WHERE c.document_id = d.id AND c.generation = d.active_generation)
)
SELECT v.name, v.id,
       (SELECT count(*) FROM public.analysis_results ar, parametros p
         WHERE ar.org_id = p.org AND ar.document_id = v.id) AS analisis_que_se_borrarian
FROM viejos v
ORDER BY v.name;

-- 2 · La exportación: las filas enteras.
WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
viejos AS (
  SELECT d.id
  FROM public.documents d, parametros p
  WHERE d.org_id = p.org
    AND d.analysis_status = 'analizado'
    AND NOT EXISTS (SELECT 1 FROM public.document_chunks c
                     WHERE c.document_id = d.id AND c.generation = d.active_generation)
)
SELECT ar.*
FROM public.analysis_results ar, parametros p
WHERE ar.org_id = p.org
  AND ar.document_id IN (SELECT id FROM viejos)
ORDER BY ar.document_id, ar.created_at;
