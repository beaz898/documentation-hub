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
⚠️ **NOTA DE CORRECCIÓN (27/10/2026): el 4.497 y el 4.495 son los dos buenos, y miden cosas distintas.** La constante
`EXCEPCION_DE_LAS_REGLAS` mide 4.495 caracteres; el juez la mete entre dos saltos de línea (`lib/analysis/judge.ts:909-912`),
así que lo que añade al prompt es la constante y uno de esos saltos dobles, 4.495 + 2 = **4.497**. Lo confirma el mutante
«el bloque no entra en el prompt» (`claude/mutantes/fase2-juez.ts`), que quita exactamente esas dos cosas. La hipótesis
fue del arquitecto; Code la comprobó.

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

---

# LA SEGUNDA TANDA DEL 3.4 · el principio (27/10/2026)

*Escritas el 27/10/2026, ANTES de la tanda, por el arquitecto. Las transcribe Code; el precio y el «dónde se lee» son
suyos, medidos en el código.* La medida de la primera tanda y su lectura: `claude/Medida_34_Conflicto_Normativo_26-10-2026.md`.

**El montaje**: **cinco pasadas de NOR-10 y siete de NOR-11** —siete, para que la predicción 4 se pueda calificar—, en
**modo rápido**. Lo lanza el director, y después ejecuta `SQL_34_01` y `SQL_34_02` con la ventana real.

**Lo que cambia** (dos commits, cada uno revertible solo, y un tercero con la cabecera del último punto del juez):
- el bloque del juez (`lib/analysis/excepcion-de-las-reglas.ts`): la cláusula de la razón se estrecha a «SU PROPIA
  regla» y entra el bloque del principio, al final de la lista de lo que no es conflicto y antes del último punto;
- la rama del verificador (`lib/analysis/rama-de-las-reglas.ts`): la pregunta del principio, su caso en los
  veredictos, y «sin_relacion» sólo si NINGUNA de las dos manda, describe una práctica ni enuncia un principio.

## Las predicciones

1. **D se publica CON `conflictoNormativo = "norma_contra_norma"` en AL MENOS EL 80 % DE LAS PASADAS de NOR-10.** En
   proporción, no en cifra: el director lanza las que lanza.
2. **LA MITAD QUE CITA ES LA FRASE DEL PRINCIPIO DENTRO DE §3.1, no §3.5 ni otra parte de §3.1.** Se lee
   EXCLUSIVAMENTE en la columna «de la frase del principio» de `SQL_34_02`. ⚠️ §3.1 entero sale citado en todas las
   pasadas porque A lo cita siempre: ese número NO mide nada y no se usa para calificar. *(Reescrita el 27/10, antes
   de la tanda: decía «sigue siendo §3.1 y no §3.5», que no podía fallar.)*
3. **A, B y C en el 100 % de las pasadas, SIN el campo.**
4. **El caso del Coordinador (NOR-11 ↔ CLI-12) NO DESAPARECE. SE CALIFICA SÓLO CON 7 O MÁS PASADAS DE NOR-11**: con
   menos, NO CALIFICABLE, y se dice así. Ayer salió 1 de 7, que es demasiado raro para que una ausencia en 5 pasadas
   signifique nada. *(Reescrita el 27/10, antes de la tanda: «al menos 1 de cada 7» no decía qué pasaba con menos.)*
5. **El total de hallazgos por pasada en NOR-10 ↔ CLI-12: NO MÁS DE 6.** Ayer fueron 4 o 5.
6. **`descartado.cumplibles_a_la_vez` sigue bajo.**
7. **Ningún conflicto normativo cuya segunda cita sea un motivo técnico sin principio.** Se lee una por una.
8. **D NO MUERE EN EL VERIFICADOR**: `descartado.sin_relacion.norma_contra_norma` y
   `descartado.cumplibles_a_la_vez.norma_contra_norma` siguen a 0. Separa los dos sitios donde puede fallar: si falla,
   dirá cuál de los dos.

## Criterio de abandono, escrito antes de medir

Si los hallazgos de esa pareja **PASAN DE 7**, o si aparece un conflicto normativo del tipo de la 7, **SE REVIERTEN LOS
DOS TEXTOS** y se vuelve a los de ayer, que ya funcionaban para obligación contra obligación. No se itera dentro de la
tanda.

## El precio, medido sobre el texto final (no es una regresión: es el precio)

- **El bloque del juez crece 1.698 caracteres**, de 4.495 a 6.193, con la cabecera del último punto: unos **619 tokens**
  por llamada del juez, a 2,745 caracteres por token (F-129, 22/10). Va en TODAS las llamadas del juez, también en las
  que producen A, B y C.
- **La rama del verificador crece 573 caracteres**, de 2.018 a 2.591: unos **209 tokens**, sólo en la llamada de los
  marcados.
- (Medido el 27/10 sobre el texto de la constante, la de ayer contra la nueva. Como los saltos de línea que la rodean
  ya estaban, lo que crece la constante es lo que crece el prompt. El 4.495 de ayer y el 4.497 de la predicción 9 de
  la primera tanda quedan reconciliados en la nota de corrección de esa predicción.)

## Dónde se lee cada cosa (Code, leído en el código el 27/10)

- 1, 3, 4 y 7: el bloque 1 de `SQL_34_01`, cada hallazgo con su especie y sus dos citas.
- 2: `SQL_34_02`, bloque 1, **sólo la columna «de la frase del principio»**. ⚠️ §3.1 no es sólo el principio: lleva
  también la frase sembrada de A y el párrafo de las decisiones que A cita siempre, así que el total de §3.1 sale con
  citas en toda pasada que publique A.
- 5: el bloque 2 de `SQL_34_01`; 6 y 8: el bloque 3 de `SQL_34_01`, con el desglose por especie.
- Las dos consultas llevan la ventana y los esperados en NULO: se rellenan después de mirar el reloj de la base.

---

# F-130 · LAS ONCE PREDICCIONES DEL DICTAMEN (28/10/2026)

*Copiadas LITERALES de `claude/consultas-fable/F-130_2026-10-28_que-decide-lo-que-un-juez-escribe.md`, sin resumir. Las
predicciones son de Fable. Donde una sale dos veces en el dictamen, con palabras distintas, van las dos, cada una con su
sitio. Lo único que añade Code son las líneas «Sitio».*

**P-F130-1.** «E1 · Cobertura por A. Mismo prompt, con las dos mitades de A retiradas. P-F130-1: D pasa de 2 de 7 a 4 de
5 o más.» *Sitio: «Los experimentos que distinguen».*

**P-F130-2.** «E2 · Esfuerzo alto. P-F130-2: D a 3 de 5 o más; latencia del juez sube más del 50 %.» *Sitio: «Los
experimentos que distinguen».*

**P-F130-3.** «E3 · Pregunta cerrada sobre la pareja de D. P-F130-3: conflicto normativo en 6 de 7 o más.» *Sitio: «Los
experimentos que distinguen». Es la condición para construir del plan: «E3: pregunta cerrada sobre la pareja de D, 7
veces. Condición para construir: 6 de 7 o más.»*

**P-F130-4.** «E4 · Barrido por secciones. P-F130-4: D en 3 de 5 o más; el quinto en 4 de 5 o más.» *Sitio: «Los
experimentos que distinguen».*

**P-F130-5.** «E5 · Curva de acumulación. Diez pasadas. P-F130-5: se aplana entre 7 y 9 distintos a partir de la sexta; D
aparece antes de la quinta.» *Sitio: «Los experimentos que distinguen».*

**P-F130-6.** «E6 · El quinto bajo E1. P-F130-6: sube de 5 de 13 a 4 de 5 o más.» *Sitio: «Los experimentos que
distinguen».*

**P-F130-7.**
- «P-F130-7 (E7, 5 pasadas): lectura global con lo conocido excluido saca ≥ 1 hallazgo distinto por pasada que hoy no
  sale; el verificador rechaza < 1 de cada 3.» *Sitio: «PREDICCIONES NUEVAS».*
- «Experimento E7, 5 pasadas. P-F130-7: la lectura global con lo conocido excluido saca al menos un hallazgo distinto por
  pasada que hoy no sale, y el verificador rechaza menos de uno de cada tres. Si inventa más, se vuelve al orden
  original.» *Sitio: D5, pregunta del director.*

**P-F130-8.**
- «P-F130-8 (coste, con registro por llamada): el análisis de NOR-10 pasa de 0,015 $ a entre 0,025 y 0,035 $; entre 5 y
  10 segundos más.» *Sitio: «PREDICCIONES NUEVAS».*
- «P-F130-8: el análisis pasa de 0,015 $ a entre 0,025 y 0,035 $, y entre 5 y 10 segundos más. En el caso de control,
  casi nada.» *Sitio: D3, pregunta del director.*

**P-F130-9.**
- «P-F130-9 (enumerador, 0 pasadas): las parejas §2.4–§3.1 y §2.4–§3.5 salen por vecindad vectorial y por términos
  compartidos.» *Sitio: «PREDICCIONES NUEVAS».*
- «Encargo para Code: comprobar hoy, sin lanzar nada, que el trozo 4 de NOR-10 y los trozos 3 y 6 de CLI-12 son vecinos
  vectoriales y comparten las dos figuras. P-F130-9: las dos parejas salen por las dos vías.» *Sitio: D3, pregunta del
  director.*

**P-F130-10.** «P-F130-10 (activación, 5 pasadas): D y el quinto conflicto, 4 de 5 o más cada uno; las seis vivas, 5 de
5; falsos de la pasada 2 en el caso de control, 0.» *Sitio: «PREDICCIONES NUEVAS».*
⚠️ **SUSTITUIDA el 31/10 por los criterios en veintes** (respuesta de Fable a la adenda, F-130 (f), punto c; decisión del
arquitecto): «D en 16 de 20 o más; cada una de las seis vivas en 19 de 20 o más; falsos en el caso de control, 0 de
20». *Code*: los criterios nuevos no nombran «el quinto conflicto», que P-F130-10 pedía en 4 de 5. No consta si sale o
si queda dentro de «las seis vivas»; lo decide el arquitecto en el plan.

**P-F130-11.** «P-F130-11 (contadores, tras 50 análisis): ni “solo pasada 1” ni “solo pasada 2” es cero.» *Sitio:
«PREDICCIONES NUEVAS». En D4: «Tras cincuenta análisis reales se decide. Apuesta: ninguno será cero.»*

**Lo que ya se puede decir de una de ellas** (Code, 28/10; no califica nada):
- **P-F130-9, la vía de términos**: las dos figuras están en los tres trozos, contadas en el troceado de hoy sobre
  `corpus-pruebas/`. NOR-10·4: «Coordinador de Calidad» 3 (2 fuera de encabezados) y «Director Clínico» 2. CLI-12·3: 2
  (1) y 2. CLI-12·6: 3 (2) y 1.
- **La vía vectorial está sin medir**: la mide la herramienta temporal, `app/api/admin/medida-f130/`, botón de vecindad,
  para las dos parejas.

## Lo que dio la semana 0, el 29/10 (cifras del arquitecto; medida en `claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`)

- **P-F130-3 (E3)**: **NO SE CUMPLIÓ** en la pareja donde se califica, la de §3.1: **5 de 7**, con la condición en 6 de 7 o
  más. La de §3.5 dio 6 de 7. Los dos fallos de §3.1 son de la línea «LAS DOS RESPUESTAS NO PUEDEN CITAR EL MISMO PAR DE
  FRASES», leída como «mismo asunto».
- **P-F130-9 (enumerador)**: **CONFIRMADA POR LAS DOS VÍAS.** Los tres trozos en Pinecone, con correspondencia «igual»;
  puestos entre los 55 de CLI-12: §3.1 en el 4 y §3.5 en el 3; desde el otro lado, el 2 y el 1. Las figuras, ya contadas.

## P-E3-R1 · la repetición de E3, escrita ANTES de volver a medir (arquitecto, 29/10)

**P-E3-R1.** Con la línea estrechada («Esto se refiere A LAS FRASES, NO AL ASUNTO…»), la pareja de §3.1 da **6 DE 7 O
MÁS**, y las vueltas que cambian son las que ahora fallan por la regla de las frases. **Si sigue por debajo de 6, NO SE
CONSTRUYE**, y entonces toca la variante limpia. Sólo se repite §3.1, siete llamadas.
**Lo que mide, escrito antes de medir** (arquitecto, 29/10): la repetición cambia la línea Y las etiquetas de los textos;
**P-E3-R1 es sobre la línea**. Si las etiquetas mueven mucho la detección, es un resultado inesperado y se anota aparte,
no se mezcla con la predicción. Y §3.5 no se repite: su 6 de 7 es del formato viejo, y si se construye se vuelve a medir
con el prompt definitivo.
**CALIFICACIÓN (29/10, 15:15 UTC): P-E3-R1 FALLÓ.** La pareja de §3.1 dio **3 de 7** (puntuación del arquitecto). Por lo
escrito antes de medir: no se construye, toca la variante limpia, y no hay tercera vuelta de excusas. Medida y JSON en
`claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md` y `claude/Medida_F130_E3_Segunda_Tanda_29-10-2026.json`.
**Y salió PEOR que la primera tanda (5 de 7).** Puntuación del arquitecto: D en las vueltas 2, 6 y 7.

## P-E3-R2 · la tercera tanda de E3, escrita ANTES de medir, y es la última (arquitecto, 29/10)

**P-E3-R2.** Sin la línea del mismo par y con la pregunta 2 desacoplada («ESTA PREGUNTA SE CONTESTA SOLA, COMO SI LA 1 NO
EXISTIERA…»), la pareja de §3.1 da **6 DE 7 O MÁS**. El umbral no se baja: es el del 28/10.
**Cómo se puntúa**: sólo cuenta como D que la pregunta 2 afirme que NO se pueden cumplir las dos **apoyándose en el
permiso** de NOR-10 («puede recaer en el propio Director Clínico») contra la regla o el principio de CLI-12. Si reformula
A, no cuenta, aunque diga «no se pueden cumplir» y lleve etiqueta.
**El otro resultado, con su significado escrito de antemano**: si falla porque la casilla 2 se llena con A, el fallo es
estructural (dos casillas no bastan), **no se construye**, y a Fable va un dato dentro de F-130, no una consulta nueva.
**No hay cuarta tanda.** (Antes de la segunda tanda se había escrito que, por debajo de 6, tocaba la variante limpia; el
director ha aceptado esta tercera sabiéndolo.)
**Corrección del texto ANTES de lanzar la tercera (arquitecto, 29/10)**: la frase de desacople pasa a preguntar SOBRE
FRASES, no sobre los dos textos en bloque, y pierde el final «aunque las frases sean las mismas», que chocaba con el
criterio. P-E3-R2, su umbral y su regla de puntuación NO cambian. No es una cuarta tanda: la tercera no se había corrido.
**CALIFICACIÓN (29/10): P-E3-R2 HA FALLADO: 4 DE 7, con el umbral en 6. POR LO ESCRITO ANTES DE MEDIR, NO SE CONSTRUYE LA
PASADA 2. No hay cuarta tanda.** Puntuación del arquitecto: D en las vueltas 2, 3, 4 y 7; en la 1, la 5 y la 6 la casilla
2 se llena con A. Comprobado por Code contra el JSON (`claude/Medida_F130_E3_Tercera_Tanda_29-10-2026.json`).
**La serie de §3.1**: lista abierta 2 de 7; línea ancha 5 de 7; línea estrecha 3 de 7; sin línea y por frases 4 de 7. La
de §3.5, 6 de 7.
**Lo siguiente, que también estaba escrito**: la variante limpia, sólo las dos frases de D. **No reabre la decisión de
construir**: mide el techo de la pregunta cerrada sin A, y el número va a F-131.

## P-VL-1 · la variante limpia, escrita ANTES de pulsar (arquitecto, 29/10)

**P-VL-1: 7 DE 7.** El 28/10 el arquitecto escribió que esta condición «daría 7 de 7 y no mediría nada»; si sale menos, el
que queda retratado es él.
**Cómo se puntúa.** En la pregunta 1 la correcta es «no», y un «sí» es un falso positivo que se anota. En la pregunta 2
cuenta como D un «no se pueden cumplir» apoyado en el permiso de NOR-10 contra el principio de CLI-12. Reformular A es
imposible por construcción, porque A no está en el material.
**Los dos fallos, nombrados antes**:
- a) «el principio sólo explica, no manda», y «sí» a la 2: la guarda del principio no se sostiene sola;
- b) negarse a inferir porque el apartado 3.1 no está entero: es un límite de la variante, no de la pregunta.
**Cómo se lee el número.**
- **6 o 7**: el problema es la presencia de A en la pareja, que es el núcleo de F-131.
- **4 o menos**: el problema no es A, sino la pregunta o la guarda; F-131 cambia de forma y es mucho más importante.
- **5**: no distingue, y se dice.
**No reabre la decisión de construir.**
**CALIFICACIÓN (29/10, del arquitecto): P-VL-1 SE CUMPLE, 7 DE 7.** Las siete citan el permiso contra el principio; el fallo
(b) no se dio. **Y en la pregunta 1, SIETE FALSOS POSITIVOS DE SIETE**: las siete dicen «sí» donde lo escrito era «no».
Es el hallazgo principal del día; la interpretación (el modelo describe el mismo hallazgo en las dos casillas), en la
medida. Comprobado por Code contra el JSON (`claude/Medida_F130_Variante_Limpia_29-10-2026.json`).
**La segunda corrección del arquitecto (30/10), con su nombre: CORRIGIÓ LA PARTE QUE LE QUITABA RAZÓN Y SE DEJÓ LA QUE SE
LA DABA** («los saltos grandes sí están fuera del ruido»; «del 29 % al 57 %», p = 0,592). En pie quedan dos cosas: 2 de 7
frente a 7 de 7 (p = 0,021) y los siete «sí» de la pregunta 1.

## La medición de veinte por condición (30/10): SIN PREDICCIÓN, a propósito

**El arquitecto no escribe predicción esta vez**: lleva tres falladas y una acertada en tres días. **Sólo la LECTURA, antes
de medir**: si la pareja con A y las dos frases sin A se separan con p < 0,05 (Fisher, 20 frente a 20), el contraejemplo
está demostrado y es el centro de la adenda; si no, la adenda cambia de forma. Los cortes, calculados antes, en la
medida. La puntuación no cambia, y se cuenta aparte la pregunta 1. **No reabre la decisión de construir.**
**RESULTADO (30/10)**: condición 1, 20 de 20; condición 2, 20 de 20 por la regla («apoyándose en el permiso») o 16 de 20
con la comprobación literal, porque cuatro vueltas parafrasean el permiso sin citarlo. La cuenta la decide el
arquitecto. **No se separan** (p = 1, o p = 0,106 con la cuenta literal). **Por la lectura escrita antes: LA HIPÓTESIS DE
QUE LA PRESENCIA DE A IMPIDE QUE SALGA D QUEDA REFUTADA**, y era la del arquitecto. En la pregunta 1: veinte «sí» en la
condición 1, y diecinueve y un «no» en la 2.

(Lo que sigue es la cuenta de Code del 29/10 sobre las tandas de siete.) Y con siete tiradas, la cuenta de Code (Fisher, en la
medida): sólo 2 de 7 frente a 7 de 7 se separa del ruido (p = 0,021).
⚠️ **Al lado, porque es lo que vigila al arquitecto**: fijó el 6 de 7 ANTES de medir para no poder racionalizar después,
y ha salido 5. Lo que justifica repetir no es su explicación: es que el diagnóstico está en las palabras del modelo y
produce una predicción falsable. **Si al repetir falla, no hay tercera vuelta de excusas.**

## 30/10/2026 · LAS PUERTAS DE SIETE TIRADAS, ANULADAS (arquitecto)

**El veredicto «no se construye la pasada 2», que salía de P-E3-R1 y P-E3-R2, QUEDA ANULADO: la regla de decisión era
inválida.** «6 de 7 o más» con una tasa real del 90 % suspende en falso el 15 % de las veces (Code: P(X ≤ 5) = 0,1497).
La tercera tanda (4 de 7) y la condición 1 de esta mañana (20 de 20, y 16 de 20 al repetirla) fueron con el mismo texto,
demostrado por el código y por `SQL_34_04`. Con un 90 % real, un 4 de 7 sale el 2,5 % de las veces (Code: 0,0257).
**Las calificaciones de P-E3-R1 y P-E3-R2 se quedan como se escribieron**: son lo que salió. Lo que se anula es lo que se
DECIDÍA con ellas. Y el «2 de 7» de la lista abierta, que es el tamaño del problema, tampoco está medido: es el pendiente
principal (estado vivo).

**AL LADO DE LA ANULACIÓN, Y NO EN SU LUGAR (arquitecto, 31/10): LO QUE SUSTITUYE AL UMBRAL.**
- **La línea base**: «NOR-10 ← CLI-12, D, 3 de 21» (o 4 con la cota sin texto). El control positivo, en verde: reproduce
  el 2 de 7.
- **Frente a la pregunta cerrada** (36 de 40), **p = 5,58 × 10⁻⁹**. Pero son condiciones distintas: producto entero frente a
  herramienta sin puerta ni verificador. El 90 % es un techo. *(04/11: y otra regla de cuenta, y es §2.4 ↔ §3.1, no la D
  sembrada: «EL 90 % NO ES LA D SEMBRADA», al final de este fichero.)*
- **La justificación, reescrita**: «hay un hueco grande y medido entre lo que la pregunta cerrada encuentra y lo que el
  producto publica, y la única manera de saber cuánto sobrevive al camino es construirlo en sombra y medirlo».
- Medido para un hallazgo, una pareja y un corpus. El plan rehecho lo escribe el arquitecto, y no se construye todavía.

## 02/11/2026 · LAS PREDICCIONES DE LA ADENDA (g) DE FABLE, P-F130-12 A 19, literales, con lo que hace falta para puntuarlas

Fuente: la respuesta definitiva de Fable del 02/11 a las 15:05, archivada literal como adenda (g) de F-130 (huella
`56a18f52599e9b79`). **Retiradas en la misma respuesta**: P-F130-6 entera y el quinto como criterio de activación de
P-F130-10; y sus dos reglas de tiradas de ese día, «tres de tres» y «tres de cinco» (ésta, sustituida por decisión del
director). Que la primera cayó por la cuenta del arquitecto, 0,9³ = 73 %, lo dice el arquitecto; el texto de Fable dice
«(D al 73 %)».

**P-F130-12.** «P-F130-12: D, acuerdo ≥ 2 de 3 en 19 de 20 o más. Comprometido.»
- ⚠️ **TIENE UN 10,7 % DE FALLO FALSO** (arquitecto, 02/11; cuenta de Code con script, `binomial.mjs`, de un solo uso).
  Con p = 0,9 por tirada y la regla 2 de 3, cada pareja se firma el 97,2 %, y 19 o 20 de 20 sale el 89,3 % de las veces
  con todo funcionando. No es una objeción: un rojo injusto aquí sólo dispara pasar a 3 de 5 (con 3 de 5, 98,7 %), que es
  cambiar una constante. Y supone p = 0,9, que es el techo de la pregunta cerrada en la herramienta de E3, no un dato del
  producto.

**P-F130-13.** «P-F130-13: el quinto, presentado en 20 de 20 por escape; acuerdo ≥ 2 de 3 en 12 de 20 o menos.»
**SE PARTE EN DOS Y SE PUNTÚAN APARTE (arquitecto, 02/11):**
- **P-F130-13a**: «el quinto, presentado en 20 de 20 por escape». ⚠️ El arquitecto la daba como independiente de toda
  tasa, «el marcador fuerza la salida». **Code, 02/11: con la función tal como está escrita, no lo es, por tres cosas**:
  1. el quinto es nivel_1 (sus citas publicadas comparten 4 términos, 5 unificando singular y plural; ver la adenda (g) y
     el estado), y la rama de «comprometido» va primero: sin el veto, se firma;
  2. con el veto, sigue dependiendo de QUÉ frase del §4 se cite como puente. El §4 tiene tres frases candidatas y sólo
     una lleva escape: la del conflicto terminológico («a efectos de», «sin perjuicio»). La definición y la de
     «vinculantes» no llevan ninguno, y la definición es el puente más natural (`escape.mjs`, de un solo uso);
  3. sin puente y siendo nivel_1, se firma, y P-F130-14 admite hasta 6 de 20 sin el §4.
  Así que 13a depende de P-F130-14 y de qué frase cite el juez, salvo que se cambie la regla (pendiente, en el estado).
- **P-F130-13b**: «acuerdo ≥ 2 de 3 en 12 de 20 o menos». **Supone que el quinto está cerca del 50 % con la pregunta
  cerrada, y eso NO ESTÁ MEDIDO**: lo mide el paso 3 del plan. Si estuviera al 90 % como D *(04/11: como §2.4 ↔ §3.1, no
  como la D sembrada)*, el acuerdo saldría 19 de 20 y
  la predicción fallaría con el mecanismo funcionando bien (arquitecto, 02/11).

**P-F130-14.** «P-F130-14: el puente citado en el quinto, cuando se pide, es el §4 en 14 de 20 o más.»
- *Code, 02/11*: para puntuarla hay que decir qué frase del §4 cuenta. Las tres frases están en tres trozos distintos
  (7, 8-9 y 9), y sólo la del trozo 9 lleva escape.

**P-F130-15.** «P-F130-15: con la línea sobre prelación, NOR-11 contra CLI-13 en 3 de 3 en 19 de 20, y la prelación en jerarquia en 19 de 20 en vez de como solapamiento.»

**P-F130-16.** «P-F130-16: las dos lecturas del verificador para el quinto coinciden en sustancia con el adjunto 6 en 16 de 20 (solo si se enciende el interruptor).»

**P-F130-17.** «P-F130-17: coste de NOR-10 entre 0,03 y 0,04 $; latencia +5 a +10 s.»
- *Code, 02/11*: la base de 0,015 $ es anterior al verificador nuevo (`f1d94cbc`), que ya suma algo (unos +0,001 $ por
  llamada, estimado). La predicción se puntúa contra el coste medido después de ese commit, no contra el 0,015.

**P-F130-18.** «P-F130-18: de las 4 negativas de 40 de E3, al menos 3 son de lectura, no de atención.»

**P-F130-19.** «P-F130-19: tasa de "sí" por error en parejas sin conflicto, entre 2 y 5 % por tirada.»

**LA TABLA D9, RECALCULADA (arquitecto y Code, 02/11; cuenta binomial con script)**, al lado de la de Fable y sin tocar la
decisión de empezar con 2 de 3:

| Regla | D (p = 0,9) | Discutible (p = 0,5) | Falso, 3 % por tirada | Fable decía |
|---|---|---|---|---|
| 2 de 3 | 97,2 % | 50,0 % | 0,265 % | igual |
| 2 de 4 | 99,6 % | 68,8 % | 0,519 % | igual |
| 3 de 4 | 94,8 % | 31,3 % | **0,011 %** | 0,04 % |
| 3 de 5 | 99,1 % | 50,0 % | **0,026 %** | 0,08 % |

Con los números corregidos, 3 de 5 es mejor que 2 de 3 en D y en los falsos, e **igual** en lo discutible (50 % las dos,
no mejor). Eso abarata la revisión si alguna vez se dispara: la constante pasa a 3 de 5 sin perder nada.

## P-VN-1 · EL VERIFICADOR NUEVO EN LA TANDA DE 20, escrita ANTES de que corran las pasadas (arquitecto, 02/11/2026, 17:08)

*(TACHADA el 02/11 por el arquitecto, en su sitio y con su hora; la sustituyen P-VN-1a y P-VN-1b, abajo.)*
~~**La predicción del arquitecto, literal:** «EL CAMBIO DEL VERIFICADOR NO PUEDE MOVER A D CASI NADA, y el motivo está
medido — de las 21 pasadas de D, 17 son negativos limpios donde el juez no emitió nada y el verificador no tuvo nada que
salvar; sólo 1 tuvo una muerte sin texto. ASÍ QUE: D entre 3 y 4 de 21. El quinto, que tiene 4 muertes sin texto de 13,
entre 5 y 9 de 13.»~~
**Y retira** lo que escribió el 30/10, que el verificador «puede subir la línea base él solo»: para D no puede, y lo dijo
antes de tener el recuento de negativos limpios (estado vivo, paso 2 del plan).

**Lo que Code añade antes de que se lance, leído el código y hechas las cuentas (02/11, 17:08):**
1. **El mecanismo es correcto, y es una cota del efecto, no una predicción del recuento.** El verificador sólo juzga lo
   que el juez emite. En la línea base, lo que pudo matar sin dejar texto en la pareja de D es 1 de 21, y en la del quinto
   4 de 13. Eso acota lo que el cambio puede SALVAR, si el juez emite lo mismo.
2. **El cambio también puede BAJAR a D, no sólo subirlo.** El prompt del verificador es otro para todos los hallazgos: un
   D que antes se confirmaba por la pregunta del dato puede ahora contestarse distinto en esa pregunta; y si el modelo
   devuelve mal uno de los dos campos, el hallazgo muere como `descartado.sin_veredicto`. La cota del punto 1 vale para
   lo que sube; para lo que baja, la guarda es la cifra (b) de `SQL_34_09`.
3. **La tanda es de 20 pasadas nuevas, no las mismas 21**, y el juez vuelve a tirar en cada una. Con la tasa de la línea
   base (3 de 21) y SIN NINGÚN efecto del verificador, D en 20 pasadas cae entre 0 y 6 el 95 % de las veces, y en 3 o 4
   sólo el 41 % (cuenta binomial, `varianza.mjs`, de un solo uso). «Entre 3 y 4» fallaría seis de cada diez veces con el
   mecanismo funcionando tal como predice. Lo mismo el quinto: a 5/13, en 20 pasadas va de 4 a 12; a 9/13, de 10 a 18.
**Una forma puntuable, que propone Code y decide el arquitecto antes de lanzar:**
- **P-VN-1a (el mecanismo)**: en las 20 de NOR-10, `verificador.confirmados_solo_por_cumplimiento` deja D como mucho en
  una pasada más de las que el juez emite (se lee junto a `SQL_34_06`, pasada a pasada). Y `descartado.sin_veredicto` no
  sube frente a la línea base (`SQL_34_09`, bloque 2).
- **P-VN-1b (el recuento)**: D en 20 pasadas, entre 0 y 6; el quinto, entre 4 y 18. Es el rango que da el azar con las
  tasas de la línea base: fuera de él, algo se movió y hay que mirar qué.

### P-VN-1 · LO QUE QUEDA, decidido por el arquitecto (02/11/2026), antes de lanzar

**Por qué se tachó P-VN-1**, con las palabras del arquitecto: «MI PREDICCIÓN ERA LA PEOR DEL DÍA». «Entre 3 y 4 de 21»
fallaría el 59 % de las veces con el mecanismo funcionando exactamente como dijo (con p = 0,1429 y n = 20, P(3) = 0,242 y
P(4) = 0,171, suma 0,413; el arquitecto lo verificó). El mismo día corrigió el «3 de 3» de Fable (73 %) y calculó el 11 %
de P-F130-12, y escribió una peor que las dos. **Y el agujero no era del número, sino del razonamiento**: calculó sólo lo
que el cambio puede SALVAR, y nada de lo que puede ROMPER. Su cota era de un solo lado.

**P-VN-1a · LA PREDICCIÓN DE VERDAD: el mecanismo.** En la tanda nueva, el contador
`verificador.confirmados_solo_por_cumplimiento` deja a D como mucho en una pasada más de las que emite el juez, y
`descartado.sin_veredicto` NO sube frente a la línea base (`SQL_34_09`, bloque 2).

**P-VN-1b · NO ES UNA PREDICCIÓN, ES EL SUELO DE RUIDO**: D entre 0 y 6 de 20; el quinto entre 4 y 18 de 20. Es el rango que
da el azar con las tasas de la línea base. **Su función no es acertar —es casi inevitable que acierte—: es QUE NADIE LEA
DENTRO DE UN MES UN «D SALIÓ 5 DE 20» COMO PRUEBA DE MEJORA** (arquitecto).

*(Sustituido, abajo, por «LO QUE LA TANDA PUEDE CONCLUIR», la versión final antes de lanzar.)*
**LO QUE ESTA TANDA MIDE DE VERDAD (arquitecto, 02/11; cuentas comprobadas por Code con `cuentas_vn.mjs`, de un solo uso):**
- **EN D, NINGÚN RESULTADO SE PUEDE ATRIBUIR AL VERIFICADOR.** El mecanismo acota el efecto en +1 de 21 y el ruido es de unos
  ±3. Incluso D en 0 o 1 de 20 sale el 20 % de las veces sin ningún cambio (P(0) = 0,046, P(1) = 0,153). *Code corrige dos
  cifras*: el arquitecto escribió P(1) = 0,178 y «el 22 %». *Y el absoluto, matizado*: «no hay resultado de D que signifique
  algo» vale para el verificador; un D de 8 o más de 20 (0,4 % por azar) no lo puede producir el verificador, pero sí
  señalaría que cambió otra cosa.
- **EN EL QUINTO SÍ HAY OJOS, con dos matices de Code.** Sin rescate (p = 5/13 = 0,385), 4 a 12 de 20; con los cuatro muertos
  sin texto rescatados (p = 9/13 = 0,692), 10 a 18. Leído así: ≤9 es «no rescató» (2,1 % de error si rescató los cuatro),
  ≥13 es «rescató» (1,5 % de error si no rescató nada), y 10-12 es ambiguo. Las cuentas del arquitecto son correctas.
  Pero:
  1. **los dos p son estimaciones de 13 pasadas, no tasas conocidas.** Comparando la tanda nueva con la base por Fisher
     (x de 20 frente a 5 de 13), la diferencia sólo sale significativa a partir de 16 de 20 (p = 0,027); 13 de 20 da
     p = 0,17. «≥13 es rescató» es compatible con un rescate, pero no lo demuestra frente a la incertidumbre de la base;
  2. **«los cuatro rescatados» es una cota, no un escenario conocido.** Los muertos sin texto se cuentan por pareja, no por
     caso, y no se sabe si alguno era el quinto. Un ≤9 dice «no se ve rescate», no «no había nada que rescatar».
  Y el cambio también puede bajar al quinto: la guarda es la misma cifra (b).
- **CONSECUENCIA (arquitecto)**: la tanda mide el número del quinto, los dos controles del mecanismo (P-VN-1a), que A, B, C y el
  caso de control no regresen, y el coste nuevo. **EL NÚMERO DE D NO ENTRA. Y para esta medición se invierten los papeles**:
  veníamos tratando a D como objetivo y al quinto como guarda, y aquí el quinto es donde hay ojos.

### LO QUE LA TANDA PUEDE CONCLUIR, Y LO QUE NO (arquitecto y Code, 02/11/2026, versión final antes de lanzar)

- **EL QUINTO** (20 pasadas nuevas de NOR-11 frente a las 13 de la línea base, 5 de 13):
  - **≥16 de 20: demuestra que el quinto cambió** (Fisher contra 5 de 13, p = 0,027 a 16). *Que lo cambiara el verificador lo
    dice el contador nuevo: si los confirmados sólo por el cumplimiento aparecen en esas pasadas, es él (Code).*
  - **13 a 15: lo sugiere y no lo demuestra** (13 da p = 0,17).
  - **10 a 12: ambiguo.**
  - **≤9: «NO SE VE RESCATE».** No dice «no había nada que rescatar»: las muertes sin texto van por pareja y no por caso.
- **D**: el mecanismo, P-VN-1a (el contador y `sin_veredicto`), más **UNA SEÑAL DE UN SOLO LADO: ≥8 de 20**, que por azar
  sale el 0,4 % de las veces y que el verificador no puede producir. **Si sale, no es el verificador: se movió otra cosa,
  y hay que pararse a averiguar qué.**
- **A, B y C, y el caso de control**: que no regresen.
- **El coste nuevo**, contra el que se puntúa P-F130-17.
- ⚠️ **LO QUE LA TANDA NO PUEDE: decir si el verificador mejoró a D.** Con el efecto acotado en +1 de 21 y el ruido en ±3, es
  invisible. **Que nadie lo lea de otra manera dentro de un mes** (arquitecto).

### LOS UMBRALES PARA n = 21, RECALCULADOS ANTES DE MIRAR NINGÚN RESULTADO (Code, 02/11/2026, 18:38)

La tanda de NOR-10 fueron **21 pasadas, no 20** (arquitecto, de la salida de `SQL_34_09` sin ventanas, de 17:54:03 a 18:29:41;
la salida no ha llegado a Code). **Se puntúan las 21**: así el n coincide con la línea base de D, que también fueron 21, y
descartar datos después de contarlos no se hace. Mañana, **21 de NOR-11**, para que las dos tandas sean iguales entre sí.
⚠️ **El n de la tanda nueva es 21 y el de la línea base del quinto es 13: eso no se puede igualar, y la comparación es
desigual por construcción.**

Cuentas binomiales y Fisher exacto bilateral, con script (`umbrales21.mjs`, de un solo uso), escritas ANTES de que el
director ejecute `SQL_34_06`:
- **D, el suelo de ruido (n = 21, p = 3/21)**: media 3,0; el 95 % central, **de 0 a 6**. La señal de un solo lado sigue en
  **≥8**, que por azar sale el 0,6 %. Y 0 o 1 de 21 sale el 17,7 % de las veces sin ningún cambio. *(El arquitecto daba media
  3,0 y [0, 6]: correcto.)*
- **El quinto**: sin rescate (p = 5/13), **de 4 a 13**; con los cuatro rescatados (p = 9/13), **de 10 a 18**. *(El arquitecto
  daba 4 a 12 y 10 a 19: los dos, uno de más o de menos.)*
- **Fisher, x de 21 frente a 5 de 13**: 14 da p = 0,160; 15, 0,080; **16, 0,038**; 17, 0,025. **El umbral sigue en 16.**
- **La lectura del quinto, con n = 21** (sustituye a la de n = 20 de «LO QUE LA TANDA PUEDE CONCLUIR»):
  - **≥16 de 21: demuestra que el quinto cambió** (p = 0,038). Que fuera el verificador lo dice el contador nuevo.
  - **14 y 15: lo sugiere y no lo demuestra.**
  - **10 a 13: ambiguo.** El 13 pasa aquí porque con n = 21 cae dentro del rango sin rescate.
  - **≤9: «no se ve rescate»** (si se hubieran rescatado los cuatro, saldría así sólo el 1,1 % de las veces).

## P-VN-2 · EL QUINTO TAMPOCO SUBE MUCHO, escrita ANTES de que corran las 21 de NOR-11 (arquitecto, 02/11/2026, 18:59)

**El razonamiento del arquitecto, como lo escribió:** el cambio añade la pregunta del cumplimiento, y sirve a un hallazgo
que la pregunta del dato rechazaría y la del cumplimiento acepta. D es de cumplimiento: la pregunta 2 es la suya, y el cambio
está hecho para él, pero casi nunca se emite. El quinto es de dato: la pregunta 1, la que ya se le hacía, era la correcta
para él, y sus muertes no vienen de una pregunta equivocada. Y la pregunta 2 tropieza con la misma ambigüedad: sólo se
contesta decidiendo si «revisar el cumplimiento» es «auditar».
**Retira** que el quinto sea «donde hay ojos»: es cierto estadísticamente y, según él, falso mecánicamente.
**La predicción, literal:** «EL QUINTO TAMPOCO SUBE MUCHO, y verificador.confirmados_solo_por_cumplimiento sale BAJO O A
CERO en las dos tandas. Y si el quinto sube con el contador a cero, LA SUBIDA NO ES DEL VERIFICADOR.»
P-VN-1b, el suelo de ruido, se queda como está.

**Lo que dice el código, comprobado por Code a la misma hora, antes de lanzar:**
1. **El cambio tiene DOS efectos, y el contador sólo ve uno.**
   - A los hallazgos SIN marca les añade la pregunta 2. Si la 1 los rechaza y la 2 los acepta, el contador sube
     (`lib/analysis/verify-findings.ts:133`, `soloPorCumplimiento: true`; `lib/analysis/pipeline.ts:653`).
   - **A los hallazgos CON marca les devuelve la pregunta 1, que antes NO se les hacía.** Antes del cambio, los marcados iban
     en su propio lote (`verify-findings.ts:300` en `f1d94cbc~1`), y su rama decía «a ése, y sólo a ése, NO le hagas la
     pregunta de los valores distintos» (`rama-de-las-reglas.ts:18` en `f1d94cbc~1`). Ahora, si la pregunta 1 contesta
     «opuestos», se confirma por la línea 132 (`soloPorCumplimiento: false`), y **el contador NO lo cuenta.**
2. **Y eso toca justo al quinto.** De las cinco veces que se publicó, una llevó `norma_contra_norma`, mal puesta. Y de sus
   cuatro muertos sin texto, el de la pasada 4 llevaba la etiqueta y lo mató el verificador (`SQL_34_06`, 28/10). Si ese
   muerto era el quinto, al verificador viejo se le hizo **la pregunta equivocada**: sólo la del cumplimiento, a un caso de
   dato. Eso no se puede saber, porque las muertes sin texto van por pareja y no por caso, pero el camino existe y es el
   contrario de «sus muertes no vienen de una pregunta equivocada».
3. **Así que la última frase de P-VN-2 no se sostiene**: «si el quinto sube con el contador a cero, la subida no es del
   verificador» es falso. Un quinto marcado y rescatado por la pregunta 1 sube con el contador a cero. Lo que separa los dos
   casos son las publicaciones del quinto CON etiqueta en la tanda nueva (`SQL_34_06` da la especie de cada una): un rescate
   por esta vía sale publicado con `norma_contra_norma`.
4. **La parte de que el contador salga bajo o a cero es coherente con el código** para las dos tandas, por los motivos del
   arquitecto: A, B y C se confirman por la pregunta 1, D casi no se emite, y el quinto, cuando se rescata por la vía que
   el cambio abre, no pasa por el contador.
5. **Y el contador tampoco es una prueba de rescate en el otro sentido**: suma CUALQUIER confirmado sólo por la pregunta 2,
   lleve marca o no (`pipeline.ts:653` no mira la marca). Un hallazgo marcado que la 2 confirma y la 1 no, lo habría
   confirmado también el verificador viejo por su rama. Sólo los SIN marca que suben el contador son rescates del cambio.
   **Comprobado en las medidas archivadas** (`claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`): el quinto, 5 de 13 con la
   etiqueta sólo en la pasada 5 (`:1214`); el muerto sin texto de la pasada 4, con la etiqueta y del verificador (`:1213`);
   las tres D de la base de NOR-10, sin especie (`:809`, `:815`, `:820`).

**¿Un contador a cero en toda la tanda de NOR-10 es lo esperado? Sí, y queda escrito antes de verlo.** A, B y C son de dato y
se confirman por la pregunta 1 (`verify-findings.ts:132`), que no suma al contador. D casi no se emite, y en la línea base las
tres D publicadas iban sin etiqueta: el verificador viejo ya las confirmaba por la pregunta 1. Un cero ahí no es un fallo
del cambio: es el mecanismo diciendo que no había nada por ese camino. **Pero un cero sólo vale si se puede demostrar que se
buscó**: el denominador es `verificador.hallazgos_entrantes` (`SQL_34_09`, bloque 1). Si los hallazgos que llegaron al
verificador son más que cero y el contador sale a cero, el cero es una medida; si no llegó ninguno, es una pantalla apagada.

## LA TANDA DEL VERIFICADOR NUEVO, DÍA 1 (NOR-10): LA PUNTUACIÓN (arquitecto y Code, 02/11/2026, 19:27)

**De `SQL_34_09`, comprobada por Code con un script** (la salida, literal, en `claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`):
- **P-VN-1a SE CUMPLE EN SUS DOS MITADES**: el contador sale a 0, y no deja a D en más de una pasada por encima de lo que
  emite el juez; `descartado.sin_veredicto` sale 0 de 106 frente a 0 de 105, así que no sube.
- **El cero es una medida, no una pantalla apagada**: llegaron 106 hallazgos al verificador. Y las dos tandas son
  comparables en volumen: 106 frente a 105.

*(19:48: ya comprobado con la salida entera; ver «D, PUNTUADA CON LA SALIDA ENTERA», abajo.)* **De `SQL_34_06`, según el arquitecto; su salida NO ha llegado a Code y no está comprobada**: D se publicó en 1 de 21 (la
pasada 19), y todos los hallazgos de las 21 salen «sin especie». Con eso: **P-VN-1 falla** (la tachada: D en 1, no en 3 o 4),
**P-VN-1b se cumple** (1 está en [0, 6]), y **no se puede decir que D haya empeorado** (1 de 21 sale el 13,7 % de las veces con
la tasa de la base).

*(REESCRITO a las 19:48, abajo, con las palabras del arquitecto: no es un hallazgo nuevo, y se retira «va contra la premisa».)*
### ~~⚠️ EL HALLAZGO: EL VERIFICADOR NUNCA FUE EL FRENO DE D~~ (arquitecto; la cadena del código, comprobada por Code)

**Si la D de la pasada 19 se publicó como contradicción y el contador de esa pasada es 0, entonces la pregunta 1 respondió
«opuestos».** No hay otro camino; comprobado en el código, eslabón a eslabón:
1. Lo que `SQL_34_06` cuenta como publicado sale de `analysis->'discrepancies'` (`SQL_34_06_hallazgos_por_pasada.sql:119`),
   y en el rápido eso es `judgments[].contradictions` (`lib/analysis/synthesize.ts:69-72`, `construirDiscrepancias`).
2. A `contradictions` sólo entra lo que confirmó el verificador, con `confirmedBy: 'juicio'` (`lib/analysis/pipeline.ts:649-655`).
   `confirmedBy: 'estructura'` es exclusivo del diff de tablas (`pipeline.ts:498`), y D es prosa.
3. El verificador confirma sólo por dos líneas: la 132 («opuestos», no suma al contador) y la 133 (sólo por el cumplimiento,
   suma) de `lib/analysis/verify-findings.ts`. Si falta una respuesta, o la llamada falla, el hallazgo NO se confirma: va
   a `descartado.sin_veredicto` (`verify-findings.ts:302-304` y `:333-336`).
4. El contador se suma por cada confirmado de la 133 (`pipeline.ts:653`), y en las 21 pasadas vale 0 (`SQL_34_09`, bloque 3).

**Lo que el arquitecto lee de ahí**: creíamos que D moría en el verificador porque se le hacía la pregunta equivocada.
Resulta que, cuando D llega, el verificador la pasa, y la pasa por la pregunta 1. **El freno de D está entero arriba: el juez
no la emite 20 de 21 veces.**
*Una cota de Code, para no leer de más*: es UNA pasada. Dice que el verificador PUEDE leer D como oposición de dato, no que
lo haga siempre. Y en la línea base pasaba lo mismo: las tres D publicadas iban sin etiqueta y el verificador viejo sólo
les hacía la pregunta del dato, así que también entonces las confirmaba la pregunta 1. La tanda nueva lo deja visible con
un contador; no lo descubre por primera vez.

**LA TENSIÓN, que queda escrita**: el verificador lee D como oposición de dato, y eso contradice nuestra lectura de F-129:
«D no es eso [el mismo dato con dos valores distintos]. D es una permisión contra un principio»
(`claude/consultas-fable/F-129_2026-10-23_una-permision-contra-un-principio.md:191-192`). **O el verificador tiene una noción
de «mismo dato» más ancha que la nuestra, o nuestra clasificación de D tiene que revisarse.**
*Y la duda ya estaba escrita (Code)*: el mismo F-129, en su §3.1, punto 1 (`:198-202`), dejó la otra lectura como posible.
Las dos frases «mencionan las dos figuras por su nombre y afirman cosas incompatibles sobre su relación. Si eso basta, D
está dentro de la definición actual y lo que falla es el prompt, no la definición. No sé decidirlo yo». El verificador
contesta esa pregunta del lado de «está dentro», al menos una vez.

### EL CONTADOR A CERO NO DICE «EL CAMBIO NO SIRVE» (arquitecto, para el registro)

Dice que **la situación que el cambio arregla no ocurrió en esta tanda**. En las 21 pasadas todos los hallazgos salen «sin
especie» (dato de `SQL_34_06`; comprobado a las 19:48), y la fuga que el cambio tapa sólo se dispara con un hallazgo
etiquetado.

### MAÑANA, NOR-11, escrito antes (arquitecto, con la corrección de Code)

El arquitecto escribió que NOR-11 es el único sitio donde hemos visto al juez poner una etiqueta. **No es así.** Las
etiquetas en pasadas del producto, según las medidas archivadas:
- **NOR-11, el quinto, 26/10, pasada 5**: `norma_contra_norma`, confirmado (`claude/Medida_34_Conflicto_Normativo_26-10-2026.md:40`).
- **NOR-10, D, 28/10, pasada 5 de 7** (ventana del control positivo, de 08:15 a 08:35): **D publicada con `norma_contra_norma`**
  (`claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md:780`).
- **NOR-11, 28/10**: el quinto con la etiqueta en la pasada 5 (`:1214`), y un muerto sin texto, etiquetado, del verificador,
  en la pasada 4 (`:1213`).
- Ninguna en las 21 pasadas de la línea base de D (30-31/10), donde las tres D iban sin especie (`:809`, `:815`, `:820`).
- *Las tandas de los arneses de E3 y de la medición de veinte llevan la etiqueta en todas las respuestas, pero son llamadas
  sueltas al modelo con su propio prompt, no pasadas del producto.*

**Así que el camino arreglado también se ha disparado en NOR-10**: una vez en 28 pasadas (7 del 28/10 y 21 de la línea base).
NOR-11 sigue siendo el terreno más probable (dos etiquetas en 13 pasadas el 28/10, y una más el 26/10), pero no el único.

## D, PUNTUADA CON LA SALIDA ENTERA DE SQL_34_06 (Code, 02/11/2026, 19:48)

Salida literal en `claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`, comprobada con un script. **Ya no es el número del
arquitecto: es el de la consulta.**
- **D, en 1 de 21: la pasada 19, sin especie.** P-VN-1 (la tachada, «3 o 4») falla. P-VN-1b, el suelo de ruido, se cumple:
  1 está en [0, 6]. La señal de un solo lado (≥8) no salta. **No se puede decir que D haya empeorado**: con la tasa de la
  base, 1 o menos de 21 sale el 17,7 % de las veces, y exactamente 1, el 13,7 %. Son dos magnitudes distintas y las dos son
  ciertas.
- **A, B y C, en 21 de 21, sin especie: no regresan** (la base, 21 de 21).
- **Ninguna etiqueta en las 21 pasadas, y ningún muerto sin texto.** El contador a 0 (`SQL_34_09`) junto a la D de la pasada
  19 obliga a que la pregunta 1 respondiera «opuestos» (la cadena del código, arriba; el arquitecto la da por buena entera).
  *Y la cota, al lado: es UNA pasada. Dice que el verificador PUEDE leer D como dato, no que lo haga siempre.*
- **El coste nuevo, contra el que se puntúa P-F130-17, no sale de estas dos consultas**: queda pendiente.

### LO QUE LA PASADA 19 ENSEÑA, REESCRITO (arquitecto y Code, 02/11, 19:48)

**NO ES UN HALLAZGO NUEVO.** Las tres D de la línea base iban sin etiqueta, y el verificador viejo sólo les hacía la pregunta
del dato. **Ya teníamos tres pruebas, en nuestros propios datos y sin leerlas, de que la pregunta 1 confirma a D.** La tanda
nueva lo hace VISIBLE con el contador; no lo descubre.

**SE RETIRA «VA CONTRA LA PREMISA CON LA QUE CONSTRUIMOS EL CAMBIO»** (arquitecto). La fuga de la ruta por marca es real, y D
sí ha estado marcada: en la pasada 5 de la ventana del control positivo del 28/10
(`claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md:780`). *El arquitecto escribió «la pasada 7»; es la 5 (Code).* **El camino
arreglado se ha disparado una vez en 28 pasadas de NOR-10. Ésa es su tasa medida, y es el dato que faltaba para saber lo que
vale el cambio.**

### ⚠️ LO QUE MÁS IMPORTA DE ESTE DÍA: UNA DUDA QUE NO SUPIMOS RESOLVER LEYENDO, RESUELTA POR EL PRODUCTO MIDIÉNDOLA

El 23/10, F-129 dejó escrito en su §3.1, punto 1
(`claude/consultas-fable/F-129_2026-10-23_una-permision-contra-un-principio.md:198-202`), que quizá D estaba dentro de la
definición de siempre. «Nunca por el Director Clínico del propio centro… para mantener la separación de funciones» y
«figura que puede recaer en el propio Director Clínico» mencionan las dos figuras por su nombre y afirman cosas
incompatibles sobre su relación. **Y terminaba: «Si eso basta, D está dentro de la definición actual y lo que falla es el
prompt, no la definición. No sé decidirlo yo».**

**El verificador ha contestado que sí, al menos una vez**: en la pasada 19 confirmó D por la pregunta del dato. Diez días
después, una duda que no supimos decidir leyendo la ha contestado el propio producto midiéndolo. **Vale más que el número de
D** (arquitecto).
La tensión que abre sigue escrita arriba: o el verificador tiene una noción de «mismo dato» más ancha que la nuestra, o
nuestra clasificación de D («una permisión contra un principio», F-129:191-192) tiene que revisarse.

### P-F130-17: CONTRA QUÉ SE PUNTÚA (Code, 02/11/2026)

P-F130-17, literal: «coste de NOR-10 entre 0,03 y 0,04 $; latencia +5 a +10 s.» Se puntúa contra el coste medido DESPUÉS
del cambio del verificador (decidido esta mañana), y ese coste lo da `SQL_34_10_el_coste_del_verificador_nuevo.sql`, con la
tanda nueva de NOR-10 frente a su base.
⚠️ **«Latencia» tiene que decir de qué duración habla antes de puntuarse.** `SQL_34_10` mide la duración del análisis como el
registro la documenta: del primer comienzo al último final, CON la espera. La columna «s» de `SQL_34_06` es
`max(comienzo + latencia)`, SIN la espera. Las dos no se mezclan: el «+5 a +10 s» se mide con una y la misma en las dos
puntas.

*(TACHADA por el arquitecto el 02/11 a las 21:27, en su sitio y no borrada. Motivo: «estaba mal fundada». Las dos columnas no se
diferencian por la espera, sino por el ORIGEN; ver «LA LATENCIA, OTRA VEZ», abajo.)*
~~**DECISIÓN DEL ARQUITECTO (02/11/2026): LA LATENCIA DE P-F130-17 SE PUNTÚA CON LA DEFINICIÓN QUE CUENTA LA ESPERA, Y EN LAS
DOS PUNTAS.** El motivo: P-F130-17 habla de lo que espera el usuario, y el usuario espera también la espera.
Las dos definiciones, por su nombre:
- **CON LA ESPERA, la que se puntúa**: `SQL_34_10`, del primer `comienzoMs` al último `comienzoMs + esperaMs + latenciaMs`
  (la que documenta `lib/observability/registro-de-llamadas.ts:35-37`).
- **SIN LA ESPERA, que NO se usa para puntuar**: la columna de segundos de `SQL_34_06`, `max(comienzoMs + latenciaMs)`. Se
  queda como está, etiquetada en su cabecera como «sin la espera, no comparable con SQL_34_10».
`SQL_34_10` da además la ESPERA MEDIA POR ANÁLISIS y, al lado, la duración sin la espera, para ver de qué tamaño es la
diferencia. Si son décimas, las dos definiciones coinciden en la práctica; si son segundos, la diferencia manda sobre cómo se
puntúa el «+5 a +10 s». *Arquitecto: sin esta decisión, una diferencia de definición habría fabricado la mitad del efecto
predicho.*~~

## EL COSTE DEL VERIFICADOR NUEVO, Y LA BASE DE P-F130-17 (arquitecto y Code, 02/11/2026, 21:27)

*(22:27: la salida llegó y está comprobada; las cifras del arquitecto, todas bien. Ver «LA SALIDA DE SQL_34_10, COMPROBADA», abajo.)*
⚠️ **LA SALIDA DE `SQL_34_10` NO HA LLEGADO A CODE.** El arquitecto escribió «la salida va dentro de la pegada del director» y
en el mensaje no había ninguna fila: sólo las cifras de su lectura. **Todas las cifras de esta sección que salen de esa
salida son del arquitecto y no están comprobadas**: 0,0315 → 0,0332 $ (+5,4 %, +0,0017 $), el verificador al 40,1 % y el
juez al 40,5 % con 1,19 y 2,00 peticiones por análisis, la duración de 34,4 s (37,5 s en la otra columna), +0,7 s, la espera
de 0,99 → 1,34 s, 0 fallidas de 109, y el control positivo en 55 de 55. Se archivan y se comprueban cuando llegue la salida.

### LA PREDICCIÓN DEL ARQUITECTO, «15-25 %»: NO ESTABA ESCRITA ANTES DE MEDIR

El arquitecto escribe: «dije 15-25 % y ha salido +5,4 %. El incremento lo tenía bien; lo que tenía mal era el denominador.
Anclé en 0,015 $ y la base medida es 0,0315 $». Y su motivo: **«no es un error de estimación, es haber usado una cifra de otra
fuente sin medirla»**.
*Code*: el «15-25 %» no aparece en ninguno de los mensajes pegados antes de éste (buscado con un script en los 394). Según su
propia regla de hoy («si no está en el encargo, no existe»), **no es una predicción registrada y no se puntúa**. Se escribe
como lo que es: una expectativa contada después.

### P-F130-17: NO PUNTUABLE TAL COMO ESTÁ, PORQUE SU BASE ES FALSA (arquitecto)

P-F130-17 (Fable, D1, literal): «NOR-10 pasa de 0,015 $ a entre 0,03 y 0,04 $, y entre 5 y 10 segundos más», hablando del
coste DESPUÉS de la pasada 2 (`claude/consultas-fable/F-130_2026-10-28_que-decide-lo-que-un-juez-escribe.md:554`). **Si NOR-10
cuesta ya unos 0,033 $ sin la pasada 2** (cifra del arquitecto, sin comprobar), el rango que Fable predice para DESPUÉS es el
que hay ANTES. **Queda marcada como NO PUNTUABLE tal como está**, y hay que llevárselo a Fable cuando se le escriba: es su
predicción apoyada en una cifra nuestra mala.

### DE DÓNDE SALIÓ EL 0,015 $ (Code, buscado en el repositorio)

1. **Su primera aparición es nuestra, en el encargo a Fable**: «Coste actual: unos 0,015 $ por análisis»
   (`F-130_…md:72`, en el texto que entró con `46e81362`, el 29/10 a las 00:33). **No cita ninguna medición, ni fecha, ni
   ventana.** No he encontrado ninguna medición en el repositorio que dé 0,015 $ por análisis.
*(22:27: los puntos 2 a 4 tienen un error de Code, y la corrección está abajo, en «EL AGUJERO DE LOS 0,008 $ NO EXISTE». El
«0,0235 $» no es una medición: es una suma de Code. El 0,015 sigue sin medición detrás.)*
2. **Y la medición que sí había lo contradice.** F-128 midió el coste por análisis con el juez en Haiku 5.5: **0,02280 $**
   (P-6, calificada el 20/10; `claude/Predicciones_F128_El_Modelo_Del_Juez.md:145`). F-129 midió que subir la ventana a
   150.000 costaba **+0,00068 $ por análisis** (`claude/consultas-fable/F-129_…md:120`, 23/10). **Así que el 28/10 la cifra
   medida era de unos 0,0235 $, no 0,015.**
3. **La hipótesis del arquitecto, que el 0,015 sea de antes de subir a 150.000, no se sostiene con lo escrito**: antes de
   subir ya se había medido 0,0228, y la subida añadió menos de una milésima. El 0,015 no corresponde a ninguna ventana
   medida.
4. **Y entre el 0,0235 del 23/10 y el 0,0315 de la base del 30-31/10** (si se confirma) hay unos 0,008 $ que ninguna medición
   escrita explica. No lo explico yo tampoco: es un encargo de verificación para cuando llegue la salida, mirando el
   reparto por etapa.
5. **Code repitió el 0,015 dos veces hoy sin contrastarlo**: en el coste estimado del verificador (`529ca827`, 08:48: «sobre
   los 0,015 $ de un análisis de NOR-10») y en la nota a P-F130-17 (`d3ee10f7`, 16:33). La medición de F-128 estaba en
   nuestros propios ficheros.

### LA PROYECCIÓN DE LA PASADA 2 SOBRE LA BASE REAL, CON SUS SUPUESTOS A LA VISTA (Code)

**coste después = base medida + coste de la pasada 2 agrupada + coste de la repetición en positivos**

| Término | Valor | De dónde sale | ¿Medido? |
|---|---|---|---|
| base | ~0,0332 $ | `SQL_34_10`, tanda nueva de NOR-10 | **Sí, pero sin comprobar por Code**: la salida no ha llegado |
| pasada 2 agrupada | **sin cifra** | Fable, D1: «preguntas cortas agrupadas» | **No**: Fable no da tokens ni modelo |
| repetición | 15.000 tokens con 5 positivos | Fable, D1 | **No**: ni los tokens, ni el reparto entre entrada y salida, ni el modelo |
| positivos por análisis | 5 | Fable, D1 | **No**. En la pareja NOR-10 ↔ CLI-12 se publican unos 3 por pasada (A, B y C en 21 de 21, D en 1 de 21, `SQL_34_06`); las demás parejas no están contadas |

**Lo que da cada lectura de la repetición** (precios de `lib/observability/llm-pricing.ts`):
- con Haiku 4.5 y todo entrada: 15.000 × 1 $/M = **0,015 $**; con un 10 % de salida (1.500 × 5 $/M): **0,021 $**;
- con Haiku 5.5 y todo entrada: 15.000 × 0,10 $/M = **0,0015 $**;
- con 3 positivos en vez de 5, si escala lineal (otro supuesto): el 60 % de cada cifra.

**La proyección honrada**: si se toma el incremento que Fable predijo (de +0,015 a +0,025 $) y se suma a la base medida,
sale **de 0,048 a 0,058 $**. Pero **ese incremento no tiene ningún término medido**: depende del modelo de la pasada 2, que
no está decidido, y la diferencia entre Haiku 4.5 y 5.5 es de diez veces. **Lo único medido es la base.** Antes de proyectar
en serio hay que fijar el modelo de la pasada 2 y medir una llamada.

### EL VERIFICADOR CUESTA CASI LO MISMO QUE EL JUEZ (arquitecto; cifras comprobadas a las 22:27)

*(TACHADA en parte por el arquitecto el 02/11, con su motivo: la frase sugería novedad donde no la hay. El verificador YA ERA el
36,8 % de la factura antes del cambio; no llegó al 40 % por el cambio. Lo que sigue en pie es la consecuencia: una etapa que
tratamos como una segunda opinión barata es más de un tercio del coste.)*
~~40,1 % frente a 40,5 % de la factura, con 1,19 peticiones por análisis frente a 2,00. Una etapa que tratamos como una segunda
opinión barata es el 40 % del coste.~~ **Eso cambia cómo hay que mirar cualquier propuesta que añada llamadas cerca de ella.**
**Lo que sí es limpio (arquitecto): EL AUMENTO ES TODO DEL VERIFICADOR**, +0,001715 $ de +0,001714 $ en total, con el juez, el
rerank y la síntesis sin moverse. Atribución perfecta.
**EL COSTE REAL, para el estado y para cualquier cosa de precios: UNOS 0,03 $ POR ANÁLISIS DE NOR-10, Y ASÍ DESDE EL 22/10**
(0,0294-0,0352 $ el 22/10, `SQL_311_02`; 0,0315 $ en la base del 30-31/10 y 0,0332 $ con el verificador nuevo, `SQL_34_10`).
*Code, el motivo probable, sin medir*: el verificador va en Haiku 4.5 (1 $/M de entrada) y el juez en Haiku 5.5 (0,10 $/M):
diez veces más caro por token. Se comprueba con el bloque 2 de la salida cuando llegue.

### LA LATENCIA, OTRA VEZ: LAS DOS COLUMNAS NO SE DIFERENCIAN POR LA ESPERA, SINO POR EL ORIGEN (arquitecto; Code lo confirma en el código)

Con la espera sale 34,4 s y «sin ella» 37,5 s: sin la espera sale MÁS, y eso es imposible si sólo se quitara un sumando.
**Confirmado en las dos consultas**: `SQL_34_10` resta el comienzo de la primera petición
(`max(com + esp + lat) - min(com)`, línea 107); la columna de `SQL_34_06` no lo resta (`max(com + lat)`, sus líneas 182 y 237), y
la copia de esa columna en `SQL_34_10` (línea 108) tampoco. **El nombre «sin la espera» lo puso Code**, al leer la expresión y
ver sólo el sumando que faltaba, no la resta que faltaba. Y el arnés no podía verlo: todas sus peticiones empiezan en el
origen (`comienzoMs` = 0 en la primera), así que restar o no restar daba lo mismo.
**Consecuencia (arquitecto)**: ninguna de las dos es lo que espera el usuario, y el «+5 a +10 s» no se puede puntuar contra
ninguna. Hace falta una TERCERA cifra: la duración de la petición HTTP de principio a fin.
**Y ESA CIFRA SÍ ESTÁ GUARDADA (Code)**: `usage_logs.latency_ms` (`lib/usage-logger.ts:118`). En el análisis rápido se mide
desde que entra la petición (`app/api/analyze-v2/route.ts:55`, `startedAt`) hasta justo antes de guardar el análisis
(`:667`), con `endpoint = '/api/analyze-v2'` y `user_query = '<nombre> (rápido)'` (`:670-677`). **Lo que NO cuenta**: el
tránsito por la red, el arranque de la función antes de entrar, y el guardado y la respuesta después de la línea 667. Es la
cifra más cercana a lo que espera el usuario que hay guardada. No hay consulta que la lea por tanda: **es un pendiente**, y no
se escribe sin encargo.
**Lo que sí queda medido** (arquitecto; comprobado a las 22:27): **la espera es de décimas, 0,99 → 1,34 s**. La trampa era pequeña.

### LA SALIDA DE SQL_34_10, COMPROBADA (Code, 02/11/2026, 22:27)

Salida literal en `claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`. **Las cifras del arquitecto, todas bien**: 0,0315 → 0,0332 $
(+5,4 %); el verificador al 40,1 % y el juez al 40,5 % en la tanda nueva, con 1,19 y 2,00 peticiones; 34,4 s, y 37,5 en la
columna de `SQL_34_06`; la espera, de 0,99 a 1,34 s; 0 fallidas de 109; el positivo, 55 de 55.
**Dos cosas que la lectura no decía:**
- **el aumento entero es del verificador**: +0,001715 $ de un total de +0,001714 $. El juez, el rerank y la síntesis no se
  mueven;
- **en la base, el verificador era el 36,8 %, no el 40 %**: el 40,1 % es el de después del cambio. Y en NOR-11, con 1,69
  peticiones por análisis, es el 33,5 %.

### ⚠️ EL AGUJERO DE LOS 0,008 $ NO EXISTE: EL «0,0235 $» LO FABRICÓ CODE (02/11/2026, 22:27)

El arquitecto pidió para mañana, antes del quinto, que se explicara un 34 % más de coste entre el «0,0235 $ del 23/10» y el
0,0315 $ de la base del 30-31/10. **No hay nada que explicar: el 0,0235 no es ninguna medición.** Lo construyó Code esta
tarde, en el punto 2 de arriba, **sumando dos cifras de bases distintas**:
- **el 0,02280 $ de F-128** se midió con la ventana a **40.000** (la calificación es del 20/10; la ventana pasó a 80.000 el
  22/10 por la mañana y a 150.000 por la tarde, `claude/consultas-fable/F-129_…md:99-100`);
- **el +0,00068 $ de F-129** no es lo que cuesta subir la ventana a 150.000 desde 40.000: es lo que subió **la etapa del juez**
  (de 0,011775 a 0,012453 $) **de 80.000 a 150.000**.

La suma se salta el escalón de 40.000 a 80.000 y lo mezcla todo. **Y la medición buena estaba escrita**: el 22/10 por la
tarde, con la ventana ya a 150.000, `SQL_311_02` dio **NOR-10 entre 0,0294 y 0,0352 $ por análisis** en cinco pasadas
(`claude/Estado_Y_Pendientes_14-10-2026.md:1652-1654`). **La base del 30-31/10, 0,0315 $ (de 0,0259 a 0,0400), cae dentro.**
No hay salto de coste. El juez, además, va igual: 0,012453 $ el 22/10 y 0,0135 el 30-31/10, en el mismo orden.
**Lo que cambia arriba**: el punto 3 se sostiene, y mejor, porque ya el 22/10 NOR-10 costaba el doble de 0,015. El punto 4
queda retirado.
**Es la regla del cero escrita para esto mismo**: «una cifra fabricada no nace de un error de cálculo, nace de reutilizar un
número cuyo contexto ya no se sostiene». Y la escribió Code dos horas después de anotar que había repetido el 0,015 sin
mirar. Al registro.

### SÓLO SE PRE-REGISTRAN LAS PREDICCIONES QUE DECIDEN ALGO (arquitecto, 02/11/2026)

El «15-25 %» no estaba registrado y queda como expectativa contada después. **Pero no se convierte en ceremonia para todo**:
sólo se pre-registran las predicciones que DECIDEN algo. Ésa no decidía nada. P-VN-1 y los umbrales sí, y se registraron a
tiempo.

## LA TANDA DEL VERIFICADOR NUEVO, DÍA 2 (NOR-11): LA PUNTUACIÓN Y EL CIERRE DEL PASO 2 (arquitecto y Code, 03/11/2026)

Salidas literales en `claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`, comprobadas con script.

**LA BANDA, como se escribió el 02/11 a las 18:38, sin reinterpretar**: ≥16 de 21 lo demuestra; 14-15 lo sugiere; 10-13
ambiguo; ≤9 «no se ve rescate», que no significa que no hubiera nada que rescatar. **El quinto: 9 de 21, en la última
banda.** Si el muerto sin texto de la pasada 9 fuera el quinto, serían 10: en el límite inferior de «ambiguo» (ver la
corrección 1). P-VN-2 («el quinto tampoco sube mucho») se cumple. **Fisher contra la base (5 de 13): p = 1,000 con 9 y
p = 0,728 con 10. No se ha movido nada, ni arriba ni abajo.**

### LA LECTURA DEL ARQUITECTO (sus puntos 1 a 10, resumidos; la aritmética de los puntos 8 a 10, firmada por él)

1. El quinto, 9 de 21. 2. Especie: 8 sin etiqueta y 1 con `norma_contra_norma` (la pasada 3). 3. Muertas en la puerta con
texto, 0; sin texto, 4 en 4 pasadas, ninguna con la marca del verificador. 4. `sin_veredicto`: 0 en las cuatro mediciones.
5. El contador: 0 en 42 pasadas. 6. El coste de NOR-11: +1,8 %, el verificador +7,1 %, de 39,5 a 40,0 s. 7. «El juicio
del juez sobre la pareja está en la base, con tipo, % de solape y contadores crudos: SALDA la deuda.» 8. 42,9 %, Wilson del
24,5 al 63,5 %, Fisher p = 1,0. 9. Las tres familias (sin_relacion, 5; tema_similar con 0, 6; con 1, 10), y «el quinto
sale en 9 de las 10 pasadas en que el juez emite una contradicción cruda». 10. El % de solape no separa el quinto.
**Code: los puntos 2 a 6, 8 y 10, comprobados y bien. La aritmética entera, bien** (`cuentas_nor11.mjs`, de un solo uso).

### LAS CORRECCIONES DE CODE

1. **«9 EXACTAS, sin cota superior» no se sostiene: son 9 o 10.** `SQL_34_07` cierra los AGUJEROS (las 5 pasadas sin
   «discarded» son cero real), no los MUERTOS SIN TEXTO. Hay 4 muertos sin texto, y tres van en pasadas que ya tienen el
   quinto publicado (la 3, la 10 y la 12): ahí el muerto es otro hallazgo. **El de la pasada 9 puede ser el quinto.** Como
   las muertes sin texto van por pareja y no por caso, la cifra es «de 9 a 10 de 21».
2. **El punto 7 es falso, y la deuda sigue abierta.** Los «contadores crudos» de `SQL_34_07` son las longitudes de
   `judgments[].contradictions` y `overlappingContent` (sus líneas 87-88), y lo guardado ahí es lo que SOBREVIVIÓ:
   `contradictions: keptContradictions` (`lib/analysis/pipeline.ts:720`, después de la puerta y del verificador), y los
   solapamientos llevan dentro los reclasificados (`:721`). **Lo que sí es crudo: el veredicto y el % de solape**, que nadie
   reescribe después del juez (`judge.ts:964`). Lo que emitió el juez sigue sólo en el log (pendiente del medidor, en el
   estado).
3. **El punto 9, releído con eso**: las 10 pasadas «con 1» son las pasadas en que SOBREVIVIÓ una contradicción en la pareja.
   Que el quinto esté en 9 de ellas es casi una tautología: el quinto ES una contradicción superviviente de esa pareja. La
   otra, la pasada 1, guarda un hallazgo distinto.
   **Lo que sí se puede decir, DEDUCIDO y no medido**: en las 6 pasadas «tema_similar con 0» no hay ninguna muerte contada
   salvo en la 9 (la suma «sin texto» de `SQL_34_06` incluye el verificador, la frontera, la puerta y las reclasificaciones,
   `descartado.equivalentes`, `pipeline.ts:570`). Así que **el juez no emitió ninguna contradicción en esa pareja en 10 de
   las 21 pasadas** (la 2, la 4, la 8, la 13, la 15, la 17, la 18, la 19, la 20 y la 21), **5 de ellas porque la declaró sin
   relación** (eso sí, medido: el veredicto se guarda). **En la 9 emitió al menos una que murió sin texto.** Es la deducción
   que la deuda del medidor haría innecesaria.
4. **La retirada de la banda: la aritmética es buena y la lectura no.** Con la tasa de la base, P(X ≤ 9) = 74,1 %, P(X ≥ 16)
   = 0,05 % (comprobado). Pero el 74,1 % no es una tasa de fallo falso: con el cambio sin efecto, «no se ve rescate» es la
   lectura CORRECTA. Y las tasas de error sí se calcularon el 02/11 a las 18:38: contra la nula (≥16 por azar, 0,05 %) y
   contra el rescate de los cuatro (≤9, 1,1 %). **Lo que faltó es otra cosa: la POTENCIA contra los rescates parciales.**

   | Rescatados de los 4 | ≥16, «demuestra» | 14-15 | 10-13 | ≤9 |
   |---|---|---|---|---|
   | 0 (p = 5/13) | 0,0 % | 0,8 % | 25,0 % | 74,1 % |
   | 1 (p = 6/13) | 0,5 % | 4,3 % | 48,4 % | 46,9 % |
   | 2 (p = 7/13) | 3,1 % | 13,8 % | 61,7 % | 21,4 % |
   | 3 (p = 8/13) | 12,2 % | 28,2 % | 53,1 % | 6,4 % |
   | 4 (p = 9/13) | 33,4 % | 36,2 % | 29,3 % | 1,1 % |

   **Ni rescatando los cuatro salía «demuestra» más de una vez de cada tres.** La prueba podía DESCARTAR el rescate entero,
   que es lo que ha hecho: con 9, el rescate de los cuatro queda en un 1,1 %. Pero no podía DEMOSTRAR casi nada.
5. **El pendiente A ya está cerrado desde el 01/11.** `SQL_34_07` se pasó a la ventana del 28/10 de 08:30 a 09:00 con NOR-11
   y 13 esperadas, y sus 4 agujeros salieron cero real (salida literal en la medida, «EL AGUJERO DE «discarded» EN EL QUINTO»).
   **El «hasta 9» de la base no sale de los agujeros: sale de los 4 muertos sin texto** (las pasadas 4, 6, 10 y 11), que
   `SQL_34_07` no puede cerrar. Volver a pasarla no cambiaría nada, y el «hasta 9» se queda, pero por ese motivo.

### LO QUE EL PASO 2 DEJA DICHO (arquitecto, con las cifras corregidas por Code)

**El verificador sin marca es SEGURO** (no mata a ciegas: `sin_veredicto` en 0 en las cuatro mediciones) **y BARATO** (+1,8 %
en NOR-11, +5,4 % en NOR-10). Y **no ha abierto su puerta ni una vez en 42 pasadas** (el contador, en 0). **El quinto no ha
regresado**: de 9 a 10 de 21 frente a 5-9 de 13. Es lo que le pide la decisión de producto del 01/11, guarda de no
regresión y no objetivo.
**El fallo del quinto está arriba, en el juez**: en 10 de 21 pasadas no emite ninguna contradicción en esa pareja
(deducido), y en 5 de ellas porque la declara sin relación (medido). El paso 3 del plan (la pregunta cerrada sobre la
pareja NOR-11·13 ↔ CLI-12·13, 0 créditos, ~0,04 $ por tanda de 20, sin tocar el prompt) apunta exactamente ahí.
*Code: el quinto etiquetado de la pasada 3 se publicó con el contador a 0, así que lo confirmó la pregunta del DATO. Es el
camino arreglado disparándose y respondiendo como caso de dato, que es lo que el quinto es.*

## PASO 3 · LA PREGUNTA CERRADA SOBRE LA PAREJA DEL QUINTO: LAS PREDICCIONES, ANTES DE LANZAR

**Escritas por el arquitecto el 03/11/2026 a las 13:10 (su hora); archivadas por Code a las 13:09 por su reloj (son relojes distintos), antes de construir nada
y antes de la primera pasada.** Texto literal, sacado de su mensaje con un script:

> Predicciones del paso 3, escritas el 03/11/2026 a las 13:10, ANTES de lanzar. Numeradas P-P3-n porque no sé por dónde va la serie de la casa; si hay numeración, renumérala tú y dilo.
>
> CONDICIONES: 21 pasadas (no 20 como decía el plan de la semana 0; subo a 21 SÓLO para que el denominador coincida exacto con la pasada abierta y nadie tenga que explicar mañana por qué los n eran distintos; el coste sube unos 2 milésimos de dólar). Pareja NOR-11 trozo 13 ↔ CLI-12 trozo 13. EL PROMPT NO SE TOCA: su pregunta 1, la del dato, es la que corresponde. Nada más cambia entre pasadas.
>
> LA REFERENCIA: la pasada abierta dio el quinto en 9 de 21 = 42,9 % (Wilson 24,5-63,5 %).
>
> LAS BANDAS, con su tasa de error Y SU POTENCIA, que es la mitad que me faltó ayer:
>
> banda                                     ~~H0=43%~~ H0=42,86%   H1=90%   H2=65%   H3=100%   *(enmienda 1, 16:50)*
> A · lo ve con la pareja delante  [17-21]    0,04%    94,8%     9,2%    100%
> B · lo ve a medias               [13-16]     6,2%     5,2%    61,4%      0%
> C · no mejora convincentemente   [10-12]    34,7%     0,0%    26,3%      0%
> D · la pregunta cerrada NO lo arregla [0-9]  59,1%  0,0000%     3,1%      0%
>
> - Banda A: error 0,04 % y potencia 94,8 % si la verdad es el 90 %. Y el 17 coincide con el primer resultado donde Fisher afirma la diferencia contra 9 de 21 (p = 0,0247). El umbral no es arbitrario.
> - Banda A es CIEGA al caso intermedio a propósito: si la verdad fuera el 65 %, A sólo sale el 9,2 % de las veces. Para eso está B.
> - Banda D no puede salir si la verdad es el 90 %: fallo falso 0,0000 %. Si sale D, no es mala suerte.
> - Fisher por resultado, prefijado para que no se elija después: 11→0,758 · 13→0,354 · 15→0,118 · 17→0,0247 · 19→0,0025 · 21→0,0001.
>
> P-P3-1 (del número): el quinto sale en banda A, 17 o más de 21. Razón: su fallo medido es no llegar a la pareja (11 de 21 sin nada superviviente, 5 de ellas declarando los documentos sin relación), y la pregunta cerrada elimina ese fallo por construcción.
>
> ~~P-P3-2 (de la especie, y vale MÁS que el número): sigue saliendo SIN etiqueta. El quinto es un caso de dato y la taxonomía sólo tiene norma_contra_norma y norma_contra_practica; no poner etiqueta es el acierto. En la pasada abierta fueron 8 bien de 9. SI LA PREGUNTA CERRADA SUBE EL NÚMERO PERO LO ETIQUETA, el resultado es PEOR que un número bajo: significaría que la pregunta lo empuja a la familia equivocada.~~ *(SUSTITUIDA por la versión medible, enmienda 3, 16:50)*
>
> ~~P-P3-3 (del contador): confirmados_solo_por_cumplimiento se queda en 0 en las 21. Si sube, la pregunta cerrada está rescatando el quinto por la puerta equivocada y el número NO es comparable con los 9 de 21.~~ *(RETIRADA por no medible, enmienda 3, 16:50; su sustancia migra a P-P3-2)*
>
> ~~P-P3-4 (de las citas): las dos citas siguen siendo NOR-11 §10.5 («revisa trimestralmente el cumplimiento…») y CLI-12 §6.2 («personal ajeno al área auditada…»), las mismas frases que en la pasada abierta. Y el §4 (el glosario) SIGUE sin aparecer: la semana 0 midió que en las 5 veces que salió el quinto, la cita de CLI-12 fue siempre del §6.2 y nunca del §4. Si ahora aparece el §4, es información nueva y hay que escribirla.~~ *(la mitad del §4, RETIRADA por no poder fallar; la otra mitad se reescribe con las dos frases del §6.2 cuando el ensayo dé el texto guardado; enmienda 3, 16:50)*
>
> P-P3-5 (de lo que NO demuestra): un resultado en banda A no demuestra que la pasada 2 funcione. La pregunta cerrada quita por construcción el fallo de alcance; lo que A demostraría es sólo que el juez SABE LEER este caso con la pareja delante. Que la pasada 2 produzca esa pareja es otra cosa, y su especificación tiene cuatro defectos abiertos. ESTO SE ARCHIVA AHORA para que un 20 de 21 no se lea mañana como permiso para construir el paso 4.
>
> ~~Y lo que haría el resultado NO PUNTUABLE: que se toque el prompt, que cambie la pareja, o que el contador de P-P3-3 se mueva.~~ *(sin «el contador de P-P3-3», retirado; queda: que se toque el prompt o que cambie la pareja; enmienda 3, 16:50)*

**La numeración (Code)**: la serie P-P3-n no choca con ninguna de la casa (P-F130-1 a 19, P-VN, P-VL, P-E3-R). Se queda así.

### LAS NOTAS DE CODE, AL LADO Y SIN TOCAR EL TEXTO (03/11, antes de lanzar)

1. **La aritmética, comprobada** (`bandas_p3.mjs`, de un solo uso): las cuatro bandas bajo las cuatro hipótesis y el Fisher
   prefijado, bien. *Matiz*: la columna «H0=43 %» está calculada con 9/21 = 42,86 % (con el 43 % redondo se mueve la segunda
   decimal: A 0,044 %, B 6,33 %, C 35,06 %, D 58,56 %). Y para el hueco entre 15 y 17: 16 → p = 0,058.
2. ⚠️ **P-P3-3 NO SE PUEDE MEDIR CON ESTA HERRAMIENTA TAL COMO ESTÁ ESCRITA.** `verificador.confirmados_solo_por_cumplimiento`
   es un contador del VERIFICADOR DEL PRODUCTO (`pipeline.ts:653`). La pregunta cerrada (`app/api/admin/medida-f130/`) llama
   al modelo del juez con su propio prompt y devuelve TEXTO: no pasa por el verificador ni escribe `pipelineCounters`. El
   análogo dentro de la herramienta sería «el modelo contesta "no" a la pregunta 1 y "no" a la 2» (el quinto encontrado SÓLO
   por el cumplimiento). Si P-P3-3 no se reescribe antes de lanzar, **la condición de NO PUNTUABLE que depende de ella no se
   puede evaluar**.
3. ⚠️ **P-P3-4, en su mitad del §4, no puede fallar.** La herramienta entrega al modelo SÓLO los dos trozos 13; el §4 de
   CLI-12 está en los trozos 7 a 9 (`claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md:1374`), así que no puede aparecer. Una
   predicción que no puede fallar no informa. Y en su otra mitad: en la pasada abierta la cita de CLI-12 fue de **dos**
   frases distintas del §6.2, las dos del trozo 13: «Las auditorías internas las realiza siempre personal ajeno…» (7 de 9)
   y «…participa en la auditoría como interlocutor, pero no como auditor de su propia área» (2 de 9: las pasadas 3 y 6).
   P-P3-4 nombra sólo la primera.
4. **P-P3-2 en esta herramienta**: el prompt sólo pide etiqueta cuando la pregunta 2 dispara («no se pueden cumplir»). Con
   la pregunta 1 en «sí» y la 2 en «sí», no hay etiqueta posible. «Sin etiqueta» equivale aquí a «la pregunta 2 no dispara».
5. **Falta el CRITERIO DE CUENTA, y tiene que estar escrito antes de lanzar**: qué respuesta cuenta como «el quinto sale».
   Propuesta, para que la decida el arquitecto: la pregunta 1 en «sí», con una cita de NOR-11 que contenga «revisa
   trimestralmente el cumplimiento» y una de CLI-12 que contenga «personal ajeno al área auditada» o «no como auditor de su
   propia área». Las respuestas que no casen con eso se leen aparte y se cuentan, como las dudosas de `SQL_34_06`.

### LAS ENMIENDAS, ANTES DE LANZAR (arquitecto, 03/11/2026; archivadas por Code a las 16:50, con la versión de las 13:10 tachada en su sitio)

**ENMIENDA 1 · El rótulo del H0.** La tabla ponía «H0 = 43 %»; el cálculo usó 9/21 = 42,857 % exacto. El rótulo pasa a
42,86 % y las cifras se quedan como están, porque ya salían de 9/21.

**ENMIENDA 2 · LO QUE MIDE LA HERRAMIENTA FRENTE A LA PASADA ABIERTA: TRES DIFERENCIAS, NO UNA** (aceptada con el matiz de
Code). La ruta de la pregunta cerrada llama al modelo con la configuración del juez y nada más
(`app/api/admin/medida-f130/preguntar-al-juez.ts:18`). Frente a los 9 de 21 PUBLICADOS de la pasada abierta:
1. **otro prompt, la pregunta cerrada: ES LA INTERVENCIÓN**, y se quiere medir;
2. **sólo los dos trozos, no los documentos enteros: ES LA INTERVENCIÓN**, y se quiere medir;
3. **sin la puerta de citas y sin el verificador: ES LA CONTAMINACIÓN.** Sesga la comparación A FAVOR de la pregunta
   cerrada, porque un publicado nunca puede ser mayor que lo emitido.
**LA LECTURA, escrita ahora**: la banda D (≤9) sería evidencia FUERTE en contra, porque perdería una comparación sesgada a
su favor. La banda A (≥17) es MÁS DÉBIL de lo que parece, porque parte de la subida son la puerta y el verificador
ausentes. La referencia honesta sería la tasa de EMISIÓN del juez en la pasada abierta, y no está medida: es la deuda del
medidor (lo que el juez emite por pareja sólo vive en los logs). Lo más cerca que hay: en 11 de 21 pasadas no sobrevivió
nada en esa pareja, y una de las once, la 9, emitió algo que murió sin texto.

**ENMIENDA 3 · Lo que no se puede medir, retirado; y lo que sobrevive, a la vista.**
- **P-P3-3, RETIRADA por no medible**: el contador es del verificador del producto, y la herramienta no pasa por él. **Su
  sustancia no se pierde: migra a P-P3-2**, que mide la misma preocupación (por qué puerta entra el quinto) con lo que esta
  ruta sí devuelve.
- **P-P3-2, CONSERVADA EN SU VERSIÓN MEDIBLE**, que sustituye a la de las 13:10 (que hablaba de la especie del producto, y
  esta ruta no la emite):
  > «P-P3-2 (de la familia, y vale MÁS que el número): la pregunta 2 no dispara. El quinto es un caso de dato y la pregunta
  > 1 es la que le corresponde. Si la pregunta 2 dispara, el juez está leyendo el caso en la familia del cumplimiento — el
  > mismo error que etiquetarlo norma_contra_norma, con otro traje. Un número alto con la pregunta 2 disparando es PEOR
  > resultado que un número bajo con la pregunta 1 limpia.»
- **P-P3-4, la mitad del §4, RETIRADA por no poder fallar**: el §4 no está en lo que se entrega. La otra mitad se reescribe
  con las DOS frases del §6.2 que se citaron en la pasada abierta («personal ajeno al área auditada…» y «…no como auditor de
  su propia área») en cuanto el ensayo dé el texto guardado.
- **Lo que haría el resultado NO PUNTUABLE**, sin el contador retirado: que se toque el prompt o que cambie la pareja.

**ENMIENDA 4 · NUEVA: LAS DOS INTERVENCIONES VAN JUNTAS, Y UNA BANDA A NO DIRÁ CUÁL DE LAS DOS LO CONSIGUIÓ** (arquitecto, a
partir del reparto de la enmienda 2). Si sale A, no se sabrá si fue la pregunta más afilada o el pajar más pequeño. Y
importa para el paso 4, porque la pasada 2 entrega parejas (pajar pequeño) y habrá que decidir con qué prompt.
**El remedio, nombrado y NO CONSTRUIDO HOY**: un segundo brazo, la misma pregunta cerrada con los dos documentos ENTEROS, o
el prompt abierto con sólo la pareja. Otra tanda de unos 0,04 $. **Queda como límite conocido, para que cuando llegue el
número nadie diga «entonces la pasada 2 funciona».**

**EL ORDEN, CORREGIDO POR CODE Y ACEPTADO**: el ensayo es parte de la herramienta, así que va después del diff. (1) Estas
enmiendas; (2) el diff de la herramienta, sin comitear: la ruta del quinto, el ensayo con `?ensayo=1`, la negativa dura si
un trozo no contiene su frase (con su prueba), los dos botones y las pruebas; (3) aprobado y subido, el director pulsa el
ensayo; (4) las dos frases como están guardadas, con su número de trozo real; el arquitecto confirma la pareja y cierra
P-P3-4; (5) la tanda de 21. **Nada de modelo ni de coste hasta el 5.**

### PASO 3 · LA PAREJA, CONFIRMADA POR EL ARQUITECTO, Y TRES NOTAS SUYAS (03/11/2026, 20:45; archivadas por Code a las 20:50)

⚠️ **LA SALIDA DEL ENSAYO NO HA LLEGADO A CODE.** El arquitecto dice haber leído los dos textos enteros; a Code no le ha
llegado ninguna salida de `quinto?ensayo=1`. Lo que sigue es lo que escribió el arquitecto, sin comprobar contra el texto
guardado hasta que llegue la salida.

**LA PAREJA, CONFIRMADA (arquitecto)**: NOR-11·13, generación 1, con ~~el §10 entero~~ **los apartados 10.3, 10.4 y 10.5 del §10** *(corrección de Code, aceptada el 03/11: el §10 tiene cinco)* de «Errores frecuentes y buenas
prácticas», el §10.5 y su frase literal; CLI-12·13, generación 1, con el §6 de auditorías internas y las DOS frases del §6.2.
Si algún día se reindexa cualquiera de los dos, el 13 puede dejar de ser esa sección, y la negativa dura lo caza porque
comprueba la frase y no el número.

**P-P3-4, CERRADA con el texto guardado y sin la mitad del §4** (literal del arquitecto):
> «Las citas siguen siendo NOR-11 §10.5 ("El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de
> los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los
> gabinetes…") y CLI-12 §6.2, en sus DOS frases ("Las auditorías internas las realiza siempre personal ajeno al área
> auditada, habitualmente el Coordinador de Calidad de otra clínica de la red…" y "El Coordinador de Calidad de la propia
> clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área").»

**NOTA AL PIE DE P-P3-1, CON SU HORA; LA PREDICCIÓN NO CAMBIA** (literal del arquitecto):
> «03/11, 20:45, después del ensayo y antes de la tanda. El trozo de NOR-11 trae ~~el §10 entero~~ **[los apartados 10.3 a 10.5 del §10: corrección de Code, aceptada]** (10.3 contenedores, 10.4
> mezcla de grupos, 10.5 revisión), y el "este apartado" del §10.5 remite a esos criterios de residuos. Ese contexto hace MÁS
> difícil identificar la revisión trimestral con una "auditoría interna", no más fácil. El arquitecto baja su confianza en la
> banda A y NO cambia la predicción: el mecanismo en que se apoyaba —el fallo medido es no llegar a la pareja, y la pregunta
> cerrada lo elimina por construcción— no ha cambiado. Sólo ha cambiado el tamaño de la dificultad restante. Una predicción
> que se mueve porque se le ha visto mejor la cara, sin mecanismo nuevo, deja de poder fallar.»

**P-P3-2, SIN AMBIGÜEDAD (arquitecto)**: la pregunta 2 sólo se hace «cuando los dos textos sean reglas», y los dos lo son, así
que SE HARÁ. **P-P3-2 dice que no PRODUCE HALLAZGO, no que no se haga.** Y su apoyo ya no es la clasificación del arquitecto:
es que en la pasada abierta el juez sacó el quinto SIN etiqueta 8 veces de 9, o sea que él mismo lo enruta por la pregunta
1. Es una medición, no una opinión (`claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`, día 2: la etiqueta, sólo en la pasada 3).

### PASO 3 · LAS NOTAS DE LAS 20:45, COMPROBADAS CONTRA EL ENSAYO (Code, 03/11/2026)

La salida del ensayo llegó y está archivada, literal, en `claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md` («PASO 3 · EL
ENSAYO…»). **Lo que el arquitecto escribió a las 20:45 se sostiene contra el texto guardado**, con una precisión:
- la pareja: NOR-11·13 y CLI-12·13, generación 1 los dos. **Confirmada.**
- **P-P3-4, cerrada**: las tres frases que cita son el principio literal de las guardadas (comprobado con script).
- **La precisión, a la nota al pie de P-P3-1 y a la confirmación de la pareja**: el trozo de NOR-11 no trae «el §10 entero»,
  sino sus apartados 10.3, 10.4 y 10.5. El 10.1 y el 10.2 van en otro trozo. La lista del arquitecto («10.3 contenedores,
  10.4 mezcla de grupos, 10.5 revisión») es exacta, y su razonamiento no cambia: el «este apartado» del 10.5 sigue remitiendo
  a criterios de residuos.

### ⚠️ EL CRITERIO DE CUENTA DEL PASO 3, FIJADO ANTES DE LA TANDA (arquitecto, 03/11, 21:20; archivado por Code el 04/11 a las 08:16)

Literal del arquitecto:

> «CRITERIO DE CUENTA DEL PASO 3 (arquitecto, 03/11 21:20, antes de la tanda).
>
> QUIÉN CUENTA: Code, mecánicamente, con este criterio, ANTES de que el arquitecto lea las respuestas. El arquitecto las lee
> después y dice si discrepa de alguna, con su número. El que escribió la predicción no hace el recuento.
>
> UNA RESPUESTA CUENTA COMO «EL QUINTO» si, atada a un hallazgo afirmado, trae LAS DOS CITAS:
>   · del lado de NOR-11, una cita que contenga literalmente «revisa trimestralmente el cumplimiento»;
>   · del lado de CLI-12, una cita que contenga literalmente «personal ajeno al área auditada» O «no como auditor de su propia
>     área».
> Son las anclas que ya están en FRASES_DEL_QUINTO, así que el emparejado es el mismo que usó SQL_34_06 con la pasada abierta.
> Si el emparejado no es el mismo, los dos números no son comparables, y la comparabilidad es todo el objetivo.
>
> «ATADA A UN HALLAZGO AFIRMADO» significa: la pregunta 1 contesta «sí», o la pregunta 2 contesta que no se pueden cumplir
> las dos. Las dos citas correctas colgando de un «no hay hallazgo» NO cuentan.
>
> DOS COLUMNAS, NO UNA:
>   (1) ¿salió el quinto? sí/no — ésta es la que se compara con los 9 de 21.
>   (2) ¿por qué pregunta? la 1, la 2, o las dos — ésta es la que puntúa P-P3-2, y no afecta a la columna (1).
> Un quinto que salga por la pregunta 2 SÍ cuenta en (1) y hace FALLAR P-P3-2. Son cosas distintas y se miden aparte.
>
> LO QUE NO CASE VA A UN TERCER CUBO Y SE NOMBRA, no se asigna: respuestas con una sola de las dos citas, con una cita de otro
> apartado de CLI-12 (el §6.1 o el §6.3, por ejemplo), o cuyo sentido no se pueda decidir. El denominador se queda en 21 y las
> dudosas se enumeran, igual que la columna «dudosas aparte» de SQL_34_06. NINGUNA RESPUESTA SE DECIDE A OJO.»

*Code, una nota que no cambia el criterio*: «el mismo emparejado que usó SQL_34_06» vale para el lado de NOR-11 y el de
CLI-12, que `SQL_34_06` también ancla en el §10.5 y en el §6.2. Que el recuento sea mecánico obliga a decidir, con el texto de
las respuestas delante, cómo se reconoce «la pregunta 1 contesta sí»: la respuesta es texto libre. Code lo hará con una regla
escrita en el mismo script que cuente, enseñándola antes del número, y lo que la regla no decida va al tercer cubo.

### ENTRE EL ENSAYO Y LA TANDA NO SE REINDEXA NADA (arquitecto, 03/11; regla)

> «ENTRE EL ENSAYO Y LA TANDA NO SE REINDEXA NADA. La negativa dura comprueba la frase, no el texto que la rodea: un troceado
> nuevo podría dejar la frase en el trozo 13 con otros apartados alrededor, y el prompt cambiaría sin que nada avisara. Si se
> reindexa cualquiera de los dos documentos, el ensayo se repite antes de la tanda. Va con la disciplina de tandas, que ya
> prohíbe reindexar DURANTE; esto lo prohíbe también ENTRE el ensayo y la tanda.»

**Con el criterio fijado y esta regla escrita, la tanda queda APROBADA por el arquitecto** (03/11). Su reserva sobre la ruta,
retirada: leyó `quinto/route.ts` entero.

### ⚠️ LA REGLA DE CUENTA, APROBADA, Y LOS TRES PRERREGISTROS, ANTES DE LA TANDA (arquitecto y Code, 04/11/2026; archivado a las 08:56)

**LA REGLA DE RECONOCIMIENTO (R1 a R4), APROBADA por el arquitecto tal como está escrita, con sus tres límites declarados**:
no juzga la literalidad más allá del ancla; no entiende el sentido (un «sí» en la primera línea que se desdice en la tercera
cuenta como «sí»); y es conservadora a propósito (ante un formato raro, manda al cubo antes que adivinar).
*El arquitecto se probó contra las trampas antes de proponer nada*: su impulso era aflojar R2 (con «sí» y «no» en la línea del
veredicto, tomar el primero si es la primera palabra), y la trampa «No obstante, sí» la mata: la habría leído «no». **Mandar al
cubo siempre es seguro; asignar mal no lo es nunca. NO SE TOCA.**

**LOS TRES PRERREGISTROS (arquitecto), literales:**
1. **UNA LLAMADA FALLIDA NO ES UN «NO»**: «Una llamada que no sale bien NO es un veredicto y NO cuenta como "el juez no vio el
   quinto". La tanda es puntuable SÓLO con 21 respuestas buenas. Las fallidas se repiten —mismo prompt, misma pareja, nada
   varía— hasta tener 21. Un reintento es una extracción de la misma distribución, porque por diseño no cambia nada entre
   pasadas, así que no sesga. Cada reintento cuesta ~0,002 $. Y el registro deja escrito cuántas fallaron y se repitieron.»
   *Code*: la versión que aprobó el arquitecto (huella `5125a34d0be5f842`) NO hacía esto (mandaba la fallida al cubo como «sin respuesta») y la ruta
   no puede repetir sólo las fallidas: cada pulsación lanza 21 llamadas. **Cómo se cumple, fijado ahora**: las fallidas no
   van al cubo; si hay menos de 21 buenas, el director pulsa otra vez, y las que faltan son **las PRIMERAS respuestas buenas de
   la pulsación siguiente, por orden de vez**. El script lo hace, y dice cuántas fallaron.
2. **EL CUBO TIENE UN TAMAÑO MÁXIMO**: «Si el cubo supera las 4 de 21, las bandas se declaran ILEGIBLES. No se reinterpretan
   sobre un denominador más pequeño y no se baja el umbral: se endurece la regla con lo que el cubo haya enseñado y SE REPITE LA
   TANDA entera. El 4 sale de que la banda A pide 17 de 21; no es una cifra elegida.»
3. **EL CUBO SE ENSEÑA ANTES DEL NÚMERO**: «Code informa primero del tamaño del cubo y del motivo de cada respuesta que cae en
   él, y sólo después del número de la columna 1. Si el cubo cabe en 4, se lee el número; si no, se repite la tanda. El
   arquitecto no ve el número antes de saber si la regla fue utilizable.»
Y lo ya fijado, para no mezclar al informar: **columna 1, «¿salió el quinto?»**, la que se compara con los 9 de 21; **columna
2, «¿por qué pregunta?»**, que puntúa P-P3-2 y no afecta a la 1.

**EL SCRIPT QUE CUENTA, ENTERO, CONGELADO POR SU HUELLA `2db4208f2d928a8d`** (sha256, los 16 primeros; `contar_quinto.mjs`, de un solo
uso, en el scratchpad de Code). Sustituye a la versión de huella `5125a34d0be5f842`, la que vio el arquitecto, por los
cambios de los prerregistros, todos ANTES de la tanda. Pasa 23 de 23 pruebas sobre respuestas inventadas: las 19 de la regla
y 4 de los prerregistros. Si se cambia una sola línea después de la tanda, la huella no casa:

```js
// LA REGLA DE CUENTA DEL PASO 3 DE F-130, EN CÓDIGO (Code, 04/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Implementa el criterio del arquitecto (03/11, 21:20) y la regla de reconocimiento que él aprueba antes de pulsar.
// Uso: node contar_quinto.mjs <salida-de-la-tanda.json>   ·   node contar_quinto.mjs --pruebas
import { readFileSync } from 'node:fs';

export const ANCLA_NOR11 = 'revisa trimestralmente el cumplimiento';
export const ANCLAS_CLI12 = ['personal ajeno al área auditada', 'no como auditor de su propia área'];

const plano = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
const sinMarcas = s => s.replace(/[*_#>`]/g, '');

// R1 · LAS DOS SECCIONES. Cabeceras «PREGUNTA 1» y «PREGUNTA 2» (mayúsculas o no, con o sin espacio); si no están las dos,
// una vez cada una y en orden, se prueba la forma numerada a principio de línea («1.» o «1)» y «2.» o «2)»). Si tampoco,
// la respuesta va al tercer cubo: «sin las dos secciones».
export function secciones(texto) {
  const t = sinMarcas(texto);
  const probar = (re1, re2) => {
    const a = [...t.matchAll(re1)], b = [...t.matchAll(re2)];
    if (a.length !== 1 || b.length !== 1 || a[0].index >= b[0].index) return null;
    return { p1: t.slice(a[0].index + a[0][0].length, b[0].index), p2: t.slice(b[0].index + b[0][0].length) };
  };
  return probar(/pregunta\s*1\b/gi, /pregunta\s*2\b/gi) ?? probar(/^[ \t]*1[.)]/gm, /^[ \t]*2[.)]/gm);
}

// R2 · EL VEREDICTO de cada sección: en la PRIMERA LÍNEA NO VACÍA de la sección que no sea una pregunta (no acaba en «?»; lo
// que queda de la línea de la cabecera cuenta si tiene texto), se buscan las palabras enteras «sí» y «no». «si» SIN TILDE
// cuenta como «sí» SÓLO si es la primera palabra y va sola o con puntuación («Si.», «Si,»): suelto, también es el condicional
// («Si se hace lo que permite…»). Exactamente una de las dos clases → ése es el veredicto; ninguna o las dos → «veredicto sin
// decidir». Sólo esa línea, para que el «no» de «no como auditor de su propia área» dentro de una cita no se lea como respuesta.
export function veredicto(seccion) {
  const linea = (seccion.split('\n').map(l => l.replace(/^[\s·:.\-–—]*(el dato|el cumplimiento)?[\s·:.\-–—]*/i, ''))
    .find(l => l.trim() !== '' && !l.trim().endsWith('?')) ?? '').trim();
  const si = /(^|[^\p{L}])sí([^\p{L}]|$)/iu.test(linea) || /^si([.,;:!]|$)/i.test(linea);
  const no = /(^|[^\p{L}])no([^\p{L}]|$)/iu.test(linea);
  return si && !no ? 'sí' : no && !si ? 'no' : null;
}

// R3 · LAS CITAS: los tramos entre «…», “…” o "…" de la sección. Se contrastan con las anclas en minúsculas y con los espacios
// colapsados; una cita casa con un ancla si la contiene entera.
export function citas(seccion) {
  return [...seccion.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => plano(m[1] ?? m[2] ?? m[3] ?? ''));
}
function anclasDe(seccion) {
  const c = citas(seccion), p = plano(seccion);
  const nor = c.some(x => x.includes(ANCLA_NOR11)), cli = c.some(x => ANCLAS_CLI12.some(a => x.includes(a)));
  const fueraNor = !nor && p.includes(ANCLA_NOR11), fueraCli = !cli && ANCLAS_CLI12.some(a => p.includes(a));
  return { nor, cli, fueraNor, fueraCli };
}

// R4 · LA CUENTA. «Hallazgo afirmado» = la 1 en «sí», o la 2 en «no». Una pregunta con hallazgo afirmado da EL QUINTO si su
// sección trae, ENTRE COMILLAS, una cita con el ancla de NOR-11 y otra con una de las dos de CLI-12. Lo que no case va al
// TERCER CUBO con su motivo, y nunca se decide a ojo:
//   · sin respuesta (error de la API o texto vacío); · sin las dos secciones; · veredicto sin decidir en una pregunta;
//   · hallazgo afirmado con una sola de las dos anclas; · hallazgo afirmado con un ancla fuera de comillas;
//   · hallazgo afirmado sin ninguna de las anclas (otro hallazgo, o citas de otro apartado).
// Columna 1: sí, si alguna pregunta da el quinto limpio (aunque la otra caiga al cubo: entonces la columna 2 queda «sin
// decidir»). Columna 2: la 1, la 2 o las dos. Sin hallazgo afirmado en ninguna de las dos (y las dos decididas): «no salió»,
// aunque las anclas aparezcan colgando de un «no hay hallazgo».
export function contar(respuesta) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { quinto: null, cubo: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { quinto: null, cubo: ['sin las dos secciones'] };
  const v1 = veredicto(s.p1), v2 = veredicto(s.p2);
  const cubo = [], por = [];
  for (const [n, v, sec, afirma] of [[1, v1, s.p1, 'sí'], [2, v2, s.p2, 'no']]) {
    if (v === null) { cubo.push(`pregunta ${n}: veredicto sin decidir`); continue; }
    if (v !== afirma) continue;
    const a = anclasDe(sec);
    if (a.nor && a.cli) { por.push(n); continue; }
    if (a.fueraNor || a.fueraCli) cubo.push(`pregunta ${n}: hallazgo con un ancla fuera de comillas`);
    else if (a.nor || a.cli) cubo.push(`pregunta ${n}: hallazgo con una sola de las dos anclas`);
    else cubo.push(`pregunta ${n}: hallazgo sin las anclas del quinto`);
  }
  if (por.length > 0) return { quinto: true, porPregunta: cubo.length ? 'sin decidir' : (por.length === 2 ? 'las dos' : `la ${por[0]}`), cubo };
  if (cubo.length > 0) return { quinto: null, cubo };
  return { quinto: false, cubo: [] };
}

// LOS TRES PRERREGISTROS DEL ARQUITECTO (04/11), antes de la tanda:
// P1 · UNA LLAMADA FALLIDA NO ES UN «NO»: no es un veredicto y no va al cubo. La tanda es puntuable SÓLO con 21 respuestas
//      buenas; las que falten se completan con las primeras buenas de la pulsación SIGUIENTE, por orden de vez. Se escribe
//      cuántas fallaron y cuáles las sustituyeron.
// P2 · EL CUBO TIENE UN TAMAÑO MÁXIMO, 4: la banda A pide 17 de 21. Por encima, las bandas son ILEGIBLES y se repite la tanda.
// P3 · EL CUBO SE ENSEÑA ANTES DEL NÚMERO: primero las fallidas, luego el cubo con el motivo de cada una, y el número sólo si
//      el cubo cabe en 4.
export const N_TANDA = 21;
export const CUBO_MAXIMO = 4;
const fallida = r => !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';

export function resumen(pulsaciones) {
  const buenas = [], fallidas = [];
  pulsaciones.forEach((respuestas, p) => respuestas.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    if (fallida(r)) { if (buenas.length < N_TANDA) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`); }
    else if (buenas.length < N_TANDA) buenas.push({ id, ...contar(r) });
  }));
  const salida = [`1 · LAS FALLIDAS: ${fallidas.length}${fallidas.length ? ' — ' + fallidas.join(' · ') : ''}`];
  if (buenas.length < N_TANDA) {
    salida.push(`NO PUNTUABLE TODAVÍA: ${buenas.length} respuestas buenas de ${N_TANDA}. Se pulsa otra vez y las que faltan salen de la siguiente.`);
    return salida;
  }
  const cubo = buenas.filter(f => f.cubo.length > 0);
  salida.push(`2 · EL TERCER CUBO: ${cubo.length} de ${N_TANDA}${cubo.length ? ' — ' + cubo.map(f => `${f.id}: ${f.cubo.join('; ')}`).join(' · ') : ''}`);
  if (cubo.length > CUBO_MAXIMO) {
    salida.push(`ILEGIBLE: el cubo pasa de ${CUBO_MAXIMO} y la banda A (17 de 21) ya no se puede alcanzar. Se endurece la regla con lo que el cubo ha enseñado y se repite la tanda entera.`);
    return salida;
  }
  const limpias = buenas.filter(f => f.quinto === true);
  salida.push(`3 · COLUMNA 1, ¿salió el quinto?: ${limpias.length} de ${N_TANDA} (se compara con los 9 de 21)`);
  salida.push(`4 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): ` +
    ['la 1', 'la 2', 'las dos', 'sin decidir'].map(k => `${k}: ${limpias.filter(f => f.porPregunta === k).length}`).join(' · '));
  return salida;
}

// LAS PRUEBAS, sobre respuestas INVENTADAS antes de la tanda: los casos que la regla tiene que decidir, y las trampas
const R = (vez, respuesta) => ({ vez, respuesta });
const N = '«El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos»';
const C1 = '«Las auditorías internas las realiza siempre personal ajeno al área auditada»';
const C2 = '«participa en la auditoría como interlocutor, pero no como auditor de su propia área»';
const PRUEBAS = [
  ['el quinto por la 1', R(1, `PREGUNTA 1 · EL DATO\nSí.\nTexto 1: ${N}\nTexto 2: ${C1}\n\nPREGUNTA 2 · EL CUMPLIMIENTO\nSí, se pueden cumplir.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['el quinto por la 1, con la otra frase de CLI-12 y la cabecera en negrita', R(2, `**Pregunta 1:** Sí\n${N} / ${C2}\n**Pregunta 2:** Sí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['el quinto por la 2 (hace fallar P-P3-2)', R(3, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo. ${N} ${C1} norma_contra_norma`), { quinto: true, porPregunta: 'la 2', cubo: [] }],
  ['el quinto por las dos', R(4, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nNo. ${N} ${C2} norma_contra_norma`), { quinto: true, porPregunta: 'las dos', cubo: [] }],
  ['no salió: sin hallazgo en ninguna', R(5, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), { quinto: false, cubo: [] }],
  ['TRAMPA: las anclas colgando de un «no»', R(6, `PREGUNTA 1\nNo, ${N} y ${C1} no hablan del mismo dato.\nPREGUNTA 2\nSí.`), { quinto: false, cubo: [] }],
  ['TRAMPA: el «no» de «no como auditor» dentro de una cita, en la segunda línea', R(7, `PREGUNTA 1\nSí.\n${N}\n${C2}\nPREGUNTA 2\nSí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['al cubo: «sí» y «no» en la misma primera línea', R(8, 'PREGUNTA 1\nNo es exactamente el mismo dato, pero sí hay diferencia.\nPREGUNTA 2\nSí.'), { quinto: null, cubo: ['pregunta 1: veredicto sin decidir'] }],
  ['al cubo: una sola de las dos anclas', R(9, `PREGUNTA 1\nSí. ${N} «El sistema de calidad se apoya en un calendario anual»\nPREGUNTA 2\nSí.`), { quinto: null, cubo: ['pregunta 1: hallazgo con una sola de las dos anclas'] }],
  ['al cubo: un ancla fuera de comillas', R(10, `PREGUNTA 1\nSí.\nNOR-11 dice que el Coordinador revisa trimestralmente el cumplimiento; CLI-12: ${C1}\nPREGUNTA 2\nSí.`), { quinto: null, cubo: ['pregunta 1: hallazgo con un ancla fuera de comillas'] }],
  ['al cubo: otro hallazgo, sin las anclas', R(11, 'PREGUNTA 1\nSí. «Se distinguen auditorías de proceso» «contenedor de los grupos III o IV»\nPREGUNTA 2\nSí.'), { quinto: null, cubo: ['pregunta 1: hallazgo sin las anclas del quinto'] }],
  ['al cubo: sin las dos secciones', R(12, `Sí, hay contradicción: ${N} ${C1}`), { quinto: null, cubo: ['sin las dos secciones'] }],
  ['al cubo: sin respuesta (error de la API)', { vez: 13, error: 'HTTP 529' }, { quinto: null, cubo: ['sin respuesta'] }],
  ['el quinto por la 1, la 2 sin decidir', R(14, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`), { quinto: true, porPregunta: 'sin decidir', cubo: ['pregunta 2: veredicto sin decidir'] }],
  ['la forma numerada, si no hay cabeceras', R(15, `1. Sí. ${N} ${C1}\n2. Sí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['«si» sin tilde cuenta como «sí»', R(16, `PREGUNTA 1\nSi.\n${N} ${C1}\nPREGUNTA 2\nSi.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['«No obstante» no es un «no» suelto... sí lo es: la palabra «no» entera', R(17, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), { quinto: null, cubo: ['pregunta 1: veredicto sin decidir'] }],
  ['TRAMPA: «Si» condicional no es un «sí»', R(18, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSi se hace lo que una permite, la otra se cumple igual.'), { quinto: null, cubo: ['pregunta 2: veredicto sin decidir'] }],
  ['TRAMPA: el modelo repite la pregunta antes de contestar', R(19, `PREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nSí.\n${N} ${C1}\nPREGUNTA 2 · EL CUMPLIMIENTO\n¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?\nSí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
];

// LAS PRUEBAS DEL RESUMEN: los tres prerregistros
const bien = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nSí.`);
const nada = v => R(v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.');
const raro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.');
const caida = v => ({ vez: v, error: 'HTTP 529' });
const veces = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const PRUEBAS_DEL_RESUMEN = [
  ['P1: dos fallidas y sin segunda pulsación → no puntuable', [[...veces(19, bien), caida(20), caida(21)]],
    ['1 · LAS FALLIDAS: 2 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529', 'NO PUNTUABLE TODAVÍA: 19 respuestas buenas de 21. Se pulsa otra vez y las que faltan salen de la siguiente.']],
  ['P1: las dos que faltan, de las PRIMERAS buenas de la segunda pulsación (la vez 1 cae y se salta)', [[...veces(19, bien), caida(20), caida(21)], [caida(1), nada(2), nada(3), bien(4)]],
    ['1 · LAS FALLIDAS: 3 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529 · pulsación 2, vez 1: HTTP 529', '2 · EL TERCER CUBO: 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 19 de 21 (se compara con los 9 de 21)', '4 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: 19 · la 2: 0 · las dos: 0 · sin decidir: 0']],
  ['P2 y P3: el cubo en 4 → se lee, y el cubo va antes del número', [[...veces(17, bien), ...veces(4, v => raro(17 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · EL TERCER CUBO: 4 de 21 — pulsación 1, vez 18: pregunta 1: veredicto sin decidir · pulsación 1, vez 19: pregunta 1: veredicto sin decidir · pulsación 1, vez 20: pregunta 1: veredicto sin decidir · pulsación 1, vez 21: pregunta 1: veredicto sin decidir', '3 · COLUMNA 1, ¿salió el quinto?: 17 de 21 (se compara con los 9 de 21)', '4 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: 17 · la 2: 0 · las dos: 0 · sin decidir: 0']],
  ['P2: el cubo en 5 → ILEGIBLE, y el número NO se enseña', [[...veces(16, bien), ...veces(5, v => raro(16 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · EL TERCER CUBO: 5 de 21 — pulsación 1, vez 17: pregunta 1: veredicto sin decidir · pulsación 1, vez 18: pregunta 1: veredicto sin decidir · pulsación 1, vez 19: pregunta 1: veredicto sin decidir · pulsación 1, vez 20: pregunta 1: veredicto sin decidir · pulsación 1, vez 21: pregunta 1: veredicto sin decidir', 'ILEGIBLE: el cubo pasa de 4 y la banda A (17 de 21) ya no se puede alcanzar. Se endurece la regla con lo que el cubo ha enseñado y se repite la tanda entera.']],
];

if (process.argv[2] === '--pruebas') {
  let mal = 0;
  for (const [nombre, r, esperado] of PRUEBAS) {
    const sale = contar(r);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  for (const [nombre, pulsaciones, esperado] of PRUEBAS_DEL_RESUMEN) {
    const sale = resumen(pulsaciones);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale, null, 1)}\n      debía ${JSON.stringify(esperado, null, 1)}`}`);
  }
  const total = PRUEBAS.length + PRUEBAS_DEL_RESUMEN.length;
  console.log(`${total - mal} de ${total}`);
  process.exit(mal ? 1 : 0);
} else if (process.argv[2]) {
  // una o varias pulsaciones, en orden: node contar_quinto.mjs pulsacion1.json [pulsacion2.json …]
  const pulsaciones = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas);
  console.log(resumen(pulsaciones).join('\n'));
}
```

**CON ESTO, LA TANDA QUEDA APROBADA** (arquitecto, 04/11). El director la pulsa y pega la salida entera A CODE PRIMERO.

### LA TANDA, LIBERADA: LA HUELLA, EL MOTIVO DE LA SUSTITUCIÓN Y EL ALTO (arquitecto, 04/11/2026)

- **LA HUELLA, APROBADA: `2db4208f2d928a8d`**, en lugar de `5125a34d0be5f842`. **El número sólo es válido si lo produce un script
  con esa huella; si la huella cambia, el número se vuelve a sacar.**
- **EL MOTIVO DE LA SUSTITUCIÓN, que es lo que la defiende** (arquitecto, literal): «La selección es por POSICIÓN y por ÉXITO,
  nunca por contenido: se toman las primeras respuestas buenas de la pulsación siguiente, por orden de vez, y la regla está
  fijada antes de verlas. Y una llamada fallida no puede depender de lo que el juez habría dicho, porque el juez no llegó a
  contestar: la pérdida es independiente del resultado. Por eso completar con la pulsación siguiente no sesga nada, aunque se
  descarten las demás respuestas de esa pulsación.»
- **FALLIDA Y CUBO NO SON LO MISMO**: FALLIDA es que la llamada no se completó; CUBO es que se completó y la regla no la sabe
  leer. Sólo la segunda podría correlacionar con el contenido (una respuesta larga tiene más sitio para salirse del formato), y
  para eso está el tope de 4.
- **LA REGLA SE EXTIENDE**: «y así sucesivamente, siempre las primeras buenas de la pulsación siguiente, por orden de vez». *El
  script ya lo hace (recorre todas las pulsaciones que se le den, en orden), así que la huella no cambia.*
- **EL ALTO** (arquitecto, literal): «Si una sola pulsación trae 3 o más llamadas fallidas de 21, se PARA y se diagnostica antes
  de seguir pulsando. No es ruido: SQL_34_10 midió 0 peticiones fallidas de 225 en las dos tandas nuevas, lo que deja la tasa
  de fallo en 0 – 1,68 % (Wilson 95 %). Incluso con la cota ALTA de ese intervalo, P(≥3 fallos de 21) = 0,50 %. Tres fallos en
  una pulsación es una avería de la ruta o de la API, no mala suerte, y se mira en vez de volver a pulsar.» *Code: cuentas
  comprobadas. Las 225 son peticiones de la tubería del producto (otras formas de llamada que la pregunta cerrada), así que la
  tasa es aproximada para esta ruta. El alto lo aplica Code leyendo la línea 1 del script, que lista las fallidas por
  pulsación, antes de pedir otra.*
- **Lo que hace creíble a `SQL_34_11`** (arquitecto): el «desde» del marcador 3, el 02/11 a las 17:54, cae en la primera pasada
  de la tanda de NOR-10 (17:54:03). La consulta encuentra el contador justo donde otra medición ya sabía que estaba: **es una
  corroboración desde fuera, no un control que la consulta se da a sí misma**. Y la purga **es una deducción, no una suposición
  confirmada**: dos códigos que entraron en fechas distintas (29/09 y 21/10) no pueden aparecer en el mismo instante salvo que
  la ventana empiece después de los dos.

**LA TANDA ESTÁ LIBERADA.** El director pulsa y pega la salida entera a Code primero. Code informa en el orden fijado: las
fallidas, el cubo con sus motivos, y el número sólo si el cubo cabe en 4.

### PASO 3 · LA PRIMERA TANDA, ILEGIBLE (Code, 04/11/2026)

Fallidas, 0. **Cubo, 15 de 21: ILEGIBLE**, por encima del tope de 4. Por los prerregistros 2 y 3, el número no se calcula ni se
enseña, se endurece la regla con lo que ha enseñado el cubo, y **se repite la tanda entera**. La salida, literal, en la medida.
**LO QUE HA ENSEÑADO EL CUBO (Code; sólo formato, sin contar el quinto)**: los defectos son de la REGLA, no de las respuestas.
- **9 de 15, por R1** («sin las dos secciones»): en las 9, cada cabecera sale **exactamente una vez a principio de línea**. Lo que
  sobra son menciones en la prosa («ya está contada en la pregunta 1»). R1 contaba la palabra en cualquier sitio, y tenía que
  contarla sólo como cabecera.
- **5 de 15, por R2, todas en la pregunta 2** («veredicto sin decidir»): en 4, la primera línea es un preámbulo sin veredicto
  («Ambos textos son reglas, así que aplica la pregunta de cumplimiento.», «Respondo a esta pregunta por separado…»). En la otra
  (vez 3), la polaridad va al revés: «Sí, hay hallazgo. … No se pueden cumplir a la vez», y ésa tiene que seguir yendo al cubo.
- **1 de 15** (vez 20), «hallazgo con una sola de las dos anclas», en la pregunta 2: correcto según la regla. En esa sección sólo
  cita entre comillas el lado de CLI-12.

### PASO 3 · LA REGLA ENDURECIDA (R1' Y R2'), ANTES DE REPETIR LA TANDA (arquitecto y Code, 04/11/2026)

**EL PRERREGISTRO HIZO EXACTAMENTE SU TRABAJO** (arquitecto): el arquitecto tenía las 21 respuestas leídas y no pudo
interpretarlas, y lo que lo impidió fue una frase escrita antes de saber el resultado. **Descubrir que la regla estaba mal costó
4 céntimos y 142 segundos.** Y lo más revelador: el prompt pregunta literalmente «¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?», y la
regla no reconocía «se pueden cumplir» como forma de veredicto. Esperábamos un monosílabo a una pregunta que invita a
contestar con sus propias palabras.

**R1' Y R2', APROBADAS, con el criterio que dice por qué esto NO es afinar la regla contra las respuestas** (arquitecto,
literal): «El endurecimiento reconoce FORMAS DE RESPUESTA que el propio prompt invita, y no cambia QUÉ CUENTA COMO HALLAZGO. Un
cambio que tocara qué cuenta sería afinar; éstos no lo tocan. Y el seguro de polaridad de la vez 3 va en la dirección
conservadora: sigue al cubo.»
- **R1'**: la cabecera es una LÍNEA que empieza por «PREGUNTA 1» o «PREGUNTA 2»; las menciones en la prosa no cuentan.
- **R2'**: el veredicto es la primera línea, antes de la primera cita o viñeta, que EMPIEZA por una forma de veredicto
  («sí»/«no»; en la pregunta 2, también «no se pueden cumplir…» y «se pueden cumplir…»), saltando los preámbulos, lo que va
  antes del último «?» y las etiquetas («Respuesta:», «HAY HALLAZGO:»). Va al cubo si su primera frase trae «sí» y «no» a la
  vez, o si en la pregunta 2 dice «sí» y «hallazgo» (el seguro de polaridad).
- **Una corrección de Code al escribirla, que la cazaron las pruebas de formato**: previó que la 7 y la 15 decidirían la
  pregunta 2, y la primera versión de R2' las mandaba al cubo, porque miraba la línea entera y la frase de DETRÁS traía un
  «no» («Sí. No hay ninguna frase…»). Se corrigió para mirar la PRIMERA FRASE: el veredicto es esa frase, y lo de detrás ya es
  razonamiento. Es reconocer una forma, no cambiar qué cuenta.

**LAS TRES CONDICIONES DEL ARQUITECTO**:
1. **PARSEAR SÍ, CONTAR NO.** Los 21 formatos de la primera tanda entran en las pruebas, respuesta por respuesta, pero sólo para
   ver SI la regla encuentra las dos secciones y SI decide cada pregunta; nunca CUÁL, ni las anclas, ni el quinto. **No se
   agrega ningún recuento sobre esa tanda, ni para Code**: un «X de 21» con la regla nueva sobre las respuestas viejas anclaría
   a los dos antes de la tanda nueva. *Code*: así está escrito; el script no imprime ni compara veredictos de la tanda vieja.
2. **LAS BANDAS Y EL TOPE DEL CUBO NO SE TOCAN**: A ≥17, B 13-16, C 10-12, D ≤9, sobre n = 21; el cubo, en 4, porque la banda A
   pide 17. Repetir una medición es el momento en que alguien ajustaría los umbrales, y **consta que no se han ajustado**.
3. **UN ALTO, PRERREGISTRADO**: si la segunda tanda también sale ILEGIBLE, **no hay un tercer endurecimiento**. Se para y la
   decisión vuelve al arquitecto, con dos opciones: (i) pedir al juez una salida estructurada, que CAMBIA EL PROMPT, y entonces
   el número deja de ser comparable con los 9 de 21 de la pasada abierta, que es todo el objetivo; (ii) aceptar que esta
   medición no se puede hacer mecánicamente con este prompt, y escribirlo. **Dos fallos de parseo seguidos significarían que el
   texto libre de este prompt no es contable, y eso es información, no un obstáculo a salvar a golpe de regla.**

**EL SCRIPT, ENTERO, CONGELADO POR SU HUELLA `a059848eccfef66b`** (sustituye a `2db4208f2d928a8d`). 44 de 44 pruebas: las 19 de la
regla, las 4 de los prerregistros y las 21 de formato de la primera tanda. Lee la tanda vieja de `tanda_quinto_1.json`, que es
la salida archivada, literal, en la medida.

```js
// LA REGLA DE CUENTA DEL PASO 3 DE F-130, EN CÓDIGO (Code, 04/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Implementa el criterio del arquitecto (03/11, 21:20) y la regla de reconocimiento que él aprueba antes de pulsar.
// Uso: node contar_quinto.mjs <salida-de-la-tanda.json>   ·   node contar_quinto.mjs --pruebas
import { readFileSync } from 'node:fs';

export const ANCLA_NOR11 = 'revisa trimestralmente el cumplimiento';
export const ANCLAS_CLI12 = ['personal ajeno al área auditada', 'no como auditor de su propia área'];

const plano = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
const sinMarcas = s => s.replace(/[*_#>`]/g, '');

// R1' · LAS DOS SECCIONES (endurecida el 04/11 tras la primera tanda, ILEGIBLE). Una cabecera es una LÍNEA que, quitadas las
// marcas y los espacios, EMPIEZA por «PREGUNTA 1» o «PREGUNTA 2» (mayúsculas o no, con o sin espacio). Las menciones en la
// prosa («ya está contada en la pregunta 1») no cuentan. Tiene que haber una de cada, en orden; si no, se prueba la forma
// numerada a principio de línea («1.» o «1)» y «2.» o «2)»). Si tampoco: al tercer cubo, «sin las dos secciones».
export function secciones(texto) {
  const t = sinMarcas(texto);
  const probar = (re1, re2) => {
    const a = [...t.matchAll(re1)], b = [...t.matchAll(re2)];
    if (a.length !== 1 || b.length !== 1 || a[0].index >= b[0].index) return null;
    return { p1: t.slice(a[0].index + a[0][0].length, b[0].index), p2: t.slice(b[0].index + b[0][0].length) };
  };
  return probar(/^[ \t]*pregunta\s*1\b/gim, /^[ \t]*pregunta\s*2\b/gim) ?? probar(/^[ \t]*1[.)]/gm, /^[ \t]*2[.)]/gm);
}

// R2' · EL VEREDICTO de cada sección (endurecida el 04/11). Se recorren sus líneas EN ORDEN hasta la primera que traiga una
// cita (« “ ") o sea una viñeta («- », «• »), y gana la PRIMERA que EMPIECE por una forma de veredicto. En cada línea:
//   · lo que queda de la línea de la cabecera («· EL DATO:») se quita; si la línea trae una pregunta, cuenta lo que va
//     DESPUÉS del último «?» («¿Se pueden cumplir las dos a la vez? No.» → «No.»); y se quitan las etiquetas del principio
//     («Respuesta:», «HAY HALLAZGO:», «Hallazgo:»);
//   · las formas: la primera palabra «sí» o «no» («si» SIN TILDE sólo si va sola o con puntuación: «Si.», «Si,»; suelto es
//     el condicional); y, SÓLO EN LA PREGUNTA 2, la línea que empieza por «no se pueden cumplir» («no») o por «se pueden
//     cumplir» («sí»), que es como el propio prompt invita a contestar;
//   · las líneas sin forma de veredicto (los preámbulos: «Ambos textos son reglas, así que aplica la pregunta…») se saltan.
// La línea elegida va al cubo, en vez de dar veredicto, si su PRIMERA FRASE trae a la vez las palabras «sí» y «no» (salvo
// dentro de la forma «no se pueden cumplir»), o si, EN LA PREGUNTA 2, su veredicto es «sí» y esa primera frase dice
// «hallazgo» («Sí, hay hallazgo»: la polaridad al revés; el seguro va en la dirección conservadora). Sin ninguna línea así antes de la primera cita o viñeta: «veredicto sin
// decidir». NO CAMBIA QUÉ CUENTA COMO HALLAZGO (la 1 en «sí», la 2 en «no»): sólo reconoce las formas de decirlo.
const SI = /(^|[^\p{L}])sí([^\p{L}]|$)/iu, NO = /(^|[^\p{L}])no([^\p{L}]|$)/iu;
export function veredicto(seccion, pregunta = 1) {
  const lineas = seccion.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const cruda = lineas[i];
    if (/^\s*([-•]\s)/.test(cruda)) return null;
    let l = (i === 0 ? cruda.replace(/^[\s·:.\-–—]*(el dato|el cumplimiento)?[\s·:.\-–—]*/i, '') : cruda).trim();
    if (l.includes('?')) l = l.slice(l.lastIndexOf('?') + 1).trim();
    l = l.replace(/^((respuesta|hay hallazgo|hallazgo)\s*:\s*)+/i, '').trim();
    if (l === '') { if (/[«“"]/.test(cruda)) return null; continue; }
    let v = null, frase = false;
    if (pregunta === 2 && /^no se pueden cumplir/i.test(l)) { v = 'no'; frase = true; }
    else if (pregunta === 2 && /^(s[ií][,\s]+)?se pueden cumplir/i.test(l)) { v = 'sí'; frase = true; }
    else if (/^sí([^\p{L}]|$)/iu.test(l) || /^si([.,;:!]|$)/i.test(l)) v = 'sí';
    else if (/^no([^\p{L}]|$)/iu.test(l)) v = 'no';
    if (v === null) { if (/[«“"]/.test(cruda)) return null; continue; }
    // las dos comprobaciones, sobre la PRIMERA FRASE de la línea (hasta el primer «.», «:» o «;» seguido de espacio): el
    // veredicto es esa frase, y lo que venga detrás en la misma línea («Sí. No hay ninguna frase…») ya es razonamiento
    const primera = l.split(/(?<=[.:;])\s/)[0];
    const resto = frase && v === 'no' ? primera.replace(/^no se pueden cumplir/i, '') : primera;
    if (SI.test(resto) && NO.test(resto)) return null;
    if (pregunta === 2 && v === 'sí' && /hallazgo/i.test(primera)) return null;
    return v;
  }
  return null;
}

// R3 · LAS CITAS: los tramos entre «…», “…” o "…" de la sección. Se contrastan con las anclas en minúsculas y con los espacios
// colapsados; una cita casa con un ancla si la contiene entera.
export function citas(seccion) {
  return [...seccion.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => plano(m[1] ?? m[2] ?? m[3] ?? ''));
}
function anclasDe(seccion) {
  const c = citas(seccion), p = plano(seccion);
  const nor = c.some(x => x.includes(ANCLA_NOR11)), cli = c.some(x => ANCLAS_CLI12.some(a => x.includes(a)));
  const fueraNor = !nor && p.includes(ANCLA_NOR11), fueraCli = !cli && ANCLAS_CLI12.some(a => p.includes(a));
  return { nor, cli, fueraNor, fueraCli };
}

// R4 · LA CUENTA. «Hallazgo afirmado» = la 1 en «sí», o la 2 en «no». Una pregunta con hallazgo afirmado da EL QUINTO si su
// sección trae, ENTRE COMILLAS, una cita con el ancla de NOR-11 y otra con una de las dos de CLI-12. Lo que no case va al
// TERCER CUBO con su motivo, y nunca se decide a ojo:
//   · sin respuesta (error de la API o texto vacío); · sin las dos secciones; · veredicto sin decidir en una pregunta;
//   · hallazgo afirmado con una sola de las dos anclas; · hallazgo afirmado con un ancla fuera de comillas;
//   · hallazgo afirmado sin ninguna de las anclas (otro hallazgo, o citas de otro apartado).
// Columna 1: sí, si alguna pregunta da el quinto limpio (aunque la otra caiga al cubo: entonces la columna 2 queda «sin
// decidir»). Columna 2: la 1, la 2 o las dos. Sin hallazgo afirmado en ninguna de las dos (y las dos decididas): «no salió»,
// aunque las anclas aparezcan colgando de un «no hay hallazgo».
export function contar(respuesta) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { quinto: null, cubo: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { quinto: null, cubo: ['sin las dos secciones'] };
  const v1 = veredicto(s.p1, 1), v2 = veredicto(s.p2, 2);
  const cubo = [], por = [];
  for (const [n, v, sec, afirma] of [[1, v1, s.p1, 'sí'], [2, v2, s.p2, 'no']]) {
    if (v === null) { cubo.push(`pregunta ${n}: veredicto sin decidir`); continue; }
    if (v !== afirma) continue;
    const a = anclasDe(sec);
    if (a.nor && a.cli) { por.push(n); continue; }
    if (a.fueraNor || a.fueraCli) cubo.push(`pregunta ${n}: hallazgo con un ancla fuera de comillas`);
    else if (a.nor || a.cli) cubo.push(`pregunta ${n}: hallazgo con una sola de las dos anclas`);
    else cubo.push(`pregunta ${n}: hallazgo sin las anclas del quinto`);
  }
  if (por.length > 0) return { quinto: true, porPregunta: cubo.length ? 'sin decidir' : (por.length === 2 ? 'las dos' : `la ${por[0]}`), cubo };
  if (cubo.length > 0) return { quinto: null, cubo };
  return { quinto: false, cubo: [] };
}

// LOS TRES PRERREGISTROS DEL ARQUITECTO (04/11), antes de la tanda:
// P1 · UNA LLAMADA FALLIDA NO ES UN «NO»: no es un veredicto y no va al cubo. La tanda es puntuable SÓLO con 21 respuestas
//      buenas; las que falten se completan con las primeras buenas de la pulsación SIGUIENTE, por orden de vez. Se escribe
//      cuántas fallaron y cuáles las sustituyeron.
// P2 · EL CUBO TIENE UN TAMAÑO MÁXIMO, 4: la banda A pide 17 de 21. Por encima, las bandas son ILEGIBLES y se repite la tanda.
// P3 · EL CUBO SE ENSEÑA ANTES DEL NÚMERO: primero las fallidas, luego el cubo con el motivo de cada una, y el número sólo si
//      el cubo cabe en 4.
export const N_TANDA = 21;
export const CUBO_MAXIMO = 4;
const fallida = r => !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';

export function resumen(pulsaciones) {
  const buenas = [], fallidas = [];
  pulsaciones.forEach((respuestas, p) => respuestas.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    if (fallida(r)) { if (buenas.length < N_TANDA) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`); }
    else if (buenas.length < N_TANDA) buenas.push({ id, ...contar(r) });
  }));
  const salida = [`1 · LAS FALLIDAS: ${fallidas.length}${fallidas.length ? ' — ' + fallidas.join(' · ') : ''}`];
  if (buenas.length < N_TANDA) {
    salida.push(`NO PUNTUABLE TODAVÍA: ${buenas.length} respuestas buenas de ${N_TANDA}. Se pulsa otra vez y las que faltan salen de la siguiente.`);
    return salida;
  }
  const cubo = buenas.filter(f => f.cubo.length > 0);
  salida.push(`2 · EL TERCER CUBO: ${cubo.length} de ${N_TANDA}${cubo.length ? ' — ' + cubo.map(f => `${f.id}: ${f.cubo.join('; ')}`).join(' · ') : ''}`);
  if (cubo.length > CUBO_MAXIMO) {
    salida.push(`ILEGIBLE: el cubo pasa de ${CUBO_MAXIMO} y la banda A (17 de 21) ya no se puede alcanzar. Se endurece la regla con lo que el cubo ha enseñado y se repite la tanda entera.`);
    return salida;
  }
  const limpias = buenas.filter(f => f.quinto === true);
  salida.push(`3 · COLUMNA 1, ¿salió el quinto?: ${limpias.length} de ${N_TANDA} (se compara con los 9 de 21)`);
  salida.push(`4 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): ` +
    ['la 1', 'la 2', 'las dos', 'sin decidir'].map(k => `${k}: ${limpias.filter(f => f.porPregunta === k).length}`).join(' · '));
  return salida;
}

// LAS PRUEBAS, sobre respuestas INVENTADAS antes de la tanda: los casos que la regla tiene que decidir, y las trampas
const R = (vez, respuesta) => ({ vez, respuesta });
const N = '«El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos»';
const C1 = '«Las auditorías internas las realiza siempre personal ajeno al área auditada»';
const C2 = '«participa en la auditoría como interlocutor, pero no como auditor de su propia área»';
const PRUEBAS = [
  ['el quinto por la 1', R(1, `PREGUNTA 1 · EL DATO\nSí.\nTexto 1: ${N}\nTexto 2: ${C1}\n\nPREGUNTA 2 · EL CUMPLIMIENTO\nSí, se pueden cumplir.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['el quinto por la 1, con la otra frase de CLI-12 y la cabecera en negrita', R(2, `**Pregunta 1:** Sí\n${N} / ${C2}\n**Pregunta 2:** Sí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['el quinto por la 2 (hace fallar P-P3-2)', R(3, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo. ${N} ${C1} norma_contra_norma`), { quinto: true, porPregunta: 'la 2', cubo: [] }],
  ['el quinto por las dos', R(4, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nNo. ${N} ${C2} norma_contra_norma`), { quinto: true, porPregunta: 'las dos', cubo: [] }],
  ['no salió: sin hallazgo en ninguna', R(5, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), { quinto: false, cubo: [] }],
  ['TRAMPA: las anclas colgando de un «no»', R(6, `PREGUNTA 1\nNo, ${N} y ${C1} no hablan del mismo dato.\nPREGUNTA 2\nSí.`), { quinto: false, cubo: [] }],
  ['TRAMPA: el «no» de «no como auditor» dentro de una cita, en la segunda línea', R(7, `PREGUNTA 1\nSí.\n${N}\n${C2}\nPREGUNTA 2\nSí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['al cubo: «sí» y «no» en la misma primera línea', R(8, 'PREGUNTA 1\nNo es exactamente el mismo dato, pero sí hay diferencia.\nPREGUNTA 2\nSí.'), { quinto: null, cubo: ['pregunta 1: veredicto sin decidir'] }],
  ['al cubo: una sola de las dos anclas', R(9, `PREGUNTA 1\nSí. ${N} «El sistema de calidad se apoya en un calendario anual»\nPREGUNTA 2\nSí.`), { quinto: null, cubo: ['pregunta 1: hallazgo con una sola de las dos anclas'] }],
  ['al cubo: un ancla fuera de comillas', R(10, `PREGUNTA 1\nSí.\nNOR-11 dice que el Coordinador revisa trimestralmente el cumplimiento; CLI-12: ${C1}\nPREGUNTA 2\nSí.`), { quinto: null, cubo: ['pregunta 1: hallazgo con un ancla fuera de comillas'] }],
  ['al cubo: otro hallazgo, sin las anclas', R(11, 'PREGUNTA 1\nSí. «Se distinguen auditorías de proceso» «contenedor de los grupos III o IV»\nPREGUNTA 2\nSí.'), { quinto: null, cubo: ['pregunta 1: hallazgo sin las anclas del quinto'] }],
  ['al cubo: sin las dos secciones', R(12, `Sí, hay contradicción: ${N} ${C1}`), { quinto: null, cubo: ['sin las dos secciones'] }],
  ['al cubo: sin respuesta (error de la API)', { vez: 13, error: 'HTTP 529' }, { quinto: null, cubo: ['sin respuesta'] }],
  ['el quinto por la 1, la 2 sin decidir', R(14, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`), { quinto: true, porPregunta: 'sin decidir', cubo: ['pregunta 2: veredicto sin decidir'] }],
  ['la forma numerada, si no hay cabeceras', R(15, `1. Sí. ${N} ${C1}\n2. Sí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['«si» sin tilde cuenta como «sí»', R(16, `PREGUNTA 1\nSi.\n${N} ${C1}\nPREGUNTA 2\nSi.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
  ['«No obstante» no es un «no» suelto... sí lo es: la palabra «no» entera', R(17, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), { quinto: null, cubo: ['pregunta 1: veredicto sin decidir'] }],
  ['TRAMPA: «Si» condicional no es un «sí»', R(18, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSi se hace lo que una permite, la otra se cumple igual.'), { quinto: null, cubo: ['pregunta 2: veredicto sin decidir'] }],
  ['TRAMPA: el modelo repite la pregunta antes de contestar', R(19, `PREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nSí.\n${N} ${C1}\nPREGUNTA 2 · EL CUMPLIMIENTO\n¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?\nSí.`), { quinto: true, porPregunta: 'la 1', cubo: [] }],
];

// LAS PRUEBAS DEL RESUMEN: los tres prerregistros
const bien = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nSí.`);
const nada = v => R(v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.');
const raro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.');
const caida = v => ({ vez: v, error: 'HTTP 529' });
const veces = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const PRUEBAS_DEL_RESUMEN = [
  ['P1: dos fallidas y sin segunda pulsación → no puntuable', [[...veces(19, bien), caida(20), caida(21)]],
    ['1 · LAS FALLIDAS: 2 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529', 'NO PUNTUABLE TODAVÍA: 19 respuestas buenas de 21. Se pulsa otra vez y las que faltan salen de la siguiente.']],
  ['P1: las dos que faltan, de las PRIMERAS buenas de la segunda pulsación (la vez 1 cae y se salta)', [[...veces(19, bien), caida(20), caida(21)], [caida(1), nada(2), nada(3), bien(4)]],
    ['1 · LAS FALLIDAS: 3 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529 · pulsación 2, vez 1: HTTP 529', '2 · EL TERCER CUBO: 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 19 de 21 (se compara con los 9 de 21)', '4 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: 19 · la 2: 0 · las dos: 0 · sin decidir: 0']],
  ['P2 y P3: el cubo en 4 → se lee, y el cubo va antes del número', [[...veces(17, bien), ...veces(4, v => raro(17 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · EL TERCER CUBO: 4 de 21 — pulsación 1, vez 18: pregunta 1: veredicto sin decidir · pulsación 1, vez 19: pregunta 1: veredicto sin decidir · pulsación 1, vez 20: pregunta 1: veredicto sin decidir · pulsación 1, vez 21: pregunta 1: veredicto sin decidir', '3 · COLUMNA 1, ¿salió el quinto?: 17 de 21 (se compara con los 9 de 21)', '4 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: 17 · la 2: 0 · las dos: 0 · sin decidir: 0']],
  ['P2: el cubo en 5 → ILEGIBLE, y el número NO se enseña', [[...veces(16, bien), ...veces(5, v => raro(16 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · EL TERCER CUBO: 5 de 21 — pulsación 1, vez 17: pregunta 1: veredicto sin decidir · pulsación 1, vez 18: pregunta 1: veredicto sin decidir · pulsación 1, vez 19: pregunta 1: veredicto sin decidir · pulsación 1, vez 20: pregunta 1: veredicto sin decidir · pulsación 1, vez 21: pregunta 1: veredicto sin decidir', 'ILEGIBLE: el cubo pasa de 4 y la banda A (17 de 21) ya no se puede alcanzar. Se endurece la regla con lo que el cubo ha enseñado y se repite la tanda entera.']],
];

if (process.argv[2] === '--pruebas') {
  let mal = 0;
  for (const [nombre, r, esperado] of PRUEBAS) {
    const sale = contar(r);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  for (const [nombre, pulsaciones, esperado] of PRUEBAS_DEL_RESUMEN) {
    const sale = resumen(pulsaciones);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale, null, 1)}\n      debía ${JSON.stringify(esperado, null, 1)}`}`);
  }
  // LAS PRUEBAS DE FORMATO sobre las 21 respuestas de la PRIMERA TANDA (ILEGIBLE, 04/11), condición 1 del arquitecto:
  // PARSEAR SÍ, CONTAR NO. Sólo se comprueba SI la regla encuentra las dos secciones y SI decide un veredicto en cada
  // pregunta, nunca CUÁL, ni las anclas, ni el quinto; y no se imprime nada de eso. Lo esperado, escrito por formato antes de
  // pasar la regla: las 21 con sus dos secciones y la pregunta 1 decidida; la 2 sin decidir sólo en la 3 y la 9 («Sí, hay
  // hallazgo»: la polaridad al revés, al cubo a propósito), la 11 («sin hallazgo independiente») y la 13 (el veredicto, al
  // final y detrás de las viñetas).
  const vieja = JSON.parse(readFileSync(new URL('./tanda_quinto_1.json', import.meta.url), 'utf8')).respuestas;
  const sinDecidirLa2 = [3, 9, 11, 13];
  let malFormato = 0;
  for (const r of vieja) {
    const s = secciones(r.respuesta);
    const esperado = { secciones: true, decideLa1: true, decideLa2: !sinDecidirLa2.includes(r.vez) };
    const sale = { secciones: !!s, decideLa1: !!s && veredicto(s.p1, 1) !== null, decideLa2: !!s && veredicto(s.p2, 2) !== null };
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) { mal++; malFormato++; }
    if (!ok) console.log(`MAL · formato de la vez ${r.vez}: sale ${JSON.stringify(sale)}, se esperaba ${JSON.stringify(esperado)}`);
  }
  console.log(`formato de la primera tanda: ${vieja.length - malFormato} de ${vieja.length} como se esperaba`);
  const total = PRUEBAS.length + PRUEBAS_DEL_RESUMEN.length + vieja.length;
  console.log(`${total - mal} de ${total}`);
  process.exit(mal ? 1 : 0);
} else if (process.argv[2]) {
  // una o varias pulsaciones, en orden: node contar_quinto.mjs pulsacion1.json [pulsacion2.json …]
  const pulsaciones = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas);
  console.log(resumen(pulsaciones).join('\n'));
}
```

### PASO 3 · EL TOPE DE 4, CORREGIDO: CUENTA SÓLO LA COLUMNA 1 ILEGIBLE (arquitecto, 04/11/2026; archivado por Code a las 10:10)

**LA DERIVACIÓN, que se puede comprobar sin mirar ninguna respuesta** (arquitecto): el tope de 4 se derivó así, con sus palabras
del 03/11: «la banda A pide 17 de 21, así que si más de 4 van al cubo quedan 16 limpias como máximo». **El tope existe para
proteger LA COLUMNA 1.** Y el criterio define la columna 1 con un O: cuenta como el quinto si la pregunta 1 dice «sí» O la
pregunta 2 dice que no se pueden cumplir. En un O, una rama en «sí» hace innecesaria la otra. Así que el tope tiene que contar
las respuestas cuya COLUMNA 1 es ilegible, no cualquier cosa que vaya al cubo. **Code implementó la letra de lo aprobado; la
letra y la derivación no coincidían. EL DEFECTO ES DEL ARQUITECTO Y ESTÁ EN SU PROPIO TEXTO.**
**Lo que le decide**: su alto suponía que una segunda ILEGIBLE significaría «el texto libre no es contable», y el aviso de Code
mostró que, más probablemente, significaría «el tope cuenta lo que no debe». Son dos diagnósticos distintos, y el alto sólo
tenía remedios para el primero: pulsar sin corregir habría gastado el alto en la enfermedad equivocada.
⚠️ **EL CARGO, AQUÍ Y NO EN OTRO SITIO** (arquitecto): el arquitecto deriva esto DESPUÉS de ver que le iba a doler, escribió él
mismo la inconsistencia, y es quien se beneficia del arreglo.

**LA REGLA DEL TOPE, CORREGIDA** (arquitecto, literal; no cambia el veredicto de ninguna respuesta, cambia quién puede bloquear
la lectura): «La COLUMNA 1 es LEGIBLE cuando se da una de estas tres: (a) la pregunta 1 decide «sí» y trae las dos anclas → el
quinto salió; (b) la pregunta 2 decide «no se pueden cumplir» y trae las dos anclas → el quinto salió; (c) la pregunta 1 decide
«no» Y la pregunta 2 decide «sí se pueden cumplir» → el quinto no salió. Es ILEGIBLE en cualquier otro caso. SÓLO las ilegibles
cuentan para el tope de 4.»
**Y LA COLUMNA 2, SU PROPIO TOPE** (arquitecto, literal): «Las respuestas cuya pregunta 2 no se puede decidir van a una lista
nombrada, con su vez y su motivo. Si pasan de 4 de 21, P-P3-2 se informa como NO PUNTUABLE con su cuenta, en vez de puntuarse
sobre un denominador parcial. No afecta a la columna 1 ni a las bandas.» La vez 3 y la vez 9, con la polaridad al revés, siguen
yendo ahí a propósito.
**LO QUE NO SE TOCA**: las bandas (A ≥17, B 13-16, C 10-12, D ≤9, n = 21), el criterio de qué cuenta como hallazgo, y el alto,
que desde ahora significa lo que decía: **si la segunda tanda sale ILEGIBLE POR LA COLUMNA 1, no hay tercer endurecimiento.**

**LA PREGUNTA DEL ARQUITECTO, POR RESPUESTA Y SIN SUMAR** (Code, con la regla nueva y sólo sobre esas respuestas): la vez 11 y la
vez 13 tienen la pregunta 2 sin decidir, y su columna 1 cae en (a): con el tope corregido, **NO cuentan para el tope**. La vez 3 y
la vez 9 (la 2 sin decidir a propósito) tienen la columna 1 ILEGIBLE: su pregunta 1 no da el quinto y su pregunta 2 no se puede
leer, así que no se sabe si salió por la 2. **Ésas SÍ siguen contando para el tope.** No se ha calculado ninguna otra respuesta
ni ningún total.

**Y LO QUE EL ARQUITECTO PIDE QUE CONSTE DE CODE**: antes de pasar la regla nueva, Code escribió qué esperaba de cada una de las
21 respuestas por su formato, y después anotó dónde se equivocó (la 7 y la 15). Es prerregistrar las expectativas propias sobre
la regla propia, la misma disciplina que se le aplica al arquitecto. Y darle el «4 de 21 de formato», que no es un recuento del
quinto y cambiaba lo que costaba pulsar, cumplía la condición 1 a la vez que le decía lo que necesitaba saber.

**EL SCRIPT, ENTERO, CONGELADO POR SU HUELLA `cea980ddc9356e68`** (sustituye a `a059848eccfef66b`). 47 de 47 pruebas: 20 de la regla, 6
del resumen con los dos topes y 21 de formato sobre la primera tanda. Orden de la salida: las fallidas; la columna 1 ilegible
con su motivo (el tope de 4); el número sólo si cabe; la lista de la pregunta 2 sin decidir (su tope de 4); y la columna 2, o
«P-P3-2: NO PUNTUABLE».

```js
// LA REGLA DE CUENTA DEL PASO 3 DE F-130, EN CÓDIGO (Code, 04/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Implementa el criterio del arquitecto (03/11, 21:20) y la regla de reconocimiento que él aprueba antes de pulsar.
// Uso: node contar_quinto.mjs <salida-de-la-tanda.json>   ·   node contar_quinto.mjs --pruebas
import { readFileSync } from 'node:fs';

export const ANCLA_NOR11 = 'revisa trimestralmente el cumplimiento';
export const ANCLAS_CLI12 = ['personal ajeno al área auditada', 'no como auditor de su propia área'];

const plano = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
const sinMarcas = s => s.replace(/[*_#>`]/g, '');

// R1' · LAS DOS SECCIONES (endurecida el 04/11 tras la primera tanda, ILEGIBLE). Una cabecera es una LÍNEA que, quitadas las
// marcas y los espacios, EMPIEZA por «PREGUNTA 1» o «PREGUNTA 2» (mayúsculas o no, con o sin espacio). Las menciones en la
// prosa («ya está contada en la pregunta 1») no cuentan. Tiene que haber una de cada, en orden; si no, se prueba la forma
// numerada a principio de línea («1.» o «1)» y «2.» o «2)»). Si tampoco: al tercer cubo, «sin las dos secciones».
export function secciones(texto) {
  const t = sinMarcas(texto);
  const probar = (re1, re2) => {
    const a = [...t.matchAll(re1)], b = [...t.matchAll(re2)];
    if (a.length !== 1 || b.length !== 1 || a[0].index >= b[0].index) return null;
    return { p1: t.slice(a[0].index + a[0][0].length, b[0].index), p2: t.slice(b[0].index + b[0][0].length) };
  };
  return probar(/^[ \t]*pregunta\s*1\b/gim, /^[ \t]*pregunta\s*2\b/gim) ?? probar(/^[ \t]*1[.)]/gm, /^[ \t]*2[.)]/gm);
}

// R2' · EL VEREDICTO de cada sección (endurecida el 04/11). Se recorren sus líneas EN ORDEN hasta la primera que traiga una
// cita (« “ ") o sea una viñeta («- », «• »), y gana la PRIMERA que EMPIECE por una forma de veredicto. En cada línea:
//   · lo que queda de la línea de la cabecera («· EL DATO:») se quita; si la línea trae una pregunta, cuenta lo que va
//     DESPUÉS del último «?» («¿Se pueden cumplir las dos a la vez? No.» → «No.»); y se quitan las etiquetas del principio
//     («Respuesta:», «HAY HALLAZGO:», «Hallazgo:»);
//   · las formas: la primera palabra «sí» o «no» («si» SIN TILDE sólo si va sola o con puntuación: «Si.», «Si,»; suelto es
//     el condicional); y, SÓLO EN LA PREGUNTA 2, la línea que empieza por «no se pueden cumplir» («no») o por «se pueden
//     cumplir» («sí»), que es como el propio prompt invita a contestar;
//   · las líneas sin forma de veredicto (los preámbulos: «Ambos textos son reglas, así que aplica la pregunta…») se saltan.
// La línea elegida va al cubo, en vez de dar veredicto, si su PRIMERA FRASE trae a la vez las palabras «sí» y «no» (salvo
// dentro de la forma «no se pueden cumplir»), o si, EN LA PREGUNTA 2, su veredicto es «sí» y esa primera frase dice
// «hallazgo» («Sí, hay hallazgo»: la polaridad al revés; el seguro va en la dirección conservadora). Sin ninguna línea así antes de la primera cita o viñeta: «veredicto sin
// decidir». NO CAMBIA QUÉ CUENTA COMO HALLAZGO (la 1 en «sí», la 2 en «no»): sólo reconoce las formas de decirlo.
const SI = /(^|[^\p{L}])sí([^\p{L}]|$)/iu, NO = /(^|[^\p{L}])no([^\p{L}]|$)/iu;
export function veredicto(seccion, pregunta = 1) {
  const lineas = seccion.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const cruda = lineas[i];
    if (/^\s*([-•]\s)/.test(cruda)) return null;
    let l = (i === 0 ? cruda.replace(/^[\s·:.\-–—]*(el dato|el cumplimiento)?[\s·:.\-–—]*/i, '') : cruda).trim();
    if (l.includes('?')) l = l.slice(l.lastIndexOf('?') + 1).trim();
    l = l.replace(/^((respuesta|hay hallazgo|hallazgo)\s*:\s*)+/i, '').trim();
    if (l === '') { if (/[«“"]/.test(cruda)) return null; continue; }
    let v = null, frase = false;
    if (pregunta === 2 && /^no se pueden cumplir/i.test(l)) { v = 'no'; frase = true; }
    else if (pregunta === 2 && /^(s[ií][,\s]+)?se pueden cumplir/i.test(l)) { v = 'sí'; frase = true; }
    else if (/^sí([^\p{L}]|$)/iu.test(l) || /^si([.,;:!]|$)/i.test(l)) v = 'sí';
    else if (/^no([^\p{L}]|$)/iu.test(l)) v = 'no';
    if (v === null) { if (/[«“"]/.test(cruda)) return null; continue; }
    // las dos comprobaciones, sobre la PRIMERA FRASE de la línea (hasta el primer «.», «:» o «;» seguido de espacio): el
    // veredicto es esa frase, y lo que venga detrás en la misma línea («Sí. No hay ninguna frase…») ya es razonamiento
    const primera = l.split(/(?<=[.:;])\s/)[0];
    const resto = frase && v === 'no' ? primera.replace(/^no se pueden cumplir/i, '') : primera;
    if (SI.test(resto) && NO.test(resto)) return null;
    if (pregunta === 2 && v === 'sí' && /hallazgo/i.test(primera)) return null;
    return v;
  }
  return null;
}

// R3 · LAS CITAS: los tramos entre «…», “…” o "…" de la sección. Se contrastan con las anclas en minúsculas y con los espacios
// colapsados; una cita casa con un ancla si la contiene entera.
export function citas(seccion) {
  return [...seccion.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => plano(m[1] ?? m[2] ?? m[3] ?? ''));
}
function anclasDe(seccion) {
  const c = citas(seccion), p = plano(seccion);
  const nor = c.some(x => x.includes(ANCLA_NOR11)), cli = c.some(x => ANCLAS_CLI12.some(a => x.includes(a)));
  const fueraNor = !nor && p.includes(ANCLA_NOR11), fueraCli = !cli && ANCLAS_CLI12.some(a => p.includes(a));
  return { nor, cli, fueraNor, fueraCli };
}

// R4 · LA CUENTA (columna 1 y columna 2, con el tope corregido por el arquitecto el 04/11). «Hallazgo afirmado» = la 1 en
// «sí», o la 2 en «no»; da EL QUINTO si su sección trae, ENTRE COMILLAS, una cita con el ancla de NOR-11 y otra con una de las
// dos de CLI-12. LA COLUMNA 1 ES LEGIBLE cuando se da una de estas tres:
//   (a) la pregunta 1 decide «sí» y trae las dos anclas → el quinto salió;
//   (b) la pregunta 2 decide «no se pueden cumplir» y trae las dos anclas → el quinto salió;
//   (c) la pregunta 1 decide «no» Y la pregunta 2 decide «sí se pueden cumplir» → el quinto no salió.
// Es ILEGIBLE en cualquier otro caso, y SÓLO las ilegibles van a `cubo1`, que es lo que cuenta para el tope de 4. Su motivo, por
// pregunta: veredicto sin decidir; hallazgo con una sola de las dos anclas; con un ancla fuera de comillas; o sin las anclas
// del quinto. Las anclas colgando de un «no hay hallazgo» no cuentan: eso es (c).
// LA COLUMNA 2, ¿por qué pregunta salió el quinto?: la 1, la 2, las dos, o «sin decidir» si la otra pregunta no se puede leer.
// Y `cubo2` es la lista de las respuestas con la PREGUNTA 2 SIN DECIDIR, con su propio tope (resumen, abajo).
export function contar(respuesta) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { quinto: null, cubo1: ['sin respuesta'], cubo2: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { quinto: null, cubo1: ['sin las dos secciones'], cubo2: ['sin las dos secciones'] };
  const v1 = veredicto(s.p1, 1), v2 = veredicto(s.p2, 2);
  const an1 = anclasDe(s.p1), an2 = anclasDe(s.p2);
  const a = v1 === 'sí' && an1.nor && an1.cli, b = v2 === 'no' && an2.nor && an2.cli, c = v1 === 'no' && v2 === 'sí';
  const cubo2 = v2 === null ? ['pregunta 2: veredicto sin decidir'] : [];
  if (a || b) {
    const porPregunta = a && b ? 'las dos' : a ? (v2 === null ? 'sin decidir' : 'la 1') : (v1 === null ? 'sin decidir' : 'la 2');
    return { quinto: true, porPregunta, cubo1: [], cubo2 };
  }
  if (c) return { quinto: false, cubo1: [], cubo2 };
  const cubo1 = [];
  for (const [n, v, an, afirma] of [[1, v1, an1, 'sí'], [2, v2, an2, 'no']]) {
    if (v === null) { cubo1.push(`pregunta ${n}: veredicto sin decidir`); continue; }
    if (v !== afirma) continue;
    if (an.fueraNor || an.fueraCli) cubo1.push(`pregunta ${n}: hallazgo con un ancla fuera de comillas`);
    else if (an.nor || an.cli) cubo1.push(`pregunta ${n}: hallazgo con una sola de las dos anclas`);
    else cubo1.push(`pregunta ${n}: hallazgo sin las anclas del quinto`);
  }
  return { quinto: null, cubo1, cubo2 };
}

// LOS TRES PRERREGISTROS DEL ARQUITECTO (04/11), antes de la tanda, Y EL TOPE CORREGIDO:
// P1 · UNA LLAMADA FALLIDA NO ES UN «NO»: no es un veredicto y no va a ningún cubo. La tanda es puntuable SÓLO con 21
//      respuestas buenas; las que falten se completan con las primeras buenas de la pulsación siguiente, y así sucesivamente,
//      por orden de vez. Se escribe cuántas fallaron.
// P2 · EL TOPE DE 4 ES DE LA COLUMNA 1: la banda A pide 17 de 21. CORREGIDO (arquitecto, 04/11): cuenta sólo las respuestas cuya
//      COLUMNA 1 es ilegible, no cualquier cosa que no se sepa leer. Por encima, las bandas son ILEGIBLES y se repite la tanda.
// P2b · LA COLUMNA 2 TIENE SU PROPIO TOPE: las respuestas con la pregunta 2 sin decidir van a una lista nombrada; si pasan de 4,
//      P-P3-2 se informa como NO PUNTUABLE con su cuenta. No afecta a la columna 1 ni a las bandas.
// P3 · LO ILEGIBLE SE ENSEÑA ANTES DEL NÚMERO: primero las fallidas, luego la columna 1 ilegible con su motivo, y el número sólo
//      si cabe en 4; después, la lista de la pregunta 2 y la columna 2.
export const N_TANDA = 21;
export const CUBO_MAXIMO = 4;
const fallida = r => !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';

export function resumen(pulsaciones) {
  const buenas = [], fallidas = [];
  pulsaciones.forEach((respuestas, p) => respuestas.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    if (fallida(r)) { if (buenas.length < N_TANDA) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`); }
    else if (buenas.length < N_TANDA) buenas.push({ id, ...contar(r) });
  }));
  const salida = [`1 · LAS FALLIDAS: ${fallidas.length}${fallidas.length ? ' — ' + fallidas.join(' · ') : ''}`];
  if (buenas.length < N_TANDA) {
    salida.push(`NO PUNTUABLE TODAVÍA: ${buenas.length} respuestas buenas de ${N_TANDA}. Se pulsa otra vez y las que faltan salen de la siguiente.`);
    return salida;
  }
  const ilegibles = buenas.filter(f => f.cubo1.length > 0);
  salida.push(`2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de ${CUBO_MAXIMO}): ${ilegibles.length} de ${N_TANDA}${ilegibles.length ? ' — ' + ilegibles.map(f => `${f.id}: ${f.cubo1.join('; ')}`).join(' · ') : ''}`);
  if (ilegibles.length > CUBO_MAXIMO) {
    salida.push(`ILEGIBLE POR LA COLUMNA 1: pasa de ${CUBO_MAXIMO} y la banda A (17 de 21) ya no se puede alcanzar. Se repite la tanda entera, o se aplica el alto si ya es la segunda.`);
    return salida;
  }
  const limpias = buenas.filter(f => f.quinto === true);
  salida.push(`3 · COLUMNA 1, ¿salió el quinto?: ${limpias.length} de ${N_TANDA} (se compara con los 9 de 21)`);
  const sinLa2 = buenas.filter(f => f.cubo2.length > 0);
  salida.push(`4 · LA PREGUNTA 2 SIN DECIDIR (su tope, ${CUBO_MAXIMO}): ${sinLa2.length} de ${N_TANDA}${sinLa2.length ? ' — ' + sinLa2.map(f => `${f.id}: ${f.cubo2.join('; ')}`).join(' · ') : ''}`);
  if (sinLa2.length > CUBO_MAXIMO) salida.push(`5 · P-P3-2: NO PUNTUABLE (${sinLa2.length} de ${N_TANDA} con la pregunta 2 sin decidir). No afecta a la columna 1 ni a las bandas.`);
  else salida.push(`5 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): ` +
    ['la 1', 'la 2', 'las dos', 'sin decidir'].map(k => `${k}: ${limpias.filter(f => f.porPregunta === k).length}`).join(' · '));
  return salida;
}

// LAS PRUEBAS, sobre respuestas INVENTADAS antes de la tanda: los casos que la regla tiene que decidir, y las trampas
const R = (vez, respuesta) => ({ vez, respuesta });
const N = '«El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos»';
const C1 = '«Las auditorías internas las realiza siempre personal ajeno al área auditada»';
const C2 = '«participa en la auditoría como interlocutor, pero no como auditor de su propia área»';
const PRUEBAS = [
  ['(a) el quinto por la 1', R(1, `PREGUNTA 1 · EL DATO\nSí.\nTexto 1: ${N}\nTexto 2: ${C1}\n\nPREGUNTA 2 · EL CUMPLIMIENTO\nSí, se pueden cumplir.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['(a) con la otra frase de CLI-12 y la cabecera en negrita', R(2, `**Pregunta 1:** Sí\n${N} / ${C2}\n**Pregunta 2:** Sí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['(b) el quinto por la 2 (hace fallar P-P3-2)', R(3, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo. ${N} ${C1} norma_contra_norma`), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
  ['(a) y (b): el quinto por las dos', R(4, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nNo. ${N} ${C2} norma_contra_norma`), { quinto: true, porPregunta: 'las dos', cubo1: [], cubo2: [] }],
  ['(c) no salió: sin hallazgo en ninguna', R(5, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), { quinto: false, cubo1: [], cubo2: [] }],
  ['TRAMPA: las anclas colgando de un «no» son (c)', R(6, `PREGUNTA 1\nNo, ${N} y ${C1} no hablan del mismo dato.\nPREGUNTA 2\nSí.`), { quinto: false, cubo1: [], cubo2: [] }],
  ['TRAMPA: el «no» de «no como auditor» dentro de una cita, en la segunda línea', R(7, `PREGUNTA 1\nSí.\n${N}\n${C2}\nPREGUNTA 2\nSí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['ilegible: «sí» y «no» en la misma primera frase', R(8, 'PREGUNTA 1\nNo es exactamente el mismo dato, pero sí hay diferencia.\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: veredicto sin decidir'], cubo2: [] }],
  ['ilegible: una sola de las dos anclas', R(9, `PREGUNTA 1\nSí. ${N} «El sistema de calidad se apoya en un calendario anual»\nPREGUNTA 2\nSí.`), { quinto: null, cubo1: ['pregunta 1: hallazgo con una sola de las dos anclas'], cubo2: [] }],
  ['ilegible: un ancla fuera de comillas', R(10, `PREGUNTA 1\nSí.\nNOR-11 dice que el Coordinador revisa trimestralmente el cumplimiento; CLI-12: ${C1}\nPREGUNTA 2\nSí.`), { quinto: null, cubo1: ['pregunta 1: hallazgo con un ancla fuera de comillas'], cubo2: [] }],
  ['ilegible: otro hallazgo, sin las anclas', R(11, 'PREGUNTA 1\nSí. «Se distinguen auditorías de proceso» «contenedor de los grupos III o IV»\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: hallazgo sin las anclas del quinto'], cubo2: [] }],
  ['ilegible en las dos: sin las dos secciones', R(12, `Sí, hay contradicción: ${N} ${C1}`), { quinto: null, cubo1: ['sin las dos secciones'], cubo2: ['sin las dos secciones'] }],
  ['sin respuesta (no llega al resumen: es una fallida)', { vez: 13, error: 'HTTP 529' }, { quinto: null, cubo1: ['sin respuesta'], cubo2: ['sin respuesta'] }],
  ['EL TOPE CORREGIDO: (a) con la 2 sin decidir es LEGIBLE en la columna 1, y va sólo a la lista de la 2', R(14, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`), { quinto: true, porPregunta: 'sin decidir', cubo1: [], cubo2: ['pregunta 2: veredicto sin decidir'] }],
  ['la forma numerada, si no hay cabeceras', R(15, `1. Sí. ${N} ${C1}\n2. Sí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['«si» sin tilde cuenta como «sí»', R(16, `PREGUNTA 1\nSi.\n${N} ${C1}\nPREGUNTA 2\nSi.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['«No obstante, sí»: ilegible', R(17, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: veredicto sin decidir'], cubo2: [] }],
  ['TRAMPA: «Si» condicional no es un «sí»; con la 1 en «no», la columna 1 es ilegible', R(18, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSi se hace lo que una permite, la otra se cumple igual.'), { quinto: null, cubo1: ['pregunta 2: veredicto sin decidir'], cubo2: ['pregunta 2: veredicto sin decidir'] }],
  ['TRAMPA: el modelo repite la pregunta antes de contestar', R(19, `PREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nSí.\n${N} ${C1}\nPREGUNTA 2 · EL CUMPLIMIENTO\n¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?\nSí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['EL SEGURO DE POLARIDAD: la 1 en «no» y la 2 en «Sí, hay hallazgo» → ilegible en las dos', R(20, `PREGUNTA 1\nNo.\nPREGUNTA 2\nSí, hay hallazgo. ${N} ${C1} No se pueden cumplir.`), { quinto: null, cubo1: ['pregunta 2: veredicto sin decidir'], cubo2: ['pregunta 2: veredicto sin decidir'] }],
];

// LAS PRUEBAS DEL RESUMEN: los prerregistros y los dos topes
const bien = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nSí.`);
const nada = v => R(v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.');
const raro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.');
const sinLa2 = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`);
const caida = v => ({ vez: v, error: 'HTTP 529' });
const veces = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const COL2 = (a, b, c, d) => `5 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: ${a} · la 2: ${b} · las dos: ${c} · sin decidir: ${d}`;
const ILEG = (desde, n) => veces(n, v => `pulsación 1, vez ${desde + v}: pregunta 1: veredicto sin decidir`).join(' · ');
const SIN2 = (desde, n) => veces(n, v => `pulsación 1, vez ${desde + v}: pregunta 2: veredicto sin decidir`).join(' · ');
const PRUEBAS_DEL_RESUMEN = [
  ['P1: dos fallidas y sin segunda pulsación → no puntuable', [[...veces(19, bien), caida(20), caida(21)]],
    ['1 · LAS FALLIDAS: 2 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529', 'NO PUNTUABLE TODAVÍA: 19 respuestas buenas de 21. Se pulsa otra vez y las que faltan salen de la siguiente.']],
  ['P1: las que faltan, de las PRIMERAS buenas de la pulsación siguiente (la vez 1 cae y se salta)', [[...veces(19, bien), caida(20), caida(21)], [caida(1), nada(2), nada(3), bien(4)]],
    ['1 · LAS FALLIDAS: 3 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529 · pulsación 2, vez 1: HTTP 529', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 19 de 21 (se compara con los 9 de 21)', '4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 0 de 21', COL2(19, 0, 0, 0)]],
  ['P2 y P3: la columna 1 ilegible en 4 → se lee, y lo ilegible va antes del número', [[...veces(17, bien), ...veces(4, v => raro(17 + v))]],
    ['1 · LAS FALLIDAS: 0', `2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 4 de 21 — ${ILEG(17, 4)}`, '3 · COLUMNA 1, ¿salió el quinto?: 17 de 21 (se compara con los 9 de 21)', '4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 0 de 21', COL2(17, 0, 0, 0)]],
  ['P2: la columna 1 ilegible en 5 → ILEGIBLE, y el número NO se enseña', [[...veces(16, bien), ...veces(5, v => raro(16 + v))]],
    ['1 · LAS FALLIDAS: 0', `2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 5 de 21 — ${ILEG(16, 5)}`, 'ILEGIBLE POR LA COLUMNA 1: pasa de 4 y la banda A (17 de 21) ya no se puede alcanzar. Se repite la tanda entera, o se aplica el alto si ya es la segunda.']],
  ['EL TOPE CORREGIDO: 5 con la 2 sin decidir y la 1 en (a) → la columna 1 se lee; P-P3-2, NO PUNTUABLE', [[...veces(16, bien), ...veces(5, v => sinLa2(16 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 21 de 21 (se compara con los 9 de 21)', `4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 5 de 21 — ${SIN2(16, 5)}`, '5 · P-P3-2: NO PUNTUABLE (5 de 21 con la pregunta 2 sin decidir). No afecta a la columna 1 ni a las bandas.']],
  ['la lista de la 2 en 4 → la columna 2 se puntúa, con las 4 como «sin decidir»', [[...veces(17, bien), ...veces(4, v => sinLa2(17 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 21 de 21 (se compara con los 9 de 21)', `4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 4 de 21 — ${SIN2(17, 4)}`, COL2(17, 0, 0, 4)]],
];

if (process.argv[2] === '--pruebas') {
  let mal = 0;
  for (const [nombre, r, esperado] of PRUEBAS) {
    const sale = contar(r);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  for (const [nombre, pulsaciones, esperado] of PRUEBAS_DEL_RESUMEN) {
    const sale = resumen(pulsaciones);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale, null, 1)}\n      debía ${JSON.stringify(esperado, null, 1)}`}`);
  }
  // LAS PRUEBAS DE FORMATO sobre las 21 respuestas de la PRIMERA TANDA (ILEGIBLE, 04/11), condición 1 del arquitecto:
  // PARSEAR SÍ, CONTAR NO. Sólo se comprueba SI la regla encuentra las dos secciones y SI decide un veredicto en cada
  // pregunta, nunca CUÁL, ni las anclas, ni el quinto; y no se imprime nada de eso. Lo esperado, escrito por formato antes de
  // pasar la regla: las 21 con sus dos secciones y la pregunta 1 decidida; la 2 sin decidir sólo en la 3 y la 9 («Sí, hay
  // hallazgo»: la polaridad al revés, al cubo a propósito), la 11 («sin hallazgo independiente») y la 13 (el veredicto, al
  // final y detrás de las viñetas).
  const vieja = JSON.parse(readFileSync(new URL('./tanda_quinto_1.json', import.meta.url), 'utf8')).respuestas;
  const sinDecidirLa2 = [3, 9, 11, 13];
  let malFormato = 0;
  for (const r of vieja) {
    const s = secciones(r.respuesta);
    const esperado = { secciones: true, decideLa1: true, decideLa2: !sinDecidirLa2.includes(r.vez) };
    const sale = { secciones: !!s, decideLa1: !!s && veredicto(s.p1, 1) !== null, decideLa2: !!s && veredicto(s.p2, 2) !== null };
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) { mal++; malFormato++; }
    if (!ok) console.log(`MAL · formato de la vez ${r.vez}: sale ${JSON.stringify(sale)}, se esperaba ${JSON.stringify(esperado)}`);
  }
  console.log(`formato de la primera tanda: ${vieja.length - malFormato} de ${vieja.length} como se esperaba`);
  const total = PRUEBAS.length + PRUEBAS_DEL_RESUMEN.length + vieja.length;
  console.log(`${total - mal} de ${total}`);
  process.exit(mal ? 1 : 0);
} else if (process.argv[2]) {
  // una o varias pulsaciones, en orden: node contar_quinto.mjs pulsacion1.json [pulsacion2.json …]
  const pulsaciones = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas);
  console.log(resumen(pulsaciones).join('\n'));
}
```

### PASO 3 · LOS DOS TOPES NO PESAN LO MISMO (arquitecto, 04/11/2026)

- **El tope de 4 de la COLUMNA 1 está DERIVADO**: la banda A pide 17 de 21, así que con más de 4 ilegibles no se podría alcanzar.
- **El tope de 4 de la COLUMNA 2 está puesto POR ANALOGÍA, no derivado**: P-P3-2 no tiene bandas, así que no hay nada de donde
  sacarlo. Su función real es impedir que P-P3-2 se puntúe sobre un denominador tan pequeño que no diga nada. **Que nadie le dé
  mañana el mismo peso que al de la columna 1.**

**HUELLA `cea980ddc9356e68` APROBADA POR EL ARQUITECTO (04/11/2026).** Sustituye a `a059848eccfef66b` y a `2db4208f2d928a8d`, las
dos archivadas arriba con su historia. **El número sólo vale si sale de un script con esta huella.** La segunda tanda queda
liberada. No se mueven, pase lo que pase: las bandas (A ≥17, B 13-16, C 10-12, D ≤9, n = 21), el criterio de qué cuenta como
hallazgo y el alto (si sale ILEGIBLE por la columna 1, no hay tercer endurecimiento y la decisión vuelve al arquitecto).

### PASO 3 · LA SEGUNDA TANDA: LEGIBLE, Y SU NÚMERO (Code, 04/11/2026)

Contada con el script de huella `cea980ddc9356e68`, comprobada antes de contar. Salida literal en la medida.
- **a · Fallidas: 0.**
- **b · La columna 1 ilegible: 4 de 21**, justo en el tope: las veces 4, 5, 11 y 12, las cuatro con la pregunta 2 sin decidir y la
  pregunta 1 sin dar el quinto (no se sabe si salió por la 2).
- **c · LA COLUMNA 1: EL QUINTO, EN 12 DE 21** (57,1 %, Wilson del 36,5 al 75,5 %). **Fisher contra los 9 de 21 de la pasada
  abierta: p = 0,538.** En las bandas prerregistradas, **12 cae en C («no mejora convincentemente», 10-12)**.
  ⚠️ **Y la cota que dejan las 4 ilegibles, sin reinterpretar nada**: si las cuatro fueran el quinto, serían 16, en B (13-16). Así
  que la columna 1 está entre 12 y 16, **en C o en B; NUNCA en A, y nunca en D**. Con 16, Fisher daría p = 0,058, tampoco
  significativo. Las bandas y los umbrales no se han tocado.
- **d · La pregunta 2 sin decidir: 5 de 21** (las veces 3, 4, 5, 11 y 12).
- **e · P-P3-2: NO PUNTUABLE**, con 5 de 21 por encima de su tope de 4 (que es por analogía, no derivado). No afecta a la columna 1.

**P-P3-1** («el quinto sale en banda A, 17 o más de 21») **FALLA**: ni con las cuatro ilegibles a favor llegaría a 17. **Lo que
dice la tanda, con el límite de la enmienda 2 delante**: con la pareja entregada y la pregunta cerrada, y SIN la puerta de citas
ni el verificador (que sólo podrían bajar el número), el juez saca el quinto en 12 a 16 de 21. Eso no se distingue de los 9 de
21 de la pasada abierta: la comparación iba sesgada a favor de la pregunta cerrada, y aun así no gana de forma convincente.
**La lectura de lo que eso significa para el plan es del arquitecto.**

## ⚠️ EL «CERCA DEL 90 %» DE D Y EL 57,1 % DEL QUINTO NO SON COMPARABLES TAL COMO ESTÁN (Code, 04/11/2026; hallazgo)

**COMPARARLOS MEZCLARÍA «EL JUEZ LO VE» CON «LA REGLA LO RECONOCE»** (Code; el arquitecto pide archivarla así).

**Las cuatro preguntas del arquitecto, con su cita y su fecha:**
1. **De dónde sale el «cerca del 90 %»**: de la CONDICIÓN 1, los trozos enteros con A dentro, NO de la variante limpia. **36 de
   40, el 90,0 % exacto**, en dos tandas del 30/10 sobre NOR-10·4 ↔ CLI-12·3: **20 de 20** a las 08:03:13 UTC
   (`claude/Medida_F130_Veinte_Condicion_1_30-10-2026.json`) y **16 de 20** en la repetición, a las 08:17:19 UTC
   (`claude/Medida_F130_Veinte_Condicion_1_Repetida_30-10-2026.json`). Escrito en `claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`,
   líneas 632 y 853. La variante limpia (las dos frases sin A) fue la condición 2, a las 08:04:58 UTC, y no entra.
2. **La ruta**: otro fichero (`pregunta/route.ts` entonces, `quinto/route.ts` hoy) y **la misma función, `preguntarAlJuez`**, con la
   configuración del juez, sin puerta de citas ni verificador, y el mismo modelo (`claude-haiku-5-5`, en los dos JSON).
3. **El prompt**: la misma plantilla (su último cambio, `b3b4e9da`, el 29/10 a las 19:16, antes de las dos tandas) y el mismo
   criterio del cumplimiento, que sale de `lib/analysis/excepcion-de-las-reglas.ts`, sin cambios desde `5c2d50c9` (27/10). Cambian
   sólo los dos textos, porque la pareja es otra (4.126 tokens de entrada entonces, 4.211 hoy).
4. **Trozos enteros**, como hoy.

**LO QUE LOS SEPARA ES LA REGLA DE CUENTA, NO LA CONDICIÓN**:
- **el 36 de 40 de D** se contó buscando UNA sola ancla, la del lado de NOR-10 («puede recaer en el propio Director Clínico»), y
  SÓLO en la pregunta 2; sin leer el veredicto (una «Sí, hay hallazgo» con la polaridad al revés contaba igual: la vuelta 11 de
  la condición 1) y sin exigir la cita de CLI-12; lo comprobó Code leyendo el JSON, sin script congelado y sin cubo;
- **el 12 de 21 del quinto** se contó con el script congelado: un veredicto leído, por la 1 O por la 2, y las DOS anclas entre
  comillas, una de cada lado, con 4 ilegibles fuera del número.
Y D es un caso del cumplimiento y el quinto uno del dato: cada uno puede salir por su propia pregunta.

**LO QUE EL ARQUITECTO RETIRA, con su nombre**: «D es alcance y el quinto es lectura, dos enfermedades distintas». Lo apoyó
comparando un recuento laxo con uno estricto: **el noveno error de la misma familia en tres días, y éste iba camino del plan.**
**Y SU CORRECCIÓN DE PASO**: citó el comentario de `PAREJAS_DE_E3` como «dos parejas, siete veces», y era una configuración
superada (una sola pareja desde el 29/10, y 20 veces desde el 30/10). Citó una versión vieja como si fuera la vigente.

**LO QUE DECIDE: SE RECUENTA D** (cuesta 0 de API). Porque el «cerca del 90 %» no sostiene sólo la comparación de hoy: sostiene la
frase de la semana 0 de que «el fallo está en preguntar», cuyo único apoyo medido del otro lado es ese número. **Cómo:**
1. **El mismo script, no uno nuevo**: las anclas pasan a ser un parámetro, y la comparabilidad es ESTRUCTURAL. Huella nueva,
   aprobada antes de contar.
2. **Las anclas de D las propone Code, del archivo**, con su texto literal y su fuente, y el arquitecto las aprueba antes de que
   se mire nada.
3. **El «O» sobre las dos preguntas se queda**: es la misma regla que en el quinto. Aparte, la columna 2: por qué pregunta salió
   cada uno, medido en vez de supuesto.
4. **El tope de lo ilegible, derivado**: el cubo del quinto fue 4 de 21, el 19,0 %, y el límite para la comparación es el 20 % de
   cada n, 8 de 40 en D. Si cualquiera de los dos lo pasa, LA COMPARACIÓN SE DECLARA NO HACEDERA. **Y el quinto pasó justo al
   borde.**
5. **El Fisher, sólo después de aprobar la huella y las anclas**, y en el orden de siempre: lo ilegible primero, los números después.
6. **Si el recuento baja D de forma apreciable**, se avisa ANTES de archivar la comparación: entonces hay que corregir el «cerca del
   90 %» en todos los sitios, la semana 0 incluida, y eso se hace con el arquitecto y el director, no lo hace Code solo.

### EL RECUENTO DE D: LA VERSIÓN PARAMETRIZADA Y LAS ANCLAS, PROPUESTAS Y PENDIENTES DE APROBACIÓN (Code, 04/11/2026)

**Nada se ha contado y no se ha leído ninguna de las 40 respuestas de D**: sólo su estructura (dos ficheros, 20 respuestas cada
uno, veces 1 a 20, ninguna con error, los mismos campos que las del quinto).

**LAS ANCLAS DE D, propuestas por Code del archivo** (para que las apruebe el arquitecto):
- **lado NOR-10: «puede recaer en el propio Director Clínico»**: es la frase con que la herramienta comprueba el trozo NOR-10·4
  (`TROZOS.nor10_4`, `app/api/admin/medida-f130/medida-f130.ts:84`). La frase entera, como la citó el juez en la línea base de D:
  «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»
  (`claude/Medida_F130_E3_Y_Vecindad_29-10-2026.md`, líneas 779 y 781).
- **lado CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente»**: la frase con que se comprueba
  CLI-12·3, el principio del §3.1 (`TROZOS.cli12_3`, la misma línea 85). La frase entera, en la línea 781 de la medida.
- ⚠️ **Dos cosas para decidir con ellas delante**: (1) el ancla de CLI-12 es LARGA (doce palabras, frente a las cuatro o cinco
  de las del quinto): si el juez cita un trozo más corto de esa frase, no casa y la respuesta va al cubo, y el cubo de D tiene
  tope 8; (2) el §3.5 («nunca por el Director Clínico del propio centro») NO está en el trozo CLI-12·3, así que no puede
  aparecer en estas 40 respuestas, y no se propone como ancla.

**LA VERSIÓN PARAMETRIZADA, HUELLA `df23ac646e9a4089`** (para aprobar; sustituiría a `cea980ddc9356e68` para los dos casos):
- R1', R2', R3 y R4 son el mismo código; un objeto `CASOS` lleva, por caso, las anclas de cada lado, el tamaño de la tanda, el
  tope y los textos de la salida. El quinto: sus anclas, 21, tope 4. D: las de arriba, 40, tope 8 (el 20 % de 40).
- **Comprobado que no cambia el quinto**: sobre la segunda tanda, su salida es IDÉNTICA, línea a línea, a la de la versión
  aprobada.
- 52 de 52 pruebas: las 47 de antes y 5 nuevas del caso D, sobre respuestas inventadas (sus anclas cuentan; las del quinto no,
  ni las de D en el quinto; 8 ilegibles de 40 se leen; 9 dan «NO HACEDERA» y no enseñan número).
- Se cuenta D con `CASO=D node contar_quinto.mjs <condición 1> <su repetición>`, y el caso que no existe se niega a contar.

```js
// LA REGLA DE CUENTA DEL PASO 3 DE F-130, EN CÓDIGO (Code, 04/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Implementa el criterio del arquitecto (03/11, 21:20) y la regla de reconocimiento que él aprueba antes de pulsar.
// Uso: node contar_quinto.mjs <salida-de-la-tanda.json> …   ·   CASO=D node contar_quinto.mjs <a.json> <b.json>   ·   --pruebas
import { readFileSync } from 'node:fs';

export const ANCLA_NOR11 = 'revisa trimestralmente el cumplimiento';
export const ANCLAS_CLI12 = ['personal ajeno al área auditada', 'no como auditor de su propia área'];

// LOS CASOS (04/11/2026, el recuento de D): LA MISMA REGLA, CON LAS ANCLAS COMO PARÁMETRO. Lo único que cambia de un caso a otro
// son las anclas de cada lado, el tamaño de la tanda, el tope de lo ilegible y los textos de la salida; R1', R2', R3 y R4 son el
// mismo código. Así la comparabilidad entre el quinto y D es ESTRUCTURAL, no una afirmación (arquitecto).
// · quinto: las anclas de FRASES_DEL_QUINTO; 21 respuestas; tope 4 (derivado: la banda A pide 17 de 21).
// · D: las frases que comprueban los trozos NOR-10·4 y CLI-12·3 (`TROZOS`, app/api/admin/medida-f130/medida-f130.ts:84-85);
//   40 respuestas (las dos tandas de la condición 1 del 30/10); tope 8, el 20 % de 40 (derivado: el cubo del quinto fue 4 de 21,
//   el 19,0 %; por encima del 20 % en cualquiera de los dos, la comparación NO SE HACE).
export const CASOS = {
  quinto: {
    nombre: 'el quinto', anclaA: ANCLA_NOR11, anclasB: ANCLAS_CLI12, n: 21, tope: 4,
    ilegible: 'ILEGIBLE POR LA COLUMNA 1: pasa de 4 y la banda A (17 de 21) ya no se puede alcanzar. Se repite la tanda entera, o se aplica el alto si ya es la segunda.',
    referencia: 'se compara con los 9 de 21', col2: 'P-P3-2', col2Puntua: 'puntúa P-P3-2, no afecta a la 1',
    deCaso: 'del quinto', col2NoAfecta: 'No afecta a la columna 1 ni a las bandas.',
  },
  D: {
    nombre: 'D', anclaA: 'puede recaer en el propio Director Clínico', anclasB: ['separar la responsabilidad de un proceso crítico de seguridad del paciente'], n: 40, tope: 8,
    ilegible: 'NO HACEDERA: la columna 1 ilegible pasa del 20 % de 40, y la comparación con el quinto no se hace sobre denominadores distintos.',
    referencia: 'se compara con el quinto del paso 3', col2: 'LA COLUMNA 2 DE D', col2Puntua: 'no afecta a la 1',
    deCaso: 'de D', col2NoAfecta: 'No afecta a la columna 1.',
  },
};

const plano = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
const sinMarcas = s => s.replace(/[*_#>`]/g, '');

// R1' · LAS DOS SECCIONES (endurecida el 04/11 tras la primera tanda, ILEGIBLE). Una cabecera es una LÍNEA que, quitadas las
// marcas y los espacios, EMPIEZA por «PREGUNTA 1» o «PREGUNTA 2» (mayúsculas o no, con o sin espacio). Las menciones en la
// prosa («ya está contada en la pregunta 1») no cuentan. Tiene que haber una de cada, en orden; si no, se prueba la forma
// numerada a principio de línea («1.» o «1)» y «2.» o «2)»). Si tampoco: al tercer cubo, «sin las dos secciones».
export function secciones(texto) {
  const t = sinMarcas(texto);
  const probar = (re1, re2) => {
    const a = [...t.matchAll(re1)], b = [...t.matchAll(re2)];
    if (a.length !== 1 || b.length !== 1 || a[0].index >= b[0].index) return null;
    return { p1: t.slice(a[0].index + a[0][0].length, b[0].index), p2: t.slice(b[0].index + b[0][0].length) };
  };
  return probar(/^[ \t]*pregunta\s*1\b/gim, /^[ \t]*pregunta\s*2\b/gim) ?? probar(/^[ \t]*1[.)]/gm, /^[ \t]*2[.)]/gm);
}

// R2' · EL VEREDICTO de cada sección (endurecida el 04/11). Se recorren sus líneas EN ORDEN hasta la primera que traiga una
// cita (« “ ") o sea una viñeta («- », «• »), y gana la PRIMERA que EMPIECE por una forma de veredicto. En cada línea:
//   · lo que queda de la línea de la cabecera («· EL DATO:») se quita; si la línea trae una pregunta, cuenta lo que va
//     DESPUÉS del último «?» («¿Se pueden cumplir las dos a la vez? No.» → «No.»); y se quitan las etiquetas del principio
//     («Respuesta:», «HAY HALLAZGO:», «Hallazgo:»);
//   · las formas: la primera palabra «sí» o «no» («si» SIN TILDE sólo si va sola o con puntuación: «Si.», «Si,»; suelto es
//     el condicional); y, SÓLO EN LA PREGUNTA 2, la línea que empieza por «no se pueden cumplir» («no») o por «se pueden
//     cumplir» («sí»), que es como el propio prompt invita a contestar;
//   · las líneas sin forma de veredicto (los preámbulos: «Ambos textos son reglas, así que aplica la pregunta…») se saltan.
// La línea elegida va al cubo, en vez de dar veredicto, si su PRIMERA FRASE trae a la vez las palabras «sí» y «no» (salvo
// dentro de la forma «no se pueden cumplir»), o si, EN LA PREGUNTA 2, su veredicto es «sí» y esa primera frase dice
// «hallazgo» («Sí, hay hallazgo»: la polaridad al revés; el seguro va en la dirección conservadora). Sin ninguna línea así antes de la primera cita o viñeta: «veredicto sin
// decidir». NO CAMBIA QUÉ CUENTA COMO HALLAZGO (la 1 en «sí», la 2 en «no»): sólo reconoce las formas de decirlo.
const SI = /(^|[^\p{L}])sí([^\p{L}]|$)/iu, NO = /(^|[^\p{L}])no([^\p{L}]|$)/iu;
export function veredicto(seccion, pregunta = 1) {
  const lineas = seccion.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const cruda = lineas[i];
    if (/^\s*([-•]\s)/.test(cruda)) return null;
    let l = (i === 0 ? cruda.replace(/^[\s·:.\-–—]*(el dato|el cumplimiento)?[\s·:.\-–—]*/i, '') : cruda).trim();
    if (l.includes('?')) l = l.slice(l.lastIndexOf('?') + 1).trim();
    l = l.replace(/^((respuesta|hay hallazgo|hallazgo)\s*:\s*)+/i, '').trim();
    if (l === '') { if (/[«“"]/.test(cruda)) return null; continue; }
    let v = null, frase = false;
    if (pregunta === 2 && /^no se pueden cumplir/i.test(l)) { v = 'no'; frase = true; }
    else if (pregunta === 2 && /^(s[ií][,\s]+)?se pueden cumplir/i.test(l)) { v = 'sí'; frase = true; }
    else if (/^sí([^\p{L}]|$)/iu.test(l) || /^si([.,;:!]|$)/i.test(l)) v = 'sí';
    else if (/^no([^\p{L}]|$)/iu.test(l)) v = 'no';
    if (v === null) { if (/[«“"]/.test(cruda)) return null; continue; }
    // las dos comprobaciones, sobre la PRIMERA FRASE de la línea (hasta el primer «.», «:» o «;» seguido de espacio): el
    // veredicto es esa frase, y lo que venga detrás en la misma línea («Sí. No hay ninguna frase…») ya es razonamiento
    const primera = l.split(/(?<=[.:;])\s/)[0];
    const resto = frase && v === 'no' ? primera.replace(/^no se pueden cumplir/i, '') : primera;
    if (SI.test(resto) && NO.test(resto)) return null;
    if (pregunta === 2 && v === 'sí' && /hallazgo/i.test(primera)) return null;
    return v;
  }
  return null;
}

// R3 · LAS CITAS: los tramos entre «…», “…” o "…" de la sección. Se contrastan con las anclas en minúsculas y con los espacios
// colapsados; una cita casa con un ancla si la contiene entera.
export function citas(seccion) {
  return [...seccion.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => plano(m[1] ?? m[2] ?? m[3] ?? ''));
}
function anclasDe(seccion, caso = CASOS.quinto) {
  const c = citas(seccion), p = plano(seccion), A = plano(caso.anclaA), B = caso.anclasB.map(plano);
  const nor = c.some(x => x.includes(A)), cli = c.some(x => B.some(a => x.includes(a)));
  const fueraNor = !nor && p.includes(A), fueraCli = !cli && B.some(a => p.includes(a));
  return { nor, cli, fueraNor, fueraCli };
}

// R4 · LA CUENTA (columna 1 y columna 2, con el tope corregido por el arquitecto el 04/11). «Hallazgo afirmado» = la 1 en
// «sí», o la 2 en «no»; da EL QUINTO si su sección trae, ENTRE COMILLAS, una cita con el ancla de NOR-11 y otra con una de las
// dos de CLI-12. LA COLUMNA 1 ES LEGIBLE cuando se da una de estas tres:
//   (a) la pregunta 1 decide «sí» y trae las dos anclas → el quinto salió;
//   (b) la pregunta 2 decide «no se pueden cumplir» y trae las dos anclas → el quinto salió;
//   (c) la pregunta 1 decide «no» Y la pregunta 2 decide «sí se pueden cumplir» → el quinto no salió.
// Es ILEGIBLE en cualquier otro caso, y SÓLO las ilegibles van a `cubo1`, que es lo que cuenta para el tope de 4. Su motivo, por
// pregunta: veredicto sin decidir; hallazgo con una sola de las dos anclas; con un ancla fuera de comillas; o sin las anclas
// del quinto. Las anclas colgando de un «no hay hallazgo» no cuentan: eso es (c).
// LA COLUMNA 2, ¿por qué pregunta salió el quinto?: la 1, la 2, las dos, o «sin decidir» si la otra pregunta no se puede leer.
// Y `cubo2` es la lista de las respuestas con la PREGUNTA 2 SIN DECIDIR, con su propio tope (resumen, abajo).
export function contar(respuesta, caso = CASOS.quinto) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { quinto: null, cubo1: ['sin respuesta'], cubo2: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { quinto: null, cubo1: ['sin las dos secciones'], cubo2: ['sin las dos secciones'] };
  const v1 = veredicto(s.p1, 1), v2 = veredicto(s.p2, 2);
  const an1 = anclasDe(s.p1, caso), an2 = anclasDe(s.p2, caso);
  const a = v1 === 'sí' && an1.nor && an1.cli, b = v2 === 'no' && an2.nor && an2.cli, c = v1 === 'no' && v2 === 'sí';
  const cubo2 = v2 === null ? ['pregunta 2: veredicto sin decidir'] : [];
  if (a || b) {
    const porPregunta = a && b ? 'las dos' : a ? (v2 === null ? 'sin decidir' : 'la 1') : (v1 === null ? 'sin decidir' : 'la 2');
    return { quinto: true, porPregunta, cubo1: [], cubo2 };
  }
  if (c) return { quinto: false, cubo1: [], cubo2 };
  const cubo1 = [];
  for (const [n, v, an, afirma] of [[1, v1, an1, 'sí'], [2, v2, an2, 'no']]) {
    if (v === null) { cubo1.push(`pregunta ${n}: veredicto sin decidir`); continue; }
    if (v !== afirma) continue;
    if (an.fueraNor || an.fueraCli) cubo1.push(`pregunta ${n}: hallazgo con un ancla fuera de comillas`);
    else if (an.nor || an.cli) cubo1.push(`pregunta ${n}: hallazgo con una sola de las dos anclas`);
    else cubo1.push(`pregunta ${n}: hallazgo sin las anclas ${caso.deCaso}`);
  }
  return { quinto: null, cubo1, cubo2 };
}

// LOS TRES PRERREGISTROS DEL ARQUITECTO (04/11), antes de la tanda, Y EL TOPE CORREGIDO:
// P1 · UNA LLAMADA FALLIDA NO ES UN «NO»: no es un veredicto y no va a ningún cubo. La tanda es puntuable SÓLO con 21
//      respuestas buenas; las que falten se completan con las primeras buenas de la pulsación siguiente, y así sucesivamente,
//      por orden de vez. Se escribe cuántas fallaron.
// P2 · EL TOPE DE 4 ES DE LA COLUMNA 1: la banda A pide 17 de 21. CORREGIDO (arquitecto, 04/11): cuenta sólo las respuestas cuya
//      COLUMNA 1 es ilegible, no cualquier cosa que no se sepa leer. Por encima, las bandas son ILEGIBLES y se repite la tanda.
// P2b · LA COLUMNA 2 TIENE SU PROPIO TOPE: las respuestas con la pregunta 2 sin decidir van a una lista nombrada; si pasan de 4,
//      P-P3-2 se informa como NO PUNTUABLE con su cuenta. No afecta a la columna 1 ni a las bandas.
// P3 · LO ILEGIBLE SE ENSEÑA ANTES DEL NÚMERO: primero las fallidas, luego la columna 1 ilegible con su motivo, y el número sólo
//      si cabe en 4; después, la lista de la pregunta 2 y la columna 2.
export const N_TANDA = 21;
export const CUBO_MAXIMO = 4;
const fallida = r => !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';

export function resumen(pulsaciones, caso = CASOS.quinto) {
  const N = caso.n, TOPE = caso.tope;
  const buenas = [], fallidas = [];
  pulsaciones.forEach((respuestas, p) => respuestas.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    if (fallida(r)) { if (buenas.length < N) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`); }
    else if (buenas.length < N) buenas.push({ id, ...contar(r, caso) });
  }));
  const salida = [`1 · LAS FALLIDAS: ${fallidas.length}${fallidas.length ? ' — ' + fallidas.join(' · ') : ''}`];
  if (buenas.length < N) {
    salida.push(`NO PUNTUABLE TODAVÍA: ${buenas.length} respuestas buenas de ${N}. Se pulsa otra vez y las que faltan salen de la siguiente.`);
    return salida;
  }
  const ilegibles = buenas.filter(f => f.cubo1.length > 0);
  salida.push(`2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de ${TOPE}): ${ilegibles.length} de ${N}${ilegibles.length ? ' — ' + ilegibles.map(f => `${f.id}: ${f.cubo1.join('; ')}`).join(' · ') : ''}`);
  if (ilegibles.length > TOPE) {
    salida.push(caso.ilegible);
    return salida;
  }
  const limpias = buenas.filter(f => f.quinto === true);
  salida.push(`3 · COLUMNA 1, ¿salió ${caso.nombre}?: ${limpias.length} de ${N} (${caso.referencia})`);
  const sinLa2 = buenas.filter(f => f.cubo2.length > 0);
  salida.push(`4 · LA PREGUNTA 2 SIN DECIDIR (su tope, ${TOPE}): ${sinLa2.length} de ${N}${sinLa2.length ? ' — ' + sinLa2.map(f => `${f.id}: ${f.cubo2.join('; ')}`).join(' · ') : ''}`);
  if (sinLa2.length > TOPE) salida.push(`5 · ${caso.col2}: NO PUNTUABLE (${sinLa2.length} de ${N} con la pregunta 2 sin decidir). ${caso.col2NoAfecta}`);
  else salida.push(`5 · COLUMNA 2, ¿por qué pregunta? (${caso.col2Puntua}): ` +
    ['la 1', 'la 2', 'las dos', 'sin decidir'].map(k => `${k}: ${limpias.filter(f => f.porPregunta === k).length}`).join(' · '));
  return salida;
}

// LAS PRUEBAS, sobre respuestas INVENTADAS antes de la tanda: los casos que la regla tiene que decidir, y las trampas
const R = (vez, respuesta) => ({ vez, respuesta });
const N = '«El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos»';
const C1 = '«Las auditorías internas las realiza siempre personal ajeno al área auditada»';
const C2 = '«participa en la auditoría como interlocutor, pero no como auditor de su propia área»';
const PRUEBAS = [
  ['(a) el quinto por la 1', R(1, `PREGUNTA 1 · EL DATO\nSí.\nTexto 1: ${N}\nTexto 2: ${C1}\n\nPREGUNTA 2 · EL CUMPLIMIENTO\nSí, se pueden cumplir.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['(a) con la otra frase de CLI-12 y la cabecera en negrita', R(2, `**Pregunta 1:** Sí\n${N} / ${C2}\n**Pregunta 2:** Sí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['(b) el quinto por la 2 (hace fallar P-P3-2)', R(3, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo. ${N} ${C1} norma_contra_norma`), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
  ['(a) y (b): el quinto por las dos', R(4, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nNo. ${N} ${C2} norma_contra_norma`), { quinto: true, porPregunta: 'las dos', cubo1: [], cubo2: [] }],
  ['(c) no salió: sin hallazgo en ninguna', R(5, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), { quinto: false, cubo1: [], cubo2: [] }],
  ['TRAMPA: las anclas colgando de un «no» son (c)', R(6, `PREGUNTA 1\nNo, ${N} y ${C1} no hablan del mismo dato.\nPREGUNTA 2\nSí.`), { quinto: false, cubo1: [], cubo2: [] }],
  ['TRAMPA: el «no» de «no como auditor» dentro de una cita, en la segunda línea', R(7, `PREGUNTA 1\nSí.\n${N}\n${C2}\nPREGUNTA 2\nSí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['ilegible: «sí» y «no» en la misma primera frase', R(8, 'PREGUNTA 1\nNo es exactamente el mismo dato, pero sí hay diferencia.\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: veredicto sin decidir'], cubo2: [] }],
  ['ilegible: una sola de las dos anclas', R(9, `PREGUNTA 1\nSí. ${N} «El sistema de calidad se apoya en un calendario anual»\nPREGUNTA 2\nSí.`), { quinto: null, cubo1: ['pregunta 1: hallazgo con una sola de las dos anclas'], cubo2: [] }],
  ['ilegible: un ancla fuera de comillas', R(10, `PREGUNTA 1\nSí.\nNOR-11 dice que el Coordinador revisa trimestralmente el cumplimiento; CLI-12: ${C1}\nPREGUNTA 2\nSí.`), { quinto: null, cubo1: ['pregunta 1: hallazgo con un ancla fuera de comillas'], cubo2: [] }],
  ['ilegible: otro hallazgo, sin las anclas', R(11, 'PREGUNTA 1\nSí. «Se distinguen auditorías de proceso» «contenedor de los grupos III o IV»\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: hallazgo sin las anclas del quinto'], cubo2: [] }],
  ['ilegible en las dos: sin las dos secciones', R(12, `Sí, hay contradicción: ${N} ${C1}`), { quinto: null, cubo1: ['sin las dos secciones'], cubo2: ['sin las dos secciones'] }],
  ['sin respuesta (no llega al resumen: es una fallida)', { vez: 13, error: 'HTTP 529' }, { quinto: null, cubo1: ['sin respuesta'], cubo2: ['sin respuesta'] }],
  ['EL TOPE CORREGIDO: (a) con la 2 sin decidir es LEGIBLE en la columna 1, y va sólo a la lista de la 2', R(14, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`), { quinto: true, porPregunta: 'sin decidir', cubo1: [], cubo2: ['pregunta 2: veredicto sin decidir'] }],
  ['la forma numerada, si no hay cabeceras', R(15, `1. Sí. ${N} ${C1}\n2. Sí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['«si» sin tilde cuenta como «sí»', R(16, `PREGUNTA 1\nSi.\n${N} ${C1}\nPREGUNTA 2\nSi.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['«No obstante, sí»: ilegible', R(17, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: veredicto sin decidir'], cubo2: [] }],
  ['TRAMPA: «Si» condicional no es un «sí»; con la 1 en «no», la columna 1 es ilegible', R(18, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSi se hace lo que una permite, la otra se cumple igual.'), { quinto: null, cubo1: ['pregunta 2: veredicto sin decidir'], cubo2: ['pregunta 2: veredicto sin decidir'] }],
  ['TRAMPA: el modelo repite la pregunta antes de contestar', R(19, `PREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nSí.\n${N} ${C1}\nPREGUNTA 2 · EL CUMPLIMIENTO\n¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?\nSí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['EL SEGURO DE POLARIDAD: la 1 en «no» y la 2 en «Sí, hay hallazgo» → ilegible en las dos', R(20, `PREGUNTA 1\nNo.\nPREGUNTA 2\nSí, hay hallazgo. ${N} ${C1} No se pueden cumplir.`), { quinto: null, cubo1: ['pregunta 2: veredicto sin decidir'], cubo2: ['pregunta 2: veredicto sin decidir'] }],
];

// LAS PRUEBAS DEL RESUMEN: los prerregistros y los dos topes
const bien = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nSí.`);
const nada = v => R(v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.');
const raro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.');
const sinLa2 = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`);
const caida = v => ({ vez: v, error: 'HTTP 529' });
const veces = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const COL2 = (a, b, c, d) => `5 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: ${a} · la 2: ${b} · las dos: ${c} · sin decidir: ${d}`;
const ILEG = (desde, n) => veces(n, v => `pulsación 1, vez ${desde + v}: pregunta 1: veredicto sin decidir`).join(' · ');
const SIN2 = (desde, n) => veces(n, v => `pulsación 1, vez ${desde + v}: pregunta 2: veredicto sin decidir`).join(' · ');
const PRUEBAS_DEL_RESUMEN = [
  ['P1: dos fallidas y sin segunda pulsación → no puntuable', [[...veces(19, bien), caida(20), caida(21)]],
    ['1 · LAS FALLIDAS: 2 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529', 'NO PUNTUABLE TODAVÍA: 19 respuestas buenas de 21. Se pulsa otra vez y las que faltan salen de la siguiente.']],
  ['P1: las que faltan, de las PRIMERAS buenas de la pulsación siguiente (la vez 1 cae y se salta)', [[...veces(19, bien), caida(20), caida(21)], [caida(1), nada(2), nada(3), bien(4)]],
    ['1 · LAS FALLIDAS: 3 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529 · pulsación 2, vez 1: HTTP 529', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 19 de 21 (se compara con los 9 de 21)', '4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 0 de 21', COL2(19, 0, 0, 0)]],
  ['P2 y P3: la columna 1 ilegible en 4 → se lee, y lo ilegible va antes del número', [[...veces(17, bien), ...veces(4, v => raro(17 + v))]],
    ['1 · LAS FALLIDAS: 0', `2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 4 de 21 — ${ILEG(17, 4)}`, '3 · COLUMNA 1, ¿salió el quinto?: 17 de 21 (se compara con los 9 de 21)', '4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 0 de 21', COL2(17, 0, 0, 0)]],
  ['P2: la columna 1 ilegible en 5 → ILEGIBLE, y el número NO se enseña', [[...veces(16, bien), ...veces(5, v => raro(16 + v))]],
    ['1 · LAS FALLIDAS: 0', `2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 5 de 21 — ${ILEG(16, 5)}`, 'ILEGIBLE POR LA COLUMNA 1: pasa de 4 y la banda A (17 de 21) ya no se puede alcanzar. Se repite la tanda entera, o se aplica el alto si ya es la segunda.']],
  ['EL TOPE CORREGIDO: 5 con la 2 sin decidir y la 1 en (a) → la columna 1 se lee; P-P3-2, NO PUNTUABLE', [[...veces(16, bien), ...veces(5, v => sinLa2(16 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 21 de 21 (se compara con los 9 de 21)', `4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 5 de 21 — ${SIN2(16, 5)}`, '5 · P-P3-2: NO PUNTUABLE (5 de 21 con la pregunta 2 sin decidir). No afecta a la columna 1 ni a las bandas.']],
  ['la lista de la 2 en 4 → la columna 2 se puntúa, con las 4 como «sin decidir»', [[...veces(17, bien), ...veces(4, v => sinLa2(17 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 21 de 21 (se compara con los 9 de 21)', `4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 4 de 21 — ${SIN2(17, 4)}`, COL2(17, 0, 0, 4)]],
];

if (process.argv[2] === '--pruebas') {
  let mal = 0;
  for (const [nombre, r, esperado] of PRUEBAS) {
    const sale = contar(r);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  for (const [nombre, pulsaciones, esperado] of PRUEBAS_DEL_RESUMEN) {
    const sale = resumen(pulsaciones);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale, null, 1)}\n      debía ${JSON.stringify(esperado, null, 1)}`}`);
  }
  // LAS PRUEBAS DEL CASO D, sobre respuestas INVENTADAS (no se ha leído ninguna de las 40 de D): sus anclas cuentan, las del
  // quinto no, y el tope es 8 de 40
  const ND = '«figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»';
  const CD = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que gestiona la agenda»';
  const dBien = v => R(v, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. ${ND} ${CD} norma_contra_norma`);
  const dRaro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.');
  const PRUEBAS_DE_D = [
    ['D por la 2, con sus dos anclas', () => contar(dBien(1), CASOS.D), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
    ['las anclas del QUINTO no cuentan como D', () => contar(R(2, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nSí.`), CASOS.D), { quinto: null, cubo1: ['pregunta 1: hallazgo sin las anclas de D'], cubo2: [] }],
    ['y las de D no cuentan como el quinto', () => contar(dBien(3)), { quinto: null, cubo1: ['pregunta 2: hallazgo sin las anclas del quinto'], cubo2: [] }],
    ['D: 8 ilegibles de 40 → se lee', () => resumen([[...veces(20, dBien)], [...veces(12, dBien), ...veces(8, v => dRaro(12 + v))]], CASOS.D).slice(2, 3),
      ['3 · COLUMNA 1, ¿salió D?: 32 de 40 (se compara con el quinto del paso 3)']],
    ['D: 9 ilegibles de 40 → NO HACEDERA, sin número', () => resumen([[...veces(20, dBien)], [...veces(11, dBien), ...veces(9, v => dRaro(11 + v))]], CASOS.D).slice(2),
      ['NO HACEDERA: la columna 1 ilegible pasa del 20 % de 40, y la comparación con el quinto no se hace sobre denominadores distintos.']],
  ];
  for (const [nombre, f, esperado] of PRUEBAS_DE_D) {
    const sale = f();
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  // LAS PRUEBAS DE FORMATO sobre las 21 respuestas de la PRIMERA TANDA (ILEGIBLE, 04/11), condición 1 del arquitecto:
  // PARSEAR SÍ, CONTAR NO. Sólo se comprueba SI la regla encuentra las dos secciones y SI decide un veredicto en cada
  // pregunta, nunca CUÁL, ni las anclas, ni el quinto; y no se imprime nada de eso. Lo esperado, escrito por formato antes de
  // pasar la regla: las 21 con sus dos secciones y la pregunta 1 decidida; la 2 sin decidir sólo en la 3 y la 9 («Sí, hay
  // hallazgo»: la polaridad al revés, al cubo a propósito), la 11 («sin hallazgo independiente») y la 13 (el veredicto, al
  // final y detrás de las viñetas).
  const vieja = JSON.parse(readFileSync(new URL('./tanda_quinto_1.json', import.meta.url), 'utf8')).respuestas;
  const sinDecidirLa2 = [3, 9, 11, 13];
  let malFormato = 0;
  for (const r of vieja) {
    const s = secciones(r.respuesta);
    const esperado = { secciones: true, decideLa1: true, decideLa2: !sinDecidirLa2.includes(r.vez) };
    const sale = { secciones: !!s, decideLa1: !!s && veredicto(s.p1, 1) !== null, decideLa2: !!s && veredicto(s.p2, 2) !== null };
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) { mal++; malFormato++; }
    if (!ok) console.log(`MAL · formato de la vez ${r.vez}: sale ${JSON.stringify(sale)}, se esperaba ${JSON.stringify(esperado)}`);
  }
  console.log(`formato de la primera tanda: ${vieja.length - malFormato} de ${vieja.length} como se esperaba`);
  const total = PRUEBAS.length + PRUEBAS_DEL_RESUMEN.length + PRUEBAS_DE_D.length + vieja.length;
  console.log(`${total - mal} de ${total}`);
  process.exit(mal ? 1 : 0);
} else if (process.argv[2]) {
  // una o varias pulsaciones, en orden: node contar_quinto.mjs pulsacion1.json [pulsacion2.json …]
  const pulsaciones = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas);
  // el caso, por la variable CASO (quinto, por defecto, o D); uno que no exista se niega en vez de contar con el del quinto
  const caso = CASOS[process.env.CASO ?? 'quinto'];
  if (!caso) { console.log(`NO SE CUENTA: el caso «${process.env.CASO}» no existe (hay: ${Object.keys(CASOS).join(', ')})`); process.exit(1); }
  console.log(`caso: ${caso.nombre} · anclas: «${caso.anclaA}» / ${caso.anclasB.map(a => `«${a}»`).join(' o ')} · n = ${caso.n} · tope = ${caso.tope}`);
  console.log(resumen(pulsaciones, caso).join('\n'));
}
```

## ⚠️⚠️ EL 90 % NO ES LA D SEMBRADA (arquitecto y Code, 04/11/2026)

**SUSTITUYE a las dos secciones del 04/11 de arriba** («NO SON COMPARABLES TAL COMO ESTÁN» y «EL RECUENTO DE D… PROPUESTAS»):
allí se llamaba «D» a la pareja del §3.1 y se proponían sus anclas, y las dos cosas quedan retiradas. Las del commit `42e8742b`,
también.

**1 · LO QUE MIDIÓ EL 36 DE 40.** La pareja NOR-10·4 (§2.4) ↔ CLI-12·3 (§3.1): **el permiso contra el principio**, contado con
una regla laxa (un ancla sola y sin leer el veredicto). **No es la D de la siembra**, que es §2.4 ↔ **§3.5**
(`corpus-pruebas/SIEMBRA_corpus_ampliado.md:90-120`; el §3.5 va en CLI-12·6, el §3.1 en CLI-12·3). **La D sembrada se midió UNA
VEZ: 6 de 7, el 28/10, con el prompt de la «línea ancha», y no se repitió** (`Medida_F130_E3_Y_Vecindad_29-10-2026.md:31, 91`).
**«La pregunta cerrada saca D cerca del 90 %» es FALSO tal como está escrito, y se corrige en todos los sitios** (las marcas del
04/11 en el estado, la medida, este fichero y el protocolo). **El 36 de 40 no se vuelve a llamar D**: se llama «§2.4 ↔ §3.1, el
permiso contra el principio». Su recuento con el script congelado va DESPUÉS, como corrección del archivo, no como respuesta.

**2 · Y LOS 3 DE 21 TAMPOCO SON LA D DEL §3.5** (Code, 04/11). Las tres D de la línea base (`SQL_34_06`, 31/10; pasadas 12, 17 y
21) citan «el principio de §3.1» (`Medida_F130_E3_Y_Vecindad_29-10-2026.md:1051, 1072, 1089`; y `Estado…`: «Las tres D citan el
permiso contra el principio de §3.1»). **Los dos números se citaron por el §3.1.** Lo que los separa es producto-publicado frente
a herramienta-sólo-el-juez, MÁS la regla de cuenta. El primer cruce ya estaba corregido el 31/10; el segundo, no («la regla de
puntuación es la misma», escrito el 31/10, era falso).

**3 · LA SEMANA 0 DEL ARQUITECTO REINTRODUJO EL CRUCE: UNA REGRESIÓN, NO UN ERROR NUEVO** (arquitecto, con su nombre). Su frase,
literal, de `claude/Semana_0_F130_Linea_Base_Cerrada_02-11-2026.md`, sección 2, que vive en el PROYECTO DE CLAUDE y NO EN EL
REPOSITORIO (pegada por él el 04/11; Code no la ha visto en su sitio):
> «**Consecuencia: el fallo no está en buscar ni en entregar. Está en preguntar.** Y lo apoya lo único medido del otro lado: la
> pregunta cerrada sobre la pareja saca D cerca del 90 %, contra el 14 % de la pasada abierta. Mismo modelo, mismo texto, otra
> pregunta.»

**LA MARCA, con la redacción del arquitecto, que va al lado de la frase** (la pone él en el proyecto, donde vive; Code no llega):
> «APOYO RETIRADO, PENDIENTE DE MEDIR (04/11). El 90 % y el 14 % se citaron los dos por el §3.1, y lo que los separa es
> producto-publicado frente a herramienta-sólo-juez, más la regla de cuenta — un cruce de condiciones ya corregido el 31/10 y
> reintroducido aquí. La conclusión "está en preguntar" puede ser cierta y hoy NO está demostrada para la D sembrada
> (§2.4 ↔ §3.5), que sólo se midió una vez: 6 de 7, el 28/10, con otro prompt.»

La conclusión no se borra: se marca.

**4 · LAS CORRECCIONES DEL ARQUITECTO, con sus números** (la cuenta es suya):
- **Su cita de la tabla**: la dio como «Medida_F313, del 22/10», y es `claude/Medida_34_Conflicto_Normativo_26-10-2026.md:57`, del
  26/10. Fichero mal y fecha mal.
- **La undécima de la familia: su regla de anclas, RETIRADA.** El suelo de 30 caracteres lo derivó de «personal ajeno al área
  auditada» creyendo que medía 30, y mide **31**: un umbral derivado de una cadena mal medida. Code le puso además otras tres
  objeciones, que aceptó: la regla no fija un ancla única (de 3 a 9 tramos empatados por lado), elige tramos que no son el
  conflicto («experiencia diaria del centro.»), y movería las tres anclas del quinto.
- **La duodécima: citó una frase que Code no puede abrir**, la de la semana 0 (arriba), y contra una regla ya escrita.
- **La decimotercera, que cazó él solo**: al calcular el umbral de la tanda de D su bucle tomó el primer k en vez del límite, y le
  dio 21 en vez de 19. Lo vio al releer la tabla.

**5 · EL CONTROL QUE SOSTIENE LO ANTERIOR SIN EJECUTAR UNA CONSULTA** (Code, 04/11; el arquitecto pide que quede escrito).
NOR-10, NOR-11 y CLI-12 troceados en local con el código de la indexación (`extractSegments` + `chunkSegments`, por posición en
el array): **los trozos NOR-11·13 y CLI-12·13 son IDÉNTICOS, byte a byte, al texto GUARDADO en la base** que devolvió el ensayo del
paso 3 (el mismo día). Con eso, lo que dice el troceado local de los demás trozos vale para la base:
- **CLI-12·3** (914 caracteres): el §3 y el §3.1 (la frase de A y la del principio). **Sin el §3.5.**
- **CLI-12·6** (969): el §3.5 y el §3.6. **«nunca por el Director Clínico del propio centro» sale UNA vez**, y ninguna en CLI-12·3.
- **NOR-10·4** (1.148): el §2.4 y el §2.5. **«puede recaer en el propio Director Clínico» sale UNA vez.**
- **El troceado no cambió** entre el 20/10 y el 29/10 (`git log` de `lib/chunking.ts`, vacío), y los tres tamaños coinciden con la
  tabla del 26/10.

**6 · LA TANDA QUE SÍ CONTESTA: LA D SEMBRADA, NOR-10·4 (§2.4) ↔ CLI-12·6 (§3.5)** (arquitecto, 04/11). Con el prompt de hoy sin
tocar, la misma `preguntarAlJuez`, el mismo script congelado y el mismo criterio.
- **La referencia es EL QUINTO, 12 de 21**: misma ruta, mismo prompt, misma regla congelada. La pregunta es «¿se distingue D del
  quinto en condiciones idénticas?». **NO los 3 de 21 ni el «0 de 21» del §3.5 en la línea base**: son PUBLICADO por el pipeline
  entero, y la tanda es sólo el juez con la pareja delante; compararlos sería el mismo cruce otra vez (Code avisó; el
  arquitecto lo acepta).
- **n = 42, en DOS PULSACIONES DE 21**: 42 llamadas seguidas serían unos 274 s contra el `maxDuration` de 300.
  **LA REGLA DE AGRUPACIÓN, fijada antes**: se juntan LAS 42 respuestas, en orden de pulsación y luego de vez, sin selección; si
  alguna falla, la regla de sustitución ya aprobada (las que falten, de las primeras buenas de la pulsación siguiente).
- **Las cifras, del arquitecto, comprobadas por Code con script** (Fisher exacto bilateral contra 12 de 21; el umbral, buscado
  POR ENCIMA de la proporción del quinto, porque el bilateral también rechaza por abajo; controles: reproduce el 0,0247 de 17
  frente a 9 de 21 y el 0,538 de 12 frente a 9):
  | | afirmable desde | p en el umbral (y uno por debajo) | potencia si D = 90 % | error si D = 12/21 |
  |---|---|---|---|---|
  | n = 21 | 19 de 21 | 0,0325 (0,0855) | **64,8 %** | 0,106 % |
  | n = 42 | **35 de 42** | 0,0337 (0,0699) | **94,6 %** | **0,030 %** |
  Coinciden con las del arquitecto. *Una precisión de Code*: su «D al 76 % → 18,4 %» es con D = 16/21 (76,19 %); con 0,76
  exacto sale 17,7 %. No cambia nada de lo que decide.
- **LA LIMITACIÓN, PRERREGISTRADA** (arquitecto): incluso con 42, una diferencia MODERADA (D en torno al 76 %) sólo se detectaría
  el 18,4 % de las veces. **Esta prueba contesta «¿es D MUCHO más fácil que el quinto?» y NO contesta «¿es algo más fácil?».**
  Basta para lo que decide, porque la afirmación en juego es grande (90 % contra 57 %). **Si D sale en la zona muda, la conclusión
  conservadora —no construir— se mantiene: LA ZONA MUDA CAE DEL LADO SEGURO.**
- **Las predicciones, con nombre, tasa de error y potencia, las escribe el arquitecto ANTES de que el director pulse.** Nada se
  lanza hasta entonces.

**7 · LAS ANCLAS DE D, APROBADAS** (arquitecto, 04/11): las dos que el registro de siembra pone en negrita en la tabla de la D.
- NOR-10 §2.4: **«puede recaer en el propio Director Clínico»**, 42 caracteres (`SIEMBRA_corpus_ampliado.md:99`, y en el pasaje
  literal, la 105).
- CLI-12 §3.5: **«nunca por el Director Clínico del propio centro»**, 47 caracteres (`:100`, y en el pasaje, 115-116).
- **LA ASIMETRÍA CON EL QUINTO ES FORZADA, NO DESCUIDO** (arquitecto, para que nadie lo lea mañana como dejadez): el quinto NO
  ESTÁ SEMBRADO, así que sus anclas sólo podían salir de las citas observadas en la pasada abierta (`FRASES_DEL_QUINTO`, las 7 y 2
  de 9); D sí está sembrada, y las suyas salen del registro. **Las fuentes difieren porque los dos casos difieren en especie.**
  (Code, de paso: dos de las tres del quinto coinciden con la negrita de su registro, `:500`; la de NOR-11 está en la fila sin
  negrita, `:499`.)

**8 · LA HERRAMIENTA, aprobada** (el diff, en el mismo commit que esto): `PAREJA_DE_D` (NOR-10·4 ↔ CLI-12·6), `VECES_DE_D = 21`
por pulsación, `FRASES_DE_D` con las dos anclas; la ruta `d/route.ts`, que es la del quinto con la otra pareja, DUPLICADA a
propósito (factorizar habría tocado un instrumento ya usado, y la carpeta caduca el 15/12); dos botones; y las pruebas (la pareja,
y la negativa dura sobre las dos rutas). `TROZOS.cli12_6` ya existía, con la frase del §3.5.

**9 · EL SCRIPT, HUELLA `866ab31ef2dbd794`, PARA APROBAR** (sustituye a la propuesta `df23ac646e9a4089` y a la intermedia
`8a4c69346650cd10`, que nadie aprobó):
- **El caso D**: las dos anclas de arriba; **n = 42**; **tope 7, derivado como el del quinto**: con 8 ilegibles, los 35 de 42 ya no
  se pueden alcanzar. La salida lo compara con los 12 de 21 del quinto.
- **El caso del §3.1 ya no está en el script**: entrará con su propio nombre cuando toque su recuento, nunca como «D».
- **El quinto sale IDÉNTICO**: sobre la segunda tanda, su salida es igual línea a línea a la de `cea980ddc9356e68`, la aprobada.
- **55 de 55 pruebas**, entre ellas: el principio del §3.1 NO cuenta como D (va al cubo como «una sola de las dos anclas»); 7
  ilegibles de 42 se leen y 8 no; con una pulsación de 21 no se puntúa; las dos pulsaciones se juntan en orden y una fallida se
  repone con la primera buena de la tercera. **Mutantes**: tope 6 y tope 8 rompen 2 pruebas cada uno; n = 41 rompe 4.
- Se cuenta con `CASO=D node contar_quinto.mjs <pulsación 1> <pulsación 2> [<pulsación 3>]`.

```js
// LA REGLA DE CUENTA DEL PASO 3 DE F-130, EN CÓDIGO (Code, 04/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Implementa el criterio del arquitecto (03/11, 21:20) y la regla de reconocimiento que él aprueba antes de pulsar.
// Uso: node contar_quinto.mjs <salida-de-la-tanda.json> …   ·   CASO=D node contar_quinto.mjs <a.json> <b.json>   ·   --pruebas
import { readFileSync } from 'node:fs';

export const ANCLA_NOR11 = 'revisa trimestralmente el cumplimiento';
export const ANCLAS_CLI12 = ['personal ajeno al área auditada', 'no como auditor de su propia área'];

// LOS CASOS (04/11/2026, el recuento de D): LA MISMA REGLA, CON LAS ANCLAS COMO PARÁMETRO. Lo único que cambia de un caso a otro
// son las anclas de cada lado, el tamaño de la tanda, el tope de lo ilegible y los textos de la salida; R1', R2', R3 y R4 son el
// mismo código. Así la comparabilidad entre el quinto y D es ESTRUCTURAL, no una afirmación (arquitecto).
// · quinto: las anclas de FRASES_DEL_QUINTO; 21 respuestas; tope 4 (derivado: la banda A pide 17 de 21).
// · D (corregido el 04/11): LA D DE LA SIEMBRA, NOR-10·4 (§2.4) ↔ CLI-12·6 (§3.5), con las dos anclas que el registro pone en
//   negrita (corpus-pruebas/SIEMBRA_corpus_ampliado.md:99-100). NO la pareja del 36 de 40, que es el permiso contra el principio
//   del §3.1 y no se llama D. 42 respuestas, en DOS PULSACIONES DE 21 (arquitecto, 04/11: 42 llamadas seguidas, unos 274 s contra
//   un maxDuration de 300), juntas en orden de pulsación y luego de vez, sin selección; las fallidas, por la regla de sustitución.
//   Se compara con los 12 de 21 del quinto (Fisher bilateral): afirmable desde 35 de 42. TOPE 7, derivado como el del quinto:
//   con 8 ilegibles, los 35 ya no se pueden alcanzar.
export const CASOS = {
  quinto: {
    nombre: 'el quinto', anclaA: ANCLA_NOR11, anclasB: ANCLAS_CLI12, n: 21, tope: 4,
    ilegible: 'ILEGIBLE POR LA COLUMNA 1: pasa de 4 y la banda A (17 de 21) ya no se puede alcanzar. Se repite la tanda entera, o se aplica el alto si ya es la segunda.',
    referencia: 'se compara con los 9 de 21', col2: 'P-P3-2', col2Puntua: 'puntúa P-P3-2, no afecta a la 1',
    deCaso: 'del quinto', col2NoAfecta: 'No afecta a la columna 1 ni a las bandas.',
  },
  D: {
    nombre: 'D', anclaA: 'puede recaer en el propio Director Clínico', anclasB: ['nunca por el Director Clínico del propio centro'], n: 42, tope: 7,
    ilegible: 'ILEGIBLE POR LA COLUMNA 1: pasa de 7 y los 35 de 42 ya no se pueden alcanzar. El número no se enseña.',
    referencia: 'se compara con los 12 de 21 del quinto', col2: 'LA COLUMNA 2 DE D', col2Puntua: 'no afecta a la 1',
    deCaso: 'de D', col2NoAfecta: 'No afecta a la columna 1.',
  },
};

const plano = s => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
const sinMarcas = s => s.replace(/[*_#>`]/g, '');

// R1' · LAS DOS SECCIONES (endurecida el 04/11 tras la primera tanda, ILEGIBLE). Una cabecera es una LÍNEA que, quitadas las
// marcas y los espacios, EMPIEZA por «PREGUNTA 1» o «PREGUNTA 2» (mayúsculas o no, con o sin espacio). Las menciones en la
// prosa («ya está contada en la pregunta 1») no cuentan. Tiene que haber una de cada, en orden; si no, se prueba la forma
// numerada a principio de línea («1.» o «1)» y «2.» o «2)»). Si tampoco: al tercer cubo, «sin las dos secciones».
export function secciones(texto) {
  const t = sinMarcas(texto);
  const probar = (re1, re2) => {
    const a = [...t.matchAll(re1)], b = [...t.matchAll(re2)];
    if (a.length !== 1 || b.length !== 1 || a[0].index >= b[0].index) return null;
    return { p1: t.slice(a[0].index + a[0][0].length, b[0].index), p2: t.slice(b[0].index + b[0][0].length) };
  };
  return probar(/^[ \t]*pregunta\s*1\b/gim, /^[ \t]*pregunta\s*2\b/gim) ?? probar(/^[ \t]*1[.)]/gm, /^[ \t]*2[.)]/gm);
}

// R2' · EL VEREDICTO de cada sección (endurecida el 04/11). Se recorren sus líneas EN ORDEN hasta la primera que traiga una
// cita (« “ ") o sea una viñeta («- », «• »), y gana la PRIMERA que EMPIECE por una forma de veredicto. En cada línea:
//   · lo que queda de la línea de la cabecera («· EL DATO:») se quita; si la línea trae una pregunta, cuenta lo que va
//     DESPUÉS del último «?» («¿Se pueden cumplir las dos a la vez? No.» → «No.»); y se quitan las etiquetas del principio
//     («Respuesta:», «HAY HALLAZGO:», «Hallazgo:»);
//   · las formas: la primera palabra «sí» o «no» («si» SIN TILDE sólo si va sola o con puntuación: «Si.», «Si,»; suelto es
//     el condicional); y, SÓLO EN LA PREGUNTA 2, la línea que empieza por «no se pueden cumplir» («no») o por «se pueden
//     cumplir» («sí»), que es como el propio prompt invita a contestar;
//   · las líneas sin forma de veredicto (los preámbulos: «Ambos textos son reglas, así que aplica la pregunta…») se saltan.
// La línea elegida va al cubo, en vez de dar veredicto, si su PRIMERA FRASE trae a la vez las palabras «sí» y «no» (salvo
// dentro de la forma «no se pueden cumplir»), o si, EN LA PREGUNTA 2, su veredicto es «sí» y esa primera frase dice
// «hallazgo» («Sí, hay hallazgo»: la polaridad al revés; el seguro va en la dirección conservadora). Sin ninguna línea así antes de la primera cita o viñeta: «veredicto sin
// decidir». NO CAMBIA QUÉ CUENTA COMO HALLAZGO (la 1 en «sí», la 2 en «no»): sólo reconoce las formas de decirlo.
const SI = /(^|[^\p{L}])sí([^\p{L}]|$)/iu, NO = /(^|[^\p{L}])no([^\p{L}]|$)/iu;
export function veredicto(seccion, pregunta = 1) {
  const lineas = seccion.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const cruda = lineas[i];
    if (/^\s*([-•]\s)/.test(cruda)) return null;
    let l = (i === 0 ? cruda.replace(/^[\s·:.\-–—]*(el dato|el cumplimiento)?[\s·:.\-–—]*/i, '') : cruda).trim();
    if (l.includes('?')) l = l.slice(l.lastIndexOf('?') + 1).trim();
    l = l.replace(/^((respuesta|hay hallazgo|hallazgo)\s*:\s*)+/i, '').trim();
    if (l === '') { if (/[«“"]/.test(cruda)) return null; continue; }
    let v = null, frase = false;
    if (pregunta === 2 && /^no se pueden cumplir/i.test(l)) { v = 'no'; frase = true; }
    else if (pregunta === 2 && /^(s[ií][,\s]+)?se pueden cumplir/i.test(l)) { v = 'sí'; frase = true; }
    else if (/^sí([^\p{L}]|$)/iu.test(l) || /^si([.,;:!]|$)/i.test(l)) v = 'sí';
    else if (/^no([^\p{L}]|$)/iu.test(l)) v = 'no';
    if (v === null) { if (/[«“"]/.test(cruda)) return null; continue; }
    // las dos comprobaciones, sobre la PRIMERA FRASE de la línea (hasta el primer «.», «:» o «;» seguido de espacio): el
    // veredicto es esa frase, y lo que venga detrás en la misma línea («Sí. No hay ninguna frase…») ya es razonamiento
    const primera = l.split(/(?<=[.:;])\s/)[0];
    const resto = frase && v === 'no' ? primera.replace(/^no se pueden cumplir/i, '') : primera;
    if (SI.test(resto) && NO.test(resto)) return null;
    if (pregunta === 2 && v === 'sí' && /hallazgo/i.test(primera)) return null;
    return v;
  }
  return null;
}

// R3 · LAS CITAS: los tramos entre «…», “…” o "…" de la sección. Se contrastan con las anclas en minúsculas y con los espacios
// colapsados; una cita casa con un ancla si la contiene entera.
export function citas(seccion) {
  return [...seccion.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => plano(m[1] ?? m[2] ?? m[3] ?? ''));
}
function anclasDe(seccion, caso = CASOS.quinto) {
  const c = citas(seccion), p = plano(seccion), A = plano(caso.anclaA), B = caso.anclasB.map(plano);
  const nor = c.some(x => x.includes(A)), cli = c.some(x => B.some(a => x.includes(a)));
  const fueraNor = !nor && p.includes(A), fueraCli = !cli && B.some(a => p.includes(a));
  return { nor, cli, fueraNor, fueraCli };
}

// R4 · LA CUENTA (columna 1 y columna 2, con el tope corregido por el arquitecto el 04/11). «Hallazgo afirmado» = la 1 en
// «sí», o la 2 en «no»; da EL QUINTO si su sección trae, ENTRE COMILLAS, una cita con el ancla de NOR-11 y otra con una de las
// dos de CLI-12. LA COLUMNA 1 ES LEGIBLE cuando se da una de estas tres:
//   (a) la pregunta 1 decide «sí» y trae las dos anclas → el quinto salió;
//   (b) la pregunta 2 decide «no se pueden cumplir» y trae las dos anclas → el quinto salió;
//   (c) la pregunta 1 decide «no» Y la pregunta 2 decide «sí se pueden cumplir» → el quinto no salió.
// Es ILEGIBLE en cualquier otro caso, y SÓLO las ilegibles van a `cubo1`, que es lo que cuenta para el tope de 4. Su motivo, por
// pregunta: veredicto sin decidir; hallazgo con una sola de las dos anclas; con un ancla fuera de comillas; o sin las anclas
// del quinto. Las anclas colgando de un «no hay hallazgo» no cuentan: eso es (c).
// LA COLUMNA 2, ¿por qué pregunta salió el quinto?: la 1, la 2, las dos, o «sin decidir» si la otra pregunta no se puede leer.
// Y `cubo2` es la lista de las respuestas con la PREGUNTA 2 SIN DECIDIR, con su propio tope (resumen, abajo).
export function contar(respuesta, caso = CASOS.quinto) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { quinto: null, cubo1: ['sin respuesta'], cubo2: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { quinto: null, cubo1: ['sin las dos secciones'], cubo2: ['sin las dos secciones'] };
  const v1 = veredicto(s.p1, 1), v2 = veredicto(s.p2, 2);
  const an1 = anclasDe(s.p1, caso), an2 = anclasDe(s.p2, caso);
  const a = v1 === 'sí' && an1.nor && an1.cli, b = v2 === 'no' && an2.nor && an2.cli, c = v1 === 'no' && v2 === 'sí';
  const cubo2 = v2 === null ? ['pregunta 2: veredicto sin decidir'] : [];
  if (a || b) {
    const porPregunta = a && b ? 'las dos' : a ? (v2 === null ? 'sin decidir' : 'la 1') : (v1 === null ? 'sin decidir' : 'la 2');
    return { quinto: true, porPregunta, cubo1: [], cubo2 };
  }
  if (c) return { quinto: false, cubo1: [], cubo2 };
  const cubo1 = [];
  for (const [n, v, an, afirma] of [[1, v1, an1, 'sí'], [2, v2, an2, 'no']]) {
    if (v === null) { cubo1.push(`pregunta ${n}: veredicto sin decidir`); continue; }
    if (v !== afirma) continue;
    if (an.fueraNor || an.fueraCli) cubo1.push(`pregunta ${n}: hallazgo con un ancla fuera de comillas`);
    else if (an.nor || an.cli) cubo1.push(`pregunta ${n}: hallazgo con una sola de las dos anclas`);
    else cubo1.push(`pregunta ${n}: hallazgo sin las anclas ${caso.deCaso}`);
  }
  return { quinto: null, cubo1, cubo2 };
}

// LOS TRES PRERREGISTROS DEL ARQUITECTO (04/11), antes de la tanda, Y EL TOPE CORREGIDO:
// P1 · UNA LLAMADA FALLIDA NO ES UN «NO»: no es un veredicto y no va a ningún cubo. La tanda es puntuable SÓLO con 21
//      respuestas buenas; las que falten se completan con las primeras buenas de la pulsación siguiente, y así sucesivamente,
//      por orden de vez. Se escribe cuántas fallaron.
// P2 · EL TOPE DE 4 ES DE LA COLUMNA 1: la banda A pide 17 de 21. CORREGIDO (arquitecto, 04/11): cuenta sólo las respuestas cuya
//      COLUMNA 1 es ilegible, no cualquier cosa que no se sepa leer. Por encima, las bandas son ILEGIBLES y se repite la tanda.
// P2b · LA COLUMNA 2 TIENE SU PROPIO TOPE: las respuestas con la pregunta 2 sin decidir van a una lista nombrada; si pasan de 4,
//      P-P3-2 se informa como NO PUNTUABLE con su cuenta. No afecta a la columna 1 ni a las bandas.
// P3 · LO ILEGIBLE SE ENSEÑA ANTES DEL NÚMERO: primero las fallidas, luego la columna 1 ilegible con su motivo, y el número sólo
//      si cabe en 4; después, la lista de la pregunta 2 y la columna 2.
export const N_TANDA = 21;
export const CUBO_MAXIMO = 4;
const fallida = r => !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';

export function resumen(pulsaciones, caso = CASOS.quinto) {
  const N = caso.n, TOPE = caso.tope;
  const buenas = [], fallidas = [];
  pulsaciones.forEach((respuestas, p) => respuestas.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    if (fallida(r)) { if (buenas.length < N) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`); }
    else if (buenas.length < N) buenas.push({ id, ...contar(r, caso) });
  }));
  const salida = [`1 · LAS FALLIDAS: ${fallidas.length}${fallidas.length ? ' — ' + fallidas.join(' · ') : ''}`];
  if (buenas.length < N) {
    salida.push(`NO PUNTUABLE TODAVÍA: ${buenas.length} respuestas buenas de ${N}. Se pulsa otra vez y las que faltan salen de la siguiente.`);
    return salida;
  }
  const ilegibles = buenas.filter(f => f.cubo1.length > 0);
  salida.push(`2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de ${TOPE}): ${ilegibles.length} de ${N}${ilegibles.length ? ' — ' + ilegibles.map(f => `${f.id}: ${f.cubo1.join('; ')}`).join(' · ') : ''}`);
  if (ilegibles.length > TOPE) {
    salida.push(caso.ilegible);
    return salida;
  }
  const limpias = buenas.filter(f => f.quinto === true);
  salida.push(`3 · COLUMNA 1, ¿salió ${caso.nombre}?: ${limpias.length} de ${N} (${caso.referencia})`);
  const sinLa2 = buenas.filter(f => f.cubo2.length > 0);
  salida.push(`4 · LA PREGUNTA 2 SIN DECIDIR (su tope, ${TOPE}): ${sinLa2.length} de ${N}${sinLa2.length ? ' — ' + sinLa2.map(f => `${f.id}: ${f.cubo2.join('; ')}`).join(' · ') : ''}`);
  if (sinLa2.length > TOPE) salida.push(`5 · ${caso.col2}: NO PUNTUABLE (${sinLa2.length} de ${N} con la pregunta 2 sin decidir). ${caso.col2NoAfecta}`);
  else salida.push(`5 · COLUMNA 2, ¿por qué pregunta? (${caso.col2Puntua}): ` +
    ['la 1', 'la 2', 'las dos', 'sin decidir'].map(k => `${k}: ${limpias.filter(f => f.porPregunta === k).length}`).join(' · '));
  return salida;
}

// LAS PRUEBAS, sobre respuestas INVENTADAS antes de la tanda: los casos que la regla tiene que decidir, y las trampas
const R = (vez, respuesta) => ({ vez, respuesta });
const N = '«El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos»';
const C1 = '«Las auditorías internas las realiza siempre personal ajeno al área auditada»';
const C2 = '«participa en la auditoría como interlocutor, pero no como auditor de su propia área»';
const PRUEBAS = [
  ['(a) el quinto por la 1', R(1, `PREGUNTA 1 · EL DATO\nSí.\nTexto 1: ${N}\nTexto 2: ${C1}\n\nPREGUNTA 2 · EL CUMPLIMIENTO\nSí, se pueden cumplir.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['(a) con la otra frase de CLI-12 y la cabecera en negrita', R(2, `**Pregunta 1:** Sí\n${N} / ${C2}\n**Pregunta 2:** Sí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['(b) el quinto por la 2 (hace fallar P-P3-2)', R(3, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo. ${N} ${C1} norma_contra_norma`), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
  ['(a) y (b): el quinto por las dos', R(4, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nNo. ${N} ${C2} norma_contra_norma`), { quinto: true, porPregunta: 'las dos', cubo1: [], cubo2: [] }],
  ['(c) no salió: sin hallazgo en ninguna', R(5, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), { quinto: false, cubo1: [], cubo2: [] }],
  ['TRAMPA: las anclas colgando de un «no» son (c)', R(6, `PREGUNTA 1\nNo, ${N} y ${C1} no hablan del mismo dato.\nPREGUNTA 2\nSí.`), { quinto: false, cubo1: [], cubo2: [] }],
  ['TRAMPA: el «no» de «no como auditor» dentro de una cita, en la segunda línea', R(7, `PREGUNTA 1\nSí.\n${N}\n${C2}\nPREGUNTA 2\nSí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['ilegible: «sí» y «no» en la misma primera frase', R(8, 'PREGUNTA 1\nNo es exactamente el mismo dato, pero sí hay diferencia.\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: veredicto sin decidir'], cubo2: [] }],
  ['ilegible: una sola de las dos anclas', R(9, `PREGUNTA 1\nSí. ${N} «El sistema de calidad se apoya en un calendario anual»\nPREGUNTA 2\nSí.`), { quinto: null, cubo1: ['pregunta 1: hallazgo con una sola de las dos anclas'], cubo2: [] }],
  ['ilegible: un ancla fuera de comillas', R(10, `PREGUNTA 1\nSí.\nNOR-11 dice que el Coordinador revisa trimestralmente el cumplimiento; CLI-12: ${C1}\nPREGUNTA 2\nSí.`), { quinto: null, cubo1: ['pregunta 1: hallazgo con un ancla fuera de comillas'], cubo2: [] }],
  ['ilegible: otro hallazgo, sin las anclas', R(11, 'PREGUNTA 1\nSí. «Se distinguen auditorías de proceso» «contenedor de los grupos III o IV»\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: hallazgo sin las anclas del quinto'], cubo2: [] }],
  ['ilegible en las dos: sin las dos secciones', R(12, `Sí, hay contradicción: ${N} ${C1}`), { quinto: null, cubo1: ['sin las dos secciones'], cubo2: ['sin las dos secciones'] }],
  ['sin respuesta (no llega al resumen: es una fallida)', { vez: 13, error: 'HTTP 529' }, { quinto: null, cubo1: ['sin respuesta'], cubo2: ['sin respuesta'] }],
  ['EL TOPE CORREGIDO: (a) con la 2 sin decidir es LEGIBLE en la columna 1, y va sólo a la lista de la 2', R(14, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`), { quinto: true, porPregunta: 'sin decidir', cubo1: [], cubo2: ['pregunta 2: veredicto sin decidir'] }],
  ['la forma numerada, si no hay cabeceras', R(15, `1. Sí. ${N} ${C1}\n2. Sí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['«si» sin tilde cuenta como «sí»', R(16, `PREGUNTA 1\nSi.\n${N} ${C1}\nPREGUNTA 2\nSi.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['«No obstante, sí»: ilegible', R(17, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), { quinto: null, cubo1: ['pregunta 1: veredicto sin decidir'], cubo2: [] }],
  ['TRAMPA: «Si» condicional no es un «sí»; con la 1 en «no», la columna 1 es ilegible', R(18, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSi se hace lo que una permite, la otra se cumple igual.'), { quinto: null, cubo1: ['pregunta 2: veredicto sin decidir'], cubo2: ['pregunta 2: veredicto sin decidir'] }],
  ['TRAMPA: el modelo repite la pregunta antes de contestar', R(19, `PREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nSí.\n${N} ${C1}\nPREGUNTA 2 · EL CUMPLIMIENTO\n¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?\nSí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['EL SEGURO DE POLARIDAD: la 1 en «no» y la 2 en «Sí, hay hallazgo» → ilegible en las dos', R(20, `PREGUNTA 1\nNo.\nPREGUNTA 2\nSí, hay hallazgo. ${N} ${C1} No se pueden cumplir.`), { quinto: null, cubo1: ['pregunta 2: veredicto sin decidir'], cubo2: ['pregunta 2: veredicto sin decidir'] }],
];

// LAS PRUEBAS DEL RESUMEN: los prerregistros y los dos topes
const bien = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nSí.`);
const nada = v => R(v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.');
const raro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.');
const sinLa2 = v => R(v, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nDepende de cómo se lea.`);
const caida = v => ({ vez: v, error: 'HTTP 529' });
const veces = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1));
const COL2 = (a, b, c, d) => `5 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: ${a} · la 2: ${b} · las dos: ${c} · sin decidir: ${d}`;
const ILEG = (desde, n) => veces(n, v => `pulsación 1, vez ${desde + v}: pregunta 1: veredicto sin decidir`).join(' · ');
const SIN2 = (desde, n) => veces(n, v => `pulsación 1, vez ${desde + v}: pregunta 2: veredicto sin decidir`).join(' · ');
const PRUEBAS_DEL_RESUMEN = [
  ['P1: dos fallidas y sin segunda pulsación → no puntuable', [[...veces(19, bien), caida(20), caida(21)]],
    ['1 · LAS FALLIDAS: 2 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529', 'NO PUNTUABLE TODAVÍA: 19 respuestas buenas de 21. Se pulsa otra vez y las que faltan salen de la siguiente.']],
  ['P1: las que faltan, de las PRIMERAS buenas de la pulsación siguiente (la vez 1 cae y se salta)', [[...veces(19, bien), caida(20), caida(21)], [caida(1), nada(2), nada(3), bien(4)]],
    ['1 · LAS FALLIDAS: 3 — pulsación 1, vez 20: HTTP 529 · pulsación 1, vez 21: HTTP 529 · pulsación 2, vez 1: HTTP 529', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 19 de 21 (se compara con los 9 de 21)', '4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 0 de 21', COL2(19, 0, 0, 0)]],
  ['P2 y P3: la columna 1 ilegible en 4 → se lee, y lo ilegible va antes del número', [[...veces(17, bien), ...veces(4, v => raro(17 + v))]],
    ['1 · LAS FALLIDAS: 0', `2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 4 de 21 — ${ILEG(17, 4)}`, '3 · COLUMNA 1, ¿salió el quinto?: 17 de 21 (se compara con los 9 de 21)', '4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 0 de 21', COL2(17, 0, 0, 0)]],
  ['P2: la columna 1 ilegible en 5 → ILEGIBLE, y el número NO se enseña', [[...veces(16, bien), ...veces(5, v => raro(16 + v))]],
    ['1 · LAS FALLIDAS: 0', `2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 5 de 21 — ${ILEG(16, 5)}`, 'ILEGIBLE POR LA COLUMNA 1: pasa de 4 y la banda A (17 de 21) ya no se puede alcanzar. Se repite la tanda entera, o se aplica el alto si ya es la segunda.']],
  ['EL TOPE CORREGIDO: 5 con la 2 sin decidir y la 1 en (a) → la columna 1 se lee; P-P3-2, NO PUNTUABLE', [[...veces(16, bien), ...veces(5, v => sinLa2(16 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 21 de 21 (se compara con los 9 de 21)', `4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 5 de 21 — ${SIN2(16, 5)}`, '5 · P-P3-2: NO PUNTUABLE (5 de 21 con la pregunta 2 sin decidir). No afecta a la columna 1 ni a las bandas.']],
  ['la lista de la 2 en 4 → la columna 2 se puntúa, con las 4 como «sin decidir»', [[...veces(17, bien), ...veces(4, v => sinLa2(17 + v))]],
    ['1 · LAS FALLIDAS: 0', '2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 0 de 21', '3 · COLUMNA 1, ¿salió el quinto?: 21 de 21 (se compara con los 9 de 21)', `4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 4 de 21 — ${SIN2(17, 4)}`, COL2(17, 0, 0, 4)]],
];

if (process.argv[2] === '--pruebas') {
  let mal = 0;
  for (const [nombre, r, esperado] of PRUEBAS) {
    const sale = contar(r);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  for (const [nombre, pulsaciones, esperado] of PRUEBAS_DEL_RESUMEN) {
    const sale = resumen(pulsaciones);
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale, null, 1)}\n      debía ${JSON.stringify(esperado, null, 1)}`}`);
  }
  // LAS PRUEBAS DEL CASO D, sobre respuestas INVENTADAS (no se ha leído ninguna de las 40 de D): sus anclas cuentan, las del
  // quinto no, ni el principio del §3.1; el tope es 7 de 42, y las dos pulsaciones se juntan en orden
  const ND = '«figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»';
  const CD = '«sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro»';
  const CP = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que gestiona la agenda»';
  const dBien = v => R(v, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. ${ND} ${CD} norma_contra_norma`);
  const dRaro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.');
  const PRUEBAS_DE_D = [
    ['D por la 2, con sus dos anclas', () => contar(dBien(1), CASOS.D), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
    ['las anclas del QUINTO no cuentan como D', () => contar(R(2, `PREGUNTA 1\nSí. ${N} ${C1}\nPREGUNTA 2\nSí.`), CASOS.D), { quinto: null, cubo1: ['pregunta 1: hallazgo sin las anclas de D'], cubo2: [] }],
    ['y las de D no cuentan como el quinto', () => contar(dBien(3)), { quinto: null, cubo1: ['pregunta 2: hallazgo sin las anclas del quinto'], cubo2: [] }],
    ['TRAMPA: el principio del §3.1 (la pareja del 36 de 40) NO cuenta como D', () => contar(R(4, `PREGUNTA 1
No.
PREGUNTA 2
No se pueden cumplir. ${ND} ${CP} norma_contra_norma`), CASOS.D), { quinto: null, cubo1: ['pregunta 2: hallazgo con una sola de las dos anclas'], cubo2: [] }],
    ['D: 7 ilegibles de 42 → se lee', () => resumen([[...veces(21, dBien)], [...veces(14, dBien), ...veces(7, v => dRaro(14 + v))]], CASOS.D).slice(2, 3),
      ['3 · COLUMNA 1, ¿salió D?: 35 de 42 (se compara con los 12 de 21 del quinto)']],
    ['D: 8 ilegibles de 42 → ILEGIBLE, sin número', () => resumen([[...veces(21, dBien)], [...veces(13, dBien), ...veces(8, v => dRaro(13 + v))]], CASOS.D).slice(2),
      ['ILEGIBLE POR LA COLUMNA 1: pasa de 7 y los 35 de 42 ya no se pueden alcanzar. El número no se enseña.']],
    ['D: con UNA pulsación de 21 no se puntúa', () => resumen([[...veces(21, dBien)]], CASOS.D),
      ['1 · LAS FALLIDAS: 0', 'NO PUNTUABLE TODAVÍA: 21 respuestas buenas de 42. Se pulsa otra vez y las que faltan salen de la siguiente.']],
    ['D: las dos pulsaciones se juntan en orden, y una fallida se repone con la primera buena de la tercera', () => resumen([[...veces(20, dBien), caida(21)], [...veces(21, v => dRaro(v))], [nada(1), bien(2)]], CASOS.D).slice(0, 2),
      ['1 · LAS FALLIDAS: 1 — pulsación 1, vez 21: HTTP 529', `2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 7): 21 de 42 — ${veces(21, v => `pulsación 2, vez ${v}: pregunta 1: veredicto sin decidir`).join(' · ')}`]],
  ];
  for (const [nombre, f, esperado] of PRUEBAS_DE_D) {
    const sale = f();
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  // LAS PRUEBAS DE FORMATO sobre las 21 respuestas de la PRIMERA TANDA (ILEGIBLE, 04/11), condición 1 del arquitecto:
  // PARSEAR SÍ, CONTAR NO. Sólo se comprueba SI la regla encuentra las dos secciones y SI decide un veredicto en cada
  // pregunta, nunca CUÁL, ni las anclas, ni el quinto; y no se imprime nada de eso. Lo esperado, escrito por formato antes de
  // pasar la regla: las 21 con sus dos secciones y la pregunta 1 decidida; la 2 sin decidir sólo en la 3 y la 9 («Sí, hay
  // hallazgo»: la polaridad al revés, al cubo a propósito), la 11 («sin hallazgo independiente») y la 13 (el veredicto, al
  // final y detrás de las viñetas).
  const vieja = JSON.parse(readFileSync(new URL('./tanda_quinto_1.json', import.meta.url), 'utf8')).respuestas;
  const sinDecidirLa2 = [3, 9, 11, 13];
  let malFormato = 0;
  for (const r of vieja) {
    const s = secciones(r.respuesta);
    const esperado = { secciones: true, decideLa1: true, decideLa2: !sinDecidirLa2.includes(r.vez) };
    const sale = { secciones: !!s, decideLa1: !!s && veredicto(s.p1, 1) !== null, decideLa2: !!s && veredicto(s.p2, 2) !== null };
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) { mal++; malFormato++; }
    if (!ok) console.log(`MAL · formato de la vez ${r.vez}: sale ${JSON.stringify(sale)}, se esperaba ${JSON.stringify(esperado)}`);
  }
  console.log(`formato de la primera tanda: ${vieja.length - malFormato} de ${vieja.length} como se esperaba`);
  const total = PRUEBAS.length + PRUEBAS_DEL_RESUMEN.length + PRUEBAS_DE_D.length + vieja.length;
  console.log(`${total - mal} de ${total}`);
  process.exit(mal ? 1 : 0);
} else if (process.argv[2]) {
  // una o varias pulsaciones, en orden: node contar_quinto.mjs pulsacion1.json [pulsacion2.json …]
  const pulsaciones = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas);
  // el caso, por la variable CASO (quinto, por defecto, o D); uno que no exista se niega en vez de contar con el del quinto
  const caso = CASOS[process.env.CASO ?? 'quinto'];
  if (!caso) { console.log(`NO SE CUENTA: el caso «${process.env.CASO}» no existe (hay: ${Object.keys(CASOS).join(', ')})`); process.exit(1); }
  console.log(`caso: ${caso.nombre} · anclas: «${caso.anclaA}» / ${caso.anclasB.map(a => `«${a}»`).join(' o ')} · n = ${caso.n} · tope = ${caso.tope}`);
  console.log(resumen(pulsaciones, caso).join('\n'));
}
```

El cálculo de las cifras del punto 6, para que se pueda repetir:

```js
// Herramienta de un solo uso (04/11): comprueba las cifras del arquitecto para la tanda de D contra los 12 de 21 del quinto.
// El umbral se busca POR ENCIMA de la proporción del quinto (el bilateral también rechaza por abajo). Fisher exacto, bilateral (suma de las tablas con probabilidad <= la observada) y unilateral (D mayor), con los márgenes fijos.
const lf = (() => { const t = [0]; for (let i = 1; i <= 200; i++) t[i] = t[i - 1] + Math.log(i); return n => t[n]; })();
const hip = (a, r1, c1, n) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(a) - lf(r1 - a) - lf(c1 - a) - lf(n - r1 - c1 + a));
function fisher(a, n1, b, n2) { // a de n1 (D) frente a b de n2 (quinto)
  const c1 = a + b, n = n1 + n2, lo = Math.max(0, c1 - n2), hi = Math.min(n1, c1), p0 = hip(a, n1, c1, n);
  let dos = 0, una = 0;
  for (let x = lo; x <= hi; x++) { const p = hip(x, n1, c1, n); if (p <= p0 * (1 + 1e-7)) dos += p; if (x >= a) una += p; }
  return { dos, una };
}
const binom = (k, n, p) => Math.exp(lf(n) - lf(k) - lf(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
for (const n of [21, 42]) for (const lado of ['dos', 'una']) {
  let k0 = null; for (let k = Math.ceil(n * 12 / 21); k <= n; k++) { if (fisher(k, n, 12, 21)[lado] < 0.05) { k0 = k; break; } }
  // ¿es un umbral (todos los k >= k0 significativos)?
  let todos = true; for (let k = k0; k <= n; k++) if (fisher(k, n, 12, 21)[lado] >= 0.05) todos = false;
  const pot = p => { let s = 0; for (let k = k0; k <= n; k++) s += binom(k, n, p); return s; };
  console.log(`n=${n} · ${lado === 'dos' ? 'bilateral' : 'unilateral'}: afirmable desde ${k0}/${n} (umbral monótono: ${todos}) · p en el umbral ${fisher(k0, n, 12, 21)[lado].toFixed(4)} y uno por debajo ${fisher(k0 - 1, n, 12, 21)[lado].toFixed(4)} · potencia si D=90 %: ${(100 * pot(0.9)).toFixed(1)} % · si D=76 %: ${(100 * pot(0.76)).toFixed(1)} % · error si D=12/21: ${(100 * pot(12 / 21)).toFixed(3)} %`);
}
console.log('control: 17 de 21 frente a 9 de 21, bilateral', fisher(17, 21, 9, 21).dos.toFixed(4), '(archivado 0,0247)');
console.log('control: 12 de 21 frente a 9 de 21, bilateral', fisher(12, 21, 9, 21).dos.toFixed(3), '(archivado 0,538)');
// el 18,4 % del arquitecto para «D al 76 %»: ¿con 0,76 o con 16/21 = 0,7619?
{ let s = 0; for (let k = 35; k <= 42; k++) s += binom(k, 42, 16 / 21); console.log('n=42 bilateral, D = 16/21:', (100 * s).toFixed(1), '%'); }
```
