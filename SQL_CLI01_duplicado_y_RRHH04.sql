-- ════════════════════════════════════════════════════════════════════════
-- SQL_CLI01_duplicado_y_RRHH04.sql — LAS DOS COSAS QUE NO SE PUEDEN
-- CONTESTAR DESDE EL REPOSITORIO (25/09/2026)
--
-- SOLO LEE. Ni un INSERT, ni un UPDATE, ni un DELETE. Lo ejecuta el director
-- en Supabase; Claude no lo ejecuta.
--
-- Organización: 5a82712f-6740-4792-b291-3fdea8e6edb1 — la misma del piloto y
-- la misma del harness (`SQL_deteccion_CLI03.sql:5`,
-- `claude/Protocolo_Harness_Tasas.md:846`).
--
-- ⚠️ POR QUÉ ESTE FICHERO Y NO UNA RESPUESTA: las dos preguntas abiertas
-- —«¿el duplicado de CLI-01 pudo contaminar la tanda del 23/09?» y «¿la
-- extracción de RRHH-04 se quedó a medias?»— son preguntas sobre la BASE y
-- sobre los DOCUMENTOS DEL DIRECTOR. Claude tiene el repositorio y no tiene
-- ninguna de las dos cosas: contestarlas desde aquí sería inventar. Lo que sí
-- puede hacer el repositorio es decir QUÉ CIFRA LAS DECIDE, y eso es esto.
--
-- ⚠️ LO QUE ESTE SQL **NO** PUEDE CONTESTAR, y se dice antes de leerlo: **si
-- los vectores están en Pinecone.** Los vectores no se espejan en Supabase.
-- `document_chunks` es lo que el MISMO camino escribió al indexar, no una
-- prueba de que el vector exista. La diferencia no es teórica: es CLI-05
-- (F-115), un documento sin fila al que el índice seguía sirviendo vectores.
-- Para eso hay herramienta de sólo lectura:
--     GET /api/admin/vectores-de-un-documento?documentId=<uuid>
--
-- COLUMNAS COMPROBADAS EN EL ESQUEMA ANTES DE ESCRIBIRLAS:
--   documents        → supabase-setup.sql:279-298 (id, name, org_id TEXT,
--                      chunk_count, content_hash, full_text, source,
--                      created_at, updated_at)
--                      + supabase-analysis-status.sql:11-13 (analysis_status)
--                      + supabase-c4-generation-model.sql:7 (active_generation)
--                      + supabase-f20-chunks-estructurados.sql:14
--                        (extractor_version)
--   document_chunks  → supabase-f20-chunks-estructurados.sql:22-48
--                      (document_id, org_id, generation, chunk_index,
--                       chunk_type, text, created_at)
--   analysis_results → supabase-setup.sql:392-409 (org_id TEXT, document_name,
--                      analysis_type, contradictions_found,
--                      involved_documents, created_at) + `analysis` jsonb
--                      (supabase-analysis-jsonb.sql), leído igual que en
--                      `SQL_deteccion_CLI03.sql:54-74`
-- ════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- 1 · EL CENSO DE DUPLICADOS — TODOS, NO SÓLO CLI-01
--
-- ⚠️ SE ENUMERA POR CAPACIDAD, NO POR NOMBRE (regla de F-107 P1). «CLI-01 está
-- duplicado» es una fila de una clase; la pregunta que hay que hacerle a la
-- base es «¿QUÉ códigos tienen más de una fila?». Preguntar sólo por CLI-01
-- contestaría que sí y dejaría a los demás sin contar — que es exactamente
-- cómo «eran tres endpoints» resultaron ser cuatro.
--
-- CÓMO SE LEE, escrito antes de verlo:
--   · `filas = 1` en todo → no hay duplicados y la alarma era de uno solo.
--   · `filas > 1` → cada código de ésos es un documento que NINGÚN caso puede
--     nombrar sin ambigüedad: el examen resuelve código → id, y con dos ids el
--     caso no sabe a cuál se refiere.
-- ────────────────────────────────────────────────────────────────────────
select
  split_part(d.name, '_', 1)                       as codigo,
  count(*)                                         as filas,
  count(distinct d.content_hash)                   as hashes_distintos,
  count(distinct d.source)                         as origenes_distintos,
  min(d.created_at)                                as primera,
  max(d.created_at)                                as ultima,
  array_agg(d.analysis_status order by d.created_at) as estados,
  array_agg(d.source order by d.created_at)          as origenes
from documents d
where d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
group by split_part(d.name, '_', 1)
having count(*) > 1
order by codigo;


-- ────────────────────────────────────────────────────────────────────────
-- 2 · LAS FILAS DE CLI-01, UNA A UNA
--
-- ⚠️ LA COLUMNA QUE DECIDE ES `content_hash`. Si las dos filas comparten hash,
-- el duplicado es una COPIA IDÉNTICA y la reconstrucción de F-116 sigue en
-- pie leyera la copia que leyera: los 8 trozos serían los mismos y los dos
-- fragmentos del autoclave habrían caído fuera igual. Si los hashes difieren,
-- **la reconstrucción hay que rehacerla contra la fila correcta**, porque sus
-- longitudes (998, 476, 653, 890, 450, 392, 789, 1.073) se tomaron «de la
-- base» sin saber que había dos.
--
-- La segunda que decide es `source`: un CLI-01 manual conviviendo con un
-- CLI-01 de Drive es B.162 literal (`Puntos_Pendientes_Doclity.txt:5574-5590`),
-- y entonces esto no es un accidente nuevo sino un caso conocido reabierto.
-- ────────────────────────────────────────────────────────────────────────
select
  d.id                                             as document_id,
  d.name,
  d.source,
  d.analysis_status,
  d.active_generation                              as generacion_activa,
  d.chunk_count                                    as chunk_count_en_documents,
  d.extractor_version,
  d.content_hash,
  length(d.full_text)                              as longitud_full_text,
  d.created_at                                     as fila_creada,
  d.updated_at                                     as fila_actualizada,
  (select count(*) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)     as trozos_generacion_activa,
  (select count(*) from document_chunks c
    where c.document_id = d.id)                    as trozos_todas_las_generaciones,
  (select sum(length(c.text)) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)     as caracteres_en_trozos_activos,
  (select min(c.created_at) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)     as primer_trozo_escrito,
  (select max(c.created_at) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)     as ultimo_trozo_escrito
from documents d
where d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  and d.name like 'CLI-01%'
order by d.created_at;


-- ────────────────────────────────────────────────────────────────────────
-- 3 · EL INVENTARIO DE TROZOS DE CADA CLI-01
--
-- Es la comprobación directa de la evidencia central de F-116. La
-- reconstrucción decía, para los 8 trozos de CLI-01:
--     chunk 0 → 476 · chunk 1 → 653 · chunk 2 → 998 · chunk 3 → 392
--     chunk 4 → 890 (EL AUTOCLAVE, el que no cupo por 17) · chunk 5 → 1.073
--     (EL AUTOCLAVE otra vez) · chunk 6 → 450 · chunk 7 → 789
--
-- CÓMO SE LEE:
--   · Si UNA de las filas da exactamente esas ocho longitudes → ésa es la que
--     se midió, y la aritmética de F-116 está anclada a un documento real.
--   · Si las dos las dan → copia idéntica: la causa raíz no se toca.
--   · Si NINGUNA las da → la reconstrucción se hizo sobre algo que ya no está
--     así, y F-116 necesita una nota fechada antes de seguir construyendo
--     encima.
-- ────────────────────────────────────────────────────────────────────────
select
  d.id                                             as document_id,
  d.created_at                                     as fila_creada,
  c.generation,
  c.chunk_index,
  c.chunk_type,
  length(c.text)                                   as longitud,
  left(c.text, 90)                                 as primeros_90
from documents d
join document_chunks c
  on c.document_id = d.id
 and c.generation  = d.active_generation
where d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  and d.name like 'CLI-01%'
order by d.created_at, c.chunk_index;


-- ────────────────────────────────────────────────────────────────────────
-- 4 · LA TANDA DEL 23/09, CON SU HORA — LA PREGUNTA (e)
--
-- ⚠️ ESTA ES LA CONSULTA DE LA PREGUNTA (e): «si el duplicado entró el 23/09 a
-- las 17:34 y la tanda del falso del autoclave fue ese mismo día, ¿pudo
-- contaminarla?»
--
-- CÓMO SE LEE, y el orden importa:
--   1. `created_at` de cada análisis contra `fila_creada` de la consulta 2.
--      Un análisis ANTERIOR al nacimiento del duplicado no pudo verlo: ahí la
--      pregunta se cierra sin más.
--   2. `documentos_candidatos` — cuántos DOCUMENTOS trajo la recuperación. Si
--      el duplicado estaba `analizado` y con trozos, cuenta como UNO MÁS: dos
--      candidatos con el mismo nombre.
--   3. `con_repeticion` frente a `unicos` — el par de denominadores del
--      termómetro. Dos filas distintas son dos `documentId` distintos, así que
--      la deduplicación por id NO las funde.
--   4. `involved_documents` — los nombres que el análisis tocó. Con duplicado
--      activo, CLI-01 puede aparecer por partida doble o una sola vez con dos
--      orígenes distintos detrás.
--
-- ⚠️ LO QUE NO DECIDE, y hay que decirlo para que un verde no se lea de más:
-- el presupuesto de 3.000 caracteres es **POR DOCUMENTO CANDIDATO**
-- (`lib/analysis/retrieval.ts:409-436`: el bucle va por `documentId` y llama a
-- `selectUnitsWithinBudget` con el presupuesto íntegro en cada vuelta). Así que
-- una segunda copia de CLI-01 **no le quita caracteres a la primera**, y la
-- causa raíz de F-116 —el primer ajuste dejando fuera los dos fragmentos más
-- largos— no depende de cuántos candidatos hubiera. Lo que el duplicado sí
-- puede mover es el reparto de las 6 plazas del rerank, que es otro defecto y
-- afecta al FALSO NEGATIVO, no al falso positivo.
-- ────────────────────────────────────────────────────────────────────────
select
  ar.created_at,
  ar.document_name,
  ar.analysis_type,
  ar.contradictions_found                                              as contradicciones,
  ar.contradictions_confirmed                                          as confirmadas,
  ar.duplicates_found                                                  as duplicados,
  ar.overlaps_found                                                    as solapamientos,
  ar.recommendation,
  (ar.analysis -> 'termometro' ->> 'estado')                           as termometro_estado,
  (ar.analysis -> 'termometro' ->> 'fondo')::int                       as fondo,
  (ar.analysis -> 'termometro' ->> 'documentos_candidatos')::int       as documentos_candidatos,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'crudos')::int   as crudos,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'candidatos_con_repeticion')::int as con_repeticion,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'unicos')::int   as unicos,
  (ar.analysis -> 'termometro' -> 'denominadores' ->> 'sin_fila_viva')::int as sin_fila_viva,
  ar.involved_documents,
  ar.pipeline_counters
from analysis_results ar
where ar.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  and ar.created_at >= '2026-09-23'
  and ar.created_at <  '2026-09-24'
order by ar.created_at asc;


-- ────────────────────────────────────────────────────────────────────────
-- 5 · EL VEREDICTO DE LA (e), CALCULADO Y NO LEÍDO A OJO
--
-- Cruza cada análisis del 23/09 con cada fila de CLI-01 y dice si el análisis
-- ocurrió antes o después de que esa fila existiera. Se calcula aquí en vez de
-- comparar dos tablas a ojo porque una diferencia de minutos entre dos
-- columnas de dos consultas distintas es justo el sitio donde se cuela un
-- error de lectura.
--
-- CÓMO SE LEE:
--   · `ANTERIOR AL DUPLICADO` en todas las filas → el duplicado NO pudo
--     contaminar la tanda, y la causa raíz de F-116 se queda como está.
--   · `POSTERIOR` en alguna → **pudo**, y entonces hay que mirar la consulta 4
--     (`documentos_candidatos`, `unicos`) para saber si de hecho lo hizo. Que
--     pudiera no es que ocurriera: eso lo dicen los contadores, no el reloj.
-- ────────────────────────────────────────────────────────────────────────
select
  ar.created_at                                    as analisis,
  ar.document_name,
  d.id                                             as cli01_document_id,
  d.created_at                                     as cli01_fila_creada,
  case
    when ar.created_at < d.created_at then 'ANTERIOR AL DUPLICADO: no pudo verlo'
    else 'POSTERIOR: pudo verlo — mirar los contadores de la consulta 4'
  end                                              as veredicto,
  d.analysis_status                                as cli01_estado,
  -- ⚠️ Y LA SEGUNDA CONDICIÓN, que es tan necesaria como la hora: para entrar
  -- en el corpus de un análisis del PRODUCTO hay que estar en `analizado`
  -- (`lib/pinecone/vectors.ts:99`, CORPUS_ACTIVO). Una fila `pendiente` no
  -- participa aunque sea anterior.
  case
    when d.analysis_status = 'analizado' then 'en el corpus activo'
    else 'fuera del corpus activo: no participa aunque exista'
  end                                              as cli01_participa
from analysis_results ar
cross join documents d
where ar.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  and ar.created_at >= '2026-09-23'
  and ar.created_at <  '2026-09-24'
  and d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  and d.name like 'CLI-01%'
order by ar.created_at, d.created_at;


-- ────────────────────────────────────────────────────────────────────────
-- 6 · RRHH-04 — ¿DOCUMENTO CORTO O EXTRACCIÓN A MEDIAS?
--
-- ⚠️ LAS DOS CIFRAS QUE LO DECIDEN, Y SON DISTINTAS ENTRE SÍ:
--   · `longitud_full_text` — lo que la EXTRACCIÓN sacó del fichero.
--   · `caracteres_en_trozos_activos` — lo que el TROCEADO dejó indexado.
--
-- CÓMO SE LEE, contra el tamaño del .md que el director tiene delante:
--   · full_text ≈ tamaño del fichero  y  trozos ≈ full_text  → el documento es
--     corto de verdad. Un trozo es correcto y el falso 3 se puede escribir.
--   · full_text MUCHO menor que el fichero → **la extracción se quedó a
--     medias**. El caso mediría el vacío y no se escribe hasta repararlo.
--   · full_text grande y trozos ≈ 1 → extrajo bien y el troceado no. Es el
--     fallo que ensucia el almacén, y va primero (regla de F-104).
--
-- ⚠️ EL NÚMERO CONTRA EL QUE SE COMPARA NO ES 2.000. El troceador tiene
-- `CHUNK_SIZE = 1200` y subdivide toda sección que pase de `MAX_CHUNK_SIZE =
-- 1500` (`lib/chunking.ts:26-28`). Así que **un solo trozo de prosa significa
-- ≤ 1.500 caracteres**, no ≤ 2.000 — la sospecha es más fuerte, no más débil.
-- La excepción es `chunk_type = 'table_summary'`, que NUNCA se subdivide
-- (F-51) y puede ser tan largo como quiera: por eso la columna `chunk_type`
-- va en la consulta y no es decorado.
-- ────────────────────────────────────────────────────────────────────────
select
  d.id                                             as document_id,
  d.name,
  d.source,
  d.analysis_status,
  d.active_generation                              as generacion_activa,
  d.chunk_count                                    as chunk_count_en_documents,
  d.extractor_version,
  length(d.full_text)                              as longitud_full_text,
  d.created_at                                     as fila_creada,
  d.updated_at                                     as fila_actualizada,
  (select count(*) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)     as trozos_generacion_activa,
  (select count(*) from document_chunks c
    where c.document_id = d.id)                    as trozos_todas_las_generaciones,
  (select sum(length(c.text)) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)     as caracteres_en_trozos_activos,
  (select max(c.created_at) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)     as indexado_aprox
from documents d
where d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  and d.name like 'RRHH-04%'
order by d.created_at;


-- ────────────────────────────────────────────────────────────────────────
-- 7 · EL TROZO (O LOS TROZOS) DE RRHH-04, CON TEXTO
--
-- ⚠️ SE PIDEN LOS 400 PRIMEROS CARACTERES A PROPÓSITO, y no el texto entero:
-- con el principio basta para ver POR DÓNDE se cortó —si acaba a mitad de
-- frase, la extracción se truncó; si acaba en el final natural del documento,
-- el documento es corto—. Pedir el texto completo sería sacar contenido del
-- cliente a un sitio donde nadie lo va a mirar (regla de F-94 P3).
--
-- ⚠️ Y LA COMPROBACIÓN QUE DECIDE EL FALSO 3: el caso RRHH-04 ↔ RRHH-06
-- necesita que esta cita literal de `claude/Consulta_Fable_F22_Juez.md:71-73`
-- esté DENTRO de un trozo:
--       «Protocolo de esterilización... (ver CLI-01 y CLI-02»
-- Si el texto extraído no la contiene, el discriminante sale AUSENTE y eso no
-- invalida el caso: invalida la LÍNEA DE BASE (`lib/examen/discriminantes.mjs`).
-- ────────────────────────────────────────────────────────────────────────
select
  d.name,
  c.generation,
  c.chunk_index,
  c.chunk_type,
  length(c.text)                                   as longitud,
  left(c.text, 400)                                as primeros_400,
  right(c.text, 200)                               as ultimos_200,
  (c.text ilike '%esteriliza%')                    as menciona_esterilizacion,
  (c.text ilike '%CLI-01%')                        as menciona_cli01
from documents d
join document_chunks c
  on c.document_id = d.id
 and c.generation  = d.active_generation
where d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
  and d.name like 'RRHH-04%'
order by c.chunk_index;
