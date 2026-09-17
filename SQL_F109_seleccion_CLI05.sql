-- ════════════════════════════════════════════════════════════════════════
-- SQL_F109_seleccion_CLI05.sql — ¿QUÉ JUZGÓ CADA MODO, Y QUÉ SALIÓ DE LO QUE SÓLO
-- JUZGÓ EL EXHAUSTIVO? (17/09/2026)
--
-- ESTADO: PENDIENTE DE EJECUTAR.
--
-- SOLO LEE. No escribe, no borra, no cambia ningún estado. Cero créditos.
-- Sustituir <ORG_ID> en las tres consultas.
--
-- LO QUE HAY GUARDADO, y lo que no (leído en el código el 17/09):
--   · SÍ: `analysis.judgments` — un juicio por cada candidato que LLEGÓ AL JUEZ,
--     con `documentId` y `documentName`. Es la lista de SELECCIONADOS de esa pasada.
--   · SÍ: `analysis.discrepancies` y `analysis.overlaps` — los hallazgos FINALES,
--     con `existingDocument` (y `existingDocumentId` desde F-86).
--   · NO: qué candidatos se recuperaron ni cuáles descartó la selección. De los
--     descartados no queda ni el id; sólo el RECUENTO, y sólo desde el 16/09.
--   · SÍ, pero en otra tabla: el texto completo del documento en el exhaustivo
--     (`analysis_jobs.document_text`), que es lo que deja comprobar la consulta 3.
--
-- PREDICCIÓN, escrita antes de ver un solo dato:
--   1. El exhaustivo juzga MÁS documentos que cualquier rápido del día (6-9
--      frente a 4-5), y los del rápido son casi todos un subconjunto de los suyos.
--   2. Los documentos que SÓLO juzgó el exhaustivo dan **cero contradicciones
--      confirmadas**; como mucho, solapamientos de porcentaje bajo.
--   3. Las cinco pasadas rápidas NO seleccionan siempre los mismos documentos.
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · QUÉ JUZGÓ CADA PASADA ──────────────────────────────────────────
-- Una fila por (pasada, documento juzgado), con lo que ese documento produjo.
-- ⚠️ Si un documento sale DOS veces en la misma pasada es B.253 (repetidos, antes
-- del 16/09): la columna `veces_juzgado` lo dice.

with pasadas as (
  select ar.id, ar.created_at, ar.analysis_type, ar.analysis,
         (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int  as recuperados,
         (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int as seleccionados
  from analysis_results ar
  where ar.org_id = '<ORG_ID>'
    and ar.document_name like 'CLI-05%'
    and ar.created_at >= '2026-09-14' and ar.created_at < '2026-09-15'
    and ar.analysis_type in ('quick', 'exhaustive')
),
juzgados as (
  select p.id, p.created_at, p.analysis_type, p.recuperados, p.seleccionados,
         coalesce(j ->> 'documentId', j ->> 'documentName') as documento,
         j ->> 'documentName' as nombre,
         count(*) as veces_juzgado
  from pasadas p, jsonb_array_elements(coalesce(p.analysis -> 'judgments', '[]'::jsonb)) j
  group by 1,2,3,4,5,6,7
)
select j.created_at, j.analysis_type, j.recuperados, j.seleccionados,
       j.nombre, j.veces_juzgado,
       (select count(*) from pasadas p2, jsonb_array_elements(coalesce(p2.analysis -> 'discrepancies', '[]'::jsonb)) d
         where p2.id = j.id
           and coalesce(d ->> 'existingDocumentId', d ->> 'existingDocument') in (j.documento, j.nombre)) as contradicciones,
       (select count(*) from pasadas p2, jsonb_array_elements(coalesce(p2.analysis -> 'overlaps', '[]'::jsonb)) o
         where p2.id = j.id
           and coalesce(o ->> 'existingDocumentId', o ->> 'existingDocument') in (j.documento, j.nombre)) as solapamientos
from juzgados j
order by j.created_at, j.nombre;


-- ── 2 · LOS QUE SÓLO JUZGÓ EL EXHAUSTIVO ───────────────────────────────
-- Documentos juzgados por el exhaustivo que NINGUNA pasada rápida del día juzgó,
-- con lo que produjeron. Contra la UNIÓN de los rápidos, no contra uno: el modelo
-- no selecciona igual cada vez, y un documento que un rápido cogió y otro no, no
-- es una pérdida del modo sino de la pasada.

with pasadas as (
  select ar.id, ar.analysis_type, ar.analysis
  from analysis_results ar
  where ar.org_id = '<ORG_ID>'
    and ar.document_name like 'CLI-05%'
    and ar.created_at >= '2026-09-14' and ar.created_at < '2026-09-15'
    and ar.analysis_type in ('quick', 'exhaustive')
),
juzgados as (
  select p.id, p.analysis_type, j ->> 'documentName' as nombre,
         coalesce(j ->> 'documentId', j ->> 'documentName') as documento
  from pasadas p, jsonb_array_elements(coalesce(p.analysis -> 'judgments', '[]'::jsonb)) j
),
solo_exhaustivo as (
  select distinct e.id, e.nombre, e.documento
  from juzgados e
  where e.analysis_type = 'exhaustive'
    and not exists (select 1 from juzgados q where q.analysis_type = 'quick' and q.documento = e.documento)
)
select s.nombre,
       d ->> 'topic'      as contradiccion,
       d ->> 'newDocSays' as cita_del_nuevo,
       d ->> 'confirmedBy' as confirmada_por
from solo_exhaustivo s
join pasadas p on p.id = s.id
left join lateral jsonb_array_elements(coalesce(p.analysis -> 'discrepancies', '[]'::jsonb)) d
  on coalesce(d ->> 'existingDocumentId', d ->> 'existingDocument') in (s.documento, s.nombre)
order by s.nombre;


-- ── 3 · ¿LO HABRÍA VISTO EL JUEZ DEL RÁPIDO? ───────────────────────────
-- ⚠️ EL CONFUNDIDOR QUE SEPARA «LA SELECCIÓN LO PERDIÓ» DE «EL RÁPIDO NO PODÍA
-- VERLO»: el juez del rápido lee los primeros 6.000 caracteres del documento
-- nuevo; el del exhaustivo, el documento entero (`judge.ts`, NEW_DOC_LIMIT_QUICK).
-- Una contradicción cuya cita está más allá del carácter 6.000 no la habría
-- encontrado el rápido AUNQUE lo hubiera seleccionado.
-- Posición de cada cita del nuevo en el texto del job exhaustivo de ese día.
-- `posicion` = 0 significa que la cita no se encuentra literal (saltos de línea,
-- §5.37-bis): no se sabe, y no se cuenta como «dentro».

select j.created_at, d ->> 'topic' as contradiccion,
       strpos(j.document_text, d ->> 'newDocSays') as posicion,
       case
         when strpos(j.document_text, d ->> 'newDocSays') = 0 then 'no localizada — no se sabe'
         when strpos(j.document_text, d ->> 'newDocSays') <= 6000 then 'dentro de lo que ve el rápido'
         else 'FUERA de lo que ve el rápido'
       end as alcance
from analysis_jobs j,
     jsonb_array_elements(coalesce(j.result -> 'discrepancies', '[]'::jsonb)) d
where j.org_id = '<ORG_ID>'
  and j.document_name like 'CLI-05%'
  and j.created_at >= '2026-09-14' and j.created_at < '2026-09-15'
order by j.created_at;
