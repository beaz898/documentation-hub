-- ============================================================
-- Fase B · B.5 — Columna analysis (jsonb) en analysis_results
-- YA EJECUTADO en el SQL Editor de Supabase (13/07/2026).
-- Este archivo es solo registro en el repo; no cambia la BD.
-- Guarda el objeto FinalAnalysis completo del análisis rápido
-- para que la bandeja de revisión muestre las incidencias sin
-- recalcular ni gastar créditos. document_id ya existía (B.1).
-- ============================================================

ALTER TABLE public.analysis_results
  ADD COLUMN analysis jsonb;
