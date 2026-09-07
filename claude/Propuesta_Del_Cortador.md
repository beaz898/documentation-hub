# El cortador — propuesta, antes de escribir una línea

**07/09/2026.** La decisión no va dentro del commit. Aquí está qué haría, qué
descarto, qué **no** arregla, y **qué casos tienen que ponerse rojos**, escrito
antes de tocar nada.

---

# 1 · EL DIAGNÓSTICO, en una frase — y la foto lo estrechó

`splitByLength` mueve el **final** del trozo a una frontera —`\n\n`, luego `. `,
luego `\n`— si cae en la segunda mitad. Pero el trozo siguiente arranca en
`start = end - CHUNK_OVERLAP`, **y esos 200 caracteres se restan a ciegas**.

Las cifras congeladas lo dicen solas:

| entrada | longitudes |
|---|---|
| prosa con puntos | 1188 · **1130 · 1130 · 1130 · 1130** · 851 |
| párrafos dobles | 1158 · **1175 · 1175** · 980 |
| filas sin puntos | 1199 · **1166 · 1166 · 1166** · 1186 |

**Las intermedias son idénticas** porque el paso es constante: `maxSize` menos un
solape fijo. Y **ninguna llega a 1200 salvo el corte duro** — el cortador SÍ busca
frontera. **El defecto nunca estuvo en el final: está en el arranque.**

⚠️ **Y la foto acotó el daño**: diez documentos con prosa cortada y **todas las
filas de tabla a cero**, en los ocho `.xlsx` del corpus. Lo que hay que arreglar es
el arranque de la prosa, no el trato a las tablas.

---

# 2 · LO QUE PROPONGO — **simetría**: el arranque usa el mismo criterio que el final

Una regla, y cabe en una frase:

> **Si el final del trozo retrocede a una frontera, el arranque del siguiente
> también.**

Concretamente: tras calcular `start = end - overlap`, se mueve `start` a la
frontera más cercana **dentro de la ventana del solape**, con la misma preferencia
que ya usa el final —`\n\n`, luego `. `, luego `\n`—. Si no hay ninguna frontera en
esa ventana, **se queda donde estaba**: el corte ciego sigue siendo la salida por
defecto, declarada.

**Por qué ésta y no otra:**

· **Es la que el defecto pide.** No inventa un criterio nuevo: **reutiliza el que
  ya existe** para el final. La asimetría era el fallo; la simetría es el arreglo.
· **No toca la doctrina del solape.** Se sigue solapando —el texto duplicado que
  hace que una frase partida sea recuperable desde los dos lados sigue ahí—, solo
  que ahora empieza donde algo empieza.
· **Y falla hacia hoy.** Sin frontera en la ventana, el comportamiento es el
  actual, byte a byte. Ningún texto empeora.

**Coste:** ~10 líneas en `splitByLength`, más actualizar el congelado y añadir la
propiedad nueva como caso: *ninguna pieza abre a media línea cuando hay frontera
disponible*.

**Y lo que arrastra, que no es pequeño:** cambia el troceado de todo lo que tenga
frontera → **`EXTRACTOR_VERSION` 2 → 3** → **el corpus entero queda desactualizado**
y hay que repararlo. Eso ya estaba previsto en la secuencia de F-105.

## Las que descarto, y por qué

**Empaquetar por unidades** (reescribir el troceado para meter líneas o párrafos
enteros): resuelve lo mismo que la simetría y **cambia el reparto de TODO**, no
solo de lo que hoy está mal. Más superficie, mismo resultado para el defecto
medido. Si algún día el troceado se rehace por otras razones, ése es el camino;
hoy no.

**Detectar bloques de filas y repetir la cabecera**: es la única que ataca «no
partir una tabla», y **es la más arriesgada** —un heurístico se equivoca en las dos
direcciones— y **aun así no consigue que la tabla se compare**. Con las filas de
tabla a cero en la foto, estaría arreglando un daño que en este corpus no se
produce.

**Quitar el solape cuando no hay frases**: dos líneas, y **paga con recuperación**
lo que la simetría consigue sin pagar nada.

---

# 3 · ⚠️ QUÉ HACE CON UNA TABLA MÁS GRANDE QUE EL TAMAÑO DE CORTE

La pregunta tiene **dos casos distintos** y conviene no mezclarlos, porque uno es
inofensivo y el otro es una limitación real que hay que declarar.

## (a) Una tabla de verdad, de un Excel — **no llega al cortador**

Las filas vienen como segmentos `table_row`: **una fila, un trozo**, sin pasar por
el troceado de prosa. Una tabla de 500 filas son 500 trozos y el tamaño de corte no
interviene. Por eso la foto da **cero** en las ocho hojas de cálculo.

**El único borde**: una fila *individual* de más de 1500 caracteres sí se parte por
longitud (`chunking.ts:499`). Con la simetría, una fila sin saltos de línea no tiene
frontera donde agarrarse → **corte ciego, igual que hoy**. Y **cada pedazo conserva
sus `cells`**, así que la estructura sobrevive aunque el texto se parta.
⚠️ Eso deja tres trozos declarando la misma fila con las mismas celdas — una rareza
que **ya existe hoy** y que esta propuesta no crea ni resuelve. Queda anotada.

## (b) Una tabla que vive como TEXTO — un CSV, una tabla dentro de un PDF

Aquí sí se parte, y **la simetría NO lo arregla**:

| | hoy | con la simetría |
|---|---|---|
| ¿se parte la tabla? | sí | **sí, igual** |
| ¿los pedazos tienen filas enteras? | **no**: abren a media fila | **sí** |
| ¿el pedazo de abajo tiene cabecera? | no | **no** |

**Lo que se gana:** deja de aparecer *media fila que parece una fila entera con el
primer campo cambiado* — que era el daño de B.182: no pérdida, sino **un dato
plausible y falso**.

**Lo que NO se gana, y va declarado:** la tabla sigue repartida, y los pedazos
posteriores al primero **siguen sin cabecera**. Repetirla exige detectar el bloque,
que es la opción que descarto arriba.

⚠️ **Y el consuelo que hace aceptable la limitación**: esas tablas **no se comparan
de todas formas** — viven como texto, no tienen `cells`, y el diff no las ve. La
simetría no las hace estructurales; **impide que estén sucias**. Que se comparen es
el frente de extracción que F-104 P1 ya decidió, y es otra cosa.

---

# 4 · ⚠️ QUÉ CASOS TIENEN QUE PONERSE ROJOS — escrito ANTES

Es la predicción, y su gracia es que se puede fallar.

| caso congelado | esperado | por qué |
|---|---|---|
| **`filas sin puntos (corte por «\n»)`** | 🔴 **ROJO** | **El primero de la lista.** Es el del solape idéntico: hoy sus intermedias son 1166, 1166, 1166 porque el paso es ciego, y cada trozo abre a media fila. Es el caso que motivó todo |
| `prosa con puntos (corte por «. »)` | 🔴 ROJO | tiene `. ` en la ventana del solape → el arranque se moverá |
| `parrafos dobles (corte por «\n\n»)` | 🔴 ROJO | tiene la frontera preferente |
| `con secciones y una larga (subdivideSection)` | 🔴 ROJO | su sección larga es prosa con puntos: el mismo camino |
| **`sin fronteras (corte duro)`** | 🟢 **VERDE** | ⚠️ **CONTROL.** 3000 caracteres sin un solo salto ni punto: no hay a dónde moverse. Si esto se pone rojo, el arreglo está tocando algo que no debía |
| **`una tabla NO la toca el cortador`** | 🟢 **VERDE** | ⚠️ **CONTROL.** Si se mueve, el cambio llegó a las tablas — y sería la única forma de que las 15 del par grande dejaran de salir |
| `⚠️ B.182: la CABEZA de los trozos siguientes NO lo es` | 🔴 **ROJO** | está escrito dentro que el día que se arregle hay que invertirlo. **Si sigue verde, el arreglo no llegó** |

**Cuatro rojos previstos, dos verdes de control, y uno que ya venía avisando.**

⚠️ **Y CÓMO SE LEE EL RESULTADO, decidido antes de verlo:**
· **Un rojo que esperaba verde** → el arreglo tocó de más. Se para.
· **Un verde que esperaba rojo** → el arreglo no llegó donde creía. **Ése es el
  que se descubre tarde**, y por eso la lista se escribe ahora.
· **Los cuatro rojos y los dos verdes** → el cambio hizo exactamente lo que decía.

---

# 5 · LO QUE ESTA PROPUESTA NO DECIDE

· **Cuándo se sube la versión a 3 ni cuándo se repara el parque.** Eso es la
  secuencia de F-105 y va después, con el arreglo verde.
· **Si el solape debe seguir siendo de 200.** No lo toco: cambiarlo sería un
  segundo cambio dentro del mismo commit, y luego no se sabría cuál movió qué.
· **Nada de las tablas en PDF.** Es el frente de extracción, decidido y aplazado.
