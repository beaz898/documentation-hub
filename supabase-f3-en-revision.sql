-- ============================================================
-- Frente 3, paso 1 — estado `en_revision` en documents.analysis_status
--
-- ESTADO: EJECUTADO por el usuario en Supabase el 02/09/2026, antes del push.
-- ============================================================
--
-- MOTIVO: la fila del documento pasa a nacer AL SUBIRLO, antes de analizar y
-- antes de indexar. Ese estado intermedio —existe la fila, NO existen los
-- vectores— no tenía ningún valor que lo representara.
--
-- POR QUÉ NO VALE 'pendiente', que es el vecino obvio: 'pendiente' significa YA
-- INDEXADO Y ESPERANDO VALIDACIÓN. Es lo que escribe la sincronización de
-- Drive, y esos documentos tienen sus vectores — medido el 02/09: veintisiete
-- documentos en 'pendiente', todos con vectores, todos coincidentes con su
-- metadata. Reutilizar ese valor juntaría dos situaciones que se distinguen
-- justo por lo que importa: si hay algo en el índice o no.
--
-- POR QUÉ ESTE ESTADO NO VIAJA A PINECONE: porque un documento en revisión no
-- tiene vectores. Su exclusión del corpus no depende de que un filtro esté bien
-- escrito, sino de que NO HAYA NADA QUE FILTRAR (F-96, regla 1). El filtro
-- `analysisStatus = 'analizado'` no se toca.
--
-- NO HAY BACKFILL: ninguna fila existente debe llevar este valor. El parque
-- está en 'analizado' (backfill del 09/07) o en 'pendiente' (Drive), y las 28
-- filas medidas el 02/09 lo confirman.
--
-- NO SE TOCA EL DEFAULT: sigue en 'pendiente'. Los tres INSERT de la aplicación
-- escriben el valor explícitamente, así que el DEFAULT no se ejerce; moverlo
-- sería tocar una pieza muerta y arriesgar por nada.
--
-- SE CONSERVAN 'en_analisis' Y 'desactualizado' aunque no los escriba nadie
-- desde julio. Retirarlos es otra decisión y no se mezcla con ésta.
--
-- EL DROP VA SIN `IF EXISTS` a propósito: el nombre de la restricción se
-- comprobó antes (`pg_constraint`), y si no existiera se quiere que falle en
-- vez de seguir adelante en silencio.
--
-- SOLO AMPLÍA EL CONJUNTO ADMITIDO. No toca datos, ni índices, ni el DEFAULT.

ALTER TABLE public.documents
  DROP CONSTRAINT documents_analysis_status_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_analysis_status_check
  CHECK (analysis_status IN (
    'en_revision',      -- NUEVO: la fila existe, el documento aún no ha entrado
    'pendiente',        -- indexado, esperando validación (Drive)
    'en_analisis',
    'analizado',
    'desactualizado'
  ));
