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
> **Actualizado el 22/10/2026**: **el 3.1.3 queda HECHO Y MEDIDO** (tanda de once pasadas de NOR-11 y cinco
> de NOR-10); lo siguiente es el **3.1.2**. Entran el tercer y el cuarto hallazgo real no sembrados del corpus
> (el comité de calidad de la red, en `corpus-pruebas/SIEMBRA_corpus_ampliado.md` §7 y §8), la caché a cero
> en dieciséis análisis como justificación del 3.1.4, y el coste de las tres etapas en Haiku 4.5 (3.15 A).
> **Actualizado otra vez el 22/10/2026, por la tarde**: **el 3.1.3 y la ventana de 150.000 quedan CERRADOS**
> (tanda de cinco pasadas de NOR-10 y dos de NOR-11: A, B y C publicadas en NOR-10 ↔ CLI-12 por primera vez);
> **el caso D queda ABIERTO con nombre** (ver el 3.1.3); lo siguiente es la **3.1.2**. Se corrige la regla de
> conversión del prompt del juez (3.1.4): no es constante.

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
- **HECHO el 22/10**: la tanda del 3.1.3, medida y cerrada (ver el 3.1.3).
- **HECHO el 22/10**: `SQL_313_02_la_entrada_del_juez_contra_cli13.sql` dice **LA MISMA ENTRADA** (ver el 3.1.3).
- **HECHO el 22/10, por la tarde**: la ventana de 150.000, desplegada (`09cf63e5`), medida y CERRADA (ver el
  3.1.3). **ABIERTO con nombre**: el caso D. **Lo siguiente**: la 3.1.2.
- **HECHO el 23/10**: el dictamen de **F-129**, recibido y archivado con su consulta en
  `claude/consultas-fable/F-129_2026-10-23_una-permision-contra-un-principio.md`. Lo decidido, en el 3.4 (generalizado) y en el caso D. **Lo siguiente sigue
  siendo la 3.1.2, y antes su plan.**
- ~~**POR MANDAR (23/10)**: la consulta **F-129** a Fable sobre el caso D, escrita por el arquitecto en el proyecto
  de Claude (`claude/Consulta_Fable_F129_D_Una_Permision_Contra_Un_Principio.md`, que NO está en este
  repositorio); la manda el director. Pregunta si D está dentro o fuera de la definición de contradicción, si es
  especie propia o cabe en su 3.4, y si va antes o después de la 3.1.2. **No se construye nada del caso D hasta
  su dictamen.**~~ (mandada y contestada el 23/10)

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

#### 3.1.1 · Registrar tokens por llamada · F-127 P7 paso 1 y P9.1 · ~~SIN EMPEZAR~~ · ✅ HECHO EL 21/10/2026: los cinco pasos, y el medidor leído
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
- **✅ LA PRIMERA LECTURA DEL MEDIDOR, Y CIERRA EL 3.1.1** (21/10; cifras del arquitecto, leídas en la salida de `SQL_311_02` que ejecutó el director el 21/10 sobre el análisis rápido de NOR-11 de las 14:01; Code no ha visto esa salida). Un análisis no es una
  muestra, y las tres respuestas valen como primer dato:
  1. **LOS DOS ÷4: la estimación se queda CORTA, no larga.** Proporción estimada/real entre 0,635 y
     0,874, mediana 0,687; en suma, **26.420 estimados contra 38.538 reales** (el 68,5 %). El limitador
     de cuota trabaja con un margen un tercio más pequeño del que cree. Cero 429 y cero reintentos hoy,
     así que no muerde todavía. Causa probable, **SIN MEDIR**: `/4` supone cuatro caracteres por token,
     y el español escapado en JSON va más cerca de tres. Sigue en el pendiente C (3.15).
  2. **LA LATENCIA: 97,4 % en petición y 2,6 % en espera** (1.094 ms de espera en todo el análisis). **La
     hipótesis del backoff invisible queda ENTERRADA con datos.** El 77 % de la duración es UNA sola
     petición del juez: **27.718 ms escribiendo 7.144 tokens de salida**. Sigue en el pendiente B (3.15).
  3. **EL COSTE: verificador 31,6 %, juez 30,8 %, rerank 29,1 %, síntesis 8,5 %**, de 0,022045 $. El
     verificador cuesta más que el juez y el rerank casi lo mismo, porque los tres siguen en Haiku 4.5,
     diez veces más caro por token. Sigue en el pendiente A (3.15).
  4. **Y la caché, a cero y comprobado**: escrita 0, leída 0, ahorro 0 $.
⚠️ **El tope mensual de 35 $ hay que revisarlo con el coste bueno delante** (arquitecto, 19/10): cualquier cifra de coste
leída de `cost_usd` antes del arreglo es la cuarta parte de la real. Los «0,0045 $» por análisis de F-117 (`claude/consultas-fable/F-117.md:183`), que Fable usa en la adenda, no dicen de dónde salen; si salen de esa columna, son la cuarta parte.

#### 3.1.2 · El corte: avanzar al final del trozo, y declarar lo omitido · F-127 P3 y P7 paso 2, adenda Q3 · EN CURSO (23/10)
**EL PLAN, APROBADO por el arquitecto el 23/10**, en tres commits, cada uno con sus tres gates, sus mutantes y su
diff antes de subirlo:
  1. **el corte AVANZA al final del trozo en curso** (tope de 3.000; si el trozo pasa de eso, retrocede al
     límite anterior). Código, sólo en el corte honesto; la tijera vieja no se toca. Se prueba con la ventana
     de **40.000**, el caso medido de F-128 (corte en 37.143, dentro del trozo 36; límite anterior, 36.483; B
     hacia el 36.553).
  2. **se DECLARA al juez lo omitido**, con su tamaño, FUERA de las comillas del documento. Con la prueba de
     que el prompt sale byte a byte igual cuando no hay corte.
  3. **LA REGLA DEL SUJETO**, como EXCEPCIÓN AÑADIDA: sin tocar la frase de F-126 («puede empezar y acabar a
     mitad de frase…») ni su ejemplo, que son los que llevaron LUGAR a 7 de 7.
  **COMMIT 1 HECHO (`8a790652`, 23/10, aprobado por el arquitecto)**: el corte va a un límite de pieza; en el caso de
  40.000 pasa de 37.143 a 37.512, el final del trozo 36, y B queda entera dentro con la frase que el corte viejo
  partía. **La rama de la posición la añadió Code y el plan no la recogía** (arquitecto, 23/10): si no hay límite
  anterior —la primera pieza pasa de 3.000, una tabla grande al principio—, el corte se queda en la posición, porque
  retroceder dejaría el analizado vacío. Era un agujero del plan del arquitecto, y puede darse en producción.
  **COMMIT 2 HECHO (`5d8b160e`, 23/10, aprobado)**: el aviso de lo omitido, fuera de las comillas del documento, y el
  prompt byte a byte igual sin corte (cuatro huellas del código de `8a790652`). ⚠️ Con la corrección de Code: la
  razón de ponerlo fuera NO es que la puerta lo diera por literal —la puerta compara contra lo entregado del
  documento, y una cita de texto nuestro se rechaza y el hallazgo se pierde—, sino que el juez no lo tome por texto del
  cliente (protocolo).
  **COMMIT 3 HECHO (24/10, pendiente de aprobación)**: la regla del sujeto, en su propia línea (`EXCEPCION_DEL_SUJETO`,
  `lib/analysis/regla-del-sujeto.ts`) justo después del ejemplo de F-126, sin tocarlo; quitada esa línea, los cuatro
  prompts reales salen byte a byte los de `8a790652`. El ejemplo es de las bicicletas del club, no del corpus.
  **LOS TRES COMMITS SE SUBEN JUNTOS** cuando el arquitecto apruebe el 3, para que Vercel despliegue un estado
  coherente y la tanda mida la regla del sujeto y no un estado a medias. ✅ **Aprobado el 3 y SUBIDOS el 24/10**
  (`47a9d99f..90efcd41`, ocho commits).
  **El ejemplo neutro lo puso Code y el plan no lo recogía** (arquitecto, 24/10): un ejemplo con texto del corpus le
  enseñaría al juez la respuesta de lo que medimos; es la regla 6 del método (el caso Chamberí/Retiro del 12/10), y
  lleva una prueba que vigila que no tenga palabras del corpus. Es el segundo agujero del plan que cierra Code, tras la
  rama de la posición del commit 1.
  **LA TANDA DEL 3.1.2, escrita antes de medir: CINCO PASADAS DE NOR-10 Y CINCO DE NOR-11**, con las horas apuntadas,
  y las consultas con el ESPERADO rellenado después de mirar el reloj de la base. ⚠️ **Error del arquitecto, 24/10**:
  la había dado como cinco y dos. Dos valían cuando el cambio era la ventana, que no tocaba a NOR-11; la regla del
  sujeto entra en el prompt de TODAS las llamadas, así que NOR-11 deja de ser un control pasivo y pasa a ser una
  pareja en riesgo con sus tres trampas, y con dos pasadas el criterio «por debajo de 5 de 5» no se puede aplicar.
  **EL CRITERIO DE ABANDONO, escrito antes de medir (arquitecto)**: si PLAZO, NEGACIÓN, LUGAR, A, B o C baja de 5 de
  5, **se revierte el commit 3** (`90efcd41`). Y P-F129-a no se vuelve a medir: está refutada por la tanda del 22/10.
  **LA TANDA, HECHA el 24/10 de 19:06 a 19:17** (Madrid). Según los logs, seis pasadas de NOR-10 y cinco de NOR-11; **manda
  el reloj de la base, no esa cuenta**: el director ejecuta primero `SQL_313_01` con los esperados vacíos para leer la
  cuenta medida. **Lo que ya se ve en los logs** (lectura del arquitecto; Code no los ha visto): las tres trampas de
  NOR-11, 3 de 3 en las cinco pasadas, así que el criterio de abandono NO se dispara; y en NOR-10, A, B y C en todas.
  ⚠️ **LA REGLA DEL SUJETO NO SE HA CALIFICADO, y no se califica con los logs**: varios TEMAS empiezan por «Quién», y el
  tema no es la cita. La califican el bloque 2d de `SQL_F128_02` (por la propia cita; el 22/10, 15 de 28) y la
  mediana por especie de `SQL_F128_01`, o nadie.
  **Tres cosas de los logs, anotadas sin interpretar** (arquitecto): NOR-11 ↔ CLI-12 publica una contradicción en 4 de
  5 pasadas, «Revisión trimestral del cumplimiento por el Coordinador de Calidad», que el 22/10 salía en 2 de 11; un
  hallazgo nuevo confirmado, «Ámbito de los envases de material estéril usado», en NOR-11 ↔ CLI-13, que habrá que leer
  como se leyó el del comité; y un tercer `paso=normalizada`, en una cita de 135 caracteres.
  La tanda, sólo después del 3. **Al calificar, de las mitades del 3.1.2 SÓLO SE PUEDE CALIFICAR LA DEL SUJETO**:
  con la ventana de 150.000 ninguna pareja del corpus tiene corte, así que las del corte salen «NO APLICA: sin
  corte» y NO cuentan como aciertos.
  ⚠️ **ERROR DEL ARQUITECTO (23/10)**: su encargo pedía probar el corte con 80.000, «la ventana del caso medido»,
  y confundía el corte del ANALIZADO con el del CANDIDATO: con 80.000 el reparto le dio a NOR-10 sus 66.801 enteros
  y lo que se recortó fue el candidato. El corte del analizado sólo aparece en este corpus por debajo de unos
  70.000 (lo vio Code).
⚠️ **No arregla el caso D** (ver el caso abierto, después del 3.1.3): corrige cómo se cita lo que el juez ya
emitió, y D no se emitió.
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
**P-F129-a (Fable, 23/10), se califica en la tanda del 3.1.2**: con la pareja entera, los hallazgos sin sujeto
bajan del 29 % a MENOS DEL 10 % antes de que el 3.1.2 toque nada, porque la fragmentación de A era la causa. Si
no bajan, el 3.1.2 tiene su caso; si bajan, se mide igual pero vale menos.
**✗ REFUTADA, con la tanda del 22/10 (arquitecto, 23/10)**: el 29 % (8 de 28, 28,6 %) se midió YA con la pareja
entera y con el 3.1.2 sin tocar, que es exactamente la condición de la predicción, y 28,6 % no es «menos del 10 %»
(lo avisó Code). NO se lanza otra tanda para medir lo mismo. Se aplica la consecuencia que el propio Fable
escribió: **«si no bajan, el 3.1.2 tiene su caso»**. Va a la próxima consulta, para que Fable pueda objetar.

#### 3.1.3 · El interino: ventana con reparto monótono (80.000, y 150.000 desde el 22/10) · F-127 P4, P5 y P7 paso 3, adenda Q4 · CERRADO (22/10)
**MEDIDO el 22/10/2026**, con `SQL_313_01`, `SQL_F128_01`, `SQL_F128_02` y `SQL_311_02` sobre la tanda.
Cifras del arquitecto, leídas en las cuatro salidas que pegó el director y en los logs; Code no ha visto ni
unas ni otros. La medida completa está en el proyecto de Claude, `claude/Medida_F313_La_Ventana_Doble_22-10-2026.md`,
que NO está en este repositorio.
  · **La tanda fue de ONCE pasadas de NOR-11 y CINCO de NOR-10**, no de siete y tres. Los dos FALLA de
    `SQL_313_01` eran sólo el ESPERADO de la cabecera; de ahí la regla del protocolo «el ESPERADO de una
    consulta de tanda se rellena después de mirar el reloj de la base».
  · **Predicción NOR-11 ↔ CLI-12 a pareja entera: ACIERTA**, 11 de 11, con los 55 trozos y 55.135 de 55.135.
  · **Predicción NOR-11 ↔ CLI-13 sin cambio: ACIERTA.** Las tres trampas: 9 de 9 en la lectura de los
    logs, cuando se contaban nueve pasadas; la cifra sobre las once sale de `SQL_F128_01` y aquí no consta.
  · **Predicción de los 12 trozos de CLI-12 en NOR-10 (Code): ACIERTA**, 5 de 5, «resto 13199 de 80000,
    bloque ampliada, 12 trozos», con el analizado entero, 66.801 de 66.801, por primera vez.
  · **Predicción de latencia (arquitecto): FALLA**, y no se reinterpreta. NOR-11: mediana 34.163 ms
    contra la línea base de 36.128, el mismo reloj; el análisis NO tardó más. NOR-10: de unos 25 s a unos
    38 s, contra los totales de los logs del 19/10, que son otro reloj: indicativo. Lo que acertó fue su
    condición (el tiempo depende de si el juez escribe), no su titular.
  · **El manual entero no hizo ruido**: de las lecturas de los 55.135 caracteres de CLI-12 contra NOR-11
    salió UNA contradicción en 2 pasadas (cuenta sobre nueve, la de los logs), las dos sobre la revisión
    trimestral del Coordinador.
  · ~~**La mediana de las citas de NOR-11 baja de 167 a 107**, con tres citas de 33 caracteres de LUGAR. ES
    UNA PREGUNTA, NO UN HALLAZGO, hasta que `SQL_313_02` diga si la entrada del juez es la misma.~~
    **CERRADO el 22/10: ES MUESTREO, NO REGRESIÓN.** `SQL_313_02` dice LA MISMA ENTRADA: 14.580 tokens en la
    base del 21/10 y en las once de la tanda, caché a cero en las doce, el mismo modelo, y la salida de la base
    (7.144) dentro del rango de la tanda (cifras del arquitecto, de la salida del director; Code no la ha
    visto). Lo confirma el código (git diff `10deee06..aa29166b` de `judge.ts`: con la pareja entera el juez
    recibe lo mismo, y la plantilla no cambió).
  · ⚠️ **EL SILENCIO DE B, C y D NO ES DEL JUEZ: NO VIO LA OTRA MITAD.** Las cuatro frases de NOR-10 iban
    enteras en lo entregado, y sólo A se publicó. Las otras mitades están las tres en CLI-12
    (`SIEMBRA_corpus_ampliado.md` §1): B en el trozo 34 (y otra forma literal en el 38), C en el 51 y D en
    el 6. NINGUNO está entre los 12 de la selección ampliada (0, 4, 45, 5, 53, 49, 52, 14, 15, 35, 17, 24),
    sino en los 42.364 caracteres que quedaron fuera. ~~La mitad de CLI-12 de A está en el trozo 4, que sí
    entró: es el control, y es la única que se publicó.~~ ⚠️ **CORREGIDO el 22/10 por la tarde (lo señaló el
    arquitecto; lo comprobó Code)**: la FRASE SEMBRADA de A en CLI-12 («El responsable último de la
    esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director
    Clínico», 3.1) está en el **TROZO 3**, posición 3.785, que NO entró entre los doce. El trozo 4, que sí
    entró, lleva las tres decisiones del Coordinador («autoriza… firma… decide… la retirada»), y es lo que
    citaba A siempre. Code buscó A por «quien decide, con criterio técnico», que es la frase de las
    decisiones y no la sembrada. **En la tanda de 80.000 ni A se medía contra su pareja real**: no invalida lo
    escrito, pero cualquier relectura de esa tanda tiene que decirlo. ⚠️ Los índices de los 12 salen de la simulación con el
    orden del log del 16/10; la tanda sólo guarda la CUENTA (`trozosDelCandidato`), no qué trozos. Que
    coincidan la cuenta, el resto y los 12.771 caracteres lo hace muy probable, pero no está guardado. Es el
    límite declarado del interino, quedarse fuera por el ranking, medido ahora en las tres.
    ⚠️ **CORREGIDO por el arquitecto el 22/10**: «por el ranking, no por la ventana» es cierto CON 80.000 y falso
    como afirmación general. El ranking sólo decide cuando la pareja no cabe: NOR-11 ↔ CLI-12 cabe entera y van
    los 55 trozos sin que el ranking intervenga; con una ventana en la que NOR-10 ↔ CLI-12 quepa, los trozos 6,
    34 y 51 entran sí o sí.
  · **PENDIENTE DEL MEDIDOR (22/10, NO SE CONSTRUYE AHORA)**: la lectura guarda CUÁNTOS trozos entran en la
    selección ampliada (`trozosDelCandidato`), no CUÁLES. La lista de 12 es simulación, no medida.
  · **LA VENTANA SUBE A 150.000 (decisión del director, 22/10)**: el mismo interino con otra constante, dentro de
    la región que el barrido de monotonía certifica (de 10.000 a 200.000). No sustituye a la 3.1.5 ni se salta
    su orden. Con 150.000, NOR-10 ↔ CLI-12 cabe entera (66.801 + 55.135 = 121.936) y la ampliación de la
    segunda selección deja de ejecutarse con este corpus; NO se borra (la necesitará la 3.1.5). Tanda: cinco
    pasadas de NOR-10 y dos de NOR-11. **LAS PREDICCIONES, escritas antes de medir (arquitecto, 22/10):**
    1. NOR-10 ↔ CLI-12 pasa a pareja_entera: 55 trozos, 55.135/55.135, analizado 66.801/66.801.
    2. Los trozos 6, 34 y 51 de CLI-12 están delante del juez por primera vez.
    3. **D se publica** (conflicto de QUIÉN, como A, que sale 5 de 5).
    4. **C se publica** (conflicto de NÚMERO, 6 contra 12 meses, como PLAZO, que da 11 de 11).
    5. B es la dudosa: su otra mitad tiene dos formas literales en CLI-12 (12.1 y 12.8), y la cita puede salir
       ambigua. Si falla, el motivo NO será la lectura.
    6. La entrada del juez del análisis pasa de ~68.200 a ~83.600 tokens: el TOTAL cuesta ~0,0084 $ y el AUMENTO
       son +15.400 tokens = +0,0015 $ (corregida antes de medir: mezclaba el total con el aumento, lo vio Code).
    7. La latencia sube sólo en la medida en que el juez escriba más.
    8. ~~El bloque 8 sigue vacío~~ **RETIRADA antes de medir**: no podía fallar. El bloque 8 de `SQL_F128_02` sólo
       mira las parejas con corte, y sin corte decía «ninguna cita», que se lee como acierto sin haber podido
       mirar (regla 5). Desde el 22/10 dice «NO APLICA: sin corte».
    **EL CONTROL QUE IMPORTA**: si D y C siguen sin publicarse TENIENDO su otra mitad delante, es fallo del juez y
    no de la lectura, y eso cambia el diagnóstico del 3.1.2.
    **EL CONTROL DE NOR-11**: sus dos pasadas son idénticas a las de la tanda del 22/10 SÓLO para las parejas con
    CLI-12 y CLI-13, que ya cabían enteras. NOR-11 ↔ NOR-10 suma 81.505: era corte con 80.000 y cabe con 150.000.
    En las once pasadas del 22/10 NOR-10 no llegó al juez (bloque 1 de `SQL_313_01`, leído por el arquitecto),
    pero podría: SI APARECE, su cambio de régimen es el cambio funcionando, se anota y no cuenta como desviación.
    **Para leerla**: en `SQL_313_01`, ventana 150000 y trozos 55, y los ESPERADOS después de mirar el reloj.
  · **LA VENTANA DE 150.000, MEDIDA Y CERRADA el 22/10** (cinco pasadas de NOR-10 y dos de NOR-11, sobre
    `09cf63e5`; cifras del arquitecto, de las salidas de `SQL_313_01`, `SQL_F128_02` y `SQL_311_02` que ejecutó
    el director; Code no las ha visto; medida completa en el proyecto de Claude,
    `claude/Medida_F313b_La_Ventana_De_150000_22-10-2026.md`, que NO está en este repositorio):
    · **TRES DE TRES EN NOR-10 ↔ CLI-12, por primera vez en el corpus**: A, B y C publicadas en las cinco
      pasadas, confirmadas por juicio, y reconocidas POR LA PROPIA CITA (bloque 2d: A → A, B → B, C → C, las
      cinco veces). Por la cita: 0 de 20 en la tanda de 80.000; 15 de 28 en ésta. B cita el trozo 34 de CLI-12
      y C el 51: los que la predicción 2 decía que llegarían por primera vez.
      **EL MARCADOR DE LA PAREJA DIFÍCIL ES 3 DE 3, NO 3 DE 4 (arquitecto, 23/10).** D se reclasifica FUERA del
      marcador y queda como caso con nombre propio (abajo): tenerla en la misma tabla que A, B y C hacía parecer
      un fallo de detección lo que es una frontera de la definición. Y D no está sembrada: es el hallazgo real
      del 27/08 (`SIEMBRA_corpus_ampliado.md` §1).
    · **Las predicciones, calificadas y sin reinterpretar**: 1 (pareja entera, 55 trozos, 55.135/55.135,
      analizado 66.801/66.801) ACIERTA; 2 (los trozos 6, 34 y 51 delante) ACIERTA; 3 (D se publica) **FALLA,
      0 de 5**; 4 (C se publica) ACIERTA; 5 (B es la dudosa) **FALLA en la dirección buena, 5 de 5**; 6 (+15.400
      tokens, +0,0015 $) ACIERTA, medido +15.434 y +0,00154 $; 7 (la latencia sube) **FALLA en las dos ramas**;
      8, retirada antes de medir. Los tres fallos son del arquitecto y por lo mismo, en sus palabras: supuso
      que con más texto el juez escribiría más, y escribió menos. La de Code, los 55 trozos: ACIERTA, 5 de 5.
      ⚠️ **LA PREDICCIÓN 3 FALLÓ PORQUE EL ARQUITECTO CLASIFICÓ D POR SU TEMA SIN LEERLA** (en sus palabras,
      23/10): dijo «conflicto de quién, de la misma clase que A, la más probable de las tres», y la premisa era
      falsa. Es la misma regla —leer el registro entero, no la palabra clave— que ya le había fallado antes, y
      esta vez costó una predicción.
    · **EL DATO QUE CAMBIA CÓMO PENSAR: con el candidato entero, el juez ENCUENTRA MÁS, ESCRIBE MENOS Y TARDA
      MENOS.** Hallazgos por pasada, mediana de 4 a 6; salida del juez, de 9.606 a 7.874 tokens; duración, de
      36.720 a 30.160 ms. La causa, medida: con sólo el trozo 4 de CLI-12 el juez desmenuzaba A en sus tres
      decisiones, tres hallazgos para una contradicción; con el documento entero publica A una vez, con su
      sujeto, y le queda sitio para B y C.
    · **El coste** (`SQL_311_02`): la entrada del juez es idéntica en las cinco pasadas, 34.324 tokens contra
      CLI-13 y 50.834 contra CLI-12, 85.158 en total. Efecto neto: **+0,00068 $ por análisis**, porque el juez
      escribe menos; su etapa pasa de 0,011775 $ a 0,012453 $. NOR-10, entre 0,0294 y 0,0352 $ por análisis;
      NOR-11, 0,0251 y 0,0269 $, más barato que por la mañana.
    · **Lo demás**: el comité de calidad vuelve en 3 de 5 y el NOR-04 en 2 de 5; un tema nuevo bien
      descartado, «Interlocutor ante inspección sanitaria» → `mismo_dato_sin_oposicion`, en 2 de 5; las citas,
      mediana de 83 a 111, mínimo de 49 a 58 y máximo de 222 a 171 (más largas y menos dispersas). La petición
      del juez contra CLI-13 sigue en 14.580 tokens: subir la ventana no tocó un byte de las parejas que ya
      cabían. Los dos FALLA de la tanda: el ESPERADO puesto en 3 cuando fueron 5 (otra vez la razón de la regla
      del ESPERADO) y `SQL_313_02` relanzada, que ya estaba contestada y sale vacía. Ninguno invalida nada.
    · **Dos confirmaciones del registro por llamada (3.1.1)**: «DURACIÓN 34.573 ms · TRABAJO 45.637 ms», el
      trabajo por encima del reloj porque las dos peticiones del juez corren en paralelo (comienzos 8.486 y
      8.484): el campo `comienzoMs` se gana el sitio. Y el reparto, 95,8–98,0 % en petición y 2,0–4,2 % en
      espera: la hipótesis del backoff sigue enterrada. El ÷4, al 70 % (68,5 % en la 3.1.1).
    · **El pendiente del medidor sigue**: la lectura guarda cuántos trozos entran cuando hay selección, no
      cuáles.
    · **«LEER DE MÁS ABARATA», RESULTADO GENERAL (F-129, 23/10)**, no de esta pareja: la fragmentación de
      hallazgos es un coste de salida, y el texto de entrada completo lo evita. Con un trozo del candidato el
      juez desmenuzaba A en tres hallazgos; con el candidato entero la publica una vez y le queda sitio.
    · **RESERVA SOBRE LA VENTANA (F-129, aceptada por el arquitecto)**: la pérdida de atención en contextos
      largos sigue SIN MEDIR. El arnés es la guarda: si una trampa de una pareja pequeña dejara de salir con la
      ventana grande, SE MIDE LA VENTANA, NO LA TRAMPA. Hoy no ha pasado. ⚠️ El dictamen dice «150.000
      caracteres son unos 45.000 tokens»; con la proporción medida el 22/10 en la pareja (2,745 caracteres por
      token, 3.1.4) salen unos 54.600. Nota de Code; el texto del dictamen no se toca.

**HECHO EN CÓDIGO el 21-22/10 (`2e63221a` y `aa29166b`, opción (a) del arquitecto)**: dos selecciones —la
de la recuperación con 3.000, como siempre, y una segunda después del rerank con el resto— y un solo
reparto (`repartoDeLaPareja`, `lib/analysis/reparto-de-la-pareja.ts`), con las cabeceras contadas y la
ventana acotada por debajo en 10.000 (`VENTANA_MINIMA_MEDIDA`). **En NOR-10 ↔ CLI-12 entran 12 trozos, no
13**: los trece del párrafo de abajo se contaron sólo con el texto; con las cabeceras, el 26 se queda fuera
(12.771 montados de un resto de 13.199). La lectura de cada pareja guarda `seleccion` y
`trozosDelCandidato`. La tanda —encargada de siete pasadas de NOR-11 y tres de NOR-10; fueron once y cinco— se lee con `SQL_313_01` y con
`SQL_F128_01`, `SQL_F128_02` y `SQL_311_02` sin tocar su lógica.
**LAS PREDICCIONES, escritas antes de la tanda (arquitecto, 22/10/2026):**
  · **NOR-11 ↔ CLI-12 PASA A PAREJA ENTERA**: 14.704 + 55.135 = 69.839, que cabe en 80.000 (tamaños
    montados, comprobados por Code). Era corte honesto con el candidato en 2.959 de 55.135 (cifra del
    arquitecto, de la salida del director). El manual de calidad entero se lee por primera vez contra
    NOR-11: ahí tiene que notarse el interino, y ahí pueden aparecer falsos positivos —55.000 caracteres
    entrando enteros en una pareja que daba 0 contradicciones—.
  · **NOR-11 ↔ CLI-13 NO CAMBIA**: ya cabía entera en 40.000 y el texto es el mismo. Las tres trampas
    tienen que salir 7 de 7, como en F-128; si alguna se mueve, no es el interino, es la variación del modelo.
  · ⚠️ **LA FRASE C DEJA DE SER EL CONTROL DE INVENCIÓN.** C está en NOR-10 del carácter 58.883 al 59.089
    (F-127, adenda, 1.2). Con 40.000 se entregaban 37.143 de 66.801 (con CLI-12) y 30.183 (con CLI-13):
    C quedaba fuera, y si salía, el juez se la inventaba. Con 80.000 el analizado va ENTERO, 66.801 de
    66.801, en las dos parejas (con CLI-13, porque 66.801 + 9.817 = 76.618 cabe entera; comprobado por
    Code). **Si en la tanda se publica C, ES UN ACIERTO.** Lo que sigue siendo control de invención es
    cualquier cita del nuevo fuera de lo entregado: el bloque 3 de `SQL_F128_02`. Lo mismo, en su cabecera.
  · **LA LATENCIA: EL ANÁLISIS VA A TARDAR MÁS** (arquitecto, 22/10/2026; «si falla, falla», no se
    reinterpreta después). La entrada del juez en NOR-11 ↔ CLI-12 pasa de unos 17.600 caracteres a
    69.839, cuatro veces más. Lo que cuesta tiempo es la SALIDA, no la entrada: si esa pareja sigue
    dando 0 contradicciones, el tiempo de más será pequeño; si el juez empieza a escribir, se nota.
    Contra qué se compara: los 36.128 ms del análisis del 21/10 y los 27.718 ms de su petición más
    larga (cifras del arquitecto, de la salida de `SQL_311_02` que ejecutó el director; Code no la ha
    visto). La duración de cada pasada sale en el bloque 3 de `SQL_313_01`, al lado de la petición
    más larga; el 36.128 no va escrito en la consulta, sólo el 27.718.
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

#### ⚠️ CASO ABIERTO · D, CON SUS DOS MITADES DELANTE Y SIN EMITIRSE · 22/10 · ABIERTO CON NOMBRE
**Lo medido (arquitecto, de las salidas de la tanda de 150.000)**: las dos mitades de D estuvieron delante del
juez las cinco veces —en NOR-10, la frase de 3.881 a 4.267 (el dato, «puede recaer en el propio Director Clínico»,
de 3.943 a 3.984), y el trozo 6 de CLI-12, entregado— y no se publicó nada. ⚠️ Las posiciones, corregidas el 23/10:
aquí ponía «de 3.943 a 4.267», el principio del DATO con el final de la FRASE, la misma mezcla que F-127 (adenda,
1.2) y que la etiqueta «empieza» del bloque 4 de `SQL_F128_02`, que es el principio del dato.
**No es** el barranco, ni la ventana, ni el ranking, ni un tope de salida (emitió de 5 a 7 crudos contra un
máximo de 10 del prompt), ni la puerta (los seis contadores a cero). **Y NO LO ARREGLA LA 3.1.2**: la 3.1.2
corrige cómo se cita lo que el juez ya emitió, y D no se emitió.
**La lectura de las dos mitades ENTERAS (Code, 22/10, del registro de siembra §1 y de los dos documentos tal
como los arma el juez)**: en A, las dos frases tienen el mismo sujeto —«el responsable último»— y CLI-12 niega
literalmente el valor de NOR-10 («es el Coordinador de Calidad del centro, **no el Director Clínico**»): no
hace falta ningún paso. En D, NO hay una frase que niegue a la otra. NOR-10 2.4 habla de **quién puede ser** el
Coordinador («figura que puede recaer en el propio Director Clínico»); CLI-12 3.5 habla de **quién lo sustituye
cuando falta** («sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la
red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones
descrita en el apartado 3.1»). Para llegar a la contradicción hay que razonar: si el Director no puede ni
sustituir al Coordinador, por la separación de funciones de 3.1, tampoco puede serlo. Es la inferencia del
propio registro, que se apoya además en 3.4 («un documento no escribe un procedimiento de arbitraje entre dos
figuras que pueden ser la misma persona»). **D exige un paso de razonamiento que A no exige.** Con esto el
arquitecto escribe la consulta a Fable; no hay arreglo propuesto.
**LA REORDENACIÓN (arquitecto, 23/10): D no es un fallo de detección, es una FRONTERA DE NUESTRA DEFINICIÓN DE
CONTRADICCIÓN.** Todo lo que el sistema detecta hoy es «el mismo dato con dos valores»; D es una PERMISIÓN contra
un PRINCIPIO.
⚠️ **Y LO MÁS INFORMATIVO, en palabras del arquitecto: CLI-12 · 3.5 apunta al apartado 3.1 para la separación de
funciones, y EL 3.1 ES LA MITAD DE A. La frase que resolvería D es la que el juez ya publica 5 de 5 como A. La
tiene delante, la cita bien, y no la conecta.**
~~**Pendiente del dictamen de F-129** (ver la sección 0). No se construye nada hasta entonces.~~
**DICTAMEN DE F-129 (23/10, `claude/consultas-fable/F-129_2026-10-23_una-permision-contra-un-principio.md`): EL JUEZ NO FALLA EN D.** La definición pide «imposible
que ambas afirmaciones sean verdaderas», y dos normas no son verdaderas ni falsas: se cumplen o no. ¿Pueden ser
verdaderas las dos frases de D? Sí. ¿Pueden cumplirse las dos? No. El juez obedece la regla que se le dio. **El
criterio pasa de VERDAD a CUMPLIMIENTO**, y eso cierra el agujero 3.1.1 del arquitecto: no era el prompt, era la
definición. D queda dentro del producto y fuera de la definición actual, y entra por el **3.4 generalizado** (ver
el 3.4). Sigue ABIERTO con nombre hasta que exista la especie.
  · **Dos hallazgos reales no sembrados**, en el registro (`SIEMBRA_corpus_ampliado.md` §7 y §8): la
    composición del comité de calidad de la red (4 de 5 pasadas) y su periodicidad (1 de 5, minor).
  · **Anotado, sin tocar código**: un `paso=normalizada` en la pasada de NOR-11 de las 09:48 (contenedor,
    148/195), el segundo que se ve, y no es de los seis contadores; un motivo de descarte nuevo,
    `sin_relacion`, en la pasada de NOR-10 de las 10:01; la caché a cero en los dieciséis análisis (3.1.4);
    y el coste de las tres etapas en Haiku 4.5 (3.15 A).

#### 3.1.4 · Documentos como bloques y caché de prompt · F-127 P7 paso 4, P-F127-10, adenda Q2 · SIN EMPEZAR
**LA JUSTIFICACIÓN, CON NÚMERO (22/10/2026)**: caché escrita 0, leída 0 y ahorro 0 $ en los DIECISÉIS
análisis de la tanda del 3.1.3 (`SQL_311_02`; cifra del arquitecto, de la salida del director). La
primera lectura del 21/10 ya daba cero en uno; ahora es en dieciséis.
**LA CACHÉ VA ANTES QUE LA MIGRACIÓN DE MODELOS (decisión del arquitecto, 23/10, con la razón de F-129)**: el
verificador es el control de la puerta y de la especie nueva, y abaratarlo es abaratar el control; la caché no
toca ningún control y recupera el 36 % de la entrada del juez (30.700 de 85.158). **El orden es DECISIÓN DEL
ARQUITECTO, NO DEL DICTAMEN**: el dictamen no ordena las dos cosas, sólo dice que la caché es «el ahorro que no toca
ningún control». ⚠️ **Error del arquitecto (23/10)**: su lectura daba el orden como razón de Fable. Y Fable
no decide sobre la migración porque la consulta no dijo a qué modelo: **fallo de redacción del arquitecto**, en
sus palabras.
**Y CON NÚMERO DE LO QUE SE PAGA DOS VECES (22/10, tanda de 150.000)**: la caché, a cero en los siete análisis y
sus 39 peticiones. El analizado (≈24.300 tokens) y el prompt (≈6.400) entran en las DOS peticiones del juez:
unos 30.700 de los 85.158 tokens de entrada del juez se pagan dos veces en el mismo análisis.
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
⚠️ **CORREGIDO el 22/10/2026 (arquitecto, con la tanda de 150.000): LA ENTRADA DEL JUEZ NO ES «PROMPT FIJO MÁS
PAREJA».** La plantilla son 11.672 caracteres, pero el prompt medido en tokens no es constante: 5.647 en los
análisis de NOR-11 (15 trozos en el analizado) y 6.412 en los de NOR-10 (67 trozos), unos 14,7 tokens por trozo
del analizado, plausiblemente una cabecera por trozo (la causa NO está comprobada en el código). La regla queda
**entrada ≈ 5.426 + 14,7 × trozos del analizado + caracteres de la pareja / 2,745**, y ⚠️ **ES UN AJUSTE CON DOS
PUNTOS, NO UNA LEY**: el tercer punto la confirma o la rompe.
**Dato nuevo para este paso (arquitecto, documentación de Anthropic, 19/10)**: con Haiku 4.5, la
lectura de caché cuesta **0,10 $ por millón, una décima parte de la entrada normal (1 $)**, y la
escritura **1,25 $**, un 25 % de recargo la primera vez. Era lo que Fable decía no poder estimar.

#### 3.1.5 · Escalón 2, leer por ventanas · F-118 D5, F-123 punto 7, F-127 P6 y D1 · SIN EMPEZAR
**⚠️ ANTES DE DISEÑARLO SE LEEN LOS PENDIENTES A, B Y C DEL 3.15** (arquitecto, 21/10): las ventanas
multiplican las llamadas al juez, y por tanto exactamente lo que los tres miden.
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
**23/10 (F-129)**: Fable la nombra otra vez por la regla de los 7 días, con 23 días dictaminada y sin commit. Su
urgencia baja con la pareja entera, porque con el candidato entero no hay selección que hacer; sigue viva para
corpus donde los candidatos no quepan.
El frente más antiguo abierto, y Fable lo señaló en la cabecera de F-126 por la regla de los 7 días.
Recortada por F-123 a cuatro movimientos con medida en sombra. **Dictaminada y sin empezar.** Fable
la contaba con 13 días sin commit el 13/10 por su regla de los 7 días; la cuenta la lleva él, aquí
no se guarda un número que envejece.

### 3.4 · Conflicto normativo (antes «norma contra práctica») · F-125, GENERALIZADO por F-129 (23/10) · DESPUÉS DE LA 3.1.2 Y DE CUATRO SIEMBRAS
~~Extender la definición de contradicción. En espera **por decisión del arquitecto, contra la
recomendación de Fable**, con la condición de que fuera después de medir (B). **(B) ya está medida,
así que esta condición se ha cumplido y queda desbloqueada.** Commit propio.~~ (F-125; generalizado el 23/10)
**EL DICTAMEN DE F-129** (`claude/consultas-fable/F-129_2026-10-23_una-permision-contra-un-principio.md`; lo que sigue es su contenido, con la lectura del
arquitecto donde se dice):
- **Se generaliza**: deja de ser «norma contra práctica» y pasa a ser `conflicto_normativo`, con dos subtipos,
  `norma_contra_practica` y `norma_contra_norma`. Fable lo cuenta como corrección SUYA, no nuestra.
- **El predicado**: dos pasajes se contradicen si afirman valores distintos para el mismo dato, O si enuncian
  normas que no pueden cumplirse simultáneamente por el mismo sujeto en el mismo ámbito. **Universo**: normas son
  los enunciados con «debe», «puede», «nunca», «prohibido», «solo», «exclusivamente», «no sustituye»,
  «separación», «incompatible» o equivalentes, y el sujeto y el ámbito se nombran EN EL TEXTO. **Vacío**: si falta
  el sujeto común o el ámbito común, no es conflicto normativo; como mucho, una «sospecha sin contrastar» interna.
- **Las citas de `norma_contra_norma`**: (1) la permisión, literal y obligatoria; (2) el principio, literal y
  obligatorio, **y tiene que contener la palabra de incompatibilidad** («nunca», «separación», «prohibido», «no
  puede»): si el principio sólo se deduce, NO SE PUBLICA; (3) la referencia interna, literal y opcional: **cuando
  existe en el texto, como «el apartado 3.1», SE EXIGE** y sube la confianza; cuando no existe, el hallazgo se
  publica si están 1 y 2, con confianza menor. ⚠️ La lectura del arquitecto la daba como «opcional, que sube la
  confianza cuando existe»; **manda el dictamen: cuando existe, se exige**. **La consecuencia de diseño
  (arquitecto, 23/10): un hallazgo cuya referencia interna exista en el texto y no se cite DEBE BLOQUEARSE.**
  Para el 3.4; hoy no se construye. Nunca un conflicto normativo con una
  cita y una explicación: un cliente no puede comprobar una explicación; puede comprobar dos frases.
- **El verificador cambia de pregunta** para `norma_contra_norma`: «si se cumple la permisión de la cita 1, ¿puede
  cumplirse la norma de la cita 2? Sí, no, o depende del ámbito». Sólo «no» confirma; «depende» va a sospecha.
- **Severidad e incertidumbre son dos campos**: la severidad la decide el juez por impacto («un conflicto de
  separación de funciones en un protocolo clínico no es menor»), y la confianza se muestra aparte («inferido de
  principio enunciado»). El dictamen dice que mezclarlos «es lo que vuestra minor_inconsistency hace y conviene no
  repetir»; **anotarlo como deuda es DECISIÓN DEL ARQUITECTO, NO DEL DICTAMEN** (sección 5). ⚠️ **ERROR DEL
  ARQUITECTO (23/10), en sus palabras**: su lectura del dictamen la daba como dicha por Fable; «dar peso de
  dictamen a una decisión propia es de lo peor que puedo hacer en este puesto, porque dentro de un mes nadie la
  puede discutir».
- **Dos contadores** para cuando la especie exista: `conflicto_normativo_detectado` y, en el original,
  «..._no_publicado». **NO se construyen**: van con el 3.4, y cómo se cuenta lo que el juez todavía no emite es una
  pregunta de ese encargo (arquitecto).
- **CUATRO SIEMBRAS ANTES DE MEDIR**: dos casos de `norma_contra_norma` distintos de D y SIN referencia interna;
  un caso NEGATIVO (dos normas que parecen incompatibles y no lo son: el ejemplo del dictamen, NOR-10 deja al
  Director designar al Coordinador y CLI-12 dice que lo sustituye el de otra clínica en vacaciones); y uno de
  `norma_contra_practica`, que no tiene siembra. Sin el negativo, el cero de falsos es un cero de población. **Que
  ninguna se siembre en medio de una medición es DECISIÓN DEL ARQUITECTO, NO DEL DICTAMEN**; ⚠️ su lectura la daba
  como de Fable: **error del arquitecto, 23/10**.
- **El orden**: después de la 3.1.2, porque cambiar a la vez la cita con sujeto y la definición deja sin causa un
  cambio de marcador; y no inmediatamente después: tras las cuatro siembras.
- **Las predicciones, para la tanda de la extensión**: **P-F129-b**, D se publica como `norma_contra_norma` con las
  tres citas en 4 de 5 o más; los dos sembrados nuevos, 3 de 5 o más cada uno; el negativo, 0 de 5;
  `norma_contra_practica`, 3 de 5 o más. **P-F129-c**, las seis contradicciones vivas siguen 5 de 5, y 0 de 5
  falsos de la especie nueva en el caso de control. **P-F129-d**, al menos un candidato a `norma_contra_norma` recibe
  «depende del ámbito» del verificador y va a sospecha; si ninguno, el verificador no discrimina y hay que mirar su
  pregunta. **Criterio de abandono**, el nuestro y suscrito por Fable: una de las seis vivas por debajo de 5 de 5, o
  un falso de la especie nueva, y se revierte.

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

### 3.15 · Tres pendientes medidos por el 3.1.1 · arquitecto, 21/10 · NO SE TOCAN AHORA
Salieron medidos el 21/10 con `SQL_311_02` (cifras del arquitecto, leídas en la salida de `SQL_311_02` que ejecutó el director el 21/10 sobre el análisis rápido de NOR-11 de las 14:01; Code no ha visto esa salida), y van con nombre propio y no como líneas de
la deuda.

**⚠️ DISPARADOR COMÚN DE LOS TRES: se leen ANTES de diseñar el 3.1.5 (las ventanas)**, porque las
ventanas multiplican el número de llamadas al juez y por tanto multiplican exactamente lo que los tres
miden. Diseñar las ventanas sin haberlos leído sería decidir a ciegas sobre el coste y el tiempo.

#### PENDIENTE A — LAS TRES ETAPAS QUE SIGUEN EN HAIKU 4.5
Medido el 21/10 (`SQL_311_02`, un análisis rápido de NOR-11): **rerank 29,1 % del coste, verificador
31,6 %, síntesis 8,5 %**, las tres en Haiku 4.5, que cuesta diez veces más por token que 5.5. El juez,
ya en 5.5, es el 30,8 %. Pasarlas a 5.5 llevaría el análisis de 0,022045 $ a unos 0,0083 $ — **es un
CÁLCULO, dividir por diez el coste de esas tres filas, NO una medición.**
⚠️ **Y NO ES EL MISMO CAMBIO QUE EL DEL JUEZ, aunque se parezca.** El juez es la última decisión de la
cadena, así que cambiarle el modelo sólo cambia su salida. **EL RERANK DECIDE QUÉ DOCUMENTOS SE
COMPARAN**, así que cambiarle el modelo cambia la entrada de todo lo que viene después, y una tanda con
otro rerank no es comparable con la línea base. Cada etapa necesitaría su propio interruptor y su
propia medición, **empezando por las dos inofensivas (verificador y síntesis) y dejando el rerank para
el final, con su línea base propia.** Y arrastra el mismo confundido declarado de F-128: Haiku 5.5 no
admite `temperature` 0,1.
**MEDIDO OTRA VEZ el 22/10, sobre los dieciséis análisis de la tanda** (cifras del arquitecto; Code no ha
visto la salida): las tres etapas en Haiku 4.5 —verificador, rerank y síntesis— son el **66,3 % del coste**
del análisis, con **626 tokens de salida entre las tres**. **Los 10.143 tokens de entrada del verificador
cuestan más que los 45.670 del juez**, y cuadra con la tabla de precios: 10.143 × 1 $/M = 0,0101 $ contra
45.670 × 0,10 $/M = 0,0046 $ (cuenta de Code). **NO SE TOCA**: no está en el orden de Fable y exige tanda propia.
**Y OTRA VEZ, con la ventana de 150.000 (22/10, por la tarde; cifras del arquitecto)**: **el verificador es ya
la etapa más cara, el 46,5 % del análisis**, leyendo 15.079 tokens y escribiendo 256, mientras el juez lee 85.158
y cuesta el 37,1 %. Las tres etapas en Haiku 4.5 son el **62,9 % del coste** y escriben 675 tokens entre las
tres; migrarlas bajaría el análisis de 0,0352 $ a unos 0,0151 $, un 57 % (cálculo, no medición). **Es la mayor
palanca de coste que queda en el pipeline, NO está en el orden de Fable y exige tanda propia. NO SE TOCA.**

#### PENDIENTE B — POR QUÉ EL JUEZ ESCRIBE 7.144 TOKENS EN UNA LLAMADA
Medido el 21/10: **una sola petición del juez, 27.718 ms y 7.144 tokens de salida, el 77 % de la
duración del análisis.** La pregunta sin contestar: **¿cuánto de esos 7.144 es PENSAMIENTO y cuánto es
la respuesta escrita?** Los tokens de pensamiento se facturan como salida y Haiku 5.5 piensa de forma
adaptativa, así que puede ser casi todo pensamiento. No lo sabemos porque `output_tokens` los suma y el
registro no los separa.
Cómo se mediría, sin diseñarlo todavía: el lector de la respuesta (`leerTextoDeLaRespuesta`,
`lib/llm/texto-de-la-respuesta.ts`) ya cuenta los bloques de pensamiento; con su longitud al lado de los
tokens de salida se podría separar. Y hay una palanca de una línea, sin medir: el dial de esfuerzo de
5.5 está en `medium` (`lib/analysis/modelo-del-juez.ts`); bajarlo a `low` recortaría el pensamiento.
**NO SE TOCA sin medir antes**, porque es la misma trampa de siempre: cambiar y medir a la vez.

#### PENDIENTE C — LA ESTIMACIÓN ÷4 DEL LIMITADOR DE CUOTA
Medido el 21/10: **estima el 68,5 % de lo que manda de verdad.** El limitador decide con esa cifra
cuántas peticiones puede lanzar sin que la API corte, así que su margen real es un tercio menor del que
cree. Hoy no muerde: cero 429 en todo lo medido. Pero el volumen por análisis sube con las ventanas, y
es entonces cuando importa. El arreglo es barato y hay dos formas, **sin decidir cuál**: cambiar el
divisor con un factor medido, o usar las cifras reales que ya devuelve la petición anterior en vez de
estimar. **Lo que NO vale es dejar el 4 sin que nadie sepa que se queda corto.** (Las dos estimaciones:
`callAnthropicJson` y `callAnthropicAgent`, en `lib/llm/anthropic-client.ts`.)

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
| **LA VARIACIÓN DEL TIEMPO DE LOS ARNESES SIGUE AHÍ, POR DEBAJO DE LOS TOPES, Y SU CAUSA NO ESTÁ ENTENDIDA.** Con tres hilos (`e298608f`), el gate dio 112 y 34 s en dos pasadas seguidas sin cambiar nada; solos, los arneses han ido de 38 a 147 s esta semana según la pasada y los hilos, y el censo que no usa PGlite tardó 0,3 s solo y hasta 63 s en paralelo. **No es un frente** (arquitecto, 23/10): es deuda, porque la causa —la máquina, el arranque en frío de PGlite, otra cosa— no está medida. Si vuelve a cruzar un tope, se mide antes de tocar | medido por Code, 22-23/10 |
| **`minor_inconsistency` MEZCLA SEVERIDAD E INCERTIDUMBRE EN UN SOLO CAMPO.** El dictamen de F-129 separa las dos cosas para la especie nueva —la severidad, por impacto; la confianza, aparte y mostrada («inferido de principio enunciado»)— y dice que mezclarlas «es lo que vuestra minor_inconsistency hace y conviene no repetir». Hoy un hallazgo menor por matiz y uno dudoso por falta de pruebas se ven igual. **No se toca** (arquitecto, 23/10) | F-129, 23/10 |
| **LOS ARNESES DE PGLITE TARDAN DE 41 A 122 s SEGÚN LA PASADA, EN VERDE.** El 22/10, con siete ficheros en paralelo, el primer caso de tres de ellos cruzó su tope de 60 s (113 s medidos) porque levantaban una base por caso; se arregló con una base por fichero, sin subir topes. Desde entonces todas las pasadas salen en verde, pero el tiempo varía de 41 a 122 s, y el censo `pglite-fuera-del-producto`, que no usa PGlite, tarda 0,3 s solo y hasta 63 s en paralelo, por hambre de CPU. ~~**Aparcado (arquitecto, 23/10): en verde y lento no es motivo para abrir el frente.** **Disparador: la primera vez que el gate se ponga ROJO por tiempo**, se toca `vitest.config.mts` (pasar el censo al proyecto de la suite, o limitar los hilos de los arneses) y se acabó~~ **✅ SALTÓ Y SE CERRÓ el 23/10**: el gate se puso rojo por tiempo (la preparación del arnés de `SQL_311_02`, 120 s) y `npm test` lanza ahora los arneses con `--maxWorkers=3` (en `package.json`, no en `vitest.config.mts`: es una opción de la orden). Medido y razonado en el protocolo | medido por Code el 22/10 y el 23/10 |
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
