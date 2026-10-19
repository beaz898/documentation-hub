-- ============================================================================
-- F-128 · EL JUEZ CON HAIKU 5.5: TRES PASADAS DE NOR-10 (LA LÍNEA BASE ES LA DEL
-- 16/10, CON HAIKU 4.5) — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- ⚠️ SACA TEXTO DE DOCUMENTO, ENTERO: las citas publicadas y su contexto. Son
-- NOR-10, CLI-12 y lo que el juez compare en esas pasadas, documentos del corpus
-- de pruebas, NO de un cliente.
--
-- ES SQL_F127_01 CON LA MISMA LÓGICA (19/10/2026). SQL_F127_01 se queda como
-- está porque es el instrumento con el que se midió la línea base del 16/10, y
-- su cabecera describe esa medición. Lo que cambia aquí, y nada más:
--   · la ventana: las tres pasadas de Haiku 5.5, entre las DOS MARCAS de abajo
--     (la ventana gana límite superior); y la FRANJA PREVIA, del final de la
--     línea base del 16/10 (12:46) a la primera marca, que debe estar vacía;
--   · el bloque 1 dice con qué MODELO juzgó el juez cada pareja y cuántos TOKENS
--     DE SALIDA gastó (lecturaDeLasParejas[].modelo y .tokensDeSalida, F-128), y
--     el bloque 2 los repite junto a cada contradicción publicada;
--   · y un control más, el 0.9: toda pareja de la ventana lleva su modelo, o el
--     código desplegado no es el de F-128.
-- LAS APARICIONES DE CADA CITA (19/10/2026, arquitecto): el salto de «Mejora con IA»
-- busca la cita del nuevo en el texto del editor —`documents.full_text`, el que
-- carga la bandeja (app/api/documents/[id]/text)— y se queda con la PRIMERA aparición
-- (components/ImprovementModal.tsx:318-336, lib/texto/localizar-cita.ts). Una cita
-- literal que aparezca más de una vez puede llevar al párrafo equivocado. El bloque 2
-- dice cuántas veces aparece cada una: la del nuevo en lo entregado (el texto que
-- leyó el juez) y en su full_text; la del existente, en su full_text (su bloque no se
-- guarda). Cuenta LITERAL, sin la tolerancia de espacios y comillas de findTolerant:
-- puede quedarse corto, nunca pasarse. Y el bloque 2c resume cuántas citas aparecen
-- más de una vez en el documento completo.
--
-- ⚠️ EL CLASIFICADOR, CAMBIADO EL 19/10/2026 (bloques 2 y 3). En SQL_F127_01 la
-- especie salía de buscar palabras en el tema y en las dos citas JUNTOS, así que
-- bastaba una sola: es lo que el 16/10 contó como OTRA la contradicción del
-- autoclave, que por contenido era A (el defecto 5.7 de F-127). AHORA SE
-- CLASIFICA POR EL PAR DE DATOS, UNO EN CADA CITA (arquitecto, 19/10):
--   · C si la del NUEVO dice «6 meses»                 y la del EXISTENTE «12 meses»;
--   · B si la del NUEVO dice «semanal» o «lunes»       y la del EXISTENTE «mensual»;
--   · D si la del NUEVO dice «recaer»                  y la del EXISTENTE «nunca»;
--   · A si la del NUEVO dice «responsab-»              y la del EXISTENTE «coordinador
--     de calidad».
-- Hacen falta los dos, cada uno en su lado. Lo demás es OTRA, y se lee.
--
-- Todo lo demás —la reconstrucción del texto entregado, la sonda
-- de la frase partida, los controles 0.1 a 0.8—, idéntico a SQL_F127_01: lee
-- su cabecera para la definición de cada cosa.
-- ✅ PROBADO ANTES DE ENTREGARLO (19/10/2026) en PGlite, con el arnés de
-- SQL_F127_01 adaptado y los trozos reales de NOR-10 y CLI-12: con tres pasadas
-- los controles salen OK, y falla el 0.9 cuando una pareja no lleva modelo. Con
-- el clasificador por dato (19/10), la A real (las dos frases de la línea base)
-- sale A, y las citas que no llevan los dos datos salen OTRA. Las APARICIONES
-- (19/10): con la cita de A repetida a propósito en el full_text, sale 1 en lo
-- entregado y 2 en el documento, y el bloque 2c la caza en las tres. Los NO APLICA
-- (19/10): la relectura del 16/10 sale sin un FALLA, con el 0.9 en NO APLICA y no en
-- OK; una franja al revés sale NO APLICA; y la franja desde el 13/10 caza una pasada
-- metida el 15/10. LA SEGUNDA COLUMNA (19/10), con los trozos y el full_text reales de
-- NOR-10 y CLI-12, y con el par de A por el CARGO (19/10): la A de la línea base sale
-- A en las dos columnas, y las tres A de la tanda (reconstruidas de la descripción del
-- arquitecto, sin sujeto), OTRA por la cita y A por la frase: hallazgo bueno, cita
-- mala. Tres mutaciones caen: sin el principio de frase, sin el final y sin el par en
-- la frase. CON DATOS REALES NO SE HA EJECUTADO.
-- ✅ EL ARNÉS VIVE EN EL REPOSITORIO Y CORRE EN LA SUITE desde el 19/10/2026 (arquitecto):
-- `claude/arneses/f128/sql-f128-02-nor10.test.ts`, en PGlite, con el texto de `corpus-pruebas/`. Un cambio en
-- este fichero que rompa un control, un par o un límite de la frase pone `npm test` en rojo.
--
-- ⚠️ LA SEGUNDA COLUMNA: LA ESPECIE POR LA FRASE (19/10/2026, aprobada por el
-- arquitecto). **POR QUÉ EXISTE: el 19/10 el clasificador dio OTRA a TRECE
-- hallazgos correctos de trece** —las cuatro NEGACIÓN de NOR-11 y las nueve A de
-- NOR-10 de la tanda de Haiku 5.5—, **porque exige el dato DENTRO de la cita y el
-- juez cita trozos de frase.** Con una sola columna, «acierto mal citado» y «fallo
-- de verdad» salían con la misma etiqueta, OTRA.
--   · La PRIMERA columna no cambia: clasifica la CITA, que es lo que ve el usuario.
--   · La SEGUNDA busca cada cita LITERAL en el full_text de su documento, coge la
--     frase que la contiene (del último «. » o salto de línea anterior al
--     siguiente) y le aplica el MISMO par de datos: la constante `pares`, en un
--     solo sitio. Sin la cita literal en el full_text sale «SIN FRASE», nunca OTRA.
--     El bloque 2d cruza las dos columnas por pasada.
--   · ⚠️ **NO CUENTA COMO ACIERTO**: también puede inventarse uno (probado en
--     SQL_F128_01 con el texto real). Sirve para LEER una OTRA, no para contar.
--   · Límite declarado: el corte por «. » falla con abreviaturas («p. ej.») y no
--     conoce «?», «!» ni «;».
--   · **EL PAR DE A ES EL CARGO Y LA DECISIÓN** (arquitecto, 19/10, rectificando su decisión de
--     media hora antes, que lo dejaba sólo en el cargo). El registro dice, entero: «dos figuras
--     distintas señaladas como autoridad última sobre el mismo proceso, en el mismo tipo de
--     decisión (autorizar excepciones, firmar auditorías, retirar un autoclave de servicio)». Un
--     lado casa si lleva su cargo Y una de las formulaciones; si falta cualquiera, OTRA.
--   · ✅ **«RESPONSABLE ÚLTIMO» / «RESPONSABILIDAD ÚLTIMA», LA CUARTA FORMULACIÓN: propuesta por
--     Code y APROBADA por el arquitecto el 19/10.** La razón: es la frase de la NEGRITA del
--     registro (la Versión 1 de NOR-10 2.1 y la Versión 2 de CLI-12 3.1), y no lleva ninguna de
--     las tres decisiones; sin ella, la propia frase sembrada y la A de la línea base del 16/10
--     salen OTRA en las dos columnas (probado). Es la regla 3 aplicada a A.
--   · ⚠️ **«LA D VIVE PEGADA A LA A» (registro), comprobado el 19/10**: la segunda frase de NOR-10
--     2.4 («El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad
--     última…») lleva cargo y formulación, y es territorio de D. **Contra la frase de D de CLI-12
--     (3.5), NO sale A**: el 3.5 no lleva ninguna formulación de A en el lado existente, y sale
--     OTRA en las dos columnas —con el par anterior, «responsab-» / «coordinador de calidad», sí
--     salía A—. La primera frase de 2.4 contra el 3.5 sale D. Y la segunda contra el 3.1 sale A,
--     y es lo correcto: el 3.1 es la Versión 2 de A y lo que se contradice es quién responde. Los
--     tres casos son controles del arnés. Lo que sí queda: una D citada por la segunda frase de
--     2.4 sale OTRA, un falso fallo de D (su par pide «puede recaer en el propio Director
--     Clínico»).
--   · Y el contraejemplo que motivó la rectificación —«se notifica al Director Clínico y se
--     repite la esterilización…» contra «coordinada conjuntamente por el Coordinador de Calidad
--     y el Director Clínico…»— sale OTRA en las dos columnas; es control negativo del arnés.
--
-- ⚠️ LAS REGLAS DEL MEDIDOR (arquitecto, 19/10/2026; reescritas enteras esa misma tarde):
--   1. **EL PAR DE DATOS DE CADA ESPECIE SE TOMA DE LOS VALORES QUE DECLARA EL REGISTRO DE
--      SIEMBRA, ENTEROS, NUNCA DE UNA PALABRA ELEGIDA A OJO.** Los registros:
--      `corpus-pruebas/SIEMBRA_caso_control.md` (NOR-11 ↔ CLI-13) y
--      `corpus-pruebas/SIEMBRA_corpus_ampliado.md` §1 (NOR-10 ↔ CLI-12): la negrita de la tabla
--      de cada contradicción y su «Naturaleza del conflicto».
--   2. **Y TIENE QUE SER LO BASTANTE ESPECÍFICO PARA NO CASAR DOS CITAS QUE NO HABLAN DE LO
--      MISMO.** La prueba es mecánica: se cuenta cuántas veces aparece cada término en su
--      documento. «72 horas» sale dos veces y discrimina; «Director Clínico» sale diecisiete y
--      no discrimina solo. **Si un término pasa de dos o tres apariciones, necesita la otra mitad
--      de lo que declara el registro**, y entonces un lado casa sólo si lleva las dos.
--   3. **UN HALLAZGO CORRECTO PUEDE CITAR MÁS DE UNA FRASE**: el par acepta todas las
--      formulaciones literales de la regla que existan en el documento, no sólo la de la negrita.
--   Las dos averías del 19/10 son los ejemplos: **NEGACIÓN pedía de menos y A pedía de más**
--   (palabras del arquitecto). NEGACIÓN aceptaba una sola formulación, la de «amarill-», y se dejaba fuera
--   la negativa sembrada; A pidió primero «responsab-», que no es lo que declara el registro, y
--   después sólo el cargo, que sale 17 y 33 veces.
--   LOS RECUENTOS, en el full_text de cada documento, sin mayúsculas ni acentos (medidos por
--   Code el 19/10 con los textos del corpus; se revisan sin volver a medir):
--     C   NOR-10 «6 meses» 1                                 CLI-12 «12 meses» 2
--     A   NOR-10 «Director Clínico» 17, y además una de:      CLI-12 «Coordinador de Calidad» 33, y además una de:
--           «autoriza cualquier excepción» 1                    «autoriza cualquier excepción» 1
--           «firma de los registros de auditoría» 1             «firma los registros de auditoría» 1
--           «retirar del servicio un autoclave» 1               «retirada de servicio de un autoclave» 1
--           «responsable último» 2 · «responsabilidad           «responsable último» 2
--           última» 2
--     B   NOR-10 «semanalmente, todos los lunes» 1             CLI-12, una de:
--                                                             «periodicidad mensual, el primer día laborable de cada mes» 1
--                                                             «esta periodicidad mensual se considera suficiente» 1
--                                                             «criterio de periodicidad mensual del control biológico» 1
--                                                             «control biológico mensual» 1
--         (antes «semanal» 11 o «lunes» 1 / «mensual» 14: casaba el test semanal de la cubeta
--         contra los resultados que se consolidan mensualmente)
--     D   NOR-10 «puede recaer en el propio Director Clínico» 1  CLI-12 «nunca por el Director Clínico del propio centro» 1
--         (antes «recaer» 1 / «nunca» 2: casaba con «nunca como mecanismo de control individual»)
--     B y D, al valor declarado entero y con las otras formulaciones literales del documento
--     (arquitecto, 19/10). En NOR-10 no hay otra formulación de B ni de D; en CLI-12, B tiene tres
--     más (el 12.1 y el 12.8 vuelven sobre la periodicidad mensual) y D ninguna.
--
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LO ÚNICO QUE TOCA EL DIRECTOR: los CUATRO VALORES de la constante        │
-- │ `parametros` marcados con flecha; las horas en hora de Madrid y con este │
-- │ formato exacto:  timestamptz 'AAAA-MM-DD HH:MM:SS+02'                     │
-- │ ⚠️ El «+02» es el horario de verano. Desde el domingo 25/10/2026 a las   │
-- │ 03:00 es «+01».                                                           │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ PONER EN CADA LECTURA (se copia tal cual; aprobado por el arquitecto el 19/10/2026):
--
--   lectura                DESDE                    HASTA                    INICIO DE LA FRANJA PREVIA   EXIGIR MODELO
--   ─────────────────────  ───────────────────────  ───────────────────────  ───────────────────────────  ─────────────
--   la LÍNEA BASE del      '2026-10-16 12:40:00+02' '2026-10-16 12:50:00+02' '2026-10-13 21:20:36+02'     false
--   16/10 (Haiku 4.5,                                                        (el push de 2fe72b4e, lo
--   releída con este                                                         que comprobaba SQL_F127_01)
--   clasificador)
--   la TANDA de Haiku 5.5  1 min antes de la        1 min después de la      '2026-10-16 12:50:00+02'     true
--                          primera de NOR-10        última                   (el final de la línea base)
--
-- **Ningún control debe fallar; si alguno falla, es que pasó algo**: un control que
-- se espera que falle es un control muerto (arquitecto, 19/10/2026). Y **un control
-- que no puede mirar nada no sale OK: sale «NO APLICA»** (arquitecto, 19/10/2026):
--   · el 0.2, si el INICIO DE LA FRANJA PREVIA no va antes de DESDE (intervalo al
--     revés: no hay franja que mirar);
--   · el 0.9, con EXIGIR MODELO en false: las pasadas anteriores a F-128 no guardan
--     el modelo, y exigirlo las daría en rojo a propósito.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         -- ↓↓↓ LOS CUATRO VALORES: lo único que se toca (la tabla de la cabecera dice qué poner) ↓↓↓
         -- ⚠️ «+02» vale hasta el domingo 25/10/2026 a las 03:00; desde ahí es «+01».
         -- (Vienen puestos los de la LÍNEA BASE del 16/10, la siguiente lectura aprobada.)
         timestamptz '2026-10-16 12:40:00+02' AS desde,           -- ← DESDE
         timestamptz '2026-10-16 12:50:00+02' AS hasta,           -- ← HASTA
         timestamptz '2026-10-13 21:20:36+02' AS push,            -- ← INICIO DE LA FRANJA PREVIA (la franja va de aquí a DESDE)
         false AS exigir_modelo,                                  -- ← EXIGIR MODELO: true en la tanda, false en la línea base
         -- ↑↑↑ ↑↑↑
         3 AS esperado
),
-- EL PAR DE DATOS DE CADA ESPECIE, EN UN SOLO SITIO (19/10/2026): lo leen la columna de la
-- cita y la de la frase. El texto del NUEVO casa con alguno de `nuevo` y el del EXISTENTE con
-- `existente`; y si `nuevo_y` o `existente_y` no son NULL, ese lado tiene que casar además con una de
-- ellas (la otra mitad del registro, regla 2). Sin mayúsculas ni acentos. Gana la primera por `orden`.
pares AS (
  SELECT * FROM (VALUES
    -- orden, especie, NUEVO: alguna de, y además alguna de (NULL: nada más), EXISTENTE: alguna de, y además alguna de
    (1, 'C', ARRAY['%6 meses%'], NULL::text[], ARRAY['%12 meses%'], NULL::text[]),
    (2, 'B', ARRAY['%semanalmente, todos los lunes%'], NULL,
             ARRAY['%periodicidad mensual, el primer dia laborable de cada mes%', '%esta periodicidad mensual se considera suficiente%',
                   '%criterio de periodicidad mensual del control biologico%', '%control biologico mensual%'], NULL),
    (3, 'D', ARRAY['%puede recaer en el propio director clinico%'], NULL, ARRAY['%nunca por el director clinico del propio centro%'], NULL),
    -- A: el CARGO y la DECISIÓN (19/10); la de «responsable último» la puso Code (ver la cabecera)
    (4, 'A', ARRAY['%director clinico%'],
             ARRAY['%autoriza cualquier excepcion%', '%firma de los registros de auditoria%', '%retirar del servicio un autoclave%',
                   '%responsable ultimo%', '%responsabilidad ultima%'],
             ARRAY['%coordinador de calidad%'],
             ARRAY['%autoriza cualquier excepcion%', '%firma los registros de auditoria%', '%retirada de servicio de un autoclave%',
                   '%responsable ultimo%'])
  ) AS x(orden, especie, nuevo, nuevo_y, existente, existente_y)
),
nor10 AS (
  SELECT ar.id, ar.created_at, ar.document_id, ar.contradictions_found, ar.pipeline_counters AS pc, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-10%'
),
pasadas AS (
  SELECT x.*, row_number() OVER (ORDER BY x.created_at) AS n
  FROM nor10 x, parametros p WHERE x.created_at >= p.desde AND x.created_at < p.hasta
),
previas AS (
  SELECT x.* FROM nor10 x, parametros p WHERE x.created_at >= p.push AND x.created_at < p.desde
),
cli12 AS (
  SELECT d.id, d.name, coalesce(d.active_generation, 1) AS gen
  FROM public.documents d, parametros p
  WHERE d.org_id = p.org AND d.name ILIKE 'CLI-12%'
),
-- el texto de NOR-10 tal como lo arma el juez, por pasada (generación activa; `?? 1` como getActiveGeneration)
texto_nor10 AS (
  SELECT pa.n, string_agg(c.text, E'\n\n' ORDER BY c.chunk_index) AS rec,
         count(c.chunk_index) AS trozos, count(*) FILTER (WHERE c.chunk_type <> 'text') AS no_prosa
  FROM pasadas pa
  JOIN public.documents d ON d.id = pa.document_id
  JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1)
  GROUP BY pa.n
),
lecturas AS (
  SELECT pa.n, x.ord, x.l, x.l->>'documentId' AS doc_id,
         (SELECT d.name FROM public.documents d, parametros p WHERE d.org_id = p.org AND d.id::text = x.l->>'documentId') AS nombre,
         (x.l->'analizado'->>'caracteres')::int AS an_car, (x.l->'analizado'->>'mostrados')::int AS an_most,
         (x.l->'candidato'->>'caracteres')::int AS ca_car, (x.l->'candidato'->>'mostrados')::int AS ca_most,
         (x.l->>'presupuesto')::int AS presupuesto,
         x.l->>'modelo' AS modelo, x.l->>'tokensDeSalida' AS tokens_salida
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array' THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(l, ord)
),
lectura_cli12 AS (
  SELECT l.* FROM lecturas l WHERE l.doc_id IN (SELECT id::text FROM cli12)
),
juicios AS (
  SELECT pa.n, j FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array' THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
),
marcas AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, c->>'newDocSays' AS cita_nuevo, c->>'existingDocSays' AS cita_existente, c->'recompuesta' AS marca
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE '[]'::jsonb END) c
),
publicadas AS (
  SELECT pa.n, x.ord, d->>'existingDocument' AS candidato, d->>'severity' AS severity, d->>'confirmedBy' AS confirmado, d->>'topic' AS tema,
         coalesce(d->>'newDocSays', '') AS cita_nuevo, coalesce(d->>'existingDocSays', '') AS cita_existente
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(d, ord)
),
pub AS (
  SELECT p.*,
         translate(lower(coalesce(p.cita_nuevo, '')), 'áéíóúüñ', 'aeiouun') AS tn, translate(lower(coalesce(p.cita_existente, '')), 'áéíóúüñ', 'aeiouun') AS te,
         (SELECT m.marca FROM marcas m WHERE m.n = p.n AND m.candidato = p.candidato
            AND m.cita_nuevo = p.cita_nuevo AND m.cita_existente = p.cita_existente AND m.marca IS NOT NULL LIMIT 1) AS marca,
         (SELECT l.an_most FROM lecturas l WHERE l.n = p.n AND l.nombre = p.candidato LIMIT 1) AS an_most,
         (SELECT tx.rec FROM texto_nor10 tx WHERE tx.n = p.n) AS rec_nuevo,
         (SELECT string_agg(c.text, E'\n\n' ORDER BY c.chunk_index)
            FROM public.documents d JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1), parametros pr
           WHERE d.org_id = pr.org AND d.name = p.candidato) AS rec_existente,
         (SELECT string_agg(c.chunk_index::text, ', ' ORDER BY c.chunk_index)
            FROM public.documents d JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1), parametros pr
           WHERE d.org_id = pr.org AND d.name = p.candidato AND p.cita_existente <> '' AND strpos(c.text, p.cita_existente) > 0) AS trozo_existente,
         (SELECT d.full_text FROM public.documents d JOIN pasadas pa ON d.id = pa.document_id WHERE pa.n = p.n) AS ft_nuevo,
         (SELECT d.full_text FROM public.documents d, parametros pr WHERE d.org_id = pr.org AND d.name = p.candidato LIMIT 1) AS ft_existente
  FROM publicadas p
),
pub2 AS (
  SELECT p.*,
         coalesce((SELECT pr.especie FROM pares pr WHERE p.tn LIKE ANY (pr.nuevo) AND (pr.nuevo_y IS NULL OR p.tn LIKE ANY (pr.nuevo_y))
                                AND p.te LIKE ANY (pr.existente) AND (pr.existente_y IS NULL OR p.te LIKE ANY (pr.existente_y)) ORDER BY pr.orden LIMIT 1), 'OTRA') AS especie,
         -- LA COMPROBACIÓN EXPLÍCITA: ¿está la cita del NUEVO dentro de lo ENTREGADO?
         CASE WHEN p.cita_nuevo = '' THEN 'VACÍA'
              WHEN p.rec_nuevo IS NULL OR p.an_most IS NULL THEN 'NO SE PUEDE COMPROBAR (sin texto reconstruido o sin lectura de la pareja)'
              WHEN strpos(left(p.rec_nuevo, p.an_most), p.cita_nuevo) > 0 THEN 'literal, DENTRO de lo entregado (empieza en ' || strpos(p.rec_nuevo, p.cita_nuevo) || ')'
              WHEN strpos(p.rec_nuevo, p.cita_nuevo) > 0 THEN '⚠️ literal pero FUERA de lo entregado (empieza en ' || strpos(p.rec_nuevo, p.cita_nuevo) || ', entregados ' || p.an_most || ')'
              ELSE '⚠️ NO LITERAL en NOR-10: leer (normalización de la puerta o invención)' END AS nuevo_en_lo_entregado,
         CASE WHEN p.cita_existente = '' THEN 'VACÍA'
              WHEN p.rec_existente IS NULL THEN 'NO SE PUEDE COMPROBAR (el candidato no tiene trozos)'
              WHEN strpos(p.rec_existente, p.cita_existente) > 0 THEN 'literal en el candidato, trozo ' || coalesce(p.trozo_existente, 'ninguno entero: cruza trozos')
              ELSE '⚠️ NO LITERAL en el candidato: leer' END AS existente_literal
  FROM pub p
),
-- LA SEGUNDA COLUMNA (19/10/2026): la FRASE que contiene cada cita, en el full_text de su documento.
-- Del último «. » o salto de línea ANTERIOR a la cita al primero POSTERIOR. Sin cita literal en el
-- full_text, no hay frase: «SIN FRASE», nunca OTRA.
frase_buscar AS (
  SELECT f.n, f.ord, l.lado,
         CASE l.lado WHEN 'nuevo' THEN f.ft_nuevo ELSE f.ft_existente END AS t,
         CASE l.lado WHEN 'nuevo' THEN f.cita_nuevo ELSE f.cita_existente END AS c
  FROM pub2 f CROSS JOIN (VALUES ('nuevo'), ('existente')) AS l(lado)
),
frase_pos AS (
  SELECT b.*, CASE WHEN b.c = '' OR b.t IS NULL THEN 0 ELSE strpos(b.t, b.c) END AS pos FROM frase_buscar b
),
frase_lim AS (
  SELECT q.*,
         greatest(1,
           CASE WHEN strpos(reverse(q.pre), E'\n') = 0 THEN 1 ELSE char_length(q.pre) - strpos(reverse(q.pre), E'\n') + 2 END,
           CASE WHEN strpos(reverse(q.pre), ' .') = 0 THEN 1 ELSE char_length(q.pre) - strpos(reverse(q.pre), ' .') + 2 END) AS ini,
         q.pos + char_length(q.c) - 1 +
           CASE WHEN strpos(q.resto, '. ') = 0 AND strpos(q.resto, E'\n') = 0 THEN char_length(q.resto)
                WHEN strpos(q.resto, '. ') = 0 THEN strpos(q.resto, E'\n') - 1
                WHEN strpos(q.resto, E'\n') = 0 THEN strpos(q.resto, '. ')
                ELSE least(strpos(q.resto, '. '), strpos(q.resto, E'\n') - 1) END - 1 AS fin
  FROM (SELECT p.*, left(p.t, p.pos - 1) AS pre, substr(p.t, p.pos + char_length(p.c) - 1) AS resto FROM frase_pos p WHERE p.pos > 0) q
),
frases AS (
  SELECT f.n, f.ord,
         max(btrim(substr(f.t, f.ini, f.fin - f.ini + 1))) FILTER (WHERE f.lado = 'nuevo') AS frase_nuevo,
         max(btrim(substr(f.t, f.ini, f.fin - f.ini + 1))) FILTER (WHERE f.lado = 'existente') AS frase_existente
  FROM frase_lim f GROUP BY f.n, f.ord
),
pub3 AS (
  SELECT p.*, fr.frase_nuevo, fr.frase_existente,
         CASE WHEN fr.frase_nuevo IS NULL OR fr.frase_existente IS NULL THEN 'SIN FRASE'
              ELSE coalesce((SELECT pr.especie FROM pares pr
                              WHERE translate(lower(fr.frase_nuevo), 'áéíóúüñ', 'aeiouun') LIKE ANY (pr.nuevo) AND (pr.nuevo_y IS NULL OR translate(lower(fr.frase_nuevo), 'áéíóúüñ', 'aeiouun') LIKE ANY (pr.nuevo_y))
                                AND translate(lower(fr.frase_existente), 'áéíóúüñ', 'aeiouun') LIKE ANY (pr.existente) AND (pr.existente_y IS NULL OR translate(lower(fr.frase_existente), 'áéíóúüñ', 'aeiouun') LIKE ANY (pr.existente_y))
                              ORDER BY pr.orden LIMIT 1), 'OTRA') END AS especie_frase
  FROM pub2 p LEFT JOIN frases fr ON fr.n = p.n AND fr.ord = p.ord
),
apariciones AS (
  SELECT e.*,
         CASE WHEN e.cita_nuevo = '' OR left(e.rec_nuevo, e.an_most) IS NULL THEN NULL ELSE (char_length(left(e.rec_nuevo, e.an_most)) - char_length(replace(left(e.rec_nuevo, e.an_most), e.cita_nuevo, ''))) / char_length(e.cita_nuevo) END AS ap_nuevo_entregado,
         CASE WHEN e.cita_nuevo = '' OR e.ft_nuevo IS NULL THEN NULL ELSE (char_length(e.ft_nuevo) - char_length(replace(e.ft_nuevo, e.cita_nuevo, ''))) / char_length(e.cita_nuevo) END AS ap_nuevo_doc,
         CASE WHEN e.cita_existente = '' OR e.ft_existente IS NULL THEN NULL ELSE (char_length(e.ft_existente) - char_length(replace(e.ft_existente, e.cita_existente, ''))) / char_length(e.cita_existente) END AS ap_existente_doc
  FROM pub3 e
),
citas AS (
  SELECT n, candidato, 'nuevo' AS lado, char_length(cita_nuevo) AS largo, cita_nuevo AS texto FROM pub2
  UNION ALL
  SELECT n, candidato, 'existente', char_length(cita_existente), cita_existente FROM pub2
),
-- las cuatro frases sembradas en el lado de NOR-10, contra lo entregado en la pareja con CLI-12
sembradas AS (
  SELECT tx.n, s.k, s.marca, lc.an_most, tx.rec,
         strpos(lower(tx.rec), s.marca) AS ini
  FROM texto_nor10 tx
  JOIN lectura_cli12 lc ON lc.n = tx.n
  CROSS JOIN (VALUES ('A', 'responsable último del cumplimiento'), ('B', 'semanalmente, todos los lunes'),
                     ('C', 'máximo de 6 meses'), ('D', 'puede recaer en el propio director clínico')) AS s(k, marca)
),
sembradas2 AS (
  SELECT s.*, CASE WHEN s.ini > 0 THEN s.ini + char_length(s.marca) - 1 END AS fin_dato,
         CASE WHEN s.ini > 0 THEN s.ini + char_length(s.marca) - 1 + nullif(strpos(substr(s.rec, s.ini + char_length(s.marca)), '.'), 0) END AS fin_frase
  FROM sembradas s
),
-- dónde empieza y acaba cada trozo de NOR-10 en el texto reconstruido (1 = primer carácter)
trozos_pos AS (
  SELECT pa.n, c.chunk_index, char_length(c.text) AS largo,
         sum(char_length(c.text) + 2) OVER (PARTITION BY pa.n ORDER BY c.chunk_index) - 2 AS fin
  FROM pasadas pa
  JOIN public.documents d ON d.id = pa.document_id
  JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1)
),
-- EL CORTE DE CADA PAREJA (sonda de la frase partida, F-127): el último carácter entregado del analizado
cortes AS (
  SELECT l.n, l.ord, l.nombre, l.l->>'regimen' AS regimen, l.an_most, l.an_car, tx.rec,
         substr(tx.rec, l.an_most, 1) AS ultimo,
         (SELECT tp.chunk_index FROM trozos_pos tp WHERE tp.n = l.n AND tp.fin - tp.largo + 1 <= l.an_most AND tp.fin >= l.an_most LIMIT 1) AS trozo,
         (SELECT max(tp.fin) FROM trozos_pos tp WHERE tp.n = l.n AND tp.fin <= l.an_most) AS limite_antes
  FROM lecturas l JOIN texto_nor10 tx ON tx.n = l.n
  WHERE l.an_most IS NOT NULL AND l.an_car IS NOT NULL AND l.an_most < l.an_car
),
-- LO QUE CITA EL JUEZ CERCA DEL CORTE: publicadas y descartadas por la puerta, lado NOR-10, en su pareja
cerca AS (
  SELECT 'publicada' AS destino, p.n, p.candidato, p.tema, p.cita_nuevo AS cita, k.an_most, k.rec
  FROM pub2 p JOIN cortes k ON k.n = p.n AND k.nombre = p.candidato
  UNION ALL
  SELECT 'descartada por la puerta', ju.n, ju.j->>'documentName', d->>'tema', coalesce(d->>'citaNuevo', ''), k.an_most, k.rec
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) d
  JOIN cortes k ON k.n = ju.n AND k.nombre = ju.j->>'documentName'
),
cerca2 AS (
  SELECT c.*, strpos(c.rec, c.cita) AS ini, strpos(c.rec, c.cita) + char_length(c.cita) - 1 AS fin
  FROM cerca c WHERE c.cita <> ''
),
cerca3 AS (
  SELECT c.*,
         CASE WHEN c.ini > 0 AND c.ini <= c.an_most AND c.fin > c.an_most
                THEN '⚠️ la cita CRUZA EL CORTE: sigue ' || (c.fin - c.an_most) || ' caracteres más allá de lo entregado (completó la frase)'
              WHEN c.ini > 0 AND c.fin = c.an_most THEN 'ACABA JUSTO EN EL CORTE: cita la media frase tal como le llegó'
              WHEN c.ini > 0 AND c.fin <= c.an_most AND c.fin > c.an_most - 500
                THEN 'dentro de los 500 anteriores al corte (acaba ' || (c.an_most - c.fin) || ' antes)'
              WHEN c.ini = 0 AND strpos(right(left(c.rec, c.an_most), 500), left(c.cita, 40)) > 0
                THEN '⚠️ NO literal y empieza en los 500 anteriores al corte: leer (¿completó la frase?)'
         END AS que
  FROM cerca2 c
),
contadores AS (
  SELECT pa.n, k.clave, coalesce(pa.pc ? k.clave, false) AS esta, pa.pc->>k.clave AS valor
  FROM pasadas pa
  CROSS JOIN (VALUES
    ('juez.citas_recompuestas'), ('juez.citas_recompuestas_en_trozos_distintos'), ('juez.citas_empalme_multiple'),
    ('juez.citas_sin_tramo_literal'), ('juez.recompuestas_bloqueadas_al_reclasificar'), ('juez.recompuestas_sin_contexto_del_resto')) AS k(clave)
),
control AS (
  SELECT 1 AS orden, 'pasadas de NOR-10 desde `desde`: esperado ' || p.esperado || ', medido ' || (SELECT count(*) FROM pasadas) AS medida,
         (SELECT count(*) FROM pasadas) = p.esperado AS ok
  FROM parametros p
  UNION ALL
  SELECT 2, CASE WHEN p.push >= p.desde
              THEN 'FRANJA PREVIA: el inicio (' || to_char(p.push AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ') no va antes de DESDE (' ||
                   to_char(p.desde AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || '): el intervalo va al revés y no hay nada que mirar'
              ELSE 'pasadas de NOR-10 en la FRANJA PREVIA (del INICIO DE LA FRANJA PREVIA a DESDE): esperado 0, medido ' || (SELECT count(*) FROM previas) ||
                   coalesce(' · horas: ' || (SELECT string_agg(to_char(h.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'), ', ' ORDER BY h.created_at) FROM previas h), '') END,
         CASE WHEN p.push >= p.desde THEN NULL ELSE (SELECT count(*) FROM previas) = 0 END
  FROM parametros p
  UNION ALL
  SELECT 3, 'documentos CLI-12 en la organización: esperado 1, medido ' || (SELECT count(*) FROM cli12),
         (SELECT count(*) FROM cli12) = 1
  UNION ALL
  SELECT 4, 'pasada ' || pa.n || ': document_id ' || coalesce(pa.document_id::text, 'NULO') || ' · trozos de NOR-10 en su generación activa ' ||
            coalesce((SELECT tx.trozos FROM texto_nor10 tx WHERE tx.n = pa.n), 0) || ', de ellos no de prosa ' || coalesce((SELECT tx.no_prosa FROM texto_nor10 tx WHERE tx.n = pa.n), 0),
         pa.document_id IS NOT NULL AND coalesce((SELECT tx.trozos FROM texto_nor10 tx WHERE tx.n = pa.n), 0) > 0
           AND coalesce((SELECT tx.no_prosa FROM texto_nor10 tx WHERE tx.n = pa.n), 1) = 0
  FROM pasadas pa
  UNION ALL
  SELECT 5, 'pasada ' || pa.n || ': texto reconstruido ' || coalesce((SELECT char_length(tx.rec)::text FROM texto_nor10 tx WHERE tx.n = pa.n), '—') ||
            ' = analizado.caracteres de la pareja con CLI-12 ' || coalesce((SELECT lc.an_car::text FROM lectura_cli12 lc WHERE lc.n = pa.n LIMIT 1), '—'),
         coalesce((SELECT char_length(tx.rec) FROM texto_nor10 tx WHERE tx.n = pa.n) = (SELECT lc.an_car FROM lectura_cli12 lc WHERE lc.n = pa.n LIMIT 1), false)
  FROM pasadas pa
  UNION ALL
  SELECT 6, 'pasada ' || pa.n || ': CLI-12 llegó al juez (hay pareja con él)', EXISTS (SELECT 1 FROM lectura_cli12 lc WHERE lc.n = pa.n)
  FROM pasadas pa
  UNION ALL
  SELECT 7, 'pasada ' || pa.n || ': los seis contadores de la puerta están (faltan ' || (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) ||
            ') y está juez.citas_rescatadas_quitando_glosa',
         (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) = 0 AND coalesce(pa.pc ? 'juez.citas_rescatadas_quitando_glosa', false)
  FROM pasadas pa
  UNION ALL
  SELECT 8, 'pasada ' || pa.n || ': contradictions_found ' || coalesce(pa.contradictions_found::text, '—') || ' = publicadas ' || (SELECT count(*) FROM pub2 e WHERE e.n = pa.n),
         pa.contradictions_found = (SELECT count(*) FROM pub2 e WHERE e.n = pa.n)
  FROM pasadas pa
  UNION ALL
  SELECT 9, 'pasada ' || pa.n || ': todas sus parejas llevan modelo (sin modelo: ' ||
         (SELECT count(*) FROM lecturas l WHERE l.n = pa.n AND l.modelo IS NULL) || ' de ' || (SELECT count(*) FROM lecturas l WHERE l.n = pa.n) || ')' ||
         CASE WHEN p.exigir_modelo THEN '' ELSE ' · EXIGIR MODELO en false: anterior a F-128, no se exige' END,
         CASE WHEN NOT p.exigir_modelo THEN NULL
              ELSE (SELECT count(*) FROM lecturas l WHERE l.n = pa.n) > 0 AND (SELECT count(*) FROM lecturas l WHERE l.n = pa.n AND l.modelo IS NULL) = 0 END
  FROM pasadas pa, parametros p
),
mediana AS (
  SELECT coalesce(m.grupo, 'TODAS') AS grupo, count(*) AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY largo) AS med, min(largo) AS mn, max(largo) AS mx
  FROM (SELECT largo, 'TODAS' AS grupo FROM citas UNION ALL SELECT largo, 'CLI-12' FROM citas WHERE candidato ILIKE 'CLI-12%') m
  GROUP BY m.grupo
)
SELECT bloque, pasada, a, b, c, texto
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS pasada, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, NULL::text AS texto, orden AS o1, 0::bigint AS o2
  FROM control
  UNION ALL
  -- 1 · LO QUE LEYÓ EL JUEZ, por pareja. En la de CLI-12, `candidato.mostrados` es el BLOQUE REAL (P-3)
  SELECT '1 · lectura de las parejas', 'pasada ' || l.n || ' · ' || to_char((SELECT pa.created_at FROM pasadas pa WHERE pa.n = l.n) AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'),
         coalesce(l.nombre, 'id ' || coalesce(l.doc_id, '—')) || CASE WHEN l.doc_id IN (SELECT id::text FROM cli12) THEN '  ◀ CLI-12' ELSE '' END,
         'régimen ' || coalesce(l.l->>'regimen', '—') || ' · presupuesto ' || coalesce(l.presupuesto::text, '—'),
         'analizado ' || coalesce(l.an_most::text, '—') || '/' || coalesce(l.an_car::text, '—') || ' dejó fuera ' || coalesce(l.l->'analizado'->>'dejoFuera', '—') ||
           ' · candidato (bloque real si va por relevancia) ' || coalesce(l.ca_most::text, '—') || '/' || coalesce(l.ca_car::text, '—') ||
           ' dejó fuera ' || coalesce(l.l->'candidato'->>'dejoFuera', '—') ||
           ' · analizado + candidato = presupuesto: ' || CASE WHEN l.presupuesto IS NULL THEN '—' WHEN l.an_most + l.ca_most = l.presupuesto THEN 'sí' ELSE 'NO (' || (l.an_most + l.ca_most) || ')' END,
         'MODELO ' || coalesce(l.modelo, '— (anterior a F-128)') || ' · TOKENS DE SALIDA ' || coalesce(l.tokens_salida, '—'),
         0, l.n * 100 + l.ord
  FROM lecturas l
  UNION ALL
  -- 2 · LO PUBLICADO: las dos citas enteras, su longitud, la marca y las dos comprobaciones de literalidad
  SELECT '2 · contradicciones publicadas', 'pasada ' || e.n, e.especie,
         'POR LA FRASE: ' || e.especie_frase || ' · ' || coalesce(e.candidato, '—') || ' · ' || coalesce(e.severity, '—') || ' · confirmedBy: ' || coalesce(e.confirmado, '—') ||
           ' · marca recompuesta: ' || CASE WHEN e.marca IS NULL THEN 'no' ELSE 'SÍ' END ||
           ' · longitudes: nuevo ' || char_length(e.cita_nuevo) || ', existente ' || char_length(e.cita_existente) ||
           ' · ' || coalesce((SELECT coalesce(l.modelo, '— (anterior a F-128)') || ', ' || coalesce(l.tokens_salida, '—') || ' tokens de salida'
             FROM lecturas l WHERE l.n = e.n AND l.nombre = e.candidato LIMIT 1), 'pareja sin lectura'),
         'NUEVO en lo entregado: ' || e.nuevo_en_lo_entregado || ' · EXISTENTE: ' || e.existente_literal || ' · TEMA: ' || coalesce(e.tema, '—') ||
           ' · APARICIONES: la del nuevo ' || coalesce(e.ap_nuevo_entregado::text, '—') || ' en lo entregado y ' ||
           coalesce(e.ap_nuevo_doc::text, '— (sin full_text)') || ' en su documento; la del existente ' ||
           coalesce(e.ap_existente_doc::text, '— (sin full_text)') || ' en el suyo',
         'NUEVO: ' || e.cita_nuevo || E'\nEXISTENTE: ' || e.cita_existente ||
           CASE WHEN e.marca IS NULL THEN '' ELSE
             coalesce(E'\nCITA DEL JUEZ (nuevo): ' || (e.marca->'nuevo'->>'citaDelJuez'), '') ||
             coalesce(E'\nCITA DEL JUEZ (existente): ' || (e.marca->'existente'->>'citaDelJuez'), '') END ||
           E'\nFRASE DEL NUEVO: ' || coalesce(e.frase_nuevo, '— (la cita no está literal en su full_text)') ||
           E'\nFRASE DEL EXISTENTE: ' || coalesce(e.frase_existente, '— (la cita no está literal en su full_text)'),
         0, e.n * 100 + e.ord
  FROM apariciones e
  UNION ALL
  -- 2d · LAS DOS COLUMNAS CRUZADAS, por pasada: una OTRA por la cita se parte en «X por la frase» y «OTRA de verdad»
  SELECT '2d · las dos columnas: por la cita → por la frase', 'pasada ' || e.n,
         'por la cita ' || e.especie || ' → por la frase ' || e.especie_frase,
         count(*) || ' contradicciones publicadas', NULL, NULL, 0, e.n
  FROM pub3 e GROUP BY e.n, e.especie, e.especie_frase
  UNION ALL
  SELECT '2 · contradicciones publicadas', 'pasada ' || pa.n, 'ninguna', NULL, NULL, NULL, 1, pa.n
  FROM pasadas pa WHERE NOT EXISTS (SELECT 1 FROM pub2 e WHERE e.n = pa.n)
  UNION ALL
  -- 2c · LAS CITAS QUE APARECEN MÁS DE UNA VEZ en su documento completo (el salto de Mejora coge la primera)
  SELECT '2c · citas que aparecen más de una vez en su documento', NULL,
         'del nuevo: ' || count(*) FILTER (WHERE ap_nuevo_doc > 1) || ' de ' || count(*) FILTER (WHERE ap_nuevo_doc IS NOT NULL) ||
           ' · del existente: ' || count(*) FILTER (WHERE ap_existente_doc > 1) || ' de ' || count(*) FILTER (WHERE ap_existente_doc IS NOT NULL),
         coalesce(string_agg('pasada ' || n || ' ' || especie || ': nuevo ' || coalesce(ap_nuevo_doc::text, '—') || ', existente ' || coalesce(ap_existente_doc::text, '—'), ' | ')
           FILTER (WHERE ap_nuevo_doc > 1 OR ap_existente_doc > 1), 'ninguna'),
         NULL, NULL, 0, 0
  FROM apariciones
  UNION ALL
  -- 3 · LA COMPROBACIÓN EXPLÍCITA, en una línea: citas del NUEVO que no están DENTRO de lo entregado
  SELECT '3 · citas del nuevo que NO están dentro de lo entregado', NULL,
         'de ' || count(*) || ' citas publicadas del lado NOR-10: ' || count(*) FILTER (WHERE nuevo_en_lo_entregado NOT LIKE 'literal, DENTRO%') || ' no están dentro',
         coalesce(string_agg(DISTINCT 'pasada ' || n || ' ' || especie || ': ' || nuevo_en_lo_entregado, ' | ') FILTER (WHERE nuevo_en_lo_entregado NOT LIKE 'literal, DENTRO%'), 'ninguna'),
         NULL, NULL, 0, 0
  FROM pub2
  UNION ALL
  -- 4 · LAS CUATRO FRASES SEMBRADAS en el lado de NOR-10, contra lo entregado en la pareja con CLI-12 (C-1 y P-3)
  SELECT '4 · frases sembradas de NOR-10 en lo entregado', 'pasada ' || s.n, s.k,
         CASE WHEN s.ini = 0 THEN 'NO ENCONTRADA en el texto reconstruido'
              ELSE 'empieza ' || s.ini || ' · el dato acaba ' || s.fin_dato || ' · la frase acaba ' || coalesce(s.fin_frase::text, '—') || ' · entregados ' || s.an_most END,
         CASE WHEN s.ini = 0 THEN '—'
              WHEN s.fin_frase IS NOT NULL AND s.fin_frase <= s.an_most THEN 'FRASE ENTERA DENTRO'
              WHEN s.fin_dato <= s.an_most THEN 'EL DATO DENTRO, LA FRASE CORTADA'
              ELSE 'FUERA' END,
         NULL, 0, s.n * 10 + ascii(s.k)
  FROM sembradas2 s
  UNION ALL
  -- 5 · LOS SEIS CONTADORES DE LA PUERTA por pasada (FALTA si no está, nunca 0)
  SELECT '5 · contadores de la puerta', 'pasada ' || pa.n,
         string_agg(replace(c.clave, 'juez.', '') || ' ' || CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END, ' · ' ORDER BY c.clave),
         NULL, NULL, NULL, 0, pa.n
  FROM pasadas pa JOIN contadores c ON c.n = pa.n
  GROUP BY pa.n
  UNION ALL
  -- 6 · LA MEDIANA de las citas publicadas (P-7)
  SELECT '6 · mediana de las citas publicadas', NULL, m.grupo, 'n ' || m.n || ' · mediana ' || round(m.med::numeric, 1),
         'mínimo ' || m.mn || ' · máximo ' || m.mx, NULL, CASE m.grupo WHEN 'TODAS' THEN 0 ELSE 1 END, 0
  FROM mediana m
  UNION ALL
  -- 7 · EL CORTE DE CADA PAREJA: dónde cae, si parte una frase, y qué palabras quedan a cada lado
  SELECT '7 · el corte de cada pareja', 'pasada ' || k.n, coalesce(k.nombre, '—') || ' · ' || coalesce(k.regimen, '—'),
         'corte en ' || k.an_most || ' de ' || k.an_car || ' · ' ||
           CASE WHEN k.ultimo IN ('.', E'\n') THEN 'NO parte frase (acaba en ' || CASE k.ultimo WHEN '.' THEN 'punto' ELSE 'salto de línea' END || ')'
                ELSE 'PARTE UNA FRASE' END ||
           ' · trozo ' || coalesce(k.trozo::text, '—') || ' · último límite de trozo antes del corte: ' || coalesce(k.limite_antes::text, '—') ||
           coalesce(' (cortar ahí dejaría fuera ' || (k.an_most - k.limite_antes) || ' más)', ''),
         NULL,
         'ANTES: …' || substr(k.rec, greatest(k.an_most - 89, 1), least(90, k.an_most)) || E'\nDESPUÉS: ' || substr(k.rec, k.an_most + 1, 70) || '…',
         0, k.n * 100 + k.ord
  FROM cortes k
  UNION ALL
  -- 8 · LO QUE EL JUEZ CITA CERCA DEL CORTE (los 500 anteriores, o cruzándolo), publicado o descartado
  SELECT '8 · lo que cita el juez cerca del corte', 'pasada ' || c.n, c.destino,
         coalesce(c.candidato, '—') || ' · corte en ' || c.an_most || ' · cita de ' || char_length(c.cita) || ' caracteres' ||
           CASE WHEN c.ini > 0 THEN ', de ' || c.ini || ' a ' || c.fin ELSE ', no literal' END,
         c.que || ' · TEMA: ' || coalesce(c.tema, '—'), c.cita, 0, c.n
  FROM cerca3 c WHERE c.que IS NOT NULL
  UNION ALL
  SELECT '8 · lo que cita el juez cerca del corte', NULL, 'ninguna cita, publicada ni descartada, en los 500 anteriores al corte ni cruzándolo',
         NULL, NULL, NULL, 1, 0
  WHERE NOT EXISTS (SELECT 1 FROM cerca3 c WHERE c.que IS NOT NULL)
) t
ORDER BY bloque, o1, o2, pasada;
