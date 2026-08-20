-- F-20 pasos 1 y 2 (claude/Consulta_Fable_F20_Replanteamiento.md): extracción
-- estructurada y persistencia de los segmentos. YA EJECUTADO en el SQL Editor de
-- Supabase durante la sesión 44 (agosto 2026). Este fichero es el REGISTRO del
-- DDL que se aplicó a mano; se escribe a posteriori a partir del esquema real
-- consultado en Supabase, no de memoria. Es idempotente: re-ejecutarlo no cambia
-- nada.

-- ── Paso 1 ────────────────────────────────────────────────────────────────────
-- Versión del extractor con la que se leyó cada documento. NULLABLE y SIN
-- DEFAULT a propósito: los documentos indexados antes de F-20 quedan en NULL, que
-- significa "leído con un extractor anterior, desactualizado". Un default habría
-- mentido diciendo que ya estaban al día.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS extractor_version integer;

-- ── Paso 2 ────────────────────────────────────────────────────────────────────
-- Los trozos (chunks) de cada documento, con su estructura conservada. Estado
-- DERIVADO: nunca es la fuente de la que se decide nada, solo el resultado de
-- haber procesado una generación. Por eso el swap no la coordina atómicamente —
-- los chunks viejos se borran en la misma pata donde se borran los vectores
-- viejos (lib/document-swap.ts, P3).
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- CASCADE: borrar el documento se lleva sus chunks. Verificado con datos
  -- reales (subir y borrar OPE-02 deja la tabla vacía).
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  org_id      text NOT NULL,
  -- Generación del documento a la que pertenece este chunk (modelo C.4).
  generation  integer NOT NULL,
  chunk_index integer NOT NULL,
  -- Los tres tipos que emite extractSegments. El CHECK impide que un cambio
  -- futuro del extractor introduzca un tipo nuevo sin pasar por aquí.
  chunk_type  text NOT NULL CHECK (chunk_type IN ('text', 'table_summary', 'table_row')),
  text        text NOT NULL,
  -- Localizadores de tabla: NULL para chunk_type='text', con valor real para
  -- table_summary y table_row. `cells` es el mapa columna->valor de una fila:
  -- es LA razón de ser de esta tabla (F-19: "para tabla la unidad de verdad es
  -- (fila identificada, columna, valor)").
  sheet_name  text,
  table_id    text,
  row_index   integer,
  cells       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Una sola fila por posición dentro de una generación. Permite el
  -- borra-y-reinserta de las ramas del sync que reutilizan (document_id,
  -- generation) sin dejar chunks zombis.
  CONSTRAINT document_chunks_unique_position UNIQUE (document_id, generation, chunk_index)
);

-- RLS permisiva, igual que document_staged y document_tombstones: el aislamiento
-- por organización lo hace el código de la API con .eq('org_id', orgId), no la
-- policy.
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can manage document chunks" ON public.document_chunks
  FOR ALL USING (true);
