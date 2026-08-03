-- C.4a-real (Diseno_C4_F1.txt sección 2): modelo de generación. Solo esquema, cero
-- comportamiento. Ejecutado en Supabase el 01/08/2026.

-- Generación activa de cada documento. La fila principal de documents describe
-- SIEMPRE la versión que sirve el chat. Default 1: todo lo existente es generación 1.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS active_generation integer NOT NULL DEFAULT 1;

-- Versión "en vuelo" (staged): la nueva generación que espera el swap. Nunca pisa la
-- fila principal de documents hasta el swap. Máximo un staged por documento (PK); si
-- llega otro cambio antes del swap, reemplaza al anterior (el más nuevo gana).
CREATE TABLE IF NOT EXISTS public.document_staged (
  document_id        uuid PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
  org_id             text NOT NULL,
  generation         integer NOT NULL,
  full_text          text NOT NULL,
  content_hash       text NOT NULL,
  chunk_count        integer NOT NULL,
  size_bytes         integer NOT NULL,
  source_modified_at timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- RLS permisiva, igual que document_tombstones: el aislamiento por org lo hace el
-- código de la API con .eq('org_id', orgId), no la policy.
ALTER TABLE public.document_staged ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can manage document staged" ON public.document_staged
  FOR ALL USING (true);
