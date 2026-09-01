# Registro de siembra — RRHH-08 / OPE-13, el par SIN CLAVE

**Creado el 01/09/2026.** Nace de B.129: el corpus no tenía ni un par de tablas
capaz de ejercer la rama de degradación del punto 4, y sin él esa rama no se
puede ver ni en la batería ni en una tanda.

> ⚠️ **Este fichero se escribió MIDIENDO los dos .xlsx, no describiendo la
> intención con la que se fabricaron.** Todas las cifras de abajo salen de una
> sonda determinista sobre los ficheros reales. Si alguna contradice lo que se
> quiso sembrar, manda el fichero y hay que corregir el .xlsx, no esta tabla.

---

## Los dos documentos

| | `RRHH-08_asignacion-de-guardias.xlsx` | `OPE-13_cobertura-por-clinica.xlsx` |
|---|---|---|
| Tabla | «Guardias» | «Cobertura» |
| Filas | 14 | 14 |
| Caracteres de tabla | 1.737 | 1.792 |
| Caracteres totales | 1.854 | 1.913 |
| Columnas | `Profesional`, `Clínica`, `Especialidad`, `Turno`, `Horas semana` | `Responsable`, `Clínica`, `Especialidad`, `Turno`, `Jornada semanal` |

**Columnas compartidas: `Clínica`, `Especialidad`, `Turno`.**

**La columna de identidad se llama DISTINTO a propósito** — `Profesional` frente
a `Responsable` —, y es la pieza que hace posible todo lo demás: los dos
documentos hablan de las mismas personas (por eso se parecen y pasan el rerank)
pero esa columna **no es compartida, así que no puede ser clave**. Es la tensión
que F-92 señaló —«hablar de lo mismo empuja a compartir clave»— resuelta por el
único sitio por donde se puede.

Y no es un truco de laboratorio: es exactamente el caso que F-92 identificó como
el hueco legítimo del juez, **el mismo dato bajo otro nombre de columna**.

---

## POR QUÉ NO HAY CLAVE — medido, no supuesto

El umbral es `MIN_UNIQUE_PCT = 90`: una columna compartida es candidata si tiene
**≥90 % de valores distintos en su propia tabla**, medido por separado en las
dos. Y si ninguna simple pasa, **el emparejador prueba TODOS LOS PARES** de
columnas compartidas con el mismo criterio.

**Simples:**

| Columna | RRHH-08 | OPE-13 |
|---|---|---|
| `Clínica` | 14 % | 14 % |
| `Especialidad` | 29 % | 29 % |
| `Turno` | 14 % | 14 % |

**Compuestas (todos los pares):**

| Par | RRHH-08 | OPE-13 |
|---|---|---|
| `Clínica` + `Especialidad` | 57 % | 57 % |
| `Clínica` + `Turno` | 29 % | 29 % |
| `Especialidad` + `Turno` | 50 % | 57 % |

**Todas muy por debajo de 90, y el margen importa**: la trampa de una siembra
así no es la columna suelta, es la **compuesta**. Dos columnas inocentes cuyo
producto de cardinalidades se acerque al número de filas dan una clave sin que
nadie la pretenda.

**Resultado del emparejador, en las dos direcciones:** `pares = 0`,
`sinInterseccion = 0`. El par **no aparece en ninguna de las dos listas**: cae
por la PRIMERA puerta, que es justo el territorio que se quería sembrar.

---

## LO SEMBRADO — dos hallazgos, uno por rama

### 1 · Dra. Ana Belmonte — la DEGRADACIÓN del punto 4

| | `Clínica` | `Especialidad` | `Turno` | horas |
|---|---|---|---|---|
| RRHH-08 | Chamberí | Endodoncia | **Mañana** | 32 |
| OPE-13 | Chamberí | Endodoncia | **Tarde** | 32 |

Dos columnas compartidas **coinciden** (el ancla) y una **difiere** (la
oposición). R2 devuelve `confirm` con `anclas = [Clínica, Especialidad]`, y
`destinoSinClave` → **`degradar_a_juicio`**.

**Es la rama que no se ha visto nunca**, ni en batería ni en producción (B.131).
Debe salir por `a_juicio.sin_clave` y llegar a la llamada corta.

### 2 · Dr. Carlos Medina — el caso de B.130

| | `Horas semana` | `Jornada semanal` |
|---|---|---|
| RRHH-08 | **44** | — |
| OPE-13 | — | **40** |

Las tres columnas compartidas **coinciden todas**; la discrepancia está en dos
columnas que **se llaman distinto**. Con la regla vieja esto era
`'equivalentes'` y el hallazgo desaparecía afirmando que las dos filas dicen lo
mismo. Con B.130 arreglado, R2 devuelve `pass` nombrando las asimétricas y debe
salir por **`a_juicio.columna_no_comparada`**.

**Es una contradicción REAL que el diff no puede ver nunca**, porque empareja
columnas por igualdad de nombre (F-78, sin fuzzy, deliberado).

### Las otras doce filas

**Coinciden en todo lo compartido y en las horas.** No son relleno: son el
control negativo del par. Cualquier hallazgo sobre ellas es un falso positivo.

⚠️ **Pero ojo al leer el contador**: las doce dan `pass` con columnas
asimétricas igual que Carlos Medina, porque `Profesional`/`Responsable` y
`Horas semana`/`Jornada semanal` son asimétricas en **todas** las filas. Si el
juez enfrenta cualquier fila, `a_juicio.columna_no_comparada` se mueve. **Lo que
distingue a Carlos Medina no es la rama, es que él lleva una discrepancia real
detrás** — la llamada corta debería confirmarlo a él y solo a él.

---

## Lo que esta siembra NO puede garantizar

**Que el rerank deje pasar el par.** Es la barrera que invalidó la pasada extra
del 31/08: RRHH-06 llegó al retrieval y el rerank lo descartó, así que el juez
no lo vio nunca. Aquí los dos documentos hablan de las mismas personas, las
mismas clínicas y las mismas especialidades, que es mucho más cerca que un
tarifario contra unas evaluaciones — pero **la similitud de embeddings no se
puede calcular sin lanzarlo**. Es la única condición de la lista que no se
verificó antes de gastar créditos.

**Que el juez emita el hallazgo.** B.82: es intermitente. Si en una pasada no
sale, no significa que la rama no funcione — significa que el juez no habló. Y
un cero se reporta con la tasa que excluye, nunca como ausencia (F-92).

---

## Verificado antes de subir nada — la sonda

Todo lo de arriba se comprobó **con los ficheros delante y sin gastar un
crédito**, que es la lección de B.129: allí se planificó una pasada que no podía
producir el caso, y se descubrió calculándolo, no lanzándolo.

Comprobado: estructura y tamaños · columnas compartidas exactas · unicidad
simple y compuesta contra el umbral · `pares = 0` en las dos direcciones ·
Belmonte da `confirm` con ancla no vacía y destino `degradar_a_juicio` · Medina
da `pass` con las asimétricas nombradas.
