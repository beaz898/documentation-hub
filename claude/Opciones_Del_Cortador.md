# Opciones para que el cortador no parta una tabla

**06/09/2026 · SIN ELEGIR.** Cinco opciones con su coste. La decisión no es mía.

---

# 0 · LO QUE HAY QUE TENER DELANTE ANTES DE COMPARARLAS

**El defecto, en una frase:** `splitByLength` mueve el FINAL del trozo a una
frontera —`\n\n`, `. `, `\n`— pero el trozo siguiente arranca en
`start = end - CHUNK_OVERLAP`, y esos 200 caracteres hacia atrás **caen donde
caen**. Medido: seis de siete trozos abren a media fila.

**Tres hechos que condicionan todas las opciones:**

1. **En prosa esto no es un fallo, es la función.** Abrir a media frase es para lo
   que existe el solape. **El daño es específico del texto en filas**, donde un
   fragmento de fila es indistinguible de una fila.
2. **El cortador es compartido.** Seis llamadas, las tres funciones de troceado, y
   `chunkSegments` —el de `ingest`— entre ellas. **Cualquier cambio afecta al
   índice**, no a un análisis.
3. ⚠️ **Cualquiera de A, B, C o E sube `EXTRACTOR_VERSION` a 3 y deja TODO EL
   CORPUS desactualizado**, o sea reparación obligatoria. Solo D no.

**Y la distinción que ordena la tabla:** «no abrir a media línea» y «no partir una
tabla» **no son lo mismo**. A y E hacen lo primero; C hace lo segundo; B queda en
medio. D cambia la pregunta.

---

# A · El solape retrocede a la frontera de línea

Después de `start = end - overlap`, mover `start` al `\n` anterior (o siguiente).

| | |
|---|---|
| **qué arregla** | que un trozo abra a media línea. Ninguna fila aparece cortada por delante |
| **qué NO arregla** | una tabla **sigue pudiendo partirse entre dos trozos**: la de abajo tendrá filas enteras pero **sin cabecera** |
| **coste** | ~3 líneas en `splitByLength`, más su batería |
| **radio** | las seis llamadas; corpus entero desactualizado |
| **riesgo** | bajo. El solape efectivo pasa a ser variable (entre 0 y ~200+); hay que comprobar que nunca queda en 0, o dos trozos dejarían de compartir texto |
| **batería** | la que ya existe de B.182 sirve: el caso que hoy documenta el defecto **pasaría a invertirse**, y ése es el mejor indicador de que el arreglo entró |

**Es la más barata con diferencia**, y la que menos promete.

---

# B · Empaquetar por unidades, no cortar por longitud

Partir primero en unidades —líneas o párrafos— y luego meter unidades enteras en
un trozo hasta llenar el presupuesto, con el solape medido **en unidades**.

| | |
|---|---|
| **qué arregla** | ninguna unidad se parte nunca, ni por delante ni por detrás. Es la doctrina de F-80 —troceado por estructura— aplicada al último sitio que aún corta por tamaño |
| **qué NO arregla** | igual que A: **una tabla larga sigue repartiéndose** entre trozos, cada uno con filas enteras y sin cabecera |
| **coste** | reescritura de `splitByLength`: 40-60 líneas. Cambia el reparto de **todo** el corpus, no solo de lo tabular |
| **radio** | el mismo, pero el cambio de contenido es **mucho mayor** que en A |
| **riesgo** | medio. Una unidad más larga que el presupuesto sigue necesitando corte duro — el caso raro no desaparece, se arrincona. Y hay que decidir qué es «unidad» para un PDF, donde los saltos de línea son de maquetación |
| **batería** | nueva y grande: los diez documentos medidos como fixtures |

---

# C · Detectar bloques de filas y tratarlos como una unidad

Reconocer tramos de líneas consecutivas con el mismo número de separadores y
tratarlos como bloque: no partirlo, o partirlo **repitiendo la cabecera**.

| | |
|---|---|
| **qué arregla** | ⚠️ **la única que ataca el enunciado literal**: una tabla no se parte por la mitad, y si hay que partirla cada pedazo lleva su cabecera |
| **qué NO arregla** | que esa tabla llegue a tener `cells` — sigue siendo texto, y **el diff seguirá sin verla** |
| **coste** | el detector (heurístico, con su batería propia) + la lógica de empaquetado de B. Es el doble que B |
| **radio** | el mismo, más el riesgo del detector |
| **riesgo** | **el más alto.** Un heurístico se equivoca en las dos direcciones: puede ver tabla donde hay una lista con comas, y no verla donde el CSV tiene comillas o campos vacíos. Un falso positivo pega texto que debía separarse |
| **batería** | dos: la del detector y la del empaquetado. Y una tanda, porque cambia lo que el juez lee |

⚠️ **Y la pregunta que hay que hacerse antes de elegirla**: si el objetivo es que
una tabla se compare, esta opción **no lo consigue** — hace que se lea mejor, no
que se compare. Lo que la haría valer es la recuperación, no el diff.

---

# D · No tocar el cortador: que las tablas no lleguen a él

Es la decisión que F-104 P1 ya tomó: **una tabla en un PDF debe llegar a ser
tabla.** Si la extracción produce `cells`, el texto tabular no pasa por el
cortador de prosa.

| | |
|---|---|
| **qué arregla** | el problema de raíz, y **de paso el que sí duele**: la tabla se compara |
| **qué NO arregla** | ⚠️ **la prosa cortada sigue igual** — y son diez documentos medidos, CLI-01 con 7 de 8 trozos. El daño de B.182 no es solo tabular |
| **coste** | un frente entero: detección de tablas en PDF, producción de celdas, batería y medición. F-104 lo sitúa **después del censo** |
| **radio** | ninguno hoy: no cambia el cortador, así que **no desactualiza el corpus** |
| **riesgo** | el de un frente nuevo, no el de un cambio |

**No es alternativa a las otras: es la respuesta a otra pregunta.** Elegir D sola
deja B.182 abierto.

---

# E · Quitar el solape cuando el texto no tiene frases

Si el tramo no contiene `. `, no solapar.

| | |
|---|---|
| **qué arregla** | el fragmento de fila falso desaparece: sin solape no hay apertura a media línea |
| **qué NO arregla** | la tabla sigue repartiéndose; y **se pierde el solape**, que existe para que una frase partida siga siendo recuperable desde los dos lados |
| **coste** | ~2 líneas |
| **radio** | menor que las demás: solo cambia el troceado de textos sin frases |
| **riesgo** | ⚠️ **cambia la recuperación en el sitio donde peor se mide.** Quitar solape es perder redundancia, y el efecto no se ve en una batería: se ve en respuestas peores meses después |

**La más barata de todas y la que menos me gustaría defender**, porque paga con
recuperación algo que A consigue sin pagar.

---

# LA TABLA CORTA, para comparar de un vistazo

| | arregla media línea | arregla tabla partida | hace que se compare | coste | desactualiza el corpus |
|---|---|---|---|---|---|
| **A** solape a frontera | **sí** | no | no | ~3 líneas | sí |
| **B** por unidades | **sí** | no | no | 40-60 líneas | sí |
| **C** bloques de filas | sí | **sí** | no | doble que B | sí |
| **D** extracción | no | n/a | **sí** | un frente | **no** |
| **E** sin solape | sí | no | no | ~2 líneas | sí |

---

# LO QUE ESTE DOCUMENTO NO HACE

· **No elige.** Se pidió verlas, y elegir con el coste delante es de quien decide.
· **No mide.** Los costes en líneas son estimaciones de lectura del código, no de
  haberlo escrito; el de C es el que menos me fío, porque un heurístico se mide
  cuando falla.
· **No supone que sean excluyentes.** A y D se pueden hacer las dos, y de hecho
  cubren mitades distintas del daño. C y B sí se solapan entre sí.
· **Y no toca la pregunta de cuándo.** Cualquiera de A/B/C/E exige que la
  reparación esté probada antes — que es justo lo que queda pendiente.
