-- ============================================================================
-- supabase-llm-usage.sql — Tabla de observabilidad de tokens y coste LLM
-- ----------------------------------------------------------------------------
-- Ejecutar en el editor SQL de Supabase DESPUÉS de supabase-setup.sql.
-- Una fila por (operación, modelo) por llamada a la API.
-- Permite cruzar créditos cobrados (ingreso) vs coste real USD (gasto).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.llm_usage (
  id                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  created_at         timestamp with time zone NOT NULL DEFAULT now(),
  org_id             text                     NOT NULL,
  user_id            uuid                     REFERENCES auth.users(id),

  -- Qué operación generó este consumo
  operation          text                     NOT NULL,
  -- CONSTRAINT: solo valores conocidos
  CONSTRAINT llm_usage_operation_check CHECK (
    operation IN ('chat', 'analyze_quick', 'analyze_exhaustive', 'analyze_style', 'improve', 'agent')
  ),

  -- Modelo exacto (p. ej. 'claude-haiku-4-5-20251001')
  model              text                     NOT NULL,

  -- Contadores de tokens (fuente de verdad para recalcular coste si cambian precios)
  input_tokens       integer                  NOT NULL DEFAULT 0,
  output_tokens      integer                  NOT NULL DEFAULT 0,
  cache_write_tokens integer                  NOT NULL DEFAULT 0,
  cache_read_tokens  integer                  NOT NULL DEFAULT 0,

  -- Coste calculado en el momento de la inserción (snapshot de llm-pricing.ts)
  cost_usd           numeric(12, 8)           NOT NULL DEFAULT 0,

  -- Créditos cobrados al usuario por esta operación (null si no aplica)
  credits_charged    integer,

  CONSTRAINT llm_usage_pkey PRIMARY KEY (id)
);

-- Índice principal para consultas por org y fecha
CREATE INDEX IF NOT EXISTS idx_llm_usage_org_date
  ON public.llm_usage USING btree (org_id, created_at DESC);

-- Índice auxiliar para filtrar por operación
CREATE INDEX IF NOT EXISTS idx_llm_usage_org_operation
  ON public.llm_usage USING btree (org_id, operation, created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;

-- Solo el service role puede insertar (todas las escrituras son server-side)
CREATE POLICY "llm_usage: service role insert"
  ON public.llm_usage
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Solo admins de la org pueden leer (datos de coste, información sensible)
CREATE POLICY "llm_usage: admin read"
  ON public.llm_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.org_id::text = llm_usage.org_id
        AND m.user_id      = auth.uid()
        AND m.role         = 'admin'
    )
  );
