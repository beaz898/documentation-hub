# Descarte de filas ajenas — predicado y batería (F-65 / F-75)

*Escrito el 27/08/2026, ANTES de tocar código.*

---

## 1. Por qué existe este fichero

F-65 llevaba días anotado en dos sitios del repositorio como **«Descarte de
filas ajenas (F-65), con su batería propia y OPE-06 como caso»**
(`claude/Cierre_B81.md:349` y `Bitacora_Sesiones.txt:4852`).

**Esa batería no estaba en ninguna parte.** Al ir a implementarlo se buscó
`ajena` en todos los `.txt` y `.md` del repositorio: cuatro apariciones, ninguna
con un caso, un criterio de éxito o una tasa esperada. Lo único escrito era la
doctrina de tres líneas de `Cierre_B81.md:293-303` — que además cita el descarte
de ajenas entre paréntesis, como *«(pendiente)»*, no como paso propio.

**Se paró el commit al descubrirlo (F-75), y la batería no se reconstruyó de
memoria: se pidió.** Este fichero es lo que vino de vuelta.

Es el mismo criterio con el que nació `claude/Protocolo_Harness_Tasas.md` el día
anterior, y por el mismo motivo: **lo que nace en una conversación y no se
escribe, se pierde**. Ya pasó con la tabla del relevo del 25/08, buscada el 26 y
nunca encontrada.

---

## 2. El predicado, en tres reglas encadenadas

La versión que se creía tener —«una fila que no cruza con ninguna fila del otro
documento es ajena»— **es incorrecta**, y el contraejemplo estaba en el corpus:
`Total horas equipo/semana: 256` contra `248`. Comparten columna, difieren en el
valor, y `countCrossings` cuenta COINCIDENCIAS, así que devuelve 0. Bajo aquel
enunciado esa fila era «ajena» y se habría descartado — siendo exactamente el
hallazgo que se busca.

El predicado correcto son tres reglas, y hay que evaluarlas **en orden**:

### Regla 1 — Emparejar por valores NO TRIVIALES en columnas comunes

Una fila se empareja con el otro documento cuando coincide en el **valor** de
alguna columna común, **y esa columna no es trivial**.

### Regla 2 — «No trivial» = cardinalidad observada > 1 en esa tabla

Una columna cuyo valor **se repite en (casi) todas las filas no empareja nada**:
su cruce no distingue una fila de otra. Si las quince filas de una hoja dicen
`Clínica: Chamberí`, cruzar por `Clínica` no dice que dos filas hablen de lo
mismo — dice que las quince hablan de lo mismo, que es no decir nada.

**Se mide contando valores distintos en los datos ya cargados.** Sin
diccionarios, sin listas de columnas «identificadoras», sin semántica. Es el
mismo criterio que F-23/F-26 impusieron dos veces: se decide con estructura que
el sistema ya tiene, o no se decide aquí.

### Regla 3 — Sin emparejar pero con columna no trivial y valor DISTINTO → DISCREPANTE DIRECTA

Si la fila no empareja por valores, pero **comparte una columna no trivial y su
valor es distinto**, no es ajena: es **discrepante directa**. Es el caso de
256/248.

### Y solo entonces: AJENA

**Ajeno es lo que ni se empareja ni discrepa por columna.** Ni coincide en un
valor no trivial, ni difiere en uno. No tiene nada que comparar con el otro
documento — una fila de clientes en un corpus donde el otro documento no habla
de clientes.

---

## 3. Aclaración de alcance (subrayada por Fable)

> **«Discrepante directa» es una etiqueta de CLASIFICACIÓN para no descartar por
> error, NO un carril hacia la bandeja.**

Clasificar una fila como discrepante directa significa **únicamente** que
sobrevive a la selección y entra en el prompt. **Todo lo que entra pasa después
por la cascada completa**: el juez, R2, la llamada corta y —en exhaustivo— el
double-check. Nada llega a la ficha por esta puerta.

En concreto: **dos personas distintas con puestos distintos siguen sin ser
hallazgo**. R2 lo resuelve desde F-26 con `descartado.sin_columna_comun` y con la
comparación de valores por columna citada; esta regla no lo toca.

**El único candidato NUEVO que la regla 3 deja pasar es la fila que ES el dato**
— los totales. `Total horas equipo/semana` es una fila cuyo contenido entero es
el valor en disputa, sin entidad que la identifique. Ese es el hueco que se está
tapando, y es estrecho a propósito.

---

## 4. El descarte es NEUTRAL respecto al nivel

**Las ajenas salen del prompt, y su hueco NO se rellena subiendo de nivel.**

El motivo es un dato, no una preferencia. La tanda del 27/08
(`claude/Tandas_Harness.md`, experimento F-73) midió sobre el par
RRHH-06 / OPE-02, dirección `OPE-02 → RRHH-06`:

| Estado | Qué ve el juez | Tasa |
|---|---|---|
| Nivel 2, con colapso | resumen + 9 filas, 9 colapsadas → 6 líneas | **4/4** |
| Nivel 1, sin colapso | la tabla entera, 15 filas | **0/4** |

**El nivel 1 no colapsa nada**, y el colapso es la pieza que hace visible la fila
que difiere. Un descarte que liberase presupuesto y con él subiera tablas a nivel
1 **desharía exactamente lo que F-73 arregló** — y lo haría en silencio, porque
el log diría «nivel 1» y eso hoy se lee como una mejora.

> **El presupuesto liberado es ahorro de tokens, no invitación a des-destilar.**

**A revisar cuando existan las pasadas múltiples (v2)**: con varias pasadas sobre
el mismo par, la pregunta «¿qué hacemos con el presupuesto que sobra?» cambia de
respuesta, porque deja de haber una sola oportunidad de mostrar el material.
Hasta entonces, neutral.

---

## 5. La batería — los siete casos de F-75

| # | Caso | Qué debe pasar |
|---|---|---|
| 1 | **256 / 248 horas** — misma columna, valores distintos | **Discrepante directa**, NO ajena. Entra en el prompt |
| 2 | **Filas de clientes ausentes** del otro documento | **Ajena**: fuera del prompt, y **contada** |
| 3 | **Chamberí** — columna con cardinalidad ~1 | **Ajena**. El cruce por una columna trivial no la salva |
| 4 | **Pablo Reyes y las discrepantes conocidas** | **Intactas**. Ni una sale del prompt |
| 5 | **Los niveles** | **Ninguna tabla cambia de nivel** por efecto del descarte |
| 6 | **El contador `ajenas_fuera`** | **Cuadra fila a fila** con lo retirado. Ni una de más ni de menos |
| 7 | **Tasas del harness** | **Sin movimiento en ningún par**: ni aciertos abajo ni limpios arriba. **MKT-01 sigue dando cero** |

Los casos 5 y 7 son los que convierten esto en una batería y no en una lista de
deseos: **5** vigila el riesgo de la sección 4, y **7** vigila que arreglar el
presupuesto no rompa la detección — con el control negativo incluido, porque un
descarte demasiado agresivo se nota tanto en lo que deja de encontrar como en lo
que empieza a inventar.

El caso 6 es la regla de F-71 aplicada aquí: **lo que se descarta se cuenta**.

---

## 6. El caso de referencia cambia: OPE-06 ya NO lo es

Lo que dice el pendiente original, `claude/Cierre_B81.md:349-351`:

> 2. **Descarte de filas ajenas** (F-65), con su batería propia y OPE-06 como
>    caso: su tabla son 19.613 caracteres y topa antes el límite de 25 piezas, así
>    que ese caso lo resuelve la selección, no el presupuesto.

Esa última frase **descalifica a OPE-06 como caso de referencia**, y hay que
leerla al revés de como se venía leyendo: su cuello no es el presupuesto de
caracteres sino **`MAX_FRAGMENTS_PER_DOC_QUICK = 25`** (`lib/analysis/retrieval.ts:97`).
Su tabla «Tarifa» son 94 filas + resumen = **95 piezas**. Descartar ajenas del
reparto no cambia nada mientras las 25 piezas se agoten igual, así que medir ahí
mediría el tope, no el descarte.

**El caso de referencia pasa a ser el Excel grande del corpus nuevo**, con filas
de **los tres tipos sembradas a propósito**: emparejadas por valor no trivial,
discrepantes directas, y ajenas. Un caso construido para que las tres reglas se
disparen y se puedan distinguir en el log, en vez de un documento real donde
solo se dispara una.

---

## Lo que este fichero NO fija

Siguiendo la lista de cierre de F-74 P5 (`Protocolo_Harness_Tasas.md`, §4-bis):

**El caso extremo.** La batería no dice qué pasa con **15-20 discrepantes reales
en la misma tabla**: se comen el tope de 25 piezas antes que el presupuesto, y
ahí el descarte de ajenas no libera nada porque las ajenas ya no estaban
entrando. Anotado como pendiente propio (B.102).

**El dominio no cubierto.** Todo esto es **tablas**. Un documento de prosa no
tiene columnas, así que ninguna de las tres reglas le aplica y las unidades de
prosa siguen entrando por score como hasta hoy. Nada de lo medido aquí dice nada
sobre prosa.
