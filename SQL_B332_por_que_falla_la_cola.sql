-- ============================================================================
-- B.332 · POR QUÉ FALLA LA COLA: LAS CAUSAS DE LOS DESCARTES SIN BARRA — SÓLO
-- LECTURA
-- ✅ EJECUTADA el 05/10/2026 (corregido el 10/10/2026); resultado en claude/Estado_Del_MVP.md:13267 (B.332). Sólo SELECT: no escribe nada.
-- ⚠️ LEE CONTENIDO DE DOCUMENTOS (los últimos 60 caracteres de cada cita): el
--    resultado lo mira el arquitecto y no se copia a ningún registro ni a
--    ninguna ficha.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 05/10/2026): de las cuatro causas candidatas de
-- `cabeza_sin_cola` (B.332), cuál explica los lados que fallaron sin llevar barra.
--
-- LA POBLACIÓN: los lados de cita DESCARTADOS que FALLARON (`verificada` = false)
-- y que NO contienen «|». Los que llevan barra son de B.330 y no se miran aquí.
-- ⚠️ EL ARQUITECTO ESPERA 42: 21 `cabeza_sin_cola`, 12 `sin_cabeza` y
-- 9 `cola_demasiado_lejos` (los 75 lados que fallaron, menos los 33 con barra de
-- SQL_B331). La fila `0 · control` va PRIMERO para comprobarlo antes de leer lo
-- demás: si no da 42, la aritmética de partida no se sostiene.
--
-- LOS CINCO DATOS ESTÁN GUARDADOS, todos desde el primer descarte guardado
-- (commit `eb0a0033`, B.313): por lado, `paso`, `pajar`, `longitud` y
-- `verificada` (`lib/analysis/types.ts:175`), y la cita en crudo (`citaNuevo`,
-- `citaExistente`). La extensión sale del nombre: del documento analizado para
-- la cita nueva y del candidato del juicio para la existente. Nada se aproxima.
-- `longitud` es la de la cita sin el puntero de fila «[F3]», que la puerta
-- despega antes de buscar; los 60 caracteres son de la cita en crudo.
--
-- CÓMO TERMINA LA CITA (`termina_en`), sobre su último carácter en crudo:
--   · `puntuacion_final`: . ; : ? ! o …
--   · `coma`, `espacio`, `letra`, `cifra`;
--   · `cierre`: comilla o paréntesis de cierre. Lo que haya justo antes lo dice
--     la columna `sin_espacios_ni_cierres`, que mira el último carácter que no
--     es espacio ni cierre;
--   · `otro`: cualquier otra cosa, con el carácter al lado.
--
-- UNA SOLA CONSULTA, por la constante y porque el editor de Supabase sólo enseña
-- el último resultado. Columnas comunes; lo que significa cada una en cada
-- bloque va en esta tabla:
--   bloque   | c_n                 | c_distintas  | c_termina                  | c_texto
--   control  | lados               | citas dist.  | —                          | desglose por paso
--   a        | lados               | citas dist.  | —                          | —
--   b        | longitud            | —            | termina_en / sin_espacios… | últimos 60 caracteres
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
analisis AS (
  SELECT ar.id, ar.created_at,
         coalesce(lower(substring(ar.document_name FROM '\.([A-Za-z0-9]+)$')), 'sin_extension') AS ext_nuevo,
         j
  FROM public.analysis_results ar, piloto,
       jsonb_array_elements(CASE WHEN jsonb_typeof(ar.analysis->'judgments') = 'array' THEN ar.analysis->'judgments' ELSE '[]'::jsonb END) AS j
  WHERE ar.org_id = piloto.org
),
lados AS (
  SELECT d->>'tipo' AS tipo, 'nuevo' AS lado, d->>'citaNuevo' AS cita, a.ext_nuevo AS extension,
         (d->'nuevo'->>'verificada')::boolean AS verificada, d->'nuevo'->>'paso' AS paso,
         d->'nuevo'->>'pajar' AS pajar, (d->'nuevo'->>'longitud')::int AS longitud
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'descartesPorCita') = 'array' THEN a.j->'descartesPorCita' ELSE '[]'::jsonb END) d
  UNION ALL
  SELECT d->>'tipo', 'existente', d->>'citaExistente',
         coalesce(lower(substring(a.j->>'documentName' FROM '\.([A-Za-z0-9]+)$')), 'sin_extension'),
         (d->'existente'->>'verificada')::boolean, d->'existente'->>'paso',
         d->'existente'->>'pajar', (d->'existente'->>'longitud')::int
  FROM analisis a,
       jsonb_array_elements(CASE WHEN jsonb_typeof(a.j->'descartesPorCita') = 'array' THEN a.j->'descartesPorCita' ELSE '[]'::jsonb END) d
),
poblacion AS (
  SELECT l.*,
         right(l.cita, 1) AS ultimo,
         right(regexp_replace(l.cita, '[\s)"''»\]' || chr(8221) || chr(8217) || ']+$', ''), 1) AS ultimo_visible
  FROM lados l
  WHERE l.verificada = false
    AND strpos(coalesce(l.cita, ''), '|') = 0
),
clasificada AS (
  SELECT p.*,
         CASE
           WHEN coalesce(p.cita, '') = ''                                  THEN 'vacia'
           WHEN p.ultimo ~ ('[.;:?!' || chr(8230) || ']')                  THEN 'puntuacion_final'
           WHEN p.ultimo = ','                                             THEN 'coma'
           WHEN p.ultimo ~ '\s'                                            THEN 'espacio'
           WHEN p.ultimo ~ '[0-9]'                                         THEN 'cifra'
           WHEN p.ultimo ~ '[[:alpha:]]'                                   THEN 'letra'
           WHEN p.ultimo ~ ('[)"''»\]' || chr(8221) || chr(8217) || ']')   THEN 'cierre'
           ELSE 'otro: ' || p.ultimo
         END AS termina_en,
         CASE
           WHEN coalesce(p.ultimo_visible, '') = ''                        THEN 'nada'
           WHEN p.ultimo_visible ~ ('[.;:?!' || chr(8230) || ']')          THEN 'puntuacion_final'
           WHEN p.ultimo_visible = ','                                     THEN 'coma'
           WHEN p.ultimo_visible ~ '[0-9]'                                 THEN 'cifra'
           WHEN p.ultimo_visible ~ '[[:alpha:]]'                           THEN 'letra'
           ELSE 'otro: ' || p.ultimo_visible
         END AS sin_espacios_ni_cierres
  FROM poblacion p
)

SELECT bloque, paso, pajar, extension, tipo_lado, c_n, c_distintas, c_termina, c_texto
FROM (
  -- 0 · CONTROL: el total y su desglose por paso. El arquitecto espera 42.
  SELECT '0 · control' AS bloque, NULL::text AS paso, NULL::text AS pajar, NULL::text AS extension,
         NULL::text AS tipo_lado,
         count(*) AS c_n, count(DISTINCT cita) AS c_distintas, NULL::text AS c_termina,
         (SELECT string_agg(x.paso || '=' || x.n, ' · ' ORDER BY x.paso)
            FROM (SELECT coalesce(paso, 'sin_paso') AS paso, count(*) AS n FROM clasificada GROUP BY 1) x) AS c_texto,
         0 AS orden
  FROM clasificada

  UNION ALL
  -- a · EL REPARTO: extensión × pajar × paso.
  SELECT 'a · reparto', coalesce(paso, 'sin_paso'), coalesce(pajar, 'sin_dato'), extension, NULL,
         count(*), count(DISTINCT cita), NULL, NULL, 0
  FROM clasificada
  GROUP BY paso, pajar, extension

  UNION ALL
  -- b · LA LISTA: un renglón por lado, por paso y longitud.
  SELECT 'b · lista', coalesce(paso, 'sin_paso'), coalesce(pajar, 'sin_dato'), extension, tipo || ' / ' || lado,
         longitud, NULL, termina_en || ' / ' || sin_espacios_ni_cierres,
         right(cita, 60),
         longitud
  FROM clasificada
) t
ORDER BY bloque, paso, orden, pajar, extension;
