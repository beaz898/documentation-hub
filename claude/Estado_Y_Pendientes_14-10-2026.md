# ESTADO Y PENDIENTES — 14/10/2026

> **Revisión: creado el 14/10/2026 · actualizado el 16/10/2026.** El 16/10 cambiaron dos cosas: el
> frente de lectura (3.1) pasa de una entrada a cinco, con el orden que dictamina F-127, y se
> corrige el estado de la fase 0, que no era el que creíamos. Se cierra la fase 3.4 (3.8) y entran
> la deuda nueva, la regla 12 y la sección 0, lo que está en vuelo.
> **Actualizado el 18/10/2026**, con la adenda de Fable a F-127 (archivada en su sección (g)): el
> frente de lectura cambia en 3.1.2, 3.1.3, 3.1.4 y 3.1.5, gana 3.1.6 y 3.1.7, y la horquilla de la
> cita pasa a guía blanda. La sección 0 recoge que la medición de NOR-10 ya está hecha y calificada.
> **Actualizado el 19/10/2026**: la tabla de precios tenía Haiku 4.5 a la cuarta parte (corregida,
> commit `d1505999`), y el coste por análisis deja de depender del registro de tokens por llamada
> (`SQL_F127_02`); el interino (3.1.3) NO cierra NOR-10 ↔ CLI-12, medido; entra el 3.1.8, el modelo
> del juez; y la deuda de las cabeceras del selector.

> **Sustituye a `Puntos_Pendientes_Doclity.txt`**, que tiene cosas desfasadas. Escrito por el
> arquitecto el 14/10/2026, después de cerrar la medida de F-126. Cada pendiente dice **de qué
> consulta de Fable sale**, para que una entrada suelta se pueda rastrear dentro de un mes.
> Las consultas están archivadas con sus dos mitades en `claude/consultas-fable/`.

---

## 0. Lo que está en vuelo (18/10/2026)

- **HECHO el 16/10**: las tres pasadas de NOR-10 desde la bandeja (12:45, 12:46 y 12:46 hora de
  Madrid), leídas con `SQL_F127_01_la_medida_de_NOR10.sql`, y calificadas el 18/10 en
  `claude/Predicciones_F127_NOR10_Documento_Largo.md`. **La regla de la cita de F-126 aguanta fuera
  de NOR-11**: una contradicción publicada (A, por otra frase), literal y contigua, los seis
  contadores a cero, cero citas fuera de lo entregado.
- **HECHO**: el añadido a F-127 con la medición y las cinco correcciones (16/10) y la adenda de Fable
  que lo contesta (18/10), archivados en la sección (g) del archivo de F-127.
- **HECHO el 19/10**: P-F127-12 calificada en simulación, con la línea del log del retrieval de la
  pasada 1 del 16/10 (3.1.3).
- **POR EJECUTAR**: `SQL_F127_02_el_coste_por_analisis.sql`, el coste por análisis con el precio
  bueno (3.1.1). Lo ejecuta el director.

---

## 1. Dónde estamos: el marcador del caso de control

Tres contradicciones sembradas en NOR-11 ↔ CLI-13, con verdad documentada en
`SIEMBRA_caso_control.md`: **PLAZO** (72 h vs 7 días), **LUGAR** (Chamberí vs Retiro) y
**NEGACIÓN** (bolsa amarilla con prohibición expresa del negro vs contenedor negro).

| fecha | qué había | PLAZO | NEGACIÓN | LUGAR | marcador |
|---|---|---|---|---|---|
| 06-08/10 | línea base (10 pasadas, B.357) | 10/10 | 3/10 | 0/10 | 1 de 3 |
| 11/10 | corpus limpio (5 pasadas) | 5/5 | 0/5 | 0/5 | 1 de 3 |
| 12/10 | fase 1.0, la caja definida (6 pasadas) | 6/6 | 6/6 | 0/6 | 2 de 3 |
| 13/10 | fase 3.1, el empalme (7 pasadas) | 7/7 | 7/7 | 1/7 | 2 de 3, y 3 de 3 una vez |
| **14/10** | **F-126, la regla de la cita (7 pasadas)** | **7/7** | **7/7** | **7/7** | **3 DE 3, LAS SIETE** |

Cero falsos positivos en todas las ventanas. Lo que publica LUGAR hoy es un tramo **contiguo y
literal** de 133 caracteres («…ubicado en la clínica de Chamberí»), con `marca recompuesta: no`:
el juez dejó de fabricar la frase y **copia**.

**Las dos mediciones de NOR-11 ↔ CLI-13 que importan, para no confundirlas** (lo hizo el dictamen
de F-127, que dio la del 13/10 como estado actual):
- **13/10, fase 3.1**: LUGAR 1 de 7 (`claude/Predicciones_F125_Seis_Pasadas.md`).
- **14/10, F-126, regla de la cita nueva**: 3 de 3 en las siete pasadas, LUGAR 7 de 7, cita literal
  contigua de 133 caracteres, los seis contadores a cero, cero falsos positivos
  (`claude/Predicciones_F126_La_Regla_De_La_Cita.md`).

**El criterio de «cerrado para enseñar»** (F-123, sin cambios en F-127): cada trampa sembrada
publicada en 4 de 5 pasadas o más, cero falsos, y el coste por análisis escrito. En NOR-11 ↔ CLI-13
**las dos primeras condiciones SE CUMPLEN desde el 14/10. La que falta es el coste por análisis, y
es exactamente el paso 1 del frente de lectura (3.1.1).** Por eso el paso 1 va primero, y no es
burocracia.

**La horquilla de la cita de F-126 pasa a ser GUÍA BLANDA** (adenda de Fable a F-127, Q5, 18/10):
«normalmente entre 40 y 300 caracteres»; **la regla dura sigue siendo contigua y literal**. No se
toca el prompt. El motivo: en NOR-10, el 16/10, la mediana de las citas publicadas fue 281 (de 222 a
340), literal, contigua y con los seis contadores a cero, que es la regla funcionando. Si el contador
de recompuestas sube en documentos de frases largas, se revisa.

---

## 2. Lo que está hecho

### Fase 0 — limpieza · F-123 (10/10) · sólo la 0.1
Los 14 restos fuera del corpus (`SQL_F123_05`, ejecutado el 11/10). **Corregido el 16/10**: aquí
ponía también «contadores y línea base nueva», y no es verdad; el estado real de 0.2, 0.3 y 0.4
está en el punto 3.14. La línea base anterior se perdió al borrar NOR-11 y NOR-10 de la aplicación: su única copia es
`claude/Medida_B357_destino_contradicciones_NOR11_CLI13.md`, que desde el 13/10 también está en el
repositorio.

### Fase 1.0 — la caja, DEFINIDA Y ACOTADA EN EL PROMPT · F-124 (12/10) · commit `00ed4235`
`uniqueToNewDoc` definida en el prompt del juez, con ejemplo positivo y negativo y el tope de 10
escrito en el prompt. Subió el marcador de 1 a 2 de 3.
El hallazgo que lo motivó: el juez emitía LUGAR dentro de esa caja, con el conflicto escrito por él
mismo, en una lista que no pasaba por la puerta ni se publicaba
(`claude/Hallazgo_LUGAR_en_uniqueToNewDoc.md`, la única copia de las salidas de `SQL_F123_07` y
`SQL_F123_08`, traída al repositorio el 14/10). Lo que falta de esa decisión está en el punto 3.13.

### Fase 3.1 — el empalme · F-125 (12-13/10) · 13 commits, `0ab6e7d6`
**13 commits** (del 0 al 11, contando 3a y 3b). El push `1671465a..0ab6e7d6` lleva 14 porque el
primero, `83a5160b`, es el archivo de F-125.
La puerta de citas anclada por el **tramo literal más largo** en vez de por los 20 primeros
caracteres. (B) sólo en las contradicciones, lo publicado es siempre la **frase real** y nunca el
empalme, los trozos de las dos frases al verificador, dos guardas y seis contadores.
Decisiones en tres sitios del repositorio: el archivo de F-125
(`claude/consultas-fable/F-125_2026-10-12_el-empalme.md`), `CLAUDE.md` (la descripción de la
puerta de citas) y `claude/Estado_Del_MVP.md` (fase 3.1).
**Medida: LUGAR 1 de 7.** (B) hizo lo correcto las siete veces —rescató una y se negó seis, porque
en la cita corta no había nada que rescatar—. El techo no lo ponía la puerta: lo ponía el juez.

### F-126 — la regla de la cita (13-14/10) · 7 commits, `2fe72b4e`
**7 commits.** El push `0ab6e7d6..2fe72b4e` lleva 8 porque el primero, `c070438a`, es el SQL de la
medida de la fase 3.1.
Hallazgo: el prompt **ya prohibía** empalmar, en mayúsculas y en cuatro sitios, y el juez lo
incumplía sólo en la frase larga con el dato en una subordinada lejos del sujeto.
Fable corrigió la dirección que proponía el arquitecto: no «tan largo como haga falta» sino **«el
tramo contiguo más CORTO que contenga el dato, aunque empiece y acabe a mitad de frase, normalmente
entre 40 y 200 caracteres»**, con ejemplo de subordinada sin sujeto y moldes del JSON realistas.
Más **«prompt estricto, puerta tolerante»** (ley de Postel) escrito en `CLAUDE.md`, con la regla de
que tolerar no es autorizar y que la tolerancia sólo vale con contador.
**Medida: 7 de 7.** Siete de las ocho predicciones aciertan; falla la de la mediana, y por una razón
sabida: toda la bajada venía de LUGAR porque PLAZO y NEGACIÓN ya se citaban bien
(`claude/Predicciones_F126_La_Regla_De_La_Cita.md`).

---

## 3. Lo que queda, en orden, con su origen

### 3.1 · EL FRENTE DE LECTURA · F-123 fase 1.2, reescrito por F-127 (16/10)
**La fase 1.2 de F-123 («subir el presupuesto a 80.000») deja de ser una entrada y pasa a ser
cinco**, en el orden que dictamina F-127 (P7) y con su estado real; **siete desde el 18/10**, con
las dos que añade la adenda (3.1.6 y 3.1.7). Lo que la motivó sigue en pie:
la única pareja con verdad documentada que pone a prueba las frases largas con subordinadas es
**NOR-10 ↔ CLI-12** (`SIEMBRA_corpus_ampliado.md`), y no cabe en una lectura: 66.801 y 55.135
caracteres renderizados contra 40.000. Y la regla de hoy no es monótona: tiene un barranco en 30 de
30 parejas, y subir a 80.000 con ella deja fuera la frase B que hoy entra (F-127, (c) 2.1 y 2.2).

#### 3.1.1 · Registrar tokens por llamada · F-127 P7 paso 1 y P9.1 · SIN EMPEZAR
**Es lo primero.** Cero cambio de comportamiento: la API ya devuelve `input_tokens`,
`output_tokens`, `cache_creation_input_tokens` y `cache_read_input_tokens`; llegan a
`lib/llm/anthropic-client.ts:333-340` y se pierden al sumarlos por modelo en
`lib/observability/usage-context.ts:40-45`. Hay que guardar también la latencia, que hoy no se mide
en ningún sitio, y el id de pareja. **La falta de tokens por llamada ha bloqueado dos mediciones
concretas, las dos de esta semana**: los caracteres por token (P-F127-6, que el propio dictamen da
como «no medible hoy; con el paso 1») y el coste por análisis, que es la tercera condición del
criterio de «cerrado para enseñar» (sección 1).
**CAMBIA el 19/10: el coste por análisis DEJA DE DEPENDER de este paso.** `llm_usage` guarda una
fila por modelo y por análisis con los tokens de todas sus llamadas, y eso basta para el coste por
análisis; lo que no servía era su `cost_usd`, calculado con **Haiku 4.5 a la cuarta parte de su
precio** (`lib/observability/llm-pricing.ts`, corregida el 19/10 en `d1505999`, con los precios
verificados por el arquitecto en la documentación de Anthropic: 1 / 5 / 1,25 / 0,10 $ por millón).
La cifra sale de `SQL_F127_02_el_coste_por_analisis.sql`, que recalcula con el precio bueno y lleva
sus cinco límites en la cabecera. **Lo que SIGUE dependiendo de este paso**: los caracteres por
token, el reparto del coste entre las llamadas de un análisis, y el ahorro real de la caché.
⚠️ **El tope mensual de 35 $ hay que revisarlo con el coste bueno delante** (arquitecto, 19/10): cualquier cifra de coste
leída de `cost_usd` antes del arreglo es la cuarta parte de la real. Los «0,0045 $» por análisis de F-117 (`claude/consultas-fable/F-117.md:183`), que Fable usa en la adenda, no dicen de dónde salen; si salen de esa columna, son la cuarta parte.

#### 3.1.2 · El corte: avanzar al final del trozo, y declarar lo omitido · F-127 P3 y P7 paso 2, adenda Q3 · SIN EMPEZAR
**CAMBIA el 18/10 (adenda de Fable, Q3): ya no es «retroceder al límite».** Retroceder dejaba fuera
la contradicción B de NOR-10 ↔ CLI-12 entera (B va de 36.552 a 36.852 y vive en el trozo 36, que
empieza en 36.485; el corte real cae en 37.143, y retrocediendo quedaría en 36.483). Ahora:
- **el corte AVANZA hasta el final del trozo en curso**, pasándose del presupuesto como mucho un
  trozo, **con tope de 3.000 caracteres**: si el trozo pasa de eso, se retrocede al límite anterior;
- **y se DECLARA al juez lo omitido con su tamaño**, que hoy no se hace (deuda de la sección 5).

**Son dos cosas distintas y van en DOS commits**: primero la dirección del corte; después la
declaración, que cambia el prompt y hay que medirla sola.

#### 3.1.3 · El interino: ventana de 80.000 con reparto monótono · F-127 P4, P5 y P7 paso 3, adenda Q4 · SIN EMPEZAR
**CAMBIA DE FORMA el 18/10 (adenda de Fable, Q4)**: no es pasar un parámetro, es **calcular el resto
ANTES de seleccionar** —resto = P − min(analizado, P − reserva), porque los tamaños de los dos
documentos se conocen antes del retrieval— y pasárselo al selector que ya existe. Según la adenda,
el tope de 25 piezas da unos 30.000 caracteres, suficiente. Reserva = lo menor entre 3.000 y el
tamaño del candidato.
⚠️ **Lo que el interino NO cierra, con nombre y cifra**: NOR-10 ↔ CLI-12, en las dos direcciones,
pierde 41.936 caracteres en el lado candidato. **Y cuesta las trampas: el interino NO cierra NOR-10 ↔
CLI-12.** Medido en simulación el 19/10 con el selector de producción sobre los 53 fragmentos de
CLI-12 de la pasada 1 del 16/10, en su orden del log (control: con 3.000 caracteres elige 0, 4 y 45,
lo mismo que en producción): con 13.199 caracteres entran trece trozos (0, 4, 45, 5, 53, 49, 52, 14,
15, 35, 17, 24, 26), y **los de B (34 y 38) y el de D (6) se quedan fuera**; harían falta unos
17.982 caracteres de texto para el 34 y 20.993 para el 6. **El interino vale por la monotonía y por
las otras parejas, no por ésta. P-F127-12 de Fable: confirmada, y peor de lo que decía** —no es «al
menos una de las dos», son las dos—.

Lo escrito el 16/10, que sigue valiendo: en **UN SOLO cambio lógico**, verificado en simulación sobre las 56 parejas antes de desplegar, con
la prueba de monotonía en el arnés: barrido de 10.000 a 200.000 de mil en mil; **control positivo:
con la regla de hoy se pone roja en las 30 parejas del barranco, y si no se pone roja la prueba no
vale**. La constante pasa a llamarse `TAMANO_VENTANA`; `FRAGMENT_BUDGET_CHARS_QUICK` cambia de
oficio, de tope a suelo, y pasa a llamarse `RESERVA_CANDIDATO`; `SUELO_DEL_ANALIZADO` desaparece.
**Con un arreglo encontrado por Code**: la reserva es lo MENOR entre 3.000 y el tamaño del
candidato, porque reservar 3.000 a un candidato de 918 caracteres le quita 2.082 al analizado en
cuatro parejas. ⚠️ Y aun con ese arreglo, a 80.000 **cuatro parejas pierden en el lado candidato**
(P-F127-3, refutada: F-127 (f), anotación 5), y el reparto nuevo no es recablear un parámetro (ver
la deuda de `selectUnitsWithinBudget`).

#### 3.1.4 · Documentos como bloques y caché de prompt · F-127 P7 paso 4, P-F127-10, adenda Q2 · SIN EMPEZAR
**ADELANTA el 18/10: la adenda de Fable lo pone ANTES de las ventanas (3.1.5).**
Antes va un cambio previo apuntado en F-122: los documentos viajan hoy pegados en el prompt y deben
ir como **bloques de documento** para que la caché actúe. Ese cambio en `llm-client.ts` se mide solo:
misma salida del juez con los documentos como bloques.
**El prompt fijo del juez, medido por Code el 18/10** (lo pedía la adenda, Q6): **11.672 caracteres
por llamada** —11.480 del prompt sin los documentos más los 192 del sufijo JSON que añade
`anthropic-client.ts:304`—, iguales en rápido y en exhaustivo. ⚠️ Y casi todo va DESPUÉS de los
documentos: el prompt empieza con una línea, mete los dos documentos (`judge.ts:810-820`) y sigue con
las reglas. Una caché de prefijo sólo aprovecha lo que va delante, así que el cambio a bloques tiene
que mover también el orden.
**Dato nuevo para este paso (arquitecto, documentación de Anthropic, 19/10)**: con Haiku 4.5, la
lectura de caché cuesta **0,10 $ por millón, una décima parte de la entrada normal (1 $)**, y la
escritura **1,25 $**, un 25 % de recargo la primera vez. Era lo que Fable decía no poder estimar.

#### 3.1.5 · Escalón 2, leer por ventanas · F-118 D5, F-123 punto 7, F-127 P6 y D1 · SIN EMPEZAR
**Es la pieza que CIERRA el frente**, no un extra para lo que no quepa: subir el presupuesto sólo
persigue documentos. Entra como **fase 4**, después de F-119 (3.3) porque la necesita, y después de
3.2 y 3.3 de la fase 3 (aquí 3.6 y 3.7) porque multiplica llamadas. Diseño en siete piezas en F-127
P6.
**CRITERIO DE REVERSIÓN, ESCRITO ANTES DE CONSTRUIRLO**: antes de activarlo, las parejas que caben
en una ventana dan exactamente lo mismo que hoy en el arnés; la que no cabe da igual o más. Si una
trampa que hoy sale deja de salir, se apaga el interruptor.
**Tres precisiones de la adenda de Fable (18/10, Q4):**
- **la unidad de llamada es la ventana, y la unidad de selección es el TROZO del analizado**: cada
  trozo trae sus vecinos del candidato y la ventana recibe la unión, con tope;
- **las ventanas se activan cuando la pareja no cabe, sea cual sea el lado que sobra**: si el
  candidato no cabe entero, el analizado se recorre por tandas aunque cupiera;
- **el selector por trozo y ventana es un selector NUEVO**, no el de hoy.

#### 3.1.6 · Una llamada por ventana con varios candidatos etiquetados · adenda de F-127, Q2 (b) · NUEVO · SIN EMPEZAR
De 6 llamadas a 3 y de 240.000 a unos 150.000 caracteres (cifras de la adenda, para NOR-10 con 2
candidatos y ventanas de 24.000). Riesgos que nombra Fable: **la atribución cruzada entre
candidatos**, que se contiene con una etiqueta de documento en cada trozo y validación en código de
que cada cita viene del documento que dice; y que **la salida se alargue** contra el tope de 8.192.
Cambia «una llamada por pareja» y sus contadores: **censo antes de tocar nada.**

#### 3.1.7 · Fichas por afirmación · adenda de F-127, D2 · NUEVO · ⚠️ NO ES DEL MVP
Cinco a ocho semanas. **Decisión archivada** (adenda, D2): no sustituyen a las tandas, las heredan;
complementan al juez lector, nunca lo reemplazan; se empieza sólo por cifras. La prueba en sombra
—pasar el extractor una vez sobre el corpus y ver si las trampas aparecen como fichas— cuesta
céntimos y no toca nada, y **se lanza después del primer cliente y cuando no haya medición en
curso**, no antes. Y queda escrito (D3) que **el producto NO pasa a detectar sólo cifras**: «sólo
cifras» es el arranque de las fichas, no del producto.

#### 3.1.8 · El modelo del juez · arquitecto, 19/10 · NUEVO · SIN EMPEZAR Y SIN DECIDIR
**Claude Haiku 5.5**, identificador `claude-haiku-5-5`. **Verificado por el arquitecto en la página de
Anthropic el 19/10/2026**; Code no tiene forma de verificarlo y no lo conoce. Lo que dice esa
página:
- **Precio**, por millón de tokens, para prompts de menos de 100.000 tokens: **0,10 $ de entrada y
  0,50 $ de salida**, una décima parte de Haiku 4.5. Anthropic habla de «un 75 % menos de media»
  contando el tramo grande. Las llamadas del juez están muy por debajo de ese umbral: el prompt fijo
  son 11.672 caracteres y la pareja, como mucho, 40.000.
- **Calidad**, muy por encima de Haiku 4.5 en todo lo publicado: GDPval-AA 1620 contra 735;
  AA-Briefcase 1578 contra 614; HLE sin herramientas 45,9 % contra 10,2 %; OSWorld 72,4 % contra
  15,7 %. Y dos medidas de clientes más parecidas a lo nuestro: AlphaSense, 0,84 contra 0,76 sobre
  400 consultas, significativa; Box, once puntos más y la mitad de latencia.
- **Un dial de esfuerzo regulable**, que Haiku 4.5 no tenía.

`SQL_F127_02` da al lado el coste de los mismos tokens con esos precios, sólo como comparación.

**Tres advertencias del arquitecto, que son lo que impide tratarlo como un cambio obvio:**
1. **Ningún benchmark mide lo que nos importa.** Lo que necesitamos del juez es obediencia literal
   —copiar un tramo contiguo tal cual—, no capacidad de razonar. Un modelo más capaz puede ser PEOR
   en eso, porque tiende a mejorar el texto que se le manda copiar. Es el fallo exacto de F-125 y
   F-126.
2. **Cambiar de modelo reinicia la línea base.** Las siete pasadas de NOR-11 del 14/10 y las tres de
   NOR-10 del 16/10 están medidas sobre Haiku 4.5, igual que la regla de la cita de F-126 y los seis
   contadores.
3. **El dial de esfuerzo hay que fijarlo y dejarlo escrito**, o dos mediciones dejan de ser
   comparables entre sí.

**La prueba, escrita antes de hacerla** (arquitecto, 19/10): siete pasadas de NOR-11 y tres de NOR-10
con Haiku 5.5 y el dial fijado y escrito, leídas con `SQL_F128_01_nor11_con_haiku55.sql` y
`SQL_F128_02_nor10_con_haiku55.sql` —`SQL_F126_01` y `SQL_F127_01` con la misma lógica, las ventanas
reducidas a dos marcas de tiempo y el modelo y los tokens de salida de cada pareja en la salida; las
originales se quedan como están, que son las que midieron las líneas base—, contra las dos líneas
base: la del 14/10 (NOR-11, 3 de 3 en las siete) y la del 16/10 (NOR-10). **La primera pasada va
sola** (`claude/Predicciones_F128_El_Modelo_Del_Juez.md`, cómo se mide).
**CRITERIO DE REVERSIÓN, ESCRITO ANTES**: si PLAZO, LUGAR o NEGACIÓN bajan de 7 de 7, o si cualquiera
de los seis contadores de la puerta deja de ser cero, se vuelve a Haiku 4.5 y se archiva por qué.

**El fallo de esta prueba es el disparador de reapertura de la fase 3.4 (3.8)** (arquitecto, 19/10).
La condición que el arquitecto escribió el 14/10 era «la primera vez que un caso sembrado falle en
otro documento porque el juez no copió». Si Haiku 5.5 deja de copiar literal, esa condición se cumple
y los punteros vuelven a la mesa, con `unidades-de-cita.ts` ya construido.
- Precisiones de Code (19/10): la condición del 14/10 decía «en **otro** documento», y un fallo sólo
  en NOR-11 no la cumplía a la letra. **Resuelto el mismo día**: el arquitecto reescribió el
  disparador en el 3.8, y ahora vale en cualquier documento y con cualquier modelo.
  Y `unidades-de-cita.ts` está en git desde el 09/10 (`3816c501`; el 3.8 decía 08/10, corregido el 19/10), y no está del
  todo sin conectar: `frase-real.ts` lo usa en sólo lectura desde la fase 3.1 para sacar la frase
  real. Lo que está sin conectar es la vía de punteros.

**Advertencia del arquitecto que va con ella, porque los punteros no son una red perfecta: un
puntero mal puesto da una cita literal que habla de otra cosa, y la puerta no lo caza**, porque
comprueba que el texto exista en el documento, no que sea el que toca. **Los punteros cambian la
clase de error, no la eliminan.**

~~**No se construye ni se prueba todavía**: va a la próxima vuelta con Fable, porque cambiar el modelo
del juez toca todo lo archivado y es una pregunta de método, no sólo técnica.~~
**EL INTERRUPTOR, construido el 19/10** (sin desplegar ni medir): la variable de entorno
`ANALYSIS_JUDGE_MODEL`. Sin ella, el juez llama exactamente como antes; con el valor exacto
`claude-haiku-5-5`, el juez —y sólo el juez— usa Haiku 5.5; cualquier otro valor deja Haiku 4.5 y
lo dice en el log (`lib/analysis/modelo-del-juez.ts`). El modelo de cada pareja queda en
`lecturaDeLasParejas[].modelo`. Los identificadores, en `lib/llm/modelos.ts`; los precios de 5.5,
en la tabla (0,10 / 0,50 / 0,125 / 0,01 $ por millón, tramo de menos de 100.000 tokens, verificados
por el arquitecto el 19/10).
- **Variable de entorno y no fila de ajustes** (arquitecto, 19/10/2026): el arquitecto retiró su
  requisito de volver atrás sin despliegue, que había pedido pensando en un servicio en uso, y no hay
  ninguno. Con variable, **volver atrás exige un despliegue**: en Vercel un cambio de variable sólo se
  aplica al desplegar, y en Railway reinicia el servicio. **La fila de ajustes leída en cada análisis
  es la opción correcta el día que haya un cliente y haya que revertir en caliente**; hoy sería una
  tabla nueva y una consulta más por análisis para cubrir un riesgo que no existe.
- **El dial de esfuerzo** (verificado por el arquitecto en la documentación de Anthropic el 19/10):
  el campo es `output_config.effort`, con los valores `low`, `medium`, `high`, `xhigh` y `max`;
  el defecto de Haiku 5.5 es `medium`, y mandarlo se comporta igual que omitirlo; Haiku 4.5 no está
  entre los modelos que lo admiten. **Decisión: se manda `medium` explícito, y sólo con Haiku 5.5**,
  para que un cambio futuro del defecto no mueva las mediciones sin que nadie se entere.
- ~~⚠️ **Lo que nadie ha verificado**: si Haiku 5.5 acepta `temperature`, que el juez manda siempre
  (0,1). Si la rechaza, la primera pasada fallará con un error 400 en el log, el análisis caerá a su
  fallback y no se cobrará (F-71). Es lo primero que hay que mirar en el log de la primera pasada.~~
- **RESUELTO el 19/10, antes de lanzar nada: la primera llamada a Haiku 5.5 habría dado 400.** La
  guía de migración de Haiku 5.5 (documentación de Anthropic, leída por el arquitecto el 19/10):
  `temperature` sólo 1 o nada; `top_p` sólo 0,99 o nada; `top_k`, siempre rechazado;
  `temperature` y `top_p` juntos, rechazado; el prefill de asistente, rechazado; `thinking` en su
  forma vieja, rechazado; y en `max_tokens` cuentan los tokens de pensamiento. Lo que se hizo:
  - **con Haiku 5.5 el juez NO manda `temperature`**; con Haiku 4.5 sigue mandando 0,1 como siempre
    (`sinTemperatura` en el cliente; la prueba del cuerpo vigila las dos mitades);
  - `top_p`, `top_k` y `thinking`: **el cliente no los manda en ninguna ruta** (comprobado por Code);
  - el sufijo JSON de `callAnthropicJson` **no es un prefill**: va pegado al turno del usuario, y el
    juez no pasa `messages` (comprobado por Code);
  - **`max_tokens` a 16.000 con 5.5**, 4.096 con 4.5, y **los tokens de salida de cada llamada del
    juez quedan en `lecturaDeLasParejas[].tokensDeSalida`**, para saber si el pensamiento se dispara;
  - `thinking` sin poner.
  ⚠️ Y deja un **confundido declarado** en la prueba: 4.5 a temperatura 0,1 contra 5.5 sin ella
  (`claude/Predicciones_F128_El_Modelo_Del_Juez.md`).

**CAMBIA el 19/10 (arquitecto, a instancia del director): la prueba se hace AHORA.** La condición de
«después del primer cliente» era para no trastear un servicio en uso, y no hay servicio en uso; aquí
no hay nada que decidir, hay algo que medir. A Fable se le manda con el resultado dentro.
Predicciones escritas antes: `claude/Predicciones_F128_El_Modelo_Del_Juez.md`. **Esto NO abre la
puerta a las fichas por afirmación (3.1.7)**, que siguen sin tocar.

### 3.2 · El caso de empalme falso sembrado · F-125, confirmado en F-126
Control **positivo** de (B): dos fragmentos literales que, pegados, afirman algo que ninguna de las
dos frases reales afirma. Sin él, los ceros de `juez.recompuestas_bloqueadas_al_reclasificar` y
`juez.recompuestas_sin_contexto_del_resto` son **ceros de población**, no pruebas.
Se siembra fuera de una medición en curso, nunca en medio de una.

### 3.3 · Fase 2 = F-119 · F-123 · ⚠️ DICTAMINADA SIN COMMIT
El frente más antiguo abierto, y Fable lo señaló en la cabecera de F-126 por la regla de los 7 días.
Recortada por F-123 a cuatro movimientos con medida en sombra. **Dictaminada y sin empezar.** Fable
la contaba con 13 días sin commit el 13/10 por su regla de los 7 días; la cuenta la lleva él, aquí
no se guarda un número que envejece.

### 3.4 · «Norma contra práctica» · F-125
Extender la definición de contradicción. En espera **por decisión del arquitecto, contra la
recomendación de Fable**, con la condición de que fuera después de medir (B). **(B) ya está medida,
así que esta condición se ha cumplido y queda desbloqueada.** Commit propio.

### 3.5 · «Si no puedes copiar una frase literal, no emitas» · F-121 P7, reafirmado en F-126
Fable la señaló como un acoplamiento entre emisión y copia y sigue pensando que está mal, pero
pidió no mezclarla con el cambio de F-126. **Se mide sola, después.** Hoy ya se puede.

### 3.6 · Fase 3.2, el verificador ciego · F-123 / F-125
Sin construir. ⚠️ **Aviso de registro**: el verificador que confirma hoy los hallazgos **no es
ciego** —es `verifyFindings` con Haiku, y confirma «por juicio»—. El arquitecto lo llamó ciego dos
veces el 13/10 y era falso; está corregido en la precisión 4 del archivo de F-126.

### 3.7 · Fase 3.3, la segunda vuelta · F-123 / F-125
Sin construir.

### 3.8 · Fase 3.4, la vía 2: los punteros · F-125 · ✅ CERRADA EL 16/10/2026
**CERRADA el 16/10/2026.** Su condición de activación, la regla de cierre de F-126, era que LUGAR
no llegara a 5 de 7; el 14/10 dio **7 de 7**. Queda en pie, como **condición de reapertura**, el
disparador nuevo que se escribió el 14/10 (abajo). Lo que sigue es el texto del 14/10, sin tocar.

Que el juez **señale en vez de copiar** —devuelva un localizador y la máquina extraiga la frase—.
`unidades-de-cita.ts` está construido desde el 09/10 (corregido el 19/10: aquí decía 08/10; git lo da en
`3816c501`) y sin conectar, y eso no cuesta nada.
El disparador de F-126 era «si LUGAR no llega a 5 de 7»; llegó a 7, **así que NO se activa**.
No ganan velocidad ni coste de forma apreciable: lo que cuesta es leer los dos documentos. Ganan
otra cosa: **eliminan la transcripción como clase de fallo para cualquier documento**, mientras lo
de hoy es un arreglo comprobado en tres casos de una pareja.
**DISPARADOR DE REAPERTURA, REESCRITO EL 19/10/2026** (arquitecto, al ver que la redacción del 14/10
se podía leer al pie de la letra y dejar fuera NOR-11): **«La 3.4 se reabre la primera vez que el juez
deje de copiar literal en una medición con verdad sembrada, en cualquier documento y con cualquier
modelo: o porque una trampa no se publique porque la cita no fuera literal, o porque cualquiera de los
seis contadores de la puerta deje de ser cero. El documento donde ocurra es indiferente; lo que
dispara es que el juez deje de copiar.»**

~~**Disparador nuevo, escrito el 14/10:** la primera vez que un caso sembrado falle en **otro**
documento porque el juez no copió, se activa la 3.4.~~

### 3.9 · La segunda llamada dirigida para la omisión · F-124
«La ausencia de evidencia es ausencia de cita» → segunda llamada que pida las dos citas, y de ahí a
la puerta; nunca publicar prosa del juez. Decidido y **sin construir**. Su urgencia ha bajado:
NEGACIÓN se publica 7 de 7 desde la fase 1.0.

### 3.10 · La guarda 1.1 del rerank · F-124
Archivada **con condición de reapertura**. No se toca hasta que la condición se cumpla.

### 3.11 · Acotar la salida del juez por construcción · B.366, medido el 09/10
Con dos documentos casi duplicados el juez escribió **22 solapamientos** pese al «máximo 10» del
prompt, y **48 entradas en `uniqueToNewDoc`**, que entonces no tenía tope. El tope de la caja se
puso en la fase 1.0; el de los solapamientos sigue sin cumplirse.

### 3.12 · Por qué el juez es exhaustivo unas veces y mínimo otras · B.357, punto 5
Era el frente principal: cinco pasadas idénticas el 07/10, sólo la primera emitió las tres.
**F-126 parece haberlo resuelto para esta pareja**: las siete pasadas del 14/10 dan la misma salida
con las mismas citas. Queda abierto para otras parejas, y es parte de lo que mide 3.1.

### 3.13 · Lo que falta de la fase 1.0 · F-124
El tope de la caja EN CÓDIGO, no sólo en el prompt; el consumidor, que es enseñar «sólo en el
nuevo» en pantalla; y el contador. En F-125 el rescate se archivó y quedó sólo el contador-alarma
`caja_con_candidato`, que tampoco está construido: ni él ni `rescatadas_de_caja` aparecen en
`lib/`. Decidido en F-124 y sin construir.

### 3.14 · El estado real de la fase 0 · F-123 · comprobado por Code el 16/10 (F-127 P9.7)
No era el que creíamos: el «0.2, 0.3 y 0.4 en curso» de `claude/Estado_Del_MVP.md:13449` no tiene
código detrás.
- **0.1, los restos fuera**: HECHA el 11/10 (`SQL_F123_05`).
- **0.2, los contadores de los topes ciegos**: **SIN EMPEZAR**. Ningún commit de código la
  construye. Lo que ya se guardaba de antes: los caracteres de cada lado desde B.295 (29/09) y la
  cobertura de candidatos y lo que eligió el rerank desde el 16/09. **Lo que no existe es guardar
  los ids de los fragmentos mostrados.**
- **0.3, la línea base**: **HECHA A MEDIAS**. Cinco pasadas de NOR-11 el 11/10, sin las de CLI-12 ni
  CLI-13 que pedía F-123; consta en el commit de documentación `5e3cc853`, y los logs no se
  archivaron.
- **0.4, la comparación de entradas**: **NO SE PUEDE HACER COMO SE DISEÑÓ.** Las pasadas del 11/10
  emitieron todas sólo PLAZO, así que no hay pasadas buenas con las que comparar. Lo que sí consta
  es que las entradas fueron idénticas y la omisión la misma las cinco veces
  (`claude/Hallazgo_LUGAR_en_uniqueToNewDoc.md`), y que desde la fase 1.0 NEGACIÓN se publica 7 de 7.
  **Queda pendiente de REDISEÑAR o de CANCELAR formalmente**; lo que no puede quedar es como
  «pendiente» a secas.

---

## 4. Lo que hoy NO se puede medir, y por qué

Del inventario de Code (14/10), sobre las copias locales y el último censo del corpus (10/10):

- **OPE-14 ↔ OPE-11**: OPE-14 no está en `corpus-pruebas/` ni en el censo. No se puede.
- **OPE-15 ↔ OPE-11**: OPE-15 está en local pero no en la aplicación. Exige subirlo.
- **Los pares de `SIEMBRA_falsos_de_agosto.md`** (MKT-01↔RRHH-05, RRHH-04↔RRHH-06, NOR-04↔OPE-01,
  OPE-01↔CLI-01): los siete documentos estaban `pendiente` el 10/10, así que ningún lado está en el
  corpus. Y CLI-01 está duplicado (B.373).
- **OPE-10 ↔ OPE-11** y **RRHH-08 ↔ OPE-13** sí son medibles, pero van por tablas: el primero por
  el diff determinista y el segundo citando filas. **Ninguno pone a prueba la regla nueva de la
  cita en prosa.**
- ⚠️ **El censo del corpus es del 10/10.** Saber qué hay hoy exige una consulta de sólo lectura que
  el arquitecto no ha autorizado todavía. Code se paró ahí, y bien.
- RRHH-08 se llama distinto en la aplicación —**«RRHH-08 .xlsx»**, con un espacio antes del punto—
  que en la copia local (`RRHH-08_asignacion-de-guardias.xlsx`), y no está comprobado que su
  contenido sea el de la copia local.

---

## 5. Deuda técnica anotada, con su origen

| deuda | de dónde sale |
|---|---|
| `pipeline.ts` pasa de 1.515 líneas y hay que partirlo, en su propio commit | fase 3.1, excepción consciente del 13/10 |
| Un titular de menos de 25 caracteres se pega a la frase que titula, y la «frase real» sale con «## 6. Retirada» delante | fase 3.1, commit 2 |
| El solape entre trozos: una frase puede estar en dos trozos y el tramo se atribuye a la copia donde cae | fase 3.1 |
| `normalize()` no quita las comillas tipográficas, ni `¿` ni `¡` | B.317 |
| Dos vectores sin documento en el namespace | B.375 |
| CLI-01 duplicado | B.373 |
| Defecto real de código sin evidencia de que haya ocurrido | B.374 |
| `formatos-con-tablas.test.ts` es inestable por tiempo de disco | conocida |
| Avisos de Next.js «Unsupported metadata viewport» | vistos el 14/10, inocuos |
| El SQL escrito antes del 13/10 no contempla `paso='recompuesta'` | F-126, commit 10 |
| `estado: 'cruza'` puede venir de una unión recompuesta, no sólo de una cita que cruza trozos | fase 3.1, commit 8 |
| El régimen que se llama «corte honesto» NO declara al juez el texto que le ha omitido. El prompt (`judge.ts:810-820`) mete el texto entre comillas triples con el nombre del documento y nada más; lo omitido queda sólo en la lectura guardada, y el aviso del log (`:1119`) sólo sale con la tijera vieja. F-118:323 ya había previsto declararlo. **El nombre promete algo que el código no hace** | F-127 P9.2, comprobado por Code el 16/10 |
| El prompt del juez no dice nada sobre texto truncado o incompleto. Lo único parecido es «OMISIÓN SIGNIFICATIVA» (`judge.ts:876`), que habla del contenido, no del recorte | F-127 P9.4 |
| `selectUnitsWithinBudget` acepta el presupuesto por parámetro (`retrieval.ts:1090-1100`, desde F-73) pero corre en `retrieval.ts:502`, ANTES del juez, cuando «lo que sobra» de la pareja todavía no se sabe, y sólo con los trozos que devolvió Pinecone, con el tope de 25 piezas. **El reparto nuevo no es recablear un parámetro: es mover dónde se decide** | F-127 P9.3 |
| HAY UN SEGUNDO ÷4 sin medir, en `lib/llm/anthropic-client.ts:322`: estima los tokens de entrada como la longitud del payload entre 4. Con 3.1.1 hecho se puede comprobar cuánto se equivoca | F-127, lectura de Code del 16/10 |
| La latencia por llamada no se mide en ningún sitio | F-127 P9.1 |
| `lib/pinecone/corpus-del-examen.test.ts` se suma a `formatos-con-tablas.test.ts` como prueba sensible al disco: se pasó de tiempo (15 s) en una vuelta y pasó entera en la siguiente | vista el 16/10 |
| **El salto de «Mejora con IA» coge la PRIMERA aparición de la cita, y con citas cortas puede ser la equivocada.** `goToProblem` (`components/ImprovementModal.tsx:318-336`) busca la cita del nuevo en el texto del editor con `findTolerant` (`lib/texto/localizar-cita.ts`) y selecciona la primera que encuentra: una cita literal, contigua, verificada y aceptada por la puerta puede llevar al párrafo equivocado si se repite. Es el mismo error que el arquitecto señaló de los punteros el 19/10: literal pero hablando de otra cosa. Lo mide el bloque 2c de `SQL_F128_01` y `SQL_F128_02`. **Si la medición dice que pasa, el arreglo no es alargar la cita: es que el hallazgo lleve la POSICIÓN y no sólo el texto** | lectura de Code del 19/10, a pregunta del arquitecto; medida con la tanda de F-128 |
| **El presupuesto del selector cuenta sólo el texto; las cabeceras de cada fragmento, unos 55 caracteres por trozo, van aparte.** Con trece trozos el bloque real se pasa unos 700 caracteres de lo que se le dio. El reparto del 3.1.3 tiene que contarlas o la ventana se desborda. Es el mismo vicio que se está arreglando: un presupuesto que no cuenta todo lo que entrega | simulación de P-F127-12, 19/10 |

---

## 6. Reglas de método vigentes, y de dónde vienen

1. **Las predicciones se escriben ANTES de medir, con nombre, y no se reescriben después.** Una que
   falla es información. (F-124 en adelante; hoy ha fallado la de la mediana y queda anotada.)
2. **El verde por commit incluye `tsc` sobre todo el proyecto, después de escribir las pruebas**,
   porque `next build` no comprueba los tipos de las pruebas. (13/10)
3. **Una prueba que lee «la última llamada» al modelo simulado puede pasar en falso.** Hay que
   exigir una llamada nueva antes de leer. (13/10, pasaba de verdad)
4. **Lo que se pierde en silencio se busca a propósito**: todo `?? null`, todo `catch` vacío, todo
   filtro que pueda no filtrar, todo `return` dentro de un bucle. (13/10)
5. **Un cero permanente es indistinguible de «no ocurrió»**: un contador necesita prueba de que su
   dato llega de punta a punta. (F-82, reafirmado el 13/10)
6. **Un ejemplo del prompt no puede contener la respuesta del caso que se va a medir.** (12/10, el
   caso Chamberí/Retiro)
7. **Las decisiones se atribuyen a quien las tomó y al día en que se tomaron.**
8. **El proyecto de Claude y el repositorio son dos sitios distintos.** Lo que sólo vive en el
   proyecto se pierde para Code y para git. (13/10, el fichero de B.357)
   **Operativa:** antes de escribir una ruta en cualquier cosa que vaya al repositorio, se comprueba
   que esa ruta existe EN EL REPOSITORIO. Una referencia a un fichero del proyecto de Claude dentro
   de un documento del repositorio es una referencia muerta, y Code la caza; el arquitecto la
   escribió tres veces el 14/10 antes de aprender a comprobarla.
   **Y la regla de qué se trae**: un documento se trae al repositorio si guarda evidencia o una
   medida que no existe en ningún otro sitio. Si su contenido ya está en el repositorio en otra
   forma, se REDIRIGE la referencia en vez de duplicarla, porque dos copias divergen.
9. **Una cita tiene que ser literal.** Un error de transcripción del arquitecto en la consulta
   F-126 («poner» por «usar») pasó al dictamen de Fable y de ahí al prompt del producto.
10. **No se abren frentes nuevos sobre algo ya decidido y sin construir**, y los frentes se cierran
    con un disparador escrito. (F-123 P5; F-126 cerró el de la puerta)
11. Un error de TRANSPORTE no es una corrección del documento. Si un pegado parte o altera un
    texto al traerlo al repositorio, se arregla la copia para que coincida con el original y se anota
    el incidente; lo que se añade debajo con su fecha es lo que corrige el CONTENIDO, no lo que
    arregla la COPIA. (14/10/2026, la línea del esquema de `uniqueToNewDoc`.)
12. **Una cifra medida pertenece a la pareja y a la dirección en la que se midió.** Citarla en otra
    es un error, aunque el número sea real. **El 15/10 es el primer caso documentado de esto
    exactamente**: el bloque de 3.206 es de CLI-13 ← NOR-10 y se usó para razonar sobre NOR-10 ←
    CLI-12, donde el bloque fue 2.857 en 8 de 8 pasadas. Error de los dos: Code lo conectó con la
    frase B en su informe del 14/10 sin decir que eran parejas distintas, y el arquitecto lo metió
    en la consulta F-127 (punto 2.4) sin comprobar de qué pareja venía. De ahí salió un párrafo
    falso en la consulta y una predicción de Fable apoyada en él.
    Pertenece a una familia más amplia —afirmar algo sin comprobar de dónde sale— que tiene cuatro
    casos anotados en este fichero: las tres rutas del proyecto de Claude citadas como si fueran
    del repositorio el 14/10 (regla 8) y la cita no literal «poner» por «usar» de la consulta F-126
    (regla 9). **Antes de usar una cifra: ¿de qué pareja, de qué dirección y de qué fecha es?**
    (16/10/2026)
