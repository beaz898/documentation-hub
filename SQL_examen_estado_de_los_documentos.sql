-- ════════════════════════════════════════════════════════════════════════
-- SQL_examen_estado_de_los_documentos.sql — LO QUE BLOQUEA EL EXAMEN
-- (25/09/2026)
--
-- ⚠️ RENOMBRADO EL MISMO DÍA: nació como «_de_los_ocho» y son TRECE. Los casos
-- N1 y N2 —los de esperado cero, que son la cura de la carencia grave de la
-- consulta rápida— añadieron RRHH-06, OPE-02, MKT-01, CLI-03 y NOR-01. Un
-- fichero cuyo nombre dice ocho y cuyo cuerpo comprueba trece es la misma clase
-- de fallo que B.113, y se corrige en cuanto se ve, no cuando molesta.
--
-- ⚠️⚠️ Y AHORA SON DIECIOCHO — segunda ampliación el mismo 25/09, y por eso el
-- nombre del fichero ya no lleva ningún número. Los cinco documentos de los
-- falsos de agosto entraron en `corpus-pruebas/` a las 17:14 (`31c141d6`) y
-- desbloquean cuatro casos nuevos: N3 (pelo), N4 (esterilización), N5 (alarma) y
-- N6 (autoclave, con la trampa REAL del par en `debenSalir`). Añaden CLI-01,
-- OPE-01, NOR-04, RRHH-04 y RRHH-05.
--   Un nombre con cifra dentro se pudre a la segunda ampliación, y ésta llegó el
--   mismo día que la primera. Por eso el rótulo dice «los documentos» y el
--   número vive sólo en el cuerpo, donde se puede contar.
--
-- SOLO LEE. Ni un INSERT, ni un UPDATE, ni un DELETE. Lo ejecuta el director
-- en Supabase; Claude no lo ejecuta.
--
-- La organización de pruebas va escrita tal cual, que es la del protocolo del
-- harness (claude/Protocolo_Harness_Tasas.md:846):
--     5a82712f-6740-4792-b291-3fdea8e6edb1
--
-- ⚠️ POR QUÉ BLOQUEAN, y no es ceremonia:
--   · ✅ LOS CRÉDITOS YA NO BLOQUEAN, y queda declarado: el director midió
--     **3.719 créditos** en la organización de pruebas y **23,77 $** de cartera
--     el 25/09/2026. ⚠️ **LA CUENTA CAMBIA CON LOS CUATRO CASOS NUEVOS**: con
--     DIEZ casos son **250 créditos** por tanda rutinaria (10 × 5 pasadas × 5) y
--     **1.000** por fijación completa (dos tandas de 10, el criterio de Fable),
--     o sea **14 tandas rutinarias o 3 fijaciones** en vez de 24 y 6. Sigue sin
--     bloquear, y la cifra se recalcula aquí en vez de dejarla dicha para seis
--     casos: un divisor que se queda viejo miente hacia arriba, que es el lado
--     peligroso. La consulta 1 se queda igualmente: una cifra medida hoy no es
--     una cifra medida el día que se lance, y volver a mirarla cuesta cero.
--   · ⚠️ LO QUE SIGUE BLOQUEANDO: si los DIECIOCHO documentos no están indexados en
--     esa organización, la recuperación no puede devolver nada. Ningún filtro
--     arregla eso, y el examen mediría el vacío.
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
  -- Tanda RUTINARIA = 10 casos x 5 pasadas x 5 créditos = 250 (eran 6 casos y
  -- 150 hasta el 25/09: los cuatro casos de los falsos de agosto suben el coste).
  floor((o.credits_remaining + o.credits_extra) / 250.0)       as tandas_rutinarias_que_caben,
  -- FIJACIÓN COMPLETA = las DOS tandas de 10 que exige el criterio de Fable
  -- («dos tandas de 10 seguidas deben dar el mismo reparto»): 10 x 10 x 5 x 2 = 1.000.
  floor((o.credits_remaining + o.credits_extra) / 1000.0)      as fijaciones_completas_que_caben,
  -- Y un caso suelto, por si hay que empezar de a uno: 5 pasadas x 5 = 25.
  floor((o.credits_remaining + o.credits_extra) / 25.0)        as casos_sueltos_que_caben
from organizations o
where o.id = '5a82712f-6740-4792-b291-3fdea8e6edb1'::uuid;


-- ────────────────────────────────────────────────────────────────────────
-- 2 · EL ESTADO DE LOS DIECIOCHO DOCUMENTOS DE LOS DIEZ CASOS
--
-- El nombre se busca por prefijo del código (NOR-10, CLI-12, …) porque el
-- `documents.name` puede llevar o no la extensión y puede haber sido renombrado
-- al subirlo. Si una fila sale con `coincidencias > 1`, hay más de un documento
-- con ese código en la organización y el examen NO debe lanzarse: el endpoint
-- no sabría a cuál se refiere el caso.
--
-- ⚠️ Y SE SABE YA DE UNO: **CLI-01 está duplicado**, leído por el director el
-- 25/09. Con la ampliación a dieciocho eso deja de ser sólo un problema de
-- higiene y pasa a tocar un caso: **N6 nombra CLI-01**, así que hasta que haya
-- una sola fila ese caso no se puede lanzar. Los otros nueve sí.
--   Las dos filas NO se limpian antes de medirlas: son la evidencia de la
--   pregunta (e) —¿contaminó la tanda del 23/09?— y eso lo contesta
--   `SQL_CLI01_duplicado_y_RRHH04.sql`, que se ejecuta ANTES que este fichero.
--
-- LEER ASÍ:
--   · `filas_en_la_base = 0`        → el documento NO está en esta organización.
--   · `trozos_generacion_activa = 0` → está la fila pero no sus trozos: el
--                                      examen no podría recuperar nada de él.
--   · `analysis_status` da igual para el examen (buildCorpusExacto no lo mira),
--     pero se pide porque dice si además participa en el corpus del PRODUCTO, y
--     eso cambia lo que ve cualquier análisis que NO sea el examen.
-- ────────────────────────────────────────────────────────────────────────
-- ⚠️ UNA FILA POR DOCUMENTO, aunque varios los usen DOS o TRES casos: RRHH-06
-- sale en N1 (el par), en N2 (acompañante) y en N4 (el par otra vez); MKT-01 en
-- N2 y en N3; OPE-01 en N5 y en N6. Se listan una vez cada uno y la columna
-- `usado_en` dice dónde: repetir un documento por caso haría la tabla más larga
-- y el veredicto ambiguo —el mismo documento saldría LISTO y NO ESTÁ a la vez si
-- alguien se equivoca al leer.
with los_documentos(usado_en, codigo) as (
  values
    ('P1 · prosa, 4 contradicciones',         'NOR-10'),
    ('P1 · prosa, 4 contradicciones',         'CLI-12'),
    ('P2 · prosa, 3 superficies',             'NOR-11'),
    ('P2 · prosa, 3 superficies',             'CLI-13'),
    ('P3 · tablas, 3 montones',               'OPE-10'),
    ('P3 · tablas, 3 montones',               'OPE-11'),
    ('P4 · sin clave, 2 ramas',               'RRHH-08'),
    ('P4 · sin clave, 2 ramas',               'OPE-13'),
    ('N1 falsos + N2 acompañante + N4 par',   'RRHH-06'),
    ('N1 · falsos conocidos + N2 acompañante','OPE-02'),
    ('N2 · pareja limpia + N3 · el par',      'MKT-01'),
    ('N2 · acompañante',                      'CLI-03'),
    ('N2 · acompañante',                      'NOR-01'),
    -- Los cinco de los falsos de agosto (`31c141d6`, 25/09 17:14). Su registro
    -- es `corpus-pruebas/SIEMBRA_falsos_de_agosto.md`.
    ('N3 · pelo recogido (el corpus)',        'RRHH-05'),
    ('N4 · esterilización (el analizado)',    'RRHH-04'),
    ('N5 · alarma (el analizado)',            'NOR-04'),
    ('N5 · alarma + N6 · autoclave',          'OPE-01'),
    ('N6 · autoclave (el corpus)',            'CLI-01')
),
encontrados as (
  select
    l.usado_en,
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
  from los_documentos l
  left join documents d
    on d.org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
   and d.name like l.codigo || '%'
)
select
  e.usado_en,
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
  -- Para las hojas de cálculo —OPE-10, OPE-11, RRHH-08, OPE-13, RRHH-06 y
  -- OPE-02—: si no hay trozos de tipo table_row, el emparejador de tablas no
  -- tiene con qué trabajar y P3, P4 y la mitad de N1 no miden nada.
  -- ⚠️ En los de prosa esta columna vale 0 y es CORRECTO: no se lee como fallo.
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
order by e.usado_en, e.codigo;


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
