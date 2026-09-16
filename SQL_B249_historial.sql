-- ════════════════════════════════════════════════════════════════════════
-- SQL_B249_historial.sql — ¿MORDIÓ ALGUNA VEZ EL CORTE DE 6? (16/09/2026)
--
-- SOLO LEE. No escribe, no borra, no cambia ningún estado.
-- Sustituir <ORG_ID> en todas las consultas.
--
-- ⚠️ CORREGIDO EL 16/09 TRAS EJECUTARSE. Dos fallos míos, los dos reales:
--   · `involved_documents` es **jsonb**, no array: `array_length` daba
--     «ERROR: function array_length(jsonb, integer) does not exist» y las
--     consultas 2 y 3 no llegaban a correr. Ahora `jsonb_array_length`.
--   · la consulta 3 devolvía **0 elegibles** en todas las filas anteriores al
--     15/09, incluidas las que recuperaron DIEZ candidatos. Cero contra diez no
--     es una cota baja: es una contradicción. Reescrita para que **declare su
--     ceguera** en vez de devolver un cero con pinta de dato — ver su cabecera.
--
-- ⚠️ Y LO QUE HAY QUE SABER ANTES DE LEER NADA:
-- `involved_documents` NO es «cuántos documentos participaron».
-- lib/persist-analysis.ts:87-93 lo construye a partir de los HALLAZGOS —
-- duplicado, discrepancias, solapamientos e inconsistencias menores—, así que
-- un documento seleccionado, analizado por el juez y SIN hallazgos no aparece.
-- Es una COTA INFERIOR de los seleccionados, no un recuento de participantes.
-- Y son NOMBRES, no ids (`existingDocument`, types.ts:216).
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · LA RESPUESTA EXACTA, donde existe ──────────────────────────────
-- `pipeline_counters` cuenta lo que se recuperó ANTES del corte. Sólo lo
-- llevan los análisis posteriores a F-82; en los anteriores sale NULL, y eso
-- es «no se sabe», no «fue cero».

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int   as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int as seleccionados,
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
-- DIERON HALLAZGO. No dice cuántos participaron, pero detecta una
-- imposibilidad: un 'quick' con más de 6 documentos con hallazgo CONTRADICE
-- MAX_SELECTED_QUICK = 6.

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  coalesce(jsonb_array_length(ar.involved_documents), 0) as con_hallazgo,
  ar.involved_documents,
  case
    when ar.analysis_type = 'quick'
     and coalesce(jsonb_array_length(ar.involved_documents), 0) > 6
      then '*** IMPOSIBLE BAJO EL TOPE DE 6 — mirar ***'
    else ''
  end as anomalia
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.pipeline_counters is null
order by ar.created_at desc;


-- ── 3 · ⚠️ RECONSTRUIR EL CORPUS ELEGIBLE — Y DETECTAR CUÁNDO ES CIEGA ──
--
-- La versión anterior devolvía un número y ese número era 0 en todo el tramo
-- anterior al 15/09, incluidas pasadas que recuperaron DIEZ candidatos. Diez
-- candidatos no salen de un corpus elegible de cero: la reconstrucción no
-- estaba midiendo bajo, estaba CIEGA, y un cero ciego se lee como dato.
--
-- POR QUÉ SE QUEDA CIEGA — las tres, y ninguna es rara:
--   · `reviewed_at` lo escribe SOLO mark-analyzed (route.ts:113,153). Los
--     otros tres caminos a 'analizado' —index-text:393, promocion.ts:98,
--     ingest:294— no lo ponen, y ingest y promocion lo dejan a NULL.
--   · un documento marcado y BORRADO después no tiene fila que contar. El
--     corpus se borró y se recreó, así que las filas del 14/09 pueden no
--     existir hoy.
--   · un documento devuelto a 'pendiente' por cambio de contenido perdió su
--     `reviewed_at`.
--
-- Por eso esta consulta ya NO devuelve un recuento a secas: devuelve el
-- recuento Y si ese recuento es creíble. La columna `fiabilidad` es la que se
-- lee; el número solo vale cuando dice 'coherente'.

select
  ar.created_at,
  ar.document_name,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int as recuperados,
  (select count(*)
     from documents d
    where d.org_id = ar.org_id
      and d.reviewed_at is not null
      and d.reviewed_at <= ar.created_at) as marcados_que_siguen_vivos,
  case
    when (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int is null
      then 'sin contadores — nada que contrastar'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int > 0
     and (select count(*) from documents d
           where d.org_id = ar.org_id
             and d.reviewed_at is not null
             and d.reviewed_at <= ar.created_at) = 0
      then '*** CIEGA: recupero candidatos y no queda ni un marcado. NO USAR ***'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
       > (select count(*) from documents d
           where d.org_id = ar.org_id
             and d.reviewed_at is not null
             and d.reviewed_at <= ar.created_at)
      then 'incompleta: recupero mas de los que quedan marcados'
    else 'coherente'
  end as fiabilidad
from analysis_results ar
where ar.org_id = '<ORG_ID>'
order by ar.created_at desc;


-- ── 4 · CUÁNDO SE MARCÓ CADA DOCUMENTO ─────────────────────────────────

select name, analysis_status, reviewed_at, created_at
from documents
where org_id = '<ORG_ID>'
  and reviewed_at is not null
order by reviewed_at;


-- ── 5 · ⚠️ LA QUE EXPLICA LA CEGUERA: ¿desde cuándo existen estas filas? ─
-- Si el documento MÁS ANTIGUO de la organización es posterior a los análisis
-- del 14/09, entonces ninguna fila de aquel corpus sobrevive y la consulta 3
-- no puede saber nada de ese tramo — no por un fallo suyo, sino porque la
-- evidencia se borró con las filas.

select
  count(*)                          as documentos,
  min(created_at)                   as el_mas_antiguo,
  max(created_at)                   as el_mas_nuevo,
  count(*) filter (where analysis_status = 'analizado')  as analizados_hoy,
  count(*) filter (where reviewed_at is not null)        as con_fecha_de_revision
from documents
where org_id = '<ORG_ID>';
