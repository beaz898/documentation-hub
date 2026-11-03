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
3.4, 28/10 por la mañana; aquí decía «27/10», corregido el 30/10) **también es de siete tiradas. NUNCA SE HA MEDIDO.** Llevamos una semana resolviendo un problema cuyo tamaño
no conocemos. Va al estado vivo como el pendiente PRINCIPAL.
- ⚠️ *Code corrige la cifra del arquitecto*: escribió que un 2 de 7 es compatible con una tasa real «de entre el 15 % y el
  50 %». Al 95 %, el intervalo es **del 8 % al 64 % (Wilson)**, o **del 4 % al 71 % (exacto, Clopper-Pearson)**. Es más ancho
  que lo escrito, y refuerza el punto.

**4 · AL PROTOCOLO, con el nombre del arquitecto**: un umbral se acompaña de su tasa de falso suspenso, calculada antes de
medir (`claude/Protocolo_Harness_Tasas.md`).

## LA LÍNEA BASE: LA CONSULTA, ANTES QUE LOS ANÁLISIS (30/10/2026)

**El orden del arquitecto**: primero la consulta que cuenta D por pasada, y sólo su CONTROL POSITIVO sobre los datos
viejos de la segunda tanda del 3.4 (28/10, 08:21-08:30 de Madrid, siete pasadas de NOR-10; aquí decía «27/10», corregido el 30/10). **No se lanza ningún análisis hasta que el control
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

**El arquitecto, con su nombre, 30/10**: la frase «una D matada en la puerta de la cita no se distingue» la escribió él en
el encargo, atribuyéndosela a Code, y no la dijo Code: lo de Code era del VERIFICADOR. **La propagación del error fue del
arquitecto al citar a Code**, y la corrección importa porque se recupera más señal de la que él dijo. Queda en el
protocolo, junto a la regla de que el control positivo es un paso del director.
**Lo que sí se sostiene, según el arquitecto**: el 20 % de las respuestas parafrasea en vez de citar literalmente, y en el
producto la puerta las mataría. ⚠️ *Code, contado sobre los tres JSON de esta mañana*: la pregunta 2 no lleva ninguna cita
literal en **6 de las 60**.

| Tanda | Sin cita literal en la pregunta 2 |
|---|---|
| condición 1 | 0 de 20 |
| condición 1 repetida | 2 de 20 (la 4 y la 14, que además contestan con A) |
| condición 2 | 4 de 20 (la 1, la 2, la 7 y la 15) |

El 20 % es sólo de la condición 2; en las sesenta es el 10 %. Y E3 contesta en texto libre, mientras que el juez del
producto contesta en JSON con campos de cita: **que el juez del producto parafrasee a esa tasa no está medido.** Que la
puerta mataría una paráfrasis sí está en el código: comprueba que la cita esté en el texto entregado.

**`SQL_34_05`, DOS PULSACIONES Y UN SOLO FICHERO (arquitecto, 30/10)**, para que el director no tenga que adivinar la ventana:
- **Con «desde» y «hasta» vacíos, la consulta no mide: lista** todas las pasadas rápidas de NOR-10 de la organización, con
  su fecha y hora de Madrid y su duración, y nada más. De ahí se leen las siete del 27/10.
- **Con la ventana puesta, mide.** Con un solo extremo puesto, mide y el control de la ventana falla.
- El arnés cubre los dos modos, con 7 casos. Los mutantes, ahora 36, incluyen los del modo lista, y salen 36 de 36 en rojo.

## QUÉ TANDA ES CADA GRUPO DE PASADAS, CON EL REFLOG (30/10/2026)

**La lista de pasadas rápidas de NOR-10**, de la primera ejecución de `SQL_34_05`, sin ventana, por el director, en hora de
Madrid:
- 26/10 13:41:23 a 14:01:53: seis pasadas;
- 26/10 23:38:53 a 23:46:36: ocho pasadas;
- 28/10 08:21:39 a 08:30:53: siete pasadas.

Duraciones de 28 a 44 s. **No hay ninguna el 27/10.**

**Cuándo se subió cada commit del 3.4** (reflog de `origin/main`; Madrid era UTC+1 desde el 25/10). Es la hora del push. El
despliegue de Vercel llega minutos después y aquí no consta.

| Push | Madrid | UTC | Lo que llevaba del 3.4 |
|---|---|---|---|
| `f43cae93` | 26/10 17:52:38 | 16:52:38 | `cbe543b6`, fase 1: el campo de la especie llega al sintetizador, sin tocar ningún prompt |
| `c2dbc798` | 26/10 23:22:26 | 22:22:26 | `5ca99f12`, el bloque del juez (fase 2); `c08a02e7`, la rama del verificador (fase 3); `c4d5af05`, los contadores por especie; `86428408` y `ddfa9dcc`, la rama corregida y su lote |
| `1a11616f` | 27/10 16:10:41 | 15:10:41 | `1912469a`, el principio en el bloque del juez; `e946823d`, el principio en la rama; `5c2d50c9`, la cabecera del último punto |

- **El 28/10 no se subió nada.** El push siguiente a `1a11616f` es el del 29/10 a las 12:52 de Madrid. Entre los dos, el
  código del análisis desplegado era el de `1a11616f`. `a241e137`, el registro de los parámetros, que no toca el prompt, se
  hizo el 28/10 a las 14:21 y subió el 29/10.
- **Por tanto, el apunte del arquitecto, «el código del 3.4 se subió el 28/10 sobre las 08:58», es el que está mal.** El
  principio se subió el 27/10 a las 16:10 de Madrid, dieciséis horas antes de las siete pasadas.

**Qué es cada grupo**:
- **Las seis del 26/10 por la tarde (13:41-14:01)** corrieron ANTES de cualquier push del 3.4. Son los análisis de después
  de la purga y la resincronización de OneDrive: el estado vivo del 26/10 dice «NOR-10 y NOR-11 están en la bandeja,
  analizados y SIN INDEXAR, con 6 análisis cada uno». Prompt anterior al 3.4. **No son ninguna de las dos tandas.**
- **Las ocho del 26/10 por la noche (23:38-23:46) son la PRIMERA tanda del 3.4, la del «1 de 8».** Corrieron 16 minutos
  después del push de las fases 2 y 3. Casan con su medida, que dice «8 pasadas de NOR-10» y ventana «del 26/10 a las
  23:00 al 27/10 a las 00:30». Y la propia tanda enseña especies («la pasada 5 de NOR-11 clasificó como
  norma_contra_norma»), que sin la fase 2 desplegada no podían salir.
- **Las siete del 28/10 por la mañana (08:21-08:30) son la SEGUNDA tanda, la del «2 de 7»**, con el prompt del principio,
  desplegado desde el 27/10 a las 16:10. No corrieron el 27/10: las predicciones se escribieron el 27/10, antes de la
  tanda, y la tanda fue a la mañana siguiente.
- **Las dos tandas del 3.4 están en la lista, y ninguna corrió con un prompt anterior al suyo.**

**LA VENTANA DEL CONTROL POSITIVO**: `desde` = `timestamptz '2026-10-28 08:15:00+01'`, `hasta` = `timestamptz '2026-10-28
08:35:00+01'`, `esperado` = `7`. En ese intervalo la lista sólo tiene esas siete.

**Y LA FECHA EQUIVOCADA LA PROPAGÓ CODE**: el «27/10» de la segunda tanda lo escribió Code en la cabecera de `SQL_34_05`,
en esta medida y en el estado, copiándolo del encargo sin mirarlo en el reflog. Está corregido en los cuatro sitios, con
la nota de que decía «27/10».

## EL CONTROL POSITIVO Y LA LÍNEA BASE: LAS DOS SALIDAS DE SQL_34_05, LITERALES (ejecutadas por el director, 30-31/10/2026)

**El control positivo**, con la ventana del 28/10 de 08:15 a 08:35:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 28/10 08:15 a 28/10 08:35 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-10 en la ventana: 7 · esperado: 7,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,la primera frase de 2.4 está dentro de 2.4: carácter 1 a 387 · el principio dentro de §3.1: carácter 142 a 503,OK,null,null
0 · control,"pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 0",OK,null,null
1 · por pasada,pasada 1 · 28/10 08:21:39 · claude-haiku-5-5 · 38 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 2 · 28/10 08:23:35 · claude-haiku-5-5 · 36 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 3 · 28/10 08:24:29 · claude-haiku-5-5 · 41 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 4 · 28/10 08:25:32 · claude-haiku-5-5 · 37 s,D (sin especie),"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 4 · cita de D,sin especie · CLI-12: el principio de §3.1,NOR-10: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico»"
1 · por pasada,pasada 5 · 28/10 08:27:05 · claude-haiku-5-5 · 43 s,D (norma_contra_norma),"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 5 · cita de D,norma_contra_norma · CLI-12: el principio de §3.1,NOR-10: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»"
1 · por pasada,pasada 6 · 28/10 08:29:01 · claude-haiku-5-5 · 38 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 7 · 28/10 08:30:53 · claude-haiku-5-5 · 32 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
2 · el total,D en 2 de 7 pasadas · con la etiqueta: 1 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas","sin texto en la pareja: 0 hallazgos en 0 pasadas, 0 de ellos en pasadas SIN D (con la etiqueta: 0)",null
```

**La línea base**, con la ventana del 30/10 a las 23:40 al 31/10 a las 23:35:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 30/10 23:40 a 31/10 23:35 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-10 en la ventana: 21 · esperado: 20,⚠️⚠️ FALLA,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,la primera frase de 2.4 está dentro de 2.4: carácter 1 a 387 · el principio dentro de §3.1: carácter 142 a 503,OK,null,null
0 · control,"pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 0",OK,null,null
1 · por pasada,pasada 1 · 30/10 23:58:11 · claude-haiku-5-5 · 34 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 2 · 30/10 23:58:58 · claude-haiku-5-5 · 29 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 3 · 30/10 23:59:46 · claude-haiku-5-5 · 33 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 4 · 31/10 00:00:36 · claude-haiku-5-5 · 36 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 5 · 31/10 00:01:22 · claude-haiku-5-5 · 28 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 6 · 31/10 00:02:26 · claude-haiku-5-5 · 50 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 7 · 31/10 00:03:15 · claude-haiku-5-5 · 35 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 8 · 31/10 00:04:07 · claude-haiku-5-5 · 40 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 9 · 31/10 00:04:56 · claude-haiku-5-5 · 35 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 10 · 31/10 00:05:47 · claude-haiku-5-5 · 36 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 11 · 31/10 00:06:49 · claude-haiku-5-5 · 40 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 12 · 31/10 00:07:38 · claude-haiku-5-5 · 38 s,D (sin especie),"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 12 · cita de D,sin especie · CLI-12: el principio de §3.1,NOR-10: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»"
1 · por pasada,pasada 13 · 31/10 00:08:16 · claude-haiku-5-5 · 27 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 14 · 31/10 00:09:02 · claude-haiku-5-5 · 31 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 15 · 31/10 00:09:47 · claude-haiku-5-5 · 32 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 16 · 31/10 00:10:42 · claude-haiku-5-5 · 40 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 17 · 31/10 00:11:34 · claude-haiku-5-5 · 40 s,D (sin especie),"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 17 · cita de D,sin especie · CLI-12: el principio de §3.1,NOR-10: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»"
1 · por pasada,pasada 18 · 31/10 00:12:27 · claude-haiku-5-5 · 41 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 19 · 31/10 00:13:23 · claude-haiku-5-5 · 34 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 20 · 31/10 00:14:23 · claude-haiku-5-5 · 42 s,no,"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 21 · 31/10 00:15:28 · claude-haiku-5-5 · 47 s,D (sin especie),"en la puerta, con texto: 0 · sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 21 · cita de D,sin especie · CLI-12: el principio de §3.1,NOR-10: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico»"
2 · el total,D en 3 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas","sin texto en la pareja: 1 hallazgos en 1 pasadas, 1 de ellos en pasadas SIN D (con la etiqueta: 0)",null
```

**Comprobado por Code contra las dos salidas**:
- **El control positivo, EN VERDE.** Los seis controles salen OK, y la consulta saca **«D en 2 de 7 · con la etiqueta: 1»**:
  reproduce la puntuación a ojo del arquitecto.
  - La D con etiqueta es la de la pasada 5; la otra, la de la 4, va sin especie. Las dos citan el permiso contra el
    principio de §3.1.
  - En esa ventana no murió nada sin texto. Así que el «el verificador mató uno» de la consulta F-130 no ocurrió en NOR-10
    ↔ CLI-12 en la segunda tanda.
- **La línea base: D en 3 de 21**, en las pasadas 12, 17 y 21, **las tres sin especie**. Las tres citan el permiso contra el
  principio de §3.1, y ninguna cita §3.5. La cota sin texto es **1**, en la pasada 8, que no tiene D, y no lleva la
  etiqueta. En la puerta no murió nada.
- **El control del esperado, en rojo: 21 pasadas con el esperado en 20.** El director corrió una más y el control avisó.
  **El número se queda: veintiuna vale más que veinte.**
- El modelo es Haiku 5.5 en todas, y las duraciones van de 27 a 50 s.

## LA CONCLUSIÓN DE LA SEMANA, CON LAS TRES CORRECCIONES DE CODE ACEPTADAS POR EL ARQUITECTO (31/10/2026)

**LA LÍNEA BASE, por pareja y con su n**: «NOR-10 ← CLI-12, D, **3 de 21**», el 14 %; con la cota sin texto, **«3 o 4 de
21»**. Intervalo de Wilson al 95 %: del 5 % al 35 % (con 4, del 8 % al 40 %).

**1 · EL PROBLEMA ES REAL**: D llega al usuario una de cada siete veces.
- *Corrección aceptada*: **«el 2 de 7 era optimista» NO se puede afirmar.** 2 de 7 frente a 3 de 21 da p = 0,574, y los dos
  números no se distinguen. Lo correcto es que **ahora hay un número con intervalo (del 5 % al 35 %) donde antes había
  siete tiradas.**

**2 · LA COMPARACIÓN CRUZA CONDICIONES, y es la corrección grave.** El arquitecto, con su nombre: **ES LA REGLA QUE ESCRIBIÓ
AYER, INCUMPLIDA EN EL MISMO MENSAJE EN QUE LA DABA POR APRENDIDA. Cuarta vez en dos días.**
- **El 14 % es el producto entero**: los primeros 6.000 caracteres de NOR-10, fragmentos de CLI-12, JSON, la puerta de citas
  y el verificador.
- **El 90 % es la herramienta**: dos trozos enteros, texto libre, sin puerta y sin verificador.
- La regla de puntuación es la misma; la condición, distinta.
- **Lo que demuestra el Fisher** (3 de 21 frente a 36 de 40, **p = 5,58 × 10⁻⁹**; con 4 de 21, p = 4,60 × 10⁻⁸): la
  pregunta cerrada ENCUENTRA D muchísimo más de lo que el producto la PUBLICA.
- **Lo que NO demuestra**: que una pasada 2 dentro del producto la publique. **El 90 % es un techo.**

**3 · LA ESPECIE: 0 de 3 en la línea base; sin medir.** No «casi no aparece en el producto real»: son tres casos, y frente al
1 de 2 de la segunda tanda da p = 0,400. Queda como pendiente propio.

**4 · EL LÍMITE, con el nombre del arquitecto**: esto está medido para UN hallazgo, UNA pareja y UN corpus. Que la pasada 2
suba la cobertura EN GENERAL es extrapolación, y no está medido.

**LA JUSTIFICACIÓN PARA CONSTRUIR, reescrita por el arquitecto: cambia de forma, no de fondo.** No es «del 14 % al 90 %». Es
**«hay un hueco grande y medido entre lo que la pregunta cerrada encuentra y lo que el producto publica, y la única manera
de saber cuánto sobrevive al camino es construirlo en sombra y medirlo».** Va al lado de la anulación del umbral, no en su
lugar.

**NO SE CONSTRUYE NADA TODAVÍA**: el plan rehecho lo escribe el arquitecto.

**LA RESPUESTA DE FABLE A LA ADENDA LLEGÓ EL 31/10**, archivada literal como adenda (f) de F-130 (huella `1834bd56ddea1667`).
⚠️ Lo que se le mandó, la adenda del arquitecto con sus «sección 3» y «sección 5», sigue sin archivar.

## LO QUE EL ARQUITECTO DECIDE A PARTIR DE LA RESPUESTA DE FABLE, COTEJADO CONTRA SU TEXTO (31/10/2026)

**1 · La contabilidad del «6 de 7», que es de los dos.** Fable escribió la puerta en F-130, y el arquitecto la adoptó sin
calcular su tasa de suspenso falso: dos fallos, en sitios distintos.
- *Cotejo*: Fable dice «la puerta “6 de 7 o más” la escribí yo en F-130», y cita su «F-117 P2», según el cual una medida
  vale sólo contra su banda de ruido, «y no me lo apliqué al diseñar E3».
- *Su regla nueva*, literal: «ninguna predicción mía con criterio de aceptación lleva n menor que 20, o lleva regla
  secuencial escrita (parar antes solo con 18 de 20 o 10 de 20)». El paréntesis, la regla secuencial concreta, no iba en
  el resumen del arquitecto.

**2 · La especie se queda como TERCER CRITERIO de la pregunta cerrada.** En la pasada 2 la etiqueta no la elige el juez:
la pone la estructura, porque sale de la pregunta 2 y no de la 1. En la pasada 1 es una decisión del juez en lista
abierta.
- *Cotejo*: literal en (b).
- Fable lee el 0 de 3 como confirmación; en la línea base, el 0 de 3 sigue siendo tres casos, sin medir.

**3 · EL VERIFICADOR DEJA DE DEPENDER DE LA MARCA.** Hace las dos preguntas a todo hallazgo, y la etiqueta de la pasada 1
pasa a ser una pista, no una ruta. Con eso, una D emitida sin etiqueta sobrevive al verificador.
- *Cotejo*: literal en (b), «el verificador no puede depender de la marca […] una pista, no una ruta».
- ⚠️ **La convergencia que el arquitecto pidió escribir NO se sostiene tal como la dijo.** La dijo así: «tú encontraste dos
  fugas, el verificador y la puerta de citas, y su respuesta tapa la primera, sin que ninguno supiera del otro». **La
  fuga del verificador la encontró Fable**, el 29/10:
  - está en el estado vivo, en «LO QUE FABLE AÑADIÓ AL LEER LOS PROMPTS (29/10)»: «la ruta la decide una marca del juez»;
  - el propio Fable lo dice: «es la línea de mi respuesta del 29/10».
  - **Lo que Code señaló el 30/10 es otra cosa**: que lo que mata el verificador no deja texto, sólo contadores, y la
    medición no lo ve; y que la puerta mataría una paráfrasis.
  - Así que no son dos hallazgos independientes que convergen: **Fable sigue su propia línea del 29/10, y Code midió lo que
    esa fuga y la puerta dejan sin ver.**

**4 · LA SEGUNDA FUGA, CON DISPARADOR**: si la paráfrasis en la pasada 2 pasa del 5 %, se activa la vía 2 de F-125,
aplicada a la pasada 2.
- *Cotejo*: literal en (b).
- La vía 2 de F-125 existe y es la de los punteros: «(A) Punteros — tu vía 2, hoy en 3.4», con su disparador escrito, en
  `claude/consultas-fable/F-125_2026-10-12_el-empalme.md`.
- El 10 % de paráfrasis es de la herramienta, en texto libre; en JSON con campos de cita no está medido, y Fable lo dice
  igual.

**5 · LOS CRITERIOS DE ACTIVACIÓN, EN VEINTES Y NO EN CINCOS. SUSTITUYEN A P-F130-10**:
- D en 16 de 20 o más;
- cada una de las seis vivas en 19 de 20 o más;
- falsos en el caso de control, 0 de 20.
*Cotejo*: literal en (c).

**6 · LA LÍNEA BASE, POR PAREJA Y CON SU n**: «NOR-10 ← CLI-12, D, 3 de 21». Es lo que convierte «cobertura medida» en una
frase con contenido: **hoy el 14 %, objetivo escrito el 80 % o más.**
- *Cotejo*: literal en (c).

**7 · EL LÍMITE SE RESUELVE CON E5 SOBRE LAS TRES PAREJAS CON SIEMBRA, VEINTE PASADAS CADA UNA, ANTES DE ACTIVAR.** Eso es lo
que distingue «sube la cobertura en general» de «sube D en esta pareja». Es la curva que no se corrió.
- *Cotejo*: literal en (c).
- Fable no nombra cuáles son las tres parejas; eso va en el plan.

**NO SE CONSTRUYE NADA TODAVÍA: el plan rehecho lo escribe el arquitecto con esto delante.**

## LA LÍNEA BASE POR HALLAZGO: SQL_34_06, Y LAS PAREJAS CON SUS TROZOS (31/10/2026)

**El paso 1 del plan rehecho (arquitecto, 31/10)**: las 21 pasadas de la línea base publicaron todo lo que encontraron, y
`SQL_34_05` sólo contó D porque sólo buscaba D. **`SQL_34_06_hallazgos_por_pasada.sql`** (sólo lectura, PENDIENTE DE
EJECUTAR) cuenta, con la misma regla, A, B, C y D en NOR-10 y el quinto conflicto en NOR-11. Cero análisis, cero
créditos.
- **Es una consulta nueva y no una edición de `SQL_34_05`**: ésa está ejecutada y sus salidas archivadas.
- **Para D usa la misma regla**, y su arnés corre las dos sobre los mismos datos y exige que D salga igual. En la base, sobre
  las mismas ventanas, D tiene que dar 2 de 7 (28/10) y 3 de 21 (30-31/10): ése es su control positivo.
- **Un borde en que difieren, y no se dio en la base**: una pasada con una D limpia y una dudosa con etiqueta. `SQL_34_05`
  contaba la etiqueta, y ésta no.
- **La cota sin texto se guarda por PAREJA, no por caso**: sale una vez por pasada, y no se puede repartir entre A, B, C
  y D.
- **Arnés**: `claude/arneses/f34/sql-34-06-hallazgos-por-pasada.test.ts`, 10 casos.
- **Mutantes**: 33 de 33 en rojo. Los cuatro que sobrevivían en la primera vuelta se mataron con casos nuevos: una cita
  corta, la etiqueta de una dudosa, la lista con exhaustivas y la puerta de un caso encontrado.

**De dónde salen las frases y los trozos.** No de memoria: del registro de siembra
(`corpus-pruebas/SIEMBRA_corpus_ampliado.md` §1, y el estado vivo del 25/10 para el quinto) y del texto troceado con el
mismo código de la indexación (`extractSegments` + `chunkSegments`, herramienta de un solo uso).
- **Control del troceado**:
  - 67 trozos en NOR-10 y 55 en CLI-12, como dice la base (`SQL_34_04`);
  - D en NOR-10·4, el principio en CLI-12·3 y §3.5 en CLI-12·6, los tres medidos contra Pinecone el 29/10 (P-F130-9);
  - el párrafo de 2.4 es, byte a byte, el literal que ya usa `SQL_34_05`.
- **NOR-11 da 15 trozos**, y eso no está comprobado contra la base. El trozo 13 del quinto coincide con la lectura del
  25/10 del estado vivo.

| Caso | Documento analizado | CLI-12 | Notas |
|---|---|---|---|
| **A** | NOR-10·2 (§2.1, «El responsable último del cumplimiento…») | CLI-12·3 (§3.1, «El responsable último de la esterilización…») | el juez cita A también con la SEGUNDA frase de §2.4, en NOR-10·4 |
| **B** | NOR-10·36 (§10.2, «…semanalmente, todos los lunes…») | CLI-12·34 (§12.1, «…periodicidad mensual…») | CLI-12·38 repite «periodicidad mensual» al justificar §12.1 |
| **C** | NOR-10·58 (§13.4, «…6 meses…») | CLI-12·51 (§16.2, «…12 meses…») | |
| **D** | NOR-10·4 (§2.4, primera frase) | CLI-12·3 (§3.1, el principio) y CLI-12·6 (§3.5) | no sembrada |
| **el quinto** | NOR-11·13 (§10.5) | CLI-12·13 (§6.2) | no sembrado |

**Lo que el arquitecto pidió que se dijera**: B y C NO caen en el par de trozos de A y D, y cada una tiene el suyo. **La que
comparte es A**: su forma de la segunda frase de §2.4 vive en NOR-10·4 ↔ CLI-12·3, la misma pareja de trozos que D. Su
forma sembrada, §2.1, está en otra (NOR-10·2 ↔ CLI-12·3). Para el enumerador son, por tanto:
- 2↔3 y 4↔3 para A, la segunda compartida con D;
- 4↔6 para D por §3.5;
- 36↔34 (y quizá 36↔38) para B;
- 58↔51 para C;
- 13↔13 en NOR-11 para el quinto.

⚠️ **Una precisión sobre E5 «tres parejas, veinte pasadas cada una»**: una pasada es un análisis de un DOCUMENTO, y un
análisis de NOR-10 lleva a la vez A, B, C y D. Así que E5 son **20 análisis de NOR-10, que cuentan los cuatro casos, más 20
de NOR-11 para el quinto: 40, no 80.**

**Las pasadas de NOR-11 que hay en la base, por lo escrito, sin haberlas visto**:
- 6 del 26/10 por la tarde, con el prompt anterior al 3.4;
- 7 de la primera tanda, el 26/10 por la noche, con las fases 2 y 3 pero sin el principio.
- Si la segunda tanda, la del 28/10, llevó también pasadas de NOR-11, como decía su montaje («cinco pasadas de NOR-10 y
  siete de NOR-11»), **ésas serían las únicas con el prompt de hoy**.
- La primera pulsación de `SQL_34_06` con `documento = 'NOR-11'` y sin ventana las lista, y de ahí se ve si hay línea base
  gratis del quinto. Con el prompt de antes no valdría como línea base de hoy.

**Lo que tiene que pulsar el director, cuando suban los commits**:
1. `SQL_34_06` con la ventana de la línea base (`desde` = `'2026-10-30 23:40:00+01'`, `hasta` = `'2026-10-31 23:35:00+01'`),
   `esperado` = `21` y `documento` = `'NOR-10'`. En verde si D sale «3 de 21 · con la etiqueta: 0». Da A, B y C.
2. `SQL_34_06` con `documento` = `'NOR-11'` y sin ventana: la lista de pasadas de NOR-11.

## LA LÍNEA BASE POR HALLAZGO EN NOR-10: LA SALIDA DE SQL_34_06, LITERAL (ejecutada por el director, 31/10/2026)

Ventana del 30/10 a las 23:40 al 31/10 a las 23:35, esperado 21, documento NOR-10:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 30/10 23:40 a 31/10 23:35 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-10 en la ventana: 21 · esperado: 21,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,"casos de NOR-10: A, B, C, D · frases dentro de su párrafo: 5 de 5",OK,null,null
0 · control,"pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 0",OK,null,null
1 · por pasada,pasada 1 · 30/10 23:58:11 · claude-haiku-5-5 · 34 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 1 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 1 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 1 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 2 · 30/10 23:58:58 · claude-haiku-5-5 · 29 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 2 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 2 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 2 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 3 · 30/10 23:59:46 · claude-haiku-5-5 · 33 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 3 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 3 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 3 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 4 · 31/10 00:00:36 · claude-haiku-5-5 · 36 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 4 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 4 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 4 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 5 · 31/10 00:01:22 · claude-haiku-5-5 · 28 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 5 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 5 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora,»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes,»"
1 · por pasada,pasada 5 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 6 · 31/10 00:02:26 · claude-haiku-5-5 · 50 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 6 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 6 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 6 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 7 · 31/10 00:03:15 · claude-haiku-5-5 · 35 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 7 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 7 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»",CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual»
1 · por pasada,pasada 7 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 8 · 31/10 00:04:07 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 8 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 8 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 8 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 9 · 31/10 00:04:56 · claude-haiku-5-5 · 35 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 9 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 9 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 9 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 10 · 31/10 00:05:47 · claude-haiku-5-5 · 36 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 10 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 10 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 10 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 11 · 31/10 00:06:49 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 11 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 11 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora, mediante indicador biológico»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes, mediante indicador biológico»"
1 · por pasada,pasada 11 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 12 · 31/10 00:07:38 · claude-haiku-5-5 · 38 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 12 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 12 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 12 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 12 · cita de D,sin especie · CLI-12: el principio de §3.1,cita del documento: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»"
1 · por pasada,pasada 13 · 31/10 00:08:16 · claude-haiku-5-5 · 27 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 13 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 13 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 13 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 14 · 31/10 00:09:02 · claude-haiku-5-5 · 31 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 14 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 14 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 14 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 15 · 31/10 00:09:47 · claude-haiku-5-5 · 32 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 15 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 15 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 15 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 16 · 31/10 00:10:42 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 16 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 16 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 16 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 17 · 31/10 00:11:34 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 17 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 17 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 17 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 17 · cita de D,sin especie · CLI-12: el principio de §3.1,cita del documento: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico, gestiona simultáneamente la agenda asistencial»"
1 · por pasada,pasada 18 · 31/10 00:12:27 · claude-haiku-5-5 · 41 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 18 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 18 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 18 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 19 · 31/10 00:13:23 · claude-haiku-5-5 · 34 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 19 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 19 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 19 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 20 · 31/10 00:14:23 · claude-haiku-5-5 · 42 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 20 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 20 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 20 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 21 · 31/10 00:15:28 · claude-haiku-5-5 · 47 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 21 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 21 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 21 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 21 · cita de D,sin especie · CLI-12: el principio de §3.1,cita del documento: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «separar la responsabilidad de un proceso crítico de seguridad del paciente de la persona que, en su rol de Director Clínico»"
2 · el total,A en 21 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,B en 21 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,C en 21 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,D en 3 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,"sin texto en la pareja, que no se reparte por caso: 1 hallazgos en 1 pasadas (con la etiqueta, del verificador: 0)",null,null,null
```

**Comprobado por Code contra la salida** (con un script sobre el texto archivado, no a ojo):
- **Los seis controles salen OK.** D sale «3 de 21 · con la etiqueta: 0», lo mismo que `SQL_34_05` sobre la misma ventana: **el
  control positivo de `SQL_34_06` está en verde, y la consulta nueva queda validada.**
- **La tabla** (21 pasadas por caso; intervalo de Wilson al 95 %):

| Caso | Encontrado | Con la etiqueta | Intervalo |
|---|---|---|---|
| A | 21 de 21 | 0 | del 85 % al 100 % |
| B | 21 de 21 | 0 | del 85 % al 100 % |
| C | 21 de 21 | 0 | del 85 % al 100 % |
| D | 3 de 21 | 0 | del 5 % al 35 % |

- Cota sin texto: 1, en la pasada 8. Nada muerto en la puerta. Dudosas: 0.
- **Las 21 citas de A son de §2.1** («El responsable último del cumplimiento de este protocolo…»), en NOR-10·2. **Ninguna es
  de la segunda frase de §2.4.** Del lado de CLI-12, las 21 citan la frase de A de §3.1.

**EL ENUNCIADO DEL PROBLEMA, del arquitecto, que sustituye a todas las formulaciones anteriores**: «EL SISTEMA ENCUENTRA EL 100 %
DE LAS CONTRADICCIONES DE DATO Y EL 14 % DE LAS INFERENCIALES, con 21 pasadas por caso.»
- ⚠️ *Code, al lado*: el enunciado pasa de casos a clases. Son tres contradicciones de dato y una inferencial, en una
  pareja y un corpus, y es la regla de la extrapolación del 30/10. La forma que sostienen los datos es ésta: **en NOR-10 ↔
  CLI-12, con 21 pasadas por caso, las tres contradicciones de dato sembradas (A, B y C) salen las 21 veces, y la
  inferencial (D), 3 de 21.**
- El quinto conflicto, de dato pero bajo otro nombre, todavía no está medido.
- **01/11: el arquitecto toma literal la redacción de Code** como enunciado del problema, y la suya queda sustituida, no borrada:
  generalizaba de casos a clases, que es la regla que él escribió el 30/10 (quinto caso del patrón, en el protocolo).

**LO QUE NO SE INFLA, con el nombre del arquitecto, porque la tentación era suya**: los cuatro salen sin especie, y para A, B y
C eso es CORRECTO, porque son contradicciones de dato y por contrato no llevan especie. **El hallazgo de la especie sigue
siendo «0 de 3», el de D, y no «0 de 66».** Contarlo como 66 habría sido el mismo error de toda la semana.

**LO QUE SIGNIFICA QUE A SE CITE SIEMPRE POR §2.1** (pregunta del arquitecto; lectura de Code):
- **En la pasada 1, A y D salen de trozos distintos de NOR-10**: A del 2, D del 4. En el producto, el juez nunca usa la forma
  de A que vive en el trozo 4.
- **Pero eso NO separa a A y a D en la pasada 2.** El enumerador forma parejas de TROZOS, por vecindad y por términos
  compartidos, y no por dónde citó la pasada 1. **La pareja NOR-10·4 ↔ CLI-12·3 lleva dentro, por su texto, la segunda frase
  de §2.4 y la frase de A de §3.1**, cite el juez lo que cite en la pasada 1. Así que la pregunta cerrada sobre esa pareja
  tendrá A delante, que es exactamente la condición en que se midió el 90 %. **La medición conserva su sentido para la
  pasada 2, porque midió la pareja tal como el enumerador la entregará.** Lo que cambia es el sentido de «A dentro»: no es la
  A que el producto publica, es la A que vive en ese trozo.
- **⚠️ Y UNA CONSECUENCIA NUEVA PARA EL PLAN, que antes no se veía**: si la pasada 2 encuentra A en NOR-10·4 ↔ CLI-12·3, la
  encontrará con la cita de la segunda frase de §2.4, y la pasada 1 la publicó con la de §2.1.
  - Con «desduplicación por posición de cita», tal como está en el plan, **serían dos hallazgos distintos, y el usuario
    vería A dos veces.**
  - O el filtro de lo ya cubierto, o la desduplicación, tienen que reconocer que son el mismo hallazgo aunque la cita sea
    otra.
  - Va al plan como requisito, y no se decide aquí.
- **01/11, el arquitecto confirma las dos cosas**: esta lectura es la correcta, y la suya («en la pasada 2 A y D caerían en
  parejas distintas») queda retirada. Y el requisito de la desduplicación entra en el punto 3 del plan (estado vivo).

## LAS PASADAS RÁPIDAS DE NOR-11: LA LISTA SIN VENTANA DE SQL_34_06, LITERAL (ejecutada por el director, 31/10/2026)

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 1 · 26/10/2026 13:28:43 (hora de Madrid),39 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 2 · 26/10/2026 13:30:24 (hora de Madrid),44 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 3 · 26/10/2026 13:31:58 (hora de Madrid),31 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 4 · 26/10/2026 13:35:04 (hora de Madrid),39 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 5 · 26/10/2026 13:37:07 (hora de Madrid),41 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 6 · 26/10/2026 14:38:04 (hora de Madrid),44 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 7 · 26/10/2026 23:29:26 (hora de Madrid),39 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 8 · 26/10/2026 23:32:32 (hora de Madrid),43 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 9 · 26/10/2026 23:33:49 (hora de Madrid),43 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 10 · 26/10/2026 23:34:51 (hora de Madrid),41 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 11 · 26/10/2026 23:35:46 (hora de Madrid),42 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 12 · 26/10/2026 23:36:40 (hora de Madrid),37 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 13 · 26/10/2026 23:37:46 (hora de Madrid),46 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 14 · 28/10/2026 08:33:20 (hora de Madrid),42 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 15 · 28/10/2026 08:34:17 (hora de Madrid),40 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 16 · 28/10/2026 08:35:39 (hora de Madrid),47 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 17 · 28/10/2026 08:36:30 (hora de Madrid),40 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 18 · 28/10/2026 08:43:47 (hora de Madrid),38 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 19 · 28/10/2026 08:44:49 (hora de Madrid),46 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 20 · 28/10/2026 08:45:43 (hora de Madrid),41 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 21 · 28/10/2026 08:46:37 (hora de Madrid),42 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 22 · 28/10/2026 08:47:24 (hora de Madrid),34 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 23 · 28/10/2026 08:48:53 (hora de Madrid),36 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 24 · 28/10/2026 08:49:57 (hora de Madrid),47 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 25 · 28/10/2026 08:52:24 (hora de Madrid),40 s,null,null
0 · sin ventana: las pasadas rápidas de NOR-11,pasada 26 · 28/10/2026 08:55:12 (hora de Madrid),40 s,null,null
```

**Qué es cada grupo**, con los pushes del 3.4 (sección «QUÉ TANDA ES CADA GRUPO DE PASADAS»):
- **Las 6 del 26/10, de 13:28 a 14:38**, son anteriores a cualquier push del 3.4, el primero a las 17:52. Son las de después de la
  purga, con el prompt anterior.
- **Las 7 del 26/10, de 23:29 a 23:37**, son la primera tanda, después del push de las fases 2 y 3 (23:22). ⚠️ La primera corrió
  **siete minutos** después del push, y si el despliegue de Vercel ya había terminado no consta aquí. Las de NOR-10 de esa
  tanda empezaron 16 minutos después.
- **Las 13 del 28/10, de 08:33:20 a 08:55:12**, son la segunda tanda: después del push del principio (27/10, 16:10) y antes
  del siguiente (29/10). **Son las únicas con el prompt de hoy.** El montaje decía «siete de NOR-11» y fueron 13; las de
  NOR-10 de esa misma tanda fueron 7, de 08:21 a 08:30.

**LA VENTANA DEL QUINTO, comprobada contra la lista**: `desde` = `timestamptz '2026-10-28 08:30:00+01'`, `hasta` =
`timestamptz '2026-10-28 09:00:00+01'`, `esperado` = `13`, `documento` = `'NOR-11'`. En esa media hora la lista sólo tiene las
13. Es la ventana que propuso el arquitecto, y es correcta.
- ~~*Por comprobar*~~ **Comprobado el 01/11**: la consulta da el quinto en 5 de 13 y la etiqueta en 1 de esas 5, igual que la consulta
  F-130 (sección «EL QUINTO EN NOR-11», más abajo).

## EL QUINTO EN NOR-11: LA SALIDA DE SQL_34_06 CON VENTANA, LITERAL (ejecutada por el director, 01/11/2026)

Parámetros: `documento` = `'NOR-11'`, `desde` = `timestamptz '2026-10-28 08:30:00+01'`, `hasta` =
`timestamptz '2026-10-28 09:00:00+01'`, `esperado` = `13`. La salida, como llegó:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 28/10 08:30 a 28/10 09:00 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-11 en la ventana: 13 · esperado: 13,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,casos de NOR-11: quinto · frases dentro de su párrafo: 1 de 1,OK,null,null
0 · control,"pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 4",⚠️⚠️ FALLA,null,null
1 · por pasada,pasada 1 · 28/10 08:33:20 · claude-haiku-5-5 · 42 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 2 · 28/10 08:34:17 · claude-haiku-5-5 · 40 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 3 · 28/10 08:35:39 · claude-haiku-5-5 · 47 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 3 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área.»"
1 · por pasada,pasada 4 · 28/10 08:36:30 · claude-haiku-5-5 · 40 s,quinto: no,"sin texto en la pareja: 1 (con la etiqueta, del verificador: 1)",null
1 · por pasada,pasada 5 · 28/10 08:43:47 · claude-haiku-5-5 · 38 s,quinto: sí (norma_contra_norma),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 5 · cita de quinto,norma_contra_norma · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área.»"
1 · por pasada,pasada 6 · 28/10 08:44:49 · claude-haiku-5-5 · 46 s,quinto: no,"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 7 · 28/10 08:45:43 · claude-haiku-5-5 · 41 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 8 · 28/10 08:46:37 · claude-haiku-5-5 · 42 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 9 · 28/10 08:47:24 · claude-haiku-5-5 · 34 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 9 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio»"
1 · por pasada,pasada 10 · 28/10 08:48:53 · claude-haiku-5-5 · 36 s,quinto: no,"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 11 · 28/10 08:49:57 · claude-haiku-5-5 · 47 s,quinto: no,"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 12 · 28/10 08:52:24 · claude-haiku-5-5 · 40 s,quinto: sí (sin especie),"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 12 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red»"
1 · por pasada,pasada 13 · 28/10 08:55:12 · claude-haiku-5-5 · 40 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 13 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio.»"
2 · el total,quinto en 5 de 13 pasadas · con la etiqueta: 1 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,"sin texto en la pareja, que no se reparte por caso: 5 hallazgos en 5 pasadas (con la etiqueta, del verificador: 1)",null,null,null
```

**Comprobado con script sobre la salida pegada** (no a ojo):
- Las 13 pasadas de la ventana son las pasadas 14 a 26 de la lista sin ventana: las 13 tienen la misma hora y la misma
  duración.
- **El quinto, en 5 de 13**: pasadas 3, 5, 9, 12 y 13. **Con la etiqueta, 1**: la pasada 5 (`norma_contra_norma`).
  Dudosas, 0. Muertas en la puerta con texto, 0.
- **Agujeros** (juicio de CLI-12 sin `discarded`): pasadas 1, 2, 7 y 8. El control 6 FALLA por esas cuatro.
- **Muertos sin texto en la pareja**, uno por pasada: en las pasadas 4, 6, 10, 11 y 12. La de la pasada 4 lleva la
  etiqueta y la mató el verificador. La pasada 12 tiene además el quinto publicado.
- No hay ninguna pasada sin el quinto que no tenga a la vez un agujero o un muerto sin texto.
- **Por dónde ancla el quinto en CLI-12** (las dos frases están en el trozo 13): «…no como auditor de su propia área» en
  las pasadas 3 y 5; «Las auditorías internas las realiza siempre…» en las pasadas 9, 12 y 13. Cada pasada tiene una sola
  cita del quinto. La frase de NOR-11 es siempre la misma, y siempre sin el punto final.
- **La cota**: 5 publicadas. Como mucho, 13 emitidas: a las 5 se suman los muertos sin texto de las pasadas sin el quinto
  (la 4, la 6, la 10 y la 11) y los 4 agujeros. Si los agujeros son ceros de verdad (el juicio salió sin descartes), el
  máximo es 9. Si son caídas del juez, es 13. Ningún muerto sin texto se puede atribuir al quinto: van por pareja, no por
  caso.
  ⚠️ *Sustituida el 01/11 (arquitecto)*: «hasta 13 emitidas» no es el dato. El dato es que el quinto NO TIENE
  DENOMINADOR: ningún negativo limpio, y la tasa entre 5 y 13 de 13. Más abajo, «Lo que dice la salida del quinto».

**Por qué falta `discarded`**, leído en el código y SIN tocar nada: se omite a propósito cuando está vacío
(`lib/analysis/judge.ts:602` y `:969`, y la unión en `lib/analysis/pipeline.ts:717`). Cuando el juez falla, el juicio
vuelve vacío y tampoco lo lleva (`judge.ts:1017`, `recordStageFailure('judge', err)`). **Con lo guardado, el control 6
no distingue «vacío» de «el juez se cayó»**: cuenta como agujero cualquier ausencia. Lo que sí los distingue está en la
base (`analysis.stageFailures` con stage `judge`, y en `llamadasAlModelo` el resultado de la llamada del juez a la pareja
de CLI-12), pero ninguna consulta lo ha leído todavía.

### Lo que dice la salida del quinto, leído por el arquitecto y por Code (01/11/2026)

- ⚠️⚠️ **NO ES UNA TASA: ES UN SUELO (arquitecto).** Code lo había escrito sin darle su peso: no hay ninguna pasada sin el
  quinto que esté limpia. El arquitecto lo comprobó en la salida. **Cinco «sí» limpios y ocho «no sé», ni un solo
  negativo limpio.** Las ocho pasadas sin el quinto:
  - la 1, la 2, la 7 y la 8, sin registro de descartes;
  - la 4, la 6, la 10 y la 11, con un muerto sin texto cada una.
  La tasa no está medida: está entre 5 de 13 y 13 de 13. Si `SQL_34_07` (PENDIENTE DE EJECUTAR) da las cuatro sin
  registro como cero real, queda entre 5 y 9 de 13.
- **D, para comparar, sí tiene denominador** (recuento de Code sobre la salida de NOR-10 de más arriba, con un script).
  En las 21 pasadas: 3 con D; 17 negativos limpios (con «discarded» y sin muertos sin texto); 1 «no sé» (la pasada 8,
  un muerto sin texto); 0 sin registro (su control 6 sale OK). 3 + 17 + 1 = 21. Su 3 de 21 es una tasa, y lleva su
  cota: **«3 de 21, hasta 4 de 21»**, por la pasada 8. Es el único número firme de la semana 0.
- **«Muertas en la puerta, con texto: 0 pasadas» (arquitecto)**: la puerta es la única etapa que conserva el texto, y
  no se reconoce en ella ninguna muerte del quinto. ⚠️ *Con el alcance de la columna (Code)*: cuenta las pasadas en que
  el CASO murió en la puerta, reconocido por su frase. Lo que la puerta mató de otros hallazgos de la pareja no sale en
  esta consulta. Lo que se sostiene es: **si el quinto murió en alguna pasada, no fue en la puerta con texto; fue sin
  texto, donde no se le puede reconocer.** Eso corrige a la baja lo que el arquitecto esperaba recuperar de la puerta.
  En NOR-10 la misma columna da 0 para A, B, C y D.
  **«Todas las muertes son ciegas», RETIRADO por el arquitecto (01/11)**: «me pasé de la columna». Se adopta literal la
  versión de Code: «si el quinto murió en alguna pasada, no fue en la puerta con texto».
- ✅ **CONTROL VERDE**: las cinco citas del quinto dicen «CLI-12: fuera de §3.1 y §3.5». El quinto no es A ni D citadas
  de nuevo.
- **El modelo**: las 13 pasadas corrieron con `claude-haiku-5-5`. La columna sale de `lecturaDeLasParejas` de la pareja
  con CLI-12, es decir, es el modelo del JUEZ en esa pareja; del resto de etapas no dice nada. Es una parte del
  inventario de modelos por etapa.
- **El lado de NOR-11 es la misma frase, palabra por palabra, en las cinco**: la frase de §10.5 hasta «…y de los
  gabinetes», sin el resto de la frase. Lo único que cambia es la frase de CLI-12 (las dos en §6.2, trozo 13).
- **La pasada 12** publicó el quinto y además tuvo un muerto sin texto. Una segunda emisión del quinto por la otra
  frase es **compatible con lo observado**: no es un hecho, ni un riesgo sólo teórico.
- **Lo que no se sabe de la etiqueta muerta**: el muerto sin texto de la pasada 4 llevaba la etiqueta y lo mató el
  verificador. De qué hallazgo era no consta: va por pareja, no por caso.

**EL CASI-FALLO DE CODE, CON SU DETECCIÓN (01/11)**: el CSV que Code analizó primero no lo copió de lo que pegó el
director. Lo montó con lo que tenía en sus notas, después de una compactación de la conversación, y con él sacó las
comprobaciones de arriba. Antes de archivarlo se dio cuenta de dónde venía, sacó el mensaje literal del registro de la
conversación y lo comparó línea a línea. **Coincidían las 28 líneas**, y lo que está archivado arriba es el texto
pegado, no el montado. Si no hubieran coincidido, el análisis entero se habría tenido que rehacer. La regla de la casa
—los textos que faltan no se reconstruyen— se estaba incumpliendo sin saberlo, y lo único que lo paró fue preguntar de
dónde venía el texto antes de archivarlo.

## EL AGUJERO DE «discarded» EN EL QUINTO: LA SALIDA DE SQL_34_07, LITERAL (ejecutada por el director, 01/11/2026)

Parámetros: `documento` = `'NOR-11'`, ventana del 28/10 de 08:30 a 09:00 (+01), `esperado` = `13`. La salida, como llegó.
El director la pegó dentro del mensaje: por pegada aparte no había llegado. Code la sacó del registro de la conversación
con un script, no la copió a mano:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 28/10 08:30 a 28/10 09:00 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-11 en la ventana: 13 · esperado: 13,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,pasadas con el registro por llamada: 13 de 13 · que pasaron su guarda de 200: 0,OK,null,null
0 · control,CONTROL POSITIVO · pasadas con «discarded» y una petición del juez a CLI-12 con 200: 9 de 9,OK,null,null
1 · por pasada,pasada 1 · 28/10 08:33:20,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 7
1 · por pasada,pasada 2 · 28/10 08:34:17,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 10
1 · por pasada,pasada 3 · 28/10 08:35:39,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 2 · únicos 10
1 · por pasada,pasada 4 · 28/10 08:36:30,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 2 % · contradicciones 0 · solapes 0 · únicos 10
1 · por pasada,pasada 5 · 28/10 08:43:47,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 1 · únicos 7
1 · por pasada,pasada 6 · 28/10 08:44:49,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 8 % · contradicciones 0 · solapes 2 · únicos 6
1 · por pasada,pasada 7 · 28/10 08:45:43,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 10
1 · por pasada,pasada 8 · 28/10 08:46:37,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 8
1 · por pasada,pasada 9 · 28/10 08:47:24,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 1 · únicos 8
1 · por pasada,pasada 10 · 28/10 08:48:53,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 0 · solapes 1 · únicos 8
1 · por pasada,pasada 11 · 28/10 08:49:57,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 0 · solapes 2 · únicos 10
1 · por pasada,pasada 12 · 28/10 08:52:24,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 1 · únicos 7
1 · por pasada,pasada 13 · 28/10 08:55:12,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 4 % · contradicciones 1 · solapes 2 · únicos 10
2 · el total,agujeros: 4 · cero real: 4 · juez caído: 0 · no se distingue: 0 · no se sabe: 0,null,null,null
```

**Comprobado con script sobre la salida**:
- Seis controles, los seis OK. **El control positivo, 9 de 9.**
- **Las cuatro pasadas sin «discarded», la 1, la 2, la 7 y la 8, son CERO REAL**: el juicio no es el de reserva.
- **Las 13 pasadas**: una petición del juez a CLI-12, con 200, y ninguna caída del juez.
- **Los cuatro cero real tienen el mismo juicio**: «sin_relacion · solape 0 %», sin contradicciones ni solapes, y con
  7, 10, 10 y 8 únicos. **El juez no vio relación con CLI-12 en esa pareja y no emitió nada**, así que no hubo nada que
  descartar (arquitecto: coherente).
- Las otras nueve llevan «tema_similar», con solapes del 2 al 8 %.

**CONSECUENCIA: LAS PASADAS 1, 2, 7 Y 8 PASAN A NEGATIVOS LIMPIOS. El quinto ya tiene denominador**: 5 hallados, 4
negativos limpios y 4 «no sé» (la 4, la 6, la 10 y la 11, con un muerto sin texto cada una). **Entre 5 y 9 de 13.**

### Las cuentas (arquitecto y Code, 01/11; las dos correcciones de Code, aceptadas)

Wilson al 95 % y Fisher exacto bilateral, calculados con un script:

| | Wilson al 95 % | Fisher frente a D (3 de 21) |
|---|---|---|
| D, 3 de 21 | 5,0 % a 34,6 % | — |
| D con su cota, 4 de 21 | 7,7 % a 40,0 % | — |
| el quinto, 5 de 13 | 17,7 % a 64,5 % | p = 0,211 |
| el quinto, 6 de 13 | 23,2 % a 70,9 % | p = 0,057 |
| el quinto, 7 de 13 | 29,1 % a 76,8 % | p = 0,022 |
| el quinto, 8 de 13 | 35,5 % a 82,3 % | p = 0,008 |
| el quinto, 9 de 13 | 42,4 % a 87,3 % | p = 0,002 |
| A, B o C, 21 de 21 | 84,5 % a 100 % | — |

- **Si un caso es peor que el otro: NO SE PUEDE AFIRMAR NI NEGAR.** Depende de los cuatro «no sé», y ninguna consulta
  los puede atribuir. A 5 de 13 no hay diferencia con D; a 6 de 13, p = 0,057; a partir de 7 de 13, sí la hay.
- **Los dos están por debajo de A, B y C, sin el «muy»**: el quinto a 9 de 13 frente a 21 de 21 da p = 0,015, así que
  la diferencia se afirma. Pero los intervalos se tocan (87,3 % y 84,5 %), y el adjetivo no se sostiene. Para D, frente
  a 21 de 21, p < 0,0001.

### El glosario de CLI-12 y la remisión de NOR-11, verificados (Code, 01/11)

Verificados contra `corpus-pruebas/` con el código de la indexación (`extractSegments` y `chunkSegments`). Control: 55
trozos en CLI-12 y 15 en NOR-11, como en la base. **Contra el texto guardado en la base NO está verificado**: queda
pendiente, CON DISPARADOR, para el día que algo se apoye en el glosario (arquitecto). Ningún documento del repositorio
había usado antes el §4.

- **CLI-12 §4, «Definiciones», trozo 7**: «Auditoría interna: revisión sistemática y planificada de un proceso,
  realizada por personal de la propia organización, con el fin de verificar su cumplimiento y detectar oportunidades
  de mejora.»
- **CLI-12 §4, trozos 8 y 9**: «Estas definiciones son vinculantes para la interpretación de cualquier otro documento
  del sistema de calidad de Dentavia, incluidos los protocolos clínicos y operativos de cada área.»
- **CLI-12 §4, trozo 9**: «En caso de conflicto terminológico entre este manual y un protocolo operativo concreto,
  prevalece la definición de este manual a efectos de indicadores y auditoría de calidad, sin perjuicio de que el
  protocolo operativo mantenga su propia terminología técnica específica para la ejecución diaria del proceso.»
- **CLI-12 §6.2, «Equipo auditor», trozo 13**: «Las auditorías internas las realiza siempre personal ajeno al área
  auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de
  criterio. El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como
  auditor de su propia área.»
- **NOR-11 §10.5, «Revisión periódica de buenas prácticas», trozo 13**: «El Coordinador de Calidad de cada clínica
  revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del
  área de almacenamiento intermedio y de los gabinetes, incorporando los hallazgos relevantes a la siguiente sesión de
  formación anual del personal.»
- **NOR-11 §11, «Relación con otros documentos», trozo 14** (la pieza que encontró Code): «También se relaciona con el
  protocolo de desinfección de superficies, de aplicación conjunta ante derrames, y con el manual de calidad CLI-12,
  que establece el enfoque de auditoría aplicable a este proceso, igual que ocurre con el resto de procesos críticos de
  seguridad de la clínica.»

⚠️⚠️ **HALLAZGO DE TROCEADO (arquitecto: «hallazgo de troceado, no nota»), con la corrección de Code sobre CÓMO está la
frase de «vinculantes».** La frase no está PARTIDA entre los trozos 8 y 9: está ENTERA EN LOS DOS. El §4 se subdividió
por longitud y el solape la repite (`lib/chunking.ts`, solape de 200 sólo dentro de una subdivisión por longitud; la
entrada «Revisión por la dirección» también sale en el 7 y en el 8). Code había escrito «en el borde entre los dos», y
esa frase floja es la que leyó el arquitecto como «partida». **El hallazgo se sostiene igual, y es éste: ningún trozo
tiene a la vez la definición y lo que la hace vinculante.** La definición está en el 7, la obligatoriedad en el 8 y el
9, y la cláusula que arbitra, con su excepción, sólo en el 9. Y las dos mitades del quinto van en otros trozos: NOR-11·13
y CLI-12·13. Una comparación por parejas de trozos no tiene nunca la definición, su fuerza vinculante y las dos mitades
a la vez.

### La lectura del arquitecto, comprobada, y la contraria (01/11)

**Encaja cláusula por cláusula con la definición del §4** (Code):
- «revisión»: «revisa»;
- «sistemática y planificada»: «trimestralmente», sobre «los criterios descritos en este apartado»;
- «de un proceso»: el almacenamiento y los gabinetes;
- «por personal de la propia organización»: el Coordinador de Calidad de cada clínica;
- «para verificar su cumplimiento»: «revisa… el cumplimiento»;
- «detectar oportunidades de mejora»: los hallazgos van a la formación.
Con la definición, NOR-11 §10.5 es una auditoría interna, y CLI-12 §6.2 la contradice: «siempre personal ajeno al
área», «no como auditor de su propia área». **Y NOR-11 §11 se remite a CLI-12 para el enfoque de auditoría de este
proceso.**

**LA LECTURA CONTRARIA, DEFENDIBLE, Y LA CLÁUSULA NO DECIDE LIMPIAMENTE** (Code; el arquitecto la acepta y retira «tiene
que pelear contra el propio manual»). Tres argumentos:
1. La cláusula que arbitra trae su excepción: prevalece el manual «a efectos de indicadores y auditoría de calidad»,
   pero «sin perjuicio de que el protocolo operativo mantenga su propia terminología técnica específica para la
   ejecución diaria del proceso». Una «revisión periódica de buenas prácticas» por «observación directa» puede ser
   justo esa terminología de la ejecución diaria.
2. El §6 describe las auditorías internas con un calendario anual, tipos (6.1) e informe con plazo (6.3), y NOR-11
   §10.5 no tiene nada de eso: puede ser supervisión, no auditoría.
3. La definición del §4, leída al pie de la letra, convierte en auditoría cualquier supervisión periódica.

**¿Sigue siendo un caso de dato? Sí** (Code; el arquitecto lo creía). El dato es quién revisa o audita este proceso:
el coordinador propio en NOR-11; «siempre personal ajeno al área» en CLI-12. Son dos valores para el mismo dato, y el
glosario es lo que une los dos nombres de la actividad.
⚠️ *Lo que no se sabe* (Code): en las cinco pasadas en que salió el quinto, la cita de CLI-12 es siempre de §6.2,
nunca del §4. Que el juez lo hallara POR el glosario no consta. Pudo bastarle saber, sin el glosario, que revisar el
cumplimiento es auditar.
**Y DE AHÍ LA RETIRADA DEL ARQUITECTO (01/11)**: retira «el paso está escrito en el glosario y lo que el sistema no hace
es usar el glosario». El modelo encuentra el quinto sin usar el glosario: **el glosario no es el paso que falta, es la
corroboración que un revisor humano usaría.** Y la premisa de que el juez tuvo los dos documentos enteros delante, en
estas 13 pasadas y en las 21 de D, quedó SIN VERIFICAR hasta `SQL_34_08`. ✅ **Verificada el 02/11: 34 de 34** (sección
«LO QUE RECIBIÓ EL JUEZ», más abajo).

## LO QUE RECIBIÓ EL JUEZ: LA SALIDA DE SQL_34_08, LITERAL (ejecutada por el director, 02/11/2026)

Las dos mediciones van rellenas en la consulta: D (NOR-10, del 30/10 a las 23:40 al 31/10 a las 23:35, 21 pasadas) y el
quinto (NOR-11, 28/10 de 08:30 a 09:00, 13 pasadas). El arquitecto la pegó dentro de su mensaje: por pegada aparte no
había llegado. Code la sacó del registro de la conversación con un script, no la copió a mano:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,D · pasadas de NOR-10 en su ventana: 21 · esperado: 21,OK,null,null
0 · control,el quinto · pasadas de NOR-11 en su ventana: 13 · esperado: 13,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno) · generación 1: 55 trozos · activa: 1,OK,null,null
0 · control,pasadas sin UNA lectura de la pareja con CLI-12: 0,OK,null,null
0 · control,CONTROL POSITIVO · caracteres de CLI-12 en la lectura: 55135 (tienen que ser 55135) · de NOR-10: 66801 (tienen que ser 66801) · de NOR-11: 14704 (tienen que ser 14704),OK,null,null
1 · por pasada,D · pasada 1 · 30/10 23:58:11,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 2 · 30/10 23:58:58,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 3 · 30/10 23:59:46,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 4 · 31/10 00:00:36,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 5 · 31/10 00:01:22,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 6 · 31/10 00:02:26,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 7 · 31/10 00:03:15,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 8 · 31/10 00:04:07,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 9 · 31/10 00:04:56,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 10 · 31/10 00:05:47,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 11 · 31/10 00:06:49,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 12 · 31/10 00:07:38,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 13 · 31/10 00:08:16,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 14 · 31/10 00:09:02,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 15 · 31/10 00:09:47,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 16 · 31/10 00:10:42,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 17 · 31/10 00:11:34,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 18 · 31/10 00:12:27,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 19 · 31/10 00:13:23,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 20 · 31/10 00:14:23,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,D · pasada 21 · 31/10 00:15:28,LOS DOS ENTEROS,"NOR-10: 66801 de 66801 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 1 · 28/10 08:33:20,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 2 · 28/10 08:34:17,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 3 · 28/10 08:35:39,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 4 · 28/10 08:36:30,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 5 · 28/10 08:43:47,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 6 · 28/10 08:44:49,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 7 · 28/10 08:45:43,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 8 · 28/10 08:46:37,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 9 · 28/10 08:47:24,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 10 · 28/10 08:48:53,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 11 · 28/10 08:49:57,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 12 · 28/10 08:52:24,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
1 · por pasada,el quinto · pasada 13 · 28/10 08:55:12,LOS DOS ENTEROS,"NOR-11: 14704 de 14704 caracteres · CLI-12: 55135 de 55135 caracteres, 55 de 55 trozos",régimen pareja_entera · selección — · dejó fuera: false / false
2 · el total,D (NOR-10 ↔ CLI-12): los dos enteros en 21 de 21 pasadas,"el juez tuvo delante todo NOR-10 y todo CLI-12, con el §4 (trozos 7 a 9) y §6.2 (trozo 13)",null,null
2 · el total,el quinto (NOR-11 ↔ CLI-12): los dos enteros en 13 de 13 pasadas,"el juez tuvo delante todo NOR-11 y todo CLI-12, con el §4 (trozos 7 a 9) y §6.2 (trozo 13)",null,null
```

⚠️ **LOS NÚMEROS DE TROZO DE ESTA FRASE NO ESTÁN VERIFICADOS (Code y arquitecto, 03/11).** «trozos 7 a 9» y «trozo 13» van
ESCRITOS A MANO en `SQL_34_08` (sus líneas 23 y 163): la consulta no los saca de la base, y salen del troceado local de
Code y de la siembra. **Lo que NO toca**: la premisa se apoya en las cuentas de caracteres y de trozos (55 de 55, 55.135 de
55.135); si el documento entró entero, sus apartados entraron, y «el fallo no está en buscar ni en entregar» aguanta
intacta. **Lo que SÍ toca**: el número de trozo de cada apartado, y con él el paso 3, donde el número de trozo selecciona
el texto que se mide. De ahí el ensayo de la herramienta, que lee el trozo de la base y comprueba su frase.

**Comprobado con script sobre la salida**:
- Seis controles, los seis OK. El control positivo da 55.135, 66.801 y 14.704, las tres cifras medidas por Code el 02/11.
- Las 21 de D y las 13 del quinto: **LOS DOS ENTEROS** en todas. NOR-10 66.801 de 66.801, NOR-11 14.704 de 14.704,
  CLI-12 55.135 de 55.135 con 55 de 55 trozos, régimen `pareja_entera`, dejó fuera false / false.
- Las 21 horas de D y las 13 del quinto son las de `SQL_34_06`, pasada a pasada.
- La selección sale «—»: el campo `seleccion` no está guardado en esas lecturas. No cambia nada: con el candidato
  entero, todos los trozos fueron.

**CONSECUENCIAS (arquitecto, 02/11)**:
- **La premisa «los dos documentos enteros delante» queda VERIFICADA, 34 de 34.**
- **LA SEMANA 0 SE CIERRA CON ESO: EL FALLO NO ESTÁ EN BUSCAR NI EN ENTREGAR, ESTÁ EN PREGUNTAR.**
- **El dato que cierra la retirada del glosario**: el §4 estuvo delante del juez las 13 veces, y en las 5 en que publicó
  el quinto la cita de CLI-12 fue siempre de §6.2. No es que no pudiera verlo: lo tenía y no lo usó.

### Las cláusulas de prelación del corpus, buscadas (Code, 02/11/2026)

Al montar la adenda, una frase propuesta decía que CLI-12 §4 era «la única cláusula de prelación del corpus». Code la
buscó antes de que saliera: el texto extraído por la indexación de los 20 documentos del corpus que están en el
repositorio (`corpus-pruebas/`), con vocabulario de prelación («prevalece», «vinculante», «en caso de conflicto /
discrepancia», «tiene prioridad», «deroga»…). **La organización tiene 45 documentos y aquí hay 20: los otros 25 no se
han mirado.** Lo encontrado, literal:

- **CLI-12 §4** (trozos 8 y 9), las dos ya conocidas: «Estas definiciones son vinculantes…» y «En caso de conflicto
  terminológico entre este manual y un protocolo operativo concreto, prevalece la definición de este manual…».
- **CLI-12 §3.4, «Resolución de conflictos de criterio»** (trozo 5), entre PERSONAS y no entre documentos: «Cuando el
  Coordinador de Calidad y el Director Clínico de un centro discrepan sobre una decisión relativa a un proceso de
  seguridad del paciente, prevalece el criterio del Coordinador de Calidad en las materias descritas en el apartado
  3.1, sin perjuicio de que el Director Clínico pueda elevar la discrepancia al comité de calidad de la red…».
- **CLI-12 §12.9, «Diferencias de criterio entre documentos de la red»** (trozo 39): «Dentavia es consciente de que los
  protocolos operativos de cada área […] y los manuales de calidad […] pueden en ocasiones establecer criterios
  formulados de manera distinta para un mismo aspecto del proceso. Cuando el comité de calidad de la red detecta una
  diferencia de este tipo entre un protocolo operativo y este manual, la resuelve expresamente en la siguiente revisión
  documental programada, dejando constancia de qué criterio prevalece y por qué, en lugar de dejar ambos documentos
  vigentes con formulaciones distintas de forma indefinida.»
- **NOR-11 §11, «Relación con otros documentos»** (trozo 14, el mismo de la remisión a CLI-12): «Este protocolo se
  complementa con la guía práctica CLI-13, dirigida al personal de gabinete, que traduce estos criterios a instrucciones
  de uso diario sin modificar en ningún caso lo aquí establecido. En caso de cualquier discrepancia aparente entre ambos
  documentos, prevalece siempre el criterio de NOR-11.» **Es la pareja del caso de control** (NOR-11 ↔ CLI-13, PLAZO,
  LUGAR y NEGACIÓN): el propio corpus dice cuál de las dos versiones vale.

**Así que «la única cláusula de prelación del corpus» es falsa** incluso en la parte medida: entre documentos hay, al
menos, la de CLI-12 §4, la de §12.9 y la de NOR-11 §11. No se ha medido si el producto usa alguna.

### ¿Usa el producto la prelación? Lo medido sobre lo archivado (Code, 02/11/2026)

Encargo del arquitecto: en las tandas archivadas del caso de control (NOR-11 ↔ CLI-13), ¿menciona algún hallazgo
publicado la prelación de NOR-11 §11, o cualquier otra? Y ¿hay algo en el pipeline que busque cláusulas de prelación?
Sin arreglar nada.

**LO QUE YA SABÍA LA CASA, y desde el 27/08**: la prelación del caso de control está escrita en
`corpus-pruebas/SIEMBRA_caso_control.md` §C.1, «La coartada jerárquica», con tres frases: NOR-11:19 («…sin alterar en
ningún caso los criterios establecidos en el presente documento»), NOR-11:84 («En caso de cualquier discrepancia
aparente entre ambos documentos, prevalece siempre el criterio de NOR-11») y **CLI-13:17** («No sustituye a NOR-11:
ante cualquier duda no resuelta aquí, es ese protocolo el que se consulta en primer lugar»). Se registró como RIESGO:
«un modelo puede leerla como "no hay contradicción, hay jerarquía"», y «las confirmaciones se logran PESE a eso»
(también en `claude/Casos_Harness.md` y en `examen/casos/P2_residuos_prosa.mjs`). Lo nuevo del 02/11 no es la
cláusula: es leerla como un recurso para RESOLVER los hallazgos (arquitecto). La CLI-13:17 no salió en la búsqueda
por vocabulario de la sección anterior: el «al menos tres» de allí es una cota inferior.

**1 · EN EL PIPELINE**: ninguna etapa busca cláusulas de prelación. El censo:
`grep -rn -i "prelaci|prevalec|prevalen|vinculant|precedence|prevail|jerarqu"` sobre `lib`, `app` y `worker`, sin las
pruebas, da tres resultados y ninguno es de prelación entre documentos: dos prompts que dicen que las reglas de
honestidad «prevalecen» sobre las convenciones de la organización (`lib/rag.ts:370`, `lib/agent/runner-conv.ts:490`) y
un comentario del cliente del modelo (`lib/llm/anthropic-client.ts:47`).

**2 · EN LO ARCHIVADO**. Un hallazgo publicado sólo puede mencionarla en su `topic`, que escribe el modelo, o en sus dos
citas literales: no tiene un campo de explicación (`lib/analysis/tipos-del-analisis-publicado.ts`, `discrepancies`).
Los dos conjuntos archivados con texto de esta pareja:
- **El examen del 27/09** (`examen/resultados/2026-09-27_c39397e7/P2_pasada1..5.json`, cinco pasadas de NOR-11): **1
  hallazgo publicado con CLI-13 en las cinco** (pasada 1, tema «Fecha de última revisión», que no es de las sembradas),
  y **0 que mencionen la prelación**. **PERO EL PRODUCTO SÍ LA VIO: en las cinco pasadas publicó un SOLAPAMIENTO que la
  describe**, con las propias frases de prelación como evidencia. Por ejemplo, la pasada 2: «Ambos documentos
  establecen que NOR-11 es el protocolo normativo y CLI-13 es su traducción práctica para el gabinete, sin alterar los
  criterios de NOR-11», con la evidencia «No sustituye a NOR-11: ante cualquier duda no resuelta aquí, es ese protocolo
  el que se consulta en primer lugar». La leyó como algo que los dos documentos comparten, no como lo que resuelve sus
  contradicciones.
- **Las diez pasadas del 06 al 08/10** (`claude/Medida_B357_destino_contradicciones_NOR11_CLI13.md`): 13 contradicciones
  sobrevivieron en el juicio de CLI-13. De ellas sólo están archivados los TEMAS, no las citas: «Plazo máximo de
  almacenamiento de residuos grupo III», «Color del contenedor para residuos grupo III no punzantes» y «Contenedor para
  residuos grupo III no punzantes». **Ninguno menciona la prelación.**
- **Lo que no está archivado y no se ha mirado**: las citas de esas diez pasadas, y todas las pasadas posteriores con
  CLI-13 (entre ellas las cinco del 24/10). Están en la base, y una consulta de sólo lectura lo cerraría.

**Cuántas de las tres sembradas encuentra el producto depende de la condición** (para no escribir «de forma
fiable» sin su conjunto): 2 de 3 el 27/08 (`SIEMBRA_caso_control.md` §D); en las diez pasadas del 06 al 08/10, las
tres sólo en 3 de 10 (B.357); en las cinco del 24/10, 3 de 3 en las cinco (cifra del arquitecto, de las salidas de
`SQL_313_01`, en el estado).

**LA LECTURA (arquitecto, 02/11), sobre la medición de Code**: el producto NO es ciego a la prelación. No le falta
extraerla: le **falta el cable** entre «esto es un solapamiento» y «esto resuelve aquella contradicción». Y «se
complementan» ya es media coartada jerárquica. El conjunto sobre el que se dice: las cinco pasadas del examen del
27/09 (un solo hallazgo publicado con CLI-13, no sembrado) y las diez del 06 al 08/10 (13 contradicciones, ningún tema
que la mencione, sólo temas archivados). Lo posterior, sin mirar. Y sólo para las cláusulas de NOR-11 y CLI-13: si el
producto lee las de CLI-12 (§4 y §12.9) como solapamiento, no está medido.
**La restricción estructural**: un hallazgo publicado no tiene campo libre donde explicar una prelación; sólo el tema y
las dos citas literales (`lib/analysis/tipos-del-analisis-publicado.ts`, `discrepancies`). Ponerle al lado la cláusula
que lo resuelve es, como mínimo, un campo nuevo.

## LA TANDA DEL VERIFICADOR NUEVO, DÍA 1 (NOR-10): LA LISTA DE SQL_34_09 SIN VENTANAS, LITERAL (ejecutada por el director, 02/11/2026)

El arquitecto la pegó dentro de su mensaje. Code la sacó del registro de la conversación con un script, no la copió a mano:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 1 · 02/11/2026 17:54:03 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 2 · 02/11/2026 17:55:08 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 3 · 02/11/2026 17:56:03 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 4 · 02/11/2026 17:56:54 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 5 · 02/11/2026 17:57:53 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 6 · 02/11/2026 17:58:59 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 7 · 02/11/2026 18:03:32 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 8 · 02/11/2026 18:05:55 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 9 · 02/11/2026 18:07:05 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 10 · 02/11/2026 18:08:07 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 11 · 02/11/2026 18:10:11 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 12 · 02/11/2026 18:14:49 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 13 · 02/11/2026 18:16:36 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 14 · 02/11/2026 18:19:03 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 15 · 02/11/2026 18:20:13 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 16 · 02/11/2026 18:21:16 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 17 · 02/11/2026 18:24:17 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 18 · 02/11/2026 18:25:06 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 19 · 02/11/2026 18:26:22 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 20 · 02/11/2026 18:27:48 (hora de Madrid),con el verificador nuevo,null,null
0 · sin ventana: las pasadas rápidas desde el 02/11,NOR-10 · pasada 21 · 02/11/2026 18:29:41 (hora de Madrid),con el verificador nuevo,null,null
```

**Comprobado con script**: 21 pasadas de NOR-10 y ninguna de NOR-11. Las 21 llevan el verificador nuevo (el contador
`verificador.confirmados_solo_por_cumplimiento`), de 17:54:03 a 18:29:41, y las 21 caen dentro de la ventana de 17:54:00 a
18:30:00. No hay ninguna otra pasada rápida de NOR-10 desde el 02/11. **Son 21 y se puntúan las 21** (arquitecto): el n coincide
con la línea base de D. Los umbrales para n = 21, escritos antes de mirar nada, están en
`claude/Predicciones_34_Conflicto_Normativo.md`.
**Las ventanas para puntuar**: `SQL_34_06` con `'NOR-10'`, de `2026-11-02 17:54:00+01` a `2026-11-02 18:30:00+01` y 21
esperadas; `SQL_34_09` con la fila 3 en esa misma ventana y 21, y la fila 4 (NOR-11) con una ventana vacía y 0 esperadas
hasta que exista su tanda (mañana, 21 pasadas, después de la 01:00).

## LA TANDA DEL VERIFICADOR NUEVO, DÍA 1 (NOR-10): SQL_34_09 CON LA VENTANA (ejecutada por el director, 02/11/2026)

Ventana de NOR-10 de `2026-11-02 17:54:00+01` a `18:30:00+01` con 21 esperadas; NOR-11 con una ventana vacía y 0. El
arquitecto la pegó dentro de su mensaje y Code la sacó del registro de la conversación con un script:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,línea base · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,línea base · NOR-11 · pasadas en su ventana: 13 · esperado: 13,OK,null,null
0 · control,tanda nueva · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,tanda nueva · NOR-11 · pasadas en su ventana: 0 · esperado: 0,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,CONTROL POSITIVO · pasadas de la tanda nueva con el contador nuevo (corrieron con el verificador nuevo): 21 de 21,OK,null,null
0 · control,pasadas de la línea base con el contador nuevo (tienen que ser 0): 0,OK,null,null
1 · por medición,línea base · NOR-10 · 21 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas (sin el contador: anterior al cambio),"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 105 hallazgos que llegaron al verificador",por pasada: 0.00 sin veredicto
1 · por medición,línea base · NOR-11 · 13 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas (sin el contador: anterior al cambio),"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 55 hallazgos que llegaron al verificador",por pasada: 0.00 sin veredicto
1 · por medición,tanda nueva · NOR-10 · 21 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas,"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 106 hallazgos que llegaron al verificador",por pasada: 0.00 sin veredicto
1 · por medición,tanda nueva · NOR-11 · 0 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas (sin el contador: anterior al cambio),"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 0 hallazgos que llegaron al verificador",null
"2 · sin_veredicto, nueva frente a base",NOR-10,línea base: 0 de 105 en 21 pasadas · tanda nueva: 0 de 106 en 21 pasadas,igual,null
"2 · sin_veredicto, nueva frente a base",NOR-11,línea base: 0 de 55 en 13 pasadas · tanda nueva: 0 de 0 en 0 pasadas,igual,null
3 · el total de la tanda nueva,confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 de 21 pasadas,null,null,null
```

**Comprobado con script**: los 7 controles, OK, incluidos los dos positivos (21 de 21 de la tanda nueva con el contador, 0
de la línea base). En la tanda nueva de NOR-10: `verificador.confirmados_solo_por_cumplimiento` = 0; `descartado.sin_veredicto`
= 0 de 106 hallazgos entrantes, frente a 0 de 105 en la base: «igual».
⚠️ **Esta consulta no dice nada de D**: ni cuántas veces se publicó, ni en qué pasada, ni con qué especie. Eso lo da
`SQL_34_06`, y **su salida no ha llegado a Code** (02/11, 19:27).

## LA TANDA DEL VERIFICADOR NUEVO, DÍA 1 (NOR-10): SQL_34_06, LA SALIDA ENTERA (ejecutada por el director, 02/11/2026)

Ventana de `2026-11-02 17:54:00+01` a `18:30:00+01`, 21 esperadas. El arquitecto la pegó entera dentro de su mensaje (la
vez anterior había llegado un extracto, y un extracto no es la salida). Code la sacó del registro de la conversación con
un script:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 02/11 17:54 a 02/11 18:30 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-10 en la ventana: 21 · esperado: 21,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,"casos de NOR-10: A, B, C, D · frases dentro de su párrafo: 5 de 5",OK,null,null
0 · control,"pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 0",OK,null,null
1 · por pasada,pasada 1 · 02/11 17:54:03 · claude-haiku-5-5 · 38 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 1 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 1 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 1 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 2 · 02/11 17:55:08 · claude-haiku-5-5 · 41 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 2 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 2 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 2 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 3 · 02/11 17:56:03 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 3 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 3 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 3 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 4 · 02/11 17:56:54 · claude-haiku-5-5 · 38 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 4 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 4 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 4 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 5 · 02/11 17:57:53 · claude-haiku-5-5 · 46 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 5 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 5 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 5 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 6 · 02/11 17:58:59 · claude-haiku-5-5 · 32 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 6 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 6 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 6 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 7 · 02/11 18:03:32 · claude-haiku-5-5 · 31 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 7 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 7 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 7 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 8 · 02/11 18:05:55 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 8 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 8 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 8 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 9 · 02/11 18:07:05 · claude-haiku-5-5 · 34 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 9 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 9 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 9 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 10 · 02/11 18:08:07 · claude-haiku-5-5 · 38 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 10 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 10 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 10 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 11 · 02/11 18:10:11 · claude-haiku-5-5 · 36 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 11 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 11 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 11 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 12 · 02/11 18:14:49 · claude-haiku-5-5 · 38 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 12 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 12 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 12 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 13 · 02/11 18:16:36 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 13 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 13 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 13 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 14 · 02/11 18:19:03 · claude-haiku-5-5 · 34 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 14 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 14 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 14 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 15 · 02/11 18:20:13 · claude-haiku-5-5 · 39 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 15 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 15 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 15 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 16 · 02/11 18:21:16 · claude-haiku-5-5 · 36 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 16 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 16 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 16 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 17 · 02/11 18:24:17 · claude-haiku-5-5 · 40 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 17 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 17 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora, mediante indicador biológico»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes, mediante»"
1 · por pasada,pasada 17 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 18 · 02/11 18:25:06 · claude-haiku-5-5 · 29 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 18 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 18 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 18 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 19 · 02/11 18:26:22 · claude-haiku-5-5 · 48 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 19 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 19 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 19 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 19 · cita de D,sin especie · CLI-12: §3.5,cita del documento: «figura que puede recaer en el propio Director Clínico o en otro profesional designado por él»,"CLI-12: «nunca por el Director Clínico del propio centro, precisamente para mantener la separación de funciones descrita en el apartado 3.1»"
1 · por pasada,pasada 20 · 02/11 18:27:48 · claude-haiku-5-5 · 35 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 20 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico»"
1 · por pasada,pasada 20 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «El control biológico del autoclave se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 20 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «el material esterilizado y envasado se considera válido durante un periodo máximo de 12 meses desde su esterilización»
1 · por pasada,pasada 21 · 02/11 18:29:41 · claude-haiku-5-5 · 33 s,A: sí (sin especie) · B: sí (sin especie) · C: sí (sin especie) · D: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 21 · cita de A,"sin especie · CLI-12: §3.1, fuera del principio",cita del documento: «El responsable último del cumplimiento de este protocolo en cada centro es el Director Clínico de la clínica correspondiente.»,"CLI-12: «El responsable último de la esterilización del instrumental en cada clínica es el Coordinador de Calidad del centro, no el Director Clínico.»"
1 · por pasada,pasada 21 · cita de B,sin especie · CLI-12: fuera de §3.1 y §3.5,"cita del documento: «El control biológico del autoclave se realiza semanalmente, todos los lunes a primera hora»","CLI-12: «se realiza con periodicidad mensual, el primer día laborable de cada mes»"
1 · por pasada,pasada 21 · cita de C,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «mantiene su esterilidad durante un máximo de 6 meses desde la fecha de esterilización impresa en la etiqueta»,CLI-12: «se considera válido durante un periodo máximo de 12 meses desde su esterilización»
2 · el total,A en 21 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,B en 21 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,C en 21 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,D en 1 de 21 pasadas · con la etiqueta: 0 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,"sin texto en la pareja, que no se reparte por caso: 0 hallazgos en 0 pasadas (con la etiqueta, del verificador: 0)",null,null,null
```

**Comprobado con script** (02/11, 19:48): 6 de 6 controles OK, con 0 pasadas sin «discarded»; 21 pasadas. **A, B y C, en 21 de
21**, todas sin especie. **D, en 1 de 21: la pasada 19**, sin especie, con la cita de CLI-12 en §3.5. Ningún muerto sin texto
en la pareja, y **ninguna etiqueta en toda la salida**.

## EL COSTE DE LA TANDA DEL VERIFICADOR NUEVO: SQL_34_10, LA SALIDA ENTERA (ejecutada por el director, 02/11/2026)

Las tres ventanas rellenas y la de NOR-11 nueva vacía. Llegó en un mensaje aparte, sin texto alrededor, y Code la sacó del
registro de la conversación con un script:

```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,línea base · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,tanda nueva · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,línea base · NOR-11 · pasadas en su ventana: 13 · esperado: 13,OK,null,null
0 · control,tanda nueva · NOR-11 · pasadas en su ventana: 0 · esperado: 21 (sin ventana todavía: no se mide),NO APLICA,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,pasadas sin registro por llamada (su coste no se puede medir): 0,OK,null,null
0 · control,peticiones con un modelo que no está en la tabla de precios: 0,OK,null,null
0 · control,pasadas con peticiones fuera del detalle o sin etapa (las cifras por etapa no serían el total): 0,OK,null,null
0 · control,CONTROL POSITIVO · pasadas medidas con alguna petición del verificador: 55 de 55,OK,null,null
1 · por medición,línea base · NOR-10 · 21 pasadas,coste medio por análisis 0.031515 $ (de 0.025901 a 0.040039) · total 0.661821 $,verificador: 0.011599 $ por análisis · 36.8 % del coste · 1.19 peticiones por análisis · latencia media por petición 1435 ms,"duración media del análisis 33.7 s, con la espera (la columna de SQL_34_06, sin espera ni origen: 36.6 s) · espera media por análisis 0.99 s · peticiones que no salieron bien: 0 de 109"
1 · por medición,tanda nueva · NOR-10 · 21 pasadas,coste medio por análisis 0.033229 $ (de 0.028531 a 0.040537) · total 0.697800 $,verificador: 0.013314 $ por análisis · 40.1 % del coste · 1.19 peticiones por análisis · latencia media por petición 1821 ms,"duración media del análisis 34.4 s, con la espera (la columna de SQL_34_06, sin espera ni origen: 37.5 s) · espera media por análisis 1.34 s · peticiones que no salieron bien: 0 de 109"
1 · por medición,línea base · NOR-11 · 13 pasadas,coste medio por análisis 0.030208 $ (de 0.025468 a 0.035011) · total 0.392710 $,verificador: 0.010118 $ por análisis · 33.5 % del coste · 1.69 peticiones por análisis · latencia media por petición 1066 ms,"duración media del análisis 39.5 s, con la espera (la columna de SQL_34_06, sin espera ni origen: 40.9 s) · espera media por análisis 1.18 s · peticiones que no salieron bien: 0 de 74"
2 · por etapa,línea base · NOR-10,juez,0.013514 $ por análisis · 42.9 % del coste,2.00 peticiones por análisis
2 · por etapa,línea base · NOR-10,verificador,0.011599 $ por análisis · 36.8 % del coste,1.19 peticiones por análisis
2 · por etapa,línea base · NOR-10,rerank,0.004910 $ por análisis · 15.6 % del coste,1.00 peticiones por análisis
2 · por etapa,línea base · NOR-10,sintesis,0.001492 $ por análisis · 4.7 % del coste,1.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,juez,0.013461 $ por análisis · 40.5 % del coste,2.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,verificador,0.013314 $ por análisis · 40.1 % del coste,1.19 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,rerank,0.004965 $ por análisis · 14.9 % del coste,1.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,sintesis,0.001489 $ por análisis · 4.5 % del coste,1.00 peticiones por análisis
2 · por etapa,línea base · NOR-11,juez,0.011533 $ por análisis · 38.2 % del coste,2.00 peticiones por análisis
2 · por etapa,línea base · NOR-11,verificador,0.010118 $ por análisis · 33.5 % del coste,1.69 peticiones por análisis
2 · por etapa,línea base · NOR-11,rerank,0.006917 $ por análisis · 22.9 % del coste,1.00 peticiones por análisis
2 · por etapa,línea base · NOR-11,sintesis,0.001640 $ por análisis · 5.4 % del coste,1.00 peticiones por análisis
3 · nueva frente a base,NOR-10,coste medio por análisis: 0.031515 → 0.033229 $ (+5.4 %),verificador: 0.011599 → 0.013314 $ (+14.8 %),"duración media, con la espera: 33.7 → 34.4 s · espera media: 0.99 → 1.34 s"
```

**Comprobado con script** (02/11, 22:27): 8 controles OK, más el de NOR-11 nueva, que da NO APLICA; el control positivo, 55 de
55. NOR-10: **0,031515 → 0,033229 $ (+0,001714 $, +5,4 %)**. El verificador, **0,011599 → 0,013314 $ (+0,001715 $): el 100 % del
aumento**. El juez, 0,013514 → 0,013461 $, igual. Duración, 33,7 → 34,4 s; espera, 0,99 → 1,34 s; 0 peticiones fallidas de 109.

## LA TANDA DEL VERIFICADOR NUEVO, DÍA 2 (NOR-11): LAS CUATRO SALIDAS, LITERALES (ejecutadas por el director, 03/11/2026)

21 pasadas rápidas de NOR-11 el 03/11, de 08:13:48 a 08:50:23, todas con el verificador nuevo. Ventana de `SQL_34_06` y
`SQL_34_07`, de 08:13 a 08:51, con 21 esperadas; `SQL_34_09` y `SQL_34_10`, con las cuatro ventanas. El arquitecto las pegó
dentro de su mensaje, y Code las sacó del registro de la conversación con un script, una por una.

**SALIDA 1 · SQL_34_06, NOR-11**
```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 03/11 08:13 a 03/11 08:51 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-11 en la ventana: 21 · esperado: 21,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,casos de NOR-11: quinto · frases dentro de su párrafo: 1 de 1,OK,null,null
0 · control,"pasadas sin juicio de CLI-12, o con él pero sin «discarded» guardado: 5",⚠️⚠️ FALLA,null,null
1 · por pasada,pasada 1 · 03/11 08:13:48 · claude-haiku-5-5 · 41 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 2 · 03/11 08:15:40 · claude-haiku-5-5 · 38 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 3 · 03/11 08:16:56 · claude-haiku-5-5 · 49 s,quinto: sí (norma_contra_norma),"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 3 · cita de quinto,norma_contra_norma · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área.»"
1 · por pasada,pasada 4 · 03/11 08:19:16 · claude-haiku-5-5 · 55 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 5 · 03/11 08:21:02 · claude-haiku-5-5 · 33 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 5 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio»"
1 · por pasada,pasada 6 · 03/11 08:22:36 · claude-haiku-5-5 · 45 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 6 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área»"
1 · por pasada,pasada 7 · 03/11 08:23:58 · claude-haiku-5-5 · 43 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 7 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio.»"
1 · por pasada,pasada 8 · 03/11 08:25:56 · claude-haiku-5-5 · 41 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 9 · 03/11 08:29:43 · claude-haiku-5-5 · 36 s,quinto: no,"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 10 · 03/11 08:32:46 · claude-haiku-5-5 · 51 s,quinto: sí (sin especie),"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 10 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio»,CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada»
1 · por pasada,pasada 11 · 03/11 08:33:46 · claude-haiku-5-5 · 39 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 11 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio»"
1 · por pasada,pasada 12 · 03/11 08:36:41 · claude-haiku-5-5 · 41 s,quinto: sí (sin especie),"sin texto en la pareja: 1 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 12 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada»
1 · por pasada,pasada 13 · 03/11 08:37:40 · claude-haiku-5-5 · 45 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 14 · 03/11 08:39:12 · claude-haiku-5-5 · 39 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 14 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada»
1 · por pasada,pasada 15 · 03/11 08:43:10 · claude-haiku-5-5 · 39 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 16 · 03/11 08:44:38 · claude-haiku-5-5 · 39 s,quinto: sí (sin especie),"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 16 · cita de quinto,sin especie · CLI-12: fuera de §3.1 y §3.5,cita del documento: «El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes»,"CLI-12: «Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio.»"
1 · por pasada,pasada 17 · 03/11 08:46:08 · claude-haiku-5-5 · 44 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 18 · 03/11 08:47:02 · claude-haiku-5-5 · 39 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 19 · 03/11 08:48:17 · claude-haiku-5-5 · 45 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0)",null
1 · por pasada,pasada 20 · 03/11 08:49:15 · claude-haiku-5-5 · 31 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
1 · por pasada,pasada 21 · 03/11 08:50:23 · claude-haiku-5-5 · 41 s,quinto: no,"sin texto en la pareja: 0 (con la etiqueta, del verificador: 0) · ⚠️ SIN «discarded»: agujero",null
2 · el total,quinto en 9 de 21 pasadas · con la etiqueta: 1 · dudosas aparte: 0,"muertas en la puerta, con texto: 0 pasadas",null,null
2 · el total,"sin texto en la pareja, que no se reparte por caso: 4 hallazgos en 4 pasadas (con la etiqueta, del verificador: 0)",null,null,null
```

**SALIDA 2 · SQL_34_07, NOR-11**
```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,ventana: 03/11 08:13 a 03/11 08:51 (hora de Madrid),OK,null,null
0 · control,pasadas de NOR-11 en la ventana: 21 · esperado: 21,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,documentos CLI-12 en la organización: 1 (tiene que ser uno),OK,null,null
0 · control,pasadas con el registro por llamada: 21 de 21 · que pasaron su guarda de 200: 0,OK,null,null
0 · control,CONTROL POSITIVO · pasadas con «discarded» y una petición del juez a CLI-12 con 200: 16 de 16,OK,null,null
1 · por pasada,pasada 1 · 03/11 08:13:48,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 8 % · contradicciones 1 · solapes 1 · únicos 8
1 · por pasada,pasada 2 · 03/11 08:15:40,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 9
1 · por pasada,pasada 3 · 03/11 08:16:56,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 1 · únicos 11
1 · por pasada,pasada 4 · 03/11 08:19:16,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 4 % · contradicciones 0 · solapes 1 · únicos 7
1 · por pasada,pasada 5 · 03/11 08:21:02,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 3 % · contradicciones 1 · solapes 1 · únicos 6
1 · por pasada,pasada 6 · 03/11 08:22:36,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 2 · únicos 10
1 · por pasada,pasada 7 · 03/11 08:23:58,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 1 · únicos 9
1 · por pasada,pasada 8 · 03/11 08:25:56,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 0 · solapes 1 · únicos 5
1 · por pasada,pasada 9 · 03/11 08:29:43,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 0 · solapes 1 · únicos 10
1 · por pasada,pasada 10 · 03/11 08:32:46,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 4 % · contradicciones 1 · solapes 1 · únicos 12
1 · por pasada,pasada 11 · 03/11 08:33:46,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 1 · únicos 10
1 · por pasada,pasada 12 · 03/11 08:36:41,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 4 % · contradicciones 1 · solapes 1 · únicos 8
1 · por pasada,pasada 13 · 03/11 08:37:40,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 3 % · contradicciones 0 · solapes 2 · únicos 10
1 · por pasada,pasada 14 · 03/11 08:39:12,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 1 · solapes 1 · únicos 10
1 · por pasada,pasada 15 · 03/11 08:43:10,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 0 · solapes 1 · únicos 10
1 · por pasada,pasada 16 · 03/11 08:44:38,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 0 % · contradicciones 1 · solapes 0 · únicos 8
1 · por pasada,pasada 17 · 03/11 08:46:08,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 10
1 · por pasada,pasada 18 · 03/11 08:47:02,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 11
1 · por pasada,pasada 19 · 03/11 08:48:17,con «discarded»: no es un agujero,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: tema_similar · solape 5 % · contradicciones 0 · solapes 1 · únicos 10
1 · por pasada,pasada 20 · 03/11 08:49:15,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 8
1 · por pasada,pasada 21 · 03/11 08:50:23,CERO REAL: el juez contestó a CLI-12 (el juicio no es el de reserva) y no descartó nada,"juez a CLI-12: 1 peticiones, 1 con 200, la última: ok · caídas del juez en el análisis: 0",el juicio de CLI-12: sin_relacion · solape 0 % · contradicciones 0 · solapes 0 · únicos 10
2 · el total,agujeros: 5 · cero real: 5 · juez caído: 0 · no se distingue: 0 · no se sabe: 0,null,null,null
```

**SALIDA 3 · SQL_34_09, las cuatro ventanas**
```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,línea base · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,línea base · NOR-11 · pasadas en su ventana: 13 · esperado: 13,OK,null,null
0 · control,tanda nueva · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,tanda nueva · NOR-11 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,CONTROL POSITIVO · pasadas de la tanda nueva con el contador nuevo (corrieron con el verificador nuevo): 42 de 42,OK,null,null
0 · control,pasadas de la línea base con el contador nuevo (tienen que ser 0): 0,OK,null,null
1 · por medición,línea base · NOR-10 · 21 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas (sin el contador: anterior al cambio),"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 105 hallazgos que llegaron al verificador",por pasada: 0.00 sin veredicto
1 · por medición,línea base · NOR-11 · 13 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas (sin el contador: anterior al cambio),"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 55 hallazgos que llegaron al verificador",por pasada: 0.00 sin veredicto
1 · por medición,tanda nueva · NOR-10 · 21 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas,"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 106 hallazgos que llegaron al verificador",por pasada: 0.00 sin veredicto
1 · por medición,tanda nueva · NOR-11 · 21 pasadas,(a) confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 pasadas,"(b) descartado.sin_veredicto: 0 en 0 pasadas, de 80 hallazgos que llegaron al verificador",por pasada: 0.00 sin veredicto
"2 · sin_veredicto, nueva frente a base",NOR-10,línea base: 0 de 105 en 21 pasadas · tanda nueva: 0 de 106 en 21 pasadas,igual,null
"2 · sin_veredicto, nueva frente a base",NOR-11,línea base: 0 de 55 en 13 pasadas · tanda nueva: 0 de 80 en 21 pasadas,igual,null
3 · el total de la tanda nueva,confirmados SÓLO por la pregunta del cumplimiento: 0 en 0 de 42 pasadas,null,null,null
```

**SALIDA 4 · SQL_34_10, las cuatro ventanas**
```
bloque,a,b,c,d
organización leída,organización leída: 68bf28c3-8352-4052-8eb4-3a7e31b74b53 · «Mi workspace» · 45 documentos,null,null,null
0 · control,línea base · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,tanda nueva · NOR-10 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,línea base · NOR-11 · pasadas en su ventana: 13 · esperado: 13,OK,null,null
0 · control,tanda nueva · NOR-11 · pasadas en su ventana: 21 · esperado: 21,OK,null,null
0 · control,pasadas que no son rápidas: 0,OK,null,null
0 · control,pasadas sin registro por llamada (su coste no se puede medir): 0,OK,null,null
0 · control,peticiones con un modelo que no está en la tabla de precios: 0,OK,null,null
0 · control,pasadas con peticiones fuera del detalle o sin etapa (las cifras por etapa no serían el total): 0,OK,null,null
0 · control,CONTROL POSITIVO · pasadas medidas con alguna petición del verificador: 76 de 76,OK,null,null
1 · por medición,línea base · NOR-10 · 21 pasadas,coste medio por análisis 0.031515 $ (de 0.025901 a 0.040039) · total 0.661821 $,verificador: 0.011599 $ por análisis · 36.8 % del coste · 1.19 peticiones por análisis · latencia media por petición 1435 ms,"duración media del análisis 33.7 s, con la espera (la columna de SQL_34_06, sin espera ni origen: 36.6 s) · espera media por análisis 0.99 s · peticiones que no salieron bien: 0 de 109"
1 · por medición,tanda nueva · NOR-10 · 21 pasadas,coste medio por análisis 0.033229 $ (de 0.028531 a 0.040537) · total 0.697800 $,verificador: 0.013314 $ por análisis · 40.1 % del coste · 1.19 peticiones por análisis · latencia media por petición 1821 ms,"duración media del análisis 34.4 s, con la espera (la columna de SQL_34_06, sin espera ni origen: 37.5 s) · espera media por análisis 1.34 s · peticiones que no salieron bien: 0 de 109"
1 · por medición,línea base · NOR-11 · 13 pasadas,coste medio por análisis 0.030208 $ (de 0.025468 a 0.035011) · total 0.392710 $,verificador: 0.010118 $ por análisis · 33.5 % del coste · 1.69 peticiones por análisis · latencia media por petición 1066 ms,"duración media del análisis 39.5 s, con la espera (la columna de SQL_34_06, sin espera ni origen: 40.9 s) · espera media por análisis 1.18 s · peticiones que no salieron bien: 0 de 74"
1 · por medición,tanda nueva · NOR-11 · 21 pasadas,coste medio por análisis 0.030766 $ (de 0.025884 a 0.037481) · total 0.646091 $,verificador: 0.010834 $ por análisis · 35.2 % del coste · 1.52 peticiones por análisis · latencia media por petición 1511 ms,"duración media del análisis 40.0 s, con la espera (la columna de SQL_34_06, sin espera ni origen: 41.7 s) · espera media por análisis 1.14 s · peticiones que no salieron bien: 0 de 116"
2 · por etapa,línea base · NOR-10,juez,0.013514 $ por análisis · 42.9 % del coste,2.00 peticiones por análisis
2 · por etapa,línea base · NOR-10,verificador,0.011599 $ por análisis · 36.8 % del coste,1.19 peticiones por análisis
2 · por etapa,línea base · NOR-10,rerank,0.004910 $ por análisis · 15.6 % del coste,1.00 peticiones por análisis
2 · por etapa,línea base · NOR-10,sintesis,0.001492 $ por análisis · 4.7 % del coste,1.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,juez,0.013461 $ por análisis · 40.5 % del coste,2.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,verificador,0.013314 $ por análisis · 40.1 % del coste,1.19 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,rerank,0.004965 $ por análisis · 14.9 % del coste,1.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-10,sintesis,0.001489 $ por análisis · 4.5 % del coste,1.00 peticiones por análisis
2 · por etapa,línea base · NOR-11,juez,0.011533 $ por análisis · 38.2 % del coste,2.00 peticiones por análisis
2 · por etapa,línea base · NOR-11,verificador,0.010118 $ por análisis · 33.5 % del coste,1.69 peticiones por análisis
2 · por etapa,línea base · NOR-11,rerank,0.006917 $ por análisis · 22.9 % del coste,1.00 peticiones por análisis
2 · por etapa,línea base · NOR-11,sintesis,0.001640 $ por análisis · 5.4 % del coste,1.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-11,juez,0.011425 $ por análisis · 37.1 % del coste,2.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-11,verificador,0.010834 $ por análisis · 35.2 % del coste,1.52 peticiones por análisis
2 · por etapa,tanda nueva · NOR-11,rerank,0.006855 $ por análisis · 22.3 % del coste,1.00 peticiones por análisis
2 · por etapa,tanda nueva · NOR-11,sintesis,0.001652 $ por análisis · 5.4 % del coste,1.00 peticiones por análisis
3 · nueva frente a base,NOR-10,coste medio por análisis: 0.031515 → 0.033229 $ (+5.4 %),verificador: 0.011599 → 0.013314 $ (+14.8 %),"duración media, con la espera: 33.7 → 34.4 s · espera media: 0.99 → 1.34 s"
3 · nueva frente a base,NOR-11,coste medio por análisis: 0.030208 → 0.030766 $ (+1.8 %),verificador: 0.010118 → 0.010834 $ (+7.1 %),"duración media, con la espera: 39.5 → 40.0 s · espera media: 1.18 → 1.14 s"
```

**Comprobado con script** (03/11):
- `SQL_34_06`: 21 pasadas. **El quinto, en 9**: las pasadas 3, 5, 6, 7, 10, 11, 12, 14 y 16. **Con la etiqueta, una**: la 3.
  **Muertos sin texto, en 4 pasadas**: la 3, la 9, la 10 y la 12, y de ellas **sólo la 9 no tiene el quinto**. Los agujeros
  del control 6 son la 2, la 17, la 18, la 20 y la 21.
- `SQL_34_07`: **esos 5 agujeros son los 5 cero real**, con el juicio de CLI-12 en «sin_relacion · solape 0 %». «tema_similar»
  con 0 contradicciones guardadas: la 4, la 8, la 9, la 13, la 15 y la 19. Con 1: la 1, la 3, la 5, la 6, la 7, la 10, la 11,
  la 12, la 14 y la 16. **Las 9 del quinto están entre esas 10. La otra, la 1, guarda una contradicción que no es el quinto.**
- `SQL_34_09`: 7 de 7 controles OK, el positivo en 42 de 42. NOR-11 nueva: `sin_veredicto` 0 de 80; el contador, 0.
- `SQL_34_10`: 9 de 9 controles OK, el positivo en 76 de 76. **NOR-11: 0,030208 → 0,030766 $ (+1,8 %)**; el verificador,
  0,010118 → 0,010834 $ (+7,1 %); duración, 39,5 → 40,0 s; 0 fallidas de 116.

## PASO 3 · EL ENSAYO DE LA PAREJA DEL QUINTO, LITERAL (pulsado por el director, 03/11/2026, sin llamar al modelo)

`POST /api/admin/medida-f130/quinto?ensayo=1`. Lo pegó el director dentro de su mensaje, y Code lo sacó del registro de la
conversación con un script:

```json
{
  "estadoHttp": 200,
  "medida": "Paso 3 de F-130 · la pregunta cerrada sobre la pareja del quinto, los dos trozos enteros, 21 veces",
  "ensayo": "sin llamar al modelo",
  "trozos": {
    "analizado": {
      "documento": "NOR-11_gestion-de-residuos-sanitarios.docx",
      "generacion": 1,
      "trozo": 13,
      "frases": [
        {
          "ancla": "revisa trimestralmente el cumplimiento",
          "frase": "El Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes, incorporando los hallazgos relevantes a la siguiente sesión de formación anual del personal."
        }
      ],
      "texto": "# 10. Errores frecuentes y buenas prácticas\n\n## 10.3. Contenedores no identificados\n\nUn contenedor de los grupos III o IV sin la etiqueta de apertura cumplimentada conforme al apartado 4.1 no puede trasladarse al almacenamiento intermedio hasta completar su identificación, para no perder la trazabilidad de la fecha de cierre a efectos del plazo máximo de retirada.\n\n## 10.4. Mezcla accidental de grupos en almacenamiento intermedio\n\nSi por error un contenedor de un grupo aparece situado en la zona de almacenamiento intermedio destinada a otro grupo, el personal auxiliar lo reubica de inmediato en la zona correcta y revisa que su etiqueta y su fecha de cierre sigan siendo legibles tras el traslado, documentando el error en el parte de incidencias si ha permanecido mal ubicado más de una jornada completa.\n\n## 10.5. Revisión periódica de buenas prácticas\n\nEl Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes, incorporando los hallazgos relevantes a la siguiente sesión de formación anual del personal."
    },
    "candidato": {
      "documento": "CLI-12_manual-calidad-clinica.docx",
      "generacion": 1,
      "trozo": 13,
      "frases": [
        {
          "ancla": "personal ajeno al área auditada",
          "frase": "Las auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio."
        },
        {
          "ancla": "no como auditor de su propia área",
          "frase": "El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área."
        }
      ],
      "texto": "# 6. Auditorías internas: planificación general\n\nEl sistema de calidad de Dentavia se apoya en un calendario anual de auditorías internas que cubre todas las áreas de la clínica a lo largo del ejercicio, evitando que algún proceso relevante quede sin revisar durante periodos prolongados.\n\n## 6.1. Tipos de auditoría\n\nSe distinguen auditorías de proceso (verifican el cumplimiento de un protocolo concreto, como la esterilización o la atención telefónica), auditorías documentales (verifican que la documentación generada corresponde a lo exigido por cada protocolo) y auditorías de indicadores (verifican la fiabilidad de los datos que alimentan el cuadro de mando de calidad).\n\n## 6.2. Equipo auditor\n\nLas auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio. El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área.\n\n## 6.3. Informe de auditoría"
    }
  },
  "prompt": "PAREJA 1: NOR-11_gestion-de-residuos-sanitarios.docx, trozo 13 ↔ CLI-12_manual-calidad-clinica.docx, trozo 13\n\nTEXTO 1 · NOR-11_gestion-de-residuos-sanitarios.docx, trozo 13:\n# 10. Errores frecuentes y buenas prácticas\n\n## 10.3. Contenedores no identificados\n\nUn contenedor de los grupos III o IV sin la etiqueta de apertura cumplimentada conforme al apartado 4.1 no puede trasladarse al almacenamiento intermedio hasta completar su identificación, para no perder la trazabilidad de la fecha de cierre a efectos del plazo máximo de retirada.\n\n## 10.4. Mezcla accidental de grupos en almacenamiento intermedio\n\nSi por error un contenedor de un grupo aparece situado en la zona de almacenamiento intermedio destinada a otro grupo, el personal auxiliar lo reubica de inmediato en la zona correcta y revisa que su etiqueta y su fecha de cierre sigan siendo legibles tras el traslado, documentando el error en el parte de incidencias si ha permanecido mal ubicado más de una jornada completa.\n\n## 10.5. Revisión periódica de buenas prácticas\n\nEl Coordinador de Calidad de cada clínica revisa trimestralmente el cumplimiento de los criterios descritos en este apartado mediante observación directa del área de almacenamiento intermedio y de los gabinetes, incorporando los hallazgos relevantes a la siguiente sesión de formación anual del personal.\n\nTEXTO 2 · CLI-12_manual-calidad-clinica.docx, trozo 13:\n# 6. Auditorías internas: planificación general\n\nEl sistema de calidad de Dentavia se apoya en un calendario anual de auditorías internas que cubre todas las áreas de la clínica a lo largo del ejercicio, evitando que algún proceso relevante quede sin revisar durante periodos prolongados.\n\n## 6.1. Tipos de auditoría\n\nSe distinguen auditorías de proceso (verifican el cumplimiento de un protocolo concreto, como la esterilización o la atención telefónica), auditorías documentales (verifican que la documentación generada corresponde a lo exigido por cada protocolo) y auditorías de indicadores (verifican la fiabilidad de los datos que alimentan el cuadro de mando de calidad).\n\n## 6.2. Equipo auditor\n\nLas auditorías internas las realiza siempre personal ajeno al área auditada, habitualmente el Coordinador de Calidad de otra clínica de la red, para garantizar independencia de criterio. El Coordinador de Calidad de la propia clínica participa en la auditoría como interlocutor, pero no como auditor de su propia área.\n\n## 6.3. Informe de auditoría\n\nContesta a LAS DOS preguntas. Las dos son obligatorias.\nCONTESTAR A UNA NO TE EXIME DE CONTESTAR A LA OTRA, ni cuando tu respuesta señale un hallazgo ni cuando no lo señale.\n\nPREGUNTA 1 · EL DATO\n¿Dicen los dos textos cosas DISTINTAS sobre el MISMO dato?\nHAY HALLAZGO SI LA RESPUESTA ES «SÍ». Si es sí, cita la frase literal de cada lado. Si es no, contesta «no» y pasa a la 2.\n\nPREGUNTA 2 · EL CUMPLIMIENTO\nPero hay textos que no afirman un dato: MANDAN. Obligan, permiten,\nprohíben, reparten responsabilidades o fijan un procedimiento. A esos\ntextos la pregunta de la verdad no se les puede hacer, porque una regla\nno es verdadera ni falsa: SE CUMPLE O NO SE CUMPLE.\n\nAsí que cuando los dos textos sean reglas, y SÓLO entonces, hazte además\nesta segunda pregunta:\n\n    ¿SE PUEDEN CUMPLIR LAS DOS A LA VEZ?\n\nY ten cuidado con un atajo que la haría inútil. Si una de las dos PERMITE\nalgo, siempre se puede «cumplir las dos» renunciando a usar el permiso.\nEso no es cumplirlas: es dejar una sin efecto. Así que cuando una permita\nalgo, la pregunta es ésta:\n\n    SI SE HACE LO QUE UNA PERMITE, ¿SE PUEDE CUMPLIR LA OTRA?\n\nSi la respuesta es no, HAY HALLAZGO. No vale contestar «basta con no usar\nel permiso»: una regla que sólo se puede cumplir renunciando a lo que la\notra permite está en conflicto con ella.\n\nY LO QUE UNA DE LAS DOS REGLAS PERMITE NO ES UN HECHO SUPUESTO: es parte\nde lo que la regla dice. Usar el permiso para ver si choca con la otra no\nes inventarse nada.\n\n- \"norma_contra_norma\": las dos son reglas, y no se pueden cumplir las dos.\n- \"norma_contra_practica\": una es una regla y la otra describe lo que se\n  hace de verdad. Aquí la pregunta es más simple: ¿LO QUE SE HACE CUMPLE\n  LA REGLA? Si no la cumple, hay hallazgo.\n\nCÓMO SE DISTINGUE DE UN HALLAZGO DE LA PREGUNTA 1: mira SOBRE QUÉ manda cada\nregla.\n- Si las dos mandan sobre LA MISMA cosa, y una la permite y la otra la\n  prohíbe, es un hallazgo de la PREGUNTA 1, no de la 2. Es el caso de\n  \"la política prohíbe el teletrabajo\" frente a \"se permite el teletrabajo\n  3 días por semana\": las dos regulan el teletrabajo.\n- CONFLICTO NORMATIVO es cuando las dos mandan sobre COSAS DISTINTAS —una\n  sobre quién puede ocupar un cargo y la otra sobre quién firma un gasto,\n  por ejemplo— y aun así no se pueden cumplir juntas.\n\nEJEMPLO DE \"norma_contra_norma\":\n- Regla 1: \"El encargado del taller puede ser el mismo socio que el\n  tesorero.\"\n- Regla 2: \"Las compras de material las firma el encargado del taller y\n  las paga el tesorero, y nunca la misma persona puede hacer las dos\n  cosas, para que ningún gasto quede sin un segundo par de ojos.\"\nLas dos frases pueden ser verdaderas a la vez, y ninguna le da otro valor\na un dato de la otra: la primera manda sobre qué cargos puede acumular un\nsocio, la segunda sobre quién firma y quién paga. Pero si se hace lo que\nla primera PERMITE —un socio en los dos cargos—, NINGUNA COMPRA PUEDE\nCUMPLIR LA SEGUNDA. No vale decir «pues que no acumule los cargos»: eso\nes dejar sin efecto la primera.\n\nEJEMPLO DE \"norma_contra_practica\":\n- Regla: \"Las compras de material se firman antes de hacer el pedido.\"\n- Práctica: \"El taller pide el material y el encargado firma la hoja de\n  compra al recibirlo, cuando ya se sabe el importe exacto.\"\nLa segunda no afirma nada falso: describe lo que se hace. Pero lo que se\nhace no cumple la regla.\n\nEJEMPLOS DE LO QUE NO ES CONFLICTO NORMATIVO:\n- \"Las compras de obra las firma el presidente\" frente a \"las compras de\n  material ordinario las firma el encargado del taller\": mandan sobre\n  cosas que no se solapan, y se completan. Una regla general y otra bien\n  delimitada no son un conflicto.\n- \"El control se hace cada semana\" frente a \"el control se hace cada mes\":\n  eso SÍ es un dato con dos valores. Es un hallazgo de la PREGUNTA 1, no de\n  la 2.\n- Una regla y SU PROPIA razón no son dos reglas: que un texto explique por\n  qué él mismo manda lo que manda NO LA PONE EN CONFLICTO CON SU PROPIA\n  REGLA. \"El control es semanal porque el fabricante del indicador lo\n  recomienda\" no choca con nada. Pero OJO: si esa razón ENUNCIA UN\n  PRINCIPIO, sí puede chocar con una regla del OTRO documento. Ver el\n  bloque del principio, abajo.\n\nCUIDADO CON UN CASO QUE PARECE UNA RAZÓN Y NO LO ES, porque es el más\nfrecuente en documentación de verdad.\n\nHay razones que no sólo explican: ENUNCIAN UN PRINCIPIO. Dicen que dos\ncosas tienen que estar separadas, que algo tiene que ser independiente,\nque una decisión necesita un segundo par de ojos. Y un principio SÍ se\npuede incumplir desde el otro documento: basta con que el otro PERMITA\njusto el estado que el principio excluye.\n\n    SI UN TEXTO ENUNCIA UN PRINCIPIO Y EL OTRO PERMITE JUSTO LO QUE ESE\n    PRINCIPIO EXCLUYE, HAY CONFLICTO NORMATIVO, aunque el que enuncia el\n    principio lo haga explicando otra regla, y aunque no diga \"nunca\" ni\n    \"debe\" en ninguna parte.\n\n\"Esto se hace así para mantener X separado de Y\" dice que X e Y tienen\nque estar separados. No hace falta que lo mande con esas palabras.\n\nEJEMPLO, el mismo taller y el principio SOLO:\n- Regla: \"El encargado del taller puede ser el mismo socio que el\n  tesorero.\"\n- Razón de otra regla, en el otro documento: \"Las compras las firma el\n  encargado y las paga el tesorero. Este reparto responde al criterio de\n  que ningún gasto quede sin un segundo par de ojos.\"\nLa segunda frase NO manda sobre quién ocupa los cargos: explica por qué se\nreparten las firmas, y no prohíbe nada. Pero ENUNCIA UN PRINCIPIO —dos\npersonas distintas—, y la primera PERMITE justo lo que ese principio\nexcluye. Es \"norma_contra_norma\".\n\nY ESTO VALE PARA CUALQUIERA DE LOS CASOS DE ARRIBA:\n- SI PARA VER EL CONFLICTO TIENES QUE SUPONER UN HECHO QUE NO ESTÁ EN\n  NINGUNO DE LOS DOS TEXTOS NI LO PERMITE NINGUNA DE LAS DOS REGLAS, NO\n  HAY HALLAZGO.\nHAY HALLAZGO SI LA RESPUESTA ES «NO»: si NO se pueden cumplir las dos a la vez. Si es «no», cita la frase literal de cada lado y di cuál de las dos etiquetas es, \"norma_contra_norma\" o \"norma_contra_practica\". Si se pueden cumplir, contesta «sí» y no cites nada.\nESTA PREGUNTA SE CONTESTA SOLA, COMO SI LA 1 NO EXISTIERA, Y SE PREGUNTA SOBRE FRASES, NO SOBRE LOS DOS TEXTOS EN BLOQUE. Un mismo par de trozos puede mandar a la vez sobre la misma cosa y sobre cosas distintas, así que no decidas eso del par entero: la distinción de arriba se aplica AL PAR DE FRASES que estés considerando. Recorre las frases y busca si hay ALGUNA de un texto y ALGUNA del otro que no se puedan cumplir a la vez. NO VALE RESPONDER «ya queda recogido en la pregunta 1» NI «no encuentro otro par de frases»."
}
```

**Comprobado con script**: HTTP 200, sin modelo. **NOR-11·13 y CLI-12·13, los dos de la generación 1**, y las tres frases
cortadas sin error. El prompt lleva los dos textos enteros. Los números de trozo que salían del troceado local y de la
siembra **son los de la base**, y la negativa dura los comprobó por su frase.
- **NOR-11·13 trae los apartados 10.3, 10.4 y 10.5 del §10**, bajo su encabezado. El §10 tiene cinco: el 10.1 («Confusión
  entre grupo II y grupo III») y el 10.2 («Uso incorrecto del contenedor negro») van en otro trozo (leído en el .docx de
  `corpus-pruebas/`).
- **CLI-12·13 trae el encabezado del §6, el 6.1 y el 6.2 enteros, y ACABA EN EL ENCABEZADO «## 6.3. Informe de auditoría», SIN
  SU TEXTO**, que va en el trozo siguiente. Al quinto no le afecta; queda anotado por si otro caso cae en esa frontera.
