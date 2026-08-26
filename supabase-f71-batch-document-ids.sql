-- F-71 paso 2 — batch_document_ids en analysis_jobs.
--
-- MOTIVO: el análisis RÁPIDO lanzado desde la bandeja recibe `batchDocumentIds`
-- y así compara contra los otros documentos marcados aunque estén en
-- 'pendiente' (buildCorpusFilter los añade al corpus consultado). El
-- EXHAUSTIVO no lo recibe: la columna no existía, así que el endpoint no podía
-- escribirla ni el worker leerla, y los dos modos veían conjuntos distintos.
-- No había razón de arquitectura: es el hueco que F-24 P1(b) cerró para el
-- rápido y nadie extendió al worker.
--
-- FORMA: jsonb con default '[]', igual que exclude_fingerprints
-- (supabase-setup.sql:377) y sample_texts (:375) — el caso más parecido, una
-- lista serializada que el worker parsea con JSON.parse. Se sigue esa forma en
-- vez de text[] para no introducir un tercer estilo de lista en la misma tabla.
--
-- NOT NULL DEFAULT '[]': los jobs anteriores a esta migración quedan con lista
-- vacía, que es exactamente el comportamiento de hoy — `buildCorpusFilter([])`
-- devuelve CORPUS_ACTIVO sin ampliar. Ningún job viejo cambia de conducta.
--
-- EJECUTAR ANTES DEL PUSH.

ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS batch_document_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
