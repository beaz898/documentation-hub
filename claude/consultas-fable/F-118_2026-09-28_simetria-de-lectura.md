---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-118
Fecha: 28/09/2026
Asunto: Simetría de lectura entre los dos lados del análisis. El juez recibe el
        candidato por RELEVANCIA (3.000 caracteres) y el analizado por POSICIÓN
        (los primeros 6.000). Fable: la simetría por relevancia cambia una tijera
        por otra; lo que resuelve es que el juez lea los dos documentos ENTEROS
        mientras quepan en un presupuesto de tokens medido, y por tramos —todos—
        por encima de él.
Estado: vigente · PAR COMPLETO + ERRATAS
Superada por: —

⚠️⚠️ ERRATAS Y UNA HIPÓTESIS DESCARTADA — LEER ANTES QUE EL DICTAMEN.
El dictamen se construyó sobre premisas que le dimos nosotros. Tres eran falsas y
una cuarta la fabricó esta casa después; aquí van, fechadas, para que nadie las
herede. Es la misma clase de fallo que los «~2.000 caracteres» de CLAUDE.md, que
sobrevivieron 37 días (`lib/examen/discriminantes.mjs:10-14`).

ERRATA 1 · 28/09/2026 · la introdujo el ARQUITECTO en la consulta; la corrigió
        FABLE en el propio dictamen.
        La consulta afirmaba «una ventana de contexto que no da para los dos
        completos». FALSO. Claude Haiku 4.5 tiene 200.000 tokens de ventana,
        verificado el 28/09 por el arquitecto en la documentación de Anthropic
        (https://platform.claude.com/docs/en/build-with-claude/context-windows).
        Las parejas más grandes del corpus rondan los 20.000 tokens (cifra de
        Fable sobre los tamaños que se le dieron; la medición por pareja es
        `SQL_F118_tamanos_por_pareja.sql`, pendiente). Los 6.000 y los 3.000 son
        tijeras nuestras, no límites del modelo.

ERRATA 2 · 28/09/2026 · la introdujo el ARQUITECTO en la consulta y Fable la
        repitió («los cinco fragmentos muestreados como consulta»); la corrigió
        CODE el 28/09 leyendo el fichero.
        FALSO. `pickSampledTexts` devuelve TODOS los fragmentos hasta 120:
        `const targetSamples = total <= 120 ? total : 120;`
        (`lib/analysis/muestras.ts:21-23`), repartidos por el documento
        (`:29-34`). El cinco es el tamaño de lote de las consultas a Pinecone:
        `const QUERY_BATCH_SIZE = 5;` (`lib/analysis/retrieval.ts:95`).

ERRATA 3 · 28/09/2026 · la introdujo FABLE en su encargo («la distribución de
        tokens por pareja real en los 614 análisis rápidos registrados»),
        tomando la cifra de F-117; la corrigió CODE el 28/09 al escribir
        `SQL_F118_tamanos_por_pareja.sql`.
        Esos 614 no son de esta organización ni de esta tabla: son la n de la
        mediana de coste medida sobre `llm_usage` en F-117 §2
        (`scripts/examen.mjs:62-65`). Las parejas salen de otro sitio:
        `analysis_results` de la organización `a9625e93` con
        `analysis_type = 'quick'`, una pareja por elemento de
        `analysis->'judgments'` (un juicio por candidato que llegó al juez,
        `lib/analysis/types.ts:66-68`; el jsonb se guarda entero,
        `lib/persist-analysis.ts:120`), y los tamaños de
        `char_length(documents.full_text)` — aproximación declarada en el SQL.

ERRATA 4 · 28/09/2026 · la introdujo CODE al informar a medias —citó sólo el
        asunto del commit de reversión, «revert: …»— y el ARQUITECTO la escribió
        en el encargo como «F-65 revertido a los 30 minutos sin constancia
        escrita»; la corrigió CODE el 28/09 leyendo el cuerpo del commit.
        FALSO. `8f382e68` (25/08) lleva la medición y el motivo: «Experimento
        declarado, medido con 4 tandas contra la linea de base de F-62, se
        revierte. […] Descartada: 0 de 4, y en 2,2 segundos — el mismo tiempo
        que con seis filas. Ni siquiera delibera mas. El material no es la
        causa.» Y F-116 lo cita (`F-116.md:112-119`). No hay nada que
        investigar sobre el motivo: está escrito.

HIPÓTESIS COMPROBADA Y DESCARTADA · 28/09/2026 · no es errata: Fable la planteó
        como pregunta a verificar.
        Temía que los fragmentos de consulta se tomaran de los primeros 6.000
        caracteres, lo que habría dejado ciega también a la recuperación. NO ES
        ASÍ: `pickSampledTexts` recibe el documento entero —los trozos de
        `chunkText(text, …)` sobre el texto completo
        (`app/api/analyze-v2/route.ts:386`) o todos los trozos guardados de la
        generación activa (`:400-407`), y se llama en `:591-593`; en el examen,
        `app/api/admin/examen/analizar.ts:110`—. La ceguera está SÓLO en el juez:
        `completo.slice(0, NEW_DOC_LIMIT_QUICK)` en `recortarAnalizado`
        (`lib/analysis/judge.ts:1087`). El escalón 1 lo arregla una vez, no dos.
---

# (b) CONSULTA ENVIADA — F-118 · 28/09/2026

CONSULTA F-118 — Simetría de lectura entre los dos lados del análisis

Contexto de producto (asume que no tienes acceso al repositorio ni a consultas anteriores;
todo lo necesario está aquí)

Documentation Hub es un SaaS B2B español de gestión documental corporativa. Entre otras
cosas, cuando un usuario sube un documento, el producto lo compara contra el corpus ya
indexado y emite hallazgos: duplicados, solapamientos y contradicciones.

El pipeline de análisis tiene cinco etapas: recuperación (Pinecone, multilingual-e5-large,
namespace por organización) → rerank → juez → verificador → síntesis. El juez, el
verificador y la síntesis son llamadas a Claude (Haiku 4.5 en la mayoría, Sonnet para el
double-check). Corre en funciones serverless de Vercel; la ruta de análisis tiene
maxDuration de 120 segundos.

El análisis es una comparación entre DOS documentos:
- el documento ANALIZADO: el que el usuario acaba de subir o seleccionar,
- el documento CANDIDATO: el que ya estaba en el corpus y la recuperación ha traído como
  posiblemente relacionado.

Lo que hemos medido en el código y queremos consultarte

Los dos lados se le entregan al juez de forma ASIMÉTRICA, y no por decisión consciente
nuestra:

- Lado CANDIDATO: se le entregan FRAGMENTOS seleccionados POR RELEVANCIA, con un
  presupuesto de 3.000 caracteres. Es decir, se eligen los trozos que la recuperación
  considera más pertinentes, estén donde estén dentro del documento.
- Lado ANALIZADO: se le entrega un corte POR POSICIÓN. Literalmente
  `fullDocumentText.slice(0, 6000)`. Los primeros 6.000 caracteres del documento y nada
  más. No hay selección por relevancia; hay tijera al principio.

Nuestro troceado real, por si importa: se trocea por secciones, con objetivo de 1.200
caracteres y subdivisión por encima de 1.500. El corte de 6.000 del lado analizado NO
respeta esos límites: parte por el carácter 6.000 esté donde esté, a mitad de frase o de
tabla.

Por qué esto nos importa: la evidencia

Tenemos un caso de prueba (lo llamamos P2) donde sembramos tres contradicciones
deliberadas entre dos documentos, para comprobar que el producto las encuentra. Las
posiciones de las trampas dentro de cada documento son éstas:

- En NOR-11 (14.261 caracteres en total): las trampas están en los caracteres 1.466, 7.243
  y 12.066.
- En CLI-13 (9.598 caracteres en total): las trampas están en los caracteres 1.218, 4.828
  y 8.560.

Con el corte en 6.000 por posición, cuando el documento analizado es NOR-11, el juez sólo
puede ver UNA de las tres trampas (la de 1.466). Las otras dos están fuera de su campo de
visión por construcción, no por error del modelo. Nuestro umbral de prueba exigía que
encontrase dos, lo que hacía ese umbral imposible de cumplir en esa dirección.

Es decir: no estábamos midiendo la capacidad del juez. Estábamos midiendo dónde habíamos
puesto las trampas respecto de una tijera.

Un hallazgo de método que queremos declararte

Al revisar tu respuesta anterior sobre nuestro esquema de lectura, comprobamos que
efectivamente NO cubría este lado. La razón no es que lo omitieras: es que nuestra
pregunta sólo describía el lado del candidato. Decíamos textualmente "al juez se le
entregan fragmentos del documento existente con un presupuesto de 3.000 caracteres" y nada
más. Nunca te contamos que el lado del analizado se cortaba por posición. Así que el hueco
es de nuestra consulta, no de tu plan, y la simetría es materia nueva y no un
incumplimiento de lo acordado. Lo decimos para que valores la idea en sus propios términos
y no como un parche a lo que ya recomendaste.

La idea que se nos ha ocurrido (la "simetría")

Tratar los dos lados igual: que el documento ANALIZADO también entre al juez como
fragmentos seleccionados por relevancia con un presupuesto de caracteres, en lugar de como
un corte por posición. Y, de paso, que la unidad de entrega sean trozos enteros
(respetando los límites del troceado) en vez de un corte a mitad de frase, para que no se
pierda información por la mitad.

Variantes que hemos pensado pero no evaluado:
- (1) Simetría estricta: mismo mecanismo y presupuesto parecido en los dos lados.
- (2) Simetría con presupuesto mayor en el analizado (es el documento del que el usuario
  espera respuesta).
- (3) Mantener el corte por posición pero hacer varias pasadas del juez, una por tramo del
  documento analizado, y unir los hallazgos.
- (4) Dejar el inicio del documento siempre incluido (portada, metadatos, alcance) y llenar
  el resto del presupuesto por relevancia.

Un dato de coste que tenemos medido: en agosto subimos el presupuesto del lado candidato de
3.000 a 5.200 caracteres y el tiempo total del análisis no aumentó (cero segundos de
diferencia medibles). No sabemos si eso se extrapola al otro lado.

Un contrapeso que acabamos de descubrir y que nos hace dudar

Hoy mismo el examen ha encontrado, por su cuenta y sin que lo buscáramos, el primer FALSO
POSITIVO del producto: emparejó "fecha de última revisión" entre los dos documentos y lo
declaró contradicción, cuando en realidad cada documento declara legítimamente su propia
fecha de versión (9 de febrero uno, 16 de febrero el otro). Dos documentos distintos tienen
derecho a tener fechas de versión distintas; ahí no hay contradicción.

Esto nos preocupa en relación con la simetría: si le damos al juez más texto y mejor
seleccionado, encontrará más cosas — y presumiblemente más verdaderas Y más falsas. No
tenemos forma de saber a priori cuál de las dos crece más rápido. Mucho ruido de este tipo
hace el producto inservible para el cliente, igual que las omisiones.

Nuestras restricciones reales

- Serverless con maxDuration de 120 segundos en la ruta de análisis; el techo total de
  reintentos que acordamos es de 40 segundos.
- El usuario espera hoy 15-25 segundos con el análisis en primer plano. No tenemos cola de
  fondo todavía (es deuda técnica reconocida).
- Coste por llamada al LLM: relevante pero no prohibitivo; más texto es más tokens de
  entrada.
- El director del proyecto no es programador: los cambios se aplican fichero a fichero por
  la web de GitHub. Un cambio grande y entrelazado es caro para nosotros en un sentido que
  no es el computacional.
- Tenemos un arnés de evaluación recién construido (diez casos sembrados, marcador con
  estados PASA/FALLA/SIN_VEREDICTO/SEGUIMIENTO, regla de estabilidad de 5 pasadas) con el
  que podemos medir antes y después de cualquier cambio. Está operativo desde ayer y
  todavía lo estamos calibrando.

Lo que te pedimos

1. ¿Hay que modificar el plan que nos diste? Es decir: ¿la simetría entra dentro de lo que
   ya habías previsto en otro nombre, o es materia nueva que no estaba contemplada?
2. ¿Qué te parece la solución de la simetría como tal? ¿Es lo que haría un equipo competente
   en nuestro sitio, o es una forma elaborada de equivocarse?
3. ¿Resuelve el problema base — que el producto no puede encontrar lo que está más allá del
   corte — o sólo lo desplaza más lejos?
4. ¿SUMA a lo planeado o SUSTITUYE a algo de lo planeado? Si sustituye, ¿a qué, y en qué
   orden habría que hacer las cosas?
5. ¿Hay mejores opciones que no hayamos considerado? En particular nos interesa saber qué
   hacen los sistemas serios del sector en esta situación concreta (comparar un documento
   entero contra otro documento entero con una ventana de contexto que no da para los dos
   completos), porque sospechamos que nuestras cuatro variantes son las obvias y puede haber
   un enfoque estándar que no conocemos.
6. ¿Qué limitaciones tiene la idea? Nos interesan sobre todo las que no se ven desde dentro:
   qué se rompe, qué empeora, qué clase de fallo nuevo introduce, y en particular si tenemos
   razón al temer que más texto traiga más falsos positivos y cómo se mide eso separadamente
   de la cobertura.

Si necesitas algún dato del código que no esté aquí, dilo y lo medimos antes de decidir
nada. Preferimos una respuesta con condiciones a una respuesta cómoda.

---

# (c) RESPUESTA RECIBIDA — F-118 · 28/09/2026

RESPUESTA DE FABLE — F-118 · SIMETRÍA DE LECTURA ENTRE LOS DOS LADOS DEL ANÁLISIS
Versión consolidada, 28/09/2026. Contiene el dictamen sobre las seis preguntas de la
consulta y, al final, una sección con las objeciones y preguntas que el director hizo en
conversación después del primer dictamen, marcada como tal.

Alcance y una corrección de premisa antes de nada

No veo el código. Todo dato del repositorio va con la procedencia de Code.
Acepto vuestra nota de método, y añado la mía: en F-116 pedí que la casilla 1 dijera "qué
operando compara"; nunca pedí que se declarara qué recibe cada lado del juez. Regla nueva:
toda consulta sobre el juez lista qué se le entrega por cada lado, con tamaño y criterio de
corte.
La premisa de vuestra pregunta 5 es falsa para vuestro corpus. "Una ventana que no da para
los dos completos" no es vuestro caso. NOR-11 y CLI-13 juntos son 24.000 caracteres, unos
6.000 tokens. El documento más largo, 66.669 caracteres, son unos 17.000. La ventana de
Haiku 4.5 es, de entrenamiento y sin verificar contra la documentación de hoy, de 200.000
tokens. Los dos completos caben con margen en todos los pares del corpus. El 6.000 y el
3.000 son tijeras que alguien puso; no son límites del modelo. Lo que sí es real es la
pérdida de calidad con contextos largos y el coste. Pero 6.000 tokens no es un contexto
largo.

Veredicto

1 y 4: es materia nueva. Suma al plan y sustituye en parte a la segunda vuelta, que queda
como respaldo.
2 y 3: la simetría por relevancia, tal como está formulada, no resuelve el problema: cambia
una tijera por otra, y está mal definida, porque en el lado analizado no hay consulta contra
la que medir relevancia. Lo que resuelve el problema es que el juez vea el documento
analizado entero, o todos sus trozos por tramos. Vuestra variante 3 es la buena para
documentos largos; para los vuestros, la respuesta es más simple.
5: el enfoque estándar tiene dos escalones. Primero, los dos documentos enteros mientras
quepan en un presupuesto de tokens. Segundo, alineación trozo a trozo para los que no
quepan. Las variantes 1, 2 y 4 no están en ninguno.
6: el temor a los falsos es fundado y se mide. Sin casos de esperado cero en el arnés, no se
puede. Ese es el prerrequisito.

1 · ¿Modifica el plan?

Sí, y por una razón buena: el plan de F-116 y F-117 trataba solo el lado candidato porque
solo ese lado se describió. El lado analizado tiene una tijera peor, porque corta por
posición y a mitad de frase.

Lo que cambia:

El "corte honesto" de F-116 se generaliza a los dos lados: lo que el juez no ve se declara,
venga del lado que venga.
La segunda vuelta dirigida pierde peso, no desaparece (punto 4).
El presupuesto pasa de dos constantes (3.000 y 6.000) a una sola: tokens totales de entrada
al juez, con su ficha.

2 · ¿Qué me parece la simetría?

La idea de fondo es correcta: los dos lados deben entrar con el mismo criterio y en trozos
enteros. La formulación es incorrecta, por tres motivos:

En el lado analizado no hay consulta. "Relevancia" es relevancia respecto a algo. En el
candidato se mide contra fragmentos muestreados del analizado. En el analizado, ¿contra qué?
La única respuesta coherente es "trozos del analizado que tienen contraparte parecida en el
candidato". Eso ya no es selección por relevancia: es alineación de trozos entre los dos
documentos, que es otra cosa, mejor, y va en el punto 5.
Seleccionar por relevancia sigue siendo una tijera. Con presupuesto de 6.000 sobre NOR-11 de
14.261, se eligen 5 trozos de 12. Que los tres trozos con trampa estén entre los cinco
depende de que la selección funcione. Pasáis de "seguro que dos se pierden" a "quizá ninguna
se pierda". Es mejor y no es una solución.
La selección por parecido con el candidato descarta lo que no tiene contraparte. Y eso es un
hallazgo de vuestro producto: contenido exclusivo de un lado. En P3 hay 25+25 filas
exclusivas sembradas. Una simetría por relevancia las haría invisibles por construcción.

Las variantes: (1) y (2), mal definidas por lo anterior. (3), el enfoque estándar para
documentos largos, correcta. (4), un parche razonable si hubiera que cortar; no hay que
cortar en vuestro corpus.

3 · ¿Resuelve el problema base o lo desplaza?

Lo desplaza. Cualquier selección con presupuesto menor que el documento deja algo fuera, y
lo que queda fuera no se puede encontrar. Solo dos cosas resuelven "no puede encontrar lo
que está más allá del corte": que no haya corte, es decir, el documento entero; o que el
corte sea por tramos y todos los tramos pasen por el juez. Todo lo demás cambia dónde está
la tijera.

4 · ¿Suma o sustituye?

Suma: una pieza nueva, "lado analizado entero o por tramos", que entra en la semana 2 junto
al corte honesto, porque es la misma clase de cambio.

Sustituye en parte: la segunda vuelta dirigida. Si cada trozo del analizado entra con sus
vecinos del candidato ya alineados, la búsqueda del "otro lado" está hecha de antemano para
todos los trozos, no solo para las sospechas. La segunda vuelta queda como respaldo para
cuando el vecino correcto no salió en la alineación. Es más barata como respaldo que como
mecanismo principal.

No sustituye: el verificador ciego, el examen, la búsqueda híbrida. Con más texto, el
verificador ciego pasa de conveniente a imprescindible.

Orden revisado:

Arnés con casos de esperado cero. Prerrequisito: sin esto, nada de lo siguiente se puede
medir.
Escalón 1 del punto 5: los dos documentos enteros cuando quepan en el presupuesto de tokens.
El cambio más pequeño de todos: quitar dos tijeras y poner un tope en tokens.
Corte honesto para los que no quepan, declarando al juez lo omitido de cada lado.
Verificador ciego.
Escalón 2 para documentos largos: tramos alineados.
Segunda vuelta como respaldo. Búsqueda híbrida.

5 · Qué hacen los sistemas serios

Dos escalones, y el vuestro está en el primero.

Escalón 1 · Los dos enteros, con estructura marcada. Cuando la pareja cabe en un presupuesto
razonable de tokens, se entrega entera, cada lado con sus encabezados de sección y sus
límites de trozo visibles, y el juez emite todos los hallazgos del par en una llamada.
(Entrenamiento: los resultados sobre pérdida de atención en contextos largos, "lost in the
middle", Liu et al. 2023, aparecen con decenas de miles de tokens, no con seis mil.)
Presupuesto propuesto, con ficha y caso decisivo: 20.000 tokens de entrada para los dos
lados. Cubre todo vuestro corpus salvo el de 66.669 emparejado con otro grande. Encargo para
Code: distribución de tokens por pareja real en los 614 análisis rápidos registrados.

Escalón 2 · Alineación trozo a trozo, para lo que no cabe. Detallado en la sección del
director, puntos D2 y D5. (Entrenamiento; buscables: "map-reduce over chunks",
"cross-document alignment", "sentence alignment", y para la decisión por par, "natural
language inference", "NLI contradiction".) Los trozos sin vecino se emiten como "sin
contraparte", no se tiran.

Un tercer enfoque que ya tuvisteis y retirasteis: extraer primero las afirmaciones atómicas
de cada documento, con magnitud, valor y unidad, y comparar afirmaciones en vez de texto.
(Entrenamiento; buscables: "claim extraction", "atomic facts", "FActScore".) La rama atómica
de F-113 era una instancia de esto. Se retiró porque no escribía nada que nadie leyera, no
porque la idea fuera mala. Es el enfoque que mejor resiste a los falsos por parecido de texto
y la ficha de más largo plazo. No entra ahora.

Dato de coste: vuestra medición de agosto, de 3.000 a 5.200 sin tiempo añadido, dice que la
latencia la domina el coste fijo de la llamada, no los tokens. Predicción de Fable, escrita
antes: pasar el juez a 8.000 tokens de entrada añade menos de 2 segundos al análisis.

6 · Limitaciones, y lo que no se ve desde dentro

Sobre el temor a los falsos: tenéis razón, y se mide así.

La cobertura se mide con trampas. La precisión se mide con lo demás: cada hallazgo emitido
sobre los casos del arnés lo etiqueta el director como verdadero o falso, una vez, y la
etiqueta se guarda. Precisión = verdaderos / emitidos, por pasada.
Se siguen dos cifras juntas: hallazgos por par y precisión. Si los hallazgos suben y la
precisión baja, se revierte. Criterio escrito antes de activar.
Predicción de Fable: con los dos documentos enteros, los hallazgos por par suben, la
cobertura sobre trampas sube, y la precisión baja entre 5 y 15 puntos antes del verificador
ciego y se recupera con él. Si baja más de 15, el escalón 1 se para hasta tener el
verificador.

El falso de la fecha de revisión es una especie, no una anécdota. "Fecha de versión",
"autor", "código del documento", "fecha de aprobación" son atributos del documento, no
afirmaciones sobre el mundo. Dos documentos con fechas de versión distintas no se
contradicen. Cura en tres capas: la rúbrica del juez distingue metadatos del documento de
afirmaciones de dominio; el verificador ciego pregunta "¿es el mismo dato?", y la fecha de
versión de A no es el mismo dato que la de B; y el caso entra en el arnés como esperado cero.
Es el primer caso de esperado cero, y el arnés lo encontró solo: ese es el arnés funcionando.

Fallos nuevos del escalón 1

Más texto en una llamada, más ocasiones de emparejar cosas que se parecen y no son lo mismo.
Lo contiene el verificador.
La respuesta del juez se alarga y puede truncarse por tokens de salida. Encargo para Code:
tope de salida del juez y si se controla el motivo de parada.
Tablas largas enteras desplazan la atención. Es donde la búsqueda híbrida y la alineación por
clave ya trabajan.

Fallos nuevos del escalón 2

Duplicados: la misma contradicción desde dos trozos. Desduplicar por par de citas es
obligatorio.
Una afirmación partida entre dos trozos. Se cura con solapamiento en el trozado, que es una
de las tres cosas del censo de F-117.
Coste lineal en la longitud. Es el precio correcto.
Cambia "una llamada por candidato" y todo lo que lo lea. Encargo de censo.

Un riesgo que no se ve desde dentro: el corte de 6.000 puede afectar a más de lo que creéis.
Encargo para Code: si los cinco fragmentos muestreados como consulta se toman del documento
entero o de los primeros 6.000. Si es lo segundo, la recuperación del candidato también
estaba ciega a dos tercios de NOR-11, y el escalón 1 lo arregla dos veces.

El tope de 120 segundos: el escalón 1 no lo toca; el escalón 2 con llamadas en paralelo
tampoco, pero un documento de 66.000 caracteres con seis llamadas paralelas y reintentos se
acerca. Es otra razón para el worker.

OBJECIONES Y PREGUNTAS DEL DIRECTOR, HECHAS EN CONVERSACIÓN TRAS EL PRIMER DICTAMEN
(28/09, 10:50–11:25)

Esta sección no estaba en la consulta del arquitecto. Recoge lo que el director objetó y
preguntó, y lo que respondí. Dos puntos concretan el dictamen, uno añade un encargo, uno
deshace un malentendido y el último fija una regla de diseño para el escalón 2.

D1 · "Los límites de 3.000 y 6.000 se pusieron por capacidad compartida entre análisis, chat
y agente, no por la ventana del modelo."

Es plausible y hay que leerlo, no suponerlo. Encargo para Code: commit de origen y comentario
de cada constante. Si tenían una razón que no he visto, se verá ahí.
Con lo medido en F-117, el argumento de capacidad no se sostiene: el proveedor está al 1 % de
uso por minuto; doblar la entrada del juez lo lleva al 2 o 3 %. El chat y el agente no lo
notan. La búsqueda vectorial no cambia, así que la cuota de Pinecone no se toca.
Lo que sí cambia es el coste por análisis: entre dos y tres veces los tokens de entrada, de
medio céntimo a uno o dos. Es el precio de la completitud y se cobra al cliente por análisis;
no es un límite técnico. Donde pega es en el tope mensual de 35 $, que es decisión de negocio.
Predicción de Fable: con caché de prompt sobre el documento analizado, que es el mismo en las
seis llamadas al juez, se recupera más de la mitad del aumento. (Entrenamiento; buscable:
"prompt caching"; verificar en la documentación de Anthropic.)

D2 · "Cuando se supere el límite de tokens, ¿en qué orden lee? ¿Corta al llegar a X tokens o
lee por chunks en orden de relación?"

Nunca "de corrido hasta agotar tokens y tijera". Eso es exactamente lo que hace hoy el 6.000 y
es lo que se quita. Lo dejo escrito porque el primer dictamen no lo hacía explícito:
El documento analizado se lee entero, en tramos que respetan los límites de los chunks, en el
orden del documento. Ningún tramo se omite. El orden es el del documento porque lo que importa
es que se lea todo, no elegir qué parte.
Para cada tramo, del candidato se traen sus k chunks más relacionados, dentro del candidato
solamente. Aquí sí hay criterio de relevancia, porque hay pregunta: "qué dice el candidato
sobre lo que cuenta este tramo".
Cada tramo con sus vecinos es una llamada al juez. Las llamadas van en paralelo, así que tarda
más o menos lo mismo que una.
Los hallazgos se unen y se desduplican por par de citas.
Los chunks del candidato que no entraron para un tramo se declaran al juez y en el resultado.
Nada se corta en silencio.

D3 · "¿Por qué no hacerlo como la parte que funciona bien? Si se lee entero cada vez, ¿no es
ineficiente teniendo ya los chunks?"

No hay una parte buena que copiar entre los dos lados. Hoy hay dos tijeras: el candidato entra
como chunks por parecido hasta 3.000 caracteres; el analizado entra como los primeros 6.000
por posición. La primera es menos mala porque elige, pero es la que falló en el caso del
autoclave por 17 caracteres. Copiarla al otro lado es copiar la tijera.
Lo que funciona bien y no se toca es lo anterior al juez: recuperar el documento candidato
entre todo el corpus, y el rerank. También siguen igual el verificador y la síntesis. Cambia
solo qué se pone sobre la mesa del juez una vez elegida la pareja.
Los chunks tienen dos trabajos distintos. Buscar: entre miles de documentos, cuáles hablan de
lo mismo y en qué pasaje; ahí los chunks son la herramienta correcta y escalan a un millón de
documentos. Leer: una vez que se sabe que hay que comparar OPE-01 con CLI-01, alguien tiene que
leer los dos, y para dos documentos de diez páginas no hace falta trocearlos.
El juez nunca lee el corpus. Lee una pareja, como mucho seis veces por análisis, una por
candidato. Si el corpus pasa de 44 a 4.000 documentos, la búsqueda crece; el juez sigue leyendo
seis parejas. Ese coste no crece con el tamaño de la empresa ni con el número de organizaciones.
Donde el director tiene razón: con un manual de 200 páginas, leerlo entero contra otro es un
desperdicio. Ahí vuelven los chunks, en el escalón 2, con exactamente los chunks que ya existen.
La propuesta no es "sin límite". Es un límite en tokens puesto por medición, que hoy cubre los
documentos enteros, y por encima de él, tramos con chunks. Lo que se quita es un límite en
caracteres puesto por posición que nadie midió y que hacía invisible la página doce.

D4 · Protección de lo que funciona. El escalón 1 va tras interruptor. Criterio de reversión
escrito antes de activar: si cualquiera de las tres trampas que hoy se detectan deja de
detectarse en la regla de cinco pasadas, se apaga. Y si los hallazgos por par suben pero la
precisión cae más de 15 puntos, se apaga hasta tener el verificador ciego.

D5 · "¿Qué diferencia hay entre leer el documento entero y leer chunk a chunk, con un
presupuesto igual al tamaño del chunk?"

La idea del director es el escalón 2 con el tramo puesto al mínimo: un chunk por llamada. Tiene
una parte correcta que ya está en el plan, la unidad de lectura es el chunk entero y nunca un
corte a mitad de chunk, y una parte que sale peor.
La diferencia real no es cuántos tokens se leen en total, sino cuánto ve el juez a la vez. Una
contradicción es una relación entre dos cosas, y el juez solo relaciona lo que tiene en la
misma llamada. Ejemplo: CLI-01 dice en la página 1 "el instrumental de categoría B va en
autoclave" y en la página 4 "autoclave a 134 °C"; OPE-01 dice "categoría B a 121 °C". Leyendo
entero, el juez une las tres frases. Chunk a chunk, el chunk de "134 °C" no sabe para qué
material es, porque eso está en otra llamada, y el juez o se calla o adivina.
Costes visibles: NOR-11 son unos 12 chunks: 12 llamadas por candidato en vez de una, 72 por
análisis en vez de 6. Y la latencia la domina la llamada, no los tokens, según vuestra medición
de agosto. Más duplicados que desduplicar.
Regla para el escalón 2: el tramo es lo más grande que quepa en el presupuesto. Si la pareja
cabe entera, el tramo es el documento. Si no, tramos de varios chunks, los más grandes que
quepan, con solapamiento. Un chunk por llamada es el extremo peor de esa escala.
No se atan el tamaño del chunk y el presupuesto del juez. El chunk se dimensiona para buscar
bien, que pide trozos pequeños y precisos. El presupuesto se dimensiona para leer bien, que
pide trozos grandes con contexto. Son dos parámetros con dos oficios; atarlos obliga a uno a
hacer mal el trabajo del otro. Un campo, un oficio.

Orden de pasos, con el primero en solo lectura: (a) Code lee el origen de las dos constantes,
mide los tokens de las parejas ya analizadas, y comprueba de dónde se muestrean las cinco
consultas; (b) con esas cifras se fija el presupuesto en tokens con su ficha; (c) escalón 1
tras interruptor, medido en el arnés; (d) escalón 2 solo para lo que no quepa, con la regla de
tramo de D5.

---

# (d) LO QUE SE MIDIÓ DESPUÉS — lecturas de Code, 28/09/2026

## Las dos constantes: origen, comentario e historia

**`NEW_DOC_LIMIT_QUICK = 6000`** — `lib/analysis/judge.ts:35`. Su comentario, literal
(`:34`): «Límite de texto del doc nuevo en modo rápido (ahorra tokens).»

| Commit | Fecha | Mensaje | Qué hace con la constante |
|---|---|---|---|
| `a5ff8eca` | 21/04/2026 | «Update judge.ts» (sin cuerpo) | **nace con 4000**, con el mismo comentario de una línea |
| `7ec54e71` | 02/05/2026 | «Update judge.ts» | **la borra**: el juez recibe el documento entero |
| `8ff675b9` | 04/05/2026 | «Update judge.ts» (sin cuerpo) | **vuelve con 6000**, mismo comentario |
| `86ff2118` | 04/05/2026 | «Update judge logic for quick and exhaustive modes» | la mueve; el valor sigue en 6000 |

- **Entre el 02/05 y el 04/05 el juez recibió el documento ENTERO, sin recorte**, en `main`:
  la ruta pasaba `newDocumentText: text` (`7ec54e71:app/api/analyze-v2/route.ts:117,124`), el
  pipeline lo entregaba como `newDocumentSample` (`7ec54e71:lib/analysis/pipeline.ts:55,68`) y
  el juez lo usaba tal cual: `const newDocumentText = args.newDocumentSample;`
  (`7ec54e71:lib/analysis/judge.ts:141`). **Y lo decía por escrito**: «El documento nuevo se
  envía COMPLETO en ambos modos para no perder solapamientos ni contradicciones en ninguna
  parte del texto» (`7ec54e71:lib/analysis/judge.ts:126-127`). Es la única razón escrita sobre
  el lado analizado en toda la historia de la constante, y es la contraria del recorte.
- **Ninguna línea explica el paso de 4.000 a 6.000**, ni el regreso del recorte tras dos días
  sin él: los dos commits que lo hacen son «Update judge.ts» sin cuerpo.
- Desde el 04/05 el valor no ha cambiado (`git log -G "NEW_DOC_LIMIT_QUICK = [0-9]"`).

**`FRAGMENT_BUDGET_CHARS_QUICK = 3000`** — `lib/analysis/retrieval.ts:104`. Su comentario,
literal (`:97-103`): «Presupuesto de contenido por documento candidato en modo rápido. Antes se
recortaba a un número fijo de fragmentos, lo que penalizaba a los documentos troceados en
piezas pequeñas (una fila de hoja de cálculo es un fragmento) frente a los troceados en
secciones largas. Se mide contenido, no piezas.»

- **Nace** en `268883e5` (20/08/2026, «Recorta fragmentos por presupuesto de contenido, no por
  numero»), sustituyendo a `FRAGS_PER_DOC_QUICK = 4`. El mensaje justifica el CRITERIO
  (contenido en vez de número de piezas) y no el VALOR: «hasta agotar un presupuesto de 3000
  caracteres, con un tope de seguridad de 25 fragmentos».
- **Cambios de valor**: `77dbc646` (25/08 10:03, «[EXPERIMENTO F-65] presupuesto del candidato
  a 5.200») lo sube a 5200, y `8f382e68` (25/08 10:33, «revert: …») lo devuelve a 3000. ⚠️ El
  revert **SÍ tiene constancia escrita** —ver ERRATA 4 de la cabecera—: 4 tandas, 0 de 4, «en
  2,2 segundos — el mismo tiempo que con seis filas».

## De dónde se muestrean las consultas de búsqueda

Del documento **entero** — ver la hipótesis descartada de la cabecera, con sus líneas. Y un
límite distinto que no hay que confundir con el de 6.000: los embeddings se piden con
`truncate: 'END'` (`lib/embeddings.ts:256`), que recorta cada TROZO al límite de entrada del
modelo de embeddings, no el documento.

## Los tamaños por pareja

`SQL_F118_tamanos_por_pareja.sql`, sólo lectura, PENDIENTE DE EJECUTAR por el director.

---

# (e) LAS PREDICCIONES DE FABLE — escritas antes de encender nada

Se aíslan aquí para contarlas cuando haya medición, como toda predicción de esta casa.

1. **Pasar el juez a 8.000 tokens de entrada añade menos de 2 segundos al análisis.**
   *(Estado: sin medir. Dato previo que la sostiene: F-65, +2.200 caracteres en el candidato
   costaron 0 s — `8f382e68`.)*
2. **Con los dos documentos enteros: los hallazgos por par suben, la cobertura sobre trampas
   sube, y la precisión baja entre 5 y 15 puntos antes del verificador ciego, recuperándose
   con él.** *(Estado: sin medir.)*
3. **Si la precisión baja más de 15 puntos, el escalón 1 se para hasta tener el verificador.**
   *(Es un criterio de reversión más que una predicción: se escribe aquí para que no se mueva
   después de ver el resultado.)*

⚠️ **NO VERIFICADA — la caché de prompt** (D1): «con caché de prompt sobre el documento
analizado, que es el mismo en las seis llamadas al juez, se recupera más de la mitad del
aumento». La caché de prompt existe y está documentada; **que aplique a nuestro caso y en esa
proporción está sin comprobar.**

---

# (f) EL ORDEN REVISADO DEL PLAN

Qué se movió respecto de F-116 / F-117:
- **Entra una pieza nueva**: el lado ANALIZADO, entero o por tramos. No estaba en el plan
  porque la consulta de F-116 no describió ese lado (Estado_Del_MVP.md B.272).
- **La segunda vuelta dirigida baja de mecanismo principal a respaldo.**
- **El presupuesto pasa de dos constantes en caracteres a una sola en tokens**, con ficha.

El orden:
1. **Arnés con casos de esperado cero.** Prerrequisito: sin él no se mide la precisión.
2. **Escalón 1 — los dos documentos enteros mientras quepan en el presupuesto de tokens.**
   ⚠️ **Tras interruptor, con criterio de reversión escrito antes de activar** (D4): se apaga si
   cualquiera de las trampas que hoy se detectan deja de detectarse en la regla de estabilidad,
   y si los hallazgos por par suben pero la precisión cae más de 15 puntos.
3. **Corte honesto** para lo que no quepa, declarando al juez lo omitido de cada lado.
4. **Verificador ciego.**
5. **Escalón 2 — tramos alineados** para lo que no quepa, con la regla de D5: el tramo es lo
   más grande que quepa, nunca un chunk por llamada.
6. **Segunda vuelta, como respaldo. Búsqueda híbrida.**

---

# (g) RESOLUCIÓN DE LA PREDICCIÓN — 30/09/2026

*Añadida después, sin tocar nada de lo anterior. Fallar se cuenta.*

**La predicción 2 de (e) FALLÓ, y en la dirección contraria.**
- **Decía** que, con los dos documentos enteros, la precisión bajaría entre 5 y 15 puntos
  antes del verificador ciego.
- **Lo medido** en el escalón 1 (B.295, leído desde la base el 30/09): la precisión
  **SUBIÓ**. El falso positivo «Fecha de última revisión», que salía en 4 de 8 pasadas con el
  interruptor apagado, **desapareció** (0 de 6), y las contradicciones publicadas pasaron de 1
  a 2 por pasada, las dos sembradas.
- **El modelo revisado**, de Fable: los falsos nacen tanto de poco contexto como de mucho, y
  ese falso nacía de escasez. Está en F-119 (`F-119_2026-09-30_moneda-antigua-del-retrieval.md`,
  (d) al principio y (e)).
