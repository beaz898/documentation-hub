# Cierre de B.81 — la historia completa

**Abierto** el 21/08/2026 como "asimetría del análisis" — destapado al medir el
paso 4d, junto a B.82 y B.83.
**Confirmado** el 23/08/2026 con un caso limpio (B.91).
**Cerrado** el 25/08/2026 como "una instrucción del prompt escrita sobre el caso
equivocado".

Este documento cuenta el caso entero para quien llegue después y no tenga que
reconstruirlo de la bitácora. La bitácora tiene el registro por sesión; esto
tiene el hilo.

---

## 1. El síntoma

Dos documentos del corpus piloto:

- **OPE-02** — cuadro de turnos. Una tabla de 10 filas: Empleado, Puesto, Box
  asignado, los seis días de la semana, Horas semana.
- **RRHH-06** — evaluaciones de desempeño. Una tabla de 15 filas: Empleado,
  Puesto, Clínica, Fecha evaluación, cuatro puntuaciones, Media, Comentarios.

Comparten dos columnas: **Empleado** y **Puesto**. Y comparten a diez personas.

Nueve de esas diez coinciden en las dos columnas. La décima no:

| | Puesto |
|---|---|
| OPE-02 | `Implantólogo / Cirujano oral` |
| RRHH-06 | `Implantólogo` |

Es **Dr. Pablo Reyes**, y es una contradicción real: la misma columna, la misma
persona, dos valores distintos.

El sistema la encontraba analizando RRHH-06. No la encontraba analizando
OPE-02. Siempre en la misma dirección, durante tres semanas.

---

## 2. El primer diagnóstico, que era razonable y era falso

B.81 se abrió con esta explicación:

> El juez recibe el documento NUEVO entero pero del EXISTENTE solo los
> fragmentos que el retrieval recuperó. Analizar A contra B NO es la misma
> operación que analizar B contra A. […] el juez no emite nada porque la fila
> correspondiente de RRHH-06 no está entre los fragmentos que se le muestran.

Era una explicación coherente con el diseño, verificable en el código, y
encajaba con los síntomas. **Y era falsa.** Hicieron falta cuatro experimentos
para demostrarlo, y ninguno de ellos era obvio de antemano.

Durante esas tres semanas se construyeron piezas importantes persiguiendo esta
hipótesis: el reparto por unidades (F-41), la pertenencia por valor (F-42), el
colapso de idénticas (F-43/F-44), el solapamiento estructural (F-45), el orden
verdadero de columnas (F-51), el formato barato de tabla (F-53), la alineación
posicional (F-56/F-61). Ninguna fue inútil — todas corrigieron defectos reales —
pero ninguna arregló este caso, porque el caso no estaba ahí.

---

## 3. Lo que hizo falta antes de poder investigar: una línea de base

Hasta el 25/08 el proyecto medía con **tandas sueltas**. Una ejecución daba un
resultado, se cambiaba algo, otra ejecución daba otro, y se atribuía la
diferencia al cambio.

Eso produjo al menos un error caro: el 24/08 se revirtieron dos commits
correctos (`d51001f3` y `fa5c4adc`) porque una tanda posterior no emitió. La
correlación era ruido y la lectura de horas en la que se apoyaba estaba
equivocada.

F-60 fue más lejos y concluyó que el caso era **probabilístico** — que el juez
emitía o no emitía con el mismo código y el mismo material.

**La línea de base con tasas demostró que no.** Cinco casos, N ejecuciones cada
uno, dos configuraciones distintas:

```
OPE-02 → RRHH-06:            0/4
RRHH-06 → OPE-02:            4/4
Prosa CLI-03/NOR-01:         3/3 en ambas direcciones
MKT-01 (documento limpio):   0 hallazgos
```

Mismo resultado en las dos configuraciones. **0/4 y 4/4 no son una moneda: son
dos comportamientos estables.** El caso era determinista, y por tanto tenía una
causa localizable.

Sin esta medición, cualquier experimento posterior habría sido ininterpretable.

---

## 4. Los cuatro experimentos

Regla que se siguió en los cuatro: **una sola variable, revert obligatorio,
predicción escrita antes de medir**. El árbol volvió byte a byte a su estado
anterior tras cada uno.

### F-64 y F-64b — la línea de contexto

Cuando nueve filas del candidato coinciden con filas del analizado, el colapso
(F-44) las sustituye por una línea:

```
[CONTEXTO — no citar: 9 filas coinciden en Empleado y Puesto: Dra. Marta Gil /
Odontóloga general, Dr. Javier Soto / Ortodoncista, ...]
```

**Hipótesis**: le estamos diciendo al juez que la columna Puesto cuadra — la
columna exacta donde vive la contradicción que no encuentra.

- **F-64** retiró la frase `"coinciden en Empleado y Puesto"`, conservando los
  nombres. Resultado: el overlap subió de 0% a 45% las cuatro veces y el juez
  dejó de responder `sin_relacion`. **Contradicciones: 0/4.**
- **F-64b** retiró también los valores, dejando solo el recuento. Resultado:
  overlap de vuelta a 0%. **Contradicciones: 0/4.**

**Línea descartada.** Pero encadenar los dos experimentos produjo el hallazgo
más valioso de los cuatro:

> La curva **0% → 45% → 0%** aísla los **NOMBRES** como la variable, no la frase.
> Los nombres valen 45 puntos de overlapPercent: le dicen al juez "estos
> documentos hablan de la misma gente". La línea de F-44 queda exonerada y
> confirmada en su función original.

Con los dos cambios juntos en un solo commit, ese dato habría sido invisible.

### F-65 — el presupuesto

La tabla de RRHH-06 son 4.574 caracteres y no cabía en el presupuesto de 3.000,
así que colapsaba: el juez veía **6 de 15 filas**. La de OPE-02 son 1.950 y
entraba entera — y esa dirección emitía 4/4.

**Hipótesis**: la diferencia es el material.

Se subió el presupuesto a 5.200 (la cuenta se corrigió antes de desplegar: 4.600
no bastaba porque faltaban el `table_summary`, 225, y la prosa que gana a la
tabla por score, 224; mínimo real 5.023). El log confirmó `nivel 1 (completa, 15
filas, 4799 chars)` y el juez recibió las quince filas.

**Resultado: 0/4. Y en 2,2 segundos — el mismo tiempo que con seis filas.**

Ese dato del tiempo fue el que cambió la investigación:

> No estaba mirando más y decidiendo que no. Decidía lo mismo **antes de mirar**.

**Material descartado del todo.**

### La copia con otro nombre

Comprobación del director, fuera del ciclo de experimentos: se subió una copia
idéntica de OPE-02 con otro nombre (ZZZ-02) y otro `document_id`, para descartar
que el orden alfabético o el orden de análisis influyeran.

Resultado idéntico. **Ni el nombre ni el orden.**

### F-66 — el campo de razonamiento

Con el árbol de diagnóstico podado, quedaba preguntarle al juez qué se dice a sí
mismo.

Dos decisiones de diseño, ambas tomadas **leyendo el código antes de escribir**:

1. El razonamiento va **dentro** del JSON, no en un bloque previo, porque
   `sanitizeJsonResponse` recorta desde el primer `{` o `[` — y las preguntas del
   razonamiento invitaban a citar filas como `[F3]`. El fallo habría sido
   intermitente, cayendo justo sobre la variable que se quería leer.
2. Y porque `callAnthropicJson` añade a todo prompt un sufijo que ordena
   *"Responde EXCLUSIVAMENTE con un objeto JSON válido […] sin explicaciones"*,
   concatenado **después** del prompt del juez. Un bloque externo habría
   competido con esa instrucción, y su ausencia habría sido ambigua.
3. **Primer campo, no último**: al final sería una justificación a posteriori de
   una decisión ya tomada.

**Dos resultados.**

El aviso escrito en el commit se cumplió: pedir razonamiento **cambió** el
comportamiento, no solo lo mostró. La dirección que emitía 4/4 dejó de emitir —
las dos a 0. Es la demostración empírica de que el balance emisión/contención del
prompt es real y sensible hasta al formato de la respuesta.

Y la confesión, **idéntica en las dos direcciones**:

> "las columnas que comparten son solo 'Empleado' y 'Puesto'. Los datos concretos
> en ambas tablas son de naturaleza completamente distinta y no pueden
> compararse. La coincidencia de empleados y puestos es complementaria, no
> contradictoria."

Identifica correctamente que Puesto es columna compartida — y acto seguido la
descarta razonando sobre el **tema** de las tablas.

---

## 5. La causa

`judge.ts:729`, un ejemplo escrito en **F-22** para matar un falso positivo real
(el de Nuria Ferrer: una fecha de evaluación comparada contra unas horas
semanales, columnas distintas, presentadas como contradicción):

```
- El mismo empleado con datos distintos en dos tablas de temas distintos
  (turnos y evaluaciones) no es contradicción: son datos complementarios sobre
  la misma persona.
```

Describe **por su nombre** el par de prueba del proyecto.

Y el prompt contenía, a la vez, la regla operativa que dice lo contrario:

> la contradicción exige que una misma columna tenga valores incompatibles en
> los dos textos

**Dos instrucciones que aplican al mismo caso y dicen lo contrario.** El juez no
tenía una regla: tenía dos y elegía. Qué lado ganaba dependía de detalles
frágiles — la dirección del análisis, cuántas filas veía, si se le pedía razonar.

Eso explica tres semanas de intermitencia sin necesidad de invocar
aleatoriedad. No era ruido: era **un empate resolviéndose distinto cada vez**.

Y llevaba semanas contradiciendo al **código**: R2 (`finding-rules.ts`) aplica
desde F-26 el criterio correcto — misma columna, valores distintos,
contradicción, sin importar de qué traten las tablas. Pero la capa barata no
puede confirmar lo que la instrucción mató antes de nacer.

---

## 6. La cura

Commit `de158abd`. **Una línea del prompt.**

```
- Dos tablas de temas distintos comparten a las mismas personas: que una tenga
  datos que la otra no tiene NO es contradicción — son complementarios (una
  fecha de evaluación y unas horas semanales no se comparan). Pero si la MISMA
  columna aparece en ambas con valores distintos para la misma persona — el
  mismo Puesto con dos valores — eso SÍ se reporta, aunque las tablas traten de
  temas distintos: puede haber razón legítima (contextos distintos) o error, y
  quien decide es el usuario, no tú.
```

Conserva la mitad que funcionaba (columnas distintas → complementarias; el falso
positivo de Nuria Ferrer sigue muerto) e invierte la que no.

Entró **sola**, sin la regla de emparejamiento de F-57, para no regalar la
atribución.

### Resultado

```
OPE-02 → RRHH-06:     0/4 → 3/3
RRHH-06 → OPE-02:     3/3 (no se movió)
Prosa CLI-03/NOR-01:  2/2 (no se movió)
Tiempo dirección que fallaba: 2,2 s → 5,8-6,8 s
```

> Sobre la prosa: en la línea de base figura como 3/3 y aquí como 2/2. **No es
> una bajada** — son tandas de distinto tamaño (3 ejecuciones en un momento, 2
> en otro), las dos al 100%. La prosa nunca se movió en todo el caso.

El tiempo era la firma del fallo y es la firma de la cura: **de descartar a
comparar de verdad.**

### El efecto Belmonte — validación, no colateral

El ejemplo viejo hacía **dos daños simétricos**: mataba un verdadero positivo Y
permitía un falso. El corregido arregla los dos.

- Desbloquea a Pablo Reyes: 0/4 → 3/3
- Reduce a Belmonte: 4/4 → 1/4

**Es la prueba de que la corrección fue al CRITERIO y no al caso.** Un parche
escrito para Pablo Reyes no habría tocado a Belmonte.

---

## 7. Lo que queda escrito

### Doctrina F-67 — presunción de aunamiento

Los datos de una misma entidad se presumen aunados entre documentos; toda
divergencia en columna compartida se reporta; **la legitimidad de la divergencia
la decide el usuario, no el sistema.**

> Si un documento dice mi puesto en una sede y otro dice otro puesto en otra
> sede, puede ser legítimo — o puede ser que esté mal escrito en uno de los dos,
> y quiero saberlo.

El "No es error" de la bandeja es la otra mitad: **el sistema señala, el humano
resuelve.**

### Doctrina F-65 — presupuesto por decidibilidad

El presupuesto se gasta en orden inverso a lo decidido:

1. Lo que la estructura **ya decidió** se colapsa a una línea de hechos.
2. Lo **indecidible** entra entero.
3. Entre lo indecidible, primero **lo que más cruza**.

Unifica cuatro piezas que nacieron sueltas y parecían independientes: el colapso
de idénticas (F-43), el descarte de ajenas (pendiente), la pertenencia como orden
(F-42) y las líneas de hechos (F-44).

### La moraleja

> El fallo estaba en **una frase**, pero encontrar QUÉ frase costó descartar con
> experimentos todo lo que no era. El grep no lo habría encontrado — la frase era
> **correcta para su caso original**. El método que parecía lento —una hipótesis,
> un experimento, un revert— era el camino más corto.

Corolario: **las instrucciones redactadas sobre el caso equivocado generalizan de
más.** La defensa es que todo cambio de prompt pase por el harness. Si hubiera
existido en F-22, este ejemplo habría enseñado su doble filo el primer día.

---

## 8. Lo que de verdad cierra B.81

No es que el caso esté resuelto. Es que **su clase entera de fallos ya tiene
detector**.

El harness de tasas queda como infraestructura permanente: cinco casos,
protocolo fijo, y una regla vigente para siempre —

> **Nada que toque lo que un modelo LEE entra sin su tanda.**

### Corrección al propio B.81

Su texto original diagnosticaba la causa como *"la fila correspondiente de
RRHH-06 no está entre los fragmentos que se le muestran"*. F-65 lo desmiente:
con las quince filas delante, 0/4. La asimetría del diseño que B.81 describe es
real y sigue documentada — pero **no era la causa de este caso**.

Esto queda escrito explícitamente porque **un pendiente con diagnóstico erróneo
es peor que uno sin diagnóstico**: alguien lo reabriría creyéndolo, y volvería a
perseguir el retrieval — que es exactamente lo que costó tres semanas.

---

## 9. Pendientes que salen de aquí

En el orden que fija F-68:

1. **Segunda mitad de la alineación** (lo que quedó de `fa5c4adc` al partirlo):
   retirar la sustitución de la cita y que R2 reciba las columnas como dato.
   Primero, porque el descarte de `citaNoVerificable` que apareció en la
   dirección recuperada es exactamente el daño que repara. Con harness.
2. **Descarte de filas ajenas** (F-65), con su batería propia y OPE-06 como
   caso: su tabla son 19.613 caracteres y topa antes el límite de 25 piezas, así
   que ese caso lo resuelve la selección, no el presupuesto.
3. **Regla de emparejamiento de F-57** ("emparejando por el nombre de la
   columna", y desde el formato barato esos nombres no están en las filas): el
   diagnóstico sigue siendo verdadero, pero ya no es sospechosa de esto. Con su
   tanda, o dentro de la fase 2.

---

## Índice de commits

| Commit | Qué |
|---|---|
| `2880d987` | [EXP F-64] la línea de contexto deja de nombrar las columnas |
| `32d1d907` | [EXP F-64b] tampoco lista los valores |
| `0894d8f9` | revert de los dos experimentos de la línea |
| `77dbc646` | [EXP F-65] presupuesto del candidato a 5.200 |
| `8f382e68` | revert del experimento del presupuesto |
| `78c9097c` | [EXP F-66] campo de razonamiento en el juez |
| `daaaa925` | revert del experimento del razonamiento |
| **`de158abd`** | **fix(prompt): el ejemplo se acota a columnas — LA CURA** |
