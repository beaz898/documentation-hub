# Probar la reparación en producción, antes de tocar el cortador

**06/09/2026.** La razón de hacerlo ahora es correcta y conviene dejarla escrita:
**si se prueba después, un fallo no se puede atribuir.** Reparación y cortador
nuevo cambiarían a la vez, y el aislamiento se pierde.

---

# 0 · ⚠️ LA PROPIEDAD QUE HACE QUE ESTA PRUEBA VALGA: HOY ES UN NO-OP CONTROLADO

> ⚠️⚠️ **CADUCADO EL 07/09/2026, y se deja escrito en vez de borrarlo.** Esta
> sección describe la ventana en la que reparar no cambiaba nada — el cortador
> todavía no había cambiado. `fd30fc2f` la cerró. **Lo que hay que exigirle hoy
> a una reparación está en la §8**, y el criterio de aquí, aplicado tal cual,
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
`trozos.antes/ahora`, `reparacion_completa` y el `aviso` de que es media
reparación.

---

# 5 · QUÉ MIRAR DESPUÉS, con lo esperado y lo que significa cada desvío

Se repiten (a), (b), (c) y (d) con la **generación nueva**.

| qué | antes | esperado | si difiere |
|---|---|---|---|
| `active_generation` | N | **N+1** | la conmutación no llegó a la pata 2 |
| `chunk_count` y (b) | C | **C, igual** | ⚠️ **HALLAZGO**. Sigue valiendo DESPUÉS del cortador: la foto congelada dice que el número de piezas no cambió en ninguna de las cinco entradas |
| las huellas de (c) | lista | ⚠️ **YA NO son idénticas — ver §8** | invertido el 07/09/2026: con el cortador nuevo, la huella del trozo 1 se conserva y las siguientes SE MUEVEN. Que no se muevan es el hallazgo ahora |
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

# 7 · ⚠️ B.195 — EL PLAN PREFIERE LA REPARACIÓN COMPLETA A LA DISPONIBLE

**Encontrado el 07/09/2026, al subir el sello a 3 y preguntarse qué documentos
quedan reparables de verdad.**

`planDeReindexado` pregunta por el ORIGEN **antes** que por la estructura:

```
estadoDeReparacion → 'reparable_automaticamente'  →  via 'reprocesar'  →  501
```

Esa rama se decide con `source` + `provider_file_id`, y está **por encima** de
`puedePerderEstructura`. Consecuencia, que no estaba escrita en ningún sitio:

> **Tener los segmentos persistidos NO hace reparable a un documento de la nube.**
> Solo rescata a aquellos cuyo original no se puede recuperar — los manuales.

Un documento de OneDrive **con segmentos** se rechaza hoy con 501 aunque
`retrocear` lo repararía perfectamente: sus celdas están guardadas y
`chunkSegments` las vuelve a emitir tal cual. La vía existe y no se usa.

## La pregunta, que es lo que se registra — no la solución

**¿Debe el plan caer a `retrocear` cuando `reprocesar` no está implementado y el
documento tiene sus segmentos?**

Y la tensión que impide contestarla de un plumazo, que es justo por lo que se
escribe como pregunta:

· **A favor** — hoy el ÚNICO cambio pendiente es del CORTADOR, y `retrocear`
  repara exactamente eso. Rechazar con 501 deja sin reparar documentos que se
  podrían reparar hoy, con la estructura intacta.
· **En contra** — `reprocesar` repara también la EXTRACCIÓN. Una caída
  automática a `retrocear` sería correcta hoy y **silenciosamente incorrecta el
  día que cambie el extractor**: el documento saldría marcado «al día» habiendo
  reparado media cosa. Es la forma exacta de un lector que miente.

Si se implementa la caída, la condición no puede ser «reprocesar no está
disponible»: tiene que ser **«lo que cambió es el cortador»**, y eso hoy nadie lo
sabe decir — el sello es un número, no una firma de comportamiento (F-104).
**Ahí es donde vuelve a doler que no lo sea.**

## Y lo que decide AHORA MISMO

**Cuál es el control positivo de la primera reparación.** Si `new 9.txt` y
RRHH-06 entraron por OneDrive, los dos dan 501 y **hoy no hay control positivo**;
si son subidas manuales, la vía funciona. No se da por sabido: se mide.

```sql
select name, source, provider_file_id is not null as tiene_id,
       extractor_version, segments is not null as tiene_segmentos,
       length(full_text) as chars
from documents
where org_id = '<TU_ORG>'
  and (name ilike '%new 9%' or name ilike '%RRHH-06%');
```

**Cómo se lee, decidido antes de verlo:**
· `source` manual **y** `tiene_segmentos` → `retrocear`. Hay control positivo.
· `source` sincronizado **y** `tiene_id` → `reprocesar` → **501**, aunque tenga
  segmentos. No hay control positivo hoy, y B.195 pasa de apunte a bloqueo.
· `tiene_segmentos` falso → no es candidato de control: su reparación sería
  solo-prosa y no probaría lo que se quiere probar.

---

# 8 · ⚠️ EL CONTROL POSITIVO DESPUÉS DEL CORTADOR — la ventana de no-op está cerrada

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
es B.195 (§7) — el plan pregunta por el ORIGEN antes que por la estructura, y un
documento de la nube se va a `reprocesar` aunque `retrocear` lo repararía.

**La propiedad enriquecedora sigue viva, pero para los MANUALES**: un manual sin
segmentos sale de esta pasada con ellos, y desde entonces se repara desde casa
sin depender del proveedor. Es la vía por la que `new 9.txt` puede entrar **si es
manual** — y eso es lo que decide la consulta de §7, que sigue sin ejecutarse.

---

# 9 · B.195 RESUELTO — la vía la decide tener segmentos, no de dónde viene

**07/09/2026.** Lo destapó RRHH-06 devolviendo 501 con `segments` a true, sello 2
y generación 2: un documento que el botón podía reparar y al que el sistema
mandaba a una vía que no existe.

## 9.1 · La política, tal como quedó escrita

> Si el documento tiene segmentos persistidos **y** lo que cambió desde su sello
> es solo el troceado, se repara por la vía barata. La condición es «tiene
> segmentos», no «de dónde viene».

Y donde estaba el problema: **la segunda mitad no era computable.** El sello es un
entero; de «2 → 3» no se deduce qué cambió. Sin eso, la política no se puede
escribir en código sin mentir.

## 9.2 · Lo que hizo falta, y lo que NO hizo falta

**No hizo falta la firma de comportamiento** que F-104 promovió. Bastó un **mapa
declarado** —`CAMBIOS_POR_VERSION`, versión → `'troceado' | 'extraccion'`— escrito
en la misma línea que el sello, y `soloCambioElTroceado(sello, vigente)`.

⚠️ **Y la diferencia entre las dos cosas se dice, no se disimula:** una firma se
recalcula y se compara; **esto se cree**. Tiene el mismo punto débil que el número
—alguien tiene que acordarse— y por eso vive donde esa persona va a teclear, con
un caso que se pone rojo si se sube la versión sin clasificarla.

**La trampa se cierra sola**: la función **falla CERRADA**. Un sello ausente o una
versión que el mapa no clasifica devuelven `false`, y entonces no hay vía barata.
El día que una versión traiga `'extraccion'`, los documentos sellados por debajo
dejan de ser reparables por lo barato **sin que nadie tenga que acordarse de
nada** — se niega, en vez de sellar de más.

## 9.3 · El lector mentía en las DOS direcciones

Se pidió arreglar una mitad. Al abrirlo estaba la otra al lado:

| caso | decía | era |
|---|---|---|
| nube SIN segmentos | `reparable_automaticamente` | **501**: la vía no existe |
| **manual o nube CON segmentos** | `reparable_resubiendo` | **el botón lo repara hoy** |

La segunda manda a alguien a resubir a mano lo que se arregla solo. **Arreglar una
sola habría dejado el lector mintiendo**, así que las dos.

Los que necesitan el original y no lo tienen salen ahora como
`reparable_resubiendo` **con la anomalía `via_no_construida`** — estado por lo que
el usuario tiene que hacer hoy, anomalía porque **es deuda nuestra y no suya**, y
con contador, que es lo que esta casa hace con los límites que un lector no puede
callar.

## 9.4 · Y el plan pregunta en vez de deducir

`planDeReindexado` miraba el ESTADO —o sea, el origen— para decidir la vía. Ahora
mira la **anomalía**, que es la respuesta de quien decidió el criterio. Es la
misma corrección que R2 y el `groupId`: quien necesita algo pregunta a quien lo
decidió, no lo recalcula.

## 9.5 · ⚠️ B.196, ABIERTO EN EL MISMO COMMIT — el sello ya se escribe de más

**Y no lo introduce este cambio: existe desde antes y por el camino manual.**

`camposDePromocion` escribe `extractor_version: VIGENTE` en **toda** conmutación,
también tras un `retrocear`. Si algún día cambia la extracción, un re-troceado
sellaría **al día** un documento reparado a medias — y eso es exactamente el
«lector que miente» que el contrato del sello vino a prohibir.

Hoy no puede pasar: `soloCambioElTroceado` no concede la vía barata si no puede
afirmar que solo cambió el troceado. **La pregunta abierta es qué debe escribir el
sello cuando la reparación es parcial**, y tiene su propia tensión:

· **No avanzarlo** deja el documento pidiendo reparación para siempre, porque el
  troceado ya está bien y volver a repararlo no cambia nada.
· **Avanzarlo** afirma más de lo que se hizo.

La tercera salida —dos sellos, uno de extracción y otro de troceado— es más
honesta y es un cambio de esquema. **Se registra la pregunta, no la solución.**

## 9.6 · La verificación

**615 → 622 casos**, verdes, typecheck limpio. Siete mutaciones por mitades, **las
siete muertas**: la vía decidida por el origen, la función sin fallar cerrada, la
versión sin clasificar colándose, la anomalía callada, el plan mirando el estado,
la guarda de estructura siempre relajada y el rango vacío.

⚠️ **Predicción de población fallada otra vez, y al revés que ayer**: predije
630-645 —alto a propósito, porque ayer me quedé corto— y salieron 622. Van seis.

---

# 10 · EL CATÁLOGO: subir la versión sin declarar el cambio es IMPOSIBLE

**07/09/2026**, con las dos condiciones que se pidieron.

## 10.1 · ⚠️ UNA CORRECCIÓN DE PREMISA, ANTES DE NADA

Quedó dicho que «el sello ya sabe distinguirlos porque el extractor y el
troceador comparten número». **Es al revés, y la diferencia decide si el
catálogo puede retirarse algún día:**

> **Compartir número es exactamente por lo que el sello NO puede distinguirlos.**
> De «2 → 3» no se deduce si cambió el troceado o la extracción — el número es el
> mismo para las dos cosas. **Lo que los distingue es el catálogo**, que es una
> columna nueva, no una lectura más fina del número.

Lo que sí es cierto es lo otro: **no hace falta la firma de comportamiento**. La
firma se recalcula y se compara; el catálogo se declara y se cree. Es más barato
y basta para esta decisión — pero **es lo único que sostiene la distinción**. El
día que alguien retire el catálogo, `soloCambioElTroceado` se queda sin con qué
contestar y hay que volver a la firma.

## 10.2 · Condición 1 — en el código, no en un documento

`CAMBIOS_POR_VERSION` vive en `lib/chunking.ts`, **pegado al sello**, en la línea
por la que pasa quien sube la versión. No hay un documento paralelo que mantener.

## 10.3 · Condición 2 — subirla sin declarar el cambio FALLA

Y se cumple por una vía más fuerte que un aviso: **no hay número que subir.**

```ts
export const EXTRACTOR_VERSION = versionDelCatalogo(CAMBIOS_POR_VERSION);
```

La versión vigente **es la última entrada del catálogo**. Subirla es añadir una
línea, y esa línea obliga a escribir `'troceado'` o `'extraccion'`. No está
vigilado: es imposible.

⚠️ **Y un hueco no arrastra la vigente detrás de él.** Si alguien escribe `10` de
un dedazo, la vigente no salta a 10 — saltar marcaría todo el parque como
desactualizado de golpe y mandaría a reparar de balde a un corpus sano. Se ignora
lo que hay más allá del hueco, y un caso lo denuncia.

## 10.4 · ⚠️ LO QUE UNA MUTACIÓN OBLIGÓ A AÑADIR

Sustituir la derivación por el literal `3` —el estado de ayer— **sobrevivió a los
627 casos**. Con razón: hoy los dos valen lo mismo, así que **ningún caso que
mire el VALOR puede distinguirlos**.

Y eso no es un detalle: lo que hay que impedir no es que el número esté mal hoy,
sino que **vuelva a poder moverse sin tocar el catálogo** — que es exactamente
como el sello se quedó atrás el 24/08.

Lo que no se puede comprobar por el valor se comprueba por la **FUENTE**: un caso
lee `lib/chunking.ts` y exige que la asignación contenga
`versionDelCatalogo(CAMBIOS_POR_VERSION)`. Es el mismo mecanismo de
`sello-en-cada-escritura.test.ts`, y nace de la misma necesidad — vigilar una
propiedad del código y no de un resultado.

## 10.5 · Y una guarda menos, otra vez por mutación

El ternario del catálogo vacío también sobrevivió, y también con razón: el bucle
arranca en `PRIMERA_VERSION_CATALOGADA` y no avanza si no hay nada, así que el
ternario devolvía siempre lo que ya había. **Rama sin diferencia observable, no
rama sin test.** Retirada, con el motivo escrito donde estaba.

Es el segundo caso del mismo día — el primero fue la guarda doble de
`arranqueEnFrontera`. Empieza a ser un patrón: **las guardas que escribo «por si
acaso» suelen ser no-ops, y las mutaciones son lo único que lo destapa.**

## 10.6 · La verificación

**622 → 628 casos**, verdes, typecheck limpio. Cinco mutaciones, **las cinco
muertas** tras añadir la guarda de fuente: el literal con el mismo valor, el
literal adelantado, el máximo que arrastra huecos, el arranque del bucle y la
retirada de una entrada del catálogo.

⚠️ **Y una falta de método que se anota**: esta vez **no escribí la predicción de
población antes de ejecutar**. La de comportamiento sí —«subir la versión sin
declarar el cambio deja de ser posible»— y la mutación la confirma; la de
población no existió, así que no se puede decir si habría acertado.
