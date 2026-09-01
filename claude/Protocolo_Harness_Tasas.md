# Protocolo del harness de tasas

*Escrito el 26/08/2026. Hasta hoy el harness se lanzaba de memoria: la bitácora
y `Cierre_B81.md` decían «cinco casos, protocolo fijo» sin decir cuál era el
protocolo. Este fichero lo fija.*

---

## ⚠️ ANTES DE NADA: «línea de base» significa dos cosas distintas

En la documentación de este proyecto la expresión se usa con **dos sentidos
opuestos**, y quien cruce los dos documentos sin saberlo creerá que uno miente:

| Dónde | Qué significa | Ejemplo |
|---|---|---|
| `claude/Cierre_B81.md` §3 | El estado **ANTES** de la cura. Es el retrato del **síntoma**. | `OPE-02 → RRHH-06: 0/4` — la dirección que NO detectaba |
| Los documentos de relevo | Lo medido **DESPUÉS**, el estado sano del que se parte | `OPE-02 → RRHH-06: 3/3` o similar |

Un `0/4` en `Cierre_B81.md` **no es una regresión**: es la enfermedad
documentada. Si al comparar una medición nueva con «la línea de base» sale que
todo ha mejorado muchísimo, probablemente se esté comparando contra el síntoma.

**Al citar una tasa, decir siempre contra qué commit se midió.**

---

## ⚠️ REGLA DE ADMISIÓN: ninguna medición cuenta sin su ground truth en el repositorio

*Añadida el 27/08/2026, tras la tercera pérdida de evidencia en una semana.*

> **Una medición cuyo ground truth no esté en el repositorio NO cuenta.** No se
> cita, no se compara contra ella, no se usa para aprobar ni para revertir un
> commit. Se vuelve a medir cuando la evidencia esté dentro.

«Ground truth» es todo lo necesario para reproducir la medición sin la memoria
de nadie: **los documentos** sobre los que se midió y el **registro de qué debía
encontrarse** en ellos. Si un par se mide sobre ficheros que solo existen en un
disco local o en una carpeta de Drive, la tasa no es verificable: es un recuerdo
con forma de fracción.

**POR QUÉ ESTÁ AQUÍ.** No es prudencia abstracta. En una sola semana la
evidencia faltó **tres veces**, siempre en el momento de ir a usarla:

| Qué faltó | Cuándo se descubrió | Cómo acabó |
|---|---|---|
| La tabla «LÍNEA DE BASE MEDIDA (harness, 25/08, `e43fbc8c`)» del documento de relevo | 26/08, al ir a comparar contra ella | **Perdida.** Buscada por título, por `e43fbc8c` y por `Belmonte`: sin resultado. Ver §5 |
| La batería de casos de F-65 (descarte de filas ajenas) | 27/08, al ir a implementar el predicado | **Recuperada**, escribiéndola en `claude/Descarte_Filas_Ajenas.md` antes de tocar código |
| `SIEMBRA_corpus_ampliado.md` y los cuatro documentos del corpus ampliado | 27/08, al analizar los falsos negativos de prosa (F-76) | **Recuperada**, creando `corpus-pruebas/` |

Tres veces en siete días no es mala suerte: es lo que pasa por defecto cuando el
sitio donde vive la evidencia es «fuera». El único sitio que sobrevive a un
cambio de máquina, a un vaciado de Drive y a la memoria del que midió es el
repositorio.

**Consecuencia práctica**: antes de lanzar una tanda, comprobar que los
documentos y su registro de siembra están commiteados. Si no lo están, subirlos
es el **primer** paso de la medición, no el último.

### Dónde vive el material de prueba

**`corpus-pruebas/`, en la raíz del repositorio.** Ahí están los documentos del
corpus ampliado y su registro de siembra.

**NUNCA en `public/`, y esta es una trampa fácil de pisar.** Todo lo que entra
en `public/` lo sirve Vercel abierto en internet, sin autenticación: un
documento clínico de muestra colocado ahí queda descargable por cualquiera que
acierte la URL, e indexable. Es la carpeta que uno elige por instinto para
«ficheros que no son código», y es justo la que no hay que usar.

### Estar en el repositorio NO BASTA: tiene que sobrevivir al checkout

*Añadido el 27/08/2026, el mismo día que la regla de admisión, porque el primer
intento de cumplirla ya falló por aquí.*

> Un documento de prueba no está a salvo por estar commiteado. Está a salvo
> cuando **vuelve del repositorio byte a byte**, y eso hay que declararlo, no
> suponerlo.

**El caso, medido**: `NOR-01_rgpd-proteccion-datos-pacientes.pdf` son 4.333 bytes
y **no contiene ni un byte `NUL` en sus primeros 8 KB** —sus streams van sin
comprimir—, así que la heurística de git lo clasificó como **texto**
(`git ls-files --eol` lo delataba: `i/lf w/lf`, no `-text`). Con
`core.autocrlf=true`, que es lo que tiene este repositorio, el siguiente
checkout le habría metido `CR` en sus **99** saltos de línea: 4.432 bytes en vez
de 4.333, la tabla `xref` desplazada, y un PDF que no abre. El blob commiteado
era correcto; **el daño ocurría al recuperarlo**, que es justo cuando hace falta.

**La cura**: `corpus-pruebas/.gitattributes` declara `binary` para `.pdf`,
`.docx` y `.xlsx`, y `-text` para el `.txt` del corpus —CLI-03 es texto plano,
pero sus bytes son el dato: la siembra de los 15 años vive en su línea 82—.
Los `.docx` y `.xlsx` se detectan solos, y se declaran igual: **una heurística
no es una garantía, y el ground truth de una medición no puede depender de
ella.**

**Cómo se comprueba**, y no basta con mirar el atributo: se hace el viaje
entero. Borrar el fichero, `git checkout --` y comparar `sha256sum` y tamaño
contra el original. Así se verificó el `.gitattributes` antes de commitearlo
(`205eaf01…`, 4.333 bytes, idéntico).

**Al añadir un documento nuevo al corpus**: mirar `git ls-files --eol` y, si
sale `i/lf` en algo que no sea texto nuestro, declararlo en el
`.gitattributes` antes de empujar.

---

## ⚠️ REGLA DE ENTRADA: ningún cambio entra sin mecanismo, no-regresión e incidencia

*Añadida el 27/08/2026 (F-81 P3). Va aquí, pegada a la regla de admisión, porque
las dos son condiciones de entrada: aquella para las MEDICIONES, esta para los
CAMBIOS.*

**EL ORIGEN, literal, porque la formulación importa.** Es una cautela del
director:

> «Que no haya mejoría en el caso de prueba no quiere decir al cien por cien que
> esa mejora no funcione, sino que para el caso de prueba no funciona. Puede ser
> que no funcione para ningún caso, pero eso no lo podemos certificar. Algo que
> ahora no da mejoría, cuando tengamos cincuenta documentos de otra dimensión o
> de otro tipo, puede cambiar — para bien o para mal.»

Es la **asimetría de la evidencia negativa**: una tanda que no se mueve no dice
«esto no sirve», dice «esto no sirve AQUÍ». Y hasta hoy la tratábamos mal en
**las dos direcciones**:

- Aplazamos el commit de normalización de citas **porque no movía ninguna
  siembra** —aunque el fallo que arregla está diagnosticado y es real—.
- Damos por bueno el bloque del verificador **porque funciona en cinco
  documentos de prueba**, que no dice nada de qué hará con cincuenta de un
  cliente.

Las dos son el mismo error de lectura: confundir el alcance del corpus con el
alcance de la verdad.

### La regla, en tres condiciones. Ningún cambio entra sin las tres

**1. MECANISMO DEMOSTRADO.** Existe al menos un caso —sembrado en el corpus o
test determinista— que **falla sin el cambio y pasa con él**.

Esta condición cierra los dos extremos a la vez. Muere «no lo mide el corpus,
así que no entra», porque la condición admite casos **construidos**. Y muere «yo
creo que sirve», porque si no puedes construir ni un caso que tu arreglo
arregle, es fe.

**2. NO-REGRESIÓN MEDIDA.** La tanda del harness (§3, para lo que un modelo lee)
o la suite determinista (§1-bis, para lo demás) **no empeora en nada**.

**3. INCIDENCIA OBSERVABLE.** El cambio deja **contador en producción** —cuántas
veces actúa— para que «¿sirvió de verdad?» tenga respuesta con datos dentro de
tres meses, en vez de opiniones hoy.

El porqué de la tercera es la dirección inversa de la cautela, y es la que se
olvida: **producción es la tanda que nunca termina.** Un cambio que funciona en
cinco documentos y **no actúa nunca** en cincuenta no es un acierto: es una pieza
que no sabemos si sirve, y sin contador no lo sabremos jamás.

**Cómo se escribe ese contador: `claude/Contrato_Contadores.md`** (F-82,
28/08/2026). Cinco cláusulas —apellido de etapa, solo recuentos de decisión,
lectura por nombre, la fusión solo transporta lo declarado, y la clave nunca
lleva datos del cliente— escritas antes de crear el campo que los guarda. La
condición 3 exige el contador; aquel fichero dice cómo tiene que ser para que no
acabe como `discardedFindings`.

### Los dos ejemplos del proyecto, que valen más que la regla abstracta

**Cómo se hace BIEN — el bloque del verificador (F-77).** Entró con la siembra A
demostrando el mecanismo, y se validó su generalización con NOR-11/CLI-13. **No
entró por fe.**

**El caso que la regla desatasca — la normalización de citas.** El fallo del
«quince (15) años» está diagnosticado y la batería diseñada. Cuando esa batería
corra como test y pase, el cambio **entra declarado y demostrado —aunque ninguna
tanda del corpus mueva su aguja—**, porque la condición 1 admite el test. Antes
de esta regla llevaba aplazado por la razón equivocada.

---

---

## ⚠️ REGLA DE CUSTODIA: toda consulta a Fable se archiva íntegra

*Añadida el 28/08/2026 (F-85). Es la primera de las dos reglas que aquella
consulta declara vinculantes.*

> **Toda consulta a Fable se archiva ÍNTEGRA al cerrarse, junto con la consulta
> enviada.** Y toda regla que una respuesta declare vinculante **se promueve al
> protocolo en el commit que la adopta**, con referencia a la consulta que la
> originó.

**DOS CAPAS, y la separación es el punto.** El PROTOCOLO es la ley vigente: qué
se hace hoy. El ARCHIVO (`claude/consultas-fable/`) es la jurisprudencia: el caso
concreto, la evidencia y la exposición de motivos de cada regla.

**Quien quiera saber QUÉ es ley lee el protocolo; quien quiera saber POR QUÉ,
sigue la referencia.** Sin la primera capa, la ley se busca leyendo doce
consultas. Sin la segunda, la ley queda sin motivos y el primero que la
encuentre incómoda la cambiará sin saber qué compraba.

**SE ARCHIVA EL PAR, NO LA RESPUESTA.** Una respuesta sin su consulta delante es
ilegible: no se sabe qué se preguntó ni con qué evidencia. El agujero medido el
día que se escribió esta regla lo enseña — de F-70 a F-85 no había **ni un solo
par completo**: de F-70 estaba la respuesta y faltaba la consulta; de F-81, la
consulta y faltaba la respuesta.

**Y SE ARCHIVA ÍNTEGRO, nunca resumido**: el resumen es donde muere el matiz.

---

## ⚠️ REGLA DE VERIFICACIÓN AL USAR: un documento normativo se comprueba antes de apoyarse en él

*Añadida el 28/08/2026 (F-85), con dos casos de la misma semana.*

**LA TAXONOMÍA, que es lo que hace operativa la regla.** Los documentos de este
repositorio no son todos iguales, y se pudren de forma distinta:

| | qué afirma | ¿se pudre? |
|---|---|---|
| **NORMATIVOS** — el protocolo, `Contrato_Contadores.md`, `Puntos_Pendientes_Doclity.txt` | «así es el sistema HOY» | **Sí, POR DISEÑO**: el sistema cambia después de escribirlos |
| **HISTÓRICOS** — las consultas archivadas, `Bitacora_Sesiones.txt` | «esto se dijo el día tal» | **No pueden**: lo dicho sigue habiéndose dicho |

> **Un documento NORMATIVO que se vaya a usar como PREMISA de una decisión se
> verifica contra la realidad antes de apoyarse en él.**

No es desconfianza: es que un normativo describe un sistema que sigue moviéndose,
y el que lo escribió no podía saber lo que vendría después. Un HISTÓRICO no
necesita verificación —solo su lectura puede pudrirse, si alguien lo toma por
presente—, y para eso está la cabecera de estado de cada consulta archivada.

**LOS DOS CASOS DE ESTA SEMANA, que son lo que hace creíble la regla:**

- **El contrato de contadores** declaraba una víctima de la cláusula 5 como si
  `porColumna` ya viviera en `pipeline_counters`. No vivía ahí: estaba en
  `TableDiffCounts`, una estructura que **no se persiste en ninguna parte**. El
  incumplimiento era real pero FUTURO. Se descubrió **al ir a sanearlo**, o sea
  al usarlo como premisa.
- **B.113** decía que el protocolo tenía 403 líneas cuando ya tenía 466 — **y su
  trabajo era precisamente vigilar ese crecimiento**. Un vigilante con el número
  desactualizado. Se descubrió al ir a citarlo.


**LA TERCERA VEZ EN UNA SEMANA, y las tres cazadas por esta regla.** No es una
cautela teórica: es lo que más ha rendido del protocolo en siete días.

| Documento | Dónde vivía | Qué afirmaba de falso |
|---|---|---|
| `Contrato_Contadores.md` | **dentro** del repo | una víctima de la cláusula 5 como si `porColumna` ya viviera en `pipeline_counters`. Vivía en una estructura que no se persiste |
| **B.113** | **dentro** del repo | que el protocolo tenía 403 líneas cuando tenía 466 — **y su trabajo era vigilar ese crecimiento** |
| La lista de **deuda técnica** | **FUERA** del repo | cuatro de sus cinco puntos. Uno resuelto hacía meses, dos mal enunciados, uno a medias |

**LO QUE ENSEÑA LA TERCERA, y no lo enseñaban las dos primeras**: estar dentro
del repositorio **no basta** —las dos primeras se pudrieron estando dentro— pero
estar FUERA lo hace **inevitable**. Un documento que ningún commit toca y ningún
`grep` encuentra no tiene forma de corregirse: no hay ocasión en que alguien
tropiece con él mientras hace otra cosa.

> **Un documento normativo que vive donde nadie lo verifica se pudre entero.
> Dentro del repositorio se pudre a trozos, y de vez en cuando alguien lo pilla.**

Por eso la lista de deuda se trajo al repositorio el 01/09 (cabecera de la parte
B de `Puntos_Pendientes_Doclity.txt`) **con la fecha de comprobación en cada
punto**. La fecha es la mitad que faltaba: sin ella, un estado dice lo que
alguien creyó, no lo que el código hacía.

**Y las tres se cazaron igual**: yendo a usar el documento como premisa y
comprobándolo antes de apoyarse. Ninguna se encontró releyendo.

**LOS DOS SE CORRIGIERON SIN REESCRIBIR HISTORIA**: el contrato explica qué se
creyó y qué era; B.113 conserva su cifra original y añade la de hoy. Corregir un
normativo es actualizar lo que afirma del presente, nunca borrar lo que se creyó
en su momento — eso es lo que hace el archivo, y para eso está.


## ⚠️ REGLA DE LA DOBLE LECTURA: una regla dictada se ejerce contra un caso medido ANTES de implementarla

*Promovida de F-91 el 30/08/2026. Es la HERMANA de F-79 —«si la respuesta no
cita el asunto exacto, paradla»—: aquella vigila que la respuesta hable **de lo
que se preguntó**; ésta, que lo que dice signifique **una sola cosa**.*

> **Antes de implementar una regla dictada, se EJERCE contra un caso MEDIDO. Si
> dos lecturas razonables de la misma frase dan resultados distintos sobre ese
> caso, no se elige: se pregunta.**

**EL CASO QUE LA FUNDA.** F-90 P3 dictó: «si todas las columnas COMUNES
difieren, R2 no confirma». «Comunes» admitía dos lecturas —las columnas que el
juez CITÓ, o todas las que las dos filas COMPARTEN— y sobre el caso real de
B.124 la primera **descartaba un hallazgo VERDADERO**: el de la misma pasada que
motivó el frente entero. Ninguna de las dos suena mal leída de corrido. Ver
F-91.

**Y EL DETALLE QUE LA HACE OPERATIVA**, porque sin él la regla es un consejo: la
ambigüedad **NO se encontró leyendo**. Se encontró **EJECUTANDO** — un caso de la
batería devolvió «1 columna de ancla» donde se esperaba cero, y esa cifra medida
fue la que destapó que había dos lecturas. Releer una regla buscando
ambigüedades no funciona: **las dos lecturas parecen la misma hasta que un número
las separa.** Por eso la regla dice EJERCER, no revisar.

**QUÉ CUENTA COMO CASO MEDIDO**: uno del corpus, con sus cifras tomadas. No un
ejemplo inventado — un ejemplo inventado se construye, sin querer, para que salga
bien la lectura que uno ya tenía en la cabeza.


## ⚠️ LA AMBIGÜEDAD DE ALCANCE DEL CUANTIFICADOR, y las TRES PIEZAS que la matan

*Promovida de F-92 P4 el 31/08/2026. **Complementa a la regla de la doble
lectura de arriba; no la sustituye.** Aquella caza la ambigüedad EJERCIENDO, o
sea después de que exista; ésta intenta que no llegue a existir.*

**EL PATRÓN TIENE NOMBRE, y no lo inventamos nosotros**: *ambigüedad de alcance
del cuantificador*. «Todas las X» está indefinido hasta que se dice **de qué
conjunto sale X**. Las dos veces que nos pasó en el frente 1, la palabra estaba
dentro de una regla por lo demás precisa:

| Regla | La palabra | Los dos universos |
|---|---|---|
| F-90 P3 | «todas las columnas **COMUNES**» | ¿las que el juez CITÓ, o las que las dos FILAS comparten? |
| F-89 P4 | «un par de tablas que el diff ya **COMPARÓ**» | ¿las TABLAS, o ESE DATO? |

Las dos suenan inequívocas leídas de corrido. Las dos **separaban hallazgos
verdaderos de falsos** según cómo se leyeran. Y ninguna se vio leyendo.

El diagnóstico es de Fable y vale para cualquiera que escriba una
especificación: **«el universo obvio es exactamente el que no se escribe.»**

### LAS TRES PIEZAS — lo que una regla dictada debe traer

> Toda regla dictada se entrega en **tres piezas**:
> 1. **el predicado**, con sus variables;
> 2. **el universo de cada nombre cuantificado** — columnas ¿de qué? de las
>    filas / citadas / compartidas / comparadas;
> 3. **un caso a cada lado de la frontera**, nombrado con datos del corpus.

El ejemplo canónico es la respuesta de F-92 P1:

    suprimir(h) ⇔ par(h) ∈ emitidos
                  ∧ (fila_a, fila_b)(h) ∈ emparejadas(par)
                  ∧ columnas(h) ⊆ comparadas(par)

con sus universos declarados y sus dos casos: «Precio base» en EST-03/EST-03
(dentro, se suprime) y «Horas semana» en Belmonte/Belmonte (fuera, sigue).

**Fable lo asume como regla de la casa para su lado.** Y pone dos límites
honestos que se conservan para que nadie la crea infalible: **no cazará
ambigüedades en nombres que no PARECEN cuantificados** («el dato», «el par»), y
**no sustituye a la regla de la doble lectura**.

### LO QUE NOS TOCA A NOSOTROS, que es la mitad que podemos controlar

> **Una regla en prosa NO SE IMPLEMENTA: SE TRADUCE a predicado.** Y si al
> traducirla aparece un nombre sin universo, **se pregunta en vez de elegir**.

Es la disciplina de F-57 —cambiar el formato obliga a revisar las
instrucciones— aplicada a la frontera entre lenguaje y código: **la traducción
es donde se ve el hueco**. Elegir un universo «porque es el obvio» es
exactamente lo que produjo los dos fallos: las dos veces se eligió sin saber
que se estaba eligiendo.

### LA CUARTA PIEZA: el comportamiento en VACÍO y en AUSENTE (F-93)

*Añadida el 31/08/2026, el mismo día que las otras tres y por el mismo frente.
Las tres de arriba no habrían cazado lo que sigue, y eso lo dice la respuesta
que las dictó.*

> **Toda variable de conjunto declara qué pasa cuando está VACÍA y cuando está
> AUSENTE. Y la regla se escribe en forma EXISTENCIAL cuando su sentido es «hay
> algo cubierto».**
>
> **Un `⊆` o un `∀` en una regla de cobertura es sospechoso por defecto: CUMPLE
> EN VACÍO. Un `∃` o un `≠ ∅` fracasa en vacío, que es lo que una regla de
> cobertura debe hacer.**

**LA TRAMPA TIENE NOMBRE VIEJO: la verdad vacua.** «Todos los elementos de ∅
están en X» es cierto para cualquier X, y `⊆` es una afirmación universal.

**EL CASO QUE LA FUNDA**, y es el más incómodo posible. F-92 P1 dictó:

    columnas(h) ⊆ comparadas(par)      → suprimir

y una frase más abajo, en prosa: *«hallazgo SIN columns: no se suprime»*. **La
fórmula decía suprimir exactamente en el caso que la prosa exceptuaba.** Dos
fuentes de verdad, y la que manda al implementar es la fórmula.

**Y el detalle que lo vuelve serio**: el hallazgo que motivó F-92 entero
—Belmonte— devuelve **el conjunto vacío**. El caso que dio origen a la consulta
caía en el agujero degenerado de su propia respuesta.

**La forma correcta** de la misma regla, ya con la cuarta pieza aplicada:

    R2.differingColumns(h) ≠ ∅        → suprimir

**LAS TRES FORMAS QUE HAY QUE DECLARAR**, medidas en este proyecto y no
inventadas: una lista, la lista vacía, y `null` — `alignQuoteToCells` devuelve
`null` cuando no casan todos los segmentos, así que «no hay columnas» y «no se
pudo saber qué columnas» son estados distintos y llegan por caminos distintos.

**LÍMITE HONESTO, de quien la dicta**: sigue sin cazar nombres sin universo en
términos que **no parecen conjuntos** («el dato», «el par»), y **no sustituye a
la traducción-y-pregunta**. Las cuatro juntas —predicado, universos, casos a
cada lado, comportamiento en vacío y ausente— habrían cazado las tres
ambigüedades del frente 1; ninguna de las cuatro por su cuenta lo habría hecho.


---

## ⚠️ UN CERO NO ES UNA AUSENCIA: SE REPORTA CON LA TASA QUE EXCLUYE

*Promovida de F-92 el 31/08/2026, con un caso propio que costó una conclusión
equivocada.*

> **«Cero en N pasadas» no significa «no ocurre». Significa «descarta tasas por
> encima de X». Se reporta con la X, siempre.**

**EL CASO QUE LA FUNDA, y es nuestro.** El 30/08 se lanzaron **cuatro** pasadas
buscando el falso positivo de B.124, salieron **cero**, y de ahí se concluyó
«no se puede reproducir» (B.125). El 31/08, con seis pasadas, apareció **tres
veces**: una tasa del **50 %**.

Aquel cero no era una tasa baja: **era mala suerte**. Un fallo que ocurre la
mitad de las veces sale cero en cuatro pasadas el **6 %** de las veces.

**LA TABLA**, calculada al 95 % de confianza — un cero en N pasadas solo
descarta tasas por encima de:

| N | descarta tasas > |
|---|---|
| 2 | 78 % |
| 3 | 63 % |
| **4** | **53 %** |
| 6 | 39 % |
| 10 | 26 % |
| 20 | 14 % |
| 30 | 10 % |

*(la fórmula: `1 − 0,05^(1/N)`, de exigir que `(1−p)^N ≤ 0,05`)*

**Léase la fila del 4 al lado de la tasa real de B.124.** Cuatro ceros
descartaban tasas por encima del 53 %; la real era el 50 %. **Estaba dentro de
lo que aquella medición no podía excluir, por poco.** No fue mala suerte
extraordinaria: fue el instrumento haciendo justo lo que podía.

**CONSECUENCIA PRÁCTICA**: para afirmar que algo es *raro* —por debajo del 10 %—
hacen falta **treinta pasadas**, no cuatro. Si no se van a lanzar treinta, la
frase correcta no es «no ocurre» sino «cero en cuatro: no descarta nada por
debajo del 53 %».


## ⚠️ PARA SABER SI LA CULPA ES DEL DATO, EJECUTA EL CAMINO SIN EL DATO

*Promovida el 01/09/2026. Nace de atribuir a un documento, durante cuatro
intentos, un fallo que era del proveedor.*

> **Cuando un fallo se repite siempre con el mismo dato, antes de examinar el
> dato hay que buscar un camino que recorra la misma infraestructura SIN
> LLEVARLO. Si ese camino también falla, el dato queda exonerado por una
> prueba que no lo contiene — y eso es más fuerte que cualquier inspección
> del dato.**

**EL CASO.** `OPE-13_cobertura-por-clinica.xlsx` falló cuatro veces con un 500 de
Pinecone; `RRHH-08`, su gemelo, ninguna. Tres fallos en `/embed` y uno en
`/indexes/documentation-hub`. Durante los cuatro, la hipótesis viva fue «el
fichero tiene algo raro dentro».

Se comparó byte a byte contra su gemelo: mismas 9 entradas del zip, 15 chunks,
**el mismo inventario de 61 codepoints sin ni una diferencia**, cero caracteres
de las nueve familias sospechosas. Limpio. **Pero una comparación limpia no
demuestra nada**: solo dice que no se encontró, y quien la lee no sabe si es
que no había o que se buscó mal.

**LO QUE SÍ LO DEMOSTRÓ**, en un minuto y sin escribir código: llamar a
`/api/admin/diagnose-vectors`, que **resuelve el mismo índice por la misma
llamada del cuarto fallo y no manda ni un byte de documento**. Dio 500. Caso
cerrado por experimento.

### POR QUÉ SE TARDÓ CUATRO INTENTOS — y es la parte que vale para la próxima

**El único camino donde el fallo se veía llevaba un documento dentro.** Sincronizar
y analizar mezclan dos variables —el documento y la infraestructura— en la misma
observación, así que ninguna de las cuatro podía separarlas. No fue mala
deducción: fue **un instrumento que confunde dos causas**, y con él la
correlación «siempre OPE-13» parecía significar algo.

**ES UNA ESPECIE DISTINTA DE LOS LÍMITES YA CONOCIDOS**, y conviene no
mezclarlas:

| | El instrumento no puede… |
|---|---|
| B.121 | …detectar una confusión de lados: el corpus es simétrico |
| B.125 | …reproducir el fallo: el juez es intermitente |
| B.129 | …producir el caso: el corpus no lo contiene |
| **ésta** | **…separar dos variables: todas las observaciones las llevaban juntas** |

Las tres primeras son **ceguera**. Ésta es **confusión**, y se cura distinto: no
hace falta un corpus mejor ni más pasadas, hace falta **una observación con una
variable menos**.

### CÓMO SE APLICA

Buscar la llamada **más pobre** que recorra la misma infraestructura: la que no
lleve el dato, o lleve el mínimo. Suele existir ya —un endpoint de diagnóstico,
una comprobación de salud, una operación de solo lectura— y suele ser gratis.
**Antes de inspeccionar el dato, ejecútala.**

Y su reverso, que es la otra mitad de la misma disciplina: **si el camino sin el
dato NO falla, eso tampoco exonera a la infraestructura** — es un cero, y un
cero se reporta con la tasa que excluye (regla de arriba), no como ausencia.


## ⚠️ REGLA DE CIERRE: qué bloquea y qué se declara

*Promovida de F-89 P6 el 30/08/2026. Se promueve ANTES que las otras dos reglas
de esa consulta —la jerarquía simétrica y la regla del ancla, que esperan a su
commit— porque ésta la usa el director ANTES de que se cierre ningún frente, y
una vara que vive solo dentro de una respuesta no se puede aplicar sola.*

**LA PROMESA VENDIBLE TIENE TRES PATAS:**

1. **Lo mostrado es real.**
2. **Lo estructural es completo.**
3. **Lo no examinado se declara.**

**EL CRITERIO, en una línea cada uno:**

> Es **BLOQUEANTE** todo lo que hace **falso lo mostrado** o **pierde un juicio
> del usuario**.
>
> Es **DECLARABLE** todo lo que sea **límite de cobertura contado y dicho**.

**POR QUÉ ESTA FRONTERA Y NO OTRA.** No separa lo grave de lo leve ni lo caro de
lo barato: separa lo que **rompe una promesa** de lo que **la promesa ya prevé**.
Un límite de cobertura no es un defecto si está contado y dicho — la promesa
nunca fue exhaustividad. Un falso con sello sí lo es, por pequeño que sea,
porque desmiente la primera pata. Y perder un juicio del usuario desmiente F-67,
que es de donde sale la segunda mitad del criterio.

**CÓMO SE APLICA.** Ante cualquier pendiente, dos preguntas:
  · ¿Hace que algo mostrado sea falso? → bloqueante.
  · ¿Pierde una decisión que el usuario ya tomó? → bloqueante.
  · ¿Es cobertura que no llega, CONTADA y DICHA? → declarable.
  · ¿Es cobertura que no llega y NO se cuenta ni se dice? → bloqueante, hasta
    que se cuente y se diga. Contarlo y decirlo es lo que la vuelve declarable.

**EL ÚLTIMO PUNTO ES EL QUE MÁS SE OLVIDA**, y es el que convierte esta regla en
trabajo y no en excusa: declarar no es callar con permiso. Un límite declarable
que nadie ha contado ni escrito **no está declarado**, y mientras no lo esté,
bloquea igual. Es la misma exigencia que la condición 3 de la regla de entrada
—todo cambio deja contador— vista desde el cierre en vez de desde la entrada.

**EL LISTÓN, textual de F-89:** «esto se le enseña a un cliente diciendo la
verdad entera — que es el único listón que este producto se ha puesto».

El reparto vigente de los cuatro frentes del MVP —cuáles bloquean y cuáles se
declaran— está en `Puntos_Pendientes_Doclity.txt`, «EL MAPA DEL MVP». Aquí vive
el criterio; allí, su aplicación.


## 1. Para qué sirve

La regla que fijaron F-59 y F-61, y que este harness existe para hacer cumplible:

> **Nada que toque lo que un MODELO LEE entra sin su tanda.**

El criterio de reparto:

- **Cambio de CÓDIGO que no toca lo que un modelo lee** → `npm run typecheck`
  (raíz y worker) y su batería determinista. Sin tasas. Ejemplos: `e43fbc8c`
  (la alineación posicional, medida con 250 citas deterministas), `d384a315`
  (transporte de campos).
- **Cambio de PROMPT, de PRESENTACIÓN o de FORMATO de lo que se le entrega a un
  modelo** → tanda de tasas, obligatoria. Ejemplos: `de158abd` (una línea del
  prompt del juez), `7cb7038d` (el formato barato de tabla).

El motivo está en `Cierre_B81.md` §3: sin tasas, el 24/08 se revirtieron dos
commits **correctos** (`d51001f3` y `fa5c4adc`) porque una tanda posterior no
emitió. La correlación era ruido. Una ejecución suelta no distingue una racha de
un régimen.

---

## 1-bis. Dónde vive la mitad determinista: Vitest, y para qué NO

*Añadido el 27/08/2026, el día que se instaló Vitest. El alcance se escribió
antes de instalarlo, para que la herramienta no acabe definiendo su propio uso.*

El criterio de §1 reparte en dos, pero hasta hoy solo una mitad tenía casa. Lo
que un modelo lee se mide con **tandas** (§3). Lo determinista se medía con «su
batería determinista» —y esa batería no existía en ningún sitio ejecutable: las
de F-65/F-75 vivían escritas en prosa en `Descarte_Filas_Ajenas.md`, que es
mejor que la memoria de nadie pero no se lanza. **Vitest es esa casa.**

> **Vitest existe en este proyecto para EJECUTAR BATERÍAS DETERMINISTAS: código
> puro, entrada conocida, salida conocida.**

**NO se testean aquí**: componentes de React, rutas de API, hooks, nada que
necesite Supabase, Pinecone o Anthropic, ni **mocks** de ninguno de los tres.
Para lo que necesita estado real hay endpoints de diagnóstico
(`app/api/admin/diagnose-vectors` es el precedente). Para lo que lee un modelo
hay tandas.

Si un día alguien quiere testear otra cosa, que sea **una decisión discutida y
escrita**, no una consecuencia de que la herramienta ya esté ahí.

**Dónde viven los tests**: al lado de su módulo (`lib/chunking.test.ts` junto a
`lib/chunking.ts`), no en una carpeta propia. Se agrupa por dominio, no por tipo
de fichero — y así el módulo y su batería **se borran juntos** el día que se
retiren. La fase 1 nace pudiendo morir.

**Los fixtures son `corpus-pruebas/`**, los mismos documentos de las tandas, con
sus registros de siembra ya versionados. No se duplican datos de prueba: la
regla de admisión (arriba) vale igual para una batería que para una tasa.

**Cómo se lanza**: `npm test` (`vitest run`, una pasada, sin modo interactivo).
La configuración —el alias de `@/*` y este mismo alcance, en comentario— está en
`vitest.config.mts`.

**El alcance lo hace cumplir una guarda, desde el 30/08.** Estuvo tres días
escrito aquí y en `vitest.config.mts` sin que lo vigilara nadie, y se rompió sin
que saltara nada: un caso llamaba a api.anthropic.com, volvía 401, el fail-open
del cliente se lo tragaba y **pasaba en verde**. Un test que no puede fallar por
la razón que vigila. Ver B.126.

`vitest.setup.ts` intercepta `fetch` —por ahí pasan los tres— **anota** la
violación y rompe el caso **desde `afterEach`**, no desde la excepción: el código
de producción está diseñado para tragarse los fallos de red y se tragaría también
el de la guarda. **Que un test no pueda silenciar a su propia guarda es la única
forma de que la guarda sirva de algo** — comprobado mutándola: sin el `afterEach`,
el caso sucio vuelve a pasar en verde.

De ahí sale una regla de escritura, no solo de herramienta: **en la batería solo
caben caminos que terminen en descarte.** Lo que sobrevive, sobrevive *hacia el
modelo*, y eso no se mide aquí — se mide en una tanda (§3). Si un caso rompe
contra la guarda, la salida no es apagarla ni añadir un mock: es que el caso se
salió del alcance.

**Los tests entran en `npm run typecheck`.** Importan `describe`/`it`/`expect`
explícitamente desde `'vitest'` en vez de declarar globals, así que `tsc` los
compila como cualquier otro `.ts` sin tocar `tsconfig.json` — verificado
metiendo un error de tipos a propósito en un test y comprobando que
`tsc --noEmit` lo caza. Es donde se quiere el gate: cubriendo también la
batería.

---

## 2. Los casos

**Están en `claude/Casos_Harness.md`.** Once casos, en tres grupos: el piloto
dental (1 a 5), el corpus ampliado (6 a 9) y el control de superficies (10 y
11). Ahí va, por cada uno, qué documentos entran, qué debe encontrar y **su
línea de base medida** — la cifra viaja con el caso que mide, no aquí.

Se separaron el 27/08/2026, cuando este fichero pasó de 400 líneas. **Este
sigue siendo el del método**; aquel es el catálogo. Ninguno repite al otro.

Lo que sí es método y se queda aquí: la regla de admisión (arriba), cómo se
lanza una tanda (§3), qué se apunta de cada pasada (§4) y la lista de cierre
(§4-bis).

---

## 3. Cómo se lanza

Fijado por el director el 26/08:

- **Desde la bandeja de revisión, modo rápido.**
- **Los dos documentos de un par van marcados en la MISMA tanda.** El corpus
  activo está vacío, así que lo que entra en la tanda **ES** el corpus de esa
  ejecución. (Mecanismo: la bandeja manda `batchDocumentIds` con los ids de los
  otros documentos seleccionados, y `buildCorpusFilter` los añade al corpus
  consultado aunque estén en `pendiente`.)
- **Se vacía el corpus entre pares** (casos 1 a 4). No vaciar cambia las
  condiciones: un par que se mide con documentos ajenos en la tanda no está
  midiendo la detección entre esos dos, porque el retrieval y el rerank ven otra
  cosa. El caso 5 es la excepción razonada, y por el motivo opuesto: ver
  `claude/Casos_Harness.md`.
- **Cuatro pasadas por dirección** cuando se comparen tasas entre estados
  distintos del código. **Una pasada basta** para comprobar que algo no se ha
  roto, pero **NO** para afirmar que una tasa cambió: B.81 era intermitente y
  una pasada buena no distingue «arreglado» de «hoy tuvo suerte».
- **org_id de pruebas**: `5a82712f-6740-4792-b291-3fdea8e6edb1`.

---

## 4. Qué se apunta de cada pasada

Por cada ejecución:

- **Caso y dirección** (cuál es el analizado y cuál el del corpus).
- **Commit** sobre el que se mide, con su hash corto. Sin esto la tasa no
  significa nada (ver la advertencia de arriba).
- **Hallazgos emitidos**: cuántos, con su `topic` y su `confirmedBy`
  (`estructura` / `juicio` / `double_check`).
- **Falsos positivos**, si los hubo, con su título.
- **Tiempo** de la ejecución. Fue la firma del fallo en B.81 y la de la cura:
  2,2 s cuando descartaba sin comparar, 5,8-6,8 s cuando comparaba de verdad.
- **`discardedFindings`** del log, en particular `columna_indeterminada` y
  `citaNoVerificable`.
- **Caídas de etapa**: desde `38d3fd22`, si el análisis trae `stageFailures`,
  **la pasada no vale** — el LLM falló y las tasas no miden lo que se cree.

**Dónde se acumulan las tandas**: en **`claude/Tandas_Harness.md`**, una entrada
por tanda, **creciendo por arriba** — lo más reciente primero. Ese fichero es el
histórico y no repite este protocolo; este protocolo no repite sus cifras.

Antes de que existiera, el resultado se copiaba a mano al mensaje de commit o a
la bitácora, y así se perdió la tabla del relevo del 25/08 (ver §5).

**De dónde salen los datos**: cada análisis se persiste en `analysis_results`
(columna `analysis`, jsonb, con el `FinalAnalysis` entero) y en los logs de
Vercel. La consulta que se ha venido usando:

```sql
select created_at, document_name, contradictions_found, contradictions_confirmed,
       recommendation, analysis
from analysis_results
where org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
order by created_at desc limit 10;
```

---

## 4-bis. La lista de cierre (F-74 P5)

**Antes de dar una conclusión por cerrada, se escriben estas cuatro cosas — aunque
no se midan ese día.** Escribirlas es obligatorio; medirlas, no. El valor está
en que la pregunta quede planteada por escrito, porque una conclusión con su
límite anotado es útil y una conclusión sin él es una trampa para quien la lea
dentro de dos meses.

**1. El caso extremo.** *«¿Qué pasa si en vez de uno hay cuarenta?»*
Toda tasa se mide sobre un tamaño concreto. Decir cuál es, y qué se espera —o
qué se ignora— al multiplicarlo por diez.

**2. El dominio no cubierto.** *«¿Sobre qué NO generaliza esto?»*
Una tasa se mide sobre un corpus concreto. Decir cuál, y qué queda fuera.

**Lo que el harness cubre hoy** (27/08/2026), para poder restarlo: once
documentos —5 `.docx`, 4 `.xlsx`, 1 `.pdf`, 1 `.txt`—, todos en español, el
mayor de 60.000 caracteres, la mayor tabla de 60 filas y una sola hoja por
libro, y **nunca más de cinco documentos en una misma tanda**.

**El ejemplo, y es el que más pesa: el rerank nunca ha tenido que elegir de
verdad.** Con cinco documentos como mucho, y un tope de 6 candidatos en rápido
(`MAX_SELECTED_QUICK`) y 25 en exhaustivo, todo lo recuperado cabe siempre. En
un corpus de cuarenta documentos el rerank pasa a descartar, y **ninguna tasa
de este harness dice qué ocurre entonces**. Un hallazgo que hoy sobrevive puede
no ser seleccionado mañana sin que nada del pipeline haya cambiado.

Detrás de ese, y por el mismo razonamiento: un **PDF escaneado sin capa de
texto** (el único `.pdf` del corpus la tiene, y sin comprimir), un documento en
**otro idioma**, una tabla de **miles de filas** frente a las 60 medidas, un
libro con **varias hojas**, o una contradicción **repartida entre tres
documentos** en vez de dos.

> **ESTE EJEMPLO CADUCA.** El dominio no cubierto se define por resta del
> corpus, así que **cambia cada vez que el harness crece**. Al añadir un caso,
> revisar esta lista: lo que ayer no estaba medido puede estarlo hoy, y una
> plantilla que enseña con un ejemplo falso enseña a equivocarse.
>
> Ya pasó una vez: hasta el 27/08 esta sección decía «todo lo que este harness
> mide hoy es una tabla de Excel», cierto cuando se escribió y falso desde que
> entraron el corpus ampliado y el caso de control. Sobrevivió a la incorporación
> de seis casos nuevos porque nadie la miró al añadirlos.

**POR QUÉ ESTÁ AQUÍ**: en F-73 estos dos huecos existían y **no aparecieron
hasta que el director preguntó**. La conclusión del experimento —que lo que
detecta es el colapso de idénticas— se había dado por cerrada sin anotar que
descansaba en una tabla de 15 filas (caso extremo) ni que, **en aquel momento**,
todo el corpus medido eran hojas de cálculo (dominio). Las dos plantillas los
habrían cazado sin que nadie tuviera que acordarse.

**3. ¿Por dónde sale el dato?** *«¿Hay algún camino por el que no pase?»*
Antes de dar una pieza por probada, seguir su salida hasta donde se consume y
preguntarse por qué caminos puede salir. **Probar el MECANISMO no es probar el
CAMINO.**

*Añadida el 28/08/2026 (F-82). A diferencia de las dos anteriores, ésta no es
sobre el ALCANCE de una medición sino sobre si la medición toca lo que dice
tocar. Sale de dos casos de la misma semana:*

- **Los contadores de pipeline (F-82).** Siete casos sobre `mergeCounters`,
  todos verdes — y las **dos salidas tempranas** de `runCorePipeline` devolvían
  sin contadores. La pieza estaba probada; el camino, no. Se descubrió en la
  primera consulta a producción, con tres análisis seguidos dejando
  `pipeline_counters` en null.
- **El diff de tablas, fase 2.** Catorce casos verdes, y **dos mutaciones
  plausibles sobrevivían**: renderizar los dos lados con las columnas de la
  MISMA tabla (invisible en el corpus, porque las dos tienen diez columnas y el
  recuento no cambia) y contar `igualTrasNormalizar` cuando ALGUNA columna
  coincide en vez de todas. Las cazó preguntar por dónde sale el dato, no un
  test más.

**Y LA FORMA DE RESPONDERLA, que es lo que la hace útil: cuando la respuesta se
pueda dar con el TIPO en vez de con un test, mejor con el tipo.** El arreglo de
F-82 no fue añadir casos: fue que `runCorePipeline` devuelva `CountedAnalysis`,
con los contadores OBLIGATORIOS y un único constructor. Una salida sin
contadores dejó de compilar. Un test avisa a quien lo ejecuta; el tipo **para el
gate** antes de que nadie ejecute nada — y en este repositorio el único gate que
corre en local es `npm run typecheck` (B.108).

**4. ¿El caso colisionaría de verdad si el mecanismo estuviera roto?**
*«No es "¿tengo un test?", es "¿mi test puede fallar?"».*

Antes de dar por probado un mecanismo, comprobar que su caso **discrimina**:
romperlo a propósito y ver el rojo. Un caso que pasa con el mecanismo y también
sin él no prueba nada, y se lee exactamente igual que uno que sí prueba.

*Añadida el 28/08/2026 (F-84 paso 2). Es hermana de la 3 —aquella pregunta por
dónde sale el dato, ésta si el caso que lo vigila puede fallar— y sale de TRES
veces en dos días, todas con el mismo aspecto: el caso parecía discriminar y no
discriminaba.*

- **`soloFormato` / `igualTrasNormalizar` (fase 2 del diff).** Dos mutaciones
  plausibles sobrevivían a catorce casos verdes: renderizar los dos lados con
  las columnas de la misma tabla —invisible porque las dos tienen diez— y contar
  el campo cuando ALGUNA columna coincide en vez de todas, invisible porque las
  filas del corpus discrepan en una sola columna.
- **El medidor de F-84 1a.** Se validó con «DIA-01» contra «dia-01» y dio cero
  frágiles. No era que el medidor fallara: **una diferencia de caja la funde
  también el nivel seguro**, así que esa pareja sobrevive y no es frágil. El
  fixture que discrimina es el que necesita BORRAR PUNTUACIÓN («IMP-01» contra
  «IMP01»), y con él detecta 1 de 3.
- **El separador de la huella (F-84 paso 2).** Sustituir el prefijo de longitud
  por un `|` pasaba los doce casos: la ambigüedad del fixture estaba entre las
  dos claves, que **no son contiguas** en la tupla. El segundo intento tampoco
  discriminaba, porque dejar un componente **vacío** mete un separador de más.

**CÓMO SE RESPONDE, y es barato: MUTAR.** Romper el mecanismo a propósito y
mirar qué se pone rojo. Con dos cautelas que ya han hecho falta las dos:
**comprobar que la mutación se aplicó** antes de leer el resultado —una que no
se aplica es indistinguible de un test que no muerde—, y mirar **qué** casos
mueren, no solo cuántos: si mueren más de los que vigilan ese mecanismo, el
caso está midiendo de más.

---

## 5. Las mediciones

El histórico completo, con sus cifras y sus anomalías, está en
**`claude/Tandas_Harness.md`**, con la más reciente arriba.

**Las líneas de base de los casos 6 a 11 no están aquí ni en
`Tandas_Harness.md`: están en `claude/Casos_Harness.md`**, junto a los casos que
miden, porque cada una se lee con el suyo. La del corpus ampliado es del
**26/08/2026, 21:37–21:48 UTC, sobre `87a76112`**; la del caso de control, del
**27/08 sobre `8cf73e23`**. Las dos, posteriores a la que sigue.

La del corpus piloto: **26/08/2026, sobre `a775a7c7`** — tabla y prosa detectadas en las
dos direcciones, MKT-01 limpio, cero falsos positivos, cero
`columna_indeterminada`, sin fallos de LLM. **Una sola pasada por caso**, así
que confirma que nada se rompió con F-69/F-70 pero **no** afirma que ninguna
tasa se haya movido.

### Mediciones anteriores documentadas fuera de ese fichero

| Fecha | Commit | Dónde está |
|---|---|---|
| 25/08 (antes de la cura) | `6eafdc84` | `Cierre_B81.md` §3 — **es el síntoma**, ver la advertencia |
| 25/08 (después de la cura) | `de158abd` | `Cierre_B81.md` §6 |
| 22/08 | — | `B.89` en `Puntos_Pendientes_Doclity.txt`, con su método escrito. Es el precedente que este fichero imita |

**PERDIDA**: la tabla titulada «LÍNEA DE BASE MEDIDA (harness, 25/08, estado
`e43fbc8c`)` que figuraba en un documento de relevo **no está en el
repositorio** — buscada el 26/08 por su título, por `e43fbc8c` y por
`Belmonte`, sin resultado. Solo existió fuera. Es la razón concreta de que este
fichero exista.
