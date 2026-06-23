-- ============================================================================
-- supabase-setup.sql — Doclity
-- ----------------------------------------------------------------------------
-- Schema base reconstruido a partir del estado real de la base de datos
-- (tablas, funciones/RPCs, triggers, índices y políticas RLS).
--
-- Orden: organizations primero; después las tablas que la referencian.
-- Las claves primarias y los UNIQUE inline crean su índice automáticamente,
-- por eso NO se repiten como CREATE INDEX más abajo.
--
-- Las referencias a auth.users(...) asumen el schema 'auth' de Supabase.
-- ============================================================================

-- ============================================================================
-- EXTENSIONES
-- ============================================================================
-- gen_random_uuid() y gen_random_bytes() provienen de pgcrypto, habitualmente
-- ya disponible en Supabase. Se deja por si se recrea en un entorno limpio.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================================
-- FUNCIONES (deben existir antes de los triggers que las usan)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_agent_tasks_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.propagate_last_message_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  BEGIN
    UPDATE agent_conversations
    SET
      last_message_at = NEW.created_at,
      updated_at      = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
  END;
  $function$;

CREATE OR REPLACE FUNCTION public.consume_credits(p_org_id uuid, p_amount integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_remaining integer;
  v_extra integer;
  v_from_plan integer;
  v_from_extra integer;
BEGIN
  -- Bloquear la fila de la organizacion para evitar descuentos simultaneos
  SELECT credits_remaining, credits_extra
  INTO v_remaining, v_extra
  FROM organizations
  WHERE id = p_org_id
  FOR UPDATE;

  -- Si no existe la organizacion
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'org_not_found'
    );
  END IF;

  -- Calcular cuanto sacar de cada fuente
  IF v_remaining >= p_amount THEN
    -- Todo del plan mensual
    v_from_plan := p_amount;
    v_from_extra := 0;
  ELSIF v_remaining + v_extra >= p_amount THEN
    -- Parte del plan, parte de extras
    v_from_plan := v_remaining;
    v_from_extra := p_amount - v_remaining;
  ELSE
    -- No hay suficientes creditos
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'credits_remaining', v_remaining,
      'credits_extra', v_extra,
      'needed', p_amount
    );
  END IF;

  -- Aplicar el descuento
  UPDATE organizations
  SET
    credits_remaining = credits_remaining - v_from_plan,
    credits_extra = credits_extra - v_from_extra
  WHERE id = p_org_id;

  -- Devolver resultado
  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_remaining - v_from_plan,
    'credits_extra', v_extra - v_from_extra,
    'source', CASE
      WHEN v_from_extra = 0 THEN 'plan'
      WHEN v_from_plan = 0 THEN 'extra'
      ELSE 'mixed'
    END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.append_step_to_message(p_message_id uuid, p_step jsonb)
 RETURNS void
 LANGUAGE sql
AS $function$
  UPDATE agent_messages
  SET steps = steps || jsonb_build_array(p_step)
  WHERE id = p_message_id;
$function$;

CREATE OR REPLACE FUNCTION public.adjust_rate_limit_window(p_window timestamp with time zone, p_req_delta integer, p_input_delta integer, p_output_delta integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO llm_rate_limit_windows (window_start, requests, input_tokens, output_tokens)
  VALUES (
    p_window,
    GREATEST(0, p_req_delta),
    GREATEST(0, p_input_delta),
    GREATEST(0, p_output_delta)
  )
  ON CONFLICT (window_start) DO UPDATE
  SET
    requests      = GREATEST(0, llm_rate_limit_windows.requests      + p_req_delta),
    input_tokens  = GREATEST(0, llm_rate_limit_windows.input_tokens  + p_input_delta),
    output_tokens = GREATEST(0, llm_rate_limit_windows.output_tokens + p_output_delta);
END;
$function$;

CREATE OR REPLACE FUNCTION public.try_acquire_rate_limit(p_window timestamp with time zone, p_est_input integer, p_est_output integer, p_max_req integer, p_max_input integer, p_max_output integer)
 RETURNS TABLE(allowed boolean, cur_requests integer, cur_input integer, cur_output integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_req integer := 0;
  v_in  integer := 0;
  v_out integer := 0;
BEGIN
  -- Limpia ventanas antiguas (mantiene la tabla en máximo ~5 filas)
  DELETE FROM llm_rate_limit_windows
  WHERE window_start < now() - INTERVAL '5 minutes';

  -- Asegura que la fila existe antes de bloquearla
  INSERT INTO llm_rate_limit_windows (window_start)
  VALUES (p_window)
  ON CONFLICT (window_start) DO NOTHING;

  -- Bloqueo exclusivo de fila: serializa peticiones concurrentes
  SELECT requests, input_tokens, output_tokens
  INTO v_req, v_in, v_out
  FROM llm_rate_limit_windows
  WHERE window_start = p_window
  FOR UPDATE;

  -- Rechaza si algún límite quedaría superado
  IF (v_req + 1         > p_max_req)
  OR (v_in  + p_est_input  > p_max_input)
  OR (v_out + p_est_output > p_max_output)
  THEN
    RETURN QUERY SELECT false, v_req, v_in, v_out;
    RETURN;
  END IF;

  -- Reserva atómica
  UPDATE llm_rate_limit_windows
  SET
    requests      = requests      + 1,
    input_tokens  = input_tokens  + p_est_input,
    output_tokens = output_tokens + p_est_output
  WHERE window_start = p_window;

  RETURN QUERY SELECT true,
    v_req + 1,
    v_in  + p_est_input,
    v_out + p_est_output;
END;
$function$;


-- ============================================================================
-- TABLAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- organizations (raíz: no referencia a ninguna otra tabla public)
-- ----------------------------------------------------------------------------
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Mi workspace'::text,
  plan text NOT NULL DEFAULT 'free'::text,
  credits_remaining integer NOT NULL DEFAULT 100,
  credits_extra integer NOT NULL DEFAULT 0,
  billing_cycle_start timestamp with time zone DEFAULT now(),
  max_users integer DEFAULT 1,
  stripe_customer_id text,
  stripe_subscription_id text,
  canceled_at timestamp with time zone,
  grace_period_ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  purged_at timestamp with time zone,
  abandoned_at timestamp with time zone,
  upload_locked_by uuid,
  upload_locked_at timestamp with time zone,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);

-- ----------------------------------------------------------------------------
-- memberships (referencia organizations + auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'member'::text])),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT memberships_pkey PRIMARY KEY (id),
  CONSTRAINT memberships_org_id_user_id_key UNIQUE (org_id, user_id),
  CONSTRAINT memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- invitations (referencia organizations + auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  email text NOT NULL,
  invited_by uuid NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'::text),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_token_key UNIQUE (token),
  CONSTRAINT invitations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- documents (org_id es TEXT en esta tabla — sin FK a organizations)
-- ----------------------------------------------------------------------------
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  size_bytes bigint DEFAULT 0,
  chunk_count integer DEFAULT 0,
  org_id text NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'indexed'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source text DEFAULT 'manual'::text,
  source_path text,
  source_modified_at timestamp with time zone,
  folder_path text,
  folder_id text,
  content_hash text,
  full_text text,
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- drive_connections (referencia auth.users; org_id TEXT UNIQUE)
-- ----------------------------------------------------------------------------
CREATE TABLE public.drive_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'google_drive'::text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone,
  email text,
  folder_id text NOT NULL,
  folder_name text NOT NULL,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT drive_connections_pkey PRIMARY KEY (id),
  CONSTRAINT drive_connections_org_id_unique UNIQUE (org_id),
  CONSTRAINT drive_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- feedback (referencia auth.users; org_id TEXT)
-- ----------------------------------------------------------------------------
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id text,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- billing_events (referencia organizations)
-- ----------------------------------------------------------------------------
CREATE TABLE public.billing_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid,
  event_type text NOT NULL,
  stripe_event_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT billing_events_pkey PRIMARY KEY (id),
  CONSTRAINT billing_events_stripe_event_id_key UNIQUE (stripe_event_id),
  CONSTRAINT billing_events_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);

-- ----------------------------------------------------------------------------
-- credit_purchases (referencia organizations + auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.credit_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  credits integer NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  stripe_payment_id text,
  purchased_by uuid,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT credit_purchases_pkey PRIMARY KEY (id),
  CONSTRAINT credit_purchases_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT credit_purchases_purchased_by_fkey FOREIGN KEY (purchased_by) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- analysis_jobs (referencia organizations; conserva la doble FK redundante real)
-- ----------------------------------------------------------------------------
CREATE TABLE public.analysis_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  document_name text NOT NULL,
  document_text text NOT NULL,
  sample_texts jsonb NOT NULL DEFAULT '[]'::jsonb,
  exclude_document_id text,
  exclude_fingerprints jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb,
  error_message text,
  credits_consumed integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT analysis_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT analysis_jobs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT fk_org FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);

-- ----------------------------------------------------------------------------
-- analysis_results (referencia auth.users; org_id TEXT)
-- ----------------------------------------------------------------------------
CREATE TABLE public.analysis_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  user_id uuid NOT NULL,
  document_name text NOT NULL,
  analysis_type text NOT NULL CHECK (analysis_type = ANY (ARRAY['quick'::text, 'exhaustive'::text, 'style'::text])),
  contradictions_found integer NOT NULL DEFAULT 0,
  contradictions_confirmed integer NOT NULL DEFAULT 0,
  duplicates_found integer NOT NULL DEFAULT 0,
  overlaps_found integer NOT NULL DEFAULT 0,
  style_problems_found integer NOT NULL DEFAULT 0,
  recommendation text CHECK (recommendation = ANY (ARRAY['INDEXAR'::text, 'REVISAR'::text, 'NO_INDEXAR'::text])),
  involved_documents jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  minor_inconsistencies_found integer DEFAULT 0,
  CONSTRAINT analysis_results_pkey PRIMARY KEY (id),
  CONSTRAINT analysis_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- chat_queries (referencia auth.users; org_id TEXT)
-- ----------------------------------------------------------------------------
CREATE TABLE public.chat_queries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  user_id uuid NOT NULL,
  question text NOT NULL,
  documents_used jsonb,
  answer_length integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chat_queries_pkey PRIMARY KEY (id),
  CONSTRAINT chat_queries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- usage_logs (sin FK declarada; org_id TEXT)
-- ----------------------------------------------------------------------------
CREATE TABLE public.usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  org_id text NOT NULL,
  endpoint text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cache_creation_tokens integer NOT NULL DEFAULT 0,
  cache_read_tokens integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  user_query text,
  credits_consumed integer NOT NULL DEFAULT 0,
  CONSTRAINT usage_logs_pkey PRIMARY KEY (id)
);

-- ----------------------------------------------------------------------------
-- llm_rate_limit_windows (sin FK; PK por window_start)
-- ----------------------------------------------------------------------------
CREATE TABLE public.llm_rate_limit_windows (
  window_start timestamp with time zone NOT NULL,
  requests integer NOT NULL DEFAULT 0,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  CONSTRAINT llm_rate_limit_windows_pkey PRIMARY KEY (window_start)
);

-- ----------------------------------------------------------------------------
-- agent_tasks (LEGADO — referencia organizations + auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.agent_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  goal text NOT NULL,
  confirmation_mode text NOT NULL CHECK (confirmation_mode = ANY (ARRAY['step_by_step'::text, 'milestones'::text, 'autonomous'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'awaiting_user'::text, 'awaiting_confirmation'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb,
  pending_request jsonb,
  credits_estimated integer NOT NULL DEFAULT 0,
  credits_consumed integer NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT 'claude-sonnet-4-6'::text,
  total_tokens_input integer NOT NULL DEFAULT 0,
  total_tokens_output integer NOT NULL DEFAULT 0,
  step_count integer NOT NULL DEFAULT 0,
  error_message text,
  error_step_index integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agent_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT agent_tasks_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id),
  CONSTRAINT agent_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- ----------------------------------------------------------------------------
-- agent_conversations (referencia organizations)
-- ----------------------------------------------------------------------------
CREATE TABLE public.agent_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text,
  confirmation_mode text NOT NULL DEFAULT 'milestones'::text CHECK (confirmation_mode = ANY (ARRAY['step_by_step'::text, 'milestones'::text, 'autonomous'::text])),
  status text NOT NULL DEFAULT 'idle'::text CHECK (status = ANY (ARRAY['idle'::text, 'running'::text, 'awaiting_user'::text, 'awaiting_confirmation'::text])),
  pending_request jsonb,
  total_credits_used integer NOT NULL DEFAULT 0,
  total_tokens_input integer NOT NULL DEFAULT 0,
  total_tokens_output integer NOT NULL DEFAULT 0,
  turn_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone,
  CONSTRAINT agent_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT agent_conversations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id)
);

-- ----------------------------------------------------------------------------
-- agent_messages (referencia agent_conversations)
-- ----------------------------------------------------------------------------
CREATE TABLE public.agent_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL DEFAULT ''::text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['running'::text, 'awaiting_user'::text, 'awaiting_confirmation'::text, 'completed'::text, 'failed'::text])),
  error_message text,
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  credits_estimated integer NOT NULL DEFAULT 0,
  locked_at timestamp with time zone,
  CONSTRAINT agent_messages_pkey PRIMARY KEY (id),
  CONSTRAINT agent_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.agent_conversations(id)
);


-- ============================================================================
-- ÍNDICES (solo los explícitos; los *_pkey y *_key ya los crean las tablas)
-- ============================================================================

-- agent_conversations
CREATE INDEX idx_agent_conversations_org  ON public.agent_conversations USING btree (org_id);
CREATE INDEX idx_agent_conversations_user ON public.agent_conversations USING btree (user_id);

-- agent_messages
CREATE INDEX idx_agent_messages_conv    ON public.agent_messages USING btree (conversation_id);
CREATE INDEX idx_agent_messages_conv_ts ON public.agent_messages USING btree (conversation_id, created_at);

-- agent_tasks
CREATE INDEX agent_tasks_org_id_idx  ON public.agent_tasks USING btree (org_id, created_at DESC);
CREATE INDEX agent_tasks_user_id_idx ON public.agent_tasks USING btree (user_id, created_at DESC);
CREATE INDEX agent_tasks_status_idx  ON public.agent_tasks USING btree (status)
  WHERE (status = ANY (ARRAY['pending'::text, 'running'::text, 'awaiting_user'::text, 'awaiting_confirmation'::text]));

-- analysis_jobs
CREATE INDEX idx_analysis_jobs_org        ON public.analysis_jobs USING btree (org_id, created_at DESC);
CREATE INDEX idx_analysis_jobs_active_org ON public.analysis_jobs USING btree (org_id, status)
  WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]));
CREATE INDEX idx_analysis_jobs_pending    ON public.analysis_jobs USING btree (status, created_at)
  WHERE (status = 'pending'::text);

-- analysis_results
CREATE INDEX idx_analysis_results_created_at ON public.analysis_results USING btree (created_at DESC);
CREATE INDEX idx_analysis_results_org_id     ON public.analysis_results USING btree (org_id);
CREATE INDEX idx_analysis_results_type       ON public.analysis_results USING btree (org_id, analysis_type);

-- billing_events
CREATE INDEX idx_billing_events_org_id ON public.billing_events USING btree (org_id);
CREATE INDEX idx_billing_events_type   ON public.billing_events USING btree (event_type);

-- chat_queries
CREATE INDEX idx_chat_queries_created_at ON public.chat_queries USING btree (created_at DESC);
CREATE INDEX idx_chat_queries_org_id     ON public.chat_queries USING btree (org_id);

-- credit_purchases
CREATE INDEX idx_credit_purchases_org_id ON public.credit_purchases USING btree (org_id);

-- documents
CREATE INDEX idx_documents_content_hash ON public.documents USING btree (org_id, content_hash);
CREATE INDEX idx_documents_created_at   ON public.documents USING btree (created_at DESC);
CREATE INDEX idx_documents_folder_path  ON public.documents USING btree (folder_path);
CREATE INDEX idx_documents_org_id       ON public.documents USING btree (org_id);
CREATE INDEX idx_documents_user_id      ON public.documents USING btree (user_id);

-- drive_connections
CREATE INDEX idx_drive_connections_org ON public.drive_connections USING btree (org_id);

-- feedback
CREATE INDEX idx_feedback_created_at ON public.feedback USING btree (created_at DESC);

-- invitations
CREATE INDEX idx_invitations_email ON public.invitations USING btree (email);
CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);

-- memberships
CREATE INDEX idx_memberships_org_id  ON public.memberships USING btree (org_id);
CREATE INDEX idx_memberships_user_id ON public.memberships USING btree (user_id);

-- usage_logs
CREATE INDEX idx_usage_logs_org_date  ON public.usage_logs USING btree (org_id, created_at DESC);
CREATE INDEX idx_usage_logs_user_date ON public.usage_logs USING btree (user_id, created_at DESC);


-- ============================================================================
-- TRIGGERS (las funciones ya están definidas arriba)
-- ============================================================================

CREATE TRIGGER trg_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_agent_messages_propagate_ts
  AFTER INSERT ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION propagate_last_message_at();

CREATE TRIGGER trg_agent_messages_updated_at
  BEFORE UPDATE ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION update_agent_tasks_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_queries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_connections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs          ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Políticas — agent_conversations
-- ----------------------------------------------------------------------------
CREATE POLICY "agent_conversations: insert own" ON public.agent_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agent_conversations: select own" ON public.agent_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agent_conversations: update own" ON public.agent_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Políticas — agent_messages (acceso vía la conversación propietaria)
-- ----------------------------------------------------------------------------
CREATE POLICY "agent_messages: insert via conversation" ON public.agent_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM agent_conversations c
    WHERE c.id = agent_messages.conversation_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "agent_messages: select via conversation" ON public.agent_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM agent_conversations c
    WHERE c.id = agent_messages.conversation_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "agent_messages: update via conversation" ON public.agent_messages
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM agent_conversations c
    WHERE c.id = agent_messages.conversation_id AND c.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- Políticas — agent_tasks (LEGADO)
-- ----------------------------------------------------------------------------
CREATE POLICY "Usuarios actualizan sus tareas" ON public.agent_tasks
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuarios crean tareas en su org" ON public.agent_tasks
  FOR INSERT WITH CHECK (
    org_id IN (SELECT memberships.org_id FROM memberships WHERE memberships.user_id = auth.uid())
    AND user_id = auth.uid()
  );
CREATE POLICY "Usuarios ven solo sus propias tareas" ON public.agent_tasks
  FOR SELECT USING (
    user_id = auth.uid()
    AND org_id IN (SELECT memberships.org_id FROM memberships WHERE memberships.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Políticas — analysis_jobs
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can create jobs in their org" ON public.analysis_jobs
  FOR INSERT WITH CHECK (
    org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid())
  );
CREATE POLICY "Users can view their org jobs" ON public.analysis_jobs
  FOR SELECT USING (
    org_id IN (SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Políticas — analysis_results (org_id TEXT; vía JWT user_metadata)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view org analysis_results" ON public.analysis_results
  FOR SELECT USING (
    org_id = (SELECT COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'org_id'::text), (auth.uid())::text))
  );

-- ----------------------------------------------------------------------------
-- Políticas — billing_events
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own org billing events" ON public.billing_events
  FOR SELECT USING (
    org_id IN (SELECT memberships.org_id FROM memberships WHERE memberships.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Políticas — chat_queries (org_id TEXT; vía JWT user_metadata)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view org chat_queries" ON public.chat_queries
  FOR SELECT USING (
    org_id = (SELECT COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'org_id'::text), (auth.uid())::text))
  );

-- ----------------------------------------------------------------------------
-- Políticas — credit_purchases
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own org credit purchases" ON public.credit_purchases
  FOR SELECT USING (
    org_id IN (SELECT memberships.org_id FROM memberships WHERE memberships.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Políticas — documents (org_id TEXT; vía JWT user_metadata)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can delete org documents" ON public.documents
  FOR DELETE USING (
    org_id = (SELECT COALESCE(
      ((auth.jwt() -> 'user_metadata'::text) ->> 'org_id'::text),
      (auth.uid())::text
    ))
  );
CREATE POLICY "Users can insert org documents" ON public.documents
  FOR INSERT WITH CHECK (
    org_id = (SELECT COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'org_id'::text), (auth.uid())::text))
  );
CREATE POLICY "Users can view org documents" ON public.documents
  FOR SELECT USING (
    org_id = (SELECT COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'org_id'::text), (auth.uid())::text))
  );

-- ----------------------------------------------------------------------------
-- Políticas — drive_connections (gestionada por service role)
-- ----------------------------------------------------------------------------
CREATE POLICY "Service can manage drive connections" ON public.drive_connections
  FOR ALL USING (true);

-- ----------------------------------------------------------------------------
-- Políticas — invitations
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own org invitations" ON public.invitations
  FOR SELECT USING (
    org_id IN (SELECT memberships.org_id FROM memberships WHERE memberships.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Políticas — memberships
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own org memberships" ON public.memberships
  FOR SELECT USING (
    org_id IN (SELECT m2.org_id FROM memberships m2 WHERE m2.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Políticas — organizations
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own org" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT memberships.org_id FROM memberships WHERE memberships.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Políticas — usage_logs
-- ----------------------------------------------------------------------------
CREATE POLICY "Service role can insert usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FIN
-- ============================================================================
