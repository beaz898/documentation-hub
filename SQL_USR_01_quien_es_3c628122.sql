-- ============================================================================
-- ⛔ CANCELADA EL 26/10/2026, SIN EJECUTAR. Lo cerró el director: 3c628122 es un usuario de prueba que creó él para
-- comprobar que funcionaban las invitaciones a la organización.
-- ============================================================================
-- ¿QUIÉN ES 3c628122? — SÓLO LECTURA (26/10/2026)
-- ⏳ PENDIENTE DE EJECUTAR. Sólo SELECT: no escribe, no borra, no cambia nada.
--
-- POR QUÉ (arquitecto, 26/10): ese usuario NO es el director (el director es a9625e93, por SQL_ORG_01). Hizo una
-- llamada al modelo en el piloto el 08/07 (llm_usage) y pulsó «Estado del despliegue» en producción el 11/09
-- (claude/Material_Censo_Tecnico.md:509). Una sesión de administrador en producción no se queda sin nombre.
--
-- QUÉ SALE: UNA fila, siempre. El correo, la fecha de alta y la última sesión (last_sign_in_at, la columna de
-- Supabase Auth). Si el usuario no existe en auth.users, la fila lo dice y no sale vacía.
-- ============================================================================
WITH u AS (SELECT '3c628122-e668-4ca6-a5eb-8f751ba52a41'::uuid AS id)   -- ← EL USUARIO QUE SE BUSCA
SELECT u.id::text AS usuario,
       coalesce(au.email, 'NO EXISTE en auth.users') AS correo,
       to_char(au.created_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS alta,
       to_char(au.last_sign_in_at AT TIME ZONE 'Europe/Madrid', 'DD/MM/YYYY HH24:MI') AS ultima_sesion
FROM u LEFT JOIN auth.users au ON au.id = u.id;
