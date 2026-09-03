# Archivo de consultas a Fable

*Creado el 28/08/2026 (F-85). Un fichero por consulta, texto íntegro, cabecera
de estado mutable y cuerpo intocable.*

---

## ⚠️ ANTES DE NADA: ESTO REGISTRA LO QUE FABLE DIJO, NO LO QUE ES VERDAD

**La autoridad final es la medición.** Este archivo es jurisprudencia, no ley: el
caso concreto, la evidencia y la exposición de motivos. Quien quiera saber **QUÉ
es ley** lee `claude/Protocolo_Harness_Tasas.md`; quien quiera saber **POR QUÉ**,
sigue la referencia hasta aquí.

**Contiene errores conservados a propósito, y con su firma**, porque el
razonamiento previo al dato es parte del registro y borrarlo dejaría la
conclusión sin su historia. Dos que ya se conocen:

- **F-73 fue tumbada por una medición.**
- **El corte de commits de F-82 quedó superado por F-84.**

Un documento de este archivo **no se puede pudrir**: afirma «esto se dijo el día
tal», y eso sigue siendo cierto para siempre. Lo que sí puede pudrirse es su
LECTURA, si alguien lo toma por presente — para eso está la cabecera de estado
de cada fichero.

### LO QUE FABLE DA POR EXISTENTE — un patrón, no tres accidentes

**SEIS veces ha dado por construida una pieza que no estaba**, y las seis con la
misma forma: una subordinada de paso —«que ya existe», «que ya viaja»— sobre
algo que el repositorio no tenía. No son errores de criterio: las tres
decisiones eran correctas y se implementaron enteras. Lo que era falso es que
fueran gratis.

| Consulta | Lo que dio por existente | Qué había en realidad |
|---|---|---|
| **F-84 P3** | «el orden canónico **que ya existe** — por id, no por rol» (F-84.md:169) | No existía. Hubo que escribir `ordenCanonico` en `huella-hallazgo.ts` |
| **F-83 P2 / F-84 P1** | «**la** pareja de tablas», en singular — un emparejador entre documentos | No existía. La fase 1 recibía dos tablas ya elegidas y nadie las elegía. Lo destapó F-88 y lo escribió su paso 1 |
| **F-88 P2** | «es un `if` sobre un campo **que ya viaja**» | No viajaba. Ni la discrepancia ni `Problem` decían de qué materia es un hallazgo; hubo que crear `origen` |
| **F-88 P2** (2.º) | «las coordenadas que el payload debe llevar son **exactamente las que la fila ya tiene**» | No las tiene. La clave de fila (`keyValues`) muere dentro de `diff-emision.ts` y nunca llega al cliente; el `tableId` tampoco. **ENCONTRADO APLICANDO LA REGLA**, no tropezando |
| **F-92 P1** | «Universo de `columnas(h)`: las que el hallazgo declara — **el campo `columns` de F-70**» | Ese campo no existe donde corre la supresión. Hay DOS listas, de F-55 (`newColumns`/`existingColumns`), una por lado y con TRES estados. **ENCONTRADO TRADUCIENDO**, antes de escribir una línea — la regla de F-92 P4 cazando algo por primera vez |
| **F-93 P1** ⚠️ **la más cara** | «EST-02 contra EST-03 tiene claves distintas → `descartado.emparejamiento_invalido`, fuera, **sin que la supresión intervenga**» | No era cierto en nuestro código: la guarda de identidad **solo miraba los pares de la 3ª puerta**, y sobre pares emitidos no se verificaba identidad ninguna — la supresión conflaba `pareja` y `no_pareja` y se llevaba las dos. Su contador llevaba a cero desde que se creó |

**LA SEXTA MERECE PÁRRAFO PROPIO, porque no era una pieza que faltara: era un
ARGUMENTO apoyado en una pieza que no existía.** Nuestro aviso decía que la
lectura C reabría B.124; Fable lo desmontó explicando que una fila mal
emparejada muere antes, en identidad. **El argumento es correcto en su diseño y
falso en nuestra implementación.**

Y el precio de no haberlo comprobado estaba escrito: al reordenar, EST-02/EST-03
deja de suprimirse —no son pareja—, cae a R2, sale `confirm` con su ancla, y el
punto 4 lo degrada a la llamada corta. **B.124 vivo otra vez, por la puerta que
abría la corrección que veníamos a hacer.** Se cazó traduciendo el predicado
antes de escribir el commit; de no haberlo hecho, habría entrado con la suite
en verde, porque el caso que lo vigilaba asertaba el contador VIEJO.

**La lección que separa esta de las cinco anteriores**: en aquéllas faltaba una
pieza y el coste era trabajo imprevisto. Aquí lo que fallaba era **la premisa de
un razonamiento que ya habíamos aceptado**, y el coste habría sido una
regresión silenciosa del fallo más grave del proyecto. **Cuando una respuesta
desmonte un aviso nuestro, la pieza en la que se apoya para desmontarlo es
justo la que hay que verificar.**

**Por qué pasa, y por qué importa poco y mucho a la vez.** Fable razona sobre la
descripción que le damos, y una descripción correcta a nivel de diseño puede
omitir que la pieza está a medio construir — el caso de la pareja de tablas es
el más claro: era CIERTO en el corpus, donde cada documento tiene una sola
tabla. Importa poco porque las decisiones se sostienen. Importa mucho porque el
COSTE estimado en la respuesta se apoya en esa subordinada, y quien planifique
un commit leyendo «es un if» presupuestará mal.

**Qué hacer al leer una respuesta**: cuando diga «que ya existe» o «que ya
viaja», **comprobarlo en el repositorio antes de estimar**. Es la regla de
verificación al usar (F-85 P3) aplicada a un caso concreto que se repite.

**Y LA REGLA YA SIRVIÓ, que es lo que la valida.** El cuarto caso es distinto de
los tres primeros en algo que importa: **se encontró aplicándola**. El 30/08, al
arrancar la ficha, la exploración previa comprobó una por una las coordenadas
que F-88 P2 daba por disponibles — y faltaban dos de cuatro, una de ellas
inexistente fuera de una función. Los tres primeros se descubrieron a mitad de
un commit, con el coste ya comprometido; éste se descubrió ANTES de escribir una
línea, y su consecuencia fue partir el trabajo en dos (ficha A y ficha B) en vez
de encallar. Una regla que solo describe fallos pasados no vale nada; ésta
previno el cuarto.

---

## LAS REGLAS DE LA CASA

**Se archivan los PARES consulta + respuesta.** Una respuesta sin su consulta
delante es ilegible: no se sabe qué se preguntó ni con qué evidencia.

**Se archiva TODO, sin juicio previo sobre si sigue vigente.** La vigencia se
gestiona con la cabecera, nunca con la selección. Decidir qué merece archivarse
es donde se pierde justo lo que hará falta.

**Íntegro, nunca resumido.** El resumen es donde muere el matiz.

**El estado lo cambia un HECHO** —una medición, un commit, una consulta
posterior— y se actualiza **al cerrar ese hecho, en el mismo commit**. Sin
hecho, sin cambio. **NO se repasa el archivo periódicamente**: un repaso sin
hecho es una opinión nueva disfrazada de mantenimiento.

**La cabecera la escribe quien cierra el hecho.** Fable puede PROPONER que algo
queda superado, pero **no administra su propio estado**.

---

## EL ÍNDICE

| # | Fecha | Asunto | Estado | Reglas promovidas |
|---|---|---|---|---|
| F-70 | 25/08/2026 | La ficha legible del modal de mejora: valores enfrentados por columna | **pendiente de archivar** (falta la consulta) | `comparedValues` / fila plegada — hoy en `types.ts` (F-70) |
| F-71 | sin fecha registrada | Etapas caídas y análisis incompleto | **pendiente de archivar** | `stageFailures`, la devolución íntegra de créditos |
| F-72 | sin fecha registrada | *(sin rastro en el repositorio)* | **pendiente de archivar** | — |
| F-73 | sin fecha registrada | El colapso de filas idénticas | **pendiente de archivar** · *tumbada por una medición* | — |
| F-74 | sin fecha registrada | Alcance del MVP y la lista de cierre | **pendiente de archivar** | La lista de cierre — protocolo §4-bis; el alcance declarado (`selectionLimits`) |
| F-75 | 27/08/2026 | Las baterías viven en el repositorio | **pendiente de archivar** | La regla de admisión — protocolo |
| F-76 | sin fecha registrada | Falsos negativos de prosa | **pendiente de archivar** | — |
| F-77 | sin fecha registrada | El bloque del verificador | **pendiente de archivar** | — |
| F-78 | sin fecha registrada | El criterio de clave del diff de tablas | **pendiente de archivar** · *enmendada por F-81 P1* | — |
| F-79 | sin fecha registrada | Circularidad del bloque del verificador | **pendiente de archivar** | — |
| F-80 | sin fecha registrada | El orden del frente del diff | **pendiente de archivar** | — |
| F-81 | 27/08/2026 | El criterio de clave se rinde; no hay dónde medir la fase 1 | **pendiente de archivar** (falta la respuesta) | La regla de entrada (P3) — protocolo; el consenso sin elegir clave (P1) |
| F-82 | 28/08/2026 | Los contadores de pipeline y su contrato | **pendiente de archivar** · *su corte de commits, superado por F-84* | Las tres primeras cláusulas — `Contrato_Contadores.md` |
| **[F-83](F-83.md)** | 28/08/2026 | La huella frente a la cláusula 5, la emisión de las filas sin pareja, y el corte en tres commits | **parcialmente superada** · *su corte de tres commits, por F-84* · consulta NO CONSERVADA | La distinción huella/contador y el saneo de `porColumna` — `Contrato_Contadores.md`, cláusula 5 (`2c998111`) |
| **[F-84](F-84.md)** | 28/08/2026 | La columna de contradicciones y el número de la bandeja, la asimetría del criterio de igualdad, y la huella frente a la dirección | **vigente** · PAR COMPLETO | El criterio de igualdad unificado (`e4c1f8a7`); la huella bidireccional (`e6a27a58`); la reutilización de la columna de contradicciones — **pendiente de consumar en la emisión** |
| **[F-85](F-85.md)** | 28/08/2026 | Dónde viven las respuestas de Fable: custodia, qué sigue vinculante, cómo se marca lo superado, y qué no debe decidir Fable | **vigente** · PAR COMPLETO | La custodia y la verificación al usar — protocolo (`cd00738c`) |
| **[F-86](F-86.md)** | 28/08/2026 | La segunda huella del sistema (la del «No es error»), el orden del arreglo, la persistencia de los descartes y el id del documento | **parcialmente superada** · *su rama del «si falta», por F-87* · PAR COMPLETO | Ninguna todavía: son el plan del frente que queda |
| **[F-87](F-87.md)** | 28/08/2026 | El camino sin id existe y es el más usado: el diff corre igual, lo que no puede es recordar | **vigente** · PAR COMPLETO | Ninguna todavía: son el plan del frente que queda |
| **[F-88](F-88.md)** | 29/08/2026 | Nadie empareja tablas entre documentos: N×M con tres puertas, el groupId opaco, y las variantes de escritura como cuarta clase | **vigente** · PAR COMPLETO | Ninguna todavía: son el plan de los dos commits que quedan |
| **[F-89](F-89.md)** | 30/08/2026 | El sello «confirmado por estructura» sobre un emparejamiento que el juez inventó — y EL MAPA DEL MVP: cuatro frentes, cuáles bloquean | **parcialmente superada** · *el margen del ancla y qué hace el ancla, por F-90; su P4 DESAMBIGUADO por F-92* · PAR COMPLETO | La REGLA DE CIERRE (bloqueante/declarable) — protocolo. La jerarquía simétrica, pendiente del frente 1 |
| **[F-90](F-90.md)** | 30/08/2026 | Qué pasa donde el diff no pudo comparar: el margen del ancla MEDIDO, y sin clave la estructura no firma | **vigente** · *su P3 DESAMBIGUADO por F-91; su P4 SUPERADO EN LA PREMISA por F-92 — la cifra no se podía medir* · PAR COMPLETO | Ninguna todavía: son el plan de lo que queda del frente 1 |
| **[F-91](F-91.md)** | 30/08/2026 | «Todas las columnas comunes» admitía dos lecturas, y la mala descartaba hallazgos VERDADEROS: la geometría no se contamina con testimonio. Y la clase de contadores CENTINELA | **vigente** · PAR COMPLETO | La clase CENTINELA — `Contrato_Contadores.md`; la hermana de F-79 (una regla con dos lecturas se ejerce contra un caso medido) — protocolo |
| **[F-92](F-92.md)** | 31/08/2026 | La supresión suprime por FILA y el diff compara por COLUMNA: el hueco es el territorio de las omisiones —y del mismo dato bajo otro nombre—. Y por qué la cifra de coste no se podía medir | **vigente** · *su P1 CORREGIDO por F-93 en universo y predicado* · PAR COMPLETO | MOTIVO LITERAL — `Contrato_Contadores.md`. TRES PIEZAS POR REGLA DICTADA, «CERO EN N» con la tasa que excluye, y la AMBIGÜEDAD DE ALCANCE DEL CUANTIFICADOR — protocolo |
| **[F-93](F-93.md)** | 31/08/2026 | `columnas(h)` no tenía universo y las dos lecturas naturales fallan cada una uno de los tres casos: el dato es LA OPOSICIÓN, no la cita. Y la trampa de `'equivalentes'` | **vigente** · PAR COMPLETO | LA CUARTA PIEZA (vacío y ausente; forma existencial) — protocolo. Un comentario que justifica un orden CITA SU INVARIANTE — `CLAUDE.md` |
| **[F-99](F-99.md)** | 03/09/2026 | El análisis del chat persistía una fila antes de la decisión: F-98 no se revoca, estaba a medio aplicar. Régimen efímero completo y payload firmado, que despierta la especificación dormida de F-95 P1. | **vigente** · PAR COMPLETO | SEGUIR LAS ESCRITURAS, NO LOS USOS y LAS PREMISAS DE INACCIÓN PAGAN LA MISMA EVIDENCIA — `CLAUDE.md` |
| **[F-98](F-98.md)** | 02/09/2026 | La fila nace AL INDEXAR, no antes: el paso 2 del frente 3 queda retirado por su propio autor. El «puente interino» de F-87 era el edificio. El «no» del usuario debe ser gratis. | **vigente** · PAR COMPLETO | UNA FILA ES UNA AFIRMACIÓN DE EXISTENCIA, COMPROBAR SI LA IDENTIDAD YA ESTÁ RESUELTA POR OTRA VÍA y ¿QUIÉN LIMPIA ESTO? — `CLAUDE.md` |
| **[F-97](F-97.md)** | 02/09/2026 | La partición del corpus NO es binaria: la vía de ids convive con el filtro. Falsa el enunciado de F-96 y sustituye la metáfora espacial por una de PARTICIPACIÓN. Y abre la pregunta previa: ¿es `en_revision` el nombre verdadero de `pendiente`? | **vigente** · PAR COMPLETO | UN CAMPO CON DOS PREGUNTAS, ENUNCIAR LA PREGUNTA ANTES DE AÑADIR UN VALOR y LA AUTORIZACIÓN EXPLÍCITA VENCE AL DEFECTO — `CLAUDE.md` |
| **[F-96](F-96.md)** | 02/09/2026 | El estado del documento vive en dos sistemas y QUIEN FILTRA ES QUIEN DECIDE. `analysisStatus` no es un estado duplicado: es una PARTICIÓN. La duplicación se degrada de dos-fuentes a fuente-más-espejo | **vigente** · PAR COMPLETO | EL CANDIDATO NO ES MIEMBRO, LA PERTENENCIA SE ESCRIBE EN UN SITIO y DOS SISTEMAS QUE COINCIDEN NECESITAN QUIEN LO COMPRUEBE — `CLAUDE.md` |
| **[F-95](F-95.md)** | 02/09/2026 | Cierra el FRENTE 2 y abre el 3. Fable RETIRA una receta suya por insostenible, acepta las dos desviaciones, y ante B.147 contesta «ni una ni otra»: cambiar la forma de la operación para que la propiedad sobre | **vigente** · PAR COMPLETO | DESTRUCTIVO SOBRE RESPUESTA AJENA, CADA DECLARADO SU CONTADOR, NINGÚN ENDPOINT ACEPTA OBJETOS DE NEGOCIO y CUOTA NO ES ANALÍTICA — `CLAUDE.md` |
| **[F-94](F-94.md)** | 01/09/2026 | Abre el FRENTE 2: la identidad accidental de los descartes tabulares (⚠️ premisa nuestra FALSA — no había ninguna: nunca hubo botón), el volcado de filas, las averías silenciosas, y el prefijo de fila que resulta ser la cita por referencia de F-80 | **vigente** · PAR COMPLETO | UNA IDENTIDAD POR ESPECIE y DATOS DEL CLIENTE — `CLAUDE.md`. LECTURA DUAL CON CADUCIDAD, retirada del frente 2 por inexistente. LO QUE SE AFIRMA DEL REPO VIAJA CON SU EVIDENCIA — protocolo |

---

## EL AGUJERO, MEDIDO EL 28/08/2026 (rango ampliado a F-94 el 01/09)

**Once pares completos de F-70 a F-94: F-84 a F-94, todas menos las que no llegaron.** El resto, o a medias o nada:

- **F-99 — PAR COMPLETO**, en `F-99.md` (03/09/2026). **UNA DOCTRINA CORRECTA
  APOYADA EN UNA PREMISA FALSA.** F-98 dijo «el "no" del usuario debe ser gratis»
  y dio por hecho que ya lo era; el camino del chat llevaba meses persistiendo
  una fila antes de la decisión —la del ANÁLISIS—, en la única tabla donde no se
  miró. Las huérfanas de la remedición son el paso 2 existiendo sin permiso.
  **La respuesta**: régimen efímero completo — análisis, descartes y decisión
  viven y mueren juntos. El régimen MIXTO de hoy (descartes en memoria, análisis
  en base) es lo que fabrica huérfanas.
  ⚠️ **Y la pieza que lo hace viable ya estaba escrita**: el payload FIRMADO de
  F-95 P1, archivado «por si algún día», encuentra su día tres consultas después.
  Sin él, aceptar el análisis del cliente sería la vía de fabricación que aquella
  consulta prohibió.
  ⚠️ **CORRECCIÓN POSTERIOR AL PAR**: su premisa de que «si el usuario indexa, la
  fila se actualiza» es FALSA — no hay un solo UPDATE sobre esa columna en el
  repositorio. Segunda premisa fáctica del mismo par que se cae por el mismo
  motivo, lo que refuerza su P3 en vez de contradecirla.
- **F-98 — PAR COMPLETO**, en `F-98.md` (02/09/2026). **UN PASO ENTERO DEL
  FRENTE, RETIRADO POR QUIEN LO DISEÑÓ.** F-95 P7 ordenó que la fila del
  documento naciera al SUBIRLO; F-98 P2 lo retira con su nombre —«el error era
  mío: confundí identidad DURANTE la revisión con identidad DURABLE»— y la fila
  se queda naciendo al INDEXAR, como hoy.
  ⚠️ **EL PUENTE ERA EL EDIFICIO**: F-87 P4 llamó al payload de descartes «puente
  interino con sucesor conocido» y F-95 P7 programó su retirada. El sucesor
  fabricaba basura. El payload es el diseño permanente.
  **La medición que lo decide**: 108 fragmentos generados frente a 6 documentos
  indexados —dieciocho a uno—. La mayoría de las revisiones terminan en «no», y
  un diseño en el que el caso MAYORITARIO fabrica residuo es un diseño al revés.
  **La virtud sin nombre que estuvimos a un commit de matar**: hoy cerrar la
  pestaña sin decidir no deja rastro PORQUE NO HABÍA NADA. Ahora tiene nombre —
  «el "no" del usuario debe ser gratis»—.
  ⚠️ **Y lo que dice del frente entero, que es el resultado y no una nota al
  margen**: de los cinco pasos de F-95, uno era corrección de seguridad (hecho),
  otro resultó ser un estado que YA EXISTÍA con otro nombre (F-97), y otro
  —éste— estaba CUBIERTO desde hacía dos días. **El frente 3 no se está
  haciendo: se está disolviendo**, y eso significa que el sistema tenía MENOS
  DEUDA de la que su propia documentación decía.
- **F-97 — PAR COMPLETO**, en `F-97.md` (02/09/2026). **UN CENSO DESTAPA UN
  MECANISMO ENTERO FUNCIONANDO SIN PARTIDA DE NACIMIENTO**: la vía de inclusión
  por ids amplía el filtro del corpus, y con ella el enunciado de F-96 es falso.
  La opción que traíamos —«separar candidato-de-tanda de miembro-del-corpus con
  dos mecanismos»— proponía construir lo que ya existe.
  **El enunciado que sustituye al espacial:** un documento participa por
  PERTENENCIA (su estado lo incluye en el default) o por NOMINACIÓN (un análisis
  lo nombra). «El corpus es lo que participa sin ser nombrado.» Y describe el
  chat sin excepción: el chat no nombra ids, luego solo ve pertenencia.
  ⚠️ **Y la pregunta previa que puede ahorrar medio frente**: `pendiente` ya es
  fila + vectores + fuera del corpus + esperando en la bandeja — letra por letra
  la descripción de `en_revision`. Si son lo mismo, no se añade un valor: se
  adopta el que hay.
- **F-96 — PAR COMPLETO**, en `F-96.md` (02/09/2026). **LA CORRECCIÓN DE PREMISA
  QUE DECIDE EL FRENTE 3**: `analysisStatus` no es un estado duplicado, es una
  PARTICIÓN — `'analizado'` significa elegible y todo lo demás no elegible, y el
  filtro no distingue entre los «demás». Con eso, la pregunta deja de ser «¿qué
  valor escribo?» y pasa a ser «¿hay algo que filtrar?».
  Y mata la opción A sola: **un documento en revisión no necesita estar en el
  índice, porque se compara CONTRA el corpus, no el corpus contra él.**
  La decisión: el estado operativo vive en UN sitio —Pinecone, porque quien
  filtra decide— y la columna pasa a reflejo declarado. «La duplicación no se
  elimina: se degrada de dos-fuentes a fuente-más-espejo, que es la diferencia
  entre un conflicto y una copia.»
  ⚠️ Y LLEVA UNA PREMISA NUESTRA SIN VERIFICAR —el punto (3), «ya están
  desincronizados, verificado»— que al ir a comprobarla resultó no estarlo, y con
  un mecanismo declarado FALSO. Ver la cabecera del fichero.
- **F-95 — PAR COMPLETO**, en `F-95.md` (02/09/2026). **EL PRIMERO EN QUE FABLE
  RETIRA UNA RECETA SUYA** antes de que la implementáramos mal: «búfer durable en
  el propio análisis» era amortiguar un fallo de Supabase dentro de Supabase, y
  queda superada con esta consulta como causa.
  Y **la primera vez que una pregunta binaria nuestra se contesta cambiando la
  forma de la operación**: ante «¿declaro la propiedad o me quedo sin retry?»
  (B.147), partir el borrado por filtro en dos —enumerar los ids, borrar el
  conjunto fijo— hace que la propiedad DEJE DE IMPORTAR. Las dos opciones que
  traíamos eran malas.
  Deja además la escala que ordena «declarado»: **escrito, contado, ejercido**, y
  desmonta la excusa de «no se puede provocar sin romper producción» — desde
  B.126 los simulacros son viables.
- **F-94 — PAR COMPLETO**, en `F-94.md` (01/09/2026). **LA PRIMERA VEZ QUE UNA
  EXPLORACIÓN PREVIA EVITA UNA CONSULTA EQUIVOCADA**, y no solo un commit: cazó
  que los descartes de tablas YA funcionaban por un camino accidental con la
  identidad equivocada —lo que cambia qué es la ficha B— y cazó además **una
  acusación falsa nuestra antes de enviarla**, un `grep` con `head -12` que
  cortaba justo la línea que desmentía la tesis.
  ⚠️ **Y la exploración metió DOS premisas falsas, las dos nuestras.**
  La segunda: su sección 5 daba por no pintadas las variantes de escritura, y
  se pintan desde `17614166` — el mismo commit que, según la consulta, las dejó
  por el camino. Mismo defecto las dos veces: **leer el productor y no el
  consumidor.** Sirve para lo que mira, no para lo que da por sabido.
  La primera: Los descartes
  tabulares NO funcionaban — `mostrarAccionesDeFila` nunca pintó el botón, así
  que la huella de prosa que el endpoint calculaba era una tubería sin grifo.
  **Verificamos la tubería y no el grifo.** La cláusula de F-88 P2 —suprimir las
  acciones hasta tener la identidad correcta— pagó aquí: no hay nada que migrar,
  y por eso la lectura dual se retira del frente.
  Y trae la vuelta más valiosa del frente: **el prefijo `[F3]` no era ruido**.
  Propusimos quitarlo o limpiarlo, y las dos eran malas — es el puntero que
  permite localizar la fila por posición, y cuando el juez lo copia «está
  señalando la fila y citando sus valores en el mismo gesto: es la cita por
  referencia que F-80 P2 pedía, ya ocurriendo sola». **Se parsea, no se borra.**
  Segunda vez en el frente que lo que parecía un fallo del modelo era el modelo
  haciendo lo correcto y nosotros castigándolo.
- **F-93 — PAR COMPLETO**, en `F-93.md` (31/08/2026). **LA PRIMERA VEZ QUE UNA
  AMBIGÜEDAD SE CAZA ANTES DE LA PRIMERA LÍNEA DE CÓDIGO**, y con la técnica que
  F-92 P4 acababa de prescribir: traducir la regla a predicado, encontrar un
  nombre sin universo, preguntar. Las tres anteriores se destaparon a mitad de
  commit o ejecutando.
  Trae además la corrección más incómoda del archivo: **el predicado de F-92 era
  VERDADERO en vacío** —`⊆` cumple sobre el conjunto vacío— y decía suprimir
  justo en el caso que su propia prosa exceptuaba; y **el hallazgo que motivó
  F-92 entero devuelve exactamente ese conjunto vacío**. Es la única entrada
  donde una respuesta cae en el agujero degenerado de sí misma.
  Y la respuesta ve una trampa que la consulta no vio, una etapa más allá:
  `'equivalentes'` afirma sobre las filas enteras cuando la estructura solo miró
  las columnas citadas comunes. Ver B.130.
- **F-92 — PAR COMPLETO**, en `F-92.md` (31/08/2026). LA PRIMERA VEZ QUE FABLE
  ASUME UNA REGLA DE FORMA PARA SÍ MISMO: «toda regla dictada se entrega en tres
  piezas —predicado, universo de cada nombre cuantificado, y un caso a cada lado
  de la frontera—», con su diagnóstico en una frase que vale para cualquiera:
  **«el universo obvio es exactamente el que no se escribe»**. Y la primera en
  que un aviso nuestro NO se desmiente ni se acepta, sino que **se contesta**:
  advertimos que la lectura C reabría B.124 y la respuesta explica por qué no —la
  verificación de identidad corre antes y mata la fila mal emparejada—. La
  respuesta además nos enseña un hueco que no habíamos visto: el juez no solo
  cubre omisiones, es **el emparejador de esquemas de último recurso**, porque el
  diff empareja columnas por igualdad de nombre y no ve «Horas semana» contra
  «Jornada semanal».
- **F-91 — PAR COMPLETO**, en `F-91.md` (30/08/2026). LA PRIMERA VEZ QUE UNA
  AMBIGÜEDAD DE FABLE SE ENCUENTRA EJECUTANDO Y NO LEYENDO: una palabra suya
  —«comunes»— admitía dos lecturas, y la de al lado descartaba el hallazgo
  LEGÍTIMO de la misma pasada que motivó el frente entero. No se vio leyendo la
  regla; saltó cuando un caso de la batería devolvió «1 columna de ancla» donde
  se esperaba cero. Trae además una clase de contador que el proyecto ya tenía
  sin nombre: los CENTINELA, cuyo cero es su forma de funcionar. Y es la
  PRIMERA VEZ QUE CORREGIMOS UNA LISTA SUYA sin discutirle el criterio: de sus
  tres centinelas fundacionales, uno —`narracionEnCita`— se había movido en
  producción EL DÍA ANTERIOR, y su cero de 351 filas era una pregunta abierta,
  no un invariante. Acaba sirviendo mejor como contraejemplo.
- **F-90 — PAR COMPLETO**, en `F-90.md` (30/08/2026). LA PRIMERA VEZ QUE UNA
  MEDICIÓN NUESTRA CORRIGE UNA CIFRA DE FABLE: llamó «mucho más estrecho» a un
  margen que medido resultó ser del 77% en tablas anchas. Lo reconoce sin
  rodeos, y la consecuencia no fue reforzar la guarda sino retirar una
  pretensión.
- **F-89 — PAR COMPLETO**, en `F-89.md` (30/08/2026). LA ENTRADA MÁS CARGADA
  del archivo: trae doctrina nueva (la jerarquía determinista cerrada por los dos
  lados, la regla del ancla, el criterio bloqueante/declarable) Y el mapa entero
  del MVP. Es la primera que contiene un PLAN DE CIERRE y no solo una decisión.
- **F-88 — PAR COMPLETO**, en `F-88.md` (29/08/2026). Es la TERCERA superación
  que marca el archivo, y la primera que supera a DOS consultas a la vez y por
  el MISMO supuesto tácito: F-83 P2 y F-84 P1 hablaban de «la pareja de tablas»
  en singular. El supuesto no se veía porque el corpus de pruebas lo cumple.
- **F-86 y F-87 — PARES COMPLETOS**, en `F-86.md` y `F-87.md` (28/08/2026).
  F-87 es la segunda superación que marca el archivo y la PRIMERA CON LA
  CONSULTA DELANTE: el cambio de especificación se lee sin reconstruirlo.
- **F-85 — PAR COMPLETO**, en `F-85.md` (28/08/2026). Es la consulta que creó
  este archivo, así que queda archivada dentro de sí misma.
- **F-84 — EL PRIMER PAR COMPLETO DEL ARCHIVO**: consulta y respuesta, las dos
  íntegras, en `F-84.md` (28/08/2026). La consulta llegó en un segundo envío,
  después de la respuesta.
- **F-83 — la RESPUESTA, archivada** en `F-83.md` (28/08/2026). Su consulta
  enviada **NO SE CONSERVA**, y eso es un hecho PERMANENTE: no se puede
  reconstruir, así que ese par nunca se completará. No cuenta como deuda de
  B.118.
- **F-70 — la RESPUESTA, íntegra y literal**, en `claude/Cierre_F70.md` §2, con
  la nota de que ese fichero existe *porque esa respuesta se perdió una vez al
  migrar el chat*. **Falta la consulta enviada.**
- **F-81 — la CONSULTA, íntegra**, en `claude/Consulta_Fable_F81.md`. **Falta la
  respuesta.**
- **F-75 — rastro indirecto.** `claude/Descarte_Filas_Ajenas.md` dice ser «lo que
  vino de vuelta» al pedir la batería, pero está reformateado como
  especificación y no se declara literal. No cuenta como archivada.
- **F-82 — una frase literal**, citada en `Contrato_Contadores.md:19` («el
  contrato es barato, el sistema grande es caro»). Una frase no es un archivo.
- **F-72 — cero rastro** de ningún tipo en todo el repositorio.
- **El resto (F-71, F-73, F-74, F-76 a F-80)** existe solo como
  REFERENCIAS y resúmenes en la bitácora, los pendientes y el protocolo. Un
  resumen no cuenta: es exactamente lo que F-85 descarta.

Fuera de rango, con el mismo patrón incompleto: `Consulta_Fable_F22_Juez.md`
(consulta sin respuesta) y `Consulta_Fable_F47_Paso5.md` (veredicto sin
consulta).

**Completar esto es B.118.** El agujero queda medido y visible aquí en vez de
olvidado, y se va cerrando a medida que los textos aparecen — F-83 fue el
primero, el 28/08. Lo que no se puede cerrar nunca queda dicho como tal: la
consulta enviada de F-83 no existe.
