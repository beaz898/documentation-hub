# La foto previa — qué congelar antes de tocar el cortador

**06/09/2026.** Sin la foto, «se movió» y «lo arreglamos» son indistinguibles.
Todo sale de la BASE, no de los logs (F-102).

---

# ⚠️ 0 · SON TRES FAMILIAS, Y CADA UNA SE LEE AL REVÉS QUE LA ANTERIOR

Esto es lo que hay que tener claro antes de mirar un solo número, porque el mismo
movimiento significa cosas opuestas según de qué cifra hablemos:

| familia | qué es | **después del cambio** |
|---|---|---|
| **1 · LA MEDIDA DEL DEFECTO** | la firma del solape | ⚠️ **TIENE que moverse.** Si no baja, el arreglo no llegó |
| **2 · LOS CONTROLES** | las cifras del diff, sobre celdas | ⚠️ **NO puede moverse.** Si se mueve, es regresión |
| **3 · LO EXPUESTO** | las cifras del juez, sobre texto | puede moverse — y **que no se mueva también es información** |

---

# 1 · LA MEDIDA DEL DEFECTO — la que tiene que moverse

Es la prueba directa de que el cortador cambió. Ya está validada con control
positivo (NOR-10 58/75, CLI-12 40/59 — los dos tenían que salir y salieron).

```sql
WITH pares AS (
  SELECT d.name, ch.chunk_type,
         left(regexp_replace(ch.text, '^#{1,6} [^\n]*\n+', ''), 60) AS sonda,
         lag(ch.text) OVER (
           PARTITION BY ch.document_id, ch.generation ORDER BY ch.chunk_index
         ) AS anterior
  FROM document_chunks ch
  JOIN documents d ON d.id = ch.document_id AND d.active_generation = ch.generation
  WHERE d.org_id = '<tu org_id>'
)
SELECT name, chunk_type,
       count(*) FILTER (WHERE anterior IS NOT NULL AND length(sonda) >= 40
                          AND position(sonda in anterior) > 0) AS cortados,
       count(*) AS trozos
FROM pares GROUP BY name, chunk_type ORDER BY 3 DESC;
```

**Congela la tabla entera**, no solo el total: la proporción por documento es lo
que dirá si el arreglo llegó a todos o solo a algunos.

# 2 · LA HUELLA DEL TROCEADO — el antes/después literal

Lo mismo, un nivel más abajo: qué trozos hay exactamente hoy.

```sql
SELECT d.name, ch.chunk_index, ch.chunk_type,
       length(ch.text) AS len, md5(ch.text) AS huella
FROM document_chunks ch
JOIN documents d ON d.id = ch.document_id AND d.active_generation = ch.generation
WHERE d.org_id = '<tu org_id>'
ORDER BY d.name, ch.chunk_index;
```

Con esto, después del cambio se puede decir **exactamente qué documentos se
repartieron distinto y en qué trozo empezaron a diferir**, en vez de «salen otras
cifras».

---

# 3 · LOS CONTROLES — las que NO pueden moverse

**Las cifras del diff no dependen del troceado de prosa**: salen de `cells`, y las
`cells` las produce el extractor, no el cortador. Está verificado en el código
(`table-structure.ts:54`, `table-diff.ts:193`) y **medido**: todas las filas de
tabla dieron cero cortes.

Por eso son el control: **si se mueven, el cambio tocó algo que no debía.**

```sql
SELECT id, created_at, document_name, analysis_type,
       contradictions_found, contradictions_confirmed,
       minor_inconsistencies_found, duplicates_found, overlaps_found,
       style_problems_found, recommendation, involved_documents, pipeline_counters
FROM analysis_results
WHERE org_id = '<tu org_id>'
ORDER BY created_at DESC
LIMIT 50;
```

De ahí hay que **aislar y congelar por nombre** las que ya son línea de base:

| pareja | cifras | origen | lectura |
|---|---|---|---|
| **OPE-10 / OPE-11** | `15 / 15 / 2` | **diff** | control duro: no se mueve |
| **RRHH-08 / OPE-13** | `2 / 2 / 0` | **juez** (0 por estructura, 2 por juicio) | expuesta: puede moverse |

---

# 4 · ⚠️ LO EXPUESTO — y el problema que tiene, dicho antes de usarlo

Las cifras del **juez** sí pueden cambiar con el troceado, porque el juez lee los
trozos. Pero tienen un defecto como línea de base que hay que declarar:

> **No son deterministas.** Salen de un modelo. Dos ejecuciones del MISMO código
> pueden dar cifras distintas.

Así que una sola medición previa **no es una línea de base: es una muestra de
tamaño uno**, y comparar contra ella no distingue «lo movió el cortador» de «el
modelo varió».

**LA RECOMENDACIÓN, y es la única cosa de este documento que cuesta créditos:**
si las cifras del juez van a servir de referencia, **medir la siembra DOS VECES
antes del cambio**, sin tocar nada entre medias. Dos pasadas de la misma pareja
dan la **banda de ruido**, y sin banda no hay comparación posible. Son 2 pasadas
exhaustivas (~50 créditos netos en Business) o en rápido si basta (10).

**Y si no se quiere pagar eso**, la alternativa honesta no es comparar igual: es
**declarar que las cifras del juez no son control** y apoyarse solo en las
familias 1, 2 y 3. Se pierde capacidad de detectar un efecto sutil, y se dice.

---

# 5 · LOS DENOMINADORES — dentro de `pipeline_counters`

La columna es `jsonb` y ya se persiste. Congelarla junto a las cifras, porque un
cambio de troceado **puede mover el retrieval sin mover el total**: mismos
hallazgos, distinto número de candidatos examinados. Sin el denominador, ese
movimiento es invisible.

```sql
SELECT document_name, created_at, pipeline_counters
FROM analysis_results
WHERE org_id = '<tu org_id>' AND pipeline_counters IS NOT NULL
ORDER BY created_at DESC LIMIT 20;
```

---

# 6 · LA BATERÍA — la línea de base del código

**540 tests en 43 ficheros, verde, con `EXTRACTOR_VERSION = 2`.** Es trivial de
apuntar y es lo primero que dirá si el cambio rompió algo determinista.

⚠️ Y uno concreto que **debe ponerse rojo** cuando el arreglo entre: el caso de
`lib/troceado-sin-encabezados.test.ts` que hoy **documenta el defecto** —«la CABEZA
de los trozos siguientes NO es fin de fila»—. Lleva escrito dentro que el día que
se arregle hay que invertirlo. **Que ese caso siga verde después del cambio es la
señal más barata de que el arreglo no llegó.**

---

# 7 · EL RESUMEN, para pegar en el registro antes de tocar nada

```
FOTO PREVIA AL CORTADOR — <fecha>, EXTRACTOR_VERSION = 2
· Firma del solape:      <tabla completa por documento>
· Huella del troceado:   <md5 por chunk, corpus entero>
· Control (diff):        OPE-10/OPE-11 = 15 / 15 / 2
· Expuesta (juez):       RRHH-08/OPE-13 = 2 / 2 / 0   [muestra de tamaño <1 o 2>]
· pipeline_counters:     <de esas mismas filas>
· Batería:               540 en 43 ficheros, verde
· Caso que debe romper:  troceado-sin-encabezados > «la CABEZA … NO lo es»
```

---

# LO QUE ESTA FOTO NO CONGELA, declarado

· **La recuperación del chat.** No hay cifra guardada de «qué tan bien responde»;
  `chat_queries` guarda qué documentos se usaron, no si la respuesta fue buena.
  Un troceado mejor debería mejorarla, y **no vamos a poder demostrarlo**.
· **Nada de los caminos sin medir.** La foto cubre lo que ya tiene cifra; los
  otros diez caminos del censo siguen sin línea de base, y el cambio del cortador
  también les afecta.
· **Y no congela `reprocesar`**, que sigue sin construirse.
