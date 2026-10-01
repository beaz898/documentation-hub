-- ============================================================================
-- LOS 14 DEL CORPUS SIN TROZOS: ¿CUÁLES SE PUEDEN REINDEXAR SIN VOLVER A SUBIR
-- EL FICHERO? — SÓLO LECTURA (B.295, F-3; deuda de B.190)
-- ✅ EJECUTADA LA VERSIÓN CORREGIDA por el director el 01/10/2026. Sólo SELECT.
--    Consulta 2: sin_original_con_tablas 2 · reprocesar NO CONSTRUIDA (501) 7 ·
--    staged_vivo 1 · retrocear SIN RESUBIR 4 · total 14. SON 4 (B.295).
--
-- ❌ EL RESULTADO DE LA VERSIÓN ANTERIOR ES INVÁLIDO, Y EL ERROR ES DE CODE.
--    Se ejecutó el 30/09 (consulta 2) y el 01/10 (consulta 1), y dio «13 retrocear,
--    1 staged_vivo». Pero `tiene_segmentos` valía NULL —no false— cuando la columna
--    `segments` es NULL: `jsonb_typeof(NULL) = 'array'` es NULL, y el AND se queda
--    en NULL. Entonces `NOT tiene_segmentos` también era NULL, el WHEN no se cumplía,
--    y las ramas «reprocesar» y «sin_original_con_tablas» se SALTABAN para todo
--    documento sin segmentos. Todo caía a «retrocear». La consulta 1 lo enseñaba:
--    `tiene_segmentos = null` en las 14 filas.
--    Lo que el código hace de verdad: `tieneSegmentosPersistidos` da false sin
--    segmentos (lib/documents/lectura-dual.ts:120), y `planDeReindexado` manda a
--    un .xlsx sin segmentos a «sin_original_con_tablas» (plan-de-reindexado.ts).
--    Corregido con `coalesce(…, false)` en las dos consultas.
--    El dato de partida sigue siendo bueno: 14 documentos y 1 staged_vivo
--    (new 9.txt), porque esa rama va antes y no dependía de los segmentos.
--
-- LA PREGUNTA, del arquitecto: el escalón 1 no cambia nada en la ruta por defecto
-- mientras el corpus no tenga trozos (F-3). Para decidir cuánto cuesta
-- desbloquearlo, hay que saber cuántos de esos documentos puede reparar el botón
-- de reindexar (`/settings/corpus`) con lo que ya está guardado, y cuántos
-- necesitan que se vuelva a subir el fichero.
--
-- ⚠️ ESTO ES UN ESPEJO, NO EL CRITERIO. Quien decide es
-- `planDeReindexado` (`lib/documents/plan-de-reindexado.ts`), llamado por
-- `repararDocumento` (`lib/documents/reparar.ts:94`). Aquí se copian sus reglas
-- EN SU ORDEN, para verlas en SQL. Si esta consulta y el botón discrepan, GANA EL
-- BOTÓN, y esta consulta está mal.
--   1. `al_dia` → rechazado. `extractor_version` igual o mayor que la vigente.
--      La vigente la calcula el código (`EXTRACTOR_VERSION`, lib/chunking.ts:131)
--      y SQL no la sabe: la enseña `/settings/corpus` («version_vigente»). Aquí
--      NULL cuenta como atrasado, y un valor se enseña para compararlo a mano.
--   2. Una fila viva en `document_staged` → rechazado (`staged_vivo`).
--   3. Sin segmentos, y el ORIGINAL se puede recuperar (`google_drive` u
--      `onedrive` con `provider_file_id`) → vía `reprocesar`, que NO ESTÁ
--      CONSTRUIDA: el botón responde 501 (`reparar.ts:115-117`). ⚠️ Es lo menos
--      obvio. Un documento de Drive con `full_text` perfecto NO se retrocea: el
--      plan lo manda a la vía que falta (estado-de-reparacion.ts:130-140).
--   4. Sin segmentos y con tablas (`.xlsx`/`.xlsm`, lib/chunking.ts:941, o trozos
--      tabulares en la generación activa) → rechazado (`sin_original_con_tablas`):
--      desde `full_text` sólo sale prosa, y se perderían las celdas.
--   5. `full_text` recortado con menos de 50 caracteres → rechazado (`sin_texto`).
--   6. Si no, → `retrocear`: reindexable SIN volver a subir el fichero.
--   ⚠️ Un documento SINCRONIZADO CON segmentos va a 3 o a 6 según si lo cambiado
--   desde su sello es sólo troceado (`soloCambioElTroceado`), que SQL no sabe: sale
--   como «depende de la versión», y lo decide /settings/corpus.
--   «Tiene segmentos» = un array no vacío cuyos elementos llevan `text` de tipo
--   cadena (`tieneSegmentosPersistidos`, lib/documents/lectura-dual.ts:120).
--
-- LA POBLACIÓN: los documentos del director con `analysis_status = 'analizado'`
-- y CERO trozos en su generación activa, la definición del censo de
-- `SQL_Documentos_Sin_Chunks.sql`. Según el censo del 30/09 que trae el
-- arquitecto, son 14 y son TODO el corpus. La consulta 1 lo vuelve a contar: si
-- no salen 14, gana esta consulta.
--
-- DOS CONSULTAS. Si el editor sólo enseña el resultado de la última, se
-- selecciona cada una y se ejecuta por separado.
-- ============================================================================

-- 1 · Documento a documento, con la vía que le daría el botón.
WITH docs AS (
  SELECT d.id, d.name, d.source, d.provider_file_id, d.extractor_version,
         d.active_generation, d.created_at,
         char_length(btrim(coalesce(d.full_text, '')))                AS full_text_car,
         coalesce(jsonb_typeof(d.segments) = 'array'
           AND jsonb_array_length(d.segments) > 0
           AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d.segments) s
                            WHERE jsonb_typeof(s) <> 'object'
                               OR jsonb_typeof(s->'text') IS DISTINCT FROM 'string'), false) AS tiene_segmentos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation
             AND c.chunk_type <> 'text')                                      AS trozos_tabulares,
         EXISTS (SELECT 1 FROM public.document_staged st
                  WHERE st.document_id = d.id AND st.org_id = d.org_id)       AS staged_vivo
  FROM public.documents d
  WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
    AND d.analysis_status = 'analizado'
),
corpus_sin_trozos AS (SELECT * FROM docs WHERE trozos_activos = 0)
SELECT name, source, extractor_version, full_text_car, tiene_segmentos, staged_vivo,
       CASE
         WHEN staged_vivo THEN 'rechazado: staged_vivo'
         WHEN tiene_segmentos AND source IN ('google_drive', 'onedrive')
           THEN 'depende de la versión: ver /settings/corpus'
         WHEN NOT tiene_segmentos
              AND source IN ('google_drive', 'onedrive')
              AND length(btrim(coalesce(provider_file_id, ''))) > 0
           THEN 'reprocesar: NO CONSTRUIDA (501)'
         WHEN NOT tiene_segmentos
              AND (trozos_tabulares > 0 OR lower(name) ~ '\.(xlsx|xlsm)$')
           THEN 'rechazado: sin_original_con_tablas'
         WHEN full_text_car < 50 THEN 'rechazado: sin_texto'
         ELSE 'retrocear: SIN RESUBIR'
       END AS via,
       CASE WHEN extractor_version IS NOT NULL
            THEN 'comparar con version_vigente de /settings/corpus: si es igual o mayor, al_dia (rechazado)'
       END AS aviso_version,
       created_at
FROM corpus_sin_trozos
ORDER BY via, name;

-- 2 · El resumen: cuántos por vía, y el total, que debería ser 14.
WITH docs AS (
  SELECT d.name, d.source, d.provider_file_id,
         char_length(btrim(coalesce(d.full_text, '')))                AS full_text_car,
         coalesce(jsonb_typeof(d.segments) = 'array'
           AND jsonb_array_length(d.segments) > 0
           AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(d.segments) s
                            WHERE jsonb_typeof(s) <> 'object'
                               OR jsonb_typeof(s->'text') IS DISTINCT FROM 'string'), false) AS tiene_segmentos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation) AS trozos_activos,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation
             AND c.chunk_type <> 'text')                                      AS trozos_tabulares,
         EXISTS (SELECT 1 FROM public.document_staged st
                  WHERE st.document_id = d.id AND st.org_id = d.org_id)       AS staged_vivo
  FROM public.documents d
  WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
    AND d.analysis_status = 'analizado'
),
clasificados AS (
  SELECT CASE
           WHEN staged_vivo THEN 'rechazado: staged_vivo'
           WHEN tiene_segmentos AND source IN ('google_drive', 'onedrive')
             THEN 'depende de la versión: ver /settings/corpus'
           WHEN NOT tiene_segmentos
                AND source IN ('google_drive', 'onedrive')
                AND length(btrim(coalesce(provider_file_id, ''))) > 0
             THEN 'reprocesar: NO CONSTRUIDA (501)'
           WHEN NOT tiene_segmentos
                AND (trozos_tabulares > 0 OR lower(name) ~ '\.(xlsx|xlsm)$')
             THEN 'rechazado: sin_original_con_tablas'
           WHEN full_text_car < 50 THEN 'rechazado: sin_texto'
           ELSE 'retrocear: SIN RESUBIR'
         END AS via
  FROM docs WHERE trozos_activos = 0
)
SELECT via, count(*) AS documentos FROM clasificados GROUP BY ROLLUP (via) ORDER BY via NULLS LAST;
