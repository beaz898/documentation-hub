# Incidencia con Pinecone — registros borrados que las consultas siguen devolviendo

*Abierta el 22/09/2026. Origen: F-115 (`claude/consultas-fable/F-115.md`).*

## Qué es esta carpeta

**Incidencias abiertas con un proveedor externo**, con el texto que se le envía y lo
que se sabía al enviarlo. No es el archivo de consultas a Fable —eso es
jurisprudencia interna— ni una ficha de estado: es **la copia de lo que salió de
esta casa hacia fuera**, para que el día que el proveedor conteste se pueda leer
qué se le preguntó exactamente.

⚠️ **EL TEXTO DE ABAJO ESTÁ PARA COPIAR Y PEGAR, y no lleva ni un marcador sin
rellenar.** Lo que no se sabe no va como hueco: va dicho como no sabido, o no va.

---

## Qué NO va en el ticket, y por qué

Se retiraron tres cosas de un borrador anterior, todas por el mismo motivo —afirmaban
capacidades que esta casa no tiene:

- **«estamos corriendo una sonda horaria de sólo lectura»** — **no existe.** Fable la
  propuso en F-115 P3 y no se ha escrito ni una línea de ella.
- **«podemos reproducirlo cuando quieras»** — **no podemos.** El fenómeno es
  intermitente: la misma consulta dio ausente a las ~14:10 y presente a las ~15:18 del
  21/09, sin que nada cambiara en medio.
- **tipo de índice, nube, región y métrica** — **no los tenemos.** El índice se creó a
  mano y no hay ninguna llamada a `createIndex` en el repositorio; el director no
  localiza el índice en su consola. Se retiran las líneas enteras en vez de dejar
  marcadores: un ticket con `<región?>` dentro es un ticket que nadie ha revisado.

---

## Lo que respalda cada afirmación del ticket

| Afirmación | Respaldo |
|---|---|
| El borrado se hizo con la función normal de la aplicación | Confirmado por el director el 22/09/2026. El botón llama a `DELETE /api/documents?id=`, que ejecuta `deleteDocument(..., reason: 'user_excluded')` — `app/api/documents/route.ts:61-66` |
| Se emiten DOS `deleteMany`, por filtro y por ids | `lib/delete-document.ts:185` (filtro) → `lib/pinecone/vectors.ts:209-215`; `lib/delete-document.ts:197-199` (ids) → `lib/pinecone/vectors.ts:176-190` |
| Al menos una de las dos fue aceptada | `lib/delete-document.ts:206` (`filterOk \|\| idsOk`) y el cerrojo de `:241-246`, que devuelve sin borrar la fila si las dos fallan. La fila se borra después, en `:249-258`. **La fila no existe ⇒ se pasó el cerrojo** |
| El limpiador de huérfanos no se usó | Confirmado por el director el 22/09/2026 |
| La consulta de producción | `lib/pinecone/vectors.ts:128-147`, con `topK` 25 por consulta (`lib/analysis/retrieval.ts:138`, `:264`) y filtro `{ analysisStatus: { $eq: 'analizado' } }` (`lib/pinecone/vectors.ts:99`) |
| El listado exhaustivo | `lib/pinecone/vectors.ts:310` — `listPaginated` por prefijo de id, paginado hasta agotar, todo-o-excepción |
| El recuento del namespace | `lib/pinecone/vectors.ts:287` — `describeIndexStats()` |
| Los 6 ids son de generación 1 | `buildVectorId` (`lib/pinecone/vectors.ts:352-356`): sin marca `-g{N}-` es generación 1. Los ids observados son `…-0` a `…-5` |
| Ningún camino nuestro pudo escribirlos | Los cuatro `upsertVectors` del repositorio sacan el `documentId` de un uuid nuevo o de una fila de `documents`; la fila no existe. Censo del 22/09/2026, en la respuesta al ENCARGO del censo para la defensa |

⚠️ **LA SALVEDAD DEL CERROJO, y va en el ticket porque es parte del dato**: el cerrojo
entró en `602c95f3` (14/09/2026, 19:29:39 UTC). El documento se seguía analizando a las
20:30 UTC de ese mismo día, así que **el borrado es posterior al cerrojo en el código**.
Lo que no se puede confirmar es **qué build estaba desplegado** en el momento exacto del
borrado, porque no tenemos su hora (ver la ficha del registro que falta).

⚠️ **Y LA SEGUNDA SALVEDAD**: la vía de ids sólo corre si `chunk_count > 0`
(`lib/delete-document.ts:192`). No se puede comprobar el `chunk_count` de este documento
porque su fila ya no existe. De ahí que el ticket diga «al menos una de las dos» y no
«las dos».

---

## Versión corta preparada — la que se enviaría

**Es la versión buena**, y la que hay que coger si esto se retoma. Nació de recortar la
larga y **corregir una afirmación que la larga tenía mal** (ver la errata de abajo).

```
Subject: Deleted vectors still returned by query() after an accepted delete

Index: documentation-hub
Namespace: 5a82712f-6740-4792-b291-3fdea8e6edb1
SDK: @pinecone-database/pinecone 4.1.0 (Node.js), dimension 1024,
multilingual-e5-large

We deleted a document through our app. That issues deleteMany by metadata filter
({ documentId: { $eq: "c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6" } }) and deleteMany
by its explicit IDs. At least one of the two was accepted without error. The
deletion happened between 2026-09-14 20:30 and 2026-09-21 15:18 UTC (exact time
unknown).

Affected IDs:
c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-0 to c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-5

We made no write of any kind to these IDs. Every code path in our application that
can write vectors derives the document ID either from a freshly generated UUID or
from a row in our database, and that row no longer exists.

What we observed (UTC):
- 2026-09-21 12:18: a production query did NOT return these IDs.
- 2026-09-21 ~14:10: a read-only census queried every stored vector of three
  documents against the whole namespace, topK=1000, NO metadata filter. These IDs
  were NOT returned.
- 2026-09-21 ~15:18: the census was extended to all 680 vectors of all 41
  documents, same topK=1000 and no filter. These IDs WERE returned, as neighbours
  of 3 of the 41 documents, 6 scores each, max 0.866.
  >>> One of those 3 documents had already been queried in the ~14:10 run, with
  >>> the same query vectors and the same parameters, and had not seen these IDs.
  >>> Same queries, about an hour apart: absent, then present.
- 2026-09-21 16:28: a production query returned them, with metadata. This result
  changed the output our user received.
- 2026-09-21 ~17:09: listPaginated with the prefix
  "c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-" returned 0 IDs, and describeIndexStats
  reported 680 records, matching our own count exactly.
- 2026-09-22 09:01: a production query returned the same 6 IDs again.

Every line above is a point observation. We do not know what the index returned
between them.

Questions:
1. Can query() return records days after an accepted delete, while listPaginated
   and describeIndexStats no longer see them? Is this a known issue?
2. How can we force a permanent purge of these records, and which read should we
   trust to verify it?
3. Is there an upper bound on how long a deleted record can still be returned by
   query()? We need it for our data-deletion policy.

We can provide more detail or logs if useful.
```

### Por qué la corta dice lo que dice

- **El par de Facturacion (~14:10 / ~15:18)** va con su matiz explícito. La redacción
  «the same queries with the same parameters» a secas **era falsa**: a las 14:10 se
  consultaron tres documentos y a las 15:18 los cuarenta y uno. Lo cierto y más fuerte
  es que **uno de los tres se repitió** con los mismos vectores de consulta y cambió de
  resultado. Dicho mal, el proveedor lo tumba con «corristeis un censo distinto».
- **El «NO metadata filter»** cierra la primera objeción previsible. Comprobado:
  `filtroDeLaBusqueda` sólo se construye con `?poblacion=real`
  (`app/api/admin/vecindario/route.ts:245`, `:255`). Con `topK=1000` sobre 680 registros,
  **nada pudo excluirlos ni desplazarlos**.
- **El par 12:18 / 16:28** añade una ausencia y una presencia **en el camino de
  producción**, no sólo en el censo.
- **«We made no write of any kind»** mata la pregunta que un proveedor hace siempre
  («¿no habréis hecho upsert?») y ahorra una vuelta entera.
- **«This result changed the output our user received»** es lo único que convierte esto
  en incidente y no en curiosidad.

---

## Borrador largo — NO usar sin corregir la errata

⚠️ **ERRATA, y es de hecho, no de estilo**: este borrador dice **«deleted at least 7
days earlier»** y **«certainly after seven days»**. **Las dos son falsas.** El borrado
ocurrió entre las **20:30 UTC del 14/09** y las **15:18 UTC del 21/09**, y la hora exacta
no se conoce (ficha B.259): el intervalo puede ser de menos de un día. Afirmar «siete
días» es exactamente la clase de cifra que esta casa persigue — **una cota presentada
como medida**. La versión corta no la tiene.

Se conserva entero porque trae contexto que la corta no lleva —el esquema de ids, el
detalle del cerrojo del borrado, la lista de lo descartado— y eso vale si el proveedor
pide más.

```
Subject: Deleted records returned by query intermittently for days, while list
and describeIndexStats report them absent

SUMMARY
A document's 6 vectors were deleted at least 7 days earlier, are absent from both
listPaginated (prefix listing) and describeIndexStats, and yet were returned by
query() on two different days, with metadata and scores up to 0.866.

ENVIRONMENT
- Index name: documentation-hub
- Namespace affected: 5a82712f-6740-4792-b291-3fdea8e6edb1
- Dimension: 1024
- Embedding model: multilingual-e5-large, via Pinecone Inference
  (inputType 'passage' for indexing, 'query' for search), truncate 'END'
- SDK: @pinecone-database/pinecone 4.1.0 (Node.js)
- Callers: Next.js on Vercel (serverless functions) and a Node worker on Railway
- Every call we make is scoped with .namespace(orgId). All evidence below comes
  from the single namespace above.

THE RECORDS
6 vector IDs, all belonging to one document:
  c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-0
  c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-1
  c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-2
  c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-3
  c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-4
  c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-5
Our ID scheme is "<documentId>-<chunkIndex>" for the first version of a document,
and "<documentId>-g<generation>-<chunkIndex>" after a re-index. These six carry no
generation marker, so they are the six original chunks of document
c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6 as first indexed.

HOW THE DELETE WAS ISSUED
The document was deleted by a user through the normal "delete document" action in
our application. Our orphan-vector cleanup tool was NOT used at any point.

That path always issues two deletes, in this order, both scoped to the namespace:
  1) deleteMany({ documentId: { $eq: "c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6" } })
  2) deleteMany([ ...the six explicit IDs above... ])
and then, and ONLY then, deletes the document's row in our own database. The code
returns early and leaves the row in place if BOTH deletes throw. The row is gone,
so at least one of the two deletes returned without error - i.e. was accepted.

Two honest caveats about that inference:
- Delete (2) runs only when our stored chunk count is greater than zero. We can no
  longer read that value, because the row it lived in is the one that was deleted.
  So we can assert "at least one of the two", not "both".
- The guard that ties the row deletion to the vector deletion has been in our code
  since 2026-09-14 19:29 UTC, which is earlier than any possible deletion time for
  this document (it was still being analysed at 20:30 UTC that day). We cannot
  confirm which build was live at the exact moment, because we do not have the
  deletion timestamp - our delete path logs only on failure. That is our gap, and
  we are fixing it.

TIMELINE (all times UTC)
- 2026-09-14, up to 20:30 - last normal use of the document: 12 analyses ran
  against it, all in the namespace above. Nothing unusual.
- Between 2026-09-14 20:30 and 2026-09-21 15:18 - the document was deleted, as
  described above. EXACT TIME UNKNOWN.
- 2026-09-21, 12:18 - a production analysis request (topK=25 per query, filter
  { analysisStatus: { $eq: "analizado" } }) returned 2 candidate documents. This
  document did NOT appear.
- 2026-09-21, ~14:10 - a read-only census issued one query() per stored vector of
  three separate documents ("MKT-01", "new 12", "Facturacion") against the whole
  namespace, with topK=1000 - well above the 680 records the namespace holds. For
  each of the three, the number of neighbours returned was exactly
  (number of queries) x (680 - own vectors). This document did NOT appear in any
  of the three.
- 2026-09-21, ~15:18 - the same census, now run over all 680 vectors of all 41
  documents, same topK=1000. This document DID appear, as a neighbour of 3 of the
  41 documents, contributing 6 extra scores to each, maximum 0.866. In the other
  38 it did not appear.
  >>> One of those 3 is "Facturacion", which had been queried in the ~14:10 run
  >>> with the same parameters and had NOT seen this document. Same queries, same
  >>> topK, same namespace, roughly one hour apart: absent, then present.
- 2026-09-21, 16:28 - a production analysis request returned 6 fragments of this
  document, scores 0.805-0.827, with their text and their original filename in the
  metadata. This CHANGED the output our user received: a different document was
  selected as a result.
- 2026-09-21, ~17:09 - two read-only checks, minutes apart:
    * listPaginated({ prefix: "c701c9dd-1f28-4a3c-8c0c-65ee3b2ffec6-" }), paged to
      exhaustion -> 0 IDs.
    * describeIndexStats() -> 680 records in this namespace, which matches our own
      database exactly (680 recorded chunks across the 41 live documents). No
      surplus of any kind.
- 2026-09-22, 09:01 - a production analysis request returned the SAME 6 vectors
  again, by the six IDs listed above. This time a guard we had just deployed
  discarded them before they reached the user, and recorded their IDs, which is how
  we have the exact list.

⚠️ WE ONLY LOOKED AT THOSE MOMENTS. Every line above is a point observation. We do
not know what the index returned between them, and we are not claiming the records
were continuously present or continuously absent. What we can say is that at 12:18
and ~14:10 on 21/09 they were not returned, at ~15:18 and 16:28 on 21/09 and at
09:01 on 22/09 they were, and at ~17:09 on 21/09 neither the prefix listing nor the
stats saw them.

WHAT WE EXPECTED vs WHAT WE SAW
Expected: after an accepted delete - and certainly after seven days - query() stops
returning those records. That is consistent with your documentation, which describes
eventual consistency with a slight delay before a change is reflected in queries.
Saw: absent -> present -> present -> (absent from list and stats) -> present, spread
over two days. A delayed delete would be present -> absent, once. And during the same
window, three read paths of the same index disagreed with each other: query()
returned the records, listPaginated returned nothing for their ID prefix, and
describeIndexStats counted a namespace total with no surplus.

WHAT WE HAVE RULED OUT ON OUR SIDE
- No write of any kind to these IDs. All four code paths in our application that can
  write vectors derive the document ID either from a freshly generated UUID or from a
  row in our database - and the row for this document no longer exists, so none of
  them can produce this document ID. We can supply our application logs for the
  window.
- Not a stale or malformed ID problem: the six IDs follow our standard scheme and
  correspond exactly to the document's six original chunks. They are the IDs that
  delete (2) targeted.
- Not our cleanup tool: it was not used.
- Not a different namespace or index: see ENVIRONMENT.

QUESTIONS
1. Can the query path serve records that were deleted days earlier - that is, is
   there a read replica, cache or index segment that can still be served after a
   delete has been accepted, and after listPaginated and describeIndexStats no
   longer see the records?
2. Is this a known issue? If so, from which service or SDK version, and is there a
   fix or a workaround?
3. How can we force these records to be purged for good, and how can we VERIFY the
   purge? In our case listPaginated and describeIndexStats both already reported
   them gone while query() kept returning them, so we do not know which read to
   trust as authoritative. Please tell us which one is.
4. Is there a documented upper bound on how long a deleted record can still be
   returned by query()? We need a figure we can put in our own data-deletion policy:
   our customers' erasure requests flow down to us, and "deleted" has to mean
   deleted in the read path too, or we cannot state a retention period.
5. If you need request-level identifiers to trace this, tell us which ones and where
   the SDK exposes them. We will add the capture and follow up with them.

We cannot reproduce this on demand: it is intermittent, and the clearest evidence we
have of that is the ~14:10 / ~15:18 pair above, where the same queries with the same
parameters disagreed about the same records about an hour apart.
```

---

## Estado

**NO ENVIADO — decisión del director, 22/09/2026. Se retoma si un cliente pide
garantías sobre el borrado real de sus datos.**

Las dos razones, tal como las dio: **la defensa ya protege al usuario** —`Vivos(org)`
descarta el fantasma antes de puntuar, en los cuatro caminos (`ea6e818d`)— y **con el
plan gratuito no hay soporte garantizado**, así que el ticket podría no tener lector.

⚠️ **LO QUE ESTA DECISIÓN NO DICE, y conviene que no se lea de más**: no dice que el
fenómeno esté explicado ni resuelto. **El proveedor puede seguir sirviendo registros
borrados**, y lo único que ha cambiado es que ya no llegan al usuario. La ficha B.262
de `claude/Estado_Del_MVP.md` es su casa viva; esto es sólo el archivo del texto.

⚠️ **Y EL DISPARADOR ESTÁ ESCRITO, para que no dependa de que alguien se acuerde**: el
día que un cliente pregunte cuánto tarda en borrarse de verdad su documentación —o lo
exija un contrato—, esto se retoma. Entonces la pregunta 4 del borrador largo deja de
ser curiosidad y pasa a ser la que hay que poder contestar por escrito.
