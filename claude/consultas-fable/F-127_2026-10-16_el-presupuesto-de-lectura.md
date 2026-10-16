---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-127
Asunto: el presupuesto de lectura y cómo se reparte — la cascada del corte
        honesto tiene un barranco en 30 de 30 parejas, y subir a 80.000 con la
        regla de hoy tira una contradicción que hoy entra
Fecha de envío: 15/10/2026 · Fecha de respuesta: 16/10/2026 (versión
        consolidada, con las preguntas del director hechas en conversación el
        15/10, de 14:15 a 18:50)
Fuente: los dos textos llegaron en el encargo del arquitecto del 16/10/2026,
        al final del mensaje. Los dos constan íntegros: la consulta en (c) y el
        dictamen en (d).
⚠️ Este texto llegó al repositorio copiado a través de la conversación del
        arquitecto. El original de la consulta está en el proyecto de Claude;
        el original del dictamen, en la conversación del director con Fable.
        Si se detecta una palabra cortada, el original manda.
Estado: ARCHIVADA CON DICTAMEN · FIJA EL ORDEN DEL FRENTE DE LECTURA (tokens
        por llamada; corte en límite de trozo con declaración; ventana de
        80.000 con reparto monótono; caché con los documentos como bloques;
        escalón 2 por ventanas). Nada construido.
        Cotejo de integridad, 16/10/2026, con el método de F-121: sha256 del
        texto tal como queda archivado aquí (saltos LF, sin salto final), 16
        primeros hexadecimales; caracteres = puntos de código; palabras = trozos
        separados por espacio en blanco. Ninguno de los dos textos tiene
        espacios que no sean ASCII. Los 60 primeros y últimos van entre comillas
        con escapes JSON: \" es una comilla del texto y \n un salto de línea.
        · DICTAMEN, (d): huella 6fb259ea66cc3057 · 24.322 caracteres
          (24.837 bytes UTF-8) · 201 líneas · 133 no vacías ·
          4279 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-127 · EL PRESUPUESTO DE LECTURA Y CÓM"
          60 últimos:  " cambia ningún resultado del arnés en las trampas de NOR-11."
        · CONSULTA, (c): huella f25fce83924153e4 · 19.153 caracteres
          (19.530 bytes UTF-8) · 310 líneas · 248 no vacías ·
          3134 palabras.
          60 primeros: "CONSULTA F-127 · EL PRESUPUESTO DE LECTURA Y CÓMO SE REPARTE"
          60 últimos:  "» es una respuesta útil y la preferimos a una\n   estimación."
Superada por: —
---

# (a) CABECERA

**F-127 · El presupuesto de lectura y cómo se reparte.**

- Fecha de envío: 15/10/2026. Fecha de respuesta: 16/10/2026, versión consolidada.
- Quién escribe la consulta: el arquitecto. El director la envía, pega la respuesta, hace en
  conversación las tres preguntas D1, D2 y D3, y decide.
- Estado: **ARCHIVADA CON DICTAMEN.** Sustituye el punto 1.2 de F-123 por los pasos 1 a 4 de su P7,
  y abre la fase 4 (el escalón 2, ventanas). Nada construido a la fecha de archivo.
- **Lo que trae además del dictamen**: la sección de las preguntas del director (D1, D2, D3), con un
  cambio de prioridad del escalón 2 y un cambio de nombre de la constante (de presupuesto de pareja a
  tamaño de ventana), y un criterio de reversión del escalón 2 escrito antes de construirlo. Van
  dentro de (d), tal como llegaron.

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

- **Las tres lecturas de Code del 14 y 15/10/2026** sobre el punto 3.1 del estado
  (`claude/Estado_Y_Pendientes_14-10-2026.md`): el código de `leerLaPareja` con sus líneas, la
  simulación de 80.000 caracteres con el barranco, y las cuatro reglas de reparto R0 a R3 sobre las
  56 parejas con dirección, con su coste. Herramientas en el scratchpad de Code, no en el
  repositorio.
- **El pase preparado de NOR-10**: `claude/Predicciones_F127_NOR10_Documento_Largo.md` y
  `SQL_F127_01_la_medida_de_NOR10.sql`, sin lanzar a la fecha de la consulta.

---

# (c) ENUNCIADOS DE LAS PREGUNTAS — EL TEXTO ENVIADO, ÍNTEGRO

Texto de la consulta tal como llegó al final del encargo del 16/10. No se ha tocado.

CONSULTA F-127 · EL PRESUPUESTO DE LECTURA Y CÓMO SE REPARTE

Para Fable. De: el arquitecto de Documentation Hub (Doclity).
Fecha: 15/10/2026.

AVISO DE MÉTODO, POR FAVOR LÉELO ANTES

Nada está decidido y no se ha cambiado ni una constante del código. Todo lo que sigue es lectura y
simulación. Te traemos un mecanismo que creemos defectuoso, pero puede que el defecto esté en cómo
lo hemos planteado. Concretamente:

 · Más abajo verás cuatro reglas de reparto simuladas (R0 a R3). NO las simulamos para que elijas
   una. Las simulamos para entender el mecanismo. Si la respuesta correcta es ninguna de las
   cuatro, o si la pregunta está mal hecha, dilo con esas palabras.
 · Una de tus predicciones de F-123 queda refutada por la simulación. Te damos el dato, no el
   veredicto. Saca tú la conclusión.
 · Si te falta información para contestar bien, PÍDELA y te la damos. Tenemos acceso al código, al
   corpus, a los logs de producción y a la base de datos, y hay un agente que lee el repositorio y
   mide en local sin lanzar análisis. No contestes con supuestos si puedes contestar con datos: es
   más barato darte los datos que deshacer una decisión equivocada.
 · Hay cifras que NO tenemos medidas y van señaladas como tales. No las uses como si lo estuvieran.
 · Y una corrección nuestra, para que veas el grado de confianza: en el borrador de esta consulta
   afirmábamos un tope aritmético en el lado candidato que resultó FALSO al comprobarlo. Va
   corregido en el punto 2.4. Si algo más de aquí te parece afirmado con demasiada seguridad,
   pregúntalo.

Y una pregunta que nos importa de forma explícita: cómo resuelven esto hoy, en 2026, los sistemas
serios que hacen esta clase de trabajo. No queremos que inventes un mecanismo para nosotros si ya
existe una práctica establecida y documentada. Si la hay, nómbrala, di quién la usa, para qué
tamaños, y qué abandona a cambio. Si lo que hacemos no se parece a nada de lo que se hace, dilo
también.

=====================================================================
1 · EL MECANISMO, TAL COMO ESTÁ EN EL CÓDIGO
=====================================================================

Contexto mínimo: al subir un documento se analiza contra el corpus ya indexado. El documento que se
sube se llama ANALIZADO; cada documento del corpus con el que se compara se llama CANDIDATO. Hay
hasta 6 candidatos por análisis rápido. Para cada pareja analizado-candidato se hace UNA llamada al
juez (Claude Haiku 4.5), y hay un presupuesto de caracteres para el texto de los dos documentos en
esa llamada.

Constantes, con archivo y línea:

 · PRESUPUESTO_PAREJA_TOKENS = 10.000 — lib/analysis/judge.ts:1222
 · CARACTERES_POR_TOKEN = 4 — judge.ts:1223
 · PRESUPUESTO_PAREJA_CARACTERES = 40.000 — judge.ts:1224
 · SUELO_DEL_ANALIZADO = NEW_DOC_LIMIT_QUICK = 6.000 — judge.ts:1231 y :40
 · FRAGMENT_BUDGET_CHARS_QUICK = 3.000 — lib/analysis/retrieval.ts:104
 · MAX_FRAGMENTS_PER_DOC_QUICK = 25 — retrieval.ts:110

Cuatro regímenes de lectura, en la función leerLaPareja (judge.ts:1285):

 · tijera_vieja — :1325, con el interruptor apagado o en exhaustivo
 · sin_fuente_comun — :1326, cuando el analizado no tiene trozos o el candidato no tiene ninguno
 · pareja_entera — :1339, cuando analizado + candidato <= presupuesto
 · corte_honesto — :1354-1377, todo lo demás

El corte_honesto, literal:

  1354  const candidatoCabeEntero = candidatoEntero.length <= presupuesto - SUELO_DEL_ANALIZADO;
  1355  const bloqueCandidato = candidatoCabeEntero ? candidatoEntero : a.bloqueRelevancia;
  1356  const topeDelAnalizado = Math.max(SUELO_DEL_ANALIZADO, presupuesto - bloqueCandidato.length);
  1357  const recortado = completo.length > topeDelAnalizado;
  1358  const texto = recortado ? completo.slice(0, topeDelAnalizado) : completo;

Tres hechos que se leen ahí:

 a) El candidato se sirve PRIMERO. Entra entero si cabe dejando el suelo; si no, entra un bloque de
    trozos elegidos por relevancia (Pinecone), con tope de 3.000 caracteres.
 b) El analizado se queda con lo que sobre, con suelo de 6.000.
 c) El recorte del analizado es slice(0, tope): se queda con el principio y tira el final. No hay
    selección por relevancia en el lado analizado, ni por trozos: corta por posición y puede partir
    una frase por la mitad. El candidato, en cambio, entra por trozos enteros.

De tu dictamen de F-123, fase 1.2: no te lo citamos literal porque nuestra copia llegó por un
terminal que recorta líneas, y preferimos no ponerte en la boca palabras que no sabemos si son
tuyas. Está en F-123_2026-10-10_orden-de-ejecucion.md:294 y las predicciones en :404-405. Lo que
entendimos: que el arreglo de la 1.2 es una constante, subir el presupuesto de 10.000 a 20.000
tokens (unos 80.000 caracteres) como proponía F-118; que con eso CLI-12 (55.135 caracteres) cabría
entero con cualquier candidato; que el régimen sin_fuente_comun deja de recortar a 6.000; que el
«escalón 2 por tramos» queda para los documentos que no quepan ni así; y las predicciones P-F123-6
y P-F123-7. Si lo necesitas literal, lo pedimos y te lo mandamos.

=====================================================================
2 · LO MEDIDO
=====================================================================

Método: se replicó la cascada en una herramienta local y se controló contra la función real. El
control sale bien en 56 de 56 parejas con dirección con el presupuesto de hoy. 8 documentos, 56
parejas con dirección. Ningún análisis lanzado, ninguna consulta a Pinecone, ninguna constante
cambiada.

2.1 · HAY UN BARRANCO. El presupuesto no es monótono: subirlo puede hacer que el juez lea MENOS.

En la pareja NOR-10 (66.801 caracteres renderizados) como analizado contra CLI-12 (55.135) como
candidato, barriendo el presupuesto:

 · por debajo de 61.135: el candidato va por bloque de 3.000 y el analizado se lleva P − 3.000.
   Más presupuesto, más lectura.
 · en 61.135 exactos: el candidato pasa a entrar entero (55.135 <= 61.135 − 6.000) y el analizado
   cae de 58.134 a 6.000 caracteres. Un carácter más de presupuesto cuesta 52.134 caracteres de
   lectura.
 · desde ahí vuelve a crecer. El analizado no recupera lo que tenía hasta pasados los 91.987.

El barranco está en P = tamaño del candidato + 6.000. Aparece en las 30 parejas con dirección del
corpus donde el analizado pasa de 6.000 caracteres, entre P = 14.000 y P = 73.000 según la pareja.
No es un caso raro: es la forma de la cascada.

2.2 · QUÉ PASA CON 80.000 CARACTERES, QUE ES EL ARREGLO QUE ENTENDIMOS DE F-123.

80.000 cae justo DESPUÉS del barranco en esta pareja. Con la regla de hoy:

 · NOR-10 analizado ← CLI-12 candidato: candidato entero 55.135, al analizado le quedan 24.865,
   frente a los 37.000 de hoy.
 · CLI-12 analizado ← NOR-10 candidato: candidato entero 66.801, al analizado le quedan 13.199.

Hay tres contradicciones sembradas por nosotros en esa pareja, con verdad documentada, más una
cuarta no sembrada que encontramos de paso. Su suerte en el lado analizado:

                          A         B                C         D
  40.000, cualquier regla  entra     entra (ver 2.4)  fuera     entra
  80.000, regla de hoy     entra     FUERA            fuera     entra
  80.000, R1, R2 o R3      entra     entra            entra     entra

Es decir: con la regla de hoy, subir el presupuesto a 80.000 deja fuera una contradicción que hoy
entra. La contradicción C (posición 58.882) queda fuera con cualquier regla por debajo de 114.224.

Un caso más extremo de la misma cascada, en otra pareja: con 80.000 y la regla de hoy, un documento
analizado de 14.704 caracteres —que cabría quince veces— se recorta a 13.199 para poder enviar al
candidato entero.

2.3 · EL BARRANCO EN PRODUCCIÓN.

Log del 30/09/2026 a las 12:29:49 (Estado_Del_MVP.md:8427-8429): NOR-10 analizado con CLI-13
candidato, régimen corte_honesto, «analizado 30183/66801 (dejó fuera), candidato 9817/9817». Cuadra
al carácter: 40.000 − 9.817 = 30.183. El candidato entró entero y le costó al analizado unos 6.600
caracteres frente a la vía del bloque.

Precisión honesta: el barranco en sentido estricto —subir P y leer menos— NO se ha observado en
producción, porque en producción solo ha existido P = 40.000. Lo del 30/09 documenta el mecanismo
que lo produce, no el barranco.

2.4 · LOS DOS TOPES SE PELEAN, Y EL CORTE PUEDE PARTIR UNA FRASE.

El tope del candidato (3.000, retrieval.ts:104) no depende del presupuesto de la pareja, pero en el
corte_honesto cada carácter del bloque es un carácter menos del analizado (línea 1356). Lo que se
ha medido:

 · La frase B del lado analizado acaba en la posición 36.852. El dato que importa de esa frase
   («semanalmente, todos los lunes») acaba antes, en 36.627. De ahí salen tres estados, no dos:
     - bloque del candidato <= 3.148 → la frase entera entra;
     - bloque entre 3.149 y 3.373 → entra el dato, pero la frase llega cortada por la mitad;
     - bloque > 3.373 → no entra nada.
 · El 30/09 se midió un bloque real de 3.206 caracteres. Es decir que ese día B habría caído en el
   estado del medio: el juez vería el dato con la frase partida. Si cae en un estado o en otro
   depende de qué trozos elija Pinecone esa tarde.
 · CORRECCIÓN A NUESTRO BORRADOR: afirmábamos que las tres contradicciones no podían publicarse a
   la vez porque los tres trozos sembrados del candidato suman 3.391 caracteres y el bloque son
   3.000. Es FALSO. El dato de B también aparece en otro trozo de CLI-12, de 685 caracteres, y con
   ese trozo las tres suman 2.568, que sí caben. No hay tope aritmético: lo que hay es dependencia
   de qué trozos elija el índice. Lo damos corregido porque la versión falsa te habría llevado a
   una conclusión equivocada.
 · Y hay un tercer filtro antes del juez: el rerank puede dejar fuera a un candidato entero. El
   30/09 un candidato desapareció dos veces. El presupuesto no es la única puerta.

2.5 · LA INTERACCIÓN CON LA REGLA DE LA CITA, QUE TÚ MISMO DICTAMINASTE EN F-126.

Esto nos parece lo más delicado y es nuevo. En F-126 dictaminaste que cada cita del juez debe ser un
tramo CONTIGUO del documento, copiado tal cual, y se construyó y se midió: 3 de 3 en las siete
pasadas, con citas literales contiguas y la puerta de citas con todos los contadores a cero.

Pero el corte del presupuesto es por posición y puede partir una frase. Si al juez le llega media
frase, se le está pidiendo que copie un tramo contiguo y literal de un texto que ya viene truncado.
No sabemos qué hace entonces: si cita el trozo mutilado, si no publica, o si completa la frase de
memoria —que sería inventar. No está medido. Lo decimos porque cualquier decisión sobre el reparto
del presupuesto decide también con qué frecuencia el juez recibe frases partidas.

2.6 · LAS CUATRO REGLAS SIMULADAS, Y SU COSTE.

Para entender el mecanismo se simularon cuatro reglas para el reparto cuando la pareja no cabe
entera. Insistimos: no es un menú.

 R0 · La de hoy. Candidato entero si cabe en P − 6.000; si no, bloque de 3.000. Al analizado lo que
      sobre, con suelo de 6.000.
 R1 · El analizado primero: se lleva min(su tamaño, P − 3.000). El candidato, su bloque de 3.000.
 R2 · Como R1, pero el candidato se lleva todo lo que sobre, no solo 3.000.
 R3 · Como R0, pero el candidato entra entero solo si al hacerlo el analizado no se queda con menos
      que por la vía del bloque.

Resultados:

 · R3 resulta ser casi R1: si el candidato mide más que el bloque, meterlo entero siempre deja al
   analizado con menos, así que R3 casi nunca elige el candidato entero.
 · Barrancos: R0 tiene uno en 30 de 30 parejas. R1, R2 y R3 no tienen ninguno en todo el barrido de
   10.000 a 200.000 caracteres.
 · Con 40.000, R1, R2 y R3 EMPEORAN seis parejas: un analizado grande con un candidato mediano (de
   7.051 a 14.704 caracteres) que hoy entra entero y pasaría a un bloque de 3.000 elegido por el
   índice. El analizado gana entre 4.000 y 11.704 caracteres a cambio.
 · Con 80.000, 52 de las 56 parejas salen iguales con las cuatro reglas, porque caben enteras. Esas
   seis parejas dejan de empeorar. Las cuatro que se distinguen son NOR-10 contra CLI-12 en las dos
   direcciones y NOR-10 contra NOR-11 en las dos.
 · En NOR-10 ← NOR-11 (81.505 caracteres en total, la única pareja que a 80.000 sigue sin caber),
   R0 lee 65.296 del analizado y el candidato entero; R1 lee el analizado entero (66.801) y 3.000
   del candidato. Ahí R0 entrega más texto total.
 · Coste, en caracteres del texto de los documentos entregados por análisis completo con 6
   candidatos: hoy 240.000 para el analizado más grande. Con R1 y 80.000, 429.851 (×1,79). Con R2 y
   80.000, 440.050 (×1,83). En los análisis de documentos pequeños el multiplicador es mayor: hasta
   ×2,10 con R1 y ×2,59 con R2, porque sus parejas pasan a caber enteras y se envía el candidato
   completo. No incluye las instrucciones fijas de cada llamada.
 · R2 exige además un selector por relevancia con presupuesto variable que hoy no existe.

2.7 · DÓNDE SE ROMPE CUALQUIER CONSTANTE.

Con las reglas sin barranco, un analizado se lee entero si mide como mucho P − 3.000. Un candidato
no se lee entero por encima de su parte con ninguna regla. Para la pareja de 121.936 caracteres,
leer los dos lados enteros exige P >= 121.936 con cualquier regla: ninguna lo adelanta.

Proyección a un documento de 300.000 caracteres, que un cliente real puede tener:

 · Leerlo entero como analizado exige P >= 303.000 caracteres, unos 76.000 tokens con la conversión
   ÷4 que NO está medida.
 · No lo impide la ventana del modelo. Lo impide la factura: el analizado viaja entero en cada una
   de las hasta 6 llamadas, unos 1,8 millones de caracteres por análisis frente a los 240.000 de
   hoy, unas 7,6 veces más.
 · Como candidato, ese documento nunca se leería entero.
 · Hacia los 700.000-800.000 caracteres, con la conversión sin medir, ninguna constante cabe en la
   ventana.

=====================================================================
3 · LO QUE NO ESTÁ MEDIDO (no lo uses como si lo estuviera)
=====================================================================

 · Los caracteres por token. La constante vale 4 y no se ha medido nunca. No podemos medirla:
   usage_logs registra inputTokens = 0, y la tabla llm_usage guarda una fila por modelo y por
   análisis, que suma el juez de cada pareja, el rerank, el verificador y la síntesis, sin ningún
   id que la una con lo que leyó el juez. Medirlo de verdad exige registrar tokens por llamada, que
   no existe, o llamar a count_tokens, que no está autorizado. Todo lo anterior va en caracteres.
 · Qué hace el juez con una frase partida. El punto 2.5. Sin medir.
 · La calidad de lectura según la longitud. El «lost in the middle» que citaste en F-118 no lo
   hemos medido. No sabemos si un analizado de 66.801 caracteres se lee igual de bien que uno de
   14.704.
 · La latencia. El análisis es síncrono y el usuario espera entre 15 y 25 segundos. No sabemos
   cuánto crece al doblar el texto.
 · La distribución real del bloque del candidato. Dos muestras, una de 3.206.
 · El corpus de hoy. El censo es del 10/10. NOR-10 y NOR-11 están en la bandeja de revisión sin
   indexar, así que las parejas que los incluyen son hipotéticas.

Hay una medición preparada y sin lanzar: NOR-10 como analizado desde la bandeja, con el presupuesto
de hoy, tres pasadas, con la SQL de lectura escrita y probada y las predicciones escritas antes. No
la lanzamos todavía. Si hay algo que quieras que se mida en ese pase, dilo y lo añadimos antes.

=====================================================================
4 · LAS PREGUNTAS
=====================================================================

P1 · Cómo lo resuelven hoy, en 2026, los sistemas serios. Cuando hay un presupuesto fijo de
     contexto que debe repartirse entre un documento bajo examen y un documento de referencia, ¿qué
     práctica está establecida? Nómbrala, di quién la usa, para qué tamaños, y qué abandona a
     cambio.

P2 · ¿Está mal planteada la pregunta? Preguntamos por el reparto, pero puede que el error esté
     antes: en que el presupuesto sea por pareja, en que haya una sola llamada por pareja, o en que
     el documento analizado viaje entero en cada llamada. Si la respuesta correcta es cambiar la
     unidad y no el reparto, dilo.

P3 · El corte por posición. Hoy el recorte se queda con el principio y tira el final, sin mirar el
     contenido. Consecuencia: en un documento largo, nada del último tercio puede entrar nunca en
     conflicto con el corpus — y ahí están los anexos, los tarifarios y las caducidades. ¿Es
     defensible? ¿Qué se hace en su lugar? Y sobre el 2.5: ¿debe el corte respetar los límites de
     frase o de trozo, aunque desperdicie presupuesto?

P4 · Los dos topes. Hay un tope del candidato (3.000) en un archivo y un presupuesto de la pareja
     (40.000) en otro, y se pelean por el mismo espacio. ¿Un solo presupuesto con regla de reparto,
     dos independientes, u otra cosa?

P5 · La monotonía. ¿Existe una formulación estándar que garantice que más presupuesto nunca
     signifique menos lectura? Si es un invariante conocido, nómbralo; queremos poder escribir una
     prueba que se ponga roja si se rompe.

P6 · El escalón 2. En F-123 lo nombraste y no lo diseñaste: leer la pareja en varios tramos. Si es
     inevitable para documentos grandes, ¿cómo se hace sin romper el resto? Nos preocupan tres
     cosas y puede que haya más que no vemos: una contradicción partida entre dos tramos, los
     duplicados al unir los hallazgos de varios tramos, y el coste multiplicado por el número de
     tramos. Y si el escalón 2 hace innecesario tocar las constantes, dilo.

P7 · El orden. Si hay que hacer varias cosas, ¿en qué orden, y cuál es la primera que se puede
     medir sola? Tenemos la norma de no construir dos cosas a la vez y de medir con predicciones
     escritas antes.

P8 · Qué entendimos mal en F-123. La simulación dice que subir el presupuesto a 80.000 con la regla
     de hoy deja esta pareja peor que hoy y tira una contradicción que hoy entra. No te pedimos que
     rectifiques: te pedimos que digas qué de lo que creíamos es falso y qué evidencia te haría
     cambiar de opinión.

P9 · Qué nos falta. ¿Qué dato no te hemos dado y necesitas? Dilo concreto —archivo, tabla,
     consulta, medición— y lo conseguimos antes de que contestes al resto, si hace falta en dos
     vueltas.

=====================================================================
5 · CÓMO QUEREMOS LA RESPUESTA
=====================================================================

 · Predicciones numeradas en el formato de siempre (P-F127-n), cada una medible con los datos que
   tenemos, es decir en CARACTERES y no en tokens, y con un número de pasadas. Si alguna solo se
   puede medir con tokens por llamada, dilo y la apuntamos como no medible hoy.
 · Si una de tus recomendaciones empeora alguna pareja del corpus, dilo con nombre y cifra. Ya nos
   ha pasado con la de 80.000 y preferimos saberlo antes.
 · Si no tienes datos para contestar algo, «no lo sé» es una respuesta útil y la preferimos a una
   estimación.

---

# (d) RESPUESTA RECIBIDA — F-127 · 16/10/2026 · DICTAMEN, ÍNTEGRO

Texto del dictamen tal como llegó al final del encargo del 16/10, con la sección de las preguntas
del director y el criterio de reversión del escalón 2 dentro. No se ha tocado.

RESPUESTA DE FABLE — F-127 · EL PRESUPUESTO DE LECTURA Y CÓMO SE REPARTE
Versión consolidada, 16/10/2026. Contiene el dictamen sobre las nueve preguntas del arquitecto; una sección con las preguntas del director hechas en conversación después del primer dictamen, marcada como tal, que cambia la prioridad del escalón 2 y el nombre de la constante; el encaje en el plan global; y la comprobación de coherencia con las respuestas anteriores. Todo debe quedar archivado junto.

Frentes decididos y sin commit desde hace más de 7 días: F-119 fase 2, 16 días. Lo nombro porque la regla lo exige, y porque esta consulta toca su vecino: la selección de candidatos y el reparto de lectura son las dos mitades de “qué ve el juez”.

Lo que entendí mal en F-123, por delante (P8 adelantado)

La tabla de F-120 ya describía el régimen corte_honesto: “analizado entero con suelo de 6.000; candidato entero si cabe dejando ese suelo, si no su bloque”. Lo leí como “el analizado se lee entero” y no hice la aritmética: “entero si cabe” para el candidato significa que, cuando cabe, se come el presupuesto antes que el analizado. Tenía la regla delante y dictaminé sin simularla. Patrón de error número 2 de mi traspaso, otra vez.
P-F123-6 queda refutada en general: CLI-12 contra NOR-10 a 80.000 con la regla de hoy se lee al 24 %, no al 100 %. Sobrevive solo para candidatos pequeños, que es lo que tenía en la cabeza y no escribí.
Creí monótono un presupuesto que no lo es por construcción. No lo habría visto sin simular, y la simulación es vuestra. Es la contribución más valiosa de esta consulta.
Lo que me haría cambiar de opinión sobre lo que digo abajo: nada que no esté ya en vuestra herramienta. Las predicciones de reparto se verifican en simulación, a coste cero, antes de desplegar.

Veredicto

P2 primero, porque ordena todo: la pregunta del reparto es la buena para hoy y la mala para el destino. Para hoy, el reparto se arregla en cinco líneas y se verifica en simulación. Para el destino, la unidad cambia: el analizado no viaja entero por llamada, viaja por ventanas, y el candidato se recupera por relevancia para cada ventana. Eso es el escalón 2, es lo que hacen los sistemas serios, y tras la conversación con el director deja de ser “para cuando haga falta” y pasa a ser la pieza que cierra este frente (sección D).
P1: la práctica establecida es no repartir. Se trocea lo examinado y se recupera lo de referencia por relevancia para cada trozo. Se abandona el contexto entre trozos y se recompone con solapamiento.
P3: el corte por posición no es defensible. Interino: cortar en límite de trozo y declararlo. Definitivo: que no haya corte.
P4 y P5: un solo presupuesto por llamada, con reservas por papel y prioridad al analizado. Monótono por construcción, con nombre y prueba.
P6 y P7: el escalón 2 se diseña abajo. Lo primero que se mide solo es registrar tokens por llamada, que hoy no existe y sin lo cual ninguna cifra de coste es cifra.

P1 · Cómo lo resuelven los sistemas serios

Todo de entrenamiento, con nombre buscable. Cuatro prácticas; la primera es la dominante.

1 · Trocear lo examinado y recuperar lo de referencia por trozo. El documento bajo examen no viaja entero: se recorre por ventanas, y para cada ventana se traen los pasajes de referencia relevantes. Una llamada por ventana; los resultados se unen. Buscables: “map-reduce over chunks”, “chunk-and-retrieve”, LangChain “map_reduce” y “refine”, LlamaIndex. Quién: toda recuperación aumentada en producción sobre documentos largos. Tamaños: sin límite por construcción, porque la ventana es fija y el documento mide lo que sea. Qué se abandona: el contexto entre ventanas; se mitiga con solapamiento y con un perfil por documento que viaja en todas.

2 · Meterlo todo cuando cabe, con caché del lado repetido. Cuando la pareja cabe, se entrega entera, y la parte que se repite entre llamadas se marca para caché. Buscables: “prompt caching” (Anthropic), “context caching” (Google). Tamaños: hasta la ventana, con la factura como límite real. Qué se abandona: control de coste sin caché, y calidad de lectura en el medio de contextos largos, “lost in the middle” (Liu et al., 2023), que no habéis medido y yo no afirmo para vuestro caso.

3 · Jerarquía de resúmenes. Buscable: “RAPTOR” (Sarthi et al., 2024). Abandona el detalle, que es lo que una contradicción necesita. No para vosotros como mecanismo principal.

4 · Extracción por cláusula y comparación estructurada. Las herramientas de revisión de contratos extraen cláusulas localizadas y comparan cláusula contra cláusula. De entrenamiento: Kira, Luminance, Harvey. Es el destino de F-118, no de ahora.

Lo que no hace nadie: presupuesto fijo por pareja con la referencia servida antes que lo examinado y lo examinado cortado por posición. Vuestra regla de hoy no se parece a ninguna práctica, y la simulación explica por qué: no es monótona.

Sobre “el analizado viaja entero en cada una de las seis llamadas” (2.7): verdad en caracteres y, de entrenamiento, falso en factura con caché: el analizado es un prefijo idéntico en las seis llamadas, y los tokens de caché cuestan una fracción. No lo afirmo medido: vuestro registro no distingue tokens de caché. P9 lo pide.

P2 · ¿Está mal planteada la pregunta?

Sí para el destino, no para hoy.

Para hoy, el reparto es la pregunta correcta: la regla tiene barranco en 30 de 30 parejas y arreglarlo son las líneas 1354 a 1358, verificables sin lanzar nada.
Para el destino, la unidad es la equivocada. Una llamada por pareja con presupuesto fijo obliga a elegir qué parte de cada documento se tira. La unidad correcta es la ventana del analizado: el analizado se lee entero, en ventanas, y el candidato se recupera por relevancia para cada ventana. El presupuesto pasa de “por pareja” a “por llamada”, y no hay nada que repartir entre dos documentos, porque el analizado siempre cabe por construcción.
“El analizado viaja entero en cada llamada” deja de ser un problema de reparto y pasa a ser uno de caché, con solución estándar.

Reparto monótono ahora; cambio de unidad como escalón 2. El reparto monótono es lo que el escalón 2 usa dentro de cada ventana.

P3 · El corte por posición

No es defensible como regla. Un documento del que nunca puede entrar en conflicto el último tercio es un documento del que no se analiza el último tercio, y ahí viven anexos, tarifarios y caducidades. Es la tijera del 6.000 de F-118 con otro tamaño.

Definitivo: que no haya corte. Ventanas, P6.
Interino: el corte respeta el límite de trozo y lo omitido se declara al juez con su tamaño: “el documento continúa; no se te han mostrado N caracteres a partir de aquí”. Es el corte honesto de F-116; comprobad que el régimen que lleva ese nombre lo hace (P9).
Sí, aunque desperdicie presupuesto. Perder hasta un trozo por respetar el límite es barato; entregar media frase al juez con una regla que exige citar tramos contiguos literales es pedirle que cite un texto que no existe entero. Sobre el 2.5: no sé qué hace el juez con media frase y no lo estimo. Sonda de tres pasadas con un corte deliberado a mitad de frase que contenga una trampa. Predicción con confianza declarada abajo.

P4 · Los dos topes

Un solo presupuesto por llamada, con reservas por papel y prioridad declarada. Dos topes independientes que compiten por el mismo espacio son dos criterios para un dato.

TAMANO_VENTANA: una constante, en caracteres mientras no haya tokens medidos. (Nombre nuevo; ver D1.)
RESERVA_CANDIDATO: mínimo garantizado al candidato, 3.000 hoy. FRAGMENT_BUDGET_CHARS_QUICK cambia de oficio: de tope a suelo.
Reparto: el analizado se lleva min(su tamaño, P − RESERVA_CANDIDATO); el candidato el resto, entero si cabe, si no por relevancia hasta el resto. Es vuestra R2 con suelo. R1 es R2 con el candidato clavado en 3.000; R2 solo es mejor, y lo que le falta es pasar un presupuesto variable a selectUnitsWithinBudget (P9).
SUELO_DEL_ANALIZADO desaparece: con prioridad al analizado, su suelo es su tamaño.

Lo que esta regla empeora, con nombre y cifra:

A 40.000, seis parejas, las del 2.6: analizado grande con candidato entre 7.051 y 14.704 que hoy entra entero y pasaría a bloque. El analizado gana entre 4.000 y 11.704; el candidato pierde lo mismo. No sé cuál lado vale más en esas seis; sí sé que a 80.000 el problema desaparece.
A 80.000, NOR-10 ← NOR-11: R0 entrega 65.296 + 9.817; R2 entrega 66.801 + 13.199. R2 entrega más, no menos; corrijo el 2.6, que compara R0 con R1, no con R2.
Por eso el reparto y la subida a 80.000 van en un solo cambio lógico con una ficha: “ventana de 80.000 con reparto monótono y reserva de candidato”. Separados, cada uno empeora algo; juntos, no empeoran ninguna de las 56.

P5 · La monotonía

Invariante conocido: monotonía de recurso, buscable “resource monotonicity”: si crece el total, nadie recibe menos. R0 lo viola porque la asignación del candidato es una función escalón del presupuesto.

R2 con suelo lo cumple por construcción: reparto por prioridad con reservas constantes; al subir P, el primero recibe más o igual hasta llenarse y el segundo el resto, sin escalones.

La prueba que se pone roja:

Para cada pareja con dirección, barrer P de 10.000 a 200.000 de 1.000 en 1.000.
Afirmar: analizado(P) ≤ analizado(P+1000), candidato(P) ≤ candidato(P+1000), analizado + candidato ≤ P.
Segunda: si analizado + candidato ≤ P, los dos enteros.
Control positivo: con R0 debe ponerse roja en las 30 parejas del barranco. Si no, la prueba no vale.

P6 · El escalón 2

Diseño, en siete piezas. Se activa cuando la pareja no cabe en la ventana; con 80.000, hoy, en una pareja de 56.

Ventana: tramos del analizado de tamaño fijo, cortados en límite de trozo, con solapamiento de un trozo entre ventanas consecutivas. Todas las ventanas se procesan: el documento se lee entero. Es la regla de F-118 D5: el tramo lo más grande que quepa, nunca un trozo por llamada.
Candidato por ventana: si cabe entero en el resto, entra entero en todas. Si no, para cada ventana se recuperan por relevancia los trozos del candidato, dentro del candidato solamente, hasta el resto. Es la búsqueda dirigida de F-116 aplicada por ventana.
Una llamada por ventana, en paralelo. Instrucciones fijas y perfil del candidato en caché.
Declaración: cada llamada sabe qué ventana es, cuántas hay, y que las demás existen.
Unión y desduplicación: la puerta ya devuelve posiciones (citasAlTramo). Dos hallazgos de ventanas distintas cuyas citas se solapan en posición en ambos lados son el mismo; se conserva uno y se cuenta duplicado_entre_ventanas.
La contradicción partida entre ventanas no existe como tal: es entre A y C, y cada ventana lleva su C. Lo que puede partirse es una afirmación de A, cubierta por el solapamiento. Lo que sí se pierde es “A dice X en la página 3 y lo matiza en la 40”: precio de la práctica 1, mitigado con solapamiento y, más adelante, con un perfil del analizado en cada ventana.
Coste: ventanas × (ventana + resto). Para NOR-10 con ventanas de 24.000, tres por candidato, dieciocho llamadas. Es el coste correcto: un documento tres veces más largo cuesta tres veces leerlo. Y un límite de ventanas por análisis a partir del cual el sistema avisa en vez de seguir: no protege la calidad, protege el dinero (ver D3).

¿Hace innecesario tocar las constantes? No. El escalón 2 usa el reparto dentro de cada ventana. Sin reparto monótono, cada ventana hereda el barranco.

Lo que no veis: el rerank. Con ventanas, un candidato relevante solo para la ventana 3 debe seguir siendo candidato. Hoy el rerank lo decide con los primeros 3.000 caracteres del analizado. Eso es F-119. Las dos piezas se tocan.

P7 · El orden de este frente

Criterio: primero lo que mide sin cambiar nada; después lo que se verifica en simulación antes de desplegar; después lo que cambia la unidad.

Registro de tokens por llamada. Cero cambio de comportamiento. Cada llamada guarda input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens, latencia, id de pareja y ventana. La API lo devuelve en cada respuesta; hoy se tira. No hace falta count_tokens.
Corte en límite de trozo con declaración. Medible solo con el pase preparado de NOR-10. Protege la regla de la cita de F-126.
Ventana de 80.000 con reparto R2-con-suelo, un solo cambio lógico, verificado en simulación sobre las 56 parejas antes de desplegar, con la prueba de monotonía en el arnés.
Caché de prompt en el lado analizado, medida con los tokens de caché del paso 1. Depende de un cambio previo apuntado en F-122: los documentos van hoy pegados en el prompt y deben ir como bloques de documento para que la caché actúe. Ese cambio en llm-client.ts va antes del paso 4 y se mide solo: misma salida del juez con los documentos como bloques.
Escalón 2: ventanas. Con la prioridad que fija la sección D.

La primera que se mide sola es la 1: dejar de tirar un dato que ya llega.

Sobre el pase preparado de NOR-10: lanzadlo, y añadid dos lecturas: en qué posición exacta cae el corte y si parte una frase; y si el juez cita algo en los 500 caracteres anteriores al corte, y qué hace con ello. Es la sonda del 2.5 gratis.

P8 · Qué entendimos mal en F-123

Está arriba. Resumen: falso que “el analizado se lee entero en corte_honesto” (es condicional y favorece al candidato); falso que “subir el presupuesto solo puede mejorar”; falso en general P-F123-6. No falso: que 80.000 es la cifra correcta para vuestro corpus, con reparto monótono, 55 de 56 enteras y la otra leyendo más que hoy. Evidencia que me haría cambiar de opinión sobre R2-con-suelo: que en el pase de NOR-10 o en las seis parejas del 2.6 el lado candidato pierda la cita sembrada por el bloque por relevancia más veces de las que el analizado gana la suya.

P9 · Qué me falta

Tokens por llamada (paso 1 de P7). Sin eso, nada de coste ni latencia.
judge.ts, régimen corte_honesto: si declara al juez el texto omitido y cómo. Fichero y línea.
selectUnitsWithinBudget: si acepta un presupuesto como parámetro.
El prompt del juez: si dice algo sobre texto truncado.
Del pase de NOR-10: posición del corte, si parte frase, qué hace el juez cerca del corte.
Distribución histórica del bloque del candidato, de los logs desde el 30/09.
Estado real de la fase 0 (0.2, 0.3, 0.4), con commit. Lo necesito para el encaje en el plan global de abajo.

No necesito nada de esto para lo dicho; lo necesito para no tener que corregirlo.

PREGUNTAS DEL DIRECTOR, HECHAS EN CONVERSACIÓN TRAS EL PRIMER DICTAMEN (15/10, 14:15–18:50)

Esta sección no estaba en la consulta. Recoge tres preguntas del director y lo que respondí, y de ellas salen un cambio de prioridad, un cambio de nombre y un criterio de reversión que quedan archivados.

D1 · “Subir a 80.000 no es escalable: llegará un documento más grande y habrá que subir a 120.000, y así siempre. Tiene que haber una solución que usen los sistemas serios, y no creo que sea limitar el tamaño del archivo.”

El director tiene razón, sin matices. Subir el presupuesto no es la solución; es un parche que cubre el corpus de hoy. La solución del sector es la práctica 1 de P1: leer por ventanas. Nadie limita el tamaño del archivo; limitan el tamaño de la ventana, que es suyo y no del cliente.
Con un ejemplo: un inspector con una mesa fija y dos carpetas. Hoy pone la vieja entera y de la nueva las páginas que quepan, empezando por la primera; si la nueva tiene 200 páginas y quedan 40 de hueco, nunca ve las 160 restantes. Una mesa más grande solo mueve el problema a la carpeta de 300 páginas del mes que viene. Con ventanas, lee la nueva por tandas de 20 páginas, todas hasta el final, y para cada tanda saca del índice solo las páginas de la vieja que hablan de lo mismo. Veinte nuevas más cinco viejas caben siempre, tenga la nueva 50 páginas o 5.000.
Decisión que queda archivada: el escalón 2 deja de ser “para lo que no quepa” y pasa a ser la pieza que cierra este frente. El paso 3 de P7 sigue siendo previo, porque quita un defecto en dos días y es lo que el escalón 2 usa dentro de cada ventana; pero no es el final del frente. El final es el paso 5.
Cambio de nombre que queda archivado: la constante deja de llamarse presupuesto de pareja y pasa a llamarse tamaño de ventana. Una ventana no se sube cuando llega un documento más grande: se añaden ventanas. Es la diferencia entre una constante que persigue a los documentos y una que no vuelve a tocarse.

D2 · “¿Entonces el documento se seguirá leyendo entero? Porque si no, choca con lo que teníamos hecho para que no se escape nada.”

Sí, entero. Por ventanas no significa “parte del documento”; significa “todo el documento, por tandas”. Ninguna ventana se salta. Hoy, con un documento de 200 páginas, el juez lee 40 y las 160 restantes no existen para el análisis. Con ventanas lee las 200. La garantía de “no se escapa nada” no se pierde: se gana, porque hoy no existe para los documentos largos.
Lo que sí se pierde, dicho con honestidad: ver juntas dos páginas lejanas del mismo documento. Para contradicciones entre el nuevo y el viejo casi no pesa, porque cada ventana lleva su parte del viejo; para matices internos de un documento largo, algo. Se mitiga con el solapamiento y, más adelante, con un resumen corto del documento que viaje en cada ventana.
Para las parejas que caben en una ventana, que hoy son 55 de 56, nada cambia: el juez sigue leyendo los dos documentos enteros de una vez, como desde el escalón 1. Las ventanas no sustituyen eso; lo extienden a lo que hoy no funciona.

D3 · “Entonces aumenta el coste por análisis pero la calidad es la misma, y ¿hay que poner un tope de archivo?”

Coste: sí, crece con el tamaño, y es el coste correcto, cobrado por análisis. Calidad dentro de cada ventana: la misma que hoy en una pareja que cabe. Calidad de visión global del documento: un poco menos, como dice D2, y es lo que el producto no promete.
Tope: no hay tope de archivo que fijar. El sistema sabe cuánto mide el documento porque lo troceó al indexar, y de ahí sale cuántas ventanas hacen falta: se calcula, no se configura. Lo único fijo es el tamaño de la ventana.
Lo que sí conviene es un límite de ventanas por análisis a partir del cual el sistema avisa en vez de seguir: “este documento necesita 40 ventanas y costará X; ¿continuar?”. No protege la calidad; protege el dinero, con la lógica de los topes de gasto de F-117. Es para que un cliente que sube 2.000 páginas por error no gaste el mes sin enterarse.

CRITERIO DE REVERSIÓN DEL ESCALÓN 2, ESCRITO ANTES: antes de activarlo, las parejas que caben en una ventana dan exactamente lo mismo que hoy en el arnés, porque para ellas no cambia nada; la pareja que no cabe, NOR-10 ← NOR-11, da igual o más. Si una trampa que hoy sale deja de salir, se apaga el interruptor. “La calidad no mengua” se lee en una tabla, no se cree.

DÓNDE ENCAJA ESTO EN EL PLAN GLOBAL (F-123, actualizado por F-124 a F-127)

Estado de las fases, a 16/10, según lo que me consta:

Fase 0 · Suelo limpio y contadores. 0.1 hecha (restos fuera, 11/10). 0.2 contadores de topes ciegos, 0.3 línea base y 0.4 comparación de entradas: en curso o pendientes; que Code diga su estado real con commit (P9.7).
Fase 1 · Lo que pierde pasadas enteras. 1.0 caja definida: hecha (F-125). 1.1 guarda del rerank: archivada con condición (F-124). 1.2 presupuesto de lectura: es esta consulta. Se sustituye por los pasos 1 a 4 de P7.
Fase 2 · F-119 recortada. Sin empezar, 16 días. Sigue siendo la segunda prioridad del plan y esta consulta no la mueve. El escalón 2 la necesita: el rerank decide con 3.000 caracteres del analizado y con ventanas eso es aún más ciego.
Fase 3. 3.1 puerta por tramo largo: hecha (F-126). 3.2 verificador ciego y 3.3 segunda vuelta dirigida: pendientes. 3.4 vía 2: condicionada al resultado del cambio de regla de cita de F-126, por medir.
Nuevo de esta consulta: el escalón 2, ventanas. Entra como fase 4, después de F-119, porque la necesita, y después de 3.2 y 3.3, porque multiplica llamadas y conviene que lo que llega al juez esté ya depurado. Es la pieza que cierra el frente de lectura y el límite de tamaño de archivo.

Orden de ejecución resultante, de hoy en adelante:

P7 pasos 1 y 2: registro de tokens; corte en límite de trozo. Días.
P7 paso 3: ventana 80.000 con reparto monótono, verificada en simulación. Días.
Medición pendiente de F-126: regla de cita corta, siete pasadas. Decide 3.4.
Fase 2: F-119 recortada, con sombra. Una a dos semanas.
Documentos como bloques (F-122) y P7 paso 4: caché. Factura, no comportamiento.
Fase 3: verificador ciego, segunda vuelta dirigida, y vía 2 si F-126 la activa.
Fase 4: escalón 2, ventanas, con el criterio de reversión escrito en D.

Lo que sigue congelado con fecha: tablas de Word, cola y análisis en segundo plano, búsqueda híbrida, extracción de afirmaciones, tope del agente salvo el commit de una línea.

Criterio de “cerrado para enseñar”, sin cambios: cada trampa sembrada publicada en 4 de 5 pasadas o más, cero falsos, coste por análisis escrito. Hoy, con NOR-11: 3 de 3 en 1 de 7 y 2 de 3 en 6 de 7. Lo que falta para el criterio en esa pareja es LUGAR, y lo decide el punto 3 de esta lista.

COHERENCIA CON LAS RESPUESTAS ANTERIORES

Revisado contra F-116, F-118, F-119, F-122, F-123 y F-126. No hay contradicción; hay tres puntos de contacto que se dejan escritos para que nadie los lea como tal:

F-118 rechazó el corte por posición; F-127 lo mantiene un tiempo. Mismo criterio con un interino acotado y con fecha: con ventana de 80.000 el corte por posición no actúa en ninguna de las 56 parejas; solo actuaría en documentos mayores que lleguen antes de la fase 4, cortando en límite de trozo y declarándolo. Con las ventanas desaparece del todo.
F-123 1.2 decía “80.000 y CLI-12 cabe entero”. Era falso con la regla de hoy. F-127 lo corrige en P8: la cifra se mantiene, la regla de reparto cambia. No es una opción distinta; es la misma decisión con el defecto quitado.
La caché del paso 4 depende del cambio de bloques de documento apuntado en F-122. Va antes y se mide solo.

Dos coincidencias que refuerzan: la regla de F-118 D5, “el tramo lo más grande que quepa, un chunk por llamada es lo peor”, es exactamente el diseño de ventana de P6; y el límite de ventanas por análisis es el tope de gasto por organización de F-117 aplicado a este caso, no un mecanismo nuevo.

Lo único que cambia de sitio, declarado en D1, es la prioridad del escalón 2: F-118 ya lo tenía como pieza obligatoria para documentos largos y F-123 como punto 7 de la lista; ahora tiene fecha y lugar.

Predicciones, en caracteres y con pasadas

P-F127-1 (simulación, 0 pasadas). Con R2-con-suelo y ventana 80.000, el barrido de 10.000 a 200.000 no muestra barranco en ninguna de las 56 parejas; la prueba de monotonía se pone roja con R0 en 30 de 30.
P-F127-2 (simulación, 0 pasadas). Con R2-con-suelo y 80.000: analizado entero en 56 de 56; candidato entero en 52 de 56; en NOR-10 ← CLI-12 entran A, B, C y D en el lado analizado, C incluida.
P-F127-3 (simulación, 0 pasadas). A 40.000, las seis parejas del 2.6 empeoran en el lado candidato en la cifra que ya tenéis; a 80.000, ninguna pareja empeora en ningún lado.
P-F127-4 (pase de NOR-10, 3 pasadas, presupuesto de hoy). El corte a 30.183 cae a mitad de frase en las 3. Confianza alta.
P-F127-5 (misma sonda). Qué hace el juez con la media frase: no lo sé. Apuesta de baja confianza: la cita literalmente y la puerta la acepta en 2 de 3.
P-F127-6 (no medible hoy; con el paso 1). Caracteres por token en vuestro español: entre 3,2 y 3,7, no 4. 40.000 caracteres son entre 10.800 y 12.500 tokens. No rompe nada; la etiqueta de la constante está mal.
P-F127-7 (no medible hoy; con los pasos 1 y 4). Con cache_control sobre el analizado, en las llamadas 2 a 6 más del 60 % de los tokens de entrada son lecturas de caché.
P-F127-8 (latencia; con el paso 1). De 40.000 a 80.000 con reparto monótono, la mediana por llamada sube menos de 3 segundos. Baja confianza.
P-F127-9 (escalón 2, 5 pasadas por pareja). Con ventanas activadas, las 55 parejas que caben dan resultado idéntico al arnés; NOR-10 ← NOR-11 detecta sus trampas sembradas en 4 de 5 o más; duplicado_entre_ventanas es mayor que 0 en al menos una pasada.
P-F127-10 (bloques de documento, 5 pasadas). Pasar los documentos de texto pegado a bloques de documento no cambia ningún resultado del arnés en las trampas de NOR-11.

---

# (e) PREDICCIONES REGISTRADAS, PENDIENTES DE MEDICIÓN

Con la cifra exacta, tal como las escribe el dictamen. Sin veredicto: las calificaciones son del
arquitecto.

| N.º | De quién | Predicción | Cifra exacta | Cómo se mide | Estado |
|---|---|---|---|---|---|
| P-F127-1 | Fable | Con R2-con-suelo y ventana 80.000, ningún barranco en el barrido de 10.000 a 200.000; la prueba de monotonía se pone roja con R0 | **0 de 56** con R2 · **30 de 30** con R0 | simulación, 0 pasadas | sin calificar |
| P-F127-2 | Fable | Con R2-con-suelo y 80.000: analizado entero, candidato entero, y en NOR-10 ← CLI-12 entran A, B, C y D en el lado analizado | **56 de 56** · **52 de 56** · las cuatro | simulación, 0 pasadas | sin calificar |
| P-F127-3 | Fable | A 40.000, las «seis parejas» del 2.6 empeoran en el lado candidato; a 80.000, ninguna empeora en ningún lado | **ninguna** a 80.000 | simulación, 0 pasadas | sin calificar |
| P-F127-4 | Fable | El corte a 30.183 cae a mitad de frase. Confianza alta | **en las 3** | pase de NOR-10, 3 pasadas | sin medir |
| P-F127-5 | Fable | El juez cita la media frase literalmente y la puerta la acepta. Confianza baja | **2 de 3** | misma sonda | sin medir |
| P-F127-6 | Fable | Caracteres por token en el español del corpus | **entre 3,2 y 3,7** | no medible hoy; con el paso 1 | no medible hoy |
| P-F127-7 | Fable | Con cache_control sobre el analizado, lecturas de caché en las llamadas 2 a 6 | **más del 60 %** de los tokens de entrada | no medible hoy; con los pasos 1 y 4 | no medible hoy |
| P-F127-8 | Fable | De 40.000 a 80.000 con reparto monótono, la mediana de latencia por llamada sube. Baja confianza | **menos de 3 segundos** | con el paso 1 | no medible hoy |
| P-F127-9 | Fable | Con ventanas, las 55 parejas que caben dan lo mismo que el arnés; NOR-10 ← NOR-11 detecta sus trampas; duplicado_entre_ventanas | idénticas · **4 de 5 o más** · **> 0** en al menos una pasada | escalón 2, 5 pasadas por pareja | sin medir |
| P-F127-10 | Fable | Pasar los documentos a bloques de documento no cambia ningún resultado del arnés en las trampas de NOR-11 | **ningún cambio** | bloques de documento, 5 pasadas | sin medir |

**Criterio de reversión del escalón 2** (Fable, escrito antes de construirlo): está en (d), en su
propio párrafo, tal como llegó.

---

# (f) ANOTACIONES POSTERIORES DEL ARQUITECTO — NO SON PARTE DEL DICTAMEN

Escritas el 16/10/2026, el día del archivo, «aunque todavía no estén confirmadas, con la palabra
pendiente de confirmar, porque si no se anotan hoy se olvidan». Debajo de cada una, lo que comprobó
Code el mismo día. El texto de (c) y (d) no se toca.

1. **El dictamen contiene un número equivocado en la corrección del punto 2.6**: escribe «65.296 +
   9.817» para NOR-10 ← NOR-11, y 9.817 es el tamaño de CLI-13, no de NOR-11. Pendiente de confirmar
   en el punto 3.a del encargo del 16/10.
   - **Comprobado por Code el 16/10/2026: el número es equivocado.** NOR-11 mide 14.704 caracteres
     renderizados. Con la regla de hoy a 80.000, NOR-10 ← NOR-11 entrega **65.296 + 14.704 =
     80.000**; con R2-con-suelo, **66.801 + 13.199 = 80.000**. La afirmación que el número sostenía
     —«R2 entrega más, no menos»— **tampoco se sostiene**: las dos entregan 80.000 en total; R2 da
     1.505 caracteres más al analizado y 1.505 menos al candidato, que deja de entrar entero.

2. **El dictamen describe la medición de F-126 como pendiente** y da el estado de NOR-11 como «3 de 3
   en 1 de 7 y 2 de 3 en 6 de 7», que es el resultado del 13/10 y no el del 14/10. Pendiente de
   confirmar en el punto 3.b del encargo del 16/10.
   - **Comprobado por Code el 16/10/2026: la versión del arquitecto es la correcta.** El «3 de 3 en
     1 de 7» es la fase 3.1, siete pasadas del 13/10 de 11:43:20 a 11:56:43
     (`claude/Predicciones_F125_Seis_Pasadas.md:3`, `:20-23` y `:39`). La regla de la cita de F-126
     se midió el 14/10, siete pasadas de 08:28:55 a 08:46:38, **3 de 3 en las siete**
     (`claude/Predicciones_F126_La_Regla_De_La_Cita.md:21-28`; `claude/Estado_Y_Pendientes_14-10-2026.md:22`).
     Y **a Fable se le mandó el resultado del 14/10**: está en la propia consulta de F-127, en (c),
     punto 2.5 («se construyó y se midió: 3 de 3 en las siete pasadas»).

Tres anotaciones más, del mismo 16/10/2026, escritas después de la revisión del arquitecto:

3. **ERROR DEL ARQUITECTO, confirmado: el bloque de 3.206 que la consulta cita en su punto 2.4 es de
   otra pareja.** La consulta lo usa para sostener que «ese día B habría caído en el estado del
   medio». Es de CLI-13 ← NOR-10, el 30/09 a las 12:29:31 (`claude/Estado_Del_MVP.md:8435`), no de
   NOR-10 ← CLI-12. En la pareja que se mide, el bloque fue **2.857 en 8 de 8 pasadas** (02 y 03/10,
   `claude/Estado_Del_MVP.md:11152` y `:11585`), y la frase B entra **entera, con 291 caracteres de
   margen**. Ese párrafo del punto 2.4 es incorrecto, y la predicción P-F127-5 de Fable descansa en
   parte sobre él.
   - Precisión de Code: la conexión entre el 3.206 y la frase B la hizo Code en su informe del
     14/10 («ya hay un bloque real medido de 3.206, por encima de los 3.148 que dejan dentro la
     frase B con NOR-10 como analizado»), sin decir que eran parejas distintas. De ahí pasó a la
     consulta.

4. **Las «seis parejas» que empeoran a 40.000 son OCHO**: CLI-12 o NOR-10 como analizado frente a
   CLI-13, OPE-10, OPE-11 y NOR-11. Y `pareja_entera` se decide en `lib/analysis/judge.ts:1337`, no
   en `:1339`. Los dos errores son de Code, de sus informes del 15/10, y pasaron a la consulta (2.6
   y 1) y al dictamen (P4 y P-F127-3).

5. **P-F127-3 queda REFUTADA** por el recorrido de Code de las 56 parejas con dirección (16/10/2026,
   en simulación, con la regla de hoy contra la de Fable: el analizado se lleva lo menor entre su
   tamaño y P − 3.000, y el candidato el resto, entero si cabe y si no por relevancia hasta el
   resto). «A 80.000, ninguna pareja empeora en ningún lado» es falso; empeoran CUATRO, todas en
   el lado candidato:
   - CLI-12 ← NOR-10: el candidato pasa de 66.801 entero a 24.865 (−41.936); el analizado, de
     13.199 a 55.135;
   - NOR-10 ← CLI-12: el candidato pasa de 55.135 entero a 13.199 (−41.936); el analizado, de
     24.865 a 66.801;
   - NOR-10 ← NOR-11: el candidato pasa de 14.704 entero a 13.199 (−1.505); el analizado, de 65.296
     a 66.801;
   - NOR-11 ← NOR-10: el candidato pasa de 66.801 entero a 65.296 (−1.505); el analizado, de 13.199
     a 14.704.

   A 40.000, con la reserva de 3.000 al pie de la letra, empeoran DOCE: las ocho del lado candidato
   de la anotación 4, y cuatro en el lado analizado, porque se reservan 3.000 a un candidato que
   mide 918 o 917 (CLI-12 o NOR-10 frente a OPE-13 o RRHH-08, de 39.082 o 39.083 a 37.000).
   Con la reserva igual a lo menor entre 3.000 y el tamaño del candidato, esas cuatro dejan de
   empeorar y quedan las ocho.
