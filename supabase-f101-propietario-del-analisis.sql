-- ============================================================
-- F-101 paso 1 — EL PROPIETARIO PRIMARIO DEL ANÁLISIS
--
-- ESTADO: EJECUTADO por el usuario en Supabase el 03/09/2026, antes del push.
--
-- ⚠️ INCOMPLETO, Y SE DICE AQUÍ: este SQL cubre `analysis_results` y NO la fila
--    del job. El worker del exhaustivo escribe su propio análisis y no tiene de
--    dónde sacar la ruta, así que el camino exhaustivo del chat sigue sin poder
--    persistir hasta que se ejecute
--    `supabase-f101b-ruta-en-el-job.sql`. La omisión fue mía al escribirlo.
-- ============================================================
--
-- MOTIVO. Un análisis del chat existe desde que ocurre y se cobra, pero hasta
-- hoy nacía sin dueño: `document_id` a null porque el documento aún no existe.
-- El dueño estaba a la vista desde el primer segundo — EL FICHERO SUBIDO, que es
-- durable, tiene ruta única y existe antes que nadie.
--
-- LOS DOS PROPIETARIOS, y no son alternativas sino etapas:
--   · `storage_path`  — PROPIETARIO PRIMARIO. Quién es el dueño MIENTRAS se
--     revisa. Se escribe al analizar y no se borra al adoptar: es la historia de
--     ese fichero, y lo que permite reabrir la revisión al día siguiente.
--   · `document_id`   — PROPIETARIO ADOPTIVO. Nulo durante la revisión; se
--     rellena cuando el documento nace y adopta su análisis.
--
-- ⚠️ LA RESTRICCIÓN ES LA PIEZA IMPORTANTE, Y NO ES DECORATIVA: exige que AL
-- MENOS UNO de los dos esté presente. Eso convierte «análisis huérfano» de algo
-- que hay que vigilar con un contador a algo que LA BASE NO DEJA ESCRIBIR. Es el
-- centinela de F-99 ascendido a imposibilidad estructural, y es preferible por la
-- misma razón de siempre: un contador avisa después, una restricción impide.
--
-- ⚠️ POR QUÉ `NOT VALID` Y UN SEGUNDO PASO: hoy existen filas huérfanas —los
-- dieciséis exhaustivos y lo que quede del parque—, y una restricción validada de
-- golpe fallaría contra ellas. `NOT VALID` obliga a que TODA FILA NUEVA la
-- cumpla, sin tocar las viejas. La validación se hace después, cuando el
-- retroactivo las haya atado o se hayan declarado perdidas — y entonces será una
-- línea. Cerrar la fuga hacia adelante no espera a limpiar lo de atrás.
-- ============================================================

-- 1) El propietario primario.
ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS storage_path text;

-- 2) Buscar los análisis de un fichero en revisión es la consulta que hará la
--    reapertura del modal, y va por aquí.
CREATE INDEX IF NOT EXISTS analysis_results_storage_path_idx
  ON public.analysis_results (org_id, storage_path)
  WHERE storage_path IS NOT NULL;

-- 3) LA IMPOSIBILIDAD ESTRUCTURAL. NOT VALID: obliga a las nuevas, respeta las
--    viejas. No se valida hasta que el retroactivo de F-101 paso 6 termine.
ALTER TABLE public.analysis_results
  ADD CONSTRAINT analysis_results_tiene_propietario
  CHECK (storage_path IS NOT NULL OR document_id IS NOT NULL)
  NOT VALID;

-- ============================================================
-- LO QUE **NO** HACE ESTE SQL, Y ES DELIBERADO
--
-- · NO borra ni toca ninguna fila existente. Los dieciséis exhaustivos sin dueño
--   siguen donde están, intactos, hasta que se decida qué se hace con ellos.
-- · NO valida la restricción. Ver arriba.
-- · NO añade clave foránea sobre `storage_path`: los ficheros de Storage no son
--   una tabla. La integridad de esa punta se sostiene en la aplicación —el
--   descarte borra análisis primero y fichero después—, y eso queda escrito
--   donde se implemente, no aquí.
-- ============================================================
