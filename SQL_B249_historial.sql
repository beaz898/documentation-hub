-- ════════════════════════════════════════════════════════════════════════
-- SQL_B249_historial.sql — ¿MORDIÓ ALGUNA VEZ EL CORTE DE 6? (16/09/2026)
--
-- SOLO LEE. No escribe, no borra, no cambia ningún estado.
-- Sustituir <ORG_ID> en las cuatro consultas.
--
-- ⚠️ LO PRIMERO, PORQUE CAMBIA CÓMO SE LEE TODO LO DEMÁS:
-- `involved_documents` NO es «cuántos documentos participaron».
-- lib/persist-analysis.ts:87-93 lo construye a partir de los HALLAZGOS —
-- duplicado, discrepancias, solapamientos e inconsistencias menores—, así que
-- un documento seleccionado, analizado por el juez y SIN hallazgos no aparece.
-- Es una COTA INFERIOR de los seleccionados, no un recuento de participantes.
-- Y son NOMBRES, no ids (`existingDocument`, types.ts:216).
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · LA RESPUESTA EXACTA, donde existe ──────────────────────────────
-- `pipeline_counters` sí cuenta lo que se recuperó ANTES del corte. Sólo lo
-- llevan los análisis posteriores a F-82; en los anteriores sale NULL, y eso
-- es «no se sabe», no «fue cero».
--
-- CÓMO SE LEE, escrito antes de mirar:
--   recuperados >= 7  en un 'quick'      → EL CORTE MORDIÓ. Esa cifra se
--                                          obtuvo con documentos descartados
--                                          en silencio.
--   recuperados >= 26 en un 'exhaustive' → mordió el tope de 25.
--   recuperados <= 6                     → no mordió: el rerank vio todo.
--   seleccionados = 6 exactos            → sospechoso: es el tope clavado.

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int   as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int as seleccionados,
  coalesce(array_length(ar.involved_documents, 1), 0)                  as con_hallazgo,
  case
    when ar.pipeline_counters is null then 'SIN CONTADORES — no se sabe'
    when ar.analysis_type = 'quick'
     and (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int > 6
      then '*** EL CORTE MORDIO ***'
    when ar.analysis_type = 'exhaustive'
     and (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int > 25
      then '*** EL TOPE DE 25 MORDIO ***'
    else 'no mordio'
  end as veredicto
from analysis_results ar
where ar.org_id = '<ORG_ID>'
order by ar.created_at desc;


-- ── 2 · EL HISTÓRICO ANTIGUO, por cota inferior ────────────────────────
-- Para las filas sin contadores, lo único que queda es cuántos documentos
-- DIERON HALLAZGO. No dice cuántos participaron, pero sí detecta una
-- imposibilidad:
--   un 'quick' con mas de 6 documentos con hallazgo CONTRADICE
--   MAX_SELECTED_QUICK = 6 — o el tope no estaba puesto en esa fecha, o esa
--   pasada no era lo que su `analysis_type` dice.

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  coalesce(array_length(ar.involved_documents, 1), 0) as con_hallazgo,
  ar.involved_documents,
  case
    when ar.analysis_type = 'quick'
     and coalesce(array_length(ar.involved_documents, 1), 0) > 6
      then '*** IMPOSIBLE BAJO EL TOPE DE 6 — mirar ***'
    else ''
  end as anomalia
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.pipeline_counters is null
order by ar.created_at desc;


-- ── 3 · ⚠️ LA PREGUNTA DEL DIRECTOR, RECONSTRUIDA ──────────────────────
-- «En otros momentos tuve más de diez documentos indexados.»
--
-- INDEXADO NO ES ELEGIBLE. El filtro de corpus es
-- analysis_status = 'analizado' (vectors.ts:99), así que diez indexados en
-- 'pendiente' dan CERO candidatos. Lo que hay que reconstruir es cuántos
-- estaban ELEGIBLES en la fecha de cada análisis.
--
-- ⚠️ ES UNA COTA INFERIOR, y por tres motivos que hay que decir:
--   · `reviewed_at` lo escribe SOLO mark-analyzed (route.ts:113,153). Un
--     documento que llegó a 'analizado' por index-text:393, promocion.ts:98
--     o ingest:294 no lo lleva — y ingest y promocion lo ponen a NULL.
--   · Un documento marcado y BORRADO después ya no tiene fila: no se cuenta.
--   · Un documento marcado y devuelto a 'pendiente' por un cambio de
--     contenido perdió su `reviewed_at`.
-- O sea: si esto da un número alto, es verdad. Si da bajo, no prueba nada.

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  (select count(*)
     from documents d
    where d.org_id = ar.org_id
      and d.reviewed_at is not null
      and d.reviewed_at <= ar.created_at) as elegibles_al_menos,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int as recuperados
from analysis_results ar
where ar.org_id = '<ORG_ID>'
order by ar.created_at desc;


-- ── 4 · CUÁNDO SE MARCÓ CADA DOCUMENTO ─────────────────────────────────
-- La línea del tiempo del corpus elegible. Si aquí hay diez fechas anteriores
-- a un análisis, en ese análisis había al menos diez documentos elegibles.

select name, analysis_status, reviewed_at, created_at
from documents
where org_id = '<ORG_ID>'
  and reviewed_at is not null
order by reviewed_at;
