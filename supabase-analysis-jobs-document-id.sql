-- B.53 / camino exhaustivo: vincular el resultado del análisis exhaustivo a su documento.
-- Ejecutado en Supabase el 01/08/2026. document_id es nullable (el exhaustivo de subida no
-- tiene documento aún). Nota Fase D: exclude_document_id es de facto este mismo id; D los unifica.
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS document_id uuid;

COMMENT ON COLUMN public.analysis_jobs.document_id IS
  'documentId del documento analizado (para vincular el analysis_results del exhaustivo). Null en análisis de subida. Fase D: exclude_document_id = este id, se unifican.';
