-- ============================================================================
-- F-123 · FASE 0.1, PRIMER TIEMPO: LISTAR Y MARCAR — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no reindexa.
-- Salen nombres de documento, recuentos y marcas; ni un carácter del texto.
-- ✅ PROBADO ANTES DE ENTREGARLO (10/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): con la población esperada el control sale OK en sus
-- cinco filas, y cambiando un resto por un documento fuera del corpus sale
-- FALLA en dos («en el corpus» y «restos»); quedan fuera otra organización y
-- los trozos de una generación que no es la activa, y un full_text de sólo
-- espacios cuenta como «no tiene».
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 10/10/2026, dictamen F-123 P1, fase 0.1): para cada
-- documento de la organización, su id, nombre, si está en el corpus, su
-- extractor_version, si tiene full_text, cuántos trozos tiene y cuántos
-- vectores. Y la MARCA que separa sin ambigüedad:
--   · `resto`            = en el corpus, CERO trozos en la generación activa,
--                          extractor_version NULL y entre 1 y 6 vectores
--                          declarados (B.334, dato del director del 10/10);
--   · `corpus_con_trozos`= en el corpus y con trozos en la generación activa;
--   · `corpus_sin_trozos_fuera_de_criterio` = en el corpus, sin trozos, pero
--                          que NO cumple el criterio de resto. ⚠️ Tiene que ser
--                          0: si no lo es, el criterio de «resto» no describe a
--                          los 14 y hay que mirarlo antes de marcar nada;
--   · `fuera_del_corpus` = el resto hasta los 50, con su estado.
--
-- LOS CRITERIOS, los de siempre en la casa:
--   · «en el corpus» = analysis_status = 'analizado' (CORPUS_ACTIVO);
--   · «trozos» = filas de document_chunks en la GENERACIÓN ACTIVA
--     (documents.active_generation), que es lo que lee el análisis;
--   · «tiene full_text» = no nulo y no vacío tras quitar espacios en los bordes
--     (como `full_text.trim()` de JavaScript, igual que SQL_B365).
--
-- ⚠️ LOS VECTORES: SQL NO VE PINECONE. La columna `vectores_declarados` es
-- `documents.chunk_count`, lo que la indexación DECLARÓ haber escrito (igual que
-- SQL_B334). No es un recuento del índice. El recuento real, sin lanzar
-- análisis ni gastar créditos, lo da la herramienta de sólo lectura
-- GET /api/admin/vectores-de-un-documento?documentId=<uuid>
-- (app/api/admin/vectores-de-un-documento/route.ts: lista por prefijo de id en
-- Pinecone, no escribe nada), una llamada por documento: hace falta para los 14
-- restos antes de decidir nada.
--
-- ⚠️ CONTROL (bloque 0): cinco filas, cada una con su cifra ESPERADA y OK o
-- FALLA. Esperado: 50 documentos, 20 en el corpus, 6 del corpus con trozos, 14
-- restos y 0 del corpus sin trozos fuera de criterio (SQL_B345 del 06/10 y el
-- dato del director del 10/10). Si alguna sale FALLA, el corpus cambió o el
-- criterio no es el que se cree, y no se marca nada hasta explicarlo.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
docs AS (
  SELECT d.id,
         d.name,
         d.analysis_status,
         (d.analysis_status = 'analizado')                                           AS en_el_corpus,
         d.extractor_version,
         (d.full_text IS NOT NULL
          AND char_length(regexp_replace(d.full_text, '^\s+|\s+$', '', 'g')) > 0)    AS tiene_full_text,
         (SELECT count(*) FROM public.document_chunks c
           WHERE c.document_id = d.id AND c.generation = d.active_generation)        AS trozos,
         d.chunk_count                                                               AS vectores_declarados
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
),
marcados AS (
  SELECT docs.*,
         CASE
           WHEN en_el_corpus AND trozos > 0 THEN 'corpus_con_trozos'
           WHEN en_el_corpus AND trozos = 0 AND extractor_version IS NULL
                AND vectores_declarados BETWEEN 1 AND 6 THEN 'resto'
           WHEN en_el_corpus AND trozos = 0 THEN 'corpus_sin_trozos_fuera_de_criterio'
           ELSE 'fuera_del_corpus'
         END AS marca
  FROM docs
),
control AS (
  SELECT 'documentos'                          AS medida, 50 AS esperado, count(*) AS medido FROM marcados
  UNION ALL
  SELECT 'en el corpus',                              20, count(*) FILTER (WHERE en_el_corpus) FROM marcados
  UNION ALL
  SELECT 'del corpus con trozos',                      6, count(*) FILTER (WHERE marca = 'corpus_con_trozos') FROM marcados
  UNION ALL
  SELECT 'restos',                                    14, count(*) FILTER (WHERE marca = 'resto') FROM marcados
  UNION ALL
  SELECT 'del corpus sin trozos fuera de criterio',    0, count(*) FILTER (WHERE marca = 'corpus_sin_trozos_fuera_de_criterio') FROM marcados
)
SELECT bloque, marca, name, id, analysis_status, extractor_version, tiene_full_text, trozos, vectores_declarados
FROM (
  -- 0 · CONTROL: la cifra esperada, la medida, y OK o FALLA en `marca`.
  SELECT '0 · control' AS bloque,
         CASE WHEN medido = esperado THEN 'OK' ELSE 'FALLA' END AS marca,
         medida || ': esperado ' || esperado || ', medido ' || medido AS name,
         NULL::uuid AS id, NULL::text AS analysis_status, NULL::int AS extractor_version,
         NULL::boolean AS tiene_full_text, NULL::bigint AS trozos, NULL::int AS vectores_declarados,
         0 AS orden
  FROM control
  UNION ALL
  -- 1 · LOS DOCUMENTOS, uno por fila, con su marca.
  SELECT '1 · documentos', marca, name, id, analysis_status, extractor_version,
         tiene_full_text, trozos, vectores_declarados,
         CASE marca WHEN 'resto' THEN 1 WHEN 'corpus_sin_trozos_fuera_de_criterio' THEN 2
                    WHEN 'corpus_con_trozos' THEN 3 ELSE 4 END
  FROM marcados
) t
ORDER BY bloque, orden, name;
