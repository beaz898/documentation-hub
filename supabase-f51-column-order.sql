-- F-51 (orden verdadero de columnas): YA EJECUTADO en el SQL Editor de Supabase
-- antes de este commit. Este fichero es el REGISTRO del DDL que se aplicó a
-- mano, no algo que este commit necesite ejecutar. Idempotente: re-ejecutarlo
-- no cambia nada.

-- El orden de las columnas de una tabla, tal como chunkSegments lo capturó
-- de la hoja original — antes de que `cells` (jsonb) o JavaScript pudieran
-- reordenar nada. NULLABLE: solo se escribe para chunk_type='table_summary'
-- (una fila no tiene columnas propias que ordenar) y solo desde este commit
-- en adelante — los chunks de generaciones anteriores quedan en NULL, que
-- lib/analysis/table-structure.ts trata como "sin dato, cae al respaldo",
-- nunca como "tabla sin columnas".
ALTER TABLE public.document_chunks
  ADD COLUMN IF NOT EXISTS column_order jsonb;
