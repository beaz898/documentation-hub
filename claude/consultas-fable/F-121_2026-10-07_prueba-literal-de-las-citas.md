---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-121
Asunto: la prueba literal — el juez no sabe copiar y la puerta castiga con la
        pérdida del hallazgo
Fecha de envío: 07/10/2026
Fecha de respuesta: 07/10/2026
Fuente: los dos textos los pega el director en el encargo del 07/10/2026. La
        consulta SÍ consta, al contrario que en F-119: va íntegra en (c).
Estado: ARCHIVADA CON DECISIÓN DEL DIRECTOR Y EJECUCIÓN EN MARCHA
        (07/10/2026). No es «sin decisión»: el director aceptó el plan de
        Fable y el primer paso —instrumentar el corte por tokens— se encarga
        por separado el mismo día.
        Cotejo de integridad, 07/10/2026. Método declarado, porque el de F-119
        no consta y no se ha podido reproducir: sha256 del texto tal como queda
        archivado aquí (saltos LF, sin salto final), 16 primeros hexadecimales;
        caracteres = puntos de código; palabras = trozos separados por espacio
        en blanco. Ninguno de los dos textos tiene espacios que no sean ASCII.
        Los 60 primeros y últimos van entre comillas con escapes JSON: \" es una
        comilla del texto y \n un salto de línea.
        · DICTAMEN, (d): huella 3acba9144735d462 · 15.881 caracteres
          (16.136 bytes UTF-8) · 138 líneas · 90 no vacías ·
          2723 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-121 · LA PRUEBA LITERAL: EL JUEZ NO S"
          60 últimos:  "iente\": extracción de afirmaciones por documento al indexar."
        · CONSULTA, (c): huella d043031b8e28e7ff · 10.934 caracteres
          (11.186 bytes UTF-8) · 187 líneas · 164 no vacías ·
          1898 palabras.
          60 primeros: "CONSULTA F-121 · LA PRUEBA LITERAL: EL JUEZ NO SABE COPIAR, "
          60 últimos:  "el segundo\npase del juez: eso es F-120 P2 y sigue sin medir."
        No hay cifras del original con las que comparar: el director pegó los
        textos en el mensaje, no un fichero. Estas cifras son la referencia
        para quien coteje después.
Superada por: —
---

# (a) CABECERA

**F-121 · La prueba literal: el juez no sabe copiar, y la puerta lo castiga con la pérdida
del hallazgo**

- Fecha de envío: 07/10/2026.
- Fecha de respuesta: 07/10/2026.
- Quién escribe la consulta: el arquitecto. El director la envía, pega la respuesta, hace
  preguntas propias en conversación y decide.
- Estado: **ARCHIVADA CON DECISIÓN DEL DIRECTOR Y EJECUCIÓN EN MARCHA.**

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

- **El plan revisado es de Fable**: su respuesta a F-120, pregunta P1 (segmentador
  determinista, el juez señala pedazos en vez de copiar). ⚠️ F-120 **no tiene fichero en
  este directorio ni fila en INDICE.md** a 07/10/2026; lo que consta de ella en el
  repositorio son sus encargos de medición (`SQL_F120_P2_perdida_o_reclasificacion.sql`,
  `SQL_F120_P3_rerank_a_cero.sql`) y sus citas en las fichas.
- **La pregunta principal, P1, es del director**: «es imposible que seamos los primeros».
- **Los datos de producción** son las ocho pasadas de NOR-11 del 06 y el 07/10 (fichas
  B.338, B.339, B.357 y B.361 de `Puntos_Pendientes_Doclity.txt`), la comparación a mano de
  las once citas descartadas (B.358), el techo de solapamientos (B.338, B.350) y la cota de
  tokens (B.360).
- **Los datos de repositorio** son lecturas de Code del 06 y el 07/10: la puerta de citas
  (`lib/analysis/coincidencia-de-cita.ts`), el detector de cruzadas
  (`lib/analysis/diagnostico-de-cita.ts`, B.358) y la llamada del juez (`judge.ts:858`).

---

# (c) ENUNCIADOS DE LAS PREGUNTAS — EL TEXTO ENVIADO, ÍNTEGRO

Texto literal enviado a Fable el 07/10/2026, tal como lo pegó el director. No se ha tocado.

CONSULTA F-121 · LA PRUEBA LITERAL: EL JUEZ NO SABE COPIAR, Y LA PUERTA LO
CASTIGA CON LA PÉRDIDA DEL HALLAZGO

Fecha de envío: 07/10/2026.
Quien escribe: el arquitecto. El director ejecuta y decide.

CÓMO LEER ESTO
No ves el código. Todo dato del repositorio viene de una lectura de Code y va
marcado como tal. Todo dato de producción viene de logs y SQL que el director
ha ejecutado y pegado, y va con su fecha y su universo declarado. Lo que es
juicio del arquitecto va marcado como juicio, no como medición.

0 · POR QUÉ TE PREGUNTO A TI ESTO, Y NO SOLO SI NUESTRO PLAN ES BUENO
El plan que te traigo es TUYO: es tu respuesta a F-120, pregunta P1. Lo traigo
de vuelta porque desde entonces hemos medido cosas que no sabíamos, y porque el
director ha hecho una pregunta que me parece la correcta: es imposible que
seamos los primeros que necesitan que un modelo señale evidencia verificable al
comparar dos documentos. Quiero saber qué hace el sector, con nombres
buscables, antes de construir nada.

1 · EL MECANISMO, TAL COMO ESTÁ HOY (lectura de Code, 06-07/10/2026)
- Pipeline de análisis en cuatro etapas: retrieval → rerank → juez →
  synthesize. El juez es Claude Haiku 4.5, temperatura 0,1, maxOutputTokens
  4096, una llamada por pareja de documentos, en paralelo por lotes de 5.
- Para la pareja principal el juez recibe LOS DOS DOCUMENTOS ENTEROS: régimen
  `pareja_entera`, analizado 14.704 de 14.704 caracteres y candidato 9.817 de
  9.817. No hay recorte en ese par.
- El prompt le exige, por cada hallazgo, UNA CITA LITERAL DE CADA DOCUMENTO, y
  le dice: «Si no puedes copiar una frase literal que sustente el hallazgo, no
  emitas ese hallazgo.»
- Después hay una PUERTA DE CITAS que verifica cada cita, en este orden:
  (1) búsqueda literal en el documento; (2) búsqueda normalizada (acentos,
  mayúsculas, espacios); (3) cabeza y cola por separado, siendo cabeza y cola
  el mínimo entre 20 caracteres y el 40 % de la cita normalizada.
  Si los tres fallan, EL HALLAZGO SE DESCARTA ENTERO y al usuario no le llega
  nada: ni el hallazgo, ni un aviso. Queda una línea de log.
- Existe además un diagnóstico que detecta cuando la cita está bien copiada
  pero puesta en el documento equivocado del par («cruzada: la cita del
  existente está en el nuevo»). SOLO OBSERVA: el hallazgo se descarta igual.

2 · LO MEDIDO, CON SU UNIVERSO DECLARADO
Caso de control sembrado a propósito: el fichero de siembra declara TRES
contradicciones entre NOR-11 (gestión de residuos) y CLI-13 (instrucciones
clínicas), y declara que cualquier otra contradicción entre esos dos documentos
es falso positivo.
Universo: OCHO pasadas de análisis rápido de NOR-11 desde la interfaz real,
cuatro el 06/10/2026 y cuatro el 07/10/2026, lanzadas por el director.

  · PLAZO (72 horas frente a 7 días naturales):
      emitida 8 de 8 · pasa la puerta 8 de 8 · PUBLICADA 8 de 8.
      Citas de 154 y 128 caracteres, las dos por paso literal.
  · NEGACIÓN (color del contenedor del grupo III no punzante):
      emitida 2 de 8 · pasa la puerta 2 de 2 · PUBLICADA 2 de 8.
      Citas de 185 y 195 caracteres, las dos por paso literal.
  · LUGAR (el punto de retirada está en Chamberí frente a está en Retiro):
      emitida 4 de 8 · PASA LA PUERTA 0 DE 4 · PUBLICADA 0 DE 8.
      Cita de 206 caracteres, paso `cabeza_sin_cola`.

  · CERO contradicciones falsas publicadas en las ocho pasadas.

EL DETALLE QUE CONVIERTE ESTO EN SISTEMÁTICO, no en azar: la huella de la cita
de LUGAR (sha256 de las dos citas, 8 caracteres) es LA MISMA, `ebe45632`, el
05/10 y el 07/10. El modelo escribió la misma reescritura, carácter por
carácter, en dos días distintos.

QUÉ ESCRIBE EL MODELO Y QUÉ DICE EL DOCUMENTO, literal:
  Documento (NOR-11): «El gestor autorizado recoge los residuos de las tres
  clínicas EN un punto de retirada centralizado…»
  Cita del modelo: «El punto de retirada centralizado CONCENTRA EL MATERIAL DE
  las tres clínicas, ubicado en la clínica de Chamberí, desde donde se coordina
  y documenta el transporte del material recogido en Salamanca y Retiro»
El contenido es correcto: el punto está en Chamberí y CLI-13 dice Retiro. Lo
que falla es la reproducción: reordena, sustituye y funde dos frases.

JUICIO DEL ARQUITECTO, no medición: hay una correlación entre la forma de la
frase y si sobrevive. Las que sobreviven son cortas y «de dato» (una cifra con
su unidad, un color). La que nunca sobrevive es prosa descriptiva con
subordinadas y tres topónimos. Si eso se confirmara, significaría que el
producto encuentra bien las contradicciones de cifras —las fáciles, que un
humano también ve— y es ciego a las que se prueban con una frase larga, que son
las valiosas. No está medido con suficientes casos.

3 · DOS FALLOS MÁS, DE LA MISMA FAMILIA, YA MEDIDOS
  a) ATRIBUCIÓN CRUZADA. En una comparación a mano de once citas descartadas
     (hecha por Code el 06/10 sobre una consulta SQL de los descartes del
     02/10 en adelante): en 11 lados y 4 citas distintas la cita estaba BIEN
     COPIADA pero atribuida al documento equivocado del par, y DOS de esas
     cuatro eran literales letra por letra. Se tiraron solo por la atribución.
  b) LA GLOSA QUE DESTRUYE UN HALLAZGO VERDADERO. El juez escribió
     «…recae siempre sobre esta figura [el Director Clínico]», añadiendo entre
     corchetes una aclaración correcta —se verificó que «esta figura» ES el
     Director Clínico— y la cita dejó de ser literal. El producto destruyó un
     hallazgo cierto por una aclaración acertada.

4 · CONTEXTO QUE IMPORTA: EL JUEZ TAMPOCO ES ESTABLE AL EMITIR
Esto es la otra mitad del problema y no es la que pregunto, pero cambia el
orden de las cosas, así que te la doy.
  · El prompt limitaba a 5 los solapamientos por pareja. El 07/10 subimos ese
    número a 10 y medimos cuatro pasadas: emisiones de 5, 5, 5, 5 a 8, 8, 10,
    10; huellas compartidas entre pasadas consecutivas de 0 de 5 a 4 de 10;
    y una sola pasada pasó a traer 8 de los 9 temas que antes necesitaban
    cuatro. Sin falsos positivos nuevos.
  · Pero con entrada IDÉNTICA byte a byte, el juez sigue dando salidas
    distintas: para otra pareja emitió 3, 1, 1 y 2 solapamientos en las cuatro
    pasadas, con el retrieval exactamente igual.
  · Y las contradicciones no se movieron: el techo de contradicciones es 10 y
    el juez emite una por pasada en tres de cada cuatro.
  · Margen de tokens: el máximo de tokens de salida POR ANÁLISIS ENTERO
    (suma de todas sus llamadas) es 3.928 sobre un techo de 4.096 por llamada.
    Queda poco margen declarado.

5 · EL PLAN QUE TRAIGO A REVISIÓN — ES TU RESPUESTA A F-120 P1
  1. Un segmentador DETERMINISTA, sin modelo, parte los dos documentos en
     pedazos numerados y los entrega etiquetados: [A.1], [A.2]… para el
     documento analizado y [C.1], [C.2]… para el del corpus.
  2. El juez, en vez de copiar, señala: «la contradicción está entre [A.12] y
     [C.7]».
  3. Como red de seguridad, da también un ANCLA de 4 o 5 palabras de cada
     pedazo.
  4. El sistema toma el texto del pedazo DE SU PROPIO FICHERO. La cita que ve
     el usuario es la del documento, literal por construcción, y nunca pasó por
     el modelo.
  5. Si la etiqueta y el ancla no coinciden, SE REPARA PREGUNTANDO OTRA VEZ con
     las etiquetas delante, NO se descarta el hallazgo.
  6. La glosa va en un campo aparte, fuera de la cita.
  Tu valoración en F-120 fue de menos del 8 % más de tokens de entrada, y tu
  argumento para usar etiquetas y no posiciones de caracteres fue que «los
  modelos no cuentan caracteres».

6 · LAS PREGUNTAS

P1 — ¿QUÉ HACE EL SECTOR? Esta es la pregunta del director, y es la principal.
  Comparar dos documentos y tener que señalar evidencia verificable no puede
  ser un problema nuestro. ¿Cómo lo resuelven los sistemas que lo hacen en
  serio —revisión de contratos, due diligence, cumplimiento normativo,
  verificación de hechos? Dame los nombres buscables y, si hay, las
  referencias, como hiciste en F-119 con MaxP, MMR y RAPTOR. En particular:
  ¿el patrón estándar es señalar identificadores de pasaje, devolver offsets,
  extraer con una segunda llamada, o algo que no estoy viendo?

P2 — ¿SIGUES FIRMANDO TU PLAN, con lo medido en el punto 2? Si lo cambiarías,
  dime qué y por qué. Me interesa especialmente si la huella idéntica entre
  días —el modelo reescribe igual dos días seguidos— te dice algo que no
  habíamos visto.

P3 — LA GRANULARIDAD DEL SEGMENTO. ¿Frase, párrafo o sección? Tengo tres
  miedos concretos:
   a) si el pedazo es grande, la cita que ve el usuario es larga y ruidosa;
   b) si es pequeño, la contradicción puede necesitar dos pedazos contiguos;
   c) y hay un caso real nuestro: el documento tiene una «chuleta» de resumen
      al final, y un hallazgo citó una cabeza del resumen con una cola de otra
      sección, 4.800 caracteres antes. ¿Cómo se evita que señale pedazos de
      sitios distintos como si fueran uno?

P4 — ¿HACE FALTA EL ANCLA? Si el sistema va a coger el texto del pedazo de su
  propio fichero, ¿para qué necesito que el modelo copie cinco palabras? ¿Cuál
  es la comprobación estándar de que señaló el pedazo correcto y no el de al
  lado? Y si el ancla falla pero la etiqueta es plausible, ¿qué se hace?

P5 — EL BUCLE DE REPARACIÓN. ¿Cuántos reintentos son razonables, y qué se hace
  si el segundo también falla? ¿Existe un patrón asentado de «no descartar,
  rebajar la confianza» en vez de tirar el hallazgo? Me preocupa cambiar un
  descarte silencioso por un bucle silencioso.

P6 — ¿ESTO MATA LA ATRIBUCIÓN CRUZADA O SOLO LA DISFRAZA? Mi razonamiento es
  que con etiquetas es imposible, porque [C.7] lleva el documento en el nombre.
  Pero el modelo podría escribir [C.7] queriendo decir [A.12]. ¿Hay forma de
  que el error de atribución quede imposible por diseño y no solo improbable?

P7 — EL ORDEN, Y ES LO QUE MÁS ME IMPORTA DECIDIR BIEN. Tenemos dos
  enfermedades: el juez no dice el hallazgo (NEGACIÓN, 2 de 8) y el juez lo
  dice y el sistema lo tira (LUGAR, 0 de 4 en la puerta). El plan solo cura la
  segunda, y mi predicción es que llevaría LUGAR de 0 de 8 a unas 4 de 8, sin
  mover NEGACIÓN. ¿Es correcto atacar primero la segunda, o hay una razón para
  que arreglar la copia cambie también la emisión? Y si son independientes,
  ¿cuál da más valor por euro gastado?

P8 — ¿QUÉ MIDO ANTES DE CONSTRUIR? En sólo lectura o en sombra, como propusiste
  en F-119. Y déjame tus predicciones por escrito, con su criterio de
  aceptación, para contarlas después como todas las demás.

7 · LO QUE NO TE PREGUNTO, PARA QUE NO GASTES AHÍ
No pregunto por el retrieval ni por el rerank: eso es F-119, está archivada sin
decisión, y hemos medido que en el corpus actual los seis documentos reales
llegan todos a candidato, así que no nos está costando hallazgos hoy. No
pregunto por tablas de Word ni por Excel. No pregunto por el coste del segundo
pase del juez: eso es F-120 P2 y sigue sin medir.

---

# (d) RESPUESTA RECIBIDA — F-121 · 07/10/2026 · DICTAMEN, ÍNTEGRO

⚠️ **DOS MARCAS, puestas aquí fuera para no tocar el texto:**

1. **LA SECCIÓN FINAL NO RESPONDE A LA CONSULTA.** Desde la línea que empieza «PREGUNTAS DEL
   DIRECTOR, HECHAS EN CONVERSACIÓN TRAS EL PRIMER DICTAMEN (07/10, 15:55–16:15)» —la
   106.ª línea del dictamen— hasta el final, son preguntas que el DIRECTOR hizo a Fable en
   conversación DESPUÉS del primer dictamen. No estaban en la consulta del arquitecto. Incluye
   D1, D2 y D3, el encargo de D2 y las «DECISIONES DE PLAN QUE QUEDAN ARCHIVADAS». Las
   respuestas a P1–P8 son lo que va antes de esa línea.
2. **PROCEDENCIA DE LO QUE DICE SOBRE LA FUNCIÓN DE CITAS DE ANTHROPIC.** Fable declara (línea
   7 del dictamen) que leyó HOY, 07/10/2026, la documentación oficial de esa
   función, y que lo que dice de ella viene de esa fuente, no de entrenamiento. **Es un dato
   externo con fecha, y puede cambiar**: las dos restricciones (no se combina con la salida
   estructurada por esquema; los documentos van como bloques de documento) y que el texto
   citado no cuente como tokens de salida se vuelven a leer en la documentación antes de
   construir nada sobre ellas. Lo que dice de Cohere, Google, Kira, Luminance, Harvey y
   Robin AI lo marca él mismo como de entrenamiento.

RESPUESTA DE FABLE — F-121 · LA PRUEBA LITERAL: EL JUEZ NO SABE COPIAR, Y LA PUERTA LO CASTIGA CON LA PÉRDIDA DEL HALLAZGO
Versión consolidada, 07/10/2026. Contiene el dictamen sobre las ocho preguntas del arquitecto y, al final, una sección con las preguntas que el director hizo en conversación después del primer dictamen, marcada como tal. Esa sección incluye dos decisiones de plan y un encargo que deben quedar archivados.

Procedencia

No veo el código. Todo dato del repositorio va con la procedencia de Code.
He leído hoy, 07/10/2026, la documentación oficial de la función de citas de Anthropic. Lo que diga de ella va con esa fuente. Lo que diga de otros sistemas del sector es de entrenamiento y va marcado con nombres buscables.

Veredicto

P1: el patrón del sector es uno solo con tres caras: el modelo señala un pasaje por identificador, el sistema extrae el texto, y un clasificador aparte decide si ese texto sostiene la afirmación. Nadie serio pide copia literal a un generador, y nadie pide offsets contados por el modelo. El proveedor del modelo lo ofrece de serie: la función de citas de la API es el plan de F-120, con garantía de puntero válido, sin coste de salida por el texto citado, y con los documentos distinguidos por índice. Hay que probarla antes de construir el segmentador propio.
P2: sigo firmando el plan con dos cambios: primero probar la función del proveedor, y construir el segmentador propio solo si ella no encaja. La huella idéntica entre días dice que la reescritura no es ruido, es la lectura estable del modelo de ese pasaje. Reintentar la copia nunca la arreglará; solo cambiar el contrato.
P3 a P6: granularidad frase, con rangos contiguos; el ancla sobra si el puntero lo garantiza el proveedor y es obligatoria si lo construís vosotros; una reparación y luego degradar, nunca descartar; y la atribución cruzada queda imposible por construcción con la función del proveedor.
P7 y P8: la puerta primero. Pero las dos enfermedades no son independientes: la regla "si no puedes copiar, no emitas" hace que emitir dependa de saber copiar. Quitar la copia debería mover también la emisión, y mi predicción va más alta que la vuestra.

P1 · Qué hace el sector

El patrón común, con sus nombres.

Verificación de hechos. El benchmark de referencia, FEVER (Thorne et al., 2018), identifica la evidencia por página y número de frase, no por texto copiado, y un clasificador de inferencia decide "sostiene", "refuta" o "no hay información suficiente". Esa tercera etiqueta es de primera clase, no un descarte. Buscables: "FEVER", "claim verification", "evidence selection", "natural language inference".
Respuesta con atribución. Los sistemas de respuesta con citas devuelven identificadores de pasaje sobre pasajes numerados que el sistema entregó, y la evaluación mide por separado si la cita existe y si sostiene la afirmación. Buscables: "attributed QA" (Bohnet et al., 2022), "ALCE" (Gao et al., 2023).
Los proveedores de modelos. De entrenamiento: Cohere devuelve citas con identificador de documento y tramo; Google ofrece "grounding" con citas en Vertex. Anthropic, leído hoy, abajo. Los tres coinciden: el modelo señala, el sistema extrae.
Revisión de contratos y due diligence. De entrenamiento: Kira, Luminance, Harvey, Robin AI. No piden al modelo que copie cláusulas; extraen la cláusula como tramo localizado en el documento y la interfaz la resalta.
Comparación de versiones. Para dos versiones del mismo documento, el estándar es alineación determinista y marcado de cambios. No es vuestro caso, pero existe y no lleva modelo.

Lo que no hace nadie: pedir offsets de caracteres contados por el modelo, ni pedir copia literal y descartar cuando no coincide.

La función de citas de Anthropic, leída hoy. Se activa por documento, y como la API extrae el texto citado directamente, las citas están garantizadas como punteros válidos a los documentos entregados. Lo que importa para vosotros:

El texto citado no cuenta como tokens de salida. Con un máximo de 3.928 tokens de salida por análisis sobre un techo de 4.096 por llamada, esto devuelve el margen que no tenéis.
Para texto plano, la API trocea en frases y el modelo puede citar una frase o encadenar varias consecutivas. Para documentos de "contenido personalizado", usa los bloques que vosotros entreguéis sin trocear más. Es vuestro segmentador, ya hecho.
Cada cita lleva el índice del documento y el rango de posiciones o de bloques. La atribución va dentro de la cita.
Dos restricciones: no se combina con la salida estructurada por esquema, y los documentos van como bloques de documento, no pegados en el prompt. Para .docx, convertir a texto plano. Encargo para Code: cómo devuelve hoy el juez sus hallazgos, si por JSON libre en el texto, por salida estructurada o por herramienta, y cómo entrega los documentos. De eso depende cuánto cambia llm-client.ts.
Funciona con caché de prompt sobre los bloques de documento, lo que enlaza con la medición pendiente de F-120 P2.

P2 · ¿Sigo firmando el plan?

Sí, con dos cambios y una lectura nueva.

Cambio 1: primero la función del proveedor. El plan de F-120 describe a mano lo que la API ya hace. Construirlo vosotros tiene sentido solo si la restricción de la salida estructurada bloquea o si la medición en sombra sale mal. Orden: probar en sombra, decidir, y solo entonces construir. El plan de F-120 queda archivado como plan B, porque es lo que se reconstruye si un día cambiáis de proveedor.

Cambio 2: el bucle de reparación casi desaparece. Si el puntero está garantizado, no hay etiqueta que no coincida con su ancla. Lo que queda por verificar es si el texto señalado sostiene el hallazgo. Eso es oficio del verificador de hallazgos, que ahora recibe texto real.

La lectura nueva: la huella idéntica. Que el modelo escriba la misma reescritura carácter por carácter el 05/10 y el 07/10 dice tres cosas:

No es ruido de muestreo. A temperatura 0,1 el modelo converge a su lectura de ese pasaje, y esa lectura funde dos frases porque así lo ha entendido. La fusión es correcta en contenido: es la evidencia de que entendió el hallazgo mejor de lo que supo copiarlo.
Reintentar la copia es inútil por construcción. Un bucle que pida "cópialo otra vez" obtendrá la misma reescritura. La reparación tiene que cambiar la tarea, no repetirla.
El juicio del arquitecto sobre la forma de la frase es plausible y se mide. Predicción de Fable, escrita antes: sobre todas las citas descartadas desde el 02/10, las que fallan tienen una mediana de longitud al menos un 50 % mayor que las que pasan, y más de la mitad contienen dos o más subordinadas o tres o más entidades nombradas.

P3 · Granularidad del segmento

Frase como unidad mínima, con rangos contiguos. Es lo que hace la API por defecto, y resuelve los tres miedos:

(a) Pedazo grande, cita ruidosa. Con la frase como mínimo, la cita del usuario es una o varias frases consecutivas, lo justo.
(b) Contradicción que necesita dos pedazos. Rangos: el modelo cita de la frase 12 a la 14. La API lo hace encadenando frases consecutivas. Si lo construís vosotros, el juez devuelve [A.12–A.14] y el validador exige contigüidad.
(c) La chuleta del final. Un rango es contiguo por definición. Cabeza en el resumen y cola 4.800 caracteres antes no pueden ser una cita; serían dos citas, y el sistema las ve como dos. Imposible por construcción. Y si el modelo cita la frase del resumen, es texto real del documento y vale.

Matiz para párrafos largos sin puntos: listas, encabezados, celdas. Ahí la frase no existe y conviene el modo de bloques propios. Encargo para Code: cuántos segmentos del corpus superan 400 caracteres sin punto.

P4 · ¿Hace falta el ancla?

Con la función del proveedor: no. El puntero está garantizado y el texto viene extraído. Lo que hay que comprobar es "¿ese pedazo sostiene el hallazgo?", y eso es el verificador.
Con segmentador propio: sí, obligatoria. La comprobación estándar es que el ancla sea prefijo normalizado del segmento. Si falla y la etiqueta es plausible, se busca el ancla en los dos segmentos vecinos a cada lado; si está, se usa ese y se registra "puntero corregido ±1"; si no, una reparación. Nunca descarte silencioso.

P5 · El bucle de reparación

Un reintento, no más, y con la tarea cambiada: se le muestra la etiqueta, el ancla y los segmentos candidatos, y se le pide elegir. Repetir la misma pregunta es el bucle inútil de la huella idéntica.
Si falla el segundo: el hallazgo no se tira. Se publica en un nivel inferior, "cita no verificada", visible como tal, o se enruta a "sospecha sin contrastar" de F-116. En FEVER esa tercera etiqueta existe por diseño. Buscables: "graceful degradation", "confidence tiers".
Contra el bucle silencioso: cada reparación y cada degradación escribe un contador con el motivo literal. El arnés los imprime.
Con la función del proveedor, este bucle casi no se ejecuta.

P6 · ¿Mata la atribución cruzada o la disfraza?

Con la función del proveedor: la mata. La cita lleva el índice del documento y el texto se extrae de ese documento. No existe "texto de A etiquetado como C". Lo que puede pasar es que el modelo cite C.7 queriendo decir A.12; entonces el texto extraído es el de C.7, no sostiene el hallazgo, y el verificador lo rechaza. El error deja de ser de atribución y pasa a ser de evidencia.
Con segmentador propio: detectable, no imposible. [C.7] con ancla de A.12 falla el prefijo y se repara. Residual despreciable, y se mide.
Hoy, sin el plan: el diagnóstico de "cruzada" solo observa. Dos de las cuatro citas cruzadas eran literales. Si la cita se encuentra literal en el otro documento del par, se intercambia la atribución y se conserva el hallazgo, con contador. Predicción: recupera al menos 2 de las 4 sin un solo falso nuevo.

P7 · El orden

La puerta primero, sí. Pero no son independientes. El prompt dice: si no puedes copiar una frase literal, no emitas. Eso hace que emitir dependa de saber copiar. NEGACIÓN se emite 2 de 8; no sabemos cuántas veces el juez la vio y se calló por esta regla. Con punteros, esa regla desaparece.

Predicciones de Fable, escritas antes, mismo universo de 8 pasadas:

LUGAR: publicada de 0 de 8 a 6 de 8 o más. La vuestra dice 4; la mía va más alta porque quitar la regla de copia debería subir también la emisión.
NEGACIÓN: emitida de 2 de 8 a 4 de 8 o más. Si no se mueve, eran independientes y se cuenta como fallo mío.
PLAZO: 8 de 8 se mantiene. Si baja, se revierte.
Falsos publicados: cero. Si aparece uno, se revierte.

Valor por euro: la puerta recupera hallazgos que el juez ya produce, con coste de salida menor. La emisión requiere lo de F-120 P2, más caro y sin medir. Primero lo que recupera lo que ya existe.

Tres cosas baratas antes del plan, en horas:

Cruzada literal → intercambiar atribución, no descartar.
Glosa entre corchetes → retirar corchetes y contenido antes de la puerta, con contador. Parche; se borra cuando entren los punteros.
Contar cuántas llamadas del juez terminan por tope de tokens de salida. Predicción: al menos una de las 8 pasadas de NOR-11 lo tocó.

P8 · Qué medir antes de construir

Sombra de la función de citas. Las mismas 8 pasadas de NOR-11, misma entrada, documentos como bloques, citas activadas, sin instrucción de copia. Comparar hallazgos emitidos, punteros válidos y texto citado. No toca producción. Aceptación: LUGAR con puntero válido en 6 de 8 o más; ningún puntero inválido.
Forma de la frase contra supervivencia. Sobre todos los descartes desde el 02/10. Predicción en P2.
Cruzadas literales. Cuántas citas descartadas se encuentran literales en el otro documento. Predicción: al menos 2 de 4 conocidas, y alguna más.
Tope de salida. Llamadas con parada por máximo de tokens desde el 02/10. Predicción: más de cero.
Las 11 citas descartadas, etiquetadas por el director. Pendiente desde F-120. Predicción: 7 o más verdaderas.
Coste de salida. Tokens de salida por llamada antes y en sombra. Predicción: en sombra baja más del 30 %.

PREGUNTAS DEL DIRECTOR, HECHAS EN CONVERSACIÓN TRAS EL PRIMER DICTAMEN (07/10, 15:55–16:15)

Esta sección no estaba en la consulta del arquitecto. Recoge tres preguntas del director, un encargo nuevo y dos decisiones de plan que deben quedar archivadas.

D1 · "¿Es la mejor forma, la más eficiente e inteligente?"

Para la puerta, sí: señalar en vez de copiar es la forma correcta, y usar la función del proveedor antes de construir la propia es la más eficiente. El sector entero converge en ella.
Es la mejor para la puerta, no para el producto entero. No arregla que el juez diga 3 contradicciones un día y 1 cinco minutos después. Esa cura es la extracción de afirmaciones por documento al indexar (F-118 tercer enfoque, F-120 P2 respuesta 3).
Precio no monetario: atar la cita a una función del proveedor. Lo cubre llm-client.ts, y el plan de F-120 queda archivado como plan B.
"Mejor" lo decide el arnés: seis predicciones escritas en P7 y P8.

D2 · "Esto funcionaba antes; ¿hemos roto algo o hemos olvidado lo hablado?"

Probablemente nunca funcionó de forma fiable. Antes del arnés, cada prueba era una pasada manual. Con tasas de 2 de 8 y 4 de 8, una pasada con las tres trampas era posible por suerte. La puerta de citas existe desde agosto, tirando hallazgos con una línea de log. El arnés no rompió nada: encendió la luz.
No se ha olvidado nada. F-116 destapó el corte del juez; el escalón 1 lo arregló y la detección subió de 1 a 3 de 3. F-120 señaló la copia; F-121 la mide. Cada consulta destapa la capa siguiente, que antes tapaba la de delante.
ENCARGO NUEVO PARA CODE, porque no me fío de mi explicación sin dato: en F-120 (06/10), cabeza y cola de una cita eran 15 caracteres normalizados (coincidencia-de-cita.ts:163); en F-121 (07/10), son el mínimo entre 20 caracteres y el 40 % de la cita. Alguien tocó la puerta entre las dos consultas, y hacerla más estricta tira más citas. Leer el historial de ese fichero: qué cambió, cuándo y en qué commit. Y buscar en el registro de trampas si existe alguna fecha anterior con las tres de NOR-11 publicadas en varias pasadas seguidas. Si existe, algo se rompió y se busca el cambio exacto. Si no existe, nunca funcionó de forma fiable. Predicción de Fable: lo segundo.

D3 · "El cambio de un trimestre, ¿lo arregla todo sí o sí? ¿Y son tres meses de verdad?"

No lo arregla todo, y no se hace para el MVP. Arregla una cosa: la inestabilidad del juez entre pasadas. No arregla la elección de documentos (F-119), las tablas de Word, la cola ni la seguridad.
"Trimestre" fue una estimación imprecisa con vuestro ritmo; podría ser menos. Da igual: no es condición del MVP. Se hace cuando haya un cliente real cuyos falsos negativos lo pidan, con dinero de clientes.

DECISIONES DE PLAN QUE QUEDAN ARCHIVADAS

Plan para cerrar el frente de calidad del análisis antes de enseñar el producto:

Esta semana, horas: cruzada literal se corrige en vez de tirarse; corchetes fuera antes de la puerta; conteo de paradas por tope de salida; el encargo de D2 sobre la puerta.
Semana siguiente: prueba en sombra de la función de citas del proveedor con las 8 pasadas de NOR-11. Si las predicciones de P7 y P8 se cumplen, se activa tras interruptor. Si no encaja por la salida estructurada, plan B de F-120 con segmentador propio.
En paralelo, lo barato de F-120 P2: el juez entrega la lista de datos compartidos que comprobó, para que las pérdidas dejen rastro; y se mide el coste real de la segunda pasada con caché de prompt. Si cuesta un cuarto o menos, el MVP lleva dos pasadas unidas con verificador detrás, a precio conocido, mientras no exista la solución estructural.

Criterio de "cerrado para enseñar", legible en el arnés: cada trampa sembrada detectada y publicada en 4 de 5 pasadas o más; cero falsos publicados; coste por análisis escrito.

Lo que queda fuera del MVP, con fecha de revisión "primer cliente": extracción de afirmaciones por documento al indexar.

---

# (e) PREDICCIONES REGISTRADAS, PENDIENTES DE MEDICIÓN

Escritas antes de medir. Se cuentan cuando haya medición, como toda predicción de esta casa.
**Sin veredicto.** Universo de las cuatro primeras: las 8 pasadas de NOR-11 (4 del 06/10 y 4
del 07/10), repetidas con el cambio.

- **P-F121-1** · LUGAR pasa de 0 de 8 publicada a 6 de 8 o más.
  - *Aceptación*: 6 o más.
  - ⚠️ *Predicción enfrentada*: el arquitecto dijo 4 de 8 (consulta, P7). Se cuentan las dos.
  - *Estado*: sin medir.
- **P-F121-2** · NEGACIÓN pasa de 2 de 8 emitida a 4 de 8 o más.
  - *Aceptación*: 4 o más.
  - Fable declara que si NO se mueve, las dos enfermedades eran independientes y lo cuenta
    como fallo suyo.
  - *Estado*: sin medir.
- **P-F121-3** · PLAZO se mantiene en 8 de 8.
  - *Aceptación*: 8 de 8. Si baja, se revierte.
  - *Estado*: sin medir.
- **P-F121-4** · Falsos publicados: cero.
  - *Aceptación*: cero. Si aparece uno, se revierte.
  - *Estado*: sin medir.
- **P-F121-5** · En sombra, los tokens de salida bajan más del 30 %.
  - *Aceptación*: bajada mayor del 30 %, por llamada, antes frente a en sombra.
  - *Estado*: sin medir.
- **P-F121-6** · Al intercambiar la atribución de las cruzadas literales se recuperan al
  menos 2 de las 4 conocidas, sin un solo falso nuevo.
  - *Aceptación*: 2 o más de 4, y cero falsos nuevos.
  - *Estado*: sin medir.
- **P-F121-7** · Al menos una de las 8 pasadas de NOR-11 tocó el tope de tokens de salida.
  - *Aceptación*: una o más.
  - *Estado*: **FALSA**, resuelta el 07/10 sin instrumentar. SQL_B349 da, desde el 02/10,
    máximo 3.928 tokens de salida POR ANÁLISIS ENTERO y 0 filas por encima de 4.096, con los
    dos controles a cero. Como cada fila es la suma de todas las llamadas del análisis y la
    parte nunca es mayor que el total, NINGUNA llamada suelta pudo pararse por el tope. Las 8
    pasadas de NOR-11 caen dentro de esa ventana. Lo detectó Code al archivar. *(Veredicto del
    arquitecto, 07/10/2026.)*
  - **Consecuencia**: la ceguera de B.349 es real pero NO está disparando hoy. El contador de
    stop_reason (B.356) se aparca hasta que se toque algo que aumente la salida, junto con el
    salto de maxOutputTokens de 4.096 a 8.192 de B.360.
- **P-F121-8** · Entre las citas descartadas desde el 02/10, las que fallan tienen una mediana
  de longitud al menos un 50 % mayor que las que pasan, y más de la mitad llevan dos o más
  subordinadas o tres o más entidades nombradas.
  - *Aceptación*: las dos condiciones.
  - *Estado*: sin medir.
- **P-F121-9** · Nunca existió una fecha con las tres trampas de NOR-11 publicadas juntas en
  varias pasadas seguidas.
  - *Aceptación*: no aparece ninguna fecha así en el registro de trampas.
  - *Estado*: sin medir.
- **P-F121-10** · Las 11 citas descartadas que etiquetará el director: 7 o más verdaderas.
  - *Aceptación*: 7 o más.
  - Viene de F-120 y sigue pendiente.
  - *Estado*: sin medir.

---

# (f) PRECISIONES SOBRE EL DICTAMEN

**Del arquitecto (07/10/2026).** Fable sospecha, en su D2, que la puerta de citas se endureció
entre F-120 y F-121, de 15 caracteres a min(20, 40 %). El arquitecto cree que es una falsa
alarma suya: el 06/10 se corrigió en B.332 que ese «15» no era de la puerta sino de
`findTolerant` (B.326), y Fable estaría leyendo el error viejo de la ficha como evidencia de un
cambio de código. ~~**Queda como DUDA ABIERTA** hasta que se lea el historial del fichero, que va
en otro encargo del mismo día.~~
- ✅ **PRÁCTICAMENTE CERRADA (arquitecto, 07/10/2026), con lo que Code vio al archivar**: la
  línea `:163` que cita Fable es la SALIDA `cabeza_sin_cola`, no el cálculo; el cálculo está en
  `:155-156` y es min(20, 40 %). **Fable citó la etiqueta, no la fórmula.** Queda pendiente sólo
  el historial del fichero, que va en otro encargo.
- *Nota de Code, sin leer el historial:* la corrección de B.332 entró en `bd5fa647` (06/10), cuyo
  mensaje dice «la cabeza y la cola de la puerta son min(20, 40 %), no 15 (el 15 es del
  editor)». Es un puntero para ese encargo, no su respuesta.

**Notas de Code (07/10/2026) sobre lo que no cuadra con el repositorio.** El texto de (c) y (d)
no se ha tocado; esto lo deja el arquitecto.
1. **«Esto devuelve el margen que no tenéis»** (dictamen, P1). El 3.928 es la SUMA de todas las
   llamadas de un análisis, no una llamada (B.360; la consulta lo dice en su punto 4). Ninguna
   llamada del juez está cerca de su techo de 4.096. Lo que el margen estrecho dice es otra
   cosa: que el total del análisis se acerca a lo que cabría en UNA llamada.
2. **P-F121-7 parece decidible hoy con lo que ya está medido.** Por la cota superior de
   SQL_B349 (B.349, B.360): desde el 02/10, ninguna fila de `llm_usage` de análisis rápido pasa
   de 3.928 tokens de salida, y cada fila es la suma de las llamadas de su análisis. Para que una
   llamada se pare por tope tendría que llegar a 4.096 ella sola, y ninguna suma llega. Las 8
   pasadas de NOR-11 son del 06 y el 07/10, dentro de ese universo. **Si se acepta la cota, la
   predicción ya ha fallado.** Las reservas son las del propio SQL: la fila de un análisis cuya
   escritura falló no está (límite 3), y antes del cambio salían 80 filas para 80 análisis
   guardados. El veredicto no se escribe aquí: lo decide el arquitecto. → **Decidido el 07/10: FALSA** (ver (e)).
3. **«DOS de esas cuatro eran literales» (consulta, punto 3a) es un error que viene de Code, y
   Fable construyó sobre él.** La comparación de Code del 06/10 dio **TRES** literales de las cuatro
   mal atribuidas; el «DOS» era del borrador de F-120 y Code lo copió en B.358 el 07/10, de donde
   pasó a esta consulta. B.358 está corregida (07/10/2026). Afecta a lo que Fable deduce: su
   «Dos de las cuatro citas cruzadas eran literales» (P6) y la predicción P-F121-6 («al menos 2 de
   las 4») se escribieron sobre el dos. La predicción no se toca; se cuenta contra el dato real.
4. **El orden de la puerta que describe la consulta** («(1) literal; (2) normalizada; (3) cabeza y
   cola») cuadra con `lib/analysis/coincidencia-de-cita.ts` leído hoy: cabeza y cola son
   `Math.min(20, Math.floor(normNeedle.length * 0.4))` (`:155-156`). La `:163` que cita Fable es
   hoy la salida `cabeza_sin_cola`, no un 15. Esto es el fichero de hoy, no su historial.

---

# (g) MEDICIONES CANDIDATAS — las que propone Fable, con su estado

| # | Medición | Predicción | Estado (07/10/2026) |
|---|---|---|---|
| 1 | **Sombra de la función de citas**: las mismas 8 pasadas de NOR-11, documentos como bloques, citas activadas, sin instrucción de copia | P-F121-1 a 5 | **NO INICIADA** (plan: la semana siguiente) |
| 2 | **Forma de la frase contra supervivencia**, sobre todos los descartes desde el 02/10 | P-F121-8 | **NO INICIADA** |
| 3 | **Cruzadas literales**: cuántas citas descartadas se encuentran literales en el otro documento | P-F121-6 | **NO INICIADA** |
| 4 | **Tope de salida**: llamadas con parada por máximo de tokens desde el 02/10 | P-F121-7 | ✅ **EN MARCHA**: es el encargo de instrumentación del 07/10 (contar la parada por tope; B.349, B.356). Ver (f), nota 2 |
| 5 | **Las 11 citas descartadas, etiquetadas por el director** | P-F121-10 | **NO INICIADA** (pendiente desde F-120) |
| 6 | **Coste de salida**: tokens de salida por llamada, antes y en sombra | P-F121-5 | **NO INICIADA** |

---

# (h) ENCARGOS DE FABLE, CONTESTADOS POR CODE

**1 · Cómo devuelve hoy el juez sus hallazgos y cómo entrega los documentos** (dictamen, P1).
✅ **CONTESTADO por Code el 07/10/2026, por lectura de código.**
- **Por JSON libre en el texto.** El juez llama a `callLLMJson` (`lib/analysis/judge.ts:858`), que
  es `callAnthropicJson` (`lib/analysis/llm-client.ts:4`). Ésta añade al prompt un sufijo que pide
  «EXCLUSIVAMENTE un objeto JSON válido» (`lib/llm/anthropic-client.ts:303`) y lee el texto de la
  respuesta con `tryParseJson` (`:287-297`).
- **No hay salida estructurada por esquema ni herramientas.** La petición lleva sólo `model`,
  `max_tokens`, `temperature`, `messages` y, si lo hay, `system` (`buildPayload`, `:87-100`). Las
  herramientas sólo las usa la llamada del agente (`:376` en adelante).
- **Los documentos van pegados en el prompt**, en un único mensaje de usuario, cada uno entre
  comillas triples tras su nombre: «DOCUMENTO NUEVO» con `pareja.textoAnalizado` y «DOCUMENTO
  EXISTENTE» con `pareja.bloqueCandidato` (`judge.ts:753-764`). No van como bloques de documento.
- Consecuencia para la restricción que cita Fable: hoy no hay salida estructurada con la que
  chocar; lo que cambiaría es cómo se entregan los documentos y cómo se leen las citas.

**2 · Cuántos segmentos del corpus superan 400 caracteres sin punto** (dictamen, P3).
**NO CONTESTADO.**

**3 · El historial de la puerta y el registro de trampas** (dictamen, D2). **NO CONTESTADO**: va
en otro encargo del 07/10. Ver (f).
