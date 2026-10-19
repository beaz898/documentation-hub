-- ============================================================================
-- F-128 · EL JUEZ CON HAIKU 5.5: SIETE PASADAS DE NOR-11 CONTRA LA LÍNEA BASE DEL
-- 14/10 (HAIKU 4.5) — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- ⚠️ SACA TEXTO DE DOCUMENTO, ENTERO: las citas publicadas, las del tramo y las
-- de los descartes. Son NOR-11, CLI-13 y lo que el juez compare en esas pasadas,
-- documentos del corpus de pruebas, NO de un cliente.
--
-- ES SQL_F126_01 CON LA MISMA LÓGICA (19/10/2026). SQL_F126_01 se queda como
-- está porque es el instrumento con el que se midió la línea base del 14/10, y
-- su cabecera describe esa medición. Lo que cambia aquí, y nada más:
--   · las ventanas: la VIEJA es ahora la línea base, las siete pasadas del 14/10
--     con Haiku 4.5 (08:28:55 a 08:46:38 hora de Madrid); la NUEVA, la tanda de
--     Haiku 5.5 (o la pasada 0), entre DESDE y HASTA; y el HUECO, del COMIENZO
--     DEL HUECO a DESDE, que debe estar vacío. Los cuatro valores, abajo;
--   · la ventana nueva gana límite superior (la segunda marca);
--   · el bloque 1 dice con qué MODELO juzgó el juez cada pareja de cada pasada y
--     cuántos TOKENS DE SALIDA gastó (lecturaDeLasParejas[].modelo y
--     .tokensDeSalida, F-128), y el bloque 2 los repite junto a cada
--     contradicción publicada. En la línea base salen «— (anterior a F-128)»:
--     se hizo toda con Haiku 4.5, antes de que se guardara el modelo;
--   · y un control más, el 7: toda pareja de la ventana nueva lleva su modelo,
--     o el código desplegado no es el de F-128.
-- La mediana y el resto, idénticos a SQL_F126_01: lee su cabecera para la
-- definición de cada cosa. LAS ESPECIES, NO:
--
-- LAS APARICIONES DE CADA CITA (19/10/2026, arquitecto): el salto de «Mejora con IA»
-- busca la cita del nuevo en el texto del editor —`documents.full_text`, el que
-- carga la bandeja (app/api/documents/[id]/text)— y se queda con la PRIMERA aparición
-- (components/ImprovementModal.tsx:318-336, lib/texto/localizar-cita.ts). Una cita
-- literal que aparezca más de una vez puede llevar al párrafo equivocado. El bloque 2
-- dice cuántas veces aparece cada una: la del nuevo en lo entregado (el texto de NOR-11
-- reconstruido desde sus trozos y cortado donde lo cortó el juez, que en esta pareja es
-- el documento entero) y en su full_text; la del existente, en su full_text. Cuenta
-- LITERAL, sin la tolerancia de espacios y comillas de findTolerant: puede quedarse
-- corto, nunca pasarse. El bloque 2c resume cuántas citas de la tanda aparecen más de
-- una vez en el documento completo.
--
-- ⚠️ EL CLASIFICADOR, CAMBIADO EL 19/10/2026 (bloques 1, 2, 5 y 9). En SQL_F126_01
-- la especie salía del TEMA que escribe el juez («plazo»; «color» y «contenedor»;
-- «retirada» o «ubicación»). La primera pasada con Haiku 5.5 publicó NEGACIÓN con
-- las dos citas literales y el clasificador la contó como OTRA: es el defecto 5.7
-- de F-127 —el medidor cuenta como fallo una detección por otra vía— otra vez.
-- AHORA SE CLASIFICA POR EL PAR DE DATOS, UNO EN CADA CITA (arquitecto, 19/10):
--   · PLAZO    si la cita del NUEVO dice «72 horas»   y la del EXISTENTE «7 días»;
--   · LUGAR    si la del NUEVO dice «Chamberí»        y la del EXISTENTE «Retiro»;
--   · NEGACIÓN si la del NUEVO dice «amarill-»        y la del EXISTENTE «negro».
-- Hacen falta LOS DOS datos, cada uno en su lado: uno solo, o los dos en el mismo
-- lado, no basta. Sin mayúsculas ni acentos, caiga donde caiga el recorte de la
-- cita. Lo demás es OTRA, y una OTRA se lee antes de llamarla falso positivo.
-- La consulta relee todas las pasadas cada vez, así que la línea base del 14/10 y
-- toda la tanda se leen con el medidor arreglado.
-- ✅ PROBADO ANTES DE ENTREGARLO (19/10/2026) en PGlite, con el arnés de
-- SQL_F126_01 adaptado: con siete y siete pasadas los controles salen OK, y
-- falla el 7 cuando una pareja nueva no lleva modelo. Y las DOS LECTURAS de la
-- tabla de abajo, sobre los mismos datos (línea base, pasada 0 y tanda), salen
-- sin un solo FALLA; con una pasada suelta en el hueco, cae el 3. El clasificador
-- por dato (19/10), con las citas reales de la línea base y la NEGACIÓN corta de
-- Haiku 5.5 con un tema sin «color»: 3/3 en las catorce; y las dos trampas
-- («Chamberí» en las dos citas, «72 horas» en las dos) salen OTRA. Con el
-- clasificador viejo, el mismo arnés da 2/3 y se traga las dos trampas.
-- ⚠️ EL HALLAZGO DEL DÍA (arquitecto, 19/10/2026): **el medidor viejo podía
-- inventarse un acierto, no sólo perder uno.** Contaba como LUGAR una contradicción
-- con «Chamberí» en los dos lados, porque bastaba el tema. Las APARICIONES (19/10):
-- con una cita repetida a propósito en el full_text, sale 1 en lo entregado y 2 en
-- el documento, y el bloque 2c la caza en las siete. Y un hueco al revés sale NO
-- APLICA, no OK (19/10). LA SEGUNDA COLUMNA (19/10), con las citas de la tanda
-- (ver abajo): las cuatro negativas de NOR-11 salen NEGACIÓN en las dos columnas,
-- las de la línea base y las de la bolsa amarilla de 5.5 también, y las especies
-- por la cita de todo lo demás salen IGUAL que con el fichero anterior, fila a fila
-- (con el full_text y los trozos reales de NOR-11 y CLI-13). Las dos trampas del
-- arquitecto, que no son literales, salen OTRA y SIN FRASE; las mismas hechas con
-- texto real, OTRA por la cita, y una de ellas LUGAR por la frase (ver abajo). Cuatro
-- mutaciones caen: sin el par del registro, sin el principio de frase, sin el final
-- y sin el «SIN FRASE». CON DATOS REALES NO SE HA EJECUTADO.
--
-- ⚠️ LA SEGUNDA COLUMNA: LA ESPECIE POR LA FRASE (19/10/2026, aprobada por el
-- arquitecto). **POR QUÉ EXISTE: el 19/10 el clasificador dio OTRA a TRECE
-- hallazgos correctos de trece** —las cuatro NEGACIÓN de NOR-11 y las nueve A de
-- NOR-10 de la tanda de Haiku 5.5—, **porque exige el dato DENTRO de la cita y el
-- juez cita trozos de frase.** Con una sola columna, «acierto mal citado» y «fallo
-- de verdad» salían con la misma etiqueta, OTRA.
--   · La PRIMERA columna no cambia de criterio: clasifica la CITA, que es lo que
--     ve el usuario, y de ella sale el MARCADOR.
--   · La SEGUNDA busca cada cita LITERAL en el full_text de su documento, coge la
--     frase que la contiene (del último «. » o salto de línea anterior al
--     siguiente) y le aplica el MISMO par de datos: la constante `pares`, en un
--     solo sitio, que leen las dos columnas y el bloque 9. Sin la cita literal en
--     el full_text sale «SIN FRASE», nunca OTRA. El bloque 2d cruza las dos.
--   · ⚠️ **LA SEGUNDA COLUMNA NO CUENTA PARA EL MARCADOR, Y NO DEBE**: también
--     puede inventarse un acierto. Probado con el texto real: la cita «Si trabajas
--     en Chamberí o Salamanca y tienes dudas sobre una recogida» de CLI-13 vive en
--     una frase que acaba en «el personal de Retiro», y con «Chamberí» en el otro
--     lado sale LUGAR por la frase y OTRA por la cita. Sirve para LEER una OTRA,
--     no para contar.
--   · Límite declarado: el corte por «. » falla con abreviaturas («p. ej.») y no
--     conoce «?», «!» ni «;»: la frase puede salir más corta o más larga.
-- Y EL PAR DE NEGACIÓN SIGUE EL REGISTRO DE SIEMBRA (19/10/2026, aprobado):
-- `corpus-pruebas/SIEMBRA_caso_control.md`, Contradicción 3, pone a propósito la
-- negación («En ningún caso se depositan en el contenedor negro») y la afirmación
-- (la bolsa amarilla) en frases separadas. El lado de NOR-11 casa con «amarill-» O
-- con «en ningún caso se depositan en el contenedor negro»; el de CLI-13, con
-- «negro», como antes. Vale para las dos columnas.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `parametros` de la primera línea  │
-- │ de la consulta (convenio del 05/10/2026). No se mira ninguna otra.       │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LO ÚNICO QUE TOCA EL DIRECTOR: los CUATRO VALORES de la constante        │
-- │ `parametros` marcados con flecha, en hora de Madrid y con este formato   │
-- │ exacto:  timestamptz 'AAAA-MM-DD HH:MM:SS+02'                             │
-- │ ⚠️ El «+02» es el horario de verano. Desde el domingo 25/10/2026 a las   │
-- │ 03:00 es «+01».                                                           │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ PONER EN CADA LECTURA (se copia tal cual):
--
--   lectura              DESDE                    HASTA                    COMIENZO DEL HUECO                    ESPERADO
--   ───────────────────  ───────────────────────  ───────────────────────  ────────────────────────────────────  ────────
--   la PASADA 0          '2026-10-19 12:02:00+02' '2026-10-19 12:04:00+02' '2026-10-14 08:47:00+02'              1
--   (interruptor                                                           (el final de la línea base)
--   apagado)
--   la TANDA de          '2026-10-19 12:14:00+02' '2026-10-19 14:17:00+02' '2026-10-19 12:04:00+02'              7
--   Haiku 5.5
--
--   Corregido el 19/10/2026 (aprobado por el arquitecto): la pasada 0 se guardó a las
--   12:03:06 y la primera con Haiku 5.5 a las 12:14:42; la última, a las 14:16:10. El
--   hueco, de 12:04 a 12:14, comprueba que entre las dos no corrió nada más. (Hora
--   GUARDADA, la del final de cada análisis, en Madrid.) Con un DESDE anterior a las
--   12:03:06, la ventana cogía también la pasada 0 y el control 1 daba «medido 8».
--
--   Y un control que no puede mirar nada no sale OK: si el COMIENZO DEL HUECO no va
--   antes de DESDE, el control 3 sale «NO APLICA» (arquitecto, 19/10/2026).
--
-- ⚠️ POR QUÉ CUATRO VALORES Y NO DOS (arquitecto, 19/10/2026): con dos, la pasada 0
-- habría hecho fallar a propósito el control 3 (cae en el hueco de la tanda) y el
-- 1 (es una sola pasada, no siete). **UN CONTROL QUE SE ESPERA QUE FALLE ES UN
-- CONTROL MUERTO**: la próxima vez que se ponga rojo de verdad, nadie lo mirará.
-- Con estos cuatro valores **ningún control debe fallar en ninguna de las dos
-- lecturas; si alguno falla, es que pasó algo.**
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org,   -- ← LA CONSTANTE
         -- ↓↓↓ LOS CUATRO VALORES: lo único que se toca (la tabla de la cabecera dice qué poner) ↓↓↓
         -- ⚠️ «+02» vale hasta el domingo 25/10/2026 a las 03:00; desde ahí es «+01».
         timestamptz '2026-10-19 12:14:00+02' AS nueva_desde,     -- ← DESDE (vienen puestos los de la TANDA)
         timestamptz '2026-10-19 14:17:00+02' AS nueva_hasta,     -- ← HASTA
         timestamptz '2026-10-19 12:04:00+02' AS push,            -- ← COMIENZO DEL HUECO (el hueco va de aquí a DESDE)
         7 AS esperado_nueva,                                     -- ← ESPERADO: pasadas en la ventana nueva
         -- ↑↑↑ ↑↑↑
         timestamptz '2026-10-14 08:28:00+02' AS vieja_desde,     -- la línea base del 14/10, Haiku 4.5: fija
         timestamptz '2026-10-14 08:47:00+02' AS vieja_hasta,
         7 AS esperado_vieja
),
-- EL PAR DE DATOS DE CADA ESPECIE, EN UN SOLO SITIO (19/10/2026): lo leen la columna de la
-- cita, la de la frase y el bloque 9. El texto del NUEVO casa con alguno de `nuevo` y el del
-- EXISTENTE con `existente`; sin mayúsculas ni acentos. Gana la primera por `orden`.
pares AS (
  SELECT * FROM (VALUES
    (1, 'PLAZO',    ARRAY['%72 horas%'],                                                       '%7 dias%'),
    (2, 'LUGAR',    ARRAY['%chamberi%'],                                                       '%retiro%'),
    (3, 'NEGACIÓN', ARRAY['%amarill%', '%en ningun caso se depositan en el contenedor negro%'], '%negro%')
  ) AS x(orden, especie, nuevo, existente)
),
nor11 AS (
  SELECT ar.id, ar.created_at, ar.document_id, ar.contradictions_found, ar.overlaps_found, ar.pipeline_counters AS pc, ar.analysis
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-11%'
),
pasadas AS (
  SELECT v.*, row_number() OVER (PARTITION BY v.ventana ORDER BY v.created_at) AS n
  FROM (
    SELECT x.*, CASE WHEN x.created_at >= p.nueva_desde AND x.created_at < p.nueva_hasta THEN 'nueva'
                     WHEN x.created_at >= p.vieja_desde AND x.created_at < p.vieja_hasta THEN 'vieja' END AS ventana
    FROM nor11 x, parametros p
  ) v
  WHERE v.ventana IS NOT NULL
),
hueco AS (
  SELECT x.* FROM nor11 x, parametros p WHERE x.created_at >= p.push AND x.created_at < p.nueva_desde
),
juicios AS (
  SELECT pa.ventana, pa.n, j
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'judgments') = 'array' THEN pa.analysis->'judgments' ELSE '[]'::jsonb END) j
),
-- F-128: con qué modelo juzgó el juez cada pareja y cuántos tokens de salida gastó
lecturas AS (
  SELECT pa.ventana, pa.n, x.ord, x.l->>'documentId' AS doc_id,
         (SELECT d.name FROM public.documents d, parametros p WHERE d.org_id = p.org AND d.id::text = x.l->>'documentId') AS nombre,
         x.l->>'modelo' AS modelo, x.l->>'tokensDeSalida' AS tokens_salida,
         (x.l->'analizado'->>'mostrados')::int AS an_most
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array' THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(l, ord)
),
publicadas AS (
  SELECT pa.ventana, pa.n, x.ord, d->>'existingDocument' AS candidato, d->>'severity' AS severity, d->>'confirmedBy' AS confirmado,
         d->>'topic' AS tema, coalesce(d->>'newDocSays', '') AS cita_nuevo, coalesce(d->>'existingDocSays', '') AS cita_existente,
         translate(lower(coalesce(d->>'newDocSays', '')), 'áéíóúüñ', 'aeiouun') AS tn, translate(lower(coalesce(d->>'existingDocSays', '')), 'áéíóúüñ', 'aeiouun') AS te
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(pa.analysis->'discrepancies') = 'array' THEN pa.analysis->'discrepancies' ELSE '[]'::jsonb END)
    WITH ORDINALITY AS x(d, ord)
),
marcas AS (
  SELECT ju.ventana, ju.n, ju.j->>'documentName' AS candidato, c->>'newDocSays' AS cita_nuevo, c->>'existingDocSays' AS cita_existente,
         c->'recompuesta' AS marca
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'contradictions') = 'array' THEN ju.j->'contradictions' ELSE '[]'::jsonb END) c
),
pub AS (
  SELECT p.*,
         coalesce((SELECT pr.especie FROM pares pr WHERE p.tn LIKE ANY (pr.nuevo) AND p.te LIKE pr.existente ORDER BY pr.orden LIMIT 1), 'OTRA') AS especie,
         (SELECT m.marca FROM marcas m
           WHERE m.ventana = p.ventana AND m.n = p.n AND m.candidato = p.candidato
             AND m.cita_nuevo = p.cita_nuevo AND m.cita_existente = p.cita_existente AND m.marca IS NOT NULL LIMIT 1) AS marca
  FROM publicadas p
),
pubft AS (
  SELECT p.*,
         (SELECT d.full_text FROM pasadas pa JOIN public.documents d ON d.id = pa.document_id WHERE pa.ventana = p.ventana AND pa.n = p.n) AS ft_nuevo,
         (SELECT d.full_text FROM public.documents d, parametros pr WHERE d.org_id = pr.org AND d.name = p.candidato LIMIT 1) AS ft_existente
  FROM pub p
),
-- LA SEGUNDA COLUMNA (19/10/2026): la FRASE que contiene cada cita, en el full_text de su documento.
-- Del último «. » o salto de línea ANTERIOR a la cita al primero POSTERIOR. Sin cita literal en el
-- full_text, no hay frase: «SIN FRASE», nunca OTRA.
frase_buscar AS (
  SELECT f.ventana, f.n, f.ord, l.lado,
         CASE l.lado WHEN 'nuevo' THEN f.ft_nuevo ELSE f.ft_existente END AS t,
         CASE l.lado WHEN 'nuevo' THEN f.cita_nuevo ELSE f.cita_existente END AS c
  FROM pubft f CROSS JOIN (VALUES ('nuevo'), ('existente')) AS l(lado)
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
  SELECT f.ventana, f.n, f.ord,
         max(btrim(substr(f.t, f.ini, f.fin - f.ini + 1))) FILTER (WHERE f.lado = 'nuevo') AS frase_nuevo,
         max(btrim(substr(f.t, f.ini, f.fin - f.ini + 1))) FILTER (WHERE f.lado = 'existente') AS frase_existente
  FROM frase_lim f GROUP BY f.ventana, f.n, f.ord
),
pubf AS (
  SELECT p.*, fr.frase_nuevo, fr.frase_existente,
         CASE WHEN fr.frase_nuevo IS NULL OR fr.frase_existente IS NULL THEN 'SIN FRASE'
              ELSE coalesce((SELECT pr.especie FROM pares pr
                              WHERE translate(lower(fr.frase_nuevo), 'áéíóúüñ', 'aeiouun') LIKE ANY (pr.nuevo) AND translate(lower(fr.frase_existente), 'áéíóúüñ', 'aeiouun') LIKE pr.existente
                              ORDER BY pr.orden LIMIT 1), 'OTRA') END AS especie_frase
  FROM pubft p LEFT JOIN frases fr ON fr.ventana = p.ventana AND fr.n = p.n AND fr.ord = p.ord
),
-- las apariciones de cada cita publicada: en lo entregado y en el full_text de cada documento
apariciones AS (
  SELECT e.*,
         CASE WHEN e.cita_nuevo = '' OR left(e.rec_nuevo, e.an_most) IS NULL THEN NULL ELSE (char_length(left(e.rec_nuevo, e.an_most)) - char_length(replace(left(e.rec_nuevo, e.an_most), e.cita_nuevo, ''))) / char_length(e.cita_nuevo) END AS ap_nuevo_entregado,
         CASE WHEN e.cita_nuevo = '' OR e.ft_nuevo IS NULL THEN NULL ELSE (char_length(e.ft_nuevo) - char_length(replace(e.ft_nuevo, e.cita_nuevo, ''))) / char_length(e.cita_nuevo) END AS ap_nuevo_doc,
         CASE WHEN e.cita_existente = '' OR e.ft_existente IS NULL THEN NULL ELSE (char_length(e.ft_existente) - char_length(replace(e.ft_existente, e.cita_existente, ''))) / char_length(e.cita_existente) END AS ap_existente_doc
  FROM (
    SELECT p.*,
           (SELECT string_agg(c.text, E'\n\n' ORDER BY c.chunk_index)
              FROM pasadas pa JOIN public.documents d ON d.id = pa.document_id
              JOIN public.document_chunks c ON c.document_id = d.id AND c.generation = coalesce(d.active_generation, 1)
             WHERE pa.ventana = p.ventana AND pa.n = p.n) AS rec_nuevo,
           (SELECT l.an_most FROM lecturas l WHERE l.ventana = p.ventana AND l.n = p.n AND l.nombre = p.candidato LIMIT 1) AS an_most
    FROM pubf p WHERE p.ventana = 'nueva'
  ) e
),
-- las citas de la mediana: los DOS lados de cada contradicción publicada
citas AS (
  SELECT ventana, n, especie, 'nuevo' AS lado, cita_nuevo AS texto, char_length(cita_nuevo) AS largo FROM pub
  UNION ALL
  SELECT ventana, n, especie, 'existente', cita_existente, char_length(cita_existente) FROM pub
),
tramo AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, x.ord, r
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'citasAlTramo') = 'array' THEN ju.j->'citasAlTramo' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(r, ord)
  WHERE ju.ventana = 'nueva'
),
descartes AS (
  SELECT ju.n, ju.j->>'documentName' AS candidato, x.ord, d, lado.nombre AS lado, d->lado.nombre AS datos,
         CASE WHEN lado.nombre = 'nuevo' THEN d->>'citaNuevo' ELSE d->>'citaExistente' END AS cita
  FROM juicios ju
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(ju.j->'descartesPorCita') = 'array' THEN ju.j->'descartesPorCita' ELSE '[]'::jsonb END) WITH ORDINALITY AS x(d, ord)
  CROSS JOIN (VALUES ('nuevo'), ('existente')) AS lado(nombre)
  WHERE ju.ventana = 'nueva'
),
contadores AS (
  SELECT pa.n, k.clave, coalesce(pa.pc ? k.clave, false) AS esta, pa.pc->>k.clave AS valor
  FROM pasadas pa
  CROSS JOIN (VALUES
    ('juez.citas_recompuestas'),
    ('juez.citas_recompuestas_en_trozos_distintos'),
    ('juez.citas_empalme_multiple'),
    ('juez.citas_sin_tramo_literal'),
    ('juez.recompuestas_bloqueadas_al_reclasificar'),
    ('juez.recompuestas_sin_contexto_del_resto')) AS k(clave)
  WHERE pa.ventana = 'nueva'
),
control AS (
  SELECT 1 AS orden, 'pasadas de NOR-11 en la ventana NUEVA: esperado ' || p.esperado_nueva || ', medido ' ||
         (SELECT count(*) FROM pasadas WHERE ventana = 'nueva') AS medida,
         (SELECT count(*) FROM pasadas WHERE ventana = 'nueva') = p.esperado_nueva AS ok
  FROM parametros p
  UNION ALL
  SELECT 2, 'pasadas de NOR-11 en la ventana VIEJA: esperado ' || p.esperado_vieja || ', medido ' ||
         (SELECT count(*) FROM pasadas WHERE ventana = 'vieja'),
         (SELECT count(*) FROM pasadas WHERE ventana = 'vieja') = p.esperado_vieja
  FROM parametros p
  UNION ALL
  SELECT 3, CASE WHEN p.push >= p.nueva_desde
              THEN 'HUECO: el comienzo (' || to_char(p.push AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ') no va antes de DESDE (' ||
                   to_char(p.nueva_desde AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || '): el intervalo va al revés y no hay nada que mirar'
              ELSE 'pasadas de NOR-11 en el HUECO (del COMIENZO DEL HUECO a DESDE): esperado 0, medido ' || (SELECT count(*) FROM hueco) ||
                   coalesce(' · horas: ' || (SELECT string_agg(to_char(h.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS'), ', ' ORDER BY h.created_at) FROM hueco h), '') END,
         CASE WHEN p.push >= p.nueva_desde THEN NULL ELSE (SELECT count(*) FROM hueco) = 0 END
  FROM parametros p
  UNION ALL
  SELECT 4, 'pasada nueva ' || pa.n || ': los seis contadores del tramo están (faltan ' ||
            (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) || ')',
         (SELECT count(*) FROM contadores c WHERE c.n = pa.n AND NOT c.esta) = 0
  FROM pasadas pa WHERE pa.ventana = 'nueva'
  UNION ALL
  SELECT 5, 'pasada nueva ' || pa.n || ': está juez.citas_rescatadas_quitando_glosa (se lee la columna buena)',
         coalesce(pa.pc ? 'juez.citas_rescatadas_quitando_glosa', false)
  FROM pasadas pa WHERE pa.ventana = 'nueva'
  UNION ALL
  SELECT 6, 'pasada nueva ' || pa.n || ': contradictions_found ' || coalesce(pa.contradictions_found::text, '—') ||
            ' = publicadas ' || (SELECT count(*) FROM pub p WHERE p.ventana = 'nueva' AND p.n = pa.n),
         pa.contradictions_found = (SELECT count(*) FROM pub p WHERE p.ventana = 'nueva' AND p.n = pa.n)
  FROM pasadas pa WHERE pa.ventana = 'nueva'
),
control7 AS (
  SELECT 7 AS orden, 'pasada nueva ' || pa.n || ': todas sus parejas llevan modelo (sin modelo: ' ||
         (SELECT count(*) FROM lecturas l WHERE l.ventana = 'nueva' AND l.n = pa.n AND l.modelo IS NULL) || ' de ' ||
         (SELECT count(*) FROM lecturas l WHERE l.ventana = 'nueva' AND l.n = pa.n) || ')' AS medida,
         (SELECT count(*) FROM lecturas l WHERE l.ventana = 'nueva' AND l.n = pa.n) > 0
           AND (SELECT count(*) FROM lecturas l WHERE l.ventana = 'nueva' AND l.n = pa.n AND l.modelo IS NULL) = 0 AS ok
  FROM pasadas pa WHERE pa.ventana = 'nueva'
),
mediana AS (
  SELECT ventana, especie, count(*) AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY largo) AS med, min(largo) AS mn, max(largo) AS mx
  FROM citas GROUP BY GROUPING SETS ((ventana), (ventana, especie))
)
SELECT bloque, pasada, a, b, c, texto
FROM (
  SELECT '0 · control' AS bloque, NULL::text AS pasada, CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END AS a,
         medida AS b, NULL::text AS c, NULL::text AS texto, orden AS o1, 0::bigint AS o2
  FROM (SELECT * FROM control UNION ALL SELECT * FROM control7) control
  UNION ALL
  -- 1 · EL CENSO DE LAS DOS VENTANAS, con su ordinal, el marcador, el MODELO y los TOKENS DE SALIDA por pareja (F-128)
  SELECT '1 · censo', pa.ventana || ' ' || pa.n,
         to_char(pa.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid (hora guardada: la del final)',
         'id ' || pa.id || ' · contradictions_found ' || coalesce(pa.contradictions_found::text, '—'),
         'especies publicadas: ' || coalesce((SELECT string_agg(DISTINCT e.especie, ' + ' ORDER BY e.especie) FROM pub e WHERE e.ventana = pa.ventana AND e.n = pa.n), 'ninguna') ||
         ' · marcador ' || (SELECT count(DISTINCT e.especie) FROM pub e WHERE e.ventana = pa.ventana AND e.n = pa.n AND e.especie IN ('PLAZO', 'NEGACIÓN', 'LUGAR')) || '/3' ||
         ' · POR LA FRASE (no cuenta): ' || coalesce((SELECT string_agg(DISTINCT e.especie_frase, ' + ' ORDER BY e.especie_frase) FROM pubf e WHERE e.ventana = pa.ventana AND e.n = pa.n), 'ninguna') ||
         ', ' || (SELECT count(DISTINCT e.especie_frase) FROM pubf e WHERE e.ventana = pa.ventana AND e.n = pa.n AND e.especie_frase IN ('PLAZO', 'NEGACIÓN', 'LUGAR')) || '/3',
         'MODELO Y TOKENS DE SALIDA, por pareja: ' || coalesce((SELECT string_agg(coalesce(l.nombre, l.doc_id) || ' → ' ||
             coalesce(l.modelo, '— (anterior a F-128)') || ', ' || coalesce(l.tokens_salida, '—') || ' tokens de salida', ' | ' ORDER BY l.ord)
           FROM lecturas l WHERE l.ventana = pa.ventana AND l.n = pa.n), 'sin lecturas'),
         CASE pa.ventana WHEN 'vieja' THEN 0 ELSE 1 END, pa.n
  FROM pasadas pa
  UNION ALL
  -- 2 · LO PUBLICADO EN LA VENTANA NUEVA: las dos citas enteras, su longitud y la marca
  SELECT '2 · contradicciones publicadas (nueva)', 'nueva ' || e.n, e.especie,
         'POR LA FRASE: ' || e.especie_frase || ' · ' || coalesce(e.candidato, '—') || ' · ' || coalesce(e.severity, '—') || ' · confirmedBy: ' || coalesce(e.confirmado, '—') ||
           ' · marca recompuesta: ' || CASE WHEN e.marca IS NULL THEN 'no' ELSE 'SÍ' END ||
           ' · longitudes: nuevo ' || char_length(e.cita_nuevo) || ', existente ' || char_length(e.cita_existente) ||
           ' · ' || coalesce((SELECT coalesce(l.modelo, '— (anterior a F-128)') || ', ' || coalesce(l.tokens_salida, '—') || ' tokens de salida'
             FROM lecturas l WHERE l.ventana = e.ventana AND l.n = e.n AND l.nombre = e.candidato LIMIT 1), 'pareja sin lectura') ||
           ' · APARICIONES: la del nuevo ' || coalesce(e.ap_nuevo_entregado::text, '—') || ' en lo entregado y ' ||
           coalesce(e.ap_nuevo_doc::text, '— (sin full_text)') || ' en su documento; la del existente ' ||
           coalesce(e.ap_existente_doc::text, '— (sin full_text)') || ' en el suyo',
         e.tema,
         'NUEVO: ' || e.cita_nuevo || E'\nEXISTENTE: ' || e.cita_existente ||
           CASE WHEN e.marca IS NULL THEN '' ELSE
             coalesce(E'\nCITA DEL JUEZ (nuevo): ' || (e.marca->'nuevo'->>'citaDelJuez'), '') ||
             coalesce(E'\nCITA DEL JUEZ (existente): ' || (e.marca->'existente'->>'citaDelJuez'), '') END ||
           E'\nFRASE DEL NUEVO: ' || coalesce(e.frase_nuevo, '— (la cita no está literal en su full_text)') ||
           E'\nFRASE DEL EXISTENTE: ' || coalesce(e.frase_existente, '— (la cita no está literal en su full_text)'),
         0, e.n * 100 + e.ord
  FROM apariciones e
  UNION ALL
  -- 2d · LAS DOS COLUMNAS CRUZADAS, por ventana: una OTRA por la cita se parte en «X por la frase» y «OTRA de verdad»
  SELECT '2d · las dos columnas: por la cita → por la frase', e.ventana,
         'por la cita ' || e.especie || ' → por la frase ' || e.especie_frase,
         count(*) || ' contradicciones publicadas', NULL, NULL,
         CASE e.ventana WHEN 'vieja' THEN 0 ELSE 1 END, 0
  FROM pubf e GROUP BY e.ventana, e.especie, e.especie_frase
  UNION ALL
  -- 2c · LAS CITAS DE LA VENTANA NUEVA QUE APARECEN MÁS DE UNA VEZ en su documento (el salto de Mejora coge la primera)
  SELECT '2c · citas que aparecen más de una vez en su documento (nueva)', NULL,
         'del nuevo: ' || count(*) FILTER (WHERE ap_nuevo_doc > 1) || ' de ' || count(*) FILTER (WHERE ap_nuevo_doc IS NOT NULL) ||
           ' · del existente: ' || count(*) FILTER (WHERE ap_existente_doc > 1) || ' de ' || count(*) FILTER (WHERE ap_existente_doc IS NOT NULL),
         coalesce(string_agg('nueva ' || n || ' ' || especie || ': nuevo ' || coalesce(ap_nuevo_doc::text, '—') || ', existente ' || coalesce(ap_existente_doc::text, '—'), ' | ')
           FILTER (WHERE ap_nuevo_doc > 1 OR ap_existente_doc > 1), 'ninguna'),
         NULL, NULL, 0, 0
  FROM apariciones
  UNION ALL
  -- 3 · LOS SEIS CONTADORES DEL TRAMO por pasada nueva (FALTA si no está, nunca 0)
  SELECT '3 · contadores del tramo (nueva)', 'nueva ' || pa.n,
         'recompuestas ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_recompuestas') ||
         ' · en_trozos_distintos ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_recompuestas_en_trozos_distintos'),
         'empalme_multiple ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_empalme_multiple') ||
         ' · sin_tramo_literal ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.citas_sin_tramo_literal'),
         'bloqueadas_al_reclasificar ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.recompuestas_bloqueadas_al_reclasificar') ||
         ' · sin_contexto_del_resto ' || (SELECT CASE WHEN c.esta THEN c.valor ELSE 'FALTA' END FROM contadores c WHERE c.n = pa.n AND c.clave = 'juez.recompuestas_sin_contexto_del_resto'),
         NULL, 0, pa.n
  FROM pasadas pa WHERE pa.ventana = 'nueva'
  UNION ALL
  -- 4 · citasAlTramo ENTERO de la ventana nueva, o la frase que dice que no hay
  SELECT '4 · citasAlTramo (nueva)', 'nueva ' || t.n, coalesce(t.r->>'salida', '—'),
         coalesce(t.candidato, '—') || ' · hash ' || coalesce(t.r->>'hash', '—') || ' · lado ' || coalesce(t.r->>'lado', '—') ||
           coalesce(' · motivo ' || (t.r->>'motivo'), '') || ' · longitud de la cita ' || coalesce(t.r->>'longitudDeLaCita', '—'),
         concat_ws(' · ',
           'ancla ' || (t.r->'ancla'->>'desde') || '-' || (t.r->'ancla'->>'hasta'),
           'resto ' || (t.r->'resto'->>'desde') || '-' || (t.r->'resto'->>'hasta'),
           'longitud del resto ' || (t.r->>'longitudDelResto'),
           'distancia ' || (t.r->>'distancia'),
           'trozos ' || (t.r->'trozos'->>'ancla') || '/' || (t.r->'trozos'->>'resto')),
         CASE WHEN t.r ? 'frases' THEN 'FRASE DEL ANCLA: ' || (t.r->'frases'->>'ancla') || E'\nFRASE DEL RESTO: ' || (t.r->'frases'->>'resto') END,
         0, t.n * 100 + t.ord
  FROM tramo t
  UNION ALL
  SELECT '4 · citasAlTramo (nueva)', NULL, 'ninguna cita llegó al tramo', 'en ninguna de las pasadas de la ventana nueva', NULL, NULL, 1, 0
  WHERE NOT EXISTS (SELECT 1 FROM tramo)
  UNION ALL
  -- 5 · LA MEDIANA, las dos ventanas lado a lado: primero la global, después por especie
  SELECT '5 · mediana de las citas publicadas', m.ventana,
         coalesce(m.especie, 'TODAS'),
         'n ' || m.n || ' · mediana ' || round(m.med::numeric, 1),
         'mínimo ' || m.mn || ' · máximo ' || m.mx,
         NULL, CASE WHEN m.especie IS NULL THEN 0 ELSE 1 END,
         CASE m.ventana WHEN 'vieja' THEN 0 ELSE 1 END
  FROM mediana m
  UNION ALL
  -- 6 · LA CITA PUBLICADA MÁS CORTA de la ventana nueva (observación, no criterio)
  SELECT '6 · cita publicada más corta (nueva)', 'nueva ' || c.n, c.especie,
         'lado ' || c.lado || ' · ' || c.largo || ' caracteres', NULL, c.texto, 0, c.n
  FROM citas c
  WHERE c.ventana = 'nueva' AND c.largo = (SELECT min(largo) FROM citas WHERE ventana = 'nueva')
  UNION ALL
  -- 7 · LOS SOLAPAMIENTOS PUBLICADOS por pasada, en las dos ventanas
  SELECT '7 · solapamientos publicados', pa.ventana || ' ' || pa.n,
         'puntos del juez publicados: ' || coalesce((SELECT sum(jsonb_array_length(o->'puntos')) FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(pa.analysis->'overlaps') = 'array' THEN pa.analysis->'overlaps' ELSE '[]'::jsonb END) o
           WHERE jsonb_typeof(o->'puntos') = 'array'), 0),
         'grupos (overlaps_found): ' || coalesce(pa.overlaps_found::text, '—') ||
           ' · de ellos estructurales: ' || (SELECT count(*) FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(pa.analysis->'overlaps') = 'array' THEN pa.analysis->'overlaps' ELSE '[]'::jsonb END) o
           WHERE o->>'confirmedBy' = 'estructura'),
         NULL, NULL, CASE pa.ventana WHEN 'vieja' THEN 0 ELSE 1 END, pa.n
  FROM pasadas pa
  UNION ALL
  -- 8 · LAS DOS TRAMPAS DE paso en la ventana nueva: el recuento, y las segmentos_de_fila con su cita
  SELECT '8 · trampas de paso (nueva): recuento', NULL,
         'paso=recompuesta: ' || count(*) FILTER (WHERE d.datos->>'paso' = 'recompuesta'),
         'paso=segmentos_de_fila: ' || count(*) FILTER (WHERE d.datos->>'paso' = 'segmentos_de_fila'),
         'lados de descarte leídos: ' || count(*), NULL, 0, 0
  FROM descartes d
  UNION ALL
  SELECT '8 · trampas de paso (nueva): segmentos_de_fila', 'nueva ' || d.n, d.lado,
         coalesce(d.candidato, '—') || ' · ' || coalesce(d.d->>'tipo', '—') || ' · verificada ' || coalesce(d.datos->>'verificada', '—') ||
           ' · lado fallido ' || coalesce(d.d->>'ladoFallido', '—') || ' · pajar ' || coalesce(d.datos->>'pajar', '—'),
         d.d->>'tema', d.cita, 1, d.n * 100 + d.ord
  FROM descartes d WHERE d.datos->>'paso' = 'segmentos_de_fila'
  UNION ALL
  -- 9 · LO QUE LA PUERTA MATÓ COMO CONTRADICCIÓN en la ventana nueva (¿muere LUGAR?)
  SELECT '9 · contradicciones que mató la puerta (nueva)', 'nueva ' || d.n,
         coalesce((SELECT pr.especie FROM pares pr WHERE d.tn LIKE ANY (pr.nuevo) AND d.te LIKE pr.existente ORDER BY pr.orden LIMIT 1), 'OTRA'),
         coalesce(d.candidato, '—') || ' · lado fallido ' || coalesce(d.d->>'ladoFallido', '—') ||
           ' · nuevo: ' || coalesce(d.d->'nuevo'->>'paso', '—') || ' · existente: ' || coalesce(d.d->'existente'->>'paso', '—'),
         d.d->>'tema',
         'NUEVO: ' || coalesce(d.d->>'citaNuevo', '—') || E'\nEXISTENTE: ' || coalesce(d.d->>'citaExistente', '—'),
         0, d.n * 100 + d.ord
  FROM (SELECT DISTINCT ON (n, ord) n, ord, candidato, d, translate(lower(coalesce(d->>'citaNuevo', '')), 'áéíóúüñ', 'aeiouun') AS tn, translate(lower(coalesce(d->>'citaExistente', '')), 'áéíóúüñ', 'aeiouun') AS te
        FROM descartes WHERE d->>'tipo' = 'contradiccion' ORDER BY n, ord) d
) t
ORDER BY bloque, o1, o2, pasada;
