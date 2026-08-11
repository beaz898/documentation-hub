-- ============================================================
-- Fase C · C.4d-2b (Commit 6a) — puntero del staged a su analisis
-- YA EJECUTADO en el SQL Editor de Supabase (11/08/2026).
-- Este archivo es solo registro en el repo.
--
-- Diseño F-12: cuando el portero (F-4-rev) FRENA una version staged por hallazgos
-- de corpus, analyze-v2 guarda AQUI el id del analisis que la freno. Asi la bandeja
-- muestra los contadores de ESE analisis exacto (no "el ultimo por fecha", que un
-- job tardio podria falsear). Por construccion, la explicacion del freno es el
-- analisis que freno.
--
-- Reglas del puntero (las implementa el codigo, no el SQL):
--   · Se escribe al FRENAR (si el analisis sale limpio -> swap -> el staged muere ->
--     el puntero es irrelevante).
--   · Se RESETEA a null cuando el sync reemplaza el staged (F-5: misma generacion,
--     contenido nuevo -> el analisis viejo ya no lo describe).
--   · Se actualiza en cada reanalisis del staged (ronda de descartes, F-4-rev).
--
-- ON DELETE SET NULL: si se borrara el analisis apuntado, el puntero vuelve a null
-- (la entrada de bandeja pasa a "pendiente de analisis") — NUNCA arrastra el staged.
-- ============================================================
alter table public.document_staged
  add column analysis_result_id uuid
    references public.analysis_results(id) on delete set null;
