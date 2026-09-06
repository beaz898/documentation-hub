# La vía de reparación — reindexar sin borrar

**06/09/2026 · SOLO LECTURA.** Paso 1 del orden que fija F-104, y el único que no
depende de nada. La pregunta: qué haría falta para reindexar un documento
existente sin borrarlo, y qué de eso ya existe.

**Respuesta corta: el mecanismo existe casi entero — y le falta la pieza que no se
ve, que es de dónde sale el texto.**

---

# 1 · LO QUE YA EXISTE, y es más de lo que esperaba

Esta casa ya construyó el modelo de generaciones (C.4, diseño F-3). Reindexar sin
borrar **es exactamente para lo que sirve**, aunque hasta hoy solo lo haya usado
el versionado de Drive.

| pieza | dónde | qué resuelve |
|---|---|---|
| **Generación de primera clase** | `documents.active_generation`, `document_chunks.generation`, y la generación **dentro del id del vector** (`buildVectorId`/`parseVectorId`) | escribir una generación nueva **no pisa la activa, por construcción** |
| **Escritura de la nueva** | `saveDocumentChunks(..., generation)` + `upsertVectors` | los chunks y vectores de N+1 conviven con los de N |
| **⚠️ La conmutación** | `swapDocumentVectors` (`lib/document-swap.ts`) | **cuatro patas, idempotente y RE-INVOCABLE**, con marcador y sesgo de fallo declarado |
| **El marcador** | tabla `document_staged` | `document_id, org_id, generation, full_text, content_hash, chunk_count, size_bytes` — **encaja sin tocar el esquema** |
| **La retirada de lo viejo** | P3 del swap + `deleteDocumentChunksBelowGeneration` + `retirarLoViejo` | borra generaciones anteriores **después** de que la nueva sirva |
| **El sello** | `documents.extractor_version` | escrito en los cuatro puntos de indexación (sin lector, F-104 P3) |
| **El precedente operativo** | resubir | validado en el cambio de versión 1→2 |

⚠️ **Lo que más vale de todo esto es el sesgo de fallo de `swapDocumentVectors`**,
que ya está escrito y razonado: *«si muere a medias, sobra basura invisible, nunca
falta la versión servida ni el documento se apaga»*. Una vía de reparación
necesita exactamente esa propiedad, y no hay que diseñarla: hay que llamarla.

**Y no hace falta SQL para nada de esto.** `document_staged` tiene las columnas
que un reindexado necesita.

---

# 2 · LO QUE FALTA — dos cosas, y la segunda es el bloqueo

## 2.1 · Un productor de generación nueva que no sea una subida *(corto)*

Hoy la generación N+1 **solo nace de un fichero**: `ingest` con `force`, o el
staged del sync. No existe la función «coge este documento, vuelve a trocearlo,
escribe N+1».

Es código nuevo pero pequeño, porque no inventa nada: trocear → `saveDocumentChunks`
en N+1 → `upsertVectors` en N+1 → escribir la fila `document_staged` → llamar a
`swapDocumentVectors`. **Todo lo que hace falta ya está escrito y probado en
producción por el versionado de Drive.**

## 2.2 · ⚠️ DE DÓNDE SALE EL TEXTO — aquí está el problema, y no es pequeño

Tres hechos verificados, y juntos deciden el asunto:

1. **`ingest` BORRA el fichero de Storage al terminar** — `app/api/ingest/route.ts:395`,
   «11. Limpiar archivo de storage».
2. **La fila `documents` NO guarda `storage_path`.** Esa columna existe, pero en
   `analysis_results` y `analysis_jobs` (F-101), no en `documents`. El documento
   indexado **no tiene puntero a ningún binario**.
3. **`full_text` se guarda APLANADO**: `stripSegmentationMarkers(text)`, en los
   tres puntos de escritura (`ingest:279`, `index-text:221`, `drive/sync:343,394,435`).

**Consecuencia, por tipo de documento:**

| origen | ¿se puede reindexar? | por qué |
|---|---|---|
| **Prosa manual** (`.txt`, `.pdf`, `.docx`, `.md`) | **SÍ**, desde `full_text` | el texto es el texto; re-trocearlo da el troceado nuevo |
| **Excel manual** (`.xlsx`, `.xlsm`) | ⚠️ **NO** | sin el marcador, `chunkText` no toma el camino 0: no hay segmentos, **y se perderían las `cells`**. Una «reparación» que convierte una tabla en prosa es peor que no reparar |
| **Cualquiera de Drive** | **SÍ, de verdad** | `provider_file_id` permite **volver a descargar el binario** y re-extraer |

⚠️ **Y EL MATIZ QUE SALVA EL CASO CONCRETO SIN SALVAR LA VÍA GENERAL:** B.182 daña
**solo prosa** —está medido: todas las filas de tabla a cero, las tablas no se
cortan nunca—. Así que **para reparar B.182, `full_text` basta.**

Pero una vía que solo funciona para prosa **no es la vía que exige la regla 1 de
F-104**. El día que el fallo esté en la extracción de tablas —que es exactamente
el frente que P1 acaba de decidir— `full_text` no servirá, y **el binario ya no
estará**. Conviene saberlo hoy y no aquel día.

## 2.3 · La firma escrita — y hoy no hay dónde escribirla

F-104 promueve que **una firma de comportamiento no es un número de versión**.
Hoy el sello es `extractor_version`, un entero: dice *cuál* es, no *qué produce*,
y solo se puede creer.

Una firma comprobable sería un hash del **troceado resultante** —longitudes y
fronteras, o el hash de los textos de los chunks—: se vuelve a producir, se
compara, y **una divergencia se detecta sola**. `content_hash` ya hace eso para el
CONTENIDO; falta el equivalente para el TROCEADO.

⚠️ **Y eso sí necesita columna nueva, o sea SQL.** Me paro aquí, como toca: el SQL
lo ejecutas tú y va antes del push. Cuando decidas la forma de la firma, lo
preparo.

---

# 3 · LO QUE YO PROPONDRÍA, sin decidirlo

**No hace falta guardar todos los binarios para siempre** — eso es coste de
almacenamiento y una decisión de producto. Hay una salida más barata y más honesta:

**Que la vía de reparación DECLARE lo que puede reparar y lo que no.** Es decir:
`reindexarDocumento` mira el origen y responde una de tres cosas — *reparable
desde el fichero* (Drive), *reparable desde el texto* (prosa manual), *no
reparable sin el original* (Excel manual)—; y **lo tercero se cuenta**, que por
F-95 es lo que convierte un límite declarado en un límite vigilado.

Con eso, la regla 1 de F-104 se cumple de verdad: la vía existe, y **su cobertura
está escrita en vez de suponerse**.

---

# 4 · LO QUE ESTE DOCUMENTO NO DICE

· **No dice cuántos documentos del piloto son Excel manual**, que es la cifra que
  decidiría si el hueco importa hoy. Sale de la misma consulta del parque.
· **No he ejecutado nada.** Es lectura de código, y por la regla de la casa eso no
  verifica la funcionalidad: que `swapDocumentVectors` sirva para esto está
  deducido de su contrato, no visto funcionar fuera del versionado de Drive.
· **No propone el arreglo del cortador.** Ése es el paso 2 y no toca todavía.
