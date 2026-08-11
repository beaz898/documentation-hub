-- ============================================================
-- Fase C · C.4d-2b (Commit 8) — semaforo de concurrencia de analisis
-- YA EJECUTADO en el SQL Editor de Supabase (11/08/2026).
-- Este archivo es solo registro en el repo.
--
-- Veto global interino (F-13 / F-14): un solo analisis activo por organizacion.
-- LA COLA DE FASE D LO SUSTITUYE por serializacion con dedup por documento; estas
-- columnas se retiran entonces.
--
-- Vive en organizations, junto al candado B.64 (upload_locked_*), pero es un
-- candado DISTINTO: B.64 serializa sesiones humanas de subida; este serializa
-- analisis (maquinas). Dos propositos, dos pares de columnas, mismo patron.
--
--   analysis_running_by    uuid         quien lanzo el analisis en curso.
--   analysis_running_since timestamptz  cuando empezo (para el 409 y la auto-expiracion).
--   analysis_running_type  text         'quick' | 'exhaustive' (umbral de auto-expiracion
--                                        por tipo: quick ~5 min, exhaustive 20 min; y el
--                                        mensaje del 409 lo necesita).
--
-- Garantia de liberacion: la AUTO-EXPIRACION por timestamp (el finally del endpoint
-- es solo cortesia de latencia; en serverless puede no ejecutarse). Nullable, sin FK
-- (mismo criterio que upload_locked_by).
-- ============================================================
alter table public.organizations
  add column analysis_running_by uuid,
  add column analysis_running_since timestamptz,
  add column analysis_running_type text;
