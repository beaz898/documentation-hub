-- ════════════════════════════════════════════════════════════════════════
-- SQL_deteccion_CLI03.sql — LA HOJA DE MEDICIÓN DE LA PRUEBA DE DETECCIÓN
-- (23/09/2026)
--
-- SOLO LEE. Sustituir <ORG_ID> por 5a82712f-6740-4792-b291-3fdea8e6edb1.
--
-- Se ejecuta DESPUÉS de las dos pasadas rápidas de CLI-03, con el corpus
-- activo en: NOR-01, OPE-05, RRHH-03 (marcados para la prueba) + CLI-04 y
-- OPE-11 (que ya estaban). CLI-03 se queda SIN marcar, así que no se compara
-- consigo mismo y sus propios fragmentos no vuelven.
--
-- ⚠️ LO QUE ESTA PRUEBA MIDE, Y ES UNA SOLA COSA: si la contradicción sembrada
-- —conservación de historia clínica, 5 años en NOR-01 contra 15 en CLI-03—
-- LLEGA AL JUEZ y sale como hallazgo. Y si no sale, en qué etapa murió.
--
-- ⚠️ POR QUÉ DOS PASADAS Y NO UNA: B.82. El juez no es estable ni consigo
-- mismo —el mismo par, el mismo prompt byte a byte, produce falsos positivos
-- DISTINTOS entre ejecuciones, medido el 21/08/2026—. Una pasada no da una
-- tasa: da una muestra de tamaño uno.
-- ════════════════════════════════════════════════════════════════════════


-- ── 1 · LA HOJA: UNA FILA POR PASADA, CON TODO ──────────────────────────
--
-- Es la consulta que pidió el encargo: todos los campos de la hoja de
-- medición de una vez. Devuelve DOS filas (las dos pasadas).
--
-- ⚠️ CÓMO SE LEE, y el orden de lectura importa — escrito ANTES de verlo:
--
--   1. `fondo` — contra cuántos fragmentos se comparó DE VERDAD. Con casi todo
--      el corpus en 'pendiente', si esto sale pequeño la tasa no significa
--      nada. Con cinco documentos activos debería rondar sus chunks sumados.
--   2. `recuperados` — cuántos DOCUMENTOS trajo la recuperación. Esperado 5
--      (los cinco activos). Si NOR-01 no está entre ellos, murió en el
--      retrieval y el rerank es inocente.
--   3. `seleccionados` — ⚠️ **LA PUERTA DE B.83.** Cuántos llegaron al juez.
--      Con 5 candidatos y un tope de 6, el tope NO puede cortar: si esto sale
--      menor que 5, lo que filtró fue EL CRITERIO del modelo.
--   4. `contradicciones` — cuántas alarmas emitió.
--   5. Los seis `verificador.*` — cuántas de esas alarmas cazó el verificador
--      ANTES de llegar al usuario. `descartados` + `reclasificados` es el
--      trabajo que hizo la pieza que F-22 pidió.
--
--   ⚠️ Y LA COLUMNA QUE NINGUNA CONSULTA PUEDE DAR: la etiqueta REAL/FALSO de
--   cada hallazgo. La pone el director mirando las citas (consulta 2).

select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  ar.id                                                                      as analysis_id,

  -- ── EL TERMÓMETRO: contra qué se comparó de verdad (F-114) ──
  (ar.analysis -> 'termometro' ->> 'estado')                                 as termometro_estado,
  (ar.analysis -> 'termometro' ->> 'fondo')::int                             as fondo,
  (ar.analysis -> 'termometro' ->> 'documentos_candidatos')::int             as documentos_candidatos,
  (ar.analysis -> 'termometro' -> 'scores' ->> 'minimo')::numeric            as score_minimo,
  (ar.analysis -> 'termometro' -> 'scores' ->> 'maximo')::numeric            as score_maximo,
  (ar.analysis -> 'termometro' -> 'scores' ->> 'hueco_1_2')::numeric         as hueco_1_2,

  -- ⚠️ LOS CINCO DENOMINADORES DEL CUADRE. Si `crudos` no es la suma de los
  -- cinco, un fragmento se perdió por un camino que nadie declaró.
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'crudos')::int         as crudos,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'sin_fila_viva')::int  as sin_fila_viva,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'sin_metadata_utilizable')::int as sin_metadata,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'propios_excluidos')::int as propios_excluidos,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'generacion_muerta_excluida')::int as generacion_muerta,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'candidatos_con_repeticion')::int as con_repeticion,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'unicos')::int         as unicos,

  -- ⚠️ ESPERADO VACÍO LOS DOS. Si traen algo, el índice sirve documentos que
  -- la base no tiene (F-115) y la medición está contaminada.
  (ar.analysis -> 'termometro' -> 'ids_sin_fila_viva')                       as ids_sin_fila_viva,
  (ar.analysis -> 'termometro' -> 'candidatos_fuera_del_fondo')              as candidatos_fuera_del_fondo,

  -- ── LA SELECCIÓN: dónde se pierde lo que se pierde ──
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int         as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int       as seleccionados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int   as cortados_por_tope_rerank,
  (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope_de_recuperacion')::int as cortados_por_tope_recup,
  (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int as descartados_por_criterio,
  (ar.pipeline_counters ->> 'seleccion.candidatos_sin_confianza')::int       as sin_confianza,
  (ar.pipeline_counters ->> 'seleccion.candidatos_con_id_no_reconocido')::int as id_no_reconocido,
  (ar.pipeline_counters ->> 'seleccion.candidatos_repetidos_por_el_modelo')::int as repetidos,

  -- ── EL VERIFICADOR DE HALLAZGOS (F-22/F-35), que es la pieza que nació
  --    CONTRA los siete falsos positivos. Es lo que hay que leer para saber
  --    si funcionó: `descartados` + `reclasificados` son falsos cazados.
  (ar.pipeline_counters ->> 'verificador.hallazgos_entrantes')::int          as verif_entrantes,
  (ar.pipeline_counters ->> 'verificador.confirmados')::int                  as verif_confirmados,
  (ar.pipeline_counters ->> 'verificador.confirmados_por_estructura')::int   as verif_por_estructura,
  (ar.pipeline_counters ->> 'verificador.confirmados_por_juicio')::int       as verif_por_juicio,
  (ar.pipeline_counters ->> 'verificador.descartados')::int                  as verif_descartados,
  (ar.pipeline_counters ->> 'verificador.reclasificados')::int               as verif_reclasificados,

  -- ── EL RESULTADO ──
  ar.contradictions_found                                                    as contradicciones,
  ar.contradictions_confirmed                                                as contradicciones_confirmadas,
  ar.minor_inconsistencies_found                                             as inconsistencias_menores,
  ar.duplicates_found                                                        as duplicados,
  ar.overlaps_found                                                          as solapamientos,
  ar.recommendation                                                          as recomendacion,
  ar.involved_documents                                                      as documentos_implicados,

  -- ⚠️ LA COMPROBACIÓN DE LA TRAMPA, hecha por la consulta y no a ojo: ¿está
  -- NOR-01 entre los documentos con los que se comparó?
  (ar.involved_documents::text ilike '%NOR-01%')                             as nor01_implicado

from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.document_name ilike 'CLI-03%'
  and ar.created_at >= '2026-09-23'
order by ar.created_at asc;


-- ── 2 · UNA FILA POR HALLAZGO, con sus dos citas literales ──────────────
--
-- Es la tabla que el director etiqueta a mano. Sin las citas no se puede
-- decidir si una alarma es real, y la etiqueta es la única columna que no
-- puede salir del sistema.
--
-- ⚠️ CÓMO ETIQUETAR, con los tres patrones de F-22 delante:
--   · REAL                → las dos citas hablan del MISMO dato y se oponen.
--   · FALSO / patrón 1    → las dos citas dicen LO MISMO (una es la otra más
--                           una coletilla). Es el caso «pelo recogido».
--   · FALSO / patrón 2    → una dice que algo EXISTE y la otra que a alguien
--                           LE FALTA. Coherentes, no opuestas.
--   · FALSO / patrón 3    → emparejamiento sin relación semántica. Es el caso
--                           «activar la alarma» (incendio) contra
--                           «desactivar la alarma» (apertura).
--   · DUDOSO              → y se anota por qué. Un dudoso contado como real
--                           infla la tasa en la dirección cómoda.

select
  ar.created_at,
  ar.id                                    as analysis_id,
  d ->> 'topic'                            as tema,
  d ->> 'existingDocument'                 as documento_existente,
  d ->> 'severity'                         as severidad,
  d ->> 'confirmedBy'                      as confirmado_por,
  d ->> 'newDocSays'                       as dice_el_nuevo,
  d ->> 'existingDocSays'                  as dice_el_existente,
  d ->> 'confidence'                       as confianza,
  d ->> 'origen'                           as origen,
  null::text                               as etiqueta_del_director,   -- REAL / FALSO / DUDOSO
  null::text                               as patron_si_es_falso       -- 1 / 2 / 3
from analysis_results ar
cross join lateral jsonb_array_elements(ar.analysis -> 'discrepancies') as d
where ar.org_id = '<ORG_ID>'
  and ar.document_name ilike 'CLI-03%'
  and ar.created_at >= '2026-09-23'
order by ar.created_at asc, tema;


-- ── 3 · LAS INCONSISTENCIAS MENORES, que van aparte ─────────────────────
--
-- ⚠️ NO SE MEZCLAN CON LAS CONTRADICCIONES, y la razón es del producto: son
-- otra sección de la pantalla y otra severidad. Contarlas juntas cambiaría la
-- tasa sin que nadie lo decidiera.

select
  ar.created_at,
  m ->> 'topic'                            as tema,
  m ->> 'existingDocument'                 as documento_existente,
  m ->> 'newDocSays'                       as dice_el_nuevo,
  m ->> 'existingDocSays'                  as dice_el_existente,
  null::text                               as etiqueta_del_director
from analysis_results ar
cross join lateral jsonb_array_elements(ar.analysis -> 'minorInconsistencies') as m
where ar.org_id = '<ORG_ID>'
  and ar.document_name ilike 'CLI-03%'
  and ar.created_at >= '2026-09-23'
order by ar.created_at asc;


-- ── 4 · EL CORPUS ACTIVO EN EL MOMENTO DE MEDIR ─────────────────────────
--
-- ⚠️ SE EJECUTA ANTES DE LAS PASADAS, Y TAMBIÉN DESPUÉS. Es el denominador de
-- toda la prueba: si alguien marcó o desmarcó algo entre medias, las dos
-- pasadas no son comparables y hay que saberlo ANTES de sacar una tasa.
--
-- Esperado: cinco filas 'analizado' —NOR-01, OPE-05, RRHH-03, CLI-04,
-- OPE-11— y CLI-03 en 'pendiente'.

select
  name,
  analysis_status,
  chunk_count,
  active_generation,
  reviewed_at
from documents
where org_id = '<ORG_ID>'
  and analysis_status = 'analizado'
order by name;

select name, analysis_status, chunk_count
from documents
where org_id = '<ORG_ID>'
  and name ilike 'CLI-03%';


-- ── 5 · EL FALSO NEGATIVO, SI LA TRAMPA NO SALE ─────────────────────────
--
-- ⚠️ UN FALSO NEGATIVO NO ES UN FALSO POSITIVO, Y MEZCLARLOS ARRUINA LA HOJA.
-- Si la contradicción de los 5 contra 15 años no aparece, esta consulta dice
-- en qué etapa murió — que es la pregunta de B.83.
--
-- CÓMO SE LEE, y son tres diagnósticos EXCLUYENTES:
--   nor01_recuperado = false  → murió en el RETRIEVAL. NOR-01 no llegó
--                               siquiera a candidato. El rerank es inocente.
--   nor01_recuperado = true
--     y seleccionados < recuperados
--     y cortados_por_tope = 0 → ⚠️ **murió en el CRITERIO DEL RERANK**, que es
--                               exactamente B.83. El tope no cortó (5 < 6):
--                               el modelo decidió que no merecía análisis.
--   nor01_recuperado = true
--     y NOR-01 en involved_documents
--     y cero contradicciones     → llegó al JUEZ y el juez no la vio. Ése sí
--                               es un fallo del criterio del juicio.

select
  ar.created_at,
  (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int       as recuperados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int     as seleccionados,
  (ar.pipeline_counters ->> 'seleccion.candidatos_cortados_por_tope')::int as cortados_por_tope,
  (ar.pipeline_counters ->> 'seleccion.candidatos_descartados_por_criterio')::int as descartados_por_criterio,
  ar.involved_documents,
  (ar.involved_documents::text ilike '%NOR-01%')                           as nor01_implicado,
  ar.contradictions_found,
  -- El diagnóstico, escrito por la consulta y no por quien la lee.
  case
    when (ar.involved_documents::text ilike '%NOR-01%') and ar.contradictions_found > 0
      then 'la trampa llego al juez y salio'
    when (ar.involved_documents::text ilike '%NOR-01%') and ar.contradictions_found = 0
      then 'llego al juez y el juez no la vio'
    when (ar.pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int
       < (ar.pipeline_counters ->> 'seleccion.candidatos_recuperados')::int
      then 'murio en el rerank — B.83'
    else 'revisar a mano: no encaja en los tres casos'
  end                                                                      as diagnostico
from analysis_results ar
where ar.org_id = '<ORG_ID>'
  and ar.document_name ilike 'CLI-03%'
  and ar.created_at >= '2026-09-23'
order by ar.created_at asc;
