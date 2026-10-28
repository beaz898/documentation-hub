---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-130 · LA MITAD ENVIADA (el dictamen, en `claude/Dictamen_Fable_F130_El_Umbral_Movil_Y_La_Pasada_Por_Parejas.md`)
Asunto: qué decide lo que un juez escribe, y por qué un hallazgo inferencial sale 2 de 7 y uno directo 7 de 7
Fecha de envío: 28/10/2026 · Fecha de respuesta: 28/10/2026
Fuente: el texto llegó pegado en el encargo del arquitecto del 28/10/2026, archivado sin resumir y sin corregir nada.
        Los dos encargos anteriores remitían a él sin traerlo (regla nueva del protocolo: «un encargo que dice "el
        contenido literal que te pasa el director" sin llevarlo dentro no es un encargo»).
⚠️ Precedente que deja esta consulta (arquitecto, 28/10): su sección 0 NO LE DA A FABLE NUESTRAS OPCIONES, porque
        anclarle sale más caro que lo que informan.
⚠️ Dónde va el par: la casa lo archiva en un solo fichero en `claude/consultas-fable/`; el encargo pidió dos ficheros
        con estos nombres, y así quedan, enlazados entre sí y desde `claude/consultas-fable/INDICE.md`.
Cotejo de integridad: al pie de la cabecera del dictamen, con el método de F-121.
---

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
