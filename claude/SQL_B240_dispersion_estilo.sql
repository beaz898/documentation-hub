-- ============================================================
-- LA DISPERSIÓN DEL ANÁLISIS DE ESTILO — 16/09/2026
--
-- ⚠️ `temperature: 0` NO estrechó el rango: de 7–9 pasó a 7–10. Era la lectura
-- declarada como «el hallazgo mayor», y es la que salió.
--
-- Desde `8af33ffa` los problemas se guardan, así que esto se contesta contra la
-- base. NO hace falta pegar nada a mano.
--
-- ⚠️ Y LA COLUMNA `analysis` SIRVE ADEMÁS DE MARCA DE DESPLIEGUE: sólo las filas
-- posteriores a ese commit la traen poblada — y ese commit lleva DENTRO el
-- cambio de temperatura. Una fila con `problemas` es una pasada con temperatura
-- 0; una sin ellos es anterior. Así no hay que fiarse de las horas.
-- ============================================================

-- ── 1 · LAS PASADAS, CON PUERTA, HORA Y MARCA DE DESPLIEGUE ─────────────
SELECT created_at,
       CASE WHEN document_id IS NOT NULL THEN 'A8 · bandeja'
            WHEN storage_path IS NOT NULL THEN 'A7 · chat'
            ELSE 'sin propietario' END                        AS puerta,
       document_name,
       style_problems_found                                   AS encontrados,
       jsonb_array_length(coalesce(analysis -> 'problemas', '[]'::jsonb)) AS problemas_guardados,
       (analysis -> 'problemas') IS NOT NULL                  AS posterior_al_cambio,
       pipeline_counters ->> 'averia.estilo_descartado_por_tipo'  AS descartados_por_tipo,
       pipeline_counters ->> 'averia.estilo_descartado_sin_ancla' AS descartados_sin_ancla
FROM analysis_results
WHERE analysis_type = 'style' AND document_name LIKE 'CLI-20%'
ORDER BY created_at DESC;


-- ⚠️ 2 · ¿DIFIERE EL NOMBRE ENTRE PUERTAS? Es la única variable del prompt
-- además del texto, y entra literal en él: `DOCUMENTO: "${fileName}"`.
-- Si las dos puertas mandan el mismo nombre, queda descartado como causa.
SELECT DISTINCT
       CASE WHEN document_id IS NOT NULL THEN 'A8 · bandeja'
            WHEN storage_path IS NOT NULL THEN 'A7 · chat'
            ELSE 'sin propietario' END AS puerta,
       document_name
FROM analysis_results
WHERE analysis_type = 'style' AND document_name LIKE 'CLI-20%';


-- ── 3 · EL CONJUNTO DE CADA PASADA ──────────────────────────────────────
SELECT a.created_at,
       CASE WHEN a.document_id IS NOT NULL THEN 'A8' ELSE 'A7' END AS puerta,
       p ->> 'type'    AS tipo,
       p ->> 'title'   AS titulo,
       left(p ->> 'textRef', 60) AS ancla
FROM analysis_results a,
     LATERAL jsonb_array_elements(coalesce(a.analysis -> 'problemas', '[]'::jsonb)) AS p
WHERE a.analysis_type = 'style' AND a.document_name LIKE 'CLI-20%'
ORDER BY a.created_at DESC, tipo, titulo;


-- ⚠️ 4 · LA FRECUENCIA DE CADA PROBLEMA — la consulta que decide
-- Agrupa por el ANCLA, que es lo estable: el `title` lo redacta el modelo y
-- puede cambiar de palabras para el mismo hallazgo (medido: `prescipción` pasó
-- de «le falta una s» a «le falta una r» siendo el mismo error).
WITH pasadas AS (
  SELECT count(*) AS total
  FROM analysis_results
  WHERE analysis_type = 'style' AND document_name LIKE 'CLI-20%'
    AND (analysis -> 'problemas') IS NOT NULL
), expandido AS (
  SELECT a.id,
         CASE WHEN a.document_id IS NOT NULL THEN 'A8' ELSE 'A7' END AS puerta,
         left(p ->> 'textRef', 50) AS ancla,
         p ->> 'type' AS tipo
  FROM analysis_results a,
       LATERAL jsonb_array_elements(coalesce(a.analysis -> 'problemas', '[]'::jsonb)) AS p
  WHERE a.analysis_type = 'style' AND a.document_name LIKE 'CLI-20%'
)
SELECT e.ancla,
       min(e.tipo)                                   AS tipo,
       count(DISTINCT e.id)                          AS pasadas_en_que_sale,
       (SELECT total FROM pasadas)                   AS de_un_total_de,
       count(DISTINCT e.id) FILTER (WHERE e.puerta = 'A7') AS en_chat,
       count(DISTINCT e.id) FILTER (WHERE e.puerta = 'A8') AS en_bandeja
FROM expandido e
GROUP BY e.ancla
ORDER BY pasadas_en_que_sale DESC, e.ancla;


-- ── 5 · ¿CAMBIA EL TIPO DEL MISMO HALLAZGO ENTRE PASADAS? ───────────────
-- Dos preguntas distintas: «¿lo vio?» y «¿lo clasificó igual?». Si un ancla
-- aparece con dos tipos, la detección es estable y la clasificación no.
SELECT left(p ->> 'textRef', 50) AS ancla,
       count(DISTINCT p ->> 'type') AS tipos_distintos,
       string_agg(DISTINCT p ->> 'type', ' · ') AS cuales
FROM analysis_results a,
     LATERAL jsonb_array_elements(coalesce(a.analysis -> 'problemas', '[]'::jsonb)) AS p
WHERE a.analysis_type = 'style' AND a.document_name LIKE 'CLI-20%'
GROUP BY 1
HAVING count(DISTINCT p ->> 'type') > 1;


-- ============================================================
-- AÑADIDO 16/09/2026 · LO QUE SE PUEDE MEDIR SOBRE LO YA GUARDADO
-- ============================================================

-- ⚠️ 6 · ¿SE DISPARÓ EL REINTENTO? — sin entrar en los registros de Vercel
--
-- `usageContext` SUMA los tokens de todas las llamadas de una petición, así que
-- una pasada con reintento mandó el prompt DOS VECES y tiene ~el doble de
-- `input_tokens` que sus hermanas. No hace falta un contador nuevo: la huella
-- ya está guardada.

SELECT date_trunc('second', created_at) AS pasada,
       input_tokens,
       output_tokens,
       round(input_tokens::numeric /
             nullif(min(input_tokens) OVER (), 0), 2) AS veces_el_minimo
FROM llm_usage
WHERE operation = 'analyze_style'
ORDER BY created_at DESC
LIMIT 20;

-- Leer así: si TODAS las filas dan `veces_el_minimo` ≈ 1, el reintento NUNCA
-- corrió y queda descartado. Una fila con ≈ 2 es una pasada que reintentó.


-- ⚠️ 7 · ¿HAY CITAS QUE NO ESTÁN EN EL TEXTO? — sobre las catorce YA guardadas
--
-- No hace falta esperar a una pasada nueva: los `textRef` están guardados y el
-- documento también (`documents.full_text`). Esto mide el pasado.
--
-- ⚠️ Compara contra los primeros 20.000 caracteres, que es lo que el modelo
-- llegó a ver. Buscar en el texto entero diría que existe una cita que nunca
-- estuvo en el prompt.

WITH doc AS (
  SELECT left(full_text, 20000) AS visto
  FROM documents
  WHERE name LIKE 'CLI-20%'
  LIMIT 1
)
SELECT a.created_at,
       p ->> 'type'              AS tipo,
       left(p ->> 'textRef', 60) AS cita,
       (position((p ->> 'textRef') IN (SELECT visto FROM doc)) > 0) AS esta_en_el_texto
FROM analysis_results a,
     LATERAL jsonb_array_elements(coalesce(a.analysis -> 'problemas', '[]'::jsonb)) AS p
WHERE a.analysis_type = 'style' AND a.document_name LIKE 'CLI-20%'
ORDER BY esta_en_el_texto, a.created_at DESC;


-- 8 · EL RESUMEN DE LO ANTERIOR, con denominador
WITH doc AS (
  SELECT left(full_text, 20000) AS visto FROM documents WHERE name LIKE 'CLI-20%' LIMIT 1
)
SELECT count(*) AS citas_totales,
       count(*) FILTER (WHERE position((p ->> 'textRef') IN (SELECT visto FROM doc)) = 0)
         AS citas_que_NO_estan
FROM analysis_results a,
     LATERAL jsonb_array_elements(coalesce(a.analysis -> 'problemas', '[]'::jsonb)) AS p
WHERE a.analysis_type = 'style' AND a.document_name LIKE 'CLI-20%';
