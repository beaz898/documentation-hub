# Qué cuesta añadir un formato

**05/09/2026 · SOLO LECTURA.** Respuesta a la pregunta del director: si todo se
reduce a prosa y tablas, ¿un formato nuevo es enchufar un extractor a una de las
dos ramas?

**La respuesta corta: la intuición acierta en el CONTRATO y se queda corta en el
PERÍMETRO.** El pipeline sí son dos formas. Pero un formato no es un extractor:
es una entrada en **cuatro listas repartidas por cinco ficheros**, y la última vez
que se añadió uno **se olvidó una de ellas**. Eso está registrado, no estimado.

---

## 1 · La mitad que el director tiene bien, y es la mitad buena

`ExtractedSegment` (`chunking.ts:85`) tiene tres variantes y **solo dos formas**:

- **PROSA** — `{ type: 'text', text }`.
- **TABLA** — `{ type: 'table_summary', columns… }` + `{ type: 'table_row', cells… }`.

Todo lo que viene después consume esas dos y nada más: el troceado
(`chunkSegments`), los vectores, el juez, el emparejador, el diff. **Un extractor
nuevo devuelve una de las dos formas y no toca ni una línea del pipeline.** Esa
propiedad es real, se ganó en F-20/F-51, y es lo que hace que la pregunta del
director tenga la respuesta que él espera… en esa mitad.

---

## 2 · La mitad que falta: un formato vive en CUATRO listas

Ninguna se deriva de otra. Son **cuatro copias del mismo conocimiento**, y hay
que acertar en las cuatro:

| # | dónde | qué es | si se olvida |
|---|---|---|---|
| 1 | `chunking.ts:758` | el `switch` de `extractSegments` — **la única que decide de verdad** | cae en `default` y se lee como UTF-8: **basura silenciosa** |
| 2 | `ingest/route.ts:84` | `allowedExtensions` | 400 limpio, «formato no soportado» |
| 3 | `DocumentsSidebar.tsx:753` | el `accept` del `<input>`, **dentro de un string** | no aparece en el diálogo de archivos |
| 4a | `drive/google.ts:17,25` | `ALLOWED_MIME_TYPES` + `ALLOWED_EXTENSIONS` | **el fichero se ignora en la sincronización, sin avisar** |
| 4b | `drive/onedrive.ts:18,21` | las mismas dos | idem |

⚠️ **Esto es exactamente lo que prohíbe la regla de la casa** —«un criterio se
implementa UNA VEZ; quien lo necesita PREGUNTA a quien lo decidió»—. Aquí el
criterio «qué formatos entiende Doclity» está implementado **cuatro veces**, y una
de ellas es un atributo HTML dentro de una cadena de texto.

**Nota sobre el `accept`**: no hay zona de arrastre en la aplicación —cero
`onDrop` en todo el código—, así que el `<input>` es la única vía. Pero `accept`
**filtra el diálogo, no impide nada**: el usuario puede elegir «todos los
archivos». La barrera real es la lista 2, la de `ingest`.

---

## 3 · ⚠️ EL PRECEDENTE, QUE NO ES UNA ESTIMACIÓN: LA ÚLTIMA VEZ SE OLVIDÓ UNA

`Bitacora_Sesiones.txt:4055` lo cuenta con estas palabras, sobre el commit
`9d198063`:

> «extractText SIEMPRE supo leer xlsx/xlsm y la subida manual (ingest) siempre los
> aceptó, pero las listas blancas de los DOS proveedores los excluían en el
> LISTADO, antes de descargarlos: **no llegaban ni a contarse como encontrados**.
> **Alguien añadió soporte de Excel a extractText y a ingest y no actualizó los
> proveedores.**»

Es la respuesta empírica a la pregunta del director. Añadir Excel se hizo en
**tres** de los sitios; los otros **dos** —Google y OneDrive— se olvidaron, y el
efecto no fue un error: **las hojas de cálculo eran invisibles para el sync y no
aparecían ni en el recuento**. Un formato a medio enchufar no falla: desaparece.

---

## 4 · Los nueve que ya se aceptan: cinco extractores, no nueve

| extractor | extensiones | qué produce | coste histórico |
|---|---|---|---|
| **crudo** `:760` | `md`, `csv`, `json`, `html` | prosa, `buffer.toString()` sin tocar | **una línea**, y las cuatro comparten |
| **txt** `:766` | `txt` | prosa + dos normalizaciones | pequeño |
| **pdf** `:769` | `pdf` | prosa | **dos motores**: `pdf-parse` y `unpdf` de reserva (`pdf-extract.ts`) |
| **docx** `:772` | `docx` | prosa | `mammoth` + reserva `extractRawText` |
| **excel** `:784` | `xlsx`, `xlsm` | **tablas con celdas** | `xlsx` (SheetJS) + `splitSheetIntoIslands` + tipado |

**Cuatro de los nueve comparten el extractor más barato que existe** —devolver el
fichero tal cual— y por eso `csv`, `json` y `html` «se soportan»: no porque
alguien los trabajara, sino porque caen en la rama que no hace nada. Es la misma
razón por la que un CSV entra como churro de texto.

**Y dos de los cinco necesitaron un segundo motor de reserva** —PDF y docx—, lo
que responde a otra parte de la pregunta: un formato no siempre es *un* extractor.

---

## 5 · Los tres ejemplos del director, uno por uno

**`.rtf` — rama PROSA, extractor nuevo.** No hay librería en el proyecto.
RTF es texto con marcas de control; se puede desbrozar a mano —con riesgo de
dejar restos— o con una dependencia. Trabajo real, pero acotado y sin tocar el
pipeline.

**`.odt` — rama PROSA, y probablemente dependencia nueva.** Es un ZIP con un
`content.xml` dentro. `mammoth` **no lo lee** (es docx-only) y no hay nada más en
`package.json` que sirva. Choca con «cero dependencias nuevas sin razón» — aquí sí
habría razón, pero es una decisión, no un trámite. ⚠️ **Y ojo con el ODS**, su
hermano de hoja de cálculo: ése iría a la rama de TABLAS, que es la cara, no a la
de prosa.

**Google Sheets exportada — ⚠️ YA FUNCIONA. Coste cero.** `google.ts:185-195`
exporta el Sheet nativo **a XLSX**, y el comentario dice por qué no a CSV: «el
export a CSV solo devuelve la PRIMERA hoja y perdería el resto sin avisar».
Conserva las celdas y entra por el extractor de Excel. Ya está hecho, y bien.

---

## 6 · Lo que la intuición no cubre, y es lo caro

**Enchufar el extractor es barato. Enchufarlo con la garantía que tiene Excel es
lo que cuesta**, y hoy Excel es el único que la tiene.

Un `.odt` o un `.rtf` entrarían por la rama de prosa — y la rama de prosa
**no tiene una sola prueba determinista de extracción**: `pdf`, `docx`, `txt` y
`md` son `∅` en la suite (censo, §3). Añadir un formato a esa rama no empeora
nada, pero tampoco hereda ninguna red: hereda la ausencia.

Dicho en la forma que sirve para decidir sobre `csv`, `json` y `html`: **el coste
no está en soportarlos —ya están «soportados»— sino en saber qué hacen.** Un CSV
ya entra hoy; lo que no existe es una sola medición de qué sale por el otro lado.

---

## 7 · Sobre el «procesador universal» — sí, es pregunta para Fable

Le doy la forma técnica para que la pregunta llegue afilada, y un dato de casa
que conviene que viaje con ella.

Lo que el director intuye tiene nombre: **conversión primero**. En vez de un
extractor por formato, todo se convierte a **una representación canónica** —
típicamente markdown con tablas— y el sistema solo sabe leer ésa. Es como
funcionan los procesadores documentales del sector.

⚠️ **Y lo que hay que contarle a Fable es que este proyecto YA TIENE ESE PATRÓN,
en un rincón**: Drive no extrae los formatos nativos de Google. **Los convierte**
— `gdoc` → `text/plain`, `gsheet` → `xlsx` — y luego usa los extractores que ya
existían. La arquitectura que el director propone está en casa, aplicada a dos
casos, sin haberse declarado nunca como principio.

Las preguntas que yo le haría a Fable, con eso delante:
1. ¿Conviene subir ese patrón de dos casos a principio general, o la conversión
   pierde justo lo que este producto necesita —las **celdas**, que son lo único
   que alimenta el diff—?
2. Si la representación canónica es markdown con tablas, **¿sobrevive la
   identidad de fila** (`table-key`, `puntero-de-fila`) a esa conversión?
3. ¿Conversión propia o servicio externo? Un servicio externo mete un cuarto
   proveedor con su coste, su latencia y su modo de fallar — y por la regla de
   B.138 habría que decidir qué significa que devuelva poco.

---

## LO QUE ESTE DOCUMENTO NO DICE

· **No estima horas.** Da el perímetro y el precedente; cuánto tarda cada uno
  depende de la librería, y eso no se sabe hasta abrirla.
· **No dice que las cuatro listas haya que unificarlas.** Dice que son cuatro y
  que la última vez se falló una. Unificarlas es una propuesta y aquí no toca.
· **No mide `csv`, `json` ni `html`.** Sigue sin haber una sola cifra suya: eso
  es lo que el director está decidiendo si se prueba o se declara.
