---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-130, adenda 3 y su respuesta
Asunto: qué hemos medido desde la respuesta de Fable del 11/11 (m1, d4b, SQL_34_13) y la respuesta, con las objeciones del director
Fecha de envío: 12/11/2026 · Fecha de respuesta: 12/11/2026, 09:50 (versión consolidada, sustituye a la de esa mañana)
Fuente: texto pegado por el director en el encargo del 12/11/2026. Los dos textos se archivan LITERALES, sacados por script del
        registro de la conversación, sin resumir y sin corregir nada.
Huellas (sha256, 16): a 9becff202fc13143 · b 564c1180c0d07cc9
⚠️ LA ADENDA 3 LLEVA ERRORES NUESTROS, rectificados por el arquitecto ANTES de archivarla (Predicciones_34_Conflicto_Normativo.md,
        «LAS SEIS RECTIFICACIONES DEL ARQUITECTO DEL 12/11»): las D sin el campo (la de d4b lo lleva); «no es el pajar»; «no es el cierre
        de lista»; la vez 7 como fallo de la puerta (fue una cita mal copiada); «A, B y C 42/42» y el agrupado 16 de 105 (se archiva el
        de Code: 6 de 49 con el prompt del producto); y el topic «refutado», que es lectura y no regla contada. Las cifras de m1 de
        las veces 10 a 14 están SIN VERIFICAR: la tanda le llegó cortada a Code.
---
## (a) LA ADENDA 3, tal como se envió a Fable

ADENDA 3 · F-130 · 12/11/2026
QUÉ HEMOS MEDIDO DESDE TU RESPUESTA, Y DÓNDE NOS DEJA

Hemos medido tu propuesta. El resultado va contra tu diagnóstico, y te damos el
dato, las dos cosas tuyas que SÍ se confirman, y lo que creemos que podemos
haber hecho mal nosotros. Dijiste que esto es común y que está resuelto
públicamente; si lo está, el error puede ser nuestro, y preferimos que nos lo
digas antes de gastar otra tanda.

─────────────────────────────────────────────────────────────────────────────
0 · RECORDATORIO MÍNIMO
El par sembrado: NOR-10 §2.4 PERMITE que el Coordinador de Calidad sea el
propio Director Clínico («figura que puede recaer en el propio Director
Clínico o en otro profesional designado por él»). CLI-12 §3.1 enuncia el
PRINCIPIO contrario («separar la responsabilidad de un proceso crítico de
seguridad del paciente de la persona que, en su rol de Director Clínico,
gestiona simultáneamente la agenda asistencial») y §3.5 lo prohíbe al tratar
la sustitución temporal («nunca por el Director Clínico del propio centro»).
Ese es el caso D: una permisión contra un principio.
Los otros tres casos sembrados (A: quién es el responsable último; B: control
biológico semanal contra mensual; C: caducidad 6 contra 12 meses) son
contradicciones de dato con dos valores.
Condiciones de todo lo que sigue: claude-haiku-5-5, maxTokens 16.000,
temperatura no enviada, esfuerzo medium, un solo par, el juez del producto con
el prompt del producto salvo donde se diga, 14 pasadas por brazo, todos los
brazos el mismo día y seguidos.

─────────────────────────────────────────────────────────────────────────────
1 · LA BASE DE DATOS DE PRODUCCIÓN (octubre, 21 pasadas sobre el mismo par)
D publicada en 3 de 21. En las otras 18 buscamos las marcas de D en las cuatro
listas y en los descartes del verificador de citas:
  contradictions 0 · overlappingContent 0 · uniqueToNewDoc 0 ·
  descartes por cita (contradicción) 0 · descartes por cita (solapamiento) 0
Control: las 18 pasadas guardaron las dos listas, así que son ceros reales y no
listas que no se vieron.
  → NO HAY COLOCACIÓN MAL HECHA. El juez no la escribió en ningún sitio. 18/18.
  → EL CIERRE DE LISTA NO ES EL MECANISMO AQUÍ: nada compitió por un hueco,
    porque nada se escribió. Los topes (10/5/10/10) no pudieron desplazarla.

⚠️ TU ÚNICA PREDICCIÓN FALSABLE, REFUTADA. Predijiste que el `topic` saldría
formulado como un dato con dos valores. Los tres son de FIGURA:
  · «Figura que puede ocupar el cargo de Coordinador de Calidad»
  · «Figura del Coordinador de Calidad y separación de funciones respecto al
     Director Clínico»
  · «Puede ser Coordinador de Calidad el propio Director Clínico»
D, cuando sale, no se mete a la fuerza en forma de dato.

⚠️ Y UN HALLAZGO QUE NO ESPERÁBAMOS: las tres D publicadas salen SIN el campo
`conflictoNormativo`, como `severity: contradiction` y nada más. El producto
encuentra D como una CONTRADICCIÓN ORDINARIA, no por la vía de la excepción.

Casi-acierto de la pasada 20: las dos figuras aparecen juntas en
`overlappingContent`, pero sobre quién es el interlocutor ante una inspección
sanitaria. El juez estaba en el barrio, en otra puerta.

─────────────────────────────────────────────────────────────────────────────
2 · TU PROPUESTA, MEDIDA (prosa primero, extracción al esquema después)
Dosis: el prompt del producto con 20 supresiones literales (1.101 caracteres:
nombres de campo, nombres de categoría, los topes, el ejemplo JSON, los valores
del conflicto normativo) y el bloque final de salida, de 1.194 caracteres,
sustituido por una instrucción de prosa de 450. Los documentos no se tocaron.
Segunda llamada: extraer, no volver a juzgar, al esquema del producto.
Detector: el mismo que el brazo de control, después de la puerta de citas.

  producto tal cual (una llamada JSON) ....... D 2 de 14
  prosa y luego extracción ................... D 3 de 14   Fisher p = 1,00
  umbral prerregistrado con el control en 2: 8 de 14. No se cruza.

─────────────────────────────────────────────────────────────────────────────
3 · LA MEDIDA QUE AÍSLA TU TESIS, y es la razón de esta adenda
Guardamos la prosa cruda de la primera llamada, que el producto no guarda:
  D aparece EN LA PROSA LIBRE ................ 4 de 14
  D llega al JSON ............................ 3 de 14
  la única perdida (pasada 7) la tiró NUESTRA PUERTA de verificación de citas,
  por no coincidir literalmente; no la perdió la extracción
  casos de D en el JSON sin estar en la prosa . 0

  → LA EXTRACCIÓN ES FIEL: el esquema no pierde nada de lo que la prosa trae.
  → CON EL ESQUEMA ENTERO FUERA DEL PASO DE GENERAR —sin un nombre de campo,
    sin topes, sin ejemplo JSON— EL JUEZ SIGUE SIN VER EL CASO EN 10 DE 14.
    El anclaje al esquema no es el cuello de botella.

─────────────────────────────────────────────────────────────────────────────
4 · LO TUYO QUE SÍ SE CONFIRMA, y no lo enterramos
  a) LA FORMA CAMBIA. Las tres D de la prosa salen con
     `conflictoNormativo: norma_contra_norma`. Las cinco D que tenemos medidas
     por la vía del producto (3 en producción + 2 en el control) salen SIN ese
     campo. Tu idea de separar el hallazgo de su clasificación sí consigue que
     el juez lo clasifique como conflicto normativo, que es para lo que estaba
     escrita la excepción y no ocurría nunca.
  b) ABRE UNA VÍA. Una de las tres salió anclada en §3.5, una vía con 0 de 42
     en una tanda anterior y 0 en producción. Todas las demás D que hemos visto
     van por §3.1.

─────────────────────────────────────────────────────────────────────────────
5 · TERCERA MEDIDA, EL TAMAÑO (la hicimos después de escribir lo anterior)
Redujimos el texto entregado 14,2 veces —de 121.936 a 8.612 caracteres: sólo
los fragmentos que contienen los cuatro casos, con la misma competencia y las
dos vías de D presentes—, mismo prompt, mismo detector:
  D 1 de 14. BAJÓ. Fisher contra el control p = 1,00.
  → NO ES EL PAJAR. Si el tamaño mandara, esto tenía que haber subido.

─────────────────────────────────────────────────────────────────────────────
6 · EL CUADRO COMPLETO DE TODO LO MEDIDO SOBRE ESTE PAR
                                        texto        D         IC95 % Wilson
  producción (21 pasadas) ............. 122.000   3/21  14,3 %   [5 % – 35 %]
  otro instrumento, prosa + 2 preguntas 122.000   7/42  16,7 %   [8 % – 31 %]
  producto, documentos enteros ........ 121.936   2/14  14,3 %   [4 % – 40 %]
  prosa libre, SIN esquema ............ 121.936   3/14  21,4 %   [8 % – 48 %]
  producto, trozos (14× menos) ........   8.612   1/14   7,1 %   [1 % – 31 %]
  ─────────────────────────────────────────────────────────────────────────
  TODO JUNTO ..........................          16/105 15,2 %  [10 % – 23 %]
  A, B y C en los brazos de hoy .......           42/42   100 %  [78 % – 100 %]
  D contra A/B/C: p = 3·10⁻¹³

La tasa de D no se mueve con el tamaño, ni con el formato, ni con la libertad
total de redacción. Los otros tres casos están en el 100 % en las mismas
pasadas y con el mismo prompt.

─────────────────────────────────────────────────────────────────────────────
7 · DONDE PODEMOS ESTAR EQUIVOCÁNDONOS NOSOTROS
  1. ⚠️ La dosis quitó EL ESQUEMA pero dejó LA TAXONOMÍA EN PALABRAS: la
     instrucción de prosa nombra «contradicción, inconsistencia menor,
     solapamiento, contenido exclusivo», porque sin eso la segunda llamada no
     tiene qué extraer y D se perdería por una tontería. Si tu tesis es sobre
     las CATEGORÍAS y no sobre los CAMPOS, no la hemos probado. Dinos si eso
     invalida la medida y cómo la harías tú.
  2. La instrucción de prosa es nuestra, no tuya. Si tienes una redacción de
     referencia, la usamos y repetimos la tanda.
  3. Un par, un día, 14 por brazo. Con esa n estamos ciegos a diferencias de
     15 a 25 puntos: lo que queda excluido es que esas causas sean DOMINANTES,
     no que su efecto sea cero. El estimador bueno de D es el 15 % agrupado.
  4. La fidelidad de la extracción se apoya en 4 positivos. Es poco.
  5. Dejamos la REGLA PRINCIPAL intacta, con tu bloque de excepción debajo.
  6. Restricción del corpus que limita qué experimentos podemos hacer: en el
     lado de CLI-12, la frase de A y el principio del §3.1 están en el mismo
     fragmento, así que «D sin A» no es construible. Es cómo se sembró.
  7. Nuestra implementación de tu propuesta tiene cuatro defectos que son
     NUESTROS y no tocan la cuenta de D (van por `contradictions` con citas
     reales), pero impiden llevarla al producto como está: `verdict` fuera del
     esquema en 14 de 14 («incoherentes», «incompatible», «no_alineado»…),
     19 citas vacías de 23 descartes, solapamientos de 3,1 a 1,0 por pasada,
     exclusivos de 9,9 a 4,6 y degradados a una palabra, y el caso A bajando
     de 14/14 a 12/14. Los arreglaremos si la propuesta sigue viva.

─────────────────────────────────────────────────────────────────────────────
8 · LO ÚNICO QUE NO HEMOS TOCADO, Y LO QUE VAMOS A MEDIR HOY
Nuestra REGLA PRINCIPAL, literal y en mayúsculas por encima de todo:
  «REGLA PRINCIPAL, POR ENCIMA DE TODAS LAS DEMÁS: antes de emitir cualquier
   hallazgo, verifica que los dos textos hablan del MISMO DATO CONCRETO. Si
   hablan de datos distintos, no hay nada que comparar y NO emites hallazgo,
   aunque ambos textos pertenezcan al mismo ámbito.»
Una permisión y un principio SON datos distintos en lectura literal. El bloque
que los rescata —el tuyo— va DEBAJO, como excepción.
Y encaja con el punto 1: las cinco D medidas por la vía del producto salen como
contradicción ordinaria, es decir, salen cuando el juez enmarca el par como UN
MISMO DATO («quién puede ocupar el cargo»), no cuando aplica la excepción.
Hipótesis: el orden de las reglas es la palanca, y el esquema nunca lo fue.
Medida de hoy: el mismo prompt con la excepción POR ENCIMA de la regla
principal, y la regla principal con una salvedad explícita para el caso
permisión-contra-principio. Mismo detector, 14 pasadas.

─────────────────────────────────────────────────────────────────────────────
9 · LO QUE TE PEDIMOS
  1. Con 4 de 14 en prosa libre y 1 de 14 con el texto reducido 14 veces,
     ¿sobrevive tu diagnóstico? Si sobrevive, ¿en qué forma?
  2. Si no es el formato y no es el tamaño, ¿cuál es el estado del arte para
     que un juez LLEGUE A VER una permisión contra un principio? No dónde la
     archiva: que la vea.
  3. ¿Es la jerarquía de reglas lo que hay que atacar, o estamos a punto de
     gastar otra tanda en una quinta explicación equivocada? Nos interesa tu
     lectura ANTES de que midamos, para que cuente como predicción.
  4. Una D verdadera murió en nuestra puerta de verificación de citas por
     diferencia literal de unos caracteres (pasada 7, lado existente, la cita
     no empezaba donde el texto). ¿Cuál es la práctica estándar: coincidencia
     difusa con umbral, offsets de carácter en vez de citas, pedirle al modelo
     los índices, o verificar por incrustación?
  5. Si al final el camino es trocear y comparar por parejas de fragmentos,
     nuestro tercer brazo dice que trocear POR SÍ SOLO no basta (bajó a 1 de
     14). ¿Qué hacen los mejores: una pasada específica por tipo de hallazgo,
     un juez distinto por tipo, dos pasadas con roles opuestos?

Seguimos en esto por tu frase, que nos la hemos quedado: «Un producto que no lo
encuentre es un producto que encuentra lo que un buscador encontraría.»

## (b) LA RESPUESTA DE FABLE (12/11, 09:50, consolidada)

ADENDA DE FABLE A F-130 · RESPUESTA A LA ADENDA 3
Versión consolidada, 12/11/2026, 09:50. Sustituye a la de esta mañana. Incluye las respuestas a las cinco preguntas del arquitecto y una sección con dos objeciones del director, que cambian el orden: antes de buscar por qué el juez no ve D, hay que medir si D es clara o interpretable. Si es interpretable, el caso se cierra.

Frentes decididos y sin commit desde hace más de 7 días: F-119 fase 2, 43 días. Este caso lleva seis semanas; el plan de abajo tiene un final escrito.

CUENTAS

Mi diagnóstico del 11/11 queda refutado como causa dominante. Predije D entre 18 y 26 de 42 con prosa primero y salió 3 de 14. Vuestra medida de la prosa cruda (4 de 14) lo aísla: con el esquema entero fuera, el juez sigue sin escribir D.
Mi «no es el tamaño del modelo» se queda sin apoyo. Lo sostenía que el juez veía D en pregunta cerrada, dato del instrumento retirado.
Mi «D no es interpretable» también se queda sin apoyo, por la misma razón (el 36 de 40). Hoy es mi lectura, no un dato.
«A tapa a D» vuelve a estar abierta. La di por refutada el 04/11 con datos del instrumento retirado. En el producto no se ha probado.
La predicción del topic la escribí sin regla de cuenta; fallo mío. Pero vuestra sección 1 la da por refutada y la 8 se apoya en la lectura contraria («enmarca el par como un mismo dato»). Fijad una regla y contadla como salga.
La frase del buscador exageraba. Tres de cuatro con citas literales y cero falsos ya es más que un buscador.

LO QUE DICEN VUESTRAS CINCO FILAS JUNTAS

D está en torno al 15 % cambiando el formato, el tamaño del texto y la libertad de redacción. La causa dominante está en lo que no ha variado en ningún brazo:

Los criterios del prompt: regla principal, regla de oro, «no fuerces», excepción debajo.
A encima de D por los dos lados. NOR-10 §2.4 remite a «la responsabilidad última del apartado 2.1», que es la mitad de A. El principio de CLI-12 §3.1 es la razón de la otra mitad de A, y el propio prompt dice que «una regla y su propia razón no son dos reglas».
El modelo y su esfuerzo.
La naturaleza del caso: que D sea clara o discutible. Esto lo añade el director, y va primero.

Dos matices a vuestra sección 1:

«Nada compitió por un hueco» descarta los topes, no que el juez deje de buscar. La prosa y los trozos lo dejan igualmente como no dominante.
La plantilla JSON final no lleva el campo conflictoNormativo. Que las D del producto salgan sin etiqueta puede deberse a la plantilla, no a qué regla aplicó el juez. Eso debilita la inferencia de la sección 8.

RESPUESTAS A LAS CINCO PREGUNTAS

1 · ¿Sobrevive el diagnóstico?
Como causa, no. Sobrevive solo que la forma cambia cómo sale D (con etiqueta, y una vez por §3.5), no si sale.

2 · Estado del arte para que un juez llegue a ver una permisión contra un principio
No conozco ninguna técnica que haga fiable esa detección en una lectura abierta de dos textos. Lo establecido cambia la tarea. Todo de entrenamiento, a verificar:

D tiene nombre en la industria: conflicto de segregación de funciones. Buscable: «segregation of duties conflict detection», herramientas GRC. Allí una persona escribe la tabla de funciones incompatibles y se cruza con las asignaciones.
Sobre texto, el sistema extrae cada norma a forma canónica (quién, modalidad, qué, condición) una vez por documento, y compara normas sobre las mismas figuras. Buscables: «norm conflict identification in contracts» (Aires y Meneguzzi, 2017), «requirements conflict detection», «deontic logic».
Las modalidades (obligación, permiso, prohibición, restricción) son clases de enunciado, no de error, así que no es un catálogo de parches. Es el destino de fichas, restringido a normas. No está medido aquí. Detalle en D1.

3 · ¿Es la jerarquía de reglas? Mi lectura antes de medir
Corred la tanda: prueba la constante 1. Mi predicción es que no cruza: entre 1 y 4 de 14.

Por qué: en el brazo de prosa la vía de la excepción ya se usó (3 de 3 con etiqueta) y la tasa no se movió. El orden cambia por qué puerta sale D, no que el juez conecte las dos frases.
Efecto que sí espero: más D con etiqueta, alguna por §3.5.
Si cruza 8, me equivoco. Sería un ajuste sobre un solo caso: P3 de Excel y el caso de control como criterios de reversión.

4 · La D que murió en la puerta de citas

Estándar si se sigue copiando: alinear por el tramo literal más largo con umbral, publicar siempre el tramo real del documento y verificar sobre él. Es vuestra (B).
Offsets pedidos al modelo: no, los modelos no cuentan caracteres.
Incrustación: sirve para localizar, no como puerta, porque acepta paráfrasis.
En dos llamadas la cita se copia dos veces y deriva más. La extracción debería devolver identificadores de segmento. Es la vía 2.

5 · Si el camino son parejas de fragmentos
El tercer brazo cambió el tamaño, no la tarea: misma lista abierta, mismo resultado.

Pasada o juez por tipo: es lo que hace la industria. Funciona y es un catálogo.
Roles opuestos: sirven para decidir sobre algo ya planteado, no para verlo. Buscable: «multiagent debate», Du et al., 2023.
Lo que evita el catálogo: normalizar antes de comparar (pregunta 2).

OBJECIONES DEL DIRECTOR, HECHAS EN CONVERSACIÓN (12/11, 09:38–09:45)

D1 · «Esa tabla de segregación la tendría que crear el usuario. El error se encontraría con ese documento, no con los que comparamos.»
En la versión industrial, sí. En la versión sobre texto, la tabla la saca el sistema de los documentos existentes:

Al indexar CLI-12, apunta la fila restricción: Coordinador de Calidad y Director Clínico, separados. La frase ya estaba en el manual.
Al indexar NOR-10, apunta permiso: el Coordinador de Calidad puede ser el Director Clínico.
Al analizar, cruza las filas que hablan de las mismas figuras y publica el choque con las dos frases originales como cita.

Límites: lo que ningún documento enuncia no se puede extraer, y nada de esto está medido aquí. Que el cliente añada reglas a mano sería un extra opcional.

D2 · «No es la distancia: A, B y C salen al 100 % en los mismos documentos. Y si D es interpretable, no debe marcarse.»
Tiene razón en las dos.

No es el tamaño. La diferencia es el tipo de relación: A, B y C son el mismo dato con dos valores; D exige conectar un permiso con un principio.
Hemos mezclado dos propiedades:
Difícil de ver: el juez no conecta las dos frases por su cuenta. Medido en D, 15 %.
Discutible: con las dos frases delante, lectores competentes discrepan. Medido en el quinto caso.
De D sabemos lo primero y no lo segundo.
Regla del director, que es la del producto desde el 01/11: solo se firma lo que se deduce sin duda leyendo las dos frases. En caso de duda, no se marca.
Consecuencia: medir la claridad de D va antes que cualquier diagnóstico. Si D es discutible, da igual por qué el juez no la ve.

QUÉ SE HACE, EN ORDEN, Y CÓMO

Paso 0 · Gratis, sin llamadas

a) Lectura humana. El director y una o dos personas más leen, en papel y sin contexto, el párrafo entero de NOR-10 §2.4 y el de CLI-12 §3.5.

Pregunta: «Los dos textos son de la misma organización y están vigentes a la vez. ¿Hay un conflicto entre lo que establecen?»
Respuesta: conflicto, compatibles o depende, más una frase.
Cada uno escribe la suya antes de ver ningún resultado del modelo.
Por qué: el director es el patrón contra el que se mide el juez. Si los lectores discrepan, D es discutible por definición.

b) Conteo en las 14 prosas guardadas. En las 10 sin D: en cuántas se menciona el principio de separación (dentro de A o en otro sitio) y en cuántas el permiso del §2.4. Cómo leerlo:

Principio sí, permiso no: el juez consume el principio como razón de A y no trae el permiso (constante 2).
Los dos, sin relacionarse: es criterio (constante 1).
Ninguno: es capacidad (constante 3).

c) Cuatro datos que me faltan:

¿Se guardan los bloques de razonamiento del juez?
¿Qué es la fila «otro instrumento, prosa + 2 preguntas, 7/42»?
«A, B y C 42/42» no cuadra con A en 12 de 14 en el brazo de prosa. ¿De qué brazos es?
¿Con qué motivo literal descartó la puerta la pasada 7, y por qué (B) no la rescató?

Paso 1 · La tanda de claridad

Qué mide: si D se deduce sin duda con las dos frases delante. No mide si el juez la encuentra.
Montaje: mismo modelo y esfuerzo que el juez, sin el prompt del juez, una llamada nueva por tirada. Solo los dos párrafos (§2.4 y §3.5), sin las frases de A. Dos brazos de 42 tiradas, el mismo día.

Brazo N, neutro. Tras los dos textos:

Los dos textos son de la misma organización y están vigentes a la vez. ¿Hay un conflicto entre lo que establecen? Responde en la primera línea con una sola palabra: CONFLICTO, COMPATIBLES o DEPENDE. Después explica tu respuesta en tres frases como máximo.

Brazo R, con la regla del producto. Tras los dos textos:

El Texto 1 permite algo. Si una clínica hace uso de ese permiso, ¿puede cumplir al mismo tiempo lo que establece el Texto 2? No vale responder que basta con no usar el permiso. Responde en la primera línea con una sola de estas opciones: NO PUEDE, SÍ PUEDE o DEPENDE. Después explica tu respuesta en tres frases como máximo.

Cuenta: solo la primera línea. Positivo es CONFLICTO en N y NO PUEDE en R. Todo lo demás, incluido DEPENDE y cualquier respuesta sin la palabra, cuenta en contra. No se piden citas, así que no hay indecidibles.
Por qué dos brazos: N responde a la regla del director («sin duda con solo leer»). R responde a si D es clara bajo la definición de F-129, que no admite «basta con no usar el permiso». Si difieren, la claridad de D depende de adoptar esa definición, y eso es una decisión de producto.
Bandas por brazo:
37 o más de 42: clara.
30 o menos: no clara.
Entre 31 y 36: se repite otro día y se decide sobre 84, con 68 o más para clara.
Tasas de error: si la tasa real fuera 60 % (como el quinto), llegar a 37 por azar es inferior al 0,1 %. Si fuera 90 %, quedarse en 30 o menos es inferior al 0,1 %. Aproximadas; que Code las verifique con binomial exacta.

Cómo se decide con el paso 0a y el paso 1:

Los lectores discrepan, o N y R salen «no clara»: D es interpretable. Se cierra: no se persigue ni se promete, y queda como guarda de no regresión. Fin.
N «no clara» y R «clara»: D solo es clara si el producto adopta la regla «un permiso que otro documento excluye es un conflicto». Decide el director. Si no la adopta, se cierra.
N y R «clara» y los lectores coinciden: D es clara y difícil de ver. Se sigue al paso 2.

Paso 2 · Solo si D es clara: por qué no la ve

Orden de reglas, la tanda de vuestra sección 8, con su umbral de 8 de 14.
Diagnóstico de modelo: el producto tal cual, con esfuerzo alto y con el modelo siguiente, 14 pasadas cada uno, el mismo día que un control. El director lo aparcó como solución; aquí es diagnóstico, y decide él.
Capacidad dominante: 8 o más de 14. Con la tasa actual, llegar por azar es menos del 1 %. Si la real fuera 70 %, potencia en torno al 90 %.
Descartada: 4 o menos.
Entre 5 y 7: repetir.

Tres salidas, y ninguna hipótesis de prompt más:

Cruza el orden de reglas: se adopta tras interruptor, como hipótesis de clase.
Cruza el modelo: es capacidad, y la decisión es de coste.
Ninguna cruza: D queda como «conflictos normativos implícitos: 15 % medido en un caso, no prometido». La extracción de normas va con las fichas, después del primer cliente. Se retoma lo congelado: F-119, segundo corpus, cliente.

La tanda X del 06/11 (pregunta cerrada con citas, regla estricta) queda detrás, sin cambios. Solo importa si D es clara y se sigue considerando la pasada 2.

PREDICCIONES

P-A3-1 · Orden de reglas: D entre 1 y 4 de 14.
P-A3-2 · Prosas guardadas: el principio aparece en 6 o más de las 10 sin D; el permiso, en 3 o menos.
P-A3-3 · Diagnóstico de modelo: esfuerzo alto, 2 a 5 de 14; modelo siguiente, 4 a 8. Rebajadas a propósito, porque en este caso he apostado alto todas las veces.
P-A3-4 · Brazo R: 37 o más de 42.
P-A3-5 · Brazo N: entre 26 y 35 de 42. Confianza baja.
Si P-A3-4 y P-A3-5 aciertan, el resultado es el caso intermedio: la decisión vuelve al director como elección de definición.
