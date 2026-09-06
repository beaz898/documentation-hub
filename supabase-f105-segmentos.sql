-- ════════════════════════════════════════════════════════════════════════════
-- F-105 · PASO 0 — LOS SEGMENTOS SE PERSISTEN
--
-- ⚠️ ESTADO: PENDIENTE DE EJECUTAR.
-- Este fichero pasa a EJECUTADO solo cuando el usuario lo confirme. Hasta
-- entonces no describe la base: describe lo que se le va a pedir.
-- ════════════════════════════════════════════════════════════════════════════
--
-- QUÉ RESUELVE. Los tres puntos de indexación llaman a `extractSegments`, usan
-- su salida para trocear, y luego escriben SOLO el texto plano
-- (`stripSegmentationMarkers`). La estructura —y con ella las `cells`— se tira.
-- Por eso la reparación desde lo guardado funciona para prosa y no para tablas:
-- `full_text` no puede reconstruir un segmento tabular.
--
-- ⚠️ EL COSTE ESTÁ MEDIDO, NO ESTIMADO (encargo 1 de F-105), sobre los 16
-- ficheros de `corpus-pruebas/`:
--     RATIO GLOBAL  1,27×   ·   PEOR CASO  2,68× (RRHH-08.xlsx)
--     MEJOR CASO    1,01× (NOR-10.docx)
-- El umbral de parada que F-105 fijó —3×— no se roza.
-- Y el reparto es BIMODAL: prosa 1,01-1,03×, Excel 2,27-2,68×. **Todo el coste
-- está en los documentos tabulares, que son exactamente aquéllos para los que
-- se guardan.** Se paga donde sirve.
--
-- ⚠️ POR QUÉ COLUMNA `jsonb` Y NO TABLA HERMANA, decidido con el esquema
-- delante como pedía F-105: los segmentos SIEMPRE se consumen enteros —
-- `chunkSegments(segments, …)` los recorre de principio a fin— y nunca se
-- consultan por uno solo. Una tabla hermana como `document_chunks` existe
-- porque sus filas SÍ se consultan sueltas (por `chunk_index`, por `table_id`).
-- Aquí no hay ninguna consulta que quiera un segmento suelto, así que una tabla
-- añadiría un JOIN y un orden que mantener a cambio de nada.
--
-- ⚠️ Y NO SE BORRA `full_text` EN ESTA MIGRACIÓN, A PROPÓSITO. La lectura tiene
-- que aceptar las DOS FORMAS durante una ventana, porque los documentos ya
-- indexados no tienen segmentos: es la LECTURA DUAL CON CADUCIDAD de F-94, y es
-- la primera vez que esta casa la aplica de verdad. «El texto plano se retira»
-- significa **deja de escribirse**, no «se borra la columna»: borrarla ahora
-- haría imposible la ventana. La retirada de la columna es una SEGUNDA
-- migración, al cerrar la ventana, y con su fecha.

-- ── documents ───────────────────────────────────────────────────────────────
-- NULL significa «documento anterior a los segmentos», y por eso no lleva
-- DEFAULT: es el mismo razonamiento que ya está escrito para
-- `extractor_version` —«un default habría mentido diciendo que ya estaban al
-- día»—. Aquí mentiría diciendo que un documento viejo tiene estructura.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS segments jsonb;

-- ── document_staged ─────────────────────────────────────────────────────────
-- ⚠️ ESTA ES LA QUE SE OLVIDA. `document_staged` lleva su propio `full_text`
-- porque la conmutación promueve la fila entera desde ahí (`document-swap.ts`,
-- pata P2). Sin esta columna, un documento versionado por el sync se quedaría
-- SIN segmentos al conmutar — y el camino que más los necesita, el de la nube,
-- sería justo el único que no los tendría.
ALTER TABLE public.document_staged
  ADD COLUMN IF NOT EXISTS segments jsonb;

-- ── Qué NO hace este fichero, declarado ─────────────────────────────────────
-- · NO rellena los documentos existentes. Se llenan al repararse, y esa misma
--   pasada los deja con segmentos para siempre (F-105 P2: la reparación es
--   idempotente y ENRIQUECEDORA).
-- · NO toca `full_text`. Ver arriba.
-- · NO añade índices: no hay ninguna consulta que filtre por el contenido de
--   los segmentos. El día que la haya, será un índice con su motivo escrito.
