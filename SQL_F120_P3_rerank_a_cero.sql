-- ============================================================================
-- F-120 · P3 · LA ALARMA DEL RERANK: CERO SELECCIONADOS CON CANDIDATOS — SÓLO
-- LECTURA
-- ✅ EJECUTADA por el director el 06/10/2026 (corregido el 10/10/2026); resultado en claude/consultas-fable/F-120_2026-10-06_frente-4-reclasificado.md:468-473. Sólo SELECT: no escribe nada.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-…, «Workspace principal». El id     │
-- │ completo está UNA vez, en la constante `piloto` de la primera línea de   │
-- │ la consulta (convenio del 05/10/2026). No se mira ninguna otra.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- QUÉ CONTESTA: es el encargo de medición de Fable en su respuesta a F-120, P3.
-- De los análisis guardados desde el 02/10, cuántos tienen el rerank con CERO
-- seleccionados y AL MENOS un candidato: el sitio donde B.83 localizó que muere
-- un verdadero positivo («Retrieval: 2 candidatos. Rerank: 0 seleccionados»).
--
-- ⚠️ PREDICCIÓN DE FABLE, escrita antes de ejecutar: MÁS DE UNO.
--
-- DE DÓNDE SALE: no de los logs, de lo guardado. Cada análisis guarda
-- `coberturaDeCandidatos` (B.244), con `comparados` = los que eligió el rerank y
-- `afines` = los candidatos que encontró la recuperación (lib/analysis/pipeline.ts:
-- 1050, `{ comparados: reranked.length, afines: candidates.length }`).
--
-- ⚠️ LA COLUMNA DE CONTROL `sin_dato` TIENE QUE DAR 0. Cuenta los análisis que no
-- traen `coberturaDeCandidatos`; esos no entran en el recuento del rerank a cero.
-- El campo existe desde el 16/09, así que desde el 02/10 no debería faltar en
-- ninguno. SI `sin_dato` NO ES 0, EL RECUENTO NO VALE: habría análisis que no se
-- han podido mirar, y un cero o un número bajo no diría nada.
-- ============================================================================

WITH piloto AS (
  SELECT 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'::text AS org   -- ← LA CONSTANTE
),
desde_02 AS (
  SELECT ar.id, ar.created_at, ar.document_name, ar.analysis_type,
         (ar.analysis->'coberturaDeCandidatos'->>'comparados')::int AS seleccionados,
         (ar.analysis->'coberturaDeCandidatos'->>'afines')::int     AS candidatos
  FROM public.analysis_results ar, piloto
  WHERE ar.org_id = piloto.org
    AND ar.created_at >= timestamptz '2026-10-02 00:00:00+02'
    AND ar.analysis_type IN ('quick', 'exhaustive')
)
SELECT count(*)                                                           AS analisis,
       count(*) FILTER (WHERE seleccionados IS NULL)                      AS sin_dato,
       count(*) FILTER (WHERE seleccionados = 0 AND candidatos >= 1)      AS rerank_a_cero_con_candidatos,
       string_agg(document_name || ' ' || to_char(created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM HH24:MI')
                  || ' (' || candidatos || ' cand.)', ' · ')
         FILTER (WHERE seleccionados = 0 AND candidatos >= 1)             AS cuales
FROM desde_02;
