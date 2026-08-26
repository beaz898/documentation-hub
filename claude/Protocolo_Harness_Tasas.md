# Protocolo del harness de tasas

*Escrito el 26/08/2026. Hasta hoy el harness se lanzaba de memoria: la bitácora
y `Cierre_B81.md` decían «cinco casos, protocolo fijo» sin decir cuál era el
protocolo. Este fichero lo fija.*

---

## ⚠️ ANTES DE NADA: «línea de base» significa dos cosas distintas

En la documentación de este proyecto la expresión se usa con **dos sentidos
opuestos**, y quien cruce los dos documentos sin saberlo creerá que uno miente:

| Dónde | Qué significa | Ejemplo |
|---|---|---|
| `claude/Cierre_B81.md` §3 | El estado **ANTES** de la cura. Es el retrato del **síntoma**. | `OPE-02 → RRHH-06: 0/4` — la dirección que NO detectaba |
| Los documentos de relevo | Lo medido **DESPUÉS**, el estado sano del que se parte | `OPE-02 → RRHH-06: 3/3` o similar |

Un `0/4` en `Cierre_B81.md` **no es una regresión**: es la enfermedad
documentada. Si al comparar una medición nueva con «la línea de base» sale que
todo ha mejorado muchísimo, probablemente se esté comparando contra el síntoma.

**Al citar una tasa, decir siempre contra qué commit se midió.**

---

## ⚠️ REGLA DE ADMISIÓN: ninguna medición cuenta sin su ground truth en el repositorio

*Añadida el 27/08/2026, tras la tercera pérdida de evidencia en una semana.*

> **Una medición cuyo ground truth no esté en el repositorio NO cuenta.** No se
> cita, no se compara contra ella, no se usa para aprobar ni para revertir un
> commit. Se vuelve a medir cuando la evidencia esté dentro.

«Ground truth» es todo lo necesario para reproducir la medición sin la memoria
de nadie: **los documentos** sobre los que se midió y el **registro de qué debía
encontrarse** en ellos. Si un par se mide sobre ficheros que solo existen en un
disco local o en una carpeta de Drive, la tasa no es verificable: es un recuerdo
con forma de fracción.

**POR QUÉ ESTÁ AQUÍ.** No es prudencia abstracta. En una sola semana la
evidencia faltó **tres veces**, siempre en el momento de ir a usarla:

| Qué faltó | Cuándo se descubrió | Cómo acabó |
|---|---|---|
| La tabla «LÍNEA DE BASE MEDIDA (harness, 25/08, `e43fbc8c`)» del documento de relevo | 26/08, al ir a comparar contra ella | **Perdida.** Buscada por título, por `e43fbc8c` y por `Belmonte`: sin resultado. Ver §5 |
| La batería de casos de F-65 (descarte de filas ajenas) | 27/08, al ir a implementar el predicado | **Recuperada**, escribiéndola en `claude/Descarte_Filas_Ajenas.md` antes de tocar código |
| `SIEMBRA_corpus_ampliado.md` y los cuatro documentos del corpus ampliado | 27/08, al analizar los falsos negativos de prosa (F-76) | **Recuperada**, creando `corpus-pruebas/` |

Tres veces en siete días no es mala suerte: es lo que pasa por defecto cuando el
sitio donde vive la evidencia es «fuera». El único sitio que sobrevive a un
cambio de máquina, a un vaciado de Drive y a la memoria del que midió es el
repositorio.

**Consecuencia práctica**: antes de lanzar una tanda, comprobar que los
documentos y su registro de siembra están commiteados. Si no lo están, subirlos
es el **primer** paso de la medición, no el último.

### Dónde vive el material de prueba

**`corpus-pruebas/`, en la raíz del repositorio.** Ahí están los documentos del
corpus ampliado y su registro de siembra.

**NUNCA en `public/`, y esta es una trampa fácil de pisar.** Todo lo que entra
en `public/` lo sirve Vercel abierto en internet, sin autenticación: un
documento clínico de muestra colocado ahí queda descargable por cualquiera que
acierte la URL, e indexable. Es la carpeta que uno elige por instinto para
«ficheros que no son código», y es justo la que no hay que usar.

---

## 1. Para qué sirve

La regla que fijaron F-59 y F-61, y que este harness existe para hacer cumplible:

> **Nada que toque lo que un MODELO LEE entra sin su tanda.**

El criterio de reparto:

- **Cambio de CÓDIGO que no toca lo que un modelo lee** → `npm run typecheck`
  (raíz y worker) y su batería determinista. Sin tasas. Ejemplos: `e43fbc8c`
  (la alineación posicional, medida con 250 citas deterministas), `d384a315`
  (transporte de campos).
- **Cambio de PROMPT, de PRESENTACIÓN o de FORMATO de lo que se le entrega a un
  modelo** → tanda de tasas, obligatoria. Ejemplos: `de158abd` (una línea del
  prompt del juez), `7cb7038d` (el formato barato de tabla).

El motivo está en `Cierre_B81.md` §3: sin tasas, el 24/08 se revirtieron dos
commits **correctos** (`d51001f3` y `fa5c4adc`) porque una tanda posterior no
emitió. La correlación era ruido. Una ejecución suelta no distingue una racha de
un régimen.

---

## 2. Los casos

**Cinco**, sobre el corpus piloto dental (`E:\doclity-muestras` y la carpeta de
Drive del piloto):

| # | Caso | Documentos | Qué debe dar |
|---|---|---|---|
| 1 | Tabla, dirección A | Analizar **RRHH-06** contra **OPE-02** | Contradicción en `Puesto` de Dr. Pablo Reyes: `Implantólogo` frente a `Implantólogo / Cirujano oral`. Confirmada **por estructura** |
| 2 | Tabla, dirección B | Analizar **OPE-02** contra **RRHH-06** | Lo mismo, con los lados intercambiados. **Es la dirección que falló tres semanas** (B.81) |
| 3 | Prosa, dirección A | Analizar **CLI-03** contra **NOR-01** | Contradicción en la conservación de la historia clínica: **15 años** frente a **5 años**. Confirmada por juicio |
| 4 | Prosa, dirección B | Analizar **NOR-01** contra **CLI-03** | Lo mismo, lados intercambiados |
| 5 | Control negativo | **MKT-01** **con los otros cuatro** en la tanda | **Cero hallazgos.** Es el único caso cuyo criterio no es una fracción |

**El falso positivo de Belmonte NO es un sexto caso**: es una comprobación que
se aplica **dentro de los casos 1 y 2**. Consiste en mirar si, además de la
contradicción correcta, aparece una espuria del tipo «Horas semanales de Dra.
Ana Belmonte» — título que anuncia una discrepancia de horas que las citas no
contienen, con citas como `Fecha evaluación: 2026-06-11` contra `Horas semana: 8`
(dos datos distintos que el propio prompt pone como ejemplo de lo que NO es
contradicción). Está documentado en **B.82**. Su histórico: `4/4` con el ejemplo
viejo del prompt, `1/4` tras la cura `de158abd`.

**Nombres de fichero exactos**:

```
RRHH-06_evaluacion-del-desempeno.xlsx
OPE-02_agenda-y-gestion-de-citas.xlsx
CLI-03_historia-clinica-consentimiento-informado.txt
NOR-01_rgpd-proteccion-datos-pacientes.pdf
MKT-01_manual-identidad-corporativa.docx
```

### El caso 5 va CON COMPAÑÍA, y es lo contrario de una excepción al vaciado

MKT-01 se lanza **con los otros cuatro documentos del harness en la misma
tanda**, no solo. El motivo importa más que la regla:

> Con corpus vacío y MKT-01 solo, «cero hallazgos» es **trivialmente cierto** y
> no prueba nada — no hay contra qué equivocarse. Lo que este caso mide es que
> el sistema **NO inventa hallazgos teniendo material delante**, y para eso
> necesita material delante.

Un control negativo sin nada que comparar no es un control: es una pregunta sin
enunciado. Por eso los cuatro documentos del harness son parte del caso 5, no
contaminación de él.

Los casos 1 a 4 son lo contrario: cada par se mide **aislado**, porque lo que
miden es una detección concreta entre dos documentos y cualquier tercero cambia
lo que el retrieval y el rerank ven.

### Los casos 6 a 9: el corpus ampliado

Los cinco casos de arriba son el corpus piloto dental: tablas de 15 filas y
prosa corta. El corpus ampliado añade **documentos de tamaño real** y siembra
deliberada, y es el primero que mide lo que la lista de cierre (§4-bis) venía
declarando como dominio NO cubierto: **prosa larga**.

| # | Caso | Documentos | Qué debe encontrar |
|---|---|---|---|
| 6 | Tabla ampliada, dirección A | Analizar **OPE-10** contra **OPE-11** | Las **15** discrepancias sembradas, con la columna concreta que difiere en cada una. Y **25 filas propias sin pareja** que no debe forzar |
| 7 | Tabla ampliada, dirección B | Analizar **OPE-11** contra **OPE-10** | Las mismas 15, lados intercambiados. Y sus **25 filas `SEG-` sin pareja** |
| 8 | Prosa larga, dirección A | Analizar **NOR-10** contra **CLI-12** | Las **3** contradicciones sembradas: responsable de la esterilización, periodicidad del control biológico, caducidad del material |
| 9 | Prosa larga, dirección B | Analizar **CLI-12** contra **NOR-10** | Las mismas 3, lados intercambiados |

**El registro de siembra manda.** Este protocolo da el número y la dirección;
qué dice exactamente cada siembra, en qué página y apartado está, y cuál es su
par en el otro documento, se lee en
**`corpus-pruebas/SIEMBRA_corpus_ampliado.md`**. No se duplica aquí para que no
puedan divergir.

**Nombres de fichero exactos** (literales de los logs de ingesta):

```
NOR-10_protocolo-esterilizacion-instrumental.docx
CLI-12_manual-calidad-clinica.docx
OPE-10_tarifario-tratamientos-2026.xlsx
OPE-11_tarifario-tratamientos-seguros.xlsx
```

**Tamaños**: NOR-10 y CLI-12 son `.docx` de ~60.000 y ~51.000 caracteres (18 y
17 páginas). OPE-10 y OPE-11 son `.xlsx` de 60 filas cada uno, estructurados de
forma simétrica: 35 comunes (20 idénticas + 15 discrepantes) y 25 exclusivas por
lado. Es un orden de magnitud por encima del corpus piloto, y por eso estos
cuatro casos no son «más de lo mismo»: miden el régimen que el piloto no
alcanza.

**El control negativo va dentro de los casos 6 y 7**, como el falso positivo de
Belmonte va dentro del 1 y el 2: las 25 filas exclusivas de cada lado no deben
producir hallazgo. Las de OPE-11 comparten todas el valor `Chamberí` en
`Clínica`, sembrado a propósito para ver si un valor repetido se confunde con
una señal de coincidencia.

#### LÍNEA DE BASE — es el síntoma, no el objetivo

Primera medición del corpus ampliado, **26/08/2026, logs 21:37–21:48 UTC
(23:37–23:48 hora local), sobre el commit `87a76112`**:

| Caso | Sembradas | Publicadas |
|---|---|---|
| Tablas, una dirección | 15 | **1** |
| Tablas, la otra dirección | 15 | **2** |
| Prosa larga | 3 | **0** |

Léase con la advertencia del principio del fichero: esto es **la enfermedad
documentada**, el estado del que se parte, no una tasa sana. Una medición
posterior que dé más que estas cifras no prueba que nada se haya arreglado
mientras no cumpla §3 (cuatro pasadas por dirección).

**Lo que ya se sabe de por qué**, del análisis de F-76 sobre los dos casos de
prosa que se rastrearon hasta el final: los dos hallazgos murieron **después**
de que el juez los emitiera —uno en el verificador corto, como
`mismo_dato_sin_oposicion`; otro en la verificación de cita, como
`citaNoVerificable`—, pero por debajo hay un cuello anterior. De **66**
fragmentos recuperados de NOR-10 entraron **3**: unos 2.800 caracteres de
60.000, el **4,7 %** del documento. En prosa la selección es **solo score de
embedding y presupuesto**: no hay pertenencia por valor ni colapso de idénticas,
que es lo que F-73 midió como el mecanismo que hace posible la detección en
tablas.

---

## 3. Cómo se lanza

Fijado por el director el 26/08:

- **Desde la bandeja de revisión, modo rápido.**
- **Los dos documentos de un par van marcados en la MISMA tanda.** El corpus
  activo está vacío, así que lo que entra en la tanda **ES** el corpus de esa
  ejecución. (Mecanismo: la bandeja manda `batchDocumentIds` con los ids de los
  otros documentos seleccionados, y `buildCorpusFilter` los añade al corpus
  consultado aunque estén en `pendiente`.)
- **Se vacía el corpus entre pares** (casos 1 a 4). No vaciar cambia las
  condiciones: un par que se mide con documentos ajenos en la tanda no está
  midiendo la detección entre esos dos, porque el retrieval y el rerank ven otra
  cosa. El caso 5 es la excepción razonada, y por el motivo opuesto: ver §2.
- **Cuatro pasadas por dirección** cuando se comparen tasas entre estados
  distintos del código. **Una pasada basta** para comprobar que algo no se ha
  roto, pero **NO** para afirmar que una tasa cambió: B.81 era intermitente y
  una pasada buena no distingue «arreglado» de «hoy tuvo suerte».
- **org_id de pruebas**: `5a82712f-6740-4792-b291-3fdea8e6edb1`.

---

## 4. Qué se apunta de cada pasada

Por cada ejecución:

- **Caso y dirección** (cuál es el analizado y cuál el del corpus).
- **Commit** sobre el que se mide, con su hash corto. Sin esto la tasa no
  significa nada (ver la advertencia de arriba).
- **Hallazgos emitidos**: cuántos, con su `topic` y su `confirmedBy`
  (`estructura` / `juicio` / `double_check`).
- **Falsos positivos**, si los hubo, con su título.
- **Tiempo** de la ejecución. Fue la firma del fallo en B.81 y la de la cura:
  2,2 s cuando descartaba sin comparar, 5,8-6,8 s cuando comparaba de verdad.
- **`discardedFindings`** del log, en particular `columna_indeterminada` y
  `citaNoVerificable`.
- **Caídas de etapa**: desde `38d3fd22`, si el análisis trae `stageFailures`,
  **la pasada no vale** — el LLM falló y las tasas no miden lo que se cree.

**Dónde se acumulan las tandas**: en **`claude/Tandas_Harness.md`**, una entrada
por tanda, **creciendo por arriba** — lo más reciente primero. Ese fichero es el
histórico y no repite este protocolo; este protocolo no repite sus cifras.

Antes de que existiera, el resultado se copiaba a mano al mensaje de commit o a
la bitácora, y así se perdió la tabla del relevo del 25/08 (ver §5).

**De dónde salen los datos**: cada análisis se persiste en `analysis_results`
(columna `analysis`, jsonb, con el `FinalAnalysis` entero) y en los logs de
Vercel. La consulta que se ha venido usando:

```sql
select created_at, document_name, contradictions_found, contradictions_confirmed,
       recommendation, analysis
from analysis_results
where org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
order by created_at desc limit 10;
```

---

## 4-bis. La lista de cierre (F-74 P5)

**Antes de dar una conclusión por cerrada, se escriben estas dos cosas — aunque
no se midan ese día.** Escribirlas es obligatorio; medirlas, no. El valor está
en que la pregunta quede planteada por escrito, porque una conclusión con su
límite anotado es útil y una conclusión sin él es una trampa para quien la lea
dentro de dos meses.

**1. El caso extremo.** *«¿Qué pasa si en vez de uno hay cuarenta?»*
Toda tasa se mide sobre un tamaño concreto. Decir cuál es, y qué se espera —o
qué se ignora— al multiplicarlo por diez.

**2. El dominio no cubierto.** *«¿Sobre qué NO generaliza esto?»*
Todo lo que este harness mide hoy es **una tabla de Excel**. Un hallazgo sobre
prosa larga, sobre un PDF escaneado o sobre una tabla de noventa filas no está
medido por el hecho de que este par lo esté.

**POR QUÉ ESTÁ AQUÍ**: en F-73 estos dos huecos existían y **no aparecieron
hasta que el director preguntó**. La conclusión del experimento —que lo que
detecta es el colapso de idénticas— se había dado por cerrada sin anotar que
descansaba en una tabla de 15 filas (caso extremo) ni que todo el corpus medido
son hojas de cálculo (dominio). Las dos plantillas los habrían cazado sin que
nadie tuviera que acordarse.

---

## 5. Las mediciones

El histórico completo, con sus cifras y sus anomalías, está en
**`claude/Tandas_Harness.md`**, con la más reciente arriba.

**La medición del corpus ampliado (casos 6 a 9) no está aquí ni en
`Tandas_Harness.md`: está en §2**, junto a los casos que mide, porque es su
línea de base y se lee con ellos. Es del **26/08/2026, 21:37–21:48 UTC, sobre
`87a76112`** — posterior a la que sigue.

La del corpus piloto: **26/08/2026, sobre `a775a7c7`** — tabla y prosa detectadas en las
dos direcciones, MKT-01 limpio, cero falsos positivos, cero
`columna_indeterminada`, sin fallos de LLM. **Una sola pasada por caso**, así
que confirma que nada se rompió con F-69/F-70 pero **no** afirma que ninguna
tasa se haya movido.

### Mediciones anteriores documentadas fuera de ese fichero

| Fecha | Commit | Dónde está |
|---|---|---|
| 25/08 (antes de la cura) | `6eafdc84` | `Cierre_B81.md` §3 — **es el síntoma**, ver la advertencia |
| 25/08 (después de la cura) | `de158abd` | `Cierre_B81.md` §6 |
| 22/08 | — | `B.89` en `Puntos_Pendientes_Doclity.txt`, con su método escrito. Es el precedente que este fichero imita |

**PERDIDA**: la tabla titulada «LÍNEA DE BASE MEDIDA (harness, 25/08, estado
`e43fbc8c`)` que figuraba en un documento de relevo **no está en el
repositorio** — buscada el 26/08 por su título, por `e43fbc8c` y por
`Belmonte`, sin resultado. Solo existió fuera. Es la razón concreta de que este
fichero exista.
