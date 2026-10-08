---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-122
Asunto: la función de citas funciona pero nuestro contrato la apaga — ¿cambiar
        el contrato del juez o construir el segmentador propio?
Fecha de envío: 09/10/2026 · Fecha de respuesta: 09/10/2026
Fuente: los dos textos los pega el director en el encargo del 09/10/2026. Los
        dos constan íntegros: la consulta en (c) y el dictamen en (d).
Estado: ARCHIVADA CON DECISIÓN DEL DIRECTOR Y EJECUCIÓN EN MARCHA — VÍA 2.
        Cotejo de integridad, 09/10/2026, con el método de F-121: sha256 del
        texto tal como queda archivado aquí (saltos LF, sin salto final), 16
        primeros hexadecimales; caracteres = puntos de código; palabras = trozos
        separados por espacio en blanco. Ninguno de los dos textos tiene
        espacios que no sean ASCII. Los 60 primeros y últimos van entre comillas
        con escapes JSON: \" es una comilla del texto y \n un salto de línea.
        · DICTAMEN, (d): huella caf53c28d4cbaa94 · 17.326 caracteres
          (17.740 bytes UTF-8) · 170 líneas · 113 no vacías ·
          3079 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-122 · LA FUNCIÓN DE CITAS FUNCIONA, P"
          60 últimos:  "lista antes de que el arnés esté verde, el director lo para."
        · CONSULTA, (c): huella 09758bcbab47c056 · 13.264 caracteres
          (13.592 bytes UTF-8) · 228 líneas · 199 no vacías ·
          2303 palabras.
          60 primeros: "CONSULTA F-122 · LA FUNCIÓN DE CITAS FUNCIONA, PERO NUESTRO "
          60 últimos:  "os de 5 a 10 la bajó a la mitad y eso ya está en producción."
Superada por: —
---

# (a) CABECERA

**F-122 · La función de citas funciona, pero nuestro contrato la apaga. ¿Cambiar el contrato
del juez, o construir el segmentador propio?**

- Fecha de envío: 09/10/2026. Fecha de respuesta: 09/10/2026.
- Quién escribe la consulta: el arquitecto. El director la envía, pega la respuesta, pregunta en
  conversación y decide.
- Estado: **ARCHIVADA CON DECISIÓN DEL DIRECTOR Y EJECUCIÓN EN MARCHA — VÍA 2** (el segmentador
  propio con etiquetas, sobre el contrato JSON de hoy). La vía 1 queda como destino y la vía 3
  sólo como reparación.
- **Las decisiones que salen de aquí, fuera de la consulta**: la regla de congelación, en el
  protocolo de `claude/Estado_Del_MVP.md` y en B.362; los criterios de reversión y el alcance de
  D1, en B.362; el diagnóstico corregido de las 13 de un solo lado, en B.358 (los dos de
  `Puntos_Pendientes_Doclity.txt`).

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

- **Continuación directa de F-121**, que mandó probar la función de citas del proveedor antes de
  construir. Se probó con dos sondas el 09/10 (`scripts/sonda-citas.mjs`; B.362): la función está
  activa, nuestro contrato la apaga y la respuesta llega partida en bloques.
- **Los veredictos que se le llevaron**: P-F121-6 falsa (0 de 13, SQL_B358; B.358), P-F121-7
  falsa (SQL_B349; B.349, B.360) y el parche de la glosa desplegado (`94efab9e`).
- **Las lecturas de código** son de Code, del 07 al 09/10: el juez devuelve JSON libre, los
  documentos van pegados, el producto no usa el SDK y el lector coge el primer bloque en dos
  sitios de los que cuelgan ocho consumidores.

---

# (c) ENUNCIADOS DE LAS PREGUNTAS — EL TEXTO ENVIADO, ÍNTEGRO

Texto literal enviado a Fable el 09/10/2026, tal como lo pegó el director. No se ha tocado.

CONSULTA F-122 · LA FUNCIÓN DE CITAS FUNCIONA, PERO NUESTRO CONTRATO LA APAGA.
¿CAMBIAR EL CONTRATO DEL JUEZ, O CONSTRUIR EL SEGMENTADOR PROPIO?

Fecha de envío: 09/10/2026.
Quien escribe: el arquitecto. El director ejecuta y decide.
Continuación directa de F-121.

CÓMO LEER ESTO
No ves el código. Todo dato del repositorio viene de una lectura de Code y va
marcado. Todo dato de producción viene de logs, SQL o sondas que el director ha
ejecutado, con su fecha. Lo que es juicio del arquitecto va marcado como juicio.
Y hay un número que va marcado como NO FIABLE, con su motivo.

0 · POR QUÉ ESTA CONSULTA
En F-121 dijiste: «Cambio 1: primero la función del proveedor. Construirlo
vosotros tiene sentido solo si la restricción de la salida estructurada bloquea
o si la medición en sombra sale mal. Orden: probar en sombra, decidir, y solo
entonces construir.»
LO HEMOS PROBADO. La función funciona. Y no encaja con nuestro contrato actual,
por un motivo distinto del que anticipaste. Ésta es la consulta que decide qué
hacemos con eso.

1 · LOS VEREDICTOS DE TUS PREDICCIONES DE F-121, Y UN ERROR NUESTRO QUE TE
    CONTAMINÓ

P-F121-6 («al intercambiar la atribución de las cruzadas literales se recuperan
al menos 2 de las 4 conocidas») → FALSA. Recuperables: CERO de TRECE.
  Medición: SQL_B358, ejecutada por el director el 08/10. Fila literal, sólo
  recuentos, ninguna cita:
    descartes 89 · sin_texto 0 · con_barra 40 · omitidos_por_tope 0 ·
    fallo_solo_nuevo 35 · fallo_solo_existente 13 · fallaron_los_dos 1 ·
    un_lado_cruzado_nuevo 2 · un_lado_cruzado_existente 11 ·
    los_dos_cruzados 0 · los_dos_fallan_uno_cruzado 0 ·
    fallido_pero_esta_en_su_documento 0 · verificado_no_encontrado 0
  Sumandos: 89 = 40 + 49; 49 = 35 + 13 + 1; cruzadas 13 = 2 + 11.
  EL MECANISMO: en las 13 cruzadas falló UN SOLO lado. El lado que no falló se
  verificó en su propio documento, así que LAS DOS CITAS SON DEL MISMO
  DOCUMENTO. No hay nada que intercambiar: no existe una frase del otro
  documento que poner. Y `fallido_pero_esta_en_su_documento` = 0 cierra la
  excepción: ninguna cita fallida está en su documento fuera de lo entregado.
  ⚠️ Y LA CONCLUSIÓN DE DISEÑO CONTRADICE TU P5 PARA ESTE CASO: aquí EL DESCARTE
  ES CORRECTO. Degradar el hallazgo a «cita no verificada» y publicarlo sería
  afirmarle al cliente algo falso sobre el contenido del otro documento, que es
  PEOR que el silencio. Tu doctrina de «no descartar, degradar» no aplica
  cuando lo que falta no es la verificación sino la evidencia.

⚠️ UN ERROR NUESTRO QUE ALIMENTÓ TU P6. La consulta F-121 te decía «DOS de esas
cuatro eran literales». Era un error de Code, copiado de un borrador: su propia
medición había dado TRES. Lo detectó y lo corrigió él mismo el 07/10. Tu
razonamiento de P6 se escribió sobre un número equivocado. No cambia el
veredicto —0 de 13—, pero debes saberlo.

P-F121-7 («al menos una de las 8 pasadas de NOR-11 tocó el tope de tokens de
salida») → FALSA, y resuelta SIN INSTRUMENTAR. SQL_B349 da, desde el 02/10, un
máximo de 3.928 tokens de salida POR ANÁLISIS ENTERO sobre 85 filas, y 0 por
encima de 4.096. Como cada fila es la suma de todas las llamadas del análisis y
la parte nunca es mayor que el total, ninguna llamada suelta pudo pararse por el
tope. El contador de `stop_reason` queda aparcado.

TU CHEAP FIX DE LA GLOSA → HECHO Y DESPLEGADO el 08/10. Un paso de repliegue que
sólo se intenta cuando la comprobación de siempre ya ha fallado: se quitan los
tramos entre corchetes y se busca otra vez. Dos pruebas fijan que no puede
cambiar ninguna cita que hoy pase. Pasada de control en la interfaz real: sin
regresión (8 solapamientos emitidos, la contradicción de PLAZO publicada, 1
descarte, 31,9 s). La glosa NO se guarda: es un parche que se borra cuando la
cita llegue por puntero.

⚠️ Y UN ERROR DEL ARQUITECTO, para que no construyas sobre él: presenté como
«dos métodos independientes confirmándose» que el repaso a mano de F-120 diera
11 lados «documento equivocado» y SQL_B358 diera 11 en
`un_lado_cruzado_existente`. NO LO ERA: los universos son distintos (uno cuenta
hasta el 06/10 y el otro hasta el 08/10, y los 11 del SQL son sólo de un lado).
Es una coincidencia de totales. Lo detectó Code.

2 · LAS DOS SONDAS. ESTO ES LO NUEVO Y ES EL CENTRO DE LA CONSULTA

Un script suelto, ejecutado por el director en su máquina de madrugada el
09/10. DOS DOCUMENTOS INVENTADOS de unas diez líneas cada uno (745 y 526
caracteres), con una contradicción de cifras clara, entregados como BLOQUES DE
DOCUMENTO con `citations: { enabled: true }`. Modelo Haiku 4.5, temperatura 0,1.

SONDA 1 · CON NUESTRO FORMATO ACTUAL. El prompt es el REAL del juez, leído del
código, que pide sólo JSON y exige una cita literal copiada dentro de cada
hallazgo.
  · 1 bloque de texto · `stop_reason: end_turn`
  · CERO CITAS de 1 bloque
  · entrada 4.660 tokens · salida 714
  · El JSON se lee igual que hoy: `JSON.parse` directo falla porque viene
    envuelto en un bloque de código, pero recortando de la primera a la última
    llave sí, que es lo que el código ya hace.

SONDA 2 · EL CONTROL POSITIVO. Mismos documentos, mismas citas activadas, pero
una pregunta EN PROSA («¿qué plazo de devolución da cada documento?») y NINGUNA
instrucción de copiar ni de devolver JSON.
  · 3 bloques de texto · `stop_reason: end_turn`
  · 2 DE 3 BLOQUES CON CITAS. El bloque sin cita NO TRAE el campo en absoluto,
    aunque el tipo del SDK lo declare obligatorio.
  · rango `char_location`; cada cita trae `cited_text`, `document_index`,
    `document_title`, `start_char_index`, `end_char_index` y `type`
  · `document_index` vistos: 0 y 1
  · entrada 1.682 tokens · salida 113
  · Leyendo SÓLO EL PRIMER BLOQUE, que es lo que hace hoy el código, se pierde
    la mayor parte: 136 de 290 caracteres.

LAS TRES CONCLUSIONES, separadas a propósito:
 (a) LA FUNCIÓN ESTÁ ACTIVA con nuestra petición. No falta ninguna cabecera: las
     citas entraron en la API normal en la versión 0.36.0 del SDK, no en una
     beta, y la sonda manda exactamente lo que mandaría el SDK. Descartado por
     MEDICIÓN, no sólo por lectura de tipos.
 (b) LO QUE LA APAGA ES NUESTRO CONTRATO. Pedir «sólo JSON, con la cita literal
     copiada dentro» hace que el modelo copie, que es justo lo que queríamos
     dejar de pedirle. Para que la API cuelgue un puntero, el texto citado tiene
     que estar FUERA del JSON.
 (c) CON CITAS, LA RESPUESTA SE PARTE EN VARIOS BLOQUES. Nuestro lector coge
     sólo el primero.

⚠️ UN NÚMERO QUE NO TE DOY COMO MEDIDO: el sobrecoste de entrada. Code estimó
que las citas añaden unos 1.200-1.800 tokens, comparando con «caracteres
partido por cuatro». ESA ESTIMACIÓN NO ES FIABLE: la regla de los cuatro
caracteres es mala para el español, que tokeniza peor que el inglés, y buena
parte de ese «sobrecoste» puede ser simplemente que nuestra base era baja. La
forma limpia de medirlo es una tercera sonda: la misma petición dos veces, una
con citas y otra sin, y restar la entrada. No la hemos hecho.

3 · LO QUE HAY QUE SABER DEL CÓDIGO PARA DECIDIR (lecturas de Code)
 · El juez devuelve JSON LIBRE EN EL TEXTO: ni salida estructurada por esquema,
   ni herramientas. Un sufijo del prompt le pide JSON y después se parsea a
   mano, con reparación del JSON truncado incluida.
 · Los documentos van PEGADOS dentro del mensaje del juez, no como bloques.
 · EL PRODUCTO NO USA EL SDK. Está instalado, pero las llamadas se montan a
   mano con `fetch`. Así que la petición y la lectura de la respuesta son
   nuestras, no del SDK.
 · El lector coge el PRIMER BLOQUE de la respuesta, y lo hace en DOS SITIOS
   duplicados. De ahí cuelgan OCHO consumidores: por una vía, el juez, el
   rerank, el verificador de hallazgos, synthesize, el double-check y el
   análisis de estilo; por la otra, el chat y el modal de mejora.
 · El tope de salida del juez son 4.096 tokens, y el máximo medido por análisis
   entero es 3.928. Antes de cualquier ampliación hay que subirlo a 8.192.

4 · LAS TRES VÍAS QUE VEO, Y SUS COSTES

VÍA 1 · CAMBIAR EL CONTRATO DEL JUEZ para usar la función del proveedor.
  A favor: punteros garantizados; `cited_text` extraído por ellos, literal por
  construcción; `document_index` dentro de la cita, lo que haría IMPOSIBLE la
  atribución cruzada —el 27 % de nuestros descartes de prosa—; mantenido por el
  proveedor.
  En contra: el texto citado tiene que salir del JSON, así que hay que rediseñar
  cómo el juez entrega los hallazgos; y hay que unir los bloques en el lector,
  que toca los ocho consumidores. Y nos ata al proveedor, aunque `llm-client.ts`
  existe para aislar eso.
  EL PROBLEMA QUE NO SÉ RESOLVER: necesitamos hallazgos ESTRUCTURADOS —tema,
  severidad, tipo, dos citas— y la función cuelga las citas de PROSA. No veo la
  forma que tenga las dos cosas.

VÍA 2 · EL PLAN B, tu diseño de F-120 P1: segmentador determinista propio,
  etiquetas numeradas `[A.12]`/`[C.7]`, ancla de 4-5 palabras, y reparar
  preguntando otra vez en vez de descartar.
  A favor, y esto no lo habíamos visto hasta ahora: ES COMPATIBLE CON NUESTRO
  CONTRATO ACTUAL. Una etiqueta es un campo de JSON como cualquier otro. El juez
  sigue devolviendo JSON, el lector no cambia, los ocho consumidores no se
  tocan. Y el juez pasa de tener que copiar 200 caracteres a copiar seis, que es
  lo que sí sabe hacer.
  En contra: lo construimos y lo mantenemos nosotros; el modelo puede señalar el
  segmento de al lado (detectable con el ancla, no imposible).

VÍA 3 · HIPÓTESIS DEL ARQUITECTO, SIN MEDIR, y te la doy marcada como tal: usar
  la función del proveedor SÓLO en una segunda llamada barata, de anclaje. El
  juez sigue devolviendo JSON como hoy, con su cita aunque sea reescrita; y
  después, una llamada pequeña con citas activadas pregunta «¿qué pasaje de
  estos documentos sostiene esta afirmación?» y devuelve `cited_text` con
  `document_index`. No cambia el contrato del juez ni el lector del camino
  principal. Cuesta una llamada más.
  No la propongo: no sé si es un patrón real o una ocurrencia.

5 · LAS PREGUNTAS

P1 — ¿QUÉ VÍA, Y POR QUÉ? Es la pregunta principal. Y si ninguna de las tres es
  la buena, dime cuál es. Me interesa especialmente si mantienes tu orden de
  F-121 («primero la del proveedor») ahora que sabemos POR QUÉ no encaja, o si
  el dato lo invierte.

P2 — SI LA VÍA 1: ¿cómo se obtienen hallazgos ESTRUCTURADOS cuando la evidencia
  tiene que vivir fuera del JSON? ¿Hay una forma asentada? En particular:
  ¿se combinan las citas con el uso de herramientas, o también se anulan entre
  sí como con el JSON? Y si la respuesta es una pasada en prosa seguida de una
  de estructuración, ¿cuánto cuesta eso en el sector y cómo se evita que la
  segunda pasada pierda lo que encontró la primera?

P3 — LA VÍA 3: ¿es un patrón real? ¿Cómo se llama? ¿Qué sale mal con él? Mi
  miedo es que la segunda llamada ancle una afirmación en un pasaje que no la
  sostiene, y que acabemos con una cita literal perfecta debajo de un hallazgo
  falso, que es peor que lo de hoy.

P4 — SI LA VÍA 2: en F-121 dijiste que el ancla «sobra si el puntero lo
  garantiza el proveedor y es OBLIGATORIA si lo construís vosotros». Si vamos
  por aquí, confírmame el diseño completo con la granularidad que recomendaste
  —frase como unidad mínima, con rangos contiguos— y dime qué harías distinto
  sabiendo que el juez devuelve JSON libre y que el tope de salida son 4.096
  tokens.

P5 — EL LECTOR. Si hay que unir los bloques, toca ocho consumidores y dos sitios
  duplicados. ¿Se puede acotar al juez sin crear un segundo criterio para el
  mismo dato, que es lo que nuestras reglas prohíben? ¿O lo correcto es
  unificar los dos sitios y asumir el alcance?

P6 — EL COSTE. ¿Importa el sobrecoste de entrada para esta decisión, o es
  irrelevante al lado de lo demás? Si importa, dime exactamente qué medir, y si
  la tercera sonda que describo en el punto 2 es la forma correcta. Y dime si
  sigue en pie lo que escribiste en F-121, que «el texto citado no cuenta como
  tokens de salida»: eso no lo hemos medido en una llamada de verdad del juez.

P7 — ¿QUÉ MIDO ANTES DE CONSTRUIR, en sólo lectura o en sombra? Y déjame tus
  predicciones por escrito con su criterio de aceptación, para contarlas después
  como todas las demás. Un criterio de aceptación que ya tenemos: la frase «El
  personal clínico y auxiliar recibe formación específica en gestión de residuos
  sanitarios antes de incorporarse a su puesto…» es de NOR-11, el juez la
  atribuye a CLI-13, y el log la etiqueta como cruzada TRES DÍAS SEGUIDOS, con
  126 caracteres el 07/10 y 248 el 08/10. Es la atribución cruzada más
  reproducible que tenemos.

6 · LO QUE NO TE PREGUNTO, PARA QUE NO GASTES AHÍ
No pregunto por el retrieval ni por el rerank: es F-119, y hemos medido que en
el corpus actual los seis documentos reales llegan todos a candidato. No
pregunto por las 40 filas de tabla con barras de los 89 descartes —el 45 %, y
el frente más grande en volumen—: es otro frente y va aparte. No pregunto por
la segunda pasada del juez ni por su coste con caché: es F-120 P2 y sigue sin
medir. No pregunto por la inestabilidad de la emisión: subir el techo de
solapamientos de 5 a 10 la bajó a la mitad y eso ya está en producción.

---

# (d) RESPUESTA RECIBIDA — F-122 · 09/10/2026 · DICTAMEN, ÍNTEGRO

⚠️ **DOS MARCAS, puestas aquí fuera para no tocar el texto:**

1. **LA SECCIÓN FINAL NO RESPONDE A LA CONSULTA.** Desde la línea que empieza «PREGUNTAS DEL
   DIRECTOR, HECHAS EN CONVERSACIÓN TRAS EL PRIMER DICTAMEN (09/10, 00:45–01:00)» —la
   141.ª línea del dictamen— hasta el final, son preguntas que el DIRECTOR hizo a Fable en
   conversación DESPUÉS del primer dictamen: D1 y D2. No estaban en la consulta del arquitecto.
   De ellas salen un criterio de reversión (el caso P3), la REGLA DE CONGELACIÓN y una lectura
   del estado. Las respuestas a P1–P7 son lo que va antes de esa línea.
2. **PROCEDENCIA DE LO QUE DICE SOBRE LA FUNCIÓN DE CITAS** (línea 6 del dictamen):
   viene de la documentación del proveedor leída el **07/10/2026**. Es un dato externo con fecha
   y puede cambiar. Lo que dice de patrones del sector (RARR, ALCE, «post-hoc attribution»,
   «semi-structured output») lo marca él mismo como de entrenamiento.

RESPUESTA DE FABLE — F-122 · LA FUNCIÓN DE CITAS FUNCIONA, PERO NUESTRO CONTRATO LA APAGA. ¿CAMBIAR EL CONTRATO DEL JUEZ, O CONSTRUIR EL SEGMENTADOR PROPIO?
Versión consolidada, 09/10/2026. Contiene el dictamen sobre las siete preguntas del arquitecto y, al final, una sección con las preguntas del director hechas en conversación después del primer dictamen, marcada como tal. Esa sección incluye un criterio de reversión nuevo, una regla de congelación y una lectura del estado que deben quedar archivadas.

Procedencia y cuentas pendientes

No veo el código. Todo dato del repositorio va con la procedencia de Code. Lo que diga de la función de citas viene de la documentación leída el 07/10; lo que diga de patrones del sector es de entrenamiento y va marcado con nombres buscables.
Dos predicciones mías falladas, contadas. P-F121-6, cero de trece recuperables: fallé por aceptar “cruzada” como “cita bien copiada en el documento equivocado” sin exigir el mecanismo. El mecanismo real es otro, abajo. P-F121-7, ninguna llamada tocó el tope de salida: fallé, y vuestra deducción por sumas es correcta y más barata que instrumentar.
La corrección a mi P5 de F-121 se acepta entera. “No descartar, degradar” vale para un fallo de verificación, no para una ausencia de evidencia. Un hallazgo cuyas dos citas son del mismo documento no tiene el otro lado; publicarlo degradado sería afirmar algo falso sobre un documento que no se leyó. Se descarta del usuario. Lo que sí puede hacerse es enrutarlo a la especie interna “sospecha sin contrastar” de F-116, para alimentar una segunda búsqueda dirigida, nunca para publicarlo.
El dato equivocado (2 frente a 3 literales) no cambia nada ahora; queda anotado.

Veredicto

P1: vía 2, ahora, para el MVP. El orden de F-121 era un orden de prueba, no de construcción: “probar primero la del proveedor” se hizo, y la prueba dijo que con vuestro contrato no cuelga citas. Invertir no es contradecir F-121: es lo que la prueba servía para decidir. La vía 1 queda como destino cuando el juez cambie de contrato de salida por otras razones que ya están en el plan.
P2: sí hay forma asentada de tener estructura y citas: prosa con una gramática mínima parseable, no JSON. No hace falta segunda pasada. Pero exige rediseñar la salida del juez y el lector, y hoy no compensa frente a la vía 2.
P3: la vía 3 es un patrón real, se llama atribución a posteriori, y falla exactamente como teméis. No como mecanismo principal; sí como reparación con un juicio de sostén detrás.
P4 a P6: diseño completo abajo; el lector se unifica en una función, no se acota; el sobrecoste de entrada es irrelevante para esta decisión y la vía 2 ni lo paga.
P7: el caso de “formación específica” es el criterio de aceptación correcto, y mi predicción es que con la vía 2 desaparece como cruzada en 3 de 3 porque la etiqueta obliga a elegir un lado.

Antes de las preguntas: lo que las 13 “cruzadas” son de verdad

No son errores de atribución. Son el juez afirmando con un solo lado: tomó dos frases de NOR-11 y llamó “existente” a una de ellas. Es la enfermedad de F-116 medida en el campo: 13 de 49 descartes de prosa, el 27 %, son hallazgos sin el otro lado. Dos consecuencias de diseño:

Cualquier contrato nuevo debe hacer sintácticamente imposible que las dos evidencias vengan del mismo documento. Con etiquetas, “una de A y una de C” se valida sin modelo.
Cuando el juez no tiene el lado C, lo que falta no es una cita: es la búsqueda dirigida de F-116 P5. La segunda vuelta recupera su prioridad con esta cifra.

P1 · Qué vía, y por qué

Vía 2 ahora. Vía 1 como destino. Vía 3 solo como reparación.

Por qué la vía 2:

Compatible con el contrato de hoy: una etiqueta es un campo JSON. El lector no cambia, los ocho consumidores no se tocan, el cambio vive en el prompt del juez, un segmentador y un validador. Para un equipo que despliega fichero a fichero, el radio de impacto es la variable que más pesa, y es la mínima de las tres.
Da el 90 % del beneficio de la vía 1: puntero en vez de copia, documento dentro de la etiqueta, texto extraído del fichero, glosa fuera. Lo que no da es la garantía de puntero del proveedor; eso lo cubre el ancla, que convierte el error en detectable.
Baja los tokens de salida: seis caracteres en vez de doscientos por lado.
Se mide en una semana con las mismas ocho pasadas.

Por qué no la vía 1 hoy:

Exige tres cambios encadenados: documentos como bloques, salida del juez en prosa con gramática, y lector que une bloques y asocia citas a hallazgos. Tres cambios en el camino crítico de un equipo sin programador son tres semanas con riesgo, por un 10 % de beneficio adicional.
Y un hecho que lo decide: el juez va a cambiar de contrato de salida de todos modos cuando entren la lista de datos examinados de F-120 y, más tarde, la extracción de afirmaciones. Ese es el momento de pasar a la vía 1, rediseñando la salida una sola vez.

Dos piezas de higiene que van antes de cualquier vía:

El lector que coge solo el primer bloque es un fallo latente para los ocho consumidores: cualquier respuesta con varios bloques de texto se trunca hoy. Se unifica en una función que concatena todos los bloques de texto en orden. P5.
Los documentos pegados en el prompt tendrán que ser bloques de documento para la caché de prompt de F-120 P2, con o sin citas. No va en el camino crítico; se anota para que la medición de la segunda pasada no lo descubra tarde.

P2 · Si la vía 1: estructura y citas a la vez

Hay forma asentada, y no es JSON ni segunda pasada: prosa con gramática mínima, parseada en código. El juez escribe cada hallazgo como un bloque con líneas fijas:

HALLAZGO 3 · contradicción · severidad alta
Tema: ubicación del punto de retirada
Nuevo: <frase citada>
Existente: <frase citada>

Las citas cuelgan de las frases en prosa, que es donde el proveedor las cuelga. El sistema concatena los bloques conservando la posición de cada cita, parsea la gramática con un autómata de líneas y asigna cada cita al hallazgo en cuyo rango cae. Sin modelo en medio, nada se pierde. Buscables: “semi-structured output”, “citation-aware parsing”.

Sobre herramientas y citas: la página que leí dice que citas y salida estructurada por esquema son incompatibles porque las citas exigen intercalarse con texto. No dice nada de herramientas. Mi expectativa, de entrenamiento y sin verificar: las citas solo cuelgan de bloques de texto, así que una entrada de herramienta en JSON tampoco las llevaría. Es una sonda de diez minutos.

Sobre prosa más pasada de estructuración: existe, “extract then structure”, coste de una llamada corta por respuesta. Para que no pierda, la segunda pasada recibe los hallazgos numerados y devuelve la misma numeración, con contador que exige coincidencia. No la recomiendo: el parser determinista hace lo mismo sin llamada.

P3 · La vía 3

Patrón real: atribución a posteriori. Buscables: “post-hoc attribution”, “post-hoc citation”, y el sistema RARR (Gao et al., 2023). Lo evaluaron de frente en ALCE (Gao et al., 2023): la atribución a posteriori produce citas más plausibles y menos fieles que la citación durante la generación. Vuestro miedo es su modo de fallo conocido: la segunda llamada encuentra el pasaje más parecido y lo ancla aunque no sostenga la afirmación. Resultado: cita literal perfecta bajo un hallazgo falso, peor que el descarte.

Dónde sí sirve: como reparación cuando el puntero de la vía 2 falla el ancla y el reintento también, con juicio de sostén detrás y etiqueta “sin_relacion” posible. Nunca como camino principal.

P4 · Diseño completo de la vía 2

Segmentador determinista, sin modelo.

Unidad: la frase. Partición por punto, signo de cierre o salto de línea, con excepciones para español: abreviaturas (art., núm., Dr., Sra., p. ej.), decimales y miles (1.200, 3,5), siglas con puntos.
Listas, encabezados y filas: cada línea es un segmento.
Tope: 400 caracteres; si se supera, se parte en el primer punto y coma o dos puntos; si no hay, en el último espacio antes del tope, con marca.
Suelo: fragmentos de menos de 25 caracteres se funden con el anterior.
Salida: lista de segmentos con inicio y fin en el documento, calculada una vez por versión y guardada. Verificador e interfaz leen la misma lista.
Alcance: solo trozos de tipo texto. Las filas de Excel (table_row) siguen por su vía sin tocar una línea. Ver sección D1.

Entrega al juez.

Cada segmento en su línea con etiqueta corta como prefijo: A12| El gestor autorizado recoge… y C7| …. “A” es siempre el analizado y “C” el candidato; se dice en el prompt y se valida en código.
Predicción de coste: unos 3 tokens por etiqueta; para NOR-11, unos 110 segmentos, menos del 8 % de la entrada. Se mide con usage.input_tokens con y sin etiquetas.

Contrato del juez, campos por hallazgo.

nuevo: {desde: "A12", hasta: "A13", ancla: "El gestor autorizado recoge"}
existente: {desde: "C7", hasta: "C7", ancla: "…"}
nota opcional, para la glosa. Prohibido texto citado en cualquier otro campo.
Se elimina la instrucción de copiar y la regla “si no puedes copiar, no emitas”. Se sustituye por: “cada hallazgo señala exactamente un rango de A y un rango de C”.
Rango máximo: 3 segmentos.
Opcional y barato: examinados: [{a: "A12", c: "C7", veredicto: "sin_contradiccion"}], la lista de datos comprobados de F-120 P2. Pares de etiquetas, casi gratis, y es lo que hace que las pérdidas entre pasadas dejen rastro. Iría en el mismo cambio de prompt.

Validador, en código, en este orden.

Las etiquetas existen y cada lado es del documento correcto. Fallo: no se publica; contador lado_equivocado.
Rango contiguo y ≤ 3.
Ancla: las primeras cuatro palabras normalizadas del segmento desde coinciden. Si no: buscar en ±1; si está, corregir y contar puntero_corregido; si no, una reparación mostrando los tres segmentos candidatos; si falla, no se publica, contador puntero_no_resuelto, y va a la especie interna de sospecha.
Texto de la cita: extraído de los segmentos del rango, del fichero. Nunca del modelo.
Verificador de hallazgos: recibe los textos extraídos y responde si C sostiene el hallazgo. Un “no” es un hallazgo con un solo lado real, como las 13.

Con JSON libre y tope 4.096.

Las etiquetas reducen la salida; predicción: −30 % de tokens de salida por llamada. Subir el tope a 8.192 es gratis y evita la próxima sorpresa. Hágase.
El reparador de JSON truncado debe rechazar un hallazgo con etiqueta incompleta, no inventar la cola.
La tabla de Word con barras no entra aquí: es otro frente.

Interfaz. La cita que ve el usuario es el rango extraído, con el segmento anterior y el posterior en gris como contexto. Lo que el modelo escribió no se muestra nunca.

P5 · El lector

Unificar, no acotar. Acotar al juez sería un segundo criterio para el mismo dato. El alcance es menor de lo que parece:

La función nueva concatena todos los bloques de texto en orden. Para una respuesta de un solo bloque, lo que reciben hoy los ocho consumidores, devuelve exactamente lo mismo. Compatible hacia atrás por construcción.
Un commit propio, antes de cualquier vía, con dos pruebas: un bloque → idéntico; tres bloques → concatenado.
Si guardáis las respuestas crudas del modelo, la regresión es releer las últimas 50 con la función nueva: cero diferencias. Si no las guardáis, es el momento de empezar.
Para la vía 1 futura, la misma función recogerá las citas con sus posiciones. Se diseña hoy con ese hueco.

P6 · El coste

Para esta decisión, irrelevante. La decide el radio de impacto. La vía 2 ni lo paga: su sobrecoste son las etiquetas, menor que el ahorro en salida.
La tercera sonda es la forma correcta de medir el sobrecoste de citas: misma petición con y sin citations.enabled, restar usage.input_tokens. La estimación por caracteres partido por cuatro no vale para español, como decís.
“El texto citado no cuenta como salida”: afirmación de la documentación, no medición vuestra. La sonda 2 es consistente pero no la prueba. Con la vía 2 no hace falta probarla.
Lo que sí medir ahora, para la vía 2: tokens de entrada con y sin etiquetas, y de salida antes y después, en las mismas ocho pasadas.

P7 · Qué medir antes de construir, y predicciones

Segmentador sobre los 44 documentos del corpus. Predicción: mediana entre 110 y 160 caracteres; menos del 3 % por encima de 400 tras partir.
Lector unificado contra respuestas guardadas. Predicción: cero diferencias en 50 respuestas de un bloque.
Sombra de la vía 2 sobre las 8 pasadas de NOR-11, sin publicar.
Etiquetas válidas: ≥ 95 %. Lado correcto en los dos campos: ≥ 95 %.
Ancla exacta: ≥ 85 %. Corrección ±1: ≤ 10 %. No resuelto: ≤ 5 %.
LUGAR con puntero válido: ≥ 6 de 8. NEGACIÓN emitida: ≥ 4 de 8. PLAZO: 8 de 8. Falsos publicados: 0.
Tokens de salida: −30 % o más. Entrada: +8 % o menos.
El caso de “formación específica”. Predicción: en 3 de 3, o no se emite, o nuevo apunta a la frase de NOR-11 con etiqueta A y existente a un segmento C que el verificador rechaza. Cruzadas publicadas: 0 de 3.
Las 13 de un solo lado, en sombra. Predicción: al menos 10 reaparecen como hallazgos cuyo lado C falla el verificador o que no se emiten.
Tope de salida a 8.192 en el mismo cambio.
El caso P3 del arnés (Excel), antes y después. Ver D1.

Criterio de reversión, escrito antes: si PLAZO baja de 8 de 8, o aparece un falso publicado, o los no resueltos superan el 5 %, o P3 cambia, se apaga el interruptor y se vuelve al contrato de copia con el parche de la glosa.

PREGUNTAS DEL DIRECTOR, HECHAS EN CONVERSACIÓN TRAS EL PRIMER DICTAMEN (09/10, 00:45–01:00)

Esta sección no estaba en la consulta del arquitecto. Recoge dos preocupaciones del director, y de ellas salen un criterio de reversión, una regla de congelación y una lectura del estado que deben quedar archivadas.

D1 · “Excel va por otro camino y ya estaba cerrado. ¿Esto lo puede empeorar?”

Correcto, y la separación se hace explícita, no se da por hecha. El camino de Excel decidió en el paso 5 que la fila se señala por datos, hoja, fila y celdas, y se comprueba contra las celdas. No copia frases. El problema de la copia es de la prosa.
El cambio de la vía 2 queda acotado por tipo de trozo: segmentador, etiquetas y validador solo para text. Las filas table_row siguen por su vía sin tocar una línea.
Criterio de reversión añadido: el caso P3 del arnés, dos hojas de tarifas con 15 filas discrepantes y 25+25 exclusivas, da exactamente lo mismo en 5 de 5 pasadas antes y después. Si se mueve, se apaga.
Las 40 filas con barras de los descartes no son Excel: son tablas de Word, y ese frente sigue aparte.

D2 · “Me da la sensación de que los planes se echan atrás y de que estamos complicando demasiado el producto. No sé a cuánto estamos de que funcione bien.”

Lo que no se ha echado atrás en tres semanas: el arnés existe y mide; el juez lee los documentos enteros y la detección pasó de 1 a 3 de 3; el parche de la glosa está en producción sin regresión; subir el techo de solapamientos bajó la inestabilidad a la mitad; y hoy se sabe con cifras que el 27 % de lo tirado en prosa son hallazgos a los que falta la otra mitad. Nada de esto existía el 20 de septiembre.

Lo que sí se ha echado atrás: una semana explorando la función de citas del proveedor. Costó unas sondas y cero líneas en producción. No fue un error: F-121 dijo “probar antes de construir”, se probó, y la prueba dijo que no. Eso es la prueba funcionando. El plan que se construye ahora es el mismo que estaba escrito en F-120; cambió el orden, y lo cambió un dato.

Sobre “complicar el producto”: el producto que ve el usuario no cambia: sube un documento, recibe hallazgos con sus dos citas. Por dentro, señalar una frase por número es más simple que copiarla y comprobar la copia con tres pasos y un parche de corchetes. Lo que ha crecido es la medición, no el mecanismo, y la medición es lo que impide que la complejidad entre sin que nadie la vea.

Lo que está pasando: cada capa arreglada deja ver la siguiente, que antes estaba tapada. Es lo que hace medir. La alternativa era lo de agosto: probar una vez, ver las tres trampas, y creer que funcionaba.

A cuánto estáis: el criterio de cerrado es cada trampa en 4 de 5 pasadas, cero falsos, coste escrito. Hoy: PLAZO 8 de 8, LUGAR 0 de 8, NEGACIÓN 2 de 8. Con la vía 2, en una semana y si las predicciones aciertan, LUGAR sube a 6 de 8 y queda cerrado. NEGACIÓN se queda en 4 de 8, que no llega: para eso hacen falta la lista de datos examinados y la segunda pasada con su coste medido, otra semana o dos. Estimación honesta: dos o tres semanas para las trampas que tenéis, si las predicciones se cumplen, con un día concreto en que se sabrá, porque cada una tiene su número escrito. Si fallan, no se alarga a ciegas: se sabe en qué capa y por qué.

REGLA DE CONGELACIÓN, QUE QUEDA ARCHIVADA. Hasta que el arnés dé el criterio de cerrado, entran solo tres cosas:

El lector unificado y las etiquetas de la vía 2, con el alcance de D1.
La segunda búsqueda dirigida de F-116 P5 para los hallazgos a los que falta el otro lado.
La lista de datos examinados y el coste medido de la segunda pasada, F-120 P2.

Todo lo demás queda congelado con fecha, no cancelado: tablas de Word, la elección de documentos de F-119, la función de citas del proveedor, la extracción de afirmaciones. Si el arquitecto o Fable proponen algo fuera de esta lista antes de que el arnés esté verde, el director lo para.

---

# (e) PREDICCIONES REGISTRADAS, PENDIENTES DE MEDICIÓN

Escritas por Fable antes de medir. **Sin veredicto.** Universo de las de la sombra: las 8 pasadas
de NOR-11 (4 del 06/10 y 4 del 07/10), repetidas con la vía 2.

- **P-F122-1 · El segmentador sobre el corpus**: mediana de segmento entre 110 y 160 caracteres;
  menos del 3 % por encima de 400 tras partir. *Estado*: sin medir. ⚠️ Universo sin declarar:
  ver (f), punto 1.
- **P-F122-2 · El lector unificado**: cero diferencias en 50 respuestas de un bloque. *Estado*:
  sin medir. ⚠️ Hoy no se puede medir así: ver (f), punto 4.
- **P-F122-3 · Etiquetas en la sombra**: etiquetas válidas ≥ 95 %; lado correcto en los dos
  campos ≥ 95 %. *Estado*: sin medir.
- **P-F122-4 · El ancla**: exacta ≥ 85 %; corrección ±1 ≤ 10 %; no resuelto ≤ 5 %. *Estado*: sin
  medir.
- **P-F122-5 · Las trampas sembradas**: LUGAR con puntero válido ≥ 6 de 8; NEGACIÓN emitida ≥ 4
  de 8; PLAZO 8 de 8; falsos publicados 0. *Estado*: sin medir.
- **P-F122-6 · Los tokens**: salida −30 % o más; entrada +8 % o menos (con y sin etiquetas,
  `usage.input_tokens`). *Estado*: sin medir.
- **P-F122-7 · El caso de «formación específica»**: en 3 de 3, o no se emite, o «nuevo» apunta a
  la frase de NOR-11 con etiqueta A y «existente» a un segmento C que el verificador rechaza.
  *Aceptación*: 0 de 3 cruzadas publicadas. *Estado*: sin medir.
- **P-F122-8 · Las 13 de un solo lado, en sombra**: al menos 10 reaparecen como hallazgos cuyo
  lado C falla el verificador, o no se emiten. *Estado*: sin medir.
- **P-F122-9 · El caso P3 del arnés (Excel)**: exactamente lo mismo en 5 de 5 pasadas antes y
  después del cambio. Es además criterio de reversión. *Estado*: sin medir.

**Y DOS PREDICCIONES DE FABLE YA FALLADAS, QUE CUENTA ÉL MISMO** en el dictamen («Dos
predicciones mías falladas, contadas»):
- **P-F121-6** (al menos 2 de 4 cruzadas recuperables) → falsa, 0 de 13. Su causa, en sus
  palabras: aceptó «cruzada» como «cita bien copiada en el documento equivocado» sin exigir el
  mecanismo.
- **P-F121-7** (al menos una pasada tocó el tope de salida) → falsa; acepta la deducción por
  sumas como «correcta y más barata que instrumentar».

---

# (f) PRECISIONES SOBRE EL DICTAMEN Y SOBRE LA CONSULTA

**Del arquitecto (09/10/2026):**
1. ⚠️ **DISCREPANCIA ABIERTA: «el segmentador sobre los 44 documentos del corpus»** (dictamen,
   P7). No se sabe de dónde sale el 44. Lo medido es 50 documentos en la organización y 20 en el
   corpus validado, de los cuales 6 con trozos (SQL_B345 y SQL_B334, 06 y 08/10). **Antes de
   ejecutar esa medición hay que declarar el universo.** Es la regla de la casa y aplica también
   a Fable.

**Notas de Code (09/10/2026) sobre lo que no cuadra.** El texto de (c) y (d) no se ha tocado.
2. **La consulta atribuye a Code una estimación que no hizo así** (punto 2): «unos 1.200-1.800
   tokens, comparando con "caracteres partido por cuatro"». Lo que Code escribió fue **unos
   1.200-1.400**, y dividiendo por unos **3,5** caracteres por token, no por cuatro. La
   conclusión de la consulta no cambia —la estimación no es fiable y la forma limpia es la
   tercera sonda—, pero la cifra y el método citados no son los de Code.
3. **«Subir el techo de solapamientos de 5 a 10 la bajó a la mitad»** (consulta, punto 6; y el
   dictamen, D2, «bajó la inestabilidad a la mitad»). No hay una medición que diga «la mitad». Lo
   medido el 07/10 (B.338) son huellas compartidas entre pasadas consecutivas: de 0 de 5 a 4 de
   10. «A la mitad» es una lectura, no una cifra.
4. **El lector unificado no se puede validar contra respuestas guardadas: no se guardan** (P5 y
   P-F122-2). Del juez sólo queda en el log una línea resumen por pareja («RAW»,
   `lib/analysis/judge.ts:899` y `:907`); la respuesta cruda no se persiste en ninguna tabla.
   Fable lo prevé («si no las guardáis, es el momento de empezar»): empezar a guardarlas sería
   un cambio aparte, y entra en la regla de congelación sólo si va dentro del lector unificado.
5. **«Subir el tope a 8.192… Hágase»** (P4) **y «en el mismo cambio»** (P7) cuadran con la regla
   de B.360 —antes de cualquier ampliación, 8.192— y con B.356, que la dejó aparcada hasta que se
   tocara algo que aumente la salida. La vía 2 es ese cambio.

---

# (g) MEDICIONES CANDIDATAS — las que propone Fable, con su estado

| # | Medición | Predicción | Estado (09/10/2026) |
|---|---|---|---|
| 1 | **Segmentador** sobre el corpus | P-F122-1 | **NO INICIADA** — falta declarar el universo ((f), punto 1) |
| 2 | **Lector unificado** contra respuestas guardadas | P-F122-2 | **NO INICIADA** — no hay respuestas guardadas ((f), punto 4) |
| 3 | **Sombra de la vía 2** sobre las 8 pasadas de NOR-11, sin publicar | P-F122-3 a 8 | **NO INICIADA** |
| 4 | **Tokens** de entrada con y sin etiquetas, y de salida antes y después | P-F122-6 | **NO INICIADA** |
| 5 | **El caso P3 del arnés** (Excel), 5 de 5 antes y después | P-F122-9 | **NO INICIADA** |
| 6 | **Tercera sonda**: misma petición con y sin citas, restando la entrada | — | **NO INICIADA**; con la vía 2 «no hace falta» (P6) |
| 7 | **Sonda de herramientas y citas** («diez minutos», P2) | — | **NO INICIADA**; fuera de la regla de congelación |

---

# (h) ENCARGOS DE FABLE, CONTESTADOS POR CODE

Ninguno contestado a 09/10/2026. Los que deja: las mediciones de (g).
