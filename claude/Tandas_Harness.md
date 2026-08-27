# Tandas del harness de tasas

Histórico de mediciones. **Crece por arriba: lo más reciente, primero.**

El protocolo —los cinco casos, cómo se lanzan, qué se apunta— está en
`claude/Protocolo_Harness_Tasas.md`. **Este fichero no lo repite**: aquí solo van
las cifras.

Al leer una tasa, mirar siempre contra qué commit se midió. Y recordar que
«línea de base» significa cosas opuestas en `Cierre_B81.md` (el síntoma, ANTES
de la cura) y en los relevos (el estado sano, DESPUÉS) — la advertencia está al
principio del protocolo.

---

## 27/08/2026 — `8cf73e23` — CASO DE CONTROL NOR-11 / CLI-13

**Qué se lanzó**: el par de prosa del caso de control, con el bloque del
verificador (F-77) ya desplegado. *Hora exacta no anotada; posterior a la tanda
que sigue.*

**La pregunta**: la de B.105. El ejemplo del bloque es «mismo rol, dos personas»,
que es el mismo objeto que la siembra A. Si solo se movía la A, el acierto sería
circular — el modelo aplicando un ejemplo casi idéntico, no el mecanismo. Este
par existe para preguntar si **generaliza a superficies que el bloque no enseña**.

| # | Contradicción sembrada | Superficie | Resultado |
|---|---|---|---|
| 1 | Plazo: **72 h** frente a **7 días** | dos cifras de tiempo enfrentadas | **CONFIRMADA** |
| 2 | Lugar: **Chamberí** frente a **Retiro** | dos topónimos | **CONFIRMADA** |
| 3 | Negación categórica sobre el contenedor negro | una prohibición frente a una autorización | **EL JUEZ NUNCA LA EMITE** |

### EL BLOQUE GENERALIZA. La pregunta de B.105 queda contestada

**Dos superficies nuevas, ninguna sobre roles ni personas, confirmadas.** Un
plazo y un topónimo no se parecen al ejemplo del prompt («la responsable del área
es Ana Ruiz» frente a «es Beatriz Soler»): lo único que comparten con él es el
mecanismo —mismo dato, dos valores—, que es exactamente lo que el bloque enseña.

Es la respuesta que este par existía para dar, y es afirmativa. La sospecha de
circularidad anotada en B.105 queda descartada **para el verificador**.

**Lo que NO contesta**: la tercera no llega a medirse aquí, porque **el juez no
la emite**. Eso es un techo anterior al verificador y tiene pendiente propio —
ver **B.106**: en documentos de 4 y 5 páginas el juez devuelve exactamente una
contradicción por par, y no es la selección.

---

## 27/08/2026 — `8cf73e23`, logs 12:04–12:31 UTC — EL BLOQUE DEL VERIFICADOR (F-77)

**Qué se lanzó**: cuatro pasadas, modo rápido desde la bandeja, con el bloque
nuevo de `verify-findings.ts` desplegado.

> **⚠️ MARGEN DE DESPLIEGUE SIN CERRAR, y ya no se puede cerrar.** El push de
> `8cf73e23` fue a las **11:59:48 UTC** (reflog de `origin/main`) y la tanda
> arranca a las **12:04 UTC**: **4 min 12 s**. No se comprobó a tiempo la hora de
> «Ready» del deployment en Vercel ni el redeploy del worker en Railway. Si
> alguno terminó después de 12:04, las primeras pasadas midieron el prompt viejo.
>
> **QUÉ ACOTA ESE MARGEN, Y QUÉ NO.** Las pasadas 1 y 3 corrieron con **el mismo
> código, fuera el que fuera**: doce minutos separan una de otra, dentro de la
> misma ventana. Así que **la diferencia entre ellas no puede atribuirse al
> despliegue** — se explica por las citas distintas, que es lo que dice la
> sección siguiente. El margen afecta a **si el bloque estaba vivo en absoluto**,
> no a la comparación entre las dos pasadas, que es de donde sale la conclusión
> de esta entrada.

| # | Qué entró | Resultado |
|---|---|---|
| 1 | **NOR-10 / CLI-12 solos** | Siembra A **DESCARTADA** (`mismo_dato_sin_oposicion`). Hallazgo `[04ed1945]` |
| 2 | **CLI-03 / NOR-01** (control de regresión) | **Confirmado en todas las pasadas.** El acierto histórico de prosa sigue vivo |
| 3 | **Los CINCO juntos**: NOR-10, CLI-12, CLI-03, NOR-01 y MKT-01 | Siembra A **CONFIRMADA**, dos pasadas. Hallazgo `[9b37aa92]` |
| 4 | **MKT-01** | **Cero hallazgos** |

> **CINCO Y CUATRO NO SE CONTRADICEN, cuentan cosas distintas.** En la pasada 3
> hay **cinco documentos en la tanda**, y el log de cada análisis dice **«4 ids
> de tanda»**: son los **compañeros** de ese análisis, es decir, los otros cuatro
> vistos desde el documento que se está analizando. Cinco en la tanda, cuatro
> compañeros para cada uno. Las dos cifras son correctas.

### EL MATIZ QUE MANDA: no es el mismo hallazgo

**Los hashes son distintos.** En la pasada 1 el hallazgo es `[04ed1945]` y muere;
en la 3 es `[9b37aa92]` y sobrevive. El hash se calcula sobre las citas crudas
(F-38), así que **hashes distintos significa citas distintas**.

> **El bloque NO rescató el par de citas de la pasada 1. Confirmó OTRO par**, que
> apareció porque con los cinco documentos en la tanda el retrieval trajo
> fragmentos distintos de NOR-10 — entró el **chunk 2, score 0,932**.

Leerlo como «el bloque arregla la siembra A» sería exactamente el error que la
advertencia de F-73 describe: atribuir a la etapa que se tocó un cambio que
produjo otra. Lo que estas cuatro pasadas dicen, con precisión:

- **El bloque funciona cuando le llegan las citas buenas.** La pasada 3 lo
  demuestra, y el caso de control NOR-11/CLI-13 lo confirma sobre superficies que
  el bloque no enseña.
- **Qué citas llegan lo decide la SELECCIÓN**, y eso no lo toca F-77. La misma
  contradicción, en el mismo par de documentos, produce citas verificables o no
  según qué fragmentos de NOR-10 entren — y eso depende de **con qué compañía se
  lance la tanda**: dos documentos en la pasada 1, cinco en la pasada 3. Es una
  variable que nada en el sistema controla y que el cliente no ve.
- Es la confirmación, ahora sobre prosa, de lo que el análisis de F-76 dejó
  dicho: **en prosa larga el cuello es la selección**, no la verificación.

**Lo que NO afirma**: que la siembra A esté detectada. Está detectada *en una
configuración de tanda*, por un par de citas distinto del que falló, y con dos
pasadas. El protocolo pide cuatro por dirección para hablar de tasas.

---

## 27/08/2026 — `94ad06a0` — EXPERIMENTO F-73, tres estados

**Qué se lanzó**: el par de tablas **RRHH-06 / OPE-02**, los dos sentidos,
**cuatro pasadas por dirección y por estado**. Tres estados del mismo commit,
alternados con la variable `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` en el worker de
Railway.

**La pregunta**: por qué el modo exhaustivo NO detectaba la contradicción del
Puesto de Dr. Pablo Reyes en la dirección `OPE-02 → RRHH-06`, cuando el rápido
sí. Hasta `94ad06a0` el exhaustivo se saltaba entera la selección y se llevaba
los fragmentos en bruto.

### Dirección OPE-02 → RRHH-06 (la que fallaba)

| Estado | Qué ve el juez | Tasa |
|---|---|---|
| **Base** — sin selección | 15 filas en bruto | **0/4** |
| **Estado 1** — 3000, destilado | resumen + 9 filas, de las cuales 9 colapsadas → 6 líneas | **4/4** |
| **Estado 2** — 6000, nivel 1 | la tabla entera, 15 filas sin colapsar | **0/4** |

### Dirección RRHH-06 → OPE-02 (la que ya funcionaba)

**Detecta en los tres estados.** Y el motivo importa para leer bien la tabla de
arriba: la tabla de OPE-02 tiene **10 filas y cabe entera** en cualquiera de los
tres presupuestos, así que **la destilación nunca llega a actuar** en ese
sentido. No es que el estado no le afecte: es que para esa tabla los tres
estados son el mismo.

### El mecanismo aislado: EL COLAPSO DE IDÉNTICAS

Los tres estados dibujan una curva que no es monótona —0, 4, 0— y eso descarta
«más material es mejor» y también «menos material es mejor». Lo que separa al
estado 1 de los otros dos no es el volumen: es que **es el único donde el
colapso de filas idénticas actúa**. En base no hay selección; en estado 2 la
tabla entra completa por nivel 1, y el nivel 1 no colapsa nada.

Nueve filas que colapsan a seis líneas es lo que hace visible la fila que
difiere: las que coinciden se resumen en una línea de contexto y la discrepante
queda sola, en vez de enterrada entre catorce vecinas del mismo formato.

**Y NO es la prosa.** El desglose por tipo del log (añadido en `94ad06a0`
justo para poder responder esto) confirma que **la prosa entró igual en los dos
estados, 4/4 unidades**. La diferencia entre 4/4 y 0/4 no puede atribuirse a
material de prosa que entrara en uno y no en otro.

### Lo que esta tanda NO mide

**La esquina «destilado y grande».** Los tres estados cubren tres de las cuatro
combinaciones:

| | Sin destilar | Destilado |
|---|---|---|
| **Poco material** | — | Estado 1 ✅ medido |
| **Mucho material** | Base y Estado 2 ✅ medidos | **❌ SIN MEDIR** |

No se ha medido qué pasa con **una tabla grande que además se destila** — por
ejemplo, un presupuesto alto sobre una tabla de cuarenta o noventa filas, donde
el nivel 1 no cabe y el colapso sí actúa sobre muchas filas. Toda la conclusión
de esta tanda descansa en una tabla de 15 filas.

**Y el tope de piezas es un confundidor conocido para esa esquina**:
`MAX_FRAGMENTS_PER_DOC_QUICK = 25` bloquea el nivel 1 con cualquier
presupuesto en una tabla de más de ~24 filas (OPE-06 son 94 + resumen = 95
piezas), así que medir ahí sin parametrizarlo mediría otra cosa.

---

## 26/08/2026 — `a775a7c7`

**Qué se lanzó**: los cinco casos, modo rápido, desde la bandeja de revisión.
Org de pruebas `5a82712f-6740-4792-b291-3fdea8e6edb1`.
**Una pasada por caso.**

**Estado del código**: después de F-70 (`8f151aff`, la ficha en prosa) y de su
documentación (`a775a7c7`); **antes** de F-71 (`38d3fd22`, las etapas caídas).

| # | Caso | Resultado |
|---|---|---|
| 1 | Tabla, RRHH-06 → OPE-02 | **Detectada.** Columna `Puesto` de Dr. Pablo Reyes, confirmada por **estructura** |
| 2 | Tabla, OPE-02 → RRHH-06 | **Detectada.** Misma columna, confirmada por **estructura** |
| 3 | Prosa, CLI-03 → NOR-01 | **Detectada**, confirmada por **juicio** |
| 4 | Prosa, NOR-01 → CLI-03 | **Detectada**, confirmada por **juicio** |
| 5 | MKT-01 con los otros cuatro | **Limpio: cero hallazgos** |

| Comprobación transversal | Resultado |
|---|---|
| Falsos positivos de Belmonte (casos 1 y 2) | **Cero** |
| `columna_indeterminada` | **Cero** |
| Fallos de LLM | **Ninguno** |

**Qué confirma**: que F-69 y F-70 —el transporte de `columns`,
`comparedValues` y las filas, y la ficha en prosa— no rompieron la detección en
ninguno de los cuatro pares, y que el control negativo sigue limpio.

**Qué NO afirma**: que ninguna tasa se haya movido. Con una pasada por caso no
se distingue un régimen de una racha, que es exactamente lo que costó tres
semanas en B.81. Para eso hacen falta cuatro pasadas por dirección.

**Anomalía**: los casos 1 a 4 **no se midieron con el corpus vacío entre pares**.
Es la desviación que motivó fijar el vaciado en el protocolo: un par medido con
documentos ajenos en la tanda no está midiendo la detección entre esos dos,
porque el retrieval y el rerank ven otra cosa. Las cuatro detecciones salieron
bien de todos modos, pero salieron en condiciones más ruidosas que las que el
protocolo pide.

*(El caso 5 sí se midió como debe: MKT-01 acompañado de los otros cuatro. En su
día se anotó como si fuera la anomalía; no lo era — la anomalía estaba en los
casos 1 a 4.)*
