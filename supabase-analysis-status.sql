-- ============================================================
-- Fase B · B.1 — Estados de análisis por documento
-- YA EJECUTADO en el SQL Editor de Supabase (09/07/2026).
-- Este archivo es solo registro en el repo; no cambia la BD.
-- Verificado tras ejecutar: 41 documentos, todos 'analizado'.
-- ============================================================

-- 1) Columna nueva analysis_status en documents.
--    SEPARADA del status de ingesta (que hoy es siempre 'indexed').
--    Default 'pendiente': los documentos NUEVOS nacen sin analizar.
ALTER TABLE public.documents
  ADD COLUMN analysis_status text NOT NULL DEFAULT 'pendiente'
  CHECK (analysis_status IN ('pendiente', 'en_analisis', 'analizado', 'desactualizado'));

-- 2) BACKFILL: todo el corpus existente queda 'analizado'.
--    Son documentos ya indexados y en uso; no se le apaga el chat a nadie.
UPDATE public.documents
  SET analysis_status = 'analizado';

-- 3) Índice para el patrón de lectura de la bandeja:
--    "documentos de esta organización que no están analizados".
CREATE INDEX documents_org_analysis_status_idx
  ON public.documents (org_id, analysis_status);

-- 4) Columna document_id en analysis_results, para vincular
--    resultado <-> documento por id (hoy solo hay document_name).
--    Anulable y SIN FK: las filas antiguas no tienen id, y una FK
--    obligaría a rellenarlas o borrarlas.
ALTER TABLE public.analysis_results
  ADD COLUMN document_id uuid;

CREATE INDEX analysis_results_document_id_idx
  ON public.analysis_results (document_id);
