-- ============================================================
-- Fase C · C.4d-2b — backfill de reviewed_at (parque pre-versionado)
-- YA EJECUTADO en el SQL Editor de Supabase (11/08/2026).
-- Este archivo es solo registro en el repo.
--
-- Diseño F-7: los documentos 'analizado' anteriores al versionado fueron
-- admitidos por decisión humana en su día. Se les rellena reviewed_at para que
-- no aparezcan en la bandeja el día que se active la condición del colindante
-- (C.4d-2b): "'analizado' sin staged, reviewed_at IS NULL y contadores > 0".
-- reviewed_by se deja NULL a propósito: no hubo un usuario concreto, fue el
-- régimen pre-versionado.
--
-- Acotado a reviewed_at IS NULL para no pisar la procedencia real de los que ya
-- pasaron por el botón "Marcar como analizado". Idempotente (una segunda
-- ejecución toca 0 filas). Verificado: 26 filas afectadas; tras el backfill,
-- analizados_sin_reviewed = 0.
-- ============================================================
update documents
set reviewed_at = now()
where analysis_status = 'analizado'
  and reviewed_at is null;
