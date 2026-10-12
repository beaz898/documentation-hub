---
CABECERA DE ESTADO — la ÚNICA parte mutable de este fichero
Consulta: F-124
Asunto: la caja sin definir del contrato del juez — `uniqueToNewDoc`, el
        rescate de lo que cae ahí, NEGACIÓN como omisión, y lo que corrige de
        F-123
Fecha de envío: 12/10/2026 · Fecha de respuesta: 12/10/2026
Fuente: texto pegado por el director en el encargo del 12/10/2026. Los dos
        constan íntegros: la consulta en (c) y el dictamen en (d).
Estado: ARCHIVADA CON DICTAMEN · CORRIGE F-123 EN PARTE (fase 1.0 nueva, 1.1
        archivada con condición, vía 2 renumerada a 3.4 con otra
        justificación, séptimo ejecutable decidido). Nada ejecutado todavía.
        Cotejo de integridad, 12/10/2026, con el método de F-121: sha256 del
        texto tal como queda archivado aquí (saltos LF, sin salto final), 16
        primeros hexadecimales; caracteres = puntos de código; palabras = trozos
        separados por espacio en blanco. Ninguno de los dos textos tiene
        espacios que no sean ASCII. Los 60 primeros y últimos van entre comillas
        con escapes JSON: \" es una comilla del texto y \n un salto de línea.
        · DICTAMEN, (d): huella a29d211d78ca8e02 · 10.571 caracteres
          (10.837 bytes UTF-8) · 93 líneas · 57 no vacías ·
          1896 palabras.
          60 primeros: "RESPUESTA DE FABLE — F-124 · LA CAJA SIN DEFINIR DEL CONTRAT"
          60 últimos:  "r sobre el juez. F-121 y F-122 dictaminaron sobre recuentos."
        · CONSULTA, (c): huella 3b32da712beaab45 · 11.382 caracteres
          (11.660 bytes UTF-8) · 145 líneas · 88 no vacías ·
          1941 palabras.
          60 primeros: "# CONSULTA F-124 — 12/10/2026 — LA CAJA SIN DEFINIR DEL CONT"
          60 últimos:  "trada y la salida delante; las hipótesis, después o nunca.**"
Superada por: —
---

# (a) CABECERA

**F-124 · La caja sin definir del contrato del juez.**

- Fecha de envío: 12/10/2026. Fecha de respuesta: 12/10/2026.
- Quién escribe la consulta: el arquitecto. El director la envía, pega la respuesta y decide.
- Estado: **ARCHIVADA CON DICTAMEN.** Corrige F-123 en parte; F-123 sigue mandando en lo demás.
- **Las decisiones que salen de aquí, fuera de la consulta**: el orden actualizado, en
  `claude/Estado_Del_MVP.md` (12/10/2026).

---

# (b) DE DÓNDE SALIERON LAS PREGUNTAS

- **El cierre del recorrido de NOR-11 ↔ CLI-13 del 11/10** (`SQL_F123_07` y `SQL_F123_08`): las
  frases sembradas están en el texto y el juez pone LUGAR en `uniqueToNewDoc`.
- **El censo de `uniqueToNewDoc`** (`SQL_F123_09`): 1.437 entradas, 7 que nombran al candidato de
  su pareja, las 7 contradicciones reales.
- **Las plazas de los restos** (`SQL_F123_04`): 37 plazas del juez antes de la limpieza.
- ⚠️ Las salidas de esas cuatro consultas NO se han pegado en el repositorio: las cifras de la
  consulta son del arquitecto y del director, no de un archivo.

---

# (c) ENUNCIADOS DE LAS PREGUNTAS — EL TEXTO ENVIADO, ÍNTEGRO

Texto literal enviado a Fable el 12/10/2026, tal como lo pegó el director. No se ha tocado.

# CONSULTA F-124 — 12/10/2026 — LA CAJA SIN DEFINIR DEL CONTRATO DEL JUEZ

## 0. Qué te pido, y qué no

Te pido **dos decisiones sobre dos cosas ya medidas de punta a punta**. No te pido diagnóstico: el recorrido está cerrado y la causa está leída en el código y en los datos, no inferida. Y te pido otra vez **que no abras frentes nuevos**: si algo te parece imprescindible, dilo, pero por debajo.

Tu dictamen F-123 sigue mandando. Esto no lo sustituye: lo corrige en dos puntos con medidas posteriores, y te pide decidir sobre el séptimo ejecutable que tú mismo dejaste condicionado.

---

## 1. El recorrido, cerrado

Cinco análisis rápidos de NOR-11 contra el corpus, el 11/10 de 09:08 a 09:15, con los 14 restos ya fuera del corpus (la fase 0.1 de tu orden, ejecutada el 11/10).

Lo mismo en las cinco:

- retrieval: **6 candidatos, ningún resto**;
- rerank: **2 seleccionados de 6, con las 6 plazas libres** (CLI-13 y CLI-12);
- pareja con CLI-13: régimen **`pareja_entera`, analizado 14.704/14.704 y candidato 9.817/9.817** — los dos documentos **enteros**;
- el juez emite **1 contradicción** y 7 a 10 solapamientos;
- la puerta de citas mata **0 contradicciones**; la cascada, 0; la frontera, 0; la síntesis, 0.

Las tres contradicciones sembradas **están en el texto**, verificado buscándolas en los trozos que se renderizan para el juez, con un control positivo que exigía encontrar las dos frases de PLAZO:

| trampa | trozo | frase |
|---|---|---|
| PLAZO | NOR-11 **2** / CLI-13 **2** | «más de 72 horas» / «más de 7 días naturales» |
| LUGAR | NOR-11 **8** / CLI-13 **6** | «ubicado en la clínica de Chamberí» / «se encuentra en la clínica de Retiro» |
| NEGACIÓN | CLI-13 **9** | «se depositan en el contenedor negro habilitado en cada gabinete» |

**Resultado: PLAZO 5 de 5 publicada. LUGAR 0 de 5. NEGACIÓN 0 de 5.**

Queda descartado, con cinco pasadas y con régimen, caracteres leídos y candidatos escritos —la evidencia que exige tu regla R2—, que para esta pareja se pierda algo **en la selección de candidatos, en cuánto texto se lee, o en la puerta de citas**. Las tres etapas que ocuparon las últimas dos semanas están limpias aquí.

---

## 2. EL HALLAZGO: el juez emite LUGAR en una caja que no tiene definición

Leyendo la salida completa del juez (no sus recuentos: todas sus citas enteras), la pasada del 11/10 09:08:33 emite en **`uniqueToNewDoc`**, elemento 4:

> **«Punto de retirada centralizado ubicado en clínica de Chamberí (no Retiro como dice CLI-13)»**

Es la contradicción LUGAR: detectada, con los dos valores nombrados, y **con el conflicto escrito por el propio juez**. Emitida en una lista que no es de hallazgos: no pasa por la puerta de citas, no se verifica, no se publica.

**No es que no la vea. La ve, la dice, y la archiva en un cajón que no se abre.**

### No es un caso aislado: siete pasadas

| fecha | analizado | candidato | lo que escribió en `uniqueToNewDoc` |
|---|---|---|---|
| 30/09 07:52:45 | CLI-13 | NOR-11 | «…en clínica de Retiro (no Chamberí como en NOR-11)» |
| 30/09 07:54:30 | CLI-13 | NOR-11 | «…Retiro es el punto de retirada centralizado (en NOR-11 se menciona como Chamberí)» |
| 30/09 07:57:10 | CLI-13 | NOR-11 | «…Retiro es el punto de retirada centralizado (en NOR-11 se menciona como Chamberí)» |
| 11/10 09:08:33 | NOR-11 | CLI-13 | «…en clínica de Chamberí (no Retiro como dice CLI-13)» |
| 11/10 09:10:15 | NOR-11 | CLI-13 | idéntica |
| 11/10 09:12:21 | NOR-11 | CLI-13 | idéntica |
| 11/10 09:15:35 | NOR-11 | CLI-13 | idéntica |

**Siete pasadas, las dos direcciones, el conflicto explícito. Publicadas: cero.**

### El porqué, leído en el prompt (`lib/analysis/judge.ts`)

Las otras tres cajas tienen definición explícita:

- `:800` «1. "Solapamiento" significa contenido que se [repite] con palabras distintas. NO significa compartir tema general.»
- `:801` «2. "Contradicción" significa que ambos documentos [afirman cosas INCOMPATIBLES] sobre el mismo dato concreto. Es decir: es IMPOSIBLE que ambas afirmaciones sean verdaderas.»
- `:802` «3. "Inconsistencia menor" significa que ambos [tratan el mismo] tema con enfoques, matices o énfasis diferentes, pero no son estrictamente incompatibles.»

**`uniqueToNewDoc` no tiene definición.** Aparece sólo en el esquema de respuesta (`:864`) como `"uniqueToNewDoc": ["aspecto 1", "aspecto 2"]`. Lo único que el modelo sabe de esa caja es **su nombre**: «exclusivo del documento nuevo». Y «el punto de retirada está en Chamberí» es, a la letra, algo que sólo dice el documento nuevo.

**El modelo no desobedece: obedece. El defecto es de nuestro contrato.**

Además: la caja **no tiene tope** ni en el prompt (`:850` acota contradicciones, inconsistencias menores y solapamientos, no ésta) ni en el código, que la copia tal cual (`:884`) — la sonda llegó a 48 entradas. No se verifica ni se pinta. El resumen final **no la recibe** (`synthesize.ts:241-245`). Y sólo **si ese resumen falla**, sus tres primeras entradas pasan a `newInformation` y la pantalla las enseña como «Información nueva» (`:287-290`, `AnalysisModal.tsx:423-434`). Es decir: una contradicción real llega al usuario **únicamente si algo se rompe**.

### La regla de rescate, medida sobre 1.437 entradas

Censo de todas las entradas de `uniqueToNewDoc` de todos los análisis guardados de la organización:

- **1.437** entradas en total;
- **117** con alguna señal textual débil («no», «frente a», «en vez de», «a diferencia de», «dice») — casi todo ruido: «no compactar», «frente a la tecnología», «no sólo adoptarla»;
- **14** que nombran un código de documento del corpus.

Y de esas 14, filtrando por una condición estructural y no textual —**que la entrada nombre al documento CANDIDATO de su propia pareja**—:

| | |
|---|---|
| entradas que nombran al candidato de su pareja | **7** |
| de ellas, contradicciones reales | **7** |
| falsos positivos | **0** |

Las otras 7 nombran a un tercero o al documento analizado mismo, y son cruces inofensivos: «Referencia a protocolo NOR-11 como documento matriz», «Relación con documento CLI-13 como complemento operativo», «Énfasis en que CLI-13 está diseñada para lectura rápida…».

**La condición estructural separa las 7 reales de las 7 inocuas sin un solo error, sobre una población de 1.437.**

---

## 3. NEGACIÓN: omisión, y tu condición ya está cumplida

NEGACIÓN **no aparece en ninguna parte de la salida** de las cinco pasadas: ni en contradicciones, ni en los solapamientos, ni en `uniqueToNewDoc` con la forma comparativa.

Con dos agravantes observados, no interpretados:

1. Los solapamientos 1 y 2 de cada pasada **citan el apartado 8 de CLI-13** —la chuleta donde está la frase del contenedor negro— y en los dos el juez escoge las líneas en las que los documentos **coinciden**. El solapamiento 1 cita la chuleta completa con cuatro líneas y **se deja justo la quinta**, que es la de la trampa.
2. El 11/10 a las 09:14, en esa misma pareja, el juez puso en `uniqueToNewDoc` «uso incorrecto contenedor negro» como algo exclusivo de NOR-11 — cuando CLI-13 afirma lo contrario. La mitad del conflicto, en el cajón, sin nombrar al otro documento.

**Tu fase 0.4 pedía comparar las entradas de las pasadas buenas y las malas, y decías: si son idénticas, es emisión y se arregla con F-120 P2.** Las cinco pasadas del 11/10 tienen entradas **idénticas entre sí** —mismo corpus, mismos candidatos, mismo régimen, mismos caracteres— y la misma omisión las cinco veces. La condición está cumplida.

---

## 4. Dos cosas de F-123 que la medida corrige

Para que no decidas sobre hechos caducados:

- **La guarda del rerank (tu fase 1.1): su premisa no la sostiene la medida.** El rerank eligió 2 de 6 con las 6 plazas libres en las cinco pasadas, y los 4 que descartó son OPE-10, OPE-11, OPE-13 y RRHH-08 —tarifarios, cobertura y guardias— frente a un protocolo de residuos. **Descartó bien.** La guarda habría forzado cuatro llamadas al juez inútiles por pasada. Cautela honesta: es una sola pareja, y el caso con el que nació la guarda era otro (B.83, agosto).
- **La vía 2 (tu fase 3.3) no tuvo su caso.** Se justificaba con «LUGAR muere en la puerta 3 de 3». En estas cinco pasadas la puerta no mató **ninguna** contradicción, porque LUGAR no llegó a emitirse como tal.

Y una que la confirma: **la fase 0.1 era necesaria y funcionó.** Antes de la limpieza, los restos se llevaron **37 plazas del juez** en la ventana dental, y el 30/09 a las 12:20 las **tres** plazas de una pasada de CLI-13 se fueron a facturas y rutas de recogida de otra empresa, dejando a NOR-11 fuera.

---

## 5. Las preguntas

**P1 — EL CONTRATO DE LA CUARTA CAJA.** Tres formas de arreglarlo, y quiero tu orden y tu criterio:
- (a) **definir `uniqueToNewDoc`** en el prompt y prohibirle expresamente lo comparativo, remitiendo a `contradictions` lo que atribuya un valor distinto al otro documento;
- (b) **rescatar determinísticamente** lo que ya cae ahí, con la condición estructural medida (la entrada nombra al candidato de su pareja);
- (c) las dos.
¿Y hay una cuarta forma que no vemos: por ejemplo eliminar la caja del contrato?

**P2 — QUÉ HACER CON UN HALLAZGO RESCATADO.** Una entrada rescatada no trae las dos citas literales: trae la descripción del conflicto en prosa del juez. ¿Debe pasar por la puerta de citas —que la mataría por no tener citas—, por el verificador de hallazgos, por una segunda llamada dirigida que le pida las dos citas, o publicarse con etiqueta propia y confianza menor? Recuerda que en F-122 te retractaste de «no descartar, degradar» para el caso de ausencia de evidencia: dinos si esto es ausencia de evidencia o es otra cosa.

**P3 — NEGACIÓN, CON TU CONDICIÓN CUMPLIDA.** F-120 P2 proponía tres remedios, del barato al estructural: que el juez declare la lista de datos compartidos que examinó; medir el coste real de la segunda pasada con caché de prompt; y extraer afirmaciones una vez por versión al indexar. Con lo medido —cinco entradas idénticas, misma omisión, y el juez citando el apartado exacto y escogiendo la línea que coincide— ¿cuál entra, en qué orden, y con qué criterio de cierre?

**P4 — ¿CAMBIA EL ORDEN DE F-123?** Con lo de arriba: ¿la guarda (1.1) se archiva, se mantiene con otra justificación o se descarta? ¿La vía 2 (3.3) baja otro escalón o sigue donde está? ¿Y dónde entra el arreglo de la cuarta caja dentro de tus seis ejecutables, sabiendo que es contrato nuestro y es barato?

---

## 6. Lo que NO preguntamos

No preguntamos por la selección de candidatos ni por el retrieval: tu F-119 sigue dictaminada y la fase 0.1 ya está ejecutada. No preguntamos por el presupuesto de lectura: con la pareja entera leída, no es el problema de esta pareja. No preguntamos por las tablas de Word ni por el gasto del agente.

---

## 7. Nota de método, para P3

El recorrido se cerró **leyendo la entrada y la salida completas del único tramo donde se perdía algo**, no probando hipótesis. El arquitecto propuso seis causas entre el 10 y el 11/10 —el techo de tokens de salida, el retrieval descartado, el mecanismo del 11 %, la pareja equivocada dos veces, el techo de solapamientos— y **las seis fallaron**. La que acertó no fue una causa propuesta: fue una lectura, exigida por el director. Queda como regla del proyecto, y conviene que la tengas en cuenta al contestar P3: **primero el recorrido completo con la entrada y la salida delante; las hipótesis, después o nunca.**

---

# (d) RESPUESTA RECIBIDA — F-124 · 12/10/2026 · DICTAMEN, ÍNTEGRO

RESPUESTA DE FABLE — F-124 · LA CAJA SIN DEFINIR DEL CONTRATO DEL JUEZ
12/10/2026. Corrige F-123 en dos puntos y decide el séptimo ejecutable. F-123 sigue mandando en lo demás.

Frentes decididos y sin commit desde hace más de 7 días (regla 3 de F-123 P5): F-119 fase 2, 12 días, en curso por lo que dice la consulta; guarda 1.1, decidida hace 51 días, se decide hoy en P4.

Veredicto

P1: (c), las dos, y una tercera cosa que es la de verdad: la caja se define, se acota, se consume y se cuenta, como todo campo del esquema. No se elimina: “solo en un lado” es una especie legítima del producto. Y un censo: cualquier otro campo del esquema sin definición es el mismo agujero.
P2: no es ausencia de evidencia. La evidencia está en los documentos, en los trozos 8 y 6; lo que falta son las citas en la salida. Un hallazgo rescatado es una sospecha con los dos lados nombrados, y va a la segunda llamada dirigida a pedir las dos citas, y de ahí a la puerta y al verificador como cualquier otro. Nunca se publica en prosa del juez.
P3: primero un experimento de 5 pasadas que decide si NEGACIÓN es interferencia entre tareas o definición. Después el remedio que ese experimento señale. La extracción de afirmaciones sigue siendo destino, no ejecutable.
P4: la caja entra como 1.0, delante de todo lo de la fase 1. La guarda se archiva con condición de reapertura. La vía 2 se queda en 3.3 con otra justificación, y condicionada a una medición.

P1 · El contrato de la cuarta caja

Orden: (a) primero, (b) como red con contador, y lo que falta en (a) y (b).

(a) Definir. Es la cura; lo demás es vendaje. El texto debe tener las tres piezas que tienen las otras cajas y una más:

Definición: “Exclusivo del nuevo: un tema, dato o apartado que el documento nuevo trata y el candidato no menciona en absoluto.”
Ejemplo positivo: “NOR-11 incluye un procedimiento de trazabilidad por lotes; CLI-13 no habla de trazabilidad.”
Ejemplo negativo, que es el que falta en todo el prompt: “NO es exclusivo un valor distinto para un dato que el candidato también da. ‘El punto está en Chamberí’ cuando el candidato dice ‘Retiro’ es una contradicción y va en contradictions.”
Prohibición explícita: “Una entrada de esta lista no puede nombrar al documento candidato ni contener comparación.”

(b) Rescatar. La condición estructural medida, nombrar al candidato de su pareja, 7 de 7 sin falsos sobre 1.437. Se implementa como red, no como cura, y lleva un contador: rescatadas_de_caja. Si (a) funciona, ese contador tiende a cero. Si no tiende a cero, (a) ha fallado y se sabe. Un rescate sin contador sería el silencio otra vez.

Lo que ni (a) ni (b) cubren, y es contrato nuestro:

Tope. 48 entradas en una sonda y 1.437 en el histórico. La caja se acota como las otras, a 10, en prompt y en código.
Consumidor. Una especie de hallazgo que solo se enseña si la síntesis falla no es una especie: es un fallo de pantalla. “Solo en el nuevo” se publica siempre, en su sección, como lo hacen las filas exclusivas de las tablas.
Censo del esquema. Encargo para Code: listar cada campo del esquema de respuesta del juez en :864 y, para cada uno, si tiene definición, tope, consumidor y contador. Predicción: al menos un campo más sin definición, y si existe uniqueToExistingDoc, está en el mismo estado.

¿Eliminar la caja? No. Lo que solo existe en un lado es un hallazgo real para un cliente, y F-118 lo defendió contra la simetría por relevancia precisamente por eso. Lo que hay que eliminar es la caja sin etiqueta, no la especie.

Y una advertencia que enlaza con P4: definir la caja empuja LUGAR a “contradicción”, y en “contradicción” tiene que copiar la frase de 206 caracteres que no sabe copiar. Predicción: tras (a), LUGAR aparece como contradicción en 4 de 5 o más, y la puerta la mata en 3 de esas 4 o más. Es decir, el caso de la vía 2 vuelve, con otra forma.

P2 · Qué hacer con un hallazgo rescatado

No es ausencia de evidencia. En F-122 me retracté para el caso en que el otro lado no existe en los documentos: dos citas del mismo documento, nada del otro. Aquí los dos lados existen en el texto, verificados en los trozos 8 y 6, y el juez los nombra. Lo que falta es que la salida traiga las citas. Es ausencia de cita, no de evidencia.

Camino:

La entrada rescatada se convierte en una sospecha con dato y dos lados nombrados: “punto de retirada centralizado; nuevo: Chamberí; candidato: Retiro”.
Va a la segunda llamada dirigida de F-116 P5, con la pareja entera delante y una sola pregunta: las dos citas de ese dato. Con la vía 2 serán dos punteros; mientras tanto, dos citas.
De ahí entra en la cascada normal: puerta, verificador, síntesis. Si la segunda llamada no trae las dos, no se publica, y se cuenta.
Nunca se publica con la prosa del juez como evidencia. “No Retiro como dice CLI-13” es correcto, pero el cliente no puede comprobarlo sin las frases.

Coste: una llamada corta por entrada rescatada. Son 7 en 1.437 entradas históricas: nada. Y es la misma pieza que la segunda vuelta de los hallazgos a medias; no es mecanismo nuevo, es otra entrada al mismo.

Predicción: 6 de las 7 rescatadas obtienen las dos citas y se publican; la séptima muere en la puerta por la copia, y es el mismo caso de la vía 2.

P3 · NEGACIÓN, con la condición cumplida

Primero, el recorrido antes de la hipótesis, como manda vuestra nota de método. El recorrido ya dice algo: el juez cita el apartado exacto, elige las cuatro líneas que coinciden, y deja la quinta. Eso no es “no lo vio”: es “lo vio con el marco equivocado”. Y hay un dato más en la propia consulta: “uso incorrecto contenedor negro” en el cajón, como exclusivo de NOR-11. La mitad del conflicto, sin el otro lado.

El experimento que decide, cinco pasadas, antes de construir nada:

Misma pareja, mismo régimen, mismo prompt, pero el juez solo emite contradicciones: sin solapamientos, sin inconsistencias, sin caja. Cinco pasadas.
Si NEGACIÓN aparece como contradicción en 3 de 5 o más, la causa es interferencia entre tareas: buscar coincidencias y buscar choques sobre el mismo párrafo en la misma llamada. El remedio es separar las tareas en dos llamadas, que es la segunda pasada de F-120 P2 con otra forma: no “dos veces lo mismo” sino “una vez cada cosa”. El coste se mide con caché de prompt, porque los documentos son idénticos en las dos; mi apuesta de F-120 sigue: la segunda cuesta un cuarto.
Si no aparece ni así, la causa es definicional: una prohibición en un documento y la práctica prohibida en el otro no encaja en “el mismo dato concreto”. El remedio es ampliar la definición de contradicción con ese caso y su ejemplo: “NOR-11 prohíbe expresamente el contenedor negro para el grupo III no punzante; CLI-13 dice que ese residuo se deposita en el contenedor negro. Es contradicción aunque una frase sea una norma y la otra una práctica.”
Predicción de Fable: 3 de 5 con tareas separadas. Y el cambio de definición conviene hacerlo de todos modos, porque cuesta cero y cubre una especie entera de contradicciones, norma contra práctica, que un cliente real tendrá a montones.

Orden de los tres remedios de F-120 P2, con lo medido:

Separar tareas en llamadas distintas si el experimento lo confirma. Es la “segunda pasada” con mejor justificación que repetir lo mismo.
La lista de datos examinados entra en la misma modificación del prompt, porque con etiquetas de la vía 2 es casi gratis y porque es lo que distinguiría, la próxima vez, “lo miró y dijo que no” de “no lo miró”. Hoy lo distinguimos leyendo la salida entera, que es caro.
Extraer afirmaciones al indexar: destino, no ejecutable. Sin cambios.

Criterio de cierre: NEGACIÓN publicada en 4 de 5, con PLAZO en 5 de 5 y cero falsos. Y LUGAR aparte, porque su cierre depende de P1 y de la vía 2.

P4 · ¿Cambia el orden de F-123?

Sí, en tres puntos. El resto sigue.

La caja entra como 1.0, delante de la fase 1. Es contrato nuestro, es barato, y es la pérdida más grande medida hoy: siete pasadas con la contradicción escrita y archivada. Contenido de 1.0: definición con ejemplos, tope, consumidor siempre visible, rescate con contador, segunda llamada para las rescatadas, y el censo del esquema. Un commit de prompt y uno de código.

La guarda 1.1 se archiva, con condición de reapertura escrita. La medida dice que en esta pareja el rerank descartó bien con sitio libre: tarifarios y guardias frente a residuos. Forzar los seis habría sido cuatro llamadas inútiles. La premisa de la guarda era que el rerank tira candidatos verdaderos; aquí tiró candidatos falsos. Condición de reapertura: si los contadores de 0.2 muestran, en cualquier pasada, un candidato verdadero de una trampa descartado por el rerank con sitio libre, la guarda vuelve. B.83 fue uno; los contadores dirán si hay más. Cautela que comparto: una pareja no cierra la cuestión, pero tampoco justifica 51 días más de espera construyendo algo que hoy empeoraría.

La vía 2 se queda en 3.3, con la justificación cambiada y una condición. Ya no es “LUGAR muere en la puerta”. Es “la exigencia de copiar hace que LUGAR no llegue a la caja de contradicción”. La condición: tras 1.0, medir en 5 pasadas dónde queda LUGAR. Si aparece como contradicción y la puerta la mata en 3 de 5 o más, que es mi predicción, la vía 2 tiene su caso y se ejecuta en 3.3. Si LUGAR se publica sin tocar la puerta, la vía 2 baja otro escalón y se archiva con fecha.

El 1.2, presupuesto de lectura, sigue: no es de esta pareja, es de CLI-12. La fase 2, F-119, sigue: las 28 de 38 pasadas con más afines que plazas no se tocan con lo de hoy.

El séptimo ejecutable queda decidido: entra, con la forma que diga el experimento de P3, en la fase 3, antes de la vía 2.

Orden actualizado:

Fase 0: hecha (0.1) y en curso (0.2, 0.3, 0.4).
Fase 1: 1.0 caja → 1.2 presupuesto de lectura. 1.1 archivada con condición.
Fase 2: F-119 recortada, con sombra.
Fase 3: 3.0 experimento de NEGACIÓN → 3.1 segunda vuelta dirigida, que sirve a los hallazgos a medias y a las rescatadas → 3.2 remedio de NEGACIÓN según 3.0 → 3.3 verificador ciego → 3.4 vía 2, condicionada.

Nota de método, para que conste

La nota de la sección 7 es correcta y la hago mía: el recorrido completo con entrada y salida delante, antes que las hipótesis. Es la forma operativa de la regla 2 de F-123: “queda descartado” cuesta lo mismo que “queda demostrado”, y lo más barato para pagarlo es leer, no proponer. Añado una consecuencia para mí: cuando una consulta me traiga recuentos de hallazgos sin la salida completa del juez, pido la salida antes de dictaminar sobre el juez. F-121 y F-122 dictaminaron sobre recuentos.

---

# (e) PREDICCIONES REGISTRADAS, PENDIENTES DE MEDICIÓN

Con la cifra exacta. Sin veredicto salvo donde se dice.

| N.º | De quién | Predicción | Cifra exacta | Estado |
|---|---|---|---|---|
| P-F124-1 | Fable | Tras definir la caja (1.0), LUGAR aparece como CONTRADICCIÓN | **en 4 de 5 pasadas o más** | sin medir |
| P-F124-2 | Fable | …y la puerta de citas la mata (vuelve el caso de la vía 2, con otra forma) | **en 3 de esas 4 o más** | sin medir |
| P-F124-3 | Fable | De las 7 entradas rescatadas, obtienen sus dos citas en la segunda llamada y se publican | **6 de 7**; la séptima muere en la puerta | sin medir |
| P-F124-4 | Fable | Con el juez emitiendo SÓLO contradicciones, NEGACIÓN aparece (causa: interferencia entre tareas) | **en 3 de 5 o más** | sin medir |
| P-F124-5 | Fable | El censo del esquema encuentra al menos otro campo sin definición; y si existe `uniqueToExistingDoc`, está en el mismo estado | **al menos 1** campo más | censo hecho el 12/10 (sección (g)); calificación, del arquitecto |
| P-ARQ-F124-1 | arquitecto | El contador `rescatadas_de_caja` tiende a cero tras el arreglo del prompt | **tiende a 0** | sin medir |

---

# (f) PRECISIONES SOBRE EL DICTAMEN

1. **«F-119 fase 2, 12 días, en curso por lo que dice la consulta» — NO está en curso.** Está
   dictaminada y SIN EMPEZAR. Fable lo leyó así de la consulta, que decía «tu F-119 sigue
   dictaminada» (sección 6), y lo escribió como «en curso». Corregido por el arquitecto el
   12/10/2026, para que no se lea mal.

---

# (g) ENCARGO DE FABLE, CONTESTADO POR CODE: EL CENSO DEL ESQUEMA

Leído el 12/10/2026 en `lib/analysis/judge.ts` (prompt `:763-865`; esquema `:853-865`) y en sus
consumidores. Ver la tabla en `claude/Estado_Del_MVP.md` (12/10/2026), que es la misma.
