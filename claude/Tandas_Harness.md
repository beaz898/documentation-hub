# Tandas del harness de tasas

## 09/09/2026 — A5 · RESERVADA, NO LANZADA — treinta créditos con sus cuatro razones

**No se lanza hasta después del arreglo de B.204** (F-106 P2: arreglar antes,
medir después, porque medir un camino condenado compra evidencia perecedera).
Esta entrada existe para que, cuando se lance, no haya que reconstruir de memoria
ni por qué se gastan ni qué no cubre.

### LA PREDICCIÓN, QUE SE HEREDA INTACTA

**3 · 57 · 0 · 0** —discrepantes, idénticas, solo en A, solo en B— sobre el mismo
par que A6, y con `tablas_analizado ≥ 1` y `pares_ciegos 0`.

Se hereda porque **describe el resultado del análisis, no el transporte**: el
arreglo de B.204 cambia cómo viaja el fichero, no qué dice. Si el A5 rehecho da
3 · 57 · 0 · 0, el arreglo no rompió el análisis; si da otra cosa, es hallazgo.

⚠️ **SU RIESGO DECLARADO**: que los chunks guardados de OPE-14 sean de un cortador
anterior al de hoy. Los ocho `.xlsx` salieron con `extractor_version 3` el 09/09,
pero **que OPE-14 sea uno de esos ocho NO está determinado**. Se resuelve con una
consulta al censo **antes** de gastar; si su versión no es 3, la predicción no
vale y hay que decirlo antes, no después.

### POR QUÉ TREINTA CRÉDITOS SI EL NEGATIVO YA ESTÁ EN SUITE

El control negativo de la puerta vive desde el 09/09 en
`lib/analysis/diff-vision.test.ts` —guarda que cierra, lado analizado ciego,
`pares_ciegos 1`, `ciegos_por_el_analizado 1`— **por cero créditos y en
milisegundos**. Lo que la suite **no** puede ver, y es lo único que compran los
treinta:

| # | lo que sólo se ve en pasada real |
|---|---|
| 1 | que `analyze-v2` **entre de verdad** por la rama `storagePath`: la descarga desde Storage y `extractSegments` sobre el binario real |
| 2 | que **el temporal siga en Storage** en ese momento |
| 3 | que `new_document_chunks` **sobreviva al viaje** por `analysis_jobs` — JSON de ida y vuelta, en una tubería que por comentario propio «ya borró cuatro campos en tránsito» |
| 4 | que los contadores queden **PERSISTIDOS**, que es la cifra que vale (F-102: el log es narrativa, la base es evidencia) |

**Una vez, no una pareja de sesenta cada tanda.**

### DOS DATOS QUE HAY QUE TENER DELANTE AL PLANIFICARLA

⚠️ **EL `.xlsx` DE OPE-14 NO ESTÁ EN EL REPOSITORIO.** Sólo están su registro de
siembra (`corpus-pruebas/SIEMBRA_OPE-14.md`) y su verificador
(`scripts/verificar-ope14.mjs`); el fichero se hizo a mano y vive en OneDrive.
`git log --all -- 'corpus-pruebas/OPE-14*'` no devuelve nada.

⚠️ **CONSECUENCIA: EL NEGATIVO EN SUITE VA SOBRE OTRO PAR QUE LA GEMELA.** Usa
OPE-10 / OPE-11, que sí están versionados. No lo invalida —lo que ejercita es la
ceguera, no la cifra sembrada— pero **no se puede decir «negativo y positivo
sobre el mismo par»**, y si alguien lo dice, será falso.

⚠️ **Y LA RECETA DEL NEGATIVO YA SE CORRIGIÓ UNA VEZ, EN SUITE Y GRATIS**: decía
«tocar un carácter», y con un ESPACIO la guarda no se rompe —
`normalizeTextForHash` (`hash-check.ts:32-44`) colapsa espacios, unifica saltos,
hace `trim()` y `toLowerCase()`. Si alguna vez este negativo se ejerce en
producción, **la edición tiene que ser de CONTENIDO**, no de espaciado ni de caja.

---

## ⚠️ PENDIENTE DE VERIFICACIÓN (03/09/2026) — ¿MIDIÓ ALGUNA TANDA CON LA RED
POR NOMBRE ACTIVA?

NO ES UNA CONCLUSIÓN: es una condición que hay que poder declarar en cada
entrada y que hasta hoy no se registraba.

⚠️ **CORREGIDO EL MISMO DÍA, Y LA PREMISA ERA MÍA**: la primera versión de esta
entrada decía que las contradicciones consigo mismo «se descartaban aguas abajo
por NOMBRE IDÉNTICO, sin dejar rastro». **ESO NO EXISTE.** Verificado sobre
`lib/analysis/` entero: la autoexclusión se hace por `documentId` en cuatro
sitios —`retrieval.ts:417`, `verify-claims.ts:306`, `synthesize.ts:208`,
`hash-check.ts:76`— y NO hay una sola comparación de nombres en el pipeline.
La frase venía de la consulta y se copió sin comprobarla, un turno después de
promover a `CLAUDE.md` la regla de que toda premisa fáctica viaja con su comando
y su línea.

**LA CONDICIÓN, como es de verdad**: hasta el arreglo del parámetro, un documento
YA INDEXADO analizado DESDE EL CHAT se encuentra a sí mismo entre sus candidatos
—el parámetro de exclusión viaja nulo en ese camino—, y lo que pasa después
depende del contenido:
· **contenido IDÉNTICO** → `checkContentHash` corre el primero
  (`pipeline.ts:1060`) y CORTOCIRCUITA el pipeline entero: el informe dice «este
  documento es idéntico a X», siendo X él mismo. Resultado VISIBLE y engañoso, no
  un descarte silencioso.
· **contenido CAMBIADO** (el caso normal al reanalizar) → el hash no casa, **no
  hay red ninguna**, y las contradicciones consigo mismo salen como hallazgos
  reales.
Así que no hay «red que retirar»: la exclusión por identidad no sustituye a nada
en ese camino — **es la primera que va a existir ahí**.

**LO QUE DICE EL FICHERO, y es todo lo que dice**:
· Tres entradas declaran el camino explícitamente y las tres dicen BANDEJA:
  la remedición del frente 2 (su maniobra se monta sobre la bandeja), el bloque
  del verificador («cuatro pasadas, modo rápido desde la bandeja») y F-73
  («los cinco casos, desde la bandeja de revisión»). Desde la bandeja el
  parámetro SÍ viaja, así que la exclusión por identidad ya estaba activa y la
  red no hacía falta.
· **NINGUNA entrada menciona el chat ni una subida.** Verificado con grep sobre
  el fichero entero.
· Pero **la mayoría de las entradas no declaran el camino**, así que el fichero
  no puede cerrar la pregunta por sí solo.

**EL DISCRIMINADOR, para aplicarlo a lo viejo y para registrarlo en lo nuevo**, y
con la corrección de arriba es MÁS FUERTE de lo que se escribió: una pasada
corrida en esa condición habría dejado huella imposible de perder —o un informe
de «duplicado exacto» de un documento consigo mismo, o un candidato EXTRA con
score ≈ 1,0—. **Ninguna de las dos aparece en este fichero.** En la pasada 1 de la
remedición el log dice «1 candidato, score máx 0,988» en las dos direcciones: un
solo candidato, el de la pareja, incompatible con la autocomparación.
Sigue sin ser una conclusión —la mayoría de entradas no declaran el camino— pero
la evidencia negativa es sólida.

**QUÉ HACER**: (1) revisar los logs guardados de las tandas que no declaran
camino, buscando un candidato con score ≈ 1,0; (2) y desde ahora, **toda entrada
nueva declara DESDE DÓNDE se lanzó**, que es un dato de una línea que hoy falta
y que habría contestado esto sin abrir un pendiente.

---


Histórico de mediciones. **Crece por arriba: lo más reciente, primero.**

Los **once casos** —qué documentos entran en cada uno y qué debe encontrar—
están en `claude/Casos_Harness.md`. El **método** —cómo se lanza una tanda, qué
se apunta de cada pasada, la regla de admisión— está en
`claude/Protocolo_Harness_Tasas.md`. **Este fichero no repite ninguno de los
dos**: aquí solo van las cifras.

Al leer una tasa, mirar siempre contra qué commit se midió. Y recordar que
«línea de base» significa cosas opuestas en `Cierre_B81.md` (el síntoma, ANTES
de la cura) y en los relevos (el estado sano, DESPUÉS) — la advertencia está al
principio del protocolo.

---

### FOTO PREVIA AL CORTADOR (07/09/2026) — `EXTRACTOR_VERSION = 2`

**No es una tanda: es una LÍNEA DE BASE.** Se toma antes de tocar el cortador
porque sin ella «se movió» y «lo arreglamos» son indistinguibles. Todo leído de la
BASE, no de los logs (F-102).

#### FAMILIA 1 — LA MEDIDA DEL DEFECTO. **Tiene que MOVERSE.**

Instrumento validado con control positivo antes de medir: los dos `.docx` largos
que TENÍAN que salir, salieron.

| documento | tipo | cortados | trozos |
|---|---|---|---|
| NOR-10_protocolo-esterilizacion-instrumental | text | **58** | 75 |
| CLI-12_manual-calidad-clinica.docx | text | **40** | 59 |
| CLI-01_protocolo-esterilizacion-instrumental | text | **7** | 8 |
| OPE-03_protocolo-acogida-al-paciente.txt | text | 6 | 7 |
| CLI-03_historia-clinica-consentimiento-info | text | 5 | 6 |
| NOR-11_gestion-de-residuos-sanitarios.docx | text | 4 | 16 |
| OPE-05_atencion-telefonica.txt | text | 4 | 5 |
| RRHH-03_vacaciones-y-permisos.txt | text | 3 | 4 |
| OPE-07_cobros-y-facturacion.txt | text | 3 | 5 |
| CLI-13_instrucciones-clinicas-residuos.docx | text | 1 | 11 |
| **todo lo demás** (25 filas) | text / table_row / table_summary | **0** | — |

**DIEZ documentos con prosa cortada. TODAS las filas de tabla a CERO**, en los
ocho `.xlsx` del corpus y en sus tres tipos de trozo.

⚠️ **Ese cero de las tablas es lo que salva la familia 2**: las celdas no pasan por
el troceador de prosa, así que el cortador nuevo no puede moverlas. Y ya no es una
lectura del código: está **medido sobre 24 documentos**.

⚠️ **Y CLI-01 es el peor en proporción — 7 de 8.** Si tras el cortador sigue en 7,
el arreglo no le llegó.

#### FAMILIA 2 — LOS CONTROLES. **NO pueden moverse.**

| control | 04/09 | 07/09 | lectura |
|---|---|---|---|
| OPE-10 → OPE-11, `contradictions_found` | **15** | **15** | ✅ se reproduce |
| `contradictions_confirmed` | 15 | 15 | estructural: nunca difiere de `found` aquí |
| `overlaps_found` | 2 | **1** | ⚠️ ver abajo |
| `verificador.confirmados_por_estructura` | 0 | **0** | ✅ centinela invertido |

⚠️ **EL CONTROL SE RESTAURÓ, Y NO ERA GRATIS.** OPE-10 se había perdido en una
limpieza. Sin él, el 15/15 dejaba de ser un control —un control tiene que ser
REPETIBLE— y pasaba a registro histórico. Se resubió por OneDrive, para que entrara
en `pendiente` y no sumara otro documento por pertenencia, y se remidió en rápido:
**5 créditos**. La remedición vale doble: **la cifra se reproduce sobre un corpus
muy cambiado** —limpiezas, resubidas, cambio de origen y el paso 0 en medio—, que
era la mitad valiosa de la prueba.

⚠️ **EL CERO DE `por_estructura` ES EL VALOR CORRECTO, y casi se lee al revés.**
Está declarado en `pipeline.ts:472-474`: «vale CERO SIEMPRE desde este commit. No
es una regresión, es el diseño. El contador NO se retira: si algún día vuelve a
moverse, algo está mal». **Las 15 del diff no pasan por la cascada** — el sello de
estructura es exclusivo de lo que emite el diff, que lo construye por su cuenta.
Así que el control es `contradictions_found`, y ese contador es un **centinela
cuyo cero hay que vigilar**.

⚠️ **LOS SOLAPAMIENTOS BAJARON DE 2 A 1, Y QUEDA ABIERTO.** No se ha investigado.
Puede ser el corpus —OPE-10 es una subida nueva, y el segundo solapamiento del
04/09 podría venir de un tercer documento que ya no está— o puede ser otra cosa.
**Se anota como lo que es: una diferencia sin explicar en una cifra de control.**

#### FAMILIA 3 — LA DE PROSA. **NO SE TOMA, y con su razón.**

Se decidió **no gastar los 30 créditos**, y no por ahorro:

· **Sería una muestra de tamaño uno sobre cifras NO DETERMINISTAS.** Las del juez
  salen de un modelo; dos ejecuciones del mismo código pueden diferir. Sin una
  segunda medición previa no hay banda de ruido, y sin banda no se puede separar
  «lo movió el cortador» de «el modelo varió».
· **Y el montaje ya no aísla.** NOR-10, CLI-12, RRHH-06 y `new 9.txt` están en
  `analizado` y **no hay vuelta atrás**: participan por pertenencia en toda pasada.
  Con ellos dentro, ninguna pareja queda aislada salvo la suya.

**Consecuencia declarada**: tras el cortador, **un cambio en las cifras del juez no
se podrá atribuir**. Se pierde detección de efectos sutiles, y se dice.

#### LO QUE ESTA FOTO **NO** CONGELA

· **La huella del troceado (md5 por chunk)** — pendiente. Sin ella se podrá decir
  «el reparto cambió» pero no **en qué trozo empezó a diferir**.
· **La recuperación del chat.** No hay cifra de si responde bien; un troceado mejor
  debería notarse ahí y **no se va a poder demostrar**.
· **Los diez caminos del censo** que siguen sin línea de base.

---

### RESULTADOS — EL CAMINO DEL CHAT: PROPIETARIO Y ADOPCIÓN (04/09/2026)

**LANZADA DESDE EL CHAT.** Mide lo que se escribió el 03/09 —F-101: el análisis
nace colgado del FICHERO y el documento lo ADOPTA al nacer— y es la primera vez
que se comprueba en producción.

**LEÍDA DE LA TABLA.** Tres filas de `analysis_results`, mismo nombre de
documento, tres momentos:

| hora | documento | `storage_path` | `document_id` | qué se hizo |
|---|---|---|---|---|
| 10:28 | RRHH-08 | **✓** | **null** | analizado, NO indexado |
| 10:30 | RRHH-08 | **✓** | **null** | analizado, NO indexado |
| 10:33 | RRHH-08 | **✓** | **544a23b7** | analizado **e indexado** |

⚠️ **LO QUE LO CONVIERTE EN MEDICIÓN Y NO EN OBSERVACIÓN**: las tres filas están
EN LA MISMA TABLA, y **cada una tiene exactamente lo que le corresponde según si
se indexó o no**. No es que la última salga bien: es que las tres salen
distintas, y la diferencia es la única variable que se movió.

⚠️ **Y LA ADOPCIÓN ES POR FICHERO, NO POR NOMBRE** — lo demuestran las dos
primeras: comparten nombre con la tercera y **NO fueron adoptadas**. Cada subida
tiene su propia ruta en Storage, y la adopción alcanza solo a los análisis de
*esa* ruta. Si hubiera emparejado por nombre, las tres habrían acabado colgadas
del mismo documento — que es justo lo que este frente vino a retirar.

⚠️ **Y `storage_path` SIGUE PRESENTE en la fila adoptada.** Los dos propietarios
conviven: la ruta es la historia del fichero, el documento es el dueño adoptivo.
No se sustituye uno por otro.

**LO QUE ESTO CIERRA, del 03/09**: los análisis del chat ya no nacen huérfanos
—nacen con la ruta— y **el «sí» del usuario ya ata**, que era la mitad que F-100
dio por hecha y no existía: no había un solo UPDATE sobre esa columna en el
repositorio.

#### PASADA 3 — reanálisis desde la bandeja

Un candidato. La contradicción de Pablo Reyes **descartada por
`cubierto_por_diff`, con el motivo NOMBRANDO LA COLUMNA** — la lectura C de F-90
sigue viva en producción y sigue siendo auditable: dice *qué* comparó el diff, no
solo que lo cubrió.

#### PENDIENTE DE ESTA SERIE

La pasada 4 —el reanálisis desde el modal de mejora, que es la que comprueba
B.163— y el control de identidad de cierre.

---

### RESULTADOS — PAR GRANDE (OPE-10 / OPE-11), `a99c8999` (04/09/2026)

**LANZADA DESDE LA BANDEJA**, con la pareja participando POR NOMINACIÓN (`ids de
tanda`) y **el corpus de la organización VACÍO** — ningún documento en
`analizado`, cero duplicados. Es la primera vez que el aislamiento no depende de
que el rerank descarte a nadie.

**LÍNEA DE BASE SOBRE LO GUARDADO.** La del 02/09 registró «15 emitidas», que es
la línea del LOG del diff, no `contradictions_found`. Ésta es la primera cifra
persistida de esta pareja.

| GUARDADO en `analysis_results` | OPE-10 → OPE-11 | OPE-11 → OPE-10 |
|---|---|---|
| `contradictions_found` | **15** | **15** |
| `contradictions_confirmed` | **15** | **15** |
| `overlaps_found` | **2** | **2** |

⚠️ **PREDICCIÓN ESCRITA ANTES Y CUMPLIDA.** Se predijo 15/15 sobre la TABLA, no
sobre el log, y salió 15/15. Es la primera predicción de esta serie que se
contrasta contra el dato persistido — y la que cierra el hueco del 03/09, cuando
25 y 17 se dieron por 15 leyendo una línea por candidato.

⚠️ **Y LO QUE ESTO DEMUESTRA DEL CAMINO DE RECUPERACIÓN**: los 15 no se han
movido tras SIETE commits sobre ese camino (reemplazo, borrado por id, criterio
de origen, tres sujetos, propietario, adopción, filtro por generación). **No hay
regresión**, que era lo que la remedición del frente 3 venía a medir.

⚠️ **LOS 25 Y 17 DEL 03/09 QUEDAN EXPLICADOS**, y no eran un fallo: 15 del diff
contra la pareja + 10 y 2 del JUEZ contra un tercer documento del corpus
(`SIEMBRA_corpus_ampliado.md`). El montaje no estaba aislado. Ver B.173.

---

### RESULTADOS — SIEMBRA (RRHH-08 / OPE-13), `aa3c6d06` (04/09/2026)

**LANZADA DESDE LA BANDEJA.** Se declara el camino porque desde hoy es
obligatorio: sin él, una entrada no se puede volver a interpretar (ver el
pendiente de la cabecera de este fichero).

⚠️ **LEÍDA DE LA TABLA, NO DEL LOG.** Es la primera entrada que cumple la regla de
F-102: las cifras que siguen son las de `analysis_results`, y el log solo se usa
para el mecanismo. La entrada del 02/09 de esta misma pareja registró cifras del
log —«2 por juicio, 0 por estructura»—, que NO son `contradictions_found`.

**LÍNEA DE BASE DE ESTA PAREJA.** No contrasta contra nada: la crea.

| GUARDADO en `analysis_results` | OPE-13 → RRHH-08 | RRHH-08 → OPE-13 |
|---|---|---|
| `contradictions_found` | **2** | **2** |
| `contradictions_confirmed` | **2** | **2** |
| `overlaps_found` | **0** | **0** |

| MECANISMO (log) | |
|---|---|
| Retrieval | **1 candidato** en las dos direcciones |
| Las dos ramas | presentes |
| Verificador | 0 por estructura, **2 por juicio** |
| Diff de tablas | **0 parejas** |

⚠️ **EL CERO DE PAREJAS ES CORRECTO Y ESTÁ DOCUMENTADO**: es «el territorio sin
clave» del 02/09. RRHH-08 y OPE-13 comparten Clínica, Especialidad y Turno, pero
**ninguna identifica una FILA** — son anclas, no clave—, así que el par cae por la
primera puerta de `emparejarTablas` (`table-pairing.ts:135`). El emparejador SÍ
lo intentó. **Compartir columnas no es tener clave**, y ésa es la distinción que
esta pareja existe para medir.

⚠️ **Y `contradictions_confirmed` = `contradictions_found`, otra vez.** No es una
coincidencia de esta tanda: es estructural — todo lo que sobrevive lleva
`confirmedBy`. **Esa columna no puede diferir de `found` en este camino**, así
que no mide nada. Sigue sin ficha propia.

══ LO QUE ESTA PASADA COMPRUEBA Y LO QUE NO ══
· **COMPRUEBA** que con la bandeja acotada de verdad el retrieval trae UN
  candidato, y que el aislamiento de una tanda se puede conseguir. En el intento
  anterior aparecieron terceros —SIEMBRA_corpus_ampliado.md y CLI-01— porque
  estaban en `analizado` con vectores.
· ⚠️ **NO COMPRUEBA que un documento fantasma no interfiera.** Los 32 en
  `analizado` sin vectores están **en otras organizaciones**, y una recuperación
  jamás los habría visto: el espacio de nombres de Pinecone es por organización.
  Lo que aísla aquí es la ORGANIZACIÓN, no la ausencia de vectores.
  **Para probar lo otro haría falta un fantasma en la organización propia**, y hoy
  no hay ninguno. La afirmación «sin vectores no puede ser candidato» sigue
  sostenida por LECTURA del filtro, no por medición.

---

### RESULTADOS — REMEDICIÓN DEL FRENTE 2, `daca6dbf` (02/09/2026, 13:29–13:34)

**Cinco pasadas, todas en modo rápido, todas limpias.** Es la validación del
frente 1 (que se dejó pendiente al cerrarlo) y la primera medición del frente 2.

MANIOBRA: todo pendiente y **solo la pareja de cada pasada en la bandeja** — el
corpus visible es `analysisStatus=analizado` MÁS los demás documentos de la
bandeja, así que acotar la bandeja es lo que aísla la pasada.

| pasada | qué | resultado |
|---|---|---|
| 0 | limpia, sin pareja | cero candidatos |
| 1 | OPE-10 ↔ OPE-11 | **15 y 15**, `por_estructura = 0` |
| 2 | RRHH-08 ↔ OPE-13 | las dos ramas, 2 por juicio, 0 por estructura |
| 3 | NOR-10 ↔ NOR-11 (prosa) | 0 / 0, sin regresión |
| 4 | descarte de fila + reanálisis | la fila vuelve marcada sola |

---

#### PASADA 1 — el par grande, las dos direcciones

| | OPE-10 → OPE-11 | OPE-11 → OPE-10 |
|---|---|---|
| Retrieval | 1 candidato, score máx **0,988** | 1 candidato, **0,988** |
| Nivel del reparto | **2** (21/60 filas, 39 fuera por tamaño) | **2** (22/60 filas, 38 fuera) |
| Fragmentos al juez | 6 — `table_row: 1` | 5 — `table_row: 2` |
| Overlap | 33 % | 33 % |
| Contradicciones del juez | 1 | 1 |
| **Diff** | **15 emitidas** | **15 emitidas** |
| Verificador | 1 → **0 confirmados (0 estructura, 0 juicio)**, 1 descartado | ídem |
| Tiempo | 16.868 ms | 15.608 ms |

    [fef525d3] "Duración de Prótesis parcial removible (PRO-03)"
       → descartado: cubierto_por_diff (el diff comparó Duración (min) en esas dos filas)
    [4e18e79b] "Profesional asignado para Regeneración ósea guiada (IMP-03)"
       → descartado: cubierto_por_diff (el diff comparó Profesional asignado en esas dos filas)

**LA LECTURA C, EN PRODUCCIÓN.** El motivo del descarte **nombra la columna**
—«el diff comparó *Duración (min)*»— en vez de decir solo «cubierto». Es la
diferencia entre un descarte que se puede auditar y uno que hay que creerse.

**Y EL HALLAZGO DEL JUEZ ES DISTINTO EN CADA DIRECCIÓN** (PRO-03 en una, IMP-03
en la otra) y los dos caen por lo mismo. La supresión no depende de QUÉ mire el
juez: depende de que el diff ya lo comparara. Es la generalización que B.124
pedía y que un caso fabricado no puede enseñar.

⚠️ LETRA PEQUEÑA DEL «1 hallazgo del juez»: el reparto fue de **nivel 2** — el
juez vio 21 de 60 filas en una dirección y 22 de 60 en la otra. Que solo emitiera
una contradicción se lee sobre ESE tercio, no sobre la tabla entera. El diff sí
vio las 60, y por eso emite 15: **las dos cifras miden cosas distintas y no se
comparan entre sí.**

---

#### PASADA 2 — el territorio sin clave, las dos direcciones

| | OPE-13 → RRHH-08 | RRHH-08 → OPE-13 |
|---|---|---|
| Retrieval | 1 candidato, **0,956** | 1 candidato, **0,956** |
| Nivel del reparto | **1** (14 filas completas) | **1** (14 filas completas) |
| Fragmentos al juez | 15 — `table_row: 14`, todas | 15 — `table_row: 14`, todas |
| Overlap | 93 % | 93 % |
| Contradicciones del juez | 2 | 2 |
| Verificador | 2 → **2 por juicio, 0 por estructura**, 1 reclasificado | *(línea no capturada)* |
| Tiempo | 9.834 ms | — |

    OPE-13 → RRHH-08
      [129c6113] "Turno y jornada semanal de Dra. Ana Belmonte"
         → baja a juicio: sin_clave (2 columna(s) de ancla, pero la estructura no puede firmar)
      [f1ab305a] "Jornada semanal de Dr. Carlos Medina"
         → baja a juicio: columna_no_comparada (sin oposición en lo compartido;
           columnas asimétricas citadas: Responsable, Jornada semanal, Profesional, Horas semana)

    RRHH-08 → OPE-13
      [25bf5508] "Turno de Dra. Ana Belmonte"          → sin_clave
      [eb3b7c97] "Horas semanales de Dr. Carlos Medina" → columna_no_comparada

**LAS DOS RAMAS EN LAS DOS DIRECCIONES.** Es la tercera vez que se ven —la
siembra las estrenó el 01/09— y la primera con la cascada reordenada de F-93
detrás. Ninguna baja se convirtió en confirmación por estructura, que es lo que
el frente 1 tenía que garantizar.

---

#### PASADA 3 — prosa, el control de no-regresión

| | NOR-10 → NOR-11 | NOR-11 → NOR-10 |
|---|---|---|
| Overlap | **0 %** | **0 %** |
| Contradicciones / solapamientos | 0 / 0 | 0 / 0 |
| Verificador | 0 → 0 | 0 → 0 |
| Tiempo | 9.144 ms | 7.531 ms |

El frente 2 no tocó la prosa y el control lo confirma.

⚠️ Y CON SU LETRA PEQUEÑA, que es la misma de siempre y conviene no perder:
**NOR-10 se truncó a 6.000 de 73.962 caracteres** (un 8 %), y NOR-11 a 6.000 de
15.417. «Cero contradicciones en prosa» significa cero **en lo que el juez llegó
a leer**. No es una regresión ni un fallo: es el techo declarado que el frente 4
viene a levantar. Anotarlo como «prosa a cero» a secas diría más de lo que el
dato dice.

---

#### PASADA 4 — la ficha B, de punta a punta

Observada en pantalla: se marcó una fila de tabla de OPE-10 como «no es un
error», se relanzó OPE-10 contra OPE-11 en rápido, y **la fila volvió marcada
sola**.

Es el ciclo entero de la ficha B en producción: el botón aparece (commit 1), la
huella TABULAR viaja al servidor y se registra (commit 1), y `marcarDescartadas`
la reconoce al volver por su identidad tabular (commit 2). Hasta el 01/09 ese
botón no existía para las filas de tabla.

---

#### LO QUE FALTA EN ESTA ENTRADA, dicho para que no se lea como completo

Los logs de las pasadas **0** y **4** no llegaron al registro, y de la pasada 2
falta la línea del verificador de la dirección RRHH-08 → OPE-13 (sí están sus
dos bajadas a juicio). Las tres cosas están **observadas por el director** y
ninguna contradice lo medido; se anotan como observación, no como cifra
capturada, que es la distinción que este fichero mantiene.

---

### RESULTADOS — TANDA DE LA SIEMBRA (RRHH-08 / OPE-13), `9b0d7eb7`

**Dos pasadas rápidas, las dos direcciones. LAS DOS RAMAS SE EJERCEN.** Es la
primera vez que se ven en producción la degradación del punto 4 y el destino de
B.130, que era lo que B.131 declaraba imposible de ver.

| | OPE-13 → RRHH-08 | RRHH-08 → OPE-13 |
|---|---|---|
| Retrieval | 1 candidato, score máx **0,956** | 1 candidato, **0,956** |
| Rerank | **1 seleccionado** | **1 seleccionado** |
| Nivel del reparto | **1** (14 filas, 1.854 car.) | **1** (14 filas, 1.913 car.) |
| Fragmentos al juez | 15 — `table_row: 14`, todas | 15 — `table_row: 14`, todas |
| Overlap | **93 %** | **93 %** |
| Contradicciones del juez | 2 | 2 |
| Verificador | 2 → **2 confirmados (0 estructura, 2 juicio)**, 0 descartados, 1 reclasificado | ídem |
| Tiempo | 13.659 ms | 9.700 ms |

    [129c6113] "Turno de Dra. Ana Belmonte"
       → baja a juicio: sin_clave (2 columna(s) de ancla)   → confirmado por juicio
    [f1ab305a] "Jornada semanal de Dr. Carlos Medina"
       → baja a juicio: columna_no_comparada (columnas asimétricas citadas:
         Responsable, Jornada semanal, Profesional, Horas semana)
       → confirmado por juicio

#### LA PREDICCIÓN, PUNTO POR PUNTO

| Predicho | Medido |
|---|---|
| `0 pareja(s)`, sin línea `Diff de tablas contra …` | ✔ **ausente en las dos**, como se dijo |
| `cubierto_por_diff` = 0 y `emparejamiento_invalido` = 0 | ✔ 0 descartados en el verificador |
| `confirmados_por_estructura` = 0 | ✔ en las dos |
| Nivel 1, documentos sin truncar | ✔ sin aviso de truncado |
| **Que el rerank deje pasar el par** | ✔ **en las dos** — era la única condición que la sonda no podía verificar |
| Belmonte → `a_juicio.sin_clave` | ✔ con **2 anclas**, como calculó la sonda |
| Medina → `a_juicio.columna_no_comparada` | ✔ con las cuatro asimétricas nombradas |
| Techo de **una** llamada corta por pasada | ✔ los 2 hallazgos en un lote |

**Y el control negativo aguantó**: de catorce filas, el juez emitió exactamente
las **dos sembradas** y **ninguna de las doce que coinciden en todo**. Cero
falsos positivos.

#### ⚠️ UNA PREDICCIÓN FALLADA, Y ERA PELIGROSA

Escribí que la llamada corta debía confirmar a Medina **«y solo a él»**, y que
confirmar a otro sería hallazgo. **Confirmó a los dos, y las dos
confirmaciones son correctas**: el `Turno` Mañana/Tarde de Belmonte es una
discrepancia sembrada, y está escrita en el registro de siembra que redacté yo.

**Si el director llega a leer solo esa línea, habríamos declarado falso positivo
un acierto del sistema.** No era una predicción imprecisa: era una trampa,
porque las predicciones se usan como criterio de aceptación.

El defecto es el **alcance del cuantificador** —«solo a él» ¿de entre quiénes?—
cometido en una PREDICCIÓN y no en una regla dictada. De ahí sale la extensión
de la cuarta pieza que va al protocolo.

#### EL COSTE, la cifra que F-90 P4 pedía

**Una llamada corta por pasada.** Los dos hallazgos viajan en el mismo lote
(`MAX_PER_CALL = 15`), así que con un candidato el techo es uno y se alcanzó.
Confirma **el extremo bajo** de «de una a cinco», con el límite ya declarado:
este corpus no puede desmentir la cifra, solo tocarla por abajo.

Tiempos totales de 9,7 y 13,7 segundos, muy por debajo de `maxDuration = 120`.

#### LOS SOLAPAMIENTOS RECHAZADOS: cuatro, y con causa mecánica

Tres en una dirección y uno en la otra —**4 de 4, el cien por cien de los
solapamientos del par**— todos por `cita no verificable, lado=ambos`, y **con
las dos citas idénticas entre sí**:

    nuevo    = "[F0] Dra. Marta Gil | Chamberí | Cirugía | Mañana | 35"
    existente= "[F0] Dra. Marta Gil | Chamberí | Cirugía | Mañana | 35"

**El juez copió la fila EXACTAMENTE como se la enseñamos, incluida la etiqueta
`[F0]`** que le pone `renderTableRow` (`table-structure.ts:171`). Y por eso la
cita no verifica: `alignQuoteToCells` parte por `|` y compara segmento a
segmento, así que `«[F0] Dra. Marta Gil»` no casa con la celda `«Dra. Marta
Gil»`; falla UN segmento de cinco y la función devuelve `null`.

Es la cuarta forma de B.107 y **la única con causa nuestra**: no es que el
modelo narre o enumere — es que **etiquetamos la línea y el modelo copió la
etiqueta**. Anotado en B.107.


---

## 01/09/2026 — `a2db84e0` — PREDICCIÓN DE LA TANDA DE LA SIEMBRA, escrita antes de lanzar

**Dos pasadas rápidas**: RRHH-08 en corpus analizando OPE-13, y al revés. Es la
primera vez que el corpus puede producir las dos ramas que B.131 declara sin
ejercer.

### S1 — LO QUE NO PUEDE FALLAR, porque está computado sobre los ficheros

- **`0 pareja(s)`** contra el otro documento, en las dos direcciones. El par cae
  por la primera puerta.
- **NO habrá línea `Diff de tablas contra …`**: solo se imprime si
  `emision.grupos.length > 0`, y sin pares no hay grupos. **Su ausencia es lo
  esperado, no un fallo.**
- `verificador.confirmados_por_estructura` = **0**.
- **`descartado.cubierto_por_diff` = 0** y **`descartado.emparejamiento_invalido`
  = 0**. ⚠️ Y esto NO contradice la predicción escrita para el par grande: allí
  el par está EMITIDO y la identidad se verifica; aquí no hay par en ninguna de
  las dos listas, así que las dos guardas devuelven `sin_cobertura` y nadie
  muere en ellas. Un cero aquí es correcto; un cero allí sería el hallazgo.
- Tabla en **nivel 1** (1.737 y 1.792 caracteres) y documento **sin truncar**
  (1.854 y 1.913 < 6.000). El juez ve las catorce filas de los dos lados.

### S2 — LA RAMA QUE NUNCA SE HA VISTO

Si el juez enfrenta **Ana Belmonte** —`Turno` Mañana contra Tarde, con `Clínica`
y `Especialidad` iguales—:

    → baja a juicio: sin_clave (2 columna(s) de ancla, pero la estructura no
      puede firmar)

Sería **la primera aparición en producción de `a_juicio.sin_clave`**, y con ella
la degradación del punto 4 deja de estar solo declarada.

### S3 — LA OTRA RAMA, B.130, Y CÓMO NO LEERLA MAL

Si el juez enfrenta **cualquier otra fila**, las tres compartidas coinciden y
salta la otra:

    → baja a juicio: columna_no_comparada (sin oposición en lo compartido;
      columnas asimétricas citadas: Profesional, Horas semana, Responsable,
      Jornada semanal)

⚠️ **Eso vale para las trece filas, no solo para Carlos Medina.** `Profesional`/
`Responsable` y `Horas semana`/`Jornada semanal` son asimétricas en TODAS. Lo
que distingue a Medina **no es la rama, es que él lleva una discrepancia real
detrás** (44 contra 40). La llamada corta debería confirmarlo **a él y solo a
él**; si confirma a otro, es falso positivo.

### S4 — LA CIFRA QUE FABLE PIDIÓ EN F-90 P4, por fin medible

Con **un candidato**, el techo es **una llamada corta por pasada**
(`verifyFindings` mete hasta 15 hallazgos por llamada). Su predicción era «de
una a cinco por análisis»: aquí no puede pasar de una, así que esta tanda **no
puede desmentirla, solo puede confirmar el extremo bajo**. Se apunta lo que
salga y se dice con ese límite delante.

### S5 — LO QUE PUEDE SALIR MAL, y ya está declarado

1. **Que el rerank aparte el candidato.** Es la única condición que la sonda no
   pudo verificar y la que invalidó la pasada extra del 31/08. Si sale
   `Rerank: 0 seleccionados`, **la pasada no mide nada** y se dice así.
2. **Que el juez no emita nada.** B.82: es intermitente. Un cero se reporta con
   la tasa que excluye —con dos pasadas, no descarta nada por debajo del 78%—,
   nunca como ausencia.

### S6 — QUÉ SERÍA HALLAZGO

- Que aparezca **`descartado.cubierto_por_diff`**: significaría que el
  emparejador encontró clave donde la sonda midió que no la hay.
- Que Belmonte salga por **`equivalentes`**: sería B.130 sin arreglar, o el
  reordenado mal cableado.
- Que la llamada corta **confirme una fila que no es Medina**.

---

## ⚠️ PARA LA PRÓXIMA TANDA — EL REPARTO DE CONTADORES CAMBIA (01/09, F-93)

*Escrito antes de lanzarla, para que nadie lea el cambio como una avería.*

El reordenado de F-93 partió una guarda que estaba conflada. **Las cifras
publicadas no cambian; cambia POR DÓNDE muere cada cosa.**

| Contador | Antes | Después |
|---|---|---|
| `descartado.cubierto_por_diff` | se llevaba las filas que ERAN pareja **y las que no** | solo las que **son pareja y R2 confirma** → **baja** |
| `descartado.emparejamiento_invalido` | **cero desde que se creó** | **pasa a moverse** |
| `a_juicio.columna_no_comparada` | no existía | aparece donde antes se decía `equivalentes` de más (B.130) |

**Lo esperado en el par grande**, con lo medido el 31/08 delante:

- IMP-03 y EST-03 legítimos —filas pareja, el precio difiere— siguen saliendo
  por **`cubierto_por_diff`**.
- **`dc678e1b`** (EST-02 contra EST-03, el falso de B.124) pasa a
  **`emparejamiento_invalido`**. Mismo hash, otro contador.
- **Las quince siguen siendo quince**, y `confirmados_por_estructura` sigue en
  cero.

**No es que empiece a fallar algo: empieza a contarse con su nombre lo que
siempre ocurría bajo otro.** Si `emparejamiento_invalido` sigue a cero en el par
grande, ESO sí sería el hallazgo — querría decir que la identidad no se está
verificando sobre pares emitidos, que es justo lo que este commit arregló.

---

## 31/08/2026 — `cceddf86` — PREDICCIÓN ESCRITA ANTES DE LANZAR

*Este bloque se escribe y se commitea ANTES de la primera pasada. Los
resultados se añaden debajo, en esta misma entrada, sin tocar lo de arriba: si
una predicción falla, es HALLAZGO y se cuenta, no se acomoda.*

**Qué valida esta tanda**: los cuatro puntos del frente 1 (supresión del juez,
verificación de la 3ª puerta, la traza, y «sin clave la estructura no firma»),
más la emisión del diff de F-88. Es todo lo que cambió el 29, el 30 y el 31.

### LO QUE NO ES PREDICCIÓN, SINO CÁLCULO

Cuatro cifras salen de correr el emparejador y la emisión sobre los mismos
ficheros de `corpus-pruebas/`, así que **no se estiman: se computan**. Si
producción no las da, no es que la predicción falle — es que producción no está
haciendo lo que el código hace con los mismos bytes.

| Dirección | Emite el diff | Clave |
|---|---|---|
| OPE-11 contra OPE-10 | **15** | sí |
| OPE-10 contra OPE-11 | **15** | sí |
| RRHH-06 contra OPE-02 | **1** — «Discrepancia en Puesto», la sembrada | `Empleado`, 100% única en los dos lados, 10 filas emparejadas |
| OPE-02 contra RRHH-06 | **1** | ídem |

### P1 — LAS TRES DE F-90, que son contra lo que se contrasta

1. **Quince exactas** en el contador, las dos direcciones del par grande.
2. **Cero fila-contra-fila del juez confirmados por estructura**, o sea
   `verificador.confirmados_por_estructura` = **0 en TODAS las pasadas de TODOS
   los casos**. Desde el punto 4 el juez no tiene camino a ese sello: si se
   mueve, alguien firma sin derecho.
3. **Ningún hallazgo del registro de siembra perdido.**

### P2 — LOS CASOS 1 Y 2 CAMBIAN DE PRODUCTOR, y su ficha no lo dice todavía

`Casos_Harness.md` dice de los casos 1 y 2 «confirmada **por estructura**», y
seguirá siendo verdad — pero **la firma otro**. RRHH-06/OPE-02 empareja con
clave, luego el diff emite la discrepancia de `Puesto` y **el hallazgo del juez
sobre ese mismo par sale suprimido** (`descartado.cubierto_por_diff`), igual que
pasó con OPE-11 el 30/08.

⚠️ **Cómo NO leer un cero aquí**: si `descartado.cubierto_por_diff` vale 0 en
alguna pasada, eso NO es un fallo — es que el juez no emitió nada sobre ese par,
y es intermitente por B.82. Lo que **no puede** aparecer es un
`confirmado.por_estructura` del juez. Ése sí sería el hallazgo.

### P3 — EL CONTROL DE REGRESIÓN NO SE MUEVE

Casos 3, 4, 8, 9, 10 y 11 y el control negativo 5 dan **lo mismo que su línea de
base**. El diff no toca prosa, así que cualquier cambio ahí es hallazgo — no hay
mecanismo previsto por el que pudiera moverse.

### P4 — EL COSTE: la cifra que Fable espera, y por qué el harness NO PODÍA DARLA

Fable predijo «de una a cinco llamadas cortas de Haiku por análisis, y si sale de
ahí, traedlo». **Con el harness tal como está escrito, esa cifra habría salido
CERO, y el cero habría sido del instrumento y no del sistema.**

El punto 4 solo actúa en **territorio sin clave**, y los dos pares de tablas del
harness **tienen clave los dos** — computado arriba. Todo hallazgo
fila-contra-fila cae antes, en la supresión. Luego `a_juicio.sin_clave` = 0 en
los casos 1, 2, 6 y 7, **por construcción del corpus**.

Es la misma clase de límite que B.121 (el corpus es simétrico, no puede detectar
una confusión de lados) y B.125 (el juez es intermitente, no puede reproducir su
propio fallo): **un instrumento que no puede fallar donde debería.**

**LA SALIDA, computada**: los cuatro cruces de tablas que NO son los pares del
harness caen por la PRIMERA puerta, con cero pares y cero tablas sin
intersección — OPE-10↔OPE-02, OPE-11↔OPE-02, OPE-10↔RRHH-06, OPE-11↔RRHH-06. Ahí
sí hay territorio sin clave. De ahí sale la **pasada extra** del plan, que no es
ningún caso del catálogo y no sustituye a ninguno.

### P5 — LA TRADUCCIÓN QUE HAY QUE HACER ANTES DE CONTESTARLE A FABLE

**`a_juicio.sin_clave` NO es «llamadas cortas», y confundirlos daría una cifra
inflada.** `verifyFindings` mete hasta **15 hallazgos por llamada**
(`MAX_PER_CALL`), y se invoca **una vez por documento candidato** con lo que haya
sobrevivido. Luego:

> cinco hallazgos degradados en un documento son **UNA** llamada, no cinco.

La cifra de Fable —1 a 5 llamadas— se corresponde con **1 a 5 documentos
candidatos que tengan al menos un degradado**, no con el contador. Las dos se
apuntan por separado.

Y el otro lado del balance, medido el 30/08 y que va en la misma resta: la
supresión bajó las candidatas al double-check de **17 a 15**.

### P6 — QUÉ HARÍA FALTA PARA QUE UNA PASADA NO VALGA

`stageFailures` presente. Es la regla del protocolo §4 y no se negocia: si el LLM
se cayó, las tasas no miden lo que se cree.

### RESULTADOS — PASADA 0 (humo), `cceddf86`

**OPE-11 contra OPE-10, rápido, corpus solo con esos dos.**

| | esperado | medido |
|---|---|---|
| `contradictions_found` | 15 (calculado) | **15** ✔ |
| `stageFailures` | ausente | **null** ✔ |
| `verificador.confirmados_por_estructura` | 0 | **0** ✔ |
| hallazgos con `origen: diff_tabular` | 15 | **15** ✔ |

P1 cumplida en sus tres puntos, en esta pasada. **Una pasada no es una tasa**
—la afirmación necesita las cuatro— pero el número calculado y el medido
coinciden, que es lo que la pasada 0 tenía que decidir.

#### ⚠️ EL FALSO POSITIVO DE B.124 REAPARECIÓ, Y SALIÓ DESCARTADO

    [dc678e1b] "Profesional asignado para Carilla de composite (EST-03)"
       → descartado: cubierto_por_diff

`dc678e1b` es el hash del falso ORIGINAL del 30/08. El hash es
`hashCitationPair(newDocSays, existingDocSays)` — las dos citas—, así que es
**el mismo hallazgo**, no uno parecido.

**Lo que cambia**: B.124 pasa a tener verificación en producción. **Lo que no**:
B.125 sigue vigente. Lo que no se podía garantizar era que el fallo OCURRIERA,
no que la guarda FUNCIONARA — y sigue sin poderse pedir. Que hoy tocara no
convierte la pantalla en instrumento.

**Y la fabricación quedó validada de paso**: el caso de
`cascada-emparejamiento.test.ts` produce **el mismo hash `dc678e1b`**. Construir
el caso a mano no era un apaño: era el mismo hallazgo por la función de
identidad del propio sistema.

#### NOTA DE MÉTODO: muere por DOMINANCIA, no por verificación

Salió por `cubierto_por_diff`, no por `emparejamiento_invalido`. Correcto —el
par está emitido y la supresión se lo lleva antes de que R2 verifique nada— pero
hay que tenerlo escrito: **la guarda de identidad de la 3ª puerta no está
cazando el caso que motivó el frente, está de reserva.** Su contador a cero no
dice que el falso no ocurra; dice que muere antes. Anotado junto a las dos
guardas en `pipeline.ts`.

### RESULTADOS — TANDA 1, casos 6 y 7, `cceddf86`

Once pasadas contando la 0: **OPE-11 → OPE-10** cinco rápidas y una exhaustiva;
**OPE-10 → OPE-11** cuatro rápidas y una exhaustiva. **Quince en todas.**

| Predicción | Resultado |
|---|---|
| **15 exactas** (número CALCULADO antes de lanzar) | **✔ en las once**, las dos direcciones |
| **Cero fila-contra-fila del juez confirmados por estructura** | **✔** — todo hallazgo del juez salió descartado |
| **Ningún hallazgo del registro de siembra perdido** | **✔** — las 15 sembradas |
| `a_juicio.sin_clave` = 0 *(predicho, y predicho como inútil)* | **✔ 0**, porque el par tiene clave. La cifra del coste sigue sin medirse |

#### LA SUPRESIÓN ACTÚA SOBRE LO QUE EL JUEZ ENCUENTRE, NO SOBRE UN CASO

Es el resultado más importante de la tanda y no estaba en la predicción.

| Dirección | Lo que emitió el juez | Destino |
|---|---|---|
| OPE-11 → OPE-10 | IMP-03, EST-03 | descartados: `cubierto_por_diff` |
| OPE-10 → OPE-11 | **PRO-03** — hallazgo distinto, nunca visto antes | descartado: `cubierto_por_diff` |

`cascada-emparejamiento.test.ts` demuestra el CABLEADO sobre un hallazgo
fabricado. **PRO-03 es la generalización que un caso fabricado no podía dar**:
un hallazgo que nadie previó, en la dirección contraria, tratado igual. La
guarda no reconoce un caso — reconoce una situación.

#### LA INCIDENCIA DEL FALSO DE B.124, MEDIDA POR PRIMERA VEZ

En OPE-11 → OPE-10, de seis pasadas: **`dc678e1b` en tres**, las tres
descartadas. Y en dos más el detector de narración mató antes lo que parecía el
mismo hallazgo.

⚠️ **Precisión sobre esas dos**: el hash es `hashCitationPair` sobre las dos
citas, y una narración NO es una cita — luego esas dos **no llevan el mismo
hash** y no se pueden afirmar como el mismo hallazgo. Cuentan como «el juez
volvió a enfrentar esas filas», no como `dc678e1b`.

**Lo que esto le hace a B.125**: el 30/08, cuatro pasadas dieron CERO
apariciones y de ahí salió «no se puede reproducir». Hoy, tres de seis con hash
idéntico. **El cero de aquel día era mala suerte, no una tasa baja.** El límite
de B.125 sigue siendo real —no se puede PEDIR que ocurra— pero su premisa
implícita, que el fallo es raro, queda desmentida: es frecuente.

#### LAS DOS EXHAUSTIVAS: 15 candidatas, 0 a Sonnet

`particionDoubleCheck` separa por `confirmedBy === 'estructura'`, y las quince lo
son. Ninguna llega al modelo caro: es F-64/F-71 funcionando —ningún modelo
revierte un veredicto determinista—, no una avería.

El **17 → 15** queda confirmado en las dos direcciones.

⚠️ Y deja una consecuencia de producto que no es de este frente: **el exhaustivo
no hizo NADA que el rápido no hiciera**, y cuesta 30 créditos frente a 5. Ver
B.127.

#### CINCO SOLAPAMIENTOS DESCARTADOS, Y SOLO EN UNA DIRECCIÓN

En OPE-10 → OPE-11, cinco por pasada, todos por **«cita de línea de contexto, no
citable»** (`citaDeContexto`, judge.ts:522). Son las filas idénticas otra vez,
por una tercera puerta. Ver B.122, donde se anota: es el mismo recorte, no un
pendiente nuevo.

**La asimetría no está explicada, y la explicación obvia está REFUTADA**: las dos
tablas tienen **60 filas** y OPE-11 es incluso mayor (15.459 caracteres frente a
14.540), así que no es que una quepa en el prompt y la otra no. Qué haría falta
para cerrarlo, en B.122.

#### CON EL LOG DELANTE: TRES COSAS QUE EL RESUMEN NO DECÍA

*Añadido el 31/08, al recibir los logs. Lo de arriba se escribió sobre el
resumen de la pasada; esto lo corrige donde hacía falta.*

**1. ⚠️ EL EXHAUSTIVO SÍ HIZO ALGO QUE EL RÁPIDO NO — me equivoqué.** El bloque
de arriba decía «no hizo NADA que el rápido no hiciera». El log dice:

    [style-check] "OPE-11...": 15 problemas de estilo (9255ms)

Nueve segundos de modelo y quince problemas de estilo que el rápido no produce.
Lo cierto es lo otro: **cero enviadas a Sonnet**, y por la razón correcta. La
cuenta real es 25 créditos netos (30 menos 5 de precio variable) contra 7 de
rápido + estilo por tarifa — no 30 contra 5. B.127 corregido.

**2. LA ASIMETRÍA DE LOS SOLAPAMIENTOS: ES DEL JUEZ, y se resuelve por el
criterio escrito ANTES de tener el dato.** `selectionLimits` es prácticamente
igual en las dos direcciones —38/60 y 39/60 fuera por tamaño— y **las dos
construyen la línea de contexto** (`contexto_no_citable: 1` en ambas). El
fragmento marcado existe siempre.

Y el juez emite **cinco solapamientos en las dos**. Lo que cambia es dónde
aterriza la cita:

| Dirección | Cinco solapamientos | Destino |
|---|---|---|
| OPE-11 → OPE-10 | sí | **ninguno descartado: se publican** — es el síntoma 2 de B.122, el volcado |
| OPE-10 → OPE-11 | sí | **los cinco por `citaDeContexto`** — el síntoma 3 |

**No son dos problemas: es uno con dos salidas.** Anotado en B.122.

**3. LÍMITE DE LECTURA DEL MODO RÁPIDO, que acota lo que el juez puede decir:**

    [judge] "OPE-11...": documento analizado truncado a 6000 de 7342 caracteres

`NEW_DOC_LIMIT_QUICK = 6000` (judge.ts:35), deliberado. **El juez vio el 82 % del
documento analizado en todas las rápidas de esta tanda.** No afecta al diff —lee
todos los chunks, no el prompt— pero sí a cualquier lectura del tipo «el juez no
encontró X». El exhaustivo no trunca.

**De propina, dos cosas del log del worker que no se buscaban:**

    [worker] Job 82cc28ad...: 1 descartes permanentes de la org

La persistencia de descartes de F-86 paso 3 **está viva en producción** y tiene
su primer registro. Primera evidencia fuera del laboratorio.

Y `0 ids de tanda (rápido)` en todas: el documento del corpus ya estaba indexado,
así que se encontró como candidato sin pasar por `batchDocumentIds`. El
resultado es equivalente —1 candidato en todas— pero conviene saberlo para
reproducir: no se ejercitó ese mecanismo.

---

## PREDICCIÓN — TANDA 2 (casos 1 y 2), escrita antes de lanzar

**Calculado, no estimado**: el diff emite **1** en cada dirección, y es la
sembrada — *«Discrepancia en Puesto entre RRHH-06 y OPE-02»*, el `Puesto` de Dr.
Pablo Reyes. Clave `Empleado`, 100 % única en los dos lados, **10 filas
emparejadas** y **5 de RRHH-06 sin pareja**.

| Qué mirar | Esperado |
|---|---|
| `contradictions_found` | **1** en las dos direcciones |
| `confirmedBy` / `origen` | `estructura` / `diff_tabular` |
| `verificador.confirmados_por_estructura` | **0** |
| `a_juicio.sin_clave` | **0** — el par tiene clave |
| Si el juez emite el mismo hallazgo | `descartado: cubierto_por_diff` |
| Grupo «Sin correspondencia» en la ficha | 5 filas |

**La ficha del caso dirá la verdad con otro firmante.** `Casos_Harness.md` dice
«confirmada por estructura» y lo seguirá siendo — pero la firma el diff, no el
juez. Si aparece un `confirmado.por_estructura` del juez, **eso sí es hallazgo**.

**Y la dirección B (OPE-02 contra RRHH-06) es la que falló tres semanas** (B.81).
Ahora la produce el diff, que es simétrico por construcción: si una dirección da
1 y la otra 0, el fallo no sería del juez esta vez.

### ⚠️ Y UNA PREDICCIÓN QUE PONE A PRUEBA LA «CAUSA ÚNICA» DE B.122, GRATIS

B.122 sostiene que sus tres síntomas existen **porque la tabla no cupo en el
prompt**. Este par lo comprueba sin lanzar nada extra, porque **las dos tablas
caen a lados distintos del presupuesto de 3.000 caracteres**:

| Documento del corpus | Tamaño de su tabla | Predicción |
|---|---|---|
| **OPE-02** (en RRHH-06 → OPE-02) | 10 filas, **1.950 car.** — cabe | **nivel 1**: sin colapso, sin línea de contexto, sin aviso de alcance, sin `citaDeContexto` |
| **RRHH-06** (en OPE-02 → RRHH-06) | 15 filas, **4.574 car.** — no cabe | **nivel 2**: colapso, línea de contexto, aviso de alcance |

Si sale así, la causa única de B.122 queda demostrada con un caso que no se
diseñó para eso. **Si en la dirección de OPE-02 aparece nivel 2 o una línea de
contexto, la causa única es falsa** y hay que reabrir el pendiente entero.

---

### RESULTADOS — TANDA 2, casos 1 y 2, `cceddf86`

**Diez pasadas**: ocho rápidas y dos exhaustivas, las dos direcciones.

| Predicción | Resultado |
|---|---|
| **1** contradicción por pasada (número CALCULADO) | **✔ en las diez** |
| `confirmedBy: estructura` / `origen: diff_tabular` | **✔** |
| `verificador.confirmados_por_estructura` | **✔ 0** en todas |
| `a_juicio.sin_clave` | **✔ 0** — el par tiene clave |
| El juez emite lo mismo → `cubierto_por_diff` | **✔** — `19f92748` y `77c04c10`, las dos direcciones |

**El cambio de productor funcionó sin perder nada.** La ficha del caso sigue
diciendo la verdad —«confirmada por estructura»— con otro firmante. Y la
dirección B, la que falló tres semanas (B.81), da 1 igual que la A: el diff es
simétrico por construcción.

#### LA CAUSA ÚNICA DE B.122, DEMOSTRADA POR UN CASO QUE NO SE DISEÑÓ PARA ESO

Predicción escrita antes de lanzar, y el corte cae donde se dijo:

| Corpus | Su tabla | Nivel | `contexto_no_citable` | Solapamientos |
|---|---|---|---|---|
| **OPE-02** | 2.116 car. | **1**, completa, 10 filas | **no** | ninguno descartado |
| **RRHH-06** | 2.397 car. tras colapsar | **2**, 9 colapsadas | **sí** | descartados |

Las dos tablas caen a lados distintos del presupuesto de 3.000 y **el
comportamiento se separa justo por ahí**. B.122 sostenía que sus síntomas
existen porque la tabla no cupo; aquí se ve con el mismo par, las mismas dos
direcciones y nada más cambiando.

#### ⚠️ Y UNA PARTE DE LA PREDICCIÓN, FALLADA — se cuenta, no se acomoda

Predije «aviso de alcance» para la dirección de RRHH-06. **No lo hay**: el log
dice `resumen + 15/15 filas`, **ninguna fuera por tamaño**.

**El colapso de las 9 idénticas es LO QUE HACE QUE QUEPA.** Luego los síntomas
de B.122 no son un trío fijo: el aviso de alcance es un cuarto escalón que
necesita que **ni siquiera después de colapsar** quepa — el caso de OPE-10 /
OPE-11 (38/60 fuera), no éste. Anotado en B.122.

#### EL HALLAZGO DE LA TANDA: B.128

El juez emitió **«Horas semanales de Dra. Ana Belmonte»** en dos pasadas, y
`Horas semana` **existe solo en OPE-02**. Comprobado contra el corpus: las
columnas compartidas del par son **dos** —`Empleado` y `Puesto`— de **dieciocho**
distintas, y el diff compara **una** (`Puesto`, porque `Empleado` es la clave).

El hallazgo **pasó la verificación de citas** y murió por `cubierto_por_diff`
con un motivo que **para esa columna es literalmente falso**.

**La supresión suprime por FILA; el diff compara por COLUMNA COMPARTIDA.** El
hueco es el territorio de las omisiones. Hoy no se pierde nada porque el caso
era malo; el mecanismo se llevaría igual uno bueno. **B.128, y va a Fable** por
la regla de la doble lectura: «que el diff ya comparó» admite las mismas dos
lecturas que «todas las columnas comunes», y ya hay caso medido que las separa.

#### «cita no verificable, lado=ambos»: forma nueva, no mecanismo nuevo

Es `citaNoVerificable` con `failedSide='ambos'` (judge.ts:534) — las dos citas
fallan a la vez. Lo nuevo es lo que el juez escribió: **se fabricó una tabla
propia en cada lado** y la presentó como cita.

    nuevo="Dra. Marta Gil | Odontóloga general | Box 1, Dr. Javier Soto | ..."
    existente="Dra. Marta Gil | Odontóloga general, Dr. Javier Soto | ..."

No es narración, no es la línea de contexto: es **enumeración**. Tercera forma
de la enfermedad de B.107 —la cita literal la escribe el modelo— y la primera
vista en la vía de solapamientos, alimentada otra vez por el material de las
filas idénticas de B.122.

#### DE PASO: el precio variable, funcionando

Las dos exhaustivas: `estimatedCost: light (1 contradicciones)` → **devueltos 10
créditos** cada una. Coste neto 20, con 3 y 4 problemas de estilo entregados.
Es el tramo que B.127 decía que había que mirar, comportándose bien.

---

### RESULTADOS — PASADA EXTRA (territorio sin clave), `cceddf86`

**OPE-11 analizado, con OPE-10 y RRHH-06 en el corpus. Una pasada.**

**NO MIDIÓ LO QUE SE BUSCABA, y así queda.**

    Retrieval: 2 candidatos
    Rerank: 1 seleccionados

RRHH-06 llegó al retrieval y **el rerank lo descartó**. El juez no lo vio, así
que el cruce sin clave no se ejerció. Era el caso que la instrucción de la
pasada anunciaba como invalidante — y se declara, no se reinterpreta.

**La rama sin clave sigue sin ejercerse en producción, y ahora se sabe que hay
DOS barreras independientes**: ningún cruce del corpus tiene dos columnas
compartidas (B.129), y el único que tiene una, el rerank no lo deja pasar. La
segunda es la peor noticia: un documento de siembra futuro tendría que
**parecerse** al tarifario y **no compartir clave** con él, y eso es más difícil
de sembrar de lo que parecía.

**Lo que sí valió**: 15 discrepancias contra OPE-10 y el hallazgo del juez
suprimido, **con tres documentos en el corpus en vez de dos**. El diff no se
despista con más candidatos. Control de regresión gratis, aunque no fuera el
objetivo.

#### Y un mensaje de log que mentía: «Chunks para verificación: 2/1»

Numerador y denominador contaban **poblaciones distintas** —
`chunksByDocument.size` es el mapa de **retrieval** (2, que trae de más a
propósito por F-41) contra `reranked.length`, la población del **rerank** (1).

**El comportamiento era correcto**: los dos consumidores usan el mapa como
diccionario, recorriendo `reranked` y `rawJudgments`, así que un documento que
el rerank tiró no se procesa. Lo falso era la línea. **Corregido** — el
numerador se cuenta ya sobre `reranked`.

Nunca se había visto porque hasta hoy retrieval y rerank devolvían siempre lo
mismo en el harness. **Hizo falta la primera pasada con tres documentos.**

⚠️ **La corrección NO está desplegada**: la tanda mide `cceddf86`. En la tanda 3
la línea seguirá mintiendo en el **caso 5** (MKT-01 con los otros cuatro), que
es el único con más de dos documentos. En los demás pares no se nota.

---

### RESULTADOS — TANDA 3, control de regresión, `cceddf86`

**Once pasadas.** Seis con **un solo candidato** (los tres pares de prosa, las
dos direcciones) y cinco con cuatro documentos marcados (el grupo del piloto,
que es donde vive el caso 5).

| Caso | Dirección | Resultado |
|---|---|---|
| 3 · CLI-03 → NOR-01 | aislada | **confirmado por juicio** (`57fbe32c`) |
| 4 · NOR-01 → CLI-03 | aislada | **confirmado por juicio** (`b4768783`) |
| 8 · NOR-10 → CLI-12 | aislada | **0** — ver abajo |
| 9 · CLI-12 → NOR-10 | aislada | **0** — ver abajo |
| 10 · NOR-11 → CLI-13 | aislada | **confirmado por juicio** (`14123c6f`) |
| 11 · CLI-13 → NOR-11 | aislada | **confirmado por juicio** (`9d19a20b`) |
| 5 · MKT-01 con los otros cuatro | condición del caso | **0 y 0** con dos documentos juzgados |

`confirmados_por_estructura` = **0** en las once. **Sin regresión en prosa.**

#### EL AISLAMIENTO FUNCIONÓ, Y ES LA PRUEBA DE LA MANIOBRA DEL `pendiente`

Las seis pasadas de prosa dieron **`Retrieval: 1 candidatos`** con `1 ids de
tanda`. No es suerte: con `CORPUS_ACTIVO` vacío —los once documentos puestos a
`pendiente` en Supabase y proyectado a Pinecone con el reconciliador—, el `$or`
de `buildCorpusFilter` deja pasar **exactamente** el id marcado.

La maniobra sustituye al vaciado y resincronización de Drive, y es **reversible**
sin tocar `reviewed_at`.

Las cinco pasadas con **cuatro** ids son otra cosa y no contaminan nada:
· **El caso 5 EXIGE cuatro acompañantes.** Es su condición, no ruido. El rerank
  seleccionó **2 de 4** (OPE-02 y RRHH-06) y los juzgó con 0 y 0. El caso se
  cumple —tenía material delante y no inventó— pero es **un control más débil**
  que si hubiera juzgado los cuatro. Anotado.
· **Las otras cuatro son REPETICIONES** de casos ya medidos aislados (3 y 4 hoy
  a las 15:07; 1 y 2 en la tanda 2). Dieron **los mismos hashes** y el mismo
  resultado. Corroboran en condiciones más ruidosas; no sustituyen a nada.

⚠️ **Lo frágil, dicho**: en esas cuatro el rerank **pudo elegir mal y no lo
hizo**. Si alguna hubiera dado 0, no se habría podido distinguir «regresión» de
«el rerank eligió otro candidato» — que es exactamente lo que pasó en la pasada
extra con RRHH-06.

#### NOR-10 / CLI-12 DA CERO — Y NO ES REGRESIÓN

Está registrado desde el **26/08/2026** en `claude/Casos_Harness.md`, sección
«LÍNEA DE BASE» de los casos 6-9, medido sobre `87a76112`: **prosa larga, 3
sembradas, 0 publicadas**.

Y no coincide solo el número: **las dos causas de muerte estaban nombradas allí**
y son las de hoy — `mismo_dato_sin_oposicion` en una dirección,
`citaNoVerificable` en la otra. El cuello también: *«de 66 fragmentos
recuperados de NOR-10 entraron 3»*, y hoy `3 dentro, 63 fuera (prosa 3/66),
2616/3000 caracteres`.

Es el **frente 4 del mapa del MVP** —la prosa— intacto. El frente 1 no lo tocó
ni pretendía tocarlo.

#### EL `4/1` SALIÓ DONDE SE PREDIJO

Las cinco pasadas de cuatro documentos son las únicas que enseñaron
`Chunks para verificación: 4/1` y `4/2`. La corrección está hecha desde el 31/08
y **sin desplegar**, porque la tanda medía `cceddf86`.







---

## 30/08/2026 — `06952da4` — LA SUPRESIÓN DEL JUEZ: 17 → 15

**Qué se lanzó**: dos pasadas exhaustivas y dos rápidas de OPE-11 contra
OPE-10, con la supresión de F-89 P4 desplegada y NADA MÁS que cambiara
comportamiento — los otros dos commits del despliegue eran batería
(`7989e0aa`) y una traza sin consumidor (`1924cb5a`). La cifra es atribuible a
un solo cambio, y se separó a propósito del punto 3 para que lo siguiera
siendo.

**La pregunta**: F-89 P4 dice que el juez no aporta nada sobre un par de tablas
que el diff ya comparó — «en el mejor caso un duplicado, en el peor un
emparejamiento inventado». La línea de base, medida el mismo día ANTES de la
supresión, era **17 contradicciones: las 15 del diff más 2 del juez**. Las dos
del juez eran LEGÍTIMAS y las dos ya estaban dentro de las quince.

| | antes | después |
|---|---|---|
| contradicciones publicadas | **17** | **15** |
| del juez, fila-contra-fila sobre el par emitido | 2 | **0** |

Del log de las dos pasadas exhaustivas:

    [4e18e79b] IMP-03 → descartado: cubierto_por_diff
    [0f3269d9] EST-03 → descartado: cubierto_por_diff
    Completo — 15 contradicciones

Y en los dos rápidos, lo mismo: verificador con **0 confirmados, 1 descartado
por cubierto_por_diff**.

### LA GANANCIA QUE NO ESTABA PREVISTA: el duplicado tampoco iba a Sonnet

Las candidatas al double-check bajan **de 17 a 15**. No se había anticipado —
la supresión se diseñó para no publicar duplicados, y resulta que además NO SE
LOS ENVÍA al modelo caro. Cada duplicado suprimido es una candidata menos en el
lote de Sonnet del exhaustivo.

No cambia ninguna decisión, pero conviene tenerlo escrito: al estimar el coste
del punto 4 —que va en la dirección contraria, mandando MÁS cosas a la llamada
corta— este ahorro está en el mismo balance.

### B.107, EN VIVO Y EN PRODUCCIÓN

En los dos rápidos el juez escribió **«No aparece EST-03 en el documento
nuevo»** donde debía ir una CITA, y el detector de narración lo descartó bien.

Es la primera vez que B.107 se ve fuera del laboratorio: hasta hoy tenía casos
construidos y ninguna aparición medida. Confirma las dos mitades del pendiente
—que el juez narra en vez de citar, y que el detector lo caza— y que el fallo
es real y no una posibilidad teórica. Anotado también en B.107.

---

## 28/08/2026 — `d13e125f`, 14:24 UTC — EL TERCER PUNTO DE SERIALIZACIÓN (F-86 paso 0)

> **NO ES UNA TANDA DE TASAS**, y conviene que se lea distinta desde la primera
> línea: no mide QUÉ encuentra el sistema, sino si un campo SOBREVIVE el viaje
> hasta el jsonb. Se apunta aquí igualmente porque el §4 del protocolo manda
> que las mediciones se acumulen en este fichero, y porque dejarla solo en el
> mensaje de commit es exactamente cómo se perdió la tabla del relevo del 25/08.

**Qué se lanzó**: dos análisis en modo **rápido** desde la interfaz, sobre los
casos 1 y 2 del corpus piloto (**RRHH-06** y **OPE-02**) — el par de tabla, con
la contradicción sembrada de siempre.

**La pregunta**: `d13e125f` propaga `existingDocumentId` al lado del nombre por
los nueve sitios del recorrido, y su batería
(`lib/analysis/recorrido-id-documento.test.ts`) sigue el dato hasta
`Problem.relatedDocId` cruzando un ida y vuelta por JSON. Lo que la batería
**no alcanza** son los tres puntos de serialización reales, que son rutas de API
y worker. El tercero —`analysis_results.analysis`, el jsonb que la bandeja
relee meses después— es el que sostiene el commit siguiente (la persistencia de
descartes). ¿Llega el campo de verdad, o solo lo parece al leer el código?

**MARGEN DE DESPLIEGUE — CERRADO, y con holgura.** Push de `d13e125f` a las
**13:40:30 UTC** (reflog de `origin/main`); el primer análisis medido, a las
**14:24 UTC**. **43 minutos.** Es el margen que la tanda del 27/08 no pudo
cerrar (4 min 12 s), y aquí no hay duda de qué código corrió.

| Análisis | Hora (UTC) | Código | discrepancias | con id | solapamientos | con id |
|---|---|---|---|---|---|---|
| RRHH-06, rápido | 14:24 | `d13e125f` | 1 | **1** | 1 | **1** |
| OPE-02, rápido | 14:24 | `d13e125f` | 1 | **1** | 2 | **2** |
| *(control negativo)* | 07:49 | anterior | 1 | **0** | *no anotado* | — |
| *(control negativo)* | 07:49 | anterior | 1 | **0** | *no anotado* | — |

**El detalle de la última fila**, nombre e id enfrentados sobre la misma
contradicción:

| nombre | id | asunto |
|---|---|---|
| `OPE-02_agenda-y-gestion-de-citas.xlsx` | `099ffac9-7ba6-437e-8bc4-b5624cb0f695` | Puesto de Dr. Pablo Reyes |

### EL CONTROL NEGATIVO ES LO QUE HACE VALER ESTA MEDICIÓN

Sin él, «el campo está» no distingue entre **el commit funciona** y **la
consulta miente** — y una consulta con `jsonb_exists` sobre un campo que se
escribiera solo se habría visto igual de verde. Los dos análisis de las 07:49
corrieron con el código anterior, sobre el **mismo corpus** y la **misma
contradicción sembrada**, y salen con **0 de 1**. La consulta discrimina, y por
tanto el 1 de 1 de las 14:24 significa algo.

### LO QUE ESTA MEDICIÓN NO CONTESTA

- **Los otros dos puntos de serialización siguen sin medir.** El literal de
  respuesta de `app/api/analyze-v2/route.ts:545` es un objeto **distinto** del
  que se persiste (`:453` pasa el `analysis` entero), así que ver el jsonb NO
  prueba lo que llega a la pantalla. Y el `result` del job
  (`worker/src/index.ts:137`) es un tercero.
- **El camino EXHAUSTIVO no se ha tocado.** Las dos pasadas son rápidas: corren
  en Vercel. El exhaustivo corre dentro del worker de Railway, cuyo redespliegue
  no se ha comprobado. Que el rápido llegue no dice nada del exhaustivo.

---

## 27/08/2026 — `8cf73e23` — CASO DE CONTROL NOR-11 / CLI-13

**Qué se lanzó**: el par de prosa del caso de control, con el bloque del
verificador (F-77) ya desplegado. *Hora exacta no anotada; posterior a la tanda
que sigue.*

**La pregunta**: la de B.105. El ejemplo del bloque es «mismo rol, dos personas»,
que es el mismo objeto que la siembra A. Si solo se movía la A, el acierto sería
circular — el modelo aplicando un ejemplo casi idéntico, no el mecanismo. Este
par existe para preguntar si **generaliza a superficies que el bloque no enseña**.

| # | Contradicción sembrada | Superficie | Resultado |
|---|---|---|---|
| 1 | Plazo: **72 h** frente a **7 días** | dos cifras de tiempo enfrentadas | **CONFIRMADA** |
| 2 | Lugar: **Chamberí** frente a **Retiro** | dos topónimos | **CONFIRMADA** |
| 3 | Negación categórica sobre el contenedor negro | una prohibición frente a una autorización | **EL JUEZ NUNCA LA EMITE** |

### EL BLOQUE GENERALIZA. La pregunta de B.105 queda contestada

**Dos superficies nuevas, ninguna sobre roles ni personas, confirmadas.** Un
plazo y un topónimo no se parecen al ejemplo del prompt («la responsable del área
es Ana Ruiz» frente a «es Beatriz Soler»): lo único que comparten con él es el
mecanismo —mismo dato, dos valores—, que es exactamente lo que el bloque enseña.

Es la respuesta que este par existía para dar, y es afirmativa. La sospecha de
circularidad anotada en B.105 queda descartada **para el verificador**.

**Lo que NO contesta**: la tercera no llega a medirse aquí, porque **el juez no
la emite**. Eso es un techo anterior al verificador y tiene pendiente propio —
ver **B.106**: en documentos de 4 y 5 páginas el juez devuelve exactamente una
contradicción por par, y no es la selección.

---

## 27/08/2026 — `8cf73e23`, logs 12:04–12:31 UTC — EL BLOQUE DEL VERIFICADOR (F-77)

**Qué se lanzó**: cuatro pasadas, modo rápido desde la bandeja, con el bloque
nuevo de `verify-findings.ts` desplegado.

> **⚠️ MARGEN DE DESPLIEGUE SIN CERRAR, y ya no se puede cerrar.** El push de
> `8cf73e23` fue a las **11:59:48 UTC** (reflog de `origin/main`) y la tanda
> arranca a las **12:04 UTC**: **4 min 12 s**. No se comprobó a tiempo la hora de
> «Ready» del deployment en Vercel ni el redeploy del worker en Railway. Si
> alguno terminó después de 12:04, las primeras pasadas midieron el prompt viejo.
>
> **QUÉ ACOTA ESE MARGEN, Y QUÉ NO.** Las pasadas 1 y 3 corrieron con **el mismo
> código, fuera el que fuera**: doce minutos separan una de otra, dentro de la
> misma ventana. Así que **la diferencia entre ellas no puede atribuirse al
> despliegue** — se explica por las citas distintas, que es lo que dice la
> sección siguiente. El margen afecta a **si el bloque estaba vivo en absoluto**,
> no a la comparación entre las dos pasadas, que es de donde sale la conclusión
> de esta entrada.

| # | Qué entró | Resultado |
|---|---|---|
| 1 | **NOR-10 / CLI-12 solos** | Siembra A **DESCARTADA** (`mismo_dato_sin_oposicion`). Hallazgo `[04ed1945]` |
| 2 | **CLI-03 / NOR-01** (control de regresión) | **Confirmado en todas las pasadas.** El acierto histórico de prosa sigue vivo |
| 3 | **Los CINCO juntos**: NOR-10, CLI-12, CLI-03, NOR-01 y MKT-01 | Siembra A **CONFIRMADA**, dos pasadas. Hallazgo `[9b37aa92]` |
| 4 | **MKT-01** | **Cero hallazgos** |

> **CINCO Y CUATRO NO SE CONTRADICEN, cuentan cosas distintas.** En la pasada 3
> hay **cinco documentos en la tanda**, y el log de cada análisis dice **«4 ids
> de tanda»**: son los **compañeros** de ese análisis, es decir, los otros cuatro
> vistos desde el documento que se está analizando. Cinco en la tanda, cuatro
> compañeros para cada uno. Las dos cifras son correctas.

### EL MATIZ QUE MANDA: no es el mismo hallazgo

**Los hashes son distintos.** En la pasada 1 el hallazgo es `[04ed1945]` y muere;
en la 3 es `[9b37aa92]` y sobrevive. El hash se calcula sobre las citas crudas
(F-38), así que **hashes distintos significa citas distintas**.

> **El bloque NO rescató el par de citas de la pasada 1. Confirmó OTRO par**, que
> apareció porque con los cinco documentos en la tanda el retrieval trajo
> fragmentos distintos de NOR-10 — entró el **chunk 2, score 0,932**.

Leerlo como «el bloque arregla la siembra A» sería exactamente el error que la
advertencia de F-73 describe: atribuir a la etapa que se tocó un cambio que
produjo otra. Lo que estas cuatro pasadas dicen, con precisión:

- **El bloque funciona cuando le llegan las citas buenas.** La pasada 3 lo
  demuestra, y el caso de control NOR-11/CLI-13 lo confirma sobre superficies que
  el bloque no enseña.
- **Qué citas llegan lo decide la SELECCIÓN**, y eso no lo toca F-77. La misma
  contradicción, en el mismo par de documentos, produce citas verificables o no
  según qué fragmentos de NOR-10 entren — y eso depende de **con qué compañía se
  lance la tanda**: dos documentos en la pasada 1, cinco en la pasada 3. Es una
  variable que nada en el sistema controla y que el cliente no ve.
- Es la confirmación, ahora sobre prosa, de lo que el análisis de F-76 dejó
  dicho: **en prosa larga el cuello es la selección**, no la verificación.

**Lo que NO afirma**: que la siembra A esté detectada. Está detectada *en una
configuración de tanda*, por un par de citas distinto del que falló, y con dos
pasadas. El protocolo pide cuatro por dirección para hablar de tasas.

---

## 27/08/2026 — `94ad06a0` — EXPERIMENTO F-73, tres estados

**Qué se lanzó**: el par de tablas **RRHH-06 / OPE-02**, los dos sentidos,
**cuatro pasadas por dirección y por estado**. Tres estados del mismo commit,
alternados con la variable `ANALYSIS_EXHAUSTIVE_BUDGET_CHARS` en el worker de
Railway.

**La pregunta**: por qué el modo exhaustivo NO detectaba la contradicción del
Puesto de Dr. Pablo Reyes en la dirección `OPE-02 → RRHH-06`, cuando el rápido
sí. Hasta `94ad06a0` el exhaustivo se saltaba entera la selección y se llevaba
los fragmentos en bruto.

### Dirección OPE-02 → RRHH-06 (la que fallaba)

| Estado | Qué ve el juez | Tasa |
|---|---|---|
| **Base** — sin selección | 15 filas en bruto | **0/4** |
| **Estado 1** — 3000, destilado | resumen + 9 filas, de las cuales 9 colapsadas → 6 líneas | **4/4** |
| **Estado 2** — 6000, nivel 1 | la tabla entera, 15 filas sin colapsar | **0/4** |

### Dirección RRHH-06 → OPE-02 (la que ya funcionaba)

**Detecta en los tres estados.** Y el motivo importa para leer bien la tabla de
arriba: la tabla de OPE-02 tiene **10 filas y cabe entera** en cualquiera de los
tres presupuestos, así que **la destilación nunca llega a actuar** en ese
sentido. No es que el estado no le afecte: es que para esa tabla los tres
estados son el mismo.

### El mecanismo aislado: EL COLAPSO DE IDÉNTICAS

Los tres estados dibujan una curva que no es monótona —0, 4, 0— y eso descarta
«más material es mejor» y también «menos material es mejor». Lo que separa al
estado 1 de los otros dos no es el volumen: es que **es el único donde el
colapso de filas idénticas actúa**. En base no hay selección; en estado 2 la
tabla entra completa por nivel 1, y el nivel 1 no colapsa nada.

Nueve filas que colapsan a seis líneas es lo que hace visible la fila que
difiere: las que coinciden se resumen en una línea de contexto y la discrepante
queda sola, en vez de enterrada entre catorce vecinas del mismo formato.

**Y NO es la prosa.** El desglose por tipo del log (añadido en `94ad06a0`
justo para poder responder esto) confirma que **la prosa entró igual en los dos
estados, 4/4 unidades**. La diferencia entre 4/4 y 0/4 no puede atribuirse a
material de prosa que entrara en uno y no en otro.

### Lo que esta tanda NO mide

**La esquina «destilado y grande».** Los tres estados cubren tres de las cuatro
combinaciones:

| | Sin destilar | Destilado |
|---|---|---|
| **Poco material** | — | Estado 1 ✅ medido |
| **Mucho material** | Base y Estado 2 ✅ medidos | **❌ SIN MEDIR** |

No se ha medido qué pasa con **una tabla grande que además se destila** — por
ejemplo, un presupuesto alto sobre una tabla de cuarenta o noventa filas, donde
el nivel 1 no cabe y el colapso sí actúa sobre muchas filas. Toda la conclusión
de esta tanda descansa en una tabla de 15 filas.

**Y el tope de piezas es un confundidor conocido para esa esquina**:
`MAX_FRAGMENTS_PER_DOC_QUICK = 25` bloquea el nivel 1 con cualquier
presupuesto en una tabla de más de ~24 filas (OPE-06 son 94 + resumen = 95
piezas), así que medir ahí sin parametrizarlo mediría otra cosa.

---

## 26/08/2026 — `a775a7c7`

**Qué se lanzó**: los cinco casos, modo rápido, desde la bandeja de revisión.
Org de pruebas `5a82712f-6740-4792-b291-3fdea8e6edb1`.
**Una pasada por caso.**

**Estado del código**: después de F-70 (`8f151aff`, la ficha en prosa) y de su
documentación (`a775a7c7`); **antes** de F-71 (`38d3fd22`, las etapas caídas).

| # | Caso | Resultado |
|---|---|---|
| 1 | Tabla, RRHH-06 → OPE-02 | **Detectada.** Columna `Puesto` de Dr. Pablo Reyes, confirmada por **estructura** |
| 2 | Tabla, OPE-02 → RRHH-06 | **Detectada.** Misma columna, confirmada por **estructura** |
| 3 | Prosa, CLI-03 → NOR-01 | **Detectada**, confirmada por **juicio** |
| 4 | Prosa, NOR-01 → CLI-03 | **Detectada**, confirmada por **juicio** |
| 5 | MKT-01 con los otros cuatro | **Limpio: cero hallazgos** |

| Comprobación transversal | Resultado |
|---|---|
| Falsos positivos de Belmonte (casos 1 y 2) | **Cero** |
| `columna_indeterminada` | **Cero** |
| Fallos de LLM | **Ninguno** |

**Qué confirma**: que F-69 y F-70 —el transporte de `columns`,
`comparedValues` y las filas, y la ficha en prosa— no rompieron la detección en
ninguno de los cuatro pares, y que el control negativo sigue limpio.

**Qué NO afirma**: que ninguna tasa se haya movido. Con una pasada por caso no
se distingue un régimen de una racha, que es exactamente lo que costó tres
semanas en B.81. Para eso hacen falta cuatro pasadas por dirección.

**Anomalía**: los casos 1 a 4 **no se midieron con el corpus vacío entre pares**.
Es la desviación que motivó fijar el vaciado en el protocolo: un par medido con
documentos ajenos en la tanda no está midiendo la detección entre esos dos,
porque el retrieval y el rerank ven otra cosa. Las cuatro detecciones salieron
bien de todos modos, pero salieron en condiciones más ruidosas que las que el
protocolo pide.

*(El caso 5 sí se midió como debe: MKT-01 acompañado de los otros cuatro. En su
día se anotó como si fuera la anomalía; no lo era — la anomalía estaba en los
casos 1 a 4.)*

## ⚠️ 15/09/2026 — LA PREDICCIÓN DE A5, REVISADA ANTES DE GASTAR: NO SIGUE EN PIE

**El corpus se borró y recreó dos veces hoy** (B.230/B.231: una desconexión se
llevó los 40 documentos de OneDrive y la sincronización siguiente los recreó).
Antes de lanzar treinta créditos hay que decir qué de lo reservado sigue valiendo.

### ✅ LO QUE MEJORÓ — el riesgo declarado se ha resuelto solo

La reserva decía: *«que los chunks guardados de OPE-14 sean de un cortador
anterior al de hoy… que OPE-14 sea uno de esos ocho NO está determinado»*.

**Ya está determinado.** Los 40 se reindexaron hoy, así que **todos** llevan el
sello vigente, y el sello vigente **es el mismo que el del 09/09**:
`EXTRACTOR_VERSION = 3` (`chunking.ts:131`, derivado del catálogo) y
`lib/chunking.ts` **no se ha tocado desde entonces** — `git log --since=2026-09-09`
no devuelve nada. **La incertidumbre que había que consultar antes de gastar ya no
existe.**

### ⚠️ LO QUE SE ROMPIÓ — y es lo que decide

**La predicción `3 · 57 · 0 · 0` no describe un par: describe un par DENTRO DE UN
CORPUS.** Y el corpus de hoy no es el de entonces:

| qué | el 09/09 | hoy |
|---|---|---|
| estado de los 40 | varios `analizado` | **los 40 `pendiente`**, `revisados: 0` |
| ids | los de entonces | **nuevos** |
| análisis guardados | vivos y atados | **huérfanos**, apuntando a ids muertos |

⚠️ **Y `pendiente` no participa en el corpus servible.** El análisis recupera con
`buildCorpusFilter(batchDocumentIds)` (`retrieval.ts:212`), y sin ids de tanda eso
es `CORPUS_ACTIVO` = `analysisStatus = 'analizado'`. **Con los 40 en `pendiente`,
una pasada de A5 hoy no encontraría nada contra lo que comparar** — y un cero así
no es una medición: es la pantalla apagada, sin control positivo.

**El lado conocido tampoco está**: los análisis de A6 quedaron huérfanos con el
borrado, así que la cifra de referencia sólo vive en este documento. Como
referencia escrita sirve; como dato comprobable en la base, ya no.

### ⚠️ Y UNA TRAMPA DE MONTAJE QUE NO ESTABA ANTES

A5 es el camino **del chat**: exige subir OPE-14 a mano —el `.xlsx` no está en el
repositorio, vive en OneDrive—. Pero **OPE-14 también existe ya en el corpus como
documento de OneDrive**. Si se marcase analizado, la copia subida se compararía
**contra su propio gemelo**: 60 filas idénticas y la cifra sembrada enterrada
debajo. Es la forma de F-102 con otra puerta.

A6 no lo sufría porque desde la bandeja el documento propietario se excluye; **el
camino del chat no tiene a quién excluir**, porque el documento aún no ha nacido.

**Por tanto el montaje mínimo es exacto: `OPE-11` analizado, `OPE-14` NO.**

### EL COSTE, ANTES DE GASTAR NADA

| gesto | coste |
|---|---|
| marcar `OPE-11` como analizado | **0 créditos** — `mark-analyzed` no cobra |
| rehacer A6 para recuperar el lado conocido, rápido | **5** |
| rehacer A6 exhaustivo | **30** |
| la tanda de A5 reservada (exhaustiva) | **30** |

**Las tres lecturas, sin elegir por el director:**

1. **Medir A5 igual, declarando que es una BASE NUEVA y no una confirmación.** 30
   créditos. Barato y honesto, pero pierde lo que la tanda venía a comprar: que el
   arreglo de B.204 no cambió el resultado. Sin lado conocido no hay «no cambió».
2. **Rehacer A6 primero y luego A5.** 5 + 30, o 30 + 30 si se quiere el mismo modo.
   Recupera la comparación completa bajo las condiciones de hoy, que es lo que la
   reserva quería.
3. **Restaurar el corpus al estado del 09/09 y heredar la predicción tal cual.**
   ⚠️ **No se puede**: no sabemos qué documentos estaban `analizado` entonces, y lo
   que lo registraba son precisamente los análisis que quedaron huérfanos.

**No se lanza nada.** Decide el director con esto delante.

---

# 15/09/2026 · EL MONTAJE Y LAS DOS PREDICCIONES — decisión: opción 2

## ⚠️ PRIMERO, UNA CORRECCIÓN DE COSTE QUE DI MAL

Dije «rehacer A6 rápido = 5 créditos». **Es falso.** A6 **es** «Reanalizar todo»,
y ese botón llama a `analyze-v2` con **`exhaustive: true` incondicional**
(`useCrossDocAnalysis.ts:128`). No hay modo rápido de A6.

| paso | endpoint | créditos |
|---|---|---|
| marcar OPE-11 analizado | `mark-analyzed` | **0** |
| analizar OPE-14 en la bandeja (hace falta para abrir Mejora) | `analyze-v2` rápido | **5** |
| **A6 · «Reanalizar todo» desde la bandeja** | `analyze-v2` exhaustivo | **30** |
| subir OPE-14 por el chat (su análisis de subida) | `analyze-v2` rápido | **5** |
| **A5 · «Reanalizar todo» desde el chat** | `analyze-v2` exhaustivo | **30** |

**TOTAL: 70 créditos**, no 35. La decisión sigue siendo del director **con esta
cifra**, no con la que le di.

## LOS FICHEROS: QUÉ HACE FALTA Y DE DÓNDE SALE

| fichero | dónde está | estado que necesita |
|---|---|---|
| `OPE-11_tarifario-tratamientos-seguros.xlsx` | ✅ **en el repositorio**, `corpus-pruebas/` — y ya en el corpus, traído por OneDrive | **`analizado`** |
| `OPE-14_….xlsx` | ⚠️ **NO está en el repositorio.** Se hizo a mano y vive en su OneDrive | **`pendiente`**, y fuera del corpus |

⚠️ **EL NOMBRE COMPLETO DE OPE-14 NO ESTÁ REGISTRADO EN NINGÚN SITIO** — su propia
siembra lo escribe como `OPE-14_<nombre real>.xlsx`. **Lo tiene delante igualmente**:
los 40 documentos volvieron, así que el nombre exacto está en su lista, empezando
por `OPE-14`.

✅ **Y SI NO LO CONSERVARA, NO SE PIERDE LA TANDA**: `SIEMBRA_OPE-14.md` dice que es
**una copia de OPE-11 con tres celdas cambiadas** —`DIA-01` → 45, `END-01` → 200,
`PRO-01` → 700, todas en una sola columna de precio— y OPE-11 sí está versionado.
Se rehace, y **se comprueba** con `node scripts/verificar-ope14.mjs <ruta>`, que
además dice qué columna se sembró en vez de darla por sabida.

## EL MONTAJE, PASO POR PASO

**0 · Comprobar el fichero de control.** En su lista de documentos, localizar el
que empieza por `OPE-14`. *Debe ver*: un `.xlsx` con ese prefijo, entre los 40.
Si no aparece, **parar aquí**: se rehace desde OPE-11 antes de seguir.

**1 · Marcar SOLO `OPE-11` como analizado.** Bandeja → abrirlo → *Marcar como
analizado*. *Debe ver*: OPE-11 sale de la bandeja y quedan **39**. **0 créditos.**

⚠️ **NO marcar ningún otro tarifario.** `OPE-10`, `OPE-13` y `OPE-15` son de la
misma familia y competirían como candidatos: la cifra sembrada dejaría de ser la
única explicación del resultado.

⚠️ **Y NO marcar `OPE-14`.** Ahí está la trampa: A5 sube una copia a mano, y el
camino del chat **no excluye a nadie** —`documentoAReemplazar` sólo lo manda la
bandeja (`ImprovementModal.tsx:226`)—, así que si OPE-14 estuviera en el corpus la
copia se compararía **contra su propio gemelo**: 60 filas idénticas y la siembra
enterrada debajo. **Se evita no haciendo nada**: hoy está `pendiente`, que es
justo donde tiene que estar. Y es **reversible en los dos sentidos** — marcar y
desmarcar no cuesta créditos ni toca contenido.

**2 · A6 · dar análisis a OPE-14.** Seleccionarlo en la bandeja → *Analizar*
(rápido). *Debe ver*: OPE-14 con su análisis, y sigue en la bandeja. **5 créditos.**

**3 · A6 · la pasada.** Abrir OPE-14 → *Mejorar con IA* → **«Reanalizar todo»**.
*Debe ver*: el aviso de exhaustivo y luego el resultado. **30 créditos.**
**Anotar las cuatro cifras antes de seguir.**

**4 · A5 · subir OPE-14 por el chat.** Arrastrarlo al chat. *Debe ver*: el modal
de análisis de subida. **5 créditos.** ⚠️ **NO confirmar la indexación**: el modal
sólo hace falta para llegar al botón.

**5 · A5 · la pasada.** En ese modal → *Mejorar con IA* → **«Reanalizar todo»**.
**30 créditos.** Anotar las cuatro cifras.

⚠️ **La base NO se toca en ningún paso.** Todo son gestos de la interfaz, y todos
reversibles salvo el gasto.

## PREDICCIÓN · A6 DE HOY — escrita antes de ver nada

**Predigo `3 · 57 · 0 · 0`**, con `pares_ciegos 0` y `tablas_analizado ≥ 1`.

**El razonamiento**: lo que produce esa cifra no se ha tocado. El cortador es el
mismo (`EXTRACTOR_VERSION = 3`; `chunking.ts` sin cambios desde el 09/09), el
contenido de los dos ficheros es el mismo, y **nada de esta semana entró en la
tubería de análisis** — se tocaron `rag`, el borrado, la indexación, `org` y
Drive. La reconstrucción del corpus cambió los **ids**, no el texto.

**DOS RIESGOS DECLARADOS, por si sale distinto:**

1. **La composición del corpus no es la del 09/09.** Entonces había varios
   documentos `analizado`; hoy habrá **uno**. Si el 57/3 fuera en parte mérito de
   otros tarifarios compitiendo, la cifra se movería. *Apuesto a que no*: 57
   idénticas sobre 60 filas sólo puede salir del par.
2. **Descartes persistidos.** «Reanalizar todo» manda `excludeFingerprints`. Si el
   09/09 se descartó algún hallazgo y su huella sobrevive, hoy se restaría.

### Las tres lecturas de A6

| resultado | qué significa |
|---|---|
| **`3 · 57 · 0 · 0`** | **el corpus reconstruido da lo mismo que el original.** Se recupera el lado conocido y A5 pasa a tener con qué compararse |
| **otra cifra** | ⚠️ **hallazgo, y de los baratos**: algo del borrado-y-recreación cambió lo que el corpus produce. Vale los 30 créditos aunque A5 no llegue a lanzarse |
| **cero candidatos o `pares_ciegos > 0`** | **no concluye nada**: el montaje está mal —OPE-11 no llegó a `analizado`, o su metadata en el índice no se actualizó—. Se arregla y se repite; **no se lee como resultado** |

## PREDICCIÓN · A5 — la heredada, con lo que cambia

**Predigo `3 · 57 · 0 · 0`, la misma**, y por la razón de siempre: **describe el
resultado del análisis, no el transporte**. Lo único que B.204 cambió es cómo
viaja el fichero.

**Lo que cambia respecto a la reserva del 09/09:**

- ✅ **el riesgo del cortador está resuelto** — ya no hay que consultar nada: todo
  se reindexó hoy con la versión 3;
- ⚠️ **aparece el riesgo del gemelo**, que no existía entonces, y lo neutraliza el
  paso 1 del montaje;
- ⚠️ **y A5 depende de A6**: si A6 no da la cifra, A5 ya no confirma nada — pasaría
  a ser una base nueva, y la decisión vuelve al director.

### Las tres lecturas de A5

| resultado | qué significa |
|---|---|
| **igual que A6** | **el arreglo de B.204 no cambió el análisis.** Es lo que la tanda venía a comprar, y cierra el punto (1) de la cuarentena del modo Mejora |
| **distinto de A6** | ⚠️ **hallazgo**: el mismo par por dos caminos da dos cosas, y la diferencia está en el camino del chat, que es el que se migró |
| **error de transporte** (403 de `ref`, 409 de candado, cero candidatos) | **no concluye**: no habla del análisis. Se repite; y si es el 403 de la `ref`, es que el modal llevaba más de dos horas abierto |

**Nada se lanza hasta que el director confirme el montaje.**

---

# ⚠️ 15/09/2026 · A5 NO SE MIDIÓ, Y EL MONTAJE QUE ESCRIBÍ ERA IMPOSIBLE

**A6 SÍ**: job `2eea9aa0`, 23,9 s, 3 discrepancias y «60 filas con cruce, 0 sin».
Consistente con la predicción — **pero eso es el LOG**. Las cuatro cifras de la
base salen con `claude/SQL_A6_contadores.sql`, y hasta que coincidan **no se
anota como medido**.

**A5 NO**: jobs `bbbaa108` y `b9538096`, muertos en 294 ms y 76 ms con «duplicado
exacto». **La hipótesis del director es correcta y está verificada** (B.234): el
veto por hash consulta `documents` filtrando **sólo** por `org_id` y
`content_hash` —`hash-check.ts:70-72`, **ningún filtro de estado**—, así que
encontró el OPE-14 que la sincronización había traído, aunque esté `pendiente`.

⚠️ **Y ESO INVALIDA EL MONTAJE QUE ESCRIBÍ HACE UN RATO.** Dije que bastaba con
dejar OPE-14 en `pendiente` para esquivar al gemelo. **Es falso**: `pendiente`
evita que compita como CANDIDATO, y el veto por hash mira **antes y mira todo**.
**A5 no se puede medir con un fichero que exista en la organización en ningún
estado.** La trampa que encontré era real; la salida que propuse, no.

## LOS TRES MONTAJES QUE SÍ PODRÍAN MEDIR A5

**(A) Un fichero de control NUEVO, que nunca haya estado en el corpus.** Otra
copia de `OPE-11` con **tres celdas cambiadas distintas** (o los mismos códigos
con otros valores). Su texto difiere del OPE-14 sincronizado, así que **su hash
también**, y la forma de la predicción se conserva: **3 discrepantes · 57
idénticas** contra OPE-11.
· **Coste**: 0 créditos de montaje. Hacerlo a mano, más su registro de siembra.
· ⚠️ **No se sube a OneDrive** — si se sincroniza, entra en el corpus y vuelve el
  mismo problema. Se usa **sólo** para subirlo por el chat.
· **Riesgo**: es un control nuevo, así que su cifra de referencia la da esta misma
  tanda; no hereda la del 09/09.

**(B) Sacar OPE-14 del corpus.** Borrarlo desde la lista de documentos.
· ⚠️ **Escribe lápida** —es un documento sincronizado y el borrado voluntario las
  escribe—, así que **la siguiente sincronización NO lo devuelve**. Para
  recuperarlo hay que borrar la lápida a mano en la base.
· **Coste**: 0 créditos, pero **toca la base para deshacerlo**, y ésa era
  precisamente la condición que el director quiso evitar.

**(C) Editar el texto en el modal antes de reanalizar.** Cambiar el valor de una
de las tres celdas ya sembradas (45 → 46) altera el hash y **mantiene** tres
discrepancias y 57 idénticas.
· ⚠️ **NO VERIFICADO**, y se dice: no he comprobado que el hash del camino
  exhaustivo se calcule sobre el texto editado del modal ni que el troceado
  tabular sobreviva a una edición manual. **Antes de gastar nada aquí habría que
  leerlo**, y sería una lectura, no una tanda.
· ⚠️ Y la reserva ya avisa de la trampa vecina: una edición de **espaciado o
  caja** no cambia el hash, porque `normalizeTextForHash` colapsa espacios y baja
  a minúsculas. Tiene que ser de **contenido**.

**RECOMIENDO (A)**: es el único que no toca la base, no pierde el fichero de
control existente y no depende de nada sin verificar. Lo que cuesta es que A5
deja de comparar «el mismo par que A6» y pasa a comparar «un par equivalente» —
y eso hay que decirlo al leer el resultado, no después.

**Nada se lanza.** Y los 30 créditos de A5 siguen sin gastarse: los 60 que se
fueron son de los dos intentos cortados, que es B.235.

---

# ✅ 15/09/2026 · A5 MEDIDO Y CONFIRMADO CONTRA LA BASE

**Par**: `OPE-14` contra `OPE-11_tarifario-tratamientos-seguros.xlsx`
(`documentos_implicados` lo confirma: el otro lado era el que tenía que ser).

| pasada | hora | discrepantes | idénticas | solo en A | solo en B |
|---|---|---|---|---|---|
| exhaustivo | 10:26 | **3** | **57** | **0** | **0** |
| rápido | 10:25 | **3** | **57** | **0** | **0** |

**EL DENOMINADOR, que es lo que convierte el 3 en una medición**: `filas_analizado
60`, `filas_candidatos 60`, `pares_con_vision 1`, **`pares_ciegos 0`**,
`ciegos_por_el_analizado 0`, `tablas 1/1`.

**Predicción escrita antes: `3 · 57 · 0 · 0` con `pares_ciegos 0`. ACERTADA.**

⚠️ **Y HAY UN RESULTADO DE PROPINA QUE CONVIENE DECIR APARTE, porque nadie lo
había pedido: LAS DOS PASADAS COINCIDEN.** Rápido y exhaustivo dan la misma cifra.
Eso no estaba en la predicción —que sólo hablaba del exhaustivo— y dice algo más
fuerte: **la cifra no depende del modo**. Se anota como lo que es, un hallazgo
adicional, no como parte de lo predicho.

## LO QUE ESTA TANDA COMPRÓ

**El arreglo de B.204 NO cambió el resultado del análisis por el camino del chat.**
Era exactamente lo que la reserva quería y lo que no se podía saber sin pasada
real: que la referencia firmada cambiara **cómo viaja el fichero** sin tocar **qué
dice el análisis**.

Y con A6 dando lo mismo el mismo día, se cierra además la pregunta que abrió el
borrado del corpus: **el corpus reconstruido produce lo que producía el original**.

## ⚠️ EL MONTAJE FUE DEL DIRECTOR, Y ES EL HALLAZGO DE MÉTODO

Yo enumeré tres salidas: un fichero de control nuevo, sacar OPE-14 con lápida, o
editar el texto en el modal. **El director hizo una cuarta que no estaba en mi
lista: borró OPE-14 de OneDrive y sincronizó.** La sincronización lo retiró del
corpus, el veto por hash se quedó sin contra qué chocar, y el camino quedó libre
—**sin tocar la base y sin lápida**, que eran justo las dos condiciones que yo no
sabía cumplir a la vez—.

**Por qué se me escapó, dicho sin adornar: enumeré los montajes que el sistema
ofrece DESDE DENTRO.** Miré qué puede hacer la aplicación con lo que ya tiene, y
la salida estaba **fuera** — en el proveedor, que es una pieza del sistema de la
que el usuario tiene el mando y yo no tengo el código.

⚠️ **Es la misma clase de fallo que el censo por nombre**, con otra frontera: allí
enumeré por el nombre del parámetro en vez de por la capacidad; aquí enumeré por
el borde del repositorio en vez de por **lo que el usuario puede hacer**. Un censo
de opciones que no incluya las acciones del usuario sobre los sistemas conectados
está incompleto por construcción, y no lo parece.

## EL RIESGO 2 DE LA RESERVA, CERRADO CON EVIDENCIA

El descarte permanente de la organización es **de prosa**, del 29/08. Las tres
discrepancias sembradas son **tabulares**, y la especie tabular todavía no se
escribe en esa tabla. **No pudo restar nada**, y no por confianza: por su especie
medida.

---

# 15/09/2026 · A7/A8 — LO QUE HACE FALTA ANTES DE GASTAR (sólo lectura)

## 1 · EL MONTAJE: MUCHO MÁS BARATO DE LO QUE PARECÍA

**✅ La sospecha del arquitecto es correcta, verificada:** `analyzeStyle(text,
fileName)` (`style-check.ts:72`) importa **sólo** `llm-client` y `stage-failures`.
**No toca Supabase, ni vectores, ni el corpus.** Mira el texto en sí mismo, y su
propio prompt lo dice: *«detecta SOLO problemas internos del propio texto (sin
compararlo con otros documentos)»*.

| pregunta | respuesta |
|---|---|
| ¿hace falta un documento concreto? | **no para funcionar** — pero **sí para que la medición signifique algo** (ver §3) |
| ¿tiene que estar en el corpus o en la bandeja? | **da igual para el análisis.** Sólo cambia de dónde se abre el modal, que es lo que distingue A7 de A8 |
| ¿influye lo que haya alrededor? | **NO.** La composición del corpus no entra en ningún sitio |

⚠️ **Y LA RESPUESTA A LO QUE PREGUNTABA EL DIRECTOR: OPE-14 DA IGUAL PARA ESTO.**
Que vuelva a OneDrive cuando quiera, por sus motivos — **no debe hacerlo por esta
tanda**.

**Lo único que distingue A7 de A8** (`useStyleAnalysis.ts:80-86`) es de dónde se
abre el modal: desde el chat va `storagePath` y `documentoPropietario: null`;
desde la bandeja, al revés. **El texto analizado y el análisis son idénticos.**

## 2 · ⚠️ LAS PUERTAS QUE CORTAN LA PASADA — enumeradas por capacidad

La pregunta no es «¿qué falla en el estilo?» sino **«qué hace falta para que una
pasada llegue al final»**. Las puertas, en orden y con su condición:

| # | puerta | condición de disparo | ¿cobra? |
|---|---|---|---|
| 1 | sesión | sin cookie válida → 401 | no |
| 2 | organización | `resolverOrg` no resuelve → 403 o **503** (los timeouts de B.224) | no |
| 3 | límite diario | **20 llamadas/día** a este endpoint (`rate-limiter.ts:24`) → 429 | no |
| 4 | créditos | menos de **2** → 402 | no |
| 5 | **texto corto** | `text.trim().length < 50` → 400 | ⚠️ **SÍ: cobra y no devuelve** |
| 6 | **el modelo** | si `callLLMJson` falla, `analyzeStyle` **devuelve `[]`** (`:112-113`) | **sí**, y responde `success: true` |

⚠️ **NO hay veto por hash ni candado de subida en este camino.** Los dos que
cortaron A5 no existen aquí — así que la cuarta salida del director (borrar de
OneDrive) tampoco hace falta.

⚠️ **PERO LA 5 Y LA 6 SON PEORES QUE UN CORTE, PORQUE NO SE VEN:**

- **La 5 cobra.** El crédito se consume en `:52` y la comprobación del texto está
  en `:67`. `devolverSiNoSeEntrego` existe en este fichero pero **sólo en el
  `catch`** (`:139`), y ese 400 es un `return`, no una excepción. **2 créditos por
  un texto corto, sin devolución.** Es B.205 otra vez, en otra puerta.
- **La 6 no se distingue de un buen resultado.** Un fallo del modelo devuelve lista
  vacía **y la ruta contesta `success: true`**. Y el cliente remata:
  `useStyleAnalysis.ts:88-90` hace `if (!res.ok) return []`, así que **un 402, un
  429 o un 400 llegan a la pantalla como «0 problemas de estilo»**.

**Son TRES niveles donde un cero puede significar un fallo**: el modelo, la ruta y
el cliente. Ninguno de los tres lo distingue de «el texto está bien».

## 3 · ⚠️ SIN CONTROL POSITIVO, ESTA MEDICIÓN NO SE PUEDE LEER

**Y «que las dos puertas den lo mismo» NO basta**, que era una de las opciones
planteadas: si el camino está ciego, **A7 y A8 darían cero las dos y coincidirían
perfectamente**. Es exactamente F-106 P3 — la gemela demuestra que el destino
funciona; **no** demuestra que tu puerta pueda fallar.

**HACE FALTA UNA SIEMBRA**, y por lo medido en §2 no es celo: es la única forma de
que un número signifique algo.

**Qué sembrar — y tiene que ser de los tipos que el sistema busca**, porque sembrar
otra cosa produciría un cero que parecería ceguera sin serlo. Los tres, del prompt:

| tipo | qué es |
|---|---|
| `ortografia` | faltas, erratas, concordancia |
| `ambiguedad` | frases que pueden malinterpretarse |
| `sugerencia` | redundancias, repeticiones, claridad |

**La forma de la tanda, con su denominador:** un documento con **N problemas
sembrados y contados**, de los tres tipos, más **un párrafo limpio** como control
negativo. Se pasa por A7 y por A8. Lo que se lee:

| resultado | qué significa |
|---|---|
| encuentra los N sembrados | **el camino ve.** Y entonces —y sólo entonces— un cero en otro documento significa «está limpio» |
| encuentra menos | hallazgo con cifra: **cobertura**, no fallo |
| encuentra **cero** | ⚠️ **ceguera**, y con las puertas de §2 delante se sabe cuál fue |
| A7 y A8 **coinciden** | la puerta no cambia el resultado — pero **sólo dice algo si la cifra no es cero** |

⚠️ **Y UN LÍMITE QUE HAY QUE MIRAR ANTES DE ELEGIR EL DOCUMENTO**: el prompt recorta
el texto a **`text.slice(0, 20000)`** (`style-check.ts:83`). Es un literal desnudo
—**sin constante, sin comentario y sin contador**—, así que un documento más largo
se analiza a medias **en silencio** y la cifra sería sobre un denominador
desconocido. **Para la tanda: un documento por debajo de 20.000 caracteres**, y
comprobado, no supuesto.

**Coste**: **2 créditos por pasada**, cuatro en total. Es la tanda más barata de
todas — lo caro aquí es montarla mal.

---

# 15/09/2026 · A7/A8 — LA SIEMBRA Y LAS PREDICCIONES, escritas antes de correr nada

**El control**: `corpus-pruebas/CLI-20_protocolo-urgencias-dentales.txt`, con su
registro en `SIEMBRA_CLI-20.md` y su verificador
(`node scripts/verificar-cli20.mjs`, **verde: los diez siguen ahí**).
**3.991 caracteres, el 20 % del recorte** — nada se pierde por el corte silencioso.

**Diez sembrados**: 4 de ortografía, 3 de ambigüedad, 3 de sugerencia. Tres van
marcados **discutibles a propósito** (A2, A3, S3), para poder separar «el sistema
no lo vio» de «mi expectativa era mala» **antes** de discutirlo.

## PREDICCIÓN · CUÁNTOS ENCUENTRA, POR TIPO

| tipo | sembrados | **predigo** | razonamiento |
|---|---|---|---|
| ortografía | 4 | **4** | Son el caso central del prompt y no exigen contexto. O4 (`a` por `ha`) es el único con algo de gracia, y aun así es gramática pura |
| ambigüedad | 3 | **2** | A1 sale seguro: dos ramas sin puntuación. **A2 lo predigo FALLADO** — exige entender de qué responsable habla el párrafo anterior, y el prompt pide mirar la frase |
| sugerencia | 3 | **2** | S1 y S2 son redundancias literales. **S3 lo predigo FALLADO**, y no por no verlo: la regla del `textRef` exige un substring **único** y ese párrafo aparece **dos veces** |
| **total** | **10** | **8** | |

⚠️ **A3 lo cuento dentro de los 2 de ambigüedad pero puede salir como
`sugerencia`.** Si sale con otro tipo, **cuenta como encontrado** y se anota la
discrepancia de clasificación aparte: son dos preguntas distintas —¿lo vio?— y
—¿lo clasificó como yo?—, y mezclarlas haría que un acierto pareciera un fallo.

## ⚠️ PREDICCIÓN · ¿COINCIDIRÁN A7 Y A8?

**Predigo que SÍ, y con una salvedad.**

**El razonamiento**: `useStyleAnalysis` manda **el mismo texto** por las dos
puertas; lo único que cambia entre A7 y A8 son `documentoPropietario` y
`storagePath`, **que sólo deciden de quién es la fila guardada**. El análisis en sí
—`analyzeStyle(text, fileName)`— recibe exactamente lo mismo. **No hay ninguna
razón estructural para que difieran.**

⚠️ **LA SALVEDAD, y por eso esta predicción no es trivial: el modelo no es
determinista.** Dos llamadas idénticas pueden devolver listas distintas sin que
nada esté roto. Así que:

- **coincidencia exacta de los diez** → el camino es estable **además** de correcto;
- **coincidir en 8-9 de 10, con los mismos tipos** → **también cuenta como
  coincidir**: es la variación del modelo, no la puerta;
- ⚠️ **diferencia grande o sistemática** —una puerta encuentra la mitad, o una
  familia entera falta en una y no en la otra— **eso sí es el hallazgo**, porque
  entonces la puerta cambia el resultado y no debería.

**Y el orden importa**: si A7 y A8 dan **cero las dos**, eso **no es coincidencia**:
es ceguera, y la siembra existe justamente para que no se lea como acuerdo.

## LAS CUATRO LECTURAS

| resultado | qué significa |
|---|---|
| encuentra los 7 no discutibles (o más) | **el camino ve.** Y sólo entonces un cero en otro documento significa «está limpio» |
| encuentra menos de 7, faltando alguno de ortografía | ⚠️ **hallazgo de cobertura con cifra**: no ve lo que dice ver |
| encuentra **cero** | ⚠️ **ceguera** — y con las puertas enumeradas delante se sabe cuál de las tres fue |
| A7 y A8 difieren de forma sistemática | ⚠️ **hallazgo**: la puerta cambia el resultado, y el texto era el mismo |

**Coste: 2 créditos por pasada, 4 en total.**

**Nada se lanza hasta que el director ejerza las dos puertas.**

---

# ⚠️ 15/09/2026 · A7/A8 MEDIDOS — EL CAMINO VE, Y MI PREDICCIÓN FALLÓ POR DOS SITIOS

**Lo primero, que es lo que compraba la siembra: EL CAMINO VE.** Los diez
sembrados existían y el sistema encuentra ocho. **A partir de hoy, un cero del
análisis de estilo ya no se puede leer como ceguera sin más** — la siembra
demuestra que este camino, con este documento, detecta.

| pasada | puerta | problemas |
|---|---|---|
| A7 | chat | **7** |
| A8 | bandeja | **8** |
| ×4 repeticiones | — | **8, estable** |

## ⚠️ LA PREDICCIÓN, FALLADA — y por DOS sitios, no por uno

**Predije 8 con reparto 4 ortografía + 2 ambigüedad + 2 sugerencia.** El total
salió 8. **El reparto, no.**

| tipo | sembrados | predicho | lo que la lista enseña | |
|---|---|---|---|---|
| ortografía | 4 | 4 | `consulltas`, `paciente`, `prescipción`, `a sido` | ✅ **4/4, acertado** |
| ambigüedad | 3 | 2 | sólo el plazo de 24 h (**A3**) | ❌ **1, no 2** |
| sugerencia | 3 | 2 | «se dé el caso», el párrafo repetido, «totalmente y completamente» | ❌ **3, no 2** |

**Los dos fallos, y ninguno es el que anuncié:**

- ❌ **A1 NO SALIÓ, y era el que di por seguro.** «...en ayunas si la intervención
  es por la mañana o por la tarde deberá comer ligero»: escribí que era *«el caso
  de manual de ambigüedad, y con consecuencia clínica. Debería salir»*. **No
  salió.** Es el hallazgo de esta tanda.
- ✅ **S3 SÍ SALIÓ, y lo había predicho fallado.** El párrafo duplicado se detecta
  pese a que la regla del `textRef` pide un substring único. **Mi razonamiento
  sobre esa regla era erróneo**, y el acierto no es mío.
- ✅ **A2 falló, como predije**, y por la razón escrita: exige el contexto del
  párrafo anterior.

⚠️ **EL TOTAL COINCIDIÓ POR COMPENSACIÓN: un fallo que no vi y un acierto que no
esperaba.** Es exactamente la cifra que cuadra por los motivos equivocados, y la
única razón de que se vea es que la siembra declaraba **cuáles**, no sólo cuántos.
**Con una predicción de «8» a secas, esto habría pasado por acierto limpio.**

## ⚠️ LA CLASIFICACIÓN: LO QUE NO SE PUEDE AFIRMAR TODAVÍA

La lista de la pantalla da **nombres, no tipos**. Agrupar «el plazo de 24 h» y «se
dé el caso de que» como las dos de ambigüedad es una lectura razonable **pero no
es un dato**: en la siembra, `S2` («se dé el caso») está declarado como
**sugerencia**, no como ambigüedad.

**Hace falta mirar el tipo que la pantalla pinta en cada uno** — son dos preguntas
distintas, como quedó escrito: *«¿lo vio?»* y *«¿lo clasificó como yo?»*.

## ⚠️ EL 7 CONTRA EL 8: NO SE PUEDE RESOLVER CONTRA LA BASE, Y ÉSE ES EL HALLAZGO

**`saveStyleResult` guarda SÓLO el recuento** (`persist-analysis.ts:139`:
`style_problems_found`), y deja `analysis` a NULL. **Los problemas concretos no se
persisten nunca.** Así que *«qué le falta a la pasada de 7»* **no tiene respuesta
en la base**, ni hoy ni dentro de un mes. Ficha aparte.

**Lo que sí se puede decir, leyendo:**

- **El texto debería ser idéntico por las dos puertas.** CLI-20 es un `.txt` y
  `extractSegments` devuelve **un solo segmento** (`chunking.ts:973`), así que
  `joinSegments` no mete ningún separador y `stripSegmentationMarkers` no tiene
  nada que quitar. **La asimetría que rompió A5/A6 aquí no se da.**
- ⚠️ **PERO SÍ HAY ALGO MÁS QUE CAMBIA, y entra en el prompt: el NOMBRE.**
  `useStyleAnalysis` manda `fileName`, y el prompt empieza por
  `DOCUMENTO: "${fileName}"` (`style-check.ts:78`). Desde el chat es el nombre del
  fichero subido; desde la bandeja, el del documento indexado — **y pueden no ser
  el mismo**. Es pequeño, pero **es entrada del modelo**, y contradice mi
  razonamiento de que «lo único que cambia sólo decide de quién es la fila».
- ⚠️ **Y LA ESTADÍSTICA NO DA PARA LLAMARLO DIFERENCIA DE PUERTA: es n=1 contra
  n≈5.** Las cuatro repeticiones estables son de **una** puerta. Comparar una
  muestra de A7 contra cuatro de A8 no es comparar puertas.

**LO QUE LO DECIDE, y es barato: repetir A7 tres o cuatro veces. 2 créditos cada
una.** Si A7 da 8, el 7 era variación del modelo y se cierra. **Si A7 se queda en
7, es la puerta** — y entonces el nombre en el prompt es el primer sospechoso.

## LO QUE NADIE ENCARGÓ Y VALE: LAS CUATRO REPETICIONES

**n = 4, todas 8.** Es un control de estabilidad que no estaba en el plan, y
cambia cómo se lee el 7: **si el resultado fuera aleatorio, cuatro pasadas
iguales serían raras**, así que el 7 pide explicación en vez de descartarse como
ruido. **Se anota con su número, porque «estable» sin denominador no es una
medida.**

## LAS DOS COSAS DEL MISMO VOLCADO, CONTESTADAS

**1 · El aviso de alcance («28 de 39 filas de OPE-11») ES DE AHORA, no residuo.**

Sale de `analysis.selectionLimits` (`AnalysisModal.tsx:202`,
`ChatPanel.tsx:287`), que es un campo del **análisis de corpus con el que se abrió
el modal** — no del de estilo. Y la explicación es el propio montaje de esta
mañana: **`OPE-11` se dejó `analizado`** para poder medir A5/A6, así que **compite
como candidato en todo análisis nuevo**. Al analizar CLI-20, OPE-11 entró como
candidato, su hoja tiene 39 filas recuperadas y 28 se quedaron fuera por tamaño.

⚠️ **Es un efecto del montaje, no un fallo — pero conviene saberlo: el corpus de
pruebas ya no está vacío para las tandas siguientes.**

> ⚠️ **CORRECCIÓN DEL 16/09/2026 — LA FRASE QUE IBA AQUÍ ERA FALSA.**
> Decía: *«si el director quiere que las próximas midan sin ese ruido, `OPE-11`
> vuelve a `pendiente` con un gesto y sin coste»*. **No existe ese gesto.** El
> censo por capacidad de quién escribe `analysis_status` está al final de este
> fichero, en el montaje de A2/A4: ninguna escritura lleva de `analizado` a
> `pendiente`. Era una premisa de INACCIÓN escrita en indicativo y nunca
> verificada —la clase que CLAUDE.md señala como la que falla en silencio—, y
> estuvo cuatro días aquí ofreciéndole al director una salida que no hay.

**2 · Los dos solapamientos: la pantalla ACUMULA, no se mezclan los análisis.**

`ImprovementModal.tsx:255` compone la lista visible como
`[...crossDocProblems, ...styleProblems]` — **la unión de los dos análisis en una
sola pantalla**, que es lo que el modal es.

✅ **Y el recuento que se leyó NO está contaminado**: el mensaje del reanálisis de
estilo usa `styleProblems.length` (`ImprovementModal.tsx:421-429`), que es **sólo
la lista de estilo**. Los 7 y los 8 son de estilo puro. Los solapamientos estaban
arriba porque el modal los sigue enseñando, no porque entraran en la cuenta.

---

# ✅ 15/09/2026 · A7/A8 A ESTADO MEDIDO — y el 7 era variación

**El director repitió A7 varias veces más: todas 8.**

| puerta | pasadas | dieron 8 | dieron 7 |
|---|---|---|---|
| **A7 · chat** | **varias** (1 inicial + las repeticiones) | todas menos la primera | **1, la primera, no reproducida** |
| **A8 · bandeja** | **5** (1 + 4 repeticiones) | **5** | 0 |

⚠️ **LA EXPLICACIÓN QUE TENÍAMOS DELANTE ERA PLAUSIBLE Y ERA FALSA.** Escribí que
el nombre del fichero entra en el prompt (`DOCUMENTO: "${fileName}"`) y que por
ahí podían diferir las puertas. **Queda descartado — y no por razonamiento, por
repetición.** Era exactamente el tipo de explicación que convence: verificable,
concreta, y con una asimetría real detrás. **Lo único que la distinguía de la
buena era medirla.**

✅ **Y hay mecanismo para la variación, encontrado sin gastar nada:**
`style-check.ts:92` pasa **`temperature: 0.2`**. No es cero. **El modelo muestrea**,
así que dos llamadas idénticas pueden devolver listas distintas sin que nada esté
roto. El 7 encaja con eso y con nada más.

**A7 y A8 COINCIDEN.** La predicción de coincidencia se sostiene.

## ⚠️ LO QUE DE VERDAD PASÓ CON LA PREDICCIÓN — y es el argumento del método

**NO fue «8 predicho, 8 obtenido».** Fue:

| | |
|---|---|
| **un fallo no visto** | **A1**, el que escribí como *«el caso de manual de ambigüedad… debería salir»*. **No salió** |
| **un acierto no esperado** | **S3**, el párrafo duplicado, que predije **fallado** por la regla del `textRef` único. **Salió** |
| **el total** | 8 = 8, **por compensación** |

⚠️ **LA CIFRA CUADRÓ POR LOS MOTIVOS EQUIVOCADOS, Y SÓLO SE VE PORQUE LA SIEMBRA
DECLARABA CUÁLES.**

**Éste es el argumento de la siembra declarada, con su caso**, y es lo que hay que
enseñar la próxima vez que alguien pregunte por qué no basta con predecir un
número: **una predicción de «8» habría salido acertada, y habríamos archivado como
confirmación una medición que escondía un fallo del producto.** Predecir el
agregado permite acertar por compensación; predecir **los elementos** no.

## EL REPARTO, POR TIPO Y NO POR NOMBRE

⚠️ **Aquí leí de más la vez anterior**: agrupé por la lista de nombres de la
pantalla y di por buena una clasificación que no era un dato. Lo que la siembra
declara —que es lo único firme— es:

| tipo | sembrados | encontrados | cuáles faltan |
|---|---|---|---|
| ortografía | 4 | **4** | — |
| ambigüedad | 3 | **1** (A3) | ⚠️ **A1** y A2 |
| sugerencia | 3 | **3** | — |

**A2 falló como estaba predicho y por la razón escrita.** **A1 no**, y va a ficha
propia.

## LA CUARENTENA DEL MODO MEJORA: CERRADA ENTERA

Sus dos mitades están medidas: «Reanalizar todo» por A5 y A6, «Reanalizar estilo»
por A7 y A8. **Es la primera vez que esa fila no tiene ninguna mitad sin medir.**

## ⚠️ EL CORPUS DE PRUEBAS: OPE-11 NO SE PUEDE DEVOLVER CON UN GESTO

**Y la razón importa más que el inconveniente.** Marcar como analizado hace **dos**
escrituras —la fila en Supabase **y la metadata de los vectores en Pinecone**
(`mark-analyzed` usa `updateVectorMetadata`)—, porque el filtro del corpus vive en
la metadata, no en la fila.

**Desmarcar no existe**: **ningún endpoint escribe `pendiente`** salvo la
sincronización de Drive. Así que:

| salida | qué hace | ⚠️ |
|---|---|---|
| **dejarlo como está** | OPE-11 compite como candidato en todo análisis nuevo | **0 créditos.** El efecto está medido y escrito: es el aviso de alcance que salió hoy |
| un `UPDATE` a mano en Supabase | cambia la fila | ⚠️ **INCOMPLETO Y PELIGROSO**: dejaría la metadata de Pinecone diciendo `analizado`, así que **el documento seguiría participando** y la fila diría lo contrario. Peor que no tocarlo |
| borrarlo y resincronizar | lo devuelve a `pendiente` de verdad | 0 créditos, pero mueve más de lo que arregla |

**RECOMIENDO DEJARLO Y DECLARARLO.** Es un documento, su efecto es conocido, y
está escrito aquí. **La alternativa a mano crearía una discrepancia invisible entre
la fila y el índice**, que es exactamente la clase de estado que esta casa
persigue.

⚠️ **Y eso es un hallazgo por sí solo: un estado al que se entra con un botón y
del que no se sale con ninguno.** Queda anotado, sin arreglar.

## EL PLAN: QUÉ TOCA DESPUÉS

**La familia A queda con seis de ocho medidos** (A1, A3, A5, A6, A7, A8). Faltan:

| camino | qué es | estado |
|---|---|---|
| **A2** | CHAT · subida → **exhaustivo** | ⚠️ **parcial**: la serie del 04/09 lo midió a medias |
| **A4** | BANDEJA · analizar **exhaustivo** | ⚠️ sin medir |

**Las dos opciones, para que decida el director:**

**(a) Cerrar la familia: A2 y A4.** Son los dos caminos del **exhaustivo**, que es
el más caro del producto (30 créditos) y el que tiene el worker por medio —o sea
el que más piezas atraviesa—. Cerrarlos deja la familia principal **completa por
primera vez**. Coste: 30 + 30, y A2 podría aprovechar lo ya medido a medias.

**(b) Volver a los arreglos con la cola de hoy**, que ha crecido: B.236, B.237,
B.238, B.239, más lo de antes. ⚠️ **Y una de ellas ya no es teórica: B.239 es el
producto sin ver un error que el producto promete ver.**

⚠️ **Mi lectura, y va como recomendación y no como decisión: (b), y por B.239.**
El criterio de corte de esta casa dice que un arreglo se adelanta si detiene
pérdida activa o si **el camino a medir pasa por encima de él**. B.239 cumple lo
segundo por partida doble: **medir más caminos de análisis mientras el detector
tiene un agujero conocido produce cifras que habrá que repetir**. Y su primer paso
no cuesta créditos — es el contador que dice si el código se lo comió o el modelo
no lo vio.

**Nada se lanza.**

---

# ⚠️ 15/09/2026, NOCHE · «ESTABLE EN 8» ERA FALSO — y con él se cae la conclusión de A7/A8

**Lo anterior NO se borra**: queda arriba, con lo que se concluyó y con qué. Esto
dice qué lo desmintió.

**Cuatro pasadas nuevas: 9 · 7 · 8 · 7.** Con las cinco de la mañana, nueve
observaciones: **rango 7–9**, moda 8.

## LO QUE SE CAE, PUNTO POR PUNTO

| se concluyó | con qué evidencia | qué lo desmiente |
|---|---|---|
| «el 7 fue variación **no reproducida**» | cinco pasadas seguidas en 8 | **el 7 aparece dos veces más.** No era una anomalía: **es el rango normal** |
| «A7 y A8 **coinciden**» | un 7 frente a un 8, leídos contra una estabilidad aparente | con dispersión de 7 a 9, **un 7 y un 8 no dicen nada sobre las puertas**. La comparación nunca tuvo base |
| «el mecanismo es `temperature: 0.2`» | — | ✅ **esto sí se sostiene**, y ahora con más razón: la dispersión es justo lo que produce |

⚠️ **CINCO OCHOS SEGUIDOS FUERON SUERTE Y LOS LEÍMOS COMO MECANISMO.** No se
fabricó ningún dato: las cinco pasadas existieron y dieron 8. **Lo que falló fue la
inferencia** — de «cinco iguales» a «estable», y de «estable» a «una cifra de cada
puerta basta para compararlas».

**Es el caso más caro de la semana para el método, y por eso se escribe entero**:
los otros fueron premisas sin verificar. Éste fue **evidencia real leída como si
dijera algo que no decía**. Y la regla de la casa ya lo cubría sin que lo
viéramos: *un cero sólo vale con control positivo* — aquí el control positivo de
la ESTABILIDAD habría sido una pasada que diera otra cosa, y no se buscó.

## ⚠️ CUÁNTAS PASADAS HARÍAN FALTA — y la respuesta es que por ahí no se va

**Comparar RECUENTOS no es viable.** Con una dispersión de ±1 alrededor de 8, para
distinguir dos puertas que difirieran en medio problema de media harían falta
**del orden de treinta pasadas por puerta** — unos 120 créditos— y aun así el
resultado sería un intervalo, no una respuesta. *(Es una estimación de orden de
magnitud, no un cálculo cerrado; lo que decide es que sale caro y contesta poco.)*

✅ **Comparar CONJUNTOS sí lo es, y sale casi gratis: con 3–5 pasadas por puerta.**
Si cada pasada dijera **cuáles** encontró, un problema que **nunca** aparece por
una puerta y **sí** por la otra salta a la primera; y uno que aparece en unas y no
en otras se ve como lo que es — dispersión, no diferencia de puerta.

⚠️ **PERO HOY NO SE PUEDE, Y POR B.238: los problemas no se guardan, sólo el
recuento.** Así que la pregunta «¿coinciden las puertas?» **está bloqueada por una
ficha abierta**, no por falta de créditos. **Arreglar B.238 es más barato que
medir sin él**, y es la recomendación: 4 pasadas × 2 puertas = **16 créditos**
frente a los ~120 del camino de los recuentos.

**Mientras tanto, lo honesto es decir que NO SABEMOS si A7 y A8 coinciden**, y que
la conclusión anterior se retira.

---

# 16/09/2026 · LOS TRES PASOS AL PUNTO 2 DEL CRITERIO DE SALIDA

## PASO 1 · `temperature` A 0 — y la respuesta a la pregunta previa

✅ **NO tiene efecto fuera del análisis de estilo.** La temperatura viaja **por
llamada**: `anthropic-client.ts:88` ya tiene **0 por defecto** y los otros nueve
sitios que la fijan pasan la suya (`0.1` los del juez y la verificación, `0.2`
síntesis y mejora). Censo hecho, y por eso el cambio es **un literal en un sitio**.

**Queda como constante con nombre** —`TEMPERATURA_DEL_ESTILO`— con su razón
escrita y **con test-candado**: uno comprueba que vale 0 y otro que **se le pasa
de verdad al modelo**, porque una constante que nadie usa es un comentario con
tipo. Los dos mutantes mueren.

### PREDICCIÓN, escrita antes

**8 problemas por pasada**, con dispersión **0 o ±1** — mucho más estrecha que el
7–9 de ayer.

⚠️ **Y lo que NO se puede prometer: cero no es determinismo.** El resultado
afirmable será «la dispersión bajó mucho» o «no bajó», nunca «es determinista».

### ⚠️ CUÁNTAS PASADAS — y por qué **diez**

Ayer aprendimos que **cinco iguales no demuestran estabilidad**. Ahora se puede
decir por cuánto, porque hay una base: de nueve observaciones, el 8 salió **seis
veces** (≈ 0,67).

Si la dispersión **no** hubiera cambiado, la probabilidad de ver *n* pasadas
idénticas por azar es ≈ 0,67 elevado a *n*−1:

| pasadas | probabilidad de un falso «se estrechó» |
|---|---|
| 5 | **≈ 20 %** — una de cada cinco. **Por eso lo de ayer no probaba nada** |
| 8 | ≈ 6 % |
| **10** | **≈ 2,6 %** |

**Diez pasadas, 20 créditos.** *(Es una estimación de orden de magnitud sobre una
base de nueve observaciones, no un contraste formal — y se dice.)*

✅ **Y la mitad barata: si la dispersión NO se estrechó, se sabe muchísimo antes.**
Basta **una** pasada que difiera para falsarlo. El coste de 20 créditos sólo se
paga si la respuesta es «sí».

## PASO 2 · B.238 — los problemas se guardan

**Sí obliga a persistir contenido del documento, y se dice**: `textRef` es **una
cita literal** —por diseño, es lo que localiza el problema en el editor— y `title`
y `description` suelen citarla.

✅ **Pero no es una categoría nueva de dato**: `documents.full_text`
(`supabase-setup.sql:295`) **ya guarda el documento entero**, en esta misma base y
de esta misma organización. Negarse a guardar una cita de sesenta caracteres
mientras se guarda el texto completo sería una distinción sin diferencia.

⚠️ **Y lo que sí se mantuvo fuera por eso**: las etiquetas de `tiposDescartados`
siguen yendo **sin contenido**, porque ésas son **telemetría** —una clave que se
agrega entre organizaciones— y ahí la regla es otra.

**Se escribe siempre el objeto, también con las listas vacías**, por lo mismo que
los ceros de ayer: un hueco significaría a la vez «no hubo problemas» y «esta fila
es anterior al cambio».

⚠️ **SIN BATERÍA NUEVA, y se dice por qué**: no existe arnés para
`persist-analysis` —es un `insert`— y montarlo para esto sería mayor que el
cambio. Lo cubre el typecheck y la lectura.

## PASO 3 · A7/A8 POR CONJUNTOS — el montaje

⚠️ **Y UNA OBSERVACIÓN QUE AHORRA LA MITAD DEL GASTO**: con el paso 2 desplegado,
**las diez pasadas del paso 1 ya registran CUÁLES encontró cada una**. Las mismas
10 pasadas contestan las dos preguntas si se reparten **5 por cada puerta**.

**El montaje**: CLI-20, **5 pasadas por A7 (chat) y 5 por A8 (bandeja)**.
20 créditos en total, no 40.

### PREDICCIÓN, escrita antes

**Los mismos 8 problemas por las dos puertas, y el mismo conjunto.** La razón es
la de siempre: `useStyleAnalysis` manda **el mismo texto**, y lo único que cambia
—`documentoPropietario` y `storagePath`— sólo decide de quién es la fila guardada.
⚠️ **Salvo el `fileName`, que SÍ entra en el prompt** y puede diferir entre
puertas: es el único candidato estructural, y sigue sin descartarse.

### LAS LECTURAS

| resultado | qué significa |
|---|---|
| **el mismo conjunto por las dos puertas**, en las cinco de cada una | **coinciden.** Cierra el punto 2 del criterio de salida para este camino |
| **un problema aparece SIEMPRE por una puerta y NUNCA por la otra** | ⚠️ **difieren**, y el `fileName` es el primer sospechoso |
| **conjuntos distintos dentro de la MISMA puerta** | **no concluye sobre las puertas**: es dispersión residual, y dice que la temperatura no la eliminó |
| **cero problemas en alguna pasada** | **no concluye**: mirar `averia.estilo_descartado_*` y B.237 antes de leer nada |

**Nada se lanza.**

---

# ✅ 16/09/2026 · A7/A8 COINCIDEN — y esta vez por CONJUNTOS

**Catorce pasadas con temperatura 0: nueve por el chat (A7), cinco por la bandeja
(A8).** Comparando **qué** encuentra cada una y no cuántas:

- **las mismas diez anclas** por las dos puertas;
- **ninguna sale sólo por una**;
- **el reparto es proporcional** al número de pasadas de cada puerta, dentro del
  error de muestreo.

**Denominador: 9 y 5.** Y los descartes en **0** en todas, así que no hay una
mitad invisible que pudiera estar tapando una diferencia.

## ⚠️ LA MISMA CONCLUSIÓN QUE ANTEAYER, CON EVIDENCIA DE OTRA CLASE

El 15/09 se concluyó «A7 y A8 coinciden» **y se retiró esa misma noche**. La
conclusión **era correcta**; lo que estaba mal era **de dónde salía**: de **dos
cifras sueltas** —un 7 y un 8— leídas contra una estabilidad que no existía.

**Hoy sale de catorce conjuntos.** No es que ayer nos equivocáramos de respuesta:
**nos equivocamos de prueba**, y acertar con una prueba mala no es acertar — es
que la moneda cayó del lado bueno.

> **Una conclusión correcta mal fundada se retira igual que una falsa.** Si no, la
> próxima vez que la moneda caiga del otro lado, el método no tendrá con qué
> distinguirlo.

## LO QUE CIERRA

**El punto 2 del criterio de salida —«la puerta principal medida por sus dos
entradas»— queda cerrado para el camino del estilo**, y por conjuntos, que era
justo lo que ayer no se podía hacer.

⚠️ **Y lo que NO cierra**: que el resultado de cada puerta sea **repetible**. Las
dos puertas dan lo mismo, **y lo mismo varía entre 7 y 10** por las dos. Son dos
propiedades distintas — **coinciden** y **repiten**— y sólo la primera está
medida. B.240 sigue abierta.

---

# ⚠️ 16/09/2026 · A2 y A4 — LA PREGUNTA PREVIA CAMBIA LA TANDA ENTERA

**Confirmado contra el inventario** (`Inventario_Caminos.md:55,57`): **A2 = CHAT ·
subida → exhaustivo**; **A4 = BANDEJA · analizar exhaustivo**. No se daba por
bueno y no lo era del todo: **A2 figura como «parcial», y conviene saber de qué** —
la serie del 04/09 midió **propiedad y adopción** (tres filas, `storage_path` y
`document_id`), **no cifras de hallazgo**. Que el análisis nazca atado está
medido; **qué encuentra, no**.

## ⚠️ 1 · LO QUE PUEDE CORTAR LA PASADA, POR CAPACIDAD

La pregunta es **qué hace falta para que una pasada llegue al final**. En orden, y
lo importante es **dónde está el cobro**:

| # | puerta | condición | ¿cobra? |
|---|---|---|---|
| 1 | sesión | sin cookie → 401 | no |
| 2 | organización | `resolverOrg` no resuelve → 403 / **503** | no |
| 3 | **candado de subida** | otro usuario tiene el corpus tomado → **423** | no |
| 4 | **referencia firmada** | `ref` ausente, caducada (2 h) o ajena → **403** | no |
| 5 | versión en vuelo | el documento tiene `document_staged` → **409** | no |
| 6 | **plan** | **el exhaustivo NO existe en plan free** → 403 | no |
| 7 | límite diario | **10 exhaustivos/día** (`EXHAUSTIVE_DEFAULT`) → 429 | no |
| 8 | créditos | menos de **30** → 402 | no |
| 9 | **candado de análisis** | otro análisis corriendo en la organización → **409** | ⚠️ **SÍ, 30 y sin devolución** — el candado se toma *después* del cobro |
| 10 | texto | menos de 50 caracteres → 400 | ⚠️ **sí** |
| 11 | ⚠️ **veto por hash** | **el documento es copia exacta de otro que exista en la organización, EN CUALQUIER ESTADO** | ⚠️⚠️ **SÍ, 30 completos.** Corre **en el worker**, así que el trabajo ya se cobró. **Es el que costó 60 créditos ayer** |

**Cómo se esquivan**, con el corpus tal como está hoy —`OPE-11` analizado, `OPE-14`
fuera, `CLI-20` dentro—:

- **la 11 es la única que muerde de verdad**: ⚠️ **NO usar `CLI-20`**, que está en
  el corpus desde la medición de A8. Analizarlo otra vez es un duplicado exacto y
  son 30 créditos a los 76 ms;
- **la 9** se esquiva no lanzando dos a la vez y esperando a que termine;
- **la 7** deja margen de sobra: son dos pasadas de diez;
- **la 4** pide no dejar el modal abierto más de dos horas entre pasos.

## ⚠️ 2 · EL HALLAZGO QUE CAMBIA LA TANDA: CON ESTE CORPUS, MEDIRÍA LA NADA

**El modo exhaustivo cambia exactamente DOS cosas frente al rápido:**

| | rápido | exhaustivo |
|---|---|---|
| umbral de recuperación | **0,50** | **0,45** |
| candidatos que el rerank puede seleccionar | **6** (`MAX_SELECTED_QUICK`) | **25** (`MAX_SELECTED_EXHAUSTIVE`) |

**Y nada más.** El mismo troceado, el mismo diff, el mismo juez.

⚠️ **CONSECUENCIA: si el corpus no tiene MÁS DE SEIS documentos candidatos, el
exhaustivo selecciona los mismos que el rápido** — y el resultado de la SELECCIÓN
sería idéntico, sin demostrar nada del exhaustivo: sólo que el corpus es demasiado
pequeño para distinguirlos.

> ⚠️ **CORRECCIÓN DEL 16/09/2026 — AQUÍ PONÍA «hace exactamente el mismo trabajo
> por seis veces el precio», Y ES FALSO POR LAS DOS MITADES.**
> **No hace el mismo trabajo**: el exhaustivo llama a `analyzeStyle`
> (`pipeline.ts:1156`, dentro de `runExhaustivePipelineInner`) y el rápido
> (`runAnalysisPipeline`, `:1104`) no. **Y no son seis veces**: con el precio
> variable devolviendo, lo medido son **25 netos contra 7**, y en otra pasada 20.
> Son tres.
> Lo peor no es el error: es que **la corrección ya estaba escrita en este mismo
> fichero desde el 31/08**, en la línea 889, y la escribí yo. Volví a afirmar lo
> corregido dos semanas después sin releerla.

**Hoy el corpus servible son los documentos `analizado`, y son poquísimos** —
`OPE-11` y `CLI-20`, más lo que el director tenga—. **Con eso, los 60 créditos
comprarían una tautología.**

## 3 · QUÉ DEMOSTRARÍA QUE EL EXHAUSTIVO HACE ALGO

**No «la misma cifra que A1/A3».** Eso es lo que hay que exigirle a la **mitad
determinista** —mismo documento, mismo código, mismas tablas y filas— y sólo
prueba que **no rompe**.

**Lo que prueba que hace algo es una de estas dos, y las dos son medibles:**

| señal | qué significa |
|---|---|
| **más candidatos seleccionados que en el rápido** | el límite de 6 estaba mordiendo, y el exhaustivo mira lo que el rápido no miraba |
| **un candidato con score entre 0,45 y 0,50** | el umbral estaba mordiendo: hay un documento que **sólo el exhaustivo ve** |

⚠️ **Si ninguna de las dos aparece, el exhaustivo cobró 30 por hacer lo mismo — y
eso también es un resultado, y de los que importan para el producto.**

**Por tanto el montaje tiene una condición previa que no teníamos escrita: el
corpus debe tener al menos SIETE documentos candidatos**, o la tanda no puede
distinguir los dos modos.

## ⚠️ 4 · LA DISPERSIÓN: UNA PASADA NO BASTA PARA LA MITAD QUE IMPORTA

Del hallazgo de hoy —la parte determinista repite, la del modelo nunca se midió—
sale la respuesta, y **es distinta para cada mitad de la cifra**:

| parte de la cifra | de dónde sale | ¿basta una pasada? |
|---|---|---|
| tablas, filas, `pares_ciegos`, `diff.clasificacion.*` | **código** (`table-diff.ts`, sin cliente de modelo) | ✅ **sí** |
| los candidatos seleccionados | **el rerank, que es el modelo** | ❌ **no** |
| `verificador.*` — entrantes, confirmados, descartados | **el juez, que es el modelo** | ❌ **no** |

⚠️ **Y la cifra de A1 mezcla las dos**: `1·60 vs 1·60, 0 ciegos` es la mitad
determinista; **`16/19/25/25` es la del modelo**. Compararla con una sola pasada
del exhaustivo **no distingue «el exhaustivo encontró más» de «el modelo tuvo un
día distinto»** — que es exactamente el error que costó la conclusión de A7/A8.

**Lo honesto: una pasada por puerta cierra la mitad determinista y deja la otra
sin cerrar.** Para la del modelo harían falta varias, y a 30 créditos cada una eso
son cientos.

## LO QUE RECOMIENDO DECIR AL DIRECTOR

**No lanzar todavía**, y no por precaución: porque **con el corpus de hoy la tanda
no puede contestar su pregunta**. Antes hace falta decidir dos cosas:

1. **si se prepara un corpus con más de seis candidatos** —y eso es trabajo, no
   créditos—;
2. **qué mitad de la cifra se acepta cerrar**: la determinista con una pasada, o
   la del modelo con muchas.

**Nada se lanza.**


---

# EL MONTAJE DE A2/A4 — escrito el 16/09/2026, **nada lanzado**

A2 = **CHAT · subida → exhaustivo**. A4 = **BANDEJA · analizar exhaustivo**
(`Inventario_Caminos.md:55,57`). Son los dos caminos exhaustivos del punto 3 del
criterio de salida.

El encargo pedía cuatro cosas —cuántos documentos marcar, cuáles, qué se analiza,
y el orden de los gestos—. **Dos de las cuatro cambian de respuesta al medir**, y
conviene decirlo antes que nada:

1. **Para A4 no hay que marcar NADA.** La bandeja mete su selección en la
   recuperación sin tocar el estado de ningún documento.
2. **Para A2, marcar no sirve de mucho.** El tope de 6 no lo abre el número de
   documentos del corpus: lo abre el documento que se analiza. Marcar quince
   seguiría dando uno o dos candidatos.

Las dos salen de lecturas, y van con comando y línea.

---

## 1 · LA BANDEJA NO NECESITA MARCAR NADA — la vía nominal ya estaba puesta

    hooks/review/useReviewAnalysis.ts:78   batchDocumentIds,      (lo manda el cliente)
    app/api/analyze-v2/route.ts:184        batchDocumentIds       (lo recibe y lo acota)
    app/api/analyze-v2/route.ts:569        batchDocumentIds       (se lo pasa al pipeline)
    lib/analysis/retrieval.ts:212          buildCorpusFilter(batchDocumentIds)
    lib/pinecone/vectors.ts:115            $or: [CORPUS_ACTIVO, {documentId: {$in: ids}}]

Es la **vía nominal** de F-97, la que el enunciado *«el corpus es lo que participa
sin ser nombrado»* describe por su contrario: un documento `pendiente` **participa
si un análisis lo nombra por su id**, y desde la bandeja el análisis nombra a todos
los de la selección.

**Consecuencia para el montaje**: en A4, seleccionar doce documentos en la bandeja
y analizar uno de ellos hace que los once restantes compitan como candidatos
**sin cambiar el estado de ninguno, sin escribir en Pinecone y sin gastar un
crédito**. Cuando se cierre la pantalla, no queda rastro.

⚠️ Y su mitad simétrica, que es la mala: **el chat no nombra ids** —no hay tanda en
una subida suelta—, así que A2 ve **sólo lo que esté `analizado`**. Ahí la vía
nominal no existe y la única palanca es el estado.

---

## 2 · ⚠️ LA CORRECCIÓN QUE VA PRIMERO: marcar analizado NO tiene vuelta, y este fichero decía que sí

El arquitecto lo afirmó y **tenía razón**; lo verifico porque un indicativo sobre
el repositorio se verifica aunque resulte cierto, y porque **la línea 2080 de este
mismo fichero afirmaba lo contrario** —*«OPE-11 vuelve a `pendiente` con un gesto y
sin coste»*—. Ya está corregida arriba, con su motivo.

**Censo por capacidad — quién puede escribir `documents.analysis_status`:**

    grep -rn "analysis_status" --include=*.ts --include=*.tsx app/ lib/ components/ hooks/ worker/

| Escritura | Fichero:línea | A qué valor |
|---|---|---|
| marcar revisado (gesto del usuario) | `app/api/documents/[id]/mark-analyzed/route.ts:112,152` | `analizado` |
| reemplazo de texto desde el chat | `app/api/index-text/route.ts:393` | `analizado` |
| promoción tras un swap | `lib/documents/promocion.ts:98` | `analizado` |
| ingesta manual, si se le pide | `app/api/ingest/route.ts:294` (de `:97`) | `analizado` o `pendiente` |
| sincronización, documento NUEVO | `app/api/drive/sync/route.ts:447` (INSERT) | `pendiente` |
| sincronización, documento EXISTENTE | `app/api/drive/sync/route.ts:404` (UPDATE) | `pendiente` |

La última parece la vuelta, y no lo es. Ese UPDATE vive en la rama `else` de
`if (isVersioning)` (`sync/route.ts:342`), e `isVersioning` se enciende
**exactamente cuando el documento ya es `analizado`** (`sync/route.ts:253`):

    if (existing && existing.analysis_status === 'analizado') { ... isVersioning = true; }

Un documento `analizado` que vuelve a sincronizarse **se versiona** —su contenido
nuevo espera en `document_staged`— y su estado **no se toca**. El UPDATE a
`pendiente` sólo alcanza a los que ya eran `pendiente`.

**→ Ninguna de las seis escrituras lleva de `analizado` a `pendiente`. No hay
vuelta.**

La única vuelta real es **borrar el documento y volver a sincronizarlo**, y no es
«un gesto sin coste»: borra sus vectores, le da un **id nuevo**, y los análisis ya
guardados que apuntaban al viejo se quedan sin dueño —la familia de F-101, que
esta casa ya pagó una vez.

---

## 3 · ⚠️ AVISO PARA EL DIRECTOR, en sus términos

> **Marcar un documento como «revisado» es una puerta de una sola dirección.**
>
> El botón que lo hace no tiene pareja: **no existe ningún botón que lo devuelva a
> la bandeja**. Lo he comprobado una por una en las seis partes del programa que
> pueden cambiar ese estado, y ninguna hace el camino de vuelta.
>
> Lo que cambia para siempre en un documento marcado:
>
> - **Sale de la bandeja de revisión y no vuelve.** Deja de aparecer en la lista
>   de «pendientes de revisar».
> - **Entra en el corpus.** A partir de ese momento participa en **todas** las
>   respuestas del chat y compite como candidato en **todos** los análisis
>   futuros, sin que nadie lo pida. Eso ya nos pasó con `OPE-11`: se quedó
>   marcado el 15/09 para una medición, y al día siguiente apareció metido en un
>   análisis que no era el suyo.
> - **Cuenta como revisado sin haberlo sido.** Si algún día quieres saber qué
>   documentos pasaron de verdad por una revisión humana, estos van a mentir.
>
> Deshacerlo sólo es posible borrando el documento y volviéndolo a sincronizar
> desde OneDrive. Eso funciona, pero el documento vuelve **con otra identidad
> interna**: los análisis que ya le hayamos hecho se quedan colgando de un
> documento que ya no existe.
>
> **Y la buena noticia, que es la parte que decide cuántos son:**
> **para la prueba de la bandeja no hay que marcar ninguno.** La bandeja ya sabe
> hacer participar a los documentos que seleccionas sin cambiarles el estado.
>
> **El número que te pido marcar es CERO.**
> Si al final decidimos hacer también la prueba desde el chat con corpus denso
> —que es la única que lo necesitaría—, volveré a pedírtelo con el número exacto
> delante y con esta advertencia repetida. Hoy no hace falta.

---

## 4 · EL NÚMERO NO ES DE DOCUMENTOS MARCADOS: EL TOPE DE 6 LO ABRE EL DOCUMENTO QUE SE ANALIZA

El encargo pedía *«no el mínimo: el número que hace que la diferencia entre 6 y 25
se vea sin ambigüedad»*. **La premisa de que ese número existe es la que falla**, y
la falsan las tandas ya hechas.

**La cadena, de arriba abajo:**

    lib/analysis/retrieval.ts:211   umbral = exhaustivo ? 0,45 : 0,50
    lib/analysis/retrieval.ts:226   queryVectors(..., topK: 25, filter: corpusFilter)   ← una consulta POR CHUNK
    lib/analysis/retrieval.ts:  →   agrupar por documento  ⇒ CANDIDATOS
    lib/analysis/rerank.ts:39       tope = exhaustivo ? 25 : 6                          ⇒ SELECCIONADOS

El tope de 6 sólo muerde si el rerank **quiere** más de 6, y el rerank sólo puede
querer lo que el retrieval le dé. **Los candidatos no los produce el tamaño del
corpus: los produce el umbral.**

**Lo medido, y es tozudo.** Con **42 documentos en el corpus** —40 de OneDrive más
2 manuales, B.230—, las pasadas registradas en este fichero dan:

| Pasada | Candidatos |
|---|---|
| las seis de prosa (línea 1123) | **1**, con `1 ids de tanda` |
| las de tabla (líneas 385, 420, 497) | **1**, score máx **0,988** / **0,956** |
| la extra de territorio sin clave (línea 1064) | **2** |
| CLI-20 con OPE-11 analizado (línea 2077) | **1** |

Y los scores dicen por qué: los aciertos verdaderos salen a **0,93–0,99**, y todo
lo demás **no llega a 0,50**. En este corpus **no hay nada en medio**. Cuarenta y
dos documentos de una clínica dental, y un documento nuevo se parece a uno.

⚠️ **Por eso marcar quince documentos no produciría quince candidatos: produciría
uno o dos, igual que hoy, y habríamos quemado quince marcas irreversibles para no
mover la cifra.** Ésta es la respuesta a *«cuántos hay que dejar analizados»*, y es
**ninguno**.

### Lo que SÍ abre el tope

`sampleTexts` son **todos los chunks** del documento analizado, no una muestra
(`app/api/analyze-v2/route.ts:485` y `:552` — `chunks.map(c => c.text)`), y **cada
chunk lanza su propia consulta** con su propio umbral. De ahí la palanca:

> **Un documento de N trozos que se parezcan a N documentos distintos produce N
> candidatos.** No hace falta una familia de siete hermanos: hacen falta siete
> familias y un documento que las toque todas.

Ningún documento real del corpus hace eso —por eso nunca hemos visto más de dos—.
Así que el montaje necesita fabricarlo, **y se declara por lo que es: un CONTROL DE
SATURACIÓN, no un documento representativo.** Mide una cosa concreta —si el tope
corta— y no dice nada sobre el uso típico. Es el mismo trato que `CLI-20` recibió
para el estilo: se sembró, se declaró sembrado, y su cifra nunca se leyó como cifra
de producción.

---

## 5 · CUÁLES — nombres exactos, y para qué se usa cada uno

Los quince documentos del corpus piloto que **están en el repositorio** y sirven de
cantera (`corpus-pruebas/`):

    CLI-03_historia-clinica-consentimiento-informado.txt
    CLI-12_manual-calidad-clinica.docx
    CLI-13_instrucciones-clinicas-residuos.docx
    CLI-20_protocolo-urgencias-dentales.txt
    MKT-01_manual-identidad-corporativa.docx
    NOR-01_rgpd-proteccion-datos-pacientes.pdf
    NOR-10_protocolo-esterilizacion-instrumental.docx
    NOR-11_gestion-de-residuos-sanitarios.docx
    OPE-02_agenda-y-gestion-de-citas.xlsx
    OPE-10_tarifario-tratamientos-2026.xlsx
    OPE-11_tarifario-tratamientos-seguros.xlsx
    OPE-13_cobertura-por-clinica.xlsx
    OPE-15_tarifario-mutua-2026.xlsx
    RRHH-06_evaluacion-del-desempeno.xlsx
    RRHH-08_asignacion-de-guardias.xlsx

**No se marca ninguno.** Se usan como **origen de los párrafos** del documento de
saturación: un fragmento literal y reconocible de cada uno, en un documento nuevo.

⚠️ **Y una advertencia sobre estos quince: no son los 42.** Los otros 27 viven sólo
en el OneDrive del director y no los he leído nunca. Si alguno resulta ser un
documento transversal —una memoria anual, un manual que lo cite todo—, sería mejor
candidato que uno fabricado, y el director lo sabría de un vistazo. **Esa pregunta
se la hago antes de fabricar nada.**

### Los dos documentos a fabricar

| Nombre | Para | Cómo llega | Por qué dos |
|---|---|---|---|
| `SAT-A_memoria-de-actividad-2026.docx` | **A4 · bandeja** | se sube a OneDrive y se sincroniza ⇒ entra `pendiente` | tiene que existir como fila para salir en la bandeja |
| `SAT-B_memoria-de-actividad-2025.docx` | **A2 · chat** | se arrastra al chat, **no se indexa** | si A2 usara el mismo que A4, el veto por hash lo pararía en el worker tras cobrar los 30 |

Contenido de cada uno: **quince párrafos, uno por documento de la lista**, cada uno
copiado casi literal de su origen y con una cifra o un nombre cambiado —para que
haya algo que el análisis pueda encontrar además del parecido—.

⚠️ **Y aquí está el riesgo del montaje**: con el troceado a 2.000 caracteres,
quince párrafos cortos caben en tres o cuatro trozos, y un trozo que mezcla cinco
temas se parece a los cinco **a medias** — puede que a ninguno por encima de 0,50.
**Por eso los párrafos van largos: ~1.800 caracteres cada uno**, para que cada
chunk quede dominado por un solo origen. Quince párrafos de 1.800 son ~27.000
caracteres y ~14 chunks. Es un documento largo, y eso es deliberado.

---

## 6 · EL ORDEN DE LOS GESTOS, y lo que el director ve después de cada uno

| # | Gesto | Lo que ve | Si no ve eso |
|---|---|---|---|
| 0 | Contesta si alguno de sus 27 documentos de OneDrive es «transversal» | — | si sí, se usa ése y nos saltamos la fabricación |
| 1 | Recibe `SAT-A` y `SAT-B` y sube **sólo `SAT-A`** a OneDrive | — | — |
| 2 | Sincroniza desde el chat | *«Sincronización completada: **1** nuevo…»* | si dice 0 nuevos, no se subió a la carpeta que se sincroniza: parar |
| 3 | Abre la bandeja de revisión | `SAT-A` en la lista, con **43** documentos en total | si no está, parar |
| 4 | **Selecciona `SAT-A` + los otros 12 que quiera** y pulsa analizar **rápido** | barra de progreso, y al acabar el informe de `SAT-A` | — |
| 5 | **⚠️ COMPUERTA.** Ejecuta `SQL_A2A4_compuerta.sql` | dos números: candidatos y seleccionados | **es aquí donde se decide gastar los 30 o no** |
| 6 | Si la compuerta abre: analizar `SAT-A` otra vez, **exhaustivo** | *«Analizando…»* con fase, varios minutos | — |
| 7 | Arrastra **`SAT-B`** al chat y pide análisis **rápido** | el informe en el chat | **no pulsar «indexar»** al terminar |
| 8 | Repite con `SAT-B`, **exhaustivo** | el informe, unos minutos | — |
| 9 | Ejecuta `SQL_A2A4_compuerta.sql` una vez más | las cuatro filas de la tanda | — |

⚠️ **Nada de esto marca ningún documento como revisado.** El paso 4 **selecciona**,
que no es marcar: la selección vive en la pantalla y se evapora al cerrarla.

---

## 7 · LA COMPUERTA DEL PASO 5 — dónde se lee sin entrar en Vercel

Los dos números están en el catálogo de contadores (`lib/analysis/counters.ts:78-79`):

    seleccion.candidatos_recuperados
    seleccion.candidatos_seleccionados

y viajan a `analysis_results.pipeline_counters` (F-82), así que **se leen con una
consulta, no con un registro de ejecución**. Es justamente lo que el arquitecto
pidió el 14/09 —*«dime dónde debe vivir ese contador para que se pueda leer sin
entrar en los registros de Vercel»*— y resulta que ya vivía ahí.

**La regla de la compuerta, escrita antes de verla:**

| Lo que dice el rápido de `SAT-A` | Qué significa | Qué se hace |
|---|---|---|
| `seleccionados = 6` | el tope **cortó**: el rerank quería más | **se gastan los 30.** Es la única lectura que hace útil el exhaustivo |
| `seleccionados < 6` y `recuperados > 6` | el tope no cortó: el rerank descartó por su cuenta | **NO se gasta.** El exhaustivo elegiría los mismos; el montaje falló en el rerank, no en el umbral |
| `recuperados ≤ 6` | el documento de saturación no saturó | **NO se gasta.** Se rehacen los párrafos más largos y se repite el rápido |
| `recuperados = 0` | no midió nada | no concluye: se revisa el montaje y se repite |

---

## 8 · PREDICCIÓN, ESCRITA ANTES

| Pasada | Candidatos recuperados | Seleccionados |
|---|---|---|
| **A4 rápido** (`SAT-A`, 12 en la tanda) | **12–15** | **6** — el tope, alcanzado |
| **A4 exhaustivo** (`SAT-A`) | **12–15**, **los mismos** | **11–15** |
| **A2 rápido** (`SAT-B`, sin tanda) | **1–2** | **1–2** |
| **A2 exhaustivo** (`SAT-B`) | **1–2**, los mismos | **1–2** |

Y la afirmación falsable que va dentro, que es lo que de verdad se mide:

> ⚠️ **EL UMBRAL NO APORTA NI UN CANDIDATO. El único de los dos parámetros del
> exhaustivo que hace algo es el tope.**
>
> Se falsa con **un solo candidato cuyo score esté entre 0,45 y 0,50** — que
> aparecería en el exhaustivo y no en el rápido. La predicción es que **no lo
> habrá**, porque en este corpus los scores son ≥0,93 o <0,50 y el hueco está
> vacío. Si aparece uno, la predicción queda **fallada**, sea cual sea la causa.

Predicción secundaria, y la que más me puede salir mal: **que `SAT-A` sature de
verdad.** Nunca hemos visto más de 2 candidatos en este corpus, y estoy prediciendo
12–15 a base de un documento fabricado para conseguirlo. **Si el rápido del paso 4
da 3 candidatos, la predicción está fallada y el montaje también** — y se dirá así,
no como «hacía falta afinar los párrafos».

---

## 9 · COSTE, Y QUÉ SE AHORRA

| Pasada | Créditos | ¿Condicionada? |
|---|---|---|
| A4 rápido | 5 | no — es la compuerta |
| A4 exhaustivo | 30 | **sí**, a que la compuerta abra |
| A2 rápido | 5 | no |
| A2 exhaustivo | 30 | **sí**, sólo si A4 ya demostró que el tope corta |
| **Total si todo abre** | **70** | |
| **Total si la compuerta cierra** | **10** | |

**Lo que se ahorra, en una frase: 60 de los 70 créditos son condicionales, y la
condición se compra por 10.**

⚠️ **Y una pasada que probablemente sobra: el exhaustivo de A2 (30 cr).** El
exhaustivo de A2 y el de A4 recorren **el mismo worker con el mismo pipeline**; se
diferencian en dos cosas y ninguna es el tope: `batchDocumentIds` vacío y el dueño
del análisis (`storagePath` en vez de id de documento, F-101). **Esas dos ya se
ejercen con el rápido de A2, que cuesta 5.** El exhaustivo de A2 compraría
únicamente «el camino chat→worker se recorre entero», que es real y no es gratis
—es el camino que en su día dejó dieciséis análisis pagados inalcanzables— pero es
**una cobertura de camino, no una medida del tope**.

**Recomendación, y no la elijo yo solo:** hacerlo, pero **el último**, y sabiendo
que se compra cobertura y no cifra. Si el director quiere recortar, **ésta es la
pasada que se cae**, y la tanda baja de 70 a 40 sin perder el hallazgo del tope.

---

## 10 · LO QUE PUEDE CORTAR CADA PASADA ANTES DE QUE MIDA

De las once compuertas censadas el 15/09, tres cobran antes de cortar. Con este
montaje:

| Compuerta | Riesgo hoy | Qué hacer |
|---|---|---|
| **veto por hash** (en el worker, tras cobrar los 30) | ⚠️ **el único vivo**: `SAT-B` no puede tener el mismo contenido que `SAT-A`, que sí estará indexado | por eso son dos documentos y no uno |
| candado de análisis (cobra y luego veta) | bajo: nadie más analiza | no lanzar dos pasadas a la vez |
| 400 de texto corto | nulo: ~27.000 caracteres | — |
| `ref` caducada a las 2 h | medio en A2: el modal abierto mucho rato | subir `SAT-B` y analizar seguido |

---

## 11 · FICHA PREVISTA, **NO ESCRITA**

**`B.241 — el exhaustivo cobra seis veces por hacer lo mismo cuando el corpus es
pequeño`.**

> ⚠️ **ESTE ENUNCIADO QUEDÓ FALSADO AL DÍA SIGUIENTE, Y EL TÍTULO SE CONSERVA
> TACHADO A PROPÓSITO.** Ni «lo mismo» ni «seis veces»: ver el punto 3 de las dos
> objeciones del director, más abajo. Lo que sobrevive es otra cosa —**el tope de
> 25 no se ha ejercido nunca**— y con una población que se cuenta con SQL en vez de
> afirmarse.

Quedaba **prevista y sin escribir**, a propósito: sólo teníamos el argumento de
lectura —el exhaustivo cambia el umbral 0,50→0,45 y el tope 6→25, y con pocos
candidatos ninguno de los dos hace nada—, y un argumento de lectura no es una
medida. Su condición de nacimiento, escrita antes para que no se pueda ajustar
después:

> **Nace si el rápido y el exhaustivo de `SAT-A` dan el MISMO número de
> seleccionados**, o si el exhaustivo de `SAT-B` da los mismos hallazgos que su
> rápido. **No nace** si el exhaustivo selecciona más, o si encuentra algo que el
> rápido no encontró.

⚠️ **Y esa condición también queda retirada**: daba por comparables el rápido y el
exhaustivo desde la bandeja, y el tope de 3 dice que no lo son.

---

**Nada lanzado. Cero documentos marcados. Ningún crédito gastado.**

---

# LAS DOS OBJECIONES DEL DIRECTOR, MEDIDAS (16/09/2026) — y el montaje de arriba queda ANULADO

Sólo lectura. Nada lanzado, ningún crédito.

## 1 · ⚠️ EL TOPE EXISTE, Y NO ES 10: SON DOS TOPES, Y UNO ES **3**

El director recordaba un tope de 10 en la bandeja. **Hay tope, y su recuerdo se
queda corto por el lado malo.** Son dos, y contestan a preguntas distintas —que es
exactamente la distinción que pedía el encargo:

| Tope | Fichero:línea | Qué limita | ¿Se aplica? |
|---|---|---|---|
| `MAX_SELECTION = 20` | `hooks/review/useReviewList.ts:6` | cuántos documentos se pueden **marcar en la lista** | sí: `useReviewList.ts:114,136,152` no dejan pasar de 20 |
| `MAX_EXHAUSTIVE_SELECTION = 3` | `components/review/ReviewSelectionBar.tsx:19` | cuántos admite el **exhaustivo** | sí: `canAnalyzeExhaustive` (`:111`) se apaga con `selectedCount > 3` |

**Y la respuesta a «¿afecta a `batchDocumentIds` o sólo al número de análisis?»:
a los dos, porque son el mismo número.**

    hooks/review/useReviewAnalysis.ts:126
    const batchDocumentIds = documents.filter(d => d.id !== doc.id).map(d => d.id);

`documents` es la selección que se le pasa al bucle. **La tanda que participa es la
selección menos el que se analiza.** No hay una lista de participantes separada de
la lista de analizados: limitar cuántos se analizan limita cuántos participan.

El servidor **no** pone tope (`app/api/analyze-v2/route.ts:184` sólo comprueba que
sea un array de cadenas). Los dos topes son decisiones de pantalla.

### ⚠️ El montaje de arriba se cae, y no por poco

Pedía **seleccionar doce** para que participaran como candidatos. Con el exhaustivo
en 3, **`batchDocumentIds` tiene como mucho 2**. El paso 4 del orden de gestos es
irrealizable tal y como está escrito.

### ⚠️ Y LO QUE SALE DE PASO ES PEOR QUE EL MONTAJE: LAS DOS PUERTAS NO SON COMPARABLES

Desde la bandeja, el **rápido** puede llevar hasta **19 compañeros** en la tanda y
el **exhaustivo** como mucho **2**. No es que el exhaustivo mire más y el rápido
menos: **miran corpus distintos**, y el que mira menos es el caro.

Comparar «lo que encontró el rápido» con «lo que encontró el exhaustivo» desde la
bandeja **no compara los dos modos**: compara dos corpus. Y el sesgo va en la
dirección que nadie sospecha — a favor del barato.

**No es una limitación del montaje: es una propiedad del producto, y no está
escrita en ningún sitio.** Va a ficha como **B.242**.

### Replanteo, en una línea

Con este tope, **la única forma de que el exhaustivo vea más de dos compañeros es
que los compañeros estén `analizado`** — o sea, la vía de pertenencia, o sea las
marcas irreversibles. La bandeja ya no es la puerta barata que parecía ayer.
**Antes de replantear nada se mide el punto 2, que puede hacer innecesario el
montaje entero.**

---

## 2 · PREGUNTARLE AL ÍNDICE — se puede, no existe, y cuesta CERO créditos

El arquitecto tiene razón en las dos mitades: preguntárselo al director era raro, y
la información está en Pinecone sin abrir un solo documento.

### ⚠️ HOY NO HAY NADA QUE EJECUTAR

No existe endpoint ni script que lo haga. Los diez de `app/api/admin/` son otra
cosa —`duplicates` agrupa por `content_hash` exacto, `diagnose-vectors` compara
estado contra metadata—, y los cuatro de `scripts/` son verificadores locales.
**Lo digo en negativo a propósito: la pieza no está, y dar por existente lo que
sólo está propuesto es el corolario de F-106.**

### Lo que SÍ está — las cuatro piezas, con línea

| Pieza | Fichero:línea | Para qué |
|---|---|---|
| `listVectorIdsByPrefix(orgId, docId)` | `lib/pinecone/vectors.ts:273` | enumera **todos** los ids de vector de un documento, paginando |
| `fetchVectors(orgId, ids)` | `lib/pinecone/vectors.ts:230` | los baja **con `values: number[]`** — el vector ya calculado |
| `queryVectors(orgId, {vector, topK, filter?})` | `lib/pinecone/vectors.ts:128` | consulta por similitud; **`filter` es opcional** (`:139`) |
| `soloGeneracionActiva(...)` | `lib/analysis/generacion-activa.ts:50` | descarta los vectores de generaciones muertas |

**Que `fetchVectors` devuelva `values` es lo que hace esto gratis**: los vectores ya
están calculados y pagados. No hay que volver a embeber, no interviene ningún
modelo, y no se toca `consumeCredits`. **Son lecturas de Pinecone y nada más.**

### Qué devolvería

Una fila por documento:

| Campo | Qué es |
|---|---|
| `documento` | nombre e id |
| `vecinos` | **cuántos OTROS documentos tienen al menos un trozo a ≥ 0,50** |
| `vecinos_045` | lo mismo con el umbral del exhaustivo — la diferencia entre las dos columnas **es exactamente lo que el exhaustivo compra**, y se sabe sin gastar 30 créditos |
| `score_max` | el parecido más alto que tiene con alguien |
| `lista` | los vecinos, por nombre, con su score |

Ordenado por `vecinos` descendente, **la primera fila es la respuesta a «¿qué
documento de tu corpus toca a más documentos?»**.

### Las dos cosas que hay que acertar, o mide otra cosa

1. ⚠️ **Se consulta SIN filtro de corpus.** `CORPUS_ACTIVO` sólo ve `analizado`, y
   hoy casi los 42 son `pendiente`: con filtro, el censo daría ceros y parecería un
   resultado. Es un cero sin control positivo, de los que esta casa ya ha contado.
2. ⚠️ **La generación se PREGUNTA, no se recalcula.** `listVectorIdsByPrefix`
   devuelve todas las generaciones; el censo llama a `soloGeneracionActiva` —la que
   ya usa el retrieval— en vez de derivarlo por su cuenta. Dos implementaciones del
   mismo criterio se separan y nadie se entera.

### Forma y presupuesto

Un `GET /api/admin/vecindario`, con la misma guarda que `duplicates`
(`org.role === 'admin'`), `export const maxDuration = 300` como los otros cuatro
que ya lo declaran, y **una respuesta JSON que el director abre en el navegador con
su sesión puesta** — que es como ya usa `app/api/admin/cleanup/page.tsx`.

**El volumen no lo invento.** Sale de `sum(chunk_count)` sobre los 42 documentos, y
está en `SQL_A2A4_compuerta.sql`. Si la suma pasa de unas 1.500 consultas, el
endpoint va por documento en vez de de golpe; con 300 s de presupuesto, eso se
decide con el número delante y no antes.

### ⚠️ Y el arquitecto tiene razón en que vale más que la tanda

Esto no es sólo el selector del montaje —aunque lo es, y bueno: **el documento con
más vecinos es el sujeto natural de A2/A4, real en vez de fabricado**—. Es una
pregunta que el producto debería contestar y hoy no contesta: *«¿qué documento de
los míos toca a más documentos?»*. Y contesta gratis otra que llevamos dos días
rodeando: **cuántos vecinos gana el corpus al bajar el umbral de 0,50 a 0,45**, que
es la mitad del exhaustivo que nadie ha medido nunca.

Va a ficha como **B.243**.

---

## 3 · B.241 — NACE, PERO NO COMO ESTABA ENUNCIADA: LA PREMISA ESTÁ FALSADA POR ESTE MISMO FICHERO

El encargo dice que B.241 puede nacer ya, *«si el exhaustivo hace lo mismo que el
rápido por seis veces el precio»*. **Las dos mitades de esa frase son falsas, y la
corrección lleva escrita aquí desde el 31/08** — en la línea 889 de este fichero,
corrigiéndome a mí:

> **«⚠️ EL EXHAUSTIVO SÍ HIZO ALGO QUE EL RÁPIDO NO — me equivoqué.»**

**Con línea de código, no de recuerdo:**

- `lib/analysis/pipeline.ts:1156` llama a `analyzeStyle`, y está dentro de
  `runExhaustivePipelineInner` (`:1139`–`:1441`).
- `runAnalysisPipeline` (`:1104`–`:1132`), que es el rápido, **no la llama**.

**El exhaustivo trae el análisis de estilo; el rápido no.** En aquella pasada
fueron 15 problemas de estilo y 9 segundos de modelo.

**Y el precio tampoco es 30 contra 5**, porque el precio variable devuelve: medido,
**25 netos contra 7** (5 del rápido + 2 del estilo por tarifa), y en otra pasada
**20 netos**. Es **tres veces**, no seis.

### ⚠️ Dos frases mías quedan corregidas

1. En el montaje de arriba escribí *«hace el mismo trabajo por 6× el precio»*.
   **Falso por las dos mitades**, y lo falsa una corrección que yo mismo había
   escrito hace dos semanas en el mismo fichero. Queda anotado donde estaba.
2. **`B.127` se cita tres veces aquí —líneas 870, 897 y 1054— y NO EXISTE como
   ficha en ningún sitio.** `grep -rn "B\.127" claude/` devuelve sólo esas tres
   citas. Es el corolario de F-106 en su forma pura: una propuesta que nadie
   escribió, leída como ficha archivada porque lleva número.

### Lo que SÍ sobrevive, y es lo que se escribe

No «el exhaustivo hace lo mismo». Esto:

> **EL TOPE DE 25 DEL EXHAUSTIVO NO SE HA EJERCIDO NUNCA.** Con el umbral donde
> está, este corpus no ha producido jamás más de 2 candidatos, así que el
> parámetro que separa al exhaustivo del rápido en la selección **no ha llegado a
> aplicarse ni una vez**. Lo que el exhaustivo entrega de más hoy es el estilo —que
> se puede comprar suelto por 2 créditos— y las pasadas extra del double-check.

⚠️ **Y su población no se afirma: se cuenta.** Decir «nunca» sobre todas las
pasadas es un universal, y los universales de esta casa llevan comando. El comando
existe y es barato, porque los dos contadores están persistidos:

    select analysis_type,
           count(*)                                                              as pasadas,
           max((pipeline_counters ->> 'seleccion.candidatos_recuperados')::int)   as max_recuperados,
           max((pipeline_counters ->> 'seleccion.candidatos_seleccionados')::int) as max_seleccionados
    from analysis_results
    where org_id = '<ORG_ID>' and pipeline_counters is not null
    group by analysis_type;

**Si `max_seleccionados` del exhaustivo es menor que 7, el tope de 25 no ha mordido
nunca y B.241 queda con población, no con memoria.** Si alguna pasada llegó a 7 o
más, la ficha nace falsada el mismo día y se dice.

Esa consulta está en `SQL_A2A4_compuerta.sql`, y **es la que se ejecuta primero**:
cuesta cero y decide si B.241 tiene fundamento antes de que nadie fabrique nada.

---

## EN QUÉ QUEDA EL PLAN

| Orden | Qué | Coste | Por qué antes que lo siguiente |
|---|---|---|---|
| 1 | La consulta de población de B.241 | 0 | decide si la ficha tiene base |
| 2 | El censo de vecindario (hay que escribirlo) | 0 créditos | dice si existe un documento real que toque a muchos — y si existe, **no hace falta fabricar SAT-A** |
| 3 | Sólo si 2 dice que no hay ninguno: fabricar `SAT-A` | 0 | y declarado como control de saturación |
| 4 | La tanda, replanteada con el tope de 3 delante | por decidir | no antes de 1 y 2 |

**Y si al final hay que fabricar, la conclusión queda acotada desde ahora, como
pedía el encargo: mediría que el exhaustivo funciona CUANDO HAY CANDIDATOS. No
mediría que en el corpus del director los haya — eso lo contesta el paso 2, y lo
contesta mejor.**

**Nada lanzado.**
