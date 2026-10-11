-- ============================================================================
-- F-123 · ¿ESTÁN LAS FRASES SEMBRADAS EN EL TEXTO QUE RECIBE EL JUEZ? — SÓLO
-- LECTURA
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe nada.
-- ⚠️ SACA TEXTO DE DOCUMENTO: 300 caracteres alrededor de cada coincidencia, de
-- NOR-11 y CLI-13, documentos SEMBRADOS del corpus de pruebas (no de un cliente).
-- ✅ PROBADO ANTES DE ENTREGARLO (11/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): encuentra las frases sin distinguir mayúsculas ni
-- acentos, sólo en la generación activa y sólo en el documento que toca; exige
-- las dos palabras en el MISMO trozo para LUGAR; lista en el bloque 2 la frase
-- que no aparece; y el control sale FALLA si falta una frase de PLAZO. (La fila
-- de «una sola fila por nombre» no se ejercitó en rojo.)
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA (arquitecto, 11/10/2026): si las frases de las trampas LUGAR y
-- NEGACIÓN están en el texto de los trozos que se renderiza para el juez. Si no
-- están, el ground truth está caducado; si están, la pérdida es de
-- clasificación del modelo.
--
-- DE DÓNDE SALE EL TEXTO: `document_chunks.text` de la GENERACIÓN ACTIVA
-- (`documents.active_generation`), la columna que lee el análisis
-- (supabase-f20-chunks-estructurados.sql). El juez recibe esos textos unidos por
-- "\n\n" en orden de chunk_index (buildAnalyzedDocumentText,
-- lib/analysis/judge.ts:972-991); los trozos de tabla se renderizan aparte, y
-- NOR-11 y CLI-13 son prosa.
--
-- LA BÚSQUEDA: sin distinguir mayúsculas ni acentos (lower + translate de las
-- vocales acentuadas y la ñ, que conserva las posiciones carácter a carácter).
-- «Junto a» se lee como «en el MISMO trozo»: una frase partida entre dos trozos
-- no saldría, y el bloque 2 lo diría (cero filas donde hay frase).
--
-- ⚠️ CONTROL (bloque 0), que PUEDE FALLAR:
--   · las dos frases de PLAZO TIENEN que aparecer: «72 horas» en NOR-11 y
--     «7 días naturales» en CLI-13. Si no, la consulta está mal, no el corpus;
--   · cada nombre (NOR-11…, CLI-13…) tiene que casar con UNA sola fila en
--     `documents`: con dos, no se sabría cuál lee el análisis (B.373).
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
docs AS (
  SELECT d.id, d.name, d.active_generation,
         CASE WHEN d.name ILIKE 'NOR-11%' THEN 'NOR-11' WHEN d.name ILIKE 'CLI-13%' THEN 'CLI-13' END AS cual
  FROM public.documents d, piloto
  WHERE d.org_id = piloto.org AND (d.name ILIKE 'NOR-11%' OR d.name ILIKE 'CLI-13%')
),
trozos AS (
  SELECT dc.cual, dc.name, c.chunk_index, c.text,
         translate(lower(c.text), 'áéíóúüñ', 'aeiouun') AS t
  FROM docs dc
  JOIN public.document_chunks c ON c.document_id = dc.id AND c.generation = dc.active_generation
),
busquedas(trampa, cual, ancla, condicion) AS (
  VALUES
    ('NEGACIÓN', 'CLI-13', 'contenedor negro', NULL),
    ('LUGAR',    'CLI-13', 'retiro',           'retirada'),
    ('LUGAR',    'NOR-11', 'chamberi',         'punto de retirada'),
    ('PLAZO (control)', 'NOR-11', '72 horas',         NULL),
    ('PLAZO (control)', 'CLI-13', '7 dias naturales', NULL)
),
aciertos AS (
  SELECT b.trampa, b.cual, b.ancla, t.name, t.chunk_index,
         strpos(t.t, b.ancla) AS pos,
         substr(t.text, greatest(1, strpos(t.t, b.ancla) - 150), 300) AS contexto
  FROM busquedas b
  JOIN trozos t ON t.cual = b.cual
  WHERE strpos(t.t, b.ancla) > 0
    AND (b.condicion IS NULL OR strpos(t.t, b.condicion) > 0)
),
control AS (
  SELECT 'PLAZO: «72 horas» en NOR-11' AS medida,
         (SELECT count(*) FROM aciertos WHERE trampa LIKE 'PLAZO%' AND cual = 'NOR-11') > 0 AS ok
  UNION ALL
  SELECT 'PLAZO: «7 días naturales» en CLI-13',
         (SELECT count(*) FROM aciertos WHERE trampa LIKE 'PLAZO%' AND cual = 'CLI-13') > 0
  UNION ALL
  SELECT 'una sola fila de NOR-11 en documents', (SELECT count(*) FROM docs WHERE cual = 'NOR-11') = 1
  UNION ALL
  SELECT 'una sola fila de CLI-13 en documents', (SELECT count(*) FROM docs WHERE cual = 'CLI-13') = 1
)
SELECT bloque, trampa, documento, chunk_index, pos, contexto
FROM (
  SELECT '0 · control' AS bloque, CASE WHEN ok THEN 'OK' ELSE 'FALLA' END AS trampa,
         medida AS documento, NULL::int AS chunk_index, NULL::int AS pos, NULL::text AS contexto, 0 AS orden
  FROM control
  UNION ALL
  -- 1 · CADA COINCIDENCIA: documento, trozo, posición dentro del trozo y 300 caracteres.
  SELECT '1 · coincidencias', trampa || ' · «' || ancla || '»', name, chunk_index, pos, contexto, 1
  FROM aciertos
  UNION ALL
  -- 2 · LAS QUE NO APARECEN: una fila por búsqueda sin ninguna coincidencia.
  SELECT '2 · sin coincidencia', b.trampa || ' · «' || b.ancla || '»'
           || coalesce(' + «' || b.condicion || '» en el mismo trozo', ''),
         b.cual, NULL, NULL, 'NO APARECE en ningún trozo de la generación activa', 2
  FROM busquedas b
  WHERE NOT EXISTS (SELECT 1 FROM aciertos a WHERE a.trampa = b.trampa AND a.cual = b.cual AND a.ancla = b.ancla)
) t
ORDER BY bloque, trampa, documento, chunk_index;
