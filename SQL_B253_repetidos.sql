-- ════════════════════════════════════════════════════════════════════════
-- SQL_B253_repetidos.sql — ¿EL MODELO NOMBRÓ ALGUNA VEZ UN DOCUMENTO DOS VECES?
-- Y LAS CIFRAS FALSAS QUE DEJÓ EL FALLBACK. (16/09/2026)
--
-- ESTADO: PENDIENTE DE EJECUTAR.
--
-- SOLO LEE. No escribe, no borra, no cambia ningún estado.
-- Sustituir <ORG_ID> en las cuatro consultas.
--
-- ⚠️ CORREGIDO ANTES DE EJECUTARSE (B.255, 16/09/2026). La primera versión de
-- la consulta 1 no leía `seleccion.candidatos_repetidos_por_el_modelo`, y en
-- toda fila posterior a `a3423ef2` contestaba «sin repetición visible» POR
-- CONSTRUCCIÓN —desde ese commit los repetidos ya no pueden entrar—, mientras
-- la respuesta real estaba en un contador que no miraba. Callaba con forma de
-- respuesta.
--
-- LO QUE SE BUSCA. Hasta el arreglo de B.253, si el rerank devolvía [A, A, B],
-- A entraba DOS VECES en la selección: ocupaba dos plazas del tope —dejando
-- fuera a otro documento— y el juez lo comparaba dos veces, cobrándolo dos
-- veces. Desde `a3423ef2` las repeticiones se descartan y se CUENTAN; antes no
-- se contaban, y lo que hay es lo que se puede DEDUCIR de lo guardado.
--
-- ⚠️ NINGUNA SEÑAL DE LAS DEDUCIDAS VE TODOS LOS CASOS. Un «no aparece» NO es
-- «no pasó»: es «no dejó una huella de las que esto sabe leer».
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · POR CONTADORES ─────────────────────────────────────────────────
-- Tres grados, según qué contadores tenga la fila:
--
--  · CON `repetidos_por_el_modelo` (código de `a3423ef2` en adelante): es la
--    respuesta CONTADA, no deducida. Esas repeticiones se descartaron: no
--    entraron al juez ni ocuparon plaza.
--
--  · CON `criterio` pero sin `repetidos` (entre `38b60b66` y `a3423ef2`): los
--    documentos distintos que debían llegar al juez son
--    recuperados − criterio − tope; si `seleccionados` es mayor, la diferencia
--    son repeticiones que ENTRARON.
--    ⚠️ Hueco: cuando el tope corta, `seleccionados` vale el tope en los dos
--    casos y la repetición no se ve — y es JUSTO el caso en que desplazó a otro.
--
--  · SÓLO con `recuperados` y `seleccionados` (desde F-82, 28/08/2026): si
--    seleccionados > recuperados, SEGURO que hubo repetición.
--    ⚠️ Hueco: con 3 recuperados y [A, A, B] salen 3 y 3. Es el tamaño del
--    corpus del director: aquí casi todo sale «no deducible».
--
-- Se excluyen las filas con fallo del rerank (`analysis.stageFailures` con
-- etapa `rerank`): allí no hubo respuesta del modelo que repetir, y su
-- `criterio` es falso (ver consulta 3).

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int              as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int            as seleccionados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int as criterio,
  (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int        as tope,
  (ar.pipeline_counters ->> 'seleccion.candidatos_repetidos_por_el_modelo')::int  as repetidos,
  case
    when ar.pipeline_counters is null
      then 'SIN CONTADORES — no se sabe'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados') is null
      then 'el rerank no corrió'
    -- EL CONTADO VA PRIMERO: donde existe, no se deduce nada.
    when (ar.pipeline_counters ->> 'seleccion.candidatos_repetidos_por_el_modelo') is not null
      then case
        when (ar.pipeline_counters ->> 'seleccion.candidatos_repetidos_por_el_modelo')::int > 0
          then 'CONTADO: ' || (ar.pipeline_counters ->> 'seleccion.candidatos_repetidos_por_el_modelo')
            || ' repetición(es), descartadas — no entraron'
        else 'CONTADO: el modelo no repitió ninguno'
      end
    when (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int
       > (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
      then 'DEDUCIDO, SEGURO: entraron repetidos (más seleccionados que recuperados)'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio') is null
      then 'no deducible — anterior a los contadores de reparto'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int
       > (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
       - (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int
       - (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int
      then 'DEDUCIDO, SEGURO: entraron '
        || ((ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int
          - ((ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
           - (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int
           - (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int))
        || ' repetido(s)'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int > 0
      then 'no se ve — pero con tope, una repetición podría esconderse aquí'
    else 'sin repetición visible (deducido, no contado)'
  end as veredicto
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and not coalesce(ar.analysis -> 'stageFailures', '[]'::jsonb) @> '[{"stage": "rerank"}]'::jsonb
order by ar.created_at desc;


-- ── 2 · POR HALLAZGOS — la huella que deja el juez al repetir ──────────
-- Cada juicio produce COMO MUCHO UN solapamiento «del juez» por documento
-- (`synthesize.ts`, `construirOverlaps`: uno sin `confirmedBy` y, aparte, uno
-- estructural con `confirmedBy = 'estructura'`). Dos solapamientos del juez
-- para el mismo documento en el mismo análisis sólo salen de juzgarlo DOS
-- VECES. Vale para TODO el historial, no sólo desde F-82.
-- ⚠️ Hueco: sólo ve la repetición si ese documento produjo un solapamiento.
-- ⚠️ Los análisis anteriores a F-86 no llevan `existingDocumentId`: se agrupa
-- por nombre, y dos documentos distintos con el mismo nombre darían un falso
-- positivo. La columna `por` dice cuál se usó.

select
  ar.created_at,
  ar.document_name,
  coalesce(o ->> 'existingDocumentId', o ->> 'existingDocument') as documento,
  case when o ->> 'existingDocumentId' is null then 'nombre' else 'id' end as por,
  count(*) as solapamientos_del_juez
from analysis_results ar,
     jsonb_array_elements(coalesce(ar.analysis -> 'overlaps', '[]'::jsonb)) as o
where ar.org_id = '<ORG_ID>'
  and (o ->> 'confirmedBy') is null
group by ar.id, ar.created_at, ar.document_name, documento, por
having count(*) > 1
order by ar.created_at desc;


-- ── 3 · LAS CIFRAS DE CRITERIO QUE SON FALSAS (B.254) ──────────────────
-- Entre `38b60b66` y `a3423ef2`, cuando el modelo del rerank fallaba, se
-- guardaba `recuperados − 3` como «descartados por criterio», de documentos
-- que ningún modelo miró. Son EXACTAMENTE las filas que tienen la clave Y un
-- fallo del rerank registrado: antes de `38b60b66` la clave no existía, y
-- desde `a3423ef2` no se escribe en el fallback. No depende de la hora, así
-- que también caza filas de un proceso que siguiera con código viejo.
--
-- Cualquier suma o media de `descartados_por_criterio` tiene que excluir
-- estas filas, o mezclará falsos con ciertos.

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio' as criterio_falso
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.pipeline_counters ? 'seleccion.candidatos_descartados_por_criterio'
  and ar.analysis -> 'stageFailures' @> '[{"stage": "rerank"}]'::jsonb
order by ar.created_at desc;


-- ── 4 · ¿EL WORKER CORRE YA CON `a3423ef2`? — lo que los datos pueden decir ─
-- Los exhaustivos los ejecuta el worker de Railway. El código nuevo escribe
-- `repetidos_por_el_modelo` siempre que el rerank corre; el viejo no lo
-- conoce. Un exhaustivo POSTERIOR al commit, con rerank y SIN esa clave, se
-- ejecutó con código viejo.
-- ⚠️ Sólo contesta si ha habido algún exhaustivo después: con cero filas no se
-- sabe nada, y la respuesta está en el panel de Railway.

select
  ar.created_at,
  ar.document_name,
  case
    when ar.pipeline_counters ? 'seleccion.candidatos_repetidos_por_el_modelo'
      then 'código NUEVO'
    else 'código VIEJO — el worker no se ha redesplegado'
  end as worker
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.analysis_type = 'exhaustive'
  and ar.created_at > '2026-09-16 18:30:40+02'
  and ar.pipeline_counters ? 'seleccion.candidatos_seleccionados'
order by ar.created_at desc;
