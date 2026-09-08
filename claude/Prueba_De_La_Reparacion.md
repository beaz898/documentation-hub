# Probar la reparación en producción, antes de tocar el cortador

**06/09/2026.** La razón de hacerlo ahora es correcta y conviene dejarla escrita:
**si se prueba después, un fallo no se puede atribuir.** Reparación y cortador
nuevo cambiarían a la vez, y el aislamiento se pierde.

---

# 0 · ⚠️ LA PROPIEDAD QUE HACE QUE ESTA PRUEBA VALGA: HOY ES UN NO-OP CONTROLADO

> ⚠️⚠️ **CADUCADO EL 07/09/2026, y se deja escrito en vez de borrarlo.** Esta
> sección describe la ventana en la que reparar no cambiaba nada — el cortador
> todavía no había cambiado. `fd30fc2f` la cerró. **Lo que hay que exigirle hoy
> a una reparación está en la §7**, y el criterio de aquí, aplicado tal cual,
> daría «reparación rota» ante el cortador funcionando.

**El cortador todavía no ha cambiado**, así que re-trocear un documento con el
mismo cortador produce **exactamente los mismos trozos**. Eso no resta valor a la
prueba: **es lo que la hace buena.**

> Todo lo que cambie es un hallazgo. Los trozos tienen que salir idénticos, uno
> a uno, y solo la generación debe moverse.

Es el control positivo perfecto para un mecanismo: se ejercita entero —troceado,
embeddings, escritura de N+1, marcador, las cuatro patas de la conmutación— y el
resultado esperado se conoce **carácter por carácter**. Cuando el cortador cambie,
esta misma prueba dejará de ser no-op y comparará contra una línea de base que ya
existe.

---

# 1 · ⚠️ ANTES DE ELEGIR NADA: EL LECTOR PUEDE DECIR QUE NO HAY CANDIDATO

**`GET /api/admin/estado-del-corpus`** (admin, solo lectura).

Y hay que mirarlo primero por un motivo concreto: **`EXTRACTOR_VERSION` sigue en
2**, así que todo lo indexado en 2 sale `al_dia` — y el disparo lo **rechaza** con
ese motivo. Solo son candidatos los documentos con la versión en `NULL` o en `1`,
es decir **el parque anterior al 22/08**.

Qué mirar en la respuesta:

| campo | qué decide |
|---|---|
| `recuento.reparable_resubiendo` | **si es 0, hoy no hay candidato** y esta prueba no se puede hacer todavía |
| `recuento.reparable_automaticamente` | ⚠️ ésos hoy devuelven **501**: `reprocesar` no está construido |
| `a_reparar[]` | los nombres, con su estado — de aquí sale el candidato |
| `truncado` | si es `true`, el recuento es una muestra: no concluir del resto |
| `operaciones_manuales_necesarias` | el coste del parque entero, para verlo antes de empezar |

**Si sale 0 en los dos reparables**, las salidas son tres y ninguna es «forzarlo»:
1. **Aceptar que la prueba va justo después del salto a 3.** Se pierde algo de
   aislamiento —el cortador ya sería nuevo— pero se conserva la mitad importante:
   la línea de base de los trozos viejos está guardada y se puede comparar.
2. **Subir un documento de prosa a propósito** y repararlo. ⚠️ Nace en la versión
   vigente, o sea `al_dia`: **no sirve** sin tocar su fila a mano, y tocarla a mano
   es fabricar el caso, no medirlo.
3. **Esperar.** Es legítimo y hay que decirlo: la prueba no es urgente, el
   cortador sí puede esperar un día.

---

# 2 · QUÉ DOCUMENTO — los criterios, porque el nombre lo da la consulta

No recomiendo un nombre a ciegas: el candidato **sale de `a_reparar`**, y hasta
que no se ejecute no sé qué hay. Los criterios, en orden:

1. **Estado `reparable_resubiendo`.** Los `reparable_automaticamente` (Drive) dan
   501 hoy.
2. **Que NO sea `.xlsx`/`.xlsm`.** Un documento con tablas se rechaza con
   `sin_original_con_tablas` — y ese rechazo, si aparece, **también es un
   resultado que vale**: prueba que la guarda que impide perder celdas funciona.
3. **Cuantos más trozos, mejor.** Con seis trozos se ve un reparto; con uno no se
   ve nada. De los medidos, los `.docx` largos (NOR-10 con 75, CLI-12 con 59) son
   los que más mecanismo ejercitan **si aparecen en la lista**.
4. **Y si hay elección, el que no sea fixture de una tanda.** Hoy da igual —la
   reparación es no-op— pero es buena costumbre no mover documentos que sostienen
   líneas de base.

---

# 3 · QUÉ MIRAR ANTES

```sql
-- (a) LA FILA, que es lo que la conmutación va a tocar
SELECT id, name, source, active_generation, chunk_count, extractor_version,
       analysis_status, reviewed_at, reviewed_by, length(full_text) AS chars
FROM documents WHERE id = '<id>';

-- (b) LOS TROZOS de la generación viva: cuántos y de qué tipo
SELECT chunk_type, count(*), sum(length(text)) AS caracteres
FROM document_chunks
WHERE document_id = '<id>' AND generation = <active_generation>
GROUP BY chunk_type;

-- (c) LA HUELLA DEL TROCEADO — para poder comparar carácter por carácter
SELECT chunk_index, length(text) AS len, md5(text) AS huella
FROM document_chunks
WHERE document_id = '<id>' AND generation = <active_generation>
ORDER BY chunk_index;

-- (d) Y QUE NO HAYA STAGED VIVO (si lo hay, el disparo se rechaza)
SELECT count(*) FROM document_staged WHERE document_id = '<id>';
```

Guarda la salida de **(c)**: es la línea de base.

---

# 4 · CÓMO SE DISPARA

Es una ruta de administración y no tiene botón todavía. Desde el navegador, con
la sesión abierta en la aplicación, en la consola:

```js
await (await fetch('/api/admin/reindexar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ documentId: '<id>' }),
})).json()
```

La respuesta ya dice casi todo: `via`, `generacion.antes/ahora`,
`trozos.antes/ahora` y el `aviso` de que es media
reparación.

---

# 5 · QUÉ MIRAR DESPUÉS, con lo esperado y lo que significa cada desvío

Se repiten (a), (b), (c) y (d) con la **generación nueva**.

| qué | antes | esperado | si difiere |
|---|---|---|---|
| `active_generation` | N | **N+1** | la conmutación no llegó a la pata 2 |
| `chunk_count` y (b) | C | **C, igual** | ⚠️ **HALLAZGO**. Sigue valiendo DESPUÉS del cortador: la foto congelada dice que el número de piezas no cambió en ninguna de las cinco entradas |
| las huellas de (c) | lista | ⚠️ **YA NO son idénticas — ver §7** | invertido el 07/09/2026: con el cortador nuevo, la huella del trozo 1 se conserva y las siguientes SE MUEVEN. Que no se muevan es el hallazgo ahora |
| `extractor_version` | NULL, 1 o 2 | **3** (la vigente desde `d8b06d1b`) | el sello no se escribió: mira el caso que lo vigila |
| **`analysis_status`** | X | **X, IGUAL** | ⚠️ **HALLAZGO GRAVE** — es B.185: reparar no puede meter un documento en el corpus |
| **`reviewed_at` / `by`** | Y | **Y, IGUALES** | ⚠️ **HALLAZGO GRAVE** — reparar no puede devolver a la bandeja lo ya revisado |
| `document_staged` (d) | 0 | **0** | la pata 4 no corrió: el swap quedó a medias, se puede reinvocar |
| chunks de la generación N | C | **0** | la pata 3 no corrió: sobra basura invisible, no es urgente |

⚠️ **Las dos filas en negrita son la primera comprobación EN PRODUCCIÓN de
B.185**, que hasta ahora solo está verificado por batería. Si alguna se mueve, la
reparación está metiendo documentos en el corpus y hay que parar.

**Y una comprobación de producto, fuera del SQL:** que el documento **siga
respondiendo en el chat** como antes. Las dos consultas de arriba miran la base;
que la recuperación siga funcionando lo dice el chat, y es lo único que comprueba
que los vectores nuevos quedaron servibles.

---

# 6 · LO QUE ESTA PRUEBA NO COMPRUEBA, declarado

· **No comprueba `reprocesar`**, que hoy devuelve 501.
· **No comprueba que la reparación MEJORE nada** — no puede: hoy es un no-op. Eso
  se mide cuando el cortador cambie, y contra la línea de base de (c).
· **No comprueba el comportamiento con tablas** salvo que el candidato sea un
  `.xlsx`, en cuyo caso lo que se comprueba es **el rechazo**, no la reparación.
· **Y no dice cuánto tarda un parque entero.** Da el coste de UNO, que es la cifra
  que faltaba (H4 del diseño); el resto es multiplicar y verlo.

---

# 7 · ⚠️ EL CONTROL POSITIVO DESPUÉS DEL CORTADOR — la ventana de no-op está cerrada

**07/09/2026, escrito ANTES de disparar.** Esta sección corrige el criterio de
las §0 y §5, y la corrección no es un matiz: **es lo que separa un hallazgo de
una falsa alarma.**

## 8.1 · Lo que ya no se puede pedir

El criterio original decía: *«new 9.txt es prosa corta, dos trozos, y el cortador
nuevo no debería cambiar su troceado. Si al repararlo el resultado difiere, la
reparación está rota.»*

**Era cierto hasta `fd30fc2f` y hoy ya no lo es.** Ese criterio nació en la
ventana en la que reparar era un **no-op** —mismo cortador, mismos trozos—, y esa
ventana se cerró con el arreglo de B.182. Un documento de **dos** trozos entra en
el bucle de `splitByLength`, y el bucle es exactamente lo que cambió: **el
segundo trozo ya no empieza donde empezaba.**

Aplicado tal cual, el criterio daría **«reparación rota» ante el cortador
funcionando**. Es la forma clásica de un control que se quedó viejo: sigue
midiendo, pero ya no mide lo que dice.

## 8.2 · El criterio corregido, con las tres cosas separadas

Un documento de **dos trozos** ya no es un control de identidad byte a byte: es
un control del CORTADOR, que es más informativo y tiene tres afirmaciones
distintas.

| # | qué | esperado | si no |
|---|---|---|---|
| **P1** | `trozos.antes` / `trozos.ahora` | **2 → 2** | ⚠️ HALLAZGO. La foto congelada dice que el número de piezas no cambia en ninguna entrada: si aquí cambia, el cortador hace en producción algo que la batería no ve |
| **P2** | huella del trozo **0** | **IDÉNTICA** | ⚠️ HALLAZGO, y el peor de los tres. El arreglo movió **dónde empieza el siguiente**, no dónde ACABA éste. Si el primero se mueve, el cambio llegó más lejos de lo que declaraba |
| **P3** | huella del trozo **1** | **DISTINTA**, y su texto empieza en una frontera —tras `\n\n`, tras `. ` o tras `\n`— | ⚠️ HALLAZGO **al revés**: el cortador nuevo no llegó a producción. Verde donde se esperaba rojo es el que se descubre tarde |

**La única excepción de P3, y va escrita para que no sirva de excusa después:**
si en los ~200 caracteres anteriores al corte no hay **ni `\n\n`, ni `. `, ni
`\n`**, no hay a dónde saltar y el trozo 1 sale idéntico — es el caso
`sin fronteras` de la foto congelada. **En prosa castellana con puntos eso no
pasa**, así que P3 idéntico se investiga; no se acepta como «bueno, puede ser».

## 8.3 · ⚠️ LA FOTO DE ANTES HAY QUE TOMARLA ANTES, Y AHORA ES OBLIGATORIA

`swapDocumentVectors` **borra los trozos de la generación vieja**
(`deleteDocumentChunksBelowGeneration`, `document-swap.ts:144`) y sus vectores.
Cuando la respuesta llegue, **la línea de base ya no existe**: P2 y P3 son
incomparables y la prueba se ha perdido, no fallado.

En la ventana de no-op esto era recuperable —el resultado tenía que ser idéntico,
así que la foto de después servía de foto de antes—. **Ya no.** Ejecutar (c) de
la §3 y guardar la salida deja de ser buena costumbre y pasa a ser un paso.

## 8.4 · Y qué pasa con los quince

**Siguen dando 501**, y el salto a 3 no lo ha cambiado: antes respondían `409
al_dia` y ahora `501 reprocesar_no_implementado`. Han pasado de «no hay nada que
reparar» a «hay que repararlos y esta vía no puede», que es peor de leer y mejor
de saber.

⚠️ **No hay una «vía barata» para ellos hoy**, ni la habrá por tener segmentos:
es B.195 (`B195_Via_Y_Catalogo.md`) — el plan preguntaba por el ORIGEN antes que por la estructura, y un
documento de la nube se va a `reprocesar` aunque `retrocear` lo repararía.

**La propiedad enriquecedora sigue viva, pero para los MANUALES**: un manual sin
segmentos sale de esta pasada con ellos, y desde entonces se repara desde casa
sin depender del proveedor. Es la vía por la que `new 9.txt` puede entrar **si es
manual** — y eso lo decide la consulta de `B195_Via_Y_Catalogo.md` §1, que sigue sin ejecutarse.

---

# 8 · DÓNDE SIGUE ESTO

Por qué vía se repara cada documento —B.195, el catálogo de versiones y B.196—
está en **`claude/B195_Via_Y_Catalogo.md`**. Salió de aquí el 07/09 porque este
fichero pasaba de 400 líneas.
