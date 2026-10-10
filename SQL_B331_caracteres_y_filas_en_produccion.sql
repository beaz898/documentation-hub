-- ============================================================================
-- B.331 · COMILLAS CURVAS, MENOS TIPOGRÁFICO Y FILAS CON BARRA, EN LOS DOCUMENTOS
-- Y LAS CITAS REALES DE LA ORGANIZACIÓN DEL PILOTO — SÓLO LECTURA
-- ✅ EJECUTADA el 05/10/2026 (corregido el 10/10/2026); resultado en Puntos_Pendientes_Doclity.txt:7505 (B.333). Sólo SELECT: no escribe nada.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- POR QUÉ (arquitecto, 05/10/2026): las dos medidas de hoy sobre el archivo del
-- examen dieron cero porque allí no hay población: ni una comilla curva en 624
-- lados de cita ni en sus 27 documentos, y ninguna tabla de Word. Esto lo mide
-- sobre los documentos y las citas de verdad. Ninguna de las tres decide nada
-- sobre `normalize()`: la c) dice cuánto vale arreglar las tablas de Word en el
-- extractor.
--
-- LOS CARACTERES, por su código y no pegados, para que no los cambie un editor:
--   chr(8220) “   chr(8221) ”   chr(8216) ‘   chr(8217) ’   chr(8722) − (U+2212)
--   y la barra «|». Hoy `normalize()` no quita ninguno de los seis
--   (`lib/analysis/normalize-core.mjs:84`).
--
-- QUÉ SE PUEDE MEDIR Y QUÉ NO, dicho antes de los números:
--   · a) Se mide entero: `documents.full_text` y `document_chunks.text` (sólo la
--     generación activa, que es la que lee el análisis). La extensión sale del
--     nombre del documento.
--   · b) y c) — LAS CITAS DESCARTADAS SE GUARDAN EN CRUDO: `descartesPorCita`
--     lleva `citaNuevo` y `citaExistente` tal como las emitió el juez y pasaron
--     la frontera, sin recortar (`lib/analysis/judge.ts:453` y `:504`;
--     `lib/analysis/diagnostico-de-cita.ts`). Viven en
--     `analysis_results.analysis -> judgments[] -> descartesPorCita[]`.
--     ⚠️ DOS LÍMITES, y no se aproximan:
--       1. sólo existen en los análisis guardados DESPUÉS del despliegue de B.313
--          (commit `eb0a0033`, del 02/10/2026 a las 12:47 de Madrid; se desplegó
--          al subirlo, más tarde, y la hora exacta no consta en el repositorio).
--          Los anteriores no traen la lista, y no se pueden reconstruir;
--       2. se guardan como mucho 10 por pareja. Los que no caben sólo se cuentan
--          en `descartesPorCitaOmitidos`, sin su cita: aquí salen como una cifra
--          aparte, y no entran en ningún reparto.
--   · b) LAS CITAS QUE PASARON la puerta son las de los juicios guardados
--     (`judgments[].contradictions` y `judgments[].overlappingContent` sin
--     `confirmedBy`), la misma etapa que los descartes. Se guardan tal como las
--     emitió el juez, menos el puntero de fila «[F3]», que la puerta despega.
--     No son lo que vio el usuario: la cascada y el double-check filtran después.
--   · LOS PASOS: un lado que FALLÓ sólo puede llevar un paso de fallo
--     (`sin_coincidencia`, `sin_cabeza`, `cabeza_sin_cola`, `cola_demasiado_lejos`,
--     `cabeza_y_cola`, `vacia_o_corta`). `literal` y `normalizada` son vías por
--     las que se PASA, y en un descarte sólo aparecen en el lado que sí se
--     verificó. Por eso el reparto separa los lados que fallaron de los que no.
--   · SE CUENTA POR LADO DE CITA, y cada análisis cuenta aparte: si el mismo
--     documento se analizó cinco veces, su cita sale cinco veces. La columna
--     `distintas` cuenta los textos de cita distintos.
--
-- UNA SOLA CONSULTA: la constante se escribe una vez y el editor de Supabase,
-- que sólo enseña el último resultado, lo enseña todo. Se lee por `bloque`.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
signos AS (
  SELECT '[' || chr(8220) || chr(8221) || chr(8216) || chr(8217) || ']' AS curvas,
         chr(8722)                                                     AS menos
),
ext AS (
  SELECT d.id, d.name, d.analysis_status, d.active_generation, d.full_text,
         coalesce(lower(substring(d.name FROM '\.([A-Za-z0-9]+)$')), 'sin_extension') AS extension
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org
),

-- ── a) LOS TEXTOS ────────────────────────────────────────────────────────────
a_docs AS (
  SELECT e.extension,
         count(*)                                                                       AS documentos,
         count(*) FILTER (WHERE e.analysis_status = 'analizado')                        AS en_el_corpus,
         count(*) FILTER (WHERE e.full_text ~ s.curvas)                                 AS con_curvas,
         count(*) FILTER (WHERE strpos(e.full_text, s.menos) > 0)                       AS con_menos,
         count(*) FILTER (WHERE e.analysis_status = 'analizado' AND e.full_text ~ s.curvas) AS corpus_con_curvas,
         count(*) FILTER (WHERE e.analysis_status = 'analizado' AND strpos(e.full_text, s.menos) > 0) AS corpus_con_menos
  FROM ext e, signos s
  GROUP BY e.extension
),
a_trozos AS (
  SELECT e.extension,
         count(*)                                                AS trozos,
         count(*) FILTER (WHERE c.text ~ s.curvas)               AS con_curvas,
         count(*) FILTER (WHERE strpos(c.text, s.menos) > 0)     AS con_menos
  FROM ext e
  JOIN public.document_chunks c ON c.document_id = e.id AND c.generation = e.active_generation
  CROSS JOIN signos s
  GROUP BY e.extension
),

-- ── b) y c) LAS CITAS ────────────────────────────────────────────────────────
analisis AS (
  SELECT ar.id, ar.document_name,
         coalesce(lower(substring(ar.document_name FROM '\.([A-Za-z0-9]+)$')), 'sin_extension') AS ext_nuevo,
         j
  FROM public.analysis_results ar, piloto,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j
  WHERE ar.org_id = piloto.org
),
-- Las citas que pasaron la puerta, una fila por lado.
publicadas AS (
  SELECT 'contradiccion' AS tipo, 'nuevo' AS lado, c->>'newDocSays' AS cita FROM analisis a,
         jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'contradictions') = 'array' THEN a.j->'contradictions' ELSE '[]'::jsonb END) c
  UNION ALL
  SELECT 'contradiccion', 'existente', c->>'existingDocSays' FROM analisis a,
         jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'contradictions') = 'array' THEN a.j->'contradictions' ELSE '[]'::jsonb END) c
  UNION ALL
  SELECT 'solapamiento', 'nuevo', o->>'evidenceInNewDoc' FROM analisis a,
         jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'overlappingContent') = 'array' THEN a.j->'overlappingContent' ELSE '[]'::jsonb END) o
         WHERE o->>'confirmedBy' IS NULL
  UNION ALL
  SELECT 'solapamiento', 'existente', o->>'evidence' FROM analisis a,
         jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'overlappingContent') = 'array' THEN a.j->'overlappingContent' ELSE '[]'::jsonb END) o
         WHERE o->>'confirmedBy' IS NULL
),
-- Los descartes guardados, una fila por lado, con la extensión del documento de
-- ESE lado: el nuevo es el analizado; el existente, el candidato del juicio.
descartes AS (
  SELECT d->>'tipo' AS tipo, 'nuevo' AS lado, d->>'citaNuevo' AS cita,
         a.ext_nuevo AS extension,
         (d->'nuevo'->>'verificada')::boolean AS verificada, d->'nuevo'->>'paso' AS paso
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'descartesPorCita') = 'array' THEN a.j->'descartesPorCita' ELSE '[]'::jsonb END) d
  UNION ALL
  SELECT d->>'tipo', 'existente', d->>'citaExistente',
         coalesce(lower(substring(a.j->>'documentName' FROM '\.([A-Za-z0-9]+)$')), 'sin_extension'),
         (d->'existente'->>'verificada')::boolean, d->'existente'->>'paso'
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'descartesPorCita') = 'array' THEN a.j->'descartesPorCita' ELSE '[]'::jsonb END) d
),
omitidos AS (
  SELECT coalesce(sum((a.j->>'descartesPorCitaOmitidos')::int), 0) AS n,
         count(DISTINCT a.id) FILTER (WHERE jsonb_typeof(a.j->'descartesPorCita') = 'array') AS analisis_con_descartes
  FROM analisis a
)

SELECT bloque, desglose, medida, valor
FROM (
  -- a) por extensión: documentos y trozos con curvas o con el menos.
  SELECT 'a · textos' AS bloque, ad.extension AS desglose,
         'documentos · en el corpus · con curvas · con menos · corpus con curvas · corpus con menos' AS medida,
         concat_ws(' · ', ad.documentos, ad.en_el_corpus, ad.con_curvas, ad.con_menos, ad.corpus_con_curvas, ad.corpus_con_menos) AS valor
  FROM a_docs ad
  UNION ALL
  SELECT 'a · trozos (generación activa)', at.extension,
         'trozos · con curvas · con menos',
         concat_ws(' · ', at.trozos, at.con_curvas, at.con_menos)
  FROM a_trozos at

  UNION ALL
  -- b) citas que pasaron la puerta, con curvas o con el menos.
  SELECT 'b · citas que pasaron', p.tipo || ' / ' || p.lado,
         'lados · con curvas · con menos · distintas con curvas o menos',
         concat_ws(' · ', count(*),
                   count(*) FILTER (WHERE p.cita ~ s.curvas),
                   count(*) FILTER (WHERE strpos(p.cita, s.menos) > 0),
                   count(DISTINCT p.cita) FILTER (WHERE p.cita ~ s.curvas OR strpos(p.cita, s.menos) > 0))
  FROM publicadas p, signos s
  GROUP BY p.tipo, p.lado

  UNION ALL
  -- b) citas descartadas con curvas o con el menos, por lado verificado o no y
  --    por paso.
  SELECT 'b · citas descartadas', d.tipo || ' / ' || d.lado || ' / ' ||
         CASE WHEN d.verificada THEN 'lado que pasó' ELSE 'lado que falló' END || ' / ' || coalesce(d.paso, 'sin_paso'),
         'lados · con curvas · con menos · distintas con curvas o menos',
         concat_ws(' · ', count(*),
                   count(*) FILTER (WHERE d.cita ~ s.curvas),
                   count(*) FILTER (WHERE strpos(d.cita, s.menos) > 0),
                   count(DISTINCT d.cita) FILTER (WHERE d.cita ~ s.curvas OR strpos(d.cita, s.menos) > 0))
  FROM descartes d, signos s
  GROUP BY d.tipo, d.lado, d.verificada, d.paso

  UNION ALL
  -- c) citas descartadas con barra, por extensión del documento de ese lado,
  --    lado verificado o no, y paso. Se marcan las de .docx y .md.
  SELECT 'c · descartadas con barra',
         CASE WHEN d.extension IN ('docx', 'md') THEN '★ ' ELSE '' END || d.extension || ' / ' ||
         CASE WHEN d.verificada THEN 'lado que pasó' ELSE 'lado que falló' END || ' / ' || coalesce(d.paso, 'sin_paso'),
         'lados con barra · distintas',
         concat_ws(' · ', count(*), count(DISTINCT d.cita))
  FROM descartes d
  WHERE strpos(d.cita, '|') > 0
  GROUP BY d.extension, d.verificada, d.paso

  UNION ALL
  -- El denominador de b) y c): de cuántos análisis salen, y cuántos descartes
  -- se quedaron fuera del tope sin su cita.
  SELECT 'denominador', 'descartes guardados',
         'análisis con descartes guardados · descartes omitidos por el tope (sin cita)',
         concat_ws(' · ', o.analisis_con_descartes, o.n)
  FROM omitidos o
) t
ORDER BY bloque, desglose;
