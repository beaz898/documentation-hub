# SIEMBRA — Caso de control (superficies distintas al cargo/responsable)

> **Nota del repositorio (27/08/2026).** El registro se incorpora **literal**,
> tal como lo entregó su autor. Todo lo añadido va en el bloque **«AUDITORÍA Y
> MEDICIÓN»** del final, marcado y fechado. El texto original no se ha tocado.

Registro de auditoría de las tres contradicciones sembradas deliberadamente
entre `NOR-11_gestion-de-residuos-sanitarios.docx` y
`CLI-13_instrucciones-clinicas-residuos.docx`. Permite verificar los
resultados de un sistema de análisis documental sin necesidad de volver a
abrir los documentos originales.

**Propósito de este caso de control:** el corpus ya cuenta con un caso
probado de contradicción sobre *quién ocupa un cargo* (Director Clínico vs
Coordinador de Calidad, en NOR-10/CLI-12). Las tres contradicciones de este
par de documentos comparten el mismo mecanismo — dos textos que asignan
valores distintos al mismo dato — pero **ninguna es sobre un cargo ni sobre
una persona**. Esto importa porque permite distinguir si el sistema detecta
contradicciones razonando sobre el mecanismo (valores incompatibles para un
mismo dato) o si solo reconoce el patrón superficial del caso ya conocido
(fórmulas de tipo "es X, no Y" referidas a personas o roles). Si el sistema
solo encuentra estas contradicciones cuando se le orienta hacia ellas, pero
no las detecta en una comparación abierta de los dos documentos, es una
señal de que está memorizando la forma del ejemplo anterior en vez de
razonar sobre el mecanismo.

---

## Los documentos

1. `NOR-11_gestion-de-residuos-sanitarios.docx` — 5 páginas. Protocolo
   interno formal.
2. `CLI-13_instrucciones-clinicas-residuos.docx` — 4 páginas. Guía práctica
   para personal de gabinete.

---

## Contradicción 1 — Superficie: PLAZO

| | Documento | Página | Apartado | Afirmación literal |
|---|---|---|---|---|
| Versión 1 | NOR-11 | **1** | 2 · Principio general de retirada | "Los contenedores de residuos del grupo III no pueden permanecer en el área de almacenamiento intermedio más de **72 horas** desde el momento en que se cierran, transcurridas las cuales debe solicitarse su retirada al gestor autorizado aunque el contenedor no esté completamente lleno." |
| Versión 2 | CLI-13 | **1** | 2 · Regla general de retirada | "Ningún contenedor de residuos del grupo III debe permanecer en el almacén intermedio más de **7 días naturales** desde que se cierra, aunque esté lleno antes de ese plazo." |

**Naturaleza del conflicto:** dos plazos máximos incompatibles para el mismo
hecho (tiempo de permanencia de un contenedor de grupo III en almacenamiento
intermedio antes de la retirada obligatoria): 72 horas frente a 7 días
naturales (168 horas). Proporción 1:4, tajante y verificable con una simple
resta.

---

## Contradicción 2 — Superficie: LUGAR

| | Documento | Página | Apartado | Afirmación literal |
|---|---|---|---|---|
| Versión 1 | NOR-11 | **3** | 6 · Retirada por gestor autorizado | "El gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, ubicado **en la clínica de Chamberí**, desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro hasta su destino final de tratamiento." |
| Versión 2 | CLI-13 | **2** | 5 · Dónde se retiran los residuos | "El punto de retirada centralizado para las tres clínicas de la red se encuentra **en la clínica de Retiro**, que es el centro de referencia logística de residuos sanitarios de Dentavia." |

**Naturaleza del conflicto:** dos ubicaciones incompatibles para el mismo
punto logístico único (el punto de retirada centralizado de la red no puede
estar simultáneamente en Chamberí y en Retiro). No es una diferencia de
matiz geográfico: son dos clínicas distintas de la misma red, nombradas de
forma explícita en ambos textos.

---

## Contradicción 3 — Superficie: NEGACIÓN CATEGÓRICA (estructura distinta a "es X, no Y")

| | Documento | Página | Apartado | Afirmación literal |
|---|---|---|---|---|
| Versión 1 (niega) | NOR-11 | **5** | 10.2 · Uso incorrecto del contenedor negro | "Los residuos del grupo III se depositan siempre en el contenedor o bolsa de color amarillo descrito en el apartado 3.3. **En ningún caso se depositan en el contenedor negro** de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del grupo I. Introducir material biosanitario especial en el contenedor negro constituye una infracción del protocolo." |
| Versión 2 (afirma) | CLI-13 | **4** | 8 · Chuleta rápida de contenedores | "Los residuos del grupo III (gasas, guantes y material de un solo uso que ha estado en contacto con sangre o fluidos de un paciente) **se depositan en el contenedor negro** habilitado en cada gabinete." |

**Estructura gramatical de la negación (NOR-11):** prohibición categórica en
párrafo propio, con marcador de negación absoluta ("en ningún caso") seguido
de una segunda frase que refuerza la prohibición calificándola de
infracción. No usa la forma "es X, no Y": la afirmación positiva (va en el
contenedor amarillo) y la negación (nunca en el negro) están en frases
separadas, y la negación se remata con una consecuencia normativa (motivo de
infracción), no con una simple corrección de dato.

**CLI-13, por su parte, afirma con naturalidad y sin señalar conflicto
alguno** que ese mismo residuo va al contenedor negro, presentándolo como un
dato práctico más de la chuleta de consulta rápida, en el mismo tono que el
resto de líneas de esa lista.

**Naturaleza del conflicto:** color de contenedor incompatible para el mismo
grupo de residuo (grupo III, subtipo no punzante), con la particularidad de
que uno de los documentos formula su versión como prohibición categórica
explícita y no como una simple afirmación alternativa.

---

## Declaración: ninguna de las tres contradicciones es sobre cargos o personas

Las tres contradicciones tratan sobre datos operativos —un plazo en horas o
días, una ubicación física, un color de contenedor— y en ningún momento
sobre quién ocupa un puesto, quién es responsable de una tarea o qué persona
tiene autoridad sobre una decisión. Esto es deliberado: el corpus ya
contiene un caso de contradicción sobre un cargo (Director Clínico vs
Coordinador de Calidad, en NOR-10/CLI-12), y el valor de este segundo caso
de control depende precisamente de que su superficie sea distinta. Si un
sistema de análisis documental detecta las tres contradicciones de este
documento con la misma fiabilidad que la del caso de cargos, es una señal de
que reconoce el mecanismo general (dos valores incompatibles para el mismo
dato, tratado con la misma seriedad tanto si el dato es un plazo, un lugar o
una prohibición categórica como si es una persona). Si solo detecta bien el
caso de cargos y falla o duda en estos tres, es una señal de que el sistema
depende en algún grado del patrón superficial ya visto, no del razonamiento
sobre el mecanismo subyacente.

---

## Condición de consistencia verificada

Fuera de las tres contradicciones anteriores, los dos documentos son
consistentes entre sí en todo lo demás. En particular coinciden: el color
verde para el grupo II, el color azul para el grupo IV, el contenedor rígido
amarillo para el material punzocortante (subtipo del grupo III), el criterio
de cierre de un contenedor al alcanzar las tres cuartas partes de su
capacidad, y la ausencia de color específico asignado al grupo I (residuos
asimilables a urbanos, que van al contenedor de basura convencional de zona
común en ambos documentos). Ninguna cifra, plazo, color o nombre coincidente
entre ambos textos, aparte de las tres contradicciones señaladas, presenta
discrepancia.

---

## Resumen — qué debería encontrar un sistema perfecto

- **Exactamente 3 contradicciones** entre NOR-11 y CLI-13, ni una más ni una
  menos: el plazo de permanencia en almacenamiento intermedio (72 horas vs 7
  días naturales), la ubicación del punto de retirada centralizado
  (Chamberí vs Retiro) y el color de contenedor para el grupo III no
  punzante (amarillo, con prohibición expresa del negro, vs negro).
- **0 contradicciones adicionales.** Cualquier otro hallazgo de tipo
  "contradicción" entre estos dos documentos es un falso positivo.
- Un sistema que solo encuentra estas tres contradicciones cuando se le da
  una pista explícita sobre dónde buscar, pero no en una comparación abierta
  de ambos documentos completos, no debería considerarse que ha superado
  este caso de control: el objetivo es que las detecte por su propio
  análisis, igual que detectaría el caso de cargos ya probado.

---
---

# AUDITORÍA Y MEDICIÓN — AÑADIDO AL REPOSITORIO EL 27/08/2026

*Todo lo que sigue es posterior al registro original y no formaba parte de él.
El texto de arriba no se ha modificado en ninguna palabra.*

## A. La auditoría: **completa, no por muestreo**

A diferencia de `SIEMBRA_corpus_ampliado.md` —donde solo se comprobó lo que el
registro declaraba, y por eso se le escapó una cuarta contradicción—, aquí los
**dos documentos se han leído enteros**: 163 líneas de texto extraído (86 de
NOR-11, 77 de CLI-13). Cuando abajo se dice «no hay una cuarta», no significa
«no encontré más»: significa que se ha leído todo.

**Método**, para poder repetirlo:

```
unzip -p FICHERO.docx word/document.xml | sed -e 's#</w:p>#\n#g' -e 's/<[^>]*>//g'
```

Los números de línea de esta sección son los de ese texto extraído. **No se
verifican las páginas** del registro original: la extracción a texto plano
pierde la paginación, y no se cambia un número que no se ha comprobado.

### Las tres siembras, verificadas línea a línea

| Siembra | NOR-11 | CLI-13 | Estado |
|---|---|---|---|
| 1 · Plazo | línea **22** (ap. 2) | línea **21** (ap. 2) | ✅ literal, en los apartados que dice |
| 2 · Lugar | línea **53** (ap. 6) | línea **48** (ap. 5) | ✅ literal, en los apartados que dice |
| 3 · Negación | línea **76** (ap. 10.2) | línea **71** (ap. 8) | ✅ literal, en los apartados que dice |

Dos observaciones sobre la calidad de las siembras, que no estaban escritas:

- **La 1 es un par excepcionalmente limpio.** Las dos frases comparten grupo
  (III), lugar (almacén intermedio), **anclaje del cómputo** («desde que se
  cierra») e incluso la salvedad de que el volumen no cuenta. Solo difiere el
  número. Es el caso ideal para medir el mecanismo sin ruido.
- **La 2 es más fuerte de lo que el registro dice.** No son dos topónimos
  sueltos: cada documento construye encima su propia consecuencia operativa —
  NOR-11 dice que desde Chamberí se coordina el transporte *de* Salamanca y
  Retiro; CLI-13 dice que el interlocutor es el personal de Retiro *y no el de
  tu propia clínica*. Son incompatibles en dos niveles, no en uno.

## B. La condición de consistencia: **se sostiene**, con una precisión

Las cinco coincidencias que declara el registro están comprobadas una por una:

| Coincidencia | NOR-11 | CLI-13 |
|---|---|---|
| Verde para grupo II | :30 | :27 y :68 |
| Azul para grupo IV | :35 y :46 | :31 y :70 — **incluida la ubicación** (armario de medicación restringida) |
| Rígido amarillo punzocortante | :33 | :29 y :69 |
| Cierre a 3/4 de capacidad | :44 | :54 y :57 |
| Grupo I sin color asignado | :28 y :40 | :33 y :67 | 

Se comprobaron además, y también coinciden: la definición del grupo III, la
formación anual, el EPI ante derrames, la desinfección de superficies, el parte
de incidencias, quién traslada el contenedor al almacén y la declaración de que
no hay variaciones locales entre centros.

### ⚠️ PRECISIÓN sobre «grupo I sin color asignado»

Es cierto **en la clasificación** (NOR-11 apartado 3.1 y apartado 4), pero
NOR-11 **sí le asigna un color en el apartado 10.2**: llama al contenedor de
zona común **«el contenedor negro»** y dice que está «reservado exclusivamente
a los residuos asimilables a urbanos del grupo I».

**Y eso no es un descuido del corpus: es el mecanismo de la siembra 3.** Sin esa
frase, la prohibición de NOR-11 no tendría a qué referirse — «en ningún caso se
depositan en el contenedor negro» solo es una negación categórica si el
documento ha dicho antes qué es el contenedor negro. La redacción exacta de la
condición sería: *grupo I sin color en la clasificación, pero identificado como
«el contenedor negro» de zona común en 10.2, por exigencia de la siembra 3.*

De ahí sale una capa que el registro no menciona: los dos documentos **también
discrepan sobre qué ES el contenedor negro** — de zona común y para grupo I
según NOR-11, en cada gabinete según CLI-13. Vive dentro de las mismas dos
frases, así que no se cuenta aparte, pero hace la siembra 3 doblemente
contradictoria.

### No hay una cuarta contradicción

Repasadas las 163 líneas: ninguna otra cifra, plazo, color, ubicación o nombre
presente en los dos documentos se contradice. Los datos que solo aparecen en uno
—las 24 h de compromiso del gestor, los cinco años de archivo de albaranes, la
limpieza semanal del almacén, la revisión trimestral del Coordinador de
Calidad— no tienen contraparte y por tanto no pueden contradecir nada.

**Este par no tiene el defecto de NOR-10/CLI-12.** Su condición de consistencia
se sostiene.

## C. Tres características del par que hay que conocer antes de contar una tanda

### C.1 — La coartada jerárquica

Los dos documentos declaran, dentro de su propio texto, que uno manda sobre el
otro:

> **NOR-11:19** — «Este protocolo se complementa con las instrucciones clínicas
> prácticas dirigidas al personal de gabinete (CLI-13)… **sin alterar en ningún
> caso los criterios establecidos en el presente documento**.»
>
> **NOR-11:84** — «En caso de cualquier discrepancia aparente entre ambos
> documentos, **prevalece siempre el criterio de NOR-11**.»
>
> **CLI-13:17** — «**No sustituye a NOR-11**: ante cualquier duda no resuelta
> aquí, es ese protocolo el que se consulta en primer lugar.»

Es una **regla de resolución de conflictos escrita dentro de las propias
citas**, y un modelo puede leerla como «no hay contradicción, hay jerarquía».
No es un defecto: así funcionan los documentos reales. Pero es una variable no
declarada, y afecta a cómo se lee el resultado:

> **Las dos confirmaciones del 27/08 se lograron PESE a esta coartada, no en su
> ausencia.**

A diferencia de la coartada de CLI-12 —que vive en el apartado contiguo a su
siembra—, esta está en la **apertura y el cierre de NOR-11**, lejos de las tres
siembras, así que solo llega al modelo si el retrieval trae esos fragmentos.

### C.2 — La tensión sobre quién cierra el contenedor: NO es un falso positivo

> **NOR-11:23** — «El cómputo de las 72 horas se inicia en el momento exacto en
> que **el personal auxiliar cierra el contenedor** de forma hermética y lo
> traslada al área de almacenamiento intermedio…»
>
> **CLI-13:54** — «…si algún contenedor está a las tres cuartas partes de su
> capacidad, **ciérralo** y avisa al personal auxiliar para que lo traslade…»
>
> **CLI-13:42** — «**No traslades tú mismo** un contenedor lleno fuera del
> horario habitual sin avisar al personal auxiliar de turno.»

**No se cuenta como cuarta contradicción**, y el motivo es concreto: CLI-13 está
dirigida a «personal clínico **y auxiliar** de gabinete» (CLI-13:14), así que el
lector puede *ser* el auxiliar y las dos frases pueden ser verdad a la vez. Es
ambigua, no incompatible.

**Queda anotada para que no se cuente al revés.** Si en alguna tanda aparece un
hallazgo sobre quién cierra el contenedor, **no es una alucinación**: sale de
estas tres frases. Sin esta nota se contaría como falso positivo, que sería
penalizar al sistema por leer bien.

### C.3 — Sobre qué descansa el «cero adicionales»

El resumen del registro dice que cualquier otro hallazgo es un falso positivo, y
tras la auditoría completa **esa afirmación se sostiene**. Pero conviene saber
sobre qué descansa: una lectura íntegra de las 163 líneas, no una prueba
automática. Y tiene dos matices ya conocidos, los dos anotados arriba: la
**doble capa de la siembra 3** (§B — también discrepan sobre qué es el
contenedor negro) y la **tensión de C.2**, que no cuenta como contradicción pero
tampoco debe contarse como falso positivo.

## D. LO MEDIDO — tanda del 27/08/2026, sobre `8cf73e23`

| Contradicción | Superficie | Resultado |
|---|---|---|
| 1 · Plazo (72 h vs 7 días) | plazo | **CONFIRMADA** |
| 2 · Lugar (Chamberí vs Retiro) | topónimo | **CONFIRMADA** |
| 3 · Negación categórica (contenedor negro) | prohibición | **EL JUEZ NUNCA LA EMITE** |

**Línea de base: 2 de 3.** Detalle de la tanda en `claude/Tandas_Harness.md`;
los casos 10 y 11 del protocolo, en `claude/Protocolo_Harness_Tasas.md`.

### La tercera no es un fallo de selección

El material estaba **delante del juez**: entran 4 fragmentos de 16 y 4 de 11, y
el descarte de un solapamiento de esa misma pasada cita literalmente
**«contenedor negro habilitado en cada gabinete»**. Es decir, el pasaje de
CLI-13 llegó al prompt y el juez no emitió la contradicción.

Es un techo **distinto** del de la selección, y tiene pendiente propio:
**B.106** — en documentos de 4 y 5 páginas, los más pequeños del corpus y con
tres siembras, el juez devuelve exactamente «1 contradicciones» en el log crudo,
antes de cualquier filtro, y cada dirección devuelve una distinta. Nunca dos.

### LA LECTURA: el sistema RAZONA, no memoriza

Es la pregunta que este par existía para responder, y está contestada.

> El §propósito preguntaba si el sistema detecta contradicciones **razonando
> sobre el mecanismo** o si solo reconoce el **patrón superficial** del caso de
> cargos. **La respuesta es que razona:** dos superficies nuevas —un plazo y un
> topónimo—, ninguna sobre personas ni roles, confirmadas.

Y el límite, dicho con precisión: **la tercera no responde a esa pregunta.** No
dice que el sistema no razone sobre negaciones categóricas — dice que **muere
antes de llegar a razonarse**, en el juez, por un techo distinto. La pregunta
del caso de control sobre esa superficie sigue **sin medir**, y solo se podrá
medir cuando B.106 esté resuelto.
