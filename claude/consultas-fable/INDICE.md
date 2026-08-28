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
| F-84 | 28/08/2026 | El emparejamiento estricto y la huella bidireccional | **pendiente de archivar** | — |
| F-85 | 28/08/2026 | El archivo de consultas | **pendiente de archivar** (falta el texto) | La custodia y la verificación al usar — protocolo |

---

## EL AGUJERO, MEDIDO EL 28/08/2026

**Ninguna consulta de F-70 a F-85 está archivada como PAR completo.** Lo que hay:

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
- **F-72 y F-85 — cero rastro** de ningún tipo en todo el repositorio.
- **El resto (F-71, F-73, F-74, F-76 a F-80, F-84)** existe solo como
  REFERENCIAS y resúmenes en la bitácora, los pendientes y el protocolo. Un
  resumen no cuenta: es exactamente lo que F-85 descarta.

Fuera de rango, con el mismo patrón incompleto: `Consulta_Fable_F22_Juez.md`
(consulta sin respuesta) y `Consulta_Fable_F47_Paso5.md` (veredicto sin
consulta).

**Completar esto es B.118.** El agujero queda medido y visible aquí en vez de
olvidado, y se va cerrando a medida que los textos aparecen — F-83 fue el
primero, el 28/08. Lo que no se puede cerrar nunca queda dicho como tal: la
consulta enviada de F-83 no existe.
