# MEDIDA 3.4 · Conflicto normativo, fases 2+3 · la tanda del 26/10/2026

*Escrito por Code el 27/10/2026, por encargo del arquitecto: «TRANSCRIBE, NO INTERPRETES». Las calificaciones y
los datos son del arquitecto, leídos en la salida de `SQL_34_01_la_tanda_del_conflicto_normativo.sql` que ejecutó el
director. **Code no ha visto esa salida.** Lo que Code añade es sólo lo leído en el repositorio, y va marcado como suyo.
Las predicciones, escritas antes de medir, están en `claude/Predicciones_34_Conflicto_Normativo.md`.*

**Decisión del arquitecto, 27/10: NO SE REVIERTE.**

## El montaje

- **8 pasadas de NOR-10 y 7 de NOR-11**, en **modo rápido**.
- Ventana: del **26/10 a las 23:00 al 27/10 a las 00:30** (hora de Madrid).
- El director pidió 5 y 5; la base midió 8 y 7. Ver la nota 1.

## La salida de SQL_34_01, literal

**PENDIENTE DE PEGAR.** Code no la tiene. El arquitecto la tiene; si se pega, va aquí tal cual, sin tocar.

## Las predicciones, una por una

Recuento del arquitecto: **de nueve, aciertan 7, falla la 1a y la 9 no se puede calificar contra una línea base.**
⚠️ *Code*: la lista de predicciones tiene diez entradas, porque la 1 se parte en 1a y 1b. Cuál de las diez queda
fuera de las nueve, o cómo se cuentan, lo escribe el arquitecto en su lectura. Aquí no se decide.

| | Predicción (resumida; el texto entero, en las predicciones) | Calificación | El dato, como lo dio el arquitecto |
|---|---|---|---|
| 1a | D se publica en NOR-10 ↔ CLI-12 con `norma_contra_norma`, en al menos 4 de 5 | **FALLA** | D aparece una vez en 8 pasadas, sin especie (pasada 7). |
| 1b | Si D sale sin el campo, es media victoria y se mide aparte | sin calificar una a una | La pasada 7: D sin especie. El juez cita en CLI-12 «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial», **que no es §3.5**. |
| 2 | A, B y C siguen publicándose 3 de 3, sin el campo | sin calificar una a una | A, B y C intactas, **8 de 8**. |
| 3 | Las cinco coincidencias de NOR-11 ↔ CLI-13 sin hallazgo, y ninguno de esa pareja con el campo | sin calificar una a una | Las cinco coincidencias no saltaron, **7 de 7**. |
| 4 | «Retirada de un autoclave» se funde con A o sale sin el campo | sin calificar una a una | El arquitecto no dio el dato por separado; está en la salida de SQL_34_01. |
| 5 | `frontera.conflicto_normativo_vacio` vale 0 | sin calificar una a una | **Cero vacías.** |
| 6 | `frontera.conflicto_normativo_desconocido` vale 0 | sin calificar una a una | **Cero especies desconocidas.** |
| 7 | Los hallazgos de NOR-10 ↔ CLI-12 pasan de 4 a 5, no a 8 | sin calificar una a una | **Nunca pasaron de 5.** |
| 8 | `descartado.cumplibles_a_la_vez` será bajo | sin calificar una a una; ver la nota 3 | **0.** |
| 9 | La entrada de cada llamada del juez sube por el bloque nuevo | **NO SE PUEDE CALIFICAR CONTRA UNA LÍNEA BASE** | La purga se llevó las cifras de antes. La aritmética interna, en la nota 2. |

⚠️ *Code*: el arquitecto dio la cuenta global, no la calificación fila a fila. Las filas 1b a 8 son ocho para siete
aciertos, así que Code no las reparte: la calificación de cada una la escribe el arquitecto en su lectura.

## Lo que se vio, además de las predicciones (datos del arquitecto)

- **La categoría funciona.** En la **pasada 5 de NOR-11** clasificó como `norma_contra_norma` un conflicto **real y no
  sembrado**: NOR-11 obliga al Coordinador de Calidad a revisar trimestralmente su propia área, y CLI-12 le prohíbe
  auditar su propia área.
- **El camino entero funcionó**: juez, frontera, el lote propio del verificador («2 llamadas, marcados: 1», sólo en esa
  pasada) y confirmación.
- A, B y C intactas, 8 de 8. Cero especies desconocidas, cero vacías, cero `cumplibles_a_la_vez`. Las cinco
  coincidencias no saltaron, 7 de 7. Los hallazgos nunca pasaron de 5.
- D aparece una vez en 8 pasadas, sin especie (pasada 7), con una cita de CLI-12 que no es §3.5.

**Dónde está cada frase en el corpus** (*Code*, leído en el repositorio el 27/10 con la indexación de hoy:
`extractSegments` → `chunkSegments` → `buildAnalyzedDocumentText`, sobre `corpus-pruebas/`):

| Frase | Documento, trozo y apartado | Posición en el trozo | Posición en el texto armado |
|---|---|---|---|
| El caso que funcionó, lado NOR-11 | NOR-11, trozo 13, §10.5 «Revisión periódica de buenas prácticas» | 905 de 1.167 | 13.719 de 14.704 |
| El caso que funcionó, lado CLI-12 | CLI-12, trozo 13, §6.2 «Equipo auditor» | 983 de 1.052 | 14.185 de 55.135 |
| D, lado NOR-10 | NOR-10, trozo 4, §2.4 «Coordinador de Calidad» | 113 de 1.148 | 3.942 de 66.801 |
| D, lado CLI-12 | CLI-12, trozo 6, §3.5 «Sustitución temporal del Coordinador de Calidad» | 282 de 969 | 6.860 de 55.135 |
| La cita de la pasada 7 | CLI-12, trozo 3, §3.1 «Coordinador de Calidad: responsable último de la esterilización» | 637 de 914 | 4.010 de 55.135 |

(La posición es la del tramo buscado dentro de la frase, no la del comienzo de la frase.)

## Notas del arquitecto

1. **El director pidió 5 y 5 pasadas, y la base midió 8 y 7.** Es la segunda vez que la regla de rellenar los esperados
   DESPUÉS de mirar el reloj de la base impide un rojo falso. Se anota como la regla funcionando.
2. **La predicción 9 no se puede calificar contra una línea base**, porque la purga se llevó las cifras de antes. Pero
   la aritmética interna la confirma: el juez gasta **53.284 tokens** contra CLI-12 y **36.774** contra CLI-13. La
   diferencia es **16.510**; los documentos se diferencian en **45.318 caracteres**, y 45.318 ÷ 2,745 = **16.509**, a
   un token. **La regla de conversión queda confirmada sobre material real.**
3. **La predicción 8 salió 0, pero un 0 sin un caso diseñado para parecer conflicto sin serlo no demuestra mucho.** El
   control negativo de verdad llega con la tercera pareja.

## La lectura del arquitecto

**PENDIENTE DEL ARQUITECTO.**
