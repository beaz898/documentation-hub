# Cierre de F-70 — la ficha legible del modal de mejora

*25/08/2026. Tres commits: `d384a315`, `36a56524`, `8f151aff`.*

---

## 1. El problema

La ficha que el cliente veía en el modal de mejora volcaba la cita cruda de una
fila de tabla. Para el hallazgo del puesto de Pablo Reyes:

> **Contradicción — Puesto de Dr. Pablo Reyes**
> En este documento: "Dr. Pablo Reyes | Implantólogo | Chamberí". En "OPE-02":
> "Dr. Pablo Reyes | Implantólogo / Cirujano oral | Box 1".

Valores sin etiqueta, columnas irrelevantes de más (`Chamberí`, `Box 1`) y
ninguna frase que dijera QUÉ difiere. El cliente tenía que encontrar por su
cuenta que lo que no cuadra es el Puesto, y compararlo él.

Lo que pidió el director en el relevo, literal:

> "necesito que diga que en un documento viene como puesto Implantólogo y en el
> otro como Implantólogo y Cirujano"

Es la primera vez en tres semanas que se miró lo que ve el cliente. Todo el
trabajo anterior —F-51 a F-69— fue en detectar bien; nada en enseñarlo bien.

---

## 2. La respuesta de Fable a F-70

Va entera y literal. **Este fichero existe porque esta respuesta se perdió una
vez al migrar el chat.**

> **RESPUESTA DE FABLE — F-70**
>
> Veredicto: B para las tablas — y para la prosa, la respuesta no es A ni C: es darse cuenta de que la prosa no tiene este problema. El dilema de la sección 4 nace de tratar como uno solo dos casos que la propia ficha de F-69 ya separó. Con esa distinción, C se disuelve: no hay "dos formas que mantener" — hay dos tipos de hallazgo que ya existían, cada uno con la forma que le corresponde.
>
> **P1 — B, y por qué la prosa no necesita A**
>
> Repasad los dos casos con la ficha delante:
>
> Tabla con columna identificada: la cita cruda es ilegible — valores sin etiqueta, ruido de columnas irrelevantes. El director tiene razón entera. B lo arregla con dato verificado: `{columna, enEste, enElOtro}` es exactamente lo que la alineación ya calculó al cuadrar la cita contra `cells`. Cero texto nuevo del modelo, cero conclusiones sin verificar.
>
> Prosa: ¿qué muestra hoy? Dos frases — "la historia clínica se conservará 15 años" contra "durante 5 años". Eso ya es legible. Una cita de prosa es lenguaje natural con su contexto dentro; no necesita que nadie la explique, necesita mostrarse enfrentada, que es lo que la ficha hace. El `topic` del juez ("Plazo de conservación de la historia clínica") ya hace de titular. ¿Mejoraría marginalmente con una frase-resumen? Quizá. ¿Justifica abrir el canal de texto explicativo sin verificar que P3 teme, para pulir lo que ya funciona? No. El "problema de la prosa" que os inclina hacia C es un problema imaginado mirando la solución de las tablas; mirando la ficha real, no existe.
>
> Así que: B, solo B, y la forma de la ficha queda con la frontera de F-69 intacta — `columns` presente → la forma del director (columna como titular, valores enfrentados, fila plegada); ausente → las dos citas, que para prosa es la forma correcta. Nada nuevo que mantener: es la misma bifurcación de datos que ya aprobamos, ahora con el campo que la alimenta.
>
> **P2 — Campo propio, y la fila plegada viaja aparte**
>
> Las dos cosas, pero separadas, porque son dos necesidades distintas que la pregunta mezcla:
>
> * Los valores enfrentados viajan como campo propio (`comparedValues: {column, inThis, inOther}` o el nombre que caiga — uno por columna discrepante, que desde F-52 son lista). Es el dato mínimo, verificado en origen, y la ficha lo pinta sin derivar nada. Derivarlo en la UI desde `cells` sería mover al frontend la alineación que el backend ya hizo — duplicar lógica en la capa menos testeada del sistema.
>
> * La fila plegada no necesita `cells` ni orden: necesita texto, y ya viaja — es la cita completa que `verifyQuote` persiste (el chunk localizado). Si tras F-55 lo que se guarda es la cita recortada, entonces la fila completa se manda como campo de contexto adicional (`fullRow: string`, el `text` del chunk — que el backend tiene en la mano en el mismo punto donde calcula los valores enfrentados). String plano para plegar, sin estructura que mantener sincronizada.
>
> Dos campos planos, cero jsonb interpretable en el frontend, y la regla de F-53 respetada: la estructura para el código (backend alinea), la presentación para quien presenta (frontend pliega).
>
> **P3 — Queda respondida por el diseño, y la registro como criterio**
>
> Con B solo, la pregunta se vuelve teórica — no hay frase del modelo — pero la respuesta merece quedar escrita porque volverá en la fase 2: el modelo explica solo donde el código no puede, y lo que explique se muestra como suyo, nunca como veredicto. Si algún día un hallazgo de prosa lleva frase-resumen del juez, esa frase es presentación de lo citado (y las citas siguen siendo el hallazgo), no una conclusión adicional — y pasa por el harness como todo lo que un modelo lee o escribe. El patrón de F-64 no se reabre porque la frontera es la misma de siempre: hechos del código, prosa del modelo, y jamás la segunda vestida de lo primero.
>
> Con esto el commit de legibilidad queda especificado entero: los dos campos en el backend (donde la alineación ya tiene todo en la mano), la bifurcación en la ficha, y la verificación de F-69 — mirarla con los casos del harness como la miraría el cliente de Dentavia: Pablo Reyes debe leerse en tres líneas (Puesto — Implantólogo aquí, Implantólogo / Cirujano oral en OPE-02), la prosa debe seguir leyéndose como hoy, y la fila entera debe estar a un clic para quien la quiera. Después, el descarte de filas ajenas, y el frente cierra donde F-69 lo dejó definido: cuando el cliente ve bien lo que el sistema encuentra bien.

---

## 3. Lo decidido: opción B, sin campo explicativo del modelo

**B**: los valores enfrentados viajan como dato calculado por el código, uno por
columna discrepante. Ni una palabra del hallazgo la escribe un modelo.

**Y la prosa no necesitaba nada.** Es el giro de la respuesta: el problema que
llevaba a la opción C —"dos formas que mantener"— era un problema imaginado
mirando la solución de las tablas. Dos citas de lenguaje natural ya se leen
solas: *"la historia clínica se conservará 15 años"* contra *"durante 5 años"*
es legible sin ayuda, porque una cita de prosa lleva su contexto dentro. Y el
`topic` del juez hace de titular. La bifurcación por presencia de `columns` que
F-69 ya había fijado no había que ampliarla: había que **alimentarla**.

Consecuencia práctica: no hay dos formas nuevas que mantener. Hay dos tipos de
hallazgo que ya existían, cada uno con la forma que le corresponde.

---

## 4. Lo medido antes de escribir código

Tanda del 25/08 en producción, sobre el estado `d384a315`. Salida real de
`select jsonb_pretty(analysis -> 'discrepancies') from analysis_results order by
created_at desc limit 2`. **Es medición, no reconstrucción.**

*(Nota de horas, para que nadie la lea como contradicción: `analysis_results.created_at`
va en UTC y `git log` en hora local, CEST = UTC+2. Las 13:05 UTC de la medición
son las 15:05 locales, después del commit de las 14:57.)*

**Analizando OPE-02 contra RRHH-06** — `2026-08-25 13:05:01`:

```json
{
  "topic": "Puesto de Dr. Pablo Reyes",
  "columns": ["Puesto"],
  "severity": "contradiction",
  "newDocRow": "[Hoja \"Cuadro de turnos\"] Empleado: Dr. Pablo Reyes | Puesto: Implantólogo / Cirujano oral | Box asignado: Box 1 | Lunes: T | Martes: T | Miércoles: L | Jueves: T | Viernes: T | Sábado: L | Horas semana: 16",
  "newDocSays": "Dr. Pablo Reyes | Implantólogo / Cirujano oral",
  "confirmedBy": "estructura",
  "comparedValues": [
    {
      "column": "Puesto",
      "newDocValue": "Implantólogo / Cirujano oral",
      "existingDocValue": "Implantólogo"
    }
  ],
  "existingDocRow": "[Hoja \"Evaluaciones\"] Empleado: Dr. Pablo Reyes | Puesto: Implantólogo | Clínica: Chamberí | Fecha evaluación: 2026-06-11 | Puntualidad (1-5): 4 | Calidad técnica (1-5): 4 | Trabajo en equipo (1-5): 4 | Atención al paciente (1-5): 4 | Media: 4 | Comentarios: Buen nivel general, pendiente reciclaje de protección radiológica.",
  "existingDocSays": "Dr. Pablo Reyes | Implantólogo",
  "existingDocument": "RRHH-06_evaluacion-del-desempeno.xlsx"
}
```

**Analizando RRHH-06 contra OPE-02** — `2026-08-25 13:05:17`:

```json
{
  "topic": "Puesto de Dr. Pablo Reyes",
  "columns": ["Puesto"],
  "severity": "contradiction",
  "newDocRow": "[Hoja \"Evaluaciones\"] Empleado: Dr. Pablo Reyes | Puesto: Implantólogo | Clínica: Chamberí | Fecha evaluación: 2026-06-11 | Puntualidad (1-5): 4 | Calidad técnica (1-5): 4 | Trabajo en equipo (1-5): 4 | Atención al paciente (1-5): 4 | Media: 4 | Comentarios: Buen nivel general, pendiente reciclaje de protección radiológica.",
  "newDocSays": "Dr. Pablo Reyes | Implantólogo | Chamberí",
  "confirmedBy": "estructura",
  "comparedValues": [
    {
      "column": "Puesto",
      "newDocValue": "Implantólogo",
      "existingDocValue": "Implantólogo / Cirujano oral"
    }
  ],
  "existingDocRow": "[Hoja \"Cuadro de turnos\"] Empleado: Dr. Pablo Reyes | Puesto: Implantólogo / Cirujano oral | Box asignado: Box 1 | Lunes: T | Martes: T | Miércoles: L | Jueves: T | Viernes: T | Sábado: L | Horas semana: 16",
  "existingDocSays": "Dr. Pablo Reyes | Implantólogo / Cirujano oral | Box 1",
  "existingDocument": "OPE-02_agenda-y-gestion-de-citas.xlsx"
}
```

### El nervio: la misma fila se cita con distinto número de valores

Estas dos líneas salen de las **dos ejecuciones de arriba**, y describen la
**misma fila del mismo documento** — Pablo Reyes en el cuadro de turnos de
OPE-02:

```
"existingDocSays": "Dr. Pablo Reyes | Implantólogo / Cirujano oral | Box 1"   ← 3 valores
"newDocSays":      "Dr. Pablo Reyes | Implantólogo / Cirujano oral"           ← 2 valores
```

El juez cita esa fila **con `Box 1` en un sentido y sin él en el otro**. Y en la
otra dirección hace lo propio con la fila de RRHH-06: `"Dr. Pablo Reyes |
Implantólogo | Chamberí"`, tres valores, donde el otro sentido cita dos.

Ahí está medido lo que el relevo solo suponía: **la cita lleva un SUBCONJUNTO de
columnas, y el subconjunto varía entre ejecuciones**. Desde ese texto la posición
no es deducible — el segundo valor es `Puesto` en un caso y podría no serlo en
otro, y nada en la cadena lo dice.

Es la prueba de que el frontend no podía resolverlo solo. Ninguna cantidad de
trabajo en la UI habría sacado `Puesto` de esa cadena: hacía falta que el backend
mandara **el emparejamiento ya hecho**. Que es exactamente la opción B.

---

## 5. Los tres commits

| Commit | Hora | Qué hace |
|---|---|---|
| `d384a315` | 14:57 | El dato viaja hasta la respuesta |
| `36a56524` | 16:10 | La ficha lo pinta |
| `8f151aff` | 16:34 | Lo pinta en prosa |

### `d384a315` — los valores enfrentados viajan hasta la respuesta

`types.ts`, `pipeline.ts`, `synthesize.ts`, `double-check.ts`. **+79 / −4.**

`applyCascadeToCandidate` (`pipeline.ts:224-280`) era el único punto del sistema
con los cuatro datos a la vez —nombre de columna, valor de cada lado, texto de
cada fila— y solo guardaba el nombre de la columna. Pasa a guardar también
`comparedValues`, `newDocRow` y `existingDocRow`. Todo sale de lo que ya estaba
en ese ámbito: nada se recalcula ni se deriva.

Y se abrieron **tres** listas cerradas que los habrían borrado por el camino:
`synthesize.ts:159-172` (por la que pasan los dos modos) y las **dos** de
`double-check.ts` —la del éxito y la del `catch`—, que reconstruyen el objeto
campo a campo. Sin esas dos últimas el campo habría llegado **solo al modo
rápido**, que es justamente el único donde la ficha detallada de `AnalysisModal`
no se pinta. El peor reparto posible, e invisible sin recorrer el camino entero.

`mergeContradictions` no era problema: usa spread y push, conserva el objeto.
Solo hizo falta declarar los campos en su tipo local para que el contrato no los
perdiera al entrar en el double-check.

### `36a56524` — la ficha enseña qué difiere, no la fila entera

`ProblemDetail.tsx` (nuevo, 138 líneas), `ChatPanel.tsx`, `problems.ts`,
`es.json`, `en.json`. **+165 / −1.**

Componente de presentación puro que bifurca por presencia de `comparedValues`:
con estructura, la forma nueva; sin ella —prosa, hallazgos por juicio, análisis
guardados antes de `d384a315`— el párrafo de siempre con sus estilos copiados
literalmente.

Sale a fichero propio en vez de engordar `ChatPanel.tsx`, ya en 578 líneas.

`Problem.description` **no cambia**: ni su plantilla en `problems.ts:158`, ni las
tres llamadas al LLM de `ImprovementModal` (`:66`, `:309`, `:340`), que siguen
leyendo esa cadena y solo esa. Presentación para quien presenta, F-53.

### `8f151aff` — la ficha explica la discrepancia en una frase

`ProblemDetail.tsx`, `es.json`, `en.json`. **+73 / −21.** Ver sección 6.

### Por qué en ese orden

El dato antes que la ficha, y la ficha antes que su redacción. Cada commit deja
el sistema en verde y no depende de que el siguiente exista: `d384a315` no cambia
un píxel (ni `AnalysisModal` ni `problems.ts` iteran campos, así que un campo de
más es invisible), y `36a56524` funciona con `d384a315` desplegado o sin él —sin
él, `comparedValues` llega `undefined` y la ficha cae en la forma de siempre.

---

## 6. El criterio que se pagó en este frente

**Hicieron falta DOS formas antes de acertar.**

La primera —tres líneas apiladas: la columna como titular, el valor de cada lado
debajo— era **correcta**: los datos verificados, el orden claro, sin barras de
adorno que se confundieran con el `/` de "Implantólogo / Cirujano oral". Y era
legible. Aun así, puesta en pantalla al lado de los solapamientos, que van en
prosa, resultaba **árida**: un formulario en medio de un panel que habla.

La forma buena era la que el director había descrito en su frase original, desde
el primer día:

> "que diga que en un documento viene como puesto Implantólogo y en el otro como
> Implantólogo y Cirujano"

**"Que diga"**. La frase no describía solo QUÉ datos hacían falta: describía que
tenían que ir **dicho**, en prosa. La segunda vuelta estaba ahorrada en esa
palabra.

### La regla

> Cuando el director describe lo que quiere VER, la descripción ya lleva dentro
> la FORMA, no solo el contenido. Su frase se lee como especificación de formato,
> no solo de datos.

### Y esto no fue un error de lectura de un solo lado

**Ni el arquitecto ni Fable acertaron la forma desde la especificación.** Fable
escribió, en su último párrafo:

> "Pablo Reyes debe leerse en **tres líneas** (Puesto — Implantólogo aquí,
> Implantólogo / Cirujano oral en OPE-02)"

La primera forma no fue una mala interpretación: fue **la que él especificó**, y
aun así no era la buena en pantalla. Eso refuerza la regla en vez de debilitarla:
si dos capas de diseño leyeron la frase del director como una especificación de
datos y las dos derivaron la misma forma equivocada, el fallo no está en quien
lee — está en no tratar su descripción como lo que es.

### El matiz que evita malinterpretar esto

**Pasar a prosa NO reabrió lo que Fable vetó.** La frase la compone el **código**,
desde plantillas de traducción (`detailSentence` en `es.json` y `en.json`), con
`t.rich` de next-intl y datos verificados en origen (`comparedValues`,
`d384a315`). Ni una palabra sale de un modelo.

Cambió el molde, no el dato. La frontera de P3 sigue intacta: hechos del código,
prosa del modelo, y jamás la segunda vestida de lo primero.

---

## 7. Las dos veces que lo comprobado desmontó una suposición

### La insignia de la tarjeta no dice contra qué documento se compara

Se pidió quitar el nombre del documento de la etiqueta, con este razonamiento:
*"el cliente ya sabe contra qué documento compara, se lo dice la insignia de la
tarjeta (`srcBadge`)"*.

Al leer `getDocSourceBadge` (`ImprovementModal.tsx:253-264`) resultó que devuelve
el **origen** del fichero, no su nombre: `Drive`, `Manual` o `Drive+Manual`.

Y al mirar la tarjeta entera (`ChatPanel.tsx:333-388`) apareció lo contrario de
lo supuesto: en la rama de contradicciones se muestran el tipo, la insignia de
origen, el título y los dos botones — **el nombre del documento contrario no
aparece en ningún sitio**. Donde sí aparece es en la rama de duplicidades, que
agrupa por documento con `t('withDocument')`, y por ahí las contradicciones nunca
pasan.

Esa etiqueta era **el único lugar** donde el cliente leía contra qué documento se
compara. Quitarla habría dejado dos valores enfrentados sin decir de dónde sale
el segundo. No se quitó.

### El nombre completo sí estorbaba, pero solo se supo al ver la frase escrita

Con la frase montada se vio que `OPE-02_agenda-y-gestion-de-citas.xlsx` cae
**justo entre los dos valores que hay que comparar**, y es el trozo más largo y
menos informativo de la oración. Antes de escribirla no se veía: en la forma de
tres líneas el nombre iba en su propia línea, de etiqueta, y no estorbaba a nada.

La solución conserva las dos necesidades: dentro de la frase va el **código**
(`OPE-02`), y en el plegado sigue el nombre **íntegro**, que es donde hay sitio y
sirve para identificar el fichero sin ambigüedad.

`shortDocumentName` acorta por el patrón `LETRAS-DÍGITOS` seguido de `_` o `-`.
Si el nombre no encaja, devuelve el nombre **entero** sin su extensión: es una
convención de nombres del cliente, no del sistema, y un cliente que nombre sus
ficheros de otra forma tiene que seguir viendo un nombre completo, nunca un muñón
con puntos suspensivos. Comprobado:

| Entrada | Salida |
|---|---|
| `OPE-02_agenda-y-gestion-de-citas.xlsx` | `OPE-02` |
| `RRHH-06_evaluacion-del-desempeno.xlsx` | `RRHH-06` |
| `Manual de acogida 2026.docx` | `Manual de acogida 2026` |
| `informe.pdf` | `informe` |
| `Protocolo v1.2` | `Protocolo v1.2` |

El último caso es el motivo de quitar solo extensiones conocidas en vez de "lo
que haya tras el último punto", que se habría comido el `.2`.

---

## Lo que ve el cliente al final

> **Contradicción — Puesto de Dr. Pablo Reyes**   [No es error] [Solventar]
> En este documento, **Puesto** figura como «**Implantólogo**»; en OPE-02, como
> «**Implantólogo / Cirujano oral**».
> ▸ Ver la fila completa

Y en la otra dirección, los dos lados intercambiados. La fila entera, con sus
diez columnas, sigue estando — a un clic, para quien la quiera.
