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

La última: **26/08/2026, sobre `a775a7c7`** — tabla y prosa detectadas en las
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
