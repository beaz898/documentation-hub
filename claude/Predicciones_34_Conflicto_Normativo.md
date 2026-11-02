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
  herramienta sin puerta ni verificador. El 90 % es un techo.
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
  cerrada, y eso NO ESTÁ MEDIDO**: lo mide el paso 3 del plan. Si estuviera al 90 % como D, el acuerdo saldría 19 de 20 y
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

**La predicción del arquitecto, literal:** «EL CAMBIO DEL VERIFICADOR NO PUEDE MOVER A D CASI NADA, y el motivo está
medido — de las 21 pasadas de D, 17 son negativos limpios donde el juez no emitió nada y el verificador no tuvo nada que
salvar; sólo 1 tuvo una muerte sin texto. ASÍ QUE: D entre 3 y 4 de 21. El quinto, que tiene 4 muertes sin texto de 13,
entre 5 y 9 de 13.»
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
