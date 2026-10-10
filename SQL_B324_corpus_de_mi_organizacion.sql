-- ============================================================================
-- B.324 · EL CORPUS Y LOS ÚLTIMOS ANÁLISIS DE LA ORGANIZACIÓN DEL PILOTO
-- ✅ EJECUTADA el 05/10/2026 (corregido el 10/10/2026); resultado en Puntos_Pendientes_Doclity.txt:1680-1681 y :7523 (B.334). Sólo SELECT: no escribe nada.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal», la       │
-- │ cuenta del director (B.323). El id completo está UNA vez, en la         │
-- │ constante `piloto` de la primera línea de la consulta: se cambia ahí.   │
-- │ La otra que aparece en consultas viejas, 5a82712f-…, «Mi workspace», es │
-- │ la de las tandas de agosto: NO se mira.                                 │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- ⚠️ CONVENIO, desde el 05/10/2026 (arquitecto): toda consulta SQL filtra por la
-- organización del piloto con esta constante en su cabecera, y NO recorre
-- organizaciones salvo que el arquitecto lo pida explícitamente. Si una consulta
-- tiene que mirar varias, lo dice en su cabecera y explica por qué.
--
-- QUÉ CONTESTA (arquitecto, 05/10/2026):
--   1 · los últimos 10 análisis guardados de esta organización, con su hora de
--       Madrid: para localizar los dos de NOR-11 de hoy (10:01 y 10:07) y
--       confirmar que están aquí y no en otra organización;
--   2 · el resumen del corpus: documentos, sin trozos, en el corpus y del corpus
--       sin trozos;
--   3 · la lista de los documentos sin trozos.
--
-- CRITERIOS, los mismos de SQL_Documentos_Sin_Chunks.sql para que no haya dos:
--   · «sin trozos» = cero filas en `document_chunks` de su GENERACIÓN ACTIVA
--     (`documents.active_generation`), que es lo que lee el análisis;
--   · «en el corpus» = `analysis_status = 'analizado'` (lib/documents/estado.ts).
--   · No hay una columna «indexado el»: van `created_at` y `updated_at`.
--
-- UNA SOLA CONSULTA, a propósito: así la constante se escribe una vez y el editor
-- de Supabase, que sólo enseña el último resultado, lo enseña todo. Se lee por la
-- columna `bloque`; lo que significa cada columna `c1…c5` va en `que_es`.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
ultimos AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
  ORDER BY ar.created_at DESC
  LIMIT 10
),
docs AS (
  SELECT d.name, d.analysis_status, d.extractor_version, d.created_at, d.updated_at,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
)
SELECT bloque, orden, que_es, c1, c2, c3, c4, c5
FROM (
  SELECT '1 · últimos 10 análisis'                       AS bloque,
         row_number() OVER (ORDER BY created_at DESC)    AS orden,
         'id · hora de Madrid · documento · modo'        AS que_es,
         id::text                                        AS c1,
         to_char(created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS c2,
         document_name                                   AS c3,
         analysis_type                                   AS c4,
         NULL::text                                      AS c5
  FROM ultimos

  UNION ALL

  SELECT '2 · resumen del corpus', 1,
         'documentos · sin trozos · en el corpus · del corpus sin trozos',
         count(*)::text,
         count(*) FILTER (WHERE trozos_activos = 0)::text,
         count(*) FILTER (WHERE analysis_status = 'analizado')::text,
         count(*) FILTER (WHERE analysis_status = 'analizado' AND trozos_activos = 0)::text,
         NULL
  FROM docs

  UNION ALL

  SELECT '3 · documentos sin trozos',
         row_number() OVER (ORDER BY created_at DESC),
         'nombre · estado · extractor_version · creado (Madrid) · último cambio (Madrid)',
         name,
         analysis_status,
         coalesce(extractor_version::text, 'NULL (anterior a F-20)'),
         to_char(created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI'),
         to_char(updated_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI')
  FROM docs
  WHERE trozos_activos = 0
) t
ORDER BY bloque, orden;
