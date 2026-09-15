-- ============================================================
-- A7/A8 · LO QUE LA BASE PUEDE Y NO PUEDE DECIR — 15/09/2026
--
-- ⚠️ LA RESPUESTA CORTA A «SACA DE LA BASE LOS DOS ANÁLISIS Y DIME QUÉ LE FALTA
-- A LA PASADA DE 7»: NO SE PUEDE. `saveStyleResult` (persist-analysis.ts:130)
-- inserta SÓLO el recuento — `style_problems_found` — y deja `analysis` a NULL.
-- Los problemas concretos nunca se guardan: viven en la respuesta HTTP y en la
-- pantalla, y se pierden al cerrarla.
--
-- Estas consultas dicen lo que sí hay: cuántas pasadas, cuándo, por qué puerta y
-- con qué recuento. Para saber CUÁL falta hay que mirar la pantalla — o repetir.
-- ============================================================

-- ── 1 · TODAS LAS PASADAS DE ESTILO, POR PUERTA ─────────────────────────
-- ⚠️ CÓMO SE DISTINGUE A7 DE A8 SIN UNA COLUMNA QUE LO DIGA: por el propietario.
-- Desde el CHAT el dueño es el fichero (`storage_path` relleno, `document_id`
-- nulo); desde la BANDEJA es el documento (al revés). Es la única huella de la
-- puerta que queda persistida.

SELECT id,
       created_at,
       document_name,
       style_problems_found                       AS problemas,
       CASE
         WHEN document_id IS NOT NULL THEN 'A8 · bandeja'
         WHEN storage_path IS NOT NULL THEN 'A7 · chat'
         ELSE '⚠️ sin propietario'
       END                                        AS puerta,
       (analysis IS NULL)                         AS sin_detalle_guardado
FROM analysis_results
WHERE analysis_type = 'style'
ORDER BY created_at DESC
LIMIT 20;


-- ── 2 · LA ESTABILIDAD, CON SU DENOMINADOR ──────────────────────────────
-- «Estable en 8» necesita saber sobre cuántas pasadas. Cuatro repeticiones no
-- son lo mismo que cuarenta, y una sola pasada de la otra puerta no es una
-- comparación entre puertas.

SELECT CASE
         WHEN document_id IS NOT NULL THEN 'A8 · bandeja'
         WHEN storage_path IS NOT NULL THEN 'A7 · chat'
         ELSE 'sin propietario'
       END                          AS puerta,
       count(*)                     AS pasadas,
       min(style_problems_found)    AS minimo,
       max(style_problems_found)    AS maximo,
       round(avg(style_problems_found), 2) AS media
FROM analysis_results
WHERE analysis_type = 'style'
  AND document_name LIKE 'CLI-20%'
GROUP BY 1;


-- ── 3 · ⚠️ LA CONFIRMACIÓN DE QUE EL DETALLE NO ESTÁ ────────────────────
-- Si esto devuelve 0 en `con_detalle`, queda demostrado —y no supuesto— que la
-- comparación uno a uno no se puede hacer contra la base.

SELECT count(*)                                  AS analisis_de_estilo,
       count(*) FILTER (WHERE analysis IS NOT NULL) AS con_detalle,
       count(*) FILTER (WHERE analysis IS NULL)     AS solo_el_recuento
FROM analysis_results
WHERE analysis_type = 'style';
