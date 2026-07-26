-- ============================================================
-- Fase C · C.1b — indice unico de identidad de origen
-- YA EJECUTADO en el SQL Editor de Supabase.
-- Este archivo es solo registro en el repo.
--
-- Garantiza a nivel de BD que no puedan existir dos documentos con
-- la misma identidad de origen (org_id, source, provider_file_id).
-- PARCIAL (WHERE provider_file_id IS NOT NULL): solo aplica a
-- documentos sincronizados (Drive/OneDrive), cuya identidad es el
-- id nativo del proveedor. Los manuales tienen provider_file_id null
-- y su identidad es (source, name), otro regimen — quedan fuera.
--
-- Red de seguridad para la Fase C: C.3 borra vectores por identidad;
-- sin este indice, dos filas con la misma identidad harian que el
-- reemplazo tocara el documento equivocado en silencio. Con el, ese
-- escenario es un error ruidoso en el momento de escribir.
-- ============================================================

CREATE UNIQUE INDEX documents_identity_unique
ON public.documents (org_id, source, provider_file_id)
WHERE provider_file_id IS NOT NULL;
