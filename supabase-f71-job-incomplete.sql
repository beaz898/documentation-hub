-- F-71 — estado 'completed_with_errors' en analysis_jobs.
--
-- MOTIVO: cuando alguna etapa del pipeline cae a su fallback por fallo del LLM,
-- el job NO puede quedar 'completed' — el análisis se entregaría como bueno.
-- Y tampoco puede quedar 'failed': el job SÍ produjo un resultado utilizable, y
-- con 'failed' el endpoint de polling devuelve result:null y el frontend lo
-- trata como error, tirando un análisis parcial que el cliente ya tiene delante.
--
-- EJECUTAR ANTES DEL PUSH. Sin esta migración, el UPDATE del worker
-- (status: 'completed_with_errors') viola el CHECK y el job se queda colgado en
-- 'processing' hasta que lo barra el umbral de jobs zombis.
--
-- No toca datos: solo amplía el conjunto de valores admitidos.

ALTER TABLE public.analysis_jobs
  DROP CONSTRAINT IF EXISTS analysis_jobs_status_check;

ALTER TABLE public.analysis_jobs
  ADD CONSTRAINT analysis_jobs_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'processing'::text,
    'completed'::text,
    'completed_with_errors'::text,
    'failed'::text
  ]));
