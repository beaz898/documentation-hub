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
| 5 | Control negativo | **MKT-01**, documento limpio | **Cero hallazgos.** Es el único caso cuyo criterio no es una fracción |

**El falso positivo de Belmonte NO es un sexto caso**: es una comprobación que
se aplica **dentro de los casos 1 y 2**. Consiste en mirar si, además de la
contradicción correcta, aparece una espuria del tipo «Horas semanales de Dra.
Ana Belmonte» — título que anuncia una discrepancia de horas que las citas no
contienen, con citas como `Fecha evaluación: 2026-06-11` contra `Horas semana: 8`
(dos datos distintos que el propio prompt pone como ejemplo de lo que NO es
contradicción). Está documentado en **B.82**. Su histórico: `4/4` con el ejemplo
viejo del prompt, `1/4` tras la cura `de158abd`.

**Nombres de fichero exactos** (corpus de muestra):

```
RRHH-06_evaluacion-del-desempeno.xlsx
OPE-02_agenda-y-gestion-de-citas.xlsx
NOR-01_rgpd-proteccion-datos-pacientes.pdf
```

**POR DECIDIR** — no consta en ningún documento del repositorio:

- El nombre de fichero exacto de **CLI-03** y de **MKT-01**. Aparecen citados
  por su código en la bitácora y en `Cierre_B81.md`, nunca con su nombre
  completo, y no están en `E:\doclity-muestras`.
- Si el caso 5 usa **solo** MKT-01 o si necesita compañía en la tanda para que
  el retrieval tenga contra qué buscar. Ver §3, el punto del vaciado.

---

## 3. Cómo se lanza

Fijado por el director el 26/08:

- **Desde la bandeja de revisión, modo rápido.**
- **Los dos documentos de un par van marcados en la MISMA tanda.** El corpus
  activo está vacío, así que lo que entra en la tanda **ES** el corpus de esa
  ejecución. (Mecanismo: la bandeja manda `batchDocumentIds` con los ids de los
  otros documentos seleccionados, y `buildCorpusFilter` los añade al corpus
  consultado aunque estén en `pendiente`.)
- **Se vacía el corpus entre pares.** Medido el 26/08: no vaciar cambia las
  condiciones — **MKT-01 se midió contra cuatro documentos en vez de contra
  ninguno**, que es una prueba distinta de la que se pretendía hacer.
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

**Dónde queda el resultado**: cada análisis se persiste solo en
`analysis_results` (columna `analysis`, jsonb, con el `FinalAnalysis` entero) y
en los logs de Vercel. La consulta que se ha venido usando:

```sql
select created_at, document_name, contradictions_found, contradictions_confirmed,
       recommendation, analysis
from analysis_results
where org_id = '5a82712f-6740-4792-b291-3fdea8e6edb1'
order by created_at desc limit 10;
```

**POR DECIDIR**: no hay ningún sitio donde se acumulen las tandas. Hoy el
resultado se copia a mano al mensaje de commit o a la bitácora, y por eso se
perdió la tabla del relevo del 25/08 (ver §5). Falta decidir si se anota en este
mismo fichero, en la bitácora, o en una tabla propia.

---

## 5. La última medición

**26/08/2026, sobre `a775a7c7`** (después de F-70, antes de F-71):

| Caso | Resultado |
|---|---|
| Tabla, las dos direcciones | Detectada. Columna `Puesto`, confirmada por **estructura** |
| Prosa, las dos direcciones | Detectada, confirmada por **juicio** |
| MKT-01 (control negativo) | **Limpio, cero hallazgos** — contra cuatro documentos |
| Falsos positivos de Belmonte | **Cero** |
| `columna_indeterminada` | **Cero** |
| Fallos de LLM | **Ninguno** |

**UNA sola pasada por caso.** Queda dicho para que nadie la lea como una
medición de cuatro: sirve para confirmar que nada se rompió con F-69/F-70, **no**
para afirmar que ninguna tasa se movió.

Y una anomalía del propio protocolo, anotada porque es la que motivó fijar el
vaciado: el caso de MKT-01 se midió **contra cuatro documentos**, no contra un
corpus vacío. El resultado (cero hallazgos) es bueno y probablemente más
exigente que la prueba pretendida, pero **no es la misma prueba**.

### Mediciones anteriores documentadas

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
