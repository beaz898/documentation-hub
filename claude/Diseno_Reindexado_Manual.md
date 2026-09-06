# Diseño — el disparo manual del reindexado

**06/09/2026 · SOBRE EL PAPEL, antes de escribir nada.** Es una operación que
toca el índice, así que se mira primero. Aquí no hay código: hay decisiones y
huecos, y los huecos están marcados.

---

# 1 · ⚠️ LA DECISIÓN QUE CAMBIA EL DISEÑO: SON DOS OPERACIONES, NO UNA

Al bajar al detalle aparece una distinción que en el análisis anterior no estaba
separada, y separarla es lo primero:

| | **REPROCESAR** | **RE-TROCEAR** |
|---|---|---|
| de dónde sale el texto | del **fichero original**, descargado otra vez | de `documents.full_text`, ya extraído |
| qué rehace | extracción **y** troceado | solo el troceado |
| qué repara | cualquier cambio del extractor | solo cambios del cortador |
| para quién | lo que tiene fichero recuperable | prosa ya indexada |
| ⚠️ riesgo | ninguno: nace del binario | **destruye la estructura si el documento tenía tablas** |

**Por qué el riesgo:** `full_text` se guarda con el marcador de segmentación
QUITADO (`stripSegmentationMarkers`). Re-trocearlo no puede reconstruir los
segmentos, así que un Excel volvería como prosa: **se perderían las `cells`**, que
son lo único que alimenta el diff. Una reparación que convierte una tabla en prosa
es peor que no reparar.

**LA GUARDA, y no es opcional:** re-trocear se **rechaza** si el documento tiene
algún chunk de tipo `table_row` o `table_summary` en su generación activa. El dato
está en `document_chunks` y la comprobación es una consulta. Falla cerrada: ante la
duda, no se re-trocea.

⚠️ **Y esto explica por qué el clasificador de la pieza 1 dice lo que dice.**
`reparable_resubiendo` no significa «no se puede hacer nada»: significa **no se
puede recuperar el ORIGINAL**. Para un manual de prosa, re-trocear repara el
troceado sin recuperar el original — es media reparación, y hay que llamarla por
su nombre en vez de venderla como completa.

---

# 2 · EL FLUJO, paso a paso

Todo lo que sigue **reutiliza piezas que ya existen y funcionan en producción** en
el versionado de Drive. Lo nuevo es el disparador y el orden.

```
0. GUARDAS          admin + resolveOrg + checkUploadLock
                    + cerrojo de análisis (no reindexar con un análisis vivo)
1. LEER             la fila: active_generation, extractor_version,
                    source, provider_file_id, full_text
2. CLASIFICAR       estadoDeReparacion() → decide la vía, o rechaza
3. OBTENER TEXTO    · reprocesar: descargar por el proveedor → extractSegments
                    · re-trocear: full_text, TRAS la guarda de tablas
4. TROCEAR          chunkSegments(...) con la generación N+1
5. EMBEDDINGS       generateEmbeddings — no cuesta créditos, cuesta tiempo
6. ESCRIBIR NUEVO   upsertVectors(ids de N+1) + saveDocumentChunks(N+1)
                    ⚠️ la generación activa SIGUE SIENDO N y sirve todo el rato
7. MARCAR           fila en document_staged (generation=N+1, full_text,
                    content_hash, chunk_count, size_bytes)
8. CONMUTAR         swapDocumentVectors() — sus cuatro patas, ya escritas
9. CONTAR           contadores por vía y por resultado
```

**El paso 6 es la propiedad que hace esto seguro**, y no hay que construirla: la
generación viaja **dentro del id del vector** y es columna en `document_chunks`, así
que escribir N+1 **no puede pisar N**. Si el proceso muere en el 6 o en el 7, lo
que queda es basura invisible en una generación que nadie sirve — nunca un
documento apagado. Es el sesgo de fallo que `swapDocumentVectors` ya declara.

---

# 3 · LO QUE **NO** HACE, y conviene fijarlo antes

· **No re-analiza.** No toca `analysis_results`, ni `analysis_status`, ni la
  bandeja. Reindexar no es opinar sobre el contenido.
· **No cuesta créditos.** No hay llamada a ningún modelo. Los embeddings pasan por
  Pinecone Inference, que tiene su propio límite de tasa, no el monedero.
· **No borra el documento en ningún momento**, que es el requisito de partida.
· **No reindexa en lote.** Uno cada vez, por decisión: un lote sobre el índice sin
  medir antes el coste de uno es exactamente lo que F-104 pide no hacer.

---

# 3-bis · ⚠️ QUÉ PASA SI FALLA A MITAD — punto por punto

Es la pregunta correcta, porque reindexar deja **dos generaciones conviviendo**
mientras dura. La respuesta corta: **en ningún punto de fallo queda el documento
peor que antes**, y eso no es suerte — es el orden.

| muere en… | qué queda | ¿lo ve el usuario? | cómo se sale |
|---|---|---|---|
| **troceado / embeddings** | nada escrito | no | reintentar |
| **vectores de N+1 escritos** | vectores huérfanos en una generación que nadie sirve | **no**: la búsqueda filtra por la generación activa, que sigue siendo N | reintentar; el reintento los sobrescribe (`upsert` por id) |
| **chunks de N+1 escritos** | filas huérfanas en `document_chunks` con `generation = N+1` | no: las lecturas piden la generación activa | reintentar |
| **antes del marcador** | lo anterior, sin fila en `document_staged` | no | ⚠️ **se aborta a propósito**: sin marcador la conmutación no sería reparable |
| **durante la conmutación** | el swap muerto a medias | no | **volver a llamar**: `swapDocumentVectors` es idempotente y el marcador sigue ahí |
| **después de conmutar** | terminado | sí, mejorado | nada |

**La propiedad que sostiene toda la columna «¿lo ve el usuario?»** es que la
generación viaja **dentro del id del vector** y es columna en `document_chunks`:
escribir N+1 **no puede pisar N**. Mientras no se conmuta, el documento sirve
exactamente lo de antes.

**Y el sesgo de fallo es el que `swapDocumentVectors` ya declaraba**: *«si muere a
medias, sobra basura invisible, nunca falta la versión servida ni el documento se
apaga»*. Aquí se hereda, no se reinventa.

⚠️ **LO QUE SÍ QUEDA, Y HAY QUE DECIRLO: BASURA.** Un reindexado abortado deja
chunks y vectores de una generación que nadie va a servir. No hacen daño —nadie
los lee— pero **ocupan y nadie los limpia hoy**: la retirada de generaciones
viejas es la pata 3 del swap, y si el swap no llegó a correr, no pasó. Por la
regla de la casa —«si la respuesta a *quién limpia esto* no es evidente, la
pregunta anterior es por qué se creó»— esto se anota en vez de taparse: **el
reintento los sobrescribe** (mismos ids, mismo `(document_id, generation,
chunk_index)`), así que la basura no se acumula por reintentar; solo se queda si
el documento se abandona a medias y nunca se vuelve a intentar.

⚠️ **Y EL CASO QUE NO ESTÁ RESUELTO, declarado**: si la conmutación falla
**después** de la pata 1 (metadatos de N+1 marcados) pero antes de la 2, los
vectores nuevos ya dicen `analizado` y la fila sigue apuntando a N. No es
incoherente para el usuario —la búsqueda sigue filtrando por generación— pero es
un estado intermedio que solo se sale volviendo a llamar. Está dentro del contrato
de `swapDocumentVectors`, no lo añade este diseño.

---

# 4 · DÓNDE SE DISPARA

**Propuesta: `POST /api/admin/reindexar` con el id del documento.** Solo-admin,
mismo patrón que el resto de `app/api/admin/`.

⚠️ **Y lo que NO propongo, con su razón:** no ponerlo en la bandeja de revisión
todavía. La bandeja es de uso normal y un botón ahí lo pulsa cualquiera; esta
operación reescribe el índice de un documento y su primera ejecución en producción
es, literalmente, la medición del coste (paso 3 del orden de F-104). Primero se
mide con un admin delante, y después se decide si baja a la bandeja.

## 4.1 · ⚠️ QUIÉN PUEDE DISPARARLO — las tres opciones, y por qué SOLO ADMIN

**Cualquiera de la organización — NO.** No por permisos: por **presupuesto
compartido**. Reindexar consume la cuota de embeddings de Pinecone, que es de la
organización entera; un usuario reindexando a mano puede dejar sin margen la
indexación de otro, y el que se queda sin margen no sabe por qué. Un botón que
gasta un recurso común no se pone donde el que lo pulsa no ve el contador.

**El sistema por su cuenta — NO, y es la que más tentaba.** Es exactamente lo que
la regla de la casa prohíbe por defecto: **nada se hace solo**; un barrido
periódico es *la última opción*, y si alguna vez existe entra con el patrón de dos
fases sobre conjunto fijo. Aquí además hay una razón propia: **la primera
ejecución es una MEDICIÓN** —el coste real de un reindexado no está medido (H4)—
y una medición no se lanza sola. Automatizar antes de tener la cifra sería
convertir un experimento en un proceso.

**Solo admin — SÍ**, y con la propiedad que lo hace defendible: es una operación
**reparadora y reversible en su efecto** —deja el documento mejor troceado o igual,
nunca sin servir— pero **cara y compartida**. Ese par —bajo riesgo, alto consumo—
es justo el perfil de lo que se da a quien administra y no a quien usa.

⚠️ **Y una consecuencia que conviene aceptar en voz alta**: con esto, **el parque
de un cliente no se repara solo**. Alguien tiene que entrar y pulsar, documento a
documento. Para el piloto es una tarde; para un cliente con doscientos documentos
no vale, y por eso F-104 P2 registra el frente de reprocesado en background como
post-MVP con prioridad alta, y **con su condición de entrada: el primer cliente**.
Esta pieza no pretende resolver aquello — pretende que aquello se pueda construir
encima en vez de desde cero.

---

# 5 · LOS CONTADORES, por F-95

Vocabulario cerrado, decidido aquí y no sobre la marcha:

| clave | qué cuenta |
|---|---|
| `reindexado.reprocesado` | reparaciones desde el fichero original |
| `reindexado.retroceado` | reparaciones desde el texto guardado |
| `reindexado.rechazado_por_tablas` | ⚠️ la guarda del punto 1 actuando |
| `reindexado.rechazado_sin_original` | manual: hay que resubir |
| `reindexado.fallo_descarga` | el proveedor no devolvió el fichero |
| `reindexado.fallo_conmutacion` | el swap no completó sus cuatro patas |

Los dos últimos son los que dicen si esto se puede usar en lote algún día.

---

# 6 · ⚠️ LOS HUECOS, que es para lo que este documento existe

**H1 · La firma comprobable sigue sin sitio.** Hoy el reindexado escribiría
`extractor_version = 3` y nada más. Eso es un número que hay que creer, no una
firma que se pueda comprobar — F-104 regla 3. **Necesita columna nueva, o sea SQL,
y el SQL es tuyo.** Sin ella el reindexado funciona, pero no deja rastro
verificable de QUÉ produjo.

**H2 · ¿Qué pasa si el documento tiene un `staged` vivo?** `document_staged` tiene
`document_id` como clave primaria: **solo cabe una fila por documento**. Si un
documento de Drive tiene una versión pendiente de aprobar y se lanza un
reindexado, uno de los dos pisa al otro. **Propuesta: rechazar el reindexado si hay
staged**, y contarlo. Falla cerrada, y el usuario decide qué quiere primero.

**H3 · ¿Reindexar un documento `pendiente` de revisar?** Su troceado también está
viejo, pero tocarlo mientras alguien lo revisa es confuso. Me inclino por
permitirlo —el troceado no cambia el contenido— pero es decisión de producto.

**H4 · El coste real de un reindexado no está medido.** Un `.docx` de 60.000
caracteres son ~75 trozos, o sea 75 embeddings. La primera ejecución es la que da
la cifra, y de ahí sale si el parque del piloto es «una tarde» como dice F-104 o
más.

---

# 7 · LO QUE ESTE DISEÑO NO DICE

· **No he ejecutado nada.** Que `swapDocumentVectors` sirva para esto está deducido
  de su contrato, y su contrato está escrito para el versionado de Drive. La
  primera ejecución real es también la primera verificación de esa deducción.
· **No cubre el lote ni el reprocesado automático.** Eso es el frente post-MVP que
  F-104 P2 registra, y su condición de entrada es el primer cliente.
