-- ============================================================================
-- document_tombstones — Lápidas de exclusión (Fase C, paso C.2)
-- ============================================================================
-- Bloquea la reimportación automática por el sync de un archivo sincronizado
-- que el usuario excluyó deliberadamente del corpus. El sync consulta esta
-- tabla antes de importar; si hay lápida para (org_id, source, provider_file_id),
-- salta el archivo y lo cuenta como "saltado por exclusión" en los stats.
--
-- Solo para documentos SINCRONIZADOS (los manuales no tienen importador
-- automático; su guardián es el flujo "¿versión nueva? → reemplazar" de D5).
--
-- REGISTRO: ejecutado en Supabase primero; este archivo es documentación.
-- org_id es TEXT (no uuid) para casar con documents.org_id y drive_connections.org_id.
-- Acceso real siempre vía service role (salta RLS); el filtrado por org lo hace
-- el código de la API con .eq('org_id', orgId). RLS es defensa en profundidad,
-- calcada de drive_connections.
-- ============================================================================

CREATE TABLE public.document_tombstones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL,
  source text NOT NULL,
  provider_file_id text NOT NULL,
  original_name text,
  excluded_by uuid REFERENCES auth.users(id),
  excluded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_tombstones_identity_unique UNIQUE (org_id, source, provider_file_id)
);

CREATE INDEX document_tombstones_lookup
  ON public.document_tombstones (org_id, source, provider_file_id);

ALTER TABLE public.document_tombstones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage document tombstones" ON public.document_tombstones
  FOR ALL USING (true);
