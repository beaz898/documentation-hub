# B.182 — el parque afectado y si hay que reindexar

**06/09/2026 · SOLO LECTURA.** Las dos cosas que no dependen de la consulta a
Fable, preparadas para que viajen con ella.

---

# 1 · ¿CUÁNTOS DOCUMENTOS ESTÁN INDEXADOS ASÍ?

**No lo puedo medir yo**: la medición es una consulta a Supabase y el SQL lo
ejecuta el usuario. Lo que sí puedo es dejarla exacta, y sobre todo **decir qué
mide y qué no** — que por la regla del cero es la mitad del trabajo.

## 1.1 · Por qué son DOS cifras y no una

El corte por longitud ocurre en dos situaciones que **desde la base de datos no
se pueden separar**:

- **Caso 4** — el documento no tenía encabezados markdown: TODO él se cortó por
  longitud. **Se detecta**: ninguno de sus trozos posteriores al primero empieza
  por `#`.
- **Sección subdividida** — el documento SÍ tenía encabezados, pero alguna
  sección pasaba de 1500 y se cortó por longitud por dentro. **No se detecta**:
  `subdivideSection` vuelve a pegar el título delante de cada pedazo
  (`chunking.ts:302`), así que esos trozos empiezan por `#` igual que los sanos.

Por eso lo honesto es dar **cota inferior y universo**, y decir que lo de en
medio no se puede separar sin volver a pasar el troceador sobre el texto.

## 1.2 · Las consultas

Columnas verificadas en `supabase-f20-chunks-estructurados.sql:22-47` y en el
`select` de `app/api/drive/sync/route.ts:120`. No hay ninguna inventada.

```sql
-- A · UNIVERSO — documentos con más de un trozo de prosa en su generación viva.
--     Es el techo: todos los que pasaron por algún reparto.
SELECT count(*) AS documentos_universo
FROM (
  SELECT c.document_id
  FROM document_chunks c
  JOIN documents d
    ON d.id = c.document_id
   AND d.active_generation = c.generation
  WHERE c.chunk_type = 'text'
  GROUP BY c.document_id
  HAVING count(*) > 1
) t;

-- B · COTA INFERIOR — de ésos, los del CASO 4: ningún trozo posterior al
--     primero empieza por encabezado markdown. Éstos seguro que se cortaron
--     por longitud de punta a punta.
SELECT count(*) AS documentos_caso_4
FROM (
  SELECT c.document_id
  FROM document_chunks c
  JOIN documents d
    ON d.id = c.document_id
   AND d.active_generation = c.generation
  WHERE c.chunk_type = 'text'
  GROUP BY c.document_id
  HAVING count(*) > 1
     AND count(*) FILTER (WHERE c.chunk_index > 0 AND c.text LIKE '#%') = 0
) t;

-- C · QUIÉNES SON — la lista, para poder mirar cuáles llevan tabla. Esto no lo
--     decide una consulta: lo decide alguien abriendo el documento.
SELECT d.name, d.source, d.extractor_version, count(*) AS trozos_texto
FROM document_chunks c
JOIN documents d
  ON d.id = c.document_id
 AND d.active_generation = c.generation
WHERE c.chunk_type = 'text'
GROUP BY d.id, d.name, d.source, d.extractor_version
HAVING count(*) > 1
   AND count(*) FILTER (WHERE c.chunk_index > 0 AND c.text LIKE '#%') = 0
ORDER BY count(*) DESC;
```

⚠️ **Lo que estas cifras NO dicen, y hay que decirlo al darlas:** cuentan los
documentos **cortados por longitud**, no los **dañados**. El daño solo existe si
el documento lleva contenido en filas — un `.txt` de prosa corrida se corta igual
y no le pasa nada, porque media frase no se confunde con una frase. **La cifra de
A y B es el universo expuesto; el subconjunto dañado lo dice la columna `name` de
la consulta C y un par de minutos de mirar.**

---

---

# 1-bis · ⚠️ EJECUTADAS, Y LA CONSULTA ESTABA MAL. LA CORRIJO.

**06/09/2026. Resultado sobre la organización del piloto: caso 4 = 5, universo =
18.** Y los cinco nombres, **todos `.xlsx`**:

| documento | versión | trozos de texto |
|---|---|---|
| OPE-02_agenda-y-gestion-de-citas.xlsx | v2 | 6 |
| OPE-08_proveedores-y-pedidos.xlsx | v2 | 4 |
| RRHH-06_evaluacion-del-desempeno.xlsx | v2 | 4 |
| OPE-11_tarifario-tratamientos-seguros.xlsx | v2 | 3 |
| OPE-06_presupuestos-y-financiacion.xlsx | v2 | 3 |

## Que salgan hojas de cálculo NO es la sorpresa. La sorpresa es que mi consulta no medía lo que decía medir.

**La mitad correcta de la lectura del usuario**: sí, un `.xlsx` tiene trozos de
PROSA además de sus filas. `extractSegmentsFromExcel` emite un segmento
`{type:'text'}` por cada línea de una «isla sin forma de tabla» —títulos,
leyendas, totales— renderizada como `[Hoja "X"] a · b · c` (`chunking.ts:697`).
Cinco hojas de cálculo con encabezados y totales dan exactamente esto.

⚠️ **La mitad que falla es mía, y es la premisa de la consulta.** Di por hecho que
«más de un trozo de prosa» implicaba «pasó por un reparto». **Es falso para
`chunkSegments`**, que es el que indexa: trocea **POR SEGMENTO**, no sobre el
documento entero (`chunking.ts:489`). Cada línea suelta de la hoja es su propio
segmento, mide muy por debajo de `CHUNK_SIZE`, y `buildProsePieces` la devuelve
**entera y sola** (`:419`).

**Conclusión: esos seis trozos de OPE-02 son seis LÍNEAS, no un texto partido en
seis.** Con casi total seguridad ninguno de los cinco tiene un solo corte por
longitud. **El 5 no es una cota inferior de nada: es un artefacto.**

Es, otra vez, la forma de esta semana: **una cifra que contaba algo distinto de lo
que su nombre decía.** La consulta no tenía denominador y yo no se lo puse.

## El instrumento correcto: la FIRMA DEL SOLAPE

No hay que adivinar si algo se cortó — **el corte deja huella**. Un trozo nacido
de `splitByLength` empieza dentro del anterior, porque `start = end - 200`. Eso se
consulta:

```sql
WITH pares AS (
  SELECT
    d.name,
    ch.chunk_type,
    -- Se quita el encabezado que subdivideSection vuelve a pegar delante, para
    -- que la sonda mire el CUERPO y no el título repetido.
    left(regexp_replace(ch.text, '^#{1,6} [^\n]*\n+', ''), 60) AS sonda,
    lag(ch.text) OVER (
      PARTITION BY ch.document_id, ch.generation ORDER BY ch.chunk_index
    ) AS anterior
  FROM document_chunks ch
  JOIN documents d
    ON d.id = ch.document_id
   AND d.active_generation = ch.generation
  WHERE d.org_id = '<tu org_id>'
)
SELECT name, chunk_type,
       count(*) FILTER (
         WHERE anterior IS NOT NULL
           AND length(sonda) >= 40
           AND position(sonda in anterior) > 0
       ) AS trozos_cortados_por_longitud,
       count(*) AS trozos
FROM pares
GROUP BY name, chunk_type
HAVING count(*) FILTER (
         WHERE anterior IS NOT NULL
           AND length(sonda) >= 40
           AND position(sonda in anterior) > 0
       ) > 0
ORDER BY 3 DESC;
```

**Por qué éste sí sirve, y las dos anteriores no:**
- **Mide el defecto, no un indicio suyo.** El solape ES el defecto.
- **Caza también las secciones subdivididas**, que la consulta vieja no podía
  separar: al quitar el encabezado repetido, lo que queda del cuerpo sí solapa.
- **No depende del tipo**: si algún día una fila de más de 1500 se parte, sale.

⚠️ **Y su límite, declarado**: si el resultado es CERO, ese cero **solo confirma si
el mismo camino ha dado un no-cero en algún sitio** — control positivo. Si sale
cero en todo el corpus, no se puede concluir «no hay daño» sin comprobar antes que
la consulta sabe encontrar un caso. **Para eso vale un documento de prosa larga
sin encabezados**, que sí tiene que salir.

---

# 2 · ¿ARREGLAR EL CORTADOR OBLIGA A REINDEXAR?

**No. Lo viejo se queda exactamente como está.** Y eso es una respuesta con dos
caras, las dos importantes.

## 2.1 · Por qué no obliga: nada re-trocea al leer

`document_chunks` es almacenamiento, no caché. Las lecturas —`getDocumentChunks`,
`getChunksForDocuments`— devuelven lo guardado y **no hay una sola línea que
vuelva a trocear un texto ya indexado**. Un cambio en `splitByLength` afecta
únicamente a lo que se indexe DESPUÉS del despliegue.

## 2.2 · Y por qué eso es el problema, no el alivio

El corpus queda **mezclado**: unos documentos cortados con la regla vieja y otros
con la nueva, conviviendo y comparándose entre sí. Y lo peor:

⚠️ **`documents.extractor_version` EXISTE, SE ESCRIBE EN LOS CUATRO PUNTOS DE
INDEXACIÓN… Y NO LO LEE NADIE.** Verificado: fuera de las cuatro escrituras
(`ingest:280`, `drive/sync:396,437`, `index-text:222`, `document-swap:114`) la
única aparición es un comentario. **Es un sello sin lector** — la especie de
`matchedBy` (B.159): la pieza que sabe la verdad existe, es correcta, y nadie la
consulta.

Así que hoy la mezcla sería **silenciosa**: el producto no puede distinguir un
documento troceado con una regla del troceado con la otra, aunque el dato esté
guardado. Solo se ve con la consulta de arriba.

## 2.3 · ⚠️ EL PRECEDENTE, que responde mejor que cualquier razonamiento

**Esto ya pasó, y con este mismo cortador.** `Bitacora_Sesiones.txt:4455-4465`:

> «…arregló los dos caminos de troceado con un solo cambio, al ser `splitByLength`
> compartida. **EXTRACTOR_VERSION 2.** […] CONTRATO VERIFICADO EN EL CORPUS REAL
> **tras resubir**: OPE-02 17 chunks (antes 16), RRHH-06 20 (antes 19), OPE-06 114
> (sin cambio). **13 documentos en `extractor_version` 2.**»

O sea: la casa ya cambió `splitByLength` una vez, subió `EXTRACTOR_VERSION` de 1 a
2, **y resubió el corpus a mano** para verificar el contrato. No fue automático y
no se pretendió que lo fuera.

**La respuesta práctica, entonces:** no obliga técnicamente, pero **la práctica de
esta casa ante este mismo cambio fue subir la versión y resubir**, y el parque de
entonces cabía en trece documentos. La pregunta real no es «¿hay que reindexar?»
sino **«¿cuántos son ahora?»** — que es la cifra del punto 1.

---

# 2-bis · ⚠️ ¿AFECTA A LO QUE LLEVAMOS DÍAS MIDIENDO? — OPE-11 y RRHH-06

Se contesta en dos mitades, y solo una de ellas depende de la consulta nueva.

## La mitad que NO depende de nada: **las cifras del diff son inmunes, por construcción**

No es «en principio»: es que **el diff no puede ver un trozo de prosa aunque
quiera**.

- `groupChunksByTable` descarta todo lo que no sea `table_row` **y tenga `cells`**:
  `if (c.tableId !== tableId || c.chunkType !== 'table_row' || !c.cells) continue`
  (`table-structure.ts:54`).
- `table-diff` compara **valores de celda**, no texto: `row.cells?.[column] ?? ''`
  (`:193`), y renderiza desde `cells` (`:249-250`).
- Y las `cells` **no pasan por `buildProsePieces` en ningún caso**: en
  `chunkSegments`, la rama de prosa (`:489`) y la de tabla (`:498-509`) son
  disjuntas, y un `table_row` solo se parte si supera **1500** — y aun entonces
  **cada pedazo conserva las mismas `cells`** (`:507-508`), que vienen del
  extractor y no del troceador.

**Las 15/15/2 del par grande y las 2/2/0 de la siembra están a salvo.** No hay
camino por el que un corte de prosa cambie esas cifras.

## La mitad que sí depende: **el juez no es inmune, y hay que decirlo**

El juez recibe **todos** los chunks del documento, no solo los tabulares
(`judge.ts:287`, `chunks: StoredChunk[]`), y verifica citas contra ellos. Un trozo
de prosa sucio es entrada sucia para el juez.

**Dónde importa eso en lo medido:** la siembra RRHH-08/OPE-13 dio **2 por juicio y
0 por estructura** — esas dos SON del juez. Si la prosa de esos documentos
estuviera mal cortada, la entrada del juez habría sido distinta.

⚠️ **Pero por lo de arriba, casi con seguridad no lo está**: sus trozos de texto
son líneas sueltas de la hoja, no texto partido. **«Casi con seguridad» no es
«verificado»**, y por eso la respuesta honesta es: **la consulta de la firma del
solape lo cierra, y hasta entonces esto queda como deducción, no como medición.**

**Lo que sí puedo afirmar sin esperar**: aunque saliera que hay prosa cortada en
esos dos documentos, **las cifras del diff seguirían siendo válidas** — solo
quedarían en cuestión las de juicio.

## 2.4 · Lo que yo llevaría a la consulta

Tres cosas que no me toca decidir:

1. **¿Se reindexa o se convive?** Y si se convive, **¿durante cuánto?** Por la
   regla de la lectura dual, una migración sin fecha no es una migración.
2. **¿El sello pasa a tener lector?** Si `extractor_version` no lo lee nadie, la
   mezcla es invisible. Darle lector es barato y convierte una incógnita en un
   contador.
3. **¿Y el orden?** Arreglar el cortador **no hace que una tabla se compare** —eso
   es la falta de `cells`, que es otra cosa—. Puede que lo correcto sea al revés:
   decidir primero si una tabla en PDF debe llegar a ser tabla, y que el corte se
   resuelva solo por el camino.
