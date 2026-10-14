# EL HALLAZGO — EL JUEZ EMITE LA CONTRADICCIÓN EN UNA CAJA SIN DEFINIR

> ⚠️ **COPIA DE SEGURIDAD DE EVIDENCIA.** Las salidas de `SQL_F123_07` y
> `SQL_F123_08` NO están archivadas en el repositorio: Code avisó tres veces de
> que no le llegaron. Este fichero es, a 11-12/10/2026, su única copia junto con
> la conversación. Escrito por el arquitecto el 12/10/2026. No se modifica: si
> hay que corregir algo, se añade debajo con su fecha.

## Qué se buscaba

Cerrar el recorrido completo de la pareja NOR-11 ↔ CLI-13 sin hipótesis: saber
en qué tramo exacto se pierden dos de las tres contradicciones sembradas.

Las cinco pasadas rápidas de NOR-11 del 11/10/2026 (09:08 a 09:15), con el
corpus ya limpio de los 14 restos, dieron las cinco: retrieval 6 candidatos,
rerank 2 seleccionados (CLI-13 y CLI-12), pareja con CLI-13 en régimen
`pareja_entera` con **analizado 14.704/14.704 y candidato 9.817/9.817** —los dos
documentos enteros—, 1 contradicción emitida, 7 a 10 solapamientos, y la puerta
de citas matando **0** contradicciones.

---

## Lectura 1 — `SQL_F123_07`: las tres frases SÍ están en el texto

Control: OK en sus cuatro filas (las dos frases de PLAZO aparecen, y hay una
sola fila de cada documento en `documents`).

| trampa | documento | trozo | pos | contexto literal |
|---|---|---|---|---|
| LUGAR · «chamberi» | NOR-11 | **8** | 378 | «…res clínicas de la red.\n\nEl gestor autorizado recoge los residuos de las tres clínicas en un punto de retirada centralizado, **ubicado en la clínica de Chamberí**, desde donde se coordina y documenta el transporte del material recogido en Salamanca y Retiro hasta su destino final de tratamiento.\n\nCada c…» |
| LUGAR · «retiro» | CLI-13 | **6** | 134 | «# 5. Dónde se retiran los residuos\n\nEl punto de retirada centralizado para las tres clínicas de la red **se encuentra en la clínica de Retiro**, que es el centro de referencia logística de residuos sanitarios de Dentavia. Si trabajas en Chamberí o Salamanca y tienes dudas sobre una recogida, el interloc…» |
| NEGACIÓN · «contenedor negro» | CLI-13 | **9** | 646 | «…os residuos del grupo III (gasas, guantes y material de un solo uso que ha estado en contacto con sangre o fluidos de un paciente) **se depositan en el contenedor negro** habilitado en cada gabinete. Es el que más dudas genera al personal nuevo, así que si no lo tienes claro, pregunta antes de tirar nad…» |
| PLAZO (control) · «7 dias naturales» | CLI-13 | **2** | 167 | «…al de retirada\n\nRegla que hay que tener siempre presente: ningún contenedor de residuos del grupo III debe permanecer en el almacén intermedio más de **7 días naturales** desde que se cierra, aunque esté lleno antes de ese plazo…» |
| PLAZO (control) · «72 horas» | NOR-11 | **2** | 375 | «…or el gestor autorizado.\n\nEn concreto, los contenedores de residuos del grupo III no pueden permanecer en el área de almacenamiento intermedio más de **72 horas** desde el momento en que se cierran…» |

**Conclusión:** el registro de siembra es válido. El sistema pierde
contradicciones reales, no inventadas. Y un hecho de posición: la única que
encuentra está en el **trozo 2 de los dos documentos**; las dos que falla están
en los trozos 8/15, 6/11 y 9/11.

---

## Lectura 2 — `SQL_F123_08`: qué dijo el juez, entero

Pasada del **11/10 09:08:33 UTC**. Control OK en sus cuatro filas (5 pasadas ese
día, 1 pareja con CLI-13, 1 contradicción y 7 solapamientos, cuadrando con el
log).

### Contradicción emitida: 1

**«Plazo máximo de almacenamiento de residuos grupo III»** ·
`severity: contradiction` · `confirmedBy: juicio`
- nuevo: «los contenedores de residuos del grupo III no pueden permanecer en el área de almacenamiento intermedio más de 72 horas desde el momento en que se cierran»
- existente: «ningún contenedor de residuos del grupo III debe permanecer en el almacén intermedio más de 7 días naturales desde que se cierra»

### Solapamientos emitidos: 7, todos «del juez»

1. Clasificación de residuos en cuatro grupos (I, II, III, IV) con descripción de cada uno
2. **Contenedores de color amarillo para residuos del grupo III (material punzocortante en contenedor rígido, otros residuos biosanitarios en bolsa)**
3. Criterio de clasificación por defecto ante dudas: aplicar la clasificación más exigente
4. Formación obligatoria del personal antes de manipular residuos de grupos III y IV
5. Procedimiento de actuación ante derrames con kit desechable y documentación en parte de incidencias
6. Sustitución de contenedores cuando alcanzan las tres cuartas partes de capacidad
7. Documentación y archivo de albaranes de recogida durante mínimo cinco años

⚠️ Los solapamientos **1 y 2 citan el apartado 8 de CLI-13** —la chuleta, donde
está la frase del contenedor negro— y en los dos el juez escoge las líneas en las
que los documentos **COINCIDEN**:
- el 1 cita la chuleta completa: «Papel, cartón, envases sin contaminar → contenedor de basura normal de la zona común. Gasas y guantes sin contacto con sangre → bolsa verde. Agujas, bisturís y fresas usadas → contenedor rígido amarillo, siempre, sin excepción. Residuos de medicamentos citotóxicos → contenedor azul del armario de medicación restringida.» — **sin la línea del grupo III no punzante, que es la de la trampa**;
- el 2 enfrenta «el resto de residuos biosanitarios especiales no punzantes… en bolsa de color amarillo» (NOR-11) con «Agujas, hojas de bisturí y fresas desechadas van siempre al contenedor rígido amarillo…, nunca a una bolsa» (CLI-13): el subtipo en el que sí coinciden.

### `uniqueToNewDoc`: 8 entradas

1. Especificación de que el cómputo de 72 horas se inicia en el momento exacto en que se cierra el contenedor, anotando la hora en la etiqueta
2. Detalle de que el plazo de 72 horas es el mismo para las tres clínicas y no admite excepciones por baja actividad
3. Procedimiento de coordinación logística entre clínicas para evitar saturación de capacidad del gestor autorizado
4. **«Punto de retirada centralizado ubicado en clínica de Chamberí (no Retiro como dice CLI-13)»**
5. Compromiso contractual del gestor autorizado de realizar recogida en plazo máximo de 24 horas desde solicitud
6. Procedimiento de revisión trimestral de buenas prácticas por Coordinador de Calidad mediante observación directa
7. Protocolo específico para actuación ante discrepancias entre contenedores solicitados y recogidos
8. Registro de asistencia a formación anual en expediente formativo individual con posibilidad de suspensión temporal de habilitación

### Veredicto de la pareja

`overlapPercent: 35 · verdict: tema_similar`

---

## EL HALLAZGO

**La entrada 4 de `uniqueToNewDoc` ES la contradicción LUGAR.** El juez la
detecta, compara los dos valores y escribe él mismo el conflicto —«**no Retiro
como dice CLI-13**»— y la emite en una lista que **no es de hallazgos**: no pasa
por la puerta de citas, no se verifica, no se publica y no la mira nadie.

No es que no la vea. La ve, la dice, y la archiva en un cajón que no se abre.

Y NEGACIÓN es el caso opuesto: **no aparece en ninguna parte de la salida** —ni
en contradicciones, ni en los 7 solapamientos, ni en `uniqueToNewDoc`— con el
agravante de que el juez citó dos veces el apartado donde está.

---

## EL PORQUÉ, LEÍDO EN EL PROMPT (`lib/analysis/judge.ts`)

Las otras tres cajas tienen definición explícita:

- **:800** — «1. "Solapamiento" significa contenido que se [repite] con palabras distintas. NO significa compartir tema general.»
- **:801** — «2. "Contradicción" significa que ambos documentos [afirman cosas INCOMPATIBLES] sobre el mismo dato concreto. Es decir: es IMPOSIBLE que ambas afirmaciones sean verdaderas.»
- **:802** — «3. "Inconsistencia menor" significa que ambos [tratan el mismo] tema con enfoques, matices o énfasis diferentes, pero no son estrictamente incompatibles.»

**`uniqueToNewDoc` NO TIENE DEFINICIÓN.** Sólo aparece en el esquema de respuesta
(`:864`) como:

```
"uniqueToNewDoc": ["aspecto 1", "aspecto 2"]
```

Lo único que el modelo sabe de esa caja es **su nombre**: «exclusivo del
documento nuevo». Y «el punto de retirada está en Chamberí» es, a la letra, algo
que sólo dice el documento nuevo. **Nada en el prompt le dice que lo que choca
con el existente va en `contradictions`.**

**El modelo no está fallando: está obedeciendo.** El defecto es del contrato, y
el contrato es nuestro.

Además:
- **`uniqueToNewDoc` no tiene tope**, ni en el prompt (`:850` acota
  contradicciones, inconsistencias y solapamientos, no esta lista) ni en el
  código, que la copia tal cual (`:884`). La sonda llegó a **48 entradas**
  (B.366).
- **Qué se hace hoy con ella**: se guarda en el juicio de cada pareja dentro del
  jsonb `analysis`; no se verifica ni se pinta. El resumen final que escribe el
  modelo **no la recibe** (su prompt sólo lleva contradicciones y solapamientos,
  `lib/analysis/synthesize.ts:241-245`). Sólo si esa síntesis falla, las **tres
  primeras** entradas pasan a `newInformation` (`:287-290`), que la pantalla
  enseña con el título «Información nueva»
  (`components/AnalysisModal.tsx:423-434`).

---

## EL CIERRE DEL RECORRIDO

| trampa | dónde se pierde | naturaleza |
|---|---|---|
| **PLAZO** | no se pierde | trozo 2 de los dos documentos, 5 de 5 publicada |
| **LUGAR** | **el juez la emite en `uniqueToNewDoc` en vez de en `contradictions`** | **pérdida DETERMINISTA y RECUPERABLE** — el dato está en la base, en cada pasada |
| **NEGACIÓN** | el juez no la menciona en ninguna parte | omisión del modelo |

Esto cierra, **con evidencia directa y no por descarte**, que para esta pareja no
se perdía nada en la selección de candidatos, ni en cuánto texto se lee, ni en la
puerta de citas. Las tres etapas que ocuparon las últimas dos semanas están
limpias para esta pareja.

## Lo que queda abierto

1. **¿Es sistemático?** Cuántas contradicciones más hay escondidas en
   `uniqueToNewDoc` en los análisis guardados, y si la entrada de LUGAR aparece
   en las cinco pasadas del 11/10 o sólo en la de 09:08.
   Lo mide `SQL_F123_09_contradicciones_disfrazadas_en_unique.sql`, pendiente.
2. **El arreglo de LUGAR**: es de contrato y es nuestro.
3. **El arreglo de NEGACIÓN**: es omisión del modelo, o sea prompt y estrategia.
   Es F-120 P2, el séptimo ejecutable que F-123 dejó debajo de la lista
   condicionado a que la medición 0.4 viera entradas idénticas entre pasadas
   buenas y malas. **Ya están vistas: cinco pasadas con entradas idénticas y la
   misma omisión las cinco veces.**

## Lección de método

El recorrido se cerró leyendo **la entrada y la salida completas del único tramo
donde se perdía algo**, no probando hipótesis. El arquitecto propuso seis causas
entre el 10 y el 11/10 y las seis fallaron; la que acertó no fue una causa
propuesta, fue una lectura. Exigencia del director, y queda como regla:
**primero el recorrido completo con la entrada y la salida delante; las
hipótesis, después o nunca.**

---

> **Añadido el 14/10/2026 (arquitecto).** Este fichero se escribió en el proyecto de Claude el
> 12/10/2026 y hasta hoy NO estaba en el repositorio; se trae porque es la única copia de las
> salidas de `SQL_F123_07` y `SQL_F123_08`. Nada de lo de arriba se modifica. Incidente de
> transporte: al traerlo, el pegado partió la línea del esquema de `uniqueToNewDoc` (sección «El
> porqué») y le cambió las comillas rectas por tipográficas; se restauró en el cuerpo —bloque de
> código cercado y comillas rectas— para que la copia coincida con el original. Lo que ha pasado
> después con sus tres puntos abiertos:
>
> 1. **Sí era sistemático, y acotado.** `SQL_F123_09` se ejecutó el 12/10: de **1.437** entradas de
>    `uniqueToNewDoc` en los análisis guardados, **7** nombraban al candidato de su propia pareja, y
>    las **7 eran esa misma contradicción real de LUGAR**. Cero falsos positivos: la señal
>    «la entrada nombra al documento existente» no se confunde con nada.
> 2. **El arreglo de LUGAR se hizo, y en dos tiempos.** La fase 1.0 de F-124 (commit `00ed4235`,
>    12/10) definió la caja en el prompt y sacó de ella lo que no le correspondía; eso subió el
>    marcador de 1 a 2 de 3 pero no publicó LUGAR, que seguía muriendo en la puerta de citas. Lo
>    cerró **F-126** (14/10): con la regla del tramo contiguo más corto, el juez copia en vez de
>    fabricar la frase y **LUGAR se publica 7 de 7**.
> 3. **El arreglo de NEGACIÓN también se hizo**, y fue la misma fase 1.0: se publica **7 de 7**
>    desde el 12/10. La segunda llamada dirigida que decidió F-124 sigue sin construir y ya no es
>    urgente (ver `claude/Estado_Y_Pendientes_14-10-2026.md`, punto 3.9).
>
> La lección de método del final se volvió a aplicar el 13/10 y volvió a funcionar: el recorrido de
> la fase 3.1 se cerró leyendo `citasAlTramo`, y la primera lectura del arquitecto —que el suelo de
> 40 caracteres mataba a LUGAR— la desmintió el propio dato.
