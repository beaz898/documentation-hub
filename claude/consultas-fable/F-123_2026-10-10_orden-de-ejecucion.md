---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-123
Asunto: orden de ejecución, no mecanismo — la lista cerrada de lo decidido y sin
        construir, y la revisión de F-120, F-121 y F-122
Fecha de envío: 10/10/2026 · Fecha de respuesta: 10/10/2026
Fuente: texto pegado por el director en el encargo del 10/10/2026. Los dos
        constan íntegros: la consulta en (c) y el dictamen en (d).
Estado: ARCHIVADA CON DICTAMEN · EL ORDEN QUE DICTA SUSTITUYE A LA REGLA DE
        CONGELACIÓN DE F-122 (Estado_Del_MVP.md, 10/10/2026). Nada ejecutado
        todavía: la fase 0 empieza por el inventario de 0.1.
        Cotejo de integridad, 10/10/2026, con el método de F-121: sha256 del
        texto tal como queda archivado aquí (saltos LF, sin salto final), 16
        primeros hexadecimales; caracteres = puntos de código; palabras = trozos
        separados por espacio en blanco. Ninguno de los dos textos tiene
        espacios que no sean ASCII. Los 60 primeros y últimos van entre comillas
        con escapes JSON: \" es una comilla del texto y \n un salto de línea.
        · DICTAMEN, (d): huella a33ce45e925bb049 · 16.256 caracteres
          (16.635 bytes UTF-8) · 137 líneas · 88 no vacías ·
          2967 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-123 · ORDEN DE EJECUCIÓN, NO MECANISM"
          60 últimos:  "o. La medición decide, y está en la fase 0 porque es gratis."
        · CONSULTA, (c): huella b3b98944a70740a4 · 14.968 caracteres
          (15.292 bytes UTF-8) · 182 líneas · 109 no vacías ·
          2701 palabras.
          60 primeros: "# CONSULTA F-123 — 10/10/2026 — ORDEN DE EJECUCIÓN, NO MECAN"
          60 últimos:  "do o aparcado y **no queremos que entre en esta respuesta**."
Superada por: —
---

# (a) CABECERA

**F-123 · Orden de ejecución, no mecanismo.**

- Fecha de envío: 10/10/2026. Fecha de respuesta: 10/10/2026.
- Quién escribe la consulta: el arquitecto. El director la envía, pega la respuesta y decide.
- Estado: **ARCHIVADA CON DICTAMEN.** El orden de P1 (fases 0 a 3) sustituye a la regla de
  congelación de F-122, que queda retirada.
- **Las decisiones que salen de aquí, fuera de la consulta**: el orden nuevo, las bajas, las
  fusiones y las tres reglas de método de P5, en `claude/Estado_Del_MVP.md` (10/10/2026).

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

- **La cronología del 15/09 al 10/10** (git log y fechas de las fichas, B.372): el desvío del
  30/09, el bucle de reenvío sobre F-119 y el parón de commits de producto.
- **Las medidas del 10/10**: el destino de cada hallazgo en NOR-11 ↔ CLI-13 (SQL_B357), los
  regímenes de lectura de las filas que sobreviven (B.369) y la medida de la guarda del rerank
  sobre los análisis guardados.
- **La lista cerrada** de la sección 3 sale del inventario de lo decidido y sin construir del
  10/10 (B.372).

---

# (c) ENUNCIADOS DE LAS PREGUNTAS — EL TEXTO ENVIADO, ÍNTEGRO

Texto literal enviado a Fable el 10/10/2026, tal como lo pegó el director. No se ha tocado.

# CONSULTA F-123 — 10/10/2026 — ORDEN DE EJECUCIÓN, NO MECANISMO

## 0. Qué te pido, y qué no

Te pido **orden de ejecución sobre una lista cerrada**, y **la revisión de tus tres últimas respuestas** a la luz de lo medido hoy. No te pido mecanismo, no te pido diseño nuevo, y te pido expresamente **que no abras frentes nuevos**: si algo que falta te parece imprescindible, dilo, pero colócalo por debajo de lo que ya está decidido y sin construir.

La razón de esa restricción está en la sección 2: nuestro problema ha dejado de ser de diagnóstico y es de ejecución, y varias consultas anteriores —algunas a ti— contribuyeron a aplazar el trabajo en vez de desbloquearlo.

---

## 1. La foto, medida hoy

### 1.1 Donde la comparación la decide una REGLA, el sistema acierta y no varía

Camino determinista (`emparejarTablas` → `diffPairedRows` → `emitirDiffDeTablas`; ninguno llama al modelo; sus hallazgos no pasan por la puerta de citas ni por la cascada):

- **OPE-10 contra OPE-11: 15 de 15 en las DOS pasadas, idénticas, 30/30 confirmadas.** El registro de siembra documenta **exactamente 15 filas discrepantes**. Acierto perfecto, varianza cero.
- La arquitectura ya tiene el patrón «la regla manda»: lo que el juez diga sobre una pareja de filas que el diff ya comparó se suprime como `descartado.cubierto_por_diff`.

### 1.2 Donde la decide un MODELO, varía y publica un tercio

Prosa, contradicciones publicadas por pasada, con ground truth documentado:

- CLI-13, **24 pasadas**: entre 0 y 2, media 0,9.
- CLI-12, **7 pasadas** (4 sembradas: A, B, C y la D no sembrada): entre 0 y 3.

### 1.3 El destino de cada hallazgo, pareja NOR-11 ↔ CLI-13, diez pasadas

Tres contradicciones sembradas y documentadas (PLAZO: 72 h vs 7 días naturales; LUGAR: Chamberí vs Retiro; NEGACIÓN: contenedor amarillo con prohibición expresa del negro vs negro).

| trampa | el juez la emite | la mata la puerta de citas | se publica |
|---|---|---|---|
| PLAZO | 10 de 10 | nunca | **10 de 10** |
| NEGACIÓN | **3 de 10** | nunca | 3 de 10 |
| LUGAR | 3 de 10 | **3 de 3** | **0 de 10** |

- Las 3 pasadas con NEGACIÓN son **exactamente** las 3 con LUGAR. El juez emite las tres o emite sólo la fácil: **es todo o nada**.
- La cascada posterior a la puerta **no mató nada** (`discarded` llega siempre y no tiene ni una clave de descarte). La frontera tampoco. **La síntesis no pierde nada**: los temas que sobreviven en el juicio son los publicados.
- LUGAR muere siempre con `ladoFallido = nuevo`: falla la cita del documento nuevo, no la del existente.

### 1.4 Y la causa que estaba tapada: cuánto texto ve el juez

CLI-12, **mismo documento, mismo corpus, el mismo día**:

| hora | cuánto se le enseña del documento | publicadas |
|---|---|---|
| 06:37, 06:38, 06:39, 06:40 | **6.000 de 55.135 — el 11 %** | **0, 0, 0, 0** |
| 12:56, 13:02 | **25.296 / 37.271 / 30.183 de 55.135 — 46 a 68 %** | **3, 3** |

Cuatro ceros con el 11 % y dos treses con la mitad.

Y el candidato **desaparece a veces**: el 30/09 a las 12:20 y a las 12:29, NOR-11 **no llegó a ser candidato** de CLI-13 (14 afines, el modelo eligió 3). Publicadas 0 las dos veces.

### 1.5 Con qué decide la etapa que elige candidatos

El rerank decide viendo **los primeros 3.000 caracteres del documento analizado** y, de cada candidato, **fragmentos recortados a 300 caracteres**. Con eso un modelo elige entre 2 y 4 de 5 a 14 afines.

### 1.6 La medida de la guarda del rerank (B.89, decidida en F-22/F-23, agosto)

Sobre los 90 análisis guardados de la organización del piloto:

| modo | filas | sin el campo | afines ≤ tope | **y el rerank tiró alguno** | de ellas, por el modelo | afines > tope |
|---|---|---|---|---|---|---|
| quick (tope 6) | 75 | 37 | 10 | **8** | **8** | 28 |
| exhaustive (tope 25) | 15 | 9 | 6 | **6** | **6** | 0 |

**En 8 de las 10 pasadas rápidas donde todos los candidatos caben, el rerank descartó candidatos de todas formas, y las 8 por decisión del modelo.**

Y el reparto: **28 de 38** pasadas rápidas con dato tenían **más afines que plazas**. Ahí la guarda no aplica; ahí aplica F-119.

---

## 2. Lo que pasó: el desvío del 30/09 y el bucle de reenvío

El 30 de septiembre, el mismo día y con **cero commits de producto**:

- Se mide el Escalón 1 (leer la pareja entera), pasa, y se deja encendido.
- **Llega tu dictamen F-119 sobre la selección de candidatos y se archiva: «Sin decisión del director. Nada iniciado.»**
- Se abre B.299 («la comprobación de citas tira 5 de 7»).

**Desde el 01/10, ninguno de los 27 commits de producto toca la selección de candidatos.** Todos son puerta de citas, juez y pantalla.

### El bucle de reenvío, con las citas

- F-121 (07/10): «No pregunto por el retrieval ni por el rerank: eso es F-119, está archivada sin…».
- F-122 (09/10): «No pregunto por el retrieval ni por el rerank: es F-119…».
- Y la regla de congelación de F-122 **congeló «la elección de documentos de F-119»** — que ya estaba sin empezar.

Cada consulta apartaba la etapa remitiendo a un dictamen archivado sin empezar, y la última lo congeló. Nadie se equivocó en un paso; el resultado es un agujero que nada cubría.

### El dato que mide el parón

Commits de producto al día: **6,5 de media del 15 al 29/09** (78 en 12 días) y **2,7 del 30/09 al 10/10** (27 en 10 días). Con **26 commits de registros el 07/10 y otros 26 el 09/10**, frente a 1 y 4 de producto esos mismos días.

---

## 2.bis Lo más importante: hemos llegado a TU conclusión dando un rodeo de diez días

Esta mañana, **sin recordar F-119 y sin tenerla delante**, el director propuso desde cero: *agrupar los trozos recuperados por documento antes de aplicar el tope, quedarse con el mejor trozo de cada documento en vez de con los 25 mejores trozos sueltos, y subir el tope — porque veinte trozos del mismo documento gastan las plazas de otro, y si entra un trozo lo que hace falta decidir es qué DOCUMENTOS se comparan, no qué trozos.*

**Eso es literalmente F-119**: el documento como unidad, MaxP, topK de 25 a 100-150, MMR, bolsas separadas. Tu dictamen del 30 de septiembre.

Y el diagnóstico al que llegamos hoy midiendo —«lo que falla es la selección de qué se compara»— es literalmente la frase de F-109 del 17/09 y la de B.83 del 19/08 («el falso negativo muere en el RERANK, no en el juez»).

Esta consulta **no te pide nada nuevo**. Te pide que confirmes o revises, con los datos de la sección 1 que no existían el 30/09, lo que ya nos habías dicho; y que lo ordenes para que esta vez se ejecute.

---

## 2.ter Qué produjo el desvío, para que lo cuentes en P2

Los ocho días sobre la puerta de citas no están perdidos. Está subido y probado:

- el **lector unificado** de respuestas del modelo (una sola lectura para los ocho consumidores, compatible hacia atrás por construcción);
- el **repliegue de glosa**: una cita con un tramo entre corchetes ya no mata el hallazgo;
- el módulo de **unidades de cita**: partir el texto de un trozo en frases numeradas, con sus cinco invariantes y sus pruebas, **sin conectar a nada** (era el primer paso de la vía 2 de F-122);
- el techo de solapamientos de 5 a 10;
- y un cuerpo grande de medida, que es lo que permite escribir la sección 1.

Estaba apuntado a una etapa que pierde 3 de 10, mientras la etapa que no tocamos pierde pasadas enteras. **Si algo de eso abarata alguno de los nueve puntos de la sección 3, dilo en P2.**

---

## 2.quater Dos hechos que condicionan cualquier plan

**1. La línea base se destruyó anoche.** Borrar un documento en la aplicación borra en cascada todos sus análisis: las diez pasadas de la tabla de 1.3 **ya no existen en la base de datos** (quedan transcritas en un registro). Cualquier plan necesita volver a medir una línea base antes de cambiar nada, y eso cuesta pasadas.

**2. Material para P5, dicho sin adornos.** El arquitecto descartó la causa correcta dos veces con datos insuficientes: generalizó **una** lectura del régimen a diez pasadas y afirmó «el retrieval queda descartado», y propuso como causa el techo de tokens de salida, que una medida propia del 07/10 ya había refutado. La hipótesis buena —que el problema está en qué entra y cuánto se lee— **la planteó el director, dos veces, insistiendo la segunda**. Cualquier regla que propongas para P5 tiene que sobrevivir a un arquitecto que concluye demasiado rápido.

---

## 3. LA LISTA CERRADA: lo decidido y sin construir

| # | desde | qué | días |
|---|---|---|---|
| 1 | 22/08 | **La guarda del rerank**: saltárselo cuando los candidatos caben en las plazas (B.89, decidido en F-22/F-23; su condición previa —el verificador de hallazgos— está en producción desde el 23/08) | 49 |
| 2 | 16/09 | F-108: corte relativo; jerarquía de severidad; corpus de escala | 24 |
| 3 | 17/09 | F-109: alimentar el rerank con las unidades afines **enteras** en vez de 300 caracteres | 23 |
| 4 | 17/09 | F-109: el experimento de **puentear el rerank** en una pasada (~30 créditos) para medir qué pierde la selección | 23 |
| 5 | 24/09 | F-116: verificador ciego (paso 2), segunda vuelta dirigida (paso 3), guardar los ids de los fragmentos mostrados | 16 |
| 6 | 24/09 | F-117: tope duro de gasto del agente; cola en vez de 409; búsqueda híbrida | 16 |
| 7 | 28/09 | F-118: escalón 2 (lectura por tramos para las parejas que no caben) | 12 |
| 8 | **30/09** | **F-119 entera**: documento como unidad, topK 25→100-150 agrupado, bolsas separadas, MMR, rerank alimentado con parejas, sombra gratuita | 10 |
| 9 | 01/10 | Contadores de los topes ciegos (plan aprobado, sin commit) | 9 |

Como contexto y **no como propuestas nuevas**: el modo exhaustivo lee **menos** de cada pareja que el rápido (6.000 y 3.000 frente a los dos documentos enteros), y la salida del juez sólo está acotada por el techo de la API (con dos documentos casi duplicados escribió 22 solapamientos pese a un «máximo 10» en el prompt, y 48 entradas en una lista sin tope).

---

## 4. Tus tres consultas posteriores al desvío, para que las revises

**F-120 (06/10) — «frente 4 reclasificado».** Problema de registro: **tu dictamen NO CONSTA.** El fichero dice «EL DICTAMEN DE FABLE NO CONSTA. No se pegó nunca en esa conversación». De esa consulta sólo conservamos las preguntas. Su **P5** era la única sobre la selección y preguntaba si la guarda del rerank estaba desbloqueada: lo estaba, porque su condición previa (el verificador de hallazgos) está en producción desde el 23/08. Su P3 anotaba que el caso de B.83 «no se ha repetido» en 78 análisis.

**F-121 (07/10) — «prueba literal de las citas».** Archivada con las dos mitades. Su **P5** preguntó si había un «patrón asentado de "no descartar, rebajar la confianza"», cosa que **F-116 ya había resuelto** («Lo que queda cuando falta un lado no se tira, pero cambia de especie… No entra en la lista de hallazgos»). Contestaste contra esa doctrina («Se publica en un nivel inferior, "cita no verificada"») y **te retractaste en F-122** («"No descartar, degradar" vale para un fallo de verificación, no para una ausencia de evidencia»). Su P7 preguntó si arreglar la copia cambia la emisión, cosa que F-117 ya había contestado («la prohibición de afirmar sin las dos citas, sola, baja la cobertura»). Y apartó la selección remitiendo a F-119.

**F-122 (09/10) — «contrato del juez o segmentador».** Archivada con las dos mitades (huella `caf53c28d4cbaa94`, 17.326 caracteres). Veredicto: **vía 2** —segmentador propio y etiquetas numeradas— **ahora**; vía 1 (la función de citas del proveedor) como destino; vía 3 (atribución a posteriori) sólo como reparación. Fijó el alcance D1 (sólo trozos de texto; las filas de Excel no se tocan) y los criterios de reversión. Apartó la selección remitiendo a F-119 y **la congeló**. Y un detalle que importa: su P7 trabajaba con «44 documentos del corpus», cifra que **no cuadra con lo medido**: la organización tiene 50 documentos, **20 en el corpus** y **6 con trozos**. Los otros 14 son restos de pruebas antiguas, con `extractor_version` nulo y entre 1 y 6 vectores cada uno, y **compiten en la búsqueda**.

---

## 5. Las preguntas

**P1 — ORDEN.** Ordena los nueve puntos de la sección 3 para ejecución, con el criterio explícito que uses. Queremos un MVP que detecte las contradicciones sembradas de forma estable, no una arquitectura completa. Si dos puntos se deben hacer juntos o uno invalida a otro, dilo.

**P2 — QUÉ SE TIRA.** De esos nueve, ¿cuáles han quedado **obsoletos o innecesarios** a la luz de la sección 1? Te pedimos expresamente que propongas bajas: preferimos una lista de seis ejecutables a una de nueve eternas. Y si algo de lo construido en el desvío (2.ter) abarata alguno, dilo.

**P3 — ¿SIGUE EN PIE F-119?** Tu dictamen del 30/09 se emitió antes de medir lo de la sección 1. Con el camino determinista a 15/15 estable, el rerank tirando candidatos con sitio libre en 8 de 10 pasadas, y el régimen de lectura llevando a 0 con el 11 % del texto y a 3 con el 50 %: ¿mantienes F-119 tal cual, la recortas, o cambia su prioridad?

**P4 — LA GUARDA FRENTE A F-119.** La guarda (punto 1) cubre las pasadas donde los candidatos caben: 10 de 38 rápidas con dato. F-119 cubre las 28 donde no caben. ¿Es correcto hacerlas por separado y la guarda primero, o la guarda es ruido que conviene absorber dentro de F-119?

**P5 — CÓMO NO REPETIR EL BUCLE.** Tenemos un mecanismo de reenvío entre consultas que produjo un agujero de diez días sobre la etapa que más pierde, y un arquitecto que concluye demasiado rápido (2.quater). ¿Qué regla de trabajo concreta propones para que una consulta no pueda apartar un frente remitiendo a un dictamen que no se ha ejecutado? Respuesta corta y operable, no doctrina.

**P6 — REVISA TUS TRES ÚLTIMAS RESPUESTAS A LA LUZ DE LA SECCIÓN 1.** Para cada una, qué sigue en pie, qué cae y qué conclusión debemos conservar:

- **(a) F-120**: no conservamos tu dictamen. Dinos qué contestaste, o contéstalo ahora con los datos de hoy. En particular su P5, la guarda del rerank.
- **(b) F-121**: ¿qué conclusiones suyas sobreviven, sabiendo que su P5 ya estaba contestada en F-116 y que te retractaste en F-122, y que su P7 repetía F-117?
- **(c) F-122**: **¿sigue en pie el veredicto de la vía 2?** Se emitió creyendo que el frente principal era la puerta de citas. Hoy sabemos que la puerta pierde 3 de 10 y que la selección pierde pasadas enteras. El primer trozo de la vía 2 (el módulo de unidades de cita) ya está construido; el resto compite con los nueve puntos de la sección 3. **Si la vía 2 debe esperar, dilo con esas palabras.**
- **(d)** Y la cifra de «44 documentos del corpus» de su P7: con los números reales (50 en la organización, 20 en el corpus, 6 con trozos, 14 restos que compiten en la búsqueda), ¿cambia alguna conclusión de F-122?

---

## 6. Lo que NO preguntamos

No preguntamos por el mecanismo de la puerta de citas, ni por el contrato de citas del juez, ni por la extracción de afirmaciones, ni por las tablas de Word. Todo eso está medido o aparcado y **no queremos que entre en esta respuesta**.

---

# (d) RESPUESTA RECIBIDA — F-123 · 10/10/2026 · DICTAMEN, ÍNTEGRO

RESPUESTA DE FABLE — F-123 · ORDEN DE EJECUCIÓN, NO MECANISMO
10/10/2026. Esta respuesta tiene en cuenta toda la serie desde F-113, no solo la consulta. El director lo ha pedido así y la consulta lo merece.

Procedencia

No veo el código. Todo dato del repositorio va con la procedencia de Code.
Tengo delante mis dictámenes de F-113 a F-122 en esta misma conversación, incluido F-120, que el archivo no conserva. Lo resumo en P6a para que se archive.
No abro frentes nuevos. Lo único que añado va al final, debajo de la lista, y no es nuevo: es F-120 P2, que el archivo perdió.

Veredicto

El plan nuevo tiene sentido y es el de siempre. Lo que el director propuso esta mañana es F-119 del 30/09, que a su vez es F-109 del 17/09 y B.83 del 19/08. El diagnóstico no ha cambiado en siete semanas: el falso negativo muere en la selección y en cuánto se lee, no en el juez. Lo que cambió el 30/09 fue el orden de ejecución, y lo cambiamos mal.
Mi parte en el desvío, sin atenuantes: en F-121 y F-122 acepté “no pregunto por el retrieval: es F-119” sin comprobar en qué estado estaba F-119, y en F-122 la congelé. Es mi patrón de error número 2 del traspaso, heredar una premisa de la consulta sin exigirle evidencia, cometido dos veces seguidas sobre la etapa que más pierde. La regla de P5 existe para que no se repita, y me obliga a mí el primero.
Orden: limpiar y contar antes de medir; medir antes de cambiar; lo que pierde pasadas enteras antes que lo que pierde un hallazgo por pasada. Con ese criterio, los nueve puntos se convierten en seis ejecutables, con cuatro bajas o fusiones, y la vía 2 debe esperar.

Dónde empezó el desvío, y por qué

El director pide ver dónde empiezan las discrepancias. Están en un día y en una decisión no tomada.

Del 15 al 29/09 el camino era el de F-117: arnés, escalón 1, y luego selección. Funcionó: el escalón 1 llevó la detección de 1 a 3 de 3.
El 30/09 llegó F-119, que decía que la selección medía en moneda antigua, y se archivó sin decisión. Ese mismo día se abrió B.299, “la puerta de citas tira 5 de 7”, que era medible, concreto y nuevo. Lo nuevo y medible ganó a lo decidido y sin empezar. Nadie decidió desviarse; se decidió no decidir sobre F-119, y el hueco lo llenó lo que tenía cifras ese día.
Las tres consultas siguientes heredaron el hueco. Cada una apartó la selección remitiendo a F-119, y yo lo acepté tres veces. F-122 la congeló. La regla de congelación de F-122 era correcta en forma, tres cosas y nada más, y equivocada en contenido, porque congeló lo que llevaba diez días sin empezar y dejó dentro lo que pierde menos.
Lo que no fue un desvío: el lector unificado, el parche de la glosa, el módulo de unidades y la medición de la sección 1 son trabajo bueno y se usan abajo. Lo que fue desvío es el orden: ocho días sobre una etapa que pierde 3 de 10 mientras la que pierde pasadas enteras seguía sin tocarse.

Qué solventa el plan nuevo y qué no. Lo digo antes de ordenar, para que nadie espere lo que no va a dar:

Solventa: el candidato que no llega (selección), el documento leído al 11 % (régimen), el rerank que tira con sitio libre (guarda), y LUGAR muriendo en la puerta (vía 2, al final).
No solventa por sí solo: que el juez emita NEGACIÓN 3 de 10 con todo o nada. Eso es inestabilidad de emisión, y su remedio es F-120 P2, que el archivo perdió y que repongo debajo de la lista. La sección 1 permite además una medición que decide si NEGACIÓN es selección o emisión, y la pongo en la fase 0.

P1 · Orden de ejecución

Criterio, explícito: (1) nada se cambia sin línea base, y la línea base se destruyó anoche; (2) nada se mide con 14 documentos basura compitiendo en la búsqueda; (3) primero lo que pierde pasadas enteras, después lo que pierde un hallazgo por pasada; (4) a igual pérdida, primero lo más barato y lo decidido hace más tiempo.

FASE 0 · Suelo limpio y contadores. Sin cambiar comportamiento. Dos o tres días.

0.1 Limpieza de los 14 restos (extractor_version nulo, 1 a 6 vectores). En dos fases, como manda la doctrina: primero listar y marcar, después borrar o reindexar. Esto no estaba en la lista porque F-120 dijo “reindexar cambia la línea base”. La línea base ya no existe, así que es gratis hacerlo ahora y caro no hacerlo. Predicción: los “14 afines” del 30/09 incluyen al menos 8 de estos restos, y el régimen sin_fuente_comun de las cuatro pasadas de las 06:37 a las 06:40 tiene un resto como candidato.
0.2 Punto 9, contadores de los topes ciegos, más los ids de fragmentos mostrados del punto 5. Es una sola pieza: por pasada, qué documentos tomaron plazas, cuántos trozos cada uno, qué régimen de lectura, cuántos caracteres de cada lado, y qué eligió el rerank de cuántos.
0.3 Línea base nueva: 5 pasadas de NOR-11, CLI-12 y CLI-13, con los contadores de 0.2 escritos. Cuesta pasadas y no hay alternativa.
0.4 La medición que decide NEGACIÓN: sobre la línea base nueva, comparar las entradas de las pasadas que emiten las tres trampas con las que emiten solo PLAZO: régimen, caracteres leídos, candidatos. Predicción: en al menos la mitad de los “todo o nada” las entradas difieren. Si difieren, NEGACIÓN es selección y lectura y se arregla en las fases 1 y 2. Si son idénticas, es emisión y se arregla con F-120 P2.

FASE 1 · Lo que pierde pasadas enteras. Una semana.

1.1 Punto 1, la guarda del rerank. Un día. Decidida hace 49 días. Si candidatos ≤ plazas, el rerank no se llama. Predicción: en las 10 pasadas rápidas con sitio libre, los descartes del rerank pasan de 8 a 0, y ninguna pierde precisión según el arnés.
1.2 Punto 7, lectura: presupuesto y régimen. Antes del escalón 2 completo, una constante: F-118 propuso 20.000 tokens de pareja y se construyó con 10.000. Subirlo a 20.000, unos 80.000 caracteres, hace que CLI-12 (55.135) quepa entero con casi cualquier candidato. Predicción: CLI-12 pasa de leerse entre el 11 % y el 68 % a leerse al 100 % en 5 de 5 pasadas, y publica 3 o más en 4 de 5. Y el régimen sin_fuente_comun deja de recortar el analizado a 6.000: ese recorte es la tijera vieja viva, y con la limpieza de 0.1 casi no debería dispararse. El escalón 2 por tramos queda para los documentos que no quepan ni así; encargo para Code: cuántos pares del corpus superan 80.000.

FASE 2 · Punto 8, F-119, recortada a cuatro movimientos. Una a dos semanas.

Sombra primero, gratis en modelo: solo consultas al índice, comparando listas de candidatos vieja y nueva.
Los cuatro movimientos: topK de 25 a 100 por consulta; agrupar por documento con tope de 5 trozos por documento; bolsa separada para los documentos analizados en tanda; orden por mejor trozo con desempate por cuántas consultas dieron con el documento. El rerank recibe parejas (trozo del analizado, trozo del candidato) en vez de 3.000 caracteres por posición. Esto absorbe el punto 3.
El punto 4, puentear el rerank en una pasada, deja de ser un experimento aparte: es la comparación de la sombra, y se hace con la sombra.
Predicción: NOR-11 llega a candidato de CLI-13 en 5 de 5 pasadas; en las 28 pasadas con más afines que plazas, el candidato verdadero de cada trampa queda entre los 6 en al menos 26.

FASE 3 · Lo que pierde un hallazgo por pasada. Una semana.

3.1 Punto 5, segunda vuelta dirigida. Para los hallazgos con un solo lado, que son el 27 % de los descartes de prosa. Con los contadores de 0.2 se sabrá cuántos recupera.
3.2 Punto 5, verificador ciego. Después de la segunda vuelta, porque con más texto y más lados hace más falta.
3.3 Vía 2 de F-122, la puerta. Aquí, no antes. El módulo de unidades ya está construido, así que cuesta la mitad. Cubre LUGAR, que muere 3 de 3 en la puerta por ladoFallido = nuevo.

Fuera de la lista del analizador, pero no fuera del plan: el tope duro de gasto del agente del punto 6 es un commit de una línea y protege el dinero. Hágase cuando haya un hueco; no compite con nada.

Dependencias: 0.1 y 0.2 antes de 0.3; 0.3 antes de cualquier fase; 1.1 y 1.2 pueden ir en paralelo; la fase 2 no empieza sin la línea base de la fase 1 medida; la fase 3 no empieza sin la fase 2 activada. Ninguno invalida a otro, salvo lo que se indica en P2.

P2 · Qué se tira

Bajas:

Punto 2, F-108, entero. El corte relativo lo absorbe F-119 en “cuántos candidatos van al juez”; la jerarquía de severidad no es del MVP; el corpus de escala es posterior al primer cliente. Se archiva con fecha, no se cancela.
Punto 6, F-117, salvo el tope del agente. La cola y la búsqueda híbrida son posteriores al MVP del analizador. Se archivan con fecha.

Fusiones:

Punto 3 dentro del 8: alimentar el rerank con unidades enteras es un caso del “rerank con parejas” de F-119.
Punto 4 dentro del 8: el experimento de puentear es la comparación de la sombra.
Los ids mostrados del punto 5 dentro del 9: es el mismo contador.

Resultado: seis ejecutables. Limpieza y contadores con línea base (0); guarda (1.1); presupuesto de lectura (1.2); F-119 recortada con sombra (2); segunda vuelta más verificador ciego (3.1 y 3.2); vía 2 (3.3). Más el tope del agente como una línea aparte.

Lo construido en el desvío que abarata algo:

El lector unificado es prerrequisito de cualquier respuesta de varios bloques; ya está.
El módulo de unidades de cita es la mitad de la vía 2; 3.3 cuesta la mitad.
El techo de solapamientos a 10 ya bajó la inestabilidad a la mitad; 0.4 se mide con él puesto.
El cuerpo de medida es lo que permite escribir esta respuesta y la sección 1. No es un coste perdido; es el arnés haciendo su trabajo.

P3 · ¿Sigue en pie F-119?

Sigue en pie, se recorta y sube de prioridad.

Confirmada por la sección 1: el rerank tira con sitio libre en 8 de 10; el candidato desaparece a veces; 28 de 38 pasadas tienen más afines que plazas. Los tres hechos son la tesis de F-119 medida.
Recortada: quito MMR como técnica propia, porque el tope por documento basta; quito la amplitud como criterio de orden principal hasta que se mida, y la dejo como desempate; quito el perfil por documento. Quedan los cuatro movimientos de la fase 2.
Una condición previa que F-119 no vio: los 14 restos. F-119 razonó sobre “44 documentos del corpus” y el desplazamiento de plazas; parte de ese desplazamiento son restos con 1 a 6 vectores que ningún tope de F-119 distingue de un documento real. Limpiar antes es lo que hace que la sombra de F-119 mida lo que cree medir.
Prioridad: del noveno puesto en días al segundo en orden. Solo la limpieza, los contadores y la línea base van antes, y van antes porque sin ellos F-119 no se puede medir.

P4 · La guarda frente a F-119

Por separado, y la guarda primero. Tres razones:

Es un día de trabajo, decidido hace 49 días, con su condición previa cumplida desde el 23/08. Absorberla en F-119 la retrasaría otras dos semanas por tercera vez.
Cubre una población distinta, 10 de 38, y su efecto se mide solo: descartes del rerank con sitio libre, de 8 a 0.
Su regla sobrevive a F-119: “si candidatos ≤ plazas, no hay rerank” sigue siendo cierta con candidatos agrupados por documento. F-119 la hereda, no la sustituye.

No es ruido. Es la primera pieza de F-119 en salir, con 49 días de retraso.

P5 · Cómo no repetir el bucle

Tres reglas cortas, operables, y la primera me obliga a mí.

Un dictamen sin decisión no puede usarse para apartar un frente. Toda consulta abre con una tabla “dictámenes que esta consulta aparta”, rellenada por Code desde el índice, no por el arquitecto, con tres estados posibles: EJECUTADO con commit, DESCARTADO con motivo, o SIN DECISIÓN. Si alguno está SIN DECISIÓN, la consulta no puede apartarlo: o pide la decisión en su P1, o Fable no responde al resto hasta que esa fila tenga estado. Yo respondo primero a esa fila.
“Queda descartado” paga la misma evidencia que “queda demostrado”. Ninguna causa se descarta con menos de 5 pasadas con régimen, caracteres leídos y candidatos escritos. Un descarte sin esos tres datos se registra como “hipótesis viva, no medida”, nunca como descartado. Esto es F-99 aplicado al arquitecto, y es la regla que habría parado “el retrieval queda descartado” y “el techo de tokens es la causa”.
Fable vigila el reloj, no solo la pregunta. En cada respuesta, antes del veredicto, una línea: “frentes decididos y sin commit desde hace más de 7 días”, sacada de la tabla de la regla 1. Si la consulta no toca ninguno de ellos, lo digo antes de contestar. En F-121 y F-122 esa línea habría dicho “F-119, 7 y 9 días”, y no se escribió.

P6 · Revisión de mis tres últimas respuestas

(a) F-120, dictamen reconstruido. Lo tengo delante; esto es lo que contesté el 06/10:

P1: la cita deja de ser copia y pasa a puntero sobre segmentos numerados que el juez ve; el sistema extrae el texto; posiciones de carácter no son viables porque los modelos no cuentan. La glosa a un campo aparte. Un fallo de copia debe reparar, no descartar. Encargo al director: etiquetar las 11 citas descartadas como verdaderas o falsas; predicción, 7 o más verdaderas. Sigue pendiente.
P2: tres remedios a la pérdida entre pasadas, del barato al estructural: que el juez declare la lista de datos compartidos que examinó, para que la omisión deje rastro; medir el coste real de la segunda pasada con caché de prompt, que de entrenamiento no es el doble sino del orden de un cuarto; y a largo plazo, extraer afirmaciones una vez por versión de documento al indexar, para que lo no determinista no se repita en cada análisis.
P3: la guarda del rerank estaba desbloqueada desde el 23/08; tras interruptor; y una regla general: “0 seleccionados con N ≥ 1 candidatos” es una alarma, no un dato. Encargo: contar cuántas pasadas tienen rerank con 0 de N. La sección 1.6 lo responde hoy: 8 de 10 tiran algo con sitio libre.
Qué sigue en pie: todo. Qué cae: nada, pero su P2 se perdió del archivo y por eso la inestabilidad de emisión no está en la lista de la sección 3. Lo repongo abajo.

(b) F-121.

Sobrevive: el patrón del sector, señalar y extraer, con sus nombres; que la función de citas del proveedor existe y se probó; que la huella idéntica entre días significa que reintentar la copia es inútil; la predicción de que “si no puedes copiar, no emitas” acopla emisión y copia, que sigue abierta y se medirá en 3.3.
Cae: P5, degradar en vez de descartar, retractado en F-122 y confirmado hoy como retractado: F-116 ya lo había resuelto y no lo comprobé. P6, “2 de 4 recuperables”, falsa, 0 de 13. P7, “la puerta primero por valor por euro”: cae con la sección 1. La puerta pierde 3 de 10 en una trampa; la selección y la lectura pierden pasadas enteras. El orden de P7 era el inverso del correcto, y lo era porque la consulta apartó la selección y yo lo acepté.
Conclusión que conservar: el mecanismo de la vía 2 es correcto; su momento no era ese.

(c) F-122.

El veredicto de la vía 2 sigue en pie como mecanismo: segmentador propio, etiquetas, ancla, alcance D1 solo prosa, Excel sin tocar, criterios de reversión. Nada de eso cae.
La vía 2 debe esperar. Con esas palabras. Va en 3.3, después de la limpieza, la guarda, el presupuesto de lectura, F-119 y la segunda vuelta. El módulo de unidades ya construido no se tira: espera conectado a nada, como está.
La regla de congelación de F-122 se retira y la sustituye el orden de P1. Congeló F-119, que era lo que había que descongelar.

(d) Los 44 documentos. La cifra no cambia ninguna conclusión de F-122 sobre la puerta: el segmentador se mide igual sobre 6 documentos con trozos que sobre 44. Sí cambia F-119 y la fase 0: 14 restos con vectores compiten por plazas y pueden disparar el régimen sin_fuente_comun. Eso convierte la limpieza en prerrequisito de todo, y es la pieza que ni F-119 ni F-122 pidieron porque trabajaban con un corpus que no existía.

Lo único que falta, colocado debajo de la lista como se pide

No es nuevo: es F-120 P2, perdido del archivo. La inestabilidad de emisión, NEGACIÓN 3 de 10 con todo o nada, no la cura ninguno de los seis ejecutables si 0.4 demuestra que las entradas de las pasadas buenas y malas son idénticas. Si es así, entra como séptimo ejecutable, después de 3.3: la lista de datos examinados en la salida del juez, que con etiquetas de la vía 2 es casi gratis, y la medición del coste de la segunda pasada con caché. Si 0.4 demuestra que las entradas difieren, no hace falta y se queda archivado. La medición decide, y está en la fase 0 porque es gratis.

---

# (e) PREDICCIONES REGISTRADAS, PENDIENTES DE MEDICIÓN

Escritas por Fable antes de medir. **Sin veredicto.** Con la cifra exacta del dictamen; la que
no lleva cifra se marca «sin cifra». ⚠️ El encargo hablaba de **ocho**; con los apartados que
nombra (0.1, 0.4, 1.1, 1.2, 2 y P6) salen **diez**, nueve con cifra y una sin ella.

| N.º | Apartado | Predicción | Cifra exacta | Estado |
|---|---|---|---|---|
| P-F123-1 | 0.1 | Los «14 afines» del 30/09 incluyen restos (los 14 de `extractor_version` nulo) | **al menos 8** | sin medir |
| P-F123-2 | 0.1 | El régimen sin_fuente_comun de las cuatro pasadas de las 06:37 a las 06:40 tiene un resto como candidato | **sin cifra** ⚠️ ver (f) 4 | sin medir |
| P-F123-3 | 0.4 | En los «todo o nada», las entradas (régimen, caracteres leídos, candidatos) difieren | **al menos la mitad** | sin medir |
| P-F123-4 | 1.1 | Con la guarda, los descartes del rerank en las 10 pasadas rápidas con sitio libre | **de 8 a 0** | sin medir |
| P-F123-5 | 1.1 | Con la guarda, pasadas que pierden precisión según el arnés | **ninguna** | sin medir |
| P-F123-6 | 1.2 | Con 20.000 tokens de pareja, CLI-12 se lee al 100 % | **en 5 de 5** | sin medir |
| P-F123-7 | 1.2 | Con 20.000 tokens de pareja, CLI-12 publica 3 o más | **en 4 de 5** | sin medir |
| P-F123-8 | 2 | NOR-11 llega a candidato de CLI-13 | **en 5 de 5** | sin medir |
| P-F123-9 | 2 | En las 28 pasadas con más afines que plazas, el candidato verdadero de cada trampa queda entre los 6 | **al menos 26** | sin medir |
| P-F123-10 | P6 (a), F-120 P1 | De las 11 citas descartadas que etiquete el director, verdaderas | **7 o más** | sin medir (encargo pendiente desde F-120) |

---

# (f) PRECISIONES SOBRE EL DICTAMEN, COMPROBADAS POR CODE EL 10/10/2026

1. **«F-118 propuso 20.000 tokens de pareja y se construyó con 10.000» — CIERTO, y en la misma
   unidad.** F-118 pidió «20.000 tokens de entrada para los dos lados» (F-118:338). Lo
   construido es `PRESUPUESTO_PAREJA_TOKENS = 10_000` (`lib/analysis/judge.ts:1168`), que se
   convierte a caracteres con `CARACTERES_POR_TOKEN = 4` (`:1169`):
   `PRESUPUESTO_PAREJA_CARACTERES` = 40.000 caracteres (`:1170`). Los «40.000 caracteres» y los
   «10.000 tokens» son la misma constante; y los «80.000 caracteres» del dictamen son los
   20.000 tokens con la misma conversión. Por qué se eligió 10.000: «para que el corte se
   dispare alguna vez» (`Estado_Del_MVP.md:8170`), justificación RETIRADA el 29/09 (D-4,
   `:8171-8175`). ⚠️ La conversión ÷ 4 subestima los tokens del español (F-122 (f), punto 2,
   habla de unos 3,5 caracteres por token).
2. **«Los hallazgos con un solo lado son el 27 % de los descartes de prosa» — la cifra cuadra,
   la población hay que leerla bien.** Sale de SQL_B358, ejecutada el 08/10 (B.358,
   `Puntos_Pendientes_Doclity.txt:8122-8125` y `:8157-8159`): 89 descartes = 40 filas de tabla
   + 49 de prosa; numerador **13** (las «cruzadas»: 2 del lado nuevo + 11 del existente);
   denominador **49**; 13/49 = 26,5 %. Es la MISMA población que el censo de 89. Tres cautelas:
   (i) son entradas de `descartesPorCita` desde el 02/10, que mezclan contradicciones y
   solapamientos (SQL_B358 no filtra por `tipo`); (ii) «cruzada» es una aproximación por texto
   normalizado, y «un solo lado» es la lectura de Fable en F-122 (F-122:330); (iii) parte de esas
   filas eran de análisis de NOR-11 y NOR-10, borrados el 09-10/10 (B.367): **la cifra ya no se
   puede volver a medir sobre la misma población**.
3. **«El escalón 1 llevó la detección de 1 a 3 de 3» (30/09) — de dónde sale, y su base ya no
   existe.** Sale de `Estado_Del_MVP.md:8644`: «Contradicciones sembradas que ENCUENTRA el juez:
   apagado, 1 de 3 → encendido, 3 de 3». Es la dirección NOR-11 → CLI-13 (tabla de
   `:8632-8638`): PLAZO y NEGACIÓN 6/6 publicadas, LUGAR 6/6 ENCONTRADA y 6/6 DESCARTADA.
   ⚠️ «Detección» es **encontrar**, no publicar: publicadas, 2 de 3. ⚠️ **SU LÍNEA BASE YA NO
   EXISTE**: esas pasadas tenían NOR-11 como documento analizado, y borrar un documento borra sus
   análisis por `document_id` (`lib/delete-document.ts:167-170`, B.367). **No se reutiliza como
   punto de comparación.** (Deducido del criterio de borrado; no se ha comprobado con una
   consulta.)
4. **P-F123-2 parte de una premisa que no cuadra con lo medido.** Las cuatro pasadas de CLI-12
   de las 06:37 a las 06:40 del 30/09 fueron **`tijera_vieja`**, no `sin_fuente_comun`: el
   interruptor estaba apagado hasta las 07:50 (B.369, medida del director del 10/10). Se
   registra igual, con esta marca.
