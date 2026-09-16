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

### 📏 RELEÍDA EL 17/09/2026 — más ancha de lo escrito, y con su decisión a la vista

Las líneas de arriba son del 09/09 y se han movido; lo que sigue está leído hoy.

- ⚠️ **NO ES SÓLO DEL EXHAUSTIVO.** `consumeCredits` (`analyze-v2/route.ts:259`) cobra
  **los dos modos**, y las salidas posteriores son comunes: el rápido pierde 5 por
  los mismos caminos. Seis salidas tras el cobro sin reembolso: semáforo ocupado
  (409), extracción fallida (400), falta de cuerpo (400), texto insuficiente (400),
  `INSERT` del job fallido (500) y excepción (500).
- **En cinco de las seis no se ha entregado ni gastado nada del proveedor.** Reembolsar
  ahí es correcto sin discusión, y la pieza existe: `devolverSiNoSeEntrego`
  (`lib/credits.ts:242`), la que ya usa la ruta de estilo.
- **La excepción (500) puede llegar DESPUÉS de haber llamado al modelo** en el rápido
  —un fallo de base o de índice dentro del pipeline—. Los fallos del MODELO no llegan
  ahí: se convierten en `stageFailures` y ya se devuelven íntegros (F-71).
- **El worker**: su `catch` escribe `failed` y no devuelve; también ahí puede haberse
  gastado modelo, Sonnet incluido. **Y los jobs que el barrido de zombis marca `failed`
  (`stale_timeout`, 20 min) tampoco devuelven** — y un worker vivo podría terminarlos
  después, así que reembolsar ahí sin una marca de «ya devuelto» arriesga pagar dos
  veces.
- **¿Se sabe cuánto se gastó en el punto del fallo?** Los tokens sí: van a un
  acumulador en memoria (`usageContext`), pero **sólo se persisten en el camino
  bueno**. En créditos **no hay cifra que saber**: el precio es plano, no por tokens.
- ⚠️ **LA DECISIÓN ESCONDIDA** es si el criterio de F-71 —«íntegro, sin proporción; un
  fallo del proveedor no lo paga el cliente»— se extiende a las excepciones propias y
  a los jobs `failed`. Hay precedente, pero ese precedente era para fallos del
  proveedor, no nuestros.
- **EL CASO DE LOS 60, VIVO, y peor de lo escrito**: el descuento de reanálisis del
  worker exige `exclude_fingerprints !== '[]'`, y el modal manda los hallazgos
  DESCARTADOS. **Si el usuario no descartó ninguno, el segundo exhaustivo cuenta como
  análisis inicial.** Qué es «reanálisis» a efectos de precio es decisión de producto.

### ✅ LA PARTE SIN DECISIÓN, ARREGLADA EL 17/09/2026

Todo lo que sale de `analyze-v2` **antes del punto de gasto** se devuelve íntegro, en
los dos modos: semáforo ocupado, extracción fallida, falta de cuerpo, texto
insuficiente, job que no llega a crearse y excepción previa. **Un solo sitio**: el
`finally`, con la bandera `pasoElPuntoDeGasto`, que se pone a `true` cuando el job
existe o cuando el rápido entra en el pipeline. Un reembolso por salida habría sido
una lista que el próximo `return` olvidaría.

**Lo que NO cubre, a propósito**: la excepción de la ruta después del punto de gasto,
el `catch` del worker y los jobs zombis. Esperan la decisión del director sobre el
reembolso parcial.

**Sin batería**: el alcance de vitest excluye rutas. **Control positivo en pantalla**:
subir un `.txt` de menos de 50 caracteres y pedir su análisis desde el chat → 400
«Texto insuficiente» y **el saldo no cambia** (antes bajaba 5, o 30 en exhaustivo).

### 📏 PARA LA DECISIÓN DEL REEMBOLSO PARCIAL — leído el 17/09/2026

El director propone cobrar la mitad de un fallo a mitad, para que reintentar no
salga gratis. Lo que decide si ese pozo existe:

- **¿Cuesta reintentar un trabajo `failed`?** **Sí, siempre.** No hay camino de
  reintento: cada petición a `analyze-v2` cobra de nuevo (`route.ts:259`), y el
  endpoint de trabajos sólo consulta. **Por los `failed` no hay pozo.**
- ⚠️ **PERO EL POZO YA EXISTE POR OTRA PUERTA, y es de F-71**: un análisis que acaba
  **incompleto** —alguna etapa del modelo cayó— **se entrega con su resultado
  parcial** (`analysis-jobs/[id]/route.ts:63` devuelve `result` también en
  `completed_with_errors`) **y se devuelve íntegro**. Eso sí es análisis parcial
  gratis, y se puede repetir.
- **¿Puede provocarlo el usuario?** Los `failed` del `catch`, prácticamente no: son
  excepciones de base, índice o código. Los incompletos, **no se ha medido**, pero hay
  una palanca a su alcance: **el tamaño del documento**. No hay límite de tamaño en el
  código de las rutas —el del almacén, si lo hay, no se ve desde aquí— y el exhaustivo
  manda el documento **entero** a cada juicio.
- **¿Se sabe si llegó a gastar modelo?** **Sí, con poco**: cada llamada suma al
  acumulador de uso (`usageContext`) en el momento de hacerse. Hoy ese acumulador se
  declara dentro del `try` y **sólo se guarda en el camino bueno**, así que en el
  `catch` no está a mano. Subirlo un nivel basta. **Para los zombis no se sabe**: el
  proceso murió con el acumulador en memoria.

### 📏 LOS 30 + 30 — qué pasa exactamente, leído el 17/09/2026

El recorrido: el chat ofrece el exhaustivo en el aviso (`useDocuments.ts:343`, manda
el FICHERO) y cobra 30; después, en el modal de Mejora, «Reanalizar corpus»
(`useCrossDocAnalysis.ts`, manda el TEXTO del editor) cobra otros 30.

- **¿Produce algo distinto si el usuario no cambió nada?** Sólo por tres vías, y
  ninguna es información nueva sobre su documento: **(1)** hallazgos que descartó en el
  modal —se excluyen—; **(2)** que el corpus cambiara entre medias; **(3)** la
  variación del propio modelo, que no es un hallazgo sino ruido.
- **¿Algo le avisa?** **No.** El botón sólo se deshabilita mientras carga, y enseña el
  precio. El modal **sí sabe** si el texto cambió —guarda el texto inicial— y cuántos
  hallazgos se descartaron, y no lo usa para nada.
- **¿Se puede saber que el primero existe y es equivalente?** **La mitad.** Del lado del
  documento, sí: el texto y los descartes se comparan en el cliente. **Del lado del
  corpus, no**: no hay forma de saber si cambió desde el primer análisis (B.252). Por
  eso **no es el caso del duplicado exacto**, que el servidor PRUEBA con el hash: aquí
  sólo se podría avisar, no demostrar.
- Y el precio: si no descartó nada, **el segundo cuenta como análisis inicial**, sin el
  descuento de reanálisis.

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

### ✅ LA PUERTA 1, ARREGLADA EL 17/09/2026 — y la puerta 3 decía otra cosa

**Puerta 1**: la longitud se comprueba **antes** del cobro (`analyze-style/route.ts`).
Un texto de menos de 50 caracteres ya no cuesta 2 créditos. **Sin batería**: el
alcance de vitest excluye las rutas. **Control positivo en pantalla**: en el modal,
con un documento de menos de 50 caracteres, «Reanalizar estilo» → el saldo **no
cambia** (antes bajaba 2).

⚠️ **LA PUERTA 3, RELEÍDA, NO DICE «0 PROBLEMAS»: DICE ALGO PEOR.** El cliente, ante un
error HTTP, devuelve `[]` **sin tocar la lista**, y el modal (`ImprovementModal.tsx`,
`handleReanalyzeStyle`) compara longitudes:

| lo que pasó | lo que ve el usuario hoy |
|---|---|
| 402 sin créditos, 429 límite, 400, 500 | «He reanalizado el estilo. **No hay cambios respecto al análisis anterior.**» — no reanalizó |
| el modelo falla (puerta 2): `success: true` con lista vacía | la lista **se vacía** y dice «**N problemas resueltos, 0 pendientes**» — y se cobran 2 y se gasta cupo diario |

⚠️ Y la puerta 2 es más muda en esta ruta que en el exhaustivo: `analyze-style` **no
abre** `stageFailureContext`, así que `recordStageFailure` no registra nada. En el
exhaustivo el mismo fallo sí se registra y se devuelve.

### ✅ LA PUERTA 2, ARREGLADA EL 17/09/2026 — el servidor ya no dice «limpio» sin mirar

**Hoy, si el modelo fallaba, el producto afirmaba que el documento estaba limpio.** Es
lo que el producto vende, dicho sin haberlo mirado.

`analyzeStyle` devuelve ahora un resultado con **dos formas**: `mirado` —con su
lista, que vacía sí significa «sin problemas»— o `no_se_pudo_mirar`, **sin lista**.
Con la segunda, la ruta **devuelve los 2 créditos, no guarda nada, lo registra como
fallo** —así tampoco gasta cupo diario— y contesta **503 `estilo_no_analizado`**.

El compilador hizo el censo de consumidores al cambiar el tipo: la ruta, el pipeline
exhaustivo —que ya marcaba el análisis incompleto y lo devolvía— y la batería.
**Un caso de la batería CONGELABA el fallo** («sigue devolviendo lista vacía: eso es
B.237»): se invierte, no se borra. Mutante «el fallo vuelve a ser lista vacía»: cae.

**La puerta 3 va en el commit siguiente**, el del cliente: mientras tanto el 503 llega
a la pantalla como cualquier error HTTP —«no hay cambios»—, que es falso pero **ya no
vacía la lista ni cobra**.

### ✅ LA PUERTA 3, ARREGLADA EL 17/09/2026 — sólo un reanálisis hecho dice «He reanalizado»

El hook devuelve **qué pasó** —`ok`, `no_se_pudo_mirar`, `sin_creditos`, `limite`,
`texto_insuficiente`, `error`— y la lista **sólo se toca en `ok`**. El modal deja de
comparar longitudes y pide la frase a `mensajeDelReanalisisDeEstilo`, que tiene
batería. Lo que ve el usuario:

| pasó | frase |
|---|---|
| el modelo falló | «No he podido reanalizar el estilo: el análisis ha fallado. No se te ha cobrado y tu lista anterior sigue aquí.» |
| sin créditos | «…no quedan créditos en tu plan. Tu lista anterior sigue aquí.» |
| límite diario | «…has alcanzado el límite diario de análisis de estilo. Tu lista anterior sigue aquí.» |
| texto corto | «…el texto es demasiado corto (mínimo 50 caracteres). No se te ha cobrado.» |
| otro error o red | «No he podido reanalizar el estilo por un error. Tu lista anterior sigue aquí.» — **sin prometer nada del cobro**, porque no se sabe |

La rama `data?.styleError` se retira: ningún servidor la emite.

**B.237 queda CERRADA en sus tres puertas.**

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

| # | lo que hay que poder demostrar | hoy (17/09/2026) |
|---|---|---|
| 1 | El inventario existe y es público | ✅ |
| 2 | La puerta principal medida por sus dos entradas, misma cifra | ✅ **cerrado el 16/09**: corpus por A5/A6 (`3 · 57 · 0 · 0` por las dos puertas y en los dos modos, 15/09) y estilo por A7/A8 **por conjuntos**, catorce pasadas (`Tandas_Harness.md`, «LO QUE CIERRA»). ⚠️ Coinciden, **no repiten**: B.240 sigue abierta |
| 3 | Cada camino que produce informe, con cifra + camino + **modo** | ❌ **seis de ocho**: A1, A3, A5, A6, A7, A8. **Faltan A2 y A4**, los dos exhaustivos que el cliente pisa; su montaje quedó anulado el 16/09. ⚠️ Y A1, A3, A5 y A6 tienen **alcance de pareja, no de corpus** (§5.47) |
| 4 | Cuando el sistema no ve algo, lo dice | 🔶 **a medias.** Hecho: los denominadores de tablas (pieza 2, 07/09) y el aviso de cobertura de documentos, que dice contra cuántos se comparó y la causa sólo cuando está medida (`7afafd71`, 16/09). **Sigue sin decirlo**: el estilo pierde el final de los documentos largos (B.236) y devuelve «cero problemas» sin haber mirado (B.237); el rerank ve el documento nuevo cortado en seco a 3.000 caracteres; y el corte previo a 25 candidatos no se cuenta |
| 5 | Los dos botones que cobran dicen lo que cuestan | ✅ **B.180, arreglado el 08/09** (`a2b99c41`, §4.2) |
| 6 | Hay lista escrita de lo no probado, y no está escondida | ✅ |
| 7 | La condición de escritorio, escrita | ✅ |

**Cinco de siete, con el 4 a medias.** Los dos que faltan son la cobertura de los
exhaustivos (3) y que todo lo que no se ve se diga (4).

⚠️ **ESTA TABLA ESTUVO CADUCADA DESDE EL 09/09 HASTA EL 17/09.** Decía «tres de
siete» con el 2 y el 5 en ❌ cuando llevaban días cerrados, y el 4 como «pieza 2
sin empezar» cuando la pieza 2 entró el 07/09. La lectura del 15/09 («cinco de
siete») se hizo en conversación y **no llegó al documento**: `git log -S` no
encuentra la frase en ningún commit. Es la misma clase que el §4 corrigió el 09/09.

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

---

## ⚠️ 5.38 · B.242 — desde la bandeja, el rápido y el exhaustivo NO miran el mismo corpus (16/09/2026)

Dos topes de pantalla, y contestan a preguntas distintas:

    hooks/review/useReviewList.ts:6            MAX_SELECTION = 20
    components/review/ReviewSelectionBar.tsx:19 MAX_EXHAUSTIVE_SELECTION = 3   (aplicado en :111)

Y una sola lista para las dos cosas:

    hooks/review/useReviewAnalysis.ts:126
    const batchDocumentIds = documents.filter(d => d.id !== doc.id).map(d => d.id);

La tanda que **participa** en la recuperación es la selección menos el que se
analiza. No hay lista de participantes aparte de la lista de analizados.

**Consecuencia**: desde la bandeja el rápido puede llevar hasta **19** compañeros
y el exhaustivo como mucho **2**. No es que uno mire más y otro menos —**miran
corpus distintos**, y el que mira menos es el que cuesta 30 créditos.

⚠️ **Lo que lo hace ficha y no nota**: comparar los dos modos desde la bandeja no
compara los modos, compara dos corpus, y el sesgo favorece al barato. Nadie lo
había escrito, y el montaje de A2/A4 se apoyaba justo en lo contrario.

El servidor no pone tope (`app/api/analyze-v2/route.ts:184` sólo valida el tipo):
los dos números son decisiones de pantalla, y por tanto revisables sin tocar el
pipeline. **No se decide aquí cuál debe ser: se registra que hoy no son
comparables.**

---

## ⚠️ 5.39 · B.243 — el corpus sabe qué documento toca a más documentos, y nadie se lo ha preguntado (16/09/2026)

Los vectores están calculados y pagados. Con lo que ya hay se puede contar, por
cada documento, **contra cuántos otros tiene al menos un trozo por encima del
umbral** — sin abrir ningún documento, sin volver a embeber, sin modelo y **sin
consumir un crédito**.

Las cuatro piezas existen:

| Pieza | Fichero:línea |
|---|---|
| `listVectorIdsByPrefix` | `lib/pinecone/vectors.ts:273` |
| `fetchVectors` (devuelve `values: number[]`) | `lib/pinecone/vectors.ts:230` |
| `queryVectors` (`filter` opcional, `:139`) | `lib/pinecone/vectors.ts:128` |
| `soloGeneracionActiva` | `lib/analysis/generacion-activa.ts:50` |

⚠️ **Y lo que NO existe**: ningún endpoint ni script lo hace hoy. `admin/duplicates`
agrupa por `content_hash` exacto; `admin/diagnose-vectors` compara estado contra
metadata. Se dice en negativo a propósito — dar por existente lo que sólo está
propuesto es el corolario de F-106.

**Las dos condiciones de corrección**, que si se fallan hacen que mida otra cosa:

1. **Sin filtro de corpus.** `CORPUS_ACTIVO` sólo ve `analizado` y hoy casi los 42
   son `pendiente`: con filtro daría ceros con pinta de resultado.
2. **La generación se PREGUNTA a `soloGeneracionActiva`**, no se recalcula.

**Qué devolvería**: por documento, `vecinos` (≥ 0,50), `vecinos_045`, `score_max` y
la lista con nombres. La diferencia entre las dos primeras columnas **es lo que el
exhaustivo compra con su umbral, sabido sin gastar 30 créditos**.

⚠️ **Vale más que la tanda que lo motivó.** Es una pregunta de producto —*«¿qué
documento de los míos toca a más documentos?»*— que hoy no tiene respuesta, y de
paso da el sujeto real para A2/A4 en vez de uno fabricado. El volumen sale de
`sum(chunk_count)`, que está en `SQL_A2A4_compuerta.sql`; no se estima de memoria.

---

## ⚠️ 5.40 · B.241 — el tope de 25 del exhaustivo no se ha ejercido nunca (16/09/2026)

**Nace con el enunciado corregido, no con el que se le encargó.** El encargo la
pedía como *«el exhaustivo hace lo mismo por seis veces el precio»*, y las dos
mitades son falsas:

- **No hace lo mismo.** `lib/analysis/pipeline.ts:1156` llama a `analyzeStyle`, y
  está dentro de `runExhaustivePipelineInner` (`:1139`). El rápido,
  `runAnalysisPipeline` (`:1104`), no la llama. El exhaustivo trae el análisis de
  estilo; el rápido no.
- **No son seis veces.** Con el precio variable devolviendo, lo medido son **25
  netos contra 7** (5 + 2 del estilo por tarifa), y en otra pasada 20. Son tres.

⚠️ **Y la corrección ya estaba escrita en `Tandas_Harness.md:889` desde el 31/08, de
mi puño**: *«EL EXHAUSTIVO SÍ HIZO ALGO QUE EL RÁPIDO NO — me equivoqué»*. Volví a
afirmar lo corregido dos semanas después sin releerla, y de ahí pasó al encargo.

⚠️ **Y `B.127`, que esas mismas líneas citan tres veces —870, 897, 1054— NO EXISTE
como ficha.** `grep -rn "B\.127" claude/` devuelve sólo las tres citas. Una
propuesta que nadie escribió, leída como archivada porque llevaba número.

**LO QUE SOBREVIVE Y ES LA FICHA:**

> El exhaustivo se separa del rápido en la selección por dos parámetros —umbral
> 0,50→0,45 y tope 6→25 (`retrieval.ts:211`, `rerank.ts:39`)—. Este corpus no ha
> producido jamás más de **2** candidatos, así que **el tope de 25 no ha llegado a
> aplicarse ni una vez**. Lo que el exhaustivo entrega de más hoy es el estilo
> —comprable suelto por 2 créditos— y las pasadas extra del double-check.

**La población se cuenta, no se afirma.** «Nunca» es un universal, y los universales
de esta casa llevan comando. Los dos contadores están persistidos
(`counters.ts:78-79` → `pipeline_counters`), y la consulta está en
`SQL_A2A4_compuerta.sql`:

- `max_seleccionados` del `exhaustive` **< 7** → el tope no ha mordido nunca y la
  ficha queda con población.
- **≥ 7** → la ficha nace falsada el mismo día, y se dice.

**Estado: ESCRITA, PENDIENTE DE POBLACIÓN.** No se cierra hasta ejecutar la
consulta.

---

## ⚠️ 5.41 · B.127 — la ficha que nunca se escribió, y que tres líneas citaban como archivada (16/09/2026)

Existía sólo como referencia. `Tandas_Harness.md` la invoca en las líneas 870, 897
y 1054 —una de ellas para *corregirla*—, y `grep -rn "B\.127" claude/` no devuelve
ninguna casa: **nadie la escribió jamás.**

Su contenido pretendido era «el exhaustivo no hace nada que el rápido no haga».
Está **falsado** (ver 5.40): el exhaustivo trae el análisis de estilo y el precio
neto es 25 contra 7, no 30 contra 5.

**Queda absorbida por B.241**, que conserva lo único que sobrevive —el tope de 25
sin ejercer— y con población medida en vez de supuesta. No se reabre.

⚠️ **Y lo que enseña vale más que su contenido**: un número de ficha citado tres
veces adquirió autoridad de archivo sin que existiera el archivo. Es el corolario
de F-106 en su forma pura, y lo cazó el invariante de forma de este documento
—`ficha_sin_casa`— en el mismo commit en que se escribió la denuncia.

---

## ⚠️ 5.42 · B.244 — si el tope deja candidatos fuera, el usuario no se entera (16/09/2026)

**Predicción escrita antes de mirar**: que el tope no dejaba rastro. **Acertada, y
con un agravante que no había previsto.**

### La poda es un `slice` mudo

    lib/analysis/rerank.ts:105
    return selected.slice(0, maxSelected);

Sin contador, sin registro, sin aviso. Nadie sabe cuántos se cayeron ahí.

⚠️ **Y el agravante**: ése es el SEGUNDO camino de pérdida, no el primero. El
primero es que el rerank sólo conserva lo que el modelo devuelve (`:92-104`): un
candidato que el modelo no nombra desaparece igual de callado. **Los dos se
confunden en la misma resta.**

### Lo que sí queda contado, y por qué no basta

    lib/analysis/pipeline.ts:746   counters['seleccion.candidatos_recuperados'] = candidates.length;
    lib/analysis/pipeline.ts:766   counters['seleccion.candidatos_seleccionados'] = reranked.length;

La resta existe en `pipeline_counters`, pero **(a)** no distingue «el modelo lo
descartó» de «el tope lo cortó», que son cosas distintas —una es criterio, la otra
es presupuesto— y **(b)** vive en el jsonb: hay que entrar a la base para verla.
**El usuario no la ve nunca.**

### El contraste que lo convierte en ficha

Para las FILAS el aviso existe y funciona: `SelectionLimitNotice.tsx:75` pinta
*«Alcance: 28 de 39 filas de …»*, alimentado por `retrieval.ts:375` con
`rowsLeftOut`. Se ve en el modal (`AnalysisModal.tsx:202`) y en el chat
(`ChatPanel.tsx:287`).

**Para los DOCUMENTOS no hay nada equivalente.** La misma casa que decidió avisar
cuando se quedan filas fuera de una tabla no avisa cuando se quedan documentos
enteros fuera del análisis.

### Gravedad: alta, y ARMADA — no latente (reescrito el 16/09 con el censo medido)

Un análisis que dice «no hay más» cuando había cinco más es la familia peor de la
escala de F-100 —*el producto miente al cliente*—, no la de contabilidad sucia.

> ⚠️ **ESTO DECÍA «LATENTE» Y SE APOYABA EN UNA PREMISA FALSA.** Decía: «este corpus
> no ha producido jamás más de 2 candidatos, así que el tope no ha llegado a
> cortar». El censo de vecindario lo desmintió el mismo día: **42 de 42 documentos
> tienen entre 8 y 25 vecinos** por encima de 0,50 — `OPE-07` 25, `OPE-05` 24,
> `CLI-20` 22, ninguno por debajo de 8. El «1-2 candidatos» no era un hecho sobre
> los parecidos: era el **filtro de corpus** dejando fuera a los 40 documentos
> `pendiente` antes de que el rerank opinara. Ver B.245.

**La población, medida y sin muestreo**: por parecido, TODO documento de este
corpus supera los 6 candidatos. El tope de 6 del rápido cortaría **siempre**, y el
de 25 del exhaustivo cortaría al menos con `OPE-07`.

⚠️ **Y la forma correcta de decirlo, que no es la del encargo ni la que yo tenía.**
No es «esto pasa en cada análisis desde siempre»: hoy no pasa, porque el filtro de
corpus recorta antes y deja **3** (medido el 16/09, no «1 ó 2» como se escribió
aquí primero). Y no es «latente»: no hace falta un cliente
nuevo ni un corpus mayor. **Está armado sobre el corpus que ya existe, y se dispara
con el gesto que el producto pide hacer** — marcar documentos como revisados. Al
séptimo, el tope empieza a cortar en silencio y nada lo anuncia.

**El producto empeora exactamente en la medida en que se usa como está diseñado.**
Ésa es la frase de la ficha.

### Lo que haría falta, y NO se escribe aquí

Un contador que separe las dos causas y un aviso con la forma del que ya existe
para las filas. **No se implementa en este commit**: el encargo era mirarlo, y
además la cifra con la que se probaría —un caso donde el tope corte de verdad— es
justo lo que la tanda todavía no ha producido. Se arregla con el caso delante.

---

## ⚠️ 5.43 · H-01 · La hipótesis de RRHH-01 viene de FUERA y no está verificada aquí (16/09/2026)

**Origen**: otro chat, trabajando con el corpus en disco. **No es una lectura de
este repositorio.** Se registra con nombre propio —`H-01`— para que no vuelva
convertida en dato.

**Lo que afirma**: que `RRHH-01` (Manual de acogida al empleado nuevo) remite
explícitamente a seis documentos —`MKT-01`, `RRHH-05`, `RRHH-04`, `RRHH-02`,
`MKT-02`, `RRHH-06`— y toca sin remisión temas de `NOR-01/02`, `CLI-01/02`,
`NOR-04` y `NOR-03`. Unos doce en total.

**Lo poco que se puede decir desde aquí, y es poco a propósito:**

| De los 13 nombres | En `corpus-pruebas/` |
|---|---|
| `MKT-01`, `RRHH-06`, `NOR-01` | **sí, los tres** |
| `RRHH-01`, `RRHH-02`, `RRHH-04`, `RRHH-05`, `MKT-02`, `NOR-02`, `NOR-03`, `NOR-04`, `CLI-01`, `CLI-02` | **no están en el repositorio** |

Diez de trece no se pueden ni confirmar que existan desde aquí: vivirían entre los
27 documentos que sólo están en el OneDrive del director. **No es una contradicción
—es coherente con que el repositorio tenga 15 de los 42— pero tampoco es
confirmación de nada.**

⚠️ **Y la razón concreta para no darle crédito de entrada**: la misma fuente dio el
tope del exhaustivo como 10, y son **3** (`ReviewSelectionBar.tsx:19`). Una fuente
que falla en un dato comprobable no queda descartada, pero sí pierde el derecho a
que se le crean los no comprobables.

⚠️ **Y la diferencia que decide si la hipótesis sirve aunque sea cierta**: *remitir
a* no es *parecerse a*. El censo no cuenta remisiones: cuenta trozos por encima de
un umbral de similitud. Un manual de acogida puede nombrar el tarifario en una
línea y no parecerse a él en ningún trozo. **Así que H-01 puede ser literalmente
cierta y dar dos vecinos.**

**Cómo se resuelve, sin gastar**: `GET /api/admin/vecindario` y se lee la fila de
`RRHH-01`.

| Lo que devuelva | Qué significa |
|---|---|
| `vecinos ≥ 7` | H-01 confirmada en lo que importa: **`RRHH-01` es el sujeto real de la tanda y `SAT-A` no hace falta** |
| `vecinos` entre 3 y 6 | el tope de 6 muerde por poco; sirve, pero la diferencia 6↔25 se verá estrecha |
| `vecinos ≤ 2` | H-01 era optimista, **y ya sabremos por qué**: remisión no es parecido |
| `documentos_sin_vectores` lo incluye | `RRHH-01` no está indexado y la pregunta no se ha llegado a hacer |

---

## ✅ 5.44 · El censo de vecindario, ESCRITO — cierre de 5.39 (16/09/2026)

`GET /api/admin/vecindario`, con la guarda de administrador de `admin/duplicates` y
`maxDuration = 300`. Módulo contable en `lib/analysis/vecindario.ts`, 16 pruebas.

**Cero créditos**: `fetchVectors` devuelve los `values` ya calculados, así que no se
embebe nada ni interviene ningún modelo.

**Las dos cosas que había que acertar, acertadas y con su prueba:**

1. **Sin filtro de corpus** — la consulta va sin `filter`
   (`app/api/admin/vecindario/route.ts:171-176`). Con `CORPUS_ACTIVO` habría dado
   ceros con pinta de dato, porque casi todo el corpus está `pendiente`.
2. **La generación se pregunta** — `soloGeneracionActiva` y `generacionesMuertas`,
   las mismas del retrieval, en `vecindario.ts:100-107`. No se recalcula el
   criterio.

**Y una tercera que no estaba en el encargo**: los umbrales y el `topK` ahora se
**exportan** desde `retrieval.ts` (`:107,108,117`) y el censo los importa. Un `0,50`
copiado en el censo habría sido una segunda definición del mismo criterio; el día
que allí cambiara, el censo mediría otra cosa y los dos seguirían pareciendo
correctos por su cuenta.

**Devuelve** por documento: `vecinos` (≥0,50), `vecinos_045` (≥0,45), `scoreMax`,
`consultas` y el `detalle` con nombres, ordenado por vecindad. Más `contadores`
—generaciones muertas, documentos sin vectores, consultas realizadas y omitidas— y
un `completo` que es cierto si y sólo si no se truncó por el tope de 1.500
consultas.

⚠️ **`consultas_realizadas` es el DENOMINADOR**: un «0 vecinos» sólo significa algo
si se sabe cuántas veces se buscó. Sin él sería un cero sin control.

**El control positivo de la batería** es la prueba de un vecino a 0,47: sale en
`vecinos_045` y no en `vecinos`, que es exactamente lo que el exhaustivo compra con
su umbral. Mutado —umbral del exhaustivo sustituido por el del rápido— **caen esa y
la de 0,45 clavado, y sólo esas dos**. La prueba puede fallar por su propio motivo.

**Predicción de pruebas fallada por cuarta vez consecutiva**: 11 predichas, 16
escritas. Las cuatro por debajo (8→10, 7→11, 12→15, 11→16). Ya no es ruido: es un
sesgo, y queda anotado como tal.

---

## ⚠️ 5.45 · B.245 — el portero era el FILTRO DE CORPUS, y dije que era el umbral (16/09/2026)

**Es una corrección de una premisa mía, y fue a parar a una recomendación que el
director recibió como buena.** El 15/09 escribí:

> *«El portero no es el tope: es el umbral.»*
> *«Marcar quince documentos no produciría quince candidatos: produciría uno o dos.
> La respuesta a "cuántos hay que dejar analizados" es ninguno.»*

**Falso.** El censo de vecindario da 8-25 vecinos a los 42 documentos. Marcar quince
produciría aproximadamente quince candidatos.

**La única diferencia estructural entre el censo y el retrieval es el filtro**, y
las demás se descartaron una a una, no de memoria:

| | Censo | Retrieval |
|---|---|---|
| filtro | ninguno | `buildCorpusFilter` → `CORPUS_ACTIVO` (`vectors.ts:99`) |
| prefijo de e5 | `passage` (guardado) | `passage` — `retrieval.ts:219` usa `generateEmbeddings`, y ésa es `planDeEmbedding('indexacion')` (`embeddings.ts:262`) |
| `topK`, umbral, generación, exclusión | idénticos | idénticos |

⚠️ **El prefijo estuvo a punto de invalidar el censo entero y no lo hace.** Si el
retrieval hubiera embebido como `query`, los dos 0,50 serían escalas distintas y
ninguna comparación de estos días valdría. Se comprobó porque se enumeró, no
porque se sospechara.

**La prueba limpia**: el 15/09, con los 42 documentos ya sincronizados, analizar
`CLI-20` dio **1 candidato**. El censo le da a `CLI-20` **22 vecinos** sobre ese
mismo índice. Mismo umbral, mismo espacio. Sólo cambia el filtro.

### Cómo se produjo el error

Leí `Retrieval: 1 candidatos` en los registros y lo tomé por una propiedad de los
parecidos. Era una propiedad de la ELEGIBILIDAD. Es la regla de la casa sobre la
cifra leída como medida, aplicada a un log: *el número de candidatos no es el
número de documentos parecidos, es el número de documentos elegibles y parecidos*,
y yo tenía las dos mitades delante.

⚠️ **Y había una señal que cité como prueba de lo contrario**: las tandas registran
`1 ids de tanda` junto al `1 candidato`. Eso decía que la selección tenía dos
documentos —**tandas aisladas a propósito**— y su «1 candidato» era el montaje
funcionando, no el corpus hablando.

**Consecuencia de producto, que es lo que importa**: `analysis_status` no responde
sólo «¿participa por defecto?» (F-97). En la práctica **decide cuánto ve el
análisis**, y hoy lo que ve es el 5 % del corpus. Nadie lo había enunciado así.

---

## ⚠️ 5.46 · B.246 — el resumen de tabla embebe más plantilla que datos (16/09/2026)

> ⚠️ **FALSADA EN SU FORMA ACTUAL EL MISMO DÍA — ver 5.48.** Nació porque dos hojas
> de cálculo de temas ajenos salían a 0,972, y la plantilla parecía la causa. No lo
> es: `MKT-01` y `NOR-10` son **prosa**, no comparten ninguna plantilla, y salen a
> 0,881. El suelo del corpus entero es ~0,79. **La causa no es la plantilla: es que
> el umbral de 0,50 no descarta nada.** Lo que sobrevive de esta ficha es la
> observación sobre `chunking.ts:882-884` —los ~52 caracteres de frase hecha siguen
> ahí y siguen siendo mejorables— **sin su papel explicativo**.

**Sospecha del director, y tiene línea:**

    lib/chunking.ts:846      const prefix = `[Hoja "${sheetName}"]`;
    lib/chunking.ts:882-884  `${prefix} Tabla con ${N} filas y ${M} columnas. Columnas: ${columns.join(', ')}.`

El texto que se embebe de un resumen de tabla es:

    [Hoja "Tarifas"] Tabla con 60 filas y 7 columnas. Columnas: Tratamiento, Precio, ...

**Unos 52 caracteres de plantilla idéntica antes del primer dato propio.** Con una
lista de columnas de 30-40 caracteres, más de la mitad de la cadena es la misma
frase en cualquier par de hojas de cálculo. Si además coincide el nombre de la hoja
—`Hoja1`, `Datos`, `Tarifas`— coincide también el prefijo.

Las filas (`:902`) están menos dominadas por plantilla, pero repiten los nombres de
columna en cada fila y el separador en todas.

⚠️ **El grupo compacto de los `new N.txt` es el mismo animal por el otro extremo**:
textos muy cortos caen todos en la misma zona porque no dicen lo suficiente para
diferenciarse.

### Lo que NO está demostrado, y no se da por demostrado

Que la plantilla domine la cadena es una lectura del código, **no una medida del
score**. Y el `0,997` entre `OPE-10` y `OPE-11` **no es evidencia de esto**: son el
par sembrado, dos tarifarios casi gemelos por diseño.

### Condición de nacimiento, escrita ANTES y comprobable con lo que ya hay

La salida del censo trae el `detalle` de cada documento con nombres y scores. **No
hace falta ejecutar nada nuevo:**

> **NACE** si dos hojas de cálculo de temas ajenos —`OPE-02` (citas) y `RRHH-06`
> (evaluación del desempeño)— salen por encima de **0,90**, o si los diez vecinos
> más altos de cualquier `.xlsx` son todos `.xlsx`.
> **NO NACE** si los vecinos altos de cada hoja son hojas de su mismo tema.

### ✅ NACIDA EL MISMO DÍA — la condición se cumplió

**`OPE-02` ↔ `RRHH-06`: 0,972.** Citas y evaluación del desempeño. Por encima del
0,90 que se había escrito antes de ver ningún número, y sobre el par que ya estaba
nombrado — no uno elegido después para que encajara.

⚠️ **PROCEDENCIA, y no se borra: la cifra es RELATADA.** El censo lo ejecutó el
director y el número llegó por el arquitecto; esta casa no ha visto una sola fila
de la salida. Lo que sostiene la ficha no es el 0,972 — es que **la condición y el
par se escribieron antes**. Si alguien reabre esto, que lo sepa.

**Lo que sigue sin saberse**: cuántas de las vecindades del corpus son cruces de
envoltorio. Para eso el censo se extendió (ver más abajo) y hace falta una
ejecución; o las 42 filas en un fichero.

### La medida, sin embeber nada

El texto de cada trozo ya viaja en la metadata (`lib/pinecone/types.ts:3`), así que
se puede saber **qué par de trozos produjo cada vecino** sin una sola llamada
nueva. `lib/analysis/clase-de-trozo.ts` reconoce la plantilla y el censo devuelve
el reparto por documento **y agregado**, más los dos textos recortados de cada
vecino para que la clasificación se pueda desmentir leyéndola.

Lectura escrita antes de ejecutar: `resumen_x_resumen` mayoritario ⇒ el parecido es
de envoltorio y el tope de 6 descarta documentos buenos; `resumen_x_resumen` ≈ 0 ⇒
**B.246 falsada**, la plantilla no llega a dominar.

⚠️ **Un mutante sobrevivió a la primera batería**: aflojar el reconocedor a
`/Tabla con/` pasaba las 32 pruebas, y habría contado como resumen cualquier prosa
que mencionara una tabla. Cerrado con dos pruebas más. Y la primera vez que se dio
por superviviente, la mutación **no se había aplicado** —evidencia inválida—;
repetida en condiciones buenas, se confirmó. Salió bien por el camino equivocado.

### Y lo que cambiaría si nace

El tope de 6 (B.244) no estaría descartando basura: **estaría descartando
documentos relevantes para quedarse con hojas que casan por el envoltorio**. El
rerank es lo único que puede deshacerlo, y sólo puede elegir dentro de la lista
contaminada que recibe.

⚠️ **El arreglo no sería subir el umbral**, sino que el texto embebido no lleve la
frase hecha. Eso cambia lo que queda guardado, así que entra con su vía de
reparación delante (F-104) y nunca en el commit que lo descubre.

---

## ⚠️ 5.47 · El alcance real de A1, A3, A5 y A6 — vieron 1 ó 2 de 42 (16/09/2026)

Consecuencia directa de B.245, y va aquí para que no se lea sólo en el fichero de
tandas.

**El tope de 6 no cortó en esas pasadas**: no llegó a haber 6 candidatos. El filtro
de corpus los había dejado en 1 ó 2 antes de que el rerank opinara. Así que la
lectura correcta de una cifra de aquellas no es *«3 contradicciones entre los 6 que
miré»* sino:

> **«3 contradicciones entre este documento y el puñado que estaba marcado como
> revisado en ese momento»** — un puñado que no se eligió por relevancia, sino
> porque alguien pulsó un botón en ellos, a veces para otra medición.

**Lo que NO es un fallo, con la misma claridad**: `A1` y `A3` eran experimentos de
PAREJA y su aislamiento estaba declarado —el registro dice `1 ids de tanda` junto a
cada `1 candidato`—. Miden lo que dicen medir.

**Lo que hay que revisar es toda cifra leída como si hablara del corpus**, y cuál es
cuál está persistido: `seleccion.candidatos_recuperados` por pasada, con la consulta
en `SQL_A2A4_compuerta.sql`. Regla de lectura escrita antes de mirar: 1-2 = habla de
una pareja; 3-6 = subconjunto pequeño sin truncar; 7+ = subconjunto truncado en
silencio (B.244).

⚠️ **Para A5 y A6 en concreto**: se midieron sobre un corpus efectivo PEQUEÑO, no
de 42.

> ⚠️ **CORRECCIÓN DEL 16/09**: aquí ponía «de uno o dos documentos», y esa cifra
> **nunca se midió para esas pasadas** — salía de las tandas anotadas a mano. Lo
> medido el 16/09 es que HOY son tres. Para A5 y A6 la cifra está en
> `seleccion.candidatos_recuperados` de sus filas, y hasta que se lea **no se
> afirma ninguna**. No son falsas —el par sembrado salió por el camino correcto—
pero **su alcance es el de un par, no el de un corpus**, y así hay que enunciarlas.

---

## ⚠️ 5.48 · B.248 — el 0,50 no descarta nada, y el comentario que lo acompaña afirma una calibración que los datos desmienten (16/09/2026)

**Origen**: lectura del arquitecto **sobre los documentos reales**, que el director
le pasó. Es la primera afirmación de esta serie hecha por quien podía hacerla —ver
la regla del reparto en `CLAUDE.md`— y por eso entra como dato y no como hipótesis.

### Lo medido

`MKT-01` (identidad corporativa, 3.163 caracteres: logotipo, colores, tipografía,
uniformes, señalética) y `NOR-10` (esterilización, 61.148 caracteres: limpieza,
desinfección, autoclaves, trazabilidad). `NOR-10` **no menciona ni una vez**
logotipo, marca, identidad, corporativo ni Marketing; «uniforme» aparece **1 vez en
61.000 caracteres**. Lo único común es el vocabulario de la empresa: Dentavia, las
tres clínicas, Dirección de Operaciones, Coordinador de Calidad.

**El censo los da a 0,881.** Y en las 42 filas **el mínimo entre cualquier par es
~0,79**.

> **Con un umbral de 0,50, todo documento es vecino de todo documento. El umbral no
> descarta nada: está a 0,29 de la decisión más cercana que podría tomar.**

### ⚠️ LO QUE ESTA FICHA NO DICE, Y ES LA MITAD IMPORTANTE

**No dice que el modelo sea malo.** `multilingual-e5` comprime las similitudes en la
franja alta **por diseño**; 0,88 entre dos documentos de la misma empresa, con su
mismo vocabulario y sus mismos nombres propios, es comportamiento **esperable**, no
una avería.

**Tampoco dice que las mediciones estén mal.** Ver el bloque final.

**Lo que está sin calibrar es el 0,50**, un número elegido sin medirlo contra este
modelo.

### El agravante: el código afirma la calibración que no hubo

    lib/analysis/retrieval.ts:100-108
    /** Umbral mínimo de similitud.
     *  Rápido: 0.50 — calibrado para chunks de ~500 caracteres …
     *  No subir a ciegas sin volver a medir con el troceado actual. */

El comentario **dice «calibrado»**, y el censo enseña que ningún par baja de 0,79.
Un umbral calibrado contra estos datos no estaría donde no corta nunca.

⚠️ **Y el aviso apunta al lado contrario del problema**: advierte de *no subir* el
umbral a ciegas. El instinto era bueno —no tocar sin medir— pero el riesgo real no
era pasarse de alto: era estar tan bajo que el parámetro no existe. **Una nota que
protege un número inerte lo hace parecer decidido.**

### Lo que sobrevive de la ficha anterior y lo que no

**FALSADA en su forma actual.** La plantilla de tablas no es la causa: `MKT-01` y
`NOR-10` son **prosa** y no comparten ninguna.

**Sobrevive la observación, sin su papel explicativo**: `chunking.ts:882-884` sigue
metiendo ~52 caracteres de frase hecha en cada resumen de tabla, y eso sigue siendo
mejorable. **Deja de ser la explicación de los scores altos** y pasa a ser un
detalle menor dentro de B.248.

⚠️ **Y el reparto por clase del censo sigue mereciendo una ejecución**, ahora para
otra pregunta: no «¿es la plantilla?» —ya sabemos que no basta— sino **cuánto
aporta encima de un suelo que ya es 0,79**.

### Lo que haría falta para calibrarlo, y NO se hace aquí

El encargo dice que no se toque el umbral, y es lo correcto: cambiarlo sin medir
sería repetir exactamente el error que esta ficha describe.

⚠️ **Y el dato de calibración ya existe**: las 42×41 puntuaciones de pareja del
censo **son** el conjunto de calibración. No hay que fabricar nada — hay que mirar
la distribución y decidir con ella delante, que es lo que no se hizo la primera vez.

---

## ⚠️ 5.49 · EL ARGUMENTO COMPLETO DEL CORTE MUDO — amplía 5.42 (16/09/2026)

**La lectura del director, que es la buena y por eso va literal**: no se descarta
nada, todo entra como posible, y a posteriori se decide. **Es una arquitectura
defendible** —red ancha delante, juicio fino detrás— y el juez **sí** discrimina:
0 % de solapamiento con `CLI-05`, 95 % con `OPE-11`, contradicciones reales.

> ⚠️ **ALCANCE DE ESA CIFRA, anotado aquí y no sólo en 5.52**: sale de una pasada
> del 14/09 que recuperó **9 ó 10 candidatos con un tope de 6**. Sigue probando lo
> que se dijo —**el juez distingue**: CLI-05 entró, fue juzgado y dio 0 %— y **deja
> de valer como afirmación sobre el corpus**: ese análisis miró 6 de 9 ó 10.

**Lo que rompe ese diseño no es la red ancha: es el corte de 6.**

### Dónde está, exactamente

    lib/analysis/rerank.ts:89    callLLMJson(prompt …)        ← el modelo LEE los 25 y JUZGA
    lib/analysis/rerank.ts:92-104 selected.push({ … rerankReason, rerankConfidence })
    lib/analysis/rerank.ts:105   return selected.slice(0, maxSelected);   ← el corte

**El corte está DESPUÉS del razonamiento.** Un candidato que el modelo ha leído, ha
juzgado digno, y para el que ha **escrito una razón y una confianza**, lo tira una
operación aritmética que no lee ni la razón ni la confianza.

### ⚠️ Y es peor que truncar: trunca EN EL ORDEN EN QUE EL MODELO LOS ESCUPIÓ

`selected` se llena recorriendo `response.selected` tal cual. **No hay ningún
`sort`.** Así que `slice(0, 6)` se queda con los seis **primeros que el modelo
enumeró**, no con los seis de mayor confianza. Si el modelo listó una `baja` antes
que una `alta`, entra la `baja`.

    grep -rn "rerankConfidence" lib/ app/ components/ --include=*.ts --include=*.tsx

Tres apariciones: **dos escrituras** (`rerank.ts:101`, `:118`) y **una declaración
de tipo** (`types.ts:49`). **Ni un solo lector.** El campo que podría ordenar el
corte es un sello sin lector, del patrón que esta casa ya tiene fichado.

### 3 · QUÉ SE PAGA POR LOS QUE SE TIRAN — medido

**Entre recuperar y rerankear NO hay ninguna llamada a modelo.** Lo que hay es
trabajo determinista para **todos** los candidatos: `getChunksForDocuments` (una
lectura a Supabase dimensionada a los 25), `buildUnits`, `countCrossings`,
`selectUnitsWithinBudget` y los solapamientos estructurales. Cuesta tiempo del
presupuesto de la función, no dinero.

**El que cuesta dinero es el propio rerank, y paga por los 25:**

| Pieza | Valor | Dónde |
|---|---|---|
| presupuesto de fragmentos por candidato | **3.000 caracteres** | `retrieval.ts:92` |
| recorte por fragmento en el prompt | 300 caracteres | `rerank.ts:43` |
| candidatos en el prompt | **todos**, no los seleccionados | `rerank.ts:41-45` |
| modelo | **Haiku** (por defecto) | `anthropic-client.ts:89` |

Con 25 candidatos, el bloque de candidatos llega a **~75.000 caracteres** de entrada
—más la muestra de 3.000 del documento nuevo— en cada análisis.

⚠️ **Y AQUÍ VA LA DISTINCIÓN QUE NO SE PUEDE SALTAR, porque cambia el veredicto:**

**Leer los 25 NO es trabajo tirado. Leerlos ES el juicio.** El rerank no puede
descartar un candidato sin mirarlo; esa entrada está bien pagada.

**Lo tirado es otra cosa, y es más caro por token**: de los que el modelo **sí
seleccionó**, los que caen por el `slice` se llevan consigo una `reason` y una
`confidence` **que el modelo escribió**. Eso son **tokens de salida** —el lado caro—
generados, cobrados y descartados sin que nadie los lea.

> **Si el modelo selecciona 12 y el tope deja 6, se han pagado seis juicios
> escritos para tirarlos, y además se ha perdido lo que decían.**

Cuánto es «12» en la práctica no lo sabemos todavía: es el `seleccionados` de
`pipeline_counters` antes del corte, y **el corte ocurre antes de contar**
(`pipeline.ts:766` cuenta `reranked.length`, o sea el resultado YA cortado). **El
número de juicios tirados no se puede saber hoy con lo persistido.** Es el mismo
agujero de B.244 visto desde la contabilidad.

### Gravedad, con la forma corregida

No es «el sistema miente» todavía, porque hoy el filtro de corpus recorta antes
(B.245). **Es que el diseño que el director describe —red ancha, juicio fino— está
desactivado por un `slice`**, y se activará del todo el día que el corpus sea
elegible.

---

## ✅ 5.50 · LO QUE NO CAMBIA, y va escrito para que nadie lea lo anterior como «hay que rehacerlo todo» (16/09/2026)

**Las mediciones de estos días siguen valiendo. Cuando el sistema encuentra algo, lo
encuentra bien.**

- El par sembrado salió **siempre**, y por el camino correcto.
- El juez **discrimina**: 0 % con `CLI-05`, 95 % con `OPE-11`, contradicciones
  reales y verificadas contra el texto.
  ⚠️ **Con su alcance, corregido el 16/09**: la pasada de la que sale recuperó 9
  ó 10 candidatos con tope 6, así que **prueba que el juez distingue y NO prueba
  nada sobre el corpus** — miró 6 de 9 ó 10. Es corrección de alcance, no de
  veracidad: lo que encontró era cierto.
  ⚠️ **Y ESA CORRECCIÓN TENÍA SU PROPIO ERROR, corregido el 17/09**: «miró 6 de 9 ó
  10» suponía que el tope había cortado. Las pasadas de CLI-05 del 14/09
  seleccionaron **4 y 5** (§5.71): **miró 4 ó 5**, y los demás no los dejó fuera
  el tope sino el criterio del modelo. La conclusión se sostiene y sale más fuerte
  —de lo que miró, discriminó bien; sobre el corpus no prueba nada—; **la cifra y
  la causa estaban mal**. Ver la corrección al principio de §5.52.
- Los controles positivos hicieron su trabajo: `OPE-10` × `OPE-15` **se parecen de
  verdad** —nueve columnas idénticas y el mismo dominio—, así que el método sabe
  distinguir cuando hay algo que distinguir.
- Nada de lo encontrado era falso. Lo que está en cuestión es **el alcance de la
  búsqueda**, no la calidad de los hallazgos.

**Las tres fichas abiertas dicen dónde NO se ha mirado, no que lo mirado esté mal**:
B.245 (el filtro recortaba a 1-2), B.248 (el umbral no recorta nada) y B.244 (el
corte tira lo ya juzgado). Es la regla de la casa: *la curva de gravedad no describe
el sistema, describe dónde se ha mirado.*

---

## ⚠️ 5.51 · B.249 — «¿mordió alguna vez el corte?» no lo contesta `involved_documents`, y mi «nunca» era otro universal sin población (16/09/2026)

El director dice que en otros momentos tuvo **más de diez documentos indexados**, y
tiene razón en sospechar: si es así, la explicación de que los tres defectos hayan
sido inertes siempre se cae.

### 1 · ⚠️ LA PRIMERA CORRECCIÓN ES MÍA, Y ES LA MISMA DE SIEMPRE

Escribí, y varias veces: *«este corpus no ha producido jamás más de 2
candidatos»*, *«el tope no ha llegado a cortar»*. **Eso es un universal sobre todo
el historial, y lo apoyé en las pasadas registradas a mano en
`Tandas_Harness.md`** — no en la población persistida.

Es exactamente el fallo que llevo cinco días catalogando en otros: **una
enumeración de memoria que nadie verifica porque suena completa.** La diferencia es
que ahora hay un sitio donde contarlo, y el director hizo la pregunta que obliga a
ir a mirar.

### 2 · `involved_documents` NO CUENTA PARTICIPANTES

El encargo propone usarlo. **No sirve para eso**, y conviene saberlo antes de leer
ninguna cifra:

    lib/persist-analysis.ts:87-93
    const involvedSet = new Set<string>();
    if (analysis.isDuplicate && analysis.duplicateOf) involvedSet.add(...);
    for (const d of analysis.discrepancies)        involvedSet.add(d.existingDocument);
    for (const o of analysis.overlaps)             involvedSet.add(o.existingDocument);
    for (const d of analysis.minorInconsistencies) involvedSet.add(d.existingDocument);

Se construye **de los HALLAZGOS**. Un documento recuperado, seleccionado, mandado
al juez y que no produjo nada **no aparece**. Es una **cota inferior de los
seleccionados**, no un recuento de participantes. (Y son nombres, no ids —
`existingDocument`, `types.ts:216`.)

⚠️ **Pero sí detecta una imposibilidad, y por eso entra en el SQL**: un análisis
`quick` con **más de 6** documentos con hallazgo **contradice**
`MAX_SELECTED_QUICK = 6`. Si aparece alguno, o el tope no estaba puesto en esa
fecha, o esa pasada no es lo que su `analysis_type` dice. Las dos cosas son
interesantes.

### 3 · LO QUE SÍ CONTESTA: `pipeline_counters`, y donde no lo hay, la reconstrucción

**La respuesta exacta** es `seleccion.candidatos_recuperados` —lo que había
**antes** del corte—, y existe desde F-82. En las filas anteriores sale `NULL`, y
eso significa **«no se sabe»**, no «fue cero».

**Regla de lectura, escrita antes de ver un solo dato:**

| Lo que salga | Qué significa |
|---|---|
| `recuperados > 6` en un `quick` | **EL CORTE MORDIÓ.** Esa cifra se obtuvo con documentos descartados en silencio, y hay que decir cuál es |
| `recuperados > 25` en un `exhaustive` | mordió el tope de 25 |
| `recuperados <= 6` | no mordió: el rerank vio todo lo que había |
| `seleccionados = 6` clavados | sospechoso — es el tope exacto |
| `pipeline_counters` nulo | no se sabe, y se dice así |

### 4 · ⚠️ INDEXADO NO ES ELEGIBLE — la distinción que decide si el director tiene razón

«Diez documentos indexados» y «diez documentos que el análisis puede ver» son
cosas distintas: el filtro es `analysis_status = 'analizado'` (`vectors.ts:99`).
Diez indexados en `pendiente` dan **cero** candidatos. Es la misma distinción que
produjo B.245.

**Se puede reconstruir**, porque `mark-analyzed` deja fecha: para cada análisis del
historial, cuántos documentos tenían `reviewed_at` anterior.

⚠️ **Y es COTA INFERIOR por tres motivos que van escritos con el número**:

- `reviewed_at` lo escribe **sólo** `mark-analyzed` (`route.ts:113,153`). Los otros
  tres caminos a `analizado` —`index-text:393`, `promocion.ts:98`, `ingest:294`— no
  lo ponen, y **`ingest` y `promocion` lo dejan a NULL a propósito**.
- Un documento marcado y **borrado** después no tiene fila y no se cuenta.
- Un documento marcado y devuelto a `pendiente` por un cambio de contenido
  **perdió** su `reviewed_at`.

**Consecuencia para la lectura: si sale un número alto, es verdad. Si sale bajo, no
prueba nada.** Es justo la asimetría contraria a la que me convendría, y por eso se
escribe antes.

### 5 · Qué se hace con el resultado

`SQL_B249_historial.sql`, cuatro consultas, sólo lectura, cero créditos.

- **Si alguna pasada tiene `recuperados > 6`**: el corte mordió, y esa medición se
  obtuvo mirando una parte. **Va nombrada, con su fecha, a la ficha de la medición
  que la usó** — y las conclusiones que colgaran de ella se reenuncian.
- **Si ninguna lo tiene pero la reconstrucción da >6 elegibles en alguna fecha**:
  entonces hubo ocasión y no hay contador que lo diga, lo cual es **B.244 desde la
  contabilidad** — y se anota que no se puede saber.
- **Si todo sale ≤6**: mi «inerte» se sostiene, pero **con población medida en vez
  de con memoria**, que es la diferencia que importa.

**En los tres casos la ficha cambia. En ninguno se toca el código.**

---

## ⚠️ 5.52 · CERRADA CON POBLACIÓN: EL CORTE MORDIÓ — cierra 5.51 (16/09/2026)

> ⚠️ **CORRECCIÓN DEL 17/09/2026 — ESTE CIERRE ESTABA MAL CERRADO, y se deja el
> texto de abajo tal cual para que se vea qué se afirmó.**
>
> **Qué se afirmó:** que el **tope de 6** mordió en las cinco pasadas rápidas de
> CLI-05 del 14/09, descartando «3 ó 4» documentos cada una.
>
> **Con qué evidencia:** sólo con `recuperados` (9 y 10). La columna
> «Descartados en silencio» es `recuperados − 6`: **se calculó suponiendo que se
> habían seleccionado seis, sin leer cuántos se seleccionaron.** La regla de
> lectura de §5.51 —«`recuperados > 6` → el corte mordió»— lo daba por hecho.
>
> **Qué lo desmintió:** `seleccion.candidatos_seleccionados` de esas mismas
> pasadas, consultado por el director con `SQL_B253` y trasladado el 16/09: **4 y
> 5**. El tope de 6 sólo corta lo que el modelo eligió, y el modelo eligió menos de
> seis: **el tope no cortó ninguna.** Los que faltan los descartó **el criterio del
> modelo** —o ids no reconocidos, que el 14/09 no se contaban—. Ver §5.71.
>
> **Lo que sigue siendo verdad:** que se descartaron documentos **en silencio**, sin
> contador ni aviso. **Lo que era falso:** quién los descartó, y cuántos —fueron
> **más** de 3 ó 4, porque se seleccionaron 4 ó 5 y no 6—. La cifra exacta por fila
> no está en esta casa: el traslado dio «4 y 5» sin decir cuál era de cuál.
>
> **Y la frase de abajo «B.244 disparó, cinco veces»** queda igual de corregida: lo
> que disparó fue la pérdida muda de candidatos; **el tope, no**.

**Mi «inerte» queda falsado con datos, no con argumentos.** Del historial del
director, modo rápido con tope 6:

| Fecha | Documento | Modo | Recuperados | Descartados en silencio |
|---|---|---|---|---|
| 14/09 07:56 | CLI-05 | rápido | **10** | 4 |
| 14/09 07:53 | CLI-05 | rápido | **10** | 4 |
| 14/09 07:19 | CLI-05 | rápido | **9** | 3 |
| 14/09 20:30 | CLI-05 | rápido | **9** | 3 |
| 14/09 07:01 | CLI-05 | rápido | **9** | 3 |
| 14/09 07:02 | CLI-05 | exhaustivo | 9 | 0 (tope 25) |
| 12/09 09:23 | CLI-04 | rápido | 6 | 0 (justo en el tope) |
| 11/09 10:29 | Actas_Direccion | exhaustivo | 6 | 0 |

**Cinco pasadas rápidas descartaron 3 ó 4 documentos cada una, sin contador y sin
aviso.** B.244 deja de estar «armada y sin disparar»: **disparó**, cinco veces, el
14 de septiembre.

### Qué colgaba de esas pasadas

Se buscó por nombre en `claude/*.md`. **Ninguna tanda del harness usa `CLI-05`,
`CLI-04` ni `Actas_Direccion`**: son uso real del director, no mediciones nuestras.
`A1`, `A3`, `A5`, `A6`, `A7`, `A8` y los experimentos de pareja van sobre `OPE-*`,
`CLI-20`, `NOR-*` y `RRHH-*`, y **ninguno aparece en esta lista**.

⚠️ **CON UNA EXCEPCIÓN, Y ES MÍA, DE AYER.** En 5.50 escribí, como prueba de que el
juez discrimina:

> *«0 % de solapamiento con `CLI-05`, 95 % con `OPE-11`»*

**Esa cifra sale de una de estas pasadas.** Se reenuncia con su alcance real:

- **Lo que sigue en pie**: `CLI-05` entró, fue juzgado y dio 0 %; `OPE-11` dio
  95 %. El contraste es real y sigue demostrando que **el juez discrimina cuando
  ve los documentos**. El corte no tocó a los que sí llegaron.
- **Lo que ya no se puede decir**: que ese análisis mirase el corpus. Miró **6 de
  9 ó 10**, y los 3 ó 4 que faltaron no se sabe cuáles eran ni qué habrían dado.
- **La forma correcta**: «de lo que miró, discriminó bien». No «encontró lo que
  había».

**Es una corrección de alcance, no de veracidad.** El hallazgo era cierto; la
frase prometía una cobertura que la pasada no tuvo.

---

## ⚠️ 5.53 · LA RECONSTRUCCIÓN POR `reviewed_at` ERA CIEGA, Y DEVOLVÍA CEROS CON PINTA DE DATO (16/09/2026)

`elegibles_al_menos` daba **0** en todas las filas anteriores al 15/09, incluidas
las que recuperaron **diez** candidatos. **Diez candidatos no salen de un corpus
elegible de cero.**

Yo había declarado que era «cota inferior». **Eso fue insuficiente**: una cota
inferior que vale cero cuando la verdad es diez no es una cota, es una pantalla
apagada — y la consulta la presentaba como un número más de la fila. Es
exactamente el fallo del `org_id`: **un cero que fabrica el propio instrumento y
se lee como medida.**

### Por qué se queda ciega

> ⚠️ **ESTE APARTADO DECÍA OTRA COSA Y ERA UNA HIPÓTESIS MÍA SIN VERIFICAR.**
> Decía que la causa que mandaba era el **borrado y recreación del corpus** —que
> las filas del 14/09 ya no existen—. **El director la falsó el mismo día**, con
> dos nombres propios: `CLI-04` y `CLI-05` llegaron a `analizado` por subida
> manual indexada desde el chat (`ingest:294`), que nunca los mandó a revisar y
> por eso no les puso fecha. Sus filas existen; lo que no existe es el dato.
> La causa verdadera está en **5.63 (B.252)**, y no es circunstancial: es
> estructural.

Las tres que declaré (`reviewed_at` sólo lo escribe `mark-analyzed`; los borrados
no dejan fila; un cambio de contenido lo pone a NULL) son ciertas. **La que manda
es la PRIMERA**, y no por descuido del sistema sino porque el campo contesta otra
pregunta: `reviewed_at` responde «¿pasó por la bandeja?», no «¿estaba
analizado?». Tres de los cuatro caminos a `analizado` no dejan ninguna fecha.

**Y eso la mata para siempre, no para hoy**: en cualquier corpus donde se indexe
desde el chat es ciega POR CONSTRUCCIÓN. Por eso la consulta se ha retirado entera
del fichero, con su motivo en el hueco.

### Qué se ha hecho con ella

**No se retira: se la obliga a declararse.** La consulta 3 ya no devuelve un
recuento a secas — devuelve el recuento **y una columna `fiabilidad`** que dice
`*** CIEGA: recuperó candidatos y no queda ni un marcado. NO USAR ***` cuando el
propio dato se contradice. **El número sólo vale cuando la columna dice
`coherente`.**

⚠️ Es la forma que esta casa ya tiene escrita para los ceros: **un cero confirma si
y sólo si el camino que lo produjo puede demostrar que buscó.** Aquí no podía, y
ahora lo dice él mismo en vez de esperar a que alguien lo note.

### Y el segundo fallo del fichero, corregido

`involved_documents` es **jsonb**, no array: `array_length(jsonb, integer)` no
existe y **las consultas 2 y 3 no llegaban a correr**. Ahora `jsonb_array_length`.
Corregido en el fichero, no sólo en la respuesta.

---

## ⚠️ 5.54 · LA LISTA DE LATENTES, MEDIDA POR MUTACIÓN — 19 de 24 constantes no tienen caso decisivo (16/09/2026)

Hecha con la disciplina de la regla nueva de `CLAUDE.md`: **no se enumeran las
constantes que uno recuerda**, se recorre cada punto donde el código reduce,
filtra, ordena o trunca, **se muta cada una y se corre la suite entera**. La que no
rompe ni un test no está probada.

**Resultado: 24 constantes mutadas, 24 pasadas de suite. 19 sobreviven.**

| Constante | Valor | Población que la activa | ¿El corpus puede producirla? | Caso decisivo |
|---|---|---|---|---|
| `SCORE_THRESHOLD_QUICK` | 0,50 | un par por debajo del umbral | **no** — el suelo es 0,79 (B.248) | ⚠️ **sí, pero en el censo**, no en el retrieval |
| `SCORE_THRESHOLD_EXHAUSTIVE` | 0,45 | un par entre 0,45 y 0,50 | **no** — cero en 42 filas | ⚠️ igual |
| `MIN_UNIQUE_PCT` | 90 | columna casi única | sí | **sí** |
| `LIMITE_DE_TEXTO` | 20.000 | documento más largo | sí (NOR-10: 61.148) | **sí** |
| `MAX_CONTEXT_CHARS` | 30.000 | contexto que desborda | sí | **sí** |
| `MAX_SELECTED_QUICK` | 6 | **>6 candidatos** | ⚠️ **SÍ, Y YA OCURRIÓ** (5.52) | **NO** |
| `MAX_SELECTED_EXHAUSTIVE` | 25 | >25 candidatos | sí — `OPE-07` tiene 25 vecinos | **NO** |
| `TOP_K_POR_CONSULTA` | 25 | >25 matches por consulta | sí | **NO** |
| `FRAGMENT_BUDGET_CHARS_QUICK` | 3.000 | candidato con más texto | sí, casi siempre | **NO** |
| `MAX_FRAGMENTS_PER_DOC_QUICK` | 25 | >25 fragmentos por documento | sí | **NO** |
| `MAX_CLAIMS` | 40 | documento con >40 afirmaciones | sí (NOR-10) | **NO** |
| `NEW_DOC_LIMIT_QUICK` | 6.000 | documento >6.000 caracteres | sí — casi todos | **NO** |
| `HIGH_OVERLAP_THRESHOLD` | 30 | solapamiento ≥30 % | sí (95 % con OPE-11) | **NO** |
| `MAX_DOUBLE_CHECK_CANDIDATES` | 50 | >50 candidatas | sí en exhaustivo | **NO** |
| `FIRST_BATCH_SIZE` | 15 | >15 candidatas | sí (se vieron 17) | **NO** |
| `SECOND_BATCH_SIZE` | 10 | resto tras el primer lote | sí | **NO** |
| `CORPUS_SCORE_THRESHOLD` | 0,50 | ⚠️ **segundo 0,50, en `verify-claims`** | no — mismo suelo | **NO** |
| `MAX_CORPUS_FRAGMENTS` | 4 | >4 fragmentos por afirmación | sí | **NO** |
| `MAX_PER_CALL` | 15 | >15 hallazgos por documento | sí | **NO** |
| `TOP_K` (chat) | 15 | >15 chunks relevantes | sí | **NO** |
| `MAX_DOCUMENTS` (chat) | 6 | >6 documentos relevantes | ⚠️ **sí — todos son vecinos de todos** | **NO** |
| `MIN_SCORE` (chat) | 0,3 | par por debajo de 0,3 | **no** — suelo 0,79 | **NO** |
| `MAX_SELECTION` (bandeja) | 20 | seleccionar >20 | sí | **NO** |
| `MAX_EXHAUSTIVE_SELECTION` | 3 | seleccionar >3 en exhaustivo | sí | **NO** |

### Las tres lecturas que salen de la tabla

**1 · ⚠️ `MAX_DOCUMENTS = 6` EN EL CHAT ES EL MISMO DEFECTO QUE EL RERANK, Y NADIE
LO HABÍA MIRADO.** El chat recorta a 6 documentos (`rag.ts:34`) y su umbral
(`MIN_SCORE = 0,3`) es **aún más permisivo** que el 0,50 del análisis. Con un suelo
de 0,79, **toda pregunta del chat recupera todo el corpus y se queda con 6**, sin
avisar. Es B.244 en el camino que el cliente usa a diario, y no tiene ficha.

**2 · El `0,50` está en DOS sitios.** Exporté el de `retrieval.ts` para que el
censo no lo copiara, y `verify-claims.ts:65` tiene el suyo propio —
`CORPUS_SCORE_THRESHOLD`—. Es la regla del criterio implementado una sola vez, con
un incumplimiento que llevaba ahí desde antes y que nadie había contado.

**3 · Los umbrales mueren, pero por el consumidor equivocado.** Las pruebas que los
matan están en `vecindario.test.ts` —el censo que escribí ayer— y demuestran que
cambiar el umbral cambia **el resultado del censo**. `retrieveCandidates`, que es
quien lo usa en producción, **no tiene ni una prueba que lo ejercite**. Así que en
la columna dice «sí» con una nota, y la nota importa: **tener caso decisivo en un
consumidor no cubre al otro.**

### Lo que NO se hace aquí

Nada. Ni se ordena el corte, ni se instrumenta, ni se toca un umbral. La lista es
el inventario que el orden de Fable pide en su paso 0, y los pasos 1, 2 y 3 son
del director.

---

## ✅ 5.55 · EL CORTE YA ORDENA — paso 1 de 5.42, arreglado (16/09/2026)

`lib/analysis/orden-del-rerank.ts`, 20 pruebas. El `slice(0, maxSelected)` de
`rerank.ts` ya no corta sobre el orden en que el modelo enumeró los candidatos.

### La respuesta a las dos preguntas que el arquitecto hizo antes de dejar escribir

**1 · ¿Y si el modelo no devuelve confianza?**

Hasta hoy: `sel.confidence || 'media'`. **Eso convertía la ausencia en el nivel
intermedio** — un valor que ya tenía dueño, el modelo que sí dice «media». Es la
regla de la casa sobre el tipo que no puede expresar el caso, aplicada a un enum.

Ahora hay un cuarto valor, **`sin_declarar`**, y va **el último**, no en medio. El
motivo se puede defender: entre un candidato con valoración declarada y uno sin
ella, el declarado trae más evidencia detrás. Falla hacia lo que el modelo sí
respaldó.

⚠️ Y **no se adivina**: `normalizarConfianza` manda a `sin_declarar` todo lo que no
sea exactamente `alta`, `media` o `baja` — vacío, `null`, `'ALTA'`, `'muy alta'`,
un número. Traducir una palabra inventada al nivel más parecido sería inventar la
valoración que falta.

**2 · ¿Y los empates? Un desempate por orden de enumeración sería volver a lo de
hoy por la puerta de atrás.**

Exacto, y por eso no se usa. Con tres niveles sobre veinticinco candidatos **los
empates son el caso normal, no la excepción**: el desempate decide casi siempre.
Los tres criterios, en orden:

| # | Criterio | Por qué |
|---|---|---|
| 1 | confianza declarada | es el juicio del modelo, lo único que mira el contenido |
| 2 | **`maxScore`** | una CANTIDAD REAL y determinista. ⚠️ Señal débil y se declara débil —los scores están comprimidos entre 0,79 y 0,99 (B.248)— pero una señal débil y estable vence a ninguna señal |
| 3 | `documentId` | arbitrario, y se dice que lo es. Su virtud es ser **determinista** |

⚠️ **Y LO QUE ESTO ARREGLA NO ES SÓLO «ELEGIR MEJOR»: ES QUE ANTES NO ERA
REPRODUCIBLE.** El orden de enumeración lo decide la salida del modelo, así que dos
análisis idénticos podían cortar distinto. Ahora el corte es el mismo con los
mismos candidatos, que es condición para poder medirlo.

### El contador que impide que el arreglo se apague en silencio

`seleccion.candidatos_sin_confianza`, declarado a mano en el catálogo — que es
para lo que existe esa lista. **Si esto se acerca a `candidatos_seleccionados`, el
criterio 1 se ha apagado** y el corte lo decide el score.

Eso **no** sería volver al fallo —seguiría siendo determinista, y hay una prueba
que lo fija— pero sí es un cambio de régimen, y un cambio de régimen mudo es el que
nadie ve. Se cuenta **siempre, incluido el cero**: aquí el cero es la noticia
buena.

### El caso decisivo, y su mutación

**Siete candidatos desordenados**, con las `alta` al final como llegarían si el
modelo las enumerase así. Con el comportamiento de ayer entraban cuatro `baja` y
dos `media`, y **las dos `alta` se caían**.

**Mutado a devolver el orden de enumeración: 11 pruebas en rojo**, incluido el caso
decisivo. **Mutado `sin_declarar` a valer lo mismo que `media`: 3 en rojo**,
incluida la que existe sólo para ese caso. Ninguna de las dos es adorno.

### ⚠️ EL FALLBACK NO PASA POR AQUÍ, y es correcto

Cuando el modelo falla (`rerank.ts` catch), los candidatos salen todos con
`'baja'`. **No `sin_declarar`**: eso significaría «el modelo no lo dijo», y aquí el
modelo ni siquiera llegó a hablar. El fallo de etapa ya lo cuenta
`recordStageFailure`.

---

## ✅ 5.56 · EL `0,50` ESTABA EN DOS SITIOS, Y YA NO (16/09/2026)

`verify-claims.ts:65` tenía su propio `CORPUS_SCORE_THRESHOLD = 0.50`, idéntico al
de `retrieval.ts` **sin que nadie hubiera decidido que debían coincidir**: dos
números iguales por costumbre, no por acuerdo. Ahora se importa.

**Lo que lo hacía urgente y no cosmético**: B.248 dice que ese 0,50 está sin
calibrar, y calibrarlo es cosa de días. **Con dos copias, la calibración habría
movido una y dejado la otra atrás, en silencio y sin que ninguna prueba se
quejara.** Es literalmente el caso que `CLAUDE.md` describe: *«la distinción se hizo
para una mitad y no se llevó a la otra»*.

Son la **misma pregunta en distinta granularidad** —«¿esto se parece lo bastante
como para mirarlo?»—, una sobre documentos y otra sobre fragmentos. Si algún día
tienen que separarse, **la separación se bautiza y se razona**; lo que no vale es
que se separen solas.

`grep "= 0\.50;" lib/analysis/` devuelve **una sola línea**.

⚠️ **La guarda es ESTRUCTURAL, no una prueba**: la constante local ya no existe, así
que no hay nada que se pueda mover por su cuenta. Se dice porque una guarda
estructural no aparece en ningún contador de cobertura y conviene que conste.

---

## ⚠️ 5.57 · B.250 — el corte del CHAT: lo miré esperando el mismo defecto y es EL EJEMPLO BUENO (16/09/2026)

**Predicción escrita antes de leer**: que el chat ordenaba por score (porque
Pinecone devuelve los matches ordenados) y que **no** había aviso al usuario.
**La primera mitad acertada, la segunda FALLADA — y fallada a favor del
producto.**

### Las dos respuestas

**1 · ¿El chat ordena antes de quedarse con seis?** **SÍ.**

    lib/rag.ts:269-271
    const topDocs = [...docScores.values()]
      .sort((a, b) => b.maxScore - a.maxScore)
      .slice(0, MAX_DOCUMENTS);

**No tiene el defecto del rerank.** Ordena por el mejor parecido y luego corta.

**2 · ¿Hay aviso al usuario?** **SÍ, y está bien escrito.**

    lib/rag.ts:242-245   relevantDocsFound = docScores.size   // ANTES de recortar
    components/ChatMessage.tsx:134-157   lo pinta si relevantDocsFound > documentsUsed
    messages/es.json:71

> *«He respondido con {used} de los {found} documentos relevantes que había. Para
> preguntas que abarcan mucha documentación, el agente da respuestas más completas:
> busca en varias vueltas y lee los documentos enteros.»*

Y el comentario que lo acompaña en `rag.ts` dice exactamente la regla que al
análisis le falta: *«Si se descartan, hay que decírselo al usuario (A.1): una
respuesta incompleta en silencio es peor que una respuesta con aviso.»*

### ⚠️ ASÍ QUE ESTA FICHA CORRIGE LA MÍA DE AYER

En 5.54 escribí, como tercera lectura de la lista de latentes:

> *«`MAX_DOCUMENTS = 6` en el chat es el mismo defecto que el rerank y nadie lo
> había mirado… es B.244 en el camino que el cliente usa a diario, y no tiene
> ficha.»*

**Falso.** Lo escribí desde la tabla de mutantes —donde `MAX_DOCUMENTS` sobrevive,
y eso sí es cierto— **sin abrir el consumidor**. Es exactamente la regla de la casa
que llevo citando toda la semana, incumplida por mí en la misma página en que la
citaba: *dar por inexistente algo que sí está, tras leer el productor y no el
consumidor*.

### Lo que SÍ queda abierto en el chat, que no es nada de lo que dije

| Qué | Estado |
|---|---|
| ordena antes de cortar | ✅ lo hace |
| avisa al usuario | ✅ lo hace |
| `MAX_DOCUMENTS = 6` tiene caso decisivo | ❌ **no** — el mutante sobrevive. Es un latente de prueba, no de comportamiento |
| `MIN_SCORE = 0,3` | ⚠️ **inerte**, y más que el 0,50: con un suelo de 0,79 no descarta nada. Es B.248 en el chat |
| el aviso cuenta sobre `TOP_K = 15` chunks | el `found` está acotado por cuántos documentos distintos aparecen en 15 trozos, no por el corpus entero. **El aviso es honesto pero mide una población más pequeña de la que el usuario imagina** |

**Así que el chat no sube de puesto: baja.** Lo que hay que llevarle del análisis no
es el arreglo — es la prueba que le falta a su tope.

---

## QUÉ MIRA EL DIRECTOR DE ESTE COMMIT

⚠️ **Nada. Y conviene decirlo en vez de inventarle un gesto.**

El corte sólo se nota cuando hay **más de 6 candidatos**, y con el filtro de corpus
como está —casi todo `pendiente`, B.245— sus análisis recuperan **tres**. **El
arreglo es invisible en su pantalla hasta que el corpus sea elegible.**

Por eso **la evidencia de este commit es la batería, y se escribe como tal**: 20
pruebas, un caso decisivo con siete candidatos desordenados, y dos mutaciones que
matan 11 y 3 casos respectivamente. No hay captura de pantalla que enseñar, y una
que se enseñara no probaría nada.

**Lo que sí puede hacer, si quiere verlo alguna vez**: es el mismo montaje que
lleva dos días pendiente —marcar documentos como revisados hasta pasar de seis— y
sigue siendo **irreversible** y **suyo**. No hace falta para este arreglo.

---

## ✅ 5.58 · EL CORTE YA NO ES MUDO — paso 2 de 5.42 (16/09/2026)

### 2 · DÓNDE SE PINTA — la respuesta que el arquitecto no tenía

**Predicción escrita antes de mirar: en las dos puertas, mismo componente.
Acertada.**

    components/AnalysisModal.tsx:202        <SelectionLimitNotice … />   ← bandeja
    components/improvement/ChatPanel.tsx:287 <SelectionLimitNotice … />   ← chat

Y en los dos sitios va **el primero de todo**, antes de los hallazgos, con el
mismo motivo escrito en los dos: *«leerla después de los hallazgos invitaría a
creer que la lista está completa»*.

**Así que los dos avisos comparten sitio y forma**, como pedía el encargo:
`components/AvisoDeCobertura.tsx` los envuelve, sustituye a
`SelectionLimitNotice` en las dos puertas y lo sigue usando dentro.

⚠️ **Lo único que NO comparten es el color, y es deliberado.** Dicen cosas de
distinta especie: el de documentos describe **comportamiento normal** —se comparó
contra los más afines porque así funciona la recuperación— y el de filas es un
**límite real**: esas filas no las miró nadie. Pintar el primero en amarillo
sembraría desconfianza sobre algo correcto, que es exactamente lo que la
redacción del director evita.

### 1 · LA REDACCIÓN, Y POR QUÉ ESTA Y NO OTRA

> Se compararon los **N** documentos más afines a éste. Otros **M** tienen menor
> afinidad con este documento y no entraron en la comparación.

No dice «N documentos no se tuvieron en cuenta». **No quedaron fuera por un fallo
ni porque sí: quedaron fuera por ranking de afinidad**, que es como funciona
cualquier recuperación seria. La frase enseña eso.

**La decisión de pintar vive en lógica pura, no en el JSX**
(`lib/analysis/cobertura-de-candidatos.ts`), porque una decisión escrita dentro de
un componente es una decisión sin vigilancia — en esta casa las pruebas son de
lógica pura, y ahí se puede mutar y ver morir un caso.

**Calla en dos sitios, y callar es lo correcto en los dos:**

| Caso | Por qué no se pinta |
|---|---|
| sin dato | los análisis anteriores a este despliegue no lo traen y la bandeja relee jsonb viejos. Escribir «se compararon 0» mentiría sobre un análisis que sí comparó |
| `comparados === 0` | no hubo comparación, y de eso ya habla el resultado. Un aviso de alcance encima sería ruido sobre una noticia mayor |

### El contador, y el agujero que cierra

`seleccion.candidatos_cortados_por_tope`, declarado a mano en el catálogo.

⚠️ **No es la resta de los dos que ya había.** `recuperados − seleccionados` mezcla
dos cosas distintas —los que el rerank descartó **por criterio** y los que cortó
**por presupuesto**— y hasta hoy no se podían separar. Ayer escribí en 5.49 que
*«el número de juicios tirados no se puede saber hoy con lo persistido»*. **Ya se
puede.** Cada uno de ellos es un juicio escrito por el modelo, con su razón y su
confianza, pagado en tokens de salida y tirado sin leer.

### 3 · EL REANÁLISIS, con el matiz respetado

> Tras aplicar correcciones conviene reanalizar: al cambiar el contenido cambia
> también qué documentos son más afines, y la comparación puede incorporar otros.

⚠️ **Lo que el texto NO dice, a propósito**: que los documentos bajen en el ranking
por tener sus problemas arreglados. **El ranking es de parecido, no de salud.** Lo
que cambia al corregir es el contenido, y por eso cambia el mapa de afinidades. La
frase promete eso y nada más.

### La cadena de cinco puntos, y por qué se cuenta

El dato viaja por sitios que el compilador **no** vigila, porque la prop es
opcional: `problems.ts` (RawAnalysis) → `useCrossDocAnalysis` (estado, refresco y
`return`) → `ImprovementModal` (destructuring y prop) → `ChatPanel`. **Cinco
puntos, y `tsc` pasaba en verde con cuatro de los cinco hechos.**

Y las **dos listas cerradas** —`analyze-v2:794` y `worker:169`— cuyos propios
comentarios cuentan que a `stageFailures` le pasó justo esto: se añadió al tipo y
al jsonb y no ahí, y el aviso salía por una puerta y no por la otra. **Las dos, en
el mismo commit.**

### El caso decisivo y sus mutantes

12 pruebas. **Mutado a que el aviso nunca aparezca: 3 en rojo**, incluido el caso
decisivo —diez afines y seis comparados— y el del borde: **un solo documento fuera
ya enciende el aviso**. **Mutado a callar siempre: 7 en rojo.**

### ⚠️ QUÉ MIRA EL DIRECTOR: NADA, Y ES LA SEGUNDA VEZ QUE PASA

El aviso sólo aparece con **más de seis candidatos**, y con el filtro de corpus
como está (B.245) sus análisis recuperan **tres**. **Invisible en su pantalla**,
igual que el arreglo del orden. La evidencia es la batería.

**Y sobre si merece la pena enseñarlo también cuando NO se descarta nada** —«se
compararon los N documentos afines», a secas—:

**Sí tiene sentido, y no lo decido yo.** Los argumentos, los dos:

- **A favor**: sería **lo único visible hoy** en su corpus, diría algo verdadero, y
  convierte un silencio en una cifra comprobable — el mismo principio por el que
  el chat enseña «respondí con 3 de 5».
- **En contra**: con dos o tres candidatos la frase es casi vacía —«se comparó 1
  documento»— y un aviso que aparece siempre deja de leerse. Y el día que el
  corpus sea elegible, el caso interesante es justo el otro.

**Está a una condición de distancia**: `resumirCobertura` ya calcula el caso, y
cambiar de idea es quitar `&& frase.hayResto` de una línea de
`AvisoDeCobertura.tsx`. **Lo decide el director.**

### Lo que NO entra en este commit

La severidad —contradicciones primero, estilo al final— es interfaz sobre datos que
ya viajan, y va aparte. No se ha tocado.

---

## ✅ 5.59 · EL AVISO SALE SIEMPRE — decisión del director (16/09/2026)

Se quita el `&& frase.hayResto`. **La razón la puso el director y no estaba en la
lista de argumentos que yo había escrito:**

> Hoy no tiene **ninguna forma** de saber contra cuántos documentos se comparó un
> análisis. Ver «se comparó con 2» le dice de un vistazo que su corpus efectivo es
> minúsculo — que es exactamente lo que nos ha costado **tres días** descubrir con
> SQL.

Y la respuesta a mi objeción, que la acepta y la supera: *«un aviso que sale
siempre pierde fuerza, sí. Pero el silencio de hoy no tiene ninguna.»*

### ⚠️ EL CASO SIN RESTO NO ES EL MISMO TEXTO CON UN CERO

«Se compararon los 2 documentos más afines a éste», a secas, **se lee como si
hubiera más y no se dijera cuántos** — que es justo la duda que este aviso existe
para quitar. Las dos frases dicen cosas distintas:

| Caso | Frase |
|---|---|
| **con resto** | *Se compararon los **6** documentos más afines a éste. Otros **3** tienen menor afinidad con este documento y no entraron en la comparación.* |
| **sin resto** | *Se compararon los **2** documentos afines a éste, **que eran todos los que había**.* |
| **sin resto, uno** | *Se comparó con el **único** documento afín a éste que hay en tu corpus.* |
| **con resto, uno fuera** | *…**Otro** tiene menor afinidad…* |

El singular va aparte a propósito: **«los 1 documentos» destruye la credibilidad
de un aviso cuyo único trabajo es que se le crea.**

### La redacción está bajo prueba, y por eso pudo morir

`textoDeCobertura` vive en el módulo puro, no en el JSX: **una redacción dentro de
un componente es una redacción sin prueba.** 21 casos.

- **Mutado el caso sin resto a la redacción del caso con resto: 4 en rojo**,
  incluido el que prohíbe literalmente la frase ambigua.
- **Mutado el singular: 1 en rojo.**

### ⚠️ Y ESTA VEZ SÍ HAY ALGO QUE MIRAR — la primera evidencia en pantalla

**Dónde**: en el modal del análisis, **arriba del todo, antes de los hallazgos**,
en una caja gris clara con un icono de información redondo. Por las dos puertas —
bandeja y chat—, porque el componente es el mismo.

**Qué frase exacta**, con su corpus de hoy (**tres** candidatos, medido):

> ⓘ Se compararon los **2** documentos afines a éste, que eran todos los que había.
> Tras aplicar correcciones conviene reanalizar: al cambiar el contenido cambia
> también qué documentos son más afines, y la comparación puede incorporar otros.

o, si sólo hubo uno:

> ⓘ Se comparó con el **único** documento afín a éste que hay en tu corpus. Tras
> aplicar correcciones conviene reanalizar: …

**Lo que NO debe ver**: la palabra «más afines» ni «menor afinidad» — si aparecen
con su corpus actual, el número de candidatos no es el que creemos y hay que
mirarlo. **Y si no ve nada**, el análisis venía sin el campo: es un jsonb anterior
a este despliegue releído desde la bandeja, no un fallo.

⚠️ **Es la primera evidencia en pantalla de todo este frente.** Los dos commits
anteriores —el orden del corte y el aviso condicionado— eran invisibles en su
corpus, y así se dijeron.
---

## ✅ 5.60 · EL AVISO DE COBERTURA, EJERCIDO EN PANTALLA — cierra 5.58 (16/09/2026)

Copiado literal de la pantalla del director, análisis rápido de `CLI-20`:

> *«Se compararon los 2 documentos más afines a éste. **Otro** tiene menor
> afinidad con este documento y no entró en la comparación. Tras aplicar
> correcciones conviene reanalizar: al cambiar el contenido cambia también qué
> documentos son más afines, y la comparación puede incorporar otros.»*

**El singular funciona** —«Otro tiene», no «Otros 1»— y sale **arriba del todo,
antes de los hallazgos**, como estaba escrito. Es la primera evidencia en pantalla
de todo este frente, y el grado de «declarado» sube de CONTADO a **EJERCIDO**.

---

## ⚠️ 5.61 · B.251 — el aviso atribuye una causa que no puede saber, y es mío de ayer (16/09/2026)

### Lo que no cuadra, y cuadra mal por mi culpa

Tres candidatos, dos comparados, y `MAX_SELECTED_QUICK = 6`. **Con tres candidatos
el tope no puede cortar nada.** Así que el que se llevó al tercero **no fue el
tope** — y el aviso dice «tiene menor afinidad y no entró en la comparación», que
es la explicación del tope.

⚠️ **Y lo peor no es el error: es que yo ya lo había escrito.** En 5.49 y 5.53, de
mi puño:

> *«`recuperados − seleccionados` mezcla dos cosas distintas —los que el rerank
> descartó por criterio y los que cortó por presupuesto— y hasta hoy no se podían
> separar.»*

**Y ayer construí el aviso con esa resta exacta**, poniéndole encima la redacción
que el director había escrito para el caso del tope. Añadí `cortadosPorTope`
—el contador que separa las dos causas— **en el mismo commit**, y no lo usé para
el mensaje. La pieza correcta estaba en mi mano.

### El censo por capacidad: son TRES vías, no dos

Entre `candidatos_recuperados` y `candidatos_seleccionados` no hay nada en el
pipeline (`pipeline.ts:744-771`: retrieval → contador → rerank → contador). Todas
las pérdidas ocurren dentro de `rerankCandidates`:

| Vía | Dónde | Qué es | ¿Contada? |
|---|---|---|---|
| **(a) criterio** | el modelo no lo nombra en `selected` | lo miró y decidió que no aporta — el prompt le pide «indicios de contenido concreto», no tema común | **NO** |
| **(b) desajuste de id** | `rerank.ts:94` — `if (!candidate) continue;` | el modelo lo eligió y devolvió un `documentId` que no casa. **Se tira en silencio: ni contador ni log** | **NO** |
| **(c) tope** | `rerank.ts:105` — el `slice` | el presupuesto | **sí**, desde ayer |

⚠️ **(b) ES LA VÍA QUE NADIE HABÍA ENUMERADO**, y es la respuesta a la segunda
pregunta del encargo. No es una decisión: es un **fallo de emparejamiento** que se
traga un candidato sin dejar rastro. Y el propio prompt demuestra que se anticipó
—«IMPORTANTE: el campo documentId debe ser el documentId real que te paso»— así
que alguien vio venir que el modelo podía equivocarse **y lo resolvió callando**.

### Por qué el aviso miente, y en qué grado exacto

- Si el tercero cayó por **(c)**, la frase es **verdad**: el orden es por confianza
  y luego por score, así que lo cortado es la cola del ranking.
- Si cayó por **(a)**, la frase es **falsa en la causa**: el modelo lo leyó y lo
  descartó por criterio, no por tener menos parecido. De hecho podía tener MÁS
  score que uno de los que entraron.
- Si cayó por **(b)**, la frase **tapa un defecto** presentándolo como una decisión
  de diseño.

**Y hoy no se puede distinguir cuál de las tres fue.** `cortadosPorTope` dice si fue
(c); (a) y (b) siguen fundidas.

⚠️ **Lo que NO es**: un aviso que lleve al usuario a hacer algo equivocado. En los
tres casos el documento no se comparó y el sistema tenía un motivo. **Es una
afirmación sobre la CAUSA que no podemos respaldar**, y esta casa no envía esas.

### Lo que decide el SQL, y está escrito antes de verlo

`SQL_B251_pasada_CLI20.sql`. Si `cortados_por_tope = 0` —lo esperado con tres
candidatos— entonces el aviso atribuyó al tope algo que no fue del tope, y B.251
queda confirmada con población de una pasada real en producción.

**No se arregla aquí.** El encargo dice primero saber qué descartó al tercero, y
las dos salidas posibles piden arreglos distintos: contar (a) y (b) por separado,
o hacer la redacción neutra en la causa.

### ⚠️ Y una tercera cosa que esta pasada desmiente, también mía

Llevo tres días escribiendo que su corpus efectivo es **«de uno o dos»**. **Eran
tres**, y tres candidatos exigen al menos tres documentos `analizado` además de
`CLI-20`. No tumba B.245 —el filtro sigue siendo el portero— pero **la cifra la
puse yo de memoria, otra vez, sobre las pasadas anotadas a mano**. La consulta 3
del fichero dice cuántos elegibles hay de verdad y quiénes son.

---

## ⚠️ 5.62 · Un protocolo de urgencias comparado contra un tarifario — población en pantalla para 5.48 (16/09/2026)

De la misma pantalla:

- aviso de filas: *«28 de 39 filas de la hoja "Tarifas concertadas" de **OPE-11**
  quedaron fuera por tamaño»*
- resumen: `CLI-20` tiene **15 % de solapamiento** con `OPE-11`

**`OPE-11` es un tarifario de precios con nueve columnas de importes y
profesionales. `CLI-20` es un protocolo de urgencias dentales.** Los dos leídos por
el arquitecto.

⚠️ **Esto es B.248 dejando de ser un censo y pasando a ser producto.** Hasta hoy el
argumento era una tabla de scores: «el suelo del corpus es 0,79, el umbral de 0,50
no descarta nada, todo se parece a todo». Ahora se ve **qué compra eso**:

> **Uno de los dos documentos contra los que se comparó un protocolo clínico era
> una lista de precios. El análisis gastó su presupuesto ahí —28 de 39 filas de una
> tabla de tarifas— y dejó fuera un tercer documento que podría ser relevante de
> verdad.**

No es que el sistema fallara: hizo exactamente lo que se le pidió con el umbral que
tiene. **El umbral es lo que está mal**, y ésta es la mejor prueba que tenemos para
la calibración — porque no hay que explicarla con una consulta.

**Y encadena con B.251**: el tercer candidato, el que no entró, es el que más
interés tenía en este ejemplo. No sabemos cuál era ni por qué cayó.

**No se toca el umbral.** Sigue en pie lo de siempre: cambiarlo sin medir sería
repetir el error que B.248 describe. Lo que esta pasada añade no es una propuesta
de número — es la población que faltaba para justificar medirlo.

---

## ⚠️ 5.63 · B.252 — no hay forma de saber desde cuándo un documento está en el corpus (16/09/2026)

**Pregunta del arquitecto: ¿hay algún campo que SÍ conteste «desde cuándo está
analizado» para todos los caminos?**

**Predicción escrita antes de mirar: no lo hay. Acertada, y los tres candidatos
fallan por el mismo motivo — contestan otra pregunta.**

### Censo por capacidad: qué sello de tiempo escribe cada camino a `analizado`

| Camino | Fichero:línea | Sello de tiempo que deja |
|---|---|---|
| marcar revisado | `mark-analyzed/route.ts:113,152` | **`reviewed_at`** |
| reemplazo desde el chat | `index-text/route.ts:393` | **ninguno** |
| promoción tras un swap | `lib/documents/promocion.ts:98` | **`reviewed_at: null` a propósito** |
| ingesta manual pidiendo `analizado` | `ingest/route.ts:294` | **ninguno** (y `:342` lo pone a `null` al reemplazar) |

Tres de los cuatro no dejan fecha. Y de los campos que hay, ninguno responde:

| Campo | Qué contesta de verdad | Por qué no sirve |
|---|---|---|
| `reviewed_at` | **«¿pasó por la bandeja de revisión?»** | nulo en los otros tres caminos |
| `created_at` | «¿cuándo nació la fila?» | un documento nace `pendiente` y puede volverse `analizado` meses después |
| `updated_at` (trigger `documents_updated_at`, `supabase-setup.sql:621`) | «¿cuándo se tocó la fila por última vez?» | se mueve con cualquier update — reindexado, sync, cambio de carpeta |

**→ No existe. La pregunta «¿desde cuándo está este documento en el corpus
efectivo?» no tiene respuesta en esta base.**

### ⚠️ Y EL DIAGNÓSTICO DE LA CEGUERA QUE ESCRIBÍ AYER ERA EL EQUIVOCADO

En 5.53 escribí que la reconstrucción del historial estaba ciega **porque el
corpus se borró y se recreó**, y que ésa era «la que manda» de las tres causas.
**Era una hipótesis mía y no la verifiqué.** El director la falsó con dos nombres
propios: `CLI-04` y `CLI-05` llegaron a `analizado` por **subida manual indexada
desde el chat** —`ingest:294`—, que nunca los mandó a revisar y por eso no les puso
fecha.

**No es un fallo del sistema. Es que el campo contesta otra cosa** — y es
exactamente el patrón que `CLAUDE.md` ya tiene fichado: *un campo que responde a
dos preguntas distintas va a contestar mal a una de las dos*. Sólo que aquí el
campo contesta bien a la suya, **y la equivocada era la nuestra**.

### La consecuencia, que es lo que hay que escribir

> **Esa reconstrucción no está ciega hoy: es ciega POR CONSTRUCCIÓN** en cualquier
> corpus donde se indexe desde el chat. No le faltan datos que algún día lleguen —
> le falta una pregunta que ese campo no responde, y nunca la va a responder.

Por eso **la consulta 3 de `SQL_B249_historial.sql` se retira entera**, con su
motivo escrito en el hueco. Dejarla devolviendo números sería dejar un cero con
pinta de dato —lo mismo que pasó con el `org_id`— sólo que esta vez **sabiendo que
no puede acertar nunca**.

### Qué se pierde con ello, dicho sin rebajarlo

- **No se puede auditar** cuándo entró un documento al corpus. Si un cliente
  pregunta «¿desde cuándo participa esto en mis respuestas?», no hay respuesta.
- **No se puede reconstruir** el corpus efectivo de ningún análisis pasado. Las
  cifras de A5 y A6 se quedan sin denominador comprobable para siempre.
- **No se puede medir** la velocidad a la que crece el corpus efectivo, que es la
  variable de la que dependen B.244 y B.248.

### La medida directa que sí se puede hacer hoy

La consulta 5 del fichero compara `analizados_hoy` con `con_fecha_de_revision`.
**La diferencia son los documentos que están en el corpus sin haber pasado por la
bandeja** — con el corpus del director debería ser **2**. Esa resta es la medida
de esta ficha.

### No se arregla aquí

El arreglo sería un sello escrito por los cuatro caminos, y eso es un cambio de
esquema con su migración. **Y llevaría su contrato en el mismo commit que su
lector**, que es la regla de la casa para los sellos: hoy no hay lector, y un sello
sin lector es lo que ya pasó con `EXTRACTOR_VERSION`.

---

## ⚠️ 5.64 · La cifra del corpus elegible: son TRES (16/09/2026)

Corregida donde estaba escrita: en 5.44, 5.58, 5.59 y en el orden de lecturas.

**Llevaba tres días escribiendo «uno o dos», y la cifra nunca se midió** — salía de
las tandas anotadas a mano, que es la misma vía por la que ya me equivoqué con «el
tope nunca mordió» (B.249) y con «marcar quince no daría quince candidatos»
(B.245). **Tercera vez en tres días, y las tres por el mismo camino.**

⚠️ **Lo que NO se ha corregido, y es deliberado**: la cifra de A5 y A6. Ahí ponía
«un corpus efectivo de uno o dos documentos» y **tampoco se midió para esas
pasadas**. No se sustituye por «tres» —que es la de hoy, no la de entonces— sino
por «pequeño», con una nota que dice dónde está el dato:
`seleccion.candidatos_recuperados` de sus filas. **Hasta que se lea, no se afirma
ninguna.**

Esto no tumba B.245: el filtro de corpus sigue siendo el portero, y tres de
cuarenta y dos sigue siendo el 7 %. Lo que cambia es que la cifra ahora está
medida.

---

## ✅ 5.65 · LAS TRES VÍAS, YA SEPARADAS — cierra 5.61 (16/09/2026)

`lib/analysis/reparto-del-rerank.ts`, 14 pruebas. Tres contadores nuevos donde
había una resta ambigua.

### La respuesta a «¿se pueden separar con lo que hay?»: SÍ — pero no son tres cubos

**Son DOS cubos y UNA SEÑAL**, y la distinción decide qué puede decir el aviso:

| | Qué es | Contador |
|---|---|---|
| **descartados por criterio** | el modelo NO los nombró: los miró y no los quiso. Es una **decisión** | `seleccion.candidatos_descartados_por_criterio` |
| **cortados por tope** | elegidos que no cupieron. Es **presupuesto** | `seleccion.candidatos_cortados_por_tope` |
| ⚠️ **id no reconocido** | entradas del modelo que no casan con ningún candidato (`rerank.ts`, el `continue` mudo). **No es un cubo: se SOLAPA con el primero** | `seleccion.candidatos_con_id_no_reconocido` |

**La invariante que lo sostiene**, y que su batería vigila:

    recuperados === descartadosPorCriterio + elegidosPorElModelo

No hay un tercer sitio por donde caerse. Lo que hace la tercera cifra es decir
**cuánto de «por criterio» no fue criterio**: si el modelo pidió un documento con
un id que no supimos resolver, ese candidato se quedó contado como descartado por
criterio **y no lo fue — lo quisimos y no supimos encontrarlo**.

### ⚠️ Y POR ESO SU CERO IMPORTA MÁS QUE SU NO-CERO

`id_no_reconocido = 0` es **lo que hace cierta la palabra «criterio»** en el otro
contador. Se escribe siempre, incluido el cero: es la regla del denominador
aplicada a una causa en vez de a un hallazgo. Sin él, «2 descartados por criterio»
no se distingue de «2 que quisimos y perdimos».

**Y de paso cierra un caso que nadie había mirado**: si el modelo nombra el mismo
documento dos veces, `find` lo resolvía las dos y el candidato entraba duplicado,
**gastando dos plazas del tope con el mismo documento**. El reparto cuenta por
conjunto, así que ya no infla la cifra.

### Mutantes

- **La vía muda vuelve a ser silenciosa** (no se cuenta): **3 en rojo**.
- **Criterio y tope se confunden otra vez**: **8 en rojo**.

---

## ⚠️ 5.66 · EL PATRÓN, NO EL CASO: un mensaje puede afirmar QUÉ pasó; la CAUSA sólo si está medida (16/09/2026)

Tres veces esta semana, y son la misma forma con tres caras:

| Mensaje | Qué afirmaba | Qué sabía el sistema |
|---|---|---|
| «Ruta no autorizada» | que el usuario no tiene permiso | que la comprobación no devolvió un sí — que incluye **que la base no contestó** |
| «No perteneces a ninguna organización» | que no hay organización | lo mismo: el `null` de una consulta que pudo fallar |
| «Otro tiene menor afinidad y no entró en la comparación» | que quedó fuera por ranking | sólo que no entró. **La causa podía ser el criterio del modelo o un id que no supimos resolver** |

> **UN MENSAJE PUEDE AFIRMAR QUÉ PASÓ. LA CAUSA, SÓLO SI ESTÁ MEDIDA.**
>
> Y cuando la causa no se sabe, la frase se escribe sin ella: decir menos es
> gratis; decir de más es lo que hay que retirar después.

⚠️ **Lo que hace al tercero distinto de los dos primeros, y peor**: los dos
primeros confundían «no» con «no lo sé» —fallo de tipo, el que `resolverOrg`
arregló—. Éste no tenía ese problema: **el dato existía y lo tiré**. La resta
`recuperados − seleccionados` mezclaba tres vías, **yo mismo lo había escrito dos
veces** (§5.49, §5.53), y añadí el contador que las separa **en el mismo commit en
que construí el aviso con la resta**. La pieza correcta estaba en la mano.

---

## 5.67 · LOS TEXTOS DEL AVISO, PARA QUE ELIJA EL DIRECTOR (16/09/2026)

**No se ha cambiado ninguno.** Con los contadores ya puestos, las tres opciones
son escribibles; la elección es de producto.

⚠️ **Mientras tanto, el aviso en producción sigue diciendo la causa que no puede
respaldar.** Se deja así porque el orden lo fijó el encargo —contar antes de
decidir— y porque el mensaje no lleva al usuario a hacer nada equivocado. Pero
está vivo y es falso en la causa: no es una espera neutra.

### Opción A — neutra en la causa (la más barata y la única que no puede mentir)

> Se compararon los **2** documentos más afines a éste. Otro no entró en esta
> comparación.

**A favor**: verdadera siempre, con cualquier reparto. **En contra**: deja al
usuario preguntándose por qué, que es justo lo que el director quería evitar.

### Opción B — la causa, dicha sólo cuando se sabe

> · si **todos** los que faltan cayeron por el tope:
>   «Se compararon los **6** más afines. Otros **3** tienen menor afinidad y no
>   entraron en esta comparación.»
> · si **todos** cayeron por criterio del modelo:
>   «Se compararon los **2** documentos afines a éste. Otro se revisó y **no se
>   encontró contenido comparable**, así que no entró.»
> · si **hay de los dos**:
>   «Se compararon los **6** más afines. De los otros **4**, **1** no tenía
>   contenido comparable y **3** quedaron fuera por afinidad.»
> · si `id_no_reconocido > 0`, en cualquiera de los tres: se cae a la **opción A**,
>   porque la cifra de criterio no es de fiar.

**A favor**: dice la verdad en cada caso y explica el mecanismo, que era el
objetivo del director. **En contra**: tres frases que mantener, y la del medio
—«no se encontró contenido comparable»— es una afirmación sobre el documento del
usuario, no sobre el sistema. Hay que estar seguro de quererla.

### Opción C — la causa agregada, sin detallar

> Se compararon los **2** documentos más afines a éste. Otro quedó fuera: **el
> análisis se centra en los más parecidos y revisa el resto por encima.**

**A favor**: una sola frase, verdadera para las tres vías, y explica el mecanismo.
**En contra**: «por encima» es vago, y un usuario preciso preguntará cuánto.

### Mi recomendación, que no es la decisión

**La B**, con la caída a la A cuando `id_no_reconocido > 0`. Es la única que
cumple las dos cosas a la vez: explica el mecanismo —que es lo que el director
pidió— y no afirma nunca una causa que el sistema no conozca. Cuesta tres frases
en lugar de una, y las tres son comprobables por separado en la batería.

---

## 5.68 · LO QUE VA DESPUÉS, ESCRITO PARA QUE NO SE PIERDA (16/09/2026)

| Orden | Qué | Por qué ahí |
|---|---|---|
| 1 | **El umbral: instrumentar ahora, calibrar con corpus de escala** | no impide enseñar el producto, pero **sí lo que se puede prometer de él**: hoy un protocolo de urgencias se compara contra un tarifario (§5.62) |
| 2 | **Los 19 latentes** (§5.54) | prevención, y su sitio es **antes del primer cliente con corpus grande** — que es quien vive en la región que nuestras pruebas nunca pisaron |
| 3 | **La severidad** | commit de interfaz sobre datos que ya viajan. Cuando toque |

⚠️ **Y una anotación sobre el orden 1, que viene de Fable y hay que respetar**: la
calibración «probablemente no sea subir el 0,50 sino repensarlo como **corte
relativo** —percentil del vecindario, distancia al mejor—, porque e5 comprime la
franja alta por diseño y los umbrales absolutos son la herramienta equivocada».
Con un suelo de 0,79 y un techo de 0,99, esa afirmación tiene el dato del censo
detrás.

---

## ⚠️ 5.69 · El reparto que iba a sostener el aviso tenía dos cifras falsas (16/09/2026)

Se paró antes de escribir el texto de la opción B. Escribirlo sobre estas cifras
habría sido volver a afirmar una causa que el sistema no conoce, **con la ficha
del patrón (§5.66) ya escrita**.

### B.253 — el duplicado NO era un problema de cuentas (16/09/2026)

Si el modelo devolvía `[A, A, B]`, `rerank.ts` resolvía cada entrada con `find`
y **sin quitar repetidos**. Verificado en el código, no supuesto:

- A entraba **dos veces** en la selección, y el corte es un `slice` sobre esa
  lista: **ocupaba dos plazas del tope y dejaba fuera a otro documento**.
- `judgeAllDocuments` recorre los candidatos por lotes sin deduplicar
  (`judge.ts`, `runInBatches`): **el juez comparaba A dos veces y se pagaba dos
  veces**.
- `comparados = reranked.length` contaba la repetición: con tres afines, el
  aviso podía decir «eran todos los que había» sin que C se comparara nunca.

⚠️ **Y ES UN CIERRE FALSO DE ESTA MISMA TARDE.** El mensaje de `38b60b66` decía
«de paso cierra un caso que nadie había mirado: … el reparto cuenta por
conjunto». **Lo cerró en el contador, no en la selección**: el reparto volvía a
resolver los ids por su cuenta, y dos implementaciones del mismo criterio se
separaron desde el primer día. Es la regla de `CLAUDE.md` —un criterio se
implementa una vez— rota en el commit que decía aplicarla.

**Arreglo**: una sola resolución (`resolverSeleccion`) de la que salen la
selección y el reparto. Repetidos fuera, contados en
`seleccion.candidatos_repetidos_por_el_modelo`.

### B.254 — en el fallback no hay criterio, y se guardaba uno (16/09/2026)

Si el modelo falla, entran los tres primeros por score. El reparto calculaba
igualmente `recuperados − 3` y lo guardaba en `descartados_por_criterio`, **de
documentos que ningún modelo miró**. El comentario de encima decía «no hay nada
que repartir por criterio».

**Decisión del director: AUSENTE, no cero.** Un cero diría que el modelo no
descartó nada. Es el contrato de `PipelineCounters` (ausente = la etapa no
corrió). Los otros tres del reparto valen 0 en el fallback, y ese cero es verdad.

⚠️ **LA INVARIANTE ROTA, ESCRITA DONDE SE ROMPE**: `recuperados = criterio +
elegidos` no se cumple en el fallback, a propósito. El tipo tiene dos formas
(`RepartoConModelo` / `RepartoSinModelo`), la del fallback **no tiene el campo**,
y `elRepartoCuadra` sólo acepta la primera: el compilador obliga a mirar `origen`.

⚠️ **Y LA ESCRITURA SE SACÓ DEL PIPELINE.** Mi primer comentario en `pipeline.ts`
decía que un `?? 0` futuro «haría caer la prueba del fallback». **Era falso**: la
prueba vigilaba la función pura, no la escritura. Ahora escribe
`escribirContadoresDelReparto`, que tiene su caso, y la mutación `?? 0` lo mata.

### ⚠️ Una fuente inventada, y la razón de la decisión se apoyaba en ella

Propuse «ausente» diciendo que **«el contador `averia` ya dice por qué falta»**, y
el encargo lo repitió como razón. **No existe tal contador**: `averia` es una
etapa reservada y vacía (`counters.ts`). Lo que registra el fallo del rerank es
`analysis.stageFailures` con `stage: 'rerank'` (`synthesize.ts`,
`markIncompleteAnalysis`), que sí se persiste en el jsonb.

**La decisión sobrevive** —el registro existe, con otro nombre—, pero es el
patrón de F-106 con esta casa en los dos papeles: la frase venía de un comentario
de `rerank.ts` de un commit anterior («eso ya lo cuenta `averia` por la vía de
stage-failures»), la copié sin abrir el catálogo y volvió como premisa de una
orden. Corregidos los dos sitios, y la SQL de B.253 filtra por `stageFailures`.

### ¿Pasó en las pasadas del director? — lo que se puede deducir, y dónde se acaba

No había contador de repeticiones, así que no se sabe: **se deduce, con huecos**.
`SQL_B253_repetidos.sql` (PENDIENTE DE EJECUTAR, sólo lee):

| Señal | Alcance | Hueco |
|---|---|---|
| `seleccionados > recuperados` | desde F-82 (28/08) | con 3 recuperados y `[A, A, B]` sale 3 y 3: **el tamaño exacto de su corpus**, invisible |
| `seleccionados > recuperados − criterio − tope` | desde `38b60b66` (hoy) | con tope cortando no se ve — **justo cuando desplazó a otro** |
| dos solapamientos «del juez» del mismo documento en un análisis | **todo el historial** | sólo si ese documento produjo solapamiento |

Un «no aparece» es «no dejó huella legible», no «no pasó».

### Predicciones y mutaciones

- **Pruebas: predije +11, salieron +8** (1126 → 1134). **Fallada, esta vez por
  arriba.**
- **«Volver a resolver los ids por dos caminos no lo caza ningún test»:
  FALLADA**, a favor — **3 en rojo**, por los casos a nivel de `rerankCandidates`.

| Mutación | En rojo |
|---|---|
| la resolución no quita repetidos | 5 |
| el fallback devuelve criterio 0 | 2 |
| el fallback vuelve a la resta `recuperados − 3` | 2 |
| el rerank resuelve por su cuenta con `find` | 3 |
| la escritura hace `?? 0` | 1 |

Suite **1134/1134 en dos pasadas guardadas enteras**, tipos limpios (app y worker),
build aprobado.

⚠️ **Dos notas de método.** (1) En vitest 4, un `beforeEach(() => mock.mockReset())`
de nivel superior hacía fallar con el propio error los casos cuyo mock rechaza,
aunque el código lo atrapaba; sin el reset pasan. No se investigó más: cada caso
fija su implementación. (2) Los casos a nivel de rerank simulan `callLLMJson`. El
alcance de vitest prohíbe mocks de Anthropic; esto simula **la función
intermedia de la casa**, con el precedente de `style-check.test.ts`.

### Lo que queda para el commit del texto — y una decisión del director antes

**«Los N más afines» no es verdad siempre, y tampoco en el caso de tope solo.** El
corte ordena por **confianza del modelo** primero y por score de embedding
después (`orden-del-rerank.ts`). Un documento cortado con confianza `media` puede
tener **más** parecido que uno comparado con `alta`; y en el mixto, uno descartado
por criterio también. «Más afines» y «menor afinidad» afirman un orden de
parecido que el código no garantiza — **en producción hoy**, en la frase del tope.

Las dos salidas, con lo que pierde cada una:

| | Cabeza | Cola del tope | Pierde |
|---|---|---|---|
| **(i)** | «Se compararon 6 de los 10 documentos afines a éste.» | «Otros 3 también se eligieron, pero no cupieron en esta comparación.» | que hubo prioridad: se lee como un subconjunto cualquiera |
| **(ii)** | «Se compararon los 6 que el análisis priorizó de los 10 afines a éste.» | «Otros 3 también se eligieron, con menor prioridad, y no cupieron.» | la palabra «afinidad» que eligió el director |

Las dos son verdad en las filas 2, 4 y 5. **Recomiendo la (ii)**: explica el
mecanismo, que era lo que el director pedía, y «priorizó» es cierto por
construcción —es literalmente lo que hace el orden—, incluidos los empates.

**Y la fila 6** —análisis viejos sin reparto— pasará a no decir la causa. Hoy la
dicen sin saberla. Irá dicho en ese commit para que no parezca una regresión.

---

## ⚠️ 5.70 · El censo de lo retirado en `a3423ef2`: un juicio de inocuidad mío, una consulta que callaba y un verde que no era del árbol subido (16/09/2026)

El director pidió comprobar que `a3423ef2` no deja nada funcionando peor ni
caminos sin salida. Censo por capacidad —quién recibe la selección, quién lee la
clave que puede faltar, quién escribe campos que nadie lee—, sólo lectura. No
salió ningún camino sin salida ni nada que rompa. Salieron tres cosas.

### B.255 — el repetido conservaba su PRIMERA valoración, no la mejor (16/09/2026)

`a3423ef2` quitaba los repetidos quedándose con la primera aparición, con este
comentario: **«no hay un criterio que haga una mejor que otra: son el mismo
documento nombrado dos veces»**. Lo había. `ordenarParaCortar` ordena por la
confianza de esa entrada: con `[A baja, …, A alta]` y el tope cortando, **A se
quedaba fuera**, cuando antes de B.253 entraba.

⚠️ **Es un juicio de inocuidad emitido sin abrir a quien lee la entrada**, con la
regla de F-107 P2 ya en `CLAUDE.md` y después de tres días aplicándola a otros.
La misma forma que el «residuo benigno» del 14/09: «da igual cuál» es una
afirmación sobre TODOS los lectores de la entrada, y no abrí ninguno.

**Arreglo**: gana la de mayor confianza, y a igual confianza la primera. La
escala no se copia: `resolverSeleccion` recibe el rango desde fuera y `rerank.ts`
le pasa `rangoDeConfianza`, la misma con la que corta.

| Mutación | En rojo |
|---|---|
| gana siempre la primera (lo de antes) | 3 |
| gana la última (`>=`) | 1 |
| gana la de menor rango | 3 |
| `rerank.ts` deja de pasar la confianza real (`() => 0`) | 1 |

### `SQL_B253_repetidos.sql`, consulta 1 — callaba con forma de respuesta

No leía `candidatos_repetidos_por_el_modelo`. En toda fila posterior a
`a3423ef2` contestaba «sin repetición visible» **por construcción** —ya no pueden
entrar—, mientras la respuesta estaba en un contador que no miraba. Y el director
iba a ejecutarla. Corregida antes de ejecutarse: lo CONTADO va primero, lo
deducido después, y cada veredicto dice cuál es. Se añaden la consulta 3 (las
filas con criterio falso de B.254) y la 4 (si el worker corre código nuevo).

### ⚠️ `a3423ef2` se subió con la suite en ROJO, y su mensaje dice lo contrario

El mensaje afirma «Suite 1134/1134 en dos pasadas guardadas enteras». **Las dos
pasadas existieron y dieron eso — sobre un árbol que no es el que se subió.** §5.69
se escribió DESPUÉS de la primera y mientras corría la segunda, y declaraba B.253
y B.254 dos veces cada una y sin fecha: **cuatro violaciones de forma**, techo 29,
total 33. La primera pasada completa de hoy lo cazó: el `1 failed` de
`invariantes-de-estado`, guardado entero.

Es la regla de F-102 con otro objeto: **la cifra que se mide es la que se
guarda**, y la suite que cité medía un árbol distinto del commit. La corrección de
método: **las pasadas cuentan sólo si corren después de la última edición, sobre
el árbol que se commitea** — incluidos los `.md`, que tienen batería.

Producción no se vio afectada (Vercel no ejecuta la suite), pero `origin/main`
estuvo en rojo desde `a3423ef2` hasta el commit de esta ficha.

### Sellos sin lector — ANOTADOS, no retirados

| Campo | Quién lo lee hoy |
|---|---|
| `RepartoConModelo.recuperados` | `elRepartoCuadra` y las pruebas |
| `RepartoConModelo.elegidosPorElModelo` | `elRepartoCuadra` y las pruebas |
| `RepartoSinModelo.recuperados` | nadie |
| `RepartoSinModelo.seleccionadosPorScore` | nadie |
| `elRepartoCuadra` | sólo las pruebas |
| contador `candidatos_repetidos_por_el_modelo` | `SQL_B253`, consultas 1 y 4 (desde este commit) |

Se anotan en el propio campo y no se retiran: `sufijoDeTotal` se declaró sin
consumidor el 10/09 y volvió a hacer falta el 11 (`lib/subida/pertenencia.ts`).
Retirar algo el día que pierde su último lector es retirarlo con la menor
información.

### La pregunta para el director, que sólo él puede contestar

> **En el panel de Railway, servicio del worker: ¿la fecha del último despliegue
> es posterior al push de este commit, y el commit que muestra es éste?**

- **Sí** → los exhaustivos ya quitan repetidos (con la mejor confianza) y no
  escriben criterio falso.
- **No, o anterior a las 18:30** → **mientras tanto los exhaustivos siguen
  metiendo repetidos al juez** —ocupando plazas y cobrándose dos veces— **y
  escribiendo el criterio falso en el fallback**. La consulta 3 de `SQL_B253`
  caza esas filas igualmente.
- **Entre `a3423ef2` y éste** → quitan repetidos, pero quedándose con la primera
  valoración (B.255 sin arreglar).

La consulta 4 de `SQL_B253` lo contesta desde los datos **sólo si ha habido algún
exhaustivo después de las 18:30**, y sólo distingue «anterior a `a3423ef2`» de «a
partir de `a3423ef2`»: no ve B.255.

### Predicción

**+3 pruebas; salieron +4** (1134 → 1138). **Fallada, por abajo.** Cayeron las
mutaciones previstas: la de «primera» con 3 (predije al menos 2) y la de
«última» con 1.

---

## 5.71 · El texto del aviso, opción (ii) — y lo que dijeron las cuatro consultas de `SQL_B253` (16/09/2026)

### Las consultas, ejecutadas

Fuente: el director las ejecutó contra producción y el arquitecto trasladó los
resultados. **Esta casa no ha visto la salida en bruto.**

| Consulta | Resultado |
|---|---|
| 4 · qué código corre el worker | «código NUEVO» en el exhaustivo de las 18:29, y el director confirma en Railway el despliegue de `5208f5c` |
| 1 · repeticiones por contadores | «CONTADO: el modelo no repitió ninguno» |
| 2 · repeticiones por hallazgos | **cero filas**, sobre todo el historial |
| 3 · cifras de criterio falsas | **cero filas** |

**B.253 y B.254 existieron en el código y no mordieron en lo que se puede ver.**
⚠️ Con la salvedad escrita en la propia SQL: casi todo el historial sale «no
deducible», porque con tres candidatos una repetición no deja huella en los
contadores, y la consulta 2 sólo la ve si el documento repetido produjo
solapamiento. **Un «no aparece» no es un «no pasó».**

### ⚠️ Un dato que vale por sí solo — y que corrige una regla de lectura de §5.51

El 14/09, **CLI-05 con 9 y 10 recuperados dio 4 y 5 seleccionados.** Con tope 6,
el tope **no cortó**: sólo corta lo que el modelo eligió, y el modelo eligió
menos de 6. Los que faltan cayeron por **criterio del modelo** —o por ids no
reconocidos, que el 14/09 no se contaban y no se pueden descartar—. **Por lo
menos la mitad.**

Es población para dos sitios: para **B.248** —sobran candidatos porque el umbral
no filtra, y el que filtra es el modelo— y para **el aviso**, que va a tener que
decir la fila 3 a menudo.

⚠️ **Y CORRIGE LA REGLA DE LECTURA DE §5.51, escrita antes de ver los datos**: decía
«`recuperados > 6` en un `quick` → **EL CORTE MORDIÓ**». Leía el tope como si
actuara sobre los recuperados, y actúa **después del criterio**. La señal del tope
era `seleccionados = 6`, que aquella tabla sólo marcaba como «sospechoso».
`recuperados > 6` dice que **algo** descartó en silencio —y eso sigue siendo
verdad—, no que fuera el tope. **En CLI-05 descartó el criterio.**

**Lo que NO se ha tocado, y queda para decidir**: la cabecera de F-108 («una pasada
que recuperó 9 ó 10 con tope 6») y el ejemplo del tope de 6 en `CLAUDE.md` («se dio
por inerte… el historial enseñó cinco pasadas con 9 y 10»). Las dos frases son
ciertas sobre los recuperados; **ninguna demuestra que el tope cortara**, y para
CLI-05 el dato dice que no. De las otras pasadas no hay cifra aquí.

### El texto: opción (ii), decisión del director

⚠️ **«Afinidad», que eligió el director, se conserva donde es verdad y se sustituye
por «priorizó» donde no lo sería.** Es verdad de los **afines**: los que la
recuperación trajo por parecido. No lo es del **orden del corte**, que va por
confianza del modelo y luego por parecido. **No es un cambio de criterio del
director: su criterio no se podía cumplir tal como estaba escrito.**

| # | Cuándo | Frase (ejemplo) |
|---|---|---|
| 1 | no quedó ninguno fuera | «Se compararon los 2 documentos afines a éste, que eran todos los que había.» — **sin cambios** |
| 2 | fuera sólo por tope | «Se compararon los 6 que el análisis priorizó de los 9 afines a éste. Otros 3 también se eligieron, con menor prioridad, y no cupieron.» |
| 3 | fuera sólo por criterio | «Se compararon 2 de los 3 documentos afines a éste. El otro se revisó y no se seleccionó para esta comparación.» |
| 4 | mixto | «Se compararon los 6 que el análisis priorizó de los 10 afines a éste. De los otros 4, 3 también se eligieron, con menor prioridad, y no cupieron; 1 se revisó y no se seleccionó.» |
| 5 | criterio no respaldado, con tope | «Se compararon los 6 que el análisis priorizó de los 10 afines a éste. Otros 3 también se eligieron, con menor prioridad, y no cupieron. Otro más tampoco entró.» |
| 6 | sin causa respaldada ni tope | «Se compararon 6 de los 9 documentos afines a éste. Los otros 3 no entraron en esta comparación.» |

«Criterio respaldado» = el modelo contestó, cero ids no reconocidos y
`tope + criterio` cuadra con los de fuera. Si no, **la caída es parcial**: el tope
se sigue explicando y sólo se calla el resto.

⚠️ **LA FILA 6 CAMBIA LOS ANÁLISIS VIEJOS.** Los anteriores a hoy no traen reparto, y
decían «otros N tienen menor afinidad y no entraron» **sin saberlo**. Ahora dicen
«no entraron», sin causa. **No es una regresión: es la frase dejando de afirmar lo
que no sabía.**

Y el tipo del campo en `components/improvement/problems.ts` era una **copia literal**
`{ comparados; afines }`: con el campo nuevo opcional, `tsc` no habría dicho nada.
Ahora se importa.

### Qué debe ver el director

Con su corpus —tres afines, dos comparados, el tercero por criterio— y en un
análisis **nuevo** (uno viejo sale por la fila 6):

> Se compararon 2 de los 3 documentos afines a éste. El otro se revisó y no se seleccionó para esta comparación.

seguida de la nota de reanálisis, que no cambia. Si esta vez el modelo elige los
tres, sale la fila 1. **Contadores que lo confirman**: `descartados_por_criterio =
1`, `cortados_por_tope = 0`, `con_id_no_reconocido = 0`.

### Predicción y mutaciones

- **Pruebas: predije +13 en la batería del aviso, salieron +7** (21 → 28). **Fallada,
  por arriba.**

| Mutación | En rojo |
|---|---|
| la frase del criterio pasa a ser la del tope (filas 3 y 4) — predije ≥3 | 5 |
| la caída parcial vuelve entera a la fila 6 (fila 5) — predije ≥2 | 4 |

Los dos conjuntos no se tocan: cada mutación mata casos distintos.
