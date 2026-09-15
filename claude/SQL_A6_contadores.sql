-- ============================================================
-- A6 · LAS CUATRO CIFRAS, DE LA BASE Y NO DEL LOG — 15/09/2026
--
-- ⚠️ EL LOG DESCRIBE EL CAMINO; LA BASE DESCRIBE EL RESULTADO. El «3
-- discrepancias, 60 filas con cruce» que se vio en pantalla es narrativa: lo que
-- vale es lo PERSISTIDO, y es lo único que se anota como medido.
--
-- Job de referencia: 2eea9aa0 (23,9 s, exhaustivo desde la bandeja).
-- Predicción escrita ANTES: 3 · 57 · 0 · 0 (discrepantes · idénticas · solo en A
-- · solo en B), con pares_ciegos 0.
-- ============================================================

-- ── 1 · LAS CUATRO, CON SU DENOMINADOR ──────────────────────────────────
-- ⚠️ El denominador va al lado a propósito: «3 discrepantes» no significa lo
-- mismo sobre 60 filas cruzadas que sobre 6. Sin él, un 3 no es una medición.

SELECT a.id,
       a.document_name,
       a.created_at,
       a.analysis_type,
       a.pipeline_counters ->> 'diff.clasificacion.discrepantes' AS discrepantes,
       a.pipeline_counters ->> 'diff.clasificacion.identicas'    AS identicas,
       a.pipeline_counters ->> 'diff.clasificacion.solo_en_a'    AS solo_en_a,
       a.pipeline_counters ->> 'diff.clasificacion.solo_en_b'    AS solo_en_b,
       a.pipeline_counters ->> 'diff.pares_ciegos'               AS pares_ciegos,
       a.contradictions_found,
       a.contradictions_confirmed,
       a.style_problems_found,
       a.recommendation
FROM analysis_results a
WHERE a.document_name LIKE 'OPE-14%'
ORDER BY a.created_at DESC
LIMIT 5;


-- ── 2 · TODOS LOS CONTADORES DE ESE ANÁLISIS, POR SI FALTA ALGUNO ───────
-- Si alguna clave de arriba sale NULL, esto dice cuáles hay de verdad. Una
-- clave ausente NO es un cero: es que no se escribió, y son cosas distintas.

SELECT a.id, a.created_at, jsonb_pretty(a.pipeline_counters) AS contadores
FROM analysis_results a
WHERE a.document_name LIKE 'OPE-14%'
ORDER BY a.created_at DESC
LIMIT 3;


-- ── 3 · ¿CONTRA QUIÉN SE COMPARÓ? ───────────────────────────────────────
-- El resultado sólo vale si el otro lado era OPE-11. Si aparece otro tarifario,
-- la cifra describe otra comparación.

SELECT a.id, a.created_at, jsonb_pretty(a.involved_documents) AS documentos_implicados
FROM analysis_results a
WHERE a.document_name LIKE 'OPE-14%'
ORDER BY a.created_at DESC
LIMIT 3;


-- ── 4 · LOS TRES TRABAJOS DEL DÍA, CON SU COSTE ─────────────────────────
-- Los dos cortados por el hash y el que sí trabajó, uno al lado del otro.

SELECT id, status, document_name, created_at, started_at, completed_at,
       EXTRACT(EPOCH FROM (completed_at - started_at)) AS segundos,
       credits_estimated, result_saved
FROM analysis_jobs
WHERE created_at > now() - interval '1 day'
ORDER BY created_at DESC;


-- ── 5 · EL DESCARTE PERMANENTE ──────────────────────────────────────────
-- ⚠️ ESTA TABLA NO GUARDA EL TEXTO DEL HALLAZGO, A PROPÓSITO: sólo la huella
-- hasheada. Así que NO se puede decir qué se descartó — sólo de qué ESPECIE es
-- y cuándo. Y la especie es justo lo que decide si pudo restar algo aquí.

SELECT id, kind, dismissed_by, created_at
FROM finding_dismissals
ORDER BY created_at DESC;
