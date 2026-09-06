# El montaje de la foto de prosa — tres pares, y por qué ha fallado dos veces

**06/09/2026.** Antes de las pasadas, la mecánica exacta. Y empieza por una
corrección: **el montaje es más fácil de lo que sugería la maniobra del 04/09.**

---

# 1 · ⚠️ LA REGLA MECÁNICA, verificada en el código

Un documento participa en una recuperación **por una de dos vías, y solo dos**:

| vía | cómo se activa | dónde se decide |
|---|---|---|
| **PERTENENCIA** | sus **VECTORES** dicen `analysisStatus: 'analizado'` | `CORPUS_ACTIVO` (`pinecone/vectors.ts:98`) |
| **NOMINACIÓN** | su id va en `batchDocumentIds` | `buildCorpusFilter` (`:110`) |

**Y `batchDocumentIds` es LA SELECCIÓN, no la bandeja entera.** La página pasa
`selectedDocs` (`review/page.tsx:248-251`) y el bucle nomina «los otros
seleccionados» (`useReviewAnalysis.ts:126`).

> **Un documento que está en la bandeja y NO se selecciona, no participa.**

Eso quita la parte cara del montaje: **no hay que borrar el resto del corpus.**
Basta con no seleccionarlo.

---

# 2 · ⚠️ POR QUÉ FALLÓ DOS VECES, Y LO QUE HAY QUE VIGILAR

El fallo del 03/09 —25 y 17 donde debían salir 15— fue un tercero
(`SIEMBRA_corpus_ampliado.md`) **en `analizado` y con vectores**. Entró por
PERTENENCIA, sin que nadie lo seleccionara y sin aparecer en ninguna decisión.

⚠️ **Y aquí está la trampa que hay que evitar esta vez: el filtro mira los
VECTORES, no la fila.** Un `UPDATE` a mano en Supabase que ponga la fila en
`pendiente` **deja los vectores diciendo `analizado`**, y ese documento sigue
participando — invisible en la bandeja, presente en la recuperación. Es la peor
combinación posible: parece montado y no lo está.

**La comprobación existe y es de solo lectura** (B.6):

```
GET /api/admin/diagnose-vectors?names=NOR-11_...,CLI-13_...,NOR-10_...,CLI-12_...,CLI-03_...,NOR-01_...
```

Compara `analysis_status` de Supabase contra `analysisStatus` real de Pinecone,
documento a documento. **Se ejecuta antes de cada pasada**, y lo que se busca es
que **ningún documento del corpus tenga los vectores en `analizado`**.

---

# 3 · EL MONTAJE, y una decisión que hay que tomar antes

Los tres pares son prosa y están documentados en `claude/Casos_Harness.md`:
**CLI-03 (.txt) / NOR-01 (.pdf)**, **NOR-11 / CLI-13 (.docx)** —el caso de control
de superficies— y **NOR-10 / CLI-12 (.docx)** —el corpus ampliado—.

⚠️ **«Una dirección cada uno» no sale gratis desde la bandeja**, y conviene saberlo
antes: el bucle analiza **cada documento seleccionado**. Si seleccionas los dos del
par, se analizan **los dos** — dos direcciones, dos cobros.

Hay dos montajes y no son equivalentes:

## (i) LOS DOS SELECCIONADOS — nada en `analizado`

- **Corpus**: cero documentos con vectores en `analizado`.
- **Bandeja**: da igual lo que haya.
- **Selección**: los dos del par.
- **Sale**: las dos direcciones. **6 análisis** en total para los tres pares.
- **Coste**: 6 × 5 = **30 créditos en rápido**; 6 × 30 = 180 brutos en exhaustivo.
- ✅ **Aislamiento perfecto y REPETIBLE**: el montaje no cambia entre pares, así
  que la pasada 3 se monta igual que la 1.

## (ii) UNO EN `analizado` — una sola dirección

- El compañero se marca `analizado` con **«marcar analizado» de la bandeja**, que
  actualiza vectores y fila en el orden correcto (F-96 P4). Nunca con SQL a mano.
- **Selección**: solo el documento a analizar.
- **Sale**: una dirección. **3 análisis**, 15 créditos en rápido.
- ⚠️ **Y aquí está el problema: `analizado` es de ida y no de vuelta.** No existe
  ningún camino —ni interfaz ni endpoint— que devuelva un documento a `pendiente`:
  el único escritor de `'pendiente'` es el sync de Drive. Así que el compañero del
  par 1 **sigue en `analizado` durante los pares 2 y 3**, participando por
  pertenencia y contaminando las dos pasadas siguientes.
  Se sale borrando y resubiendo entre pares, que es más manipulación —y más
  riesgo— que el ahorro de crédito.

**Yo iría con (i)**, y la razón no es el aislamiento —los dos aíslan la primera
pasada— sino que **(i) se monta igual las tres veces y (ii) no**. Un montaje que
cambia entre pasadas es el que ya nos ha costado dos veces. Pero son 30 créditos
en rápido contra 15, y la decisión es tuya.

---

# 4 · LA PASADA, paso a paso (montaje (i), modo rápido)

```
ANTES DE CADA PASADA
  1. GET /api/admin/diagnose-vectors?names=<los seis>
     → ninguno con analysisStatus 'analizado' en Pinecone.
     Si alguno lo está, NO se sigue: se resuelve primero.
  2. Bandeja abierta, los seis visibles.

LA PASADA
  3. Seleccionar SOLO los dos del par.
  4. Analizar (rápido).
  5. Repetir con el par siguiente. El montaje no cambia.
```

⚠️ **Y lo que NO hay que hacer entre pasadas**: marcar nada como analizado,
resubir nada, ni tocar filas a mano. Cada gesto entre pasadas es una variable más
que después no se puede separar del resultado.

---

# 5 · QUÉ SE LEE DESPUÉS — DE LA TABLA, no del log

```sql
SELECT created_at, document_name, analysis_type,
       contradictions_found, contradictions_confirmed,
       minor_inconsistencies_found, duplicates_found, overlaps_found,
       involved_documents, pipeline_counters
FROM analysis_results
WHERE org_id = '<tu org_id>'
  AND created_at > '<justo antes de la primera pasada>'
ORDER BY created_at;
```

De cada fila se apunta: **el par, la dirección** (`document_name` es el analizado,
`involved_documents` el otro), **el modo**, las cinco cifras y
`pipeline_counters`.

⚠️ **Y el modo se anota SIEMPRE** — es B.178, y es lo que hoy impide colgar de una
fila del censo las dos cifras buenas que ya tenemos.

---

# 5-bis · ⚠️ QUÉ SE PODRÁ REPARAR DE ESTOS SEIS CUANDO EL CORTADOR CAMBIE

Va aquí, junto a la foto, porque decide si estas cifras se podrán volver a medir.

## La premisa que hay que corregir antes: está al revés

Es fácil leerlo mal —el nombre del estado invita a ello, ver B.186— así que va con
su evidencia:

| documento | estado | plan | **¿se repara hoy?** |
|---|---|---|---|
| los seis del harness (subida **manual**) | `reparable_resubiendo` | **`retrocear`** | ✅ **SÍ** |
| cualquiera de **Drive / OneDrive** | `reparable_automaticamente` | `reprocesar` | ❌ **NO: 501** |

**`reparable_resubiendo` no significa «hay que resubirlo».** Significa «no se puede
recuperar el ORIGINAL». Y para un cambio del CORTADOR eso da igual: no hace falta
el original, hace falta el texto — y el texto está en `full_text`. **`retrocear` es
exactamente la reparación que este cambio necesita**, y funciona sobre los seis.

**Lo que NO se puede reparar hoy es lo de la nube**, porque `reprocesar` no está
construido y el endpoint responde 501 (`reindexar/route.ts:134-141`).

## Y el dato de producto, que es real pero es otro

Un cliente que sube a mano **sí puede re-trocear** su corpus. Lo que no puede es
**re-extraerlo**: `ingest` borra el fichero de Storage al terminar y la fila no
guarda `storage_path`, así que del original no queda nada.

⚠️ **Y eso cae justo encima del frente que F-104 P1 ya decidió.** El día que la
extracción cambie —«una tabla en un PDF debe llegar a ser tabla»— ese arreglo
**no se podrá aplicar retroactivamente a ningún documento subido a mano**: harán
falta las resubidas, una por documento. Los de Drive sí, en cuanto exista
`reprocesar`.

Dicho al revés, que es como hay que llevarlo a una decisión: **hoy el corpus más
reparable es el de la nube, y es el único que el sistema todavía no sabe
reparar.**

---

# 6 · LO QUE ESTA FOTO ES Y LO QUE NO

· **Es una muestra de tamaño uno por par.** Las cifras del juez no son
  deterministas: si mañana salen distintas, sin una segunda medición previa **no
  se podrá separar el cortador del ruido del modelo**. Con tres pares hay algo de
  redundancia entre ellos, pero no es lo mismo que repetir uno.
· **No sustituye a los controles del diff.** Esos siguen siendo las cifras de
  tabla, que **no deben moverse**, y van apuntadas aparte.
· **Y no mide la recuperación del chat**, que es donde un troceado mejor debería
  notarse y donde no hay cifra guardada.
