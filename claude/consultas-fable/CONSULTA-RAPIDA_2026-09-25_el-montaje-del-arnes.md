---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: SIN NÚMERO — consulta rápida
Fecha: 25/09/2026
Asunto: ¿Estamos montando bien el arnés? Juicio sobre las seis decisiones de
        diseño del examen. Fable dice OK a las seis y encuentra UNA CARENCIA
        GRAVE —el examen sólo mide «debe encontrar»— y UN FALLO CONCRETO: el
        grep de los discriminantes se hizo sobre el documento y no sobre los
        fragmentos.
Estado: vigente
Superada por: —
⚠️ POR QUÉ NO LLEVA NÚMERO DE F, Y POR QUÉ SE ARCHIVA IGUAL. No es una consulta
        formal: no lleva informe, no pide dictamen por puntos y se pidió «un OK
        o un "esto lo haría distinto", lo más corto que puedas». **Pero cambió el
        plan**, y la regla de custodia del protocolo
        (`claude/Protocolo_Harness_Tasas.md:179`) no distingue por formato: «toda
        consulta a Fable se archiva íntegra». Numerarla la metería en una serie
        que significa otra cosa; no archivarla dejaría un cambio de plan sin su
        motivo. De ahí el nombre con prefijo y fecha, que ordena y no se puede
        confundir con `F-###.md`.
⚠️ QUÉ LA ORIGINÓ: tres días montando el arnés de F-117 —cuatro casos, el filtro
        restrictivo, el ejecutor— y la sospecha de que un error de diseño ahora
        se paga durante meses. Se preguntó ANTES de escribir el endpoint, que es
        lo único que quedaba por construir.
⚠️ LA CARENCIA GRAVE, Y ES LA QUE REORDENA EL PLAN:
        **«El examen sólo mide "debe encontrar". Con sólo trampas sembradas, un
        sistema que emite todo lo que se le ocurre saca verde. Hacen falta casos
        con esperado cero: los siete falsos de agosto como "no debe salir", y al
        menos una pareja limpia. Sin eso, el arnés mide COBERTURA y no PRECISIÓN,
        y vuestro fallo de la semana pasada fue de PRECISIÓN.»**
        ⚠️ Es exacto y es el mismo animal que la regla del cero de esta casa, con
        el signo cambiado: **cuatro casos de «debe salir» son un examen que no
        puede suspender a un sistema que inventa.** El falso del autoclave que
        volvió el 23/09 —F-116— no lo habría cazado ninguno de los cuatro casos
        escritos hasta hoy.
⚠️ EL FALLO CONCRETO, Y ES DEL ARQUITECTO AL APROBAR EL FORMATO:
        **«El grep se hizo sobre el documento, no sobre los fragmentos. Si el
        trozado parte una frase discriminante en dos fragmentos, el juez no puede
        citarla aunque acierte. Repetid el grep sobre la tabla de fragmentos, y
        repetidlo EN CADA PASADA, porque un cambio de trozado lo rompería en
        silencio.»**
        Los cinco discriminantes de P1 se verificaron con `grep -c` sobre el
        texto extraído del `.docx` el 25/09 —1 aparición en su documento, 0 en el
        otro— y esa medición **no dice nada sobre si caben dentro de un solo
        fragmento**. Un discriminante partido por una costura convierte el caso en
        NO MEDIBLE, no en rojo, y hoy nada lo distinguiría.
LO QUE FABLE VALIDA SIN PEROS: las seis decisiones, y dos de ellas —la 3, el
        emparejamiento por cita discriminante, y la 6, restringir el corpus y el
        denominador del fondo a la vez— «están mejor que lo que hacen muchos
        equipos».
LO QUE AÑADE Y NO TENÍAMOS, y son dos cosas que «un equipo con experiencia daría
        por obvias»:
        · **PROCEDENCIA EN CADA PASADA**: commit del código, modelo y versión,
          hash de cada prompt, hash de cada documento de prueba, versión del
          examen. «Sin eso, dentro de un mes no sabréis contra qué se midió una
          base.» Y es además la cura del primer modo de degradación.
        · **UN CASO RESERVADO que nadie mira al ajustar prompts.** «Ahora mismo
          los cuatro son de desarrollo.»
⚠️ LOS SEIS MODOS DE DEGRADACIÓN DE UN EXAMEN, su respuesta a la pregunta 2, y es
        la parte que más dura de todo el dictamen:
        1. alguien edita un documento de prueba o cambia el trozado → cura: los
           hashes;
        2. el modelo cambia por debajo → cura: registrar la versión y el canario
           de F-114;
        3. la base se actualiza a «lo que pasó hoy» para quitar un rojo → cura:
           cambiar base o umbral es un commit con motivo escrito;
        4. la lista de pendientes conocidos crece y se vuelve un cajón → cura: es
           una métrica **con trinquete**, puede bajar y no subir;
        5. se afloja un umbral para que deje de parpadear → misma cura que 3;
        6. las frases de los documentos de prueba acaban dentro de un prompt o de
           un ejemplo → cura: el caso reservado.
⚠️ EL MARCADOR CAMBIA DE UNIDAD, y es su respuesta a la pregunta 3:
        **«La unidad de medida no son 4 casos: son 22 contradicciones sembradas.
        Ése es vuestro n.»** Con 5 pasadas, cada contradicción cae en uno de tres
        estados —**estable-acierto** (5/5), **estable-fallo** (0/5), **inestable**
        (1 a 4)—; la alarma salta **sólo** cuando una estable-acierto baja a 2/5 o
        menos; **un 3/5 no es rojo: es «repetir 5 más antes de decir nada»**; y
        **el número de inestables es una métrica en sí** —si crece, el sistema se
        ha vuelto más aleatorio aunque la media no se mueva—. Diez pasadas para
        FIJAR una base, cinco para lo rutinario, y el criterio de si bastan: dos
        tandas de 10 seguidas deben dar el mismo reparto entre estables e
        inestables.
⚠️ Y RETIRA UN PLAZO SUYO, que es de las pocas veces que se cuenta: **su plazo
        diferido de 90 s de F-117 P7 queda RETIRADO para el camino serverless.**
        «Mientras el análisis siga ahí, el plazo total de reintentos es **40 s**
        como máximo. Los 90 s valen para el worker.» Lo dice a partir de la
        errata de los 120 s que esta casa le confesó en la propia consulta.
        Y con su cura barata y previa a la cola: **escribir «etapa X iniciada» en
        la base ANTES de cada etapa, no después.** «Así, si la función se agota,
        la última línea dice dónde murió.» Porque «un análisis que muere sin
        rastro viola *nada desaparece en silencio*».
LO QUE CORRIGE DE LA DECISIÓN 4, y la generaliza: **«la verdad es el corpus, no el
        registro.»** La cuarta contradicción de P1 deja de ser un hallazgo
        accidental de agosto y entra en el registro de siembra como sembrada
        oficial, con su discriminante y con la fecha en que el registro estuvo
        equivocado escrita al lado.
Consulta enviada: ARCHIVADA. PAR COMPLETO.
Fuente: texto pegado por el director en el encargo del 25/09/2026.
---

# CONSULTA ENVIADA — 25/09/2026

CONSULTA RÁPIDA, SIN NÚMERO: ¿ESTAMOS MONTANDO BIEN EL ARNÉS?

No es una consulta formal ni necesita informe. Quiero un OK o un «esto lo haría distinto», lo más corto que puedas. Si algo está mal, dímelo sin rodeos; si está bien, dilo y ya.

CONTEXTO MÍNIMO (no ves nuestro repositorio ni conversaciones anteriores, así que va todo pegado)

Producto: SaaS B2B español de análisis documental corporativo. Next.js en Vercel, Supabase, Pinecone (multilingual-e5-large, namespace por organización), Claude Haiku 4.5 y Sonnet 4.6. Pipeline de análisis en cinco etapas: recuperación → rerank → juez → verificador → síntesis. Sin clientes todavía; estamos en pruebas.

El problema que venimos de tener: llevábamos meses haciendo tandas de prueba manuales, archivando resultados en ficheros, y descubrimos que no servían casi de nada — cada tanda medía algo ligeramente distinto y no podíamos comparar. Tú mismo nos dijiste que necesitábamos un eval harness con golden set y regression suite, y que lo teníamos ya escrito desde agosto pero esquivado por ser manual. Estamos construyendo eso.

LO QUE HEMOS MONTADO ESTA SEMANA

Cuatro casos de prueba, cada uno una pareja de documentos con contradicciones sembradas a mano:
  P1 · dos documentos en prosa, cuatro contradicciones sobre cargos y plazos.
  P2 · dos documentos en prosa, tres contradicciones sobre mecanismos (no personas).
  P3 · dos hojas de cálculo de tarifas, 15 filas discrepantes y 25+25 exclusivas.
  P4 · dos hojas sin columna clave común, para medir la degradación cuando el
       sistema no tiene por dónde emparejar filas.

Cinco pasadas por caso = 20 análisis = 100 créditos internos y 0,09 $ por tanda.

LAS SEIS DECISIONES QUE QUIERO QUE JUZGUES

1. LÍNEAS DE BASE HONESTAS EN VEZ DE OBJETIVOS.
   P2 tiene 3 contradicciones sembradas pero el sistema sólo ha detectado 2 nunca; la tercera no la ha emitido jamás (tenemos el pendiente identificado: en documentos cortos el juez casi nunca saca dos hallazgos del mismo par). Hemos escrito esperados: 3, línea de base: 2, la tercera marcada como pendiente conocido y excluida del umbral que hace saltar la alarma. El umbral es «menos de 2», no «menos de 3». Razonamiento: un rojo permanente por algo que jamás funcionó nos entrena a ignorar la luz.

2. UN CASO PUEDE NACER SIN LÍNEA DE BASE.
   P4 nunca se ha medido. Su primera pasada DESCUBRE, no confirma. El marcador tiene tres estados: acierto, fallo, y «sin línea de base — medido hoy por primera vez». Un caso sin línea de base no puede salir verde ni rojo.

3. EL EMPAREJAMIENTO HALLAZGO↔ESPERADO SE DECIDE POR CITA LITERAL DISCRIMINANTE, NO POR TEMA NI POR CERCANÍA.
   En P1, dos de las cuatro contradicciones viven a 7 y 9 líneas de distancia en los documentos. Riesgo: el sistema saca una, el examen la apunta como la otra, y el marcador sale verde por casualidad. Solución: hemos buscado frases que funcionan como huella digital y verificado con grep -c que cada una aparece exactamente 1 vez en su documento y 0 en el otro. Cinco frases así. Ninguna cita de una puede satisfacer a la otra ni aunque el modelo mezclara los dos pasajes.

4. UNA DE LAS CONTRADICCIONES DE P1 NO LA SEMBRÓ NADIE.
   Apareció investigando otra cosa en agosto. Nuestro registro de trampas decía «hay tres», y si hubiéramos escrito el examen desde ese registro, el sistema habría sacado cuatro y la cuarta —un acierto real— habría contado como error. El examen habría penalizado al producto por funcionar bien. La hemos declarado como acierto. Nos ha dado bastante miedo lo cerca que estuvimos de eso.

5. FILTRO SEPARADO PARA EL EXAMEN.
   El filtro del producto responde a «¿qué puede ver el sistema?» y siempre AMPLÍA (corpus activo OR estos ids). El examen necesita la pregunta contraria —«sólo estos ocho documentos»— que es una RESTRICCIÓN. Son dos criterios distintos y ahora viven en dos funciones separadas, con un test que compara las dos sobre el mismo universo: 8 documentos contra 52. Si algún día las dos dieran lo mismo, una dejó de trabajar.

6. UN DETALLE DE DENOMINADORES QUE CASI SE NOS ESCAPA.
   Nuestro panel de diagnóstico tiene un contador «fragmentos consultables según la base de datos», que sirve para saber si la puntuación mínima observada es el suelo real o sólo el corte del topK. Si restringimos el corpus en la búsqueda vectorial pero NO en ese contador, el contador diría 680 cuando sólo 30 eran alcanzables, y la puntuación mínima se leería como truncamiento cuando es el suelo. Decisión: los dos a la vez o ninguno, prohibido restringir uno solo, y con test que lo impida. Es el mismo error que ya nos costó cinco días una vez: una cifra medida sobre un operando y citada sobre otro.

DOS DETALLES DE INGENIERÍA, POR SI CHIRRÍAN

- El ejecutor no gasta nada por defecto: hace falta un flag explícito. Guarda el resultado crudo de cada una de las cinco pasadas en fichero ANTES de agregar nada, para poder releerlas por separado si el agregado sorprende.
- Controles positivos ejercidos: el validador del examen se ha probado contra casos deliberadamente mal escritos (umbral imposible, corpus vacío, esperado sin frase discriminante) y sale con código de error. Y el verificador de discriminantes se ha probado contra una frase que NO aísla, y la caza con sus cuentas. Queríamos saber que el examen sabe fallar antes de fiarnos de que pasa.
- Lista de ids vacía: RECHAZA, no lanza. Un $in vacío daría cero candidatos y el informe escribiría «no detectó nada» — un cero de montaje disfrazado de cero de detección.

UNA COSA QUE SALIÓ DE PASADA Y QUIZÁS TE IMPORTA MÁS QUE TODO LO DEMÁS

Corrigiendo un dato en nuestros archivos descubrimos que el límite de tiempo de la función serverless del análisis son 120 s, no los 300 s que yo te dije en una consulta anterior (perdón). Con 120 s, una espera de 52 s en una sola llamada se come el 43% del presupuesto, y el plazo diferido de 90 s que tú proponías se come el 75%. Peor: con un rechazo persistente del proveedor, la función puede agotarse ANTES de llegar al bloque que registra el fallo — o sea, el análisis muere sin dejar rastro de qué etapa falló. Lo hemos apuntado como pendiente y refuerza tu recomendación de mover el análisis a la cola del worker, que ya existe.

LAS PREGUNTAS, Y SON TRES

1. ¿Alguna de las seis decisiones está mal planteada, o le falta algo que un equipo con experiencia en evals daría por obvio?
2. ¿Hay algún modo conocido de que un examen así se degrade con el tiempo y deje de medir lo que cree medir, aparte del clásico de optimizar contra la métrica?
3. Cuatro casos y cinco pasadas: ¿es suficiente para detectar una regresión real, o nos vamos a comer el ruido del muestreo del modelo? Si la respuesta es «pocas pasadas», dime cuántas y con qué criterio se decide.

Respuesta corta, por favor. Un OK con las salvedades que veas.

---

# RESPUESTA RECIBIDA — 25/09/2026

OK. Las seis decisiones están bien planteadas y dos de ellas (la 3 y la 6) están mejor que lo que hacen muchos equipos. Salvedades cortas, y una carencia que sí me parece grave.

Lo que falta y es grave: el examen solo mide "debe encontrar". Con solo trampas sembradas, un sistema que emite todo lo que se le ocurre saca verde. Hacen falta casos con esperado cero: los siete falsos de agosto como "no debe salir", y al menos una pareja limpia. Sin eso, el arnés mide cobertura y no precisión, y vuestro fallo de la semana pasada fue de precisión.

Salvedades por decisión

(1) Bien. Dos añadidos: el pendiente conocido lleva dueño y fecha, y el informe lo imprime en cada pasada como "hueco conocido: 1", no se calla. Y si un día el sistema saca la tercera, eso no es verde sin más: el informe lo marca como "mejor que la base, revisar", para que alguien suba la base a mano.
(2) Bien. Con una regla: la base se fija desde la primera pasada solo después de que una persona la mire. Nunca se congela sola.
(3) Muy bien. Una comprobación que os falta: el grep se hizo sobre el documento, no sobre los fragmentos. Si el trozado parte una frase discriminante en dos fragmentos, el juez no puede citarla aunque acierte. Repetid el grep sobre la tabla de fragmentos, y repetidlo en cada pasada, porque un cambio de trozado lo rompería en silencio.
(4) Correcto, y la lección es más general: la verdad es el corpus, no el registro. Convertid esa cuarta en sembrada oficial, con su discriminante, y anotad la fecha en que el registro estuvo equivocado.
(5) Bien.
(6) Bien. Es exactamente la regla de "cifra medida sobre un operando y citada sobre otro".

Lo que un equipo con experiencia daría por obvio y no veo

Cada pasada guarda: commit del código, modelo y versión, hash de cada prompt, hash de cada documento de prueba, versión del examen. Sin eso, dentro de un mes no sabréis contra qué se midió una base.
Un caso reservado que nadie mira al ajustar prompts. Ahora mismo los cuatro son de desarrollo.

Pregunta 2 · Cómo se degrada un examen así, aparte de optimizar contra la métrica

Alguien edita un documento de prueba o cambia el trozado y la base deja de ser comparable. Cura: los hashes de arriba.
El modelo cambia por debajo. Cura: registrar la versión y el canario de F-114.
La base se actualiza a "lo que pasó hoy" para quitar un rojo. Cura: cambiar una base o un umbral es un commit con motivo escrito.
La lista de "pendientes conocidos" crece y se convierte en un cajón. Cura: es una métrica con trinquete: puede bajar, no subir.
Se afloja un umbral para que deje de parpadear. Misma cura que la base.
Las frases de los documentos de prueba acaban dentro de un prompt o de un ejemplo. Cura: el caso reservado.

Pregunta 3 · Cuatro casos y cinco pasadas

La unidad de medida no son 4 casos: son 22 contradicciones sembradas. Ese es vuestro n, y es razonable.
Con 5 pasadas, cada contradicción tiene tres estados posibles: estable-acierto (5/5), estable-fallo (0/5), inestable (entre 1 y 4). La alarma solo debe saltar por una estable-acierto que baja a 2/5 o menos. Un 3/5 no es rojo: es "repetir 5 más antes de decir nada".
El número de inestables es una métrica en sí. Si crece, el sistema se ha vuelto más aleatorio, aunque la media no cambie.
Cuántas pasadas: para fijar una base, 10 una sola vez. Para lo rutinario, 5. Criterio para saber si bastan: dos bases seguidas de 10 deben dar el mismo reparto entre estables e inestables. Si no, subid. A 0,09 $ la tanda, esto cuesta menos de un euro.

Sobre los 120 s. Sí importa más que lo demás. Dos consecuencias inmediatas:

Mi plazo diferido de 90 s queda retirado para el camino serverless. Mientras el análisis siga ahí, el plazo total de reintentos es 40 s como máximo. Los 90 s valen para el worker.
Un análisis que muere sin rastro viola "nada desaparece en silencio". Cura barata y previa a la cola: escribir "etapa X iniciada" en la base antes de cada etapa, no después. Así, si la función se agota, la última línea dice dónde murió.

Y sí: refuerza mover el análisis a la cola del worker. Ya estaba en la semana 3.
