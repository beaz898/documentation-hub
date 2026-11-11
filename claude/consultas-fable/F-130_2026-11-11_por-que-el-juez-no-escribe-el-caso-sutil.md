---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-130 (segunda consulta del número)
Asunto: por qué el juez no escribe el caso sutil (D), y cómo lo resuelve el estado del arte
Fecha de envío: 11/11/2026 · Fecha de respuesta: 11/11/2026, con dos añadidos (13:40 y 15:40)
Fuente: texto pegado por el director en el encargo del 11/11/2026. Los cuatro textos se archivan LITERALES, sacados por script del
        registro de la conversación, sin resumir y sin corregir nada (tampoco las erratas).
Huellas (sha256, 16): a 46efd5903d0b56cc · b 921d22921bacb5f1 · c e2a84134c1b7bdac · d 56c5e026e291ccb6
⚠️ LO QUE SE LE DEVUELVE (Predicciones_34_Conflicto_Normativo.md, «LA RESPUESTA DE FABLE DEL 11/11»): el agujero del «17 de 18» son
        DOS listas y no tres (minor_inconsistency ya estaba mirada); la mitad de su predicción sobre las 3 D publicadas ya estaba
        archivada desde el 31/10; su diseño «en el producto entero» no se puede ejecutar; y el corte de 24 de X está SUSPENDIDO.
⚠️ La consulta (a) da el «17 de 18» como establecido; el 11/11 se marcó como INFERENCIA hasta que SQL_34_13 lo confirme o lo tumbe.
---
## (a) LA CONSULTA, tal como se envió a Fable

CONSULTA F-130 · POR QUÉ EL JUEZ NO ESCRIBE EL CASO SUTIL · 11/11/2026

Esta consulta sustituye a la adenda que te iba a llegar esta mañana. Aquella
estaba construida sobre una medición de nuestro propio instrumento y la hemos
retirado entera. Aquí va sólo lo que es del producto.

EL MONTAJE
Dos documentos corporativos reales, de 66.801 y 55.135 caracteres, que el juez
recibe ENTEROS (ventana de 150.000). Llevan sembrados cuatro desacuerdos:
- A, B y C son contradicciones PLANAS de dato: quién es el responsable último,
  semanal contra mensual, 6 meses contra 12.
- D es SUTIL y es el que el producto tiene que aportar: un documento PERMITE que
  una misma persona ocupe dos cargos, y el otro enuncia, como razón de otra
  regla, el principio de que esos dos cargos deben estar separados. Nadie
  prohíbe al otro con esas palabras.

LO MEDIDO EN EL PRODUCTO (21 análisis reales, 30-31/10/2026)
- A, B y C: publicadas 21 de 21.
- D: publicada 3 de 21.
- Y lo que acabamos de establecer, que es el dato nuevo: **en 17 de las 18
  pasadas sin D, el juez NUNCA LA ESCRIBIÓ.** No la descartó la puerta de citas
  ni el verificador. Lo sabemos por eliminación: todo lo que el juez emite deja
  rastro en uno de tres sitios (publicado, descartado por cita con su texto, o
  descartado por el verificador con su motivo), y D no aparece en ninguno.
- **Así que el fallo está en la GENERACIÓN, no en el filtrado.** Por qué no la
  escribe, no está medido.

LA FORMA DE LA SALIDA, QUE ES NUESTRA PRINCIPAL SOSPECHA
El prompt del juez pide un JSON con esta forma:

  "contradictions": [ { "topic", "newDocSays", "existingDocSays", "severity",
                        "conflictoNormativo" }, … ]

O sea: para que D salga, el juez tiene que meterla en una casilla de
CONTRADICCIÓN y marcarla con un campo. **Y D no tiene esa forma.** «Qué dice el
nuevo / qué dice el existente sobre un tema» no describe un permiso contra un
principio. El prompt incluye un bloque que explica expresamente el caso del
principio, y no basta.

Hipótesis nuestra, sin medir: **D no se escribe porque la salida no tiene un
sitio donde quepa.**

LO QUE NO TE PEDIMOS QUE CREAS
- La hipótesis de arriba es nuestra y no está medida.
- Hemos medido lo mismo con un instrumento propio que hace al juez una pregunta
  distinta, y hemos retirado esos resultados: su forma obligaba a elegir entre
  un hallazgo y otro, y el producto no obliga. No construyas nada sobre ellos.
- La variación entre días de este juez sobre esta pareja es de unos 15 puntos.

LAS PREGUNTAS
1. ¿Es un problema conocido que un hallazgo cuya FORMA no encaja en el esquema
   de salida simplemente no se emita, aunque el prompt lo describa? Si tiene
   nombre, dinos el nombre.
2. **¿Cómo lo resuelven los sistemas que lo tienen resuelto?** Nos interesa el
   estado del arte antes que una idea nueva: técnica, por qué funciona, coste.
   En particular: ¿se resuelve dando al hallazgo su propia casilla en el
   esquema, con sus propios campos, o eso trae otros problemas?
3. Un juez que ya ha encontrado tres cosas evidentes, ¿sigue buscando lo sutil,
   o hay un efecto conocido de saciedad? Si lo hay, cómo se contrarresta.
4. Si la respuesta es «con un modelo de este tamaño no se resuelve de forma
   fiable; lo honesto es encontrar tres de cuatro y decírselo al cliente»,
   dilo. Nos vale y nos ahorra meses.

LO QUE NECESITAMOS DE VUELTA
1. La respuesta a las cuatro, en ese orden.
2. Si propones una técnica: qué mediríamos, con el criterio escrito ANTES de
   medir y qué resultado la refutaría. Con ±15 puntos entre días, una tanda de
   un día no distingue diferencias menores de 30.
3. Si crees que algo de lo que damos por establecido no se sostiene —en
   particular el «17 de 18»—, dilo antes que nada.

Necesitamos que arrojes algo de luz sobre este teema porque empieza a preocuparme que no encontremos solución y que sea muy ad hoc, si es que realmente esto tiene sentido que lo detecte el producto y no es algo idilico

## (b) LA RESPUESTA DE FABLE

RESPUESTA DE FABLE — F-130 · POR QUÉ EL JUEZ NO ESCRIBE EL CASO SUTIL
11/11/2026.

Antes que nada, lo que no se sostiene o necesita una comprobación (punto 3 de lo que pedís)

El “17 de 18” se sostiene como eliminación con dos condiciones que debéis confirmar, porque si fallan deja de ser 17 de 18:

Que “ninguno de los tres sitios” incluya las otras cajas. En F-124, LUGAR no estaba en contradicciones ni en descartes: estaba en uniqueToNewDoc. Si D hubiera ido a uniqueToNewDoc, a overlappingContent o a minor_inconsistency, el juez sí la habría escrito y la eliminación lo contaría como “no escrita”. Encargo: buscar “Chamberí”-equivalentes de D, “separación”, “misma persona”, “puede recaer”, en las cuatro listas de las 18 respuestas, no solo en contradicciones.
Que existan las respuestas crudas. Si se guardan, como pedí en F-122, la eliminación sobra: se busca el texto de D en los 18 JSON crudos y se pasa de “no deja rastro” a “no está”. Si no se guardan, el 17 de 18 es inferencia y hay que empezar a guardarlas hoy.

Con esas dos comprobaciones, el dato nuevo es sólido y cambia el foco: el fallo está en la generación. Y eso es coherente con todo lo medido desde F-130.

1 · ¿Es un problema conocido que lo que no encaja en el esquema no se emita?

Sí, y tiene nombre en dos literaturas.

En extracción de información: se llama extracción de esquema cerrado. Un extractor con esquema fijo solo devuelve lo que el esquema nombra; lo que no tiene casilla no existe para él. Es el motivo por el que existe la “extracción abierta”, que primero recoge lo que hay y después lo clasifica. Buscables: “closed-schema information extraction”, “open information extraction”, “schema-guided extraction”.
En modelos de lenguaje: hay resultados que miden que obligar a un formato estructurado degrada el razonamiento respecto a dejar escribir en prosa, y que los nombres de los campos del esquema actúan como plantilla: el modelo llena lo que el esquema sugiere. Buscable: “Let Me Speak Freely? A Study on the Impact of Format Restrictions on Performance of LLMs” (Tam et al., 2024). El efecto de los nombres de campo se llama a veces “schema anchoring” o “template priming”.

Y vuestro esquema tiene el caso agudo: la única casilla donde D puede ir es contradictions, cuyos campos se llaman newDocSays y existingDocSays, forma “X dice, Y dice” sobre un tema. Un permiso contra un principio no se describe así. Y encima el prompt abre con “REGLA PRINCIPAL, POR ENCIMA DE TODAS: si hablan de datos distintos, no emites hallazgo”, y el bloque del principio es una excepción puesta debajo. Lo señalé el 29/10: el modelo tiene que desobedecer la regla principal para usar la excepción, y meter el resultado en una casilla cuya forma no le corresponde. Que lo haga 3 de 21 es más de lo que yo esperaría.

Así que vuestra hipótesis es la correcta, y es más fuerte de lo que la planteáis: no es solo que no haya casilla; es que la casilla que hay está defendida por una regla que D no cumple.

2 · Cómo lo resuelven los sistemas que lo tienen resuelto

El estado del arte es uno, con dos variantes, y ninguna es “una casilla por clase”.

La técnica: separar encontrar de clasificar. Primero se pide al modelo que escriba, en prosa y sin esquema, todos los puntos donde los dos documentos están en tensión, con sus dos frases; después, en un paso aparte, cada punto se clasifica en el esquema. Por qué funciona: en prosa el modelo no tiene que decidir la forma antes de ver el contenido, y la clasificación se hace sobre algo que ya existe en vez de ser la condición para que exista. Buscables: “generate-then-classify”, “extract-then-structure”, y en la literatura de formato, “reason first, then format”. Coste: una llamada más por pareja si la clasificación la hace el modelo; cero si la hace código sobre un esquema sencillo de prosa.

Variante 1, la barata: las dos fases en la misma llamada. El juez escribe primero una sección “BORRADOR” en prosa, con cada tensión en dos o tres frases y las dos citas, sin etiquetas; después, el JSON, construido a partir de su propio borrador. El modelo ya tiene razonamiento previo con esfuerzo medio; esto es hacer ese razonamiento visible y anclado a citas. Riesgo: salida más larga; tenéis techo de 16.000 y usáis la mitad.

Variante 2, la limpia: dos llamadas. Prosa en una; clasificación en otra con el esquema. Lo que encontró la primera no se pierde en la segunda porque la segunda recibe los puntos numerados y debe devolver los mismos números. Coste: una llamada corta más.

Sobre “darle su propia casilla”: sirve, pero no como ocurrencia por clase. Lo que funciona es que la casilla describa la forma del hallazgo, no la clase: campos como permiso: {documento, cita} y principio: {documento, cita} priman al modelo hacia esa forma igual que newDocSays lo prima hacia “X dice”. Pero cada casilla nueva trae dos problemas conocidos: el modelo tiende a llenar las casillas que ve, aunque no haya nada, “presión de relleno”, y el esquema crece con cada clase que se descubra, que es el catálogo de parches que no queréis. Por eso la casilla por forma es un complemento de la separación encontrar-clasificar, no un sustituto. Si se hace, con “puede estar vacía” y con un ejemplo de lista vacía.

Lo que ya está escrito y cae aquí: la pasada 2 por parejas es la versión extrema de “la pregunta lleva la forma”: una pregunta cerrada sobre dos trozos no tiene esquema que rellenar, solo sí o no y dos citas. Es coherente con esto, y la tanda X sigue siendo la que dice si vale.

3 · ¿El juez que ya encontró tres cosas sigue buscando lo sutil?

No con la misma fuerza, y el efecto es conocido. Lo describí en F-130 como cierre de lista: con cada elemento escrito sube la probabilidad de pasar a la siguiente sección, y el prior del modelo sobre “cuántos elementos tiene una lista así” manda más que el tope del prompt. En la literatura aparece como efecto de posición y como subestimación de la longitud en enumeraciones. Buscables: “serial position effect in LLMs”, “enumeration length bias”. Lo sutil, que ya parte con menos probabilidad, es lo primero que se queda fuera cuando la lista se cierra.

Cómo se contrarresta, de más barato a más caro:

Pedir la cuenta antes que la lista: “primero di cuántas tensiones ves, después escríbelas”. Compromete al modelo con un número antes de que el cierre actúe. Buscable: “plan-then-generate”.
Preguntar “¿qué más?” con lo encontrado excluido: una segunda llamada que recibe A, B y C y pide lo que no esté ahí. Es la idea del director de E7 y es la técnica de “chain of verification”. Riesgo: inventar para cumplir; lo contiene el verificador.
Barrer por secciones: cada sección del nuevo contra el candidato entero, con “ninguna” permitido. Elimina el cierre global.
Preguntas cerradas por parejas: la pasada 2. Elimina el cierre del todo, porque no hay lista.

Y el borrador en prosa de la pregunta 2 ayuda también aquí: una lista en prosa se cierra más tarde que un JSON, porque el modelo no está contando objetos.

4 · ¿Es un límite del tamaño del modelo?

No está demostrado, y hay una razón para pensar que no. El mismo modelo, preguntado en cerrado sobre la pareja, decía “sí” la mayoría de las veces en las tandas que habéis retirado. Las retiráis con razón, porque la forma de aquella pregunta no era la del producto; pero lo que muestran, aunque no sirvan como cifra, es que el modelo ve D cuando la pregunta tiene la forma de D. Un límite de capacidad daría cero también en cerrado. Lo que tenéis es un límite de forma de la salida y de cierre de lista, y eso se arregla con las técnicas de la 2 y la 3.

Lo honesto hoy, con un cliente delante: “encontramos tres de cuatro; la cuarta, un permiso contra un principio, la encontramos a veces y estamos midiendo cómo encontrarla siempre”. Eso se puede decir ya. Lo que no diría es que es el techo del modelo, porque no está medido, y la medición que lo decide cuesta media hora.

Sobre si es idílico: no. Un permiso en un manual que vacía un principio de otro es la contradicción corporativa típica, mucho más que “6 meses contra 12”. Un auditor humano lo encuentra. Un producto que no lo encuentre es un producto que encuentra lo que un buscador encontraría. Lo que no es realista es prometer cadenas largas; D es un salto, y un salto está al alcance.

Qué mediría, con criterio escrito antes y qué lo refuta

Con ±15 puntos entre días, cada condición en dos días, 21 pasadas por día, 42 en total, en el producto entero, contadas como publicadas. Base: D 3 de 21.

M1 · La regla principal reconciliada. Cambiar la primera frase para que la excepción normativa esté dentro de la regla, no debajo: “si hablan de datos distintos no hay hallazgo, salvo que sean dos reglas que no se puedan cumplir a la vez”. Solo texto. Predicción: D sube poco, entre 5 y 9 de 42. Adoptar si ≥ 10 de 42; no refuta nada si no sube, porque es higiene.

M2 · Borrador en prosa antes del JSON, en la misma llamada. Predicción: D entre 18 y 26 de 42. Adoptar si ≥ 18 de 42 (bajo la base de 14 %, probabilidad por azar inferior al 0,1 %; si la tasa real fuera 50 %, potencia del 86 %). Refutada si ≤ 9 de 42. Entre 10 y 17, otra tanda. A, B y C deben seguir en 42 de 42 y los falsos en cero; si no, se revierte.

M3 · Casilla por forma, tensiones_normativas con permiso y principio, lista vacía permitida. Solo si M2 no llega. Mismas cotas. Refutada además si aparece un solo falso en esa casilla en el caso de control.

X · La tanda de D para la pasada 2, como quedó prerregistrada el 06/11: 42 tiradas, regla estricta, construir con ≥ 24, enterrar con ≤ 17. Independiente de M1 a M3: mide otra cosa, si la pregunta cerrada vale, y decide el paso 4.

Orden: M1 hoy, porque es gratis. M2 esta semana. X cuando el instrumento cuente con la regla estricta. M3 solo si M2 falla.

Lo que refutaría mi lectura entera: que M2 y X queden las dos por debajo de sus cotas bajas. Entonces el modelo no ve D de forma fiable con ninguna forma de pregunta, y la respuesta a la 4 pasa a ser sí: tres de cuatro, decirlo, y seguir.

## (c) EL AÑADIDO DE FABLE TRAS LA CONVERSACIÓN CON EL DIRECTOR (11/11, 13:40)

AÑADIDO TRAS CONVERSACIÓN CON EL DIRECTOR (11/11, 13:40)

Pregunta del director: si la causa fuera que D no encaja en la forma “X dice, Y dice”, ¿no saldría 0 de 21 en vez de 3 de 21?

Respuesta: el esquema no es un muro, es una pendiente. D sale esas veces porque el juez la fuerza a la forma que tiene: convierte el permiso y el principio en dos respuestas a una misma pregunta de sí o no, “¿puede el Director Clínico ser el Coordinador de Calidad?”, y entonces NOR-10 “dice” que sí y CLI-12 “dice” que no. Eso ya cabe en newDocSays / existingDocSays. Es una reinterpretación legítima que exige un paso fuera del texto y que choca con la regla principal del prompt, y por eso solo ocurre en algunas tiradas. Un muro daría 0; una pendiente da 3 de 21 con 15 puntos de variación.

Señal que ya tenéis: en F-130, de las veces que D salió, la mayoría salieron sin la etiqueta conflictoNormativo. Cuando sale, sale disfrazada de contradicción plana, no como lo que es. Es lo que se espera si el esquema no cierra la puerta pero obliga a entrar con otra ropa.

Comprobación gratis, antes de M1 a M3: leer las 3 respuestas en que D se publicó y mirar topic y la redacción de las dos citas. Predicción: en las 3 el tema está formulado como dato con dos valores, “quién puede ocupar el cargo” o equivalente, y al menos 2 de las 3 van sin la etiqueta normativa. Si es así, la hipótesis de la forma queda apoyada por cómo sale D, no solo por las veces que no sale. Si las 3 salen con etiqueta y tema normativo, la hipótesis de la forma pierde fuerza y el peso pasa al cierre de lista de la pregunta 3.

## (d) EL AÑADIDO DE FABLE PARA EL ARQUITECTO (11/11, 15:40)

AÑADIDO DE FABLE PARA EL ARQUITECTO (11/11, 15:40) · tres cosas que considero previas a M1–M3, para que decidas si bajan a Code

El “17 de 18” necesita dos comprobaciones antes de darse por establecido. La eliminación vale si “ninguno de los tres sitios” incluye también las otras cajas del esquema: en F-124, LUGAR no estaba en contradicciones ni en descartes, estaba en uniqueToNewDoc. Propongo buscar D en uniqueToNewDoc, overlappingContent y minor_inconsistency de las 18 respuestas. Y si las respuestas crudas del juez se guardan, buscar en los 18 JSON crudos convierte la eliminación en observación; si no se guardan, es el momento de empezar.
Cómo sale D las 3 veces que sale es un dato que apoya o tumba la hipótesis de la forma, y es gratis. Leer topic y las dos citas de esas 3 respuestas. Mi predicción: en las 3 el tema está formulado como dato con dos valores, “quién puede ocupar el cargo” o equivalente, y al menos 2 de 3 van sin conflictoNormativo. Si es así, D sale disfrazada de contradicción plana, que es lo que la hipótesis de la forma predice. Si las 3 salen con etiqueta y tema normativo, la hipótesis pierde fuerza y el peso pasa al cierre de lista.
Guarda de M1, por una preocupación del director que comparto: M1 no retira la regla principal “si hablan de datos distintos no hay hallazgo”. La reescribe con la excepción dentro y acotada: “salvo que los dos textos sean reglas que no se puedan cumplir a la vez; entonces es conflicto normativo, no contradicción”. El bloque de tablas no se toca. Propongo como criterios de reversión de M1: el caso P3 de Excel sin ninguna fila nueva como hallazgo, y cero falsos nuevos en NOR-11 ↔ CLI-13. Si aparece uno, se revierte el mismo día.
