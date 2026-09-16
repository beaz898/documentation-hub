-- ════════════════════════════════════════════════════════════════════════
-- SQL_A2A4_compuerta.sql — LA COMPUERTA DE LA TANDA A2/A4 (16/09/2026)
--
-- SOLO LEE. No escribe, no borra, no cambia ningún estado.
--
-- Se ejecuta DOS veces:
--   · en el paso 5, tras el análisis RÁPIDO de SAT-A desde la bandeja
--     → decide si se gastan los 30 créditos del exhaustivo
--   · en el paso 9, al final, para tener las cuatro pasadas juntas
--
-- Lo que hay que mirar en el paso 5, en la fila de SAT-A:
--   seleccionados = 6      → el tope CORTÓ.  Se lanza el exhaustivo.
--   seleccionados < 6      → el tope no cortó. NO se lanza: no mediría nada.
--   recuperados  <= 6      → el documento no saturó. NO se lanza; se rehace.
--   recuperados  =  0      → no midió. No concluye nada.
-- ════════════════════════════════════════════════════════════════════════

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,                                        -- 'quick' | 'exhaustive'
  ar.contradictions_found,
  ar.overlaps_found,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int   as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int as seleccionados,
  -- de quién es el análisis: documento (bandeja) o fichero subido (chat)
  ar.document_id,
  ar.storage_path
from analysis_results ar
where ar.created_at > now() - interval '1 day'
  and ar.document_name ilike 'SAT-%'
order by ar.created_at desc;

-- ── COMPROBACIÓN DEL MONTAJE, antes del paso 4 ─────────────────────────
-- Debe decir 43 documentos, y SAT-A entre los 'pendiente'.
-- ⚠️ Si alguno que no esperabas sale 'analizado', ese compite como candidato
--    en todos los análisis, y no hay forma de devolverlo a 'pendiente'.

select analysis_status, count(*) as documentos
from documents
where org_id = '<ORG_ID>'
group by analysis_status
order by documentos desc;

select name, analysis_status, source, created_at
from documents
where org_id = '<ORG_ID>'
  and analysis_status = 'analizado'
order by created_at desc;
