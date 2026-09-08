# SIEMBRA — OPE-15, el documento nuevo de la tanda A3

**Fichero**: `OPE-15_tarifario-mutua-2026.xlsx` · hoja `Tarifas mutua`
**Generado**: `node scripts/sembrar-ope15.mjs` · 08/09/2026
**Se compara contra**: `OPE-11_tarifario-tratamientos-seguros.xlsx`

---

## 0 · POR QUÉ UN FICHERO NUEVO Y NO OTRA PASADA DE OPE-10

Reutilizar OPE-10-A1 medía **un caso de excepción tomándolo por el normal**: un
documento que el sistema recomienda no indexar. Y si el mismo documento diera un
número por un camino y otro por el otro, **no habría forma de decir cuál está
bien** — no hay tercer testigo.

Un fichero nuevo, además, deja documento para las tandas que vengan en vez de
reciclar el mismo. Y **no necesita esquivar la guarda de duplicado**: su huella
difiere de OPE-11 y de OPE-10 por construcción (30 filas contra 60), así que no
hace falta tocar ninguna celda para poder subirlo. La siembra de A1 tuvo que
cambiar `DIA-01` de 40 a 55 y eso creó una discrepancia decimosexta; aquí no.

---

## 1 · QUÉ TIENE DENTRO

Se **deriva de OPE-11**, y a propósito: para que dos filas se emparejen tienen
que compartir el valor de la clave, que el sistema descubre sobre `Código`.
Inventar códigos nuevos daría cero parejas — un cero sin denominador, que es lo
que estas tandas existen para no volver a producir.

| | filas | qué son |
|---|---|---|
| **compartidas** | **20** | las 20 primeras de OPE-11, copiadas. Emparejan todas |
| · de ellas **mutadas** | **8** | una celda cambiada cada una. **Son la siembra** |
| · de ellas intactas | 12 | control positivo: deben salir idénticas |
| **propias** | **10** | `MUT-01`…`MUT-10`. **Control negativo: no deben emparejar** |
| **total** | **30** | |

**Las ocho mutaciones**, repartidas por columna a propósito para que no todas
caigan en el mismo tipo de dato:

| fila | columna | valor sembrado |
|---|---|---|
| 0 | Precio base | 999 |
| 2 | Precio base | 111 |
| 4 | Precio base | 250 |
| 6 | Precio con seguro | 5 |
| 8 | Precio con seguro | 480 |
| 10 | Duración (min) | 5 |
| 12 | Profesional asignado | Dra. Nuria Vela |
| 14 | Clínica | Salamanca |

⚠️ **NUNCA SE MUTA `Código`.** Es la clave: cambiarla no crea una discrepancia,
**deshace la pareja** — y una fila sin pareja no se compara, así que la siembra
desaparecería en vez de detectarse. El generador aborta si una mutación no
cambia nada (`ya vale X`), para que una siembra muerta no pase por sembrada.

---

## 2 · LA CIFRA ESPERADA, MEDIDA SIN GASTAR UN CRÉDITO

La sonda corre el emparejador y el emisor reales —`emparejarTablas`,
`emitirDiffDeTablas`, `contadoresDeVision`— sobre los dos ficheros del
repositorio. **No llama a ningún modelo.** El diff de tablas es determinista, así
que esto no es una estimación: es la respuesta.

```
tablas_analizado    1     filas_analizado    30
tablas_candidatos   1     filas_candidatos   60
pares_con_vision    1     pares_ciegos       0     ciegos_por_el_analizado 0
candidatos 1 = sin_clave 0 + sin_interseccion 0 + emitidos 1
identicas 12 · discrepantes 8 · solo_en_a 10 · solo_en_b 40
contradicciones emitidas por el diff: 8
```

**Las dos sumas cierran contra el denominador**, que es lo que convierte esto en
una medición: `8 + 12 = 20` filas emparejadas; `20 + 10 = 30` y `20 + 40 = 60`,
que son exactamente `filas_analizado` y `filas_candidatos`.

**El 8 es distinto del 15 y del 16 a propósito.** Si una pasada devuelve 15 o 16,
no ha medido esto.

---

## 3 · ⚠️ LA TRAMPA: SI SE EMPAREJA TAMBIÉN CON OPE-10

OPE-10 es otro tarifario y la recuperación puede traerlo como segundo candidato.
Los contadores se **suman sobre los candidatos**, así que con los dos:

| candidato | disc | iden | solo_a | solo_b |
|---|---|---|---|---|
| OPE-11 | 8 | 12 | 10 | 40 |
| OPE-10 | 7 | 5 | 18 | 48 |
| **suma** | **15** | 17 | 28 | 88 |

**Quince.** El mismo número que las 15 sembradas del caso 6, por un camino que no
tiene nada que ver. Un 15 aquí se leería como «reprodujo el caso de siempre».

**CÓMO SE DISTINGUE, y hay que mirarlo siempre**: `diff.tablas.candidatos` vale
**2** y `filas_candidatos` vale **120**. Con un solo par son **1** y **60**.

Y el 7 de OPE-10 **no es siembra**: mezcla las mutaciones de aquí con las
diferencias originales entre OPE-10 y OPE-11. Solo el par contra **OPE-11** es
atribuible.

---

## 4 · MONTAJE

- En `analizado`, de los tarifarios, **solo OPE-11**. OPE-10 y OPE-10-A1 fuera
  del corpus por defecto, o el número deja de ser atribuible (§3).
- OPE-15 en la bandeja, `en_revision`, indexado y sin validar.
- **Seleccionar un solo documento**: los demás seleccionados viajan en
  `batchDocumentIds` y entran como candidatos nominados (F-97).
- Modo **rápido** — A3 es la fila rápida, **5 créditos**. Y se declara en la
  entrada del registro: B.178 existe porque las dos entradas del 04/09 no lo
  declararon y sus cifras no se pueden asignar a ninguna fila.
