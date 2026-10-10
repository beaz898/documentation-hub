-- ============================================================================
-- B.358 · LAS CITAS CRUZADAS: ¿FALLÓ UN LADO O LOS DOS? — SÓLO LECTURA
-- ✅ EJECUTADA por el director el 08/10/2026 (corregido el 10/10/2026); resultado en Puntos_Pendientes_Doclity.txt:8121-8125 (B.358) y la fila literal en F-122:93-96. Sólo SELECT: no escribe nada.
-- Lee citas y textos de documentos POR DENTRO para compararlos, pero el
-- resultado son SÓLO RECUENTOS: ni una cita sale en la salida.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta, copiado de SQL_F120_P3_rerank_a_cero.sql (convenio del      │
-- │ 05/10/2026). No se mira ninguna otra.                                    │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 08/10/2026): antes de «intercambiar la atribución»
-- de las cruzadas (F-121, P6), ¿cuántas tienen un solo lado cruzado y cuántas
-- los dos? Si falló UN lado y su cita está en el otro documento, el otro lado se
-- verificó en SU propio documento: las dos citas son del MISMO documento y no
-- hay atribución que intercambiar. Sólo cuando fallan LOS DOS y cada cita está
-- en el documento del otro hay un intercambio posible.
--
-- POR QUÉ HACE FALTA RECALCULAR: la etiqueta «cruzada» la escribe
-- `diagnosticoDelDescarte` (lib/analysis/diagnostico-de-cita.ts:26-37) SÓLO en la
-- línea de log. Lo que se guarda de cada descarte (`descartesPorCita`,
-- lib/analysis/types.ts:161-175) lleva las dos citas, el lado que falló y, por
-- lado, si se verificó, el paso, la longitud y el pajar — pero NO la marca de
-- cruzada. Aquí se recalcula.
--
-- ⚠️ ES UNA APROXIMACIÓN, Y TIENE SU CONTROL POSITIVO DENTRO:
--   · la normalización imita la de `normalize()` (lib/analysis/normalize-core.mjs:
--     81-87): minúsculas, fuera . , ; : ! ? " ' « » ( ) [ ] { } - — – … * _ # ` ~,
--     espacios colapsados. NO es `buscarCita`: no hay paso de cabeza y cola, y
--     como la puerta sólo acepta literal o normalizada desde B.318, no hace falta;
--   · se busca en el DOCUMENTO entero (full_text, o sus trozos de la generación
--     activa si no tiene), NO en lo que se le entregó al juez. Una cita que el
--     juez no tenía delante pero que está en el documento sale aquí como
--     «está en su documento»: la columna `fallido_pero_esta_en_su_documento` lo
--     cuenta;
--   · ⚠️ EL CONTROL: el lado que SÍ se verificó tiene que aparecer en su propio
--     documento. `verificado_no_encontrado` cuenta los que la aproximación no
--     encuentra. Si no es 0, la aproximación pierde casos y sus «no está en el
--     otro» no valen.
--
-- CONTROLES DE COBERTURA:
--   · `sin_texto`: descartes donde falta el texto de algún documento (el
--     analizado se busca por `document_id` y, si no lo tiene, por su nombre
--     sólo si el nombre es único en la organización). Ésos no se clasifican;
--   · `omitidos_por_tope`: los descartes que no se guardaron porque la pareja
--     pasó de 10 (`descartesPorCitaOmitidos`, diagnostico-de-cita.ts:62). No
--     están en ninguna fila de aquí;
--   · `con_barra`: descartes con «|» en alguna de sus dos citas. Son filas de
--     tabla, que la puerta puede verificar por SEGMENTOS (verifyQuote,
--     judge.ts:276-306) y no como texto seguido: con ellas el control positivo
--     fallaría sin que la aproximación esté mal. Se cuentan y NO se clasifican.
--     La pregunta de la cruzada es de prosa.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
-- El texto de un documento: full_text, o sus trozos de la generación activa.
texto_doc AS (
  SELECT d.id, d.name,
         coalesce(nullif(d.full_text, ''),
                  (SELECT string_agg(c.text, ' ' ORDER BY c.chunk_index)
                     FROM public.document_chunks c
                    WHERE c.document_id = d.id AND c.generation = d.active_generation)) AS texto
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
),
nombres_unicos AS (
  SELECT name, (array_agg(id))[1] AS id FROM texto_doc GROUP BY name HAVING count(*) = 1
),
analisis AS (
  SELECT ar.id, coalesce(ar.document_id, nu.id) AS nuevo_id, j
  FROM public.analysis_results ar
  CROSS JOIN piloto
  LEFT JOIN nombres_unicos nu ON nu.name = ar.document_name
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j
  WHERE ar.org_id = piloto.org
    AND ar.created_at >= timestamptz '2026-10-02 00:00:00+02'
),
descartes AS (
  SELECT a.id AS analisis_id,
         d->>'ladoFallido' AS lado_fallido,
         d->>'citaNuevo' AS cita_nuevo, d->>'citaExistente' AS cita_existente,
         tn.texto AS texto_nuevo, te.texto AS texto_existente
  FROM analisis a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(a.j->'descartesPorCita') = 'array' THEN a.j->'descartesPorCita' ELSE '[]'::jsonb END) d
  LEFT JOIN texto_doc tn ON tn.id = a.nuevo_id
  LEFT JOIN texto_doc te ON te.id::text = a.j->>'documentId'
),
-- La normalización: la de normalize(), más el puntero de fila [F3] despegado.
norm AS (
  SELECT analisis_id, lado_fallido,
         (texto_nuevo IS NULL OR texto_existente IS NULL) AS sin_texto,
         (strpos(coalesce(cita_nuevo, '') || coalesce(cita_existente, ''), '|') > 0) AS con_barra,
         btrim(regexp_replace(translate(lower(regexp_replace(coalesce(cita_nuevo, ''), '^\[F[0-9]+\]\s*', '')),
               '.,;:!?"''«»()[]{}-—–…*_#`~', ''), '\s+', ' ', 'g')) AS cn,
         btrim(regexp_replace(translate(lower(regexp_replace(coalesce(cita_existente, ''), '^\[F[0-9]+\]\s*', '')),
               '.,;:!?"''«»()[]{}-—–…*_#`~', ''), '\s+', ' ', 'g')) AS ce,
         btrim(regexp_replace(translate(lower(coalesce(texto_nuevo, '')),
               '.,;:!?"''«»()[]{}-—–…*_#`~', ''), '\s+', ' ', 'g')) AS tn,
         btrim(regexp_replace(translate(lower(coalesce(texto_existente, '')),
               '.,;:!?"''«»()[]{}-—–…*_#`~', ''), '\s+', ' ', 'g')) AS te
  FROM descartes
),
clasif AS (
  SELECT *,
         (length(cn) >= 8 AND strpos(tn, cn) > 0) AS nuevo_en_nuevo,
         (length(cn) >= 8 AND strpos(te, cn) > 0) AS nuevo_en_existente,
         (length(ce) >= 8 AND strpos(te, ce) > 0) AS existente_en_existente,
         (length(ce) >= 8 AND strpos(tn, ce) > 0) AS existente_en_nuevo
  FROM norm
),
omitidos AS (
  SELECT coalesce(sum((a.j->>'descartesPorCitaOmitidos')::int), 0) AS n FROM analisis a
)
SELECT
  count(*)                                                                         AS descartes,
  count(*) FILTER (WHERE sin_texto)                                                AS sin_texto,
  count(*) FILTER (WHERE NOT sin_texto AND con_barra)                              AS con_barra,
  (SELECT n FROM omitidos)                                                         AS omitidos_por_tope,
  -- B1 · cuántos con un lado y cuántos con los dos
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND lado_fallido = 'nuevo')                 AS fallo_solo_nuevo,
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND lado_fallido = 'existente')             AS fallo_solo_existente,
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND lado_fallido = 'ambos')                 AS fallaron_los_dos,
  -- B2 · un lado, y su cita está en el OTRO documento: las dos son del mismo
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND lado_fallido = 'nuevo' AND nuevo_en_existente)         AS un_lado_cruzado_nuevo,
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND lado_fallido = 'existente' AND existente_en_nuevo)     AS un_lado_cruzado_existente,
  -- B3 · los dos: cada una en el documento del otro (candidatas a intercambio)
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND lado_fallido = 'ambos'
                     AND nuevo_en_existente AND existente_en_nuevo)                AS los_dos_cruzados,
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND lado_fallido = 'ambos'
                     AND (nuevo_en_existente <> existente_en_nuevo))               AS los_dos_fallan_uno_cruzado,
  -- Cobertura de la aproximación
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND (
      (lado_fallido IN ('nuevo', 'ambos') AND nuevo_en_nuevo)
   OR (lado_fallido IN ('existente', 'ambos') AND existente_en_existente)))        AS fallido_pero_esta_en_su_documento,
  -- ⚠️ EL CONTROL POSITIVO: tiene que dar 0
  count(*) FILTER (WHERE NOT sin_texto AND NOT con_barra AND (
      (lado_fallido = 'nuevo' AND NOT existente_en_existente)
   OR (lado_fallido = 'existente' AND NOT nuevo_en_nuevo)))                        AS verificado_no_encontrado
FROM clasif;
