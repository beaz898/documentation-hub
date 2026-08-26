# SIEMBRA — Corpus ampliado Dentavia (ampliación piloto)

> **Nota del repositorio (27/08/2026).** Este registro se incorpora **literal**,
> tal como lo entregó su autor, con **una sola adición**: el bloque marcado
> «NOTA AÑADIDA AL REPOSITORIO» al final del §4, que documenta las 25 filas
> exclusivas de OPE-10 —verificadas leyendo los ficheros el 27/08/2026— y que el
> registro original no menciona. Nada más se ha tocado.

Registro de auditoría de los problemas sembrados deliberadamente en los cinco
ficheros de esta ampliación del corpus piloto Dentavia. Permite verificar los
resultados de un sistema de análisis documental sin necesidad de volver a
abrir los documentos originales.

Ficheros de esta ampliación:

1. `NOR-10_protocolo-esterilizacion-instrumental.docx` (18 páginas)
2. `CLI-12_manual-calidad-clinica.docx` (17 páginas)
3. `OPE-10_tarifario-tratamientos-2026.xlsx` (60 filas, hoja "Tarifas")
4. `OPE-11_tarifario-tratamientos-seguros.xlsx` (60 filas, hoja "Tarifas concertadas")
5. Este documento

---

## 1. Las tres contradicciones de prosa (NOR-10 vs CLI-12)

Sembradas deliberadamente, una cerca del principio, una hacia la mitad y una
cerca del final de **ambos** documentos. Fuera de estas tres, los dos
documentos son consistentes entre sí: cualquier otra cifra, plazo o
responsable que aparezca en ambos coincide.

### Contradicción A — Responsable último de la esterilización

| | Documento | Página | Apartado | Afirmación |
|---|---|---|---|---|
| Versión 1 | NOR-10 | **2** | 2.1 · Responsable último del cumplimiento | El responsable último del cumplimiento del protocolo de esterilización en cada centro es **el Director Clínico** de la clínica correspondiente. |
| Versión 2 | CLI-12 | **2** | 3.1 · Coordinador de Calidad: responsable último de la esterilización | El responsable último de la esterilización del instrumental en cada clínica es **el Coordinador de Calidad** del centro, "no el Director Clínico". |

**Naturaleza del conflicto:** dos figuras distintas señaladas como autoridad
última sobre el mismo proceso (esterilización), en el mismo tipo de decisión
(autorizar excepciones, firmar auditorías, retirar un autoclave de servicio).
No es una diferencia de matiz: CLI-12 niega expresamente que sea el Director
Clínico.

### Contradicción B — Periodicidad del control biológico del autoclave

| | Documento | Página | Apartado | Afirmación |
|---|---|---|---|---|
| Versión 1 | NOR-10 | **11** | 10.2 · Control biológico | El control biológico del autoclave se realiza **semanalmente, todos los lunes**, mediante indicador biológico con *Geobacillus stearothermophilus*. |
| Versión 2 | CLI-12 | **11** | 12.1 · Indicador de control biológico | El control biológico del autoclave se realiza con **periodicidad mensual, el primer día laborable de cada mes**, mediante el mismo tipo de indicador biológico. |

**Naturaleza del conflicto:** semanal frente a mensual — una diferencia de
frecuencia de 1:4, tajante y verificable.

### Contradicción C — Caducidad del material esterilizado y envasado

| | Documento | Página | Apartado | Afirmación |
|---|---|---|---|---|
| Versión 1 | NOR-10 | **16** | 13.4 · Caducidad del material esterilizado | El instrumental esterilizado y envasado en bolsa mixta papel-plástico mantiene su esterilidad durante un máximo de **6 meses** desde la fecha de esterilización. |
| Versión 2 | CLI-12 | **16** | 16.2 · Criterio de caducidad aplicado en auditoría | El material esterilizado y envasado se considera válido durante un periodo máximo de **12 meses** desde su esterilización. |

**Naturaleza del conflicto:** el doble de plazo (6 meses frente a 12 meses)
para el mismo tipo de envase y las mismas condiciones de almacenaje.

---

## 2. Las 15 filas discrepantes del Excel (OPE-10 vs OPE-11)

Mismo código y mismo tratamiento en los dos ficheros; difiere exactamente
**una** columna por fila. El resto de columnas de cada fila discrepante es
idéntico entre ambos documentos.

| Código | Tratamiento | Columna que difiere | Valor en OPE-10 (general) | Valor en OPE-11 (concertada) |
|---|---|---|---|---|
| DIA-02 | Revisión periódica | Duración (min) | 20 | 15 |
| DIA-04 | Ortopantomografía | Profesional asignado | Cristina Ibáñez | Sonia Prats |
| HIG-03 | Aplicación de flúor | Clínica | Salamanca | Chamberí |
| HIG-04 | Sellado de fisuras (por pieza) | Precio base | 25 € | 30 € |
| CON-03 | Empaste composite 3 caras | Duración (min) | 50 | 40 |
| CON-04 | Reconstrucción con perno | Profesional asignado | Dr. Carlos Medina | Dra. Marta Gil |
| END-03 | Endodoncia multirradicular | Precio base | 280 € | 260 € |
| END-04 | Retratamiento endodóncico | Clínica | Salamanca | Retiro |
| PRO-03 | Prótesis parcial removible | Duración (min) | 90 | 75 |
| PRO-04 | Prótesis completa superior | Precio base | 600 € | 540 € |
| IMP-03 | Regeneración ósea guiada | Profesional asignado | Dr. Pablo Reyes | Dra. Ana Belmonte |
| ORT-03 | Ortodoncia invisible (alineadores) | Clínica | Chamberí | Salamanca |
| EST-03 | Carilla de composite | Precio base | 180 € | 160 € |
| CIR-03 | Extracción de cordal incluido | Duración (min) | 45 | 60 |
| URG-03 | Reimplante dental de urgencia | Profesional asignado | Dra. Ana Belmonte | Dr. Pablo Reyes |

Reparto por columna afectada: **Precio base** → 4 filas (HIG-04, END-03,
PRO-04, EST-03) · **Duración (min)** → 4 filas (DIA-02, CON-03, PRO-03,
CIR-03) · **Profesional asignado** → 4 filas (DIA-04, CON-04, IMP-03,
URG-03) · **Clínica** → 3 filas (HIG-03, END-04, ORT-03).

---

## 3. Las 20 filas idénticas (copiadas tal cual de OPE-10 a OPE-11)

Mismo código, mismo tratamiento y mismo valor en **todas** las columnas en
ambos ficheros:

DIA-01 · DIA-03 · HIG-01 · HIG-02 · CON-01 · CON-02 · END-01 · END-02 ·
PRO-01 · PRO-02 · IMP-01 · IMP-02 · ORT-01 · ORT-02 · EST-01 · EST-02 ·
CIR-01 · CIR-02 · URG-01 · URG-02

---

## 4. Las 25 filas ajenas (solo existen en OPE-11)

Códigos con prefijo `SEG-` (tratamientos concertados específicos de
aseguradora), sin código ni tratamiento coincidente en OPE-10. **Las 25
tienen el valor "Chamberí" en la columna Clínica** — repetición deliberada
para comprobar que un sistema de análisis no confunde una columna con valor
repetido con una señal real de coincidencia entre documentos:

SEG-01 · SEG-02 · SEG-03 · SEG-04 · SEG-05 · SEG-06 · SEG-07 · SEG-08 ·
SEG-09 · SEG-10 · SEG-11 · SEG-12 · SEG-13 · SEG-14 · SEG-15 · SEG-16 ·
SEG-17 · SEG-18 · SEG-19 · SEG-20 · SEG-21 · SEG-22 · SEG-23 · SEG-24 ·
SEG-25

**Nota de estructura:** en OPE-11 las 60 filas (20 idénticas + 15
discrepantes + 25 ajenas) están **mezcladas**, no agrupadas por bloque, en
este orden de bloques:

```
B3 B1 B2 B3 B1 B2 B3 B1 B3 B2 B1 B3 B3 B1 B2 B3 B1 B2 B3 B1
B3 B2 B1 B3 B3 B1 B2 B3 B1 B2 B3 B1 B3 B2 B1 B3 B3 B1 B2 B3
B1 B2 B3 B1 B3 B2 B1 B3 B3 B1 B2 B3 B1 B2 B3 B1 B3 B2 B1 B3
```
(B1 = idéntica, B2 = discrepante, B3 = ajena; fila 1 a fila 60 de la hoja
"Tarifas concertadas", sin contar las filas de cabecera).

### NOTA AÑADIDA AL REPOSITORIO — OPE-10 también tiene 25 filas exclusivas

*Verificada leyendo los datos el 27/08/2026. No figura en el registro
original, que solo describe las filas ajenas de OPE-11.*

**La ajenidad es simétrica.** OPE-10 tiene sus propias 25 filas sin pareja en
OPE-11:

CIR-04 · CIR-05 · CIR-06 · CON-05 · CON-06 · DIA-05 · DIA-06 · END-05 ·
END-06 · EST-04 · EST-05 · EST-06 · HIG-05 · HIG-06 · IMP-04 · IMP-05 ·
IMP-06 · ORT-04 · ORT-05 · ORT-06 · PRO-05 · PRO-06 · URG-04 · URG-05 ·
URG-06

La estructura real de los dos ficheros es, por tanto, **la misma por los dos
lados**:

| | Comunes (20 idénticas + 15 discrepantes) | Exclusivas | Total |
|---|---|---|---|
| OPE-10 | 35 | **25** (CIR-04…URG-06) | 60 |
| OPE-11 | 35 | 25 (SEG-01…SEG-25) | 60 |

**Por qué importa para medir**: el §5 plantea el resultado esperado solo desde
el lado de OPE-11 («60 filas de OPE-11 clasificadas contra las 60 de
OPE-10»). Leído así, la dirección contraria —analizar OPE-10 contra OPE-11—
parece que debería emparejarlo todo, y no es cierto: **también tiene 25 filas
que no deben encontrar pareja**. Un sistema que fuerce coincidencias para las
CIR-04…URG-06 falla igual que si las forzara para las SEG-, y el criterio de
las dos direcciones es el mismo.

A diferencia de las SEG-, estas 25 **no comparten un valor único de Clínica**:
son continuación de las familias de código que ya existen en ambos ficheros
(CIR-, CON-, DIA-, END-, EST-, HIG-, IMP-, ORT-, PRO-, URG-), lo que las hace
más fáciles de confundir con las comunes por prefijo y por vocabulario.

---

## 5. Resumen — qué debería encontrar un sistema perfecto

**Prosa (NOR-10 vs CLI-12):**
- Exactamente **3 contradicciones**, ni más ni menos: responsable de la
  esterilización (Director Clínico vs Coordinador de Calidad), periodicidad
  del control biológico (semanal vs mensual) y caducidad del material
  esterilizado (6 meses vs 12 meses).
- **0 contradicciones adicionales** en el resto de contenido: cualquier otro
  hallazgo de tipo "contradicción" entre estos dos documentos es un falso
  positivo.
- Ambos documentos comparten de forma consistente (no contradictoria) datos
  como el ciclo estándar de autoclave a 134 °C/18 min, la validación anual de
  equipos, el mantenimiento técnico trimestral, la conservación de registros
  durante 5 años y la periodicidad trimestral de auditoría interna del área.

**Hojas de cálculo (OPE-10 vs OPE-11):**
- **20 filas** que un sistema de deduplicación debería marcar como
  coincidencia exacta / duplicado (bloque 1).
- **15 filas** que debería marcar como discrepancia parcial, identificando en
  cada caso la columna concreta que difiere (bloque 2).
- **25 filas** que debería reconocer como contenido exclusivo de OPE-11, sin
  forzar una coincidencia con OPE-10 solo porque comparten el valor
  "Chamberí" en la columna Clínica (bloque 3).
- **Total esperado:** 20 coincidencias + 15 discrepancias + 25 filas sin
  pareja = 60 filas de OPE-11 correctamente clasificadas contra las 60 filas
  de OPE-10.
