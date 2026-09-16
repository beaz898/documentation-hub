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

-- ════════════════════════════════════════════════════════════════════════
-- AÑADIDO EL 16/09/2026 — LA POBLACIÓN DE B.241, Y VA PRIMERO
--
-- Cuesta cero y decide si la ficha tiene fundamento antes de fabricar nada.
--
-- Si max_seleccionados del 'exhaustive' es MENOR QUE 7, el tope de 25 no ha
-- mordido nunca: B.241 nace con población y no con memoria.
-- Si alguna pasada llegó a 7 o más, la ficha nace falsada y se dice.
-- ════════════════════════════════════════════════════════════════════════

select analysis_type,
       count(*)                                                              as pasadas,
       max((pipeline_counters ->> 'seleccion.candidatos_recuperados')::int)   as max_recuperados,
       max((pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int) as max_seleccionados
from analysis_results
where org_id = '<ORG_ID>' and pipeline_counters is not null
group by analysis_type;

-- ── EL VOLUMEN DEL CENSO DE VECINDARIO (B.243) ─────────────────────────
-- Cuántas consultas a Pinecone costaría el censo. Si pasa de ~1.500, el
-- endpoint va documento a documento en vez de de golpe.

select count(*) as documentos, sum(chunk_count) as consultas_del_censo
from documents
where org_id = '<ORG_ID>';
