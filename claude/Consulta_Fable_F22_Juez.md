# CONSULTA A FABLE — F-22

**Asunto:** falsos positivos del juez. Evidencia de producción que puede afectar
al alcance del paso 5 del plan F-20.

**Protocolo:** última respuesta recibida F-21 (retirada del paso 3, un único
ciclo de resubida, dependencias del paso 4). Esta consulta continúa ese frente.

**Qué se pide:** NO un rediseño. Una decisión de alcance y orden antes de
escribir código, con datos que no existían cuando se diseñó el plan.

---

## 1. ESTADO DESDE F-21

Todo lo que F-21 indicó, hecho y verificado en producción:

- Ciclo único de resubida: completado. Confirmado antes de resubir que el
  esquema de chunk era el definitivo (`cells`, `sheet_name`, `table_id`,
  `row_index` se persisten completos), así que NO hubo cambio de esquema y
  `EXTRACTOR_VERSION` sigue en 1.
- La dependencia que señalaste (¿escribe chunks la rama versionar del sync?)
  verificada en código: **sí los escribe**, con la generación correcta, y el
  swap solo borra las inferiores. No había agujero.
- `mark-analyzed` corregido (`b8d0df63`). Registro SQL de F-20 reconstruido
  desde el esquema real (`b84cd317`).
- **Paso 4 partido en cuatro** al ver que tocaba tres frentes: 4a lectura de
  chunks (`20e5dfcc`), 4b consumo en `analyze-v2` (`44043be6`), 4c recorte del
  agente y 4d campos de tabla hasta el juez (ambos pendientes).
- B.77 corregido (`bf05e7de`): el muestreo del modo rápido recortaba a 40 los
  documentos con más de 80 chunks; con un chunk = una fila, eso era ignorar dos
  tercios de una tabla. Subido a 120.

**Causa raíz del "3 candidatos de 40", localizada:** el texto que llega a
`analyze-v2` por `directText` sale de `documents.full_text`, guardado con
`stripSegmentationMarkers` aplicado. Sin marcador, `chunkText` no entra en su
Camino 0 y corta por longitud, juntando ~13 filas por chunk. El mismo `.xlsx` se
analizaba bien o mal según el camino de entrada.

**Medición tras 4b (producción, modo rápido):** OPE-02 3→16 muestras, RRHH-06
6→19, OPE-06 25→114. Tiempos 8,9 s (OPE-02, 16 muestras) y 38,9 s (OPE-06, 114
muestras), dentro del maxDuration de 120 s. El coste de LLM NO
cambia con el número de muestras: las muestras solo generan embeddings y
consultas a Pinecone; rerank y judge trabajan sobre `newDocumentText` y están
topados en 1 + hasta 6 llamadas.

**Primera detección real entre tablas:** RRHH-06 contra OPE-02, fila a fila,
discrepancia correcta en el puesto de un empleado. Imposible con el troceado
viejo.

**Frente NOR-01 / CLI-03 (el falso negativo de los 5 vs 15 años):** AHORA SE
DETECTA, con las dos citas exactas. No se ha tocado nada de prosa, así que la
causa probable es el tamaño reducido del corpus de prueba (menos competencia por
las 6 plazas del rerank), no una mejora real. Pendiente de reconfirmar con el
corpus completo.

---

## 2. EL PROBLEMA NUEVO: 7 FALSOS POSITIVOS, TRES PATRONES

Análisis del corpus del piloto en modo rápido. Los hallazgos correctos fueron
precisos (autoclave 134 °C/18 min contra 121 °C/30 min; conservación 15 años
contra 5 años). Junto a ellos, siete falsos positivos:

**Patrón 1 — las dos citas dicen LO MISMO.**
MKT-01 vs RRHH-05: "Pelo recogido durante la atención clínica al paciente"
contra "Pelo recogido en todo el personal clínico durante la atención al
paciente". Ídem con el calzado, donde la segunda cita es la primera más una
coletilla.

**Patrón 2 — una cita dice que algo EXISTE, la otra que a alguien LE FALTA.**
RRHH-04 vs RRHH-06: "Protocolo de esterilización... (ver CLI-01 y CLI-02" contra
"Pendiente reciclaje de esterilización". Son coherentes, no opuestas.

**Patrón 3 — emparejamiento sin relación semántica.**
NOR-04 vs OPE-01: "Activar la alarma y avisar al resto del personal" (incendio)
contra "Desactivar la alarma y encender la iluminación general" (apertura
matinal). Dos momentos distintos del día.
OPE-01 vs CLI-01: "autoclave a 121 °C durante 30 minutos" contra "La caducidad
del envasado estéril es de 30 días". Empareja dos "30" sin relación.

**Y un caso que apunta a algo estructural** (ya anotado como B.78): título
"Horas semanales de Nuria Ferrer" sobre dos citas que NO mencionan horas — una
fila de evaluaciones (empleado, puesto, clínica, fecha) y una de turnos.

---

## 3. POR QUÉ NO LO ARREGLAMOS CON EL PROMPT

Se exploró el prompt del juez antes de proponer nada, y **la hipótesis obvia
quedó descartada**: el prompt NO es pobre. Contiene una "REGLA PRINCIPAL, POR
ENCIMA DE TODAS LAS DEMÁS" que exige verificar que ambos textos hablan del mismo
dato concreto; una "REGLA DE ORO" sobre contextos compatibles; una sección
específica para filas de tabla que dice que compartir entidad no es hallazgo; y
trece ejemplos, cuatro de lo que sí es contradicción y nueve de lo que no.

**Entre esos nueve ejemplos negativos ya figura, literalmente, el caso que
falló:** "El mismo empleado con datos distintos en dos tablas de temas distintos
(turnos y evaluaciones) no es contradicción: son datos complementarios sobre la
misma persona." Eso es exactamente Nuria Ferrer.

Conclusión: el modelo tiene la instrucción delante y no la aplica. Añadir más
instrucciones sería perseguir el síntoma, y por eso NO se ha tocado nada.

---

## 4. TRES HALLAZGOS ESTRUCTURALES DE LA EXPLORACIÓN

**4.1 — El título no se verifica contra sus propias citas.** `topic`,
`newDocSays`, `existingDocSays` y `severity` son cuatro campos del mismo objeto
JSON, rellenados en la misma llamada. Nada, ni en el prompt ni en el código,
fuerza consistencia entre ellos. `fixQuotesInJudgment` verifica que la cita
EXISTA en el texto, no que el título describa lo que la cita dice.

**4.2 — El juez no recibe contexto de los fragmentos.** Solo `[Fragmento N de
"nombre"]` más el texto suelto: sin sección, sin posición en el documento, sin
hoja ni fila estructuradas (`DocumentFragment` no tiene `chunkType`, `sheetName`,
`tableId`, `rowIndex` — el `.map(c => c.text)` del paso 4b los descarta). Esto
explica directamente el patrón 3: sin contexto, "activar la alarma" y
"desactivar la alarma" son dos frases opuestas.

**4.3 — El modo rápido no tiene red, y es el que ve el cliente.** Confirmado:
`extract-claims`, `verify-claims`, `double-check` y `analyze-style` corren SOLO
en exhaustivo. En rápido, lo que emite Haiku en una sola pasada llega intacto a
la bandeja; el único filtro es `fixQuotesInJudgment`. Y `severity` en rápido es
el que el propio Haiku se auto-asignó: nadie lo revisa, y `contradiction` y
`minor_inconsistency` van a la misma lista.

**Colateral confirmado (exhaustivo):** un `severity: 'none'` de Sonnet sale de
`verifyBatch` con `confidence: 'posible'` y sin campo `severity`; aguas abajo
(`pipeline.ts:243-248`) no pasa ni el filtro de `'alta'` ni el de
`'minor_inconsistency'`, así que desaparece de las dos listas. El comentario del
propio fichero dice "Nunca se descarta". Sin contador ni log.

---

## 5. LAS PREGUNTAS

**P1 — ¿Cubre el paso 5 estos siete casos, tal como lo diseñaste?** Las citas
estructuradas `{sheet, rowKey, cells}` más el verificador sobre celdas parecen
matar el patrón 2 y el caso de Nuria Ferrer por construcción: si el título habla
de horas y ninguna celda citada contiene horas, se descarta mecánicamente. Pero
los patrones 1 y 3 son **prosa contra prosa**, sin celdas que verificar. ¿El
paso 5 los alcanza, o hacen falta piezas distintas para el lado no tabular?

**P2 — ¿Es 4.1 (la consistencia título-citas) parte del paso 5 o pieza
aparte?** Es un fallo del contrato de salida del juez, independiente de si el
contenido es tabular. Un verificador que compruebe que el `topic` está
sustentado por sus propias citas sería aplicable a todo, no solo a tablas.

**P3 — ¿Y 4.3, la ausencia de verificación en el modo rápido?** Es el modo que
ve el cliente en la bandeja. ¿Corresponde llevar alguna verificación del
exhaustivo al rápido antes del piloto, o el diseño correcto es que el rápido sea
deliberadamente barato y la verificación se pague aparte?

**P4 — ¿Orden?** Sobre la mesa: paso 5, 4c (recorte de 400 del agente sobre
fragmentos, que parte filas de tabla por la mitad), 4d (llevar `chunkType` y
compañía hasta el juez — que es prerrequisito de 4.2), y B.73 (ocho puntos que
construyen IDs de vector asumiendo generación 1, hermano del ya corregido en
`mark-analyzed`; hoy inertes porque todo el corpus está en generación 1, activos
en cuanto se apruebe una versión de Drive). ¿En qué orden?

---

## 6. RESTRICCIONES QUE SIGUEN VIGENTES

- "Arreglamos una CAUSA, no perseguimos un SÍNTOMA."
- El usuario no programa; ejecuta vía Claude Code. Un paso que no se pueda
  verificar con datos reales antes de commitear no se puede dar.
- Cada paso debe aportar valor por sí solo: el usuario debe poder parar en
  cualquier punto.
- Sin clientes todavía. El corpus se rehace borrando y resubiendo EN DRIVE
  (borrar desde Doclity escribe lápidas por `provider_file_id` y el sync los
  salta indefinidamente).
