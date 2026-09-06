# Qué falta para que `reprocesar` funcione — y si es mucho o poco

**06/09/2026 · SOLO LECTURA.** La pieza 3 quedó a medias: el endpoint responde
**501** para todo documento de la nube. Esto es qué falta exactamente.

**La respuesta corta: es poco de escribir y toca dos sitios que no son míos.** Y
hay un tercero que no se ve hasta bajar al detalle.

---

# 1 · LO QUE YA ESTÁ, que es casi todo

`downloadFile` **devuelve segmentos ya extraídos** —`Promise<ExtractedSegment[]>`,
`lib/drive/types.ts:26`—, no un binario. Así que desde ahí hacia abajo el endpoint
**ya tiene todo escrito**: `chunkSegments`, embeddings, generación N+1, marcador,
conmutación. La rama `reprocesar` reutiliza el 80 % de la de `retrocear`, cambiando
solo de dónde salen los segmentos.

Y de paso hace algo que `retrocear` no puede: **como los segmentos vienen del
fichero, un Excel se repara con sus celdas intactas.** Toda la guarda de tablas
—el rechazo `sin_original_con_tablas`— **desaparece** por esta vía.

---

# 2 · LO QUE FALTA — tres piezas, y la tercera es la que no se veía

## 2.1 · El token, y NO se puede copiar *(≈25 líneas, pero mueven `sync`)*

Hace falta: leer `drive_connections`, `getProvider`, descifrar el token y
**refrescarlo si caducó**, persistiendo los tokens nuevos. Está en
`drive/sync/route.ts:83-100`.

⚠️ **Copiarlo sería una segunda implementación de lo mismo**, que es lo que esta
casa prohíbe — y este bloque en concreto **ya costó un fallo**: el comentario
explica que hay que persistir TAMBIÉN el `refresh_token` porque Microsoft lo rota,
y que no hacerlo deja la conexión muerta sin aviso. Un duplicado se quedaría sin
esa lección el día que alguien toque uno de los dos.

**Así que la pieza no es «escribir 25 líneas»: es EXTRAERLAS de `sync` a una
función compartida** y que el sync la use. Eso toca un camino de producción que
hoy funciona — pequeño, pero no gratis.

## 2.2 · ⚠️ EL `mimeType`, QUE NO SE GUARDA *(la que no se veía)*

`downloadFile(accessToken, fileId, **mimeType**)` lo exige, y **`documents` no
tiene esa columna**: el sync lo saca del listado (`file.mimeType`, `:210`) y lo
tira. Tres salidas, y ninguna es obvia:

| salida | coste | problema |
|---|---|---|
| **(a)** volver a listar la carpeta y buscar el fichero | ninguno de código | ⚠️ acopla la reparación al listado — y **si la carpeta cambió, el fichero no está**: la reparación depende del mismo mecanismo que B.187 rompe |
| **(b)** pedir el fichero por id al proveedor | un método nuevo en `DriveProvider` + los DOS proveedores + tipos | correcto y robusto (los ids son globales), pero **toca OneDrive, que es `∅` en el censo** |
| **(c)** derivarlo del nombre | dos líneas | **falla justo en lo interesante**: un Google Doc o Sheet nativo no tiene extensión en el nombre, y son precisamente los que necesitan la rama de exportación |

**La cuarta, que es la que yo miraría**: **guardar el `mimeType` al indexar.** Es
un dato que ya teníamos en la mano y tiramos — la misma especie que
`storage_path` en las subidas manuales. Coste: **una columna (SQL, tuyo)** y
escribirla en los tres puntos del sync. Y arregla el problema para siempre en vez
de sortearlo en cada llamada.
⚠️ Con su límite declarado: **los documentos ya indexados seguirían sin
`mimeType`**, así que para ellos haría falta (a), (b) o esperar a que se
re-sincronicen.

## 2.3 · El `provider` correcto

`getProvider(connection.provider)` — trivial, pero conviene decirlo: si la
organización tiene OneDrive, la reparación pasa por el proveedor **menos probado
del sistema**. No es trabajo extra; es riesgo extra, y va declarado.

---

# 3 · ENTONCES, ¿MUCHO O POCO?

**Poco de escribir, medio de tocar.** Desglosado:

| pieza | tamaño | qué mueve |
|---|---|---|
| la rama `reprocesar` en el endpoint | ~30 líneas | solo mi endpoint |
| extraer el bloque del token | ~25 líneas movidas | ⚠️ **`drive/sync`, producción** |
| el `mimeType` | 1 columna + 3 escrituras | ⚠️ **SQL (tuyo) + `drive/sync`** |
| batería | el plan ya está probado; la rama nueva no es pura | poco cubrible por vitest |

**Un día de trabajo, y dos de las tres piezas tocan el sync**, que es el camino que
acaba de destaparse como el más delicado del sistema (B.187). Ésa es la razón por
la que yo no lo metería en el mismo commit que nada más.

---

# 4 · Y LA PREGUNTA QUE HAY QUE HACER ANTES DE CONSTRUIRLO

**¿Hace falta `reprocesar` para el cambio del cortador?** No.

Para un cambio del CORTADOR, `retrocear` repara **todo lo que hay que reparar**,
incluidos los de la nube: el texto está en `full_text`, y el cortador no depende
del original. **La única razón por la que hoy un documento de Drive no se repara es
que el plan lo manda a `reprocesar` porque PUEDE**, no porque lo necesite.

Es decir: **hay un arreglo de una línea** —dejar que los de la nube caigan a
`retrocear` cuando lo que cambió es el troceado— frente a **un día de trabajo** para
construir la vía completa. Y la elección entre las dos **no es de coste, es de
significado**: si `retrocear` repara a un documento de la nube, la vista debería
decir que ese documento está reparado, y hoy diría «media reparación».

⚠️ Es B.186 otra vez, en su forma cara: **el estado no sabe QUÉ cambió**, y por eso
no puede decidir bien qué vía hace falta. Contestar B.186 probablemente contesta
esto también.
