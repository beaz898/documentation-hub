# MEDIDA F-130 · SEMANA 0: E3 Y LA VECINDAD (P-F130-9) · 29/10/2026

*Escrito por Code el 29/10/2026. Las cifras y la lectura son del arquitecto, leídas en los dos JSON que devolvió la
herramienta temporal `app/api/admin/medida-f130/`, pulsada por el director. **Code no ha visto esos JSON**: lo que no
diga de dónde sale, sale del mensaje del arquitecto del 29/10.*

## Los dos JSON, literales

**PENDIENTES DE PEGAR.** El encargo del 29/10 pide archivarlos enteros, y no llegaron dentro (regla del protocolo: «un
encargo que dice "el contenido literal" sin llevarlo dentro no es un encargo»). Van aquí, tal cual, cuando el director
los pegue: el de la vecindad y el de E3.

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

⚠️ **Y AL LADO, PORQUE ES LO QUE VIGILA AL ARQUITECTO**: el arquitecto fijó el 6 de 7 ANTES de medir para no poder
racionalizar después, y ha salido 5. Lo que justifica repetir no es su explicación: es que **el diagnóstico está en las
palabras del modelo y produce una predicción falsable**. Si al repetir falla, **no hay tercera vuelta de excusas**.

## La lectura del arquitecto de la repetición

**PENDIENTE**: después de la repetición.
