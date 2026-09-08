# Guion de las tres tandas de la puerta principal

**07/09/2026.** Las que deciden si esto se enseña. Con lo aprendido esta semana
dentro: **las cifras se leen de `analysis_results`, no del log** (F-102); **el
aislamiento se comprueba antes** (F-102 P1); y **los denominadores viajan con el
cero** (F-103 P3, pieza 2, implementada hoy).

---

# 0 · CUÁLES SON LAS TRES, Y POR QUÉ ÉSAS

⚠️ **ESTE DOCUMENTO SE NUMERA A SÍ MISMO DE DOS MANERAS, y hasta arreglarlo hay
que leerlo con cuidado (visto el 09/09/2026).** La tabla de aquí abajo dice TRES
tandas con `T2 = A5`; los apartados del §2 son CUATRO y ahí `T2 = A6 arreglado`
y `A5` es la T3. **«T2» significa dos cosas distintas según dónde se lea.**

La lista buena es la de CUATRO, porque A6-roto y A6-arreglado son dos pasadas
distintas y no una: la primera mide el fallo, la segunda mide el arreglo, y
ninguna sustituye a la otra. La tabla de §0 las colapsó en una fila.

**Para no depender del número, el estado va por SUPERFICIE:**

| superficie | estado 09/09 |
|---|---|
| **A6 roto** — modal desde la bandeja | ✅ **MEDIDA** el 09/09, con fila y denominadores |
| **A6 arreglado** | ❌ no corrida — necesita arreglar B.177 antes |
| **A5** — modal desde el chat | ⚠️ comprobado por LOG el 06/09; **sin tanda** (F-102) |
| **`index-text`** | `∅` — ni tanda, ni test, ni evidencia. **No cuesta créditos** |

El orden de contacto dice que **las tres primeras entradas son la misma
superficie: el modal de mejora**. No es una función accesoria — es el primer
sitio al que el producto manda al cliente en cuanto sube algo con problemas.

| # | tanda | qué es | estado hoy |
|---|---|---|---|
| **T1** | **A6** — modal desde la **bandeja** | «Reanalizar todo» sobre un documento de la bandeja | ⚠️ **ROTO** (B.177): manda texto plano y cobra 30 |
| **T2** | **A5** — modal desde el **chat** | el mismo botón, la otra puerta | arreglado el 04/09 (se cuelga de `storagePath`) |
| **T3** | **`index-text`** — guardar la versión corregida | cierra el gesto que el producto sugiere | `∅`: ni tanda, ni test, ni evidencia |

⚠️ **`csv` es el número 3 del orden de contacto y NO está aquí**, y se dice para
que no parezca un olvido: es otra superficie —la ingesta, no el modal— y su
expectativa ya está escrita («sube una tabla, recibe prosa»). Entra como cuarta
tanda si sobra presupuesto.

---

# 1 · QUÉ DOCUMENTOS, Y EN QUÉ ESTADO

**El par grande: OPE-10 / OPE-11.** Es la única pareja con cifra de referencia
reproducida —**15 contradicciones**— y la reprodujo dos veces en corpus distintos.
Sin una cifra previa, una tanda no confirma nada: descubre.

## 1.1 · Lo que hay que comprobar ANTES, y en este orden

```sql
-- (a) LOS DOS DOCUMENTOS: estado, sello, estructura y generación
select id, name, analysis_status, extractor_version, active_generation,
       segments is not null as tiene_segmentos, chunk_count, source
from documents
where name ilike 'OPE-1%' order by name;

-- (b) AISLAMIENTO — ningún homónimo vivo del par (F-102: un documento
--     comparándose con su propia versión reemplazada)
select name, count(*), array_agg(id) from documents
where name ilike 'OPE-1%' group by name having count(*) > 1;

-- (c) SIN VERSIÓN PENDIENTE, que rechazaría el reindexado y enturbiaría el par
select document_id, generation from document_staged;

-- (d) LOS TROZOS DE CADA UNO, por tipo: es lo que el diff puede ver
select d.name, c.chunk_type, count(*)
from document_chunks c join documents d on d.id = c.document_id
where d.name ilike 'OPE-1%' and c.generation = d.active_generation
group by d.name, c.chunk_type order by d.name;
```

**Cómo se lee, decidido antes de verlo:**

· **(a) `analysis_status`**: los dos tienen que estar en `analizado`. El chat y el
  corpus participan **por pertenencia**, y un documento que no lo esté no existe
  para el otro (F-97).
· **(a) `extractor_version`**: hoy los dos estarán en 2 o NULL, porque el sello
  subió a 3 esta mañana. **Ver §1.2.**
· **(b) tiene que devolver CERO filas.** Si aparece un homónimo, se para: es
  exactamente F-102 y contamina el par.
· **(d)**: los dos deben traer `table_row`. Si alguno trae solo `text`, **ese
  documento no tiene estructura** y la tanda mediría otra cosa.

## 1.2 · ⚠️ QUÉ HAY QUE SACAR DEL CORPUS ANTES — y la respuesta es: nada, pero sí reparar

No hay que sacar ningún documento. Lo que hay que resolver es **la mezcla de
troceados**: el sello está en 3 y el parque en 2, así que el corpus tiene hoy dos
reglas de corte conviviendo.

**Y para ESTE par, la mezcla probablemente no afecta** — no es una suposición
cómoda, está medido: la foto previa al cortador dejó **todas las filas de tabla a
cero**, o sea que B.182 dañaba prosa y no celdas. Las 15 contradicciones del par
grande salen de celdas.

**Aun así se reparan primero, por dos razones baratas:**
1. Es el **control positivo** que la primera reparación necesitaba (§B195).
2. Si la tanda diera algo distinto de 15, con el parque mezclado habría **dos
   explicaciones posibles** y ninguna forma de separarlas. Reparando antes, solo
   queda una.

```js
// uno a uno, para ver los ms de cada uno
await (await fetch('/api/admin/reindexar', { method:'POST',
  headers:{'Content-Type':'application/json'}, credentials:'include',
  body: JSON.stringify({ documentId:'<id de OPE-10>' })})).json()
```

⚠️ **Si alguno responde 409 `sin_original_con_tablas`**, es un `.xlsx` sin
segmentos: **no se puede reparar y hay que resubirlo**. Y entonces se declara —
la tanda corre igual, con la mezcla anotada en el registro.

## 1.3 · ⚠️ LA PRECONDICIÓN QUE NO ES DE DATOS: EL WORKER

**El modo exhaustivo NO corre en Vercel: corre en el worker de Railway, que
despliega aparte.** Los contadores de visión que entraron hoy los emite
`pipeline.ts`, y el worker lleva su propia copia desplegada.

**Si el worker no se redespliega, las tres tandas saldrán sin `diff.vision.*`** —
y una tanda sin denominadores es justo lo que esta pieza vino a impedir. Se
comprueba en la primera fila: si `counters` no trae las siete claves, el productor
no llegó y la tanda no cuenta.

---

# 2 · QUÉ SE MIDE, Y QUÉ NÚMERO ESPERO

Todo se lee de **`analysis_results`** — la fila, no el log — y **cada pasada
declara camino Y MODO** (B.178), que es lo que hoy falta en las dos entradas que
sí tienen cifra.

```sql
select created_at, contradictions_found, duplicates_found,
       counters -> 'diff.vision.pares_con_vision'        as con_vision,
       counters -> 'diff.vision.pares_ciegos'            as ciegos,
       counters -> 'diff.vision.ciegos_por_el_analizado' as ciego_el_analizado,
       counters -> 'diff.vision.tablas_analizado'        as tablas_a,
       counters -> 'diff.vision.tablas_candidatos'       as tablas_b,
       counters -> 'diff.tablas.candidatos'              as pares_evaluados,
       counters -> 'diff.tablas.emitidos'                as pares_emitidos
from analysis_results order by created_at desc limit 5;
```

## T1 · A6 HOY, SIN ARREGLAR — la que mide el fallo

**Se mide el defecto antes de arreglarlo**, y es lo único que hace demostrable el
arreglo después. La predicción ya estaba escrita en el plan y no se cambia:

| qué | esperado | si sale otra cosa |
|---|---|---|
| `contradictions_found` | **4** | ⚠️ si sale 15, B.177 no está donde creemos y hay que releer el código antes de tocar nada |
| `tablas_analizado` | **0** | es la firma de la ceguera |
| `ciegos_por_el_analizado` | **= nº de candidatos** | todos ciegos por el mismo lado |
| `tablas_candidatos` | **> 0** | ⚠️ **el dato que lo delata**: el corpus SÍ tenía tablas |
| `diff.tablas.candidatos` | **0** | al emparejador no le llegó ni un par |

⚠️ **Esta es la primera tanda de la historia del proyecto en la que un cero viene
con su denominador.** Si `tablas_analizado` sale 0 y `tablas_candidatos` sale > 0,
eso **es** el diagnóstico, en la misma fila, sin deducir nada.

## T2 · A6 ARREGLADO — la que levanta la cuarentena

Entre T1 y T2 va el arreglo de B.177: pasarle `storagePath` al modal desde la
bandeja. **Es código, cuesta 0 créditos.**

| qué | esperado |
|---|---|
| `contradictions_found` | **15** |
| `tablas_analizado` | **> 0** |
| `pares_con_vision` | **> 0**, y `pares_ciegos` = 0 por el lado del analizado |
| `diff.tablas.emitidos` | **≥ 1** |

## T3 · A5 DESDE EL CHAT — la simetría del criterio de salida

El criterio dice: «la puerta principal medida **por sus dos entradas, con la misma
cifra por las dos**». Mismo par, mismo modo, otra puerta.

| qué | esperado |
|---|---|
| `contradictions_found` | **15, idéntico a T2** |
| los siete de visión | **iguales a T2** |

⚠️ **Y si T2 y T3 no coinciden, el hallazgo es más grave que cualquiera de los dos
números**: significaría que el resultado depende de por dónde entres, que es lo
que el cliente no puede saber ni sospechar.

## T4 · `index-text` — la que no cuesta créditos y nadie ha corrido nunca

Guardar la versión corregida desde el modal. **No consume créditos**: es
indexación. Lo que se mide es si lo guardado **conserva la estructura**:

```sql
select chunk_type, count(*) from document_chunks
where document_id = '<el nuevo>' and generation = <la activa>
group by chunk_type;
```

| qué | esperado | por qué importa |
|---|---|---|
| `table_row` | **> 0** | si sale 0, lo guardado es prosa y **la cadena de B.179 pasa de deducción a medición** |
| `extractor_version` de la fila | **3** | lo que entra hoy entra con el cortador nuevo |

---

# 3 · CUÁNTO CUESTA

| paso | créditos |
|---|---|
| Reparar OPE-10 y OPE-11 | **0** (no hay llamada a modelo) |
| **T1** · A6 roto, exhaustivo | **30** |
| Arreglo de B.177 | **0** (código) |
| **T2** · A6 arreglado, exhaustivo | **30** |
| **T3** · A5 chat, exhaustivo | **30** |
| **T4** · `index-text` | **0** |
| | **90 en total** |

⚠️ **Todo en modo EXHAUSTIVO y no rápido**, y por una razón que vale los créditos:
las 4 de B.175 se midieron en exhaustivo. Mezclar modos haría incomparables el
antes y el después — y `analyze-v2` rápido y exhaustivo **son código distinto**,
no el mismo con más vueltas.

## ¿Se pueden ahorrar los 30 de T1?

Sí: arreglar B.177 primero y medir una sola vez. **No lo recomiendo**, y la razón
es de método: sin T1, un 15 en T2 no demuestra que el arreglo hiciera nada —
podría ser que el par diera 15 por cualquier otro motivo. **T1 es el control
positivo del arreglo**, y es la diferencia entre «lo arreglamos» y «lo arreglamos
y aquí está la prueba».

⚠️ **Y hay un premio que no se ve en la tabla:** T1 es también el control positivo
de los denominadores. Es la primera vez que van a correr, y un caso ciego de
verdad es exactamente lo que hace falta para saber que **no salen ciegos siempre**.

---

# 4 · LO QUE ESTE GUION NO RESUELVE, dicho antes

· **El modo de las cifras viejas.** El par grande dio 15/15/2 sin declarar si fue
  rápido o exhaustivo (B.178). Si T2 no da 15, una de las explicaciones posibles
  es que la referencia fuera de otro modo. **Estas tres tandas sí lo declaran**, y
  a partir de ellas la ambigüedad se acaba.
· **No mide A1 ni A3** —subir desde el chat, analizar desde la bandeja—, que
  siguen sin cifra atribuible. Son la tanda siguiente.
· **No dice si el producto es bueno.** Dice si la puerta principal mide lo mismo
  por las dos entradas y si lo que enseña está completo.
