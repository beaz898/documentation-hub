# SIEMBRA — CLI-20, el fichero de control del análisis de ESTILO

**Origen**: escrito el 15/09/2026 para las tandas **A7** (estilo desde el chat) y
**A8** (estilo desde la bandeja), que **nunca se han medido**.
**Se compara contra**: nada. El análisis de estilo mira el texto en sí mismo — se
verificó que `analyzeStyle` no toca Supabase, ni vectores, ni el corpus.
**Fichero**: `corpus-pruebas/CLI-20_protocolo-urgencias-dentales.txt`

---

## POR QUÉ EXISTE ESTE FICHERO, Y NO ES CEREMONIA

El camino del estilo tiene **tres puertas que devuelven lista vacía como si fuera
un éxito**: el modelo ante un error, la ruta ante varios rechazos, y el cliente
ante cualquier respuesta no correcta. **Un cero, por tanto, no distingue «el texto
está bien» de «no miré».**

Y «que A7 y A8 coincidan» no lo arregla: **si el camino está ciego, las dos dan
cero y coinciden perfectamente**. Hace falta un texto del que se sepa de antemano
qué tiene dentro.

## EL TAMAÑO, Y SU MARGEN — porque hay un recorte silencioso

**3.991 caracteres** — medidos por el verificador, no por `wc -c`, que cuenta BYTES y con acentos da 4.060. El analizador cuenta caracteres. El analizador recorta el texto a **20.000**
(`style-check.ts:83`, literal desnudo y sin contador), así que este documento usa
el **20,0 %** del límite y **queda margen de 16.009 caracteres**. Nada se pierde por
el recorte, y por eso la cifra que salga será sobre el documento ENTERO.

⚠️ **Si alguna vez se amplía este fichero, hay que volver a mirar esa cuenta.**

## EL TEXTO, Y POR QUÉ ES ASÍ

Es un protocolo de urgencias de una clínica dental, con la forma que tendría uno
real: numerado, con objeto y alcance, responsabilidades y material. **Los errores
están sembrados dentro de frases que un profesional escribiría**, no en un texto
de laboratorio con erratas evidentes. Si los errores fueran de laboratorio, la
cifra no diría nada del uso real.

---

## LOS DIEZ SEMBRADOS

### ortografía — 4

| # | dónde | literal sembrado | qué tiene | por qué debería detectarse |
|---|---|---|---|---|
| O1 | §2, último párrafo | `Las consulltas telefónicas` | errata: ele doblada | Es una errata pura, del tipo que el prompt nombra primero. **Si ésta no sale, el camino no ve nada** |
| O2 | §3, último párrafo | `Los paciente con cita programada` | concordancia: falta la ese | El prompt dice «errores de concordancia» explícitamente |
| O3 | §4, último párrafo | `La prescipción de analgésicos` | errata: falta la erre | Errata en una palabra técnica. Menos común que O1 y por eso vale como segundo nivel |
| O4 | §8, último párrafo | `la fecha en la que a sido subsanada` | `a` por `ha` | Error gramatical frecuente en texto real. **El más interesante de los cuatro**: no es un dedazo, es una confusión |

### ambigüedad — 3

| # | dónde | literal sembrado | qué tiene | por qué debería detectarse |
|---|---|---|---|---|
| A1 | §5, primer párrafo | `debe acudir en ayunas si la intervención es por la mañana o por la tarde deberá comer ligero` | sin puntuación entre las dos ramas: se lee de dos maneras | Es el caso de manual de ambigüedad, y con consecuencia clínica. **Debería salir** |
| A2 | §5, último párrafo | `Se avisará al responsable cuando el tratamiento haya terminado` | ¿qué responsable? El párrafo habla de una derivación a otro centro | ⚠️ **Discutible**: exige entender el contexto del párrafo, no sólo la frase. Si no sale, puede ser expectativa mía y no ceguera suya |
| A3 | §6, último párrafo | `El plazo de conservación del informe de urgencias es de 24 horas desde la última revisión` | «la última revisión» ¿de qué? Y 24 horas de conservación no tiene sentido para una historia clínica | ⚠️ **El más discutible de los diez**: mezcla ambigüedad con un disparate de contenido. Puede clasificarse como `sugerencia`, o no salir. **Se cuenta aparte al leer el resultado** |

### sugerencia — 3

| # | dónde | literal sembrado | qué tiene | por qué debería detectarse |
|---|---|---|---|---|
| S1 | §4, segundo párrafo | `Es totalmente y completamente obligatorio` | redundancia de dos adverbios sinónimos | El prompt nombra «redundancias» como primer ejemplo de esta clase |
| S2 | §6, segundo párrafo | `En el caso de que se dé el caso de que` | redundancia gruesa, repetición de «caso» | La más visible de las tres |
| S3 | §7, último párrafo | los dos párrafos de §6 repetidos **palabra por palabra** | párrafo duplicado entero | ⚠️ **El que más me interesa y el que menos confianza me da**: la regla del `textRef` pide un substring **único**, y este texto aparece dos veces. Puede que el modelo lo vea y no sepa cómo referenciarlo. **Si falla por eso, es un hallazgo del formato de salida, no de la detección** |

---

## CÓMO SE LEE EL RESULTADO

**No se cuenta sólo cuántos encuentra: se cuenta CUÁLES.** Un 7 sobre 10 no
significa lo mismo si los tres que faltan son los tres declarados como discutibles
(A2, A3, S3) que si falta O1.

- **Los cuatro de ortografía y A1, S1, S2 son la base**: siete que deberían salir.
- **A2, A3 y S3 van marcados como discutibles a propósito**, y su fallo se discute
  antes de llamarlo fallo.

## VERIFICADOR

`node scripts/verificar-cli20.mjs` comprueba que **los diez literales siguen en el
fichero** y que sigue por debajo del recorte. Se corre cada vez que CLI-20 vuelva a
usarse: **un fichero de control que ha cambiado sin que nadie lo note deja de ser
un control** — y este documento es especialmente frágil, porque un corrector
automático «arreglaría» las erratas sin avisar.

---

## ⚠️ LO QUE EL VERIFICADOR CAZÓ EN SU PRIMERA EJECUCIÓN, antes de gastar nada

Tres de los diez literales de esta tabla estaban escritos **de corrido** aquí y
**partidos por un salto de línea** en el fichero: O4, A2 y A3. El verificador los
dio por ausentes y se negó a validar el control.

**No era un error del fichero: era de este registro.** Se arregló comparando con
los espacios colapsados —el ajuste de línea no es contenido— y **nada más**: ni
mayúsculas, ni acentos, ni puntuación. Una errata «arreglada» por un corrector
sigue cazándose, que es el caso que el verificador existe para ver.

**Si el control hubiera ido a la tanda sin verificar, tres sembrados habrían
estado bien y yo habría leído su ausencia como ceguera del sistema.**
