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
> **Actualizado otra vez el 19/10/2026, por la tarde**: **el 3.1.8 queda CERRADO, Haiku 5.5 se queda**
> (resolución del arquitecto, al final del 3.1.8); entra en la deuda la latencia del juez con 5.5. ⚠️ Las
> correcciones de esta misma tarde salieron fechadas «20/10»: **era un error de Code**, que dedujo la
> fecha en vez de leerla del reloj; son del 19/10 y así quedan escritas.

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

**EL EJEMPLO CANÓNICO DEL PROBLEMA, medido en producción** (tanda de F-128, 19/10/2026; bloque 1 de
`SQL_F128_02`, dos filas de la misma pasada): **en la misma pasada de NOR-10, el mismo documento
se lee hasta 37.143 caracteres frente a CLI-12 y hasta 30.183 frente a CLI-13**, porque el bloque del
otro documento mide 2.857 en un caso y 9.817 en el otro. **Siete mil caracteres de NOR-10 existen
para una comparación y no para la otra.** Es el mecanismo del barranco —el candidato que entra
entero se come el analizado— medido en producción y no en simulación. (Precisión de Code: el
barranco en sentido estricto, subir el presupuesto y leer menos, sigue sin observarse, porque en
producción sólo ha existido P = 40.000; lo que se ve aquí es el mecanismo que lo produce, como
decía la consulta de F-127 en su 2.3.)

#### 3.1.1 · Registrar tokens por llamada · F-127 P7 paso 1 y P9.1 · ~~SIN EMPEZAR~~ · EN CURSO desde el 21/10: pasos 2 a 4 hechos y el 4 cerrado en producción; paso 5 escrito, pendiente de leer
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
**EL PLAN, aprobado por el arquitecto el 20/10, en cinco pasos:** (1) censo por capacidad de quién
llama al modelo; (2) medir cada petición real sin cambiar lo que se manda; (3) etiquetar las etapas
del análisis; (4) guardarlo; (5) el medidor, en SQL probado en PGlite y con arnés.
- **Dónde se guarda: en el jsonb del análisis (opción B), no en una tabla.** **La razón, del
  arquitecto: todavía no sabemos qué queremos registrar, y el 19/10 se aprendió dos veces lo que
  cuesta fijar una forma antes de tiempo. El jsonb se cambia gratis; una tabla con datos dentro, no.**
  **Disparador para pasar a la tabla (opción A, `llm_calls`)**: cuando haga falta el coste POR
  USUARIO, o cuando haya que medir el chat y la mejora. Mientras sea sólo el análisis, el jsonb vale.
  **LOS DISPARADORES, en orden** (arquitecto, 21/10):
  1. **el coste por usuario** (deuda 2);
  2. **`/api/analyze-style`**, hallado por Code el 21/10 al leer qué etapas corren en cada modo: en el
     rápido, el estilo se compra por esa ruta, que **NO abre el registro**. Es una llamada al modelo que
     el usuario paga, que tarda, y que no queda registrada en ninguna parte. **No se arregla hoy, y la
     razón es arquitectónica**: el registro vive en el jsonb del análisis, y esa ruta no produce ningún
     análisis donde guardarlo (persiste un resultado de estilo aparte, como telemetría). Lo mismo vale
     para el chat y la mejora;
  y cualquiera de los dos basta para pasar a la tabla.
- **La unidad es la PETICIÓN REAL**, con el número de intento dentro, y la repetición por JSON mal
  formado como segunda «vuelta». Es la única que mide lo que cuestan los reintentos.
- **Sin tope, con guarda**: 200 peticiones con detalle; el censo da como mucho unas 57 llamadas por
  exhaustivo (~114 peticiones si todas repitieran), así que hoy no puede saltar. Si salta, el resto se
  agrega en `fueraDelDetalle`, que lo dice en el propio dato.
- **El paso 1, el censo** (21/10): un solo punto de salida en el producto,
  `lib/llm/anthropic-client.ts` (`callAnthropicRaw`). En el análisis lo usan seis etapas: rerank,
  juez (una llamada por candidato, hasta 25), verificador (⌈contradicciones/15⌉ por candidato),
  double-check (hasta 4), síntesis y estilo. Fuera del análisis, el chat, la mejora y el agente.
  **Cuáles corren en cada modo, leído en el código el 21/10** (`lib/analysis/pipeline.ts`), para quien
  lea una salida del registro y eche de menos una etapa:
  · **rerank, juez, verificador y síntesis: en los DOS modos**, dentro de `runCorePipeline`; el
    verificador sólo si hay contradicciones que verificar, y el juez una vez por candidato;
  · **double-check: SÓLO EN EL EXHAUSTIVO** (`doubleCheckContradictions`, llamado únicamente desde
    `runExhaustivePipelineInner`), y sólo si quedan contradicciones confirmadas POR JUICIO: las de
    estructura no se le mandan, y con ninguna no hace ninguna llamada;
  · **estilo: SÓLO EN EL EXHAUSTIVO** dentro del pipeline (`analyzeStyle`, en el `Promise.all` de
    `runExhaustivePipelineInner`). En el rápido el estilo se compra aparte por `/api/analyze-style`, y
    **esa ruta NO abre el registro por llamada**: sus llamadas no quedan registradas en ningún sitio.
  Ningún camino del rápido llama a ninguna de las dos: que falten en un análisis rápido es lo esperado.
- **El paso 2, hecho el 21/10** (`lib/observability/registro-de-llamadas.ts`): cada petición apunta
  etapa, pareja (un id), modelo, vuelta, intento, resultado, latencia y las cuatro cifras de tokens, y
  la estimación ÷4 donde se calcula. **Ni una palabra del contenido**, escrito en la cabecera del
  módulo y vigilado por una prueba. **La suma por modelo, intacta al lado**. **La petición a la API
  sale idéntica byte a byte** a la del cliente de antes, con y sin registro
  (`lib/llm/cuerpo-byte-a-byte.test.ts`). Nadie abre todavía el registro fuera de las pruebas:
  abrirlo y guardarlo es el paso 4.
- **OBJETIVO ESCRITO DEL PUNTO, no un extra (arquitecto, 20/10): que el medidor del paso 5 compare la
  estimación de entrada con lo que devuelve la API** — los dos ÷4 sin medir: el de
  **`callAnthropicJson`** (la estimación del limitador en los análisis) y el de
  **`callAnthropicAgent`**, los dos en `lib/llm/anthropic-client.ts` (líneas 371 y 462 el 21/10/2026,
  sólo como ayuda). El censo por capacidad (`/ 4` junto a tokens o longitudes en `lib`, `app` y
  `worker`) no encuentra ninguno más. El registro guarda la estimación en `entradaEstimada`.
- **La espera y el comienzo de cada petición** (arquitecto, 21/10): `esperaMs` —el limitador, el
  backoff entre intentos y la pausa antes de la vuelta 2— y `comienzoMs`. Con la espera, el reloj de
  pared de una llamada es la suma de `esperaMs + latenciaMs` de sus entradas; sin ella, 17 s de
  backoff dentro de un análisis de 43 serían invisibles, que es la deuda de la latencia del 19/10.
  Las llamadas de un análisis van en paralelo (el juez y el verificador de cinco en cinco, el estilo a
  la vez), así que su duración no es la suma: sale de `comienzoMs`. **La suma da el trabajo; el
  comienzo da la duración.**
- **Sólo en el runtime de Node** (`AsyncLocalStorage`), comprobado el 21/10: ninguna ruta de `app/`
  declara Edge, `middleware.ts` no importa el cliente y el worker corre en Node. Escrito como condición
  en la cabecera de `registro-de-llamadas.ts`.
- **El paso 3, hecho el 21/10: las seis etapas del análisis, etiquetadas** —rerank, juez (con su
  pareja, por id), verificador, double-check, síntesis y estilo—. **El control de que no falta ninguna**:
  hasta que el paso 4 guarde el registro no hay análisis real que diga «sin_etapa = 0», así que hoy lo
  vigila un censo por capacidad (`lib/analysis/etiquetas-de-llamada.test.ts`): toda llamada al cliente
  en `lib/analysis/` lleva etiqueta, son exactamente las seis, y las de fuera sin etiqueta (el chat dos
  veces, la mejora y el agente) están en una lista cerrada. El censo corrigió a Code el mismo día: la
  llamada del agente está en `lib/agent/runner-conv.ts`, no en `llm-call.ts`, que sólo la reexporta.
  **El control de verdad llega con el paso 4**: el primer análisis guardado tiene que dar `sinEtapa: 0`.
- **El paso 4, hecho el 21/10: el registro se abre en las dos entradas del pipeline**
  (`runAnalysisPipeline` y `runExhaustiveAnalysisPipeline`, `lib/analysis/pipeline.ts`), envolviendo el
  contexto de fallos de etapa como éste ya se abría allí, y viaja en el resultado como
  `llamadasAlModelo`: al jsonb de `analysis_results` por `saveAnalysisResult`, que guarda el objeto
  entero. Cubre de una vez el rápido de `analyze-v2`, el exhaustivo del worker y el examen.
  ~~**No va al navegador**: la respuesta de `analyze-v2` lleva una lista cerrada de campos y éste no
  está en ella.~~ **Corregido por Code el mismo 21/10, abierto el consumidor antes del push: SÍ llega
  al navegador, por la bandeja.** La respuesta de `analyze-v2` no lo lleva (lista cerrada de campos),
  pero `app/api/analysis-results/[id]` y `app/api/documents/[id]/analysis` devuelven el jsonb
  `analysis` entero, igual que ya hacían con `lecturaDeLasParejas`. Lo que viaja son números,
  etapas, modelos e ids de documentos de la propia organización —nada de contenido—, y sólo a quien
  ya puede abrir ese análisis. El mensaje del commit `e61dac5b` dice «no va al navegador» y es falso.
  Un duplicado exacto no llama al modelo y sale sin registro.
  - **El cableado lo vigila** `lib/analysis/registro-en-el-pipeline.test.ts` (las dos entradas lo abren
    y lo devuelven); el pipeline entero no se puede ejecutar en la suite.
  - **EL CONTROL QUE CIERRA EL PASO 4, PENDIENTE DEL DIRECTOR**: tras el despliegue, un análisis rápido y
    leer `SQL_311_01_control_del_registro_por_llamada.sql` con DESDE un minuto antes. Tiene que salir
    `sinEtapa = 0`, todas las peticiones con una de las seis etapas y el juez con su pareja. Probado en
    PGlite (`claude/arneses/f311/`): cada control cae donde debe y sin registro sale NO APLICA.
  - ✅ **CERRADO EL 21/10 EN PRODUCCIÓN** (salida del director): un análisis rápido de NOR-11 (21/10
    14:01:57) con **`sinEtapa = 0`**, 5 peticiones con detalle y ninguna fuera, cuatro etapas (juez 2,
    rerank 1, verificador 1, síntesis 1) y el juez con su pareja en las dos. Faltan `estilo` y
    `double_check`, y es lo esperado: sólo corren en el exhaustivo (ver el censo, arriba). ⚠️ El control
    prueba que toda petición que ocurrió lleva etiqueta, no que ocurrieran todas las etapas que debían.
  - **PRIMER DATO, con cautela: un análisis no es una muestra.** En ese análisis, **cero intentos de
    más y cero repeticiones por JSON** en las cinco peticiones. Si eso se sostiene, los 31-43 s de la
    deuda del 19/10 (la latencia del juez con Haiku 5.5) son el modelo pensando y no backoff. Cuánto es
    petición y cuánto espera lo dirá `SQL_311_02`.
- **El paso 5, escrito el 21/10: `SQL_311_02_el_medidor_por_llamada.sql`** (PENDIENTE DE EJECUTAR, sólo
  SELECT, sólo la organización del piloto). Por análisis, por etapa y por petición: las cuatro cifras y
  la latencia; **los dos ÷4, la estimada contra la real** —la real es entrada más caché, porque
  `input_tokens` no incluye lo cacheado—; el coste por etapa y su porcentaje; la caché y su ahorro de
  verdad; la DURACIÓN al lado del TRABAJO; y el reparto entre petición y espera. Su tabla de precios es
  una copia de `llm-pricing.ts` y **el arnés comprueba que coinciden**. Probado en PGlite
  (`claude/arneses/f311/sql-311-02-medidor.test.ts`) con un análisis de cifras calculadas a mano; once
  mutantes, uno por control y uno por cálculo, los once en rojo.
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

**EL CASO QUE LO PRUEBA, medido en la tanda de F-128 (19/10/2026; bloques 4 y 7 de `SQL_F128_02`)**:
el corte de NOR-10 frente a CLI-12 cae en **37.143, dentro del trozo 36**, y el último límite de trozo
anterior es **36.483**. La frase sembrada B empieza después: su dato, «semanalmente, todos los
lunes», en **36.599** (bloque 4), y la frase entera un poco antes, hacia el 36.553. **Retroceder al
límite anterior dejaría B fuera; avanzar al final del trozo la conserva.** Por eso el 3.1.2 avanza y
no retrocede.

**REQUISITO NUEVO, del 19/10 (tanda de F-128): LA CITA TIENE QUE LLEVAR EL SUJETO.** En NOR-10 con
Haiku 5.5 el juez publicó contradicciones cuyas citas del lado nuevo son fragmentos sin sujeto
—«quien autoriza cualquier excepción documentada al procedimiento», «la firma de los registros de
auditoría trimestral»—, y contra «El Coordinador de Calidad es quien autoriza…» esas citas no dejan
ver dónde está el desacuerdo. Contesta la pregunta del director del 19/10 sobre si la cita necesita
llevar el sujeto: **la necesita.** Lo que se entregue al juez, y lo que se le pida citar, tiene que
permitir una cita con sujeto.
**ACOTADO EL 20/10 (arquitecto), con las salidas reales de la tanda: LA REGLA ES «SI EL DATO EN
DISPUTA ES EL SUJETO, LA CITA TIENE QUE EMPEZAR EN EL SUJETO».** El defecto no es general:
- **en NOR-11 las dos columnas coinciden en 42 de 42 citas** (las 21 contradicciones de la tanda de
  Haiku 5.5, dos citas cada una; y las 21 de la línea base del 14/10, también), porque el dato en
  disputa —72 horas, Chamberí, el contenedor— va en el PREDICADO, y el juez cita el predicado;
- **en la contradicción del cargo el dato ES EL SUJETO de la frase** («Es el Director Clínico quien…»,
  «El Coordinador de Calidad es quien…»), y es justo lo que el juez recorta: las ocho A de NOR-10 de
  la tanda y las tres de la línea base salen OTRA por la cita y A por la frase.
Lo que el 3.1.2 tiene que cumplir, entonces, no es «toda cita lleva sujeto», sino eso: cuando lo que
se contradice es quién, la cita empieza en quién.

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
**Motivo adicional, del 19/10 (tanda de F-128)**: una ficha guarda el sujeto junto al dato
(«autoclave, temperatura, 134 °C…»). Con citas sin sujeto —las de NOR-10 con Haiku 5.5, en el 3.1.2—
el usuario no ve dónde está el desacuerdo; con fichas, el sujeto viaja con el dato por construcción.

#### 3.1.8 · El modelo del juez · arquitecto, 19/10 · ~~NUEVO · SIN EMPEZAR Y SIN DECIDIR~~ · ✅ CERRADO EL 19/10/2026: HAIKU 5.5 SE QUEDA
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

**LO QUE DIO LA TANDA DE F-128 (19/10/2026)**, leída con `SQL_F128_01` y `SQL_F128_02` (lectura del
arquitecto; la calificación de las predicciones va aparte):
- **NOR-11: en cuatro de las siete pasadas con Haiku 5.5 el marcador fue 2/3, no 3/3.** La tercera
  especie salió OTRA: el juez citó del documento nuevo «En ningún caso se depositan en el contenedor
  negro de zona común, que está reservado exclusivamente a los residuos asimilables a urbanos del
  grupo I», ~~que habla de otro contenedor, en vez de la frase de la bolsa amarilla~~. El lado existente
  sí era el sembrado. **La línea base del 14/10, releída con el mismo clasificador nuevo, da 3/3 en
  las siete**~~**: la comparación es válida y la caída es real.**~~ *(Tachado el 19/10 por la tarde: no
  hubo caída; ver la resolución, al final del 3.1.8.)*
  - ⚠️ *Precisión de Code (19/10/2026), leído el texto de NOR-11 y el registro de siembra antes de
    opinar, como pidió el arquitecto*: esa frase **es la mitad negativa de la trampa sembrada**, no
    otro contenedor. El registro (`corpus-pruebas/SIEMBRA_caso_control.md`, Contradicción 3)
    define la Versión 1 de NEGACIÓN como el apartado 10.2 de NOR-11: «Los residuos del grupo III se
    depositan siempre en el contenedor o bolsa de color amarillo descrito en el apartado 3.3. **En
    ningún caso se depositan en el contenedor negro** de zona común, que está reservado
    exclusivamente a los residuos asimilables a urbanos del grupo I. Introducir material
    biosanitario especial en el contenedor negro constituye una infracción del protocolo.» El sujeto
    de la frase citada es «los residuos del grupo III», que va en la frase anterior. **Por el
    registro de siembra, esas cuatro son NEGACIÓN**; el clasificador las da OTRA porque exige
    «amarill-» en la cita del nuevo, y la frase negativa no lo lleva. ~~Pendiente de la decisión del
    arquitecto (el par de datos de NEGACIÓN, punto 4 del encargo del 20/10).~~ **Verificado por el
    arquitecto en el registro de siembra y decidido el 19/10**: el par de NEGACIÓN sigue el registro, y
    el medidor lo lleva desde `841c50c6`.
- ~~**NOR-10: las tres frases sembradas A, B y D entraron enteras en lo entregado** (bloque 4: dentro,
  dentro, dentro; C fuera, como debe) **y el juez no publicó ninguna.** Publicó otras tres, con citas
  del lado nuevo sin sujeto (el requisito nuevo del 3.1.2).~~
  - **CORREGIDO EL 19/10/2026 (arquitecto): la interpretación de las nueve OTRA de NOR-10 era
    equivocada.** Lo que de verdad pasó: **las tres contradicciones que publicó Haiku 5.5 en NOR-10
    SON la contradicción A.** El registro de siembra (`corpus-pruebas/SIEMBRA_corpus_ampliado.md`,
    §1, «Naturaleza del conflicto» de A) dice que A se manifiesta «en el mismo tipo de decisión
    (autorizar excepciones, firmar auditorías, retirar un autoclave de servicio)», y ésas son
    exactamente las tres publicadas, en ese orden. En NOR-10 2.1 el sujeto es «el Director Clínico»
    y en CLI-12 3.1, «el Coordinador de Calidad». **Haiku 5.5 encontró A tres veces, desglosada;
    Haiku 4.5 la publicaba una vez. En NOR-10, 5.5 detecta MEJOR, no peor.** El clasificador tiene
    razón al decir OTRA, porque la cita no lleva el cargo; lo que estaba mal era la conclusión.
    (Las frases completas sí lo llevan, leídas por Code el 19/10: «Es el Director Clínico quien…,
    quien autoriza cualquier excepción documentada al procedimiento…» y «El Director Clínico puede
    delegar…, pero la responsabilidad última —incluida la firma de los registros de auditoría
    trimestral…— no es delegable y recae siempre sobre esta figura».)
  - **B entró entera por el lado de NOR-10 y no se publicó porque su pareja está en el apartado 12.1
    de CLI-12, y de CLI-12 sólo llegaron tres trozos**: el **0**, la portada del documento (título,
    versión, fecha, ámbito de aplicación); el **4**, «3. Responsables y organigrama de calidad» —el
    final del 3.1, con el párrafo del Coordinador de Calidad que autoriza excepciones, firma las
    auditorías y retira el autoclave, el 3.2 entero y el título del 3.3—; y el **45**, «14. Revisión
    por la dirección» (14.1, 14.2 y el título del 14.3). Todas las citas del existente salen del
    trozo 4. **Es el cuello del candidato, no un fallo del juez.**
  - **C fuera**, como debe. **D no publicada y sin explicación: PENDIENTE.**
- **El mismo documento, leído hasta 37.143 frente a CLI-12 y hasta 30.183 frente a CLI-13** en la
  misma pasada: el ejemplo canónico de la entrada del 3.1.

~~**⚠️ EL CRITERIO DE REVERSIÓN SE HA DISPARADO (20/10/2026): NEGACIÓN en 3 de 7** en NOR-11, con el
clasificador por dato. Las dos lecturas, del arquitecto: **en NOR-11 la caída parece real; en
NOR-10 el modelo mejoró** (A tres veces, desglosada). **El arquitecto recomienda al director volver
a Haiku 4.5 por disciplina; la decisión es del director**, y se anotará aquí cuando la comunique.~~
*(Tachado el 19/10 por la tarde, y la fecha era 19/10, no 20/10: ver la resolución, justo debajo.)*
- ⚠️ *Precisión de Code (19/10)*: el «3 de 7» es por la cita. Si las cuatro OTRA son la frase
  negativa sembrada del 10.2 (ver la precisión del primer punto), **por el registro de siembra
  NEGACIÓN sale 7 de 7** y el criterio no se habría disparado. Es justo la distinción que pide el
  punto 4 del encargo del 19/10 —la especie por la cita y la especie por la frase o el registro—, y
  conviene tenerla antes de decidir.

**✅ RESOLUCIÓN DE F-128 (arquitecto, 19/10/2026, por la tarde), que corrige lo anotado esta tarde sin
borrarlo:**
- **El criterio de reversión NO se disparó.** Las tres trampas de NOR-11 se publicaron **7 de 7** por
  el registro de siembra: el arquitecto lo verificó en `corpus-pruebas/SIEMBRA_caso_control.md`, donde
  la Versión 1 de NEGACIÓN lleva en negrita «En ningún caso se depositan en el contenedor negro», que
  es la frase que citó Haiku 5.5.
- **Las cuatro OTRA de NOR-11 son NEGACIÓN citada por su mitad negativa, que es la sembrada.**
- **Las nueve OTRA de NOR-10 son la A desglosada** (autorizar excepciones, firmar auditorías, retirar
  el autoclave). *(Corregido el 20/10 con la salida real: son OCHO A, publicadas 4/3/2 —la pasada 3
  publicó dos—, y la novena es la de CLI-13, que no es A; ver la conclusión, abajo.)*
- **Trece de trece OTRA eran correctas: el defecto medido hoy es del clasificador, no del juez.**
  *(Corregido el 20/10: doce de trece, las cuatro NEGACIÓN y las ocho A; la decimotercera, pendiente
  de leer.)* La
  segunda columna del medidor (`841c50c6`) existe por esto.
  - ⚠️ *Precisión de Code (19/10), medido en PGlite con el texto real*: con la segunda columna, las
    cuatro de NOR-11 salen NEGACIÓN por la cita y por la frase. **De las nueve de NOR-10, el medidor
    sólo reconoce seis por la frase**: la de las excepciones cae en «Es el Director Clínico quien…»,
    que lleva el cargo y no «responsab-», y sale OTRA también por la frase. Trece de trece son
    correctas por el registro; el medidor reconoce diez. Que el par de A siga el cargo del registro
    («Director Clínico» frente a «Coordinador de Calidad») queda ~~**PENDIENTE de decisión del
    arquitecto**~~ ~~**DECIDIDO el 19/10 (arquitecto) y hecho**: el par de A es el cargo~~, y con él las
    trece salen por la frase y la de las excepciones sigue OTRA por la cita (hallazgo bueno, cita
    mala). ~~Y sube a regla del medidor, escrita en la cabecera de los dos SQL: **el par de cada
    especie se toma de los valores que declara el registro de siembra, nunca de una palabra elegida
    a ojo.**~~ ~~Repasados contra el registro, siguen recortados a ojo LUGAR, el «amarill-» de NEGACIÓN,
    B y D; cambiarlos, PENDIENTE del arquitecto.~~ ⚠️ El cargo aparece 17 veces en NOR-10 y 33 en
    CLI-12, así que ~~**una A por la cita se lee antes de darla por buena**~~ (probado: dos citas que
    nombran los dos cargos sin hablar de lo mismo salen A). (Las tres A de la prueba se
    reconstruyeron de la descripción del arquitecto; las literales están en la salida del director,
    que Code no tiene.)
    **RECTIFICADO esa misma tarde (arquitecto, 19/10)**, por ese contraejemplo: **el par de A es el
    cargo Y la decisión**, las dos mitades del registro («…en el mismo tipo de decisión: autorizar
    excepciones, firmar auditorías, retirar un autoclave de servicio»). Code añadió una cuarta forma,
    «responsable último», que es la frase de la negrita del registro; sin ella, la frase sembrada y la
    A del 16/10 salen OTRA. Queda a decisión del arquitecto. Con eso, el contraejemplo sale OTRA en las
    dos columnas y las tres A de la tanda, OTRA por la cita y A por la frase. **Las reglas del medidor
    son ahora tres**, reescritas enteras en la cabecera de los dos SQL con los recuentos de cada
    término: (1) el par se toma de lo que declara el registro, ENTERO; (2) tiene que discriminar, y un
    término que sale más de dos o tres veces en su documento necesita la otra mitad; (3) un hallazgo
    correcto puede citar más de una frase, y el par acepta todas las formulaciones literales. **LUGAR**
    pasa al valor declarado («en la clínica de Chamberí» / «en la clínica de Retiro»), y la trampa de
    Chamberí se queda en el arnés con la expectativa invertida (OTRA en las dos). **NEGACIÓN** se
    queda con sus dos formas: la línea base del 14/10 citaba la afirmativa del 3.3 y Haiku 5.5 la
    negativa del 10.2, y las dos son correctas (hallazgo de Code). **B y D**, pendientes del mismo
    tratamiento.
- **Calificación de las predicciones** (`claude/Predicciones_F128_El_Modelo_Del_Juez.md`; cifras del
  arquitecto, sacadas de las salidas de `SQL_F128_01`, `SQL_F128_02` y `SQL_F127_02` que ejecutó el
  director, y que Code no ha visto):
  - **P-1, P-2, P-3 y P-4: ACERTADAS.**
  - **P-5: FALLADA.** La mediana de las citas no subió, bajó: **de 167 a 100 en NOR-11 y de 281 a 83
    en NOR-10.**
  - **P-6: FALLADA.** El coste por análisis bajó **de 0,04633 a 0,02280 $**, a la mitad y no a menos
    de la cuarta parte.
  - **P-7: FALLADA.** La latencia no bajó, subió: **de 19 s a entre 31 y 43 s.**
- **Decisión: Haiku 5.5 se queda. `ANALYSIS_JUDGE_MODEL` se deja puesto** (en Vercel, con el valor
  `claude-haiku-5-5`).
- **Los dos defectos que sobreviven:**
  1. **el sujeto en las contradicciones de cargo** (3.1.2): las citas de A en NOR-10 no llevan el
     cargo, y sin él el usuario no ve quién decide en cada documento;
  2. **la latencia**, que pasa a ser deuda nueva con su número (sección 5).
- **Con esto el 3.1.8 queda cerrado. Lo siguiente es el 3.1.1**, los tokens por llamada, que el
  arquitecto encarga aparte.

**PGLITE ENTRA COMO DEPENDENCIA DE DESARROLLO (arquitecto, 19/10/2026), y se rompe a sabiendas la
regla de «cero dependencias nuevas sin razón».** La razón, con sus palabras: **el medidor es lo que
falló cuatro veces el 19/10, y este arnés es lo único que lo vigila.** El arnés vive en
`claude/arneses/f128/`, prueba `SQL_F128_01` y `SQL_F128_02` contra una base Postgres en proceso
con el texto real de `corpus-pruebas/`, y corre en cada `npm test`. Las condiciones: ningún
fichero de producto la importa nunca, y lo vigila un censo
(`claude/arneses/pglite-fuera-del-producto.test.ts`, con control positivo: una sonda en `lib/` lo
pone en rojo); el alcance de vitest lo dice en sus dos sitios (`vitest.config.mts` y el §1-bis del
protocolo).

**✅ LA CONCLUSIÓN DE F-128 (arquitecto, 20/10/2026), con las tres salidas reales que ejecutó el
director** (`SQL_F128_01` con la tanda de NOR-11, y `SQL_F128_02` con la relectura del 16/10 y con
la tanda de NOR-10). Los controles salen limpios, el 0.9 sale NO APLICA en la relectura del 16/10, y
el arnés de `claude/arneses/f128/` reproduce las cifras exactas de las tres.
**LA CONTRADICCIÓN QUE HAIKU 4.5 PUBLICÓ EL 16/10 SALE OTRA POR LA CITA Y A POR LA FRASE, IGUAL QUE LAS
DE HAIKU 5.5.** Su cita, literal: «la responsabilidad última —incluida la firma de los registros de
auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un control
biológico— no es delegable y recae siempre sobre esta figura». **222 caracteres sin el cargo.** **EL
DEFECTO DE LA CITA SIN SUJETO NO LO INTRODUJO HAIKU 5.5: estaba con 4.5, y lo tapaba la longitud.**

| NOR-10 ← CLI-12 | Haiku 4.5, 16/10 | Haiku 5.5, 19/10 |
|---|---|---|
| contradicciones publicadas por pasada | 1 / 1 / 1 | 4 / 3 / 2 (una de las 4 es la de CLI-13) |
| A publicadas | 3 (una por pasada) | 8 (3 / 3 / 2) |
| por la cita | OTRA | OTRA |
| por la frase | A | A |
| mediana de las citas | 281 | 83 |

- **Por qué no se vio el 16/10**: el clasificador de entonces etiquetaba por el tema, y el tema decía
  «autoclave»; y una cita de 222 caracteres parece completa. La de 5.5 tiene 63 y se ve que le falta
  el sujeto. La cita de 4.5 tampoco lo llevaba.
- **El diagnóstico, acotado: está en el 3.1.2.** En NOR-11 las dos columnas coinciden en 42 de 42
  citas, porque el dato va en el predicado; en la A el dato es el sujeto, y es lo que se recorta.
- ~~**PENDIENTE DE LEER A MANO, sin juzgar todavía**~~ **ACIERTO REAL NO SEMBRADO** (arquitecto,
  20/10, con NOR-04 leído por Code): **el noveno de la tanda de NOR-10, el de CLI-13**, sale OTRA en
  las dos columnas. Es el único que no es A. NOR-10: «Queda fuera de alcance el material de un solo
  uso, que se rige por el protocolo NOR-04 de gestión de residuos sanitarios.» CLI-13: «…lo
  establecido en el protocolo NOR-11 de gestión de residuos sanitarios…». **NOR-10 cita el documento
  equivocado**, y dos veces: el protocolo de residuos es NOR-11 (su título interno, «NOR-11 · Gestión
  de Residuos Sanitarios»), y `NOR-04_plan-de-emergencia-y-evacuacion.pdf` se titula «Plan de
  Emergencia y Evacuación» y no habla de residuos. **Nadie lo sembró, y detectarlo es un acierto**:
  el segundo error real del corpus después de la D del 27/08. Anotado en
  `corpus-pruebas/SIEMBRA_corpus_ampliado.md`, §6, como la D. Es visible en NOR-10 ↔ CLI-13, que
  no cubre ningún registro de siembra.
  - Y la cuenta de la tanda de NOR-10 queda así: **nueve publicadas, nueve correctas**, ocho A y este.
    El medidor reconoce las ocho A por la frase; este sale OTRA porque no tiene especie en ningún
    registro.
- **Con esto F-128 queda cerrado del todo.** Lo siguiente, el 3.1.1.

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
| HAY UN SEGUNDO ÷4 sin medir, en ~~`lib/llm/anthropic-client.ts:322`~~ **`callAnthropicJson` y `callAnthropicAgent`** (`lib/llm/anthropic-client.ts`; líneas 371 y 462 el 21/10/2026, sólo como ayuda: la 322 ya no era ninguna de las dos): estima los tokens de entrada como la longitud del payload entre 4. Con 3.1.1 hecho se puede comprobar cuánto se equivoca; es el objetivo escrito del paso 5 | F-127, lectura de Code del 16/10 |
| La latencia por llamada no se mide en ningún sitio | F-127 P9.1 |
| **NADIE HA DECIDIDO QUÉ DEL JSONB DEL ANÁLISIS LLEGA AL NAVEGADOR.** Los dos endpoints de la bandeja, `app/api/analysis-results/[id]` y `app/api/documents/[id]/analysis`, devuelven el objeto `analysis` ENTERO; sólo la respuesta de `analyze-v2` lleva una lista cerrada de campos. Dos ejemplos de lo que ya viaja sin que nadie lo decidiera: (1) **el recorte del documento**: `lecturaDeLasParejas` le dice al cliente, en números, que de su documento de 66.801 caracteres el juez sólo leyó 37.143 y dejó fuera el resto; (2) **nuestros reintentos**: desde el 21/10, `llamadasAlModelo` añade las latencias, las esperas, los intentos y los estados HTTP de cada petición al modelo —un 429 nuestro, contado al cliente—. Ninguno lleva contenido y sólo los ve quien ya puede abrir ese análisis, así que **no se toca ahora** (arquitecto, 21/10). **Disparador: antes del primer cliente de pago** hay que decidir qué campos del jsonb salen al navegador y poner una lista cerrada en esos dos endpoints, como ya la tiene `analyze-v2` | lo cazó Code al abrir los consumidores del paso 4 del 3.1.1, 21/10 |
| **El censo de secretos del 21/10 dio CERO CLAVES en todo el historial, y eso NO es una garantía mayor de la que es.** Recorrió por patrón de credencial los diffs de los 1.758 commits (`git log --all -p`, 350.658 líneas, ficheros ya borrados incluidos) y los 1.758 mensajes, con control positivo (claves fabricadas de cada servicio, todas cazadas). **Lo que NO cubre:** (1) **los binarios** —`.docx`, `.pdf`, `.xlsx` del corpus—, porque sólo lee texto; (2) **el patrón genérico** (un valor literal asignado a un nombre con API_KEY, SECRET, TOKEN…) **sólo salta con valores de 20 caracteres o más**: una contraseña corta asignada a mano no la caza; (3) sólo mira lo que llega por ramas y etiquetas, no el reflog local, que es lo mismo que se publica. Tras el censo, el `.gitignore` cubre además los `.env` sin «.local», los `*.key` y los JSON de cuentas de servicio | censo de Code del 21/10, a pregunta del arquitecto |
| **De abril a agosto de 2026 el repositorio no tuvo `.gitignore`**: el primer commit es del 03/04/2026 (`8039ad95`) y el `.gitignore` nace el 19/08/2026 (`0f11e7c9`, «Añade .gitignore estándar de Next.js»). En esa ventana se tocaron 287 ficheros distintos y ninguno tiene nombre de entorno ni de credencial. **Por qué estamos tranquilos, y no es por el nombre de los ficheros**: el censo del 21/10 busca por PATRÓN de credencial en todos los diffs del historial, así que una clave pegada en cualquier fichero, se llamara como se llamara, habría salido; no salió ninguna. Con los límites de la entrada anterior | censo de Code del 21/10 |
| **`worker/package.json` declara `@anthropic-ai/sdk` y nadie lo importa.** El worker llama al modelo por el cliente propio (`lib/llm/anthropic-client.ts`, a través de `lib/analysis/pipeline.ts`); el censo por capacidad del 3.1.1 (`anthropic-ai/sdk` y `new Anthropic` en `worker/src`, `lib` y `app`) no encuentra ningún uso. Una dependencia que no se usa es superficie de ataque y peso de instalación por nada (arquitecto, 21/10). **Sin tocar** | visto por Code el 21/10 en el censo del 3.1.1 |
| **`lib/llm/anthropic-client.ts` tiene 518 líneas**, por encima del límite de 400 (481 antes del 3.1.1). **NO se parte ahora** (arquitecto, 21/10), y la razón: partir el cliente mientras se instrumenta invalidaría las seis referencias byte a byte de `lib/llm/cuerpo-byte-a-byte.test.ts`, que son lo que hace seguro el 3.1.1. **Disparador: después del paso 4**, cuando el registro esté guardándose y la prueba de cuerpo se pueda recapturar contra una versión estable | 3.1.1, paso 2 |
| **El tope del rerank en el exhaustivo: el código dice 25 y `CLAUDE.md` decía 10.** Los hechos, sin juzgarlos: `MAX_SELECTED_EXHAUSTIVE` (`lib/analysis/rerank.ts`) nació con 10 en `b5606c69` (04/05/2026, «Update rerank.ts») y pasó a **25** en `63cad1bd` (08/05/2026 12:04, «Increase MAX_SELECTED_EXHAUSTIVE limit to 25»): una línea, sin razón escrita, sin tocar documentación, dentro de una ráfaga de cuatro commits en tres minutos (12:03-12:05) el día que nació el worker de Railway. `CLAUDE.md` nació con el «10» en `e1895bfa` (19/05/2026), **once días después**, así que fue incorrecto desde el primer día (corregido el 21/10 para que no afirme un número; el valor intencionado sigue sin decidir). Y la casa sí lo sabía: `claude/Estado_Del_MVP.md` §5.40 (B.241) documenta el 25 desde el 16/09, y `:4297` registra un exhaustivo con 9 seleccionados. **Lo que queda sin decidir es si el valor que queremos es 25 o 10, y no se decide hoy.** **Disparador para retomarlo: la primera medición de un análisis exhaustivo con el registro por llamada del 3.1.1**, que dirá cuántas llamadas al juez hizo; no se ejecuta `SQL_A2A4_compuerta` ni se prepara otro recuento | historia de git sacada por Code el 21/10, a pregunta del arquitecto |
| **NINGÚN RECUENTO DE ESPECIES ANTERIOR AL 19/10/2026 ES DE FIAR.** Cinco de los siete pares estaban elegidos a ojo —LUGAR, NEGACIÓN, A, B y D— y producían tanto falsos fallos como falsos aciertos; y antes del 19/10 el clasificador, además, etiquetaba por tema. **Cuando se reabra F-119, o cualquier fase vieja, hay que releer sus análisis con el medidor de hoy antes de usar sus números.** Lo que dejaba pasar cada uno, medido por Code el 19/10 en PGlite con citas literales del texto del corpus (no contado en producción): **LUGAR** «chamberí» / «retiro» (3 y 3 apariciones) casaba la cabecera «Chamberí · Salamanca · Retiro», y por la frase «Si trabajas en Chamberí o Salamanca…», que acaba en «el personal de Retiro», salía LUGAR: falso acierto. **NEGACIÓN** con sólo «amarill-» dejaba en OTRA la negativa sembrada del 10.2: falso fallo, cuatro en la tanda. **A** con «responsab-» dejaba en OTRA también por la frase la de las excepciones (falso fallo) y daba A a una D citada por la segunda frase de NOR-10 2.4 contra el 3.5 (falso acierto); y con el cargo solo (`bae7ec0d`, unas horas), dos citas que nombran los dos cargos sin hablar de lo mismo salían A (falso acierto). **B** «semanal» (11) o «lunes» / «mensual» (14) daba B al test semanal de la cubeta contra los resultados que se consolidan mensualmente: falso acierto. **D** «recaer» / «nunca» (2) daba D a «puede recaer…» contra «nunca como mecanismo de control individual»: falso acierto | repaso de los pares contra el registro, 19/10; regla del medidor del arquitecto |
| **La latencia del análisis con el juez en Haiku 5.5: entre 31 y 43 s, frente a 19 s con Haiku 4.5.** La predicción era la contraria (P-7, fallada). Sin el 3.1.1 no se sabe cuánto es del juez y cuánto del resto, ni si pesa el pensamiento: los tokens de salida de cada pareja sí se guardan (`lecturaDeLasParejas[].tokensDeSalida`) | tanda de F-128, 19/10; cifras del arquitecto |
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
13. **Los punteros al código se dan POR NOMBRE, no por línea.** Fichero y función (o constante); el
    número de línea, si se da, va como ayuda y con la fecha en que se miró. Las líneas se mueven con
    cada commit y una deuda que cita líneas envejece mal: el 16/10 el arquitecto dio `:1339` por
    `:1337`, y el 21/10 los dos ÷4 que la deuda situaba en `anthropic-client.ts:322` (y un informe
    de Code en `:341`) estaban en otras líneas. (Arquitecto, 21/10/2026)
