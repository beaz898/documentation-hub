# Casos del harness de tasas

*Separado de `claude/Protocolo_Harness_Tasas.md` el 27/08/2026, cuando ese
fichero pasó de 400 líneas. Aquí van **los casos**: qué documentos entran en
cada uno, qué debe encontrar, y su línea de base medida. Allí sigue **el
método**: para qué sirve el harness, la regla de admisión, cómo se lanza una
tanda, qué se apunta de cada pasada y la lista de cierre.*

**Los tres ficheros no se repiten.** El método, en el protocolo. El catálogo,
aquí. Las tasas históricas, en `claude/Tandas_Harness.md`.

**La línea de base de cada caso viaja CON el caso**, no con el protocolo: una
cifra separada del caso que mide es una cifra que dentro de dos meses nadie
sabrá contra qué comparar.

| Grupo | Casos | Documentos |
|---|---|---|
| Piloto dental | 1 a 5 | RRHH-06, OPE-02, CLI-03, NOR-01, MKT-01 |
| Ampliado | 6 a 9 | OPE-10, OPE-11, NOR-10, CLI-12 |
| Control de superficies | 10 y 11 | NOR-11, CLI-13 |

Todos están en `corpus-pruebas/`, con sus registros de siembra
(`SIEMBRA_corpus_ampliado.md` y `SIEMBRA_caso_control.md`).

---

## Los cinco del corpus piloto

**Cinco**, sobre el corpus piloto dental. Los cinco documentos están en
`corpus-pruebas/` desde el 27/08 — antes solo existían en un disco local y en
una carpeta de Drive, que es justo lo que la regla de admisión vino a prohibir:

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
deliberada, y es el primero que mide lo que la lista de cierre (§4-bis del protocolo) venía
declarando como dominio NO cubierto: **prosa larga**.

| # | Caso | Documentos | Qué debe encontrar |
|---|---|---|---|
| 6 | Tabla ampliada, dirección A | Analizar **OPE-10** contra **OPE-11** | Las **15** discrepancias sembradas, con la columna concreta que difiere en cada una. Y **25 filas propias sin pareja** que no debe forzar |
| 7 | Tabla ampliada, dirección B | Analizar **OPE-11** contra **OPE-10** | Las mismas 15, lados intercambiados. Y sus **25 filas `SEG-` sin pareja** |
| 8 | Prosa larga, dirección A | Analizar **NOR-10** contra **CLI-12** | **4 contradicciones**: las 3 sembradas —responsable de la esterilización, periodicidad del control biológico, caducidad del material— **y la D, que nadie sembró** |
| 9 | Prosa larga, dirección B | Analizar **CLI-12** contra **NOR-10** | Las mismas 4, lados intercambiados |

**Ojo con la cuarta (casos 8 y 9)**: la contradicción **D** —si el Coordinador
de Calidad puede ser el propio Director Clínico: NOR-10 lo permite en 2.4,
CLI-12 lo prohíbe en 3.5— **no está sembrada**. Se descubrió el 27/08
investigando un descarte del juez, y el registro afirmaba hasta ese día que
fuera de las tres sembradas los documentos eran consistentes. **Detectarla es un
acierto**, no un falso positivo. Y vive en el apartado contiguo a la siembra A,
así que al contar hay que distinguir cuál de las dos es cada hallazgo: la A es
*quién responde*, la D es *si pueden ser la misma persona*. El detalle, en el
registro.

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

*El `0 de 3` de prosa se midió contra las tres sembradas, que era lo único que
el registro declaraba entonces. **La contradicción D no estaba contada** ni a
favor ni en contra: se descubrió al día siguiente. Una medición futura tiene un
denominador de 4, no de 3, y no es comparable con esta sin decirlo.*

Léase con la advertencia del principio del fichero: esto es **la enfermedad
documentada**, el estado del que se parte, no una tasa sana. Una medición
posterior que dé más que estas cifras no prueba que nada se haya arreglado
mientras no cumpla el §3 del protocolo (cuatro pasadas por dirección).

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

**REMEDIDO EL 31/08/2026 sobre `cceddf86`, tanda 3 — SIGUE EN CERO, y las dos
causas de muerte son LAS MISMAS.** Una pasada por dirección, aisladas (un solo
candidato en las dos):

| Dirección | Qué emitió el juez | Cómo murió |
|---|---|---|
| CLI-12 → NOR-10 | «Responsabilidad última de la esterilización» | `mismo_dato_sin_oposicion` |
| NOR-10 → CLI-12 | «Responsabilidad última en decisiones de esterilización» | `cita no verificable, lado=nuevo` |

Y el cuello del retrieval, idéntico cinco días después: `3 dentro, 63 fuera
(prosa 3/66), 2616/3000 caracteres`. Aquella medición decía «de 66 entraron 3,
el 4,7 %»; hoy son los mismos 66 y los mismos 3.

**NO ES REGRESIÓN**, y conviene que quede escrito porque la tanda del frente 1
lo hizo sospechar: el frente 1 no tocó la prosa ni pretendía tocarla.

**DOS AÑADIDOS A ESTA LÍNEA DE BASE, que hoy se ven y aquel día no se anotaron:**

1. **El denominador es 4, no 3.** Lo avisaba la nota de arriba —la contradicción
   D se descubrió al día siguiente—, así que la cifra de hoy es **0 de 4**.

2. **HAY UN SEGUNDO CUELLO, INDEPENDIENTE DEL RETRIEVAL, y no está en la nota de
   F-76: el documento ANALIZADO también se recorta.**

       "CLI-12": documento analizado truncado a 6000 de 60840   →  9,9 %
       "NOR-10": documento analizado truncado a 6000 de 73962   →  8,1 %

   Es `NEW_DOC_LIMIT_QUICK` (judge.ts:35), deliberado y solo del modo rápido. La
   nota de F-76 documenta el estrangulamiento del CANDIDATO; éste es del
   ANALIZADO. Sumados: **el juez compara ~8 % de un documento contra ~4 % del
   otro.** Con eso, que no encuentre las sembradas no necesita más explicación
   que la aritmética.
   No se sabe si el recorte del analizado estaba ya en `87a76112`: no se
   comprobó, y no se afirma.

### Los casos 10 y 11: el caso de control de superficies

Los casos 8 y 9 miden prosa larga; los 6 y 7, tablas grandes. **Este par mide
otra cosa: si el sistema razona por el MECANISMO o memoriza el patrón
superficial.** Todo lo confirmado hasta el 27/08 en prosa era sobre *quién ocupa
un cargo* (Director Clínico vs Coordinador de Calidad). Si solo detectara esa
forma, no sabríamos si detecta contradicciones o si reconoce un molde.

| # | Caso | Documentos | Qué debe encontrar |
|---|---|---|---|
| 10 | Control de superficies, dirección A | Analizar **NOR-11** contra **CLI-13** | Las **3** sembradas, **ninguna sobre personas ni cargos**: un plazo (72 h vs 7 días naturales), un topónimo (Chamberí vs Retiro) y una negación categórica (contenedor negro) |
| 11 | Control de superficies, dirección B | Analizar **CLI-13** contra **NOR-11** | Las mismas 3, lados intercambiados |

**Nombres de fichero exactos**:

```
NOR-11_gestion-de-residuos-sanitarios.docx
CLI-13_instrucciones-clinicas-residuos.docx
```

**El detalle está en `corpus-pruebas/SIEMBRA_caso_control.md`**, y ahí hay tres
cosas que hay que leer ANTES de contar una tanda de este par:

- **La coartada jerárquica**: los dos documentos declaran, en su propio texto,
  que prevalece NOR-11 y que CLI-13 no altera sus criterios. Un modelo puede
  leerlo como «hay jerarquía, no contradicción». Las confirmaciones se logran
  **pese** a eso.
- **La tensión sobre quién cierra el contenedor** no es una cuarta
  contradicción, pero un hallazgo sobre ella **no es un falso positivo**: sale
  del texto. Está anotada para que no se cuente al revés.
- La **siembra 3 es doblemente contradictoria**: además del color, los dos
  documentos discrepan sobre qué ES el contenedor negro.

**A diferencia del corpus ampliado, aquí la auditoría de consistencia es
COMPLETA**: 4 y 5 páginas, 163 líneas leídas enteras. Cuando el registro dice
«cero adicionales», no significa «no encontré más».

#### LÍNEA DE BASE — 27/08/2026, sobre `8cf73e23`

| Contradicción | Superficie | Resultado |
|---|---|---|
| 1 · 72 h vs 7 días | plazo | **CONFIRMADA** |
| 2 · Chamberí vs Retiro | topónimo | **CONFIRMADA** |
| 3 · contenedor negro | negación categórica | **EL JUEZ NUNCA LA EMITE** |

**2 de 3.** Y la lectura, que es lo que este par existía para dar: **el sistema
RAZONA por el mecanismo, no memoriza la superficie.** Dos superficies nuevas,
ninguna sobre roles, confirmadas. Con eso queda descartada la circularidad que
B.105 temía sobre el bloque de F-77.

**La tercera no contesta esa pregunta, porque muere antes**: no llega a
razonarse. El juez no la emite pese a tener el material delante —el descarte de
un solapamiento de esa misma pasada cita literalmente «contenedor negro
habilitado en cada gabinete»—. Es **B.106**, un techo distinto del de la
selección, y hasta que se resuelva, la superficie «negación categórica» sigue
**sin medir**.
