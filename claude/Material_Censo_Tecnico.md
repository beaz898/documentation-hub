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
   los tres ficheros del harness.
   ✅ **RESPONDIDO POR EL DIRECTOR (05/09): EL AGENTE ENTRA EN EL PILOTO** — es
   necesario para enseñar el potencial. **Sus cuatro caminos se quedan en la
   lista y dejan de ser condicionales.** Ya no es «∅ porque quizá no esté
   encendido»: es **∅ de una superficie que el cliente va a usar**, que es el
   peor de los dos ∅.

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
· ⚠️ **El AGENTE YA NO ESTÁ AQUÍ.** El director confirma el 05/09 que entra en el
  piloto. No sé aún dónde cae en el orden de contacto —depende de cuánto se
  empuje al cliente hacia él, y eso es de producto—, pero **sale de la lista de
  «no se pisa el primer día» y sus cuatro caminos siguen en los doce**.

---

# 4.3 · CIERRE DEL INVENTARIO — cómo quedan las doce con las tres respuestas

## Primero, un estado nuevo que hay que nombrar

La respuesta sobre el reemplazo por sincronización no cabe en los cuatro estados:
**se ejerció, pero contra un código que ya no existe**. Eso no es `e` —`e` dice
«ha corrido», en presente— ni es `∅`.

| `e†` | **EJERCIDO CONTRA CÓDIGO CADUCADO** | alguien lo recorrió, con una versión que ya se ha reescrito |
|---|---|---|

Vale más que `∅` y menos que `e`: **prueba que el camino se puede recorrer, no que
hoy haga lo que hacía.** Es el estado más engañoso de los cinco, porque en la
memoria de quien lo usó está como «probado».

## Las doce, cerradas

| # | entrada | estado | qué pasa con ella |
|---|---|---|---|
| 1 | **A6** — modal desde bandeja | `∅` + **roto** (B.177) | **se queda, arriba**: camino principal |
| 2 | **`index-text`** | `∅` + B.179 | **se queda, arriba**: cierra el flujo que el producto empuja |
| 3 | **staged** (aprobar/descartar) | ⚠️ **`e†`** | **se queda**: ejercido hace meses, código reescrito esta semana |
| 4-7 | **el AGENTE**, 4 caminos | `∅` | ✅ **se quedan y SUBEN**: el director lo mete en el piloto |
| 8 | **`csv`** | `∅` | **PROBAR** — ver abajo |
| 9 | **`json`** | `∅` | ✅ **DECLARADOS, no retirados** (director, 05/09) |
| 10 | **`html`** | `∅` | ✅ idem — duda que alguien los suba, prefiere no quitarlos |
| 11 | reserva de `docx` | `∅` | se queda, abajo: necesita un fichero roto |
| 12 | rama `default` | `∅` | se queda, abajo: no es un gesto de cliente |
| 13 | **OneDrive** | `∅` | se queda, abajo: UI apagada |
| 14 | extracción de prosa en la suite | `∅` | **se AMPLÍA** — ver B.181 |
| 15 | `analyze-style` / `improve` | `∅` + B.180 | se quedan |

Las «doce» son quince filas porque el agente son cuatro caminos y los formatos
tres. **Nada salió de la lista.** Una entrada mejoró de estado (staged, a `e†`) y
una empeoró de significado (el agente: de «quizá no esté encendido» a «el cliente
va a usarlo»).

---

# 4.4 · ⚠️ PROBAR O DECLARAR: la hipótesis del extractor compartido, medida

**La hipótesis es correcta en el extractor y falsa un `fork` después.** Y la
diferencia importa, porque es la que decide cuánto trabajo hay.

**Lo compartido es exactamente una línea.** `md`, `csv`, `json` y `html` caen en
el mismo `case` y devuelven `buffer.toString('utf-8')` sin tocar nada
(`chunking.ts:760-764`). Ahí la intuición es exacta: probar uno prueba los cuatro.

⚠️ **Pero divergen en el paso siguiente, y divergen del todo.** `chunkText`
pregunta si el texto tiene encabezados **markdown** —`HEADING_LINE_RE` es
`/^(#{1,6})\s/`— y bifurca:

- **`md` tiene `#`** → se va por secciones: `splitIntoSections` +
  `mergeSmallSections`, troceado por significado.
- **`csv`, `json` y `html` no tienen `#`** → caen en **«Caso 4: sin estructura
  detectable, corte por longitud de siempre»** (`chunking.ts:378`).

**Y `md` es el único de los cuatro con producción.** O sea: **comparten el eslabón
que no hace nada y se separan en el que decide.** La experiencia de `md` no cubre
a los otros tres — cubre la línea que da igual.

⚠️ **Y AL COMPROBARLO SALE ALGO MÁS GRANDE QUE LOS TRES FORMATOS.** El «caso 4» no
es la rama de `csv`: es la rama de **todo documento sin encabezados markdown, en
cualquier formato**. Un PDF de tablas, un `.txt` corrido, un `.docx` sin títulos
numerados que `normalizeNumberedHeadings` pueda convertir — todos van por ahí. Y
**`chunkText` no tiene ni un solo test**: es B.181.

## La recomendación, que se pedía explícita

**1 · PROBAR — pero el CASO 4, no `csv`.** Un test determinista sobre `chunkText`
con texto sin encabezados. Es función pura: encaja en la regla de vitest sin
rozarla. **No cubre tres formatos: cubre la mayoría del corpus real**, y es lo más
barato de esta lista.

**2 · PROBAR EN PRODUCCIÓN — `csv`, y solo `csv`.** Una tanda, con su predicción.
Es el único de los tres con probabilidad real de contacto (nº 3 del orden) y el
único donde **la expectativa del cliente se rompe**: sube una tabla y recibe prosa.
Los otros dos no prometen nada que no cumplan.

**3 · `json` y `html` — DECLARAR… o mejor, QUITARLOS.** Declarar es barato y
cierto: «se aceptan, se indexan como texto plano, no se extrae estructura», con su
contador (F-95).
⚠️ **Pero la regla de la casa prefiere la otra salida, y hay que ponerla sobre la
mesa**: F-102 dice que *lo que no debe ser candidato no se excluye, no se indexa* —
**una ausencia no se puede fallar; una declaración hay que acertarla cada vez, en
cada camino nuevo y el día que alguien añada uno sin saberlo**. Si el director dice
que ningún cliente va a subir un `.json` o un `.html`, **lo correcto no es
declararlos: es sacarlos de las cuatro listas**. Son dos líneas por lista y
eliminan la rama entera en vez de documentarla.
**Eso sí es del director y no mío**: yo puedo decir que la salida existe y que es
la que la casa prefiere; si alguien sube HTML, no.

---

# 4.5 · AÑADIDO EL 10/09/2026 — el botón de lote, ejercido sin cifra

**No entra en la tabla de «las doce, cerradas» de §4.3 a propósito**: aquélla es
un cierre con fecha y meterle una fila hoy la volvería una lista viva que dice
«cerrada». Va aquí, con la suya.

| entrada | estado | qué se sabe |
|---|---|---|
| **botón de añadir varios al corpus** (bandeja, `useIndexarSeleccion`) | **`e`** | ejercido en pantalla el 10/09/2026, en cuatro casos, los cuatro conformes al diseño |

**LOS CUATRO CASOS, porque «se probó» sin decir qué no es nada:**

1. **Selección limpia** — todos analizados y sin versión pendiente: el botón
   enciende y la tanda entra.
2. **Uno sin análisis** — el botón apaga y aparece su frase, con su recuento.
3. **Uno sin análisis MÁS otro con versión pendiente** — **las dos frases a la
   vez y visibles**. Es el caso que importaba: si solo saliera la primera, el
   usuario quitaría los sin-analizar, volvería a pulsar y chocaría contra el
   segundo motivo sin haberlo visto nunca.
4. **Un lote de varios** — recorre, no se para, y resume.

⚠️ **ES `e` Y NO `P`, y conviene no leerlo de más**: no hay cifra, no hay tanda
registrada, no hay comparación contra referencia. Hay una pantalla que hace lo
que dice. La suite cubre el criterio por debajo —`seleccionIndexable` y
`motivosDeNoIndexable` tienen sus casos, incluida la pareja bicondicional— pero
**lo que se pintó en la pantalla no lo cubre ningún test**: no hay tests de
componentes en el repositorio ni dependencias para tenerlos.

⚠️ **Y UNA MATIZACIÓN SOBRE EL GRADO, dicha sin inventar símbolo nuevo:** el `e`
de la escala es «consta que ha corrido, pero nadie apuntó qué salió». Éste es más
fuerte —**hubo un observador deliberado**, con cuatro casos elegidos de antemano y
un resultado esperado por caso—. Sigue sin ser `P` porque no hay cifra. Si algún
día conviene distinguir «corrió y nadie miró» de «alguien lo ejerció a propósito»,
ahí hay un grado que nombrar; hoy no se nombra, se anota.

**LO QUE ESTO NO DICE**: que el camino tenga guardián en el servidor. Uno de los
dos motivos por los que el botón apaga no lo tiene, y eso está a ficha aparte
(`Estado_Del_MVP.md` §5.6). Ejercer la pantalla no cierra ese hueco: lo confirma,
porque ahora el camino está pisado.

## AÑADIDO EL 11/09/2026 — la subida por referencia firmada, ejercida sin cifra

| entrada | estado | qué se sabe |
|---|---|---|
| **la subida desde el chat con `ref`** (B.204 commit 3, `99a4c450`) | **`e`** | ejercida en pantalla el 11/09/2026, en cinco gestos, los cinco conformes |

**LOS CINCO GESTOS, uno a uno**, porque «lo probé» sin decir qué no es nada:

1. **Subir un documento desde el chat** — el camino entero, con la petición de
   autorización nueva por delante de la subida.
2. **Los tres botones del aviso de análisis** — añadir al corpus, mejorar con IA
   (que el modal abra con el texto dentro) y análisis exhaustivo.
3. **Colisión de nombre y reemplazo** — el que ejercita la SEGUNDA vuelta de la
   indexación, que es donde la `ref` se pasa otra vez. Sin este gesto, un olvido
   ahí habría dejado el reemplazo entrando por el camino viejo, funcionando y
   mal.
4. **Reanalizar todo desde el modal de Mejora.**
5. **Cancelar y cerrar sin guardar** — que el temporal se borre y el mensaje de
   descartado salga igual.

⚠️ **ES `e` Y NO `P`, y aquí el aviso del grado vale doble**: la pantalla **no
distingue** si la petición entró por la `ref` o por el camino viejo. Si la `ref`
no hubiera llegado, los cinco gestos habrían salido igual de bien, en silencio,
por la lectura dual. Lo que sí lo distingue y se ve sin terminal es el nombre del
objeto en Storage: con el camino nuevo es `<marca de tiempo>-<uuid>`, **sin el
nombre del documento dentro**.

**Y EL SEXTO GESTO, EJERCIDO EL 11/09/2026**: los dos botones de «Estado del
despliegue» de `/api/admin/cleanup` (`6adb2e7f`), pulsados contra producción.
Copiado literal de lo que pintaron:

> «La variable llegó al runtime y es usable.» · entorno: production
> `ANALYSIS_TOKEN_SECRET` · presente: true · longitud: 72 · usable: true
> `success: true` · ref recibida (366 caracteres, **no se muestra**) · ruta: `3c628122-…`

⚠️ **SIGUEN SIENDO OTRA PREGUNTA, y por eso se anotan aparte de los cinco de
arriba**: aquéllos ejercen el CAMINO; éstos, la CONFIGURACIÓN. Uno puede estar
bien y el otro mal.

⚠️ **Y LO QUE EL BOTÓN CONSIGUIÓ Y LA CONSOLA NO, comprobado al usarlo y no al
proponerlo**: enseñar que la ref vino y cuánto mide **sin enseñarla**. Una ref es
una credencial —vale dos horas y abre una ruta—, y la línea de consola la habría
volcado entera en una pantalla que se fotografía y se comparte. Era el argumento
para hacerlo botón y resultó cierto en el primer uso; los 366 caracteres que
aparecen ahí son el recuento, no el contenido.

---

# 4.6 · ⚠️ LO QUE CRUZA ORGANIZACIONES — mapeado el 11/09/2026

**Escrito con este título para que se encuentre buscándolo.** La pregunta «¿qué
puede tocar datos de otra organización?» se contestó una vez mirando endpoint por
endpoint; sin dejarla escrita, el siguiente que la tenga que contestar la vuelve a
mirar entera.

**LA REGLA, y la cumple todo lo demás**: el `orgId` sale de
`resolveOrg(supabase, user.id)` y **nunca de la petición**. Todas las consultas
filtran `.eq('org_id', org.orgId)` y Pinecone está separado por *namespace* de
organización. Comprobado uno a uno en los endpoints de administración
(`cleanup-orphans`, `config`, `duplicates`, `tombstones`, `estado-del-corpus`,
`reindexar`, `reindexar-lote`, `diagnose-vectors`) y en el borrado de documentos
(`lib/delete-document.ts`, con `org_id` al leer y al borrar).

**LA ÚNICA EXCEPCIÓN, Y ES DELIBERADA**:

| pieza | dónde | cómo se autentica | qué alcanza |
|---|---|---|---|
| **`POST /api/admin/purge-expired`** | `app/api/admin/purge-expired/route.ts` | **NO por sesión.** Exige `Authorization: Bearer ${ADMIN_SECRET}` (`:21-25`), y devuelve 500 si la variable no está configurada | **TODAS** las organizaciones con `grace_period_ends_at` vencido y `purged_at` nulo. Llama a `purgeOrganization` para cada una: borra sus datos de Supabase, sus vectores y su usuario de Auth |

⚠️ **NO ES ALCANZABLE DESDE UN NAVEGADOR**, y eso es lo que lo hace aceptable: no
mira cookies, así que tener sesión —incluso de admin— no sirve de nada. Es el
cron de borrado, pensado para que lo llame el worker o un programador externo.

⚠️ **VIVE EN `app/api/admin/`, junto a las herramientas que sí son de sesión.** Ahí
está el riesgo de lectura, no de ejecución: quien abra esa carpeta buscando «lo
que usa el admin» se encuentra una pieza que no es de esa familia y que borra
organizaciones enteras. Por eso queda aquí escrito, y no sólo allí.

---

# 5 · EL MÓVIL — exploración del 05/09, en solo lectura

Pregunta del director, que no estaba en el censo. **La respuesta corta: el
inventario NO cambia — no hay ni un camino que en móvil llame a algo distinto.**

## 5.1 · ¿Código propio de móvil, o la misma interfaz adaptada?

**Las dos cosas, en tres capas**, y hay código que solo corre en móvil:

| capa | qué hay |
|---|---|
| **CSS** | dos bloques `@media` en `globals.css` (`:239`, `:271`) y doce clases `md:`/`sm:` sueltas |
| **Hooks propios** | `useMediaQuery` (46 líneas), `useVisualViewportHeight` —en **las siete** páginas autenticadas— y `useScrollFocusedInputIntoView`, que reacciona al teclado |
| **Componentes distintos** | `ConversationDrawer` (agente) e `ImprovementMobileNotice` |

El `viewport` está declarado en `layout.tsx:11` con `maximum-scale=1`, y las
alturas usan `visualViewport` con `100dvh` de reserva. **No es una web de
escritorio encogida**: alguien se sentó a pensar el móvil.

## 5.2 · ¿Qué se comporta distinto en pantalla pequeña?

Cinco sitios, y **ninguno esconde una función sin decirlo**:

- **Chat** — la barra lateral pasa a superponerse, con botón ☰ en `ChatHeader`.
- **Agente** — la barra lateral se convierte en `ConversationDrawer`, más una
  barra superior con ☰ y créditos.
- **`ConversationInput`** — se oculta la pista «Enter para enviar · Shift+Enter»
  (tres veces). Correcto: en un teléfono no hay ese gesto.
- **`ConversationSidebar`** — los botones de cada fila, que en escritorio salen al
  pasar por encima, **en móvil están siempre visibles** (`isHovered || isMobile`).
  Es el detalle que delata que esto se pensó: en táctil no hay «pasar por encima».
- **`AuthenticatedLayout`** — `overflow-y-auto` en móvil, `md:overflow-hidden` en
  escritorio.

## 5.3 · ⚠️ ¿Hay algún camino que en móvil llame a algo distinto? — **NO. CERO.**

Era la pregunta que más preocupaba —dos implementaciones del mismo gesto— y la
respuesta es limpia: **no hay ni un `fetch` gobernado por `isMobile`** en toda la
aplicación. Comprobado sobre `app/`, `components/` y `hooks/`.

La única divergencia real es que **el modal de mejora no se renderiza** en móvil.
Eso es **AUSENCIA, no una segunda implementación**: las llamadas no ocurren, no
ocurren de otra manera.

**Consecuencia para el inventario, que sí la hay:** cinco caminos son **de
escritorio** — A5, A6, A7, A8 y B3 (el chat de mejora). Y son la puerta principal.
No son caminos nuevos: son los mismos, con una condición de pantalla que hasta hoy
no estaba escrita en ninguna parte.

⚠️ **Y CONVIENE NO QUEDARSE EN «EL INVENTARIO NO CAMBIA», QUE ES LA MITAD
CÓMODA.** El mapa técnico no cambia; **lo que el producto puede prometer, sí.**
Un cliente que abra Doclity en el móvil **no puede hacer lo que el producto le
empuja a hacer** — sube un documento, se le ofrece «Mejorar con IA», y ahí se
acaba. Eso es una **CONDICIÓN DE PRODUCTO**, no un detalle de implementación, y
por eso va también en la lista de lo declarado del plan (§4, punto 7).

## 5.4 · ¿Algo apagado sin decirlo? — **No: apagado y DICHO**

`ImprovementModal.tsx:85` devuelve `ImprovementMobileNotice` antes de nada, con un
texto explícito (`es.json:311-313`): *«Mejora con IA, mejor en ordenador… Abre
este documento desde un ordenador para mejorarlo.»* Es un aviso, no un botón
muerto.

⚠️ **Con un matiz que conviene ver**: los botones que llevan ahí —«Mejorar con IA»
en `UploadActions` y en `ReviewActions`— **no saben nada del móvil** (cero
apariciones de `isMobile` en los dos). Así que en un teléfono el gesto se ofrece
igual y el aviso llega **después de pulsar**. Está dicho, pero tarde.

## 5.5 · Lo que sí merece anotarse (B.183)

**(a) Dos criterios de «móvil», implementados tres veces** — `useMediaQuery
('(max-width: 767px)')`, `window.innerWidth < 768` (`chat/page.tsx:64`) y
`@media (max-width: 768px)`. Los dos primeros son equivalentes; **el tercero
incluye el 768 y los otros no.**

**(b) `.hide-mobile` está definida y no se usa en ningún sitio.**

**(c) El `AppRail` no tiene variante móvil**: 64 px fijos (`w-16`) en toda
pantalla. En un teléfono de 375 px es el 17 % del ancho, permanente. No es un
fallo — es una decisión que nadie escribió.

## 5.6 · ⚠️ LO QUE ESTA EXPLORACIÓN **NO** DICE

**No he abierto la aplicación en un móvil.** Todo lo anterior es lectura de
código, y por la regla de la casa —«una exploración que verifica el productor no
ha verificado la funcionalidad»— eso **no dice si algo cabe en la pantalla**.

Y hay dos candidatas concretas a no caber, que se nombran para que se miren:
**la bandeja de revisión y `/settings/usage`** no tienen **ni una línea** de
código de móvil más allá del alto del viewport —cero `isMobile`, cero
`useMediaQuery`, cero clases responsive—, y las dos son pantallas de filas y
columnas. Que estén maquetadas con flex y sin anchos fijos juega a favor; **no lo
he visto**.

---

# LO QUE NO PUEDO APORTAR, Y ES DEL DIRECTOR

· ~~Si la organización piloto tiene plan Business.~~ ✅ **CONTESTADO 05/09: el
  agente entra en el piloto.** Sus cuatro caminos se quedan.
· **Si alguien ha guardado alguna vez una versión corregida** (C3 / `index-text`).
  El código existe; la evidencia de uso no está en el repositorio.
· ~~Si alguien ha aprobado un staged.~~ ✅ **CONTESTADO 05/09: sí, cuando se
  desarrolló la funcionalidad — no en las pruebas recientes.** Pasa a `e†`, y el
  código de entonces no es el de ahora.
· ~~Si `.json` y `.html` son formatos que un cliente vaya a subir.~~
  ✅ **CONTESTADO 05/09: el director DUDA que alguien los suba —son formatos de
  código, no de documentación— y aun así prefiere NO retirarlos. Quedan
  DECLARADOS.**
  ⚠️ Queda anotado lo que esa decisión compra y lo que cuesta, sin discutirla:
  compra que nadie se quede fuera por una lista corta; cuesta que la exclusión
  haya que **acertarla cada vez** —en cada camino nuevo, y el día que alguien
  añada uno sin saberlo—, que es justo lo que F-102 dice que una ausencia no
  puede fallar. **La declaración, por tanto, lleva contador**: si algún día entra
  un `.json`, hay que poder verlo.

· ✅ **Y EL LISTÓN, contestado el 05/09:** el piloto lo prueba el director antes
  que ningún cliente, **pero el listón no baja** — la medida es «cliente real».
  Es la que manda: por F-101, «hoy no hay cliente» es razón para no gastar en
  migrar lo viejo, **y no es razón para dejar una fuga abierta**.

Tres de las cuatro entradas de arriba dependen de esas respuestas. Por eso el
cruce es del usuario y no mío.
