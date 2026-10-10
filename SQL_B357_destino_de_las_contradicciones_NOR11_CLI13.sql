-- ============================================================================
-- B.357 · ¿EL JUEZ NO DIJO NEGACIÓN, O LO DIJO Y SE LO COMIÓ NUESTRO CÓDIGO?
-- EL DESTINO DE LO QUE EMITIÓ, PAREJA NOR-11 ↔ CLI-13 — SÓLO LECTURA
-- ✅ EJECUTADA la noche del 09 al 10/10/2026, trece minutos antes de que se borraran NOR-11 y NOR-10 (corregido el 10/10/2026). ⚠️ LAS DIEZ FILAS QUE LEYÓ YA NO EXISTEN (B.367). Su resultado está transcrito en claude/consultas-fable/F-123_2026-10-10_orden-de-ejecucion.md, sección 1.3 de la consulta. Sólo SELECT: no escribe nada.
-- Salen recuentos, temas y descripciones (texto que escribe el modelo). NINGUNA
-- cita y ningún texto de documento.
-- ✅ PROBADO ANTES DE ENTREGARLO (09/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): cada columna sale distinta de cero donde la siembra
-- lo pide; quedan fuera otro documento, otra fecha y otra organización; y una
-- pareja sin `discarded` da false, no nulo. Con datos reales no se ha ejecutado.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta, copiado de SQL_F120_P3_rerank_a_cero.sql (convenio del      │
-- │ 05/10/2026). No se mira ninguna otra.                                    │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 09/10/2026): en las pasadas de NOR-11 del 06 al
-- 08/10, ¿dónde acaba cada contradicción que el juez emitió para la pareja con
-- CLI-13? Si en las pasadas sin NEGACIÓN la puerta, la cascada, la frontera y la
-- reclasificación están TODAS a cero, el juez no la dijo. Si hay muertes en la
-- cascada, la dijo y la quitó nuestro código, y el motivo dice en qué etapa.
--
-- LO QUE YA SE SABE (B.357): en la pasada del 07/10 a las 08:53:41 UTC el juez
-- emitió LAS TRES (PLAZO, LUGAR y NEGACIÓN), y LUGAR murió en la puerta. Así que
-- el juez SÍ es capaz de emitir NEGACIÓN en producción. La pregunta no es si
-- puede: es qué pasó en las otras pasadas, si no la dijo o si la dijo y se la
-- comió nuestro código.
--
-- DE DÓNDE SALE CADA COLUMNA. Todo vive en el juicio de la pareja guardado en
-- analysis_results.analysis->'judgments' (pipeline.ts:993; desde el 02/10 con
-- los descartes de la puerta, B.313):
--   · sobreviven: `contradictions` del juicio, después de la puerta y de la
--     cascada. Las de origen diff_tabular no son del juez y se marcan;
--   · publicadas: `discrepancies` y `minorInconsistencies` del análisis con
--     existingDocument = CLI-13. Es lo que vio el director; sirve de cotejo;
--   · puerta: `descartesPorCita` con tipo 'contradiccion', con su tema (hasta 10
--     por pareja) y `descartesPorCitaOmitidos` (diagnostico-de-cita.ts:59-111);
--   · cascada y frontera: las claves de `discarded`, que es un recuento POR
--     MOTIVO, SIN TEMA (pipeline.ts:577-580 funde ahí lo de la puerta, la cascada
--     y el verificador). Lo que mata la cascada:
--       descartado.emparejamiento_invalido (pipeline.ts:328),
--       descartado.<regla determinista> (:347),
--       descartado.cubierto_por_diff (:398),
--       r2.sin_ancla (:453),
--       descartado.<veredicto del verificador Haiku> (verify-findings.ts:244, :253:
--         mismo_dato_sin_oposicion, sin_relacion, sin_veredicto).
--     descartado.equivalentes NO es una muerte: es la RECLASIFICACIÓN a
--     solapamiento (pipeline.ts:490-496), y va en su columna;
--   · reclasificadas: su descripción es el tema de la contradicción, y se
--     añaden al FINAL de los solapamientos del juez, antes de los estructurales
--     (pipeline.ts:630). Se sacan como las N últimas sin `confirmedBy`, con N =
--     descartado.equivalentes;
--   · frontera: claves frontera.* (llm-boundary.ts:87-123). Sólo TIRAN
--     contradicciones contradicciones_no_es_array, elemento_no_objeto y
--     cita_ausente; topic_ausente y severity_invalida las dejan pasar. Las
--     frontera.solapamiento_* son de solapamientos;
--   · el otro frente: `solapamientos_del_juez` son los del juez que PASARON la
--     puerta (sin los estructurales ni los reclasificados); los que la puerta
--     tiró están en `puerta_solapamientos`. `exclusivo` es uniqueToNewDoc;
--   · otras_claves: todo lo demás (a_juicio.*, confirmado.*, verificado.*,
--     contadores de la puerta como citaNoVerificable, que MEZCLAN contradicciones
--     y solapamientos). Van crudas, para que nada quede fuera.
--
-- ⚠️ LO QUE ESTA CONSULTA NO PUEDE DECIR: la cascada guarda CUÁNTAS y POR QUÉ,
-- pero no CUÁL. Si una pasada sin NEGACIÓN tiene una muerte en la cascada, se
-- sabe que hubo una baja y en qué etapa, no que fuera NEGACIÓN. El tema sólo
-- quedó en el log (pipeline.ts:331, :349, :569).
--
-- ⚠️ CONTROLES (bloque 0):
--   · `analisis_nor11` tiene que dar 8 (las cuatro pasadas del 06/10, B.339, y
--     las cuatro del 07/10, B.357). Si da otra cifra, hay análisis de más (el
--     examen también escribe análisis rápidos) o de menos, y hay que decirlo
--     antes de leer el resto;
--   · `con_pareja_cli13` tiene que ser igual: cada pasada juzgó esa pareja;
--   · `con_discarded`: cuántas de esas parejas traen `discarded` guardado. NO SE
--     HA VISTO NUNCA EN UNA FILA (se leyó en types.ts:143 y en el flujo). Si sale
--     0 en las 8, las columnas de cascada y frontera no significan «cero»: no
--     hay dato. Una pareja sin ninguna baja ni confirmación podría no traerlo
--     legítimamente (pipeline.ts:631 sólo lo pone si hay alguna clave), así que
--     el cero en una pasada concreta se lee junto con `otras_claves`.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
analisis AS (
  SELECT ar.id, ar.created_at, ar.analysis
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
    AND ar.document_name ILIKE 'NOR-11%'
    AND ar.created_at >= timestamptz '2026-10-06 00:00:00+02'
    AND ar.created_at <  timestamptz '2026-10-09 00:00:00+02'
),
pareja AS (
  SELECT a.id, a.created_at, a.analysis, j
  FROM analisis a
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(a.analysis->'judgments') = 'array' THEN a.analysis->'judgments' ELSE '[]'::jsonb END) AS j
  WHERE j->>'documentName' ILIKE 'CLI-13%'
),
claves AS (
  SELECT p.id, k.key, k.value::int AS n
  FROM pareja p
  CROSS JOIN LATERAL jsonb_each_text(
    CASE WHEN jsonb_typeof(p.j->'discarded') = 'object' THEN p.j->'discarded' ELSE '{}'::jsonb END) AS k
),
fila AS (
  SELECT
    p.id,
    to_char(p.created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI:SS') || ' UTC' AS hora,
    left(p.id::text, 8) AS analisis,
    -- Publicadas (cotejo)
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.analysis->'discrepancies', '[]'::jsonb)) d
      WHERE d->>'existingDocument' ILIKE 'CLI-13%') AS publicadas_contradiccion,
    (SELECT string_agg(d->>'topic', ' | ') FROM jsonb_array_elements(coalesce(p.analysis->'discrepancies', '[]'::jsonb)) d
      WHERE d->>'existingDocument' ILIKE 'CLI-13%') AS publicadas_temas,
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.analysis->'minorInconsistencies', '[]'::jsonb)) d
      WHERE d->>'existingDocument' ILIKE 'CLI-13%') AS publicadas_menores,
    -- Sobreviven en el juicio
    jsonb_array_length(coalesce(p.j->'contradictions', '[]'::jsonb)) AS sobreviven,
    (SELECT string_agg(c->>'topic' || ' [' || coalesce(c->>'severity', '?')
              || CASE WHEN c->>'origen' = 'diff_tabular' THEN ', diff' ELSE '' END || ']', ' | ')
       FROM jsonb_array_elements(coalesce(p.j->'contradictions', '[]'::jsonb)) c) AS sobreviven_temas,
    -- Puerta de citas
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'descartesPorCita', '[]'::jsonb)) d
      WHERE d->>'tipo' = 'contradiccion') AS puerta,
    (SELECT string_agg(d->>'tema' || ' [falló ' || coalesce(d->>'ladoFallido', '?') || ']', ' | ')
       FROM jsonb_array_elements(coalesce(p.j->'descartesPorCita', '[]'::jsonb)) d
      WHERE d->>'tipo' = 'contradiccion') AS puerta_temas,
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'descartesPorCita', '[]'::jsonb)) d
      WHERE d->>'tipo' = 'solapamiento') AS puerta_solapamientos,
    coalesce((p.j->>'descartesPorCitaOmitidos')::int, 0) AS puerta_omitidos,
    -- Cascada
    coalesce((SELECT sum(n) FROM claves k WHERE k.id = p.id
               AND ((k.key LIKE 'descartado.%' AND k.key <> 'descartado.equivalentes') OR k.key = 'r2.sin_ancla')), 0) AS cascada,
    (SELECT string_agg(k.key || '=' || k.n, ', ' ORDER BY k.key) FROM claves k WHERE k.id = p.id
      AND ((k.key LIKE 'descartado.%' AND k.key <> 'descartado.equivalentes') OR k.key = 'r2.sin_ancla')) AS cascada_motivos,
    -- Reclasificación
    coalesce((SELECT n FROM claves k WHERE k.id = p.id AND k.key = 'descartado.equivalentes'), 0) AS reclasificadas,
    -- Frontera
    coalesce((SELECT sum(n) FROM claves k WHERE k.id = p.id
               AND k.key IN ('frontera.contradicciones_no_es_array', 'frontera.elemento_no_objeto', 'frontera.cita_ausente')), 0) AS frontera_tiradas,
    (SELECT string_agg(k.key || '=' || k.n, ', ' ORDER BY k.key) FROM claves k WHERE k.id = p.id
      AND k.key LIKE 'frontera.%') AS frontera_todas,
    -- El otro frente: lo que guarda el juicio de solapamientos y de contenido exclusivo
    -- Los del juez que pasaron la puerta: los que no son estructurales, menos los
    -- reclasificados, que también llegan sin confirmedBy (pipeline.ts:496).
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'overlappingContent', '[]'::jsonb)) o
      WHERE o->>'confirmedBy' IS NULL)
      - coalesce((SELECT n FROM claves k WHERE k.id = p.id AND k.key = 'descartado.equivalentes'), 0) AS solapamientos_del_juez,
    (SELECT count(*) FROM jsonb_array_elements(coalesce(p.j->'overlappingContent', '[]'::jsonb)) o
      WHERE o->>'confirmedBy' = 'estructura') AS solapamientos_estructurales,
    jsonb_array_length(coalesce(p.j->'uniqueToNewDoc', '[]'::jsonb)) AS exclusivo,
    -- El control
    coalesce(jsonb_typeof(p.j->'discarded') = 'object', false) AS trae_discarded,
    (SELECT string_agg(k.key || '=' || k.n, ', ' ORDER BY k.key) FROM claves k WHERE k.id = p.id
      AND NOT ((k.key LIKE 'descartado.%') OR k.key = 'r2.sin_ancla' OR k.key LIKE 'frontera.%')) AS otras_claves,
    p.j
  FROM pareja p
),
reclasificadas AS (
  -- Las N últimas entradas sin confirmedBy son las reclasificadas (pipeline.ts:630).
  SELECT f.id, string_agg(x.o->>'description', ' | ' ORDER BY x.pos) AS descripciones
  FROM fila f
  CROSS JOIN LATERAL (
    SELECT o, row_number() OVER (ORDER BY ord DESC) AS desde_el_final, ord AS pos
    FROM jsonb_array_elements(coalesce(f.j->'overlappingContent', '[]'::jsonb)) WITH ORDINALITY AS e(o, ord)
    WHERE o->>'confirmedBy' IS NULL
  ) x
  WHERE f.reclasificadas > 0 AND x.desde_el_final <= f.reclasificadas
  GROUP BY f.id
)
-- 0 · CONTROL
SELECT '0 · control' AS bloque, NULL AS hora, NULL AS analisis,
       'analisis_nor11=' || (SELECT count(*) FROM analisis)
       || ' · con_pareja_cli13=' || (SELECT count(*) FROM pareja)
       || ' · con_discarded=' || (SELECT count(*) FROM fila WHERE trae_discarded)
       || ' · con_descartesPorCita=' || (SELECT count(*) FROM pareja WHERE jsonb_typeof(j->'descartesPorCita') = 'array') AS resumen,
       NULL::bigint AS publicadas_contradiccion, NULL AS publicadas_temas, NULL::bigint AS publicadas_menores,
       NULL::int AS sobreviven, NULL AS sobreviven_temas,
       NULL::bigint AS puerta, NULL AS puerta_temas, NULL::int AS puerta_omitidos, NULL::bigint AS puerta_solapamientos,
       NULL::bigint AS cascada, NULL AS cascada_motivos,
       NULL::int AS reclasificadas, NULL AS reclasificadas_descripciones,
       NULL::bigint AS frontera_tiradas, NULL AS frontera_todas,
       NULL::bigint AS solapamientos_del_juez, NULL::bigint AS solapamientos_estructurales, NULL::int AS exclusivo,
       NULL::boolean AS trae_discarded, NULL AS otras_claves
UNION ALL
-- 1 · UNA FILA POR PASADA
SELECT '1 · pasada', f.hora, f.analisis, NULL,
       f.publicadas_contradiccion, f.publicadas_temas, f.publicadas_menores,
       f.sobreviven, f.sobreviven_temas,
       f.puerta, f.puerta_temas, f.puerta_omitidos, f.puerta_solapamientos,
       f.cascada, f.cascada_motivos,
       f.reclasificadas, r.descripciones,
       f.frontera_tiradas, f.frontera_todas,
       f.solapamientos_del_juez, f.solapamientos_estructurales, f.exclusivo,
       f.trae_discarded, f.otras_claves
FROM fila f
LEFT JOIN reclasificadas r ON r.id = f.id
ORDER BY bloque, hora;
