# Plan de F-103 P3 — las dos semanas, desglosadas

**05/09/2026.** Pieza 1 (el inventario) está cerrada. Esto es el plan de las
piezas 2 y 3, con el inventario delante y con las tres respuestas del director
incorporadas.

---

## 0 · ⚠️ LO PRIMERO: LAS DOS SEMANAS SE ESTIMARON SOBRE OTRO INVENTARIO

Fable dio «doce a quince caminos, unas dos semanas» **antes de que el censo
existiera**. El censo encontró **diecinueve caminos** y, de propina, **cuatro
hallazgos nuevos —B.177, B.179, B.180, B.181— tres de ellos en la puerta
principal**. La estimación no era mala: es que describía un inventario más
pequeño que el real. Es literalmente la regla de F-103: se estima desde lo
conocido, y lo conocido es lo medido.

**Lo que propongo es mantener las dos semanas y recortar el alcance por el sitio
correcto**: **entra todo lo que el cliente pisa; se queda fuera la periferia.**
No es un recorte cómodo, es el que dicta el criterio de cierre de F-103 —«se
cierra cuando se ha buscado donde el usuario va a ir»—. Lo que se quede fuera se
dice, y está en §5.

---

## 1 · EL ORDEN, Y POR QUÉ ES ÉSE

Tres reglas lo fijan, en este orden de fuerza:

**1ª — La puerta principal va primera, porque está rota.** Las tres primeras
entradas del orden de contacto son el mismo flujo, y ese flujo es al que el
producto empuja al cliente en cuanto sube un documento con problemas. Medir la
periferia mientras la puerta principal tiene un fallo confirmado sería medir
donde no está el cliente.

**2ª — ⚠️ LOS DENOMINADORES VAN ANTES QUE LAS REMEDICIONES QUE PUEDAN DAR CERO, y
esto NO es una pieza paralela: es una PRECONDICIÓN.** Una tanda sin denominador
que salga cero **no se puede interpretar**, y eso es gastar 30 créditos para no
saber nada. Es la regla del cero aplicada a nuestro propio plan.
**Con una excepción declarada**: las tandas cuya predicción es un **no-cero
conocido** pueden ir antes, porque su lectura no depende del denominador. La de
la puerta principal es exactamente ése — hoy da 4 y debe dar 15.

**3ª — Dentro de cada bloque, lo que no gasta créditos primero.** Un test
determinista cuesta cero y puede tumbar una hipótesis antes de pagarla.

---

# SEMANA 1 — CÓDIGO. Cero créditos hasta el bloque B4.

## B0 · El test del caso 4 (B.181) — *código, 0 cr*

Test determinista sobre `chunkText` con texto **sin encabezados markdown**.
Función pura sobre un string: encaja en la regla de vitest sin rozarla.

Va el primero de todo por una razón de coste: **es lo más barato de la lista y
cubre más que ninguna otra cosa** — el «caso 4» no es la rama de `csv`, es la de
todo documento sin `#` en cualquier formato.

⚠️ **Con la cautela que la propia ficha señala**: sin un criterio escrito de qué
es un corte correcto, un test solo congela lo que hoy hace. **Primero el
criterio, y en el mismo commit.**

## B1 · La puerta principal — *código, 0 cr*

**B1.1 — B.177: la estructura en A6.** Antes del código hay que contestar la
pregunta de la ficha: *¿de dónde saca el servidor la estructura cuando el cliente
solo tiene un id?* Hay dos fuentes —el `storage_path` de la fila y los
`document_chunks` tipados— y **elegir fuente es elegir qué pasa cuando el usuario
ya editó el texto**, que es justo lo que la guarda de B.175 protege.

**B1.2 — B.180: el precio en los dos botones.** Es lo más barato de este bloque y
**lo único de toda la lista que el cliente ve directamente**. El producto ya sabe
declarar precios (`exhaustiveDesc`); aquí es llevar esa misma frase a los dos
botones.

**B1.3 — B.179: el CONTADOR, no el arreglo.** La ficha de B.179 termina en tres
preguntas de producto, y ninguna se contesta escribiendo código. **Lo que sí entra
es el contador** —un documento indexado sin estructura cuyo origen sí la tenía—
porque es barato, no prejuzga ninguna de las tres respuestas, y por F-95 un
límite declarado sin contador es callar con permiso.

## B2 · Los denominadores — *código, 0 cr* — **pieza 2 de F-103 P3**

`diff.vision.tablas_analizado`, `tablas_candidato`, `filas_analizado`,
`filas_candidato`, y el sexto centinela `diff.ceguera_estructural`.

✅ **No hace falta SQL.** `analysis_results.pipeline_counters` ya existe y es
`jsonb` (`persist-analysis.ts:98`). Son claves nuevas en un cajón que ya está.
**Lo que sí hay que actualizar es `Contrato_Contadores.md`**, porque el
vocabulario es cerrado — y el contrato se escribe antes que el código, que es
para lo que ese fichero existe.

Con esto, los dos ceros se separan solos: «vi 1 tabla aquí y 1 allí, ninguna
clave» frente a «vi 0 tablas», que es la alarma en sí misma.

---

# SEMANA 2 — MEDICIÓN. Aquí van los créditos.

Todas las pasadas con **predicción escrita antes**, y todas **leídas de
`analysis_results`, no del log** (F-102). Todas declaran **camino Y MODO**
(B.178), que es lo que hoy falta.

## B3 · La tanda de la puerta principal — *la que levanta la cuarentena*

El mismo par por las dos entradas del modal, mismo modo:

| pasada | camino | predicción |
|---|---|---|
| A5 | modal desde el **chat** | **15**, contra las 4 de B.175 |
| A6 | modal desde la **bandeja** | **15** tras B1.1; hoy daría 4 |

Es la única del plan que puede ir antes de nada por la excepción de la 2ª regla:
**su lectura no depende del denominador** porque el no-cero es conocido.

## B4 · Las cuatro filas que tienen cifra y no tienen modo (B.178)

A1, A2, A3 y A4, cada una declarando el suyo. Dos de ellas —el par grande 15/15/2
y la siembra 2/2/0— **ya tienen la cifra**: lo que falta es poder colgarla de una
fila. Puede que baste con repetir una para fijar la correspondencia.

## B5 · El agente — *entra por decisión del director*

Sus cuatro herramientas: `search_docs`, `read_doc`, `list_docs`, `usage_stats`.
Es `∅` de una superficie que el cliente **va** a usar, que es el peor de los dos
`∅`. No hay cifra de referencia previa: **esta tanda la crea**.

## B6 · `csv` y la cadena de B.179

**`csv`** — una tanda, con la expectativa explícita: sube una tabla, recibe prosa.
**La cadena de B.179 observada**, que hoy es deducción sin control positivo:
indexar un Excel corregido por el modal y analizarlo desde la bandeja. **Si el
mismo par que da 15 da menos, la deducción pasa a medición.**

## B7 · Periferia — *lo primero que se cae si falta tiempo*

`staged` (re-ejercerlo, que hoy es `e†`), `analyze-style`, `improve`.

---

# 2 · QUÉ ES CÓDIGO Y QUÉ ES MEDICIÓN

| | bloques | créditos |
|---|---|---|
| **CÓDIGO** | B0, B1, B2 | **0** |
| **MEDICIÓN** | B3, B4, B5, B6, B7 | ver §3 |

**Toda la semana 1 es código y no cuesta un crédito.** Y no hace falta SQL en
ningún bloque: el único cambio de datos son claves nuevas en un `jsonb` que ya
existe. Si en algún momento aparece SQL, **paro y lo entrego antes del push**,
como manda la regla.

---

# 3 · EL PRESUPUESTO EN CRÉDITOS

Precios reales, leídos del código y no de la documentación:
`analyze-v2` rápido **5**, exhaustivo **30**, `analyze-style` **2**, `improve`
**1**, agente **15 estimados** y reconciliados a consumo real.

Los reembolsos, de `worker/src/index.ts:236-320`:
- **incompleto → devolución íntegra** (un fallo del proveedor no lo paga nadie);
- **reanálisis con <2 confirmadas → 20 de vuelta**, coste final 10;
- **precio variable**, solo en Business/Business+/Enterprise: `light` −10 (neto
  20), `medium` −5 (neto 25), `heavy` sin reembolso (30).

| bloque | pasadas | bruto | neto estimado |
|---|---|---|---|
| **B3** puerta principal | 2 exhaustivos, par grande | 60 | ~50 |
| **B4** las cuatro filas | 2 rápidos + 2 exhaustivos | 70 | ~60 |
| **B5** el agente | 3-4 conversaciones | ~60 | ~25 |
| **B6** csv + B.179 | 1 rápido + 2 exhaustivos | 65 | ~45 |
| **B7** periferia | 1 rápido + estilo + improve | 12 | 12 |
| | **TOTAL** | **~267** | **~190** |

Con un 10 % de margen por reintentos: **~300 brutos**.

⚠️ **Dos avisos sobre esta tabla, para que no se lea de más:**
· **El neto solo aplica si el piloto es Business o superior.** Si no lo es, no
  hay precio variable y **el número que vale es el bruto: ~300**.
· El agente es el más incierto de los cinco: se cobran 15 por adelantado y se
  reconcilia contra tokens reales. **Su neto es una estimación mía, no una
  medición** — y medirlo es justamente parte de B5.

En contexto: un plan Business son 4.000 créditos al mes. Las dos semanas de
medición caben en **menos del 8 % de un mes**. El presupuesto no es el problema.

---

# 4 · ⚠️ LO QUE QUEDA DECLARADO — lo que el director puede enseñar sin mentir

Es el entregable de verdad. Al final de las dos semanas, esto será **cierto y
comprobable abriendo un registro**:

**1. El inventario existe y es público.** Diecinueve caminos, cada uno con su
estado. No es «creemos que están bien»: es una lista con nombres.

**2. La puerta principal está medida por sus dos entradas**, con la misma cifra
por las dos, sobre el dato persistido y no sobre un log.

**3. Cada camino que produce un informe tiene al menos una cifra de referencia,
con su camino y su modo declarados.** Hoy no hay ninguno así.

**4. Cuando el sistema no ve algo, lo dice.** Todo cero viene con su denominador:
cuántas tablas vio a cada lado y cuántas filas. Un «no hay contradicciones» deja
de ser indistinguible de un «no miré».

**5. Los dos botones que cobran dicen lo que cuestan.**

**6. Hay una lista escrita de lo que NO se ha probado**, y no está escondida.

## Y la frase, que es lo que hay que poder decir en una sala

> «Doclity tiene ocho caminos por los que un documento llega a producir un
> informe, y cuatro herramientas de agente que lo leen. Los ocho están medidos
> contra una cifra de referencia, con el camino y el modo anotados en un registro
> que puedo abrir. Cuando el sistema no encuentra nada, dice también cuánto miró.
> Y de lo que no hemos probado tenemos la lista.»

⚠️ **Lo que esa frase NO dice, y no debe decir:**
· **No dice «funciona».** Dice que está medido. Una tanda es un control positivo,
  no una garantía — y esa distinción es exactamente la que este método defiende.
· **No dice «no hay fallos».** Dice que los que quedan son de la clase que el
  cliente no sufre, y eso se sostiene mientras la clase no cambie (F-100).

---

# 5 · LO QUE SE QUEDA FUERA DE LAS DOS SEMANAS, DICHO EN VOZ ALTA

Si algo se cae, se cae **esto** y en este orden:

1. **B7, la periferia** — `staged`, estilo, improve. `staged` es `e†`: se ejerció
   contra un código que ya no existe.
2. **La extracción de prosa en la suite** — `pdf`, `docx`, `txt` siguen sin un
   solo test determinista de extracción. B0 cubre el TROCEADO, no la extracción.
3. **OneDrive, la rama `default`, la reserva de `docx`** — los tres siguen `∅`, y
   los tres están abajo del orden de contacto por buenas razones.
4. **El arreglo de B.179** — entra su contador, no su solución: las tres preguntas
   de su ficha son de producto.
5. **`json` y `html`** — esperando la respuesta del director. Si dice que nadie los
   sube, **quitarlos son dos líneas por lista y sale más barato que medirlos**.

⚠️ **Y una cosa que NO se queda fuera aunque lo parezca**: el «procesador
universal». No es trabajo de estas dos semanas, pero **la pregunta a Fable sí**,
porque la respuesta puede cambiar qué tiene sentido medir en la tercera.
