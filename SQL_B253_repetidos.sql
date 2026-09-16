-- ════════════════════════════════════════════════════════════════════════
-- SQL_B253_repetidos.sql — ¿EL MODELO NOMBRÓ ALGUNA VEZ UN DOCUMENTO DOS VECES?
-- (16/09/2026)
--
-- ESTADO: PENDIENTE DE EJECUTAR.
--
-- SOLO LEE. No escribe, no borra, no cambia ningún estado.
-- Sustituir <ORG_ID> en las dos consultas.
--
-- LO QUE SE BUSCA. Hasta el arreglo de B.253, si el rerank devolvía [A, A, B],
-- A entraba DOS VECES en la selección: ocupaba dos plazas del tope —dejando
-- fuera a otro documento— y el juez lo comparaba dos veces, cobrándolo dos
-- veces. No había contador de repeticiones, así que las pasadas anteriores no
-- lo saben. Lo que sigue es lo que se puede DEDUCIR de lo guardado, y dónde
-- se acaba.
--
-- ⚠️ NINGUNA DE LAS DOS SEÑALES VE TODOS LOS CASOS. Un «no aparece» aquí NO es
-- «no pasó»: es «no dejó una huella de las que esto sabe leer». Los huecos van
-- escritos en cada consulta.
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · POR CONTADORES ─────────────────────────────────────────────────
-- Dos grados de certeza, según la fecha del análisis:
--
--  · DESDE F-82 (28/08/2026) hay `recuperados` y `seleccionados`. Si
--    seleccionados > recuperados, SEGURO que hubo repetición: la selección no
--    puede tener más documentos distintos de los que llegaron.
--    ⚠️ Hueco: con 3 recuperados y el modelo devolviendo [A, A, B] salen 3 y 3,
--    y la repetición se confunde con un descarte por criterio. Es justo el
--    tamaño del corpus del director.
--
--  · DESDE EL DESPLIEGUE DE 38b60b66 (16/09/2026, tarde) hay además `criterio`
--    y `tope`, contados SIN repetidos. Los documentos distintos que debían
--    llegar al juez son recuperados − criterio − tope; si `seleccionados` es
--    mayor, la diferencia son repeticiones que entraron.
--    ⚠️ Hueco: cuando el tope corta, `seleccionados` vale el tope en los dos
--    casos y la repetición no se ve — y es JUSTO el caso en que desplazó a otro
--    documento.
--    ⚠️ Y en un fallback del rerank (`analysis.stageFailures` con etapa `rerank`) el `criterio`
--    de esas filas es falso (B.254): se filtran fuera.

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int              as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int            as seleccionados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int as criterio,
  (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int        as tope,
  case
    when ar.pipeline_counters is null
      then 'SIN CONTADORES — no se sabe'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados') is null
      then 'el rerank no corrió'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int
       > (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
      then 'REPETICIÓN SEGURA (más seleccionados que recuperados)'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio') is null
      then 'no deducible — anterior a los contadores de reparto'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int
       > (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
       - (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int
       - (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int
      then 'REPETICIÓN SEGURA: '
        || ((ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int
          - ((ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
           - (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int
           - (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int))
        || ' de más'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int > 0
      then 'no se ve — pero con tope, una repetición podría esconderse aquí'
    else 'sin repetición visible'
  end as veredicto
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and not coalesce(ar.analysis -> 'stageFailures', '[]'::jsonb) @> '[{"stage": "rerank"}]'::jsonb
order by ar.created_at desc;


-- ── 2 · POR HALLAZGOS — la huella que deja el juez al repetir ──────────
-- Cada juicio produce COMO MUCHO UN solapamiento «del juez» por documento
-- (`synthesize.ts`, `construirOverlaps`: uno sin `confirmedBy` y, aparte,
-- uno estructural con `confirmedBy = 'estructura'`). Dos solapamientos del
-- juez para el mismo documento en el mismo análisis sólo salen de juzgarlo
-- DOS VECES. Esto vale para TODO el historial, no sólo desde F-82.
-- ⚠️ Hueco: sólo ve la repetición si ese documento produjo un solapamiento.
-- Un documento repetido que el juez dio por limpio no deja nada aquí.
-- ⚠️ Los análisis anteriores a F-86 no llevan `existingDocumentId`: se agrupa
-- por nombre, y dos documentos distintos con el mismo nombre darían un falso
-- positivo. Por eso la columna `por` dice cuál se usó.

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
