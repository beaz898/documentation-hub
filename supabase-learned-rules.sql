-- ============================================================
-- Fase A · Paso 1 — Tabla learned_rules (aprendizaje Tipo 1)
-- YA EJECUTADO en el SQL Editor de Supabase. Este archivo es
-- solo registro/documentación en el repo; no cambia la BD.
-- ============================================================

CREATE TABLE public.learned_rules (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id      text NOT NULL,                     -- TEXT, igual que documents/analysis_results
  kind        text NOT NULL DEFAULT 'convencion'
              CHECK (kind IN ('convencion', 'hecho_dominio')),
  rule_text   text NOT NULL,
  source      text NOT NULL DEFAULT 'manual'
              CHECK (source IN ('manual', 'destilada')),
  status      text NOT NULL DEFAULT 'pendiente'
              CHECK (status IN ('pendiente', 'activa', 'archivada')),
  created_by  uuid,
  approved_by uuid,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT learned_rules_pkey PRIMARY KEY (id),
  CONSTRAINT learned_rules_created_by_fkey  FOREIGN KEY (created_by)  REFERENCES auth.users(id),
  CONSTRAINT learned_rules_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);

CREATE INDEX learned_rules_org_status_idx
  ON public.learned_rules (org_id, status);

ALTER TABLE public.learned_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learned_rules_select_own_org"
  ON public.learned_rules
  FOR SELECT
  USING (
    org_id IN (
      SELECT m.org_id::text
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
    )
  );

-- Escrituras (INSERT/UPDATE/DELETE) van por endpoint con service role
-- + comprobación de admin. No se abren políticas de escritura a anon.
