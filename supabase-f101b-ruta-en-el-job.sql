-- ============================================================
-- F-101 paso 2b — LA RUTA DEL FICHERO EN LA FILA DEL TRABAJO
--
-- ESTADO: EJECUTADO por el usuario en Supabase el 03/09/2026, antes del push.
-- ============================================================
--
-- POR QUÉ HACE FALTA UN SEGUNDO SQL, Y LA OMISIÓN FUE MÍA: el primero dio a
-- `analysis_results` su propietario primario, pero el análisis EXHAUSTIVO no lo
-- escribe la ruta web — lo escribe el worker, en otro proceso, leyendo la fila
-- del job. Y esa fila no guarda la ruta del fichero: tiene el NOMBRE y el TEXTO,
-- pero no de dónde salió.
--
-- Sin esta columna, el exhaustivo lanzado desde el chat no puede darle
-- propietario a su análisis, así que el CHECK del paso 1 lo rechaza y el
-- resultado —el más caro del sistema, 30 créditos— se queda solo en la fila del
-- job. Es exactamente el problema que F-101 vino a cerrar, sobreviviendo en el
-- único camino que no pasa por la ruta web.
--
-- ⚠️ NO SE AÑADE RESTRICCIÓN AQUÍ, y es deliberado: un job de la BANDEJA no tiene
-- fichero en almacenamiento —su documento ya existe— así que exigir la ruta
-- siempre sería falso. Quien garantiza que el análisis acabe con dueño es el
-- CHECK de `analysis_results`, que ya está puesto y ya protege. Esta columna solo
-- le da al worker de dónde sacarlo.
-- ============================================================

ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS storage_path text;

-- ============================================================
-- LO QUE **NO** HACE
-- · NO toca ninguna fila existente: los dieciséis jobs sin ruta siguen igual, y
--   su recuperación se decide aparte, con la consulta de atribución delante.
-- · NO añade restricción: ver arriba.
-- ============================================================
