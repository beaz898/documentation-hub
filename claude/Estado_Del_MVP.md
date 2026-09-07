# Estado del MVP — 07/09/2026

Para decidir si esto se puede enseñar. **Sin plan: solo el estado.**

---

# 0 · ⚠️ LO QUE TODAVÍA NO HA CORRIDO — dos celdas, y se dicen primero

Este estado se pidió «cuando termine el lote y la reparación». **No han
terminado, y no voy a rellenar esas dos casillas con lo que espero que pase.**

| pendiente | por qué no ha corrido |
|---|---|
| **El control positivo con `new 9.txt`** | falta la consulta que dice si es manual o de OneDrive. Si es de la nube, da 501 y **hoy no hay control positivo** (B.195) |
| **El lote sobre el resto** | escrito y verificado, `6030125d`, **sin pushear y sin estrenar** |

**Todo lo demás de este documento está verificado hoy contra el código y el
registro**, no contra la memoria. Donde algo se ha comprobado abriendo un
fichero, va la línea.

---

# 1 · LAS TRES PIEZAS DE F-103 P3

| pieza | estado | evidencia |
|---|---|---|
| **1 · El inventario de caminos** | ✅ **HECHA** | `Inventario_Caminos.md`, cerrado el 05/09. Diecinueve caminos en tres familias — ocho que producen informe, cuatro del agente, siete que cambian el corpus |
| **2 · Los denominadores en los ceros** | ❌ **NO EMPEZADA** | `diff.vision.*` no existe: `grep` de `vision` en `lib/analysis/diff-emision.ts` da **cero**. Los contadores que hay son de clasificación, no de visión |
| **3 · Una remedición por camino** | ❌ **NO EMPEZADA** | **cero de ocho** de la familia A con cifra atribuible. Dos entradas traen cifra buena (15/15/2 y 2/2/0) y **no se pueden asignar a una fila** hasta que se resuelva B.178 |

⚠️ **Y la pieza 3 está bloqueada por la 2 por decisión propia**, no por
casualidad: el plan fijó que los denominadores van ANTES de cualquier remedición
que pueda dar cero, porque «una tanda sin denominador que salga cero no se puede
interpretar, y eso es gastar 30 créditos para no saber nada».

**Una de tres.** Y la que está hecha es la que no gasta créditos.

---

# 2 · LO QUE HA ENTRADO ESTOS DÍAS, Y POR QUÉ NO ESTABA EN EL PLAN

Del 04 al 07 de septiembre no se ejecutó el plan: se ejecutó **lo que el plan no
podía saltarse**. La regla que lo ordenó es de F-104 — *un cambio que altera lo
que queda guardado no entra hasta que exista la vía de reparación de lo ya
guardado* — y el disparador fue B.182, que resultó ser del ÍNDICE y no del modal.

## 2.1 · La vía de reparación, que no existía

| pieza | qué hace |
|---|---|
| **El lector del sello** | `estado-de-reparacion.ts` + `/api/admin/estado-del-corpus`. Antes, `extractor_version` se escribía en cuatro sitios y **no lo leía nadie** |
| **El contrato del sello** | escrito en la misma línea donde alguien lo va a tocar: *sube si y solo si cambia lo que el troceador produce* |
| **El plan** | `plan-de-reindexado.ts` — separa REPROCESAR de RE-TROCEAR, y rechaza lo que perdería celdas |
| **El escritor** | `/api/admin/reindexar` — reindexa **sin borrar**: generación nueva entera, conmutación, y la vieja sirviendo mientras tanto |
| **La lectura dual** | `lectura-dual.ts` — acepta segmentos o texto plano, con caducidad declarada |
| **La reparación enriquecedora** | lo que se lee para trocear **se vuelve a guardar**: un documento que entró sin segmentos sale con ellos y desde entonces se repara sin el proveedor |
| **El lote** | ocho por llamada, relanzable, y converge |

## 2.2 · El cambio que la exigía

**El cortador arreglado (B.182) y el sello a 3.** El arranque de cada trozo usa
ahora el mismo criterio que el final. Antes, seis de cada siete trozos de un CSV
abrían a media fila — no se perdía nada, **se añadía un dato plausible y falso**,
que es peor.

Y el sello subió, que es la primera vez que se ejerce el contrato. **Los 38
documentos del corpus pasan a «desactualizados» de golpe: no es una avería, es la
primera vez que el sistema puede decirlo.**

## 2.3 · Lo que se puede comprobar hoy y no se podía el 04

· **615 casos** en 48 ficheros, verdes, con `tsc` limpio. Hoy entraron 19.
· **La foto congelada del troceado** — cinco entradas sintéticas con su huella:
  si el cortador cambia, se sabe exactamente qué se movió.
· **Los segmentos persistidos**, con su coste medido (1,27×) y su condición de
  retirada escrita.
· **Cada reparación imprime y devuelve sus `ms`** — el denominador que no existía.

---

# 3 · LO QUE APARECIÓ SIN BUSCARLO

Ocho fichas nuevas en cuatro días. **No significa que el sistema empeore: significa
que se miró en sitios nuevos** (F-103, regla 3).

| ficha | qué es | estado |
|---|---|---|
| **B.182** | el cortador rompe filas — y es del ÍNDICE, no del modal | ✅ arreglado hoy |
| **B.191** | la guarda preguntaba «¿tiene trozos tabulares?» creyendo preguntar «¿tiene tablas?» | ✅ arreglado |
| **B.193** | un caso que fallaba una de cada cuatro veces por presupuesto de tiempo | ✅ arreglado, cazado en el acto a 5021 ms |
| **B.185** | la conmutación metía en el corpus documentos sin revisar | ✅ arreglado |
| **B.187** | cambiar la carpeta de Drive borraba el corpus de la anterior | ✅ arreglado (era latente) |
| **B.190** | cinco documentos con texto y sin trozos | 📋 medido: historia, no fallo vivo |
| **B.194** | la reparación no se puede probar antes del cambio que la exige | 📋 declarado |
| **B.195** | el plan prefiere la reparación COMPLETA a la DISPONIBLE: un documento de la nube con segmentos da 501 aunque re-trocearlo funcionaría | 📋 abierto, con la pregunta y sin solución |

---

# 4 · QUÉ BLOQUEA

Dos cosas, **las dos en la misma pantalla**, y las dos de la familia que el
cliente sufre — «el producto MIENTE al cliente», que es el peor escalón de F-100.

## ⚠️ 4.1 · B.177 — el reanálisis desde la bandeja analiza TEXTO PLANO y cobra 30

**Verificado hoy, abriendo los dos ficheros:**

· `app/(authenticated)/settings/review/page.tsx:469` abre `ImprovementModal`
  **sin `storagePath`**.
· `components/improvement/useCrossDocAnalysis.ts:123-137` manda `text`,
  `fileName`, `exhaustive` y `documentoAReemplazar` — y `storagePath: undefined`.

Sin `storagePath` y sin `documentoEnRevision`, `analyze-v2` trocea con
`chunkText`: **cero celdas, cero tablas emparejadas, el diff no emite nada.** El
juez sigue funcionando sobre texto aplanado, así que **el resultado no parece
roto: parece pequeño.**

Es exactamente el fallo de B.175 —el que motivó F-103 entero— **sin arreglar, en
la otra puerta**: el arreglo del 04/09 se colgó de `storagePath`, y esta puerta no
lo pasa. El botón se pinta sin condición y cuesta 30 créditos.

## ⚠️ 4.2 · B.180 — los dos botones que cobran no dicen lo que cuestan

**Verificado hoy:** `components/improvement/ReanalyzeButtons.tsx` y
`messages/es.json:245-247`. Ni la etiqueta ni el tooltip mencionan créditos:

> «Reanalizar estilo» → *«Volver a analizar solo el estilo del texto actual»* — **2 cr**
> «Reanalizar corpus» → *«Volver a analizar contradicciones y duplicados contra el corpus»* — **30 cr**

---

# 5 · QUÉ SE DECLARA

Contado y dicho, no escondido. **Ninguno de éstos bloquea; todos hay que poder
decirlos en voz alta si alguien pregunta.**

| declarado | dónde está escrito |
|---|---|
| **El modo Mejora, en cuarentena** | F-103: *«hoy no se le enseña a un cliente el modo Mejora — el resto sí, y la diferencia no es matiz»* |
| **Las tablas en PDF y CSV siguen partiéndose** | la opción A da filas enteras; la cabecera no se repite hasta la opción C |
| **Los 15 documentos de la nube no tienen vía de reparación** | responden 501. B.195 |
| **La puerta principal es de escritorio** | cinco caminos (A5-A8, B3) no existen en un teléfono — y son a los que el producto empuja al cliente |
| **`json`, `html`, OneDrive y la rama `default`** | `∅`: nunca probados por ninguna vía |
| **La extracción de prosa no tiene un solo test** | `pdf`, `docx`, `txt`. La batería cubre el TROCEADO, no la extracción |
| **El presupuesto de tiempo del lote es una estimación** | 180 s de los 300, con `parada: 'tiempo'` de contador |

---

# 6 · EL CRITERIO DE SALIDA, PUNTO POR PUNTO

Lo que el plan dijo que tendría que ser cierto «abriendo un registro»:

| # | lo que hay que poder demostrar | hoy |
|---|---|---|
| 1 | El inventario existe y es público | ✅ |
| 2 | La puerta principal medida por sus dos entradas, misma cifra | ❌ |
| 3 | Cada camino que produce informe, con cifra + camino + **modo** | ❌ cero de ocho |
| 4 | Cuando el sistema no ve algo, lo dice | ❌ pieza 2 sin empezar |
| 5 | Los dos botones que cobran dicen lo que cuestan | ❌ B.180 |
| 6 | Hay lista escrita de lo no probado, y no está escondida | ✅ |
| 7 | La condición de escritorio, escrita | ✅ |

**Tres de siete.** Y los cuatro que faltan son precisamente los que convierten
«creemos que funciona» en «está medido».

---

# 7 · EL VEREDICTO

**No, todavía no se puede enseñar a un cliente. Y falta poco, pero no es
cosmético.**

**Lo que bloquea son dos cosas, no diez**, y están juntas: el modal de mejora
cobra 30 créditos por un análisis estructuralmente ciego y no dice lo que cuesta.
Las dos son de la primera familia. **Arreglarlas es de días, no de semanas** — la
de los precios es texto; la de la estructura es pasar `storagePath` por una puerta
que ya lo tiene.

**Lo que se puede enseñar hoy, sabiendo lo que se enseña:** subir un documento,
preguntarle al chat, y la bandeja. Con dos avisos que no se pueden omitir — que
**el modal se queda fuera de la demo** (ya está en cuarentena por F-103) y que
**se enseña un camino no medido**: A1 y A3 no tienen cifra atribuible, así que lo
que se vea funcionar será una anécdota, no una medición.

⚠️ **Y la distinción que decide la pregunta**: enseñar es una cosa y **ponerlo
delante de un cliente es otra**. Para lo primero falta arreglar dos cosas. Para lo
segundo faltan las piezas 2 y 3 de F-103 enteras — que son las que permiten decir
la frase de la sala, y hoy no se puede decir: *«cada camino con su cifra, su
camino y su modo»* sigue siendo cero de ocho, exactamente como el 05/09.

**La buena noticia, y es real:** de los cuatro días que se han ido en algo que no
estaba en el plan, ha salido la vía de reparación entera. Sin ella, el arreglo del
cortador habría partido el parque en dos mitades sin forma de saber cuáles eran.
**Eso no era un rodeo: era la condición para poder tocar el índice.**
