# Archivo de consultas a Fable

*Creado el 28/08/2026 (F-85). Un fichero por consulta, texto íntegro, cabecera
de estado mutable y cuerpo intocable.*

---

## ⚠️ ANTES DE NADA: ESTO REGISTRA LO QUE FABLE DIJO, NO LO QUE ES VERDAD

**La autoridad final es la medición.** Este archivo es jurisprudencia, no ley: el
caso concreto, la evidencia y la exposición de motivos. Quien quiera saber **QUÉ
es ley** lee `claude/Protocolo_Harness_Tasas.md`; quien quiera saber **POR QUÉ**,
sigue la referencia hasta aquí.

**Contiene errores conservados a propósito, y con su firma**, porque el
razonamiento previo al dato es parte del registro y borrarlo dejaría la
conclusión sin su historia. Dos que ya se conocen:

- **F-73 fue tumbada por una medición.**
- **El corte de commits de F-82 quedó superado por F-84.**

Un documento de este archivo **no se puede pudrir**: afirma «esto se dijo el día
tal», y eso sigue siendo cierto para siempre. Lo que sí puede pudrirse es su
LECTURA, si alguien lo toma por presente — para eso está la cabecera de estado
de cada fichero.

### LO QUE FABLE DA POR EXISTENTE — un patrón, no tres accidentes

**Cuatro veces ha dado por construida una pieza que no estaba**, y las cuatro con la
misma forma: una subordinada de paso —«que ya existe», «que ya viaja»— sobre
algo que el repositorio no tenía. No son errores de criterio: las tres
decisiones eran correctas y se implementaron enteras. Lo que era falso es que
fueran gratis.

| Consulta | Lo que dio por existente | Qué había en realidad |
|---|---|---|
| **F-84 P3** | «el orden canónico **que ya existe** — por id, no por rol» (F-84.md:169) | No existía. Hubo que escribir `ordenCanonico` en `huella-hallazgo.ts` |
| **F-83 P2 / F-84 P1** | «**la** pareja de tablas», en singular — un emparejador entre documentos | No existía. La fase 1 recibía dos tablas ya elegidas y nadie las elegía. Lo destapó F-88 y lo escribió su paso 1 |
| **F-88 P2** | «es un `if` sobre un campo **que ya viaja**» | No viajaba. Ni la discrepancia ni `Problem` decían de qué materia es un hallazgo; hubo que crear `origen` |
| **F-88 P2** (2.º) | «las coordenadas que el payload debe llevar son **exactamente las que la fila ya tiene**» | No las tiene. La clave de fila (`keyValues`) muere dentro de `diff-emision.ts` y nunca llega al cliente; el `tableId` tampoco. **ENCONTRADO APLICANDO LA REGLA**, no tropezando |

**Por qué pasa, y por qué importa poco y mucho a la vez.** Fable razona sobre la
descripción que le damos, y una descripción correcta a nivel de diseño puede
omitir que la pieza está a medio construir — el caso de la pareja de tablas es
el más claro: era CIERTO en el corpus, donde cada documento tiene una sola
tabla. Importa poco porque las decisiones se sostienen. Importa mucho porque el
COSTE estimado en la respuesta se apoya en esa subordinada, y quien planifique
un commit leyendo «es un if» presupuestará mal.

**Qué hacer al leer una respuesta**: cuando diga «que ya existe» o «que ya
viaja», **comprobarlo en el repositorio antes de estimar**. Es la regla de
verificación al usar (F-85 P3) aplicada a un caso concreto que se repite.

**Y LA REGLA YA SIRVIÓ, que es lo que la valida.** El cuarto caso es distinto de
los tres primeros en algo que importa: **se encontró aplicándola**. El 30/08, al
arrancar la ficha, la exploración previa comprobó una por una las coordenadas
que F-88 P2 daba por disponibles — y faltaban dos de cuatro, una de ellas
inexistente fuera de una función. Los tres primeros se descubrieron a mitad de
un commit, con el coste ya comprometido; éste se descubrió ANTES de escribir una
línea, y su consecuencia fue partir el trabajo en dos (ficha A y ficha B) en vez
de encallar. Una regla que solo describe fallos pasados no vale nada; ésta
previno el cuarto.

---

## LAS REGLAS DE LA CASA

**Se archivan los PARES consulta + respuesta.** Una respuesta sin su consulta
delante es ilegible: no se sabe qué se preguntó ni con qué evidencia.

**Se archiva TODO, sin juicio previo sobre si sigue vigente.** La vigencia se
gestiona con la cabecera, nunca con la selección. Decidir qué merece archivarse
es donde se pierde justo lo que hará falta.

**Íntegro, nunca resumido.** El resumen es donde muere el matiz.

**El estado lo cambia un HECHO** —una medición, un commit, una consulta
posterior— y se actualiza **al cerrar ese hecho, en el mismo commit**. Sin
hecho, sin cambio. **NO se repasa el archivo periódicamente**: un repaso sin
hecho es una opinión nueva disfrazada de mantenimiento.

**La cabecera la escribe quien cierra el hecho.** Fable puede PROPONER que algo
queda superado, pero **no administra su propio estado**.

---

## EL ÍNDICE

| # | Fecha | Asunto | Estado | Reglas promovidas |
|---|---|---|---|---|
| F-70 | 25/08/2026 | La ficha legible del modal de mejora: valores enfrentados por columna | **pendiente de archivar** (falta la consulta) | `comparedValues` / fila plegada — hoy en `types.ts` (F-70) |
| F-71 | sin fecha registrada | Etapas caídas y análisis incompleto | **pendiente de archivar** | `stageFailures`, la devolución íntegra de créditos |
| F-72 | sin fecha registrada | *(sin rastro en el repositorio)* | **pendiente de archivar** | — |
| F-73 | sin fecha registrada | El colapso de filas idénticas | **pendiente de archivar** · *tumbada por una medición* | — |
| F-74 | sin fecha registrada | Alcance del MVP y la lista de cierre | **pendiente de archivar** | La lista de cierre — protocolo §4-bis; el alcance declarado (`selectionLimits`) |
| F-75 | 27/08/2026 | Las baterías viven en el repositorio | **pendiente de archivar** | La regla de admisión — protocolo |
| F-76 | sin fecha registrada | Falsos negativos de prosa | **pendiente de archivar** | — |
| F-77 | sin fecha registrada | El bloque del verificador | **pendiente de archivar** | — |
| F-78 | sin fecha registrada | El criterio de clave del diff de tablas | **pendiente de archivar** · *enmendada por F-81 P1* | — |
| F-79 | sin fecha registrada | Circularidad del bloque del verificador | **pendiente de archivar** | — |
| F-80 | sin fecha registrada | El orden del frente del diff | **pendiente de archivar** | — |
| F-81 | 27/08/2026 | El criterio de clave se rinde; no hay dónde medir la fase 1 | **pendiente de archivar** (falta la respuesta) | La regla de entrada (P3) — protocolo; el consenso sin elegir clave (P1) |
| F-82 | 28/08/2026 | Los contadores de pipeline y su contrato | **pendiente de archivar** · *su corte de commits, superado por F-84* | Las tres primeras cláusulas — `Contrato_Contadores.md` |
| **[F-83](F-83.md)** | 28/08/2026 | La huella frente a la cláusula 5, la emisión de las filas sin pareja, y el corte en tres commits | **parcialmente superada** · *su corte de tres commits, por F-84* · consulta NO CONSERVADA | La distinción huella/contador y el saneo de `porColumna` — `Contrato_Contadores.md`, cláusula 5 (`2c998111`) |
| **[F-84](F-84.md)** | 28/08/2026 | La columna de contradicciones y el número de la bandeja, la asimetría del criterio de igualdad, y la huella frente a la dirección | **vigente** · PAR COMPLETO | El criterio de igualdad unificado (`e4c1f8a7`); la huella bidireccional (`e6a27a58`); la reutilización de la columna de contradicciones — **pendiente de consumar en la emisión** |
| **[F-85](F-85.md)** | 28/08/2026 | Dónde viven las respuestas de Fable: custodia, qué sigue vinculante, cómo se marca lo superado, y qué no debe decidir Fable | **vigente** · PAR COMPLETO | La custodia y la verificación al usar — protocolo (`cd00738c`) |
| **[F-86](F-86.md)** | 28/08/2026 | La segunda huella del sistema (la del «No es error»), el orden del arreglo, la persistencia de los descartes y el id del documento | **parcialmente superada** · *su rama del «si falta», por F-87* · PAR COMPLETO | Ninguna todavía: son el plan del frente que queda |
| **[F-87](F-87.md)** | 28/08/2026 | El camino sin id existe y es el más usado: el diff corre igual, lo que no puede es recordar | **vigente** · PAR COMPLETO | Ninguna todavía: son el plan del frente que queda |
| **[F-88](F-88.md)** | 29/08/2026 | Nadie empareja tablas entre documentos: N×M con tres puertas, el groupId opaco, y las variantes de escritura como cuarta clase | **vigente** · PAR COMPLETO | Ninguna todavía: son el plan de los dos commits que quedan |
| **[F-89](F-89.md)** | 30/08/2026 | El sello «confirmado por estructura» sobre un emparejamiento que el juez inventó — y EL MAPA DEL MVP: cuatro frentes, cuáles bloquean | **vigente** · PAR COMPLETO | La REGLA DE CIERRE (bloqueante/declarable) — protocolo. La jerarquía simétrica y la regla del ancla, pendientes del frente 1 |

---

## EL AGUJERO, MEDIDO EL 28/08/2026 (rango ampliado a F-89 el 30/08)

**Seis pares completos de F-70 a F-89: F-84, F-85, F-86, F-87, F-88 y F-89.** El resto, o a medias o nada:

- **F-89 — PAR COMPLETO**, en `F-89.md` (30/08/2026). LA ENTRADA MÁS CARGADA
  del archivo: trae doctrina nueva (la jerarquía determinista cerrada por los dos
  lados, la regla del ancla, el criterio bloqueante/declarable) Y el mapa entero
  del MVP. Es la primera que contiene un PLAN DE CIERRE y no solo una decisión.
- **F-88 — PAR COMPLETO**, en `F-88.md` (29/08/2026). Es la TERCERA superación
  que marca el archivo, y la primera que supera a DOS consultas a la vez y por
  el MISMO supuesto tácito: F-83 P2 y F-84 P1 hablaban de «la pareja de tablas»
  en singular. El supuesto no se veía porque el corpus de pruebas lo cumple.
- **F-86 y F-87 — PARES COMPLETOS**, en `F-86.md` y `F-87.md` (28/08/2026).
  F-87 es la segunda superación que marca el archivo y la PRIMERA CON LA
  CONSULTA DELANTE: el cambio de especificación se lee sin reconstruirlo.
- **F-85 — PAR COMPLETO**, en `F-85.md` (28/08/2026). Es la consulta que creó
  este archivo, así que queda archivada dentro de sí misma.
- **F-84 — EL PRIMER PAR COMPLETO DEL ARCHIVO**: consulta y respuesta, las dos
  íntegras, en `F-84.md` (28/08/2026). La consulta llegó en un segundo envío,
  después de la respuesta.
- **F-83 — la RESPUESTA, archivada** en `F-83.md` (28/08/2026). Su consulta
  enviada **NO SE CONSERVA**, y eso es un hecho PERMANENTE: no se puede
  reconstruir, así que ese par nunca se completará. No cuenta como deuda de
  B.118.
- **F-70 — la RESPUESTA, íntegra y literal**, en `claude/Cierre_F70.md` §2, con
  la nota de que ese fichero existe *porque esa respuesta se perdió una vez al
  migrar el chat*. **Falta la consulta enviada.**
- **F-81 — la CONSULTA, íntegra**, en `claude/Consulta_Fable_F81.md`. **Falta la
  respuesta.**
- **F-75 — rastro indirecto.** `claude/Descarte_Filas_Ajenas.md` dice ser «lo que
  vino de vuelta» al pedir la batería, pero está reformateado como
  especificación y no se declara literal. No cuenta como archivada.
- **F-82 — una frase literal**, citada en `Contrato_Contadores.md:19` («el
  contrato es barato, el sistema grande es caro»). Una frase no es un archivo.
- **F-72 — cero rastro** de ningún tipo en todo el repositorio.
- **El resto (F-71, F-73, F-74, F-76 a F-80)** existe solo como
  REFERENCIAS y resúmenes en la bitácora, los pendientes y el protocolo. Un
  resumen no cuenta: es exactamente lo que F-85 descarta.

Fuera de rango, con el mismo patrón incompleto: `Consulta_Fable_F22_Juez.md`
(consulta sin respuesta) y `Consulta_Fable_F47_Paso5.md` (veredicto sin
consulta).

**Completar esto es B.118.** El agujero queda medido y visible aquí en vez de
olvidado, y se va cerrando a medida que los textos aparecen — F-83 fue el
primero, el 28/08. Lo que no se puede cerrar nunca queda dicho como tal: la
consulta enviada de F-83 no existe.
