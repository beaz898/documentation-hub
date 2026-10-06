-- ============================================================================
-- B.345 · EL DENOMINADOR DE LA RECUPERACIÓN: CUÁNTOS DOCUMENTOS HAY EN EL CORPUS
-- DEL PILOTO, CON TROZOS Y SIN ELLOS — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta, copiado de SQL_F120_P3_rerank_a_cero.sql (convenio del      │
-- │ 05/10/2026). No se mira ninguna otra.                                    │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 06/10/2026, mapa del camino, etapa 3): el log dice
-- «Retrieval: 8 candidatos» (lib/analysis/pipeline.ts:726) y no dice «de
-- cuántos». Esto da el «de cuántos» desde la base.
--
-- DOS DENOMINADORES, y no son el mismo:
--   · el CORPUS ENTERO de la organización: todos los documentos;
--   · el FONDO de la recuperación: los que el análisis puede encontrar, que son
--     los del corpus validado (`analysis_status = 'analizado'`) menos el propio
--     documento analizado (lib/analysis/es-del-fondo.ts:19-30). En una tanda se
--     suman sus documentos; esta consulta no lo puede saber y no lo intenta.
-- «Con trozos» = al menos una fila en `document_chunks` de su generación activa,
-- el mismo criterio de SQL_Documentos_Sin_Chunks.sql y SQL_B324. Un documento
-- del fondo sin trozos sí puede salir de candidato —sus vectores están en el
-- índice—, pero se lee sin fuente común (régimen `sin_fuente_comun`).
--
-- ⚠️ YA HAY UNA MEDIDA DE ESTO: SQL_B324_corpus_de_mi_organizacion.sql, bloque 2,
-- ejecutada el 05/10 (50 documentos, 22 sin trozos, 20 en el corpus, 14 del
-- corpus sin trozos). Ésta repite la cuenta con sus sumandos y su control, por
-- si el corpus ha cambiado desde entonces.
--
-- ⚠️ LA COLUMNA DE CONTROL `cuadra` TIENE QUE DECIR `sí`: comprueba que
-- con_trozos + sin_trozos = documentos, en el total y en el corpus. Si dice `no`,
-- algún documento no se ha podido clasificar (por ejemplo, generación activa
-- NULL) y EL RECUENTO NO VALE. `sin_generacion_activa` dice cuántos son.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
docs AS (
  SELECT d.id, d.analysis_status, d.active_generation,
         EXISTS (SELECT 1 FROM public.document_chunks c
                  WHERE c.document_id = d.id AND c.generation = d.active_generation) AS con_trozos
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
)
SELECT
  count(*)                                                                    AS documentos,
  count(*) FILTER (WHERE con_trozos)                                          AS con_trozos,
  count(*) FILTER (WHERE NOT con_trozos)                                      AS sin_trozos,
  count(*) FILTER (WHERE analysis_status = 'analizado')                       AS corpus,
  count(*) FILTER (WHERE analysis_status = 'analizado' AND con_trozos)        AS corpus_con_trozos,
  count(*) FILTER (WHERE analysis_status = 'analizado' AND NOT con_trozos)    AS corpus_sin_trozos,
  count(*) FILTER (WHERE active_generation IS NULL)                           AS sin_generacion_activa,
  CASE WHEN count(*) = count(*) FILTER (WHERE con_trozos) + count(*) FILTER (WHERE NOT con_trozos)
        AND count(*) FILTER (WHERE analysis_status = 'analizado')
            = count(*) FILTER (WHERE analysis_status = 'analizado' AND con_trozos)
            + count(*) FILTER (WHERE analysis_status = 'analizado' AND NOT con_trozos)
        AND count(*) FILTER (WHERE active_generation IS NULL) = 0
       THEN 'sí' ELSE 'no' END                                                AS cuadra
FROM docs;
