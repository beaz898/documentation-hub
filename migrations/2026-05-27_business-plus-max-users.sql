-- Migración: Business+ pasa de usuarios ilimitados (NULL) a máximo 25
-- Solo Enterprise queda con max_users = NULL (ilimitado)
UPDATE organizations
SET max_users = 25
WHERE plan = 'business_plus'
  AND max_users IS NULL;
