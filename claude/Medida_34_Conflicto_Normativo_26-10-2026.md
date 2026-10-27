# MEDIDA 3.4 · Conflicto normativo, fases 2+3 · la tanda del 26/10/2026

*Escrito por Code el 27/10/2026, por encargo del arquitecto: «TRANSCRIBE, NO INTERPRETES». Las calificaciones, los
datos y la lectura son del arquitecto, leídos en la salida de `SQL_34_01_la_tanda_del_conflicto_normativo.sql` que
ejecutó el director. **Code no ha visto esa salida.** Lo que Code añade es sólo lo leído en el repositorio, y va
marcado como suyo. Las predicciones, escritas antes de medir, están en `claude/Predicciones_34_Conflicto_Normativo.md`.*

**Decisión del arquitecto, 27/10: NO SE REVIERTE.**

## El montaje

- **8 pasadas de NOR-10 y 7 de NOR-11**, en **modo rápido**.
- Ventana: del **26/10 a las 23:00 al 27/10 a las 00:30** (hora de Madrid).
- El director pidió 5 y 5; la base midió 8 y 7. Ver la nota 1.

## La salida de SQL_34_01, literal

**PENDIENTE DE PEGAR.** Code no la tiene. El arquitecto la tiene; si se pega, va aquí tal cual, sin tocar.

## Las predicciones, una por una

Calificación del arquitecto (27/10), tal cual: **SON SIETE ACIERTOS: las filas 2 a 8.** Falla la 1a; la 1b se
cumple pero es inestable y va como caso propio, no como acierto; la 9 no es calificable.

| | Predicción (resumida; el texto entero, en las predicciones) | Calificación | El dato, como lo dio el arquitecto |
|---|---|---|---|
| 1a | D se publica en NOR-10 ↔ CLI-12 con `norma_contra_norma`, en al menos 4 de 5 | **FALLA** | D aparece una vez en 8 pasadas, sin especie (pasada 7). |
| 1b | Si D sale sin el campo, es media victoria y se mide aparte | **SE CUMPLE PERO INESTABLE**: una de ocho, y va como caso propio, no como acierto | La pasada 7: D sin especie. El juez cita en CLI-12 «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial», **que no es §3.5**. |
| 2 | A, B y C siguen publicándose 3 de 3, sin el campo | **ACIERTA** | A, B y C intactas, **8 de 8**. |
| 3 | Las cinco coincidencias de NOR-11 ↔ CLI-13 sin hallazgo, y ninguno de esa pareja con el campo | **ACIERTA** | Las cinco coincidencias no saltaron, **7 de 7**. |
| 4 | «Retirada de un autoclave» se funde con A o sale sin el campo | **ACIERTA** | **8 de 8**: sale en las ocho, siempre sin especie, y en la pasada 7 fundida en el título de A. |
| 5 | `frontera.conflicto_normativo_vacio` vale 0 | **ACIERTA** | **0.** |
| 6 | `frontera.conflicto_normativo_desconocido` vale 0 | **ACIERTA** | **0.** |
| 7 | Los hallazgos de NOR-10 ↔ CLI-12 pasan de 4 a 5, no a 8 | **ACIERTA** | Entre 4 y 5, **nunca más de 5**. |
| 8 | `descartado.cumplibles_a_la_vez` será bajo | **ACIERTA**, CON LA SALVEDAD de la nota 3 | **0.** |
| 9 | La entrada de cada llamada del juez sube por el bloque nuevo | **NO CALIFICABLE** por falta de línea base | La purga se llevó las cifras de antes. La aritmética interna, en la nota 2. |

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

## La lectura del arquitecto (27/10/2026)

**EL JUEZ NO FALLÓ.** Encontró D y la emparejó MEJOR de lo que el arquitecto había previsto: en vez de §3.5, que sólo
aplica el principio al caso de la ausencia, cogió §3.1, que ENUNCIA EL PRINCIPIO: «separar la responsabilidad de un
proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente
la agenda asistencial». Y entonces chocó con una cláusula que escribió el arquitecto en el bloque de las reglas:

> «Una regla y la razón por la que existe no son dos reglas: que un texto explique su propio criterio no lo pone en
> conflicto con nada.» (`lib/analysis/excepcion-de-las-reglas.ts:91-92`)

§3.1 ES literalmente «la razón por la que existe» una regla. **SU PROPIA CLÁUSULA EXCLUYE EL EMPAREJAMIENTO QUE EL JUEZ
ELIGIÓ**, así que publicó el hallazgo como contradicción normal, sin especie.

**ES LA TERCERA VEZ DE LA CLASE «EL JUEZ OBEDECE EL CONTRATO QUE LE DIMOS, Y EL CONTRATO ESTABA MAL»**
(`claude/Protocolo_Harness_Tasas.md`), y las tres son del arquitecto. Y lo que más duele: **LA CONSULTA A FABLE SE
TITULABA «D: UNA PERMISIÓN CONTRA UN PRINCIPIO»** (`claude/consultas-fable/F-129_2026-10-23_una-permision-contra-un-principio.md`).
Fable nombró el mecanismo exacto y el arquitecto escribió un prompt que excluye los principios.

**POR QUÉ EL CASO DEL COORDINADOR SÍ FUNCIONÓ**, que es la forma de la diferencia: sus dos citas comparten SUJETO,
VERBO Y OBJETO con modalidad opuesta (el Coordinador revisa su propia área / no audita su propia área), así que el
conflicto está DENTRO de las dos frases. En D hay que encadenar cuatro pasos, y el conflicto vive en la cadena, no en
las frases.

**LA PRECISIÓN DEL ARQUITECTO (27/10), lo más fino del diagnóstico: SU EJEMPLO DEL TALLER NO CUBRE LA FORMA DE D.** Su
regla 2 lleva una PROHIBICIÓN EXPLÍCITA («nunca la misma persona puede hacer las dos cosas») pegada a la razón. La
mitad que el juez escoge de D, §3.1, NO TIENE PROHIBICIÓN NINGUNA: es sólo el motivo. Le enseñó el caso fácil
—prohibición más motivo— y con la cláusula le prohibió el difícil: el principio solo. Y el difícil es el frecuente en
documentación real: casi ningún documento dice «nunca», dice «esto se hace así para mantener X separado de Y», y es
otro el que permite juntarlos.

**HIPÓTESIS, SIN COMPROBAR**: por eso D sale en una de ocho y no en ocho de ocho. Como contradicción normal compite
con A, B, C y las de la retirada, y es la más débil de todas.

**Lo que confirma (g)**: no hay ningún caso sembrado de norma contra práctica en los registros. La tercera pareja hace
falta, y uno de sus cuatro casos tiene que ser ése. Nada se hace con esto todavía.

### La condición del arreglo, escrita antes

**EL ARREGLO NO SE TOCA HASTA QUE EL DIRECTOR EJECUTE `SQL_34_02_el_material_del_diagnostico_de_d.sql`.**
**EJECUTADA (cifras del arquitecto, 27/10; Code no ha visto la salida): §3.5, CERO CITAS en las ocho pasadas, sobre 62
citas del lado existente; las dos mitades de D DENTRO en las ocho, con los documentos enteros; y en los descartes nada
con forma de D.** No es disponibilidad: el juez tiene §3.5 delante ocho veces y prefiere §3.1 siempre. La lectura se
confirma y el arreglo se escribe.
- **SI §3.5 NO SE CITÓ NUNCA** en las ocho pasadas, la lectura de arriba se refuerza.
- **SI SE CITÓ Y TAMBIÉN SALIÓ SIN ESPECIE**, el problema NO es la cláusula del principio, y hay que mirar otra cosa.

**La dirección del arreglo, anotada y sin escribir** (la escribe el arquitecto): la cláusula NO SE QUITA, porque sin
ella el juez convierte cualquier frase explicativa en regla y fabrica conflictos. Se ESTRECHA: debe excluir «una regla
y SU PROPIA razón», no «una razón que enuncia un PRINCIPIO frente a una regla de otro sitio que permite justo lo que el
principio prohíbe».
