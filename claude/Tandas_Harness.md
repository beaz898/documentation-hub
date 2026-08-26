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
