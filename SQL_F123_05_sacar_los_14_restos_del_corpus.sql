-- ============================================================================
-- F-123 · FASE 0.1, SEGUNDO TIEMPO: SACAR LOS 14 RESTOS DEL CORPUS SIN BORRAR
-- NADA — ⚠️ ESCRIBE (pasos B y D). Cambia `documents.analysis_status` de
-- 'analizado' a 'pendiente' en 14 filas. No borra, no reindexa, no toca trozos,
-- vectores ni análisis.
-- ✅ EJECUTADA por el director el 11/10/2026, PASO A PASO (ver abajo): los 14 restos quedaron fuera del corpus (claude/Estado_Del_MVP.md, fase 0.1). Cabecera corregida el 14/10/2026: hasta entonces seguía diciendo PENDIENTE.
-- ✅ PROBADO ANTES DE ENTREGARLO (10/10/2026) contra filas sintéticas en un
-- Postgres local (PGlite): con la población de SQL_F123_01 el paso B cambia 14
-- filas y deja el corpus en los 6 con trozos; si uno de los 14 ya no está en
-- 'analizado' el paso B se para con FALLA y NO CAMBIA NADA (vuelta atrás
-- completa); y el paso D lo deshace dejando el corpus otra vez en 20.
-- CON DATOS REALES NO SE HA EJECUTADO.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ LA ORGANIZACIÓN DEL PILOTO: a9625e93-af2a-4416-a465-5c2fa2a25bdf.        │
-- │ Va escrita en cada paso: el paso B y el D son bloques DO, que no         │
-- │ comparten un WITH con los SELECT. Las cuatro apariciones son la misma.   │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- LOS 14 IDS ESTÁN ESCRITOS UNO A UNO, copiados de la salida de SQL_F123_01
-- (claude/Salidas_SQL_F123_2026-10-10.md, marca «resto»). No hay predicado que
-- los deduzca: si la lista se equivoca, el peor caso es que falte uno, y el
-- control lo dice.
--
-- ⚠️ CÓMO SE EJECUTA, Y POR QUÉ ASÍ: el editor SQL de Supabase sólo enseña el
-- resultado de la ÚLTIMA sentencia. Por eso cada paso se pega y se ejecuta
-- SOLO, en este orden:
--   PASO A · ANTES (sólo lee). Guardar su salida: ES EL DESHACER de verdad.
--   PASO B · EL CAMBIO, con su control DENTRO. Es un bloque DO: si el control
--            falla, lanza una excepción y Postgres deshace el UPDATE entero. No
--            hay estado intermedio. Si va bien, dice «OK» en los mensajes.
--   PASO C · DESPUÉS (sólo lee): las cifras con OK o FALLA.
--   PASO D · EL DESHACER, COMENTADO. Sólo si hace falta: se descomenta y se
--            ejecuta solo.
--
-- ⚠️ LO QUE ESTE FICHERO NO HACE, Y HACE FALTA: la búsqueda filtra por la
-- metadata de los VECTORES (`analysisStatus`, lib/pinecone/vectors.ts:99), no
-- por la fila. Tras el paso B, los 14 siguen saliendo en la búsqueda hasta que
-- se copie el estado a sus vectores con la página de administración
-- (/api/admin/cleanup → «Etiquetar vectores con su estado»). Ver el encargo.
--
-- ⚠️ EFECTO SECUNDARIO DE ESCRIBIR LA FILA: el disparador `documents_updated_at`
-- (supabase-setup.sql:621-623) pone `updated_at` a la hora del cambio. El paso A
-- guarda el `updated_at` de antes; el deshacer no lo restaura (no hace falta).
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- PASO A · ANTES. Sólo lee. Ejecutar SOLO y GUARDAR la salida: tienen que salir
-- las 14 filas, todas en 'analizado', y la fila «0 · control» con OK (en la columna id).
-- ════════════════════════════════════════════════════════════════════════════
WITH los14(id) AS (
  VALUES
    ('71a8dbcf-3d4d-455e-b68e-ad95d480a51f'),  -- 2_Glosario_Terminos.pdf
    ('99df95aa-5c8b-444d-b93e-71a412652698'),  -- 3_Especificacion_Tecnica.pdf
    ('1ca09df5-2ba8-4b5b-81c3-eb0811f3b1ac'),  -- Actas_Direccion_2025.docx
    ('5d2ddeb0-b5f8-437c-bd7a-cdb59175e540'),  -- Clientes_Residuos_Peligrosos.xlsx
    ('a0f6ad8a-0122-4823-89b4-53253d85ba7d'),  -- Clientes_Residuos_Sanitarios.xlsx
    ('958980d7-f1d7-45c3-8d2d-b54ac78f51ce'),  -- Facturacion_2025.xlsx
    ('59d81b60-78b1-45a4-8e1b-674f32c510e4'),  -- new 1.txt
    ('74293765-931c-4cc2-8d00-2e2501992d2c'),  -- new 10.txt
    ('7c12985f-15fd-46d4-ac03-2984dd24c49d'),  -- new 11.txt
    ('f2774673-31bf-4c85-8201-df0e434385aa'),  -- new 6.txt
    ('4a9df7c7-a196-4e0f-ad21-ee5ac6a94677'),  -- new 9.txt
    ('e81354e7-d9ad-43e7-ad3e-795891badc2f'),  -- Normas_Frecuencia_Recogidas.docx
    ('4daf541e-f27e-402f-acca-51b0bc56a759'),  -- Protocolo_Visitas_Centros.docx
    ('55138ae1-8bbf-491f-9345-7d3549970ac8')   -- Registro_Visitas.xlsx
)
SELECT '1 · antes' AS bloque, d.id::text AS id, d.name, d.analysis_status, d.updated_at::text AS updated_at
FROM public.documents d JOIN los14 l ON d.id::text = l.id
WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
UNION ALL
SELECT '0 · control',
       CASE WHEN count(*) = 14 AND count(*) FILTER (WHERE d.analysis_status = 'analizado') = 14
            THEN 'OK' ELSE 'FALLA' END,
       'encontrados ' || count(*) || ' de 14; en analizado ' ||
         count(*) FILTER (WHERE d.analysis_status = 'analizado') || ' de 14',
       NULL, NULL
FROM public.documents d JOIN los14 l ON d.id::text = l.id
WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
ORDER BY bloque, name;


-- ════════════════════════════════════════════════════════════════════════════
-- PASO B · EL CAMBIO. ⚠️ ESCRIBE. Ejecutar SOLO, después de guardar el paso A.
-- Si cualquier cifra no cuadra, termina con «FALLA: …» y NO CAMBIA NADA.
-- ════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  org constant text := 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
  los14 constant text[] := ARRAY[
    '71a8dbcf-3d4d-455e-b68e-ad95d480a51f',  -- 2_Glosario_Terminos.pdf
    '99df95aa-5c8b-444d-b93e-71a412652698',  -- 3_Especificacion_Tecnica.pdf
    '1ca09df5-2ba8-4b5b-81c3-eb0811f3b1ac',  -- Actas_Direccion_2025.docx
    '5d2ddeb0-b5f8-437c-bd7a-cdb59175e540',  -- Clientes_Residuos_Peligrosos.xlsx
    'a0f6ad8a-0122-4823-89b4-53253d85ba7d',  -- Clientes_Residuos_Sanitarios.xlsx
    '958980d7-f1d7-45c3-8d2d-b54ac78f51ce',  -- Facturacion_2025.xlsx
    '59d81b60-78b1-45a4-8e1b-674f32c510e4',  -- new 1.txt
    '74293765-931c-4cc2-8d00-2e2501992d2c',  -- new 10.txt
    '7c12985f-15fd-46d4-ac03-2984dd24c49d',  -- new 11.txt
    'f2774673-31bf-4c85-8201-df0e434385aa',  -- new 6.txt
    '4a9df7c7-a196-4e0f-ad21-ee5ac6a94677',  -- new 9.txt
    'e81354e7-d9ad-43e7-ad3e-795891badc2f',  -- Normas_Frecuencia_Recogidas.docx
    '4daf541e-f27e-402f-acca-51b0bc56a759',  -- Protocolo_Visitas_Centros.docx
    '55138ae1-8bbf-491f-9345-7d3549970ac8'   -- Registro_Visitas.xlsx
  ];
  cambiadas integer;
  en_el_corpus integer;
  con_trozos integer;
BEGIN
  UPDATE public.documents
     SET analysis_status = 'pendiente'
   WHERE org_id = org
     AND id::text = ANY (los14)
     AND analysis_status = 'analizado';
  GET DIAGNOSTICS cambiadas = ROW_COUNT;

  SELECT count(*),
         count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.document_chunks c
                                         WHERE c.document_id = d.id AND c.generation = d.active_generation))
    INTO en_el_corpus, con_trozos
    FROM public.documents d
   WHERE d.org_id = org AND d.analysis_status = 'analizado';

  IF cambiadas <> 14 OR en_el_corpus <> 6 OR con_trozos <> 6 THEN
    RAISE EXCEPTION 'FALLA: filas cambiadas %, esperado 14; corpus %, esperado 6; del corpus con trozos %, esperado 6. NO SE HA CAMBIADO NADA.',
      cambiadas, en_el_corpus, con_trozos;
  END IF;

  RAISE NOTICE 'OK: filas cambiadas 14; corpus 6; los 6 con trozos.';
END $$;


-- ════════════════════════════════════════════════════════════════════════════
-- PASO C · DESPUÉS. Sólo lee. Las tres cifras con OK o FALLA.
-- ════════════════════════════════════════════════════════════════════════════
WITH los14(id) AS (
  VALUES
    ('71a8dbcf-3d4d-455e-b68e-ad95d480a51f'), ('99df95aa-5c8b-444d-b93e-71a412652698'),
    ('1ca09df5-2ba8-4b5b-81c3-eb0811f3b1ac'), ('5d2ddeb0-b5f8-437c-bd7a-cdb59175e540'),
    ('a0f6ad8a-0122-4823-89b4-53253d85ba7d'), ('958980d7-f1d7-45c3-8d2d-b54ac78f51ce'),
    ('59d81b60-78b1-45a4-8e1b-674f32c510e4'), ('74293765-931c-4cc2-8d00-2e2501992d2c'),
    ('7c12985f-15fd-46d4-ac03-2984dd24c49d'), ('f2774673-31bf-4c85-8201-df0e434385aa'),
    ('4a9df7c7-a196-4e0f-ad21-ee5ac6a94677'), ('e81354e7-d9ad-43e7-ad3e-795891badc2f'),
    ('4daf541e-f27e-402f-acca-51b0bc56a759'), ('55138ae1-8bbf-491f-9345-7d3549970ac8')
),
docs AS (
  SELECT d.id::text AS id, d.analysis_status,
         EXISTS (SELECT 1 FROM public.document_chunks c
                  WHERE c.document_id = d.id AND c.generation = d.active_generation) AS con_trozos
  FROM public.documents d
  WHERE d.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf'
),
cifras AS (
  SELECT 'documentos en el corpus' AS medida, 6 AS esperado,
         count(*) FILTER (WHERE analysis_status = 'analizado') AS medido FROM docs
  UNION ALL
  SELECT 'del corpus, con trozos', 6,
         count(*) FILTER (WHERE analysis_status = 'analizado' AND con_trozos) FROM docs
  UNION ALL
  SELECT 'de los 14, en pendiente', 14,
         count(*) FILTER (WHERE analysis_status = 'pendiente') FROM docs JOIN los14 USING (id)
)
SELECT CASE WHEN medido = esperado THEN 'OK' ELSE 'FALLA' END AS resultado,
       medida, esperado, medido
FROM cifras;


-- ════════════════════════════════════════════════════════════════════════════
-- PASO D · EL DESHACER. ⚠️ ESCRIBE. COMENTADO A PROPÓSITO: sólo si hace falta.
-- Devuelve los 14 a 'analizado'. Para usarlo, quitar los «-- » del principio de
-- cada línea del bloque y ejecutarlo SOLO. Si no cuadra, FALLA y no cambia nada.
-- Después hay que volver a copiar el estado a los vectores (backfill).
-- ════════════════════════════════════════════════════════════════════════════
-- DO $$
-- DECLARE
--   org constant text := 'a9625e93-af2a-4416-a465-5c2fa2a25bdf';
--   los14 constant text[] := ARRAY[
--     '71a8dbcf-3d4d-455e-b68e-ad95d480a51f', '99df95aa-5c8b-444d-b93e-71a412652698',
--     '1ca09df5-2ba8-4b5b-81c3-eb0811f3b1ac', '5d2ddeb0-b5f8-437c-bd7a-cdb59175e540',
--     'a0f6ad8a-0122-4823-89b4-53253d85ba7d', '958980d7-f1d7-45c3-8d2d-b54ac78f51ce',
--     '59d81b60-78b1-45a4-8e1b-674f32c510e4', '74293765-931c-4cc2-8d00-2e2501992d2c',
--     '7c12985f-15fd-46d4-ac03-2984dd24c49d', 'f2774673-31bf-4c85-8201-df0e434385aa',
--     '4a9df7c7-a196-4e0f-ad21-ee5ac6a94677', 'e81354e7-d9ad-43e7-ad3e-795891badc2f',
--     '4daf541e-f27e-402f-acca-51b0bc56a759', '55138ae1-8bbf-491f-9345-7d3549970ac8'
--   ];
--   cambiadas integer;
--   en_el_corpus integer;
-- BEGIN
--   UPDATE public.documents
--      SET analysis_status = 'analizado'
--    WHERE org_id = org
--      AND id::text = ANY (los14)
--      AND analysis_status = 'pendiente';
--   GET DIAGNOSTICS cambiadas = ROW_COUNT;
--   SELECT count(*) INTO en_el_corpus
--     FROM public.documents WHERE org_id = org AND analysis_status = 'analizado';
--   IF cambiadas <> 14 OR en_el_corpus <> 20 THEN
--     RAISE EXCEPTION 'FALLA: filas devueltas %, esperado 14; corpus %, esperado 20. NO SE HA CAMBIADO NADA.',
--       cambiadas, en_el_corpus;
--   END IF;
--   RAISE NOTICE 'OK: filas devueltas 14; corpus otra vez en 20.';
-- END $$;
