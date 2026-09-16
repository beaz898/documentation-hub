# Estado del MVP — 09/09/2026

*(Actualizado el 09/09 con las tandas A1, A3 y A6 y con B.177 y B.198
cerrados. Lo del 07/09 que sigue vigente se mantiene tal cual.)*

Para decidir si esto se puede enseñar. **Sin plan: solo el estado.**

<!-- CASAS EXTERNAS — fichas que este documento CITA y cuya casa vive fuera.
     No son una excepción al invariante: son dónde buscarlo. El chequeo de
     `lib/documentacion/invariantes-de-estado.ts` ABRE el fichero y comprueba que
     la casa está ahí y que lleva fecha. Una marca que apunte a un sitio sin casa
     es una violación propia, no un permiso; y si el fichero no se puede abrir,
     tampoco concede. Sin número de línea: el fichero basta, y una línea en prosa
     caduca al primer commit ajeno. -->
<!-- CASA-EXTERNA: B.198 → claude/Inventario_Caminos.md -->
<!-- CASA-EXTERNA: B.175 → claude/Inventario_Caminos.md -->
<!-- CASA-EXTERNA: B.178 → claude/Plan_F103_P3.md -->

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
| **3 · Una remedición por camino** | 🔄 **EMPEZADA** | **CUATRO de ocho caminos** (A1, A3, A6 y **A5, medido el 15/09/2026**) — y las tres REMEDIDAS el 09/09 sobre un corpus de un solo cortador, con `candidatos 1` y `pares_ciegos 0`. Quedan **A2, A4, A7 y A8**. ⚠️ **A5 se midió el 15/09 con las cuatro cifras desde la BASE** —`3 · 57 · 0 · 0`, denominador completo, `pares_ciegos 0`— y **A6 se remidió el mismo día dando lo mismo**, lo que además contesta la pregunta que abrió el borrado del corpus: el reconstruido produce lo que producía el original. De los cuatro que faltan, **A7 y A8 son los de estilo y no se han medido nunca**. A1 medida el 07/09 con denominador (1·60 vs 1·60, 0 ciegos, 16/19/25/25) y con el modo declarado. Las dos entradas viejas (15/15/2 y 2/2/0) siguen sin poderse asignar a una fila hasta B.178 |

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
| **El modo Mejora — la cuarentena baja a UN motivo (15/09/2026)** | ✅ **(1) «Reanalizar todo» CERRADO: los DOS caminos medidos.** A6 desde la bandeja el 09/09 y **remedido el 15/09**; **A5 desde el chat, medido el 15/09** — las cuatro cifras **desde la base**, `3 · 57 · 0 · 0` con denominador (`filas_analizado 60`, `filas_candidatos 60`, `pares_con_vision 1`, `pares_ciegos 0`, `tablas 1/1`) y `documentos_implicados` confirmando el par. **Rápido y exhaustivo coinciden**, así que la cifra no depende del modo. Lo que compró: **el arreglo de B.204 no cambió el resultado del análisis**. ⚠️ **(2) «Reanalizar estilo» SIGUE SIN NINGUNA MEDICIÓN**: ni A7 (chat) ni A8 (bandeja) se han medido nunca, y ésa es toda la cuarentena que queda. ⚠️ **Y la cuarentena sigue siendo DOCUMENTAL**: no existe ningún aviso en el producto — `cuarentena`, `beta` y `experimental` no aparecen en `app/`, `components/`, `lib/` ni `messages/`. Lo único que el modal pinta es `stageFailureCount` y `noGuardado`. **Esta fila se reescribió al medir A5, como estaba escrito que había que hacer; se vuelve a reescribir —no a borrar— cuando A7 y A8 se midan** |
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
| **`sufijoDeTotal` volvió a tener consumidor, y la pregunta que quedó abierta se contestó sola** | El 10/09 el precio salió de las etiquetas de la bandeja y la función se quedó sin una sola llamada de producción. Se declaró aquí que jubilarla era decisión aparte, y **lo que había que mirar era si el precio volvería a pintarse desde un total ya calculado**. Volvió al día siguiente: el 11/09 el paso de confirmación del exhaustivo la usa otra vez (`ReviewSelectionBar`). ⚠️ **Queda escrito porque la lección vale más que el caso: se estuvo a un commit de jubilar una función que hacía falta veinticuatro horas después.** Retirar algo el día que pierde su último consumidor es retirarlo en el peor momento — el de menos información |

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

## ⚠️ 5.4 · B.207 — una ficha con casa en DOS documentos, y el chequeo solo mira uno (10/09/2026)

⚠️ **EL TÍTULO DE ESTA FICHA NO NOMBRA A LA FICHA AFECTADA, Y ES A PROPÓSITO.**
Nombrarla aquí le daría casa en este documento —un título que la nombra ES una
casa— y la habría resuelto por accidente, que es justo lo que el encargo pedía no
hacer. La afectada es **B.175**, y en esta ficha se la cita, no se la declara.

**QUÉ SE MIDIÓ Y CÓMO.** Al estrenar la casa externa (`I1`, 10/09/2026) se pasó
`invariantesDelDocumentoDeEstado` sobre los dos ficheros que las marcas nombran,
filtrando por las tres fichas mudadas. B.175 aparece declarada **dos veces, en dos
documentos distintos**:

| dónde | qué forma tiene | ¿lleva fecha? |
|---|---|---|
| `claude/Inventario_Caminos.md:347` | título: «CORRECCIÓN A … — SE CERRÓ CON LA MITAD MEDIDA (08/09/2026)» | sí |
| `claude/Plan_F103_P3.md:54` | fila de tabla cuya PRIMERA celda la nombra | no |

**POR QUÉ EL CHEQUEO NO LO CANTA, y no es un fallo del chequeo sino su límite
declarado**: la marca de este documento apunta a `Inventario_Caminos.md`, el
chequeo abre ese fichero, encuentra una casa y para. El invariante que se
implementó es **«una casa en este documento o en el fichero que su marca
nombra»**, no «una casa en el mundo» — y está escrito así en la cabecera de
`lib/documentacion/invariantes-de-estado.ts`, porque enumerar todos los `.md` del
repositorio convertiría el archivo intocable de consultas en dependencia de la
batería, con violaciones que nadie tiene permiso para corregir.

**NO SE RESUELVE AQUÍ.** Cuál de las dos es la casa buena es una decisión sobre
dónde vive ese hecho, no un arreglo mecánico: una es una corrección fechada y la
otra una fila de un plan. Quien la tome retira la otra en el mismo commit — nunca
se añade la nueva sin quitar la vieja, que es la única forma de que no queden dos.

## ⚠️ 5.5 · B.208 — una ficha citada cuya casa no aparece por ninguna parte (10/09/2026)

⚠️ **Mismo cuidado que la anterior: el título no nombra a la afectada.** Es
**B.138**, y aquí se la cita.

**QUÉ SE BUSCÓ, DÓNDE, Y CON QUÉ FORMA — para que el próximo no repita la
búsqueda**, que es la mitad que suele faltar:

| qué se buscó | expresión | dónde | resultado |
|---|---|---|---|
| casa por título | `^#{1,6}.*B\.138` | `claude/` y `CLAUDE.md` | **cero** |
| casa por fila-índice | `^\| *\**B\.138` | `claude/` y `CLAUDE.md` | **cero** |

Su única aparición en este documento (`:446`) está en una celda que **no es la
primera**, o sea una referencia: apunta y no declara. En `CLAUDE.md` sale dos
veces, las dos en prosa dentro de reglas de trabajo.

**LAS DOS LECTURAS POSIBLES, y no elijo entre ellas sin más evidencia**: o es una
ficha **sin casa de verdad** —se la cita y nunca se declaró—, o su casa es un
**párrafo de prosa**, que el criterio no acepta como casa y con razón: si un
párrafo declarara, cualquier mención sería una declaración y I1 no distinguiría
nada.

**QUÉ NO HAY QUE HACER, y por eso se declara en vez de arreglarse**: darle casa
aquí. Inventarle una sección en el documento de estado sería declarar en este
documento un hecho que casi seguro pertenece a otro, que es el fallo de I1 con el
signo cambiado. **Es la única `ficha_sin_casa` que queda**, y el techo de 29 la
lleva dentro: el día que se le encuentre o se le dé casa, el techo baja a 28.

## ⚠️ 5.6 · B.203 — el botón de lote apaga por dos motivos y solo uno tiene guardián en el servidor (10/09/2026)

*(El número es más antiguo que el de sus vecinas de arriba porque el hallazgo se
decidió al construir el botón y se redacta hoy. La sección va la última porque las
secciones van por orden de escritura, no de numeración.)*

El botón de añadir varios al corpus se apaga por dos motivos, y `seleccionIndexable`
los cuenta los dos. **Solo uno de los dos espeja algo que el servidor haga cumplir.**

| motivo del cliente | ¿lo hace cumplir el servidor? | dónde |
|---|---|---|
| «tiene una versión pendiente» | **Sí** — 409 con `errorType: 'staged_pending_analysis'` | `mark-analyzed/route.ts:92-98` |
| «no se ha analizado» | **NO. Nada.** | no existe la comprobación |

**VERIFICADO EL 10/09/2026, abriendo el endpoint entero y no solo la parte que
interesaba.** Lo que `mark-analyzed` comprueba antes de escribir es: sesión (401),
organización (403), documento de esa organización (404), que tenga vectores
—`chunk_count > 0`, 422— y la versión pendiente (409). **Ninguna mira si el
documento pasó alguna vez por un análisis.** Lo único que hoy impide meterlo al
corpus sin analizar es un booleano del cliente.

⚠️ **Y EL 409 NO ES ABSOLUTO, que es la precisión que faltaba**: solo salta si
`approveStaged !== true`. El servidor tiene una salida deliberada —la aprobación
humana de F-11— así que el espejo es «hay veto y se puede levantar a propósito»,
no «hay muro». Comprobado además que **el bucle del lote llama sin cuerpo**
(`useIndexarSeleccion.ts:82-84`), luego nunca levanta ese veto por accidente.

**ES UNA REGLA DE PRODUCTO QUE VIVE SOLO EN EL CLIENTE.** No se arregla aquí:
poner el veto en `mark-analyzed` es otra pieza con su propia decisión, y la
decisión tiene dos preguntas que no se contestan de paso —**qué código devuelve**,
y **si el bucle del lote lo distingue del 409**—. Hoy no lo distinguiría: el bucle
mete cualquier respuesta no-`ok` en la misma bolsa de errores y solo conserva el
mensaje (`useIndexarSeleccion.ts:85-95`). Un veto nuevo que devolviera 409 sería
indistinguible del de la versión pendiente para todo lo que no sea leer la frase.

**ALCANCE, Y HA CAMBIADO HOY.** Cuando esto se decidió no había abuso conocido y
**el camino no se había ejercido**. El 10/09/2026 el director ejerció el botón en
pantalla, en cuatro casos, y los cuatro se comportaron como se diseñaron. Así que
el enunciado de hoy es: **el camino ya está ejercido y sigue sin guardián en el
servidor.** No es que nadie lo haya pisado; es que quien lo pise con un cliente
manipulado no encuentra a nadie.

## ⚠️ 5.7 · B.209 — el escaneo de huérfanos no enumera: muestrea, y su cero no lo dice (11/09/2026)

**EL MECANISMO, línea a línea.** El botón «1. Analizar (sin borrar)» llama a
`GET /api/admin/cleanup-orphans`, que hace **una sola consulta de SIMILITUD con
un vector inventado**: `cleanup-orphans/route.ts:36-38` construye un vector de
1024 ceros con un 1 en la primera posición y llama a
`queryVectors(org.orgId, { vector: dummy, topK: 10000 })`, que por debajo es
`ns.query(...)` (`lib/pinecone/vectors.ts:133`). **No hay paginación y no hay
segunda vuelta.**

**QUÉ DEVUELVE ESO REALMENTE**: los **10 000 vectores más cercanos a un punto
arbitrario** del espacio. Es una muestra, no un inventario. Por encima de 10 000
vectores en una organización, lo que no entre en esa vecindad no se mira — y qué
queda fuera no lo decide nada comprensible, lo decide la geometría del índice.

**QUÉ SIGNIFICA HOY SU CERO**: «no hay huérfanos **entre los que miré**». Que es
otra cosa que «no hay huérfanos», y es exactamente la clase de cero que esta casa
tiene prohibido leer como confirmación: un cero vale si el sistema puede
demostrar que buscó, y aquí no puede.

**POR QUÉ LA PANTALLA NO PERMITE DISTINGUIR LOS DOS SIGNIFICADOS**, que es la
mitad que lo hace peligroso y no sólo incompleto:

- El mensaje dice literalmente *«Se encontraron N vectores huérfanos **en tu
  organización**»* (`cleanup-orphans/route.ts:64`). Dice «en tu organización», no
  «entre los 10 000 que miré».
- Y el informe trae un campo llamado **`totalVectorsInPinecone`** que no es el
  total: es `matches.length` (`:39`), o sea **el recuento de lo que devolvió la
  consulta, tapado a 10 000**. Un parque de 40 000 vectores se presenta como uno
  de 10 000, y el nombre del campo afirma lo contrario.
- No hay aviso al alcanzar el tope, ni contador, ni denominador.

**⚠️ LA PREGUNTA QUE DECIDE LA FORMA DEL ARREGLO, CONTESTADA CONTRA EL SDK
INSTALADO Y NO DE MEMORIA: SÍ SE PUEDE ENUMERAR.** El paquete
`@pinecone-database/pinecone` **4.1.0** expone `listPaginated`
(`dist/data/vectors/list.d.ts`, publicado en el índice en
`dist/data/index.d.ts:240`), con `{ prefix, limit, paginationToken }` y por
namespace. Su propia documentación dice que **sin `prefix` lista TODOS los ids
del namespace**, y se pagina con `results.pagination.next`.

Luego el arreglo **no es poner el denominador: es enumerar de verdad.** El
denominador —«miré 10 000 de N»— queda como plan B, no como destino.

Y hay una variante que conviene tener delante: nuestros ids llevan el documento
por delante (`buildVectorId`, `pinecone/vectors.ts:314`), así que también se
puede enumerar **por prefijo y documento a documento**, que reparte el trabajo en
trozos del tamaño de un documento en vez de uno del tamaño del corpus.

**LO ÚNICO QUE FALTA CONFIRMAR CUANDO SE CONSTRUYA**, y se dice ahora para que no
se descubra a mitad: `listPaginated` está documentado para índices *serverless*, y
**de qué tipo es nuestro índice no está en el repositorio** — es una consulta al
panel de Pinecone, de la misma familia que las políticas del bucket.

**No se arregla aquí.**

## ⚠️ 5.8 · B.210 — el único botón que borra documentos es el único cuyo endpoint no mira el rol (11/09/2026)

En la página de administración, los cinco endpoints propios comprueban lo mismo
—sesión, organización y **`org.role !== 'admin'`**—: `cleanup-orphans/route.ts:27`
y `:104`, `config/route.ts:31`, `duplicates/route.ts:36` y `tombstones/route.ts:18`.

**El botón de «Eliminar duplicados» no llama a ninguno de ellos.** Llama a
`DELETE /api/documents?id=`, que comprueba sesión (`documents/route.ts:45`) y
organización (`:50`) **y no comprueba el rol**. Es decir: en una pantalla
íntegramente sólo-admin, **la única acción que borra documentos enteros es la
única que no exige ser admin**.

⚠️ **Y NO ES UN OLVIDO, QUE ES LO QUE HAY QUE ENTENDER ANTES DE DECIDIR NADA.**
Ese endpoint es el mismo que usa el chat para borrar un documento de la lista
(`hooks/chat/useDocuments.ts:433`), que es un gesto de usuario corriente. Así que
hay una **política de miembro** —cualquiera de la organización gestiona el
corpus— conviviendo con una **pantalla de admin**, y ninguna de las dos está
escrita en ninguna parte. Lo que falta no es una comprobación: es la decisión.

**EL ALCANCE, DICHO ENTERO**: no es un agujero entre organizaciones. `deleteDocument`
filtra por `org_id` al leer (`lib/delete-document.ts:105`) y al borrar (`:207`),
y deja lápida. Lo que significa es que **un miembro cualquiera puede borrar
documentos de SU organización**, hoy, por la interfaz normal — y eso no está
escrito en ningún sitio.

**No se arregla aquí**: si el borrado debe ser sólo-admin o no es una decisión de
producto del director, no una omisión que se tapa de paso. Lo que sí se cierra
hoy es el desconocimiento.

## ⚠️ 5.9 · B.211 — la página de administración hace cinco cosas bajo un título que nombra una (11/09/2026)

Mapeada entera el 11/09/2026. `app/api/admin/cleanup/page.tsx` tiene **441
líneas** —por encima del límite de 400 de `CLAUDE.md`— y contiene **tres familias
distintas** que se fueron colgando encima de una herramienta puntual:

| familia | qué hay | vida |
|---|---|---|
| **Operación permanente** | duplicados exactos · exclusiones (la papelera de sincronización) | se queda |
| **Diagnóstico de instalación** | estado del despliegue: secreto en runtime y emisión | se queda, pero es otra cosa: se usa al tocar infraestructura, no documentos |
| **Restos de reparación puntual** | «Etiquetar vectores con su estado» (un *backfill* de metadata) · y la limpieza de huérfanos, hoy red de seguridad y no tarea | caduca, y **nada dice si el parque ya está etiquetado** |

**LO QUE SE ARREGLA HOY Y ES GRATIS: EL TÍTULO.** Decía «Limpieza de vectores
huérfanos» encima de un botón que borra documentos enteros y de otro que reescribe
metadata de todo el parque. **Una etiqueta que miente por omisión se arregla
cambiando la etiqueta, no partiendo nada.**

**LO QUE QUEDA ANOTADO Y NO SE TOCA**: la página vive en
`app/api/admin/cleanup/page.tsx`, o sea **una página bajo la ruta de la API**. Eso
es lo que la deja fuera de cualquier `layout.tsx` autenticado —no existe ninguno
en `app/api/`— y por eso **la ve cualquiera, incluso sin sesión**. Lo que no
consigue quien no es admin es que ningún botón haga nada: todos devuelven 401/403
y la página lo dice. La ubicación se corrige cuando se parta, no antes.

**POR QUÉ NO SE PARTE HOY**: el commit 4 de B.204 sigue abierto y toca la misma
zona. Dos frentes en la misma pantalla es cómo se pierde uno de los dos.

## ⚠️ 5.10 · B.212 — la bandeja empareja análisis por NOMBRE, y once veces enseña el de otro fichero (11/09/2026)

⚠️ **VA EL PRIMERO DE LOS HALLAZGOS DE HOY, y no por ser el más caro: no es
trabajo perdido, es INFORMACIÓN EQUIVOCADA PRESENTADA COMO BUENA.** Un análisis
que no se puede recuperar cuesta créditos; éste hace que el usuario decida sobre
un documento mirando el informe de otro.

**EL MECANISMO, línea a línea.** La bandeja trae los análisis con
`.in('document_name', names)` (`review-list/route.ts:127-133`), donde `names` son
los nombres de los documentos de la organización, y se queda con **el más
reciente por NOMBRE** (`latestByName`, `:141-147`).

⚠️ **Y NO ES QUE NO COMPARE EL DOCUMENTO: ES QUE NI SIQUIERA LO PIDE.**
`ANALYSIS_SUMMARY_COLUMNS` (`:31-34`) no incluye `document_id`. El endpoint **no
tiene con qué distinguirlos**, así que no es un `if` que falta: es una columna que
nunca se trae.

**LA POBLACIÓN ESTÁ MEDIDA, no deducida.** Ejecutado contra producción el
11/09/2026: **once filas** con un análisis de fichero suelto más reciente que el
del documento indexado del mismo nombre, sobre **tres documentos** —
`OPE-02_agenda-y-gestion-de-citas.xlsx` (cinco), `OPE-13_cobertura-por-clinica.xlsx`
(cuatro) y `OPE-10_tarifario-tratamientos-2026.xlsx` (dos)—, la más reciente del
**10/09/2026**.

**QUÉ SE ENSEÑA EXACTAMENTE** cuando pasa: `buildCountsSummary`
(`ReviewDocumentRow.tsx:24-36`) pinta los recuentos —contradicciones, duplicados,
solapamientos, menores, estilo—, más la recomendación y la fecha del análisis. Los
del fichero suelto. **Nada en la pantalla lo distingue.**

⚠️ **LO QUE ACOTA EL DAÑO Y HAY QUE MEDIR ANTES DE DIMENSIONARLO**: la bandeja
**solo lista documentos que NO están `analizado`, o que tienen versión staged**
(`review-list/route.ts:87-90`). Si esos tres están en `analizado` y sin staged,
**hoy no aparecen ahí y nadie los está viendo mal**. Es la diferencia entre un
fallo latente y uno a la vista, y no la tengo:

```sql
select d.name, d.analysis_status,
       exists (select 1 from document_staged s where s.document_id = d.id) as tiene_staged
from documents d
where d.name in ('OPE-02_agenda-y-gestion-de-citas.xlsx',
                 'OPE-13_cobertura-por-clinica.xlsx',
                 'OPE-10_tarifario-tratamientos-2026.xlsx');
```

**EL ARREGLO NATURAL NO ROMPE EL CASO LEGÍTIMO, y está comprobado**: emparejar por
`document_id` cuando lo hay funciona porque **la indexación ADOPTA** el análisis
del fichero y le escribe su `document_id` (`ingest/route.ts:406-412`, con
`.is('document_id', null)` para que sea idempotente). Las once filas tienen
`document_id` nulo **precisamente porque su documento nunca se indexó**.

## ✅ ARREGLADO — `1513e9cd`, 12/09/2026. Y el criterio llevaba nueve meses escrito

⚠️ **B.212 ES LA OTRA MITAD DE B.112, Y ESO ES LO QUE HAY QUE RECORDAR.**
`lib/documents/analisis-del-documento.ts` existe desde B.112 y su **primera
línea** dice «la bandeja empareja los análisis de subida POR NOMBRE». Aquel commit
escribió el criterio, lo aplicó al **BORRADO**, y dejó la bandeja como estaba. Su
único consumidor era `delete-document.ts`.

**La pieza existía, estaba probada, y la pantalla que la necesitaba nunca le
preguntó.** Es el patrón de la casa por el lado que menos se ve: no es dar por
inexistente algo que está —eso ya está en la lista— es **tenerlo y no cablearlo**.
Nueve meses de una pantalla enseñando datos ajenos con el arreglo en el
repositorio.

**QUÉ ENTRÓ**: `review-list` cambia `.in('document_name', names)` por
`.in('document_id', documentIds)` y le **pregunta** el criterio al módulo. Diez
casos para los cuatro caminos de entrada, y `bloquesDeLaFila` extraída para que
las dos fuentes —lo propio por id, lo del staged por su puntero— se puedan matar
por separado: las dos mutaciones matan **conjuntos disjuntos** (tres casos una,
cuatro la otra).

⚠️ **LO QUE NO ARREGLA, Y NO SE PUEDE LEER COMO RESUELTO: que el análisis sea del
documento no lo hace RECIENTE.** Un documento analizado el día 1 que vuelve a la
bandeja el día 79 trae su propio informe, hecho contra un corpus que ya no existe,
y la bandeja lo enseña sin decir de cuándo es. **Es el problema que B.212 estaba
tapando**, y sigue vivo con su nombre: el caso del Drive sobrescrito en el sitio
tiene su propio test, declarado como límite y no como virtud.

**Y si algún día hace falta distinguirlo, los datos YA ESTÁN GUARDADOS** —queda
anotado en la cabecera del módulo, donde lo verá quien lo intente—:
`analysis_results.created_at` da la fecha, **`involved_documents` guarda contra
qué documentos se comparó** (la foto del corpus de ese momento, no un recuento) y
`documents.content_hash` dice si el documento cambió desde entonces. **No hace
falta columna nueva ni migración.**

**LA CONSECUENCIA QUE SE ACEPTA ENTERA**, por decisión del director del
12/09/2026: un documento sin análisis propio llega sin bloque, la fila se cierra y
el botón de añadir al corpus se apaga con su motivo. **No es una regresión: es una
funcionalidad que se paga**, y sin análisis no hay nada que revisar. La fila ya lo
explica —insignia ámbar «Sin analizar», `ReviewDocumentRow:7,13,199`— así que no
hizo falta tocarla.

⚠️ **Y LAS ONCE FILAS QUEDAN INERTES, no borradas**: nadie las lee ya. La bandeja
las excluye por no tener `document_id`, y el único otro lector de
`analysis_results` es la purga de la organización. Se quedan como historia de esos
ficheros. Lo que sí sigue siendo verdad es que **son inalcanzables** —eso es B.205
y su familia, no esto.

## 5.14 · B.112 — el criterio que se escribió para el borrado y no se llevó a la pantalla (03/09/2026)

*(Ficha escrita el 12/09/2026, con la fecha del hallazgo original. Existía citada
y sin declarar en ninguna parte: es exactamente la clase que describe la 5.5, y se
le da casa al tropezar con ella.)*

**QUÉ FUE**: al borrar un documento, sus análisis no se borraban, y la pantalla los
emparejaba por nombre. Borrar un documento y subir otro con el mismo nombre hacía
que el nuevo **heredara el análisis del viejo**. Se arregló escribiendo el criterio
de identidad —por `document_id` y `org_id`, nunca por nombre— en
`lib/documents/analisis-del-documento.ts` (`6904aea1`, 03/09/2026).

⚠️ **Y AQUÍ ESTÁ POR QUÉ MERECE FICHA HOY, nueve días después: se arregló el
BORRADO y no la PANTALLA.** El criterio quedó escrito, probado, y con un solo
consumidor. La primera línea de ese fichero dice que la bandeja empareja por
nombre — y la bandeja siguió haciéndolo hasta el 12/09/2026, cuando B.212 midió
once filas de datos ajenos en producción. **La pieza estaba; nadie la cableó.**

## ⚠️ 5.15 · B.216 — subir a Drive lo que ya tienes a mano no lo mueve: lo duplica (12/09/2026)

**QUÉ CREE EL USUARIO QUE HACE**: «pasar un manual a Drive», para que desde
entonces se sincronice.

**QUÉ HACE EL SISTEMA**: la indexación **exime a los documentos sincronizados de
la comprobación de nombres duplicados** —es deliberado y está en `CLAUDE.md`: un
manual y uno de Drive con el mismo nombre coexisten—, así que la sincronización
**inserta una fila NUEVA** con `source='google_drive'` (`drive/sync/route.ts:441`)
y el manual **se queda donde estaba**. El usuario acaba con **dos documentos
idénticos** y nadie le avisa.

**Y NO ES SOLO ORDEN**: los dos entran en el corpus, así que las búsquedas y los
análisis ven el contenido **dos veces**. Es lo que alimenta la herramienta de
duplicados exactos de la página de administración.

⚠️ **EL ÍNDICE ÚNICO NO LO IMPIDE, y merece decirse por qué**:
`documents_identity_unique` cubre `(org_id, source, provider_file_id)`
(`supabase-identity-unique.sql:19`), y **los manuales tienen `provider_file_id`
nulo** — en Postgres los nulos no colisionan en un índice único. Protege contra
duplicar el mismo fichero de Drive dos veces; no contra esto.

**Es un camino que un usuario va a intentar**, y hoy le deja el corpus contando
doble sin decírselo. **No se arregla aquí**: si lo correcto es avisar, fundir o
retirar el manual es una decisión de producto que no está tomada.

---

## ⚠️ 5.11 · B.213 — el cerrojo de subida lo consultan seis y no lo toma ninguno (11/09/2026)

**LA RAÍZ DE CASI TODOS LOS SOLAPES.** Seis endpoints preguntan por el cerrojo y
**ninguno lo adquiere**: `ingest:62`, `analyze-v2:75`, `drive/sync:42`,
`reindexar:64`, `reindexar-lote:79` y `delete-document:91`. Todos llaman a
`checkUploadLock`, que **sólo lee**.

**El único que lo escribe es `POST /api/org/upload-lock`**, y lo llama **el
cliente del chat** al subir (`chat/page.tsx:162`). Así que la exclusión mutua
existe **sólo frente a una subida del chat**; entre sí, esas seis operaciones no
se ven.

**LO QUE ESO PERMITE HOY**, con su veredicto:

| solape | ¿impedido? |
|---|---|
| dos sincronizaciones de Drive a la vez | **no** |
| subir mientras sincroniza | **no** |
| sincronizar mientras alguien sube | **sí** — el único sentido protegido |
| borrar un documento durante un análisis | **no** |
| reindexar durante un análisis | **no** |
| dos exhaustivos seguidos | se degrada limpio: el worker serializa por organización |

**LO QUE LA BASE SÍ PROTEGE, y por qué no llega a todo**: el índice único
`documents_identity_unique` sobre `(org_id, source, provider_file_id)`
(`supabase-identity-unique.sql:19`) impide que dos sincronizaciones dupliquen un
fichero de Drive — al segundo `insert` le revienta. ⚠️ **Pero los documentos
manuales tienen `provider_file_id` nulo, y en Postgres los nulos no colisionan en
un índice único**: a ésos no los cubre. Por eso existe la herramienta de
duplicados exactos.

**EL SOLAPE QUE FALTABA POR TRAZAR, TRAZADO (11/09/2026)**: reindexar mientras
corre un análisis. El análisis lee la generación activa y luego sus trozos de
Supabase (`analyze-v2:383-388`); la conmutación promociona la generación nueva y
**borra los trozos por debajo de ella** (`document-swap.ts:144`).
· **No corrompe**: si los trozos ya no están, `fetchedChunks.length > 0` falla y
  el análisis cae a texto plano, con `fallback=true` en el registro (`:392`).
· **El exhaustivo es inmune**: sus trozos viajan DENTRO del job
  (`analyze-v2:520` → `worker:93`), así que una conmutación posterior no lo toca.
· **Lo que sí queda**: un informe que describe la generación vieja, guardado
  contra un documento que ya está en la nueva. Degradación silenciosa para el
  usuario, visible en el registro.

**No se arregla aquí**: cómo se hace la exclusión mutua de verdad es una pieza con
su propia decisión, y no está tomada.

## ⚠️ 5.12 · B.214 — tres umbrales desajustados, medidos, sin población (11/09/2026)

El cliente deja de preguntar a los **10 minutos** (`useJobPolling.ts:50` y
`useCrossDocAnalysis.ts:44`, los dos en 600 000 ms). El semáforo del exhaustivo
permite **20** (`analysis-lock.ts:23`) y el worker considera zombi a los **20**
(`worker/src/index.ts:35`). **El del cliente es la mitad que los otros dos**, así
que alguien esperando delante podría recibir un error por un análisis que fue
bien.

**MEDIDO CONTRA PRODUCCIÓN EL 11/09/2026: no tiene población.**

| exhaustivos terminados | media | máximo | pasaron de 10 min |
|---|---|---|---|
| **168** | **44 s** | **365 s** (6 min) | **CERO** |

El máximo real está a **menos de la mitad** del umbral que se rebasaría. **Se
declara y no se arregla**, y queda escrito con la medición para que se sepa que
**se midió y no que se olvidó**.

⚠️ **QUÉ LO VOLVERÍA A PONER SOBRE LA MESA**, porque un cero de hoy no es un cero
de siempre: documentos bastante mayores que los del corpus actual, o un corpus que
crezca lo suficiente como para que el exhaustivo compare contra mucho más. El
dato a vigilar es el máximo, no la media: hoy 365 s, y el umbral 600.

## ⚠️ 5.13 · B.215 — dos pérdidas por cierre de pestaña, descartadas por decisión (11/09/2026)

**DECISIÓN DEL DIRECTOR, 11/09/2026**: los dos casos siguientes se consideran
**mal uso** y **no se arreglan hoy**. Se escriben como decisión con fecha y no
como pendiente sin dueño, que es lo que permite releerla.

| caso | qué deja | cómo sale |
|---|---|---|
| **Cerrar la pestaña durante una subida** | el cerrojo echado para toda la organización | caduca solo a los **60 min**; lo desactiva el primero que pase |
| **Cerrar la pestaña con un análisis de un manual sin indexar** | el informe guardado y sin puerta; los créditos gastados | **no sale: se queda así** |

**EL ALCANCE QUE LA HACE ACEPTABLE HOY, y es lo que hay que releer**: hay **un
solo usuario**. El cerrojo no deja fuera a nadie más que a quien lo echó, y el
análisis perdido lo paga quien lo abandonó. Las dos cosas dejan de ser verdad a la
vez.

⚠️ **EL DISPARADOR DE REVISIÓN, que es lo que la distingue de una excusa**: **el
día que haya más de un usuario**, el cerrojo pasa a detener a gente que no hizo
nada —hasta una hora, y con un mensaje que nombra a alguien que ya no está— y el
análisis perdido pasa a poder pagarlo uno y perderlo otro. Ese día se relee esta
ficha con los datos delante, no se redescubre el problema.

## ⚠️ 5.16 · B.218 — el diálogo pregunta por el nombre de ENTRADA y el servidor choca con el de SALIDA (14/09/2026)

Al guardar desde el modal de Mejora, el cliente compone el nombre final
(`useIndexing.ts:53-60`):

```
finalName = replaceExisting ? fileName : `${fileName} (corregido ${today})`
```

Y el diálogo de reemplazo sólo aparece si hay un homónimo, preguntado así
(`useDocuments.ts:290`): `documents.find(d => d.name === fileName …)` — **el nombre
del fichero subido**.

**SON DOS NOMBRES DISTINTOS SIEMPRE.** El diálogo pregunta por
`CLI-05….txt`; el servidor comprueba la colisión contra
`CLI-05….txt (corregido 14/09/2026)` (`index-text:181-189`). **Un guardado anterior
creó el segundo y nunca el primero**, así que para el documento que de verdad va a
chocar **el diálogo no puede salir**. No es que el usuario no lo pulse: es que no
hay nada que pulsar.

⚠️ **Y EL DATO ESTABA DELANTE: no falla el dato, falla la pregunta.** `documents`
es la lista entera de la organización, así que el documento corregido **está en
ella**. Se busca por el nombre de entrada y se choca por el de salida.

**LA POBLACIÓN NO ES UN CASO RARO: ES EL SEGUNDO GUARDADO.** El sufijo lleva
**fecha sin hora** (`toLocaleDateString('es-ES')`), así que dos guardados el mismo
día producen **exactamente el mismo nombre**. Corregir, guardar, ver otra cosa y
volver a guardar es el uso normal del modal — y choca siempre, hasta el día
siguiente.

⚠️ **Y LO MÁS ÚTIL DE ESTA FICHA NO ES EL DIAGNÓSTICO: ES DÓNDE SE MIRÓ MAL.** El
propio servidor lleva escrito, en la línea de la comprobación
(`index-text:185`):

> «Shouldn't normally happen because frontend adds the "(corregido DD/MM/YYYY)"
> suffix, but just in case, we append a numeric counter.»

Se dio por **imposible** —y por eso el mensaje de al lado se escribió a la ligera—
justo el caso que hoy es el normal. Y el remate: el comentario promete un
contador numérico que **no existe**; lo que hay debajo es un 409.

**Distinción visible desde el otro origen**: abierto **desde la bandeja**, el modal
recibe siempre `existingDocWithSameName` (`review/page.tsx:532`), así que allí el
diálogo sale y Reemplazar funciona. El defecto es sólo del camino del chat.

## ⚠️ 5.17 · B.219 — el servidor propone salidas que la pantalla del cliente no tiene (14/09/2026)

**LA TERCERA DE LA MISMA ESPECIE EN CUATRO DÍAS, Y POR ESO SE ESCRIBE COMO PATRÓN
Y NO COMO CASO.** Lo que evita el cuarto es la forma, no los tres ejemplos:

| mensaje | lo que pasaba de verdad | qué tenía de falso |
|---|---|---|
| «Ruta no autorizada» | una autorización de subida **caducada** | decía que el fichero no era suyo |
| «No perteneces a ninguna organización» | **un timeout de Supabase** (`resolveOrg` devuelve `null` ante cualquier error, sin reintento ni caché) | afirmaba algo sobre la pertenencia |
| «Intenta de nuevo con otro nombre o usa la opción "Reemplazar"» | una colisión que el usuario no puede resolver desde ahí | **ofrece dos salidas que esa pantalla no tiene** |

**LA CAUSA ESTRUCTURAL, que es lo único que hay que recordar: el texto lo escribe
el SERVIDOR, y el servidor no sabe qué ofrece la pantalla del cliente.** Un
endpoint puede decir con autoridad **qué ha pasado**; en cuanto propone **qué
hacer**, está describiendo una interfaz que no ve — y la describe como era el día
que alguien escribió la cadena.

⚠️ **Y ÉSTE ES EL PEOR DE LOS TRES, porque además CULPA AL USUARIO**: «intenta con
otro nombre» le pide una acción concreta que no puede ejecutar. **No hay campo de
nombre en el modal** —comprobado, ni un `input` que lo edite—; el nombre lo compone
el cliente. Y «usa Reemplazar» nombra un diálogo que en ese caso no aparece nunca.

**LAS TRES SALIDAS QUE SÍ EXISTEN HOY, y el mensaje no nombra ninguna**:
1. Borrar desde el corpus el documento corregido anterior y volver a guardar.
2. Abrir ese documento corregido **desde la bandeja** y mejorarlo desde allí, donde
   el diálogo de reemplazo sí sale siempre.
3. Esperar a mañana: el nombre lleva la fecha y cambia solo. Absurdo, y es
   literalmente una salida.

**EL CASO DEL TIMEOUT QUEDA CONFIRMADO, no como sospecha**: el 403 de «No
perteneces a ninguna organización» apareció con un `Gateway Timeout` en el
registro y **no volvió a salir en el reintento del director** (14/09/2026). Era la
base sin contestar. `resolveOrg` no tiene reintento ni caché, así que el siguiente
intento con la base sana funciona — **no hace falta recargar**, y el mensaje no lo
dice porque cree estar hablando de otra cosa.

## ⚠️ 5.18 · B.220 — el cuarto endpoint con la forma de B.204, y lo dimos por cerrado diciendo que eran tres (14/09/2026)

`POST /api/index-text` —el guardado del modal de Mejora— **recibe
`originalStoragePath` del cliente**, lo **descarga con el cliente de servicio**
(`:205-207`) para conservar la estructura del original, y al terminar lo **BORRA**
(`:361-363`). No importa nada de `lib/subida/`, no pregunta por la pertenencia de
la ruta, y **nunca estuvo en la lista de los tres**.

⚠️ **ES LA MISMA FORMA Y EN UNA VARIANTE PEOR: aquéllos LEÍAN; éste además
BORRA.** Una ruta ajena aquí no devuelve contenido: destruye el fichero temporal
de otro.

⚠️ **Y LO QUE HAY QUE RECORDAR NO ES EL ENDPOINT: ES QUE EL RECUENTO ERA
INCOMPLETO.** La ficha de B.204 dice «Y NO ES UNO, SON TRES» y enumera tres. Eran
cuatro. **Cerramos un hallazgo de seguridad con un recuento que nadie volvió a
comprobar**, y el cuarto apareció por accidente, mirando otra cosa cinco días
después. La enumeración se hizo leyendo los endpoints que descargaban de Storage;
`index-text` no salió porque su parámetro se llama `originalStoragePath` y no
`storagePath`.

**Y es la segunda vez en esta misma pieza**: el commit 3 esperaba tres emisores en
el cliente y había **cinco**. Dos recuentos, los dos cortos, los dos hechos de
memoria sobre una lista que se creía completa.

## ✅ CERRADA EL 15/09/2026 — migrado, y el censo re-ejecutado a cero

`index-text` ya no acepta ruta: acepta la **referencia firmada**, y de ella salen
la ruta **y el nombre del original**. Ese nombre no era cosmético — con él se
decide `produceTablas`, o sea si este documento tiene filas y columnas que
proteger, y que esa decisión la tomara una cadena elegida por el cliente era la
misma familia que la ruta.

⚠️ **LA DECISIÓN QUE ESTA FICHA DEJÓ PENDIENTE —la `ref` vive dos horas y el
modal puede estar abierto toda una tarde— SE RESUELVE APARTÁNDOSE DE LOS OTROS
TRES, y queda escrito en el código por qué.** En `extract-text`, `ingest` y
`analyze-v2` el fichero ES el trabajo: sin él no hay nada que hacer y el 403 es
la respuesta entera. Aquí el fichero es **opcional** —sirve para recuperar la
estructura y para barrer el temporal— y el trabajo de verdad es guardar el texto
que el usuario tiene delante. Un 403 convertiría «tu autorización caducó» en «no
puedes guardar tu trabajo».

**Sin `ref` válida no se toca el almacén, pero se guarda igual**: falla cerrado
donde importa (el acceso) y abierto donde no (el guardado). Lo que se pierde
—estructura del original y barrido del temporal— se registra con su motivo, que
es el contador del límite. Si algún día `caducada` domina ese registro, la
respuesta no es alargar la firma a ciegas: es medir cuánto vive de verdad un
modal abierto.

⚠️ **EL CENSO POR CAPACIDAD, EJECUTADO Y RE-EJECUTADO — y es el estreno de la
regla que esta ficha pagó.** La pertenencia a la clase no es un nombre de
parámetro: es «toca el almacén con clave de servicio».

```bash
# quién accede al almacén, y si pasa por la referencia firmada
for f in $(grep -rl ".storage" --include=*.ts app/ lib/ worker/ | grep -v test); do
  ops=$(grep -oE ".(download|remove)(" "$f" | sort -u | tr "
" " ")
  [ -n "$ops" ] && echo "$f | ops: $ops | ref: $(grep -c resolverOrigenDelFichero "$f")"
done
```

| fichero | operaciones | ref firmada |
|---|---|---|
| `app/api/analyze-v2/route.ts` | download | ✅ |
| `app/api/extract-text/route.ts` | download | ✅ |
| `app/api/ingest/route.ts` | download · remove | ✅ |
| `app/api/index-text/route.ts` | download · **remove** | ✅ **desde hoy** |
| `lib/purge-org.ts` | remove | **no aplica** — itera `memberIds` del servidor y compone las rutas del listado; **no recibe nada del cliente** |

⚠️ **Y EL CENSO SE EQUIVOCÓ LA PRIMERA VEZ QUE LO EJECUTÉ HOY, por la misma vía
que el de B.204.** El primer `grep` buscaba `storage.from(` en una línea y
**`extract-text` parte la expresión en dos**, así que no salió. Un censo por
capacidad escrito con la forma de un nombre sigue siendo un censo por nombre. Se
rehízo buscando `.storage` a secas.

**Cero pendientes**: no queda ningún emisor de `originalStoragePath` en `app/`,
`lib/`, `components/` ni `hooks/` — sólo un comentario que cuenta qué se retiró.

⚠️ **SIN BATERÍA NUEVA, Y SE DICE POR QUÉ**: la maquinaria (`emitirRefDeSubida`,
`resolverRefDeSubida`, los cinco motivos) ya está cubierta en
`lib/subida/referencia.test.ts`. Lo único nuevo es control de flujo de una ruta,
y **esta casa no tiene ni un solo test de ruta**. Montar un arnés para ésta sería
un cambio mayor que la migración.

## ⚠️ 5.19 · B.221 — una conversación abierta sigue citando lo que ya no está en el corpus (14/09/2026)

**MEDIDO EN PANTALLA EL 14/09/2026**: tras reemplazar un documento, el chat siguió
devolviendo el texto anterior **entero**, hablando de «el documento que me
proporcionaste» y de «mi respuesta anterior». Dejó de hacerlo al recargar.

**EL MECANISMO, y no es el corpus.** La recuperación es fresca en cada turno —se
consulta Pinecone de nuevo—, pero **el historial lo manda el CLIENTE**
(`useChat.ts:24` envía los últimos 6 mensajes; `ask/route.ts:80` los acepta;
`rag.ts:238` los pasa al modelo como `messages`). Las respuestas anteriores del
asistente **contienen el texto que citó entonces**, así que el contenido viejo
vuelve a entrar por la puerta de la conversación aunque ya no esté en el corpus.

⚠️ **Y LA PREGUNTA QUE IMPORTABA, CONTESTADA: SÍ PASA IGUAL CON DOCUMENTOS
BORRADOS.** No hay nada en el camino que distinga «este contenido sigue vigente» de
«esto lo cité antes»: es texto en un mensaje anterior. **Contenido retirado a
propósito sobrevive en la sesión** — que es peor que una versión vieja, porque
alguien lo quitó queriendo.

**LO QUE LO ACOTA, y hay que decirlo para no exagerarlo**: la ventana son **6
mensajes** (`MAX_HISTORY_MESSAGES`), o sea unos tres turnos. El contenido viejo cae
solo pasadas tres preguntas más. Las dos salidas de hoy son **recargar** o **seguir
hablando**, y ninguna se le dice al usuario.

**No se arregla aquí**: qué hacer —avisar de que el corpus cambió, recortar el
historial al reemplazar o al borrar, o marcar las citas con su fecha— es una
decisión de producto.

## ⚠️ 5.20 · B.222 — el reemplazo destruye antes de construir, y no es recuperable (14/09/2026)

⚠️⚠️ **ESTA FICHA SE ESCRIBIÓ CON UNA PREMISA FALSA, Y LA PREMISA ERA EL
ARGUMENTO ENTERO. Corregida el 14/09/2026, el mismo día, antes de escribir el
arreglo que proponía.**

**LO QUE DECÍA**: que el residuo grave era «fila viva sin contenido» y el
benigno «vectores huérfanos, que ya tienen herramienta que los caza», y que por
tanto había que **invertir** el orden del borrado —fila primero, vectores
después— para producir el benigno en vez del grave.

**QUÉ LA FALSIFICÓ, con su línea**: `lib/rag.ts:336-370`. Cuando un documento no
tiene `full_text`, `buildContext` **reconstruye su contenido desde los trozos de
Pinecone**. Borrar la fila no toca los metadatos, así que los huérfanos siguen
casando con `CORPUS_ACTIVO` (`analysisStatus = 'analizado'`): el chat los
recupera, los reconstruye y los cita por su nombre en `:384`. **Los vectores
huérfanos no son el residuo benigno: son el producto sirviendo un documento
recién borrado.** Y no caducan — el limpiador es una página de administración que
alguien tiene que ir a pulsar (`app/api/admin/cleanup/page.tsx:180`).

**Invertir habría cambiado un fallo visible por uno que sirve contenido borrado**,
justo lo contrario del objetivo.

**LO QUE SE HIZO EN SU LUGAR, y no es el orden**: mirando los cuatro pasos juntos,
el de los vectores era **el único que no abortaba** —la lápida aborta, los
análisis abortan, la fila aborta—. Se le puso el cerrojo: si los vectores no se
borran, la fila no se borra. El residuo pasa a ser **documento en la lista, sin
vectores**: el chat no lo encuentra, el usuario lo ve y vuelve a borrar. La
ventana 1 queda **CERRADA**.

**Y LA VENTANA 2 TAMBIÉN, el mismo día**: el borrado del viejo se movió a
DESPUÉS de indexar el nuevo, que es el patrón que la casa ya tenía escrito con
esas palabras en `app/api/drive/sync/route.ts:313`. El fallo pasa a ser dos
documentos con el mismo nombre —visible, y con la versión nueva ya a salvo— en
vez de ninguno.

⚠️ **SEGUNDA COSA QUE ESTA FICHA DIJO SIN MIRAR**: que había que revisar «la
comprobación de colisión, que hoy se apoya en que el viejo ya no está». **No se
apoya en nada**: vive en el `else` de «no estoy reemplazando», así que en el
camino del reemplazo no corre. Era una suposición razonable escrita en
indicativo, y es la segunda de la misma ficha.

✅ **LO QUE APARECIÓ AL MOVERLO, y no estaba previsto**: la «Fuente 2» de
recuperación de estructura (`index-text` :234-243) lee los segmentos del
documento que se reemplaza… y el borrado estaba **80 líneas antes**. Leía una
fila recién borrada: **código muerto desde que se escribió**. Consecuencia
medible: reemplazar una hoja de cálculo desde la bandeja **siempre** perdía la
estructura y **siempre** preguntaba si aplanar, aunque el texto estuviera
intacto. Mover el borrado la resucita.

⚠️ **Y UNA QUE HUBO QUE ARREGLAR PARA QUE ESTO FUERA SEGURO**: el `insert` del
documento nuevo **no comprobaba su error**. Con el orden viejo era feo y no
peligroso —el viejo ya no estaba—; con el nuevo, un insert fallido seguido del
borrado dejaría **cero** documentos. La comprobación no es un extra del cambio:
es parte de él.

**POR QUÉ SE ESCRIBE ASÍ Y NO SE REESCRIBE LIMPIA**: una ficha corregida en
silencio enseña menos que el error. La clase de premisa que falló —«ese residuo
ya está cubierto»— es una afirmación **sobre el consumidor**, y se coló porque
sonaba razonable. Está promovida a regla en `CLAUDE.md`.

---

**LO QUE SEGUÍA SIENDO CIERTO DE LA FICHA ORIGINAL, tal cual se escribió:**
**HOY NO HA MORDIDO** —el reemplazo funciona y quedó verificado con cifras: id
nuevo `733b1e35`, `chunk_count 1`, 167 caracteres, un trozo, una generación— pero
las dos ventanas son reales y salen de leer el orden.

**VENTANA 1 · dentro de `deleteDocument`**: los vectores se borran (`:179`, `:193`)
**antes** que la fila (`:204`), y la fila se borra **aunque los vectores hayan
fallado**. Las dos mitades dejan residuo, y de signo opuesto:

| qué falla | qué queda | cómo de grave |
|---|---|---|
| los vectores (ambas vías) | **fila viva sin contenido** | el documento aparece en la lista y el chat no lo encuentra |
| la fila | **vectores huérfanos** | hay herramienta que los caza y los limpia |

**VENTANA 2 · en `index-text`, y es la peor**: `deleteDocument` corre **antes** de
generar los *embeddings* y subir los vectores (`:159` frente a `:277` y `:295`). Si
algo falla en medio, **el viejo ya no está y el nuevo no llega**: el usuario se
queda **sin ninguna de las dos versiones**.

⚠️ **Y LA CASA YA TIENE EL PATRÓN ESCRITO PARA ESTO**: *efecto antes que registro,
todo-o-nada, y fallo ruidoso* — «se construye antes de destruir». La
sincronización de Drive lo aplica literalmente y lo dice en su comentario («Construir
antes de destruir: subir los vectores nuevos primero»). **El reemplazo del modal
hace lo contrario**, y nadie lo cruzó.

**EL TAMAÑO, para decidir**:
- **Invertir el orden dentro de `deleteDocument`** —fila primero, vectores
  después— convierte el residuo grave en el benigno: si falla la fila no se toca
  nada; si falla el borrado de vectores, quedan huérfanos, que se detectan y se
  limpian. Es un bloque movido más su batería, y hay que revisar qué significan
  `vectorsDeleted` y `ok` para los tres llamadores.
- **Construir antes de destruir en `index-text`** —indexar el documento nuevo y
  sólo entonces borrar el viejo— elimina la ventana 2. El fallo pasa a ser **dos
  documentos con el mismo nombre**: visible, y con herramienta que ya existe.
  Es mover el bloque del borrado detrás del alta, y revisar la comprobación de
  colisión, que hoy se apoya en que el viejo ya no está.

**No se decide aquí.**

## ⚠️ 5.21 · B.223 — dos endpoints escriben la fila con el id del usuario en la columna de la organización (14/09/2026)

**LO ENCONTRÓ CONTAR GUARDAS, NO BUSCARLO.** Al migrar `resolveOrg` había 65
llamadas y sólo 63 encajaban en alguna de las tres formas de guarda conocidas.
Las dos que sobraban no devuelven error: **escriben**.

`/api/documentation-gaps` y `/api/feedback` hacían `org?.orgId ?? user.id`. Con
los dos motivos aplastados en el mismo `null`, **un timeout de la base metía la
fila con el id del usuario en `org_id`** — una fila en una organización que no
existe, persistida y en silencio. Es la clase peor: lo que se guarda arrastra su
fallo; lo que se calcula lo pierde al recalcular.

**LA MITAD QUE YA ESTÁ ARREGLADA**: `indisponible` ya no escribe. Devuelve 503 y
el cliente reintenta.

⚠️ **LA MITAD QUE SIGUE ABIERTA, Y SE CONSERVÓ A SABIENDAS**: con
`sin_organizacion` el respaldo a `user.id` **sigue ahí**. Hoy un usuario sin
organización puede mandar feedback y declarar lagunas, y quitárselo no es
arreglar un tipo: es decidir que esa gente deje de poder hacerlo. Las tres
salidas, para que se decida con ellas delante:

| salida | qué pasa con quien no tiene organización | qué pasa con la tabla |
|---|---|---|
| dejarlo como está | puede escribir | sigue habiendo filas con `org_id` que no es una organización |
| 403 también aquí | no puede escribir | la columna vuelve a significar una sola cosa |
| columna `org_id` anulable | puede escribir | la fila dice la verdad: «sin organización» |

## ✅ LA MITAD ABIERTA, DECIDIDA EL 15/09/2026 — no escribe, y ya está

**Se retira también el respaldo para `sin_organizacion`.** Quien no pertenezca a
ninguna organización deja de poder escribir en estas dos tablas. **No es la misma
decisión que la anterior**: aquélla arreglaba un tipo, ésta cambia el producto, y
se toma porque la columna `org_id` vuelve a significar una sola cosa — y porque
**un identificador inventado no se distingue después de uno legítimo**: la fila
mentiría para siempre y nadie podría separarlas sin adivinar.

La forma correcta el día que haga falta recoger esto de alguien sin organización
**no es volver al respaldo**: es una columna que pueda decir la verdad —`org_id`
anulable— en vez de una que miente con un valor con dueño.

⚠️ **Y LA PREGUNTA QUE DECIDÍA EL TAMAÑO, CONTESTADA ABRIENDO A LOS
CONSUMIDORES: ESAS FILAS ESTÁN INERTES HOY.**

| tabla | quién la lee | quién la agrega |
|---|---|---|
| `documentation_gaps` | **nadie** | nadie |
| `feedback` | sólo `purge-org.ts:139`, y **por `user_id`, no por `org_id`** | nadie |

No hay analítica, ni cuota, ni bandeja que las sume: **no ensucian ningún
recuento**. Eso no las hace inocuas —son datos que mienten sobre su dueño— pero
sí quita la urgencia. **Y esto es una afirmación sobre sus CONSUMIDORES, así que
va con el comando que la sostiene**, no de memoria:

```bash
grep -rn "documentation_gaps|from('feedback')" --include=*.ts --include=*.tsx \
  app/ lib/ worker/ components/ hooks/ | grep -v test
```

**EL RECUENTO NO SE HA HECHO, y no se hace aquí.** El SQL está escrito en
`claude/SQL_B223_recuento.sql` y lo ejecuta el director: cuántas hay por tabla,
con fechas, con su denominador —un cero sin él no se puede leer— y **separando
las RECUPERABLES**: una fila fabricada lleva el `user_id` de quien la escribió, y
si ese usuario pertenece hoy a una organización, se puede reasignar en vez de
borrar. **Borrar antes de contar sería perder trabajo del director.**

**No se decide aquí** qué hacer con ellas: eso es el encargo siguiente, con las
cifras delante.

## ⚠️ 5.22 · B.224 — los Gateway Timeout de la base: lo medido, y dónde NO está la causa (14/09/2026)

**PARA QUE NO SE INVESTIGUE DOS VECES.** Durante el reemplazo del 14/09 salieron
403 repetidos que resultaron ser timeouts de la base disfrazados. Lo que se midió
en el repositorio, con su resultado:

| qué se miró | resultado |
|---|---|
| índices de `memberships` | `memberships_org_id_user_id_key UNIQUE(org_id,user_id)`, `idx_memberships_user_id` |
| índices de `temporary_elevations` | `idx_temp_elevations_active` |
| forma de las consultas | tres, todas búsquedas por clave |
| llamadas | 65, desde 54 endpoints, sin caché y sin reintento |

**NINGUNA CONSULTA SE HA VUELTO MÁS CARA.** Lo que subió es el número de
llamadas, y **parte del aumento es de esta misma serie**: `extract-text` ganó
`resolveOrg` en `dac6da2a` y `subidas/autorizar` nació en `228239d2`. La bandeja
además multiplica: por documento, `/text` + `/analyze-v2`, o `mark-analyzed`.

⚠️ **CONCLUSIÓN, Y ES UNA NEGATIVA HONESTA: nada en el repositorio explica que
una búsqueda por clave tarde treinta segundos.** La causa apunta **fuera** —a la
instancia de Supabase—, en la misma clase que las políticas RLS del bucket, que
desde aquí tampoco se pueden leer. Se dice así y no se disfraza de hallazgo.

**LO QUE SÍ ERA NUESTRO YA ESTÁ ARREGLADO**: que el producto lo contara mal. El
tipo distingue los dos motivos, 64 mensajes en 52 ficheros pasaron a un solo
sitio, y el 503 lleva `Retry-After`.

**EL REINTENTO NO ENTRÓ, Y ESO ES LO QUE HABILITA EL TIPO.** Sin la distinción
habría reintentado también a quien de verdad no tiene organización: tres vueltas
y una espera sobre una respuesta que ya era correcta. Con ella, se puede escribir
el día que haga falta y sólo sobre `indisponible`.

## ⚠️ 5.23 · B.225 — un documento sin fila sigue siendo servible por el chat (14/09/2026)

**SALIÓ DE MEDIR OTRA COSA**, y es independiente del orden del borrado: se
encontró comprobando si invertirlo era buena idea, y vale por sí solo.

**EL MECANISMO, leído entero:**

| paso | fichero:línea | qué pasa con un huérfano |
|---|---|---|
| filtro de la búsqueda | `pinecone/vectors.ts:98` | `CORPUS_ACTIVO` mira `analysisStatus` en los **metadatos**, no si la fila existe → **casa** |
| texto completo | `rag.ts:309` | pide `full_text` por id a `documents` → **no hay fila, no hay texto** |
| montaje del contexto | `rag.ts:336-370` | sin `full_text`, **reconstruye desde los trozos de Pinecone** |
| cita | `rag.ts:384` | lo nombra: `[Documento: X]` |

⚠️ **Es decir: el chat contesta con el contenido, y además le pone el nombre del
documento que ya no existe.** Para el usuario es indistinguible de un documento
vivo.

**LO QUE LO ACOTA, y hay que decirlo para no exagerarlo:**

- Borrar por el camino normal **ya no los produce**: el cerrojo de los vectores
  (14/09/2026) impide que la fila se vaya si los vectores se quedan.
- **Pero esta ficha no es sobre ese camino.** Los huérfanos existen por otras
  vías —la herramienta de limpieza existe precisamente porque los hay— y esta
  ficha describe **qué pasa con uno cuando existe**, venga de donde venga.

**LO QUE NO SABEMOS, dicho como lo que es:**

- ⚠️ **Cuántos hay hoy: no lo sabemos.** Nadie lo ha contado, y esta ficha no
  afirma ninguna cifra.
- **El detector ya existe**: `/api/admin/cleanup-orphans` en modo `dryRun=true`,
  desde la página de administración. Es una consulta, no un desarrollo.
- **No hay barrido automático.** El limpiador sólo corre cuando un administrador
  abre esa página y pulsa. Un huérfano producido hoy sigue servible
  indefinidamente.

⚠️ **Y LA VECINDAD QUE IMPORTA**: es de la misma familia que la conversación que
sigue citando lo borrado, pero **sin su caducidad**. Allí el contenido cae solo
pasados tres turnos; aquí no cae nunca.

## 📏 MEDIDO EL 15/09/2026 — uno, y uno no es cero

**El director ejecutó el `dryRun`. Copiado literal:**

> «Se encontraron **1** vectores huérfanos en tu organización. No se ha borrado
> nada. Vectores en Pinecone: **763** · Documentos en base de datos: **42**»
> El huérfano: `CLI-05_radiologia-proteccion-radiologica.txt (corregido
> 14/09/2026)`, documento `733b1e35-aaa9-4e00-a9c4-eb7bbe6bc21b`.

**UNO NO ES CERO: la fábrica existe y ya produjo.** Y es el documento con el que
se probaron los reemplazos, así que salió de ahí.

⚠️ **EL ID NO CUADRABA CON LO MEDIDO EL DÍA ANTERIOR** —`733b1e35` estaba VIVO,
con 167 caracteres y un trozo— **así que se miró el detector sin darlo por bueno
en ninguna dirección. El detector NO se equivoca, y se puede afirmar leyéndolo:**

`cleanup-orphans/route.ts:35-56` trae **todos** los ids de documentos de la
organización y marca huérfano el vector cuyo `documentId` de metadatos no esté en
ese conjunto. **No entran generaciones, ni `chunk_count`, ni estados**: es una
pertenencia a conjunto. Y con 42 documentos no hay truncamiento posible.

**Por tanto lo que dice es exacto: hoy no existe fila con ese id.** La lectura
que queda es que el documento se reemplazó otra vez *después* de aquella
medición, y su borrado dejó un vector. Confirmarlo es una consulta —`select id
from documents where id = '733b1e35-…'`— y **sobra para decidir**: el detector no
es el que falla.

✅ **Y EL DENOMINADOR, POR PRIMERA VEZ CREÍBLE, que conviene dejar escrito:** ese
«763» sale de una consulta de similitud con `topK: 10000` (B.209). **Con 763
está muy por debajo del tope, así que devuelve el índice entero y el recuento es
un TOTAL.** El día que se acerque a 10.000, la misma cifra pasará a ser una
**cota inferior** sin avisar — y entonces «1 huérfano» podría significar «1 de
los que cupieron». Hoy no es el caso, y por eso hoy se puede creer.

## 📏 SEGUNDA MEDICIÓN, 15/09/2026 — cero, y un vector que se fue solo

> «Se encontraron **0** vectores huérfanos. Vectores en Pinecone: **762** ·
> Documentos en base de datos: **42**. No hay huérfanos. Todo limpio.»

**Y sin pulsar «limpiar»: de 763 a 762 por otra vía.**

⚠️ **QUÉ SE LLEVÓ ESE VECTOR — lo que se puede decir y lo que no.** Lo que sí:
**no existe en el repositorio ningún barrido programado**. Los diez sitios que
borran vectores se disparan todos por una petición —`cleanup-orphans`,
`discard-staged`, `drive/disconnect`, `drive/sync`, `index-text`, `ingest`,
`delete-document`, `document-swap`, `retirar-version`, `purge-org`— y ninguno
corre por reloj. Así que **nada de la casa lo borró por su cuenta**.

**La explicación que encaja, y queda como HIPÓTESIS, no como hecho**: los
borrados de Pinecone son asíncronos. El documento de ese vector ya no tenía
fila, o sea que **se le había pedido el borrado antes**; el índice tardó en
aplicarlo y entre las dos consultas se puso al día. Encaja con todo lo medido y
**no está comprobada**: para comprobarla haría falta un registro del momento del
borrado que no tenemos.

**NO EXPLICADO, por tanto, en sentido estricto.** Se anota así a propósito: un
«seguramente fue X» escrito como si fuera X es cómo se fabrica un dato.

⚠️ **Y CAMBIA LO QUE SIGNIFICA EL CRITERIO DE LA SEMANA.** Si el huérfano murió
solo, el `dryRun` de dentro de una semana ya no distingue «la fábrica está
cerrada» de «los borrados tardan»: **sólo un número que CREZCA seguiría
significando algo**. Un cero, ahora, es compatible con las dos cosas.

**LA DECISIÓN SOBRE LA GUARDA, con el criterio de corte delante:** no califica
como urgente, y la razón no es que sea inofensiva —un huérfano servible es corpus
fantasma— sino que **la puerta principal de la fábrica ya está cerrada**: el
cerrojo de los vectores impide que el borrado se lleve la fila dejando los
vectores, y el reemplazo construye antes de destruir. Ese huérfano es anterior a
las dos cosas.

**Lo que se hace en su lugar, que es más barato y más informativo:**

1. **Limpiar ése ahora** con el botón que ya existe: es un vector, es gratis y es
   inmediato.
2. **Repetir el `dryRun` dentro de una semana.** Si vuelve a dar cero, la fábrica
   está cerrada de verdad y la guarda se queda en la cola. **Si el número crece,
   hay una vía que no conocemos y entonces sí es urgente** — y esa medición
   distingue las dos cosas, que ninguna opinión puede.

⚠️ **Y LO QUE NO SE PUEDE SABER HOY, dicho como tal:** con qué FRECUENCIA el chat
los sirve. El respaldo por trozos de `rag.ts:336-370` **no deja rastro
distinguible** —no hay contador que separe «reconstruí porque falta `full_text`»
de «reconstruí porque no hay fila»—. Saberlo exigiría un contador nuevo, y eso es
otra pieza. Que no se pueda medir hoy es información, no una excusa.
**No se decide aquí** — si el filtro debe comprobar la fila, si el barrido debe
ser automático, o si basta con contarlos una vez, es una decisión con coste en
cada consulta del chat.


## ⚠️ 5.24 · B.226 — el chat decía no tener acceso a un documento que sí estaba (14/09/2026)

**LO QUE VIO EL DIRECTOR**: preguntó por un documento suyo por su nombre y el
chat contestó que no tenía acceso a él.

**EL MECANISMO, y no era mentira desde dentro**: el nombre del fichero **no está
en el texto embebido** —`chunkSegments` mete `{ text: trozo }` y nada más—, así
que la pregunta se comparaba contra trozos que no contienen el nombre. Sin
parecido de contenido, nada pasaba el umbral y `rag.ts` devolvía, **sin llamar
siquiera al modelo**, «asegúrate de que los documentos han sido subidos al
sistema». Estaba subido.

⚠️ **LO PEOR NO ERA NO ENCONTRARLO: ERA LA CONCLUSIÓN.** De «no encontré
parecido» salía una afirmación sobre SU corpus. Es la familia de B.219 —quien no
puede saber algo, no lo afirma— en el sitio donde más se nota.

**ARREGLADO, y el criterio es el que importa**: no se clasifica la intención de
la pregunta —eso hay que acertarlo cada vez— sino que se compara contra la
**lista cerrada** de nombres del corpus. Si ningún documento se llama como algo
que hay en la frase, no pasa nada y el comportamiento es el de ayer: **falla
hacia lo de hoy por construcción, no por calibrado**.

**Lo estrecho, a sabiendas**: el nombre tiene que llevar **extensión**. Se
descartó aceptar el nombre a secas porque un documento llamado `Contrato.pdf` se
activaría con «¿qué dice el contrato?», que es una pregunta legítima sobre el
contenido. Se puede ampliar el día que se quede corto; al revés no.

**Las tres salidas, ahora separadas:**

| situación | qué dice |
|---|---|
| lo nombra y el contenido responde | responde |
| lo nombra y el contenido **no** responde | **«está en tu documentación, pero no encuentro dentro nada que responda a esto»** ← la que no podía decir |
| no nombra nada y no hay parecido | que no encontró información, **y cómo escribir el nombre** — ya no manda subir lo que ya está subido |

**EL COSTE, declarado**: una consulta más (`id, name`) por pregunta. Se evita en
la mayoría: un nombre con extensión no puede ser subcadena de una pregunta sin
punto, así que si la pregunta no tiene punto no se consulta. Es una condición
**necesaria**, no suficiente — no puede descartar un caso bueno.

**Y falla cerrada**: si esa consulta no contesta, la lista sale vacía y el chat
se comporta como ayer. Un fallo de la base no puede convertirse en «ese
documento no existe», que es justo lo que esta ficha cierra.

⚠️ **NO EJERCIDO EN PRODUCCIÓN TODAVÍA.** Se apoya en 23 casos y cuatro
mutantes, no en una pantalla. Lo que hay que mirar está en el censo.

## ⚠️ 5.25 · B.227 — el callback de Drive escribe el `org_id` que le manden, sin firma y sin sesión (15/09/2026)

**LO ENCONTRÓ EL CENSO POR CAPACIDAD DE B.223**, preguntando «¿quién ESCRIBE un
`org_id`?» en vez de «¿quién llama a `resolveOrg`?». Es el tercero, y **no es de
la misma familia que los otros dos: es peor**.

`GET /api/drive/callback` no tiene autenticación ninguna —ni sesión, ni
`resolverOrg`— y hace esto:

```ts
// app/api/drive/callback/route.ts:22
state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
// …:45
await supabase.from('drive_connections').upsert({
  org_id: state.orgId,
  user_id: state.userId,
  access_token: encrypt(tokens.accessToken),  // los del que acaba de autorizar
  …
}, { onConflict: 'org_id' });
```

El `state` viaja en la URL como **base64 de un JSON, sin firma**. Cualquiera
compone uno.

⚠️ **Y LA GUARDA EXISTE, DISEÑADA Y SIN APLICAR.** `app/api/drive/route.ts:36-40`
mete en el `state` un campo `token` —la sesión de quien inicia el flujo— y el
callback **declara ese campo en su tipo y no lo lee en ninguna línea**. No es una
comprobación que falte por diseñar: es una que se diseñó y no se conectó.

**QUÉ PERMITE, dicho sin adornar y sin exagerar:** quien conozca el `orgId` de
otra organización puede completar el flujo con SU propia cuenta de Drive y el
callback **sobrescribe** —`onConflict: 'org_id'`— la conexión de esa
organización con sus tokens. A partir de ahí la sincronización de esa
organización lee el Drive del atacante. Un `orgId` es un UUID: no es adivinable,
pero **tampoco es un secreto** — no es una credencial y viaja por sitios donde una
credencial no viajaría.

⚠️ **Y UNA SEGUNDA COSA, INDEPENDIENTE: el token de sesión del usuario viaja en
la barra de direcciones** hasta Google, dentro del `state`. Acaba en el historial
del navegador, en los registros del proveedor y en cualquier `Referer` del
camino. Y **no se usa para nada**: es una credencial expuesta a cambio de cero.

## ✅ ARREGLADA EL 15/09/2026 — y el arreglo hace tres cosas de una

**EL ALCANCE, MEDIDO ANTES DE ESCRIBIR NADA, porque decidía si era urgente o
gravísimo:**

| pregunta | respuesta medida |
|---|---|
| ¿qué hace falta? | **el `orgId` de la víctima (un UUID) y cualquier cuenta de Google.** Ninguna sesión en esa organización, ninguna credencial |
| ¿el atacante LEE los documentos de la víctima? | **NO.** El flujo es de una sola dirección: Drive → corpus. Nada empuja documentos hacia Drive |
| ¿entonces qué consigue? | **inyectar y destruir.** En la siguiente sincronización —disparada por un miembro legítimo, que resuelve su organización bien— el sistema lee el Drive del atacante: **importa sus documentos** y **borra los que la víctima tenía sincronizados**, porque «ya no están en Drive» (`sync/route.ts:490-505`, sobre `documents` filtrados por `source`) |
| ¿lo salva la guarda del listado que falla? | **No** (la de B.138): aquélla protege del listado que FALLA, y el listado del Drive del atacante es perfectamente válido |
| ¿se nota? | **sí, a posteriori**: `drive_connections.email` pasa a ser el del atacante y la pantalla lo enseña |

Así que no es exfiltración — y decirlo importa, porque la respuesta fácil era
suponerla—. Es **destrucción del corpus sincronizado más inyección en él**, que
en un producto que responde desde ese corpus es de la primera familia.

**EL ARREGLO, y se eligió entre los dos con su razón:**

Se descartó *leer el `token` que ya viajaba* porque eso habría dejado **el token
de sesión viajando en la barra de direcciones** —historial, `Referer`, registros
de Google—, que es un problema por sí solo. Firmar no necesita que viaje ninguna
credencial.

⚠️ **Y AL MIRARLO RESULTÓ QUE EL TOKEN EN LA URL NO LO PONÍA GOOGLE: LO PONÍAMOS
NOSOTROS EN LAS DOS PATAS.** `useDrive.ts:33` hacía
`window.location.href = '/api/drive?token=' + session.access_token`, y
`drive/route.ts` lo leía de ahí. Como esa navegación es de primer nivel, **las
cookies llegan solas** y el token nunca hizo falta. El arreglo lo retira de las
dos.

**Lo que hay ahora, y hacen falta las dos mitades:**

- **la COOKIE** dice *quién eres* — en las dos rutas, que antes no autenticaban
  igual (el inicio por `?token=`, el callback **nada en absoluto**);
- **la FIRMA** (`lib/drive/estado-oauth.ts`, HMAC del mismo `firma.ts`) dice que
  *ese `state` lo emitimos nosotros, para esa organización, hace menos de quince
  minutos*.

Ninguna sobra: sin la cookie, un `state` capturado se podría reintentar; sin la
firma, la cookie no dice nada sobre **qué** organización es. El motivo `ajeno`
—firma buena, no caducado, pero de otra sesión— es exactamente esa mitad.

**Quince minutos y no dos horas** como la referencia de subida, y la razón se
escribe: aquélla espera a que una persona revise un documento; ésta es un ida y
vuelta a la pantalla de Google.

**12 casos, tres mutantes, los tres muertos**: quitar la firma —literalmente el
código de ayer— mata **9**; quitar la cláusula `ajeno`, 1; quitar la caducidad, 2.

⚠️ **LO QUE ESTE CENSO RE-EJECUTADO NO VE, y se dice**: la línea de escritura
sigue siendo `org_id: state.orgId`, idéntica a la de ayer. **Lo que cambió es la
PROCEDENCIA de `state`**, y un censo que sólo mire el punto de escritura no lo
distingue. Para esta clase, el censo tiene que llegar hasta el origen del valor.

**PENDIENTE DE EJERCER EN PANTALLA**: conectar Drive y que funcione. Si la cookie
no llegara al callback, saldría `drive_error=no_session` — dicho aquí para que,
si aparece, se sepa qué es en vez de parecer un fallo de Google.

## ⚠️ 5.26 · B.228 — una tabla que sobrevive al borrado de la organización (15/09/2026)

**DEL MISMO CENSO, y es pequeña pero conviene no perderla.**
`purge-org.ts` borra quince tablas al expirar el periodo de gracia.
**`documentation_gaps` no está en la lista** (`purge-org.ts:75-199`), así que las
preguntas que un usuario escribió ahí **sobreviven al borrado de su organización
y de su usuario de Auth**.

Su hermana `feedback` sí se borra, pero **por `user_id`** (`:139`), no por
`org_id` — lo que resulta ser lo correcto por accidente, porque es lo único que
alcanza a las filas de B.223.

⚠️ **Y LA PREGUNTA QUE DECIDE SI ESTO ES OTRA CONVERSACIÓN, CONTESTADA: SÍ
GUARDA CONTENIDO.** `DocGapButton.tsx:30` manda `answer` —**la respuesta del
chat, recortada a 5.000 caracteres**— junto a la pregunta del usuario. Esa
respuesta está fundada en los documentos: **es contenido derivado del corpus**,
no una etiqueta ni un identificador.

Así que lo que sobrevive al borrado de la organización no es metadato: son hasta
5.000 caracteres de material del cliente por fila, después de que su
organización y su usuario de Auth ya no existan.

**Lo que lo acota**: nadie lee esa tabla (ver B.223), así que el dato no se
enseña. **Lo que no lo acota**: el purgado existe para que no quede dato del
cliente, y ahí queda.

**No se decide aquí.**


## ⚠️ 5.27 · B.229 — el error del proveedor se tira y se sustituye por uno inventado (15/09/2026)

**MEDIDO**: el director intentó conectar y recibió *«Error conectando Google
Drive: access_denied»*. Se preguntó si podía venir del arreglo de B.227. **No
puede, y se puede afirmar leyendo el orden**: `callback/route.ts:12-14`
comprueba el parámetro `error` **lo primero de todo**, antes de la sesión y antes
de la firma. Si el proveedor dice que no, ninguna línea nueva llega a correr.

✅ **Y de paso demuestra media cosa buena**: el flujo llegó a Google y volvió, así
que `/api/drive` autenticó por cookie sin problema. La primera pata del arreglo
funciona; la segunda sigue sin ejercerse.

⚠️ **PERO ESAS DOS LÍNEAS TIRAN EL DIAGNÓSTICO, Y ES EL FALLO DE VERDAD:**

```ts
if (error) {
  return NextResponse.redirect(new URL('/chat?drive_error=access_denied', req.url));
}
```

**El código escribe `access_denied` SIEMPRE, diga lo que diga el proveedor.**
Google puede contestar `access_denied`, `admin_policy_enforced`,
`invalid_scope`, `org_internal`… y todos llegan al usuario como el primero. Es
un mensaje que **afirma un motivo que no ha comprobado** — la familia de B.219,
y aquí impide arreglar nada porque esconde qué hay que arreglar.

**Y una segunda, más pequeña**: `chat/page.tsx:97` dice *«Error conectando
**Google Drive**»* fijo, aunque el proveedor sea OneDrive.

⚠️ **LA CONSECUENCIA PRÁCTICA HOY: B.227 NO SE PUEDE EJERCER.** No porque el
arreglo falle, sino porque **el mensaje no distingue «el proveedor te dijo que
no» de «algo nuestro falló»**. Los códigos propios ya son distintos
—`no_session`, `state_expired`, `state_not_yours`, `invalid_state`—; lo que
falta es dejar pasar el del proveedor en vez de sustituirlo.

**No se arregla aquí.**

## ⚠️ 5.28 · B.230 — «40 nuevos» sobre documentos que ya estaban, y a la bandeja (15/09/2026)

**MEDIDO**: tras el intento de Drive, el director sincronizó y salió
*«Sincronización completada: 40 nuevos, 0 actualizados, 0 eliminados, 0 sin
cambios»*. Inmediatamente después: **42 documentos, 42 nombres distintos**, sus
40 de OneDrive más 2 manuales, **sin duplicados**. Y los 40 **aparecieron en la
bandeja de revisión**.

**QUÉ CUENTA CADA NÚMERO, con su línea — porque la primera sospecha era que la
etiqueta mintiera, y NO miente:**

| número | variable | dónde se incrementa | qué significa de verdad |
|---|---|---|---|
| nuevos | `newCount` | `sync/route.ts:474` | **después de un `insert` REAL** en `documents`, con `analysis_status: 'pendiente'` (`:447`) |
| actualizados | `updatedCount` | `:433` | la fila existente se actualiza en sitio |
| eliminados | `deletedCount` | `:508` | `deleteDocument` por desaparición remota |
| sin cambios | `skippedCount` | `:213` y `:285` | el cerrojo por fecha lo saltó, o el hash no cambió |

Y el cliente pinta `stats.new` tal cual (`useDrive.ts:56`). **Así que no es un
contador con la etiqueta cambiada: son cuarenta filas insertadas.** Lo cual es
PEOR que la sospecha, no mejor.

✅ **Y explica la bandeja sin más misterio**: toda fila que entra por ahí nace
`pendiente`. No es que se les haya cambiado el estado — es que **son filas
nuevas**, y las nuevas nacen sin revisar.

⚠️ **PERO ENTONCES LOS DOS HECHOS NO PUEDEN SER CIERTOS A LA VEZ: 42 + 40 = 82,
y se midieron 42.** Una de las dos cosas no es lo que parece, y no se elige
adivinando. Las lecturas posibles:

| lectura | qué tendría que verse en la base |
|---|---|
| se insertaron 40 y las viejas ya no están | los 40 con `created_at` de hace un minuto, y **el corpus habría perdido su historia** |
| se insertaron 40 y hay 82 filas | el recuento de 42 medía otra cosa — un filtro, o **una sola organización de dos** |
| el emparejamiento falló | `existingDocs` se lee con `.eq('source', provider.name)` (`:129`) y se indexa por `provider_file_id` (`:161`): si el `source` guardado no es el que devuelve el proveedor hoy, **todo parece nuevo** y el índice único no choca porque incluye `source` |

**El SQL que lo decide está en `claude/SQL_sync_40_nuevos.sql`** y lo ejecuta el
director: filas por `org_id` y por `source`, distribución de `created_at` por
minuto, cuántos están en `pendiente` **con `reviewed_at` ya puesto** —que es la
prueba de «estaba revisado y ha vuelto atrás»—, y si quedaron análisis sin
documento vivo.

⚠️ **LA TERCERA LECTURA ES LA QUE MÁS ME CONVENCE Y LA QUE NO PUEDO CONFIRMAR
DESDE AQUÍ**, y por eso no se escribe como diagnóstico: haría falta ver qué
`source` tienen esas filas. Si fuera ésa, el corpus tendría hoy DOS familias de
filas para los mismos ficheros y el recuento de 42 no cuadraría tampoco — así
que la propia consulta 1 la confirma o la mata.

## 📏 RESUELTO EL 15/09/2026 — el sync no borró nada; la desconexión sí

**MEDIDO POR EL DIRECTOR:**

| source | documentos | más antiguo | más reciente |
|---|---|---|---|
| manual | 2 | 12/09 09:23 | 14/09 20:31 |
| onedrive | 40 | **15/09 07:49:20** | **15/09 07:50:31** |

`revisados: 0 · sin_revisar: 40`. **Los 40 se crearon hoy, en 71 segundos.** Son
filas nuevas; las anteriores ya no estaban.

⚠️ **Y LA CONSULTA QUE LO ESCONDÍA ERA MÍA**: el recuento de «42 y 42 nombres
distintos» **no filtraba por `source`**, y borrar 40 y crear 40 da 42 igual. Un
recuento sin la dimensión que distingue las dos historias no es una medición:
es una coincidencia con forma de dato.

**QUÉ LAS BORRÓ — y no fue la sincronización, que dijo la verdad con su `0
eliminados`.** Sólo existe **un** camino que borra documentos por origen:

```
POST /api/drive/disconnect  →  :83  .from('documents').delete()
                                     .eq('org_id', …).eq('source', providerName)
```

Y **conectar no lo llama**: `handleConnectDrive` (`useDrive.ts:31`) sólo navega.
La desconexión exige pulsar su botón y confirmar un diálogo que dice, literal:
*«¿Desconectar OneDrive? Se eliminarán todos los documentos sincronizados.»*

**Así que `existingDocs` no encontró los 40 porque NO HABÍA NADA QUE ENCONTRAR.**
No es un fallo de emparejamiento; es que las filas ya no existían cuando el sync
miró. El sync hizo exactamente lo que debía: 40 ficheros, ninguna fila, 40
nuevas. **El `access_denied` no borró nada.**

⚠️ **LO QUE SÍ ES UN HALLAZGO: `disconnect` NO PASA POR `deleteDocument`.** Hace
un `.delete()` crudo, así que se salta las cuatro cosas que aquella función
garantiza —los análisis (B.112), la lápida, el candado de subida y el cerrojo de
vectores del 14/09—. Los vectores sí los borra con cuidado, con las dos
estrategias y **abortando si alguna falla** (`:69-81`), y por eso no hay
huérfanos en masa. Pero:

⚠️ **`analysis_results.document_id` NO TIENE CLAVE AJENA** —el único FK de esa
tabla es `user_id` (`supabase-setup.sql:408`)—, así que **los análisis de los 40
sobrevivieron apuntando a ids muertos**. Es exactamente la población de B.112,
por un camino que B.112 no cubrió. Lo que lo acota: desde B.212 la bandeja
empareja por `document_id`, así que **no se los va a atribuir a los nuevos**;
son filas muertas, no una mentira en pantalla.

**QUÉ SE PERDIÓ, ENTONCES, Y QUÉ NO:**

| qué | estado |
|---|---|
| el contenido | **vuelve**: se redescargó del proveedor |
| los ids | **perdidos**, y con ellos lo que colgaba de ellos |
| los análisis guardados | **vivos y huérfanos** (sin FK que los tirara) |
| `document_chunks`, `document_staged` | **se fueron en cascada** (FK `ON DELETE CASCADE`) |
| el estado de revisión | **perdido**: 40 a la bandeja, `reviewed_at` nulo, medido |
| los vectores viejos | **borrados bien** — el disconnect aborta si no puede |

⚠️ **Y LA MEDICIÓN DE HUÉRFANOS DE HOY NO VALE PARA ESTO.** No sabemos si corrió
antes o después. El indicio es que 763→762 es **exactamente el huérfano de la
primera medición**, lo que encaja mejor con «corrió antes»; pero un reindexado de
los mismos 40 ficheros produce un recuento parecido, así que no es concluyente.
**Se vuelve a ejecutar y ya está** — es gratis.

⚠️ **LO QUE NO TIENE TOPE NI AVISO, y es la pregunta de fondo:**
`decidirSincronizacion` (`sync-guard.ts:126-130`) borra **exactamente lo que no
está en el listado, sin límite y sin confirmación**. Sus dos guardas cubren otras
preguntas: «¿llegó el listado?» (B.138) y «¿cambió la carpeta?» (B.187).
**Ninguna cubre «este listado válido se lleva TODO tu corpus».** Un listado que
llegue completo pero apunte a otro sitio —otra cuenta, otra carpeta raíz— borra
los 40 sin preguntar. Es la misma forma de lo que acaba de pasar, con otro
nombre.

**No se arregla aquí.**


## ⚠️ 5.29 · B.231 — `disconnect` borra documentos sin pasar por `deleteDocument` (15/09/2026)

**MEDIDO EL 15/09/2026**: al desconectar OneDrive se borraron 40 documentos, y
**sus análisis siguen vivos apuntando a ids que ya no existen**.

`POST /api/drive/disconnect` hace un `.delete()` crudo sobre `documents`
(`:83`) en vez de llamar a `deleteDocument`. Se salta, por tanto, las cuatro
garantías de aquella función:

| lo que `deleteDocument` hace | `disconnect` |
|---|---|
| borra los `analysis_results` del documento | **no** — es la garantía de B.112, y aquí no se aplica |
| escribe lápida cuando procede | **no** |
| comprueba el candado de subida | **no** |
| aborta si los vectores no se borran (14/09) | **sí, por su cuenta** (`:69-81`) |

La última la hace bien y por eso **no hay huérfanos de vectores en masa**: borra
con las dos estrategias y se detiene si alguna falla. Es el resto lo que falta.

⚠️ **Y LO QUE LO CONVIERTE EN PÉRDIDA PERSISTENTE: `analysis_results.document_id`
NO TIENE CLAVE AJENA.** El único FK de esa tabla es `user_id`
(`supabase-setup.sql:408`). Sin cascada y sin borrado explícito, los análisis
**sobreviven al documento**. Es exactamente la población de B.112, por un camino
que B.112 no miró.

**LO QUE LO ACOTA, y hay que decirlo para no exagerarlo**: desde B.212 la bandeja
empareja por `document_id`, no por nombre. Así que esos análisis **no se van a
atribuir a los documentos nuevos**: son filas muertas, no una mentira en
pantalla. El daño es que el trabajo de revisión que representaban ya no está
atado a nada.

**POR QUÉ NO USA `deleteDocument` — y la respuesta no es «se les olvidó»:**
`DeleteReason` sólo tiene dos valores, `'user_excluded'` y `'remote_deleted'`, y
**ninguno describe una desconexión**. El primero escribiría lápidas —que
impedirían reimportar al reconectar, justo lo contrario de lo que se quiere— y el
segundo mentiría: el fichero no ha desaparecido de ningún sitio. **Es otra vez un
tipo que no puede expresar el caso**, y quien se lo encontró resolvió por fuera.

**Y por eso el arreglo es de la familia entera y no de este caso**: darle a
`DeleteReason` su tercer valor y hacer que `disconnect` pase por la función
compartida. Entonces los análisis se borran, la lápida no se escribe —porque el
motivo nuevo así lo dice— y los cerrojos del 14/09 cubren también este camino.

**El recuento, cuando el director ejecute las consultas 7-9 de**
`claude/SQL_sync_40_nuevos.sql`: cuántos análisis apuntan a ids muertos **con su
denominador**, si sus nombres coinciden con los recreados, y el control de que la
cascada de `document_chunks` sí funcionó.

**No se limpia nada aquí.**

## ⚠️ 5.30 · B.232 — una sincronización válida puede llevarse el corpus entero, sin tope y sin preguntar (15/09/2026)

`decidirSincronizacion` (`sync-guard.ts:126-130`) borra **exactamente lo que no
está en el listado**. Sin límite, sin proporción y sin confirmación.

Sus dos guardas contestan otras preguntas, y las contestan bien:

| guarda | qué pregunta | qué NO cubre |
|---|---|---|
| la del listado fallido | ¿**llegó** el listado? (B.138) | un listado que llega perfectamente |
| la del cambio de carpeta | ¿**cambió la carpeta**? (B.187) | sólo si el **cliente manda** un `folderId` distinto |

**Ninguna cubre «este listado es válido y se lleva tu corpus entero».**

⚠️ **Y LA PREGUNTA QUE DECIDÍA LA URGENCIA TIENE LA PEOR RESPUESTA POSIBLE: SÍ,
Y LA GUARDA ES CIEGA POR CONSTRUCCIÓN.**

`callback/route.ts:88` escribe **`folder_id: 'root'` siempre**, y el `upsert` va
por `org_id`. Así que **conectar una cuenta distinta no requiere desconectar** y
**deja el mismo `folder_id`**: `carpetaCambiada` compara `'root'` con `'root'` y
da falso. La siguiente sincronización lista la cuenta nueva, no encuentra ni uno
de los documentos viejos, y **los borra todos**.

Es decir: el identificador de carpeta es **simbólico e idéntico entre cuentas**,
así que el único freno que existe no puede ver el cambio que más daño hace.

**EL TAMAÑO, que era lo que se pedía — y son dos arreglos distintos:**

**(a) El tope, TRES SITIOS.** El criterio cabe en `decidirSincronizacion`, que es
una función pura con su batería —ahí es un estado nuevo de retorno, no una
rama—. Pero actuar sobre él no cabe ahí: la ruta tiene que devolver «esto
requiere confirmación» en vez de borrar, el cliente tiene que enseñar qué se va a
borrar (**cuáles**, no sólo cuántos), y la confirmación tiene que volver como
una bandera. Y el denominador hay que elegirlo: la proporción es **sobre los
documentos de ese proveedor**, no sobre el corpus entero.

**(b) Detectar el cambio de cuenta, UN SITIO — y es mejor arreglo.** La conexión
ya guarda `email`. Si al reconectar el correo no es el de antes, eso **es** un
cambio de origen, y basta con que la siguiente sincronización lo trate como
`carpeta_cambiada` —la guarda de B.187 ya existe y ya no borra nada en esa
pasada—. Cubre el caso que de verdad ocurre, reutiliza lo que hay y no necesita
ningún diálogo nuevo.

⚠️ **No son alternativas: (b) tapa la vía conocida y (a) tapa la clase.** El tope
sigue haciendo falta el día que alguien mueva la carpeta raíz en el proveedor.

## ✅ LA PUERTA, CERRADA EL 15/09/2026 — y la puerta no era la que parecía

**EL DIRECTOR OBJETÓ, Y TENÍA RAZÓN EN LA OBJECIÓN**: una cosa es que el
servidor acepte reescribir la conexión y otra que la interfaz deje llegar ahí.
Estando conectado **no hay ningún botón de conectar**:
`DocumentsSidebar.tsx:554` los pinta sólo bajo `!driveStatus.connected`.

⚠️ **PERO LA PUERTA EXISTÍA, Y NO ERA UN BOTÓN NI UNA URL:**

```ts
const [driveStatus, setDriveStatus] = useState({ connected: false });
const loadDriveStatus = async () => {
  const res = await fetch('/api/drive/sync', { credentials: 'include' });
  if (res.ok) { setDriveStatus(await res.json()); }   // ← y si no, se queda como estaba
};
```

**El estado arranca en «no conectado» y sólo se corrige si la llamada
responde.** Esa llamada puede devolver **503** cuando `resolveOrg` dice
`indisponible` —los Gateway Timeout de B.224, que están medidos—, 403 por el
chequeo de plan, 401 o 500. Cualquiera de ésas **deja los dos botones de
conectar pintados con la conexión viva**. Un clic, el flujo entero, el `upsert`
pisa la conexión, y la sincronización siguiente se lleva los documentos.

**Es la tercera vez esta semana con la misma forma: UN FALLO LEÍDO COMO UN
HECHO.** `resolveOrg` devolvía el mismo `null` para «no perteneces» y «la base no
contestó»; la barra lateral lee «no lo sé» como «no conectado». Distinto sitio,
misma confusión.

**LO QUE ENTRA: LA GUARDA EN EL SERVIDOR.** `drive/route.ts` se niega a redirigir
si ya hay conexión, con un error que **nombra la cuenta** y manda a desconectar.
Va en el servidor a propósito: **cierra las tres puertas a la vez** — el botón
fantasma, la URL escrita a mano y el botón de atrás del navegador.

Y manda a desconectar porque **es el único camino que ya avisa de lo que borra**
(«se eliminarán todos los documentos sincronizados»). Conectar encima no avisaba
de nada y borraba igual, un rato después y sin relacionarlo con el clic.

⚠️ **Y DENTRO DE LA GUARDA HAY UNA DECISIÓN QUE NO ES OBVIA: si la consulta de la
conexión FALLA, no se lee como «no hay conexión».** Leerlo así habría
reproducido el agujero exacto que viene a cerrar, y justo en el momento en que
aparece: cuando la base va mal. Falla **cerrada**, con 503 y `Retry-After`. El
coste es molestar a quien quería conectar mientras la base va mal; el del otro
lado es el corpus.

**11 casos, cuatro mutantes reales muertos**: leer el fallo como ausencia (2
casos), que la guarda deje pasar siempre (3), que el mensaje deje de nombrar
el borrado (1) y que pierda el nombre de la cuenta (1). Un quinto no llegó a mutar y se
dice, porque un mutante que no muta es un verde que no significa nada.

✅ **Y LO QUE SIGUE FUNCIONANDO, que es lo que el director hace de verdad**:
desconectar borra la fila de `drive_connections` (`disconnect:86`), así que
reconectar **la misma cuenta** después no encuentra fila y pasa. Es el primer
caso de la batería.

⚠️ **Y UNA CORRECCIÓN DE TAMAÑO QUE SE DEJA ESCRITA A PROPÓSITO: LLAMÉ «UN
SITIO» A (b) Y NO LO ERA.** Comparar el correo al reconectar y hacer que la
sincronización siguiente lo trate como carpeta cambiada **exige recordarlo entre
peticiones**: una columna nueva, la sincronización leyéndola y limpiándola. Eso
es **cambio de esquema más tres sitios**. La estimación se dio antes de mirar
dónde viviría el dato. **Queda aquí para que la próxima vez que alguien lea «es
un sitio» sepa que esa estimación ya falló una vez** — y la pregunta que la
habría cazado es dónde se guarda lo que hay que recordar.

## ✅ EJERCIDO EN PRODUCCIÓN EL 15/09/2026 — con su positivo y su negativo en la misma pasada

**EL RECHAZO**, copiado de la respuesta real:

```json
{"error":"Ya tienes OneDrive conectado (…@gmail.com). Solo puede haber una cuenta
conectada a la vez, así que conectar otra sustituiría ésta y la próxima
sincronización borraría los documentos que trajo. Si quieres cambiar de cuenta,
desconecta primero desde el panel de documentos.","errorType":"ya_conectado"}
```

**EL PASO**: desconectar → reconectar → sincronización automática → 40 documentos
de vuelta. **Sin cambios de comportamiento.**

⚠️ **Y LAS DOS MITADES JUNTAS SON LA EVIDENCIA, no sólo la primera.** Una guarda
ejercida sólo por su lado que rechaza es indistinguible de una que rechaza
siempre — que es exactamente el mutante que la batería mata. Aquí se vio que
**rechaza lo que debe rechazar Y deja pasar lo que debe dejar pasar**, en la misma
sesión y sobre la misma organización.

✅ **Y DE PASO QUEDA CERRADO UN PUNTO QUE ESTABA EN DUDA**: la sincronización **sí
corre sola al conectar**. Se dudaba de ello y ahora está visto.

**LO QUE SIGUE ABIERTO**: el tercer estado en `useDrive` —que «no lo sé» deje de
pintarse como «no conectado»— en su propio commit, y el tope de la
sincronización, que con esta guarda puesta **deja de ser lo urgente** pero sigue
haciendo falta el día que alguien mueva la carpeta raíz en el proveedor.

## ⚠️ 5.31 · B.234 — el veto por hash usa una tercera definición de «está en el corpus» (15/09/2026)

**MEDIDO EL 15/09/2026, y costó 60 créditos descubrirlo.** Dos análisis
exhaustivos lanzados desde el chat murieron en 294 ms y 76 ms con «duplicado
exacto»: el fichero subido a mano era idéntico a un documento que ya estaba en la
organización.

**EL MECANISMO, leído:** `hash-check.ts:70-72` consulta

```ts
.from('documents').select('id, name')
  .eq('org_id', orgId)
  .eq('content_hash', contentHash)
```

**Ningún filtro de estado.** Ve todo lo que existe en la organización —incluido
lo `pendiente`, que por definición **no participa en el corpus servible**—.

⚠️ **Y ÉSA ES LA TERCERA DEFINICIÓN DE LA MISMA PREGUNTA.** El 14/09 se unificaron
las dos que había —el filtro de Pinecone y el predicado de Supabase— en un solo
valor, precisamente porque cada una juraba ser la otra. **Ésta no se contó**: no
se parece a las otras dos, no menciona `analysisStatus`, y decide sobre la misma
pregunta con otra regla. El censo de aquel día enumeró quién LEE el criterio, no
quién contesta a la pregunta por su cuenta.

**Y no es una inconsistencia teórica: tiene consecuencia medida.** Un documento
que el chat no puede citar —porque está `pendiente`— sí basta para vetar un
análisis por duplicado. Las dos afirmaciones son contradictorias desde fuera:
«este documento no está en tu corpus» y «no analizo esto porque ya está en tu
corpus».

**Lo que hace que A6 sí funcionara**: desde la bandeja se pasa
`excludeDocumentId`, así que el propio documento no se cuenta como su duplicado.
**Desde el chat no hay a quién excluir** porque el documento aún no ha nacido.

⚠️ **CONSECUENCIA PARA LA MEDICIÓN, Y HAY QUE DECIRLA ENTERA: EL MONTAJE QUE
ESCRIBÍ ERA IMPOSIBLE DESDE EL PRINCIPIO.** Dije que bastaba con dejar OPE-14 en
`pendiente` para evitar que se comparase con su gemelo. **Es falso**: `pendiente`
evita que compita como candidato, pero **no** evita el veto por hash, que mira
antes y mira todo. A5 no se puede medir con un fichero que exista en la
organización **en ningún estado**.

**No se arregla aquí.** Y la decisión no es obvia: el veto existe para no cobrar
por analizar un duplicado exacto, y mirarlo todo es defendible. Lo que no es
defendible es que **la misma pregunta tenga tres respuestas** y que ninguna de
las tres lo sepa.

## ⚠️ 5.32 · B.235 — un trabajo cortado a los 76 ms se cobra como el más caro (15/09/2026)

**B.205 con población medida: 60 créditos.**

| trabajo | duró | clasificación | reembolso |
|---|---|---|---|
| `2eea9aa0` | 23,9 s, analizó de verdad | **light** | **10 devueltos** |
| `bbbaa108` | **294 ms**, cortado por el hash | **heavy** | **0** |
| `b9538096` | **76 ms**, cortado por el hash | **heavy** | **0** |

**LA CAUSA, verificada en los tres eslabones y no supuesta:**

1. El corte por duplicado sale por `buildExactDuplicateResponse`
   (`pipeline.ts:1150`), que devuelve **sin `estimatedCost`** — la clasificación
   se calcula 200 líneas más abajo (`:1362`), en el camino que no se recorre.
2. El trabajo llega al worker con ese campo **indefinido**.
3. `worker/src/index.ts:307` hace `const cost = estimatedCost ?? 'heavy'`.

⚠️ **«Heavy» es el valor por defecto de lo NO CLASIFICADO, no de lo caro.** Y
como `REFUND_BY_COST.heavy = 0`, el trabajo que menos hizo es el único que no
devuelve nada.

**LO QUE LO HACE PEOR QUE UN FALLO**: aquí no falló nada. El corte por hash
**funcionó** —evitó un análisis inútil en 76 ms, que es exactamente para lo que
existe— y el precio castigó el acierto. El usuario paga 30 créditos por que el
sistema le diga que no hacía falta gastarlos.

**Y la forma es conocida**: un valor por defecto que significa una cosa
(«no lo sé») leído como otra («lo más caro»). Es la familia de la semana con el
signo cambiado: aquí el desconocido no falla abierto, **factura**.

## 📏 EL PLANTEAMIENTO, CORREGIDO POR EL DIRECTOR — 15/09/2026

**Su objeción es mejor que mi ficha**: el problema no es cuánto se cobra por no
hacer nada, es **dejar pulsar algo que ya se sabe que no va a hacer nada**. El
rápido ya dijo «duplicado exacto» y costó 5 créditos; el botón del exhaustivo no
debería estar disponible. Es el criterio que la casa ya aplica: **botón apagado,
visible, con su motivo al lado**.

**LO MEDIDO PARA CONTESTARLE:**

**1 · Tres caminos al exhaustivo, y uno NO pasa por ningún rápido:**

| camino | ¿hay rápido antes? |
|---|---|
| «Reanalizar todo» del modal de Mejora (`useCrossDocAnalysis:128`) | **sí**, y el modal tiene el análisis delante |
| exhaustivo desde el chat (`useDocuments:343`) | **sí**, el de la subida |
| ⚠️ exhaustivo desde la bandeja (`useReviewAnalysis:79`) | **NO.** Se seleccionan documentos y se pulsa exhaustivo directamente |

El tercero pasa `documentoEnRevision`, así que el documento no es su propio
duplicado — **pero el veto sigue disparando si OTRO documento de la organización
tiene el mismo contenido**, que en un corpus con tarifarios parecidos no es
hipotético.

**2 · El cliente SÍ lo sabe, y eso abarata el arreglo.** El corte devuelve
`isDuplicate: true`, `duplicateOf`, `duplicateConfidence: 100` y
`recommendation: NO_INDEXAR` (`pipeline.ts:1086-1096`), y ese objeto es **el mismo
que la pantalla ya pinta**. No hay que subir ningún dato: el botón vive al lado de
la información que lo apagaría. La condición de hoy es
`{!isExhaustive && onExhaustive && …}` (`UploadActions.tsx:26`) y **no mira
`isDuplicate`**.

**3 · Y lo que se le enseña hoy NO es lo que el servidor encontró.**

| lo que dice el servidor | lo que ve el usuario |
|---|---|
| «Este documento es **idéntico** a X. No aporta información nueva» + `NO_INDEXAR` | **«Similar a X (100% confianza)»** |
| — | dentro de una sección **plegada por defecto** (`defaultOpen={false}`) |

⚠️ **Así que el dato «pulsó el exhaustivo igual» no significa lo que parecería.**
Para verlo había que desplegar una sección cerrada y leer «similar» donde el
servidor dijo «idéntico». **El botón no es lo único que falla**: el aviso está,
pero dicho más flojo de lo que el sistema sabe y guardado bajo un pliegue.

**4 · ¿HACE INNECESARIAS LAS OTRAS DOS? NO — son complementarias, y por una razón
medible, no de criterio**: apagar el botón cierra **dos de los tres caminos**. El
de la bandeja seguiría pudiendo gastar 30 créditos en un corte por hash.

⚠️ **Y SOBRE EL DEFECTO `?? 'heavy'`, LA TERCERA IDEA DEL ARQUITECTO NO ES
INVENTAR COMPLEJIDAD: ES LA REGLA DE LA CASA.** Hoy ese defecto **resuelve en
silencio una pregunta que no puede contestar**, y además borra la prueba de
haberlo hecho: `worker:310` imprime `coste heavy` **exactamente igual** para un
exhaustivo que de verdad fue pesado y para uno que terminó sin clasificar. **La
distinción se destruye antes de registrarse**, así que hoy no se puede saber ni
cuántas veces pasa.

**Por eso el orden que defiendo es: primero CONTARLO, después decidir el precio.**
Un trabajo que termina sin clase es una anomalía, y un límite declarado lleva su
contador. Con la cifra delante, la decisión del precio es trivial —si es raro, da
igual hacia dónde caiga; si es frecuente, el dato dice hacia dónde—. Decidir el
precio ahora sería elegir entre cobrar de más a quien acertó y cobrar de menos a
un camino caro, **sin saber cuál de los dos ocurre**.

## ✅ LAS DOS PIEZAS, ESCRITAS EL 15/09/2026 — y el precio NO cambia

**1 · LA PANTALLA DICE LO QUE EL SISTEMA SABE.** Donde el servidor dice
«idéntico», la pantalla decía «Similar a X (100% confianza)» **dentro de una
sección plegada por defecto**. Ahora, cuando el duplicado es exacto, el título es
«Duplicado exacto», el texto dice **IDÉNTICO** y añade la consecuencia
—«analizarlo nuevamente no va a encontrar nada»— y **sale abierto**.

⚠️ **El criterio exige las TRES señales** —marca de duplicado, confianza 100 y
`NO_INDEXAR`— y no sólo la confianza: un solapamiento del 100 % que sí aporta
información nueva **no es identidad**, y anunciarlo como tal sería este mismo
fallo con el signo cambiado, en la dirección que asusta.

**Y NO se apaga el botón del exhaustivo**, que era la otra salida: desde la
bandeja se analizan varios documentos a la vez y apagarlo por uno impediría
analizar los demás. Excluir ese documento del lote es otra pieza. Lo que esto
arregla es que, si alguien lo pulsa igual, **ya sea su decisión**.

**2 · «NO SE CLASIFICÓ» DEJA DE DISFRAZARSE DE «PESADO».** El precio **no cambia**:
`heavy` sigue siendo el defecto y sigue sin reembolso. Lo que cambia es que queda
**registrado y PERSISTIDO** como lo que es.

⚠️ **DÓNDE VIVE EL CONTADOR, que era la pregunta: en**
`analysis_results.pipeline_counters`, **un `jsonb` que YA existe (F-82) y que se
persiste en cada análisis. NO HACE FALTA NINGÚN SQL.** Se lee así:

```sql
select count(*) from analysis_results
where pipeline_counters ? 'averia.exhaustivo_sin_clasificar';
```

**Y persistido es justamente la diferencia entre un contador y una nota**: un
número que sólo vive en los registros de Vercel es lo mismo que no tenerlo,
porque quien decide el precio no entra ahí.

La clave **estrena la etapa `averia`**, que estaba declarada y vacía desde que se
escribió el catálogo: ahí no se mide lo que el análisis encontró, sino **que el
propio sistema no supo algo de sí mismo**.

⚠️ **Y «sin clasificar» se define UNA VEZ** (`clase-de-coste.ts`), porque si no
serían dos: el defecto lo aplica el worker y el contador lo escribe quien guarda
el análisis. Dos sitios contestando «¿está clasificado?» por su cuenta se separan
el día que aparezca una clase nueva, y los dos seguirían pareciendo correctos.

**11 casos, cuatro mutantes muertos**: el criterio flojo —sólo la confianza— mata
2; «nunca es exacto», 1; perder la distinción entre declarada y cobrada —el
código de ayer—, 3; y que una cadena inventada pase por clase, 1. Ese último no es
celo: pasaría a `REFUND_BY_COST`, devolvería `undefined` y acabaría en cero por
otro camino, **sin que nadie contara nada**.

✅ **Y una batería ajena hizo su trabajo**: el catálogo de contadores exige
declarar cada clave a mano en su test, así que añadirla puso la suite en rojo
hasta que se declaró. Es el cerrojo funcionando, no un estorbo.

**LO QUE QUEDA, con su condición**: dentro de un tiempo se mira esa cifra y se
decide el precio **con ella delante**. Si es rara, da igual hacia dónde caiga; si
es frecuente, el dato dice hacia dónde. Y la otra pieza que no entró: **excluir
del lote** el documento que ya se sabe duplicado, que es lo que cerraría el camino
de la bandeja.

**No se decide el precio aquí.**

## ⚠️ 5.35 · B.238 — del análisis de estilo se guarda el número y se tira el contenido (15/09/2026)

**MEDIDO AL INTENTAR USARLO.** El 15/09/2026 dos pasadas de estilo sobre el mismo
documento dieron **7 y 8**, y la pregunta obvia —*¿cuál falta en la de 7?*— **no
tiene respuesta**.

`saveStyleResult` (`persist-analysis.ts:130-148`) inserta `style_problems_found:
input.problemsCount` **y nada más**: la columna `analysis` se queda a NULL. **Los
problemas concretos —su tipo, su texto, dónde estaban— no se guardan en ningún
sitio.** Viven en la respuesta HTTP y en la pantalla, y desaparecen al cerrarla.

⚠️ **ASÍ QUE UNA DISCREPANCIA DE UNO ES IRRESOLUBLE DESPUÉS.** No es que cueste
averiguarlo: **no hay dónde mirar**. Y no es un caso raro —es la pregunta natural
en cuanto dos pasadas no coinciden—.

**Y NO ES SIMÉTRICO CON EL ANÁLISIS DE CORPUS**, que sí guarda su detalle en
`analysis` y sus cifras en `pipeline_counters`. Del estilo se guarda **un entero**.
Un número sin su contenido se puede sumar, pero **no se puede comprobar**: nadie
puede volver y ver si aquellos 8 eran los 8 buenos.

⚠️ **Y HAY UNA CONSECUENCIA QUE VA MÁS ALLÁ DE MEDIR: el usuario tampoco puede
volver a ellos.** Un análisis de estilo cuesta 2 créditos y, cerrada la pantalla,
lo pagado ya no existe — sólo queda un número en una tabla que nadie enseña.

**El tamaño**: la columna `analysis` ya existe y el resto de análisis la usan.
Es pasar los problemas a `saveStyleResult` y escribirlos — **un tipo y una
línea**, sin esquema nuevo. Lo que hay que decidir es si se guardan enteros o
sólo lo que se pueda releer sin datos del cliente de más.

## ✅ ARREGLADA EL 16/09/2026 — y sí guarda contenido, dicho antes de hacerlo

Los problemas se persisten en `analysis`: **qué problema es, de qué tipo, y a qué
parte del texto apunta.**

⚠️ **SÍ ES CONTENIDO DEL DOCUMENTO, y se dijo antes de escribirlo**: `textRef` es
una **cita literal** —por diseño, es lo que localiza el problema en el editor— y
`title` y `description` suelen citarla.

✅ **Lo que lo hace aceptable no es que sea poco, es que no es nuevo**:
`documents.full_text` (`supabase-setup.sql:295`) **ya guarda el documento**
**entero**, en esta misma base y de esta misma organización. Negarse a guardar una
cita de sesenta caracteres mientras se guarda el texto completo sería una
distinción sin diferencia.

⚠️ **Y lo que se mantuvo fuera por esa misma razón**: las etiquetas de
`tiposDescartados` siguen sin contenido, porque son **telemetría** —una clave que
se agrega entre organizaciones— y ahí la regla es la contraria.

**Se escribe siempre el objeto, también con las listas vacías**, por lo mismo que
los ceros de B.239: un hueco significaría a la vez «no hubo problemas» y «esta
fila es anterior al cambio».

**LAS DOS MITADES QUE CIERRA:**

| | |
|---|---|
| **medir** | dos pasadas con cifras distintas ya se pueden comparar. Era lo único que detenía el punto 2 del criterio de salida — y lo detenía **el instrumento**, no los créditos |
| **el usuario** | puede volver a ver lo que pagó. Cerrada la pantalla, de 2 créditos quedaba un entero en una tabla que nadie enseña |

⚠️ **SIN BATERÍA NUEVA, y se dice por qué**: no hay arnés para `persist-analysis`
—es un `insert`— y montarlo para esto sería mayor que el cambio. Lo cubren el
typecheck y la lectura. **Queda declarado, no escondido.**

**El tamaño**: la columna `analysis` ya existe y el resto de análisis la usan.**No se arregla aquí.**

## ⚠️ 5.33 · B.236 — el análisis de estilo pierde el final de los documentos largos, en silencio (15/09/2026)

`style-check.ts:83` mete en el prompt `${text.slice(0, 20000)}`.

**Literal desnudo: sin constante, sin comentario y sin contador.** Todo lo que
pase de 20.000 caracteres **no llega al modelo**, y el usuario recibe «N
problemas de estilo» sin saber que la N es sobre una parte del documento.

⚠️ **ES UN LÍMITE SIN VIGILANTE, Y ES LA MISMA FAMILIA QUE EL TOPE DE CONTEXTO
QUE SE BORRÓ AYER SIN QUE NADIE SE ENTERARA.** Allí el acumulador desapareció y
ni el compilador ni 961 pruebas dijeron nada; aquí el número está escrito, pero
nadie cuenta cuántas veces muerde. Las dos formas del mismo descuido: **un límite
que decide algo y no tiene quien avise el día que ocurra.**

**Y no es sólo que falte el contador: falta el aviso al usuario.** Un análisis de
estilo sobre el 40 % de un documento no es un análisis de estilo del documento —
y hoy se presenta igual que uno completo.

**LO QUE LO ACOTA: NO SE SABE, y por eso hay SQL.** `claude/SQL_B236_limite_estilo.sql`
lo contesta con denominador —cuántos de cuántos—, con cuántos caracteres se pierde
cada uno, y con la distribución por tramos, que es lo que distingue **un borde**
—casi todos muy por debajo— de **un muro** —un grupo rondando los 20.000, donde
cualquier crecimiento normal los cruza sin que nadie lo note—.

**No se arregla aquí.** El tamaño se ve: la constante con nombre y su contador es
pequeño; **avisar al usuario de que su documento se analizó a medias es lo que de
verdad cuesta**, porque el aviso tiene que llegar hasta la pantalla.

## ⚠️ 5.34 · B.237 — tres puertas que devuelven «cero problemas» cuando no se ha mirado nada (15/09/2026)

⚠️ **ESTO ES LO QUE EL PRODUCTO VENDE, DICHO AL REVÉS: «tu texto está bien»
cuando nadie lo ha mirado.** Se escribe ANTES de medir A7/A8, porque es la razón
de que esa medición necesite siembra.

| # | dónde | qué pasa | ¿cobra? |
|---|---|---|---|
| 1 | `analyze-style:52` cobra, `:67` comprueba el texto | un texto de menos de 50 caracteres devuelve **400 y NO devuelve el crédito** — `devolverSiNoSeEntrego` existe en el fichero pero **sólo en el `catch`**, y ese 400 es un `return` | **sí, 2** |
| 2 | `style-check.ts:112-113` | si la llamada al modelo falla, `analyzeStyle` **devuelve `[]`** — y la ruta contesta **`success: true`** | **sí** |
| 3 | `useStyleAnalysis.ts:88-90` | `if (!res.ok) return []` — un **402**, un **429** o un **400** llegan a la pantalla como **«0 problemas de estilo»** | según cuál |

**Son tres niveles, y ninguno distingue «no hay problemas» de «no pude mirar».**
La segunda es la peor: **el servidor afirma que fue bien**.

⚠️ **Y es exactamente la regla del cero de la casa, en el sitio donde más duele:**
un cero sólo vale si el sistema puede demostrar que buscó. Aquí no puede, por tres
caminos distintos.

**EL TAMAÑO DE DISTINGUIR «CERO» DE «NO PUDE MIRAR», que es lo que se preguntaba:**

| pieza | dónde | cuánto |
|---|---|---|
| **el crédito del texto corto** | mover la comprobación de longitud **antes** del cobro | **una línea movida**, y es la más barata de las tres |
| **el fallo del modelo** | `analyzeStyle` devuelve `[]` y pierde el fallo. `recordStageFailure` YA lo registra, así que el dato existe: hay que **subirlo en el tipo de retorno** —problemas **más** si se pudo mirar— y que la ruta lo pase | **un tipo, la ruta y el cliente**: tres sitios, y es el arreglo de verdad |
| **el cliente que traga** | `if (!res.ok) return []` pasa a distinguir «no hay» de «no se pudo» | **un sitio**, pero **no sirve solo**: sin la pieza anterior, el cliente seguiría recibiendo `success: true` con lista vacía |

⚠️ **Y NO SE ARREGLA LA TERCERA SIN LA SEGUNDA.** Es la trampa de esta ficha:
parece que la barata —el cliente— resuelve el caso visible, y no lo hace, porque
el caso peor llega con `success: true`. **La primera sí es independiente** y es la
única que además devuelve dinero.

**No se arregla aquí.**

## ⚠️ 5.36 · B.239 — el detector ve una ambigüedad con consecuencia clínica UNAS VECES SÍ Y OTRAS NO (15/09/2026)

## 📏 CON CIFRA, 16/09/2026 — y son DOS, no un detector entero

**Catorce pasadas con temperatura 0**, nueve por el chat y cinco por la bandeja:

| hallazgo | sale en | familia |
|---|---|---|
| «Frase confusa sobre **ayunas**» (A1) | **4 de 14** — y **con dos tipos distintos** | ambigüedad |
| «En el caso de que se dé el caso» (S2) | **11 de 14** | sugerencia |
| los otros siete detectados | **14 de 14** | ortografía y redundancia literal |

⚠️ **EL TITULAR SIGUE SIENDO VERDAD Y AHORA ESTÁ ACOTADO: no es que el detector
sea no determinista — son DOS hallazgos concretos**, y los dos de la familia que
exige **juicio**. Lo que se decide por una regla léxica no se mueve **ni una vez**
en catorce.

**Y el 4 de 14 es la cifra que importa para el producto**: una ambigüedad con
consecuencia clínica que aparece **menos de una vez de cada tres**. Declararla
como límite sería honesto; enseñarla como cobertura, no.

⚠️ **Y los DOS TIPOS del mismo hallazgo apuntan a dónde está la duda**: el modelo
no duda de que ahí hay algo — duda de **cómo llamarlo**. Es la misma separación
que ya se vio con `prescipción`: **la detección es una pregunta y la clasificación
es otra**, y aquí las dos fallan en el mismo sitio y por distinto motivo.

⚠️⚠️ **ESTA FICHA SE ABRIÓ CON UNA PREMISA FALSA Y SE CORRIGE EL MISMO DÍA, ANTES
DE ARREGLAR NADA SOBRE ELLA.**

**Decía: «no se detecta».** Con una sola pasada delante, y esa pasada no lo
traía. **Es falso**: en las pasadas de la noche del 15/09, la lista de 8 **SÍ**
incluye «Frase confusa sobre ayunas» y la de 7 no. **A1 se detecta —a veces—.**

**Y eso cambia el hallazgo, no lo cancela:** un revisor que ve un error en una
pasada y no en la siguiente es, para quien lo usa, **peor que uno que no lo ve
nunca** — porque el que no lo ve nunca se puede declarar; éste da una falsa
sensación de cobertura que cambia con cada ejecución.

⚠️ **Y ARRASTRA TODO LO QUE ESTA FICHA RAZONABA DEBAJO**: si el detector es no
determinista **con los errores que sí ve**, entonces **la ausencia de A1 en una
pasada nunca fue evidencia de nada**, y las dos causas que se investigaron —el
filtro por tipo y el truncamiento— se investigaron sobre un hecho que no estaba
establecido. **No eran malas hipótesis: eran respuestas a una pregunta mal
hecha.** Lo escrito sobre ellas se conserva porque sigue siendo cierto sobre el
código; lo que se retira es que explicaran esto.

**LO QUE SÍ QUEDA, y es lo que hay que medir ahora**: **con qué frecuencia** sale
cada error sembrado. Eso no se mide con recuentos —hoy sólo se guarda el número—
sino con **qué** encuentra cada pasada, que es B.238.

✅ **Y UNA OBSERVACIÓN QUE CUENTA A FAVOR, del director**: por la mañana el modelo
dijo que a `prescipción` le faltaba una «s»; por la noche dice que le falta una
«r», que es lo correcto. **La DETECCIÓN es estable; la EXPLICACIÓN no.** Son dos
propiedades distintas y conviene no confundirlas: el error se encuentra siempre,
y lo que varía es cómo se cuenta — que es menos grave, pero llega igual al
usuario.

## ¿LO EXPLICA `temperature: 0.2`?

**Lo hace esperable, y no se puede decir más que eso sin medirlo.** 0,2 es bajo
pero no es cero: el modelo muestrea, y en una tarea que decide **cuántos**
elementos emitir, los candidatos que están cerca del umbral entran o no entran
según la muestra. Un rango de 7 a 9 sobre diez sembrados es **compatible** con
eso.

⚠️ **Lo que NO se puede afirmar es que 0,2 lo explique del todo**, porque nadie ha
medido la dispersión a otra temperatura. **La prueba barata existe y no es una
tanda**: poner `temperature: 0` y repetir. Si la dispersión no baja, no es la
temperatura y hay que mirar otra cosa. *(Y ni siquiera con 0 se garantiza
determinismo, así que el resultado sería «baja mucho» o «no baja», no «es
determinista».)*

**No se cambia la temperatura aquí.**

**MEDIDO CON SIEMBRA DECLARADA, en A7 y A8, y reproducido en varias pasadas.** La
frase sembrada como `A1`:

> «El paciente debe acudir en ayunas si la intervención es por la mañana o por la
> tarde deberá comer ligero.»

Sin puntuación entre las dos ramas, **se lee de dos maneras opuestas** — y lo que
está en juego es si el paciente come antes de una intervención. **No se detecta.**

⚠️ **ERA EL QUE MÁS CONFIANZA DABA.** El registro de siembra, escrito antes de
medir, decía: *«Es el caso de manual de ambigüedad, y con consecuencia clínica.
**Debería salir**»*. Los otros dos de su tipo iban marcados discutibles; éste no.

**Y no es sobre la tanda: es sobre el producto.** Un revisor de documentación
clínica que no ve esta frase deja pasar exactamente la clase de error que hace
peligrosa una instrucción a un paciente.

## QUÉ SE PUEDE SABER SIN GASTAR NADA MÁS

**Hay DOS mecanismos que podrían explicarlo, los dos verificables leyendo, y
NINGUNO de los dos deja rastro. Ésa es la mitad accionable de esta ficha.**

**1 · El filtro por tipo descarta en silencio.** `style-check.ts:96` hace
un `filter` que exige que el `type` sea uno de los tres válidos.
**Si el modelo devolvió A1 con un tipo fuera de la lista** —`puntuacion`,
`gramatica`, `claridad`— **el código lo tira sin contarlo**. Y una ambigüedad de
puntuación es justo la que un modelo etiquetaría como `puntuacion`.

**2 · La respuesta puede venir truncada.** `maxOutputTokens: 3072` (`:91`), y la
casa repara el JSON truncado — reparar un array cortado significa **quedarse sin
sus últimos elementos**. Con diez problemas y sus descripciones, el tope no es
holgado.

⚠️ **Y NO SE PUEDE SABER CUÁL DE LOS DOS FUE, porque `parsed.problems` NUNCA SE
CUENTA CONTRA `problems`.** El código filtra y no compara: no hay una sola línea
que diga cuántos devolvió el modelo frente a cuántos sobrevivieron. **Un filtro
sin contador es un límite sin vigilante**, y es el mismo patrón que B.236 y que el
tope de contexto.

**LO QUE COSTARÍA HACERLO SABIBLE: nada de ejecutar.** Una línea que registre
`parsed.problems.length` frente a `problems.length` y los tipos descartados, y un
contador en la etapa `averia`, que ya existe y ya se persiste en
`pipeline_counters`. **Con eso, la siguiente pasada lo contesta sola** — y si los
dos números coinciden, entonces el modelo simplemente no lo vio, que es otra
conversación y también un dato.

## ✅ HECHO SABIBLE EL 15/09/2026 — primero saber, después decidir

**No se arregla el filtro, ni el catálogo de tipos, ni la temperatura.** Lo que
entra es que **lo descartado deje rastro**, y que los dos candidatos se puedan
separar.

**DOS CONTADORES Y NO UNO, y ésa es toda la gracia:**

| clave | qué significa | a qué causa apunta |
|---|---|---|
| `averia.estilo_descartado_por_tipo` | el modelo etiquetó con un tipo que no reconocemos | **catálogo incompleto** — el arreglo sería añadir el tipo, no tocar el filtro |
| `averia.estilo_descartado_sin_ancla` | llegó sin `textRef` utilizable | **respuesta truncada** — es la forma que deja `maxOutputTokens` cuando el cliente repara el JSON cortado |

Un solo contador los habría sumado y no se podría elegir entre las dos causas,
que era exactamente el problema.

**Y LAS ETIQUETAS DESCARTADAS SE GUARDAN, que es la mitad que decide el arreglo.**
Van en `analysis` —datos— y **no en una clave de contador**: una etiqueta
inventada por el modelo no tiene vocabulario cerrado y haría el campo
inagregable, que es la misma razón por la que el reparto por columna no está en
el catálogo.

⚠️ **Y NUNCA VIAJA TEXTO DEL DOCUMENTO: sólo la etiqueta, recortada a 40
caracteres.** Ni `textRef`, ni `title`, ni `description`. Hay un caso de la
batería que lo comprueba sobre una entrada que lleva las tres cosas.

**Todo persistido en columnas que YA existen** —`pipeline_counters` (F-82) y
`analysis`—, así que **no hace falta ningún SQL**. Este análisis dejaba las dos a
null.

⚠️ **ESTO NO CIERRA B.238**: los problemas concretos siguen sin guardarse. Lo que
se guarda es **por qué se cayeron algunos**, que es otra pregunta.

⚠️ **Y NO CIERRA B.237**: un fallo del modelo sigue devolviendo lista vacía con
`success: true`. **Hoy deja rastro lo DESCARTADO, no lo no-mirado**, y hay un caso
de la batería que lo dice con esas palabras para que nadie lo lea de más.

**10 casos, tres mutantes muertos**: juntar los dos contadores en uno mata 3;
**devolver el silencio de esta mañana mata 6**; y hacer que viaje el texto del
documento junto a la etiqueta, 4.

✅ **Y DOS BATERÍAS AJENAS HICIERON SU TRABAJO**: el catálogo de contadores exigió
declarar las dos claves a mano, y `corpus-del-harness` se negó a pasar hasta que
CLI-20 quedó declarado en uno de sus cuatro grupos. **Las dos pusieron la suite en
rojo hasta que se declaró lo que se estaba añadiendo**, que es para lo que están.

## CÓMO SE LEE, CUANDO EL DIRECTOR REPITA LA PASADA

Una pasada de estilo sobre CLI-20 (**2 créditos**) y luego:

```sql
select created_at,
       style_problems_found                                        as encontrados,
       pipeline_counters ->> 'averia.estilo_descartado_por_tipo'   as descartados_por_tipo,
       pipeline_counters ->> 'averia.estilo_descartado_sin_ancla'  as descartados_sin_ancla,
       analysis ->> 'tiposDescartados'                             as etiquetas_descartadas
from analysis_results
where analysis_type = 'style' and document_name like 'CLI-20%'
order by created_at desc limit 5;
```

**Las tres lecturas, escritas antes de verlo:**

| resultado | qué significa |
|---|---|
| `descartados_por_tipo > 0` y una etiqueta como `puntuacion` | ⚠️ **fue el código**: el catálogo de tipos está incompleto y A1 se cayó por ahí. El arreglo cambia de sitio |
| `descartados_sin_ancla > 0` | ⚠️ **fue el truncamiento**: la respuesta no cabía y perdió su cola. El arreglo es el tope, no el filtro |
| **las dos columnas vacías** | **no fue el código**: el modelo devolvió 8 y ninguno se descartó, así que **simplemente no vio A1**. Es otra conversación — y también un dato |

## ⚠️ EL CONTADOR NO CONTESTA — Y EL FALLO ES DEL CONTADOR, 15/09/2026

**MEDIDO**: cinco pasadas de estilo sobre CLI-20, todas con **8 encontrados** y
las tres columnas nuevas a **`null`**. Ninguna de las tres lecturas escritas
encaja, y la razón es que **el contador no puede contestar**.

**LA CAUSA, y es mía:** `persist-analysis.ts:149` escribe

```ts
pipeline_counters: input.contadores && Object.keys(input.contadores).length > 0
  ? input.contadores
  : null,
```

y `style-check.ts` sólo mete una clave **si su recuento es mayor que cero**. Así
que **una pasada que no descarta nada escribe `null`, no un cero.**

⚠️ **ES LA REGLA DE LA CASA INCUMPLIDA POR EL CONTADOR QUE VENÍA A SERVIRLA.**
Esta misma mañana se escribió que el `null` de los trabajos cortados por hash era
**correcto y distinto de un cero** —«no lo miré» frente a «lo miré y no había»—.
Aquí pasa lo contrario: **un cero que no se escribe no se puede leer como
confirmación**, y el hueco significa las dos cosas a la vez.

⚠️ **Y LO PEOR NO ES QUE NO CONTESTE: ES QUE ESCONDE EL DIAGNÓSTICO DE SÍ MISMO.**
Con la clave escrita siempre, la fila de después del despliegue diría `0` y se
sabría **al instante** si el cambio había llegado. Sin ella, **una pasada
posterior sin descartes y una pasada anterior al cambio son idénticas**. El
defecto tapa la pregunta de si el defecto está desplegado.

**LAS OTRAS DOS, contestadas:**

| candidata | veredicto |
|---|---|
| **el despliegue no había llegado** | ⚠️ **NO SE PUEDE DESCARTAR, y precisamente por lo de arriba.** El commit es de las **17:25:01 +02:00** y la fila dice **16:00:32** — si la base muestra UTC son las 18:00 locales y fue **después**; si muestra local, fue **antes**. **No se adivina**: se resuelve con una consulta |
| **`pipeline_counters` no se guarda para `style`** | ✅ **DESCARTADA.** Sí se guarda: la columna está en el `insert` de `saveStyleResult` (`:149`), en la misma fila que `style_problems_found`, que sí llegó |

**EL TAMAÑO DE ARREGLARLO**: que `style-check.ts` ponga **siempre las dos claves**
—con cero cuando no hay descarte— y que `saveStyleResult` deje de convertir el
objeto vacío en `null`. **Dos líneas**, más los casos de la batería que hoy
afirman `contadores === {}` en el camino limpio, que pasarían a afirmar los dos
ceros. **Sin SQL.**

⚠️ **Y la pregunta que queda para cuando se arregle, que es la del método**: si
las dos claves salen a **0** y los descartes son realmente cero, entonces **el
modelo no vio A1** — y eso deja de ser una hipótesis sobre el código para pasar a
ser una sobre el detector.

⚠️ **Lo que NO se puede hacer es decidirlo ahora**: escribir «el modelo no lo ve»
sin haber mirado si el código se lo comió sería exactamente la clase de
afirmación que esta casa no admite.

**No se arregla aquí.**

## ⚠️ 5.37 · B.240 — `temperature: 0` no estrecha la dispersión: se ensancha (16/09/2026)

**MEDIDO**: más de diez pasadas sobre CLI-20, contando **sólo estilo**.

| puerta | problemas |
|---|---|
| chat | 7 · 9 · 8 |
| bandeja | 8 · 9 · 9 · 10 |

**Rango 7–10.** Con `temperature: 0.2` era 7–9. **No se estrechó: se ensanchó.**

⚠️ **Era la lectura declarada como «el hallazgo mayor» antes de medir, y es la
que salió.** Queda escrito así porque la predicción contraria —«8, con dispersión
0 o ±1»— se escribió el mismo día y está fallada.

**Y NO ES RUIDO UNIFORME, que es lo que lo hace investigable:**

| siempre salen | intermitentes |
|---|---|
| los cuatro de ortografía, el párrafo duplicado, «totalmente y completamente» | «Frase confusa sobre ayunas» y «En el caso de que se dé el caso» |

**Los que bailan son de la familia ambigüedad/sugerencia.** Los de ortografía no
se mueven.

## DE DÓNDE PUEDE VENIR — enumerado por capacidad, no por nombre

La pregunta no es «¿qué falla?» sino **«qué puede diferir entre dos llamadas»**.
El prompt tiene **exactamente dos variables** (`style-check.ts:140-151`):
`fileName` y `text`. Nada más — ni fecha, ni azar, ni nada del corpus.

| candidato | estado |
|---|---|
| **el modelo** | ✅ **DESCARTADO**: `HAIKU_MODEL` está clavado a una instantánea (`claude-haiku-4-5-20251001`), no es un alias que el proveedor pueda mover |
| **el corpus / el reloj** | ✅ **DESCARTADO**: el prompt no los toca. `analyzeStyle` no importa Supabase ni vectores |
| **el `fileName`** | ⚠️ **VIVO** — entra literal en el prompt y **puede diferir entre puertas**. La consulta 2 lo dice: si las dos mandan el mismo nombre, cae |
| **el `text`** | ⚠️ **VIVO Y NO COMPROBABLE DEL TODO** (ver abajo) |
| **el reintento del cliente** | ⚠️ **VIVO**: si el primer JSON no parsea, `anthropic-client.ts:349` **vuelve a llamar** — y esa segunda llamada es **una muestra nueva**. Mismo prompt y misma temperatura, pero otra generación |
| **el recorte de salida** | ⚠️ **VIVO Y AHORA MEDIBLE**: con `maxOutputTokens: 3072`, una respuesta larga se repara perdiendo su cola — y **la cola es justo donde caen los últimos tipos**. `averia.estilo_descartado_sin_ancla` lo dice |
| **el proveedor con `temperature: 0`** | ⚠️ **VIVO, y es la explicación cómoda: NO SE DA POR BUENA.** Cero no garantiza decodificación voraz, pero **eso no lo hemos medido** y decirlo sería exactamente la clase de afirmación que esta casa no admite |

## ⚠️ LO QUE NO SE PUEDE COMPROBAR CONTRA LA BASE, Y HAY QUE DECIRLO

**No se guarda el texto que se envió**, así que «¿llegó el mismo texto en todas
las pasadas?» **no tiene respuesta directa**. Lo que hay es un **indicio**: los
`textRef` son citas literales, así que si todas las pasadas anclan en los mismos
fragmentos, el texto contenía lo mismo **en las partes citadas**. No es prueba.

**Lo que lo cerraría**: guardar el **hash** del texto enviado junto al análisis —
sin contenido nuevo, porque es un hash—. Entonces «mismo texto» dejaría de ser
una suposición. **No se escribe aquí.**

## SOBRE SI EL 0 LLEGÓ A LA LLAMADA

⚠️ **La objeción es correcta: el test-candado prueba el código, no la llamada.**
Lo que se puede afirmar leyendo: `style-check.ts:157` pasa la constante, y
`anthropic-client.ts:88` la mete en el `payload` sin tocarla; el reintento usa
`adjustedOpts`, **las mismas opciones**. No hay ninguna línea que la reescriba.

✅ **Y hay una marca de despliegue que no depende de las horas**: el mismo commit
`8af33ffa` trae el cambio de temperatura **y** el guardado de problemas. **Una
fila con `analysis.problemas` poblado es, necesariamente, una pasada con
temperatura 0.** La consulta 1 lo enseña en una columna.

⚠️ **Lo que seguiría sin estar probado es que el proveedor la respete**, y eso no
se prueba desde aquí — haría falta registrar el `payload` enviado.

## LA CONSECUENCIA QUE HAY QUE ESCRIBIR

⚠️ **MEDIR A7/A8 POR CONJUNTOS QUEDA DETENIDO MIENTRAS ESTO SIGA.** No se pueden
comparar dos puertas cuyo resultado **varía dentro de sí mismo**: una diferencia
entre A7 y A8 sería indistinguible de la dispersión de cada una.

**Y con ello, el punto 2 del criterio de salida** —la puerta principal medida por
sus dos entradas, misma cifra— **no se puede cerrar por este camino hoy.** No por
falta de créditos ni de plan: porque **el instrumento no repite**.

## 📏 CATORCE PASADAS CON TEMPERATURA 0 — el diagnóstico se estrecha (16/09/2026)

**Nueve por el chat, cinco por la bandeja.** Y lo medido cambia la ficha:

| | |
|---|---|
| **siete de diez** salen en **las catorce** | los cuatro de ortografía, el párrafo duplicado, «totalmente y completamente» y el plazo de 24 h |
| **«En el caso de que se dé el caso»** | **11 de 14** |
| **«Frase confusa sobre ayunas»** | **4 de 14**, y **con dos tipos distintos** |
| **A2** | **0 de 14** — predicho fallado el 15/09, y sigue |

⚠️ **NO ES «EL DETECTOR ES NO DETERMINISTA»: SON DOS HALLAZGOS CONCRETOS.** Y los
dos son de la familia que exige **juicio** —ambigüedad y redundancia—, no de la
que se decide por una regla léxica. **La ortografía no se mueve nunca.**

## ✅ DOS CANDIDATOS DESCARTADOS CON CIFRA

`averia.estilo_descartado_por_tipo` y `..._sin_ancla` salen **0, no `null`**, en
todas las pasadas. **El contador funciona y no había nada que descartar**, así que
**el filtro por tipo y el truncamiento quedan fuera** — los dos, y medidos, no
razonados.

## ⚠️ LA ELIMINACIÓN QUE DECIDE, Y SALE DE LOS PROPIOS DATOS

**Las cinco pasadas de la bandeja varían entre 8 y 10 con una entrada que es
DEMOSTRABLEMENTE IDÉNTICA**: por ese camino el texto sale de `full_text`, una
columna que no cambia, y el `fileName` es el mismo nombre de documento.

**Por tanto la entrada no es la causa.** Se cae el candidato del texto y se cae el
del `fileName` —que además el reparto por puertas ya desmentía—.

**QUEDAN DOS, y sólo uno explica el patrón:**

| candidato | ¿explica que varíen ÉSOS dos y no los otros siete? |
|---|---|
| **el reintento** (`anthropic-client.ts:349` vuelve a llamar si el JSON no parsea, y eso es una muestra nueva) | **NO.** Una muestra nueva variaría en **cualquiera**, no en los mismos dos. El argumento del arquitecto es correcto |
| **el proveedor con `temperature: 0`** | ⚠️ **SÍ, y el patrón cuenta A FAVOR y no en contra.** La variación cerca de cero se concentra en las decisiones **empatadas**: un empate se resuelve distinto de una ejecución a otra, y un hecho léxico —una errata— no está empatado. **Que sólo bailen los dos que exigen juicio es exactamente la forma que tendría** |

⚠️ **Y AUN ASÍ NO SE DA POR BUENA.** «Los modelos son así» sigue siendo la
explicación cómoda, y ahora es además la única que queda — que es justo cuando hay
que desconfiar de ella. **Lo que se puede afirmar es que es el único candidato
vivo, no que sea la causa.**

## QUÉ SE PUEDE SABER SIN GASTAR, Y QUÉ CERRARÍA ESTO

**Gratis, y cierra lo único separable que queda:** `anthropic-client.ts:344`
imprime `[callAnthropicJson] Parse failed, retrying` cuando el reintento se
dispara. **Si esa línea no aparece en ninguna de las catorce pasadas, el
reintento nunca corrió** y queda descartado sin gastar un crédito. Hoy nadie lo ha
mirado.

⚠️ **Y lo que NO se puede cerrar desde aquí**: que el proveedor respete el 0. Para
eso haría falta **mandar la misma petición dos veces dentro de una pasada y
comparar** — lo que aísla al proveedor de todo lo demás, y cuesta el doble por
pasada.

## ⚠️ EL PUNTO CIEGO DE AGRUPAR POR `textRef`

**La consulta 4 parte `a sido` en dos anclas** —«la fecha en la que a sido
subsanada» (9) y «la fecha en la que a sido» (5)— y **nueve más cinco son
catorce**. Es el mismo error: **el modelo decide dónde corta la cita.**

**La cita es mejor identidad que el título —que el modelo reescribe entero— pero
tampoco es estable.** Lo estable es **dónde está en el documento**: dos citas que
se solapan en el texto son el mismo hallazgo.

**El coste de tenerlo**: calcular el desplazamiento en el momento del análisis
—`text.indexOf(textRef)`— y guardarlo junto al problema. Es **un número por
problema**, sin contenido nuevo, en una columna que ya se escribe.

⚠️ **Y SALDRÍAN DOS COSAS DE UNA, porque hoy NADIE COMPRUEBA QUE LA CITA EXISTA
EN EL TEXTO.** El prompt lo exige —«copia LITERAL, carácter por carácter»— y el
filtro sólo mira que no esté vacía (`style-check.ts:185`). **Una cita
parafraseada pasa el filtro, se guarda, y el editor no puede localizarla**: el
usuario ve un problema que no sabe dónde está. Buscar el desplazamiento **es**
comprobar que existe.

## 📏 16/09/2026 · EL CONTRASTE CORPUS/ESTILO, RESUELTO — y era una lectura corta

⚠️ **«El análisis de corpus repite y el de estilo no» era una comparación entre
cosas distintas, y la corrijo.**

`table-diff.ts` **no importa ningún cliente de modelo**. Las cuatro cifras que se
compararon en A5/A6 —`3 · 57 · 0 · 0`— **las calcula código determinista** que
cruza filas. **Repiten porque son aritmética, no porque el proveedor se porte
distinto ahí.**

**Mismo proveedor, mismo modelo, y ninguna paradoja: estábamos midiendo el
código en un sitio y el modelo en el otro.**

⚠️ **Y eso deja una afirmación mía demasiado fuerte, que también se retira**: que
«el análisis de corpus repite». **Lo que repite es su mitad determinista.** La
parte que sí depende del modelo —el juez, las contradicciones— **nunca se ha
medido para repetibilidad.**

## ✅ DOS COMPROBACIONES QUE NO CUESTAN NADA, Y SE PUEDEN HACER SOBRE EL PASADO

**El reintento, sin entrar en Vercel**: `usageContext` **suma** los tokens de
todas las llamadas de una petición, así que una pasada que reintentó mandó el
prompt **dos veces** y tiene **~el doble de `input_tokens`**. La huella ya está
guardada en `llm_usage` — consulta 6.

**Las citas que no están, sobre las catorce YA guardadas**: los `textRef` están
en la base y el documento también, así que **no hay que esperar a una pasada
nueva** — consultas 7 y 8. **Predicción escrita antes: cero citas ausentes.**

## LA CITA: SE BUSCA, SE GUARDA DÓNDE ESTÁ, Y SE CUENTA CUANDO NO ESTÁ

**`offset`** por problema, y `averia.estilo_cita_no_encontrada` cuando la cita no
aparece. Se busca sobre **el texto recortado que el modelo vio**, no sobre el
original: buscar en el entero diría que existe una cita que nunca estuvo en el
prompt.

✅ **Y al estrenarse cazó los ejemplos de su propia batería**: tres casos pasaban
el texto `'texto'` y citaban `'consulltas'` — una cita que no estaba. Verdes, y
sobre una situación imposible.

⚠️ **QUÉ HACER CUANDO LA CITA NO ESTÁ — HOY SE CONSERVA, Y LA DECISIÓN NO ES DE
AQUÍ.** Las tres opciones, para decidirlas con la cifra delante:

| opción | qué gana | qué cuesta |
|---|---|---|
| **conservarlo con `offset: -1`** *(lo de hoy, ahora contado)* | no se pierde un hallazgo que puede ser bueno y estar mal citado | el editor sigue sin poder señalarlo: el usuario ve un problema y no sabe dónde |
| **descartarlo** | todo lo que se enseña se puede localizar | se tira un hallazgo real por un fallo de forma, y **el recuento baja sin que el usuario sepa por qué** |
| **enseñarlo aparte, sin ancla** | honesto: «esto lo encontró y no sabe señalarlo» | una sección más en una pantalla que ya tiene varias |

**Lo que ya no puede pasar es que ocurra en silencio**, que era lo único
innegociable.

## ⚠️ 5.37-bis · LAS CITAS AUSENTES: 46 DE 113, Y EL CHEQUEO QUE ESCRIBÍ NACE ROTO (16/09/2026)

**PREDICCIÓN FALLADA Y POR MUCHO: predije CERO citas ausentes y salen 46 de 113,
el 40 %.** Se cuenta como fallada.

## LA CAUSA, CON LÍNEA: EL SALTO DE LÍNEA

**El fichero está ajustado a 80 columnas. Una cita que cruza un salto de línea
lleva `
` en el documento y el modelo la devuelve con un ESPACIO.** La
comparación literal falla.

**La correlación es exacta sobre los datos dados:**

| | dónde está en CLI-20 | resultado |
|---|---|---|
| «…anota la fecha en la que a **↵** sido subsanada» | `:96-97` | ❌ ausente |
| «El paciente debe acudir en **↵** ayunas si la intervención…» | `:58-59` | ❌ ausente |
| «El plazo de conservación… desde la **↵** última revisión» | `:75-76` | ❌ ausente |
| «Toda urgencia atendida… el mismo día. El **↵** registro…» | `:68-69`, `:85-86` | ❌ ausente |
| «Las consulltas telefónicas» | `:26`, **una sola línea** | ✅ presente |
| «Los paciente con cita» | `:39`, **una sola línea** | ✅ presente |
| «La prescipción de analgésicos» | `:53`, **una sola línea** | ✅ presente |
| «Es totalmente y completamente obligatorio» | `:49`, **una sola línea** | ✅ presente |
| «En el caso de que se dé el caso de que el paciente» | `:72`, **una sola línea** | ✅ presente |

**Las que caben en una línea salen todas; las que cruzan, ninguna.** Es la
hipótesis (b) del arquitecto, y la explica entera — incluido `la fecha en la que a
sido subsanada`, que no llega a 60 caracteres **y cruza el salto igual**.

✅ **(a) DESCARTADA**: no hay corte por bytes en ningún punto. `left()` y
`position()` de Postgres trabajan sobre caracteres en columnas `text`, y
`indexOf`/`slice` de JavaScript sobre unidades UTF-16. El susto de `wc -c` de ayer
era de una herramienta de línea de comandos, no de este camino.

## ⚠️ EL 60 ES MÍO — PERO NO ES LA EXCULPACIÓN QUE PARECE

**El recorte a 60 está en MI consulta, y sólo para enseñar**:
`left(p ->> 'textRef', 60) AS cita`. **La comparación de la línea siguiente usa
el `textRef` ENTERO.**

**Así que hay que separar dos cosas y no colar una por la otra:**

| | |
|---|---|
| **el PATRÓN «todas de 60, cortadas a media palabra»** | **es artefacto mío.** Claro que miden 60: las corté yo |
| **el `false`** | ⚠️ **ES REAL.** Sale de comparar la cita completa, y el dato guardado está bien |

**No es el caso de los «cinco documentos cortados» de la semana pasada.** Allí la
cifra era el artefacto; aquí lo es sólo su aspecto. **Decir «fue mi consulta» y
cerrar sería la salida cómoda y sería falsa.**

## ⚠️⚠️ Y LO QUE DE VERDAD CUESTA: EL CHEQUEO QUE ESCRIBÍ HOY TIENE EL MISMO FALLO

`style-check.ts` hace `textoEnviado.indexOf(cita)` **sobre el texto crudo, con sus
saltos de línea**. Por tanto **`averia.estilo_cita_no_encontrada` va a marcar como
ausente toda cita que cruce un salto** — el 40 % de ellas, medido.

**Nace mintiendo, y desde su primer uso.** Es exactamente la tercera posibilidad
que planteó el arquitecto, por un motivo distinto del que suponía.

⚠️ **Y ESTO YA LO SABÍA: AYER ARREGLÉ ESTE MISMO FALLO EN MI PROPIO
VERIFICADOR.** `scripts/verificar-cli20.mjs` falló al estrenarse sobre estas tres
mismas frases, y lo resolví colapsando los espacios —«el ajuste de línea no es
contenido»— y lo dejé escrito en su comentario. **Un día después escribí el mismo
fallo en producción**, sin que se me ocurriera mirar el verificador que acababa de
arreglar por esa razón.

**La lección no es «acuérdate»: es que la corrección vivía en un script suelto y
no en una función compartida.** Lo que se aprende en una herramienta no protege a
la otra si no comparten el código.

## ✅ ARREGLADO EL 16/09/2026 — y el arreglo era USAR LO QUE YA HABÍA

⚠️ **LA FUNCIÓN BUENA YA EXISTÍA, Y MEJOR QUE MI VERIFICADOR.** `findTolerant`
llevaba tiempo en `useImprovementChat.ts`: normaliza tipografía sin mover
índices, prueba exacto, y **si falla colapsa espacios MANTENIENDO UN MAPEO de
vuelta a los índices del texto original**.

**Vivía en un fichero `'use client'` con React dentro, así que el servidor no
podía usarla** — y el día que el análisis la necesitó, escribí otra peor.

**EL CENSO: CUATRO SITIOS NORMALIZABAN ESPACIOS PARA COMPARAR TEXTO.**

| # | dónde | estado |
|---|---|---|
| 1 | `findTolerant` | **la buena** — movida a `lib/texto/localizar-cita.ts` |
| 2 | `problems.ts:183`, copia privada | **retirada**, ahora importa la compartida |
| 3 | `scripts/verificar-cli20.mjs` | ⚠️ **sigue con la suya**: es un `.mjs` suelto y **no puede importar TypeScript**. Son dos, no una, y queda declarado |
| 4 | `style-check.ts`, el `indexOf` crudo | **retirado** el mismo día que nació |

## ⚠️ LO QUE CONTESTA LAS DOS PREGUNTAS QUE QUEDABAN ABIERTAS

**(2) ¿Importa que el desplazamiento sea sobre el texto normalizado?** **Sí, y
por eso no hay que decidir nada: `findTolerant` ya devuelve el índice sobre el
ORIGINAL.** Colapsar espacios para encontrar la cita es fácil; **devolver dónde
está en el documento de verdad** es lo que permite señalarla en pantalla. Un
índice sobre el texto colapsado no sirve para nada ahí.

✅ **(4) ¿El editor puede señalar hoy una cita que cruza un salto? SÍ.** Era mi
preocupación y era infundada: `ImprovementModal.tsx:319` **ya usaba
`findTolerant`**, no `indexOf`. **No hay ficha que abrir** — el usuario nunca
sufrió esto. Lo sufría **el chequeo que yo escribí hoy**, y nada más.

## LA MUTACIÓN CAZÓ UN CASO MÍO QUE PASABA POR CASUALIDAD

Escribí un caso para «el índice es sobre el original» y **un mutante que
devolvía el índice colapsado lo pasaba entero**: en mi párrafo cada salto era
**un** carácter, así que colapsarlo no movía nada y los dos índices coincidían.

**Hizo falta un texto con tramos que SÍ se colapsan** —línea en blanco, espacios
dobles— para que el caso probara lo que decía probar. **Un caso verde que no
puede fallar por su propio motivo no es una prueba: es un adorno.**

**20 casos entre los dos ficheros. Tres mutantes, los tres muertos**: volver al
`indexOf` crudo mata 1; perder el mapeo, 2 —tras arreglar el caso—; y encontrar
siempre, 3.

**No se arregla aquí.**

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
