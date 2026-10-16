# ESTADO Y PENDIENTES — 14/10/2026

> **Revisión: creado el 14/10/2026 · actualizado el 16/10/2026.** El 16/10 cambiaron dos cosas: el
> frente de lectura (3.1) pasa de una entrada a cinco, con el orden que dictamina F-127, y se
> corrige el estado de la fase 0, que no era el que creíamos. Se cierra la fase 3.4 (3.8) y entran
> la deuda nueva, la regla 12 y la sección 0, lo que está en vuelo.

> **Sustituye a `Puntos_Pendientes_Doclity.txt`**, que tiene cosas desfasadas. Escrito por el
> arquitecto el 14/10/2026, después de cerrar la medida de F-126. Cada pendiente dice **de qué
> consulta de Fable sale**, para que una entrada suelta se pueda rastrear dentro de un mes.
> Las consultas están archivadas con sus dos mitades en `claude/consultas-fable/`.

---

## 0. Lo que está en vuelo (16/10/2026)

- **MEDICIÓN LANZADA O POR LANZAR**: tres pasadas de NOR-10 desde la bandeja de revisión, con el
  presupuesto de hoy. Predicciones cerradas en `claude/Predicciones_F127_NOR10_Documento_Largo.md`;
  lectura con `SQL_F127_01_la_medida_de_NOR10.sql`. **El producto NO puede cambiar entre las
  pasadas.** Sirve además como sonda de la frase partida que pide Fable (F-127 P7).
- **PENDIENTE DE ESCRIBIR**: un añadido a F-127 para Fable con cinco correcciones medidas —el error
  del bloque de 3.206; que el corte en límite de trozo cuesta la contradicción B; que su P-F127-3 es
  falsa, con las parejas y las cifras; que el «corte honesto» no declara nada; y que el selector por
  relevancia corre antes de que se sepa lo que sobra—. Se escribe **DESPUÉS** de las tres pasadas,
  para que lleve dentro lo que el juez hace con media frase, que es lo que él mismo dice que no
  sabe.

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
cinco**, en el orden que dictamina F-127 (P7) y con su estado real. Lo que la motivó sigue en pie:
la única pareja con verdad documentada que pone a prueba las frases largas con subordinadas es
**NOR-10 ↔ CLI-12** (`SIEMBRA_corpus_ampliado.md`), y no cabe en una lectura: 66.801 y 55.135
caracteres renderizados contra 40.000. Y la regla de hoy no es monótona: tiene un barranco en 30 de
30 parejas, y subir a 80.000 con ella deja fuera la frase B que hoy entra (F-127, (c) 2.1 y 2.2).

#### 3.1.1 · Registrar tokens por llamada · F-127 P7 paso 1 y P9.1 · SIN EMPEZAR
**Es lo primero.** Cero cambio de comportamiento: la API ya devuelve `input_tokens`,
`output_tokens`, `cache_creation_input_tokens` y `cache_read_input_tokens`; llegan a
`lib/llm/anthropic-client.ts:333-340` y se pierden al sumarlos por modelo en
`lib/observability/usage-context.ts:40-45`. Hay que guardar también la latencia, que hoy no se mide
en ningún sitio, y el id de pareja. Sin esto ninguna cifra de coste es una cifra, y según el
arquitecto es la tercera vez que nos bloquea una medición.

#### 3.1.2 · Corte en límite de trozo con declaración al juez · F-127 P3 y P7 paso 2 · SIN EMPEZAR, CON UN PROBLEMA MEDIDO
**Si el corte retrocede al límite anterior, la contradicción B de NOR-10 ↔ CLI-12 se queda fuera
entera**: B va de 36.552 a 36.852, vive en el trozo 36, que empieza en 36.485, y el corte real cae en
37.143 (bloque de 2.857, el de las ocho pasadas del 02 y 03/10). Retrocediendo, el corte quedaría en
36.483. **Candidato del arquitecto, pendiente de dictamen**: avanzar al final del trozo en vez de
retroceder, pasándose del presupuesto hasta un trozo.

#### 3.1.3 · Ventana de 80.000 con reparto monótono · F-127 P4, P5 y P7 paso 3 · SIN EMPEZAR
En **UN SOLO cambio lógico**, verificado en simulación sobre las 56 parejas antes de desplegar, con
la prueba de monotonía en el arnés: barrido de 10.000 a 200.000 de mil en mil; **control positivo:
con la regla de hoy se pone roja en las 30 parejas del barranco, y si no se pone roja la prueba no
vale**. La constante pasa a llamarse `TAMANO_VENTANA`; `FRAGMENT_BUDGET_CHARS_QUICK` cambia de
oficio, de tope a suelo, y pasa a llamarse `RESERVA_CANDIDATO`; `SUELO_DEL_ANALIZADO` desaparece.
**Con un arreglo encontrado por Code**: la reserva es lo MENOR entre 3.000 y el tamaño del
candidato, porque reservar 3.000 a un candidato de 918 caracteres le quita 2.082 al analizado en
cuatro parejas. ⚠️ Y aun con ese arreglo, a 80.000 **cuatro parejas pierden en el lado candidato**
(P-F127-3, refutada: F-127 (f), anotación 5), y el reparto nuevo no es recablear un parámetro (ver
la deuda de `selectUnitsWithinBudget`).

#### 3.1.4 · Caché de prompt en el lado analizado · F-127 P7 paso 4 y P-F127-10 · SIN EMPEZAR
Antes va un cambio previo apuntado en F-122: los documentos viajan hoy pegados en el prompt y deben
ir como **bloques de documento** para que la caché actúe. Ese cambio en `llm-client.ts` se mide solo:
misma salida del juez con los documentos como bloques.

#### 3.1.5 · Escalón 2, leer por ventanas · F-118 D5, F-123 punto 7, F-127 P6 y D1 · SIN EMPEZAR
**Es la pieza que CIERRA el frente**, no un extra para lo que no quepa: subir el presupuesto sólo
persigue documentos. Entra como **fase 4**, después de F-119 (3.3) porque la necesita, y después de
3.2 y 3.3 de la fase 3 (aquí 3.6 y 3.7) porque multiplica llamadas. Diseño en siete piezas en F-127
P6.
**CRITERIO DE REVERSIÓN, ESCRITO ANTES DE CONSTRUIRLO**: antes de activarlo, las parejas que caben
en una ventana dan exactamente lo mismo que hoy en el arnés; la que no cabe da igual o más. Si una
trampa que hoy sale deja de salir, se apaga el interruptor.

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
`unidades-de-cita.ts` está construido desde el 08/10 y sin conectar, y eso no cuesta nada.
El disparador de F-126 era «si LUGAR no llega a 5 de 7»; llegó a 7, **así que NO se activa**.
No ganan velocidad ni coste de forma apreciable: lo que cuesta es leer los dos documentos. Ganan
otra cosa: **eliminan la transcripción como clase de fallo para cualquier documento**, mientras lo
de hoy es un arreglo comprobado en tres casos de una pareja.
**Disparador nuevo, escrito el 14/10:** la primera vez que un caso sembrado falle en **otro**
documento porque el juez no copió, se activa la 3.4.

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
    es un error, aunque el número sea real. Ya ha pasado tres veces, según el arquitecto; la última,
    el 15/10: el bloque de 3.206 es de CLI-13 ← NOR-10 y se usó para razonar sobre NOR-10 ← CLI-12,
    donde el bloque fue 2.857 en 8 de 8 pasadas. La conexión la hizo Code en su informe del 14/10,
    y de ahí salió un párrafo falso en la consulta F-127 (punto 2.4) y una predicción de Fable
    apoyada en él. **Antes de usar una cifra: ¿de qué pareja, de qué dirección y de qué fecha es?**
    (16/10/2026)
