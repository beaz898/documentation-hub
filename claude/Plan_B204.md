# Plan de B.204 — la ruta la elige el cliente, y deja de elegirla

*(Escrito el 10/09/2026. La ficha del hallazgo es `Estado_Del_MVP.md` §5.1 y no se
repite aquí: esto es el plan del arreglo, no una segunda declaración del problema.)*

**Vía elegida por el director: la (b) — el cliente referencia por IDENTIDAD y no
por ubicación física.** La vía (a) —comparar la ruta con quien llama— no se
descartó: es el commit 1, y precede a la (b) en vez de sustituirla.

---

## ⚠️ LO PRIMERO, PORQUE CAMBIA CÓMO SE ESCRIBEN LOS OTROS TRES

**EL AGUJERO SE CIERRA EN EL COMMIT 1, NO EN EL 4.** Los tres que quedan cambian
CÓMO viaja el fichero; ninguno de ellos es lo que impide que alguien lea el
temporal de otro. Eso ya está hecho. Entre hoy y el commit 4 el camino viejo
sigue vivo por la ventana de lectura dual — **vivo, pero no abierto**.

Quien lea este plan dentro de un mes tiene que poder distinguir **arreglado** de
**migrado** sin preguntar, porque si los confunde hará una de estas dos cosas:
correr a terminar la migración creyendo que hay un agujero abierto, o dejarla a
medias creyendo que ya no hay nada que hacer.

---

## Los cuatro commits

| # | qué | lado | estado |
|---|---|---|---|
| **1** | La guarda de pertenencia en los tres endpoints, en función intermedia | servidor | ✅ **HECHO** — `dac6da2a`, 10/09/2026 |
| **2** | `lib/subida/referencia.ts`, `POST /api/subidas/autorizar`, y los tres aceptan `ref` **o** la ruta vieja | servidor | ✅ **HECHO** — `228239d2`, 10/09/2026 |
| **3** | El cliente pide autorización, sube a la ruta que le da el servidor y manda `ref` | frontend | ✅ **HECHO** — `99a4c450`, 10/09/2026 · **pendiente de ejercer en pantalla** |
| **4** | Retirada del camino viejo, con su fecha escrita | servidor | ✅ **HECHO** — 14/09/2026 |

**LAS DOS CONDICIONES DEL COMMIT 4, Y CÓMO SE CUMPLIÓ CADA UNA.** Se escribieron
antes de llegar a él, a propósito, para no decidirlas mirando lo ya hecho:

1. **Ejercido en pantalla** — ✅ 12/09/2026, cinco gestos, anotados en el censo.
2. **Que nadie entre ya por la ruta** — ✅ **por gesto, no por contador**, y la
   diferencia se dice: el 14/09/2026 se subió un documento desde el chat y se miró
   el objeto en Storage. Se llama `1789366696828-c134bfe1-…`: marca de tiempo y
   UUID, **sin el nombre del fichero dentro**, que es la firma de una ruta
   compuesta por el servidor. Entró por la `ref`.

⚠️ **LO QUE ESE GESTO NO DEMUESTRA, y por eso no se escribe como si fuera el
contador**: dice que el camino NUEVO funciona, **no que nadie haya usado el viejo**
en las horas anteriores. Eso lo decía `[SUBIDA] via=ruta`, y **vivía en los
registros de Vercel, no en la base**: no es consultable por quien no entra ahí. Se
sustituyó por el criterio del nombre del objeto porque era lo único verificable sin
terminal, y **se escribe qué clase de evidencia es**: un gesto, no una medición.

El contador desaparece con el camino que contaba. A partir del 14/09 no hay camino
viejo por el que entrar, así que no queda nada que contar.

**No se funden.** Cuatro commits con build verde entre medias es la regla de la
casa, y lo que se ahorraría fundiéndolos son dos `push`. Si al llegar al 3 apareciera
una razón TÉCNICA para juntar dos, se dice y la decide el director.

### Lo que ya está en el commit 1, para no rehacerlo

`lib/subida/pertenencia.ts` — comparación por SEGMENTO EXACTO (no por prefijo:
con `startsWith`, `abcd/x.pdf` sería de `abc`, y siendo UUID nadie lo vería a
ojo), el fallo en el tipo de retorno, falla cerrada si el id de quien llama llega
vacío, y diez casos en suite. El contador es un registro `[PERTENENCIA]` y **no**
una fila, por decisión del director del 10/09/2026 con su disparador de revisión
escrito en el módulo.

---

## ✅ EL ESTRENO, EJERCIDO CONTRA PRODUCCIÓN EL 10/09/2026

⚠️ **CONTRA PRODUCCIÓN, NO CONTRA EL PANEL DE VERCEL, y la distinción no es
pedante: es la que motivó que `/api/admin/config` existiera.** El panel dice que
una variable EXISTE; no dice que sea correcta ni que el despliegue en curso la
haya recogido. Sólo una lectura desde el runtime distingue «está puesta» de «está
bien puesta».

**SON DOS HECHOS Y SE ANOTAN POR SEPARADO**, porque uno puede ser cierto y el
otro falso, y fundirlos haría que el fallo del segundo se leyera como cubierto
por el primero:

| # | qué se ejerció | resultado |
|---|---|---|
| **1 · el secreto llegó al runtime** | `GET /api/admin/config` contra producción | `presente: true · longitud: 72 · usable: true` — *«La variable llegó al runtime y es usable.»* |
| **2 · el mecanismo EMITE** | `POST /api/subidas/autorizar` contra producción | `success: true`, con ref emitida, ruta compuesta por el servidor **empezando por el `user id` de quien llamó**, y el nombre del fichero **dentro de la firma** en vez del cuerpo |

**Con eso queda cerrada la mitad que la suite no podía demostrar**: allí el
secreto es de mentira, así que la suite prueba el criterio y nunca el
despliegue.

⚠️ **LO QUE NO ESTÁ EJERCIDO Y NO SE CUELA EN LA MISMA LÍNEA: RESOLVER esa ref en
los tres endpoints.** Emitir y resolver son dos mitades del círculo, y sólo se ha
ejercido la primera contra producción. La segunda llega con el commit 3, cuando
el cliente mande la ref de verdad. Escribirlo junto sería exactamente el vicio
que este plan persigue — dar por ejercido lo que sólo está construido.

---

## ⚠️ EL COMMIT 2 ES UN ESTRENO, NO UN CABLEADO

Es la parte de este plan que más fácil sería escribir mal, y por eso va con su
comprobación al lado.

**El mecanismo existe**: `lib/analysis/firma.ts` es HMAC-SHA256 con secreto de
servidor, `timingSafeEqual` con su guarda de longitud, id emitido por el servidor
dentro de la firma, y `verificar()` que devuelve `null` en vez de lanzar. Está
probado y su secreto está validado por `lib/analysis/secreto.ts`.

**Y no lo usa nadie.** Comprobado el 10/09/2026 abriendo el CONSUMIDOR y no el
productor: `grep` de los imports da `firma.test.ts` y `secreto.ts`, y ni un
endpoint. Luego el secreto **puede no haberse ejercido nunca en producción**.

**Consecuencia para el encargo del commit 2, y es la que pidió el director:** se
escribe como ESTRENO —qué se comprueba la primera vez que este mecanismo corre de
verdad, en red, con el secreto real de Vercel— y **no** como reutilización de algo
rodado. Escribirlo como reutilización sería dar por rodado lo que nunca ha
corrido, que es exactamente la especie que persigue la regla del indicativo.

---

## Lo que ya está decidido del commit 2, y no se vuelve a discutir

**LA IDENTIDAD.** Una cadena opaca emitida por el servidor con
`{ ruta, userId, orgId, fileName, exp }` firmado. **No se persiste nada**: una fila
al subir es lo que F-98 P2 mató con su medición de 108 fragmentos frente a 6
documentos indexados, y el «no» del usuario tiene que seguir siendo gratis.
Dos especies, dos módulos, una criptografía: la ref vive en `lib/subida/`.

**QUIÉN LA RESUELVE.** Una función y sólo una, a la que los tres endpoints
preguntan, con el fallo en el tipo (`malformada` | `firma` | `caducada` | `ajena`),
falla cerrada, y contador por motivo. El `fileName` deja de venir del cuerpo y
sale de la firma: cierra una segunda puerta que la ficha no nombra —hoy el cliente
elige la extensión con la que el servidor decide cómo extraer.

**LA CADUCIDAD: DOS HORAS, con su razón.** Entre subir el documento y abrir el
modal de Mejora hay una **revisión humana sin límite de tiempo**, así que no puede
ser de minutos. Si caduca, el usuario ve «vuelve a subirlo», no un fallo mudo; y
el contador de `caducada` es lo que diría si alguna vez pasa de verdad.

**EL NEGATIVO EN SUITE: ref ajena, caducada y manipulada.** Puerta nueva, negativo
propio, cero créditos. Es F-106 P3 aplicado — y esta vez sobre una guarda que va a
existir de verdad.

---

## Qué NO arregla este plan, y sigue declarado

**Los temporales huérfanos no desaparecen.** Se seguirán borrando donde hoy
(`ingest`, cancelar, cerrar el modal) y seguirán quedándose al cerrar la pestaña;
no hay barrido y el único `list`+`remove` está en `purge-org.ts`, al borrar la
cuenta.

Lo que sí cambia, y es la mitad que vale: **pasada la caducidad nadie puede
nombrarlos** —ni un compañero, ni un ex-compañero, ni su propio dueño, porque
autorizar emite siempre una ruta nueva—. **Deja de ser una fuga y pasa a ser
basura.** Eso mueve la limpieza de urgente a aburrida; sigue siendo pieza aparte y
con la regla de siempre: se enseña con su edad y borra el usuario, nunca un
barrido silencioso.

**Y lo que este plan no toca**: las políticas RLS del bucket `documents` no están
en el repositorio. Si un cliente con la clave anónima puede leer la carpeta de
otro SIN pasar por nuestra API sigue siendo NO DETERMINADO — entrada del
inventario de supuestos externos de F-106 P1.

---

## Qué se rompe en A5, y qué hay que rehacer de su encargo

A5 es el **único consumidor** de `extract-text` (`hooks/chat/useDocuments.ts`), así
que es justo el camino que cambia. La tanda está reservada en `Tandas_Harness.md`.

- **La predicción 3 · 57 · 0 · 0 se mantiene**: describe el resultado del
  análisis, no el transporte.
- **La razón #1 de las cuatro hay que reescribirla**: dice «que `analyze-v2` entre
  de verdad por la rama `storagePath`». Esa rama no existirá; será la de la `ref`.
  Las razones #2, #3 y #4 quedan intactas.
- **La tanda se lanza después del commit 4** (o del 3, si alguna vez se funden).
  Entre el 1 y el 3 el transporte está a punto de cambiar, y medirlo ahí es
  comprar la evidencia perecedera que F-106 P2 quería evitar.

---

# ⚠️ EL CIERRE, REHECHO EL 15/09/2026 — porque el primero era falso

**ESTE PLAN SE CERRÓ DICIENDO QUE ERAN TRES ENDPOINTS. ERAN CUATRO.**

El cuarto es `POST /api/index-text`, y no era el menos grave: es el único de la
familia que, además de descargar con clave de servicio, **BORRA**. Con una ruta
ajena, los otros tres devolvían contenido; éste destruía el fichero temporal de
otro.

**POR QUÉ NO SALIÓ, y es lo único que hay que recordar de aquí**: el recuento se
hizo **enumerando por NOMBRE** —se buscó `storagePath`— y ese parámetro aquí se
llama `originalStoragePath`. La pertenencia real a la clase nunca fue un nombre:
era una **capacidad** — «acepta ruta del cliente y toca el almacén con clave de
servicio». Apareció por accidente cinco días después, mirando otra cosa.

**Y fue la segunda vez en el mismo plan**: el commit 3 esperaba **tres** emisores
en el cliente y había **cinco**. Dos recuentos, los dos cortos, los dos de
memoria sobre una lista que se creía completa.

⚠️ **ESO ES LA POBLACIÓN DE UNA REGLA DE LA CASA, promovida el 14/09/2026:** todo
hallazgo de la forma «los N sitios que hacen X» lleva en su ficha el **comando de
censo** que define la pertenencia, y cerrarlo exige **re-ejecutarlo y que dé cero
pendientes**. Un censo de memoria muere con la sesión que lo hizo.

## El censo de este plan, ahora escrito y re-ejecutado

```bash
# La pertenencia: quién toca el almacén con clave de servicio.
# NO se busca el nombre del parámetro — ése fue el error de la primera vez.
for f in $(grep -rl "\.storage" --include=*.ts app/ lib/ worker/ | grep -v test); do
  ops=$(grep -oE "\.(download|remove)\(" "$f" | sort -u | tr "\n" " ")
  [ -n "$ops" ] && echo "$f | ops: $ops | ref: $(grep -c resolverOrigenDelFichero "$f")"
done
```

**Resultado del 15/09/2026 — cinco sitios, cero pendientes:**

| fichero | operaciones | estado |
|---|---|---|
| `app/api/analyze-v2/route.ts` | download | ✅ referencia firmada |
| `app/api/extract-text/route.ts` | download | ✅ referencia firmada |
| `app/api/ingest/route.ts` | download · remove | ✅ referencia firmada |
| `app/api/index-text/route.ts` | download · **remove** | ✅ referencia firmada, **15/09/2026** |
| `lib/purge-org.ts` | remove | **fuera de la clase, comprobado**: itera `memberIds` del servidor y compone las rutas desde el listado. No recibe nada del cliente |

⚠️ **Y ESE CENSO FALLÓ EN SU PRIMER INTENTO, hoy mismo.** La versión inicial
buscaba `storage.from(` en una sola línea y **`extract-text` parte la expresión en
dos**, así que se lo saltó. *Un censo por capacidad escrito con la forma de un
nombre sigue siendo un censo por nombre.* Se rehízo buscando `.storage` a secas, y
esa corrección se anota porque es exactamente el mismo fallo que este apartado
viene a documentar, cometido por quien lo estaba documentando.

**Ahora el cierre de B.204 es verdad, y lo es de una manera comprobable por otro:
el comando está escrito, cualquiera lo re-ejecuta.**

## ⚠️ LO PRÓXIMO, Y YA NO ES UN ARREGLO — 15/09/2026

**Con B.220 cerrado, el transporte de A5 es el definitivo: la tanda ya se puede
lanzar y su evidencia ya no es perecedera.**

El orden acordado tras F-107 es **b → a → medición**:

1. ✅ **b** — `index-text` migrado (15/09/2026). *Cerraba un hallazgo cuyo cierre
   era falso*: el criterio (i) de F-107 P4.
2. ⏳ **a** — los `org_id` corruptos de `documentation-gaps` y `feedback`
   (**B.223**). Criterio (ii): es el único que **fabrica datos malos
   activamente**. Va en su propio encargo, e incluye contar las filas ya
   fabricadas **antes** de tocarlas.
3. ⏳ **LA MEDICIÓN — A5 rehecho, con la predicción HEREDADA `3 · 57 · 0 · 0`** y
   la razón #1 reescrita como dice el apartado de arriba.

**Lo que NO compite y por qué**, para que no se cuele por inercia:

- **B.225** (huérfanos servibles) espera a una respuesta medida: **¿el chat los
  pisa con frecuencia?** Si sí, es una guarda de un commit y sube; si no, va a la
  cola. **Esa medición no se ha hecho** y la ficha no afirma ninguna cifra.
- **Las 459 líneas de `index-text`** no cierran ningún hallazgo. Norma de la casa
  sin víctima activa: se parte el día que se toque ese fichero por otra razón.

## ⚠️ ESTADO AL 15/09/2026, FIN DEL DÍA — LO PRÓXIMO ES MEDIR, NO ARREGLAR

**`b` y `a` están hechos.** Con eso se acabó la lista que Fable autorizó a
adelantar, y **la siguiente sesión es una MEDICIÓN**: A5 rehecho con su
predicción heredada **`3 · 57 · 0 · 0`** y la razón #1 reescrita.

**Lo que apareció por el camino y NO justifica seguir arreglando**, aunque
apetezca —están en fichas y esperan su turno—:

| ficha | qué es | por qué NO va antes de medir |
|---|---|---|
| B.225 | huérfanos servibles | la puerta principal está cerrada; el `dryRun` decide, y es gratis |
| B.228 | `documentation_gaps` sobrevive al purgado | nadie la lee |
| B.229 | el error del proveedor se sustituye por uno inventado | impide ejercer B.227, no rompe nada |
| B.231 | `disconnect` no pasa por `deleteDocument` | deja filas muertas, no miente en pantalla |
| B.232 | sincronización sin tope | ⚠️ **la única candidata a saltarse la cola**, y sólo si el director va a reconectar con otra cuenta |

⚠️ **B.232 ES LA EXCEPCIÓN QUE HAY QUE VIGILAR, y la condición es concreta**: si
el director conecta una cuenta distinta a la que trajo los documentos, la
siguiente sincronización se los lleva. Mientras no lo haga, no corre. **Eso no es
una opinión sobre la gravedad: es una condición que se puede cumplir o no, y hoy
no se cumple.**

**Y el criterio de corte sigue siendo el de F-107 P4**, que ninguna de las cinco
cumple hoy: ni cierran un hallazgo mal cerrado, ni detienen corrupción activa,
ni el camino a medir pasa por encima de ellas.

⚠️ **Y LA SEÑAL QUE HAY QUE VIGILAR, escrita aquí para que se vea sola: cuando la
cola de arreglos empiece a llenarse de mejoras generales en vez de cierres, la
madriguera ha empezado.** Cada arreglo tiene que enseñar el hallazgo que lo paga;
cuando no lo tenga, le toca medir a alguien.

## ✅ 15/09/2026 · A5 MEDIDO — Y LO PRÓXIMO VUELVE A SER MEDIR

**Hecho hoy**: B.220 (b), B.223 (a), B.227, B.232, y **A5 y A6 medidos contra la
base**. El recuento de caminos pasa de **tres de ocho a CUATRO de ocho**.

**LO PRÓXIMO ES A7 O A8 — los dos de estilo— Y NO ES UNA PREFERENCIA:**

| razón | |
|---|---|
| **cierran la cuarentena que queda** | tras A5, «Reanalizar todo» está medido por sus dos caminos. Lo único que sigue en cuarentena es **«Reanalizar estilo», que no se ha medido NUNCA** |
| **son el hueco más grande** | A1, A3, A5 y A6 tienen cifra. A7 y A8 no tienen ninguna: no es que su cifra sea vieja, es que no existe |
| **y la regla de la casa lo dice** | la primera prueba de un camino no medido **no confirma: descubre**. Estos dos son los últimos caminos vírgenes de la familia principal |

⚠️ **Y ANTES DE LANZARLA, LA PREGUNTA QUE HOY HABRÍA AHORRADO 60 CRÉDITOS: ¿qué
puede cortar esa pasada antes de que mida?** Hoy fue el veto por hash, que nadie
había enumerado. Para el estilo, `analyze-style` cuesta 2 créditos y tiene sus
propias puertas — **se leen antes, no después**.

**LO QUE NO COMPITE, y por qué**, para que no se cuele por inercia:

| ficha | por qué espera |
|---|---|
| B.220, B.225, B.234 | ninguna cierra un hallazgo mal cerrado ni detiene corrupción activa |
| B.235 | su mitad urgente ya entró; la otra **espera a tener cifra**, que es justo lo que el contador nuevo va a dar |
| B.228, B.229, B.231 | dejan residuo o mienten en un mensaje, no pierden datos |
| B.232 (el tope) | la guarda del servidor cerró la vía alcanzable; el tope sigue haciendo falta el día que alguien mueva la carpeta raíz |

**El criterio de corte no ha cambiado**: un arreglo va antes que una medición sólo
si cierra un hallazgo cuyo cierre era falso, detiene pérdida activa, o el camino a
medir pasa por encima de él. **Ninguna de las siete lo cumple hoy.**

## ⚠️ 16/09/2026 · EL PUNTO 2 DEL CRITERIO DE SALIDA QUEDA DETENIDO, Y NO POR PLAN

**`temperature: 0` no estrechó la dispersión del análisis de estilo: la ensanchó**
(7–9 pasó a 7–10). B.240.

**Consecuencia directa sobre el plan**: medir **A7/A8 por conjuntos** —el paso 3
que estaba escrito y listo— **no se puede hacer mientras esto siga**. Comparar dos
puertas cuyo resultado varía dentro de sí mismo no distingue una diferencia de
puerta de la dispersión de cada una.

**Y con ello, el punto 2 del criterio de salida** —«la puerta principal medida por
sus dos entradas, misma cifra»— **no se cierra por el camino del estilo**. No
falta plan ni faltan créditos: **el instrumento no repite**.

⚠️ **Lo que SÍ sigue disponible para ese punto 2**: el camino del **análisis de
corpus**, que en A5/A6 dio `3 · 57 · 0 · 0` **por las dos puertas y en los dos
modos**. Ése sí repitió. La diferencia entre los dos caminos —uno repite y el otro
no— es ahora un dato del producto, no una casualidad de la tanda.

**Y A2/A4 siguen donde estaban**: son los dos exhaustivos que el cliente pisa y no
tienen cifra, y **no dependen de B.240** porque van por el camino que sí repite.

## ✅ 16/09/2026 · EL PUNTO 2 SE CIERRA POR EL CAMINO DEL ESTILO — corrige lo de esta mañana

Esta mañana escribí que medir A7/A8 por conjuntos quedaba detenido por B.240.
**Era la conclusión correcta con los datos de entonces —tres pasadas— y falsa con
catorce.**

Con nueve pasadas por el chat y cinco por la bandeja, **las diez anclas aparecen
por las dos puertas y en proporción**. El punto 2 **queda cerrado para el camino
del estilo, y por CONJUNTOS**.

⚠️ **Lo que sigue abierto es OTRA propiedad, y conviene no confundirlas:**

| propiedad | estado |
|---|---|
| las dos puertas dan **lo mismo** | ✅ **medido**, 14 conjuntos |
| ese mismo resultado **se repite** | ❌ **no**: varía de 7 a 10 por las dos puertas (B.240) |

**La dispersión no impedía comparar las puertas: impedía compararlas POR CIFRAS.**
Por conjuntos se pudo, y con las mismas pasadas.

**Lo próximo del criterio de salida sigue siendo el punto 3 —la cobertura— y ahí
A2 y A4 no dependen de B.240**, porque van por el camino del análisis de corpus,
que en A5/A6 sí repitió.