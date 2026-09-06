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
