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
VEZ: 6 de 7, el 29/10 *(Code escribió «28/10»; corregido el 05/11)*, con el prompt de la «línea ancha», y no se repitió** (`Medida_F130_E3_Y_Vecindad_29-10-2026.md:31, 91`).
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

*(Code, 05/11: la marca se deja literal, pero su «28/10» viene de Code y está mal: el 6 de 7 del §3.5 es del **29/10 a las 12:05
UTC** («cuando» de `Medida_F130_E3_Primera_Tanda_29-10-2026.json`). Y su «otro prompt» ya llevaba el bloque del principio: corrió
con `a58deaf8`, del 29/10 a las 00:33.)*

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

**6 · LA TANDA QUE SÍ CONTESTA: LA D SEMBRADA, NOR-10·4 (§2.4) ↔ CLI-12·6 (§3.5)** (arquitecto, 04/11). ⚠️ **SUSTITUIDO, NO BORRADO, el 06/11/2026** por «X · EL PRERREGISTRO NUEVO DE LA TANDA DE D», al final de este fichero. Motivo (arquitecto): X cambia la regla, la referencia y las bandas. Ya no hay comparación con el quinto: es una prueba de umbral, el 40 % contra el 70 %, con un solo corte en 24. Con el prompt de hoy sin
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

## LAS PREDICCIONES DE D, LA D SEMBRADA (arquitecto, 04/11/2026, ANTES de lanzar: «19:05», derivada por él de la cabecera del mensaje del director; 19:03 en el reloj de Code al archivarlas, con `date`)

**La huella `866ab31ef2dbd794`, APROBADA** (arquitecto, 04/11). Y la precisión del 17,7 %, anotada por él: había usado 16/21 = 76,19 %.
**En el proyecto de Claude (no en el repositorio; Code no lo ha visto)**, el arquitecto dice haber marcado la frase de la semana 0
con la redacción de arriba, y haber añadido: la definición del E5 en el paso 5, la nota de que la D sembrada tiene 0 de 21 en esa
línea base, el afilado del glosario con el §6.1, y una sección 7 con las trece retiradas de estos dos días y la regla que sale de ellas.

Literal, como lo pegó el director (a Code primero):

> CONDICIONES: 42 pasadas en dos pulsaciones de 21, pareja NOR-10·4 (§2.4) ↔ CLI-12·6 (§3.5), los dos trozos enteros, prompt sin tocar, script de huella 866ab31ef2dbd794, tope del cubo 7.
> REFERENCIA: el quinto, 12 de 21, congelado. Mismas condiciones. NO la base del producto (0 de 21): eso es publicado por el pipeline entero y repetiría el cruce.
>
> LAS BANDAS, derivadas de Fisher contra 12/21 y no elegidas:
>   ALTA  · D >= 35 de 42 (>=83,3 %) · afirmable que D es MÁS FÁCIL que el quinto
>   MUDA  · D de 12 a 34             · no se distingue del quinto
>   BAJA  · D <= 11 de 42 (<=26,2 %) · afirmable que D es MÁS DIFÍCIL
>
>   banda      D igual al quinto    D al 90 %    D al 85,7 %    D al 70 %
>   ALTA              0,0 %           94,6 %         75,5 %        3,8 %
>   MUDA            100,0 %            5,4 %         24,5 %       96,2 %
>   BAJA              0,0 %            0,0 %          0,0 %        0,0 %
>
> P-D-1 · EL NÚMERO: banda ALTA, 35 o más de 42.
> Tasa de error 0,0 % · potencia 94,6 % si D está al 90 %, 75,5 % si está al 85,7 %.
> EL MECANISMO, y es DISTINTO del que me falló con el quinto: el escape de D es más estrecho. El §3.5 dice «nunca por el Director Clínico del propio centro» —categórico, nombrando a la persona— y da su razón, «para mantener la separación de funciones». Su único escape es leer el §3.5 como si hablara sólo de sustituciones temporales, y eso exige ignorar el principio que él mismo enuncia. El escape del quinto es mucho más ancho: los textos NUNCA dicen que una revisión sea una auditoría, y el §6.1 sólo lo decide a medias.
> Y lo digo con el antecedente delante: predije la banda alta para el quinto y FALLÉ. Vuelvo a predecirla para D por otro motivo. SI FALLO DOS VECES, ESO ES EL HALLAZGO, y va escrito abajo.
>
> P-D-2 · LA PREGUNTA: el hallazgo sale predominantemente por la PREGUNTA 2. D es un caso de cumplimiento —una permisión contra un principio—, así que la 2 es su ruta. Si sale predominantemente por la 1, la taxonomía de la casa está mal.
> LIMITACIÓN: no hay contrapartida medida en el quinto, porque su columna 2 salió NO PUNTUABLE. Esta predicción se puntúa sola.
>
> P-D-3 · LA ETIQUETA: cuando D salga, lleva `norma_contra_norma`. Es lo correcto: D ES un conflicto normativo, al contrario que el quinto, donde no poner etiqueta era el acierto.
>
> P-D-4 · EL CUBO: cabe en 7 de 42. Motivo: la regla endurecida ya cubre los formatos que rompieron la primera tanda del quinto.
>
> LA LECTURA SI P-D-1 FALLA, prerregistrada para que nadie la reinterprete después:
> «Si D cae en la banda MUDA, entonces D y el quinto NO SE DISTINGUEN en condiciones idénticas, con una potencia del 94,6 % para haber visto la diferencia si D estuviera al 90 %. Eso significa: (1) la afirmación "son dos fronteras y no una clase" de la semana 0 §3 hay que reescribirla; (2) LA PASADA 2 NO TIENE BENEFICIARIO MEDIDO, porque sus dos únicos candidatos serían la misma enfermedad y la decisión del 01/11 los cubre a los dos; (3) y la conclusión "está en preguntar" se queda sin apoyo para D, no sólo sin demostrar.»
>
> Y LA LIMITACIÓN DEL DISEÑO, también prerregistrada: con 42 pasadas, una diferencia MODERADA (D al 76 %) sólo se detectaría el 17,7 % de las veces. Esta prueba contesta «¿es D MUCHO más fácil?» y no «¿es algo más fácil?». LA ZONA MUDA CAE DEL LADO SEGURO: si no se ve la diferencia, no se construye.

**COMPROBADO POR CODE, con script, antes de archivar** (Fisher exacto bilateral contra 12 de 21; el cálculo, abajo):
- **Las tres bandas, exactas**: significativo de 35 a 42 y de 0 a 11 (p = 0,0258 en 11; en 12, p = 0,0525, ya no). La MUDA es de 12 a 34.
- **La tabla, exacta tras redondear**, con dos ceros que no lo son: con D igual al quinto, la ALTA sale el **0,030 %** (la tasa de
  error de P-D-1; «0,0 %» es el redondeo) y la BAJA el **0,0047 %**. El resto: al 90 %, 94,608 / 5,392 / 0,0000; al 85,7 % (18/21),
  75,528 / 24,472 / 0,0000; al 70 %, 3,784 / 96,216 / 0,0000. Y con D al 76 % exacto, la ALTA sale el 17,659 %.
- **Lo que la tabla no lleva, y no hace falta**: con D por debajo del quinto, la BAJA tendría potencia; ninguna de las cuatro
  columnas mira ahí, y ninguna predicción tampoco.
- **Para puntuar**: el número, la columna 2 y el cubo los da el script de huella `866ab31ef2dbd794`. La ETIQUETA (P-D-3) no la
  cuenta el script: se cuenta aparte, sobre las respuestas que el script dé como D, y con la regla escrita antes de leerlas.

**EL ORDEN** (arquitecto): primero el ENSAYO de D (`d?ensayo=1`, sin modelo); el director pega la salida a Code, y Code comprueba las
dos frases guardadas antes de pasársela al arquitecto; después, las dos tandas de 21.

```js
// Herramienta de un solo uso (04/11): comprueba la tabla de bandas de las predicciones de D (Fisher bilateral contra 12 de 21).
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./potencia_d.mjs', import.meta.url), 'utf8').split('\nfor (const n')[0];
const { fisher, binom } = await import('data:text/javascript,' + encodeURIComponent(src + '\nexport { fisher, binom };'));
const n = 42, sig = k => fisher(k, n, 12, 21).dos < 0.05;
const alta = []; const baja = [];
for (let k = 0; k <= n; k++) if (sig(k)) (k > n * 12 / 21 ? alta : baja).push(k);
console.log('ALTA:', alta[0], '..', alta.at(-1), '· BAJA:', baja[0], '..', baja.at(-1), '· p en 11:', fisher(11, n, 12, 21).dos.toFixed(4), '· p en 12:', fisher(12, n, 12, 21).dos.toFixed(4));
const P = (p, ks) => ks.reduce((s, k) => s + binom(k, n, p), 0);
const muda = Array.from({ length: n + 1 }, (_, k) => k).filter(k => !sig(k));
for (const [nom, p] of [['igual al quinto (12/21)', 12 / 21], ['90 %', 0.9], ['85,7 % (18/21)', 18 / 21], ['70 %', 0.7], ['76 % exacto', 0.76]])
  console.log(`D ${nom}: ALTA ${(100 * P(p, alta)).toFixed(3)} % · MUDA ${(100 * P(p, muda)).toFixed(3)} % · BAJA ${(100 * P(p, baja)).toFixed(4)} %`);
```

### P-D-3 · LA REGLA DE CUENTA DE LA ETIQUETA (arquitecto, 04/11/2026, escrita ANTES de la tanda; Code avisó de que faltaba)

Literal, como lo pegó el director (a Code primero):

> CÓMO SE RECONOCE, sobre cada respuesta que el script cuente como D (columna 1 = sí):
> - Se busca la cadena literal `norma_contra_norma` y la cadena literal `norma_contra_practica`, ignorando comillas, acentos de formato, backticks y negritas alrededor.
> - Aparece EXACTAMENTE UNA → ésa es la etiqueta.
> - No aparece NINGUNA → «sin etiqueta».
> - Aparecen LAS DOS → «etiqueta sin decidir»: va a una lista nombrada con su vez, y NO se asigna. (Pasa cuando la respuesta nombra la otra para descartarla, como «no hay conflicto normativo ni norma contra práctica».)
> - Las respuestas que NO son D no se miran: la etiqueta sólo se cuenta sobre los hallazgos de D.
>
> LA PREDICCIÓN, y la escribo condicionada porque su denominador no se conoce hasta que corra:
> «Dados k hallazgos de D, `norma_contra_norma` aparece en MÁS DE LA MITAD de ellos.»
> - La hipótesis nula está fijada AHORA: las tres salidas (norma_contra_norma / norma_contra_practica / sin etiqueta) reparten por igual, un tercio cada una.
> - La tasa de error se calcula CON LA k OBSERVADA, no se elige después. El estadístico y la nula están fijados; lo único aleatorio es n. Eso es legítimo.
> - Y se informa el reparto exacto de las tres, más la lista de «etiqueta sin decidir», aunque la predicción salga.
>
> POR QUÉ: D ES un conflicto normativo —una permisión contra un principio—, así que etiquetarlo es el acierto. Es el espejo del quinto, donde NO poner etiqueta era lo correcto porque es un caso de dato, y salió 8 de 9 sin etiqueta.

**LA HORA, con su origen** (arquitecto): las dos, y la suya no se borra. **«19:05»** es la del arquitecto, sacada de la cabecera del
mensaje del director: derivada, no medida. **19:03** es la del reloj de Code al archivar las predicciones (`date`). El título de
arriba lleva las dos.

**LA REGLA, EN EL SCRIPT CONGELADO, para aprobar: HUELLA `e21387a1ff2e7305`** (sustituye a `866ab31ef2dbd794`, la aprobada: la regla
cambia el código, así que la huella aprobada ya no lo cubre). Lo que se añade, y sólo eso:
- `etiquetaDe`, sobre el texto ENTERO de la respuesta, sin mayúsculas y sin las barras invertidas (el «\_» del markdown); lo que
  rodee a la cadena no importa. Y dos pasos de cuenta, el **6** (el reparto de las tres, más la lista de «sin decidir» con su vez) y
  el **7** (¿más de la mitad?, y la tasa de error con la k observada: P(X > k/2), X binomial(k, 1/3)). **Sólo en el caso D**: el
  quinto no lleva etiqueta en su salida.
- **k es el número de hallazgos de la columna 1** (la línea 3), y las de «etiqueta sin decidir» CUENTAN en k sin asignarse: así se
  lee «más de la mitad de ellos». Con k = 0, P-D-3 sale NO PUNTUABLE.
- ⚠️ **DOS LECTURAS DE CODE, para que el arquitecto las confirme o las corrija antes de pulsar**:
  (1) **«literal» se aplica tal cual**: «norma contra norma» con espacios, o «norma_contra_práctica» con tilde, NO son la cadena, y
  cuentan como «sin etiqueta»; (2) **el texto entero**, no sólo la sección de la pregunta 2: una respuesta que la pone en la 1 cuenta.
- **El quinto sale IDÉNTICO** a `cea980ddc9356e68`, la aprobada, sobre la segunda tanda.
- **62 de 62 pruebas** (siete nuevas): una sola cadena → ésa, entre backticks, en negrita, con «\_» o en mayúsculas; las dos → sin
  decidir; ninguna, con espacios o con tilde → sin etiqueta; sólo cuentan los hallazgos (seis respuestas que no son D llevan la
  cadena y no se miran); la mitad justa NO es más de la mitad; sin hallazgos, no puntuable; la cola binomial contra 7/27 a mano;
  y el quinto sin etiqueta. **Cinco mutantes, los cinco cazados**: sin quitar las barras (1 rota), «>=» en vez de «>» (1), sin
  «sin decidir» (2), la etiqueta también en el quinto (5), y mirando también lo que no es hallazgo (1).

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
    referencia: 'se compara con los 12 de 21 del quinto', etiqueta: true, col2: 'LA COLUMNA 2 DE D', col2Puntua: 'no afecta a la 1',
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

// P-D-3 · LA ETIQUETA (regla del arquitecto, 04/11, escrita antes de la tanda; SÓLO en los casos con `etiqueta: true`, hoy D).
// Sobre cada respuesta que la columna 1 cuente como hallazgo, en su texto ENTERO: se buscan las cadenas literales
// «norma_contra_norma» y «norma_contra_practica», sin mayúsculas y quitadas las barras invertidas (el «\_» del markdown); lo
// que las rodee (comillas, backticks, negritas) no importa. Exactamente una → ésa; ninguna → «sin etiqueta»; las dos →
// «etiqueta sin decidir», a una lista con su vez y SIN asignar. Las respuestas que no son hallazgo no se miran.
// ⚠️ LITERAL A PROPÓSITO: «norma contra norma» con espacios, o «norma_contra_práctica» con tilde, NO son la cadena: cuentan como
// «sin etiqueta». La predicción: con k hallazgos, «norma_contra_norma» en MÁS DE LA MITAD; la nula, un tercio para cada una de
// las tres salidas, y su tasa de error se calcula con la k observada: P(X > k/2), X binomial(k, 1/3).
export function etiquetaDe(texto) {
  const t = texto.toLowerCase().replace(/\\/g, '');
  const nn = t.includes('norma_contra_norma'), np = t.includes('norma_contra_practica');
  return nn && np ? 'sin decidir' : nn ? 'norma_contra_norma' : np ? 'norma_contra_practica' : 'sin etiqueta';
}
export function colaBinomial(k, umbral, p) { // P(X >= umbral), X ~ binomial(k, p)
  let s = 0, c = 1;
  for (let x = 0; x <= k; x++) { if (x > 0) c = c * (k - x + 1) / x; if (x >= umbral) s += c * p ** x * (1 - p) ** (k - x); }
  return s;
}
const pct = x => (100 * x).toFixed(3).replace('.', ',');

export function resumen(pulsaciones, caso = CASOS.quinto) {
  const N = caso.n, TOPE = caso.tope;
  const buenas = [], fallidas = [];
  pulsaciones.forEach((respuestas, p) => respuestas.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    if (fallida(r)) { if (buenas.length < N) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`); }
    else if (buenas.length < N) buenas.push({ id, ...contar(r, caso), etiqueta: etiquetaDe(r.respuesta) });
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
  if (caso.etiqueta) {
    const k = limpias.length, de = e => limpias.filter(f => f.etiqueta === e), nn = de('norma_contra_norma').length;
    const dudosas = de('sin decidir');
    salida.push(`6 · LA ETIQUETA (P-D-3), sobre los ${k} hallazgos: norma_contra_norma ${nn} · norma_contra_practica ${de('norma_contra_practica').length} · sin etiqueta ${de('sin etiqueta').length} · etiqueta sin decidir ${dudosas.length}${dudosas.length ? ' — ' + dudosas.map(f => f.id).join(' · ') : ''}`);
    if (k === 0) salida.push('7 · P-D-3: NO PUNTUABLE (no hay ningún hallazgo sobre el que contar la etiqueta).');
    else salida.push(`7 · P-D-3, ¿norma_contra_norma en más de la mitad?: ${nn > k / 2 ? 'SÍ' : 'NO'} (${nn} de ${k}; hace falta ${Math.floor(k / 2) + 1}) · tasa de error con k = ${k}, nula de un tercio: ${pct(colaBinomial(k, Math.floor(k / 2) + 1, 1 / 3))} %`);
  }
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
  // LAS PRUEBAS DE P-D-3, la etiqueta (respuestas inventadas)
  const ETQ = (e, v) => R(v, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. ${ND} ${CD} ${e}`);
  PRUEBAS_DE_D.push(
    ['P-D-3: una sola cadena → ésa, entre backticks, en negrita, con «\\_» o en mayúsculas', () => ['`norma_contra_norma`', '**norma_contra_practica**', 'norma\\_contra\\_norma', 'NORMA_CONTRA_NORMA'].map(etiquetaDe),
      ['norma_contra_norma', 'norma_contra_practica', 'norma_contra_norma', 'norma_contra_norma']],
    ['P-D-3: las dos → sin decidir; ninguna, con espacios o con tilde → sin etiqueta', () => ['es norma_contra_norma, no norma_contra_practica', 'nada', 'norma contra norma', 'norma_contra_práctica'].map(etiquetaDe),
      ['sin decidir', 'sin etiqueta', 'sin etiqueta', 'sin etiqueta']],
    ['P-D-3: sólo cuentan los hallazgos (las 6 que no son D llevan la cadena y no se miran); 22 de 36 es más de la mitad',
      () => resumen([[...veces(21, v => ETQ('norma_contra_norma', v))], [ETQ('norma_contra_norma', 1), ...veces(13, v => ETQ('norma_contra_practica', 1 + v)), ETQ('norma_contra_norma y norma_contra_practica', 15), ...veces(6, v => R(15 + v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí. norma_contra_norma'))]], CASOS.D).slice(5),
      ['6 · LA ETIQUETA (P-D-3), sobre los 36 hallazgos: norma_contra_norma 22 · norma_contra_practica 13 · sin etiqueta 0 · etiqueta sin decidir 1 — pulsación 2, vez 15',
        `7 · P-D-3, ¿norma_contra_norma en más de la mitad?: SÍ (22 de 36; hace falta 19) · tasa de error con k = 36, nula de un tercio: ${pct(colaBinomial(36, 19, 1 / 3))} %`]],
    ['P-D-3: la mitad justa NO es más de la mitad', () => resumen([[...veces(21, v => ETQ('norma_contra_norma', v))], [...veces(21, v => ETQ('', v))]], CASOS.D).slice(6),
      [`7 · P-D-3, ¿norma_contra_norma en más de la mitad?: NO (21 de 42; hace falta 22) · tasa de error con k = 42, nula de un tercio: ${pct(colaBinomial(42, 22, 1 / 3))} %`]],
    ['P-D-3: sin hallazgos, no puntuable', () => resumen([[...veces(21, nada)], [...veces(21, nada)]], CASOS.D).slice(6),
      ['7 · P-D-3: NO PUNTUABLE (no hay ningún hallazgo sobre el que contar la etiqueta).']],
    ['la cola binomial contra un valor a mano: P(X >= 2), binomial(3, 1/3) = 7/27', () => colaBinomial(3, 2, 1 / 3).toFixed(9), (7 / 27).toFixed(9)],
    ['el quinto NO lleva etiqueta en su salida', () => resumen([[...veces(21, bien)]]).length, 5],
  );
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

**LA HUELLA `e21387a1ff2e7305`, APROBADA** (arquitecto, 04/11/2026). **Y las dos lecturas de Code, confirmadas** (arquitecto):
1. **«Literal» tal cual**: «norma contra norma» con espacios o «norma_contra_práctica» con tilde cuentan como «sin etiqueta». El
   prompt usa las cadenas exactas, así que un modelo que etiqueta las escribe así, y uno que lo dice en prosa está describiendo,
   no etiquetando.
2. **El texto entero, no sólo la pregunta 2**: la predicción es sobre la etiqueta, no sobre dónde la pone. Si clasifica el caso
   como norma_contra_norma, lo ha clasificado, esté la palabra donde esté.

⚠️ **LA OBSERVACIÓN, que va al archivo porque es honesta y no es neutral** (arquitecto): **las dos lecturas NO tiran en el mismo
sentido.** La 1 es CONSERVADORA CONTRA su predicción: al exigir la cadena literal, infracuenta la etiqueta, y P-D-3 predice que la
etiqueta aparece. La 2 es PERMISIVA A FAVOR: al mirar el texto entero, cuenta etiquetas que el prompt sólo pedía en la pregunta
2. **Se compensan en parte y no se sabe en cuánto.** Que conste así, y no como dos decisiones neutras.

**EL ORDEN, sin cambios**: cuando el director suba y Vercel despliegue, el ensayo de D; Code comprueba las dos frases guardadas y
se las pasa al arquitecto; el arquitecto confirma la pareja; y las dos tandas de 21.

## ⚠️ LA TANDA DE D, PARADA ANTES DE PULSAR: LA DECIMOCUARTA Y CUATRO DATOS (arquitecto y Code, 04/11/2026)

**NADA LANZADO; EL DIRECTOR NO PULSA** (arquitecto) hasta que él reescriba qué mide la tanda, o la cambie.

**LA DECIMOCUARTA, una corrección de su propia corrección** (arquitecto, con su nombre): dijo «el 90 % no es D», y es más fuerte
de lo que Code encontró. El §3.5 CITA al §3.1 («precisamente para mantener la separación de funciones descrita en el apartado
3.1»), y la consulta del producto no exige mitad de CLI-12 (dato 2, abajo). Así que §2.4 ↔ §3.1 y §2.4 ↔ §3.5 pueden ser la misma
contradicción por dos frases. **Lo cierto es sólo: condiciones de herramienta y recuento laxo, y no es la pareja sembrada.** El
título «EL 90 % NO ES LA D SEMBRADA», de arriba, se lee con esta corrección.

**DATO 1 · CÓMO DEFINE D EL REGISTRO DE SIEMBRA** (`corpus-pruebas/SIEMBRA_corpus_ampliado.md`, añadida el 27/08/2026, `d51a68b4`):
- La tabla (líneas 97-100) da DOS versiones: NOR-10 **2.4** («puede recaer en el propio Director Clínico») y CLI-12 **3.5**
  («nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones»). **El §3.1 no
  figura como versión.**
- El §3.1 aparece sólo como el sitio al que remite el pasaje del §3.5 («descrita en el apartado 3.1», línea 117) y en la tabla
  de localización como «siembra A» (línea 133). La naturaleza del conflicto (120-122) habla del §3.5: «CLI-12 lo prohíbe
  expresamente y da el motivo». **Refuerzo nombrado: el §3.4** (124-127), no el §3.1.

**DATO 2 · SQL_34_06 NO EXIGE NINGUNA MITAD DE CLI-12 PARA CONTAR D** (corrige lo que dijo Code: «acepta cualquiera de las dos
mitades» era impreciso). Su regla (cabecera, líneas 19-31): hay D si se PUBLICÓ una contradicción con CLI-12 cuya cita del lado
de NOR-10 toca la PRIMERA frase del §2.4, el permiso (línea 100). Las líneas 138-142 no filtran: sólo ETIQUETAN qué citó el lado
de CLI-12 —«el principio de §3.1», «§3.5», «§3.1, fuera del principio» o «fuera de §3.1 y §3.5»—, y las cuatro cuentan. **Así que,
a efectos de medir el producto, §2.4 ↔ §3.1 ES una ruta de D, y cualquier otra cita de CLI-12 también.**

**DATO 3 · LA HIPÓTESIS DE A** («la presencia de A en la pareja impide que salga D»):
- **Condición 1** (NOR-10·4 ↔ CLI-12·3 enteros, con A dentro; 30/10): **20 de 20** a las 08:03 UTC y **16 de 20** en la
  repetición, 08:17 UTC. **Condición 2** (las dos frases solas, el permiso y el principio del §3.1, sin A; 08:04 UTC): **20 de 20**
  por la regla escrita, **16 de 20** con la comprobación literal. `Medida_F130_E3_Y_Vecindad_29-10-2026.md:490-511`.
- **Lo que se concluyó, literal** (arquitecto, 30/10; `Medida…:557-560`, y en `Estado…:1051` y aquí, línea 290): «LAS DOS
  CONDICIONES NO SE SEPARAN (20 frente a 20, p = 1; con la cuenta literal de la condición 2, 20 frente a 16, p = 0,106). LA
  HIPÓTESIS DE QUE LA PRESENCIA DE A IMPIDE QUE SALGA D QUEDA REFUTADA, no "no demostrada": era la hipótesis del arquitecto y
  la medición la tumba.»
- **Su estado: CERRADA como refutada, y nadie la reabrió** (no hay otra mención en el repositorio). ⚠️ **Pero con dos límites que
  la cierran menos de lo que dice**: (a) las dos condiciones se contaron con la regla LAXA (el ancla de NOR-10 en la pregunta 2,
  sin veredicto ni cita de CLI-12); (b) las dos son de la pareja del §3.1. **Sobre la pareja del §3.5 no se ha medido nunca.**

**DATO 4 · A EN LA PAREJA NUEVA: SÍ, SÓLO MEDIO PRESENTE** (Code, sobre el texto guardado que devolvió el ensayo):
- **NOR-10·4 lleva una mitad**: la segunda frase del §2.4, «no sustituye al Director Clínico en la responsabilidad última
  descrita en el apartado 2.1» (`SQL_34_06` la cuenta como A, línea 23).
- **CLI-12·6 no lleva la otra**: ni «responsable último», ni «responsabilidad última», ni ninguna forma de «responsab». La frase
  de A en CLI-12 es la del §3.1 (registro, línea 62), y está en CLI-12·3. CLI-12·6 sólo REMITE al §3.1, sin su texto.
- **Así que la contradicción A, tal como está sembrada, no se puede citar en esta pareja.** Lo que el modelo haga con la media
  A que queda no está medido.
- **La consecuencia** (es lo que el arquitecto pregunta): la tanda no es la condición 1 (las dos mitades de A dentro) ni la
  condición 2 (sólo las dos frases de D). **Son los dos trozos enteros con A a medias.** Si la pregunta es «¿tapa A a D?», esta
  pareja no la contesta. La comparación con el quinto tampoco está igualada en eso: qué otros conflictos llevan NOR-11·13 y
  CLI-12·13 no se ha medido.

### DE DÓNDE VIENE EL BLOQUE DEL PRINCIPIO DEL PROMPT DE E3 (Code, 04/11/2026, con `git log -S` y `git show`)

**`b3b4e9da` (29/10, 19:16 +01:00) NO añadió el bloque.** En el prompt sólo cambió UNA línea de `PREGUNTA_CERRADA`: la de «ESTA
PREGUNTA SE CONTESTA SOLA…», que pasó a hacerse «SOBRE FRASES, NO SOBRE LOS DOS TEXTOS EN BLOQUE» (más un comentario, pruebas,
mutantes y fichas).

**El bloque es anterior, y es el del JUEZ DEL PRODUCTO** (`lib/analysis/excepcion-de-las-reglas.ts`, el frente 3.4):
- **26/10, 20:59, `5ca99f12`** («3.4, fase 2…, contrato del arquitecto»): entra el bloque en el prompt del juez, con «SI SE HACE LO
  QUE UNA PERMITE» y el ejemplo del taller de «norma_contra_norma» («El encargado del taller puede ser el mismo socio que el
  tesorero»). El commit no nombra ningún caso de origen.
- **27/10, 09:32, `1912469a`** («3.4: el principio en el bloque del juez…»): entra el bloque del principio («CUIDADO CON UN CASO QUE
  PARECE UNA RAZÓN», «ENUNCIAN UN PRINCIPIO») y el ejemplo del «principio SOLO». **Y la cabecera del módulo dice su motivo**: «la
  cláusula de antes excluía §3.1 de CLI-12, la mitad que el juez escogía para D». **Esa parte se escribió A PARTIR DE D**, de su
  mitad del §3.1.
- **29/10, 00:33, `a58deaf8`**: el bloque entra en el prompt de E3, RECORTADO del bloque del juez (`criterio-del-cumplimiento.ts`),
  no copiado.
- **Las fechas que importan**: el bloque del principio está en el juez desde el 27/10 y en E3 desde el 29/10 a las 00:33. La
  condición 1 corrió el 30/10 a las 08:03 UTC. La línea base del producto (3 de 21, 30-31/10) también corrió con él en el juez.
  *(Son horas de commit; la del despliegue es la del push, que no se ha mirado aquí.)*

**LA DECIMOSÉPTIMA, una retirada del arquitecto, la primera del día por EXCESO DE ALARMA** (con su nombre): presentó el ejemplo del
prompt como si invalidara la medición de D, y se pasó. Los ejemplos son de otro dominio (taller, socio, tesorero, compras) con otro
vocabulario; lo único compartido es la forma lógica, y **transferir una forma lógica de un taller a una clínica es la habilidad que
se quiere, no un atajo**. La pregunta honesta es más estrecha: ¿el bloque cubre UNA forma o UNA FAMILIA de formas? **Eso lo contesta
el caso reservado, no esto.** *(La decimoquinta y la decimosexta no le han llegado a Code.)*

**LO SIGUIENTE, sin cambios** (arquitecto): el recuento estricto de las 40 (§2.4 ↔ §3.1, con su nombre), después de esto.

## LA ADENDA DE FABLE DEL 04/11, CONTRA EL REPOSITORIO (Code, 05/11/2026)

La adenda, literal, en `claude/consultas-fable/F-130_2026-10-28_que-decide-lo-que-un-juez-escribe.md`. Aquí sólo lo que choca con
lo escrito o no se puede comprobar desde el repositorio. **Sin puntuar**: la puntuación es del arquitecto.

**CHOCA:**
1. **«20 de 20 con A dentro y 16 de 20 sin ella, p = 1»** mezcla dos comparaciones. Lo archivado (`Medida_F130_E3_Y_Vecindad…:490-511,
   557`): con A, 20 de 20 (y 16 de 20 en la repetición); sin A, 20 de 20 por la regla escrita o 16 de 20 por la literal. p = 1 es 20
   frente a 20; 20 frente a 16 da p = 0,106. La conclusión (no se separan) se sostiene igual; las cifras, como están, no. Y las dos
   condiciones se contaron con la regla laxa, sobre la pareja del §3.1.
2. **«Nadie ha probado la pregunta cerrada sin él [el bloque]»: CIERTO, y más de lo que parece.** El único 6 de 7 del §3.5 corrió el
   **29/10 a las 12:05 UTC**, con `a58deaf8` (29/10, 00:33), que ya metía el bloque recortado en E3. **Code lo había fechado el
   28/10** en este fichero y se lo dio así al arquitecto, que lo copió en su marca de la semana 0 (en el proyecto de Claude):
   corregido aquí; la del proyecto la corrige él.
3. **D1 describe la pasada 2 en indicativo** («el código arma parejas…», «las tiradas se repiten tres veces y se firma con dos»,
   «queda un contador»). **En el repositorio no existe**: ni enumerador ni pasada 2 en `lib/`, `app/` ni `worker/` (las únicas
   menciones son de la herramienta de medida), y no hay ningún `escape.marcado`. Lo último escrito aquí es «no se construye
   todavía» (línea 317), con el veredicto anterior anulado (301). Si la especificación que lo describe vive en el proyecto, Code no
   la ha visto.
4. **«El quinto entra por la primera pregunta, y ahí el juez se parte»**: no está medido. La columna 2 de la segunda tanda (por qué
   pregunta salió) dio **NO PUNTUABLE**, con 5 de 21 sin decidir en la pregunta 2.
5. **«D tiene dos mitades posibles en CLI-12»**: el registro de siembra define D sólo por §2.4 ↔ §3.5 (líneas 97-100). Lo que admite
   cualquier cita de CLI-12 es la consulta del producto, `SQL_34_06`, que ni siquiera exige una de las dos (sección de ayer).

~~**NO SE PUEDE COMPROBAR DESDE EL REPOSITORIO:** «42 pasadas y 186 veredictos»… el 186 no aparece en ningún fichero de `claude/`.~~
**CORREGIDO EL MISMO DÍA (Code, 05/11): EL 186 SÍ ESTÁ, y el error es de Code**, que buscó la cifra por su nombre («186») y no por
lo que la compone. Es la suma de los hallazgos que llegaron al verificador en la tanda nueva, en la salida de `SQL_34_09`
archivada en `Medida_F130_E3_Y_Vecindad_29-10-2026.md:1916-1917`: **106 en NOR-10 (21 pasadas) + 80 en NOR-11 (21 pasadas) =
186, en 42 pasadas, con `descartado.sin_veredicto` en 0**. El contador de origen es `verificador.hallazgos_entrantes`
(`SQL_34_09_el_verificador_nuevo.sql:15-16, 70`). Que cada uno de esos 186 tuviera veredicto es lo que dice el 0 de
`sin_veredicto`.

**CUADRA, comprobado:**
- La base de coste, **0,031 $** (`Estado…:770`; 0,0315 $ en la línea 648), y el 0,015 $ como cifra inventada (`Estado…:652`).
- **El puente del quinto, §6.1, estaba delante**: CLI-12·13 trae el §6.1, el §6.2 y el §6.3 (ensayo del paso 3), y **17 de las 21**
  respuestas de la segunda tanda contienen literal su frase «verifica el cumplimiento de un protocolo concreto».
- **El bloque es anterior a F-130 y se escribió mirando a D**: entró en el juez el 26/10 (`5ca99f12`, el taller) y el 27/10
  (`1912469a`, el principio, que según la cabecera de su módulo nació porque la cláusula anterior «excluía §3.1 de CLI-12, la mitad
  que el juez escogía para D»). Fable dice «añadido en F-129 y F-130»: el frente fue el 3.4, entre las dos.
- **«12 de 21 lo alcanzan»**: el número legible del quinto (con las 4 ilegibles, entre 12 y 16).

## P-F130-23 · EL PRERREGISTRO, LITERAL (arquitecto, 05/11/2026, antes de correr nada)

Sacado del registro de la conversación con un script. **NADA CONSTRUIDO Y NADA LANZADO**: la construcción espera a que cuadren los
cortes (cuadran, abajo) y a la huella nueva del script, aprobada por escrito.

```
P-F130-23 · ¿SOSTIENE EL BLOQUE DEL PRINCIPIO LA DETECCIÓN DE D?
Prerregistrado por el arquitecto el 05/11/2026, antes de correr nada.

DISEÑO. Seis brazos: tres condiciones por dos parejas.
  Condiciones: 0 = prompt de hoy, sin parámetro (control).
               a = sin el bloque (cortes 1 y 2), con la afirmación general en pie.
               c = sin el bloque y sin la afirmación (cortes 1, 2 y 3).
  Parejas:     §3.1 = NOR-10·4 ↔ CLI-12·3 (lleva A dentro del trozo).
               §3.5 = NOR-10·4 ↔ CLI-12·6 (no lleva A).
  n = 42 por brazo, en dos pulsaciones de 21. Doce pulsaciones, 0 créditos, ~0,5 $.
  El brazo 0 SE CORRE DE NUEVO: no se hereda ninguna cifra con bloque, porque
  las archivadas se contaron con la regla laxa y mezclarlas sería el cruce de
  condiciones del 31/10.

LAS PAREJAS NO SE COMPARAN ENTRE SÍ. Difieren en dos cosas (qué apartado
enuncia el principio, y si A está en el trozo). Son dos preguntas con su propio
control. Sólo se compara dentro de cada pareja, entre brazos.

RECUENTO. Dos anclas (NOR-10 42 car., CLI-12 74 car.), y cada respuesta
contada dos veces: estricto (ancla entera) y laxo (solape de 20 car., regla de
SQL_34_06:87). Los ilegibles se reportan como RANGO: cota baja = no sale,
cota alta = sí sale.
  UNA BANDA SE ASIGNA SÓLO SI LAS DOS COTAS Y LOS DOS RECUENTOS COINCIDEN.
  Si discrepan, es banda C.

BANDAS (dentro de cada pareja, brazo de retirada contra su brazo 0, Fisher
exacto bilateral, alfa 0,05):
  A · EL BLOQUE SOSTIENE A D. p < 0,05. Cortes: brazo 0 en 42 → 36 o menos;
      en 40 → 33 o menos; en 38 → 30 o menos.
      CONSECUENCIA: el bloque es portante. La pregunta pasa a si describe una
      clase, y eso lo mide la tasa de sí-falso sobre 100 parejas sin conflicto,
      que sube al primer puesto de la lista de Fable.
  B · EL BLOQUE APORTA MENOS DE 5 PUNTOS. Diferencia de 2 pasadas o menos
      sobre 42 (margen de equivalencia declarado, no un contraste).
      CONSECUENCIA: la inquietud del ad hoc queda vacía para esa pareja. El
      bloque se queda como aclaración y NO SE CONSTRUYE NADA NUEVO. Es la
      única banda que cambia lo que hacemos.
  C · TODO LO DEMÁS.
      CONSECUENCIA: no se añaden pasadas. Se decide igual que en A, pero sin
      poder escribir que el bloque sostiene a D.

TASA DE ERROR: 2,68 % (tipo I, tasa base 0,85, n = 42).
POTENCIA: 99,88 % de 0,95 a 0,50 · 91,6 % de 0,85 a 0,50 · 67,2 % de 0,85 a 0,60.

LA DEBILIDAD, DICHA ANTES DE MEDIR: para una caída de 15 puntos la potencia
ronda el 30-40 %, y para una de 10 puntos el 15 %. LA BANDA C ES ANCHA Y ESO
ES UNA PROPIEDAD DEL n, NO UN DEFECTO DEL DISEÑO: estrecharla pediría cientos
de pasadas. Si sale C, sale C, y no se mira otra vez.

NO SE MIRA A MEDIAS. Los seis brazos se corren completos antes de contar nada.
REPETICIÓN: un brazo con más de 4 ilegibles se repite. La decisión de repetir
se toma MIRANDO SÓLO EL NÚMERO DE ILEGIBLES, antes de contar resultados.
Repetir porque no se puede parsear está permitido; repetir porque el número
salió incómodo, no.
HUELLA: ninguna tanda corre con una huella del script que el arquitecto no
haya aprobado por escrito.
```

**LOS TRES CORTES, APROBADOS** (arquitecto, 05/11), sacados por script de `CRITERIO_DEL_CUMPLIMIENTO`; cada uno sale UNA vez en el
criterio y en el bloque del juez: el 1, de «CUIDADO CON UN CASO QUE PARECE UNA RAZÓN» hasta justo antes de «Y ESTO VALE PARA
CUALQUIERA DE LOS CASOS DE ARRIBA», con su línea en blanco (1.397 car.); el 2, « Pero OJO: … abajo.» con el espacio delante (135);
el 3, sólo en el brazo c, la viñeta «- Una regla y SU PROPIA razón… no choca con nada.» con el salto de línea delante (250). **El
ejemplo del taller del 26/10 se queda en los tres brazos**, y con él la etiqueta «norma_contra_norma» enseñada: el corte 1 se lleva
una de sus apariciones, no todas (arquitecto: si no, los brazos a y c medirían dos cosas). **La cláusula anterior al 27/10 no se
corre** (era otra instrucción, no una ausencia del bloque).

**EL DESCUADRE DE UN CARÁCTER, RECONTADO CON SCRIPT** (Code): criterio 5.395 − 1.397 − 135 = **3.863, brazo a**; − 250 = **3.613,
brazo c**. Los cuatro números son buenos; **el que estaba mal era el 3.614 que dio Code**, calculado con el corte 3 SIN su salto de
línea (249), antes de proponer el de 250. Con aquél el brazo c quedaba «la 2.\n\n\nY ESTO VALE…», una línea en blanco de más; con
el aprobado, «la 2.\n\nY ESTO VALE…», igual que la junta del brazo a.

**LAS CIFRAS A n = 42** (Code, Fisher exacto bilateral, alfa 0,05): tipo I con tasa base 0,85, **2,683 %**; de 0,95 a 0,50,
**99,877 %**; de 0,85 a 0,50, 91,6 %; de 0,85 a 0,60, 67,2 %. **Las caídas pequeñas**: 15 puntos, **44,3 %** (0,95 → 0,80) y **30,0 %**
(0,85 → 0,70); 10 puntos, **20,3 %** (0,95 → 0,85) y **15,0 %** (0,85 → 0,75). El «30-40 %» y el «15 %» del texto de arriba son de
n = 40; a 42 son 30-44 % y 15-20 %.

⚠️ **UN AVISO DE CODE SOBRE EL RECUENTO LAXO, PENDIENTE DE DECISIÓN DEL ARQUITECTO** (bloquea el script, no el prerregistro): el
texto dice «solape de 20 car., regla de SQL_34_06:87». **La regla de `SQL_34_06` no es ésa.** La línea 87 sólo es el literal de la
frase del principio. La regla está en las líneas 89-90 (`tramo_p`), 129-134 (lado de NOR-10) y 138-142 (lado de CLI-12): la cita,
normalizada (minúsculas, espacios colapsados, tildes quitadas), **mide 20 caracteres o más, sale LITERAL dentro del párrafo, y su
tramo toca la frase del caso en al menos UN carácter**. El 20 es la longitud mínima de la cita, no la del solape. Y del lado de
NOR-10 añade la regla de «a caballo»: una cita que toca la frase de A y la de D a la vez es DUDOSA y no cuenta en ninguna (líneas
135-137). En el §3.5 no hay tramo: basta con salir literal en el párrafo.

### P-F130-23 · LA ADENDA AL PRERREGISTRO, LITERAL (arquitecto, 05/11/2026, antes de correr nada)

Marca una frase falsa del prerregistro de arriba; no lo borra. Sacada del registro de la conversación con un script.

```
ADENDA AL PRERREGISTRO DE P-F130-23 · 05/11/2026, el mismo día y antes de correr nada.

1. DONDE DICE «recuento laxo … solape de 20 car., regla de SQL_34_06:87», ES FALSO.
   La línea 87 es sólo el texto de la frase. La regla está en 89-90, 129-134 y
   138-142: normaliza, exige 20 caracteres MÍNIMOS DE LONGITUD DE LA CITA (no de
   solape), exige literalidad dentro del párrafo y que el tramo toque la frase.
   El arquitecto describió una regla que no existía y la justificó diciendo que no
   se la inventaba. Lo cazó Code antes de escribir una línea de script.

2. LOS DOS RECUENTOS NO ESTÁN ANIDADOS y ninguno es «el laxo». Se llaman
   RECUENTO POR ANCLA y RECUENTO POR LA REGLA DEL PRODUCTO. El primero se cae con
   las citas cortas; el segundo, con las paráfrasis y las elipsis. Fallan en
   direcciones opuestas, y por eso exigir que coincidan acota.
   LA GARANTÍA NO CAMBIA: exigir acuerdo sólo puede hacer una banda más difícil
   de asignar, nunca más fácil.

3. LA REGLA «A CABALLO» DE SQL_34_06 (135-137) SE PORTA TAMBIÉN. Una cita que
   abarque a la vez la frase de A y la de D en NOR-10·4 no cuenta para ninguna y
   entra en los ilegibles, con la regla del rango. Contarla como D sería dar por
   supuesta la respuesta que se mide.

4. LA DEBILIDAD, con las cifras de n = 42 en vez de las de 40: caída de 15
   puntos, 30,0 % desde 0,85 y 44,3 % desde 0,95. Caída de 10 puntos, 20,3 %
   desde 0,95. La banda C sigue siendo ancha y sigue siendo una propiedad del n.

5. CONDICIÓN PREVIA A CONSTRUIR: se cuenta sobre el archivo cuántas de las 9
   citas de D y cuántas de las 8 del principio sobreviven a estas reglas. Si la
   regla «a caballo» descarta la mayoría de las 9, o si los dos recuentos
   discrepan en la mayoría de las 8, EL DISEÑO SE REVISA ANTES DE CORRER NADA.
```

**La celda que le llegó cortada al arquitecto** (Code): caída de 10 puntos desde 0,85, a n = 42, **15,0 %**.

**SU PUNTO 5, HECHO POR CODE SOBRE EL ARCHIVO** (la regla del producto portada de `SQL_34_06`, con sus textos leídos del propio
fichero SQL; herramienta de un solo uso `regla_producto.mjs` en el scratchpad):
- ⚠️ **NO SON 9 CITAS DE D NI 8 DEL PRINCIPIO: SON 6 Y 5. El 9 y el 8 los dio Code, y contaban dos veces las tres de la línea base**,
  que están archivadas dos veces: la salida de `SQL_34_05` (`Medida_F130_E3_Y_Vecindad_29-10-2026.md:812, 818, 823`) y la de
  `SQL_34_06` (`:1056, 1077, 1094`), las pasadas 12, 17 y 21 del 30-31/10. Las distintas: las pasadas 4 y 5 del 28/10 (`:781,
  783`), la 12, la 17 y la 21 de la línea base, y la 19 del 02/11 (`:1760`, la única por el §3.5).
- **«A caballo» no descarta ninguna de las 6**: todas tocan sólo la frase del permiso. Y **la regla PUEDE descartar** (control
  positivo con citas inventadas, literales del §2.4): una que abarca el final de la frase de D y el principio de la de A sale
  DUDOSA; una sólo de la de A, A; una sólo de la de D, D; una de menos de 20 caracteres, ninguno. **En todas las salidas archivadas
  de `SQL_34_06` y `SQL_34_05` sobre NOR-10 (7 + 21 + 21 + 21 pasadas), «dudosas aparte: 0».**
- **Por el lado de CLI-12, los dos recuentos coinciden en las 6**: las 5 del principio pasan la regla del producto («el principio de
  §3.1») y contienen el ancla de 74; la del §3.5 pasa («§3.5») y contiene la suya. Del lado de NOR-10, las 6 contienen el ancla.
- ⚠️ **LO QUE ESTO NO DICE, y es el límite que importa**: las 6 son citas del PRODUCTO, que pasan por la puerta de citas y publican la
  frase real; por eso son literales y no abarcan dos frases. **Las de la herramienta son texto libre**: pueden ser más largas,
  parafrasear o abarcar las dos frases de NOR-10·4, y ahí las dos reglas pueden fallar más. El archivo no tiene con qué contestarlo
  para la herramienta, salvo las 40 respuestas de la condición 1 (la misma pareja del §3.1), que siguen sin leer. Y las selecciona
  el propio instrumento: las «cita de D» son, por construcción, las que no salieron dudosas.

### P-F130-23 · EL SCRIPT DE CUENTA, PROPUESTO: `contar_brazos.mjs`, HUELLA `73bcb6cf21e48809` (Code, 05/11/2026; PENDIENTE DE APROBACIÓN)

**Nada contado con él.** El orden (Code, aceptado antes de escribirlo): primero se aprueba la huella, y con ella se cuentan las 40 de
la condición 1 (la comprobación que pidió el arquitecto) y después los seis brazos; así nada se cuenta con código sin aprobar.
- **Fichero nuevo, el de la cuenta del quinto intacto**: importa de `contar_quinto.mjs` (huella `e21387a1ff2e7305`, comprobada
  después) las secciones (R1'), el veredicto (R2') y R4, así que **el recuento por ancla es el mismo código que contó el quinto**.
- **El recuento por la regla del producto**, portado de `SQL_34_06` con sus textos copiados POR SCRIPT del fichero SQL (una prueba
  comprueba que siguen siendo ésos): normalización de la consulta, cita de 20 caracteres o más, literal en su párrafo y tocando la
  frase; «a caballo» por el lado de NOR-10. Con la misma estructura que R4: (a), (b) y (c), y todo lo demás ilegible con su motivo.
- **Un brazo**: la selección de los prerregistros del 04/11 (P1); cada respuesta contada dos veces; por recuento, el rango (cota
  baja y alta); la lista de «a caballo»; las coincidencias; y **se repite con más de 4 ilegibles en cualquiera de los dos
  recuentos**, que la salida dice ANTES de enseñar ningún «sale».
- **La banda**, dentro de la misma pareja: cuatro evaluaciones (los dos recuentos por las dos cotas, la misma cota en los dos
  brazos); A si en las cuatro el brazo de retirada sale menos y Fisher da p < 0,05; B si en las cuatro la diferencia es de 2 o
  menos; si no, C. Parejas distintas, un brazo incompleto o uno a repetir: sin banda.
- **La orden va por variables de entorno** (`ACCION`, `PAREJA`, `FICHEROS`, `N`, `SALIDA`) y el script se niega con argumentos:
  `contar_quinto.mjs`, congelado, dispara su propia línea de órdenes con cualquier argumento; por eso se carga DESPUÉS de esa guarda.
- **20 de 20 pruebas**, entre ellas: los dos recuentos fallan en direcciones opuestas (la cita corta del principio pasa el producto
  y no el ancla; la paráfrasis, al revés); una cita literal que va del permiso hasta la frase de A pasa el ancla y sale a caballo
  por el producto; Fisher reproduce el 0,0258 del prerregistro. **16 mutantes, los 16 cazados.**

```js
// LA REGLA DE CUENTA DE P-F130-23, EN CÓDIGO (Code, 05/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Seis brazos (condiciones 0, a, c × parejas §3.1 y §3.5), n = 42 por brazo en dos pulsaciones de 21. Prerregistro y adenda del
// arquitecto (05/11), literales en claude/Predicciones_34_Conflicto_Normativo.md.
// Uso (SIN argumentos; todo por variables de entorno):
//   ACCION=brazo PAREJA=p31|p35 FICHEROS=pulsación1.json,pulsación2.json[,pulsación3.json] [N=42] [SALIDA=brazo.json] node contar_brazos.mjs
//   ACCION=banda FICHEROS=brazo-0.json,brazo-x.json node contar_brazos.mjs     ·     ACCION=pruebas node contar_brazos.mjs
//
// DEPENDE de contar_quinto.mjs (huella e21387a1ff2e7305, aprobada; NO se toca): de ella salen las dos secciones (R1'), el
// veredicto (R2'), las citas (R3) y la cuenta por ancla (R4). Así el RECUENTO POR ANCLA es el mismo código que contó el quinto.
import { readFileSync, writeFileSync } from 'node:fs';
// contar_quinto.mjs dispara su línea de órdenes con CUALQUIER argumento, así que se comprueba ANTES de cargarlo, y se carga después.
if (process.argv[2]) { console.log('NO SE CUENTA: este script no lleva argumentos (ver la cabecera); contar_quinto.mjs los tomaría como suyos.'); process.exit(1); }
const { secciones, veredicto, contar } = await import('./contar_quinto.mjs');

// LOS TEXTOS DE LA REGLA DEL PRODUCTO, copiados POR SCRIPT de SQL_34_06_hallazgos_por_pasada.sql (líneas 85-87 y 96-100), no a
// mano; una prueba comprueba que siguen siendo los del fichero. P24: el párrafo del §2.4 de NOR-10; FRASE_D, su primera frase (el
// permiso); FRASE_A, su segunda («no sustituye…»); P31: el §3.1 de CLI-12; PRINCIPIO, su frase del principio; P35: el §3.5.
export const TEXTOS = {
  "P24": "Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.",
  "FRASE_D": "Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro.",
  "FRASE_A": "El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.",
  "P31": "El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico. Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización. El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico. El Director Clínico es informado de estas decisiones pero no interviene en ellas como autoridad jerárquica.",
  "PRINCIPIO": "Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización.",
  "P35": "En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado."
};

export const ANCLA_NOR = 'puede recaer en el propio Director Clínico';
// LAS DOS PAREJAS (arquitecto, 05/11): el lado de NOR-10 es el MISMO en las dos (el ancla de D). NO SE COMPARAN ENTRE SÍ.
export const PAREJAS = {
  p31: { nombre: 'la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3)', anclaA: ANCLA_NOR, anclasB: ['separar la responsabilidad de un proceso crítico de seguridad del paciente'], deCaso: 'de la pareja', cli: 'p31' },
  p35: { nombre: 'la pareja del §3.5 (NOR-10·4 ↔ CLI-12·6)', anclaA: ANCLA_NOR, anclasB: ['nunca por el Director Clínico del propio centro'], deCaso: 'de la pareja', cli: 'p35' },
};

// LA NORMALIZACIÓN DE SQL_34_06: espacios colapsados, minúsculas y «áéíóúü» → «aeiouu» (translate de la consulta).
export const norm = s => s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/[áéíóúü]/g, c => 'aeiouu'['áéíóúü'.indexOf(c)]);
const T = Object.fromEntries(Object.entries(TEXTOS).map(([k, v]) => [k, norm(v)]));
const tramo = (p, f) => { const i = T[p].indexOf(T[f]); if (i < 0) throw new Error(`${f} no está en ${p}`); return { ini: i, fin: i + T[f].length - 1 }; };
const D = tramo('P24', 'FRASE_D'), A = tramo('P24', 'FRASE_A'), PR = tramo('P31', 'PRINCIPIO');

// LA REGLA DEL PRODUCTO, portada de SQL_34_06 (89-90, 129-142): una cita cuenta si, normalizada, mide 20 caracteres o más, sale
// LITERAL dentro del párrafo, y su tramo toca la frase del caso en al menos un carácter.
const toca = (c, p, t) => { const i = T[p].indexOf(c); return c.length >= 20 && i >= 0 && i <= t.fin && i + c.length - 1 >= t.ini; };
// Lado de NOR-10: 'D' si toca sólo la frase del permiso; 'a caballo' si toca la de D Y la de A (SQL_34_06:135-137: no cuenta en
// ninguna); null si no toca la de D.
export function ladoNor(cita) {
  const c = norm(cita), d = toca(c, 'P24', D), a = toca(c, 'P24', A);
  return d && a ? 'a caballo' : d ? 'D' : null;
}
// Lado de CLI-12: en la pareja del §3.1, la cita toca la frase del principio; en la del §3.5, sale literal en el §3.5 (SQL_34_06
// no le pone tramo: líneas 138-142).
export function ladoCli(cita, pareja) {
  const c = norm(cita);
  return pareja.cli === 'p31' ? toca(c, 'P31', PR) : c.length >= 20 && T.P35.includes(c);
}
// Las citas de una sección, en CRUDO (R3 de contar_quinto las aplana con sus minúsculas; aquí manda la normalización de SQL_34_06).
const citasCrudas = s => [...s.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => m[1] ?? m[2] ?? m[3] ?? '');

// EL RECUENTO POR LA REGLA DEL PRODUCTO: la misma estructura que R4 (las secciones y el veredicto son los de contar_quinto), con
// la regla del producto en vez del ancla. (a) la 1 en «sí» con una cita D y una de CLI-12 → sale; (b) la 2 en «no» igual → sale;
// (c) la 1 en «no» y la 2 en «sí» → no sale. Todo lo demás es ILEGIBLE, con su motivo; «a caballo» es un motivo de ilegible
// (arquitecto, 05/11: es un «no sé» y entra en el rango): cuando una sección que afirma hallazgo no trae ninguna cita D limpia y sí
// una a caballo.
export function contarPorProducto(respuesta, pareja) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { sale: null, motivos: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { sale: null, motivos: ['sin las dos secciones'] };
  const v1 = veredicto(s.p1, 1), v2 = veredicto(s.p2, 2);
  const lados = sec => { const cs = citasCrudas(sec), n = cs.map(ladoNor); return { d: n.includes('D'), caballo: n.includes('a caballo'), cli: cs.some(c => ladoCli(c, pareja)) }; };
  const l1 = lados(s.p1), l2 = lados(s.p2);
  if ((v1 === 'sí' && l1.d && l1.cli) || (v2 === 'no' && l2.d && l2.cli)) return { sale: true, motivos: [] };
  if (v1 === 'no' && v2 === 'sí') return { sale: false, motivos: [] };
  const motivos = [];
  for (const [n, v, l, afirma] of [[1, v1, l1, 'sí'], [2, v2, l2, 'no']]) {
    if (v === null) { motivos.push(`pregunta ${n}: veredicto sin decidir`); continue; }
    if (v !== afirma) continue;
    if (!l.d && l.caballo) motivos.push(`pregunta ${n}: cita a caballo`);
    else if (l.d || l.cli) motivos.push(`pregunta ${n}: hallazgo con un solo lado por la regla del producto`);
    else motivos.push(`pregunta ${n}: hallazgo sin ningún lado por la regla del producto`);
  }
  return { sale: null, motivos };
}

// EL RECUENTO POR ANCLA: R4 de contar_quinto, tal cual, con las anclas de la pareja.
export function contarPorAncla(respuesta, pareja) {
  const r = contar(respuesta, pareja);
  return { sale: r.quinto, motivos: r.cubo1 };
}

// UN BRAZO. La selección es la de los prerregistros del 04/11 (P1): las n primeras respuestas buenas, en orden de pulsación y de
// vez; una fallida no es un «no» y se repone con la siguiente buena. Cada respuesta se cuenta DOS VECES. Por recuento: cuántas
// salen, cuántas no, las ilegibles con su motivo, y el RANGO (cota baja: las ilegibles no salen; cota alta: salen).
// REPETICIÓN (prerregistro): un brazo con MÁS DE 4 ilegibles en cualquiera de los dos recuentos se repite, y la orden lo dice
// ANTES de enseñar ningún número de «sale».
export const MAX_ILEGIBLES = 4;
export function brazo(pulsaciones, pareja, n = 42) {
  const buenas = [], fallidas = [];
  pulsaciones.forEach((rs, p) => rs.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    const mala = !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';
    if (buenas.length >= n) return;
    if (mala) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`);
    else buenas.push({ id, ancla: contarPorAncla(r, pareja), producto: contarPorProducto(r, pareja), conCita: citasCrudas(r.respuesta).length > 0 });
  }));
  const rec = k => {
    const sale = buenas.filter(b => b[k].sale === true).length, ileg = buenas.filter(b => b[k].sale === null);
    return { sale, noSale: buenas.filter(b => b[k].sale === false).length, ilegibles: ileg.map(b => `${b.id}: ${b[k].motivos.join('; ')}`), baja: sale, alta: sale + ileg.length };
  };
  const ancla = rec('ancla'), producto = rec('producto');
  return {
    pareja: pareja.cli, n, completas: buenas.length >= n, fallidas, conCita: buenas.filter(b => b.conCita).length,
    aCaballo: buenas.filter(b => b.producto.motivos.some(m => m.includes('a caballo'))).map(b => b.id),
    ancla, producto,
    coinciden: buenas.filter(b => b.ancla.sale === b.producto.sale).length,
    discrepan: buenas.filter(b => b.ancla.sale !== b.producto.sale).map(b => `${b.id}: ancla ${b.ancla.sale}, producto ${b.producto.sale}`),
    repetir: Math.max(ancla.ilegibles.length, producto.ilegibles.length) > MAX_ILEGIBLES,
  };
}

// FISHER EXACTO BILATERAL (suma de las tablas con probabilidad <= la observada), el mismo de las cifras del prerregistro.
const lf = (() => { const t = [0]; for (let i = 1; i <= 400; i++) t[i] = t[i - 1] + Math.log(i); return n => t[n]; })();
const hip = (a, r1, c1, n) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(a) - lf(r1 - a) - lf(c1 - a) - lf(n - r1 - c1 + a));
export function fisher(a, n1, b, n2) {
  const c1 = a + b, n = n1 + n2, lo = Math.max(0, c1 - n2), hi = Math.min(n1, c1), p0 = hip(a, n1, c1, n);
  let s = 0; for (let x = lo; x <= hi; x++) { const p = hip(x, n1, c1, n); if (p <= p0 * (1 + 1e-7)) s += p; } return Math.min(1, s);
}

// LA BANDA de un brazo de retirada frente a su brazo 0, DENTRO DE LA MISMA PAREJA (las parejas no se comparan entre sí).
// Cuatro evaluaciones: los dos recuentos × las dos cotas, y en cada una la MISMA cota en los dos brazos (baja contra baja, alta
// contra alta). A: en las cuatro, el brazo de retirada sale MENOS que el 0 y Fisher da p < 0,05. B: en las cuatro, la diferencia
// es de 2 o menos. Si no, C. Un brazo que haya que repetir, o incompleto, no da banda.
export function banda(b0, bx) {
  if (b0.pareja !== bx.pareja) return { banda: null, motivo: 'las parejas no se comparan entre sí' };
  for (const [nom, b] of [['el brazo 0', b0], ['el brazo de retirada', bx]]) {
    if (!b.completas) return { banda: null, motivo: `${nom} no tiene sus ${b.n} respuestas` };
    if (b.repetir) return { banda: null, motivo: `${nom} tiene más de ${MAX_ILEGIBLES} ilegibles: se repite` };
  }
  const ev = [];
  for (const k of ['ancla', 'producto']) for (const c of ['baja', 'alta']) {
    const x = bx[k][c], o = b0[k][c];
    ev.push({ recuento: k, cota: c, retirada: x, control: o, p: fisher(x, bx.n, o, b0.n) });
  }
  const A = ev.every(e => e.retirada < e.control && e.p < 0.05), B = ev.every(e => Math.abs(e.retirada - e.control) <= 2);
  return { banda: A ? 'A' : B ? 'B' : 'C', evaluaciones: ev };
}

// LAS PRUEBAS (respuestas INVENTADAS)
function correrPruebas() {
  const R = (vez, respuesta) => ({ vez, respuesta });
  const p31 = PAREJAS.p31, p35 = PAREJAS.p35;
  // las citas, inventadas pero LITERALES de los textos de SQL_34_06
  const NOR = '«figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»';
  const CABALLO = '«experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico»';
  const SOLO_A = '«El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última»';
  const PRIN = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico»';
  const PRIN_CORTA = '«de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»'; // literal, sin el ancla
  const PRIN_PARAFRASIS = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de quien dirige la clínica»'; // con el ancla, no literal
  const P35 = '«nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones»';
  const Q = (c1, c2) => `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. ${c1} ${c2} norma_contra_norma`;
  const casos = [
    ['los textos son los de SQL_34_06 (líneas 85-87 y 96-100), y cada frase está dentro de su párrafo', () => {
      const l = readFileSync('E:/Doc-Hub/SQL_34_06_hallazgos_por_pasada.sql', 'utf8').replace(/\r\n/g, '\n').split('\n');
      const lit = i => [...l[i].matchAll(/'((?:[^']|'')*)'/g)].map(m => m[1].replace(/''/g, "'"));
      const fila = c => l.slice(95, 101).map((x, i) => lit(95 + i)).find(v => v[0] === 'NOR-10' && v[1] === c && v[2].includes('puede recaer'));
      return [TEXTOS.P35 === lit(84)[0], TEXTOS.P31 === lit(85)[0], TEXTOS.PRINCIPIO === lit(86)[0],
        TEXTOS.P24 === fila('D')[2], TEXTOS.FRASE_D === fila('D')[3], TEXTOS.FRASE_A === fila('A')[3]];
    }, [true, true, true, true, true, true]],
    ['norm: tildes, mayúsculas y espacios, como la consulta', () => norm('  Clínica\n  ÚLTIMA  '), 'clinica ultima'],
    ['NOR-10: el permiso → D; las dos frases → a caballo; sólo A → nada; corta → nada; no literal → nada',
      () => [NOR, CABALLO, SOLO_A, '«recaer en el propio»', '«figura que podría recaer en el propio Director Clínico»'].map(c => ladoNor(c.slice(1, -1))),
      ['D', 'a caballo', null, null, null]],
    ['CLI-12, pareja del §3.1: el principio sí (también corto), fuera del principio no, el §3.5 no, una paráfrasis no',
      () => [PRIN, PRIN_CORTA, '«El responsable último de la esterilización del instrumental en cada clínica»', P35, PRIN_PARAFRASIS].map(c => ladoCli(c.slice(1, -1), p31)),
      [true, true, false, false, false]],
    ['CLI-12, pareja del §3.5: el §3.5 sí, el principio no', () => [P35, PRIN].map(c => ladoCli(c.slice(1, -1), p35)), [true, false]],
    ['por la regla del producto: (b) sale; (c) no sale; a caballo → ilegible con su motivo',
      () => [contarPorProducto(R(1, Q(NOR, PRIN)), p31), contarPorProducto(R(2, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), p31), contarPorProducto(R(3, Q(CABALLO, PRIN)), p31)],
      [{ sale: true, motivos: [] }, { sale: false, motivos: [] }, { sale: null, motivos: ['pregunta 2: cita a caballo'] }]],
    ['por la regla del producto: (a), por la pregunta 1', () => contarPorProducto(R(4, `PREGUNTA 1\nSí. ${NOR} ${PRIN}\nPREGUNTA 2\nSí.`), p31), { sale: true, motivos: [] }],
    ['LOS DOS RECUENTOS FALLAN EN DIRECCIONES OPUESTAS: la cita corta del principio pasa el producto y no el ancla; la paráfrasis, al revés',
      () => [R(5, Q(NOR, PRIN_CORTA)), R(6, Q(NOR, PRIN_PARAFRASIS))].map(r => [contarPorAncla(r, p31).sale, contarPorProducto(r, p31).sale]),
      [[null, true], [true, null]]],
    ['a caballo: el ancla la da por buena y el producto no (es la diferencia que el acuerdo obligatorio castiga)',
      // la cita, LITERAL del §2.4, va del permiso hasta dentro de la frase de A: lleva el ancla y toca las dos frases
      () => { const r = R(7, Q('«puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico»', PRIN)); return [contarPorAncla(r, p31).sale, contarPorProducto(r, p31).sale]; },
      [true, null]],
    ['un brazo: el rango, la selección con una fallida, a caballo en su lista, y las coincidencias', () => {
      const b = brazo([[R(1, Q(NOR, PRIN)), { vez: 2, error: 'HTTP 529' }, R(3, Q(CABALLO, PRIN)), R(4, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.')], [R(1, Q(NOR, PRIN_CORTA)), R(2, Q(NOR, PRIN))]], p31, 4);
      return [b.completas, b.fallidas.length, b.ancla.baja, b.ancla.alta, b.producto.baja, b.producto.alta, b.aCaballo, b.coinciden, b.repetir];
      // coinciden 3: la vez 1 (sale en los dos), la 3 (ilegible en los dos) y la 4 (no sale en los dos); discrepa la de la cita corta
    }, [true, 1, 1, 3, 2, 3, ['pulsación 1, vez 3'], 3, false]],
    ['un brazo con 5 ilegibles se repite; con 4, no', () => {
      const raro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), bien = v => R(v, Q(NOR, PRIN));
      return [brazo([[...[1, 2, 3, 4, 5].map(raro), ...[6, 7, 8].map(bien)]], p31, 8).repetir, brazo([[...[1, 2, 3, 4].map(raro), ...[5, 6, 7, 8].map(bien)]], p31, 8).repetir];
    }, [true, false]],
    ['la cuenta por ancla del brazo es la de contar_quinto (el mismo «salió» que su resumen)', () => {
      const rs = [R(1, Q(NOR, PRIN)), R(2, Q(NOR, PRIN_PARAFRASIS)), R(3, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.')];
      return brazo([rs], p31, 3).ancla.sale === rs.filter(r => contar(r, p31).quinto === true).length;
    }, true],
  ];
  // LAS BANDAS, con brazos de mentira: sólo importan pareja, n, completas, repetir y los rangos
  const B = (pareja, aB, aA, pB, pA, extra = {}) => ({ pareja, n: 42, completas: true, repetir: false, ancla: { baja: aB, alta: aA }, producto: { baja: pB, alta: pA }, ...extra });
  casos.push(
    ['banda A: el brazo de retirada cae y las cuatro evaluaciones dan p < 0,05', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 31)).banda, 'A'],
    ['banda A exige las cuatro: si la cota alta de un recuento no llega, es C', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 37)).banda, 'C'],
    ['banda B: diferencia de 2 o menos en las cuatro', () => banda(B('p31', 40, 41, 40, 42), B('p31', 38, 40, 39, 41)).banda, 'B'],
    ['banda B no: una evaluación con diferencia de 3 → C', () => banda(B('p31', 40, 41, 40, 42), B('p31', 37, 40, 39, 41)).banda, 'C'],
    ['si el brazo de retirada sale MÁS, no es A', () => banda(B('p31', 20, 20, 20, 20), B('p31', 40, 40, 40, 40)).banda, 'C'],
    ['las parejas no se comparan entre sí', () => banda(B('p31', 42, 42, 42, 42), B('p35', 30, 30, 30, 30)).banda, null],
    ['un brazo a repetir no da banda', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 30, 30, 30, { repetir: true })).banda, null],
    ['Fisher, contra la cifra del prerregistro: 36 de 42 frente a 42 de 42, p = 0,0258', () => fisher(36, 42, 42, 42).toFixed(4), '0.0258'],
  );
  let mal = 0;
  for (const [nombre, f, esperado] of casos) {
    let sale; try { sale = f(); } catch (e) { sale = `EXCEPCIÓN: ${e.message}`; }
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  console.log(`${casos.length - mal} de ${casos.length}`);
  process.exit(mal ? 1 : 0);
}

// LA ORDEN VA POR VARIABLES DE ENTORNO, NO POR ARGUMENTOS: contar_quinto.mjs, importado arriba y congelado, dispara su propia
// línea de órdenes con CUALQUIER argumento. Así, sin argumentos, aquélla no hace nada.
const ACCION = process.env.ACCION, FICHEROS = (process.env.FICHEROS ?? '').split(',').filter(Boolean);
if (ACCION === 'pruebas') correrPruebas();
else if (ACCION === 'banda') {
  const [b0, bx] = FICHEROS.map(f => JSON.parse(readFileSync(f, 'utf8')));
  const r = banda(b0, bx);
  console.log(r.banda ? `BANDA ${r.banda}` : `SIN BANDA: ${r.motivo}`);
  for (const e of r.evaluaciones ?? []) console.log(`  ${e.recuento}, cota ${e.cota}: retirada ${e.retirada} de ${bx.n} frente a ${e.control} de ${b0.n} · p = ${e.p.toFixed(4)}`);
} else if (ACCION === 'brazo') {
  const pareja = PAREJAS[process.env.PAREJA ?? ''];
  if (!pareja) { console.log(`NO SE CUENTA: PAREJA tiene que ser ${Object.keys(PAREJAS).join(' o ')}`); process.exit(1); }
  const b = brazo(FICHEROS.map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas), pareja, Number(process.env.N ?? 42));
  if (process.env.SALIDA) writeFileSync(process.env.SALIDA, JSON.stringify(b, null, 2));
  const L = [`${pareja.nombre} · n = ${b.n}`, `1 · LAS FALLIDAS: ${b.fallidas.length}${b.fallidas.length ? ' — ' + b.fallidas.join(' · ') : ''}`];
  if (!b.completas) { L.push('NO PUNTUABLE TODAVÍA: faltan respuestas buenas.'); console.log(L.join('\n')); process.exit(0); }
  L.push(`2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla ${b.ancla.ilegibles.length}, por la regla del producto ${b.producto.ilegibles.length} (de ellas, a caballo: ${b.aCaballo.length})`);
  for (const k of ['ancla', 'producto']) for (const i of b[k].ilegibles) L.push(`   ${k}: ${i}`);
  if (b.repetir) { L.push(`SE REPITE: más de ${MAX_ILEGIBLES} ilegibles. No se enseña ningún número de «sale».`); console.log(L.join('\n')); process.exit(0); }
  L.push(`3 · CON CITA: ${b.conCita} de ${b.n}`);
  L.push(`4 · POR ANCLA: sale ${b.ancla.sale}, no sale ${b.ancla.noSale}, ilegibles ${b.ancla.ilegibles.length} → rango ${b.ancla.baja}-${b.ancla.alta}`);
  L.push(`5 · POR LA REGLA DEL PRODUCTO: sale ${b.producto.sale}, no sale ${b.producto.noSale}, ilegibles ${b.producto.ilegibles.length} → rango ${b.producto.baja}-${b.producto.alta}`);
  L.push(`6 · LOS DOS RECUENTOS COINCIDEN EN ${b.coinciden} de ${b.n}${b.discrepan.length ? ' — discrepan: ' + b.discrepan.join(' · ') : ''}`);
  console.log(L.join('\n'));
}
```

### P-F130-23 · LAS CINCO DECISIONES DEL SCRIPT, Y LA VERSIÓN CORREGIDA: HUELLA `c86e2ecbddab3826` (05/11/2026; PENDIENTE DE APROBACIÓN)

**`73bcb6cf21e48809` NO SE APRUEBA** (arquitecto): la decisión 1 cambia el código. **Lo que decidió sobre las cinco:**
1. **RECHAZADA: las cotas van CRUZADAS, ocho evaluaciones** (los cuatro rincones por los dos recuentos). Comparar cota con cota
   mira los dos rincones que no pueden voltear la banda y se salta los dos que sí: baja del 0 con alta del de retirada es el hueco
   más pequeño (el que tumba A); alta del 0 con baja del de retirada, el más grande (el que tumba B). La banda se asigna sólo si las
   ocho la sostienen.
2. **APROBADA** (una cita D limpia vale aunque la sección traiga otra a caballo), **con su recuento a la vista**: la salida nombra
   esos casos. Si son cero o uno, la decisión no pesa; si son muchos, está sosteniendo el resultado.
3. **APROBADA, con TRES categorías**: coinciden y puntúan; coinciden en ilegible; y discrepan (incluye ilegible en un recuento y
   puntuable en el otro). **La regla de «más de 2 discrepancias de 40, se revisa el diseño» mira SÓLO la tercera.**
4. **APROBADA, y es la TERCERA diferencia entre las parejas**: del lado de CLI-12 se cuentan con reglas distintas (en el §3.1 la cita
   tiene que tocar la frase del principio; en el §3.5 basta con salir literal en el párrafo, `SQL_34_06:138-142`). **Al prerregistro:
   LAS DOS PAREJAS NO SE COMPARAN ENTRE SÍ, Y AHORA POR TRES MOTIVOS**: qué apartado enuncia el principio, si A está en el trozo, y
   con qué regla se cuenta el lado de CLI-12.
5. **APROBADA**: las citas se buscan en la sección de la pregunta que afirma el hallazgo, como en el recuento por ancla.

**LAS 16 VERSIONES CON UN FALLO METIDO DE `73bcb6cf21e48809` SALIERON LAS 16 EN ROJO** (de 13 a 19 de 20). **Y en la versión nueva
uno se escapó a la primera, y es el que la regla del contador predice**: con las cotas cruzadas, el margen de B en 3 en vez de 2
pasaba las 25 pruebas, porque ninguna tenía un peor rincón de exactamente 3. Se añadió esa prueba. **Y la prueba de A con cotas
cruzadas no era decisiva** (con la misma cota en los dos brazos también daba C): se cambió por un caso que las separa, encontrado
por script (`decisivas.mjs`), donde la misma cota daría A. **Ahora, 26 de 26 pruebas y 19 versiones con un fallo metido, las 19 en
rojo**, entre ellas la del diseño rechazado (la misma cota en los dos brazos) y las de las tres categorías y la decisión 2.

```js
// LA REGLA DE CUENTA DE P-F130-23, EN CÓDIGO (Code, 05/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Seis brazos (condiciones 0, a, c × parejas §3.1 y §3.5), n = 42 por brazo en dos pulsaciones de 21. Prerregistro y adenda del
// arquitecto (05/11), literales en claude/Predicciones_34_Conflicto_Normativo.md.
// Uso (SIN argumentos; todo por variables de entorno):
//   ACCION=brazo PAREJA=p31|p35 FICHEROS=pulsación1.json,pulsación2.json[,pulsación3.json] [N=42] [SALIDA=brazo.json] node contar_brazos.mjs
//   ACCION=banda FICHEROS=brazo-0.json,brazo-x.json node contar_brazos.mjs     ·     ACCION=pruebas node contar_brazos.mjs
//
// DEPENDE de contar_quinto.mjs (huella e21387a1ff2e7305, aprobada; NO se toca): de ella salen las dos secciones (R1'), el
// veredicto (R2'), las citas (R3) y la cuenta por ancla (R4). Así el RECUENTO POR ANCLA es el mismo código que contó el quinto.
import { readFileSync, writeFileSync } from 'node:fs';
// contar_quinto.mjs dispara su línea de órdenes con CUALQUIER argumento, así que se comprueba ANTES de cargarlo, y se carga después.
if (process.argv[2]) { console.log('NO SE CUENTA: este script no lleva argumentos (ver la cabecera); contar_quinto.mjs los tomaría como suyos.'); process.exit(1); }
const { secciones, veredicto, contar } = await import('./contar_quinto.mjs');

// LOS TEXTOS DE LA REGLA DEL PRODUCTO, copiados POR SCRIPT de SQL_34_06_hallazgos_por_pasada.sql (líneas 85-87 y 96-100), no a
// mano; una prueba comprueba que siguen siendo los del fichero. P24: el párrafo del §2.4 de NOR-10; FRASE_D, su primera frase (el
// permiso); FRASE_A, su segunda («no sustituye…»); P31: el §3.1 de CLI-12; PRINCIPIO, su frase del principio; P35: el §3.5.
export const TEXTOS = {
  "P24": "Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.",
  "FRASE_D": "Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro.",
  "FRASE_A": "El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.",
  "P31": "El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico. Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización. El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico. El Director Clínico es informado de estas decisiones pero no interviene en ellas como autoridad jerárquica.",
  "PRINCIPIO": "Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización.",
  "P35": "En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado."
};

export const ANCLA_NOR = 'puede recaer en el propio Director Clínico';
// LAS DOS PAREJAS (arquitecto, 05/11): el lado de NOR-10 es el MISMO en las dos (el ancla de D). NO SE COMPARAN ENTRE SÍ.
export const PAREJAS = {
  p31: { nombre: 'la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3)', anclaA: ANCLA_NOR, anclasB: ['separar la responsabilidad de un proceso crítico de seguridad del paciente'], deCaso: 'de la pareja', cli: 'p31' },
  p35: { nombre: 'la pareja del §3.5 (NOR-10·4 ↔ CLI-12·6)', anclaA: ANCLA_NOR, anclasB: ['nunca por el Director Clínico del propio centro'], deCaso: 'de la pareja', cli: 'p35' },
};

// LA NORMALIZACIÓN DE SQL_34_06: espacios colapsados, minúsculas y «áéíóúü» → «aeiouu» (translate de la consulta).
export const norm = s => s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/[áéíóúü]/g, c => 'aeiouu'['áéíóúü'.indexOf(c)]);
const T = Object.fromEntries(Object.entries(TEXTOS).map(([k, v]) => [k, norm(v)]));
const tramo = (p, f) => { const i = T[p].indexOf(T[f]); if (i < 0) throw new Error(`${f} no está en ${p}`); return { ini: i, fin: i + T[f].length - 1 }; };
const D = tramo('P24', 'FRASE_D'), A = tramo('P24', 'FRASE_A'), PR = tramo('P31', 'PRINCIPIO');

// LA REGLA DEL PRODUCTO, portada de SQL_34_06 (89-90, 129-142): una cita cuenta si, normalizada, mide 20 caracteres o más, sale
// LITERAL dentro del párrafo, y su tramo toca la frase del caso en al menos un carácter.
const toca = (c, p, t) => { const i = T[p].indexOf(c); return c.length >= 20 && i >= 0 && i <= t.fin && i + c.length - 1 >= t.ini; };
// Lado de NOR-10: 'D' si toca sólo la frase del permiso; 'a caballo' si toca la de D Y la de A (SQL_34_06:135-137: no cuenta en
// ninguna); null si no toca la de D.
export function ladoNor(cita) {
  const c = norm(cita), d = toca(c, 'P24', D), a = toca(c, 'P24', A);
  return d && a ? 'a caballo' : d ? 'D' : null;
}
// Lado de CLI-12: en la pareja del §3.1, la cita toca la frase del principio; en la del §3.5, sale literal en el §3.5 (SQL_34_06
// no le pone tramo: líneas 138-142).
export function ladoCli(cita, pareja) {
  const c = norm(cita);
  return pareja.cli === 'p31' ? toca(c, 'P31', PR) : c.length >= 20 && T.P35.includes(c);
}
// Las citas de una sección, en CRUDO (R3 de contar_quinto las aplana con sus minúsculas; aquí manda la normalización de SQL_34_06).
const citasCrudas = s => [...s.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => m[1] ?? m[2] ?? m[3] ?? '');

// EL RECUENTO POR LA REGLA DEL PRODUCTO: la misma estructura que R4 (las secciones y el veredicto son los de contar_quinto), con
// la regla del producto en vez del ancla. (a) la 1 en «sí» con una cita D y una de CLI-12 → sale; (b) la 2 en «no» igual → sale;
// (c) la 1 en «no» y la 2 en «sí» → no sale. Todo lo demás es ILEGIBLE, con su motivo; «a caballo» es un motivo de ilegible
// (arquitecto, 05/11: es un «no sé» y entra en el rango): cuando una sección que afirma hallazgo no trae ninguna cita D limpia y sí
// una a caballo.
export function contarPorProducto(respuesta, pareja) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { sale: null, motivos: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { sale: null, motivos: ['sin las dos secciones'] };
  const v1 = veredicto(s.p1, 1), v2 = veredicto(s.p2, 2);
  const lados = sec => { const cs = citasCrudas(sec), n = cs.map(ladoNor); return { d: n.includes('D'), caballo: n.includes('a caballo'), cli: cs.some(c => ladoCli(c, pareja)) }; };
  const l1 = lados(s.p1), l2 = lados(s.p2);
  const a = v1 === 'sí' && l1.d && l1.cli, b = v2 === 'no' && l2.d && l2.cli;
  // DECISIÓN 2 (arquitecto, 05/11): una cita D limpia vale aunque la misma sección traiga otra a caballo; la marca lo hace visible
  if (a || b) return { sale: true, motivos: [], limpiaYCaballo: (a && l1.caballo) || (b && l2.caballo) };
  if (v1 === 'no' && v2 === 'sí') return { sale: false, motivos: [] };
  const motivos = [];
  for (const [n, v, l, afirma] of [[1, v1, l1, 'sí'], [2, v2, l2, 'no']]) {
    if (v === null) { motivos.push(`pregunta ${n}: veredicto sin decidir`); continue; }
    if (v !== afirma) continue;
    if (!l.d && l.caballo) motivos.push(`pregunta ${n}: cita a caballo`);
    else if (l.d || l.cli) motivos.push(`pregunta ${n}: hallazgo con un solo lado por la regla del producto`);
    else motivos.push(`pregunta ${n}: hallazgo sin ningún lado por la regla del producto`);
  }
  return { sale: null, motivos };
}

// EL RECUENTO POR ANCLA: R4 de contar_quinto, tal cual, con las anclas de la pareja.
export function contarPorAncla(respuesta, pareja) {
  const r = contar(respuesta, pareja);
  return { sale: r.quinto, motivos: r.cubo1 };
}

// UN BRAZO. La selección es la de los prerregistros del 04/11 (P1): las n primeras respuestas buenas, en orden de pulsación y de
// vez; una fallida no es un «no» y se repone con la siguiente buena. Cada respuesta se cuenta DOS VECES. Por recuento: cuántas
// salen, cuántas no, las ilegibles con su motivo, y el RANGO (cota baja: las ilegibles no salen; cota alta: salen).
// REPETICIÓN (prerregistro): un brazo con MÁS DE 4 ilegibles en cualquiera de los dos recuentos se repite, y la orden lo dice
// ANTES de enseñar ningún número de «sale».
export const MAX_ILEGIBLES = 4;
export function brazo(pulsaciones, pareja, n = 42) {
  const buenas = [], fallidas = [];
  pulsaciones.forEach((rs, p) => rs.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    const mala = !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';
    if (buenas.length >= n) return;
    if (mala) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`);
    else buenas.push({ id, ancla: contarPorAncla(r, pareja), producto: contarPorProducto(r, pareja), conCita: citasCrudas(r.respuesta).length > 0 });
  }));
  const rec = k => {
    const sale = buenas.filter(b => b[k].sale === true).length, ileg = buenas.filter(b => b[k].sale === null);
    return { sale, noSale: buenas.filter(b => b[k].sale === false).length, ilegibles: ileg.map(b => `${b.id}: ${b[k].motivos.join('; ')}`), baja: sale, alta: sale + ileg.length };
  };
  const ancla = rec('ancla'), producto = rec('producto');
  return {
    pareja: pareja.cli, n, completas: buenas.length >= n, fallidas, conCita: buenas.filter(b => b.conCita).length,
    aCaballo: buenas.filter(b => b.producto.motivos.some(m => m.includes('a caballo'))).map(b => b.id),
    ancla, producto,
    // LAS TRES CATEGORÍAS DEL ACUERDO (arquitecto, 05/11): coinciden y puntúan; coinciden en ilegible; y discrepan, que incluye
    // la ilegible en un recuento y puntuable en el otro. La regla de «más de 2 discrepancias» mira SÓLO la tercera.
    coincidenYPuntuan: buenas.filter(b => b.ancla.sale !== null && b.ancla.sale === b.producto.sale).length,
    coincidenEnIlegible: buenas.filter(b => b.ancla.sale === null && b.producto.sale === null).length,
    discrepan: buenas.filter(b => b.ancla.sale !== b.producto.sale).map(b => `${b.id}: ancla ${b.ancla.sale}, producto ${b.producto.sale}`),
    limpiaYCaballo: buenas.filter(b => b.producto.limpiaYCaballo).map(b => b.id),
    repetir: Math.max(ancla.ilegibles.length, producto.ilegibles.length) > MAX_ILEGIBLES,
  };
}

// FISHER EXACTO BILATERAL (suma de las tablas con probabilidad <= la observada), el mismo de las cifras del prerregistro.
const lf = (() => { const t = [0]; for (let i = 1; i <= 400; i++) t[i] = t[i - 1] + Math.log(i); return n => t[n]; })();
const hip = (a, r1, c1, n) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(a) - lf(r1 - a) - lf(c1 - a) - lf(n - r1 - c1 + a));
export function fisher(a, n1, b, n2) {
  const c1 = a + b, n = n1 + n2, lo = Math.max(0, c1 - n2), hi = Math.min(n1, c1), p0 = hip(a, n1, c1, n);
  let s = 0; for (let x = lo; x <= hi; x++) { const p = hip(x, n1, c1, n); if (p <= p0 * (1 + 1e-7)) s += p; } return Math.min(1, s);
}

// LA BANDA de un brazo de retirada frente a su brazo 0, DENTRO DE LA MISMA PAREJA (las parejas no se comparan entre sí).
// LAS COTAS VAN CRUZADAS (arquitecto, 05/11): de cada brazo sólo se sabe que su valor está entre su cota baja y su alta, así que
// la banda tiene que aguantar con CUALQUIER pareja de valores, y los rincones que la pueden voltear son los cruzados (baja del 0
// con alta del de retirada, el hueco más pequeño; alta del 0 con baja del de retirada, el más grande). Ocho evaluaciones: los
// cuatro rincones por los dos recuentos. A: en las ocho, el brazo de retirada sale MENOS que el 0 y Fisher da p < 0,05. B: en las
// ocho, la diferencia es de 2 o menos. Si no, C. Un brazo que haya que repetir, o incompleto, no da banda.
export function banda(b0, bx) {
  if (b0.pareja !== bx.pareja) return { banda: null, motivo: 'las parejas no se comparan entre sí' };
  for (const [nom, b] of [['el brazo 0', b0], ['el brazo de retirada', bx]]) {
    if (!b.completas) return { banda: null, motivo: `${nom} no tiene sus ${b.n} respuestas` };
    if (b.repetir) return { banda: null, motivo: `${nom} tiene más de ${MAX_ILEGIBLES} ilegibles: se repite` };
  }
  const ev = [];
  for (const k of ['ancla', 'producto']) for (const c0 of ['baja', 'alta']) for (const cx of ['baja', 'alta']) {
    const x = bx[k][cx], o = b0[k][c0];
    ev.push({ recuento: k, cota0: c0, cotaX: cx, retirada: x, control: o, p: fisher(x, bx.n, o, b0.n) });
  }
  const A = ev.every(e => e.retirada < e.control && e.p < 0.05), B = ev.every(e => Math.abs(e.retirada - e.control) <= 2);
  return { banda: A ? 'A' : B ? 'B' : 'C', evaluaciones: ev };
}

// LAS PRUEBAS (respuestas INVENTADAS)
function correrPruebas() {
  const R = (vez, respuesta) => ({ vez, respuesta });
  const p31 = PAREJAS.p31, p35 = PAREJAS.p35;
  // las citas, inventadas pero LITERALES de los textos de SQL_34_06
  const NOR = '«figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»';
  const CABALLO = '«experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico»';
  const SOLO_A = '«El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última»';
  const PRIN = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico»';
  const PRIN_CORTA = '«de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»'; // literal, sin el ancla
  const PRIN_PARAFRASIS = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de quien dirige la clínica»'; // con el ancla, no literal
  const P35 = '«nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones»';
  const Q = (c1, c2) => `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. ${c1} ${c2} norma_contra_norma`;
  const casos = [
    ['los textos son los de SQL_34_06 (líneas 85-87 y 96-100), y cada frase está dentro de su párrafo', () => {
      const l = readFileSync('E:/Doc-Hub/SQL_34_06_hallazgos_por_pasada.sql', 'utf8').replace(/\r\n/g, '\n').split('\n');
      const lit = i => [...l[i].matchAll(/'((?:[^']|'')*)'/g)].map(m => m[1].replace(/''/g, "'"));
      const fila = c => l.slice(95, 101).map((x, i) => lit(95 + i)).find(v => v[0] === 'NOR-10' && v[1] === c && v[2].includes('puede recaer'));
      return [TEXTOS.P35 === lit(84)[0], TEXTOS.P31 === lit(85)[0], TEXTOS.PRINCIPIO === lit(86)[0],
        TEXTOS.P24 === fila('D')[2], TEXTOS.FRASE_D === fila('D')[3], TEXTOS.FRASE_A === fila('A')[3]];
    }, [true, true, true, true, true, true]],
    ['norm: tildes, mayúsculas y espacios, como la consulta', () => norm('  Clínica\n  ÚLTIMA  '), 'clinica ultima'],
    ['NOR-10: el permiso → D; las dos frases → a caballo; sólo A → nada; corta → nada; no literal → nada',
      () => [NOR, CABALLO, SOLO_A, '«recaer en el propio»', '«figura que podría recaer en el propio Director Clínico»'].map(c => ladoNor(c.slice(1, -1))),
      ['D', 'a caballo', null, null, null]],
    ['CLI-12, pareja del §3.1: el principio sí (también corto), fuera del principio no, el §3.5 no, una paráfrasis no',
      () => [PRIN, PRIN_CORTA, '«El responsable último de la esterilización del instrumental en cada clínica»', P35, PRIN_PARAFRASIS].map(c => ladoCli(c.slice(1, -1), p31)),
      [true, true, false, false, false]],
    ['CLI-12, pareja del §3.5: el §3.5 sí, el principio no', () => [P35, PRIN].map(c => ladoCli(c.slice(1, -1), p35)), [true, false]],
    ['por la regla del producto: (b) sale; (c) no sale; a caballo → ilegible con su motivo',
      () => [contarPorProducto(R(1, Q(NOR, PRIN)), p31), contarPorProducto(R(2, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), p31), contarPorProducto(R(3, Q(CABALLO, PRIN)), p31)],
      [{ sale: true, motivos: [], limpiaYCaballo: false }, { sale: false, motivos: [] }, { sale: null, motivos: ['pregunta 2: cita a caballo'] }]],
    ['DECISIÓN 2: cita D limpia y otra a caballo en la misma sección → sale, y queda marcada', () => contarPorProducto(R(8, Q(NOR + ' ' + CABALLO, PRIN)), p31), { sale: true, motivos: [], limpiaYCaballo: true }],
    ['por la regla del producto: (a), por la pregunta 1', () => contarPorProducto(R(4, `PREGUNTA 1\nSí. ${NOR} ${PRIN}\nPREGUNTA 2\nSí.`), p31), { sale: true, motivos: [], limpiaYCaballo: false }],
    ['LOS DOS RECUENTOS FALLAN EN DIRECCIONES OPUESTAS: la cita corta del principio pasa el producto y no el ancla; la paráfrasis, al revés',
      () => [R(5, Q(NOR, PRIN_CORTA)), R(6, Q(NOR, PRIN_PARAFRASIS))].map(r => [contarPorAncla(r, p31).sale, contarPorProducto(r, p31).sale]),
      [[null, true], [true, null]]],
    ['a caballo: el ancla la da por buena y el producto no (es la diferencia que el acuerdo obligatorio castiga)',
      // la cita, LITERAL del §2.4, va del permiso hasta dentro de la frase de A: lleva el ancla y toca las dos frases
      () => { const r = R(7, Q('«puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico»', PRIN)); return [contarPorAncla(r, p31).sale, contarPorProducto(r, p31).sale]; },
      [true, null]],
    ['un brazo: el rango, la selección con una fallida, a caballo en su lista, y las coincidencias', () => {
      const b = brazo([[R(1, Q(NOR, PRIN)), { vez: 2, error: 'HTTP 529' }, R(3, Q(CABALLO, PRIN)), R(4, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.')], [R(1, Q(NOR, PRIN_CORTA)), R(2, Q(NOR, PRIN))]], p31, 4);
      return [b.completas, b.fallidas.length, b.ancla.baja, b.ancla.alta, b.producto.baja, b.producto.alta, b.aCaballo, b.coincidenYPuntuan, b.coincidenEnIlegible, b.discrepan.length, b.repetir];
      // las tres categorías: puntúan y coinciden la vez 1 (sale) y la 4 (no sale); coincide en ilegible la 3; discrepa la de la cita corta
    }, [true, 1, 1, 3, 2, 3, ['pulsación 1, vez 3'], 2, 1, 1, false]],
    ['un brazo cuenta y nombra los casos de la decisión 2', () => brazo([[R(1, Q(NOR + ' ' + CABALLO, PRIN)), R(2, Q(NOR, PRIN))]], p31, 2).limpiaYCaballo, ['pulsación 1, vez 1']],
    ['un brazo con 5 ilegibles se repite; con 4, no', () => {
      const raro = v => R(v, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), bien = v => R(v, Q(NOR, PRIN));
      return [brazo([[...[1, 2, 3, 4, 5].map(raro), ...[6, 7, 8].map(bien)]], p31, 8).repetir, brazo([[...[1, 2, 3, 4].map(raro), ...[5, 6, 7, 8].map(bien)]], p31, 8).repetir];
    }, [true, false]],
    ['la cuenta por ancla del brazo es la de contar_quinto (el mismo «salió» que su resumen)', () => {
      const rs = [R(1, Q(NOR, PRIN)), R(2, Q(NOR, PRIN_PARAFRASIS)), R(3, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.')];
      return brazo([rs], p31, 3).ancla.sale === rs.filter(r => contar(r, p31).quinto === true).length;
    }, true],
  ];
  // LAS BANDAS, con brazos de mentira: sólo importan pareja, n, completas, repetir y los rangos
  const B = (pareja, aB, aA, pB, pA, extra = {}) => ({ pareja, n: 42, completas: true, repetir: false, ancla: { baja: aB, alta: aA }, producto: { baja: pB, alta: pA }, ...extra });
  casos.push(
    ['banda A: el brazo de retirada cae y las cuatro evaluaciones dan p < 0,05', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 31)).banda, 'A'],
    ['banda A exige los ocho: si la cota alta de un recuento no llega, es C', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 37)).banda, 'C'],
    ['COTAS CRUZADAS, banda A: el rincón del hueco más pequeño (baja del 0, alta del de retirada) la tumba aunque los rincones iguales aguanten', () => banda(B('p31', 30, 31, 30, 31), B('p31', 20, 21, 20, 21)).banda, 'C'], // con la misma cota en los dos brazos sería A (decisivas.mjs)
    ['COTAS CRUZADAS, banda B: el rincón del hueco más grande (alta del 0, baja del de retirada) la tumba aunque los rincones iguales aguanten', () => banda(B('p31', 38, 41, 38, 41), B('p31', 37, 40, 37, 40)).banda, 'C'],
    ['banda B: el margen es de 2, no de 3 (el peor rincón cruzado da 3 → C)', () => banda(B('p31', 40, 41, 40, 41), B('p31', 38, 39, 38, 39)).banda, 'C'],
    ['son ocho evaluaciones', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 31)).evaluaciones.length, 8],
    ['banda B: diferencia de 2 o menos en los ocho', () => banda(B('p31', 40, 41, 40, 41), B('p31', 39, 40, 39, 40)).banda, 'B'],
    ['banda B no: una evaluación con diferencia de 3 → C', () => banda(B('p31', 40, 41, 40, 42), B('p31', 37, 40, 39, 41)).banda, 'C'],
    ['si el brazo de retirada sale MÁS, no es A', () => banda(B('p31', 20, 20, 20, 20), B('p31', 40, 40, 40, 40)).banda, 'C'],
    ['las parejas no se comparan entre sí', () => banda(B('p31', 42, 42, 42, 42), B('p35', 30, 30, 30, 30)).banda, null],
    ['un brazo a repetir no da banda', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 30, 30, 30, { repetir: true })).banda, null],
    ['Fisher, contra la cifra del prerregistro: 36 de 42 frente a 42 de 42, p = 0,0258', () => fisher(36, 42, 42, 42).toFixed(4), '0.0258'],
  );
  let mal = 0;
  for (const [nombre, f, esperado] of casos) {
    let sale; try { sale = f(); } catch (e) { sale = `EXCEPCIÓN: ${e.message}`; }
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  console.log(`${casos.length - mal} de ${casos.length}`);
  process.exit(mal ? 1 : 0);
}

// LA ORDEN VA POR VARIABLES DE ENTORNO, NO POR ARGUMENTOS: contar_quinto.mjs, importado arriba y congelado, dispara su propia
// línea de órdenes con CUALQUIER argumento. Así, sin argumentos, aquélla no hace nada.
const ACCION = process.env.ACCION, FICHEROS = (process.env.FICHEROS ?? '').split(',').filter(Boolean);
if (ACCION === 'pruebas') correrPruebas();
else if (ACCION === 'banda') {
  const [b0, bx] = FICHEROS.map(f => JSON.parse(readFileSync(f, 'utf8')));
  const r = banda(b0, bx);
  console.log(r.banda ? `BANDA ${r.banda}` : `SIN BANDA: ${r.motivo}`);
  for (const e of r.evaluaciones ?? []) console.log(`  ${e.recuento}, cota ${e.cota0} del 0 y ${e.cotaX} del de retirada: retirada ${e.retirada} de ${bx.n} frente a ${e.control} de ${b0.n} · p = ${e.p.toFixed(4)}`);
} else if (ACCION === 'brazo') {
  const pareja = PAREJAS[process.env.PAREJA ?? ''];
  if (!pareja) { console.log(`NO SE CUENTA: PAREJA tiene que ser ${Object.keys(PAREJAS).join(' o ')}`); process.exit(1); }
  const b = brazo(FICHEROS.map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas), pareja, Number(process.env.N ?? 42));
  if (process.env.SALIDA) writeFileSync(process.env.SALIDA, JSON.stringify(b, null, 2));
  const L = [`${pareja.nombre} · n = ${b.n}`, `1 · LAS FALLIDAS: ${b.fallidas.length}${b.fallidas.length ? ' — ' + b.fallidas.join(' · ') : ''}`];
  if (!b.completas) { L.push('NO PUNTUABLE TODAVÍA: faltan respuestas buenas.'); console.log(L.join('\n')); process.exit(0); }
  L.push(`2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla ${b.ancla.ilegibles.length}, por la regla del producto ${b.producto.ilegibles.length} (de ellas, a caballo: ${b.aCaballo.length})`);
  for (const k of ['ancla', 'producto']) for (const i of b[k].ilegibles) L.push(`   ${k}: ${i}`);
  if (b.repetir) { L.push(`SE REPITE: más de ${MAX_ILEGIBLES} ilegibles. No se enseña ningún número de «sale».`); console.log(L.join('\n')); process.exit(0); }
  L.push(`3 · CON CITA: ${b.conCita} de ${b.n}`);
  L.push(`4 · POR ANCLA: sale ${b.ancla.sale}, no sale ${b.ancla.noSale}, ilegibles ${b.ancla.ilegibles.length} → rango ${b.ancla.baja}-${b.ancla.alta}`);
  L.push(`5 · POR LA REGLA DEL PRODUCTO: sale ${b.producto.sale}, no sale ${b.producto.noSale}, ilegibles ${b.producto.ilegibles.length} → rango ${b.producto.baja}-${b.producto.alta}`);
  L.push(`6 · LOS DOS RECUENTOS: coinciden y puntúan ${b.coincidenYPuntuan} · coinciden en ilegible ${b.coincidenEnIlegible} · DISCREPAN ${b.discrepan.length}${b.discrepan.length ? ' — ' + b.discrepan.join(' · ') : ''}`);
  L.push(`7 · DECISIÓN 2, cita D limpia y otra a caballo en la misma sección (cuenta la limpia): ${b.limpiaYCaballo.length}${b.limpiaYCaballo.length ? ' — ' + b.limpiaYCaballo.join(' · ') : ''}`);
  console.log(L.join('\n'));
}
```

### P-F130-23 · LA COMPROBACIÓN DE LA CONDICIÓN 1, CON EL GUION APROBADO: LAS TRES CORRIDAS SALEN «SE REPITE» (Code, 05/11/2026)

**La huella `c86e2ecbddab3826`, APROBADA** (arquitecto, 05/11), comprobada antes de contar, y `contar_quinto.mjs` con la suya,
`e21387a1ff2e7305`. Tres corridas, como pidió el arquitecto (cada tanda de 20 sola, y las dos juntas), pareja del §3.1:

```
===== CORRIDA 1 (N=20)
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 20
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 10, por la regla del producto 13 (de ellas, a caballo: 0)
   ancla: pulsación 1, vez 3: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 5: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 8: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 9: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 10: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 11: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 12: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 13: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 17: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 18: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 2: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 3: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 5: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 8: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 9: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 10: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 11: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 12: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 13: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 14: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 15: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 17: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 18: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
===== CORRIDA 2 (N=20)
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 20
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 10, por la regla del producto 13 (de ellas, a caballo: 0)
   ancla: pulsación 1, vez 2: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 3: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 4: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo sin las anclas de la pareja
   ancla: pulsación 1, vez 5: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 8: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 11: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 12: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 14: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo sin las anclas de la pareja
   ancla: pulsación 1, vez 15: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 20: pregunta 1: hallazgo sin las anclas de la pareja
   producto: pulsación 1, vez 1: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 2: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 3: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 4: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo sin ningún lado por la regla del producto
   producto: pulsación 1, vez 5: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 6: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 8: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 10: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo sin ningún lado por la regla del producto
   producto: pulsación 1, vez 11: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 12: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 14: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo sin ningún lado por la regla del producto
   producto: pulsación 1, vez 15: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 20: pregunta 1: hallazgo sin ningún lado por la regla del producto
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
===== CORRIDA 3 (N=40)
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 40
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 20, por la regla del producto 26 (de ellas, a caballo: 0)
   ancla: pulsación 1, vez 3: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 5: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 8: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 9: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 10: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 11: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 12: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 13: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 1, vez 17: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 1, vez 18: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 2, vez 2: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 2, vez 3: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 2, vez 4: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo sin las anclas de la pareja
   ancla: pulsación 2, vez 5: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 2, vez 8: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 2, vez 11: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 2, vez 12: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: veredicto sin decidir
   ancla: pulsación 2, vez 14: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo sin las anclas de la pareja
   ancla: pulsación 2, vez 15: pregunta 1: hallazgo sin las anclas de la pareja; pregunta 2: hallazgo con una sola de las dos anclas
   ancla: pulsación 2, vez 20: pregunta 1: hallazgo sin las anclas de la pareja
   producto: pulsación 1, vez 2: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 3: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 5: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 8: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 9: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 10: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 11: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 12: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 13: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 14: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 15: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 1, vez 17: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 1, vez 18: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 2, vez 1: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 2, vez 2: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 2, vez 3: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 2, vez 4: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo sin ningún lado por la regla del producto
   producto: pulsación 2, vez 5: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 2, vez 6: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 2, vez 8: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 2, vez 10: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo sin ningún lado por la regla del producto
   producto: pulsación 2, vez 11: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 2, vez 12: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: veredicto sin decidir
   producto: pulsación 2, vez 14: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo sin ningún lado por la regla del producto
   producto: pulsación 2, vez 15: pregunta 1: hallazgo sin ningún lado por la regla del producto; pregunta 2: hallazgo con un solo lado por la regla del producto
   producto: pulsación 2, vez 20: pregunta 1: hallazgo sin ningún lado por la regla del producto
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
```
*(La primera vez, la corrida 3 falló al abrir el segundo fichero —una ruta `/e/…` dentro de la lista que el shell no traduce— y no
contó nada; se repitió con `E:/…`. Es la que está arriba.)*

**LO QUE DICEN, sin enseñar ningún «sale» (el guion no los enseña, y no se han calculado por otra vía):**
- **Ilegibles: 10 y 13 de 20 en la primera tanda, 10 y 13 de 20 en la repetida, 20 y 26 de 40 juntas** (por ancla y por la regla del
  producto). **«A caballo»: 0 en las tres.** Las tres, muy por encima del tope de 4: SE REPITE.
- **Las 46 líneas de ilegibles de la corrida de 40 empiezan por el mismo motivo: «pregunta 1: hallazgo sin las anclas de la
  pareja»** (o «sin ningún lado por la regla del producto»). Es decir: la pregunta 1 dice que HAY hallazgo, y su sección no cita la
  pareja de D. Y R4, la regla congelada, lee ese caso como ilegible: sólo deja «no sale» cuando la 1 dice «no» y la 2 dice «sí» (su
  caso (c)). **En una pareja que lleva A dentro de los dos trozos**, una pregunta 1 que afirma hallazgo sin las frases de D es lo
  esperable —se ve en los motivos, no se ha leído qué cita—, así que la respuesta sólo es legible si la pregunta 2 trae D con las dos
  anclas.
- **El Fisher entre las dos tandas que pidió el arquitecto no se da**: el guion no enseña el número de «sale» de un brazo a repetir,
  y calcularlo por otra vía sería saltarse su propia regla.
- **Es un hallazgo de DISEÑO, no de recuento**, y lo decide el arquitecto. Code no ha tocado el guion.

### P-F130-23 · LA ADENDA 2 AL PRERREGISTRO, LITERAL (arquitecto, 05/11/2026, antes de correr ningún brazo)

Sacada del registro de la conversación con un script. **La regla (ii), tal como la escribió el arquitecto** (05/11):
- «Sale: la pregunta 1 trae D con las dos anclas, o la pregunta 2 dice "no se pueden cumplir" con las dos anclas.»
- «No sale: la pregunta 1 trae cualquier cosa que no sea D (o nada) y la pregunta 2 dice "sí se pueden cumplir".»
- «Ilegible: la pregunta 2 no decide nada, con independencia de lo que traiga la 1. Ese núcleo de R4 sobrevive y no se toca.»
- Idéntica en los seis brazos. Y en los mutantes, uno explícito: la vuelta a R4 tiene que salir en rojo.

```
ADENDA 2 AL PRERREGISTRO DE P-F130-23 · 05/11/2026, antes de correr ningún brazo.

MOTIVO: la comprobación en seco sobre las 40 respuestas archivadas de la
condición 1 salió «SE REPITE» en las tres corridas: 10 ilegibles de 20 por
ancla y 13 de 20 por la regla del producto, iguales en las dos tandas.

CAUSA: R4, la regla de legibilidad con la que se contó el quinto, lee un
hallazgo de la pregunta 1 sin las anclas de la pareja como ILEGIBLE. En la
pareja del quinto eso era correcto porque no había otro caso dentro. En las
parejas de D, A vive en los mismos trozos, así que la pregunta 1 afirma
hallazgos legítimamente y R4 convierte en ilegible lo que es simplemente
«no es D». Con R4, estos brazos se repetirían indefinidamente.

CAMBIO: se adopta la regla (ii). Un hallazgo de la pregunta 1 sin las anclas
es OTRO HALLAZGO, no ilegible. Sale / no sale / ilegible quedan definidos como
en el encargo del arquitecto del 05/11, 11:18. El núcleo de R4 —la pregunta 2
sin decidir es ilegible— se mantiene.

SE DESCARTA la opción de medir D sólo por la pregunta 2: el bloque del
principio está redactado en el lenguaje del conflicto normativo, que es el de
la pregunta 2, de modo que el tratamiento puede mover el canal de la medición.
UNA MEDICIÓN NO PUEDE PASAR POR UN CANAL QUE EL TRATAMIENTO PUEDE MOVER.

LO QUE MANTIENE VIVO ESTE PRERREGISTRO: el cambio se decidió SIN QUE NADIE
VIERA NINGUNA CIFRA DE «SALE». El guion se negó a mostrarlas en un brazo
marcado «SE REPITE» y no se calcularon por otra vía.

CERRADO EN LA MISMA COMPROBACIÓN: la regla «a caballo» descarta 0 de 40. Con
40 observaciones se descarta una tasa superior al 8,8 % (Wilson 95 %). Deja de
ser un riesgo del diseño.

PENDIENTE QUE ESTO ABRE, Y NO ES DE P-F130-23: el plan del paso 4 preveía
comparar la tanda de 42 de D contra los 12 de 21 del quinto. Esas dos
mediciones NO comparten regla de legibilidad, y ahora se sabe por qué: R4
muerde distinto según haya o no otro caso dentro de la pareja. Esa comparación
queda en cuarentena hasta que se decida con qué regla se rehace.
```

⚠️ **DOS HUECOS QUE CODE MARCA ANTES DE ESCRIBIR LA REGLA EN EL GUION** (pendientes de decisión del arquitecto; nada cambiado):
1. **La pregunta 1 trae D con las dos anclas y la 2 no decide**: la primera línea dice «sale»; la tercera, «ilegible, con
   independencia de lo que traiga la 1». R4 la daba como «sale».
2. **La pregunta 2 dice «no se pueden cumplir» SIN las dos anclas, y la 1 no trae D**: no es «sale» (faltan anclas), no es «no
   sale» (la 2 no dice «sí») y no es «ilegible» (la 2 decide). R4 la daba como ilegible.

### P-F130-23 · LA REGLA (ii), CERRADA Y EXHAUSTIVA, Y EL GUION QUE LA LLEVA: HUELLA `527b3ad22bb79110` (05/11/2026; PENDIENTE DE APROBACIÓN)

**Los dos huecos, cerrados por el arquitecto** (05/11): **1 → SALE** (el silencio de la pregunta 2 no retira una afirmación hecha
con las dos citas; su tercera línea, que se pisaba con la primera, se estrecha). **2 → la propuesta de Code, corregida**: sin ninguna
ancla es OTRO hallazgo y no sale; y **PARCIAL es ilegible DONDE SEA, en la 1 y en la 2** (tratarlo distinto según la casilla dejaría
que el bloque moviera la clasificación cambiando de casilla: el mismo confundido por el que se descartó la (i)). El arquitecto apunta
que su autocontradicción es el mismo defecto que se le achaca a Fable.

**LA REGLA, como la escribió el arquitecto**: cada pregunta se clasifica en D (las dos anclas), PARCIAL (exactamente una, o una
fuera de comillas), OTRO (ninguna), NIEGA (no hay conflicto / se pueden cumplir) o NADA (no decide); y la respuesta cae, en este
orden, en (1) SALE si alguna es D; (2) ILEGIBLE si hay un PARCIAL; (3) ILEGIBLE si la 2 es NADA; (4) NO SALE si la 2 es NIEGA u
OTRO, dé lo que dé la 1. Caso límite escrito: la 1 en D y la 2 en PARCIAL, SALE.
**En el guion**: `casilla(c1, c2)` con esas cuatro líneas. Por la regla del producto, «a caballo» sin una D limpia es PARCIAL (el
«no sé» de la adenda 1). **Por ancla, las clases SE LE PREGUNTAN a R4** (`contar` de `contar_quinto.mjs`, intacto): su cubo dice,
por pregunta, «veredicto sin decidir» (NADA), «fuera de comillas» o «una sola de las dos anclas» (PARCIAL), «sin las anclas» (OTRO), y
la pregunta que no sale en el cubo contestó lo contrario de afirmar (NIEGA); no se recalcula nada.

**La exhaustividad, comprobada ENUMERANDO** (el arquitecto pidió que Code la hiciera también): una prueba con las 25 combinaciones,
**escritas a mano desde el texto del arquitecto**, fila = la pregunta 1 y columna = la 2, en el orden D, PARCIAL, OTRO, NIEGA, NADA
(S sale, I ilegible, N no sale): `SSSSS · SIIII · SINNI · SINNI · SINNI`. Cada celda, una casilla y sólo una.
**El PARCIAL simétrico sí cambia algo observable**: con el asimétrico, la fila PARCIAL sería `SINNI` y no `SIIII` (la 1 con una sola
ancla y la 2 negando saldría «no sale» en vez de ilegible); lo acreditan dos pruebas, una por recuento.

**34 de 34 pruebas. 29 versiones con un fallo metido, las 29 en rojo**, entre ellas: LA VUELTA A R4; cada una de las cuatro ramas
rota por separado; el PARCIAL asimétrico; y las lecturas de las clases de R4 cambiadas. `contar_quinto.mjs`, con su huella
`e21387a1ff2e7305`.

```js
// LA REGLA DE CUENTA DE P-F130-23, EN CÓDIGO (Code, 05/11/2026), escrita ANTES de la tanda y congelada por su huella.
// Seis brazos (condiciones 0, a, c × parejas §3.1 y §3.5), n = 42 por brazo en dos pulsaciones de 21. Prerregistro y adenda del
// arquitecto (05/11), literales en claude/Predicciones_34_Conflicto_Normativo.md.
// Uso (SIN argumentos; todo por variables de entorno):
//   ACCION=brazo PAREJA=p31|p35 FICHEROS=pulsación1.json,pulsación2.json[,pulsación3.json] [N=42] [SALIDA=brazo.json] node contar_brazos.mjs
//   ACCION=banda FICHEROS=brazo-0.json,brazo-x.json node contar_brazos.mjs     ·     ACCION=pruebas node contar_brazos.mjs
//
// DEPENDE de contar_quinto.mjs (huella e21387a1ff2e7305, aprobada; NO se toca): de ella salen las dos secciones (R1'), el
// veredicto (R2'), las citas (R3) y la cuenta por ancla (R4). Así el RECUENTO POR ANCLA es el mismo código que contó el quinto.
import { readFileSync, writeFileSync } from 'node:fs';
// contar_quinto.mjs dispara su línea de órdenes con CUALQUIER argumento, así que se comprueba ANTES de cargarlo, y se carga después.
if (process.argv[2]) { console.log('NO SE CUENTA: este script no lleva argumentos (ver la cabecera); contar_quinto.mjs los tomaría como suyos.'); process.exit(1); }
const { secciones, veredicto, contar } = await import('./contar_quinto.mjs');

// LOS TEXTOS DE LA REGLA DEL PRODUCTO, copiados POR SCRIPT de SQL_34_06_hallazgos_por_pasada.sql (líneas 85-87 y 96-100), no a
// mano; una prueba comprueba que siguen siendo los del fichero. P24: el párrafo del §2.4 de NOR-10; FRASE_D, su primera frase (el
// permiso); FRASE_A, su segunda («no sustituye…»); P31: el §3.1 de CLI-12; PRINCIPIO, su frase del principio; P35: el §3.5.
export const TEXTOS = {
  "P24": "Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.",
  "FRASE_D": "Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro.",
  "FRASE_A": "El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última descrita en el apartado 2.1, sino que actúa como apoyo operativo directo.",
  "P31": "El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico. Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización. El Coordinador de Calidad es quien autoriza cualquier excepción documentada al protocolo de esterilización, quien firma los registros de auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control biológico. El Director Clínico es informado de estas decisiones pero no interviene en ellas como autoridad jerárquica.",
  "PRINCIPIO": "Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el rigor exigido en esterilización.",
  "P35": "En ausencia programada o imprevista del Coordinador de Calidad (vacaciones, baja), sus funciones son asumidas temporalmente por el Coordinador de Calidad de otra clínica de la red, nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1. Esta sustitución se comunica formalmente a todo el personal del centro afectado."
};

export const ANCLA_NOR = 'puede recaer en el propio Director Clínico';
// LAS DOS PAREJAS (arquitecto, 05/11): el lado de NOR-10 es el MISMO en las dos (el ancla de D). NO SE COMPARAN ENTRE SÍ.
export const PAREJAS = {
  p31: { nombre: 'la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3)', anclaA: ANCLA_NOR, anclasB: ['separar la responsabilidad de un proceso crítico de seguridad del paciente'], deCaso: 'de la pareja', cli: 'p31' },
  p35: { nombre: 'la pareja del §3.5 (NOR-10·4 ↔ CLI-12·6)', anclaA: ANCLA_NOR, anclasB: ['nunca por el Director Clínico del propio centro'], deCaso: 'de la pareja', cli: 'p35' },
};

// LA NORMALIZACIÓN DE SQL_34_06: espacios colapsados, minúsculas y «áéíóúü» → «aeiouu» (translate de la consulta).
export const norm = s => s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/[áéíóúü]/g, c => 'aeiouu'['áéíóúü'.indexOf(c)]);
const T = Object.fromEntries(Object.entries(TEXTOS).map(([k, v]) => [k, norm(v)]));
const tramo = (p, f) => { const i = T[p].indexOf(T[f]); if (i < 0) throw new Error(`${f} no está en ${p}`); return { ini: i, fin: i + T[f].length - 1 }; };
const D = tramo('P24', 'FRASE_D'), A = tramo('P24', 'FRASE_A'), PR = tramo('P31', 'PRINCIPIO');

// LA REGLA DEL PRODUCTO, portada de SQL_34_06 (89-90, 129-142): una cita cuenta si, normalizada, mide 20 caracteres o más, sale
// LITERAL dentro del párrafo, y su tramo toca la frase del caso en al menos un carácter.
const toca = (c, p, t) => { const i = T[p].indexOf(c); return c.length >= 20 && i >= 0 && i <= t.fin && i + c.length - 1 >= t.ini; };
// Lado de NOR-10: 'D' si toca sólo la frase del permiso; 'a caballo' si toca la de D Y la de A (SQL_34_06:135-137: no cuenta en
// ninguna); null si no toca la de D.
export function ladoNor(cita) {
  const c = norm(cita), d = toca(c, 'P24', D), a = toca(c, 'P24', A);
  return d && a ? 'a caballo' : d ? 'D' : null;
}
// Lado de CLI-12: en la pareja del §3.1, la cita toca la frase del principio; en la del §3.5, sale literal en el §3.5 (SQL_34_06
// no le pone tramo: líneas 138-142).
export function ladoCli(cita, pareja) {
  const c = norm(cita);
  return pareja.cli === 'p31' ? toca(c, 'P31', PR) : c.length >= 20 && T.P35.includes(c);
}
// Las citas de una sección, en CRUDO (R3 de contar_quinto las aplana con sus minúsculas; aquí manda la normalización de SQL_34_06).
const citasCrudas = s => [...s.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => m[1] ?? m[2] ?? m[3] ?? '');

// LA REGLA (ii), EXHAUSTIVA (arquitecto, 05/11; adenda 2 y su cierre de los dos huecos). R4 se escribió para el quinto, cuya pareja
// no lleva otro caso dentro; en las de D vive A en los mismos trozos, y R4 leía «la 1 encontró algo que no es D» como ilegible.
// Cada pregunta se clasifica por separado en cinco valores:
//   D        afirma el conflicto con LAS DOS anclas;
//   PARCIAL  afirma algo con exactamente una de las dos, o con un ancla fuera de comillas (o, por la regla del producto, con una
//            cita a caballo y ninguna D limpia: un «no sé», adenda 1);
//   OTRO     afirma algo sin ninguna de las dos;
//   NIEGA    contesta lo contrario de afirmar (la 1 en «no», la 2 en «sí se pueden cumplir»);
//   NADA     no decide.
// Y la respuesta cae en UNA casilla, en este orden: (1) SALE si alguna de las dos es D; (2) ILEGIBLE si no, y hay un PARCIAL en
// cualquiera de las dos (simétrico a propósito: tratarlo distinto según la casilla dejaría que el bloque moviera la clasificación
// cambiando de casilla); (3) ILEGIBLE si no, y la 2 es NADA (el núcleo de R4 que sobrevive); (4) NO SALE en el resto: la 2 es NIEGA
// u OTRO, y la 1 da igual. La exhaustividad se comprueba ENUMERANDO las 25 combinaciones (prueba abajo), no leyendo la regla.
export function casilla(c1, c2) {
  if (c1 === 'D' || c2 === 'D') return true;
  if (c1 === 'PARCIAL' || c2 === 'PARCIAL') return null;
  if (c2 === 'NADA') return null;
  return false;
}
export const CLASES = ['D', 'PARCIAL', 'OTRO', 'NIEGA', 'NADA'];
const conMotivos = (c1, c2, extra = {}, detalle = ['', '']) => ({ sale: casilla(c1, c2), motivos: casilla(c1, c2) === null ? [`pregunta 1: ${c1}${detalle[0]}`, `pregunta 2: ${c2}${detalle[1]}`] : [], clases: [c1, c2], ...extra });

// EL RECUENTO POR LA REGLA DEL PRODUCTO: las clases salen de las citas de cada sección con la regla portada de SQL_34_06.
export function contarPorProducto(respuesta, pareja) {
  if (!respuesta || typeof respuesta.respuesta !== 'string' || respuesta.respuesta.trim() === '') return { sale: null, motivos: ['sin respuesta'] };
  const s = secciones(respuesta.respuesta);
  if (!s) return { sale: null, motivos: ['sin las dos secciones'] };
  const clase = (sec, v, afirma) => {
    if (v === null) return ['NADA', false, ''];
    if (v !== afirma) return ['NIEGA', false, ''];
    const cs = citasCrudas(sec), n = cs.map(ladoNor), d = n.includes('D'), caballo = n.includes('a caballo'), cli = cs.some(c => ladoCli(c, pareja));
    // DECISIÓN 2 (arquitecto, 05/11): una cita D limpia vale aunque la misma sección traiga otra a caballo; la marca lo hace visible
    if (d && cli) return ['D', caballo, ''];
    if (!d && caballo) return ['PARCIAL', false, ' (cita a caballo)'];
    if (d || cli) return ['PARCIAL', false, ' (un solo lado por la regla del producto)'];
    return ['OTRO', false, ''];
  };
  const [c1, k1, d1] = clase(s.p1, veredicto(s.p1, 1), 'sí'), [c2, k2, d2] = clase(s.p2, veredicto(s.p2, 2), 'no');
  return conMotivos(c1, c2, { limpiaYCaballo: (c1 === 'D' && k1) || (c2 === 'D' && k2) }, [d1, d2]);
}

// EL RECUENTO POR ANCLA: las clases SE LE PREGUNTAN a R4 (contar de contar_quinto), no se recalculan. Lo que R4 decide en una
// respuesta: (a) o (b) → hay una D; (c) → las dos NIEGAN; si no, su cubo dice por pregunta «veredicto sin decidir» (NADA), «con un
// ancla fuera de comillas» o «con una sola de las dos anclas» (PARCIAL), «sin las anclas» (OTRO), y la pregunta que no sale en el
// cubo contestó lo contrario de afirmar (NIEGA). Con (a) o (b) la casilla ya es SALE, y la otra pregunta no hace falta.
export function contarPorAncla(respuesta, pareja) {
  const r = contar(respuesta, pareja);
  if (r.quinto === true) return conMotivos(...({ 'la 1': ['D', '—'], 'la 2': ['—', 'D'], 'las dos': ['D', 'D'] }[r.porPregunta] ?? ['D', 'D']));
  if (r.quinto === false) return conMotivos('NIEGA', 'NIEGA');
  if (r.cubo1.some(m => !/^pregunta [12]: /.test(m))) return { sale: null, motivos: r.cubo1 };
  const clase = n => {
    const m = r.cubo1.find(x => x.startsWith(`pregunta ${n}: `));
    if (!m) return 'NIEGA';
    if (m.includes('veredicto sin decidir')) return 'NADA';
    if (m.includes('fuera de comillas') || m.includes('una sola de las dos anclas')) return 'PARCIAL';
    if (m.includes('sin las anclas')) return 'OTRO';
    throw new Error(`motivo de R4 sin clase: ${m}`);
  };
  return conMotivos(clase(1), clase(2));
}

// UN BRAZO. La selección es la de los prerregistros del 04/11 (P1): las n primeras respuestas buenas, en orden de pulsación y de
// vez; una fallida no es un «no» y se repone con la siguiente buena. Cada respuesta se cuenta DOS VECES. Por recuento: cuántas
// salen, cuántas no, las ilegibles con su motivo, y el RANGO (cota baja: las ilegibles no salen; cota alta: salen).
// REPETICIÓN (prerregistro): un brazo con MÁS DE 4 ilegibles en cualquiera de los dos recuentos se repite, y la orden lo dice
// ANTES de enseñar ningún número de «sale».
export const MAX_ILEGIBLES = 4;
export function brazo(pulsaciones, pareja, n = 42) {
  const buenas = [], fallidas = [];
  pulsaciones.forEach((rs, p) => rs.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    const mala = !r || typeof r.respuesta !== 'string' || r.respuesta.trim() === '';
    if (buenas.length >= n) return;
    if (mala) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`);
    else buenas.push({ id, ancla: contarPorAncla(r, pareja), producto: contarPorProducto(r, pareja), conCita: citasCrudas(r.respuesta).length > 0 });
  }));
  const rec = k => {
    const sale = buenas.filter(b => b[k].sale === true).length, ileg = buenas.filter(b => b[k].sale === null);
    return { sale, noSale: buenas.filter(b => b[k].sale === false).length, ilegibles: ileg.map(b => `${b.id}: ${b[k].motivos.join('; ')}`), baja: sale, alta: sale + ileg.length };
  };
  const ancla = rec('ancla'), producto = rec('producto');
  return {
    pareja: pareja.cli, n, completas: buenas.length >= n, fallidas, conCita: buenas.filter(b => b.conCita).length,
    aCaballo: buenas.filter(b => b.producto.motivos.some(m => m.includes('a caballo'))).map(b => b.id),
    ancla, producto,
    // LAS TRES CATEGORÍAS DEL ACUERDO (arquitecto, 05/11): coinciden y puntúan; coinciden en ilegible; y discrepan, que incluye
    // la ilegible en un recuento y puntuable en el otro. La regla de «más de 2 discrepancias» mira SÓLO la tercera.
    coincidenYPuntuan: buenas.filter(b => b.ancla.sale !== null && b.ancla.sale === b.producto.sale).length,
    coincidenEnIlegible: buenas.filter(b => b.ancla.sale === null && b.producto.sale === null).length,
    discrepan: buenas.filter(b => b.ancla.sale !== b.producto.sale).map(b => `${b.id}: ancla ${b.ancla.sale}, producto ${b.producto.sale}`),
    limpiaYCaballo: buenas.filter(b => b.producto.limpiaYCaballo).map(b => b.id),
    repetir: Math.max(ancla.ilegibles.length, producto.ilegibles.length) > MAX_ILEGIBLES,
  };
}

// FISHER EXACTO BILATERAL (suma de las tablas con probabilidad <= la observada), el mismo de las cifras del prerregistro.
const lf = (() => { const t = [0]; for (let i = 1; i <= 400; i++) t[i] = t[i - 1] + Math.log(i); return n => t[n]; })();
const hip = (a, r1, c1, n) => Math.exp(lf(r1) + lf(n - r1) + lf(c1) + lf(n - c1) - lf(n) - lf(a) - lf(r1 - a) - lf(c1 - a) - lf(n - r1 - c1 + a));
export function fisher(a, n1, b, n2) {
  const c1 = a + b, n = n1 + n2, lo = Math.max(0, c1 - n2), hi = Math.min(n1, c1), p0 = hip(a, n1, c1, n);
  let s = 0; for (let x = lo; x <= hi; x++) { const p = hip(x, n1, c1, n); if (p <= p0 * (1 + 1e-7)) s += p; } return Math.min(1, s);
}

// LA BANDA de un brazo de retirada frente a su brazo 0, DENTRO DE LA MISMA PAREJA (las parejas no se comparan entre sí).
// LAS COTAS VAN CRUZADAS (arquitecto, 05/11): de cada brazo sólo se sabe que su valor está entre su cota baja y su alta, así que
// la banda tiene que aguantar con CUALQUIER pareja de valores, y los rincones que la pueden voltear son los cruzados (baja del 0
// con alta del de retirada, el hueco más pequeño; alta del 0 con baja del de retirada, el más grande). Ocho evaluaciones: los
// cuatro rincones por los dos recuentos. A: en las ocho, el brazo de retirada sale MENOS que el 0 y Fisher da p < 0,05. B: en las
// ocho, la diferencia es de 2 o menos. Si no, C. Un brazo que haya que repetir, o incompleto, no da banda.
export function banda(b0, bx) {
  if (b0.pareja !== bx.pareja) return { banda: null, motivo: 'las parejas no se comparan entre sí' };
  for (const [nom, b] of [['el brazo 0', b0], ['el brazo de retirada', bx]]) {
    if (!b.completas) return { banda: null, motivo: `${nom} no tiene sus ${b.n} respuestas` };
    if (b.repetir) return { banda: null, motivo: `${nom} tiene más de ${MAX_ILEGIBLES} ilegibles: se repite` };
  }
  const ev = [];
  for (const k of ['ancla', 'producto']) for (const c0 of ['baja', 'alta']) for (const cx of ['baja', 'alta']) {
    const x = bx[k][cx], o = b0[k][c0];
    ev.push({ recuento: k, cota0: c0, cotaX: cx, retirada: x, control: o, p: fisher(x, bx.n, o, b0.n) });
  }
  const A = ev.every(e => e.retirada < e.control && e.p < 0.05), B = ev.every(e => Math.abs(e.retirada - e.control) <= 2);
  return { banda: A ? 'A' : B ? 'B' : 'C', evaluaciones: ev };
}

// LAS PRUEBAS (respuestas INVENTADAS)
function correrPruebas() {
  const R = (vez, respuesta) => ({ vez, respuesta });
  const p31 = PAREJAS.p31, p35 = PAREJAS.p35;
  // las citas, inventadas pero LITERALES de los textos de SQL_34_06
  const NOR = '«figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»';
  const CABALLO = '«experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico»';
  const SOLO_A = '«El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última»';
  const PRIN = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico»';
  const PRIN_CORTA = '«de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»'; // literal, sin el ancla
  const PRIN_PARAFRASIS = '«separar la responsabilidad de un proceso crítico de seguridad del paciente de quien dirige la clínica»'; // con el ancla, no literal
  const P35 = '«nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones»';
  const Q = (c1, c2) => `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. ${c1} ${c2} norma_contra_norma`;
  const casos = [
    ['los textos son los de SQL_34_06 (líneas 85-87 y 96-100), y cada frase está dentro de su párrafo', () => {
      const l = readFileSync('E:/Doc-Hub/SQL_34_06_hallazgos_por_pasada.sql', 'utf8').replace(/\r\n/g, '\n').split('\n');
      const lit = i => [...l[i].matchAll(/'((?:[^']|'')*)'/g)].map(m => m[1].replace(/''/g, "'"));
      const fila = c => l.slice(95, 101).map((x, i) => lit(95 + i)).find(v => v[0] === 'NOR-10' && v[1] === c && v[2].includes('puede recaer'));
      return [TEXTOS.P35 === lit(84)[0], TEXTOS.P31 === lit(85)[0], TEXTOS.PRINCIPIO === lit(86)[0],
        TEXTOS.P24 === fila('D')[2], TEXTOS.FRASE_D === fila('D')[3], TEXTOS.FRASE_A === fila('A')[3]];
    }, [true, true, true, true, true, true]],
    ['norm: tildes, mayúsculas y espacios, como la consulta', () => norm('  Clínica\n  ÚLTIMA  '), 'clinica ultima'],
    ['NOR-10: el permiso → D; las dos frases → a caballo; sólo A → nada; corta → nada; no literal → nada',
      () => [NOR, CABALLO, SOLO_A, '«recaer en el propio»', '«figura que podría recaer en el propio Director Clínico»'].map(c => ladoNor(c.slice(1, -1))),
      ['D', 'a caballo', null, null, null]],
    ['CLI-12, pareja del §3.1: el principio sí (también corto), fuera del principio no, el §3.5 no, una paráfrasis no',
      () => [PRIN, PRIN_CORTA, '«El responsable último de la esterilización del instrumental en cada clínica»', P35, PRIN_PARAFRASIS].map(c => ladoCli(c.slice(1, -1), p31)),
      [true, true, false, false, false]],
    ['CLI-12, pareja del §3.5: el §3.5 sí, el principio no', () => [P35, PRIN].map(c => ladoCli(c.slice(1, -1), p35)), [true, false]],
    ['por la regla del producto: (b) sale; (c) no sale; a caballo → ilegible con su motivo',
      () => [contarPorProducto(R(1, Q(NOR, PRIN)), p31), contarPorProducto(R(2, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.'), p31), contarPorProducto(R(3, Q(CABALLO, PRIN)), p31)],
      [{ sale: true, motivos: [], clases: ['NIEGA', 'D'], limpiaYCaballo: false }, { sale: false, motivos: [], clases: ['NIEGA', 'NIEGA'], limpiaYCaballo: false }, { sale: null, motivos: ['pregunta 1: NIEGA', 'pregunta 2: PARCIAL (cita a caballo)'], clases: ['NIEGA', 'PARCIAL'], limpiaYCaballo: false }]],
    ['DECISIÓN 2: cita D limpia y otra a caballo en la misma sección → sale, y queda marcada', () => contarPorProducto(R(8, Q(NOR + ' ' + CABALLO, PRIN)), p31), { sale: true, motivos: [], clases: ['NIEGA', 'D'], limpiaYCaballo: true }],
    ['por la regla del producto: (a), por la pregunta 1', () => contarPorProducto(R(4, `PREGUNTA 1\nSí. ${NOR} ${PRIN}\nPREGUNTA 2\nSí.`), p31), { sale: true, motivos: [], clases: ['D', 'NIEGA'], limpiaYCaballo: false }],
    ['LOS DOS RECUENTOS FALLAN EN DIRECCIONES OPUESTAS: la cita corta del principio pasa el producto y no el ancla; la paráfrasis, al revés',
      () => [R(5, Q(NOR, PRIN_CORTA)), R(6, Q(NOR, PRIN_PARAFRASIS))].map(r => [contarPorAncla(r, p31).sale, contarPorProducto(r, p31).sale]),
      [[null, true], [true, null]]],
    ['a caballo: el ancla la da por buena y el producto no (es la diferencia que el acuerdo obligatorio castiga)',
      // la cita, LITERAL del §2.4, va del permiso hasta dentro de la frase de A: lleva el ancla y toca las dos frases
      () => { const r = R(7, Q('«puede recaer en el propio Director Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo: mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras al protocolo basadas en la experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico»', PRIN)); return [contarPorAncla(r, p31).sale, contarPorProducto(r, p31).sale]; },
      [true, null]],
    ['un brazo: el rango, la selección con una fallida, a caballo en su lista, y las coincidencias', () => {
      const b = brazo([[R(1, Q(NOR, PRIN)), { vez: 2, error: 'HTTP 529' }, R(3, Q(CABALLO, PRIN)), R(4, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.')], [R(1, Q(NOR, PRIN_CORTA)), R(2, Q(NOR, PRIN))]], p31, 4);
      return [b.completas, b.fallidas.length, b.ancla.baja, b.ancla.alta, b.producto.baja, b.producto.alta, b.aCaballo, b.coincidenYPuntuan, b.coincidenEnIlegible, b.discrepan.length, b.repetir];
      // las tres categorías: puntúan y coinciden la vez 1 (sale) y la 4 (no sale); coincide en ilegible la 3; discrepa la de la cita corta
    }, [true, 1, 1, 3, 2, 3, ['pulsación 1, vez 3'], 2, 1, 1, false]],
    ['un brazo cuenta y nombra los casos de la decisión 2', () => brazo([[R(1, Q(NOR + ' ' + CABALLO, PRIN)), R(2, Q(NOR, PRIN))]], p31, 2).limpiaYCaballo, ['pulsación 1, vez 1']],
    ['un brazo con 5 ilegibles se repite; con 4, no', () => {
      const raro = v => R(v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nDepende de cómo se lea.'), bien = v => R(v, Q(NOR, PRIN));
      return [brazo([[...[1, 2, 3, 4, 5].map(raro), ...[6, 7, 8].map(bien)]], p31, 8).repetir, brazo([[...[1, 2, 3, 4].map(raro), ...[5, 6, 7, 8].map(bien)]], p31, 8).repetir];
    }, [true, false]],
    ['la cuenta por ancla del brazo es la de contar_quinto (el mismo «salió» que su resumen)', () => {
      const rs = [R(1, Q(NOR, PRIN)), R(2, Q(NOR, PRIN_PARAFRASIS)), R(3, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí.')];
      return brazo([rs], p31, 3).ancla.sale === rs.filter(r => contar(r, p31).quinto === true).length;
    }, true],
    // LA REGLA (ii): la tabla de las 25 combinaciones, ESCRITA A MANO desde el texto del arquitecto (no desde el código), fila = la
    // pregunta 1, columna = la 2, en el orden D, PARCIAL, OTRO, NIEGA, NADA. S = sale, I = ilegible, N = no sale.
    ['REGLA (ii), EXHAUSTIVA: las 25 combinaciones caen cada una en UNA casilla, y en la que dice el texto', () => {
      const v = { true: 'S', null: 'I', false: 'N' };
      return CLASES.map(c1 => CLASES.map(c2 => v[casilla(c1, c2)]).join('')).join(' ');
    }, ['SSSSS', 'SIIII', 'SINNI', 'SINNI', 'SINNI'].join(' ')],
    ['REGLA (ii), por ancla: la 1 encuentra OTRA cosa y la 2 niega → NO SALE (R4 la daba ilegible: es el defecto que la cambia)',
      () => contarPorAncla(R(9, 'PREGUNTA 1\nSí. «El responsable último del cumplimiento» «el Coordinador de Calidad del centro»\nPREGUNTA 2\nSí, se pueden cumplir.'), p31),
      { sale: false, motivos: [], clases: ['OTRO', 'NIEGA'] }],
    ['REGLA (ii), por ancla: PARCIAL en la pregunta 1 y la 2 niega → ILEGIBLE (con PARCIAL asimétrico saldría «no sale»)',
      () => contarPorAncla(R(10, `PREGUNTA 1\nSí. ${NOR} «otra frase del manual de calidad»\nPREGUNTA 2\nSí, se pueden cumplir.`), p31).sale, null],
    ['REGLA (ii), por ancla: D en la 1 y la 2 sin decidir → SALE (el hueco 1)',
      () => contarPorAncla(R(11, `PREGUNTA 1\nSí. ${NOR} ${PRIN}\nPREGUNTA 2\nDepende de cómo se lea.`), p31).sale, true],
    ['REGLA (ii), por ancla: la 2 afirma sin ningún ancla (OTRO) y la 1 niega → NO SALE (el hueco 2)',
      () => contarPorAncla(R(12, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. «una frase» «otra frase»'), p31), { sale: false, motivos: [], clases: ['NIEGA', 'OTRO'] }],
    ['REGLA (ii), por ancla: la 1 sin decidir y la 2 niega → NO SALE (la 1 da igual en esa rama)',
      () => contarPorAncla(R(13, 'PREGUNTA 1\nNo obstante, sí.\nPREGUNTA 2\nSí.'), p31).sale, false],
    ['REGLA (ii), por la regla del producto: la 1 encuentra OTRA cosa y la 2 niega → NO SALE',
      () => contarPorProducto(R(14, 'PREGUNTA 1\nSí. «una frase cualquiera del texto uno» «otra frase cualquiera del texto dos»\nPREGUNTA 2\nSí, se pueden cumplir.'), p31).sale, false],
    ['REGLA (ii), por la regla del producto: un solo lado en la 1 y la 2 niega → ILEGIBLE (PARCIAL simétrico)',
      () => contarPorProducto(R(15, `PREGUNTA 1\nSí. ${NOR} «otra frase cualquiera del texto dos»\nPREGUNTA 2\nSí, se pueden cumplir.`), p31).sale, null],
  ];
  // LAS BANDAS, con brazos de mentira: sólo importan pareja, n, completas, repetir y los rangos
  const B = (pareja, aB, aA, pB, pA, extra = {}) => ({ pareja, n: 42, completas: true, repetir: false, ancla: { baja: aB, alta: aA }, producto: { baja: pB, alta: pA }, ...extra });
  casos.push(
    ['banda A: el brazo de retirada cae y las cuatro evaluaciones dan p < 0,05', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 31)).banda, 'A'],
    ['banda A exige los ocho: si la cota alta de un recuento no llega, es C', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 37)).banda, 'C'],
    ['COTAS CRUZADAS, banda A: el rincón del hueco más pequeño (baja del 0, alta del de retirada) la tumba aunque los rincones iguales aguanten', () => banda(B('p31', 30, 31, 30, 31), B('p31', 20, 21, 20, 21)).banda, 'C'], // con la misma cota en los dos brazos sería A (decisivas.mjs)
    ['COTAS CRUZADAS, banda B: el rincón del hueco más grande (alta del 0, baja del de retirada) la tumba aunque los rincones iguales aguanten', () => banda(B('p31', 38, 41, 38, 41), B('p31', 37, 40, 37, 40)).banda, 'C'],
    ['banda B: el margen es de 2, no de 3 (el peor rincón cruzado da 3 → C)', () => banda(B('p31', 40, 41, 40, 41), B('p31', 38, 39, 38, 39)).banda, 'C'],
    ['son ocho evaluaciones', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 31, 30, 31)).evaluaciones.length, 8],
    ['banda B: diferencia de 2 o menos en los ocho', () => banda(B('p31', 40, 41, 40, 41), B('p31', 39, 40, 39, 40)).banda, 'B'],
    ['banda B no: una evaluación con diferencia de 3 → C', () => banda(B('p31', 40, 41, 40, 42), B('p31', 37, 40, 39, 41)).banda, 'C'],
    ['si el brazo de retirada sale MÁS, no es A', () => banda(B('p31', 20, 20, 20, 20), B('p31', 40, 40, 40, 40)).banda, 'C'],
    ['las parejas no se comparan entre sí', () => banda(B('p31', 42, 42, 42, 42), B('p35', 30, 30, 30, 30)).banda, null],
    ['un brazo a repetir no da banda', () => banda(B('p31', 42, 42, 42, 42), B('p31', 30, 30, 30, 30, { repetir: true })).banda, null],
    ['Fisher, contra la cifra del prerregistro: 36 de 42 frente a 42 de 42, p = 0,0258', () => fisher(36, 42, 42, 42).toFixed(4), '0.0258'],
  );
  let mal = 0;
  for (const [nombre, f, esperado] of casos) {
    let sale; try { sale = f(); } catch (e) { sale = `EXCEPCIÓN: ${e.message}`; }
    const ok = JSON.stringify(sale) === JSON.stringify(esperado);
    if (!ok) mal++;
    console.log(`${ok ? 'ok ' : 'MAL'} · ${nombre}${ok ? '' : `\n      sale ${JSON.stringify(sale)}\n      debía ${JSON.stringify(esperado)}`}`);
  }
  console.log(`${casos.length - mal} de ${casos.length}`);
  process.exit(mal ? 1 : 0);
}

// LA ORDEN VA POR VARIABLES DE ENTORNO, NO POR ARGUMENTOS: contar_quinto.mjs, importado arriba y congelado, dispara su propia
// línea de órdenes con CUALQUIER argumento. Así, sin argumentos, aquélla no hace nada.
const ACCION = process.env.ACCION, FICHEROS = (process.env.FICHEROS ?? '').split(',').filter(Boolean);
if (ACCION === 'pruebas') correrPruebas();
else if (ACCION === 'banda') {
  const [b0, bx] = FICHEROS.map(f => JSON.parse(readFileSync(f, 'utf8')));
  const r = banda(b0, bx);
  console.log(r.banda ? `BANDA ${r.banda}` : `SIN BANDA: ${r.motivo}`);
  for (const e of r.evaluaciones ?? []) console.log(`  ${e.recuento}, cota ${e.cota0} del 0 y ${e.cotaX} del de retirada: retirada ${e.retirada} de ${bx.n} frente a ${e.control} de ${b0.n} · p = ${e.p.toFixed(4)}`);
} else if (ACCION === 'brazo') {
  const pareja = PAREJAS[process.env.PAREJA ?? ''];
  if (!pareja) { console.log(`NO SE CUENTA: PAREJA tiene que ser ${Object.keys(PAREJAS).join(' o ')}`); process.exit(1); }
  const b = brazo(FICHEROS.map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas), pareja, Number(process.env.N ?? 42));
  if (process.env.SALIDA) writeFileSync(process.env.SALIDA, JSON.stringify(b, null, 2));
  const L = [`${pareja.nombre} · n = ${b.n}`, `1 · LAS FALLIDAS: ${b.fallidas.length}${b.fallidas.length ? ' — ' + b.fallidas.join(' · ') : ''}`];
  if (!b.completas) { L.push('NO PUNTUABLE TODAVÍA: faltan respuestas buenas.'); console.log(L.join('\n')); process.exit(0); }
  L.push(`2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla ${b.ancla.ilegibles.length}, por la regla del producto ${b.producto.ilegibles.length} (de ellas, a caballo: ${b.aCaballo.length})`);
  for (const k of ['ancla', 'producto']) for (const i of b[k].ilegibles) L.push(`   ${k}: ${i}`);
  if (b.repetir) { L.push(`SE REPITE: más de ${MAX_ILEGIBLES} ilegibles. No se enseña ningún número de «sale».`); console.log(L.join('\n')); process.exit(0); }
  L.push(`3 · CON CITA: ${b.conCita} de ${b.n}`);
  L.push(`4 · POR ANCLA: sale ${b.ancla.sale}, no sale ${b.ancla.noSale}, ilegibles ${b.ancla.ilegibles.length} → rango ${b.ancla.baja}-${b.ancla.alta}`);
  L.push(`5 · POR LA REGLA DEL PRODUCTO: sale ${b.producto.sale}, no sale ${b.producto.noSale}, ilegibles ${b.producto.ilegibles.length} → rango ${b.producto.baja}-${b.producto.alta}`);
  L.push(`6 · LOS DOS RECUENTOS: coinciden y puntúan ${b.coincidenYPuntuan} · coinciden en ilegible ${b.coincidenEnIlegible} · DISCREPAN ${b.discrepan.length}${b.discrepan.length ? ' — ' + b.discrepan.join(' · ') : ''}`);
  L.push(`7 · DECISIÓN 2, cita D limpia y otra a caballo en la misma sección (cuenta la limpia): ${b.limpiaYCaballo.length}${b.limpiaYCaballo.length ? ' — ' + b.limpiaYCaballo.join(' · ') : ''}`);
  console.log(L.join('\n'));
}
```

### P-F130-23 · LA FILA QUE DECIDE ENTRE «NO SALE» E «ILEGIBLE», COMPROBADA (Code, 05/11/2026, a petición del arquitecto)

**La fila**: en el recuento por ancla, una pregunta que NO aparece en el cubo de R4 se traduce a **NIEGA**. Es una inferencia por
ausencia, y decide la frontera: sin D y sin PARCIAL, una pregunta 2 en NIEGA da NO SALE y en NADA da ILEGIBLE.
**La pregunta del arquitecto**: ¿emite R4 «veredicto sin decidir» SIEMPRE que la pregunta no decidió? **Sí, siempre, y lo determina el
código** (`contar_quinto.mjs`, huella `e21387a1ff2e7305`):
- `veredicto` (líneas 65-89) sólo devuelve tres valores: 'sí' o 'no' (línea 86, la única con `return v`, y `v` sólo se asigna en
  75-78 a 'sí' o 'no') o `null` (69, 73, 79, 84, 85 y 88).
- En la rama que llena el cubo (`contar`, 127-135), para cada pregunta: `v === null` → empuja «veredicto sin decidir» (**129**, sin
  condición); `v !== afirma` → no empuja nada (**130**); y si afirma, empuja SIEMPRE uno de tres motivos (131-133, con `else` final).
- Las respuestas que no llegan a esa rama no pasan por la fila: (a) o (b) devuelven SALE antes (124), (c) es «las dos niegan» y se
  traduce explícitamente (126), y «sin respuesta» o «sin las dos secciones» son ilegibles enteras (115, 117).
- Así que **«ausente del cubo» ⇔ la pregunta decidió y contestó lo contrario de afirmar**. La traducción es exacta, no una suposición.

**Y CRUZADA CON RESPUESTAS REALES** (`cruce_niega.mjs`, scratchpad): en las 40 de la condición 1 y las 42 de las dos tandas del
quinto, para cada pregunta de cada respuesta que R4 no da por SALE, la clase traducida frente a la del veredicto calculado
directamente: **0 discrepancias**, con 18 preguntas en NADA y 40 en NIEGA por el veredicto directo (así que la comprobación tenía
casos de las dos clases que separa: no es un cero de una regla que no sabe distinguir). Una prueba del guion la ejerce además en
falso (el mutante «la pregunta ausente del cubo leída como NADA» sale en rojo).
⚠️ **Una fuga, dicha**: el cruce se salta las respuestas que salen, así que el número de preguntas comparadas deja deducir cuántas
respuestas de la condición 1 salen por ancla con la regla (ii). **Code lo ha visto y no lo escribe aquí ni lo ha usado**; esa cifra
se iba a dar de todos modos en las corridas en seco, y la condición 1 no es ninguno de los seis brazos.

### P-F130-23 · LA ADENDA 3 AL PRERREGISTRO, LITERAL (arquitecto, 05/11/2026, antes de las corridas en seco)

**La huella `527b3ad22bb79110`, APROBADA** (arquitecto, 05/11): «el codominio de `veredicto` es {'sí', 'no', null}… eso es una
demostración, no una lectura». Y sobre la cifra que la fuga deja deducir (arquitecto): **no se calcula por ese camino**; sale de la
corrida en seco y se archiva como salida de la corrida, con su huella. Sacada del registro con un script:

```
ADENDA 3 · 05/11/2026, antes de correr ningún brazo.

UN BRAZO 0 QUE DISCREPE DE LA CONDICIÓN 1 DEL 30/10 ES UN HALLAZGO, NO UNA
AVERÍA, Y NO SE REPITE. La condición 1 corrió con otra versión del prompt y
otro día; que el brazo 0 dé otra cosa es información sobre el instrumento,
no un motivo para volver a tirar.
EL ÚNICO DISPARADOR DE REPETICIÓN SIGUE SIENDO EL RECUENTO DE ILEGIBLES,
mirado antes de ver ninguna cifra de «sale».

FUGA PARCIAL DECLARADA: el cruce de la fila NIEGA/NADA se saltaba las
respuestas que salen, de modo que el número de preguntas comparadas permite
deducir cuántas de las 40 de la condición 1 salen. Code lo detectó después de
correrlo, no escribió ni usó la cifra, y la declaró. Es inocua porque las
bandas son una función del brazo 0 observado y todo lo demás está congelado
con huella: no queda nada ajustable a la vista de un número.
```

### P-F130-23 · LAS TRES CORRIDAS EN SECO CON LA REGLA (ii): LAS TRES SALEN «SE REPITE» (Code, 05/11/2026)

Con la huella aprobada `527b3ad22bb79110` (y `contar_quinto.mjs` en `e21387a1ff2e7305`), comprobadas antes de contar. Salida literal:

```
contar_brazos.mjs 527b3ad22bb79110
contar_quinto.mjs e21387a1ff2e7305
===== CORRIDA 1 (N=20)
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 20
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 10, por la regla del producto 13 (de ellas, a caballo: 0)
   ancla: pulsación 1, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 8: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 9: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 10: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 11: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 12: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 13: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 17: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 18: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 2: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 8: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 9: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 10: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 11: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 12: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 13: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 14: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 15: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 17: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 18: pregunta 1: OTRO; pregunta 2: NADA
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
===== CORRIDA 2 (N=20)
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 20
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 7, por la regla del producto 9 (de ellas, a caballo: 0)
   ancla: pulsación 1, vez 2: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 8: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 11: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 12: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 15: pregunta 1: OTRO; pregunta 2: PARCIAL
   producto: pulsación 1, vez 1: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 2: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 6: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 8: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 11: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 12: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 15: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
===== CORRIDA 3 (N=40)
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 40
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 17, por la regla del producto 22 (de ellas, a caballo: 0)
   ancla: pulsación 1, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 8: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 9: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 10: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 11: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 12: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 13: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 1, vez 17: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 1, vez 18: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 2, vez 2: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 2, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 2, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 2, vez 8: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 2, vez 11: pregunta 1: OTRO; pregunta 2: PARCIAL
   ancla: pulsación 2, vez 12: pregunta 1: OTRO; pregunta 2: NADA
   ancla: pulsación 2, vez 15: pregunta 1: OTRO; pregunta 2: PARCIAL
   producto: pulsación 1, vez 2: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 8: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 9: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 10: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 11: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 12: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 13: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 14: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 15: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 1, vez 17: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 1, vez 18: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 2, vez 1: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 2: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 3: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 2, vez 5: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 2, vez 6: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 8: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 11: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 12: pregunta 1: OTRO; pregunta 2: NADA
   producto: pulsación 2, vez 15: pregunta 1: OTRO; pregunta 2: PARCIAL (un solo lado por la regla del producto)
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
```

**LO QUE DICEN, sin ningún «sale»** (el guion no los enseña y no se han calculado por otra vía). Las ilegibles, por la clase de su
pregunta 2, contadas de la propia salida:
- corrida 1 (n = 20): ancla: NADA 6, PARCIAL 4 · producto: NADA 6, PARCIAL 7
- corrida 2 (n = 20): ancla: NADA 3, PARCIAL 4 · producto: NADA 3, PARCIAL 6
- corrida 3 (n = 40): ancla: NADA 9, PARCIAL 8 · producto: NADA 9, PARCIAL 13
- **La pregunta 1 es OTRO en TODAS las ilegibles**: la regla (ii) hizo lo que tenía que hacer, y ese motivo ya no hace ilegible a
  nadie. **Lo que queda es de la pregunta 2**: o NO DECIDE (NADA, el núcleo de R4 que sobrevive), o afirma con un solo lado
  (PARCIAL). «A caballo»: 0.
- Por instrucción del arquitecto (05/11): con «SE REPITE» no se dan cifras; se da el motivo y él replantea.

### P-F130-23 · POR QUÉ LA PREGUNTA 2 SALE «SIN DECIDIR»: LAS 9, TODAS DE LECTURA (Code, 05/11/2026, a petición del arquitecto)

**La pregunta del arquitecto**: de los motivos por los que `veredicto` devuelve «sin decidir», todos son de LECTURA salvo uno, el
de SUSTANCIA (ninguna forma de veredicto en toda la sección). Si fueran de lectura, el lector fallaría según el FORMATO de la
respuesta, el bloque del principio puede cambiar ese formato, y la tasa de ilegibles podría moverse entre brazos por el parseo:
**el tratamiento moviendo el canal de la medición, por la puerta del lector.**

**La herramienta** (sin huella: no produce ninguna cifra de resultado; no toca el guion aprobado): una COPIA de `veredicto` con cada
salida nula etiquetada por su línea, comprobada ANTES contra el original en las 80 secciones de la condición 1: 0 discrepancias.
**Salida, literal:**

```
la copia frente al original: 80 secciones, 0 discrepancias
  condición 1, vez 3 · L69 · la sección llega a una viñeta antes de ningún veredicto · su primera línea: «· EL CUMPLIMIENTO»
  condición 1, vez 5 · L69 · la sección llega a una viñeta antes de ningún veredicto · su primera línea: «· EL CUMPLIMIENTO»
  condición 1, vez 8 · L79 · una cita antes del veredicto (línea con comillas y sin forma de veredicto) · su primera línea: «· EL CUMPLIMIENTO»
  condición 1, vez 11 · L85 · el seguro de polaridad («Sí, hay hallazgo») · su primera línea: «· EL CUMPLIMIENTO»
  condición 1, vez 17 · L69 · la sección llega a una viñeta antes de ningún veredicto · su primera línea: «· EL CUMPLIMIENTO»
  condición 1, vez 18 · L69 · la sección llega a una viñeta antes de ningún veredicto · su primera línea: «· EL CUMPLIMIENTO»
condición 1 · la pregunta 2 sin decidir, por motivo: L69 · la sección llega a una viñeta antes de ningún veredicto: 4 · L79 · una cita antes del veredicto (línea con comillas y sin forma de veredicto): 1 · L85 · el seguro de polaridad («Sí, hay hallazgo»): 1
  condición 1 repetida, vez 3 · L69 · la sección llega a una viñeta antes de ningún veredicto · su primera línea: «· EL CUMPLIMIENTO»
  condición 1 repetida, vez 5 · L69 · la sección llega a una viñeta antes de ningún veredicto · su primera línea: «· EL CUMPLIMIENTO»
  condición 1 repetida, vez 12 · L85 · el seguro de polaridad («Sí, hay hallazgo») · su primera línea: «· EL CUMPLIMIENTO: SÍ, HAY HALLAZGO»
condición 1 repetida · la pregunta 2 sin decidir, por motivo: L69 · la sección llega a una viñeta antes de ningún veredicto: 2 · L85 · el seguro de polaridad («Sí, hay hallazgo»): 1
```

**LAS 9, POR MOTIVO**: viñeta antes del veredicto (L69), **6** (4 + 2); una cita antes del veredicto (L79), **1**; el seguro de
polaridad (L85, «Sí, hay hallazgo»), **2** (1 + 1); la primera frase con «sí» y «no» (L84), 0; **NINGUNA forma de veredicto (L88, la
de sustancia), 0.** **El 22 % es del lector, no del juez**: el juez contestó y nuestro lector no supo leerlo. Eso lo hace un defecto
del instrumento, que se arregla, y abre el riesgo que el arquitecto nombró: si el bloque cambia el formato, cambia la tasa de
ilegibles entre brazos.

**El texto de la herramienta, para la procedencia:**

```js
// Herramienta de un solo uso (05/11), SIN HUELLA porque no produce ninguna cifra de resultado: por qué la pregunta 2 sale «sin
// decidir» (NADA) en las respuestas de la condición 1. NO modifica el guion aprobado: lleva una COPIA de `veredicto`
// (contar_quinto.mjs:65-89, huella e21387a1ff2e7305) con cada `return null` etiquetado por su línea, y ANTES de usarla comprueba
// que la copia devuelve exactamente lo mismo que el original en las dos preguntas de las 40 respuestas. Si discrepa en una, no vale.
// No imprime ningún «sale».
import { readFileSync } from 'node:fs';
const { secciones, veredicto } = await import('./contar_quinto.mjs');
const SI = /(^|[^\p{L}])sí([^\p{L}]|$)/iu, NO = /(^|[^\p{L}])no([^\p{L}]|$)/iu;
// la copia, línea por línea; cada salida nula lleva su motivo y la línea del original
function veredictoConMotivo(seccion, pregunta = 1) {
  const lineas = seccion.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const cruda = lineas[i];
    if (/^\s*([-•]\s)/.test(cruda)) return [null, 'L69 · la sección llega a una viñeta antes de ningún veredicto'];
    let l = (i === 0 ? cruda.replace(/^[\s·:.\-–—]*(el dato|el cumplimiento)?[\s·:.\-–—]*/i, '') : cruda).trim();
    if (l.includes('?')) l = l.slice(l.lastIndexOf('?') + 1).trim();
    l = l.replace(/^((respuesta|hay hallazgo|hallazgo)\s*:\s*)+/i, '').trim();
    if (l === '') { if (/[«“"]/.test(cruda)) return [null, 'L73 · una cita antes del veredicto (línea vacía tras quitar la cabecera)']; continue; }
    let v = null, frase = false;
    if (pregunta === 2 && /^no se pueden cumplir/i.test(l)) { v = 'no'; frase = true; }
    else if (pregunta === 2 && /^(s[ií][,\s]+)?se pueden cumplir/i.test(l)) { v = 'sí'; frase = true; }
    else if (/^sí([^\p{L}]|$)/iu.test(l) || /^si([.,;:!]|$)/i.test(l)) v = 'sí';
    else if (/^no([^\p{L}]|$)/iu.test(l)) v = 'no';
    if (v === null) { if (/[«“"]/.test(cruda)) return [null, 'L79 · una cita antes del veredicto (línea con comillas y sin forma de veredicto)']; continue; }
    const primera = l.split(/(?<=[.:;])\s/)[0];
    const resto = frase && v === 'no' ? primera.replace(/^no se pueden cumplir/i, '') : primera;
    if (SI.test(resto) && NO.test(resto)) return [null, 'L84 · la primera frase lleva «sí» y «no» a la vez'];
    if (pregunta === 2 && v === 'sí' && /hallazgo/i.test(primera)) return [null, 'L85 · el seguro de polaridad («Sí, hay hallazgo»)'];
    return [v, null];
  }
  return [null, 'L88 · NINGUNA forma de veredicto en toda la sección'];
}
const C = 'E:/Doc-Hub/claude/';
const tandas = [['condición 1', C + 'Medida_F130_Veinte_Condicion_1_30-10-2026.json'], ['condición 1 repetida', C + 'Medida_F130_Veinte_Condicion_1_Repetida_30-10-2026.json']];
let comparadas = 0, discrepa = 0;
const salida = [];
for (const [nombre, f] of tandas) {
  const cuenta = {};
  for (const r of JSON.parse(readFileSync(f, 'utf8')).respuestas) {
    const s = secciones(r.respuesta ?? ''); if (!s) continue;
    for (const [sec, n] of [[s.p1, 1], [s.p2, 2]]) {
      comparadas++;
      const [v, motivo] = veredictoConMotivo(sec, n);
      if (v !== veredicto(sec, n)) { discrepa++; salida.push(`LA COPIA DISCREPA · ${nombre}, vez ${r.vez}, pregunta ${n}`); }
      if (n === 2 && v === null) {
        cuenta[motivo] = (cuenta[motivo] ?? 0) + 1;
        const primera = sec.split('\n').map(x => x.trim()).find(x => x) ?? '';
        salida.push(`  ${nombre}, vez ${r.vez} · ${motivo} · su primera línea: «${primera.slice(0, 150)}${primera.length > 150 ? '…' : ''}»`);
      }
    }
  }
  salida.push(`${nombre} · la pregunta 2 sin decidir, por motivo: ${Object.entries(cuenta).map(([m, k]) => `${m}: ${k}`).join(' · ') || 'ninguna'}`);
}
console.log(`la copia frente al original: ${comparadas} secciones, ${discrepa} discrepancias${discrepa ? ' — LA COPIA NO VALE' : ''}`);
console.log(salida.join('\n'));
```

### LO QUE QUEDA EN EL APARATO DE CUENTA CONSTRUIDO PARA EL QUINTO Y REUTILIZADO EN D (Code, 05/11/2026)

**El mecanismo** (arquitecto): R4, su regla de legibilidad y el lector del veredicto se construyeron para el quinto, cuya pareja no
lleva otro caso dentro, y se reutilizan en D, donde A vive en los mismos trozos. La lista, agrupada por ese mecanismo:
1. **El lector de secciones y de veredicto (R1' y R2'), calibrado con las 21 respuestas de la PRIMERA TANDA DEL QUINTO**: es su única
   prueba de formato (`contar_quinto.mjs:322-340`, «formato de la primera tanda»). **Ya ha fallado en D** (las 9 de arriba, todas de
   lectura). Y depende del formato, que el tratamiento puede mover.
2. **Las citas (R3) sólo reconocen «…», “…” y "…"**, las comillas del quinto. Si una respuesta de D cita con otras (cursiva, comillas
   simples, comillas invertidas), su cita no existe para ninguno de los dos recuentos. **No está medido en D.**
3. **El recuento por ancla, con la regla de CONTENER el ancla entera**, pensada para las anclas cortas del quinto (31 a 38 caracteres)
   y usada con una de 74: **8 PARCIAL de 40 por ancla** en la condición 1. Era el riesgo que se avisó, y el segundo recuento se puso
   para cubrirlo.
4. **El tope de repetición, «más de 4 ilegibles»**: la única derivación de ese 4 en el archivo es la del quinto («la banda A pide 17 de
   21, así que con más de 4…», líneas 1595 y 1886). **Para n = 42 y la regla de las cotas no hay ninguna escrita.**
5. **Fuera del quinto, pero del mismo mecanismo** (construido para una fuente y usado en otra): **la regla del producto se hizo para
   las citas del PRODUCTO**, que pasan por la puerta y publican la frase real, y aquí se aplica a texto libre: **13 PARCIAL de 40** en
   la condición 1.
**Lo que no está en la lista**: la selección de respuestas (P1), Fisher, las bandas, la etiqueta (P-D-3) y la regla (ii) se escribieron
para D, y el prompt de la pregunta cerrada también nació con D (E3).

### P-F130-23 · LA ARITMÉTICA DEL ARQUITECTO, Y QUÉ LES FALTA A LOS PARCIAL (05/11/2026)

**El arquitecto, antes de pedir nada** (05/11): el techo de PARCIAL para que n = 42 vea una caída del 90 % al 50 % en el peor
rincón es **5 de 42 (11,9 %)**; por ancla hay 8 y por la regla del producto 13. **La banda B está muerta en la pareja del §3.1**
(pide un rango de 2 y mide 8 o 14). **Subir el n no lo arregla** (con un 20 % de PARCIAL el peor rincón compara 72 % con 60 %, una
diferencia fija; harían falta 210 por brazo; con el 32,5 % el signo ya está invertido). **El PARCIAL es la única palanca: si no baja
de 8 a 5 o menos, P-F130-23 no se puede correr como está diseñado.** Y su relectura: la corrida en seco decía «ninguna banda
asignable» desde la primera vez, y él lo leyó tres veces como «arregla el lector»; el tope de 4 lo puso él, sin derivar.

**QUÉ LES FALTA** (herramienta `desglose_parcial.mjs`, sin huella: no produce ninguna cifra de resultado; sólo mira las secciones
PARCIAL; y `mirar_parcial.mjs` para dos comprobaciones). Salida literal:

```

=== POR ANCLA: 8 preguntas PARCIAL
  condición 1 vez 9, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: nombra el apartado por su número (3.1 / 3.5) sin citarlo · estilos de cita no reconocidos en la sección: comillas invertidas
  condición 1 vez 10, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: nombra el apartado por su número (3.1 / 3.5) sin citarlo · estilos de cita no reconocidos en la sección: ninguno
  condición 1 vez 12, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: no menciona nada reconocible de CLI-12 · estilos de cita no reconocidos en la sección: ninguno
  condición 1 vez 13, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: cita un trozo MÁS CORTO del principio, sin el ancla · estilos de cita no reconocidos en la sección: comillas invertidas
  repetida vez 2, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: otra cosa · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 8, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: otra cosa · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 11, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: parafrasea el principio fuera de comillas · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 15, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: parafrasea el principio fuera de comillas · estilos de cita no reconocidos en la sección: ninguno
  POR LO QUE FALTA: {"CLI-12":6,"NOR-10":2}
  EN LUGAR DE CLI-12: {"nombra el apartado por su número (3.1 / 3.5) sin citarlo":2,"no menciona nada reconocible de CLI-12":1,"cita un trozo MÁS CORTO del principio, sin el ancla":1,"otra cosa":2,"parafrasea el principio fuera de comillas":2}
  CON ESTILOS QUE R3 NO RECONOCE: 2 de 8

=== POR LA REGLA DEL PRODUCTO: 13 preguntas PARCIAL
  condición 1 vez 2, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: cita el permiso pero no literal · estilos de cita no reconocidos en la sección: ninguno
  condición 1 vez 9, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: nombra el apartado por su número (3.1 / 3.5) sin citarlo · estilos de cita no reconocidos en la sección: comillas invertidas
  condición 1 vez 10, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: nombra el apartado por su número (3.1 / 3.5) sin citarlo · estilos de cita no reconocidos en la sección: ninguno
  condición 1 vez 12, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: no menciona nada reconocible de CLI-12 · estilos de cita no reconocidos en la sección: ninguno
  condición 1 vez 13, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: cita un trozo MÁS CORTO del principio, sin el ancla · estilos de cita no reconocidos en la sección: comillas invertidas
  condición 1 vez 14, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: cita el permiso pero no literal · estilos de cita no reconocidos en la sección: ninguno
  condición 1 vez 15, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: cita el permiso pero no literal · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 1, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: cita el permiso pero no literal · estilos de cita no reconocidos en la sección: comillas invertidas
  repetida vez 2, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: otra cosa · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 6, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: cita el permiso pero no literal · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 8, pregunta 2 · falta: NOR-10 (NOR-10 false, CLI-12 true) · en su lugar: otra cosa · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 11, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: parafrasea el principio fuera de comillas · estilos de cita no reconocidos en la sección: ninguno
  repetida vez 15, pregunta 2 · falta: CLI-12 (NOR-10 true, CLI-12 false) · en su lugar: parafrasea el principio fuera de comillas · estilos de cita no reconocidos en la sección: ninguno
  POR LO QUE FALTA: {"NOR-10":7,"CLI-12":6}
  EN LUGAR DE CLI-12: {"cita el permiso pero no literal":5,"nombra el apartado por su número (3.1 / 3.5) sin citarlo":2,"no menciona nada reconocible de CLI-12":1,"cita un trozo MÁS CORTO del principio, sin el ancla":1,"otra cosa":2,"parafrasea el principio fuera de comillas":2}
  CON ESTILOS QUE R3 NO RECONOCE: 3 de 13
```

**Leído** (Code): **por ancla, 8**: falta CLI-12 en 6 (nombra el apartado por su número sin citarlo, 2; parafrasea el principio fuera
de comillas, 2; cita un trozo más corto del principio, 1; nada reconocible, 1) y falta NOR-10 en 2. **Esas 2 no citan el permiso:
citan la SEGUNDA frase del §2.4, la de A** («El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad
última»), contra el principio del §3.1. **Por la regla del producto, 13**: las mismas 6 de CLI-12, y en NOR-10 7 (el permiso citado
pero no literal, 5; la frase de A, 2). **Los estilos de cita que R3 no reconoce: 0.** Las tres «comillas invertidas» que marcó la
herramienta eran la etiqueta `norma_contra_norma`, no una cita (comprobado). **En 4 de las 6 a las que les falta CLI-12, el juez
no cita CLI-12 de ninguna forma** (número, paráfrasis o nada): no hay una cita más corta que un discriminador más barato pudiera
recoger. *(⚠️ 06/11, Code: **el «4» está mal, son 5 de 6.** El propio desglose de arriba da, de las 6, número del apartado 2,
paráfrasis fuera de comillas 2 y nada reconocible 1, que son 5 sin ninguna cita de CLI-12; sólo 1 cita un trozo más corto. Lo cazó Code
al revisar la adenda del arquitecto del 06/11, que lo había copiado de aquí. La conclusión no cambia: refuerza que acortar el ancla no
ayuda. El «4 de las 6» de la suspensión de P-F130-23, más abajo, viene de este error.)*

### EL LECTOR CORREGIDO, PROPUESTO: `contar_quinto.mjs` HUELLA `5210ea9a40ccf6c0` (sustituiría a `e21387a1ff2e7305`; PENDIENTE DE APROBACIÓN)

**Descrito por lo que quita** (arquitecto: no por las respuestas que arregla): en cada línea, antes de buscar el veredicto, (1) el
marcador de viñeta inicial; (2) las citas, incluida la comilla que se abre o se cierra fuera de la línea; (3) SÓLO EN LA PREGUNTA 2,
el prefijo «Sí, hay hallazgo». La línea que se queda vacía se salta en vez de terminar la búsqueda. **La primera versión aplicaba (3)
también en la pregunta 1**, donde «Sí, hay hallazgo» es un «sí» correcto, y 5 preguntas 1 del quinto dejaron de decidirse: **lo cazó
su prueba de formato** y se limitó a la 2. **Dos pruebas cambiadas a propósito**, con su motivo escrito al lado (el seguro de
polaridad seguido de «No se pueden cumplir»; y la vez 13 de la primera tanda, cuyo veredicto va detrás de las viñetas); cinco nuevas.
**67 de 67. Seis mutantes del lector, los seis en rojo** (dos sobrevivieron a la primera —quitar la viñeta y la comilla abierta— y se
añadió un caso decisivo para cada uno). `contar_brazos.mjs` sin tocar (`527b3ad22bb79110`), 34 de 34 con el lector nuevo.

**LA REGRESIÓN SOBRE EL QUINTO**, el guion aprobado frente al nuevo, con el compromiso del arquitecto escrito antes de verlo (se
informa salga como salga, aunque deje al quinto peor):

```
===== TANDA 1 DEL QUINTO · APROBADO (e21387a1ff2e7305)
1 · LAS FALLIDAS: 0
2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 2 de 21 — pulsación 1, vez 3: pregunta 2: veredicto sin decidir · pulsación 1, vez 9: pregunta 2: veredicto sin decidir
3 · COLUMNA 1, ¿salió el quinto?: 13 de 21 (se compara con los 9 de 21)
4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 4 de 21 — pulsación 1, vez 3: pregunta 2: veredicto sin decidir · pulsación 1, vez 9: pregunta 2: veredicto sin decidir · pulsación 1, vez 11: pregunta 2: veredicto sin decidir · pulsación 1, vez 13: pregunta 2: veredicto sin decidir
5 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: 5 · la 2: 3 · las dos: 3 · sin decidir: 2
===== TANDA 1 DEL QUINTO · LECTOR CORREGIDO (5210ea9a40ccf6c0)
1 · LAS FALLIDAS: 0
2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 2 de 21 — pulsación 1, vez 3: pregunta 2: veredicto sin decidir · pulsación 1, vez 9: pregunta 2: veredicto sin decidir
3 · COLUMNA 1, ¿salió el quinto?: 13 de 21 (se compara con los 9 de 21)
4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 3 de 21 — pulsación 1, vez 3: pregunta 2: veredicto sin decidir · pulsación 1, vez 9: pregunta 2: veredicto sin decidir · pulsación 1, vez 11: pregunta 2: veredicto sin decidir
5 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: 6 · la 2: 3 · las dos: 3 · sin decidir: 1
===== TANDA 2 DEL QUINTO · APROBADO (e21387a1ff2e7305)
1 · LAS FALLIDAS: 0
2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 4 de 21 — pulsación 1, vez 4: pregunta 2: veredicto sin decidir · pulsación 1, vez 5: pregunta 2: veredicto sin decidir · pulsación 1, vez 11: pregunta 2: veredicto sin decidir · pulsación 1, vez 12: pregunta 2: veredicto sin decidir
3 · COLUMNA 1, ¿salió el quinto?: 12 de 21 (se compara con los 9 de 21)
4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 5 de 21 — pulsación 1, vez 3: pregunta 2: veredicto sin decidir · pulsación 1, vez 4: pregunta 2: veredicto sin decidir · pulsación 1, vez 5: pregunta 2: veredicto sin decidir · pulsación 1, vez 11: pregunta 2: veredicto sin decidir · pulsación 1, vez 12: pregunta 2: veredicto sin decidir
5 · P-P3-2: NO PUNTUABLE (5 de 21 con la pregunta 2 sin decidir). No afecta a la columna 1 ni a las bandas.
===== TANDA 2 DEL QUINTO · LECTOR CORREGIDO (5210ea9a40ccf6c0)
1 · LAS FALLIDAS: 0
2 · LA COLUMNA 1 ILEGIBLE (cuenta para el tope de 4): 4 de 21 — pulsación 1, vez 4: pregunta 2: veredicto sin decidir · pulsación 1, vez 5: pregunta 2: veredicto sin decidir · pulsación 1, vez 11: pregunta 2: veredicto sin decidir · pulsación 1, vez 12: pregunta 2: hallazgo con un ancla fuera de comillas
3 · COLUMNA 1, ¿salió el quinto?: 12 de 21 (se compara con los 9 de 21)
4 · LA PREGUNTA 2 SIN DECIDIR (su tope, 4): 4 de 21 — pulsación 1, vez 3: pregunta 2: veredicto sin decidir · pulsación 1, vez 4: pregunta 2: veredicto sin decidir · pulsación 1, vez 5: pregunta 2: veredicto sin decidir · pulsación 1, vez 11: pregunta 2: veredicto sin decidir
5 · COLUMNA 2, ¿por qué pregunta? (puntúa P-P3-2, no afecta a la 1): la 1: 3 · la 2: 4 · las dos: 4 · sin decidir: 1
```

- **La columna 1 no cambia en ninguna tanda**: 13 de 21 en la primera y **12 de 21 en la segunda**, con 4 ilegibles (la vez 12
  cambia de motivo: ya no «sin decidir», sino «un ancla fuera de comillas»).
- **P-P3-2 VUELVE A SER PUNTUABLE** en la segunda tanda: la pregunta 2 sin decidir baja de 5 a 4 de 21, dentro de su tope. Su
  columna 2: **la 1: 3 · la 2: 4 · las dos: 4 · sin decidir: 1.** La puntuación es del arquitecto (P-P3-2, enmienda 3, línea 956).
  ⚠️ Con un lector que no está aprobado todavía: es provisional hasta que lo esté.

**LA CONDICIÓN 1 CON EL LECTOR NUEVO** (en seco, con `contar_brazos.mjs` sin tocar): sigue saliendo «SE REPITE» en las tres corridas.

```
===== CORRIDA 1 (N=20), LECTOR CORREGIDO
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 20
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 9, por la regla del producto 11 (de ellas, a caballo: 0)
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
      8 NADA      12 PARCIAL 
===== CORRIDA 2 (N=20), LECTOR CORREGIDO
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 20
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 7, por la regla del producto 9 (de ellas, a caballo: 0)
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
      6 NADA      10 PARCIAL 
===== CORRIDA 3 (N=40), LECTOR CORREGIDO
la pareja del §3.1 (NOR-10·4 ↔ CLI-12·3) · n = 40
1 · LAS FALLIDAS: 0
2 · LAS ILEGIBLES, ANTES QUE NINGÚN NÚMERO: por ancla 16, por la regla del producto 20 (de ellas, a caballo: 0)
SE REPITE: más de 4 ilegibles. No se enseña ningún número de «sale».
     14 NADA      22 PARCIAL 
```
(La última línea de cada corrida cuenta las ilegibles de los DOS recuentos juntos por la clase de su pregunta 2.) En la corrida de
40: **NADA baja de 9 a 7 por recuento**, y el PARCIAL por ancla sube de 8 a 9 (una de las que antes no decidían ahora decide, y le
falta un lado).

**LAS 7 QUE SIGUEN SIN DECIDIR** (`nada_tras_lector.mjs`, sin huella): **el juez SÍ decide, pero dentro de una línea de
razonamiento**, no al principio de una línea, que es lo único que R2' lee:

```
condición 1, vez 3 · 16 líneas · las que hablan de cumplir o llevan sí/no fuera de las citas:
     «· EL CUMPLIMIENTO»
     «Ambos textos son reglas, porque asignan responsabilidades. Busco un par de frases de un texto y del otro que mande sobre cosas distintas y que no se puedan cump»
     «Si se hace lo que el TEXTO 1 permite, es decir, que el Director Clínico sea también el Coordinador de Calidad, la responsabilidad última de la esterilización re»
condición 1, vez 5 · 10 líneas · las que hablan de cumplir o llevan sí/no fuera de las citas:
     «· EL CUMPLIMIENTO»
     «Los dos textos contienen reglas, así que procede preguntar si pueden cumplirse a la vez. La respuesta es no.»
     «El principio de CLI-12 excluye que quien gestiona la agenda asistencial, es decir el Director Clínico, quede a cargo de la esterilización. NOR-10 permite justam»
condición 1, vez 17 · 12 líneas · las que hablan de cumplir o llevan sí/no fuera de las citas:
     «· EL CUMPLIMIENTO»
     «Ambos textos son reglas: reparten responsabilidades. Pregunto si se pueden cumplir a la vez, mirando frases de un texto y del otro.»
     «Si se hace lo que el Texto 1 permite (que el Coordinador de Calidad sea el propio Director Clínico), la responsabilidad de la esterilización recae sobre quien g»
condición 1, vez 18 · 12 líneas · las que hablan de cumplir o llevan sí/no fuera de las citas:
     «· EL CUMPLIMIENTO»
     «Ambos textos son reglas que reparten responsabilidades, así que la pregunta es aplicable. No, no se pueden cumplir las dos a la vez.»
     «NOR-10 permite justo lo que el principio de CLI-12 excluye: que el Coordinador de Calidad sea el Director Clínico. Si una clínica usa ese permiso, la responsabi»
repetida, vez 3 · 12 líneas · las que hablan de cumplir o llevan sí/no fuera de las citas:
     «· EL CUMPLIMIENTO»
     «La primera frase permite que el Coordinador de Calidad sea el propio Director Clínico. La segunda enuncia el principio de que la responsabilidad de esterilizaci»
repetida, vez 5 · 14 líneas · las que hablan de cumplir o llevan sí/no fuera de las citas:
     «· EL CUMPLIMIENTO»
     «Ambos textos son reglas, porque reparten responsabilidades. Así que sí hay que comprobar si se pueden cumplir a la vez.»
     «Si se hace lo que permite el texto 1, es decir, que el Director Clínico sea también el Coordinador de Calidad, se rompe el principio del texto 2, que exige sepa»
repetida, vez 12 · 12 líneas · las que hablan de cumplir o llevan sí/no fuera de las citas:
     «· EL CUMPLIMIENTO: SÍ, HAY HALLAZGO»
     «Ambos textos son reglas, así que aplico la prueba de cumplimiento. El TEXTO 1 permite algo, de modo que la pregunta es: si se hace lo que permite, ¿se puede cum»
     «Si el Director Clínico ocupa el cargo de Coordinador de Calidad, como permite el TEXTO 1, la regla del TEXTO 2 no se puede cumplir: el responsable último de la »
     «Es un conflicto normativo, no solo un dato distinto: las dos reglas no regulan exactamente lo mismo (una regula quién puede ocupar el cargo y la otra quién resp»
```
«La respuesta es no.», «… así que la pregunta es aplicable. No, no se pueden cumplir las dos a la vez.», «la regla del TEXTO 2 no se
puede cumplir». **Leerlas exigiría una regla nueva** (formas de veredicto a principio de FRASE, no de línea), con el riesgo de leer
como veredicto un razonamiento que empiece por «No…». **No se ha hecho: es una decisión del arquitecto**, y ajustar el lector hasta
que pasen estas 7 sería calibrar sobre una muestra con bloque. ⚠️ **Y una fuga, dicha**: estas líneas enseñan cómo decidió el juez
en esas 7 respuestas de la condición 1 (que no es ninguno de los seis brazos).

**El guion propuesto, entero:**

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
    referencia: 'se compara con los 12 de 21 del quinto', etiqueta: true, col2: 'LA COLUMNA 2 DE D', col2Puntua: 'no afecta a la 1',
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
// ⚠️ EL LECTOR CORREGIDO (05/11/2026, arquitecto: «arregla el lector»), descrito por LO QUE QUITA y no por las respuestas que
// arregla. Antes, una viñeta o una cita delante del veredicto TERMINABA la búsqueda («sin decidir»), y el prefijo «Sí, hay
// hallazgo» la terminaba también; en la condición 1 de D eso dejó 9 preguntas 2 sin decidir, las 9 de lectura y ninguna de
// sustancia. Ahora, en cada línea, ANTES de buscar el veredicto, se QUITAN tres cosas, y la línea que se queda vacía se SALTA:
//   (1) el marcador de viñeta del principio de la línea («- » o «• »);
//   (2) las citas: el texto entre «…», “…” o "…" (y, si una comilla se abre o se cierra fuera de la línea, lo que va de ella al
//       borde de la línea);
//   (3) el prefijo del seguro de polaridad: «Sí, hay hallazgo» (con o sin coma, y con su puntuación) al principio de la línea.
// Lo demás de R2' no cambia: las formas de veredicto, la comprobación de «sí» y «no» en la primera frase, y el seguro de
// polaridad para las formas que no son ese prefijo. Sin ninguna línea con veredicto en toda la sección: «sin decidir».
const SI = /(^|[^\p{L}])sí([^\p{L}]|$)/iu, NO = /(^|[^\p{L}])no([^\p{L}]|$)/iu;
const quitarCitas = s => s.replace(/«[^»]*»|“[^”]*”|"[^"]*"/g, ' ').replace(/[«“][^»”]*$/, ' ').replace(/^[^«“]*[»”]/, ' ');
export function veredicto(seccion, pregunta = 1) {
  const lineas = seccion.split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const cruda = quitarCitas(lineas[i].replace(/^\s*[-•]\s+/, ''));
    let l = (i === 0 ? cruda.replace(/^[\s·:.\-–—]*(el dato|el cumplimiento)?[\s·:.\-–—]*/i, '') : cruda).trim();
    if (l.includes('?')) l = l.slice(l.lastIndexOf('?') + 1).trim();
    l = l.replace(/^((respuesta|hay hallazgo|hallazgo)\s*:\s*)+/i, '').trim();
    // (3), SÓLO EN LA PREGUNTA 2: es donde «sí» es lo contrario del hallazgo y el prefijo es la polaridad al revés. En la 1,
    // «Sí, hay hallazgo» es un «sí» correcto y se queda (la primera versión lo quitaba también allí: 5 preguntas 1 del quinto
    // dejaron de decidirse, y lo cazó su prueba de formato).
    if (pregunta === 2) l = l.replace(/^s[ií],?\s+hay\s+hallazgo[\s.:;,!—–-]*/i, '').trim();
    if (l === '' || /^[\s.:;,!—–-]*$/.test(l)) continue;
    let v = null, frase = false;
    if (pregunta === 2 && /^no se pueden cumplir/i.test(l)) { v = 'no'; frase = true; }
    else if (pregunta === 2 && /^(s[ií][,\s]+)?se pueden cumplir/i.test(l)) { v = 'sí'; frase = true; }
    else if (/^sí([^\p{L}]|$)/iu.test(l) || /^si([.,;:!]|$)/i.test(l)) v = 'sí';
    else if (/^no([^\p{L}]|$)/iu.test(l)) v = 'no';
    if (v === null) continue;
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

// P-D-3 · LA ETIQUETA (regla del arquitecto, 04/11, escrita antes de la tanda; SÓLO en los casos con `etiqueta: true`, hoy D).
// Sobre cada respuesta que la columna 1 cuente como hallazgo, en su texto ENTERO: se buscan las cadenas literales
// «norma_contra_norma» y «norma_contra_practica», sin mayúsculas y quitadas las barras invertidas (el «\_» del markdown); lo
// que las rodee (comillas, backticks, negritas) no importa. Exactamente una → ésa; ninguna → «sin etiqueta»; las dos →
// «etiqueta sin decidir», a una lista con su vez y SIN asignar. Las respuestas que no son hallazgo no se miran.
// ⚠️ LITERAL A PROPÓSITO: «norma contra norma» con espacios, o «norma_contra_práctica» con tilde, NO son la cadena: cuentan como
// «sin etiqueta». La predicción: con k hallazgos, «norma_contra_norma» en MÁS DE LA MITAD; la nula, un tercio para cada una de
// las tres salidas, y su tasa de error se calcula con la k observada: P(X > k/2), X binomial(k, 1/3).
export function etiquetaDe(texto) {
  const t = texto.toLowerCase().replace(/\\/g, '');
  const nn = t.includes('norma_contra_norma'), np = t.includes('norma_contra_practica');
  return nn && np ? 'sin decidir' : nn ? 'norma_contra_norma' : np ? 'norma_contra_practica' : 'sin etiqueta';
}
export function colaBinomial(k, umbral, p) { // P(X >= umbral), X ~ binomial(k, p)
  let s = 0, c = 1;
  for (let x = 0; x <= k; x++) { if (x > 0) c = c * (k - x + 1) / x; if (x >= umbral) s += c * p ** x * (1 - p) ** (k - x); }
  return s;
}
const pct = x => (100 * x).toFixed(3).replace('.', ',');

export function resumen(pulsaciones, caso = CASOS.quinto) {
  const N = caso.n, TOPE = caso.tope;
  const buenas = [], fallidas = [];
  pulsaciones.forEach((respuestas, p) => respuestas.forEach(r => {
    const id = `pulsación ${p + 1}, vez ${r?.vez}`;
    if (fallida(r)) { if (buenas.length < N) fallidas.push(`${id}: ${r?.error ?? 'texto vacío'}`); }
    else if (buenas.length < N) buenas.push({ id, ...contar(r, caso), etiqueta: etiquetaDe(r.respuesta) });
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
  if (caso.etiqueta) {
    const k = limpias.length, de = e => limpias.filter(f => f.etiqueta === e), nn = de('norma_contra_norma').length;
    const dudosas = de('sin decidir');
    salida.push(`6 · LA ETIQUETA (P-D-3), sobre los ${k} hallazgos: norma_contra_norma ${nn} · norma_contra_practica ${de('norma_contra_practica').length} · sin etiqueta ${de('sin etiqueta').length} · etiqueta sin decidir ${dudosas.length}${dudosas.length ? ' — ' + dudosas.map(f => f.id).join(' · ') : ''}`);
    if (k === 0) salida.push('7 · P-D-3: NO PUNTUABLE (no hay ningún hallazgo sobre el que contar la etiqueta).');
    else salida.push(`7 · P-D-3, ¿norma_contra_norma en más de la mitad?: ${nn > k / 2 ? 'SÍ' : 'NO'} (${nn} de ${k}; hace falta ${Math.floor(k / 2) + 1}) · tasa de error con k = ${k}, nula de un tercio: ${pct(colaBinomial(k, Math.floor(k / 2) + 1, 1 / 3))} %`);
  }
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
  // CAMBIADA A PROPÓSITO con el lector corregido (05/11): el prefijo «Sí, hay hallazgo» se quita y se lee lo que sigue; aquí sigue
  // «No se pueden cumplir», así que la 2 decide «no» y el quinto sale por la 2. (Con el lector anterior, ilegible en las dos.)
  ['EL SEGURO DE POLARIDAD: «Sí, hay hallazgo» seguido de «No se pueden cumplir» → la 2 decide «no»', R(20, `PREGUNTA 1\nNo.\nPREGUNTA 2\nSí, hay hallazgo. ${N} ${C1} No se pueden cumplir.`), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
  ['EL SEGURO DE POLARIDAD: «Sí, hay hallazgo» sin nada que decida detrás → la 2 sigue sin decidir', R(21, `PREGUNTA 1\nNo.\nPREGUNTA 2\nSí, hay hallazgo.\n${N} ${C1}`), { quinto: null, cubo1: ['pregunta 2: veredicto sin decidir'], cubo2: ['pregunta 2: veredicto sin decidir'] }],
  ['LECTOR CORREGIDO: el veredicto detrás de las viñetas con citas se lee', R(22, `PREGUNTA 1\nNo.\nPREGUNTA 2\n- Texto 1: ${N}\n- Texto 2: ${C1}\nNo se pueden cumplir las dos a la vez.`), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
  ['LECTOR CORREGIDO (1): el veredicto DENTRO de una viñeta se lee, quitado el marcador', R(24, `PREGUNTA 1\nNo.\nPREGUNTA 2\n- No se pueden cumplir: ${N} ${C1}`), { quinto: true, porPregunta: 'la 2', cubo1: [], cubo2: [] }],
  ['LECTOR CORREGIDO (2): una cita que se abre y sigue en la línea siguiente no mete su «no» en la primera frase', R(25, `PREGUNTA 1\nSí «aunque el texto no lo diga así,\ncontinúa la cita»\n${N} ${C1}\nPREGUNTA 2\nSí.`), { quinto: true, porPregunta: 'la 1', cubo1: [], cubo2: [] }],
  ['LECTOR CORREGIDO: una cita que lleva «no» dentro no se lee como veredicto', R(23, `PREGUNTA 1\nNo.\nPREGUNTA 2\n${C2}\nSí, se pueden cumplir.`), { quinto: false, cubo1: [], cubo2: [] }],
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
  // LAS PRUEBAS DE P-D-3, la etiqueta (respuestas inventadas)
  const ETQ = (e, v) => R(v, `PREGUNTA 1\nNo.\nPREGUNTA 2\nNo se pueden cumplir. ${ND} ${CD} ${e}`);
  PRUEBAS_DE_D.push(
    ['P-D-3: una sola cadena → ésa, entre backticks, en negrita, con «\\_» o en mayúsculas', () => ['`norma_contra_norma`', '**norma_contra_practica**', 'norma\\_contra\\_norma', 'NORMA_CONTRA_NORMA'].map(etiquetaDe),
      ['norma_contra_norma', 'norma_contra_practica', 'norma_contra_norma', 'norma_contra_norma']],
    ['P-D-3: las dos → sin decidir; ninguna, con espacios o con tilde → sin etiqueta', () => ['es norma_contra_norma, no norma_contra_practica', 'nada', 'norma contra norma', 'norma_contra_práctica'].map(etiquetaDe),
      ['sin decidir', 'sin etiqueta', 'sin etiqueta', 'sin etiqueta']],
    ['P-D-3: sólo cuentan los hallazgos (las 6 que no son D llevan la cadena y no se miran); 22 de 36 es más de la mitad',
      () => resumen([[...veces(21, v => ETQ('norma_contra_norma', v))], [ETQ('norma_contra_norma', 1), ...veces(13, v => ETQ('norma_contra_practica', 1 + v)), ETQ('norma_contra_norma y norma_contra_practica', 15), ...veces(6, v => R(15 + v, 'PREGUNTA 1\nNo.\nPREGUNTA 2\nSí. norma_contra_norma'))]], CASOS.D).slice(5),
      ['6 · LA ETIQUETA (P-D-3), sobre los 36 hallazgos: norma_contra_norma 22 · norma_contra_practica 13 · sin etiqueta 0 · etiqueta sin decidir 1 — pulsación 2, vez 15',
        `7 · P-D-3, ¿norma_contra_norma en más de la mitad?: SÍ (22 de 36; hace falta 19) · tasa de error con k = 36, nula de un tercio: ${pct(colaBinomial(36, 19, 1 / 3))} %`]],
    ['P-D-3: la mitad justa NO es más de la mitad', () => resumen([[...veces(21, v => ETQ('norma_contra_norma', v))], [...veces(21, v => ETQ('', v))]], CASOS.D).slice(6),
      [`7 · P-D-3, ¿norma_contra_norma en más de la mitad?: NO (21 de 42; hace falta 22) · tasa de error con k = 42, nula de un tercio: ${pct(colaBinomial(42, 22, 1 / 3))} %`]],
    ['P-D-3: sin hallazgos, no puntuable', () => resumen([[...veces(21, nada)], [...veces(21, nada)]], CASOS.D).slice(6),
      ['7 · P-D-3: NO PUNTUABLE (no hay ningún hallazgo sobre el que contar la etiqueta).']],
    ['la cola binomial contra un valor a mano: P(X >= 2), binomial(3, 1/3) = 7/27', () => colaBinomial(3, 2, 1 / 3).toFixed(9), (7 / 27).toFixed(9)],
    ['el quinto NO lleva etiqueta en su salida', () => resumen([[...veces(21, bien)]]).length, 5],
  );
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
  // CAMBIADA A PROPÓSITO con el lector corregido (05/11): la 13 sale de la lista, porque su veredicto está detrás de las viñetas y
  // ahora se lee. La 3, la 9 y la 11 siguen sin decidir.
  const sinDecidirLa2 = [3, 9, 11];
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

## ⚠️ P-F130-23, SUSPENDIDO ANTES DE CORRER NINGÚN BRAZO (arquitecto, 05/11/2026)

**EL LECTOR CORREGIDO, APROBADO** (arquitecto, 05/11): `contar_quinto.mjs`, SHA-256
`5210ea9a40ccf6c04d0f095d0b39c126c03c2b120b362c9d9f0c9be911b4a4c6` (huella `5210ea9a40ccf6c0`; sustituye a `e21387a1ff2e7305`).
`contar_brazos.mjs` sigue en `527b3ad22bb79110440b0b7fffff8b64ec48f7e0242a8bec986d9c89ed62e43f`. **La columna 1 del quinto no cambia
con él** (13 de 21 y 12 de 21): el defecto del lector no contaminó las cifras publicadas.

**La suspensión, literal**, sacada del registro con un script:

```
P-F130-23 · SE SUSPENDE EL 05/11/2026, ANTES DE CORRER NINGÚN BRAZO.
Decisión del arquitecto. No se vio ninguna cifra de «sale» de ningún brazo.

1. EL APARATO NO PUEDE RESOLVERLO (medido). Con el lector corregido, la
   condición 1 deja 16 ilegibles de 40 por ancla y 20 por la regla del
   producto. El techo de PARCIAL para que n = 42 vea una caída del 90 % al
   50 % es 5 de 42. Estamos en 9 o más. Subir el n no lo arregla: con el 20 %
   de PARCIAL harían falta 210 por brazo (60 pulsaciones) y con el 32,5 % el
   signo de la diferencia está invertido y NINGÚN n lo arregla.
2. NO HAY PALANCA BARATA (medido). En 4 de las 6 respuestas sin el lado de
   CLI-12, el juez no cita CLI-12 de ninguna forma. Acortar el ancla no
   bajaría el PARCIAL de 8 a 5, porque la cita más corta aparece una sola vez.
   Y no hay citas en estilos no reconocidos: ninguna.
3. Y LA RAZÓN DE FONDO: EL EXPERIMENTO NO MIDE LA PREGUNTA QUE SE HIZO.
   La pregunta del director es si el bloque del principio es AD HOC. Ad hoc
   significa «sólo funciona en el caso para el que se escribió». P-F130-23
   mide cuánto depende D del bloque, que es otra cosa: un bloque que
   describa una clase real también haría caer a D al quitarlo. LA PRUEBA DE
   LA GENERALIDAD NO ES QUITAR LA REGLA DEL CASO QUE LA INSPIRÓ: ES APLICARLA
   EN OTRO SITIO.

LO QUE NO SE HACE: la regla de leer el veredicto en mitad de línea. Code la
describió y no la escribió, correctamente: ajustarla hasta que pasen esas 7
respuestas sería calibrar el instrumento sobre una muestra CON bloque.

LO QUE SE CONSERVA: el lector corregido, la lista de las cinco piezas
construidas para el quinto, los dos recuentos, la regla de las cotas cruzadas
y las cuatro reglas de método del día. Nada de eso se tira: lo que se tira es
el contraste.
```

**EL SÉPTIMO DEFECTO PARA LA LISTA DE FABLE** (arquitecto): la medición que Fable propuso (P-F130-23) no pone a prueba la afirmación
que Fable hace. Afirma que el bloque «describe una clase de casos» y propone medirlo QUITÁNDOLO DEL CASO QUE LO INSPIRÓ. **Eso mide
dependencia, no generalidad.**

**P-P3-2, PENDIENTE DE PUNTUAR POR EL ARQUITECTO** con el texto literal delante (líneas 956-959, enmienda 3; aclarada en 1004-1005 y
1041-1042: «Un quinto que salga por la pregunta 2 SÍ cuenta en (1) y hace FALLAR P-P3-2»), contra la columna 2 de la segunda tanda
con el lector aprobado: la 1: 3 · la 2: 4 · las dos: 4 · sin decidir: 1. **Se puntúa con un lector distinto del que había cuando se
prerregistró**, y con las dos lecturas al lado (con el anterior, NO PUNTUABLE por 5 de 21 sin decidir).

### EL TOPE DIARIO DE ANÁLISIS RÁPIDOS, A 50: LO QUE DICE EL CÓDIGO (Code, 05/11/2026; NO SE HA TOCADO NADA)
*(⚠️ CORREGIDA EL MISMO DÍA: su «pasa de unos 0,93 $» y todo lo que da por vigente un tope de 30 son FALSOS. El valor real era 9999: ver «RATE_LIMIT_ANALYZE VALE 9999», más abajo.)*
- **El valor no está en el código: está en Vercel.** `getLimit` (`lib/rate-limiter.ts:130-140`) lee `RATE_LIMIT_ANALYZE` de las
  variables de entorno, y **sólo si no existe** usa el 30 del código (`:23`). Subir el número del código no cambiaría nada si la
  variable está puesta; el cambio es del director, en Vercel, y entra con el siguiente despliegue.
- **No desbloquea P-F130-23 ni lo habría desbloqueado nunca** (arquitecto): la herramienta llama al juez directamente, cuesta 0
  créditos y no pasa por el limitador. **El motivo del cambio es el trabajo que viene** (E5 y el etiquetado), y ya estaba pendiente
  con disparador (`Estado_Y_Pendientes_14-10-2026.md`, «EL LÍMITE DE 30 ANÁLISIS RÁPIDOS AL DÍA», 02/11).
- **Lo que cuelga de él**: (1) es POR USUARIO y día y sólo cuenta los rápidos que salieron bien (`:83-100`); (2) **el coste**, a unos
  0,031 $ por análisis, pasa de unos 0,93 $ a unos 1,55 $ por usuario y día como máximo; (3) **los créditos**: 5 por análisis rápido,
  así que 50 al día son 250 créditos; el saldo de la organización sigue mandando, y en un plan pequeño se acaba antes que el tope;
  (4) **la carga no cambia**: un solo análisis activo por organización (`checkAndAcquireAnalysisLock`, `app/api/analyze-v2/route.ts`,
  409 si hay otro en curso), y el limitador de Anthropic por minuto (`lib/llm/rate-limiter.ts:4-6`) es global y no depende del
  tope diario; (5) **el exhaustivo tiene su propio tope** (`RATE_LIMIT_EXHAUSTIVE`, 10 por defecto) y no se mueve.
- **Para escribir el valor viejo, el nuevo y las dos fechas, falta el valor que tiene HOY Vercel** (30, o lo que diga): lo da el director.

## P-P3-2 · PUNTUADA: FALLA (arquitecto, 05/11/2026)

**Con el texto literal delante** (líneas 956-959, aclarado en 1004-1005 y 1041-1042). **Se puntúa con un LECTOR DISTINTO del que había
al prerregistrarla**: el corregido, `contar_quinto.mjs` `5210ea9a40ccf6c0`, aprobado el 05/11. Con el anterior (`e21387a1ff2e7305`)
era NO PUNTUABLE (5 de 21 sin decidir en la pregunta 2, por encima de su tope de 4); el nuevo movió las sin decidir de 5 a 4, y **ese
único cambio no puede voltear un 8 contra 3**.

**Segunda tanda, la del paso 3** (12 que salieron): la 1: 3 · la 2: 4 · las dos: 4 · sin decidir: 1. Decididas, 11: **la pregunta 2
DISPARÓ en 8 (72,7 %)**; la pregunta 1 limpia en 3 (27,3 %, **Wilson del 9,7 % al 56,6 %**; si la sin decidir fuera limpia, 4 de 12,
del 13,8 % al 60,9 %).
**P-P3-2 FALLA, y falla por lo que decía, no por un umbral**: era una predicción sobre LA VÍA, la predicha era la 1, y la 2 disparó
en la mayoría. **La dirección es clara y la magnitud no está fijada.** *(Una precisión de Code al cifrarlo: el «p = 0,11 contra la
mitad» del arquitecto es UNILATERAL, P(X ≤ 3) con n = 11; el bilateral es 0,227. Ninguno afirma que la vía limpia sea
significativamente minoritaria, que es lo que él escribió.)*

**La columna 2 de la primera tanda** (la de 13 de 21; el arquitecto la pidió), con el mismo lector aprobado:
- la 1: 6 · la 2: 3 · las dos: 3 · sin decidir: 1. Decididas, 12: la pregunta 2 disparó en 6 (50 %); limpia en 6 (Wilson del 25,4 %
  al 74,6 %).
- ⚠️ **Esa tanda se declaró ILEGIBLE en su día** con la regla de entonces, y fue la que obligó a endurecer el lector: estas cifras
  son de releerla con el lector de hoy, no las de su momento.
- **Las dos tandas juntas**: decididas 23, la 2 disparó en 14, limpia en 9 (39,1 %, Wilson del 22,2 % al 59,2 %; contra la mitad,
  bilateral, p = 0,405). **Entre tandas**: limpia 6 de 12 frente a 3 de 11, Fisher p = 0,400: no se separan.

**LO QUE SIGNIFICA** (arquitecto): el quinto no sólo sale poco, **sale sobre todo por la vía equivocada**: el juez lo lee como un
problema de cumplimiento siendo un caso de dato. **Es el segundo apoyo MEDIDO de la decisión del 01/11**, y el que apunta al riesgo:
la razón 2 decía, sin medirlo, que el mecanismo que encadenaría glosario, cláusula y referencia «es el mismo que produce falsos
positivos razonados»; un hallazgo alcanzado por la familia equivocada es esa máquina. *(Observación, no medición, y marcada así por
el arquitecto: él clasificó mal el quinto dos veces y el modelo lo hace en la mayoría; el caso parece estar en una frontera donde
la taxonomía no decide.)*

### E5 · LA DEFINICIÓN DEL ARQUITECTO, QUE VIVE EN EL PROYECTO (pegada por él el 05/11; Code no la ha visto en su sitio)
> **E5 · la curva de acumulación.** De Fable, dictamen de F-130 del 28/10: «E5 · Curva de acumulación. Diez pasadas. P-F130-5: se
> aplana entre 7 y 9 distintos a partir de la sexta; D aparece antes de la quinta.» Ampliado el 31/10: «E5 sobre las tres parejas
> con siembra, veinte pasadas cada una, antes de activar».
> - **Son dos curvas**, una sin la pasada 2 y otra con ella: es lo que distingue «sube la cobertura en general» de «sube D en esta
>   pareja». La primera NO SE HA CORRIDO NUNCA.
> - Se puede sacar de las pasadas que ya existen **sin gastar nada** —las discrepancias están guardadas—, pero falta **un criterio
>   de cuándo dos hallazgos de pasadas distintas son «el mismo»**, y ese criterio no está escrito. (Y es, literalmente, el mismo
>   problema que el producto intenta resolver.)
> - **El nombre está sobrecargado:** el 30/10 se llamó «E5» a la medición de veinte por condición de la pregunta cerrada, que es
>   otra cosa — una variante de E3.

**PENDIENTE, CON SU MOTIVO** (arquitecto): el criterio de «cuándo dos hallazgos de pasadas distintas son el mismo» NO se escribe hoy.
Después de la regla inventada de esta mañana, no se inventa un criterio de equivalencia con prisa.

### LOS FALSOS DE AGOSTO: QUÉ HAY ARCHIVADO (Code, 05/11/2026, para que el arquitecto decida si sirven de banco de pruebas)
- **No están certificados como PAREJAS sin conflicto: están certificados FRASE A FRASE.** `corpus-pruebas/SIEMBRA_falsos_de_agosto.md`
  declara, para cada falso, el par de frases que el sistema emparejó mal y **por qué ese par no se opone**, y su comprobación
  (`lib/examen/discriminantes.mjs`) es que cada frase se pueda citar desde un fragmento y no salga en el documento contrario. **No
  dice que el resto de la pareja no tenga ningún conflicto.**
- **Una de las parejas TIENE una contradicción real**: OPE-01 ↔ CLI-01, el ciclo del autoclave (134 °C / 18 min frente a 121 °C /
  30 min), que su caso lleva en los que deben salir. **No es una pareja sin conflicto.**
- **Son cuatro falsos, no cinco**: el 1 (pelo recogido, MKT-01 ↔ RRHH-05), el 3 (RRHH-04 ↔ RRHH-06), el 4 (NOR-04 ↔ OPE-01) y el
  5 (OPE-01 ↔ CLI-01). El 2 (calzado, la misma pareja que el 1), el 6 (RRHH-06 ↔ OPE-02) y el 7 no tienen su cita y no se pueden
  usar.
- **No se han vuelto a pasar desde que entró el bloque del principio** (26 y 27/10), hasta donde ve el repositorio: los únicos
  resultados del examen son del 27/09 (`examen/resultados/`), y ninguna medición posterior al 26/10 nombra esos documentos.
- **Y la purga del 25/10 borró los análisis de agosto y la indexación**: si esos siete documentos están subidos HOY en la
  organización nueva es algo que el repositorio no sabe; lo sabe el director.

## ⚠️⚠️ RATE_LIMIT_ANALYZE VALE 9999: EL LÍMITE DE 30 AL DÍA NO EXISTÍA (director, 05/11/2026; archivado como hallazgo)

**El hecho**: el director miró Vercel el 05/11 y **`RATE_LIMIT_ANALYZE` vale 9999**. El 30 de `lib/rate-limiter.ts:23` es sólo el
respaldo para cuando la variable no está puesta (`getLimit`, `:130-140`), y está puesta. **El límite de 30 rápidos por usuario y día
no ha existido mientras la variable tenga ese valor**, y todo lo escrito sobre él lo daba por vigente: el estado (líneas del 02/11,
corregidas hoy al lado), la sección de esta mañana de este fichero (marcada), y las instrucciones de trabajo del arquitecto (en el
proyecto; las corrige él). **El director pidió esta mañana subir el tope para hacer más de 30 al día: ya podía hacer 9999.**
**LO QUE SE INCUMPLIÓ, y vale más que el número** (arquitecto): la regla escrita el 02/11 —si se sube, se vuelve a bajar, con el
valor viejo, el nuevo y las dos fechas escritos— existía exactamente para esto. **Se subió, no se bajó y no se escribió.** El mismo
mecanismo que las cabeceras «PENDIENTE DE EJECUTAR»: **un estado declarado que nadie comprueba**, aquí un guardia cuyo valor vive en
una variable que nadie lee.

### EL LEDGER (PENDIENTE: el cambio lo hace el director en Vercel; esto se completa cuando lo confirme)
| | |
|---|---|
| Variable | `RATE_LIMIT_ANALYZE` (Vercel), análisis rápidos por usuario y día |
| **Valor viejo, REAL** | **9999** (leído por el director el 05/11/2026; no se sabe desde cuándo) |
| **Valor nuevo** | **100**, derivado (arquitecto): lo mayor previsto es la curva E5, 60 rápidos, y el etiquetado, 20; un desboque de 100 son 500 créditos y unos 3 $ |
| Fecha del cambio | — PENDIENTE (la pone el director al hacerlo) |
| Fecha de la revisión | — PENDIENTE (la fija el arquitecto) |
| Lo que protege de verdad hoy | el saldo de créditos (5 por rápido) y el cerrojo de un análisis activo por organización (`checkAndAcquireAnalysisLock`, 409) |
- **¿Hace falta redesplegar? Sí**: en Vercel un cambio de variable de entorno no entra en el despliegue que ya está sirviendo; entra
  en el siguiente (se redespliega desde el panel o con el próximo push). **Así que es un despliegue y va con sus reglas: no durante
  una tanda.** *(Es lo que dice la documentación de Vercel; Code no puede verlo desde el repositorio.)*
- *Una precisión de Code al «unos 3.400 al día por puro reloj» del arquitecto*: es 86.400 s entre unos 25 s por análisis. El rápido
  medido de NOR-11 tardaba unos 40 s (línea 811), lo que da unos 2.160 al día por organización. El orden de magnitud no cambia: el
  reloj no es el guardia.

### EL CENSO: LAS VARIABLES DE ENTORNO QUE GOBIERNAN UN GUARDIA, UN LÍMITE O UN CORTE (Code, 05/11/2026)
Por capacidad: todo `process.env` de `lib/`, `app/`, `worker/` y `scripts/`, directo o a través de una constante con el nombre. Se
quitan las que son credenciales o direcciones (claves de API, de Supabase, Stripe, Pinecone, Google, Microsoft, URLs). Quedan:

| Variable | Qué gobierna | Defecto del código | Dónde se lee | Valor real escrito en algún sitio |
|---|---|---|---|---|
| `RATE_LIMIT_ANALYZE` | rápidos por usuario y día | 30 | Vercel (`lib/rate-limiter.ts:23`) | **9999** (director, 05/11) |
| `RATE_LIMIT_EXHAUSTIVE` | exhaustivos por usuario y día | 10 | Vercel (`:29-30`) | ninguno |
| `RATE_LIMIT_ASK` | consultas del chat por usuario y día | 100 | Vercel (`:22`) | ninguno |
| `RATE_LIMIT_STYLE` | análisis de estilo por usuario y día | 20 | Vercel (`:24`) | ninguno (`Tandas_Harness.md:1864` da el 20 del código) |
| `RATE_LIMIT_IMPROVE` | chat de mejora por usuario y día | 50 | Vercel (`:25`) | ninguno |
| `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` | presupuesto por candidato en el exhaustivo | el del rápido, 3.000 | **Railway** (el exhaustivo corre en el worker) | ninguno |
| `ANALYSIS_JUDGE_MODEL` | el modelo del juez (Haiku 4.5 o 5.5) | Haiku 4.5 | Vercel **y** Railway | Haiku 5.5 en las tandas (los JSON lo registran por llamada) |
| `ANALYSIS_PAREJA_ENTERA` | interruptor del presupuesto por pareja (sólo el rápido) | apagado (sólo «1» lo enciende) | Vercel | ninguno |
- **Y una trampa común a los cinco `RATE_LIMIT_*`**: un valor **0** significa SIN LÍMITE (`lib/rate-limiter.ts:17, 77-80`). Un 0 en
  Vercel no se distingue a simple vista de «muy restrictivo».
- **Los valores reales los da el director, de una vez**: los cinco de Vercel, y los dos de Railway (`ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` y
  `ANALYSIS_JUDGE_MODEL`), que **no** están en Vercel porque el exhaustivo corre en el worker.

### LA TABLA DE LAS MEDICIONES DE FABLE, RECALCULADA SIN EL TOPE INEXISTENTE
- **E5, 60 rápidos**: no son dos días. Con 9999 (o con 100) caben **en una sesión**: el cerrojo los pone de uno en uno, a unos 40 s
  cada uno, unos 40 minutos de máquina más lo que tarde el director en pulsar. 300 créditos, unos 1,9 $. **Y sigue bloqueada por otra
  cosa**: el criterio de cuándo dos hallazgos de pasadas distintas son el mismo, que no está escrito (pendiente del arquitecto).
- **El etiquetado de 20**: una sesión; 100 créditos, unos 0,6 $; el cuello de botella es el tiempo del director.
- **La tasa de «sí» falso** y **el segundo corpus**: no cambian (no pasan por el tope).

### ¿PUEDE EL RECUENTO DISTINGUIR UN HALLAZGO «CON FORMA DE PRINCIPIO»? NO, NO DESDE LO QUE SE GUARDA (Code, 05/11/2026)
- **La etiqueta no lleva la forma**: `conflictoNormativo` sólo vale `norma_contra_norma` o `norma_contra_practica`. Un permiso contra una
  prohibición expresa (el taller de `5ca99f12`: «nunca la misma persona») y un permiso contra un principio (el «principio SOLO» de
  `1912469a`) llevan la MISMA etiqueta.
- **El verificador tampoco la guarda**: su pregunta del cumplimiento distingue cuatro formas en el prompt (`lib/analysis/rama-de-las-
  reglas.ts:28-43`: un permiso, dos obligaciones, una práctica, un principio), pero su respuesta sólo tiene tres valores
  (`no_cumplibles`, `cumplibles`, `no_mandan`, `:47-63`) y no dice por cuál de las cuatro llegó.
- **«La etiqueta más la cita de una frase que enuncia un principio» no es mecánico**: decidir si una frase ENUNCIA un principio es
  justo la lectura que hace el bloque, y no hay ninguna lista de esas frases para ningún documento salvo el principio del §3.1. Hacerlo
  con código sería un clasificador nuevo; hacerlo con una persona es leer las dos citas de cada hallazgo con la etiqueta.
- **Lo que sí se podría, y es una propuesta que decide el arquitecto**: en vez de certificar parejas, que el director marque HALLAZGO
  A HALLAZGO, sobre los que salgan con `norma_contra_norma`, si su par de citas es «un permiso contra un principio». Es lectura humana,
  pero por hallazgo y no por pareja, y el autoclave no inhabilita nada.

### P-P3-2 · LAS CORRECCIONES DEL ARQUITECTO A SU LECTURA (05/11/2026)
- **Retira «sale SOBRE TODO por la vía equivocada»**: con 8 de 11 lo parecía; con las dos tandas (14 de 23) no se sostiene. **Lo
  correcto: «la 2 dispara en torno a la mitad de las veces o más»**, sin magnitud fijada (contra la mitad, bilateral, p = 0,405).
  La séptima vez del día que pega un adjetivo a un número que no lo aguanta.
- **La puntuación NO cambia: P-P3-2 FALLA**, por su texto: decía que la vía es la 1 y que el disparo de la 2 es la lectura
  equivocada, y la 2 dispara en la mayoría de las que salen.
- **El p, con su lateralidad**: 3 de 11 contra la mitad da **0,113 UNILATERAL** (P(X ≤ 3)) y **0,227 BILATERAL**. El arquitecto dio el
  primero sin decirlo.
- **El tercer apoyo de la decisión del 01/11 existe, pero es más flojo de lo que escribió**: el mecanismo de la familia equivocada
  opera en torno a la mitad de los casos, no domina. Sigue apoyando la razón 2; ya no «sobre todo».

### EL 9999, ZANJADO (director, 05/11/2026), Y LO QUE SÍ MOVIÓ EL 30 FALSO
- **El director**: se subió un día que hacían falta más pruebas; se vuelve a poner en su valor y listo. **Nada de lo medido se rehace.**
- **El cambio del tope: PENDIENTE CON DISPARADOR, no «mañana».** Disparador: **el próximo despliegue, el que sea** (el cambio exige
  redesplegar, y no se hace uno sólo para esto). Valor viejo 9999, valor nuevo 100; las fechas, cuando ocurra.
- **Los documentos del proyecto del arquitecto**: comprobados por él; el 30 falso no está en ninguno.
- **EL 30 FALSO SÍ MOVIÓ UNA DECISIÓN, Y SE SOSTIENE POR OTRO MOTIVO** (arquitecto): partir la tanda del paso 2 en dos días (20 de
  NOR-10 y 20 de NOR-11) se justificó con «40 no caben en 30», que era falso. Pero la misma nota da un segundo motivo: «la línea base
  también se midió en días distintos, así que partir por documento CONSERVA la comparabilidad» (`Estado…:603-605`). **La decisión se
  sostiene sobre el segundo motivo y la medición no se rehace. Lo que se cae es el primero.** Es el patrón del 03/11: una decisión
  correcta con un motivo falso y otro verdadero.

### EL MODELO DEL JUEZ: TRAZADO, NO CREÍDO (Code, 05/11/2026)
- **Quién lo escribió primero**: el arquitecto, en la resolución de F-128 del 19/10 (`Estado…:2221-2222`, «`ANALYSIS_JUDGE_MODEL` se
  deja puesto, en Vercel, con el valor `claude-haiku-5-5`»), después de la tanda de F-128 que midió los dos modelos.
- **Y se ha MEDIDO después, en cada análisis**: el modelo que contestó queda guardado por análisis (`lecturaDeLasParejas[].modelo` y el
  registro por llamada, `SQL_34_03:11-19, 100, 107`), y las salidas archivadas lo enseñan pasada a pasada: `claude-haiku-5-5` en las
  del 28/10 (`Medida_F130_E3_Y_Vecindad_29-10-2026.md:777-782`), y en los JSON de la herramienta, llamada a llamada. **Para el RÁPIDO,
  el «haiku-5-5» es un dato, no otro 30.**
- **EL EXHAUSTIVO NO SE PUEDE AFIRMAR**: corre en Railway, y `ANALYSIS_JUDGE_MODEL` de Railway no está escrito en ningún sitio.
- **¿Alguna cifra archivada cruza un rápido con un exhaustivo con jueces distintos? No después del 20/09**: `SQL_34_11` (04/11) da
  **cero exhaustivos desde el 20/09** (`Medida_F130…:2034-2037`), y la purga del 25/10 borró los anteriores. Las comparaciones
  antiguas (F-127, 16/10) son anteriores a Haiku 5.5 y ya cruzaban modelos a propósito (F-128 era esa comparación). **El riesgo es del
  próximo exhaustivo**, no de lo archivado.

### `ANALYSIS_PAREJA_ENTERA`: SÓLO LO LEE EL RÁPIDO (Code, 05/11/2026)
- `lib/analysis/judge.ts:1151-1153` y `:1261`: «el interruptor sólo existe en RÁPIDO. En exhaustivo ni se lee, así que 'pareja_entera'
  y 'corte_honesto' no pueden salir de un exhaustivo». **Su valor en Railway no cambia nada.**
- Lo que lee el exhaustivo, según el propio código: el analizado ENTERO y, de cada candidato, el presupuesto de
  `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` (3.000 si no está puesta). **Si el paso 4 del plan da por supuesto que el exhaustivo lee parejas
  enteras, no lo hace**; Code no ve el paso 4 (vive en el proyecto).

### LA LISTA PARA EL DIRECTOR, UN SOLO VIAJE (Code, 05/11/2026)
- **En Vercel** (lo lee el rápido y la entrada de los análisis): `RATE_LIMIT_EXHAUSTIVE`, `RATE_LIMIT_ASK`, `RATE_LIMIT_STYLE`,
  `RATE_LIMIT_IMPROVE`, `ANALYSIS_JUDGE_MODEL` y `ANALYSIS_PAREJA_ENTERA` (`RATE_LIMIT_ANALYZE` ya se sabe: 9999).
- **En Railway** (lo lee el worker, que corre el exhaustivo): `ANALYSIS_JUDGE_MODEL` y `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS`.
- **De cada una**: el valor tal cual, o «no existe». Un 0 en una `RATE_LIMIT_*` es «sin límite» (abajo).

### DEUDA TÉCNICA, PEQUEÑA Y SIN URGENCIA: EL 0 QUE SIGNIFICA «SIN LÍMITE» (arquitecto, 05/11/2026)
En los cinco `RATE_LIMIT_*`, **un 0 significa SIN LÍMITE** (`lib/rate-limiter.ts:17, 77-80`), y en el panel de Vercel se lee como «ninguno
permitido». **El valor que abre la puerta del todo parece el que la cierra**: el día que alguien escriba 0 para cerrarla, la abrirá. El
centinela de «sin límite» debería ser explícito (`-1`, o la variable ausente), no el 0. No se toca hoy.

### LA PROPUESTA DE LOS FALSOS, RETIRADA, Y LA RAZÓN QUE LA MATA (arquitecto, 05/11/2026)
**«Decidir si una frase enuncia un principio es exactamente la lectura que hace el bloque»: no se puede auditar el bloque
mecánicamente sin el bloque.** La lectura humana no es aquí un recurso de segunda: es estructural. Se adopta la alternativa de Code: el
director marca HALLAZGO A HALLAZGO. Y el plan es uno: **el etiquetado de 20 análisis y la tasa de «sí» falsos se juntan en UNA sesión
de lectura del director**, con dos marcas por hallazgo publicado (¿es real? ¿tiene la forma «permiso contra principio»?). **Sin bandas ni
predicciones todavía** (arquitecto): esta vez, el dato antes de la aritmética.

### ⚠️ EL EXHAUSTIVO Y SUS 3.000 CARACTERES POR CANDIDATO: LAS TRES PREGUNTAS DEL ARQUITECTO, CONTESTADAS (Code, 05/11/2026)
**La preocupación** (arquitecto, sin afirmarla): si el exhaustivo le da al juez 3.000 caracteres de CLI-12, que tiene 55.135, es el
5,4 %, por debajo del régimen de F-123 que publicó «0, 0, 0, 0»; y es el análisis que cuesta 30 créditos.
1. **Son 3.000 POR CANDIDATO EN TOTAL, no por trozo.** `selectUnitsWithinBudget` (`lib/analysis/retrieval.ts:1111` y ss.) va sumando
   lo que mete de cada candidato (`usedChars`) hasta agotar el presupuesto, con un tope de 25 piezas (`:110`); el presupuesto lo da
   `presupuestoPorCandidato` (`:199`): 3.000 en el rápido sin pareja entera, y en el exhaustivo `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` o, si
   no está puesta, los mismos 3.000 (`:179-188`).
2. **Su valor en Railway no está escrito hoy, PERO el archivo dice que se puso y se quitó una vez**: el 28/09, de 13:20 a 13:26, con
   14.676, para el experimento de F-118, y se RETIRÓ a las 13:26 (`Estado_Del_MVP.md:7646-7652`). Si nadie la ha vuelto a poner, el
   exhaustivo corre con 3.000. **Pasa a ser la primera de la lista para el director.**
3. **¿Le sale a cuenta? Hay UNA medición archivada, y apunta en la dirección que teme el arquitecto**: F-118, el 28/09, exhaustivo sobre
   NOR-11 ↔ CLI-13 (`Estado_Del_MVP.md:7658-7668`): **con 3.000, una trampa publicada por dirección; con el candidato ENTERO (14.676),
   dos y tres**, cero falsos, con Sonnet confirmándolas. **Es una pareja y un análisis por condición y dirección**: dice la dirección,
   no la magnitud. **Sobre la amplitud** (25 candidatos frente a 6) **no hay nada archivado** que diga si compensa. Los «nueve
   exhaustivos antes de la purga» del arquitecto no aparecen en el archivo con ese número; la purga del 25/10 borró los análisis.
- ⚠️ **Una precisión sobre la comparación con F-123, y es de la clase de hoy**: los «0, 0, 0, 0» de F-123 (`consultas-fable/F-123…:110`)
  son de CLI-12 como documento ANALIZADO en el RÁPIDO, cortado POR POSICIÓN a sus primeros 6.000 caracteres. **En el exhaustivo el
  analizado va ENTERO**; los 3.000 son del lado del CANDIDATO, elegidos POR PARECIDO (los trozos más relevantes). **Son dos operandos y
  dos criterios de corte distintos**, así que el «por debajo del régimen de los cuatro ceros» no se sostiene tal cual. La medición que
  sí es del mismo lado y del mismo modo es la de F-118, la del punto 3, y apunta igual.
- **Lo que esto deja para el director** (es su decisión, con estos datos): el exhaustivo, que cuesta seis veces el rápido, lee de cada
  candidato lo que lee el rápido sin pareja entera, mientras el rápido lee hoy la pareja entera (`ANALYSIS_PAREJA_ENTERA` en Vercel, que
  el exhaustivo ni mira).

### EL CAMPO «FORMA» DEL VERIFICADOR: EL ORDEN, ACEPTADO (arquitecto, 05/11/2026)
Primero la sesión con el producto tal como está; después el campo, validado contra las marcas: **la forma sería lo que el modelo
declara, no lo que es, así que sólo se puede medir contra marcas humanas.** Y el cambio de prompt del verificador **exige su tanda de
regresión de 42 pasadas** antes de darlo por bueno.

## LA SESIÓN DE LECTURA DEL DIRECTOR: EL ENCARGO, CERRADO (arquitecto y Code, 05/11/2026)

**Qué se mide**: de lo que el producto publica, cuánto se sostiene; y si el bloque del principio inventa la forma «permiso contra
principio» donde no la hay. Dos marcas por hallazgo, en una sola sesión. **Sin bandas ni predicciones todavía: el dato antes de la
aritmética** (arquitecto). Las bandas se escriben DESPUÉS de tener las marcas.

**1 · LOS DOCUMENTOS**: los 20 de `corpus-pruebas/` (los ficheros que no son registros de siembra). **Antes de empezar, el director
confirma cuáles están subidos hoy en la organización** (el repositorio no lo sabe desde la purga). Un análisis RÁPIDO de cada uno, en el
orden de la lista, de uno en uno.

**2 · DURANTE LA SESIÓN, EL DIRECTOR NO TOCA**: los botones de aceptar o descartar (un descarte se guarda, mueve las huellas y contamina
los análisis siguientes); ninguna subida, reindexación ni borrado; ningún despliegue. **Apunta la hora de comienzo y la de fin.**

**3 · QUÉ SE MARCA** (arquitecto):
- **Contradicciones e inconsistencias menores: SÍ.** La frontera entre las dos es justo donde han vivido los errores de clase, así que
  se mira con ojos humanos.
- **Solapamientos y duplicados: NO se marcan, pero SE CUENTAN**, para decidir una sesión futura con el volumen delante.
- **Las hojas de cálculo: DENTRO, pero EN BLOQUE APARTE.** Son salida real que un cliente ve; pero una discrepancia entre filas de tabla
  es otro mecanismo (F-92), y juntarlas con la prosa sería agrupar por síntoma.
- **Las dos marcas**: «¿es real?» (sí / no / no sé) y «¿tiene la forma permiso contra principio?» (sí / no / no aplica).
- **«NO SÉ» ES UNA RESPUESTA DE PRIMERA CLASE**: forzar a decidir fabrica dato; un hallazgo que un revisor competente no puede dirimir
  es justo lo que la decisión del 01/11 dice que no se afirma; y entra en el rango de las dos cotas. **La tasa de «no sé» es una de las
  cifras que se quieren**, no un hueco.

**4 · DÓNDE MARCA, SIN GUIAR AL TESTIGO**: al acabar, Code escribe un SQL de sólo lectura (organización del piloto, probado en PGlite,
cabecera PENDIENTE DE EJECUTAR) con DOS SALIDAS de la misma consulta, unidas por el número de fila:
- **la del director**: número de fila, id del análisis y su hora, documento analizado, documento candidato y **las dos citas**, más las
  dos columnas vacías. **Sin etiqueta, sin tipo, sin severidad**: le pedimos que dirima la afirmación del sistema, y la etiqueta ES la
  afirmación; verla mientras juzga es guiar al testigo (arquitecto).
- **la del archivo**: todo lo anterior más tipo, severidad y `conflictoNormativo`; y, aparte, el recuento de solapamientos y duplicados
  por análisis.
El director lo ejecuta, abre su salida en una hoja de cálculo, rellena las dos columnas y la pega a Code.

**5 · CÓMO SE ARCHIVA**: Code comprueba que cada fila tiene sus dos marcas, que los valores están entre los permitidos y que el número
de filas por análisis cuadra con la consulta; une las marcas con la salida del archivo por el número de fila; y archiva las dos, literales,
en un fichero nuevo de `claude/`. **Y entonces el arquitecto escribe las bandas.**

### LA RETIRADA DEL ARQUITECTO SOBRE F-123, Y SUS RETIRADAS DEL DÍA SEGÚN EL ARCHIVO (05/11/2026)
**La retirada, con sus palabras**: comparó los «0, 0, 0, 0» de F-123 con los 3.000 del exhaustivo, y no son lo mismo: aquéllos eran
CLI-12 como documento ANALIZADO, cortado por POSICIÓN; los 3.000 son del lado del CANDIDATO, elegidos por PARECIDO, y la segunda forma
es mucho menos dañina. «Tomé una relación medida (cuánto texto ve → cuántas publica) y la apliqué cruzando una diferencia estructural
que no había comprobado.» **Y es la segunda alarma del día dada al director y rebajada en la misma hora.** Lo que sobrevive es F-118.

**CUÁNTAS LLEVA HOY, SEGÚN EL ARCHIVO** (el arquitecto pidió el recuento porque las contó de memoria). **El archivo no lleva una cuenta
numerada del día**, así que lo honesto son dos listas:
- **Archivadas con fecha del 05/11, en este fichero**: (1) la regla «solape de 20 caracteres» atribuida a `SQL_34_06`, que no existía
  (adenda 1, línea 3429); (2) la autocontradicción de la regla (ii), sus líneas 1 y 3 (cierre de los huecos, cerca de la 4219); (3)
  «sale SOBRE TODO por la vía equivocada» (5571); (4) la propuesta de certificar la forma en los falsos (5623); (5) el motivo «40 no
  caben en 30» de la decisión de partir en dos días (5589); y (6) ésta, la de F-123. **Seis.**
- **Las que dijo en sus mensajes del 05/11 y NO estaban archivadas como suyas** (se archivan aquí, ahora): (7) archivó en el proyecto
  la fecha «28/10» del 6 de 7 sin abrir el JSON (él la llamó «la 14»); (8) «en la herramienta D es sólo §2.4 ↔ §3.5», ensanchando lo
  que Code decía del registro de siembra; (9) retiró el «186» como no verificable sin preguntar cómo se había buscado; (10) «el quinto
  no es alcanzable», que corrige Fable (él la llamó «decimoctava»; consta en el texto de la adenda de Fable, no como suya).
- ⚠️ **Y LA NUMERACIÓN NO CUADRA**: «la decimocuarta» se usó para dos cosas distintas (el 04/11, su corrección de «el 90 % no es D»,
  línea 3215; el 05/11, la fecha del 6 de 7); la decimoquinta y la decimosexta no le llegaron nunca a Code; y la decimoctava no estaba
  archivada. Con el archivo delante, **diez con fecha del 05/11** (seis archivadas antes y cuatro ahora), sin contar las de su proyecto
  que Code no ve.

### EL PRESUPUESTO DEL EXHAUSTIVO ES POR CADA CANDIDATO (LECTURA A), CON SU LÍNEA (Code, 05/11/2026)
- `lib/analysis/retrieval.ts`: el presupuesto se resuelve UNA vez por análisis (`:419-422`), y luego hay un bucle POR CANDIDATO
  (`for (const [documentId, frags] of byDoc)`, `:444`) que llama a `selectUnitsWithinBudget` para cada uno (`:494`); dentro, el
  acumulador **vuelve a cero en cada llamada** (`let usedChars = 0`, `:1125`). **Son 3.000 por CADA candidato**: con 25, hasta 75.000
  caracteres de candidatos. (La función se llama `selectUnitsWithinBudget`, no `fitWithinBudget`.)

### ¿GUARDÓ F-118 EL COSTE, LA DURACIÓN Y LOS TOKENS? NO EN EL ARCHIVO; UNA PARTE PUEDE SEGUIR EN LA BASE (Code, 05/11/2026)
- **El archivo de F-118** (`Estado_Del_MVP.md:7640-7700`) guarda lo publicado, los ids de los dos trabajos de la ventana de 14.676
  (`4b0471ba…` y `6d987d97…`) y cuántos trozos entraron, **pero ni coste, ni duración, ni tokens**. El registro por llamada que hoy lo
  guarda todo (3.1.1) es posterior, del 21/10.
- **Lo que puede seguir en la base**: `llm_usage` SOBREVIVIÓ a la purga, con 543 filas desde el 02/07 y el id del piloto (`SQL_SEG_02`,
  consulta 6, 26/10; `Estado…:59-62`), con **tokens, caché y coste por llamada**, pero **sin latencias** (la tabla no tiene esa
  columna). Así que **el precio en tokens y dólares de las dos condiciones de F-118 se podría sacar** con un SQL de sólo lectura sobre esa
  ventana del 28/09; **la duración no**: `analysis_jobs` se borró con la purga. **No está comprobado que esas filas cubran el 28/09**:
  lo diría el propio SQL.

### LA PREGUNTA DE PRODUCTO QUE SALE DE AQUÍ (arquitecto, 05/11/2026; NO se toca hoy)
El exhaustivo cambia PROFUNDIDAD por AMPLITUD: 25 parejas en vez de 6, cada una leída con 3.000 caracteres del candidato. **Si para las
contradicciones pesa más la profundidad, la mejora no es subir el presupuesto: es comparar MENOS parejas y leer MÁS de cada una.** Eso
es un rediseño, no un ajuste. **Puede ser la pregunta más importante del producto de todo lo mirado hoy: el análisis que cuesta seis
veces más puede estar optimizando el eje equivocado.** Y no se propone ningún valor nuevo para el presupuesto sin saber lo que cuesta.

### EL REGISTRO DE LAS RETIRADAS DEL ARQUITECTO: UNO SOLO, EL DEL REPOSITORIO (arquitecto, 05/11/2026)
- **El registro único es éste, el del repositorio, y lo mantiene Code. El arquitecto deja de numerar**: ha corregido su copia del
  proyecto para que describa las retiradas sin numerarlas, con una nota que explica por qué.
- **La causa** (arquitecto): dos registros con una sola numeración divergen por construcción. El 14 se usó dos veces; la 15 y la 16
  no llegaron porque se escribieron en un archivo que Code no puede abrir; la 18 no se archivó en ningún sitio. Es la regla del 01/11
  aplicada al registro de sus propios errores.
- **LA REGLA NUEVA: una retirada MENCIONADA en un mensaje no es una retirada ARCHIVADA.** Toda retirada va en el bloque del mensaje,
  marcada como línea para archivar y con su fecha; si no va así, no cuenta. Una retirada que se evapora es peor que el error: deja la
  afirmación en pie y la corrección fuera.
- **EL 05/11, DIEZ**, con su lectura al lado (arquitecto): **las diez se cazaron, ninguna llegó a producción ni a un cliente, y cuatro
  las cazó él.** Lo que falló no fue la aritmética ninguna de las diez veces: **fue la procedencia, nueve de diez.**

### SQL_34_12 · EL PRECIO DEL CANDIDATO ENTERO, PREPARADO (Code, 05/11/2026; PENDIENTE DE EJECUTAR)
- **Qué saca**: de `llm_usage`, las filas del 28/09 de la organización del piloto (el id viejo, a propósito, como `SQL_SEG_02`), agrupadas
  por análisis, con su ventana —antes de las 13:20 (3.000), de 13:20 a 13:26 (14.676), después—, sus tokens y su coste; y el total y el
  medio por ventana de los exhaustivos. **Dice por sí misma si las filas llegan al 28/09**, y si el id no lee nada lo dice a gritos.
- **La duración, NO**, y la consulta lo declara en una fila: `llm_usage` no lleva id de análisis ni de trabajo ni latencia, y el worker
  escribe las filas de un exhaustivo AL TERMINAR, una por modelo y en un solo INSERT (`worker/src/index.ts:144`,
  `lib/observability/record-usage.ts:42-64`). Sólo hay la hora del final; `analysis_jobs` se borró con la purga. **Por eso «una hora =
  un análisis»** es como agrupa, y la salida enseña cuántas filas lleva cada grupo.
- **Probado en PGlite** (`claude/arneses/f34/sql-34-12-el-precio-del-candidato-entero.test.ts`, 6 pruebas con filas sintéticas: dentro, antes
  y después de la ventana, otro día, otra organización y otra operación como ruido; los bordes 13:19:59, 13:20:00, 13:26:59 y 13:27:00;
  sin filas ese día; con el id vacío). **11 mutantes, los 11 en rojo** (`mutantes-sql-34-12.ts`). Huella `9e61cc95700b6201`. Suite completa
  y tsc a cero.

## EL EXHAUSTIVO SALE DEL ALCANCE: EL PRINCIPIO (director, 05/11/2026)

**El director, con sus palabras**: «es una parte que no hemos tocado; cuando toque, al final es por lo mismo que tenemos en el rápido
pero con las diferencias que hay, que son ver más documentos, más pasadas. De momento sólo me interesa el rápido.»

```
PRINCIPIO (decisión del director, 05/11/2026): EL EXHAUSTIVO ES EL RÁPIDO
APLICADO A MÁS PAREJAS. Un solo régimen de juez, dos coberturas. Lo que se
decida sobre cuánto texto ve el juez se decide UNA VEZ, en el rápido, y el
exhaustivo lo hereda; lo que lo distingue es a cuántas parejas se aplica, no
cómo lee cada una.
SE SUSTITUYE así la pregunta abierta de «profundidad frente a amplitud»: no
hay dos ejes que equilibrar, hay un régimen y una cobertura.
```

**Lo que no se evapora** (arquitecto): el presupuesto del candidato va a la puerta «Railway antes del próximo exhaustivo», con el
`tsc` del worker y `ANALYSIS_JUDGE_MODEL` (`Estado_Y_Pendientes_14-10-2026.md`, en ese pendiente). **`SQL_34_12` no se ejecuta hoy**: el
dato es del 28/09 y no cambia; espera en esa puerta, probado.

### EL ALCANCE, REESCRITO: SÓLO EL RÁPIDO (arquitecto, 05/11/2026; con lo que Code añade al lado)
- **VIVO**: la sesión de lectura (20 rápidos; espera a que el director confirme qué documentos están subidos).
- **ESPERANDO AL DIRECTOR**: las seis variables de Vercel (Railway sale de la lista: va a la puerta del exhaustivo).
- **ESPERANDO UN DESPLIEGUE**: el tope a 100.
- **PARADO Y ARCHIVADO**: P-F130-23; el campo `forma` del verificador (después de la sesión); el exhaustivo entero (en su puerta).
- **BLOQUEADO POR TERCEROS**: el paso 4, por los siete defectos de la especificación de Fable; la curva E5, por el criterio de «cuándo dos
  hallazgos son el mismo».
- *Code, al lado, lo que la lista no nombraba*: **(a)** el pendiente de `corpus-del-examen` y **(b)** el `tsc` del worker **tienen fecha
  propia, el 10/11**, y el (b) además salta con **el próximo commit que toque el grafo del worker**, que incluye `lib/analysis/` (el campo
  `forma` lo dispararía); **(c)** el recuento estricto de las 40 de la condición 1 se hizo en seco y salió «SE REPITE», sin números: queda
  CERRADO como corroboración; **(d)** la comparación de D con el quinto está en cuarentena (adenda 2); **(e)** la línea de la prelación no
  entra en el prompt del juez antes de medir; **(f)** los dos pendientes del medidor del 02-03/11 (la latencia de `usage_logs` y lo que
  el juez emite por pareja antes de la puerta, que no se guarda), parados; **(g)** los 17 guiones SQL con cabecera «PENDIENTE» sin
  constancia de ejecución, esperando a que el director diga cuáles ejecutó.

### EL ORDEN DEL RÁPIDO, FIJADO (arquitecto, 05/11/2026)
**El `tsc` del worker NO estaba parado**: su disparador incluye cualquier commit que toque el grafo de tipos del worker, y ahí entra
`lib/analysis/`; el campo `forma` lo dispara, y `forma` está en el alcance. **El `tsc` se arregla ANTES del campo `forma`**: con el `tsc` en
rojo no se distingue lo que se rompa de lo que ya estaba roto (la regla del director para errores encadenados: de uno en uno, con
verde entre medias).
```
1. La sesión de lectura (20 análisis). No toca código.
2. El `tsc` del worker, en verde.
3. El campo `forma` del verificador, con su tanda de regresión de 42 pasadas.
```
**La única fecha del calendario es el 10/11**, y llegan a ella el `tsc` y `corpus-del-examen`: los dos de Code, con un push del director.

### DEUDA, NO PENDIENTE: LO QUE EL JUEZ EMITE POR PAREJA ANTES DE LA PUERTA NO SE GUARDA (arquitecto, 05/11/2026)
Las columnas guardan los SUPERVIVIENTES, no lo crudo (`Estado…`, pendiente del medidor del 03/11). **Es la que impide medir cualquier
etapa por separado.** Consta como DEUDA y no como pendiente: no tiene disparador, tiene consecuencia.
**Y de su misma familia** (un dato que existe y nadie mira, como el 9999 y las cabeceras): **la latencia que `usage_logs.latency_ms`
guarda y que ninguna consulta lee** (`Estado…`, pendiente del medidor del 02/11).

### LOS 17 GUIONES CON CABECERA «PENDIENTE» Y SIN CONSTANCIA: CERRADO (arquitecto, 05/11/2026)
El director no recuerda si los ejecutó, y eso es la respuesta. **Se quedan como están, de estado desconocido, y el pendiente se cierra.**
Ninguna cifra archivada depende de ellos (comprobado por Code el mismo día). Si alguien ejecuta uno, se marca entonces.

### LA LÍNEA DE LA PRELACIÓN, LITERAL (el arquitecto la pidió; Code, 05/11/2026)
- `Estado…:783`, punto D: «la línea de la prelación NO entra en el prompt del juez antes de volver a medir: confundiría la medición».
- **De dónde viene**: es una pieza de la ESPECIFICACIÓN DE FABLE de la pasada 2 (`Estado…:586-591`): «la línea sobre la prelación en el prompt
  del juez CAMBIA LA PASADA 1. NO ENTRA HASTA DESPUÉS DE LA MEDICIÓN de las 20 pasadas con el verificador nuevo»; y «va en commit aparte
  DESPUÉS de volver a medir con el verificador nuevo», junto a `jerarquia` y `puente`, campos nuevos de la misma especificación.
- **La medición que pedía ya se hizo** (la tanda del verificador nuevo, 02/11). **Lo que la tiene parada hoy es otra cosa: es de la
  especificación de Fable, que no se construye** (punto C) mientras no vuelvan sus siete defectos. Las cláusulas de prelación del corpus,
  buscadas el 02/11, están en `Estado…:402-411` (ninguna etapa del pipeline las busca).

### EL `tsc` DEL WORKER, EN VERDE (Code, 05/11/2026; el paso 2 del orden, adelantado porque no toca nada en tiempo de ejecución)
- **El error**: `lib/analysis/normalize.ts(42,63): TS7016`, sin declaración para `./normalize-core.mjs`; el worker no tiene `allowJs` y la raíz
  sí. **El arreglo**: `lib/analysis/normalize-core.d.mts`, los tipos de las tres funciones copiados de su propio JSDoc. **Sin efecto en
  tiempo de ejecución**: sólo lo lee `tsc`.
- **Comprobado**: `npm run typecheck` (raíz y worker) a cero; y el fichero SE LEE: con la firma de `normalize` cambiada a `number`, el `tsc`
  de la raíz da 23 errores (control positivo), y restaurado, cero.
- ⚠️ **Lo que dice el repositorio sobre Railway, sin afirmar lo que no ve**: `worker/package.json` arranca con `tsx` (`"start": "tsx …"`), que
  NO comprueba tipos, y no hay script `build` ni configuración de Railway en el repositorio. **Si el panel de Railway no tiene un comando
  de construcción propio, el despliegue nunca pasó por `tsc`** y el rojo no le impedía desplegar. Lo confirma el director mirando el
  panel (la puerta del exhaustivo).

## LA SESIÓN DE LECTURA DEL DIRECTOR: EL ENCARGO, REHECHO CON LOS OCHO DOCUMENTOS INDEXADOS (arquitecto y Code, 05/11/2026)

**Sustituye a la lista de «los 20 de corpus-pruebas»** del encargo de esta tarde; lo demás de aquél sigue en pie (qué se marca, «no sé»
de primera clase, las dos salidas del SQL sin guiar al testigo, cómo se archiva, y las bandas DESPUÉS del dato).

⚠️⚠️ **LO QUE ESTA SESIÓN NO PUEDE DECIR, escrito ANTES de medir (arquitecto): NOR-10 Y NOR-11 NO ESTÁN INDEXADOS.** Así que la sesión
**no dice nada sobre D, ni sobre A, B y C, ni sobre el quinto.** No es un defecto: mide «de lo que publicamos, cuánto se sostiene» con
el corpus que hay hoy. **Sus cifras no se citan nunca como si hablaran de D.**

**1 · LOS OCHO** (el director, 05/11: lo que está indexado hoy; los otros 37 están en la bandeja de revisión sin indexar). Un análisis
RÁPIDO de cada uno, de uno en uno, en este orden: **OPE-15, RRHH-08, OPE-13, OPE-11, OPE-10, CLI-20, CLI-13, CLI-12.**

**2 · EL BLOQUE APARTE: CINCO HOJAS DE CÁLCULO, NO TRES.** OPE-13 y RRHH-08 también son `.xlsx`. Con el troceado de la indexación sobre
los ficheros de `corpus-pruebas/` (que pueden no ser byte a byte los subidos: `SQL_SEG_02`, cabecera):
```
OPE-15 · xlsx · 34 trozos · text 3, table_summary 1, table_row 30
RRHH-08 · xlsx · 15 trozos · table_summary 1, table_row 14
OPE-13 · xlsx · 15 trozos · table_summary 1, table_row 14
OPE-11 · xlsx · 64 trozos · text 3, table_summary 1, table_row 60
OPE-10 · xlsx · 64 trozos · text 3, table_summary 1, table_row 60
CLI-20 · txt · 8 trozos · text 8
CLI-13 · docx · 11 trozos · text 11
CLI-12 · docx · 55 trozos · text 55
```
- **Prosa: CLI-12, CLI-13 y CLI-20** (sin un solo trozo de tabla). **Tabla: OPE-10, OPE-11, OPE-13, OPE-15 y RRHH-08.**
- ⚠️ **Pero OPE-10, OPE-11 y OPE-15 llevan también 3 trozos de PROSA cada uno** (las notas de la hoja). Así que el bloque aparte se hace
  **POR HALLAZGO, no por documento**: un hallazgo entre filas de tabla va al bloque de tablas; uno de prosa, al de prosa, venga del
  documento que venga. El SQL lo separará por si el hallazgo lleva filas comparadas o no.

**3 · LA LISTA DE VERCEL, CANCELADA** (arquitecto): no se le pide ningún valor al director. Cuatro no tocan la sesión; `RATE_LIMIT_ANALYZE`
vale 9999 y con 8 análisis da igual; y el régimen de pareja entera y el modelo del juez **vienen en la salida de cada análisis**, así que se
leen del dato, no del panel. Lo que quede, a la puerta del exhaustivo.

**4 · EL ORDEN** (arquitecto), y no hay nada más:
```
1. El director sube los seis commits.
2. Code rehace el encargo con los ocho documentos (esto) y se lo pasa al arquitecto.
3. El director hace los ocho análisis, de uno en uno, sin tocar nada más.
4. Code escribe el SQL de las dos salidas. El arquitecto lo revisa. El director lo ejecuta.
5. El director rellena las dos columnas y se las pega.
```
Nada de esto abre una rama nueva: lo que se le ocurra a Code por el camino, se apunta y no se persigue.

### `corpus-del-examen`: EL CENSO, MEDIDO (Code, 05/11/2026; el primer paso del pendiente del 03/11, sin cura todavía)
Con una herramienta que recorre EXACTAMENTE como cada prueba (`censo_corpus_examen.mjs`, scratchpad):
| | directorios | entradas | llamadas a `stat` | ficheros leídos | MB | 1.ª pasada | 2.ª pasada |
|---|---|---|---|---|---|---|---|
| `corpus-del-examen` (`app`, `lib`, `components`, `worker`; `.ts`/`.tsx`) | 130 | 613 | **613** | **453** | **3,55** | 0,22 s | 0,13 s |
| PGlite (todo el árbol; todas las extensiones de código) | 168 | 1.180 | **0** | **606** | **4,48** | 0,40 s | 0,13 s |
- **El de `corpus-del-examen` lee MENOS que el de PGlite**: tres cuartos de los ficheros y de los MB. **El volumen no explica los 19,5 s
  frente a 5,6.** La única diferencia de forma es que hace un `stat` por cada entrada (613) y el de PGlite ninguno (usa `withFileTypes`).
- ⚠️ **Lo que esta medición NO reproduce**: el frío. Se corrió con el disco caliente (la suite completa había pasado poco antes), así que
  sus 0,22 s no son comparables con los 19,5 s del 03/11. La cura la decide el arquitecto con estos números.

### A LA PUERTA DEL EXHAUSTIVO, OTRA MÁS (arquitecto, 05/11/2026)
El worker arranca con `tsx` (`worker/package.json`), que no comprueba tipos, y no hay script de build ni configuración de Railway en el
repositorio: **si el panel no tiene su propio comando de construcción, los 41 días de `tsc` en rojo nunca impidieron un despliegue.** Se
confirma en el panel, con las otras tres.

### LA SESIÓN, ANTES DE MEDIR: LO QUE EL ARQUITECTO ESPERABA, CORREGIDO (arquitecto, 05/11/2026)
- **El bloque de PROSA va a ser PEQUEÑO**: tres documentos, 74 trozos (CLI-12, 55; CLI-13, 11; CLI-20, 8). Lo que salga de ahí tendrá
  intervalos anchos y no se podrá afirmar gran cosa.
- **El bloque de TABLAS puede ser el principal**: 183 trozos de tabla frente a 83 de prosa en lo indexado. Si dos tercios de lo que el
  corpus contiene son tablas, dos tercios de lo que el producto publica son hallazgos de tabla, **y nadie ha comprobado nunca si son
  reales**: un punto ciego más grande que D, y en la salida que un cliente ve de verdad.
- **Se corren los OCHO**: estrecharlo a la prosa haría que la respuesta no represente el producto; los dos bloques van separados por
  hallazgo. **Y no se indexa nada para agrandar la prosa**: subir NOR-10 y NOR-11 cambia el corpus y es otra decisión de otro día.

### `corpus-del-examen`: LA CURA, HECHA (arquitecto decide, Code ejecuta; 05/11/2026)
- **La cura: `withFileTypes`**, como el censo de PGlite. **Quita un mecanismo en vez de mover un número**, y es portar una pieza que ya
  funciona (arquitecto). El `stat` sólo servía para distinguir fichero de carpeta: ni tamaño ni fecha.
- **La validación, NO por el tiempo** (el frío no se reproduce), sino por las dos cosas que pidió el arquitecto, con una herramienta que
  copia el recorrido viejo del commit anterior (`validar_censo.mjs`, scratchpad): **`stat`, 613 antes y 0 después; ficheros, 453 antes y
  453 después, la MISMA lista en el MISMO orden.** (Habría diferencia con un enlace simbólico a una carpeta, que `stat` sigue y la
  entrada no; no hay ninguno: la lista es idéntica.)
- La suite completa y el typecheck de raíz y worker, en verde. El tiempo en frío se verá cuando se vea.

### LA RESPUESTA DE FABLE DEL 06/11, CONTRA EL REPOSITORIO; Y DOS RETIRADAS DEL ARQUITECTO (Code y arquitecto, 06/11/2026)
La respuesta, literal, en F-130 («RESPUESTA DE FABLE DEL 06/11/2026»). Aquí, lo que el arquitecto archiva y lo que Code comprobó.

**RETIRADA DEL ARQUITECTO, 06/11/2026, para el registro (literal):** «**La pasada 2 no tiene beneficiario medido**» era demasiado
fuerte. Lo apoyaba en dos cosas: que D no se puede medir y que el quinto no mejoró. **El quinto nunca fue candidato a beneficiario**
—es un caso de dos lecturas, Fable predijo que se partiría y 12 de 21 partido es lo que predijo—, así que esa mitad del argumento no
valía. **Lo que queda en pie es sólo «D está sin medir»**, que es más flojo y es exactamente por lo que Fable pide X. Lo cazó Fable en
su respuesta.

**RETIRADA DEL ARQUITECTO, 06/11/2026, la condicional de su comprobación (c), que se cumple:** los **9 de 21 del quinto son
PUBLICADOS por el producto** (`:939`, «frente a los 9 de 21 PUBLICADOS de la pasada abierta») y los **12 de 21 son de la
herramienta**, sólo el juez. **El contraste de la semana 0 y de la adenda del 06/11 («contra su propia pasada abierta… no se
distingue») llevaba el mismo cruce, y se reportó como limpio.** Lo había escrito ya la ENMIENDA 2 del 03/11 (`:937-947`: tres
diferencias, no una; la tercera, sin puerta y sin verificador, sesga A FAVOR de la pregunta cerrada). ⚠️ **Y es también fallo de
Code**: revisó la adenda del 06/11 en cuatro pasadas y no lo marcó. **La conclusión aguanta, y más fuerte**: con el sesgo a su favor,
la pregunta cerrada tampoco se separó.

**(a) LAS COTAS DE X, CON BINOMIAL EXACTA** (`binomial_x.mjs`, scratchpad, huella `c2fa9d0c0ad67258`; las tres zonas suman 1 en cada
p, y una simulación de 200.000 tandas con semilla fija da lo mismo a la segunda cifra. Una primera versión con un generador
congruencial daba 3,1 % en la simulación: era el generador, y se cambió antes de leer nada). n = 42:
- p = 0,40 (el nulo): construir (≥ 24) **1,8347 %**; enterrar (≤ 17) **59,1005 %**; inconcluso (18-23) **39,0648 %**.
- p = 0,70: construir **97,3642 %**; enterrar **0,0069 %**; inconcluso 2,6290 %.
- Las cifras del arquitecto, las cinco, se sostienen. Las de Fable son aproximaciones correctas (1,7 %, 97 %, «menos del 0,1 %»).
- 2 de 3 firmado: 35,2 % con p = 0,40 y 78,4 % con p = 0,70, como escribe Fable.
- ⚠️ **La segunda tanda, leyendo «mismas cotas escaladas» como el doble (≥ 48 y ≤ 34 de 84)**: con el nulo, inconcluso **41,67 %**
  otra vez. Con esa lectura, 84 no decide: el corte de enterrar está en el valor del nulo, así que la zona gris no se estrecha.
  Si se quiere que 84 decida, hace falta un corte único a 84, escrito antes.

**(b) LOS TRES NÚMEROS DEL CRUCE:**
1. **Sí**: los dos documentos enteros, 21 de 21 en la línea base (`Estado…:1907`, `SQL_34_08`).
2. **NO, tal como está**: el «+1,8 %» y el «+5,4 %» son **COSTE** del verificador sin marca (NOR-11 y NOR-10; `:860-861`), no
   detección. Lo que se sabe de detección: su contador de rescates, **0 en 42 pasadas**, y `sin_veredicto` 0. **Y la pieza que
   sí puede quitar es la puerta de citas**: la línea base es «3 de 21 (o 4 con la cota sin texto)» (`:310`).
3. **Sí**: «la síntesis no pierde nada» (F-123, `F-123_2026-10-10_orden-de-ejecucion.md:101`).
- ⚠️ **Y un cruce que ni la lista de Fable ni el «son dos diferencias» del arquitecto nombran, el más grande: la PAREJA.** X es la
  pareja del §3.5; en la línea base **la D sembrada (§3.5) salió 0 de 21** y los 3 de 21 son D por el §3.1 (`:2348`). Esa
  referencia ya se descartó el 04/11 por este mismo motivo (`:2346-2350`).

**(d) EL PROMPT DE X:**
- **El producto** mete `EXCEPCION_DE_LAS_REGLAS` entero en el juez (`lib/analysis/judge.ts:18, 911`), con la pregunta abierta.
- **La herramienta**, incluida la ruta de D (`app/api/admin/medida-f130/d/route.ts:4, 24`), usa el recorte `CRITERIO_DEL_CUMPLIMIENTO`
  (`criterio-del-cumplimiento.ts:65`), derivado de ese bloque. Sólo quita el arranque, la frase del campo, el ORDEN OBLIGATORIO y el
  cierre del JSON, así que **el bloque del principio va dentro**. El bloque del juez no cambia desde `5c2d50c9` (27/10), y el recorte
  no cambia desde `a58deaf8` (29/10, 00:33).
- **Las 7 del §3.5** (29/10, 12:05 UTC) corrieron **con el recorte**, pero **con otra plantilla de pregunta**. La plantilla de
  `63d729b0` decía «LAS DOS RESPUESTAS NO PUEDEN CITAR EL MISMO PAR DE FRASES». Después cambió en `3dcf0b95`, `60a24057` y `b3b4e9da`
  («ESTA PREGUNTA SE CONTESTA SOLA… SOBRE FRASES»), y la de hoy lleva además el documento delante de cada texto.
- **Conclusión: las 7 del 29/10 no están en las condiciones de X.** «El mismo prompt que el producto» no es posible con ninguna lectura:
  X es la pregunta cerrada.

**LO DE FABLE QUE CHOCA CON EL REPOSITORIO** (lectura de Code; sin decidir):
- **X «ya está prerregistrada»: no tal cual.** La del 04/11 era otra:
  - la regla (ii), con indecidibles y cotas;
  - la referencia del quinto, 12 de 21, en condiciones idénticas, y no la base del producto;
  - n = 42 en dos pulsaciones.

  X cambia la regla, la referencia y las bandas: es un prerregistro nuevo.
- **«Pasan la puerta de citas del producto como está»**: la herramienta no pasa por la puerta. El guion aprobado (`527b3ad22bb79110`)
  cuenta con la regla de `SQL_34_06`, que no es la puerta: no tiene normalización de la puerta, ni glosa, ni tramo. Contar así exige
  código nuevo, y aprobarlo.
- **Sólo la pregunta 2 cuenta.** La regla (ii) daba «sale» si cualquiera de las dos era D, y en el producto la D de la pasada 19 la
  confirmó el verificador por su pregunta del dato (`:630`).
- **Defectos 1 y 2: el 04/11 Fable ya había dejado el acuerdo como único criterio de firma**, y el escape como marca con contador
  (`F-130:730`). Nuestra adenda del 06/11 le mandó como defectos dos cosas que su adenda anterior ya había cambiado, y Code no lo vio
  al revisarla.
- **«Las tres propuestas de Code se adoptan como marcas»**: la 1 es `escape.en_apartado` y la 2 es `puente.es_definicion`. La 3 era
  «`nivel_1` definido por otra cosa», no `sin_puente`. `sin_puente` es nueva.
- **«Veinte análisis etiquetados por el director»** es una medición, sin banda ni potencia, y la misma respuesta dice «ninguna medición
  nueva aparte de X».
- **Sin choque**: los «diez commits» existen (`F-130:275`); `llm-client` existe; NOR-11 ↔ CLI-13 es el control de superficies, y
  NOR-11 declara que prevalece (`Casos_Harness.md:249-263`).
- **Defecto 8**: Fable dice que el director le dijo «creo que ya está montada». Eso es de conversación: lo puede confirmar el
  director, no Code. Su texto del 04/11 se queda literal en F-130, y lo que lo corrige ya está en `:3301-3305`.

### X · EL PRERREGISTRO NUEVO DE LA TANDA DE D (arquitecto, 06/11/2026; SUSTITUYE al del 04/11, «6 · LA TANDA QUE SÍ CONTESTA»)
Las decisiones 1 a 5 del arquitecto, **literales** (sacadas del registro de la conversación con un script; huella sha256
`648b73571a4dc2a0`). Sale de la respuesta de Fable del 06/11 (F-130) y de lo que Code encontró al leerla (bloque anterior).

> ═══ DECISIÓN 1 · X ES UN PRERREGISTRO NUEVO, NO EL DEL 04/11 ═══
> Tienes razón: cambia la regla, la referencia y las bandas. Se archiva como **prerregistro nuevo de X**, y el del 04/11 queda marcado como **sustituido, no borrado**, con el motivo.
>
> ═══ DECISIÓN 2 · DOS BANDAS, UN SOLO CORTE EN 24, SIN ZONA GRIS ═══
> Tu hallazgo es correcto y la causa es ésta: **la cota de enterrar de Fable (≤17 de 42 = 40,5 %) está EN el valor del nulo (40 %)**, así que con el nulo cierto el resultado cae sobre la frontera y queda inconcluso. Y doblar a 84 no lo arregla porque el corte sigue en el mismo sitio.
>
> **Y lo interesante: el 24 de Fable es el corte óptimo.** Es el primer `k` donde `p = 0,70` es más probable que `p = 0,40`, o sea el corte de razón de verosimilitudes. Lo que sobra no es su corte: es su tercera banda.
>
> ```
> X · DOS BANDAS, UN CORTE, n = 42
>   CONSTRUIR: 24 o más de 42.   Error de tipo I (construir siendo el nulo 0,40): 1,83 %
>   ENTERRAR:  23 o menos de 42. Error de tipo II (enterrar siendo la tasa 0,70): 2,64 %
>   NO HAY ZONA INCONCLUSA Y NO HAY SEGUNDA TANDA.
> ```
> Los dos errores por debajo del 3 %, y la decisión sale de una sola tanda. **La alternativa de una zona gris de verdad (enterrar ≤22, construir ≥27) deja inconcluso el 15,2 % de las veces si la tasa real es 0,70 y exige la segunda tanda: peor.** Comprueba los dos errores con tu guion y su huella.
>
> ═══ DECISIÓN 3 · X NO ES UNA COMPARACIÓN: ES UNA PRUEBA DE UMBRAL ═══
> Y esto disuelve tu hallazgo (b) entero, que es el más grave que traes. Tienes razón en que **X corre sobre el §3.5 y los 3 de 21 son del §3.1: son parejas distintas, y es el cruce que retiramos el 04/11 por cuarta vez.**
>
> **Pero las bandas de Fable no necesitan ese comparador.** Son una prueba de una sola muestra contra un **umbral de utilidad** (40 % no justifica construir; 70 % sí), no contra una medición previa. Su frase «compara la pregunta cerrada en condiciones de producto contra la pasada abierta, 3 de 21» **es un marco que sus propias bandas no usan.**
>
> **Así que: fuera el comparador.** X mide una tasa contra un umbral declarado de antemano. **Ni los 3 de 21 ni los 0 de 21 son su referencia: son contexto.** Con eso no hay cruce que acotar, porque no hay segunda medición con la que cruzar.
>
> **Y queda una salvedad tuya que SÍ va escrita, con tu cifra:** la tasa de la herramienta es una **cota superior** de la del producto, porque la puerta de citas sí puede quitar hallazgos — unos **4,8 puntos** (un pase de 21). Y tu corrección del 1,8 % y el 5,4 %, aceptada: el verificador **no añade hallazgos**, su contador de rescates está a 0 en 42 pasadas. **Yo había puesto ese número al revés.**
>
> ═══ DECISIÓN 4 · LA REGLA DE CUENTA: LA DEL GUION APROBADO, NO LA PUERTA ═══
> Fable pide que las citas «pasen la puerta de citas del producto». **Eso es código nuevo, y no se escribe para esto.** X cuenta con el guion aprobado y su regla de `SQL_34_06`, que ya existe, está probada, tiene mutantes y tiene huella. **La diferencia se declara en el prerregistro**, y es la regla de la casa: no se construye un instrumento nuevo cuando hay uno aprobado que mide lo mismo.
>
> ═══ DECISIÓN 5 · X CUENTA LAS DOS PREGUNTAS, NO SÓLO LA 2 ═══
> Fable escribe «positivo sólo si la pregunta 2 dice "no se pueden cumplir"». **Lo rechazo, y por el mismo motivo por el que rechacé la opción (i) el 05/11: el bloque del principio está redactado en el lenguaje del conflicto normativo, que es el de la pregunta 2, así que el tratamiento puede mover bajo qué pregunta archiva el juez su hallazgo.** Una medición no puede pasar por un canal que el tratamiento es capaz de mover.
>
> **X cuenta con la regla (ii), las dos preguntas**, como está congelada en el guion. Y el umbral del 40 % se aplica entonces a «D emitida por cualquiera de las dos vías», que es lo que al producto le importa.

**LA COMPROBACIÓN DE CODE DE LA DECISIÓN 2** (`binomial_x_corte.mjs`, scratchpad, huella `0e20193671aa98f2`, misma binomial exacta que
`binomial_x.mjs`; `binomial_x_corte.txt`):
- Error de tipo I, P(X ≥ 24 | 0,40) = **1,8347 %**. Error de tipo II, P(X ≤ 23 | 0,70) = **2,6358 %**.
- **24 es el primer k en que 0,70 es más verosímil que 0,40**: la razón vale 0,7418 en 23 y 2,5964 en 24.
- La zona gris (enterrar con 22 o menos, construir con 27 o más) queda inconclusa el **15,1854 %** de las veces con 0,70 y el 3,6237 % con
  0,40; su error de tipo I es 0,1267 % y el de tipo II, 1,2147 %.
- **Las cuatro cifras del arquitecto se sostienen.**

**LO QUE EL GUION APROBADO NO DECIDE, Y QUEDA ABIERTO HASTA QUE EL ARQUITECTO LO ESCRIBA** (Code, 06/11):
- **El guion SÍ CUENTA la salida de la ruta `d` tal como está.** La ruta `d` devuelve lo mismo que la del quinto (`{ pareja, vez,
  respuesta }` o `{ pareja, vez, error }`, `preguntar-al-juez.ts:25-27`), con el mismo `construirPrompt` y el mismo recorte, 21
  respuestas por pulsación (`VECES_DE_D`). La pareja `p35` está en el guion. El control positivo de hoy sobre el §3.5 da 5 de 5.
- **Pero su decisión es la de P-F130-23**: dos brazos, cotas cruzadas y repetición con más de 4 indecidibles. **No es el corte
  único de X**, y X necesita tres cosas escritas antes de pulsar:
  1. **Qué se compara con 24 cuando hay indecidibles.** Contarlos como fallo (cota baja) es lo de Fable y mantiene el tipo I por
     debajo de 1,83 %. Exigir que las dos cotas caigan del mismo lado vuelve a abrir una zona gris.
  2. **Si X hereda la repetición con más de 4 indecidibles.** Hoy, con más de 4, el guion esconde los números y dice «SE REPITE».
  3. **Con qué recuento se decide**: por ancla, por la regla del producto, o los dos de acuerdo.

### AL REGISTRO (arquitecto, 06/11/2026): LO QUE VA A FABLE CON EL RESULTADO DE X, NO EN OTRA RONDA (literal)
> ═══ TRES COSAS DE FABLE QUE NO LE CONTESTAMOS AHORA ═══
> Van con el resultado de X, no en otra ronda:
> - **Le mandamos dos defectos ya resueltos (1 y 2):** el 04/11 ya había dejado el acuerdo como único criterio y el escape como marca (F-130:730). **Error nuestro**, mío al escribirlos y tuyo al no verlo en cuatro pasadas. Al registro.
> - **`sin_puente` no es tu propuesta.** Tu tercera era definir `nivel_1` por otra cosa. Se corrige la atribución.
> - **«Veinte análisis etiquetados por el director» es una medición nueva sin banda ni potencia**, y su propia respuesta dice que no propone ninguna aparte de X. Es una contradicción suya y se le señala cuando toque, no ahora.

### DEFECTO 8, CERRADO: DE DÓNDE SALIÓ LA PASADA 2 EN PRESENTE (director y arquitecto, 06/11/2026)
- **Fable** (respuesta del 06/11, F-130) dijo que el director le había dicho «creo que ya está montada». **El director lo confirma,
  con sus palabras**: «Se lo dije, pero era porque yo pensaba que estaba montada. Me confundí.»
- **La lectura del arquitecto**: no fue invención de Fable ni mala fe de nadie. **Fue un comentario de pasada en una conversación, y
  acabó siendo una especificación escrita en presente.** A Fable le toca no haberlo marcado como no verificado; a nosotros, haberlo
  dicho sin comprobarlo. **Las dos mitades son el mismo fallo de procedencia.**
- El texto de Fable del 04/11 se queda literal en F-130. Lo que lo corrige está en `:3301-3305`, y la respuesta de Fable del 06/11
  lo reconoce.

### X · EL PRERREGISTRO COMPLETO, APROBADO ANTES DE PULSAR (arquitecto y Code, 06/11/2026)
El texto que leyó el arquitecto de una pieza, con sus cuatro añadidos. **Aprobado, con las huellas `55aa84614fd21a94` (la capa
de decisión) y `493d04614481e8a2` (la cuenta de los indecidibles).** Completa «X · EL PRERREGISTRO NUEVO…», más arriba.

- **Condición**:
  - la pregunta cerrada sobre la pareja sembrada de D, **NOR-10·4 (§2.4) ↔ CLI-12·6 (§3.5)**;
  - la herramienta, ruta `d` (`app/api/admin/medida-f130/d/route.ts`, en `origin/main` desde `8995459b`): sólo el juez, con los dos
    trozos enteros, sin puerta de citas y sin verificador;
  - Haiku 5.5.
- **Prompt**:
  - la plantilla de hoy (la 2 «se contesta sola… sobre frases», con el documento delante de cada texto);
  - el recorte `CRITERIO_DEL_CUMPLIMIENTO` (`a58deaf8`), sacado del bloque del juez de `5c2d50c9`. El bloque del principio va dentro.
  - **No es el prompt del producto**: X es la pregunta cerrada. Las 7 respuestas del 29/10 corrieron con otra plantilla y no cuentan.
- **n = 42**, en dos pulsaciones de 21. Si no llegan a 42 respuestas buenas, se pulsa una tercera vez y se cuentan las 42 primeras en
  orden.
- **⚠️ NINGÚN DESPLIEGUE ENTRE LAS DOS PULSACIONES** (arquitecto): el corpus no interviene, porque los trozos son constantes, así que
  reindexar da igual; **desplegar no**, porque un despliegue puede cambiar la plantilla o el recorte, y entonces las dos mitades de la
  tanda no serían la misma condición. **Reindexar da igual, desplegar no.**
- **Regla de cuenta**:
  - el guion aprobado (`527b3ad22bb79110` sobre `5210ea9a40ccf6c0`), con la regla (ii): sale si cualquiera de las dos preguntas da D;
  - las citas se juzgan con la regla de `SQL_34_06`, **no con la puerta de citas**, y la diferencia queda declarada;
  - **NADA y PARCIAL cuentan como FALLO**: una respuesta cuyas citas no se pueden leer es una respuesta que el producto tampoco podría
    publicar. Con eso la prueba sólo puede rebajar la tasa, nunca inflarla.
- **Las dos bandas, con un solo corte**:
  - **CONSTRUIR con 24 o más de 42**: error de tipo I del 1,83 % (con el nulo en 0,40);
  - **ENTERRAR con 23 o menos**: error de tipo II del 2,64 % (con la tasa en 0,70);
  - 24 es el corte de razón de verosimilitudes. No hay zona inconclusa ni segunda tanda.
- **Los indecidibles, asimétricos**:
  - construir vale con cualquier número;
  - **enterrar, sólo con 3 o menos en el recuento del producto**: con 3, el tipo II es del 9,44 %, y con 4, del 13,69 %;
  - con 4 o más: «no decide, y el motivo es el instrumento, no el fenómeno»;
  - **se leen ANTES que los positivos**, con la banda disponible.
- **Quién decide**: el recuento por la **regla del producto**; el del ancla se informa al lado. **Si caen a lados distintos del 24, no
  se decide nada, y esa discrepancia es el hallazgo.**
- **Salvedad**: la tasa de la herramienta es una **cota superior** de la del producto, porque la puerta de citas puede quitar hallazgos,
  unos 4,8 puntos (un pase de 21). El verificador no añade: su contador de rescates está a 0 en 42 pasadas.
- **Contexto, NO comparadores**: los 3 de 21 (D por el §3.1, otra pareja); los 0 de 21 (D por el §3.5 en el producto entero); y las 7
  del 29/10 (otra plantilla; en el ensayo en seco, 1 NADA y 0 PARCIAL).
- **Qué se hace con el resultado** (Fable, con la corrección del arquitecto):
  - **si construye**: la pasada 2 se construye tras interruptor y en sombra, y su activación para clientes queda condicionada al
    segundo corpus;
  - **si entierra**: se aparca con su ficha, y **la cobertura de D se declara POR PAREJA, nunca en una sola cifra**:
    ```
    cobertura medida de D, por pareja y en el producto entero:
      §2.4 ↔ §3.1 (el permiso contra el principio): 3 de 21
      §2.4 ↔ §3.5 (la D SEMBRADA):                  0 de 21
    ```
    Fable escribió «cobertura medida: 3 de 21», y es el cruce de las parejas otra vez: se corrige al archivarla (arquitecto).
- **LA PREDICCIÓN DE FABLE, PRERREGISTRADA A SU NOMBRE Y QUE SE PUNTÚA**: **«entre 26 y 32 de 42»**. Se puntúa como cualquier otra
  cuando salga el número, escrita aquí antes de verlo.
- **El recuento**: `FICHEROS=pulsación1.json,pulsación2.json node decidir_x.mjs`, en el scratchpad. Code informa al arquitecto en dos
  tiempos: **primero los indecidibles y la banda disponible, después los positivos**, y no juntos.

**AL REGISTRO, ERROR DEL ARQUITECTO (06/11/2026)**: sus tres valores esperados de la tabla de indecidibles (26,5, 25,0 y 24,1) salieron
de calcular con tasas redondeadas (0,10, 0,15 y 0,20) y llevaban al lado **cuentas enteras** (4, 6 y 8 de 42). Los correctos son 26,6,
25,2 y 23,8 (`binomial_x_indecidibles.mjs`, huella `493d04614481e8a2`). **Una cifra que no sale de la etiqueta que lleva al lado**,
otra vez. No cambia la conclusión: con 8, el esperado queda por debajo de 24.

**LA CUENTA DE LOS INDECIDIBLES** (`binomial_x_indecidibles.mjs`, aprobada), literal:
```
r   esperado con 0,70   P(enterrar | 0,70)   P(construir | 0,40)
0   29,4                2,64 %               1,83 %
1   28,7                4,14 %               1,26 %
2   28,0                6,33 %               0,83 %
3   27,3                9,44 %               0,53 %
4   26,6                13,69 %              0,33 %
5   25,9                19,29 %              0,20 %
6   25,2                26,35 %              0,11 %
7   24,5                34,84 %              0,06 %
8   23,8                44,55 %              0,03 %
```

**LA CAPA DE DECISIÓN, `decidir_x.mjs`, LITERAL** (huella `55aa84614fd21a94`, aprobada). Pruebas, 12 de 12. Mutantes, 8 de 9 en rojo:
corte en 23 y en 25, tope en 2 y en 4, tope mirado en el ancla, sin la regla del acuerdo, sin la comprobación de completas, y enterrar
siempre. **El superviviente es EQUIVALENTE**: «decidir por el ancla» sólo se alcanza cuando los dos recuentos ya están del mismo lado.
Ensayo con las 7 del 29/10: «NO PUNTUABLE», sin imprimir ningún positivo. Un tropiezo de Code por el camino: usaba la variable `ACCION`,
que es la del guion, y al importarlo corrían las pruebas del guion; pasó a `X_ACCION`. **Lectura de Code, aceptada por el arquitecto**:
el tope de 3 cuenta los indecidibles del recuento del producto, porque protege el tipo II del recuento que decide; los del ancla
ya los cubre la regla del desacuerdo.
```js
// LA DECISIÓN DE X EN CÓDIGO (Code, 06/11/2026), escrita ANTES de la tanda y congelada por su huella. Prerregistro de X en
// claude/Predicciones_34_Conflicto_Normativo.md («X · EL PRERREGISTRO NUEVO…» y las tres respuestas del arquitecto del 06/11).
// NO CUENTA NADA: el recuento es el del guion aprobado (contar_brazos.mjs, 527b3ad22bb79110, con contar_quinto.mjs, 5210ea9a40ccf6c0),
// que se IMPORTA sin tocarlo, con su función brazo(). Esta capa sólo sustituye la decisión de P-F130-23 (dos brazos, cotas cruzadas,
// repetición con más de 4 indecidibles) por la de X, que es otra:
//   · UN SOLO BRAZO, n = 42, la pareja del §3.5 (p35). Positivos = el recuento estricto: los «sale». NADA y PARCIAL cuentan como fallo.
//   · DECIDE el recuento por la REGLA DEL PRODUCTO; el del ANCLA se informa al lado, y si los dos caen a lados distintos del 24, NO SE
//     DECIDE (la discrepancia es el hallazgo).
//   · CONSTRUIR con 24 o más, con cualquier número de indecidibles. ENTERRAR con 23 o menos, SÓLO si los indecidibles del recuento que
//     decide son 3 o menos; con 4 o más, «no decide, y el motivo es el instrumento, no el fenómeno».
//   · Los indecidibles se imprimen ANTES que los positivos, y con ellos la banda disponible.
// Lectura de Code, MARCADA para el arquitecto: el tope de 3 indecidibles mira el recuento que decide (producto), no el del ancla.
// Uso (SIN argumentos; contar_quinto los tomaría como suyos): FICHEROS=pulsación1.json,pulsación2.json[,pulsación3.json] node decidir_x.mjs
//   ·   X_ACCION=pruebas node decidir_x.mjs (no ACCION: es la variable del guion, que al importarlo correría su propia línea de órdenes)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
if (process.argv[2]) { console.log('NO SE DECIDE: este script no lleva argumentos (ver la cabecera).'); process.exit(1); }
const DIR = new URL('.', import.meta.url);
for (const [f, h] of [['contar_quinto.mjs', '5210ea9a40ccf6c0'], ['contar_brazos.mjs', '527b3ad22bb79110']]) {
  const real = createHash('sha256').update(readFileSync(new URL(f, DIR))).digest('hex').slice(0, 16);
  if (real !== h) { console.log(`NO SE DECIDE: ${f} tiene huella ${real}, no la aprobada ${h}`); process.exit(1); }
}
const { brazo, PAREJAS } = await import('./contar_brazos.mjs');

export const N = 42, CORTE = 24, MAX_INDECIDIBLES_PARA_ENTERRAR = 3;

// La decisión, PURA, sobre lo que devuelve brazo(): { completas, n, fallidas, ancla: { sale, ilegibles }, producto: { sale, ilegibles } }.
export function decidirX(b) {
  if (!b.completas) return { decision: 'NO PUNTUABLE', motivo: `faltan respuestas buenas para ${b.n}: se pulsa una tercera vez y se cuenta en orden` };
  const rP = b.producto.ilegibles.length, rA = b.ancla.ilegibles.length;
  const enterrarDisponible = rP <= MAX_INDECIDIBLES_PARA_ENTERRAR;
  const lado = s => (s >= CORTE ? 'construir' : 'enterrar');
  const lP = lado(b.producto.sale), lA = lado(b.ancla.sale);
  const base = { rP, rA, enterrarDisponible, positivosProducto: b.producto.sale, positivosAncla: b.ancla.sale };
  if (lP !== lA) return { ...base, decision: 'NO SE DECIDE', motivo: `los dos recuentos caen a lados distintos del ${CORTE}: la discrepancia es el hallazgo` };
  if (lP === 'construir') return { ...base, decision: 'CONSTRUIR', motivo: `${b.producto.sale} de ${b.n} por la regla del producto (y ${b.ancla.sale} por ancla), ${CORTE} o más` };
  if (!enterrarDisponible) return { ...base, decision: 'NO DECIDE', motivo: `por debajo del ${CORTE}, pero con ${rP} indecidibles (más de ${MAX_INDECIDIBLES_PARA_ENTERRAR}) enterrar no está disponible: el motivo es el instrumento, no el fenómeno` };
  return { ...base, decision: 'ENTERRAR', motivo: `${b.producto.sale} de ${b.n} por la regla del producto (y ${b.ancla.sale} por ancla), ${CORTE - 1} o menos, con ${rP} indecidibles` };
}

function informe(b) {
  const d = decidirX(b);
  const L = [`X · ${PAREJAS.p35.nombre} · n = ${b.n}`, `1 · LAS FALLIDAS: ${b.fallidas.length}${b.fallidas.length ? ' — ' + b.fallidas.join(' · ') : ''}`];
  if (d.decision === 'NO PUNTUABLE') { L.push(`NO PUNTUABLE: ${d.motivo}`); return L.join('\n'); }
  L.push(`2 · LOS INDECIDIBLES, ANTES QUE NINGÚN POSITIVO: por la regla del producto ${d.rP}, por ancla ${d.rA}`);
  for (const k of ['producto', 'ancla']) for (const i of b[k].ilegibles) L.push(`   ${k}: ${i}`);
  L.push(`3 · LA BANDA DISPONIBLE: construir siempre; enterrar ${d.enterrarDisponible ? 'SÍ' : `NO (más de ${MAX_INDECIDIBLES_PARA_ENTERRAR} indecidibles)`}`);
  L.push(`4 · LOS POSITIVOS: por la regla del producto ${d.positivosProducto} de ${b.n} (decide) · por ancla ${d.positivosAncla} de ${b.n} (al lado)`);
  L.push(`5 · DECISIÓN: ${d.decision} — ${d.motivo}`);
  return L.join('\n');
}

// LAS PRUEBAS, con brazos INVENTADOS. Cada caso está puesto en una frontera, de modo que una versión equivocada lo suspenda: el corte
// en 23 o en 25, el tope de indecidibles en 2 o en 4, decidir por el ancla, o no exigir que los dos recuentos caigan del mismo lado.
function correrPruebas() {
  const ileg = r => Array.from({ length: r }, (_, i) => `vez ${i + 1}: pregunta 2: NADA`);
  const B = (sP, rP, sA = sP, rA = rP, completas = true) => ({ completas, n: N, fallidas: [], producto: { sale: sP, ilegibles: ileg(rP) }, ancla: { sale: sA, ilegibles: ileg(rA) } });
  const casos = [
    ['24 sin indecidibles → CONSTRUIR (mata el corte en 25)', B(24, 0), 'CONSTRUIR'],
    ['23 sin indecidibles → ENTERRAR (mata el corte en 23)', B(23, 0), 'ENTERRAR'],
    ['24 con 10 indecidibles → CONSTRUIR (construir no mira los indecidibles)', B(24, 10), 'CONSTRUIR'],
    ['23 con 3 indecidibles → ENTERRAR (mata el tope en 2)', B(23, 3), 'ENTERRAR'],
    ['23 con 4 indecidibles → NO DECIDE (mata el tope en 4)', B(23, 4), 'NO DECIDE'],
    ['producto 23 y ancla 24 → NO SE DECIDE (mata decidir sólo por uno)', B(23, 0, 24, 0), 'NO SE DECIDE'],
    ['producto 24 y ancla 23 → NO SE DECIDE (mata decidir por el producto sin mirar el ancla)', B(24, 0, 23, 0), 'NO SE DECIDE'],
    ['los dos 23; producto con 3 indecidibles y ancla con 6 → ENTERRAR (el tope mira el recuento que decide)', B(23, 3, 23, 6), 'ENTERRAR'],
    ['los dos 23; producto con 4 y ancla con 0 → NO DECIDE (mata mirar el tope en el ancla)', B(23, 4, 23, 0), 'NO DECIDE'],
    ['incompleto → NO PUNTUABLE', B(30, 0, 30, 0, false), 'NO PUNTUABLE'],
    ['el informe imprime los indecidibles antes que los positivos', () => { const s = informe(B(25, 2)); return s.indexOf('INDECIDIBLES') < s.indexOf('POSITIVOS') && s.indexOf('BANDA') < s.indexOf('POSITIVOS'); }, true],
    ['el informe no imprime positivos si no es puntuable', () => /POSITIVOS/.test(informe(B(30, 0, 30, 0, false))), false],
  ];
  let ok = 0;
  for (const [nombre, x, esperado] of casos) {
    const real = typeof x === 'function' ? x() : decidirX(x).decision;
    const bien = real === esperado; if (bien) ok++;
    console.log(`${bien ? 'ok ' : 'MAL'} · ${nombre}${bien ? '' : ` — esperaba ${esperado}, sale ${real}`}`);
  }
  console.log(`${ok} de ${casos.length}`);
  if (ok !== casos.length) process.exitCode = 1;
}

const ACCION = process.env.X_ACCION, FICHEROS = (process.env.FICHEROS ?? '').split(',').filter(Boolean);
if (ACCION === 'pruebas') correrPruebas();
else if (FICHEROS.length) console.log(informe(brazo(FICHEROS.map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas), PAREJAS.p35, N)));
else console.log('NO SE DECIDE: hacen falta FICHEROS o X_ACCION=pruebas (ver la cabecera).');
```

### X · EL RESULTADO: NO SE DECIDE, Y EL MOTIVO ES EL INSTRUMENTO (06/11/2026)
**Las dos fugas, al registro**: el director pegó las 42 respuestas en bruto al arquitecto y a Code. Los dos las vieron antes del
recuento y ninguno contó positivos a mano. El arquitecto lo declaró antes de pedir el recuento, y Code al dar los indecidibles.
Son inertes porque el corte, la regla de cuenta, el guion y la capa estaban congelados antes de pulsar.
**La metadata, comprobada por script** (`extraer_x.mjs`), antes de contar:
- la misma `medida` y el mismo modelo (`claude-haiku-5-5`), y la misma pareja en las 42;
- **4.155 tokens de entrada en las 42 llamadas**;
- 21 + 21 respuestas con texto, todas con `ok`, 200, intento 1 y `sinEtapa` 0;
- 10:59:37 y 11:02:13 UTC. Entre el final de la primera tanda y el comienzo de la segunda hubo unos 46 s, no 2,5 minutos; lo que
  descarta el despliegue son los tokens idénticos.

Las dos salidas, en `claude/Medida_F130_X_D_Sembrada_Pulsacion_{1,2}_06-11-2026.json` (`4659e773`).

**Primer tiempo, los indecidibles y la banda** (`indecidibles_x.mjs`, sin positivos), literal:
```
X · la pareja del §3.5 (NOR-10·4 ↔ CLI-12·6) · n = 42 · completas: true
1 · LAS FALLIDAS: 0
2 · LOS INDECIDIBLES: por la regla del producto 18, por ancla 14 (de ellos, a caballo: 0)
   producto: pulsación 1, vez 3: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 4: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 7: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 8: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 12: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 13: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 18: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 19: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 1, vez 20: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 2, vez 2: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 2, vez 6: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 2, vez 11: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 2, vez 13: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 2, vez 15: pregunta 1: NIEGA; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 16: pregunta 1: NIEGA; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 18: pregunta 1: NIEGA; pregunta 2: NADA
   producto: pulsación 2, vez 20: pregunta 1: NIEGA; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   producto: pulsación 2, vez 21: pregunta 1: NIEGA; pregunta 2: PARCIAL (un solo lado por la regla del producto)
   ancla: pulsación 1, vez 3: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 4: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 7: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 8: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 12: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 13: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 18: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 19: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 1, vez 20: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 2, vez 2: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 2, vez 6: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 2, vez 11: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 2, vez 13: pregunta 1: NIEGA; pregunta 2: NADA
   ancla: pulsación 2, vez 18: pregunta 1: NIEGA; pregunta 2: NADA
3 · LA BANDA DISPONIBLE: construir siempre; enterrar NO (más de 3 indecidibles)
```

**Lo fijado por el arquitecto ANTES de ver el número**, literal (sacado del registro de la conversación con un script):

> **EL DEFECTO ES MÍO Y AL REGISTRO, CON FECHA DE HOY:** ayer derivé que «construir vale con cualquier número de indecidibles» porque los indecidibles sólo bajan el recuento. **Eso es cierto y es vacío**: no calculé que por encima de cierto número de indecidibles **el techo se hunde por debajo del corte** y construir deja de ser alcanzable. La regla era correcta en la dirección e inútil en la práctica. **Me faltaba una línea de aritmética y la hiciste tú.**
>
> **Y HAY UNA TENTACIÓN QUE RECHAZO, Y LA ESCRIBO PARA QUE CONSTE QUE LA VI:** por ancla hay 14 indecidibles, o sea 28 puntuables, y ahí construir con 24 de 28 **sí es alcanzable** (4,7 % con tasa 0,70; 85,8 % con 0,90). **El recuento que decide está muerto y el que se informa está vivo.** Cambiar cuál decide, ahora que sé cuál funciona, sería elegir el instrumento después de ver cuál me conviene. **No se cambia. Decide la regla del producto, como está prerregistrado.**
>
> ═══ LO QUE SE CONCLUYE, FIJADO ═══
> - **Construir** si los positivos por la regla del producto son 24 de 24. Sigue siendo válido si sale: con el nulo es imposible.
> - **Cualquier otro número: «no decide, y el motivo es el instrumento, no el fenómeno.»**
> - **Enterrar no está disponible.** La pasada 2 no se entierra con esta tanda.
> - Y la regla del desacuerdo sigue en pie: si los dos recuentos caen a lados distintos del 24, no se decide.

**Segundo tiempo, la capa aprobada** (`decidir_x.mjs`, huella `55aa84614fd21a94`), literal, sin las líneas de detalle:
```
X · la pareja del §3.5 (NOR-10·4 ↔ CLI-12·6) · n = 42
1 · LAS FALLIDAS: 0
2 · LOS INDECIDIBLES, ANTES QUE NINGÚN POSITIVO: por la regla del producto 18, por ancla 14
3 · LA BANDA DISPONIBLE: construir siempre; enterrar NO (más de 3 indecidibles)
4 · LOS POSITIVOS: por la regla del producto 22 de 42 (decide) · por ancla 26 de 42 (al lado)
5 · DECISIÓN: NO SE DECIDE — los dos recuentos caen a lados distintos del 24: la discrepancia es el hallazgo
```
- **Por la regla del producto, la que decide: 22 de 42.** Hay 24 puntuables, y de ellas 22 salen y 2 niegan. Queda por debajo
  del techo, así que no llega a 24 de 24.
- **Por ancla, la que se informa: 26 de 42.** Hay 28 puntuables, y de ellas 26 salen y 2 niegan.
- **Decisión: NO SE DECIDE.** Hay dos motivos y cualquiera de los dos basta:
  1. los dos recuentos caen a lados distintos del 24;
  2. el recuento que decide no puede llegar a construir, y enterrar no está disponible.

  Los dos motivos son del instrumento, no del fenómeno. **La pasada 2 ni se construye ni se entierra con esta tanda.**
- **Las cifras del arquitecto sobre el techo, comprobadas en binomial exacta**: P(24 de 24) = 2,8 × 10⁻⁸ % con 0,40; 0,0192 % con
  0,70; 7,98 % con 0,90; 29,20 % con 0,95. Por ancla, P(24 o más de 28) = 4,74 % con 0,70 y 85,79 % con 0,90.
- ~~**LA PREDICCIÓN DE FABLE («entre 26 y 32 de 42»), PUNTUADA**: por el recuento que decide, 22. **Queda fuera: FALLA.** Por ancla,
  26, que queda dentro, en el borde bajo. Fable la escribió sobre su propia regla de la puerta, que no es ninguna de las dos.~~
  **CORREGIDO por el arquitecto el 06/11: LA PREDICCIÓN DE FABLE NO ES PUNTUABLE, porque el instrumento cambió después de que ella
  predijera.** La escribió con la puerta de citas, y la puerta no se corrió. Ponerle nota con la regla de `SQL_34_06` sería lo que
  el arquitecto no acepta que le hagan a él. Los dos recuentos, al lado: **22** por la regla del producto y **26** por ancla. **Los dos
  quedan en el borde bajo de su banda**: su magnitud iba bien encaminada, y es la regla de contar la que decide si acierta o no. Es un
  hallazgo sobre la fragilidad de las dos cosas. *(Code la había puntuado FALLA en `33a88e1b`; la corrección es del arquitecto, que la
  firma como suya.)*

**LA LECTURA DE CODE, DESPUÉS DE LOS POSITIVOS. ESTA TANDA NO SE RECUENTA: esto es para diseñar la SIGUIENTE medición**
(`nada_x.mjs`, `x_nada_lectura.txt`):
- **Los 14 NADA son todos fallos del LECTOR, no del juez.** En las 14, el juez afirma el hallazgo con otras palabras:
  - «HAY HALLAZGO», solo o con prefijo: 4 respuestas;
  - «Sí, hay hallazgo» o «Sí hay hallazgo»: 5. El lector quita a propósito ese prefijo en la pregunta 2, porque ahí «sí» es
    la polaridad contraria;
  - «Sí, ambos son reglas, y no se pueden cumplir…»: 3. Llevan «sí» y «no» en la misma frase, y el lector las anula;
  - «Hay hallazgo, de tipo…»: 1;
  - «Por tanto, no se pueden cumplir…», donde el veredicto no está al principio de la línea: 1.

  La pregunta 2 se formula como «¿se pueden cumplir?», con el hallazgo en el «no», y el juez contesta a menudo en el registro del
  hallazgo («hay hallazgo») y no en el de la pregunta.
- **Los 4 PARCIAL por la regla del producto son citas con GLOSA o con PUNTOS SUSPENSIVOS**: en dos, «la figura [de Coordinador de
  Calidad] puede recaer…» del lado de NOR-10; en las otras dos, «...nunca por…» o «...sus funciones…» del lado de CLI-12. La regla de
  `SQL_34_06` exige el texto literal; **la puerta del producto tiene un paso de glosa** (`glosa-de-cita.ts`). Es la diferencia
  declarada en la decisión 4, y en esta tanda ha decidido el resultado.
- **Las 2 que niegan en cada recuento son negativas explícitas**: «Sí, se pueden cumplir las dos a la vez».

### TRAS X · LAS DOS DECISIONES PARA LA SIGUIENTE MEDICIÓN, Y LO QUE CUESTA ACERCARSE A LA PUERTA (arquitecto y Code, 06/11/2026)
Las decisiones del arquitecto, literales (sacadas del registro con un script):

> ═══ Y LAS DOS DECISIONES PARA LA SIGUIENTE MEDICIÓN ═══
>
> **1 · EL LECTOR DE LA PREGUNTA 2 SE ARREGLA; EL PROMPT NO SE TOCA.**
> Tu desglose de los 14 es inequívoco: el juez **afirma el hallazgo con otras palabras** —«HAY HALLAZGO», «Sí, hay hallazgo», «Sí, ambos son reglas, y no se pueden cumplir…»— y el lector no lo lee porque espera un «no».
>
> Y aquí hay un matiz que importa: **eso no es un capricho del juez, es que el prompt le enseña DOS vocabularios.** Pregunta «¿se pueden cumplir las dos a la vez?» y a la vez usa «hay hallazgo» en sus ejemplos. **El juez mezcla los dos porque el prompt los mezcla.**
>
> Aun así, **el prompt no se toca: es el tratamiento.** Se arregla el lector, y no es calibrar sobre una muestra: **«hay hallazgo» y «no se pueden cumplir» son el mismo enunciado en los dos vocabularios que el propio prompt enseña**, y la correspondencia es inequívoca. Describe la regla por los sinónimos que acepta, no por las 14 que arregla, y con mutantes: uno que no reconozca «hay hallazgo» tiene que salir en rojo, **y otro que lea «se pueden cumplir» como positivo también.**
>
> **2 · LA REGLA DE CITAS SE ACERCA A LA PUERTA, Y ESO ES REVOCAR MI DECISIÓN 4.**
> Rechacé llamar a la puerta del producto para no escribir código nuevo. **La medición ha puesto precio a esa decisión: 4 respuestas de 42, y es justo lo que separa los dos recuentos y hace que no se decida.** Los 4 PARCIAL son citas con glosa o con puntos suspensivos, y la puerta del producto **ya tiene un paso de glosa** (`glosa-de-cita.ts`).
>
> **Así que Fable tenía razón en su regla y yo no.** Y no es código nuevo en el sentido que me preocupaba: es **reutilizar una función que existe**, que es exactamente el argumento que ella dio sobre el puente y la puerta de citas y que yo acepté en el defecto 3. Lo apliqué allí y no aquí.
>
> **Dime qué cuesta llamar a `glosa-de-cita.ts` desde el recuento**, y si se puede hacer sin tocar la puerta ni el producto. Si es reutilizar, se hace. Si exige cambiar la puerta, se queda como está y lo declaramos.
>
> **Y entonces desaparece el recuento doble**, porque los dos recuentos existían para acotar una diferencia que ya no habría. Eso simplifica la siguiente medición en vez de complicarla.
>
> ═══ LO QUE NO HAGO ═══
> **No recuento esta tanda, no la amplío y no la repito todavía.** Las 42 respuestas quedan archivadas como son. **La siguiente medición es un prerregistro nuevo**, con el lector arreglado y la regla de citas decidida, y con su propio techo calculado **antes** de pulsar — que es la línea de aritmética que me faltó hoy.
>
> **Lo que sí quiero antes de escribirlo:** con el lector arreglado y la glosa dentro, **¿cuántos indecidibles habrían quedado en esta tanda?** No para recontarla, sino **para calcular el techo de la siguiente antes de prerregistrarla.** Esa cifra es legítima: es sobre el instrumento, no sobre el resultado.

**LO QUE ENCONTRÓ CODE AL RESPONDER, Y CAMBIA LA PREMISA DE LA DECISIÓN 2: LA GLOSA SOLA NO RESCATA NINGUNA DE LAS 4.**
- Se preguntó a la función del producto (`quitarGlosa`, `lib/analysis/glosa-de-cita.ts`) por cada una de las 42 citas de X
  (`herramientas/glosas_x.test.ts`, scratchpad). Sólo 3 llevan glosa, y **sin ella tampoco son literales**: el juez escribió
  «la figura [de Coordinador de Calidad] puede recaer…», y el texto dice «…de Calidad, figura QUE puede recaer…». Quitar el corchete
  deja «la figura puede recaer», que no está en NOR-10.
- **Las 4 PARCIAL, una por una:**
  - **dos, las de puntos suspensivos** (pulsación 2, veces 16 y 20, del lado de CLI-12), **las rescata la NORMALIZACIÓN de la puerta**
    (`normalize`, que quita la puntuación): normalizadas, salen literales en el §3.5;
  - **dos, las de glosa** (veces 15 y 21, del lado de NOR-10), **sólo las rescata el TRAMO**, el paso 3 de la puerta, que sólo actúa
    en contradicciones: un tramo literal de 43 de 52 y de 82 de 91 caracteres normalizados (83 % y 90 %), por encima de 40 y del 50 %.
    La puerta publicaría la frase real del ancla, que es la del permiso.
- **El coste**: `quitarGlosa` es pura y llamarla no toca la puerta ni el producto, pero **no basta**. Para acercarse a la puerta
  hacen falta sus tres pasos: la normalización, la glosa y el tramo con la frase real. Son piezas en TypeScript, y el guion es
  `.mjs` y no las puede importar (al cargarse bajo vitest se sale, porque mira `process.argv`). Reutilizarlas exige un recuento
  nuevo que las llame desde una herramienta de vitest. **Es código de cuenta nuevo y tiene que aprobarse; no cambia ni la puerta ni
  el producto.**

**CUÁNTOS INDECIDIBLES HABRÍAN QUEDADO EN ESTA TANDA, POR ESCENARIO** (`techo_x.mjs`; sólo indecidibles, nunca positivos; **para el
techo de la siguiente, NO para recontar X**). Los lectores arreglados son BOCETOS de escenario, no el lector que se aprobará:
- «mínimo»: una línea que empieza por «hay hallazgo», con o sin «sí,» delante;
- «amplio»: además, «no se pueden cumplir» en cualquier sitio de una frase sin «sí se pueden cumplir».

**Control positivo**: el escenario «aprobado · sql» reproduce el 18 del guion aprobado, con 14 NADA y 4 PARCIAL.
```
escenario (lector · citas)            indecidibles   NADA   PARCIAL
aprobado · sql                        18             14     4
mínimo · sql                          10             4      6
mínimo · glosa                        10             4      6
mínimo · normalizada                  8              4      4
mínimo · tramo                        4              4      0
amplio · sql                          6              0      6
amplio · glosa                        6              0      6
amplio · normalizada                  4              0      4
amplio · tramo                        0              0      0
```
- **La glosa sola no mueve nada en ningún escenario** (fila «glosa» igual a la fila «sql»).
- **Con el lector mínimo, 2 de las 10 que pasa a leer caen en PARCIAL por la regla de citas**: el lector y la regla de citas no son
  independientes.
- **Sólo el escenario completo, lector amplio y tramo, deja 0.** El lector mínimo con el tramo deja 4: las 3 «Sí, ambos son reglas, y
  no se pueden cumplir…» y la «Por tanto, no se pueden cumplir…».

### X · EL INSTRUMENTO DE LA SIGUIENTE TANDA, APROBADO; LOS 4 INDECIDIBLES, ACEPTADOS; Y EL LECTOR APROBADO, MIRADO HACIA ATRÁS (09/11/2026)
**APROBADO por el arquitecto el 09/11, con sus cuatro huellas**: `instrumento_x2.ts` `203bb5dde2e3bee8`; sus pruebas, 29 de 29,
`9b10b9fa58eac8e6`; `trozos_d.json` `18065fb25f057dc0`, el pajar sacado con un script del ensayo de D del 04/11
(`Medida_F130_E3_Y_Vecindad…:3334-3367`); y `mutar_x2.mjs` `8b8d5c8a1588391d`, con 16 mutantes de 16 en rojo, entre ellos los tres
pedidos. El decisivo, «a primera vista no se pueden cumplir, pero en realidad sí», sale NEGATIVA, y sin el seguro saldría positiva.
**Las citas pasan por la puerta de verdad** (`comprobadorDeLado` con `verifyQuote`, y `comprobarConRepliegues`), sin copiarla.
El que lo corre, `correr_x2.test.ts`, es aparte y no cuenta nada (huella `365f11660d0b588a`): llama a
`brazoX2` y a `decidirX`, imprime en dos tiempos y empieza cada salida por las huellas de lo que la escribió.

**EL CONTROL SOBRE LAS 42 DE X: 4 INDECIDIBLES, NO 0** (sólo indecidibles; X no se recuenta). Las 4 son la misma cita mal transcrita,
«la figura [de Coordinador de Calidad] puede recaer…», donde el original dice «…figura QUE puede recaer…». La puerta del producto la
tira: sin la glosa sigue sin ser literal, y en el paso de tramo el resto («la figura») ni es literal ni llega a 40. **El producto
tampoco la publicaría.**

**AL REGISTRO, LAS DOS RETIRADAS DEL 09/11**:
1. **El boceto de Code (`techo_x.mjs`), que daba 0 indecidibles con el lector amplio y el tramo.** Aceptaba un ancla de tramo sin
   comprobar que el resto fuera literal y de 40 o más, que es lo que la puerta exige. Su tabla queda sustituida por el control del
   instrumento aprobado.
2. **La conclusión del arquitecto construida sobre ese 0**, y el «97,36 %» que celebró sobre la cifra que había escrito el último
   mutante. Literal:

> **Y las dos estimaciones quedan retiradas: tu boceto (0) y mi conclusión del viernes construida sobre él.** Al registro las dos, con fecha de hoy.

**LA DECISIÓN DEL ARQUITECTO, Y EL AÑADIDO AL PRERREGISTRO DE X**, literales (sacados del registro con un script):

> ═══ LA DECISIÓN SOBRE LOS 4 INDECIDIBLES: SE CORRE TAL CUAL ═══
> ```
> 4 indecidibles  ->  potencia 86,31 %   error I 0,330 %   enterrar NO disponible
> ```
> **Y NO muevo el tope de 3.** Lo derivé el viernes de un criterio que declaré —mantener el error de tipo II por debajo del 10 %— y a 4 indecidibles sale 13,7 %. **Moverlo ahora, justo cuando aprieta, es exactamente lo que no hacemos.** Que el tope moleste no es un argumento para subirlo; es lo que un tope hace.
>
> **Así que la siguiente tanda puede construir y no puede enterrar.** Lo acepto por tres razones:
> 1. **Un 86,3 % de potencia para la decisión sobre la que actuaríamos** es suficiente. La que no podemos tomar es la que no nos hace actuar.
> 2. Los 4 indecidibles son **la misma cita mal transcrita por el juez**, así que van a reaparecer en cualquier tanda: esperar a un instrumento que dé 0 es esperar a algo que no va a llegar.
> 3. Y lo importante: **el producto tampoco publicaría esas 4 citas.** Tu propia observación. Contarlas como fallo no es un defecto del instrumento, **es el instrumento midiendo lo que el producto haría.**
>
> **Y AÑADO AL PRERREGISTRO, AHORA Y NO DESPUÉS:** si sale «no decide», **el recuento se informa igualmente con su intervalo de Wilson**, como tasa medida de D bajo la pregunta cerrada con el instrumento completo. No es una decisión y no se presenta como tal, pero es un dato y lo declaramos antes de verlo, para que no parezca un premio de consolación inventado después.
>
> **El resto del prerregistro de X no cambia:** corte en 24 sobre 42, los indecidibles como fallo, decide la regla del producto, y esta tanda no se recuenta.

**EL DEFECTO DEL LECTOR APROBADO, MIRADO HACIA ATRÁS** (`falso_positivo_q2.mjs` y `falso_positivo_casos.mjs`, scratchpad). El defecto:
en la pregunta 2, un «No…» que niega el hallazgo se lee como hallazgo. Se buscó por el mecanismo, no por la frase. Cada pregunta 2
que el lector da por hallazgo se rastreó hasta la línea que lo decidió: el prefijo más corto de la sección con el que `veredicto` ya
decide, sin reescribirlo. Se hizo sobre las 179 respuestas archivadas de la pregunta cerrada, de las once tandas.
- **127** preguntas 2 se leyeron como hallazgo: **52** por «No (,) se pueden cumplir…» y **75** por otro «No…». Leídas una a una, 70
  son hallazgos de verdad: «No.», «No. Hay hallazgo», «¿Se pueden cumplir? No.», «EL CUMPLIMIENTO: NO»…
- **DISPARÓ 2 VECES, y las dos en las tandas del quinto:**
  - **tanda 1, vez 13**: «No encuentro ningún par… Se pueden cumplir las dos a la vez.» Es una negativa leída como hallazgo.
    **Efecto: ninguno.** `contar_quinto` la da como «salió» por la pregunta 1, sin anclas en la 2, así que en la columna 2 cuenta como
    «la 1», que es lo que la lectura correcta también daría. Los 13 de 21 y los 6 de 12 no se mueven.
  - **tanda 2, vez 12**: «Sí se pueden cumplir las dos a la vez… No hay hallazgo en ninguna de las dos preguntas.» El lector no lee la
    primera línea, porque no empieza por «Sí», y decide por la última. `contar_quinto` la contó como **ILEGIBLE** («un ancla fuera de
    comillas»). Leída bien, las dos preguntas niegan: **no salió.** **Efecto: los 12 de 21 no cambian; los ilegibles de esa tanda
    pasan de 4 a 3, y su cota alta de 16 a 15.** No entra en la columna 2 ni en P-P3-2, porque no salió en ninguna de las dos
    lecturas.
- **ACERTÓ POR CASUALIDAD 3 VECES**: condición 1, vez 11, y X, pulsación 2, veces 12 y 17. El juez afirmaba el hallazgo en una línea
  que el lector no lee («Sí, hay hallazgo»), y el lector lo dio por bueno por una línea final que no era veredicto: «No he encontrado
  otros pares…», «No hay conflicto en los demás pares…». La respuesta es la correcta, y la razón no.
- **Conclusión: el defecto es HISTÓRICO, pero no infló ninguna cifra publicada.** Movió una cota alta (la de la tanda 2 del quinto,
  de 16 a 15) y acertó por casualidad tres veces. El instrumento nuevo no decide cuando el aprobado contradice una frase explícita de
  la respuesta; en las 42 de X no se da ningún caso.

**EL INSTRUMENTO, LITERAL** (scratchpad; las huellas se calculan sobre los ficheros, no sobre esta copia):

`herramientas/instrumento_x2.ts` · huella `203bb5dde2e3bee8`
```ts
// EL INSTRUMENTO DE LA SIGUIENTE TANDA DE X (Code, 06/11/2026), para aprobar por su huella ANTES de que corra nada. El
// prerregistro de X NO cambia: el mismo corte (24 de 42), los mismos errores, NADA y PARCIAL como fallo, y la regla (ii) de las dos
// preguntas. Cambian dos piezas del instrumento (decisiones del arquitecto, 06/11, tras X):
//   1 · LAS CITAS PASAN POR LA PUERTA DEL PRODUCTO, sus tres pasos y sin tocarla: la comprobación de siempre (literal o
//       normalizada), la glosa y el tramo con la frase real. Se LLAMA a `comprobadorDeLado` + `comprobarConRepliegues`
//       (pajar-de-la-cita.ts, repliegue-de-tramo.ts) con `verifyQuote` (judge.ts), con el trozo entregado ENTERO como pajar, que es
//       como la herramienta se lo da al juez. De lo que la puerta da por bueno —la cita, o la frase real del ancla— se mira, como en
//       SQL_34_06, a qué frase toca: del lado de NOR-10, la del permiso (D) y no la de A («a caballo» no cuenta); del lado de CLI-12,
//       dentro del §3.5. Con el mínimo de 20 caracteres normalizados de SQL_34_06.
//   2 · EL LECTOR AMPLIO DE LA PREGUNTA 2: primero el lector aprobado (contar_quinto, `veredicto`), sin cambiar nada de lo que ya
//       decide; sólo si no decide, el amplio. Se describe por lo que acepta, no por los casos que arregla:
//       · «hay hallazgo» → hallazgo; «no hay hallazgo» → no lo hay. En cualquier frase de la sección, fuera de citas y de preguntas.
//       · «no se pueden cumplir» / «no pueden cumplirse» → hallazgo; «se pueden cumplir» / «pueden cumplirse» sin «no» → no lo hay.
//         En plural: «la sustitución sí puede cumplirse» habla de una regla, no del par.
//       · EL SEGURO: dentro de una frase, manda la cláusula que va DESPUÉS de «pero», «sin embargo» o «no obstante»; una cláusula
//         con «a primera vista», «aparentemente», «en apariencia» o «literalmente» no da veredicto; y un «sí» suelto detrás de una
//         adversativa, cuando antes se ha hablado de cumplir, es «sí se pueden». Así «a primera vista no se pueden cumplir, pero en
//         realidad sí» es NEGATIVA.
//       · De cada vía vale la ÚLTIMA frase que da veredicto (la conclusión). Si las dos vías dan veredictos distintos, no decide.
// Los guiones aprobados se IMPORTAN sin tocarlos (contar_quinto 5210ea9a40ccf6c0, contar_brazos 527b3ad22bb79110): leen
// process.argv al cargarse, así que se cargan con argv vacío y se restaura. La decisión es la de la capa aprobada (decidir_x
// 55aa84614fd21a94, `decidirX`), con un solo recuento en las dos casillas: el recuento doble desaparece (arquitecto).
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { verifyQuote } from '@/lib/analysis/judge';
import { comprobadorDeLado } from '@/lib/analysis/pajar-de-la-cita';
import { comprobarConRepliegues, localizadorDeLado } from '@/lib/analysis/repliegue-de-tramo';
import { normalize } from '@/lib/analysis/normalize';
import type { StoredChunk } from '@/lib/read-chunks';

export const S = 'C:/Users/beaz8/AppData/Local/Temp/claude/E--Doc-Hub/914469ea-1369-4763-8e6a-9aadf9158516/scratchpad/';
const HUELLAS: Array<[string, string]> = [['contar_quinto.mjs', '5210ea9a40ccf6c0'], ['contar_brazos.mjs', '527b3ad22bb79110'], ['decidir_x.mjs', '55aa84614fd21a94'], ['trozos_d.json', 'TROZOS']];
type Veredicto = 'sí' | 'no' | null;
type Clase = 'D' | 'PARCIAL' | 'OTRO' | 'NIEGA' | 'NADA';
interface Guiones {
  secciones: (t: string) => { p1: string; p2: string } | null;
  veredicto: (s: string, p: number) => Veredicto;
  casilla: (c1: Clase, c2: Clase) => boolean | null;
  TEXTOS: Record<string, string>;
  decidirX: (b: unknown) => { decision: string; motivo: string; rP?: number; enterrarDisponible?: boolean };
  N: number; MAX: number;
}
let guiones: Guiones | null = null;
export async function cargar(huellaTrozos: string): Promise<Guiones> {
  for (const [f, h] of HUELLAS) {
    const real = createHash('sha256').update(readFileSync(S + f)).digest('hex').slice(0, 16);
    const esperada = h === 'TROZOS' ? huellaTrozos : h;
    if (real !== esperada) throw new Error(`${f} tiene huella ${real}, no la aprobada ${esperada}`);
  }
  if (guiones) return guiones;
  const argv = process.argv; process.argv = argv.slice(0, 2);
  try {
    const q = await import(/* @vite-ignore */ 'file:///' + S + 'contar_quinto.mjs');
    const b = await import(/* @vite-ignore */ 'file:///' + S + 'contar_brazos.mjs');
    const d = await import(/* @vite-ignore */ 'file:///' + S + 'decidir_x.mjs');
    guiones = { secciones: q.secciones, veredicto: q.veredicto, casilla: b.casilla, TEXTOS: b.TEXTOS, decidirX: d.decidirX, N: d.N, MAX: d.MAX_INDECIDIBLES_PARA_ENTERRAR };
  } finally { process.argv = argv; }
  return guiones;
}

// ── 1 · LAS CITAS, POR LA PUERTA ─────────────────────────────────────────────────────────────────────────────────────────────
interface Trozo { chunkIndex: number; texto: string }
export interface Puerta { nor: (cita: string) => 'D' | 'a caballo' | null; cli: (cita: string) => boolean }
function lado(t: Trozo) {
  const chunk: StoredChunk = { chunkIndex: t.chunkIndex, chunkType: 'text', text: t.texto, sheetName: null, tableId: null, rowIndex: null, cells: null, columnOrder: null };
  const entregado = { texto: t.texto, trozos: [] as StoredChunk[] };
  const comprobador = comprobadorDeLado(verifyQuote, entregado, [chunk], null);
  const localizador = localizadorDeLado({ entregado, trozos: [chunk] });
  // Lo que la puerta da por bueno: la cita (o sin su glosa) o, si la recompuso, la frase real del ancla. null si la tira.
  return (cita: string): string | null => comprobarConRepliegues(comprobador, localizador, cita).verificada?.text ?? null;
}
export function puerta(g: Guiones, analizado: Trozo, candidato: Trozo): Puerta {
  const nor = lado(analizado), cli = lado(candidato);
  const P24 = normalize(g.TEXTOS.P24), P35 = normalize(g.TEXTOS.P35);
  const d0 = P24.indexOf(normalize(g.TEXTOS.FRASE_D)), d1 = d0 + normalize(g.TEXTOS.FRASE_D).length - 1;
  const a0 = P24.indexOf(normalize(g.TEXTOS.FRASE_A)), a1 = a0 + normalize(g.TEXTOS.FRASE_A).length - 1;
  if (d0 < 0 || a0 < 0) throw new Error('las frases de D y A no están en el párrafo, normalizadas');
  return {
    nor: cita => {
      const v = nor(cita); if (v === null) return null;
      const n = normalize(v), i = P24.indexOf(n);
      if (n.length < 20 || i < 0) return null;
      const tD = i <= d1 && i + n.length - 1 >= d0, tA = i <= a1 && i + n.length - 1 >= a0;
      return tD && tA ? 'a caballo' : tD ? 'D' : null;
    },
    cli: cita => { const v = cli(cita); if (v === null) return false; const n = normalize(v); return n.length >= 20 && P35.includes(n); },
  };
}

// ── 2 · EL LECTOR AMPLIO DE LA PREGUNTA 2 ───────────────────────────────────────────────────────────────────────────────────
const sinCitas = (s: string) => s.replace(/«[^»]*»|“[^”]*”|"[^"]*"/g, ' ');
// Las tildes SE QUEDAN: «sí» (afirmación) y «si» (condicional o pregunta indirecta: «hay que comprobar si se pueden cumplir») son
// palabras distintas, y quitarlas las confunde.
const plano = (s: string) => s.toLowerCase().replace(/[*_`#]/g, '');
const ADVERSATIVA = /(?<![\p{L}])(?:pero|sin embargo|no obstante)(?![\p{L}])/u;
const RESERVA = /(?<![\p{L}])(?:a primera vista|aparentemente|en apariencia|literalmente)(?![\p{L}])/u;
// «si se pueden cumplir» (sin tilde) es una condición o una pregunta indirecta, no un veredicto: no cuenta en ninguna polaridad.
const CUMPLIR_NO = /(?<![\p{L}])(?<!(?<![\p{L}])si )no (?:se pueden cumplir|pueden cumplirse)(?![\p{L}])/u;
const CUMPLIR = /(?<![\p{L}])(?<!(?<![\p{L}])si )(?<!(?<![\p{L}])si no )(?:se pueden cumplir|pueden cumplirse)(?![\p{L}])/u;
const SI_SUELTO = /^[\s,;:]*(?:en realidad,?\s*)?sí(?=[\s.,;:!]*$)/u;
export function frasesDeLaSeccion(sec: string): string[] {
  return plano(sinCitas(sec)).split(/\n+|(?<=[.;:!?])\s+/).map(f => f.trim()).filter(f => f && !f.endsWith('?'));
}
/** El veredicto de una frase por la vía de «cumplir», con el seguro. */
export function porCumplir(frase: string, cumplirAntes: boolean): Veredicto {
  const clausulas = frase.split(ADVERSATIVA);
  let v: Veredicto = null, hablo = cumplirAntes;
  clausulas.forEach((c, k) => {
    const tras = k > 0;
    if (RESERVA.test(c)) { if (CUMPLIR.test(c)) hablo = true; return; }
    if (CUMPLIR_NO.test(c)) { v = 'no'; hablo = true; return; }
    if (CUMPLIR.test(c)) { v = 'sí'; hablo = true; return; }
    if (tras && hablo && SI_SUELTO.test(c)) v = 'sí';
  });
  return v;
}
export function porHallazgo(frase: string): Veredicto {
  if (/(?<![\p{L}])no hay (?:ningún )?hallazgo(?![\p{L}])/u.test(frase)) return 'sí';
  if (/(?<![\p{L}])hay hallazgo(?![\p{L}])/u.test(frase)) return 'no';
  return null;
}
/** El lector aprobado decide primero. Si no decide, decide el amplio. Si el aprobado decide y una frase EXPLÍCITA de la sección
 *  («no hay hallazgo», «no se pueden cumplir»…) dice lo contrario, no decide: el aprobado lee «No hay hallazgo.» como «No», y en
 *  la pregunta 2 «no» es el hallazgo. Así el lector nuevo nunca da un positivo que la propia respuesta niega. */
export function lectorAmplio(g: Guiones, sec: string): Veredicto {
  const v0 = g.veredicto(sec, 2);
  let h: Veredicto = null, c: Veredicto = null, hablo = false;
  for (const f of frasesDeLaSeccion(sec)) {
    const vh = porHallazgo(f); if (vh) h = vh;
    const vc = porCumplir(f, hablo); if (vc) c = vc;
    if (CUMPLIR.test(f)) hablo = true;
  }
  if (h && c && h !== c) return null;
  const amplio = h ?? c;
  if (v0 !== null) return amplio !== null && amplio !== v0 ? null : v0;
  return amplio;
}

// ── LA REGLA (ii), CON LAS DOS PIEZAS NUEVAS ────────────────────────────────────────────────────────────────────────────────
const citas = (s: string) => [...s.matchAll(/«([^»]*)»|“([^”]*)”|"([^"]*)"/g)].map(m => m[1] ?? m[2] ?? m[3] ?? '');
export function clase(p: Puerta, sec: string, v: Veredicto, afirma: 'sí' | 'no'): Clase {
  if (v === null) return 'NADA';
  if (v !== afirma) return 'NIEGA';
  const cs = citas(sec), n = cs.map(p.nor), d = n.includes('D'), cab = n.includes('a caballo'), cli = cs.some(p.cli);
  if (d && cli) return 'D';                 // DECISIÓN 2 del 05/11: una D limpia vale aunque otra cita vaya a caballo
  if (!d && cab) return 'PARCIAL';
  if (d || cli) return 'PARCIAL';
  return 'OTRO';
}
export function contarUna(g: Guiones, p: Puerta, texto: string): { sale: boolean | null; clases: [Clase, Clase] } {
  const s = g.secciones(texto);
  if (!s) return { sale: null, clases: ['NADA', 'NADA'] };
  const c1 = clase(p, s.p1, g.veredicto(s.p1, 1), 'sí'), c2 = clase(p, s.p2, lectorAmplio(g, s.p2), 'no');
  return { sale: g.casilla(c1, c2), clases: [c1, c2] };
}
/** Un brazo con la forma que `decidirX` lee; un solo recuento en las dos casillas. */
export function brazoX2(g: Guiones, p: Puerta, pulsaciones: Array<Array<{ vez?: number; respuesta?: string; error?: string }>>) {
  const buenas: Array<{ id: string; r: ReturnType<typeof contarUna> }> = [], fallidas: string[] = [];
  pulsaciones.forEach((rs, k) => rs.forEach(x => {
    if (buenas.length >= g.N) return;
    const id = `pulsación ${k + 1}, vez ${x.vez}`;
    if (typeof x.respuesta !== 'string' || x.respuesta.trim() === '') fallidas.push(`${id}: ${x.error ?? 'texto vacío'}`);
    else buenas.push({ id, r: contarUna(g, p, x.respuesta) });
  }));
  const rec = { sale: buenas.filter(b => b.r.sale === true).length, ilegibles: buenas.filter(b => b.r.sale === null).map(b => `${b.id}: pregunta 1: ${b.r.clases[0]}; pregunta 2: ${b.r.clases[1]}`) };
  return { completas: buenas.length >= g.N, n: g.N, fallidas, producto: rec, ancla: rec };
}
```

`herramientas/instrumento_x2.test.ts` · huella `9b10b9fa58eac8e6`
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it, expect, beforeAll } from 'vitest';
import { S, cargar, puerta, lectorAmplio, porCumplir, contarUna, brazoX2, type Puerta } from './instrumento_x2';

// LAS PRUEBAS DEL INSTRUMENTO DE LA SIGUIENTE TANDA DE X (Code, 06/11/2026). Cada caso en una frontera, para que el diseño
// equivocado suspenda: los tres mutantes que pidió el arquitecto (no reconocer «hay hallazgo»; leer «se pueden cumplir» como
// positivo; y el decisivo, «a primera vista no se pueden cumplir, pero en realidad sí» → NEGATIVA) y los de la puerta. Y el
// CONTROL sobre las 42 de X: sólo cuántos indecidibles, nunca positivos (x2_control.txt). Esta tanda NO se recuenta.
const HUELLA_TROZOS = '18065fb25f057dc0';
type G = Awaited<ReturnType<typeof cargar>>;
let g: G, p: Puerta;
const T = JSON.parse(readFileSync(S + 'trozos_d.json', 'utf8'));
beforeAll(async () => {
  g = await cargar(HUELLA_TROZOS);
  p = puerta(g, { chunkIndex: T.analizado.trozo, texto: T.analizado.texto }, { chunkIndex: T.candidato.trozo, texto: T.candidato.texto });
});
const Q2 = (cuerpo: string) => `PREGUNTA 1 · EL DATO\nNo.\nPREGUNTA 2 · EL CUMPLIMIENTO\n${cuerpo}`;
const sec2 = (cuerpo: string) => g.secciones(Q2(cuerpo))!.p2;
// citas inventadas, literales de los trozos entregados
const NOR = '«figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»';
const CLI = '«nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones»';

describe('el lector amplio de la pregunta 2 (hallazgo = «no»)', () => {
  it('«HAY HALLAZGO.» → hallazgo (mutante: no reconocer «hay hallazgo»)', () => expect(lectorAmplio(g, sec2('Ambos son reglas.\nHAY HALLAZGO.'))).toBe('no'));
  it('«Sí, hay hallazgo.» → hallazgo (el lector aprobado lo quita a propósito; el amplio lo lee)', () => expect(lectorAmplio(g, sec2('Sí, hay hallazgo.'))).toBe('no'));
  it('«Por tanto, no hay hallazgo.» → no lo hay', () => expect(lectorAmplio(g, sec2('Lo he mirado con cuidado.\nPor tanto, no hay hallazgo.'))).toBe('sí'));
  it('«No hay hallazgo.» sola: el aprobado lee «No» (= hallazgo) y la frase dice lo contrario → NO DECIDE, nunca positivo', () =>
    expect(lectorAmplio(g, sec2('No hay hallazgo.'))).toBe(null));
  it('«hay que comprobar SI se pueden cumplir» (sin tilde) no es veredicto: con «HAY HALLAZGO» → hallazgo', () =>
    expect(lectorAmplio(g, sec2('Ambos son reglas, así que hay que comprobar si se pueden cumplir a la vez.\nHAY HALLAZGO.'))).toBe('no'));
  it('«Por tanto, se pueden cumplir las dos a la vez.» → NO hay hallazgo (mutante: leer «se pueden cumplir» como positivo)', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado con cuidado.\nPor tanto, se pueden cumplir las dos a la vez.'))).toBe('sí'));
  it('«Por tanto, no se pueden cumplir las dos a la vez.» → hallazgo', () => expect(lectorAmplio(g, sec2('Lo he mirado.\nPor tanto, no se pueden cumplir las dos a la vez.'))).toBe('no'));
  it('«Sí, ambos son reglas, y no se pueden cumplir.» → hallazgo (el «sí» de «son reglas» no es veredicto)', () =>
    expect(lectorAmplio(g, sec2('Sí, ambos son reglas, y no se pueden cumplir las dos a la vez.'))).toBe('no'));
  it('EL DECISIVO: «A primera vista no se pueden cumplir, pero en realidad sí.» → NEGATIVA', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado.\nA primera vista no se pueden cumplir, pero en realidad sí.'))).toBe('sí'));
  it('el decisivo, en dos frases: «A primera vista no se pueden cumplir. Pero en realidad sí.» → NEGATIVA', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado.\nA primera vista no se pueden cumplir. Pero en realidad sí.'))).toBe('sí'));
  it('la reserva sin adversativa: «Aparentemente no se pueden cumplir.» sola → no decide', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado.\nAparentemente no se pueden cumplir.'))).toBe(null));
  it('el orden inverso: «Literalmente, sí se pueden cumplir… Pero… Por tanto, no se pueden cumplir.» → hallazgo (manda la conclusión)', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado.\nLiteralmente, sí se pueden cumplir las dos.\nPero el principio no.\nPor tanto, no se pueden cumplir las dos a la vez.'))).toBe('no'));
  it('una pregunta no es veredicto: «¿Se pueden cumplir las dos a la vez?» sola → no decide', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado.\n¿Se pueden cumplir las dos a la vez?'))).toBe(null));
  it('«la sustitución sí puede cumplirse» (singular, una regla) no es veredicto del par', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado.\nLa sustitución sí puede cumplirse.'))).toBe(null));
  it('las dos vías discrepan («hay hallazgo» y «se pueden cumplir las dos») → no decide', () =>
    expect(lectorAmplio(g, sec2('Lo he mirado.\nHay hallazgo.\nPor tanto, se pueden cumplir las dos.'))).toBe(null));
  it('lo que el lector aprobado ya decide no cambia: «No.» → hallazgo; «Sí, se pueden cumplir» → no', () => {
    expect(lectorAmplio(g, sec2('No.'))).toBe('no');
    expect(lectorAmplio(g, sec2('Sí, se pueden cumplir las dos a la vez.'))).toBe('sí');
  });
  it('porCumplir: una cláusula con reserva sola no da veredicto, y un «sí» suelto sin hablar antes de cumplir tampoco', () => {
    expect(porCumplir('aparentemente no se pueden cumplir', false)).toBe(null);
    expect(porCumplir('pero en realidad sí', false)).toBe(null);
    expect(porCumplir('pero en realidad sí', true)).toBe('sí');
    expect(porCumplir('pero en realidad si', true)).toBe(null); // sin tilde no es afirmación
  });
});

describe('las citas, por la puerta del producto', () => {
  it('literal: el permiso → D; CLI-12 del §3.5 → sí', () => { expect(p.nor(NOR.slice(1, -1))).toBe('D'); expect(p.cli(CLI.slice(1, -1))).toBe(true); });
  it('normalizada: con puntos suspensivos delante → sí (mutante: sin la normalización de la puerta)', () =>
    expect(p.cli('...nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones')).toBe(true));
  it('glosa: «figura [del centro] que puede recaer en el propio Director Clínico» → D (mutante: sin la glosa)', () =>
    expect(p.nor('figura [del centro] que puede recaer en el propio Director Clínico o en otro profesional designado por él')).toBe('D'));
  it('tramo: dos tramos literales de la frase del permiso empalmados → D, por la frase real (mutante: sin el tramo)', () =>
    expect(p.nor('profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo, Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer')).toBe('D'));
  it('la puerta tira: una paráfrasis → nada; y glosa con palabra cambiada fuera del corchete → nada (el resto no es literal)', () => {
    expect(p.nor('figura que podría recaer en el propio Director Clínico o en cualquier otro profesional')).toBe(null);
    expect(p.nor('la figura [de Coordinador de Calidad] puede recaer en el propio Director Clínico')).toBe(null);
  });
  it('el mínimo de 20 de SQL_34_06 del lado de NOR-10: «puede recaer» (12, que la puerta, con su mínimo de 10, sí deja pasar) → nada', () =>
    expect(p.nor('puede recaer')).toBe(null));
  it('la frase de A sola → nada; las dos frases → a caballo', () => {
    expect(p.nor('El Coordinador de Calidad no sustituye al Director Clínico en la responsabilidad última')).toBe(null);
    expect(p.nor('experiencia diaria del centro. El Coordinador de Calidad no sustituye al Director Clínico')).toBe('a caballo');
  });
  it('del lado de CLI-12, una frase del trozo fuera del §3.5 no cuenta, y menos de 20 caracteres tampoco', () => {
    expect(p.cli('del propio centro')).toBe(false);
    expect(p.cli('El organigrama de calidad descrito en este apartado se revisa cada vez que se incorpora una nueva clínica')).toBe(false);
  });
});

describe('la regla (ii) entera, con las dos piezas', () => {
  it('la 2 dice «HAY HALLAZGO» con las dos citas → sale', () => expect(contarUna(g, p, Q2(`HAY HALLAZGO. ${NOR} ${CLI}`)).sale).toBe(true));
  it('la 2 dice «HAY HALLAZGO» con una sola cita → indecidible (PARCIAL)', () => expect(contarUna(g, p, Q2(`HAY HALLAZGO. ${NOR}`)).sale).toBe(null));
  it('la 2 dice «a primera vista no se pueden cumplir, pero en realidad sí» con las dos citas → NO sale', () =>
    expect(contarUna(g, p, Q2(`Lo he mirado.\nA primera vista no se pueden cumplir, pero en realidad sí. ${NOR} ${CLI}`)).sale).toBe(false));
});

describe('el CONTROL sobre las 42 de X (no las recuenta: sólo cuenta indecidibles)', () => {
  it('cuántos indecidibles deja el instrumento nuevo; el boceto dijo 0', () => {
    const ps = ['x_pulsacion1.json', 'x_pulsacion2.json'].map(f => JSON.parse(readFileSync(S + f, 'utf8')).respuestas);
    const b = brazoX2(g, p, ps);
    writeFileSync(S + 'x2_control.txt', [`completas: ${b.completas} · fallidas: ${b.fallidas.length}`, `indecidibles: ${b.producto.ilegibles.length}`, ...b.producto.ilegibles.map(i => `   ${i}`)].join('\n') + '\n');
    expect(b.completas).toBe(true);
  });
});
```

`mutar_x2.mjs` · huella `8b8d5c8a1588391d`
```js
// Herramienta de un solo uso (06/11): los MUTANTES del instrumento de la siguiente tanda de X. Cada mutante cambia UNA cosa de
// herramientas/instrumento_x2.ts (la sustitución tiene que casar exactamente una vez), corre sus pruebas y restaura el original,
// comprobando la huella al final. Un mutante que no pone ninguna prueba en rojo es un diseño equivocado que las pruebas no ven.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
const S = 'C:/Users/beaz8/AppData/Local/Temp/claude/E--Doc-Hub/914469ea-1369-4763-8e6a-9aadf9158516/scratchpad/';
const F = S + 'herramientas/instrumento_x2.ts';
const original = readFileSync(F, 'utf8');
const huella = s => createHash('sha256').update(s).digest('hex').slice(0, 16);
const MUTANTES = [
  ['1 · no reconocer «hay hallazgo» (pedido)', `if (/(?<![\\p{L}])hay hallazgo(?![\\p{L}])/u.test(frase)) return 'no';`, ``],
  ['2 · leer «se pueden cumplir» como positivo (pedido)', `if (CUMPLIR.test(c)) { v = 'sí';`, `if (CUMPLIR.test(c)) { v = 'no';`],
  ['3 · EL DECISIVO: sin la cláusula tras la adversativa (pedido)', `const clausulas = frase.split(ADVERSATIVA);`, `const clausulas = [frase];`],
  ['4 · sin la reserva («a primera vista»…)', `if (RESERVA.test(c)) {`, `if (false) {`],
  ['5 · sin el «sí» suelto tras la adversativa', `if (tras && hablo && SI_SUELTO.test(c)) v = 'sí';`, ``],
  ['6 · «si se pueden cumplir» (condición) cuenta como veredicto', `(?<!(?<![\\p{L}])si )(?<!(?<![\\p{L}])si no )(?:se pueden cumplir`, `(?:se pueden cumplir`],
  ['7 · el aprobado manda aunque la respuesta diga lo contrario', `return amplio !== null && amplio !== v0 ? null : v0;`, `return v0;`],
  ['8 · sin el desacuerdo entre las dos vías', `if (h && c && h !== c) return null;`, ``],
  ['9 · el amplio antes que el aprobado', `if (v0 !== null) return amplio !== null && amplio !== v0 ? null : v0;\n  return amplio;`, `return amplio ?? v0;`],
  ['10 · las citas sin la puerta: literal en el trozo', `return (cita: string): string | null => comprobarConRepliegues(comprobador, localizador, cita).verificada?.text ?? null;`, `return (cita: string): string | null => (t.texto.includes(cita) ? cita : null);`],
  ['11 · la puerta sin repliegues (ni glosa ni tramo)', `comprobarConRepliegues(comprobador, localizador, cita).verificada?.text ?? null;`, `comprobador.comprobar(cita)?.text ?? null;`],
  ['12 · la puerta sin el tramo', `comprobarConRepliegues(comprobador, localizador, cita)`, `comprobarConRepliegues(comprobador, null, cita)`],
  ['13 · sin el mínimo de 20', `if (n.length < 20 || i < 0) return null;`, `if (i < 0) return null;`],
  ['14 · sin «a caballo»', `return tD && tA ? 'a caballo' : tD ? 'D' : null;`, `return tD ? 'D' : null;`],
  ['15 · CLI-12 en cualquier sitio del trozo, no sólo en el §3.5', `return n.length >= 20 && P35.includes(n); },`, `return n.length >= 20; },`],
  ['16 · la regla (ii) cuenta PARCIAL como sale', `if (d || cli) return 'PARCIAL';`, `if (d || cli) return 'D';`],
];
const rojo = [];
try {
  for (const [nombre, de, a] of MUTANTES) {
    const n = original.split(de).length - 1;
    if (n !== 1) { console.log(`NO CASA (${n}): ${nombre}`); rojo.push(null); continue; }
    writeFileSync(F, original.replace(de, a));
    let salida = '';
    try { salida = execSync(`npx vitest run --config ${S}vitest.herramientas.mts instrumento_x2`, { cwd: 'E:/Doc-Hub', encoding: 'utf8', stdio: 'pipe' }); }
    catch (e) { salida = (e.stdout ?? '') + (e.stderr ?? ''); }
    const m = salida.match(/Tests\s+(?:(\d+) failed)?/);
    const fallan = m && m[1] ? Number(m[1]) : 0;
    console.log(`${fallan > 0 ? 'ROJO ' : 'VIVO '} · ${nombre} · ${fallan} pruebas en rojo`);
    rojo.push(fallan > 0);
  }
} finally {
  writeFileSync(F, original);
  // EL ÚLTIMO EN ESCRIBIR x2_control.txt TIENE QUE SER EL ORIGINAL: la prueba de control lo reescribe en cada corrida, y la
  // primera vez lo dejó escrito el mutante 16 (0 indecidibles, porque contaba PARCIAL como «sale»). Se vuelve a correr el original.
  try { execSync(`npx vitest run --config ${S}vitest.herramientas.mts instrumento_x2`, { cwd: 'E:/Doc-Hub', stdio: 'pipe' }); }
  catch { console.log('EL ORIGINAL NO PASA SUS PRUEBAS al volver a correrlo'); }
}
console.log(`mutantes en rojo: ${rojo.filter(x => x).length} de ${MUTANTES.length} · original restaurado: ${huella(readFileSync(F, 'utf8')) === huella(original)}`);
```

`herramientas/correr_x2.test.ts` · huella `365f11660d0b588a`
```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { it } from 'vitest';
import { S, cargar, puerta, brazoX2 } from './instrumento_x2';

// EL QUE CORRE LA SIGUIENTE TANDA DE X CON EL INSTRUMENTO APROBADO (instrumento_x2.ts, 203bb5dde2e3bee8), EN DOS TIEMPOS (Code,
// 09/11/2026). No cuenta nada por su cuenta: llama a brazoX2 y a decidirX. Sólo corre si se le pide (X2_PARTE), para que la suite
// de herramientas no lo dispare.
//   X2_FICHEROS=pulsación1.json,pulsación2.json[,pulsación3.json] X2_PARTE=1 → x2_parte1.txt: fallidas, indecidibles y banda.
//   X2_PARTE=2 → x2_parte2.txt: los positivos, la decisión y, si no decide, la tasa con su Wilson (añadido del arquitecto del 09/11).
// ⚠️ CADA SALIDA EMPIEZA POR LAS HUELLAS DE LO QUE LA ESCRIBIÓ (regla del 09/11: una salida de control no vale si no consta qué
// versión la escribió).
const huella = (f: string) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 16);
const wilson = (k: number, n: number, z = 1.959964) => {
  const p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - m) / d, (c + m) / d];
};
const pc = (x: number) => (100 * x).toFixed(1).replace('.', ',') + ' %';
const PARTE = process.env.X2_PARTE;
it.runIf(PARTE === '1' || PARTE === '2')(`X2, parte ${PARTE}`, async () => {
  const T = JSON.parse(readFileSync(S + 'trozos_d.json', 'utf8'));
  const g = await cargar('18065fb25f057dc0');
  const p = puerta(g, { chunkIndex: T.analizado.trozo, texto: T.analizado.texto }, { chunkIndex: T.candidato.trozo, texto: T.candidato.texto });
  const ficheros = (process.env.X2_FICHEROS ?? '').split(',').filter(Boolean);
  const b = brazoX2(g, p, ficheros.map(f => JSON.parse(readFileSync(f, 'utf8')).respuestas));
  const L = [
    `ESCRITO POR: instrumento_x2.ts ${huella(S + 'herramientas/instrumento_x2.ts')} · correr_x2.test.ts ${huella(S + 'herramientas/correr_x2.test.ts')} · trozos_d.json ${huella(S + 'trozos_d.json')}`,
    `FICHEROS: ${ficheros.map(f => `${f.split(/[\\/]/).pop()} ${huella(f)}`).join(' · ')}`,
    `1 · LAS FALLIDAS: ${b.fallidas.length}${b.fallidas.length ? ' — ' + b.fallidas.join(' · ') : ''}`,
  ];
  if (!b.completas) L.push(`NO PUNTUABLE: faltan respuestas buenas para ${b.n}; se pulsa una tercera vez y se cuenta en orden.`);
  else if (PARTE === '1') {
    L.push(`2 · LOS INDECIDIBLES, ANTES QUE NINGÚN POSITIVO: ${b.producto.ilegibles.length} de ${b.n}`, ...b.producto.ilegibles.map(i => `   ${i}`));
    L.push(`3 · LA BANDA DISPONIBLE: construir con ${24} o más (techo: ${b.n - b.producto.ilegibles.length} puntuables); enterrar ${b.producto.ilegibles.length <= g.MAX ? 'SÍ' : `NO (más de ${g.MAX} indecidibles)`}`);
  } else {
    const d = g.decidirX(b);
    const [lo, hi] = wilson(b.producto.sale, b.n);
    L.push(`4 · LOS POSITIVOS: ${b.producto.sale} de ${b.n} (indecidibles ${b.producto.ilegibles.length}, contados como fallo)`);
    L.push(`5 · DECISIÓN: ${d.decision} — ${d.motivo}`);
    if (d.decision !== 'CONSTRUIR' && d.decision !== 'ENTERRAR')
      L.push(`6 · NO ES UNA DECISIÓN, ES UN DATO (prerregistrado el 09/11): tasa de D bajo la pregunta cerrada con el instrumento completo, ${b.producto.sale} de ${b.n} = ${pc(b.producto.sale / b.n)}, Wilson del ${pc(lo)} al ${pc(hi)}`);
  }
  writeFileSync(S + `x2_parte${PARTE}.txt`, L.join('\n') + '\n');
}, 120_000);
```

### ACERTAR POR EL MOTIVO EQUIVOCADO, Y EL QUINTO CON LA COTA CORREGIDA (arquitecto y Code, 09/11/2026)
- **Una clase aparte** (arquitecto): las tres veces que el lector aprobado acertó por casualidad (condición 1, vez 11; X, pulsación 2,
  veces 12 y 17). **El veredicto era correcto y el camino no.** El juez afirmaba el hallazgo en una línea que el lector no mira, y el
  lector tomó como veredicto un «No he encontrado otros pares…» del final.
- **Dos de los 22 positivos de X se alcanzaron así**, y también están entre los 26 por ancla. Lo comprobó Code con el guion aprobado:
  las veces 12 y 17 de la pulsación 2 salen «sale» en los dos recuentos, con la pregunta 1 en NIEGA y la 2 en D. El número sigue
  siendo correcto, porque el juez sí afirmaba. X es «no decide» y no sostiene nada, así que se apunta y no se replantea.
- **La regla** sale de aquí y va a `CLAUDE.md`, fundida con «una observación no es prueba si la hipótesis contraria habría dado la
  misma observación»: un acierto por el camino equivocado no es un acierto del instrumento.
- **El quinto con la cota corregida** (aritmética del arquitecto, comprobada por Code con el Fisher del guion aprobado):
  - 12 de 21 contra 9 de 21: p = 0,5377, que no cambia;
  - la cota alta pasa de 16 (p = 0,0578) a 15 (p = 0,1180).

  **La corrección refuerza la conclusión del arquitecto** (el quinto se aleja de la significación), y por eso se comprobó antes de
  aceptarla.

### X · LA SEGUNDA TANDA, CON EL INSTRUMENTO APROBADO: NO DECIDE (09/11/2026)
**Las fugas, al registro**: el director pegó las 42 respuestas en bruto al arquitecto y a Code. El arquitecto lo declaró antes de
pedir nada. Code las tuvo delante en el mensaje y no contó positivos a mano: el recuento sale sólo del corredor aprobado.
**La metadata, comprobada por script** (`extraer_x2.mjs`) antes de contar:
- la misma `medida` y el mismo modelo, y la misma pareja en las 42;
- 21 + 21 respuestas con texto, todas con `ok`, 200, intento 1 y `sinEtapa` 0;
- 15:39:31 y 15:42:37 UTC, 186,8 s entre arranques;
- **4.155 tokens de entrada en las 84 llamadas, las 42 del 06/11 y las 42 de hoy, sin excepción**: el prompt es idéntico al de la
  tanda que no decidió, y entre una y otra sólo cambió el instrumento de cuenta.

Las salidas, en `claude/Medida_F130_X2_D_Sembrada_Pulsacion_{1,2}_09-11-2026.json`.

**PRIMER TIEMPO, la parte 1 del corredor, literal:**
```
ESCRITO POR: instrumento_x2.ts 203bb5dde2e3bee8 · correr_x2.test.ts 365f11660d0b588a · trozos_d.json 18065fb25f057dc0
FICHEROS: x2_pulsacion1.json a90a0ff607b63ca9 · x2_pulsacion2.json e4627e4158646b22
1 · LAS FALLIDAS: 0
2 · LOS INDECIDIBLES, ANTES QUE NINGÚN POSITIVO: 8 de 42
   pulsación 1, vez 5: pregunta 1: NIEGA; pregunta 2: PARCIAL
   pulsación 1, vez 8: pregunta 1: NIEGA; pregunta 2: PARCIAL
   pulsación 1, vez 11: pregunta 1: NIEGA; pregunta 2: NADA
   pulsación 1, vez 13: pregunta 1: NIEGA; pregunta 2: NADA
   pulsación 2, vez 6: pregunta 1: NIEGA; pregunta 2: NADA
   pulsación 2, vez 15: pregunta 1: NIEGA; pregunta 2: NADA
   pulsación 2, vez 18: pregunta 1: NIEGA; pregunta 2: NADA
   pulsación 2, vez 21: pregunta 1: NIEGA; pregunta 2: NADA
3 · LA BANDA DISPONIBLE: construir con 24 o más (techo: 34 puntuables); enterrar NO (más de 3 indecidibles)
```

**LO FIJADO POR EL ARQUITECTO ANTES DEL NÚMERO, con su regla**, literal (sacado del registro con un script). Code comprobó sus
cifras con el Fisher del guion y en binomial exacta: Fisher p = 0,3502; Wilson del 3,8 al 22,1 % y del 10,0 al 33,3 %; y
0,03 %, 55,45 %, 93,80 % y 99,97 %. Todas cuadran.

> **EL CONTROL NO SE EQUIVOCÓ. ME EQUIVOQUÉ YO AL USARLO.**
>
> 4 de 42 contra 8 de 42: **Fisher p = 0,3502. No se distinguen.** Los dos son muestras compatibles con la misma tasa de fondo. Y la clave está en los intervalos, que yo nunca calculé:
>
> ```
> 4 de 42  =  9,5 %   Wilson  3,8 % – 22,1 %
> 8 de 42  = 19,0 %   Wilson 10,0 % – 33,3 %
> ```
>
> **El control decía «4», y su propio intervalo iba del 3,8 % al 22,1 % — o sea, de 2 a 9 indecidibles en una tanda de 42.** Yo cogí el 4 como si fijara el techo y calculé un 86,31 % de potencia sobre él. **Si hubiera calculado ese intervalo el viernes, habría sabido que el techo podía caer en cualquier parte entre 0 y 9**, y que la potencia iba con él.
>
> **Al registro, con fecha de hoy, y la regla que sale:** «Una tasa medida sobre una muestra no fija un techo para la siguiente: lo fija su intervalo. Un techo derivado de una estimación puntual hereda su incertidumbre, y hay que escribir la potencia como un rango, no como una cifra.» Es la tercera cara de «una cifra no viaja con un adjetivo que no se ha medido»: aquí el adjetivo no medido era **«el techo es 4»**.
>
> ═══ LO QUE QUEDA FIJADO, ANTES DEL NÚMERO ═══
> Con 34 puntuables y el corte en 24 sobre 42:
>
> ```
> P(>= 24 | tasa 40 %)  =  0,03 %    <- construir sigue siendo seguro
> P(>= 24 | tasa 70 %)  = 55,45 %    <- una moneda al aire
> P(>= 24 | tasa 80 %)  = 93,80 %
> P(>= 24 | tasa 90 %)  = 99,97 %
> ```
>
> - **CONSTRUIR si llega a 24.** Su error no se ha movido: 0,03 %. Si sale, vale.
> - **Cualquier otro número: «no decide»**, y se informa la tasa entre las 34 puntuables con su Wilson, como estaba declarado desde antes de pulsar.
> - **Enterrar no está disponible.** Por el tope de 3, que no muevo.
>
> **Y lo que significará cada salida, escrito ahora para no interpretarlo después:**
> - **Un «construir» querrá decir que la tasa está en el 70 % o por encima, y probablemente más**, porque a 80 % este test acierta el 93,8 % de las veces y a 70 % sólo el 55,5 %.
> - **Un «no llega a 24» NO distinguirá el 70 % del 50 %.** A esa potencia, no llegar es compatible con que la pasada 2 sirva. Así que «no decide» significará exactamente eso, y **no se leerá como una pista en contra.**

**SEGUNDO TIEMPO, la parte 2 del corredor, literal:**
```
ESCRITO POR: instrumento_x2.ts 203bb5dde2e3bee8 · correr_x2.test.ts 365f11660d0b588a · trozos_d.json 18065fb25f057dc0
FICHEROS: x2_pulsacion1.json a90a0ff607b63ca9 · x2_pulsacion2.json e4627e4158646b22
1 · LAS FALLIDAS: 0
4 · LOS POSITIVOS: 22 de 42 (indecidibles 8, contados como fallo)
5 · DECISIÓN: NO DECIDE — por debajo del 24, pero con 8 indecidibles (más de 3) enterrar no está disponible: el motivo es el instrumento, no el fenómeno
6 · NO ES UNA DECISIÓN, ES UN DATO (prerregistrado el 09/11): tasa de D bajo la pregunta cerrada con el instrumento completo, 22 de 42 = 52,4 %, Wilson del 37,7 % al 66,6 %
```
- **22 de 42**: de las 34 puntuables, salen 22 y niegan 12. **NO DECIDE**: no llega a 24, y enterrar no está disponible.
- ⚠️ **EL DENOMINADOR DEL DATO, PENDIENTE DEL ARQUITECTO**: el corredor aprobado informa la tasa sobre 42, con los indecidibles como
  fallo (52,4 %, Wilson del 37,7 al 66,6 %). El arquitecto escribió hoy «la tasa entre las 34 puntuables», que sería 22 de 34
  (64,7 %, Wilson del 47,9 al 78,5 %). El prerregistro del 09/11 no fija el denominador. Se archivan las dos; elige el arquitecto.

**LA LECTURA DE CODE DE LOS 8 INDECIDIBLES, DESPUÉS DE LOS POSITIVOS. ESTA TANDA NO SE RECUENTA: es para diseñar la siguiente**
(`herramientas/lectura_x2.test.ts`, `x2_lectura.txt`):
- **Los 2 PARCIAL** (pulsación 1, veces 5 y 8) son la misma familia que los 4 del control: el juez reescribe el comienzo de la frase
  del permiso, «la figura [de Coordinador de Calidad] puede recaer…» y «[el Coordinador de Calidad] es una figura que puede
  recaer…», y la puerta del producto la tira. Del lado de CLI-12 las dos citas pasan.
- **Los 6 NADA son todos fallos del LECTOR, no del juez.** En los seis el juez afirma el hallazgo, y en los seis las citas pasan la
  puerta por los dos lados (NOR-10 en D y CLI-12 en el §3.5). Las formas que el lector amplio no acepta:
  - **«Hallazgo: …» o «hallazgo, …» sin «hay»**, y «hay conflicto»: pulsación 1, veces 11 y 13; pulsación 2, vez 6;
  - **una reserva que no está en la lista**: «vista solo como reglas, las dos sí pueden cumplirse», junto a «sí, hay hallazgo»
    (pulsación 2, vez 15). Las dos vías discrepan, y no decide;
  - **el aprobado lee «Sí son reglas…» como veredicto negativo**: pulsación 2, veces 18 y 21. El amplio encuentra «no se pueden
    cumplir…», el seguro de la contradicción deja la respuesta sin decidir, y **no la cuenta como negativa**. Sin ese seguro, las dos
    habrían sido falsos negativos.
- **El instrumento sigue siendo el factor que decide la tanda, no el fenómeno**: lo que falta en el lector es vocabulario de
  hallazgo («hallazgo:» sin «hay», «hay conflicto») y la lista de reservas, y el defecto del «Sí, son reglas» del aprobado ya no es
  sólo latente.

### TRAS LA SEGUNDA TANDA DE X: LOS DOS DENOMINADORES, Y EL CAMBIO DE DISEÑO DEL DIRECTOR (arquitecto y Code, 09/11/2026)
- **EL DATO SE INFORMA CON LOS DOS DENOMINADORES, etiquetados, porque contestan preguntas distintas** (arquitecto):
  - **sobre 42: 52,4 %**, Wilson del 37,7 al 66,6 %. Es la tasa que alcanzaría el PRODUCTO, porque lo ilegible no se publica;
  - **sobre 34: 64,7 %**, Wilson del 47,9 al 78,5 %. Es la tasa del JUEZ cuando se le puede leer.
- **AL REGISTRO, DEFECTO DEL ARQUITECTO EN EL PRERREGISTRO DEL 09/11**: decía «la tasa con su Wilson» y no fijaba el denominador. Es
  un defecto del prerregistro, no del resultado. No se eligió el denominador después de ver el número: van los dos.
- **LA REGLA DEL TECHO, A `CLAUDE.md`** (arquitecto): una tasa medida sobre una muestra no fija el techo de la siguiente; lo fija
  su intervalo.
- **EL CAMBIO DE DISEÑO, DEL DIRECTOR**: se deja de arreglar el lector y se resuelve en la pregunta. **Se mantiene la prosa y se
  añade una ÚLTIMA LÍNEA OBLIGATORIA de veredicto, y el lector lee sólo esa línea.** El arquitecto descarta las otras dos vías:
  - un traductor, porque es otra llamada al modelo, con su coste y su propia tasa de error que habría que medir;
  - seguir arreglando el lector, porque es un problema sin fondo: «Hallazgo:» sin «hay», «hay conflicto», reservas nuevas…

  Y lo decide que **el producto pedirá formato de todas formas**: la especificación de Fable tiene un paso de formato. **La
  siguiente tanda será una línea base nueva**: los 22 de 42 de los dos días no se arrastran, y el prerregistro llevará el techo como
  intervalo.
- **CÓMO LEE HOY EL PRODUCTO AL JUEZ** (Code, contra el código):
  - **en JSON, no en prosa.** El prompt del juez termina con «Responde con este JSON (sin bloques de código, sin texto adicional)»
    (`lib/analysis/judge.ts:927`), y la llamada es `callLLMJson` (`judge.ts:942`);
  - el cliente añade un sufijo estricto de «sólo JSON» (`lib/llm/anthropic-client.ts:373`), y lo lee con `tryParseJson`, que
    sanea y repara el JSON cortado (`:302-357`);
  - **es JSON pedido por instrucción, no un esquema forzado por la API**: el cliente no usa herramientas ni formato de respuesta;
  - **que haya hallazgo no se lee de un sí o un no: es que haya un elemento en `contradictions`.**

  **El problema de la prosa es, pues, del medidor y no del producto.**

### LA TANDA CON LA LÍNEA DE HALLAZGO: LO QUE YA ESTÁ PRERREGISTRADO ANTES DE ESCRIBIR LA HERRAMIENTA (arquitecto y Code, 09/11/2026)
**LA FRASE QUE TIENE QUE SOBREVIVIR A TODO LO QUE SALGA DE AQUÍ** (arquitecto, con sus palabras): **X mide la capacidad del juez sobre
la pareja aislada de D bajo una pregunta cerrada, no la tasa a la que el producto encuentra D. Nadie cita la cifra de X como tasa del
producto.**

**El techo, como intervalo** (`techo_intervalo.mjs`, huella `4ff4ebcc536f90b2`): enterrar está disponible el 64,7 % de las veces con la
tasa observada de PARCIAL (6 de 84), y entre el 11,6 % y el **95,0 %** con los extremos de su Wilson. **El arquitecto había escrito
95,1 %, calculado en la conversación y sin huella; adopta el 95,0 % del script.**

**Las reglas del lector de la línea, con sus contadores; la retirada del arquitecto y el diseño de las dos rutas; y las dos cosas para el
prerregistro**, literales (sacadas del registro de la conversación con un script):

> ═══ CAMBIO 3 · LO QUE EXIGE EL LECTOR, Y QUE CADA FALLO TENGA SU CONTADOR ═══
> Cuatro reglas, y las tres primeras con **contador propio y nombre propio en la salida**:
> - Se lee **la ÚLTIMA aparición** de cada línea, no la primera.
> - La misma línea dos veces con valores distintos → `contradiccion_de_linea`, ILEGIBLE.
> - Copia literal del hueco → `plantilla_copiada`, ILEGIBLE.
> - **Línea ausente → NADA en esa pregunta**, la categoría de hoy, para que la regla (ii) no se toque ni un carácter.
>
> **Que cada uno se imprima con su nombre, no sumado al total de ilegibles.** Un ilegible sin motivo es un ilegible que no sabremos arreglar la vez siguiente.

> ═══ Y AHORA EL DEFECTO MÍO, QUE ES EL QUE IMPORTA ═══
> Yo escribí «la línea arregla los NADA y no arregla los PARCIAL». **Eso da por supuesto que la línea sólo toca la legibilidad, y no lo sé.** Pedir un veredicto final puede hacer al juez más decidido: la tanda nueva puede diferir **en lo que concluye**, no sólo en lo que podemos leer. **Retiro esa implicación.**
>
> Y el confundido no se deshace mirando el resultado: 22 de 42 bajo un prompt y otra cifra bajo otro prompt no se pueden comparar si además han cambiado las parejas de ocasión.
>
> **Lo que lo separa es barato: correr la ruta `d` (la de hoy, congelada) y la ruta `d2` sobre LAS MISMAS parejas en la misma sesión.** Entonces la diferencia entre las dos ES el prompt y nada más. Dos pulsaciones, mismo par, mismas veces.

> ═══ DOS COSAS MÁS PARA EL PRERREGISTRO ═══
> 1. **Lector secundario, declarado antes de pulsar:** el lector de prosa corre también sobre el texto archivado de `d2`, **se registra y no sustituye nunca.** El dato son las líneas. El secundario es observación.
> 2. **Una frase que tiene que sobrevivir a todo lo que salga de aquí:** X mide **la capacidad del juez sobre la pareja aislada de D bajo una pregunta cerrada**, no la tasa a la que el producto encuentra D. **Nadie cita la cifra de X como tasa del producto.** Ponla en el fichero con esas palabras.

**QUÉ ES EL 42, Y CUÁNTO CUESTA** (Code, leído del código y de lo archivado):
- **El 42 es UNA sola pareja, 21 veces por pulsación, en dos pulsaciones.** La pareja es `PAREJA_DE_D` (NOR-10·4 ↔ CLI-12·6,
  `medida-f130.ts:166`) y las 21 veces son `VECES_DE_D` (`:167`). La ruta arma un solo prompt y lo manda 21 veces
  (`d/route.ts:53`).
- **No hay «parejas de ocasión»: las 42 llamadas son la misma pareja con el mismo prompt.** Lo que puede cambiar entre dos días no es
  la pareja: es el día, o sea el modelo que haya detrás. Correr `d` y `d2` en la misma sesión separa el prompt de eso.
- **El coste por llamada**, medido sobre las 84 llamadas archivadas (06/11 y 09/11) con los precios de Haiku 5.5 del repositorio
  (`lib/observability/llm-pricing.ts:36-41`: 0,10 $ el millón de entrada y 0,50 $ el de salida):
  - entrada fija de 4.155 tokens, unos 0,00042 $;
  - salida media de 3.337 tokens (de 1.937 a 4.855), unos 0,00167 $;
  - en total, **unos 0,0021 $ por llamada**, de 0,0014 a 0,0028 $. El 0,00213 $ del arquitecto cae dentro.
- **Las dos rutas, `d` y `d2`, a 42 llamadas cada una: 84 llamadas, unos 0,18 $.** La plantilla de `d2` es algo más larga y
  añade unos céntimos de milésima por llamada. **Es calderilla.**
