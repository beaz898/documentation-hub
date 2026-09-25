-- ════════════════════════════════════════════════════════════════════════
-- SQL_examen_estado_de_los_ocho.sql — LAS DOS COSAS QUE BLOQUEAN EL EXAMEN
-- (25/09/2026)
--
-- SOLO LEE. Ni un INSERT, ni un UPDATE, ni un DELETE. Lo ejecuta el director
-- en Supabase; Claude no lo ejecuta.
--
-- La organización de pruebas va escrita tal cual, que es la del protocolo del
-- harness (claude/Protocolo_Harness_Tasas.md:846):
--     5a82712f-6740-4792-b291-3fdea8e6edb1
--
-- ⚠️ POR QUÉ BLOQUEAN, y no es ceremonia:
--   · Una pasada del examen son 20 análisis = 100 CRÉDITOS. En plan free (50)
--     el examen se para a mitad de la primera pasada con un 402, y el informe
--     diría «no detectó nada» en los casos que no llegaron a correr: un cero de
--     saldo indistinguible de un cero de detección.
--   · Y si los ocho documentos no están indexados en esa organización, la
--     recuperación no puede devolver nada. Ningún filtro arregla eso, y el
--     examen mediría el vacío.
--
-- ⚠️ TODAS LAS COLUMNAS DE ABAJO SE COMPROBARON EN EL ESQUEMA ANTES DE
-- ESCRIBIRLAS, y no es retórica: el 23/09 se entregó un SQL con tres nombres de
-- campo inventados que habrían devuelto columnas NULL sin avisar.
--   documents:        supabase-setup.sql:279-298 (id, name, org_id TEXT,
--                     chunk_count, created_at, updated_at, source, content_hash)
--                     + supabase-analysis-status.sql:11-13 (analysis_status,
--                       con CHECK: pendiente | en_analisis | analizado |
--                       desactualizado)
--                     + supabase-c4-generation-model.sql:7 (active_generation)
--                     + supabase-f20-chunks-estructurados.sql:14
--                       (extractor_version)
--   document_chunks:  supabase-f20-chunks-estructurados.sql:22-48
--                     (document_id, org_id, generation, chunk_index,
--                      chunk_type, text, created_at)
--   organizations:    supabase-setup.sql:221-239 (id uuid, plan,
--                     credits_remaining, credits_extra)
--
-- ⚠️ NO HAY COLUMNA `indexed_at` NI NADA PARECIDO — comprobado en los 35 ficheros
-- .sql del repositorio. La «fecha de indexado» que se pide se responde con
-- `max(document_chunks.created_at)` de la generación activa, que es cuando se
-- escribieron los trozos que hoy se sirven. Es un proxy, y se dice: si alguien
-- reindexó reutilizando (document_id, generation), la fecha es la del último
-- borra-y-reinserta, no la de la primera vez.
--
-- ⚠️⚠️ Y LO QUE ESTE SQL **NO PUEDE CONTESTAR**, que es media pregunta 2:
-- **SI TIENEN VECTORES.** Los vectores viven en PINECONE, no en Supabase, y no
-- hay ninguna tabla que los espeje. Lo que la consulta 2 cuenta son las filas de
-- `document_chunks`, que es el reflejo en la base de lo mismo que se indexó —el
-- mismo camino escribe las dos cosas— pero NO es una prueba de que el vector
-- esté en el índice. La diferencia entre las dos no es teórica: es exactamente
-- CLI-05 (F-115), un documento sin fila al que el índice seguía sirviendo
-- vectores.
--   Para saberlo de verdad hay una herramienta que SÍ mira Pinecone, y es de
--   solo lectura:  GET /api/admin/vectores-de-un-documento?documentId=<uuid>
--   Devuelve los vectores encontrados, su reparto por generación y si el
--   reparto cuadra con lo que dice la base.
-- ════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────
-- 1 · LOS CRÉDITOS DE LA ORGANIZACIÓN DE PRUEBAS
--
-- `consume_credits` gasta primero del plan y luego de los extra
-- (supabase-setup.sql:118-119), así que lo que decide cuántas pasadas caben es
-- la SUMA de los dos.
-- ────────────────────────────────────────────────────────────────────────
select
  o.id,
  o.name,
  o.plan,
  o.credits_remaining,
  o.credits_extra,
  o.credits_remaining + o.credits_extra                        as creditos_totales,
  -- Una pasada del examen = 4 casos x 5 pasadas x 5 créditos = 100.
  floor((o.credits_remaining + o.credits_extra) / 100.0)       as pasadas_completas_que_caben,
  -- Y con un solo caso, por si hay que empezar de a uno: 5 pasadas x 5 = 25.
  floor((o.credits_remaining + o.credits_extra) / 25.0)        as casos_sueltos_que_caben
from organizations o
where o.id = '5a82712f-6740-4792-b291-3fdea8e6edb1'::uuid;


-- ────────────────────────────────────────────────────────────────────────
-- 2 · EL ESTADO DE LOS OCHO DOCUMENTOS DE LAS CUATRO PAREJAS
--
-- El nombre se busca por prefijo del código (NOR-10, CLI-12, …) porque el
-- `documents.name` puede llevar o no la extensión y puede haber sido renombrado
-- al subirlo. Si una fila sale con `coincidencias > 1`, hay más de un documento
-- con ese código en la organización y el examen NO debe lanzarse: el endpoint
-- no sabría a cuál se refiere el caso.
--
-- LEER ASÍ:
--   · `filas_en_la_base = 0`        → el documento NO está en esta organización.
--   · `trozos_generacion_activa = 0` → está la fila pero no sus trozos: el
--                                      examen no podría recuperar nada de él.
--   · `analysis_status` da igual para el examen (buildCorpusExacto no lo mira),
--     pero se pide porque dice si además participa en el corpus del PRODUCTO, y
--     eso cambia lo que ve cualquier análisis que NO sea el examen.
-- ────────────────────────────────────────────────────────────────────────
with los_ocho(pareja, codigo) as (
  values
    ('P1 · prosa, 4 contradicciones', 'NOR-10'),
    ('P1 · prosa, 4 contradicciones', 'CLI-12'),
    ('P2 · prosa, 3 superficies',     'NOR-11'),
    ('P2 · prosa, 3 superficies',     'CLI-13'),
    ('P3 · tablas, 3 montones',       'OPE-10'),
    ('P3 · tablas, 3 montones',       'OPE-11'),
    ('P4 · sin clave, 2 ramas',       'RRHH-08'),
    ('P4 · sin clave, 2 ramas',       'OPE-13')
),
encontrados as (
  select
    l.pareja,
    l.codigo,
    d.id,
    d.name,
    d.analysis_status,
    d.active_generation,
    d.chunk_count,
    d.extractor_version,
    d.source,
    d.created_at,
    d.updated_at
  from los_ocho l
  left join documents d
    on d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
   and d.name like l.codigo || '%'
)
select
  e.pareja,
  e.codigo,
  -- ⚠️ Cuántos documentos de esa organización empiezan por ese código. Si sale
  -- más de 1, el examen NO se lanza: el caso nombra un código y el endpoint no
  -- sabría a cuál de los dos se refiere. Se resuelve con subconsulta y no con
  -- función de ventana a propósito: menos sintaxis que pueda fallar en una
  -- consulta que se ejecuta una sola vez y a mano.
  (select count(*) from documents d2
    where d2.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
      and d2.name like e.codigo || '%')             as coincidencias,
  e.id                                              as document_id,
  e.name                                            as nombre_en_la_base,
  e.analysis_status,
  e.active_generation                               as generacion_activa,
  e.chunk_count                                     as chunk_count_en_documents,
  e.extractor_version,
  e.source,
  e.created_at                                      as fila_creada,
  e.updated_at                                      as fila_actualizada,
  -- Los trozos REALES de la generación que hoy se sirve. Es el número que
  -- decide: sin trozos no hay nada que recuperar.
  (select count(*) from document_chunks c
    where c.document_id = e.id
      and c.generation  = e.active_generation)      as trozos_generacion_activa,
  -- ⚠️ Si esto no coincide con `chunk_count_en_documents`, la fila y los trozos
  -- discrepan, y el termómetro lo notaría como fondo raro. Conviene verlo antes.
  (select count(*) from document_chunks c
    where c.document_id = e.id)                     as trozos_todas_las_generaciones,
  (select max(c.created_at) from document_chunks c
    where c.document_id = e.id
      and c.generation  = e.active_generation)      as indexado_aprox,
  -- Para P3 y P4, que son hojas de cálculo: si no hay trozos de tipo table_row,
  -- el emparejador de tablas no tiene con qué trabajar y el caso no mide nada.
  (select count(*) from document_chunks c
    where c.document_id = e.id
      and c.generation  = e.active_generation
      and c.chunk_type  = 'table_row')              as trozos_de_fila_de_tabla,
  case
    when e.id is null                              then 'NO ESTA EN LA ORGANIZACION'
    when (select count(*) from document_chunks c
           where c.document_id = e.id
             and c.generation  = e.active_generation) = 0
                                                   then 'SIN TROZOS: NO RECUPERABLE'
    else 'LISTO'
  end                                               as veredicto
from encontrados e
order by e.pareja, e.codigo;


-- ────────────────────────────────────────────────────────────────────────
-- 3 · POR SI ALGÚN CÓDIGO NO APARECE: QUÉ HAY EN ESA ORGANIZACIÓN
--
-- Se ejecuta SOLO si la consulta 2 devuelve algún 'NO ESTA EN LA ORGANIZACION'.
-- Sirve para distinguir «no se subió» de «se subió con otro nombre», que son dos
-- problemas distintos con dos arreglos distintos.
-- ────────────────────────────────────────────────────────────────────────
select
  d.name,
  d.analysis_status,
  d.active_generation,
  d.source,
  d.created_at,
  (select count(*) from document_chunks c
    where c.document_id = d.id
      and c.generation  = d.active_generation)      as trozos_activos
from documents d
where d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
order by d.name;
