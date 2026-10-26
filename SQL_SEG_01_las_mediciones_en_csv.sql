-- ============================================================================
-- EL SEGURO: TODAS LAS FILAS DE ANÁLISIS DEL PILOTO, PARA DESCARGAR EN CSV — SÓLO LECTURA (26/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
-- Sólo la organización del piloto (la constante de la primera línea del WITH).
--
-- POR QUÉ (arquitecto, 26/10): si la purga a 90 días salta, borra analysis_results entera, y ahí viven todas
-- nuestras mediciones. Esto es un SEGURO, no una medida: una fila por análisis, sin resumir nada.
--
-- QUÉ SALE: TODAS las columnas de la fila tal cual (ar.*: el jsonb del análisis entero —con el registro por
-- llamada, que vive dentro, en analysis.llamadasAlModelo—, los contadores, el documento, la fecha y lo demás),
-- y delante seis columnas para COMPROBAR LA DESCARGA, no para leer:
--   · n y total_filas: la última fila del CSV tiene que llevar n = total_filas, y el CSV tener total_filas filas.
--     Si no, la descarga se cortó;
--   · caracteres_del_analisis y huella_del_analisis (md5 del jsonb como texto), y lo mismo de los contadores:
--     sirven para comprobar más adelante que ninguna celda se recortó al exportar;
--   · lleva_registro_por_llamada: si el análisis trae analysis.llamadasAlModelo.
--
-- CÓMO SE EJECUTA: entera, y en el resultado «Download CSV». ⚠️ SIN COMPROBAR: si el editor de Supabase
-- recorta filas o celdas largas al exportar. Para eso están las seis columnas: si no cuadran, se parte por fechas.
-- ============================================================================
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY ar.created_at, ar.id) AS n,
       count(*) OVER () AS total_filas,
       to_char(ar.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       length(ar.analysis::text) AS caracteres_del_analisis,
       md5(ar.analysis::text) AS huella_del_analisis,
       md5(ar.pipeline_counters::text) AS huella_de_los_contadores,
       (ar.analysis ? 'llamadasAlModelo') AS lleva_registro_por_llamada,
       ar.*
FROM public.analysis_results ar, p
WHERE ar.org_id = p.org
ORDER BY ar.created_at, ar.id;
