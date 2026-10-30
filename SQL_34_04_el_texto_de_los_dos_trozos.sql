-- ============================================================================
-- SQL_34_04 · ¿CAMBIÓ EL TEXTO DE LOS DOS TROZOS DE E3 ENTRE LA TERCERA TANDA Y LA CONDICIÓN 1? — SÓLO LECTURA (30/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- LA PREGUNTA (arquitecto, 30/10): la tercera tanda de E3 (29/10, 18:31 UTC) dio 4 de 7 y la condición 1 de la medición
-- de veinte (30/10, 08:03 UTC) dio 20 de 20 con la misma pareja. El CÓDIGO que arma el prompt es el mismo byte a byte en
-- los dos commits desplegados (comprobado por Code el 30/10). Lo que el código no ve es el TEXTO DE LOS DOS TROZOS, que
-- se lee de la base en cada pulsación (app/api/admin/medida-f130/leer-de-la-base.ts → lib/read-chunks.ts): si NOR-10 o
-- CLI-12 se reindexaron por medio, el prompt cambió sin que nadie tocara código.
--
-- POR QUÉ ESTA CONSULTA LO PUEDE DECIR, y es lo que la hace prueba y no indicio:
--   · Los trozos SÓLO SE INSERTAN Y SE BORRAN; nada reescribe el texto de uno ya guardado. Censo del 30/10, por capacidad:
--     grep -rn "from('document_chunks')" --include=*.ts app lib worker  → insert (lib/persist-chunks.ts:41) y dos delete
--     (:62, :86), ningún update ni upsert; y en los .sql de la raíz ningún UPDATE de document_chunks. Así que el texto de
--     una fila es el de su created_at.
--   · Cambiar la generación activa es un UPDATE de documents, y documents lleva el disparador documents_updated_at
--     (supabase-setup.sql:621-622), que pone updated_at a now().
--   · Por tanto: si el trozo de la generación activa se creó ANTES del límite y el documento no se ha tocado DESPUÉS, el
--     texto que se lee hoy es el mismo que había en el límite.
--   · ⚠️ La otra dirección NO vale: updated_at también se mueve por cosas que no son el texto (el estado del análisis, por
--     ejemplo). Si el documento se tocó después, la consulta dice «NO SE PUEDE AFIRMAR» y enseña las generaciones y la
--     versión en espera para mirar a mano; no dice que el texto cambiara.
--
-- EL LÍMITE: 18:30:00 UTC del 29/10. La tercera tanda devolvió a las 18:31:09 UTC (su «cuando», que se escribe al final),
-- y sus siete llamadas duraron unos 29 s (registro: la última empieza a 16.418 ms y dura 12.546); la lectura de los trozos
-- va antes que las llamadas. Una fila creada antes de las 18:30:00 estaba ahí cuando se leyó.
--
-- QUÉ SACA, por cada uno de los dos trozos (NOR-10 trozo 4, CLI-12 trozo 3), con el mismo criterio que la herramienta:
-- el documento por su código (el nombre empieza por él, y tiene que ser UNO), la generación activa (sin valor, la 1), el
-- trozo de esa generación con ese número, y que contenga su frase.
--   1 · el trozo: documento, generación activa, última vez que se tocó el documento; el trozo con su creación, su largo,
--       su md5 y si contiene la frase; y el VEREDICTO.
--   2 · las generaciones: cuántos trozos tiene cada generación guardada y entre qué horas se crearon, y si hay una
--       versión en espera (document_staged).
-- ============================================================================
-- ── LA RESOLUCIÓN DE LA ORGANIZACIÓN (26/10/2026), IDÉNTICA EN TODAS LAS CONSULTAS QUE MIRAN HACIA DELANTE ──
-- La organización NO se escribe: es la ÚNICA a la que pertenece el USUARIO del director. Si tiene cero o más de una,
-- la primera fila de la salida lo dice a gritos y todo lo demás está leyendo NADA. La primera fila dice SIEMPRE qué
-- organización se lee, su nombre y cuántos documentos tiene: un id o una resolución equivocados no pueden pasar por
-- «no hay hallazgos».
-- ⚠️ a9625e93-af2a-4416-a465-5c2fa2a25bdf ES A LA VEZ EL ID DEL USUARIO DEL DIRECTOR Y EL DE LA ORGANIZACIÓN DEL
-- PILOTO (purgada el 25/10/2026). Es un accidente histórico del código de antes del 27/04/2026, que tomaba el id del
-- usuario como id de la organización. AQUÍ ES EL USUARIO. NO SE UNIFICA con ORG_DEL_PILOTO de SQL_SEG_02, que es el
-- mismo número con el otro significado: unificarlas rompe el rescate de llm_usage sin que salte nada.
WITH usuario AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::uuid AS id                  -- ← USUARIO (el del director; NO es la organización)
),
resolucion AS (
  SELECT u.id AS usuario, count(m.org_id) AS pertenencias,
         CASE WHEN count(m.org_id) = 1 THEN min(m.org_id::text) END AS org
  FROM usuario u LEFT JOIN public.memberships m ON m.user_id = u.id
  GROUP BY u.id
),
organizacion_leida AS (
  SELECT CASE WHEN r.org IS NOT NULL   -- la que se lee DE VERDAD, no la que se cuenta
              THEN 'organización leída: ' || r.org || ' · «' || coalesce(o.name, '¿sin nombre?') || '» · '
                   || (SELECT count(*) FROM public.documents d WHERE d.org_id = r.org) || ' documentos'
              ELSE '⚠️⚠️ NO SE HA PODIDO RESOLVER LA ORGANIZACIÓN: el usuario ' || r.usuario || ' tiene ' || r.pertenencias
                   || ' pertenencias y tiene que tener UNA. TODO LO QUE SIGUE ESTÁ LEYENDO NADA: NO ES UN RESULTADO.' END AS linea
  FROM resolucion r LEFT JOIN public.organizations o ON o.id::text = r.org
),
parametros AS (
  SELECT (SELECT org FROM resolucion) AS org,          -- ← la organización RESUELTA por el USUARIO (arriba)
         timestamptz '2026-10-29 18:30:00+00' AS limite -- ← antes de que la tercera tanda leyera los trozos (cabecera)
),
pedidos AS (   -- los dos trozos de E3 y su frase: TROZOS de app/api/admin/medida-f130/medida-f130.ts
  SELECT * FROM (VALUES
    ('NOR-10', 4, 'puede recaer en el propio Director Clínico'),
    ('CLI-12', 3, 'separar la responsabilidad de un proceso crítico de seguridad del paciente')
  ) v(codigo, trozo, frase)
),
candidatos AS (   -- como la herramienta: el nombre EMPIEZA por el código, en la organización leída
  SELECT pe.codigo, d.id, d.name, coalesce(d.active_generation, 1) AS generacion, d.updated_at
  FROM pedidos pe
  JOIN public.documents d ON d.org_id = (SELECT org FROM parametros) AND d.name LIKE pe.codigo || '%'
),
cuenta AS (
  SELECT pe.codigo, count(c.id) AS n FROM pedidos pe LEFT JOIN candidatos c ON c.codigo = pe.codigo GROUP BY pe.codigo
),
unico AS (
  SELECT c.* FROM candidatos c JOIN cuenta k ON k.codigo = c.codigo AND k.n = 1
),
trozo AS (
  SELECT u.codigo, ch.created_at, char_length(ch.text) AS largo, md5(ch.text) AS huella,
         position(pe.frase IN ch.text) > 0 AS con_frase
  FROM unico u
  JOIN pedidos pe ON pe.codigo = u.codigo
  JOIN public.document_chunks ch ON ch.document_id = u.id AND ch.org_id = (SELECT org FROM parametros)
                                AND ch.generation = u.generacion AND ch.chunk_index = pe.trozo
),
generaciones AS (
  SELECT u.codigo,
         string_agg('generación ' || g.generation || ': ' || g.n || ' trozos, creados de '
                    || to_char(g.desde AT TIME ZONE 'UTC', 'DD/MM HH24:MI') || ' a '
                    || to_char(g.hasta AT TIME ZONE 'UTC', 'DD/MM HH24:MI') || ' UTC', ' · ' ORDER BY g.generation) AS lista
  FROM unico u
  JOIN (SELECT document_id, generation, count(*) AS n, min(created_at) AS desde, max(created_at) AS hasta
        FROM public.document_chunks WHERE org_id = (SELECT org FROM parametros)
        GROUP BY document_id, generation) g ON g.document_id = u.id
  GROUP BY u.codigo
),
en_espera AS (
  SELECT u.codigo, 'versión en espera: generación ' || s.generation || ', creada '
                   || to_char(s.created_at AT TIME ZONE 'UTC', 'DD/MM HH24:MI') || ' UTC' AS linea
  FROM unico u JOIN public.document_staged s ON s.document_id = u.id
)
SELECT bloque, a, b, c, d FROM (
  SELECT 'organización leída' AS bloque, linea AS a, NULL::text AS b, NULL::text AS c, NULL::text AS d, 0 AS o1
  FROM organizacion_leida
  UNION ALL
  -- 1 · EL TROZO y el veredicto
  SELECT '1 · el trozo', pe.codigo || ' · trozo ' || pe.trozo,
         CASE WHEN k.n <> 1 THEN '—'
              ELSE u.name || ' · generación activa ' || u.generacion || ' · documento tocado por última vez: '
                   || coalesce(to_char(u.updated_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI:SS') || ' UTC', 'SIN FECHA') END,
         CASE WHEN t.codigo IS NULL THEN '—'
              ELSE 'creado ' || to_char(t.created_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI:SS') || ' UTC · '
                   || t.largo || ' caracteres · md5 ' || t.huella || ' · contiene su frase: '
                   || CASE WHEN t.con_frase THEN 'sí' ELSE 'NO' END END,
         CASE WHEN k.n <> 1
                THEN '⚠️ NO SE PUEDE: el código resuelve a ' || k.n || ' documentos, y tiene que ser uno'
              WHEN t.codigo IS NULL
                THEN '⚠️ NO SE PUEDE: la generación activa no tiene el trozo ' || pe.trozo
              WHEN NOT t.con_frase
                THEN '⚠️ NO SE PUEDE: el trozo no contiene su frase, y no es el que se midió'
              WHEN t.created_at < p.limite AND u.updated_at < p.limite
                THEN 'EL TEXTO ES EL MISMO: el trozo existe desde antes de las 18:30 UTC del 29/10 y el documento no se ha tocado desde entonces'
              ELSE 'NO SE PUEDE AFIRMAR CON ESTA CONSULTA: '
                   || concat_ws(' y ',
                        CASE WHEN t.created_at >= p.limite THEN 'el trozo se creó a las 18:30 UTC del 29/10 o después' END,
                        CASE WHEN u.updated_at IS NULL THEN 'el documento no tiene fecha de última modificación'
                             WHEN u.updated_at >= p.limite THEN 'el documento se tocó a las 18:30 UTC del 29/10 o después (puede no ser el texto: mirar el bloque 2)' END)
              END,
         CASE pe.codigo WHEN 'NOR-10' THEN 1 ELSE 2 END
  FROM pedidos pe
  CROSS JOIN parametros p
  JOIN cuenta k ON k.codigo = pe.codigo
  LEFT JOIN unico u ON u.codigo = pe.codigo
  LEFT JOIN trozo t ON t.codigo = pe.codigo
  UNION ALL
  -- 2 · LAS GENERACIONES guardadas y la versión en espera, para mirar a mano cuando el veredicto no puede afirmar
  SELECT '2 · las generaciones', pe.codigo, coalesce(g.lista, '—'), coalesce(e.linea, 'sin versión en espera'), NULL,
         CASE pe.codigo WHEN 'NOR-10' THEN 1 ELSE 2 END
  FROM pedidos pe
  JOIN unico u ON u.codigo = pe.codigo
  LEFT JOIN generaciones g ON g.codigo = pe.codigo
  LEFT JOIN en_espera e ON e.codigo = pe.codigo
) x
ORDER BY (bloque <> 'organización leída'), bloque, o1;
