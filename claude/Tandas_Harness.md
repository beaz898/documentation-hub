# Tandas del harness de tasas

## ⚠️ PENDIENTE DE VERIFICACIÓN (03/09/2026) — ¿MIDIÓ ALGUNA TANDA CON LA RED
POR NOMBRE ACTIVA?

NO ES UNA CONCLUSIÓN: es una condición que hay que poder declarar en cada
entrada y que hasta hoy no se registraba.

**LA CONDICIÓN**: hasta el arreglo del parámetro, un documento YA INDEXADO
analizado DESDE EL CHAT se encontraba a sí mismo entre sus candidatos —el
parámetro de exclusión viaja nulo en ese camino— y sus contradicciones consigo
mismo se descartaban aguas abajo por NOMBRE IDÉNTICO, sin dejar rastro en
ningún contador. Una pasada corrida así midió con una red puesta, y la red se
va a retirar.

**LO QUE DICE EL FICHERO, y es todo lo que dice**:
· Tres entradas declaran el camino explícitamente y las tres dicen BANDEJA:
  la remedición del frente 2 (su maniobra se monta sobre la bandeja), el bloque
  del verificador («cuatro pasadas, modo rápido desde la bandeja») y F-73
  («los cinco casos, desde la bandeja de revisión»). Desde la bandeja el
  parámetro SÍ viaja, así que la exclusión por identidad ya estaba activa y la
  red no hacía falta.
· **NINGUNA entrada menciona el chat ni una subida.** Verificado con grep sobre
  el fichero entero.
· Pero **la mayoría de las entradas no declaran el camino**, así que el fichero
  no puede cerrar la pregunta por sí solo.

**EL DISCRIMINADOR, para aplicarlo a lo viejo y para registrarlo en lo nuevo**:
si un documento se hubiera comparado consigo mismo, aparecería un candidato
EXTRA con score ≈ 1,0. En la pasada 1 de la remedición el log dice «1 candidato,
score máx 0,988» en las dos direcciones — un solo candidato, y el de la pareja.
Eso es INCOMPATIBLE con la autocomparación, y es la evidencia más fuerte que hay
en el fichero.

**QUÉ HACER**: (1) revisar los logs guardados de las tandas que no declaran
camino, buscando un candidato con score ≈ 1,0; (2) y desde ahora, **toda entrada
nueva declara DESDE DÓNDE se lanzó**, que es un dato de una línea que hoy falta
y que habría contestado esto sin abrir un pendiente.

---


Histórico de mediciones. **Crece por arriba: lo más reciente, primero.**

Los **once casos** —qué documentos entran en cada uno y qué debe encontrar—
están en `claude/Casos_Harness.md`. El **método** —cómo se lanza una tanda, qué
se apunta de cada pasada, la regla de admisión— está en
`claude/Protocolo_Harness_Tasas.md`. **Este fichero no repite ninguno de los
dos**: aquí solo van las cifras.

Al leer una tasa, mirar siempre contra qué commit se midió. Y recordar que
«línea de base» significa cosas opuestas en `Cierre_B81.md` (el síntoma, ANTES
de la cura) y en los relevos (el estado sano, DESPUÉS) — la advertencia está al
principio del protocolo.

---

### RESULTADOS — REMEDICIÓN DEL FRENTE 2, `daca6dbf` (02/09/2026, 13:29–13:34)

**Cinco pasadas, todas en modo rápido, todas limpias.** Es la validación del
frente 1 (que se dejó pendiente al cerrarlo) y la primera medición del frente 2.

MANIOBRA: todo pendiente y **solo la pareja de cada pasada en la bandeja** — el
corpus visible es `analysisStatus=analizado` MÁS los demás documentos de la
bandeja, así que acotar la bandeja es lo que aísla la pasada.

| pasada | qué | resultado |
|---|---|---|
| 0 | limpia, sin pareja | cero candidatos |
| 1 | OPE-10 ↔ OPE-11 | **15 y 15**, `por_estructura = 0` |
| 2 | RRHH-08 ↔ OPE-13 | las dos ramas, 2 por juicio, 0 por estructura |
| 3 | NOR-10 ↔ NOR-11 (prosa) | 0 / 0, sin regresión |
| 4 | descarte de fila + reanálisis | la fila vuelve marcada sola |

---

#### PASADA 1 — el par grande, las dos direcciones

| | OPE-10 → OPE-11 | OPE-11 → OPE-10 |
|---|---|---|
| Retrieval | 1 candidato, score máx **0,988** | 1 candidato, **0,988** |
| Nivel del reparto | **2** (21/60 filas, 39 fuera por tamaño) | **2** (22/60 filas, 38 fuera) |
| Fragmentos al juez | 6 — `table_row: 1` | 5 — `table_row: 2` |
| Overlap | 33 % | 33 % |
| Contradicciones del juez | 1 | 1 |
| **Diff** | **15 emitidas** | **15 emitidas** |
| Verificador | 1 → **0 confirmados (0 estructura, 0 juicio)**, 1 descartado | ídem |
| Tiempo | 16.868 ms | 15.608 ms |

    [fef525d3] "Duración de Prótesis parcial removible (PRO-03)"
       → descartado: cubierto_por_diff (el diff comparó Duración (min) en esas dos filas)
    [4e18e79b] "Profesional asignado para Regeneración ósea guiada (IMP-03)"
       → descartado: cubierto_por_diff (el diff comparó Profesional asignado en esas dos filas)

**LA LECTURA C, EN PRODUCCIÓN.** El motivo del descarte **nombra la columna**
—«el diff comparó *Duración (min)*»— en vez de decir solo «cubierto». Es la
diferencia entre un descarte que se puede auditar y uno que hay que creerse.

**Y EL HALLAZGO DEL JUEZ ES DISTINTO EN CADA DIRECCIÓN** (PRO-03 en una, IMP-03
en la otra) y los dos caen por lo mismo. La supresión no depende de QUÉ mire el
juez: depende de que el diff ya lo comparara. Es la generalización que B.124
pedía y que un caso fabricado no puede enseñar.

⚠️ LETRA PEQUEÑA DEL «1 hallazgo del juez»: el reparto fue de **nivel 2** — el
juez vio 21 de 60 filas en una dirección y 22 de 60 en la otra. Que solo emitiera
una contradicción se lee sobre ESE tercio, no sobre la tabla entera. El diff sí
vio las 60, y por eso emite 15: **las dos cifras miden cosas distintas y no se
comparan entre sí.**

---

#### PASADA 2 — el territorio sin clave, las dos direcciones

| | OPE-13 → RRHH-08 | RRHH-08 → OPE-13 |
|---|---|---|
| Retrieval | 1 candidato, **0,956** | 1 candidato, **0,956** |
| Nivel del reparto | **1** (14 filas completas) | **1** (14 filas completas) |
| Fragmentos al juez | 15 — `table_row: 14`, todas | 15 — `table_row: 14`, todas |
| Overlap | 93 % | 93 % |
| Contradicciones del juez | 2 | 2 |
| Verificador | 2 → **2 por juicio, 0 por estructura**, 1 reclasificado | *(línea no capturada)* |
| Tiempo | 9.834 ms | — |

    OPE-13 → RRHH-08
      [129c6113] "Turno y jornada semanal de Dra. Ana Belmonte"
         → baja a juicio: sin_clave (2 columna(s) de ancla, pero la estructura no puede firmar)
      [f1ab305a] "Jornada semanal de Dr. Carlos Medina"
         → baja a juicio: columna_no_comparada (sin oposición en lo compartido;
           columnas asimétricas citadas: Responsable, Jornada semanal, Profesional, Horas semana)

    RRHH-08 → OPE-13
      [25bf5508] "Turno de Dra. Ana Belmonte"          → sin_clave
      [eb3b7c97] "Horas semanales de Dr. Carlos Medina" → columna_no_comparada

**LAS DOS RAMAS EN LAS DOS DIRECCIONES.** Es la tercera vez que se ven —la
siembra las estrenó el 01/09— y la primera con la cascada reordenada de F-93
detrás. Ninguna baja se convirtió en confirmación por estructura, que es lo que
el frente 1 tenía que garantizar.

---

#### PASADA 3 — prosa, el control de no-regresión

| | NOR-10 → NOR-11 | NOR-11 → NOR-10 |
|---|---|---|
| Overlap | **0 %** | **0 %** |
| Contradicciones / solapamientos | 0 / 0 | 0 / 0 |
| Verificador | 0 → 0 | 0 → 0 |
| Tiempo | 9.144 ms | 7.531 ms |

El frente 2 no tocó la prosa y el control lo confirma.

⚠️ Y CON SU LETRA PEQUEÑA, que es la misma de siempre y conviene no perder:
**NOR-10 se truncó a 6.000 de 73.962 caracteres** (un 8 %), y NOR-11 a 6.000 de
15.417. «Cero contradicciones en prosa» significa cero **en lo que el juez llegó
a leer**. No es una regresión ni un fallo: es el techo declarado que el frente 4
viene a levantar. Anotarlo como «prosa a cero» a secas diría más de lo que el
dato dice.

---

#### PASADA 4 — la ficha B, de punta a punta

Observada en pantalla: se marcó una fila de tabla de OPE-10 como «no es un
error», se relanzó OPE-10 contra OPE-11 en rápido, y **la fila volvió marcada
sola**.

Es el ciclo entero de la ficha B en producción: el botón aparece (commit 1), la
huella TABULAR viaja al servidor y se registra (commit 1), y `marcarDescartadas`
la reconoce al volver por su identidad tabular (commit 2). Hasta el 01/09 ese
botón no existía para las filas de tabla.

---

#### LO QUE FALTA EN ESTA ENTRADA, dicho para que no se lea como completo

Los logs de las pasadas **0** y **4** no llegaron al registro, y de la pasada 2
falta la línea del verificador de la dirección RRHH-08 → OPE-13 (sí están sus
dos bajadas a juicio). Las tres cosas están **observadas por el director** y
ninguna contradice lo medido; se anotan como observación, no como cifra
capturada, que es la distinción que este fichero mantiene.

---

### RESULTADOS — TANDA DE LA SIEMBRA (RRHH-08 / OPE-13), `9b0d7eb7`

**Dos pasadas rápidas, las dos direcciones. LAS DOS RAMAS SE EJERCEN.** Es la
primera vez que se ven en producción la degradación del punto 4 y el destino de
B.130, que era lo que B.131 declaraba imposible de ver.

| | OPE-13 → RRHH-08 | RRHH-08 → OPE-13 |
|---|---|---|
| Retrieval | 1 candidato, score máx **0,956** | 1 candidato, **0,956** |
| Rerank | **1 seleccionado** | **1 seleccionado** |
| Nivel del reparto | **1** (14 filas, 1.854 car.) | **1** (14 filas, 1.913 car.) |
| Fragmentos al juez | 15 — `table_row: 14`, todas | 15 — `table_row: 14`, todas |
| Overlap | **93 %** | **93 %** |
| Contradicciones del juez | 2 | 2 |
| Verificador | 2 → **2 confirmados (0 estructura, 2 juicio)**, 0 descartados, 1 reclasificado | ídem |
| Tiempo | 13.659 ms | 9.700 ms |

    [129c6113] "Turno de Dra. Ana Belmonte"
       → baja a juicio: sin_clave (2 columna(s) de ancla)   → confirmado por juicio
    [f1ab305a] "Jornada semanal de Dr. Carlos Medina"
       → baja a juicio: columna_no_comparada (columnas asimétricas citadas:
         Responsable, Jornada semanal, Profesional, Horas semana)
       → confirmado por juicio

#### LA PREDICCIÓN, PUNTO POR PUNTO

| Predicho | Medido |
|---|---|
| `0 pareja(s)`, sin línea `Diff de tablas contra …` | ✔ **ausente en las dos**, como se dijo |
| `cubierto_por_diff` = 0 y `emparejamiento_invalido` = 0 | ✔ 0 descartados en el verificador |
| `confirmados_por_estructura` = 0 | ✔ en las dos |
| Nivel 1, documentos sin truncar | ✔ sin aviso de truncado |
| **Que el rerank deje pasar el par** | ✔ **en las dos** — era la única condición que la sonda no podía verificar |
| Belmonte → `a_juicio.sin_clave` | ✔ con **2 anclas**, como calculó la sonda |
| Medina → `a_juicio.columna_no_comparada` | ✔ con las cuatro asimétricas nombradas |
| Techo de **una** llamada corta por pasada | ✔ los 2 hallazgos en un lote |

**Y el control negativo aguantó**: de catorce filas, el juez emitió exactamente
las **dos sembradas** y **ninguna de las doce que coinciden en todo**. Cero
falsos positivos.

#### ⚠️ UNA PREDICCIÓN FALLADA, Y ERA PELIGROSA

Escribí que la llamada corta debía confirmar a Medina **«y solo a él»**, y que
confirmar a otro sería hallazgo. **Confirmó a los dos, y las dos
confirmaciones son correctas**: el `Turno` Mañana/Tarde de Belmonte es una
discrepancia sembrada, y está escrita en el registro de siembra que redacté yo.

**Si el director llega a leer solo esa línea, habríamos declarado falso positivo
un acierto del sistema.** No era una predicción imprecisa: era una trampa,
porque las predicciones se usan como criterio de aceptación.

El defecto es el **alcance del cuantificador** —«solo a él» ¿de entre quiénes?—
cometido en una PREDICCIÓN y no en una regla dictada. De ahí sale la extensión
de la cuarta pieza que va al protocolo.

#### EL COSTE, la cifra que F-90 P4 pedía

**Una llamada corta por pasada.** Los dos hallazgos viajan en el mismo lote
(`MAX_PER_CALL = 15`), así que con un candidato el techo es uno y se alcanzó.
Confirma **el extremo bajo** de «de una a cinco», con el límite ya declarado:
este corpus no puede desmentir la cifra, solo tocarla por abajo.

Tiempos totales de 9,7 y 13,7 segundos, muy por debajo de `maxDuration = 120`.

#### LOS SOLAPAMIENTOS RECHAZADOS: cuatro, y con causa mecánica

Tres en una dirección y uno en la otra —**4 de 4, el cien por cien de los
solapamientos del par**— todos por `cita no verificable, lado=ambos`, y **con
las dos citas idénticas entre sí**:

    nuevo    = "[F0] Dra. Marta Gil | Chamberí | Cirugía | Mañana | 35"
    existente= "[F0] Dra. Marta Gil | Chamberí | Cirugía | Mañana | 35"

**El juez copió la fila EXACTAMENTE como se la enseñamos, incluida la etiqueta
`[F0]`** que le pone `renderTableRow` (`table-structure.ts:171`). Y por eso la
cita no verifica: `alignQuoteToCells` parte por `|` y compara segmento a
segmento, así que `«[F0] Dra. Marta Gil»` no casa con la celda `«Dra. Marta
Gil»`; falla UN segmento de cinco y la función devuelve `null`.

Es la cuarta forma de B.107 y **la única con causa nuestra**: no es que el
modelo narre o enumere — es que **etiquetamos la línea y el modelo copió la
etiqueta**. Anotado en B.107.


---

## 01/09/2026 — `a2db84e0` — PREDICCIÓN DE LA TANDA DE LA SIEMBRA, escrita antes de lanzar

**Dos pasadas rápidas**: RRHH-08 en corpus analizando OPE-13, y al revés. Es la
primera vez que el corpus puede producir las dos ramas que B.131 declara sin
ejercer.

### S1 — LO QUE NO PUEDE FALLAR, porque está computado sobre los ficheros

- **`0 pareja(s)`** contra el otro documento, en las dos direcciones. El par cae
  por la primera puerta.
- **NO habrá línea `Diff de tablas contra …`**: solo se imprime si
  `emision.grupos.length > 0`, y sin pares no hay grupos. **Su ausencia es lo
  esperado, no un fallo.**
- `verificador.confirmados_por_estructura` = **0**.
- **`descartado.cubierto_por_diff` = 0** y **`descartado.emparejamiento_invalido`
  = 0**. ⚠️ Y esto NO contradice la predicción escrita para el par grande: allí
  el par está EMITIDO y la identidad se verifica; aquí no hay par en ninguna de
  las dos listas, así que las dos guardas devuelven `sin_cobertura` y nadie
  muere en ellas. Un cero aquí es correcto; un cero allí sería el hallazgo.
- Tabla en **nivel 1** (1.737 y 1.792 caracteres) y documento **sin truncar**
  (1.854 y 1.913 < 6.000). El juez ve las catorce filas de los dos lados.

### S2 — LA RAMA QUE NUNCA SE HA VISTO

Si el juez enfrenta **Ana Belmonte** —`Turno` Mañana contra Tarde, con `Clínica`
y `Especialidad` iguales—:

    → baja a juicio: sin_clave (2 columna(s) de ancla, pero la estructura no
      puede firmar)

Sería **la primera aparición en producción de `a_juicio.sin_clave`**, y con ella
la degradación del punto 4 deja de estar solo declarada.

### S3 — LA OTRA RAMA, B.130, Y CÓMO NO LEERLA MAL

Si el juez enfrenta **cualquier otra fila**, las tres compartidas coinciden y
salta la otra:

    → baja a juicio: columna_no_comparada (sin oposición en lo compartido;
      columnas asimétricas citadas: Profesional, Horas semana, Responsable,
      Jornada semanal)

⚠️ **Eso vale para las trece filas, no solo para Carlos Medina.** `Profesional`/
`Responsable` y `Horas semana`/`Jornada semanal` son asimétricas en TODAS. Lo
que distingue a Medina **no es la rama, es que él lleva una discrepancia real
detrás** (44 contra 40). La llamada corta debería confirmarlo **a él y solo a
él**; si confirma a otro, es falso positivo.

### S4 — LA CIFRA QUE FABLE PIDIÓ EN F-90 P4, por fin medible

Con **un candidato**, el techo es **una llamada corta por pasada**
(`verifyFindings` mete hasta 15 hallazgos por llamada). Su predicción era «de
una a cinco por análisis»: aquí no puede pasar de una, así que esta tanda **no
puede desmentirla, solo puede confirmar el extremo bajo**. Se apunta lo que
salga y se dice con ese límite delante.

### S5 — LO QUE PUEDE SALIR MAL, y ya está declarado

1. **Que el rerank aparte el candidato.** Es la única condición que la sonda no
   pudo verificar y la que invalidó la pasada extra del 31/08. Si sale
   `Rerank: 0 seleccionados`, **la pasada no mide nada** y se dice así.
2. **Que el juez no emita nada.** B.82: es intermitente. Un cero se reporta con
   la tasa que excluye —con dos pasadas, no descarta nada por debajo del 78%—,
   nunca como ausencia.

### S6 — QUÉ SERÍA HALLAZGO

- Que aparezca **`descartado.cubierto_por_diff`**: significaría que el
  emparejador encontró clave donde la sonda midió que no la hay.
- Que Belmonte salga por **`equivalentes`**: sería B.130 sin arreglar, o el
  reordenado mal cableado.
- Que la llamada corta **confirme una fila que no es Medina**.

---

## ⚠️ PARA LA PRÓXIMA TANDA — EL REPARTO DE CONTADORES CAMBIA (01/09, F-93)

*Escrito antes de lanzarla, para que nadie lea el cambio como una avería.*

El reordenado de F-93 partió una guarda que estaba conflada. **Las cifras
publicadas no cambian; cambia POR DÓNDE muere cada cosa.**

| Contador | Antes | Después |
|---|---|---|
| `descartado.cubierto_por_diff` | se llevaba las filas que ERAN pareja **y las que no** | solo las que **son pareja y R2 confirma** → **baja** |
| `descartado.emparejamiento_invalido` | **cero desde que se creó** | **pasa a moverse** |
| `a_juicio.columna_no_comparada` | no existía | aparece donde antes se decía `equivalentes` de más (B.130) |

**Lo esperado en el par grande**, con lo medido el 31/08 delante:

- IMP-03 y EST-03 legítimos —filas pareja, el precio difiere— siguen saliendo
  por **`cubierto_por_diff`**.
- **`dc678e1b`** (EST-02 contra EST-03, el falso de B.124) pasa a
  **`emparejamiento_invalido`**. Mismo hash, otro contador.
- **Las quince siguen siendo quince**, y `confirmados_por_estructura` sigue en
  cero.

**No es que empiece a fallar algo: empieza a contarse con su nombre lo que
siempre ocurría bajo otro.** Si `emparejamiento_invalido` sigue a cero en el par
grande, ESO sí sería el hallazgo — querría decir que la identidad no se está
verificando sobre pares emitidos, que es justo lo que este commit arregló.

---

## 31/08/2026 — `cceddf86` — PREDICCIÓN ESCRITA ANTES DE LANZAR

*Este bloque se escribe y se commitea ANTES de la primera pasada. Los
resultados se añaden debajo, en esta misma entrada, sin tocar lo de arriba: si
una predicción falla, es HALLAZGO y se cuenta, no se acomoda.*

**Qué valida esta tanda**: los cuatro puntos del frente 1 (supresión del juez,
verificación de la 3ª puerta, la traza, y «sin clave la estructura no firma»),
más la emisión del diff de F-88. Es todo lo que cambió el 29, el 30 y el 31.

### LO QUE NO ES PREDICCIÓN, SINO CÁLCULO

Cuatro cifras salen de correr el emparejador y la emisión sobre los mismos
ficheros de `corpus-pruebas/`, así que **no se estiman: se computan**. Si
producción no las da, no es que la predicción falle — es que producción no está
haciendo lo que el código hace con los mismos bytes.

| Dirección | Emite el diff | Clave |
|---|---|---|
| OPE-11 contra OPE-10 | **15** | sí |
| OPE-10 contra OPE-11 | **15** | sí |
| RRHH-06 contra OPE-02 | **1** — «Discrepancia en Puesto», la sembrada | `Empleado`, 100% única en los dos lados, 10 filas emparejadas |
| OPE-02 contra RRHH-06 | **1** | ídem |

### P1 — LAS TRES DE F-90, que son contra lo que se contrasta

1. **Quince exactas** en el contador, las dos direcciones del par grande.
2. **Cero fila-contra-fila del juez confirmados por estructura**, o sea
   `verificador.confirmados_por_estructura` = **0 en TODAS las pasadas de TODOS
   los casos**. Desde el punto 4 el juez no tiene camino a ese sello: si se
   mueve, alguien firma sin derecho.
3. **Ningún hallazgo del registro de siembra perdido.**

### P2 — LOS CASOS 1 Y 2 CAMBIAN DE PRODUCTOR, y su ficha no lo dice todavía

`Casos_Harness.md` dice de los casos 1 y 2 «confirmada **por estructura**», y
seguirá siendo verdad — pero **la firma otro**. RRHH-06/OPE-02 empareja con
clave, luego el diff emite la discrepancia de `Puesto` y **el hallazgo del juez
sobre ese mismo par sale suprimido** (`descartado.cubierto_por_diff`), igual que
pasó con OPE-11 el 30/08.

⚠️ **Cómo NO leer un cero aquí**: si `descartado.cubierto_por_diff` vale 0 en
alguna pasada, eso NO es un fallo — es que el juez no emitió nada sobre ese par,
y es intermitente por B.82. Lo que **no puede** aparecer es un
`confirmado.por_estructura` del juez. Ése sí sería el hallazgo.

### P3 — EL CONTROL DE REGRESIÓN NO SE MUEVE

Casos 3, 4, 8, 9, 10 y 11 y el control negativo 5 dan **lo mismo que su línea de
base**. El diff no toca prosa, así que cualquier cambio ahí es hallazgo — no hay
mecanismo previsto por el que pudiera moverse.

### P4 — EL COSTE: la cifra que Fable espera, y por qué el harness NO PODÍA DARLA

Fable predijo «de una a cinco llamadas cortas de Haiku por análisis, y si sale de
ahí, traedlo». **Con el harness tal como está escrito, esa cifra habría salido
CERO, y el cero habría sido del instrumento y no del sistema.**

El punto 4 solo actúa en **territorio sin clave**, y los dos pares de tablas del
harness **tienen clave los dos** — computado arriba. Todo hallazgo
fila-contra-fila cae antes, en la supresión. Luego `a_juicio.sin_clave` = 0 en
los casos 1, 2, 6 y 7, **por construcción del corpus**.

Es la misma clase de límite que B.121 (el corpus es simétrico, no puede detectar
una confusión de lados) y B.125 (el juez es intermitente, no puede reproducir su
propio fallo): **un instrumento que no puede fallar donde debería.**

**LA SALIDA, computada**: los cuatro cruces de tablas que NO son los pares del
harness caen por la PRIMERA puerta, con cero pares y cero tablas sin
intersección — OPE-10↔OPE-02, OPE-11↔OPE-02, OPE-10↔RRHH-06, OPE-11↔RRHH-06. Ahí
sí hay territorio sin clave. De ahí sale la **pasada extra** del plan, que no es
ningún caso del catálogo y no sustituye a ninguno.

### P5 — LA TRADUCCIÓN QUE HAY QUE HACER ANTES DE CONTESTARLE A FABLE

**`a_juicio.sin_clave` NO es «llamadas cortas», y confundirlos daría una cifra
inflada.** `verifyFindings` mete hasta **15 hallazgos por llamada**
(`MAX_PER_CALL`), y se invoca **una vez por documento candidato** con lo que haya
sobrevivido. Luego:

> cinco hallazgos degradados en un documento son **UNA** llamada, no cinco.

La cifra de Fable —1 a 5 llamadas— se corresponde con **1 a 5 documentos
candidatos que tengan al menos un degradado**, no con el contador. Las dos se
apuntan por separado.

Y el otro lado del balance, medido el 30/08 y que va en la misma resta: la
supresión bajó las candidatas al double-check de **17 a 15**.

### P6 — QUÉ HARÍA FALTA PARA QUE UNA PASADA NO VALGA

`stageFailures` presente. Es la regla del protocolo §4 y no se negocia: si el LLM
se cayó, las tasas no miden lo que se cree.

### RESULTADOS — PASADA 0 (humo), `cceddf86`

**OPE-11 contra OPE-10, rápido, corpus solo con esos dos.**

| | esperado | medido |
|---|---|---|
| `contradictions_found` | 15 (calculado) | **15** ✔ |
| `stageFailures` | ausente | **null** ✔ |
| `verificador.confirmados_por_estructura` | 0 | **0** ✔ |
| hallazgos con `origen: diff_tabular` | 15 | **15** ✔ |

P1 cumplida en sus tres puntos, en esta pasada. **Una pasada no es una tasa**
—la afirmación necesita las cuatro— pero el número calculado y el medido
coinciden, que es lo que la pasada 0 tenía que decidir.

#### ⚠️ EL FALSO POSITIVO DE B.124 REAPARECIÓ, Y SALIÓ DESCARTADO

    [dc678e1b] "Profesional asignado para Carilla de composite (EST-03)"
       → descartado: cubierto_por_diff

`dc678e1b` es el hash del falso ORIGINAL del 30/08. El hash es
`hashCitationPair(newDocSays, existingDocSays)` — las dos citas—, así que es
**el mismo hallazgo**, no uno parecido.

**Lo que cambia**: B.124 pasa a tener verificación en producción. **Lo que no**:
B.125 sigue vigente. Lo que no se podía garantizar era que el fallo OCURRIERA,
no que la guarda FUNCIONARA — y sigue sin poderse pedir. Que hoy tocara no
convierte la pantalla en instrumento.

**Y la fabricación quedó validada de paso**: el caso de
`cascada-emparejamiento.test.ts` produce **el mismo hash `dc678e1b`**. Construir
el caso a mano no era un apaño: era el mismo hallazgo por la función de
identidad del propio sistema.

#### NOTA DE MÉTODO: muere por DOMINANCIA, no por verificación

Salió por `cubierto_por_diff`, no por `emparejamiento_invalido`. Correcto —el
par está emitido y la supresión se lo lleva antes de que R2 verifique nada— pero
hay que tenerlo escrito: **la guarda de identidad de la 3ª puerta no está
cazando el caso que motivó el frente, está de reserva.** Su contador a cero no
dice que el falso no ocurra; dice que muere antes. Anotado junto a las dos
guardas en `pipeline.ts`.

### RESULTADOS — TANDA 1, casos 6 y 7, `cceddf86`

Once pasadas contando la 0: **OPE-11 → OPE-10** cinco rápidas y una exhaustiva;
**OPE-10 → OPE-11** cuatro rápidas y una exhaustiva. **Quince en todas.**

| Predicción | Resultado |
|---|---|
| **15 exactas** (número CALCULADO antes de lanzar) | **✔ en las once**, las dos direcciones |
| **Cero fila-contra-fila del juez confirmados por estructura** | **✔** — todo hallazgo del juez salió descartado |
| **Ningún hallazgo del registro de siembra perdido** | **✔** — las 15 sembradas |
| `a_juicio.sin_clave` = 0 *(predicho, y predicho como inútil)* | **✔ 0**, porque el par tiene clave. La cifra del coste sigue sin medirse |

#### LA SUPRESIÓN ACTÚA SOBRE LO QUE EL JUEZ ENCUENTRE, NO SOBRE UN CASO

Es el resultado más importante de la tanda y no estaba en la predicción.

| Dirección | Lo que emitió el juez | Destino |
|---|---|---|
| OPE-11 → OPE-10 | IMP-03, EST-03 | descartados: `cubierto_por_diff` |
| OPE-10 → OPE-11 | **PRO-03** — hallazgo distinto, nunca visto antes | descartado: `cubierto_por_diff` |

`cascada-emparejamiento.test.ts` demuestra el CABLEADO sobre un hallazgo
fabricado. **PRO-03 es la generalización que un caso fabricado no podía dar**:
un hallazgo que nadie previó, en la dirección contraria, tratado igual. La
guarda no reconoce un caso — reconoce una situación.

#### LA INCIDENCIA DEL FALSO DE B.124, MEDIDA POR PRIMERA VEZ

En OPE-11 → OPE-10, de seis pasadas: **`dc678e1b` en tres**, las tres
descartadas. Y en dos más el detector de narración mató antes lo que parecía el
mismo hallazgo.

⚠️ **Precisión sobre esas dos**: el hash es `hashCitationPair` sobre las dos
citas, y una narración NO es una cita — luego esas dos **no llevan el mismo
hash** y no se pueden afirmar como el mismo hallazgo. Cuentan como «el juez
volvió a enfrentar esas filas», no como `dc678e1b`.

**Lo que esto le hace a B.125**: el 30/08, cuatro pasadas dieron CERO
apariciones y de ahí salió «no se puede reproducir». Hoy, tres de seis con hash
idéntico. **El cero de aquel día era mala suerte, no una tasa baja.** El límite
de B.125 sigue siendo real —no se puede PEDIR que ocurra— pero su premisa
implícita, que el fallo es raro, queda desmentida: es frecuente.

#### LAS DOS EXHAUSTIVAS: 15 candidatas, 0 a Sonnet

`particionDoubleCheck` separa por `confirmedBy === 'estructura'`, y las quince lo
son. Ninguna llega al modelo caro: es F-64/F-71 funcionando —ningún modelo
revierte un veredicto determinista—, no una avería.

El **17 → 15** queda confirmado en las dos direcciones.

⚠️ Y deja una consecuencia de producto que no es de este frente: **el exhaustivo
no hizo NADA que el rápido no hiciera**, y cuesta 30 créditos frente a 5. Ver
B.127.

#### CINCO SOLAPAMIENTOS DESCARTADOS, Y SOLO EN UNA DIRECCIÓN

En OPE-10 → OPE-11, cinco por pasada, todos por **«cita de línea de contexto, no
citable»** (`citaDeContexto`, judge.ts:522). Son las filas idénticas otra vez,
por una tercera puerta. Ver B.122, donde se anota: es el mismo recorte, no un
pendiente nuevo.

**La asimetría no está explicada, y la explicación obvia está REFUTADA**: las dos
tablas tienen **60 filas** y OPE-11 es incluso mayor (15.459 caracteres frente a
14.540), así que no es que una quepa en el prompt y la otra no. Qué haría falta
para cerrarlo, en B.122.

#### CON EL LOG DELANTE: TRES COSAS QUE EL RESUMEN NO DECÍA

*Añadido el 31/08, al recibir los logs. Lo de arriba se escribió sobre el
resumen de la pasada; esto lo corrige donde hacía falta.*

**1. ⚠️ EL EXHAUSTIVO SÍ HIZO ALGO QUE EL RÁPIDO NO — me equivoqué.** El bloque
de arriba decía «no hizo NADA que el rápido no hiciera». El log dice:

    [style-check] "OPE-11...": 15 problemas de estilo (9255ms)

Nueve segundos de modelo y quince problemas de estilo que el rápido no produce.
Lo cierto es lo otro: **cero enviadas a Sonnet**, y por la razón correcta. La
cuenta real es 25 créditos netos (30 menos 5 de precio variable) contra 7 de
rápido + estilo por tarifa — no 30 contra 5. B.127 corregido.

**2. LA ASIMETRÍA DE LOS SOLAPAMIENTOS: ES DEL JUEZ, y se resuelve por el
criterio escrito ANTES de tener el dato.** `selectionLimits` es prácticamente
igual en las dos direcciones —38/60 y 39/60 fuera por tamaño— y **las dos
construyen la línea de contexto** (`contexto_no_citable: 1` en ambas). El
fragmento marcado existe siempre.

Y el juez emite **cinco solapamientos en las dos**. Lo que cambia es dónde
aterriza la cita:

| Dirección | Cinco solapamientos | Destino |
|---|---|---|
| OPE-11 → OPE-10 | sí | **ninguno descartado: se publican** — es el síntoma 2 de B.122, el volcado |
| OPE-10 → OPE-11 | sí | **los cinco por `citaDeContexto`** — el síntoma 3 |

**No son dos problemas: es uno con dos salidas.** Anotado en B.122.

**3. LÍMITE DE LECTURA DEL MODO RÁPIDO, que acota lo que el juez puede decir:**

    [judge] "OPE-11...": documento analizado truncado a 6000 de 7342 caracteres

`NEW_DOC_LIMIT_QUICK = 6000` (judge.ts:35), deliberado. **El juez vio el 82 % del
documento analizado en todas las rápidas de esta tanda.** No afecta al diff —lee
todos los chunks, no el prompt— pero sí a cualquier lectura del tipo «el juez no
encontró X». El exhaustivo no trunca.

**De propina, dos cosas del log del worker que no se buscaban:**

    [worker] Job 82cc28ad...: 1 descartes permanentes de la org

La persistencia de descartes de F-86 paso 3 **está viva en producción** y tiene
su primer registro. Primera evidencia fuera del laboratorio.

Y `0 ids de tanda (rápido)` en todas: el documento del corpus ya estaba indexado,
así que se encontró como candidato sin pasar por `batchDocumentIds`. El
resultado es equivalente —1 candidato en todas— pero conviene saberlo para
reproducir: no se ejercitó ese mecanismo.

---

## PREDICCIÓN — TANDA 2 (casos 1 y 2), escrita antes de lanzar

**Calculado, no estimado**: el diff emite **1** en cada dirección, y es la
sembrada — *«Discrepancia en Puesto entre RRHH-06 y OPE-02»*, el `Puesto` de Dr.
Pablo Reyes. Clave `Empleado`, 100 % única en los dos lados, **10 filas
emparejadas** y **5 de RRHH-06 sin pareja**.

| Qué mirar | Esperado |
|---|---|
| `contradictions_found` | **1** en las dos direcciones |
| `confirmedBy` / `origen` | `estructura` / `diff_tabular` |
| `verificador.confirmados_por_estructura` | **0** |
| `a_juicio.sin_clave` | **0** — el par tiene clave |
| Si el juez emite el mismo hallazgo | `descartado: cubierto_por_diff` |
| Grupo «Sin correspondencia» en la ficha | 5 filas |

**La ficha del caso dirá la verdad con otro firmante.** `Casos_Harness.md` dice
«confirmada por estructura» y lo seguirá siendo — pero la firma el diff, no el
juez. Si aparece un `confirmado.por_estructura` del juez, **eso sí es hallazgo**.

**Y la dirección B (OPE-02 contra RRHH-06) es la que falló tres semanas** (B.81).
Ahora la produce el diff, que es simétrico por construcción: si una dirección da
1 y la otra 0, el fallo no sería del juez esta vez.

### ⚠️ Y UNA PREDICCIÓN QUE PONE A PRUEBA LA «CAUSA ÚNICA» DE B.122, GRATIS

B.122 sostiene que sus tres síntomas existen **porque la tabla no cupo en el
prompt**. Este par lo comprueba sin lanzar nada extra, porque **las dos tablas
caen a lados distintos del presupuesto de 3.000 caracteres**:

| Documento del corpus | Tamaño de su tabla | Predicción |
|---|---|---|
| **OPE-02** (en RRHH-06 → OPE-02) | 10 filas, **1.950 car.** — cabe | **nivel 1**: sin colapso, sin línea de contexto, sin aviso de alcance, sin `citaDeContexto` |
| **RRHH-06** (en OPE-02 → RRHH-06) | 15 filas, **4.574 car.** — no cabe | **nivel 2**: colapso, línea de contexto, aviso de alcance |

Si sale así, la causa única de B.122 queda demostrada con un caso que no se
diseñó para eso. **Si en la dirección de OPE-02 aparece nivel 2 o una línea de
contexto, la causa única es falsa** y hay que reabrir el pendiente entero.

---

### RESULTADOS — TANDA 2, casos 1 y 2, `cceddf86`

**Diez pasadas**: ocho rápidas y dos exhaustivas, las dos direcciones.

| Predicción | Resultado |
|---|---|
| **1** contradicción por pasada (número CALCULADO) | **✔ en las diez** |
| `confirmedBy: estructura` / `origen: diff_tabular` | **✔** |
| `verificador.confirmados_por_estructura` | **✔ 0** en todas |
| `a_juicio.sin_clave` | **✔ 0** — el par tiene clave |
| El juez emite lo mismo → `cubierto_por_diff` | **✔** — `19f92748` y `77c04c10`, las dos direcciones |

**El cambio de productor funcionó sin perder nada.** La ficha del caso sigue
diciendo la verdad —«confirmada por estructura»— con otro firmante. Y la
dirección B, la que falló tres semanas (B.81), da 1 igual que la A: el diff es
simétrico por construcción.

#### LA CAUSA ÚNICA DE B.122, DEMOSTRADA POR UN CASO QUE NO SE DISEÑÓ PARA ESO

Predicción escrita antes de lanzar, y el corte cae donde se dijo:

| Corpus | Su tabla | Nivel | `contexto_no_citable` | Solapamientos |
|---|---|---|---|---|
| **OPE-02** | 2.116 car. | **1**, completa, 10 filas | **no** | ninguno descartado |
| **RRHH-06** | 2.397 car. tras colapsar | **2**, 9 colapsadas | **sí** | descartados |

Las dos tablas caen a lados distintos del presupuesto de 3.000 y **el
comportamiento se separa justo por ahí**. B.122 sostenía que sus síntomas
existen porque la tabla no cupo; aquí se ve con el mismo par, las mismas dos
direcciones y nada más cambiando.

#### ⚠️ Y UNA PARTE DE LA PREDICCIÓN, FALLADA — se cuenta, no se acomoda

Predije «aviso de alcance» para la dirección de RRHH-06. **No lo hay**: el log
dice `resumen + 15/15 filas`, **ninguna fuera por tamaño**.

**El colapso de las 9 idénticas es LO QUE HACE QUE QUEPA.** Luego los síntomas
de B.122 no son un trío fijo: el aviso de alcance es un cuarto escalón que
necesita que **ni siquiera después de colapsar** quepa — el caso de OPE-10 /
OPE-11 (38/60 fuera), no éste. Anotado en B.122.

#### EL HALLAZGO DE LA TANDA: B.128

El juez emitió **«Horas semanales de Dra. Ana Belmonte»** en dos pasadas, y
`Horas semana` **existe solo en OPE-02**. Comprobado contra el corpus: las
columnas compartidas del par son **dos** —`Empleado` y `Puesto`— de **dieciocho**
distintas, y el diff compara **una** (`Puesto`, porque `Empleado` es la clave).

El hallazgo **pasó la verificación de citas** y murió por `cubierto_por_diff`
con un motivo que **para esa columna es literalmente falso**.

**La supresión suprime por FILA; el diff compara por COLUMNA COMPARTIDA.** El
hueco es el territorio de las omisiones. Hoy no se pierde nada porque el caso
era malo; el mecanismo se llevaría igual uno bueno. **B.128, y va a Fable** por
la regla de la doble lectura: «que el diff ya comparó» admite las mismas dos
lecturas que «todas las columnas comunes», y ya hay caso medido que las separa.

#### «cita no verificable, lado=ambos»: forma nueva, no mecanismo nuevo

Es `citaNoVerificable` con `failedSide='ambos'` (judge.ts:534) — las dos citas
fallan a la vez. Lo nuevo es lo que el juez escribió: **se fabricó una tabla
propia en cada lado** y la presentó como cita.

    nuevo="Dra. Marta Gil | Odontóloga general | Box 1, Dr. Javier Soto | ..."
    existente="Dra. Marta Gil | Odontóloga general, Dr. Javier Soto | ..."

No es narración, no es la línea de contexto: es **enumeración**. Tercera forma
de la enfermedad de B.107 —la cita literal la escribe el modelo— y la primera
vista en la vía de solapamientos, alimentada otra vez por el material de las
filas idénticas de B.122.

#### DE PASO: el precio variable, funcionando

Las dos exhaustivas: `estimatedCost: light (1 contradicciones)` → **devueltos 10
créditos** cada una. Coste neto 20, con 3 y 4 problemas de estilo entregados.
Es el tramo que B.127 decía que había que mirar, comportándose bien.

---

### RESULTADOS — PASADA EXTRA (territorio sin clave), `cceddf86`

**OPE-11 analizado, con OPE-10 y RRHH-06 en el corpus. Una pasada.**

**NO MIDIÓ LO QUE SE BUSCABA, y así queda.**

    Retrieval: 2 candidatos
    Rerank: 1 seleccionados

RRHH-06 llegó al retrieval y **el rerank lo descartó**. El juez no lo vio, así
que el cruce sin clave no se ejerció. Era el caso que la instrucción de la
pasada anunciaba como invalidante — y se declara, no se reinterpreta.

**La rama sin clave sigue sin ejercerse en producción, y ahora se sabe que hay
DOS barreras independientes**: ningún cruce del corpus tiene dos columnas
compartidas (B.129), y el único que tiene una, el rerank no lo deja pasar. La
segunda es la peor noticia: un documento de siembra futuro tendría que
**parecerse** al tarifario y **no compartir clave** con él, y eso es más difícil
de sembrar de lo que parecía.

**Lo que sí valió**: 15 discrepancias contra OPE-10 y el hallazgo del juez
suprimido, **con tres documentos en el corpus en vez de dos**. El diff no se
despista con más candidatos. Control de regresión gratis, aunque no fuera el
objetivo.

#### Y un mensaje de log que mentía: «Chunks para verificación: 2/1»

Numerador y denominador contaban **poblaciones distintas** —
`chunksByDocument.size` es el mapa de **retrieval** (2, que trae de más a
propósito por F-41) contra `reranked.length`, la población del **rerank** (1).

**El comportamiento era correcto**: los dos consumidores usan el mapa como
diccionario, recorriendo `reranked` y `rawJudgments`, así que un documento que
el rerank tiró no se procesa. Lo falso era la línea. **Corregido** — el
numerador se cuenta ya sobre `reranked`.

Nunca se había visto porque hasta hoy retrieval y rerank devolvían siempre lo
mismo en el harness. **Hizo falta la primera pasada con tres documentos.**

⚠️ **La corrección NO está desplegada**: la tanda mide `cceddf86`. En la tanda 3
la línea seguirá mintiendo en el **caso 5** (MKT-01 con los otros cuatro), que
es el único con más de dos documentos. En los demás pares no se nota.

---

### RESULTADOS — TANDA 3, control de regresión, `cceddf86`

**Once pasadas.** Seis con **un solo candidato** (los tres pares de prosa, las
dos direcciones) y cinco con cuatro documentos marcados (el grupo del piloto,
que es donde vive el caso 5).

| Caso | Dirección | Resultado |
|---|---|---|
| 3 · CLI-03 → NOR-01 | aislada | **confirmado por juicio** (`57fbe32c`) |
| 4 · NOR-01 → CLI-03 | aislada | **confirmado por juicio** (`b4768783`) |
| 8 · NOR-10 → CLI-12 | aislada | **0** — ver abajo |
| 9 · CLI-12 → NOR-10 | aislada | **0** — ver abajo |
| 10 · NOR-11 → CLI-13 | aislada | **confirmado por juicio** (`14123c6f`) |
| 11 · CLI-13 → NOR-11 | aislada | **confirmado por juicio** (`9d19a20b`) |
| 5 · MKT-01 con los otros cuatro | condición del caso | **0 y 0** con dos documentos juzgados |

`confirmados_por_estructura` = **0** en las once. **Sin regresión en prosa.**

#### EL AISLAMIENTO FUNCIONÓ, Y ES LA PRUEBA DE LA MANIOBRA DEL `pendiente`

Las seis pasadas de prosa dieron **`Retrieval: 1 candidatos`** con `1 ids de
tanda`. No es suerte: con `CORPUS_ACTIVO` vacío —los once documentos puestos a
`pendiente` en Supabase y proyectado a Pinecone con el reconciliador—, el `$or`
de `buildCorpusFilter` deja pasar **exactamente** el id marcado.

La maniobra sustituye al vaciado y resincronización de Drive, y es **reversible**
sin tocar `reviewed_at`.

Las cinco pasadas con **cuatro** ids son otra cosa y no contaminan nada:
· **El caso 5 EXIGE cuatro acompañantes.** Es su condición, no ruido. El rerank
  seleccionó **2 de 4** (OPE-02 y RRHH-06) y los juzgó con 0 y 0. El caso se
  cumple —tenía material delante y no inventó— pero es **un control más débil**
  que si hubiera juzgado los cuatro. Anotado.
· **Las otras cuatro son REPETICIONES** de casos ya medidos aislados (3 y 4 hoy
  a las 15:07; 1 y 2 en la tanda 2). Dieron **los mismos hashes** y el mismo
  resultado. Corroboran en condiciones más ruidosas; no sustituyen a nada.

⚠️ **Lo frágil, dicho**: en esas cuatro el rerank **pudo elegir mal y no lo
hizo**. Si alguna hubiera dado 0, no se habría podido distinguir «regresión» de
«el rerank eligió otro candidato» — que es exactamente lo que pasó en la pasada
extra con RRHH-06.

#### NOR-10 / CLI-12 DA CERO — Y NO ES REGRESIÓN

Está registrado desde el **26/08/2026** en `claude/Casos_Harness.md`, sección
«LÍNEA DE BASE» de los casos 6-9, medido sobre `87a76112`: **prosa larga, 3
sembradas, 0 publicadas**.

Y no coincide solo el número: **las dos causas de muerte estaban nombradas allí**
y son las de hoy — `mismo_dato_sin_oposicion` en una dirección,
`citaNoVerificable` en la otra. El cuello también: *«de 66 fragmentos
recuperados de NOR-10 entraron 3»*, y hoy `3 dentro, 63 fuera (prosa 3/66),
2616/3000 caracteres`.

Es el **frente 4 del mapa del MVP** —la prosa— intacto. El frente 1 no lo tocó
ni pretendía tocarlo.

#### EL `4/1` SALIÓ DONDE SE PREDIJO

Las cinco pasadas de cuatro documentos son las únicas que enseñaron
`Chunks para verificación: 4/1` y `4/2`. La corrección está hecha desde el 31/08
y **sin desplegar**, porque la tanda medía `cceddf86`.







---

## 30/08/2026 — `06952da4` — LA SUPRESIÓN DEL JUEZ: 17 → 15

**Qué se lanzó**: dos pasadas exhaustivas y dos rápidas de OPE-11 contra
OPE-10, con la supresión de F-89 P4 desplegada y NADA MÁS que cambiara
comportamiento — los otros dos commits del despliegue eran batería
(`7989e0aa`) y una traza sin consumidor (`1924cb5a`). La cifra es atribuible a
un solo cambio, y se separó a propósito del punto 3 para que lo siguiera
siendo.

**La pregunta**: F-89 P4 dice que el juez no aporta nada sobre un par de tablas
que el diff ya comparó — «en el mejor caso un duplicado, en el peor un
emparejamiento inventado». La línea de base, medida el mismo día ANTES de la
supresión, era **17 contradicciones: las 15 del diff más 2 del juez**. Las dos
del juez eran LEGÍTIMAS y las dos ya estaban dentro de las quince.

| | antes | después |
|---|---|---|
| contradicciones publicadas | **17** | **15** |
| del juez, fila-contra-fila sobre el par emitido | 2 | **0** |

Del log de las dos pasadas exhaustivas:

    [4e18e79b] IMP-03 → descartado: cubierto_por_diff
    [0f3269d9] EST-03 → descartado: cubierto_por_diff
    Completo — 15 contradicciones

Y en los dos rápidos, lo mismo: verificador con **0 confirmados, 1 descartado
por cubierto_por_diff**.

### LA GANANCIA QUE NO ESTABA PREVISTA: el duplicado tampoco iba a Sonnet

Las candidatas al double-check bajan **de 17 a 15**. No se había anticipado —
la supresión se diseñó para no publicar duplicados, y resulta que además NO SE
LOS ENVÍA al modelo caro. Cada duplicado suprimido es una candidata menos en el
lote de Sonnet del exhaustivo.

No cambia ninguna decisión, pero conviene tenerlo escrito: al estimar el coste
del punto 4 —que va en la dirección contraria, mandando MÁS cosas a la llamada
corta— este ahorro está en el mismo balance.

### B.107, EN VIVO Y EN PRODUCCIÓN

En los dos rápidos el juez escribió **«No aparece EST-03 en el documento
nuevo»** donde debía ir una CITA, y el detector de narración lo descartó bien.

Es la primera vez que B.107 se ve fuera del laboratorio: hasta hoy tenía casos
construidos y ninguna aparición medida. Confirma las dos mitades del pendiente
—que el juez narra en vez de citar, y que el detector lo caza— y que el fallo
es real y no una posibilidad teórica. Anotado también en B.107.

---

## 28/08/2026 — `d13e125f`, 14:24 UTC — EL TERCER PUNTO DE SERIALIZACIÓN (F-86 paso 0)

> **NO ES UNA TANDA DE TASAS**, y conviene que se lea distinta desde la primera
> línea: no mide QUÉ encuentra el sistema, sino si un campo SOBREVIVE el viaje
> hasta el jsonb. Se apunta aquí igualmente porque el §4 del protocolo manda
> que las mediciones se acumulen en este fichero, y porque dejarla solo en el
> mensaje de commit es exactamente cómo se perdió la tabla del relevo del 25/08.

**Qué se lanzó**: dos análisis en modo **rápido** desde la interfaz, sobre los
casos 1 y 2 del corpus piloto (**RRHH-06** y **OPE-02**) — el par de tabla, con
la contradicción sembrada de siempre.

**La pregunta**: `d13e125f` propaga `existingDocumentId` al lado del nombre por
los nueve sitios del recorrido, y su batería
(`lib/analysis/recorrido-id-documento.test.ts`) sigue el dato hasta
`Problem.relatedDocId` cruzando un ida y vuelta por JSON. Lo que la batería
**no alcanza** son los tres puntos de serialización reales, que son rutas de API
y worker. El tercero —`analysis_results.analysis`, el jsonb que la bandeja
relee meses después— es el que sostiene el commit siguiente (la persistencia de
descartes). ¿Llega el campo de verdad, o solo lo parece al leer el código?

**MARGEN DE DESPLIEGUE — CERRADO, y con holgura.** Push de `d13e125f` a las
**13:40:30 UTC** (reflog de `origin/main`); el primer análisis medido, a las
**14:24 UTC**. **43 minutos.** Es el margen que la tanda del 27/08 no pudo
cerrar (4 min 12 s), y aquí no hay duda de qué código corrió.

| Análisis | Hora (UTC) | Código | discrepancias | con id | solapamientos | con id |
|---|---|---|---|---|---|---|
| RRHH-06, rápido | 14:24 | `d13e125f` | 1 | **1** | 1 | **1** |
| OPE-02, rápido | 14:24 | `d13e125f` | 1 | **1** | 2 | **2** |
| *(control negativo)* | 07:49 | anterior | 1 | **0** | *no anotado* | — |
| *(control negativo)* | 07:49 | anterior | 1 | **0** | *no anotado* | — |

**El detalle de la última fila**, nombre e id enfrentados sobre la misma
contradicción:

| nombre | id | asunto |
|---|---|---|
| `OPE-02_agenda-y-gestion-de-citas.xlsx` | `099ffac9-7ba6-437e-8bc4-b5624cb0f695` | Puesto de Dr. Pablo Reyes |

### EL CONTROL NEGATIVO ES LO QUE HACE VALER ESTA MEDICIÓN

Sin él, «el campo está» no distingue entre **el commit funciona** y **la
consulta miente** — y una consulta con `jsonb_exists` sobre un campo que se
escribiera solo se habría visto igual de verde. Los dos análisis de las 07:49
corrieron con el código anterior, sobre el **mismo corpus** y la **misma
contradicción sembrada**, y salen con **0 de 1**. La consulta discrimina, y por
tanto el 1 de 1 de las 14:24 significa algo.

### LO QUE ESTA MEDICIÓN NO CONTESTA

- **Los otros dos puntos de serialización siguen sin medir.** El literal de
  respuesta de `app/api/analyze-v2/route.ts:545` es un objeto **distinto** del
  que se persiste (`:453` pasa el `analysis` entero), así que ver el jsonb NO
  prueba lo que llega a la pantalla. Y el `result` del job
  (`worker/src/index.ts:137`) es un tercero.
- **El camino EXHAUSTIVO no se ha tocado.** Las dos pasadas son rápidas: corren
  en Vercel. El exhaustivo corre dentro del worker de Railway, cuyo redespliegue
  no se ha comprobado. Que el rápido llegue no dice nada del exhaustivo.

---

## 27/08/2026 — `8cf73e23` — CASO DE CONTROL NOR-11 / CLI-13

**Qué se lanzó**: el par de prosa del caso de control, con el bloque del
verificador (F-77) ya desplegado. *Hora exacta no anotada; posterior a la tanda
que sigue.*

**La pregunta**: la de B.105. El ejemplo del bloque es «mismo rol, dos personas»,
que es el mismo objeto que la siembra A. Si solo se movía la A, el acierto sería
circular — el modelo aplicando un ejemplo casi idéntico, no el mecanismo. Este
par existe para preguntar si **generaliza a superficies que el bloque no enseña**.

| # | Contradicción sembrada | Superficie | Resultado |
|---|---|---|---|
| 1 | Plazo: **72 h** frente a **7 días** | dos cifras de tiempo enfrentadas | **CONFIRMADA** |
| 2 | Lugar: **Chamberí** frente a **Retiro** | dos topónimos | **CONFIRMADA** |
| 3 | Negación categórica sobre el contenedor negro | una prohibición frente a una autorización | **EL JUEZ NUNCA LA EMITE** |

### EL BLOQUE GENERALIZA. La pregunta de B.105 queda contestada

**Dos superficies nuevas, ninguna sobre roles ni personas, confirmadas.** Un
plazo y un topónimo no se parecen al ejemplo del prompt («la responsable del área
es Ana Ruiz» frente a «es Beatriz Soler»): lo único que comparten con él es el
mecanismo —mismo dato, dos valores—, que es exactamente lo que el bloque enseña.

Es la respuesta que este par existía para dar, y es afirmativa. La sospecha de
circularidad anotada en B.105 queda descartada **para el verificador**.

**Lo que NO contesta**: la tercera no llega a medirse aquí, porque **el juez no
la emite**. Eso es un techo anterior al verificador y tiene pendiente propio —
ver **B.106**: en documentos de 4 y 5 páginas el juez devuelve exactamente una
contradicción por par, y no es la selección.

---

## 27/08/2026 — `8cf73e23`, logs 12:04–12:31 UTC — EL BLOQUE DEL VERIFICADOR (F-77)

**Qué se lanzó**: cuatro pasadas, modo rápido desde la bandeja, con el bloque
nuevo de `verify-findings.ts` desplegado.

> **⚠️ MARGEN DE DESPLIEGUE SIN CERRAR, y ya no se puede cerrar.** El push de
> `8cf73e23` fue a las **11:59:48 UTC** (reflog de `origin/main`) y la tanda
> arranca a las **12:04 UTC**: **4 min 12 s**. No se comprobó a tiempo la hora de
> «Ready» del deployment en Vercel ni el redeploy del worker en Railway. Si
> alguno terminó después de 12:04, las primeras pasadas midieron el prompt viejo.
>
> **QUÉ ACOTA ESE MARGEN, Y QUÉ NO.** Las pasadas 1 y 3 corrieron con **el mismo
> código, fuera el que fuera**: doce minutos separan una de otra, dentro de la
> misma ventana. Así que **la diferencia entre ellas no puede atribuirse al
> despliegue** — se explica por las citas distintas, que es lo que dice la
> sección siguiente. El margen afecta a **si el bloque estaba vivo en absoluto**,
> no a la comparación entre las dos pasadas, que es de donde sale la conclusión
> de esta entrada.

| # | Qué entró | Resultado |
|---|---|---|
| 1 | **NOR-10 / CLI-12 solos** | Siembra A **DESCARTADA** (`mismo_dato_sin_oposicion`). Hallazgo `[04ed1945]` |
| 2 | **CLI-03 / NOR-01** (control de regresión) | **Confirmado en todas las pasadas.** El acierto histórico de prosa sigue vivo |
| 3 | **Los CINCO juntos**: NOR-10, CLI-12, CLI-03, NOR-01 y MKT-01 | Siembra A **CONFIRMADA**, dos pasadas. Hallazgo `[9b37aa92]` |
| 4 | **MKT-01** | **Cero hallazgos** |

> **CINCO Y CUATRO NO SE CONTRADICEN, cuentan cosas distintas.** En la pasada 3
> hay **cinco documentos en la tanda**, y el log de cada análisis dice **«4 ids
> de tanda»**: son los **compañeros** de ese análisis, es decir, los otros cuatro
> vistos desde el documento que se está analizando. Cinco en la tanda, cuatro
> compañeros para cada uno. Las dos cifras son correctas.

### EL MATIZ QUE MANDA: no es el mismo hallazgo

**Los hashes son distintos.** En la pasada 1 el hallazgo es `[04ed1945]` y muere;
en la 3 es `[9b37aa92]` y sobrevive. El hash se calcula sobre las citas crudas
(F-38), así que **hashes distintos significa citas distintas**.

> **El bloque NO rescató el par de citas de la pasada 1. Confirmó OTRO par**, que
> apareció porque con los cinco documentos en la tanda el retrieval trajo
> fragmentos distintos de NOR-10 — entró el **chunk 2, score 0,932**.

Leerlo como «el bloque arregla la siembra A» sería exactamente el error que la
advertencia de F-73 describe: atribuir a la etapa que se tocó un cambio que
produjo otra. Lo que estas cuatro pasadas dicen, con precisión:

- **El bloque funciona cuando le llegan las citas buenas.** La pasada 3 lo
  demuestra, y el caso de control NOR-11/CLI-13 lo confirma sobre superficies que
  el bloque no enseña.
- **Qué citas llegan lo decide la SELECCIÓN**, y eso no lo toca F-77. La misma
  contradicción, en el mismo par de documentos, produce citas verificables o no
  según qué fragmentos de NOR-10 entren — y eso depende de **con qué compañía se
  lance la tanda**: dos documentos en la pasada 1, cinco en la pasada 3. Es una
  variable que nada en el sistema controla y que el cliente no ve.
- Es la confirmación, ahora sobre prosa, de lo que el análisis de F-76 dejó
  dicho: **en prosa larga el cuello es la selección**, no la verificación.

**Lo que NO afirma**: que la siembra A esté detectada. Está detectada *en una
configuración de tanda*, por un par de citas distinto del que falló, y con dos
pasadas. El protocolo pide cuatro por dirección para hablar de tasas.

---

## 27/08/2026 — `94ad06a0` — EXPERIMENTO F-73, tres estados

**Qué se lanzó**: el par de tablas **RRHH-06 / OPE-02**, los dos sentidos,
**cuatro pasadas por dirección y por estado**. Tres estados del mismo commit,
alternados con la variable `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` en el worker de
Railway.

**La pregunta**: por qué el modo exhaustivo NO detectaba la contradicción del
Puesto de Dr. Pablo Reyes en la dirección `OPE-02 → RRHH-06`, cuando el rápido
sí. Hasta `94ad06a0` el exhaustivo se saltaba entera la selección y se llevaba
los fragmentos en bruto.

### Dirección OPE-02 → RRHH-06 (la que fallaba)

| Estado | Qué ve el juez | Tasa |
|---|---|---|
| **Base** — sin selección | 15 filas en bruto | **0/4** |
| **Estado 1** — 3000, destilado | resumen + 9 filas, de las cuales 9 colapsadas → 6 líneas | **4/4** |
| **Estado 2** — 6000, nivel 1 | la tabla entera, 15 filas sin colapsar | **0/4** |

### Dirección RRHH-06 → OPE-02 (la que ya funcionaba)

**Detecta en los tres estados.** Y el motivo importa para leer bien la tabla de
arriba: la tabla de OPE-02 tiene **10 filas y cabe entera** en cualquiera de los
tres presupuestos, así que **la destilación nunca llega a actuar** en ese
sentido. No es que el estado no le afecte: es que para esa tabla los tres
estados son el mismo.

### El mecanismo aislado: EL COLAPSO DE IDÉNTICAS

Los tres estados dibujan una curva que no es monótona —0, 4, 0— y eso descarta
«más material es mejor» y también «menos material es mejor». Lo que separa al
estado 1 de los otros dos no es el volumen: es que **es el único donde el
colapso de filas idénticas actúa**. En base no hay selección; en estado 2 la
tabla entra completa por nivel 1, y el nivel 1 no colapsa nada.

Nueve filas que colapsan a seis líneas es lo que hace visible la fila que
difiere: las que coinciden se resumen en una línea de contexto y la discrepante
queda sola, en vez de enterrada entre catorce vecinas del mismo formato.

**Y NO es la prosa.** El desglose por tipo del log (añadido en `94ad06a0`
justo para poder responder esto) confirma que **la prosa entró igual en los dos
estados, 4/4 unidades**. La diferencia entre 4/4 y 0/4 no puede atribuirse a
material de prosa que entrara en uno y no en otro.

### Lo que esta tanda NO mide

**La esquina «destilado y grande».** Los tres estados cubren tres de las cuatro
combinaciones:

| | Sin destilar | Destilado |
|---|---|---|
| **Poco material** | — | Estado 1 ✅ medido |
| **Mucho material** | Base y Estado 2 ✅ medidos | **❌ SIN MEDIR** |

No se ha medido qué pasa con **una tabla grande que además se destila** — por
ejemplo, un presupuesto alto sobre una tabla de cuarenta o noventa filas, donde
el nivel 1 no cabe y el colapso sí actúa sobre muchas filas. Toda la conclusión
de esta tanda descansa en una tabla de 15 filas.

**Y el tope de piezas es un confundidor conocido para esa esquina**:
`MAX_FRAGMENTS_PER_DOC_QUICK = 25` bloquea el nivel 1 con cualquier
presupuesto en una tabla de más de ~24 filas (OPE-06 son 94 + resumen = 95
piezas), así que medir ahí sin parametrizarlo mediría otra cosa.

---

## 26/08/2026 — `a775a7c7`

**Qué se lanzó**: los cinco casos, modo rápido, desde la bandeja de revisión.
Org de pruebas `5a82712f-6740-4792-b291-3fdea8e6edb1`.
**Una pasada por caso.**

**Estado del código**: después de F-70 (`8f151aff`, la ficha en prosa) y de su
documentación (`a775a7c7`); **antes** de F-71 (`38d3fd22`, las etapas caídas).

| # | Caso | Resultado |
|---|---|---|
| 1 | Tabla, RRHH-06 → OPE-02 | **Detectada.** Columna `Puesto` de Dr. Pablo Reyes, confirmada por **estructura** |
| 2 | Tabla, OPE-02 → RRHH-06 | **Detectada.** Misma columna, confirmada por **estructura** |
| 3 | Prosa, CLI-03 → NOR-01 | **Detectada**, confirmada por **juicio** |
| 4 | Prosa, NOR-01 → CLI-03 | **Detectada**, confirmada por **juicio** |
| 5 | MKT-01 con los otros cuatro | **Limpio: cero hallazgos** |

| Comprobación transversal | Resultado |
|---|---|
| Falsos positivos de Belmonte (casos 1 y 2) | **Cero** |
| `columna_indeterminada` | **Cero** |
| Fallos de LLM | **Ninguno** |

**Qué confirma**: que F-69 y F-70 —el transporte de `columns`,
`comparedValues` y las filas, y la ficha en prosa— no rompieron la detección en
ninguno de los cuatro pares, y que el control negativo sigue limpio.

**Qué NO afirma**: que ninguna tasa se haya movido. Con una pasada por caso no
se distingue un régimen de una racha, que es exactamente lo que costó tres
semanas en B.81. Para eso hacen falta cuatro pasadas por dirección.

**Anomalía**: los casos 1 a 4 **no se midieron con el corpus vacío entre pares**.
Es la desviación que motivó fijar el vaciado en el protocolo: un par medido con
documentos ajenos en la tanda no está midiendo la detección entre esos dos,
porque el retrieval y el rerank ven otra cosa. Las cuatro detecciones salieron
bien de todos modos, pero salieron en condiciones más ruidosas que las que el
protocolo pide.

*(El caso 5 sí se midió como debe: MKT-01 acompañado de los otros cuatro. En su
día se anotó como si fuera la anomalía; no lo era — la anomalía estaba en los
casos 1 a 4.)*
