# Inventario de caminos del usuario

**04/09/2026 · SOLO LECTURA · pieza 1 de las tres del plan de F-103 P3.**

No es una auditoría: es un CENSO. No busca fallos — enumera por dónde puede
entrar un documento y marca, camino por camino, si existe una tanda contra cifra
de referencia. Es el que dice cuánto falta de verdad.

Método: se abrió **el consumidor**, no el productor. De cada superficie de la
interfaz se leyó qué cuerpo manda, y de `analyze-v2` qué hace con cada forma de
ese cuerpo. Es la regla de F-94, y en este censo ya ha cobrado una vez (ver
B.177).

---

## LO QUE DISTINGUE UN CAMINO DE OTRO

No es la pantalla: son **tres ejes**, y dos caminos que difieren en cualquiera de
ellos ejecutan código distinto y pueden fallar por separado.

**EJE 1 — LA FUENTE DEL TEXTO, que decide si hay ESTRUCTURA.** Es el eje que
produjo B.175 y el que este censo demuestra que no está cerrado. Cuatro formas,
todas vivas hoy en `analyze-v2`:

| forma del cuerpo | qué trocea | ¿hay celdas? |
|---|---|---|
| `storagePath` solo | `extractSegments` → `chunkSegments` | **sí**, del binario |
| `text` + `storagePath` | igual, **si el texto no cambió** (guarda B.175) | sí / no, declarado en log |
| `text` + `documentoEnRevision` | rescate de `document_chunks` tipados | **sí**, si está indexado |
| `text` **solo** | `chunkText` | **NO — plano** |

Sin celdas, `groupChunksByTable` devuelve vacío, `emparejarTablas` recibe cero
grupos y **el diff no emite nada**. El juez sigue funcionando sobre texto
aplanado: por eso el resultado no parece roto, parece pequeño.

**EJE 2 — EL MODO.** Rápido y exhaustivo no son el mismo código con más vueltas:
son `runAnalysisPipeline` (Vercel, `maxDuration 120`, 5 cr) y
`runExhaustiveAnalysisPipeline` (worker de Railway, 30 cr, despliegue aparte).
**Un camino medido en rápido no dice nada del mismo camino en exhaustivo.**

**EJE 3 — LOS SUJETOS.** Quién participa: por PERTENENCIA (`analizado`, sin ser
nombrado), por NOMINACIÓN (`batchDocumentIds`) o excluido
(`documentoAReemplazar`). Es el eje de F-97.

---

## FAMILIA A — CAMINOS QUE PRODUCEN UN ANÁLISIS PERSISTIDO

Los que escriben en `analysis_results` y le enseñan hallazgos al usuario. **Son
los que necesitan tanda contra cifra de referencia.**

| # | camino | cuerpo que manda | estructura | modo | tanda |
|---|---|---|---|---|---|
| **A1** | CHAT · subida → análisis | `storagePath, fileName` | **✓** binario | rápido | ⚠️ ver nota 1 |
| **A2** | CHAT · subida → exhaustivo | `+ exhaustive` | **✓** binario | exhaustivo | ⚠️ parcial |
| **A3** | BANDEJA · analizar | `text, documentoEnRevision, batchDocumentIds` | **✓** rescate | rápido | ⚠️ ver nota 2 |
| **A4** | BANDEJA · analizar exhaustivo | `+ exhaustive` | **✓** rescate | exhaustivo | ⚠️ ver nota 2 |
| **A5** | MODAL(chat) · Reanalizar todo | `text, storagePath, excludeFingerprints` | **✓** guarda B.175 | exhaustivo | **NO** · cuarentena |
| **A6** | MODAL(bandeja) · Reanalizar todo | `text` **y nada más** | ❌ **PLANO** | exhaustivo | **NO** · roto (B.177) |
| **A7** | MODAL(chat) · Reanalizar estilo | `text, storagePath` | n/a | — | **NO** |
| **A8** | MODAL(bandeja) · Reanalizar estilo | `text, documentoPropietario` | n/a | — | **NO** |

**Nota 1 — A1 no tiene tanda propia declarada.** La remedición del frente 2
(02/09) fueron cinco pasadas en rápido, pero su maniobra de aislamiento describe
la BANDEJA. Ninguna entrada del registro dice «lanzada desde el chat, modo
rápido». No se afirma que falte: se afirma que **no consta**.

**Nota 2 — las dos entradas de la bandeja del 04/09 traen cifra pero NO declaran
modo.** El par grande (15/15/2) y la siembra (2/2/0) declaran el camino —desde
que es obligatorio— pero no si fueron rápido o exhaustivo. Como A3 y A4 son
código distinto, **esas cifras no se pueden atribuir a una fila de esta tabla**.
Es B.178.

**A2 es parcial, y conviene decir de qué.** La serie del 04/09 desde el chat midió
**propiedad y adopción** —tres filas, `storage_path` y `document_id`— no cifras
de hallazgo. Que el análisis nazca atado está medido; qué encuentra, no.

---

## FAMILIA B — EL DOCUMENTO LLEGA A UN MODELO, PERO NO SE PRODUCE ANÁLISIS

No escriben `analysis_results` y por eso no entran en la remedición por cifras.
Entran en el censo porque **el usuario no distingue** entre que le mientan en un
informe y que le mientan en una respuesta.

| # | camino | endpoint | sujetos | tanda |
|---|---|---|---|---|
| **B1** | CHAT · preguntar | `/api/ask` (1 cr) | **solo pertenencia** — el chat no nombra ids | **NO** |
| **B2** | CHAT · huecos de documentación | `/api/documentation-gaps` | corpus | **NO** |
| **B3** | MODAL · chat de mejora | `/api/improve` (1 cr) | el texto del modal | **NO** |
| **B4** | AGENTE · conversación | `search_docs`, `read_doc`, `list_docs`, `usage_stats` | corpus | **NO** |

⚠️ **B4 es el que más sorprende del censo.** El agente tiene cuatro herramientas
que tocan documentos y **ninguna aparece en ninguna tanda**. No ejecuta el
pipeline —se comprobó: no importa `runAnalysisPipeline` ni llama a `analyze-v2`—
pero es una superficie entera de producto donde el corpus llega a un modelo sin
que nadie haya medido qué llega.

---

## FAMILIA C — CAMBIAN LA PERTENENCIA AL CORPUS, SIN MODELO

Ningún LLM, ninguna cifra que contrastar. Se censan porque **deciden qué existe
para todos los caminos de arriba**: un fallo aquí no da un número malo, da un
corpus distinto. Es la familia de B.138 y del frente 3 entero.

| # | camino | qué escribe |
|---|---|---|
| **C1** | CHAT · confirmar «añádelo» | `/api/ingest` — vectores + fila, `analizado` |
| **C2** | CHAT · confirmar con HOMÓNIMO → reemplazar | `ingest` force: crear → conmutar → borrar |
| **C3** | MODAL · indexar versión corregida | `/api/index-text` (+ `replaceExistingId`) |
| **C4** | BANDEJA · marcar analizado | `mark-analyzed` — Pinecone primero, fila después |
| **C5** | BANDEJA / CHAT · retirar documento | `DELETE /api/documents` |
| **C6** | DRIVE · sincronizar | nuevos → `pendiente`; versiones → staged |
| **C7** | BANDEJA · aprobar / descartar staged | conmutación de generación |

C2 y C4 sí están medidos —el reemplazo por la pasada 3 de la remedición, que es
donde salió la regresión de Drive; `mark-analyzed` por el patrón efecto-espejo de
F-96— pero **C3, C6 y C7 no constan en ninguna tanda**.

---

## EL RECUENTO

**Diecinueve caminos: ocho, cuatro y siete.** Fable estimó doce a quince.

No es que la estimación fuera mala: **es la misma forma que el censo viene a
medir.** Se estimó desde los caminos conocidos, y los caminos conocidos son los
medidos. Los cuatro que sobran están donde estaba Mejora — en la parte no mirada.

Con tanda contra cifra de referencia, y sin ambigüedad de modo: **CERO de ocho en
la familia A.** Dos entradas traen cifra buena (15/15/2 y 2/2/0) y no se pueden
atribuir a una fila hasta que se resuelva B.178.

---

## LO QUE ESTE CENSO ENCONTRÓ SIN BUSCARLO

Se apunta aquí porque salió del censo, y se registra como pendiente propio:

· **B.177 — A6: el mismo fallo de B.175, sin arreglar, en la otra puerta.** El
  arreglo del 04/09 se colgó de `storagePath`, y **la bandeja abre el mismo modal
  sin `storagePath`** (`review/page.tsx:469`) y sin `documentoEnRevision`
  (`useCrossDocAnalysis:123-137`). Cero estructura por las dos vías. El botón se
  pinta **sin condición** (`ChatPanel.tsx:219`) y cobra los 30.

· **B.178 — las tandas declaran camino pero no MODO.** Desde ayer el camino es
  obligatorio en el registro; el modo no lo es, y sin él una cifra no se puede
  atribuir a un camino de este censo.

---

## LO QUE ESTE CENSO NO DICE

· **No dice si un camino funciona.** Dice si está medido. A3 y A4 aparecen con
  estructura ✓ porque el rescate de `document_chunks` está leído en el código —
  **no porque se haya visto emitir una diferencia de celda desde la bandeja**.
  Es lectura, no medición, y la regla del cero se aplica también aquí.

· **No cubre los caminos de administración** (`/api/admin/*`) ni los de equipo,
  facturación y preferencias. Se dejaron fuera a propósito: no llevan documentos.

· **No ordena por gravedad.** Ordenar es la pieza 3 del plan, y ordenar antes de
  contar es lo que F-103 vino a corregir.
