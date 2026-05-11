-- ============================================================
-- Persistencia de análisis y consultas de chat
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Tabla: analysis_results ──────────────────────────────────

CREATE TABLE IF NOT EXISTS analysis_results (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                TEXT        NOT NULL,
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name         TEXT        NOT NULL,
  analysis_type         TEXT        NOT NULL CHECK (analysis_type IN ('quick', 'exhaustive', 'style')),
  contradictions_found  INTEGER     NOT NULL DEFAULT 0,
  contradictions_confirmed INTEGER  NOT NULL DEFAULT 0,
  duplicates_found      INTEGER     NOT NULL DEFAULT 0,
  overlaps_found        INTEGER     NOT NULL DEFAULT 0,
  style_problems_found  INTEGER     NOT NULL DEFAULT 0,
  recommendation        TEXT        CHECK (recommendation IN ('INDEXAR', 'REVISAR', 'NO_INDEXAR')),
  involved_documents    JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_org_id     ON analysis_results(org_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type       ON analysis_results(org_id, analysis_type);

ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org analysis_results"
  ON analysis_results FOR SELECT
  USING (
    org_id = (
      SELECT COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'org_id'),
        auth.uid()::text
      )
    )
  );

-- ── Tabla: chat_queries ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_queries (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         TEXT        NOT NULL,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question       TEXT        NOT NULL,
  documents_used JSONB,
  answer_length  INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_queries_org_id     ON chat_queries(org_id);
CREATE INDEX IF NOT EXISTS idx_chat_queries_created_at ON chat_queries(created_at DESC);

ALTER TABLE chat_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org chat_queries"
  ON chat_queries FOR SELECT
  USING (
    org_id = (
      SELECT COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'org_id'),
        auth.uid()::text
      )
    )
  );
