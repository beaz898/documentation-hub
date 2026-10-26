-- ============================================================================
-- EL SEGURO: TODAS LAS FILAS DE ANÁLISIS DE LA ORGANIZACIÓN, PARA DESCARGAR EN CSV — SÓLO LECTURA (26/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
-- La organización se RESUELVE por el usuario del director (bloque de la resolución, abajo). Desde el 26/10 mira
-- HACIA DELANTE: lo del piloto lo borró la purga del 25/10, y este seguro se ejecuta después de cada tanda.
--
-- POR QUÉ (arquitecto, 26/10): si la purga a 90 días salta, borra analysis_results entera, y ahí viven todas
-- nuestras mediciones. Esto es un SEGURO, no una medida: una fila por análisis, sin resumir nada.
--
-- QUÉ SALE: TODAS las columnas de la fila tal cual (ar.*: el jsonb del análisis entero —con el registro por
-- llamada, que vive dentro, en analysis.llamadasAlModelo—, los contadores, el documento, la fecha y lo demás),
-- y delante siete columnas para COMPROBAR LA DESCARGA, no para leer:
--   · organizacion_leida, en TODAS las filas: qué organización se lee, su nombre y cuántos documentos tiene, o el
--     grito de que no se ha podido resolver. Si no hay ningún análisis, sale UNA fila con esto y el resto vacío:
--     la consulta nunca devuelve cero filas;
--   · n y total_filas: la última fila del CSV tiene que llevar n = total_filas, y el CSV tener total_filas filas.
--     Si no, la descarga se cortó;
--   · caracteres_del_analisis y huella_del_analisis (md5 del jsonb como texto), y lo mismo de los contadores:
--     sirven para comprobar más adelante que ninguna celda se recortó al exportar;
--   · lleva_registro_por_llamada: si el análisis trae analysis.llamadasAlModelo.
--
-- CÓMO SE EJECUTA: entera, y en el resultado «Download CSV». ⚠️ SIN COMPROBAR: si el editor de Supabase
-- recorta filas o celdas largas al exportar. Para eso están las columnas de cuadre: si no cuadran, se parte por fechas.
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
p AS (SELECT (SELECT org FROM resolucion) AS org)
SELECT (SELECT linea FROM organizacion_leida) AS organizacion_leida,
       CASE WHEN ar.id IS NULL THEN NULL ELSE row_number() OVER (ORDER BY ar.created_at, ar.id) END AS n,
       count(ar.id) OVER () AS total_filas,
       to_char(ar.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       length(ar.analysis::text) AS caracteres_del_analisis,
       md5(ar.analysis::text) AS huella_del_analisis,
       md5(ar.pipeline_counters::text) AS huella_de_los_contadores,
       (ar.analysis ? 'llamadasAlModelo') AS lleva_registro_por_llamada,
       ar.*
FROM p LEFT JOIN public.analysis_results ar ON ar.org_id = p.org
ORDER BY ar.created_at, ar.id;
