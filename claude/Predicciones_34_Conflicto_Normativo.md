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
