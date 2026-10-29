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
        · ADENDA, (e): la respuesta de Fable del 29/10 sobre E3 (la pregunta enviada, PENDIENTE). Respuesta: huella
          90df305f7c0ad1f0 · 1017 caracteres · 7 líneas.
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

⚠️ LO QUE SE LE PREGUNTÓ NO ESTÁ AQUÍ: no ha llegado a Code. Por lo que contesta, se le consultó el formato de dos
preguntas de E3, la condición realista y las dos parejas; el texto enviado queda PENDIENTE, y no se reconstruye.
⚠️ El texto de E3 del anexo de los prompts (`F-130_anexo_textos_para_fable_2026-10-29.md`) es ANTERIOR a la línea que
esta respuesta motivó («LAS DOS RESPUESTAS NO PUEDEN CITAR EL MISMO PAR DE FRASES…»); la versión vigente está en
`app/api/admin/medida-f130/medida-f130.ts`. Fable propuso la comprobación «al validador»; el arquitecto la puso, para
E3, como línea de la pregunta.

LA RESPUESTA DE FABLE — literal, tal como la pegó el arquitecto

1. «Dos preguntas con respuesta obligatoria, dato y cumplimiento, en vez de una con tres salidas: correcto y mejor que lo que dicté. Es el hueco obligatorio aplicado dos veces, y evita justo lo que medisteis: que A ocupe el único hueco y D no se escriba. Añadiría una sola cosa al validador: que las dos respuestas no puedan citar exactamente el mismo par de frases, para que "cumplimiento" no sea una copia de "dato" con otra etiqueta.»

2. «E3 con los trozos enteros y A dentro: correcto, es lo que entregará el enumerador y es lo que mide. La variante de solo las dos frases no mediría la pasada 2, pero sí mediría el techo de la pregunta cerrada; descartarla es razonable, y si algún día E3 sale por debajo de 6 de 7, esa variante será la primera que querréis para saber si falla la pregunta o el contexto.»

3. «Las dos parejas por separado, condición en la de §3.1: correcto, y es vuestra propia regla de que una cifra pertenece a la pareja en que se midió. Sin choque.»

Cierre: «Nada de esto choca con F-130.»
