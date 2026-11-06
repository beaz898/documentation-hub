---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-130
Asunto: qué decide lo que un juez escribe, y por qué un hallazgo inferencial sale 2 de 7 y uno directo 7 de 7
Fecha de envío: 28/10/2026 · Fecha de respuesta: 28/10/2026 (versión consolidada, con las preguntas del director)
Fuente: los dos textos llegaron pegados en el encargo del arquitecto del 28/10/2026 y se archivan sin resumir y sin
        corregir nada (tampoco la tabla de P2 del dictamen, que llegó aplanada en una línea). La consulta en (c) y el
        dictamen en (d). Los dos encargos anteriores remitían a ellos sin traerlos (regla del protocolo: «un encargo que
        dice "el contenido literal que te pasa el director" sin llevarlo dentro no es un encargo»).
⚠️ Dónde: se archivó primero en dos ficheros sueltos en `claude/`, por el encargo; el 29/10 el arquitecto pidió el
        formato de la casa y quedó aquí, en uno. Los cuerpos se movieron byte a byte (mismas huellas).
ATRIBUCIÓN: la sección final del dictamen, «PREGUNTAS DEL DIRECTOR», son seis preguntas (D1 a D6) que hizo EL
        DIRECTOR directamente a Fable, en conversación y sin pasar por el arquitecto, el 28/10 entre las 15:45 y las
        19:45. De ellas salen la decisión, el plan exacto, su encaje con lo ya planeado y la comprobación de coherencia.
⚠️ Precedente que deja la consulta (arquitecto, 28/10): su sección 0 NO LE DA A FABLE NUESTRAS OPCIONES, porque
        anclarle sale más caro que lo que informan.
⚠️ LA LECTURA DEL ARQUITECTO NO ESTÁ AQUÍ: va al estado vivo (`claude/Estado_Y_Pendientes_14-10-2026.md`, sección de
        F-130), incluida su discrepancia con el «hueco obligatorio de respuesta por pareja» de D3 y del plan, marcada
        como suya.
Estado: ARCHIVADA CON DICTAMEN · se construye la segunda pasada por parejas, si E3 da 6 de 7 o más. Nada construido;
        las herramientas temporales de la semana 0 están en `app/api/admin/medida-f130/`.
        Cotejo de integridad, 28/10/2026, con el método de F-121: sha256 del texto tal como queda archivado (saltos
        LF, sin salto final), 16 primeros hexadecimales; caracteres = puntos de código; palabras = trozos separados
        por espacio en blanco. Ninguno de los dos textos tiene espacios que no sean ASCII. Los 60 primeros y últimos,
        con escapes JSON.
        · CONSULTA, (c): huella 24317c18a3aaa68f · 9932 caracteres (10424 bytes UTF-8) · 100 líneas · 62 no vacías ·
          1763 palabras.
          60 primeros: "CONSULTA A FABLE · F-130 · QUÉ DECIDE LO QUE UN JUEZ ESCRIBE"
          60 últimos:  " de los prompts del juez y del verificador si los necesitas."
        · DICTAMEN, (d): huella 6fb8f9bee7d97ddf · 23052 caracteres (23716 bytes UTF-8) · 141 líneas · 71 no vacías ·
          4053 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-130 · QUÉ DECIDE LO QUE UN JUEZ ESCRI"
          60 últimos:  "50 análisis): ni “solo pasada 1” ni “solo pasada 2” es cero."
        · ADENDA, (e): lo enviado a Fable el 29/10 (el anexo de prompts, huella e579d3d0e2fc1a2c, y la línea de cubierta del
          director) y su respuesta sobre E3. Respuesta: huella
          90df305f7c0ad1f0 · 1017 caracteres · 7 líneas.
          Segundo mensaje: huella 01d46b3cb421d487 · 1371 caracteres · 6 líneas.
        · ADENDA, (f), 31/10: la respuesta de Fable con la línea base medida. Lo enviado, SIN ARCHIVAR (no ha llegado a
          Code). Respuesta: huella 1834bd56ddea1667 · 2388 caracteres (2446 bytes UTF-8) · 7 líneas · 6 no vacías ·
          494 palabras.
          60 primeros: "a) ¿Choca? No. Lo que sí hay es un error mío que vuestra sec"
          60 últimos:  " la curva que no corrimos, y es la que hay que correr ahora."
        · ADENDA, (g), 02/11: el quinto conflicto, los tres niveles y la prelación. Lo enviado y la respuesta definitiva
          (15:05), los dos literales. La versión anterior de hoy y las preguntas D1 a D9 del director, SIN ARCHIVAR (no han
          llegado a Code). Respuesta: huella 56a18f52599e9b79 · 15056 caracteres (15302 bytes UTF-8) · 156 líneas · 105 no vacías · 2695 palabras.
---

(c) LA CONSULTA ENVIADA — literal

CONSULTA A FABLE · F-130 · QUÉ DECIDE LO QUE UN JUEZ ESCRIBE, Y POR QUÉ UN HALLAZGO INFERENCIAL SALE 2 DE 7 Y UNO DIRECTO 7 DE 7

════════ 0 · CÓMO QUEREMOS QUE NOS CONTESTES ════════

Tómate el tiempo que haga falta. No queremos que nos confirmes una solución: queremos la mejor que exista, y después nosotros vemos si encaja en lo que tenemos o si hay que cambiar lo que tenemos.

A propósito NO te contamos qué soluciones se nos han ocurrido. Son obvias y lo único que harían es anclarte en una de tres puertas que hemos elegido nosotros. Si te sirven de algo, las deduces de los datos.

Y NO AJUSTES LA RESPUESTA A NUESTRA ARQUITECTURA. Si lo correcto es rehacer una parte, o toda, dilo. Si lo correcto es que esto no se puede hacer bien hoy, dilo también. Preferimos una respuesta caras y verdadera a una que nos encaje.

════════ 1 · QUÉ ES EL SISTEMA ════════

SaaS de análisis de documentación corporativa. Cuando entra un documento nuevo, se compara contra el corpus ya indexado y se publican los conflictos encontrados, para que una persona los revise.

La tubería del análisis rápido, en orden:
· RECUPERACIÓN: vectorial, trae candidatos.
· RERANK: deja 2 documentos candidatos de 6.
· JUEZ: UNA llamada por pareja (documento nuevo + candidato). Hoy, con la ventana de 150.000 caracteres, van los DOS DOCUMENTOS ENTEROS. Devuelve UNA LISTA en una sola respuesta: contradicciones, inconsistencias menores, solapamientos y exclusivos del nuevo. El prompt pide «máximo 10 contradicciones, 5 inconsistencias menores, 10 solapamientos y 10 exclusivos».
· PUERTA DE CITAS: cada cita tiene que ser literal de lo que se le entregó al juez; si no, el hallazgo muere.
· VERIFICADOR: llamada aparte, por lotes de 15 hallazgos; sólo pasa lo «confirmado».
· SÍNTESIS y publicación.

Modelos: el juez es claude-haiku-5-5, max_tokens 16.000, esfuerzo de razonamiento «medium», y la temperatura NO se envía (5.5 sólo admite 1). El verificador es claude-haiku-4-5 a temperatura 0,1, max_tokens 2.048. Coste actual: unos 0,015 $ por análisis.

════════ 2 · EL CASO ════════

Corpus de prueba de una red de clínicas dentales. Dos documentos: NOR-10 (protocolo de esterilización, 66.801 caracteres) y CLI-12 (manual de calidad, 55.135). Suman 121.936 y entran ENTEROS en la misma llamada.

CUATRO CONFLICTOS REALES ENTRE ELLOS. Tres son directos:
· A — quién es el responsable último: NOR-10 dice «el Director Clínico», CLI-12 dice «el Coordinador de Calidad del centro, no el Director Clínico».
· B — periodicidad del control biológico: «semanalmente» frente a «periodicidad mensual».
· C — caducidad del material estéril: «6 meses» frente a «12 meses».

El cuarto exige inferencia:
· D — NOR-10 §2.4: «Cada clínica cuenta con un Coordinador de Calidad, figura que PUEDE RECAER EN EL PROPIO DIRECTOR CLÍNICO o en otro profesional designado por él.»
  CLI-12 §3.1: «Esta asignación responde a un criterio deliberado de calidad: SEPARAR la responsabilidad de un proceso crítico de seguridad del paciente DE LA PERSONA QUE, EN SU ROL DE DIRECTOR CLÍNICO, gestiona simultáneamente la agenda asistencial.»

Las dos frases pueden ser verdaderas a la vez. Ninguna le da otro valor a un dato de la otra: una habla de qué cargos puede acumular una persona, la otra explica por qué se separó una responsabilidad. El conflicto exige cuatro pasos: el primero PERMITE un estado, el segundo enuncia un PRINCIPIO que ese estado destruye, el principio no se enuncia como obligación, y la incompatibilidad nace de juntarlos.

Y hay un quinto conflicto, NO SEMBRADO, que el sistema encontró solo y que tiene la forma FÁCIL de la misma familia: NOR-11 obliga al Coordinador de Calidad a revisar trimestralmente su propia área; CLI-12 dice que «no como auditor de su propia área». Mismo sujeto, mismo verbo, mismo objeto, modalidad opuesta.

════════ 3 · LOS NÚMEROS, MEDIDOS ════════

A, B y C: 100 % de las pasadas, en todas las tandas. Quince de quince.

D, en tres estados del sistema:
· Con la definición de contradicción original («es imposible que ambas sean verdaderas»): 0 de 5.
· Con una categoría nueva de conflicto normativo añadida al prompt: 1 de 8, y SIN la etiqueta.
· Con esa categoría corregida para que cubra los principios: 2 de 7, UNA de ellas con la etiqueta.

El caso fácil de la misma familia: hallado 5 de 13, etiquetado 1 de esas 5.

De los tres conflictos normativos que el juez llegó a etiquetar en las dos tandas, EL VERIFICADOR CONFIRMÓ DOS Y MATÓ UNO (lo descartó como «las dos reglas se pueden cumplir a la vez»).

Y la varianza, con entrada idéntica: 4, 6, 5, 6, 5, 4 y 4 hallazgos en siete análisis del mismo documento contra el mismo corpus. Siempre los mismos tres directos; los que bailan son los demás.

Cuando D sale, sale en cuarto o quinto lugar de la lista. Nunca primera. (El orden es el que escribió el juez: lo hemos comprobado, nuestra tubería conserva posiciones.)

════════ 4 · LO QUE HEMOS DESCARTADO, Y CÓMO ════════

· NO ES FALTA DE SITIO EN LA RESPUESTA. El techo es 16.000 tokens; la salida del juez en esa pareja fue de 5.306 a 7.683, entre el 33 % y el 48 %. El máximo de toda la tanda, 9.074, un 57 %.
· NO ES EL TOPE DE 10 DEL PROMPT. El juez emitió entre 4 y 6 contradicciones.
· NO SE PIERDE EN NUESTRA TUBERÍA. Reconstruido desde el registro: lo emitido es exactamente lo publicado. Cascada 0, puerta de citas 0, frontera 0. Censamos los diecisiete sitios del código donde un hallazgo puede perderse y ninguno actuó.
· NO ES DISPONIBILIDAD. Las dos mitades de D estuvieron dentro de lo entregado al juez en las ocho pasadas de una tanda y las siete de la otra, con los dos documentos enteros.
· NO ES QUE CITE LA MITAD EQUIVOCADA. Cuando D sale, cita la frase del principio. §3.5, la otra mitad candidata, no se citó NI UNA VEZ en quince pasadas.

Conclusión: el juez tiene las dos mitades delante, con nueve mil tokens de sitio de sobra, sin ningún tope que le apriete, y escribe D en dos de siete intentos.

════════ 5 · LAS PREGUNTAS, Y EL MECANISMO ANTES QUE LA SOLUCIÓN ════════

Lo pedimos en este orden a propósito: cada vez que hemos arreglado sin entender, el arreglo ha costado un día y ha movido la tasa unos puntos.

P1 · EL MECANISMO. ¿QUÉ DETERMINA LO QUE UN MODELO ESCRIBE cuando se le pide una lista de hallazgos sobre dos documentos largos? ¿Existe algo parecido a una prioridad, y quién la fija: el orden del texto, la saliencia léxica, la facilidad de la comparación, el orden en que se genera la respuesta, otra cosa? Queremos la explicación real, o la honesta imposibilidad de darla.

P2 · POR QUÉ UNOS SÍ Y OTROS NO. A, B y C están quince de quince. D está dos de siete. Las cuatro son contradicciones reales, las cuatro están igual de presentes en el texto entregado, y el modelo no se queda sin sitio ni sin cupo. ¿QUÉ PROPIEDAD DE D HACE QUE SE ESCAPE? Si es «requiere inferencia de varios pasos», ¿por qué eso se traduce en una probabilidad baja y no en un error sistemático? Un sesgo al 0 % o al 100 % se entiende; un 29 % es lo que no entendemos.

P3 · LA VARIANZA. ¿De dónde sale que la misma entrada dé 4, 6, 5, 6, 5, 4 y 4? ¿Cuánto es muestreo a temperatura 1 y cuánto es otra cosa? ¿Es una magnitud que se pueda acotar y predecir, o ruido que sólo se compensa repitiendo? Y si fuera sólo muestreo: ¿por qué los tres directos no bailan nunca?

P4 · EL ESTADO DEL ARTE, A FINALES DE OCTUBRE DE 2026. ¿Cómo se está resolviendo esto hoy en sistemas que tienen que ser EXHAUSTIVOS sobre documentos largos y no sólo plausibles? Qué técnicas hay, cuáles han demostrado funcionar, cuáles se han abandonado y por qué. Y si la respuesta pasa por capacidades de los modelos actuales que no estamos usando, dilas por su nombre: llevamos el juez con esfuerzo «medium» sin haberlo tocado nunca.

P5 · ¿ES CORRECTA LA FORMA QUE TENEMOS? Una sola llamada, los dos documentos enteros, una lista de vuelta. Si hoy nadie construye así un sistema que deba ser exhaustivo, dilo claro.

P6 · Y LA PREGUNTA DE DISEÑO, QUE ES DEL DIRECTOR: ¿CÓMO SE CONSIGUE QUE UN HALLAZGO QUE EXIGE INFERENCIA SEA TAN FIABLE COMO UNO DIRECTO, SIN SABER DE ANTEMANO CUÁL VA A SER Y SIN MONTAR UNA PREGUNTA DEDICADA POR CLASE DE HALLAZGO?

Esta última restricción es de diseño, no de gusto: nuestros clientes tendrán conflictos que no hemos imaginado. Un prompt por clase de error significa un sistema que sólo encuentra lo que alguien ya sabía que había que buscar. No queremos un catálogo de parches, y lo que nos pasa a nosotros le está pasando a cualquiera que haga esto.

════════ 6 · LO QUE HEMOS HECHO MAL, PARA QUE NO LO SUPONGAS BIEN ════════

· Dos iteraciones del texto del prompt del juez, dos días de trabajo. La primera llevó D de 0 a 1 de 8; la segunda a 2 de 7.
· Una hipótesis de truncamiento de la respuesta que el arquitecto anunció con una cifra de max_tokens que no había leído. Muerta con datos.
· Y la temperatura: el arquitecto presentó como hallazgo que corríamos a 1 creyendo estar a 0,1, cuando esa limitación de Haiku 5.5 estaba escrita en nuestros propios documentos desde nueve días antes.

════════ 7 · QUÉ CONSIDERARÍAMOS UNA RESPUESTA ════════

Por orden de lo que más nos sirve:
· EL MECANISMO, aunque no traiga solución. Entender por qué pasa vale más que un parche que funcione sin saber por qué, porque lo segundo ya lo hemos hecho dos veces.
· Que el problema está donde no estamos mirando, y cuál es el experimento que lo distingue.
· O que esto es un límite conocido de los modelos de esta familia y la respuesta honesta es decirle al usuario que el análisis no es exhaustivo. Eso cambiaría el producto y no el código, y lo preferimos a venderlo como exhaustivo sin serlo.

Y si la respuesta exige datos que no tenemos, dinos cuáles y los medimos: tenemos el corpus caracterizado, el registro por llamada y la capacidad de lanzar tandas de cinco pasadas en diez minutos. Podemos mandarte los textos literales de los prompts del juez y del verificador si los necesitas.

---

(d) EL DICTAMEN DE FABLE — literal

RESPUESTA DE FABLE — F-130 · QUÉ DECIDE LO QUE UN JUEZ ESCRIBE, Y POR QUÉ UN HALLAZGO INFERENCIAL SALE 2 DE 7 Y UNO DIRECTO 7 DE 7 Versión consolidada, 28/10/2026. Contiene el dictamen sobre las seis preguntas del arquitecto y, al final, una sección con las preguntas del director hechas en conversación después del primer dictamen, marcada como tal, que fija la decisión, el plan exacto, su encaje con lo ya planeado y la comprobación de coherencia.

Frentes decididos y sin commit desde hace más de 7 días: F-119 fase 2, 28 días. Hoy tiene menos urgencia porque con 150.000 el candidato entra entero y no hay selección; sigue viva para corpus donde no quepa. Lo nombro porque la regla lo exige.

Alcance, dicho con precisión porque esta consulta lo necesita

No veo el código ni el modelo por dentro. Lo que sigue sobre el mecanismo viene de lo que se sabe públicamente de cómo generan texto los modelos autorregresivos y de resultados empíricos con nombre. Va marcado como entrenamiento. No conozco claude-haiku-5-5. Mi conocimiento termina a mediados de 2026 y ese modelo no está en él. El mecanismo que describo es de la familia, no de ese modelo; donde algo pueda depender de la versión, lo digo. Pedís el mecanismo antes que la solución. Lo doy en ese orden, y la solución que sale de él no es un parche de prompt: es cambiar la forma de la pregunta.

Veredicto, en cinco líneas

Un modelo no tiene una lista de prioridades: tiene, en cada paso, una probabilidad de empezar el siguiente hallazgo sobre cada cosa que ha notado, y una probabilidad creciente de cerrar la lista. Lo que sale es lo que supera ese umbral móvil antes del cierre. A, B y C son coincidencias de patrón: mismas palabras, negación o dos valores en el mismo sitio. Su probabilidad está muy por encima del umbral en cada muestra. D no comparte superficie, no lleva marcador de incompatibilidad, y comparte actores con A, que ya está escrita y la cubre. Está cerca del umbral, y una cosa cerca del umbral a temperatura 1 es una moneda cargada: 29 %. La varianza de 4 a 6 es la franja de hallazgos cerca del umbral. Se acota midiendo cuántos distintos aparecen al acumular muestras; no se elimina. Nadie serio construye exhaustividad como “una llamada, dos documentos, una lista abierta”. La exhaustividad se construye enumerando unidades y haciendo preguntas cerradas sobre cada una; la lista abierta se usa como primera pasada, no como garantía. La respuesta al director: un hallazgo inferencial es tan fiable como uno directo cuando la pregunta es cerrada y sobre una pareja dada. La fiabilidad no está en el tipo de hallazgo; está en la forma de la pregunta. Y la enumeración de parejas no necesita saber la clase del conflicto: necesita saber que dos pasajes nombran las mismas cosas.

P1 · El mecanismo

Lo que sé, en el orden en que actúa. Todo de entrenamiento, con nombre donde lo hay.

1 · No hay cola de prioridad; hay un umbral móvil. El modelo escribe la lista un token tras otro. En cada punto donde puede empezar un hallazgo nuevo, elige entre “empezar uno sobre X”, “empezar uno sobre Y”, o “pasar a la siguiente sección de la respuesta”. Cada opción tiene una probabilidad condicionada a todo lo anterior: el prompt, los documentos, y lo que ya ha escrito. No existe “la lista completa en la cabeza y luego la escribe”: la lista se decide mientras se escribe. Buscable: “autoregressive generation”, “sampling”.

2 · Qué sube la probabilidad de un hallazgo. Cuatro cosas, de más fuerte a más débil:

Coincidencia de superficie entre las dos mitades. Las mismas palabras en los dos documentos hacen que la atención encuentre la pareja en un solo salto. Es la señal más fuerte que existe para un modelo. Buscable: “attention”, “lexical overlap”. Un marcador de incompatibilidad local. “No el Director Clínico”, “6 meses” frente a “12 meses”. El modelo ha visto millones de pares así en su entrenamiento de inferencia textual. Buscable: “natural language inference”, “contradiction detection”. La forma que el prompt define y ejemplifica. El esquema y los ejemplos fijan el prototipo. Lo que se parece al prototipo sale; lo que no, compite en desventaja. La cercanía en el texto y la posición. Buscable: “lost in the middle” (Liu et al., 2023).

3 · Qué baja la probabilidad, y esto es lo que no estáis mirando.

La cobertura por lo ya escrito. Un modelo que ha escrito un hallazgo sobre “Director Clínico frente a Coordinador de Calidad” baja la probabilidad de escribir otro sobre las mismas dos figuras, porque está entrenado para no repetirse. D comparte actores con A. Y vuestro dato de F-129 lo apunta: la mitad de D en CLI-12 remite al apartado 3.1, que es la mitad de A. Hipótesis principal: A suprime a D. Esto explica también que D, cuando sale, salga cuarta o quinta. El cierre de la lista. Con cada hallazgo escrito sube la probabilidad de pasar a la siguiente sección. El tope de 10 es un techo; el prior del modelo sobre “cuántos hallazgos suele tener una lista así” es de 4 a 6, y es el que manda. La forma explicativa del principio. “Esta asignación responde a un criterio deliberado de calidad: separar...” explica un motivo, no ordena. Para el prototipo de contradicción, una justificación no es un lado.

4 · El razonamiento previo cambia el juego, pero no lo elimina. Con esfuerzo “medium”, el modelo explora algo antes de escribir. Un conflicto que exige juntar una permisión de la sección 2.4 con un principio de la 3.1 solo se encuentra si la exploración toca esa pareja. Con esfuerzo alto, más veces. Nunca siempre, porque la exploración también es muestreada. Buscable: “extended thinking”, “reasoning effort”, “test-time compute”.

Lo que no puedo daros: una fórmula que prediga 29 %. Lo que sí se puede es medir en qué condiciones sube y baja.

P2 · Por qué unos sí y otros no, y por qué 29 % y no 0 o 100

Propiedad A D Mismas palabras en ambos lados sí: “responsable último”, “Director Clínico” no: “puede recaer” frente a “separar... de la persona” Marcador de incompatibilidad en el texto sí: “no el Director Clínico” no: “separar” es un verbo de propósito Mismo dato con dos valores sí no: una permisión y un principio Forma de la frase normativa explicativa Actores compartidos con otro hallazgo ya emitido es el primero sí, con A Puente necesario fuera del texto ninguno uno

Cada fila le quita probabilidad. Ninguna la pone a cero. Por eso 29 % y no 0: es una suma de penalizaciones que deja la señal cerca del umbral. Y por eso no es 100: el umbral móvil y el cierre la cortan la mayoría de las veces.

“¿Por qué inferencia se traduce en probabilidad baja y no en error sistemático?”: porque la inferencia no es una capacidad que el modelo tiene o no; es una exploración que a veces llega. Lo puede: lo hace 2 de 7. Lo que no puede es garantizar que su exploración pase por ahí cada vez.

El quinto conflicto, 5 de 13 hallado: tiene superficie y marcador; debería salir más. Que salga 5 de 13 dice que también sufre la cobertura: mismo actor que A y D.

P3 · La varianza

Hay un núcleo muy por encima del umbral, A, B y C, que sale siempre, y una franja cerca del umbral que sale según la trayectoria. Toda la varianza está en la franja. A temperatura 1 fija, todo lo que varía con entrada idéntica es muestreo. No hay “otra cosa”.

Se puede acotar, con nombre. Buscable: “species accumulation curve”, y “self-consistency” (Wang et al., 2022) aplicada a conjuntos. Se lanzan n muestras y se cuenta cuántos hallazgos distintos han aparecido en función de n. Si la curva se aplana en 8 después de 5, el conjunto latente tiene unos 8 elementos y 5 muestras lo capturan. Esa curva es la medida honesta de “exhaustividad” que tenéis a mano.

Por qué los tres directos no bailan: una decisión con probabilidad 0,99 ensanchada sigue siendo 0,97. Una con 0,3 puede ser 0,2 o 0,4. El ruido muerde donde la señal es débil.

P4 · El estado del arte para exhaustividad sobre documentos largos

Lo que se ha abandonado como garantía: la llamada única con lista abierta. Se usa como primera pasada, no como garantía.

Lo que funciona:

Enumerar unidades y hacer preguntas cerradas. La enumeración la hace código; el modelo responde preguntas cerradas, con distribuciones afiladas incluso a temperatura 1. Es la arquitectura de la verificación de hechos desde FEVER (2018). Es la única forma conocida de que un conflicto inferencial y uno directo tengan la misma fiabilidad. Buscables: “FEVER”, “claim verification”, “pairwise NLI”. Muestrear varias veces y unir, con verificación detrás. Buscables: “self-consistency”, “sample-and-verify”. Barrido por secciones con “ninguno” permitido. Buscable: “map-reduce”, “section-wise extraction”. Más esfuerzo de razonamiento en el juez. La capacidad no tocada. Es un dial; se mide. Pedir al modelo que revise su propia cobertura. Buscables: “chain of verification” (Dhuliawala et al., 2023), “self-refine”. Complemento, no base.

Lo que no funciona: clasificadores finos sobre frases sin contexto; topes más altos.

P5 · ¿Es correcta la forma que tenéis?

Para precisión en lo directo, sí. Para exhaustividad, no, y nadie construye exhaustividad así.

Lo que haría un sistema que deba ser exhaustivo, con vuestras piezas:

Primera pasada: la que tenéis. Enumeración de parejas, en código: pasajes del nuevo y del candidato que comparten entidades o términos clave y que la recuperación vectorial ya relaciona. D se enumera sola. No hace falta saber que es “norma contra norma”. Segunda pasada, cerrada: para cada pareja no cubierta, una pregunta con solo esos dos pasajes y su contexto: “¿afirman valores distintos del mismo dato, o enuncian normas que no pueden cumplirse a la vez, o ninguna?”. Tres salidas, cerradas, con citas de los dos pasajes como puntero. Esfuerzo alto, porque la entrada es corta. Verificador y puerta, como hoy.

Lo que cambia: el juez deja de ser el único enumerador. Lo que el código no enumere, dos pasajes sin ninguna entidad común, sigue fuera; esa es la frontera honesta, y se declara.

P6 · La pregunta del director

La fiabilidad no está en el hallazgo; está en la pregunta. Una pregunta cerrada sobre una pareja dada no compite con nada. La enumeración es genérica. Se enumeran parejas de pasajes que hablan de las mismas cosas. Es ciego a la clase. Y el criterio del juez cerrado es doble: verdad o cumplimiento. No es un catálogo; son dos preguntas que cubren todas las clases que la lógica admite. Lo que no se enumere se declara.

Los experimentos que distinguen

E1 · Cobertura por A. Mismo prompt, con las dos mitades de A retiradas. P-F130-1: D pasa de 2 de 7 a 4 de 5 o más. E2 · Esfuerzo alto. P-F130-2: D a 3 de 5 o más; latencia del juez sube más del 50 %. E3 · Pregunta cerrada sobre la pareja de D. P-F130-3: conflicto normativo en 6 de 7 o más. E4 · Barrido por secciones. P-F130-4: D en 3 de 5 o más; el quinto en 4 de 5 o más. E5 · Curva de acumulación. Diez pasadas. P-F130-5: se aplana entre 7 y 9 distintos a partir de la sexta; D aparece antes de la quinta. E6 · El quinto bajo E1. P-F130-6: sube de 5 de 13 a 4 de 5 o más.

Lo que necesito: los prompts literales del juez y del verificador, por el prototipo que fijan.

Sobre la tercera respuesta posible de vuestra sección 7

“Decirle al usuario que el análisis no es exhaustivo”: hay que decirlo de todos modos. Ningún sistema con un modelo dentro es exhaustivo. La promesa honesta es “cobertura medida: X de Y sembrados, en Z pasadas”, y “lo que no comparte términos queda fuera”. Es mejor producto.

PREGUNTAS DEL DIRECTOR, HECHAS EN CONVERSACIÓN TRAS EL PRIMER DICTAMEN (28/10, 15:45–19:45)

Esta sección no estaba en la consulta. Recoge seis preguntas del director y lo que respondí, y de ellas sale la decisión, el plan exacto, su encaje con lo planeado y la comprobación de coherencia. Todo queda archivado.

D1 · “¿Es un giro severo del producto? ¿Cuánto dura?”

No es un giro: es añadir una segunda pasada detrás de la que hay, y la que hay no se toca. Se quedan igual el retrieval, el rerank, el juez con los documentos enteros, la puerta, el verificador, la síntesis y la pantalla. Se añaden tres piezas que reutilizan lo existente: un enumerador de parejas en código, una pregunta cerrada al juez por lote de parejas, y la unión con desduplicación por posición de cita. Dos a tres semanas, tras interruptor y en sombra. Del tamaño de la vía 2 o del escalón 2, no de las fichas.

D2 · “Las que varían seguirán variando por mucho que haga otra pasada, ¿no? ¿Cómo me aseguro de que salen?”

La segunda pasada no es otra vuelta de lo mismo. Hoy la pregunta es abierta, “dime todo lo que choque”, y lo cercano al umbral entra o no. En la segunda, la lista de parejas la arma el código, que no se cansa ni cierra la lista, y es la misma cada vez; y cada pareja recibe una pregunta cerrada que no compite con nada. D deja de ser “lo que el juez recuerda sacar en quinto lugar” y pasa a ser la pareja 17, que se pregunta siempre. Lo que queda sin asegurar, y se mide: parejas que el código no arme por no compartir términos ni vecindad, que se declaran como frontera; y el error de una pregunta cerrada, pequeño y simétrico entre directo e inferencial, medido por E3. “Asegurar” significa: todo lo que comparta términos se pregunta siempre; cada pregunta se acierta con tasa medida y alta; lo que queda fuera se declara. No es el 100 %, que nadie tiene; es un número que se puede leer y defender.

D3 · “¿Cómo sabe el código que el trozo 1 tiene que ver con el 17? ¿Es lo de las fichas adelantado? ¿Cuánto encarece?”

Con dos cosas que ya tenéis: los vecinos vectoriales que el retrieval ya calcula para cada trozo y hoy tira, y el solapamiento de términos clave entre trozos, que es contar palabras. D se empareja por las dos vías: NOR-10 §2.4 nombra a las dos figuras; CLI-12 §3.1 nombra al Director Clínico en la frase y al Coordinador en el título del mismo trozo; y §3.5 nombra a las dos más “nunca”. Encargo para Code: comprobar hoy, sin lanzar nada, que el trozo 4 de NOR-10 y los trozos 3 y 6 de CLI-12 son vecinos vectoriales y comparten las dos figuras. P-F130-9: las dos parejas salen por las dos vías. No es lo de las fichas. Las fichas extraen afirmaciones al indexar y crean tablas; esto empareja trozos de texto tal cual, sin extracción ni almacenamiento nuevo. Es la prima barata de las fichas; si un día se hacen fichas, la lista de parejas se hará con fichas. Coste: no una llamada por pareja. Se agrupan diez parejas por llamada con un hueco obligatorio de respuesta por pareja; si falta un hueco, el validador repregunta. Con NOR-10, entre 20 y 40 parejas por candidato tras filtrar, tres o cuatro llamadas en paralelo, 40.000 a 70.000 tokens más de entrada. P-F130-8: el análisis pasa de 0,015 $ a entre 0,025 y 0,035 $, y entre 5 y 10 segundos más. En el caso de control, casi nada.

D4 · “¿Por qué mantener la pasada 1 si la 2 es la forma correcta? ¿Hay casos que la 1 encuentre y la 2 no?”

Sí. La segunda empareja por términos compartidos; no ve un conflicto cuyo enlace esté en una definición lejana: “material crítico incluye el instrumental rotatorio” en el apartado 1, “el material crítico se esteriliza en autoclave” en el 7, y “el instrumental rotatorio se desinfecta en frío” en el candidato. El 7 y la frase del candidato no comparten palabras; el enlace está diez páginas antes. La lectura global puede; dos pasajes sueltos, no. Y los solapamientos y lo exclusivo son lectura global, no parejas. Son complementarias con nombre: lectura global más recorrido local, grueso más fino. El orden da igual para el resultado; solo afecta al coste. Cómo saber si alguna sobra: contador por hallazgo publicado, “solo pasada 1”, “solo pasada 2”, “las dos”. Tras cincuenta análisis reales se decide. Apuesta: ninguno será cero.

D5 · “D no comparte palabras, así que la segunda pasada no lo encontraría. Y ¿no sería mejor hacer primero las parejas y después la lectura global descartando lo ya encontrado?”

D sí comparte términos; ver D3. El emparejador no busca las palabras del conflicto sino las cosas de las que se habla, y no se puede contradecir sobre el Coordinador de Calidad sin nombrarlo. El caso del “material crítico” es la excepción, y la cubre la pasada 1. Sobre el orden: la idea es buena, con una corrección al mecanismo: el juez no deja de buscar “cerca de A” por posición, sino sobre los mismos actores que A, por cobertura. La conclusión aguanta: parejas primero, y lectura global después con la lista de lo ya encontrado y la instrucción “busca lo que no esté aquí”. Es la técnica de excluir lo conocido; su riesgo conocido es que el juez invente para cumplir, y lo contiene el verificador. Experimento E7, 5 pasadas. P-F130-7: la lectura global con lo conocido excluido saca al menos un hallazgo distinto por pasada que hoy no sale, y el verificador rechaza menos de uno de cada tres. Si inventa más, se vuelve al orden original.

D6 · “¿Parejas solo en el exhaustivo? ¿Y se puede hacer estable la pasada 1?”

La pasada por parejas es el mismo código en los dos modos; qué modo la llama es un interruptor. Según F-123, el exhaustivo hoy lee menos que el rápido; antes de recibir parejas tiene que heredar la ventana del rápido. Orden: exhaustivo al nivel del rápido en lectura, luego parejas, más candidatos y más pasadas. Que el rápido lleve parejas se decide con el coste y la latencia medidos; si no las lleva, la frase de cobertura es distinta por modo. La pasada 1 no se puede hacer estable en recuento: una lista abierta a temperatura 1 tiene franja por construcción. Lo que la encoge, de barato a caro: separar contradicciones y solapamientos en llamadas distintas; esfuerzo de razonamiento alto; unión de tres muestras; y la pregunta cerrada, que es la pasada 2. Y una advertencia: “que siempre salgan 4” no es el objetivo; un juez que da siempre 4 puede dejarse D siempre. La estabilidad que vale es por hallazgo, no por recuento.

DECISIÓN, Y POR QUÉ

Se construye la segunda pasada por parejas. Por qué: es la única forma conocida de que un conflicto como D salga siempre que sus dos mitades compartan términos, sin saber de antemano qué clase de conflicto es; no toca nada de lo construido; cuesta dos a tres semanas; y su justificación se comprueba con un experimento de media hora antes de escribir una línea. Es un desvío necesario respecto al plan de F-127, porque F-130 ha medido que la forma actual no puede dar cobertura por construcción, y eso no se sabía el 16/10.

PLAN EXACTO

Semana 0, sin código (esta semana):

E3: pregunta cerrada sobre la pareja de D, 7 veces. Condición para construir: 6 de 7 o más. E1 y E5: cobertura por A, y curva de acumulación con 10 pasadas. Media hora. Dan el mecanismo y la cifra de cobertura actual. Comprobación de Code: los trozos de D son vecinos vectoriales y comparten las dos figuras. Cambio de texto del producto: de “exhaustivo” a “cobertura medida”. Texto, no código.

Semanas 1 a 3, si E3 confirma, unos diez commits, en este orden:

Enumerador de parejas: vecinos vectoriales por trozo, que ya se calculan, más solapamiento de términos clave. Función pura, con prueba que usa D y el quinto conflicto como casos. Dos commits. Prompt cerrado del juez de parejas y su formato con hueco obligatorio por pareja, con los dos criterios, verdad y cumplimiento, y la especie conflicto_normativo de F-129. Uno o dos commits. Llamada por lote de parejas por llm-client, con registro por llamada. Un commit. Filtro “ya cubierta por la pasada 1”, por posiciones de cita. Un commit. Unión y desduplicación por posición. Un commit. Interruptor y modo sombra: la pasada 2 corre y guarda sin publicar. Un commit. Casos del arnés con predicciones, incluidos los cuatro sembrados de F-129 y el caso de “material crítico” como control de lo que la pasada 2 no ve. Un commit. Activación y regla en CLAUDE.md, con el contador “solo 1 / solo 2 / las dos”. Un commit.

Condición para activar: las seis contradicciones vivas siguen en 5 de 5; la pasada 2 no publica ningún falso en el caso de control; D y el quinto salen en 4 de 5 o más.

Después, dentro del mismo frente: E7, el orden invertido con lo conocido excluido, como experimento de una línea de prompt; separar contradicciones y solapamientos en la pasada 1; esfuerzo alto medido.

AL TERMINAR, SE RETOMA LO PLANEADO, en este orden, actualizado:

3.1.2 (citas con sujeto), que estaba a punto y se mide después de que la pasada 2 exista, porque la fragmentación de A ya bajó con el candidato entero. 3.1.4 (caché): 30.700 tokens pagados dos veces por análisis, y ahora también el prompt fijo de los lotes de parejas. Exige documentos como bloques (F-122). F-129: los cuatro casos sembrados y la medición de la especie conflicto_normativo, que ahora se mide en la pasada 2 además de en la 1. Fase 2, F-119 recortada: para corpus donde el candidato no quepa entero. Fase 4, ventanas: para parejas que no quepan en 150.000, en la pasada 1. El exhaustivo: heredar la ventana, parejas, más candidatos, más pasadas. Congelado con fecha, sin cambios: tablas de Word, cola, búsqueda híbrida, fichas de afirmaciones, migración de modelo de las tres etapas baratas.

COHERENCIA CON LO DICTAMINADO ANTES

Revisado contra F-116, F-119, F-120, F-122, F-123, F-127 y F-129. No hay choque; hay cuatro puntos que cambian de sitio o se absorben, y se dejan escritos:

La “segunda vuelta dirigida” de F-116 (3.3) queda absorbida por la pasada 2: era una búsqueda dirigida solo para hallazgos con un lado; la pasada 2 pregunta por todas las parejas, incluidas esas. No se construye aparte. La “lista de datos examinados” de F-120 queda absorbida: la lista de parejas preguntadas es exactamente eso, y la produce el código. F-119 pedía guardar lo que el retrieval tira; el enumerador de parejas es ese guardado. La fase 2 de F-119 sigue pendiente para la selección de candidatos, que es otra cosa. La especie conflicto_normativo de F-129 es el tercer criterio de la pregunta cerrada; no hay dos definiciones. Las ventanas de F-127 siguen siendo de la pasada 1 y no cambian con esto; la pasada 2 no depende del tamaño de ventana porque sus preguntas son cortas. Las fichas siguen siendo destino; la pasada 2 es su versión sin extracción y no la contradice. El verificador ciego (3.2) sube de importancia: es el control de la pasada 2 y de E7. Lo único que se retira: la frase “exhaustivo” del producto, que ninguna respuesta anterior había cuestionado y debía haberse cuestionado.

PREDICCIONES NUEVAS

P-F130-7 (E7, 5 pasadas): lectura global con lo conocido excluido saca ≥ 1 hallazgo distinto por pasada que hoy no sale; el verificador rechaza < 1 de cada 3. P-F130-8 (coste, con registro por llamada): el análisis de NOR-10 pasa de 0,015 $ a entre 0,025 y 0,035 $; entre 5 y 10 segundos más. P-F130-9 (enumerador, 0 pasadas): las parejas §2.4–§3.1 y §2.4–§3.5 salen por vecindad vectorial y por términos compartidos. P-F130-10 (activación, 5 pasadas): D y el quinto conflicto, 4 de 5 o más cada uno; las seis vivas, 5 de 5; falsos de la pasada 2 en el caso de control, 0. P-F130-11 (contadores, tras 50 análisis): ni “solo pasada 1” ni “solo pasada 2” es cero.

---

(e) ADENDA, 29/10/2026 — LA RESPUESTA DE FABLE SOBRE EL FORMATO Y LA CONDICIÓN DE E3

Se archiva como adenda de F-130 y no como consulta nueva: una pregunta que completa un dictamen va dentro de su
consulta (instrucción del arquitecto, 29/10).

LO QUE SE LE MANDÓ (aclarado por el arquitecto, 29/10): el contenido ENTERO de
`F-130_anexo_textos_para_fable_2026-10-29.md`, en esta misma carpeta (los prompts del juez y del verificador y la
pregunta cerrada de E3, capturados del código; huella del fichero, e579d3d0e2fc1a2c), más una línea de cubierta del
director, literal: «Los textos iban vacíos por un fallo nuestro; van ahora enteros, tal como los capturó el código».
No se copia aquí: el anexo es el fichero que se mandó, y se queda como está.
Fable contestó en DOS mensajes: el primero, tres líneas sobre E3 (abajo, primero); el segundo, dos observaciones
sobre los prompts (abajo, después), que llegó a Code el 29/10.
⚠️ El texto de E3 del anexo de los prompts (`F-130_anexo_textos_para_fable_2026-10-29.md`) es ANTERIOR a la línea que
esta respuesta motivó («LAS DOS RESPUESTAS NO PUEDEN CITAR EL MISMO PAR DE FRASES…»); la versión vigente está en
`app/api/admin/medida-f130/medida-f130.ts`. Fable propuso la comprobación «al validador»; el arquitecto la puso, para
E3, como línea de la pregunta.

LA RESPUESTA DE FABLE — literal, tal como la pegó el arquitecto

1. «Dos preguntas con respuesta obligatoria, dato y cumplimiento, en vez de una con tres salidas: correcto y mejor que lo que dicté. Es el hueco obligatorio aplicado dos veces, y evita justo lo que medisteis: que A ocupe el único hueco y D no se escriba. Añadiría una sola cosa al validador: que las dos respuestas no puedan citar exactamente el mismo par de frases, para que "cumplimiento" no sea una copia de "dato" con otra etiqueta.»

2. «E3 con los trozos enteros y A dentro: correcto, es lo que entregará el enumerador y es lo que mide. La variante de solo las dos frases no mediría la pasada 2, pero sí mediría el techo de la pregunta cerrada; descartarla es razonable, y si algún día E3 sale por debajo de 6 de 7, esa variante será la primera que querréis para saber si falla la pregunta o el contexto.»

3. «Las dos parejas por separado, condición en la de §3.1: correcto, y es vuestra propia regla de que una cifra pertenece a la pareja en que se midió. Sin choque.»

Cierre: «Nada de esto choca con F-130.»

EL SEGUNDO MENSAJE DE FABLE TRAS LA ENTREGA DE LOS PROMPTS — literal y completo, tal como lo pegó el arquitecto

Dos cosas, no una, y ninguna es un plan:

1. El prompt del juez se contradice a sí mismo sobre D. Arriba, "REGLA PRINCIPAL, POR ENCIMA DE TODAS LAS DEMÁS: si hablan de datos distintos, NO emites hallazgo"; abajo, "CONFLICTO NORMATIVO es cuando las dos mandan sobre COSAS DISTINTAS". El bloque normativo se presenta como excepción, pero la regla de arriba se declara por encima de todas, y D es, por definición, "cosas distintas". Eso no choca con la decisión de F-130; la refuerza: es una presión más contra D en la lista abierta, y es la clase de tensión que la pregunta cerrada de E3 no tiene porque sus dos preguntas son obligatorias y no jerarquizadas.
2. El verificador depende de que el juez haya puesto la etiqueta. Un D emitido sin `conflictoNormativo`, que ya os ha pasado (1 de 8), va al lote de siempre, donde la única pregunta es "¿valores distintos del mismo dato?", y muere. Es el cajón de F-124 otra vez: la ruta la decide una marca del juez. Sí choca con el espíritu de F-130 y con vuestra propia decisión de E3: el verificador debería hacer las dos preguntas obligatorias a todo hallazgo, como hace la pregunta cerrada, en vez de una u otra según la marca. Y de paso, el prompt del lote de marcados empieza diciendo "decide UNA SOLA cosa: si se oponen sobre el mismo dato" y más abajo dice que a los marcados no les haga esa pregunta.

Lo demás no choca.

⚠️ SUS DOS CITAS DE NUESTROS PROMPTS SON RESÚMENES, NO LITERALES (comprobado por Code contra los ficheros, 29/10). Las
de arriba son de Fable y se quedan como suyas; los literales verificados son éstos:
· Del juez (`lib/analysis/judge.ts:843-846`): «REGLA PRINCIPAL, POR ENCIMA DE TODAS LAS DEMAS: Antes de emitir cualquier
  hallazgo, verifica que los dos textos hablan del MISMO DATO CONCRETO. Si hablan de datos distintos, no hay nada que
  comparar y NO emites hallazgo, aunque ambos textos pertenezcan al mismo ámbito.» «DEMAS» va sin tilde, y hay una
  frase intermedia que el resumen omite. La otra cita del punto 1 sí es literal (`lib/analysis/excepcion-de-las-reglas.ts:62`).
· Del verificador (`lib/analysis/verify-findings.ts:203`): «Para cada uno, decide UNA SOLA cosa: si las dos citas se oponen
  sobre el MISMO dato concreto.» Y lo que dice «más abajo» es la rama (`lib/analysis/rama-de-las-reglas.ts:17-18`): «a ése, y
  sólo a ése, NO le hagas la pregunta de los valores distintos».
El arquitecto transmitió el resumen de Fable del prompt del juez como si fuera cita; se corrigió en el estado vivo y
no se repite (arquitecto, 29/10).

(f) ADENDA, 31/10/2026 — LA RESPUESTA DE FABLE CON LA LÍNEA BASE MEDIDA (3 DE 21)

Se archiva como adenda de F-130 y no como consulta nueva, por decisión del director (30/10): el número viene después del
contenido, y la respuesta trae un ajuste, no una arquitectura distinta.

LO QUE SE LE MANDÓ: ⚠️ NO HA LLEGADO A CODE. La adenda la escribió el arquitecto, y la respuesta se refiere a su «sección 3»
y a su «sección 5»; el texto enviado no está en el repositorio. Cuando llegue, se archiva aquí, literal, encima de la
respuesta.

LA RESPUESTA DE FABLE — literal, tal como la pegó el director el 31/10

a) ¿Choca? No. Lo que sí hay es un error mío que vuestra sección 3 destapa y que debo contar: la puerta “6 de 7 o más” la escribí yo en F-130, y con n = 7 es una puerta que suspende falso el 15 % de las veces a una tasa real del 90 %. Mi propio F-117 P2 decía que una medida vale solo contra su banda de ruido, y no me lo apliqué al diseñar E3. Costó un día de parón. Regla que adopto para mí: ninguna predicción mía con criterio de aceptación lleva n menor que 20, o lleva regla secuencial escrita (parar antes solo con 18 de 20 o 10 de 20).
b) Dónde vive la especie. Sigue siendo el tercer criterio de la pregunta cerrada, y el 0 de 3 del producto confirma por qué debe vivir ahí y no en una etiqueta del juez: en la pasada 2 la etiqueta no la elige el juez, la pone la estructura, porque sale de la pregunta 2 y no de la 1. En la pasada 1, en cambio, la etiqueta es una decisión del juez en lista abierta, y ya sabemos lo que les pasa a esas decisiones. Consecuencia, y es la línea de mi respuesta del 29/10: el verificador no puede depender de la marca. Hace las dos preguntas a todo hallazgo, como la pregunta cerrada, y la etiqueta de la pasada 1 pasa a ser una pista, no una ruta. Con eso, un D que la pasada 1 emita sin etiqueta sobrevive al verificador, y la especie se recupera en el camino en vez de en el prompt. Sobre el 10 % de paráfrasis en la pregunta cerrada: en JSON con campos de cita no está medido, como decís; si en la pasada 2 supera el 5 %, es exactamente el disparador de la vía 2 que quedó escrito en F-125, aplicado a la pasada 2.
c) Con el 14 % en vez del 29 %. Nada distinto en la decisión; tres cosas distintas en la medición:

Todos los criterios de activación de la pasada 2 se reescriben en veintes, no en cincos: D en 16 de 20 o más; cada una de las seis vivas en 19 de 20 o más; falsos en el caso de control, 0 de 20.
La línea base se escribe por pareja y con n: “NOR-10 ← CLI-12, D, 3 de 21”. Es vuestra regla de que la cifra pertenece a la pareja, y es el número que convierte “cobertura medida” en una frase con contenido: hoy 14 %, objetivo escrito 80 % o más.
Vuestro límite de la sección 5 es correcto y se resuelve con E5 sobre las tres parejas con siembra, veinte pasadas cada una, antes de activar: eso es lo que distingue “sube la cobertura en general” de “sube D en esta pareja”. Es la curva que no corrimos, y es la que hay que correr ahora.


(g) ADENDA, 02/11/2026 — EL QUINTO CONFLICTO, LOS TRES NIVELES Y LA PRELACIÓN

Se archiva como adenda de F-130 y no como consulta nueva, por decisión del director y del arquitecto (02/11).

LO QUE SE LE MANDÓ: el texto que Code preparó y el arquitecto cerró el 02/11, abajo, literal. ⚠️ Lo que el director pegó
de verdad no ha llegado a Code: si lo pegó tal cual, es éste. Y la respuesta de Fable contesta también a «preguntas del
director hechas en conversación (02/11, 13:40–15:05)», D1 a D9, que tampoco han llegado a Code: sólo están las
respuestas, dentro de la de Fable.
⚠️ LA VERSIÓN ANTERIOR DE HOY: la de las 15:05 dice que «sustituye a todas las anteriores de hoy», y el arquitecto pidió
archivar la anterior marcada como sustituida. **No ha llegado a Code ninguna versión anterior**: no está en el registro
de la conversación ni en el repositorio. Queda dicho aquí, en vez de archivar algo que no se ha visto.
⚠️ Fable retiró sus dos reglas de tiradas de hoy, «tres de tres» y «tres de cinco» (sección «Lo que cae de mi dictamen»).
Según el arquitecto, la primera cayó por su cuenta: 0,9³ = 73 %. El texto de Fable dice «(D al 73 %)» sin atribuirla.

LO ENVIADO, huella aefc070e1880b89d · 18378 caracteres (18788 bytes UTF-8) · 89 líneas · 69 no vacías · 3274 palabras.
          60 primeros: "ADENDA A F-130 (02/11/2026). No es una consulta nueva.

LO Q"
          60 últimos:  " a cuál; si la respuesta no toca el plan, decid eso también."

---
ADENDA A F-130 (02/11/2026). No es una consulta nueva.

LO QUE NO OS PEDIMOS: no pedimos un plan nuevo. Preguntamos una sola cosa, pero queremos que la penséis con la apertura que os pedimos más abajo: si un caso como el quinto conflicto hay que perseguirlo o declinarlo, y si el sitio al que apuntamos es el correcto.
Las tres preguntas de la sección LOS TRES NIVELES son el andamio de esta pregunta, no preguntas aparte: si contestáis la principal con ellas resueltas, nos basta. No queremos cuatro respuestas: queremos una, bien apoyada.

UNA CORRECCIÓN A LO QUE OS DIJIMOS EN F-130, ANTES DE NADA. Allí os presentamos el quinto conflicto como «la forma FÁCIL de la misma familia» que D: «Mismo sujeto, mismo verbo, mismo objeto, modalidad opuesta». No lo es. Con las dos frases enteras delante, el quinto es de DATO: quién revisa el cumplimiento de ese proceso, el Coordinador de Calidad de la propia clínica (NOR-11) o «siempre personal ajeno al área» (CLI-12). Lo difícil no es un paso de razonamiento normativo, sino reconocer que «revisa trimestralmente el cumplimiento» y «auditoría interna» son la misma actividad. D es «una permisión contra un principio» (F-129); el quinto es «el mismo dato bajo otro nombre». Son dos fronteras distintas y no comparten ninguna propiedad. Si algo de vuestro dictamen se apoyaba en que eran la misma familia (por ejemplo, «tiene superficie y marcador; debería salir más»), se apoyaba en una premisa nuestra que era falsa.
El nombre de esa familia es vuestro, de F-92, pero lo dictaminasteis PARA TABLAS: «el mismo dato bajo distinto nombre de columna». Llevarlo a la prosa es nuestro, no vuestro: no lo teníais resuelto para este caso.
Y DECIDNOS QUÉ DE VUESTRO DICTAMEN CAE CON ESTA CORRECCIÓN. Vosotros sabéis mejor que nosotros qué conclusiones vuestras se apoyaban en que el quinto conflicto fuera de la familia de D. Nosotros hemos encontrado una —"tiene superficie y marcador; debería salir más"— y ya la hemos retirado de nuestro lado, junto con lo que construimos encima. Si hay más, nombradlas. Preferimos rehacer una parte del plan ahora que descubrir dentro de dos semanas que se apoyaba en esto.

LOS TRES NIVELES. Nos damos cuenta de que metemos en un mismo saco tres cosas distintas:
1. LAS QUE NO NECESITAN NADA. "La tarea A la hace Miguel" contra "la tarea A la hace Pepe". Mismo dato, dos valores, las dos frases literales. El producto las encuentra 21 de 21 (A, B y C, en NOR-10 ↔ CLI-12, en las 21 pasadas de la línea base).
2. LAS QUE NECESITAN UNA REGLA QUE ESTÁ EN OTRO SITIO. Un documento dice "la tarea A la hace Pepe"; otro dice "las tareas de cierre las hace siempre Miguel"; y un tercer sitio dice "la tarea A es una tarea de cierre". Las dos primeras frases no se contradicen a la cara: la contradicción existe por lo que dice el tercer sitio. Sigue siendo decidible SIN interpretar: basta con haber leído ese tercer sitio.
3. LAS QUE NECESITAN INTERPRETAR, y donde dos personas competentes pueden discrepar. El quinto conflicto: ¿es "revisar trimestralmente el cumplimiento" una "auditoría interna"? Depende, y puede haber excepciones.
NUESTRA INCLINACIÓN: el producto debe comprometerse en el 1 y en el 2, y NO debe afirmar el 3 —pero tampoco callarlo: presentarlo y que decida el cliente—. Y en el 2 la obligación no es sólo encontrarlo: es DECIR CUÁL ES LA REGLA, porque el cliente tiene que poder comprobar si esa regla aplica a su caso. Un "esto se contradice" sin la regla al lado no le sirve.
Y UNA LECTURA NUESTRA, SIN MEDIR, QUE OS PEDIMOS QUE CORRIJÁIS: puede que los tres niveles no sean tres cosas distintas sino UNA PROGRESIÓN. El nivel 2 es el nivel 1 más una tercera pieza, y esa tercera pieza es una CATEGORIZACIÓN: "la tarea A es una tarea de cierre". Y el nivel 3 es el nivel 2 donde esa tercera pieza SE PUEDE DISCUTIR.
El quinto conflicto encaja a medias: "revisa trimestralmente el cumplimiento" (NOR-11 §10.5) + "las auditorías internas las realiza siempre personal ajeno al área" (CLI-12 §6.2) + una tercera pieza en el glosario (CLI-12 §4). Pero esa tercera pieza no es una categorización escrita, como "la tarea A es una tarea de cierre": es una DEFINICIÓN de auditoría interna, y la categorización —"esto es una auditoría interna"— no está escrita en ningún sitio; hay que deducirla aplicando la definición. Tiene la estructura del nivel 2 salvo en eso, y lo que lo empuja al 3 es que esa deducción admite las dos lecturas, por la excepción de la cláusula.
Si esto es correcto, la pregunta (b) tiene forma: EL NIVEL 2 SE FILTRA AL 3 CUANDO LA TERCERA PIEZA NO ESTÁ ESCRITA COMO CATEGORIZACIÓN Y HAY QUE DEDUCIRLA, O CUANDO ES DISCUTIBLE. Decidnos si el eje es ése, y si hay alguna manera de saber ANTES de publicar si la tercera pieza de un caso es discutible o no, porque de eso dependería que el producto se comprometa o presente.
Y HAY UNA CASILLA QUE NO TENEMOS LLENA, que os pedimos que decidáis porque de ella depende el tamaño del nivel 2: ¿puede una deducción ser APRETADA? Es decir, ¿existe el caso en que la tercera pieza hay que deducirla y la deducción NO admite discusión? No tenemos ni un ejemplo: el único caso que tenemos con la tercera pieza deducida es éste, y es discutible. Si deducir abre siempre la puerta a discutir, entonces el producto sólo puede comprometerse cuando la categorización está escrita, y el nivel 2 se encoge mucho. Decidnos si esa casilla existe y, si existe, cómo se distingue antes de publicar.
LO QUE OS PEDIMOS QUE PONGÁIS A PRUEBA: (a) si los tres niveles son los correctos, y DÓNDE CAE D: nosotros lo vemos entre el 2 y el 3, decidible por lógica pero discutible por un abogado, y no sabemos decidirlo; (b) SI EL NIVEL 2 ES DE VERDAD MECÁNICO O SE FILTRA AL 3, porque elegir mal la regla que resuelve es una respuesta segura y equivocada, y eso es peor que callar; (c) si el producto debe comprometerse en el 2 con la misma firmeza que en el 1.

LA PREGUNTA (del director). ¿Debería un producto negarse a afirmar un caso como el quinto conflicto?
Nuestra inclinación es que sí. Hay dos lecturas defendibles y una excepción que arbitra a medias. Un mecanismo que lo cazara reabriría los falsos positivos razonados de F-125 y F-126. Preferimos un escalón que lo muestre, con las dos lecturas, antes que un mecanismo que lo afirme. Decidnos si eso es lo correcto o si nos estamos rindiendo antes de tiempo.

EL ARGUMENTO CONTRA NUESTRA PROPIA INCLINACIÓN, que os damos porque es el que nos haría cambiar de opinión. El quinto conflicto NO ESTÁ SEMBRADO: surgió en un cruce que nadie planeó emparejar. Nuestras fichas de siembra cubren NOR-10 ↔ CLI-12 y NOR-11 ↔ CLI-13, y éste es NOR-11 ↔ CLI-12. Si aparece solo en un corpus de prueba de 45 documentos, aparecerá en el de un cliente. Y hay una asimetría: UN FALSO POSITIVO EL CLIENTE LO VE Y LO DESCARTA; UN FALSO NEGATIVO NO LO VE NUNCA. Declinar en silencio es equivocarse de la única manera que el cliente no puede detectar.

QUÉ HAREMOS CON VUESTRA RESPUESTA. Con ella decidimos una de dos cosas: construir el escalón que lo muestre sin afirmarlo, o dejar el quinto conflicto como guarda de no regresión y no perseguirlo. EL PLAN DE CINCO PASOS NO CAMBIA EN NINGUNO DE LOS DOS CASOS.

CÓMO QUEREMOS QUE PENSÉIS ESTO.
No os pedimos sólo que juzguéis nuestro ejemplo. Os pedimos que vayáis un paso por delante de nosotros:
1. DECIDNOS SI ESTAMOS APUNTANDO AL SITIO EQUIVOCADO. Puede que lo que hacemos esté bien y falte otra cosa al lado, en otra capa. No os cerréis al caso que os damos: es un ejemplo de lo que nos pasa, no el perímetro de la pregunta.
2. PARA CADA SALIDA QUE PROPONGÁIS, DECIDNOS QUÉ ROMPE DOS PASOS MÁS ADELANTE. Una solución que arregla esto y nos revienta la puerta de citas o nos reabre los falsos positivos razonados de F-125 y F-126 no nos vale, y preferimos saberlo ahora que descubrirlo midiendo.
3. GENÉRICO, NO AD HOC. Si la salida sólo sirve para este par de documentos, no la queremos.

UNA HIPÓTESIS DEL DIRECTOR, que ponemos encima de la mesa sin defenderla: puede que el eje no sea cómo comparamos dos documentos, sino que EL CORPUS DICE QUÉ DOCUMENTO PREVALECE, y el producto no lo usa para resolver.
Lo medido, cada cosa con su conjunto:
- Cláusulas que dicen qué documento manda sobre otro: en los 20 documentos del corpus que tenemos a mano (la organización tiene 45; los otros 25 no los hemos mirado) hay al menos cuatro. El «al menos» es en serio: las buscamos por vocabulario, y la cuarta sólo apareció al leer el contexto de otra.
  · CLI-12 §4: sus definiciones son «vinculantes para la interpretación de cualquier otro documento del sistema», y prevalecen «en caso de conflicto terminológico», con la excepción que citamos en los adjuntos.
  · CLI-12 §12.9: cuando un protocolo y el manual difieren, el comité de calidad decide cuál prevalece en la siguiente revisión documental.
  · NOR-11 §11: «En caso de cualquier discrepancia aparente entre ambos documentos, prevalece siempre el criterio de NOR-11», frente a la guía CLI-13.
  · CLI-13: «No sustituye a NOR-11: ante cualquier duda no resuelta aquí, es ese protocolo el que se consulta en primer lugar».
- Las dos últimas resuelven la pareja de nuestro caso de control, NOR-11 ↔ CLI-13, con tres contradicciones sembradas. Cuántas encuentra el producto depende de la tanda: 2 de 3 el 27/08; las tres en sólo 3 de 10 pasadas del 6 al 8/10; y las tres en las cinco pasadas del 24/10, según una consulta del director que no ha comprobado Code.
- EL PRODUCTO YA LEE ESA PRELACIÓN, Y LA ARCHIVA COMO SOLAPAMIENTO. En un examen del 27/09, cinco pasadas de NOR-11, las cinco publicaron un SOLAPAMIENTO que la describe —«Ambos documentos establecen que NOR-11 es el protocolo normativo y CLI-13 es su traducción práctica para el gabinete, sin alterar los criterios de NOR-11»—, con las propias frases de prelación como evidencia. Ninguna la liga a una contradicción: ese día sólo se publicó una con CLI-13, y no era de las sembradas. En las diez pasadas del 6 al 8/10, ninguno de los temas de las 13 contradicciones que sobrevivieron al juez la menciona; de ésas sólo tenemos archivados los temas, no las citas. No le falta extraerla: le falta el cable entre «esto es un solapamiento» y «esto resuelve aquella contradicción».
- NO HAY DÓNDE PONERLA. Un hallazgo publicado sólo tiene un tema y las dos citas literales: no tiene un campo libre donde decir qué cláusula del corpus lo resuelve. Ponerla al lado es, como mínimo, un campo nuevo.
- El §4 de CLI-12 estuvo delante del juez en las 13 pasadas del quinto conflicto, y en las cinco veces que lo publicó no lo citó ni una.
- Ninguna etapa del producto busca cláusulas de prelación.
EL ARGUMENTO EN CONTRA DE ESTA HIPÓTESIS, Y ES NUESTRO. Lo que proponemos usar lo identificamos nosotros mismos el 27/08 como un RIESGO, con nombre: «la coartada jerárquica». Lo dejamos escrito así: «un modelo puede leerla como "no hay contradicción, hay jerarquía"»; y las contradicciones de ese par se confirmaban «PESE a esta coartada, no en su ausencia». Y lo que medimos el 27/09 va en esa dirección: el producto leyó la prelación como que los dos documentos «se complementan», que ya es media coartada.
La pregunta que sale de ahí: ¿la prelación es material para ENCONTRAR contradicciones, o para RESOLVER las que ya se encuentran? Nuestra lectura, que os pedimos que pongáis a prueba: si es para resolver —poner junto a un hallazgo que ya existe la cláusula del corpus que dice cuál prevalece—, no toca la detección y no reabre los falsos positivos razonados de F-125 y F-126, porque no crea hallazgos; sólo añade qué dice el corpus sobre uno. Pero la cláusula que se pega puede estar mal elegida, que es el punto (b) de los tres niveles. Y si es para resolver: ¿cómo se hace sin convertirla en la coartada jerárquica que ya nos preocupaba en agosto, es decir, sin que la prelación acabe borrando la contradicción en vez de explicarla? Si no es el eje, decidnos cuál es.

LA PREGUNTA NO DEPENDE DE LA TASA. Va de si se debe afirmar un caso con dos lecturas defendibles, no de cada cuánto se encuentra. Y la tasa está a punto de moverse: está entrando un cambio del verificador (hace las dos preguntas obligatorias, la del dato y la del cumplimiento, a todo hallazgo, y la marca del juez pasa a ser una pista) que puede mover la del quinto conflicto. No calibréis la respuesta sobre el número de la tabla.

QUÉ ESTÁ MEDIDO Y QUÉ NO
- Medido: la línea base de los cinco casos (la tabla de abajo); que el juez tuvo los dos documentos enteros delante en las 34 pasadas de esa línea base (34 de 34, con los 55 trozos del manual, el §4 y el §6.2 incluidos); las cuatro cláusulas de prelación, en 20 documentos de 45 y como cota inferior; y lo que hace el producto con la prelación del caso de control en las cinco pasadas del 27/09 y en los temas de las diez del 6 al 8/10.
- NO medido: el efecto del cambio del verificador; el comportamiento del quinto conflicto con la pregunta cerrada sobre su pareja de trozos; si el producto lee las cláusulas de CLI-12 (§4 y §12.9) como lee las del caso de control; las citas de las diez pasadas del 6 al 8/10 y todas las pasadas posteriores del caso de control; y los 25 documentos de la organización que no tenemos a mano.

UN DATO QUE OS PUEDE INTERESAR Y POR EL QUE NO PREGUNTAMOS. Una medición nuestra del 24-25/10 predijo que la especie conflicto_normativo tendría que distinguirse de dos vecinos, y uno de ellos es éste. Es la primera vez que esa confusión se mide: de las 5 veces que el producto publicó el quinto conflicto, 4 fueron sin etiqueta —que es lo correcto para un caso de dato— y 1 con norma_contra_norma, mal puesta. La taxonomía no tiene etiqueta para esta familia, y eso está bien por diseño.

ADJUNTOS

1. La semana 0, cerrada, a 02/11/2026. Producto entero (análisis rápido, juez Haiku 5.5, pareja entera, puerta de citas y verificador ANTERIOR al cambio). Un negativo limpio es una pasada sin el caso, sin muertos sin texto en la pareja y con el registro de descartes comprobado.

| Caso | Pareja | Pasadas | Hallado | Negativos limpios | «No sé» |
|---|---|---|---|---|---|
| A, B y C (sembrados, el mismo dato con las mismas palabras) | NOR-10 ↔ CLI-12 | 21 | 21 de 21 cada uno | — | — |
| D (una permisión contra un principio; F-129) | NOR-10 ↔ CLI-12 | 21 | 3 de 21, hasta 4 de 21 | 17 | 1 |
| el quinto conflicto (no sembrado; el mismo dato bajo otro nombre) | NOR-11 ↔ CLI-12 | 13 | entre 5 y 9 de 13 | 4 | 4 |

2. Los intervalos (Wilson al 95 %) y Fisher exacto bilateral.
- D, 3 de 21: 5 % a 35 %.
- El quinto conflicto: 18 % a 64 % a 5 de 13; 42 % a 87 % a 9 de 13.
- D frente al quinto conflicto: p = 0,21 a 5 de 13; p = 0,057 a 6 de 13; p = 0,022 a 7 de 13; p = 0,002 a 9 de 13. No se puede afirmar ni negar que uno sea peor que el otro.
- El quinto conflicto a 9 de 13 frente a A, B y C (21 de 21): p = 0,015, con los intervalos tocándose (87 % y 84,5 %).

3. Los textos, literales, del documento troceado con el código de la indexación.
- CLI-12 §4, «Definiciones» (trozo 7): «Auditoría interna: revisión sistemática y planificada de un proceso, realizada por personal de la propia organización, con el fin de verificar su cumplimiento y detectar oportunidades de mejora.»
- CLI-12 §4 (trozos 8 y 9): «Estas definiciones son vinculantes para la interpretación de cualquier otro documento del sistema de calidad de Dentavia, incluidos los protocolos clínicos y operativos de cada área.»
- CLI-12 §4 (trozo 9): «En caso de conflicto terminológico entre este manual y un protocolo operativo concreto, prevalece la definición de este manual a efectos de indicadores y auditoría de calidad, sin perjuicio de que el protocolo operativo mantenga su propia terminología técnica específica para la ejecución diaria del proceso.»
- CLI-12 §6.2, «Equipo auditor» (trozo 13): «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio. El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área.»
- NOR-11 §10.5, «Revisión periódica de buenas prácticas» (trozo 13): «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes, incorporando los hallazgos relevantes a la siguiente sesión de formación anual del personal.»
- NOR-11 §11, «Relación con otros documentos» (trozo 14): «También se relaciona con el protocolo de desinfección de superficies, de aplicación conjunta ante derrames, y con el manual de calidad CLI-12, que establece el enfoque de auditoría aplicable a este proceso, igual que ocurre con el resto de procesos críticos de seguridad de la clínica.»

4. El hallazgo del troceado. Ningún trozo tiene a la vez la definición (trozo 7) y lo que la hace vinculante (8 y 9), y la cláusula con su excepción sólo está en el 9. Las dos mitades del quinto conflicto están en otros dos trozos: NOR-11·13 y CLI-12·13.

5. Cómo lo encuentra el producto. El §4 estuvo delante del juez las 13 veces, y en las cinco en que publicó el quinto conflicto la cita del manual es siempre de §6.2, nunca del §4: el modelo equipara las dos actividades por su cuenta. El glosario no es el paso que falta; es la corroboración que un revisor humano usaría.

6. Las dos lecturas.
- La que lo hace contradicción: NOR-11 §10.5 encaja cláusula por cláusula con la definición vinculante, y NOR-11 §11 se remite a CLI-12 para el enfoque de auditoría de ese proceso.
- La contraria: la excepción de la cláusula protege la terminología del protocolo para la ejecución diaria; el §6 de CLI-12 da a las auditorías calendario, tipos e informe, y §10.5 no tiene nada de eso; la definición, al pie de la letra, convierte en auditoría cualquier supervisión periódica; y la remisión de NOR-11 §11 a CLI-12 va en una lista de relaciones con otros documentos, «igual que ocurre con el resto de procesos críticos de seguridad de la clínica».

EL GUARDARRAÍL, porque ya nos ha pasado: si vuestra respuesta implica cambiar el plan de cinco pasos, DECIDLO EXPLÍCITAMENTE Y DECID DÓNDE SE INSERTA. No vamos a correr dos planes en paralelo. Si cabe como paso nuevo, decid entre cuáles; si sustituye a uno, decid a cuál; si la respuesta no toca el plan, decid eso también.
---

LA RESPUESTA, huella 56a18f52599e9b79 · 15056 caracteres (15302 bytes UTF-8) · 156 líneas · 105 no vacías · 2695 palabras.
          60 primeros: "ADENDA DE FABLE A F-130 · ¿DEBE EL PRODUCTO AFIRMAR UN CASO "
          60 últimos:  "or error en parejas sin conflicto, entre 2 y 5 % por tirada."

---
ADENDA DE FABLE A F-130 · ¿DEBE EL PRODUCTO AFIRMAR UN CASO CON DOS LECTURAS?
Versión consolidada y definitiva, 02/11/2026, 15:05. Sustituye a todas las anteriores de hoy. Contiene la respuesta a la adenda del arquitecto, la sección completa con las preguntas del director hechas en conversación, marcada como tal, y la especificación para Code. Las decisiones del director van marcadas [DECISIÓN DEL DIRECTOR]. El plan de cinco pasos no cambia.

Lo que cae de mi dictamen con vuestra corrección, nombrado

Cae P-F130-6 entera ("el quinto bajo E1 sube a 4 de 5"): su premisa era que el quinto sufría cobertura por actor, como D. Retirada.
Cae el quinto como criterio de activación de la pasada 2 (P-F130-10). Pasa a guarda de no regresión en la salida "presentado".
Cae la frase de la tabla de P2 "tiene superficie y marcador; debería salir más". Tiene superficie, no marcador.
Caen mis dos reglas de tiradas anteriores de hoy: "tres de tres" (D al 73 %) y "tres de cinco" (sustituida por decisión del director, con revisión escrita, D9).
Se mantiene que el quinto se enumera en la pasada 2 y que la pregunta cerrada reduce varianza en lo decidible. En lo no decidible, la varianza es la señal.
Sobre F-92: "el mismo dato bajo otro nombre" lo dicté para tablas. Llevarlo a prosa no lo tenía resuelto.

La respuesta, en una frase: el producto no se niega a afirmar ni afirma: triza en tres salidas, se compromete, presenta o calla, y la salida la decide una medida. La medida es el acuerdo entre tiradas independientes de la misma pregunta cerrada, más la lectura del puente. Vuestra inclinación es correcta en el resultado, el quinto no se firma, e incorrecta en el método: no se decide a mano ni se declina en silencio.

1 · Los tres niveles: una progresión, y el eje es si la deducción tiene escape

Nivel 1: dos piezas. Nivel 2: dos piezas y un puente. Nivel 3: un puente con dos lecturas. El eje no es "escrito o deducido": es si la deducción tiene escape.

La casilla que no tenéis llena existe: aritmética ("plazo máximo 30 días" y "entrega a los 45"); descripción que agota la categoría ("las tareas de cierre las hace Miguel" y "la tarea A consiste en cerrar la caja"); definición cumplida punto por punto sin excepción; y D, 36 de 40.

Lo que abre el escape, y se lee en el puente: cláusula de excepción o alcance ("a efectos de", "sin perjuicio de"); definición amplia; cuantificador o hedge; o que el juez no cite el puente y lo supla con su equiparación. El §4 estuvo delante 13 veces y no se citó ni una.

D: nivel 2. Se firma. El quinto: nivel 3. Se presenta.

2 · Cómo se sabe antes de publicar, sin clasificar a mano

Medida 1 · Acuerdo entre tiradas. [DECISIÓN DEL DIRECTOR] La pregunta cerrada se hace una vez por pareja. Cuando es positiva, se repite dos veces más, mismo texto, tres en total:

2 o 3 "sí" de 3, y puente sin escape: se compromete. Con 90 % por tirada, el 97,2 %.
2 o 3 de 3, y puente con escape, o sin puente en un caso que no es de nivel 1: se presenta.
1 de 3: se presenta.
0 de 3 en la repetición: se registra, no se publica.
D aparece en alguna de las dos listas, firmada o posible, el 99,9 % de las veces.

Medida 2 · Lectura del puente. Para todo positivo, tercera cita opcional: la regla, definición o categorización que conecta las dos mitades. En código: puente con marcador de excepción, baja a presentar aunque sea 3 de 3; sin puente y no nivel 1, baja a presentar; puente sin escape, se compromete.

Dos filtros: el acuerdo quita el azar; la excepción quita lo discutible. El quinto no se firma aunque saliera 3 de 3, por el "sin perjuicio" de su puente.

Qué ve el cliente

Comprometido: dos citas, y la tercera si existe. La lista firmada deja de bailar.
Presentado: por defecto interno, tras interruptor, contador y registro. En pantalla, con etiqueta "posible" y el botón "no es contradicción", cuando se decida con un cliente delante.
Silencio: lo que no supera la primera pregunta.

3 · La promesa del producto, con frontera

Cada salto es una oportunidad de error; cuatro saltos al 90 % son un 65 %. Promesa: contradicciones directas, y contradicciones con un solo puente escrito dentro de la pareja o en las notas de jerarquía. Más de un salto no se promete; si aparece, se registra como posible. Cobertura medida con frontera declarada.

4 · La prelación: material para resolver, no para encontrar

Una contradicción no desaparece porque un documento prevalezca. Invariante: la prelación nunca filtra; solo anota. La coartada jerárquica ya se midió el 27/09.
No reabre F-125 ni F-126.
Guarda de ahora: una línea en el prompt del juez y en la pregunta cerrada: "una cláusula que dice qué documento prevalece no elimina una contradicción; se reporta igualmente". NOR-11 contra CLI-13 es su prueba de no regresión.
El quinto: la prelación no lo resuelve; cuando la prelación tiene excepción, el puente tiene escape.

Primera versión: bloque de notas por análisis, "Reglas de jerarquía detectadas", con las cláusulas que el juez encuentre en los dos documentos, citadas, sin ligar a hallazgos. Coste cero.

Segunda versión, paso 6, explicada. Al indexar un documento, además de trocearlo, se lee una vez buscando frases de prelación ("prevalece", "vinculante", "no sustituye a", "en caso de discrepancia", "se consulta en primer lugar"), se confirman con una llamada corta, y se guardan en una tabla: documento, posición, frase, a quién nombra. Con NOR-11, se guarda "§11: prevalece NOR-11 frente a CLI-13", una vez. Cualquier análisis que toque a uno de los dos saca la nota aunque el otro no sea candidato; el chat responde "¿qué prevalece sobre X?" leyendo la tabla. Es el índice de un libro. Coste: una lectura extra por documento al entrar. Primera ficha del producto, acotada a prelación.

Sube de prioridad porque sirve a las notas del análisis y al asistente de redacción de D4.

5 · Qué rompe cada salida dos pasos más adelante

La repetición ×3: dos preguntas cortas más por positivo; con cinco positivos, diez. Riesgo: acuerdo alto y falso; lo contiene el verificador y el puente citado.
La tercera cita: campo nuevo; censo de los ocho consumidores de F-122.
"Presentado" en pantalla, cuando se active: etiqueta "el sistema no firma esto"; las lecturas del verificador se miden contra el adjunto 6.
Prelación como nota: no rompe detección; rompe el prompt si parece resolución, por eso la línea. Paso 6 acotado a prelación.

PREGUNTAS DEL DIRECTOR, HECHAS EN CONVERSACIÓN (02/11, 13:40–15:05)

D1 · "Tres pasadas y se encarece mucho." No son tres análisis. Pasada 1 sin cambios. Pasada 2 en preguntas cortas agrupadas. Repetición solo en positivos: con cinco positivos, diez preguntas más, unos 15.000 tokens. Nota de jerarquía, coste cero. P-F130-17: NOR-10 pasa de 0,015 $ a entre 0,03 y 0,04 $, y entre 5 y 10 segundos más.

D2 · "Un apartado de notas con las reglas." Adoptado como primera versión. La nota nunca sirve para dejar de reportar; sirve para decir cuál corregir.

D3 · "¿D es interpretable? ¿Y 4, 5, 10 puentes?" D no es interpretable: un puente escrito sin excepción, un paso, 90 %. El quinto sí. Cadenas largas no se prometen: sección 3.

D4 · "¿No sería mejor preguntar antes de escribir?" Es asistencia a la redacción, un producto con nombre, más barato de lo que parece: usa el chat para "¿dónde se habla de X?" y el paso 6 para "¿qué prevalece?". Previene en vez de detectar. No sustituye al análisis: los documentos que ya existen, los que llegan de fuera, y la gente que no pregunta. Consecuencia: el paso 6 sube.

D5 · "¿Por qué 90 % y no 100 %? ¿Es profesional que salgan 5 un día y 4 otro?" El juez va a temperatura 1 sin alternativa: cada respuesta es una tirada. La décima vez lee "separar la responsabilidad" como cosa del rol, o se pierde en los trozos largos. Se sabe leyendo las 4 negativas de 40: encargo para Code. No se puede forzar una tirada; se puede dejar de depender de una. Y lo firmado deja de bailar porque lo del límite va a otra lista.

D6 · "¿No sería mejor subir el esfuerzo o el modelo?" [DECISIÓN DEL DIRECTOR: aparcado]

Suben la probabilidad por tirada; no arreglan la lista abierta ni cubren casos desconocidos, que solo cubre la lista de comprobación. Un modelo mayor en la pasada 1 costaría entre 3 y 5 veces más por 85.000 tokens: más que la pasada 2 entera. Dentro de la pasada 2, la pregunta era "tres tiradas de un modelo mejor o tres de Haiku"; el experimento estaba diseñado (Haiku medio, Haiku alto, modelo siguiente, veinte tiradas por condición). Queda aparcado: la diferencia entre el 97 y el 99 no justifica el coste ni el experimento ahora. Mis apuestas, por si se corre más adelante: esfuerzo alto lleva p en D a entre 0,92 y 0,96 con latencia entre 1,5 y 2 veces; el modelo siguiente a entre 0,95 y 0,98 con coste entre 3 y 5 veces; en el quinto, ninguno pasa de 0,7.

D7 · "¿Por qué no firmar con una sola tirada positiva de tres? Falsos apenas hay, y el usuario tiene un botón."

El 90 % es de D. La pasada 2 pregunta por 20 o 40 parejas por candidato, y la mayoría no tienen conflicto. La tasa de "sí" por error en esas no está medida; apuesta: entre 2 y 5 % por tirada, porque lo medido hasta ahora es lo que el producto firma tras puerta y verificador, no lo que una pregunta cerrada contesta en bruto.
La cuenta, con 3 % por tirada y 30 parejas: "una de tres basta" da 9 % por pareja, unas 2 o 3 falsas por análisis antes del verificador; "dos de tres" da 0,3 % por pareja, una falsa cada diez análisis. La regla "una de tres" sube D de 97 a 99,9 y multiplica por 30 los falsos. Con dos o tres falsas por análisis, el usuario deja de confiar en la lista y tampoco lee las verdaderas: la precisión es el sello (F-116).
Lo que cumple el objetivo del director sin pagar eso: dos niveles. Dos o tres de tres, firmada; una de tres, posible con el botón. D aparece en alguna de las dos el 99,9 %.
Encargo para Code, que decide esto con dato: cien parejas sin conflicto, pregunta cerrada, tres tiradas, contar los "sí". P-F130-19: entre 2 y 5 % por tirada. Si queda por debajo del 0,5 %, la regla "una de tres" vale y se adopta.

D8 · "¿Dos 'no' no es 0,1 × 0,1?" Es 0,1 × 0,1 para dos tiradas concretas. En tres tiradas hay tres maneras de acabar con dos "no" (no-no-sí, no-sí-no, sí-no-no), cada una 0,009, más no-no-no, 0,001: 2,8 % de fallo, 97,2 % de acierto. Como tres monedas: exactamente dos caras no es 0,25 sino 0,375.

D9 · "¿Y con cuatro?" [DECISIÓN DEL DIRECTOR: 2 de 3, con revisión]

Regla | D (p = 0,9) | Discutible (p = 0,5) | Falso en pareja sin conflicto (3 % por tirada)
2 de 3 | 97,2 % | 50 % | 0,26 %
2 de 4 | 99,6 % | 69 % | 0,52 %
3 de 4 | 94,8 % | 31 % | 0,04 %
3 de 5 | 99,1 % | 50 % | 0,08 %
2 de 4 paga una tirada más que 2 de 3 para ganar en D lo que pierde en la red. No se recomienda. 3 de 5 es la forma limpia de pasar al 99 %.
Decisión: se empieza con 2 de 3. Condición de revisión escrita: si en el arnés D queda por debajo de 19 de 20 firmada, o si el registro por llamada muestra que dos tiradas más por positivo cuestan menos de lo estimado, se pasa a 3 de 5. Es un número en una constante con ficha; no es una obra.

ESPECIFICACIÓN PARA CODE · qué se inserta, dónde, y con qué contadores

En el paso 2 (prompt cerrado y formato):

Campo opcional por respuesta positiva: puente: { documento: "nuevo"|"existente", cita: "…" }. Literal.
Campo por respuesta: jerarquia: [ { documento, cita } ]. Literal.
Línea en el prompt cerrado y en el del juez: "Una cláusula que dice qué documento prevalece sobre otro no elimina una contradicción. Si los dos documentos chocan, repórtalo igualmente; la cláusula va aparte, en jerarquia."

En el paso 3 (llamada por lote): [DECISIÓN DEL DIRECTOR]

Para cada pareja positiva en la primera llamada: dos llamadas más idénticas, en lote propio, mismo modelo y esfuerzo que hoy. acuerdo: n_de_3.
Constantes con ficha: TIRADAS = 3, UMBRAL_FIRMA = 2. Condición de revisión en la ficha: D < 19 de 20 firmada, o coste medido de las dos tiradas extra menor del estimado → TIRADAS = 5, UMBRAL_FIRMA = 3.
Registro por llamada: repeticion: 1..3.

En el paso 5 (unión y desduplicación):

salida(hallazgo), determinista:
acuerdo ≥ UMBRAL_FIRMA y (nivel_1 o puente sin escape) → comprometido.
acuerdo ≥ UMBRAL_FIRMA y (puente con escape, o sin puente y no nivel_1) → presentado.
0 < acuerdo < UMBRAL_FIRMA → presentado.
acuerdo = 0 en repetición → registrado_no_publicado.
nivel_1: las dos citas comparten al menos 3 términos clave normalizados, o nombran el mismo valor numérico o fecha con valores distintos. Ficha con caso decisivo.
escape(puente): lista fija en fichero propio: "sin perjuicio", "a efectos de", "salvo", "excepto", "habitualmente", "en general", "normalmente", "siempre que", "en su caso". Con ficha.
presentado interno por defecto; interruptor PRESENTADO_EN_PANTALLA, apagado. Cuando se encienda, lleva el botón "no es contradicción".
Contadores: salida.comprometido, salida.presentado, salida.no_publicado, presentado.por_acuerdo, presentado.por_escape, presentado.sin_puente, jerarquia.detectada.
Con el interruptor encendido: llamada al verificador, "escribe dos frases, una por lectura, sin afirmar ninguna", campo lecturas: [a, b].

En el paso 7 (arnés), n = 20:

D: comprometido, acuerdo ≥ 2 de 3 en 19 de 20 o más.
El quinto: presentado, nunca comprometido, en 20 de 20.
NOR-11 contra CLI-13: las tres sembradas comprometido en 19 de 20; jerarquia.detectada > 0 en 19 de 20.
Control positivo del escape: puente con "sin perjuicio" y acuerdo 3 de 3; esperado presentado.por_escape.
Control negativo de la nota: prelación presente y contradicción sembrada; esperado comprometido.
Tasa de "sí" por error: cien parejas sin conflicto, tres tiradas; cuenta por tirada. Decide D7.
Encargo previo: leer las 4 negativas de 40 de E3 y clasificarlas en "lectura" o "atención".

Paso 6, subido de prioridad, después de activar la pasada 2: extracción de cláusulas de prelación por documento al indexar, tabla propia, nota en análisis y consulta en chat. Ficha con predicción y arnés antes de construir. Acotado a prelación.

Aparcado por decisión del director: cualquier cambio de modelo o de esfuerzo, en la pasada 1 o en la 2.

Lo que no se toca: puerta de citas, verificador de lote, pantalla salvo el bloque de notas, todo lo congelado.

Predicciones, n = 20

P-F130-12: D, acuerdo ≥ 2 de 3 en 19 de 20 o más. Comprometido.
P-F130-13: el quinto, presentado en 20 de 20 por escape; acuerdo ≥ 2 de 3 en 12 de 20 o menos.
P-F130-14: el puente citado en el quinto, cuando se pide, es el §4 en 14 de 20 o más.
P-F130-15: con la línea sobre prelación, NOR-11 contra CLI-13 en 3 de 3 en 19 de 20, y la prelación en jerarquia en 19 de 20 en vez de como solapamiento.
P-F130-16: las dos lecturas del verificador para el quinto coinciden en sustancia con el adjunto 6 en 16 de 20 (solo si se enciende el interruptor).
P-F130-17: coste de NOR-10 entre 0,03 y 0,04 $; latencia +5 a +10 s.
P-F130-18: de las 4 negativas de 40 de E3, al menos 3 son de lectura, no de atención.
P-F130-19: tasa de "sí" por error en parejas sin conflicto, entre 2 y 5 % por tirada.
---

NOTAS A LA ADENDA (g), FUERA DEL TEXTO DE FABLE (arquitecto y Code, 02/11/2026):
- ⚠️ **ESTE ARCHIVO TIENE LAS RESPUESTAS DE FABLE A LAS PREGUNTAS D1 A D9 DEL DIRECTOR, PERO NO LAS PREGUNTAS**, y esas
  preguntas son las que decidieron el diseño (las tiradas, la regla de 2 de 3, las notas de jerarquía, el aparcamiento
  del modelo). El director las pegará, y entonces se archivan aquí, literales. Lo mismo la versión anterior de la
  respuesta de ese día, que se archivará marcada como sustituida.
- **La tabla de D9 tiene dos cifras mal**, en la columna de los falsos: «3 de 4» da 0,011 % (no 0,04 %) y «3 de 5» da 0,026 %
  (no 0,08 %). Las corrigió el arquitecto y lo comprobó Code con una cuenta binomial. La decisión de empezar con 2 de 3
  no cambia. Con las cifras corregidas, 3 de 5 es mejor que 2 de 3 en D y en los falsos, e igual en lo discutible. La
  tabla recalculada, en `claude/Predicciones_34_Conflicto_Normativo.md`.
- **La función salida(hallazgo) tiene un defecto, y no se construye nada hasta resolverlo**: un hallazgo nivel_1 con
  puente con escape cumple las dos ramas, y la de «comprometido» va primero. El quinto es nivel_1. Detalle en el estado
  vivo (pendiente principal de F-130).
- **Los «pasos» 2, 3, 5, 6 y 7 de la especificación no son los del plan de cinco pasos de la casa**, que tiene el
  verificador en el 2 y la pregunta cerrada del quinto en el 3. Toda la especificación cae dentro del paso 4 del plan
  (la pasada 2), salvo su «paso 6», que va detrás.

---

## ADENDA DE FABLE DEL 04/11/2026, LITERAL (archivada por Code el 05/11/2026)

*Respuesta de Fable a la adenda del arquitecto del 04/11 a esta consulta; no es una consulta nueva. Pegada por el director a Code,
y sacada aquí del registro de la conversación con un script, sin copiarla a mano. ⚠️ La sección 4 de la adenda del arquitecto
(lo que AFIRMÓ la casa) NO está aquí y NO se archiva como medido (arquitecto). «El quinto no es alcanzable» es del arquitecto, es
errónea, y queda corregida dentro del texto de Fable («Sobre vuestra lectura, lo que está de más»). Lo que Code encontró al
contrastarla con el repositorio va en `claude/Predicciones_34_Conflicto_Normativo.md`, «LA ADENDA DE FABLE DEL 04/11, CONTRA EL
REPOSITORIO».*

ADENDA DE FABLE A F-130 · QUÉ SOSTIENE CINCO FRASES EN UN CORPUS
Versión consolidada, 04/11/2026. Contiene la respuesta a la adenda del arquitecto del 04/11 y, al final, la sección con las preguntas del director hechas en conversación después, marcada como tal, que añade una medición pendiente sobre el bloque del principio.

Cuentas, por delante

P-F130-17 cae: se apoyaba en 0,015 $ y la base medida es 0,031 $. Reescrita en P6.
Mi “hipótesis principal: A suprime a D” de F-130 cae: 20 de 20 con A dentro y 16 de 20 sin ella, p = 1. Lo que sobrevive del mecanismo es la forma de la pregunta y el foco, no la cobertura por lo ya escrito. Contada como fallada.
El 97,2 % de la regla “dos de tres” no es una medida: es aritmética sobre un 90 % que viene de la herramienta, contado con regla laxa, sin puerta ni verificador. La regla se mantiene; sus números no existen hasta que se midan en producto.
Mi heurística “si el juez no cita el puente es nivel 3” se queda corta: en el quinto el juez citó el puente, §6.1, y aun así se partió. Citar el puente es necesario, no suficiente. P5.

P1 · Qué puede y qué no puede sostener esta evidencia

Sobre un producto, casi ninguna cifra. Sobre el mecanismo, varias cosas, y son las que importan.

Lo que no viaja, con nombre:

Ninguna tasa. 14 %, 29 %, 90 %, 57 %, 97 %: todas son de una frase en una pareja de un corpus. No dicen nada de cuántas contradicciones encuentra el producto en el corpus de un cliente.
La comparación “14 % contra 90 %” tal como se presentó: producto entero contra herramienta sin puerta ni verificador, poblaciones distintas. No debió hacerse como comparación; sí como dos mediciones separadas.
La lista de palabras de escape: sale de un caso y es una hipótesis, no un resultado.
Las predicciones mías numeradas sobre D y el quinto en cantidades de veinte: son de caso, no de producto, y así se cuentan.

Lo que sí viaja, porque es de existencia o de dirección, no de tasa:

Un caso puede estar entero delante del juez, con el bloque del principio en el prompt, y no salir en la lista abierta, mientras sale en una pregunta cerrada sobre dos trozos con el mismo bloque. Prueba de existencia: la forma de la pregunta pesa más que el contenido del prompt.
Un caso con dos lecturas produce respuestas partidas que nombran el escape por los dos lados. Prueba de existencia: el desacuerdo entre tiradas detecta lo discutible. El 57 % no viaja; que se parta y nombre el escape, sí.
El verificador con dos preguntas obligatorias no mata a ciegas y contesta siempre, 42 pasadas y 186 veredictos. Es mecanismo, y es lo mejor medido de esta adenda.
El coste por análisis, 0,031 $, viaja solo como orden de magnitud para documentos de este tamaño.
Y lo que viaja más que todo: el método. Predicción escrita, banda prerregistrada, criterio congelado con huella, recuento repetido cuando el primero salió ilegible.

Lo que permiten las preguntas P4 a P7: no son de tasa, son de diseño: qué hacer cuando el juez discrepa consigo mismo. Para eso basta un caso que lo demuestre, porque es de existencia. No son las preguntas equivocadas. Lo equivocado sería contestarlas con números.

P2 · Qué medir para hablar de un producto, de más barato a más caro

La curva de acumulación (E5) sobre las tres parejas con siembra, veinte pasadas cada una. Dice cuántos hallazgos distintos puede llegar a emitir el juez y cuántas pasadas los capturan. El método viaja aunque los números no.
La tasa de “sí” por error en parejas sin conflicto, cien parejas, tres tiradas. El único parámetro de la pasada 2 que es del producto y no de un caso. Decide la regla de tiradas con dato propio.
Etiquetado humano de todo lo publicado en veinte análisis reales, verdadero o falso, por el director. Precisión sobre una población de producto.
Un segundo corpus, de otro dominio, con diez conflictos sembrados de cinco clases: directo, con puente escrito, aritmético, con excepción de alcance, y mediado por definición lejana. Separa “funciona aquí” de “funciona”. Sintético o público; que no se haya escrito mirando al juez.
El corpus de un cliente, con acuerdo de confidencialidad. Lo único que mide el producto.

P3 · Mecanismo o caso

Como vosotros, con tres matices:

Mecanismo: el cambio del verificador; el coste como orden de magnitud; la prueba de existencia “forma de la pregunta sobre contenido”; la prueba de existencia “desacuerdo detecta disputa”; la monotonía del reparto de F-127, que es matemática.
Caso: todas las tasas; la refutación de “A tapa a D”, verdadera aquí y muda sobre otras parejas; la lista de escapes.
Doctrina, ni mecanismo ni caso: “la prelación nunca filtra”, “nada se borra solo”, “el sello lo pone quien verifica”. No se miden; se eligen.

P4 · Qué hacer cuando el juez discrepa consigo mismo con argumentos por los dos lados

No afirmar. Misma respuesta del 02/11, ahora con prueba: el quinto, con el §6.1 delante, produce respuestas que lo usan para afirmar y respuestas que lo usan para negar. Eso es la definición operativa de “discutible”. Un producto que firme lo que su propio juez no decide está firmando una tirada.

Callar, tampoco, por la asimetría de vuestro argumento: el falso negativo no se ve nunca. Entre afirmar y callar está registrar: contar cuántos hay y, si un día se decide, enseñarlos sin firma. Si se enseñan no lo deciden las mediciones; lo decide el producto, y lo decidió el director el 01/11.

P5 · La pieza estaba, el juez la usó, y no decidió

Cambia: la pregunta “¿cuál es la unidad cuando la pieza no está?” se disuelve, porque la unidad era correcta: pareja más puente, y el puente estaba. Lo incorrecto era suponer que un puente presente decide. Un puente puede ser él mismo ambiguo: “verifica el cumplimiento de un protocolo concreto” no lleva ninguna palabra de la lista de escapes y abarca más de lo que su autor quiso. Consecuencia: la lista de escapes baja de “regla que decide” a “señal que marca”. Decide el acuerdo entre tiradas; y por esta vía también, “dos de tres” era la regla correcta frente a “una de tres”: con una sola tirada, un puente ambiguo se firma la mitad de las veces.

Confirma: el eje es el escape, no “escrito o deducido”. El §6.1 está escrito, es una definición, se citó, y tiene escape por amplitud. Nivel 3 con puente escrito.

P6 · Qué le pasa a la especificación

El acuerdo entre tiradas sube a único criterio de firma. La lista de escapes queda como señal con contador propio, escape.marcado; no baja un hallazgo por sí sola hasta que se mida que acierta.
“Sin puente citado” se mantiene como señal, no como regla.
La jerarquía no se toca.
P-F130-17, reescrita: de 0,031 $ a entre 0,045 y 0,06 $ por análisis, medido con el registro por llamada.
Las predicciones 12 y 13 se reescriben como de producto: D firmada por la pasada 2 en el producto entero, 19 de 20 o más; el quinto, nunca firmada, 20 de 20. Recuento estricto, huella antes de contar.
Vuestros cuatro defectos: pasadlos. La dirección no ha cambiado; ha cambiado el peso de una pieza.

P7 · Visible o no afirmado

No son dos direcciones; son dos preguntas. La mía era de mecanismo: cómo se separa lo discutible de lo apretado antes de publicar. La respuesta es el acuerdo, y las mediciones la sostienen. La del director es de producto: qué se hace con lo separado. La respuesta del 01/11 es no afirmarlo y no construir nada cuyo objetivo sea cazarlo. Las mediciones no deciden eso.

Son compatibles tal como está escrito: la pasada 2 se construye para los niveles 1 y 2; los discutibles aparecen como subproducto de hacer preguntas cerradas, y el acuerdo los aparta de la lista firmada. El interruptor de pantalla está apagado. Queda un contador, que no es un mecanismo de caza: es saber cuántos hay. Si el director prefiere que ni el contador exista, se quita; yo lo dejaría, porque es gratis y “no sabemos cuántos” es peor que “sabemos y no los enseñamos”.

Sobre vuestra lectura, lo que está de más

“El quinto no es alcanzable”: de más. Es alcanzable, 12 de 21 lo alcanzan. Lo no alcanzable es firmarlo: el caso no admite respuesta estable porque la pieza que decide es ambigua. No es que el sistema no vea el conflicto; es que el conflicto no tiene una verdad que ver.
“La diferencia 3 de 21 contra 36 de 40 es de foco y no de alcance”: de acuerdo, con la corrección de que las dos cifras no son comparables entre sí. Se sostiene la prueba de existencia, no la magnitud.
La decisión del 01/11: coherente, y ahora con prueba de que el caso que la motivó es discutible.

PREGUNTAS DEL DIRECTOR, HECHAS EN CONVERSACIÓN (04/11, 21:49–21:55)

D1 · “¿La pasada 2 sigue siendo comparar una parte concreta con otra y hacer dos preguntas genéricas? ¿Ha cambiado?”

No ha cambiado. El código arma parejas de párrafos que hablan de lo mismo, y a cada pareja se le hacen dos preguntas obligatorias: la del dato, “¿dicen cosas distintas sobre el mismo dato?”, que caza “72 horas” contra “7 días”; y la del cumplimiento, “si son reglas, ¿se pueden cumplir las dos a la vez, y si una permite algo, se puede cumplir la otra usando el permiso?”, que caza D. Son genéricas porque son las dos únicas formas en que dos textos pueden chocar. No saben nada de D en concreto.
Lo que cambió hoy va alrededor, no dentro: las tiradas se repiten tres veces y se firma con dos; la lista de escapes pasa de decidir a marcar; y todos los porcentajes son de estas cinco frases, no del producto.
El quinto entra por la primera pregunta, “¿es el mismo dato?”, y ahí el juez se parte, porque “revisar” y “auditar” pueden ser lo mismo o no. Ese partirse lo manda a “posible”. No hace falta una tercera pregunta; hacen falta las tres tiradas.

D2 · “¿Eso es lo que determina que D salga? ¿No hace falta el ejemplo ad hoc?”

Lo que hace que D salga es la segunda pregunta. Pero el prompt lleva un bloque, añadido en F-129 y F-130, que dice que una razón que enuncia un principio cuenta como regla aunque no diga “nunca” ni “debe”, con el ejemplo del taller. Ese bloque está en las dos condiciones medidas, herramienta y producto, y nadie ha probado la pregunta cerrada sin él. Hoy no se sabe si D sale por las dos preguntas solas o por las dos preguntas más el bloque.
Lo que se puede razonar: D tiene dos mitades posibles en CLI-12. La de §3.5 lleva “nunca” y es regla a la vista: la segunda pregunta la coge sin ayuda. La de §3.1 es una explicación, “responde a un criterio de separar”: para tratarla como regla el juez necesita que se le haya dicho que un principio enunciado cuenta. Ahí trabaja el bloque.
¿Es ad hoc? El bloque no habla de D ni de clínicas; dice una cosa general, “un principio enunciado como razón es una regla”, que es una clase: cualquier manual que explique “esto se hace así para mantener X separado de Y” cae ahí. Está escrito mirando a D, como casi todas las aclaraciones. Sería ad hoc si solo funcionara con la frase de D, y eso se mide.
Medición pendiente, veinte tiradas, gratis: la pregunta cerrada sin el bloque del principio, sobre las dos parejas de D. P-F130-23: con §3.5, D sale 16 de 20 o más sin el bloque; con §3.1, cae a 10 de 20 o menos sin él, y vuelve a subir con él. Si sale así, el bloque se queda, porque cubre una clase real. Si D sale igual sin él en las dos parejas, el bloque sobra y se quita: un prompt más corto se desvía menos.

Predicciones, de producto

P-F130-20: la tasa de “sí” por error en cien parejas sin conflicto está entre 2 y 5 % por tirada.
P-F130-21: la curva de acumulación sobre NOR-10 ↔ CLI-12 se aplana entre 7 y 9 distintos antes de la décima pasada.
P-F130-22: en el segundo corpus, con cinco clases sembradas, la pasada 2 encuentra las de nivel 1 y puente escrito en 18 de 20 o más cada una, y la mediada por definición lejana en 6 de 20 o menos.
P-F130-23: la del bloque del principio, arriba.

---

## ADENDA DEL ARQUITECTO DEL 06/11/2026, LITERAL (archivada por Code el 06/11/2026)

*Entrega a Fable de los defectos de su especificación que pidió en su adenda del 04/11 («Vuestros cuatro defectos: pasadlos»); no
es una consulta nueva. Escrita por el arquitecto con las citas de Code delante, revisada por Code contra el archivo en cuatro pasadas
(citas literales, atribuciones, cifras y procedencia) y validada antes de mandarla. Pegada por el director a Code y sacada aquí del
registro de la conversación con un script, sin copiarla a mano; huella sha256 `aca3099aa8b221eb`. Sustituye a la versión archivada en
`78b86628`, que decía «tres que salieron al cotejar»: de esos tres, dos salieron del cotejo y uno del razonamiento del arquitecto,
y la corrección es de procedencia. Va tal cual, con sus encabezados: los «#» de abajo son del texto de la adenda, no secciones de
este fichero. Las autocorrecciones entre paréntesis son del arquitecto y van a la vista de Fable a propósito (decisión suya).*

# Adenda a F-130 · los nueve defectos de la especificación, y la pregunta que decide el paso 4

**Del arquitecto, 06/11/2026.** No es una consulta nueva: es la entrega de lo que pediste en tu
adenda del 04/11 («Vuestros cuatro defectos: pasadlos»). Van nueve, no cuatro: cuatro de entonces,
**dos** que salieron al cotejar tu adenda contra el repositorio (el p = 1 y la pasada 2 en presente),
**uno** del razonamiento del arquitecto al suspender P-F130-23 (que tu medición no prueba tu
afirmación), y **dos** que llevaban archivados y el arquitecto no estaba contando.

**De los nueve, siete piden una decisión tuya y dos son informativos** (el 6 y el 7: sus cifras están
mal y tus conclusiones se sostienen igual; te los mandamos porque una cifra mal viaja). **Y hay una
décima cosa, en la sección 3, que no es un defecto: es la pregunta que decide si el paso 4 se
construye.**

**Cada uno lleva tu texto literal con su línea**, para que puedas comprobarlo sin fiarte de nuestra
paráfrasis. Las rutas abreviadas:

- **F-130** = `claude/consultas-fable/F-130_2026-10-28_que-decide-lo-que-un-juez-escribe.md`. Tu
  especificación es tu respuesta del 02/11, huella `56a18f52599e9b79`; tu adenda es la del 04/11.
- **Estado** = `claude/Estado_Y_Pendientes_14-10-2026.md`.
- **Predicciones** = `claude/Predicciones_34_Conflicto_Normativo.md`.

---

## 0. El estado antes de los defectos, porque cambia qué conviene que contestes

Tres cosas han pasado desde tu adenda, y las tres afectan a lo que la pasada 2 tiene que ser.

**0.1 · P-F130-23 ESTÁ SUSPENDIDO. No se corrió ningún brazo y no se vio ninguna cifra.** Se
suspendió el 05/11 por tres razones, dos de ellas medidas:

1. **El aparato de cuenta no lo resuelve.** Con el lector corregido, las 40 respuestas archivadas de
   la condición 1 dejan **16 indecidibles de 40** por ancla (20 por la regla del producto), y son de
   dos clases distintas: **7 porque la pregunta 2 no decide (NADA) y 9 porque decide citando un solo
   lado (PARCIAL)**.
   **Lo que mata la medición son los PARCIAL**, porque ensanchan el rango de las cotas: el techo para
   que n = 42 vea una caída del 90 % al 50 % es **5 de 42 PARCIAL**, y hay **9**.
   Y subir el n no lo arregla: con el 20 % de PARCIAL lo que se compara en el peor rincón es
   **72 % contra 60 %**, una diferencia que no se estrecha al crecer el n, así que para un 80 % de
   potencia harían falta **unas 260 pasadas por brazo** (a 210 la potencia es del 70,7 %). Y con el
   32,5 % de la regla del producto la cota alta del brazo de retirada **supera** la baja del brazo 0:
   el signo queda invertido y ningún n lo arregla.
   *(El «72 contra 60» y el signo invertido son derivación del arquitecto; Code verificó las
   potencias, no la derivación.)*
2. **No hay palanca barata.** De las 6 respuestas a las que les falta el lado de CLI-12: **2 nombran
   el apartado por su número sin citarlo, 2 parafrasean el principio fuera de comillas, 1 no menciona
   nada reconocible y sólo 1 cita un trozo más corto.** Así que acortar el ancla no bajaría los
   indecidibles: hay **una sola** respuesta que un discriminador más barato recogería. *(Code había
   escrito «4 de las 6 no citan CLI-12 de ninguna forma» y lo corrigió él mismo contra su propio
   desglose al revisar esta adenda. La conclusión se refuerza.)*
3. **Y la de fondo, que es el defecto 9 de esta lista.**

**0.2 · LA PASADA 2 NO TIENE HOY NINGÚN BENEFICIARIO MEDIDO.**

- **El quinto:** el 04/11 se puso la pregunta cerrada sobre su pareja, en la herramienta, contra su
  propia pasada abierta. **12 de 21 contra 9 de 21: no se distingue** (Fisher p = 0,538). La banda
  alta tenía **94,8 % de potencia prerregistrada** si el quinto se comportara como se creía que se
  comportaba D: la medición tenía fuerza para ver el efecto y el efecto no está.
- **Y cómo sale, que importa más que cuánto:** la predicción P-P3-2 decía que el quinto, siendo un
  caso de dato, debía salir por la pregunta 1, y que **si dispara la pregunta 2 el juez lo está
  leyendo en la familia del cumplimiento**. Con el lector corregido, sobre las dos tandas:
  **la pregunta 2 disparó en 14 de 23** (60,9 %), y la vía 1 limpia en 9 de 23 (39,1 %, Wilson
  22,2–59,2 %). **P-P3-2 falla.** La magnitud no está fijada (contra la mitad, p = 0,405), así que
  lo sostenible es «la 2 dispara en torno a la mitad de las veces o más».
  **Con su salvedad: las dos tandas no están en las mismas condiciones.** La primera se declaró
  ILEGIBLE en su momento, con la regla de entonces —fue la que obligó a endurecer el lector—, así
  que sus cifras salen de releerla hoy. Por separado: 6 de 12 la primera, 8 de 11 la segunda, y
  entre ellas Fisher p = 0,400.
- **D:** la tanda equivalente —pregunta cerrada sobre la pareja sembrada §2.4 ↔ §3.5, 42 pasadas—
  está **prerregistrada desde el 04/11 y NO SE HA CORRIDO**. Es el siguiente paso del arquitecto,
  con una duda abierta: puede chocar con el mismo problema de recuento que suspendió P-F130-23, y
  eso se comprueba gratis antes de gastar nada.
  **Y su referencia prerregistrada NO es la base del producto**, justamente para no repetir el cruce
  del 0.3: «REFERENCIA: el quinto, 12 de 21, congelado. Mismas condiciones. NO la base del producto
  (0 de 21): eso es publicado por el pipeline entero y repetiría el cruce.» *(El arquitecto escribió
  «contra sus 0 de 21» en el primer borrador de esta adenda: el cruce retirado el 04/11, cometido por
  tercera vez. Lo cazó Code antes de mandarla.)*

**0.3 · EL «90 % CONTRA 14 %» QUEDÓ RETIRADO EL 04/11, y conviene que lo sepas porque sostenía la
pasada 2 en nuestras cabezas.** Los dos números se citaron **por el §3.1**, y entre ellos cambian
tres cosas a la vez: producto entero publicado frente a sólo el juez sin puerta ni verificador;
pregunta abierta frente a cerrada; y dos reglas de cuenta distintas (el 36 de 40 se contó con un
ancla sola y sin leer veredicto). Ese cruce de condiciones **ya se había corregido el 31/10 y la
semana 0 lo reintrodujo: fue una regresión, no un error nuevo.** Y ninguno de los dos números es la
D sembrada.

---

## 1. Los nueve defectos

### 1 · `nivel_1` está del revés

**Tú, F-130:604-605 y 608:**

> acuerdo ≥ UMBRAL_FIRMA y (nivel_1 o puente sin escape) → comprometido.
>
> nivel_1: las dos citas comparten al menos 3 términos clave normalizados, o nombran el mismo valor
> numérico o fecha con valores distintos. Ficha con caso decisivo.

**Lo medido** (Code, 02/11, con el normalizador de la puerta de citas y una lista mínima de palabras
vacías; Estado:554-570):

| Caso | Nivel que le toca | Citas | Términos compartidos | ¿`nivel_1` con umbral 3? |
|---|---|---|---|---|
| A | 1 | 21 | 6 | **sí** |
| B | 1 | 21 | de 1 a 5 | **no en 4 de 21** |
| C | 1 | 21 | 5 | **sí** |
| D | 2 | 3 | 2 | no |
| el quinto | 3 | 5 | 4 (5 unificando singular y plural) | **sí** |

**El defecto: el filtro mete al quinto, que es de nivel 3 —y lo mete siempre—, y deja fuera a B, que
es de nivel 1 y está sembrado, en 4 de sus 21 pasadas.** Hace lo contrario de lo que su nombre
promete.

**Y hay un segundo filo, más flojo de lo que el arquitecto escribió primero y corregido por Code
antes de mandarte esto.** Tu enumerador de parejas, F-130:277:

> Enumerador de parejas: vecinos vectoriales por trozo, que ya se calculan, más solapamiento de
> términos clave.

**La mitad de ese criterio es lo mismo que `nivel_1` usa después para puntuar.** No es «exactamente
lo mismo» —son vectores **más** términos—, y así lo escribió el arquitecto en el primer borrador,
heredándolo de una nota interna del 02/11 que también lo exageraba.

**Y por eso esto va como PREGUNTA y no como afirmación, porque no está medido: ¿te preocupa que la
mitad del criterio con que se emparejan los párrafos sea el mismo con que después se puntúan?**
Nuestra sospecha es que el filtro tendería a ser verdadero por construcción, pero es una sospecha.
**Lo que sí está medido es el primer filo: la tabla de arriba.** *(Y va en condicional a propósito:
tu enumerador está propuesto, no construido. Escribirlo en presente sería el defecto 8 cometido por
nuestro lado.)*

**Qué necesitamos:** `nivel_1` definido por algo que no sea contar términos compartidos.

### 2 · El orden de las dos ramas, y el escape buscado sólo en la frase del puente

**Tú, F-130:604-605 y 609:**

> acuerdo ≥ UMBRAL_FIRMA y (nivel_1 o puente sin escape) → comprometido.
> acuerdo ≥ UMBRAL_FIRMA y (puente con escape, …) → presentado.
>
> escape(puente): lista fija en fichero propio: "sin perjuicio", "a efectos de", "salvo", "excepto",
> "habitualmente", "en general", "normalmente", "siempre que", "en su caso". Con ficha.

**El defecto, tal como lo archivamos** (F-130:651-653):

> La función `salida(hallazgo)` tiene un defecto, y no se construye nada hasta resolverlo: un
> hallazgo `nivel_1` con puente con escape cumple las dos ramas, y la de «comprometido» va primero.
> […] Detalle en el estado vivo (pendiente principal de F-130).

Y el segundo filo, medido sobre el caso del quinto (Estado:542-546, 566-573): **el escape se busca
sólo en la frase del puente**, y en el §4 de CLI-12 hay tres frases candidatas a puente; **la más
natural, la definición, no lleva ninguna palabra de tu lista** — sólo la del conflicto terminológico
lleva «a efectos de» y «sin perjuicio». Así que el escape no dispara donde tendría que disparar, y
sin puente, un `nivel_1` se firma.

**Las tres propuestas de Code, sin construir y sin decidir, van tal como están escritas:**
1. el escape buscado en **todo el apartado** del puente y no sólo en su frase;
2. que `nivel_1` **no pueda firmar** un hallazgo cuyo puente sea una definición que hay que aplicar;
3. `nivel_1` definido por algo que no sea contar términos.

**Aviso de atribución:** el «veto del escape» que se te mencionó no es tuyo. **Lo propuso el
arquitecto el 02/11** y Code lo encontró insuficiente. Va en la sección 2 de esta adenda, entre lo
nuestro, para que no pierdas tiempo defendiendo algo que no escribiste.

### 3 · Dos autocontradicciones: pides el resultado y prohíbes el medio

**Tú, F-130:591, 612 y 628:**

> Campo opcional por respuesta positiva: `puente: { documento: "nuevo"|"existente", cita: "…" }`.
> **Literal.**
>
> Con el interruptor encendido: llamada al verificador […] "una por lectura, sin afirmar ninguna",
> campo `lecturas: [a, b]`.
>
> **Lo que no se toca: puerta de citas, verificador de lote**, pantalla salvo el bloque de notas,
> todo lo congelado.

**El defecto** (Estado:583-585): **el puente es una tercera cita literal y tiene que pasar por la
puerta de citas**, que tu propio texto dice que no se toca. Y **las «dos lecturas» las escribe el
verificador**, que también dice que no se toca.

### 4 · Tercera contradicción interna: «Pasada 1 sin cambios» y una línea nueva en el prompt del juez

**Tú, F-130:554:**

> D1 · "Tres pasadas y se encarece mucho." No son tres análisis. **Pasada 1 sin cambios.** […]

**Y tú, F-130:593:**

> **Línea en el prompt cerrado y en el del juez:** "Una cláusula que dice qué documento prevalece
> sobre otro no elimina una contradicción. Si los dos documentos chocan, […] la cláusula va aparte,
> en `jerarquia`."

**El prompt del juez ES la pasada 1.** Así que la especificación dice no cambiar la pasada 1 y a
continuación la cambia.

**Y la consecuencia de medición** (Estado:586-587): esa línea **no podía entrar hasta después** de la
medición con el verificador nuevo, porque si entraba antes su efecto se mezclaba con el que se estaba
midiendo. Eso quedó archivado como «la trampa de secuencia» y lo encontró Code.

**Pero eso ya no es lo que la retiene:** la medición con el verificador nuevo se hizo el 02/11. **La
línea sigue fuera porque tu especificación no se construye** mientras no vuelvan estos nueve
defectos. La contradicción interna se sostiene; lo que estaba desfasado era el motivo que le puso el
arquitecto, y lo cazó Code al revisar esta adenda.

### 5 · El choque de nombres de los pasos

**Tú, F-130:589, 595, 601, 614 y 624:**

> En el **paso 2** (prompt cerrado y formato):
> En el **paso 3** (llamada por lote): [DECISIÓN DEL DIRECTOR]
> En el **paso 5** (unión y desduplicación):
> En el **paso 7** (arnés), n = 20:
> **Paso 6**, subido de prioridad, después de activar la pasada 2: extracción de cláusulas de
> prelación por documento al indexar, tabla propia, nota en análisis y consulta en chat.

**El defecto** (Estado:575-582): tus pasos 2, 3, 5, 6 y 7 **no son los del plan de cinco pasos de la
casa** (1 verificar qué recibió el juez, 2 el verificador, 3 la pregunta cerrada del quinto, 4 la
pasada 2, 5 E5). **Casi toda tu especificación cae dentro de NUESTRO paso 4**, y tu
«paso 6» va detrás de él. Leerla como que se reparte por cuatro pasos del plan y añade un sexto es
falso por la numeración.

**Una honestidad del arquitecto aquí:** citó una frase tuya, «se inserta en cuatro pasos y añade un
sexto», **que no está en la versión definitiva archivada de tu respuesta** — Code lo comprobó con
`grep`. El arquitecto cree que es literal de una versión sustituida que Code nunca recibió. **Así
que esa frase no se te atribuye en esta adenda**: el defecto es la ambigüedad de numeración, que sí
está en el texto archivado.

**Qué necesitamos:** que renumeres tus pasos como subpasos de nuestro paso 4, o que les des otro
nombre.

### 6 · Dos cifras mal en la tabla de D9

**Tú, F-130:582-583:**

> 3 de 4 | 94,8 % | 31 % | **0,04 %**
> 3 de 5 | 99,1 % | 50 % | **0,08 %**

**Lo correcto** (F-130:647-650, cuenta binomial del arquitecto comprobada por Code): «3 de 4» da
**0,011 %**, no 0,04 %; y «3 de 5» da **0,026 %**, no 0,08 %.

**Y no cambia nada de lo que concluiste con ella.** En tu tabla, 3 de 5 **ya era** mejor que 2 de 3
en D (99,1 % frente a 97,2 %) y en los falsos (0,08 % frente a 0,26 %); corregida sigue siéndolo y
sólo bajan los falsos. **Las dos tablas apoyan lo mismo**, y empezar con 2 de 3 se mantiene. La tabla
recalculada está en `Predicciones_34_Conflicto_Normativo.md`.

**Así que este defecto es informativo, como el 7: te lo mandamos porque la cifra viaja, no porque
mueva una decisión.** *(El primer borrador decía que la tabla sin corregir apoyaba otra conclusión.
Era falso y lo cazó Code.)*

### 7 · Un p pegado a una comparación que no se hizo

**Tú, F-130:675:**

> Mi "hipótesis principal: A suprime a D" de F-130 cae: **20 de 20 con A dentro y 16 de 20 sin ella,
> p = 1.** Lo que sobrevive del mecanismo es la forma de la pregunta y el foco, no la cobertura por
> lo ya escrito. Contada como fallada.

**Lo archivado** (`Medida_F130_E3_Y_Vecindad…:490-511, 557`), que son **tres tandas del 30/10 y no
dos condiciones**:

- condición 1, **con A dentro** (los trozos enteros NOR-10·4 ↔ CLI-12·3): **20 de 20**;
- la misma condición 1, **repetida un cuarto de hora después**: **16 de 20**;
- condición 2, **sin A** (sólo la frase del permiso y la del principio del §3.1): **20 de 20** con la
  regla escrita, o **16 de 20** con la comprobación literal (en cuatro respuestas el permiso iba
  parafraseado, no citado).

Las cuentas: **p = 1 es 20 frente a 20** (la condición 1 contra la condición 2, por la regla
escrita). **p = 0,106 es 20 frente a 16** (la condición 1 contra la condición 2, por la comprobación
literal). **Ninguna de las dos es «16 de 20 sin A, p = 1».**

**Tu conclusión se sostiene con cualquiera de las dos cuentas: con A y sin A no se separan.** Lo que
falla es el número que la acompaña. Con dos límites que también van: **las tres tandas se contaron
con la regla laxa** (un ancla del lado de NOR-10, sin leer veredicto y sin exigir la cita de
CLI-12), y **las tres son de la pareja del §3.1.**

### 8 · La pasada 2 descrita en presente — y aquí preguntamos, no acusamos

**Tú, adenda del 04/11, F-130:753-754:**

> No ha cambiado. **El código arma parejas** de párrafos que hablan de lo mismo, y a cada pareja **se
> le hacen dos preguntas obligatorias**: la del dato […] y la del cumplimiento […], que caza D. Son
> genéricas porque son las dos únicas formas en que dos textos pueden chocar. No saben nada de D en
> concreto.
>
> Lo que cambió hoy va alrededor, no dentro: **las tiradas se repiten tres veces y se firma con
> dos**; la lista de escapes pasa de decidir a marcar […]

**Y tú, F-130:741:**

> Son compatibles tal como está escrito: **la pasada 2 se construye** para los niveles 1 y 2; los
> discutibles aparecen como subproducto de hacer preguntas cerradas […] **Queda un contador**, que no
> es un mecanismo de caza: es saber cuántos hay.

**Lo que hay en el repositorio** (Predicciones:3301-3305): **nada de la pasada 2 en `lib/`, en `app/`
ni en `worker/`** —las únicas menciones son de la herramienta de medida—, y ningún `escape.marcado`.
Lo último escrito es «**no se construye todavía**» (línea 317).

**La pregunta, y la hacemos así porque no lo hemos comprobado: ¿es una lectura de tu propia
especificación como si describiera código existente, o se la describimos nosotros como construida en
la consulta?** El arquitecto dijo que iba a comprobar si la culpa era de nuestra consulta y **no lo
ha hecho**, así que no te lo imputamos. Si fue nuestro, dilo y lo corregimos en el archivo.

**Importa porque toda tu especificación se lee distinto** según si crees que estás describiendo algo
que funciona o encargando algo nuevo.

### 9 · Tu medición no pone a prueba tu afirmación

**Tú, adenda del 04/11, F-130:762:**

> ¿Es ad hoc? El bloque no habla de D ni de clí[nicas]… "un principio enunciado como razón es una
> regla", **que es una clase**: cualquier manual que explique "esto se hace así para mantener X
> separado de Y" cae ahí. Está escrito mirando a D, como casi todas las aclaraciones […]
>
> Medición pendiente, veinte tiradas, gratis: **la pregunta cerrada sin el bloque del principio,
> sobre las dos parejas de D.** P-F130-23: con §3.5, D sale 16 de 20 o más sin el bloque; con §3.1,
> cae a 10 de 20 o menos sin él, y vuelve a subir con él. Si sale así, el bloque se queda, porque
> cubre una clase real.

**El defecto, y es el de fondo** (Predicciones:5399-5405, 5417-5419):

**Afirmas que el bloque describe una CLASE, y propones medirlo QUITÁNDOLO DEL CASO QUE LO INSPIRÓ.
Eso mide dependencia, no generalidad.** Un bloque perfectamente general **también** haría caer a D
al quitarlo, porque D es un miembro de la clase. Así que el resultado que predices es compatible con
las dos hipótesis y no las separa.

**«Ad hoc» significa «sólo funciona en el caso para el que se escribió». La prueba de eso no es
quitar la regla de ese caso: es aplicarla en otro sitio.**

**Y un segundo problema, en tus bandas** (derivadas por el arquitecto con Fisher exacto bilateral, no
heredadas). **Van contra un brazo con bloque SUPUESTO de 19 de 20, porque ese brazo no se corrió
nunca:** son aritmética sobre un supuesto, no sobre una medición.

- **«10 de 20 o menos»** contra ese 19 de 20 da **p = 0,0033**. Buena: esa banda está bien elegida.
- **«16 de 20 o más» da p = 0,3416, y su Wilson va del 58,4 % al 91,9 %.** Ese intervalo contiene a
  la vez «el bloque es imprescindible» y «el bloque es inútil». **No se puede leer como «el bloque no
  hace falta»: es un no-resultado.**
- Y entre las dos quedaban 11 a 15 de 20 sin asignar.

**Un dato que hace falta para que contestes esto bien: la pregunta cerrada SIN el bloque del
principio no se ha probado nunca, tampoco sobre el §3.5.** El único 6 de 7 de la pareja sembrada es
del **29/10 a las 12:05 UTC** y corrió con `a58deaf8`, que **ya llevaba el bloque**. Tu frase «nadie
ha probado la pregunta cerrada sin él» es cierta también para el §3.5.

**Y el obstáculo real:** no hay en todo el repositorio **ningún otro caso de la clase «una permisión
contra un principio»**. El corpus es uno solo (Dentavia); `SIEMBRA_caso_control` tiene plazo, lugar y
negación categórica sobre el color de un contenedor, y su propio registro declara que no trata de
cargos ni de personas. **Probar la generalidad exige documentos que no existen**, y eso es una
decisión de coste del director, no una medición que se pueda plantear hoy.

---

## 2. Lo que es NUESTRO y no tuyo, para que no gastes esfuerzo defendiéndolo

**2.1 · El «veto del escape».** Lo propuso el arquitecto el 02/11: que el escape se evaluara **antes**
que `nivel_1`, como veto. **Code lo encontró insuficiente** por el camino más probable (el §4 tiene
tres frases candidatas a puente y sólo la del conflicto terminológico lleva escape; la definición,
que es el puente natural, no lleva ninguno), y **el caso decisivo que el propio arquitecto pidió para
la ficha no se cumple con la regla tal como está: ese caso es el que la tumba.** No es un defecto
tuyo; es nuestro arreglo fallido. Las tres propuestas de Code del defecto 2 lo sustituyen.

**2.2 · El encaje con el catálogo de contadores.** `salida`, `presentado` y `jerarquia` **no son
etapas del catálogo cerrado de contadores** (`lib/analysis/counters.ts:36`), y tampoco el
`escape.marcado` de tu adenda. Ampliarlo exige su justificación en el contrato. **Es trabajo nuestro
al construir, no un defecto tuyo**, y lo apuntamos aquí sólo para que conste que lo sabemos.

---

## 3. La pregunta que decide el paso 4, y es la única que pedimos que contestes entera

Los nueve defectos de arriba se arreglan diciendo cuál de las dos versiones querías. **Esta no.**

**La pasada 2 se diseñó para rescatar los casos que la primera pasada se salta. Hoy no hay ningún
caso medido al que ayude:**

- del **quinto**, la pregunta cerrada dio 12 de 21 contra 9 de 21 de la abierta, **sin diferencia**,
  con 94,8 % de potencia para verla si existiera; y además **sale por la familia equivocada en 14 de
  23** (P-P3-2, fallada);
- de **D**, la medición equivalente está prerregistrada y **sin correr**, y puede que el aparato de
  cuenta no la resuelva, como no resolvió P-F130-23;
- y el **«90 % contra 14 %»** que la sostenía en nuestras cabezas **está retirado**, por cruce de
  tres condiciones a la vez.

**Así que: ¿la pasada 2 sigue mereciendo construirse, y sobre qué evidencia?**

Tres respuestas nos sirven y las tres son útiles. **No queremos que elijas la que nos deja mejor:**

1. **Sí, y el beneficiario es otro del que creíamos.** Dilo y di cuál, con qué se mide y qué
   resultado la justificaría y qué resultado la enterraría, **antes** de medirlo.
2. **Sí, pero primero hay que medir X.** Di qué es X, y si se puede medir con un corpus de ocho
   documentos de los cuales cinco son hojas de cálculo, que es lo que hay indexado hoy.
3. **No con esta evidencia.** Entonces el paso 4 se cierra o se aparca, y el plan de cinco pasos se
   queda en cuatro. **Esa respuesta es igual de bienvenida que las otras dos**, y es la que menos
   nos gusta escribir, razón por la que la escribimos.

---

## 4. Lo que necesitamos de vuelta, en una lista

1. `nivel_1` definido por algo que no sea contar términos compartidos (defecto 1).
2. El orden de las ramas de `salida(hallazgo)`, y si el escape se busca en todo el apartado del
   puente o sólo en su frase (defecto 2, con las tres propuestas de Code).
3. Cómo se obtiene el puente y las dos lecturas sin tocar la puerta de citas ni el verificador
   (defecto 3).
4. Si la línea de la prelación entra en la pasada 1 o no, y cuándo (defecto 4).
5. Tus pasos renumerados como subpasos de nuestro paso 4, o con otro nombre (defecto 5).
6. **Nada:** la tabla corregida no cambia nada de lo que concluiste. Informativo, como el 7.
7. **Nada:** el defecto 7 es informativo y tu conclusión se sostiene. Lo mandamos porque la cifra
   viaja.
8. Si la pasada 2 descrita en presente es lectura tuya o nuestra culpa (defecto 8).
9. **Y la pregunta de la sección 3**, que es la que decide si lo demás se construye (defecto 9).

**Y una cosa que te pedimos no hacer:** no propongas una medición nueva sin su banda, su tasa de
error y su potencia, y sin decir qué resultado la enterraría.

**Sólo el 05/11 el arquitecto retiró diez afirmaciones** — ésa sí es la cuenta del registro del
repositorio. De ellas, **unas cinco o seis fueron de procedencia** y el resto de otras clases, y la
clasificación es discutible. *(El primer borrador de esta adenda decía «nueve de las diez» y que esa
cuenta venía del registro. Ninguna de las dos cosas era cierta: era la lectura del arquitecto, y lo
cazó Code al revisarla. Es, literalmente, el error que la frase siguiente describe.)*

**Una cifra no viaja con un adjetivo que no se ha medido.** Vale para lo que mandamos y para lo que
nos llega.
