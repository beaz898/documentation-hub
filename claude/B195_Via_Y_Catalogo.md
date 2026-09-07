# B.195, el catálogo de versiones y B.196

**07/09/2026.** Salió de `Prueba_De_La_Reparacion.md`, que pasaba de 400 líneas.
Aquí vive todo lo de **por qué vía se repara un documento**: el defecto que lo
destapó, la política, el catálogo que la hace computable y la pregunta que queda
abierta.

# 1 · ⚠️ B.195 — EL PLAN PREFIERE LA REPARACIÓN COMPLETA A LA DISPONIBLE

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

# 2 · B.195 RESUELTO — la vía la decide tener segmentos, no de dónde viene

**07/09/2026.** Lo destapó RRHH-06 devolviendo 501 con `segments` a true, sello 2
y generación 2: un documento que el botón podía reparar y al que el sistema
mandaba a una vía que no existe.

## 2.1 · La política, tal como quedó escrita

> Si el documento tiene segmentos persistidos **y** lo que cambió desde su sello
> es solo el troceado, se repara por la vía barata. La condición es «tiene
> segmentos», no «de dónde viene».

Y donde estaba el problema: **la segunda mitad no era computable.** El sello es un
entero; de «2 → 3» no se deduce qué cambió. Sin eso, la política no se puede
escribir en código sin mentir.

## 2.2 · Lo que hizo falta, y lo que NO hizo falta

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

## 2.3 · El lector mentía en las DOS direcciones

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

## 2.4 · Y el plan pregunta en vez de deducir

`planDeReindexado` miraba el ESTADO —o sea, el origen— para decidir la vía. Ahora
mira la **anomalía**, que es la respuesta de quien decidió el criterio. Es la
misma corrección que R2 y el `groupId`: quien necesita algo pregunta a quien lo
decidió, no lo recalcula.

## 2.5 · ⚠️ B.196, ABIERTO EN EL MISMO COMMIT — el sello ya se escribe de más

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

## 2.6 · La verificación

**615 → 622 casos**, verdes, typecheck limpio. Siete mutaciones por mitades, **las
siete muertas**: la vía decidida por el origen, la función sin fallar cerrada, la
versión sin clasificar colándose, la anomalía callada, el plan mirando el estado,
la guarda de estructura siempre relajada y el rango vacío.

⚠️ **Predicción de población fallada otra vez, y al revés que ayer**: predije
630-645 —alto a propósito, porque ayer me quedé corto— y salieron 622. Van seis.

---

# 3 · EL CATÁLOGO: subir la versión sin declarar el cambio es IMPOSIBLE

**07/09/2026**, con las dos condiciones que se pidieron.

## 3.1 · ⚠️ UNA CORRECCIÓN DE PREMISA, ANTES DE NADA

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

## 3.2 · Condición 1 — en el código, no en un documento

`CAMBIOS_POR_VERSION` vive en `lib/chunking.ts`, **pegado al sello**, en la línea
por la que pasa quien sube la versión. No hay un documento paralelo que mantener.

## 3.3 · Condición 2 — subirla sin declarar el cambio FALLA

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

## 3.4 · ⚠️ LO QUE UNA MUTACIÓN OBLIGÓ A AÑADIR

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

## 3.5 · Y una guarda menos, otra vez por mutación

El ternario del catálogo vacío también sobrevivió, y también con razón: el bucle
arranca en `PRIMERA_VERSION_CATALOGADA` y no avanza si no hay nada, así que el
ternario devolvía siempre lo que ya había. **Rama sin diferencia observable, no
rama sin test.** Retirada, con el motivo escrito donde estaba.

Es el segundo caso del mismo día — el primero fue la guarda doble de
`arranqueEnFrontera`. Empieza a ser un patrón: **las guardas que escribo «por si
acaso» suelen ser no-ops, y las mutaciones son lo único que lo destapa.**

## 3.6 · La verificación

**622 → 628 casos**, verdes, typecheck limpio. Cinco mutaciones, **las cinco
muertas** tras añadir la guarda de fuente: el literal con el mismo valor, el
literal adelantado, el máximo que arrastra huecos, el arranque del bucle y la
retirada de una entrada del catálogo.

⚠️ **Y una falta de método que se anota**: esta vez **no escribí la predicción de
población antes de ejecutar**. La de comportamiento sí —«subir la versión sin
declarar el cambio deja de ser posible»— y la mutación la confirma; la de
población no existió, así que no se puede decir si habría acertado.
