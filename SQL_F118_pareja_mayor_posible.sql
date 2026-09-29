-- ============================================================================
-- F-118 / B.273 · LA PAREJA MAYOR QUE PUEDE FORMARSE HOY — SÓLO LECTURA
-- ⚠️ PENDIENTE DE EJECUTAR (29/09/2026). Sólo SELECT: no escribe nada.
--
-- QUÉ CONTESTA: el censo de B.273 midió las parejas que SE ANALIZARON (máximo
-- 7.758 tokens). Esto mide las que PUEDEN formarse con los documentos que existen
-- hoy en la organización del director (a9625e93), y cuántos documentos pasan por
-- sí solos de 10.000 tokens. El presupuesto NO se propone aquí: lo decide el
-- arquitecto con estas cifras.
--
-- QUÉ ES UNA PAREJA POSIBLE: un analizado —cualquier documento— con un candidato
-- que esté en el CORPUS (`analysis_status = 'analizado'`, lib/documents/estado.ts:76;
-- el filtro del chat y del análisis, lib/pinecone/vectors.ts:99) y que no sea él
-- mismo. ⚠️ Un duplicado con otro id (B.266) SÍ puede ser su candidato: no se excluye.
--
-- EL TAMAÑO, con su fuente:
--   · full_text: `char_length(documents.full_text)`, la medida del censo.
--   · trozos: si no hay full_text, la suma del texto de los trozos de su generación
--     activa (`document_chunks`). Cota por ARRIBA: filas de tabla con su hoja y sus
--     columnas, `table_summary` y solape dentro de las subdivisiones.
--   · no_se_puede_saber: ni full_text ni trozos. Se cuenta aparte, no se descarta.
--   ⚠️ Es el tamaño del documento ENTERO, que es lo que leería el escalón 1 —no lo
--   que ve hoy el juez en rápido (6.000 del analizado, 3.000 del candidato)—.
--   ⚠️ Tokens ≈ caracteres / 4, como en el censo. No se tokeniza.
--
-- TRES CONSULTAS. Si el editor sólo enseña el resultado de la última, se
-- selecciona cada una y se ejecuta por separado.
-- ============================================================================

-- 1 · Cada documento de hoy, del mayor al menor, y si pasa él solo de 10.000 tokens.
WITH docs AS (
  SELECT d.id, d.name, d.analysis_status, d.full_text IS NOT NULL AS con_full_text,
         coalesce(char_length(d.full_text),
                  (SELECT sum(char_length(ch.text)) FROM public.document_chunks ch
                    WHERE ch.document_id = d.id AND ch.generation = d.active_generation)) AS car,
         CASE WHEN d.full_text IS NOT NULL THEN 'full_text'
              WHEN EXISTS (SELECT 1 FROM public.document_chunks ch
                            WHERE ch.document_id = d.id AND ch.generation = d.active_generation) THEN 'trozos'
              ELSE 'no_se_puede_saber' END AS fuente
  FROM public.documents d
  WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
)
SELECT name, analysis_status, fuente, car,
       ceil(car / 4.0)::int AS tokens_aprox,
       ceil(car / 4.0) > 10000 AS pasa_solo_de_10000
FROM docs
ORDER BY car DESC NULLS LAST;

-- 2 · Las diez parejas posibles mayores: analizado cualquiera, candidato del corpus.
WITH docs AS (
  SELECT d.id, d.name, d.analysis_status,
         coalesce(char_length(d.full_text),
                  (SELECT sum(char_length(ch.text)) FROM public.document_chunks ch
                    WHERE ch.document_id = d.id AND ch.generation = d.active_generation)) AS car
  FROM public.documents d
  WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
)
SELECT a.name AS analizado, a.car AS analizado_car,
       c.name AS candidato, c.car AS candidato_car,
       a.car + c.car AS suma_car,
       ceil((a.car + c.car) / 4.0)::int AS suma_tokens_aprox
FROM docs a
JOIN docs c ON c.id <> a.id AND c.analysis_status = 'analizado'
WHERE a.car IS NOT NULL AND c.car IS NOT NULL
ORDER BY suma_car DESC
LIMIT 10;

-- 3 · El resumen.
WITH docs AS (
  SELECT d.id, d.analysis_status,
         coalesce(char_length(d.full_text),
                  (SELECT sum(char_length(ch.text)) FROM public.document_chunks ch
                    WHERE ch.document_id = d.id AND ch.generation = d.active_generation)) AS car
  FROM public.documents d
  WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
),
pares AS (
  SELECT ceil((a.car + c.car) / 4.0) AS t
  FROM docs a
  JOIN docs c ON c.id <> a.id AND c.analysis_status = 'analizado'
  WHERE a.car IS NOT NULL AND c.car IS NOT NULL
)
SELECT
  (SELECT count(*) FROM docs)                                              AS documentos,
  (SELECT count(*) FROM docs WHERE analysis_status = 'analizado')          AS en_el_corpus,
  (SELECT count(*) FROM docs WHERE car IS NULL)                            AS tamano_desconocido,
  (SELECT count(*) FROM docs WHERE ceil(car / 4.0) > 10000)                AS pasan_solos_de_10000,
  (SELECT count(*) FROM pares)                                             AS parejas_posibles,
  (SELECT max(t) FROM pares)                                               AS pareja_mayor_tokens,
  (SELECT count(*) FROM pares WHERE t > 7758)                              AS por_encima_de_7758,
  (SELECT count(*) FROM pares WHERE t > 10000)                             AS por_encima_de_10000,
  (SELECT round(100.0 * count(*) FILTER (WHERE t <= 10000) / nullif(count(*), 0), 1)
     FROM pares)                                                           AS porcentaje_que_cabe_en_10000;
