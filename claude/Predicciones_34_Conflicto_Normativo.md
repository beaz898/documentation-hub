# Predicciones del 3.4 · conflicto normativo, fases 2+3

*Escritas el 26/10/2026, ANTES de la tanda, por el arquitecto. Se califican una por una después, como en el 3.1.3.
Las transcribe Code; lo de «cómo se mide» es suyo, leído en el código.*

**El montaje**: **cinco pasadas de NOR-10 y cinco de NOR-11**, en **modo RÁPIDO**, nunca exhaustivo (protocolo: el
exhaustivo pierde el campo, pendiente D). Lo lanza el director.

⚠️ **SALVEDAD DE LA MEDIDA (arquitecto, 26/10)**: el bloque nuevo va en el prompt de TODAS las llamadas del juez,
también en las que producen A, B y C. **La predicción 2 se mide con el juez cambiado.** Lo que queda intacto es el
prompt del VERIFICADOR para los hallazgos sin marca: los marcados van en su propio lote, y el de los demás es byte a
byte el de las tandas anteriores (comprobado con su huella).

**LA CONSULTA QUE LO LEE TODO: `SQL_34_01_la_tanda_del_conflicto_normativo.sql`** (pendiente de ejecutar; con la
resolución por usuario y la fila de guarda; ventana y esperados en NULO, para rellenarlos con las horas reales y
DESPUÉS de mirar el reloj de la base). Sus bloques: 0 control (ventana, pasadas, modo rápido, registro por llamada);
1 cada hallazgo con su especie y sus citas (1a, 1b, 2, 4, 7); 2 el recuento de NOR-10 ↔ CLI-12 y el criterio de
abandono; 3 los contadores (5, 6, 8); 4 NOR-11 ↔ CLI-13 y las cinco coincidencias (3); 5 los tokens del juez por
llamada y la llamada extra del verificador (9).

**Dónde se lee cada cosa** (Code, leído en el código el 26/10):
- la especie de cada hallazgo publicado: `analysis->'discrepancies'[].conflictoNormativo`, en `analysis_results`;
- los contadores de la frontera y del verificador **NO están en `pipeline_counters`**: van a
  `analysis->'discardedFindings'` (synthesize.ts los funde ahí). Las claves:
  `frontera.conflicto_normativo_vacio`, `frontera.conflicto_normativo_desconocido`,
  `descartado.cumplibles_a_la_vez`, y el desglose por especie `descartado.<veredicto>.<especie>`;
- D se reconoce por sus dos citas: NOR-10 · 2.4 («puede recaer en el propio Director Clínico») y CLI-12 · 3.5
  («nunca por el Director Clínico del propio centro»).

## Las predicciones

1a. **D se publica en NOR-10 ↔ CLI-12 CON `conflictoNormativo = "norma_contra_norma"`**, en al menos 4 de 5 pasadas.

1b. **Si D se publica SIN el campo**, como contradicción normal, eso NO es un cero: es MEDIA VICTORIA (detecta el
conflicto y lo etiqueta mal), y se mide aparte, como caso propio, porque se arregla con una línea del prompt y no con
un replanteamiento.

2. **A, B y C siguen publicándose 3 de 3, y SIN el campo**: son datos con dos valores.

3. **Las cinco coincidencias declaradas de NOR-11 ↔ CLI-13 siguen sin producir hallazgo, y NINGÚN hallazgo de esa
pareja lleva el campo.** ESTO NO LO MIDE UN CONTADOR: sale de una consulta sobre el jsonb
(`discrepancies[].conflictoNormativo`).

4. **El cuarto hallazgo de NOR-10 —«retirada de un autoclave»— o se funde con A o sale sin el campo.** NO se convierte
en conflicto normativo.

5. **El contador `frontera.conflicto_normativo_vacio` vale 0**: sólo cuenta null y vacío, y el juez omitirá el campo
cuando no aplique, no lo pondrá a null.

6. **El contador `frontera.conflicto_normativo_desconocido` vale 0**: el juez usará los dos valores que se le dan.

7. **El total de hallazgos publicados en NOR-10 ↔ CLI-12 pasa de 4 a 5, no a 8.**

8. **El contador `descartado.cumplibles_a_la_vez` será bajo.** Si se dispara, la categoría ve conflictos donde no hay,
y se revierte.

9. **Los tokens de entrada de CADA llamada del juez suben por el bloque nuevo, y eso NO es una regresión: es el precio
del cambio.** El bloque añade **4.497 caracteres** (medido sobre el texto del módulo), unos **1.124 tokens** con la
estimación ÷4 de la casa y unos **1.641** corregidos con el 68,5 % medido el 21/10 (÷4 estima el 68,5 % de lo real).
Cuando `SQL_311_02` enseñe la entrada del juez más alta que en las tandas anteriores, es esto. Y el lote de los
marcados del verificador, cuando lo haya, es UNA llamada más con la rama dentro: 2.020 caracteres, unos 505 tokens
por ÷4 y 737 corregidos.
**Y UNA TERCERA VÍA QUE COINCIDE** (arquitecto, 26/10): con la proporción medida en la pareja el **22/10** —2,745
caracteres por token (`claude/Estado_Y_Pendientes_14-10-2026.md`, F-129)—, 4.497 ÷ 2,745 = **1.638 tokens**, frente a
los 1.641 por el 68,5 %. Dos derivaciones independientes con un 0,2 % de diferencia: refuerza la predicción y de paso
confirma la regla de conversión. (El arquitecto la fechó el 21/10; en el repositorio es del 22/10.)

## Criterio de abandono, escrito antes de medir

Si en las cinco pasadas **D no sale ni con campo ni sin campo**, o si **los hallazgos de esa pareja pasan de 7**, SE
REVIERTE EL PROMPT y se replantea. No se itera el texto dentro de la misma tanda.

## Lo que la tanda NO puede medir, dicho antes

- **`norma_contra_practica`**: el corpus no tiene ningún caso. La rama del verificador ya lleva su pregunta («¿lo que
  se hace cumple la regla?»), corregida el 26/10 antes de la tanda, pero esta tanda no puede ejercerla.
- **El primer camino de la tubería** (las filas de tabla sin clave que bajan a juicio, `pipeline.ts`) pasa la marca al
  verificador sin ningún caso que lo vigile: su mutante sobrevive, y se ACEPTA así (arquitecto, 26/10). Razones: un
  conflicto normativo entre filas de tabla es improbable, porque las reglas son prosa; la casa ya declara ese camino sin
  caso en `cascada-emparejamiento.test.ts`; y montar las tablas es la clase de rama que no se abre hoy. ⚠️ **LA
  CONSECUENCIA: SI ALGUNA VEZ APARECE UNA ESPECIE EN UN HALLAZGO DE FILA DE TABLA, ESE CAMINO NO ESTÁ PROBADO Y EL
  VERIFICADOR PREGUNTARÍA LO QUE NO TOCA.**
