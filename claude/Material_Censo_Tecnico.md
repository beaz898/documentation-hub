# Material técnico del censo — la enumeración desde el código

**04/09/2026 · SOLO LECTURA · mi mitad del reparto.** El director dice qué caminos
son reales; el cruce lo hace el usuario. Aquí no hay plan y no hay orden de
prioridad: solo lo que el repositorio dice, con su fichero y su línea.

> ⚠️ **CORRECCIÓN DEL 04/09, POSTERIOR A LA PRIMERA VERSIÓN DE ESTE FICHERO.**
> Escribí que `analyze-style` «se dispara con un `useEffect` al abrir el modal» y
> que «abrir el modal ya cuesta 2 créditos sin que nadie pulse». **Las dos cosas
> son falsas.** `useStyleAnalysis.ts` **no tiene un solo `useEffect`** — cero
> apariciones—: `reanalyzeStyle` es un `useCallback` que solo llama
> `handleReanalyzeStyle` (`ImprovementModal.tsx:392`), colgado del `onClick` del
> botón. Nadie cobra nada por abrir el modal.
> **De dónde salió el error**: mi primer `grep` sobre ese fichero llevaba
> `exhaustive` en el patrón y casó con el `eslint-disable` de
> `react-hooks/exhaustive-deps` de la línea 57 —que está sobre un `useMemo`—.
> Leí «deps» y escribí «efecto». **Es exactamente una premisa de riesgo escrita
> como hecho**, y de las que fallan en silencio: no había commit que la
> ejercitara. Lo corregido está marcado abajo; lo que la corrección deja en pie
> —que es una decisión de producto sin escribir— está en B.180.

## Los cuatro estados de prueba, y por qué son cuatro y no dos

La condición era distinguir producción de suite. Al aplicarla aparece un tercer
estado que no es ninguno de los dos, y es el que más filas ocupa:

| | estado | qué significa | qué NO significa |
|---|---|---|---|
| **P** | **MEDIDO EN PRODUCCIÓN** | hay tanda registrada con cifra contra referencia | — |
| **e** | **EJERCIDO SIN CIFRA** | consta que ha corrido —fila, log, incidente— pero nadie apuntó qué salió | que funcione |
| **S** | **SOLO SUITE** | tests deterministas verdes; nunca visto correr registrado | que se haya ejecutado nunca de verdad |
| **∅** | **NUNCA POR NINGUNA VÍA** | ni tanda, ni test, ni evidencia de ejecución | que esté roto |

⚠️ **`e` es la trampa**: se lee como «probado» y no lo es. `/api/ask` lleva meses
corriendo y no hay una sola cifra suya en el harness.

⚠️ **Y UNA ADVERTENCIA SOBRE LA COLUMNA `S`, que cambia cómo se lee toda la
tabla: la suite no prueba NI UN SOLO ENDPOINT.** No puede — la regla de vitest de
este proyecto prohíbe mocks, React, Supabase, Pinecone y Anthropic. Los 499 tests
en 38 ficheros prueban **módulos deterministas**: el emparejador, el diff, la
huella, las reglas, el troceado. Cuando abajo pongo `S`, quiero decir *«la
maquinaria que ese camino usa está probada»*, jamás *«ese camino está probado»*.

---

# 1 · ENDPOINTS, CON SUS MODOS

## 1.1 · Los que llaman a un modelo

| endpoint | modo | dónde corre | límite | coste | tasa/día | estado |
|---|---|---|---|---|---|---|
| `/api/analyze-v2` | **rápido** | Vercel | `maxDuration 120` | 5 cr | 30 | **P** |
| `/api/analyze-v2` | **exhaustivo** | crea job → **worker Railway** | worker sin límite | 30 cr (reembolso parcial) | 10 | **P** |
| `/api/analyze-style` | único | Vercel | `maxDuration 60` | 2 cr | 20 | **∅** ⚠️ corregido |
| `/api/improve` | único | Vercel | `maxDuration 120` | 1 cr | 50 | **∅** ⚠️ corregido |
| `/api/ask` | único | Vercel | **`maxDuration 30`** (`vercel.json`) | 1 cr | 100 | **e** |
| `/api/agent/conversations/[id]/message` | conversacional | Vercel | — | **por tokens**, estimado + reconciliado | — | **∅** ⚠️ |

**El modo del exhaustivo no es un parámetro: es otro binario.** `analyze-v2`
llama a `runAnalysisPipeline`; el worker llama a `runExhaustiveAnalysisPipeline`
(`worker/src/index.ts:2`), se despliega aparte y no comparte el
`maxDuration` de Vercel. Una cifra medida en rápido no dice nada del exhaustivo.

**`/api/ask` tiene 30 segundos y ninguno de los demás.** Es el presupuesto más
corto del sistema y el camino más usado.

⚠️ **El agente está detrás de `features.hasAgent`** —plan Business
(`agent/conversations/route.ts:29`)—. **Si la organización piloto no es
Business, el agente no ha corrido nunca**, y eso lo sabe el director, no yo. Es
la primera pregunta del cruce.

⚠️ **CORRIJO EL CENSO DE ESTA MAÑANA**: puse `/api/documentation-gaps` como
camino que lleva el documento a un modelo. **No llama a ningún modelo.** Son 54
líneas que insertan pregunta/respuesta en `documentation_gaps` — sin créditos,
sin LLM, sin corpus. Sale de la familia B.

## 1.2 · Los que mueven el corpus sin modelo

| endpoint | límite | valida extensión | estado |
|---|---|---|---|
| `/api/ingest` | `maxDuration 300` | **sí**, nueve extensiones (`:84`) | **P** |
| `/api/index-text` | `maxDuration 300` | no aplica (recibe texto) | **∅** |
| `/api/drive/sync` | `maxDuration 300` | por mimeType (`ALLOWED_MIME_TYPES`) | **e** |
| `/api/documents/[id]/mark-analyzed` | — | — | **e** (deducción) |
| `/api/documents/[id]/discard-staged` | — | — | **∅** |
| `/api/extract-text` | `maxDuration 60` | no | **e** |
| `DELETE /api/documents` | — | — | **e** |

⚠️ **`analyze-v2` NO valida extensión.** Cero apariciones de `allowedExtensions`
en ese fichero. `ingest` la valida y él no: **le puede llegar cualquier cosa que
haya en Storage**, y la rama `default` de `extractSegments` la leerá como UTF-8.

---

# 2 · COMPONENTES QUE DISPARAN ANÁLISIS

Ocho disparadores. Los dos que importan son los que **se disparan solos**.

| componente | fichero:línea | qué dispara | cómo se dispara |
|---|---|---|---|
| `useDocuments` (chat) | `useDocuments.ts:120` | `analyze-v2` rápido | al soltar el fichero |
| `useDocuments` (chat) | `useDocuments.ts:254` | `analyze-v2` exhaustivo | botón, tras el rápido |
| `useReviewAnalysis` | `useReviewAnalysis.ts:68` | `analyze-v2` rápido **o** exhaustivo | botón de la bandeja, **en bucle** |
| `useCrossDocAnalysis` | `useCrossDocAnalysis.ts:117` | `analyze-v2` **siempre exhaustivo** | «Reanalizar todo» |
| `useStyleAnalysis` | `useStyleAnalysis.ts:71` | `analyze-style` | **`onClick` del botón**, y solo eso |
| `useImprovementChat` | `useImprovementChat.ts:110` | `improve` | mensaje del usuario |
| `DocGapButton` | `DocGapButton.tsx:24` | `documentation-gaps` | **no llama a un modelo** |
| `useIndexing` | `useIndexing.ts:54` | `index-text` | «Guardar versión corregida» |

⚠️ **`useStyleAnalysis` NO se dispara solo** —ver la corrección de la cabecera—,
y al comprobarlo aparece algo que sí es cierto y es más interesante: **de dónde
salen los problemas de estilo que el modal enseña al abrirse.** No de este
endpoint, sino de `analysis.styleProblems`, que produce **el pipeline
EXHAUSTIVO** (`pipeline.ts:1129`).
**Y el rápido no hace estilo**: `runAnalysisPipeline` solo llama a
`runCorePipeline` (`:1096`). Luego un modal abierto tras un análisis rápido
—el camino más común— **enseña la sección de estilo vacía, con un botón al lado
que cuesta 2 créditos**. Eso no es un cobro oculto: es un botón sin precio, y es
B.180.
Su estado corregido es `∅` y no `e`: el `e` lo sostenía la premisa falsa. **Cero
apariciones de `analyze-style` en los tres ficheros del harness**, y ninguna
evidencia de que se haya pulsado nunca. Lo mismo vale para `/api/improve`.

⚠️ **`ReanalyzeButtons` se pinta sin condición** (`ChatPanel.tsx:219`), y el
modal se abre desde dos sitios con cuerpos distintos. Es B.177.

⚠️ **El bucle de la bandeja es el único disparador que analiza N documentos con
una pulsación** (`useReviewAnalysis.ts:126`), construyendo `batchDocumentIds` por
documento. Es el único sitio donde un fallo se multiplica por el tamaño de la
tanda.

---

# 3 · TIPOS DE FICHERO, POR RAMA DE EXTRACCIÓN

`extractSegments` (`chunking.ts:753`) — **cinco ramas para nueve extensiones**.
Es el eje 1 del censo, visto desde el otro lado.

| rama | extensiones | qué produce | ¿celdas? | suite | producción |
|---|---|---|---|---|---|
| **Excel** `:784` | `xlsx`, `xlsm` | `table_summary` + `table_row` con `cells` | **SÍ** | **S** ✓ | **P** |
| **docx** `:772` | `docx` | un `text` (mammoth → markdown, con reserva) | no | **∅** | **P** |
| **pdf** `:769` | `pdf` | un `text` | no | **∅** | **P** |
| **txt** `:766` | `txt` | un `text`, normalizado | no | **∅** | **P** |
| **cruda** `:760` | `md`, **`csv`**, `json`, `html` | un `text`, `buffer.toString()` **sin tocar** | no | **∅** | `md`: **P** · resto: **∅** |
| **default** `:788` | cualquier otra | un `text` UTF-8 | no | **∅** | **∅** |

**LO QUE ESTO DICE, y es la frase que resume el punto 3: de nueve extensiones,
solo DOS producen estructura de tabla.** Todo el aparato del diff —
`emparejarTablas`, `table-key`, `table-diff`, `puntero-de-fila`, el
`cubierto_por_diff`— **existe únicamente para Excel**. Para las otras siete solo
trabaja el juez.

⚠️ **`csv` cae en la rama cruda, junto a `json` y `html`.** Un CSV **es** una
tabla y **no produce ninguna tabla**: se indexa como un churro de texto. Además
`html` entra con sus etiquetas dentro, sin limpiar. Ninguno de los tres consta
en ninguna tanda ni en ningún test: **`csv`, `json` y `html` son `∅` puro**, y
los tres están en el `accept` del selector de ficheros
(`DocumentsSidebar.tsx:753`) y en la lista de `ingest`.

**Lo que la suite prueba de verdad aquí**: extracción real de **`.xlsx` y de
nada más**. `chunking.test.ts:19` y `cascada-emparejamiento.test.ts:82` leen
ficheros del corpus con `readFileSync`, y **los dos leen `.xlsx`**. No hay un
solo test que meta un `.pdf`, un `.docx`, un `.txt` o un `.md` por
`extractSegments`. Los `'tarifa.pdf'` y `'escaneado.pdf'` que aparecen en los
tests son **nombres**, no ficheros.

**Lo que producción sí ha ejercido**, por el corpus de las tandas: `.docx`
(NOR-10, CLI-12, NOR-11, CLI-13, MKT-01), `.pdf` (NOR-01), `.txt` (CLI-03),
`.md` (SIEMBRA_\*). Ejercido y en varios casos medido — **pero por el juez, que
es la única rama que les aplica**.

## 3.1 · Drive convierte antes de extraer, y conserva la estructura

`google.ts:173-207`. Google Doc nativo → export `text/plain` → **`ext = 'txt'`**.
Google Sheet nativo → export **a XLSX y no a CSV**, a propósito y con el motivo
escrito: el CSV solo devuelve la primera hoja. **Un Sheet nativo conserva las
celdas.** Es la única conversión del sistema que protege la estructura, y está
razonada en el código.

## 3.2 · La versión corregida pierde la estructura, y está escrito

`index-text/route.ts:176` envuelve el texto en **un único segmento `'text'`**,
con el comentario «sin campos de tabla». Es deliberado y es correcto —el texto ya
lo editó una persona, las celdas no se pueden reconstruir—.

⚠️ **Lo que no está escrito en ninguna parte es la consecuencia encadenada**: los
`document_chunks` de ese documento quedan sin tipar **para siempre**, y el rescate
del que dependen A3 y A4 (`analyze-v2:~310`) le devolverá chunks de texto. **Un
Excel corregido por el modal deja de tener diff de tablas en la bandeja**, y no
hay ningún aviso. No lo apunto como pendiente: lo dejo aquí para el cruce, porque
depende de si C3 es un camino real.

---

# 4 · QUÉ COMBINACIONES TIENEN MEDICIÓN, Y CUÁLES NO

Las ocho filas de la familia A del censo, cruzadas con los cuatro estados.

| # | camino | producción | suite | evidencia |
|---|---|---|---|---|
| A1 | CHAT · subida → rápido | **e** | S | remedición frente 2 (02/09): cinco pasadas en rápido, **pero su maniobra describe la bandeja** |
| A2 | CHAT · subida → exhaustivo | **P parcial** | S | serie 04/09: mide **propiedad y adopción**, no cifras de hallazgo |
| A3 | BANDEJA · rápido | **P?** | S | par grande 15/15/2 y siembra 2/2/0 — **modo no declarado** (B.178) |
| A4 | BANDEJA · exhaustivo | **P?** | S | idem: la cifra existe, la fila a la que pertenece no |
| A5 | MODAL(chat) · reanalizar | **e** | **S** ✓ | job `1c7bcfe6`: 4/4 — **es la medición del fallo**, no una línea de base |
| A6 | MODAL(bandeja) · reanalizar | **∅** | ∅ | B.177 |
| A7 | MODAL(chat) · estilo | **e** | ∅ | se dispara solo; cero cifras registradas |
| A8 | MODAL(bandeja) · estilo | **e** | ∅ | idem |

`S` en A1–A5 es la maquinaria: `diff-emision.test.ts` demuestra que OPE-10 contra
OPE-11 da **quince** discrepancias con el reparto sembrado, encadenando
emparejador → emisión → synthesize → JSON → `problemsFromAnalysis`. **Eso está
probado y es sólido.** No prueba que el endpoint le entregue lo que necesita —
que es exactamente lo que falló en B.175.

`S` ✓ en A5 es distinto y por eso lleva marca: `estructura-del-modal.test.ts`
prueba **la guarda misma**, no solo la maquinaria de debajo.

---

# 4.1 · ⚠️ LA LISTA QUE DECIDE LAS DOS SEMANAS: NUNCA, POR NINGUNA VÍA

Ni tanda, ni test, ni evidencia de que haya corrido. **Doce.**

⚠️ **Y LA FRASE QUE HAY QUE LLEVARLE AL DIRECTOR, porque es lo que la lista
significa y no se ve leyéndola de arriba abajo: NO SON DOCE AGUJEROS SUELTOS.
SON DOCE CON EL PRINCIPAL DENTRO.**
Las entradas 1, 2 y 12 son **la misma superficie** —el modal de mejora—, y esa
superficie no es una función lateral: es **a la que el producto empuja al cliente
en cuanto sube un documento con problemas**. `hasIssues` abre el modal de
decisión y ofrece «Mejorar con IA» (`UploadActions.tsx:71`); la bandeja ofrece el
mismo botón (`ReviewActions.tsx:162`). Las dos puertas del producto llevan al
mismo sitio, y ese sitio está entero en esta lista.
Dicho de la forma en que cambia la prioridad: **el problema no es que falten doce
caminos por medir — es que el camino PRINCIPAL es uno de ellos**, y lleva dentro
un fallo confirmado (B.177), otro deducido (B.179) y un botón sin precio (B.180).
Los otros nueve son periferia real; éste no.

**Caminos completos (4)**
1. **A6** — MODAL(bandeja) · Reanalizar todo. Además **roto** (B.177).
2. **`/api/index-text`** — guardar la versión corregida. Cero en el harness.
3. **`/api/documents/[id]/discard-staged`** y la aprobación de staged — la
   conmutación de generación del versionado de Drive.
4. **El AGENTE entero** — cuatro herramientas sobre documentos
   (`search_docs`, `read_doc`, `list_docs`, `usage_stats`), cero apariciones en
   los tres ficheros del harness. **Condicionado a que el piloto sea Business**:
   si no lo es, el `∅` es total y no es una omisión, es que no existe todavía.

**Ramas de extracción (3)**
5. **`csv`** — se acepta en la subida, y **una tabla entra como churro de texto**.
6. **`json`** — igual.
7. **`html`** — igual, y con las etiquetas dentro.

**Ramas de fallo y bordes (3)**
8. **La reserva de `docx`** (`chunking.ts:779`) — `extractRawText` cuando
   `convertToMarkdown` falla. Un `catch` que nadie ha visto entrar.
9. **La rama `default` de `extractSegments`** — alcanzable porque `analyze-v2`
   **no valida extensión**.
10. **OneDrive** — implementado, UI deshabilitada, y con **un documento absorbido
    en producción** (B.154). Cero pruebas por cualquier vía.

**Combinaciones que existen y no se han cruzado (2)**
11. **Cualquier análisis con `.pdf`, `.docx`, `.txt` o `.md` en la SUITE.** En
    producción sí; por la suite, ni uno. La extracción de cuatro de las cinco
    ramas no tiene una sola prueba determinista.
12. **`/api/analyze-style` y `/api/improve`.** ⚠️ **CORREGIDO**: los daba por
    ejercidos porque creí que el estilo se disparaba solo. **No se dispara.** Los
    dos cuelgan de un gesto explícito del usuario —el botón y el mensaje del
    chat— y no hay ninguna evidencia de que ese gesto se haya hecho nunca: cero
    apariciones en `Tandas_Harness.md`, `Casos_Harness.md` y
    `Protocolo_Harness_Tasas.md`. **Son `∅` como los otros once**, y con la
    corrección la lista queda por fin homogénea: los doce lo son de verdad.
    Quien puede desmentirlo es quien estuvo delante de la pantalla, no yo.

---

# 4.2 · ⚠️ EL ORDEN DE CONTACTO — qué pisaría un cliente el primer día

No es el orden de riesgo técnico. Es la probabilidad de que **alguien lo toque**,
que es otra pregunta y da otra lista.

⚠️ **Y LA CONCLUSIÓN VA ANTES QUE LA LISTA, porque es lo que la lista significa:
las TRES primeras son la misma superficie — el modal de mejora.** Lo que está en
cuarentena no es una función accesoria: **es el primer sitio al que el producto
manda al cliente.** Un análisis con `hasIssues` abre el modal de decisión y
ofrece «Mejorar con IA» (`UploadActions.tsx:71`), y la bandeja ofrece el mismo
botón (`ReviewActions.tsx:162`). Las dos puertas empujan al mismo sitio.

⚠️ **ESTE ORDEN ESTÁ REHECHO TRAS LA CORRECCIÓN.** En la primera versión
`analyze-style` era el número 1 «por certeza, no por probabilidad», y esa certeza
no existía. Baja al 4, y lo que era su argumento —que se ejecuta sin que nadie
decida— **desaparece de la lista entera**: hoy no hay ni un solo camino de pago
que se dispare sin un gesto del usuario. Es una buena noticia que solo aparece al
corregir el error.

**1 · `index-text` — el final del único flujo que el producto empuja.** (entrada 2)
Si el modal es la acción recomendada, «guardar la versión corregida» es como
termina. Es el camino que **cierra** el gesto que el producto sugiere, y es `∅`:
ni tanda, ni test, ni evidencia de haber corrido. **Y ahora lleva B.179 colgando.**

**2 · A6 — el mismo botón, desde la puerta por la que entran los documentos.** (entrada 1)
Quien conecte Drive se encuentra la bandeja llena; abrir uno y pulsar «Reanalizar
todo» es el gesto natural. **Hoy está roto** (B.177) y cobra 30 créditos por una
fracción silenciosa.

**3 · `csv` — el formato que sale de cualquier otro sistema.** (entrada 5)
Está en el `accept` del selector y en la lista de `ingest`. Un cliente que exporte
de su ERP, de su CRM o de su gestor de turnos produce CSV sin pensarlo. **Y es
donde el daño es total y mudo**: un CSV es una tabla y entra por la rama cruda
como un churro de texto, sin una sola celda.

**4 · `analyze-style` — el botón que rellena una sección vacía.** (entrada 12)
Ya no es certeza, pero sigue arriba, y por una razón que solo se ve al mirar de
dónde vienen los problemas de estilo: **el pipeline rápido no los produce**. Quien
abra el modal tras un análisis rápido —el camino común— ve la sección de estilo
vacía y un botón «Reanalizar estilo» al lado. **El diseño invita a pulsarlo**, y
el botón no dice que cuesta 2 créditos (B.180).

## Y las que NO se pisan el primer día, dicho para que no ocupen sitio

· **OneDrive** — la UI está deshabilitada. Solo se llega por un accidente como el
  de B.154, no por uso.
· **La rama `default`** — necesita una extensión fuera de las nueve, y el
  selector de ficheros no la deja elegir. Se llega por `analyze-v2`, que no
  valida — pero eso no es un gesto de cliente.
· **La reserva de `docx`** — necesita un `.docx` que rompa a mammoth. Ocurrirá;
  no el primer día.
· **`json` y `html`** — aceptados, improbables. `html` antes que `json`, si acaso:
  alguien puede volcar una wiki.
· **El AGENTE** — no lo decide la probabilidad sino el plan. Si el piloto no es
  Business, no es que sea improbable: **es que no está encendido.**

---

# LO QUE NO PUEDO APORTAR, Y ES DEL DIRECTOR

· **Si la organización piloto tiene plan Business**, que decide si el agente es
  un camino real o una funcionalidad aún no encendida.
· **Si alguien ha guardado alguna vez una versión corregida** (C3 / `index-text`)
  o **aprobado un staged** en producción. El código existe; la evidencia de uso
  no está en el repositorio.
· **Si `.csv`, `.json` y `.html` son formatos que un cliente vaya a subir.**
  Están en el `accept` y en la lista de `ingest`; que estén aceptados no
  significa que sean reales.

Tres de las cuatro entradas de arriba dependen de esas respuestas. Por eso el
cruce es del usuario y no mío.
