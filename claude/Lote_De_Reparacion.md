# El lote de reparación — reparar de N en N, sin cola

**07/09/2026.** La versión mínima que pidió el usuario: ocho por llamada,
relanzable, que diga cuántos quedan, y que **un documento malo no bloquee a los
demás**.

---

# 1 · QUÉ ES Y QUÉ NO ES

**No es una cola.** No hay estado de fondo, ni trabajo diferido, ni nada
corriendo cuando la respuesta llega. Es un bucle síncrono sobre la reparación de
siempre, con dos límites y sus contadores, que se vuelve a pulsar hasta que
`hay_mas` sea falso. La cola es otro frente y está fuera del MVP.

**No es un mecanismo nuevo.** Llama a `repararDocumento` — la misma función que
usa la ruta de uno. Si el lote y la ruta individual pudieran reparar distinto,
habría dos implementaciones del mismo criterio.

Eso obligó a **extraer** el trabajo del `POST` de `/api/admin/reindexar` a
`lib/documents/reparar.ts`. La ruta de uno es hoy la traducción a HTTP y nada
más, y **su contrato no ha cambiado**: mismos códigos, mismos campos, mismo
aviso. El bucle de consola de `Prueba_De_La_Reparacion.md` §4 sigue valiendo.

---

# 2 · CÓMO SE LLAMA

```js
await (await fetch('/api/admin/reindexar-lote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ limite: 8 }),
})).json()
```

`limite` se puede **bajar**, nunca subir: el techo es del servidor. Se vuelve a
pulsar mientras `hay_mas` sea `true`.

---

# 3 · CUÁNTOS QUEDAN — tres números, no uno

Es la cifra por la que se pidió el lote («para saber cuándo parar»), y tiene
mitades que se comportan al revés:

| campo | qué es | ¿baja pulsando? |
|---|---|---|
| `para_reintentar` | los que **fallaron** en esta llamada | **sí** |
| `sin_examinar` | los que esta llamada ni miró; composición **desconocida** | **sí** |
| `bloqueados_totales` | los que el sistema decidió no intentar, y sabe por qué | ⚠️ **NO** |
| `hay_mas` | `para_reintentar + sin_examinar > 0` | es lo único que hay que mirar |

⚠️ **Sumar los bloqueados a los pendientes daría un botón que no termina nunca.**
Los de la nube SIN segmentos (501) y los `.xlsx` sin original van a salir
bloqueados en cada llamada, para siempre, hasta que exista otra vía. Contarlos como pendientes es la
forma exacta de un contador que jamás llega a cero.

---

# 4 · LOS DOS LÍMITES, CON SU CONTADOR

`parada` dice por qué se dejó de trabajar, y es el contador de ambos:

| `parada` | significa |
|---|---|
| `limite` | se hicieron las ocho. **El caso normal.** Vuelve a pulsar |
| `tiempo` | no quedaba margen para empezar otra ⚠️ si sale, el margen se quedó corto: **baja el límite, no subas el presupuesto** |
| `examen` | se miraron 60 candidatos sin gastar las plazas: casi todo bloqueado |
| `corpus` | se acabaron los candidatos |

⚠️ **El presupuesto de tiempo es una ESTIMACIÓN, no una medida**, y va declarado
como tal en el código. La función tiene 300 s; a partir de **180 s no se EMPIEZA**
una reparación nueva, y los 120 restantes son el margen de la que esté en vuelo —
que no se puede interrumpir. El margen sale del peor caso conocido de una de sus
partes: la política de reintentos de embeddings gasta **61 s solo en esperas por
lote de 20 trozos** ante un 429 sostenido.

**La primera pasada convierte la estimación en cifra**: cada reparación imprime
sus `ms` y sus embeddings, y ahora también viajan en la respuesta.

---

# 5 · ⚠️ LA REGLA QUE HACE QUE EL LOTE CONVERJA

**Solo un intento real gasta plaza.** Un rechazo se clasifica y el bucle sigue
caminando.

Sin esa regla el lote **no converge**: la lista va ordenada por nombre, así que si
los ocho primeros candidatos son rechazables —un `.xlsx` sin original, uno de la
nube que responde 501— cada llamada devolvería los mismos ocho rechazos, cero
reparaciones, y el usuario pulsaría para siempre sin llegar nunca a los buenos.
**Un botón que no termina se parece mucho, desde fuera, a uno lento.**

Y la mitad contraria, que parece contraintuitiva: **un fallo SÍ gasta plaza**. La
plaza mide TIEMPO, no éxito — una reparación que revienta después de generar los
embeddings ha gastado el rato igual. Contarla gratis dejaría a un documento roto
capaz de consumir la función entera a base de fallar barato.

---

# 6 · UN DOCUMENTO MALO NO PARA A LOS DEMÁS

Era el requisito explícito, y **no se resuelve con un `try` alrededor del bucle**:
se resuelve porque `repararDocumento` **no lanza**. Su red cubre desde la primera
lectura y todos sus finales caben en el tipo de retorno.

⚠️ Esa red se movió hoy: hasta ahora el `try` se abría **después** del plan, así
que un fallo de red en las lecturas previas salía como excepción. Con una petición
por documento eso era un 500 y se acabó; **en un lote habría tumbado a los siete
siguientes.**

---

# 7 · LO QUE SE PUEDE COMPROBAR Y LO QUE NO

La ruta habla con Supabase y con Pinecone: queda fuera del alcance de la batería
(sin mocks, por la regla de la casa). Por eso **el reparto del cupo vive aparte**
en `lib/documents/lote.ts`, que es aritmética pura y se prueba entera — 19 casos.

Ocho mutaciones por mitades, **las ocho muertas**, cada una en el caso que le
toca: el rechazo que gasta plaza, el fallo disfrazado de bloqueo, el orden de las
guardas invertido, el off-by-one del límite, los bloqueados contados como
pendientes, la cifra negativa, el presupuesto sin margen y el motivo aplanado.

⚠️ **Y una predicción fallada, que se cuenta**: predije 12-16 casos nuevos y
salieron **19**. Es la quinta vez que una predicción de población falla por
defecto o por exceso; ninguna ha fallado nunca por más de un puñado, pero el
patrón ya es que **estimo la población peor de lo que estimo el comportamiento**.

---

# 8 · LO QUE ESTE LOTE NO HACE, declarado

· **De la nube, repara los que tengan SEGMENTOS y no los demás** — corregido el
  07/09 con B.195: la vía la decide tener la estructura guardada, no el origen.
  Los que no los tienen salen bloqueados con `reprocesar_no_implementado`, y el
  lector los marca con la anomalía `via_no_construida` porque son deuda nuestra.
· **No mira el cerrojo por documento**, solo al principio. Si alguien empieza a
  subir a mitad, el lote termina lo que tenía empezado y la siguiente llamada se
  rechaza limpia con 423.
· **No tiene botón.** Se dispara desde la consola, como la ruta de uno. La
  pantalla de administración es otra cosa y no viaja con esto.
· **No sabe cuánto tarda una reparación.** Nadie lo sabe todavía: es lo que la
  primera pasada va a medir.
