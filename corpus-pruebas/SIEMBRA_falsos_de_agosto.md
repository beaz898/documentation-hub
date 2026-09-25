# Registro de los CINCO documentos de los falsos de agosto

**Subidos por el director el 25/09/2026 a las 17:14** (commit `31c141d6`, «Add
files via upload»). Son los que faltaban para que el examen pueda vigilar los
falsos positivos catalogados en `claude/Consulta_Fable_F22_Juez.md` §2.

```
CLI-01_protocolo-esterilizacion-instrumental.txt
OPE-01_manual-apertura-y-cierre-de-clinica.docx
NOR-04_plan-de-emergencia-y-evacuacion.pdf
RRHH-04_formacion-obligatoria-reciclaje.md
RRHH-05_uniformidad-e-imagen.txt
```

## ⚠️ ESTE MATERIAL NO LLEVA SIEMBRA, Y ESO NO ES UNA EXCEPCIÓN A LA REGLA DE ADMISIÓN

Los otros registros de `corpus-pruebas/` documentan **trampas plantadas a
propósito**: una contradicción escrita en la línea 82 de un fichero para ver si
el sistema la encuentra. Estos cinco documentos son lo contrario: son **el
corpus del piloto tal como estaba**, y lo que se observó sobre ellos en agosto
no son trampas encontradas sino **hallazgos que el sistema se inventó**.

La regla de admisión —*«material de referencia sin registro es material del que
nadie sabe qué prueba»*— se cumple igual, y lo que este registro declara es lo
mismo que declara una siembra, con el signo cambiado:

| Una siembra declara | Este registro declara |
|---|---|
| qué frase se plantó y dónde | qué frase el sistema emparejó mal y dónde está |
| que el sistema DEBE encontrarla | que el sistema NO DEBE volver a emitirlo |
| su par en el otro documento | su par en el otro documento, y **por qué no se oponen** |

**La comprobación es la misma en los dos casos**: que la frase esté citable
desde un fragmento, y que no aparezca en el documento contrario. Eso es lo que
verifica `lib/examen/discriminantes.mjs`, y está corrido — los resultados, abajo.

## LO QUE ENTRÓ, MEDIDO EL 25/09/2026

Corriendo el camino real de indexación sobre los ficheros
(`extractSegments` → `joinSegments` → `chunkSegments`, los mismos que llama
`app/api/ingest/route.ts:213-259`):

| Documento | bytes | caracteres extraídos | trozos | longitudes |
|---|---|---|---|---|
| CLI-01 `.txt` | 5.873 | 5.524 | **8** | 476, 653, 998, 392, 890, 1.073, 450, 789 |
| OPE-01 `.docx` | 38.661 | 2.493 | 4 | 601, 708, 617, 561 |
| NOR-04 `.pdf` | 3.386 | 1.817 | 4 | 442, 304, 464, 581 |
| RRHH-04 `.md` | 1.530 | 1.495 | **1** | 1.493 |
| RRHH-05 `.txt` | 1.825 | 1.656 | 3 | 405, 635, 611 |

**NOR-04 es `.pdf` y su texto SÍ se extrae** — 1.817 caracteres, cuatro trozos.
No hace falta pedir otro formato.

### ⚠️ LAS OCHO LONGITUDES DE CLI-01 SON, UNA A UNA, LAS DE F-116

La reconstrucción de `claude/consultas-fable/F-116.md:28-43` listaba los ocho
fragmentos de CLI-01 con sus longitudes tomadas «del registro y de la base»:
chunk 0 → 476, 1 → 653, 2 → 998, 3 → 392, 4 → 890, 5 → 1.073, 6 → 450, 7 → 789.
**Este fichero las reproduce exactamente, en el mismo orden de índice.**

Es un CONTROL POSITIVO de esa reconstrucción, y vale más que la aritmética que
ya estaba: hasta hoy el reparto sólo se podía comprobar contra un log pegado en
un encargo. Ahora se puede volver a producir desde el repositorio, sin base de
datos y sin gastar un crédito.

Y confirma la historia entera, fragmento por fragmento:

- **«134 °C» vive en el fragmento 4** — el que en aquel reparto **no cupo por 17
  caracteres**. El juez nunca lo vio.
- **«30 días en condiciones normales de almacenamiento» vive en el fragmento 6**
  — que sí entró (5.º en orden de parecido, 450 caracteres, acumulado 2.577).
  El juez citó lo que tenía delante.

**El falso positivo del autoclave era exactamente eso: citar el fragmento 6
porque el 4 no cabía.** Reproducible desde `corpus-pruebas/`.

## LOS CUATRO FALSOS QUE ESTOS DOCUMENTOS DESBLOQUEAN

Numerados como en `Consulta_Fable_F22_Juez.md:63-84` y como en el bloque
`LOS_QUE_NO_ENTRAN` de `examen/casos/N1_falsos_conocidos.mjs`.

### Falso 1 · «pelo recogido» — MKT-01 ↔ RRHH-05 · patrón 1, las dos citas dicen LO MISMO

| | |
|---|---|
| En MKT-01 | «Pelo recogido durante la atención clínica al paciente» — fragmento **2** |
| En RRHH-05 | «Pelo recogido en todo el personal clínico durante la atención al paciente» — fragmento **1** |
| Por qué NO es contradicción | la segunda es la primera con el sujeto explícito. No hay dos valores en oposición: hay una regla escrita dos veces |
| Discriminantes | `MEDIBLE` |

### Falso 3 · esterilización — RRHH-04 ↔ RRHH-06 · patrón 2, una dice que algo EXISTE y la otra que a alguien LE FALTA

| | |
|---|---|
| En RRHH-04 | «Protocolo de esterilización y control de infecciones (ver CLI-01 y CLI-02)» — fragmento **0**, sección 1 |
| En RRHH-06 | «Pendiente reciclaje de esterilización» — fragmento **16** (una fila de la hoja) |
| Por qué NO es contradicción | una dice que la formación existe en el catálogo; la otra, que un empleado concreto la tiene pendiente. Son coherentes |
| Discriminantes | `MEDIBLE` |

### Falso 4 · alarma — NOR-04 ↔ OPE-01 · patrón 3, emparejamiento sin relación semántica

| | |
|---|---|
| En NOR-04 | «Activar la alarma y avisar al resto del personal» — fragmento **1** (incendio) |
| En OPE-01 | «Desactivar la alarma y encender la iluminación general» — fragmento **0** (apertura matinal) |
| Por qué NO es contradicción | dos momentos distintos del día, y dos alarmas con función distinta |
| Discriminantes | `MEDIBLE` |

### Falso 5 · autoclave — OPE-01 ↔ CLI-01 · patrón 3 · **ES EL QUE DISPARÓ F-116**

| | |
|---|---|
| En OPE-01 | «se debe programar el autoclave a 121 °C durante 30 minutos» — fragmento **1** |
| En CLI-01 | «30 días en condiciones normales de almacenamiento» — fragmento **6** |
| Por qué NO es contradicción | empareja dos «30» que no comparten unidad: minutos de ciclo contra días de caducidad del envasado |
| Discriminantes | `MEDIBLE` |

### ⚠️ Y LA TRAMPA REAL DEL MISMO PAR, que es la mitad que no se puede olvidar

El par OPE-01 ↔ CLI-01 tiene **una contradicción de verdad** que el 23/09 no se
detectó: el ciclo de autoclave.

| | |
|---|---|
| En CLI-01 | **134 °C / 18 min** — «134 °C» en el fragmento **4** |
| En OPE-01 | **121 °C / 30 min** — «121 °C» en el fragmento **1** |
| Qué es | contradicción REAL. Su caso la lleva en `debenSalir`, no en `noDebenSalir` |
| Discriminantes | `MEDIBLE` |

**Un caso de este par que sólo vigilara el falso mediría la mitad.** El 23/09 el
sistema falló las dos a la vez —emitió el falso y no vio el verdadero— y las dos
tienen la misma causa: el fragmento 4 fuera del presupuesto. Si un día el falso
muere y la trampa sigue sin detectarse, eso **no** es un arreglo: es el mismo
fallo con menos ruido.

## LOS TRES QUE ESTOS FICHEROS **NO** DESBLOQUEAN

No es una lista de pendientes: es lo que ningún fichero puede arreglar.

| # | Falso | Qué falta | Quién puede darlo |
|---|---|---|---|
| 2 | calzado · MKT-01 ↔ RRHH-05 | **la cita literal**. F-22 dice sólo «ídem con el calzado» | el informe de agosto, o el director |
| 6 | Nuria Ferrer · RRHH-06 ↔ OPE-02 | **las dos citas**. F-22 da sólo el título | ídem |
| 7 | sin identificar | **cuál es**. F-22 dice SIETE y enumera SEIS | ídem |

⚠️ **El 7 no se inventa y no se cuenta.** Un informe del examen que dijera «7 de
7 muertos» sobre una lista de seis fabricaría la métrica que mide a todas las
demás.

Y el 2 no es «el mismo caso con otra frase»: el calzado de RRHH-05 dice
«Calzado cerrado, antideslizante y de uso exclusivo en clínica» (línea 20), y
sin saber qué citó MKT-01 no se puede afirmar que fueran la misma regla escrita
dos veces. Emparejar por tema es exactamente lo que F-22 §4.1 midió que no se
puede hacer.

## ⚠️ TRES FRAGILIDADES MEDIDAS, que van aquí porque nadie las va a buscar

### 1 · RRHH-04 produce UN trozo por SIETE caracteres

El trozo único mide **1.493** caracteres y `MAX_CHUNK_SIZE` es **1.500**
(`lib/chunking.ts:28`). **Siete de margen.** Añadir una línea al documento lo
parte en dos, y entonces el discriminante del falso 3 —que hoy vive entero en
el fragmento 0— puede caer en una costura.

**Esto responde a la pregunta del director**, y la respuesta es la primera de
las dos que planteó: **el documento es corto de verdad, la extracción NO se
quedó a medias.** 1.495 caracteres extraídos de 1.530 bytes, y el documento
termina donde debe («- NOR-03, Prevención de riesgos laborales.»). Un solo trozo
activo es CORRECTO.

⚠️ Y es un CASO DECISIVO de `MAX_CHUNK_SIZE`, que es de los que la casa persigue:
subirlo no cambia nada aquí, **bajarlo ocho caracteres parte este documento**.
Es el primer documento del corpus que lo ejerce por tan poco.

### ⚠️⚠️ EL AVISO CON FECHA DE CADUCIDAD, y va con estas palabras porque lo pidió el director

> **El caso del falso 3 (`N4_esterilizacion_pendiente.mjs`) vive a OCHO
> CARACTERES de dejar de funcionar.** RRHH-04 da hoy un solo trozo, y con un solo
> trozo no existe ninguna costura donde su discriminante pueda partirse: está a
> salvo **por construcción, no por suerte**. Ocho letras más en el documento y
> hay dos trozos, y entonces «Protocolo de esterilización y control de
> infecciones» puede caer justo en la costura.
>
> **SI ALGUIEN EDITA RRHH-04, HAY QUE REMEDIR EL TROCEADO ANTES DE CREERSE UNA
> PASADA DE ESE CASO.** No basta con que el fichero siga teniendo la frase: lo
> que decide es en cuántos trozos cae y si la frase sobrevive entera en uno.

Lo que lo hace un aviso y no una bomba: **el verificador lo canta antes de pagar**.
`verificarDiscriminantesEnFragmentos` corre en cada pasada y sobre los fragmentos
reales, así que un `PARTIDO_POR_UNA_COSTURA` aborta el caso sin gastar los cinco
créditos. Lo que el verificador **no** puede hacer es avisar de que la línea de
base dejó de ser comparable — eso sólo lo sabe quien lea esto.

⚠️ Y el aviso vale para los otros cuatro documentos por la misma razón, sólo que
con más margen: sus trozos van de 304 a 1.073 caracteres, así que **cualquier
edición mueve las costuras** y los discriminantes que hoy caben enteros pueden
dejar de caber. El fichero se remide entero, no sólo el que se tocó.

### 2 · ✅ CORREGIDO EL MISMO DÍA — RRHH-04 era el primer `.md` del corpus y `*.md text` le cambiaba los bytes

`corpus-pruebas/.gitattributes` declara `*.md text` con este motivo escrito:
*«los registros de siembra SÍ son documentación nuestra: texto normal, con sus
finales de línea normalizados»*. La regla se escribió **por extensión y no por
nombre a propósito**, para que un registro nuevo no quedara sin regla.

**RRHH-04 es un DOCUMENTO DEL CORPUS con extensión `.md`, y hereda la
normalización.** Medido:

```
git cat-file -p 31c141d6:corpus-pruebas/RRHH-04_...md | wc -c   →  1.530  (LF)
wc -c < corpus-pruebas/RRHH-04_...md                            →  1.575  (CRLF)
git check-attr -a corpus-pruebas/RRHH-04_...md                  →  text: set
```

**45 caracteres CR inyectados en el checkout.** Es el mismo argumento por el que
ese fichero declara `*.txt -text`: *«CLI-03 es texto, pero es un DOCUMENTO DEL
CORPUS: sus bytes son el dato»*. Valía igual para éste.

⚠️ **Y LO QUE NO HACÍA, porque se midió antes de decirlo**: no cambiaba el
troceado. Con LF y con CRLF el resultado es **un trozo de 1.493 caracteres en
los dos casos** — la limpieza del troceador colapsa los espacios antes de medir.
Lo que sí cambiaba eran **los caracteres extraídos (1.540 con CRLF contra 1.495
con LF)**, y de ahí salen `full_text` y `content_hash`: la copia del repositorio
**no era byte a byte la que el director indexó**. Para el troceado da igual;
para cualquier comparación por hash, no. Por eso se arregla aunque el efecto
medido sea nulo: **un «no cambia nada» es una afirmación sobre TODOS los
consumidores, y `content_hash` ya era uno que sí.**

**LA CORRECCIÓN, en este mismo commit** — la regla pasa a ir por el ROL en vez
de por la extensión, sin nombrar ningún fichero (el prefijo `SIEMBRA_` ES la
marca de rol), y el orden decide porque git aplica el último patrón que casa:

```
*.md         -text      → por defecto, un .md de esta carpeta es DATO
SIEMBRA_*.md text       → un registro es documentación nuestra y se normaliza
```

Comprobado con `git check-attr -a`: `RRHH-04…md → text: unset`,
`SIEMBRA_*.md → text: set`. Y el fichero re-extraído del blob: **1.530 bytes en
disco**, iguales a los del repositorio. Las cifras de la tabla de arriba son ya
las de LF.

### 3 · El verificador de discriminantes es MÁS ESTRICTO que el producto

Los discriminantes de los falsos 1 y 5, transcritos tal como F-22 los recoge,
salieron **`NO_MEDIBLE` con el fallo `AUSENTE`** — y las dos frases **están en
sus documentos**:

```
CLI-01:104-105   «La caducidad del envasado estéril es\nde 30 días en condiciones…»
RRHH-05:26-27    «- Pelo recogido en todo el personal clínico durante la atención al\n  paciente»
```

Están **partidas por un salto de línea del documento**, no por una costura del
troceado. `fragmentosConLaFrase` compara con `text.includes(frase)`, exacto; el
producto, para decidir si una cita existe, usa `normalize()`
(`lib/analysis/normalize.ts:37-43`), que **colapsa los espacios**.

⚠️ **Son dos implementaciones del mismo criterio y ya han divergido.** La
consecuencia no es teórica: el examen declara `NO_MEDIBLE` un discriminante que
el juez **sí podría citar y verificar**. Es un `NO_MEDIBLE` falso, y su mensaje
—*«O el documento cambió, o el discriminante se escribió mal»*— manda a buscar
en dos sitios donde no está el problema. Todo documento maquetado a 70 columnas
va a chocar con esto: cualquier discriminante de más de una línea contiene un
salto.

**HOY se ha rodeado, no arreglado**: los dos discriminantes se han acortado a
una frase que no cruza salto de línea, y con eso los cinco dan `MEDIBLE`. La
elección queda escrita para que nadie la lea como capricho:

| Falso | Discriminante usado | Por qué éste |
|---|---|---|
| 1 | `Pelo recogido en todo el personal clínico` | cabe en la línea 26 de RRHH-05, sin cruzar el salto |
| 5 | `30 días en condiciones normales de almacenamiento` | cabe en la línea 105 de CLI-01 |

⚠️ **Y NO SE ARREGLA AQUÍ, a propósito.** La cura doctrinal es que el examen use
el criterio del producto en vez de tener el suyo — pero `normalize` vive en un
`.ts` que `discriminantes.mjs` no puede importar, y `normalize.ts` lleva escrito
que sus dos comparaciones *«viven juntas a propósito … la única defensa contra
importar la que no era es que no se puedan leer por separado»*. **Mover
`normalize` rompería un invariante declarado por escrito**, y eso no lo decide
quien pasaba por aquí.

#### LAS TRES OPCIONES, con su coste y su riesgo — para que el arquitecto decida

**El problema, en una frase**: `¿existe esta frase en este texto?` está
implementado dos veces —`includes` en el examen, `normalize()` en el producto— y
ya divergen. La decisión no es cómo comparar: es **dónde vive el criterio**.

**A · MOVER `normalize` A UN `.mjs` QUE LOS DOS MUNDOS PUEDAN IMPORTAR**
`lib/analysis/normalize-core.mjs` con el cuerpo, y `normalize.ts` re-exportando.
- **Coste**: dos ficheros tocados. `tsconfig.json` ya tiene `allowJs: true` y
  `moduleResolution: "bundler"`, así que el import desde `.ts` type-checa sin
  declaración a mano — comprobado en el tsconfig, **no ejecutado**.
- **Riesgo**: ⚠️ **rompe el invariante escrito de `normalize.ts`**. Ese fichero
  declara que `normalize` (BUSCAR, agresiva) y `esVarianteDeEscritura` (COMPARAR,
  conservadora) *«viven juntas a propósito»* porque **el modo de fallo es importar
  la que no era**. Sacar una de las dos de la habitación es exactamente lo que el
  comentario prohíbe. Si se elige esta opción, **el invariante hay que reescribirlo
  en el mismo commit**, no dejarlo mintiendo.
- **Lo que gana**: es la única que deja UNA implementación. Las otras dos dejan
  dos y se conforman con que no divergan.

**B · QUE EL EXAMEN PIDA EL CRITERIO AL PRODUCTO POR EL ENDPOINT**
El endpoint del examen ya devuelve los fragmentos; que devuelva además el
veredicto de pertenencia de cada discriminante, calculado en servidor con
`normalize()`.
- **Coste**: una entrada más en un endpoint que ya existe, y el ejecutor deja de
  comparar: pregunta.
- **Riesgo**: mete el criterio del examen DENTRO del producto, que es lo que
  `lib/pinecone/corpus-del-examen.ts` se prohibió explícitamente —*«meterle un
  modo al filtro del producto para que el examen quepa sería poner el instrumento
  de medida dentro de lo que mide»*—. Y encima ese endpoint es el que decide si se
  gasta o no: darle una responsabilidad de juicio lo acerca a ser juez y parte.
- **Lo que gana**: cero duplicación y cero movimiento de `normalize`.

**C · DEJAR DOS Y ATARLAS CON UN CASO QUE FALLE SI DIVERGEN**
Una batería que pase las mismas parejas (frase, texto) por las dos y exija el
mismo veredicto, con los casos que hoy divergen dentro: la frase partida por un
salto de línea, la que lleva markdown, la que cambia de caja.
- **Coste**: el más bajo de los tres. Un fichero de test nuevo, nada de producción.
- **Riesgo**: es la opción que la casa tiene prohibida por escrito —*«dos
  implementaciones del mismo criterio no se mantienen sincronizadas: se
  separan»*—. Un test de equivalencia retrasa la separación, no la impide: el día
  que alguien añada un caso a una y no a la otra, el test sólo lo caza si el caso
  nuevo está en la lista.
- **Lo que gana**: hoy mismo pondría en verde los discriminantes largos sin tocar
  nada del producto.

⚠️ **MI LECTURA, y es sólo eso**: la A es la única que cura, y su riesgo es
**documental y no funcional** —un comentario que hay que reescribir, no un
comportamiento que cambia—. La C es la más barata y la que esta casa ya ha pagado
tres veces con otro nombre. Pero la decisión es del arquitecto y el rodeo de hoy
aguanta sin prisa: discriminantes que no cruzan salto de línea, con la elección
escrita caso por caso.

## LA COMPROBACIÓN, PARA REPETIRLA

Las cifras de este registro salen de correr el camino de indexación sobre los
ficheros y el verificador sobre sus fragmentos. No hay red, ni base, ni modelo:
es código puro con entrada conocida. Cualquiera puede volver a producirlas, y
el día que un cambio de troceado las mueva, este registro queda desmentido por
la misma vía por la que se escribió.

⚠️ **Lo que la medición del repositorio NO dice**: si estos cinco están
indexados en la organización de pruebas con estos mismos fragmentos. Eso vive en
Supabase y en Pinecone, y se pregunta con
`SQL_examen_estado_de_los_documentos.sql` (ampliado a estos cinco) y con
`GET /api/admin/vectores-de-un-documento`. **Un fichero en `corpus-pruebas/` es
condición necesaria y no suficiente**: el examen mide contra lo indexado.
