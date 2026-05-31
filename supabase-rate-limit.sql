-- ============================================================
-- Rate limiting centralizado para la API de Anthropic
-- Ejecutar en Supabase SQL Editor ANTES del deploy.
-- ============================================================

-- Una fila por ventana de 1 minuto. Sin RLS (solo service role).
CREATE TABLE IF NOT EXISTS llm_rate_limit_windows (
  window_start  timestamptz  PRIMARY KEY,
  requests      integer      NOT NULL DEFAULT 0,
  input_tokens  integer      NOT NULL DEFAULT 0,
  output_tokens integer      NOT NULL DEFAULT 0
);

-- ─── RPC 1: Reserva bloqueante (análisis y agente) ────────────────────────────
-- Serializa mediante FOR UPDATE, comprueba límites, y reserva si hay capacidad.
-- Devuelve allowed=true + totales nuevos, o allowed=false + totales actuales.
CREATE OR REPLACE FUNCTION try_acquire_rate_limit(
  p_window      timestamptz,
  p_est_input   integer,
  p_est_output  integer,
  p_max_req     integer,
  p_max_input   integer,
  p_max_output  integer
)
RETURNS TABLE (
  allowed      boolean,
  cur_requests integer,
  cur_input    integer,
  cur_output   integer
)
LANGUAGE plpgsql
AS $$
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
$$;

-- ─── RPC 2: Ajuste post-llamada (ambos modos) ─────────────────────────────────
-- blocking-adjust: p_req_delta=0, deltas firmados (actual − estimado)
-- record-only RAG: p_req_delta=1, deltas = uso real positivo (upsert)
CREATE OR REPLACE FUNCTION adjust_rate_limit_window(
  p_window       timestamptz,
  p_req_delta    integer,
  p_input_delta  integer,
  p_output_delta integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
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
$$;
