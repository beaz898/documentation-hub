---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-126
Asunto: el juez no copia, y la regla ya está escrita — LUGAR 1 de 7 tras la
        fase 3.1; la regla de la cita del prompt y la puerta que acepta lo
        que el prompt prohíbe
Fecha de envío: 13/10/2026 · Fecha de respuesta: 13/10/2026
Fuente: los dos textos llegaron en el encargo del arquitecto del 13/10/2026
        (apéndices A y B). Los dos constan íntegros: la consulta en (c) y el
        dictamen en (d).
⚠️ Este texto llegó al repositorio copiado a través de la conversación del
        arquitecto. El original de la consulta está en el proyecto de Claude;
        el original del dictamen, en la conversación del director con Fable.
        Si se detecta una palabra cortada, el original manda.
Estado: ARCHIVADA CON DICTAMEN · DECIDE LA REGLA NUEVA DE LA CITA (commit
        f918f5b5) Y LAS TRES LÍNEAS DE CLAUDE.md (139aa19e). Sin medir.
        Cotejo de integridad, 13/10/2026, con el método de F-121: sha256 del
        texto tal como queda archivado aquí (saltos LF, sin salto final), 16
        primeros hexadecimales; caracteres = puntos de código; palabras = trozos
        separados por espacio en blanco. Ninguno de los dos textos tiene
        espacios que no sean ASCII. Los 60 primeros y últimos van entre comillas
        con escapes JSON: \" es una comilla del texto y \n un salto de línea.
        · DICTAMEN, (d): huella b151efa57df1d2b2 · 7.150 caracteres
          (7.253 bytes UTF-8) · 132 líneas · 92 no vacías ·
          1296 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-126 · EL JUEZ NO COPIA, Y LA REGLA YA"
          60 últimos:  "te; es la condición de que el producto lea su documentación."
        · CONSULTA, (c): huella 2633fefae14ea028 · 14.276 caracteres
          (14.574 bytes UTF-8) · 243 líneas · 182 no vacías ·
          2622 palabras.
          60 primeros: "# CONSULTA F-126 — 13/10/2026 — EL JUEZ NO COPIA, Y LA REGLA"
          60 últimos:  "ra es la 5, porque dice que mis propias guardas no estorban."
Superada por: —
---

# (a) CABECERA

**F-126 · El juez no copia, y la regla ya está escrita.**

- Fecha de envío: 13/10/2026. Fecha de respuesta: 13/10/2026.
- Quién escribe la consulta: el arquitecto (versión 2; la v1 se descartó sin enviar, lo cuenta la
  propia consulta). El director la envía, pega la respuesta y decide.
- Estado: **ARCHIVADA CON DICTAMEN.** F-125 sigue mandando en la puerta; esto decide el prompt.
- **Lo que sale de aquí, fuera de la consulta**: la regla nueva de la cita en el prompt del juez
  (`f918f5b5`), las tres líneas de `CLAUDE.md` (`139aa19e`) y el resultado de la fase 3.1 en
  `claude/Estado_Del_MVP.md` (13/10/2026).

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

- **La medida de la fase 3.1**: siete pasadas de NOR-11 el 13/10, de 11:43 a 11:56 hora de Madrid,
  con la puerta de F-125 desplegada (`0ab6e7d6`). Leídas con `SQL_F125_01`; su salida, resumida por
  el arquitecto con compactación declarada, está en `claude/Predicciones_F125_Seis_Pasadas.md`.
- **La lectura del prompt hecha por Code el 13/10** (`judge.ts:889-895`): la regla de la cita pide
  copia literal en cuatro sitios y prohíbe unir trozos, y el juez la incumple en LUGAR.

---

# (c) ENUNCIADOS DE LAS PREGUNTAS — EL TEXTO ENVIADO, ÍNTEGRO

Texto de la consulta tal como llegó en el apéndice A del encargo. No se ha tocado.

# CONSULTA F-126 — 13/10/2026 — EL JUEZ NO COPIA, Y LA REGLA YA ESTÁ ESCRITA

> Versión 2 (13/10/2026, 12:50). La v1 se descartó sin enviar: el director preguntó si te iba a
> sugestionar y tenía razón. La v1 te daba tres cambios concretos pidiéndote que «los confirmaras»,
> cerraba mi conclusión como hecho consumado, y tenía una sección titulada «lo que ya he decidido y
> sobre lo que NO te pregunto» que te amordazaba justo sobre lo que podía estar mal. Además le
> faltaban cuatro datos, y al reescribirla encontré un agujero en mi propia teoría (sección 4.1).

## 0. Qué te pido, y qué no

Te pido dos decisiones sobre algo medido de punta a punta hoy, con tu dictamen F-125 ya desplegado
y medido en siete pasadas.

Te pido que no abras frentes nuevos: si algo te parece imprescindible, dilo, pero por debajo de lo
que ya está construido. Eso es un cerco de alcance, NO una mordaza: si crees que alguna de las
decisiones de la sección 7 está mal, dilo con todas las letras. Esta consulta no busca que me des
la razón.

Y te aviso antes de nada: tu dictamen F-125 se ejecutó entero y el mecanismo funciona. El problema
no está donde los dos creíamos.

## 1. Lo que se desplegó y lo que se midió

Fase 3.1 completa, catorce commits, desplegada hoy a las 11:37 Madrid: la puerta de citas anclada
por el tramo literal más largo, con (B) sólo en las contradicciones, lo publicado siendo siempre la
frase real y nunca el empalme, los trozos de las dos frases al verificador, y seis contadores.

Siete pasadas de NOR-11 contra el corpus, 11:43 a 11:56, sin cambiar nada entre ellas. Pareja con
CLI-13 en pareja_entera, 14.704/14.704 y 9.817/9.817, modo rápido. Tres contradicciones sembradas y
documentadas en SIEMBRA_caso_control.md: PLAZO (72 h vs 7 días), LUGAR (Chamberí vs Retiro),
NEGACIÓN (amarillo con prohibición expresa del negro vs negro).

| | PLAZO | NEGACIÓN | LUGAR | marcador |
|---|---|---|---|---|
| Pasada 1 | sí | sí | sí | 3/3 |
| Pasadas 2 a 7 | sí | sí | no | 2/3 |

LUGAR 1 de 7. PLAZO y NEGACIÓN 7 de 7. Falsos positivos: 0.

Antes de la fase 1.0 el marcador era 1 de 3; después, 2 de 3; hoy, 3 de 3 en una pasada de siete.

Las dos guardas que añadí para cumplir tu criterio de que un empalme no publique sin verificador
(juez.recompuestas_bloqueadas_al_reclasificar y juez.recompuestas_sin_contexto_del_resto) están a
cero en las siete pasadas. No es la protección la que pierde a LUGAR.

## 2. Lo que dice el registro del tramo

- Pasada 1 · cita del juez de 206 caracteres. Ancla 7.555–7.683 (128 car.), resto 8.277–8.353
  (76 car.), distancia 722, las dos piezas en el trozo 8 → recompuesta. La frase real del ancla es
  la frase sembrada con Chamberí, entera. Se publica, y el verificador ciego la confirma por juicio
  propio.
- Pasadas 2 a 7 · cita del juez de 111 caracteres. Ancla 8.277–8.353 —las mismas posiciones que en
  la pasada 1 eran el resto— y resto de 33 caracteres → resto_insuficiente, por debajo del suelo de
  40 que decidí yo en la fase 3.1.

Mi primera lectura, al ver esto, fue: «el suelo de 40 mata a LUGAR, hay que bajarlo». La desmonta
el propio dato. La frase real que hay en 8.277–8.353 es ésta:

> «Dado que el punto de retirada centralizado concentra el material de las tres clínicas, cada
> centro coordina con antelación la fecha de solicitud de retirada con Dirección de Operaciones,
> evitando que dos clínicas soliciten transporte del material recogido en el mismo día si ello
> satura la capacidad logística del gestor autorizado.»

Habla de coordinar fechas de recogida. No menciona Chamberí. No dice nada del lugar.

En la cita de 111 el ancla es ese trozo, así que la frase real del ancla es ésa. Bajar el suelo a
30 habría hecho «salir» LUGAR seis veces de siete publicando, como afirmación del documento nuevo
sobre la ubicación, una frase sobre coordinar fechas con Dirección de Operaciones.

Mi lectura actual, que te pido que verifiques y no que aceptes: (B) hizo lo correcto las siete
veces. Rescató una, con la frase buena. Se negó seis, y acertó, porque en la cita de 111 no había
nada que rescatar: ninguna frase de NOR-11 dice lo que esa cita afirma. Si ves un fallo en este
razonamiento, dilo: es el que sostiene toda la sección 7.

## 3. La regla ya está escrita, en mayúsculas, y el juez no la cumple

Prompt del juez, bloque «REGLAS DE FORMATO», lib/analysis/judge.ts:889-895, literal:

> - En newDocSays y evidenceInNewDoc: copia LITERALMENTE un fragmento del DOCUMENTO NUEVO.
> - En existingDocSays y evidenceInExistingDoc: copia literalmente un fragmento del DOCUMENTO EXISTENTE.
> - Cada cita es UNA sola frase del documento, copiada ENTERA, de principio a fin de frase. NO
>   copies párrafos enteros. PROHIBIDO cortarla por dentro, resumirla, quitarle palabras del medio
>   o poner puntos suspensivos. PROHIBIDO unir trozos que vengan de sitios distintos del documento.
>   Si el dato que necesitas está en otra frase, usa esa frase aunque no se parezca a la del otro
>   documento: no recortes ni combines frases para que las dos citas se parezcan.
> - Para qué: cada cita se va a buscar LITERALMENTE y se va a mostrar en pantalla. Si no se
>   encuentra tal cual, no sirve, y el hallazgo se pierde.
> - Las citas deben ser TEXTO COPIADO tal cual del documento, sin comentarios, sin explicaciones y
>   sin referirse a los fragmentos por su número.
> - Si no puedes copiar una frase literal que sustente el hallazgo, no emitas ese hallazgo.

Pide la cita literal en cuatro sitios y prohíbe expresamente, en mayúsculas, exactamente lo que el
juez hace en LUGAR: unir trozos de sitios distintos. No hay nada que empuje a resumir y no hay
ningún límite de longitud en todo el prompt.

El fallo no es que falte la instrucción ni que sea ambigua. Está escrita, está en mayúsculas, y el
juez no la cumple en este caso y sólo en este caso.

### 3.1 Los cuatro datos de contexto que la v1 no te daba

1. El prompt mide unas 105 líneas (:810-915) y las reglas de la cita están al final. Una
   instrucción puede ser clarísima y perderse igual en un prompt largo; con siete líneas sueltas no
   podías juzgar eso.
2. Ese prompt creció hace cuatro días, en la fase 1.0 (commit 00ed4235): una instrucción nueva que
   define uniqueToNewDoc más dos ejemplos, y una línea de topes reescrita. Fue lo que subió el
   marcador de 1 a 2 de 3.
3. El juez corre con Claude Haiku 4.5, según el stack documentado del proyecto. Cambia lo que se
   puede esperar de la obediencia a un prompt de 105 líneas.
4. Las seis citas que fallan son idénticas entre sí, y cinco de las seis comparten el mismo hash
   (976f6174; la sexta, d6fb570d). No es ruido: es una lectura estable del prompt.

### 3.2 El patrón, medido sobre los tres casos sembrados

| caso | longitud de la cita que escribe | qué hace | publicada |
|---|---|---|---|
| PLAZO | 154 | copia un tramo contiguo y literal | 7 de 7 |
| NEGACIÓN | 185 | copia un tramo contiguo y literal | 7 de 7 |
| LUGAR | 206 / 111 (la frase real mide 267) | reescribe el arranque y suelda | 1 de 7 |

Y un detalle que importa: las citas de PLAZO y de NEGACIÓN tampoco son «una frase entera de
principio a fin». Empiezan en minúscula: son tramos de mitad de frase. Son contiguas y literales,
así que la puerta las encuentra. O sea que la regla «UNA sola frase copiada ENTERA» la incumple el
juez 7 de 7 también en los casos que funcionan; lo que de verdad cumple es «copiar texto contiguo»,
y deja de cumplirlo cuando la frase es larga.

## 4. Las tres salidas que veo, y el agujero de la que me gustaba

### 4.1 El agujero, antes de las opciones

Mi teoría era «el juez parafrasea lo largo». Tiene un agujero que encontré al reescribir esto.

En la pasada que funcionó, el ancla fue este tramo, contiguo y literal, de 128 caracteres:

> «ubicado en la clínica de Chamberí, desde donde se coordina y documenta el transporte del
> material recogido en Salamanca y Retiro»

O sea que el juez ya tenía delante una opción corta, contigua y obediente, y en vez de quedarse con
ella le pegó delante un arranque inventado («El punto de retirada centralizado concentra el
material de las tres clínicas»). No está acortando por longitud: está fabricando un sujeto para que
la cita se lea como una frase que se sostiene sola, porque el tramo literal empieza en mitad de
frase.

Y si eso es lo que ocurre, la culpable podría ser la propia regla: «de principio a fin de frase» le
exige una frase completa, y cuando no puede copiar una entera, se la inventa. Pero eso no cuadra
con PLAZO y NEGACIÓN, cuyas citas empiezan en minúscula y a las que no fabricó nada.

Conclusión honesta: no sé el mecanismo. Las dos teorías —longitud y
frase-que-se-sostiene-sola— explican una parte y fallan en otra. Si de lo medido sale una tercera
que las explique las dos, prefiero esa.

### 4.2 Opción A — no tocar nada

El marcador queda en 2 de 3 estable más LUGAR 1 de 7. PLAZO y NEGACIÓN siguen a 7 de 7, que es lo
ganado. Se acepta que LUGAR es el caso que este juez no sabe citar.

A favor: cero riesgo de regresión. En contra: la contradicción más clara de las tres —dos clínicas
nombradas, sin matices— se pierde seis veces de siete, y es exactamente el fallo que un cliente
notaría.

### 4.3 Opción B — cambiar la regla de la cita en el prompt

Tres cambios, que propongo como punto de partida para que los corrijas, no para que los confirmes:

1. sustituir «UNA sola frase copiada ENTERA, de principio a fin de frase» por «un tramo de texto
   CONTIGUO del documento, tan largo como haga falta», porque «frase entera» es una regla que el
   juez incumple 7 de 7 incluso cuando acierta, y lo que separa el éxito del fallo es la
   contigüidad;
2. quitar o reescribir «NO copies párrafos enteros», la única presión hacia abajo del prompt, y
   permitir explícitamente las frases largas;
3. cambiar el relleno del molde del JSON (:906-907), que hoy pone como valor de ejemplo
   "cita literal del nuevo", 22 caracteres, y sugiere brevedad.

A favor: barato, reversible, medible, y hay precedente —la fase 1.0 subió el marcador con cuatro
frases de prompt. En contra: el riesgo de la sección 5, y que el agujero de 4.1 significa que
podría estar arreglando la regla equivocada.

### 4.4 Opción C — que el juez SEÑALE en vez de copiar

El director recuerda que en alguna consulta anterior se planteó que el juez no transcriba, sino que
apunte: que devuelva un localizador —número de fragmento, posición, o el identificador del trozo—
y que el sistema extraiga la frase real del documento por su cuenta. No tengo delante el dictamen
donde eso se tratara, así que te lo pregunto en vez de suponerlo: ¿lo dictaminaste —F-119, F-120 u
otra—, sigue en pie, o lo descartaste y por qué?

Lo que sí puedo aportar de la casa, leído:

- el patrón de señalar ya existe aquí para las filas de tabla: hay una función
  despegarPunteroDeFila que separa un puntero de fila de la cita que lo acompaña;
- el camino determinista de tablas, donde la comparación la decide una regla y no un modelo, dio en
  F-123 15 de 15 en las dos pasadas, 30/30 confirmadas, varianza cero. Es el único sitio del
  sistema con varianza cero;
- y el prompt actual prohíbe expresamente señalar en la prosa: «sin referirse a los fragmentos por
  su número» (:894).

A favor: si el modelo apunta y la máquina extrae, la transcripción deja de ser un punto de fallo, y
toda la puerta de citas —incluido (B), el suelo de 40 y las dos guardas— pasa a ser innecesaria
para la prosa. Mueve la prosa hacia el régimen que ya da varianza cero. En contra: es un cambio de
contrato con el juez, no un ajuste; hay que ver si Haiku apunta con fiabilidad a un fragmento
concreto; y deja sin uso trabajo recién hecho, lo cual no es un argumento en contra, sólo una
factura ya pagada que no debe influir en la decisión.

## 5. El riesgo que me frena, y por eso pregunto en vez de hacerlo

PLAZO y NEGACIÓN están en 7 de 7, y NEGACIÓN estaba en 3 de 10 antes de la fase 1.0. Las dos pasan
porque el juez copia tramos contiguos cortos. Cualquier cambio que empuje hacia citas largas, o que
cambie el contrato de la cita, puede romper justo eso, y perderíamos dos casos ganados por intentar
ganar un tercero.

Si apruebas B o C, lo mido con las predicciones escritas antes de medir, como hoy, y el criterio de
abandono queda escrito de antemano: si PLAZO o NEGACIÓN bajan de 7 de 7, se revierte.

## 6. Las dos decisiones que te pido

P-F126-1 · ¿A, B o C, y en qué orden? Si es B, cómo redactas tú la regla. Si es C, si ya lo
dictaminaste y sigue en pie. Y si crees que hace falta medir algo antes de decidir, di qué.

P-F126-2 · ¿Qué se hace con que la puerta acepte lo que el prompt prohíbe? Code lo señaló y tiene
razón: la puerta admite hoy, como salida legítima, la clase exacta de cita que la línea 892 prohíbe
en mayúsculas. Mi postura es que no son incompatibles —el prompt dice qué debe escribir el juez, la
puerta decide qué hace el sistema con lo que llega, y tolerar un incumplimiento no es autorizarlo—
pero que hay que escribirlo en CLAUDE.md, o el próximo que lea las dos cosas las reconciliará en la
dirección equivocada: relajando el prompt o quitando (B). ¿Lo ves igual, o la existencia de (B) es
razón para quitar la prohibición del prompt?

## 7. Lo que he decidido, y que puedes discutir

No te pido que construyas nada sobre esto, pero si alguna te parece un error, dilo:

- el suelo de 40 caracteres del resto se queda: la medida de hoy demuestra que me protegió de
  publicar una frase equivocada seis veces de siete;
- (B) se queda como está: hizo lo correcto las siete veces;
- las dos guardas de D4 se quedan: están a cero y son la contrapartida de haber abierto la puerta;
- el caso de empalme falso sembrado sigue pendiente y la fase 3.1 queda cerrada a falta de él. Se
  siembra cuando no haya medición en curso, nunca en medio de una.

## 8. Las predicciones de hoy, para que juzgues el método y no sólo el resultado

Escritas a las 11:42, antes de la primera pasada, archivadas en
claude/Predicciones_F125_Seis_Pasadas.md y no tocadas después. Fallan la 1, la 4 y la 7, las tres
por la misma causa; aciertan la 2, la 3, la 5 y la 6.

La que más me importa que fallara es la 1: su fallo es lo que destapó la sección 3. Y la que más me
importa que acertara es la 5, porque dice que mis propias guardas no estorban.

---

# (d) RESPUESTA RECIBIDA — F-126 · 13/10/2026 · DICTAMEN, ÍNTEGRO

Texto del dictamen tal como llegó en el apéndice B del encargo. No se ha tocado.

RESPUESTA DE FABLE — F-126 · EL JUEZ NO COPIA, Y LA REGLA YA ESTÁ ESCRITA
13/10/2026. Dos decisiones.

Frentes decididos y sin commit desde hace más de 7 días: F-119 fase 2, 13 días. No es de esta
consulta; lo nombro porque la regla lo exige, y porque tres consultas seguidas sobre la puerta es
exactamente el patrón de octubre.

Antes de decidir: lo que la medida de hoy confirma

(B) funcionó como se diseñó, incluidas las seis negativas. El suelo de 40 y "lo publicado es la
frase real" eran los controles de F-125 P2 contra el falso por empalme. Hoy evitaron publicar seis
veces una frase sobre fechas de recogida como si hablara del lugar. Ese es el arreglo de clase
haciendo su trabajo en un caso que nadie sembró. Se archiva así.

El juicio del arquitecto de F-121 queda confirmado con mecanismo: la copia falla en la frase larga
con subordinadas y tres topónimos. La frase real de LUGAR mide 267 caracteres y el dato, "ubicado
en la clínica de Chamberí", vive en una subordinada a mitad de frase. El juez no se niega a
copiarla: intenta fabricar una frase con sujeto y dato, "el punto de retirada centralizado…
ubicado en Chamberí", y para eso suelda. El resto de 33 caracteres de las pasadas 2 a 7 es, casi
seguro, el dato mismo. Encargo para Code: confirmar qué texto hay en esos 33.

Esto también confirma F-125: (B) cubre empalmes de dos tramos verdaderos; no cubre, ni debe, una
frase fabricada. Lo que queda es la clase que solo quitan los punteros.

Veredicto

P-F126-1: sí se cambia la regla, pero en la dirección contraria a "tan largo como haga falta". La
regla debe describir lo que el juez hace bien, que es copiar tramos contiguos cortos, y pedirle lo
mínimo: el tramo contiguo más corto que contenga el dato en conflicto, aunque empiece y acabe a
mitad de frase. Pedir frases largas enteras es pedir justo lo que no sabe hacer.

P-F126-2: lo veo igual. Prompt estricto, puerta tolerante, y la tolerancia con contador. Se escribe
en CLAUDE.md con tres líneas, abajo. La existencia de (B) no es razón para quitar la prohibición;
es razón para medir cuántas veces se incumple.

Y una regla de decisión que cierra el frente: este cambio de prompt es el último intento barato. Si
LUGAR no llega a 5 de 7 con él, se cumple el disparador de la vía 2 escrito en F-125 y empieza 3.4,
con el módulo que ya está construido. No se abre una cuarta consulta sobre la puerta.

P-F126-1 · La regla de la cita

Confirmo el diagnóstico y corrijo la dirección.

El diagnóstico es exacto: "una frase entera de principio a fin" la incumple el juez 7 de 7 también
cuando acierta, así que no es la regla que hace el trabajo. Lo que hace el trabajo es la
contigüidad. Hasta ahí, de acuerdo.

La dirección "tan largo como haga falta" es la equivocada, por tres razones:

El juez copia bien 154 y 185 caracteres contiguos y falla en 267. Pedirle que copie "lo que haga
falta" de una frase de 267 es pedirle el caso que falla.

La presión que produce el empalme no es "no copies párrafos", es la forma de la tarea: el juez
quiere una cita que se entienda sola, con sujeto, y en LUGAR el sujeto está lejos del dato. Si se
le permite un tramo sin sujeto, no necesita soldar.

Y el riesgo de la sección 5 es real: empujar hacia citas largas puede romper PLAZO y NEGACIÓN, que
pasan porque son cortas.

La regla que propongo, en el lugar de la actual:

Cada cita es un tramo de texto CONTIGUO del documento, copiado tal cual. Elige el tramo más CORTO
que contenga el dato en conflicto. Puede empezar y acabar a mitad de frase: no hace falta que tenga
sujeto ni que se entienda sola. Normalmente entre 40 y 200 caracteres. PROHIBIDO unir trozos de
sitios distintos, resumir, quitar palabras del medio o poner puntos suspensivos. Si el dato está en
una subordinada, copia la subordinada y lo justo que la rodea.

Y un ejemplo en el propio prompt, porque los modelos siguen el ejemplo antes que la regla: una cita
correcta de mitad de frase, de unos 80 caracteres, que empiece en minúscula.

Sobre los tres puntos del arquitecto:

"Tramo contiguo" sí; "tan largo como haga falta" no. "Lo más corto que contenga el dato".

"NO copies párrafos enteros" se sustituye por los números: 40 a 200. Una prohibición vaga empuja
hacia abajo sin decir cuánto; un rango dice cuánto.

El relleno del molde, sí: de 22 caracteres a un ejemplo realista de unos 100. De entrenamiento: los
valores de ejemplo en una plantilla JSON actúan como ancla de longitud; es un efecto conocido en
salidas estructuradas.

Lo que no se toca ahora: "si no puedes copiar una frase literal, no emitas". F-121 P7 la señaló
como acoplamiento entre emisión y copia, y sigo pensándolo, pero quitarla hoy mezclaría dos cambios
en una medición. Se mide después, sola.

Predicciones, escritas antes:

Con la regla "más corto que contenga el dato": LUGAR publicada en 5 de 7 o más, por cita literal
contigua sin recomposición. PLAZO y NEGACIÓN se mantienen en 7 de 7. Longitud mediana de las citas
publicadas baja por debajo de 150.

Si en vez de eso se aplicara "tan largo como haga falta": LUGAR 3 de 7 o menos, y riesgo real en
PLAZO o NEGACIÓN.

Contador recompuesta: baja de 1 de 7 a 0 de 7, porque el juez ya no necesita soldar.

Criterio de abandono: el del arquitecto, PLAZO o NEGACIÓN por debajo de 7 de 7. Y añado el de
cierre: si LUGAR queda por debajo de 5 de 7, no se hace un tercer ajuste de prompt; se activa 3.4.

P-F126-2 · Prompt y puerta

Lo veo igual, y tiene nombre. Especificación estricta en lo que se pide, tolerancia en lo que se
acepta, es el principio de robustez de Postel, buscable como "Postel's law". Su crítica conocida es
también buscable: la tolerancia esconde incumplimientos de la especificación hasta que se acumulan.
Por eso la tolerancia solo es legítima con contador, y vosotros lo tenéis: recompuesta.

No se quita la prohibición. Dos razones:

No sabemos cuántos empalmes evita en los casos que no vemos. Quitarla para "coherencia" sería un
juicio de inocuidad sin censo.

Y la medida de hoy dice que el juez la incumple en un caso concreto por una razón concreta, la
frase larga, que se ataca con la regla de P-F126-1, no relajando la prohibición.

Lo que va a CLAUDE.md, en tres líneas:

El prompt del juez exige citas contiguas y prohíbe empalmar. La puerta tolera un empalme de dos
tramos literales porque lo que se publica es siempre la frase real y el verificador la juzga.
Tolerar no es autorizar: si juez.recompuestas crece, el fallo está en el prompt y se corrige ahí;
la puerta no se relaja y (B) no se quita.

Con eso, el próximo que lea las dos cosas sabe en qué dirección reconciliar, y el contador le dice
cuándo.

Lo que no se pregunta y declaro, por debajo

El caso de empalme falso sembrado sigue siendo el control positivo de (B). Sin él, el cero de hoy
en las dos guardas es un cero de población. Conforme con sembrarlo fuera de una medición en curso.

El fallo de F-121 que hoy se confirma, frases largas con subordinadas, es la especie que un cliente
real tendrá a montones: normativa, contratos, protocolos. Si la regla de P-F126-1 no basta, la vía
2 no es un lujo para ese cliente; es la condición de que el producto lea su documentación.

---

# (e) PREDICCIONES REGISTRADAS, PENDIENTES DE MEDICIÓN

Con la cifra exacta. Sin veredicto.

| N.º | De quién | Predicción | Cifra exacta | Estado |
|---|---|---|---|---|
| P-F126-1 | Fable | Con la regla «el tramo más corto que contenga el dato», LUGAR se publica por cita literal contigua, SIN recomposición | **5 de 7 o más** | sin medir |
| P-F126-2 | Fable | PLAZO y NEGACIÓN se mantienen | **7 de 7** las dos | sin medir |
| P-F126-3 | Fable | La longitud MEDIANA de las citas publicadas baja | **por debajo de 150** caracteres | sin medir |
| P-F126-4 | Fable | El contador de recompuestas baja, porque el juez ya no necesita soldar | **de 1 de 7 a 0 de 7** | sin medir |
| (contrafáctica) | Fable | Con «tan largo como haga falta», LUGAR quedaría bajo y habría riesgo en PLAZO o NEGACIÓN | LUGAR **3 de 7 o menos** | no medible: esa regla no se despliega |

**Criterio de abandono** (arquitecto): si PLAZO o NEGACIÓN bajan de 7 de 7, se revierte. **Criterio
de cierre** (Fable): si LUGAR queda por debajo de 5 de 7, no hay tercer ajuste de prompt; se activa
la fase 3.4 (la vía 2, con `unidades-de-cita.ts`).

---

# (f) PRECISIONES SOBRE LA CONSULTA Y EL DICTAMEN

Comprobadas por Code el 13/10/2026. El texto de (c) y (d) no se toca.

1. **Archivada en UN fichero, no en dos.** El encargo pedía dos ficheros «con el patrón de nombre que
   ya usen F-124 y F-125»; ese patrón es un solo fichero por consulta, con la consulta en (c) y el
   dictamen en (d), y la fila del índice apunta a uno. Se siguió el patrón del repositorio.
2. **El resto de 33 caracteres es el dato, confirmado** (el encargo a Code del dictamen): con
   `tramo-de-cita.ts` sobre el texto de NOR-11 tal como se entrega al juez, la cita de 111 de hash
   `976f6174` da ancla 8.277-8.353 y resto **«ubicado en la clínica de Chamberí»**, 33 caracteres
   exactos, tanto normalizado como en el original de la cita. La cita de hash `d6fb570d` (pasada 4)
   no se comprobó: su lado nuevo se supone el mismo porque mide 111 y da las mismas posiciones.
3. **La cita del prompt que hace la consulta en su sección 3 no es literal del todo**, aunque se
   presenta así: dice «o poner puntos suspensivos» donde el prompt decía «o usar puntos
   suspensivos»; en la línea «Para qué» omite «en el documento del cliente»; y en la de «TEXTO
   COPIADO» omite la frase de ejemplos prohibidos. Ninguna de las tres cambia el argumento.
4. **«El verificador ciego la confirma»** (consulta, sección 2): el verificador que confirmó LUGAR en
   la pasada 1 es el de siempre (`verifyFindings`, Haiku), que NO es ciego: el verificador ciego es
   la fase 3.2 y no está construido.
5. **«NEGACIÓN estaba en 3 de 10 antes de la fase 1.0»** (consulta, sección 5): Code no ha
   localizado esa cifra en el registro. La que consta es **0 de 5** el 11/10 (`Estado_Del_MVP.md`,
   12/10/2026, y la consulta F-125).
6. **El contador se llama `juez.citas_recompuestas`**, no «juez.recompuestas» como dice el dictamen
   en las tres líneas para `CLAUDE.md`; se escribió con el nombre real, como pidió el arquitecto.
7. **Lo que se pierde con la regla nueva, y conviene que conste**: la línea 892 entera se sustituyó,
   y con ella desaparece también «Si el dato que necesitas está en otra frase, usa esa frase aunque
   no se parezca a la del otro documento: no recortes ni combines frases para que las dos citas se
   parezcan», la cláusula de B.313 contra el juez que «esculpe» la cita para que rime con la del otro
   lado. La regla nueva conserva la prohibición de unir trozos, pero ya no la de recortar para que
   las dos citas se parezcan.
