-- ============================================================
-- Fase B · B.5 paso 3C — columnas de procedencia de revision humana
-- YA EJECUTADO en el SQL Editor de Supabase (13/07/2026).
-- Este archivo es solo registro en el repo.
-- reviewed_at / reviewed_by: las rellena el boton "Marcar como
-- analizado" de la bandeja. El analisis automatico las deja null.
-- Nullable y sin FK (mismo criterio que document_id en B.1).
-- ============================================================

ALTER TABLE public.documents
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN reviewed_by uuid;
