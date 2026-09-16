-- ════════════════════════════════════════════════════════════════════════
-- SQL_B251_pasada_CLI20.sql — ¿QUÉ DESCARTÓ AL TERCER CANDIDATO? (16/09/2026)
--
-- SOLO LEE. Sustituir <ORG_ID>.
--
-- La pantalla dijo: «Se compararon los 2 documentos más afines a éste. Otro
-- tiene menor afinidad…». O sea 3 recuperados y 2 comparados, con un tope de 6
-- que NO puede haber cortado nada.
--
-- Estas consultas dicen cuál de las tres vías se llevó al tercero — y, sobre
-- todo, si el contador del tope está en cero, que es lo que decide si el aviso
-- atribuyó bien la causa.
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · LOS CUATRO CONTADORES DE ESA PASADA ────────────────────────────
--
-- CÓMO SE LEE, escrito antes de verlo:
--   cortados_por_tope = 0  → el tope NO fue. El tercero cayó ANTES, por el
--                            criterio del modelo o por un desajuste de id, y
--                            esas dos NO se distinguen hoy (ver B.251).
--   cortados_por_tope > 0  → el tope sí cortó, y entonces el aviso dice la
--                            verdad y lo que falla es nuestra aritmética.
--   sin_confianza > 0      → además, el modelo no valoró a alguno.

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int      as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int    as seleccionados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int as cortados_por_tope,
  (ar.pipeline_counters ->> 'seleccion.candidatos_sin_confianza')::int    as sin_confianza,
  -- Lo que el aviso de pantalla llamó «con menor afinidad».
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
    - (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int as lo_que_el_aviso_conto
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.document_name ilike 'CLI-20%'
order by ar.created_at desc
limit 5;


-- ── 2 · CONTRA QUIÉN SE COMPARÓ DE VERDAD ──────────────────────────────
-- `involved_documents` son los que DIERON HALLAZGO (cota inferior, ver
-- SQL_B249). Si aquí sale OPE-11, confirma en la base lo que el resumen dijo
-- en pantalla: un tarifario de precios fue candidato de un protocolo clínico.

select ar.created_at, ar.document_name, ar.involved_documents, ar.overlaps_found
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.document_name ilike 'CLI-20%'
order by ar.created_at desc
limit 5;


-- ── 3 · ⚠️ CUÁNTOS DOCUMENTOS SON ELEGIBLES HOY ────────────────────────
-- Tres candidatos exigen al menos tres documentos `analizado` además de
-- CLI-20. Llevamos tres días diciendo «uno o dos»; esto dice cuántos hay de
-- verdad, y quiénes son.

select analysis_status, count(*) as documentos
from documents
where org_id = '<ORG_ID>'
group by analysis_status;

select name, analysis_status, reviewed_at
from documents
where org_id = '<ORG_ID>'
  and analysis_status = 'analizado'
order by reviewed_at nulls last;
