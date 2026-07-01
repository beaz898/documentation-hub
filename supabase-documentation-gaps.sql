-- documentation_gaps: preguntas del chat RAG sin respuesta en el corpus
-- Se registra cuando el sistema devuelve sources:[] (no encontró contexto).
-- Todos los accesos vienen del service role (createServiceClient).
--
-- Ejecutar en Supabase SQL Editor antes del deploy del endpoint.

CREATE TABLE public.documentation_gaps (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  org_id       text        NOT NULL,
  user_id      uuid,
  question     text        NOT NULL,
  answer       text,
  note         text,
  status       text        NOT NULL DEFAULT 'pending',
  created_at   timestamptz          DEFAULT now(),
  resolved_at  timestamptz,
  CONSTRAINT documentation_gaps_pkey        PRIMARY KEY (id),
  CONSTRAINT documentation_gaps_user_fkey   FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT documentation_gaps_status_check
    CHECK (status IN ('pending', 'documented', 'dismissed'))
);

CREATE INDEX idx_documentation_gaps_org_status
  ON public.documentation_gaps (org_id, status);

CREATE INDEX idx_documentation_gaps_created_at
  ON public.documentation_gaps USING btree (created_at DESC);

-- RLS activado; el service_role lo bypasea automáticamente.
-- La política explícita de service_role deja claro que este es el único acceso previsto.
ALTER TABLE public.documentation_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service puede gestionar documentation_gaps"
  ON public.documentation_gaps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
