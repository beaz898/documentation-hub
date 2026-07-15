-- ============================================================
-- Fase B · B.5-hash-a — hash del texto analizado
-- YA EJECUTADO en el SQL Editor de Supabase (15/07/2026).
-- Este archivo es solo registro en el repo.
-- analyzed_content_hash = "que texto SE ANALIZO por ultima vez" (verificacion).
-- NO confundir con content_hash = "que texto ES este documento" (identidad,
-- duplicados exactos). Son primos, nunca el mismo campo.
-- null = esta version nunca se ha analizado. Sin backfill a proposito.
-- Doble uso: es tambien la pieza que el portero por hash de Fase C (D7)
-- necesita para comparar contra el texto que llega de Drive.
-- La marca visible de "modificado desde el ultimo analisis" NO se enciende
-- hasta Fase D (el worker exhaustivo aun no puede rellenar esta columna).
-- ============================================================

ALTER TABLE public.documents
  ADD COLUMN analyzed_content_hash text;
