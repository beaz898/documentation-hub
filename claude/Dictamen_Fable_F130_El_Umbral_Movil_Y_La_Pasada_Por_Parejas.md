---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-130 · EL DICTAMEN (la consulta enviada, en `claude/Consulta_Fable_F130_Que_Decide_Lo_Que_Un_Juez_Escribe.md`)
Asunto: qué decide lo que un juez escribe, y por qué un hallazgo inferencial sale 2 de 7 y uno directo 7 de 7
Fecha de envío: 28/10/2026 · Fecha de respuesta: 28/10/2026 (versión consolidada, con las preguntas del director)
Fuente: el texto llegó pegado en el encargo del arquitecto del 28/10/2026, «entero y literal», y se archiva sin resumir
        y sin corregir nada (tampoco la tabla de P2, que llegó aplanada en una línea).
ATRIBUCIÓN: la sección final, «PREGUNTAS DEL DIRECTOR», son seis preguntas (D1 a D6) que hizo EL DIRECTOR directamente a
        Fable, en conversación y sin pasar por el arquitecto, el 28/10 entre las 15:45 y las 19:45. De ellas salen la
        decisión, el plan exacto, su encaje con lo ya planeado y la comprobación de coherencia.
⚠️ LA LECTURA DEL ARQUITECTO NO ESTÁ AQUÍ: va al estado vivo (`claude/Estado_Y_Pendientes_14-10-2026.md`, sección de
        F-130), incluida su discrepancia con el «hueco obligatorio de respuesta por pareja» de D3 y del plan, marcada
        como suya.
Estado: ARCHIVADA CON DICTAMEN · se construye la segunda pasada por parejas, si E3 da 6 de 7 o más. Nada construido;
        las herramientas temporales de la semana 0 están en `app/api/admin/medida-f130/`.
Cotejo de integridad, 28/10/2026, con el método de F-121: sha256 del texto tal como queda archivado (saltos LF, sin
        salto final), 16 primeros hexadecimales; caracteres = puntos de código; palabras = trozos separados por espacio
        en blanco. Ninguno de los dos textos tiene espacios que no sean ASCII. Los 60 primeros y últimos, con escapes JSON.
        · CONSULTA: huella 24317c18a3aaa68f · 9932 caracteres (10424 bytes UTF-8) · 100 líneas · 62 no vacías ·
          1763 palabras.
          60 primeros: "CONSULTA A FABLE · F-130 · QUÉ DECIDE LO QUE UN JUEZ ESCRIBE"
          60 últimos:  " de los prompts del juez y del verificador si los necesitas."
        · DICTAMEN: huella 6fb8f9bee7d97ddf · 23052 caracteres (23716 bytes UTF-8) · 141 líneas · 71 no vacías ·
          4053 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-130 · QUÉ DECIDE LO QUE UN JUEZ ESCRI"
          60 últimos:  "50 análisis): ni “solo pasada 1” ni “solo pasada 2” es cero."
---

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
