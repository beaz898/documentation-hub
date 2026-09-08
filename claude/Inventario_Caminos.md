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
| **A1** | CHAT · subida → análisis | `storagePath, fileName` | **✓** binario | rápido | ✅ **MEDIDA 07/09** — ver nota 1 |
| **A2** | CHAT · subida → exhaustivo | `+ exhaustive` | **✓** binario | exhaustivo | ⚠️ parcial |
| **A3** | BANDEJA · analizar | `text, documentoEnRevision, batchDocumentIds` | **✓** rescate | rápido | ✅ **MEDIDA 08/09** — ver nota 2 |
| **A4** | BANDEJA · analizar exhaustivo | `+ exhaustive` | **✓** rescate | exhaustivo | ⚠️ ver nota 2 |
| **A5** | MODAL(chat) · Reanalizar todo | `text, storagePath, excludeFingerprints` | **✓** guarda B.175 | exhaustivo | ✅ **06/09** (4→15) · cuarentena |
| **A6** | MODAL(bandeja) · Reanalizar todo | `text` **y nada más** | ❌ **PLANO** | exhaustivo | **NO** · roto (B.177) |
| **A7** | MODAL(chat) · Reanalizar estilo | `text, storagePath` | n/a | — | **NO** |
| **A8** | MODAL(bandeja) · Reanalizar estilo | `text, documentoPropietario` | n/a | — | **NO** |

**Nota 1 — A1 YA TIENE TANDA, del 07/09/2026.** Hasta ese día no constaba
ninguna entrada que dijera «lanzada desde el chat, modo rápido»: la remedición
del frente 2 (02/09) fueron cinco pasadas en rápido, pero su maniobra de
aislamiento describe la BANDEJA.

**LA CIFRA, Y SU DENOMINADOR — que es la novedad y no la cifra.** OPE-10-A1
contra OPE-11, tres pasadas idénticas, modo **rápido** declarado:

| visión | |
|---|---|
| `tablas_analizado` · `filas_analizado` | **1 · 60** |
| `tablas_candidatos` · `filas_candidatos` | **1 · 60** |
| `pares_con_vision` | **1** |
| `pares_ciegos` · `ciegos_por_el_analizado` | **0 · 0** |

| reparto de filas | |
|---|---|
| discrepantes | **16** |
| idénticas | 19 |
| solo en A · solo en B | 25 · 25 |

**Las dos sumas cierran contra el denominador**, y por eso esto es una medición
y no una impresión: `16 + 19 = 35` filas emparejadas, y `35 + 25 = 60` a cada
lado, que es exactamente `filas_analizado` y `filas_candidatos`. Ninguna fila
se perdió por el camino y ningún lado estaba ciego.

**Las 16 son las 15 sembradas del caso 6 más una decimosexta creada a
propósito**: al preparar la pasada hubo que esquivar la guarda de duplicado
exacto y se cambió `DIA-01` de 40 a 55. Esa diferencia es real y el sistema la
encontró; no es un falso positivo. Y los `25 · 25` son las filas propias sin
pareja que el caso 6 exige **que no se fuercen**.

⚠️ **NO HIZO FALTA NINGÚN ARREGLO, y conviene que conste porque se estuvo a
punto de hacer uno.** Durante tres pasadas `tablas_analizado` pareció venir
NULL y se diagnosticó que el contador medía el ÍNDICE y que en el camino del
chat el documento no está indexado. **El contador ya contaba lo que decía.** La
consulta pedía `diff.vision.tablas_documento`, una clave que no existe en el
catálogo —la buena es `tablas_analizado`— y `->>` sobre una clave ausente
devuelve NULL, que se lee igual que un cero medido.

Lo que lo destapó no fue leer el contador otra vez, sino **abrir el consumidor**:
`analyze-v2:461` es `storedChunks ?? newDocChunks`, con un comentario que
explica que un documento sin indexar deriva sus chunks en memoria. Y la propia
medición ya lo negaba antes que el código: `emparejarTablas` es un bucle N×M
sobre las tablas del analizado, así que `pares 1` es imposible con cero tablas
de ese lado. **Un arreglo habría reconstruido algo ya construido** — la forma de
F-94, esta vez sobre nuestro propio diagnóstico.

**Nota 2 — A3 MEDIDA el 08/09/2026, con modo declarado.** Las dos entradas
viejas de la bandeja del 04/09 —el par grande (15/15/2) y la siembra (2/2/0)—
declaran el camino pero **no el modo**, y como A3 y A4 son código distinto esas
cifras siguen sin poderse atribuir a una fila de esta tabla. Es B.178, y sigue
abierto. Lo que cierra aquí es A3, con entrada propia.

**LA TANDA**: `OPE-14` contra `OPE-11`, modo **rápido** (5 créditos), 22:50.

| | |
|---|---|
| `tablas_analizado` · `filas_analizado` | **1 · 60** |
| `tablas_candidatos` · `filas_candidatos` | **1 · 60** |
| `pares_ciegos` | **0** |
| discrepantes · idénticas | **3 · 57** |
| `solo_en_a` · `solo_en_b` | **0 · 0** |
| `columnas_afectadas` · `variantes_escritura` | 1 · 0 |

**Encontró 3, confirmó 3, y son las tres sembradas** —`DIA-01`, `END-01`,
`PRO-01`— **ni una más**. `3 + 57 = 60`, que es `filas_analizado`: ninguna fila
se quedó fuera y ningún lado estaba ciego.

⚠️ **LA CIFRA SE PREDIJO ANTES DE GASTAR NADA.** Una sonda determinista corrió
`emparejarTablas` + `emitirDiffDeTablas` + `contadoresDeVision` sobre los dos
ficheros del repositorio —sin una sola llamada a un modelo, porque el diff de
tablas no la necesita— y dio 3/57/0/0 con la clave `Código`. **La tanda no
descubrió el número: lo confirmó.** Es la diferencia entre medir y mirar a ver
qué sale, y aquí sí se puede porque el mecanismo es determinista.

⚠️ **LO QUE ESTA TANDA NO MIDE, y hay que decirlo**: `solo_en_a` y `solo_en_b`
valen **0**, o sea que **no hay control negativo**. OPE-14 es copia de OPE-11 y
todas sus filas emparejan. El caso 6 lleva 25 filas sin pareja por lado
precisamente para comprobar que el sistema **no fuerza** emparejamientos; eso
aquí no se ha ejercido. A3 queda medida en DETECCIÓN, no en resistencia al falso
positivo.

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

---

## ⚠️ CORRECCIÓN A B.175 — SE CERRÓ CON LA MITAD MEDIDA (08/09/2026)

**B.175 está arreglado en A5 y NO está arreglado en A6, y hasta hoy el registro
no distinguía las dos mitades.** Quien lo leyera daba por cerrado el pendiente
entero.

**El arreglo SÍ existe y sigue en `main`**: `243c9f47` (04/09), verificado hoy
—`git merge-base --is-ancestor` da ancestro— y vivo en
`analyze-v2:251-262`, con su registro «estructura del original recuperada».
**No se ha perdido nada.**

**Lo que se verificó el 06/09**: OPE-10 contra OPE-11, de **4 a 15**
discrepancias, con el log diciendo 64 segmentos y 62 celdas. Maniobra: subir el
documento **por el chat** y abrir Mejora con IA desde ahí. **Eso es A5.**

**Lo que NO se verificó**: A6, el mismo modal abierto desde la **bandeja**.

| | quién abre el modal | `storagePath` | estado de B.175 |
|---|---|---|---|
| **A5** | `chat/page.tsx:253` — `storagePath={improvementTarget.storagePath}` | **sí** | ✅ arreglado y **medido** el 06/09 |
| **A6** | `review/page.tsx:469-482` — **0 apariciones** de `storagePath` | **no** | ❌ **B.177**, sin medir hasta el 08/09 |

⚠️ **Y NO ES UNA PROP OLVIDADA**, que es como se leía. `ImprovementModal.tsx:43`
dice por qué: *«ausente en documentos ya indexados (Drive): no hay archivo
temporal»*. Un documento de la bandeja **ya está indexado y no tiene fichero en
Storage al que apuntar**. La bandeja no deja de pasar algo que tiene: no lo
tiene. Por eso «que A6 mande `storagePath`» NO es el arreglo.

**El arreglo que sí cabe, y es un campo**: la bandeja ya le da al modal
`reviewedDocumentId` (`review/page.tsx:476`), el modal ya se lo pasa al hook
(`ImprovementModal.tsx:199`) y el hook lo usa para los descartes… **pero no lo
mete en el cuerpo de la petición**. Mandarlo como `documentoEnRevision` mete a
A6 por el rescate de `analyze-v2:313` — el mismo que A3 acaba de medir
funcionando el 08/09. Mecanismo probado, cero maquinaria nueva.

### ⚠️ LO QUE ENSEÑA, y es la forma de siempre

> **Una verificación correcta sobre una población más estrecha que la
> afirmación.** La medición del 06/09 no tuvo ni un fallo: el par, el número, el
> log, todo bueno. Lo que falló fue el ALCANCE de la conclusión — se midió *un*
> camino y se cerró *el pendiente*.

Y el detalle que lo hace reconocible la próxima vez: **las dos puertas son el
MISMO COMPONENTE**. `ImprovementModal` se ve idéntico desde el chat y desde la
bandeja —mismo botón, mismo texto, misma pantalla— y por eso «lo he probado en
el modal» sonaba a haberlo probado entero. **La pantalla no es el camino**, que
es literalmente el EJE 1 de este censo aplicado a quien lo escribió.

**La defensa no es medir más**: es escribir la población ANTES de medir. «Queda
verificado *para el modal*» y «queda verificado *para el modal abierto desde el
chat*» cuestan lo mismo de escribir y solo una es cierta.

· **B.178 — las tandas declaran camino pero no MODO.** Desde ayer el camino es
  obligatorio en el registro; el modo no lo es, y sin él una cifra no se puede
  atribuir a un camino de este censo.

· **B.198 — A6 cobra 30 y NO PUEDE PERSISTIR EL RESULTADO.** Medido en
  producción el 08/09: el reanálisis desde la bandeja se completó, enseñó
  hallazgos, cobró los 30 (devueltos después) y **no escribió fila**. Sin fila no
  hay `pipeline_counters`, así que la tanda que iba a estrenar los denominadores
  se quedó sin nada que leer. Es la familia de F-101 —*una operación que cuesta
  dinero deja registro en el momento en que se cobra*—, esta vez con el importe
  más alto del sistema.

---

## ⚠️ B.198 · LA MISMA OMISIÓN CAUSA LAS DOS AVERÍAS (08/09/2026)

La bandeja no manda `documentoEnRevision`. De ahí salen **las dos** cosas, y
por eso no son dos fichas:

| consecuencia | dónde | efecto |
|---|---|---|
| sin estructura | `analyze-v2:313` no rescata chunks | el diff recibe cero tablas → **0 de 3** |
| **sin propietario** | `sujetos.ts:82`: `documentoPropietario = enRevision` | el CHECK rechaza la fila → **sin contadores** |

`documentoAReemplazar` —que la bandeja SÍ manda— alimenta solo
`documentosExcluidos`. Nunca la propiedad. Es el reparto de F-100 haciendo
exactamente lo suyo.

### ⚠️ EL FALLO SE ESCONDE A SÍ MISMO, y esto es lo que hay que guardar

**El camino que no puede ver es el mismo que no puede dejar constancia de que no
vio.** No hay forma de medir A6-roto y que quede registrado: el único campo que
haría persistir la fila es el mismo que le devolvería la vista. **La medición de
la ceguera es imposible en principio, no cara.**

Por eso nadie lo cazó antes: **no deja fila de la que sospechar.** Una avería que
produce filas malas se ve en la analítica; ésta produce AUSENCIA, y la ausencia
no aparece en ninguna consulta que no la esté buscando a propósito.

### ⚠️ NO SE PIERDE A VECES: ESE CAMINO NO PUEDE PERSISTIR

**Ningún reanálisis desde la bandeja se ha guardado NUNCA desde que existe la
restricción.** No es intermitencia ni mala suerte: el propietario se derivaba
solo de `documentoEnRevision`, la bandeja no lo manda, y sin propietario la
fila la rechaza el CHECK **siempre**. Cien ejecuciones habrían dado cien
rechazos.

### ⚠️ EL CONTRASTE QUE LO HACE EVIDENTE: DOS BOTONES AL LADO, UNO FUNCIONA

En el **mismo modal**, a un centímetro el uno del otro:

| botón | qué manda | ¿guarda? |
|---|---|---|
| **Reanalizar estilo** (A8) | `useStyleAnalysis.ts:84` → `documentoPropietario: reviewedDocumentId ?? null` | ✅ **sí** |
| **Reanalizar todo** (A6) | `useCrossDocAnalysis.ts` → `text, fileName, exhaustive, excludeFingerprints, documentoAReemplazar, storagePath` | ❌ **no** |

**El de estilo guarda porque a ése se le pasó el propietario al construirlo.**
Mismo componente, mismo id disponible en el mismo ámbito, misma organización —
y uno lo pone en el cuerpo y el otro no. El caro es el que no lo pone.

⚠️ Y el id **ya estaba en la mano del que falla**: `useCrossDocAnalysis` lo
recibe como parámetro (línea 71) y lo manda a `/api/findings/dismiss` unas
líneas más abajo (línea 255). No era un dato que faltara: era un campo que no se
escribió. **Es un olvido, no una limitación**, y el contraste con el vecino es lo
que lo prueba — si fuera limitación, el de estilo tampoco podría.

### ⚠️ Y NO ES «LA BANDEJA»: SON LAS DOS RAMAS DEL MISMO BOTÓN

La primera redacción de esta ficha decía «el reanálisis desde la bandeja». El
botón es uno, pero **`reanalyzeAll` se bifurca por dentro** y solo una de las
dos ramas se miró:

| rama | `useCrossDocAnalysis.ts` | ¿avisa de que no se guardó? |
|---|---|---|
| **asíncrona** (job) | línea 175 · `setNoGuardado(!guardadoDeJob(job.guardado))` | **sí** |
| **síncrona** (fallback) | líneas 177-179 · no toca `noGuardado` | **NO** |

**El aviso que destapó B.198 vive solo en la rama asíncrona.** Por la síncrona,
un análisis que no se guarda no se lo dice a nadie: se enseña en pantalla como
cualquier otro y desaparece.

⚠️ **Y LA RAMA SÍNCRONA ES ALCANZABLE**, que es lo que la saca de «código
muerto»: A6 pide siempre exhaustivo, pero **con una versión `staged` en vuelo el
exhaustivo queda VETADO y se cae a rápido** (d-2b / F-8), y el rápido responde
en la misma petición. O sea, exactamente el caso de un documento a medio
reemplazar — que no es un caso raro, es el que la bandeja existe para gestionar.

### ⚠️ LO QUE ENSEÑA, y es de método, no de código

> **Di por buena una rama sin mirarla porque el síntoma apareció en la otra.**

El aviso de «no guardado» salió por la rama asíncrona, se investigó la rama
asíncrona, y la síncrona pasó sin que nadie la abriera — **no por descuido al
enumerar, sino porque el síntoma la dejó fuera del foco**. Es la hermana de la
corrección de B.175 del mismo día: allí una verificación correcta sobre una
población más estrecha que la afirmación; aquí una investigación correcta sobre
la rama que dio la señal, cerrada como si cubriera el botón entero.

**La forma común a las dos: el punto por donde entra el síntoma decide dónde se
mira, y no tiene por qué coincidir con dónde está el fallo.** La defensa es la
misma en ambos casos y es barata — al escribir la conclusión, nombrar la
población: «la rama asíncrona del botón», no «el botón».

⚠️ Queda ABIERTO: el arreglo de B.198 hace que la fila persista, así que el aviso
dejará de saltar por la rama asíncrona. **La rama síncrona sigue sin aviso**, y
ahora con menos probabilidad de que algo la delate.

### ⚠️ LO QUE ENSEÑA SOBRE LA RESTRICCIÓN, que es la parte importante

La restricción de F-101 —que ningún análisis nazca huérfano— **acaba de impedir
que se guarde el análisis más caro del sistema.** Y hay que leerlo al derecho:

> **La restricción hace exactamente lo que debe. Lo que falla es que ese camino
> no le da lo que necesita.**

**Lo primero que hace una invariante nueva es encontrar a quien ya la
incumplía.** El rechazo no es un efecto secundario de la restricción: es su
primer hallazgo, cobrado en el sitio correcto —al escribir— en vez de dejar otro
huérfano más en la tabla. Si la tentación algún día es relajar el CHECK para que
«no moleste», lo que se estaría comprando es volver a los dieciséis exhaustivos
inalcanzables de F-101.

⚠️ **Y LA ASIMETRÍA QUE HAY QUE VIGILAR**: la restricción avisó al ESCRIBIR, que
es tarde —el trabajo ya está hecho y cobrado—. Lo que no existe es una guarda que
lo diga ANTES: un camino que no puede persistir su resultado **no debería poder
cobrar**. Esa comprobación no está escrita, y es barata: los sujetos se conocen
en `analyze-v2:95-102`, mucho antes de `consumeCredits`.

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
