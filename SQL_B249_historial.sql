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
--     es una cota baja: es una contradicción. **RETIRADA ENTERA** el mismo día,
--     al saberse la causa real: `reviewed_at` contesta «¿pasó por la bandeja?»
--     y no «¿estaba analizado?». Ver el hueco que dejó, más abajo.
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


-- ── 3 · ⚠️ RETIRADA EL 16/09/2026 — ERA CIEGA POR CONSTRUCCIÓN ───────
--
-- Aquí había una consulta que reconstruía «cuántos documentos eran elegibles
-- en la fecha de cada análisis», contando los que tenían `reviewed_at`
-- anterior. Se retira entera, y el motivo NO es el que yo escribí primero.
--
-- LO QUE ESCRIBÍ: que estaba ciega porque el corpus se borró y se recreó, así
-- que las filas del 14/09 ya no existen. **Era una hipótesis mía y no la
-- verifiqué.**
--
-- LO QUE ES: `reviewed_at` NO responde «¿estaba analizado?». Responde
-- **«¿pasó por la bandeja de revisión?»** — lo escribe sólo `mark-analyzed`
-- (route.ts:113,153). El director lo explicó con dos nombres propios:
-- `CLI-04` y `CLI-05` llegaron a `analizado` por SUBIDA MANUAL indexada desde
-- el chat, o sea por `ingest:294`, que nunca los mandó a revisar y por tanto
-- no les puso fecha. **No es un fallo: es que el campo contesta otra cosa.**
--
-- ⚠️ Y ESO LA MATA PARA SIEMPRE, no para hoy. En cualquier corpus donde se
-- indexe desde el chat, esta reconstrucción es ciega POR CONSTRUCCIÓN: no le
-- faltan datos que algún día lleguen, le falta una pregunta que ese campo no
-- responde. Dejarla devolviendo números sería dejar un cero con pinta de dato
-- —lo mismo que ya pasó con el `org_id`— sólo que esta vez sabiendo que no
-- puede acertar nunca.
--
-- QUÉ HARÍA FALTA PARA CONTESTAR LA PREGUNTA DE VERDAD: un sello de tiempo
-- que escriban los CUATRO caminos a `analizado`. Hoy no existe ninguno, y eso
-- es una ficha propia (B.252): no se puede saber cuándo entró un documento al
-- corpus efectivo.

-- ── 4 · QUIÉN PASÓ POR LA BANDEJA, Y CUÁNDO ───────────────────────────
-- ⚠️ ESO Y NADA MÁS, que es lo que este campo sabe. NO es «qué documentos
-- están analizados»: los que llegaron por `ingest` o por `index-text` están
-- analizados y no salen aquí. El título anterior decía «cuándo se marcó cada
-- documento» y ese nombre es justo el que nos hizo leerla mal.

select name, analysis_status, reviewed_at, created_at
from documents
where org_id = '<ORG_ID>'
  and reviewed_at is not null
order by reviewed_at;


-- ── 5 · EL ESTADO DE HOY, Y LA BRECHA QUE ENSEÑA ───────────────────────
-- Nació diciendo que «explica la ceguera» por el borrado del corpus. Esa
-- explicación era una hipótesis mía y resultó no ser la causa (ver el hueco de
-- la 3). Lo que sí hace, y sigue valiendo:
--
-- ⚠️ COMPARAR `analizados_hoy` CON `con_fecha_de_revision`. La diferencia son
-- los documentos que están en el corpus efectivo SIN haber pasado por la
-- bandeja — los que entraron por subida manual o desde el chat. Con el corpus
-- del director esa diferencia debería ser 2: `CLI-04` y `CLI-05`.
--
-- Esa resta es la medida directa de B.252: cuántos documentos del corpus no
-- tienen forma de decir desde cuándo están en él.

select
  count(*)                          as documentos,
  min(created_at)                   as el_mas_antiguo,
  max(created_at)                   as el_mas_nuevo,
  count(*) filter (where analysis_status = 'analizado')  as analizados_hoy,
  count(*) filter (where reviewed_at is not null)        as con_fecha_de_revision
from documents
where org_id = '<ORG_ID>';
