# MEDIDA F-130 · SEMANA 0: E3 Y LA VECINDAD (P-F130-9) · 29/10/2026

*Escrito por Code el 29/10/2026. Las cifras y la lectura son del arquitecto, leídas en los dos JSON que devolvió la
herramienta temporal `app/api/admin/medida-f130/`, pulsada por el director. Cuando se escribió, Code no había visto los
JSON; llegaron después, están archivados al lado y las cifras se comprobaron contra ellos (sección siguiente). La lectura
sigue siendo del arquitecto.*

## Los dos JSON, literales

**ARCHIVADOS el 29/10/2026**, pegados por el director (los encargos anteriores no los traían), en dos ficheros al lado de
éste:
- `claude/Medida_F130_Vecindad_29-10-2026.json`, pulsado a las 12:04 UTC;
- `claude/Medida_F130_E3_Primera_Tanda_29-10-2026.json`, pulsado a las 12:05 UTC: las dos parejas, siete veces cada una.
  *Code compactó el bloque «registro» a una línea por petición: mismos valores, sólo cambian los espacios.*

**Comprobado por Code contra los dos JSON** (las cifras de abajo, del arquitecto, salen de ellos): correspondencia «igual»
en los tres trozos; puestos 4 y 3 desde NOR-10·4, 2 desde CLI-12·3 y 1 desde CLI-12·6; §3.1, «sí» a la pregunta 2 en las
vueltas 2 y 3 (5 de 7); §3.5, «sí» en la vuelta 1 (6 de 7); 54.677 tokens de entrada y 44.667 de salida en 14 llamadas;
latencias de 8.312 a 20.716 ms; salida máxima, 4.232, el 26,4 % del tope; y un solo id de pareja en las catorce.
Parámetros de las catorce: `maxTokens` 16.000, `temperatura` «sin_enviar», `esfuerzo` «medium».

**Un dato del JSON que el mensaje del arquitecto no traía** (Code, transcrito; no se interpreta): en la pareja de §3.5,
el fallo de la vuelta 1 se apoya en que §3.1 no está en el material entregado: «El 3.5 menciona "la separación de funciones
descrita en el apartado 3.1", pero el contenido de ese apartado no aparece en los textos. Para decir que el 2.4 contradice
ese principio tendría que suponer qué establece el 3.1, y eso no está permitido.» Y las vueltas 2, 3, 4 y 6, que sí
dispararon, lo anotan como limitación.

## E3 · la pregunta cerrada, primera tanda

**LA CONDICIÓN QUE EL ARQUITECTO FIJÓ ANTES DE MEDIR NO SE CUMPLIÓ.** La pareja de §3.1, NOR-10·4 ↔ CLI-12·3, dio **5 de
7**, y la condición era 6 de 7 o más. La pareja de §3.5, NOR-10·4 ↔ CLI-12·6, dio **6 de 7**. **Nada se construye.**

**La causa, en palabras del modelo** (vueltas 2 y 3 de la pareja de §3.1, literales según el arquitecto):
- «Ambos textos son reglas, pero regulan la misma cosa, así que el conflicto ya queda recogido en la pregunta 1 y no se
  cuenta como hallazgo de cumplimiento. Ambas frases citadas en la 1 son las mismas que habría que usar aquí.»
- «el conflicto que encuentro se apoya en el mismo par de frases que el hallazgo de la pregunta 1. Por tanto no cuenta
  como hallazgo de cumplimiento independiente.»

En las dos, **el modelo encontró el conflicto y lo tiró por la línea «LAS DOS RESPUESTAS NO PUEDEN CITAR EL MISMO PAR DE
FRASES»**, añadida el día anterior. Las otras cinco vueltas prueban que el material para contestar por separado existe:
usan el permiso contra el principio, que son frases DISTINTAS de las de la pregunta 1. **La línea tenía que impedir un
falso positivo y produjo un falso negativo** (arquitecto).

**Lo que dicen además varias respuestas**: «el texto no indica qué sección corresponde a NOR-10 y cuál a CLI-12». Tenían
razón: el formato ponía los dos textos seguidos y sin etiqueta, y el modelo lo dedujo por la numeración.

**Consumo de la tanda** (14 llamadas): unos 55.000 tokens de entrada y 45.000 de salida; latencias de 8 a 21 segundos;
salidas de 1.861 a 4.232 tokens con un tope de 16.000. Lo más alto es el 26 % del tope: **ningún problema de techo**.

**El registro no distingue las dos parejas**: el campo «pareja» lleva el mismo id (`facac5fd…`, el de CLI-12) en las
catorce llamadas, porque es el id del documento candidato y los dos trozos son de CLI-12. En E3 da igual, porque cada
respuesta lleva el nombre de su pareja; **no lo puede heredar el registro de la pasada 2**.

## La vecindad · P-F130-9

**CONFIRMADA POR LAS DOS VÍAS.**
- **Los tres trozos** están en Pinecone con correspondencia «igual» entre el texto del vector y el de la base: **los
  números de trozo son los que creíamos**, y el riesgo del troceador queda cerrado PARA ESTOS TRES (para el resto de lo
  medido por número de trozo desde el 25/10 sigue abierto).
- **Puestos**: desde NOR-10·4, entre los 55 trozos de CLI-12, la pareja de §3.1 sale en el puesto 4 y la de §3.5 en el 3;
  desde el otro lado, el 2 y el 1. Un enumerador que coja cinco vecinos encuentra las dos.
- **Términos**: las dos figuras están en los tres trozos (contado por Code el 28/10).

**Y LO GRANDE** (arquitecto): **la mitad de §3.5, que no se había citado ni una vez en quince pasadas de la lista
abierta, sale 6 de 7 con una pregunta cerrada.** Es la mejor prueba que hay de que la arquitectura de F-130 funciona.

## Lo que cambia antes de repetir, y es del arquitecto

1. **La línea del mismo par se ESTRECHA**: «LAS DOS RESPUESTAS NO PUEDEN CITAR EL MISMO PAR DE FRASES. Esto se refiere A
   LAS FRASES, NO AL ASUNTO: que las dos preguntas traten del mismo asunto es NORMAL y no quita el hallazgo. Sólo
   contestas «sí» a la 2 si las frases que citarías son LAS MISMAS que ya has citado en la 1. Si puedes apoyar el
   cumplimiento en OTRO par de frases, aunque vaya del mismo asunto, HAY HALLAZGO y lo citas.»
2. **Cada texto lleva su documento y su trozo delante** («TEXTO 1 · <documento>, trozo <n>:»). Para E3 es inocuo; para la
   pasada 2 corrompería la salida, porque intercambiaría quién dice qué. **Tercer defecto del arquitecto en el mismo
   formato.**
3. **Sólo se repite la pareja de §3.1**, siete llamadas. La de §3.5 ya dio 6 de 7 y no se toca. *(Nota de Code: la de
   §3.5 queda medida con el formato de la primera tanda, la línea ancha y los textos sin etiqueta; la repetición de §3.1,
   con el nuevo. Las dos cifras no son del mismo formato.)*

## La predicción, escrita antes de volver a medir

**P-E3-R1** (arquitecto, 29/10): con la línea estrechada, la pareja de §3.1 da **6 DE 7 O MÁS**, y las vueltas que
cambian son las que ahora fallan por la regla de las frases. **Si sigue por debajo de 6, NO SE CONSTRUYE**, y entonces
toca la variante limpia.

**LO QUE MIDE P-E3-R1, escrito antes de medir para que no se cuele después** (arquitecto, 29/10): la repetición cambia
DOS cosas respecto a la primera tanda, la línea y las etiquetas de los textos. **La predicción es sobre la LÍNEA.** Las
etiquetas son un arreglo de corrección y no deberían mover la detección; **si la mueven mucho, es un resultado
inesperado y se anota como tal, no se mezcla con la predicción.**

**§3.5 NO SE REPITE AHORA** (decisión del arquitecto, 29/10): su 6 de 7 se midió con la línea ancha, y estrecharla sólo
quita motivos para descartar, así que repetirla no cambiaría ninguna decisión y cuesta siete llamadas. **Ese 6 de 7 es
del formato viejo, y las dos cifras no son estrictamente comparables. Si se construye, §3.5 se vuelve a medir con el
prompt definitivo.**

⚠️ **Y AL LADO, PORQUE ES LO QUE VIGILA AL ARQUITECTO**: el arquitecto fijó el 6 de 7 ANTES de medir para no poder
racionalizar después, y ha salido 5. Lo que justifica repetir no es su explicación: es que **el diagnóstico está en las
palabras del modelo y produce una predicción falsable**. Si al repetir falla, **no hay tercera vuelta de excusas**.

## E3 · SEGUNDA TANDA, LA REPETICIÓN DE §3.1 (29/10/2026, 15:15 UTC)

**P-E3-R1 FALLÓ.** Con la línea estrechada y los textos etiquetados, la pareja de §3.1 dio **3 de 7** (puntuación del
arquitecto); la predicción era 6 de 7 o más. Por lo escrito antes de medir: **NO SE CONSTRUYE, y lo que toca es la
variante limpia**, sólo las dos frases de D. **No hay tercera vuelta de excusas.**

**El JSON**, pegado por el director: `claude/Medida_F130_E3_Segunda_Tanda_29-10-2026.json` (con el bloque «registro»
compactado a una línea por petición, como el de la primera tanda; mismos valores). Siete respuestas; 28.441 tokens de
entrada y 22.618 de salida; latencias de 12.010 a 16.956 ms; salida máxima, 3.831, el 23,9 % del tope. Parámetros de las
siete: `maxTokens` 16.000, temperatura «sin_enviar», esfuerzo «medium».

**Qué cita cada vuelta en la pregunta 2** (tabulación de Code sobre el JSON, no puntuación; la puntuación es del
arquitecto):

| Vuelta | ¿Cita el permiso de §2.4? | ¿Cita el principio de §3.1? | Lo que hace en la 2 |
|---|---|---|---|
| 1 | no | no | dice «NO» y no lo cuenta: «no tengo otro par de frases distinto […] y la regla exige que las frases no se repitan» |
| 2 | sí | no | hallazgo: el permiso frente a la frase de A («El responsable último… no el Director Clínico») |
| 3 | no | no | dice «No» y no lo registra: «no encuentro en los dos trozos una frase diferente» |
| 4 | no | no | dice «No» y no aporta par: «no encuentro otro par de frases que apoye el incumplimiento sin repetirla» |
| 5 | no | no | hallazgo con otro par: el alcance del papel del Coordinador («encargado de supervisar…» frente a «responsable último…») |
| 6 | sí | sí | hallazgo: el permiso frente al principio, el par de D |
| 7 | sí | no (lo menciona en la explicación) | hallazgo: el permiso frente a la frase de A |

Las tres vueltas que citan el permiso (2, 6 y 7) son las que suman el 3 de 7. **Sólo la 6 cita el par de D.** En las
vueltas 1, 3 y 4 el modelo contesta «no» a la pregunta 2 y, aun así, no lo cuenta por la línea del mismo par.

## La lectura del arquitecto de la segunda tanda (29/10/2026)

**P-E3-R1 HA FALLADO: 3 DE 7, PEOR QUE LOS 5 DE LA PRIMERA TANDA.** La predicción que el arquitecto escribió antes de medir
no se cumplió, y la segunda tanda salió peor que la primera.

**La puntuación, vuelta por vuelta, comprobable contra el JSON:**
- **Vueltas 2, 6 y 7: D REGISTRADA**, con el permiso de NOR-10 («puede recaer en el propio Director Clínico») contra la
  regla o el principio de CLI-12, etiqueta norma_contra_norma.
- **Vueltas 1, 3 y 4**: la pregunta 2 contesta «no», pero RAZONANDO SOBRE A, no sobre D, y luego declina registrar («no
  encuentro otro par de frases distinto»). La 4 además cierra la vía de D: el Coordinador no puede ser el Director
  «porque el TEXTO 2 excluye esa identidad».
- **Vuelta 5**: encuentra otro par y construye OTRO hallazgo (NOR-10 limita al Coordinador a «supervisión documental»
  frente a la «responsabilidad última» de CLI-12). Es un hallazgo, pero NO es D.

**1 · FALLO DE MÉTODO, con el nombre del arquitecto**: cambió DOS cosas a la vez, la línea y las etiquetas, sabiéndolo, y
lo había dejado escrito antes de medir. **Por eso NO SE PUEDE ATRIBUIR LIMPIAMENTE LA BAJADA.** Casi seguro es la línea,
pero la vuelta 4 razona con más seguridad sobre A ahora que los textos están etiquetados, y no se pueden separar los dos
efectos. Es un defecto de método, no un detalle.

**2 · EL HALLAZGO ESTRUCTURAL, más grande que la línea**: **A PUEDE CONTESTAR TAMBIÉN LA PREGUNTA 2.** «Dos personas no
pueden ser las dos el responsable último» es un problema de cumplimiento tanto como de dato, así que A ocupa LAS DOS
casillas y D se queda sin sitio: la supresión reaparece un nivel más arriba. El argumento del arquitecto del 29/10 era
que dos casillas obligatorias separan a A y a D; con estos datos, **DOS CASILLAS NO BASTAN CUANDO UN HALLAZGO CABE EN LAS
DOS.**

## La tercera tanda: el cambio, la predicción y cómo se puntúa (escrito ANTES de medir, 29/10/2026)

⚠️ **Lo que se escribió antes de la segunda tanda, y no es lo que se hace** (Code, para que conste): «Si sigue por debajo
de 6, NO SE CONSTRUYE, y entonces toca la variante limpia», y «no hay tercera vuelta de excusas». Lo que se hace es una
tercera tanda del mismo E3, no la variante limpia. Según el arquitecto, el director la ha aceptado sabiendo que se dijo
que no la habría.

**EL CAMBIO, y es quitar lo añadido** (arquitecto):
- **A · Se borra la línea del mismo par, entera, con su mutante.** No se estrecha más. Sin línea, nunca medido; ancha,
  5 de 7; estrecha, 3 de 7: hace daño en las dos versiones, y más cuanto más se aprieta. Y su sitio no era el prompt:
  Fable la puso en el VALIDADOR, en código. Sigue escrita como requisito de la pasada 2; en E3 el validador es el
  arquitecto, que lee las siete.
- **B · Se desacopla la pregunta 2**, con una línea tras su «HAY HALLAZGO SI LA RESPUESTA ES «NO»…»: «ESTA PREGUNTA SE
  CONTESTA SOLA, COMO SI LA 1 NO EXISTIERA. Da igual lo que hayas contestado en la 1. NO VALE RESPONDER «ya queda recogido
  en la pregunta 1» NI «no encuentro otro par de frases»: si no se pueden cumplir las dos, HAY HALLAZGO Y LO CITAS, aunque
  las frases sean las mismas que citaste en la 1.» Mata las dos salidas que el modelo ha usado: «ya queda recogido», en
  las dos tandas, y «no encuentro otro par», en la segunda.
- ⚠️ **A y B son dos cambios en dos sitios pero UNA SOLA COSA**: los dos quitan el acoplamiento entre las preguntas, y
  hacer uno sin el otro dejaría una salida abierta y desperdiciaría la tanda. Esta vez la razón para cambiar dos cosas a
  la vez es distinta, y queda escrita.
- **C · Las etiquetas de los textos se quedan**: son un arreglo de corrección, y sin ellas la pasada 2 intercambiaría
  quién dice qué.

**P-E3-R2, LA ÚLTIMA** (arquitecto, antes de medir): sin la línea y con la pregunta 2 desacoplada, **la pareja de §3.1 da 6
DE 7 O MÁS. El umbral NO SE BAJA**: es el mismo que se fijó el 28/10.

**CÓMO SE PUNTÚA, escrito antes de ver nada**: sólo cuenta como D que la pregunta 2 afirme que NO se pueden cumplir las dos
**APOYÁNDOSE EN EL PERMISO** de NOR-10 («puede recaer en el propio Director Clínico») contra la regla o el principio de
CLI-12. Si la pregunta 2 se contesta reformulando A (quién es el responsable último), **NO CUENTA**, aunque diga «no se
pueden cumplir» y aunque lleve etiqueta.

**EL OTRO RESULTADO POSIBLE, con su significado escrito de antemano**: si vuelve a fallar porque la casilla 2 se llena con
A, **EL FALLO NO ES INSTRUMENTAL SINO ESTRUCTURAL —dos casillas no bastan— Y NO SE CONSTRUYE.** Entonces lo que va a Fable
es un DATO dentro de F-130, no una pregunta abierta: «movimos tu comprobación del validador al prompt y esto pasó; y A
ocupa las dos casillas». Ninguna consulta nueva.

**NO HAY CUARTA TANDA.**

⚠️ **Lo que Code marcó al implementar B** (el texto se implementa tal cual): el criterio del cumplimiento que va dentro de
la pregunta 2, recortado del bloque del juez, dice dos veces que cuando las dos reglas mandan sobre la MISMA cosa «es un
hallazgo de la PREGUNTA 1, no de la 2». La línea B dice que en la 2 «HAY HALLAZGO Y LO CITAS, aunque las frases sean las
mismas que citaste en la 1». Las dos instrucciones van en la misma pregunta y apuntan en sentidos contrarios para A: el
criterio la manda a la 1 y la línea B la admite en la 2.

**RESUELTO ANTES DE LANZAR (arquitecto, 29/10).** Al mirar la contradicción, el arquitecto relee la segunda tanda: **en las
vueltas 1, 3 y 4 el modelo NO se escurría, OBEDECÍA EL CRITERIO.** El criterio dice «misma cosa → pregunta 1» y define el
conflicto normativo «cuando las dos mandan sobre COSAS DISTINTAS»; cuando decide que la pareja va «de la misma cosa», el
propio criterio le cierra la puerta a D. Y esa pareja manda sobre las dos a la vez: la misma (quién responde, A) y cosas
distintas (quién ocupa el cargo frente a quién responde, D). **La frase B se sustituye entera**:
«ESTA PREGUNTA SE CONTESTA SOLA, COMO SI LA 1 NO EXISTIERA, Y SE PREGUNTA SOBRE FRASES, NO SOBRE LOS DOS TEXTOS EN BLOQUE. Un
mismo par de trozos puede mandar a la vez sobre la misma cosa y sobre cosas distintas, así que no decidas eso del par
entero: la distinción de arriba se aplica AL PAR DE FRASES que estés considerando. Recorre las frases y busca si hay
ALGUNA de un texto y ALGUNA del otro que no se puedan cumplir a la vez. NO VALE RESPONDER «ya queda recogido en la
pregunta 1» NI «no encuentro otro par de frases».»
Quita el final que chocaba («aunque las frases sean las mismas»), mantiene cerradas las dos salidas que usó el modelo y
deja de pedirle un juicio sobre el par entero. **El recorte del criterio NO se toca**: sus remisiones a la pregunta 1 son
lo que mantiene a A fuera de la casilla 2 (la segunda opción de Code, quitárselas, «era la peor de las dos»).
**P-E3-R2 NO CAMBIA**: mismo umbral y misma regla de puntuación.
**ESTO NO ES UNA CUARTA TANDA**: la tercera no se ha corrido. Lo que se corrige es el texto antes de lanzarlo, no el
resultado después de verlo.

## E3 · TERCERA TANDA: P-E3-R2 HA FALLADO, Y NO SE CONSTRUYE LA PASADA 2 (29/10/2026)

**P-E3-R2 HA FALLADO: 4 DE 7, con el umbral en 6. POR LO ESCRITO ANTES DE MEDIR, NO SE CONSTRUYE LA PASADA 2. No hay
cuarta tanda.**

**El JSON**, pegado por el director (pulsado a las 18:31 UTC): `claude/Medida_F130_E3_Tercera_Tanda_29-10-2026.json`, con
el «registro» compactado a una línea por petición, como los otros dos; mismos valores. Siete respuestas; 28.882 tokens de
entrada y 20.431 de salida; latencias de 9.393 a 16.413 ms; salida máxima, 3.877, el 24,2 % del tope. Los mismos
parámetros en las siete: `maxTokens` 16.000, temperatura «sin_enviar», esfuerzo «medium».

**Comprobado por Code contra el JSON**: la pregunta 2 cita «puede recaer en el propio Director Clínico» en las vueltas 2, 3,
4 y 7, y en ninguna otra; las siete llevan etiqueta norma_contra_norma; ninguna dice «ya queda recogido» ni «no encuentro
otro par». La cita de la vuelta 3 está en el JSON; literal, es: «Las dos reglas regulan cosas distintas: el Texto 1
regula quién puede ocupar el cargo de Coordinador de Calidad, y el Texto 2 regula quién es el responsable último de la
esterilización. Por eso este hallazgo es de la pregunta 2 y no se confunde con el de la pregunta 1.»

**La puntuación** (arquitecto; sólo cuenta D si la pregunta 2 se apoya en el PERMISO de NOR-10):
- **D REGISTRADA en las vueltas 2, 3, 4 y 7**: las cuatro citan «puede recaer en el propio Director Clínico» contra el
  principio de CLI-12.
- **NO CUENTAN las vueltas 1, 5 y 6**: la casilla 2 se llena con A, las frases de la responsabilidad última, con etiqueta
  norma_contra_norma. En la 5 y la 6 se menciona el principio, pero enfrentado a la ASIGNACIÓN de responsabilidad, no al
  permiso.

**LO QUE SÍ SE ARREGLÓ** (arquitecto: «es el único diagnóstico mío de los tres que acertó»): **LOS DESCARTES
DESAPARECIERON.** Las siete vueltas contestan la pregunta 2 entera, con citas y etiqueta. Ni un «ya queda recogido» ni un
«no encuentro otro par». Las dos líneas que añadió eran la causa, y quitarlas lo resolvió.

**LA SERIE COMPLETA, la pareja de §3.1**:

| Condición | D |
|---|---|
| lista abierta | 2 de 7 |
| línea ancha | 5 de 7 |
| línea estrecha | 3 de 7 |
| sin línea y por frases | 4 de 7 |

La pareja de §3.5, **6 de 7** (primera tanda, formato de entonces).

**LA LECCIÓN GENERAL de estos dos días, con el nombre del arquitecto**: **EMPAREJAR POR PÁRRAFOS NO ELIMINA LA
COMPETENCIA: LA REDUCE. LA COMPETENCIA VUELVE SIEMPRE QUE DOS HALLAZGOS VIVEN EN LA MISMA PAREJA.** Aquí el mismo párrafo
de NOR-10 lleva la frase de A y la de D, y dos casillas obligatorias no las separan porque A cabe en las dos. La pregunta
cerrada sube D del 29 % al 57 % y saca una mitad que la lista abierta no había citado en quince pasadas, **pero 57 % no
es cobertura.**

**La vuelta 3, como prueba de que el modelo PUEDE hacer la distinción** (la cita literal, arriba): la hace 4 de 7. **Es muestreo a temperatura 1, no imposibilidad.**

## LA VARIANTE LIMPIA: preparada, sin correr (29/10/2026)

**Lo que estaba escrito, y se hace**: la variante limpia, sólo las dos frases de D, sin A delante, siete veces.
⚠️ **SU ALCANCE, escrito ANTES de correrla: NO REABRE LA DECISIÓN DE CONSTRUIR.** Sólo mide el techo de la pregunta
cerrada cuando A no está, para saber si el problema es A o la pregunta. **Ese número va en la consulta F-131 a Fable.**

**Cómo está hecha** (`app/api/admin/medida-f130/limpia/route.ts`):
- **La misma pregunta de la tercera tanda, sin tocar una letra**, y la misma configuración del juez (la llamada está ahora
  en un sitio, `preguntar-al-juez.ts`, que usan E3 y la variante). Lo único que cambia es el contenido de los dos textos.
- **Las frases no se escriben a mano**: se cortan del texto de la base, la que contiene la frase de cada trozo de
  `TROZOS` («puede recaer en el propio Director Clínico» en NOR-10·4; «separar la responsabilidad de un proceso crítico
  de seguridad del paciente» en CLI-12·3). Una frase va de punto a punto, o hasta el salto de línea, y «2.1» no la corta.
- **Falla cerrada, con 409 y sin llamar al modelo**: si la frase no sale una sola vez, o si lleva una marca de A
  («responsabilidad última», «responsable último»).
- **Dos botones**: «ver las dos frases» (sin modelo, no gasta) devuelve las dos frases y el prompt; el otro corre las
  siete. **Primero el de ver**: así se comprueba qué se manda antes de gastar. El botón de E3 se ha quitado de la página.

**LA REGLA DE PUNTUACIÓN, escrita ANTES de pulsar (arquitecto, 29/10)**; aquí es más simple que en E3, porque A no está en
los textos:
- **PREGUNTA 1: la respuesta correcta es «NO».** Con sólo esas dos frases no hay ningún dato con dos valores. Si contesta
  «sí», es un **falso positivo** y se anota como tal.
- **PREGUNTA 2: CUENTA COMO D** si contesta que NO se pueden cumplir las dos, apoyándose en el permiso de NOR-10 contra el
  principio de CLI-12. Como las frases de A no están en el material, la vía de «reformular A» es **imposible por
  construcción**: eso es justamente lo que esta medida aísla.

**LOS DOS FALLOS POSIBLES, NOMBRADOS ANTES DE VERLOS** para que después no sean excusas:
- **a)** Que diga que la frase del principio «sólo explica, no manda» y conteste «sí» a la 2. Eso sería que **LA GUARDA DEL
  PRINCIPIO no se sostiene sola**, y es un resultado importante.
- **b)** Que se niegue a inferir porque el apartado 3.1 no está entero en el material. Ya pasó en la primera tanda, en la
  vuelta 1 de la pareja de §3.5 («el contenido de ese apartado no aparece en los textos»). Si vuelve a pasar, **es un
  límite de la variante, no de la pregunta.**

**P-VL-1, LA PREDICCIÓN: 7 DE 7.** El arquitecto la pone ahí porque el 28/10 escribió que esta condición «daría 7 de 7 y no
mediría nada»: si sale menos, el que queda retratado es él.

**CÓMO SE LEE EL NÚMERO, también antes de medir:**
- **6 o 7**: confirma que el problema es **LA PRESENCIA DE A EN LA PAREJA**, y eso es el núcleo de la consulta F-131.
- **4 o menos**: el problema **NO es A**, sino la pregunta o la guarda del principio. Entonces F-131 cambia de forma por
  completo y es mucho más importante.
- **5**: no distingue, y se dice que no distingue.

**NO REABRE LA DECISIÓN DE CONSTRUIR**, que ya está tomada y escrita.

**EL ORDEN (arquitecto)**: primero el botón de **ver las dos frases**, que no gasta, y su salida se le pega al arquitecto,
que comprueba con sus ojos que no hay nada de A delante. **Sólo después, las siete llamadas.**

## Las dos frases del ensayo

**El JSON del ensayo**, pegado por el director: `claude/Medida_F130_Variante_Limpia_Ensayo_29-10-2026.json`. El arquitecto
lo vio y dio paso a las siete llamadas. Las dos frases, literales:
- **NOR-10, trozo 4**: «Cada clínica cuenta con un Coordinador de Calidad, figura que puede recaer en el propio Director
  Clínico o en otro profesional designado por él, encargado de supervisar el cumplimiento documental del protocolo:
  mantener actualizados los registros, preparar la documentación para auditorías internas y externas, y proponer mejoras
  al protocolo basadas en la experiencia diaria del centro.»
- **CLI-12, trozo 3**: «Esta asignación responde a un criterio deliberado del sistema de gestión de calidad: separar la
  responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico,
  gestiona simultáneamente la agenda asistencial y puede verse sometida a presión de tiempo que entre en conflicto con el
  rigor exigido en esterilización.»

**Comprobado por Code** (con una herramienta de un solo uso en `scratchpad`):
- El prompt del ensayo (7.585 caracteres) es **exactamente** el que arma `construirPrompt` con esas dos frases y el criterio
  de hoy; es decir, lo desplegado era lo que dice el repositorio.
- Ninguna de las dos frases lleva una marca de A.
- Las frases de la tanda de siete son las mismas que las del ensayo.

## LA VARIANTE LIMPIA: 7 DE 7. P-VL-1 SE CUMPLE (29/10/2026)

**El JSON**, pegado por el director (pulsado a las 21:26 UTC): `claude/Medida_F130_Variante_Limpia_29-10-2026.json`, con el
«registro» compactado a una línea por petición, como los otros; mismos valores. Siete respuestas; 25.445 tokens de
entrada y 16.452 de salida; latencias de 8.796 a 11.762 ms; salida máxima, 2.751. Los mismos parámetros en las siete.

**Comprobado por Code contra el JSON**:
- En las siete, la pregunta 1 dice «sí».
- En las siete, la pregunta 2 cita el permiso («puede recaer en el propio Director Clínico») y el principio («separar la
  responsabilidad de un proceso crítico…»), con la etiqueta norma_contra_norma.
- Sólo la vuelta 4 menciona «esta asignación».
- Las dos citas de abajo están en el JSON, literales.
- Y lo que se ve al leerlas: **en las siete, la pregunta 1 cita las mismas dos frases que la 2**.

**El resultado** (arquitecto): **LAS SIETE CITAN EL PERMISO contra el principio**, con etiqueta norma_contra_norma. **P-VL-1
(7 de 7) SE CUMPLE.** **El fallo (b), nombrado antes, NO se dio**: sólo la vuelta 4 menciona que «esta asignación» no tiene
antecedente, y lo resuelve suponiéndolo.

**LA PREGUNTA 1: SIETE FALSOS POSITIVOS DE SIETE.** Las siete contestaron «SÍ», y la regla escrita antes de medir decía que
lo correcto era «no». Se anota como falso positivo, porque así estaba escrito, **Y COMO EL HALLAZGO PRINCIPAL DEL DÍA.**

**LA INTERPRETACIÓN DEL ARQUITECTO, que sustituye su diagnóstico de esta tarde y va al lado de él, no en su lugar:**
**EL MODELO NO USA LAS DOS CASILLAS PARA GUARDAR DOS HALLAZGOS DISTINTOS: USA LAS DOS PARA DESCRIBIR EL MISMO HALLAZGO DOS
VECES.**
- **Con UN solo conflicto en la pareja, lo mete en las dos casillas**, y salen 7 de 7 en las dos preguntas.
- **Con DOS conflictos, uno se queda las dos casillas y el otro desaparece**: A se quedaba las dos y D se caía, 4 de 7.
- Es la MISMA conducta explicando los dos resultados. Y por tanto **EL MECANISMO DE «UNA CASILLA PARA A Y OTRA PARA D» NUNCA
  FUNCIONÓ.** No es que dos casillas no basten: es que el modelo no reparte por casillas.

**Las dos citas literales que lo prueban** (vueltas 4 y 6; comprobadas contra el JSON):
- «Como ambas frases regulan la misma cuestión, la discrepancia es también un hallazgo de la Pregunta 1.»
- «Como el Texto 1 y el Texto 2 regulan la misma figura, el hallazgo también aparece en la Pregunta 1.»

## Lo que el arquitecto corrige de esta tarde, al lado y sin borrar (29/10/2026)

**1 · LAS CIFRAS NO FORMABAN UNA PROGRESIÓN.** Esta tarde dijo que 5, 3 y 4 de 7 formaban una progresión («la línea hace
daño en las dos versiones, y más cuanto más se aprieta»). **Con siete tiradas y temperatura 1, esas tres cifras están
dentro del ruido y NO son distinguibles.** Según el arquitecto, lo único fuera del ruido son los saltos grandes: 2 de 7
con la pregunta abierta; entre 3 y 5 de 7 con la cerrada en la pareja que lleva A; 6 de 7 en la pareja de §3.5; 7 de 7
sin A.
**El fallo de método que lo acompaña: PARA DISTINGUIR UN 5 DE UN 4 HABRÍAN HECHO FALTA VEINTE O TREINTA PASADAS POR
CONDICIÓN, NO SIETE.** Fable dio la herramienta para eso, su E5 (la curva de acumulación), y no se ha corrido.

⚠️ **Code, con la cuenta hecha** (Fisher exacto bilateral, siete frente a siete; en `scratchpad`, no en el repositorio):
también los saltos grandes, salvo uno, siguen dentro del ruido con siete tiradas.

| Comparación | p |
|---|---|
| 5 frente a 3 | 0,592 |
| 5 frente a 4 | 1,000 |
| 2 frente a 4 (el «del 29 % al 57 %» de esta tarde) | 0,592 |
| 3 frente a 6 | 0,266 |
| 4 frente a 6 | 0,559 |
| 4 frente a 7 | 0,192 |
| 3 frente a 7 | 0,070 |
| 6 frente a 7 | 1,000 |
| **2 frente a 7** | **0,021** |

Sólo 2 de 7 frente a 7 de 7 baja de 0,05. El intervalo de Wilson al 95 % de un 7 de 7 va del 65 % al 100 %, y el de un 4 de
7, del 25 % al 84 %: se solapan. Lo que sí se separa de cualquier ruido son **los siete «sí» de la pregunta 1** donde se
esperaba «no», porque no compiten con otra cifra: son siete de siete en el sentido contrario al escrito.

**2 · LOS PARCHES SE VOLVIERON REACTIVOS, con el nombre del arquitecto.** La última frase que añadió nombra las excusas exactas
que el modelo había usado en este caso («ya queda recogido en la pregunta 1», «no encuentro otro par de frases»). Está
escrita en general y no menciona el corpus, pero es tapar agujeros observados en vez de arreglar el mecanismo, y las tres
tandas fallidas son lo que cuesta hacer eso. **Las DOS PREGUNTAS siguen siendo genéricas**, afirma o manda, y no hay una
tercera; **los parches no lo eran.**

## Lo que va a Fable: una ADENDA DE F-130, no una consulta nueva (29/10/2026)

**Decisión del director, con su razón escrita**: mismo objetivo y misma dinámica que F-130, y un número nuevo arrastra
ceremonia (plan, predicciones, pendientes, revisión de choques) que no compra nada mientras no haya plan que escribir.
**REGLA NUEVA, DEL DIRECTOR: EL NÚMERO VIENE DESPUÉS DEL CONTENIDO, NO ANTES.** Si la respuesta de Fable trae una
arquitectura distinta, entonces nace F-131 con ese contenido dentro; si trae un ajuste, se queda en adenda.
(Lo escrito antes, «ese número va en la consulta F-131 a Fable», queda sustituido por esto.)

**La decisión de no construir la pasada 2 sigue en pie. La adenda la escribe el arquitecto mañana.**

## La segunda corrección del arquitecto sobre las cifras, con su nombre (30/10/2026)

**EL ARQUITECTO CORRIGIÓ LA PARTE QUE LE QUITABA RAZÓN Y SE DEJÓ LA QUE SE LA DABA.** El 29/10 corrigió que 5, 3 y 4 no
eran una progresión, pero añadió que «los saltos grandes sí están fuera del ruido», y dijo DOS VECES que la pregunta
cerrada «dobla D, del 29 % al 57 %». El Fisher de Code da p = 0,592 para eso. Es la segunda vez en el mismo asunto.

**LO QUE QUEDA EN PIE, y sólo son dos cosas:**
- **2 de 7 (pregunta abierta) frente a 7 de 7 (cerrada sin A): p = 0,021.** La forma de la pregunta importa.
- **Los siete «sí» de la pregunta 1**: NO COMPITEN CON OTRA CIFRA. Siete de siete en dirección contraria a una predicción
  registrada antes de medir es fuerte por sí solo.

**LO QUE NO QUEDA EN PIE es el centro de la adenda**: «con estas tandas, sin A sale 7 y con A sale 4» todavía no está
demostrado.

## LA MEDICIÓN DE VEINTE POR CONDICIÓN: preparada, sin correr (30/10/2026)

**Por eso se mide antes de escribir.** Veinte pasadas en cada una de las dos condiciones, unas 40 llamadas:
- **Condición 1**: la pareja entera NOR-10·4 ↔ CLI-12·3, con A dentro. Es la de la tercera tanda, sin tocar el prompt
  (ruta `pregunta`).
- **Condición 2**: las dos frases de D solas, sin A. Es la variante limpia, sin tocar nada (ruta `limpia`).

⚠️ **ESTO NO REABRE NADA.** La puerta se cerró con tres tandas y **LA PASADA 2 NO SE CONSTRUYE: sigue decidido.** Esto es
medición **PARA LA CONSULTA**, que es otro propósito. Desde fuera se parece a una cuarta vuelta, y no lo es.

**Es la E5 de Fable, que el arquitecto lleva dos días debiendo: LA HERRAMIENTA ESTABA DADA DESDE EL DICTAMEN Y NO SE
USÓ.**

**LA REGLA DE PUNTUACIÓN NO CAMBIA en ninguna de las dos**: sólo cuenta como D que la pregunta 2 se apoye en el permiso de
NOR-10 contra la regla o el principio de CLI-12. **En las dos se cuenta además, aparte, cuántas veces la pregunta 1
contesta «sí».**

**NINGUNA PREDICCIÓN DEL ARQUITECTO ESTA VEZ**: lleva tres falladas y una acertada en tres días, y con veinte pasadas por
condición el número hablará solo. **Lo único escrito antes de medir es la LECTURA**: si las dos condiciones se separan con
p < 0,05, el contraejemplo está demostrado y es el centro de la adenda; **si no se separan, LA ADENDA CAMBIA DE FORMA** y lo
que se le cuenta a Fable es que no se ha podido demostrar.

**Los cortes de esa lectura, calculados por Code ANTES de medir** (Fisher exacto bilateral, 20 frente a 20; en
`scratchpad`): para cada resultado de la condición 2, el mayor resultado de la condición 1 que todavía se separa con
p < 0,05.

| Condición 2 (sin A) | Se separa si la condición 1 (con A) da… | p en el corte, y uno más |
|---|---|---|
| 20 de 20 | 15 o menos | 0,047 · con 16, 0,106 |
| 19 de 20 | 13 o menos | 0,044 · con 14, 0,091 |
| 18 de 20 | 11 o menos | 0,031 · con 12, 0,065 |
| 17 de 20 | 10 o menos | 0,041 · con 11, 0,082 |
| 16 de 20 | 9 o menos | 0,048 · con 10, 0,096 |

Es aritmética, no predicción: no dice qué va a salir, sólo dónde está la raya.

**Cómo está hecha**: el número de pasadas es una constante por condición, `VECES_DE_E3` y `VECES_DE_LA_VARIANTE_LIMPIA`,
las dos a 20; los prompts no se tocan. La página vuelve a tener el botón de la condición 1, junto al de la condición 2. El
paralelismo sigue en 4, como en las tandas de siete. **El presupuesto de tiempo** (la regla de las esperas):
- cinco tandas de 4, unos 85 s en condiciones normales;
- unos 205 s si una tanda entera agota los reintentos del cliente (52 s de esperas, `RETRY_DELAYS` en
  `lib/llm/anthropic-client.ts`);
- `maxDuration` es 300 en las dos rutas.

**Y el comentario que repetía la lectura de progresión** («Hacía daño en las dos versiones, y más cuanto más se apretaba»,
en `medida-f130.ts`) está corregido. Ahora dice que con siete tiradas esas cifras no se distinguen. Un comentario con una
lectura falsa se copia, y no se deja vivo sólo porque la carpeta vaya a borrarse.

## Los JSON de la medición de veinte

**CONDICIÓN 1, la pareja entera con A** (08:03:13 UTC del 30/10): `claude/Medida_F130_Veinte_Condicion_1_30-10-2026.json`,
pegado por el director, con el «registro» compactado a una línea por petición, como los otros; mismos valores. La
puntuación del arquitecto, **20 de 20, COMPROBADA por Code contra el JSON**:
- en las veinte, la pregunta 2 cita «puede recaer en el propio Director Clínico» y lleva la etiqueta norma_contra_norma;
- en las veinte, la pregunta 1 dice «sí».

**Cifras**: 20 llamadas, todas «ok», a la misma pareja (`facac5fd…`, la misma que la tercera tanda). **4.126 tokens de entrada
en las veinte**, los mismos que en la tercera tanda. 63.491 de salida, la máxima 4.706; latencias de 8.880 a 19.754 ms; los
mismos parámetros en las veinte.

**La vuelta 12, que el arquitecto marca como marginal**: en su pregunta 2 razona primero sobre A («no sustituye al Director
Clínico en la responsabilidad última» frente a «no el Director Clínico») y sólo después invoca el permiso. **La
comprobación mecánica la cuenta igual**: el permiso está en su pregunta 2. Una señal mecánica más gruesa, que en la
pregunta 2 aparezca «responsable último» o «responsabilidad última» antes que el permiso, marca también la **vuelta 16**.
Leída, la 16 empieza por la regla y el principio de CLI-12, que son el lado de D, y no por la frase de A de NOR-10, así que
no es el caso de la 12. Se anota, sin cambiar la puntuación.

**Tres cosas vistas al leer, sin cambiar la puntuación**:
- **La vuelta 11 contesta la pregunta 2 con «Sí, hay hallazgo»**: la polaridad al revés en la palabra, aunque el texto dice
  que no se pueden cumplir las dos a la vez y cita el par de D. Es la confusión de polaridad que la pregunta ya marca.
- **Las vueltas 4 y 11 terminan con «No encuentro otro par de frases en conflicto»**, y lo dicen DESPUÉS de registrar D. No
  es el descarte de la segunda tanda.
- **La vuelta 14 termina con «Esto ya se recoge en la pregunta 1»**, sobre A y también después de registrar D.

**CONDICIÓN 2, las dos frases sin A** (08:04:58 UTC del 30/10): `claude/Medida_F130_Veinte_Condicion_2_30-10-2026.json`,
pegado por el director, con el «registro» compactado como los otros.

**Cifras**: 20 llamadas, todas «ok». **3.635 tokens de entrada en las veinte**, los mismos que en la variante limpia de anoche.
46.465 de salida, la máxima 2.936; latencias de 7.962 a 13.805 ms; los mismos parámetros en las veinte.

**LAS DOS FRASES QUE LEYÓ ESTA MAÑANA SON IDÉNTICAS, BYTE A BYTE, A LAS DE ANOCHE**, las del ensayo y las de la variante
limpia de las 21:26 UTC. Es una prueba parcial sobre la noche: las dos frases de D, cortadas del texto de los trozos, no
cambiaron. **No prueba el resto de los dos trozos**, que es lo que lee la condición 1; eso sigue en `SQL_34_04`.

**La pregunta 1, COMPROBADA**: diecinueve «sí» y un «no», el de la vuelta 11, como da el arquitecto.

**⚠️ LA PREGUNTA 2: LA COMPROBACIÓN MECÁNICA NO DA 20, DA 16.** Buscando «puede recaer en el propio Director Clínico» en la
pregunta 2, como pidió el arquitecto, sale en dieciséis vueltas.
- **Las vueltas 1, 2, 7 y 15 se apoyan en el permiso, pero lo PARAFRASEAN** («el Texto 1 permite que el Director Clínico
  sea el Coordinador») **y no citan en la pregunta 2 ninguna frase literal de los documentos**. La pregunta pide «cita la
  frase literal de cada lado», y estas cuatro no lo hacen; las citas literales las pusieron en la pregunta 1.
- Por la regla escrita, «apoyándose en el permiso», las cuatro cuentan y salen 20 de 20. Por la comprobación literal, que
  es con la que se puntuaron la tercera tanda (4 de 7) y la condición 1 (20 de 20), salen 16 de 20. **Cuál vale lo decide
  el arquitecto.**
- **No cambia la lectura**: condición 1 frente a condición 2, 20 frente a 20, p = 1; 20 frente a 16, **p = 0,106**. Con
  cualquiera de las dos cuentas, las condiciones no se separan.

**Dos cosas vistas al leer**: las vueltas 1 y 9 encabezan la pregunta 2 con «SÍ, hay hallazgo», con la polaridad al revés
en la palabra, como la 11 de la condición 1. La vuelta 11, la del «no» en la pregunta 1, explica que la tensión «es
normativa, y se trata en la pregunta 2»: es la única de las cuarenta respuestas de esta mañana que separa las casillas
como se diseñaron.

## LA CONDICIÓN 1 REPETIDA, MISMO PROMPT (30/10/2026, 08:17:19 UTC)

`claude/Medida_F130_Veinte_Condicion_1_Repetida_30-10-2026.json`, pegado por el director, con el «registro» compactado como
los otros.

**La puntuación del arquitecto, 16 de 20, COMPROBADA contra el JSON.** La comprobación literal («puede recaer en el propio
Director Clínico» en la pregunta 2) falla justo en las vueltas 2, 4, 8 y 14, y en ninguna otra. En las cuatro, la pregunta
2 se contesta con las frases de A. La 14 dice: «Ninguna de las dos permite algo que la otra excluya». Las veinte preguntas
1 dicen «sí».

**Cifras**: 20 llamadas, todas «ok», a la misma pareja. **4.126 tokens de entrada en las veinte**, como la condición 1 de
hace una hora y como la tercera tanda. 60.622 de salida, la máxima 4.171; latencias de 9.552 a 18.396 ms; los mismos
parámetros.

**Las cuentas (Fisher exacto bilateral), de Code**:

| Comparación | p |
|---|---|
| condición 1 (20 de 20) frente a su repetición (16 de 20), una hora después | 0,106 |
| tercera tanda (4 de 7) frente a la repetición (16 de 20) | **0,328** |
| tercera tanda (4 de 7) frente a las dos de esta mañana juntas (36 de 40) | **0,057** |

⚠️ **Lo que eso le hace al asunto grande, y lo dice Code, no el arquitecto.** El 4 de 7 de anoche frente al 20 de 20 de esta
mañana daba p = 0,012. Con la repetición, el mismo prompt y la misma base han dado 20 y 16 en una hora. **Frente a la
repetición, el 4 de 7 de anoche ya no se separa (p = 0,328); frente a las dos juntas, tampoco con p < 0,05 (p = 0,057).**
- Con estos datos, «algo cambió fuera entre anoche y esta mañana» deja de ser necesario para explicar el 4 de 7. La otra
  posibilidad que el arquitecto dejó escrita, **«la varianza real es mucho mayor de lo que siete tiradas podían mostrar»**,
  basta para explicarlo.
- No se afirma ninguna de las dos. `SQL_34_04` sigue haciendo falta para descartar que cambiara el texto.

⚠️ **LAS DOS LECTURAS QUE EL ARQUITECTO ESCRIBIÓ ANTES DE ESTA REPETICIÓN DAN RESPUESTAS OPUESTAS, Y LA DECISIÓN ES SUYA.**
- La primera: «Si vuelve a dar 20 de 20, hoy es sólido; **si da otra cosa, el proceso es demasiado inestable para poner una
  puerta encima**». Dio 16: otra cosa.
- La segunda: «**si la repetición de hoy se separa de la de hace una hora, el problema es la inestabilidad del proceso**».
  20 frente a 16 da p = 0,106: no se separa.
- Code no elige.

## LA LECTURA DE LA MEDICIÓN DE VEINTE, por lo escrito antes de medir (arquitecto, 30/10/2026)

**LAS DOS CONDICIONES NO SE SEPARAN** (20 frente a 20, p = 1; con la cuenta literal de la condición 2, 20 frente a 16,
p = 0,106). **LA HIPÓTESIS DE QUE LA PRESENCIA DE A IMPIDE QUE SALGA D QUEDA REFUTADA**, no «no demostrada»: **era la
hipótesis del arquitecto y la medición la tumba.** Con A dentro, D salió en las veinte vueltas de la condición 1, citando el
permiso literal.

Esta lectura no depende de la noche: las dos condiciones leyeron la misma base, con minuto y medio de diferencia.

**Lo que sí depende de la noche**, es decir, la tercera tanda (4 de 7) frente a la condición 1 (20 de 20) con el mismo
prompt, **sigue en espera de `SQL_34_04`**, en la sección siguiente.

## ¿ES EL MISMO PROMPT EL DE LA TERCERA TANDA (29/10, 18:31 UTC) Y EL DE LA CONDICIÓN 1 (30/10, 08:03 UTC)? (30/10/2026)

**Lo que pidió el arquitecto antes de nada**: demostrarlo byte a byte, y si no son idénticos, PARAR, porque la explicación
sería nuestra y no de fuera.

**Qué estaba desplegado** (reflog de `origin/main`, horas locales +01:00 pasadas a UTC):
- La tercera tanda (18:31 UTC) corrió con **`b3b4e9da`**, subido a las 18:24 UTC. El siguiente push, a las 19:25 UTC, fue
  después. Y la tercera tanda gastó 4.126 tokens de entrada, frente a los 4.063 de la segunda, con el texto anterior; así
  que ya corría el texto nuevo.
- La condición 1 (08:03 UTC) corrió con **`6be894ce`**, subido a las 07:49 UTC.

**1 · EL CÓDIGO QUE ARMA EL PROMPT ES EL MISMO, BYTE A BYTE.** Comprobado con una herramienta de un solo uso en
`scratchpad`: se extrajeron de cada commit `medida-f130.ts`, `criterio-del-cumplimiento.ts` y
`lib/analysis/excepcion-de-las-reglas.ts`, y con el código de cada uno se armó el prompt sobre los MISMOS dos textos de
relleno.
- Los dos prompts son idénticos byte a byte: sha256 `293c93ea9242e1a6` y 6.890 caracteres en los dos.
- También son idénticos el criterio recortado (`a29a3e97e1504b6c`), `PREGUNTA_CERRADA`, `PAREJAS_DE_E3` y `TROZOS`. Sólo
  cambia `VECES_DE_E3`, de 7 a 20.
- `excepcion-de-las-reglas.ts` y `criterio-del-cumplimiento.ts` tienen el mismo sha1 en los dos commits.
- Entre los dos commits no cambió nada en `lib/analysis`, `lib/llm`, `lib/read-chunks.ts`, `lib/observability` ni
  `lib/run-in-batches.ts`.

⚠️ **«Sólo cambiaron VECES_DE_E3 y un comentario» no es exacto.** Entre los dos commits, `c17459c6` sacó la llamada al modelo
de `pregunta/route.ts` a `preguntar-al-juez.ts`, y se añadieron la variante limpia y su corte. **Comparada línea a línea, la
llamada es la misma**: las mismas opciones de `callLLM` (`maxOutputTokens`, sin temperatura, `modeloExacto`,
`outputConfig`, la etiqueta), `batchSize: 4`, y la misma llamada a `construirPrompt` con los mismos campos. El lector de
trozos sólo cambió una palabra de un comentario.

**2 · EL TEXTO DE LOS DOS TROZOS: NO SE PUEDE VER DESDE EL CÓDIGO, y queda PENDIENTE de `SQL_34_04`.** El prompt lleva dentro
el texto de NOR-10·4 y CLI-12·3, leído de la base en cada pulsación. La consulta (sólo lectura, PENDIENTE DE EJECUTAR) dice
por cada trozo si su texto es el mismo desde antes de la tercera tanda. Se apoya en que los trozos sólo se insertan y se
borran (censo en su cabecera) y en que cambiar de generación toca `documents.updated_at`. Si no lo puede afirmar, lo dice y
no lo da por bueno. Que las dos tandas gastaran los mismos 4.126 tokens de entrada es coherente con el mismo texto, **pero no
lo prueba.**

**HASTA QUE `SQL_34_04` DIGA «EL TEXTO ES EL MISMO» EN LOS DOS TROZOS, NO SE ESCRIBE NADA QUE SE APOYE EN «NO CAMBIAMOS
NADA»**:
- la conclusión «algo cambió fuera de nuestro prompt, o la varianza es mucho mayor»;
- lo que eso le hace a la decisión de ayer;
- el hallazgo de producto sobre medir la cobertura periódicamente.
Es la instrucción del arquitecto: si los prompts no son idénticos, todo eso sobra. Lo que no depende de la noche, porque
las dos condiciones de esta mañana leyeron la misma base a la misma hora, espera a que lleguen los JSON.

**3 · LA CUENTA PEDIDA** (Fisher exacto bilateral): **4 de 7 (tercera tanda) frente a 20 de 20 (condición 1): p = 0,012.** De
paso: 7 de 7 (variante limpia, 29/10) frente a 20 de 20 (condición 2, 30/10), p = 1.

## SQL_34_04: la salida, literal (ejecutada por el director, 30/10/2026)

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
1 · el trozo,NOR-10 · trozo 4,NOR-10_protocolo-esterilizacion-instrumental.docx · generación activa 1 · documento tocado por última vez: 28/10/2026 07:30:54 UTC,creado 25/10/2026 23:03:10 UTC · 1148 caracteres · md5 84c1022806be48e0db356c35233ef5f9 · contiene su frase: sí,EL TEXTO ES EL MISMO: el trozo existe desde antes de las 18:30 UTC del 29/10 y el documento no se ha tocado desde entonces
1 · el trozo,CLI-12 · trozo 3,CLI-12_manual-calidad-clinica.docx · generación activa 1 · documento tocado por última vez: 26/10/2026 12:00:17 UTC,creado 25/10/2026 23:03:05 UTC · 914 caracteres · md5 0cead8dca4fc4f1a0ae92baf9ca2cfdc · contiene su frase: sí,EL TEXTO ES EL MISMO: el trozo existe desde antes de las 18:30 UTC del 29/10 y el documento no se ha tocado desde entonces
2 · las generaciones,NOR-10,"generación 1: 67 trozos, creados de 25/10 23:03 a 25/10 23:03 UTC",sin versión en espera,null
2 · las generaciones,CLI-12,"generación 1: 55 trozos, creados de 25/10 23:03 a 25/10 23:03 UTC",sin versión en espera,null
```

**QUEDA DEMOSTRADO POR LAS DOS VÍAS: LAS TRES TANDAS MANDARON EL MISMO TEXTO.**
- El código que arma el prompt es idéntico byte a byte en los dos commits desplegados (sección anterior).
- El texto de los dos trozos es el mismo desde el 25/10, y los documentos no se han tocado desde antes de la tercera
  tanda (esta salida).

## LO QUE ESTABA EN ESPERA, CORREGIDO POR EL ARQUITECTO (30/10/2026)

**1 · NO HACE FALTA HABLAR DEL MODELO, y el arquitecto retira esa hipótesis como explicación principal.** Si la tasa real
de este caso es el 90 % (hoy, 36 de 40 con A, exactamente el 90 %), **sacar 4 de 7 ocurre el 2,5 % de las veces**: una
entre cuarenta. El 4 de 7 de anoche es compatible con una tirada desafortunada, sin que cambiara nada fuera.
- **Las dos posibilidades, escritas.** La PARSIMONIOSA: la varianza; con siete tiradas no se veía. La NO NECESARIA: que
  algo cambiara fuera, en el modelo que sirve la API.
- *Comprobado por Code (binomial, n = 7, p = 0,9)*: P(X ≤ 4) = **0,0257**. Cuadra.

**2 · LA PUERTA ESTABA MAL CONSTRUIDA, y es del arquitecto.** Con una tasa real del 90 %, un umbral de «6 de 7 o más» **da un
suspenso falso el 15 % de las veces.**
- *Comprobado por Code*: P(X ≥ 6) = 0,8503, así que el suspenso falso es P(X ≤ 5) = **0,1497**. Cuadra. Con otras tasas
  reales, el mismo umbral suspende en falso:

| Tasa real | Suspenso falso con «6 de 7 o más» |
|---|---|
| 95 % | 4,4 % |
| 90 % | 15,0 % |
| 85 % | 28,3 % |
| 80 % | 42,3 % |

- **POR TANTO, EL VEREDICTO «NO SE CONSTRUYE» QUEDA ANULADO.** No se revisa porque el arquitecto quiera: **se anula porque la
  regla de decisión era inválida.**
- **Y CON SU FECHA: la cuenta se podía haber hecho el 28/10, ANTES de fijar el umbral, y no se hizo.**

**3 · Y LO MISMO INVALIDA EL NÚMERO QUE DEFINE EL PROBLEMA ENTERO**: el «2 de 7» de la lista abierta (la segunda tanda del
3.4, 27/10) **también es de siete tiradas. NUNCA SE HA MEDIDO.** Llevamos una semana resolviendo un problema cuyo tamaño
no conocemos. Va al estado vivo como el pendiente PRINCIPAL.
- ⚠️ *Code corrige la cifra del arquitecto*: escribió que un 2 de 7 es compatible con una tasa real «de entre el 15 % y el
  50 %». Al 95 %, el intervalo es **del 8 % al 64 % (Wilson)**, o **del 4 % al 71 % (exacto, Clopper-Pearson)**. Es más ancho
  que lo escrito, y refuerza el punto.

**4 · AL PROTOCOLO, con el nombre del arquitecto**: un umbral se acompaña de su tasa de falso suspenso, calculada antes de
medir (`claude/Protocolo_Harness_Tasas.md`).

## LA LÍNEA BASE: LA CONSULTA, ANTES QUE LOS ANÁLISIS (30/10/2026)

**El orden del arquitecto**: primero la consulta que cuenta D por pasada, y sólo su CONTROL POSITIVO sobre los datos
viejos de la segunda tanda del 3.4 (27/10, siete pasadas de NOR-10). **No se lanza ningún análisis hasta que el control
esté en verde y el arquitecto lo vea.** Antes del encargo, el director confirmó dos cosas: NOR-10 aparece en la bandeja,
y hoy no ha lanzado ningún análisis.

**`SQL_34_05_d_por_pasada.sql`**, sólo lectura y PENDIENTE DE EJECUTAR.
- **La regla**: hay D en una pasada si se publicó una contradicción con CLI-12 cuya cita de NOR-10 toca la PRIMERA frase de
  2.4, la del permiso. Si la cita sigue en la segunda frase, la pasada sale como DUDOSA.
- **Del lado de CLI-12**: dice si citó el principio de §3.1, §3.5, otra parte de §3.1 u otra cosa.
- **Lo que no se ve, por pasada**:
  - lo muerto en la puerta de citas, que se reconoce porque queda con texto;
  - lo muerto SIN texto en la pareja (verificador, cascada, frontera y puerta sin detalle), aparte lo del verificador
    con la etiqueta.
- **Los literales del corpus** están copiados tal cual de `SQL_34_02` y `SQL_34_03`, por script.
- **Arnés en PGlite**: `claude/arneses/f34/sql-34-05-d-por-pasada.test.ts`, 6 casos.
- **Mutantes**: `claude/arneses/f34/mutantes-sql-34-05.ts`, 28 de 28 en rojo. Los dos que sobrevivían en la primera
  vuelta se mataron con casos nuevos.

⚠️ **Corrección de Code a lo que el arquitecto le atribuyó**: lo que Code dijo que no deja texto es la D matada por el
VERIFICADOR, no por la puerta de citas. La puerta guarda cada descarte con sus dos citas (`judgments[].descartesPorCita`),
y lo que muere ahí se reconoce. Lo que se queda sin texto es lo que tumban el verificador y la cascada, guardado sólo como
número por motivo (`lib/analysis/types.ts:59-61`; el verificador lo funde en el juicio de la pareja, `pipeline.ts:637-639`
y `:653-656`). La consulta cuenta las dos cosas por separado.

**El control positivo: PENDIENTE DEL DIRECTOR.** La ventana de la segunda tanda no está escrita en ningún documento, así que
se mira en el reloj de la base, como con `SQL_34_01`.
