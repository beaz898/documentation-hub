-- ============================================================================
-- 3.1.3 · LA ENTRADA DEL JUEZ EN NOR-11 ↔ CLI-13, EL 21/10 Y EN LA TANDA — SÓLO LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: ni un UPDATE ni un DELETE.
-- No saca texto de ningún documento: números, modelos y nombres de documento.
--
-- LA PREGUNTA (arquitecto, 22/10/2026): esa pareja no cambió de bytes entre el 21/10 y la tanda —el analizado
-- 14.704 entero y el candidato 9.817 entero en las dos—. SI LA ENTRADA DEL JUEZ ES LA MISMA, la bajada de la
-- mediana de las citas (de 167 a 107) y las tres citas de 33 caracteres de LUGAR son muestreo, no regresión. Si
-- NO es la misma, se dice exactamente en qué se diferencia, sin sacar conclusiones. Mientras no esté hecho, es
-- una pregunta, no un hallazgo.
--
-- Lo que se compara, por cada pasada de NOR-11 y SÓLO en la petición del juez cuya pareja es CLI-13 (el
-- registro por llamada guarda el documentId del candidato en `pareja`):
--   · el MODELO; la entrada en sus tres trozos (entrada, caché escrita, caché leída) y su suma, que es la
--     entrada real (input_tokens no incluye lo cacheado: cabecera de SQL_311_02); la ESTIMADA ÷4, que es la
--     longitud del cuerpo enviado entre cuatro y por tanto cambia si cambia un solo carácter del prompt
--     (salvo redondeo); y la salida;
--   · y de la lectura de esa pareja, lo que vio el juez de cada lado (caracteres entregados de cada total).
-- El bloque 2 resume, por ventana, los VALORES DISTINTOS de cada cosa. «LA MISMA ENTRADA» sólo sale si en las
-- dos ventanas hay un único valor de entrada real, el mismo, y un único modelo, el mismo.
--
-- ⚠️ LOS LÍMITES:
--   · Lo que el código dice, comprobado por Code el 22/10 (git diff 10deee06..aa29166b de lib/analysis/judge.ts,
--     el único fichero de la petición del juez tocado desde el 21/10 a las 10:21): con la pareja entera, el
--     juez recibe el analizado y el candidato enteros como antes, y la plantilla del prompt no cambió. Esta
--     consulta comprueba si los DATOS lo confirman; no lo da por hecho.
--   · Una ventana vacía no es «la misma entrada»: el control correspondiente FALLA.
--   · No lleva ESPERADO (regla del 22/10: el esperado de una consulta de tanda se rellena DESPUÉS de mirar
--     el reloj de la base): imprime cuántas pasadas encuentra y a qué hora, y eso se mira.
--
-- ✅ PROBADO ANTES DE ENTREGARLO en PGlite (claude/arneses/f313/), con pasadas sintéticas: la misma entrada
-- en las dos ventanas, una que difiere en la caché, otra en el modelo y una ventana vacía. CON DATOS REALES
-- NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN NO SE ESCRIBE: se resuelve por el USUARIO del director   │
-- │ (la constante `usuario`, en el bloque de la resolución). No se toca.     │
-- │ LO QUE TOCA EL DIRECTOR: las dos ventanas, en hora de Madrid, formato    │
-- │ timestamptz 'AAAA-MM-DD HH:MM:SS+02' (desde el 25/10 a las 03:00, «+01»).│
-- │ Vienen puestas el 21/10 entero y el 22/10 entero.                        │
-- └──────────────────────────────────────────────────────────────────────────┘
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
  SELECT (SELECT org FROM resolucion) AS org,   -- ← la organización RESUELTA por el USUARIO (arriba)
         timestamptz '2026-10-21 00:00:00+02' AS base_desde,      -- ← la línea base: el 21/10
         timestamptz '2026-10-22 00:00:00+02' AS base_hasta,
         timestamptz '2026-10-22 00:00:00+02' AS tanda_desde,     -- ← la tanda del 3.1.3
         timestamptz '2026-10-23 00:00:00+02' AS tanda_hasta
),
cli13 AS (
  SELECT d.id::text AS id FROM public.documents d, parametros p WHERE d.org_id = p.org AND d.name ILIKE 'CLI-13%'
),
pasadas AS (
  SELECT ar.id, ar.created_at, ar.analysis,
         CASE WHEN ar.created_at >= p.base_desde AND ar.created_at < p.base_hasta THEN 'base 21/10' ELSE 'tanda' END AS ventana,
         row_number() OVER (PARTITION BY ar.created_at >= p.base_desde AND ar.created_at < p.base_hasta ORDER BY ar.created_at) AS n
  FROM public.analysis_results ar, parametros p
  WHERE ar.org_id = p.org AND ar.document_name ILIKE 'NOR-11%'
    AND ((ar.created_at >= p.base_desde AND ar.created_at < p.base_hasta) OR (ar.created_at >= p.tanda_desde AND ar.created_at < p.tanda_hasta))
    AND jsonb_typeof(ar.analysis->'llamadasAlModelo') = 'object'
),
juez AS (
  SELECT pa.ventana, pa.n, x.p->>'modelo' AS modelo, x.p->>'resultado' AS resultado,
         coalesce((x.p->'tokens'->>'entrada')::bigint, 0) AS te, coalesce((x.p->'tokens'->>'escrituraCache')::bigint, 0) AS tw,
         coalesce((x.p->'tokens'->>'lecturaCache')::bigint, 0) AS tr, coalesce((x.p->'tokens'->>'salida')::bigint, 0) AS ts,
         (x.p->>'entradaEstimada')::bigint AS est
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'llamadasAlModelo'->'peticiones') = 'array' THEN pa.analysis->'llamadasAlModelo'->'peticiones' ELSE '[]'::jsonb END) x(p)
  WHERE x.p->>'etapa' = 'juez' AND x.p->>'pareja' IN (SELECT id FROM cli13)
),
juez_ok AS (
  SELECT j.*, j.te + j.tw + j.tr AS total FROM juez j WHERE j.resultado = 'ok'
),
lectura AS (
  SELECT pa.ventana, pa.n, l->>'modelo' AS modelo, l->>'regimen' AS regimen,
         (l->'analizado'->>'mostrados') || '/' || (l->'analizado'->>'caracteres') AS analizado,
         (l->'candidato'->>'mostrados') || '/' || (l->'candidato'->>'caracteres') AS candidato
  FROM pasadas pa
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(pa.analysis->'lecturaDeLasParejas') = 'array' THEN pa.analysis->'lecturaDeLasParejas' ELSE '[]'::jsonb END) l
  WHERE l->>'documentId' IN (SELECT id FROM cli13)
),
resumen AS (
  SELECT ventana, count(*) AS peticiones,
         count(DISTINCT total) AS n_total, string_agg(DISTINCT total::text, ', ') AS totales,
         count(DISTINCT modelo) AS n_modelo, string_agg(DISTINCT coalesce(modelo, '—'), ', ') AS modelos,
         string_agg(DISTINCT coalesce(est::text, '—'), ', ') AS estimadas,
         string_agg(DISTINCT te || '+' || tw || '+' || tr, ', ') AS trozos
  FROM juez_ok GROUP BY ventana
),
control AS (
  SELECT 1 AS orden, 'documentos CLI-13 en la organización: esperado 1, medido ' || (SELECT count(*) FROM cli13) AS medida,
         (SELECT count(*) FROM cli13) = 1 AS ok
  UNION ALL
  SELECT 2, 'pasadas de NOR-11 con registro en la línea base (21/10): ' || (SELECT count(*) FROM pasadas WHERE ventana = 'base 21/10'),
         (SELECT count(*) FROM pasadas WHERE ventana = 'base 21/10') > 0
  UNION ALL
  SELECT 3, 'pasadas de NOR-11 con registro en la tanda: ' || (SELECT count(*) FROM pasadas WHERE ventana = 'tanda'),
         (SELECT count(*) FROM pasadas WHERE ventana = 'tanda') > 0
  UNION ALL
  -- 4 · cada pasada tiene UNA petición del juez a CLI-13 que salió bien, o la comparación no es de pasada a pasada
  SELECT 4, 'pasadas sin exactamente una petición del juez a CLI-13 que saliera bien: ' ||
         (SELECT count(*) FROM pasadas pa WHERE (SELECT count(*) FROM juez_ok j WHERE j.ventana = pa.ventana AND j.n = pa.n) <> 1) ||
         ' de ' || (SELECT count(*) FROM pasadas),
         CASE WHEN (SELECT count(*) FROM pasadas) = 0 THEN NULL
              ELSE (SELECT count(*) FROM pasadas pa WHERE (SELECT count(*) FROM juez_ok j WHERE j.ventana = pa.ventana AND j.n = pa.n) <> 1) = 0 END
)
SELECT bloque, pasada, a, b, c
FROM (
  SELECT 'organización leída' AS bloque, NULL::text AS pasada, linea AS a, NULL::text AS b, NULL::text AS c,
         -1 AS o1, ''::text AS o2, 0::bigint AS o3
  FROM organizacion_leida
  UNION ALL
  SELECT '0 · control' AS bloque, NULL::text AS pasada,
         CASE WHEN ok IS NULL THEN 'NO APLICA' WHEN ok THEN 'OK' ELSE 'FALLA' END AS a, medida AS b, NULL::text AS c,
         orden AS o1, ''::text AS o2, 0::bigint AS o3
  FROM control
  UNION ALL
  -- 1 · POR PASADA: la petición del juez a CLI-13 y lo que vio de cada lado
  SELECT '1 · por pasada', pa.ventana || ' ' || pa.n,
         to_char(pa.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI:SS') || ' Madrid · ' ||
           coalesce((SELECT string_agg(j.modelo || ' · ' || j.resultado, ' | ') FROM juez j WHERE j.ventana = pa.ventana AND j.n = pa.n), 'sin petición del juez a CLI-13'),
         coalesce((SELECT string_agg('entrada ' || j.te || ' + caché escrita ' || j.tw || ' + caché leída ' || j.tr || ' = ' || j.total ||
                                     ' · estimada ÷4 ' || coalesce(j.est::text, '—') || ' · salida ' || j.ts, ' | ')
                   FROM juez_ok j WHERE j.ventana = pa.ventana AND j.n = pa.n), '—'),
         coalesce((SELECT string_agg(l.regimen || ' · analizado ' || l.analizado || ' · candidato ' || l.candidato || ' · modelo ' || coalesce(l.modelo, '—'), ' | ')
                   FROM lectura l WHERE l.ventana = pa.ventana AND l.n = pa.n), 'sin lectura de la pareja'),
         10, pa.ventana, pa.n
  FROM pasadas pa
  UNION ALL
  -- 2 · POR VENTANA: los valores distintos de cada cosa
  SELECT '2 · por ventana', r.ventana, r.peticiones || ' peticiones · entrada real: ' || r.totales || ' · modelo: ' || r.modelos,
         'entrada + caché escrita + caché leída: ' || r.trozos, 'estimada ÷4: ' || r.estimadas,
         20, r.ventana, 0
  FROM resumen r
  UNION ALL
  -- 3 · EL VEREDICTO, sin conclusión: si la entrada es la misma o en qué difiere
  SELECT '3 · la entrada', NULL,
         CASE WHEN b.ventana IS NULL OR t.ventana IS NULL THEN 'SIN COMPARACIÓN (una ventana sin peticiones)'
              WHEN b.n_total = 1 AND t.n_total = 1 AND b.totales = t.totales AND b.n_modelo = 1 AND t.n_modelo = 1 AND b.modelos = t.modelos
                THEN 'LA MISMA ENTRADA'
              ELSE 'DISTINTA' END,
         'entrada real · base: ' || coalesce(b.totales, '—') || ' · tanda: ' || coalesce(t.totales, '—'),
         'modelo · base: ' || coalesce(b.modelos, '—') || ' · tanda: ' || coalesce(t.modelos, '—'),
         30, '', 0
  FROM (SELECT 1) uno
  LEFT JOIN resumen b ON b.ventana = 'base 21/10'
  LEFT JOIN resumen t ON t.ventana = 'tanda'
) x
ORDER BY o1, o2, o3, a;
