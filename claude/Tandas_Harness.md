# Tandas del harness de tasas

Histórico de mediciones. **Crece por arriba: lo más reciente, primero.**

El protocolo —los cinco casos, cómo se lanzan, qué se apunta— está en
`claude/Protocolo_Harness_Tasas.md`. **Este fichero no lo repite**: aquí solo van
las cifras.

Al leer una tasa, mirar siempre contra qué commit se midió. Y recordar que
«línea de base» significa cosas opuestas en `Cierre_B81.md` (el síntoma, ANTES
de la cura) y en los relevos (el estado sano, DESPUÉS) — la advertencia está al
principio del protocolo.

---

## 27/08/2026 — `94ad06a0` — EXPERIMENTO F-73, tres estados

**Qué se lanzó**: el par de tablas **RRHH-06 / OPE-02**, los dos sentidos,
**cuatro pasadas por dirección y por estado**. Tres estados del mismo commit,
alternados con la variable `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` en el worker de
Railway.

**La pregunta**: por qué el modo exhaustivo NO detectaba la contradicción del
Puesto de Dr. Pablo Reyes en la dirección `OPE-02 → RRHH-06`, cuando el rápido
sí. Hasta `94ad06a0` el exhaustivo se saltaba entera la selección y se llevaba
los fragmentos en bruto.

### Dirección OPE-02 → RRHH-06 (la que fallaba)

| Estado | Qué ve el juez | Tasa |
|---|---|---|
| **Base** — sin selección | 15 filas en bruto | **0/4** |
| **Estado 1** — 3000, destilado | resumen + 9 filas, de las cuales 9 colapsadas → 6 líneas | **4/4** |
| **Estado 2** — 6000, nivel 1 | la tabla entera, 15 filas sin colapsar | **0/4** |

### Dirección RRHH-06 → OPE-02 (la que ya funcionaba)

**Detecta en los tres estados.** Y el motivo importa para leer bien la tabla de
arriba: la tabla de OPE-02 tiene **10 filas y cabe entera** en cualquiera de los
tres presupuestos, así que **la destilación nunca llega a actuar** en ese
sentido. No es que el estado no le afecte: es que para esa tabla los tres
estados son el mismo.

### El mecanismo aislado: EL COLAPSO DE IDÉNTICAS

Los tres estados dibujan una curva que no es monótona —0, 4, 0— y eso descarta
«más material es mejor» y también «menos material es mejor». Lo que separa al
estado 1 de los otros dos no es el volumen: es que **es el único donde el
colapso de filas idénticas actúa**. En base no hay selección; en estado 2 la
tabla entra completa por nivel 1, y el nivel 1 no colapsa nada.

Nueve filas que colapsan a seis líneas es lo que hace visible la fila que
difiere: las que coinciden se resumen en una línea de contexto y la discrepante
queda sola, en vez de enterrada entre catorce vecinas del mismo formato.

**Y NO es la prosa.** El desglose por tipo del log (añadido en `94ad06a0`
justo para poder responder esto) confirma que **la prosa entró igual en los dos
estados, 4/4 unidades**. La diferencia entre 4/4 y 0/4 no puede atribuirse a
material de prosa que entrara en uno y no en otro.

### Lo que esta tanda NO mide

**La esquina «destilado y grande».** Los tres estados cubren tres de las cuatro
combinaciones:

| | Sin destilar | Destilado |
|---|---|---|
| **Poco material** | — | Estado 1 ✅ medido |
| **Mucho material** | Base y Estado 2 ✅ medidos | **❌ SIN MEDIR** |

No se ha medido qué pasa con **una tabla grande que además se destila** — por
ejemplo, un presupuesto alto sobre una tabla de cuarenta o noventa filas, donde
el nivel 1 no cabe y el colapso sí actúa sobre muchas filas. Toda la conclusión
de esta tanda descansa en una tabla de 15 filas.

**Y el tope de piezas es un confundidor conocido para esa esquina**:
`MAX_FRAGMENTS_PER_DOC_QUICK = 25` bloquea el nivel 1 con cualquier
presupuesto en una tabla de más de ~24 filas (OPE-06 son 94 + resumen = 95
piezas), así que medir ahí sin parametrizarlo mediría otra cosa.

---

## 26/08/2026 — `a775a7c7`

**Qué se lanzó**: los cinco casos, modo rápido, desde la bandeja de revisión.
Org de pruebas `5a82712f-6740-4792-b291-3fdea8e6edb1`.
**Una pasada por caso.**

**Estado del código**: después de F-70 (`8f151aff`, la ficha en prosa) y de su
documentación (`a775a7c7`); **antes** de F-71 (`38d3fd22`, las etapas caídas).

| # | Caso | Resultado |
|---|---|---|
| 1 | Tabla, RRHH-06 → OPE-02 | **Detectada.** Columna `Puesto` de Dr. Pablo Reyes, confirmada por **estructura** |
| 2 | Tabla, OPE-02 → RRHH-06 | **Detectada.** Misma columna, confirmada por **estructura** |
| 3 | Prosa, CLI-03 → NOR-01 | **Detectada**, confirmada por **juicio** |
| 4 | Prosa, NOR-01 → CLI-03 | **Detectada**, confirmada por **juicio** |
| 5 | MKT-01 con los otros cuatro | **Limpio: cero hallazgos** |

| Comprobación transversal | Resultado |
|---|---|
| Falsos positivos de Belmonte (casos 1 y 2) | **Cero** |
| `columna_indeterminada` | **Cero** |
| Fallos de LLM | **Ninguno** |

**Qué confirma**: que F-69 y F-70 —el transporte de `columns`,
`comparedValues` y las filas, y la ficha en prosa— no rompieron la detección en
ninguno de los cuatro pares, y que el control negativo sigue limpio.

**Qué NO afirma**: que ninguna tasa se haya movido. Con una pasada por caso no
se distingue un régimen de una racha, que es exactamente lo que costó tres
semanas en B.81. Para eso hacen falta cuatro pasadas por dirección.

**Anomalía**: los casos 1 a 4 **no se midieron con el corpus vacío entre pares**.
Es la desviación que motivó fijar el vaciado en el protocolo: un par medido con
documentos ajenos en la tanda no está midiendo la detección entre esos dos,
porque el retrieval y el rerank ven otra cosa. Las cuatro detecciones salieron
bien de todos modos, pero salieron en condiciones más ruidosas que las que el
protocolo pide.

*(El caso 5 sí se midió como debe: MKT-01 acompañado de los otros cuatro. En su
día se anotó como si fuera la anomalía; no lo era — la anomalía estaba en los
casos 1 a 4.)*
