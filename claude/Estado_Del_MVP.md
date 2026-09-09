# Estado del MVP — 09/09/2026

*(Actualizado el 09/09 con las tandas A1, A3 y A6 y con B.177 y B.198
cerrados. Lo del 07/09 que sigue vigente se mantiene tal cual.)*

Para decidir si esto se puede enseñar. **Sin plan: solo el estado.**

---

# 0 · ⚠️ LO QUE TODAVÍA NO HA CORRIDO — dos celdas, y se dicen primero

Este estado se pidió «cuando termine el lote y la reparación». **No han
terminado, y no voy a rellenar esas dos casillas con lo que espero que pase.**

| pendiente | por qué no ha corrido |
|---|---|
| **El control positivo con `new 9.txt`** | falta la consulta que dice si es manual o de OneDrive. Si es de la nube, da 501 y **hoy no hay control positivo** (B.195) |
| **El lote sobre el resto** | escrito y verificado, `6030125d`, **sin pushear y sin estrenar** |

**Todo lo demás de este documento está verificado hoy contra el código y el
registro**, no contra la memoria. Donde algo se ha comprobado abriendo un
fichero, va la línea.

---

# 1 · LAS TRES PIEZAS DE F-103 P3

| pieza | estado | evidencia |
|---|---|---|
| **1 · El inventario de caminos** | ✅ **HECHA** | `Inventario_Caminos.md`, cerrado el 05/09. Diecinueve caminos en tres familias — ocho que producen informe, cuatro del agente, siete que cambian el corpus |
| **2 · Los denominadores en los ceros** | ✅ **HECHA** | `lib/analysis/diff-vision.ts` + siete claves `diff.vision.*` en el catálogo. Entró en `0e92faa`, **no llegó a producción hasta `b9afe760`** porque aquel commit tumbó el build (B.197). Estrenada el 07/09 en A1 |
| **3 · Una remedición por camino** | 🔄 **EMPEZADA** | **tres de ocho caminos** (A1, A3, A6) — y las tres REMEDIDAS el 09/09 sobre un corpus de un solo cortador, con `candidatos 1` y `pares_ciegos 0`. Quedan A2, A4, A5, A7 y A8: A1 medida el 07/09 con denominador (1·60 vs 1·60, 0 ciegos, 16/19/25/25) y con el modo declarado. Las dos entradas viejas (15/15/2 y 2/2/0) siguen sin poderse asignar a una fila hasta B.178 |

⚠️ **La pieza 3 estaba bloqueada por la 2 por decisión propia**, no por
casualidad: el plan fijó que los denominadores van ANTES de cualquier remedición
que pueda dar cero, porque «una tanda sin denominador que salga cero no se puede
interpretar, y eso es gastar 30 créditos para no saber nada». **El bloqueo se
levantó el 07/09**, y en el orden previsto: primero los denominadores, después la
primera remedición.

⚠️ **Y LA PRIMERA TANDA CON DENOMINADOR DEMOSTRÓ QUE EL ORDEN ERA EL BUENO, por
el camino que no se esperaba.** A1 no dio cero: dio 16 con los dos lados viendo.
Lo que estuvo a punto de fallar fue **la lectura**, no la medida — una consulta
pidió una clave inexistente, `->>` devolvió NULL, y ese NULL se leyó como «el
contador no vio nada» durante tres pasadas. El denominador hizo justo su trabajo:
`tablas_candidatos` volvió con un 1 en la misma fila, y ese 1 es lo que probó
que la etapa había corrido y que el hueco estaba en la pregunta.

**Dos de tres**, y la que falta es la larga.

---

# 2 · LO QUE HA ENTRADO ESTOS DÍAS, Y POR QUÉ NO ESTABA EN EL PLAN

Del 04 al 07 de septiembre no se ejecutó el plan: se ejecutó **lo que el plan no
podía saltarse**. La regla que lo ordenó es de F-104 — *un cambio que altera lo
que queda guardado no entra hasta que exista la vía de reparación de lo ya
guardado* — y el disparador fue B.182, que resultó ser del ÍNDICE y no del modal.

## 2.1 · La vía de reparación, que no existía

| pieza | qué hace |
|---|---|
| **El lector del sello** | `estado-de-reparacion.ts` + `/api/admin/estado-del-corpus`. Antes, `extractor_version` se escribía en cuatro sitios y **no lo leía nadie** |
| **El contrato del sello** | escrito en la misma línea donde alguien lo va a tocar: *sube si y solo si cambia lo que el troceador produce* |
| **El plan** | `plan-de-reindexado.ts` — separa REPROCESAR de RE-TROCEAR, y rechaza lo que perdería celdas |
| **El escritor** | `/api/admin/reindexar` — reindexa **sin borrar**: generación nueva entera, conmutación, y la vieja sirviendo mientras tanto |
| **La lectura dual** | `lectura-dual.ts` — acepta segmentos o texto plano, con caducidad declarada |
| **La reparación enriquecedora** | lo que se lee para trocear **se vuelve a guardar**: un documento que entró sin segmentos sale con ellos y desde entonces se repara sin el proveedor |
| **El lote** | ocho por llamada, relanzable, y converge |

## 2.2 · El cambio que la exigía

**El cortador arreglado (B.182) y el sello a 3.** El arranque de cada trozo usa
ahora el mismo criterio que el final. Antes, seis de cada siete trozos de un CSV
abrían a media fila — no se perdía nada, **se añadía un dato plausible y falso**,
que es peor.

Y el sello subió, que es la primera vez que se ejerce el contrato. **Los 38
documentos del corpus pasan a «desactualizados» de golpe: no es una avería, es la
primera vez que el sistema puede decirlo.**

## 2.3 · Lo que se puede comprobar hoy y no se podía el 04

· **615 casos** en 48 ficheros, verdes, con `tsc` limpio. Hoy entraron 19.
· **La foto congelada del troceado** — cinco entradas sintéticas con su huella:
  si el cortador cambia, se sabe exactamente qué se movió.
· **Los segmentos persistidos**, con su coste medido (1,27×) y su condición de
  retirada escrita.
· **Cada reparación imprime y devuelve sus `ms`** — el denominador que no existía.

---

# 3 · LO QUE APARECIÓ SIN BUSCARLO

Nueve fichas nuevas en cuatro días. **No significa que el sistema empeore: significa
que se miró en sitios nuevos** (F-103, regla 3).

| ficha | qué es | estado |
|---|---|---|
| **B.182** | el cortador rompe filas — y es del ÍNDICE, no del modal | ✅ arreglado hoy |
| **B.191** | la guarda preguntaba «¿tiene trozos tabulares?» creyendo preguntar «¿tiene tablas?» | ✅ arreglado |
| **B.193** | un caso que fallaba una de cada cuatro veces por presupuesto de tiempo | ✅ arreglado, cazado en el acto a 5021 ms |
| **B.185** | la conmutación metía en el corpus documentos sin revisar | ✅ arreglado |
| **B.187** | cambiar la carpeta de Drive borraba el corpus de la anterior | ✅ arreglado (era latente) |
| **B.190** | cinco documentos con texto y sin trozos | 📋 medido: historia, no fallo vivo |
| **B.194** | la reparación no se puede probar antes del cambio que la exige | 📋 declarado |
| **B.195** | el plan prefiere la reparación COMPLETA a la DISPONIBLE: un documento de la nube con segmentos da 501 aunque re-trocearlo funcionaría | 📋 abierto, con la pregunta y sin solución |
| **B.197** | un `export` de más en un `route.ts` tumbó el build de Vercel y dejó producción atrás — y `npm run typecheck` lo dio por verde | ✅ arreglado y con gate, `b9afe760` |


## ⚠️ 3.1 · B.197 — y lo que «verde» ha significado esta semana

El 07/09, `0e92faa` metió un `export function respuestaDeReparacion` dentro de
`app/api/admin/reindexar/route.ts`. Next solo admite ahí los verbos HTTP y la
configuración de segmento, así que **el build de Vercel murió y producción se
quedó desactualizada** hasta `b9afe760`.

> Type error: Route "app/api/admin/reindexar/route.ts" does not match the
> required types of a Next.js Route.
>   "respuestaDeReparacion" is not a valid Route export field.

El arreglo es aburrido —la función se muda a `lib/documents/respuesta-de-reparacion.ts`—
y **no es lo que hay que apuntar**. Lo que hay que apuntar es por qué pasó en verde.

### La explicación fácil era falsa, y la medida es peor

La primera lectura fue «`tsc` no ve esto porque es una regla del FRAMEWORK, no
del lenguaje». **Es mentira, y se comprobó antes de escribirla en ningún sitio.**

`tsc` sí la ve. La comprobación vive en `.next/types/app/…/route.ts` —que
`tsconfig.json` incluye en su `include`, línea a la vista— donde Next escribe un
`checkFields` por ruta contra `typeof import(la ruta)`. Medido el 07/09 volviendo
a meter el export intruso a propósito:

| `.next/types/…/reindexar/route.ts` | `tsc --noEmit` |
|---|---|
| **presente** | **ROJO**, en el acto, con el nombre del intruso |
| **ausente** | **VERDE — con el fallo dentro** |

**Y ese fichero lo escribe `next build`. `npm run typecheck` ni lo genera, ni
comprueba que exista, ni se entera de que falta.**

### Por qué esto es peor que «el gate no cubre esa clase»

Un gate que no cubre una clase de error se sabe. **Éste la cubre para las rutas
que ya existían la última vez que alguien construyó, y tiene un agujero con la
forma exacta de una ruta NUEVA.** `app/api/admin/reindexar/route.ts` nació el
06/09 (`378d985a`) y el export de más le entró el 07/09 (`0e92faa`): **nunca hubo
comprobación que saltarse, porque para esa ruta nunca llegó a escribirse.**

⚠️ Lo que aquí NO está medido, y se dice: cuándo fue la última vez que algo
regeneró `.next/types` en esta máquina antes del fallo. Lo medido es el
mecanismo —presente rojo, ausente verde— y que el artefacto solo lo escribe
`next build`. Del estado exacto que tenía aquella tarde no queda registro.

Es la forma de F-103 otra vez, y esta vez sobre el propio instrumento: **el verde
no decía «lo he mirado y está bien», decía «no lo he mirado».** Una pantalla
apagada, no una medición — sobre el gate con el que se ha validado todo lo demás.

⚠️ **QUÉ SIGNIFICA PARA LO YA APROBADO ESTA SEMANA.** No hay que reabrir nada por
esto: el agujero es de ESTA clase —lo que un `route.ts` exporta— y no toca los
tipos del resto del repositorio, que sí se comprueban de punta a punta. Pero el
enunciado «typecheck limpio» que aparece en `B195_Via_Y_Catalogo.md` y en varios
mensajes de commit **significaba menos de lo que parecía en las rutas nuevas**.

Y son **cuatro** desde el 01/09, no tres — `git log --diff-filter=A`, no la
memoria, que es justo el fallo que esta casa ya tiene escrito («se dijo *los TRES
puntos de indexación* y eran CUATRO»):

| ruta | commit | día |
|---|---|---|
| `app/api/admin/config` | `bc4377c8` | 03/09 |
| `app/api/admin/estado-del-corpus` | `af2d6efa` | 06/09 |
| `app/api/admin/reindexar` | `378d985a` | 06/09 |
| `app/api/admin/reindexar-lote` | `6030125d` | 07/09 |

**Las cuatro pasan hoy el caso nuevo**, y con ellas los 58 `route.ts` del
repositorio.

### El gate que entra, y por qué lee la fuente

`lib/rutas-solo-exportan-lo-permitido.test.ts`: barre los 58 `route.ts` de `app/`
y comprueba que no exportan nada fuera de la lista cerrada de verbos y
configuración. **Lee la FUENTE, no `.next/types`** — es la única forma de que el
caso valga igual el día que la ruta se acaba de crear, que es justo el día en que
hace falta.

- **117 casos** (58 rutas × 2 comprobaciones + 1), con **control positivo del
  barrido**: si encontrara menos de once ficheros, falla — un barrido vacío
  pasaría todo sin comprobar nada, que es la forma exacta de un cero sin
  denominador.
  ⚠️ El mensaje de `b9afe760` dice «119» y **está mal**: 119 es lo que salió en
  la ejecución de FALSACIÓN, que añadía una ruta de prueba. Un número copiado de
  la corrida equivocada — la misma especie que la «cota inferior» del 06/09.
- **Falsado**: con un `export` intruso metido a propósito en una ruta de prueba,
  rojo con el nombre. Un caso que no se ha visto fallar no prueba nada.
- Vigila aparte `export default` y `export { x }`, que el regex no ve.

⚠️ **LO QUE NO ARREGLA, dicho:** esto cubre una clase, no el build. Y
`next typegen` no sirve de sustituto — en 15.1 produce un validador más flojo
que **no** mira los exports de un handler, comprobado con el mismo intruso.

### ⚠️ SÍ HAY GATE LOCAL, y llevaba desde el 27/08 delante de las narices

**La creencia que hizo posible B.197 no fue sobre `tsc`: fue «el build no
funciona en esta máquina, así que solo se puede ver en Vercel».** Es falsa. Tres
ejecuciones medidas hoy, con y sin el export intruso:

| ejecución | fase de tipos | resultado |
|---|---|---|
| intruso, heap por defecto | **falla** | `Failed to compile` + `Type error`, nombrando `intrusoDePrueba`, en ~60 s. **El error de Vercel, en local.** |
| limpio, heap por defecto | **revienta** | `Zone Allocation failed`, `code: 134`, DENTRO de la fase de tipos. Sin veredicto. |
| limpio, **`--max-old-space-size=8192`** | **pasa** | llega a `Collecting page data` y muere después, en `Generating static pages`. **Veredicto: aprobado.** |

De donde sale el comando, y es lo más útil que deja esta ficha:

> ```
> NODE_OPTIONS="--max-old-space-size=8192" CI=true npx next build
> ```
> **Llegar a «Collecting page data» es el APROBADO.** Ahí ya ha corrido entera la
> fase «Linting and checking validity of types», que es exactamente la que tumbó
> `0e92faa`. El petardazo posterior en «Generating static pages» es la RAM de la
> máquina y se ignora.

⚠️ **Y EL HEAP NO ES UN DETALLE, ES LA DIFERENCIA ENTRE MEDIR Y NO MEDIR.** Con
el heap por defecto la fase de tipos **no termina**: revienta por memoria y deja
un final que **se parece muchísimo a haber acabado bien**. Es la misma trampa que
esta ficha entera describe —un resultado que no distingue «he mirado» de «no he
podido mirar»— y aquí estuvo a punto de hacerme escribir que el build local no
servía como gate. Servía; le faltaba memoria.

El apunte del 27/08 decía que 6 GB «no lo arregla». Es cierto para el build
COMPLETO —la generación de páginas sigue sin caber— y **no** para lo único que
hacía falta aquí, que es cruzar la fase de tipos.

### El reparto que queda

| lo que se quiere saber | cómo se comprueba en local |
|---|---|
| tipos del repo | `npm run typecheck` |
| lógica y contadores | `npm run test` |
| **que Next acepta las rutas** | `npm run test` (el caso nuevo): segundos, y **fiable en verde y en rojo** |
| **la fase de tipos entera, como Vercel** | `NODE_OPTIONS=--max-old-space-size=8192 CI=true npx next build` → «Collecting page data» |
| que el build entero pasa | **solo Vercel** |

Los dos primeros son baratos y van siempre. El cuarto cuesta ~2 minutos y **es el
que hay que correr antes de pushear una ruta nueva o tocada** — que es el hueco
exacto por el que se cayó producción.

⚠️ **PERO NO DE CUALQUIER MANERA, Y ESTO SE APRENDIÓ FALLANDO:** la primera sonda
para medir todo esto se llamó `app/api/_prueba_b197/`, **con guion bajo — que en
el App Router significa carpeta PRIVADA, no enrutada.** El build pasó la fase de
tipos tan tranquilo y estuvo a punto de quedar escrito que «el build local
tampoco lo caza». No lo cazaba porque **aquello no era una ruta**. Es otra vez la
misma especie: un cero que no medía nada, salvado por rehacer la sonda con un
nombre sin guion bajo. Sin ese segundo intento, esta tabla diría lo contrario.

⚠️ **Y el artefacto miente en las DOS direcciones.** Al borrar la sonda,
`.next/types` se quedó con los ficheros de una ruta que ya no existe y
`npm run typecheck` empezó a dar errores **de una ruta inexistente**. Cuando
falta una entrada esconde un fallo real; cuando le sobra una, **inventa uno
falso**. Un gate colgado de un artefacto generado no es de fiar en ninguno de los
dos sentidos, y por eso el caso nuevo lee la fuente.

---

# 3.2 · ✅ LOS OCHO EXCEL, REPARADOS (09/09/2026)

Sin borrar nada, sin lápidas y sin perder un análisis. La maniobra fue **un
`UPDATE` de una columna**: `source_modified_at = NULL` sobre los ocho `.xlsx`
sin segmentos, que es lo que `sync:214` mira para saltarse un fichero. Con el
cerrojo a nulo, el sync los volvió a descargar.

| censo | antes | después |
|---|---|---|
| `al_dia` | 2 | **10** |
| `reparable_automaticamente` | 2 | 2 |
| `reparable_resubiendo` | 36 | **28** |

Los ocho salen con `extractor_version 3` y **segmentos guardados**: a partir de
hoy, cualquier cambio del TROCEADO los repara desde casa sin resubir nada.

⚠️ **SIETE SE ARREGLARON SOLOS Y UNO PIDIÓ APROBACIÓN**, y la diferencia no es
casual: `sync:255` versiona **solo si el documento está `analizado`**. Los siete
estaban `pendiente`, así que el sync sobrescribió su fila en el sitio
(`sync:404`, con `segments` y `extractor_version`) — cero créditos, cero
revisiones. OPE-11 sí estaba `analizado`, se guardó como versión en vuelo y su
generación avanzó a 2 al aprobarla.

## ⚠️ Y OPE-10 VOLVIÓ SOLO — la lápida no lo impidió

Se había perdido antes y **nadie lo sabía**: no estaba en el corpus cuando se
hizo el censo, que es la razón por la que la consulta de `.xlsx` devolvió ocho
y no nueve. Volvió con el sync, con segmentos y en la versión vigente.

**Lo que enseña no es que volviera: es que su ausencia no la detectó nada.** Ni
el censo —que cuenta lo que existe, así que un documento que falta es invisible
para él—, ni las tandas, ni el harness. Y OPE-10 es la mitad del par que da las
15 discrepancias del caso 6: sin él, esa cifra no se podía volver a medir y
nada lo habría dicho. El guardián más barato es que `Casos_Harness.md` nombra
sus cuatro ficheros (`:110-116`): un caso que compruebe que esos nombres siguen
resolviendo a documentos vivos lo habría cazado el día que pasó.

⚠️ **Y LA LÁPIDA DE OPE-10 NUNCA SE VERIFICÓ.** Se dio por hecha —por el usuario
al proponerlo y por mí al construir encima una maniobra segura de retirada— y el
retorno la desmiente. El mecanismo sí está verificado y la advertencia sobre
borrar el corpus entero SIGUE EN PIE: `documents/route.ts:71` manda
`user_excluded`, así que borrar 40 documentos sincronizados escribiría 40
lápidas y el corpus no volvería. Lo que no estaba verificado era que ESTE
documento tuviera una.

---

# 3.3 · ✅ B.199 CERRADO — y lo que enseñó su propio fallo (09/09/2026)

La reparación tiene interfaz: `settings/corpus`. Censo, reparar uno, reparar
todo lo reparable con el bucle que pulsa hasta que `hay_mas` baja, contador
entre rondas y botón de detener. Sin confirmación —no borra ni cambia
contenido— y con los dos avisos separados, que dicen cosas distintas: uno que la
reparación arregla el TROCEADO y no la lectura; el otro que **no vuelve a
analizar nada**, así que los análisis anteriores pueden haber quedado
incompletos.

⚠️ **SE ENTREGA SIN EJERCER Y ESO SE DECLARA.** Cero reparables, nada que pulsar,
primera prueba real en el próximo cambio de versión.

## ⚠️ LA PANTALLA REVENTÓ EN EL PRIMER INTENTO, Y LA CAUSA NO FUE LA PANTALLA

`Minified React error #31`: un objeto mandado a React como hijo. Pero el fallo
no estaba en el render — estaba en un **tipo escrito a mano**:
`recuento: Record<string, number>`, una SEGUNDA definición de un contrato que ya
existía en código. `recuentoPorEstado` devuelve los tres estados **y además** un
`anomalias` anidado, así que `Object.entries` lo arrastraba y lo pintaba.

**Es la misma especie que este frente lleva la semana retirando** —dos
definiciones de una cosa, que se separan sin avisar— y esta vez la escribí yo,
en la pieza que acababa de declarar como «la que no se puede probar».

⚠️ **Y ESA DECLARACIÓN ERA MEDIA MENTIRA, que es lo que hay que guardar.** Dije
que la pantalla se verifica a ojo porque no hay batería de páginas. Cierto para
un test; **falso para el tipo**. Con `type Recuento = ReturnType<typeof
recuentoPorEstado>` el código exacto que reventó **no compila**:

```
error TS2322: Type 'number | Record<AnomaliaDeSello, number>'
              is not assignable to type 'ReactNode'.
```

Comprobado restaurando el render malo con el tipo derivado puesto. **El fallo no
estaba fuera del alcance de la herramienta: lo puse yo fuera de su alcance** al
recopiar el tipo en vez de derivarlo. Y encaja con lo que el protocolo ya decía:
cuando la respuesta se pueda dar con el TIPO en vez de con un test, mejor con el
tipo — un test avisa a quien lo ejecuta; el tipo para el gate antes de que nadie
ejecute nada.

---

# 4 · QUÉ BLOQUEA

**NADA. Las dos están cerradas** (09/09/2026). Eran dos, en la misma pantalla y
las dos de la familia «el producto MIENTE al cliente» —el peor escalón de F-100—.
B.177 está arreglada y medida (4.1). **B.180 también**: los seis botones que
cobran dicen ahora lo que cuestan, con el número derivado de `CREDIT_COSTS` y en
la etiqueta, no en un `title` que en un móvil no existe.

⚠️ **«NADA BLOQUEA» NO ES «ESTÁ TERMINADO», y la diferencia es la de F-103:** lo
que queda no es una lista de fallos conocidos, es una lista de **caminos sin
medir**. Cinco de los ocho de la familia A no tienen tanda, los otros dos grupos
—cuatro del agente, siete que cambian el corpus— no tienen ninguna, y la
frontera del riesgo sigue siendo la COBERTURA y no el tiempo. Un hallazgo grave
nuevo no significaría que el sistema haya empeorado: significaría que se miró en
un sitio nuevo.

⚠️ Y conviene decirlo entero: B.177 no se cerró sola. Al ir a medirla apareció
B.198 —ese camino no había guardado NUNCA— y hubo que arreglar eso primero para
que la medición fuera posible. **La curva de gravedad no bajó porque el sistema
mejorara solo: bajó porque se miró donde no se había mirado** (F-103, regla 3).

## ✅ 4.1 · B.177 — ARREGLADO Y MEDIDO EL 09/09 (era el bloqueo mayor)

El reanálisis desde la bandeja mandaba `text` y nada más: sin `storagePath` no
hay fichero —`ingest:395` lo borra al indexar— y sin referencia al documento no
se rescataban sus chunks. **El diff recibía cero tablas.** El juez seguía
trabajando sobre texto aplanado, así que **el resultado no parecía roto: parecía
pequeño**, que es lo que lo mantuvo escondido.

**Arreglado en `2f6265c0`** con `documentoConEstructura` —referencia propia, que
NO sella el hash ni promociona versión— y la guarda de B.175 reusada tal cual,
porque el modal es un editor.

**Medido a los dos lados, mismo documento, misma puerta**: 06:56 con
`tablas_analizado 0` y `pares_ciegos 1` → 1 de 3; 07:34 con `tablas_analizado 1`,
`filas_analizado 60` y `pares_ciegos 0` → **3 de 3**.

⚠️ **Y B.198 IBA DEBAJO**, encontrado al ir a medir esto: ese camino **no había
guardado NUNCA** desde que existe la restricción de propietario, así que la
tanda era imposible antes de arreglarlo (`b65ca59d`). Dos averías, una sola
omisión: la petición no llevaba el id del documento que tenía delante.

## ✅ 4.2 · B.180 — ARREGLADO EL 08/09

Los dos botones del modal —«Reanalizar estilo» y «Reanalizar corpus»— no decían
lo que cuestan. **Arreglado en `a2b99c41`**: el precio va en la ETIQUETA, no en
un `title` que en un móvil no existe, y sale de `sufijoDeCoste`
(`components/improvement/ReanalyzeButtons.tsx:47-50, 61-63`), que lo deriva de
`CREDIT_COSTS` — lo que el servidor cobra de verdad, sin una segunda definición
del precio que pudiera separarse.

⚠️ **Y ESTA SECCIÓN ES SU PROPIA FICHA.** Hasta el 09/09 conservaba el titular en
presente —«no dicen lo que cuestan»— y una cita diciendo que ni la etiqueta ni el
tooltip mencionaban créditos, **un día después de que `a2b99c41` los pusiera**.
El párrafo de arriba ya decía que estaba cerrada: el documento contestaba dos
cosas distintas a la pregunta de qué bloquea, según por dónde se entrara.

---

# 5 · QUÉ SE DECLARA

Contado y dicho, no escondido. **Ninguno de éstos bloquea; todos hay que poder
decirlos en voz alta si alguien pregunta.**

⚠️ **CON DOS EXCEPCIONES, y se dicen aquí para no colarlas bajo el «ninguno
bloquea» de arriba: B.204 y B.205 entran SIN CLASIFICAR.** Están medidos y
escritos, y decidir si bloquean es del director, no de quien los encuentra. Un
hallazgo nuevo no se archiva en la casilla cómoda mientras nadie mira.

| declarado | dónde está escrito |
|---|---|
| **El modo Mejora — cuarentena por DOS motivos, y hay que contarlos por separado** | **(1) «Reanalizar todo» le falta una puerta**: A6, desde la bandeja, está arreglado y **medido** el 09/09 (3 · 57 · 0 · 0, con denominador); **A5, desde el chat**, tiene el arreglo del 04/09 y solo evidencia de LOG, sin tanda (F-102). **(2) «Reanalizar estilo» no tiene NINGUNA**: ni A7 (chat) ni A8 (bandeja) se han medido nunca. ⚠️ **Medir A5 cierra (1) y deja (2) viva**: esta fila se reescribe entonces, no se borra. ⚠️ **Y la cuarentena es DOCUMENTAL**: no existe ningún aviso en el producto — `cuarentena`, `beta` y `experimental` no aparecen en `app/`, `components/`, `lib/` ni `messages/`. Lo único que el modal pinta es `stageFailureCount` y `noGuardado` (`ImprovementModal.tsx:585-586`) |
| **Las tablas en PDF y CSV siguen partiéndose** | la opción A da filas enteras; la cabecera no se repite hasta la opción C |
| **La vía del proveedor (`reprocesar`) es MOOT, no pendiente** | `via_no_construida` = **0**: ningún documento del corpus la necesita. Sus dos preguntas abiertas —el hash que pudo cambiar en la nube, el motivo de conmutación que no existe— vuelven el día que el catálogo declare un cambio de `extraccion`, no antes |
| **La puerta principal es de escritorio** | cinco caminos (A5-A8, B3) no existen en un teléfono — y son a los que el producto empuja al cliente |
| **`json`, `html` y la rama `default`** | `∅`: nunca probados por ninguna vía |
| **OneDrive — ingesta y SINCRONIZACIÓN ejercidas** | La ingesta desde el 07/09 (OPE-14) y **la sincronización el 09/09, sobre 36 documentos**: 33 sobrescritos en el sitio, 3 versionados y aprobados. Sigue sin ejercerse el BORRADO remoto y la vuelta del listado (B.138) |
| **La extracción de prosa no tiene un solo test** | `pdf`, `docx`, `txt`. La batería cubre el TROCEADO, no la extracción |
| **B.200 — la línea que decide mal, y hoy no la pisa nadie** | `plan-de-reindexado.ts:90` comprueba `via_no_construida` **antes** que la viabilidad de `retrocear`. **MEDIDO, no sospechado**: 36 documentos recibieron un 501 por una reparación que habría funcionado, y por eso el lote alcanzaba a 2. ⚠️ Que alcanzara a dos **es un hecho sobre esa línea, no sobre el corpus**. ⚠️ **Y HOY EL HUECO ESTÁ VACÍO, lo que lo hace MÁS peligroso y no menos**: el sync reparó a esos 28, así que nadie volverá a pisar esa rama hasta que llegue un documento sin segmentos — y para entonces la razón se habrá olvidado. **Alcance exacto**: afecta a documentos SIN segmentos y con original recuperable. Un documento CON segmentos nunca llega ahí — `estado-de-reparacion.ts:125` devuelve `reparable_automaticamente` sin anomalía y el plan va a `retrocear`; `new 9.txt` y RRHH-06 lo demuestran reparándose con el botón. **No se toca hoy**: el orden puede ser deliberado (preferir la reparación completa a la disponible es B.195, que se cerró decidiendo lo contrario) |
| **B.199 CERRADO — con su límite declarado** | `settings/corpus` (`df46b8bb`, `aa3f6d90`): censo, botón de uno, botón de todo lo reparable con el bucle y el contador entre rondas. **Verificado en producción el 09/09**: carga, se lee como «no hay nada que hacer», los dos avisos se distinguen y la lista de anomalías no aparece con todo a cero. ⚠️ **LOS BOTONES NO SE HAN PODIDO EJERCER**: el corpus está a 0 reparables, así que no hay nada que pulsar. **La primera prueba real será el próximo cambio de `EXTRACTOR_VERSION`.** No se fabricó un corpus reparable subiendo el catálogo para poder probarlos — sería inventar la avería para enseñar el arreglo. Lo que SÍ está probado es el bucle (11 casos, 4 mutaciones), que es donde vivía el fallo silencioso |
| **El presupuesto de tiempo del lote es una estimación** | 180 s de los 300, con `parada: 'tiempo'` de contador |
| **B.204 — SIN CLASIFICAR · tres endpoints se fían de la ruta que les manda el cliente** | ver 5.1 |
| **B.205 — SIN CLASIFICAR · lo que se cobra y no se devuelve** | ver 5.2 |

## ⚠️ 5.1 · B.204 — la ruta la elige el cliente y nadie comprueba de quién es

`/api/extract-text` coge `storagePath` del cuerpo y lo descarga con el cliente de
servicio (`app/api/extract-text/route.ts:20-31`). Autentica —`getAuthenticatedUserHybrid`,
línea 14— y **no llama a `resolveOrg` ni compara la ruta con nadie**. Su hermano
de la bandeja sí: `documents/[id]/text/route.ts:35` filtra por `.eq('org_id', org.orgId)`.

**Y NO ES UNO, SON TRES.** La misma forma —ruta del cliente, descarga con
servicio, ninguna comprobación de pertenencia— está en:

| endpoint | línea de la descarga | qué devuelve o hace con el fichero ajeno |
|---|---|---|
| `/api/extract-text` | `:28` | **el texto plano, tal cual** — es la primitiva de lectura limpia |
| `/api/ingest` | `:181` | lo **indexa en el corpus de quien llama**: lectura CON persistencia |
| `/api/analyze-v2` | `:292`, `:314` | lo analiza y devuelve hallazgos que **citan el contenido** |

⚠️ El peor de los tres no es el que señalamos primero: `extract-text` devuelve el
texto y se acaba; **`ingest` se lo queda**.

**QUÉ LE HACE FALTA A UN ATACANTE.** La ruta entera y exacta, porque no hay
listado ni comodín: `${userId}/${Date.now()}-${file.name}` (`hooks/chat/useDocuments.ts:96`).
Son tres piezas y la primera es la que manda: **un UUID de Supabase Auth, que no
se adivina** (122 bits). El `Date.now()` en milisegundos tampoco ayuda —86,4
millones por día— y el nombre del fichero habría que saberlo. **No es
fuerza bruta: es «conocer la ruta».**

**QUIÉN PUEDE CONOCERLA.** Comprobado endpoint por endpoint: **ningún endpoint
devuelve `storage_path` a un cliente** —ni `analysis-jobs/[id]`, que además
verifica la organización (`route.ts:55-57`)—. Y de los `user_id`: `team/members:50`
y `usage/history:90` los devuelven, **pero solo los de la propia organización**.
O sea: **de fuera no hay por dónde empezar**; de dentro, un miembro cualquiera
puede leer el fichero temporal de un compañero de su propia organización — que
es a donde ese documento iba de todas formas. **El caso caro es el ex-compañero:
un `user_id` conocido no caduca cuando alguien se va de la organización.**

**LA VENTANA, y es la mitad que no esperaba.** El fichero se borra al indexar
(`ingest:401`), al cancelar (`useDocuments.ts:199`) y al cerrar el modal
(`:371`). **No se borra si el usuario cierra la pestaña**, y no hay barrido
periódico ninguno: el único `list`+`remove` del bucket está en `purge-org.ts:90`,
que corre al borrar la cuenta. **Los temporales abandonados se quedan para
siempre**, así que la ventana no es «los minutos de la subida».

**NO DETERMINADO, y no lo doy por bueno en ninguna dirección:** las políticas RLS
del bucket `documents` **no están en el repositorio** —`supabase-setup.sql` no
menciona storage—, así que si un cliente con la clave anónima puede o no
descargar la carpeta de otro **por su cuenta, sin pasar por nuestra API**, es una
consulta al panel de Supabase que no he hecho. Nuestros tres endpoints usan el
cliente de servicio y se saltan esas políticas de todos modos.

**Consumidores de `extract-text`: uno solo**, `hooks/chat/useDocuments.ts:210` —
la apertura del modal de Mejora desde el chat (A5). Nada más lo llama.

**No se arregla en esta ficha.** La forma del arreglo se ve —comparar el primer
segmento de la ruta con el que llama, o mejor, dejar de aceptar rutas— pero es
una pieza con su propia decisión, y **son tres endpoints, no uno**.

## ⚠️ 5.2 · B.205 — lo que se cobra y no se devuelve

Los 30 créditos del exhaustivo se cobran en `analyze-v2/route.ts:232`, **antes**
de descargar el fichero, extraer el texto, rescatar la estructura y encolar el
job. **Ninguna salida de error posterior llama a `refundCredits`:**

| salida | línea | reembolso |
|---|---|---|
| semáforo de concurrencia ocupado → 409 | `:258` | **no** |
| la descarga o la extracción fallan → 400 | `:328` | **no** |
| texto de menos de 50 caracteres → 400 | `:336` | **no** |
| el `INSERT` del job falla → 500 | `:497` | **no** |
| excepción → 500 | `:800` | **no** — solo `logUsage` con `creditsConsumed` |

El único `refundCredits` de la ruta (`:563`) vive en la rama **síncrona**, y el
exhaustivo ya ha retornado en `:515`. **Nunca lo alcanza.**

⚠️ **Y EL WORKER TAMPOCO, cuando el job FALLA.** Devuelve en tres casos
—incompleto `worker/src/index.ts:245`, reanálisis con pocos hallazgos `:253`,
precio variable `:315`— y su `catch` (`:267-278`) escribe `status: 'failed'` y
**no toca créditos**. Es el gotcha que `CLAUDE.md` ya avisaba, aquí con su línea.

⚠️ **EL CASO DE LOS 60.** Desde el chat, pedir exhaustivo en el `AnalysisModal`
(`useDocuments.ts:253`) y después «Reanalizar corpus» dentro del modal de Mejora
son **dos exhaustivos del mismo texto: 30 + 30**. El segundo lleva
`excludeFingerprints` y el primero no, así que el reembolso de reanálisis del
worker (`:253`) solo puede aplicar al segundo.

**Vale igual por las dos puertas**, chat y bandeja: no es una diferencia entre
A5 y A6.

**Hoy no está declarado en ninguna parte, y es dinero del cliente.** No se
arregla aquí: decidir entre reembolsar en cada salida, cobrar más tarde o
declararlo en la interfaz es una decisión de producto.

## ⚠️ 5.3 · B.206 — el centinela que se propuso, se dio por hecho y nadie construyó (09/09/2026)

⚠️ **ESTA FICHA REGISTRA QUE LA PIEZA FALTA. Que se CITARA como existente es otro
hecho y tiene otra casa** — la sección «LO QUE FABLE DA POR EXISTENTE» de
`claude/consultas-fable/INDICE.md`, donde es el séptimo caso. Dos hechos, dos
casas: uno es una deuda técnica, el otro es un fallo de método, y fundirlos
perdería el que menos duele hoy y más va a doler.

**QUÉ PROPUSO F-103, literal** (`claude/consultas-fable/F-103.md:194`):

> «De ahí la guarda que convierte el principio en cinturón: si `document_chunks`
> registra chunks tabulares para ese documento […] y el diff declara cero tablas
> vistas, el análisis no continúa en silencio: contador
> `diff.ceguera_estructural` (centinela, esperado cero — el sexto de la familia)
> y el análisis se marca incompleto, visible. El fallo de hoy habría sonado en el
> primer reanálisis, no en la remedición del tercer frente.»

**QUÉ SE IMPLANTÓ EN SU LUGAR.** La pieza 2 del plan: `lib/analysis/diff-vision.ts`
y sus **siete** claves `diff.vision.*` en el catálogo
(`lib/analysis/counters.ts:112-118`) — `pares_con_vision`, `pares_ciegos`,
`ciegos_por_el_analizado`, `tablas_analizado`, `filas_analizado`,
`tablas_candidatos`, `filas_candidatos`. Es el **denominador**: dice qué vio cada
lado. **No es el centinela**: nadie compara esa visión contra lo que
`document_chunks` dice que el documento tiene, y nadie marca nada como
incompleto.

**COMPROBADO el 09/09/2026 · LA PROPIEDAD, NO EL CENSO**: `ceguera_estructural`
no existe en **ninguna línea ejecutable** del repositorio. No es clave del
catálogo de contadores —`counters.ts` no la contiene; sus siete claves son las
`diff.vision.*`— y sus únicas apariciones en `.ts` son comentarios que declaran
su inexistencia. Se comprueba con `git log -S'ceguera_estructural' --
lib/analysis/`, que devuelve un solo commit: el de ese comentario.

⚠️ **ESTA FICHA DECÍA «no aparece en un solo `.ts` del repositorio», y era FALSO
AL ESCRIBIRLO** — el comentario que lo comprobaba contiene la palabra, así que la
frase se falsaba a sí misma en el acto. Corregido el 10/09/2026, antes del push.
Y por eso el enunciado es de PROPIEDAD y no de CENSO: un recuento de apariciones
en prosa caduca cada vez que alguien escribe la palabra, y **un criterio sobre
`grep` que su propia escritura invalida no es una medición, es una etiqueta.**

**QUÉ CUBRIRÍA SI SE CONSTRUYERA, y es la mitad que hoy falta.** Los contadores
de visión dicen «el analizado trajo cero tablas»; **eso no es una alarma, es un
dato**, y hay un caso legítimo en que vale cero — un documento de prosa. El
centinela es lo que convierte el dato en alarma **cruzándolo con una segunda
fuente**: si `document_chunks` tiene filas tabulares para ese documento y el diff
declaró cero, las dos etapas se contradicen y eso no puede pasar en silencio.
Hoy esa contradicción **sólo se ve si alguien mira los contadores a mano**, que
es exactamente cómo B.175 tardó semanas.

**Y LO QUE NO CUBRIRÍA, para que nadie lo presupuestee de más**: el camino del
chat sin indexar no tiene `document_chunks` que consultar, así que ahí la segunda
fuente tendría que ser otra —los segmentos recién extraídos— y eso es diseño, no
transcripción de la propuesta.

**No se construye aquí.** Es pieza propia con su decisión, y `diff-vision.test.ts`
ya cubre por suite y a coste cero el caso concreto que preocupaba —la puerta
ciega— sin necesitar el centinela.

---

# 6 · EL CRITERIO DE SALIDA, PUNTO POR PUNTO

Lo que el plan dijo que tendría que ser cierto «abriendo un registro»:

| # | lo que hay que poder demostrar | hoy |
|---|---|---|
| 1 | El inventario existe y es público | ✅ |
| 2 | La puerta principal medida por sus dos entradas, misma cifra | ❌ |
| 3 | Cada camino que produce informe, con cifra + camino + **modo** | ❌ cero de ocho |
| 4 | Cuando el sistema no ve algo, lo dice | ❌ pieza 2 sin empezar |
| 5 | Los dos botones que cobran dicen lo que cuestan | ❌ B.180 |
| 6 | Hay lista escrita de lo no probado, y no está escondida | ✅ |
| 7 | La condición de escritorio, escrita | ✅ |

**Tres de siete.** Y los cuatro que faltan son precisamente los que convierten
«creemos que funciona» en «está medido».

---

# 7 · EL VEREDICTO

**No, todavía no se puede enseñar a un cliente. Y falta poco, pero no es
cosmético.**

**Qué bloquea lo contesta el §4 y no se repite aquí** — hasta el 09/09 este
párrafo llevaba su propia respuesta («son dos cosas: el modal cobra 30 créditos
por un análisis estructuralmente ciego y no dice lo que cuesta»), y las dos
mitades llevaban un día arregladas: B.177 en `2f6265c0` y B.180 en `a2b99c41`.
**Dos sitios contestando a la misma pregunta se separan, y el que nadie mira
miente primero.**

Lo que falta no es una lista de fallos: es **cobertura**. Es la distinción que el
propio §4 enuncia, y por eso el veredicto sigue siendo «todavía no» aunque no
bloquee nada.

**Lo que se puede enseñar hoy, sabiendo lo que se enseña:** subir un documento,
preguntarle al chat, y la bandeja. Con dos avisos que no se pueden omitir — que
**el modal se queda fuera de la demo** (ya está en cuarentena por F-103) y que
**de lo que se enseña, la mitad está medida y la otra mitad no**: A1 (chat,
rápido) y A3 (bandeja, rápido) tienen cifra con denominador desde el 07 y el
08/09 — **A2 y A4, los exhaustivos de esas mismas dos puertas, no**. Lo que se
vea correr en exhaustivo será una anécdota, no una medición.

⚠️ Hasta el 09/09 este párrafo decía «A1 y A3 no tienen cifra atribuible», que
era verdad cuando se escribió y dejó de serlo con las dos tandas — **en el mismo
documento que ya las contaba en el §1**.

⚠️ **Y la distinción que decide la pregunta**: enseñar es una cosa y **ponerlo
delante de un cliente es otra**. Para lo primero ya no falta arreglar nada: falta
decir en voz alta lo que se enseña y lo que no. Para lo
segundo faltan las piezas 2 y 3 de F-103 enteras — que son las que permiten decir
la frase de la sala, y hoy todavía no se puede decir entera: *«cada camino con su
cifra, su camino y su modo»* va por **tres de ocho** (A1, A3, A6). El 05/09 era
cero; decir hoy que sigue en cero es la misma clase de frase caducada que las de
arriba.

**La buena noticia, y es real:** de los cuatro días que se han ido en algo que no
estaba en el plan, ha salido la vía de reparación entera. Sin ella, el arreglo del
cortador habría partido el parque en dos mitades sin forma de saber cuáles eran.
**Eso no era un rodeo: era la condición para poder tocar el índice.**
