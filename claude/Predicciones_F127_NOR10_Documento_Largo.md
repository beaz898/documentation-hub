# Predicciones de F-127 — NOR-10, el documento largo

> **Escritas por el arquitecto el 15/10/2026 y corregidas el 16/10/2026, ANTES de medir.** No se
> reescriben después: una que falla se califica como fallada y se explica debajo, con su fecha. Las
> correcciones del 16/10 se hicieron antes de lanzar ninguna pasada, y la que se retira queda tachada,
> no borrada.
>
> ⚠️ **SON TRES PASADAS, NO SIETE.** Con tres, la varianza queda peor caracterizada que en F-126,
> donde hubo siete y siete. Es una decisión consciente de coste, no un descuido: una predicción «en 3
> de 3» aquí dice menos que una «en 7 de 7» allí.
>
> **Qué se mide.** NOR-10 como analizado, lanzado por el director desde la bandeja de revisión (sin
> indexar, como NOR-11 el 14/10), contra CLI-12 como candidato. Con el presupuesto de hoy, 40.000
> caracteres, las cuatro reglas de reparto simuladas el 15/10 (R0 a R3) dan lo mismo en esta pareja,
> así que la medida vale igual antes y después de un arreglo del reparto. Desde el 16/10 el pase es
> además **la sonda de la frase partida** que pide Fable en F-127 (P7): qué hace el juez cuando el
> corte parte una frase.
>
> **Cómo se lee.** Con `SQL_F127_01_la_medida_de_NOR10.sql`. El texto que se le entregó al juez no se
> guarda: la consulta lo reconstruye desde los trozos de NOR-10 y lo da por bueno sólo si mide lo que
> el juez dice que leyó (su control 0.5).
>
> **La verdad sembrada**: `corpus-pruebas/SIEMBRA_corpus_ampliado.md`, sección 1 — A (responsable
> último), B (frecuencia del control biológico), C (caducidad, 6 contra 12 meses) y D (no sembrada,
> pueden coincidir las dos figuras; detectarla es un acierto).

---

## Controles (no son predicciones)

**C-1 (control aritmético)** · La frase C, en la posición 58.882, queda fuera del texto entregado en
las 3 de 3. Certeza mecánica: el tope del analizado no pasa de 37.000.

**C-2 (control de invención)** · El juez NO publica nada sobre la caducidad de 6 contra 12 meses en
las 3 de 3. **Criterio mecánico (16/10/2026): la invención queda probada cuando la cita del lado
NOR-10 de un hallazgo de caducidad no está dentro de lo entregado** (bloque 3 de la SQL). Si está
dentro, es otro hallazgo y se lee: NOR-10 habla de caducidad dentro de lo entregado (la de fábrica de
los indicadores químicos, posición 36.206), y el «12 meses» de CLI-12 puede entrar en el bloque del
candidato. **Este control manda sobre cualquier otro resultado del pase.**

## Predicciones

**P-1** · El régimen de la pareja NOR-10 ← CLI-12 es `corte_honesto` en las 3 de 3, con «dejó fuera»
en el lado analizado.

**P-2** · El analizado entregado está entre 36.600 y 37.300 caracteres en las 3 de 3, y es
exactamente 40.000 menos el tamaño del bloque real del candidato.

**P-3** · La frase B del lado analizado tiene TRES estados según el bloque real del candidato (bloque
4 de la SQL):
- **frase entera dentro** si el bloque no pasa de 3.148 caracteres (la frase acaba en 36.852);
- **el dato dentro, la frase cortada**, si el bloque está entre 3.149 y 3.373 (el dato,
  «semanalmente, todos los lunes», acaba en 36.627);
- **fuera del todo** si el bloque pasa de 3.373.

**Predicción: B cae en el estado del medio o peor en al menos 1 de las 3 pasadas.** Es la predicción
del hallazgo del 3.206: si B entra entera en las 3 de 3, el arquitecto se ha equivocado y el margen
es más estable de lo que cree.

**P-3b (arquitecto, 16/10/2026)** · *Escrita antes de medir y después de conocer el historial de las
ocho pasadas de esta pareja (02 y 03/10: bloque de 2.857 en las ocho, `claude/Estado_Del_MVP.md:11152`
y `:11585`).* El bloque real del candidato en NOR-10 ← CLI-12 queda entre 2.800 y 2.900 en las 3 de
3, y la frase B entra ENTERA en las 3 de 3. Es la predicción contraria a la P-3, y se escribe sin
retirar la P-3 para que se vea cuál de las dos acierta.

**P-4** · Toda cita publicada es un tramo contiguo y literal del documento, con marca recompuesta
«no» y sin ningún contador de la puerta de citas distinto de cero, en las 3 de 3. Es la predicción
que de verdad contesta la pregunta del director: si se cumple, la regla de la cita de F-126 no es un
arreglo a medida de NOR-11.

~~**P-5** · Ninguna pasada publica las tres contradicciones A, B y D de la pareja NOR-10 ↔ CLI-12,
porque los tres trozos del lado candidato suman 3.117 y el bloque son 3.000. Tope aritmético, no
fallo del juez.~~

> **RETIRADA EL 16/10/2026, antes de medir.** Descansaba en un tope aritmético que no existe: el dato
> de B también está en el trozo 38 de CLI-12 (685 caracteres, «El criterio de periodicidad mensual
> del control biológico descrito en el apartado 12.1…»), y con ese trozo A (914) + D (969) + B (685)
> suman 2.568, que caben en el bloque. Que salgan las tres a la vez depende de qué trozos elija el
> índice, no de la aritmética. Lo demostró Code el 15/10.

**P-6** · La contradicción A se publica en al menos 2 de 3.

**P-7** · La mediana de longitud de las citas publicadas queda entre 100 y 220 caracteres. En F-126
fue 167 sobre un documento de 14.704; aquí el documento es cuatro veces más largo.

**P-8** · Cero falsos positivos sobre el lado analizado: ninguna cita publicada que no exista literal
en los 37.000 caracteres entregados.

## Las dos lecturas de la sonda de la frase partida (pedidas por Fable, F-127 P7)

No son predicciones: son lo que el pase tiene que dejar leído.

**L-1** · En qué posición exacta cae el corte de cada pareja recortada y si parte una frase, con las
palabras de antes y de después (bloque 7 de la SQL).

**L-2** · Si el juez cita algo en los 500 caracteres anteriores al corte, y qué hace con ello: si cita
el trozo mutilado, si no publica, o si completa la frase por su cuenta, que sería inventar (bloque 8
de la SQL, publicadas y descartadas por la puerta).

## Las dos predicciones de Fable para la sonda (F-127, dichas por él)

**P-F127-4 (Fable, confianza alta)** · «El corte a 30.183 cae a mitad de frase en las 3.»

**P-F127-5 (Fable, confianza baja)** · «Qué hace el juez con la media frase: no lo sé. Apuesta de baja
confianza: la cita literalmente y la puerta la acepta en 2 de 3.»

---

## Calificación — escrita el 18/10/2026 con la salida de `SQL_F127_01` del 16/10

Tres pasadas de NOR-10 el 16/10/2026, a las 12:45, 12:46 y 12:46 hora de Madrid, desde la bandeja de
revisión y sin tocar el código. Los ocho controles de la consulta salieron OK. La calificación es del
arquitecto; nada de lo de arriba se ha reescrito.

| | Resultado |
|---|---|
| **C-1** (C fuera) | ✅ **CONFIRMADO**, 3 de 3 |
| **C-2** (nada inventado sobre caducidad) | ✅ **PASA**. Una sola contradicción publicada, sobre autoridad; cero citas fuera de lo entregado |
| **P-1** (`corte_honesto` con «dejó fuera») | ✅ **ACIERTA**, 3 de 3 |
| **P-2** (analizado entre 36.600 y 37.300 y exactamente 40.000 menos el bloque) | ✅ **ACIERTA**: 37.143 = 40.000 − 2.857 |
| **P-3** (bloque por encima de 3.148 en al menos 1 de 3) | ❌ **FALLA**: 2.857 en las tres |
| **P-3b** (bloque entre 2.800 y 2.900 y B entera, 3 de 3) | ✅ **ACIERTA** |
| **P-4** (toda cita contigua y literal, recompuesta «no», seis contadores a cero) | ✅ **ACIERTA**, 3 de 3 |
| **P-5** | Retirada el 16/10, antes de medir |
| **P-6** (A publicada en al menos 2 de 3) | ✅ **ACIERTA EN EL FONDO**, con la precisión de abajo |
| **P-7** (mediana entre 100 y 220) | ❌ **FALLA**: 281, mínimo 222, máximo 340 |
| **P-8** (cero falsos positivos en el lado analizado) | ✅ **ACIERTA**: 0 de 3 fuera de lo entregado |
| **P-F127-4** (Fable: el corte parte frase en las 3) | ✅ **ACIERTA**, en las dos parejas; en 30.183 parte una palabra: «paqu» \| «etes» |
| **P-F127-5** (Fable: el juez cita la media frase y la puerta la acepta en 2 de 3) | ❌ **FALLA**, 0 de 3: ninguna cita, publicada ni descartada, en los 500 caracteres anteriores al corte ni cruzándolo |

**La precisión de P-6.** El clasificador de la consulta marcó la contradicción publicada como OTRA
porque busca la frase sembrada exacta, que empieza en la posición **2.094**; el juez citó una frase
vecina, que empieza en la **2.748**, con el mismo dato («la responsabilidad última —incluida la firma
de los registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no
supere un control biológico— no es delegable y recae siempre sobre esta figura»). Por contenido es la
contradicción A: el juez detectó la trampa por otra frase, y el medidor lo contó como fallo.

**Lo que la sonda NO distingue** (lo dice Fable en la adenda, y es honesto): el dato de la frase
partida en 37.143 —a quién compete retirar el autoclave— estaba también entero en la posición 2.748,
y es justo el que el juez citó. Así que no se sabe si el juez **evita el texto mutilado** o si
**prefirió la aparición completa del mismo dato** en la 2.748.
