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
| **3** | El cliente pide autorización, sube a la ruta que le da el servidor y manda `ref` | frontend | pendiente |
| **4** | Retirada del camino viejo, con su fecha escrita | servidor | pendiente |

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
