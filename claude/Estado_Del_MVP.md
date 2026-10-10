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

> ✅ **LAS TABLAS FUNCIONAN EN PRODUCCIÓN, en la ruta por defecto (01/10/2026, sonda A de B.307,
> 08:26:37 UTC; log del director transcrito por el arquitecto).**
> - **Nivel 1, completas**: OPE-13 «Cobertura» (14 filas, 1.913 caracteres) y RRHH-08
>   «Guardias».
> - **Nivel 2, resumen y filas**: OPE-10 «Tarifas» (resumen + 4 de 60 filas) y OPE-11 (resumen +
>   2 de 60).
> - Es el reparto por unidades (F-41 a F-44) trabajando sobre documentos que acaban de entrar al
>   corpus.

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

⚠️ **LO QUE ESTABA MAL EN LA TABLA DEL 09/09, dicho exacto** (y el encargo del 17/09 lo
resumió como «dos de sus cinco salidas mal», que tampoco es así): **las cinco salidas
existen todas** —hoy en `route.ts:304, 373, 381, 560 y 879`—. Lo que falló fue:
- **dos afirmaciones de contenido**: que era «del exhaustivo» (**cobra también el rápido**, por
  las mismas salidas) y el ejemplo de los 60 (**el segundo exhaustivo sólo tiene descuento de
  reanálisis si el usuario descartó algo**);
- **una salida que faltaba** («storagePath o text requeridos», `:377`);
- y **todos los números de línea**, envejecidos.
**El hallazgo seguía siendo cierto**: se cobra y no se devuelve. Fallaban sus ejemplos. Y sólo se
vio al ir a corregir otra cosa.

⚠️ **CAUTELA DE MÉTODO**: una ficha se escribe una vez y se cita muchas, y **sus ejemplos concretos
envejecen igual que el código**. Lo barato que hay, y lo que no:
- **Lo que ya existe y no se usó aquí**: la regla de `CLAUDE.md` — todo hallazgo de la forma «los
  N sitios que hacen X» **lleva su comando de censo**, y cerrarlo o citarlo exige re-ejecutarlo.
  B.205 enumeraba salidas **sin comando**; con él, al tocarla se habría visto la sexta.
- **Lo que se puede automatizar barato**: que cada `ruta:línea` citada en este documento apunte a
  un fichero que existe y tenga al menos esas líneas. Caza ficheros borrados o encogidos; **no
  caza una línea que se movió**, que es lo que pasó aquí. **No está escrito.**
- **Lo que no tiene forma barata**: comprobar que un ejemplo SIGUE DICIENDO lo que dice. Eso sólo lo
  hace releer el consumidor al tocar la ficha. **Se queda como cautela, no como garantía.**

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

⚠️ **NO EJERCIDA EN PRODUCCIÓN — corregido el 17/09/2026.** El encargo del 17/09 dio por
«ejercida» esta ficha con «10 en vez de 30» sobre los cortes por duplicado de `CLI-20`. **No
llegó a escribirse aquí** —se paró antes—, y **era falso por dos lados**: esos cortes
costaron **30 y 30** (saldo 1.070 → 1.040 → 1.010), y **un corte por duplicado no es ninguna de
las salidas que esta ficha cubre** —no es previo al punto de gasto ni un fallo—. **Los cortes
por duplicado nunca han estado cubiertos por esta ficha**, y su precio lo decide B.235.
El encargo añadió que lo que se vio funcionar fue **el descuento por reanálisis**. **Aquí no
consta**: las dos pasadas cortadas no lo recibieron, y no se ha trasladado otra en la que se
viera. Queda como afirmación del encargo, sin verificar.

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

### ✅ DECIDIDO Y APLICADO EL 17/09/2026 — el reembolso por etapa

**Decisión del director: si no se gastó nada, se devuelve todo; si se gastó algo, no
se devuelve nada. Sin mitades: lo decide dónde murió el trabajo.** «Gastar» es llamar
al modelo, y lo dice el acumulador de uso. La regla vive en UN sitio,
`lib/reembolso-por-etapa.ts`, con batería; la ruta y el worker sólo ejecutan lo que
ella diga.

| dónde murió | se devuelve |
|---|---|
| la ruta, antes de empezar el análisis (las seis salidas) | todo |
| la ruta, excepción dentro del análisis **antes** de la primera llamada al modelo | todo |
| la ruta, excepción **después** de llamar al modelo | nada |
| el worker, antes de llamar al modelo | todo — **hasta hoy, nada** |
| el worker, después de llamar al modelo | nada |
| un job barrido como zombi en `pending` —nunca lo reclamó nadie— | todo |

⚠️ **NO EJERCIDO EN PRODUCCIÓN** (17/09/2026). Está escrito, con batería y desplegado; **no se ha
visto actuar nunca**. No se provoca a propósito —un fallo de infraestructura a voluntad no
es sencillo ni útil de forzar— y se deja para cuando aparezca. **Lo que lo demostraría**,
leído en los registros del worker o de la ruta y contrastado con el saldo:
- un trabajo que falle **antes** de la primera llamada al modelo y **devuelva entero**;
- y uno que falle **después** y **no devuelva nada**.
⚠️ Y lo que NO lo demuestra: el corte por duplicado del 17/09 cobró 30 **por no declarar clase**
(B.235), no por este reparto — no es un fallo.

**Casos decisivos**: mutante «devuelve siempre», 5 en rojo; «no devuelve nunca», 3 en
rojo; **conjuntos disjuntos**.

⚠️ **LO QUE LA REGLA NO DECIDE, y se deja dicho:**
- **Un zombi barrido en `processing`**: su acumulador murió con el proceso y no se
  sabe dónde murió. ~~No se devuelve, y no es una decisión: es falta de dato.~~
  **DECIDIDO EL 17/09/2026 — opción A del director: no se devuelve.** Ver abajo lo
  que esa decisión acepta.
- **Los incompletos de F-71** —etapa del modelo caída, resultado parcial entregado—
  **se siguen devolviendo íntegros aunque se gastó modelo.** Es otra regla, ya
  decidida, y ésta no la toca.

### ⚠️ OPCIÓN A, 17/09/2026 — sin excepción para el tiempo agotado, y lo que eso acepta

**Decisión del director: la regla se aplica literal, sin excepción para el tiempo
agotado.** La razón que decide: **el caso no tiene población**. El exhaustivo más
largo registrado tardó **6,1 minutos** (`analyze-v2/route.ts:34`, el comentario del barrido de zombis,
medido antes del 13/07/2026 y **no re-medido desde entonces**) contra un umbral de
zombi de **20**. Escribir una excepción para algo que no ocurre es código sin caso
decisivo. **El código ya hace la A** desde `df3dacc1`: no hubo que tocarlo.

**LO QUE LA A ACEPTA, sin suavizar — es lo que hay que releer el día que cambie:**

- **Con tiempo agotado, el usuario paga y no tiene el resultado en la pantalla donde lo
  pidió.** Y hay dos sub-casos que no son el mismo:
  · **el worker seguía vivo**: termina, **guarda el análisis** y reescribe el job a
    `completed` —su última escritura no mira el estado (`worker/src/index.ts`)—. **El
    trabajo se hizo entero, está pagado, y el usuario no lo ve** donde lo esperaba: el
    chat dejó de esperar a los **10 minutos** (`useJobPolling.ts:50`), antes incluso
    del barrido de los 20;
  · **el worker murió**: no se hizo, o se hizo a medias, y **se paga igual** porque no
    se sabe dónde murió.
- **Con un error de programación nuestro después de llamar al modelo, el usuario paga
  por un fallo que no es del modelo ni suyo.**

⚠️ **EL DISPARADOR DE REVISIÓN, con los números de hoy para poder comparar:** máximo
registrado **6,1 min**; espera del cliente **10 min**; umbral de zombi **20 min**. **Si
el máximo medido se acerca a los 10** —que es donde el usuario deja de ver el
resultado, no a los 20—, por documentos mayores o un corpus grande, **este caso pasa a
tener población y la decisión se rehace.**

### ⚠️ EL POZO DEL DIRECTOR — lo que la medición descartó y lo que NO

La preocupación era razonable: si un fallo a mitad no cuesta nada, reintentar sale
gratis.

- **En los trabajos FALLIDOS, descartado con dato**: no hay camino de reintento sin
  cobro —cada petición cobra sus 30— y sus fallos son de base, índice o código, no
  provocables por el usuario. **Y con la regla por etapa, un fallo que ya gastó modelo
  no se devuelve.**
- ⚠️ **En los INCOMPLETOS de F-71, NO descartado.** Se entregan con resultado parcial
  **y** se devuelven íntegros: ahí sí sale análisis parcial gratis. **Que el usuario
  pueda provocarlos no está medido**, y tiene una palanca a mano: el tamaño del
  documento, que no tiene límite en el código de las rutas.
- **Si algún día un usuario pudiera provocar un fallo a voluntad, esta decisión se
  revisa.** Y la pregunta de si F-71 debe seguir la regla por etapa es del director.

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

### ✅ EL CONSUMO, CERRADO EL 17/09/2026 — el chat no sirve lo que ya no tiene fila

**Decidido y escrito**: la guarda vive en el lector (`lib/rag-fila-viva.ts`), no en las fábricas.
**Coste en cada consulta del chat: CERO consultas más.** `fetchFullTexts` ya pedía todas las filas de
una vez (`.in("id", ...)`); ahora devuelve además qué ids tienen fila. Sin fila, el documento no entra
al contexto ni a las fuentes citadas; con fila y sin `full_text` se reconstruye desde los trozos, como
siempre —«sin `full_text`» no es «sin fila»—.

**LA FÁBRICA NO TENÍA NADA QUE ESCRIBIR**, y se dice porque el encargo la daba por abierta: la
sincronización borra con `deleteDocument` (`drive/sync/route.ts:501`), que borra análisis,
**vectores y después la fila**, y no toca la fila si fallan las dos vías de vectores. Lo que queda
abierto de verdad es otra cosa: **tres de los cuatro borradores dan el borrado por bueno con UNA de dos
vías**, y la de ids sólo cubre la generación activa; la creación a medias también puede dejar vectores.
**Por eso la guarda va en el lector**: las fábricas no se pueden dar por enumeradas.

⚠️ **LO QUE ACOTA LA URGENCIA**: hoy no hay población. El detector midió **uno** el 15/09 y **cero**
después, con 762 vectores. No es que esté pasando: es que la vía existe y nadie la vigilaba. Y ese cero
tiene límite: una consulta de tope 10.000 (B.209), fiable hoy y **ciega sin avisar** cuando el índice
pase de ahí.

⚠️ **LO QUE NO SE HA DECIDIDO**: si la consulta de filas FALLA, la guarda **deja pasar todo, como hasta
hoy**. Fallar cerrado —responder sin esas fuentes mientras la base no conteste— es decisión del director.

⚠️ **REGISTRO, NO CONTADOR**: cada documento descartado deja una línea `[RAG] B.225` en consola.
`chat_queries` no tiene dónde guardarlo sin columna nueva, y **un registro no es una medición**. Si se
quiere que la guarda mida la fábrica, hace falta esa columna y su SQL.

**EVIDENCIA: LA BATERÍA, NO LA PANTALLA.** Sin huérfanos no hay nada que el director pueda ejercer. Mutante
«deja pasar el huérfano», 3 en rojo; mutante «el borrado no limpia los vectores» sobre la batería ya
existente de `deleteDocument`, 2 en rojo; **conjuntos distintos**.


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

### ✅ LA PIEZA 1, EJERCIDA EN PANTALLA EN LOS DOS MODOS — 17/09/2026

El director subió `CLI-20` desde el chat —ya indexado con el mismo contenido— y lanzó
**los dos modos**. Los dos cortaron por duplicado exacto con la frase de esta pieza:
«IDÉNTICO a "CLI-20…". No aporta información nueva, así que analizarlo nuevamente no
va a encontrar nada.», **sin plegar y con `NO_INDEXAR`**. Hasta hoy estaba ejercida
sólo en rápido.
⚠️ *(El encargo la llamó B.226, que es otra ficha —el chat que decía no tener acceso a
un documento—. Es la pieza 1 de ésta.)*

### ⚠️ Y EL PRECIO, EN PRODUCCIÓN — lo que esta ficha decidió NO cambiar

**Esta ficha no arregló el cobro: lo decidió dejar igual** («el precio NO cambia»), y
sólo lo hizo contable. Así que el exhaustivo cortado del 17/09 **se predice cobrado
entero**: sale sin `estimatedCost`, cae en `heavy` por defecto y `heavy` no devuelve
nada; y si el plan no es business, ni siquiera entra al precio variable. **La regla por
etapa de `df3dacc1` no lo alcanza**: actúa en fallos, y un corte por duplicado no es un
fallo — aunque **no llamó al modelo**, que es exactamente lo que esa regla devuelve.

**Predicción escrita antes de leer la base**: rápido **5**; exhaustivo **30 sin devolver**;
y «Reanalizar corpus» desde el modal, **otros 30 sin devolver si `CLI-20` tiene original
en la nube** —el modal no excluye homónimos de la nube (`homonimoParaReemplazar`), así
que el hash vuelve a chocar—. **Total esperado: 65.** Se comprueba con
`SQL_B235_cobro_CLI20.sql`. ⚠️ **Los reembolsos no dejan rastro en la base**: lo
cobrado se deduce; si el director anotó el saldo antes y después, esa cifra manda.

**Si sale 30 por el exhaustivo, la decisión del 15/09 se tomó sin este dato** —un botón
que el director pulsó en el flujo normal, sin error de nadie— **y le toca revisarla.**

### ✅ MEDIDO Y DECIDIDO EL 17/09/2026 — el corte por duplicado cuesta 30, y se queda en 30

**LA CIFRA, del director**: las dos pasadas exhaustivas cortadas por duplicado
—`e31e0418` y `ced358cd`, 181 y 198 ms, las dos con `sin_clasificar: true`— costaron
**30 y 30, sin devolución**. **El saldo lo confirma: 1.070 → 1.040 → 1.010.** La base no
lo habría confirmado sola: **los reembolsos no dejan rastro en ninguna tabla** (sólo suman
a `organizations.credits_extra`), y `credits_consumed` es lo cobrado al encolar. **La
secuencia de saldo es la única prueba del neto.**
La predicción escrita antes decía **30 por cada corte**: **acertada**. El total de 65 no se
puede comprobar: de la tercera pasada —«Reanalizar corpus»— no se trasladó cifra.

**LA DECISIÓN DEL DIRECTOR, FIRME, con el número real delante: se queda en 30.**
> «Si es idéntico y aun así quieres compararlo, no tiene sentido que cueste menos. El
> usuario debe entenderlo. Otra cosa sería un error nuestro; esto es del usuario.»

**Lo que la sostiene**: la advertencia está delante, **sin plegar**, y dice literalmente que
analizarlo otra vez **no va a encontrar nada**. Quien pulsa después decide informado. Es el
mismo criterio con el que se cerró B.256.

### ⚠️ Y SU APOYO, QUE ES FRÁGIL Y VA APARTE — no es la decisión

**El 30 de hoy no lo eligió nadie para este caso.** Sale de que el corte por duplicado **no
declara clase** (`buildExactDuplicateResponse` devuelve sin `estimatedCost`) y **cae al
valor por defecto, que es el máximo** (`CLASE_POR_DEFECTO = 'heavy'`,
`lib/analysis/clase-de-coste.ts:41`). **La decisión del director lo hace correcto, pero por
coincidencia.**

**EL DISPARADOR DE REVISIÓN**: si algún día se cambia el valor por defecto —y hay razones,
porque **cualquier camino nuevo que termine sin clasificar cobra el máximo en silencio**—,
este caso pasaría a cobrar otra cosa **sin que nadie lo decida**. Ese día hay que
**declararle su clase explícita** al corte por duplicado, para que siga costando 30 **porque
se decidió y no porque cayó ahí**. Y el mismo día hay que revisar cualquier otro camino que
esté en `sin_clasificar`: `select count(*) from analysis_results where pipeline_counters ?
'averia.exhaustivo_sin_clasificar'`.

### ⚠️ LA CORRECCIÓN QUE VA CONTADA — el apoyo de una decisión, escrito sin comprobar

El 17/09 el encargo afirmó **«lo no clasificado ahora vale ligero»** y que el corte costaba
**10**, y **sobre esa frase el director tomó una primera decisión de producto**. **Era falso**:
el defecto es `heavy` desde `dda7e843` (15/09) y el corte costó 30. Se paró antes de
anotarse, leyendo el código. Es el patrón de `CLAUDE.md` sobre el indicativo: una afirmación
sobre el objeto, hecha sin el objeto delante, que vuelve convertida en premisa de una orden.
**La decisión se rehízo con la cifra real y salió la misma — pero ahora sabiendo por qué.**

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
| 3 | Cada camino que produce informe, con cifra + camino + **modo** | ✅ **cerrado el 17/09/2026, por decisión del director y con su alcance escrito.** El punto pasa a pedir lo que de verdad faltaba: **el worker medido.** Medido **en la base** por A5 (15/09) y A6 (09/09 y 15/09), `3 · 57 · 0 · 0`, por sus dos fuentes de estructura —binario y rescate—; y **en pantalla por el director el 17/09**, cinco eslabones: encolado, recogida, informe con contradicciones **y estilo**, cabecera «Exhaustivo» y persistencia tras recargar (entrada y documento de esa pasada: no trasladados). **A2 y A4 se declaran entradas del mismo worker**, con la salvedad del inventario: difieren en la fuente de la estructura y en la tanda, y esas dos combinaciones son las que ya cubren A5 y A6. ⚠️ A1, A3, A5 y A6 siguen teniendo **alcance de pareja, no de corpus** (§5.47) |
| 4 | Cuando el sistema no ve algo, lo dice | 🔶 **a medias.** Hecho: los denominadores de tablas (pieza 2, 07/09) y el aviso de cobertura de documentos, que dice contra cuántos se comparó y la causa sólo cuando está medida (`7afafd71`, 16/09). Y desde el 17/09, **«cero problemas» sin haber mirado dejó de pasar** (B.237, cerrada en sus tres puertas). **Sigue sin decirlo**: el estilo pierde el final de los documentos largos (B.236); el rerank ve el documento nuevo cortado en seco a 3.000 caracteres; el corte previo a 25 candidatos no se cuenta; y **la bandeja enseña el último análisis sin decir de qué tipo es**, así que un estilo puede leerse como «cero contradicciones» (B.258, leída en el código y **no comprobada en pantalla**) |
| 5 | Los dos botones que cobran dicen lo que cuestan | ✅ **B.180, arreglado el 08/09** (`a2b99c41`, §4.2) |
| 6 | Hay lista escrita de lo no probado, y no está escondida | ✅ |
| 7 | La condición de escritorio, escrita | ✅ |

**Seis de siete, con el 4 a medias** (17/09/2026). Lo que falta es que todo lo que no
se ve se diga (4).
*(Hasta el 17/09 decía «cinco de siete»; el 3 se cerró ese día, ver su fila.)*

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

### ✅ PRIMER TIEMPO, HECHO EL 17/09/2026 — instrumentado, sin tocar el valor

**Lo que cambia:**
- **El comentario dice la verdad.** Ya no dice «calibrado» ni avisa de «no subirlo a
  ciegas»: dice **sin calibrar**, con el dato del censo del 16/09 —ningún par de las
  42×41 por debajo de ~0,79— y la fecha. Lo mismo para el 0,45 del exhaustivo.
- **Su caso decisivo, en el consumidor que decide.** La comparación vive en
  `pasaElUmbral` (`lib/analysis/umbral-de-recuperacion.ts`), la usa `collectMatches`, y la
  batería **importa la constante real**: moverla rompe algo.
- **El contador**: `seleccion.candidatos_perdidos_por_umbral`, en **documentos** —los que
  no tuvieron ni un fragmento por encima—, escrito siempre y **antes de la salida
  temprana**: si algún día el umbral dejara a cero los candidatos, ahí se vería por qué.
- **Y el corte previo de 25, de la misma familia**, en el mismo commit porque era barato:
  gana nombre (`MAX_CANDIDATOS_DE_RECUPERACION`), caso decisivo y contador
  (`seleccion.candidatos_cortados_por_tope_de_recuperacion`).

⚠️ **DOS DISTINCIONES QUE HACEN BUENO EL CONTADOR:**
- el umbral descarta **fragmentos**, y un documento sólo se pierde si **ninguno** pasa.
  Contar fragmentos diría «actuó» cuando quizá no dejó fuera a nadie;
- el registro que ya existía agrupaba los descartes **por nombre**, y dos documentos pueden
  llamarse igual. El contador cuenta **por id**.

⚠️ **Y UNA QUE NO ESTÁ MEDIDA:** el censo de 0,79 midió **parejas de documentos**; el umbral
compara **fragmentos**. Que ningún fragmento baje de 0,50 es muy probable, **no está medido** —
y es exactamente lo que el contador medirá.

**Predicción escrita antes:** +8 pruebas; salieron **+9** — fallada por abajo. Mutantes: umbral
del rápido a 0,45, 1 en rojo; a 0,55, 1; tope a 26, 2; contador siempre a cero, **1** (predije
≥2 — fallada por abajo); y, sin predicción, el umbral del exhaustivo a 0,40, 1. **Todos
mueren.** Y la de producción, que se comprobará con las pasadas: **los dos contadores dan 0**.

### ⏸️ EL SEGUNDO TIEMPO — la calibración, y lo que hace falta para hacerla

**No se toca el valor.** Ni se sube ni se cambia por un corte relativo: con un suelo de ~0,79 no
hay número absoluto que se pueda comprobar, y elegir uno hoy repetiría el error que esta ficha
describe. **Lo que hace falta:**
- **un corpus de escala**, donde haya parejas que de verdad no tengan nada que ver y por debajo
  del suelo de hoy;
- **y el conjunto de calibración que ya existe**: las 42×41 puntuaciones medidas del censo de
  vecindario. Sirven para DISEÑAR el corte relativo, no para consagrar una constante (F-109 P2).
- **Y el disparador natural**: que `seleccion.candidatos_perdidos_por_umbral` deje de dar cero.

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

> ⚠️ **21/09/2026 · F-114 — LA VARIABLE SE COMPROBÓ DESPUÉS DEL COMMIT, NO ANTES.**
> `ANALYSIS_ATOMIC_MEASURE`: el director comprobó el **21/09/2026 a las 16:31** que no
> existe en Vercel (Production, Preview y Development) ni en Railway. **La comprobación
> se hizo DESPUÉS del commit `839d093b`, no antes como pedía F-114**; el encargo la dio
> por hecha sin estarlo — error del arquitecto, anotado como tal y no como detalle.
> **Sin efecto, porque el código que la leía ya no existe.** Y la razón de que se anote
> igual: F-114 mandaba borrar la variable PRIMERO y el código DESPUÉS, así que hacerlo al
> revés habría dejado —si hubiera estado definida— una variable de entorno activa
> apuntando a una rama inexistente. Inocuo aquí; **no inocuo en general**.
>
> ⚠️ **21/09/2026 · F-114 — LAS SUPERVIVIENTES SON 18, NO 19.** `MAX_CLAIMS` desapareció
> con la retirada de la rama atómica: no ganó caso decisivo, **dejó de existir**. Es la
> única forma legítima de bajar esta lista sin probar nada, y se anota para que nadie
> lea el 18 como progreso de verificación. Las dos constantes del umbral siguen en la
> lista y son otro commit.

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
| ~~`MAX_CLAIMS`~~ | ~~40~~ | ⚠️ **RETIRADA el 21/09/2026 (F-114)**: vivía en `extract-claims.ts`, y la rama atómica se retiró entera. **La lista baja de 19 a 18.** No se probó: desapareció | — | — |
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

### 📏 17/09/2026 · LOS DOS UMBRALES, CON CASO EN EL CONSUMIDOR — y un corte que esta lista no tenía

- **`SCORE_THRESHOLD_QUICK` y `SCORE_THRESHOLD_EXHAUSTIVE` ya tienen caso decisivo en la
  recuperación**, que es quien los usa en producción (`umbral-de-recuperacion.test.ts`). El
  punto 3 de arriba —«tener caso decisivo en un consumidor no cubre al otro»— queda cubierto.
  ⚠️ No eran de las 19 supervivientes: morían, pero **sólo** en la batería del censo.
- ⚠️ **`.slice(0, 25)` de la recuperación NO ESTABA EN ESTA LISTA DE 24.** Era un literal sin
  nombre, y la lista se hizo sobre constantes: **un corte sin nombre se escapó de un censo
  hecho por capacidad**, que es la forma exacta de fallo que el censo existía para evitar.
  Desde el 17/09 se llama `MAX_CANDIDATOS_DE_RECUPERACION` y tiene su caso. Si la lista se
  rehace, se busca por OPERACIÓN (`slice`, `<`, `>=`, `.filter`), no por `const`.

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
⚠️ *(Corregido el 17/09/2026: la marca no tiene vuelta, pero **no es un obstáculo**: el
director puede retirar los documentos borrándolos de Drive y sincronizando. Ver §5.75.)*

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

---

## ⚠️ 5.72 · B.256 — un segundo exhaustivo del mismo documento, sin que nada lo diga (17/09/2026)

**Decisión del director: los 30 + 30 se quedan como están — es cosa del usuario pulsar
dos veces.** Con la condición que él mismo puso en el duplicado exacto, y que aquí
aplica igual: **es cosa del usuario SI EL SISTEMA SE LO DIJO.** Allí decidió que la
pantalla dijera «IDÉNTICO» y dejara de estar plegada, y sólo entonces el coste era
suyo. **Aquí esa condición no se cumple todavía. Por eso es ficha y no está cerrada.**

**Las dos mitades:**

1. **Hoy nada avisa** de que ya hay un exhaustivo reciente del mismo documento. El
   botón «Reanalizar corpus» del modal sólo se desactiva mientras carga
   (`ReanalyzeButtons.tsx`), y enseña el precio. El modal **sí sabe** si el texto
   cambió —conserva el inicial— y cuántos hallazgos se descartaron, y no lo usa.
2. **El segundo no es necesariamente idéntico, y nadie explica por qué difiere.**
   ⚠️ **No porque el primero indexara**: en este recorrido el exhaustivo del aviso
   **no indexa nada** —`handleExhaustiveAnalysis` deja el resultado en
   `pendingAnalysis`, y el modal de Mejora trabaja sobre un documento todavía sin
   indexar—. Difiere por tres vías que el usuario no ve: los hallazgos que descartó
   (se excluyen), cambios del corpus hechos por otros entre medias, y la variación del
   propio modelo. **Del lado del documento la equivalencia se puede comprobar; del lado
   del corpus, no** (B.252). Por eso aquí cabe avisar, no demostrar.

Y el precio: sin descartes, **el segundo cuenta como análisis inicial**, sin descuento
de reanálisis.

**Sin arreglar.** Queda escrito para cuando haya usuarios que no sepan lo que sabe el
director.

### ⚠️ 17/09/2026 · EL DATO QUE LA DECISIÓN NO TENÍA DELANTE

El director pulsó rápido y después exhaustivo sobre `CLI-20`, que ya estaba indexado, y
luego «Reanalizar corpus» desde el modal. **Predicción de lo cobrado: 5 + 30 + 30**, dos
de ellos por cortes de duplicado que no llamaron al modelo (ver B.235, «el precio, en
producción»). Si la base lo confirma, **esta ficha se decidió sin esa cifra** y el
director la revisa con ella.

**REVISADA CON LA CIFRA EL 17/09/2026, y se mantiene.** Los dos cortes costaron **30 y 30**
(saldo 1.070 → 1.040 → 1.010). El director la sostiene con el mismo criterio que B.235: la
advertencia «IDÉNTICO… no va a encontrar nada» está delante y sin plegar, así que repetir es
decisión del usuario. **Sigue abierta en lo que dice su título**: el caso en que **no** se
avisa —un segundo exhaustivo sobre un documento que no es idéntico a nada indexado, sólo ya
analizado— no tiene aviso ninguno.

---

## ⚠️ 5.73 · B.257 — un trabajo fallido se sigue sondeando diez minutos, y el mensaje dice otra cosa (17/09/2026)

**Salió al comprobar si el rápido se pierde cuando el exhaustivo falla.** No se pierde
—ver abajo—, pero el camino hasta conservarlo está mal.

`useJobPolling.ts` lanza el error de un job `failed` con su `errorMessage`, y su propio
`catch` **sólo lo relanza si el mensaje contiene «falló» o «tiempo máximo»**. Cualquier
otro se trata como **error de red transitorio** y se sigue sondeando. Los mensajes
reales de un job fallido son `stale_timeout` (el barrido de zombis) o el texto crudo de
la excepción del worker: **ninguno contiene «falló»**. Resultado:

| pasa | lo que ve el usuario |
|---|---|
| el job falla en el worker o se barre como zombi | «Análisis exhaustivo en curso…» con la barra avanzando **hasta 10 minutos** (`MAX_WAIT = 600_000`), y al final «**ha superado el tiempo máximo de espera**» — no el fallo |

Sólo un job fallido **sin** mensaje llega con «falló sin mensaje de error» y corta a
tiempo.

**Lo que SÍ funciona, y era la premisa que se había dado por falsa**: cuando el
exhaustivo falla, el hook **restaura el análisis rápido** (`savedAnalysis`) en sus tres
salidas —respuesta HTTP fallida, job sin resultado y excepción—. **El rápido no se
pierde en el chat.** Y en la bandeja tampoco: un exhaustivo fallido no escribe fila, y la
del rápido sigue siendo la última del documento.

**Sin arreglar.**

---

## ⚠️ 5.74 · B.258 — la bandeja enseña el análisis más reciente, sea del tipo que sea, y no dice de qué tipo es (17/09/2026)

**Salió de un encargo cuya premisa no se sostenía**: «un exhaustivo fallido tapa un
rápido bueno». **Un exhaustivo FALLIDO no escribe fila** —el `catch` del worker sólo
marca el job—, así que no tapa nada: la fila del rápido sigue siendo la última. Pero
al comprobarlo, el mecanismo que se describía **sí existe por otras dos puertas**.

**EL MECANISMO, leído:** la bandeja (`review-list/route.ts`) y el detalle del documento
(`documents/[id]/analysis/route.ts`) se quedan con **la fila más reciente de
`analysis_results` por `document_id`**, **sin filtrar por `analysis_type`**: la
consulta de la bandeja ni siquiera pide esa columna.

| quién escribe una fila nueva | qué tapa | qué ve el usuario |
|---|---|---|
| **«Reanalizar estilo» desde la bandeja** (A8): fila `style`, con `contradictions_found = 0` y `recommendation = null` | **el análisis de corpus** del documento | ⚠️ **cero contradicciones y sin recomendación** — un análisis de estilo leído como si fuera de corpus. **Es la familia de «limpio sin haberlo mirado»** |
| **un exhaustivo INCOMPLETO** (F-71): fila `exhaustive` con resultado parcial | el rápido completo | los recuentos del parcial. El resumen dice «NO llegó a completarse», pero **la bandeja no enseña el resumen**: sólo recuentos y recomendación |

⚠️ **¿PUEDE EL USUARIO DISTINGUIR QUÉ ESTÁ VIENDO? NO.** El bloque de la bandeja no lleva
el tipo, y el detalle **sí lo devuelve** (`analysisType`) **pero ningún componente lo
lee**. Ni «rápido» ni «exhaustivo» ni «estilo» aparecen en pantalla junto al análisis.

**LEÍDO EN EL CÓDIGO, NO MEDIDO EN PANTALLA.** La forma de comprobarlo sin gastar: en la
base, documentos cuya fila más reciente es `style` teniendo una `quick` o `exhaustive`
anterior. Y en pantalla: reanalizar estilo desde la bandeja y mirar si sus
contradicciones pasan a cero.

**Sin arreglar.** Qué debe enseñar la bandeja cuando hay varias filas —la más reciente
de corpus, las dos, o la reciente con su tipo— es decisión de producto.

---

## 5.75 · La pérdida en la selección: qué se puede medir sin gastar, qué costaría medirlo bien, y lo que espera (17/09/2026)

Consulta de origen: F-109 (`claude/consultas-fable/F-109.md`).

### ⚠️ CONDICIÓN DE VALIDEZ, del director, antes que nada

**Toda medición de la pérdida en la selección vale MIENTRAS LOS CANDIDATOS RECUPERADOS
NO ALCANCEN 25.** A partir de ahí cortan la recuperación (se queda con 25) y el tope del
exhaustivo (25), y la referencia deja de ser «todo lo afín». **Número de hoy: máximo 10**
en las pasadas del historial consultado (§5.52). **Disparador: si alguna pasada llega a
25, esta forma de medir caduca y se rehace.**

### 1 · LO QUE YA ESTÁ GUARDADO — `SQL_F109_seleccion_CLI05.sql`, cero créditos

**Qué se guarda y qué no** (leído en el código): de cada pasada, **la lista de lo que
llegó al juez** (`analysis.judgments`) y **los hallazgos finales**. **De lo que la
selección descartó no queda nada**, ni el id: sólo el recuento, y desde el 16/09.
Por eso la acotación gratis que propone F-109 —cruzar los descartes históricos— **no se
puede hacer**; lo que sí se puede es comparar lo que juzgó cada modo en pasadas del mismo
documento, y el 14/09 CLI-05 tiene un exhaustivo y cinco rápidos.

**Predicción, escrita antes:** el exhaustivo juzga más (6-9 frente a 4-5) y casi todo lo del
rápido está dentro; lo que sólo juzgó el exhaustivo da **cero contradicciones
confirmadas**; y los cinco rápidos no seleccionan siempre lo mismo.

**¿Invalidan esas pasadas los cambios de esta semana? No las invalidan: las acotan.**

| cambio | ¿afecta a lo que se lee? |
|---|---|
| orden por confianza antes de cortar (16/09) | **no**: el rápido seleccionó 4-5 con tope 6, el tope no cortó |
| documentos juzgados dos veces | **se ve en los datos**: la consulta 1 cuenta `veces_juzgado` (B.253) |
| reparto de contadores | **no**: la consulta no lee esos contadores |

**Y cuatro confundidores que sí acotan lo que se puede concluir:**
- **el juez no ve lo mismo**: rápido, los primeros 6.000 caracteres del documento
  montado desde sus trozos; exhaustivo, el documento entero. Un hallazgo del exhaustivo
  con la cita más allá del 6.000 **no lo habría encontrado el rápido aunque lo hubiera
  seleccionado** — lo mide la consulta 3, con la posición aproximada (se busca en el
  texto plano del job, no en el texto montado que ve el juez);
- **el exhaustivo también selecciona**, con instrucción permisiva: la comparación mide
  la pérdida del rápido RESPECTO del exhaustivo, **no respecto de lo que el juez habría
  visto**. Es cota inferior;
- **el exhaustivo pasa además por Sonnet**: sus hallazgos son más estrictos, no más;
- **el corpus pudo cambiar** entre las pasadas del día, y no hay forma de saberlo (B.252).

### 2 · SI NO BASTA: EL EXPERIMENTO

⚠️ **Hay dos, y no son el mismo:**

| | rápido contra exhaustivo | bypass (el de F-109 P3) |
|---|---|---|
| qué mide | lo que pierde la selección ESTRICTA frente a la PERMISIVA | lo que pierde la selección frente a **juzgarlo todo** |
| código | ninguno | **sí**: saltarse la selección en una pasada de prueba. «Un bypass de una condición» es la estimación de Fable, **no medida aquí** |
| cuándo, según F-109 | — | **después** de arreglar el material de la etapa 2, para no medir lo condenado |

**Montaje del que no necesita código**: CLI-05 —el documento con vecindario poblado que ya
tiene historial—, **tres rápidos y un exhaustivo**, lanzados seguidos y sin tocar el corpus
entre medias. Tres rápidos y no uno, por el punto 3 de la predicción: la selección varía
entre pasadas y se compara contra su unión.

**Coste**: 3 × 5 + 30 = **45 créditos**.

**Predicción**: la misma que la del punto 1.

**LAS TRES LECTURAS, escritas antes:**

| resultado | se lee como |
|---|---|
| lo que sólo juzgó el exhaustivo da **cero** hallazgos confirmados, **y** en lo que juzgaron los dos hay al menos uno (el juez ve: control positivo) | **la selección estricta descarta bien** en este corpus — sobre esta población y con la condición de validez |
| **al menos un hallazgo confirmado** en un documento que ningún rápido seleccionó, con la cita **dentro de los primeros 6.000 caracteres** | **la selección pierde hallazgos reales**: pérdida medida y caso decisivo para la etapa 2 |
| el hallazgo sólo-exhaustivo tiene la cita **fuera de los 6.000** o **no localizable**; o no hay ningún hallazgo en ningún candidato (sin control positivo); o los rápidos ya cubren lo que cubrió el exhaustivo | **no concluye nada** sobre la selección: o mide al juez, o no hubo con qué comparar |

### 3 · LO QUE NO SE TOCA TODAVÍA — con su condición escrita

| pieza | espera a | por qué |
|---|---|---|
| **el umbral de 0,50** y su paso a corte relativo | **la medición del punto 1 o 2** | es B.248. No urge: la selección ya hace de filtro real, y lo que el umbral deja pasar cuesta una llamada barata. F-109 coincide. ⚠️ **Resuelto el 17/09 contra §5.68, que decía «instrumentar ahora»**: las dos filas se contradecían y el director eligió partirlo — **se instrumenta ya** (hecho: comentario, caso decisivo, contador) y **lo que espera es sólo la calibración** |
| **el recorte del rerank** —mandar las unidades afines enteras en vez de 300 caracteres en seco y el principio del documento— | **la medición del punto 1 o 2** | es un cambio en la etapa que decide qué se compara; sin el número de antes no se sabría si mejora |
| **la instrucción «sé estricto»** del rápido | **el recorte del rerank, estable y medido** | es un dial de prompt: se mueve solo, con tanda antes y después (F-109 P4, y el balance emisión/contención de `Cierre_B81.md`) |

**Esperan a la medición, no a que alguien se acuerde.**

### 17/09/2026 · AÑADIR VEINTE DOCUMENTOS AL CORPUS — NO HOY, y queda para la etapa 2

El director preguntó si añadirlos. **Para la tanda del worker no hacía falta** y habría
metido tres variables en una medición que sólo quería saber si el worker funciona: el
aviso de cobertura, el tope cortando y más candidatos.

**Queda apuntado para la medición de la etapa 2**, con la condición ya escrita arriba:
**documentos sueltos no bastan; hacen falta contradicciones sembradas entre ellos.**

### ⏸️ APLAZADA EL 17/09/2026 — decisión del director, con sus razones

**No se escribe el modo de instrumentación ni se lanza ninguna de las dos variantes.**
Las razones, escritas para releerlas al retomarlo:

- **Con tres candidatos elegibles el tope no puede cortar.** Medir hoy mediría un caso que
  no se parece al de un cliente.
- **Para que un descartado produzca un hallazgo tiene que haber algo que encontrar.** Un
  corpus montado sin contradicciones sembradas daría «no se perdió nada» sin poder
  distinguir si la selección acierta o si no había nada que perder: **un cero sin control
  positivo**.
- ⚠️ **LO QUE NO ES UN MOTIVO: la irreversibilidad.** El director puede retirar documentos
  borrándolos de Drive y sincronizando. Donde esta casa lo escribió como coste de un
  experimento (`Tandas_Harness.md` §2 y la vía A del 16/09, y §5.57 aquí) queda
  corregido a la vista.

⚠️ **CONDICIÓN DE CADUCIDAD, no nota:** comparar dos modos para medir la selección
**caduca cuando los candidatos recuperados alcancen el tope alto**. Máximo de hoy: **10**.
**Si alguna pasada llega a 25, la etapa 2 deja de poder medirse así.**

**Lo que haría falta para retomarlo**: un corpus real de cliente, o uno de pruebas con
**contradicciones sembradas repartidas entre varios documentos** — según el encargo,
trabajo de una sesión; **esa estimación no está medida aquí**.

⚠️ **Y DOS CORRECCIONES QUE EL ENCARGO ME ATRIBUÍA Y NO SON MÍAS**, escritas para que no
se archiven como tales:
- **«Los hallazgos del 14/09 no existen» — no lo dije y no es así.** Lo que no existe son
  los DESCARTES de la selección. Los hallazgos y la lista de lo que llegó al juez **sí están
  guardados**, y `SQL_F109_seleccion_CLI05.sql` los lee.
- **«El exhaustivo cambia seis cosas y eso invalidaba el experimento de Fable» — tampoco.**
  Contadas por capacidad son **al menos diez** (lista en `Tandas_Harness.md`, corrección del
  17/09). Y lo que señalé —que el exhaustivo también selecciona— afecta a la variante
  **rápido contra exhaustivo**, que es cota inferior. **El experimento de Fable es otro**:
  mandar todo lo recuperado al juez saltándose la selección, y eso no lo invalida; lo
  condiciona la caducidad de arriba.

---

## ⚠️ 5.76 · La propiedad, no las claves: por qué el caso del 15/09 no cazaba a las nuevas (18/09/2026)

### Lo que se comprobó ANTES de arreglar nada

El encargo daba por hecho que «la batería recorre el catálogo entero», y **no es así**.
`counters.test.ts` comprueba dos cosas: que la lista sea **exactamente la declarada** y
que cada nombre **lleve apellido de etapa** (`:107-109`). **Nada comprobaba que una clave
llegue a escribirse.** El caso del 15/09 vigilaba **dos claves del estilo, por su
nombre**, así que no cubría ninguna clave nueva — ni podía.

⚠️ **Y no se dijo lo contrario en ningún momento**: el 17/09 quedó escrito que esa batería
comprueba que la clave está **declarada**, «no que se escriba siempre», y que la prueba de
la propiedad **no estaba escrita**. Lo estaba diciendo el propio informe del día anterior.

### El arreglo es el caso, no las claves

Las nueve claves `seleccion.*` salen ahora de **emisores**: funciones puras que devuelven
**todas** las suyas, siempre, también en cero (`contadores-de-seleccion.ts`, más el
emisor del reparto que ya existía). El pipeline deja de escribirlas a mano y funde lo que
devuelven.

Y la batería vigila **la propiedad**:
- toda clave `seleccion.*` del catálogo **tiene emisor**;
- ningún emisor escribe una clave **no declarada**;
- **con todo a cero, las nueve están presentes y valen 0**;
- y la **única ausencia legítima** es `descartados_por_criterio` en el fallback del rerank
  (B.254), que tiene su propio caso: falta ésa **y sólo ésa**.

**Mutantes**: «un emisor omite su clave cuando vale cero» → 3 en rojo; «entra al catálogo
una clave sin emisor» → 5 en rojo. **Predicción: +6 pruebas; salieron +6.**

### ⚠️ Y LOS `NULL` NO ERAN ESTO

Las tres claves que se consultaron —`bajo_umbral_recuperacion`, `sobre_tope_25`,
`bajo_umbral_verificador`— **no existen en ninguna línea del repositorio**, y `->>` sobre
una clave ausente devuelve `NULL`. Las reales son dos y se llaman
`seleccion.candidatos_perdidos_por_umbral` y
`seleccion.candidatos_cortados_por_tope_de_recuperacion`. **No hay contador del
verificador.**

**La consulta que lo cierra sin depender de acertar un nombre** pide las claves que la
fila trae de verdad:

```sql
select ar.created_at, ar.document_name, ar.analysis_type,
       ar.pipeline_counters is null as sin_contadores,
       k.clave, ar.pipeline_counters ->> k.clave as valor
from analysis_results ar
left join lateral jsonb_object_keys(ar.pipeline_counters) as k(clave) on true
where ar.org_id = '<ORG_ID>'
  and ar.created_at >= '2026-09-17 22:18:00+00'
  and (k.clave is null or k.clave like 'seleccion.%')
order by ar.created_at desc, k.clave;
```

⚠️ **Y hay un segundo camino que también da `NULL` en TODO, y no es un fallo**: un análisis
cortado por **duplicado exacto** sale por `buildExactDuplicateResponse` sin pasar por el
pipeline, así que `pipeline_counters` queda **entero a null**. La columna `sin_contadores`
de la consulta lo distingue de «la clave no existe».

### La hora perdida, contada

El circuito persiguió durante una hora el commit `b1ed4972` y el endpoint
`/api/admin/version`. **Ninguno de los dos existe**: `git cat-file` lo dice en un segundo, y
el 404 del endpoint lo estaba diciendo solo. El arquitecto lo reconoce como indicativo suyo
sobre el código, emitido sin repositorio y repetido como hecho.
**Lo que lo hace regla y no anécdota**: un hash y una ruta son **comprobables en un
segundo**, así que cualquiera que entre en el circuito llega con esa comprobación hecha o
no se anota. Es la tercera vez en el día que entra una pieza que nadie construyó —dos
hashes, tres claves de contador, un endpoint—, y las tres veces costó encargos enteros.

---

## ⚠️ 5.77 · EL CERO INVISIBLE DEL ESTILO, y el saldo de una noche de nombres inventados (18/09/2026)

### Lo que se arregla, y lo encontró un censo por capacidad

`analyzeStyle` emitía sus tres contadores **bien** —siempre, también en cero, corregido
el 15/09— y el pipeline exhaustivo se quedaba con `r.problemas` y **tiraba
`r.contadores`**. Resultado: en el camino de **30 créditos**, que es donde el estilo corre
de verdad, `averia.estilo_descartado_por_tipo`, `averia.estilo_descartado_sin_ancla` y
`averia.estilo_cita_no_encontrada` **nunca llegaron a la base**. Sólo las guardaba el
endpoint suelto `/api/analyze-style`, de 2 créditos.

⚠️ **NINGUNA PRUEBA PODÍA VERLO, y eso es el hallazgo de método**: el emisor tenía su
batería y estaba verde; la clave estaba en el catálogo y el canario también. **Un test de
unidad no ve una tubería cortada aguas abajo.** Lo destapó un censo **por capacidad** —qué
módulos emiten contadores y cuáles de esos emisores están cableados a lo que se persiste—,
no una búsqueda por nombre.

**El censo, entero**: 38 claves, 9 emisores. Ocho cableados
(`contadores-de-seleccion`, `reparto-del-rerank`, `diff-vision`, `table-pairing`,
`table-diff`, `diff-emision`, la cascada en `pipeline.ts`, y el `averia.exhaustivo_sin_clasificar`
del worker). **Uno roto: `style-check`.**

**La forma del arreglo — el estado ilegal irrepresentable, no un comentario pidiéndolo:**
`conContadoresDelEstilo(analisis, estilo)` **exige el `ResultadoDelEstilo` completo**, así
que volver a quedarse con la lista de problemas **no compila**. Comprobado mutando: el
mutante «el exhaustivo vuelve a quedarse sólo con `problemas`» da **dos errores de tipo**.
Y el caso va **donde falló** —sobre el objeto que recibe `saveAnalysisResult`, no sobre
`style-check`—: mutar el emisor a `{}` deja **1 en rojo**, y mutarlo para que los ceros
salgan como ausencia, **1 en rojo**.

**Predicción escrita antes: +3 pruebas. Salieron +3.**

### Dos hallazgos de higiene del mismo censo, SIN ARREGLAR

- **`diff-emision.ts:231`**: `if (preIndexado > 0) counts['diff.clasificacion.pre_indexado'] = …`
  — **ausente cuando vale cero**, la misma forma que el fallo del 15/09 y sin ausencia
  declarada. Y el comentario del catálogo (`counters.ts:179`) sigue diciendo «SIN PRODUCTOR
  TODAVÍA»: **caducó**, porque productor tiene.
- **`pipeline.ts:1026`**: las siete claves de visión se montan con plantilla,
  ``counters[`diff.vision.${k}` as keyof typeof counters]``. Hoy los nombres casan, pero el
  `as` **anula la comprobación del catálogo en compilación**: una propiedad mal escrita
  produciría una clave que `mergeCounters` tiraría con un `warn`, en silencio. Es lo que
  hizo que un primer censo por literal las diera por huérfanas.

### ✅ EL CONTADOR DEL VERIFICADOR: NO SE ESCRIBE — decisión del director

`verifyClaimsAgainstCorpus` tiene **un solo llamador**, dentro de `if (atomicBranchEnabled())`,
que exige `ANALYSIS_ATOMIC_MEASURE` y está apagada. Luego el umbral de
`CORPUS_SCORE_THRESHOLD` (`verify-claims.ts:85`, aplicado en `:323` con un `continue` mudo)
**no se ejecuta en producción**.

⚠️ **Un contador ahí no daría cero: daría AUSENCIA en todas las filas** — el defecto mismo
que los contadores vienen a eliminar. **Su población es cero por construcción, no por
suerte**, y es el mismo criterio con el que se descartó la excepción del reembolso por
tiempo agotado. Además, el número es la MISMA constante que la recuperación, y ésa **ya
tiene su contador** desde `67cd79ee`.

**Y la rama no se retira**: retirar código apagado es decisión de producto y no urge. Queda
**DECLARADA en el código, con revisión el 18/12/2026**.

### ⚠️ EL SALDO DE LA NOCHE, CONTADO — y la regla que sale de él

En trece horas entraron en el circuito, todos desde el arquitecto y sin repositorio delante:
- **cuatro hashes que no existen**: `4f3ec99f`, `b1ed4972`, `7e6cb1b`, `2e73e0bd`;
- **tres nombres de contador inventados**: `bajo_umbral_recuperacion`, `sobre_tope_25`,
  `bajo_umbral_verificador` — y `->>` sobre una clave ausente devuelve `NULL`, así que los
  tres producían el síntoma que se estaba investigando;
- **un contador dado por inexistente cuando existía** desde la mañana anterior
  (`seleccion.candidatos_cortados_por_tope_de_recuperacion`, en `67cd79ee`);
- **un commit atribuido a un turno que fue sólo lectura**;
- y **un test de integración atribuido a esta casa que nunca se escribió**, del que se
  derivó un diagnóstico («el módulo emite y nadie recoge») que era prosa devuelta en
  indicativo.

**Coste real**: cuatro análisis del director y tres visitas a Vercel, sobre código que
estaba desplegado desde el día anterior.

⚠️ **LA REGLA QUE QUEDA, y la formuló el arquitecto al reconocerlo**: **cuando una consulta
por nombre devuelve vacío repetidamente, la siguiente pregunta es QUÉ NOMBRES EXISTEN, no
por qué falla.** Lo que cerró el caso fue `jsonb_object_keys` — preguntar a la fila qué
claves trae— en vez de seguir buscando las que alguien afirmaba. Es la versión de datos de
la regla del censo por capacidad: **no se enumera de memoria, se le pregunta al objeto.**

---

## ✅ 5.78 · EL AVISO DE CORPUS CAMBIADO — cierra lo que §5.19 dejó abierto (18/09/2026)

> ✅ **EJERCIDO EN PANTALLA POR EL DIRECTOR EL 18/09/2026.** No es «desplegado y
> probablemente bien»: se probó y el aviso sale. Es el tercer grado de la escala de
> F-95 P5 —ESCRITO, CONTADO, EJERCIDO— y el que casi nunca se alcanza el mismo día.

**Lo que estaba mal**, medido en pantalla el 14/09 (§5.19): tras reemplazar un documento,
el chat siguió devolviendo el texto anterior **entero**. El mecanismo no es el corpus —la
recuperación es fresca en cada turno— sino el **historial**: el cliente manda los últimos
6 mensajes (`useChat.ts`), y las respuestas anteriores del asistente **contienen el texto
que citaron entonces**. Pasa igual con documentos **borrados**.

⚠️ **Y B.225 no lo cubría**, aunque lo pareciera: aquella guarda filtra la RECUPERACIÓN
(los `vivos` de `rag.ts`). Esto no entra por ahí. Las dos son independientes.

### Lo que entra

Un mensaje en la conversación, con **rol propio `aviso`** —ni `assistant`, que se leería
como el modelo hablando, ni `error`, que alarmaría de algo que el usuario quería—, en los
**cinco puntos** que cambian el corpus desde esa pantalla: alta, reemplazo desde la subida,
reemplazo desde el modo mejora, **borrado** y sincronización de Drive.

**Dos textos, porque son dos significados** (F-100: un campo con dos preguntas contesta mal
a una): lo reemplazado o borrado **puede citar contenido que ya no existe**; lo añadido hace
que las respuestas anteriores **puedan estar incompletas**. El sync elige texto **por lo que
de verdad hizo** —sus recuentos—, no por el gesto.

**Y nombra la salida**: «usa **Limpiar chat**». El botón ya existía (`chat/page.tsx`); §5.19
se quejaba de que «las dos salidas son recargar o seguir hablando, y **ninguna se le dice al
usuario**». Eso queda cerrado. **No se borra nada**: borrar la conversación sería peor que el
problema.

⚠️ **El borrado era el ÚNICO camino mudo**: `handleDelete` borraba, recargaba la lista y no
escribía ni un mensaje. Indexar y reemplazar ya hablaban.

### ⚠️ LA PÉRDIDA, DECLARADA — y es decisión, no descuido

El aviso sale cuando el corpus cambia y hay conversación abierta, **sin comprobar si la
respuesta anterior citaba justo ese documento**. Así que **puede salir cuando no hacía
falta**.

La alternativa —cruzar lo que cambió con lo que se citó— **se descartó con su razón**:
`sources` viaja por **NOMBRE y no por id** (`hooks/chat/types.ts`), y un reemplazo **cambia
el nombre** (B.218). Ese cruce fallaría **precisamente al reemplazar**, que es el caso más
frecuente y el que se midió. Para hacerlo bien haría falta que `sources` llevara ids: otra
pieza.

⚠️ **Y POR ESO EL TEXTO DICE «PUEDE», NO «CITA»**: el sistema no sabe si la respuesta
anterior citaba lo que cambió, y afirmarlo sería una causa no medida (§5.66). Tiene caso: un
mutante que cambie «puede citar» por «cita» deja **2 en rojo**.

### Lo que NO se toca, decidido y con su razón

**No se ajusta cuánto historial se manda al modelo** (`MAX_HISTORY_MESSAGES = 6`,
`lib/rag.ts:43`). **Razón del director**: cambiaría el comportamiento del chat entero —el
seguimiento de preguntas y la reescritura de la consulta dependen de esa ventana— y eso es
otra pieza. Queda **decidido**, no pendiente olvidado.

**Y la detección en el servidor queda propuesta y sin escribir**, con su diseño ya medido en
el esquema: cubriría lo que el cliente no ve —otra pestaña, un sync que no lanza el usuario,
otro usuario de la organización— pero **no puede nombrar el documento**, sólo decir que algo
cambió. ⚠️ Y su primera forma —`select count(*), max(updated_at) from documents where org_id`—
**crece linealmente con el corpus**: `idx_documents_org_id` no incluye `updated_at`, así que
hay un acceso al heap por fila del org. De 42 a 5.000 es ×120 de trabajo, justo cuando el
producto funcione. **La forma buena es O(1)**: una `corpus_version` en `organizations` movida
por un trigger en `documents` (insert, update **y delete**), devuelta por `consume_credits`,
que **ya lee esa misma fila y la toma en exclusiva con `FOR UPDATE`**
(`supabase-setup.sql:81-85`) — **cero consultas nuevas por pregunta**. Necesita cambio de esquema, así que su SQL va antes del código.

### Predicción y mutantes

**Predicción escrita antes: +8 pruebas. Salieron +10 — fallada por arriba.**

Los cuatro mutantes, todos muertos: quitar la guarda de conversación sin respuesta, **1**;
cambiar «puede citar» por «cita», **2**; contar como respuesta cualquier mensaje del
asistente —incluidos los avisos de documento—, **1**; y hacer que un sync sin cambios avise
igual, **1**.

⚠️ **El mutante que el encargo pedía —«mirar toda la conversación en vez de la última
respuesta»— NO APLICA a este diseño**, y se dice para que no se archive como hecho: no hay
ningún recorrido por documento que mutar. El encargo describía el diseño descartado. El
equivalente real es el tercero de la lista.

---

## ⚠️ 5.79 · Tres huecos que no se ven porque no producen ningún fallo (22/09/2026)

**Los tres salieron del ticket a Pinecone de F-115**, y ninguno se habría encontrado
persiguiendo un fallo: aparecieron porque un tercero pidió datos y no los teníamos. Son
de la misma familia —**cosas que el sistema NO escribe**— y la familia es la peor de
auditar, porque su síntoma es el silencio.

⚠️ Y comparten la forma de descubrirse, que conviene guardar: **la lista de lo que un
proveedor pide en un ticket es un censo de capacidad gratis.** Nadie de esta casa había
enumerado «qué haría falta para explicarle a alguien de fuera lo que nos pasa».

### ⚠️ B.259 — un borrado que sale bien no deja ninguna línea en el log: no se puede fechar ni auditar (22/09/2026)

`deleteDocument` tiene **cinco puertas y sólo escribe en las que fallan**: el fallo de la
lápida devuelve error (`lib/delete-document.ts:141`), el de los análisis también
(`:173`), los dos fallos de vectores emiten `console.warn` (`:188`, `:202`), y el del
cerrojo devuelve con su mensaje (`:241-246`). **El camino bueno —`result.ok = true`,
`lib/delete-document.ts:273`— no emite nada.**

Consecuencia: **de un borrado que funcionó no queda constancia de ningún tipo.** No hay
fila —se borró—, no hay lápida salvo en documentos sincronizados excluidos a mano
(`:125`, y el `CHECK` de la tabla es por `provider_file_id`), y no hay línea de log.

**El caso que lo paga tiene nombre y fecha**: no se sabe cuándo se borró CLI-05
(`c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6`). Se sabe que fue después de las 20:30 UTC del
14/09/2026 —su último análisis— y antes de las 15:18 UTC del 21/09, y nada más. Esa hora
es justo el dato que el proveedor necesita para rastrear la incidencia, y el que no
tenemos. Y hay un segundo coste que se descubrió al escribir el ticket: **tampoco se
puede saber qué versión del código corría**, así que la garantía del cerrojo de `:241-246`
—que existe desde `602c95f3`, 14/09/2026 19:29 UTC— no se puede afirmar del build que
hizo ESE borrado.

⚠️ **Y ES UNA OPERACIÓN DESTRUCTIVA E IRREVERSIBLE SIN REGISTRO**, que es la forma más
cara de este hueco: la regla de F-95 P5 pide contador para todo límite declarado, y aquí
ni siquiera hay un evento. Lo mínimo sería una línea con hora, `documentId`, cuántos
vectores se pidieron borrar y por cuál de las dos vías; lo correcto, una tabla.

**Sin arreglar.** No se mezcla con el arreglo del `filterOk || idsOk` de F-115 P5, pero
va en la misma pieza: quien toque ese camino escribe el registro.

### ⚠️ B.260 — la configuración del índice de Pinecone no está en el repositorio (22/09/2026)

**Tipo de índice, nube, región y métrica de similitud: ninguno de los cuatro consta.** El
índice se creó **a mano en la consola**, y el repositorio no tiene ni una llamada a
`createIndex` (`grep -rn "createIndex" --include=*.ts .` → cero resultados fuera de
`node_modules`). Lo único que hay son dos variables con nombre —`PINECONE_API_KEY` y
`PINECONE_INDEX` (`lib/pinecone.ts:8`, `:16`)— y un valor por defecto,
`'documentation-hub'`, que el director confirmó el 22/09/2026 como el valor real en
Vercel.

**Qué cuesta, y no es teórico**: el 22/09 hubo que retirar cuatro líneas del ticket a
Pinecone por no poder rellenarlas, y el director **no localiza el índice en su consola**
—probablemente está en otro proyecto—, así que tampoco se pueden recuperar desde fuera
hoy mismo. Si mañana hay que recrear el índice, **nadie sabe con qué parámetros se creó
el que funciona**: la métrica y la dimensión deciden si los vectores existentes siguen
valiendo.

⚠️ **La métrica es la más grave de las cuatro**, porque es la única que cambia lo que
significa un score: todas las mediciones de F-111 a F-115 —el suelo de 0,696, los
histogramas, el termómetro— están calibradas contra una métrica **que no está escrita en
ningún sitio**.

**Sin arreglar.** No se arregla adivinando: se lee en la consola y se escribe, y el sitio
natural es junto a `lib/pinecone.ts` con la fecha de la lectura.

### ⚠️ B.261 — no hay `.env.example`: no existe ninguna lista escrita de las variables que la aplicación necesita (22/09/2026)

`ls -a | grep -i env` devuelve **sólo `next-env.d.ts`**, que es un fichero de tipos de
Next y no una plantilla. No hay `.env.example`, `.env.template` ni equivalente.

**Lo que hay en su lugar son tres listas parciales y ninguna autoritativa**: la tabla del
`README.md` (`:63-64` para las de Pinecone), la comprobación de arranque del worker
(`worker/src/index.ts:551-552`, que sí falla si faltan las suyas) y **el propio código**,
donde cada `process.env.X` es la única declaración de que X existe.

**Por qué importa más de lo que parece**: es el censo por capacidad que nadie ha hecho
sobre la configuración. Sin esa lista no se puede contestar «¿qué hace falta para
levantar esto?», y cada respuesta que se dé será **de memoria** — que es exactamente la
forma de enumerar que este proyecto lleva semanas retirando. El caso de B.260 es su
primera factura: cuando hizo falta saber qué configuración teníamos, la respuesta hubo
que reconstruirla con `grep`.

⚠️ **Y la plantilla lleva NOMBRES, nunca valores.** Una clave de Pinecone o de Anthropic
en un fichero versionado es peor que no tener plantilla.

**Sin arreglar.** Y su forma buena no es una plantilla escrita a mano, que se desincroniza
en el primer commit: es **derivarla** del censo de `process.env` con su comprobación, para
que el día que alguien añada una variable sin ponerla en la lista, algo lo diga.

---

## ⚠️ 5.80 · Lo que el proveedor no garantiza, y la decisión de no preguntárselo (22/09/2026)

### ⚠️ B.262 — un vector borrado puede seguir saliendo en las consultas de Pinecone, y el ticket quedó sin enviar (22/09/2026)

**El hecho, medido y no deducido.** CLI-05 (`c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6`) se
borró desde la aplicación entre las 20:30 UTC del 14/09/2026 y las 15:18 UTC del 21/09.
No tiene fila en `documents` ni en `document_chunks`, el listado exhaustivo por prefijo
dio **0 vectores** el 21/09 a las ~17:09 y `describeIndexStats` dio **680 = 680**
documentados. Aun así, sus seis vectores **volvieron en las consultas** el 21/09 a las
~15:18 y a las 16:28, y otra vez el 22/09 a las 09:01. La secuencia medida es
**ausente → presente → (ausente del listado) → presente**, que no es un borrado que
tarda: es una reaparición. Todo el expediente está en `claude/consultas-fable/F-115.md`.

⚠️ **LO QUE ESTO SIGNIFICA PARA EL PRODUCTO, Y ES UNA FRASE INCÓMODA: «borrado» no
significa hoy «borrado en la consulta».** Significa «borrado en nuestra base, y pedido al
proveedor». Entre las dos cosas hay una ventana que **nadie ha medido** y que el
fabricante sólo describe como «un ligero retraso».

✅ **LO QUE SÍ ESTÁ CUBIERTO, y es la mitad que importa hoy**: desde `ea6e818d` la
recuperación pregunta **primero** si el documento existe —`Vivos(org)`,
`lib/documents/vivos.ts`— y descarta lo que no tiene fila **antes de puntuar**, en los
cuatro caminos que llegan al usuario: análisis, chat, `improve` y el agente. Ejercido en
producción el 22/09 a las 09:01: `sin_fila_viva: 6` con sus seis `ids_sin_fila_viva`
escritos en el termómetro, y **el usuario no vio nada**. Es una defensa nuestra, no una
garantía del proveedor: **tapa el síntoma en el camino del usuario y no cura la causa.**

**LA DECISIÓN DEL DIRECTOR, 22/09/2026: el ticket NO se envía.** Sus dos razones: la
defensa ya protege al usuario, y con el plan gratuito no hay soporte garantizado, así que
el texto podría no tener lector. El ticket queda escrito y archivado en
`claude/incidencias-de-proveedor/2026-09-22_pinecone_borrados-que-vuelven.md`, en dos
versiones —una corta revisada, lista para enviar, y el borrador largo con su errata
anotada— **para que retomarlo cueste cero trabajo**.

⚠️ **EL DISPARADOR, ESCRITO PARA QUE NO DEPENDA DE QUE ALGUIEN SE ACUERDE**: se retoma
**el día que un cliente pida garantías sobre el borrado real de sus datos**. Y ese día no
es hipotético — en el reparto europeo el cliente es responsable, esta casa encargada y el
proveedor subencargado, y la obligación de borrado baja por esa cadena. Hoy no hay
incidente que notificar (el documento fantasma es un protocolo de pruebas del propio
director, sin datos personales); **el día que haya un cliente, la frase «hoy no hay
cliente» pasa de razón a suerte retrospectiva.**

⚠️ **Y LO QUE NO SE PUEDE DECIR, dicho aquí para que nadie lo complete de memoria: la
causa no está establecida.** Quedaban tres hipótesis —el proveedor sirviendo una copia
vieja, una escritura nuestra, o ids de otro esquema—. La tercera murió: los seis ids son
`…-0` a `…-5`, generación 1, exactamente los seis trozos originales. La segunda es muy
difícil de sostener: ningún camino de escritura del repositorio puede producir ese
`documentId` sin una fila que ya no existe. Pero **descartar dos no demuestra la
tercera**, y sin respuesta del proveedor no la va a demostrar nada. Queda como
**NO EXPLICADO**, que es distinto de resuelto.

**Sin cerrar, y sin trabajo pendiente asignado.** Lo único que quedaría por hacer si se
retomara —medir la recurrencia con un documento canario y una sonda de siete días— está
descrito en F-115 P3 y **no está escrito ni empezado**.

---

## ⚠️ 5.81 · Un rojo que no era del código: el reloj de pared midiendo la máquina (23/09/2026)

### ⚠️ B.263 — un caso puro y determinista caía por timeout una pasada de cada cinco, y era el único con margen pequeño (23/09/2026)

**Cómo salió, y no salió persiguiéndolo**: el 22/09 pusheé un commit con la suite en ROJO
—`1 failed | 1287 passed`— porque encadené `vitest && commit && push` en un solo comando y
el push corrió igual. **Mi fallo, y es el mismo de `a3423ef2`** (§5.70) repetido seis días
después. Agravado: filtré la salida con `tail -5`, así que **perdí el nombre del caso**, que
es exactamente lo que el MÉTODO manda capturar entero.

**Qué era.** `lib/documents/nombre-corregido.test.ts`, el caso «DOS GUARDADOS EL MISMO DÍA
DAN EL MISMO NOMBRE». Salida literal:

```
Error: Test timed out in 5000ms.
 ❯ lib/documents/nombre-corregido.test.ts:30:3
 Test Files  1 failed | 85 passed (86)
      Tests  1 failed | 1287 passed (1288)
   Duration  40.39s (transform 16.14s, setup 4.34s, import 98.84s, tests 88.38s)
```

⚠️ **NO ERA UN FALLO LÓGICO, Y EL CASO NO PUEDE DAR DOS RESULTADOS**: es síncrono, con dos
`Date` fijas construidas con componentes locales, compara dos cadenas, no lee nada, no
escribe nada y no depende del orden. **Lo único que varió fue cuánto tardó.** El reporter lo
dice: **5.173 ms** ese caso, **1-2 ms** los once siguientes del mismo fichero.

**Las tres mediciones que lo cierran:**

| Medición | Resultado |
|---|---|
| El caso **aislado**, cinco pasadas | **44, 48, 49, 48, 46 ms** — estable |
| Los once casos siguientes del mismo fichero, misma función, en la pasada roja | **1-2 ms** cada uno |
| La **primera** llamada a `toLocaleDateString('es-ES', …)` en un Node limpio | **41,40 ms**; las mil siguientes, 0,24 ms de media |

**La causa, con su aritmética.** Ese caso es el primer `it` del fichero, así que pagaba la
carga de los datos de ICU —41 ms de una vez por worker— que ningún otro caso de la suite
pagaba. Su coste real: ~45 ms. En la pasada roja la suite iba al doble de lenta (40,39 s de
pared frente a ~20 s), y con los workers compitiendo por CPU esos 45 ms **se estiraron a
5.173 ms de pared**, cruzando el tope de 5.000 ms por 173 ms.

⚠️ **POR QUÉ ERA ÉSE Y NO OTRO, que es la parte que hay que conservar**: con 1-2 ms de coste,
a cualquier otro caso le hacen falta ~2.500× de estiramiento para cruzar los 5 s. **A éste le
bastaban 115×.** Era el único caso de la suite con un coste fijo de decenas de milisegundos,
o sea **el único con margen pequeño**. No fue mala suerte: fue el eslabón corto, y el eslabón
corto se puede calcular antes de que se rompa.

**Arreglado, las dos mitades en el mismo commit.** (1) `vitest.setup.ts` calienta `Intl` una
vez por worker, así que el coste fijo sale del camino de los casos y el primero pasa a costar
1-2 ms como el resto. (2) `vitest.config.mts` sube `testTimeout` a 15.000 ms. **Una sola de
las dos deja la mitad del problema, y la mitad que deja es la que no se ve.** Se descartó la
tercera opción —calentar sólo en ese fichero— porque arregla el caso y deja la causa: el
siguiente caso con coste fijo volvería a ser el eslabón corto y nadie se acordaría.

**Control positivo: 20 pasadas seguidas de la suite completa, las 20 en verde.** Sin él no se
podría afirmar nada — el rojo del 22/09 salió a la quinta pasada y el del 23/09 a la primera,
así que una sola pasada verde nunca fue evidencia de nada.

⚠️ **LA REGLA QUE SALE DE AQUÍ, y vale para cualquier instrumento de esta casa: UN LÍMITE DE
TIEMPO DE PARED SOBRE CÓDIGO DETERMINISTA NO MIDE EL CÓDIGO: MIDE LA MÁQUINA.** Un tope así
convierte la carga de la máquina en un veredicto sobre el commit, y lo hace con la misma cara
que un fallo de verdad. Su coste real no es el rojo: es que **enseña a no creerse el color**,
y un rojo que nadie cree ya no protege nada. Cuando un tope se aplique a algo determinista,
la pregunta es qué margen tiene el eslabón más lento — y ese margen se calcula, no se supone.

⚠️ **Y SU MITAD DE PROCEDIMIENTO, que es la que me tocaba a mí**: la suite se ejecuta en un
comando, **se lee el resultado**, y sólo en verde va el commit en otro comando y el push en un
tercero. **Nada de `&&`.** Un encadenamiento no es una comodidad: es delegar la decisión de
subir a un código de salida que nadie ha mirado.

---

## 📏 5.82 · LA MATRIZ LIMPIA — la cifra definitiva del suelo (medida el 23/09/2026)

**Esto no es una ficha: es la MEDICIÓN**, guardada aquí para que la ficha de retirada del
umbral la cite en vez de depender de un mensaje. Es lo que F-114 pidió como «cifra
definitiva» (`F-114.md:159-161`) y lo que F-115 mandó repetir **después de la defensa**,
«para tener la cifra limpia» (`F-115.md:276`).

**Instrumento y parámetros.** `/api/admin/vecindario`, nueve tramos de cinco documentos
(`?desde=0..40&cuantos=5`), **41 documentos**, `topK=1000` —por encima del fondo de 680, así
que el mínimo devuelto es el SUELO y no el puesto 1000— y **sin filtro de metadata**
(`poblacion=todos`), así que nada pudo excluir ni desplazar un fragmento. `completo=true` en
los nueve.

### La cifra

| | |
|---|---|
| **n** | **424.040** comparaciones |
| **Mínimo global** | **0,696141422** |
| **La pareja del mínimo** | `RRHH-08 .xlsx`, trozo **7** («[Hoja Guardias] Profesional: Sonia Prats…») contra `new 12.txt`, trozo **0** |
| **Bajo 0,50** | **0** en los nueve tramos |
| **Bajo 0,45** | **0** en los nueve tramos |

**Histograma sumado** (cubos de 0,05; todo lo demás a cero):

| desde 0,65 | 0,70 | 0,75 | 0,80 | 0,85 | 0,90 | 0,95 |
|---|---|---|---|---|---|---|
| 6 | 6.588 | 111.642 | 226.588 | 75.216 | 3.764 | 236 |

**Suma 424.040, que cuadra con `n`.** No es decoración: si no cuadrara, el histograma y el
mínimo describirían poblaciones distintas y no se podrían leer juntos.

**Los cinco contadores de contaminación, a cero en los nueve tramos**:
`fragmentos_sin_fila_viva`, `fragmentos_de_generacion_muerta`, `documentos_sin_vectores`,
`consultas_fallidas` y `consultas_omitidas_por_tope`.

### ⚠️ POR QUÉ LA CIFRA NO CAMBIÓ, Y QUÉ SÍ CAMBIÓ

**La matriz del 21/09 daba `n = 424.058`. La limpia da `424.040`. La diferencia es 18**, y
18 = **3 documentos × 6 trozos fantasma**: los seis vectores de CLI-05 que el índice servía
como vecinos de tres de los 41 documentos.

**El mínimo NO se movió, y era previsible**: los scores fantasma iban de **0,805 a 0,866**,
todos muy por encima de 0,696. Quitar observaciones del tramo ALTO de la distribución no
puede bajar el mínimo — sólo podría subirlo si el mínimo hubiera sido una de ellas, y no lo
era.

⚠️ **PERO QUE EL NÚMERO COINCIDA NO SIGNIFICA QUE LA MEDICIÓN VIEJA VALIERA.** Lo que cambió
es todo lo demás, y es lo que hace utilizable a esta:

- **El denominador**. 424.058 contaba 18 comparaciones **contra un documento borrado**. Un
  `n` que incluye observaciones inválidas no es un `n`.
- **El histograma**. Los 18 salían de los cubos de 0,80 y 0,85, así que la forma de la
  distribución estaba desplazada — poco, pero por una causa falsa.
- **La confianza, que es la parte que importa.** El 21/09 el mínimo era correcto **por
  suerte**: nadie sabía que había contaminación, y si los seis fantasmas hubieran tenido
  scores bajos, el suelo del corpus habría salido de un documento que ya no existe. La
  cifra vieja era verdadera y **no era una medición**; ésta es lo mismo y sí lo es.

**Es la regla del 06/09 con otro objeto**: una cifra acertada sin control es una etiqueta, no
un dato. El control positivo aquí son los cinco contadores a cero, que el 21/09 **no
existían** — `fragmentos_sin_fila_viva` nació con la defensa de F-115.

### Qué queda cerrado y qué no

✅ **La condición de parada de Fable no se disparó** (`F-114.md:163`: «si aparece algo por
debajo de 0,50, se para la retirada»). Cero bajo 0,50 y cero bajo 0,45.
✅ **Mi condición M1 tampoco**: `fragmentos_sin_fila_viva = 0`, así que la matriz está limpia.
✅ **El encargo C9 de F-114 —«identificar la pareja del 0,696»— queda CONTESTADO**: sale de
un trozo de hoja de cálculo (`[Hoja Guardias]`, una fila con nombre propio) contra el trozo 0
de un documento de prosa corta. **Es la especie que Fable pedía saber** para construir el
caso adverso de las siembras futuras: el suelo del corpus lo marca una TABLA contra PROSA, no
dos documentos de temas distintos.
⚠️ **Y una comprobación de consistencia que salió gratis**: la pareja aparece en **los dos
sentidos** (tramos `desde=0` y `desde=5`). El coseno es simétrico, así que tenía que salir
dos veces — y sale. Si sólo hubiera salido una, el acumulador del mínimo tendría un fallo.

---

## ⚠️ 5.83 · La cuota de lectura agotada por nuestras propias mediciones (23/09/2026)

### ⚠️ B.264 — el límite mensual de lectura de Pinecone se agotó midiendo, y el producto quedó bloqueado (23/09/2026)

**Qué pasó.** El plan gratuito de Pinecone trae **1 GB de lectura al mes**. Se agotó, y
mientras estuvo agotado **el producto no funcionaba**: sin consultas al índice no hay
recuperación, así que ni el análisis ni el chat podían contestar. El director subió al plan
**Builder (20 $/mes)**.

⚠️ **Y EL PLAN NUEVO NO QUITA EL RIESGO, SÓLO LO ALEJA: Builder tampoco factura el exceso —
al superar la cuota CORTA EL SERVICIO, igual que el gratuito.** El margen es mayor y el modo
de fallo es idéntico. Esto no es un problema de dinero que se resuelva pagando: es un problema
de **medir sin saber cuánto cuesta medir**.

**Qué lo causó, y fuimos nosotros.** Las **matrices completas** del censo de vecindario:
680 consultas con `topK=1000` **y metadata**, o sea ~680 vectores devueltos por consulta, cada
uno con su texto. Estimación de orden de magnitud: **~300 MB por pasada**. Se corrieron **dos**
—la contaminada del 21/09 y la limpia del 23/09— más los censos sueltos de F-111 y F-113. Con
1 GB de cuota, **dos pasadas y media se lo comen**.

⚠️ **Y QUÉ NO LO CAUSÓ, que es la mitad que hay que decir para no arreglar lo que no está
roto: el USO NORMAL no tiene nada que ver.** Un análisis rápido son 5 consultas con
`topK=25` —125 vectores— y una pregunta del chat son 15 fragmentos. **Cientos de KB**, tres
órdenes de magnitud por debajo de una matriz. El producto podría funcionar todo el mes sin
acercarse al límite. **Lo que agotó la cuota fue el instrumento, no el paciente.**

**LA REGLA QUE SALE DE AQUÍ, y son dos mitades:**

⚠️ **1 · TODA MEDICIÓN DECLARA SU COSTE EN DATOS ANTES DE CORRER.** No después, y no «se verá
en la factura»: antes, y en la propia herramienta, porque el que la lanza es quien tiene que
poder decidir. Una herramienta de diagnóstico que no sabe cuánto va a leer es una herramienta
que puede tumbar el producto que diagnostica — y eso es lo que pasó. Es la regla de F-95 sobre
el presupuesto de tiempo (*«¿cuánto tiempo tengo aquí, y cuánto consume lo que voy a
meter?»*) aplicada a otro recurso: **el presupuesto de datos**.

⚠️ **2 · EL CENSO NO MIDE EL CORPUS ENTERO CUANDO BASTA UN TRAMO.** La matriz completa se
corrió porque F-114 la pidió como cifra definitiva, y estuvo bien pedida: hacía falta el
suelo del corpus entero. Pero **validar un despliegue no necesita una matriz**, y confundir
las dos cosas es lo que convierte una medición legítima en un gasto recurrente. Un tramo de
un documento con el `topK` por defecto contesta «¿está desplegado?» por unos pocos MB.

**Lo que ya se hace distinto desde hoy**: la validación de la fase 2 son **dos comprobaciones
de unos pocos MB** —un análisis rápido y un censo de un solo documento— en vez de una matriz.
Está escrito en el informe de la fase 2 y es la primera aplicación de la regla.

⚠️ **Y UNA CONSECUENCIA QUE CONVIENE VER ENTERA**: durante el bloqueo, `Vivos(org)` y el
termómetro **no habrían protegido nada**, porque el problema no era servir contenido
equivocado sino no poder servir ninguno. La defensa de F-115 cubre la calidad de lo que llega
al usuario; **nada cubre hoy que el índice deje de contestar por cuota**. No hay aviso, no hay
contador y la respuesta del producto ante eso no está medida.

**PENDIENTE, y sin hacer todavía — las dos mejoras del censo:**

1. **Que ESTIME Y DECLARE los bytes que va a leer, antes de leerlos.** Se puede calcular sin
   consultar nada: `consultas × topK × (dimensión × 4 bytes + tamaño de la metadata)`. La
   herramienta lo devuelve en la respuesta y, por encima de un tope, exige un parámetro
   explícito para seguir — el mismo patrón que `?canario=1`.
2. **Que se pueda pedir SIN LOS TEXTOS DE MUESTRA, que es lo que engorda la respuesta.** El
   censo pide `includeMetadata: true` para clasificar el par y sacar las muestras de 120
   caracteres; sin ellas basta el `documentId` y el score. F-114 ya lo anticipó —«si el
   resultado se acerca al límite de 4 MB por respuesta, se pide sin metadatos»— y no se
   escribió.

**Sin arreglar.** Y con una advertencia sobre el orden: **la estimación va antes que el modo
sin textos**, porque sin saber cuánto cuesta una pasada no se puede saber si el modo ligero
sirve de algo.

---

## ✅ 5.84 · ACTA DE RETIRADA DEL UMBRAL DE RECUPERACIÓN (23/09/2026)

**Es la ficha que F-113 pidió con sus siete apartados** (`F-113.md:220-229`), escrita al
cerrar la fase 2 y con la validación del director delante. Sustituye a cualquier lectura
anterior sobre los dos umbrales: lo que sigue es lo que se retiró, por qué, qué lo vigila
ahora y qué haría falta para reinstaurarlo.

Commit del código: **`1de62363`**.

### 0 · La validación, que es lo que cierra la fase

**Hecha por el director el 23/09/2026, y las dos comprobaciones pasan.** Se eligieron
BARATAS a propósito: unos pocos MB en total, después de que las matrices agotaran la cuota
de lectura (ver B.264).

| Comprobación | Resultado |
|---|---|
| Censo de un documento (`?desde=0&cuantos=1`, topK por defecto) | **sin campo `umbrales`**, **sin `vecinos_045`**, **sin `bajo_umbral_rapido` ni `bajo_umbral_exhaustivo`**, `completo=true`, `fragmentos_sin_fila_viva=0` |
| Dos análisis reales | denominadores con **cinco términos**, **sin `descartados_umbral`**, `clave_vieja_presente=false`, y **el cuadre cierra en los dos**: `crudos 125 = 125` y `crudos 200 = 200` |

⚠️ **LOS DOS CUADRES SON LA MITAD QUE IMPORTA.** Que el campo haya desaparecido sólo dice
que el despliegue llegó; que la ecuación **siga cerrando con un término menos** dice que no
se perdió ningún fragmento por el camino al quitarlo. Sin esos dos números, la retirada
sería un cambio desplegado y no un cambio verificado.

### 1 · Predicado literal

`score >= umbral`, **por cada match y antes de las exclusiones**. Vivía en `pasaElUmbral`
(`umbral-de-recuperacion.ts`, hoy `corte-de-recuperacion.ts` sin ella) y lo aplicaba
`cribarMatches` como paso 2 de la criba. Dos valores: `SCORE_THRESHOLD_QUICK = 0.50` en el
modo rápido y `SCORE_THRESHOLD_EXHAUSTIVE = 0.45` en el exhaustivo.

### 2 · Operando y agregación

**FRAGMENTO, sin agregar.** Es la corrección de F-113 sobre F-111, y es la razón de que la
primera medición del suelo midiera otra cosa: el censo de 42×41 del 16/09 daba ~0,79, pero
**ése era el MÁXIMO POR DOCUMENTO** (`scoreMax`), no el score de cada fragmento. El umbral
nunca juzgó el máximo por documento: juzgaba cada match tal como lo devolvía Pinecone.

### 3 · Rango medido — fecha, n, población, sesgos y modelo

| | |
|---|---|
| **Suelo medido** | **0,696141422** |
| **n** | **424.040** comparaciones |
| **Fecha** | **23/09/2026** |
| **Población** | los **680** vectores de los **41** documentos de la organización piloto, TODOS contra TODOS, en nueve tramos de cinco documentos |
| **Parámetros** | `topK=1000` (por encima del fondo de 680, así que el mínimo es el SUELO y no el puesto N) y **sin filtro de metadata** |
| **Fragmentos bajo 0,50** | **0**, en los nueve tramos |
| **Fragmentos bajo 0,45** | **0**, en los nueve tramos |
| **La pareja del mínimo** | `RRHH-08 .xlsx` trozo 7 (`[Hoja Guardias] Profesional: Sonia Prats…`) contra `new 12.txt` trozo 0 — **una TABLA contra PROSA**, y aparece en los dos sentidos |
| **Modelo** | `multilingual-e5-large`, dimensión **1024**, servida y confirmada por el sello |

**Sesgos declarados**, y son tres:

1. **Una sola organización.** El suelo **baja cuando el fondo es más variado** —medido:
   `Facturacion_2025` cae de 0,769 a 0,705 al pasar de su población real al corpus entero—
   así que otra organización, otro sector u otro idioma lo bajarían más, y **nadie sabe
   cuánto**.
2. **Sin filtro de corpus.** La medición incluye documentos `pendiente`, que el análisis real
   no alcanza. Es deliberado: con filtro, el censo de este corpus piloto daría casi ceros.
3. **Es un corpus homogéneo** —todo del mismo cliente y del mismo dominio—, y eso es
   precisamente lo que comprime los scores en la franja alta.

⚠️ **Y LA CIFRA VIEJA NO SE CITA MÁS: la matriz del 21/09 daba `n = 424.058`** y estaba
**contaminada** por los seis vectores de un documento borrado (F-115). Su mínimo era el
mismo por suerte, no por método. Ver 5.82.

### 4 · La cita del fabricante, con su fecha de lectura

La FAQ del fabricante describe las similitudes de `multilingual-e5` **«en torno a 0,7»** como
propiedad del diseño del modelo, no como garantía. **Leída el 21/09/2026.**

⚠️ **Y NO SE PUEDE CITAR COMO GARANTÍA DE UN MÍNIMO**, que es la lección que costó una
predicción: Fable predijo «≥ 0,70» anclándose en esa cifra redonda, y salió **0,696** — falla
por 0,004. Su explicación literal: «Me anclé en la cifra redonda de la ficha del fabricante,
que describía un rango y no medía nada.» **Una descripción no es una cota.**

### 5 · Qué lo habría activado, y quién vigila ahora

**Lo habría activado**: un vector degenerado —un fragmento basura cuyo embedding cayera lejos
de todo— o un cambio de modelo por parte del proveedor.

**Quién vigila ahora, y son dos piezas que no existían cuando el umbral se escribió:**

- **EL TERMÓMETRO** (`lib/analysis/termometro.ts`): guarda en cada análisis el mínimo, el
  máximo, los veinte cubos de 0,05 y el hueco entre los dos primeros documentos. **Enseña la
  distribución entera en vez de cortarla**, así que el día que el suelo baje se verá — que es
  lo que un corte inerte no podía hacer.
- **EL CANARIO** (`lib/analysis/canario.ts`): dos parejas de textos fijos, nunca indexados.
  Dice si lo que se movió fue **el modelo** o **el corpus**, que son dos causas con dos
  arreglos distintos. Su referencia está medida y fechada en 5.85.

### 6 · La errata

**La versión «por documento» era FALSA**, y se repetía por el repositorio: el suelo de ~0,79
que se citaba como si fuera el operando del umbral era el **máximo por documento**. La errata
fechada y su censo van en 5.86 — con la lista **rehecha**, porque la de F-113 nombraba siete
sitios y hoy no son ésos.

### 7 · El caso decisivo de reinstauración

**Un candidato concreto que llegó al juez, era basura, y cuyo score lo habría separado de los
buenos.** No existe ninguno hoy: con el suelo en 0,696 y el techo en ~0,99, ningún valor
absoluto entre 0 y 0,696 separa nada de nada.

⚠️ **Y LA FORMA DE UN CORTE FUTURO, si algún día vuelve (C12): RELATIVO, NUNCA ABSOLUTO.**
Orden o hueco —«los N mejores», «los que estén a menos de X del primero»— y no un número
contra el que comparar. Los autores del modelo respaldan esa forma, y la razón es la misma
que retira este umbral: **un absoluto elegido sobre una distribución que vive entre 0,65 y
1,00 no discrimina, y el día que el modelo cambie de escala dejará de significar lo que
significaba sin que nadie lo note.** El corte relativo que ya existe —`cortarALosMasAfines`,
los 25 más afines— es de esa forma y no se toca.

**El corte relativo queda DORMIDO, a la espera de su caso decisivo.**

### ⚠️ Y UN CAMBIO DE FORMA EN LA RESPUESTA DEL CENSO, que hay que saber antes de comparar

**El campo `umbrales` DESAPARECIÓ de la respuesta de `/api/admin/vecindario`.** Declaraba con
qué regla se había contado —los dos valores— y sin regla no hay nada que declarar.

⚠️ **CONSECUENCIA: las respuestas del censo guardadas ANTES del 23/09/2026 no son comparables
campo a campo con las nuevas.** No sólo falta `umbrales`: faltan también `vecinos_045`,
`bajo_umbral_rapido` y `bajo_umbral_exhaustivo`, y `vecinos` **cambió de significado** —antes
contaba los que pasaban 0,50; ahora cuenta todos—. Lo que sí se conserva y sigue siendo
comparable: `distribucionDelCorpus` (mínimo, máximo, percentiles e histograma), `n`,
`parejaDelMinimoDelCorpus` y los contadores.

⚠️ **Y LA RESPUESTA DEL CENSO NO LLEVA NÚMERO DE VERSIÓN**, así que nada de esto lo dice el
propio dato: una respuesta vieja y una nueva se distinguen sólo por qué campos traen. Es un
candidato a ficha y queda dicho aquí en vez de descubrirse comparando dos JSON.

### ⚠️ Y UNA COMPROBACIÓN QUE EL DIRECTOR PIDIÓ CERRAR: `propios_excluidos` salió 0 en los dos análisis

**Es lo esperado, y por una razón que conviene no confundir con otra.** Leído en el código:

- `propios_excluidos` sólo se incrementa si hay a quién excluir:
  `if (args.excluido !== undefined && m.documentId === args.excluido)`
  (`lib/analysis/criba-de-matches.ts:181`).
- Y `excluido` sale de `unicoExcluido(sujetos)` (`app/api/analyze-v2/route.ts:195`), que
  devuelve **el primero de `documentosExcluidos`** (`lib/analysis/sujetos.ts:182-191`). Esa
  lista se llena SÓLO con `documentoEnRevision`, `documentoAReemplazar` y
  `documentoPropietario` (`lib/analysis/sujetos.ts:135-138`).

**Así que en una SUBIDA NUEVA la lista está vacía, `excluido` es `undefined`, y el cero no es
una medición: es una certeza estructural.** El comentario de la ruta ya lo dice —«en la
subida no hay a quién excluir (el doc aún no está indexado)»—.

⚠️ **Y HAY UN SEGUNDO CAMINO QUE TAMBIÉN DA CERO, y ése sí es interesante**: incluso con
`excluido` puesto —un reanálisis desde la bandeja—, los vectores del propio documento **no
vuelven** si su `analysis_status` no es `analizado`, porque el filtro de la consulta es
`CORPUS_ACTIVO = { analysisStatus: { $eq: 'analizado' } }`
(`lib/pinecone/vectors.ts:99`). Un documento de la bandeja está `pendiente`, así que sus
propios fragmentos ni llegan — y no hay nada que excluir. Sólo daría **distinto de cero** al
reanalizar un documento **ya aprobado**, o cuando la tanda lo nomina por
`batchDocumentIds`.

⚠️ **LO QUE ESTO DESTAPA, Y NO LO ARREGLO AQUÍ: el contador no tiene denominador.** Un
`propios_excluidos: 0` no distingue tres situaciones distintas —«no había a quién excluir»,
«había y sus vectores no pasan el filtro» y «había, pasaban, y no casó ninguno»— y la
tercera sería un fallo. Es la regla del cero con otro objeto: **un cero confirma sólo si el
mismo camino ha producido un no-cero en las mismas condiciones.** Queda ANOTADO, sin ficha
propia y sin arreglo, porque el arreglo es un campo más en el termómetro y eso es otra
decisión.

---

## 📏 5.85 · LA REFERENCIA DEL CANARIO, y la tolerancia que NO se decide aquí (23/09/2026)

**Primera medición real del canario de F-114 P3, en producción.** Es lo que C7 pedía como
referencia: «los de la primera medición, guardados junto al sello del modelo». Escritos en
`lib/analysis/canario.ts`, sin redondear.

| | |
|---|---|
| **Pareja ALTA** (A1–A2, lo mismo dicho de otra forma) | **0,9787957957543013** |
| **Pareja BAJA** (A1–B, dos temas sin relación) | **0,7851197779564706** |
| **Separación** | **0,1936760178** |
| **Ruido** | **0 exacto en las dos** |
| **Modelo servido** | `multilingual-e5-large` |
| **`dimension_servida`** | **1024**, y `dimension_inesperada: false` |
| **Fecha** | **23/09/2026** |

### ⚠️ EL RUIDO ES CERO, Y ESO ROMPE LA RECETA DE C7

C7 decía: «la tolerancia de alarma se fija después, a partir de ese ruido medido». **Con
ruido cero esa derivación no existe.** Una tolerancia de 0 alarmaría ante cualquier
movimiento, incluido el que no significa nada.

**Lo que el cero SÍ dice, y es un hallazgo**: para un texto fijo, el servicio de embeddings
es **DETERMINISTA** — dos llamadas consecutivas devolvieron el mismo vector bit a bit. Es una
propiedad medida, no supuesta, y es más fuerte que lo que nadie había pedido.

### LA TOLERANCIA QUE PROPONGO: **0,001** — y es una PROPUESTA, no una decisión

`REFERENCIA.tolerancia` está en **`null`** en el código, y el comprobador
`elCanarioSeHaMovido` devuelve **`null`** mientras lo esté. **Decide el director.**

**Por qué 0,001, en tres razones:**

1. **Está tres órdenes de magnitud por encima del ruido de coma flotante plausible.** Si el
   proveedor cambia de hardware, de tamaño de lote o de versión de biblioteca sin cambiar el
   modelo, la acumulación en `float32` sobre 1024 dimensiones puede mover las últimas cifras
   —del orden de 1e-6 o menos—. Con 0,001 eso no alarma, que es lo correcto: **no ha cambiado
   nada que signifique algo.**
2. **Está dos órdenes por debajo de cualquier cambio semántico.** La separación entre la alta
   y la baja es **0,1937**; 0,001 es el **0,5 %** de ese hueco. Un reentrenamiento del modelo
   mueve centésimas, no milésimas. Así que 0,001 alarma ante un cambio real y calla ante el
   ruido — que es la definición de una tolerancia útil.
3. **Es la cifra que Fable predijo como cota del ruido**, y usarla como tolerancia es
   conservador en la dirección correcta: alarmamos al nivel en el que él esperaba que viviera
   el ruido, aunque el ruido medido haya salido muy por debajo.

⚠️ **Y SU CONDICIÓN DE VALIDEZ, que va escrita porque sin ella la tolerancia caduca en
silencio: 0,001 sólo discrimina mientras el `ruido` se mantenga AL MENOS UN ORDEN DE MAGNITUD
por debajo.** Si algún día el `ruido` llega a 1e-4, una deriva real de 8e-4 dejaría de
distinguirse del ruido y **la tolerancia habría que rederivarla**, no subirla a ojo.

### ⚠️ QUÉ PASARÍA SI EL PROVEEDOR INTRODUJERA VARIACIÓN MÍNIMA EN EL FUTURO

**Lo veríamos, y ahí está el valor de medir dos veces SIEMPRE.** El `ruido` viaja en cada
medición del censo, así que un cambio de régimen —de determinista a ligeramente variable— es
observable por sí mismo: no hay que adivinarlo ni esperar a que una alarma falle.

Los tres escenarios, y son distinguibles con los datos que el canario ya devuelve:

| Lo que se ve | Qué significa | Qué hacer |
|---|---|---|
| `ruido` sigue en 0 y las cifras se mueven más de la tolerancia | **cambió el modelo**, y el cambio es limpio | Investigar el modelo; el termómetro dirá si movió el corpus |
| `ruido` pasa a ~1e-7 y las cifras no se mueven | el proveedor introdujo variación numérica sin cambiar el modelo | **Nada.** Se anota el régimen nuevo. La tolerancia sigue valiendo |
| `ruido` sube al orden de la tolerancia (1e-4 o más) | el servicio dejó de ser comparable consigo mismo | **Rederivar la tolerancia** desde el ruido nuevo, y volver a medir la referencia |

⚠️ **Y EL CASO QUE NO SE CUBRE, dicho para que nadie se apoye de más: si el proveedor
cambiara el modelo Y la variación a la vez**, el `ruido` alto taparía la deriva. El canario no
lo resolvería solo; lo resolvería el **sello** (`modelo.servido` y `dimension_servida`), que
es la otra mitad y no depende de ninguna tolerancia.

### LAS DOS PREDICCIONES, CON SU RESULTADO

**Se escribieron ANTES de medir, y se cuentan las dos — la regla no distingue de quién es.**

✅ **LA DE FABLE: ACERTADA.** «La diferencia entre esas dos mediciones será menor de 0,001»
(`F-114.md:226`, de entrenamiento y declarada sin verificar). **Salió 0 exacto**, o sea
acertada con todo el margen del mundo. Es la primera predicción suya que acierta en este
frente, y merece decirse igual que se dijeron las que fallaron.

❌ **LA MÍA PARA LA PAREJA ALTA: FALLADA.** Predije **«entre 0,90 y 0,96»** y salió
**0,9788** — fuera por arriba, por 0,019.

⚠️ **Y ES EL MISMO ERROR QUE COSTÓ LA PREDICCIÓN DE FABLE SOBRE EL SUELO, con el signo
cambiado.** Él se ancló en la cifra redonda del fabricante y predijo un suelo demasiado alto;
yo supuse que dos paráfrasis «no llegarían a 0,98» sin ninguna medición detrás, y quedé
demasiado bajo. **Los dos pusimos una horquilla donde no había dato.** La diferencia es que
la horquilla estaba escrita, así que el fallo se puede contar — y contarlo es lo único que
distingue una predicción de una opinión.

✅ **Y LA DE LA PAREJA BAJA: ACERTADA.** Predije «entre 0,70 y 0,80» y salió **0,7851**.

⚠️ **LO QUE EL 0,785 DE LA PAREJA BAJA ENSEÑA, Y NO ES MENOR**: dos frases **de temas
completamente ajenos** —un trámite de recepción clínica y el punto de fusión del estaño— se
parecen **0,785** para este modelo. Eso es **por encima** del suelo medido del corpus real
(**0,696**). Confirma lo que la retirada del umbral ya suponía, y ahora con un par
construido a propósito: **`multilingual-e5` comprime las similitudes en la franja alta, y un
corte absoluto por debajo de 0,78 no puede separar «relacionado» de «no relacionado»
ni con textos elegidos para ser ajenos.** Es el argumento más fuerte de la ficha de
retirada, y llega del canario, no del corpus.


### ✅ LA TOLERANCIA, DECIDIDA POR EL DIRECTOR EL 23/09/2026: **0,001**

**Aprobada la propuesta de arriba, con su condición de validez.** Escrita en
`lib/analysis/canario.ts` como `REFERENCIA.tolerancia = 0.001`, con la firma y la fecha al
lado: **no es un cálculo, así que quien la cambie está cambiando una decisión y no
corrigiendo una cuenta.**

⚠️ **Y LA CONDICIÓN DE VALIDEZ VA CON ELLA, no en una nota aparte**: 0,001 sólo discrimina
mientras el `ruido` se mantenga **al menos un orden de magnitud por debajo**. Si algún día
llega a **1e-4**, se **REDERIVA** desde el ruido nuevo — **no se sube a ojo**. El `ruido`
viaja en cada medición del censo precisamente para que ese día se vea sin adivinarlo.

**Qué cambia en el instrumento, y es lo que convierte la decisión en algo:**

- `elCanarioSeHaMovido` **deja de devolver `null`** y contesta. El `null` sólo vuelve si
  alguien retira la tolerancia para rederivarla, o si la medición no trajo cifras.
- **Y tiene LECTOR**, que es la mitad que faltaba: el censo lo llama y escribe
  `CANARIO MOVIDO` con las dos cifras, sus referencias, la tolerancia y la fecha de la
  referencia. Sin lector, la tolerancia habría sido un número declarado y sin consumidor
  — **B.244 con otro nombre**, y esta casa ya pagó ése.
- **El «no se pudo comparar» también suena**: si el comprobador devuelve `null`, el censo
  escribe `CANARIO SIN COMPARAR`. Un no-resultado no es un resultado, y un silencio no es un
  visto bueno.
- **Cuatro casos decisivos** en `canario.test.ts`: por debajo de la tolerancia NO alarma
  (deriva de 0,0005), por encima SÍ (0,002), la pareja BAJA alarma por su cuenta, y la
  tolerancia está un orden de magnitud por encima del umbral de rederivación.
- **Los dos mutantes mueren por lados opuestos**: subirla a 0,01 pone en rojo los casos de
  «por encima» (4 rojos); bajarla a 1e-7 pone en rojo los de «por debajo» (5 rojos). **Es
  exactamente lo que le faltaba a este número cuando era `null`: que moverlo rompa algo.**

**Con esto el canario pasa a EJERCIDO** en la escala de F-95 P5 — ESCRITO, CONTADO,
EJERCIDO—: tiene cifra, tiene referencia, tiene tolerancia decidida y tiene quien la lea.


### En qué grado está el canario

**EJERCIDO**, en la escala de F-95 P5 —ESCRITO, CONTADO, EJERCIDO—, desde que el director
fijó la tolerancia el 23/09/2026. Tiene cifra, referencia fechada, tolerancia decidida y
LECTOR que la usa.

⚠️ **Y LO QUE AÚN NO HA PASADO, dicho para que nadie lo lea de más: el canario no ha
ATRIBUIDO todavía ninguna causa**, porque el termómetro no ha dado ningún salto. Está listo
para hacerlo; no lo ha hecho. La diferencia entre «puede» y «lo hizo» es la que esta casa
lleva semanas aprendiendo a escribir.

---

## ⚠️ 5.86 · ERRATA FECHADA — el ~0,79 y los dos umbrales (23/09/2026)

**Es la errata que C16 de F-113 pide** (`F-113.md:235-238`), y su regla es la que gobierna
este fichero desde siempre: **`Estado_Del_MVP.md` es una BITÁCORA y no se reescribe.** Lo que
se escribió el 16/09 seguía siendo verdad el 16/09; lo que caduca es su LECTURA. Así que
nada de lo de arriba se toca, y esta sección es lo que hay que leer antes de citar cualquier
pasaje anterior sobre el umbral.

### LAS DOS COSAS QUE HAY QUE SABER

⚠️ **1 · EL ~0,79 NO ERA EL SUELO DEL OPERANDO DEL UMBRAL.** Era el **MÁXIMO POR DOCUMENTO**
(`scoreMax`) del censo 42×41 del 16/09. El umbral comparaba **fragmento a fragmento**, y el
suelo de ESE operando **nunca se había medido** hasta F-113. Medido: **0,696141422** sobre
n=424.040 (23/09/2026, §5.84).

⚠️ **2 · LOS DOS UMBRALES YA NO EXISTEN.** `SCORE_THRESHOLD_QUICK` (0,50) y
`SCORE_THRESHOLD_EXHAUSTIVE` (0,45) se retiraron el **23/09/2026** (commit `1de62363`), con
`pasaElUmbral`, el contador `seleccion.candidatos_perdidos_por_umbral` y las dos columnas del
censo. **Cualquier pasaje de más arriba que hable de «no se toca el valor», «el disparador es
que el contador deje de dar cero» o «ya tienen caso decisivo» describe un estado que terminó
ese día.**

### EL CENSO, REHECHO — porque la lista de F-113 estaba caducada

F-113 nombró **siete sitios** (`F-113.md:113`): `CLAUDE.md:237-239`;
`Estado_Del_MVP.md:3794, 3917, 3935-3936, 4383, 4597`; y los comentarios `retrieval.ts:108` y
`verify-claims.ts:74`.

⚠️ **NO SE USÓ ESA LISTA, Y HABRÍA CERRADO EN FALSO. Tres cosas fallaban:**

1. **`verify-claims.ts` YA NO EXISTE** (`find . -name "verify-claims*"` → vacío). Uno de los
   siete sitios se había evaporado.
2. **Los números de línea habían derivado**: `4383` y `4597` caen hoy en contenido ajeno,
   porque el fichero creció unas 280 líneas entre el 21 y el 23/09.
3. **Había sitios que la lista NO nombraba**, incluidos ficheros enteros: `Tandas_Harness.md`
   y `app/api/admin/vecindario/route.ts`.

**Es la regla de la casa aplicada a su propia lista: se enumera POR CAPACIDAD, no por nombres
ni por líneas apuntadas hace dos días.** El comando de pertenencia, para que cualquiera pueda
re-ejecutarlo:

```bash
grep -rn "SCORE_THRESHOLD\|mejor trozo\|0,79\|0\.79\|umbral de 0,50\|perdidos_por_umbral\|pasaElUmbral\|umbral-de-recuperacion" \
  --include=*.md --include=*.ts --include=*.tsx . \
  | grep -v node_modules | grep -v "^./claude/consultas-fable/" | grep -v "^./claude/incidencias-de-proveedor/"
```

Los dos archivos excluidos lo están por regla: **`claude/consultas-fable/` es intocable** —un
documento de archivo afirma «esto se dijo el día tal» y eso sigue siendo cierto—, y
`claude/incidencias-de-proveedor/` conserva texto enviado a un tercero.

### QUÉ SE HIZO CON CADA CLASE, y por qué distinta

| Clase | Trato | Hecho |
|---|---|---|
| **`CLAUDE.md`** — instrucción VIVA | **Se corrige el texto**: alguien la lee para decidir hoy | ✅ Corregido el bullet del caso del umbral en la regla del caso decisivo: dice que está retirado, con la cifra nueva, y **declara la errata del operando** |
| **Comentarios del código** | **Se corrigen, o desaparecen con la constante** | ✅ Tres corregidos: `app/api/admin/vecindario/route.ts` (el «~0,79» del `distribucionDelCorpus`), `lib/analysis/vecindario.ts` (la cabecera que citaba `pasaElUmbral` y el contador, los dos muertos) y `lib/analysis/orden-del-rerank.ts` (la franja «0,79 a 0,99»). Los demás **se fueron con las constantes** en `1de62363` |
| **`Estado_Del_MVP.md`** — bitácora | **NO se reescribe**: errata fechada que apunta a F-113 y a §5.84 | ✅ Esta sección |
| **`claude/Tandas_Harness.md`** — bitácora de tandas | **NO se reescribe**, y NO estaba en la lista de F-113 | ✅ Errata fechada al final de ese fichero |

### Los pasajes de este fichero que esta errata cubre

Se enumeran para que el `grep` del futuro llegue aquí, **y no se tocan**: 3730, 3793-3794,
3933-3935, 3957, 3977, 3995-3999, 4012-4030, 4399-4400, 4415, 4420-4434, 4452-4453, 4497,
4537, 4613, 4925, 5179, 5692, 5781, 5866. Todos anteriores al 23/09/2026 y todos correctos en
su fecha.

⚠️ **Y UNO MERECE MENCIÓN APARTE: la tabla de latentes (4399-4400 y 4415).** Daba a los dos
umbrales «caso decisivo: ⚠️ sí, pero en el censo, no en el retrieval». **Eso dejó de ser
verdad el 17/09**, cuando el caso decisivo entró en la recuperación, y dejó de tener objeto el
23/09 con la retirada. **Las dos filas ya no describen constantes que existan.** No las
reescribo —es bitácora— pero quien lea esa tabla tiene que saber que **dos de sus filas están
vacías de objeto**, y eso importa porque esa tabla es el inventario de latentes y se usa para
decidir.

### Cierre del censo

⚠️ **RE-EJECUTADO AL CERRAR, y el criterio de cierre no es «no encuentro nada»: es que lo que
encuentre sea de la clase que NO hay que corregir.** El comando sigue devolviendo líneas, y
eso es lo correcto — son de tres clases, todas legítimas:

1. **Pasajes de bitácora**, cubiertos por esta errata y por la de `Tandas_Harness.md`.
2. **Actas de la propia retirada**: `criba-de-matches.ts`, `counters.ts`,
   `contadores-de-seleccion.ts`, `retrieval.ts`, `corte-de-recuperacion.ts`,
   `vecindario.ts` — describen lo retirado **a propósito**, con su fecha, para que un `grep`
   futuro encuentre la explicación y no un silencio.
3. **Datos de prueba** con valores como `0.79` o `0.796` en `termometro.test.ts` y
   `vecindario.test.ts`, que son números de un caso y no afirmaciones sobre el corpus.

**CERO PENDIENTES de la clase que había que corregir**: ninguna instrucción viva y ningún
comentario de código afirman hoy el ~0,79 como suelo del fragmento, ni citan
`pasaElUmbral`, `candidatos_perdidos_por_umbral`, `SCORE_THRESHOLD_*` o
`umbral-de-recuperacion.ts` como piezas vivas.
---

## ⚠️ 5.87 · PENDIENTE — el cero de `propios_excluidos` no tiene denominador (23/09/2026)

**Anotado y NO arreglado, por decisión del director del 23/09/2026.**

`propios_excluidos` es uno de los cinco denominadores del termómetro, y en los dos análisis
reales del 23/09 salió **0**. Es lo esperado (ver §5.84, el apartado que lo cierra), **pero el
cero no distingue tres situaciones**:

1. **No había a quién excluir** — `excludeDocumentId` es `undefined` porque el documento no
   existe todavía. Es el caso de una subida nueva, y el cero es una certeza estructural.
2. **Había a quién excluir y sus vectores no pasan el filtro** — el documento está
   `pendiente`, así que `CORPUS_ACTIVO` no lo devuelve y no hay nada que excluir.
3. **Había a quién excluir, sus vectores SÍ llegaban, y no casó ninguno** — y **esto sería un
   fallo**: significaría que el `documentId` de la metadata no coincide con el que la ruta
   cree estar excluyendo.

**Los tres escriben el mismo `0`.**

⚠️ **ES LA REGLA DEL CERO APLICADA A OTRO SITIO** (F-103 P2): «un cero confirma si y sólo si
el camino que lo produjo ha producido un NO-cero en las mismas condiciones, o la visión está
declarada y es positiva». Aquí no hay ni control positivo ni visión declarada — **hay un
número que se lee como confirmación y no puede demostrar que buscó**.

**Por qué no se arregla hoy**: el arreglo es un campo más en el termómetro —algo como
`propios_alcanzables`, que diga si el documento excluido estaba en el fondo consultable— y eso
es otra decisión sobre la forma del termómetro, no una corrección. **Queda escrito para que el
día que alguien lea un `propios_excluidos: 0` sepa que no puede leerlo como «la exclusión
funcionó».**

---

## 📏 5.88 · LAS DOS MEDICIONES DEL PILOTO, cada una con su contexto (archivadas el 23/09/2026)

**Fuente: texto pegado por el director en el encargo del 23/09/2026.** El informe original vive
en la base de conocimiento del proyecto del director, **que no está en el repositorio** — ver
§5.89.

⚠️ **POR QUÉ ESTA SECCIÓN EXISTE: PORQUE LAS DOS CIFRAS CIRCULABAN SUELTAS Y SON DISTINTAS.**
El 23/09 se citó «el 83 % de falsos positivos» y lo único que el repositorio tenía medido era
«siete falsos de nueve». Parecía una contradicción y **no lo era: son dos rondas distintas y
las dos son verdad.** Lo que faltaba era el contexto, y sin contexto **ninguna de las dos se
puede citar** — es la regla del 06/09: una cifra cuyo contexto no se sostiene no sale de
ninguna medición.

### RONDA A — la revisión del piloto completo

| | |
|---|---|
| **Fecha** | **18-19/08/2026** |
| **Población** | **40 documentos**, el corpus del piloto entero |
| **Método** | **4 tandas** (comparación por tandas, no global) |
| **Modo** | rápido |
| **Sembrado** | las cinco trampas del piloto |
| **Resultado** | **2 aciertos** —autoclave 134 °C/18 min contra 121 °C/30 min; conservación 15 años contra 5— y **7 falsos positivos** |
| **Tasa** | **7 de 9 = 77,8 % de falsos** |
| **Dónde está** | `claude/Consulta_Fable_F22_Juez.md:59-77` (los siete, con sus citas y sus tres patrones) y `Bitacora_Sesiones.txt:4274-4362` |

### RONDA B — la ronda de control, posterior y aparte

| | |
|---|---|
| **Fecha** | posterior a la ronda A (agosto 2026); **día exacto NO DETERMINADO** |
| **Población** | **10 documentos concretos**: CLI-01, CLI-04, NOR-04, NOR-08, OPE-01, OPE-02, RRHH-04, RRHH-05, MKT-01, MKT-05 |
| **Método** | **comparación GLOBAL**, no por tandas — y ésa es la diferencia de diseño con la ronda A |
| **Modo** | rápido |
| **Sembrado** | **una** contradicción (CLI-01↔OPE-01) y **un** duplicado (MKT-01↔RRHH-05) |
| **Resultado** | **encontró las dos trampas**, y de **6** entradas de «Contradicción» emitidas, **5 eran falsas** |
| **Tasa** | **5 de 6 = 83,3 % de falsos** |

**Los cinco falsos de la ronda B, uno a uno** — y es lo que la hace valiosa, porque son
etiquetables:

1. y 2. **Dos entradas sobre la MISMA frase** repetida casi palabra por palabra entre MKT-01 y
   RRHH-05 —«pelo recogido» y «calzado»— marcada como conflicto. **Es el patrón 1 de F-22**:
   las dos citas dicen lo mismo. ⚠️ Y es el mismo par que llevaba el duplicado sembrado, así
   que el sistema **vio el parecido y lo clasificó al revés**: duplicado leído como
   contradicción.
3. **«Activar la alarma»** (incendio, NOR-04) contra **«desactivar la alarma»** (apertura de
   clínica, OPE-01). **Patrón 3**: dos momentos distintos del día.
4. **Dos menciones al hospital de referencia** en contextos distintos (CLI-04 contra NOR-04).
   **Patrón 3.**
5. **La periodicidad bienal del reciclaje de RCP** (RRHH-04) contra **«iniciar soporte vital
   básico si es necesario»** (NOR-04). **Patrón 2**: una dice cada cuánto se recicla, la otra
   qué hacer; coherentes, no opuestas.

⚠️ **EL VALOR DE LA RONDA B, Y ES LO QUE NO PODÍA DAR LA RONDA A: DESCARTA EL VOLUMEN COMO
CAUSA.** El corpus era **pequeño y limpio** —diez documentos, dos trampas conocidas— y la tasa
de falsos **no bajó: subió** (83,3 % frente a 77,8 %). Si los falsos positivos fueran cosa de
la competencia entre muchos documentos, con diez habrían casi desaparecido. **No lo hicieron.**

### ⚠️ CÓMO SE CITAN ESTAS DOS CIFRAS, Y CÓMO NO

**NUNCA a secas.** Cada una lleva obligatoriamente su población, su método y qué se sembró:

- **«77,8 % (7 de 9) — 40 documentos, 4 tandas, 18-19/08/2026, cinco trampas»**
- **«83,3 % (5 de 6) — 10 documentos, comparación global, agosto 2026, dos trampas»**

⚠️ **Y NO SE PROMEDIAN NI SE SUMAN.** Son dos poblaciones distintas con dos métodos distintos:
«12 falsos de 15» sería un número que no midió nada. Lo que sí se puede decir de las dos
juntas —y es la conclusión que importa— es que **la tasa de falsos no depende del volumen del
corpus**, porque se midió alta con 40 documentos y más alta con 10.

⚠️ **LO QUE NINGUNA DE LAS DOS DICE: que la causa esté en el prompt del juez.** F-22 descartó
esa hipótesis explícitamente —«el prompt NO es pobre», con su REGLA PRINCIPAL, su REGLA DE ORO
y trece ejemplos— y nombró la causa real: **«una única pasada de generación no puede
vigilarse a sí misma»**. De ahí salió el VERIFICADOR DE HALLAZGOS, que entró en producción el
**23/08/2026** (`e3827e17`), tres días después de la ronda A. **Las dos rondas son ANTERIORES
al arreglo**, y por eso hay que volver a medir.

### El criterio de éxito, que ya estaba escrito

De `Bitacora_Sesiones.txt:4358-4361`, fijado por F-22: «el corpus del piloto en rápido con los
dos aciertos (autoclave, conservación) intactos y **cero de los siete falsos**».

⚠️ **CON UNA CORRECCIÓN DE HOY: de las cinco trampas sembradas sólo sobrevive UNA** —la
conservación de historia clínica, NOR-01 (5 años) contra CLI-03 (15 años)—, según el director
el 23/09/2026. Así que el criterio hoy es **un acierto y cero falsos**, no dos y cero.

#### ⚠️⚠️ ESA FRASE QUEDA MARCADA COMO AMBIGUA EL 25/09/2026, Y NO SE VUELVE A CITAR COMO DATO

**Lo pidió el director ese día**: «esa línea la escribí yo el 23/09 y hoy no la recuerdo con
certeza … resuélvelo leyendo, y si el contexto no lo dice, entonces la anotación es ambigua y
eso también es una respuesta». Leído el apartado entero, **el contexto no lo dice**, y tiene
tres defectos distintos que conviene no fundir:

1. **NO DICE DE QUÉ CORPUS HABLA.** Lo más cerca que está de decirlo es la fila «Sembrado» de
   la ronda A, cuya población es «40 documentos, el corpus del piloto entero» — o sea el corpus
   de PRODUCCIÓN del director. Los ficheros del repositorio no pueden ser: el 23/09
   `corpus-pruebas/` tenía once documentos y **ninguno de los cinco de los falsos**, que
   entraron el 25/09 (`31c141d6`). Es una lectura del contexto, no una afirmación de la frase.
2. **NINGUNA PASADA LA PRODUJO.** No hay tanda, ni consulta, ni log detrás: la cabecera de
   §5.88 dice que su fuente es «texto pegado por el director en el encargo del 23/09/2026», y
   la frase se presenta como «según el director». **Es un recuerdo, no una medición** — y la
   regla del 06/09 de esta casa dice que una cifra que sale de algo que dijimos antes no sale
   de ninguna medición.
3. **Y SU DENOMINADOR NO EXISTE POR ESCRITO.** «Las cinco trampas del piloto» aparece en este
   documento tres veces y **no está enumerada en ninguna**: `grep -rn "cinco trampas"` sobre
   todo el repositorio da esas tres líneas y nada más. Sin la lista de las cinco, «sólo
   sobrevive una» **no se puede comprobar una a una ni falsar**. El criterio de éxito de la
   bitácora (`Bitacora_Sesiones.txt:4358-4361`) habla de DOS aciertos —autoclave y
   conservación—, no de cinco trampas.

⚠️ **Y HAY UNA MEDICIÓN QUE LA CONTRADICE EN SU CASO MÁS CONCRETO**: la trampa del autoclave
**está en los dos ficheros**, medido el 25/09 sobre el texto extraído — «Temperatura: 134 °C»
en CLI-01 (línea 70, fragmento 4) y «programar el autoclave a 121 °C durante 30 minutos» en
OPE-01 (línea 19, fragmento 1). Y F-116, del 24/09, la da por existente en producción: «CLI-01
dice 134 °C/18 min y OPE-01 dice 121 °C/30 min. Esa contradicción nunca se detectó».

**LO QUE SE HACE CON ELLA, y son dos cosas:**
- **La frase no se cita más como dato.** Queda como anotación ambigua con su fecha. Lo que
  arrastra consigo es la consecuencia que colgaba de ella —«el criterio hoy es un acierto y
  cero falsos, no dos y cero»—, que **también queda sin soporte**: era un criterio de éxito
  derivado de un recuerdo.
- **No hace falta que nadie la confirme de cabeza, porque el examen la contesta gratis.**
  `N6_autoclave.mjs` comprueba sus discriminantes contra los fragmentos **antes de pagar**: si
  la trampa no estuviera en el corpus indexado, el caso aborta con `AUSENTE` en vez de medir el
  vacío. La primera tanda lo dice sin gastar un crédito y sin pedirle memoria a nadie.

---

## ⚠️ 5.89 · Una ruta inventada hacia un fichero que no está en el repositorio (23/09/2026)

**Error del ARQUITECTO, reconocido por él el 23/09/2026.** Se anota porque la cadena de este
proyecto tiene dos intermediarios sin repositorio y **los dos fabrican por la misma vía**, así
que los casos se cuentan de las dos direcciones — no sólo los de Fable.

**Qué pasó.** Un encargo abrió con: «el piloto de agosto está en
`claude/Hallazgos_Piloto_Corpus_Dentavia.txt`». **Ese fichero no existe, y nunca existió.**
Comprobado con tres comandos antes de decir nada:

```bash
ls claude/ | grep -i "piloto\|dentavia"                                   # vacío
find . -iname "*piloto*" -o -iname "*dentavia*"                           # vacío
git log --all --diff-filter=A -- "*iloto*" "*entavia*" "*Hallazgos*"      # vacío
```

**Lo que sí había, y en otro sitio**: la evidencia del piloto vive en
`claude/Consulta_Fable_F22_Juez.md` y en `Bitacora_Sesiones.txt:4274-4362`. Se encontró
buscando **por contenido** —«falsos positivos»— en vez de por la ruta que el encargo daba.

⚠️ **Y EL DAÑO NO ERA LA RUTA: ERA LA CIFRA QUE VENÍA CON ELLA.** El mismo encargo afirmaba
«el 83 % de las Contradicción eran falsos positivos en una ronda de control de 10
documentos», y lo único que el repositorio tenía medido era **7 de 9 (77,8 %) sobre 40
documentos en 4 tandas**. Sin la fuente no se podía reconciliar, así que **se paró y se
reportó en vez de elegir una de las dos.** El director aportó después el contexto que
faltaba: **eran DOS rondas distintas y las dos eran verdad** (§5.88).

**LA REGLA QUE SALE DE AQUÍ, y es de reparto de visión:**

⚠️ **EL MATERIAL DEL PROYECTO DEL DIRECTOR NO ESTÁ EN EL REPOSITORIO. Si hace falta aquí,
llega PEGADO COMO TEXTO en el encargo.** El director ve una base de conocimiento del proyecto
que Claude no ve; dar su ruta como si fuera una ruta del repositorio convierte una fuente
legítima en una ruta falsa.

Es **la misma regla que el archivo de consultas a Fable ya tenía escrita** —«el material para
archivar llega SIEMPRE como TEXTO PEGADO en el encargo, no como ficheros»
(`claude/consultas-fable/INDICE.md`, la regla de la fuente del 21/09)— aplicada a una segunda
clase de material. **Aquella nació de tres intentos de archivar desde ficheros que no
existían; ésta nace del cuarto, con otro nombre.**

⚠️ **Y LO QUE ESTO AÑADE A LA REGLA DEL REPARTO DE VISIÓN (`CLAUDE.md`), que ya decía que cada
participante ve una cosa distinta: el arquitecto ve un CUARTO sitio.** El reparto escrito era
Claude→repositorio, arquitecto→conversación, director→documentos y producto, chat
externo→documentos sin el contexto de estos días. **Faltaba la base de conocimiento del
proyecto**, que el arquitecto y el director ven y Claude no. Una afirmación que salga de ahí
no es un indicativo sobre el repositorio: es una fuente distinta, y se etiqueta como tal.

**Y lo que funcionó, que conviene contar igual**: la comprobación costó tres comandos y evitó
que una cifra sin fuente entrara en una ficha. La cadena hizo lo que `CLAUDE.md` describe —el
intermediario sin repositorio emite un indicativo, la verificación lo tumba— **y esta vez con
la diferencia de que el error se reconoció y aportó el dato que faltaba en vez de defenderlo.**

---

## 📋 5.90 · LA PRUEBA DE DETECCIÓN — el montaje, la predicción y qué se mide (23/09/2026)

**Aprobada por el director el 23/09/2026.** Es la primera medición del criterio de juicio
**después** del verificador de hallazgos (`e3827e17`, 23/08/2026), y las dos rondas de §5.88
son su línea base.

### El montaje

| | |
|---|---|
| **Documento analizado** | **CLI-03**, que se queda en `pendiente` |
| **Corpus activo** | **NOR-01** (la trampa), **OPE-05** y **RRHH-03** (ajenos), que el director marca — **más CLI-04 y OPE-11, que ya estaban** |
| **Rivales reales** | **CINCO**, no tres |
| **Modo** | rápido, **DOS pasadas** |
| **Coste** | **10 créditos** y ~0,5-1 MB de lectura de Pinecone. `mark-analyzed` no cuesta ni créditos ni lectura |
| **La trampa** | conservación de historia clínica: **5 años en NOR-01 contra 15 en CLI-03** |

**Por qué dos pasadas**: el juez no es estable ni consigo mismo — el mismo par con el mismo
prompt byte a byte produce falsos positivos distintos entre ejecuciones, medido el 21/08/2026
(`Puntos_Pendientes_Doclity.txt:1598`). Una pasada no da una tasa, da una muestra de tamaño
uno.

⚠️ **Y POR QUÉ LAS DOS FICHAS DE ESTA SECCIÓN SE CITAN POR `fichero:línea` Y NO POR SU
NÚMERO**: sus casas están en `Puntos_Pendientes_Doclity.txt` como texto indentado, que no es
heading ni fila de tabla — así que no son «casa» para el chequeo de invariantes y la marca
`CASA-EXTERNA` daría `casa_externa_ausente`. Nombrarlas aquí por su número crearía una segunda
casa, que es justo lo que I1 existe para impedir. **La línea apunta mejor que el número, y no
fabrica una casa que no debe existir.**

**Por qué CLI-03 se queda sin marcar**: así no entra en su propia comparación por la vía del
filtro —`CORPUS_ACTIVO` sólo ve `analizado`— y `propios_excluidos` no tiene nada que hacer.

### ⚠️ LOS CINCO RIVALES NO CAMBIAN LA LECTURA DEL FRENTE DEL RERANK, Y ME CORRIJO

**El 23/09 escribí que con más documentos «CLI-03 tiene rivales por 6 plazas», dando a
entender que el tope del rerank podía dejar fuera a NOR-01. Eso era mío y estaba mal.**

Releído el log del frente del rerank (`Puntos_Pendientes_Doclity.txt:1612-1624`): *«Retrieval: 2 candidatos»*
seguido de *«Rerank: 0 seleccionados»*. **Con DOS candidatos y un tope de SEIS, el tope no
pudo cortar nada.** Lo que descartó el par fue **el criterio**, no la capacidad.

**Y el criterio está escrito, en el prompt del modo rápido** (`lib/analysis/rerank.ts:61` y
`:66`):

> «Máximo 6 seleccionados. **Si ninguno merece análisis, devuelve `selected: []`.**»
> «Un candidato merece análisis profundo SOLO si hay probabilidad real… **Sé estricto. Es
> preferible descartar un candidato dudoso que inflar la lista con ruido.**»

Frente al exhaustivo, que dice lo contrario: *«En caso de duda, INCLUIR.»*

⚠️ **ASÍ QUE ESE FRENTE NO ES UN TECHO DE CAPACIDAD: ES UNA INSTRUCCIÓN DE SER ESTRICTO,
EJERCIDA.**
El modelo hizo lo que el prompt le pide. Y eso cambia qué mediría subir el tope: **nada**. Lo
que habría que medir es el criterio — y el experimento decisivo y barato es **el mismo par en
EXHAUSTIVO**, donde el prompt dice «incluir en caso de duda». Cuesta 30 créditos y no está
lanzado.

### ⚠️ Y POR ESO NO SE SACAN CLI-04 NI OPE-11 DEL CORPUS ACTIVO

Tres razones, y la primera es la que decide:

1. **Con cinco candidatos y seis plazas no hay competencia posible.** El tope no puede morder.
   Sacarlos no reduce ningún riesgo real.
2. **Sacarlos costaría más que dejarlos, y sería lo único destructivo de todo el montaje**: no
   existe ningún camino en el producto que devuelva un documento de `analizado` a
   `pendiente` — `grep -rn "analysis_status: 'pendiente'"` sólo aparece en `drive/sync`. Haría
   falta SQL a mano **más** un backfill de la metadata de Pinecone. Escrituras y manualidad
   antes de medir es cómo se contamina una medición.
3. **Dejarlos hace la medición MÁS informativa.** CLI-04 y OPE-11 son precisamente los dos
   candidatos que la recuperación ya devolvía el 21/09. Con cinco candidatos y seis plazas,
   **si `candidatos_seleccionados` sale menor que `candidatos_recuperados`, el único culpable
   posible es el criterio** — y eso es exactamente lo que ese frente necesita medido.

### ⚠️ LA PREDICCIÓN DEL DIRECTOR, ESCRITA ANTES DE MEDIR

> **«La contradicción de 5 vs 15 años SÍ aparecerá, con 1 o 2 falsas alarmas.»**
> — director, 23/09/2026

**Se contará como acertada o fallada en las dos mitades**, y son independientes:
- **la trampa aparece** (sí / no);
- **falsas alarmas: 1 o 2** (menos de 1 o más de 2 es fallo de esta mitad).

⚠️ **Y MI LECTURA, TAMBIÉN ESCRITA ANTES, porque difiere en la primera mitad y conviene que
las dos estén en el papel**: doy la aparición de la trampa por **menos probable que el
director**, y la razón es el frente del rerank con su causa corregida — el prompt del rápido
manda ser
estricto y la última vez devolvió `selected: []` con sólo dos candidatos. **Si la trampa no
aparece, la consulta 5 de `SQL_deteccion_CLI03.sql` dirá si murió en el rerank, y eso no sería
un fallo del juicio sino su confirmación.** En las falsas alarmas coincido: 1 o 2.

### Qué se mide, y con qué

`SQL_deteccion_CLI03.sql` — cinco consultas de sólo lectura:

1. **La hoja**: una fila por pasada con el termómetro (incluido **`fondo`**, que dice contra
   cuántos fragmentos se comparó de verdad), los cinco denominadores del cuadre, los ocho
   contadores de selección y los **seis del verificador**.
2. **Una fila por hallazgo** con sus dos citas literales (`topic`, `newDocSays`,
   `existingDocSays`, `severity`, `confirmedBy`) y **dos columnas vacías para el director**:
   `etiqueta_del_director` (REAL/FALSO/DUDOSO) y `patron_si_es_falso` (los tres de F-22).
3. **Las inconsistencias menores, aparte** — no se mezclan con las contradicciones: son otra
   sección de la pantalla y otra severidad, y contarlas juntas cambiaría la tasa sin que nadie
   lo decidiera.
4. **El corpus activo**, antes y después. Si alguien marcó algo entre pasadas, las dos no son
   comparables.
5. ⚠️ **EL FALSO NEGATIVO**, con un diagnóstico de tres casos excluyentes escrito en la propia
   consulta: murió en el retrieval / murió en el criterio del rerank / llegó al juez y
   el juez no la vio. **Un falso negativo no es un falso positivo, y mezclarlos arruinaría la
   hoja.**

**Sin lanzar.** Las dos pasadas las hace el director.

---

## 📋 5.91 · EL CIERRE DE LA EVIDENCIA DE F-116, y lo que NO cierra (25/09/2026)

**Los cinco documentos de los falsos de agosto entraron en `corpus-pruebas/` el 25/09/2026 a
las 17:14** (`31c141d6`). Con ellos delante, el troceado de CLI-01 corrido desde el fichero
por el camino real de indexación reproduce **exactamente** las ocho longitudes que F-116 había
reconstruido «del registro y de la base», una a una y en el mismo orden de índice:

| chunk | 0 | 1 | 2 | 3 | **4** | 5 | **6** | 7 |
|---|---|---|---|---|---|---|---|---|
| caracteres | 476 | 653 | 998 | 392 | **890** | 1.073 | **450** | 789 |

**El 4 es el que no cupo por 17 caracteres y contiene «Temperatura: 134 °C». El 6 es el que
sí entró y contiene «30 días en condiciones normales de almacenamiento».** El juez citó el 6
porque el 4 no cabía, y las dos mitades del fallo del 23/09 —la cita espuria que usó y la
evidencia real que no vio— quedan localizadas por índice de fragmento.

⚠️ **LO QUE ESTO CAMBIA, y es de método más que de contenido**: la reconstrucción de F-116 era
una **inferencia sobre registros** —correcta, cuadrada al carácter, e irrepetible sin el log
que el director pegó—. Ahora es un **control positivo reproducible con código puro**: sin base
de datos, sin Pinecone, sin modelo y sin gastar un crédito. Y es falsable por la misma vía:
el día que un cambio de troceado mueva esas longitudes, el cierre queda desmentido por donde
se escribió.

**Qué cierra**: la pregunta de la evidencia —por qué el juez afirmó un conflicto sin el otro
lado delante—. **Qué NO cierra**: el plan de cuatro pasos de F-116 sigue entero y sin hacer, y
la consulta sigue vigente. El registro de los cinco documentos, con sus cifras y sus tres
fragilidades medidas, está en `corpus-pruebas/SIEMBRA_falsos_de_agosto.md`.

### ⚠️ B.265 — el reparto de las SEIS PLAZAS del rerank no se mide, y un documento duplicado consume dos (25/09/2026)

**ESTO NO ES LA FICHA DEL PRESUPUESTO, Y SE ABRE APARTE PARA QUE NO SE CONFUNDAN NUNCA MÁS.**
Son dos puertas distintas, en este orden:

| Puerta | Qué decide | Qué se mide hoy |
|---|---|---|
| **rerank** (tope 6 en rápido) | **QUÉ documentos** llegan al juez | `documentos_candidatos` y los seleccionados: sólo los TOTALES |
| **presupuesto** (3.000 car.) | **QUÉ fragmentos** se muestran de cada uno | el reparto, sí — y es lo que cerró F-116 |

⚠️ **Y LA PRIMERA CORRECCIÓN VA CONTRA MI PROPIA SOSPECHA DEL 25/09, que es la que abrió esta
ficha: el falso NEGATIVO del autoclave lo explica el PRESUPUESTO, entero.** El fragmento 4 fue
recuperado —es el 4.º por parecido en el reparto de F-116— y CLI-01 sí fue seleccionado por el
rerank, así que ninguna de las dos cosas murió en las plazas. El juez no pudo citar «134 °C»
porque no se lo mostraron, y con eso basta. **No hace falta invocar el rerank para explicar
ese caso, y hacerlo sería poner el arreglo en el sitio equivocado** — el mismo error que F-116
ya contó una vez con la pertenencia de la cita.

**LO QUE SÍ QUEDA ABIERTO, enunciado en una frase**: nadie sabe **qué candidatos quedaron
fuera de una selección, ni por qué**, y un documento duplicado ocupa **dos plazas de seis** con
el mismo contenido. Un corpus con duplicados puede, por construcción, dejar fuera a un
documento que sí tenía la otra mitad de una contradicción — y eso sería un falso negativo **de
una clase que hoy no se puede ni contar**, porque lo único persistido son los totales.

**LA POBLACIÓN QUE LO HACE NO HIPOTÉTICO**: CLI-01 está duplicado en la organización de
pruebas, leído por el director el 25/09/2026, y **la tanda del 23/09 corrió con el corpus del
producto** (`CORPUS_ACTIVO`, no el filtro exacto del examen, que nació dos días después en
`c7598db4`). Si en ese momento las dos filas estaban en `analizado` y con trozos, la
recuperación vio dos CLI-01. **Que pudiera no es que ocurriera**: lo dicen los contadores, y
`SQL_CLI01_duplicado_y_RRHH04.sql` los pide.

**QUÉ CIERRA ESTA FICHA** — y no la cierra ninguna limpieza de duplicados, porque el problema
es la ceguera y no el duplicado:
1. Un contador que diga **quién** quedó fuera del rerank, no cuántos. Hoy el termómetro guarda
   `documentos_candidatos` y los ids de los que caen fuera del fondo, no los desplazados por el
   tope.
2. Y la pregunta que va con él: **si dos candidatos son el mismo documento, ¿deben ocupar dos
   plazas?** La respuesta parece obvia y no lo es — decidirla requiere saber si las dos copias
   pueden tener troceados distintos, que es lo que el `content_hash` de las dos filas de CLI-01
   va a contestar.

### ⚠️ B.266 — la sincronización inserta el MISMO fichero dos veces en una pasada (27/09/2026)

**Observado por el director en la base**, organización del examen `a9625e93`: CLI-01 entró
**dos veces en la misma sincronización**, a las **09:10:32 y 09:10:56 UTC**, con ocho trozos
cada una. No es una copia vieja junto a una nueva: es el mismo fichero insertado dos veces en
24 segundos. Reproducido y con hora.

- **Lo que sí se sabe desde el código**: `app/api/drive/sync/route.ts` tiene **dos puntos de
  inserción** de documentos (`:303` y `:446`, los dos con `source: provider.name`). Por dónde
  entró cada copia **NO está determinado**: es el primer encargo de censo.
- **Consecuencia para el examen**: N6 sigue excluido. Su exclusión se decidió con el duplicado
  de CLI-01 en `5a82712f` (`SQL_CLI01_duplicado_y_RRHH04.sql`), y en `a9625e93` el duplicado
  existe también, **por este otro camino**. El endpoint del examen rechaza un código con dos
  filas, así que N6 no se puede lanzar hasta que quede una.
- **Sin arreglar**, por decisión del arquitecto: primero la tanda.
- **CONFIRMADO OTRA VEZ el 01/10/2026** (`SQL_Corpus_Con_Trozos_Por_Estado.sql`, ejecutada por el
  director): `CLI-01_protocolo-esterilizacion-instrumental.txt` sale dos veces, `created_at`
  del 27/09 a las 09:10:32 y a las 09:10:56, 8 trozos cada una y el mismo tamaño. El
  arquitecto lo trajo como hallazgo nuevo; **ya era esta ficha**, y no se abre otra.
- **CÓMO PUDO OCURRIR, leído en el código y en el esquema** (sólo lectura).
  - ⚠️ **Lo primero es una guarda que lo impide**: el índice único `documents_identity_unique`
    sobre (`org_id`, `source`, `provider_file_id`), para todo documento sincronizado
    (`supabase-identity-unique.sql:19-21`, marcado «YA EJECUTADO»). **Si está en la base, dos
    filas del MISMO fichero del proveedor no pueden existir**: la segunda inserción falla.
  - **Así que, con el índice puesto, las dos filas de CLI-01 tienen que diferir en `source` o
    en `provider_file_id`.** Es decir, son **dos ficheros distintos en origen** con el mismo
    nombre y contenido: una copia en la carpeta, o el mismo fichero traído por Drive y por
    OneDrive. O bien una de las dos es manual (`provider_file_id` nulo, fuera del índice).
    Eso no es un fallo de la sincronización: es un duplicado en origen que nada detecta.
    - La sincronización no compara contenidos entre ficheros distintos.
    - El veto por hash es de la subida manual, no de la sincronización.
  - **Sólo si el índice NO estuviera puesto** valdrían los dos mecanismos que permite el
    código:
    1. la lista de lo que ya existe se lee una vez, antes del bucle
       (`app/api/drive/sync/route.ts:126-129`, `:161-163`), y lo insertado durante la pasada no
       se añade (`:438`): un fichero listado dos veces se insertaría dos veces;
    2. dos sincronizaciones solapadas: el candado deja pasar a quien ya lo tiene
       (`lib/upload-lock.ts:35`, en `sync/route.ts:39`).
- **Cuál fue: NO CONSTA.** Lo dicen las dos filas: su `source`, su `provider_file_id`, su
  `folder_path` y su `content_hash`. Y si el índice está de verdad, lo dice `pg_indexes`.
  Las dos cosas las ve el director, no el repositorio.
- **¿Puede repetirse?** **Por el camino de las copias en origen, sí, y sin aviso.** Por los
  otros dos, sólo si el índice no está.
- **Y un mecanismo de duplicado en origen ya archivado**: B.216, «subir a Drive lo que ya
  tienes a mano no lo mueve: lo duplica». Una fila manual (`provider_file_id` nulo) y otra
  sincronizada caben las dos con el índice puesto. Las dos filas de CLI-01 dirán si fue eso.
- **Sin arreglar y sin borrar.** Constancia.

### ⚠️ B.267 — 22 documentos con CERO trozos en la organización del examen (27/09/2026)

**Del censo del director**: en `a9625e93` hay **22 documentos sin ningún trozo**, creados entre
mayo y agosto. Son filas sin contenido indexado.

- **El riesgo**: si alguno llega a `analizado`, entra en el corpus del producto **aportando
  nada**, y el termómetro lo contaría en el fondo con cero fragmentos.
- **Lo que no se sabe**: en qué estado están los 22 y si alguno es ya `analizado`. Encargo de
  una consulta de solo lectura, antes de decidir nada.
- ⚠️ **NO SON INOFENSIVOS, medido el mismo 27/09 en el camino del usuario**: en el análisis
  rápido de OPE-10 con OPE-11 que hizo el director, **`Registro_Visitas.xlsx` entró como
  candidato con 580 caracteres y 1 fragmento**. Es uno de los 22. Entran en el camino del
  usuario como ruido, y ocupan plaza en la recuperación y en el rerank (B.265).

### ⚠️ B.268 — `source = 'onedrive'`: es OneDrive de verdad, no un nombre heredado (27/09/2026)

El director dice que sincroniza «con Drive», y la columna `source` dice `onedrive` en todas
las filas. **Censo de quién escribe `source` en `documents`**: solo dos sitios, `ingest`
(`'manual'`, `app/api/ingest/route.ts:277,292`) y la sincronización
(`provider.name`, `app/api/drive/sync/route.ts:303,446`). Google escribe `'google_drive'`
(`lib/drive/google.ts:79`). **Luego esas filas las escribió una sincronización con el
proveedor OneDrive**: estamos mirando la otra integración.

- ⚠️ **Contradice `CLAUDE.md`**, que dice de OneDrive «implementado, UI deshabilitada». Cómo se
  conectó **NO está determinado**. La premisa «la interfaz de OneDrive está deshabilitada, así
  que no hay filas con ese source» ya se había caído el 03/09 con un documento de OneDrive real
  (`Puntos_Pendientes_Doclity.txt:5624-5631`; se cita por línea porque su casa allí es texto
  indentado; el porqué, en §5.90).
- **Una consecuencia vista de paso, sin medir su efecto**: `lib/analysis/criba-de-matches.ts:157`
  convierte todo lo que no sea `google_drive` en `'manual'`, así que un documento de OneDrive
  sale en el análisis marcado como subido a mano.

### ✅ B.269 — NO ES UN FALSO POSITIVO: el duplicado al 93 % entre RRHH-08 y OPE-13 describe bien los ficheros (27/09/2026)

**Reescrita el mismo 27/09.** Se abrió como «primer falso positivo del producto que encuentra el
examen, sospecha fuerte». **Era una medición correcta, y el detector no se equivocó.**

- **Lo que salió**: `RRHH-08_asignacion-de-guardias.xlsx` contra `OPE-13_cobertura-por-clinica.xlsx`
  (caso P4), **duplicado al 93 %** y **solapamiento al 93 %, alta**, en **5 de 5 pasadas** de
  `c39397e7` (`examen/resultados/2026-09-27_c39397e7/informe-repuntuado_8f62cfc2.txt`). Estaba
  invisible hasta que el marcador leyó especies y enseñó los extras (`138eebcb`).
- **Lo que se midió mal, y quién**: el arquitecto lo llamó falso positivo **sin abrir los
  ficheros, razonando desde sus nombres** («guardias» frente a «cobertura»). Es la misma clase de
  error que la casa lleva la semana persiguiendo: un indicativo sobre el objeto emitido por quien
  no lo había observado. Lo cazó medir la premisa antes de contestar a las preguntas sobre la causa.
- **Lo que miden los ficheros**, leídos de `corpus-pruebas/` el 27/09: 14 filas cada uno, **68 de
  70 celdas iguales en la misma posición, 12 de 14 filas idénticas enteras**. Difieren dos
  encabezados —«Profesional»/«Responsable», «Horas semana»/«Jornada semanal»— y las dos
  contradicciones sembradas: el turno de Belmonte (Mañana/Tarde) y las horas de Medina (44/40).
- **El sistema se comportó según su doctrina, y no es una avería**:
  · el diff **no empareja columnas por sinónimos**: igualdad literal del nombre
    (`table-key.ts:394`), «sin fuzzy ni en filas ni en columnas, deliberadamente» — **F-78**,
    citada en `consultas-fable/F-92.md:238` (F-78 no tiene fichero propio: `INDICE.md:176`). Con
    Clínica, Especialidad y Turno como únicas comunes ninguna combinación llega al 90 % de valores
    únicos (`MIN_UNIQUE_PCT`, `table-key.ts:99`), y sale `sin_clave`;
  · **delega en el juez**, «el emparejador de esquemas de último recurso» — **F-92**
    (`consultas-fable/F-92.md:47`, `:238`; en código, `finding-rules.ts:252-258`);
  · y **el juez acertó las dos**: las dos contradicciones sembradas, en 5 de 5, y el 93 % de
    contenido compartido. El 93 % lo da el juez (`judge.ts:885`) y el código lo convierte en
    duplicado con `veredicto === 'duplicado_exacto' && overlapPercent >= 85` (`synthesize.ts:235`).
- **La lección de los extras sigue en pie**: lo que ninguna expectativa reclama tiene que
  enseñarse. Esta vez lo enseñado era verdad; por eso mismo había que verlo para saberlo.
- **Lo que deja abierto** no es del detector: la recomendación (**B.270**) y el par sembrado
  (**B.271**).

### ⚠️ B.270 — un casi-duplicado CON contradicciones reales se lleva un NO_INDEXAR (27/09/2026)

**Pregunta de producto, sin decidir.** RRHH-08 contra OPE-13 sale **NO_INDEXAR** en las cinco
pasadas, y el mismo análisis trae **dos contradicciones reales** confirmadas.

- **Quién decide hoy**: la recomendación la escribe el modelo de síntesis, cuyo prompt dice
  «NO_INDEXAR: duplicado exacto confirmado (overlap >= 85% con un documento)»
  (`synthesize.ts:255`); el código sólo la fuerza si ese modelo falla (`synthesize.ts:275`).
- **La opinión del arquitecto, anotada como opinión**: debería ser **REVISAR** — descartar un
  documento que contiene discrepancias que el usuario necesita ver es perder información.
- **Es una decisión de producto** y va a esta ficha, no a un commit.

### ⚠️ B.271 — el par de P4 mide un caso más extremo del que pretendía (27/09/2026)

RRHH-08 y OPE-13 se sembraron para probar la rama **sin clave** y salieron **dos ficheros con 68
de 70 celdas iguales** (B.269). En la realidad, dos documentos así compartirían las personas y no
los datos.

- **Lo que cambia en la lectura de P4**: sus aciertos (Belmonte y Medina, 5 de 5) se obtienen
  sobre dos tablas casi idénticas, que es lo más fácil que puede pedirse al juez. **No dicen cómo
  se comporta la rama sin clave con dos tablas que sólo comparten la columna de personas.**
- **Y su extra** —duplicado al 93 %— es consecuencia del par, no del producto.
- **Sin arreglar.** Los documentos de `corpus-pruebas/` no se tocan solos: se mide, se documenta
  y se propone.

### ⚠️ B.272 — la consulta F-116 le contó a Fable MEDIO problema: el recorte del analizado no está en el plan (28/09/2026)

**Defecto del arquitecto al redactar la consulta, no de la respuesta.** El plan de F-116 —corte
honesto, lista de omitidos, presupuesto con ficha— trata sólo el lado del **candidato**. El
documento **analizado** se recorta a 6.000 caracteres en rápido (`NEW_DOC_LIMIT_QUICK`,
`lib/analysis/judge.ts:35`) **por posición**, mientras el candidato se reparte **por
relevancia**, y nada de eso aparece en la consulta ni en la respuesta.

- **Lo que se le contó**: «Al juez se le entregan fragmentos del documento existente con un
  presupuesto de 3.000 caracteres en modo rápido» (`consultas-fable/F-116.md:198`). Del analizado,
  nada. Buscado en todo lo enviado y lo recibido (`:174-369`): ninguna mención del recorte del
  analizado ni de la asimetría entre los dos lados.
- **La única mención es nuestra**, en la cabecera: «documento nuevo sin truncar» como parte de lo
  que compra el exhaustivo (`F-116.md:124-125`).
- **Por qué importa**: se iban a ejecutar cuatro semanas sobre un plan que no cubría la otra
  mitad. Y la otra mitad ya ha costado un rojo: en P2, analizando NOR-11, dos de las tres trampas
  caen más allá de los 6.000 (medido el 28/09 sobre el texto del `.docx`).
- **Siguiente paso**: una consulta nueva a Fable sobre la simetría, con el resultado de
  `SQL_P2_direccion_de_la_base.sql` dentro. Preparada, no escrita, hasta tener ese resultado.
- ✅ **HECHA EL 28/09: F-118** (`consultas-fable/F-118_2026-09-28_simetria-de-lectura.md`), y
  **medido el origen de las dos tijeras** (su sección d):
  · **6.000 del analizado** (`judge.ts:35`): la única justificación escrita es «(ahorra
    tokens)». Nació en 4.000 (`a5ff8eca`, 21/04), **se quitó** el 02/05 (`7ec54e71`) —con el
    juez recibiendo el documento entero y un comentario que lo defendía: «para no perder
    solapamientos ni contradicciones en ninguna parte del texto»— y **volvió en 6.000** el 04/05
    (`8ff675b9`) en un «Update judge.ts» sin cuerpo. Nada explica ni el regreso ni el número.
  · **3.000 del candidato** (`retrieval.ts:104`): `268883e5` (20/08) justifica el criterio
    —contenido en vez de número de trozos—, no el valor. La única medición del valor es F-65
    (`8f382e68`): 5.200 costó 0 s.
  · **Por eso la asimetría no fue una decisión**: son dos cifras sin medir, puestas en fechas y
    por motivos distintos, una por posición y otra por relevancia. La tabla de qué recibe cada
    lado vive ahora en `CLAUDE.md` («Qué recibe el juez por cada lado»).

### ⚠️ B.273 — ESCALÓN 1: el juez lee los dos documentos ENTEROS hasta un presupuesto en tokens (28/09/2026)

**Plan, no hecho. No se enciende sin B.274.** Quitar las dos tijeras de B.272 y poner un tope único
en tokens de entrada para los dos lados; por debajo, la pareja entra entera, con sus
encabezados y los límites de trozo visibles (F-118 §5, escalón 1).
- **Tras interruptor**, con **criterio de reversión escrito antes de activar** (F-118 D4): se
  apaga si una trampa que hoy se detecta deja de detectarse en la regla de estabilidad, o si los
  hallazgos por par suben y la precisión cae más de 15 puntos.
- **El presupuesto** (Fable propone 20.000 tokens, con ficha y caso decisivo) se fija con
  `SQL_F118_tamanos_por_pareja.sql`, **pendiente de ejecutar**.
- Sus predicciones, contables: F-118 sección (e).
- ✅ **MEDIDO EL 28/09 — el corte del analizado SÍ costaba trampas.** Analizando NOR-11 contra
  CLI-13, quitar el corte (exhaustivo, analizado entero) **añadió P2-2**: de 0 de 5 en rápido
  (crudos `c39397e7`, a nivel del juez) a 1 de 1. P2-2 cae en el carácter 7.357 de NOR-11, más
  allá del 6.000; su mitad del candidato (trozo 6 de CLI-13) ya entraba en los 3.000.
- ⚠️ **Pero no basta: P2-3 sigue fuera, por el presupuesto del CANDIDATO**, en las dos
  direcciones (tabla en `Puntos_Pendientes_Doclity.txt:2242-2286`, la corrección del 28/09). **El escalón 1 vale
  en su forma literal: los DOS lados enteros.** Predicción del experimento que lo comprueba:
  B.280.
- ⚠️ **SIN MEDIR: la dirección CLI-13 → NOR-11 del brazo rápido.** P2 sólo analiza NOR-11, así
  que los crudos no la tienen. Por caracteres predije «sin cambio» (en los dos modos la única
  trampa completa es P2-1); **queda como predicción, no como dato**.
- 📏 **EL PRESUPUESTO, CON LO QUE EJECUTÓ EL DIRECTOR** (`SQL_F118_tamanos_por_pareja.sql`, 28/09:
  78 parejas medibles de 106; tokens ≈ caracteres/4 del `full_text` de los dos lados): p50 888 ·
  p90 1.553 · p95 4.981 · p99 7.758 · máximo 7.758 · **cero parejas por encima de 20.000**.
  **Propuesta: 10.000 tokens de texto de documento, los dos lados juntos.** Cubre la mayor
  pareja medida con un 29 % de margen (10.000 / 7.758), dobla el p95 y es once veces el p50.
  El 20.000 de Fable no lo decide ninguna pareja: todas caben con la mitad. ⚠️ **Tres salvedades
  que el número no tapa**: (1) **28 parejas de 106 no se pudieron medir** —sin `full_text` o sin
  el candidato— y cualquiera puede ser mayor; se miran antes de fijarlo.
  ✅ **29/09 — LAS 28, CERRADAS CON EL DATO** (`SQL_F118_parejas_sin_medir.sql`, ejecutado por
  el director el 29/09). Resultado literal: 106 parejas, 28 sin medir, **0 estimables, 28
  no_se_puede_saber**. Por causa: analizado «medido» y candidato «id_sin_documento» → **las
  28**.
  - **Son análisis contra documentos BORRADOS.** El candidato ya no existe ni por id ni por
    nombre, y sin documento no hay trozos (ON DELETE CASCADE).
  - **SALVEDAD RETIRADA: las 28 no pueden ser mayores que nada.** Media pareja no está en el
    corpus, así que esa pareja no se puede volver a formar.
  - **Dos hipótesis cayeron.**
    - La del arquitecto: «la sincronización borra y recrea documentos (B.266)». Cae por dos
      vías.
      - El código: un fichero modificado conserva el id y va a `document_staged`
        (`app/api/drive/sync/route.ts:344-349`); B.266 es una doble inserción, no un borrado.
      - El dato: nada volvió a entrar con su nombre.
    - **La de Code**, escrita aquí esa misma mañana: «pueden ser el agujero del censo». El
      agujero existe (`analysis_results.document_id` no es clave ajena y el censo sólo caía
      al nombre con el id nulo), pero **no explica estas 28**: el agujero sería un documento
      de su nombre que existe hoy, y no hay ninguno.
  - ⚠️ **Y LA PREGUNTA QUE ABRE, que es la que importa: el censo midió las parejas que SE
    ANALIZARON, no las que PUEDEN formarse.** El 7.758 es el máximo de una muestra, no del
    corpus. El arquitecto cita un documento de 66.669 caracteres, unos 17.000 tokens él solo.
    ⚠️ **Esa cifra no la ha medido nadie aquí.** El arquitecto la tomó de la respuesta de
    Fable, y Fable la tenía de nosotros: es la especie de B.289, una cifra que viaja sin
    comprobarse. Lo contesta `SQL_F118_pareja_mayor_posible.sql`.
    ✅ **29/09 por la tarde — NOR-10, MEDIDO en su propio análisis** (log del director, leído
    por el arquitecto). Tiene 67 trozos y DOS tamaños, de dos operandos distintos:
    - **60.038**: el texto PLANO, `text.length` en la línea de `analyze-v2`
      (`app/api/analyze-v2/route.ts:597`);
    - **66.801**: el texto que el juez RENDERIZA desde los trozos, `buildAnalyzedDocumentText`,
      en «truncado a 6000 de …» (`lib/analysis/judge.ts:1072-1074` y `:1102`). Es el que usa
      el presupuesto de la pareja.
    - El 66.669 está muy cerca del segundo y lejos del primero, y **de cuál de los dos salió
      no consta**.
    - Así que la cifra era aproximadamente cierta, pero sólo en uno de los dos operandos, Y
      AUN ASÍ había que comprobarla. **Que saliera cierta no justifica haberse saltado la
      comprobación**, y la comprobación destapó además que había dos medidas.
    - ⚠️ **ERROR DE RÓTULO, NO DE CUENTA** (aceptado por el arquitecto, 29/09). Tituló las
      columnas al revés: «caracteres en trozos» para el texto plano, «texto completo» para el
      renderizado. Sus cuentas de pareja usan el operando correcto, el renderizado, que es el
      del presupuesto. El rótulo importa aquí por esto: son dos medidas distintas, y el
      66.669 sólo se parece a una.
    - **Los cuatro documentos, con los rótulos corregidos** (del log que trae el arquitecto):

      | Documento | Trozos | Texto PLANO (`text.length`) | Renderizado por el JUEZ |
      |---|---|---|---|
      | NOR-10 | 67 | 60.038 | 66.801 |
      | CLI-12 | 55 | 50.797 | 55.135 |
      | NOR-11 | 15 | 14.437 | 14.704 |
      | CLI-13 | 11 | 9.743 | 9.817 |
  - ✅ **29/09 — LA PAREJA MAYOR POSIBLE, EJECUTADO POR EL DIRECTOR. El literal** (consulta 3,
    el resumen, tal como salió):
    ```
    documentos,en_el_corpus,tamano_desconocido,pasan_solos_de_10000,parejas_posibles,
    pareja_mayor_tokens,por_encima_de_7758,por_encima_de_10000,porcentaje_que_cabe_en_10000
    50,14,0,2,686,17062,28,28,95.9
    ```
    Cuadra con lo que el arquitecto había transmitido antes; aun así, se archiva el literal.

    > ## ⚠️ EL 17.062 ES EL MÁXIMO DE LA RUTA POR DEFECTO, NO DEL SISTEMA (30/09/2026)
    >
    > **Esta consulta cuenta la ruta por defecto, no las tandas.** Su candidato es un
    > documento `analizado`, y ése es exactamente el filtro con el que el retrieval busca
    > cuando no hay tanda: `CORPUS_ACTIVO`, `lib/pinecone/vectors.ts:99`, elegido en
    > `lib/analysis/retrieval.ts:238`. Coinciden **si la metadata de los vectores y la
    > columna coinciden** (el invariante F-96, sin comprobar en esta organización: ver
    > B.301).
    >
    > **En una TANDA** de la bandeja, el filtro se amplía con los ids de los demás
    > documentos seleccionados, aunque estén `pendiente` (`vectors.ts:110-120`;
    > `hooks/review/useReviewAnalysis.ts:126`). Ahí se forman parejas mucho mayores, y
    > hay una medida: **NOR-10 + CLI-12, 121.936 caracteres, unos 30.484 tokens**.
    >
    > - **Cualquier razonamiento sobre el presupuesto que se apoye en el 17.062 está
    >   mirando sólo la mitad del problema.** El arquitecto lo estuvo usando como máximo
    >   del sistema, y lo dice él (30/09).
    > - ⚠️ **Las dos cifras no salen de la misma estación.** El 17.062 es `full_text`/4
    >   (`SQL_F118_pareja_mayor_posible.sql`). Los 121.936 son los tamaños RENDERIZADOS
    >   del juez (B.295). El orden de magnitud no cambia, pero no se restan.
    > - **Y podría ser más.** No se sabe cuál es la pareja mayor que puede formar una
    >   tanda. **CONSULTA NUEVA, PENDIENTE (sin escribir)**: la misma cuenta sobre TODOS
    >   los documentos de la organización, no sólo los `analizado`.
    > - **Arrastra**: la pregunta abierta y la regla de decisión de D-4 (B.295), escritas
    >   con 17.000. La cifra que importa son ~30.000, y es un suelo, no un techo.
    >
    > **LA CONSULTA 5, PEDIDA Y RETIRADA el mismo 30/09.** El arquitecto la pidió (E-1)
    > para recontar sobre «lo indexado», porque creía que el candidato salía de los 28
    > documentos con vectores y no de los 14 `analizado`. Leído el retrieval, la premisa
    > era falsa: en la ruta por defecto, el candidato sale de los `analizado`, que es lo
    > que esta consulta ya contaba. **Se retiró sin escribirse.** Lo que queda pendiente es
    > otra cosa: la consulta sobre todos los documentos, de arriba.

    - **Qué significa cada columna, según la PROPIA SQL** (`SQL_F118_pareja_mayor_posible.sql`,
      consulta 3):
      - `documentos` = TODAS las filas de `documents` de la organización a9625e93, en
        cualquier estado;
      - `en_el_corpus` = las de `analysis_status = 'analizado'`;
      - `parejas_posibles` = pares ORDENADOS (analizado, candidato), con el candidato en el
        corpus, distinto del analizado y los dos con tamaño (`:79-81`).
      - Con `tamano_desconocido = 0`, eso es cada uno de los 14 del corpus contra los otros
        49 documentos: **14 × 49 = 686**. La cuenta del arquitecto es la de la SQL.
      - ⚠️ **ORDENADOS**: una pareja entre dos documentos del corpus cuenta dos veces, una
        por dirección.
    - **QUÉ LADO ES EL DE LOS 14, leído en la consulta y no deducido**: la restricción está
      SÓLO en el CANDIDATO, `JOIN docs c ON c.id <> a.id AND c.analysis_status =
      'analizado'` (`SQL_F118_pareja_mayor_posible.sql:82`). El analizado es cualquiera de
      los 50. Es la forma del producto: el candidato sale del corpus por pertenencia, y
      subir un documento para analizarlo no pide que esté en él.
      **Límites declarados del 95,9 %, al lado de la cifra:**
      - es una foto de los 50 documentos de ESE día. Un documento subido después, que no
        esté entre ellos, puede formar una pareja mayor;
      - no cubre candidatos por NOMINACIÓN, la vía de ids (F-97: un análisis puede nombrar
        documentos que no están en el corpus). Sólo los que entran por pertenencia.
    - ⚠️ **LAS 28 SON PARES ORDENADOS, y el resumen NO dice cuántas parejas de documentos
      distintas son.** Una pareja sólo se cuenta dos veces si LOS DOS lados están en el
      corpus: el analizado puede ser cualquiera, pero el candidato no. Así que 28 ordenados
      son 14 parejas sólo si todas son entre documentos del corpus.
      - El literal apunta a lo contrario: `pasan_solos_de_10000 = 2` y 28 = 2 × 14 casarían
        con dos documentos grandes FUERA del corpus, cada uno contra los 14 candidatos. Eso
        serían 28 parejas distintas.
      - **Era una inferencia, y no se escribió como cifra.** La contestó la consulta 4 del
        mismo fichero.
    - ✅ **LA CONSULTA 4, ejecutada por el director el 29/09.** Resultado como lo transmitió
      el arquitecto: **`parejas_distintas = 28`**. «14» era falso.
      - Las 28 salen de **DOS documentos del lado analizado**, cada uno contra los 14
        candidatos del corpus. Ningún otro documento aparece:
        - `NOR-10_protocolo-esterilizacion-instrumental.docx` (estado `pendiente`): 14
          parejas, la menor de **15.109** tokens;
        - `CLI-12_manual-calidad-clinica.docx` (estado `pendiente`): 14 parejas, la menor de
          **12.799**.
      - **Los 2 de `pasan_solos_de_10000` son exactamente estos dos**, y se sigue de la SQL:
        1. un documento que pase solo de 10.000 forma una pareja de más de 10.000 con
           CUALQUIER candidato, porque la pareja es la suma de los dos;
        2. si estuviera en el corpus, como candidato saldría contra los otros 49
           documentos: al menos 49 pares por encima, y hay 28. Así que ninguno de los 14
           del corpus pasa solo;
        3. fuera del corpus, sale como analizado contra los 14, o sea en la consulta 4, y
           los únicos analizados que salen ahí son NOR-10 y CLI-12. Como la columna dice 2,
           son los dos.
      - ⚠️ **El atajo del mínimo NO lo prueba.** Que el total de una pareja no sea menor que
        uno de sus lados da una cota SUPERIOR de cada lado (NOR-10 ≤ 15.109), no una
        inferior.
    - 📌 **LO QUE HAY QUE RECORDAR: el corte honesto no trata de «parejas grandes», trata de
      DOS DOCUMENTOS que no caben con nada.** Todo lo demás del corpus cabe entero con
      cualquier candidato. Los dos están en `pendiente`; si es que no se han analizado o que
      falló, está preguntado al director (29/09).
    - **No hay ninguna pareja entre 7.758 y 10.000 tokens.** `por_encima_de_7758` y
      `por_encima_de_10000` son el mismo 28, así que un presupuesto en cualquier punto de ese
      rango recorta exactamente las mismas 28 parejas. **El 10.000 no es una cifra
      delicada**; si mañana se discute, el argumento ya está medido.
    - **`tamano_desconocido = 0` cierra la duda de F-118**: los 50 documentos tienen tamaño
      medible. Por `full_text` o, sin él, por la suma de sus trozos (la consulta 1 dice cuál
      en su columna `fuente`).
    - ⚠️ **Este 28 no tiene nada que ver con las 28 parejas sin medir de arriba**: aquéllas
      eran análisis contra candidatos borrados; éstas son parejas posibles de más de 10.000
      tokens. Coincidencia de número, no de población.
    - (2) Son tokens del
  TEXTO, no del prompt: las instrucciones del juez van aparte. (3) Caracteres/4 es la
  aproximación declarada en el SQL, no una tokenización. **Caso decisivo del número**: la
  pareja mayor medida; si se bajara a 7.000, esa pareja dejaría de caber entera.
- ✅ **28/09 — EL EXPERIMENTO LO JUSTIFICA POR MEDICIÓN, NO POR ARGUMENTO** (B.280). Con los dos
  lados enteros, la pareja NOR-11 / CLI-13 pasa de **2 trampas encontradas a 5 de 6 casillas**
  (tres trampas por dos direcciones).
- 📏 **LA PREDICCIÓN DE FABLE, PUNTUADA** (F-118 §6: la precisión baja entre 5 y 15 puntos con más
  texto, antes del verificador ciego; y el falso de la fecha de versión puede volver). Lo medido:
  **cinco hallazgos emitidos entre las dos direcciones, y los cinco son trampas sembradas. Cero
  falsos. El falso de la fecha de versión no apareció.** Para comparar: en rápido (analizado
  cortado a 6.000, candidato a 3.000), la dirección NOR-11 → CLI-13 dio **un solo hallazgo en
  cinco pasadas, y era ese falso** (crudos `c39397e7`). **Va en dirección contraria a lo
  predicho.** ⚠️ **Es una pasada, no una tasa**, y **el criterio de reversión de los 15 puntos
  sigue en pie**: no se retira por una medición favorable.
- **Los descartes por cita no verificable** — la mitad viva del corte honesto de F-116:
  · con 14.676 (13:20-13:26): **1** analizando CLI-13 («Grupo II — Sanitarios no específicos… Se
    depositan en bolsa de color verde.») y **2** analizando NOR-11 («Dentavia clasifica los
    residuos… conforme a los cuatro grupos habituales…», «Todo el personal clínico y auxiliar
    recibe formación específica…»);
  · con 3.000 (mañana del 28/09): **2** analizando CLI-13 y **0** analizando NOR-11.
  · Según los datos del director, los dos de la mañana eran **solapamientos**; los de la tarde
    vienen sin decir si eran contradicciones o solapamientos, así que la comparación queda en el
    recuento. ⚠️ **Y ENTRA EN EL CRITERIO DE REVERSIÓN, B.283**: el solapamiento puede subir con el
    texto extra y acercarse al umbral del duplicado.

### ⚠️ B.274 — PRERREQUISITO: el examen no mide la PRECISIÓN de lo que emite (28/09/2026)

Sin esto, B.273 no se puede medir: más texto traerá más hallazgos, verdaderos y falsos, y el
examen sólo sabe contar las trampas sembradas y los falsos ya conocidos (F-118 §6).
- **Lo que pide Fable**: cada hallazgo emitido sobre los casos del arnés lo etiqueta el director
  como verdadero o falso, una vez, y la etiqueta se guarda. Precisión = verdaderos / emitidos,
  por pasada; se siguen juntas con los hallazgos por par.
- **Lo que ya existe, para no construirlo dos veces**: casos que esperan silencio (N2, pareja
  limpia) y falsos conocidos (N1, N3, N4, N5); los extras se imprimen por pasada y, con
  auditoría completa (P2, P4), cuentan como falsos. **Lo que falta** es la etiqueta de los
  extras que nadie ha clasificado.
- El caso de esperado cero de la fecha de revisión (B.276) va en el encargo siguiente.

### ⚠️ B.275 — ESCALÓN 2: tramos alineados para lo que no quepa, y el worker (28/09/2026)

**Plan, no hecho; va después de B.273.** Para las parejas que no quepan en el presupuesto: el
analizado se lee ENTERO, en tramos que respetan los límites de los trozos, en su orden, sin
omitir ninguno; cada tramo con sus k trozos más relacionados del candidato, en una llamada;
llamadas en paralelo; hallazgos unidos y **desduplicados por par de citas**; lo que no entró
del candidato, declarado (F-118 D2).
- **LA REGLA DE TRAMO** (F-118 D5): **el tramo es lo más grande que quepa en el presupuesto,
  nunca un chunk por llamada**. Tramos con solapamiento. El tamaño del chunk (para buscar) y el
  presupuesto del juez (para leer) no se atan: un campo, un oficio.
- **El worker con cola de fondo se vuelve más necesario**: un documento de ~66.000 caracteres
  con varias llamadas en paralelo y sus reintentos se acerca a los 120 s de la función (F-118
  §6). Sin ficha propia anterior; la deuda de «sin cola de fondo» consta en la consulta F-118.
- 📏 **28/09: NO HACE FALTA PARA ESTE CORPUS.** Cero parejas por encima de 20.000 tokens, y la
  mayor medida cabe en 7.758 (`SQL_F118_tamanos_por_pareja.sql`, 78 de 106 medibles). **No se
  borra**: queda como plan para el día que entre un documento que no quepa en el presupuesto
  de B.273.

### ⚠️ B.276 — UNA ESPECIE DE FALSOS: los METADATOS DEL DOCUMENTO como si fueran datos (28/09/2026)

Fecha de versión, autor, código del documento, fecha de aprobación: **atributos del documento,
no afirmaciones sobre el mundo**. Dos documentos con fechas de versión distintas no se
contradicen.
- **Primer ejemplar medido**: «Fecha de última revisión» entre NOR-11 y CLI-13 (9 y 16 de
  febrero), emitido como contradicción en la pasada 1 de P2 de la tanda `c39397e7` y señalado
  por el examen como falso por auditoría completa
  (`examen/resultados/2026-09-27_c39397e7/informe-repuntuado_d96613f2.txt`). **Falso de
  verdad, confirmado por el director** según el encargo del arquitecto del 28/09.
- **La cura en tres capas** (F-118 §6): la rúbrica del juez distingue metadatos de
  afirmaciones de dominio; el verificador ciego pregunta «¿es el mismo dato?»; y el caso entra
  en el examen como esperado cero. **Sin tocar nada todavía.**

### ⚠️ B.277 — LA SEGUNDA VUELTA DIRIGIDA baja de mecanismo principal a respaldo (28/09/2026)

Era una pieza del plan de F-116. Con la alineación de B.275, la búsqueda del «otro lado» se hace
de antemano para todos los tramos, no sólo para las sospechas; la segunda vuelta queda para
cuando el vecino correcto no salió en la alineación (F-118 §4). No desaparece: cambia de papel,
y es más barata como respaldo.

### 📋 B.278 — EL ENFOQUE ATÓMICO, como ficha de largo plazo (28/09/2026)

Extraer primero las afirmaciones atómicas de cada documento —magnitud, valor, unidad— y comparar
afirmaciones en vez de texto. Es el enfoque que mejor resiste a los falsos por parecido de texto
(F-118 §5).
- **Ya existió y se retiró**: la rama atómica, retirada entera en `839d093b` (21/09, F-114).
  **Se retiró porque no escribía nada que nadie leyera, no porque la idea fuera mala**: vivía
  tras `ANALYSIS_ATOMIC_MEASURE`, que no estaba encendida en ningún entorno (§ de la lista de
  latentes, arriba: «comprobó el 21/09/2026 a las 16:31 que no existe en Vercel … ni en
  Railway»).
- **No entra ahora.**

### ⚠️ B.279 — el tope de tokens de SALIDA del juez y el motivo de parada: SIN COMPROBAR (28/09/2026)

Con los dos documentos enteros (B.273) la respuesta del juez se alarga y **puede truncarse por
tokens de salida** (F-118 §6). No se ha leído cuál es el tope de salida del juez ni si alguien
mira el motivo de parada de la respuesta. **Encargo de lectura, antes de encender B.273.**

### 📋 B.280 — PREDICCIÓN, ESCRITA ANTES DE EJECUTAR: el candidato entero sobre NOR-11 / CLI-13 (28/09/2026)

**Escrita el 28/09/2026, antes de poner la variable y antes de correr nada.** Literal:

> Con ANALYSIS_EXHAUSTIVE_BUDGET_CHARS = 14.676, el exhaustivo sobre la pareja NOR-11 / CLI-13
> encuentra las TRES trampas de P2 en cada dirección.
> · Si aparecen tres: el mecanismo queda confirmado y el escalón 1 está justificado por medición.
> · Si aparece P2-3 pero desaparece alguna de las otras dos: la correspondencia era casualidad y
>   hay que replantear.
> · Si P2-3 no aparece: el presupuesto del candidato no era la causa, y falta algo que no
>   entendemos.
> Predicción secundaria: el falso de la fecha de versión (N7) puede volver a aparecer con más
> texto. Que aparezca no invalida nada; que aparezcan varios falsos nuevos, sí.

- **El 14.676** es la suma de los 15 trozos de NOR-11 (el mayor de los dos; CLI-13 suma 9.797),
  con el troceador real; los trozos que hoy entran reproducen exacto el log del candidato
  (`Puntos_Pendientes_Doclity.txt:2242-2286`). La variable sólo la lee el exhaustivo, en el worker de Railway
  (`lib/analysis/retrieval.ts:396`; `worker/src/index.ts:141`).
- ⚠️ **LA VENTANA, porque el presupuesto usado NO queda registrado en ningún análisis (B.281).**
  La variable es global al worker: cambia TODOS los exhaustivos de TODAS las organizaciones
  mientras esté puesta. Sin estas tres anotaciones, los análisis de la ventana no valen como
  prueba:
  - **Hora de puesta**: 28/09/2026, 13:20 hora española, en el worker de Railway, con valor 14676.
  - **Hora de retirada**: 28/09/2026, 13:26. Seis minutos.
  - **Análisis corridos entre las dos**: dos, los dos de la organización `a9625e93`:
    job `4b0471ba-2f10-428f-9a8a-cf282d92a465` (CLI-13 analizado) y job
    `6d987d97-341e-4308-b1d6-8844d6339565` (NOR-11 analizado). Datos del director.

**RESULTADO (28/09, datos del director; nivel del juez).** El presupuesto se aplicó —log:
«presupuesto por candidato: 14676 chars»— y los dos candidatos entraron ENTEROS: NOR-11 «15
dentro, 0 fuera, 14676/14676»; CLI-13 «11 dentro, 0 fuera, 9797/14676».

| Dirección | Presupuesto 3.000 (mañana del 28/09) | Presupuesto 14.676 (13:20-13:26) |
|---|---|---|
| CLI-13 analizado → NOR-11 | 1: P2-1 | **2: P2-1, P2-2** · overlap 35 % → **65 %** · verificador 2→2 · double-check 2 de 2 |
| NOR-11 analizado → CLI-13 | 1: P2-2 | **3: P2-2, P2-1, P2-3** · overlap 35 % · verificador 3→3 · double-check **3 de 3** (del SQL; el log del worker se cortaba) |

**LO PUBLICADO, del SQL** (`SQL_F118_exhaustivos_NOR11_CLI13.sql`, ejecutado por el director el
28/09 a las 13:35; `created_at` en UTC):
- **11:22:32 · CLI-13 analizado → NOR-11**: dos filas `publicada`, las dos `double_check` —
  «Plazo máximo de almacenamiento de residuos grupo III» y «Ubicación del punto de retirada
  centralizado».
- **11:23:16 · NOR-11 analizado → CLI-13**: TRES filas `publicada`, las tres `double_check` —
  «Color del contenedor para residuos grupo III no punzantes», «Ubicación del punto de retirada
  centralizado» y «Plazo máximo de almacenamiento de residuos grupo III».
- **Sonnet confirmó las tres, y el usuario las ve las tres.** Cinco hallazgos publicados entre
  las dos direcciones, los cinco trampas sembradas, cero falsos.
- **La cita del lado NOR-11 de P2-3** es «el resto de residuos biosanitarios especiales no
  punzantes (gasas, guantes, apósitos), que se depositan en bolsa de color amarillo dentro
  de…»: **la ruta del amarillo**, no la prohibición. Es la que ahora empareja P2-3-AMARILLO
  (`examen/casos/P2_residuos_prosa.mjs`), y confirma por qué hacía falta: con el esperado de
  antes, este acierto habría contado como falso (B.284).

Descartes por cita no verificable: uno en la primera dirección («Grupo II — Sanitarios no
específicos…») y dos en la segunda («Dentavia clasifica los residuos…», «Todo el personal
clínico y auxiliar recibe formación…»). Ninguno era una trampa.

**LA PREDICCIÓN, PUNTUADA COMO SALIÓ** — la primera escrita antes de correr:
- ✅ **CONFIRMADO: el mecanismo.** Con el candidato entero apareció **P2-3**, que según el
  director no había salido en ningún análisis desde el 27/08. Entre las dos direcciones, de
  **2 trampas encontradas a 5**.
- ❌ **FALLADO: «en cada dirección».** Salieron tres en una dirección y **dos** en la otra:
  analizando CLI-13, con los dos documentos enteros delante, P2-3 no salió (B.282).
- La predicción secundaria —el falso de la fecha de versión (N7)— **no apareció** en ninguno de
  los dos análisis, y tampoco falsos nuevos entre las contradicciones.
- **Una comprobación cruzada gratis**: el hash de la pareja de citas de P2-1 en la dirección
  CLI-13 → NOR-11 es `9d19a20b`, el mismo que `Tandas_Harness.md:1126` anota para esa dirección
  el 31/08. El hash se calcula sobre las dos citas (`llm-boundary.ts:158-162`), así que **el
  31/08 esa dirección encontró P2-1 con las mismas citas**.

⚠️ **LOS DOS ANÁLISIS GUARDADOS DE ESTA VENTANA NO SON REPRODUCIBLES CON LA CONFIGURACIÓN
ACTUAL**, y nada en ellos dice con qué presupuesto se hicieron (B.281). Quien los mire dentro
de un mes verá 2 y 3 contradicciones donde el comportamiento normal da 1 y 1. **Esta anotación
de la ventana es la única prueba** de por qué.

### ⚠️ B.281 — ningún análisis guarda con qué presupuesto de CANDIDATO se hizo (28/09/2026)

El presupuesto por candidato sólo sale en el log (`[retrieval] presupuesto por candidato: …`,
`lib/analysis/retrieval.ts:398`). No va en el resultado ni en `analysis_results`, así que un
análisis guardado no dice si se hizo con 3.000 o con lo que marcara
`ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` en ese momento.
- **Es la misma clase de agujero** que `textoAnalizado` cerró el 27/09 para el lado del
  analizado (`695018f5`), y le falta al otro lado.
- **Es requisito para medir el escalón 1** (B.273): sin él no se puede separar, en lo guardado,
  un análisis con presupuesto ampliado de uno normal.
- **Mientras no exista, la alternativa es anotar la ventana a mano** (B.280). **Sin implementar.**

### ⚠️ B.282 — ASIMETRÍA ENTRE DIRECCIONES: con los dos documentos enteros, P2-3 sale en una y no en la otra (28/09/2026)

En el experimento de B.280, analizando **CLI-13** contra NOR-11 el juez tenía **las dos mitades
de P2-3 delante** —los dos documentos enteros— **y no la emitió**. Analizando NOR-11, sí.
- Con el presupuesto de 3.000, la correspondencia «emite la trampa cuyas dos mitades tiene
  delante» era exacta en las seis casillas (`Puntos_Pendientes_Doclity.txt:2242-2286`). **Con
  el presupuesto ampliado ya no lo es**: hay una casilla con las dos mitades y sin hallazgo.
- ⚠️ **ES UNA PASADA POR DIRECCIÓN.** Por nuestra propia regla de estabilidad (5/5 para llamar
  estable a algo) hacen falta cinco antes de afirmar que la asimetría existe: **puede ser ruido
  del modelo**.
- **Sin causa propuesta.** Se mide con el examen cuando el escalón 1 (B.273) esté tras
  interruptor.

### ⚠️ B.283 — EL SOLAPAMIENTO SUBIÓ DE 35 % A 65 % sólo por el texto extra (28/09/2026)

En el experimento de B.280, la dirección CLI-13 → NOR-11 pasó de **35 % a 65 %** de
solapamiento con el candidato entero; la otra se quedó en 35 %. Nadie lo había previsto: ni
Fable ni el arquitecto.
- **Ya ha cruzado un umbral**: a partir del **60 %** el solapamiento se pinta con severidad
  **«alta»** (`lib/analysis/synthesize.ts:167`); con 35 % era «media». El usuario vería otra
  cosa con los mismos dos documentos.
- **Y puede cruzar el del duplicado.** El par se declara duplicado —y de ahí sale el
  `NO_INDEXAR`— si se cumplen **dos** condiciones a la vez: que el juez dé el veredicto
  `duplicado_exacto` **y** que el solapamiento llegue al **85 %**
  (`lib/analysis/synthesize.ts:235`). El porcentaje y el veredicto los pone el juez, y con más
  texto delante pueden moverse los dos. Con dos documentos de verdad parecidos, el presupuesto
  ampliado podría empujarlos por encima.
- **Es un riesgo del escalón 1 que hay que medir antes de encenderlo, y entra en el criterio
  de reversión de B.273.** La línea, comprobada el 28/09 —el 85 sigue siendo el valor—:
  `const isDuplicate = topJudgment.verdict === 'duplicado_exacto' && topJudgment.overlapPercent >= 85;`
  (`lib/analysis/synthesize.ts:235`).

### ⚠️ B.284 — EL EXAMEN CASTIGA UN ACIERTO, VARIEDAD 1: RUTA POR REDACCIÓN (28/09/2026)

Un esperado exige una frase concreta cuando el documento dice **el mismo dato en otra frase**
verificable. El producto acierta citando la otra, el marcador no la empareja, y la apunta como
fallo —y, con auditoría completa, como falso—.
- **Ejemplares confirmados**: la contradicción D del corpus ampliado, que no estaba sembrada y
  la redacción antigua contaba como falso (corregida y fechada en `SIEMBRA_corpus_ampliado.md`);
  **P2-3**, emitida por la bolsa amarilla y no por la prohibición (resuelta el 28/09 con
  P2-3-AMARILLO, sin tocar P2-3); y **N6-CICLO-REAL**, cuyo lado de CLI-01 exige «Temperatura:
  134 °C» cuando la línea siguiente dice «Tiempo de exposición (meseta): 18 minutos»
  (`CLI-01_protocolo-esterilizacion-instrumental.txt:70-71`).
- **Medidos el 28/09 en los `.docx`** (cada mención del dato en su documento, con su posición):
  | Esperado | ¿Otra frase con el mismo dato? |
  |---|---|
  | P1-A | **sí, en los dos lados**: NOR-10 @2839 («…no es delegable y recae siempre sobre esta figura»), CLI-12 @4366-4542 |
  | P1-B | **sí, en CLI-12**: @32865 y @35834 («…periodicidad mensual del control biológico») |
  | P1-C | **sí, en CLI-12**: @47433 («…este criterio de 12 meses») |
  | P1-D | no: una sola frase por lado |
  | P2-1 | **sí, en los dos lados**: NOR-11 @1772 («El cómputo de las 72 horas…»), CLI-13 @1626 («Si han pasado más de 7 días…») |
  | P2-2 | no: el valor (Chamberí / Retiro) está en una sola frase por lado |
  | P2-3 | sí (confirmado; resuelto con P2-3-AMARILLO) |
  | N6-CICLO-REAL | **sí, en CLI-01** (confirmado); en OPE-01, una sola frase |
- **Tamaño: 6 de los 8 esperados de prosa tienen una segunda forma.** Sin arreglar ninguno: que
  exista la otra frase no dice que el juez vaya a usarla; dice que, si la usa, hoy se castiga.

### ⚠️ B.285 — EL EXAMEN CASTIGA UN ACIERTO, VARIEDAD 2: RUTA POR DETECTOR (28/09/2026)

Un esperado exige que lo emita **un detector concreto**. El producto puede acertar con la cita
correcta y el examen apuntarlo como fallo **y** como extra —o como falso, si el caso cuenta los
extras— sólo porque lo encontró el otro detector. **No es candidata: está leída en el código**,
y el censo es cerrado: los tres sitios del marcador que exigen quién confirmó.

| Sitio | Detector exigido | Esperados | Si lo encuentra el otro |
|---|---|---|---|
| `lib/examen/comparador-tabular.mjs:70` | estructura | N1-PUESTO | fallo + extra |
| `lib/examen/comparador-estructural.mjs:44` | estructura | **las 15 discrepantes de P3** | fallo + extra, por fila |
| `lib/examen/comparador-tabular.mjs:60` | juicio | P4-BELMONTE, P4-MEDINA | **fallo + falso** (P4 cuenta los extras) |

- **Latente, no vigente**: N6-CICLO-REAL declara `confirmadoPorEsperado: 'juicio'`
  (`examen/casos/N6_autoclave.mjs:105`) y el comparador por cita no lo lee; el validador ya lo
  canta. Pasaría a esta lista el día que alguien enseñara al marcador a leerlo.
- **El modelo de cómo debería estar hecho un esperado: N3-DUPLICADO**, que acepta dos especies.
- **Sin arreglar.** El principio de separar «encontró la verdad» de «qué detector la encontró»
  está en dictamen (28/09).

### 📋 B.290 — PRINCIPIO DEL DETECTOR, FASE 3: las decisiones del dictamen, antes del código (29/09/2026)

Dictamen del 29/09, aceptado por el arquitecto. **Nada de esto está implementado.** Y la fase 3
baja un puesto: antes va la puerta del marcador, que se come los fallos (B.291).

- **(a) DOCTRINA: excepción y base NO conviven en un mismo esperado.** Las dos contestan
  preguntas distintas:
  - `detectorExigido` dice que **el CAMINO es el objeto del caso**;
  - `detectorDeBase` dice que **la VERDAD es el objeto, y el camino se vigila**.

  Bajo una excepción, todo acierto que cuenta viene por construcción del detector exigido
  (`lib/examen/marcador.mjs:64-67`), así que la base nunca puede dispararse. Es decorativa, y un
  campo decorativo se lee como una guardia que no guarda. **El validador rechazará las dos
  juntas.** Entra con la fase 3: hoy N1 las lleva juntas por decisión, y rechazarlas ya dejaría
  el modo seco sin validar.
- **(b) Las declaraciones del 28/09, corregidas:**
  - **N1**: lo mal puesto es la **excepción**. Su propio motivo —«es una regresión del
    comparador»— define una alarma. Se retira **en el mismo commit que la alarma**, para que la
    ventana no se reabra.
  - **P4**: lo mal puesto es la **base**, y la pierde. Su excepción sí es de camino: si la
    estructura empareja a Belmonte, el emparejador encontró clave, y el par no ejerció «sin
    clave».
  - **P3: pierde la EXCEPCIÓN y conserva la BASE, como N1.** Decisión y corrección del
    arquitecto, 29/09, sobre el censo de B.291. El motivo: que el juez encuentre una
    discrepante prueba que el diff la perdió, y eso es una avería medida de lo que P3 mide.
  - ⚠️ **LA FASE 2 EMPEORÓ P3.** Desde `ff9fd59b` (28/09) hasta el arreglo, un diff que pierde
    una discrepante que encuentra el juez sale **SIN_VEREDICTO**. Antes de la fase 2 salía
    **FALLA** (B.285, «fallo + extra, por fila»). Es una regresión que introdujimos nosotros:
    - la aprobó el arquitecto;
    - la implementó Code, con un test que la fija (`lib/examen/comparadores.test.mjs`, «fase
      2: con estructura exigida…»);
    - duró unas horas porque se midió. Ningún crudo guardado pasa por esa rama.
- **LA REGLA QUE DISTINGUE excepción de base** (29/09). Sustituye a «el camino es el objeto»,
  que metió a P3 en el saco de P4:
  - **`detectorExigido`** es de un caso cuya **PRECONDICIÓN** desmiente el otro detector. En P4,
    que la estructura empareje a Belmonte prueba que el emparejador SÍ encontró clave: el
    escenario «sin clave» no ocurrió y el caso no llegó a medir. **SIN_VEREDICTO.**
  - **`detectorDeBase`** es de un caso cuyo **SUJETO** queda señalado porque el otro detector
    acertó. En P3 y en N1, que el juez encuentre la fila prueba que el diff la perdió: el caso
    midió su objeto, y su objeto falló. **FALLA.**
  - **Donde no decide sola**: la mitad de la base vale para una base DETERMINISTA. Con base
    `juicio`, que acierte la estructura no señala al juez: cambió el camino. Por eso esa rama es
    aviso y no rojo (punto f).
  - **Aplicada a los tres casos da la respuesta correcta en los tres**, y la frase vieja no los
    separa:

| Caso | Excepción | Base | Por la regla |
|---|---|---|---|
| N1 | la pierde (con la alarma) | la conserva, `estructura` | sujeto: el diff sobre la fila de Reyes |
| P3 | la pierde (con la alarma) | la conserva, `estructura` | sujeto: el diff sobre las 15 discrepantes |
| P4 | la conserva, `juicio` | la pierde | precondición: que no haya clave |

  **Los tres casos se editan con la fase 3, en el mismo commit que la alarma.** Ni un caso
  editado antes.
  - **El mutante «`:276` reaparece fuera de P4» va en la FASE 3, no antes: HOY NO PUEDE
    FALLAR.** Mientras N1 y P3 lleven su excepción, `:276` sale en ellos por diseño.
    Escribirlo ahora sería un umbral que no puede fallar, que es lo que llevamos dos días
    cazando. Hasta la fase 3, N1 y P3 siguen en la ventana de hoy: un acierto del juez da
    SIN_VEREDICTO. Está fichada, es corta y es visible.
  - ✅ **Escrito el 29/09 en la fase 3b, CUANDO PUDO FALLAR Y NO CUANDO SE PENSÓ.** Lo cazan:
    - `lib/examen/alarma-de-detector.test.mjs`, «de los casos reales, sólo P4 declara una
      excepción»;
    - el sintético de N1, `scripts/examen-sintetico-n1.test.mjs`.

    Con N1 recuperando la excepción, caen seis tests.
- **(c) La alarma pregunta «¿emitió el detector de base algo emparejable en esta pasada?», no
  «¿cuál eligió el marcador?».** El marcador se queda con el primer emitido que encaja
  (`marcador.mjs:151`). Si un día una pasada trae la misma fila por los dos detectores, con la
  del juez delante, preguntar por el elegido daría rojo con la estructura funcionando.
- **(d) Agregación: para un detector determinista, UNA pasada basta.** No hay ruido que
  promediar.
- **(e) El «desconocido» falla ABIERTO, y se declara.** El informe lleva un contador, «N aciertos
  sin detector en el origen», no una frase. Se cierra con B.287, que es del producto y va aparte.
- **(f) Dos ramas sin población, que son latentes:**
  - «base juicio, llega por estructura» (aviso destacado): la única base juicio es la de P4, y
    se retira;
  - el «desconocido»: en los 65 crudos, las 101 contradicciones traen `confirmedBy`, y el
    validador ya rechaza una base sobre solapamiento o duplicado.

  Se prueban con fixture y se declaran latentes en su test.
- **Comprobado sobre los 65 crudos** (`c39397e7`, `97223b72`), contando TODO emitido
  emparejable y no sólo el elegido: cada base recibe exactamente un emparejable por pasada, y de
  su detector. N1-PUESTO por estructura 15/15; P4-BELMONTE y P4-MEDINA por juicio 5/5; las 15
  discrepantes de P3 por estructura en las 5 pasadas. **La alarma no pondría nada en rojo.**
- **Crudos sintéticos para la fase 3:**
  - N1-PUESTO emitido sólo por el JUEZ, con la forma real del juez (sin `comparedValues` ni
    `newDocRow`) y los contadores del diff sin él → FALLA;
  - el sintético de P4 de la fase 2 sigue: debe seguir dando SIN_VEREDICTO;
  - la misma fila por los dos detectores, la del juez delante → PASA. **Sin comprobar** si el
    producto puede emitirla; si no puede, va como fixture y no como crudo.

### ⚠️ B.291 — LA PUERTA DEL MARCADOR: toda razón de SIN_VEREDICTO silencia TODOS los fallos del caso (29/09/2026)

`marcarCaso` sólo juzga si no hay ninguna razón (`lib/examen/marcador.mjs:289` y `:302`). La
regla que lo justifica habla de **ilegibilidad**: «un caso ilegible no puede dar veredicto ni
para mal» (`:305-306`). El código la aplica a **cualquier** razón y sobre **todo** el caso.

- **Censo de las tandas guardadas (29/09).** Se repuntuó `c39397e7` y `97223b72` con la puerta
  levantada, y el marcador se restauró byte a byte, sin commit. **No aparece ningún fallo.**
  - La única razón activa en esas tandas era «línea de base PENDIENTE» (N3 en las dos tandas,
    N4, N5). Bajo ella no había nada que fallar: N3-DUPLICADO sale 15/15, y los falsos fueron 0.
  - **Control positivo**: con la puerta levantada, el sintético de P4 más un falso inventado sí
    saca «1 falsos en una pasada y el techo es 0».
  - `2026-09-27_f825eed9` sólo tiene `informe.txt`: no hay crudos que repuntuar.
- **Clasificación de las razones, en TRES clases** (aceptada el 29/09):
  - **Invalida TODO**: el caso de verdad no se puede leer.
  - **Invalida un CERO**: la razón existe para que una ausencia no se lea como confirmación. No
    debe silenciar un fallo que sí se midió: un falso que salió, salió.
  - **Invalida una PARTE**: una mitad, una regla o un esperado. El resto se juzga.

| Línea | Razón | Clase |
|---|---|---|
| `:237` | ninguna pasada ejecutable | TODO |
| `:239` | tanda incompleta | CERO: lo que no salió en 4 pasadas pudo salir en la 5.ª; lo que sí salió, salió |
| `:243` | línea de base pendiente | PARTE: declara la mitad de PRECISIÓN (`maximoDeFalsosConfirmados: null`) y hoy silencia también la de COBERTURA (N3 exige `minimoDeAciertos: 1`) |
| `:251` | control de tanda no cumplido | CERO |
| `:259` | denominador insuficiente | CERO, y **muerta** (B.292) |
| `:265` | regla no mecánica | PARTE: una regla |
| `:276` en **P4** | el otro detector | TODO: la precondición no se cumplió (B.290) |
| `:276` en **P3 y N1** | el otro detector | **no debe ser razón**: es una avería medida, y la dará la alarma de la fase 3 (B.290) |
| `:283` | el caso entero en SEGUIMIENTO | TODO |

- **`:243` NO necesita un mecanismo nuevo: es SEGUIMIENTO de la mitad de precisión**, que ya
  existe. Es la única de las ocho que se reduce a eso. `:283` ES ese mecanismo, y las demás no
  son mitades:
  - las de CERO silencian ausencias en las dos mitades;
  - `:265` es una regla;
  - `:276` es un esperado.

  Retirarla no es «sin código». Es retirar un estado especial con cuatro lectores:
  - `lib/examen/marcador.mjs:37` y `:242`;
  - `lib/examen/umbrales-que-pueden-fallar.mjs:43`;
  - `validarElTechoDeFalsos` (`scripts/examen.mjs:253-294`), cuyas mitades 1 y 2 pasan a decir
    «precisión en SEGUIMIENTO» donde hoy dicen «estado pendiente».

  Queda menos que mantener y nada que sincronizar. Con dos condiciones, medidas simulando con
  la maquinaria actual sin tocar el marcador:
  - **N4 y N5 tienen que declarar las DOS mitades.** Con sólo precisión salen PASA con cero
    aciertos y nada juzgado. La validación completa lo caza ya: «NINGÚN umbral de este caso
    puede fallar: su verde no mide nada» (`umbralesQueNoPuedenFallar`).
    `validarLoQueElMarcadorLee` sola, no.
  - **El informe perdería la medición**: «observado: 0/0/0/0/0 falsos por pasada» sale hoy de
    la razón de `:243`. Con precisión en seguimiento, N4 y N5 no imprimen ni los falsos, y N3
    sólo el máximo. Una mitad que «mide y no juzga» tiene que imprimir lo que mide, por
    pasada. Es un cambio del informe (`lib/examen/veredicto.mjs`), no de la puerta.

- **Medido, con fixture**: en P3, si el diff pierde una discrepante y la encuentra el juez, sale
  SIN_VEREDICTO con `discrepantes: 1` de 2 medidas y ningún fallo. P4 con la excepción
  disparada, un falso y Medina ausente: SIN_VEREDICTO. El mismo falso sin la excepción: FALLA.
- **Sin arreglar**, por decisión: primero el censo, luego la forma del arreglo. La predicción
  del arreglo, escrita antes: B.293.

### ⚠️ B.292 — UNA GUARDIA QUE NADIE PUEDE DISPARAR: el denominador del marcador (29/09/2026)

La razón «candidatos juzgados por debajo del mínimo» (`lib/examen/marcador.mjs:256-260`) sólo se
evalúa si `contexto.candidatosJuzgados` es un número. **Nadie lo pasa**: ni el ejecutor ni la
repuntuación (`scripts/examen.mjs:203`, «Hoy nada»).
- **Es de la familia de las pantallas apagadas, al revés.** Aquéllas son un cero que nadie
  puede distinguir; ésta es una razón que nadie puede dar. N2 declara `denominadorObligatorio`
  y cree tener la guardia; el validador ya lo canta («el ejecutor no le pasa
  `candidatosJuzgados` al marcador»).
- **Sin arreglar.** Fichada para que no se lea como una guardia que guarda.

### 📋 B.295 — ESCALÓN 1: PREDICCIONES Y CRITERIOS DE REVERSIÓN, ESCRITOS ANTES DEL CAMBIO (29/09/2026)

> ## ⚠️ EL ALCANCE REAL DEL ESCALÓN 1, medido el 30/09/2026
>
> **El escalón 1 está construido, probado, medido y encendido, y NO cambia nada para un
> análisis normal mientras el corpus no tenga trozos.**
>
> 🏁 **HITO (01/10/2026, 08:26:37 UTC): EL ESCALÓN 1 ACTÚA YA EN LA RUTA POR DEFECTO.** Por primera
> vez sale `pareja_entera` **sin tanda** (`0 ids de tanda`): NOR-11 analizado, CLI-13
> candidato, los dos enteros (14704/14704 y 9817/9817, presupuesto 40000). Es la sonda A de
> B.307; log del director, transcrito por el arquitecto. Era el objetivo de todo el escalón 1, y
> lo hizo posible meter en el corpus seis documentos con trozos (B.307).
> - **F-3 deja de ser una limitación viva.** Ya no todo sale `sin_fuente_comun`: en las dos
>   sondas, sólo un candidato del corpus viejo (Normas_Frecuencia_Recogidas.docx, en la A).
>   Lo de abajo describe el 30/09, y se conserva.
>
> ✅ **CONFIRMADO EN PRODUCCIÓN el 30/09.** Con el interruptor encendido y sin acompañante, **el
> 100 % de las parejas que llegan al juez salen `sin_fuente_comun`, y el análisis devuelve
> cero.** Es lo que le pasa hoy a un usuario que sube un documento. Log del producto, que
> transcribió el arquitecto; Code no lo ha visto:
> - **12:20:44 UTC · NOR-10 analizado, `0 ids de tanda`**. «Retrieval: 14 candidatos» y
>   «Rerank: 3 seleccionados». Los tres salen `sin_fuente_comun`, con su aviso «sin trozos —
>   la pareja se lee con la tijera vieja»: Protocolo_Visitas_Centros (analizado 6000/66801,
>   dejó fuera), Clientes_Residuos_Sanitarios y Normas_Frecuencia_Recogidas. **0
>   contradicciones y 0 solapamientos** en los tres juicios. 13.803 ms.
> - **12:19:56 UTC · CLI-13 analizado, `0 ids de tanda`**: igual. 14 candidatos, 3 al juez,
>   los tres `sin_fuente_comun`, 0 contradicciones. 23.930 ms.
>
> - **El corpus por defecto son los 14 documentos con `analysisStatus: 'analizado'`, y son
>   exactamente los 14 que no tienen trozos.** El censo del 30/09
>   (`SQL_Documentos_Sin_Chunks.sql`, consulta 2, cifras que trae el arquitecto) da
>   `en_el_corpus = 14` y `corpus_sin_trozos = 14`. La segunda columna cuenta los
>   `analizado` con cero trozos en su generación activa (`:72`). **Que las dos valgan 14
>   prueba que son el MISMO conjunto**, no dos conjuntos que suman igual: todo documento
>   del corpus está sin trozos.
> - **En el código**, un candidato sin trozos da `sin_fuente_comun` y se lee con la tijera
>   vieja (`lib/analysis/judge.ts:1308-1312`). Con el interruptor encendido, en la ruta por
>   defecto **TODAS las parejas dan `sin_fuente_comun`**.
> - **El escalón 1 sólo mejora las parejas en las que los DOS lados tienen trozos.** Hoy eso
>   sólo ocurre cuando el usuario selecciona varios documentos a mano en la bandeja (una
>   tanda: `lib/pinecone/vectors.ts:110-120`, `hooks/review/useReviewAnalysis.ts:126`).
> - **Lo que desbloquea su valor es la deuda de B.190: reindexar los documentos del
>   corpus.**
>
> > ### ~~🎯 LO QUE DESBLOQUEA EL VALOR DEL ESCALÓN 1 SON 13 REINDEXADOS DESDE EL PROPIO SISTEMA, NO UNA RE-SUBIDA DEL CORPUS~~
> >
> > ## ❌ EL «13 DE 14» ES FALSO, Y EL ERROR ES DE CODE (01/10/2026)
> >
> > La SQL tenía un fallo de lógica con NULL. Cuando `segments` es NULL, `tiene_segmentos`
> > salía NULL en vez de false. Entonces `NOT tiene_segmentos` también era NULL, y las dos
> > ramas que rechazan —«reprocesar» (Drive, 501) y «sin_original_con_tablas» (.xlsx)— **se
> > saltaban para todo documento sin segmentos**. Todo caía a «retrocear». La consulta 1 del
> > 01/10 lo destapó: `tiene_segmentos = null` en las 14 filas.
> > - **Lo que hace el código de verdad** con un documento sin segmentos:
> >   - un `.xlsx` va a `sin_original_con_tablas` (409, «hay que volver a subirlo»);
> >   - uno de Drive o de OneDrive con id del proveedor va a `reprocesar` (501).
> >
> >   Así que **las cuatro `.xlsx` del corpus NO se reindexan sin resubir**:
> >   Clientes_Residuos_Peligrosos, Clientes_Residuos_Sanitarios, Facturacion_2025 y
> >   Registro_Visitas.
> > - **Lo que queda en pie**: 14 documentos, y 1 `staged_vivo` (new 9.txt). Esa rama va
> >   primero y no dependía de los segmentos.
> > - ~~**Cuántos se reindexan de verdad sin resubir: NO CONSTA.** A lo sumo 9~~ → **MEDIDO
> >   (01/10): SON 4.** La SQL corregida, ejecutada por el director; consulta 2, literal:
> >   ```
> >   rechazado: sin_original_con_tablas      2
> >   rechazado: reprocesar NO CONSTRUIDA (501) 7
> >   rechazado: staged_vivo                  1
> >   retrocear: SIN RESUBIR                  4
> >   (total del ROLLUP)                     14
> >   ```
> >   - **7 caen en el 501**: vienen de un proveedor (Drive u OneDrive) con su id, y la vía que
> >     los repararía no está construida. Hay que volver a subirlos o construir la vía.
> >   - **2 son hojas de cálculo sin segmentos.** Las otras dos `.xlsx` del corpus están entre
> >     las 7 del 501, porque esa rama va antes. Cuáles son, lo dice la consulta 1; no está
> >     archivado aquí.
> >   - ✅ **PREDICCIÓN DEL ARQUITECTO, ACERTADA**: predijo 4 antes de medirlo, con la premisa
> >     de que los de OneDrive con id del proveedor caen en el 501. Se cuenta como las
> >     falladas.
> > - ⚠️ **Y EL BOTÓN NO ES EL QUE SE CREÍA** (B.307): en `/settings/corpus`, el «Reparar» de
> >   cada fila está DESACTIVADO para estos documentos. El que los repararía es «Reparar todo
> >   lo reparable», y ése actúa sobre TODA la organización.
> >
> > **El literal anterior, conservado** (`SQL_Corpus_Reindexable_Sin_Resubir.sql`, versión
> > con el fallo; consulta 2 del 30/09):
> > `SQL_Corpus_Reindexable_Sin_Resubir.sql`, ejecutada por el director el 30/09. Literal de la
> > consulta 2:
> > ```
> > via,documentos
> > rechazado: staged_vivo,1
> > retrocear: SIN RESUBIR,13
> > null,14
> > ```
> > - ~~**13 de 14 se reindexan SIN RESUBIR**, con el botón de `/settings/corpus`.~~ Falso:
> >   ver arriba.
> > - El **1** que queda tiene una VERSIÓN NUEVA esperando decisión (abajo).
> > - La fila `null,14` **no son otros 14 documentos**: es el TOTAL. La consulta agrupa con
> >   `GROUP BY ROLLUP (via)`, que añade una fila de total con `via` vacía. 1 + 13 = 14, y el
> >   14 cuadra con el censo. **Los documentos CON trozos no entran en esta consulta**: la
> >   consulta 2 sólo clasifica los `analizado` con cero trozos (`trozos_activos = 0`).
> > - Que el `null,14` coincidiera con «los 28 con trozos» (1 + 13 + 14) fue **una casualidad
> >   que el arquitecto persiguió**, y lo anota él mismo (30/09).
> > - ~~**Lo primero que puede hacer el director** para que los 13 pasen a 14~~ es decidir la
> >   versión nueva del `staged_vivo` (new 9.txt) en la bandeja (abajo). Sigue siendo
> >   cierto que ese documento espera decisión; el «13» no.
>
> ⚠️ **Y REINDEXAR PUDO NO SER UN BOTÓN, y en otro corpus lo será** (H-2 del arquitecto,
> sobre un hallazgo de Code). Un documento de Drive sin segmentos NO se re-trocea desde su
> `full_text`: `planDeReindexado` lo manda a `reprocesar`, y ese camino no está construido
> (501, `lib/documents/reparar.ts:115-117`). Los `.xlsx` sin segmentos tampoco se pueden
> reindexar desde el texto sin perder las celdas. ~~**Nada de eso afecta a estos 14**, según
> la SQL.~~ **FALSO (01/10): la SQL tenía un fallo de Code y la advertencia SÍ les afecta**.
> **Medido el 01/10: 7 de los 14 caen en el primer caso (501) y 2 en el segundo; sólo 4 se
> re-trocean** (caja de arriba).
> - ✅ **RESUELTO (01/10), y la causa era la tercera, que nadie había listado: un fallo de
>   la SQL.** Las cuatro `.xlsx` NO tienen segmentos (`tiene_segmentos` salió NULL), los 14
>   SÍ son los de la lista (censo, consulta 1), y el «13 retrocear» era el fallo. Lo que
>   decía este punto, conservado: la lista nominal lleva CUATRO `.xlsx`, y el espejo manda un
>   `.xlsx` sin segmentos a «rechazado». Si 13 salen `retrocear`, o esos `.xlsx` tienen
>   segmentos guardados, o los 14 `analizado` no son exactamente los 14 de la lista. La consulta 1 lista
>   `tiene_segmentos` y `via` documento a documento. **No se deduce: se lee.** Si resulta que
>   no son los mismos 14, la versión nominal de F-2 **se corrige, no se matiza** (arquitecto,
>   30/09).
> - **El `staged_vivo`, en palabras del director**: ese documento tiene una **versión nueva
>   esperando decisión**. Aparece en la bandeja de revisión con dos botones: «Activar esta
>   versión» y «Descartar versión nueva» (`components/AnalysisModal/ReviewActions.tsx:221`,
>   `:241`).
>   - Mientras esa versión espere, el botón de reindexar no lo toca, a propósito: sólo cabe
>     una versión en vuelo por documento (`lib/document-staged.ts`).
>   - Para desbloquearlo, el director decide en la bandeja: **activarla** (sustituye a la
>     vieja) o **descartarla** (se queda la vieja, y se borran los vectores de la nueva,
>     `app/api/documents/[id]/discard-staged/route.ts`). Después, el reindexado lo acepta.
>   - Cuál es, lo dice la consulta 1.
>   - HIPÓTESIS, sin comprobar: si la versión nueva se indexó con el troceador de hoy,
>     activarla puede dejarlo con trozos sin reindexar nada.
>
> **Y esto explica por qué la medida de NOR-11 / CLI-13 SÍ funcionó.** Los dos tienen trozos,
> porque se reindexaron estos días, y el director los seleccionaba juntos. **La medida es
> válida y el resultado es real; lo que no es representativo es el corpus.**
>
> - ✅ **LA VERSIÓN NOMINAL DE F-2, CERRADA CON NOMBRES (01/10/2026).** La consulta 1 del censo
>   (`SQL_Documentos_Sin_Chunks.sql`, ejecutada por el director el 01/10, resultado que
>   transcribe el arquitecto) da **22 documentos sin trozos**: **14 `analizado`** y 8
>   `pendiente` (new 3, 4, 7, 8, 12, 13, 14 y 15). Los 14 `analizado`, con los caracteres de su
>   `full_text`:
>
>   | Documento | Caracteres |
>   |---|---|
>   | 2_Glosario_Terminos.pdf | 8.207 |
>   | 3_Especificacion_Tecnica.pdf | 4.450 |
>   | Actas_Direccion_2025.docx | 3.518 |
>   | Facturacion_2025.xlsx | 2.822 |
>   | new 1.txt | 1.807 |
>   | new 9.txt | 1.742 |
>   | Normas_Frecuencia_Recogidas.docx | 1.720 |
>   | Protocolo_Visitas_Centros.docx | 1.588 |
>   | new 10.txt | 1.297 |
>   | new 11.txt | 1.150 |
>   | new 6.txt | 1.089 |
>   | Registro_Visitas.xlsx | 585 |
>   | Clientes_Residuos_Peligrosos.xlsx | 406 |
>   | Clientes_Residuos_Sanitarios.xlsx | 398 |
>
>   - **Son exactamente los 14 que el retrieval devolvió a NOR-11 el 29/09 a las 10:51** con
>     `0 ids de tanda` (la lista de abajo): Code ha cotejado los dos conjuntos nombre a
>     nombre. **F-3 queda confirmado con los dos censos cruzados: ya no es inferencia.**
>   - **El corpus entero suma 30.779 caracteres** (recalculado por Code). Es `full_text`,
>     texto plano. NOR-10 SOLO tiene 59.517 en el texto plano de su `.docx` (D-4) y 66.801
>     renderizados: **el corpus es menos de la mitad que un solo documento del piloto**, en
>     cualquiera de las dos medidas.
>   - **La causa, por documento**: `anterior_a_F20` en 21 de los 22. La excepción es **new
>     9.txt**: `trozos_de_otra_generacion`, con `active_generation = 3` y
>     `trozos_otras_generaciones = 2`. Es también el `staged_vivo`.
>
>   La lista que este punto esperaba cotejar, conservada (NOR-11, 29/09 a las 10:51):
>   - Clientes_Residuos_Sanitarios.xlsx, Registro_Visitas.xlsx,
>     Clientes_Residuos_Peligrosos.xlsx, Protocolo_Visitas_Centros.docx,
>     Actas_Direccion_2025.docx;
>   - Normas_Frecuencia_Recogidas.docx, Facturacion_2025.xlsx, 2_Glosario_Terminos.pdf,
>     3_Especificacion_Tecnica.pdf;
>   - new 9.txt, new 11.txt, new 6.txt, new 10.txt y new 1.txt.
>
>   ~~**Esa correspondencia no está verificada contra la base.**~~ **Verificada el 01/10.** Lo
>   que sigue sigue valiendo: prueba menos de lo que parece: el retrieval sólo
>   devuelve los que se parecen, y 14 recuperados de 14 posibles dice que la metadata de
>   esos 14 es `analizado`, **no que ningún otro vector lleve esa metadata** (el invariante
>   F-96, B.301).
> - ~~**«Todos anteriores a F-20»: NO CONSTA.**~~ **Medido el 01/10: 13 de los 14.** El 14.º,
>   new 9.txt, es `trozos_de_otra_generacion`. La extrapolación del arquitecto (30/09) era
>   casi cierta, y «casi» es justo lo que la medida añade.

**Escritos el 29/09/2026 a las 11:23, antes de tocar código.** Son del arquitecto, literales.
Code sólo los archiva. El cambio sustituye las dos tijeras del juez por UN presupuesto por
pareja, detrás de un interruptor.
- **Las dos tijeras de hoy**, verificadas en el código:
  - el analizado se corta por posición a 6.000 (`lib/analysis/judge.ts:35`, `:1086`);
  - el candidato va por relevancia a 3.000, con un tope de 25 piezas
    (`lib/analysis/retrieval.ts:104`, `:110`).
- **Lo que decidió el arquitecto tras la parada de Code (C1-C3):**
  - **C1.** El campo es uno por candidato, `lecturaDeLasParejas`, desde el primer commit. Un
    campo que nace por análisis y pasa a ser por candidato es un campo guardado que cambia de
    forma.
  - **C2.** `presupuestoDelCandidato` (B.281) y `lecturaDeLasParejas` NO son duplicados: son
    dos estaciones. La primera es lo que recuperó el retrieval, antes del rerank. La segunda
    es lo que leyó el juez. Que discrepen es un dato. El interruptor actúa DESPUÉS del rerank,
    en la puerta del juez: el rerank nunca recibe documentos enteros.
    - 🎯 **SE PAGÓ EL 30/09, medido desde la base** (`SQL_Escalon1_pareja_NOR11_CLI13.sql`).
      Con el interruptor encendido, la MISMA fila dice:
      - `juez_candidato_mostrados = 14704`, `juez_candidato_dejo_fuera = false`;
      - `retrieval_candidato_mostrados = 2813`, `retrieval_candidato_dejo_fuera = true`.

      Las dos son verdad: el retrieval sigue recortando, y el juez ya no usa su recorte.
    - **Es la justificación medida de una decisión de diseño que el arquitecto había pedido
      al revés**, y lo dice él (30/09). El 29/09 propuso «el lado candidato ya lo cubre
      B.281, no lo dupliques»; Code paró, y C2 lo decidió así. Con la propuesta original,
      hoy no habría por dónde ver que la mejora entró por el juez.
  - **C3.** El interruptor es SÓLO para el modo rápido. En un exhaustivo, `corte_honesto` no
    puede aparecer nunca; si aparece, es un fallo. Si algún día el rápido encendido encuentra
    más que el exhaustivo, se escribe como hallazgo.
- **El presupuesto**: 10.000 tokens por pareja = **40.000 caracteres**. La conversión es
  caracteres / 4, la de las SQL de F-118 (`SQL_F118_tamanos_por_pareja.sql`). Se elige para
  que el corte se dispare alguna vez: un mecanismo que no se dispara no está probado.
  - ⚠️ **D-4 — ESA JUSTIFICACIÓN ESTÁ RETIRADA** (arquitecto, 29/09, a la vista del literal
    de la consulta 4 de B.273). Con 10.000, el corte se dispara para DOS documentos reales,
    NOR-10 y CLI-12. Elegirlo «para ejercitar el camino» es degradar su análisis para probar
    código, y el camino ya lo ejercitan los 108 casos y los mutantes de D-3. **Probar a costa
    del usuario no es probar: es cobrarle la prueba.**
  - ~~**El número SOBREVIVE, PENDIENTE DE BASE.**~~ *La base llegó el 30/09 (abajo).* No se
    tocó antes de esta medida: NOR-11 + CLI-13 son 24.521 caracteres, unos 6.130 tokens, por
    debajo de cualquier presupuesto que se discuta.
  - **LA BASE DE D-4 (arquitecto, 30/09; cruzada con el registro por Code).** Según
    `corpus-pruebas/SIEMBRA_corpus_ampliado.md:32-162`, entre NOR-10 y CLI-12 hay **CUATRO**
    contradicciones:
    - **A**, el responsable último de la esterilización (NOR-10 p. 2, ap. 2.1 / CLI-12 p. 2,
      ap. 3.1);
    - **B**, la periodicidad del control biológico: semanal frente a mensual (NOR-10 **p. 11**,
      ap. 10.2 / CLI-12 p. 11, ap. 12.1);
    - **C**, la caducidad del material esterilizado: 6 frente a 12 meses (NOR-10 **p. 16**,
      ap. 13.4 / CLI-12 p. 16, ap. 16.2);
    - **D**, si las dos figuras pueden ser la misma persona. **No se sembró**: se descubrió el
      27/08. Detectarla es un ACIERTO.

    El registro avisa de que «no se puede afirmar que no haya una quinta» (`:48-49`). Por eso
    un hallazgo fuera de A-D **no se da por falso sin ir al texto**.
    - **Lo que encontró el juez** (del arquitecto, sobre logs que Code no ha visto):
      - todo es A, en varias formulaciones;
      - hay un roce con D: `[75925931]` y `[8878a300]`, «figura que puede recaer en el propio
        Director Clínico», que es el lado NOR-10 de la D literal, **descartado por cita no
        verificable**;
      - **B y C no aparecen ni una vez.**
    - ~~⚠️ **Qué análisis son, no cuadra con el archivo.**~~ **Aclarado el 30/09.** Son las
      **siete PASADAS del 30/09, entre las 06:36:58 y las 06:41:10 UTC**. Ahora están en
      B.299, en una entrada propia y separada de los cuatro análisis del 29/09. El arquitecto
      las había confundido al citarlas.
    - **El motivo, con el interruptor APAGADO**: el log dice «truncado a 6000 de 66801
      caracteres». Code ha medido dónde caen B y C en el texto plano del .docx, con la
      extracción del propio registro (`:124-125`):

      | | Longitud | A | D | B | C |
      |---|---|---|---|---|---|
      | NOR-10 | 59.517 | 2.069 (3,5 %) | 3.750 (6,3 %) | 33.140 (55,7 %) | 52.209 (87,7 %) |
      | CLI-12 | 50.202 | 3.715 (7,4 %) | 6.343 (12,6 %) | 32.367 (64,5 %) | 46.926 (93,5 %) |

      **A y D caben en los 6.000 del analizado; B y C, muy lejos.** El juez nunca leyó el
      lado analizado de B ni de C.
    - **CONCLUSIÓN, y queda quitado el «pendiente de base».** Subir el presupuesto para que
      NOR-10 + CLI-12 quepan enteros no es una preferencia estética. Son 66.801 + 55.135 =
      **121.936 caracteres**, 30.484 tokens. Es la condición para encontrar dos
      contradicciones reales, documentadas con página y apartado, que hoy son inalcanzables.
    - **Lo que sigue pendiente**: el dato de coste y latencia a unos **30.000 tokens**. La
      pregunta abierta y la regla de decisión de abajo se escribieron con 17.000 (la «pareja
      mayor posible» de B.273), y esta pareja la supera. La consulta 3 de B.273 se contó sobre
      documentos `analizado`, y NOR-10 y CLI-12 son `pendiente` (consulta 4 de B.273; analizarlos
      desde la bandeja no los cambió): sólo se encuentran en una tanda (B.300).
  - ⚠️ **LA CONSECUENCIA INCÓMODA, CORREGIDA POR CODE A LA MITAD** (corrección aceptada por el arquitecto el 30/09). Con 40.000 esta pareja cae
    en `corte_honesto`, paso 3: los dos documentos pasan solos de 40.000 − 6.000. El
    arquitecto concluyó que «el escalón 1, tal como está encendido, no puede encontrar B ni
    C». **El código dice algo más fino.**
    - En el paso 3 el candidato vuelve a su bloque por relevancia, pero **el analizado NO se
      queda en 6.000**. Se lleva el resto, por posición:
      `max(6.000, presupuesto − bloque)` (`lib/analysis/judge.ts:1338-1340`). Son unos 37.000
      caracteres.
    - **C: inalcanzable en las dos direcciones.** El lado analizado de C está hacia el
      88-94 % del documento, muy por encima de 37.000 en cualquiera de los dos.
    - **B: en el filo, no descartado.** Escalando la posición del texto plano al renderizado
      (**estimación**, no medida):
      - en CLI-12, B cae hacia 35.500 de 55.135, **dentro** de los ~37.000;
      - en NOR-10, hacia 37.200 de 66.801, justo **en el borde**.

      Con CLI-12 como analizado, B es alcanzable **si** el trozo de B de NOR-10 entra en el
      bloque por relevancia del candidato (~3.000). Eso no consta.
    - **Lo que sí se sostiene entero**: el caso de control de los cargos no se puede superar
      hoy. C no se alcanza, y B depende del filo y de la relevancia.
  - **El presupuesto no es un límite técnico: es una decisión de coste y latencia.** La
    ventana de Haiku 4.5 son 200.000 tokens (dato del arquitecto) y la pareja mayor posible
    del corpus, 17.062. Con 25.000 cabría hoy el corpus entero.
  - **PREGUNTA ABIERTA, sin trabajo asociado todavía**: qué cuestan, en latencia y en coste
    por análisis, 17.000 tokens. *(30/09: con la base de arriba, la cifra que importa son
    unos 30.000.)* Esta tanda mide la latencia a ~6.130 (P-4, R-3); falta el
    otro extremo.
  - **REGLA DE DECISIÓN, escrita antes del dato**:
    - ⚠️ *(30/09) Escrita con 17.000, el máximo de la RUTA POR DEFECTO (B.273). En una
      tanda hay al menos una pareja de ~30.484 tokens (NOR-10 + CLI-12), y la mayor posible
      no se sabe. Donde dice 17.000, la cifra que importa son ~30.000, y es un suelo. El
      umbral de 60 s y la forma de la regla no cambian.*
    - Si a 17.000 tokens la latencia del rápido queda por debajo del límite de R-3 (60 s) y
      el coste por análisis no sube de forma que importe → el presupuesto sube a cubrir el
      corpus, y el corte honesto queda para documentos de verdad patológicos.
    - Si no → se queda en 10.000, y entonces SÍ hay una razón para recortar esos dos.
- **Plan de medida** (lo ejecuta el director desde la aplicación; Code no lanza nada):
  - 5 pasadas por dirección de NOR-11 / CLI-13 con el interruptor APAGADO, como línea de base;
  - 5 con el interruptor ENCENDIDO;
  - regla de estabilidad: 5/5 estable-acierto, 0/5 estable-fallo, 1 a 4 inestable.
  - Se lee con `SQL_Escalon1_pareja_NOR11_CLI13.sql`.
  - 📏 **LA REGLA DE LA MEDIDA: EXACTAMENTE DOS DOCUMENTOS SELECCIONADOS** (arquitecto,
    30/09). Cada pasada se lanza con exactamente dos documentos seleccionados en la bandeja,
    y ninguno más. **El log lo confirma: tiene que decir `1 ids de tanda`**
    (`app/api/analyze-v2/route.ts:598`, que cuenta los DEMÁS seleccionados,
    `hooks/review/useReviewAnalysis.ts:126`).
    - Un `0` invalida la pasada: la pareja no se vio. Los dos están en `pendiente`, y un
      `pendiente` sólo entra como candidato por la tanda (`lib/pinecone/vectors.ts:110-120`).
    - Un `2` o más la invalida también: entró un tercero, y puede desplazar candidatos
      (B.300).
    - **La validez va atada al CONTADOR, no a la hora.**
    - 📏 **LA PRÓXIMA LÍNEA DE BASE SE MIDE UNA SOLA VEZ, Y CON B.299 YA DESPLEGADO** (decisión
      del arquitecto, 01/10/2026).
      - La base del 30/09 quedó vieja al entrar los seis documentos en el corpus (B.307).
      - Medirla ahora y otra vez tras el arreglo sería medir dos veces una base que va a
        cambiar.
      - **El arnés no se vuelve a pasar hasta que B.299 esté en producción**, y entonces una
        vez.
      - Al leerla, sembradas y parejas sin auditar se cuentan aparte (B.299, entrada 6).
    - ~~«De una en una, nunca en tanda»~~. **Estaba al revés.** Sin acompañante la pareja no
      se ve y no hay nada que medir. La propuso el arquitecto en el encargo E-3 (30/09 por la
      mañana), y **nunca llegó a archivarse**: Code paró antes, al leer que «1 ids de tanda»
      significa un acompañante. Se deja tachada aquí porque circuló como regla.
    - **Las pasadas de esta medida, reetiquetadas**: de «de uno en uno» a **«con
      acompañante, pareja aislada»**. Todas dicen `1 ids de tanda` (del arquitecto), así que
      son válidas.
    - **Son 16 con el interruptor apagado (8 + 8) y 12 encendido (6 + 6)**, contadas en la
      base (`SQL_Escalon1_pareja_NOR11_CLI13.sql`, 30/09). Los recuentos sobre log daban
      «12 y 12» y luego «6 + 8». **Gana la base.**
  - ⚠️ **EL CORPUS QUIETO** (regla del arquitecto, 29/09, sacada de los logs de ese día).
    ~~Entre las 09:08 y las 10:54 el corpus se movió~~ — **TACHADO el 30/09, con su motivo:
    el corpus no se movió. Cambió la CONFIGURACIÓN del análisis.** La pasada de las 10:51
    dice `0 ids de tanda` (F-1 del arquitecto, sobre un log que Code no ha visto):
    - a las 10:51 CLI-13 no estaba entre los candidatos de NOR-11 **porque no iba
      seleccionado con él**: es `pendiente`, y sin tanda no es candidato. Los cuatro
      «new N.txt» son del corpus por defecto (los 14 de arriba) y salieron porque no había
      acompañante que les quitara las plazas (hipótesis de B.300);
    - a las 10:53 CLI-13 se reindexa, y a las 10:54 vuelve. Según el arquitecto, en todas
      las pasadas en que CLI-13 es candidato de NOR-11 el log dice `1 ids de tanda`, así
      que lo que lo hace volver es la tanda, no el reindexado.

    La regla sigue en pie por su propio motivo: con el corpus quieto, y con el mismo
    acompañante en cada pasada, los candidatos no cambian.

    Con los candidatos cambiando entre pasadas, las pasadas no son comparables. **Entre las
    diez pasadas no se sube, no se borra y no se reindexa ningún documento de la
    organización. Si hay que tocar el corpus, la medida se descarta y se empieza de nuevo.**
    La SQL lo deja comprobar: si los candidatos juzgados cambian entre pasadas de una misma
    dirección, la tanda no vale (columna `candidatos_estables`).

**PREDICCIONES**

⚠️ **REESCRITAS EL 29/09 POR LA TARDE, ANTES DE MEDIR.** ~~El corpus cambió a las 13:14-13:16
UTC: el director analizó NOR-10 y CLI-12, que pasaron de `pendiente` al corpus y ya son
candidatos~~.
- **FALSO, corregido el 30/09, y lo desmontó el director.** «No he añadido al corpus ningún
  documento, solo los he analizado desde la bandeja de revisión.»
- NOR-10 y CLI-12 **no pasaron al corpus**. Analizar desde la bandeja no cambia
  `analysis_status`: `analyze-v2` sólo escribe `analyzed_content_hash`
  (`app/api/analyze-v2/route.ts:711`), y a `analizado` sólo se pasa por `mark-analyzed`,
  `index-text`, `ingest` o el cambio de versión.
- **Lo que cambió fue la CONFIGURACIÓN del análisis: tanda frente a acompañante único.**
  NOR-11 se lanzó a las 13:15 con tres acompañantes (`3 ids de tanda`), y la tanda los hizo
  candidatos (F-1, confirmado).

(Contesta de paso que NOR-10 y CLI-12 no habían fallado: no se habían analizado.) Dos
predicciones quedan
**ANULADAS por cambio de condiciones**, y P-1 y P-2 se corrigen por un defecto de método. Las
originales siguen aquí, tachadas y con su motivo.
**Una predicción anulada por un cambio de condiciones no es una predicción fallada: es NULA.**
Confundirlas sería regalarse un acierto o un fallo que no se ha ganado.

📌 **LA REGLA, para ésta y para las que vengan: una trampa se nombra por su ASUNTO, no por su
identificador.** El identificador es el hash del par de citas (`hashCitationPair`), así que
identifica una CITA, no un hallazgo. En el análisis del 13:16:05 la MISMA trampa salió como
`[e7785038]` en vez de `[9d19a20b]`, porque la cita cambió una palabra.

- ~~**P-1.** Con el interruptor encendido, la trampa [9d19a20b] «Plazo máximo de permanencia de
  contenedores grupo III» saldrá en AMBAS direcciones…~~ *Anclada a un hash, que no sobrevive
  entre pasadas.* **Reescrita:**
  **P-1.** Con el interruptor encendido, la trampa del **plazo máximo de permanencia de
  contenedores del grupo III en el almacén** saldrá en AMBAS direcciones, en al menos 4 de las
  5 pasadas de cada dirección. Hoy sale en una sola.
- ~~**P-2.** …6 celdas del experimento decisivo…~~ *Mismo defecto: las celdas se identificaban
  por hash.* **Reescrita:**
  **P-2.** La pareja alcanzará al menos 4 de las 6 celdas del experimento decisivo (B.280) —las
  tres trampas por las dos direcciones, cada una nombrada por su asunto—, en al menos 4 de 5
  pasadas.
- **P-3.** El falso positivo [14123c6f] «Fecha de última revisión» NO desaparecerá, y es igual
  de probable que salga más veces que menos. Si desaparece, no es mérito de este cambio y hay
  que buscar qué otra cosa se movió.
- **P-4.** La latencia del modo rápido en esta pareja subirá de ~20 s a entre 25 y 40 s.
- **P-5.** Ninguna pareja se quedará sin analizar por tamaño: las que no quepan saldrán con
  `regimen = 'corte_honesto'`.
- ~~**P-6** (la de abajo, con sus horas).~~ **ANULADA por cambio de condiciones.** Nombraba a
  Normas_Frecuencia_Recogidas.docx y predecía exactamente dos entradas. En el análisis de NOR-11
  del 13:15:45, Normas_Frecuencia ya no aparece entre los candidatos: NOR-10 y CLI-12 lo han
  desplazado. **Reescrita** (redactada por Code a petición del arquitecto, el 29/09 por la tarde,
  antes de medir):
  **P-6.** Con el interruptor encendido, `lecturaDeLasParejas` llevará una entrada por candidato
  juzgado, y su régimen lo decidirá el tamaño de cada pareja, no el orden:
  - NOR-11 ↔ CLI-13 (14.704 + 9.817 = 24.521) → `pareja_entera`;
  - la pareja de NOR-11 o de CLI-13 con NOR-10 (66.801) o con CLI-12 (55.135) →
    `corte_honesto`, siempre por el paso 3: los dos pasan solos de 40.000 − 6.000;
  - cualquier candidato sin trozos → `sin_fuente_comun`.

  Si un mismo análisis da el mismo régimen a una pareja que cabe y a otra que no, algo está mal.
- **P-6 original.** Escrita por el arquitecto el 29/09 a las **11:42**, después del informe del commit 1
  y antes de que existiera el commit 2 (`2467b203` es de las **11:44**). Archivada aquí a las
  12:05, con el commit 2 ya subido y antes de cualquier medición con el interruptor encendido.
  Literal:
  > Con el interruptor encendido, cada análisis de la pareja NOR-11 / CLI-13 producirá dos
  > entradas en lecturaDeLasParejas: una con regimen = 'pareja_entera' (el documento de la
  > pareja) y otra con regimen = 'sin_fuente_comun' (Normas_Frecuencia_Recogidas.docx, que hoy
  > llega por full_text de respaldo). Que la segunda no se pueda leer entera no impedirá que
  > la primera sí. Si las dos salen con el mismo régimen, algo está mal en la detección de
  > fuente.

  ⚠️ **Depende de D-1** (el régimen `sin_fuente_comun`), que no está en `main` cuando se
  archiva. Con el commit 2 tal cual, esa segunda entrada saldría `tijera_vieja`. **El
  interruptor no se enciende hasta que D-1 esté desplegado.**
  El dato de partida es de los logs del 29/09 que trae el arquitecto: «Chunks para
  verificación: 1/2 documentos con chunks (1 por full_text de respaldo)». No está medido
  aquí; lo contrasta `SQL_Documentos_Sin_Chunks.sql`.

**CRITERIOS DE REVERSIÓN** — si se cumple uno, se apaga y se mide por qué. No se parchea sobre
la marcha.
- **R-1.** Si una trampa que hoy sale de forma estable deja de salir de forma estable.
- **R-2.** Si la precisión cae más de 15 puntos: hallazgos publicados que el verificador no
  confirma, o que el arquitecto declara falsos al revisarlos.
- **R-3.** Si el modo rápido pasa de 60 s en esta pareja.
- **R-4.** Si algún análisis falla por exceso de contexto del proveedor. Eso no sería un
  corte, sería un error: significaría que el presupuesto está mal calculado.

**D-3 (arquitecto, 29/09, corrige el punto 3(b) del encargo antes de medir).**
- **Por qué.** Con el candidato en su bloque de relevancia (≤3.000), el `corte_honesto` era
  casi indistinguible de la tijera vieja justo en las parejas grandes. No se puede
  re-seleccionar por relevancia con más presupuesto: lo recuperado no sobrevive al rerank, y
  retrieval no se toca.
- **La forma, en cascada:**
  1. el candidato va ENTERO si cabe en 40.000 − 6.000 (6.000 = lo que el analizado recibe
     hoy);
  2. el analizado se lleva el resto, por posición, nunca menos de 6.000;
  3. si el candidato entero no cabe ni así, vuelve a su bloque por relevancia, y el
     analizado se lleva el resto.
- **El invariante, a probar con mutante, escrito sobre TROZOS REPRESENTADOS** (formulación de
  Code, aceptada el 29/09 en lugar de «contenido»). Con el interruptor encendido, en los
  cuatro regímenes:
  - candidato: todo `chunkIndex` que representa el bloque por relevancia está también en
    el entero;
  - analizado: el texto enviado empieza por los 6.000 de hoy.

  En caracteres puede salir al revés: cada fragmento suelto del bloque lleva su cabecera
  `[Fragmento n de "…"]` (`judge.ts:619`), y el entero no. Si la relevancia coge TODOS los
  trozos de un documento pequeño, el entero tiene menos caracteres con el mismo contenido.
  - **Excepción CONOCIDA Y ACEPTADA, para que nadie la «arregle»**: la línea de contexto de
    filas colapsadas (`isContext`) y el resumen de una tabla de nivel 3 están en el bloque y
    el entero no los reproduce palabra por palabra. El entero imprime las FILAS, que es más
    información, aunque no la misma cadena. El invariante es sobre información, no sobre
    cadenas.
- ✅ **D-3 VERIFICADO EN PRODUCCIÓN el 30/09: el corte honesto se disparó por primera vez, y
  los dos ramos de la cascada hacen lo diseñado**, cada uno en una dirección. Es log del
  producto, que transcribió el arquitecto; Code no lo ha visto. Hasta entonces el corte
  honesto sólo tenía los 108 casos y los mutantes.
  - **12:29:49 · NOR-10 analizado + CLI-13 candidato, PASOS 1 y 2**: «pareja corte_honesto —
    analizado 30183/66801 (dejó fuera), candidato 9817/9817».
    - El candidato va entero: 9.817 ≤ 40.000 − 6.000.
    - El analizado se lleva el resto: 40.000 − 9.817 = **30.183**. Cuadra al carácter.
  - **12:29:31 · CLI-13 analizado + NOR-10 candidato, PASO 3**: «pareja corte_honesto —
    analizado 9817/9817, candidato 3206/66801 (dejó fuera)».
    - El candidato entero no cabe (66.801 > 34.000) y vuelve a su bloque por relevancia:
      3.206.
    - El analizado entra entero: 9.817 ≤ max(6.000, 40.000 − 3.206)
      (`lib/analysis/judge.ts:1338-1340`).
  - **Tres ramos más, el 30/09 entre las 13:01 y las 13:03** (L-5 del arquitecto, sobre el log
    del director). Los tres cuadran al carácter con la cascada:
    - **CLI-12 analizado, NOR-11 candidato entero**: analizado 25296 = 40.000 − 14.704.
      **Paso 2.**
    - **CLI-12 analizado, NOR-10 candidato al bloque**: analizado 37271 y candidato 2729
      (37.271 + 2.729 = 40.000). **Paso 3.**
    - **NOR-11 analizado, NOR-10 y CLI-12 candidatos al bloque**: analizado 14704 ENTERO,
      candidatos 2860 y 2879. **Paso 3 con el analizado cabiendo entero**: 14.704 ≤
      40.000 − 2.860.
  - **Y un CONTROL NEGATIVO que salió gratis**: entre NOR-10 y CLI-13 **no hay
    contradicciones sembradas**. Los pares sembrados son NOR-11/CLI-13 y NOR-10/CLI-12
    (`corpus-pruebas/SIEMBRA_caso_control.md`, `SIEMBRA_corpus_ampliado.md`).
    - Con `corte_honesto` y hasta 40.000 caracteres delante, el juez emitió **0
      contradicciones y 0 solapamientos en las dos direcciones**. No inventó nada.
    - Hasta ahora R-2 se apoyaba sólo en la pareja sembrada.
    - ⚠️ «No hay sembradas» no es «no hay ninguna»: el registro de NOR-10/CLI-12 encontró
      una cuarta que nadie sembró (la D). Aquí nadie ha auditado la pareja entera. Es un
      control negativo contra la siembra, no contra el texto.
- ✅ **D-3 IMPLEMENTADO en `6d7e5781`**, después de paginar (`eaf0718c`, B.297).
  - El invariante se prueba con una rejilla de 108 casos contra la tijera vieja.
  - `leerLaPareja` devuelve `representados`, y la prueba comprueba además que dice lo
    enviado.
  - Un mutante —cortar por el final en vez de por posición— **sobrevivía** mientras el
    texto de prueba era `'a'.repeat(n)`: principio y final eran la misma cadena. Se cazó
    al hacer que el texto varíe con la posición.
- ⏸️ **Implementación PARADA el 29/09** por la comprobación (a). `getChunksForDocuments`
  (`lib/read-chunks.ts:154-159`) es UNA consulta sin paginar, con los trozos de todos los
  candidatos y de todas las generaciones. Si pasara del tope de filas de Supabase volvería
  CORTADA, sin error, y perdería la cola de cada documento. Afectaría también al pajar de
  verificación y a los `caracteres` de B.281.
  - Lo decide el dato del director: **Max Rows** (Settings → API) y el
    `count(*)` de `document_chunks` de su organización.
  - **Rama 1, el total claramente por debajo del tope**: se pagina IGUAL, antes de la línea
    de base, en bucle hasta que una página venga corta, y con una prueba que simule un tope
    pequeño. Así la completitud es por construcción: un número que vive en un panel y puede
    cambiar fuera del código no se supone, se hace irrelevante.
  - **Rama 2, el total alcanza o roza el tope**: el escalón 1 SE PARA. Sería el producto
    leyendo documentos a medias hoy, sin decirlo. Ficha propia, con prioridad y su propio
    antes y después.
  - HIPÓTESIS, etiquetada como tal: si sale la rama 2, se empieza por los descartes
    recurrentes por «cita no verificable». Hay uno en NOR-11 el 29/09, «El protocolo
    establece procedimientos normalizados para el envasado de residuos sanitarios». Puede
    ser una paráfrasis del modelo, o una cita de un trozo que la consulta no trajo.
- ~~⚠️ **EL CORTE HONESTO NO SE VA A EJERCITAR EN ESTA MEDIDA**… Saldrán `pareja_entera` y
  `sin_fuente_comun`, nunca `corte_honesto`.~~ **ANULADA por cambio de condiciones** (29/09
  por la tarde): con NOR-10 y CLI-12 en el corpus, el análisis de NOR-11 del 13:15:45 llevó al
  juez tres candidatos, CLI-13, NOR-10 y CLI-12.
  - **Ahora SÍ se ejercita**, y comprobado con el código antes de medir, en
    `pareja-entera.test.ts`, «el caso real del 29/09»:
    - NOR-11 + NOR-10 = 81.505 y NOR-11 + CLI-12 = 69.839 → `corte_honesto`;
    - los dos candidatos pasan solos de 40.000 − 6.000, así que caen en el **paso 3**: el
      candidato vuelve a su bloque por relevancia, y el analizado se lleva el resto. NOR-11
      (14.704) entra ENTERO.
  - ⚠️ **LA CONSECUENCIA HONESTA: en esas dos parejas el escalón 1 mejora SÓLO el lado
    analizado.** El candidato recibe lo mismo que hoy: **2.649 caracteres**. Es literal de un
    log del director (13:15:46) que trae el arquitecto; Code no lo ha visto: «NOR-10…
    unidades: 3 dentro, 39 fuera (tabla 0/0, prosa 3/42), 2649/3000 caracteres». Sobre los
    66.801 renderizados, el **3,97 %**.
    - ⚠️ **Esa proporción cruza estaciones**, y se dice aunque no cambie el orden de magnitud:
      - el 2.649 es la medida del RETRIEVAL (el texto de los fragmentos, la línea de
        `retrieval.ts`, la estación de B.281);
      - lo que recibe el JUEZ es el bloque renderizado, que lleva además las cabeceras
        `[Fragmento n de "…"]`, así que es algo mayor;
      - el 66.801 es del juez.
- **P-7** (del arquitecto, 29/09 por la tarde, antes del cambio). Con el interruptor encendido,
  la PROPORCIÓN de hallazgos descartados por «cita no verificable» sobre el total de hallazgos
  emitidos BAJARÁ respecto a la línea de base. Razón: con el documento entero delante, el juez
  tiene menos que reconstruir y más que copiar. Si no baja, o sube, el escalón 1 no ayuda a
  citar literalmente, y el verificador (B.299) es un problema aparte.
  - **MEDIBLE POR SQL, CON UN LÍMITE que se dice ahora y no al final.** `citaNoVerificable` se
    guarda con el resultado: por juicio (`judge.ts:509` y `:557`) y agregado en
    `discardedFindings` (`synthesize.ts:301-331`). Pero **UN SOLO contador suma contradicciones
    y solapamientos**.
  - Así que P-7 se mide sobre los DOS juntos. El denominador sale de la base:
    `verificador.hallazgos_entrantes` (contradicciones que pasaron las citas), más los
    solapamientos que las pasaron (`judgments[].overlappingContent`), más los tres descartes
    de citas.
  - **Sólo sobre las contradicciones, NO CONSTA en la base**: el reparto está únicamente en el
    log («Contradicción descartada» frente a «Solapamiento descartado»).
  - **Pero NO es «no medible», y hay salida si el resultado sale ambiguo** (arquitecto,
    29/09). El director puede pegar los logs de las diez pasadas y contar el reparto línea a
    línea. Es más trabajo y es un recuento sobre log, que se dice como tal, pero existe.
- **`textoAnalizado` ausente con el interruptor encendido: aceptado como decisión.** Es un
  reenvío, no un silencio: si `lecturaDeLasParejas` está presente, la ausencia significa
  «se leyó distinto en cada pareja».

**RESULTADO DE LA MEDIDA (30/09/2026, archivado a las 10:16).** Interruptor ENCENDIDO, 30/09
07:50–08:09 UTC. **Seis pasadas por dirección** (el plan decía cinco). Pareja aislada con un
acompañante de tanda, y corpus quieto. Todas las pasadas imprimen
`ANALYSIS_PAREJA_ENTERA=1 — presupuesto por pareja 40000 caracteres`.
- ✅ **LEÍDO DESDE LA BASE** el 30/09 (`SQL_Escalon1_pareja_NOR11_CLI13.sql`, ejecutada por el
  director con `desde = '2026-09-30 00:00:00+02'`; resultados que transcribe el arquitecto).
  - El primer recuento era del arquitecto sobre los logs. **La base lo confirma y corrige
    una cifra: la línea de base de CLI-13 → NOR-11 son 8 pasadas, no 6.** Gana la base.
  - Esa hora cubre todo el 30/09, posterior al despliegue de D-1 (29/09), así que no rompe el
    supuesto de la consulta. Mete también los dos análisis de CLI-13 del experimento de
    B.300, y la columna `candidatos_estables` los separa (abajo).
- **La naturaleza de cada hallazgo** la fija el registro de siembra: ver «LA CORRESPONDENCIA
  CON LAS TRAMPAS SEMBRADAS», abajo.

| Dirección | Interruptor | Pasadas | Trampa del plazo | 2ª trampa (color) | FP «Fecha de última revisión» |
|---|---|---|---|---|---|
| CLI-13 → NOR-11 | apagado | 8 | 8 de 8 | — | — |
| NOR-11 → CLI-13 | apagado | 8 | 0 de 8 | 0 de 8 | 4 de 8 |
| CLI-13 → NOR-11 | encendido | 6 | 6 de 6 | — | — |
| NOR-11 → CLI-13 | encendido | 6 | 6 de 6 | 6 de 6 | 0 de 6 |

- **Los identificadores, tal como los devuelve la columna `hallazgos`:**
  - apagado, CLI-13 → NOR-11: `9d19a20b` «Plazo máximo de permanencia de contenedores grupo
    III en almacén intermedio», las 8 veces;
  - apagado, NOR-11 → CLI-13: `14123c6f` «Fecha de última revisión» 4 veces, y `null` 4;
  - encendido, CLI-13 → NOR-11: `9d19a20b` «Plazo máximo de almacenamiento de residuos grupo
    III», las 6;
  - encendido, NOR-11 → CLI-13: `e7785038` «Plazo máximo…» · `5a59c682` «Color del
    contenedor para residuos grupo III no punzantes», las 6. **Contradicciones = 2 en las
    seis.**
  - El mismo `9d19a20b` sale con dos títulos: el hash es del par de citas, no del título
    (B.295, la regla del asunto).
- **P-6, desde la base y no desde el log.** `regimenes_de_todas` da, en las 12 pasadas
  encendidas y sin una excepción, `NOR-11/CLI-13: pareja_entera ·
  Normas_Frecuencia_Recogidas.docx: sin_fuente_comun`.
- **El cambio de lectura, por lado**:
  - analizado mostrados: 6000 → 9817 y 14704, y `dejo_fuera` pasa de `true` a `false`;
  - candidato mostrados: 3067 y 3038 → 14704 y 9817, y `dejo_fuera` pasa a `false`;
  - presupuesto: `null` → 40000.
- **La decisión C2, pagada** (el detalle, en C2 arriba): `juez_candidato_mostrados = 14704`
  frente a `retrieval_candidato_mostrados = 2813`, en la misma fila.
- **El guardia del corpus quieto acierta en las 30 filas.** `candidatos_estables = true` en
  **28 de las 30**: las 28 pasadas de la medida (16 + 12). Y `false` en **2**: las del
  experimento de B.300, a las 12:20:20 y 12:29:37 UTC. Literal del CSV del director, que
  transcribe el arquitecto. La medida queda certificada por la propia base.
  - El «22» que se dijo primero era del arquitecto y era falso; lo corrigió él con el
    número literal.
- **`recuperados_retrieval`**: 10-11 en las pasadas de la medida, **14** en la de 0
  acompañantes y **6** en la de 1 acompañante grande (B.300).
- **Dos renderizados, no un error.** El juez mide NOR-11 en 14.704 caracteres y el retrieval,
  en 14.676: 28 menos. Son dos renderizados distintos del mismo documento. Anotado, y no se
  persigue.
- **Régimen**: idéntico en las 12 pasadas, confirmado en el log y en la base (P-6, arriba).
  - CLI-13 / NOR-11 → `pareja_entera`: analizado 9817/9817 y candidato 14704/14704, o al
    revés según la dirección, con presupuesto 40000;
  - Normas_Frecuencia_Recogidas → `sin_fuente_comun`, con su aviso.
- **Solapamiento**:
  - CLI-13 → NOR-11 pasó del 35 % al 65 %;
  - NOR-11 → CLI-13, del 35 % al 45 %.

  Lo que cambia para el usuario va abajo.
- **Latencias (ms)**:
  - CLI-13: 22111, 20621, 20168, 19870, 20333 y 20125;
  - NOR-11: 20960, 21005, 21072, 23755 y 20129.

  Son **11 cifras para 12 pasadas: la que falta no consta.** Base: 15,4–18,6 s.

**VEREDICTO: NINGÚN CRITERIO DE REVERSIÓN SE DISPARA. EL INTERRUPTOR SE QUEDA ENCENDIDO.** Se
toma contra R-1…R-4, **escritos el 29/09 antes del cambio**, y no contra criterios elegidos a la
vista del resultado.
- **R-1.** Ninguna trampa estable dejó de salir. CLI-13 → NOR-11 pasa de 8/8 apagado a 6/6 encendido.
- **R-2.** La precisión SUBIÓ:
  - el falso positivo desapareció (4/8 → 0/6);
  - lo publicado en NOR-11 → CLI-13 pasó de 1 a 2 por pasada.

  **Firme**: la segunda publicada es la sembrada 3 (el color), no un falso nuevo. Ver la
  correspondencia, abajo. Y tiene un control negativo aparte: NOR-10 / CLI-13, sin
  sembradas, da 0 y 0 con corte honesto (D-3, «VERIFICADO EN PRODUCCIÓN»).
- **R-3.** Máximo 23,8 s, muy por debajo de 60.
- **R-4.** Ni un fallo de contexto del proveedor.

**⚠️ CAMBIO VISIBLE DE PRODUCTO: la severidad del solapamiento.** Se decide así
(`lib/analysis/synthesize.ts:167`):
- `alta` con 60 % o más;
- `media` con 30 % o más;
- `baja` por debajo.

Con el interruptor encendido:
- **CLI-13 → NOR-11** pasa de 35 % (`media`) a **65 % (`alta`)**. El usuario ve esta pareja
  marcada distinto.
- **NOR-11 → CLI-13**, 45 %, sigue en `media`.

Es el mismo 35 → 65 que dio el exhaustivo con el candidato entero (B.283). Ahora sale en el
modo rápido, y por lo tanto en lo que ve todo usuario con el interruptor encendido.

**LA CORRESPONDENCIA CON LAS TRAMPAS SEMBRADAS. Es completa.** Se cruza contra el registro de
auditoría de la pareja, `corpus-pruebas/SIEMBRA_caso_control.md`:
- **Exactamente 3 contradicciones**, «ni una más ni una menos» (`:130-139`), y cualquier otro
  hallazgo de tipo contradicción es un falso positivo:
  1. **PLAZO**: NOR-11 p. 1, ap. 2, «más de 72 horas», frente a CLI-13 p. 1, ap. 2, «más de 7
     días naturales» (`:38-51`);
  2. **LUGAR**: NOR-11 p. 3, ap. 6, «Chamberí», frente a CLI-13 p. 2, ap. 5, «Retiro»
     (`:53-66`);
  3. **COLOR**: NOR-11 p. 5, ap. 10.2, «en ningún caso… en el contenedor negro», frente a
     CLI-13 p. 4, ap. 8, «se depositan en el contenedor negro» (`:68-93`).
- El registro exige que salgan de una **comparación abierta, sin pista**. En esta medida no
  hubo pista.
- Las dos preguntas que se le iban a hacer al director las contesta este registro. La pregunta
  sobraba: el registro estaba en el repositorio desde el 27/08.

| Identificador del log | Sembrada | Dirección | Encendido | Apagado |
|---|---|---|---|---|
| `[e7785038]` «Plazo máximo de almacenamiento de residuos grupo III» | 1 | NOR-11 → CLI-13 | 6/6 publicada | 0/8 |
| `[9d19a20b]` «Plazo máximo de almacenamiento de residuos grupo III» | 1 | CLI-13 → NOR-11 | 6/6 publicada | 8/8 |
| `[5a59c682]` «Color del contenedor para residuos grupo III no punzantes» | 3 | NOR-11 → CLI-13 | 6/6 publicada | 0/8 |
| `[976f6174]` «Ubicación del punto de retirada centralizado» | 2 | NOR-11 → CLI-13 | 6/6 ENCONTRADA, 6/6 DESCARTADA (B.299) | 0/8 |
| `[14123c6f]` «Fecha de última revisión» | ninguna | NOR-11 → CLI-13 | 0/6 | 4/8 → **FALSO POSITIVO CONFIRMADO** |

- Los identificadores son del log (recuento del arquitecto). Sirven para leerlo, no para seguir
  un hallazgo entre pasadas: identifican el PAR DE CITAS.

**EL RESUMEN:**
- **Contradicciones sembradas que ENCUENTRA el juez**: apagado, 1 de 3 → encendido, **3 de 3**.
- **Contradicciones PUBLICADAS al usuario**: apagado, 1 de 3 → encendido, **2 de 3**.
- **Falsos positivos publicados**: apagado, 1 (4/8) → encendido, **0 de 6**.

**Dos cosas que ahora se pueden afirmar y antes no:**
- «Fecha de última revisión» **era un falso positivo**. El registro dice que sólo hay tres
  contradicciones, y ésa no es ninguna. Deja de estar en duda.
- `[5a59c682]` (el color) y `[976f6174]` (la ubicación) **son trampas sembradas**, no falsos
  positivos.

**LAS PREDICCIONES, UNA A UNA. Tres cumplidas, cuatro falladas y ninguna salvada**:
- ✅ P-1, P-5 y P-6;
- ❌ P-2, P-3, P-4 y P-7.

**Cuatro de siete falladas, y el cambio es un éxito claro.** Las dos cosas juntas dicen que
**nuestro modelo del juez era peor que el juez**.
- ✅ **P-1 CUMPLIDA, y de sobra.** Pedía al menos 4 de 5 en cada dirección y salió 6/6 en
  cada una.
- ❌ **P-2 FALLADA.** Las celdas del experimento decisivo (B.280) son 6: tres trampas
  (plazo, ubicación, color) por dos direcciones. Publicadas de forma estable salen **3 de 6**:
  - el plazo en las dos direcciones;
  - el color en NOR-11 → CLI-13.

  P-2 pedía al menos 4.
  - Por qué la ubicación no se cuenta: en NOR-11 → CLI-13 el juez la emite 6/6 y la
    comprobación de citas la mata 6/6. **Un hallazgo que no llega al usuario no alcanza la
    celda.** Contarla daría 4 de 6, y sería salvar la predicción con lo que el propio producto
    tira.
  - En CLI-13 → NOR-11 no consta nada más que el plazo.
  - ⚠️ **EL DEFECTO ES DE LA PREDICCIÓN, y lo declara su autor** (arquitecto, 30/09). «Alcanzará
    al menos 4 de las 6 celdas» se escribió sin definir qué es alcanzar una celda. Con la
    siembra delante hay dos lecturas, y dan distinto:
    - celdas que el JUEZ alcanza: **4 de 6** (la sembrada 1 en las dos direcciones, y la 2 y
      la 3 en NOR-11 → CLI-13). Con esa lectura, cumplida;
    - celdas PUBLICADAS: **3 de 6**. Con esa lectura, fallada.

    **La ambigüedad se resuelve a la baja, a propósito**: el trabajo del producto es publicar,
    no encontrar. P-2 queda FALLADA.
- ❌ **P-3 FALLADA.** Predijo que el falso positivo NO desaparecería, y desapareció: 4/8 → 0/6.
  Su propia cláusula obliga a buscar qué más se movió.
  - **HIPÓTESIS del arquitecto, sin investigar**: con los dos documentos enteros, el juez tiene
    contradicciones de contenido que señalar y deja de recurrir al metadato de la fecha.
- ❌ **P-4 FALLADA.** Predijo de 25 a 40 s y salió de 19,9 a 23,8 s.
  - El arquitecto estima el coste real del cambio en 3 a 6 s, no en 8 a 23.
  - Con lo que consta aquí sólo se deriva la horquilla entre extremos: de 1,3 s (19,87 − 18,6)
    a 8,4 s (23,76 − 15,4). La base pasada a pasada no consta en esta ficha.
- ✅ **P-5 CUMPLIDA.** Ninguna pareja se quedó sin analizar.
  - ⚠️ Su segunda mitad («las que no quepan saldrán con `corte_honesto`») **no se ejercitó**:
    en esta tanda no había ninguna pareja que no cupiera. Cumplida sin su caso decisivo.
- ✅ **P-6 CUMPLIDA AL PIE DE LA LETRA.** `pareja_entera` + `sin_fuente_comun`, las 12 veces,
  en el log y en la base (`regimenes_de_todas`).
  - Cumple la reescrita: el régimen lo decide el tamaño.
  - Coincide también con la original de las 11:42, que nombraba a Normas_Frecuencia.
- ❌ **P-7 FALLADA, Y EN LA DIRECCIÓN CONTRARIA.** Predijo que la proporción de descartes por
  cita no verificable BAJARÍA, y SUBIÓ: **del 17 % al 50 %**.
  - Encendido, NOR-11 a las 07:57:13: 10 emitidos, 5 descartados y 2 publicados.
  - Apagado, la misma dirección a las 07:41:18: 6 emitidos, 1 descartado y 1 publicado.
  - ⚠️ **Es un recuento de log, de UNA pasada por condición.** Cuenta contradicciones y
    solapamientos juntos, igual que el contador persistido (`citaNoVerificable`, arriba).
    El recuento de las 12 pasadas lo da la SQL.
  - **La lectura del fallo, que es lo más útil de la medida**: con los documentos enteros el
    juez encuentra MÁS, y su propia comprobación de citas mata la mitad. El escalón 1 no ha
    empeorado nada: **ha destapado que el cuello de botella está en otro sitio**. B.299 pasa
    de ficha a ser lo siguiente.

**EL ESCALÓN 1, CERRADO (30/09/2026).** Construido, probado, medido contra la siembra,
verificado desde la base, encendido y con su alcance real escrito en la caja de arriba.

**📋 EL TABLERO DE DECISIÓN (30/09/2026, del arquitecto).** Es la primera vez que hay varios
candidatos con ganancia medida, y van juntos. **Ninguno se empieza sin decisión del
director.**

| Orden | Ficha | Qué arregla | Ganancia | Hoy | Coste |
|---|---|---|---|---|---|
| 1 | **B.190** · reindexar el corpus | que cualquier otra mejora se note en un análisis normal | el escalón 1 pasa a actuar en la ruta por defecto | los 14 del corpus sin trozos: todo sale `sin_fuente_comun` | ~~13 de 14 SIN RESUBIR~~ **4 de 14** (medido el 01/10, con la SQL corregida): 7 van al 501, 2 son hojas sin segmentos y new 9.txt espera decisión. **Reparar el corpus viejo son 4 ficheros de prueba.** ⚠️ Ver la propuesta de abajo |
| 2 | **B.299** · la comprobación de citas del juez | la sembrada 2 (Chamberí/Retiro), matada 6/6 | +1 de las 3 del caso de control. **Sube por la tercera causa**: el 30/09 a las 13:01:56, segundo caso de cita LITERAL descartada (B.299, entrada 4). El desbloqueo de la B **no está demostrado** (R-4) | publicamos 2 de 3 | sin estimar; la tercera causa pide instrumentar la comprobación |
| 3 | **B.302** · la cascada del verificador | la sembrada A de los cargos, «sin oposición» 4/4 | **recalculada el 30/09: la mitad.** Con el escalón 1 encendido, la cascada mató 2 de 4 (una pasada, 13:01:56); quedan 2 por recuperar | 2 publicadas de 4 en una pasada, frente a **1 de 4 con el interruptor apagado** (29/09, la referencia; B.302): **mejora de 1 a 2** | sin estimar |
| 4 | **B.300** · la tanda desplaza | un usuario que selecciona más documentos ve menos del corpus, y nada se lo dice | lo que el desplazamiento quita; **crece con el número de seleccionados: NOR-11 14 → 11 → 4, NOR-10 14 → 12 → 3** (B.300) | medido, sin arreglo. **Detrás de B.190**, por decisión del director: la tanda es poco común, aunque existe; se arregla igual, porque el usuario hace algo más listo y obtiene menos, sin aviso | sin estimar |
| 5 | **D-4** · el presupuesto | B y C de los cargos, hoy ilegibles (C fuera de alcance, B en el filo) | +2 en el caso de los cargos; **reforzado el 30/09**: con la pareja entera entrarían los dos lados de la B (B.299, entrada 4) | inalcanzables | pendiente de la latencia y el coste a ~30.000 tokens, sin medir |

**📋 PROPUESTA DE TABLERO NUEVO (Code, 01/10/2026) — SIN CAMBIAR EL DE ARRIBA: lo cambia el
director.** Sale de dos medidas del 01/10: B.190 se queda en 4 ficheros de prueba, y la puerta
del corpus existe (B.307).
1. **Meter en el corpus la documentación indexada**: «Añadir al corpus» en la bandeja.
   - **Ya decidido por el director el 01/10**: seis documentos (B.307), con NOR-10 y NOR-11
     fuera, como sondas.
   - Después, la línea de base nueva del arnés y las sondas de B.307.
2. **B.299** · la comprobación de citas del juez.
3. **B.302** · la cascada del verificador.
4. **B.300** · las plazas compartidas. ⚠️ Su prioridad puede subir: con CLI-12 en el corpus por
   defecto, el desplazamiento deja de ser cosa de la tanda (B.307, hipótesis). P-SONDA-2 lo
   empieza a medir.
5. **D-4** · el presupuesto.
6. **B.190 · reindexar el corpus viejo, al final**: son 4 ficheros de prueba. Y sacarlos del
   corpus sin borrarlos no se puede (B.308).

**📋 EL TABLERO NUEVO (decisión del arquitecto, 01/10/2026, con las sondas delante).** Sustituye
al de arriba, que se conserva.
1. **B.299 · la comprobación de citas del juez.** Es lo único que hoy separa al producto de
   publicar las tres sembradas por la ruta normal. En las sondas se comió dos sembradas que el
   juez ya había escrito, más 5 solapamientos (B.299, cabecera).
   - Primero su lectura (L-12, hecha: B.299, entrada 5) y el arreglo, que aprueba el
     arquitecto antes de tocar nada.
2. **Los contadores de los tres topes ciegos**, plan aprobado
   (`claude/Plan_Contadores_Topes_Ciegos.md`).
   - Justo detrás de B.299, y nunca en el mismo commit ni en el mismo despliegue.
   - Antes de implementar, la ficha de la deduplicación: B.309, ya escrita.
3. **B.302** · la cascada del verificador.
4. **B.300** · las plazas compartidas. Puede subir: con CLI-12 en el corpus por defecto se ve
   sin tanda (sondas: 47 y 53 fragmentos de CLI-12).
5. **D-4** · el presupuesto.
6. **B.190 · al final.** Los 14 del corpus viejo no estorban (P-SONDA-2), así que reparar 4
   ficheros de prueba no desbloquea nada.
- **Hecho y fuera del tablero**: meter los seis en el corpus (B.307), que es lo que hizo
  posible todo lo de hoy.

**📋 EL ORDEN, DESPUÉS DE B.299 (decisión del arquitecto, 01/10/2026).** Sustituye al de arriba
en sus puestos 1 y 2. **Nada de los puestos 2, 3 y 4 se empieza sin que lo diga el
arquitecto.**
1. **B.299 · la comprobación de citas. NO ESTÁ COMPLETA** (corregido el 01/10, entrada 10).
   - Hecho y desplegable: causas (ii) (`0dd06f56`) e (i) (`6cbdeb45`).
   - **Abierta: la tercera causa, ya con nombre** (02/10). En los solapamientos, el cambiazo de
     campo (B.312, 5 de 5), **✅ CERRADA el 02/10: cuatro pasadas, cero cruces**. En las
     contradicciones, la reformulación y, sin medir, la anotación entre corchetes.
   - **EL ORDEN DEL 02/10** (arquitecto): primero el arreglo de B.312, quitar la trampa más el
     detector, con su visto bueno. Se despliega, y entonces dos análisis sueltos, NOR-11 y
     NOR-10, sin tanda: si los solapamientos dejan de morir cruzados, B.312 está cerrada. Luego
     el juez que redacta (B.313), B.310 con B.311, y los contadores.
2. **El arnés, UNA vez — APARCADO, y AL FINAL** de todo lo anterior.
   - 📌 **POR QUÉ UNA SOLA VEZ Y AL FINAL: UN CAMBIO DE PROMPT MUEVE CIFRAS QUE NO SON EL OBJETIVO
     DEL CAMBIO.** Primer caso medido, el 02/10 con B.312:
     - se cambió el formato de los solapamientos;
     - y el solape de NOR-11 con CLI-12 bajó del 15 % al 5 %, y sus solapamientos emitidos
       subieron de 1 a 3.

     Nadie lo predijo, y no es un fallo: lo que se le pide al modelo cambia lo que contesta.
     Medir el arnés entre cambios de prompt mediría una mezcla. No se pasa hasta que la
   tercera causa esté entendida y, si tiene arreglo, desplegada. Con sembradas y parejas sin auditar contadas aparte, y leído con la
   consecuencia incómoda delante (B.299, entrada 9).
3. **B.310 y B.311, JUNTAS** (arquitecto, 02/10): **el mismo problema de producto —la cita que
   publicamos tiene que poder encontrarse en el documento del cliente— por dos caminos
   distintos.** B.310 es el título pegado por el troceado; B.311, el centro sin comprobar por la
   cabeza y cola. Se deciden juntas.
4. **Los contadores de los tres topes ciegos** (plan aprobado).
5. Después, B.302, B.300 y D-4, y B.190 al final, como estaban.


### ⚠️ B.299 — LA COMPROBACIÓN DE CITAS DEL JUEZ TIRA 5 DE 7 CONTRADICCIONES entre NOR-10 y CLI-12; LA CASCADA DEL VERIFICADOR, 1 MÁS (constancia y medida, SIN arreglo; 29/09/2026)

🎯 **LO QUE VALE ARREGLARLA, MEDIDO (30/09/2026): UNA DE LAS TRES CONTRADICCIONES DEL CASO DE
CONTROL.** Con el escalón 1 encendido, la comprobación de citas mata **6 de 6** veces
`[976f6174]`, «Ubicación del punto de retirada centralizado». Es la **sembrada 2**
(`corpus-pruebas/SIEMBRA_caso_control.md:53-66`).
- Arreglarla es pasar de publicar **2 de 3 a 3 de 3** en NOR-11 / CLI-13 (B.295, «LA
  CORRESPONDENCIA»).
- Ya no es «una fuga que habría que mirar». Es un hallazgo conocido, reproducible 6/6 y con
  su ganancia medida.
- **B.299 es lo siguiente.**
- ⬆️ **LA GANANCIA SUBE (30/09, 13:01:56), POR LA TERCERA CAUSA.** La comprobación de citas
  tiró una cita **LITERAL**: es el segundo caso, después del tramo de la D, y refuerza la
  causa que ni (a) ni (b) explican (entrada 4, al final).
  - ~~«es eso MÁS el desbloqueo parcial de la B»~~: **MATIZADO (R-4, arquitecto, 01/10).** La
    cita no es la frase sembrada de la B. Lo que vale es que el juez tuvo delante **el
    dato** de la B por el lado de CLI-12, y la comprobación tiró una cita literal. **El
    desbloqueo de la B no está demostrado.**

⚠️ **Retitulada el 29/09 por la noche.** El arquitecto había juntado las dos cosas en «el
verificador tira 5 de 7, un 71 %». **Era falso, y lo corrigió él mismo.** Son dos estaciones:
la comprobación de citas ocurre en el JUEZ, antes de la cascada, y el verificador sólo mató 1.
**La fuga está en el juez, no en el verificador.**

- ⬆️ **LA GANANCIA, EN LA RUTA POR DEFECTO (01/10/2026, sondas de B.307)**: en dos análisis sin
  tanda, la comprobación de citas se comió **dos contradicciones sembradas que el juez ya había
  escrito** —la ubicación del punto de retirada en NOR-11 y la A de los cargos en NOR-10—, más
  5 solapamientos.
  - Según el arquitecto, **sin ella se publicarían 3 de 3 en NOR-11 y 1 en NOR-10**.
  - ⚠️ **Es un techo, no una medida**: lo que pasa la comprobación aún tiene que pasar el
    verificador y la cascada. La A de los cargos, en CLI-12 → NOR-10, la tira la cascada 2 de 4
    veces (B.302). En la dirección de la sonda, NOR-10 → CLI-12, el 30/09 a las 13:03:18 pasó y
    se publicó, así que el 1 es plausible, pero no está medido.
- 🔎 **L-12 (01/10): la cita NO se trunca antes de compararla.** Los cortes a 200 y a 60 son del
  log. Pero la lectura encontró dos causas en el código que tiran citas literales (entrada 5).

- ⚠️ **LO QUE NINGÚN ARREGLO DE ESTA FICHA RECUPERA, hasta que se mida** (01/10/2026). Ni el (i)
  ni el (ii) constan recuperando **la sembrada A de los cargos** (`[1eb33774]`, sonda B) ni **el
  punto de retirada** (`[976f6174]`, sonda A): por qué murieron esas dos no estaba medido (el
  punto de retirada ya lo está, 02/10: reformulación, `paso=cabeza_sin_cola`, B.313). Y los
  dos casos literales (`[f049837e]`, `[75925931]`) tampoco los explica la (i) (entrada 10).
  **La ganancia del (i) NO CONSTA.**
- ✅ **LA CAUSA (i), VISTA TRABAJAR EN PRODUCCIÓN (02/10, pasadas de las 09:24 y 09:25)**: el registro
  dice `pajar=entregado_piezas (3 trozos)` en el lado existente de CLI-12 y `entregado_texto` en los
  demás. Cada cita se comprobó contra lo que el juez leyó de su lado, y el log dice con qué. Hasta
  hoy estaba desplegada y sin verse trabajar.
- 🔎 **LA TERCERA CAUSA, ya con nombre (02/10): B.312.** En los solapamientos, el juez pone la cita
  en el campo del otro documento (5 de 5). En las contradicciones hay otras: la reformulación
  (`[976f6174]`) y, sin medir, la anotación entre corchetes (`[1eb33774]`).

📌 **TRES CONJUNTOS DISTINTOS, cada uno con su fecha, y no se mezclan.** El arquitecto confundió
el 1 y el 3 al citarlos el 30/09, y lo corrigió él mismo el mismo día.
1. **Cuatro análisis del 29/09, NOR-10 / CLI-12: 7 contradicciones, 1 publicada.** Es lo que
   sigue inmediatamente.
2. **NOR-11 / CLI-13, 30/09, con el interruptor encendido: el descarte estable.** Después del 1.
3. **Siete pasadas del 30/09, NOR-10 / CLI-12: 7 contradicciones, 0 publicadas.**
4. **CLI-12 → NOR-10, 30/09 a las 13:01:56, interruptor encendido: el roce con la B.**
5. **L-12 (01/10): dónde se corta la cita, y las dos causas que el código sí tiene.**
6. **El arreglo de la causa (ii), implementado el 01/10.**
7. **La causa (i): cuál es el pajar correcto. Contestada; nada implementado.**
8. **La causa (i), segunda ronda: el pajar es lo que leyó el juez.**
9. **El arreglo de la causa (i), implementado el 01/10.**
10. **La consulta tumba la causa (i) para los dos casos literales, y la hipótesis de que el juez
    condensa también.** Al final.

#### 1 · Cuatro análisis del 29/09 (13:14-13:16 UTC), NOR-10 / CLI-12: 7 contradicciones, 1 publicada

**De dónde sale**: el recuento lo hizo el arquitecto sobre los logs de los cuatro análisis del
director del 29/09, entre las 13:14 y las 13:16 UTC. **Code no ha visto esos logs.** La
contraparte en la base es `SQL_Escalon1_verificacion_despliegue.sql`. **Si la base no cuadra
con estos 7 y 5, gana la base** y esta ficha se corrige.

- **CLI-12 analizado → NOR-10: 4 contradicciones emitidas.**
  - [9b37aa92] «Responsable último de la esterilización» → publicada
  - [603d2891] «Autorización de excepciones al protocolo» → descartada por la CASCADA como
    `mismo_dato_sin_oposicion`
  - [9566b633] «Firma de registros de auditoría trimestral» → cita no verificable
  - [e949ea35] «Decisión de retirada de autoclave del servicio» → cita no verificable
- **NOR-10 analizado → CLI-12: 3 contradicciones emitidas.**
  - [c8fa8815], [8c721d48] y [94a23b5b] → las TRES, cita no verificable. Cero publicadas.

| Estación | Dónde | Mueren |
|---|---|---|
| **Comprobación de citas, EN EL JUEZ** | `fixQuotesInJudgment`, `lib/analysis/judge.ts:507` (contradicciones) y `:555` (solapamientos), antes de la cascada | **5 de 7 (71 %)** |
| **Cascada del verificador** | `mismo_dato_sin_oposicion` | **1 de 7** |
| **Sin publicar, en total** | | **6 de 7 (86 %)** |

- ⚠️ Los `[xxxxxxxx]` identifican el PAR DE CITAS, no el hallazgo (B.295): sirven para leer
  este log, no para seguir una contradicción entre pasadas.
- **LA CONSECUENCIA, dicha antes de medir.** Descarta la misma etapa que escribió la cita, pero
  no del mismo modo:
  - la cita la escribe el MODELO, viendo un recorte de cada lado: los primeros 6.000 del
    analizado y el bloque por relevancia del candidato (unos 2.649 de NOR-10, B.295);
  - la comprueba CÓDIGO, contra TODOS los trozos del documento (el pajar de verificación).

  La comprobación no está ciega; el que escribió sí. No son dos componentes en desacuerdo: es
  el juez sin poder citar literalmente lo que reconstruyó de lo que no vio. **Eso sube las
  posibilidades de que P-7 acierte**: con el documento entero delante, hay menos que
  reconstruir.
- **QUÉ INTENTA LA COMPROBACIÓN ANTES DE DESCARTAR** (leído el 29/09, `findBestMatch`,
  `judge.ts:75-131`; `normalize`, `lib/analysis/normalize-core.mjs:71`):
  1. la cadena literal;
  2. normalizada: minúsculas, espacios colapsados y fuera la puntuación, **corchetes
     incluidos**. Las TILDES no se quitan, a propósito;
  3. con 25 caracteres normalizados o más: la CABEZA y la COLA de la cita (hasta 20
     caracteres cada una) en orden, a menos de tres veces su longitud. Tolera lo que haya EN
     MEDIO.

  Además, una cita tabular «a | b | c» se comprueba trozo a trozo en la misma fila.
- **LA HIPÓTESIS DE LOS CORCHETES, AJUSTADA a lo que dice el código** (etiquetada, no
  investigada). El juez anota el sujeto entre corchetes —«…recae siempre sobre esta figura
  [Director Clínico]»—, y la anotación no está en el documento. La normalización quita los
  corchetes pero NO las palabras de dentro. Por eso:
  - una anotación **en medio** de una cita larga la tolera la cabeza y cola, y la cita
    SOBREVIVE;
  - una anotación **en un extremo** —como el ejemplo— cae dentro de la cola o de la cabeza, y
    la cita MUERE.

  La hipótesis explica los descartes con la anotación en un extremo, no en medio.
  Otra causa que la comprobación tampoco tolera: una tilde de más o de menos.
- **SOSPECHA, etiquetada como tal**: [603d2891] se descartó como «mismo dato sin oposición»,
  pero según las citas uno atribuye la autorización al Director Clínico y el otro al
  Coordinador de Calidad. Si es así, había oposición. **Hay que mirar el texto antes de
  afirmarlo.**
  → **Resuelta el 30/09 con la siembra, y SE VA A B.302**: es la cascada del verificador,
  otra estación y otro arreglo. Aquí sólo queda el puntero, para que las dos estaciones no se
  vuelvan a mezclar como se mezclaron el 29/09.
- **No se arregla ahora.** Se mide primero el escalón 1, y esta pareja queda como su caso de
  prueba; va inmediatamente después. P-7 (B.295) mide si el escalón 1 lo mueve.

#### 2 · NOR-11 / CLI-13, 30/09, interruptor encendido: el descarte estable

- **EL DESCARTE ESTABLE (30/09/2026, medida del escalón 1, B.295).** Interruptor encendido,
  NOR-11 → CLI-13, las SEIS pasadas, siempre igual (recuento del arquitecto sobre los logs del
  director; Code no los ha visto):
  `[976f6174]` «Ubicación del punto de retirada centralizado», cita no verificable,
  `lado=nuevo`: «El punto de retirada centralizado concentra el material de las tres clínicas,
  ubicado en la clínica de Chamberí».
  - Es una contradicción candidata **encontrada 6/6 y matada 6/6** por la comprobación de
    citas.
  - **Es la sembrada 2** (`corpus-pruebas/SIEMBRA_caso_control.md:53-66`). Es la tercera
    trampa de la pareja, y está **a un arreglo de la comprobación de citas de publicarse**.
  - En la ventana de B.280 salió publicada en las dos direcciones.
- **EL PESO DE LAS DOS HIPÓTESIS, con este caso.** Hasta ahora ninguna tenía letra en la ficha.
  Se nombran aquí:
  - **(a)** los corchetes: una anotación en un extremo de la cita;
  - **(b)** el juez rehace la frase.

  La cita descartada **no tiene corchetes ni anotaciones**. Parece una reformulación que junta
  dos ideas del documento: **refuerza la (b) y no la (a)**. Contra el literal sembrado de NOR-11
  (`SIEMBRA_caso_control.md:57`) —«El gestor autorizado recoge los residuos de las tres
  clínicas **en un** punto de retirada centralizado, ubicado en la clínica de Chamberí…»—:
  - «concentra el material» no está;
  - la cita empieza por «El punto de retirada…», que no es como empieza la frase.

  Eso tumba la cabeza del paso 3 de `findBestMatch`, aunque la cola sí casaría. ⚠️ Está
  comparado contra el REGISTRO de siembra, **no contra el texto indexado del director**, que
  Code no ha visto.
- ⚠️ **Y ESTO CORRIGE LA «CONSECUENCIA, dicha antes de medir» de arriba.** Aquí el juez tenía
  NOR-11 **ENTERO** delante (`pareja_entera`, 14704/14704) y aun así rehízo la frase. La
  versión de (b) «reconstruye lo que no vio» **no explica este caso**. Lo explica «reescribe
  aunque lo vea». Es coherente con el fallo de P-7: con más texto, más descartes, no menos.

#### 3 · Siete pasadas del 30/09 (06:36:58-06:41:10 UTC), NOR-10 / CLI-12: 7 contradicciones, 0 publicadas

**De dónde sale**: el recuento lo hizo el arquitecto sobre los logs del director; **Code no los ha
visto.** Las pasadas son **anteriores al encendido** (07:50), así que el interruptor estaba
apagado. Cuántos `ids de tanda` llevaba cada una no consta.

| Hora (UTC) | Dirección | Contradicción emitida | Muere en | Además |
|---|---|---|---|---|
| 06:36:58 | CLI-12 → NOR-10 | `[04ed1945]` «Responsabilidad última de la esterilización» | cascada, `mismo_dato_sin_oposicion` | — |
| 06:37:58 | CLI-12 → NOR-10 | `[14261637]`, el mismo asunto | cascada, `mismo_dato_sin_oposicion` | — |
| 06:38:53 | CLI-12 → NOR-10 | `[14261637]` | cascada, `mismo_dato_sin_oposicion` | — |
| 06:40:26 | CLI-12 → NOR-10 | `[04ed1945]` | cascada, `mismo_dato_sin_oposicion` | `[95650537]` solapamiento, cita no verificable |
| 06:38:16 | NOR-10 → CLI-12 | `[564c05ba]` «Responsabilidad última del Coordinador de Calidad vs Director Clínico» | comprobación de citas | `[75925931]` solapamiento, cita no verificable |
| 06:39:11 | NOR-10 → CLI-12 | `[61d11ef2]` | comprobación de citas | `[8878a300]` y `[0bc9c058]`, solapamientos, cita no verificable |
| 06:40:46 | NOR-10 → CLI-12 | `[564c05ba]` | comprobación de citas | `[75925931]` |

**Total: 7 pasadas, 7 contradicciones emitidas, 0 publicadas. ESTABLE-FALLO, 0 de 7.**
- **Cruzado con la siembra de la pareja** (`corpus-pruebas/SIEMBRA_corpus_ampliado.md:32-162`:
  A, B y C sembradas; D descubierta el 27/08, y detectarla cuenta como acierto):
  - **las siete son la A**, el responsable último de la esterilización, en dos
    formulaciones;
  - **B y C no aparecen ni una vez.** El motivo, con posiciones medidas, está en D-4 (B.295):
    el analizado se cortaba a 6.000 y las dos están pasada la mitad de cada documento.
- **Las dos estaciones, cada una en una dirección, y las dos matan la A 100 %:**
  - **CLI-12 → NOR-10: la CASCADA, 4 de 4 → B.302.** Es otra estación y tiene ficha propia.
    Aquí sólo el puntero.
  - **NOR-10 → CLI-12: la COMPROBACIÓN DE CITAS, 3 de 3.** Ésta sí es de esta ficha.
- **El roce con la D es un SOLAPAMIENTO, no la contradicción D.** `[75925931]` y
  `[8878a300]` citan «Cada clínica cuenta con un Coordinador de Calidad, figura que puede
  recaer en el propio Director Clínico o en otro profesional designado por él…», que es el
  lado NOR-10 de la D. El juez lo trajo como solapamiento, y lo descartó la comprobación de
  citas.
  - ⚠️ **Lo medido por Code**: ese tramo está LITERAL en NOR-10. Es la línea 32 del texto
    extraído con el comando del propio registro (`SIEMBRA_corpus_ampliado.md:124-125`), y el
    registro ya avisaba de que una cita así «NO está alucinando… la cita existe» (`:147-149`).
  - **Lo que NO consta**: la cita entera. Llegó cortada por «…».
  - **Si la cita entera fuera literal, ni (a) ni (b) explican el descarte**, y habría una
    tercera causa: por ejemplo, que la comprobación no tuviera esos trozos en su pajar
    (aceptada por el arquitecto el 30/09). **Es la primera pregunta del arreglo.**
  - ⚠️ **Y NO SE CONTESTA LEYENDO MÁS LOGS**: el log también corta la cita, a unos 200
    caracteres (del arquitecto); por eso llegó con «…». Para contestarla hay que
    INSTRUMENTAR la comprobación, y eso es trabajo del arreglo, no de la constancia.

#### 4 · 30/09, 13:01:56 UTC, CLI-12 → NOR-10, interruptor encendido: el DATO de la B por el lado de CLI-12, y una cita literal descartada

- **R-4 · ~~«El juez roza la contradicción B»~~: MATIZADA, no retirada** (arquitecto, 01/10).
  - **Lo que NO se puede decir**: que el juez tuviera delante la frase sembrada.
  - **Lo que SÍ, y es lo que vale**: tuvo delante el DATO de la B por el lado de CLI-12, y la
    comprobación de citas tiró una cita LITERAL.
  - **Así que lo que sube es B.299**: segundo caso de cita literal descartada, y refuerzo de
    la tercera causa.

**De dónde sale**: log del director, transcrito por el arquitecto (L-3); Code no lo ha visto.
- **Solapamiento descartado** en la pareja con NOR-10, `[f049837e]`, **cita no verificable**:
  «Un resultado positivo del control biológico MENSUAL activa de forma automática una
  auditoría extraordinaria del área».
- «Mensual» es el dato del lado CLI-12 de la **sembrada B** (semanal en NOR-10, mensual en
  CLI-12; `corpus-pruebas/SIEMBRA_corpus_ampliado.md`, contradicción B). **El juez la tiene
  delante, y la comprobación de citas la tira.**
- ⚠️ **Lo medido por Code: la cita es LITERAL en CLI-12.** Es la línea 167 del texto extraído
  con el comando del registro (`SIEMBRA_corpus_ampliado.md:124-125`), al 65,4 % del
  documento. **No es la frase sembrada** («periodicidad mensual, el primer día laborable de
  cada mes», 12.1): está unos 475 caracteres después, y repite el dato «mensual».
  - **Es el SEGUNDO caso de una cita literal descartada**, después del tramo de la D
    (entrada 3). Refuerza la tercera causa, la que ni (a) ni (b) explican.
  - Salvedad: está comprobado contra el texto del `.docx`, no contra los trozos indexados.
- **Por qué entró**: el analizado llegó a 37.271 de 55.135 caracteres (67,6 %), y la B de
  CLI-12 está al 64,5 % del texto plano (D-4, B.295).
  - ⚠️ Son dos medidas distintas (texto plano frente a renderizado), así que la comparación
    es una estimación. Aquí el margen es de tres puntos, y la conclusión aguanta.
- **Por qué aun así no sale como contradicción**: hace falta que entren LOS DOS lados. El de
  NOR-10 iba en el bloque por relevancia (2.729 caracteres), y la B está al 55,7 % de NOR-10.
  **Si el trozo de la B de NOR-10 estaba en ese bloque, no consta.** Es el análisis de D-4,
  visto en producción.
- **En la otra dirección**, NOR-10 analizado llegó al 55,6 % (37.143 de 66.801), y la B está
  al 55,7 % del texto plano.
  - **R-3 · ~~«NOR-10 quedó fuera por un pelo»~~ y ~~«el "en el filo" de D-4 era literal»~~:
    RETIRADAS** (arquitecto, 01/10). Motivo: 0,1 puntos de margen entre dos medidas
    distintas, y el error de convertir una en otra es mayor que el margen. **Lo que queda:
    no se puede decidir si entró o no.**
- **Consecuencias**:
  - para B.299, la ganancia sube por la tercera causa (cabecera);
  - para D-4, se refuerza: con presupuesto para la pareja entera, los dos lados de la B
    entrarían.

#### 5 · L-12 (01/10/2026): ¿la cita llega cortada? NO. Pero la comprobación tiene dos causas propias que tiran citas literales

❌ **PREDICCIÓN DEL ARQUITECTO, FALLADA** (01/10/2026, y él la cuenta como fallada, junto a las
otras): «la cita se trunca a unos 200 caracteres antes de compararla, y la comparación es
literal, así que no puede encontrarla nunca». **Falsa**: los cortes a 200 y a 60 son del log, y
`verifyQuote` recibe la cita entera.
- **Y la lectura valió la pena igual**: buscando una causa falsa aparecieron dos verdaderas, la
  (i) y la (ii).
- El arquitecto acepta también las dos correcciones de Code sobre las sondas: **son 8 hallazgos
  tirados, no 7**; y **«sin B.299 publicaríamos 3 de 3 y 1» es un techo, no una medida**.
- **a) Dónde se corta**: SÓLO EN EL LOG.
  - Las líneas «Contradicción descartada» y «Solapamiento descartado» imprimen la cita con
    `.slice(0, 200)` (`lib/analysis/judge.ts:472`, `:498`, `:504-507`, `:523`, `:546`,
    `:552-555`).
  - El título sale cortado a 60 en la línea «RAW» (`c.topic.slice(0, 60)`, `:944`): de ahí
    «…tras fallo de c», que son exactamente 60 caracteres.
  - **La comprobación recibe la cita ENTERA**: `verifyQuote(…, c.newDocSays)` y
    `verifyQuote(…, c.existingDocSays)` (`:477-478`), sin recorte.
  - **El modelo tampoco la corta por límite**: el juez pide 4.096 tokens de salida (`:904`).
    Que alguna respuesta llegara al límite y la reparara el cliente de JSON no consta en estos
    logs.
- **b) Cómo compara** (`findBestMatch`, `:75-131`, llamada desde `verifyQuote`, `:286-366`):
  1. la cita literal (`indexOf`);
  2. normalizada: minúsculas, espacios colapsados y sin puntuación;
  3. con 25 caracteres o más: la cabeza y la cola, hasta 20 cada una, en orden y a menos de
     tres veces su longitud;
  4. y, para citas tabulares, por segmentos dentro de una fila.
  - **Sin tope de longitud**: una cita más larga que el trozo no se recorta. Simplemente no
    cabe en ningún trozo y falla.
  - **Y se compara contra CADA TROZO POR SEPARADO** (`:329-332`). El texto completo
    (`fallbackText`) sólo se usa si el documento NO tiene trozos (`:323-327`).
- **c) Cuántos de los tirados en las sondas tienen la cita cortada a mitad de palabra: no se
  puede contar sobre lo pegado.** El literal trae TÍTULOS, no citas. El único título cortado,
  «…tras fallo de c», lo corta el log (60). La cita «…no es delegable y recae sie» no está en
  el literal de las sondas; si viene de una línea de descarte, ese corte es el de 200 del log.

**LO QUE LA LECTURA SÍ ENCONTRÓ: dos causas en el código que tiran citas LITERALES** (trazadas a
mano, no ejecutadas):
- **(i) La cita que cruza dos trozos no se puede verificar nunca.** Ni la vía literal, ni la
  normalizada, ni la de cabeza y cola miran más de un trozo a la vez. Una frase que el
  troceador partió en dos —o una cita que junta el final de un trozo con el principio del
  siguiente— muere aunque sea literal.
  - ~~**Es candidata a explicar los dos casos literales** de este archivo (entradas 3 y 4).~~
    **REFUTADO el 01/10** (entrada 10): las dos citas caben enteras en un solo trozo.
  - **Lo decide la base**: `SQL_B299_cita_por_trozo.sql`, PENDIENTE DE EJECUTAR. Dice si el
    principio y el final de cada una caen en el mismo trozo.
- **(ii) Las dos mitades se normalizan distinto.**
  - **La cita** pasa por `normalize()` (`lib/analysis/normalize-core.mjs:71-77`), que
    colapsa los espacios ANTES de quitar la puntuación.
  - **El texto del trozo** se normaliza a mano dentro de `findBestMatch` (`judge.ts:84-101`),
    que quita la puntuación ANTES de colapsar.
  - **Resultado**: «a — b» da `a  b` (dos espacios) en la cita y `a b` en el trozo, y no
    casan. Afecta a toda cita con un signo suelto entre espacios: una raya, un guion, unas
    comillas «» separadas o un paréntesis.
  - La vía de cabeza y cola lo salva sólo si el signo no cae en los 20 primeros ni en los 20
    últimos caracteres.
  - **Es un fallo determinista y se puede probar sin la base.** No explica, por sí solo, los
    dos casos literales de este archivo: ninguno de los dos tramos conocidos tiene un signo
    suelto.
- **Y la causa que deja escrita la entrada 3 ya tiene forma**: «que la comprobación no tuviera
  esos trozos en su pajar» es, en concreto, la (i).

**(d) LOS ARREGLOS PROPUESTOS, con su caso ROJO ahora y VERDE después. No se toca nada hasta que
los apruebe el arquitecto.** Y no en `judge.ts`, que va por 1.365 líneas (B.296): la propuesta
es SACAR `findBestMatch` a un fichero propio, `lib/analysis/coincidencia-de-cita.ts`, que
además adelgaza el juez.
- **Arreglo de la (ii)**: UNA sola normalización para los dos lados, la que lleva el mapa de
  posiciones. Se aplica también a la cita, y `normalize()` no se toca: la usan el retrieval, las
  reglas de hallazgos y el examen.
  - **Caso**: trozo `El plazo — de 72 horas`, cita `el plazo — de 72 horas`. La minúscula
    hace fallar la vía literal.
  - **Hoy**: `null` (ROJO). **Después**: casa (VERDE).
- **Arreglo de la (i)**: si ningún trozo casa, probar cada pareja de trozos CONSECUTIVOS del
  mismo documento, unidos con un salto. Y devolver el primero como trozo de evidencia, que es
  lo que los consumidores ya esperan.
  - La alternativa es probar el `full_text`, pero devuelve `chunk: null`, y eso pierde el
    trozo que leen el verificador y R2. Por eso se propone la pareja.
  - **Caso**: dos trozos, `…la responsabilidad recae siempre sobre` y
    `el Director Clínico del centro…`, con la cita `recae siempre sobre el Director
    Clínico`.
  - **Hoy**: `null` (ROJO). **Después**: casa, con el primer trozo (VERDE).
  - **Su control negativo**, que tiene que seguir `null`: una cita cuyas dos mitades están en
    trozos NO consecutivos.
- **Y la instrumentación, que la entrada 2 pedía**: en la línea de descarte, la LONGITUD de la
  cita y el PASO en que falló (literal, normalizada, cabeza y cola, o segmentos). Sin más
  texto del cliente del que el log ya lleva.
- ⚠️ **Al arreglarlo, la línea de base se mueve**: más citas pasan, así que habrá más hallazgos
  publicados, que es lo que se busca, y quizá algún falso nuevo. El arnés se vuelve a pasar
  después, y no en el mismo despliegue que los contadores.

#### 6 · EL ARREGLO DE LA CAUSA (ii), APROBADO E IMPLEMENTADO (01/10/2026): una sola normalización para los dos lados

**El diagnóstico de fondo**, en palabras del arquitecto: **los dos lados de una comparación que
tiene que casar se limpiaban con dos funciones distintas, y ninguna de las dos era la de la
otra.** No era un ajuste fino: era que el texto no casaba consigo mismo.
- El código viejo lo sabía y lo hizo mal. Su comentario decía «Misma clase que normalize():
  debe coincidir carácter a carácter». Copió la clase de caracteres y **no el orden de los
  pasos**.

**Lo que se hizo:**
- **`findBestMatch` sale de `judge.ts`** a `lib/analysis/coincidencia-de-cita.ts`. `judge.ts`
  baja de 1.365 a 1.319 líneas: se sacó la función y se añadieron dos líneas de log.
- **El lado del texto se normaliza con LA MISMA transformación que la cita**:
  `normalizarConPosiciones`, que es `normalize()` paso por paso y en su orden, más el mapa de
  posiciones para devolver el recorte original.
  - Para decidir qué es puntuación **le pregunta a `normalize()` carácter a carácter**: un
    criterio, una vez.
  - El bucle manual de `findBestMatch` desaparece.
- **`normalize()` NO se ha tocado.** La usan el retrieval, las reglas de hallazgos, las claves y
  el diff de tablas, y **el examen** (`lib/examen/discriminantes.mjs`, `marcador.mjs`,
  `comparador-tabular.mjs`). Cambiarla movería la línea de base del arnés. Se cambió el lado que
  no la usaba.
- **El registro**: la línea «descartada (cita no verificable…)» lleva ahora, por cada lado que
  falló, `longitud=N, paso=…, trozos=N` (o `texto_completo`).
  - El paso es el más avanzado al que llegó la cita en cualquier trozo: `vacia_o_corta`,
    `sin_coincidencia`, `sin_cabeza`, `cabeza_sin_cola` o `cola_demasiado_lejos`.
  - Sólo números y el nombre del paso: ni una palabra más del cliente que las que el log ya
    llevaba.
  - Convierte la «tercera causa» en algo contable. Sólo describe la vía contigua; la de
    segmentos de tabla tiene su propio predicado.

**Las pruebas** (`lib/analysis/coincidencia-de-cita.test.ts`, 23):
- **El caso ROJO, comprobado ROJO antes de tocar nada**: el trozo «El plazo — de 72 h desde el
  cierre…» y la cita «el plazo — de 72 h».
  - Con el código del 30/09, `verifyQuote` daba `null`: 1 de 4 pruebas en rojo.
  - Después, verde.
- **El CONTROL NEGATIVO**: «el plazo — de 96 h» sigue sin verificarse, y una cita larga
  inventada no la casa ni la cabeza y cola.
- **Lo que ya funcionaba sigue funcionando**: la cita literal, y el salto de línea frente al
  espacio.
- **`normalizarConPosiciones(s).texto === normalize(s)`** sobre 13 entradas: las de signo suelto
  entre espacios, espacios raros, extremos, la «İ» turca (cambia de longitud al bajar), la sigma
  final griega, un emoji y la cadena vacía.
- **Las posiciones** crecen, y apuntan al carácter del original.
- **Un MUTANTE**: volver a quitar la puntuación antes de colapsar pone **5 pruebas en rojo**.
  Restaurado, 23 de 23.
- **La suite entera**: 1.773 de 1.773. `tsc --noEmit`, limpio. El build local llega a
  «Collecting page data».

**LA LECCIÓN, que vale más que el arreglo** (arquitecto, 01/10): **el código viejo sabía lo que
tenía que hacer.** Su comentario decía «Misma clase que normalize(): debe coincidir carácter a
carácter», y copió la clase de caracteres pero no el orden de los pasos. **Un comentario que
declara un invariante y una implementación que lo incumple son peores que no tener comentario,
porque el comentario convence al que lee.**

**LO QUE CUESTA, MEDIDO** (pregunta de revisión del arquitecto, 01/10; vitest en la máquina de
desarrollo, mediana de 21 repeticiones; Vercel no es esta máquina):

| Medida | ms |
|---|---|
| `normalizarConPosiciones` sobre 66.801 caracteres de texto real (NOR-10 + CLI-12) | **24,7** |
| la normalización VIEJA, copiada tal cual, sobre el mismo texto | **124,0** |
| un trozo de 1.200 caracteres | **0,26** |
| una cita que falla contra los 56 trozos del documento entero | **12,8** |

- **La nueva es 5 veces más rápida que la vieja**: aquélla armaba el texto concatenando cadenas.
- 📌 **EL CASO RARO, y conviene tenerlo escrito** (arquitecto, 01/10): **la decisión limpia
  —preguntarle el criterio a `normalize()` carácter a carácter, una sola fuente de verdad—
  fue también la barata.** La próxima vez que alguien proponga duplicar lógica «por
  rendimiento», aquí hay un caso medido de lo contrario.
- **Cuántas veces se normaliza el pajar: NO se reutiliza**, y se dice.
  - Cada cita se busca trozo a trozo, y cada trozo se normaliza en cada búsqueda
    (`verifyQuote`, `judge.ts:329-332`, que llama a `findBestMatch`).
  - Una cita que casa pronto normaliza pocos trozos; una que falla los normaliza todos, y luego
    `describirDescarte` los vuelve a recorrer para el log.
  - Sin trozos, se normaliza el texto completo en cada cita.
- **Con 8 hallazgos y 2 lados, todos fallando, el peor caso es del orden de 16 × 12,8 × 2 ≈ 400
  ms**, frente a 22-24 s de análisis: **menos del 2 %. No se reutiliza el pajar normalizado**
  (decisión del arquitecto, 01/10): sería optimizar sin un problema medido.
  - Memorizarlo por lado y pareja es trivial **si algún día crece el número de hallazgos
    comprobados**. Y desde la entrada 9 el texto entregado se normaliza en cada cita igual que
    antes.


comprobación saldrán también hallazgos de parejas que nadie ha auditado. Por ejemplo,
Normas_Frecuencia_Recogidas en la sonda A, o el de CLI-12 / CLI-13 de B.304. **Se cuentan por
separado «sembradas» y «de parejas sin auditar», y no se celebra un total más alto.** Un hallazgo
de una pareja sin auditar no es acierto ni fallo hasta que alguien vaya al texto.

#### 7 · LA CAUSA (i), LA PREGUNTA DE ARQUITECTURA (01/10/2026): ¿cuál es el pajar correcto? Contestada en sólo lectura. NADA IMPLEMENTADO

El arquitecto no aprobó el arreglo por parejas de trozos sin entender antes por qué se compara
por trozos. Su propuesta es verificar la cita contra el TEXTO COMPLETO del documento. Las cuatro
preguntas:

**(a) ¿Contiene el texto completo cada trozo literalmente? A medias, y la mitad que falla
importa.**
- `full_text` son los segmentos unidos con un salto doble: `joinSegments`
  (`lib/chunking.ts:1008-1013`) más `stripSegmentationMarkers` (`:178-180`).
- **Filas de tabla**: el trozo es el texto de su segmento, así que está en `full_text` tal
  cual.
  - Pero una tabla no se verifica por contigüidad: se verifica por segmentos dentro de UNA
    fila, con sus celdas (`verifyQuote`, la segunda pasada). **Para tablas, el pajar correcto
    sigue siendo la fila.**
- **Prosa**: los trozos se cortan de un texto LIMPIADO (`buildProsePieces`):
  - `\r\n` pasa a `\n`;
  - cada tirada de espacios o tabuladores, a uno;
  - tres saltos o más, a dos.

  `full_text` conserva los espacios originales, así que no contiene cada trozo literalmente.
  Pero sí tras normalizar, que es lo que hace la comprobación.
- ⚠️ **Y una diferencia que NO es de espacios**: `subdivideSection` **repite el título de la
  sección al principio de cada subtrozo** (`chunking.ts:464-475`). Un subtrozo es «TÍTULO +
  un tramo del cuerpo» que **no es contiguo en el documento**. Consecuencia, que nadie había
  escrito: **la comprobación por trozos puede dar hoy por buena una cita que pegue el título a un
  tramo del cuerpo que en el documento no va detrás.** Es un falso POSITIVO que existe hoy; sin
  medir cuánto.

**(b) ¿La concatenación de los trozos, en orden, reproduce el documento? NO**, por tres cosas:
- el solapamiento de 200 caracteres entre los subtrozos por longitud (`CHUNK_OVERLAP`,
  `chunking.ts:27`);
- el título repetido de (a);
- y los espacios limpiados.
- **Pegar dos trozos consecutivos —el arreglo que propuso Code en la entrada 5— fabricaría
  contigüidades que no existen**: el título otra vez en medio, o el tramo solapado dos veces.
  Se podría verificar como buena una cita que no está en el documento.
- Evitarlo exigiría reconstruir el documento quitando solapamientos y títulos repetidos, que
  es frágil y duplica lo que el troceador ya sabe. **Code retira esa propuesta.**

**(c) ¿Por qué se hizo por trozos? Está escrito, y es F-27** (`lib/analysis/judge.ts:137`, en el
comentario de `verifyQuote`): «los chunks SON el haystack (F-27): es el mismo contenido que
full_text, pero ya dividido en las unidades que decidió el extractor […], así que devolver DE
QUÉ CHUNK salió la cita es gratis en vez de exigir una búsqueda aparte».
- **El motivo era la EVIDENCIA**: saber de qué trozo salió la cita, para las columnas de R2 y
  para el contexto del verificador.
- **La premisa —«es el mismo contenido que full_text»— es verdad sólo a medias**, por (a): los
  espacios y el título repetido.
- **El coste de las citas que cruzan dos trozos no está escrito en ningún sitio.** Nadie lo
  decidió: no se vio.
- Y el camino del texto completo quedó como respaldo temporal, para documentos sin trozos («lo
  retira el paso 6 entero», `judge.ts:212`).

**(d) EL ARREGLO QUE DEFIENDE CODE: EL DEL ARQUITECTO, el texto completo, con tres ajustes.** El
de las parejas queda retirado por (b).
1. **Prosa: la EXISTENCIA se verifica contra el texto completo; el trozo sólo se BUSCA
   después**, como evidencia.
   - Primero la cita en `full_text`, con `findBestMatch`, que ya usa una sola normalización.
   - Si está, se localiza el trozo donde empieza la cabeza de la cita, para la evidencia. Si no
     se encuentra, `chunk: null`, como ya hace hoy el respaldo.
   - **Así se cierran a la vez el falso NEGATIVO** (citas que cruzan trozos) **y el falso
     POSITIVO** (el título pegado de (a)).
2. **Tablas: se quedan como están**, por fila y con celdas. Para ellas el pajar correcto es la
   fila, y `full_text` no aporta nada.
3. **El texto completo tiene que ser `full_text`, el fiel**, y no el que se renderiza desde los
   trozos (`buildAnalyzedDocumentText`), que lleva los títulos repetidos.
   - **Lado analizado**: ya está en memoria (`newDocumentFallbackText`, el texto del documento).
   - **Lado candidato**: hoy sólo se carga para los candidatos SIN trozos
     (`fetchFallbackFullTexts`, `lib/analysis/pipeline.ts:53` y `:801-804`). Habría que
     ampliarlo a todos los que pasan el rerank: hasta 6 en rápido.
   - **Cuesta, como mucho, UNA consulta más por análisis**: la misma consulta, con más filas,
     y sólo cuando hoy no se haría ninguna. **Se declara.**
- **Las pruebas, cada una ROJA ahora y VERDE después:**
  1. **La cita que cruza dos trozos**: trozos «…la responsabilidad recae siempre sobre» y «el
     Director Clínico del centro…», con un `full_text` donde va seguida. La cita «recae siempre
     sobre el Director Clínico» da hoy `null`; después, se verifica.
  2. **El título pegado**: un subtrozo «TÍTULO\n\ntramo del medio», con un `full_text` donde el
     título NO va pegado a ese tramo. La cita «TÍTULO tramo del medio» se verifica hoy (falso
     positivo); después, `null`.
- **Los controles negativos**: una cita inventada sigue en `null`; y una cita de tabla sigue
  verificándose por su fila, con sus columnas.
- ⚠️ **Mueve la línea de base**: pasarán citas que hoy mueren, y morirán las del título pegado.
  Se mide una vez, con B.299 entero desplegado, y contando aparte sembradas y parejas sin
  auditar (entrada 6).
- **No se toca nada hasta que lo apruebe el arquitecto.**

#### 8 · LA CAUSA (i), SEGUNDA RONDA (01/10/2026): el pajar es LO QUE LEYÓ EL JUEZ. Contestada en sólo lectura; NADA IMPLEMENTADO

**El arquitecto retira el texto completo**, igual que Code retiró las parejas. El motivo:
verificar contra el documento entero **da por buena una cita de un tramo que el juez NUNCA VIO**.
En la sonda B, el juez recibió 2.857 de los 55.135 caracteres de CLI-12. Es la especie de falso
positivo de F-22 y F-116: un hallazgo que cita algo real y afirma algo que no se sigue.

**Su propuesta**: una cita es válida si aparece en el texto exacto que se le entregó al juez
para ese lado en esa pareja. **Code la acepta en el principio y la discute en un punto**, con lo
leído:

**(a) ¿Está disponible? SÍ, sin reconstruir nada y sin una consulta más.**
- `judgeSingleDocument` calcula los dos textos del prompt con `leerLaPareja`
  (`pareja.textoAnalizado` y `pareja.bloqueCandidato`) ANTES de llamar al modelo.
- **Y llama a la comprobación (`fixQuotesInJudgment`) DESPUÉS, en la misma función.** Basta con
  pasárselos.
- Y `leerLaPareja` ya devuelve `representados`: los `chunkIndex` del candidato que el juez
  recibió.

**(b) Con qué se pegan las piezas, y si el separador se distingue:**
- **Lado candidato** (`buildExistingFragsBlock`, `judge.ts:611-652`):
  - cada fragmento va precedido de su cabecera, `[Fragmento n de «…»]` (`describeFragment`), y
    las piezas se unen con un salto doble;
  - **la cabecera SÍ se distingue**: tiene palabras, que sobreviven a la normalización. Una
    cita que cruce dos piezas tendría que llevarlas, así que no casa por la vía literal ni por
    la normalizada;
  - ⚠️ **PERO LA VÍA DE CABEZA Y COLA SÍ PUEDE SALTARLA.** Tolera lo que haya en medio, hasta 3
    veces la longitud de la cita. La cabeza en una pieza y la cola en la siguiente pasarían.
  - **Por eso, en el candidato, el pajar tiene que ser PIEZA A PIEZA**: los trozos que el juez
    recibió (`representados`), uno por uno. No el bloque como una sola cadena.
  - Además, las **líneas de contexto** (F-44) van dentro del bloque y no son citables. Ya hay un
    motivo propio para ese descarte, y tiene que seguir.
- **Lado analizado** (`buildAnalyzedDocumentText`, `judge.ts:963-982`):
  - la prosa son los trozos unidos con un salto doble; las tablas se vuelven a pintar con
    `renderTableBlock`, en otro formato que el guardado;
  - después se corta por posición;
  - **el salto doble NO se distingue**: se normaliza a un espacio. Pero entre secciones es un
    salto que el documento también tiene, así que cruzarlo es legítimo.
  - ⚠️ **Lo que el arquitecto no podía ver: ese texto es «contiguo por posición» en lo
    RENDERIZADO, no en el documento.** Se arma desde los trozos, y los trozos llevan el
    título repetido y el solapamiento de 200 en cada costura de una sección subdividida
    (B.310).
  - Así que, con este pajar, **la causa (i) muere en las costuras ENTRE SECCIONES, pero NO en
    las costuras DENTRO de una sección larga**. Ahí, una cita fiel al documento sigue sin
    casar, porque en lo leído hay un título y un tramo repetido de por medio. Ésa la arregla el
    troceado (B.310), no el comprobador.
- **Tablas, en los dos lados: por fila**, como está.
  - El pajar de una fila es la fila.
  - Además, el texto entregado las pinta en otro formato que el guardado: el comentario de la
    prueba lo dice, «el texto ALMACENADO… lleva las etiquetas de columna, no el formato que se
    le enseña al juez», en `puntero-de-fila.test.ts`.

**(c) ⚠️ LA CONSECUENCIA INCÓMODA, ESCRITA ANTES DE MEDIR** (arquitecto, 01/10): con este pajar,
**algunas citas que HOY pasan dejarán de pasar**: las que casan con un trozo que el juez no
recibió.
- En el candidato, cualquier trozo fuera de `representados`.
- En el analizado, cualquier tramo más allá del corte.
- **Si al medir sale que publicamos MENOS en algún caso, no es una regresión: es que antes
  publicábamos lo que no debíamos.** Se mide contando aparte sembradas y parejas sin auditar
  (entrada 6).

**(d) EL ARREGLO QUE PROPONE CODE: el del arquitecto, PIEZA A PIEZA en el candidato. Y el resto
de la causa (i) se le reconoce al troceado.**
1. **Candidato**: se verifica contra los trozos que el juez recibió (`representados`), uno a uno,
   igual que hoy pero sólo con ésos.
   - Las tablas, por fila.
   - Una cita que cruce dos piezas falla, **y por el motivo correcto**: esa frase no existe.
   - Cierra el «verificado contra lo no leído», sin que la cabeza y la cola salten cabeceras.
2. **Analizado**:
   - la prosa se verifica contra el texto visible (`pareja.textoAnalizado`) como una cadena:
     ahí sí cruzar entre secciones es legítimo;
   - las tablas, por fila, sólo con las filas que quedaron dentro del corte;
   - el trozo de evidencia se localiza después; si no se encuentra, `null`, como ya hace el
     respaldo.
3. **Lo que NO arregla, y se dice**: la cita fiel que cruza una costura DENTRO de una sección
   larga, en los dos lados. Esa costura la fabrica el troceado (B.310), y su arreglo va allí.
   Es la parte de la causa (i) que no es del comprobador.
- **Las pruebas**, rojas ahora y verdes después:
  - una cita del candidato que casa con un trozo que el juez NO recibió: hoy se verifica, y
    después no;
  - una cita del analizado más allá del corte: hoy se verifica, y después no;
  - una cita del analizado que cruza dos secciones contiguas: hoy no se verifica, y después sí.
- **Los controles negativos:**
  - una cita inventada sigue sin verificarse;
  - una cita de tabla sigue verificándose por su fila;
  - una cita con la cabeza en una pieza del candidato y la cola en la siguiente NO se
    verifica: es la trampa de (b).
- **Coste**: ninguna consulta. Dos parámetros más en `fixQuotesInJudgment`, el texto visible y
  los representados.
- ✅ **APROBADA el 01/10, con el matiz de Code aceptado.** Y lo que la hace coherente, en
  palabras del arquitecto: **el arreglo separa dos preguntas que estaban mezcladas, y no
  contestábamos bien ninguna.**
  - **Pregunta A · ¿citó el juez fielmente lo que se le dio?** Su pajar es el texto entregado.
    Es la pregunta contra las invenciones, y la que contesta B.299.
  - **Pregunta B · ¿existe esa frase en el documento del cliente?** Su pajar es el documento.
    Es la pregunta de cara al usuario, y la que contesta B.310.
  - **El día que B.310 esté arreglado, A y B son la misma pregunta**, porque el texto
    entregado será fiel al documento. No son dos arreglos que compiten: son dos mitades, en
    este orden.

#### 9 · EL ARREGLO DE LA CAUSA (i), APROBADO E IMPLEMENTADO (01/10/2026): cada cita se comprueba contra lo que el juez LEYÓ de su lado

⚠️ **LO PRIMERO, ANTES DE CUALQUIER TABLA DE RESULTADOS** (escrito antes de medir, entrada 8 (c)):
con este pajar, **algunas citas que hasta hoy pasaban dejarán de pasar**: las que casaban con
un trozo que el juez no recibió, o con un tramo más allá del corte.
- **Si al medir sale que se publica MENOS en algún caso, no es una regresión**: es que antes se
  publicaba lo que no se debía.
- Se cuentan aparte sembradas y parejas sin auditar (entrada 6).

**Lo que se hizo** (`lib/analysis/coincidencia-de-cita.ts`; `judge.ts` no crece: 1.318 líneas):
- **`loEntregadoDeLaPareja`** toma lo que `leerLaPareja` ya calculó para el prompt, sin
  reconstruir nada y sin consultas:
  - el **analizado**: su texto visible (`textoAnalizado`) y las filas de tabla que quedaron
    visibles enteras;
  - el **candidato**:
    - si se entregó ENTERO, su texto y sus filas visibles. Se decide con la lectura guardada:
      régimen nuevo, sin dejar nada fuera y con todo mostrado (`candidatoEntregadoEntero`);
    - si se entregó por relevancia, **los trozos que recibió (`representados`), uno a uno**.
- **`comprobadorDeLado`** comprueba cada cita:
  - **lado contiguo**: la EXISTENCIA se decide en el texto entregado. El trozo de evidencia y
    las columnas se buscan después; si no aparecen, `chunk: null`, como el respaldo. Si no
    está, se prueba por fila, con las filas visibles;
  - **lado por piezas**: `verifyQuote` sólo con esos trozos. Una cita que cruce dos piezas
    falla, por el motivo correcto;
  - **tablas: siempre por fila.** El pajar de una fila es la fila.
- **Las filas visibles se reconocen pintándolas con la MISMA función que lee el juez**
  (`renderTableRow` con las columnas de `groupChunksByTable`, como
  `buildAnalyzedDocumentText`). Una fila partida por el corte no cuenta.
- **`verifyQuote` se recibe como parámetro, no se importa.** El juez importa el fichero nuevo,
  y al revés sería un ciclo. `verifyQuote` sigue siendo la única verificación, y la sigue
  usando también la rama atómica del pipeline (F-74), que no cambia.
- ⚠️ **A PRUEBA DE FALLO** (condición del arquitecto): si de un lado no se tiene lo entregado
  (un candidato sin trozos, o un juicio sin `representados`), **no se decide en silencio**. Se
  cae al camino de antes, todos los trozos o el texto completo.
- **Y el log dice con qué pajar se comprobó cada descarte**: `pajar=entregado_texto`,
  `entregado_piezas`, `todos_los_trozos`, `texto_completo` o `sin_pajar`, con cuántos trozos
  o filas, junto a la longitud y el paso de la (ii).

**Las pruebas** (`lib/analysis/coincidencia-de-cita.test.ts`, 36 en total):
- **Los tres casos ROJO, vistos ROJO contra el comportamiento de antes.** Se forzó el
  comprobador a ignorar lo entregado, que es exactamente la llamada de antes,
  `verifyQuote(chunks, fallback)`:
  1. una cita de un trozo del candidato que el juez NO recibió: antes se verificaba;
  2. una cita del analizado más allá del corte: antes se verificaba;
  3. una cita del analizado que cruza dos secciones contiguas: antes no se verificaba.

  Con el comportamiento de antes: **5 en rojo**, los tres y las dos del log, cuyo pajar no
  existía. Con el arreglo: **36 de 36**.
- **Los controles negativos**, verdes con el código de antes y con el de ahora:
  - una cita inventada sigue sin verificarse;
  - una cita de tabla sigue verificándose por su fila, con sus columnas;
  - la cabeza en una pieza del candidato y la cola en otra no se verifica.
- **A prueba de fallo**: sin lo entregado se verifica como antes, y el log lo dice; un
  candidato sin trozos no tiene lo entregado.
- **El fixture que estaba mal, y se dice**: la primera versión de la prueba de tablas citaba
  con las etiquetas de columna («Nombre: Luis | Clínica: Retiro»). Así se verifica, pero sin
  columnas, igual que antes del arreglo. El juez cita los VALORES como los ve («Luis |
  Retiro»), y con ellos salen las columnas. Era la prueba, no el código.
- **La suite entera**: 1.786 de 1.786. `tsc --noEmit` limpio. El build local llega a
  «Collecting page data».

⚠️ **SU GANANCIA NO CONSTA** (01/10, tras la entrada 10): los dos casos literales conocidos no
cruzan ningún límite de trozo, así que este arreglo no los recupera. Se despliega igual, por su
semántica, que evita falsos de la especie de F-22.

**LO QUE NO ARREGLA, escrito antes de medir para no creer que arreglamos más** (entrada 8): el
texto que se pinta al juez se arma pegando trozos, con el título repetido y el solapamiento de
B.310 dentro. **La causa (i) desaparece en las costuras ENTRE secciones, no DENTRO de una
sección larga.** Esa mitad es de B.310.

#### 10 · LA CONSULTA TUMBA LA CAUSA (i) PARA LOS DOS CASOS LITERALES, Y TAMBIÉN LA HIPÓTESIS DE QUE EL JUEZ CONDENSA (01/10/2026)

**El resultado** (`SQL_B299_cita_por_trozo.sql`, ejecutada por el director el 01/10; literal que
transcribe el arquitecto):

| Cita | Parte | `chunk_index` | Caracteres del trozo | Posición |
|---|---|---|---|---|
| `[75925931]` (NOR-10) | principio | 4 | 1.148 | 52 |
| `[75925931]` (NOR-10) | final | 4 | 1.148 | 179 |
| `[f049837e]` (CLI-12) | principio | 34 | 1.234 | 885 |
| `[f049837e]` (CLI-12) | final | 34 | 1.234 | 978 |

- **Las dos citas están ENTERAS dentro de un solo trozo. Ninguna cruza un límite.**
- **La causa (i) NO explica estos dos casos**, sin matices: el arreglo de la entrada 9 no los
  recupera.
- ✅ **SE CUMPLIÓ EL AVISO ESCRITO EN LA CABECERA DE LA SQL ANTES DE EJECUTARLA**: «si no
  cruzan ningún límite, hay una tercera causa, y eso es un hallazgo, no un chasco». Se escribió
  antes y acertó: es la diferencia entre medir y adivinar.

**LA HIPÓTESIS DEL ARQUITECTO, «el juez no cita literalmente: CONDENSA», MEDIDA Y FALSA.**
- **(a) Qué buscó la SQL** (sus propios patrones, `SQL_B299_cita_por_trozo.sql:51-54`):
  - para `[f049837e]`, el principio «Un resultado positivo del control biológico mensual»
    (51 caracteres) y el final «extraordinaria del área» (23);
  - para `[75925931]`, el principio «Cada clínica cuenta con un Coordinador de Calidad» (49)
    y el final «designado por él» (16).
  - **`strpos` da la posición donde EMPIEZA cada patrón** (`:58`).
- **Por eso la aritmética del arquitecto («93 de hueco», «127») medía de inicio a inicio.**
  Sumando la longitud del patrón final:
  - el tramo de CLI-12 va de 885 a 1.000: **116 caracteres**;
  - el de NOR-10, de 52 a 194: **143 caracteres**.
- **(d) La aritmética que decide**: la cita de `[f049837e]` mide **116**, la de `[75925931]`
  **143** (sin el «…» final). **Miden EXACTAMENTE lo mismo que su tramo**: no están
  condensadas.
- ❌ **PREDICCIÓN DEL ARQUITECTO, FALLADA** (él la archiva así, 02/10): midió el hueco de inicio a
  inicio. Es la tercera hipótesis suya de esta forma en un día.
- 📌 **LA NOTA DE PROTOCOLO, que es la lección y no el error** (arquitecto, 02/10): **la hipótesis
  venía con su premisa declarada y con la orden de comprobarla antes de creerla, y por eso cayó
  antes de que nadie construyera nada encima.** Tres hipótesis falladas en un día no son tres
  fallos del método: son el método funcionando. **Lo que sería un fallo es que una hubiera
  llegado a ficha como causa.**
- **(c) Reproducido fuera de producción** (`verifyQuote` contra el texto de
  `corpus-pruebas/`, con un trozo de 1.200 caracteres alrededor de cada cita; un fichero de
  prueba temporal, borrado después):
  - **`[f049837e]` VERIFICA contra CLI-12**, también escrita con «MENSUAL» en mayúsculas;
  - **`[75925931]` VERIFICA contra NOR-10**, también con el «…» final;
  - **las dos dan `null` contra el OTRO documento**: la de CLI-12 contra NOR-10, y la de NOR-10
    contra CLI-12.
- **O sea: las citas son literales y la comprobación las habría aceptado contra su documento.
  Si en producción murieron, se buscaron donde no estaban.**

**LA HIPÓTESIS QUE QUEDA, y no se escribe como causa hasta medirla: EL JUEZ PUSO CADA CITA EN EL
CAMPO DEL OTRO LADO.**
- Las dos son **solapamientos**. En el JSON de un solapamiento que el juez tiene delante, el
  campo del existente (`"evidence"`) va **primero** y el del nuevo (`"evidenceInNewDoc"`)
  **segundo** (`lib/analysis/judge.ts:851`). En las contradicciones, el del nuevo va primero.
  Y el nombre `evidence` no dice de qué lado es.
- Si el juez puso el texto del analizado en `evidence`, la comprobación lo buscó en el
  candidato, y ahí no está. Es exactamente lo que dio la reproducción.
- ✅ **RESUELTA el 02/10 sin esos logs, con ocho casos en vez de dos: B.312.** El cambiazo se da
  en 5 de 5 solapamientos de las sondas del 01/10, y en 0 de 3 contradicciones. Estos dos casos
  son solapamientos, y se comportan igual.
- Lo que la decidía, antes de B.312, era UNA palabra del log: el `lado=` de las dos líneas
  «Solapamiento descartado».
  - La línea imprime la cita del lado que FALLÓ.
  - Si dicen **`lado=existente`**, la cita impresa es el campo `evidence` y es texto del
    analizado: **el cambio de campo queda confirmado**.
  - Si dicen **`lado=nuevo`**, la cita se buscó en su documento y falló: hay otra cosa, y lo
    siguiente sería mirar con qué pajar se comprobó.
  - En el relevo de L-3 y G-2 no venía el `lado`. **Lo tiene el director en los logs.**

**(b) Las citas completas, en la base: NO se guardan.** De un descarte sólo se persiste el
número (`DiscardedFindings`, `lib/analysis/judge.ts:524-527`); la cita va únicamente al log,
cortada a 200. Para estas dos da igual: miden 116 y 143, y el log las enseñó enteras.

**LO QUE CAMBIA EN LO QUE PROMETE EL ARREGLO DE LA (i):** su semántica sigue siendo correcta
—una cita vale si está en lo que el juez pudo leer— y evita falsos de la especie de F-22, así
que **se despliega**. Pero **su ganancia esperada NO CONSTA**: los dos casos conocidos van por
otro lado.

**Y B.299 NO ESTÁ COMPLETA**: el arnés sigue aparcado hasta que la tercera causa esté entendida
y, si tiene arreglo, desplegada.

### ⚠️ B.302 — LA CASCADA DEL VERIFICADOR DESCARTA UNA CONTRADICCIÓN REAL COMO «MISMO DATO SIN OPOSICIÓN» (constancia y medida, SIN arreglo; 30/09/2026)

🎯 **LO QUE VALE ARREGLARLA, MEDIDO: la contradicción A del caso de los cargos, en la dirección
CLI-12 → NOR-10, que hoy sale 0 de 4.**

> ## ⚠️ ACTUALIZACIÓN (30/09, 13:01–13:03 UTC): EL ESCALÓN 1 LA MITIGA A LA MITAD
>
> No estaba previsto. Medidas del director en el log, transcritas por el arquitecto (L-2);
> Code no las ha visto.
>
> **LA COMPARACIÓN DE REFERENCIA** (decisión del arquitecto, 01/10): las cuatro pasadas del
> 29/09 entre las 13:14 y las 13:16, con el interruptor apagado, son **el mejor aislamiento
> disponible**. Sustituyen a la mañana del 30/09 como término de comparación.
>
> | Dirección | Apagado, 29/09 13:14–13:16 | Encendido, 30/09 13:01–13:03 |
> |---|---|---|
> | CLI-12 → NOR-10 | 1 publicada de 4 | **2 publicadas de 4** |
> | NOR-10 → CLI-12 | 0 publicadas de 3 | **1 publicada** |
>
> - ⚠️ **Los ids de tanda de CLI-12 y NOR-10 del 29/09 no constan**, así que «la misma tanda»
>   es probable y **no está medido**.
> - ⚠️ **Con la tanda fija, la mejora es MENOR** que comparando con la mañana, y ésa es la
>   cifra honesta: **no 0 → 2, sino 1 → 2.**
> - La comparación contra la mañana del 30/09 (0 de 4 → 2 de 4, y 0 de 3 → 1) queda como
>   antecedente: cambiaban a la vez el interruptor y el número de acompañantes.
>
> - **CLI-12 → NOR-10, 13:01:56**, `corte_honesto`: analizado 37271/55135 y candidato
>   2729/66801. Cuatro contradicciones emitidas; el verificador, 5 hallazgos → 3
>   confirmados y 2 descartados:
>   - `[9b37aa92]` «Responsable último de la esterilización» → **CONFIRMADA**;
>   - `[603d2891]` «Autorización de excepciones al protocolo» → cascada,
>     `mismo_dato_sin_oposicion`;
>   - `[6c9c0b21]` «Firma de registros de auditoría trimestral» → **CONFIRMADA**;
>   - `[84d1d44e]` «Decisión de retirada de autoclave» → cascada,
>     `mismo_dato_sin_oposicion`.
> - **NOR-10 → CLI-12, 13:03:18**, `corte_honesto`: analizado 37143/66801 y candidato
>   2857/55135. Una contradicción: `[4f6157d8]` «Autoridad para retirar autoclave de
>   servicio tras fallo de c…» → **CONFIRMADA**.
> - **La cascada, a las 13:01:56, mató 2 de 4.** Con la columna del 29/09, la ganancia
>   pendiente de B.302 se recalcula: **en CLI-12 → NOR-10 se publicaron 2 de 4, y quedan 2
>   por recuperar**; la mejora atribuible al escalón 1 es de **1 a 2**.
>   - ~~«ya no son 4 contradicciones, son 2», contra la mañana~~: sustituida por la columna
>     del 29/09 (arquitecto, 01/10).
>   - ⚠️ **Las dos columnas no cuentan lo mismo**: la de la mañana son 4 PASADAS con una
>     contradicción cada una; la de las 13:01 es UNA pasada con cuatro contradicciones
>     distintas, cuatro caras de la A (`SIEMBRA_corpus_ampliado.md:58-61`). Es una pasada,
>     no una tasa.
> - **La comprobación de citas pasa de matar 3 de 3 a dejar pasar 1** (NOR-10 → CLI-12).
> - **El mecanismo, en el log**: el analizado pasó de 6.000 a 37.143 y 37.271.
> - ⚠️ **ATRIBUCIÓN NO AISLADA, y se dice.** Entre las dos tandas cambiaron DOS cosas: el
>   interruptor y el número de acompañantes. El mecanismo apunta al interruptor sin
>   ambigüedad, porque la cifra de caracteres leídos está en el log. El experimento limpio
>   sería repetir la misma configuración de 3 acompañantes con el interruptor apagado.
>   **NO SE REPITE** (decisión del arquitecto, 01/10): cuesta apagar, cuatro análisis y
>   volver a encender, y el mecanismo ya está en el log, con los caracteres leídos. La
>   referencia pasa a ser el 29/09 (tabla de arriba).
>   - 🔎 **Nota de Code: esa configuración puede estar YA medida, una pasada, y archivada.**
>     Son los cuatro análisis del **29/09, 13:14–13:16** (B.299, entrada 1), con el
>     interruptor APAGADO (no se encendió hasta el 30/09 a las 07:50).
>     - Son cuatro análisis seguidos en dos minutos, que es como la bandeja recorre una
>       tanda (`hooks/review/useReviewAnalysis.ts:121-126`). NOR-11 llevaba `3 ids de
>       tanda` a las 13:15 (B.295). **Los ids de tanda de CLI-12 y NOR-10 ese día no
>       constan.**
>     - Lo que dieron: CLI-12 → NOR-10, **4 emitidas y 1 publicada** (`[9b37aa92]`); NOR-10
>       → CLI-12, **3 emitidas y 0 publicadas**.
>     - Si era la misma selección, el aislamiento queda **apagado 1 de 4 → encendido 2 de
>       4**, y **0 de 3 → 1 de 1**: la mejora se mantiene con la tanda fija, aunque en
>       CLI-12 → NOR-10 es menor que contra la mañana. **Aceptada como referencia el 01/10.**

- **Lo medido**: 4 de 4 pasadas del 30/09, a las 06:36:58, 06:37:58, 06:38:53 y 06:40:26
  UTC, en la dirección CLI-12 → NOR-10. La cascada del verificador descarta como
  `mismo_dato_sin_oposicion` la contradicción sobre la **responsabilidad última de la
  esterilización**. Recuento del arquitecto sobre logs del director; Code no los ha visto.
  El detalle pasada a pasada está en B.299, entrada 3.
- **Por qué es un descarte demostrablemente equivocado, y no una sospecha**:
  - es la **sembrada A** (`corpus-pruebas/SIEMBRA_corpus_ampliado.md:51-62`);
  - la siembra la declara contradicción real: NOR-10 dice «el Director Clínico» y CLI-12 dice
    «el Coordinador de Calidad», y añade «no el Director Clínico» (`:56`). **Hay oposición,
    y expresa**;
  - reproducible 4 de 4.
- **Y ya había pasado el 29/09**: `[603d2891]` «Autorización de excepciones al protocolo»
  murió igual. La siembra cuenta la autorización de excepciones como una de las caras de la
  A (`:58-61`). Aquello se archivó como SOSPECHA en B.299; es el mismo fallo.
- **Estación**: la cascada del VERIFICADOR, después de que la cita pasara la comprobación.
  **No es B.299**, que es la comprobación de citas del JUEZ, antes de la cascada. Son dos
  arreglos distintos, y el 29/09 el arquitecto las mezcló en una sola cifra (el «71 % del
  verificador» retirado en B.299).
- **Lo que no se sabe, y es la primera pregunta del arreglo**: por qué la cascada ve «el
  mismo dato sin oposición» donde hay dos figuras distintas. No se investiga aquí.
- **SIN ARREGLO.** Constancia y medida.

### ⚠️ B.300 — LA TANDA DESPLAZA: seleccionar más documentos en la bandeja hace que el análisis vea MENOS del corpus — MEDIDO con experimento controlado (producto y constancia, SIN arreglo; 30/09/2026)

**Seleccionar más documentos en la bandeja hace que el análisis vea MENOS del corpus, y
el usuario no tiene forma de saberlo.**

**EL REENCUADRE DEL DIRECTOR (30/09), PARTIDO EN DOS POR FABLE** (F-119; B.303).
- ✅ **Lo que SIGUE EN PIE: el pipeline mide en la moneda antigua en el rerank y en el corte
  previo.** El trozo dejó de ser el material y pasó a ser un puntero, y esas dos etapas siguen
  decidiendo como si el juez leyera párrafos.
  - La prueba está en una misma fila de la base: `retrieval_candidato_mostrados = 2813`
    frente a `juez_candidato_mostrados = 14704` (B.295). **Esos 2.813 los selecciona el
    retrieval, y el juez no los usa cuando la pareja va entera.**
  - El caso más claro es la ventana de 3.000 caracteres del analizado que ve el rerank, por
    posición (`lib/analysis/rerank.ts:73`): **es la tijera del escalón 0, viva una etapa
    antes.**
- ~~Lo que NO sigue en pie: que el escalón 1 dejara desalineadas las plazas compartidas.~~
  **Mitad RETIRADA**: Fable lo corrige y el arquitecto lo acepta. **Las 25 plazas compartidas
  eran un fallo también en el diseño viejo; el escalón 1 sólo las hizo visibles** (B.303,
  punto 2a).

**LOS DOS PROBLEMAS, separados porque tienen alcance distinto:**
1. **La moneda antigua.** Afecta a TODAS las rutas, también sin tanda, y **llega a la
   SELECCIÓN de documentos**: el corte previo ordena por el mejor párrafo
   (`corte-de-recuperacion.ts:42`), y el rerank decide con fragmentos de 300 caracteres
   (`rerank.ts:54`). Hoy no se nota, porque los 14 del corpus salen `sin_fuente_comun`; **en
   cuanto se reindexe (B.190), ocurre en todos los análisis.** Que esté eligiendo mal es una
   hipótesis del arquitecto, **sin medir**.
2. **Las plazas compartidas** (esta ficha). **Sólo muerden con tanda.**

**LA PRIORIDAD, del director (30/09)**: analizar varios a la vez es una opción real del
usuario, pero poco común: lo normal es subirlos de uno en uno. **Por eso esta ficha va detrás
de reindexar el corpus**, en el puesto 4 del tablero (B.295), detrás de B.190, B.299 y B.302.
**Pero se arregla**, porque es un caso en el que el usuario hace algo que parece más listo y
obtiene menos, sin aviso.

**Lo CONFIRMADO en el código**: la tanda cambia el alcance de los candidatos.
- Al analizar desde la bandeja, cada documento manda como `ids de tanda` a **los demás
  seleccionados** (`hooks/review/useReviewAnalysis.ts:126`). El log los cuenta en
  `app/api/analyze-v2/route.ts:598`.
- **Sin tanda**, el filtro de Pinecone es el corpus por defecto:
  `analysisStatus = 'analizado'` (`lib/pinecone/vectors.ts:99`).
- **Con tanda**, el filtro es ese corpus **o** los ids de la tanda, aunque estén `pendiente`
  (`vectors.ts:110-120`, elegido en `lib/analysis/retrieval.ts:238`).
- Analizar desde la bandeja **no cambia `analysis_status`** (`analyze-v2` sólo escribe
  `analyzed_content_hash`, `route.ts:711`). Por eso dos `pendiente` sólo se ven si se
  seleccionan juntos. El arquitecto lo confirma con un log de `0 ids de tanda` en el que
  CLI-13 no es candidato de NOR-11 (B.295, F-1).

**Lo OBSERVADO, tres veces en la misma dirección** (del arquitecto, sobre logs que Code no ha
visto; NOR-11 analizado):

| Cuándo | Acompañantes (`ids de tanda`) | «Retrieval: N candidatos» |
|---|---|---|
| 29/09 13:15 | 3 | 4 |
| 30/09 06:28 | 1 | 11 |
| 29/09 10:51 | 0 | 14 |

**Más acompañantes, menos candidatos**, aunque el filtro con tanda es un SUPERCONJUNTO del de
sin tanda.

**EL MECANISMO** (era hipótesis con tres observaciones; el experimento de abajo lo respalda):
- Cada consulta de muestra pide a Pinecone **25 resultados crudos**
  (`TOP_K_POR_CONSULTA`, `retrieval.ts:142`; la consulta en `:332`), sobre TODO el filtro.
- Un acompañante muy afín con muchos trozos puede llenar las 25 plazas de cada consulta y
  dejar fuera a los `analizado`. Ejemplo: NOR-10, con 56 fragmentos a 0,938 el 29/09 a las
  13:15.
- ⚠️ **Por qué era sólo hipótesis**: las tres observaciones se diferencian en más cosas que
  el número de acompañantes. Son otro día u otra hora, otros acompañantes, y en medio hay un
  reindexado de CLI-13 (10:53 del 29/09). **No es un experimento controlado.**
- **SU CASO DECISIVO**: el mismo documento, el mismo día y sin tocar el corpus, lanzado con
  0, 1 y 3 acompañantes seguidos, contando candidatos. Cuesta tres análisis, y los lanza el
  director; Code no lanza nada.
  - **La forma encargada por el arquitecto al director (30/09, escrita antes de los logs)**:
    tres análisis de NOR-11, el primero solo, el segundo con CLI-13 y el tercero con
    CLI-13 + NOR-10 + CLI-12.

**✅ EL EXPERIMENTO, HECHO (30/09, 12:19–12:29 UTC). B.300 pasa de hipótesis a MEDIDA.** Los
logs los transcribe el arquitecto; la columna `recuperados_retrieval` de
`SQL_Escalon1_pareja_NOR11_CLI13.sql` confirma los dos de CLI-13 desde la base (14 y 6).

| Documento analizado | Acompañante | Fragmentos del acompañante | Candidatos |
|---|---|---|---|
| CLI-13 (12:19:56) | ninguno | — | **14** |
| CLI-13 (12:29:25) | NOR-10 | **55** | **6** |
| NOR-10 (12:20:44) | ninguno | — | **14** |
| NOR-10 (12:29:42) | CLI-13 | **11** | **12** |

- **Añadir UN acompañante quitó 8 candidatos en un caso y 2 en el otro.** El filtro con tanda
  es un superconjunto del filtro sin tanda: debería dar más candidatos, y da menos. **El
  desplazamiento es real.**
- **Lo medido, y nada más**: con 0 acompañantes, 14 candidatos en las dos direcciones. Con 1
  acompañante, 6 (acompañante de 55 fragmentos) y 12 (acompañante de 11 fragmentos).
  - Eso demuestra que el desplazamiento EXISTE y que su magnitud **no es la misma con
    acompañantes distintos**.
  - **Cómo escala NO se sabe: son dos puntos.**
  - Es compatible con el mecanismo de las 25 plazas por consulta (`TOP_K_POR_CONSULTA`),
    que no queda medido.
  - ~~«La magnitud escala con el tamaño del acompañante»~~: frase del arquitecto, retirada
    por él mismo el 30/09. De dos puntos no sale una escala.
- ⚠️ **Lo hecho no es exactamente lo encargado**, y se dice: se hizo con CLI-13 y NOR-10, en
  dos direcciones, con 0 y 1 acompañantes. **El experimento controlado compara 0 con 1, no 1
  con 3.** *(La pata de 3 se hizo después, a las 13:01–13:03: justo abajo.)*
- ✅ **LA PATA DE 3 ACOMPAÑANTES, HECHA (30/09, 13:01–13:03 UTC).** Deja de estar pendiente.
  Era la que importa para el usuario, porque en la bandeja se seleccionan de verdad tres o
  cuatro documentos.
  - **De dónde sale**: medidas del director en el log, transcritas por el arquitecto (L-1,
    30/09); Code no las ha visto. Está escrito antes («Si baja de 11…»), y se lee contra
    ello.

| Documento analizado | 0 acompañantes | 1 acompañante | 3 acompañantes |
|---|---|---|---|
| **NOR-11** — ⚠️ cruza dos días | 14 (**29/09**, 10:51) | 11 (30/09, 06:28) | **4** (30/09, log 13:03:27, guardado 13:03:52) |
| **NOR-10** — ✅ la serie del mismo día | 14 (30/09, 12:20:44) | 12 (30/09, 12:29:42; con CLI-13) | **3** (30/09, log 13:02:59, guardado 13:03:22) |
| **CLI-13** | 14 (30/09, 12:19:56) | 6 (30/09, 12:29:25; con NOR-10) | **6** (30/09, guardado 13:02:49) |
| **CLI-12** | — | — | **8** (30/09, guardado 13:02:06) |

  - **Serie monótona y decreciente en el mismo documento: 14 → 11 → 4 en NOR-11.** Ahora sí
    se puede decir que el desplazamiento **crece con el NÚMERO de documentos seleccionados**,
    no sólo que existe. Con el TAMAÑO del acompañante sigue habiendo dos puntos: la frase
    retirada sigue retirada.
  - **Coincide exactamente con la observación suelta del 29/09 a las 13:15**, que dio 4 con
    la misma tanda de 3. Dos medidas independientes, el mismo número.
  - **R-2 · ~~«tres puntos sobre el MISMO documento, el mismo día»~~ para NOR-11: RETIRADA**
    (arquitecto, 30/09). Su punto de 0 acompañantes es del **29/09 a las 10:51**; a las 12:20
    del 30/09, los de 0 acompañantes fueron CLI-13 y NOR-10. **La serie del mismo día es la
    de NOR-10: 14 → 12 → 3.**
  - **R-1 · ~~«NOR-11 pierde 10 de los 14 del corpus»~~ y ~~«ve el 29 % del corpus»~~:
    RETIRADAS, del arquitecto** (30/09). Motivo: la cuenta de candidatos incluye a los
    acompañantes, así que restar no da documentos del corpus. Lo que queda en su lugar, y es
    lo único medido:
    - la única pasada con 3 acompañantes cuya composición consta es la del **29/09 a las
      13:15** (encargo E-2 del arquitecto): **4 candidatos = los 3 acompañantes (NOR-10,
      CLI-12, CLI-13) + 1 documento del corpus** (Clientes_Residuos_Sanitarios). **De los
      14, uno**;
    - ~~la composición de las pasadas del 30/09 a las 13:02:59 (NOR-10) y a las 13:03:27
      (NOR-11) **no consta**~~ → **CERRADA el 01/10, y en la dirección mala** (abajo).

- ✅ **R-1 SE CIERRA: LA COMPOSICIÓN DE LA TANDA DE 3, DESDE LA BASE** (01/10).
  `SQL_B300_composicion_tanda_3.sql`, ejecutada por el director; resultado transcrito por el
  arquitecto. Son las cuatro pasadas del 30/09, en modo `quick`, una por documento en la
  ventana.

  | Analizado | Guardado (UTC) | Recuperados | Al juez | Del corpus, entre los juzgados |
  |---|---|---|---|---|
  | CLI-12 | 13:02:06 | 8 | 4 | 1 (Protocolo_Visitas_Centros.docx) |
  | CLI-13 | 13:02:49 | 6 | 2 | 1 (Normas_Frecuencia_Recogidas.docx) |
  | NOR-10 | 13:03:22 | 3 | 2 | **0** |
  | NOR-11 | 13:03:52 | 4 | 3 | **0** |

  - **En NOR-10 y NOR-11, el juez no vio NINGÚN documento del corpus**: sólo compañeros de
    tanda.
  - ⚠️ **Lo que la tabla NO dice**: qué eran los recuperados que el rerank tiró (1 en NOR-10,
    1 en NOR-11, 4 en CLI-12, 4 en CLI-13). La base sólo guarda su número (L-9). Si alguno
    era del corpus, el retrieval lo vio y el juez no. **Lo que se afirma es lo que llegó al
    JUEZ, no lo que recuperó la búsqueda.**
  - **Las dos estaciones concuerdan aquí**: `recuperados_segun_termometro` = `recuperados`
    (`coberturaDeCandidatos.afines`) en las cuatro. No siempre tienen por qué coincidir: una
    es el termómetro y la otra la cobertura, calculadas en sitios distintos.
  - **Las horas, cuadradas: son LAS MISMAS pasadas que las de los logs, guardadas unos 23-25
    segundos después.**
    - NOR-10: log 13:02:59, guardado 13:03:22. NOR-11: log 13:03:27, guardado 13:03:52.
    - Lo prueba la consulta: lista TODOS los análisis de la ventana (13:00–13:06), y sale **uno
      por documento**. Una pasada que arrancó a las 13:02:59 se guardó dentro de la ventana,
      así que es esa fila.
    - Los recuentos coinciden (3 y 4; 8 y 6 en CLI-12 y CLI-13).
    - La diferencia es la duración del análisis, que con el interruptor encendido es de unos
      20-24 s (B.295, P-4).
    - En la tabla de arriba van las dos horas, para que nadie las cuente dos veces.
  - **L-9, su expectativa no se cumplió, y se cuenta**: Code escribió que la composición
    saldría entera si el rerank se quedaba con todos los recuperados, y que «con 4 y 3, por
    debajo del tope de 6, es posible». **Salió PARCIAL en las cuatro**: el rerank tiró
    documentos en todas, con sitio libre (B.306).

> **EL TITULAR DEL PRODUCTO, reescrito al cerrar R-1** (arquitecto, 01/10): **un análisis con
> tres documentos seleccionados puede no enseñarle al juez ni un documento del corpus.**
> ~~«vio 1 de los 14 documentos del corpus»~~: era la pasada del 29/09 a las 13:15, y queda
> como antecedente, no como titular.

- **L-9 · ¿QUEDA LA COMPOSICIÓN EN LA BASE?** (lectura de Code, 01/10). **A medias.**
  - **Con ids, sólo los candidatos que LLEGARON AL JUEZ** (en rápido, hasta 6). Están en tres
    sitios de `analysis_results.analysis`:
    - `judgments[]`, con `documentId` y `documentName` (`lib/analysis/types.ts:66-68`);
    - `lecturaDeLasParejas[]`;
    - `presupuestoDelCandidato.candidatos[]`, filtrado a los que pasaron el rerank
      (`lib/analysis/pipeline.ts:1101-1107`).
  - **De los recuperados que el rerank tiró, sólo el NÚMERO**:
    - `coberturaDeCandidatos.afines`, que son los candidatos del log «Retrieval: N
      candidatos» (`pipeline.ts:1055`);
    - frente a `comparados`;
    - y `termometro.documentos_candidatos`.

    Sus ids no se guardan.
  - **Los ids de tanda, en rápido, no se guardan en ningún sitio.** Sólo los guarda el
    exhaustivo, en `analysis_jobs.batch_document_ids` (`app/api/analyze-v2/route.ts:552`).
    Quiénes eran los acompañantes se sabe por el arquitecto, no por la base.
  - **Por tanto, la composición se recupera ENTERA si y sólo si el rerank se quedó con todos
    los recuperados** (`comparados = afines`). Con 4 y 3 recuperados, por debajo del tope de
    6, es posible. Si el rerank tiró alguno por criterio, de ése sólo consta que existió.

**LO QUE ESTO HACE AL PRODUCTO, y por qué es de producto y no sólo de medida:**
- el usuario que selecciona varios documentos «para compararlos entre sí» cree que ve MÁS, y
  puede estar viendo menos del corpus;
- **nada en la pantalla lo dice.** Tampoco hay contador de «candidatos del corpus desplazados
  por la tanda»: el tope que cuenta lo que deja fuera es el de 25 candidatos
  (`seleccion.candidatos_cortados_por_tope_de_recuperacion`, `retrieval.ts:144-150`), **no**
  éste, que ocurre antes, por consulta, dentro de Pinecone. Es un límite sin contador.
- **Sin arreglo, pero ya es un fallo de producto documentado y medido.**

**Y LO QUE HACE A LA MEDIDA**: por esto la regla de B.295 exige exactamente un acompañante
(`1 ids de tanda`). Con más, los candidatos dependen de quién más vaya seleccionado.

**➕ SEGUNDA MEDICIÓN INDEPENDIENTE DEL MISMO MECANISMO, DESDE EL OTRO LADO (06/10/2026).**
En las dos pasadas de NOR-11 de las 10:29:22 y 10:31:06 UTC (análisis rápido, sin tanda), la
recuperación trajo 73 fragmentos únicos y **CLI-12 se llevó 47, el 64 %**, por ser el documento
más largo. Los sumandos: CLI-12 47 + CLI-13 11 + OPE-13 4 + OPE-10 4 + RRHH-08 3 + OPE-11 2 +
Clientes_Residuos_Sanitarios 1 + Normas_Frecuencia_Recogidas 1 = 73. Cifras del arquitecto sobre
los logs del director; Code no los ha visto. **Refuerza esta ficha**: un documento con muchos
trozos afines ocupa la mayor parte de las 25 plazas de cada consulta (`TOP_K_POR_CONSULTA`,
`retrieval.ts:142`), con tanda o sin ella.

**➕ LA ACOTACIÓN DEL MISMO DÍA, y va separada porque dice otra cosa (06/10/2026).** En modo de
UN SOLO documento y con el corpus de hoy, **no se perdió ningún documento real**: los seis
documentos del corpus con trozos (CLI-12, CLI-13, OPE-10, OPE-11, OPE-13 y RRHH-08) llegaron
todos a candidato, y los 8 candidatos fueron esos 6 + Clientes_Residuos_Sanitarios +
Normas_Frecuencia_Recogidas (6 + 2 = 8; denominador 20 = 6 con trozos + 14 sin trozos,
SQL_B345). **Esta ficha sigue rota para el flujo de VARIOS documentos a la vez, que es donde se
midió**: la acotación no la cierra, la delimita.

### ⚠️ B.301 — EL INVARIANTE F-96 SIN COMPROBAR: toda la definición del corpus se apoya en que la metadata del vector y la columna coincidan (constancia y plan, SIN construir; 30/09/2026)

**Por qué sube de importancia** (arquitecto, 30/09). El retrieval NO lee `documents`: decide el
corpus con la **metadata del vector**, `analysisStatus = 'analizado'` (`lib/pinecone/vectors.ts:99`).
La columna `analysis_status` es lo que enseñan las pantallas, la bandeja y todas las SQL de esta
casa, incluida la «pareja mayor posible» de B.273 y el censo de B.295.
- **Si las dos no coinciden, las SQL cuentan un corpus y el producto usa otro**, y ninguna de
  las dos se entera.
- El comentario de `CORPUS_ACTIVO` dice «toda transición de estado mantiene la metadata al
  día… verificado» (`vectors.ts:93-98`). Lo verificado son los CAMINOS del código. **Los DATOS
  de esta organización no los ha comprobado nadie.**
- Y los datos tienen historia de antes de esos caminos: los 14 del corpus tienen vectores de
  antes de F-20 (B.295).

**Las dos direcciones del desacuerdo no pesan igual** (el patrón efecto-espejo de F-96):
- **metadata `analizado` y columna no**: el producto compara contra un documento que la
  pantalla dice que no está en el corpus. **Es la grave.**
- **columna `analizado` y metadata no**: la pantalla promete un documento que el análisis no
  ve. Es un espejo atrasado.
- **un vector sin fila**: el huérfano. El chat lo reconstruye y lo cita (F-107 P2).

**Lo que ya hay, y por qué no basta:**
- `GET /api/admin/diagnose-vectors?names=…` compara las dos cosas, pero **por nombres**, y
  CONSTRUYE los ids desde `chunk_count` y `active_generation`
  (`app/api/admin/diagnose-vectors/route.ts:54`). No ve los vectores de otra generación ni los
  de un documento sin fila: es la inversión que criticó F-114.
- `GET /api/admin/vectores-de-un-documento?documentId=…` pregunta a Pinecone de verdad, lista
  por prefijo y lee `analysisStatus` de cada vector (`route.ts:92-113`). Pero va **un
  documento por llamada**, y no ve vectores cuyo `documentId` no tenga fila.
- `GET /api/admin/cleanup-orphans?dryRun=true` sí recorre el namespace con metadata (una
  consulta ficticia con `topK: 10000`, `route.ts:38-40`) y encuentra los vectores sin fila.
  **Pero no compara `analysisStatus` con la columna.**

**Qué haría falta para comprobarlo entero** (SIN construir):
1. Recorrer TODOS los vectores del namespace con su metadata, como ya hace `cleanup-orphans`.
2. Para cada uno, comparar su `analysisStatus` con el `analysis_status` de su fila, y su
   generación (leída del id, no construida: `vectores-de-un-documento/route.ts:45`) con `active_generation`.
3. Contar las tres clases de arriba, por separado y con sus ids.
4. **EL DENOMINADOR, o el cero no vale**: comparar los vectores recorridos con los que
   declara el namespace (`contarVectoresDelNamespace`, `vectors.ts:287`). Si el namespace
   pasa de 10.000, el recorrido de `cleanup-orphans` se queda corto **sin avisar**, y un
   «cero discrepancias» sería una pantalla apagada.

**Lo que costaría** (estimado, no medido):
- **créditos: cero**, porque no llama a ningún modelo;
- Pinecone: un recorrido del namespace y lecturas por lotes, del orden de segundos con este
  corpus;
- construirlo: una ruta de administración de sólo lectura que reúne piezas existentes (el
  recorrido de `cleanup-orphans`, el parseo de ids de `vectores-de-un-documento`, el conteo
  del namespace), más su prueba con los tres casos.

**Lo que se puede hacer HOY sin construir nada**, y lo que se queda fuera. Son dos pasos del
director:
- `cleanup-orphans` con `dryRun=true`: los huérfanos;
- `vectores-de-un-documento` para cada documento de la organización: 50 llamadas, a mano.

Cubre las tres clases salvo un caso: el de un vector sin fila que además lleve metadata
`analizado`. Ése lo ve `cleanup-orphans` como huérfano, sin decir su estado.

**No se construye ahora.** Constancia y plan, a petición del arquitecto.

**➕ QUÉ SE VERIFICÓ, Y CÓMO (precisión pedida por el arquitecto, 06/10/2026).** El
«verificado» del comentario de `CORPUS_ACTIVO` (`lib/pinecone/vectors.ts:93-98`) entró el
03/08/2026 en `841325b5`, en la reversión de C.4a (F-1). Fue **una LECTURA DEL CÓDIGO, no una
medición en producción**. Lo dice la bitácora de aquella sesión: se comprobó que los caminos
que cambian `analysis_status` mantienen la metadata de Pinecone al día —mark-analyzed,
sync/C.3, ingest e index-text—, «**Verificado en código** antes de escribir la reversión»
(`Bitacora_Sesiones.txt:3384-3389`).
- No consta ninguna medición de que los DATOS no divergen, ni entonces ni después.
- La lectura cubre los cuatro caminos que existían el 03/08. **Los caminos que cambian el
  estado escritos después no los cubre aquella verificación**, y no se han enumerado aquí.
  No se afirma que estén mal: se afirma que no entran en ese «verificado».

**➕ EL DATO PARA MEDIRLO YA SE GUARDA, y se puede leer sin tocar producto (06/10/2026).** El
termómetro de cada análisis tiene `candidatos_fuera_del_fondo`
(`lib/analysis/termometro.ts:138-148`): los documentos candidatos —que vienen del ÍNDICE, es
decir, de la metadata del vector— que no están en el fondo contado en la BASE
(`contarElFondo`, `termometro.ts:302`, que lee `documents.analysis_status`). Va dentro del
jsonb `analysis` de `analysis_results` (`app/api/analyze-v2/route.ts:852-856`), así que una
SQL de sólo lectura lo saca de los análisis ya guardados.
- **Lo que ve**: la dirección GRAVE de las de arriba (metadata `analizado`, columna no), y
  sólo para los documentos que llegaron a candidato en ese análisis.
- **Lo que no ve**: la dirección del espejo atrasado (columna `analizado`, metadata no),
  porque esos documentos nunca llegan a candidato; y nada cuando el fondo no se pudo contar
  (el campo sale vacío y `fondo_motivo` dice por qué).
- **Sin control positivo todavía**: no consta en el repositorio ninguna lectura en la que
  este campo haya salido no vacío. El caso que lo motivó, CLI-05, se encontró a mano antes
  de que el campo existiera (`termometro.ts:142-143`). Un vacío, hoy, es un cero sin
  verificar, no una confirmación.

### 📋 B.303 — LLEGÓ EL DICTAMEN F-119: el retrieval y el rerank eligen párrafos, y el juez lee documentos enteros (constancia, NADA INICIADO; 30/09/2026)

1. **Llegó el dictamen F-119, y está archivado**
   (`claude/consultas-fable/F-119_2026-09-30_moneda-antigua-del-retrieval.md`). **Nada
   iniciado.**
2. **El encuadre del director queda confirmado en lo esencial**, con dos correcciones de
   Fable:
   - **(a)** las 25 plazas compartidas **NO son moneda antigua**. Eran un fallo también en el
     diseño viejo, y el escalón 1 sólo las hizo visibles. Esto matiza el encuadre de B.300:
     **el desplazamiento no lo causó el escalón 1.**
   - **(b)** el máximo por documento **no es una agregación equivocada: es incompleta.** El
     juez lee entero para encontrar el párrafo compartido esté donde esté, no porque el
     candidato deba ser relevante de principio a fin.
3. **El diagnóstico exacto que Fable señala como lo primero**: en la cadena de diez topes hay
   cuatro sin contador (2, 4, 7 y 9). **Un tope sin contador es una decisión que nadie puede
   auditar.**
   - ⚠️ **Precisión de Code sobre el 9**, con la lectura ya cerrada: del rerank al juez pasan
     TODOS los seleccionados (`lib/analysis/pipeline.ts:851`, `candidates: reranked`). **El 9
     no deja nada fuera, así que no tiene nada que contar.** Los ciegos que sí dejan cosas
     fuera son el 2, el 4 y el 7.
4. **El bloque de ~3.000 caracteres no se retira: cambia de oficio.** Pasa de «lo que lee el
   juez» a «el registro de por qué este documento fue elegido», y debe construirse una vez y
   leerse cinco veces.
5. **El tablero de decisión de B.295 NO cambia**: sigue **B.190 · reindexar el corpus** en el
   puesto 1.
6. **➕ CONSTANCIA DEL 06/10/2026, sin decidir nada.** La premisa de F-119 —que la recuperación
   pierde candidatos verdaderos— **NO se cumple en el corpus actual en modo de un solo
   documento**: en las pasadas de NOR-11 de ese día, los seis documentos del corpus con trozos
   llegaron todos a candidato (B.300, acotación del 06/10). Por eso tenerla archivada no ha
   costado hallazgos AQUÍ.
   - **Sigue vigente** para el flujo de varios documentos a la vez (B.300, donde el
     desplazamiento está medido) y para un corpus real, con más documentos con trozos que
     plazas.
   - **La decisión de retomarla es del director.**

### 📋 B.304 — UN HALLAZGO PUBLICADO EN UNA PAREJA QUE NADIE HA AUDITADO: CLI-12 / CLI-13 (naturaleza NO DETERMINADA; 30/09/2026)

- **Lo que hay**: el 30/09 a las 13:01:52 UTC, en CLI-12 → CLI-13, `[3a780a69]`
  «Responsabilidad de la gestión de residuos y punto de contact…», **confirmado y
  publicado**. Log del director, transcrito por el arquitecto (L-4); Code no lo ha visto.
- **La pareja CLI-12 / CLI-13 no está en ningún registro de siembra.** Los auditados son
  NOR-11 / CLI-13 (`corpus-pruebas/SIEMBRA_caso_control.md`) y NOR-10 / CLI-12
  (`SIEMBRA_corpus_ampliado.md`).
- **Así que no se declara ni trampa ni falso positivo: naturaleza NO DETERMINADA.** Es la
  regla del propio registro: un hallazgo fuera de lo sembrado no se da por falso sin ir al
  texto (`SIEMBRA_corpus_ampliado.md:48-49`).
- **Quién puede cerrarlo**: el director, abriendo los dos documentos. Se lo ha pedido el
  arquitecto, para cuando tenga un rato.

### ⚠️ B.305 — EL TOPE DE 120 MUESTRAS DEJA TROZOS DEL ANALIZADO POR LOS QUE NO SE PREGUNTA (latente, SIN arreglo; 30/09/2026)

⚠️ **EL MARGEN ES DE SEIS TROZOS**: el mayor documento conocido tiene 114, frente al tope de
120. **Cualquier documento más largo que los de hoy, o un troceado más fino, enciende B.305
sin que nada avise.** ~~Y los 114 salen de un comentario del código, no de una medida de la
base.~~ **MEDIDO EN LA BASE el 01/10/2026**: OPE-06 tiene **114 trozos**
(`SQL_Corpus_Con_Trozos_Por_Estado.sql`, ejecutada por el director). El comentario
(`lib/analysis/muestras.ts:16`) decía la verdad, y ahora consta con procedencia. **No entra en
el corpus ahora** (decisión del director).

**ACEPTADA COMO LATENTE** (R-5, arquitecto, 01/10), con el encuadre que se queda: sigue
siendo **un cuarto sitio donde se puede perder el candidato verdadero**, antes de los tres que
nombra Fable (F-119), **pero hoy no está disparado.**

**La pregunta** (L-8 del arquitecto, sale de L-6): Fable predice que el candidato verdadero se
pierde en el corte previo o en el rerank, no en Pinecone. Pero si el analizado tiene más de
120 trozos, hay trozos suyos que no se consultan, y **un candidato que contradijera justo ahí
podría no llegar ni a ser un match**. Es un cuarto sitio donde perderlo, y está antes de los
tres que nombra Fable.

**(a) Qué trozos se quedan fuera** (lectura de `lib/analysis/muestras.ts`):
- **El reparto es por ÍNDICE de trozo, no por posición en caracteres.**
  `pickSampleIndices(total, 120)` toma `Math.round(i × paso)`, con
  `paso = (total − 1) / 119` (`:29-35`). Salen siempre el primero y el último trozo.
- **No queda ningún tramo largo ciego**: los huecos están acotados. Por aritmética sobre esa
  fórmula, sin ejecutar el pipeline, el hueco máximo sin muestra entre dos consecutivas es:
  - de 1 trozo, hasta 180 trozos;
  - de 2, con 240;
  - de 3, con 360;
  - de 5, con 600.
- ⚠️ **En caracteres el hueco varía**, porque los trozos no miden lo mismo: una fila de tabla
  es un trozo (`muestras.ts:13-17`), y la prosa apunta a 1.200 caracteres
  (`lib/chunking.ts:26`).
- **Sí hay trozos no consultados**: con más de 120 trozos, por construcción.

**(b) ¿Un trozo que no es muestra puede recuperarse igual?**
- **Su texto no se lanza como consulta.** Su contenido sólo se pregunta:
  - si una muestra vecina lo comparte. El solapamiento entre trozos es de 200 caracteres, y
    **sólo dentro de un trozo cortado por longitud, nunca entre secciones**
    (`lib/chunking.ts:27`);
  - o si otra muestra, por su cuenta, trae al mismo candidato.
- **Fuera de eso, ese contenido queda fuera de la búsqueda.** Un candidato que sólo coincida
  con él no se recupera por ahí.
- **La pérdida es SÓLO de la búsqueda.** Si el candidato llega por otra vía, el juez lee el
  analizado según su régimen, y la comprobación de citas usa todos sus trozos.
- **En el exhaustivo no pasa**: van todos los trozos, sin tope (`app/api/analyze-v2/route.ts:522`).

**(c) Cuántos trozos tienen NOR-10 y CLI-12: NO CONSTA.** No se deduce del código sin ejecutar
el troceado, que va por secciones.
- **Lo que haría falta medir**, una de dos:
  - contar sus filas en `document_chunks` en la generación activa;
  - o leer la línea `N chunks, N samples` del log de un análisis de cada uno
    (`route.ts:598`).
- Lo único que consta es una cota inferior: 56 fragmentos únicos de NOR-10 cuando fue
  candidato (log del 29/09, transcrito por el arquitecto).

**POR QUÉ ES LATENTE, con las tres preguntas de la regla** (CLAUDE.md, «todo parámetro…
lleva su caso decisivo»):
- **(a) Qué población lo activa**: un documento ANALIZADO con más de 120 trozos, en modo
  rápido.
- **(b) ¿Puede producirla el corpus?** **No consta.** El mayor medido, según el comentario del
  propio tope, es OPE-06 con 114 trozos (`muestras.ts:16`), y ese comentario no lleva la
  fecha de la medida.
- **(c) ¿Existe un caso decisivo?** **No.** Ninguna prueba cambia de resultado si el tope se
  mueve.
- **Es un latente con fecha de caducidad**: el corpus crece, y un tarifario largo o una hoja
  de cálculo grande lo cruzan.

**Sin arreglo. Lo decide el director.**

### ⚠️ B.306 — EL RERANK DESCARTA POR CRITERIO CON SITIO LIBRE: de 8 a 4 y de 6 a 2, con el tope en 6 (constancia, SIN arreglo; 01/10/2026)

**Lo medido** (`SQL_B300_composicion_tanda_3.sql`, ejecutada por el director el 01/10; B.300):

| Analizado (30/09) | Recuperados | Al juez | Descartados por el rerank |
|---|---|---|---|
| CLI-12 | 8 | 4 | 4 |
| CLI-13 | 6 | 2 | 4 |
| NOR-10 | 3 | 2 | 1 |
| NOR-11 | 4 | 3 | 1 |

- **El tope del rerank en rápido es 6** (`MAX_SELECTED_QUICK`, `lib/analysis/rerank.ts:28`).
  En las cuatro había sitio libre, así que **el rerank no sólo corta por tope: descarta por
  criterio.**
- **Es el comportamiento escrito, no un fallo de código.** La instrucción del modo rápido dice
  «Sé estricto. Es preferible descartar un candidato dudoso que inflar la lista con ruido»
  (`rerank.ts:66`).
- **Lo que hace que importe**: es exactamente uno de los dos sitios donde Fable predice que se
  pierde el candidato verdadero (F-119, § 7: «las pérdidas están en el corte previo y en el
  rerank»). Y decide con la moneda antigua: 3.000 caracteres del analizado por posición y
  fragmentos de 300 (B.300, el reencuadre).
- **Ya se cuenta CUÁNTOS**: `seleccion.candidatos_descartados_por_criterio`
  (`lib/analysis/reparto-del-rerank.ts:206`), en `pipeline_counters`. **No se guarda QUIÉNES**:
  la base sólo conserva los ids de los que llegaron al juez (B.300, L-9).
- **En el plan de los contadores** (encargo del 01/10, pendiente de aprobar):
  `sobrevivio_al_rerank` por documento cubre el quiénes, sin distinguir si fue por criterio o
  por tope. Con el tope sin llenar, como aquí, todo lo descartado es por criterio.
- **CONFIRMADA OTRA VEZ el 01/10/2026, en la ruta por defecto** (sondas de B.307, sin tanda):
  el rerank se quedó 3 de 8 en la sonda A y 2 de 5 en la B, con el tope en 6. Hay sitio libre,
  así que el descarte es por criterio: dos casos más.
- **Sin arreglo.** Constancia.

### ⚠️ B.307 — LOS DOS CONJUNTOS NO SE TOCAN: el corpus son 14 ficheros sin trozos, y los ~28 con trozos están todos fuera. La puerta existe: «Añadir al corpus», en la bandeja (L-10; 01/10/2026)

**La deducción del arquitecto, comprobada**: los indexados no son corpus, y los del corpus no
están indexados.
- **Comprobada a nivel de COLUMNA por el censo**: `en_el_corpus = 14` y
  `corpus_sin_trozos = 14` (`SQL_Documentos_Sin_Chunks.sql`, consulta 2). **No hay un solo
  `analizado` con trozos.** Los 14 tienen nombre (B.295, F-2 nominal).
- **La comprobación directa**, con los nombres de los que tienen trozos y lo que le falta a
  cada uno para entrar: `SQL_Corpus_Con_Trozos_Por_Estado.sql`, **PENDIENTE DE EJECUTAR**.
- ⚠️ Es la columna, no la metadata del vector, que es lo que usa el retrieval. Que coincidan
  es el invariante F-96, sin comprobar aquí (B.301).

**(a) Quién escribe `analysis_status = 'analizado'`**: todas las escrituras de esa columna
(grep de las escrituras, no de los usos):
1. **`ingest`**, cuando el cliente manda `analysisStatus: 'analizado'`
   (`app/api/ingest/route.ts:97-98`, `:309`). Lo manda **el chat** al subir un documento:
   - si el análisis terminó (`hooks/chat/useDocuments.ts:253`);
   - o si el usuario lo confirma tras ver los hallazgos (`:260`).
2. **`index-text`** (`app/api/index-text/route.ts:360` en los vectores y `:393` en la fila).
   Lo llama la ventana de mejoras al indexar la versión mejorada
   (`components/improvement/useIndexing.ts:76`).
3. **`mark-analyzed`** (`app/api/documents/[id]/mark-analyzed/route.ts:134` en los vectores,
   y `:112` y `:152` en la fila). Desde la bandeja, de dos formas (abajo).
4. **El cambio de versión** de un documento que ya está en el corpus
   (`lib/document-swap.ts:94`).
- ✅ **Confirmado: analizar desde la bandeja NO lo pone.** `analyze-v2` sólo escribe
  `analyzed_content_hash` (`app/api/analyze-v2/route.ts:711`).
- **Y la sincronización de Drive y OneDrive mete los documentos nuevos como `pendiente`**
  (`app/api/drive/sync/route.ts:305`, `:404`, `:447`).

**(b) SÍ HAY UNA ACCIÓN DE INTERFAZ, y en lote.** El corpus **se puede ampliar desde el
producto**: no es una función que falte, es un paso que no se dio.
- **Pantalla**: la bandeja de revisión (`/settings/review`).
- **Qué ve el usuario**:
  - una fila ya analizada lleva la insignia **«Pendiente de decidir»**
    (`components/review/ReviewDocumentRow.tsx:100-102`);
  - una sin analizar dice «Sin analizar».
- **Qué pulsa, para varios**: marca las casillas y pulsa **«Añadir al corpus (N)»**
  (`components/review/ReviewSelectionBar.tsx:301-318`).
  - Va uno a uno, en serie, con `mark-analyzed` (`hooks/review/useIndexarSeleccion.ts:78-82`).
  - **No cuesta créditos.**
  - El botón se apaga con su motivo escrito al lado si algún seleccionado no tiene análisis,
    o tiene una versión nueva pendiente (`lib/documents/seleccion-indexable.ts`).
- **Para uno**: abre la fila y pulsa **«Marcar como analizado»**
  (`components/AnalysisModal/ReviewActions.tsx:201`).
- **Lo que exige el servidor**: que el documento tenga vectores (`chunk_count > 0`). Si no, da
  422 (`mark-analyzed/route.ts`, paso 1). Los ~28 con trozos lo cumplen.
- **Por qué hoy no hay ninguno dentro**: según el propio director, «solo los he analizado desde
  la bandeja». Analizar no añade; añadir es el botón de al lado.

**(c) El botón de reparar**, en la pantalla **«Corpus»** del menú lateral
(`components/layout/AppRail.tsx:132`, `/settings/corpus`, título «Estado del corpus»):
- **Qué ve**: «A reparar (N)», con TODOS los documentos de la organización que no están al
  día. Cada uno lleva su estado: «Reparable con el botón» u «Hay que volver a subirlo»
  (`settings/corpus/page.tsx:84-85`).
- **Uno a uno**: el «Reparar» de cada fila **sólo se enciende si el estado es «Reparable con
  el botón»** (`page.tsx:306`). Ese estado exige tener segmentos (`estado-de-reparacion.ts`).
  **Los 14 del corpus no tienen segmentos: su botón sale APAGADO**, con «Hay que volver a
  subirlo».
- **En lote**: **«Reparar todo lo reparable»** (`page.tsx:271-277`).
  - Manda a reparar **todo documento de la organización que no esté al día, en cualquier
    estado** (`app/api/admin/reindexar-lote/route.ts:92-110`).
  - Va en rondas de 8 (`LIMITE_POR_LLAMADA`, `lib/documents/lote.ts:28`).
  - Cada documento pasa por `planDeReindexado`. **Éste SÍ re-trocea la prosa sin segmentos.**
- ⚠️ **HALLAZGO: DOS CRITERIOS QUE NO DICEN LO MISMO.** La pantalla decide con
  `estadoDeReparacion`, y por eso pinta «Hay que volver a subirlo» con el botón apagado. El
  lote decide con `planDeReindexado`, y esos mismos documentos los repara. **La fila dice que
  no se puede, y el botón de arriba lo hace.** Es la regla de CLAUDE.md, «un criterio se
  implementa una vez», incumplida en la pantalla que más la necesita. Sin arreglo; ficha
  aparte si se decide.
- ⚠️ **AVISO PARA EL DIRECTOR, antes de pulsar «Reparar todo lo reparable»**: no repara «los
  14», repara TODA la lista «A reparar».
  - Puede incluir documentos `pendiente` y documentos con trozos de una versión vieja del
    troceador. NOR-11, CLI-13, NOR-10 y CLI-12 entrarían si su versión no es la vigente; eso
    no consta aquí.
  - **Reindexarlos cambia sus trozos.** En plena medida, eso es tocar el corpus (la regla del
    corpus quieto de B.295).
  - La lista sale en pantalla antes de pulsar: mirarla primero.
- **Si se pulsa dos veces** (leído, no ejecutado):
  - **en lote**, el botón se apaga mientras corre (`disabled={enCurso}`);
  - **por fila**, el botón NO se apaga, sólo cambia el texto a «Reparando…», así que dos
    pulsaciones lanzan dos peticiones.
    - Si la primera ya terminó, la segunda la rechaza el plan: `al_dia`, 409.
    - Si las dos van a la vez, la que llegue segunda choca con la versión en vuelo:
      `staged_vivo`, o la clave única de `document_staged`, que es el id del documento
      (`lib/document-staged.ts`).
    - Ninguna de las dos borra nada: reparar nunca borra el documento
      (`app/api/admin/reindexar/route.ts`, cabecera).
- Y con una subida en curso, 423 (`checkUploadLock`).

**(e) LO QUE ESTO HACE AL TABLERO — una PROPUESTA, sin cambiarlo; lo cambia el director:**
1. **NUEVO PUESTO 1 · meter en el corpus los documentos indexados que el director quiera que
   lo sean.**
   - Cómo: bandeja → seleccionarlos → «Añadir al corpus». Sin créditos para los ya
     analizados; los que no lo estén cuestan su análisis.
   - Antes, `SQL_Corpus_Con_Trozos_Por_Estado.sql`, que dice cuáles hay y qué le falta a cada
     uno.
   - **Cuáles son documentación de verdad lo decide el director, que tiene los documentos.**
2. **B.190 (reindexar los 14) BAJA.** Arregla la ruta de 14 documentos que suman 30.779
   caracteres. Cuántos se reparan sin resubir no consta: la SQL corregida está pendiente.
- ⚠️ **TRES CONSECUENCIAS del nuevo puesto 1, para decidirlo con ellas delante:**
  - **Cambia la línea de base.** El corpus por defecto deja de ser el de hoy: el arnés se
    vuelve a pasar después. Es lo mismo que ya estaba previsto tras reindexar.
  - **Las plazas compartidas dejan de ser cosa de la tanda.** Con NOR-10 y CLI-12 en el
    corpus por defecto, el mecanismo medido en B.300 actuaría en TODOS los análisis, no sólo
    con varios seleccionados. **Hipótesis, sin medir**, que sale del mecanismo, y subiría la
    prioridad de B.300.
  - **El escalón 1 empezaría a actuar en la ruta por defecto** para todas las parejas con
    trozos en los dos lados, que es lo que F-3 pedía.

**✅ LA COMPROBACIÓN DIRECTA (01/10/2026)**: `SQL_Corpus_Con_Trozos_Por_Estado.sql`, ejecutada por
el director (resultado transcrito por el arquitecto).
- **Los 28 documentos con trozos están en `pendiente`. Ni uno en `analizado`.** La
  deducción queda comprobada directamente y con nombres.
- **8 se pueden añadir sin créditos**, porque ya tienen análisis:

  | Documento | Trozos | Caracteres |
  |---|---|---|
  | CLI-12 | 55 | 50.797 |
  | CLI-13 | 11 | 9.743 |
  | NOR-10 | 67 | 60.038 |
  | NOR-11 | 15 | 14.437 |
  | OPE-10 | 64 | 15.012 |
  | OPE-11 | 64 | 16.020 |
  | OPE-13 | 15 | 1.941 |
  | RRHH-08 | 15 | 1.882 |

  Son caracteres de `full_text`, texto plano: no son los renderizados del juez de B.295,
  donde NOR-10 tenía 66.801.
- **Los otros 20 necesitan un análisis antes**, y eso cuesta créditos.
- **Y dos hallazgos de esta consulta**: CLI-01 sale DOS veces (ya era B.266, abajo), y
  OPE-06 tiene 114 trozos (B.305).

**📌 LA DECISIÓN DEL DIRECTOR (01/10/2026): AÑADE SEIS** —los ocho, menos NOR-10 y NOR-11, que
se quedan fuera como **sondas**—.
- Los seis: CLI-12, CLI-13, OPE-10, OPE-11, OPE-13 y RRHH-08. **Si ya están añadidos, no
  consta aquí.**
- **El corpus resultante**: **224 trozos**, frente a 0 de hoy.
  - ⚠️ **En caracteres son 126.174, no 95.395.** Los 95.395 son los seis que ENTRAN
    (recalculado por Code). Los 14 viejos se quedan dentro, porque sacarlos sin borrarlos no
    se puede (B.308), y suman 30.779.
  - Así que el corpus queda en 20 documentos, y los 14 viejos siguen sin trozos.

**LAS DOS PREDICCIONES DEL ARQUITECTO, escritas el 01/10 ANTES de que el director mida. Sin
veredicto.**
- **P-SONDA-1** · Con los seis añadidos, y analizando NOR-11 y NOR-10 **de uno en uno**
  (`0 ids de tanda`), en las dos direcciones el sistema encontrará a su pareja entre los
  candidatos y publicará al menos una contradicción sembrada.
  - La pareja de NOR-11 es CLI-13 (`SIEMBRA_caso_control.md`), y la de NOR-10, CLI-12
    (`SIEMBRA_corpus_ampliado.md`). Las dos estarían ya en el corpus.
  - ⚠️ **«En las dos direcciones», con NOR-10 y NOR-11 de sondas, quiere decir: NOR-11 →
    CLI-13 y NOR-10 → CLI-12.** La dirección inversa, con CLI-13 o CLI-12 como analizado, no
    puede salir de uno en uno: NOR-11 y NOR-10 son `pendiente` y sólo serían candidatos en
    tanda (B.300). Si el arquitecto quería decir otra cosa, lo fija antes de medir.
- **P-SONDA-2** · Menos de la mitad de las plazas de candidato se las llevarán los 14
  documentos sin trozos del corpus viejo.
  - ⚠️ **«Plazas de candidato» admite dos lecturas, y dan cosas distintas**: (a) los
    DOCUMENTOS candidatos recuperados («Retrieval: N candidatos»), o (b) las PLAZAS crudas de
    las consultas (25 por consulta, B.300). Es el defecto que hizo fallar a P-2 en B.295.
    **Se juzga con (a)** —es lo que hoy se lee en el log—, salvo que el arquitecto fije la
    otra antes de medir. (b) sólo se puede medir con los contadores, que no existen todavía.
- **Qué se lee para juzgarlas**, por cada pasada:
  - la línea del log `N chunks, N samples … ids de tanda` (`app/api/analyze-v2/route.ts:598`):
    **tiene que decir `0 ids de tanda`**, o la pasada no vale;
  - «Retrieval: N candidatos», y las líneas `[retrieval] "nombre": N fragmentos únicos`, para
    P-SONDA-2;
  - el régimen de cada pareja (`lecturaDeLasParejas`), que con el interruptor encendido debería
    ser `pareja_entera` o `corte_honesto` para la pareja sembrada, y `sin_fuente_comun`
    para los 14 viejos;
  - los hallazgos publicados (`discrepancies`), contra los dos registros de siembra.
- ⚠️ **Lo que también cambia al añadirlos**: la línea de base. El corpus por defecto deja de
  ser el de hoy (consecuencias en (e), arriba).

**🔬 LAS DOS SONDAS, MEDIDAS (01/10/2026).** Interruptor ENCENDIDO y `0 ids de tanda` en las dos.
Logs del director, transcritos por el arquitecto; Code no los ha visto. Que los seis ya estaban
en el corpus lo dicen estas mismas pasadas: OPE-10, OPE-11, OPE-13 y RRHH-08 salen como
candidatos sin tanda.

**SONDA A · NOR-11 solo**, de 08:26:37 a 08:27:02. 24.371 ms.
- 15 trozos, 15 muestras y 14.437 caracteres.
- **Retrieval, 8 candidatos**: CLI-12 (47 fragmentos únicos, mejor 0,947), CLI-13 (11; 0,943),
  OPE-13 (4; 0,875), OPE-10 (4; 0,873), Clientes_Residuos_Sanitarios (1; 0,873), OPE-11 (2;
  0,873), RRHH-08 (3; 0,872) y Normas_Frecuencia_Recogidas (1; 0,866).
- **Rerank, 3**: CLI-13, CLI-12 y Normas_Frecuencia_Recogidas.
- **Juez:**
  - **CLI-13, `pareja_entera`** (14704/14704 y 9817/9817; presupuesto 40000). Solapamiento
    45 %, 3 contradicciones y 5 solapamientos:
    - `[e7785038]` «Plazo máximo de almacenamiento de residuos grupo III» → **confirmada y
      publicada**;
    - `[5a59c682]` «Color del contenedor para residuos grupo III no punzantes» → **confirmada
      y publicada**;
    - `[976f6174]` «Ubicación del punto de retirada centralizado» → **tirada por la
      comprobación de citas** (lado=nuevo);
    - y 3 solapamientos tirados por la misma comprobación.
  - **CLI-12, `corte_honesto`** (14704/14704 y 2959/55135, dejó fuera). Solapamiento 15 %, 0
    contradicciones y 1 solapamiento tirado.
  - **Normas_Frecuencia_Recogidas, `sin_fuente_comun`**: 1 contradicción, `[2bf4eefc]`
    «Frecuencia de recogida de residuos sanitarios», tirada por la comprobación de citas.
- Verificador: 2 hallazgos → 2 confirmados.
- **Contra la siembra** (`SIEMBRA_caso_control.md`): el juez encontró **las 3 de 3**; se
  publicaron **2 de 3**; **0 falsos positivos**.

**SONDA B · NOR-10 solo**, de 08:29:55 a 08:30:18. 22.203 ms.
- 67 trozos, 67 muestras y 60.038 caracteres.
- ⚠️ `[vectores] fallo pasajero en query (intento 1/3) — espera acumulada 1000/10000ms`. El
  reintento lo resolvió. **No consta si ese fallo costó candidatos.** Son 5 aquí frente a 8 en
  la A, y las dos explicaciones —menos afinidad, o el fallo— quedan abiertas.
- **Retrieval, 5 candidatos**: CLI-12 (53; 0,938), CLI-13 (11; 0,914), OPE-10 (4; 0,873),
  OPE-11 (3; 0,872) y Protocolo_Visitas_Centros (1; 0,848).
- **Rerank, 2**: CLI-12 y CLI-13.
- **Juez:**
  - **CLI-13, `corte_honesto`** (30183/66801 y 9817/9817). Solapamiento 0 % y 0
    contradicciones. ✅ **Es el control negativo, y sale limpio**: entre NOR-10 y CLI-13 no hay
    nada sembrado.
  - **CLI-12, `corte_honesto`** (37143/66801 y 2857/55135, los dos dejaron fuera).
    Solapamiento 15 % y 1 contradicción, `[1eb33774]` «Autoridad para retirar autoclave de
    servicio tras fallo de c» —**el título cortado a 60 es del log**, `judge.ts:944`—, tirada
    por la comprobación de citas (lado=nuevo). Y 1 solapamiento tirado.
- Verificador: 0 hallazgos.
- **Contra la siembra**: el juez emitió la **sembrada A**, y se publicó **0**.

**LOS VEREDICTOS:**
- ❌✅ **P-SONDA-1: FALLADA A MEDIAS, y se cuenta así, sin redondear.**
  - **La primera mitad acertó**: en las dos direcciones el sistema encontró a su pareja entre
    los candidatos y la llevó al juez.
  - **La segunda falló**: publicó al menos una sembrada en NOR-11, y **ninguna en NOR-10**.
- ✅ **P-SONDA-2: ACERTADA**, con la lectura (a) fijada antes de medir (documentos
  candidatos).
  - Los documentos sin trozos del corpus viejo se llevaron 2 de 8 candidatos en la A
    (Clientes_Residuos_Sanitarios y Normas_Frecuencia) y 1 de 5 en la B
    (Protocolo_Visitas_Centros).
  - Al juez llegó 1 de 3 y 0 de 2.
  - Menos de la mitad en las cuatro cuentas.
  - **Su consecuencia**: los 14 del corpus viejo **pierden por méritos propios**. No hay que
    sacarlos del corpus, y por tanto **no hay que borrar nada**. Cierra la decisión que B.308
    dejaba pendiente.
  - ⚠️ **MATIZADO EL 04/10/2026 (B.319)**: sigue siendo cierto en lo de borrar, y **deja de ser
    completo**. Un fantasma sin trozos sí puede aportar un hallazgo —Normas_Frecuencia emitió una
    contradicción en la primera pasada del programa nuevo—, y hoy no hay forma de verificárselo si su
    cita es una fila de tabla.
- ⚠️ **Un recuento que no cuadra**: el arquitecto cuenta 7 hallazgos tirados entre las dos
  sondas. Sobre su propio literal salen **8**:
  - en la A, 6: `[976f6174]`, 3 solapamientos con CLI-13, 1 con CLI-12 y `[2bf4eefc]`;
  - en la B, 2: `[1eb33774]` y 1 solapamiento.

  Queda así hasta que se mire el log.

### ⚠️ B.308 — EL CORPUS SÓLO CRECE: no existe sacar un documento sin BORRARLO, y «Quitar del corpus» lo borra (L-11; hallazgo de producto, SIN arreglo; 01/10/2026)

**El caso que lo destapa**: el plan del director es sacar del corpus los 14 ficheros de prueba
**sin borrarlos** —son la evidencia de todo lo medido— y meter la documentación indexada
(B.307). **La primera mitad no se puede hacer.**

**(a) En la interfaz: NO existe la operación inversa de «Añadir al corpus».**
- El único botón con ese nombre, **«Quitar del corpus»**, **BORRA el documento**. Está en la
  bandeja, en la ventana de un documento: un botón de borde rojo
  (`components/AnalysisModal/ReviewActions.tsx:174-182`).
  - Pide confirmación con «Esto eliminará el documento del corpus de forma permanente. No se
    puede deshacer» y «Confirmar borrado» (`:74-115`).
  - Llama a `DELETE /api/documents` (`app/(authenticated)/settings/review/page.tsx:160-178`).
- **El nombre engaña dos veces**: dice «quitar», y borra; y vive en la bandeja, que sólo lista
  lo que NO está en el corpus, salvo los que tienen una versión nueva, y en ésos el botón no
  sale (`app/api/documents/review-list/route.ts:95-96`; `ReviewActions.tsx:172`).

**(b) En la API: TAMPOCO.** Ninguna ruta pasa un documento de `analizado` a otro estado
(grep de las escrituras de `'pendiente'` en `app/api` y `lib`):
- `ingest` sólo pone el estado AL NACER (`app/api/ingest/route.ts:97-98`);
- la sincronización de Drive y OneDrive escribe `pendiente` en un documento existente sólo
  si ya era `pendiente` («sobrescribir»). Si era `analizado`, lo **versiona** y lo protege
  (`app/api/drive/sync/route.ts:245-256`, `:404`).
- ⚠️ **No es una operación del producto, y no se propone**: la herramienta de mantenimiento
  `POST /api/admin/cleanup-orphans?dryRun=false` proyecta la COLUMNA sobre la metadata de los
  vectores de toda la organización (`route.ts`, el bloque «Backfill»). Un cambio de la columna
  a mano en SQL más esa herramienta lo haría por un lado.
  - Toca los vectores de TODOS los documentos, no de uno.
  - Nadie lo ha diseñado para esto, ni medido.
  - **Sin evaluar.**
- **CONCLUSIÓN: el corpus sólo crece. Corregirlo es borrar.**

**(c) Qué le pasa a un documento al salir, por la única vía que existe (borrarlo)**:
`deleteDocument` (`lib/delete-document.ts`), en este orden:
1. **la lápida**, si es de Drive o de OneDrive, para que la sincronización no lo vuelva a
   traer (`:122-144`);
2. **sus ANÁLISIS**: todas las filas de `analysis_results` de ese documento (`:166-176`,
   desde B.112);
3. **sus vectores** (`:185`, `:199`);
4. **la fila**, y con ella **sus trozos**, por `ON DELETE CASCADE` de
   `document_chunks.document_id`.
- **El fichero original en Storage**: en lo leído, ni `deleteDocument` ni la ruta lo borran.
  Que se quede no consta, y no lo he ejecutado.
- ⚠️ **Para el plan del director, la consecuencia es doble**:
  - sacar «la basura» la borra entera, trozos incluidos: equivocarse cuesta volver a subirla;
  - **borra también los análisis de esos documentos**, que son parte de la evidencia
    archivada.

**(d) LAS ACCIONES QUE BORRAN, a un clic de las que sí se quieren usar** (para avisar al
director):

| Dónde | Botón | Qué hace | Cómo se distingue |
|---|---|---|---|
| Bandeja, barra de selección | **«Añadir al corpus (N)»** | Lo que se quiere: pasa a `analizado`, sin borrar nada | En la barra de la selección, no dentro de un documento (`ReviewSelectionBar.tsx:301-318`) |
| Bandeja, ventana de un documento | «Marcar como analizado» | Lo mismo, de uno en uno | Botón **azul**, relleno (`ReviewActions.tsx:184-201`) |
| ⚠️ Bandeja, ventana de un documento, **al lado del anterior** | **«Quitar del corpus»** | **BORRA el documento**, sus trozos, sus vectores y sus análisis | Borde y letra **rojos**. Pide un segundo clic, «Confirmar borrado» |
| ⚠️ Bandeja, ventana de una versión nueva (como new 9.txt) | «Descartar versión nueva» | Borra los vectores de la versión NUEVA y su marca; la vieja se queda (`app/api/documents/[id]/discard-staged/route.ts`) | Borde rojo, al lado de «Activar esta versión» (azul) |
| ⚠️ Chat, lista lateral de documentos | Icono de papelera por fila | **BORRA el documento**, igual que «Quitar del corpus» (`hooks/chat/useDocuments.ts:477-485`) | **Invisible hasta pasar el ratón por encima**; no sale en los de Drive (`components/DocumentsSidebar.tsx:301-310`). Pide confirmación: «¿Eliminar "nombre"?» |
| Pantalla «Corpus» | «Reparar» y «Reparar todo lo reparable» | **No borra documentos**: escribe una generación nueva y conmuta (`app/api/admin/reindexar/route.ts`, cabecera) | Ojo con el lote, que actúa sobre toda la organización (B.307) |

⚠️ **RIESGO VIVO (01/10/2026)**: el director va a pulsar en la bandeja para añadir los seis
(B.307), y «Quitar del corpus» está al lado del botón que quiere, y BORRA, con sus análisis.
- **Si alguna vez se decide sacar los 14 del corpus, ANTES hay que exportar sus filas de
  `analysis_results`.**
- La SQL está escrita: `SQL_Exportar_Analisis_Corpus_Viejo.sql`, en sólo lectura y con el
  mismo criterio que el borrado (`org_id` + `document_id`).
- **Es un seguro, no una tarea**: no se ejecuta ni se pide.
- ✅ **DECISIÓN CERRADA (01/10/2026), por P-SONDA-2 (B.307)**: los 14 del corpus viejo pierden
  por méritos propios, así que **no hay que sacarlos ni borrar nada**. El seguro de exportación
  se queda escrito y sin usar. **El riesgo de «Quitar del corpus» sigue vivo** para cualquier
  otro documento: el botón no ha cambiado.

**Sin arreglo.** Lo que haría falta —una operación «sacar del corpus» que devuelva el
documento a `pendiente`, con efecto espejo (vectores primero, fila después; regla de F-96 P4)
y sin borrar nada— es una decisión de producto, y no está tomada.

### ⚠️ B.309 — LA DEDUPLICACIÓN CONSERVA LA PRIMERA APARICIÓN DE CADA TROZO, NO LA DE MÁS SCORE: el «máximo» con el que se eligen los documentos puede no ser el máximo (constancia, SIN arreglo; 01/10/2026)

**Escrita ANTES de implementar los contadores**, por condición del arquitecto (01/10). Salió como
punto (g7) del plan (`claude/Plan_Contadores_Topes_Ciegos.md`).

**Lo que hace el código** (leído, no ejecutado):
- **El orden de los fragmentos es el de las CONSULTAS.** `batchResults.flat()` pone primero
  todo lo de la consulta 1, luego lo de la 2, y así (`lib/analysis/retrieval.ts:336`). La criba
  conserva ese orden. Las consultas salen de las muestras del analizado, en orden de documento
  (`lib/analysis/muestras.ts:29-35`).
- **`deduplicateFragments` se queda con la PRIMERA aparición de cada trozo**
  (`retrieval.ts:645-655`: `if (seen.has(key)) continue`). No mira el score.
- **Pero el score de un trozo depende de la consulta.** El mismo trozo devuelto por la consulta
  2 con 0,80 y por la 50 con 0,95 se queda con **0,80**.
- **Todo «máximo» posterior es el máximo de las primeras apariciones**:
  - la unidad toma el mayor score de sus fragmentos ya deduplicados (`retrieval.ts:707`, `:711`);
  - `maxScore` del candidato sale de ahí (`retrieval.ts:563`), y **ordena el corte de 25**
    (`corte-de-recuperacion.ts:42`);
  - el desempate del rerank es el mayor score de sus fragmentos (`orden-del-rerank.ts:75-79`);
  - los scores del termómetro y su `hueco_1_2` se calculan sobre los únicos
    (`termometro.ts`, «sobre los fragmentos ÚNICOS»).
- **Lo que significa**: la señal con la que se eligen los documentos **no calcula lo que dice
  calcular**. Es exactamente la agregación de la que habla Fable en F-119 § 3 —el máximo por
  documento como suelo—, y en este código ni siquiera es el máximo.

**Lo que NO se sabe**: si pasa de verdad y cuánto. Depende de que el mismo trozo salga en varias
consultas con scores distintos, y eso no se registra en ningún sitio.

**Cómo se va a saber, sin arreglar nada**: los contadores del plan aprobado.
- `repetidos_con_score_mayor`, por documento y en total: cuántas veces se tiró una aparición
  con más score que la conservada.
- Y por documento, `mejor_score` (el máximo de verdad, sobre todas las apariciones) junto a
  `score_que_ordena` (el `maxScore` de hoy). Su diferencia es el efecto, documento a documento.

**Sin arreglo.** El arreglo —quedarse con la aparición de más score— cambia el orden del corte y
del rerank, o sea la línea de base. Va con su caso decisivo y su predicción escrita antes, como
el escalón 1, y lo decide el arquitecto con el dato de los contadores delante.

### ⚠️ B.310 — EL TROCEADO PEGA EL TÍTULO DE LA SECCIÓN DELANTE DE CADA SUBTROZO: un texto que no existe en el documento, y la comprobación de citas lo da por bueno (constancia, SIN arreglo; 01/10/2026)

**Lo que hace el código**: `subdivideSection` (`lib/chunking.ts:464-475`) parte por longitud
toda sección que pasa de 1.500 caracteres. A **cada** pedazo le pega delante el título de la
sección: `${section.title}\n\n${piece}`. Entre pedazos, además, hay un solapamiento de 200
caracteres (`CHUNK_OVERLAP`, `:27`).

**Es un falso POSITIVO de la comprobación, no un falso negativo** (arquitecto, 01/10).
- Un subtrozo es «TÍTULO + un tramo del cuerpo» que **en el documento no van seguidos**.
- La comprobación busca la cita trozo a trozo (B.299, entrada 5). Así que **hoy puede dar por
  buena una cita que pegue el título a un tramo del cuerpo que en el documento no va detrás**.
- **B.299 no sólo mata citas verdaderas: también puede aprobar citas que no existen tal
  cual.**
- Y el mismo pegote llega al JUEZ: el texto del analizado se arma desde los trozos
  (`buildAnalyzedDocumentText`, `lib/analysis/judge.ts:963-982`). En cada costura de una sección
  larga, el juez lee el título repetido y 200 caracteres dos veces. Por eso una cita fiel al
  documento que cruce esa costura no casa con lo que el juez leyó (B.299, entrada 8).

**EL ARREGLO NO ESTÁ EN EL COMPROBADOR: ESTÁ EN EL TROCEADO** (arquitecto, 01/10). Si el texto
que se entrega contiene pegotes que no existen en el documento, el problema es de quien los
pega, no de quien comprueba. Dejar que el comprobador «lo detecte» sería taparlo.

**¿Tiene un motivo escrito? Sí, a medias, y el arreglo tiene que respetarlo.**
- Lo introdujo `a297b8c5` (19/08/2026, «trocear por secciones en vez de por longitud»): «las
  secciones que superan MAX_CHUNK_SIZE se subdividen conservando su título». Lo verificó con
  documentos reales: «cada uno encabezado por su título de sección». Y lo repite la cabecera
  de `chunking.ts` (`:6-7`) y el comentario de la función (`:463`).
- **El porqué explícito sólo está escrito para las hojas de cálculo**, en el mismo commit:
  «repitiendo la cabecera de columnas en cada bloque: antes sólo el primer trozo sabía a qué
  columna correspondía cada valor».
- Para la prosa, el motivo implícito es el mismo: **que un trozo suelto se entienda**, para la
  búsqueda por similitud y para quien lo lee aislado.
- **O sea que es deliberado y útil para buscar; lo que sobra es que sea TEXTO DEL DOCUMENTO.**
- ✅ **LA FORMA DEL ARREGLO, fijada por el arquitecto (01/10)**: el motivo es bueno, así que el
  arreglo **no es quitar la repetición**. **El título tiene que viajar como METADATO del trozo,
  no pegado dentro de su texto.** Quien recupera lo quiere para entender; quien verifica
  necesita el texto tal como está en el documento. Hoy los dos reciben lo mismo, y por eso uno
  de los dos está siempre mal servido.
- **Es la mitad B de las dos preguntas de B.299** (entrada 8). A, «¿citó el juez fielmente lo
  que se le dio?», la contesta B.299. B, «¿existe esa frase en el documento del cliente?», la
  contesta esta ficha. **Con esta ficha arreglada, A y B son la misma pregunta**, porque lo
  entregado será fiel al documento. Y con ella muere la otra mitad de la causa (i) de B.299:
  la de las costuras dentro de una sección larga.
- ⬆️ **SUBE AL PUESTO 2 del tablero** (arquitecto, 01/10), detrás de B.299 y delante de los
  contadores. **El motivo es de producto, no de pipeline**: una cita publicada con un título
  pegado en medio **es una cita que el usuario no va a encontrar en su documento**. El día que
  un cliente abra el documento, busque la frase que le enseñamos y no esté, da igual que el
  hallazgo fuera verdadero.
  - Un arreglo que lo respete separa las dos cosas: el título como CONTEXTO del trozo, que
    sigue sirviendo para la búsqueda pero no es citable, y el cuerpo como texto. Es la misma
    idea que las líneas de contexto no citables de F-44.
  - Cambia lo que queda guardado, así que **va con la vía de reparación y el sello**
    (`EXTRACTOR_VERSION`, la regla de F-104).

**Lo que NO se sabe**: cuántas veces ha aprobado de verdad una cita con el título pegado. No se
registra. El paso que deja el log desde B.299 (ii) no lo distingue.

**Sin arreglo.** Constancia.

### ⚠️ B.311 — PUBLICAMOS LA CITA DEL JUEZ, NO LA DEL DOCUMENTO: por el camino de cabeza y cola, el centro de la cita no se comprueba (constancia, SIN arreglo; decisión del director; 01/10/2026)

**La pregunta, del arquitecto (01/10)**: cuando una cita pasa por el camino de cabeza y cola,
¿qué texto se publica, el del juez o el del documento?

**LO QUE SE PUBLICA, camino a camino** (leído, no ejecutado):
- `fixQuotesInJudgment` publica `matchNew.text` y `matchExisting.text`
  (`lib/analysis/judge.ts`: `newDocSays` y `existingDocSays` en las contradicciones,
  `evidenceInNewDoc` y `evidence` en los solapamientos).
- **Y ese `text` es SIEMPRE la cita del juez, por los cuatro caminos.**

| Camino | Qué se comprobó | Qué se publica | ¿Lo encuentra el cliente en su documento? |
|---|---|---|---|
| literal | la cadena entera, tal cual | la cita del juez | **sí**, tal cual |
| normalizado | la cadena entera, sin mayúsculas, puntuación ni espacios de más | la cita del juez | casi: puede diferir en **forma** (mayúsculas, puntuación, espacios) |
| **cabeza y cola** | **sólo los primeros y los últimos hasta 20 caracteres normalizados**, en orden y a menos de 3 veces la longitud de la cita | la cita del juez **entera** | **no necesariamente: el CENTRO no se comprobó**, y puede llevar palabras que no están |
| segmentos (tablas) | cada valor, en la misma fila y en cualquier orden | la cita del juez («Luis \| Retiro») | los valores sí; el formato es el de la cita |

Lo mismo con el pajar nuevo de B.299 (entrada 9): la existencia se decide con esos mismos
caminos, y se publica la cita del juez.

**QUÉ DECIDIÓ F-55, Y POR QUÉ** (el motivo está escrito en el código, `lib/analysis/judge.ts:182-213`,
en el comentario de `verifyQuote`; F-55 es anterior al archivo de consultas y no tiene fichero
propio):
- «`text` DEJA DE SER TEXTO DEL CHUNK: las tres vías devuelven ahora la CITA DEL JUEZ, ya
  verificada». **El motivo era de TABLAS**: «la ficha mostraba la fila con sus diez columnas
  donde el juez citó tres valores. Verdadero, pero no es la cita».
- Y escribió su coste: «EFECTO COLATERAL ACEPTADO: para PROSA se pierde la corrección fuzzy […]
  Ahora se muestra la del juez. Sigue estando verificada (existe en el documento); **solo puede
  diferir en forma**».
- **Esa última frase es la que no se sostiene por el camino de cabeza y cola.** Ahí no puede
  diferir sólo en forma: el centro de la cita no se miró, y puede diferir en CONTENIDO.
- **O sea que el motivo de F-55 es bueno para las tablas y para la forma, y no cubre el centro
  de la cita.** El arreglo, si se decide, tiene que respetar lo de las tablas: no volver a
  publicar la fila entera.

**LO QUE ESTO HACE AL PRODUCTO** (la misma familia que B.310, por otro camino): **publicamos
citas aproximadas como si fueran literales.** Por el camino de cabeza y cola sólo se comprueban
20 caracteres de cada punta, y el medio puede llevar palabras que no están en el documento. Eso
no es un detalle técnico: **le podemos enseñar al cliente una cita que no existe en su documento
y llamarla literal** (arquitecto, 02/10).
- **La corrección a F-55, sin retirar su motivo**: nació de las tablas, y ahí tenía razón;
  enseñar diez columnas cuando el juez citó tres valores era peor. Lo que no se sostiene es su
  frase «sólo puede diferir en forma»: por el camino de cabeza y cola puede diferir en
  CONTENIDO. El cliente que busque en su documento una cita
aprobada por su cabeza y su cola puede no encontrarla.

**Cuántos hallazgos publicados estos días pasaron por el camino aproximado: NO CONSTA.**
- El camino por el que casa una cita no se guarda en ningún sitio.
- El registro de B.299 (ii) sólo escribe el paso de las citas que FALLAN, no el de las que
  pasan.
- Saberlo exige registrar también el paso de las que pasan. Es un cambio pequeño, y no se ha
  hecho.
- ✅ **Hecho en el LOG el 02/10** (`99ea712e`, para B.313): «Contradicción verificada» y
  «Solapamiento verificado» llevan la vía por lado. **En el HALLAZGO sigue sin guardarse**: la
  pieza de abajo sigue pendiente.

📌 **LA PRIMERA PIEZA DEL ARREGLO, escrita ya y sin implementar** (arquitecto, 02/10): **el camino
por el que se verificó cada cita —literal, normalizado, cabeza y cola, o segmentos— tiene que
quedar registrado EN EL HALLAZGO**, no sólo en el log del descarte. Hoy no se guarda, y por eso
«cuántos hallazgos publicados pasaron por el camino aproximado» es «no consta». Es la misma
disciplina que los contadores: una decisión sin registro no se puede auditar.

⚠️ **EL RIESGO ERA MÁS AMPLIO DE LO QUE ES** (corrección del 02/10, por B.314). «Publicar como
literal una cita aproximada» sólo hace daño donde la cita **se enseña**:
- en el modal del **exhaustivo**, las de las contradicciones;
- y en el **editor de mejora**: siempre si se abre desde la bandeja, y desde el chat sólo tras un
  exhaustivo.

En el modal del **rápido** no se enseña ninguna cita, y las de los solapamientos **no se pintan en
ninguna vista**. Ahí la cita aproximada decide si se publica la pareja y adónde salta el editor,
pero el usuario no la lee. **El riesgo de B.311 se estrecha a esos sitios.**

📏 **Y MEDIDO, PEQUEÑO** (02/10, registro de las citas que pasan, B.313): en dos pasadas, **0 de 22
citas publicadas pasaron por el camino de cabeza y cola**. Las 22 fueron literales. Sigue siendo un
agujero del diseño, pero **no está disparado**. *(Corregido abajo el mismo día: 1 de 23.)*

🔥 **DISPARADO, EN UN HALLAZGO PUBLICADO** (02/10/2026, 13:17:49; registro transcrito por el
arquitecto, Code no lo ha visto). NOR-10 → CLI-12, `[98277f67]`, **confirmada y publicada**:
- **nuevo: longitud=434, paso=`cabeza_y_cola`**, pajar=entregado_texto;
- existente: 341, `literal`, entregado_piezas.
- **Se publicó por la puerta aproximada.** De esos 434 caracteres sólo se comprobaron el principio y
  el final: **el medio no lo ha verificado nadie.**
- **La cifra de arriba se corrige**: no «0 de 22», sino **1 de 23, y es justo el que se publicó**.
  Sigue siendo un agujero del diseño, y **ya está disparado**.

📝 **LA MEDICIÓN QUE SIGUE, Y LO QUE SIGNIFICA CADA RESULTADO, ESCRITO ANTES DE MIRAR** (02/10/2026).
La cita se guardó, porque se publicó: `SQL_B311_cita_publicada_autoclave.sql`, de sólo lectura,
PENDIENTE DE EJECUTAR, la saca entera de los dos lados. Después, offline con NOR-10:
- **Cómo se mide**:
  - **El medio** es la cita sin su cabeza ni su cola: lo que queda entre los primeros 20 y los
    últimos 20 caracteres normalizados, que son lo único que comprobó la puerta.
  - Se parte en sus **trozos literales** con el mismo método que la hipótesis del reparto de B.313:
    el tramo más largo, normalizado con `normalize()`, que está en NOR-10, de 15 caracteres o más,
    de izquierda a derecha.
  - Y se mira **dónde** cae cada trozo: si entre la cabeza y la cola, y en orden.
  - Lo que no sea un trozo —palabras sueltas o tramos cortos— se lista entero, con su texto.
- **Las tres respuestas posibles** (arquitecto, 02/10), y lo que implica cada una:
  1. **El medio está literal**: sus trozos cubren el medio, caen entre la cabeza y la cola y en
     orden; lo que queda son diferencias de forma, que se listan.
     → **La tolerancia salvó una cita buena, y el daño es cero EN ESTE CASO**, no en general.
  2. **El medio está cambiado de orden**: sus trozos son literales, pero caen fuera de orden o fuera
     del tramo entre la cabeza y la cola.
     → **Es lo mismo que Chamberí, y las dos enfermedades de B.313 eran una.**
  3. **El medio dice algo que no está en NOR-10**: hay palabras de contenido —no de forma— que no
     aparecen en ningún trozo literal.
     → **Hemos publicado una cita inventada**, y esto deja de ser una ficha y **pasa a ser lo
     primero del tablero**.
- **Un dato de antes de mirar, que no es una medida de la cita**: la frase 32 de NOR-10, la que
  contiene los tres datos de la A, mide 340 caracteres. Una cita de 434 es más larga que esa frase.

🔥🔥 **LA CITA PUBLICADA, CON EL DATO EN LA MANO (02/10/2026)** — `SQL_B311_cita_publicada_autoclave.sql`,
ejecutada por el director y transcrita por el arquitecto.
- **Dos filas**, a las 09:02:48 y a las 13:17:53, NOR-10 → CLI-12, tema «Autoridad para retirar
  autoclave de servicio tras fallo de control biológico». **Las dos traen EXACTAMENTE la misma pareja
  de citas, carácter por carácter.** Confirma por el dato lo que se cerró por construcción con el
  hash (B.312): las dos publicaciones son el mismo par.
- **nuevo (NOR-10), PUBLICADA, 434 caracteres, `cabeza_y_cola`**: «El Director Clínico quien autoriza
  cualquier excepción documentada al procedimiento y quien responde ante Dirección de Operaciones en
  caso de incidencia grave relacionada con la esterilización del instrumental. La responsabilidad
  última —incluida la firma de los registros de auditoría trimestral y la decisión de retirar del
  servicio un autoclave que no supere un control biológico— no es delegable y recae siempre sobre
  esta figura.»
- **existente (CLI-12), 341 caracteres, `literal`**: «El Coordinador de Calidad es quien autoriza
  cualquier excepción documentada al protocolo de esterilización, quien firma los registros de
  auditoría trimestral del área y quien decide, con criterio técnico y sin necesidad de validación
  adicional del Director Clínico, la retirada de servicio de un autoclave que no supere un control
  biológico.»

**LO QUE NO NECESITA MEDICIÓN** (arquitecto, 02/10):
- **«El Director Clínico quien autoriza» no es español gramatical: falta el verbo.** Un texto copiado
  no pierde un verbo. **La cita publicada NO es una copia literal, y eso se establece leyéndola.**
- El contraste está en la misma fila: el lado de CLI-12, que pasó `literal`, **sí lleva «es quien»**.
  Uno está copiado y el otro cosido.
- **La cita son DOS frases**, y el prompt pide «Máximo 1 frase por cita» (`lib/analysis/judge.ts:834`).
  Se publicó incumpliendo una regla que ya existe.

🔥 **HEMOS PUBLICADO, COMO CITA LITERAL, UNA FRASE QUE NO EXISTE EN EL DOCUMENTO DEL CLIENTE.** No es
contenido inventado —el dato es real y la contradicción es verdadera—: es **una frase inventada con
contenido real**. Un cliente que la busque en su documento no la encontrará. **Deja de ser un agujero
teórico.**

**LA MEDICIÓN FORMAL** (Code, 02/10, con el método escrito antes de mirar, sobre el texto extraído de
NOR-10):
- **La cita no está en NOR-10, ni literal ni normalizada.** Pasó por cabeza y cola.
  - Su cabeza («el director clínico») casó con su PRIMERA aparición, que está en la **frase 30** («El
    responsable último… es el Director Clínico de la clínica correspondiente»). No es la frase de la
    que sale la cita.
  - Su cola casó en la **frase 32**. Tramo: 764 caracteres, por debajo de las tres veces la cita
    (1.302). **La puerta midió entre un principio que no era el suyo y un final que sí.**
- **El medio (390 caracteres normalizados) son DOS trozos literales, y nada más**:
  - 190 caracteres de la **frase 31**: «quien autoriza cualquier excepción documentada al procedimiento
    y quien responde ante Dirección de Operaciones en caso de incidencia grave relacionada con la
    esterilización del instrumental»;
  - 200 de la **frase 32**: «la responsabilidad última —incluida la firma… — no es delegable y recae
    siempr…».
  - **Ni una palabra fuera de NOR-10.**
- **Lo que la cita ES, carácter por carácter**: suma exactamente 434.
  - 20 de «El Director Clínico », de la frase 31 sin su «Es»;
  - 190 del final de la frase 31;
  - un espacio;
  - y 223 del final de la frase 32, con «La» en mayúscula.
- **Lo que la cita OMITE**:
  - 3 caracteres al principio de la 31 («Es »), y por eso falta el verbo;
  - **159 caracteres en medio de la 31**: «quien debe asegurar que existen los recursos materiales y
    humanos necesarios para ejecutar cada etapa del ciclo de esterilización conforme a lo aquí
    descrito,»;
  - y **los 117 primeros caracteres de la 32**: «El Director Clínico puede delegar funciones operativas
    del día a día en el personal auxiliar de esterilización, pero».
- **Tres costuras, no una**: «El Director Clínico · quien autoriza», «instrumental. · La
  responsabilidad», y el «Es» quitado del principio.
- **CUÁL DE LAS TRES RESPUESTAS SALE, dicho sin adornos:**
  - ⚠️ **Por la LETRA del criterio escrito antes de mirar, sale la (1)**: los trozos cubren el medio,
    caen entre la cabeza y la cola, y en orden.
  - **Y la (1) es FALSA aquí: EL CRITERIO TENÍA UN AGUJERO.** Comprobaba el orden y el tramo, y **no
    exigía que los trozos fueran SEGUIDOS en el documento**. Entre ellos faltan 159 y 117
    caracteres. No es «una cita buena salvada por la tolerancia»: es una cita con texto quitado.
    **Se cuenta como un fallo del criterio, no se reinterpreta el resultado.**
  - **Tampoco es la (2) tal como se definió**: el orden se conserva (31, luego 32).
  - **No es la (3)**: no hay contenido inventado.
  - **Es un cuarto caso, que el criterio no previó: OMISIÓN.** Trozos literales, en orden, de dos
    frases contiguas, con lo de en medio quitado para que la frase rime con la de CLI-12 («El
    Coordinador de Calidad es quien autoriza…, quien firma…, y quien decide…»).
- **La apuesta del arquitecto**, «sale la (2): el medio es literal pero de dos frases distintas, y la
  costura está en "El Director Clínico · quien autoriza"; no la (3)»:
  - **acierta en lo sustancial**: dos frases, esa costura y nada inventado;
  - **falla en el número**: no es la (2) como estaba definida, porque no hay cambio de orden;
  - y se queda corta en las costuras: hay otra en «instrumental. · La responsabilidad».


**Sin arreglo.** Es una ficha y una decisión del director. Los caminos posibles —publicar el
recorte del documento en prosa y la cita del juez en tablas; exigir el centro; o declararla
aproximada en la pantalla— no se eligen aquí.

### ⚠️ B.312 — EL JUEZ PONE LAS CITAS DE LOS SOLAPAMIENTOS EN EL CAMPO DEL OTRO DOCUMENTO: 5 de 5 solapamientos, 0 de 3 contradicciones (arreglada el 02/10/2026; el cruce bajó de ESTABLE a OCASIONAL, 1 de 9 pasadas, no a cero)

**De dónde sale**: los ocho descartes de las dos sondas del 01/10, con su `lado`, que transcribe
el arquitecto de los logs del director. Cada cita se buscó en los textos de `corpus-pruebas/`
(extraídos con el comando de los registros de siembra), con `includes`, con la normalización de
`normalize()` y con `findBestMatch`. No hizo falta la base, ni créditos, ni los logs del 30/09.
- En las dos sondas, `nuevo` es el analizado (NOR-11 en la A, NOR-10 en la B) y `existente`, el
  candidato de esa pareja.

| # | Hash | Tipo | Lado donde la puso el juez | Documento donde ESTÁ la cita | ¿Coincide? |
|---|---|---|---|---|---|
| 1 | `[2bf4eefc]` | contradicción | existente (Normas_Frecuencia) | **no consta**: no está en NOR-11, ni en CLI-13, ni en NOR-10, ni en CLI-12; y Normas_Frecuencia no está en `corpus-pruebas/` | no consta |
| 2 | `[d04dbc76]` | solapamiento | existente (CLI-12) | **NOR-11**, literal | ❌ cruzada |
| 3 | `[976f6174]` | contradicción | nuevo (NOR-11) | en ninguno literal: es una reformulación. Su dato, **Chamberí, es de NOR-11** (`SIEMBRA_caso_control.md:57`; Retiro es de CLI-13, `:58`) | ✅ lado correcto |
| 4 | `[87b96c7c]` | solapamiento | existente (CLI-13) | **NOR-11**, literal | ❌ cruzada |
| 5 | `[a4ff676b]` | solapamiento | existente (CLI-13) | **NOR-11**, literal | ❌ cruzada |
| 6 | `[b51832b0]` | solapamiento | **ambos** | «usa el kit… de **tu** gabinete», puesta en nuevo (NOR-11), está en **CLI-13**; «procede a la recogida…», puesta en existente (CLI-13), está en **NOR-11**. Las dos literales | ❌❌ cruzadas las dos |
| 7 | `[1eb33774]` | contradicción | nuevo (NOR-10) | **NOR-10**, literal en sus primeros 200 caracteres (el resto no consta: el log corta) | ✅ lado correcto |
| 8 | `[283b244e]` | solapamiento | existente (CLI-12) | **NOR-10**, literal | ❌ cruzada |

**EL VEREDICTO: dos causas, o más, y no se mezclan.**
- ✅ **EL CAMBIAZO, CONFIRMADO EN LOS SOLAPAMIENTOS: 5 de 5.** Son la 2, la 4, la 5, la 6 (los dos
  lados) y la 8. Todas literales, y todas en el documento del OTRO lado.
  - Son ocho casos en vez de dos.
  - Los dos casos literales de B.299 (`[f049837e]` y `[75925931]`, entrada 10) también son
    solapamientos y se comportan igual: cada uno verifica sólo contra el otro documento. **Su
    `lado` no consta, y ya no hace falta para decidir.**
- ❌ **EN LAS CONTRADICCIONES NO HAY CAMBIAZO: 0 de 3.**
  - **La 3 está en su lado** y muere por otra cosa: **reformula**, no copia. «El punto de
    retirada centralizado concentra el material…» no está así en ningún documento. El
    contraejemplo del arquitecto, confirmado.
  - **La 7 está en su lado y es literal** en lo que se ve. Murió por algo que no se ve: la cita
    completa no consta. **Candidata, sin medir**: la frase del documento sigue «…recae siempre
    sobre esta figura.», y B.299 (entrada 1) ya tenía la anotación del juez «…recae siempre
    sobre esta figura [Director Clínico]». Una anotación entre corchetes al final rompe la cola:
    es la hipótesis (a) de B.299. El registro de B.299 (ii), longitud y paso, la puede
    confirmar en el próximo descarte de esta cita.
  - **La 1, no consta**: la tabla de Normas_Frecuencia_Recogidas no está en `corpus-pruebas/`.
- **Las sospechas del arquitecto, una a una**, por el registro con que están escritas:
  - la 6, la 2 y la 8: **confirmadas**;
  - la 7: **tumbada**, está en su lado;
  - la 3: **confirmada como contraejemplo**.

**EL DIAGNÓSTICO DE FONDO** (arquitecto, 02/10): **dos formatos hermanos con los campos en orden
distinto es una TRAMPA PUESTA, no un descuido del modelo.**
- La instrucción dice «En newDocSays y evidenceInNewDoc: copia LITERALMENTE un fragmento del
  DOCUMENTO NUEVO» (`lib/analysis/judge.ts:832`).
- Pero en el JSON de ejemplo, en la contradicción el nuevo va primero, y en el solapamiento va
  primero **`"evidence"`, que es el EXISTENTE**, con un nombre que no dice de qué lado es
  (`:851`).
- El modelo sigue el orden del ejemplo. Y el patrón medido es exactamente ése: falla donde el
  orden se invierte, y no donde se mantiene.

**LOS CAMINOS POSIBLES, SIN ELEGIR** (decide el arquitecto):
1. **Quitar la trampa**: el mismo orden en los dos formatos —el nuevo primero— y un nombre que
   diga el lado (`evidenceInExistingDoc` en el prompt, traducido a `evidence` al recibirlo, para
   no tocar el tipo guardado ni a sus lectores).
   - **Arriesga**: es un cambio de prompt, así que mueve la línea de base del arnés y puede
     mover otras cosas del juez. Se mide con caso rojo y verde, y antes y después.
2. **Comprobar cada cita contra los dos lados, y quedarse con el que case.**
   - **Arriesga**:
     - en un SOLAPAMIENTO, el texto suele estar en LOS DOS documentos, porque es lo que
       comparten; el lado quedaría ambiguo justo donde más falta hace;
     - esconde el error del modelo en vez de quitarlo; es «el comprobador lo detecta», que
       B.310 ya llamó taparlo;
     - y exigiría registrar en el hallazgo que hubo un cambio, o sería una decisión que nadie
       puede auditar.
- No son excluyentes: el (1) quita la causa, y el (2) sería una red. Si se usa, va declarada y
  registrada.


**POR QUÉ ES UNA MEDIDA Y NO UNA CORAZONADA** (arquitecto, 02/10): **la trampa de orden se leyó
en el código ANTES de buscar los ocho casos, y predijo exactamente qué clase de hallazgo saldría
cruzado** (los solapamientos, donde el orden se invierte) **y cuál no** (las contradicciones,
donde no). Los ocho casos lo confirmaron.
- Archivadas como el arquitecto las da por buenas: **su sospecha 7 era falsa** (está en su lado),
  y **la 3 era el contraejemplo que él mismo marcó** (Chamberí es de NOR-11).
- La anotación entre corchetes sigue **candidata**. Se mide con el registro de B.299 (ii) cuando
  esa cita vuelva a salir.

**❌ OPCIÓN RECHAZADA: comprobar cada cita contra los dos lados y quedarse con el que case**
(arquitecto, 02/10, con el motivo de Code). Las opciones rechazadas, con su razón, valen tanto
como la elegida:
- en un solapamiento el texto suele estar en los dos documentos, así que **el lado quedaría
  ambiguo justo donde hace falta decidirlo**;
- y **taparía el error en vez de quitarlo**.

**✅ CAMINO ELEGIDO: SE QUITA LA TRAMPA** (arquitecto, 02/10), con dos mitades:
- **(a) El mismo orden en los dos formatos.** Contradicciones y solapamientos piden sus dos
  campos en el mismo orden, sin excepción: el del nuevo primero, como ya hacen las
  contradicciones.
- **(b) Y cada campo nombra su lado.** Hoy `evidenceInNewDoc` lo dice y `evidence` no. Un par de
  campos en el que uno se llama por su lado y el otro no es una invitación a confundirlos, y el
  orden sólo era la segunda mitad de la trampa. Leer el formato tiene que bastar para no
  equivocarse.
- **Y un DETECTOR que observa sin corregir**: cuando una cita falla en el lado que le asignó el
  juez, se prueba también en el otro, y si allí verifica, el log dice **«cruzada»**. No se
  corrige, no se publica y no cambia ninguna decisión: sólo se cuenta. Es la versión auditable
  de la opción rechazada, y dirá si el cruce desaparece con el arreglo sin una campaña nueva.

**(c) ¿ESOS NOMBRES ESTÁN PERSISTIDOS? SÍ** (comprobado antes de escribir el arreglo, como pidió el
arquitecto):
- El análisis se guarda entero en `analysis_results.analysis`. Dentro van `judgments[]`
  (`FinalAnalysis.judgments`, `lib/analysis/types.ts:348`), cada uno con su
  `overlappingContent[]` y los campos `description`, `evidence` y `evidenceInNewDoc`
  (`lib/analysis/judge.ts:64-67`). Las SQL de estos días leen ese mismo `analysis->'judgments'`.
- **Los lectores en código**: `synthesize.ts`, que toma `evidenceInNewDoc` para el `textRef`
  del solapamiento; `pipeline.ts`, que mueve contradicciones a solapamientos con esos nombres;
  y `llm-boundary.ts`. **Ningún componente de pantalla** lee `evidence` ni `evidenceInNewDoc`
  directamente.
- **Por tanto, la forma guardada NO se toca**: el cambio de nombre vive sólo en el límite con
  el modelo.
  - El prompt pide el par en el orden nuevo y con nombres que digan su lado (por ejemplo,
    `evidenceInNewDoc` y `evidenceInExistingDoc`).
  - En el único punto donde se traduce la respuesta —`judge.ts:871`, el `.map()` de
    `overlappingContent`— se convierte a la forma de siempre (`evidence`,
    `evidenceInNewDoc`).
  - Para que `judge.ts` no crezca, la traducción iría a `llm-boundary.ts`, que es el límite con
    el modelo y ya sanea las contradicciones. **Los análisis archivados se siguen leyendo igual.**

**(d) ¿DISTORSIONA B.312 LAS CIFRAS DE SOLAPAMIENTO? El porcentaje NO; lo que distorsiona es SI se
publica.**
- **El `overlap=45%` del log es el número que escribe el propio juez**: se lee de su respuesta
  (`judge.ts:868`), el log lo imprime (`:892`) y la comprobación no lo toca. `fixQuotesInJudgment`
  lo deja pasar con `...judgment` (`:535-540`).
- La severidad sale de ese mismo número (`synthesize.ts:167`). Así que **el 35 → 65 % de B.295
  y el umbral de severidad NO están distorsionados**: no dependen de qué citas sobreviven.
- ⚠️ **PERO lo que SÍ distorsiona**: un solapamiento sólo se PUBLICA si sobrevive al menos una de
  sus citas (`synthesize.ts:155-158`: `judgeEntries.length > 0`). **Si el juez cruza TODAS las
  citas de los solapamientos de una pareja, esa pareja desaparece de la lista de solapamientos
  que ve el usuario, aunque el juez haya escrito un 45 %.**
  - Y cuando sobreviven algunas, la descripción publicada es la de las supervivientes, y la
    cita de referencia (`textRef`) la de la primera que sobrevive.
  - En la sonda A sobrevivieron 2 de los 5 solapamientos con CLI-13, y la pareja se publicó.
  - **Cuántas parejas desaparecieron del todo por esto, no consta**: haría falta comparar
    `overlapPercent > 0` con «ninguna cita superviviente» en los análisis guardados. Escrita
    el 02/10, PENDIENTE DE EJECUTAR: abajo, «La cara visible».

**Lo que se pierde hoy por esto**: en las dos sondas, 5 solapamientos literales que el juez vio
de verdad, y que se tiraron por estar en el campo equivocado.

**LA CARA VISIBLE** (arquitecto, 02/10): **le decimos al usuario que dos documentos se solapan, y no
le enseñamos ni un punto concreto.** Un solapamiento sin ninguna cita superviviente no se publica
(d), así que para el usuario eso es un «no hemos encontrado nada» falso.
- ⚠️ **Por tanto, cualquier frase de una ficha del piloto que diga «no se encontraron
  solapamientos» puede ser FALSA.** Se lee como «no se publicó ninguno», no como «no los había»,
  hasta que la SQL de abajo diga en qué parejas pasó.
- **La consulta, de sólo lectura y PENDIENTE DE EJECUTAR**: `SQL_B312_solape_sin_solapamiento.sql`.
  Cuenta, sobre los análisis archivados, las parejas con `overlapPercent` > 0 y ninguna línea en
  `analysis->'overlaps'`, separadas por veredicto del juez y por si en la pareja murió alguna cita.
  - **Da una COTA SUPERIOR, no la medida**: la base no guarda cuántos solapamientos EMITIÓ el
    juez (sólo el log, «RAW … N solapamientos»). No separa «emitió y se le murieron» de «no
    emitió ninguno».
  - Y `citaNoVerificable` junta contradicciones y solapamientos, así que tampoco atribuye la
    muerte a un solapamiento. Lo dice el propio fichero.
  - ⚠️ **Su cifra se cita SIEMPRE como «como mucho N»** (arquitecto, 02/10): una cifra que es un
    máximo y se lee como exacta es la misma trampa de siempre.

**(e) EL ARREGLO, HECHO EN CÓDIGO (02/10/2026), PENDIENTE DE MEDIR.** Un solo commit, con el visto
bueno del arquitecto a la (c).
- **El prompt** (`lib/analysis/judge.ts:826-827` y `:845`): el solapamiento pide
  `evidenceInNewDoc` primero y `evidenceInExistingDoc` después, el mismo orden que la
  contradicción, y cada campo nombra su lado. Las reglas de formato dicen lo mismo con los
  nombres nuevos.
- **La traducción, en la frontera** (`traducirSolapamientosDelJuez`, `lib/analysis/llm-boundary.ts:165`),
  llamada desde el único punto de traducción (`judge.ts:856`). Pasa `evidenceInExistingDoc` a
  `evidence`; **lo guardado no cambia**.
  - El nombre viejo `evidence` ya no se lee: lo que se pide y lo que se lee son lo mismo.
  - Lo ausente queda en cadena vacía, como el `.map()` de antes.
- 📌 **POR QUÉ AHÍ** (arquitecto, 02/10): **el límite con el modelo es justo el sitio donde se
  traduce.** Lo que se le pide se escribe para que el modelo no se equivoque, y lo que se guarda
  se queda como está. **Si hubiera que cambiar la forma guardada para mejorar un prompt, la
  frontera no estaría haciendo su trabajo.**
- **El detector** (`diagnosticoDelDescarte`, hoy en `lib/analysis/diagnostico-de-cita.ts:25`; nació en `coincidencia-de-cita.ts`): cuando
  una cita falla en su lado, se prueba en el otro. Si allí verifica, la línea de descarte añade
  `cruzada: la cita del nuevo está en el existente` (o al revés).
  - **El hallazgo se descarta igual**: sólo observa.
  - Vale para contradicciones y solapamientos, con la misma función.
- **`judge.ts` no crece: baja de 1.318 a 1.307 líneas.** Los diagnósticos de los dos bucles pasan a
  una línea cada uno, y el tipo de la respuesta deja `overlappingContent` como `unknown`, porque
  lo valida la frontera. `fixQuotesInJudgment` pasa a exportarse para poder probarla.
- **El rojo, visto antes de tocar** (`lib/analysis/citas-cruzadas.test.ts`, 9 casos). Contra el
  código de antes, exportando sólo `fixQuotesInJudgment`. **Fueron DOS CLASES DE ROJO, y sólo una
  cuenta** (precisión del arquitecto, 02/10):
  - ✅ **Rojo de FALLO — los tres del detector**: caían porque el log no decía «cruzada», con el
    código de antes delante. Ése prueba algo.
  - ❌ **Rojo de AUSENCIA — los cuatro de la frontera**: caían porque la función no existía
    todavía. **Eso no prueba nada del fallo.** Lo que hace de evidencia ahí es otra cosa: que **la
    forma guardada no cambia** (el tipo `DocumentJudgment` no se tocó y `evidence` sigue
    siendo el existente), y que **los controles negativos pasan con el código viejo y con el
    nuevo**.
  - Y **los dos controles negativos, en verde** antes y después: una cita inventada sigue
    fallando y no es «cruzada», y una bien puesta se verifica sin que el detector la toque.

  Después, 9 de 9. Suite: 1.795 de 1.795. Build local hasta «Collecting page data».
- **El coste, medido** con NOR-11 (14.437 caracteres, 15 trozos) contra NOR-10 (60.038, 67), 200
  repeticiones, sólo en el camino del descarte:

  | Pajar | Cita cruzada | Cita inventada, los dos lados |
  |---|---|---|
  | todos los trozos | +0,0 ms | +14,9 ms |
  | texto entregado | +0,8 ms | +25,5 ms |

  Una cita cruzada se encuentra al primer paso. El peor caso cuesta lo mismo que el
  `describir` que ya se hacía, por descarte, frente a segundos de cada llamada al juez.
- **Lo que depende del texto del prompt** (condición del arquitecto, con censo):
  - **ningún test lo compara literalmente**: `grep` de «cita literal del», «REGLAS DE FORMATO»,
    «copia LITERALMENTE» y «qué contenido concreto comparten» en `lib`, `app`, `worker`,
    `scripts`, `examen` y `claude` sólo da `judge.ts` y esta ficha;
  - **ningún contador de tokens**: `countTokens`, `estimateTokens` y `prompt.length` no salen en
    `lib`, `app` ni `worker`;
  - **los ficheros de ejemplo** (`examen/sinteticos/*.json`, `examen/resultados/*`) llevan
    `evidence` y `evidenceInNewDoc`: es la FORMA GUARDADA, que no cambia, así que no les afecta;
  - ⚠️ **lo que SÍ depende, y no es un fichero: la línea de base del arnés.** Es un cambio de
    prompt, y el arnés pasa después y una sola vez (puesto 2 del tablero).

**(f) EL FALLBACK DEL NOMBRE VIEJO (02/10/2026; sin él no se despliega; commit propio encima).**
- **El fallo que tenía (e)**: la frontera sólo leía `evidenceInExistingDoc`. Si el juez respondía
  con el nombre viejo, `evidence`, la cita del existente llegaba vacía y no verificaba nunca, y el
  solapamiento moría entero. **Un arreglo pensado para que sobrevivan más solapamientos podía hacer
  que no sobreviviera ninguno**, y no controlamos al modelo: sólo lo que le pedimos. Se había
  quitado un fallback determinista sin darse cuenta (regla del proyecto: retry con backoff y
  fallback determinista).
- **El arreglo, en la frontera** (`lib/analysis/llm-boundary.ts:165`): si no viene
  `evidenceInExistingDoc` con texto y sí `evidence`, se toma `evidence`. Si vienen los dos,
  manda el nuevo.
- **Y se registra, con su cuenta**: `frontera.solapamiento_con_nombre_viejo`, en el
  `discarded` de la pareja, que se guarda. La línea `RAW` del log lo dice también
  (`judge.ts:889`): «(N con el nombre viejo, evidence)». **Sin ese registro, el fallback taparía el
  fallo en vez de medirlo**: es lo que dirá si el nombre nuevo lo adoptó el modelo o lo sostenemos
  nosotros.
  - **Por qué en `discarded` y no en `pipelineCounters`**: es el canal que ya usa esta misma
    frontera (`frontera.topic_ausente` tampoco es un descarte). Llevarlo a los contadores de
    F-82 exige abrir una etapa del juez, y eso es del puesto de los contadores, no de aquí.
- 📌 **POR QUÉ ESTO NO ES «TAPAR EL ERROR»**, que es lo que se rechazó en la opción de los dos
  lados (arquitecto, 02/10): **ahí se adivinaba qué quiso decir el juez; aquí se lee un nombre que
  siempre significó lo mismo.** Traducir dos nombres del mismo campo es una frontera haciendo su
  trabajo; elegir un lado por el que case es adivinar.
- **El rojo, de FALLO esta vez**: con el código de (e), una respuesta con `evidence` daba
  `evidence: ''`; con el fallback, `'viejo'`. Se vio con una prueba que no depende de la forma
  de lo que devuelve la función, porque esa forma también cambió (ahora devuelve los solapamientos
  y su cuenta). Las pruebas del fichero: el nombre viejo se traduce igual y queda registrado; con
  el nombre nuevo no se registra nada; con los dos manda el nuevo; con el nuevo en blanco se toma
  el viejo. 11 de 11.
- **`judge.ts` sube 4 líneas, a 1.311**: sigue por debajo de las 1.318 de antes de B.312.

**(g) ¿«LA FORMA GUARDADA NO CAMBIA» ESTÁ COMPROBADO O RAZONADO? RAZONADO, con una comprobación de
tipos, y ninguna prueba sobre un análisis archivado** (pregunta del arquitecto, 02/10; sin
escribir la prueba):
- **No hay ninguna prueba que lea un análisis archivado y compruebe que sus solapamientos se
  siguen leyendo igual.**
  - Seis pruebas leen análisis guardados del examen (`examen/resultados/2026-09-27_*`, anteriores
    a B.312).
  - Leen `discrepancies`, `overlaps` (lo publicado) y los contadores. **Ninguna lee
    `judgments[].overlappingContent`** ni sus campos `evidence` y `evidenceInNewDoc`.
- **Lo que sí lo sostiene**:
  - el tipo guardado (`DocumentJudgment`, `lib/analysis/types.ts`) no se tocó, y el compilador
    comprueba contra él a todos sus lectores;
  - y la traducción sólo corre sobre la RESPUESTA DEL MODELO, no sobre nada que se lea de la base.

  Es una razón, no una medida.
- **Material para escribirla, cuando se pida**: esos ficheros del examen llevan `judgments` con
  `overlappingContent`, `evidence` y `evidenceInNewDoc` guardados.

**(g bis) AHORA COMPROBADO: LA PRUEBA DE LA EVIDENCIA ARCHIVADA (02/10/2026)**, a petición del
arquitecto. Sólo pruebas, sin tocar producto: `lib/analysis/evidencia-archivada.test.ts`.
- 📌 **PARA QUÉ VALE MÁS ALLÁ DE HOY: ES LA GUARDA DE TODOS LOS CAMBIOS DE PROMPT QUE VENGAN.** Cada
  vez que se mejore lo que se le pide al juez, esta prueba dirá si se ha roto la lectura de la
  evidencia archivada, que es el único sitio donde vive un mes de mediciones.
- **Lee análisis archivados de verdad**: los del examen del 27/09 en `examen/resultados/`,
  anteriores a B.312. Comprueba tres cosas:
  1. **El lector de producción rehace lo publicado.** `construirOverlaps`, que es el que lee
     `evidenceInNewDoc` para la cita de referencia, rehace desde los juicios guardados los
     solapamientos que se publicaron entonces: **65 de 65 idénticos**.
  2. **`evidence` es el existente y `evidenceInNewDoc` el nuevo.** Ninguna cita guardada está sólo
     en el documento del otro lado. Medido antes de escribir la aserción:

     | Campo | sólo en su lado | en los dos | sólo en el otro |
     |---|---|---|---|
     | `evidence` | 92 | 28 | **0** |
     | `evidenceInNewDoc` | 89 | 31 | **0** |

     - **Ciega para las tablas**: 91 citas por campo no están en ninguno de los dos textos
       extraídos, y las 91 son filas pintadas («a | b | c»). La prueba las salta.
  3. **La traducción del prompt no toca nunca lo que viene de la base**, y esto **no se puede
     probar con los valores**: un solapamiento guardado pasado por la traducción da los mismos
     valores, porque el nombre viejo es su fallback.
     - Lo prueba un **CENSO**: sólo `judge.ts` y `llm-boundary.ts` la nombran, y la única llamada
       es sobre `response.overlappingContent`, con `response` salido de `callLLMJson`.
     - Y un **control**: si alguna vez tocara algo guardado, los valores no cambiarían, pero la
       cuenta `frontera.solapamiento_con_nombre_viejo` sí, una por solapamiento.
- **Puede ponerse roja**: con `construirOverlaps` estropeado a propósito (la cita de referencia
  leyendo `evidence`), la (1) cae en rojo. Restaurado, 5 de 5.
- Lee disco y lleva su propio tope contra cuelgues, como manda `vitest.config.mts` para su clase.
  Tarda unos 7 s.

**Subido a `origin` el 02/10 (`ba8654a9`).** El despliegue de Vercel no lo ha visto Code.

**LAS PREDICCIONES DE LAS DOS SONDAS, escritas por el arquitecto el 02/10 ANTES de medir. Sin
veredicto.** Las sondas: dos análisis sueltos, NOR-11 y NOR-10, `0 ids de tanda`.
- **P-B312-1 · En los solapamientos DESAPARECE LA MARCA «cruzada»**: ninguno o casi ninguno de
  los descartes la lleva. Si sigue saliendo 5 de 5, quitar la trampa no era suficiente y el
  modelo cruza los campos por su cuenta.
  - **Se juzga con** las líneas `[judge] Solapamiento descartado en "…" […] (cita no verificable,
    lado=…; …)` (`lib/analysis/judge.ts:505`). La marca es `cruzada: la cita del … está en el …`.
  - **El denominador** son los solapamientos que emitió el juez: `… N solapamientos` de cada línea
    `[judge] RAW analizado=… candidato=…` (`judge.ts:884-890`).
- **P-B312-2 · APARECEN SOLAPAMIENTOS PUBLICADOS EN NOR-11 / CLI-13**, donde ayer murieron los
  cinco. Es la cara visible: el usuario ve por fin puntos concretos del solape que el juez ya
  decía que había.
  - **Se juzga con lo GUARDADO, no con el log**: en el análisis rápido no hay ninguna línea que
    imprima lo publicado. Es `analysis->'overlaps'` del análisis guardado, o la pantalla.
  - ⚠️ **PRECISIÓN DE CODE, para que decida el arquitecto: tal como está escrita, esta predicción
    YA SE CUMPLÍA AYER, así que hoy no puede fallar.**
    - En la sonda A, NOR-11 con CLI-13 emitió 5 solapamientos, y murieron 3. Son las `[87b96c7c]`,
      `[a4ff676b]` y `[b51832b0]` de la tabla de arriba.
    - **Sobrevivieron 2, y la pareja se publicó** (SONDA A en B.307; (d) de arriba).
    - Los cinco cruzados estaban repartidos en tres parejas:
      - 3 en NOR-11 con CLI-13;
      - 1 en NOR-11 con CLI-12 (`[d04dbc76]`), solape 15 % y su único solapamiento;
      - 1 en NOR-10 con CLI-12 (`[283b244e]`), también solape 15 % y su único solapamiento.
    - **Las que DISCRIMINAN** son esas dos últimas. Ayer no publicaron ningún solapamiento, y son
      justo la cara visible de B.312. En NOR-11 con CLI-13 lo que puede moverse es el número de
      puntos, de 2 hacia 5.
    - Si son sembradas o no, lo dice el registro de siembra, y se cuentan aparte.
- **P-B312-3 · LA MARCA «con el nombre viejo, evidence» NO APARECE**: el modelo adopta el nombre
  nuevo y la red de seguridad no tiene que trabajar. Si aparece, el nombre nuevo no se adoptó y
  lo estamos sosteniendo nosotros: entonces el fallback pasa de red a pieza permanente, con su
  ficha.
  - **Se juzga con** la línea `[judge] RAW analizado=… candidato=…` (`judge.ts:884-890`), que añade
    «(N con el nombre viejo, evidence)» sólo cuando pasa.
  - En lo guardado: `frontera.solapamiento_con_nombre_viejo` en el `discarded` de cada juicio.
- **P-B312-4 · LAS CONTRADICCIONES NO CAMBIAN: 2 publicadas en NOR-11 y 0 en NOR-10.**
  - El cambiazo de campo no les afectaba (0 de 3, medido). Si cambian, algo que no entendemos se
    ha movido.
  - ⚠️ **UN «0 EN NOR-10» ES LO ESPERADO, NO UNA REGRESIÓN.** Su causa es B.313: el juez redacta.
  - **Se juzga con lo GUARDADO**: `analysis->'discrepancies'`, o la pantalla. La línea
    `[…] Verificador: N hallazgos → M confirmados` (`lib/analysis/pipeline.ts:1022`) es una
    aproximación: cuenta lo que sale de la cascada, no lo publicado.
- **REGLA DE LECTURA** (arquitecto, 02/10): **sembradas y parejas sin auditar se cuentan aparte.**
  Los solapamientos que salgan con `Normas_Frecuencia_Recogidas`, o con cualquier pareja que no
  esté en un registro de siembra, no son aciertos: son de naturaleza no determinada.

**LA MEDIDA, MITAD NOR-11 (02/10/2026).** Logs del director, transcritos por el arquitecto; Code no
los ha visto. Dos pasadas de NOR-11 solo, a las 08:56:43 y a las 08:58:08, con el interruptor
encendido y `0 ids de tanda` las dos.
- 📌 **LAS DOS PASADAS SON IDÉNTICAS EN TODO**: los mismos 8 candidatos con los mismos scores, los
  mismos regímenes, los mismos porcentajes, los mismos hallazgos y el mismo descarte. **Es un dato
  de estabilidad**: hasta ahora se medía de a una.
- Candidatos: 8. Rerank: 3. Latencia: 23.311 y 22.733 ms.
  - **CLI-13, `pareja_entera`** (14704/14704 y 9817/9817): solape 45 %, 3 contradicciones y 5
    solapamientos. **Un solo descarte**: `[976f6174]`.
  - **CLI-12, `corte_honesto`** (14704/14704 y 2959/55135): solape **5 %**, 0 contradicciones y
    **3 solapamientos, ninguno descartado**.
  - **Normas_Frecuencia_Recogidas, `sin_fuente_comun`**: solape 0 %, 0 y 0.
  - Verificador: 2 hallazgos → 2 confirmados. Publicadas `[e7785038]` (el plazo) y `[5a59c682]`
    (el color).

**LOS VEREDICTOS** (arquitecto, 02/10):
- ✅ **P-B312-1: ACERTADA.** Cero descartes de solapamiento, y **la marca «cruzada» no aparece ni
  una vez**: ayer murieron 5 de 5; hoy, 0. **Quitar la trampa bastó**: el modelo no cruzaba los
  campos por su cuenta, los cruzaba porque se los pedíamos al revés.
- ✅ **P-B312-3: ACERTADA.** La marca «con el nombre viejo» no aparece: el modelo adoptó
  `evidenceInExistingDoc`.
  - 📌 **EL FALLBACK SE QUEDA IGUAL.** Una red que no trabaja sigue siendo necesaria, porque el
    modelo puede cambiar de comportamiento entre versiones sin avisar. El día que lo haga, el
    contador lo dirá, en vez de que mueran todos los solapamientos en silencio.
- ✅ **P-B312-4: ACERTADA EN LA MITAD DE NOR-11**: 2 publicadas, las mismas de ayer. **PENDIENTE
  la mitad de NOR-10**, que el director aún no ha lanzado.
- ✅ **P-B312-2: SE CUMPLE EN SU FORMA FUERTE.**
  - Los solapamientos vivos pasan **de 2 a 5 con CLI-13** y **de 0 a 3 con CLI-12**, que era la
    pareja que podía fallar.
  - Se archiva con la precisión de Code al lado: tal como estaba escrita ya se cumplía ayer, y
    **la que de verdad medía algo era la de CLI-12**.
  - ⚠️ **«Vivos» no es «publicados»**: el log no imprime lo publicado en el análisis rápido. Por
    el código, los 8 vivos llegan a la pantalla: los solapamientos no pasan por el verificador
    (`pipeline.ts:176`), y `construirOverlaps` publica una línea por pareja con todos sus puntos.
    **Pero la pantalla no se ha mirado todavía.** Ese «de 2 a 8» es una cifra por código, no
    medida, hasta que el director la vea.
  - 🔎 **LO QUE DEBE VERSE EN PANTALLA, para no leer un «2» como un fallo**
    (`components/AnalysisModal.tsx:326-359`):
    - el modal pinta **UNA entrada por pareja**, no una por punto: todos los puntos de la pareja
      van unidos en su descripción;
    - y no enseña las citas: sólo la descripción y la gravedad.
    - Lo esperado, por código: en «Duplicados», **2 entradas**:
      - CLI-13, con 5 puntos en su descripción y gravedad «media» (45 %);
      - CLI-12, con 3 puntos y gravedad «baja» (5 %).
    - Ayer, por el mismo cálculo, sólo la de CLI-13, con 2 puntos.

**LA GANANCIA DE B.312, MEDIDA Y NO ESTIMADA**: en un análisis, **seis puntos de solapamiento que
el usuario no veía** (de 2 a 8), con la reserva de la pantalla de arriba.
- ⚠️ **PRECISIÓN DE CODE, por la regla de lectura de arriba: de esos seis, TRES SON DE UNA PAREJA
  SIN AUDITAR.**
  - **NOR-11 con CLI-12 no está en ningún registro de siembra.** Los sembrados de CLI-12 son con
    NOR-10 (`SIEMBRA_caso_control.md` y `SIEMBRA_corpus_ampliado.md`, §1).
  - Así que sus 3 solapamientos son **de naturaleza no determinada**: que sobrevivan dice que la
    trampa se quitó, no que sean aciertos.
  - Los otros 3 son de NOR-11 con CLI-13, la pareja del caso de control.
- ⚠️ **Y UNA CIFRA DE AYER, CORREGIDA**: el encargo decía que los solapamientos de CLI-12 pasaron
  «de 2 a 3». **El registro de ayer dice 1** (SONDA A, en B.307: «Solapamiento 15 %, 0
  contradicciones y 1 solapamiento tirado»). La subida es de 1 a 3.

**LO QUE SE MOVIÓ SIN SER EL OBJETIVO: el solape de NOR-11 con CLI-12 bajó del 15 % al 5 %**, y
sus solapamientos emitidos subieron de 1 a 3. Nadie lo predijo, y no es un fallo: se cambió el
prompt, y lo que se le pide al modelo cambia lo que contesta. Es el primer caso medido de la
regla de la línea de base (tablero, puesto 2).

**LO QUE FALTA PARA CERRAR B.299 Y B.312:**
- el log de **NOR-10 solo**, que el director aún debe lanzar;
- y **lo publicado en pantalla** del análisis de NOR-11, que el log no imprime.

Con esas dos cosas, B.299 y B.312 se cierran y el tablero pasa a B.313.

**LA MEDIDA, MITAD NOR-10 (02/10/2026).** Logs del director, transcritos por el arquitecto; Code no
los ha visto. Dos pasadas de NOR-10 solo, a las 09:01:54 y a las 09:02:28, `0 ids de tanda` las dos.
- **NO SON IDÉNTICAS.** Coinciden los 5 candidatos, el rerank a 2, los regímenes y los caracteres
  entregados. **Lo que cambia es lo que escribió el juez.**
- **Pasada 1** (21.368 ms):
  - **CLI-12, `corte_honesto`** (37143/66801 y 2857/55135): solape **15 %**, 1 contradicción y
    **3 solapamientos, ninguno descartado**.
    - `[1eb33774]` «Autoridad para retirar autoclave…», **DESCARTADA**: lado=nuevo, **longitud=244,
      paso=cola_demasiado_lejos**, pajar=entregado_texto.
  - **CLI-13, `corte_honesto`** (30183/66801 y 9817/9817): solape 0 %, 0 y 0.
  - Verificador: 0 → 0. **Publicadas: 0 contradicciones.**
- **Pasada 2** (20.309 ms):
  - **CLI-12**: solape **8 %**, 1 contradicción y **2 solapamientos emitidos**.
    - `[98277f67]` «Autoridad para retirar autoclave de servicio tras fallo de c…» → **CONFIRMADA
      POR JUICIO Y PUBLICADA**.
    - 1 solapamiento descartado, `[cd5cb1f1]`: lado=nuevo, **longitud=175,
      paso=cola_demasiado_lejos**. Sin la marca «cruzada».
  - **CLI-13**: solape 0 %, 0 y 0.
  - Verificador: 1 → 1. **Publicadas: 1 contradicción.**
  - **Resuelto (arquitecto, 02/10)**: la línea que trae el director es la `RAW`, y ésa imprime
    `rawJudgment.overlappingContent.length`, lo que el juez EMITIÓ antes de la comprobación
    (`lib/analysis/judge.ts:884-890`, antes de `fixQuotesInJudgment` en `:905`). Así que, con
    CLI-12:
    - pasada 2: **2 emitidos, 1 descartado, 1 sobrevivió**;
    - pasada 1: **3 emitidos, 0 descartados, 3 sobrevivieron**.

🏁 **UN HITO, Y SU RESERVA Y SU GRIETA VAN DELANTE:**
- 🔥 **LA GRIETA (02/10, 13:17:49, B.311): LA SEMBRADA A DE NOR-10 NUNCA SE HA PUBLICADO CON UNA
  CITA LITERAL, Y LAS DOS VECES QUE SE PUBLICÓ LA CITA NO EXISTÍA EN EL DOCUMENTO.** Las dos
  publicaciones (09:02 y 13:17) llevan la misma cita del lado NOR-10, de 434 caracteres. Pasó por
  cabeza y cola, y es el final de dos frases cosidas, con 159 y 117 caracteres quitados (B.311).
- ⚠️ **RESERVA: 2 DE 4 PASADAS** (actualizada el 02/10 con la de las 13:17:49, que la publicó). Antes,
  1 de 3 (con la de las 09:25). Por la regla de
  estabilidad (B.295: 5/5 estable-acierto, 0/5 estable-fallo, 1 a 4 inestable), es **INESTABLE, no
  acierto**. Lo demostrado es que **puede** publicarse, no que se publique.
  - **La tercera pasada, 09:25**: CLI-12 emitió 1 contradicción, y se descartó: `[c2998cd8]`,
    longitud 241, `cabeza_sin_cola`. Verificador 0 → 0. **Publicadas: 0.** Los tres solapamientos
    de esa pareja, verificados y literales.
  - **El mismo hallazgo, con una cita distinta cada vez**: 244 caracteres con
    `cola_demasiado_lejos` y 241 con `cabeza_sin_cola`. Las causas candidatas, en B.313.
  - **Y ESO EXPLICA LA INESTABILIDAD** (arquitecto, 02/10): las dos veces que se publicó, a las 09:02
    y a las 13:17, fue con el mismo par de citas, `[98277f67]`. **Cerrado por construcción**
    (arquitecto, 02/10): el hash es `hashCitationPair` (`lib/analysis/llm-boundary.ts:210-214`), un
    hash DEL PAR de citas, así que el mismo hash es el mismo par.
    - Con los dos matices que la propia función impone, y que no cambian nada aquí: compara las
      citas en minúsculas y con los espacios colapsados (`:211`), así que dos citas que sólo
      difieran en eso dan el mismo hash; y guarda 8 caracteres hexadecimales de un sha256 (`:213`),
      con una colisión posible en teoría y despreciable entre los pocos hallazgos de un día.
    - Cuando el juez escribe una cita que la tolerancia
    salva, publica; cuando no, muere. **No es que a veces lo encuentre: es que a veces la puerta le
    deja pasar.**
- **EL HITO: por primera vez, la sembrada A de los cargos se publica por la ruta por defecto, sin
  tanda.** Es un rostro de la A (la contradicción A, `SIEMBRA_corpus_ampliado.md:51-62`, cuyo conflicto incluye «retirar un autoclave de servicio»), y
  sale con el corpus haciendo su trabajo solo.
- **El control negativo sigue limpio en las dos**: NOR-10 con CLI-13, 0 %.

📌 **HALLAZGO DE PRODUCTO, nombrado y SIN arreglo: CON NOR-10, DOS PASADAS SEGUIDAS DAN AL USUARIO
RESULTADOS DISTINTOS.**
- Con los mismos candidatos, el mismo rerank, los mismos regímenes y los mismos caracteres
  entregados:
  - la contradicción sembrada se publica en unas pasadas y en otras no (0, 1, 0 y 1 en cuatro);
  - y los solapamientos vivos con CLI-12 son 3 en una y 1 en la otra.
- Dibujan lo mismo: **lo que cambia entre pasadas es lo que escribe el juez**, y el usuario lo ve
  como dos respuestas distintas a la misma pregunta.

✅ **B.312 CERRADA (02/10/2026): arreglada, desplegada y medida. Cuatro pasadas, cero cruces.**
- ⚠️ **CORREGIDO EL 04/10: «cerrada» no era la palabra.** El detector saltó por primera vez en
  producción el 03/10 a las 23:38:50 (programa viejo, línea de base de B.313): «Solapamiento
  descartado [a4ff676b] (cita no verificable, lado=existente; existente: longitud=170,
  paso=sin_cabeza, cruzada: la cita del existente está en el nuevo)».
  - **Hizo lo que se diseñó**: lo vio, lo dijo y no lo corrigió; el hallazgo se descartó. Darle la
    vuelta sería adivinar qué quiso decir el juez.
  - **La cuenta honesta, con banda**: el cruce de campos era 5 de 5 antes del arreglo; después va **1
    de 9 pasadas** (0 de 4 el 02/10 y 1 de 5 el 03/10). **El arreglo lo bajó de estable a ocasional,
    no a cero.**
  - **Actualizada el 04/10** (arquitecto): una cruzada más, `db287ea4`, en la pasada 2 de NOR-11 del
    programa nuevo. **Banda acumulada desde el arreglo: 2 de 14.**
  - ⚠️ **Precisión de Code sobre el denominador**: el 14 suma las 4 pasadas del 02/10 (de los dos
    documentos) y sólo las 5 de NOR-11 del 03/10 y del 04/10, cuando esos días hubo 11 cada uno (6 de
    NOR-10 y 5 de NOR-11). **Si en las de NOR-10 no hubo ningún cruce** —los logs transcritos no
    mencionan ninguno—, **la cuenta sobre todas las pasadas es 2 de 26.** Lo dicen los logs de NOR-10.
- En las cuatro pasadas de hoy, dos de NOR-11 y dos de NOR-10, **la marca «cruzada» no aparece ni
  una vez, y el nombre viejo del campo tampoco.** Ayer morían cruzados 5 de 5; hoy, ninguno.
- En NOR-10 con CLI-12, que ayer perdió por el cruce su único solapamiento, hoy sobreviven **3 en
  la primera pasada y 1 en la segunda**.
- **P-B312-1 y P-B312-3: ACERTADAS, confirmadas en cuatro pasadas.**
- 📌 **LO QUE FUE: EL MODELO NO CRUZABA LOS CAMPOS POR SU CUENTA. LOS CRUZABA PORQUE SE LOS
  PEDÍAMOS AL REVÉS. El fallo era nuestro, de principio a fin.**
- **LA GANANCIA DE B.312, escrita como la fija el arquitecto**: en NOR-11, **seis puntos más
  publicados, de los que tres son de pareja auditada y tres de naturaleza no determinada**. «De 2
  a 8» es una cifra **POR CÓDIGO, no medida**, hasta que se mire la pantalla de NOR-11.
- ✅ **LA PANTALLA, MIRADA (director, 02/10): dos entradas, una por pareja, con los puntos unidos en
  la descripción y sin citas**, como se leyó en el código. La predicción de Code, acertada.
- ⚠️ **Y la ganancia, recortada por lo que se ve en ella** (B.315): de los 6 puntos recuperados, **3
  son contenido** (CLI-13) y **3 son solapamientos genéricos** que el prompt ya prohíbe (CLI-12).
  De los 8 publicados, 5 y 3.

❌ **P-B312-4: MAL FORMULADA, no fallada a secas.** Predijo 0 contradicciones en NOR-10, y salió 0 y 1.
- **El motivo es de protocolo, no la cifra** (arquitecto, 02/10): se predijo un número exacto de
  hallazgos a partir de UNA pasada, ignorando la regla de estabilidad. **Una predicción sobre la
  salida de un modelo sin banda de estabilidad no se puede ni acertar ni fallar con honradez.**
- Regla nueva, al protocolo (`claude/Protocolo_Harness_Tasas.md`, «LA QUINTA PIEZA»): **toda
  predicción sobre cuántos hallazgos saldrán lleva su banda —«en N de M pasadas»— o no se
  escribe.**
- La mitad de NOR-11 (2 publicadas, las mismas) queda escrita, con la misma reserva: es otra
  predicción sin banda, que acertó en 2 de 2.


### 📋 B.313 — EL JUEZ NO COPIA, REDACTA: la enfermedad de las contradicciones (SIN arreglo; UNA sola enfermedad, el juez cose para que rime; 02/10/2026)

**El diagnóstico, en una frase** (arquitecto, 02/10): **el juez no copia, redacta.** Es lo que
mata las citas de las CONTRADICCIONES. Las de los solapamientos mueren de otra cosa: el cambio
de campo de B.312.

**Las dos formas, una medida y otra candidata** (sondas del 01/10; B.312). La reformulación tiene además causa identificada en el registro, abajo:
- **REFORMULA — medido** (`[976f6174]`, «Ubicación del punto de retirada centralizado»): «El
  punto de retirada centralizado concentra el material de las tres clínicas, ubicado en la
  clínica de Chamberí» **no existe así en ninguno de los dos documentos**. El dato es de NOR-11;
  la frase, del juez.
- **ANOTA — candidata, sin medir, y FUERA DE CARRERA desde el 02/10** (la contesta el dato guardado, abajo) (`[1eb33774]`, la A de los cargos): una cita por lo demás
  literal en NOR-10 a la que el juez añadiría «[Director Clínico]» al final.
  - La frase del documento sigue «…recae siempre sobre esta figura.», y B.299 (entrada 1) ya
    tenía la forma anotada.
  - La cita completa no consta. El registro de longitud y paso de B.299 (ii) lo dirá cuando
    vuelva a salir.
  - ⚠️ **Sigue CANDIDATA** a 02/10: es de NOR-10, y NOR-10 no se ha vuelto a medir.

**🔎 LA PRIMERA MEDIDA CON CAUSA IDENTIFICADA (02/10/2026)**: ya no es sospecha. El registro de
B.299 (ii) hizo su trabajo en la primera ocasión. En las dos pasadas de NOR-11 de B.312, el único
descarte que queda es éste:
- `[976f6174]` «Ubicación del punto de retirada centralizado», lado=nuevo, **longitud=111,
  paso=cabeza_sin_cola, pajar=entregado_texto (0 filas visibles)**.
- **`cabeza_sin_cola` es la reformulación, medida**: el principio de la cita está en el texto
  entregado al juez, y el final no.
  - No es un problema de pajar: `entregado_texto` dice que se buscó donde debía, en lo que el juez
    leyó.
  - Ni de trozos: el analizado se entregó contiguo.
  - **Es que esa frase, tal como el juez la escribió, no existe.**
- Cuadra con lo medido el 02/10 contra el texto extraído (arriba, REFORMULA): no está así en
  ninguno de los dos documentos.

**📊 EL PATRÓN DEL 02/10, Y CÓMO SE DECIDE** (las cuatro pasadas de B.312). Tres citas muertas, con su
longitud y su paso:

| Cita | Pasada | Longitud | Paso |
|---|---|---|---|
| `[976f6174]` | NOR-11, las dos | 111 | `cabeza_sin_cola` |
| `[cd5cb1f1]` | NOR-10, pasada 2 | 175 | `cola_demasiado_lejos` |
| `[1eb33774]` | NOR-10, pasada 1 | 244 | `cola_demasiado_lejos` |

- **QUÉ DICE EL PASO, y qué no** (`lib/analysis/coincidencia-de-cita.ts`, `buscarCita`):
  - Una cita sólo llega a la cabeza y la cola si **no está en el texto, ni literal ni
    normalizada**. Eso queda probado en las tres.
  - `cola_demasiado_lejos` dice además que la cabeza (sus 20 primeros caracteres normalizados) y
    la cola (los 20 últimos) están en el texto, en orden, pero a tres veces la longitud de la cita
    o más.
  - ⚠️ **Es ambiguo**: la cabeza se busca sólo en su PRIMERA aparición. Así que puede ser que el
    juez cambiara el medio, o que esa cabeza aparezca antes en otro sitio del texto.
  - 📌 **EL PASO NOMBRA DÓNDE SE RINDIÓ LA BÚSQUEDA, NO POR QUÉ** (corrección del arquitecto a su
    propia lectura, 02/10: la había traducido por «el medio no coincide»).
  - **Consecuencia: la hipótesis de la longitud no se puede contestar sólo con el paso.** La tabla
    de longitudes sigue valiendo para ella; para separar las dos causas de
    `cola_demasiado_lejos` hace falta algo más.
  - **Qué faltaría, y qué cuesta** (respuesta de Code, sin hacer): en ese paso, y sólo en él,
    probar TODAS las apariciones de la cabeza —no sólo la primera— y anotar el tramo más corto
    hasta su cola, dividido por la longitud de la cita.
    - **Si ese cociente baja de 3**, la búsqueda se rindió por una cabeza repetida, y la cita
      habría pasado por cabeza y cola. **Eso no sería B.313: sería un defecto del comprobador.**
    - **Si no baja de 3**, la cabeza y la cola están de verdad lejos: el juez juntó dos sitios
      distantes en una sola cita.
    - **En cálculo es barato**: unos `indexOf` sobre el texto normalizado, que ya está calculado,
      y sólo en las citas que fallan por ese paso.
    - **Lo caro es el sitio**: `lib/analysis/coincidencia-de-cita.ts` está en 399 líneas, y el tope
      es 400. Añadirlo obliga a partir antes el fichero.
    - **Partido el 02/10** para guardar lo descartado: los diagnósticos de log se fueron a
      `lib/analysis/diagnostico-de-cita.ts`, y `coincidencia-de-cita.ts` bajó a 362 líneas.
- **HIPÓTESIS DEL ARQUITECTO, SIN MEDIR Y NO CAUSA: el juez deja de ser literal cuando la cita se
  le alarga.**
  - El prompt **ya le pide «Máximo 1 frase por cita»** (`lib/analysis/judge.ts:834`; era la `:831` antes de los cambios del 02/10). Si la
    hipótesis se sostiene, no haría falta una regla nueva, sino que cumpla la que tiene.
  - ~~Que la cita de 244 caracteres lleve «dos rayas en medio».~~ **RETIRADO** (arquitecto, 02/10): no
    se puede afirmar con el log cortado a 200 caracteres.
- **LA MEDICIÓN QUE LA DECIDE, ya puesta** (02/10): el registro escribe la longitud y la vía
  **también cuando la cita PASA**. Hasta ahora sólo se escribía al fallar: se tenía el numerador y
  no el denominador.
  - Las líneas nuevas son «[judge] Contradicción verificada en …» y «[judge] Solapamiento
    verificado en …».
  - Llevan, por lado, `longitud=N, paso=X, pajar=Y`. La vía es `literal`, `normalizada`,
    `cabeza_y_cola` o `segmentos_de_fila`.
  - Sólo números y nombres de paso, sin texto del cliente.
- 📌 **ESCRITO ANTES DE MEDIR: QUÉ LA TUMBA.** Con dos análisis más, la hipótesis se contesta con
  una tabla de longitudes.
  - **Si las citas que PASAN también son largas** —del orden de las 175 y 244 que mueren—, **la
    hipótesis CAE y la causa es otra.**
  - Si las que pasan son cortas y las largas mueren, se sostiene, y el arreglo es del prompt: que
    cumpla «1 frase por cita».

**📊 LA TABLA DE LONGITUDES, MEDIDA (02/10/2026).** Dos pasadas con el registro nuevo, a las 09:24
(NOR-11) y a las 09:25 (NOR-10), `0 ids de tanda`. Logs del director, transcritos por el arquitecto;
Code no los ha visto.
- **LAS 22 CITAS QUE PASARON, TODAS CON `paso=literal`.** Ninguna necesitó la normalizada, ni la
  cabeza y cola, ni los segmentos.

  | Pareja | Longitudes de las que pasaron |
  |---|---|
  | NOR-11 / CLI-12 | 42 · 56 |
  | NOR-11 / CLI-13 | 154 · 128 · 185 · 195 · 235 · 155 · 100 · 123 · 50 · 127 · 187 · 117 · 100 · 63 |
  | NOR-10 / CLI-12 | 209 · 166 · 124 · 106 · 192 · 170 |

- **Las que FALLARON**: 111 (`[976f6174]`, `cabeza_sin_cola`) y 241 (`[c2998cd8]`, `cabeza_sin_cola`).
- ❌ **LA HIPÓTESIS DE LA LONGITUD, FALLADA** (la cuarta predicción fallada del arquitecto esta
  semana). Falsa, y con margen: la más larga que pasó mide **235**, más del doble que la más corta
  que falló. **La longitud no es la variable.**
- ✅ **LO QUE LA TABLA SÍ ESTABLECE: EL JUEZ COPIA LITERALMENTE.** 22 de 22, al primer intento y sin
  aproximaciones, en estas dos pasadas. No es un juez descuidado con las citas: copia bien **salvo en
  dos hallazgos concretos**, y son los mismos en seis pasadas.

**🧪 LA HIPÓTESIS DEL REPARTO, Y SU CRITERIO, ESCRITOS ANTES DE MEDIR** (02/10/2026). Hipótesis del
arquitecto, sin medir y NO causa: **el juez compone cuando el dato que encontró no vive en una sola
frase del documento**, y entonces no puede citarlo literal, porque esa frase no existe.
- **Qué se mide**, offline, sobre los textos de `corpus-pruebas/`, extraídos con `extractText`:
  - **Frase**: el texto se parte por un punto, un signo de interrogación o exclamación, o un salto
    de línea, seguidos de espacio.
  - **Trozos literales de una cita**: de izquierda a derecha, el tramo más largo de la cita
    (normalizado con `normalize()`) que aparece en el documento normalizado, con 15 caracteres o
    más. Lo que no aparece se salta.
  - **En qué frases cae**: cada trozo, en su primera aparición en el documento.
  - **Repartida** = sus trozos caen en dos frases distintas o más. **En una frase** = todos en la
    misma.
- **Las citas que se miden:**
  - **las que FALLAN**:
    - `[976f6174]`, con su texto entero (111 caracteres, archivado en B.299);
    - la del autoclave (`[1eb33774]` / `[c2998cd8]`): **su texto no lo tiene Code**. Se mide dónde
      viven en NOR-10 los tres datos que le atribuye el arquitecto —la firma de los registros
      trimestrales, la decisión de retirar un autoclave y que no es delegable—, buscados por sus
      palabras. **Es una medida más débil, y se dice.**
  - **las que PASAN**: las 22 del 02/10 sólo dejaron su longitud. La muestra son las citas
    verificadas que guardan los análisis archivados del examen del 27/09 en las mismas parejas:
    NOR-10 con CLI-12 (caso P1) y NOR-11 con CLI-13 (caso P2), de los dos lados. **Son de antes de
    B.312, con el prompt anterior.**
- **QUÉ LA CONFIRMA**: las que fallan, repartidas; las que pasan, en una frase.
- **QUÉ LA TUMBA** (el arquitecto, 02/10): **si alguna de las que pasan también está repartida, la
  hipótesis cae.**
  - Y una lectura que se nombra ahora para que no se invente después: una cita literal que cruza
    de una frase a la SIGUIENTE, en orden, cuenta como repartida por este criterio. Si eso pasa,
    la hipótesis del arquitecto cae igual. Que «contiguas» lo explicara sería **otra** hipótesis,
    nueva, y no la salvaría.

**🧪 EL RESULTADO DE LA HIPÓTESIS DEL REPARTO (02/10/2026), con el criterio de arriba, escrito antes y
commiteado antes de medir (`b9429538`).**
- **Las que PASAN**: 24 citas distintas de los análisis archivados de P1 y P2.
  - 21 caen en una frase.
  - **3 caen en DOS frases, contiguas**: dos citas de CLI-13 («Aplica por igual en las tres
    clínicas de la red. Si cambias de centro…», 185 y 232 caracteres) y una de NOR-11 («Ámbito de
    aplicación: Clínicas Dentavia Chamberí, Salamanca y Retiro», 68). Son literales que cruzan de
    una frase a la siguiente.
- ❌ **Por el criterio escrito antes de medir, LA HIPÓTESIS DEL REPARTO CAE**: hay citas que pasan y
  están repartidas.
- **Las dos que FALLAN, una a una**, y no se parecen:
  - **`[976f6174]`, Chamberí: REPARTIDA, en dos frases NO contiguas de NOR-11.**
    - «el punto de retirada centralizado concentra el material de las tres clínicas» es literal
      de la frase 77 («Dado que el punto de retirada centralizado concentra el material…»).
    - «ubicado en la clínica de Chamberí» es literal de la frase 72 («El gestor autorizado recoge
      los residuos de las tres clínicas en un punto de retirada centralizado, ubicado en la clínica
      de Chamberí, desde donde…»).
    - **El juez cosió dos frases separadas por cuatro.** Las dos mitades son literales; lo que no
      existe es la costura.
  - **El autoclave (`[1eb33774]`, 244; `[c2998cd8]`, 241): sus tres datos viven en UNA SOLA FRASE de
    NOR-10**, la 32, de **340 caracteres**:
    - «El Director Clínico puede delegar funciones operativas del día a día en el personal auxiliar
      de esterilización, pero la responsabilidad última —incluida la firma de los registros de
      auditoría trimestral y la decisión de retirar del servicio un autoclave que no supere un
      control biológico— no es delegable y recae siempre sobre esta figura.»
    - **Esta cita no encaja en la hipótesis**: el dato no está repartido, y aun así falla.
    - ⚠️ **Medida débil, y se dice**: el texto de la cita no lo tiene Code. Se buscaron los tres datos
      por sus palabras. «Delegable» sólo sale en esa frase. «Trimestral» y «retirar … autoclave» salen
      en más, pero la única frase con los tres es ésa.
    - **Y las «dos rayas» que el arquitecto retiró están en la FRASE del documento**: la cita de 241
      a 244 caracteres sale de una frase de 340 con un inciso entre rayas.
- **LO QUE QUEDA, nombrado y NO causa** (las dos son hipótesis nuevas, no salvan la del
  arquitecto):
  - **Chamberí cose dos frases NO contiguas.** Las tres citas que pasan cruzando de frase cruzan a
    la SIGUIENTE. Es la hipótesis de la contigüidad que el criterio nombró antes de medir, y la
    sostiene un caso.
  - **El autoclave falla DENTRO de una sola frase.** Encaja la candidata de arriba, ANOTA —«…recae
    siempre sobre esta figura [Director Clínico]» (B.299, entrada 1)—: una anotación al final
    rompe la cola, y que el paso cambie entre pasadas (`cola_demasiado_lejos` con 244 y
    `cabeza_sin_cola` con 241) encaja con una anotación que el juez escribe distinta cada vez.
    **Sin medir.**
- **QUÉ DECIDE EL AUTOCLAVE**: el FINAL de su cita. El log del descarte imprime los primeros 200
  caracteres, y una cita de 241 se queda sin sus últimos 41, que es justo donde estaría la
  anotación. Imprimir también los últimos caracteres de una cita descartada lo diría. **Ni se
  decide ni se hace aquí.**
- **LOS DOS ARREGLOS QUE APUNTA EL ARQUITECTO, medidos contra estos casos y SIN elegir**:
  1. **Dos citas por lado.**
  2. **Una cita que sea la unión de dos tramos literales del mismo documento, declarada como
     tal.**
  - Con Chamberí, los dos funcionarían: sus dos mitades son literales.
  - Con el autoclave, por lo medido, no harían falta: su dato está en una sola frase. Lo que lo
    salva depende de su final, que no consta.


❌ **LA HIPÓTESIS DEL REPARTO: FALLADA** (arquitecto, 02/10), por su propio criterio, escrito y
commiteado antes de medir (`b9429538`). Es la cuarta hipótesis fallada del arquitecto esta semana.
- 📌 **LO QUE DICE DEL MÉTODO**: **las cuatro cayeron antes de que nadie construyera nada encima,
  porque cada una venía con su criterio de caída escrito primero.** Una hipótesis con su falsación
  escrita es barata; sin ella, cada una habría sido un arreglo mal dirigido.

**🧬 B.313 ES UNA SOLA ENFERMEDAD (02/10/2026, con la cita publicada del autoclave, B.311).** La separación
en (A) y (B) de aquí abajo queda **RETIRADA**: era un error del arquitecto, «otra vez, y lo dice el
dato».
- **Chamberí y el autoclave son el mismo fallo: el juez COSE trozos reales para que las dos caras se
  lean en paralelo.**
  - En **Chamberí** eligió la frase 77, que tenía el orden de CLI-13, y le pegó el final de la 72.
  - En el **autoclave** quitó de las frases 31 y 32 lo que no rimaba con CLI-12 («El Coordinador de
    Calidad es quien autoriza…, quien firma…, y quien decide…»).
- **Lo único distinto es el AZAR**:
  - en Chamberí la costura **se notó**, porque el final iba en el documento ANTES que el principio
    → `cabeza_sin_cola`, y murió;
  - en el autoclave **no se notó**, porque el principio y el final estaban en orden y dentro de la
    tolerancia → `cabeza_y_cola`, y **se publicó**.
- 📌 **LA FRASE QUE RESUME TODO ESTE TRABAJO, al protocolo junto a la de la puerta**: la comprobación
  de citas **no separa lo bueno de lo malo: caza las costuras que da la casualidad de que se le
  notan, y publica las que no.** Un filtro cuyo acierto depende del orden en que el modelo pegó los
  trozos no es un filtro: es una lotería.
- **UN SOLO ARREGLO CERRARÍA LOS DOS CASOS** (arquitecto, 02/10): cada cita, una sola frase.
  - En el autoclave habría forzado la frase 32 de NOR-10, que es literal, lleva el dato y verificaría
    sin tolerancia.
  - **No se escribe**: el orden del tablero lo fija el arquitecto con esta medida.

**🗿 EL JUEZ NO REFORMULA: ESCULPE** (arquitecto, 02/10). Toma frases reales y les quita lo que no rima
con la cita del otro lado.
- En el autoclave quitó 159 caracteres de en medio de la frase 31, 117 del principio de la 32 y el
  «Es» inicial, que se llevó el verbo. **Lo quitado es justo lo que no encaja en la forma de la frase
  de CLI-12** («es quien autoriza…, quien firma…, y quien decide…»).
- En Chamberí lo hizo eligiendo y pegando; aquí, borrando. **Mismo motivo, dos técnicas**: que las dos
  caras se lean en paralelo.
- **La cuarta respuesta que no se previó tiene nombre: OMISIÓN.**
- **Los tres fallos del arquitecto en esta ronda**, archivados: no era la (2); había **tres** costuras
  y no una; y le faltó la de «instrumental. · La responsabilidad».

**📋 EL TABLERO, FIJADO (arquitecto, 02/10/2026). Tres commits y un despliegue**: el primero arregla
la raíz, el segundo **deja de publicar lo falso** y el tercero **devuelve lo verdadero**.
- **PUESTO 0 · `normalize()`: quitar los signos y DESPUÉS colapsar los espacios.** Opción (a) del
  informe de Code: un solo criterio en la casa. Su riesgo latente, en B.317.
- **PUESTO 1 · SE RETIRA EL PASO DE CABEZA Y COLA COMO ACEPTACIÓN; SE QUEDA COMO DIAGNÓSTICO.** Lo que
  sigue aceptando: `literal`, `normalizada` y `segmentos_de_fila`. El sello de goma, en B.318.
  - 📌 **Una heurística puede ser mala para decidir y buena para explicar.** `cabeza_sin_cola`,
    `cola_demasiado_lejos` y `sin_cabeza` son lo que contó esta historia: si se retirara el paso
    entero, todo fallo largo pasaría a llamarse `sin_coincidencia`.
- **PUESTO 2 · CADA CITA SALE DE UNA SOLA FRASE**, copiada entera, sin recortes por dentro ni trozos de
  sitios distintos. «Máximo 1 frase por cita» ya existía (`lib/analysis/judge.ts:834`): lo que faltaba
  era prohibir el recorte interno. ⚠️ **Mueve la línea de base del arnés**, y se sabe.
  - ✅ **HECHO EN CÓDIGO (02/10/2026)**, sin desplegar. La regla de `lib/analysis/judge.ts:834` dice ahora:
    - una sola frase, copiada entera, de principio a fin;
    - prohibido cortarla por dentro, resumirla, quitarle palabras del medio o usar puntos suspensivos;
    - prohibido unir trozos de sitios distintos;
    - y, si el dato está en otra frase, usar esa aunque no se parezca a la del otro documento.

    La línea `:835` dice para qué: la cita se busca literalmente en el documento del cliente y se
    enseña en pantalla. El orden y los nombres de los campos (B.312) no se tocan.
  - **Su prueba es la PRIMERA que lee el texto del prompt** (`lib/analysis/regla-de-la-cita.test.ts`),
    y es deliberada: guarda la regla que decide si una cita publicada existe. Con el código de antes,
    sus cuatro casos de la regla caían por fallo; su control de B.312 pasaba antes y después. **El
    censo de B.312 «ningún test compara el texto del prompt» deja de ser cierto desde hoy**: el día que
    se cambie esta regla, esta prueba cambia con ella.
  - ⚠️ **Lo que queda sin tocar, y lo dice Code**: las dos reglas de los campos siguen diciendo «copia
    LITERALMENTE un fragmento» (`judge.ts:832-833`). «Fragmento» y «una frase entera» tiran en
    direcciones distintas; se dejó así porque el encargo pedía no tocar esas líneas.

**EL CENSO QUE DECIDIÓ EL PUESTO 1, medido y no leído** (Code, 02/10): quién depende del paso de
cabeza y cola.
- `findBestMatch` sólo la usa el comprobador de citas (`verifyQuote` y `comprobadorDeLado`). El
  verificador y el examen no la llaman, y el editor tiene sus búsquedas propias (B.314).
- **129 citas verificadas distintas** de los análisis archivados del examen del 27/09, con el troceado
  de hoy:
  - **tablas**: 74 por segmentos de fila y 1 literal. **Ninguna depende del paso.**
  - **prosa**: 35 literal, 14 normalizada y **3 sólo por cabeza y cola**.
  - Las 3 son **la misma cita**, la lista de uniformes del control positivo de N3 (MKT-01 y RRHH-05):
    **una copia buena**, que el juez hizo sin los guiones de la lista. Sólo dependía del paso por el
    espacio doble que dejaba cada guion, que es justo lo que arregla el puesto 0.
- 📌 **Así que el paso se retira SIN COSTE MEDIDO**: su precisión medida es cero (de 23 citas
  publicadas, la única que lo necesitó era falsa), y su utilidad medida, después del puesto 0,
  también.
- ⚠️ **LA LIMITACIÓN DE ESTE CENSO** (escrita el 04/10/2026, por la pesca de Code y a petición del
  arquitecto): **un censo sobre análisis archivados no ve lo que el programa hace con los trozos de
  producción.** Éste midió las citas del examen del 27/09 con el troceado de HOY del repositorio.
  - La línea de base del 03/10 trajo el caso que no podía ver: el solapamiento `[2c6d5fc5]` de NOR-11
    con CLI-13, cuyo lado existente (327 caracteres) pasó por `cabeza_y_cola` en producción.
  - Así que «sin coste medido» vale **para el censo**, no para producción.

**🔮 LAS PREDICCIONES, CON SU BANDA, ESCRITAS ANTES DE MEDIR** (arquitecto, 02/10). Sin veredicto.
Cinco pasadas de cada sonda (NOR-11 y NOR-10, sin tanda), tras desplegar los tres puestos:
- **P-1 · El paso `cabeza_y_cola` no aparece ni una vez en el log, en 5 de 5 pasadas de las dos
  sondas.**
  - **Se juzga con** las líneas de las citas que pasan: «[judge] Contradicción verificada en …» y
    «[judge] Solapamiento verificado en …».
  - ⚠️ **Precisión de Code**: después del puesto 1, `cabeza_y_cola` **sigue saliendo** en las líneas
    de DESCARTE, a propósito, como diagnóstico: allí quiere decir «habría pasado por la tolerancia, y
    ya no pasa». Y lo cuenta `frontera.cita_solo_por_cabeza_y_cola`. **Contarlo ahí como fallo de
    P-1 sería leer el diagnóstico como aceptación.**
- **P-2 · La contradicción del punto de retirada se publica en al menos 4 de 5 pasadas de NOR-11,
  con `paso=literal` en los dos lados.** Es la sembrada 2; sería 3 de 3 en NOR-11.
  - **Se juzga con** su línea «Contradicción verificada», con `paso=literal` en los dos lados, y lo
    publicado (lo guardado, o la pantalla).
  - Su hash cambiará, porque la cita será otra. Se identifica por el tema.
- **P-3 · La sembrada A de NOR-10 se publica con `paso=literal` en al menos 3 de 5 pasadas.** Banda
  más ancha a propósito: es la que lleva cuatro días inestable. Se juzga igual que P-2.
- **P-4 · Ningún solapamiento publicado se pierde**: los 8 puntos de NOR-11 pasaban todos `literal`,
  así que deben seguir publicándose.
  - **Se juzga con** lo publicado y las líneas «Solapamiento verificado».
  - ⚠️ **Precisión de Code**: los 3 puntos genéricos de NOR-11 con CLI-12 (B.315) ya eran inestables
    sin ningún cambio: 3 en una pasada y 1 en la de las 09:24. Si P-4 falla sólo por ellos, el fallo
    no dice nada del cambio. La regla de la banda pediría escribirla como «en N de 5».
- **P-5 · La cita de la lista de uniformes de N3 pasa por `normalizada`**, y la pareja MKT-01 / RRHH-05
  conserva sus 5 puntos.
  - **Se juzga con el examen, no con las sondas.**
  - La mitad determinista ya está probada con el texto de los dos documentos
    (`lib/analysis/coincidencia-de-cita.test.ts`, «puesto 0»). La otra mitad —que el juez la vuelva a
    escribir igual— sólo la dice el examen.
- ⚠️ **LO QUE NO ES UNA REGRESIÓN, escrito antes de verlo**: si entre el puesto 1 y el puesto 2 se
  midiera algo, la sembrada A de NOR-10 saldría a **cero publicadas**. **Eso sería lo correcto: su cita
  era falsa.** Nadie puede leer esa caída como un retroceso.

**📏 LA LÍNEA DE BASE DEL PROGRAMA VIEJO: 11 PASADAS (03/10/2026, de 23:26 a 23:40).** Logs de Vercel
del director, transcritos por el arquitecto; Code no los ha visto. Archivado el 04/10.
- **EL SELLO DEL DESPLIEGUE: son del PROGRAMA VIEJO.**
  - La prueba, una línea de la pasada de las 23:38:50: «Solapamiento verificado en
    "CLI-13_instrucciones-clinicas-residuos.docx" [2c6d5fc5] (nuevo: longitud=128, paso=literal ·
    existente: longitud=327, paso=cabeza_y_cola, pajar=entregado_texto)».
  - Con el puesto 1 (`347675cf`), `cabeza_y_cola` no devuelve recorte: una cita no puede pasar por
    ahí. Además, `frontera.cita_solo_por_cabeza_y_cola` no sale en ninguna de las 11.
  - **Confirmado por git, por Code el 04/10**: los tres commits de los puestos 0, 1 y 2 (`26171d4d`,
    `347675cf`, `ad841b54`) **no estaban en `origin/main`**. El código nuevo nunca se subió.
  - 📌 **LA FORMA DE COMPROBAR UN DESPLIEGUE DESDE EL LOG, sin mirar Vercel**: si aparece
    `paso=cabeza_y_cola` en una cita VERIFICADA, el puesto 1 no está desplegado. Al protocolo.
- **NOR-10, 6 pasadas** (67 trozos, 60.038 caracteres), idénticas: retrieval 5 → rerank 2.
  - **CLI-13**: `corte_honesto`, solape 0 %, 0 y 0, en 6 de 6.
  - **CLI-12**: `corte_honesto` (analizado 37.143/66.801, candidato 2.857/55.135), solape 15 % las
    seis veces, y en el RAW 1 contradicción y 3 solapamientos.
  - **La sembrada A, `[1eb33774]` «Autoridad para retirar autoclave de servicio tras fallo de
    control biológico»:**
    - **DETECTADA 6 de 6**, siempre con el mismo hash: la misma cita las seis veces.
    - **DESCARTADA 6 de 6**, siempre igual: `lado=nuevo; longitud=244, paso=cola_demasiado_lejos,
      pajar=entregado_texto`.
    - La cita, tal como la corta el log a 200: «la responsabilidad última —incluida la firma de los
      registros de auditoría trimestral y la decisión de retirar del servicio un autoclave que no
      supere un control biológico— no es delegable y recae sie…».
    - ⚠️ **Empieza en minúscula, a mitad de frase**: es la frase 32 sin sus 117 primeros caracteres
      (B.311), una escultura MÁS CORTA del mismo punto. Ya no gana la lotería de cabeza y cola: la
      pierde por `cola_demasiado_lejos`. **La precisión cero de esa puerta, confirmada otra vez: una
      publicación falsa, cero buenas.**
  - **Solapamientos publicados, 3 en cada pasada**, todos `literal`, y el existente siempre con
    `pajar=entregado_piezas (3 trozos)`:
    - `620acd2e`, en 6 de 6 con la misma cita (nuevo 209, existente 166);
    - `1e845576`, en 6 de 6 (nuevo 124, existente 93);
    - el tercero, `4c04c31e` en las pasadas 1 a 3 y `59b3df82` en las 4 a 6.
  - Latencia: 20.355, 20.472, 21.168, 21.465, 21.648 y 22.085 ms; mediana ≈ 21,4 s.
  - 📌 **NOR-10 NO PUBLICA NI UNA CONTRADICCIÓN EN 6 DE 6.** El cliente ve tres solapamientos y ningún
    choque. Detección 6/6, publicación 0/6, causa única: es el caso de prueba más limpio del puesto 2.
- **NOR-11, 5 pasadas** (15 trozos, 14.437 caracteres), idénticas: retrieval 8 → rerank 3.
  - **CLI-13**: `pareja_entera` (14.704/14.704 y 9.817/9.817), solape 45 % las cinco veces, y en el
    RAW 3 contradicciones y 5 solapamientos.
  - **CLI-12**: `corte_honesto` (candidato 2.959/55.135), solape 5 % las cinco veces, 0
    contradicciones. **El RAW de solapamientos va 3, 3, 3, 1, 1.**
  - **Normas_Frecuencia_Recogidas**: `sin_fuente_comun`, sin trozos, leída con la tijera vieja
    (6.000/14.704). **0 contradicciones y 0 solapamientos en 5 de 5.** Ocupa una plaza del rerank y
    pierde por mérito: otra confirmación de P-SONDA-2. Nada que borrar.
  - **Las tres sembradas, con el mismo hash en las 5 pasadas:**
    - `[e7785038]` plazo del grupo III: **verificada 5 de 5** (nuevo 154 literal, existente 128
      literal) y confirmada por juicio 5 de 5;
    - `[5a59c682]` color del contenedor: **verificada 5 de 5** (nuevo 185 literal, existente 195
      literal) y confirmada por juicio 5 de 5;
    - `[976f6174]` el punto de retirada: **descartada 5 de 5**, siempre `lado=nuevo; longitud=111,
      paso=cabeza_sin_cola`, la escultura de Chamberí idéntica las cinco veces.
  - 📌 **Por la regla de B.295: las dos que valen, ESTABLE-ACIERTO 5/5; la que falta, ESTABLE-FALLO
    0/5, con la misma causa las cinco veces.**

**🔬 HALLAZGO: EL JUEZ ES ESTABLE EN CONTRADICCIONES E INESTABLE EN SOLAPAMIENTOS** (medido por el
arquitecto sobre los hashes, que son del par de citas: hash distinto, cita distinta).
- **Contradicciones**: los 4 puntos (3 de NOR-11, 1 de NOR-10) salen con el mismo hash en todas sus
  pasadas, 11 de 11. La cita es la misma.
- **Solapamientos de NOR-11 con CLI-13**: 24 publicados entre las 5 pasadas, con **20 pares de citas
  distintos**. Sólo se repiten dos, `d17d45c5` y `960ba4a8`, los dos en 3 de 5; los otros 18, una vez.
- **Solapamientos de NOR-10 con CLI-12**: al revés, 2 de las 3 plazas con la misma cita en 6 de 6, y
  la tercera estable en dos tandas de tres.
- ⚠️ **HIPÓTESIS, NO HALLAZGO, y SIN REGISTRAR como predicción** (arquitecto): cuanto más material
  comparten dos documentos (45 % frente a 15 %), más formas tiene el juez de decir el mismo
  solapamiento, y menos se repite la cita. Dos parejas no bastan: **no se escribe como regla hasta
  tener una tercera.** Se anota para que no se pierda.

**🔮 LAS PREDICCIONES DEL PROGRAMA NUEVO, firmadas por el arquitecto el 04/10/2026 ANTES de ver un
solo log suyo. Sin veredicto.** Con banda y criterio de falsación. Se juzgan con 5 pasadas de NOR-11 y
5 de NOR-10, en las mismas condiciones que la línea de base de arriba, **y después de comprobar el
despliegue con el sello**.
- **P-6 · `[1eb33774]` (NOR-10, el autoclave) se PUBLICA en 4 de 5 pasadas o más.**
  - Razón: se detecta 6/6, y lo único que lo tumba es una cita esculpida que empieza a mitad de
    frase, que el puesto 2 prohíbe.
  - **Falsada si se publica en 2 o menos de 5.**
  - Riesgo que asume el arquitecto: si el dato vive repartido en dos frases, el juez puede elegir la
    que no lo lleva.
- **P-7 · `[976f6174]` (NOR-11, Chamberí) se publica en 3 de 5 o más.**
  - Banda más floja que P-6: su cita pega el final de una frase a otra, y al obligarle a una sola
    puede cambiar de punto o perderlo.
  - **Falsada si es 0 de 5.**
- **P-8 · Las citas de los solapamientos se ESTABILIZAN**: en NOR-11 con CLI-13, al menos 3 de las 5
  plazas mostrarán un hash que se repite en 3 pasadas o más. Hoy son 2 de 5, los dos a 3/5.
  - Razón: una frase entera copiada tiene muchas menos formas posibles que una esculpida.
  - **Falsada si siguen siendo 2 o menos.**
- ~~**P-9 · `frontera.cita_solo_por_cabeza_y_cola` vale 0 en 9 o más de las 10 pasadas.**~~ —
  **RETIRADA ANTES DE MEDIR, el 04/10/2026, por la pesca de Code.** Se registró sobre un censo que no
  podía ver el caso de producción `[2c6d5fc5]`: solapamiento de NOR-11 con CLI-13, lado existente,
  327 caracteres, `paso=cabeza_y_cola`, pasada de las 23:38:50. En las 11 pasadas de la línea de base,
  el contador habría saltado 1 vez. La banda vieja, tal como estaba:
  - Razón: el censo de las 129 citas archivadas, donde las 3 únicas que dependían de esa puerta pasan
    ahora por `normalizada`.
  - **Falsada si salta en 3 pasadas o más**: entonces la puerta llevaba peso real y se regaló algo.
  - ⚠️ **Precisión de Code sobre la razón**: el censo se hizo con las citas del examen del 27/09 y con
    el troceado de hoy del repositorio, no con los trozos guardados en producción. **Y la línea de
    base de arriba trae un caso que el censo no tenía**: el solapamiento `[2c6d5fc5]` de NOR-11 con
    CLI-13, cuyo lado existente (327 caracteres) pasó por `cabeza_y_cola` a las 23:38:50. **Con el
    programa nuevo, esa cita sumaría 1 al contador.**
- **P-9bis · `frontera.cita_solo_por_cabeza_y_cola` salta en 1 a 3 de las 10 pasadas del programa
  nuevo** (registrada por el arquitecto el 04/10/2026, antes de medir).
  - Razón: en la línea de base saltaría 1 de 11, y el puesto 2 debería reducir las citas largas
    esculpidas, que son las que dependen de esa puerta.
  - **Falsada si salta en 6 o más de 10**: entonces la puerta llevaba peso real, y hay que mirar qué
    se está perdiendo.
  - 📌 **LA REGLA QUE LA ACOMPAÑA, porque el número solo no decide nada**: **cada vez que el contador
    salte, se mira la cita descartada** (`SQL_B313_citas_descartadas.sql`, que la guarda entera) **y
    se escribe si era una COPIA BUENA o una ESCULTURA.** Si son esculturas, la puerta hizo bien en
    cerrarse. Si aparece una copia buena, el problema es otro, y es de normalización, no de la puerta.
- **P-10 · Las dos contradicciones que ya funcionan en NOR-11, `e7785038` y `5a59c682`, se siguen
  publicando en 5 de 5.**
  - Razón: pasan por `literal`, y nada de los tres commits puede hacer fallar una coincidencia
    literal.
  - **Falsada por cualquier pasada que pierda una.** Es la regresión más importante que cazar: **si
    cae, se para todo y se revierte.**
- ⚠️ **AVISO AL LEER LA TANDA NUEVA** (arquitecto, 04/10): **el programa nuevo puede publicar MENOS
  solapamientos que la línea de base en alguna pasada, y eso es lo correcto, no un retroceso.** En la
  pasada de las 23:38:50, de los 4 solapamientos publicados con CLI-13 uno era `[2c6d5fc5]`, cuya cita
  no se pudo confirmar entera; con el puesto 1 serían 3. **Nadie puede leer esa caída como un fallo.**
  (El 4 lo transcribe el arquitecto de los logs; Code no los ha visto.)

**🆕 LA PASADA 1 DEL PROGRAMA NUEVO (04/10/2026, de 02:44:49 a 02:45:12).** Logs del director, transcritos
por el arquitecto; Code no los ha visto. NOR-11, rerank 3 —CLI-13 `pareja_entera`, CLI-12
`corte_honesto` y Normas `sin_fuente_comun`—, 23,5 s en total.
- **El despliegue está dentro**, por el sello bueno (protocolo): los tres solapes que estuvieron
  idénticos en las 5 pasadas de la línea de base se mueven los tres. CLI-13 pasa del 45 % al 35 %,
  CLI-12 del 5 % al 15 % y Normas del 0 % al 5 %. Además, ninguna cita pasa por `normalizada` y todas
  las parejas de citas son nuevas.
- **CLI-13**: solape 35 %, **1 contradicción** (antes 3, en 5 de 5) y 5 solapamientos.
  - `[e7785038]` plazo del grupo III: **verificada**, nuevo 154 y existente 128, los dos `literal`, y
    confirmada por juicio.
  - `[5a59c682]` color del contenedor: **AUSENTE DEL RAW.** Se publicaba en 5 de 5 en la línea de base.
  - `[976f6174]` Chamberí: **AUSENTE DEL RAW.** Antes se emitía y se descartaba por la cita; hoy ni se
    emite.
  - 5 solapamientos verificados, todos `literal`, con hashes nuevos: 176/114, 288/170, 212/197, 263/236
    y 188/148.
- **CLI-12**: solape 15 %, 0 contradicciones y 1 solapamiento, `[53b97faa]`, 285/286 `literal`. Las dos
  citas de 68 y 60 caracteres que pasaban por `normalizada` han desaparecido.
- **Normas_Frecuencia_Recogidas** emite por primera vez un hallazgo, y muere por la cita: B.319.
- `frontera.cita_solo_por_cabeza_y_cola` no salta. **P-9bis sigue viva.**
- 📌 **EL PUESTO 2 NO SÓLO CAMBIA CÓMO CITA EL JUEZ: CAMBIA QUÉ ENCUENTRA.** Estaba escrito («mueve la
  línea de base del arnés») y el arquitecto no lo llevó al razonamiento de P-10.

❌ **P-10: FALSADA el 04/10/2026, en la primera pasada**, por su propio criterio («falsada por
cualquier pasada que pierda una»): `[5a59c682]` no salió. Sin reinterpretar el resultado.
- **El agujero concreto del razonamiento**: predijo sobre la puerta de verificación —«nada puede hacer
  fallar una coincidencia literal», que es cierto— **cuando el cambio pegaba en la EMISIÓN del juez.**
  La contradicción no se descartó: no se emitió.
- **Y el segundo error, archivado**: escribió «si cae, se para todo y se revierte», una decisión sin
  banda, contra la regla de la casa. **No se revierte con una pasada.** La regla de decisión es la de
  abajo.

⚖️ **LA REGLA DE DECISIÓN, firmada por el arquitecto el 04/10/2026 a las 04:45, ANTES de mirar cualquier
pasada posterior a la primera.** Se juzga sólo con `[5a59c682]` (el color del contenedor), el hallazgo
que funcionaba y hoy no está, sobre las 5 pasadas de NOR-11:
- **0 de 5 → pérdida ESTABLE.** El puesto 2 rompió un hallazgo bueno: **se revierte el commit del prompt
  (`ad841b54`)**, se quedan los puestos 0 y 1, y se vuelve a medir. Perder una contradicción sembrada
  que funcionaba pesa más que ganar otra.
- **1 a 4 de 5 → INESTABLE.** No se revierte nada todavía: se compara cuántas de las 3 sembradas de
  NOR-11 se publican en total contra las 2 de 5/5 de la línea de base, y se decide con ese número.
- **5 de 5 →** la pasada 1 era ruido, y se sigue.
- **Ningún otro dato de las 9 pasadas puede cambiar esta regla.** Si algo la contradice, se declara roto
  el criterio; no se reinterpreta el resultado.
- ⚠️ **Lo que la regla deja por escribir, y lo dice Code sin decidirlo**: en el tramo de 1 a 4 de 5 no
  fija el umbral de «ese número» —cuántas publicaciones totales de las 3 sembradas hacen seguir y
  cuántas revertir—. Si se quiere que decida sola, hay que escribirlo antes de ver las pasadas.
  **→ Cerrado por el arquitecto en la adenda de abajo.**

**➕ ADENDA DEL ARQUITECTO (04/10/2026), antes de la quinta pasada de NOR-11.** Cierra el hueco que Code
señaló en la regla de decisión.
- ⚠️ **La adenda se apoya en un «encargo de las 05:00»** —su apartado E, la bifurcación con el texto de
  las citas de 222 y 710 caracteres de NOR-10, y las pasadas 2 a 5 de NOR-10 y la 2 de NOR-11— que
  **no llegó a Code y no está archivado en este repositorio**. Lo que sigue es sólo lo que trae la
  adenda; si aquel encargo debe constar, hay que pegarlo.
- **EL NÚMERO QUE FALTABA**: la comparación es cuántas de las 3 contradicciones sembradas de NOR-11 se
  publican por pasada.
  - Línea de base: **2 de 3, en 5 de 5 pasadas.** Estable.
  - Programa nuevo hasta ahora: **1 de 3, en 4 de 4 pasadas.**
  - **EL UMBRAL**: el puesto 2 se queda tal cual si el programa nuevo publica **2 o más de las 3
    sembradas en al menos 3 de las 5 pasadas.** Si no, la regla de una sola frase quedó demasiado
    estrecha.
- ⚠️ **Y LA PRECISIÓN QUE CORRIGE SU PROPIA REGLA**: el número de NOR-11 dice **si la pérdida es
  estable, NO qué hacer.** Qué hacer lo decide la bifurcación del apartado E de las 05:00, con el TEXTO
  de las citas de 222 y 710 caracteres de NOR-10. Si las dos cosas apuntan al mismo sitio —que la frase
  única no da para el dato—, el cambio es uno: **hasta dos frases seguidas, copiadas enteras y del
  mismo sitio.** Una sola decisión, no dos.
- **Dos coincidencias de longitud, para esa bifurcación** (Code, 04/10; sin el texto de las citas,
  **no son medidas**):
  - **710 ≈ 713**: las frases 31 y 32 de NOR-10, enteras y seguidas, miden 372 + 1 + 340 = 713. Es
    compatible con que la cita publicada `[b5ab6f08]` sea esas dos frases copiadas enteras, que es la
    variante que propone el arquitecto.
  - **222 ≈ 223**: el final de la frase 32 desde «la responsabilidad…» mide 223 (B.311). Es compatible
    con que `[fa22ca84]` empiece a mitad de frase, lo que el puesto 2 prohíbe. Y aun así pasa
    `literal`, porque la comprobación acepta cualquier tramo seguido del documento: **la regla del
    prompt no la hace cumplir la puerta.**
  - Las dos cosas las decide el texto de las citas, que está guardado.

**📊 LO MEDIDO EN LA ADENDA** (logs del director del 04/10, transcritos por el arquitecto; Code no los ha
visto):
- **NOR-10, sexta pasada** (02:59:30, 19.077 ms), idéntica a las otras cuatro que mueren: `[fa22ca84]`
  verificada, nuevo 222 `literal` y existente 340 `literal`, y **el verificador la descarta por
  `mismo_dato_sin_oposicion`**. Solapamientos `620acd2e`, `b5b3be4b` y `2098fd0d`.
- **EL RECUENTO DE NOR-10 SOBRE 6 PASADAS**, para el tablero:
  - La cita PASA **6 de 6**. En la línea de base, 0 de 6.
  - Se publica **1 de 6**. Muere en el verificador **5 de 6**, siempre por `mismo_dato_sin_oposicion`.
  - `[fa22ca84]` (nuevo 222, existente 340) en 5 pasadas con la misma cita; `[b5ab6f08]` (nuevo 710
    `normalizada`, existente 341) en 1, la única publicada.
  - Solapamientos: `620acd2e` en 5 de 6, `1e845576` en 3 de 6, y el tercero varía.
  - Un solapamiento descartado por `cola_demasiado_lejos` en 1 de 6: **la escultura no ha
    desaparecido.**
  - Latencias de 18.321 a 19.970 ms (la línea de base, de 20.355 a 22.085).
- **NOR-11, pasadas 3 y 4** (03:02:54, 23.974 ms; 03:03:57, 25.617 ms):
  - `[e7785038]` verificada y confirmada en las dos, con la misma cita (154/128, las dos `literal`).
    **4 de 4.**
  - `[5a59c682]`, el color del contenedor: **AUSENTE 4 de 4.**
  - `[976f6174]`, Chamberí: **AUSENTE 4 de 4.**
  - Solape con CLI-13: 35 %, 45 %, 35 % y 35 %.
  - Solapamientos de CLI-13 que repiten: `98d8696e`, `bae4d83e` y `6c94edf2`, cada uno en 3 de 4.
    **Tres plazas de cinco con hash repetido en 3 pasadas: el umbral de P-8 se cumpliría ya, pero SIN
    VEREDICTO hasta la quinta.**
  - CLI-12: `[53b97faa]` en 3 de 4 (285/286) y `[851fc04e]` en 1 de 4 (285/466).
  - B.319, estable en 4 de 4, con un detalle nuevo en su ficha.
  - `frontera.cita_solo_por_cabeza_y_cola`: **0 en las 10 pasadas nuevas** (6 de NOR-10 y 4 de NOR-11).

❌ **P-9bis: SU BANDA FALLA POR ABAJO, Y SU CRITERIO ESTABA MAL ESCRITO** (arquitecto, 04/10; archivado
sin esperar a la quinta):
- **La banda falla por abajo**: predijo de 1 a 3 de 10, y va 0 de 10. El caso de 327 caracteres que la
  justificaba era del programa viejo, y el puesto 2 se llevó por delante justo ese tipo de cita larga
  esculpida. **El resultado es bueno; la predicción, mala.**
- **Y el defecto de forma, que importa más**: banda por los dos lados («1 a 3») y criterio de falsación
  sólo por arriba («si salta en 6 o más»). Así un 0 no la falsa, aunque esté fuera de la banda. **Regla
  al protocolo: una banda tiene que tener criterio de falsación por los dos lados, o no es una banda:
  es una mitad.**

🧾 **OTRO ERROR DEL ARQUITECTO, archivado con la cuenta de Code y su fecha** (corregido el 04/10 por el
propio arquitecto, al reemitir el encargo de las 05:00): **la corrección del recuento es del 01/10, y
dice «son 8 hallazgos tirados, no 7», SUMANDO LAS DOS SONDAS** (`Estado_Del_MVP.md`, B.299). No es «6
en la sonda A», aunque la A tenga, en efecto, 6 (B.307: `[976f6174]`, 3 solapamientos con CLI-13, 1 con
CLI-12 y `[2bf4eefc]`) y la B, 2.

**🔁 EL ENCARGO DE LAS 05:00, REEMITIDO COMPLETO por el arquitecto (04/10/2026).** Sustituye al que no
llegó. Logs del director del 04/10, transcritos por el arquitecto; Code no los ha visto.
- **NOR-10, las 6 pasadas**: iguales por fuera (rerank 2, CLI-13 siempre 0 %, 0 y 0). Latencias:
  18.321, 18.846, 19.077, 19.327, 19.416 y 19.970 ms.
  - **La contradicción del autoclave**: la cita **PASA 6 de 6** (en la línea de base, 0 de 6). **Se
    publica 1 de 6.** Las otras 5 mueren en el VERIFICADOR: `[fa22ca84] → descartado:
    mismo_dato_sin_oposicion`.
  - Las 5 que mueren: el mismo hash, `fa22ca84`, nuevo **222** `literal` y existente **340**
    `literal` (pajar `entregado_piezas`, 3 trozos).
  - La que se publica, a las 02:53:31: `[b5ab6f08]`, nuevo **710** `paso=normalizada` y existente
    **341** `literal`, **confirmada por juicio**. Pasada rara en todo: solape del 8 % en vez del 15 %, y
    1 solapamiento en vez de 3.
  - Solapamientos de CLI-12: `620acd2e` en 5 de 6 con la misma cita, `1e845576` en 3 de 6, y el
    tercero varía (`a0f74182` ×2, `b5b3be4b` ×2, `f6707154`, `2098fd0d` y `0bd80731`).
  - Un solapamiento descartado en 1 de 6: `[37bf4d44]`, lado nuevo, 175 caracteres,
    `cola_demasiado_lejos`: «Dirección de Operaciones es responsable de mantener actualizado este
    protocolo, de coordinar la formación descrita en el apartado 15 de forma homogénea entre las tres
    clínicas». **La escultura no ha desaparecido.**
- **NOR-11, la quinta pasada** (03:06:57, 24.453 ms) y el cierre de las cinco:
  - `[e7785038]`: verificada y confirmada **5 de 5**, con la misma cita (154/128 `literal`) en las cinco
    y en la línea de base.
  - `[5a59c682]`, el color del contenedor: **AUSENTE 5 de 5.**
  - `[976f6174]`, Chamberí: **AUSENTE 5 de 5.**
  - Solape con CLI-13: 35, 45, 35, 35 y 35 %.
  - Solapamientos de CLI-13 por pasada:
    1. `98d8696e`, `f4a2154f`, `bae4d83e`, `6c94edf2`, `1975ec24`
    2. `98d8696e`, `7b3e8df2`, `155b7d55`, `59adbbd4` (y `db287ea4` descartado, cruzada)
    3. `98d8696e`, `f4a2154f`, `bae4d83e`, `6c94edf2`, `42d3be10`
    4. `df4ce36f`, `c7bbeb68`, `bae4d83e`, `5a223599`, `6c94edf2`
    5. `98d8696e`, `f4a2154f`, `bae4d83e`, `6c94edf2`, `1975ec24`

    **Recuento: `98d8696e` 4/5, `bae4d83e` 4/5, `6c94edf2` 4/5, `f4a2154f` 3/5.** Las pasadas 1, 3 y 5
    dan el mismo conjunto de cinco.
  - CLI-12: `53b97faa` en 4 de 5 (285/286 `literal`), `851fc04e` en 1 de 5.
  - B.319: emitida y descartada 5 de 5; `b8b2419d` en 4 de 5 y `9a7f402e` en 1 de 5 (la misma fila con
    «:» en vez de «|»).
  - B.312, cruzada: 1 de 5. **Banda acumulada desde el arreglo: 2 de 14.**
  - `frontera.cita_solo_por_cabeza_y_cola`: **0 en las 11 pasadas nuevas.**

**⚖️ LOS VEREDICTOS, TODOS** (arquitecto, 04/10):
- ❌ **P-6 · FALSADA.** 1 de 6 publicadas contra «4 de 5 o más». El agujero: predijo sobre la
  PUBLICACIÓN razonando sobre la PUERTA DE LA CITA. La puerta acertó de pleno: de 0/6 a 6/6.
- ❌ **P-7 · FALSADA** por su propio criterio («falsada si es 0 de 5»): Chamberí, 0 de 5. Sin
  reinterpretar.
- ✅ **P-8 · ACERTADA.** Pedía al menos 3 de las 5 plazas con un hash que se repita en 3 pasadas o
  más; salieron **4**, tres de ellas a 4 de 5. La línea de base tenía 2 plazas a 3 de 5. **Es la única
  acertada de la tanda, y mide justo para lo que servía el puesto 2: citas reales y estables.**
- ❌ **P-9bis**: banda errada por abajo y criterio mal escrito (arriba). 0 de 11.
- ❌ **P-10 · FALSADA** (arriba).
- 📌 **MARCADOR: 1 acertada de 5. Las predicciones del arquitecto fueron malas, y el cambio fue bueno
  en lo que importaba.**

**🛑 LA DECISIÓN: NO SE REVIERTE ESTA NOCHE** (arquitecto, 04/10). La regla de decisión disparó su rama
dura —`[5a59c682]` 0 de 5, revertir `ad841b54`— y no se ejecuta. El motivo, con las palabras del
arquitecto:

> Antes del puesto 2 publicábamos a un cliente una cita de 434 caracteres que no existía en su
> documento (B.311). Después, las citas existen: 6 de 6 en NOR-10, 11 de 11 pasadas sin una sola cita
> inventada, y 4 de 5 plazas de solapamiento con cita estable. El coste medido es recall: una
> contradicción sembrada de NOR-11, estable en cero.
> **MENTIR MENOS VALE MÁS QUE ENCONTRAR MÁS.** El estado desplegado es más seguro que el anterior, así
> que se queda mientras se mide.

- **La rama de revertir queda ARMADA, no retirada.** Se ejecuta si la medida de B.320 y B.321 dice que
  la pérdida viene del prompt y no del verificador.
- **La regla que propone el arquitecto, al protocolo**: una regla de decisión puede quedar en suspenso
  por un motivo de SEGURIDAD escrito antes de verla disparar; nunca por un motivo de conveniencia
  escrito después.
- ⚠️ **OBSERVACIÓN DE CODE, sin decidir nada**: la regla de decisión se escribió a las 04:45 sin
  excepción por seguridad, y decía «ningún otro dato de las 9 pasadas puede cambiar esta regla; si
  algo la contradice, se declara roto el criterio». El motivo de seguridad de arriba se escribe
  **después** de verla disparar. **Por la letra de la regla que se lleva al protocolo, esta suspensión
  sólo cabe si se cuenta como «escrito antes» lo que ya decía B.311** («una frase inventada con
  contenido real», 02/10). Si no, lo que dice la propia casa es declarar roto el criterio de las 04:45,
  y no dejarlo en suspenso. Lo decide el arquitecto, y se escribe cuál de las dos es.

**🧭 LA BIFURCACIÓN, PRE-REGISTRADA ANTES DE VER EL TEXTO DE LAS CITAS** (firmada por el arquitecto el
04/10/2026 a las 05:29). Tres ramas, excluyentes:
- **RAMA 1 · la cita de 222 empieza a mitad de frase** → el problema es que **la regla no se hace
  cumplir**, no que sea estrecha. Se arregla en la PUERTA (B.321): exigir que la cita empiece en
  principio de frase y acabe en fin de frase. **No se revierte el prompt** y no se amplía a dos frases.
- **RAMA 2 · la cita de 222 es una frase entera y no lleva el dato de la oposición, y la de 710 sí** →
  la regla sí quedó estrecha. Se amplía a **hasta dos frases seguidas, copiadas enteras y del mismo
  sitio.**
- **RAMA 3 · la cita de 222 es una frase entera y SÍ lleva el dato** → el prompt está bien, y el
  objetivo siguiente es el criterio del verificador.
- **Si no hay texto guardado de ninguna** → no se decide nada: primero el agujero de B.320. Volver a
  adivinar sería hipótesis tras hipótesis.
- **Ningún otro dato cambia esta bifurcación.** Si algo la contradice, se declara roto el criterio.
- ⚠️ **Lo que Code sabe ya, por lectura y antes del dato, y que la rama decisiva necesita**: la cita de
  222 es de `[fa22ca84]`, que murió en el VERIFICADOR, y **eso no se guarda en ningún sitio** (B.320).
  Así que, salvo que la consulta lo desmienta, **la cita de 222 no tiene texto guardado**, y las ramas
  1 a 3 no se pueden decidir con ella. La de 710 (publicada) y la de 175 (descartada por la cita) sí
  deberían estar.




**🧾 LOS ERRORES DEL ARQUITECTO EN ESTA RONDA, archivados** (04/10):
1. **RETIRADA** «la contradicción sembrada de NOR-10 sale en 2 de 4 pasadas». Con 6 pasadas más:
   **detectada 6/6, publicada 0/6**. Se medían publicaciones y se llamaban detección. La única
   publicación fue la cita falsa de B.311: una lotería ganada, no una detección intermitente.
2. **Mandó medir antes de desplegar.** La consecuencia no fue grave —salió la línea de base que
   faltaba—, pero queda la regla: **antes de una tanda de medida se comprueba el despliegue con el
   sello, no con la memoria de quién subió qué.** Al protocolo.



**🔀 ~~B.313 SON DOS ENFERMEDADES, y se separan~~ — RETIRADO el mismo 02/10 (arriba: es UNA)** (arquitecto, 02/10: «mezclarlas fue mi error»):
- **(A) CHAMBERÍ · LA COSTURA. Medido, un caso.**
  - Las dos mitades de la cita son literales y salen de las frases 77 y 72 de NOR-11, **en ese
    orden, o sea del revés**. Todo lo citado existe; **lo único que no existe es la costura**.
  - **Y ése es el motivo exacto de `cabeza_sin_cola`**, comprobado por Code el 02/10: la cabeza de
    la cita («el punto de retirada») sólo aparece en el texto normalizado de NOR-11 en la posición
    7.842, y la cola («clínica de chamberí») sólo en la 7.148, **antes**. La comprobación busca la
    cola después de la cabeza, y aquí va delante.
- **(B) EL AUTOCLAVE · SIN REPARTO, Y SIN EXPLICACIÓN TODAVÍA.**
  - Sus tres datos viven en una sola frase de NOR-10, de 340 caracteres. No hay nada repartido, y
    aun así falla.
  - La cuenta de «~21 caracteres sobrantes» del arquitecto queda **retirada**: era una estimación
    para sostener una conjetura. No llegó a escribirse en esta ficha.
  - **La hipótesis de la anotación entre corchetes SALE DE CARRERA**: no se descarta, deja de estar
    activa. La contesta el dato guardado, no otra conjetura.

**🗄️ NO MÁS HIPÓTESIS: SE GUARDA LO QUE SE DESCARTA** (decisión del arquitecto a propuesta del
director, 02/10). La pregunta del director: ¿no es más sencillo ver en qué punto algo que viene bien
pasa a estar mal, y qué cambió? No se había hecho porque **lo que falla se tira**.
- **Este fallo no vive en el código, vive en el dato.** Lo que se desvía es lo que escribe el
  modelo, y el modelo no está en el repositorio. Por eso cada lectura del código acabó en
  conjetura. **Hace falta el artefacto, no otra lectura.**
- La regla, al protocolo: **una puerta que descarta tiene que guardar lo que descartó**
  (`claude/Protocolo_Harness_Tasas.md`).
- **Qué se guarda**, por cada hallazgo descartado por cita no verificable, en el juicio de su
  pareja, dentro de `analysis_results.analysis`:
  - el hash y el tema, y si era contradicción o solapamiento;
  - las dos citas, **completas**, cada una en el campo de su lado;
  - el lado que falló;
  - el paso en que se rindió la búsqueda de cada lado, y el pajar usado;
  - y el id del candidato.
  - **Campos con nombre, no un volcado de la respuesta del modelo.**
  - **El id del analizado** se guarda si existe. En el camino del chat el documento todavía no
    existe al analizar, y la fila lleva sólo `storage_path` (F-101). No es un fallo: la consulta
    cae a la ruta del fichero.
- **EL TOPE: 10 por pareja**, declarado, con la cuenta de los que no se guardaron (arquitecto,
  02/10). Lo más visto en una pareja son 4.
  - **⚠️ SI ESA CUENTA NO ES CERO ALGUNA VEZ, ES UN HALLAZGO**, no un detalle de implementación:
    significaría que el juez emitió más de diez descartes en una sola pareja, y eso se quiere saber.
- ✅ **HECHO EN CÓDIGO (02/10/2026)**, sin desplegar. Un commit previo, sin cambio de comportamiento,
  partió `coincidencia-de-cita.ts`: estaba en 399 líneas.
  - **Dónde va**: en cada juicio, `descartesPorCita` y `descartesPorCitaOmitidos`
    (`lib/analysis/types.ts`, `DescarteDeCita`; ⚠️ `types.ts` sube a 637 líneas, deuda anterior al
    tope de 400, y **lo próximo que haya que añadir ahí obliga a partirlo por dominio primero**: un
    fichero que ya incumple la regla no es excusa para seguir creciendo; **cumplido el 05/10/2026**: antes de añadir la lista de puntos de B.314, lo publicado —`FinalAnalysis` y sus tipos— pasó a `lib/analysis/tipos-del-analisis-publicado.ts`, y `types.ts` bajó a 313 líneas y lo reexporta todo). Lo anota `registroDeDescartes`
    (`lib/analysis/diagnostico-de-cita.ts`), con `TOPE_DE_DESCARTES_POR_PAREJA = 10`.
  - **El paso y el pajar se guardan como DATO, no como texto del log**: salen de la misma función
    que escribe el log (`ComprobadorDeLado.datos`).
  - **Viaja sin tocar nada más**: el juicio pasa por el pipeline con `...judgment`, y `analysis` se
    guarda entero. Comprobado leyendo el código, no ejecutado.
  - ⚠️ **LLEGA AL NAVEGADOR, como ya llega `judgments[]`**. La respuesta del análisis es una lista
    cerrada sin `judgments`, así que por ahí no viaja (`app/api/analyze-v2/route.ts:812-840`). Pero
    las dos rutas de la bandeja devuelven el jsonb entero (`app/api/documents/[id]/analysis/route.ts`
    y `app/api/analysis-results/[id]/route.ts`). Lo recibe el usuario de la misma organización, y
    no lo pinta ninguna pantalla. **Va con la pieza (b) del reparo.**
    - **Aceptado** (arquitecto, 02/10): lo recibe un usuario de la misma organización, que ya
      tiene acceso a esos documentos. Lo único que añade: **son bytes que viajan para nada**, y el
      día que se toque esa respuesta conviene recortarla.
  - **El tamaño, medido**: unos 340 bytes fijos por descarte, más sus dos citas. El peor caso con el
    tope, citas de 340 caracteres, es de unos 10 KB por pareja; unos 60 KB con las 6 parejas del
    rápido.
  - **El rojo, de fallo** (`lib/analysis/citas-cruzadas.test.ts`, «se guarda lo que se descarta»):
    - contra el juez de antes caen las tres que guardan (un solapamiento con su cita de más de 200
      caracteres entera, una contradicción y el tope de 10 con su cuenta de 3);
    - los controles pasan con el código de antes y con el de ahora: sin descartes no hay ni lista
      ni cuenta, lo descartado por narración no entra, y la línea de log no cambia.
  - **El lector**: `SQL_B313_citas_descartadas.sql`, PENDIENTE DE EJECUTAR. Sólo trae los análisis
    hechos después del despliegue.

**🔐 EL REPARO DE LOS DATOS DEL CLIENTE, DECIDIDO** (arquitecto, 02/10). La regla dice «se persisten
donde se MUESTRAN; ninguna copia sin lector», y estas citas no las pinta ninguna pantalla:
- **(a) El lector es la consulta de diagnóstico, y se nombra por su fichero**:
  `SQL_B313_citas_descartadas.sql`, que nace en el commit del código, después de éste. Una copia con lector y motivo nombrados no es una copia sin
  lector. **Precedente**: `judgments[]`, que su tipo declara «útil para debug»
  (`lib/analysis/types.ts:348`), no lo lee ningún componente, y lo leen las SQL de estos días.
- **(b) No es una exposición nueva.** La frase ya está completa en la base, en el `full_text` del
  documento y en sus trozos. Lo nuevo es **la versión que escribió el juez**, de la misma clase que
  `topic`, `description` y `summary`, que ya se guardan.
- **(c) Se borra con el documento CUANDO HAY DOCUMENTO.** En los análisis con `document_id` —bandeja,
  y chat cuyo fichero acaba indexándose—, `deleteDocument` se lleva sus filas de `analysis_results`.
  **En un análisis del chat cuyo fichero nunca se indexa, no hay documento que borrar**: la fila queda
  con `storage_path` y vive hasta la purga de la organización.
  **Y el cambio que introduce B.313 es cero**: esas mismas filas ya guardan hoy las citas publicadas y
  `judgments[]` con esa misma vida. No se inventa una retención nueva; se hereda la que había.
  *(Redacción literal del arquitecto, 02/10, que sustituye a «se borra con el documento», verdad a
  medias.)*
  - Las líneas: `deleteDocument` borra por `document_id` (`lib/delete-document.ts:166-169`, con el
    criterio de `lib/documents/analisis-del-documento.ts`). La indexación adopta los análisis del
    chat y les pone el `document_id` (`app/api/ingest/route.ts:403-408`). La purga, en
    `lib/purge-org.ts:117`.
  - **POR QUÉ LA DECISIÓN SE MANTIENE**: el reparo preguntaba si se abría una categoría nueva de dato
    con una vida nueva. **La respuesta medida es que no.** Lo que sí hay es un problema anterior, que
    va a su propia ficha: B.316.
- **(d) FECHA DE REVISIÓN, NO VIDA INDEFINIDA.**
  - ⚠️ **OBLIGACIÓN, escrita aquí y no suelta: EL DÍA QUE B.313 SE CIERRE, ESTA DECISIÓN SE VUELVE A
    LEER. SI NADIE CONFIRMA QUE SE QUEDA, SE QUITA.**
  - El arquitecto espera confirmarla, por la regla de la puerta que descarta. Pero **la
    confirmación tiene que ser un acto, no un olvido.**

**🧭 EL PRINCIPIO QUE GOBIERNA EL ARREGLO, escrito antes de que a nadie se le ocurra lo fácil**
(arquitecto, 02/10). En los dos casos el análisis es correcto y sólo la cita está mal armada. De ahí
la tentación: aflojar el comprobador.
- **NO SE AFLOJA.** Aflojar la comprobación publicaría la frase cosida de Chamberí, **que NO EXISTE
  en el documento del cliente**, y quien la busque no la encontrará. Es el daño de B.310 y B.311 por
  un tercer camino.
- **EL ARREGLO VA POR LA FORMA DEL CAMPO, NO POR LA TOLERANCIA DEL COMPROBADOR.**
  - Hoy `newDocSays` hace dos trabajos: ser evidencia literal y ser una frase legible. Cuando el
    dato está en dos sitios, los dos trabajos se pelean, y el juez resuelve la pelea cosiendo.
  - **Si el campo admitiera una LISTA de trozos literales, no habría nada que coser.**
  - Y **una aclaración del juez no va dentro de la cita: va en otro campo.**
- **Ni se implementa ni se diseña todavía.** Es la dirección, y la decide el arquitecto cuando esté
  el dato. Queda escrita para que el día que alguien proponga «subir la tolerancia» la tenga
  delante.

**🔬 LA PRIMERA MEDIDA CON EL DATO EN LA MANO (02/10/2026, 13:17:15).** Una pasada, una consulta
(`SQL_B313_citas_descartadas.sql`, que ejecutó el director) y la causa a la vista. Code no ha visto
la fila: la transcribe el arquitecto.
- 📌 **En cuatro días de hipótesis no se había llegado a esto, y con el dato guardado se vio en una
  fila.** Es el argumento de la regla «una puerta que descarta tiene que guardar lo que descartó»,
  medido.
- **La fila**: NOR-11 → CLI-13, `[976f6174]`, `lado_que_fallo = nuevo`.
  - **nuevo (NOR-11), FALLA**, 111 caracteres, `cabeza_sin_cola`: «El punto de retirada
    centralizado concentra el material de las tres clínicas, ubicado en la clínica de Chamberí».
  - **existente (CLI-13), PASA LITERAL**, 103 caracteres: «El punto de retirada centralizado para
    las tres clínicas de la red se encuentra en la clínica de Retiro».
- ✅ **LOS LADOS ESTÁN BIEN ASIGNADOS**: Chamberí es de NOR-11 y Retiro de CLI-13
  (`corpus-pruebas/SIEMBRA_caso_control.md:57-58`). **Aquí no hay cambiazo: B.312 queda descartada
  como causa de este caso, de forma definitiva.**
- **LA CAUSA** (arquitecto, 02/10): **el juez escribió el lado de NOR-11 con la misma forma que la
  frase literal de CLI-13**, para que la diferencia se vea. Mismo arranque, mismos elementos, mismo
  orden y mismo cierre. Las dos mitades son texto real de NOR-11, pero **NOR-11 lo dice en el orden
  contrario**, así que **la frase cosida no existe**.
  - **No es descuido: es un instinto bueno**, presentar las dos caras en paralelo, que se lee mejor
    y rompe la literalidad.
- ✅ **LA COMPROBACIÓN QUE LA CIERRA, hecha por Code el 02/10, offline**: ¿contiene NOR-11 una frase
  con esos elementos en el orden inverso al de la cita? **Sí, la frase 72**, que empieza en el
  carácter 7.271 del texto extraído: «El gestor autorizado recoge los residuos **de las tres
  clínicas** en un **punto de retirada centralizado**, **ubicado en la clínica de Chamberí**, desde
  donde…».
  - En ella «de las tres clínicas» va ANTES que «punto de retirada centralizado» (caracteres 7.312
    y 7.339), y la cita los pone al revés, como CLI-13.
  - **Con una precisión**: la primera mitad de la cita no es una reordenación inventada. «El punto
    de retirada centralizado concentra el material de las tres clínicas» es **literal de otra
    frase**, la 77 (carácter 8.127). El juez tomó esa frase para tener el orden de CLI-13 y le pegó
    el final de la 72 («ubicado en la clínica de Chamberí», carácter 7.371).
  - **EL MECANISMO, AFINADO** (arquitecto, 02/10, aceptando la precisión): el juez no reordenó
    palabras. **Eligió la frase de NOR-11 que ya tenía el orden de CLI-13 (la 77) y le pegó el
    final de la que llevaba el dato (la 72).** Eligió y cosió. El motivo de fondo es el mismo: que
    las dos caras rimen.
  - Las posiciones 7.148 y 7.842 de la medida anterior eran del texto NORMALIZADO; éstas son del
    texto extraído, y no se mezclan.
- **EL ARREGLO TIENE CANDIDATO, Y NO SE ESCRIBE TODAVÍA** (arquitecto, 02/10), afinado con el
  mecanismo: no es «no reformules», es **«cada cita sale de UNA sola frase; si el dato está en otra,
  usa esa aunque no se parezca a la de enfrente»**. Es barato. Pero primero va la medición del
  autoclave (B.311): si su medio está inventado, el orden del tablero cambia y este arreglo no es el
  primero.
  - **SU GANANCIA, IDENTIFICADA**: la frase 72 contiene el dato, es literal y verificaría, así que
    ese arreglo publicaría la sembrada 2 de NOR-11.
  - **«Verificaría», comprobado por Code el 02/10**: con el troceado actual del repositorio, la
    frase 72 (267 caracteres) cae entera en un solo trozo, el 8 de 15. `verifyQuote` la da por buena
    entera, y también su tramo «un punto de retirada centralizado, ubicado en la clínica de
    Chamberí». Es el troceado de hoy, no los trozos guardados en producción.
  - **Sin predicción todavía**: cuando se decida el arreglo, el arquitecto la escribe con su banda,
    como manda la regla nueva.

**LO QUE ESTA FICHA TIENE QUE DEJAR CLARO: ESTO NO SE ARREGLA EN EL COMPROBADOR.**
- Si el juez redacta, **el comprobador tiene razón al rechazarlo**: la frase publicada no estaría
  en el documento.
- Aflojarlo sería aceptar citas falsas, y es la familia de B.311.
- **El arreglo, cuando llegue, es del lado del juez**: pedirle copiar en vez de redactar, y
  comprobar que obedece, con caso rojo y verde y antes y después.

**Sin arreglo. Una ficha, y a la cola** del orden del 02/10, detrás de B.312.

**⚠️ AÑADIDO EL 10/10/2026 — UN DATO HISTÓRICO QUE NO ES LO QUE PARECE: ES UN ARTEFACTO DE LA
COLUMNA, NO UNA MEDIDA DE LA PUERTA.**
- **El dato** (consulta del director del 10/10): `new 9.txt`, 17 pasadas entre el 29/07 y el
  14/08, 92 contradicciones encontradas y CERO confirmadas; `new 7.txt` 10 y 0, `new 15.txt` 8 y
  0, `new 8.txt` 1 y 0. Desde finales de septiembre, encontradas y confirmadas coinciden.
- **La lectura que se dictó y era falsa**: «en julio y agosto la puerta se lo comía todo».
- **Lo que dice el código**: hasta el 24/08/2026 `contradictions_confirmed` valía 0 siempre en el
  modo rápido. El mensaje de 3dd8670c, literal: «contradictions_confirmed era estructuralmente 0
  en todo el modo rapido: contaba `confidence === 'alta'`, y synthesize.ts construia las
  discrepancias con una lista cerrada de cinco campos donde confidence no estaba». Las cuatro
  series son anteriores a ese commit. Esas 92 SE PUBLICARON: el cero era la columna, no la puerta.

**⚠️⚠️ LA TRAMPA, PARA CUALQUIERA QUE MIRE ESA TABLA: `contradictions_found` Y
`contradictions_confirmed` NO SIRVEN PARA MEDIR PÉRDIDAS.**
- **LAS DOS SE ESCRIBEN AL FINAL**, sobre lo publicado (`lib/persist-analysis.ts:100-101`):
  `contradictions_found` = `analysis.discrepancies.length`, las PUBLICADAS, después de la puerta,
  de la cascada y de la síntesis (sin las inconsistencias menores); `contradictions_confirmed` =
  las publicadas con `confirmedBy`.
- **DESDE EL 24/08 SON IGUALES POR CONSTRUCCIÓN**: todo lo que sobrevive a la cascada sale sellado
  (`'juicio'`, `pipeline.ts:564`; `'estructura'` el diff). Que coincidan NO dice «no se pierde
  nada»: dice que miden casi lo mismo.
- **NINGUNA DE LAS DOS VE LO QUE SE PERDIÓ ANTES DE PUBLICAR.** Lo que el juez emitió y dónde
  murió sólo está en las claves por pareja del jsonb (`descartesPorCita`, `discarded`), como lee
  `SQL_B357_destino_de_las_contradicciones_NOR11_CLI13.sql`.

### 📋 B.314 — LA CITA NO LLEGA AL USUARIO: en el modo rápido, casi ninguna vista enseña una cita (ficha de PRODUCTO, SIN arreglo, decide el director; 02/10/2026)

**De dónde sale**: la pregunta del arquitecto del 02/10 sobre qué vistas enseñan las citas,
contestada leyendo la interfaz. Leído, no ejecutado. No es un fallo del análisis, y no se arregla
donde se está trabajando: por eso es una ficha propia.

**LO QUE VE EL USUARIO, vista a vista:**

| Vista | Contradicciones | Solapamientos |
|---|---|---|
| Modal del análisis **rápido**, desde el chat y desde la bandeja (`components/AnalysisModal.tsx:276-283`) | **sólo el número**, con la invitación al exhaustivo | descripción y gravedad, **sin citas** (`:326-359`) |
| Modal del análisis **exhaustivo** (`:285-297`) | el tema y **las dos citas** | descripción y gravedad, sin citas |
| **Editor de mejora** abierto desde el **chat** tras un rápido | **ninguna**: se quitan antes de abrirlo (`hooks/chat/useDocuments.ts:314-319`) | descripción y gravedad; la cita del nuevo sólo sirve para saltar al fragmento |
| **Editor de mejora** abierto desde la **bandeja** | **las dos citas**, en la descripción (`components/improvement/problems.ts:302`, pintada en `ChatPanel.tsx:539`): la bandeja le pasa el análisis guardado entero, también si es rápido (`app/(authenticated)/settings/review/page.tsx:230-247`) | descripción y gravedad, igual |

- La cita del lado existente de un solapamiento, `evidence`, **no la lee ningún componente de la
  interfaz**.
- ⚠️ **Precisión de Code al enunciado del arquitecto** («en el modo rápido no se le enseña ni una
  cita»): es así **salvo por un camino**. El editor abierto desde la bandeja recibe el análisis
  rápido entero y pinta las citas de sus contradicciones. Desde el chat, no: se quitan con un
  comentario que dice que «las contradicciones se verifican y trabajan desde el análisis
  exhaustivo». Dos caminos al mismo editor tratan distinto el mismo análisis rápido.
- ❓ **LA PREGUNTA QUE DEJA ABIERTA** (arquitecto, 02/10): **¿cuál de los dos caminos es el que está
  bien?** Uno de los dos lo está, y el otro es un descuido. Las dos líneas:
  - el chat quita las contradicciones del rápido antes de abrir el editor
    (`hooks/chat/useDocuments.ts:314-319`);
  - la bandeja le pasa el análisis guardado entero (`app/(authenticated)/settings/review/page.tsx:246`).
- 🔁 **EL MISMO DEFECTO, EN EL OTRO EXTREMO** (arquitecto, 02/10): el editor tiene sus propias búsquedas
  de cabeza y cola, más laxas (15 caracteres por punta): `findTolerant` (`lib/texto/localizar-cita.ts:48`),
  que usan el estilo y el chat de mejora, y `findMatchRange` (`components/improvement/problems.ts:200`,
  cabeza y cola en `:247`). **Son el mismo sello de goma de B.318 en el lado de la pantalla**: con una
  cita como la de 434 caracteres del autoclave, harían saltar al sitio equivocado. **No se tocan
  ahora.**

**LAS TRES COSAS QUE LA HACEN IMPORTAR** (arquitecto, 02/10):
- **(a) Lo que hace creíble el producto es la FRASE, no el recuento.** «Hay 2 contradicciones» pide
  un acto de fe; «esta frase dice 72 horas y esta otra dice 7 días», no.
- **(b) EL DATO YA ESTÁ**: verificado, guardado y persistido. **Esto no es construir una función:
  es pintar lo que ya existe.** Lo que haría falta, en una línea: que el modal del rápido pinte
  `newDocSays` y `existingDocSays` de cada contradicción, como ya hace el exhaustivo, y
  `evidenceInNewDoc` y `evidence` de cada solapamiento. Para eso, `synthesize.ts` tendría que
  dejar de juntar los puntos de una pareja en una sola descripción, y la cita del existente
  tendría que viajar hasta `overlaps`, donde hoy no llega.
- **(c) ⚠️ EL REENCUADRE, que va también a B.311**: en los solapamientos, la comprobación de citas
  **no protege lo que el usuario lee**. Protege la decisión de publicar la pareja (sólo se publica
  si sobrevive alguna cita) y el destino del salto en el editor.
  - **La cita es evidencia para nosotros, no para el usuario.**
  - En las contradicciones sí es lo que el usuario lee, pero sólo en el exhaustivo y en el editor.

**Sin arreglo, y sin tocar nada.** Si entra en el tablero, y en qué puesto, lo decide el director;
se lo plantea el arquitecto.

✅ **CORREGIDA EL 04/10/2026: B.314 ESTÁ EN BUENA PARTE HECHO, y el arquitecto la tenía como pendiente.** Las
citas de las contradicciones **sí** se enseñan en pantalla, con la frase de cada documento, y **al
clicarlas la interfaz lleva a la línea dentro del documento analizado**. Lo confirmó el director
enseñándole la pantalla al arquitecto el 04/10.
- Por el código, es el **editor de mejora**: cada contradicción lleva sus dos citas en la descripción, y su
  cita del lado nuevo es la referencia del salto (`textRef`). Al clicar, el editor la busca en el texto y
  la selecciona (`goToProblem`, `components/ImprovementModal.tsx:318-334`).
- **LO QUE FALTA no es pintar citas**: es **(a)** que los solapamientos tengan la suya y sean clicables, y
  **(b)** poder abrir el otro documento desde el hallazgo, con su fecha de última modificación.
- 🧾 **Error del arquitecto, archivado**: estuvo días diseñando contra una pantalla que no había visto.
  Regla al protocolo: antes de diseñar sobre la interfaz, se mira la interfaz.

**🔎 LAS CITAS DE LOS SOLAPAMIENTOS: DÓNDE SE PIERDEN** (lectura de Code, 04/10, sin tocar nada). El hecho que
la pide: en la pasada de NOR-11 de las 16:26, el log verifica **cinco** solapamientos con CLI-13, cada uno
con sus dos citas literales, y en pantalla sale **una sola entrada**, con las cinco descripciones pegadas
en un párrafo, una severidad y ninguna cita.
- **SE GUARDAN, cada punto con sus dos citas.** `judgments[].overlappingContent[]` va entero dentro de
  `analysis_results.analysis`: `description`, `evidenceInNewDoc` y `evidence`, ya verificadas (B.312 lo
  comprobó contra 65 análisis archivados).
- **SE FUSIONAN AL PUBLICAR**: `construirOverlaps` (`lib/analysis/synthesize.ts:136-197`) hace **una
  entrada por pareja**:
  - descripción = las de todos los puntos unidas con «. »;
  - severidad = la del solape de la PAREJA (`overlapPercent`: alta desde 60, media desde 30), no la de
    cada punto;
  - `textRef` = la cita del lado nuevo del **primer** punto que la tenga;
  - y la cita del lado existente no viaja.
- **¿Deliberada?** Está así **desde que nació el fichero** (`f78eb6ad`, 12/04/2026, «Create
  synthesize.ts»). **No hay ficha ni commit que la justifique.** F-45 (`e16296e1`, 24/08) la conservó a
  propósito para el montón del juez, porque el modal ya agrupa por documento. Es la forma original del
  dato, no un efecto colateral de un cambio, y nadie la decidió por escrito.
- **¿LLEGAN AL FRONTEND?**
  - **Por el chat, no**: la respuesta del análisis es una lista cerrada que lleva `overlaps` y no
    `judgments` (`app/api/analyze-v2/route.ts:812-840`). A la pantalla le llega una entrada por pareja,
    y como mucho la cita nueva del primer punto, como referencia del salto.
  - **Por la bandeja, sí, pero nadie las lee**: las dos rutas de la bandeja devuelven el jsonb entero, con
    `judgments` dentro (B.313). **Ningún componente lee `judgments`.**
- **¿SE PODRÍAN LOCALIZAR COMO LAS CONTRADICCIONES?** Con lo que ya se guarda, **sí**, en el lado nuevo:
  - El salto de las contradicciones no usa nada más que la cita: el editor busca el texto del `textRef`
    en el documento (`findTolerant`, `lib/texto/localizar-cita.ts:48`).
  - Cada punto de solapamiento tiene su cita del lado nuevo guardada (`evidenceInNewDoc`). Hoy sólo se
    usa la del primero, porque la entrada es una por pareja: **al clicar, salta al primer punto, y los
    otros cuatro no se pueden alcanzar.**
  - **Lo que falta no es un dato, es la forma de la entrada**: un punto, una entrada, con su cita.
  - Para el **otro documento**, cada punto tiene también su cita del lado existente (`evidence`), y cada
    entrada publicada lleva ya `existingDocumentId`.
  - ⚠️ **Y la búsqueda del editor es la de cabeza y cola de 15 caracteres** (`findTolerant`; B.314, «el
    mismo sello de goma en el otro extremo»): con citas literales salta bien; con una esculpida, puede
    saltar al sitio equivocado. Ficha propia: B.326.

**🛠️ EL ARREGLO PEDIDO: UN PUNTO DE SOLAPAMIENTO, UNA ENTRADA** (arquitecto, 04/10). Cada punto, su propia
entrada, con su descripción, su cita del lado nuevo (la del salto) y su cita del lado existente. Reglas:
la severidad no se inventa; nada de datos nuevos; el salto del editor es B.326; y antes de escribir
código, dos respuestas. **Las dos respuestas de Code (04/10), sin escribir código:**
- **1 · LA SEVERIDAD SE QUEDA EN LA PAREJA, y se enseña una vez por documento.** No hay que inventar nada
  para eso: **las dos pantallas ya agrupan los solapamientos por documento**.
  - El editor de mejora hace una cabecera por documento, «Con "doc" (N fragmentos)»
    (`components/improvement/ChatPanel.tsx:448-473`), y debajo una tarjeta por entrada.
  - El modal del análisis también agrupa por documento (`components/AnalysisModal.tsx:326-359`).
  - **Cómo se haría**: cada punto, su tarjeta, sin severidad propia. La severidad de la pareja —una sola,
    sale del `overlapPercent` del juez— pasa a esa cabecera por documento, que hoy no la enseña. Todos
    los puntos de una pareja comparten la suya, así que no hay nada que elegir.
- **4 · QUÉ CAMINO USA LA PANTALLA DEL DIRECTOR.**
  - **La pantalla es el EDITOR DE MEJORA.** El texto que pegó el arquitecto, «Solapamiento con "…"» y una
    descripción que acaba en «(severidad: media)», es exactamente el que construye
    `components/improvement/problems.ts:283-286`. El modal del análisis lo pinta distinto: la severidad
    en una línea aparte.
  - **Por deducción, y hay que confirmarlo**: el editor viene de la BANDEJA. Desde el chat, un análisis
    rápido entra al editor sin contradicciones (`hooks/chat/useDocuments.ts:314-319`), y el director ve
    en esa pantalla las contradicciones con sus citas y su salto. Desde la bandeja entra el análisis
    guardado entero (`app/(authenticated)/settings/review/page.tsx:246`). **Lo confirma el director con
    una pregunta: ¿abrió el editor desde la bandeja?**
  - **Lo que eso decide**: por la bandeja llegan `judgments` dentro del análisis guardado, así que el
    cambio **podría** ser sólo de pantalla. Por el chat no llegan, porque la respuesta del análisis es una
    lista cerrada sin `judgments` (`app/api/analyze-v2/route.ts:812-840`).
- **LAS TRES FORMAS DE HACERLO, con su coste, para que decida el arquitecto:**
  1. **Sólo la pantalla**: `problems.ts` saca una tarjeta por punto de `judgments[].overlappingContent`
     cuando están, y si no están, como hoy.
     - No toca nada guardado.
     - Sirve para la bandeja y no para el chat: **el mismo análisis se vería de dos formas según por
       dónde se abra**, que es lo que B.314 ya señaló con las contradicciones.
  2. **Cada entrada publicada lleva sus puntos dentro**: `construirOverlaps` sigue haciendo una entrada
     por pareja (misma severidad, mismo recuento) y le añade la lista de sus puntos, copiada de
     `overlappingContent` —descripción, cita del nuevo y cita del existente—, sin calcular nada. Viaja por
     los dos caminos, porque `overlaps` ya va en la respuesta cerrada y en lo guardado.
     - **Pega en tres sitios, y se dice antes**: (a) la prueba de la evidencia archivada
       (`lib/analysis/evidencia-archivada.test.ts`, que rehace lo publicado y lo compara con lo guardado
       65 de 65) se pondrá roja a propósito, porque lo nuevo lleva un campo que lo archivado no tiene: hay
       que reescribirla para que compare lo de siempre; (b) los análisis anteriores no traen la lista, y
       la pantalla tiene que caer a la entrada fundida; (c) las citas quedan dos veces dentro del mismo
       análisis guardado, en `judgments` y en `overlaps`.
  3. **Una entrada publicada por punto**, que es lo literal del encargo.
     - Cambia lo que cuentan `overlaps_found` (la analítica pasaría de parejas a puntos), el contador de
       la bandeja (`components/review/ReviewDocumentRow.tsx:46`), la consulta de B.312 (que empareja por
       pareja) y la prueba de la evidencia archivada.
     - **No la recomiendo.**
  - **La recomendación de Code es la 2**: una forma para los dos caminos, el recuento intacto, y nada
    calculado. Lo decide el arquitecto.

**✅ LA DECISIÓN: OPCIÓN 2, CON TRES CONDICIONES** (arquitecto, 04/10/2026).
- **El camino, confirmado por el director**: abrió el editor **desde la bandeja de revisión**, clicando en
  la etiqueta del documento y dándole a «Mejorar con IA». Es el camino por el que llegan los juicios.
- **Por qué la 2** (arquitecto): **no cambia la unidad de recuento.** Hoy «3 solapamientos» son 3
  parejas. La opción 3 lo habría convertido en 3 puntos y habría movido a la vez, y en silencio, los
  contadores, el resumen de la bandeja, la analítica y la consulta de B.312. **El recuento se queda igual;
  el detalle se añade dentro.** La 1 queda descartada: el mismo análisis se vería de dos formas según por
  dónde se abra, y eso es un «ayer funcionaba» esperando a ocurrir.
- **La severidad se queda en la pareja y se enseña una vez, en la cabecera del documento.** No se inventa
  una por punto, porque el juez no la da.
- **Cada punto tiene que ser alcanzable**, como las contradicciones: la lista que viaje lleva la cita del
  lado nuevo de cada punto, que es lo que usa el salto. Así se llega a los cinco, no sólo al primero.

**1 · LA MEDIDA, ANTES DE ESCRIBIR** (Code, 04/10, sobre los 65 análisis archivados del examen): cuánto
crece el análisis guardado si cada entrada lleva sus puntos (descripción, cita del nuevo y cita del
existente).

| | Mediana | p95 | Peor caso |
|---|---|---|---|
| El análisis guardado hoy | 6.465 B | 79.686 B | 79.845 B |
| Lo que añade la lista | +1.104 B | +2.072 B | +2.385 B |
| Con la lista | 8.437 B | — | 81.589 B |

- Crecimiento mediano del 14,3 %, y máximo del 34,1 % (en un análisis pequeño, N3, de 7.091 B).
- **No roza ningún tope.**
  - **B.297** es un tope de FILAS (1.000 por respuesta), y un análisis es una sola fila.
  - El tope de bytes que podría importar es el de la respuesta de una función de Vercel, de unos 4,5 MB.
    Es la cifra conocida de Vercel, **no medida aquí**.
  - **El peor caso teórico**: el prompt pide como mucho 5 solapamientos por pareja (`judge.ts:840`), y
    hay hasta 6 parejas en el rápido (`MAX_SELECTED_QUICK`, `lib/analysis/rerank.ts:28`) y 10 en el
    exhaustivo. Del orden de 1 KB por punto con sus dos citas: **unos +50 KB como mucho**. Aunque el
    juez se saltara el máximo del prompt, lo acota su tope de salida (4.096 tokens por pareja): unos
    +160 KB.
- **Lo que esta medida no ve**: el archivo del examen es de análisis rápidos. Los exhaustivos de la base
  pueden ser más grandes, y el tope teórico de arriba es el que los cubre.

**2 · EL RESPALDO, ESCRITO PARA QUE NADIE LO REPORTE COMO FALLO:**
> **Los análisis guardados antes de este cambio se seguirán viendo como un solo bloque, y no es un
> fallo.** No traen la lista de puntos, y la pantalla cae a la entrada de siempre: una por documento, con
> las descripciones unidas y el salto al primer punto.

**3 · LA PREMISA NUEVA DE LA PRUEBA DE LA EVIDENCIA ARCHIVADA, escrita ANTES de tocarla** (la pide el
arquitecto: no se ajusta en silencio).
- **Lo que garantiza hoy** (`lib/analysis/evidencia-archivada.test.ts`): el lector de producción
  (`construirOverlaps`) rehace, desde los juicios guardados, **exactamente** los solapamientos que se
  publicaron (65 de 65). Con la lista añadida, eso deja de ser cierto **a propósito**: lo de hoy lleva un
  campo que lo archivado no tiene.
- **La premisa nueva, propuesta por Code, para que la vea el arquitecto antes de reescribir nada:**
  > Para cada análisis archivado, `construirOverlaps` rehace **el mismo número de entradas, en el mismo
  > orden**, y cada una es **idéntica, campo por campo, en todos los campos que tenía la archivada**
  > (`existingDocument`, `existingDocumentId`, `description`, `severity`, `overlapPercent`, `textRef`,
  > `confirmedBy`). Lo único nuevo es la lista de puntos, y esa lista es **exactamente** la de los puntos
  > del juez de esa pareja, en su orden, cada uno con su descripción, la cita del lado nuevo y la del
  > existente, sin un carácter cambiado. Las entradas estructurales no llevan lista.
- **Lo que sigue garantizando**: que el recuento no se mueve; que nada de lo que ya se publicaba cambia;
  y que la lista no inventa nada (sale de lo guardado, no se calcula).
- **Lo que no puede garantizar**: que la pantalla caiga bien con los análisis viejos. Eso no lo ve esta
  prueba: es de la pantalla.
- **No se reescribe hasta que el arquitecto vea esta premisa.**
- **El nombre propuesto para la lista**: `puntos`, con `descripcion`, `citaNuevo` y `citaExistente` por
  punto, los mismos nombres de lado que `descartesPorCita` (B.313).
- ✅ **CONFORMIDAD DEL ARQUITECTO (04/10), con una adición y dos afirmaciones**: la lista y la descripción
  publicada hablan de los mismos puntos, ni uno más ni uno menos, contados sobre los 65; el orden es el
  del juez, así que el primer punto sigue siendo el primero; y si algún deduplicado toca los puntos, se
  dice antes de escribir. Los nombres, aceptados. Dos commits: A (la lista, backend) y B (la pantalla).

**🛠️ COMMIT A, HECHO (05/10/2026): CADA ENTRADA PUBLICADA DEL JUEZ LLEVA SU LISTA DE PUNTOS.** Backend, invisible en
pantalla. El commit B, la pantalla, va después y con verde entre medias.
- **Antes, la partición**: `types.ts` tenía 637 líneas y su disparador escrito (B.313). Lo publicado
  —`FinalAnalysis` y sus tipos— pasó a `lib/analysis/tipos-del-analisis-publicado.ts`, reexportado, sin
  cambio de comportamiento ni de imports (`1ea807a8`). `types.ts` bajó a 313 líneas.
- **El cambio**: `construirOverlaps` (`lib/analysis/synthesize.ts`) añade a cada entrada del juez
  `puntos`, con `descripcion`, `citaNuevo` y `citaExistente` (`PuntoDeSolapamiento`). Sale del mismo
  `judgeEntries` que la descripción publicada, así que habla de los mismos puntos por construcción.
  Copiado, no calculado. Las estructurales no llevan lista.
- **La afirmación 2 del arquitecto, comprobada antes de escribir**: **ningún deduplicado toca los
  puntos.** B.309 deduplica TROZOS en la recuperación, antes de elegir documentos. Entre el juez y
  `construirOverlaps`, la lista sólo cambia en la cascada, que AÑADE (las contradicciones reclasificadas
  y las estructurales, `pipeline.ts:634`) sin quitar ninguna.
- **LA PRUEBA, con la premisa cambiada a propósito y escrita en el fichero**
  (`lib/analysis/evidencia-archivada.test.ts`). Sobre los 65 análisis archivados, comprueba:
  - el mismo número de entradas y en el mismo orden;
  - cada una idéntica en todos los campos que tenía la archivada;
  - la lista = los puntos del juez de esa pareja, en su orden y con sus citas sin tocar;
  - **la lista y la descripción publicada hablan de los mismos puntos** (la descripción es la lista
    unida);
  - **el primer punto sigue siendo el primero**: el salto de la entrada (`textRef`) lleva adonde llevaba;
  - y las estructurales, sin lista.
  - **Contándolos: 59 entradas del juez y 211 puntos.** Con las 5 estructurales, las 64 entradas
    publicadas del archivo. La primera versión de la prueba decía 65 entradas sin haberlo medido: 65 es
    el número de análisis. Se midió antes del commit.
  - **El rojo, de fallo**: con el código de antes, los campos de siempre ya coincidían y la lista no
    estaba.
- **El respaldo, en el propio tipo**: los análisis guardados antes de este cambio no traen `puntos`, y se
  verán como un solo bloque. **No es un fallo.**
- **Sin sello, a propósito** (regla nueva del protocolo): es un cambio determinista con prueba.

**🖥️ COMMIT B, LA PANTALLA: ESPECIFICADO Y PARADO ANTES DE ESCRIBIR** (arquitecto, 05/10/2026). Una tarjeta por
punto, dentro de la cabecera de su documento:
- primero, la descripción del punto;
- debajo, las dos citas con su dueño, con las palabras de las contradicciones: «Este documento: "…"» y
  «nombre-del-otro.docx: "…"»;
- clicable sólo la cita de este documento (`citaNuevo`). Si viene vacía, la tarjeta sale sin nada que
  invite a clicar;
- la cabecera lleva, una sola vez, el nombre del documento, cuántos puntos hay y la severidad de la
  pareja;
- y los análisis sin lista, como hoy, en un bloque.
- **De paso se arregla una cosa**: al dejar de unir las descripciones desaparecen los dos puntos seguidos
  que veía el director («…cada uno.. Criterio de clasificación…»).

**0 · CUÁNTAS TARJETAS: SE PARA, porque el peor caso posible pasa de 15** (la condición del arquitecto):
- **El archivo del examen no contesta**: cada análisis se compara con UN documento. Ahí el máximo son 6
  tarjetas y la mediana 3, y eso no es producción.
- **El peor caso posible**: hasta 30 tarjetas en el rápido (6 parejas, `MAX_SELECTED_QUICK`, × 5 puntos,
  el máximo del prompt) y 50 en el exhaustivo, más una por cada entrada estructural.
- **El peor caso real NO CONSTA**: lo mide `SQL_B314_tarjetas_por_analisis.sql`, de sólo lectura y
  PENDIENTE DE EJECUTAR (mediana, p95, peor caso, cuántos análisis pasan de 15 y el documento que más
  acumula). Cuenta desde los juicios guardados, así que vale también para los análisis anteriores al
  commit A.

**2 · QUÉ CUENTA HOY CADA NÚMERO** (lectura de Code, 05/10):
- **La N de la cabecera del editor**, «Con "doc" (N fragmentos)» (`components/improvement/ChatPanel.tsx:473`):
  **cuenta ENTRADAS publicadas de ese documento**, no trozos ni puntos. Lo normal es 1, y 2 si el documento
  tiene además una entrada estructural. **«Fragmentos» ya es la palabra equivocada hoy.** Con el cambio
  tiene que contar las tarjetas que hay debajo: un número encima de una lista cuenta esa lista.
- **La bandeja**, «N solapamiento(s)» (`components/review/ReviewDocumentRow.tsx:46` y `:60`): N es
  `overlaps_found` = **entradas publicadas** (`app/api/documents/review-list/route.ts:182`), no documentos ni
  puntos. Un documento con entrada del juez y entrada estructural cuenta 2; en el archivo del examen pasa en
  4 de 65 análisis.
- **La etiqueta, sin tocar el número** (regla del arquitecto: se arregla la etiqueta, nunca el número):
  - Code propone «N bloque(s) de solapamiento», la única palabra corta que dice exactamente lo que cuenta.
  - «Con N documento(s)» sería más clara, pero mentiría en ese 6 % en que un documento tiene dos entradas.
  - Lo decide el arquitecto.

**✅ LAS TRES DECISIONES DEL ARQUITECTO (05/10/2026)**:
- **Agrupadas y plegadas.** Las contradicciones, desplegadas siempre. Los solapamientos, por documento y
  plegados, salvo los de severidad alta. La severidad pasa así a decidir algo.
- ⚠️ **La consulta ya no es condición previa**: `SQL_B314_tarjetas_por_analisis.sql` se ejecuta cuando el director
  tenga un hueco. Plegar por defecto es lo correcto con 5 tarjetas y con 30, así que el dato no cambiaría la
  decisión. **Una medida que no puede cambiar la decisión no la retiene.** Sigue valiendo para saber si el
  plegado importa en la práctica.
- **La etiqueta de la bandeja no se toca.** Una entrada ES un solapamiento con un documento, y la cabecera
  del editor dice cuántos puntos tiene dentro: dos unidades, cada una con su nombre. Sólo cambia
  «fragmentos», que pasa a contar puntos.
- **Opción 2**: la unidad sigue siendo la entrada, con sus puntos dentro. La opción 1 cambiaba lo que lee el
  modelo del chat de mejora dentro de un commit de pantalla, y el significado de «descartar». El coste
  aceptado tiene ficha propia: B.327.

**🛠️ COMMIT B, HECHO (05/10/2026). Antes, en su propio commit (`2db5eccd`), dos particiones sin cambio de
comportamiento:**
- el pintado de los solapamientos sale de `ChatPanel.tsx` a `SolapamientosPorDocumento.tsx`. `ChatPanel.tsx`
  baja de 800 a 712 líneas; sigue por encima del tope, pero este cambio ya no lo hace crecer;
- `RawAnalysis` sale de `problems.ts` a `analisis-crudo.ts`, reexportado. `problems.ts` estaba en 400 justas.

**Lo que se ve:**
- Cada documento lleva una cabecera, siempre visible: «Con "X" · 5 puntos · solape medio». Un clic despliega.
- **Plegado por defecto salvo severidad alta**, y sin severidad (el duplicado), desplegado.
- Dentro, cada entrada del juez enseña **una tarjeta por punto**:
  - primero, la descripción del punto;
  - debajo, «En este documento: "…"» y «En "X": "…"», las mismas palabras que las contradicciones;
  - **sólo la cita de este documento se clica.** Si no hay cita, dice «sin cita» y no hay nada que clicar.
- **«No es error» y «Solventar» se quedan en la entrada y no se repiten en las tarjetas**: actúan sobre todos
  los puntos, y el botón está donde está su alcance.
- **Los análisis sin lista se pintan como siempre**, en un bloque. Su cabecera lleva la severidad y no lleva
  número.
- **De paso se arregla una cosa**: desaparecen los dos puntos seguidos que veía el director («…cada uno..
  Criterio…»). Ya no se enseña la descripción unida; se enseña cada punto. La descripción unida sigue
  existiendo, y es lo que lee el modelo.

**Cómo queda atado el salto**: cada tarjeta llama al mismo `goToProblem` con una copia de su entrada cuya
`textRef` es la cita de ese punto (`tarjetasDeLaEntrada`, `components/improvement/solapamientos.ts`).
`goToProblem` sólo lee `textRef`, así que el editor no se toca.

**Lo que decide la pantalla vive fuera del JSX** (`solapamientos.ts`), como `mostrarAccionesDeFila`, porque
Vitest no admite React. La prueba (`solapamientos.test.ts`) cubre:
- **con lista y sin lista**, en sintético;
- sobre los 65 archivados en su forma vieja, ninguna entrada con lista;
- en la nueva, **lo que leen los prompts no cambia ni una letra** (id, título, descripción, salto y documento
  iguales), con 211 tarjetas;
- **y la prueba de aceptación del director, sobre el texto real**: cada punto se busca con la misma función
  del salto. El primero lleva adonde llevaba la entrada, y dos puntos de una misma entrada no llevan nunca
  al mismo sitio.
- **Control positivo**: con el salto atado a la entrada en vez de al punto, caen dos pruebas.

**La comprobación de B.326, medida antes de escribir**: en el archivo, **ninguna pareja de puntos de una
misma entrada comparte los 15 primeros caracteres de la cita** (324 parejas; ninguna cita vacía, idéntica ni
de menos de 30 caracteres). Además, la cabeza y cola sólo entra si la búsqueda literal falla.

⚠️ **LO QUE ENCONTRÓ LA PRUEBA DE ACEPTACIÓN, y no lo causa este cambio**: contra el texto extraído, **se
encuentran 118 de los 211 puntos**. De los 93 que no, **91 son filas de tabla pintadas** («a | b | c»), la
ceguera conocida; esa forma no está así en el texto. **Ya hoy el salto de 25 de las 59 entradas no encuentra
su sitio** (24 filas y 1 de prosa). Lo que cambia es que ahora se ve en cada punto. Para la comprobación del
director: **un documento de prosa**. En uno de tablas, «no se encontró el fragmento» es el aviso de siempre.

**Sin sello**: cambio determinista con prueba.

**📌 SÓLO SE CLICA LO QUE SE ENCUENTRA (arquitecto, 05/10/2026), PARADA ANTES DE ESCRIBIR:**
- **La regla**: un punto es clicable sólo si su cita se localiza de verdad en el texto abierto. Al pintar,
  se busca, y si no se encuentra la tarjeta lo dice, sin cursor de mano. No se adivina si una cita es
  localizable: se comprueba.
- **Por qué importa**: es B.311 en el otro extremo. Allí se publicaba una cita que no existía; aquí se
  ofrece un salto a un sitio que no está.
- **Por qué se para: el coste se nota.** Sobre el texto más largo del archivo (60.038 caracteres), 30
  búsquedas que fallan tardan **208 ms por pintado**. Cada búsqueda fallida rehace la normalización del
  texto entero (unos 7 ms), y `ChatPanel` recibe el texto en cada pulsación de tecla, así que serían unos
  200 ms por letra escrita.
- **Pendiente de decisión** (la cura que propone Code): normalizar el texto una vez por cambio de texto y
  reutilizarlo en las treinta búsquedas, con el mismo criterio de `findTolerant` y en su mismo fichero; más
  esperar a que el usuario deje de escribir antes de recontar.
- **De paso, la medida (a)**: las contradicciones están peor (B.328).
- **La etiqueta de la pantalla del análisis**: «fragmentos» pasa a «entradas», que es lo que cuenta el
  número (`components/AnalysisModal.tsx:343`).
- **`findMatchRange`, borrado**: era una segunda búsqueda de citas sin ningún llamador.
- **El disparador de `ChatPanel.tsx`** (712 líneas, arquitecto): lo próximo que haya que añadirle obliga a
  partirlo primero.








### 📋 B.315 — EL JUEZ EMITE SOLAPAMIENTOS GENÉRICOS QUE EL PROMPT YA LE PROHÍBE, Y PASAN LA COMPROBACIÓN DE CITAS (ficha de CALIDAD; CERRADA el 04/10 como «no se filtra»; REABIERTA el 07/10 por frecuencia; 02/10/2026)

**De dónde sale**: la pantalla de NOR-11 que miró el director el 02/10 (B.312). Los tres puntos
publicados del solapamiento con CLI-12 son:
- «ambos documentos pertenecen al sistema de gestión de calidad de Dentavia»;
- «ambos documentos son emitidos por Dirección de Operaciones»;
- «NOR-11 menciona que se relaciona con CLI-12».

**LO QUE EL PROMPT YA PROHÍBE** (`lib/analysis/judge.ts:834-835`):
- «En description: describe QUÉ contenido concreto comparten los dos documentos […]. **No vale
  describir características genéricas** que compartirían casi todos los documentos de la empresa
  (**mismo autor**, misma plantilla, ambos citan normativa, ambos tienen sección de referencias).
  Si lo único en común es de ese tipo, NO emitas el solapamiento».
- «**Una REMISIÓN no es solapamiento** ni contradicción. Si el documento nuevo se limita a remitir
  a otro documento […] no emitas hallazgo con ese documento por esa remisión».
- **Los tres caen en lo prohibido**: los dos primeros son rasgos genéricos («emitidos por
  Dirección de Operaciones» es literalmente «mismo autor»), y el tercero es una remisión.

⚠️ **Y PASAN LA COMPROBACIÓN DE CITAS SIN PROBLEMA**: las frases que los sustentan existen y son
literales. **La comprobación de citas no protege contra esto, y no es su trabajo**: comprueba que
la frase está en el documento, no que lo que se dice con ella valga la pena. Es otra cosa que se
creía cubierta y no lo está.

**ESTO RECORTA LA GANANCIA DE B.312, y se reescribe con honradez** (se cuentan aparte, como lo
sembrado y lo no auditado):
- **De los 8 puntos publicados en NOR-11, 5 son contenido de verdad y 3 son genéricos.**
  - Los 5 de CLI-13: la clasificación en cuatro grupos, la prohibición de reencapsular agujas, el
    protocolo de derrames con EPI, el parte de incidencias y la formación anual.
  - Los 3 de CLI-12, de arriba.
- **De los 6 recuperados por B.312, 3 son contenido** (los de CLI-13, que pasan de 2 a 5) **y 3 son
  genéricos** (los de CLI-12).
- ⚠️ **Corrección de Code al enunciado, ACEPTADA por el arquitecto (02/10)**: el encargo decía «de
  los seis puntos recuperados, cinco son contenido de verdad y tres de los otros son genéricos».
  Cinco más tres son ocho, que son los PUBLICADOS, no los recuperados. **De los 6 recuperados por
  B.312, 3 son contenido y 3 son genéricos.**
- ⚠️ **No consta para Code de qué análisis es la pantalla.** Las dos pasadas de las 08:56 y las
  08:58 emitieron 3 solapamientos con CLI-12. En la de las 09:24, el registro de las citas que
  pasan dejó dos longitudes con CLI-12 (42 y 56), y cada línea de ese registro lleva los dos lados
  de UN solapamiento. Si «42 · 56» es una sola línea, en esa pasada se verificó uno.
  - **Aceptado (arquitecto, 02/10)**: en la de las 09:24, CLI-12 tenía **un** solapamiento, no
    tres, así que la pantalla que vio el director es de una pasada anterior.
  - Y lo que eso añade: **los solapamientos genéricos también son INESTABLES entre pasadas** (3, y
    luego 1).

**LO QUE ESTÁ EN JUEGO, para cuando se decida** (arquitecto, 02/10): no es un número. **Un cliente
que lee «ambos los emite Dirección de Operaciones» piensa que el programa es tonto**, y eso cuesta
más que un hallazgo perdido.

**📏 LA MEDIDA, ANTES DE CUALQUIER FILTRO** (pedida por el arquitecto el 04/10: «no escribas un filtro, mídelo
primero»). El ejemplo que vio el director, textual: «Ambos documentos mencionan que NOR-11 se relaciona con
CLI-12 en el contexto de auditoría de calidad de procesos críticos». Es el programa contando que los
documentos se citan entre sí.
- **Medido por Code en el archivo del examen del 27/09** (`examen/resultados/`, 65 análisis):
  - **211 puntos publicados** del juez, con 111 descripciones distintas;
  - **5 nombran el código o el nombre del OTRO documento** (2,4 %), que son 4 descripciones distintas,
    todas de NOR-11 con CLI-13 («Ambos documentos establecen que NOR-11 es el protocolo normativo y CLI-13
    es su traducción práctica para el gabinete, sin que CLI-13 sustituya a NOR-11», y tres variantes);
  - y **25 nombran CUALQUIER cosa con forma de código** (19 descripciones distintas).
- ⚠️ **EL RIESGO DE UN FILTRO A CIEGAS, medido**: casi todos esos 25 son **hallazgos buenos de los
  tarifarios**. Los códigos de tratamiento tienen la misma forma que los de documento: «Tarifa de
  Endodoncia unirradicular (END-01) con todos los parámetros idénticos», «Tratamiento HIG-01 (Limpieza
  bucal) con todos sus parámetros idénticos». **Un filtro por «nombra un código» se los llevaría por
  delante.** El criterio estrecho, «nombra AL OTRO documento», no los toca.
- **Por qué no basta el archivo**: es del 27/09 y de once casos. El ejemplo del director, NOR-11 con
  CLI-12, es del 04/10 y no está ahí.
- **Lo que lo mide en la base**: `SQL_B315_solapamientos_que_nombran_al_otro.sql`, de sólo lectura y
  PENDIENTE DE EJECUTAR. Da los totales con los dos criterios y diez ejemplos repetibles.
  - Tiene puesta la organización «Workspace principal» (`a9625e93…`), la de la cuenta correcta (B.323).

✅ **B.315 CERRADA COMO «NO SE FILTRA»** (arquitecto, 04/10/2026), y la cierra la medida de arriba: **5 de 211
puntos (2,4 %) nombran al otro documento**, y el criterio ancho se llevaría 25, la mayoría hallazgos buenos
de los tarifarios, porque «END-01» es un tratamiento y no un documento. **Un filtro a ciegas habría costado
los hallazgos de precios.**
- 📌 **Si algún día se toca, se toca en el PROMPT, y nunca con un filtro de texto sobre la descripción.**
- La SQL de B.315 se ejecuta cuando el director tenga un hueco: con un 2,4 % ya no frena nada.

**Sin arreglo.** Constancia.

🔁 **B.315 SE REABRE EL 07/10/2026, POR FRECUENCIA Y NO POR MECANISMO NUEVO.** La decisión del 04/10
sigue escrita y sigue en pie: **no se filtra; si se toca, se toca en el prompt.** Lo que cambia es que
el ruido de remisiones ya no es un 2,4 % de un archivo viejo sino una parte visible de la pantalla.
Datos del arquitecto sobre los logs y la pantalla del director; Code no los ha visto.
- **El 07/10, con el techo de solapamientos en 10 (568a77ab), DOS de los once puntos publicados de la
  pasada de 08:58 UTC son remisiones** (juicio completo en B.359 de Puntos_Pendientes_Doclity.txt):
  - la mutua NOR-11 ↔ CLI-13: «Este protocolo se complementa con […] CLI-13» frente a «Esta guía
    traduce a instrucciones prácticas […] NOR-11»;
  - la de CLI-12: «…y con el manual de calidad CLI-12, que establece el enfoque de auditoría
    aplicable…».
- **LA TASA ES PLANA, y eso DESMIENTE la hipótesis del arquitecto** («al liberar plazas, el juez mete
  lo que la regla prohíbe»): 1 de 6 puntos publicados el 06/10 con el techo en 5 (17 %), y 2 de 11
  el 07/10 con el techo en 10 (18 %). **Subir el techo NO aumentó el ruido de remisiones**: hay un
  caso más porque hay más salida.
- **La remisión mutua NO es nueva**: ya salió en el examen del 27/09 con el techo en 5 (arriba, «5 de
  211 puntos», las cuatro descripciones de NOR-11 con CLI-13). La hipótesis se construyó sobre «no
  aparece en las cuatro pasadas del 06/10» leído como «no ha aparecido nunca».
- **La cita de CLI-12 rota manteniendo el tema** «auditoría de procesos críticos», publicado el 05, el
  06 y el 07/10 según el arquitecto (y el 04/10 es el ejemplo del director de arriba). La cita de
  NOR-11 es siempre la misma remisión; la de CLI-12 cambia:
  - 06/10: «Este manual se revisa anualmente por Dirección de Operaciones…»;
  - 07/10: «La adopción de este sistema de calidad no responde únicamente a una exigencia normativa,
    sino a una decisión estratégica de Dentavia…».

  En los dos casos las dos citas no hablan de lo mismo. Es el falso positivo más persistente medido
  hasta hoy. CLI-12 se lee al 5 % (corte_honesto, 2.959 de 55.135; B.342 de Puntos), y encaja con el
  modelo revisado de F-118: los falsos nacen de escasez.

### 📋 B.316 — HAY TEXTO DE CLIENTE QUE NADA BORRA: el análisis del chat cuyo fichero no se indexa (ficha de NEGOCIO, SIN arreglo, decide el director; 02/10/2026)

**Lo que pasa**: un análisis del chat cuyo fichero no se indexa deja una fila de `analysis_results`
con frases de los documentos del cliente, y **nada la borra salvo la purga de la organización**. No
hay documento al que esté atada, así que el borrado de un documento no la alcanza.

**POR QUÉ IMPORTA MÁS DE LO QUE PARECE** (arquitecto, 02/10): **vendemos custodia de documentación
corporativa.** Un cliente que pide que se borre un documento espera que se borre lo que se sacó de
él. Por este camino, no se borra.

**Lo que queda en la fila**, dentro de `analysis`: las citas publicadas (`discrepancies[]`, y los
puntos de solapamiento), `judgments[]` con sus citas verificadas, y desde B.313 las citas
descartadas (`descartesPorCita`). Son frases del documento del cliente o escritas por el juez sobre
él.

**Por qué nada la borra**, con sus líneas:
- **`deleteDocument` borra los análisis por `document_id`** (`lib/delete-document.ts:166-169`, con el
  criterio de `lib/documents/analisis-del-documento.ts`, que a propósito no usa el nombre).
- El análisis del chat nace con `storage_path` y sin `document_id` (F-101). Sólo lo gana si el
  fichero se indexa: la indexación lo adopta (`app/api/ingest/route.ts:403-408`).
- **Si el fichero no se indexa, la fila no tiene documento**, y ningún borrado de documento la ve.
- **El ÚNICO camino que la borra hoy es la purga de la organización**: `purgeOrganization`
  (`lib/purge-org.ts:40`), que borra todos los `analysis_results` de la organización en
  `lib/purge-org.ts:117`. La llaman tres sitios:
  - al vencer el periodo de gracia tras cancelar: `app/api/admin/purge-expired/route.ts:51` y
    `worker/src/index.ts:531`;
  - y una purga pedida para toda la organización: `app/api/org/purge/route.ts:57`.

**Es anterior a B.313, y B.313 lo hereda**: hoy ya afecta a las citas publicadas y a `judgments[]` de
esas filas.

**Sin arreglo, y sin proponer uno.** Lo decide el director; se lo plantea el arquitecto.

### ⚠️ B.317 — RIESGO LATENTE: DESDE EL PUESTO 0, UN SIGNO ENTRE ESPACIOS YA NO DISTINGUE (constancia, SIN arreglo, latente; 02/10/2026)

**El cambio que lo trae** (puesto 0 de B.313, decidido por el arquitecto el 02/10, opción (a) del
informe de Code): `normalize()` quita los signos y DESPUÉS colapsa los espacios
(`lib/analysis/normalize-core.mjs`). Arregla la raíz de tres fallos —un signo suelto entre espacios
dejaba un espacio doble—, y el resultado nuevo es siempre el de antes con los espacios vueltos a
colapsar. **Casa más, nunca menos**, por construcción. Y ése es el riesgo, en los sitios donde «igual
tras normalizar» decide.

**EL CASO**: «temperatura - 5» frente a «temperatura 5» **no casaban antes y casan ahora**. El caso
decisivo, con su nombre de comportamiento nuevo y deliberado, en `lib/analysis/normalize.test.ts`
(«a - 5» frente a «a 5»). Sin espacios, «-5» frente a «5», ya se fundían antes: es el riesgo que el
propio `normalize-core.mjs` documenta. Lo nuevo es el signo con espacios a los dos lados.

**LAS DOS CONSECUENCIAS:**
- **A, en prosa**: `lib/analysis/finding-rules.ts:281` podría reclasificar una contradicción real como
  «equivalentes» y **NO publicarla**, si sus dos citas sólo se diferencian en un signo así.
- **B, en tablas**: dos filas que sólo se diferencien en un signo así podrían **colapsar como
  idénticas** (`findIdenticalAnalyzedRow`, `lib/analysis/retrieval.ts`, F-44), y la contradicción no
  se vería.

**LA MEDIDA DE HOY: 0 casos** (Code, 02/10, antes del cambio):
- 20 textos del corpus;
- 0 celdas de los `.xlsx` cuyo valor normalizado cambia;
- 0 parejas de celdas de una misma columna que se fundan de nuevas;
- 0 de las 202 contradicciones archivadas del examen pasan a «equivalentes»;
- y ninguna ancla de `examen/casos/` lleva un signo suelto entre espacios.

Con el cambio hecho, la suite entera, con la del examen, sigue verde: 1.826 de 1.826.

**QUÉ LO SACARÍA DE LATENTE**: la primera vez que un contador o una revisión vea una contradicción
reclasificada a «equivalentes», o dos filas colapsadas, **por un signo**.

**Lo que NO toca el cambio**, comprobado:
- Ninguna identidad guardada usa `normalize`: las huellas de descarte van sobre el texto en crudo
  (`lib/analysis/huella-hallazgo.ts:141` y `:213`).
- El nivel seguro de las tablas (`claveSegura`, `esVarianteDeEscritura`) no quita signos, y no cambia.
- `lib/examen/comparador-tabular.mjs` no usa `normalize`.
- ⚠️ **Y una copia que se queda como está**: `makeDiscrepancyFingerprint` (`lib/analysis/double-check.ts:310-318`)
  tiene su propia normalización, con el mismo orden de antes (colapsa y después quita), y es una
  **identidad guardada** (las huellas que el reanálisis excluye). Cambiarla movería identidades
  persistidas, y eso pide lectura dual con caducidad. **No se toca**: se anota.

### 🔥 B.318 — LA PUERTA DE CABEZA Y COLA ES UN SELLO DE GOMA: defecto de NUESTRO comprobador, no del modelo (02/10/2026)

**El defecto** (arquitecto, 02/10, con la medida de Code en B.311):
- El paso de cabeza y cola (`buscarCita`, `lib/analysis/coincidencia-de-cita.ts`) valida contra la
  **PRIMERA APARICIÓN de la cabeza en todo el documento**, aunque no sea la del pasaje citado.
- Y acepta **cualquier cola posterior** a menos de tres veces la longitud de la cita.
- En el autoclave ancló en la **frase 30**, que no es la de la cita, midió un tramo de 764 caracteres
  y **dejó pasar 394 caracteres sin comprobar**.
- **No es una verificación con tolerancia: es un sello de goma.**
- **Y su precisión medida es CERO**: de 23 citas publicadas, 22 pasaron `literal`, y la única que
  necesitó este camino era falsa (B.311).

**No es B.311 ni B.313**: aquéllas son lo que el juez escribe; esto es lo que nuestra puerta deja pasar.

**El arreglo, decidido** (puesto 1 del tablero del 02/10, en B.313): deja de ACEPTAR y sigue
DESCRIBIENDO, sin coste medido después del puesto 0.

✅ **HECHO EN CÓDIGO (02/10/2026)**, sin desplegar.
- **Qué cambia**: en `buscarCita` (`lib/analysis/coincidencia-de-cita.ts`), cuando la cabeza y la cola
  casan a menos de tres veces la longitud de la cita, ya no hay recorte: **la cita no pasa**.
  - El paso se sigue calculando y se llama igual, `cabeza_y_cola`, ahora como el fallo más avanzado:
    «habría pasado por la tolerancia».
  - Aceptan `literal`, `normalizada` y los segmentos de fila de `verifyQuote`, que no se tocan.
- **Se cuenta**: `frontera.cita_solo_por_cabeza_y_cola`, en el `discarded` de la pareja, por CITA que
  falló sólo por eso, sin tope.
  - Lo anota `registroDeDescartes` (`lib/analysis/diagnostico-de-cita.ts`).
  - El descarte se guarda en `descartesPorCita` como cualquier otro, con `paso: 'cabeza_y_cola'`.
- **Lo que le pasa hoy a un hallazgo cuya cita no verifica**, leído en el código y **sin cambiar**: **se
  cae entero**. En `fixQuotesInJudgment`, si falla cualquiera de los dos lados, el hallazgo no entra
  en la lista que sigue adelante: no se publica, ni con cita ni sin ella. Queda su contador
  (`citaNoVerificable`), su línea de log y su registro en `descartesPorCita`.
- **El censo repetido con los dos cambios puestos**: las 129 citas verificadas del examen archivado
  siguen pasando todas. Tablas: 74 por segmentos de fila y 1 literal, como antes. Prosa: 37 literal y
  17 normalizada. **Las 3 de N3 pasan ahora por `normalizada`.**
- **El rojo, de fallo**:
  - contra el código de antes caen la cita de 434 caracteres del autoclave, contra el texto real de
    NOR-10 (`lib/analysis/sello-de-goma.test.ts`); la prueba que codificaba la aceptación, dada la
    vuelta; y el descarte con su contador, en el juez;
  - los controles pasan antes y después: la cita literal de CLI-12 (341), la de CLI-13 (103), la frase
    32 entera de NOR-10, y una cita inventada que no cuenta como «sólo por cabeza y cola».
- **El comentario de `verifyQuote`** que hablaba del «portero de la rama atómica (pipeline.ts)», marcado
  como HISTÓRICO, con fecha: `pipeline.ts` sólo importa `judgeAllDocuments`.

### 🔥 B.319 — UNA CITA DE FILA DE TABLA EN UN DOCUMENTO SIN TROZOS NO TIENE NINGUNA VÍA DE VERIFICACIÓN (04/10/2026)

**El caso, medido en la pasada 1 del programa nuevo** (logs transcritos por el arquitecto; Code no los
ha visto): `Normas_Frecuencia_Recogidas.docx`, candidato `sin_fuente_comun`, sin trozos, leído con la
tijera vieja desde `texto_completo`. En las 5 pasadas de la línea de base emitió 0 contradicciones y 0
solapamientos. En la primera pasada nueva emitió una:

> Contradicción descartada en "Normas_Frecuencia_Recogidas.docx" [b8b2419d] «Frecuencia de recogida de
> residuos sanitarios» (cita no verificable, lado=existente; existente: longitud=76,
> paso=cabeza_sin_cola, pajar=texto_completo): "Residuos sanitarios | Frecuencia (dias) | 21 dias |
> Equivalencia | 3 semanas"

**EL DEFECTO, NO LA HIPÓTESIS**:
- La cita es una **fila de tabla**, con barras. La vía `segmentos_de_fila` de `verifyQuote` existe para
  eso, pero necesita fragmentos `table_row`, y un documento sin trozos no los tiene: su pajar es
  `texto_completo`.
- **Comprobado en el código por Code el 04/10**: con la lista de trozos vacía, `verifyQuote` sólo
  prueba `findBestMatch` contra el texto completo y devuelve (`lib/analysis/judge.ts:265-269`). A la vía
  de segmentos no se llega nunca. A una fila se le aplican las vías de prosa, y fallan.
- **El hallazgo puede ser real —21 días contra lo que diga NOR-11— y muere por fontanería, no por
  mérito.**
- **ESTABLE, 4 de 4 pasadas de NOR-11 del programa nuevo** (adenda del arquitecto, 04/10), con un
  detalle: en la pasada 4 el hash cambia a `[9a7f402e]` porque la misma fila viene con dos puntos en
  vez de barras: «Residuos sanitarios | Frecuencia (dias): 21 dias | Equivalencia: 3 semanas». Misma
  fila, misma muerte, otra forma. 📌 **El juez reescribe el separador de la fila: ni siquiera copia las
  tablas literalmente.**

**Lo que NO se hace ahora**: tocarlo. Queda en cola, y su arreglo tiene que decidirse junto a B.305 y a
los documentos sin trozos, no a solas.

**Lo que corrige**: P-SONDA-2 (B.307) decía «los fantasmas sin trozos pierden por mérito, no hay nada que
borrar». **Sigue siendo cierto en lo de borrar, y deja de ser completo**: un fantasma sin trozos sí
puede aportar un hallazgo, y hoy no hay forma de verificárselo si viene de una tabla.

### 🔥 B.320 — LA CASCADA DEL VERIFICADOR DESCARTA HALLAZGOS YA VERIFICADOS Y NO GUARDA LO QUE DESCARTÓ (agujero de evidencia, SIN arreglo; 04/10/2026)

**El defecto, leído en el código por Code el 04/10** (a petición del arquitecto, apartado F.1): un
hallazgo cuyas citas el juez VERIFICA y que la cascada DESCARTA **no se guarda en ningún sitio, ni
entero ni a medias.**
- En `applyCascadeToCandidate` (`lib/analysis/pipeline.ts`) sólo entra en `keptContradictions` lo que
  sobrevive (`:568`), y el juicio que se guarda lleva `contradictions: keptContradictions` (`:633`).
- Lo descartado deja una línea de log, con el hash y los primeros 60 caracteres del tema, y un
  contador. Nada más.
- Tampoco entra en `descartesPorCita` (B.313): ésa se llena antes, en el juez, y sólo con los
  descartes por cita no verificable.
- **Es la regla «una puerta que descarta tiene que guardar lo que descartó» sin cumplir, en la
  cascada.**

**LAS PUERTAS QUE LO TIENEN, por capacidad y no por nombre.** Censo:
`grep -n "tally.descartados++" lib/analysis/pipeline.ts` → **5**, y las cinco sólo cuentan y escriben
una línea de log:
1. `:337` — `descartado.emparejamiento_invalido`;
2. `:356` — las reglas deterministas de `finding-rules.ts` (`descartado.sin_columna_comun`);
3. `:407` — `descartado.cubierto_por_diff`;
4. `:462` — `r2.sin_ancla`;
5. `:572` — **el verificador**: `mismo_dato_sin_oposicion`, `sin_relacion` y `sin_veredicto`.
- La reclasificación a solapamiento (`:502`) sí conserva las citas: pasan a `overlappingContent`.
- **El double-check del exhaustivo no está en el censo**: lo que degrada no se publica, pero sigue en
  `judgments[].contradictions`, de donde sale. Ahí su texto queda.

**El caso que lo trae**: `[fa22ca84]`, la contradicción del autoclave en NOR-10, verificada por el juez
(222/340, las dos `literal`) y descartada por el verificador en 5 de 6 pasadas. Es justo la cita que
decide la bifurcación de B.321, y **por lectura no hay texto suyo guardado**.
`SQL_B320_citas_de_NOR10_04_10.sql` lo deja ver en el dato.

✅ **DEMOSTRADO CON DATOS, el primer resultado medido de esta ficha** (`SQL_B320_citas_de_NOR10_04_10.sql`,
ejecutada por el director el 04/10/2026, transcrita por el arquitecto):
- `[fa22ca84]` (222/340, la que muere en el verificador): **NADA GUARDADO**, en ninguno de los tres
  sitios. **La cita que mata 5 de cada 6 hallazgos de NOR-10 no existe en ningún lado.**
- `[b5ab6f08]` (710/341, la publicada): guardada dos veces, en lo publicado (`discrepancies`) y en
  `judgments[].contradictions`. Análisis `edabd2ab-3b16-46c9-b3bf-d1c24c6d22c5`, 02:53:49 UTC.
- `[37bf4d44]` (175, el solapamiento descartado por la cita): en `judgments[].descartesPorCita`,
  entero. Análisis `12ec1ab4-0516-496d-91fb-6538b35ba3bb`, 02:52:43 UTC.
- 📌 **EL CONTRASTE: la puerta del juez guarda; las cinco puertas de la cascada, no.** Lo que murió en
  la comprobación de citas está entero; lo que murió en el verificador no está.

**Sin arreglo.** Constancia.

### 🔥 B.321 — LA REGLA DE «UNA FRASE ENTERA» NO LA HACE CUMPLIR NINGUNA PUERTA (04/10/2026)

El puesto 2 prohíbe cortar una cita por dentro y empezar a mitad de frase. **Pero la comprobación de
citas acepta cualquier tramo seguido del documento, empiece donde empiece.** Una media frase pasa
`literal` igual que una frase entera: la regla vive sólo en el prompt, y **el prompt es una petición, no
una garantía.**
- **La pista que lo señala** (coincidencia de Code, 04/10, **no es una medida**): la cita que muere en
  el verificador mide 222, y el final de la frase 32 de NOR-10 desde «la responsabilidad…» mide 223.
- **Por qué importa más de lo que parece**: si se confirma, el puesto 2 consiguió que las citas
  EXISTAN, pero no que estén COMPLETAS, y una cita incompleta puede perder justo el dato que sostiene
  el hallazgo. Es lo que pasaría en NOR-10, 5 de 6.
- **Un hecho que la conecta con el verificador**, leído por Code el 04/10, sin opinar: el verificador
  recibe la cita y el texto entero del trozo ANTERIOR y del SIGUIENTE (`pipeline.ts:141-146`,
  `verify-findings.ts:163-165`). **El resto del trozo en el que está la cita no le llega.** Una media
  frase le llega sin su primera mitad.
- **Lo que NO se hace aún**: no se toca. La opción obvia —que la puerta exija que la cita empiece en
  principio de frase y acabe en fin de frase— movería otra vez la línea de base del arnés, y no se
  decide sin la medida de la bifurcación (B.313).

**📐 LO QUE TRAJO LA CONSULTA, Y LA RECONSTRUCCIÓN DE LA CITA QUE NO SE GUARDÓ (04/10/2026).**
`SQL_B320_citas_de_NOR10_04_10.sql`, ejecutada por el director y transcrita por el arquitecto. Más
la reconstrucción de Code, offline con el texto extraído de NOR-10.

**LAS TRES CITAS, Y CÓMO ESTÁN CORTADAS** (arquitecto, 04/10). 📌 **INCLUSO LA ÚNICA CITA QUE FUNCIONÓ
EMPIEZA A MITAD DE FRASE.** B.321 no es un caso raro: el juez le corta la cabeza a la frase de forma
sistemática.

| Cita | Corte | Qué le pasó |
|---|---|---|
| `b5ab6f08` (710/341) | por la **cabeza** («Es ») | se publicó, por `normalizada` |
| `37bf4d44` (175) | por la **cola**: se para sin punto, en mitad de una enumeración («…de forma homogénea entre las tres clínicas») | murió en la puerta de la cita |
| `fa22ca84` (222/340) | por **las dos** | murió en el verificador |

**LA DE 710, MEDIDA: LA COINCIDENCIA DE CODE ESTABA BIEN EN LA FORMA Y MAL EN LA CUENTA.**
- Lo guardado empieza «El Director Clínico quien debe asegurar que existen los recursos…» (lo
  transcribe el arquitecto del resultado de la consulta). Falta el verbo: el original dice «**Es** el
  Director Clínico quien debe…». Es la misma amputación que B.311, «el "Es" inicial, que se llevó el
  verbo».
- ⚠️ **Corrección de Code a su propia cifra**: las frases 31 y 32 enteras no suman 713 sino **714**,
  porque entre ellas el texto extraído lleva un salto de párrafo (`\n\n`, dos caracteres), no un
  espacio. La cuenta que cuadra es **714 − 3 («Es ») − 1 = 710**: la cita quita el «Es» y junta las dos
  frases con un solo espacio. El «713 − 3» del arquitecto cuadraba porque heredaba el error de Code
  (contaba un espacio).
  - 🧾 **Aceptada por el arquitecto (04/10), que lo archiva como error suyo, el segundo de la misma
    clase**: copió un número de Code y lo usó como propio. Regla al protocolo: un número que viene de
    otro no se reutiliza sin comprobarlo; si se reutiliza, se dice de quién es.
- **Por qué pasó por `normalizada` y no por `literal`**, comprobado barato:
  - **«El Director Clínico quien debe asegurar», con E mayúscula, no está en NOR-10**: con e minúscula,
    sí. La comparación literal distingue mayúsculas; la normalizada no.
  - Y, por la cuenta de arriba, el salto de párrafo que la cita cambia por un espacio, que la vía
    normalizada también colapsa.
  - **La diferencia es de forma —una mayúscula y un salto de línea—, no de palabras.** Que no haya
    ninguna otra lo diría el texto completo guardado, que el arquitecto no ha transcrito entero.
  - ✅ **CERRADO con el texto completo** (transcrito por el arquitecto el 04/10, de la consulta):
    comparada carácter a carácter con NOR-10, la cita de 710 tiene **exactamente dos diferencias, y
    ninguna de palabras**: la «E» mayúscula del principio, donde el documento dice «el», y el espacio
    que sustituye al salto de párrafo entre las dos frases (carácter 369 de la cita). Nada más.

**LA RECONSTRUCCIÓN DE `fa22ca84`, la que no se guardó** (Code, 04/10, sobre el texto extraído de
NOR-10):
- **Por el criterio del encargo** —tramos seguidos de 222 caracteres con «delegable» y «autoclave»— hay
  **162**, empezando entre los caracteres 2.713 y 2.874. **No discrimina**: dos palabras que están a
  menos de 222 caracteres caben en muchas ventanas.
- **Lo que la hace única**: el log guardó sus primeros 200 caracteres («la responsabilidad última
  —incluida … no es delegable y recae sie»). Ese principio aparece **una sola vez** en NOR-10, en el
  carácter 2.747. Con el principio fijado por el log y la longitud por el registro, el tramo es uno:

  > «la responsabilidad última —incluida la firma de los registros de auditoría trimestral y la decisión
  > de retirar del servicio un autoclave que no supere un control biológico— no es delegable y recae
  > siempre sobre esta figura»

  - Acaba en «esta figura», **sin el punto**: es el final de la frase 32 menos su último carácter
    (223 − 1). En el documento sigue «.» y la sección «2.2. Personal auxiliar de esterilización».
  - Delante tiene, en la misma frase, «El Director Clínico puede delegar funciones operativas del día a
    día en el personal auxiliar de esterilización, pero».
  - Cabe entero en un solo trozo, el 2 de 67, con el troceado de hoy del repositorio.
- ✅ **LA LECTURA DEL ARQUITECTO, registrada antes de mirar: NO FALSADA.** Pedía un tramo de 222 que
  acabe en un demostrativo sin antecedente dentro de la cita, y es exactamente éste: «esta figura»,
  y el Director Clínico no aparece en la cita.
  - ⚠️ **Con un detalle corregido**: el antecedente no está «en la frase anterior», sino **en la MISMA
    frase 32, en su principio**, que es lo que la cita le corta. No cambia el mecanismo: el antecedente
    queda fuera de la cita igual.
  - 📌 **La redacción buena, del arquitecto (04/10)**: **el juez le corta la cabeza a su propia frase, y
    en la cabeza va el sujeto.** Es un caso más estrecho y más claro que el de «la frase anterior».
- 📌 **Y EL DATO QUE DECIDE EL PASO SIGUIENTE**, comprobado con el troceado de hoy del repositorio: ese
  antecedente está **en el mismo trozo que la cita** (el 2, que también contiene la frase 31). **Ni el
  trozo anterior (1) ni el siguiente (3) lo llevan.** El verificador recibe la cita más esos dos
  vecinos, y no el resto de su propio trozo (B.321): el sujeto le queda fuera de las dos maneras. Los
  trozos guardados en producción pueden partir distinto; esto es el troceado del repositorio.


**CÓMO DECIDE EL VERIFICADOR `mismo_dato_sin_oposicion`** (apartado F.3; leído, sin opinar si está
bien):
- **Qué le entra**, por hallazgo (`buildFindingBlock`, `lib/analysis/verify-findings.ts:167-176`): el
  tema, el nombre del documento existente y, de cada lado, la cita.
  - En prosa, la cita va con el texto del trozo anterior y del siguiente.
  - Si la cita es una fila de tabla con celdas, entra la fila entera, con todas sus columnas en su
    orden, y la cita señalada aparte (`:149-161`).
  - **No le entran** los documentos, ni la descripción del juez, ni el resto del trozo de la cita.
- **Quién lo decide**: un **modelo**, Haiku, con temperatura 0,1 y hasta 2.048 tokens de salida
  (`:243-247`). Le llega sólo lo que pasó la capa determinista (`pipeline.ts:551`).
- **Dónde vive el criterio**: **en el prompt** (`buildPrompt`, `verify-findings.ts:182-218`):
  - «confirmado» si las dos citas hablan del mismo dato concreto y dicen cosas incompatibles;
  - «mismo_dato_sin_oposicion» si hablan del mismo dato pero no son incompatibles;
  - «sin_relacion» si no hablan del mismo dato.
  - Y la regla que separa las dos primeras: si asignan VALORES DISTINTOS al mismo dato. Callar sobre un
    dato no es darle otro valor.
- **El código** sólo traduce la respuesta (`toOutcome`, `:226-240`): un veredicto que no sea uno de los
  tres pasa a `sin_relacion` con `descartado.sin_veredicto`.

⬇️ **B.321 BAJA DE PRIORIDAD, y sus predicciones se retiran antes de medir** (arquitecto, 04/10/2026). Queda en
cola, detrás de B.320.
- **P-14, P-15 y P-16 NO SE REGISTRAN.** No llegaron a Code, y así quedan. El motivo es un dato, no un
  cambio de humor.
- **El dato**: la cita de la contradicción de NOR-11 que ve el cliente —«…no pueden permanecer en el área
  de almacenamiento intermedio más de 72 horas desde el momento en que se cierran»— empieza en minúscula,
  es media frase, **y se entiende perfectamente porque lleva el dato dentro**. Estirarla sólo le añadiría
  texto.
- **B.321 arregla el caso del autoclave**, donde la cita acaba en «esta figura», **y casi nada más.**

### 🔥 B.322 — EL VERIFICADOR NO RECIBÍA EL TROZO DONDE ESTÁ LA CITA, SÓLO SUS VECINOS (paso 1 del orden del 04/10; arreglado en código, SIN desplegar ni medir)

**El defecto**: el verificador recibía, de cada lado, la cita y el texto entero del trozo ANTERIOR y del
SIGUIENTE, y **no el resto del trozo en el que está la cita** (B.321, lectura del 04/10).

**EL MECANISMO, con la reconstrucción de B.321** (arquitecto, 04/10): los dos defectos actúan juntos y en
el mismo sitio.
- **B.321** corta la frase donde vive el sujeto, y deja la cita con un demostrativo colgando: «…no es
  delegable y recae siempre sobre esta figura».
- **B.322** no le da al verificador el resto del trozo, así que no tiene de dónde sacar el sujeto.
- Al verificador le llega «…recae siempre sobre esta figura» contra «el Coordinador de Calidad decide
  sin validación adicional del Director Clínico». **Sin saber quién es «esta figura», no hay oposición
  visible: el verificador acierta con lo que se le da.**
- Y `[b5ab6f08]` funciona por lo contrario: nombra al Director Clínico dos veces DENTRO de la cita. El
  antecedente va dentro.
- **SOBRE EL TROCEADO DE PRODUCCIÓN**, que la reconstrucción de Code hizo con el del repositorio
  (arquitecto, 04/10). **Es un razonamiento, no una medida**, y dicho con sus palabras: «si el sujeto
  hubiera caído en el trozo anterior, el verificador lo habría recibido y habría confirmado. Falló 5 de
  6».

**EL CAMBIO DE ORDEN, y el dato que lo movió** (arquitecto, 04/10). Se había dicho B.320 primero (guardar
lo que descarta la cascada). Se cambia, y no por conveniencia: cuando se dijo, el mecanismo era una
coincidencia; ahora está casi medido, y el efecto de arreglar el verificador **se lee en el log sin
guardar nada**. Orden: **1, B.322; 2, B.321** (la puerta exige frase entera, también para que la cita se
pueda leer en pantalla: «recae siempre sobre esta figura» no dice de qué figura); **3, B.320**, antes de
cualquier cosa cuyo efecto no se lea en el log. Un cambio por commit, y el paso 1 medido antes de tocar
el 2: si cambian dos cosas a la vez, no se sabe cuál recuperó el hallazgo.

✅ **EL ARREGLO, HECHO EN CÓDIGO (04/10/2026)**, sin desplegar:
- **El verificador recibe, de cada lado, el trozo entero donde está la cita**, además de los dos vecinos,
  y la cita señalada aparte (`describeSide`, `lib/analysis/verify-findings.ts`). Sin trozo, el bloque es
  exactamente el de antes. Las filas de tabla, como antes: la fila entera con todas sus columnas.
- **El criterio vive en un módulo, `lib/analysis/contexto-de-la-cita.ts`**: `contextoDeLaCita` y
  `ladosParaVerificar`. Los dos sitios del pipeline que construyen lo que recibe el verificador le
  preguntan, y `buildNeighbours` sale de `pipeline.ts`.
- **SI LA CITA CRUZA MÁS DE UN TROZO** (no hay un único trozo de evidencia): se unen los trozos en orden,
  se localiza la cita entera con la misma búsqueda que la comprobación (literal o normalizada, sólo para
  dar contexto, no acepta nada), y se toman **todos los trozos que pisa, enteros**. Los vecinos son el de
  antes del primero y el de después del último.
  - **Tope declarado: 3 trozos** (`TOPE_DE_TROZOS_DE_UNA_CITA`). Una cita que pida más se queda como
    hoy, la cita sola.
  - Si no se localiza, también como hoy.
  - La primera versión localizaba el primer trozo por el principio de la cita y el último por su final.
    **Su propia prueba la tumbó**: cuando la frontera cae dentro de los últimos caracteres de la cita,
    ningún trozo contiene ese final. Se cambió antes del commit.
- **EL COSTE, medido antes de escribir** sobre los 218 trozos de prosa del corpus: mediana 926
  caracteres, p95 1.241, máximo 1.493. Por hallazgo, del orden de **+1.850 caracteres de mediana y
  +2.990 en el peor caso** (un trozo por lado). El trozo de la cita de 222 mide 1.079.
  - No roza ningún tope. El lote del verificador es de hasta 15 hallazgos (`MAX_PER_CALL`), así que
    crece como mucho unos 45.000 caracteres (unos 11.000 tokens), frente a los 200.000 de contexto del
    modelo.
  - `/api/analyze-v2` tiene 120 s (`route.ts:44`), y una pasada rápida anda por los 20 a 25 s.
- **EL ROJO, de fallo, visto antes de escribir el módulo**, con el caso real (la cita de 222 de NOR-10,
  `lib/analysis/contexto-de-la-cita.test.ts`): el bloque que recibe el verificador no llevaba «El
  Director Clínico puede delegar». Con el cambio, lo lleva.
  - Los controles: sin trozo, el bloque es carácter por carácter el de antes; una fila de tabla se pinta
    igual.
  - El contexto: con trozo, ese trozo y sus vecinos; una cita que cruza dos trozos lleva los dos; el
    tope, con 5 y con 3 trozos.

**🔮 LAS PREDICCIONES, REGISTRADAS ANTES DE MEDIR** (arquitecto, 04/10/2026, 12:05). Sin veredicto. Se
juzgan con **6 pasadas de NOR-10**, y P-13 con 3 de NOR-11:
- ~~**P-11 · `[fa22ca84]` se publica en 4 de 6 o más.** Hoy, 1 de 6. **Falsada si sale 1 o menos de 6.**~~
  — **sustituida antes de medir por la versión cerrada por los dos lados, abajo.**
  - ⚠️ **Precisión de Code, por la regla de esta mañana** (la banda con falsación por los dos lados):
    entre lo que la confirma (4 a 6) y lo que la falsa (0 o 1) quedan **2 y 3 de 6 sin escribir**. Si
    sale eso, la predicción no dice nada. Lo decide el arquitecto antes de medir.
- **P-11 · `[fa22ca84]` publicada sobre 6 pasadas de NOR-10 — CERRADA POR LOS DOS LADOS** (arquitecto,
  04/10, después del aviso de Code y antes de medir). Cada tramo dice qué se hace, no sólo si acertó:
  - **4, 5 o 6 de 6 → CONFIRMADA.** B.322 cerrado. El paso 2 (B.321) sigue adelante **por
    legibilidad** —«esta figura» sin antecedente no se puede enseñar a un cliente—, no por recall.
  - **2 o 3 de 6 → PARCIAL.** El contexto ayudó y no basta. **B.321 pasa a ser también cosa de
    recall**, y se vuelve a medir con 6 pasadas después de él.
  - **0 o 1 de 6 → FALSADA.** El contexto no era la causa, o no era la única. **Se para: no se toca
    B.321**, y B.320 pasa delante, para medir con lo descartado guardado.
  - 🧾 **Tercer error del arquitecto de la misma clase**: dejó el 2 y el 3 de 6 sin escribir, cinco
    horas después de archivar la regla de la banda con falsación por los dos lados. **Que la regla ya
    estuviera en el protocolo agrava la reincidencia.**
- **P-12 · No aparece ninguna contradicción nueva** que no se emitiera antes en NOR-10. **Falsada si
  aparece alguna**: sería que se ha aflojado el verificador, no que se le ha dado contexto. Es la
  predicción que protege de «arreglarlo» rompiéndolo.
- **P-13 · Las dos contradicciones de NOR-11 que hoy funcionan siguen publicándose.** Con 3 pasadas de
  NOR-11, no 5: es un control, no una medida. **Falsada si alguna cae.**

**🔖 EL SELLO DE B.322, ESCRITO ANTES DE LA TANDA** (arquitecto, 04/10; hecho en código el mismo día).
- **El problema del sello anterior** (aviso de Code): el único dato que podía mostrar que B.322 estaba
  desplegado era el veredicto sobre `[fa22ca84]`, el mismo con el que se juzga P-11. Si no se movía, no
  se sabría si el cambio no sirve o si no está desplegado. **Es lo que pasó con las once pasadas del
  03/10.**
- **La línea, una por hallazgo que entra al verificador** (`lineaDelContexto`,
  `lib/analysis/contexto-de-la-cita.ts`, escrita desde los dos sitios del pipeline):

  > `[…] · [hash] contexto del verificador: nuevo trozos=N caracteres=M (estado) · existente trozos=N caracteres=M (estado)`

  - Los caracteres son los del trozo o los trozos que añade B.322.
  - El estado es `trozo`, `cruza` (la cita pisa varios), `fila_de_tabla` (se pinta como fila, sin
    trozos) o `sin_contexto` (no se localizó, y se pinta como antes).
  - **Ni una palabra del documento**: números y nombres de estado. Lo comprueba su prueba.
- **El contador del tope ciego**: `verificador.cita_sin_contexto`, por lado que llega sin contexto, en
  el `discarded` de la pareja.
- 📌 **EL SELLO, antes de la tanda: si en el log de la primera pasada de NOR-10 aparece esa línea con
  `trozos` ≥ 1 en el lado nuevo, el cambio está desplegado. Si no aparece, no lo está, y se para. Esta
  vez el sello no depende del resultado.**
- **El despliegue de `dba10142`**: Code no puede ver Vercel desde aquí (no hay `gh` en esta máquina). Lo
  dirá el sello, o el director mirando Vercel.
- **La build local, contestada**: termina entera y en verde (exit 0). Compila, pasa tipos, genera las
  67 páginas y lista las rutas. «Llega a "Collecting page data"» era un filtro de Code sobre la salida,
  que sólo enseñaba esa línea; **no había ningún problema de variables de entorno.**

**📋 LO QUE QUEDA EN EL TABLERO** (arquitecto, 04/10):
- **El punto 0, cerrado**: la cita de 710 difiere de NOR-10 en exactamente dos cosas, y ninguna es una
  palabra: la «E» mayúscula del principio y un espacio donde el documento tiene un salto de párrafo.
  **Con eso B.321 queda confirmada del todo: incluso la cita que funcionó empieza a mitad de frase.**
- **EL COSTE, MEDIDO Y NO ESTIMADO, antes de escribir**: +1.850 caracteres de mediana y +2.990 en el
  peor caso por hallazgo, sobre los 218 trozos de prosa del corpus. El lote del verificador crece unos
  11.000 tokens, frente a 200.000; el análisis gasta de 20 a 25 s de 120. **Ningún tope rozado. Es la
  primera vez esta semana que se mide el coste antes de escribir, y así tiene que ser siempre.**
- 📌 **LA PRIMERA VERSIÓN DE CODE PARA LA CITA QUE CRUZA TROZOS ERA MALA, LA TUMBÓ SU PROPIA PRUEBA ANTES
  DEL COMMIT, Y CODE LO DECLARÓ.** Buscaba el primer trozo por el principio de la cita y el último por
  el final, y fallaba cuando la frontera caía dentro del final. **Es exactamente para lo que se
  escriben las pruebas antes del código, y es la tercera vez esta semana que la disciplina caza algo
  antes de que llegue a producción.**


**📊 B.322 MEDIDO: LAS 14 PASADAS DEL 04/10, de 16:23 a 16:32** (logs del director, transcritos por el
arquitecto; Code no los ha visto). B.322 desplegado, y su sello presente en las catorce.
- **EL SELLO, en las 14**: `contexto del verificador: nuevo trozos=1 caracteres=1079 (trozo) · existente
  trozos=1 caracteres=1175 (trozo)` en NOR-10, y 946/828 en NOR-11. **El despliegue quedó probado sin
  depender del resultado**, que es para lo que se escribió.
- **NOR-10, 6 pasadas** (16:23:06, 16:23:43, 16:24:14, 16:24:46, 16:25:34 y 16:26:10), con latencias de
  18.197 a 21.553 ms:
  - **la contradicción del autoclave se publica 6 DE 6**, confirmada por juicio las seis veces. En la
    línea de base iba 1 de 6;
  - con tres citas distintas: `[fa22ca84]` (nuevo 222, existente 340) en 2 pasadas, `[b5ab6f08]` (710
    `normalizada`, 341) en 3, y `[6ba5bfde]` (223, 341) en 1;
  - 📌 **EL MECANISMO, CONFIRMADO**: en las pasadas en que el juez volvió a escribir la media frase de
    222–223 caracteres —la que acaba en «esta figura»—, **el verificador la confirmó igual**, porque ya
    recibe el trozo entero con «El Director Clínico puede delegar…». La cita no cambió; cambió que el
    verificador puede ver de quién se habla;
  - un solapamiento descartado en 2 de las 6 (`[37bf4d44]`, 175, `cola_demasiado_lejos`, y `[ff318d50]`,
    363, `cabeza_sin_cola`): **la escultura no ha desaparecido en los solapamientos.**
- **NOR-11, 8 pasadas** (de 16:26:53 a 16:31:47), con latencias de 21.920 a 25.303 ms:
  - `[e7785038]`, el plazo del grupo III: verificada y confirmada **8 de 8**;
  - `[5a59c682]`, el color del contenedor: **ausente 8 de 8**;
  - `[976f6174]`, Chamberí: **ausente 8 de 8**;
  - `frontera.cita_solo_por_cabeza_y_cola`: 0 en las 14.

**⚖️ LOS VEREDICTOS** (arquitecto, 04/10):
- ✅ **P-11 · ACERTADA, y por encima de la banda**: pedía 4 de 6 o más, y salió **6 de 6**. Por su propio
  tramo: B.322 cerrado, y B.321 sigue sólo por legibilidad.
- ✅ **P-12 · ACERTADA.** Ninguna contradicción nueva en NOR-10: el juez emite siempre la misma. **Se le
  dio contexto al verificador, no se le aflojó.**
- ❌ **P-13 · MAL FORMULADA.** Decía «las dos contradicciones de NOR-11 que hoy funcionan», y la medida del
  arquitecto de una hora antes decía que sólo funcionaba **una**. La mitad medible, `[e7785038]`, sale 8
  de 8. 🧾 **Cuarto error del arquitecto de la tanda**: una premisa que contradecía su propio dato. Regla
  al protocolo.

📌 **LA CUENTA PARA EL TABLERO, contra la línea de base de las 11 pasadas del 03/10** (el arquitecto la
llamó «del viernes» todo el día, y lo corrige él mismo el 04/10: fue el **sábado 03/10**): contradicciones sembradas publicadas por pasada,
NOR-10 **0 → 1** y NOR-11 **2 → 1**; total **2 → 2**; citas publicadas no confirmables **1 → 0**.
**Mismo número de hallazgos, y ahora ninguno miente.**

### 🔥 B.323 — DOS DOCUMENTOS CON EL MISMO CONTENIDO PUEDEN CONVIVIR EN EL CORPUS, Y ENTONCES CADA HALLAZGO SE PUBLICA DOS VECES (constancia, SIN arreglo; 04/10/2026)

**La prueba, de los logs del director del 04/10** (transcritos por el arquitecto; Code no los ha visto):
en la tanda de las 21:05–21:08, `CLI-01_protocolo-esterilizacion-instrumental.txt` sale **dos veces** en
el retrieval, con dos selecciones de unidades distintas (2.814 y 2.756 caracteres). Se juzga dos veces
(RAW a las 21:07:26 y a las 21:07:29, solape del 65 % las dos), y **cada hallazgo se publica duplicado en
pantalla**.

**Lo que hay en el código, leído por Code el 04/10, sin tocar nada:**
- **La comprobación de hash del análisis mira sólo el documento que se analiza.** `checkContentHash`
  (`lib/analysis/hash-check.ts:59-92`, llamada en `lib/analysis/pipeline.ts:1155`) busca si su hash
  coincide con el de algún documento ya guardado en la organización, y si coincide, responde «duplicado
  exacto». **No mira si dentro del corpus hay dos documentos iguales entre sí.** El «Hash check: sin
  duplicado exacto» del log habla del analizado, no del corpus.
- **La subida guarda el hash, pero no veta un contenido repetido** (`app/api/ingest/route.ts:252-295`).
  Sólo rechaza un nombre de fichero repetido en las subidas manuales, y las de Drive están exentas.
- **Existe una herramienta que los lista**: `app/api/admin/duplicates/route.ts` agrupa los documentos
  por `content_hash`. Hay que abrirla y mirarla.
- **Lo que dirá el dato**: `SQL_B323_corpus_por_organizacion.sql`, consultas 4 (las copias de CLI-01, con
  su hash, sus trozos y sus análisis) y 5 (todos los nombres y todos los contenidos repetidos dentro de
  una misma organización).

✅ **CONFIRMADA CON DATO** (`SQL_B323_corpus_por_organizacion.sql`, ejecutada por el director el 04/10 y
transcrita por el arquitecto): el mismo contenido, hash `d510819d…`, existe en **cuatro documentos**, dos
por organización.
- En `5a82712f…` («Mi workspace»): `e03fab9a` (analizado, 15/09 a las 08:41) y `e568a5c6` (analizado,
  23/09 a las 17:34). Ocho días entre uno y otro: subido dos veces a mano.
- En `a9625e93…` («Workspace principal»): `97b4503b` y `f1d85905`, los dos pendientes y **los dos creados
  el 27/09 a las 09:10, el mismo minuto.**
- 📌 **LA PISTA DE POR DÓNDE EMPEZAR** (arquitecto): lo del mismo minuto no es un descuido del usuario:
  **huele a doble envío o a un reintento de la subida.** El arreglo tendrá que mirar las dos causas, la
  humana (dos subidas a mano con días de diferencia) y la del reintento.

**Sin arreglo.** Constancia.

### 🔥 B.324 — EL CORPUS QUE VE EL USUARIO PUEDE CAMBIAR DE UNA SESIÓN A OTRA (resuelto el 04/10: era OTRA CUENTA; queda como PRERREQUISITO para cuando un usuario pueda estar en dos organizaciones; 04/10/2026)

**El hecho, de los logs del director del 04/10** (transcritos por el arquitecto):
- **Tanda de las 16:23–16:32**: NOR-10 con id `db1e20f9-a2d3-4280-8721-39ee11bf5d4e` y NOR-11 con
  `85c97891-7cd6-44a6-87bc-5bb2d117be18`. Candidatos: CLI-12, CLI-13, OPE-10, OPE-11, OPE-13,
  Protocolo_Visitas_Centros, Clientes_Residuos_Sanitarios, RRHH-08 y Normas_Frecuencia_Recogidas.
- **Tanda de las 21:05–21:08**: NOR-10 con `43df28ff-62ad-4fe8-8e90-a33bca05aaea` y NOR-11 con
  `849f7924-d789-4abc-ab1e-f63cd63b9bd7`. Candidatos: CLI-01, CLI-03, CLI-04, NOR-01, NOR-04, MKT-01,
  OPE-01, OPE-05, OPE-11, RRHH-03, RRHH-04 y RRHH-06.
- **De las dos listas sólo coincide OPE-11.** El director afirma que no subió nada ese día; la segunda
  tanda la lanzó desde el móvil, con la misma cuenta.

**POR QUÉ ES GRAVE Y NO COSMÉTICO** (arquitecto, 04/10): **lo que se vende es «sólo responde con los
documentos que tu empresa le ha dado». Si la empresa ve otro corpus según el dispositivo, la promesa del
producto se rompe.**

**DE DÓNDE SACA EL PROGRAMA LA ORGANIZACIÓN ACTIVA, leído tal cual por Code el 04/10, sin opinar:**
- La sesión (la cookie) da **el usuario**, y nada más. El navegador no elige organización: no hay
  cabecera, parámetro ni dato guardado en el cliente que la fije. Buscado en `app`, `lib`, `hooks` y
  `components`.
- La organización se busca en la tabla `memberships` por ese usuario
  (`resolverOrg`, `lib/org.ts:201-214`, la que usa el análisis en `app/api/analyze-v2/route.ts:84`):

  > `.from('memberships').select('org_id').eq('user_id', userId).limit(1).single()`

- ⚠️ **Esa consulta lleva `.limit(1)` y NO lleva orden.** Si un usuario pertenece a una sola
  organización, da siempre la misma. **Si pertenece a más de una, PostgreSQL puede devolver cualquiera de
  sus filas, y no tiene por qué ser la misma de una petición a otra**, sea cual sea el dispositivo.
  - Esto es lo que hace el código, no lo que pasó. **Lo que pasó lo dicen la consulta 3** (con qué
    organización se guardaron los análisis de cada tanda y en cuál vive cada documento analizado) **y
    la 1** (a cuántas organizaciones pertenece el usuario).
  - Si la 1 dice «una», esta lectura no explica nada, y la causa es otra.
- Los vectores de búsqueda viven por organización (el espacio de nombres de Pinecone es el `orgId`):
  otra organización es otro corpus entero.

**Sin arreglo, y sin proponer uno.** La causa queda sin determinar hasta la consulta.

✅ **RESUELTO EL 04/10/2026: ERA OTRA CUENTA.** El director estaba en otro usuario. Las dos tandas no se
lanzaron desde la misma cuenta, y de ahí los dos corpus y los dos juegos de ids. **La causa fue una cuenta
distinta, no un cambio de sesión dentro de la misma cuenta.** La consulta `SQL_B323_corpus_por_organizacion.sql`
ya no hace falta para esto.
- 📌 **LA LÍNEA DE BASE DE HOY ESTÁ INTACTA** (arquitecto): lo de las 16:23–16:32 se midió en la cuenta
  correcta y sigue valiendo. No hay que rehacer nada.
  - ⚠️ **Nota de Code**: los veredictos de P-11, P-12 y P-13 y el recuento de esas pasadas que el
    arquitecto da por medidos **no han llegado a Code** y no constan en esta ficha. Si deben constar, hay
    que pegarlos.
- 🧾 **Error del arquitecto, archivado**: escribió «el corpus ha cambiado entero» como hecho. Ofreció las
  dos explicaciones y luego afirmó la peor sin tener el dato. Regla al protocolo.

⚠️ **PRERREQUISITO, NO DEUDA SUELTA** (reescrito por el arquitecto el 04/10). La lectura de `resolverOrg`
(`lib/org.ts:201-214`) sigue en pie: `.limit(1)` sin orden sobre `memberships` quiere decir que, si un
usuario pertenece a varias organizaciones, la base puede devolver cualquiera en cada petición.
> Si hoy un usuario sólo puede estar en una organización, esto no se manifiesta. **El día que se abra la
> puerta a que un usuario pertenezca a dos —y se va a abrir: Dentavia tiene tres clínicas, y un
> responsable de calidad de dos centros es el caso normal—, `resolverOrg` tiene que arreglarse ANTES de
> abrirla, no después.** Si se abre primero, ese usuario verá corpus distintos en peticiones distintas y
> podrá subir un documento a la organización equivocada. **La organización no se adivina: se elige y se
> lleva encima.**

**¿PUEDE HOY UN USUARIO ESTAR EN DOS ORGANIZACIONES?** (lectura de Code, 04/10, sin tocar nada)
- **El esquema NO lo impide.** `memberships` sólo tiene `UNIQUE (org_id, user_id)`
  (`supabase-setup.sql:253`), que impide estar dos veces en la MISMA organización, no en dos distintas.
  Su índice por `user_id` no es único (`:594`). El único índice único más es el de un dueño por
  organización (`supabase-owner-and-elevations.sql:30-32`).
- **Lo impide el CÓDIGO, en los dos únicos sitios que crean una pertenencia** (todo `insert` sobre
  `memberships` en `app` y `lib`):
  1. **El alta** (`app/api/org/setup/route.ts:24-44`): si el usuario ya tiene una pertenencia, devuelve
     esa y no crea otra.
  2. **Aceptar una invitación** (`app/api/team/accept-invite/route.ts:103-121`): **borra la pertenencia
     anterior** del usuario y después crea la nueva (`:140-147`). Si la organización de antes se queda
     sin nadie, la marca como abandonada.
  - Invitar (`app/api/team/invite/route.ts`) y las elevaciones (`app/api/team/elevations/route.ts`) sólo
    leen `memberships`. No hay otra vía: ni administración, ni Drive, ni registro.
- ⚠️ **Y ESA IMPOSIBILIDAD FALLA ABIERTA, en los dos sentidos**, dicho sin opinar sobre qué hacer:
  - El borrado de la pertenencia anterior (`accept-invite/route.ts:116-120`) **no comprueba su error**.
    Si falla, la inserción sigue, y el usuario queda en dos organizaciones.
  - La pertenencia anterior se busca con `.limit(1).single()` (`:103-109`). Si el usuario ya tuviera
    dos, `.single()` no devuelve nada, no se borra ninguna, y entraría en una tercera.
- **Qué habría que cambiar el día que se abra la puerta**: el borrado de `accept-invite` (la puerta
  hoy), y antes que eso, que `resolverOrg` deje de adivinar.


**⏸️ Y LO QUE ESTO PARA** (arquitecto, 04/10): las predicciones P-14, P-15 y P-16 de B.321 están ancladas a
números del corpus de las 16:30, y el de las 21:05 es otro. **No se mide B.321 hasta saber qué ha
pasado.**
- ⚠️ **Nota de Code**: el encargo que trae B.321 y esas tres predicciones **no llegó a Code**. No están
  en el repositorio, y B.321 no tiene una línea de código escrita. Si deben constar, hay que pegarlas.

### 🔥 B.325 — ACEPTAR UNA INVITACIÓN TE SACA DE TU PROPIA ORGANIZACIÓN, SIN AVISAR (decisión de PRODUCTO, SIN arreglo, la toma el director; 04/10/2026)

**Lo que pasa** (de la lectura A de Code, 04/10; el director no lo sabía):
> Un usuario que crea su organización, sube sus documentos y después acepta una invitación a otra,
> **pierde la suya**: `accept-invite` borra su pertenencia anterior antes de crear la nueva, y si la
> organización de antes se queda sin nadie, la marca como abandonada. **Nadie avisa al usuario de que va
> a perder su corpus.**

**Dónde**: `app/api/team/accept-invite/route.ts` busca la pertenencia anterior (`:103-109`), la borra
(`:116-120`), marca la organización de antes como abandonada si se queda sin miembros (`:122-135`) y crea
la nueva (`:140-147`).

**Y ESA IMPOSIBILIDAD —«un usuario, una organización»— FALLA ABIERTA** (B.324):
- el borrado de la pertenencia anterior **no comprueba su error**: si falla, la inserción sigue, y el
  usuario queda en dos organizaciones, que es justo el caso en que `resolverOrg` adivina;
- y la pertenencia anterior se busca con `.limit(1).single()`: si el usuario ya tuviera dos, no se
  encuentra ninguna, no se borra nada, y entraría en una tercera.

**Sin arreglo.** Es una decisión de producto, y la toma el director.

### 📋 B.332 — cabeza_sin_cola ES EL FALLO DOMINANTE: TAMAÑO MEDIDO, CAUSA SIN DETERMINAR (05/10/2026)

Medido en producción con SQL_B331 sobre 52 análisis con descartes guardados y 0
descartes omitidos por el tope. 75 hallazgos descartados: 54 contradicciones y 21
solapamientos, unos 1,4 descartes por pasada.

Reparto por paso de fallo, y cuántos de cada uno son .docx con barra:
- cabeza_sin_cola: 49 lados, de los cuales 28 son .docx con barra y 21 no llevan barra.
- sin_cabeza: 12 lados, ninguno con barra.
- cola_demasiado_lejos: 9 lados, ninguno con barra.
- cabeza_y_cola: 5 lados, los 5 .docx con barra.

LO QUE ESTÁ MEDIDO: cabeza_sin_cola es el 65% de todos los fallos (49 de 75), y 33 de
los 75 son tablas de Word con barra (B.330, B.319).

LO QUE NO ESTÁ MEDIDO, y el arquitecto lo afirmó de más el 05/10 antes de que Code lo
parase: que los 21 lados sin barra sean de prosa, y que la causa sea el juez cortando
frases. El bloque c solo clasificó las citas CON barra, así que alguno de esos 21
podría ser de un Excel. Esta ficha no concluye nada sobre la causa.

LAS CAUSAS CANDIDATAS, sin orden de probabilidad, porque cabeza_sin_cola solo
significa que la cabeza de la cita normalizada está en el pajar y la cola no está
detrás (coincidencia-de-cita.ts:163); la cabeza y la cola son min(20, 40 % de la cita
normalizada) (coincidencia-de-cita.ts:152-155); en cualquier cita de más de 50
caracteres son 20.
⚠️ CORREGIDO EL 06/10/2026: el arquitecto escribió «15 caracteres» en esta ficha
tres veces. El 15 es de findTolerant (lib/texto/localizar-cita.ts), que es el salto
del editor y otra cosa distinta (B.326). La puerta de citas usa min(20, 40 %). Lo
trasladó de un sitio al otro al explicar cabeza_sin_cola.
1. El juez cortó la frase por dentro o la compuso juntando trozos. 
   ⚠️ CORREGIDO EL 05/10/2026, EL MISMO DÍA: ese final era un artefacto del log. El
   registro de descartes recorta cada cita a 200 caracteres (judge.ts:449,
   .slice(0, 200)), así que una cita de 206 salía truncada justo antes de «Retiro». La
   cita guardada en descartesPorCita termina en «…el material recogido en Salamanca y
   Retiro». No estaba cortada a mitad de palabra: lo estaba la línea del log. El
   arquitecto la citó así durante todo el día como demostración de que el juez cortaba
   frases, y no demostraba eso. Un caso no
   explica 21.
2. El juez cambió algo al final de la frase: un número escrito de otra forma, o un
   signo que normalize() no elimina.
3. El pajar se entregó por piezas (entregado_piezas): cada trozo se busca por separado
   en comprobadorDeLado, así que una frase REAL que cruce dos trozos seguidos falla
   sin que nadie haya cortado nada.
4. Tablas de Word con barra, ya identificadas y contadas aparte.

LA MEDICIÓN QUE SEPARA LAS CAUSAS: escrita el 05/10 como
SQL_B332_por_que_falla_la_cola.sql, pendiente de ejecutar. Todo lo necesario está
guardado: descartesPorCita lleva, por lado, el tipo de pajar y la longitud
(types.ts:175), y la cita en crudo, desde el primer descarte guardado (eb0a0033).

RESERVA: los 52 análisis son casi todos repeticiones de NOR-11. La mezcla mide cuánto
escuece en nuestras pruebas, no cuánto escocería a un cliente con otro corpus.

✅ MEDIDO EL 05/10/2026 CON SQL_B332. Fila de control: 42 lados y 11 citas
distintas.

LO PRIMERO, Y DESCARTA UNA CAUSA: los 42 lados son pajar `entregado_texto` y los 42
son documentos `.docx`. Ni uno es `entregado_piezas`, ni `texto_completo`, ni de un
Excel. La causa candidata 3 —una frase real que cruza dos trozos seguidos— QUEDA
FALSIFICADA: no había trozos en juego. Era la causa que defendía el arquitecto.
Y queda medido lo que la ficha daba por no medido: los 42 son prosa de Word.
⚠️ CORREGIDO EL 06/10/2026. `entregado_texto` NO significa que el documento se
entregara entero: significa que ese lado se entregó como texto CONTIGUO y no por
piezas (coincidencia-de-cita.ts:334-345). El lado analizado siempre va así, y en
tijera_vieja, sin_fuente_comun y corte_honesto puede ir recortado. Lo único que la
medición licencia es que ninguno fue `entregado_piezas`, y por tanto que la causa
candidata 3 —una frase real que cruza dos trozos seguidos— queda falsificada. Eso
se mantiene; la frase de más se retira.

39 DE LOS 42 LADOS TERMINAN EN LETRA, no en puntuación final. Eso NO prueba que
estén cortados: una frase completa copiada sin su punto final también termina en
letra. Es un dato, no un diagnóstico.

Y UN CORTE SIMPLE AL FINAL NO PUEDE PRODUCIR NINGUNO DE ESTOS FALLOS. Si el juez
copia el principio de una frase real y la deja a medias, lo que escribió sigue
siendo un trozo literal del documento y buscarCita lo encuentra por el paso literal
o el normalizado. Ninguna cita meramente truncada falla. Luego los 42 son
alteraciones, no recortes.

LAS TRES CONDUCTAS, partidas por paso de fallo, que es lo único medido, y las
cuentas cierran: 21 + 9 + 12 = 42 lados, y 4 + 2 + 5 = 11 citas.

1. EL FINAL DE LA CITA NO ESTÁ DETRÁS DE SU PRINCIPIO — `cabeza_sin_cola`, 21
   lados, 4 citas. La cabeza sí se localiza; la cola no está detrás. La cabeza y
   la cola son min(20, 40 % de la cita normalizada) (coincidencia-de-cita.ts:152-155);
   en cualquier cita de más de 50 caracteres son 20. El juez cambió el final, le añadió algo o pegó
   texto de otro sitio. Ejemplos: 206 caracteres acabando en «…el material recogido
   en Salamanca y Retiro» (la contradicción del punto de retirada de Chamberí, 5
   lados), 111 acabando en «…ubicado en la clínica de Chamberí» (14 lados, la más
   repetida), y una de 363 que ACABA EN PUNTO y aun así falla, lo que descarta el
   recorte por completo en ese caso.
   Sigue siendo la regla del PUESTO 2 incumplida, porque no copió la frase tal cual.

2. FALTA EL MEDIO, O JUNTA DOS SITIOS — `cola_demasiado_lejos`, 9 lados, 2 citas.
   El final sí existe en el documento, pero demasiado lejos de la cabeza.
   EL CASO QUE MÁS DICE, 7 de esos 9 lados, una cita de 244 caracteres acabando en
   «…able y recae siempre sobre esta figura [el Director Clínico]». Lo que va entre
   corchetes es el juez explicando a quién se refiere «esta figura». Y el mecanismo
   se entiende: normalize() elimina los corchetes, así que la cola normalizada
   queda «el director clínico» (normalize() quita los corchetes pero conserva los
   acentos, comprobado con la función real), que SÍ aparece en el documento, en otro sitio. De
   ahí `cola_demasiado_lejos` y no `cabeza_sin_cola`. Es el patrón del punto (2) de
   B.84 —narración dentro de la cita— y es exactamente el caso «esta figura» por el
   que B.321 quedó degradada en vez de cerrada. Queda demostrado con dato.
   ⚠️ DOS CITAS DISTINTAS MIDEN 244 CARACTERES, y no son la misma: (1) la de la
   contradicción sembrada 2 contra CLI-13, que empieza «El punto de retirada
   centralizado concentra el material de las tres clínicas…», vista en la pasada del
   06/10 a las 09:02 de Madrid; y (2) la glosa de NOR-10 contra CLI-12, que acaba
   «…recae siempre sobre esta figura [el Director Clínico]». Al citarlas, decir
   siempre el par de documentos.

3. NI EL PRINCIPIO ESTÁ — `sin_cabeza`, 12 lados, 5 citas. Cambiar o alargar el
   final no rompe el principio, así que si la cabeza no aparece —la cabeza y la cola
   son min(20, 40 % de la cita normalizada) (coincidencia-de-cita.ts:152-155); en
   cualquier cita de más de 50 caracteres son 20—, la cita está inventada entera o
   atribuida al documento equivocado.
   Dos de esos lados son una cita de 127 caracteres que ACABA EN PUNTO: una frase
   con aspecto de completa cuyo principio no está donde debería. Es B.86 de
   Puntos_Pendientes_Doclity.txt.

SIGUIENTE PASO, decidido el 05/10: implementar el reintento cruzado de B.86 SOLO
COMO DIAGNÓSTICO —cuando verifyQuote falle en un lado, reintentar contra el texto
del otro lado y registrar `cita_lado_cruzado` en vez de `cita_no_localizada`—, sin
cambiar nada de lo que pasa el filtro. Divide la conducta 3 en dos enfermedades con
curas distintas. No se diseña hasta mañana.

DEUDA DESTAPADA AQUÍ: el log recorta las citas a 200 caracteres sin decirlo
(judge.ts:449). Hoy costó una interpretación falsa que se mantuvo nueve horas.
Que el log avise del recorte, o que no recorte.

DEUDA DESTAPADA AQUÍ, y arreglada el mismo día: el comprobador de la documentación
exigía que toda ficha B.n citada tuviera su título en Estado_Del_MVP.md, porque se
escribió cuando la numeración vivía en un solo fichero. Desde el 06/10 reconoce
también las entradas de Puntos_Pendientes_Doclity.txt, que es donde viven B.1 a
B.194. El invariante era falso desde antes de hoy: la cita a B.138 figuraba entre
las violaciones de partida.

**REGLA NUEVA EN EL PROTOCOLO (05/10/2026)**: cuando Code dé al arquitecto un total, le
da también los sumandos. El arquitecto no puede ejecutar nada ni comprobar un total
por su cuenta, y ya ha reutilizado tres veces un número ajeno sin comprobarlo. La
regla «un número que viene de otro no se reutiliza sin comprobarlo» solo se puede
cumplir si el número viene desglosado.

**REGLA NUEVA EN EL PROTOCOLO (05/10/2026)**: antes de escribir una regla o una nota sobre la
estructura de un fichero, se lee el fichero. El 05/10 el arquitecto escribió una nota de
cabecera declarando que había «dos numeraciones B.n distintas» cuando es una sola partida en
dos ficheros, y la nota habría quedado escrita como hecho. Es la misma clase de error que
«antes de diseñar sobre la interfaz, se mira la interfaz».

**REGLA NUEVA EN EL PROTOCOLO (06/10/2026)**: el proyecto del director y el repositorio HAN
DIVERGIDO. Hay documentos, y pendientes con casilla, que viven sólo en la copia del proyecto.
Caso probado: `Sesion_43_Ingesta_Portadas_Y_Excel.txt` y su S43.4, que no están en el
repositorio (B.348 de Puntos_Pendientes_Doclity.txt). La regla: **el arquitecto no planifica
sobre la copia del proyecto de un fichero que vive en el repositorio; el fichero vivo lo lee
Code.** Y si el arquitecto aporta un texto que no está en el repositorio, lo declara como tal.

**REGLA NUEVA EN EL PROTOCOLO (06/10/2026)**: toda ficha que cite un recuento declara **el
universo contado y el filtro aplicado**. El origen: el 06/10 el arquitecto restó NOR-11 de un
fondo del que nunca formó parte —su estado es «pendiente», y el fondo de la búsqueda es el
corpus `analizado`—, y de ahí salió un «6 contra 5» inexistente y una urgencia infundada para
la etapa 3 (B.345 de Puntos_Pendientes_Doclity.txt).

**NOTA DE PROTOCOLO (07/10/2026), sobre la regla de arriba**: la regla —toda ficha que cite un
recuento declara el universo contado— la escribió el arquitecto el 06/10 y **la incumplió él mismo
el 07/10**: tomó «no aparece en las cuatro pasadas del 06/10» y lo trató como «no ha aparecido
nunca», y sobre eso construyó un mecanismo («al liberar plazas, el juez mete lo que la regla
prohíbe») que resultó falso: la remisión mutua ya había salido el 27/09 y la tasa es plana, 17 % y
18 % (B.315). **La regla no falló; falló quien la escribió, al día siguiente.**

**LECCIÓN DE PROTOCOLO (07/10/2026)**, con la literalidad del arquitecto: «Una conclusión sobre el
producto sacada de la salida de un instrumento declara qué campos lee ese instrumento. El 06/10 el
arquitecto dedujo que synthesize fundía cinco solapamientos y perdía las citas, cuando lo que pasaba
es que el SQL no leía el campo `puntos` y el `null` era una columna de la propia consulta. Tenía
además la prueba en contra —la pantalla mostraba los cinco puntos con sus dos citas— y no la
contrastó.»
- **Lo real**: `construirOverlaps` publica una entrada por pareja y une las descripciones con «. »
  por diseño (`lib/analysis/synthesize.ts:166`); los puntos van aparte, con sus dos citas, en
  `puntos` (`:173`, B.314); y el `NULL` lo escribe a mano
  `SQL_F120_P2_perdida_o_reclasificacion.sql:81`. Explicado en F-120, sección (h), punto 2.
- **No llegó a escribirse en ninguna ficha**: buscado el 07/10 por «funde», «fusiona», «cinco
  títulos concatenados» y «cita_existente a null» en todo el repositorio, y la única aparición es la
  explicación correcta de F-120. Lo paró Code al leer el código antes de abrir la ficha que se pedía.
- **Es la tercera de la misma familia esta semana** —una conclusión sacada de un recuento o de una
  salida sin declarar qué contaba—: NOR-11 restada de un fondo del que no formaba parte (06/10), el
  universo no declarado en las remisiones (07/10, B.315) y ésta.
- **Y LA CUARTA (09/10/2026)**, con la literalidad del arquitecto: «El 08/10 el arquitecto presentó
  la coincidencia de los dos onces —11 lados "documento equivocado" en el repaso a mano de F-120 y
  11 en un_lado_cruzado_existente de SQL_B358— como dos métodos independientes confirmándose. No lo
  era: los universos son distintos (SQL_B333 hasta el 06/10 frente a SQL_B358 hasta el 08/10, y los
  11 del SQL son sólo del lado existente), y el repaso no separó lados. Lo detectó Code al
  archivarlo. ES LA CUARTA DE LA MISMA FAMILIA EN UNA SEMANA: tomar que dos números coincidan como
  evidencia sin comprobar que cuentan lo mismo. Es la regla que el propio arquitecto escribió el
  06/10.» Está anotada en B.358 de `Puntos_Pendientes_Doclity.txt`.

**NOTA DE PROCESO (09/10/2026)**: `94efab9e` —el arreglo de la glosa, un cambio de producto en
`lib/analysis/`— se subió ANTES de que el arquitecto revisara el diff, y el acuerdo es el
contrario: el arquitecto revisa y después sube el director. Se subió con la orden habitual del
director («git push origin main») sobre el informe de Code, sin la revisión de por medio. El cambio
era sólido y se habría aprobado, pero **el sentido de la barrera es que «salió bien» no sea la
prueba.**

**REGLA DE CONGELACIÓN (09/10/2026, F-122, D2)**, con la literalidad de Fable:

> «REGLA DE CONGELACIÓN, QUE QUEDA ARCHIVADA. Hasta que el arnés dé el criterio de cerrado, entran
> solo tres cosas:
> El lector unificado y las etiquetas de la vía 2, con el alcance de D1.
> La segunda búsqueda dirigida de F-116 P5 para los hallazgos a los que falta el otro lado.
> La lista de datos examinados y el coste medido de la segunda pasada, F-120 P2.
> Todo lo demás queda congelado con fecha, no cancelado: tablas de Word, la elección de documentos
> de F-119, la función de citas del proveedor, la extracción de afirmaciones. Si el arquitecto o
> Fable proponen algo fuera de esta lista antes de que el arnés esté verde, el director lo para.»

- **El criterio de cerrado** (F-121): cada trampa sembrada detectada y publicada en 4 de 5 pasadas
  o más; cero falsos publicados; coste por análisis escrito. Al 09/10: PLAZO 8 de 8, NEGACIÓN 2 de
  8, LUGAR 0 de 8.
- **Congelado no es cancelado**: cada cosa congelada conserva su ficha y su fecha de congelación,
  el 09/10/2026.
- **Los criterios de reversión de la vía 2** y el alcance de D1 están en B.362 de
  `Puntos_Pendientes_Doclity.txt`.

**NOTA DE MÉTODO (09/10/2026): UN CONTROL QUE NO PUEDE FALLAR NO ES UN CONTROL.** Antes de dar por
buena una prueba o un bloque de control, se rompe a propósito lo que protege y se comprueba que se
pone rojo. Si sigue verde, no controla nada. Los dos casos del mismo día:
- **La prueba de la regla del titular** (`lib/analysis/unidades-de-cita.test.ts`): la primera versión
  seguía verde sin la regla, porque la fusión hacia adelante volvía a unir «## 2.2.» con su título.
  Hizo falta reproducir el caso medido en NOR-10 —una línea corta delante— para que, al quitar la
  regla a propósito, se pusiera roja esa prueba y sólo ésa (1 de 15).
- **El bloque de control de `SQL_B365_sin_trozos_y_sin_full_text.sql`**: la primera versión sumaba
  «con trozos + sin trozos», que siempre da el total y no podía salir mal. Se cambió por los
  denominadores ya medidos el 06/10 con SQL_B345 (50, 20 y 14), que sí pueden no cuadrar.
- Y el caso hermano de la prueba de `texto-del-trozo-en-el-prompt.test.ts`: con un `trim` colado en el
  render seguía verde, porque ningún trozo real empieza ni acaba en espacio. Se añadió un caso
  sintético con espacios en los bordes, que es el que se pone rojo.

**REGLA DE MÉTODO (09/10/2026): ANTES DE PROPONER UNA CAUSA, COMPROBAR SI YA ESTÁ MEDIDA.** Cuando el
arquitecto proponga una explicación, el primer paso del encargo es buscarla en
`Puntos_Pendientes_Doclity.txt` y en las fichas de `claude/consultas-fable/`. Si ya hay una medida
que la confirma o la refuta, se dice ANTES de hacer nada más. Esa comprobación le toca a Code, que
tiene el repositorio, y es la primera de cada encargo de diagnóstico.
- **El caso del 09/10**: se propuso el techo de tokens de salida como causa de PLAZO 8/8, LUGAR 4/8,
  NEGACIÓN 2/8, y estaba cerrado desde el 07/10 como P-F121-7 FALSA. No fue afirmar sin cotejar:
  fue afirmar contra una medida propia ya escrita, que es la peor variante. Lo paró la lectura del
  código antes de escribir el SQL_B366, que se canceló (B.360).

**EL ERROR DEL 09 Y 10/10/2026: GENERALIZAR UNA LECTURA A DIEZ PASADAS (B.369).** El séptimo de la
misma familia, y el más caro.
- **Lo que se afirmó** todo el 09 y el 10/10: «esa pareja se lee entera, 14.704 de 14.704, el
  retrieval queda descartado». Se generalizó UNA lectura a las diez pasadas.
- **Lo que mide la base** (director, 10/10, `lecturaDeLasParejas`): era cierto en seis pasadas del
  30/09 y falso en el resto. El régimen cambia entre pasadas del mismo par el mismo día, y a veces
  el candidato ni siquiera llega.
- **El coste**: se descartó la causa correcta con un dato insuficiente, y un día entero de
  investigación se dirigió al juez. La hipótesis buena la planteó el director dos veces, la
  segunda insistiendo.
- **Y no fue sólo del arquitecto.** La sección 1 de F-121, «el mecanismo, tal como está hoy
  (lectura de Code, 06-07/10/2026)», dice que en la pareja principal el juez recibe los dos
  documentos enteros, `pareja_entera`, 14.704 de 14.704. Es la misma generalización, escrita por
  Code a partir de unas pocas pasadas.
- **Es la regla de la cifra medida sobre un operando y citada sobre otro**: una medida de UNA
  pasada citada como propiedad del PAR. Y la regla de este mismo día —«antes de proponer una
  causa, comprobar si ya está medida»— vale igual para DESCARTAR una causa: «descartado» es una
  afirmación sobre todas las pasadas, y pide la población entera.
- ⚠️ **MATIZADO EL MISMO 10/10** (B.369): el interruptor está encendido desde el 30/09, así que las
  diez pasadas del 06 al 08/10 fueron probablemente `pareja_entera`. Probable, no verificable:
  se borraron. La entrada que sí variaba entre pasadas es la selección de candidatos.

**DOS MÁS DE LA MISMA FAMILIA, EL 10/10/2026.**
- **«El arreglo no se activa».** El arquitecto lo afirmó sin esperar la comprobación del
  `analysis_type`, que Code había puesto primero de las dos. Las pasadas de NOR-11 de las 22:20
  eran EXHAUSTIVE, que por diseño nunca sale de `tijera_vieja`, y un QUICK de CLI-20 a las
  22:24:42 dio `corte_honesto | pareja_entera`: el interruptor estaba encendido (B.369).
- **«CLI-20 no existe, cero filas».** Se dio por buena una consulta vacía sin preguntarse por qué
  volvía vacía, y CLI-20 existe: `CLI-20_protocolo-urgencias-dentales.txt`, analizado el 09/10 a
  las 22:24. Es la regla del cero: un cero vale sólo si el camino que lo produjo puede dar un
  no-cero en las mismas condiciones.

### 📋 B.331 — COMILLAS CURVAS, Y LA REPRESENTATIVIDAD DEL CORPUS (05/10/2026)

Hecho 1: la clase de caracteres de normalize-core.mjs:84 lleva la comilla doble recta
(U+0022) tres veces y el apóstrofo recto (U+0027) dos, más « y ». Las cuatro curvas
(U+201C, U+201D, U+2018, U+2019) no están, y nunca estuvieron: la clase nació así el
03/05/2026 (e9dd53ce). No es un accidente de codificación.

Hecho 2, medido dos veces. En el archivo de examen: 0 de 624 lados de cita, y 0 de
los 27 documentos del corpus de pruebas, leídos uno a uno con el extractor real. En
producción (SQL_B331, organización del piloto): 0 en los 50 documentos, 0 en los 567
trozos de la generación activa, 0 en los 2.830 lados de cita que pasaron la puerta y
0 en los descartados. El extractor no convierte comillas, así que los ceros son
reales.

Decisión del 05/10/2026: NO se añaden las curvas a normalize(). No hay beneficio que
obtener, y el riesgo sí se puede nombrar. De los cinco consumidores en producción,
TRES se mueven en contra:
- judge.ts:371-373: más líneas reconocidas como contexto, y por tanto más hallazgos
  descartados.
- finding-rules.ts:281: una contradicción cuyas dos citas solo difieran en el tipo de
  comilla pasaría a tratarse como equivalente y dejaría de ser contradicción.
- retrieval.ts (índice de valores, cruces, filas iguales): fundiría como una sola fila
  dos que solo difieran en el tipo de comilla. Eso mueve el colapso de filas idénticas
  de F-44/F-45 y, sobre todo, puede tragarse una discrepancia real.

RESERVA QUE MANTIENE VIVA ESTA FICHA: los 10 .docx de la organización del piloto los
fabricamos nosotros. El cero significa «aquí nadie ha escrito todavía en Word», no
«los documentos de Word no traen comillas curvas». Word las curva automáticamente en
cuanto alguien escribe en él. El día que entre un documento real de cliente, hay que
volver a medir esto ANTES de dar por bueno el cero. Y si entonces resultan
frecuentes, el arreglo va en el extractor o en el comprobador de citas, nunca en
normalize().

Consecuencia de método, escrita como regla: el corpus de examen y el del piloto son
ambos fabricados por nosotros, sin comillas curvas y casi sin tablas de Word. Una
pregunta sobre caracteres o sobre tablas de Word no se decide contra ellos. Sirven
para medir regresiones de la cascada, que es para lo que se hicieron. Enriquecerlos
con documentos reales es trabajo aparte y pendiente (pendiente de número en
Puntos_Pendientes_Doclity.txt).

Corrección de nomenclatura, del 05/10/2026: «literal» y «normalizada» no son pasos de
fallo, son vías por las que una cita pasa. Los pasos de fallo son sin_coincidencia,
sin_cabeza, cabeza_sin_cola, cola_demasiado_lejos, cabeza_y_cola y vacia_o_corta.

### 📋 B.330 — LA BARRA «|» EN normalize() — CONFIRMADA Y DELIBERADAMENTE NO ARREGLADA (05/10/2026)

Hecho: normalize() no elimina el carácter «|». Comprobado con la función real
(normalize-core.mjs:84). normalize('Residuos sanitarios | 21 dias | 3 semanas |
Clinicas, veterinarias') conserva las barras; el full_text del documento escribe esa
fila como celdas separadas por líneas en blanco, sin barras; no casa nunca.

Decisión del 05/10/2026: NO se añade la barra a la clase de caracteres.

Motivo 1, beneficio medido nulo. Simulación sobre los 387 lados de cita con barra del
archivo de examen (96 + 91 en puntos de solapamiento, 100 + 100 en contradicciones),
de los cuales 5 ya casan hoy y 382 no: los que pasan de no encontrarse a encontrarse
son 0. El archivo es casi todo Excel, donde full_text escribe «Columna: valor |
Columna: valor» y el juez cita solo los valores; quitando la barra sigue sin casar,
porque faltan los nombres de columna intercalados.

Motivo 2, daño con mecanismo nombrado. Hoy la barra es la ÚNICA señal de que eso son
celdas separadas. Sin ella, una cita que junte la última celda de una fila con la
primera de la siguiente pasaría como frase seguida, y una fila fabricada a caballo de
dos filas reales se daría por verificada. Es la misma clase de riesgo que B.317, y
produce exactamente la mentira que eliminó la reparación de los puestos 0, 1 y 2
(02/10/2026).

Tamaño medido en producción (SQL_B331, bloque c, 52 análisis desde el 02/10, 0
descartes omitidos por el tope): 33 de los 75 lados de cita descartados llevan barra,
los 33 en documentos .docx, ninguno en .md. Son solo 3 citas distintas, repetidas en
cada pasada. Encajan con el bloque b: 28 en cabeza_sin_cola y 5 en cabeza_y_cola.

Reserva: en tablas de WORD la barra sí es la causa del fallo. El arreglo de ese caso
no es normalize: es dar estructura de fila a las tablas de Word en el extractor
(B.319 aquí; pendiente de número en Puntos_Pendientes_Doclity.txt).

Reabrir solo si: se descarta el arreglo del extractor. Incluso entonces, antes hay
que medir el caso decisivo: filas fabricadas a caballo de dos filas reales.

### 🔥 B.328 — EL SALTO DE LAS CONTRADICCIONES NO ENCUENTRA SU SITIO EN 85 DE 101 (medido, sin arreglo; 05/10/2026)

**La medida** (pedida por el arquitecto al cerrar B.314). Sobre los 65 análisis archivados, cada cita de
contradicción e inconsistencia menor se buscó en el texto real del documento analizado (`corpus-pruebas/`,
texto extraído), con la misma función del salto del editor (`findTolerant`, vía `goToProblem`):
- **101 citas de contradicción, y se localizan 16.** Ninguna inconsistencia menor en el archivo.
- **Las 85 que no se localizan son filas de tabla pintadas** («a | b | c»): 75 del diff de tablas y 10 de
  prosa que llevan la fila como cita.
- Por origen: del diff de tablas se localizan 15 de 90; de prosa, 1 de 11.

**Lo que significa**: el clic de una contradicción de tabla lleva a «no se encontró el fragmento». Es la
ceguera de las filas de B.319, la misma que en los solapamientos (91 de los 93 puntos no localizados), y
**aquí es mayor: un 84 %, frente al 44 %**.

**Lo que esta medida NO dice**:
- el archivo del examen es de tablas casi por diseño, así que el 84 % es de ESTE archivo, no de producción;
- se mide contra el texto extraído, y lo que abre el editor puede no ser idéntico.

**Lo que decide el arquitecto**: si la regla «sólo se clica lo que se encuentra» se aplica también aquí, y
si la cura es localizar la fila en el texto (B.319) o dejar de ofrecer el salto.

📌 **EL HALLAZGO, DICHO COMO ES (arquitecto, 05/10/2026): UNA CITA QUE ES UNA FILA DE TABLA NUNCA SE VA A
LOCALIZAR EN EL TEXTO DE PROSA.** El diff de tablas produce exactamente esas. **Una funcionalidad entera —los
hallazgos de tablas— no se puede señalar en el documento.** Ése es el hallazgo, no el porcentaje. El 84 % va
siempre con su reserva al lado: el archivo es casi todo tablas y se mide contra el texto extraído. **Cuando
haya un corpus de prosa, se mide ahí y se corrige la cifra.**

**LA PREGUNTA QUE QUEDA PLANTEADA, sin decidir: ¿cómo se señala una fila de tabla?** Hay dos salidas:
- **encontrar la fila en el texto** (B.319);
- **o enseñarla de otra forma que no sea un salto.**

**🛠️ LA REGLA, APLICADA (05/10/2026): SÓLO SE CLICA LO QUE SE ENCUENTRA**, en los solapamientos y en las
contradicciones.
- **Dónde**: `problemsFromAnalysis` recibe el texto contra el que se hizo el análisis y busca cada cita
  UNA vez, con `findTolerant`, la misma función del salto (`marcarLocalizables`,
  `components/improvement/problems.ts`). No se recalcula al teclear: se ata al análisis, no al texto editable.
- **Qué texto**: al abrir, el texto tal como se carga; en un reanálisis, el texto que se acaba de mandar a
  analizar.
- **Lo que se ve**: un punto que no se encuentra enseña su cita y dice «no se puede señalar en este
  documento», sin nada que clicar. Una contradicción que no se encuentra no ofrece salto.
- **El coste, medido antes**: al abrir, sobre los 65 análisis archivados, **mediana 0,6 ms y máximo
  28,4 ms**, una sola vez. No hizo falta optimizar.
- **El precio, aceptado por escrito por el arquitecto**: si el usuario edita el documento y una cita deja de
  existir, su clic puede no encontrar nada. **Eso es distinto en naturaleza de lo que se arregla: un clic que
  falla porque el usuario ya arregló la frase es comprensible; un clic que nunca iba a funcionar es el
  producto mintiendo.**
- **La cuenta**: cada vez que se construye la lista, la consola del navegador recibe cuántas citas no se
  localizan, sólo cifras. **Ojo**: nadie lee esa consola. Para tener el número en la base haría falta un
  contador en el servidor, y eso es otro commit, que no es de pantalla.
- **La prueba** (`components/improvement/solapamientos.test.ts`), con la lista construida como en producción
  y sobre el texto real, ejerce las dos mitades: todo salto ofrecido se encuentra, y todo lo que no se
  encuentra deja de ofrecerse. Se ofrecen 118 de 211 puntos y 16 de 101 contradicciones. Control positivo:
  con `ofreceSalto` ignorando la marca, caen dos pruebas.
- **Sin sello**: cambio determinista con prueba.


### 📋 B.327 — LOS PUNTOS DE UN SOLAPAMIENTO SE VEN UNO A UNO Y SE DESCARTAN TODOS JUNTOS (coste aceptado, sin arreglo; 05/10/2026)

**Lo que pasa**: desde B.314 commit B, el usuario puede ir a cada punto de un solapamiento por separado,
pero «No es error» y «Solventar» actúan sobre la entrada entera: **si hay cinco puntos, se descartan los
cinco o ninguno.**

**Por qué**: descartar punto a punto exige dos cosas que no son de pantalla.
- **Cambiar lo que lee el modelo del chat de mejora**: hoy recibe una línea por documento, con su severidad,
  y pasaría a recibir una por punto, sin ella.
- **Cambiar lo que se guarda**: hoy «descartar» significa «este solapamiento con este documento no es un
  error», y pasaría a significar «este punto no es un error».

Las dos se deciden aparte, con su medida. **La decisión es del arquitecto, del 05/10/2026**, al elegir la
opción 2.

**Lo que obliga a la pantalla**: los botones se quedan en la entrada y no se repiten en cada punto. Un
botón dentro de un punto parecería actuar sobre ese punto, y actuaría sobre todos.

### 🔥 B.326 — EL SALTO DEL EDITOR A UNA CITA BUSCA POR CABEZA Y COLA DE 15 CARACTERES: EL MISMO SELLO DE GOMA, EN LA PANTALLA (SIN arreglo, no urge; 04/10/2026)

**Lo que hace**: al clicar un hallazgo, el editor de mejora busca su cita en el texto del documento y la
selecciona (`goToProblem`, `components/ImprovementModal.tsx:318-334`). La búsqueda es `findTolerant`
(`lib/texto/localizar-cita.ts:48`), que, si no encuentra la cita tal cual, prueba con sus **primeros 15 y
últimos 15 caracteres**.

**Por qué es el mismo defecto que B.318**: con una cita literal salta bien. **Con una esculpida —una cabeza
real y una cola real de sitios distintos— puede llevar al usuario a un párrafo que no es el suyo**, como la
puerta de cabeza y cola publicaba citas que no existían.

**Por qué no urge** (arquitecto, 04/10): hoy las citas publicadas son literales (B.313, B.318). El día que
una vuelva a estar esculpida, el usuario irá a un párrafo que no es el suyo.

**Sin arreglo.** Constancia.

### ⚠️ B.297 — LA LECTURA DE TROZOS SIN PAGINAR, y su margen medido (29/09/2026)

`getChunksForDocuments` (`lib/read-chunks.ts`) era UNA consulta sin paginar. Supabase corta
cada respuesta en el tope de filas del proyecto, **sin error**. Cortada por `chunk_index`,
se pierde la COLA de cada documento: el entero del escalón 1 (B.295), el pajar de
verificación de citas y los `caracteres` de B.281.
- **El margen, medido por el director el 29/09**: Max Rows = **1.000**. **Son las dos cifras
  que justifican paginar**:

  | Organización | `document_chunks` | Del tope |
  |---|---|---|
  | a9625e93 (la del director) | **569** | **57 %** |
  | 5a82712f (las tandas de agosto) | **696** | **70 %** |

  Hoy ninguna corta: ningún subconjunto de candidatos pasa del total de su organización.
  **Riesgo latente, no vivo**, y lo medido en agosto en 5a82712f no queda bajo sospecha por
  esto.
- **No es un riesgo lejano.** A un corpus de cliente de distancia, el tope se cruza sin
  aviso. La razón de paginar no es que hoy falle: es que el número que decide si falla vive
  en un panel, fuera del código, y puede cambiar sin que nadie toque el repositorio.
- ✅ **Paginada en `eaf0718c`** (`lib/leer-todas-las-paginas.ts`). Avanza por las filas
  RECIBIDAS y para en la página VACÍA, no en la «corta»: con el tope por debajo del tamaño
  de página, parar en la corta dejaría filas sin leer. La prueba simula un tope de 3.
- ⚠️ **CENSO POR CAPACIDAD**: las lecturas de filas de `document_chunks` sin paginar. El
  comando: `grep -rn "from('document_chunks')" app lib worker/src`; las demás son
  recuentos, inserciones y borrados. Eran **tres**:
  - `getChunksForDocuments`: PAGINADA;
  - `getDocumentChunks` (`read-chunks.ts:71`): un solo documento;
  - `loadFragmentContexts` (`lib/analysis/fragment-context.ts:89`): el contexto de los
    fragmentos, sobre el mismo conjunto de documentos que la primera.

  ✅ **Las tres paginadas**: el arreglo va por capacidad, como el censo (arquitecto, 29/09).
  Con dos de tres sin paginar, dentro de seis meses nadie recordaría cuál era la segura.
  - La primera, en `eaf0718c`.
  - `loadFragmentContexts` y `getDocumentChunks`, en `a528784a`. La de contextos era la más
    urgente: lee los mismos documentos y alimenta la entrada del juez.
  - Las tres con el orden de la clave única, y con sus mutantes.
- ⚠️ **LA COMPROBACIÓN FUERTE DEL DESPLIEGUE SE HA PERDIDO, y se dice.** Iba a ser comparar
  el log de un análisis de NOR-11 con el de las 09:08, y exigir que salieran idénticos:
  con el interruptor apagado, la paginación y D-3 no deben cambiar ni una línea.
  - ~~**Ya no se puede.** A las 13:14-13:16 UTC el director analizó NOR-10 y CLI-12, que
    entraron en el corpus, y el retrieval cambia con el corpus.~~ **Tachado el 30/09:** no
    entraron en el corpus, porque analizar desde la bandeja no cambia `analysis_status`
    (B.295). Lo que cambió fue la configuración: NOR-11 se lanzó con tres acompañantes de
    tanda.
  - **La comprobación, por tanto, quizá NO se ha perdido.** Bastaría una pasada de NOR-11
    con la MISMA configuración de tanda que la de las 09:08. Cuántos `ids de tanda` llevaba
    aquélla no consta aquí; si se sabe, la comprobación se puede hacer todavía.
  - **Lo que sobrevive**, comprobado por el ARQUITECTO en los dos logs (Code no los ha
    visto). Las partes que NO dependen del corpus salen idénticas a las de las 09:08:
    - NOR-11: «15 chunks, 15 samples, 14437 chars totales» y «truncado a 6000 de 14704»;
    - CLI-13: «11 chunks, 11 samples, 9743 chars totales» y «6000 de 9817».

    Lo demás queda apoyado en las pruebas (1.749 en ese momento).
  - ⚠️ **Y la base NO distingue qué despliegue sirvió cada análisis.** El push fue a las 13:12
    UTC y el primer análisis a las 13:14. `lecturaDeLasParejas` existe desde el commit 1,
    desplegado esa mañana, y con el interruptor apagado ni la paginación ni D-3 dejan rastro
    en el resultado. Eso lo dice la hora «Ready» del despliegue de `d65a0f52` en Vercel, no
    `SQL_Escalon1_verificacion_despliegue.sql`. Esa SQL sí verifica que el aparato del
    commit 1 se rellena en producción.

### 📋 B.298 — LAS GENERACIONES MUERTAS SE COMEN EL PRESUPUESTO DE FILAS (constancia, no arreglo; 29/09/2026)

`getChunksForDocuments` trae los trozos de TODAS las generaciones y filtra por la
generación activa después, en código (`lib/read-chunks.ts`). Parte de las filas son de
generaciones obsoletas, que se traen para tirarlas y cuentan contra el tope.
- **El número de hoy**: 569 trozos en total en a9625e93. **Cuántos son de generaciones no
  activas: no consta.** Lo diría
  `SELECT count(*) FROM document_chunks c JOIN documents d ON d.id = c.document_id
  WHERE c.org_id = 'a9625e93-af2a-4416-a465-5c2fa2a25bdf' AND c.generation <> d.active_generation;`.
- **Filtrar por generación en la propia consulta daría el MISMO resultado** —el código ya
  filtra— y consumiría menos del tope, y menos páginas.
- **No se hace ahora** (arquitecto, 29/09). La paginación ya resuelve el problema entero, y
  no se hacen dos cambios en el mismo sitio antes de una medida. Se decide cuando el
  interruptor del escalón 1 esté decidido, junto con el reparto de `judge.ts` (B.296).

### 📋 B.296 — `lib/analysis/judge.ts` TIENE 1.338 LÍNEAS, y no se parte todavía (29/09/2026)

Medido en `3733f75f`, 29/09/2026: **1.338 líneas**. La regla de la casa es 400. Creció con
el escalón 1 (B.295): era de unas 1.130 antes del commit 1. Con D-3 (`6d7e5781`), el mismo
día: **1.365**.
- **No se parte ahora, y el motivo no es la prisa** (arquitecto, 29/09). Partirlo en mitad de
  una medida cambiaría el fichero del que depende la medida entre la línea de base y la
  comparación. Eso contamina el «antes y después» por una razón que no tiene nada que ver con
  lo que se mide.
- **Se parte cuando el interruptor esté decidido**: encendido para quedarse, o apagado y
  revertido. No antes.

### 📋 B.294 — PREDICCIÓN, ESCRITA ANTES DEL CAMBIO: la fase 3 del principio del detector (29/09/2026)

**Escrita el 29/09/2026 a las 09:43, antes de tocar el marcador, los casos o el validador.**
Condición 1 de «un cambio del marcador se prueba repuntuando antes y después». La calculó Code
simulando la fase 3 completa con la maquinaria de hoy, sin tocar nada. Los casos se editaron en
memoria:
- N1 y P3 pierden la excepción;
- P4 pierde la base;
- el validador rechaza excepción y base juntas;
- la alarma pregunta, pasada por pasada, si el detector de base emitió algo emparejable
  (B.290 c).

**Sobre los 65 crudos (`c39397e7`, `97223b72`): NO SE MUEVE NINGÚN VEREDICTO.** El arquitecto
lo sospechaba; ahora está medido.

| Qué se miró | Resultado |
|---|---|
| Veredictos, las dos tandas | idénticos antes y después |
| La alarma: pasadas sin un emparejable del detector de base | N1-PUESTO 0 de 15; P3, 0 de 75 (pasada, fila) |
| `:276` viva tras retirar las excepciones de N1 y P3 | **ninguna** razón ni apartado en ningún crudo (sólo queda en P4, cuyos aciertos llegan por juicio) |
| Excepción y base juntas tras los cambios | ninguna; **hoy, cuatro** (N1-PUESTO, P3, P4-BELMONTE, P4-MEDINA) |
| Líneas del informe | cambia UNA: la de detector de P4 pierde «(base: juicio)» |

- **Es un «nada se mueve» VACÍO en el sentido de la condición 2**: ningún crudo real recorre
  la rama de la alarma.
- **La regla del validador y las ediciones de los casos entran en el MISMO commit.** Con los
  casos de hoy, la regla rechazaría cuatro esperados y el modo seco dejaría de validar.
- **Una decisión que la fase 3b no puede dar por supuesta: qué cuenta el contador «aciertos
  sin detector en el origen»** (B.290 e).
  - Contado sobre toda la tanda: **5 en `c39397e7` y 10 en `97223b72`**, todos N3-DUPLICADO
    (B.287).
  - Contado sólo sobre esperados con base: **0**.

  Falla abierto sólo donde hay una base que vigilar, así que la segunda lectura es la del
  motivo. Pero es la primera la que el informe enseñaría: sin decidirlo, el informe cambia
  según quién lo escriba.
- **Condición 2: qué recorre cada rama.**

| Rama | Con qué se prueba |
|---|---|
| base `estructura` y el acierto llega por `juicio` → **FALLA** | **crudo sintético** `examen/sinteticos/SINTETICO_N1-PUESTO_por_juicio.json`. Hoy da SIN_VEREDICTO (`scripts/examen-sintetico-n1.test.mjs`); con la fase 3, FALLA |
| la misma fila por los dos detectores, la del juez delante → **PASA** | **fixture**, no crudo (ver abajo) |
| base `juicio` y llega por `estructura` → aviso destacado | fixture; **latente**: sin base juicio tras la fase 3 |
| detector `null` con base → sin alarma, al contador | fixture; **latente**: las 101 contradicciones traen `confirmedBy` |
| `:276` sólo en P4 | crudo sintético de la fase 2 (`SINTETICO_P4-BELMONTE_por_estructura.json`): sigue SIN_VEREDICTO; y **el mutante «`:276` fuera de P4», que con la fase 3 YA puede fallar** |
| el validador rechaza excepción y base juntas | fixture; los casos de hoy son su control positivo (cuatro) |

- **La rama del ORDEN va con fixture, no con crudo.** El producto suprime el hallazgo del juez
  cuando el diff ya comparó esa fila: «descartado.cubierto_por_diff» (`lib/analysis/pipeline.ts:361-413`).
  El crudo real de N1 lo lleva, porque el juez también encontró a Reyes. La supresión NO es
  total: si R2 devuelve `pass` (celdas nulas), no suprime (`:387-389`, y la condición de `:405`). Pero **sin comprobar**:
  - que ese caso alcance una fila que el diff emitió;
  - y en qué orden quedarían los dos hallazgos en `discrepancies`.

  Un crudo afirmaría una forma del producto que nadie ha visto. El fixture prueba lo que
  importa: que la alarma no depende del orden (B.290 c).
- ✅ **NOTA DE ACEPTACIÓN, 29/09 (fase 3b), con la base generada justo antes:**
  - **La predicción NO se equivocó en ningún veredicto.** Los 65 crudos quedan igual.
    - El sintético de N1 pasa de SIN_VEREDICTO a **FALLA**, con «se perdió un detector
      determinista».
    - El de P4 sigue SIN_VEREDICTO.
  - **Quedó INCOMPLETA sobre el informe, y el motivo es del arquitecto.** Decidió el contador
    después de escribirse la predicción. Una decisión posterior a la predicción la deja
    incompleta: **el orden correcto es decidir antes de predecir.**
  - **La línea que falta.** Además de la de P4 sin «(base: juicio)», sale «· aciertos sin
    detector en el origen: 0 (esperados con base: ahí la alarma falla abierto)». Sale **tres
    veces**: N1 y P3 en `c39397e7`, N1 en `97223b72`.
    - Sale también en 0, por decisión del arquitecto: si sólo saliera cuando hay algo, nadie
      distinguiría «hay 0» de «esto no está implementado» (la guardia de B.292 otra vez).
  - **La regla «para ante lo que no estaba predicho» lo cazó.** Dado por «nada se mueve», se
    habría perdido el porqué del cambio en el informe.

### 📋 B.293 — PREDICCIÓN, ESCRITA ANTES DEL CAMBIO: el arreglo de la puerta del marcador (29/09/2026)

**Escrita el 29/09/2026, antes de tocar el marcador.** Es la condición 1 de «un cambio del
marcador se prueba repuntuando antes y después». La calculó Code, no el arquitecto, y se midió
simulando con la maquinaria de hoy, sin tocar el marcador. **El diseño que predice**:
- `:243` retirada, con N3 en `seguimiento: ['precision']` y N4 y N5 en las dos mitades;
- las razones de CERO dejan pasar los fallos de exceso;
- `:276` sólo queda en P4.

- **Sobre los 65 crudos, se mueve UN caso, en las dos tandas: N3.**

| Tanda | Caso | Antes | Después | Por qué |
|---|---|---|---|---|
| `c39397e7` | N3 | SIN_VEREDICTO | **PASA** | su cobertura exige 1 y N3-DUPLICADO sale 5/5 estable-acierto |
| `97223b72` | N3 | SIN_VEREDICTO | **PASA** | ídem, 10/10 |
| `c39397e7` | N4, N5 | SIN_VEREDICTO | SIN_VEREDICTO | cambia la razón: «SEGUIMIENTO: el caso mide y no juzga» |
| las dos | los demás | — | sin cambio | ninguna otra razón activa en estas tandas |

- **El razonamiento del arquitecto sobre N3 era correcto**: su cobertura es real
  (`minimoDeAciertos: 1`) y estaba silenciada por una razón que sólo declara la precisión.
- **El informe cambia además en esto**: la línea «observado: … falsos por pasada» tiene que
  seguir saliendo para N3, N4 y N5 (B.291). Si desaparece, el arreglo perdió la medición.
- **Condición 2, qué crudo recorre cada rama:**
  - **`:243` → seguimiento**: la recorren N3, N4 y N5 en los crudos reales.
  - **La clase CERO, `:239`**: un crudo REAL, sin inventar nada. P2 de `c39397e7` con sus
    pasadas 1 a 4. Hoy da SIN_VEREDICTO y calla su falso real («Fecha de última revisión»,
    pasada 1, techo 0). Después debe dar **FALLA por ese falso**, y seguir callando
    «0 estable(s)-acierto», que es una ausencia.
  - **`:251` y `:265`**: no hay crudo que las recorra. Van con fixture.
  - **`:276` en P4**: el sintético de la fase 2 más el falso inventado del censo **NO se
    mueve**, por diseño. P4 es TODO: sin clave no hubo escenario. Es el control de que el
    arreglo no abre la puerta de más.
- ✅ **CUMPLIDA el 29/09**, con la base generada justo antes y los casos de ese momento.
  - **Se movió N3 y nada más**: SIN_VEREDICTO → PASA en las dos tandas.
  - Lo que cambió además en el informe es de texto, sin mover ningún veredicto:
    - P1 y P4 dicen qué mitad juzgan;
    - las razones de N4 y N5 son ahora las del seguimiento;
    - la línea «observado: … falsos por pasada» sigue saliendo en N3, N4 y N5.
  - **P2 1-4** da FALLA por su falso real y calla «0 estable(s)-acierto».
  - **El sintético de P4** con el falso sigue SIN_VEREDICTO.
  - **El diseño cambió en un punto respecto a lo escrito arriba**: el seguimiento declara
    CLASE y MOTIVO por mitad (`PENDIENTE_DE_MEDIR` / `NO_PUEDE_FALLAR`). Sin la clase, el
    trinquete no distingue N3-N5 de N6.

### ⚠️ B.289 — EJEMPLAR: una frase sin comprobar que VIAJÓ hasta casi ser norma (28/09/2026)

**No es una regla nueva.** Es un ejemplar de la que ya existe, la de los indicativos sobre el
repositorio (`CLAUDE.md`, «Reglas obligatorias», la primera). Lo que lo hace distinto es que
**la frase sin comprobar viajó**.

- **Lo que pasó.** Para comparar la salida del validador, Code abrió una copia del repositorio en
  HEAD y corrió `node scripts/examen.mjs` sin `--lanzar`. Se colgó copiando dependencias y se
  paró. En el informe, Code escribió como hecho: «si los casos hubieran validado, habría lanzado
  una tanda real». **Era falso**: sin `--lanzar` el ejecutor es seco. Valida, declara el coste y
  vuelve (`scripts/examen.mjs:631-634`); la sesión y todo `fetch` van después (`:640`, `:401`).
- **El viaje.** El arquitecto tomó la frase como premisa y encargó una norma de protocolo, «el
  ejecutor no se usa para comprobar nada», con ese casi-accidente como caso. **Ni Code la
  verificó al escribirla, ni el arquitecto al recibirla.** Murió en la recepción del encargo: se
  leyó el ejecutor antes de escribir la norma.
- **La consecuencia práctica.** Cuando uno de los dos escriba un riesgo del repositorio, va con
  su `fichero:línea` o va marcado «sin comprobar». **El que lo recibe no construye nada encima
  de lo segundo.**
- **Es el tercer caso de hoy de la misma familia, la del relevo.** Los otros dos, en
  `claude/consultas-fable/F-118_2026-09-28_simetria-de-lectura.md`:
  - los «cinco» fragmentos (errata 2);
  - los 614 análisis de otra tabla (errata 3).

  El «no hay constancia» de F-65 (errata 4) es el mismo animal en su versión de lectura
  incompleta: se leyó el asunto del commit y no el cuerpo.

### 📋 B.288 — PREDICCIÓN, ESCRITA ANTES DEL CAMBIO: la fase 2 del principio del detector (28/09/2026)

**Escrita el 28/09/2026 a las 22:34, antes de tocar ningún comparador, caso ni el marcador.**
Es la condición 1 de la regla del protocolo «un cambio del marcador se prueba repuntuando antes y
después». Del arquitecto, comprobada contra el código antes de escribirla:

> Sobre los crudos guardados (`c39397e7` y `97223b72`), la fase 2 NO mueve ningún veredicto.
> Motivo: en todos ellos el acierto llega del detector que el esperado ya exige —N1-PUESTO por
> estructura 10/10 y 5/5, P4-BELMONTE y P4-MEDINA por juicio 5/5— y la declaración `'juicio'`
> de N6 está inerte porque el comparador por cita no la lee.
> Por tanto la repuntuación de la fase 2 será un «nada se mueve» VACÍO en el sentido de la
> condición 2, y se declara como tal en el commit. La prueba de la fase 2 será el crudo
> sintético y sus mutantes, no la repuntuación.

- **Comprobada el 28/09 sobre los 65 crudos**: los 25 esperados tabulares o por juicio de esos
  crudos (N1-PUESTO en 15 pasadas; P4-BELMONTE y P4-MEDINA en 5 cada uno) se miraron con el
  detector cambiado, y **ninguno emparejaría de otra forma**. P3 no tiene ningún hallazgo del
  juez entre sus discrepancias en ninguna pasada. N6 no tiene crudos. **La predicción se
  sostiene.**
- **El crudo que SÍ recorre la rama**, fabricado a mano:
  `examen/sinteticos/SINTETICO_P4-BELMONTE_por_estructura.json` — copia de
  `c39397e7/P4_pasada1.json` con P4-BELMONTE emitido por estructura. **Hoy**: el acierto no se
  reconoce, sale como extra y, con la auditoría completa de P4, cuenta como **FALSO**; el caso
  da FALLA (`scripts/examen-sintetico-p4.test.mjs`). **Después de la fase 2**: SIN_VEREDICTO con
  el motivo «el caso dejó de ejercer su rama», nunca un falso.

### ⚠️ B.287 — los solapamientos del JUEZ no traen `confirmedBy`: el detector de N3 sale «desconocido» (28/09/2026)

La fase 1 del principio del detector (`13cb7bb7`) apunta qué detector encontró cada acierto,
y para **N3-DUPLICADO** apunta «desconocido» en 15 de 15 pasadas (`c39397e7` y `97223b72`).
**No es un hueco del marcador: es del origen.** El solapamiento del juez se añade sin
`confirmedBy` (`lib/analysis/synthesize.ts:160`); sólo el de estructura lo trae
(`:183`, con `confirmedBy: 'estructura'` en `:192`).
- **Es otro ejemplar de «lo que cambia el resultado se guarda con el resultado»**
  (`claude/Protocolo_Harness_Tasas.md`).
- **Importa en la fase 3**: una alarma de cambio de detector no puede vigilar un campo que la
  mitad de las veces no viene.
- **Sin arreglar.**

### ⚠️ B.286 — un test intermitente SIN IDENTIFICAR: 1 de 1.522, el 28/09 (28/09/2026)

Antes del commit `12691b0f` la suite dio `1 failed | 1521 passed`, y **el nombre se perdió**:
la salida se filtró con `grep` y el commit se encadenó detrás de un comando que no se para ante
un rojo. **Nueve ejecuciones después, las nueve en verde.** El commit sólo tocaba un comentario
de un caso y el protocolo, así que el fallo no puede venir de ahí.
- **Relacionada con B.263** —un caso determinista que caía por tiempo de pared una pasada de
  cada cinco, arreglado el 23/09 calentando `Intl` y subiendo `testTimeout` a 15.000 ms—, **sin
  dar por hecho que sea el mismo**: sin el nombre no se sabe ni si fue por tiempo.
- ⚠️ **Es la TERCERA vez del mismo fallo de método**: `a3423ef2` (16/09, §5.70), B.263 (22/09) y
  ésta. Las dos anteriores quedaron escritas en fichas, no en el protocolo. **La regla, ahora en
  el protocolo**: `claude/Protocolo_Harness_Tasas.md`, «Un rojo no puede pasar en silencio».
- ⚠️ **29/09 por la noche — OTRA VEZ, y con la regla ya escrita.** Code encadenó el commit
  `7d5cade8` detrás de la suite en una sola orden. La suite dio 1 fallo y `exit 1`, pero la
  orden siguió, porque el eslabón anterior era un `node` que imprimía el resultado y salía
  con 0.
  - No es un aprendizaje nuevo: es la regla del protocolo INCUMPLIDA. **La suite y el commit
    van en órdenes separadas.**
  - El commit sólo tocaba esta ficha, era local, y se verificó después: la suite completa,
    corrida sola, dio 1.750 de 1.750.
  - **Esta vez el rojo tiene NOMBRE**: `lib/examen/autenticacion.test.ts`, «CONTROL POSITIVO
    — los dos censos SÍ ven el endpoint del examen». Tardó **16.954 ms** contra el
    `testTimeout` de 15.000 (`vitest.config.mts:69`), y 497 ms al repetirlo. Es un tope de
    reloj de pared sobre código determinista que recorre el repositorio con `readdirSync`:
    mide la máquina (la familia de B.263).
  - **Sin dar por hecho que sea el de este B.286**: aquel no tiene nombre, y éste es un
    candidato, no una identificación.
- ⚠️ **02/10/2026 — OTRA VEZ EL MISMO, y esta vez con la regla CUMPLIDA.** Antes de commitear
  la ficha B.312 (sólo documentación), la suite dio `1785/1786` y `exit 1`. Era el mismo test,
  `autenticacion.test.ts` «CONTROL POSITIVO», con **19.795 ms** contra 15.000.
  - El commit **no se hizo**: la suite y el commit van en órdenes separadas, y se miró el exit.
  - Repetida la suite entera, sola: **1.786 de 1.786**, y ese test en **521 ms**.
  - Es la segunda vez con nombre, y las dos el mismo. **Ya no es un candidato: es un patrón.**
    Un tope de reloj de pared sobre código determinista falla cuando la máquina va cargada
    (la carga de ese momento no consta). Sin arreglo, por ser de medición: subir su
    `testTimeout` sería decisión aparte.
- 🔎 **QUÉ AFIRMA DE VERDAD ESE TEST, leído el 02/10/2026** (pregunta del arquitecto, sin cambiar
  nada): **el tope de 15.000 ms NO es un requisito, y tampoco es una aproximación de nada que el
  test quiera comprobar.**
  - **Lo que afirma** (`lib/examen/autenticacion.test.ts`) es un **CENSO ESTÁTICO DEL CÓDIGO**:
    - sólo `app/api/admin/examen/route.ts` valida un token de sesión;
    - sólo él y `purge-expired` leen la cabecera `authorization`;
    - y el control positivo, que el censo SÍ ve al examen.

    Es una propiedad del repositorio, no del tiempo.
  - **El tope no es suyo**: es el `testTimeout` GLOBAL (`vitest.config.mts:69`). Y la propia
    configuración lo justifica diciendo que en su alcance «no hay nada que pueda colgarse»,
    porque son funciones puras «sin E/S y sin esperas» (`:55-62`).
  - **Este test incumple esa premisa**: recorre el disco. Lista y lee cada `.ts`/`.tsx` de `app`,
    `lib`, `components` y `worker` (287 ficheros, 2,4 MB), y lo hace **cuatro veces**: dos en el
    control positivo y una en cada uno de los otros dos tests. Por eso tarda lo que tarde el
    disco: 0,5 s con la caché caliente y 17-20 s con la máquina cargada.
  - **Así que mide el reloj en vez de lo que le importa.** Lo que le importa ya lo afirma
    directamente: qué ficheros salen en el censo.
  - **Las salidas posibles, sin elegir** (decide el arquitecto):
    - leer el árbol una sola vez para los tres tests, que divide por cuatro la E/S;
    - darle un tope propio y declarado, que diga que no es un requisito sino la red contra un
      cuelgue;
    - o las dos.

    Lo que no arregla nada es subir el tope global a ciegas.
- ✅ **ARREGLADO EL 02/10/2026, con las dos salidas** (decisión del arquitecto). Sólo tests y
  configuración:
  - **El árbol se lee UNA vez**: `codigo()` lo lee y lo guarda la primera vez, y los dos censos
    filtran lo guardado (`lib/examen/autenticacion.test.ts:41-55`).
  - **Tope propio, de 120.000 ms**, en el `describe`. El comentario dice que es una guarda contra
    cuelgues y no un requisito de rendimiento (`:59-71`).
  - **El tope global no se toca**: sigue en 15.000 (`vitest.config.mts:86`).
  - **La premisa del global, corregida** (`vitest.config.mts:64-79`): «sin E/S» era falso, y no
    para un test sino para **una clase**.
    - El comentario la nombra con su comando de censo: 29 ficheros de test leen disco y 9
      recorren el árbol con `readdirSync`.
    - Y dice lo que queda: **los otros ocho siguen bajo el tope global.**
  - **Medido, en caliente**, en milisegundos por caso, en el orden del fichero:

    | | 1.ª pasada | 2.ª pasada |
    |---|---|---|
    | antes | 269 · 110 · 104 | 229 · 109 · 103 |
    | después | 127 · 4 · 4 | 170 · 4 · 4 |

    El primer caso paga la lectura y los otros dos ya no leen nada. **En frío no se ha
    medido**: el rojo no se provoca a voluntad, y el tope propio es lo que lo cubre.
  - 📌 **LA LECCIÓN** (arquitecto, 02/10): **una premisa escrita que no se cumple no se arregla con
    una excepción; se arregla nombrando la clase que la incumple.** Se pidió «la excepción con su
    nombre», y la premisa resultó falsa para una clase entera.
  - **Los otros ocho que recorren el árbol quedan como RIESGO CONOCIDO Y CON NOMBRE, y no se
    tocan** (arquitecto, 02/10). El día que uno caiga en rojo ya se sabrá por qué, y el censo
    estará hecho: el comando está en `vitest.config.mts`.
  - ⚠️ **CAYÓ EL PRIMERO, el mismo 02/10, y es de los ocho**: `lib/pinecone/corpus-del-examen.test.ts`,
    «⚠️ CONTROL POSITIVO — el censo SÍ ve imports cuando los hay» (`:236`), con **40.658 ms**. Fue
    en la suite de antes de commitear la corrección de la pieza (c) y B.316, que sólo tocaba
    documentación. **No se hizo el commit**: se repitió la suite entera, sola, y dio **1.818 de
    1.818**, con ese caso en 4.845 ms. Es lo que se predijo: el disco frío, en un test que recorre
    el árbol bajo el tope global. **No se toca**, como está decidido.
    - ✅ **LA PREDICCIÓN SE CUMPLIÓ** (arquitecto, 02/10): es el primero de los ocho nombrados como
      riesgo conocido, caído el mismo día y por el motivo previsto.


---

## 📋 5.92 · ACTA DE LA SEMANA — cinco hipótesis nuestras que se cayeron al medirlas, y las tres que costaron una decisión (25/09/2026)

**Escrita a petición del director el 25/09/2026**, y con una advertencia sobre su propio
título: **en el repositorio no había ningún «acta de la semana»**. El encargo pedía escribir la
lección «en el acta de la semana», y lo más cerca que existía era el formato de acta de §5.84
(la retirada del umbral). Así que ésta la estrena, con el formato de ahí. Si el sitio previsto
era otro, se mueve.

### LA LECCIÓN, en la frase que la cierra

> **«Invocar el rerank para ese caso habría puesto el arreglo en el sitio equivocado.»**

Y su hermana, del mismo día y sobre por qué `N5` no usa `N6` como ancla:

> **«Un ancla que nunca ha producido un no-cero es otra pantalla apagada.»**

### LAS CINCO, con quién las emitió y qué las tumbó

| # | La hipótesis | De quién | Qué la tumbó | ¿Costó? |
|---|---|---|---|---|
| 1 | «los cinco ficheros no están en `corpus-pruebas/`» | **mía**, y dicha empezando por «he verificado» | `git fetch` — estaban en `origin/main` (`31c141d6`) y mi clon iba una detrás | una respuesta entera equivocada |
| 2 | «los discriminantes de los falsos 1 y 5 están AUSENTES, o el documento cambió» | del **verificador**, con su mensaje | leer las dos líneas: las frases estaban, **partidas por un salto de línea del documento** | media hora, y habría mandado a buscar dónde no estaba |
| 3 | «las seis plazas del rerank explican el falso negativo del autoclave» | **del arquitecto y mía** | escribir la ficha con el código delante: el fragmento 4 **sí** se recuperó y CLI-01 **sí** pasó el rerank | nada — murió antes del arreglo |
| 4 | «la extracción de RRHH-04 se quedó a medias» | del **arquitecto**, con su aviso ⚠️ | correr el troceado: 1.495 caracteres de 1.530 bytes, el documento acaba donde debe | nada |
| 5 | «`*.md text` cambia el troceado de RRHH-04» | **mía** | medirlo con LF y con CRLF: **1.493 caracteres en los dos casos** | nada, y el arreglo se hizo igual por `content_hash` |

**Las tres que costaron algo son la 1, la 2 y la 3, y las tres salieron baratas por la misma
razón: se midió antes de arreglar.** La 3 es la que mejor lo enseña, porque el pendiente ya
estaba aprobado y encargado: se abrió, se escribió con el código delante, y la primera línea de
la ficha acabó corrigiendo a quien la encargó. **Un pendiente puesto por inercia habría
mandado a instrumentar el rerank para explicar algo que el presupuesto explicaba entero.**

⚠️ Lo que las une, y es lo que hay que poder releer: **ninguna de las cinco era absurda.** Las
cinco eran razonables, cuatro venían de alguien que sabía de lo que hablaba, y las cinco eran
falsas. Lo que las cazó no fue desconfianza: fue que en los cinco casos la medición estaba **a
un comando de distancia** y se hizo antes de actuar. La 1 costó precisamente porque ahí NO se
hizo —se miró una copia del repositorio y se afirmó sobre el repositorio.

### ⚠️ Y LA DECISIÓN DE ALCANCE DEL MISMO DÍA, que el director corrige sobre sí mismo

Sus palabras: «aprobé cuatro casos nuevos en el mismo día en que dije que había que recortar el
alcance. Eso es incoherente y la incoherencia la firmé yo». Los cuatro casos se quedan; el
alcance se cierra aquí.

**DENTRO de la fase 1, y es todo lo que queda**: el endpoint del examen · el marcador con los
tres estados · la procedencia en las pasadas · la regla del validador que prohíbe un techo
numérico sin línea de base · **la primera tanda real.**

**FUERA, a después de la primera tanda**: el caso reservado · `contarElFondo` · el falso 5 de
la ronda B (RCP de RRHH-04 contra soporte vital de NOR-04, anotado como construible en
`examen/casos/N1_falsos_conocidos.mjs`) · «etapa X iniciada» · **y cualquier caso nuevo.**

> **El criterio, con sus palabras, y queda aquí para poder recordárselo**: «diez casos sin
> medidor valen menos que seis con medidor. Llevamos dos días escribiendo casos sin haber visto
> ni una vez el informe que los va a leer. Si te pido otro caso antes de la primera tanda,
> recuérdame este párrafo.»

### EL REQUISITO QUE EL MARCADOR HEREDA, y va desde el primer día

El **control de tanda** de `N4` y `N5`: sus pares no llevan siembra, así que no tienen control
positivo propio. Está escrito como dato legible en los dos ficheros
(`elSilencioCuentaSiSoloSi`) y **hoy nadie lo honra**, porque el marcador no existe.

**Si `N1` no acierta su `Puesto` en la misma tanda, el silencio de `N4` y `N5` es SIN VEREDICTO,
no verde.** No es un añadido posterior: un marcador que primero los pinte verdes y luego
aprenda a distinguir habrá publicado dos veredictos falsos antes de aprender.
