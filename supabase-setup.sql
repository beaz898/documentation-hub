-- ============================================
-- DOCUMENTATION HUB - Setup de base de datos
-- ============================================
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  org_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'indexed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Row Level Security (RLS)
-- Solo usuarios de la misma organización pueden ver/modificar documentos
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Política: los usuarios pueden ver documentos de su organización
CREATE POLICY "Users can view org documents"
  ON documents FOR SELECT
  USING (
    org_id = (
      SELECT COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'org_id'),
        auth.uid()::text
      )
    )
  );

-- Política: los usuarios pueden insertar documentos en su organización
CREATE POLICY "Users can insert org documents"
  ON documents FOR INSERT
  WITH CHECK (
    org_id = (
      SELECT COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'org_id'),
        auth.uid()::text
      )
    )
  );

-- Política: los usuarios pueden eliminar documentos de su organización
CREATE POLICY "Users can delete org documents"
  ON documents FOR DELETE
  USING (
    org_id = (
      SELECT COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'org_id'),
        auth.uid()::text
      )
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
