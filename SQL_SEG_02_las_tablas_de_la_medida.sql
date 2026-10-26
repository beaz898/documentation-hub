-- ============================================================================
-- EL SEGUNDO SEGURO: LAS TABLAS QUE LEEN NUESTRAS CONSULTAS DE MEDIDA, PARA DESCARGAR EN CSV — SÓLO LECTURA (26/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
-- Sólo la organización del piloto: la constante va al principio de CADA consulta, porque cada una se ejecuta sola.
--
-- EL CRITERIO (arquitecto, 26/10): se exporta toda tabla que lea alguna de nuestras consultas de medida. Las filas
-- de análisis ya van en SQL_SEG_01. El censo se hizo sobre los 75 SQL_*.sql de la raíz y de claude/, buscando
-- «from» y «join» seguidos del nombre de la tabla. Entran, con quién las lee:
--   1 · documents (con full_text) ........ casi todas; las citas literales se comprueban contra full_text
--   2 · document_chunks .................. casi todas; ídem contra los trozos. NO se regeneran desde corpus-pruebas:
--                                          un documento subido antes del 07/09 se troceó con otra versión del
--                                          extractor (la 3 es del 07/09), y nada prueba que el fichero subido sea
--                                          byte a byte el de corpus-pruebas. (piezasDelAnalizado, del 23/10, no
--                                          cambia el troceo: monta el texto del juez desde los trozos guardados.)
--   3 · document_staged .................. SQL_Corpus_Con_Trozos_Por_Estado, SQL_Corpus_Reindexable_Sin_Resubir
--   4 · analysis_jobs .................... SQL_A6_contadores, SQL_B235_cobro_CLI20, SQL_F109_seleccion_CLI05
--   5 · finding_dismissals (descartes) ... SQL_A6_contadores
--   6 · llm_usage ........................ SQL_F127_02_el_coste_por_analisis, SQL_B349, SQL_B240
--   7 · usage_logs ....................... SQL_B235_cobro_CLI20
--   8 · organizations (la fila del piloto)  SQL_B235, SQL_examen_estado_de_los_documentos y otras
-- Fuera, porque sólo las leen consultas de cuenta o de integridad y no de medida: memberships, feedback y
-- documentation_gaps (SQL_B223_recuento, SQL_B323) y drive_connections (SQL_INV_01; además guarda las claves de
-- Drive, que no se sacan nunca).
--
-- EL CUADRE, igual que en SQL_SEG_01: cada consulta lleva delante n y total_filas (la última fila del CSV tiene que
-- llevar n = total_filas, y el CSV tener total_filas filas) y, donde hay una celda grande, sus caracteres y su md5,
-- para comprobar más adelante que no se recortó.
--
-- CÓMO SE EJECUTA: SON OCHO CONSULTAS, una por tabla. El editor de Supabase sólo enseña el resultado de la última:
-- se selecciona UNA, se ejecuta, «Download CSV», y la siguiente. ⚠️ SIN COMPROBAR: si el editor recorta al exportar.
-- ============================================================================

-- ══ SEG-02 · 1 · documents ══════════════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.created_at, t.id) AS n,
       count(*) OVER () AS total_filas,
       to_char(t.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       length(t.full_text) AS caracteres_del_texto,
       md5(t.full_text) AS huella_del_texto,
       t.*
FROM public.documents t, p
WHERE t.org_id = p.org
ORDER BY t.created_at, t.id;

-- ══ SEG-02 · 2 · document_chunks ════════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.document_id, t.generation, t.chunk_index) AS n,
       count(*) OVER () AS total_filas,
       length(t.text) AS caracteres_del_trozo,
       md5(t.text) AS huella_del_trozo,
       t.*
FROM public.document_chunks t, p
WHERE t.org_id = p.org
ORDER BY t.document_id, t.generation, t.chunk_index;

-- ══ SEG-02 · 3 · document_staged ════════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.created_at, t.document_id) AS n,
       count(*) OVER () AS total_filas,
       to_char(t.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       length(t.full_text) AS caracteres_del_texto,
       md5(t.full_text) AS huella_del_texto,
       t.*
FROM public.document_staged t, p
WHERE t.org_id = p.org
ORDER BY t.created_at, t.document_id;

-- ══ SEG-02 · 4 · analysis_jobs ══════════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.created_at, t.id) AS n,
       count(*) OVER () AS total_filas,
       to_char(t.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       length(t.result::text) AS caracteres_del_resultado,
       md5(t.result::text) AS huella_del_resultado,
       length(t.document_text) AS caracteres_del_documento,
       md5(t.document_text) AS huella_del_documento,
       t.*
FROM public.analysis_jobs t, p
WHERE t.org_id::text = p.org
ORDER BY t.created_at, t.id;

-- ══ SEG-02 · 5 · finding_dismissals ═════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.created_at, t.id) AS n,
       count(*) OVER () AS total_filas,
       to_char(t.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       t.*
FROM public.finding_dismissals t, p
WHERE t.org_id = p.org
ORDER BY t.created_at, t.id;

-- ══ SEG-02 · 6 · llm_usage ══════════════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.created_at, t.id) AS n,
       count(*) OVER () AS total_filas,
       to_char(t.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       t.*
FROM public.llm_usage t, p
WHERE t.org_id::text = p.org
ORDER BY t.created_at, t.id;

-- ══ SEG-02 · 7 · usage_logs ═════════════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.created_at, t.id) AS n,
       count(*) OVER () AS total_filas,
       to_char(t.created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM-DD HH24:MI:SS') AS fecha_madrid,
       t.*
FROM public.usage_logs t, p
WHERE t.org_id = p.org
ORDER BY t.created_at, t.id;

-- ══ SEG-02 · 8 · organizations ══════════════════════════════════════════════
WITH p AS (SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org)
SELECT row_number() OVER (ORDER BY t.id) AS n,
       count(*) OVER () AS total_filas,
       t.*
FROM public.organizations t, p
WHERE t.id::text = p.org
ORDER BY t.id;
