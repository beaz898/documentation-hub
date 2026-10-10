-- ============================================================================
-- F-120 · P2 · ¿PÉRDIDA O RECLASIFICACIÓN? — SÓLO LECTURA
-- ✅ EJECUTADA por el director el 06/10/2026 (corregido el 10/10/2026); resultado en claude/consultas-fable/F-120_2026-10-06_frente-4-reclasificado.md:432-433. Sólo SELECT: no escribe nada.
-- ⚠️ LEE CONTENIDO DE DOCUMENTOS (las citas): el resultado lo mira el arquitecto y
--    no se copia a ningún registro ni a ninguna ficha.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA: es el encargo de medición de Fable en su respuesta a F-120, P2.
-- En la pasada del 05/10 guardada a las 12:07:22 de Madrid, el juez emitió 1
-- contradicción contra CLI-13 donde las otras tres pasadas emitieron 3. Faltan
-- «Ubicación del punto de retirada centralizado» y «Color del contenedor para
-- residuos grupo III no punzantes». ¿Están entre los 5 solapamientos de esa
-- pasada, o no están en absoluto? Una reclasificación no es una pérdida.
--
-- ⚠️ PREDICCIÓN DE FABLE, escrita antes de ejecutar: las dos contradicciones
-- aparecerán como EXAMINADAS o como SOLAPAMIENTOS RECLASIFICADOS, no como ausentes.
--
-- QUÉ SALE, en una sola tabla, por la columna `que`:
--   · «juez · contradicción» y «juez · solapamiento»: lo que emitió el juez y pasó
--     la puerta de citas (los juicios guardados). Un solapamiento estructural lleva
--     su `confirmedBy` entre paréntesis;
--   · «descartado por cita · …»: lo que el juez emitió y la puerta tiró
--     (`descartesPorCita`, B.313);
--   · «publicado · …»: lo que quedó después de la cascada, que es donde una
--     contradicción puede pasar a solapamiento (la regla de equivalencia).
-- Se compara por el tema Y por las citas, no sólo por el título.
--
-- ⚠️ LA VENTANA. El registro guarda la hora de FINAL del análisis (B.82): ésta
-- terminó a las 12:07:22 de Madrid, que son las 10:07:22 UTC, y la ventana va de
-- 10:07:00 a 10:08:00 UTC. SI NO SALE NADA, se ensancha cambiando las dos horas
-- de la línea `BETWEEN` —por ejemplo, de 10:05:00 a 10:10:00— y se comprueba con
-- la columna `guardado_madrid` que la fila es la de NOR-11 contra el corpus.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
pasada AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
    AND ar.created_at BETWEEN timestamptz '2026-10-05 10:07:00+00' AND timestamptz '2026-10-05 10:08:00+00'
),
j AS (
  SELECT p.id, p.created_at, p.document_name, x AS juicio
  FROM pasada p,
       jsonb_array_elements(CASE WHEN jsonb_typeof(p.analysis->'judgments') = 'array' THEN p.analysis->'judgments' ELSE '[]'::jsonb END) x
  WHERE x->>'documentName' ILIKE 'CLI-13%'
)
SELECT to_char(t.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') AS guardado_madrid,
       t.document_name AS analizado, t.que, t.tema, t.cita_nuevo, t.cita_existente
FROM (
  SELECT j.created_at, j.document_name, 'juez · contradicción' AS que,
         c->>'topic' AS tema, c->>'newDocSays' AS cita_nuevo, c->>'existingDocSays' AS cita_existente
  FROM j, jsonb_array_elements(coalesce(j.juicio->'contradictions', '[]'::jsonb)) c
  UNION ALL
  SELECT j.created_at, j.document_name, 'juez · solapamiento' || coalesce(' (' || (o->>'confirmedBy') || ')', ''),
         o->>'description', o->>'evidenceInNewDoc', o->>'evidence'
  FROM j, jsonb_array_elements(coalesce(j.juicio->'overlappingContent', '[]'::jsonb)) o
  UNION ALL
  SELECT j.created_at, j.document_name, 'descartado por cita · ' || (d->>'tipo'),
         d->>'tema', d->>'citaNuevo', d->>'citaExistente'
  FROM j, jsonb_array_elements(coalesce(j.juicio->'descartesPorCita', '[]'::jsonb)) d
  UNION ALL
  SELECT p.created_at, p.document_name, 'publicado · contradicción',
         x->>'topic', x->>'newDocSays', x->>'existingDocSays'
  FROM pasada p, jsonb_array_elements(coalesce(p.analysis->'discrepancies', '[]'::jsonb)) x
  WHERE x->>'existingDocument' ILIKE 'CLI-13%'
  UNION ALL
  SELECT p.created_at, p.document_name, 'publicado · inconsistencia menor',
         x->>'topic', x->>'newDocSays', x->>'existingDocSays'
  FROM pasada p, jsonb_array_elements(coalesce(p.analysis->'minorInconsistencies', '[]'::jsonb)) x
  WHERE x->>'existingDocument' ILIKE 'CLI-13%'
  UNION ALL
  SELECT p.created_at, p.document_name, 'publicado · solapamiento',
         x->>'description', x->>'textRef', NULL
  FROM pasada p, jsonb_array_elements(coalesce(p.analysis->'overlaps', '[]'::jsonb)) x
  WHERE x->>'existingDocument' ILIKE 'CLI-13%'
) t
ORDER BY t.created_at, t.que, t.tema;
