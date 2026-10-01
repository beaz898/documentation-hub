---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-119
Asunto: El retrieval y el rerank eligen párrafos; el juez ahora lee documentos
        enteros. ¿Qué forma deberían tener?
Fecha de envío: 30/09/2026
Fecha de respuesta: 30/09/2026
Fuente: texto pegado por el director en el encargo del 30/09/2026 (el dictamen).
        La consulta enviada NO consta: ver (c).
Estado: ARCHIVADA. Sin decisión del director. Nada iniciado.
        Dictamen cotejado, huella 9c9b60244a08d2c7 (30/09/2026).
        · Contra las cifras del fichero original que trae el arquitecto: cuadran la
          huella, los caracteres (14.509), las líneas (108), las no vacías (66), las
          palabras (2.508), y los 60 primeros y los 60 últimos caracteres.
        · Los bytes difieren en UNO: 14.749 aquí, con el salto final, frente a 14.748.
          El texto de aquí no tiene ningún espacio que no sea ASCII, así que la
          diferencia no está en el contenido. 14.748 es exactamente el recuento de
          aquí SIN salto final: casi seguro, el original no lo tenía. No se ha tocado
          nada.
Superada por: —
---

# (a) CABECERA

**F-119 · El retrieval y el rerank eligen párrafos; el juez ahora lee documentos enteros.
¿Qué forma deberían tener?**

- Fecha de envío: 30/09/2026.
- Fecha de respuesta: 30/09/2026.
- Estado: **ARCHIVADA. Sin decisión del director. Nada iniciado.**

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

«El encuadre lo produjo el director: el retrieval era correcto para el
diseño viejo y ahora está desalineado, porque el trozo dejó de ser el
material y pasó a ser un puntero. Los datos de repositorio que alimentaron
la consulta son las tres lecturas de Code sobre rerank.ts, orden-del-rerank.ts
y corte-de-recuperacion.ts, más el cuadro medido de B.300.»

---

# (c) ENUNCIADOS DE LAS PREGUNTAS

⚠️ **Reconstrucción de los enunciados a partir de la respuesta; el texto literal de la
consulta no consta.** No está en el repositorio, y no se reconstruye más allá de esta
lista.

1. ¿Es correcto el encuadre (moneda antigua / plazas compartidas)?
2. ¿Cuál debe ser la unidad del retrieval y su tope?
3. ¿Cómo se agregan los trozos a documento?
4. ¿Qué entrada debe recibir el rerank?
5. ¿Cuántos documentos deben llegar al juez?
6. ¿Sigue siendo el trozo la primitiva correcta?
7. ¿Qué medir antes de tocar nada?

---

# (d) RESPUESTA RECIBIDA — F-119 · 30/09/2026 · DICTAMEN, ÍNTEGRO

RESPUESTA DE FABLE — F-119 · EL RETRIEVAL Y EL RERANK ELIGEN PÁRRAFOS; EL JUEZ AHORA LEE DOCUMENTOS ENTEROS. ¿QUÉ FORMA DEBERÍAN TENER?

Alcance y una predicción fallada, por delante

No veo el código. Todo dato del repositorio va con la procedencia de Code. Lo que sé de cómo lo resuelven otros sistemas es de entrenamiento y va marcado con nombres buscables.
Mi predicción de F-118 falló y se cuenta. Dije que la precisión bajaría entre 5 y 15 puntos; subió, y un falso que salía en 4 de 8 pasadas desapareció. El error tiene explicación y cambia mi modelo: ese falso no nacía de exceso de texto sino de escasez. Un juez obligado a citar y con la mesa medio vacía cita lo que tiene más cerca. Con la mesa llena, no necesita inventar. Lección registrada: los falsos nacen tanto de poco contexto como de mucho. Consecuencia práctica: el verificador ciego sigue siendo necesario, pero pierde urgencia frente a lo que esta consulta plantea, y su caso decisivo hay que volver a buscarlo con el escalón 1 encendido.

Veredicto

1: el encuadre es correcto en lo esencial y necesita un ajuste: el juez lee entero para no perderse dónde está el dato compartido, no porque el candidato tenga que ser relevante de principio a fin. Un solo párrafo compartido basta para una contradicción. Eso cambia qué agregación es la correcta.
2 y 3: la unidad pasa a ser el documento, con dos topes: fragmentos por documento y documentos vistos. La agregación correcta no es una sola: máximo como suelo y amplitud, medida como cuántas de las consultas del analizado dieron con el documento, como criterio de orden y de cuántos mandar.
4: el rerank no necesita otro muestreo del analizado; necesita otra entrada: las parejas de fragmentos que se emparejaron, sin ventana por posición. Es lo que hace un reranker de pares.
5 y 6: el trozo sigue siendo la primitiva correcta para buscar. Lo que falta es una etapa explícita de agregación por documento, con contadores, y un presupuesto por análisis que decide cuántos van al juez. El corte relativo dormido de F-109 encuentra aquí su caso decisivo.
7: antes de tocar nada, instrumentar las cuatro plazas sin contador y medir, para cada trampa, en qué etapa se pierde su candidato verdadero. El retrieval nuevo se prueba en sombra sin gastar una sola llamada al modelo.

1 · ¿Es correcto el encuadre?

Sí, con dos precisiones que importan para el diseño.

Primera. "El pipeline mide en la moneda antigua" describe bien las etapas 6 y 7. Pero el síntoma de las 25 plazas compartidas no es moneda antigua: era un fallo también en el diseño viejo. Tres documentos afines llenaban las plazas y expulsaban al corpus exactamente igual cuando el juez leía párrafos. El escalón 1 no lo causó; lo hizo visible porque ahora se mira quién llega, no qué párrafo llega.

Segunda, y es la que cambia el diseño. El criterio para "merece leerse entero" no es "relevante de principio a fin". Para una contradicción basta con que los dos documentos compartan un dato, y ese dato vive en un párrafo de cada lado. El juez lee entero para encontrar ese párrafo esté donde esté, y para tener el contexto que lo rodea, no porque todo el documento deba tratar de lo mismo. Por eso el máximo no es una agregación equivocada; es una agregación incompleta.

Lo que sí es un diagnóstico exacto: en la cadena de diez topes hay cuatro sin contador. Un tope sin contador es una decisión que nadie puede auditar. Eso es lo primero.

2 · Unidad y tope del retrieval

Unidad: el documento. Topes: fragmentos por documento y documentos vistos. Lo obvio, "N trozos por documento", es la forma buena, y hay tres detalles que no son obvios.

a) Cómo conseguirlo sin una consulta por documento. De entrenamiento, sin verificar contra la documentación actual: Pinecone no agrupa por campo de metadatos en la consulta. Las dos vías estándar:

Subir el topK por consulta, de 25 a 100 o 150, y agrupar en cliente: por documento, quedarse con los m mejores fragmentos (m entre 3 y 5), y con hasta D documentos. El coste de lectura en Pinecone depende sobre todo del tamaño del namespace, no del topK; ya lo comprobasteis con topK=1000 en los censos. Vigilar el tope de 4 MB por respuesta; con 150 resultados y metadatos, sobra margen.
Una consulta por documento candidato con filtro. Es exacta y cara. Solo para el escalón 2.

b) Los documentos analizados a la vez son otra población. Vuestro cuadro lo muestra: con 3 seleccionados al lado, el corpus casi desaparece. Los compañeros de tanda no compiten por las mismas plazas que el corpus: tienen su propio cupo. Regla en cuatro piezas:

Predicado: un documento entra en la lista de candidatos si está entre los D_corpus mejores de su pool, o entre los D_tanda mejores del suyo.
Universo: pool corpus = documentos con estado analizado de la organización, salvo los de la tanda; pool tanda = los seleccionados junto al analizado.
Un caso a cada lado: con 3 al lado, el corpus conserva sus D_corpus aunque los tres puntúen 0,95.
Vacío: sin compañeros de tanda, el pool tanda es vacío y no roba plazas.
Predicción de Fable, escrita antes: con esto, la fila "3 al lado" pasa de 4 documentos candidatos a los mismos 14 del caso "0 al lado", más los 3.

c) Diversidad, con nombre. Lo que estáis describiendo, un conjunto de resultados dominado por lo más parecido a costa de lo distinto, se llama falta de diversidad, y la técnica estándar es MMR, "maximal marginal relevance" (Carbonell y Goldstein, 1998). No hace falta implementarla: el tope de m fragmentos por documento es su forma más simple y suficiente.

Nombres para buscar: "passage-to-document aggregation", "grouped retrieval", "result diversification", "MMR".

3 · La agregación

Dos señales, con oficios distintos, y ninguna se tira.

Máximo por documento. Es la agregación estándar de primera etapa, y funciona: se llama MaxP en la literatura (Dai y Callan, 2019). Responde a "¿hay al menos un párrafo fuertemente relacionado?". Para contradicciones es el suelo correcto: un documento con un solo 0,95 y nada más puede contener la contradicción.
Amplitud desde el analizado. Cuántas de las consultas del documento analizado dieron con este candidato, dividido por el número de consultas. Responde a "¿cuántos temas del documento nuevo toca este candidato?". Se mide desde el lado del analizado, así que no premia a los candidatos largos por tener más trozos. Esta es la señal que le falta al corte previo, y es la que dice cuánto vale leer el documento entero.

Lo que no recomiendo: contar trozos por encima de un umbral. Con e5 el rango es 0,7 a 1,0 y cualquier umbral absoluto vuelve a ser el 0,50 de F-113. Densidad, tampoco: premia lo corto.

Orden propuesto para el corte previo: por amplitud, desempate por máximo, desempate por id. Y una unión de seguridad: los tres mejores por máximo entran aunque su amplitud sea 1 de 120, porque un solo dato compartido basta.

Cuidado con el sesgo de longitud del lado analizado: 120 muestras de un documento de 66.801 caracteres son muchas más que las 10 de uno de 3.000; la amplitud se normaliza por consultas lanzadas, no por muestras posibles. Encargo para Code: cómo se eligen las muestras y si su número crece con la longitud.

4 · La entrada del rerank

El rerank ve 3.000 caracteres del analizado por posición y 300 por fragmento del candidato. Es la tijera del escalón 0 viva una etapa antes, y en el documento de 66.801 caracteres decide con el 4,5 % inicial. Cambiar el muestreo no lo arregla: cualquier ventana del analizado deja fuera lo que no cae en ella.

La entrada correcta son las parejas. Por cada candidato, los m fragmentos suyos que salieron, cada uno junto al fragmento del analizado que lo trajo. Sin ventana por posición: el lado analizado entra por los trozos que se emparejaron, estén en el 4 % o en el 88 %. 300 caracteres por lado es un tamaño razonable para juzgar una pareja. Es lo que hace un reranker de pares, un "cross-encoder", que puntúa (pasaje de la consulta, pasaje candidato); de entrenamiento, los nombres buscables son "cross-encoder reranking", "bge-reranker", "Cohere rerank". Vosotros lo hacéis con Haiku, y está bien: lo que cambia es qué se le enseña.

Una pieza opcional que ayuda al rerank y a otras cosas: un perfil por documento, calculado una vez al indexar y guardado: título, alcance, entidades y cifras clave, en 500 caracteres. Se calcula con una llamada por versión de documento, nunca por análisis. El rerank recibe el perfil de cada lado además de las parejas, y así sabe de qué va cada documento sin verlo entero. (Entrenamiento; buscable: "document summary index", y en versión elaborada, "RAPTOR".) No entra ahora: se mide primero si las parejas solas bastan.

Predicción: con parejas en vez de ventana, el candidato verdadero del documento de 66.801 sube de posición en el rerank en las dos trampas sembradas. Que Code lo mida en sombra.

5 · Cuántos documentos van al juez

Hay una forma principiada, y son tres reglas juntas.

Presupuesto por análisis, no número fijo. En modo rápido, un tope de caracteres o tokens para el juez, por ejemplo 100.000 caracteres sumando parejas, con ficha. Se llenan candidatos por orden hasta agotarlo. Un candidato de 60.000 vale por cuatro de 15.000, y eso es correcto: leerlo cuesta eso.
Corte relativo por hueco. Aquí despierta el corte dormido de F-109 con su caso decisivo. Se envían candidatos mientras la señal agregada no caiga por debajo de una fracción de la del primero, o hasta el mayor salto entre consecutivos. El termómetro de F-114 ya guarda el hueco entre primer y segundo documento; se extiende a toda la lista. El caso decisivo se construye con las trampas: para cada una, en qué posición está el candidato verdadero y cuánto vale el hueco justo antes.
Medición que decide el número. Para cada trampa sembrada, el rango del candidato verdadero tras el rerank. Si en 28 análisis nunca pasó del 2, mandar 6 es pagar cuatro lecturas vacías. Si alguna vez fue 5, los 6 se quedan. Predicción de Fable: el candidato verdadero está en las posiciones 1 o 2 en más del 80 % de los casos.

Sobre el tiempo: si las llamadas al juez van en paralelo, mandar más candidatos no añade latencia, solo coste. Encargo para Code: si son paralelas o secuenciales. De 17 a 21 segundos con seis candidatos sugiere paralelas, pero es una inferencia.

6 · ¿Sigue siendo el trozo la primitiva correcta?

Sí. Y es la respuesta de todos los sistemas de recuperación serios, con o sin lectura entera después. Razones:

Un documento entero como vector único es una media de todos sus temas; un tarifario de 60 páginas queda representado por "cosas de tarifas" y no encuentra nada concreto. El trozo es lo que permite que "autoclave 134 °C" encuentre a "autoclave 121 °C".
Lo que falta no es otra primitiva sino una etapa explícita que hoy está implícita: la agregación de trozos a documentos, con sus semánticas declaradas y sus contadores. Existe en el código como maxScore en una línea; debe existir como etapa con nombre, entrada, salida y contadores de lo que deja fuera.
Lo único que añadiría al índice, más adelante, es un vector de perfil por documento, como segunda señal para el rerank. No sustituye a los trozos; los complementa. No requiere reindexar los trozos.

Sobre los cinco consumidores de los fragmentos seleccionados: ninguno pide que se quiten. El bloque de 3.000 deja de ser "lo que lee el juez" y pasa a ser "el registro de por qué este documento fue elegido". Es un cambio de nombre y de oficio, no de existencia. Lo que sí hay que hacer es que el bloque se construya una vez y se lea cinco veces, no que cada consumidor tenga su copia.

Sobre la economía nueva: correcto, y es la economía sana. Antes el precio de un candidato no dependía de nada y por eso nadie preguntaba cuántos mandar. Ahora la pregunta 5 tiene respuesta medible.

7 · Qué medir antes, y qué vigilar

Antes de tocar nada, en solo lectura o en sombra:

Contadores en los cuatro topes ciegos (2, 4, 7, 9). Por consulta: qué documentos se llevaron las plazas y cuántas cada uno. Por documento: trozos únicos, consultas que lo alcanzaron, y si sobrevivió a cada corte. Es la extensión natural del termómetro de F-114. Sin esto, todo lo que decís del desplazamiento sigue siendo compatible con lo observado y no medido.
Dónde se pierde el candidato verdadero, por trampa. Para cada trampa sembrada, tres preguntas: ¿estaba entre los matches de Pinecone?, ¿entre los 25 del corte previo?, ¿entre los 6 del rerank? Y su posición en cada etapa. Eso dice qué etapa arreglar primero, con datos. Predicción: las pérdidas están en el corte previo y en el rerank, no en Pinecone.
El desplazamiento, formalizado. El mismo documento con 0, 1 y 3 compañeros de tanda, cinco pasadas cada uno, contando documentos del corpus vistos. Ya lo tenéis a una pasada; conviértase en caso del arnés con esperado escrito.
Sombra del retrieval nuevo, gratis en modelo. Agrupación por documento con topK alto, pools separados y amplitud como orden se pueden ejecutar en paralelo al retrieval actual sin llamar a Haiku: solo consultas a Pinecone. Se registra qué documentos habría seleccionado cada versión y se comparan los conjuntos. Vuestra línea de base no se toca, porque el juez sigue recibiendo lo del retrieval viejo. Criterio de aceptación: la versión nueva incluye al candidato verdadero de todas las trampas y no pierde ninguno que la vieja incluía.

Modos de fallo a vigilar cuando se active:

Sesgo de longitud disfrazado de amplitud. Un candidato largo tiene más trozos y aparece en más consultas. Se corrige normalizando por consultas del analizado, y se comprueba: correlación entre longitud del candidato y posición en el corte.
Un pool de tanda que roba en la otra dirección. Si D_tanda es alto, los compañeros se leen aunque no tengan relación. Se acota: D_tanda igual al número de compañeros, y pasan por el rerank como los demás.
Perder al candidato de un solo párrafo excelente. Si la amplitud manda sola, un 0,95 aislado cae. La unión de seguridad por máximo lo protege; se verifica con una trampa sembrada de un solo párrafo, que conviene crear.
Más candidatos, más tiempo. Si las llamadas al juez son secuenciales, cada candidato añade segundos y el tope de 120 se acerca. Se mide antes.
Tamaño de respuesta de Pinecone. Con topK 150 y metadatos largos, vigilar el límite de 4 MB; si se acerca, pedir sin metadatos y recuperar texto de la base.
Cambio de línea base. El día que se active el retrieval nuevo, el arnés se vuelve a pasar cinco veces para nueva base. No se compara contra la vieja.

---

# (e) PREDICCIONES REGISTRADAS, PENDIENTES DE MEDICIÓN

Escritas por Fable antes de medir. Se cuentan cuando haya medición, como toda predicción de
esta casa. **Sin veredicto.**

- **P-F119-1** · Con pools separados, la fila «3 al lado» pasa de 4 documentos candidatos a
  los mismos 14 del caso «0 al lado», más los 3.
  - *Aceptación*: se juzga contra el cuadro medido de B.300, **14 / 11 / 4** con 0, 1 y 3
    acompañantes (`claude/Estado_Del_MVP.md`, B.300).
  - *Estado*: sin medir.
- **P-F119-2** · Con parejas en vez de ventana por posición, el candidato verdadero del
  documento de 66.801 caracteres sube de posición en el rerank en las dos trampas sembradas.
  - *Aceptación*: sube en las dos.
  - *Estado*: sin medir.
- **P-F119-3** · El candidato verdadero está en las posiciones 1 o 2 en más del 80 % de los
  casos tras el rerank.
  - *Aceptación*: más del 80 %.
  - *Estado*: sin medir.

**LA PREDICCIÓN DE F-118 QUE FALLÓ, con su resolución**
(`F-118_2026-09-28_simetria-de-lectura.md`, (e) punto 2 y su resolución al final):
- **Predijo** una caída de precisión de 5 a 15 puntos con los dos documentos enteros.
- **Resultado**: la precisión **subió**, y el falso positivo que salía 4 de 8 pasadas
  desapareció: 0 de 6 (B.295, medido desde la base).
- **Modelo revisado por Fable**: los falsos nacen tanto de poco contexto como de mucho, y
  ese falso nacía de escasez.

---

# (f) PRECISIÓN DEL ARQUITECTO SOBRE UNA CIFRA DEL DICTAMEN

Fable escribe «de 17 a 21 segundos con seis candidatos» y de ahí infiere que las llamadas al
juez podrían ser paralelas.
- **Las latencias medidas** están en B.295: **15,4–18,6 s** con el interruptor apagado y
  **19,9–23,8 s** encendido.
- **La inferencia de Fable parte de cifras aproximadas.** La pregunta queda abierta hasta la
  lectura L-7 de Code.

---

# (g) MEDICIONES CANDIDATAS — anotadas, NO iniciadas

Fable propone cuatro, en sólo lectura o en sombra (dictamen, § 7). **Ninguna se empieza sin
decisión del director.**
1. Contadores en los cuatro topes ciegos (2, 4, 7 y 9).
2. Dónde se pierde el candidato verdadero, por trampa.
3. El desplazamiento como caso del arnés, con esperado escrito.
4. Una sombra del retrieval nuevo, sin llamadas al modelo.

---

# (h) ENCARGOS DE FABLE, CONTESTADOS POR CODE — 30/09/2026

Lecturas de código en sólo lectura. No se ejecutó nada.

## L-6 · Cómo se eligen las muestras del analizado, y si su número crece con la longitud (dictamen, § 3)

- **Dónde**: `pickSampledTexts`, `lib/analysis/muestras.ts:11-26`.
- **Criterio**: todos los trozos del documento si son 120 o menos. Si son más, 120 repartidos
  de forma uniforme por el documento (`:21-23`, `:29-35`).
- **De dónde salen los trozos**: los guardados de la generación activa o, si no los hay,
  `chunkText` sobre el texto entero (`app/api/analyze-v2/route.ts:386`, `:400`, `:591-593`).
- **En el exhaustivo no hay tope**: van todos los trozos (`route.ts:522`).
- **Cuántas salen para 3.000 y para 66.801 caracteres: NO CONSTA.** El troceado es por
  secciones, y la cifra no se deduce sin ejecutarlo. Para medirla basta la línea
  `N chunks, N samples` del log de un análisis de cada documento (`route.ts:598`), o contar
  sus trozos en `document_chunks`. Lo único que consta de NOR-10: una cota inferior de 56
  fragmentos únicos cuando fue candidato (log del 29/09, transcrito por el arquitecto).
- ✅ **CONFIRMACIÓN, no corrección**: el número de consultas al índice **sí crece con la
  longitud** del documento analizado, hasta el tope de 120. El aviso de Fable —normalizar la
  amplitud por consultas lanzadas, no por muestras posibles— **está justificado por el
  código**.
  - ⚠️ Las cifras «120 frente a 10» del dictamen son de Fable, **sin medir**.

## L-7 · Si las llamadas al juez van en paralelo o en secuencia (dictamen, § 5)

- **En paralelo, por lotes de 5.** Lo decide
  `runInBatches(args.candidates, …, { batchSize: JUDGE_CONCURRENCY })`
  (`lib/analysis/judge.ts:1107-1123`), con `JUDGE_CONCURRENCY = 5` (`judge.ts:38`).
- `runInBatches` lanza cada lote en paralelo, espera a que termine y pasa al siguiente, sin
  pausa (`lib/run-in-batches.ts:36-51`).
- **Con 6 candidatos**, el máximo del modo rápido, hay dos lotes: 5 y 1. **Con 5 o menos**,
  uno solo.

## ⚠️ DOS CORRECCIONES AL DICTAMEN

**CORRECCIÓN 1 · al punto 7 del dictamen** («Contadores en los cuatro topes ciegos (2, 4, 7,
9)»). **Los topes ciegos son TRES, no cuatro.**
- El 9 no deja nada fuera: del rerank al juez pasan todos los candidatos
  (`lib/analysis/pipeline.ts:851`, `candidates: reranked`).
- Los que dejan algo fuera sin contarlo son el **2, el 4 y el 7**.
- Consta también en `claude/Estado_Del_MVP.md`, B.303.

**CORRECCIÓN 2 · al punto 5 del dictamen** («si las llamadas al juez van en paralelo, mandar
más candidatos no añade latencia, solo coste»). **Es verdad SÓLO HASTA CINCO.**
- Van en paralelo en lotes de 5 (L-7). Con 6 candidatos hay dos lotes, 5 y 1: **el sexto
  candidato añade por sí solo un lote entero de latencia.**
- Toca directamente la pregunta 5 —cuántos documentos van al juez—, porque **el precio del
  sexto no es sólo dinero.**
- **No se propone el cambio.** Bajar el máximo de 6 a 5 es una decisión del director, y no
  está tomada.

**REFINAMIENTO 3 · al diagnóstico del punto 7** (Code, en el plan de los contadores; aceptado por
el arquitecto el 01/10/2026). **Los tres topes ciegos no dejan fuera DOCUMENTOS.**
- El 2 deja fuera resultados por debajo del puesto 25; el 4, apariciones repetidas de un mismo
  trozo; y el 7, texto.
- Los cortes que SÍ dejan fuera documentos —el de 25 candidatos y el rerank— **ya cuentan
  cuántos, pero no quiénes**.
- **El hueco de auditoría es «quiénes», no «cuántos».**
- El plan está en `claude/Plan_Contadores_Topes_Ciegos.md`. Y el hallazgo que salió de él, en
  `claude/Estado_Del_MVP.md`, B.309: la deduplicación conserva la primera aparición, así que
  el «máximo» de § 3 ni siquiera es el máximo.
