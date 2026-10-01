-- ============================================================================
-- B.299 · ¿CABE LA CITA LITERAL EN UN SOLO TROZO? — SÓLO LECTURA (L-12)
-- ⚠️ PENDIENTE DE EJECUTAR (01/10/2026). Sólo SELECT: no escribe nada.
--
-- ⚠️ CAMBIÓ DE PROPÓSITO el 01/10/2026 (arquitecto). YA NO DECIDE EL ARREGLO —la causa
-- (i) se arregló comprobando contra lo que el juez leyó (B.299, entrada 9)—: AHORA DICE
-- SI EL ARREGLO VA A SERVIR PARA ESTAS DOS CITAS.
--   · Si cruzan un límite de trozo ENTRE secciones, el arreglo las recupera.
--   · Si cruzan una costura DENTRO de una sección larga, no: ésa es de B.310.
--   · ⚠️ Y SI NO CRUZAN NINGÚN LÍMITE, la causa (i) no las explica y HAY UNA TERCERA CAUSA
--     que no hemos encontrado. **Un resultado negativo es un HALLAZGO, no un chasco.**
--
-- QUÉ CONTESTABA AL ESCRIBIRSE: si las dos citas LITERALES que la comprobación tiró (B.299,
-- entradas 3 y 4) caben enteras en UN trozo de la generación activa, o
-- cruzan de un trozo al siguiente. La comprobación compara la cita contra cada
-- trozo POR SEPARADO (`verifyQuote`, lib/analysis/judge.ts:329-332), así que
-- una cita que cruza el límite no se puede verificar nunca. Ésa es una de las
-- dos causas candidatas de L-12; la otra (la normalización asimétrica) no
-- necesita la base.
--
-- LAS DOS CITAS, partidas en su principio y su final (lo que se ve del log y
-- del texto extraído; la cita entera no consta, porque el log corta a 200):
--   · [f049837e], CLI-12 (lado analizado): «Un resultado positivo del control
--     biológico mensual» … «extraordinaria del área».
--   · [75925931] / [8878a300], NOR-10 (lado analizado): «Cada clínica cuenta con
--     un Coordinador de Calidad» … «designado por él».
--
-- CÓMO SE LEE: por cada cita, la fila que contenga el PRINCIPIO y la que
-- contenga el FINAL.
--   · Si es la misma fila: la cita cabe en un trozo, y la causa es otra.
--   · Si son filas distintas: cruza el límite, y la causa (i) de L-12 queda
--     demostrada para esa cita.
--   · Si alguna sale vacía: el texto indexado no es el del .docx (otra
--     extracción, otra tilde, otro espacio), y eso también es un hallazgo.
-- ============================================================================

WITH parametros AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org
),
trozos AS (
  SELECT d.name, c.chunk_index, c.text
  FROM public.documents d
  JOIN public.document_chunks c
    ON c.document_id = d.id AND c.generation = d.active_generation,
       parametros p
  WHERE d.org_id = p.org
    AND (d.name LIKE 'CLI-12%' OR d.name LIKE 'NOR-10%')
),
marcas AS (
  SELECT 'f049837e (CLI-12)' AS cita, 'principio' AS parte, 'CLI-12' AS doc,
         'Un resultado positivo del control biológico mensual' AS patron
  UNION ALL SELECT 'f049837e (CLI-12)', 'final', 'CLI-12', 'extraordinaria del área'
  UNION ALL SELECT '75925931 (NOR-10)', 'principio', 'NOR-10', 'Cada clínica cuenta con un Coordinador de Calidad'
  UNION ALL SELECT '75925931 (NOR-10)', 'final', 'NOR-10', 'designado por él'
)
SELECT m.cita, m.parte, t.chunk_index,
       char_length(t.text)                       AS caracteres_del_trozo,
       strpos(t.text, m.patron)                  AS posicion_en_el_trozo
FROM marcas m
LEFT JOIN trozos t
  ON t.name LIKE m.doc || '%' AND strpos(t.text, m.patron) > 0
ORDER BY m.cita, m.parte DESC, t.chunk_index;
