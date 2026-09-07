# Probar la reparación en producción, antes de tocar el cortador

**06/09/2026.** La razón de hacerlo ahora es correcta y conviene dejarla escrita:
**si se prueba después, un fallo no se puede atribuir.** Reparación y cortador
nuevo cambiarían a la vez, y el aislamiento se pierde.

---

# 0 · ⚠️ LA PROPIEDAD QUE HACE QUE ESTA PRUEBA VALGA: HOY ES UN NO-OP CONTROLADO

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
| `chunk_count` y (b) | C | **C, igual** | ⚠️ **HALLAZGO**: el cortador no ha cambiado, no debería repartir distinto |
| las huellas de (c) | lista | **idénticas, en el mismo orden** | ⚠️ **HALLAZGO**, y el más importante de la prueba |
| `extractor_version` | NULL o 1 | **2** (la vigente) | el sello no se escribió: mira el caso que lo vigila |
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
