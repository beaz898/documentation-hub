-- ============================================================
-- B.236 · ¿A CUÁNTOS DOCUMENTOS LES AFECTA EL RECORTE DE 20.000? — 15/09/2026
--
-- El análisis de estilo recorta el texto a 20.000 caracteres
-- (`style-check.ts:83`, literal desnudo y sin contador). Todo lo que pase de ahí
-- se analiza a medias Y EN SILENCIO: el usuario recibe «N problemas de estilo»
-- sin saber que la N es sobre una parte.
--
-- ⚠️ ESTO NO ARREGLA NADA. Sólo dice a cuántos les pasa hoy, que es lo que
-- decide si corre prisa.
-- ============================================================

-- ── 1 · CUÁNTOS LO SUPERAN, CON SU DENOMINADOR ──────────────────────────
-- ⚠️ El denominador es obligatorio: «3 documentos cortados» no significa lo
-- mismo sobre 42 que sobre 4.000.

SELECT count(*)                                            AS documentos_totales,
       count(*) FILTER (WHERE length(full_text) > 20000)   AS superan_el_recorte,
       count(*) FILTER (WHERE full_text IS NULL)           AS sin_texto_guardado,
       round(100.0 * count(*) FILTER (WHERE length(full_text) > 20000)
             / nullif(count(*) FILTER (WHERE full_text IS NOT NULL), 0), 1) AS porcentaje_de_los_que_tienen_texto
FROM documents;


-- ── 2 · CUÁLES, Y CUÁNTO SE PIERDEN ─────────────────────────────────────
-- «Se pierde el final» es abstracto; el número de caracteres que no llegan al
-- modelo no lo es.

SELECT name,
       source,
       length(full_text)              AS caracteres,
       length(full_text) - 20000      AS caracteres_que_NO_se_analizan,
       round(100.0 * 20000 / length(full_text), 1) AS porcentaje_que_SI_se_analiza
FROM documents
WHERE length(full_text) > 20000
ORDER BY length(full_text) DESC;


-- ── 3 · LA DISTRIBUCIÓN, PARA SABER SI ES UN BORDE O UN MURO ────────────
-- Si la mayoría está muy por debajo, el recorte es un borde raro. Si hay un
-- grupo rondando los 20.000, cualquier crecimiento normal los pasa al otro lado
-- sin que nadie se entere.

SELECT CASE
         WHEN length(full_text) <  5000 THEN 'a · menos de 5.000'
         WHEN length(full_text) < 10000 THEN 'b · 5.000 a 10.000'
         WHEN length(full_text) < 15000 THEN 'c · 10.000 a 15.000'
         WHEN length(full_text) < 20000 THEN 'd · 15.000 a 20.000  ← el borde'
         ELSE                                'e · MÁS de 20.000   ← cortados'
       END AS tramo,
       count(*) AS documentos
FROM documents
WHERE full_text IS NOT NULL
GROUP BY 1
ORDER BY 1;
